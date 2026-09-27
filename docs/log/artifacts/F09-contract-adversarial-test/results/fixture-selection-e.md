# Fixture E 资格审查（冻结标准下的逐条件证据矩阵）

> Feature 09 · Task 1（只做资格审查：**不建模、不改 Contract、不改 ontology/relation**）
> 冻结标准见 `../README.md` §3.2。标准在挑文档**之前**已提交。

---

## 0. 结论

```text
E = NO QUALIFIED FIXTURE under the frozen Phase 2b selection criteria
```

**最接近的一份命中 10/11 要素 + 3/3 路径，唯一缺的是 `timeout`。**

⚠️ **但 E 的标准措辞存在一处真实歧义，见 §4。** 本节结论按**严格读法**（11 条全部强制，与 D 对称）给出。

---

## 1. 汇总矩阵（11 要素 + 3 路径）

口径：统一判据、扫描 5 个根目录共 **3666 篇** markdown。`缺` 一栏列出该候选未命中的强制要素。

| Candidate | 组数 | 路径 | 缺 | 结论 |
|---|---|---|---|---|
| **`uni-app/YUSHI/docs/harness/features/individual_feature/F13-F16-runbook.md`** | **10/11** | **3/3** | **`timeout`** | **REJECT（近失）** |
| `uni-app/YUSHI/docs/harness/DEPLOYMENT-CHECKLIST.md` | 10/11 | 1/3 | `completion` | REJECT |
| `deepseek-harness-master/docs/cookbook/adding-a-tool.zh.md` | 10/11 | 0/3 | `completion` | REJECT（是 cookbook，不是 runbook） |
| `uni-app/YUSHI/docs/progress.md` | 9/11 | 3/3 | `preconditions`, `branching` | REJECT |
| `classroom/docs/harness/FUSION/09-candidate-inbox-driven-profile-pipeline.md` | 9/11 | 2/3 | `escalation`, `completion` | REJECT（**且它已经是 Fixture C**） |
| `uni-app/YUSHI/.../F16-wechat-refund-api-integration/verification.md` | 9/11 | 2/3 | `steps`, `completion` | REJECT |
| `deepseek-harness-master/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.zh.md` | 9/11 | 1/3 | `preconditions`, `completion` | REJECT |
| `deepseek-harness-master/.agents/notes/archived/feature/2026-07-07-plan-mode.zh.md` | 9/11 | 0/3 | `rollback`, `completion` | REJECT |

**没有候选同时满足全部 11 条。**

---

## 2. 唯一近失候选：`F13-F16-runbook.md`（22.8KB · 572 行）

标题即《F13–F16 售后链路运行验证 & 部署手册》——**这是全盘最接近"纯 Operational Runbook"的文档**。

| 要素 | 判定 | 原文证据 |
|---|---|---|
| trigger | ✅ | §3.2「触发器配置」表（L109–114）：`retryAfterSalesCompensation` 定时触发器 `*/10 * * * *`、`refundQueryCron` `*/5 * * * *`；§3.3 HTTP 网关路由（F16 退款回调，L118） |
| preconditions | ✅ | **§2「前置：本地代码与构建」**（L29）：2.1 `node --check` 全部云函数 / 2.2 npm 构建 / 2.3 `.gitignore` 确认 |
| step-by-step | ✅ | §3 部署（3.1 云函数部署顺序 L84）、§7.2「切换步骤」（L450）、§4.2/4.3 全链路用例的编号步骤（L211 等） |
| branching | ✅ | L352「已过期 / 有效优惠券的恢复**分支**」· L453「确认 `refundOrder` 在真实模式下**不进入** `mockRefundApply` 分支」· L474「命中 20% CLOSED 分支」 |
| retry | ✅ | §4.7「失败重试验证」（L301）· `retryAfterSalesCompensation`（L41/L94）· §5.2「重试日志（成功 + 失败 + **超过上限**）」（L356） |
| **timeout** | ❌ | **全文无 `超时 / timeout / 时限 / deadline` 语义。** 只有 cron **轮询间隔**（每 10 / 5 分钟）与**重试上限**；这二者都不是超时策略。见 §3 的核实记录 |
| rollback | ✅ | §4.4「用例 3：**撤销**申请 + 越权」（L237）· §4.8「强制**补偿**」（L316）· L244「撤销后库存/优惠券/积分不应发生变化」 |
| escalation | ✅ | L249「沙箱 mock **通知**调用方式」· §6「独立审查 Checklist」· §10「Reviewer **决策项**（必看）」（L516）—— 交付给人的决策路径 |
| observability | ✅ | **§5「证据留存规范」**（L329）：每个 Feature `passing` 前需留存截图/日志 · 5.5 安全审计（L368）· §8 故障排查速查 |
| completion | ✅ | L331「每个 Feature `passing` **前**需留存以下截图 / 日志」· §6 各 Feature 的审查 Checklist 勾选项 |
| decision points | ✅ | **§10「决策项：未发货仅退款库存释放时机」**（L489）：现状对照表 / 两种实现的风险 / **Reviewer 决策项（必看）** / 默认推荐 / 决策记录填写栏 |

