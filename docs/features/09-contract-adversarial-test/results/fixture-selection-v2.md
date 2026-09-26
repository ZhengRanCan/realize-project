# Fixture D / E 资格审查 v2（完整重跑）

> Feature 09 · Task 1（**v2 重跑**）
> 标准：`../README.md` §3.2（v2）；v1 与其结果原样保留在 §3.1
> 攻击目标（所有条件都服务这两句）：
>
> ```text
> D  攻击「Framework Map 是否能表达没有天然主轴的多实体关系网络」
> E  攻击「Framework Map 是否能表达带正常、异常、人工介入及有界失败策略的操作过程」
> ```

---

## 0. 结果

```text
D  QUALIFIED   uni-app/tempo/docs/architecture/goal-plan-task-state-model.md
E  QUALIFIED   uni-app/YUSHI/docs/harness/features/individual_feature/F13-F16-runbook.md
```

两者都在**同一候选池**上按 §3.2 重新扫描、重新逐项判定、重新排序后选出。
**没有跳过任何一步，也没有直接沿用 v1 的近失候选作为结论**（见 §1 的重排与 §3 的声明）。

> ⚠️ **声明**：本轮候选池在 v1 阶段已被观察过，因此 v2 是 **engineering validation**，
> **不再宣称具有完全独立的 fixture selection**（README §3.4）。

---

## 1. Fixture D 重跑

### 1.1 重新扫描（v2 硬门槛）

口径（v2，不再要求 N:M 记号）：

```text
entitySections ≥ 3        多个独立实体（逐实体小节）
functionalCard ≥ 1        at most one / exactly one / only one / unique
multiCard      ≥ 1        1:N / [] / multiple
nonContainment ≥ 2        reference / summarize / must not exceed / derived / invariant
lifecycle      ≥ 1        状态机 / lifecycle / status =
migration      ≥ 1        migration direction / 迁移 / legacy boundary
invariant      ≥ 1        不变量 / at most one / 不得 …
```

扫描 1771 篇（与 v1 同一批根目录），**通过 v2 硬门槛 14 篇**，按综合分排序：

| # | 文件 | 分数 | 实体小节 | 功能基数 | 多重性 | 非containment | lifecycle | migration | 步骤密度 |
|---|---|---|---|---|---|---|---|---|---|
| **1** | **`uni-app/tempo/.../goal-plan-task-state-model.md`** | **153** | 11 | 8 | 39 | 33 | 12 | 5 | **1%** |
| 2 | `dsh/.../2026-08-09-client-conversation-node-assembly.md` | 74 | 4 | 9 | 1 | 22 | 21 | 1 | 8% |
| 3 | `dsh/.../2026-08-23-client-derived-tool-presentation.zh.md` | 62 | 8 | 2 | 2 | 24 | 8 | 2 | 3% |
| 4 | `dsh/.../2026-08-18-session-history-and-event-transport.md` | 48 | 4 | 3 | 6 | 2 | 16 | 1 | 0% |
| 5 | `dsh/.../2026-08-02-typert-remote-method-calls.md` | 45 | 5 | 3 | 2 | 4 | 5 | 1 | 0% |
| 6 | `dsh/.../2026-07-12-scoped-layers-store.md` | 43 | 4 | 1 | 2 | 9 | 7 | 1 | 0% |
| 7 | `dsh/.../2026-07-19-gui-layering-and-rpc-protocol.zh.md` | 40 | 3 | 5 | 3 | 10 | 2 | 6 | 1% |
| 8 | `dsh/.../2026-07-24-domain-kv-storage-and-workspace.md` | 38 | 3 | 6 | 4 | 11 | 1 | 2 | 4% |

**第 1 名的分数是第 2 名的 2 倍以上**，且排序不是靠单一项：它在 7 个信号里 6 个居首。

### 1.2 挑战者的原文判定（不只看分数）

| 候选 | 结构 | 判定 |
|---|---|---|
| `client-conversation-node-assembly.md` | `Problem / Decision / Three input-window paths / How built-in businesses use Definitions / View Builder…` | ❌ **是 Agent Note 决策记录**，围绕**一个子系统的实现路径**；不是"多个独立实体"的领域模型 |
| `client-derived-tool-presentation.zh.md` | `Problem / Decision / 术语 / 架构与所有权 / **数据流** / Host 端设计 / Client card-model 设计…` | ❌ 核心是**"从原始事件派生展示"的数据流** → 命中 v2 的排除项「文档整体不得主要由单一数据处理 pipeline 组织」 |
| `session-history-and-event-transport.md` | `Problem / Decision / Alternatives / Verification / Consequences` | ❌ 纯决策记录 |
| `domain-kv-storage-and-workspace.md` | `Problem / Proposal / dsh-storage…` | ❌ 存储能力 seam 提案（v1 已判 REJECT，v2 下仍不构成实体网络） |

