# Feature 09: Contract Adversarial Test（Phase 2b）

> **位置**：流程上位于 **Feature 06 之后、Feature 07 之前**。
> `09` 只是创建顺序编号，不代表它排在 07 / 08 之后。
> **Feature 07（生成链路）在本 feature 通过之前不应开始。**

---

## 1. 这个 feature 只回答一个问题

> **F06 的 schema + check-map，面对两种此前没覆盖的技术文档，会不会误判、漏判，或者逼迫错误建模？**

它**不是**：

```text
❌ 继续设计 Feature 03
❌ 开始 AI 自动生成
❌ 验证 AI generation quality
```

范围刻意收得很窄。**先冻结"怎么攻击 F06、什么结果算 Contract 有问题"，再去挑文档** —— 否则容易变成"根据 fixture 改考题"。

---

## 2. 四个观察类别

| # | 类别 | 判据 | 出现什么才算问题 |
|---|---|---|---|
| 1 | **Semantic gap** | 六类 element 里**真的**装不下的东西 | 需要第 7 类才表达得了（**先用 §11.1.1 的决策树分类，不要直接扩 ontology**） |
| 2 | **Relation gap** | 8 个 relation 是否**继续大量**产生无法准确表达的关系 | `relationGap` 数量显著高于 A/B/C（3 篇合计 3 处）；或出现多条同类重复缺口 |
| 3 | **Capacity gap** | 12 的 preferred budget 在 ER-heavy / runbook 上是否明显不合理 | 在**没有硬塞**的前提下远超 12；或为压到 12 而必须牺牲决定性内容 |
| 4 | **Validator FP / FN** | 正确图是否被判错；明显错误的图是否反而通过 | Hard Error 误报（正确图被拦）；或 mutation 未被拦住（见 §5） |

### topology 单独观察

```text
可以记录：D / E 各自的实际拓扑（链 / 分叉 / 网状 / 星形 / 无主轴）
但不能：把 topology mismatch 自动升级成 contract failure
```

理由：R8 已经确认拓扑随文档类型变化；"长得不像主轴"本身不是缺陷。

---

## 3. Fixture D / E 选择标准

> **本节保留 v1（已冻结并执行）与 v2（现行）两个版本，不覆盖历史。**
> 修订理由见 §3.3。

### 3.0 两个 Fixture 的攻击目标（所有 qualification 条件都必须服务这两句话）

```text
Fixture D  攻击「Framework Map 是否能表达没有天然主轴的多实体关系网络」
Fixture E  攻击「Framework Map 是否能表达带正常、异常、人工介入及有界失败策略的操作过程」
```

写这两句是为了防止**代理指标篡夺测试目标** ——

```text
为了测 ER      → 最后变成测「文档里有没有 N:M」        ❌
为了测 Runbook → 最后变成测「文档里有没有 timeout」    ❌
```

### 3.1 Selection Criteria v1（**已冻结并执行；保留为历史**）

| Fixture | v1 标准 |
|---|---|
| **D** | 多个核心实体 · **1:1 / 1:N / N:M 三种关系各至少出现一次** · 字段丰富 · ownership/reference · lifecycle · schema evolution · 跨实体 invariant · 最好没有天然单一处理主轴 |
| **E** | 11 要素（trigger / preconditions / step-by-step / branching / retry / **timeout** / rollback / escalation / observability / completion criteria / operator decision points）· 最好含正常 / 异常 / 人工介入三条路径 |

**v1 执行结果：**

```text
D  NO QUALIFIED FIXTURE      最好候选 6/7，缺 N:M
   → results/fixture-selection-d.md
E  NO QUALIFIED FIXTURE      最好候选 10/11，缺 timeout
   → results/fixture-selection-e.md
```

### 3.2 Selection Criteria v2（**现行**）

#### Fixture D — 真正的多实体关系网络

**必须满足（全部）：**

- [ ] **多个独立实体**（不是"一个对象一堆字段"）
- [ ] **多条明确的跨实体关系**
- [ ] **至少覆盖两种不同的 cardinality / ownership 模式**
      （例如 功能性「at most one / exactly one / unique」+ 多重性「1:N / list」）
