# Fixture E 单文档口径复核（口径污染修正）

> Feature 09 · Task 1 的追加复核
> 触发：用户指出 v2 资格审查引用了 **fixture 之外的证据**（F15 `verification.md` + 实现代码），
> 而 candidate map 只能从 `F13-F16-runbook.md` **一篇**生成 —— 资格阶段的信息比建模阶段更多，会污染 Phase 2b。

---

## 0. 结论

```text
E = QUALIFIED（单文档口径）
证据更正：原先引用的外部证据全部撤回，改用文档自身的 L418
```

**同时新增一条口径规则**（已写入 `../README.md` §3.6）：

> 资格审查**只能使用 fixture 自身可证的信息**。不得引用 supporting 文档或实现代码补足缺失语义。

---

## 1. 原判据为什么不合格（口径问题）

v2 时我用三层证据证明 bounded failure：

```text
F13-F16-runbook.md  +  F15 verification.md  +  cloudfunctions/.../index.js
```

其中真正把边界钉成「5 次 → final: failed」的是**后两层**。但：

```text
资格阶段：看了 A + B + code    → QUALIFIED
建模阶段：只能看 A             → 边界未知
```

这正是用户指出的污染。更严重的是：**用实现代码补文档语义，等于把 `document claim` 与 `source-verified fact` 混起来** —— 那是未来的 **Source Verification** 问题，不是当前的 **Document Modeling** 问题。这与项目一直坚持的 Current / Target / Evidence 区分是同一条原则。

---

## 2. 单篇文档的逐项复核

### 2.1 ❌ 不能用于资格的（来自 fixture 之外）

| 证据 | 位置 | 处置 |
|---|---|---|
| 「重试超过 **5 次** → 写 `refundCompensationFailed = true`」 | `F15-.../verification.md` L27 | **撤回**，不得用于资格 |
| 「失败累加重试次数」 | 同上 L26 | **撤回** |
| `MAX_RETRY_COUNT` / `retryCount >= MAX_RETRY_COUNT` → `final: failed` | `cloudfunctions/retryAfterSalesCompensation/index.js` | **撤回**（尤其：**代码不得补文档语义**） |

### 2.2 ⚠️ 文档内存在但**边界未定义**的（不足以单独支撑）

| 证据 | 位置 | 为什么不够 |
|---|---|---|
| 「`refundCompensationRetryCount=0`」 | L310 | 只暴露**计数器字段**与初值，**没有上限值** |
| 「重试日志（成功 + 失败 + **超过上限**）」 | L356 | 提到了「上限」这一概念，但**上限是多少未定义** |
| 全文检索 `重试 + 数值` / `MAX_RETRY` / `N 次` | — | **无命中**：文档内没有任何补偿重试次数上限的数值 |

> 若证据只到这一步，应判 `bounded failure = UNCLEAR`（并按用户给的**选项 A**：继续找候选）。

### 2.3 ✅ **文档自身可证**的有界失败规则（**这才是合格证据**）

> **`F13-F16-runbook.md` L418**
>
> ```text
> - [ ] 连续 10 次查单失败置 `REFUND_FAILED`
> ```

| v2 要求 | 本文档内的满足情况 |
|---|---|
| 至少一种有界等待 / 有界失败规则 | ✅ **`max polling count` + `explicit abort state`** —— `refundQueryCron` 查单「连续 10 次失败」即中止 |
| **该规则必须有明确边界** | ✅ **边界 = 10 次**，就写在文档里 |
| 对照判据「最多重试 N 次，之后进入 X」 | ✅ 正是此形态：**10 次 → `REFUND_FAILED`** |

**配套的后续动作也全在文档内：**

| 证据 | 位置 | 作用 |
|---|---|---|
| 「失败场景：`refundCompensationError` 字段被写入，订单状态保持 `REFUND_PENDING / APPROVED`」 | L354 | 失败状态明确 |
| 「详情页红条 + 强制补偿按钮」 | L355 | 面向人的失败信号 |
| **§4.8 强制补偿**：`forceRestockAndAssets`「期望：**仅管理员可调用**；只补资产不改 `afterSalesStatus`」 | L316–325 | **人工处置路径** |
| 「`retryAfterSalesCompensation` `failed` 递增 → 检查 `products / coupons / users` 数据」 | L475（故障排查表） | 人介入的排查动作 |

**→ 单文档口径下，`bounded waiting / bounded failure` = PASS。**

---

## 3. 与 v1 的关系（顺带澄清一件事）

v1 判 E 缺 `timeout` 时，我说过「无任何超时语义」。**那句话仍然成立**（文档内确实没有 timeout/deadline/TTL）。

但 v2 把判据从「时间型 timeout」改为「**有明确边界**的等待 / 失败规则」之后，L418 这条 **max polling count + abort state** 就落在新判据内了。

也就是说：**E 从 QUALIFIED 到「疑似不合格」再回到 QUALIFIED，中间变化的是我引用的证据，不是标准。**

---

## 4. 修正后的 E 资格结论（逐条）

| v2 条件 | 判定 | 单文档证据 |
|---|---|---|
| trigger | ✅ | §3.2 触发器配置（`*/10`、`*/5` cron）· §3.3 refundNotify 网关 |
| preconditions | ✅ | §2「前置：本地代码与构建」 |
| step-by-step | ✅ | §3.1 部署顺序 · §7.2 切换步骤 · §4.2–4.3 编号步骤 |
| branching | ✅ | L352 优惠券恢复分支 · L453 mock 分支判定 · L474 20% CLOSED 分支 |
| retry | ✅ | §4.7 失败重试验证 · `retryAfterSalesCompensation` |
| **bounded waiting / failure** | ✅ | **L418「连续 10 次查单失败置 `REFUND_FAILED`」** + L354/355/§4.8 |
| rollback | ✅ | §4.4 撤销申请 · §4.8 强制补偿 |
| escalation | ✅ | §6 独立审查 Checklist · §10「Reviewer 决策项（必看）」 |
| observability | ✅ | §5 证据留存规范 · 5.5 安全审计 · §8 故障排查速查 |
| completion | ✅ | L331「每个 Feature `passing` 前需留存…」+ §6 勾选项 |
| decision points | ✅ | §10 决策项（两种风险 + 默认推荐 + 决策记录栏） |
| 路径·正常 / 异常 / 人工介入 | ✅ / ✅ / ✅ | §4.2–4.3 / §4.4·4.7·4.8·§8 / §5·§6·§10 |

**→ E = QUALIFIED（11/11 + 3/3，全部由该文档自身可证）**

---

## 5. 这条纪律值得长期保留

> **资格审查与建模必须使用同一信息面。**
> 如果资格判断能看到 fixture 之外的材料（supporting docs、实现代码、其它 feature 的 verification），
> 那么"QUALIFIED"这个结论对建模阶段就是无效的 —— 因为建模阶段看不到那些材料。
>
> 更具体地：
>
> - **supporting 文档**：可以构成 fixture bundle，但那需要**在标准里显式定义**（并承认引入了新变量）
> - **实现代码**：**绝不可**用于补文档语义 —— 那属于 Source Verification，不属于 Document Modeling

这与 `docs/framework-map-contract.md` 里那条「文档没说前置关系就不要串成链」是同一类纪律：
**不要把"文档之外的东西"当成"文档说的东西"。**