**三条路径（"最好包含"）：3/3 ✅**

| 路径 | 证据 |
|---|---|
| 正常路径 | §4.2 用例 1「未发货仅退款全链路」（L197）· §4.3 用例 2「已发货退货退款全链路」（L216）· §7.3 切换后回归（L461） |
| 异常路径 | §4.4「撤销申请 + 越权」（L237）· §4.7「失败重试验证」（L301）· §4.8「强制补偿」（L316）· §8「故障排查速查」（L468） |
| 人工介入路径 | §5 证据留存（人工取证）· §6「独立审查 Checklist」· §10「Reviewer 决策项（必看）」 |

**结论：REJECT** —— 因 `timeout` 一条不满足。

---

## 3. `timeout` 缺失的核实记录（避免"grep 没命中"当结论）

按"最终资格判断必须回到原文上下文"，逐类检索了 timeout 的**替代表达**：

```text
超时 / 时限 / 等待 / 上限 / 最多 / 次数 / 分钟 / 小时 / 秒 / 过期 / 超期 / 间隔 / 退避 / 放弃 / stillProcessing
```

结果：

| 命中 | 位置 | 它是不是 timeout |
|---|---|---|
| `*/10 * * * *`「每 10 分钟」 | L113 | ❌ **轮询间隔**（多频繁触发），不是"等多久就放弃" |
| `*/5 * * * *`「每 5 分钟」 | L114 | ❌ 同上 |
| 「重试日志（成功 + 失败 + **超过上限**）」 | L356 | ❌ **重试上限**（次数），不是时间上限 |
| 「`refundQueryCron` 一直 `stillProcessing` 递增」→「多触发几次，预期 80% SUCCESS」 | L474 | ⚠️ 这是**查单纠偏**思路，最接近"有界等待"，但它写在「故障排查速查」表里，**没有 timeout 策略、阈值或语义** |

**判定：`timeout` = FAIL（不是 UNCLEAR）。** 文档里**没有任何超时/时限/deadline 语义**。

---

## 4. ⚠️ E 的标准存在一处真实歧义（需你裁决）

你在原始指令里，**D 与 E 的措辞强度不同**：

| | 你的原话 | 我冻结成 |
|---|---|---|
| D | 「我会**要求至少具有**：多个核心实体 / 1:1 / 1:N / N:M / …」 | §3.1 的 7 条 = **强制** |
| E | 「**尽量接近**：incident trigger / preconditions / …」+「**最好包含**：正常·异常·人工介入路径」 | §3.2 的 11 条 = ？；3 条路径 = **最好** |

**本文件 §0 的结论按严格读法（11 条全部强制）给出**，因为：

1. 你的总则第 5 条写着「所有强制条件都 PASS 才能入选」；
2. 与 D 的判定保持对称 —— 否则会变成"对 D 严格、对 E 宽松"；
3. 一旦按"尽量接近"放宽，就等于**在看过候选之后修改考题**，正是你明确要避免的。

**如果**你的本意是"这 11 条是尽量接近的画像、不是强制项"，那么：