- [ ] **至少一条不能简单解释为父子 containment 的跨实体关系**
      （例如 reference / summarize / 聚合约束 / 跨实体不变量）
- [ ] **文档整体不得主要由单一数据处理 pipeline 组织**
- [ ] 字段 / 属性丰富
- [ ] ownership / reference
- [ ] 至少一种 lifecycle
- [ ] schema evolution / migration
- [ ] 至少一个跨实体 invariant

**不再要求**：文档里出现 `N:M` / `多对多` 之类的记号。
**N:M 仍是很好的加分信号，但不再是资格 Gate。**

> 这样真正攻击的是：**entity network + cross-entity semantics + lifecycle + evolution + invariants + no natural processing axis**，
> 而不是"文档里有没有 N:M"。

#### Fixture E — 操作过程（含**有界失败策略**）

11 要素中的 `timeout` **升级为 `bounded waiting / bounded failure`**：

- [ ] 至少出现**一种**有界等待 / 有界失败规则：
      `timeout` · `deadline` · `TTL / lease expiry` · `max retry count` ·
      `max polling count` · `circuit-break condition` · `explicit abort threshold` ·
      或其它**有明确边界**的等待 / 失败规则
- [ ] **该规则必须有明确边界**

```text
「失败后重试」                              ❌ 不够（无边界）
「最多重试 5 次，之后进入人工处置」          ✅ 够（有界 + 有后续）
「lease 到期未续则视为失败并由他人接管」     ✅ 够
```

其余 10 要素（trigger / preconditions / step-by-step / branching / retry / rollback /
escalation / observability / completion criteria / operator decision points）**保持不变**；
正常 / 异常 / 人工介入三条路径仍是"最好包含"。

> 这样仍然攻击 **process / state / constraint / branch / failure handling**，
> 而不拘泥于"必须出现时间型 timeout"。

### 3.3 修订理由（revision rationale）

```text
v1 使用了过于具体的代理现象（proxy phenomena）。
全语料资格审查显示：这些代理条件本身阻碍了对底层 contract 属性的测试。
```

**不是**"看完候选后降低难度"，而是**把测试条件从具体实现现象提升回真正要攻击的能力**：

```text
D 缺的是一种特定 cardinality          → v2 改为"多实体关系网络 + 非 containment 关系"
E 缺的是一种特定 bounded-failure 表达 → v2 改为"有界等待 / 有界失败策略"
```

支撑证据（v1 执行结果）：

```text
D：1262 篇中，含 N:M 类记号的文档 = 0
E：3666 篇中，同时满足 11 要素的文档 = 0
两个 near-miss 各自只差一条，且都差在"代理指标"那一条上
```

**修订纪律**：v1 与其 `NO QUALIFIED FIXTURE` 结果 **原样保留**（§3.1），不做覆盖式改写；
v2 是**新增**，并标注修订理由。

### 3.4 ⚠️ 本轮候选池已被观察过（必须声明）

Phase 2b v2 **在同一批候选池上重跑**。因此：

> **v2 是 engineering validation，不再宣称具有完全独立的 fixture selection。**

正确流程仍然是（**不允许跳过任何一步**）：

```text
冻结 §3 v2
   ↓
重新扫描同一候选池
   ↓
重新逐项判定（每条落到原文小节）
   ↓
重新排序候选
   ↓
选择 D / E
   ↓
才开始 candidate map
```

**不能**直接宣布"tempo = D、F13-F16 = E"，**即使我们猜得到它们很可能是强候选**。
以后若需要更强的证据，再加一个**外部 holdout fixture**。

### 3.5 挑选纪律（不变）

- 两篇**都必须由用户提供**，执行方不得自行编写（本轮为本地材料筛选中选，需用户确认）
- 选定后先把**选择依据逐条对照 §3.2 打勾**，再开始建模
- 若某条硬要求找不到文档满足，**记录缺口**，不要降低标准去凑

---

## 4. 执行流程

```text
Fixture D / E 原文
      ↓
执行代理依据现行 F03 / F06 Contract 生成 candidate map JSON
      ↓
framework-map.schema.json
      ↓
scripts/check-map.js
      ↓
人工审计 validator 的判断是否合理
```

