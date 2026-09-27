# E · Stage-B 复现分析（F10 · 同一份 95 条 Inventory 跑 3 次 Stage B）

> 变量控制：**Stage A 只有一次**（`run-04`，95 条，已冻结）；
> `run-05 / run-06 / run-07` 是**同一份 inventory + 同一 Stage B prompt + 同一模型/参数**的三次独立 Stage B。
> 目的：确认"81 → 13"这个压缩是不是**可复现的选择行为**，而不是一次漂亮的偶然。

---

## 1. 五项对照（用户指定的判据）

| 维度 | run-05 | run-06 | 判定 |
|---|---|---|---|
| **① element count** | **13** | **13** | ✅ 完全复现（对照：E5 失败样本是 81） |
| **② fan-in** | 19 targets · 1:1 占 32% · max fan-in 14 | **15 targets · 1:1 占 13% · max fan-in 17** | ✅ 都明显汇聚，run-06 更集中 |
| **③ 四个 anchor** | bounded failure ✅ · abnormal ✅ · manual/privilege ✅ · invariant ✅ | 同 **4/4** | ✅ 稳定 |
| **④ 拓扑分辨率**（正常 / 自动重试 / 人工介入是否被压成一个节点） | 三类都保留，承载于 `E-03 · E-07 · C-01 · C-03` | 三类都保留，承载于 `E-03 · E-11 · E-12` | ✅ **没有压过头**：正常/重试/人工介入在图上各有落点 |
| **⑤ E3 / E4**（藏进 label / 模糊 constraint 名） | 3 条 constraint，label 都是**明确规则** | **4 条** constraint，label 更明确 | ✅ 未见用模糊命名代替规则 |

**run-06 的 constraint label 反而比 run-05 更明确：**

```text
run-05  C-01 边界与安全约束（权限 / 输入校验 / 密钥不外泄 / 与支付域隔离）
        C-02 补偿口径不变量（幂等 / 资产回补 / 失败落库）
        C-03 定时触发与查单阈值（10 分钟重试 / 5 分钟查单 / 80% 命中 / 连续 10 次失败上限）

run-06  · 与 F01 支付域的边界（独立 refundCommon / 不改支付核心文件 / 独立 WECHAT_REFUND_* 配置）
        · 运行与验证约束（受限终端构建 · 定时触发器 cron · mock 来源 · 重试成功率与失败上限）
        · **权限与幂等不变量（非所有者/非管理员拒绝 · 仅管理员强制补偿 · 并发只补偿一次 · 重复提交不产生重复记录）**
        · 敏感信息安全不变量（.gitignore 条目 · git grep 无凭据 · 日志无 KEY/PRIVATE · WECHAT_REFUND_* 仅控制台设置）
```

> ⭐ **run-06 明确写出了「仅管理员强制补偿」** —— 这正好补掉了 `run-05` 的一个保留项
> （那里 manual intervention 只以 `forceRestock` + 边 label「强制补偿验证」出现，
> "仅管理员"被聚合进 C-01 的「权限」二字）。**跨样本看，该 anchor 是稳的、且有一个样本是显式的。**

---

## 2. 结论：**E5 repair 具有初步稳定性**（满足用户设定的 stop condition 的"通过"侧）

```text
run-05  13 elements · 4/4 anchors · 1:1 32% · 分辨率保留
run-06  13 elements · 4/4 anchors · 1:1 13% · 分辨率保留
        ↑ 两两一致，且节点命名/分组不同（符合"哪怕分组不同也算稳定"）
```

- **没有重新膨胀**（13 → 13，不是 13 → 48）。
- **anchor 没有不稳定**（4/4 → 4/4）。
- **没有压过头**：正常 / 自动重试 / 人工介入三类在三张图的**不同结构**上都有落点
  （run-05 靠 `E-03/E-07/C-01/C-03`，run-06 靠 `E-03/E-11/E-12`）。
- **E5 判据修正已生效**：本轮完全按"fan-in + core element count + 结构分辨率"评判，
  `represented` 比例（87/95 · 93/95）只作辅证 —— 它升高并不代表 E5，因为 target 数在减少而 fan-in 在增大。

---

## 3. ⚠️ 但暴露了第三个预算问题：**Stage B 在 E 上会超过 65536**

```text
run-07（第三次 Stage B）
  finish_reason = length
  completion    = 65536（顶格）
  **reasoning   = 61261**              ← 光"思考"就吃掉 93% 的预算
  raw 长度      = 10664（写完了 map 的一部分 + topics 写到 T-09… 就被砍）
  → 第二个分隔符 <<<MAP_SELECTION>>> 永不会出现
```

**即：Stage B 的失败不是"不会选择"，而是 reasoning 波动导致预算偶发不够。**

| run | Stage B reasoning | 结果 |
|---|---|---|
| run-05 | 45706 | ✅ 完成 |
| run-06 | （见 run-meta） | ✅ 完成 |
| run-07 | **61261** | ❌ 截断 |

**处置：把 Stage B 的输出天花板抬到 131072**（模型上限是 393216，远未触及）。
这**不是**新的行为变量 —— 它只是解除一个已被证实会 bind 的硬上限（65536 时被砍）。
`reasoning_effort` 仍然**不动**（③ 依旧暂缓，保持 F07/F10 一直使用的 provider 默认 high）。

> `run-07` 永久保留为**预算不足的截断样本**（与 run-04 的"12288 全被 reasoning 吃光"同一族）。

---

## 4. 下一步（按用户既定流程）

```text
✅ 稳定？ → Yes（13 / 13 · 4/4 anchors · 分辨率保留）
   ↓
D × 1 完整两阶段回归（Stage A + Stage B，天花板 131072）
   ↓
不退化？（entity recall 保持 · invented relation 减少 · 方向错减少 · 不变啰嗦）
   ↓
reasoning_effort: high → low 的成本实验（仍是唯一变量比较）
```
