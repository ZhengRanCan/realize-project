# 成本实验：`reasoning_effort` high → low（F10 · 优化实验，**不是 Gate 修复**）

> 实验条件（按用户裁决冻结）：
> - 同一 fixture（E）· 同一 prompt（A `f94e6c00da1e` / B `8c3f0be2f676`）· 同一模型 `deepseek-flash` · `temperature 1` · `max_attempts 1`
> - **两侧 ceiling 完全相同**：`max_tokens_a = 65536` · `max_tokens_b = 131072`
> - **唯一变量**：`reasoning_effort`（high = 不发送 → provider 默认；low = 显式发送 `"low"`）
> - ✅ 端点**接受** `reasoning_effort`（未返回 400）

| 臂 | Stage A | Stage B |
|---|---|---|
| high（基线） | `run-04`（95 条） | `run-08`（复用 run-04 inventory，mtB 131072） |
| low | `run-09`（51 条） | `run-10`（复用 run-09 inventory） |

---

## 1. 成本：**大幅下降**

| 阶段 | effort | prompt | completion | reasoning | reasoning 占比 |
|---|---|---|---|---|---|
| Stage A | high | 11108 | **29812** | 20706 | 69% |
| Stage A | **low** | 11108 | **6027** | 1508 | 25% |
| Stage B | high | 18837 | **69436** | 58283 | 84% |
| Stage B | **low** | 14246 | **26840** | 20125 | 75% |

```text
Stage A  completion 29812 → 6027   （省 80%）· reasoning 20706 → 1508（省 93%）
Stage B  completion 69436 → 26840  （省 61%）· reasoning 58283 → 20125（省 65%）
```

> Stage A 的收益特别大：reasoning 从 69% 降到 25% —— 说明 high 模式下这个模型在"读文档抽语义"上花了大量可省的思考。

---

## 2. Stage A · mechanism anchor recall：**5/5 全保留**

| anchor | high（95 条） | low（51 条） |
|---|---|---|
| bounded failure | ✅ | ✅ |
| abnormal path | ✅ | ✅ |
| manual intervention | ✅ | ✅ |
| privilege boundary | ✅ | ✅ |
| invariant | ✅ | ✅ |

```text
items：95 → 51（-46%），但 **5 个 anchor 一个没丢**
```

**即：low 砍掉的 46% 至少在 anchor 层面是"啰嗦"而不是"机制"。**
⚠️ 但 anchor 是我的关键词代理；那 44 条非 anchor 条目里有没有别的机制，
需要 Phase 3 的人工 inventory 审计确认（本轮不下结论）。

---

## 3. Stage B · 压缩质量：**主体保住，类型保真度下降**

| 指标 | high（run-08，输入 95 条） | low（run-10，输入 51 条） |
|---|---|---|
| elements | **12** | **12** |
| edges / attachments / topics | 8 / 5 / 9 | 7 / 5 / 11 |
| validator | HARD 0 · WARN 0 | HARD 0 · WARN 1 |
| represented / topic-only / omitted | 84 / 5 / 6 | 48 / 1 / 2 |
| targets · 1:1 · max fan-in | 16 · 19% · 14 | 13 · 23% · 9 |
| 5 个机制 anchor 在 map 里 | **5/5** | **5/5** |
| constraint label 精确性 | 很细（"订单所有者校验 / admin_whitelist / forceRestockAndAssets 仅管理员 / 非 REQUESTED 一律拒绝"） | 稍紧凑但仍明确（"越权拒绝 / 撤销不回补 / 补偿幂等 / 10 次失败上限 / 仅管理员强制补偿"） |

### ⚠️ 但发现一处**结构分辨率退化**：`state` 元素消失

| run | 臂 | elements | type 分布 | `state` |
|---|---|---|---|---|
| run-05 | high | 13 | process 7 · **state 1** · artifact 1 · concept 1 · constraint 3 | ✅ 售后单状态 |
| run-06 | high | 13 | process 5 · artifact 1 · concept 2 · constraint 4 · **state 1** | ✅ 售后链路状态迁移 |
| run-08 | high | 12 | process 4 · artifact 3 · **state 1** · concept 1 · constraint 3 | ✅ 售后单状态机 afterSalesStatus |
| **run-10** | **low** | 12 | concept 2 · process 5 · artifact 2 · constraint 3 | ❌ **无** |

```text
high 三次 run 都有售后状态机作为 **state 元素**；low 这一次没有。
另外 low 把「F13→F14→F15→F16」标成 concept（high 里是 artifact「云函数集」+ 独立 state）。
```

**这正是 F07 已经暴露过的弱项（`type: state` 容易缺失）在 low effort 下重新出现。**
不是 F10 新引入的问题，但说明**类型保真度对 effort 敏感**。

---

## 4. 结论与建议

```text
成本              ✅ 大幅下降（A 省 80% / B 省 61%）
Stage A recall    ✅ 5/5 anchor 保留（-46% 条目，疑似去啰嗦）
Stage B 压缩      ✅ 12 elements · 5/5 anchor · fan-in 相当 · constraint 仍明确
Stage B 类型保真   ⚠️ 本次丢了 state 元素（high 3/3 有 → low 0/1）
```

**建议：把 low 记为"候选成本优化"，暂不设为默认。**

```text
① cost 已被证明 —— 这一步目标达成；
② 但 `state` 消失是单样本观察。要决定是否采用 low，需要再补 1–2 次 low 样本：
   若 low 稳定丢 state → 这是"成本换类型保真度"的明确取舍，由用户决定；
   若只是采样噪声 → low 可以直接采用（省 61–80% 且机制无损）。
③ 不建议现在把 low 写进默认：F10 的语义结论都建立在 high 之上，
   换默认会让"冻结条件"与既有 12 个 run 不可比。
```

### 附：本轮需要人工审计的一处（来自 run-08）

```text
run-meta.integrity 的 audit 提示：
  S-40 被 omitted，但语义疑似属于「不可以砍」五类：
  「F14 证据必须包含管理员工作台入口、待审 Tab 列表字段、同意与拒绝操作前后、
    拒绝原因弹窗校验、退货退款全状态推进截图、audit_logs 审计记录」
→ 这是 high 臂上的一个疑似 E2/规则违反，Phase 3 人工审计时必须核。
```