**关于 candidate map 的定位（必须说清楚）：**

- 它**不是 Gold**，**不要求画得漂亮**
- 它**只是用于攻击 Contract 的被测对象**
- 它**不是**"AI prompt → 自动生成 framework-map"的验证 —— 那属于 Feature 07
- 因此本 feature **不得**顺带评价"AI 生成质量"

D / E 仍然沿用 B / C 的 provisional 粒度：**`section (provisional)`**，并且**不得**与 A 的 sourceUnit 粒度混算。

---

## 5. Mutation / Adversarial 环节

现在 A / B / C 只证明了**正确产物没有被大量误报**。本 feature 还要证明：**错误产物确实会被拦住。**

对每篇的**正确 candidate map** 之外，再人工构造 mutation：

| # | Mutation | 期望 severity | 期望 code |
|---|---|---|---|
| M1 | 删除某个 element 的 provenance | **HARD** | H2 |
| M2 | 把某个 element 的 type 改成第 7 类 | **HARD** | H1 |
| M3 | 把某条 edge 的 relation 改成表外词 | **HARD** | H4 |
| M4 | 制造 dangling reference（edge 端点 / attachment 目标 / topic 的 blockId） | **HARD** | H3 |
| M5 | 塞一个既无 edge 也无 attachment 的孤立 element | **HARD** | H7 |
| M6 | 删除某个 Topic 的导航入口（blockIds / sectionRefs 清空） | **HARD** | H5 N1（或 N2 若因此产生 orphan） |
| M7 | 把两个**没有依赖关系**的节点强行串起来 | **不是** validator 能判的 | 见下 |

**M7 的特殊处理：** "强行串链"是**语义错误**，schema 与 check-map **判不出来**（拓扑本身合法）。因此：

```text
M7 不作为 validator 的测试项
M7 作为「人工审计项」：检查审计者能否仅凭 map + 原文发现这条错误的链
```

> 这条正好对应 `docs/framework-map-contract.md` §6 —— **契约里写明它属于 semantic rule，不是 schema rule。**

**每篇 mutation 数量建议 5~7 个，覆盖上表；记录实际 severity 与期望是否一致。**

---

## 6. Gate

**Gate 有三种形态，不是简单的 PASS / FAIL：**

```text
PASS         两篇 Fixture 都合格并完成对抗测试；四条通过条件全部满足
PARTIAL PASS Fixture E completed; ER-heavy contract coverage pending qualified Fixture D.
BLOCKED      没有可用的 Fixture（**当前状态**，见 results/fixture-selection-{d,e}.md）
```

**通过条件（四条同时成立）：**

```text
1. Semantic gap = 0（六类仍然够用；若不为 0，必须先按 §11.1.1 分类）
2. Relation gap 可控（没有出现大量同类重复缺口；relationGap 仍是"少量特例"）
3. Capacity 只是 heuristic 问题（没有出现"不硬塞就表达不了"的情况）
4. Validator 无明显误报 —— 正确图 HARD 0；mutation 全部被拦住
```

满足则：

> **Framework Map Contract 足够稳定，可以进入真正的 AI generation prompt / 自动化阶段（Feature 07）。**

**不满足时，分别处理（不要一律降级 validator）：**

| 现象 | 处理 |
|---|---|
| 正确图被判 HARD | 先怀疑 **validator 太死** → 修 validator（并补单元测试） |
| mutation 未被拦住 | **validator 太松** → 补检查 |
| 需要第 7 类才能表达 | 按 §11.1.1 分类：只有 Semantic gap 才谈扩 ontology |
| 12 明显不够（无硬塞） | 把 `preferred element budget` 的讨论正式提上日程（依据实测，不是猜） |

---

## 7. 对 F06 三个细节的既有裁决