**结论：只有 tempo 那份是真正的多实体领域模型契约。**

### 1.3 逐条件证据（v2）

| v2 条件 | 判定 | 原文证据 |
|---|---|---|
| 多个独立实体 | ✅ | L37–61「Model layers」：`Goal` / `UserProfile` / `PlanBundle`（├ `Plan` ├ `Stage[]` └ `Task[]`）/ `DailyReview[]` / `TodayTaskSelection[]` / `DailyReviewPromptDismissal[]` / `PlanChangeSummary[]`；另有 11 个逐实体小节（L168 / L269 / L296 / L315 / L407 / L470 / L584…） |
| 多条明确的跨实体关系 | ✅ | L262 `Goal → Plan`（多版本 · 至多一个 active）· L43–44 `PlanBundle → Stage[]/Task[]` · L395 `Task → Stage` · L588 `FocusSession → Goal/Plan/Task` · L605 `DailyReview → TaskResult` |
| **≥2 种 cardinality / ownership 模式** | ✅ | **功能性**：L262「at most one active plan」· L588「exactly one Goal/Plan/Task」· L605「only one DailyReview per Goal/date」· L643 / L708「at most one」；**多重性**：L262「multiple historical Plan versions」· L605「many Task results」· `Stage[]` / `Task[]` |
| **≥1 条非 containment 的跨实体关系** | ✅ | **L553「The total task minutes for one day must not exceed the plan's `dailyAvailableMinutes`」**（跨实体聚合约束，不是父子包含）· L605「DailyReview may **reference or summarize** the Task results recorded for that date」（引用/汇总）· L745 `retainedTaskIds`（跨 Plan 版本引用未被静默丢弃的任务） |
| **不得主要由单一处理 pipeline 组织** | ✅ | 步骤密度 **1%**；主体是「Model layers + 逐实体契约」；`Initial planning flow` / `Replanning flow` 两节是模型的派生视图，不是文档主轴 |
| 字段 / 属性丰富 | ✅ | L244「Field intent:」· L284 类型声明 · L548–553 字段级约束（`Task.id` 稳定 / `estimatedMinutes` 正整数） |
| ownership / reference | ✅ | L255–258「belongs to `UserProfile` / `DailyReview` / `Plan`」· L588「belongs to exactly one」 |
| lifecycle | ✅ | L177 `GoalStatus = 'draft' \| 'active' \| 'completed' \| 'archived' \| 'cancelled'` · L588 `FocusSession` 状态机 `running → paused → running → completed`（`cancelled` 终态） |
| schema evolution / migration | ✅ | L803「## Migration direction」（6 步）· L751「DailyPlan legacy boundary」· L683 兼容字段 · L816–841 Historical notes（F16/F39/F41/F56/F58） |
| 跨实体 invariant | ✅ | L553（聚合上限）· L395（Task 落在所属 Stage 区间内）· L742（同一 fingerprint 至多一个 summary，重复重试返回既有 receipt） |

**→ D = QUALIFIED**

---

## 2. Fixture E 重跑

### 2.1 v2 的关键改动：`timeout` → **bounded waiting / bounded failure**

v1 时本候选唯一 FAIL 的就是 `timeout`。v2 要求改为"**有明确边界**的等待 / 失败规则"，且必须是**有界 + 有后续**。

### 2.2 有界失败证据 ⚠️ **已按 §3.6 单文档口径更正**

> **更正记录**：本节初版引用了 `F15-.../verification.md` 与实现代码 `MAX_RETRY_COUNT` 作为边界证据。
> 那违反 §3.6（资格与建模必须使用同一信息面；**代码不得补文档语义**）。
> **那些外部证据已全部撤回**，改用 fixture **自身**可证的规则。
> 完整复核见 `fixture-e-single-document-reverification.md`。

**✅ 合格证据（全部来自 `F13-F16-runbook.md` 自身）：**

| 证据 | 位置 | 满足什么 |
|---|---|---|
| **「连续 10 次查单失败置 `REFUND_FAILED`」** | **L418** | **有界失败规则 + 明确边界（10 次）+ 明确中止状态** —— 即 `max polling count` + `explicit abort state` |
| 「失败场景：`refundCompensationError` 被写入，订单状态保持 `REFUND_PENDING / APPROVED`」 | L354 | 失败状态明确 |
| 「详情页红条 + 强制补偿按钮」 | L355 | 面向人的失败信号 |
| §4.8「强制补偿」`forceRestockAndAssets`：「**仅管理员可调用**」 | L316–325 | **人工处置路径** |
| 「`retryAfterSalesCompensation` `failed` 递增 → 检查 `products / coupons / users`」 | L475 | 人介入的排查动作 |