> `F13-F16-runbook.md` 是现有材料里**最好的一份**（10/11 + 3/3 路径），且它缺失的 `timeout` **恰好削弱了 E 本来要攻击的东西** —— E 的使命之一是打 `process / state / constraint` 的边界，而没有超时语义的 runbook，天然缺少"有界等待 → 升级"这一类状态与约束。

两种情形都要走和 D 一样的处理：**记录为标准修订 + 在同一批候选上重跑完整流程**，不沿用本次结论。

---

## 5. 一个方法学发现：关键词画像无法区分"流程设计文档"与"运行手册"

| 文档 | E 画像命中 | 它实际是什么 |
|---|---|---|
| `F13-F16-runbook.md` | 10/11 | 真的运行手册 |
| **`09-candidate-inbox-driven-profile-pipeline.md`（已是 Fixture C）** | **9/11** | **流水线设计文档**，不是手册 |

**已经用过的 Fixture C 在 E 的画像上也能拿 9/11。** 这说明：

> 冻结的 11 项是**要素画像**，不是**判别器**。
> 用它做粗筛可以，但**最终资格判断必须读原文结构** —— 本次每一条判定都落到了具体小节与行号。

这与 D 那次「`persistence-catalog.md` 字段命中只有 1」是同一类教训的两面：**grep 命中多寡既会漏判，也会过判。**

---

## 6. 两条冻结标准各自只差一项

| | 最好候选 | 命中 | 缺的那一项 |
|---|---|---|---|
| **D** | `uni-app/tempo/.../goal-plan-task-state-model.md` | 6/7 | **N:M** |
| **E** | `uni-app/YUSHI/.../F13-F16-runbook.md` | 10/11 | **timeout** |

**两处缺口恰好都是各自清单里"最容易缺失"的那一条**（N:M 是关系基数里最少见的；timeout 是运维要素里最常被省略的）。

这**提示**标准可能略高于现有语料的现实水平 —— 但这属于**下一轮实验设计**要讨论的问题（见 §7），**不是现在修改已冻结标准的理由**。

---

## 7. 方法学案例（建议长期保留）

> **Selection criteria can fail because the corpus does not contain the phenomenon being tested.**
> This is not evidence that the criterion is wrong,
> and it is not permission to relax the criterion post hoc.

本轮是这句话的两次独立实例：

```text
D：1262 篇中，含 N:M 类记号的文档 = 0
E：3666 篇中，同时满足 11 要素的文档 = 0
```

它和前面几轮避免 fixture overfitting 是**同一条纪律**：结论必须与证据范围严格一致，标准必须在看到候选之前定好。

---

## 8. 下一轮（Feature 09 v2 / Phase 2c）可以重新讨论的两条标准

**留到这轮 Phase 2b 结束之后再谈，不回头改这一轮。**

1. **N:M 到底是不是要点？**
   你的判断（我认同）：真正危险的不是"某张 schema 恰好有没有 many-to-many"，而是
   ```text
   多个平级实体 + 多方向关系 + ownership/reference + 生命周期 + 跨实体 invariant + 没有天然 processing pipeline
   ```
   也就是 —— **"Framework Map 会不会又被错误地画成一条链？"**
   → 下一版 qualification criterion 应写得更语义化，而不是数关系记号。

2. **`timeout` 是否应作为 E 的强制项？**
   若 E 的使命是打 `process / state / constraint` 边界与**升级路径**，那么真正必要的是"**有界等待 → 升级**"这条链，而不是孤立的 timeout 字段。

---

## 9. 停止点

```text
✅ 只做资格审查              ✅ 未生成 framework-map.json
✅ 未改 F06 Contract         ✅ 未动 ontology / relation
✅ 未降低标准凑候选           ✅ 所有判定都落到具体小节与行号
```

**D 与 E 在冻结标准下均为 NO QUALIFIED FIXTURE ⇒ Phase 2b 无法用本地材料执行。**

Gate 因此不是 `PARTIAL PASS`（那要求 E 完成），而是 **`BLOCKED — no qualified fixture`**，除非：

- 你**外部提供** D / E 文档；或
- 你明确授权修订 §3.1 / §3.2 的某条标准（按 §4 的三步处理：记录修订 + 重跑全流程）。