| 项 | 裁决 | 说明 |
|---|---|---|
| **H7 孤立元素** | **保持 HARD** | 一个 L0 element 既没有 edge 也没有 attachment，它存在于 Framework Map 上的理由基本不成立。Phase 2b 若 ER-heavy 真出现**合法**孤立元素，再降级不迟 |
| **W4 单 Block Topic** | **保持 Warning**（本次作为**统计项**） | 已在 Fixture B 命中一次且明显合法（那是个"问题动机"Topic）。**若 D / E 又出现多个自然的 single-block Topic，则后续应改为 W4 → INFO**，但现在不提前改 |
| **W0 输出状态** | ✅ **已修正** | 原文小节解析失败时会跳过引用 / N2 / N3。原先只出 W0，`coverage` 会显示 `0/0`，容易被误读成"验证通过"。现在输出区分：<br>`状态: PASS` vs `状态: PASS WITH INCOMPLETE VALIDATION`，并列出 `SKIPPED` 段。Phase 2b 专门验证这一点 |

---

## 8. 明确不做

- ❌ 不继续设计 Feature 03（规格不再改；要改也只走 §11.1.1 的分类流程）
- ❌ 不开始 AI 自动生成，不评价生成质量
- ❌ 不新增第 7 类 element、不新增 relation 词
- ❌ 不把 `12` 写成 `maxItems`
- ❌ 不因为 topology 与预期不同就判 contract failure
- ❌ 不修改 Fixture D / E 原文的任何字节
- ❌ 不把 section 粒度与 sourceUnit 粒度混算
- ❌ 不为了让 mutation 通过而降低 schema / validator 的严格度

## 9. 状态

- **创建时间**：2026-09-26
- **前置**：F06 完成（schema + check-map + 21 个单元测试可用）
- **配套文档**：`execution-prompt.md` · `validation-checklist.md`

### Task 1（资格审查）

**v1（§3.1 冻结标准）执行结果 —— 原样保留：**

```text
D  NO QUALIFIED FIXTURE      最好候选 6/7，缺 N:M        → results/fixture-selection-d.md
E  NO QUALIFIED FIXTURE      最好候选 10/11，缺 timeout  → results/fixture-selection-e.md
```

**标准修订 → §3.2 v2**（理由见 §3.3）：把测试条件从**具体实现现象**提升回**真正要攻击的能力**。

**v2 完整重跑结果（同一候选池，重新扫描 / 重新判定 / 重新排序）：**

```text
D  QUALIFIED   uni-app/tempo/docs/architecture/goal-plan-task-state-model.md
E  QUALIFIED   uni-app/YUSHI/docs/harness/features/individual_feature/F13-F16-runbook.md
                → results/fixture-selection-v2.md
```

- D：v2 硬门槛通过 14 篇，**第 1 名分数 153 是第 2 名（74）的两倍以上**；挑战者逐一回原文判定，全是决策记录 / 数据流型设计笔记
- E：`bounded failure` 证据充分 —— 「**重试超过 5 次** → `refundCompensationFailed = true`」（F15 `verification.md` L27）+ 实现层 `MAX_RETRY_COUNT` + runbook §4.8「**仅管理员**可调用」的强制补偿

> ⚠️ **声明**：候选池在 v1 阶段已被观察过 → v2 是 **engineering validation**，
> **不宣称具有完全独立的 fixture selection**（§3.4）。将来若需更强证据，另加**外部 holdout fixture**。

### 当前 Gate

```text
待用户确认 D / E → 进入 Task 2（生成 candidate map）
```

（`BLOCKED` 已解除；但**尚未**开始建模 —— 按 §3.5，选定后需先由用户确认并登记 SHA256。）

### 留到下一轮（Phase 2c / Feature 09 v2）再讨论的问题

- 本轮已把"代理指标"与"测试目标"分开（§3.0 的两句话）。下一轮可继续追问：
  多实体关系网络的**难度分级**（几种 cardinality 才算够难？），以及 runbook 的**有界失败形态**是否需要更细的分类（retry-bound vs lease-expiry vs circuit-break）。

### 本轮方法学案例（建议长期保留）

> **Selection criteria can fail because the corpus does not contain the phenomenon being tested.**
> This is not evidence that the criterion is wrong,
> and it is not permission to relax the criterion post hoc.

以及它的**正确收尾方式**：

> 当全语料证据显示标准掺入了**过于具体的代理现象**时，应当
> **显式升级标准版本（保留旧版与旧结果 + 写明修订理由）并完整重跑**，
> 而**不是**在看过候选之后悄悄放宽。