对照 v2 的判据：

```text
「失败后重试」                        ❌ 不够（无边界）
「连续 10 次失败 → 置 REFUND_FAILED」  ✅ 够（有界 + 明确中止状态）
```

**❌ 已撤回、不得用于资格的（来自 fixture 之外）：**

| 证据 | 位置 | 撤回原因 |
|---|---|---|
| 「重试超过 **5 次** → `refundCompensationFailed = true`」 | `F15-.../verification.md` L27 | 属 supporting 文档（§3 未允许 bundle） |
| `MAX_RETRY_COUNT` / `retryCount >= MAX_RETRY_COUNT` | `cloudfunctions/retryAfterSalesCompensation/index.js` | **代码不得补文档语义**（属 Source Verification） |

> 顺带说明：文档内**确实没有**时间型 `timeout`/`deadline`（v1 的判定仍成立）。
> E 之所以在 v2 下合格，是因为判据从「时间型 timeout」改成了「**有明确边界**的等待 / 失败规则」，
> 而 L418 正落在新判据内 —— **变化的是证据引用，不是标准。**

### 2.3 11 要素 + 3 路径（v2 口径）

| 要素 | 判定 | 证据 |
|---|---|---|
| trigger | ✅ | §3.2 触发器配置（`*/10`、`*/5` cron）· §3.3 F16 退款回调网关 |
| preconditions | ✅ | §2「前置：本地代码与构建」（`node --check` / npm 构建 / `.gitignore`） |
| step-by-step | ✅ | §3.1 部署顺序 · §7.2 切换步骤 · §4.2–4.3 全链路编号步骤 |
| branching | ✅ | L352 优惠券恢复分支 · L453 mock 分支判定 · L474 20% CLOSED 分支 |
| retry | ✅ | §4.7 失败重试验证 · `retryAfterSalesCompensation` · L356 |
| **bounded failure（替代 timeout）** | ✅ | 见 §2.2 |
| rollback | ✅ | §4.4 撤销申请 · §4.8 强制补偿 |
| escalation | ✅ | §6 独立审查 Checklist · §10「Reviewer 决策项（必看）」 |
| observability | ✅ | §5 证据留存规范 · 5.5 安全审计 · §8 故障排查速查 |
| completion | ✅ | L331「每个 Feature `passing` **前**需留存…」+ §6 审查勾选项 |
| decision points | ✅ | §10「决策项：未发货仅退款库存释放时机」（两种风险 + 默认推荐 + 决策记录栏） |
| 路径·正常 | ✅ | §4.2 用例 1 · §4.3 用例 2 · §7.3 切换后回归 |
| 路径·异常 | ✅ | §4.4 越权 · §4.7 失败重试 · §4.8 强制补偿 · §8 故障排查速查 |
| 路径·人工介入 | ✅ | §5 人工取证 · §6 独立审查 · §10 Reviewer 决策项 |

**→ E = QUALIFIED（11/11 + 3/3）**

其余 E 候选在新口径下的状况：`DEPLOYMENT-CHECKLIST.md` 缺 completion（10/11）；`adding-a-tool.zh.md` 缺 completion 且无路径（cookbook，非手册）；其余 ≤9/11。**排序未变，本候选仍居首。**

---

## 3. 本次重跑的性质声明（必须随结果一起读）

```text
✅ 已做：冻结 §3 v2 → 同一候选池重新扫描 → 逐项重新判定（每条落到原文小节/行号）
        → 重新排序 → 选出 D / E
❌ 未做：直接宣布 v1 的近失候选为结论
```

但由于**候选池在 v1 阶段已被观察过**：

> **Phase 2b v2 是 engineering validation，不宣称具有完全独立的 fixture selection。**
> 若将来需要更强证据，应增加一个**外部 holdout fixture**。

这一点不因为"重新扫描过一遍"而消失 —— 重新扫描能消除"直接沿用结论"的问题，但消除不了"池子已被看过"。

---

## 4. 下一步（Task 2）

待用户**确认这两篇**（含 SHA256 登记）之后，才进入：

```text
把 D / E 复制进 测试文档/ 并登记来源与 SHA256
   ↓
依现行 F03 / F06 Contract 生成 candidate map（**不是 Gold**）
   ↓
schema + check-map
   ↓
mutation / adversarial test（M1~M7）
   ↓
四个观察类别 + Gate
```

**在此之前不生成任何 candidate map。**
