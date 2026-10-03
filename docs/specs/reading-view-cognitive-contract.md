# Reading View Cognitive Contract v1（Umbrella）

- **版本**：v1（2026-09-29 冻结）
- **状态**：NORMATIVE —— 本文件是 Reading View 跨层认知契约的 authority 入口
- **本文件的组成文件（单向关系，不是平级 authority）**：

```text
Reading View Cognitive Contract（本文件）
        │  宣布 authority 范围
        │  normative incorporation
        ▼
Reading View Layer Contracts            docs/specs/reading-view-layer-contracts.md
        │  四层各自的 normative 契约（其规范性来自本文件的明确纳入）
        │  rationale only
        ▼
Reading View Cognitive Contract — Evidence Appendix
                                        docs/specs/reading-view-cognitive-contract-evidence.md
```

**只有本文件宣布 authority。** Layer Contracts 与 Evidence Appendix 都不得自称 normative authority。

本文件回答：**不论当前在 L0、L1、L2 还是 L3，有哪些东西绝对不能变？**
每一层"具体回答什么、消费什么、允许怎样降级"由 Layer Contracts 定义。

---

## 1. Scope and Status

### 1.1 Normative scope

本契约在其**下列范围**内为规范性权威：

1. Reading 四层的**跨层** identity 规则、稳定外键与 landing 规则；
2. Reading / Explore 两个投影的关系与 Reading 的正式定义；
3. capability 的认识论状态空间及其可区分编码；
4. 跨层语义不得升级的约束（cross-level invariants）；
5. 与其它文档的 dependency 关系、以及纳入 Layer Contracts 的规范性；
6. 上述各项的机器保障状态记录。

**包含**：`docs/specs/reading-view-layer-contracts.md` —— 本契约明确纳入的
**normative subordinate specification**（L0–L3 四层各自的认知契约）。

**明确不属于本契约范围**（由各自原有文档继续持有权威）：

- Reading 之外的产品需求与范围 → `docs/harness/PRODUCT_SPEC.md`
- 交互与视觉设计（快捷键、面板、样式、可访问性） → `docs/harness/DESIGN.md`
- 受控词汇表（shape catalog、元素 ontology、关系词表）与 **Framework / Navigation / Semantic 三种 coverage 的分离**
  → `docs/specs/shape-catalog.md`、`docs/specs/framework-map-contract.md`
- Overview 区块覆盖标准与「Overview 区块覆盖率」指标 → `docs/specs/overview-coverage.md`
- 模块边界、pipeline 阶段职责、数据归属 → `docs/harness/ARCHITECTURE.md`
- 各 feature 的历史材料与验收记录 → `docs/log/artifacts/**`

本契约**不扩展** `framework-map-contract.md` 定义的 element / relation 词表，也不修改任何 schema。

### 1.2 Authority

本文件是 Reading View L0–L3 认知职责、跨层 identity、capability 状态语义以及
cross-level invariants 的规范性权威。对于上述范围内的重叠或冲突，本文件取代
`docs/log/artifacts/F03-hierarchical-architecture/brief.md` 中既有的 L0–L3 架构描述，
并优先于 `PRODUCT_SPEC.md` 与 `DESIGN.md` 中较早的分层阅读模型或 L0–L3 认知语义描述。
`PRODUCT_SPEC.md`、`DESIGN.md` 与 F03 brief 在本文件范围之外的产品需求、交互设计、
artifact 约束与实现规定仍保持各自原有权威。

> F03 brief 是 Feature 03 的**交付物与历史证据**（F04 / F05 的判据建立在其修订版上），
> 因此**不删除**；其架构描述在本文件范围内被取代。

### 1.3 Change Control

新证据（fixture 反例、实现缺陷、真实数据）进入时，按下列顺序判定，**默认先假设"实现没有遵守本契约"**：

```text
新反例
├── 只说明某条既有 invariant 尚无机器保护
│     → 进 enforcement backlog，本契约不动
├── 证明某条 invariant 与真实 authority 冲突
│     → 重开 v1，修订该条
└── 证明某个 preservation property 本身不足
      → 重开 v1，修订该性质（而非新增条目）
```

第三条是唯一需要重新设计的一类：只有当反例**无法**被"实现没有遵守契约"解释时才升级到这一档。
禁止为每一个实现缺陷新增一条 invariant —— 那会让契约失去抽象性。

其它文档中与本契约范围重叠的**措辞漂移不构成重开 v1 的理由**：§1.2 的 scoped precedence
已解决规范歧义，修正那份散文属文档维护任务。

---

## 2. Core Model

### 2.1 两个正交的投影

```text
Canonical identities / authoritative carriers
              │
      ┌───────┴────────┐
   Reading           Explore
      │                 │
L0 → L1 → L2 → L3    Focus graph
      │
      └── capabilities are attached,
          not allowed to redefine identity
```

- **Reading**：document-centric projection。沿着文档自身的组织结构理解设计。
- **Explore**：entity-centric projection。围绕一个焦点实体展开可遍历的模型关系。

**Explore 不是 L4。** 它是横向切入机制，可从任意 Reading 深度进入。两轴正交；
L0–L3 是 Reading 轴内部的认知深度。

### 2.2 Reading 的定义

> Reading View 是面向设计理解的**解释性投影**。它遵循模型中已有的结构事实，并优先采用
> **可追溯的文档组织顺序**来安排阅读；当模型没有提供主次、因果或主线语义时，**不得**从
> 显示顺序或布局位置推导这些语义。

### 2.3 Canonical semantic identity

每个稳定 identity 必须来自该实体类型的 **authoritative carrier**：

| 实体 | authoritative carrier | Reading landing | 备注 |
|---|---|---|---|
| document（文档身份 / role） | `framework-map.json` | 常驻上下文 | L0 的唯一输入 |
| `E-xx` element | `framework-map.elements[]` | `#element-<id>` | |
| `T-xx` topic | `framework-map.topics[]` | **local DOM anchor** `#topic-<id>`（仅 L0 侧栏内）；**canonical Reading landing = Deferred** | Topic 是 facet，不是 container；`Open in Reading(T-xx)` v1 不可用 |
| `O-xx` block | `overview-plan.blocks[]` | `#block-<id>` | Plan 是 identity / existence authority |
| `SU-xxx` | `overview-plan.sourceUnits[]` | **无 landing** | 稳定 provenance identity ≠ 可寻址 |
| `§N` section | `docs/source-sections.json`（派生产物） | 无 landing | 单文档能力 |
| `DEC- / GAP- / Q- / FACT- / MODEL-xxx` | `design-review.json` | **无 landing** | 有稳定 identity 与外键 |
| Evidence | **无 id** | — | 只能依附父 review object |
| visual fragment | **无 id** | — | 只有 ephemeral render context |

**stable identity / resolvable reference / Reading landing 是三种不同能力**，
任何一层都不得把前两者当作第三者使用。

> **Topic 的四段状态（不留半状态）**：
> `stable identity = yes` · `local DOM anchor = yes`（`#topic-<id>`，仅 L0 侧栏内） ·
> `canonical Reading landing = Deferred` · `Open in Reading(T-xx) = v1 不可用`。
>
> L1 的**认知职责**已定义，但 L1 作为独立 Reading route 尚未实现，
> 因此 Topic 目前没有 canonical landing。未来 L1 route 落地时，把该 capability 从
> Deferred 提升为 Present 即可，**不需要修改 Topic identity**。

### 2.4 四层递进

```text
L0  Document-scoped orientation        「整个设计是什么、怎么连接、有哪些入口？」
L1  Topic-scoped semantic boundary     「这个 concern 涉及谁、怎样接入系统、还能进入哪些已组织内容？」
L2  Block-scoped semantic explanation  「这个解释单元用什么视觉语法表达哪些语义？」
L3  Subject-preserving inspection      「这个表达从哪里来、能核查到哪一步、证据与 review context 是什么？」
```

关键转折：**L0→L1→L2 都在改变阅读 scope；L2→L3 不再改变 subject，而是改变观察方式。**
L3 不产生新的主 identity。

**层的独立性来自 scope transformation，而不是 entity enrichment** ——
即使两层引用完全相同的 `E-xx` 与 edge，只要 scope 不同，认知意义就不同。
因此某一层的能力缺失（如 `blockIds` 不可得）断的是**该层往下**的通路，而不是该层自身存在与否。

> **每一层的七字段契约（回答什么问题 / 锚点对象 / 输入与身份 / 顺序来源 / 下钻去向 /
> 必须保留的上下文 / 允许的降级）见
> [`reading-view-layer-contracts.md`](reading-view-layer-contracts.md)。**
> 本文件**不重复**这些局部契约，只保留上面的总体模型。

---

## 3. Global Disciplines

三组纪律分别防止三类错误。

### 3.1 认识论纪律（防止错误理解模型）

1. 不创造结构语义。
2. 不把视觉权重升级为语义重要度。
3. 不把 unknown 升级为 zero：**未知不得归零，缺失不得解释为空，未生成不得解释为不存在。**
4. 不用字符串近似制造 identity。

`epistemic collapse` 的具体形态（code review 见到即警觉）：
`?? []`、`|| []`、`?? 0`、`|| 0`、`(x || []).length === 0`、`Object.keys(x).length === 0`、
`if (!x) 显示 "0"`、`?? 'normal'`。

### 3.2 投影纪律（防止错误表现模型）

```text
Generation  decides membership
Projection  decides representation
Layout      decides position
Interaction decides disclosure
```

- L2 的 semantic envelope 由 **Plan** 固定，Generated 只能填充 envelope 内的 visual expression。
- Reading 红线：**不得不可逆地省略已经进入该 View 语义集合的信息。**
  判据 = 声明存在 + 有可达路径 + 展开可恢复 + identity 未丢。
  "可见"不是判据；沉默可以是合法 representation，但必须仍有稳定 disclosure 路径。

### 3.3 导航纪律（防止错误定位模型）

```text
identity          != occurrence
Back              != Resolve
canonical landing != canonical context
```

- `Back to Reading` = 恢复 navigation stack 中的 ReadingAddress，**不经过 resolver**。
- `Open in Reading(id)` = 跨投影导航，走 CanonicalReadingResolver。
- `canonical` 只表示"跨投影跳转的稳定落点"，**不表示该实体真正属于哪里**。

### 3.4 顺序三分

```text
结构顺序 = 系统本身怎样连接          （来自 edge）
阅读顺序 = 用户以何次序接触           （来自可追溯的文档组织顺序）
布局顺序 = 语义等价元素的稳定摆放     （renderer 必然需要）
```

后两者不得反向修改第一种。**无可追溯阅读顺序时，仅呈现结构事实**；布局仍可使用稳定的
deterministic tie-breaker，但该排列属于布局顺序，不得获得阅读顺序或结构顺序的含义。

### 3.5 命名空间纪律

`inventory:S-01` 与 `plan:SU-001` 是两个命名空间中的两个引用。在存在显式 bridge 之前，
不得视为同一实体，也不得因文本相似而合并。

### 3.6 状态词汇不得归一（Namespace Rule）

```text
design.status · decision.status · gap.status · openQuestion.category
generation.verdict · evidence.type · claimVerification.status（当前不存在）
```

必须保持命名空间，**不得抽象成一个万能 `status`**。UI 图标也不应让它们在语义上看起来等价：
`PASS_WITH_WARNINGS` 是生成质量，`approved` 是人工 Decision 状态，
`document-claim` 是 evidence level，`reviewed` 是 design lifecycle。
**共享颜色 ≠ 共享状态机。**

### 3.7 术语：verification entry points

`covers` / `sourceUnitIds` / `reviewObjects` 一律称为 **verification entry points**，
不得提前称为 verification。它们只声明"来源"或"关联"，不声明"已核实"。

四层认识论关系不得互相替代：**Traceability / Evidence / Verification / Review-Decision**。

---

## 4. Decisions

Decision A–F 是**跨制品、跨投影的解释规则**，不属于任何单层，因此全部留在本文件。
即使某条 Decision 主要在某一层被使用（如 D 在 L2、B 在 L2），也**不搬进 Layer Contracts**。

### Decision A — Explore Addressability

不把"未进入 edge 关系词表"等同于"无关系语义"。Explore 接受 Schema 明确声明、可确定遍历的
**structural relation**（如 `element.topics` 的 membership）；不接受只有展示附着含义、
没有领域 / 结构关系语义的 attachment。

```text
Explore v1 Focus
├── Element      ✅ semantic edge
├── Topic        ✅ schema-declared membership
├── Constraint   ❌ attachment-only 时不可（可作 annotation）
├── Block        ⚠ 待跨 fixture addressability 成立
├── Decision     ❌ 无跨模型关系键
├── Evidence     ❌ 无跨模型关系键
└── Source Unit  ❌ 首先是 provenance endpoint，不是一等 graph entity
```

Explore 消费"可遍历的模型关系"，不机械消费 `edges[]`：

```text
edges[]          → semantic adjacency
element.topics   → membership adjacency
blockIds         → declared topic↔block adjacency（Block Organization；**不是** containment — 见 N4）
source refs      → provenance adjacency
review refs      → review adjacency
        ↓
Explore Relation Model
```

### Decision B — Canonical Reading Resolution

```text
Entity      E-023                              ← 1 canonical identity
Landing     #element-E-023                     ← 1 canonical Reading landing
Occurrence  E-023 in T-01 / T-05 / O-04 / O-11 ← N contextual occurrences
```

**同样适用于 Block**：`#block-O-xx` 是 canonical landing，Topic occurrence 是 `0..N` 个上下文。
**canonical landing 的存在不依赖 contextual occurrence 的存在。**

### Decision C — Stage Order

`what < how < prove < boundary` 是 Reading 的**规范性语义**，应有独立、可执行的表达
（如 `stageRank(stage)`），**不得**通过 `blocks[]`、`stages[]` 或 ID 排序间接推断。
Plan 数组无须按 stage 排序；同 stage 内没有阅读顺序。

三个层级不得混：`stage` 值域 = executable contract；`stage` 顺序 = normative contract；
`stages[]` 物理顺序 = implementation behavior。

### Decision D — Generation Integrity

`verdict` 是附着于 Block 的独立 **artifact-quality capability**，不参与 Semantic Coverage、
Evidence 或 Block identity。它首先描述 Generated Expression 的可用状态：

```text
GeneratedExpressionState = Unknown | Missing | Present
    if Present → IntegrityVerdict = PASS | PASS_WITH_WARNINGS | FAIL | UNKNOWN
```

`missingBlocks` 是 **Known Missing**，不是外层 Unknown。Reading 默认不突出 PASS；
非 PASS 低强度提示且必须有稳定 disclosure 路径。

#### D.1 Generated Epistemic Assertion 的归属

`flowNode.state` 是**生成侧的语义断言**，不是 presentation label。其归属为：

```text
class                     Generated Epistemic Assertion
authority                 Generated Expression（取值 current / changed / target，由 shape / schema 约束）
provenance scope          Unclassified
Provenance Assurance      Indeterminate
Claim Verification        No carrier / Known Absent
```

**Indeterminate ≠ Unsupported。** 后者声称"我们检查了支持关系，并确定它没有支持"；
实际情况只是"当前 provenance policy 根本没有分类这个字段应该如何获得来源"。
UI 应显示 "Provenance not classified for this field"，而不是 "⚠ No evidence"。

### Decision E — Orphan Block

```text
orphan(block) ⇔ TopicOccurrenceState = Known(0)
```

它是**跨层完整性状态**，不是 Block 类型，也不是 intrinsic identity。不得伪造 Topic、
不得静默删除。正常契约仍要求 `∀ block: occurrences >= 1`，违规时走非语义的
integrity fallback 保证可达。

### Decision F — Realized Source Coverage

Coverage 是**派生能力**，不是持久化事实：

```text
PlannedCoverageSet  = block.covers
RealizedCoverageSet = union(all leaf sourceUnitIds)
MissingCoverageSet  = Planned - Realized
```

不得落盘 `ratio`；Generated Expression 为 Missing / Unknown 时 Coverage = **Unavailable**，
不得解释成 0%；`covers = []` 的 0/0 是独立状态（Empty Scope / Not Applicable）。
历史审计需求应版本化 evaluation rule，而不是持久化比例。

#### F.1 coverage 术语对照（防止出现第四个 coverage 名字）

| 名称 | 归属 | 关系 |
|---|---|---|
| **Realized Source Coverage** | 本契约（Decision F） | **同一 conceptual axis，不是同一个定义**：它是 `framework-map-contract` §1 的 **C. Semantic Coverage** 在 **Stage 2 的 operationalization**，两者不保证数学定义完全相同 |
| **Framework Coverage（A） / Navigation Coverage（B）** | `framework-map-contract` §1 | 本契约**不重新定义**，继续由该文档与 `check-map` 持有 |
| **Provenance Assurance** | 本契约（§5 S1–S7 与各层契约） | **新增维度**，不属于 A / B / C 任何一种；是**状态**而非比例 |
| **「Overview 区块覆盖率」** | `docs/specs/overview-coverage.md` | Overview 侧指标，本契约不定义 |

沿用既有纪律：**任何 coverage 都不得合成一个数字。**

> 实测：Semantic Coverage 目前有**两份实现** —— `check-overview.js`（Overview 侧）与
> `check-block.js`（stage2 侧）。Realized Source Coverage 指后者口径。

---

## 5. Cross-Level Invariants

### 5.1 三个 preservation property（总性质 / 索引）

任何一次跨层转换（artifact → view model → UI）都必须保持三种东西：

```text
Identity preservation          主体身份不变      → 防止错误定位模型
Epistemic-state preservation   知识状态不变强    → 防止错误理解模型
Semantic-strength preservation 语义强度不升级    → 防止错误表现模型
```

下列条目是这三个性质的具体约束。

### 5.2 组一 · Identity（跨 L0–L3 保持不变）

| 编号 | 不变量 |
|---|---|
| I1 | **Canonical subject 不得由 Projection 创造。** 每个稳定 identity 必须来自该实体类型的 authoritative carrier；上一层可以提供 occurrence 和导航入口，但 identity 的**存在不得依赖上一层是否引用它** |
| I2 | 跨制品引用只能走已存在的外键；禁止文本 / 标题 / 相似度 / 坐标重叠建引用 |
| I3 | 命名空间不得跨制品合并：`plan:SU-xxx` ≠ `inventory:S-xx`；framework-map 与 design-review 无共同 id 空间 |
| I4 | identity 持久性分三级且不可互相冒充：**stable identity > resolvable reference > Reading landing** |
| I5 | identity 不因 capability 缺失而消失；canonical landing 独立于 occurrence / generated expression / evidence |
| I6 | join 必须逐字段声明 authority；制品缺失用该 capability 的状态表达，不得用另一制品字段补位 |
| I7 | authority 单向：Generated 只能在 Plan 的 semantic envelope 内填充 |
| I8 | capability 增长不改变 identity 集合 |

### 5.3 组二 · Capability 状态

| 编号 | 不变量 |
|---|---|
| S1 | `absent` ≠ `[]` ≠ `0` ≠ `unknown` ≠ `Absent(capability)`；五态不得折叠 |
| S2 | capability 缺失只降低该 capability 的状态，不改变 identity |
| S3 | **Absent ≠ Unknown**：Absent = 模型没有载体（已知）；Unknown = 有载体但信息不可得 |
| S4 | `Unknown ≠ 0`；`Indeterminate ≠ Unsupported`；**`Known Absent ≠ Unverified`** |
| S5 | 派生 capability 在父不可用时是 **Unavailable**，不得归零 |
| S6 | 状态不得跨命名空间拼装 |
| S7 | **Capability 的认识论状态必须拥有彼此可区分的合法编码。** Unknown 可由字段缺席、显式 sentinel、`null`、tagged union 或独立状态字段表达；若 carrier 没有任何 Unknown 编码，Projection **不得自行制造** Unknown。`required` / `optional` 本身不是状态语义，只有契约赋予它们的编码含义才是 |
| S8 | 派生产物与源不一致时权威在源；派生侧降级或报告 |
| S9 | 未检测到漂移 ≠ 历史可复现（无版本追踪时不得声称） |

### 5.4 组三 · 语义不得升级

| 编号 | 不变量 |
|---|---|
| N1 | 布局顺序 ⇏ 阅读顺序；阅读顺序 ⇏ 结构顺序 |
| N2 | 视觉权重 ⇏ 语义重要度 |
| N3 | `shape` ⇏ identity；`stage` ⇏ `shape` |
| N4 | membership（facet）⇏ containment |
| N5 | crossing ⇏ inbound / outbound（除非 relation 有方向语义；`relates-to` 无） |
| N6 | **坐标重叠 ⇏ 语义关系**（coordinate alignment 是 spatial，不是 semantic） |
| N7 | **`evidence.type = source-verified` ⇏ claim verified** |
| N8 | **`approved` / `reviewed` / `generation PASS` ⇏ claim verified** |
| N9 | fragment 有 provenance ⇏ fragment 有 evidence；resolvable ⇏ addressable |
| N10 | occurrence ⇏ identity；orphan ⇏ block 类型 |
| N11 | `§N` 解析 ⇏ 行级精确（只到 section range） |
| N12 | related ⇏ supported-by / constrained-by / reviewed-by |

### 5.5 状态空间必须显式且互不相通

危险很少是"值算错了"，而是**状态空间被压扁**。因此下列状态空间必须显式建模，
**不得强行统一成一个万能 `State` enum**：

```text
KnowledgeState              Unknown | KnownEmpty | Known(value)
CapabilityAvailability      Absent | Unknown | Available(value)
GeneratedExpressionState    Unknown | Missing | Present(value)
ProvenanceAssurance         Complete | Incomplete | Indeterminate
```

共同要求：**状态必须可区分，不允许靠 falsy 值猜**；且**不同 capability state space
即使结构同构，也不得被视为可互换类型** —— 消费者必须知道自己正在处理哪一个状态命名空间。
（本契约不指定实现手段：TypeScript brand、kind discriminator、构造器均可。）

---

## 6. Machine Enforcement Status

**Enforced ≠ Fully Protected。** 一个测试只能保护已经知道的出口。本表按
「保护对象 × 保障层」记录，B1 / B2 落成后**只更新对应 cell**。

`Current risk` 用**两个正交维度**表达，**不要**把"没有保护"和"最该优先补保护"混成一个字段：

```text
Protection coverage = None | Partial | Strong
    None    = 三层保障（Schema / Validator / Projection test）全空
    Partial = 至少一层有保护，但可绕过
    Strong  = 违规会让现有 validator 立即失败

Priority = High | Medium | Low
    High   = 既无机器保护，又极容易被未来实现以「更智能 / 更贴心」为由主动写错
    Medium = 无保护或可绕过，但没有已知的主动误实现诱因
    Low    = 违规会立刻失败
```

| Invariant | Schema | Validator | Projection test | Protection coverage | Priority |
|---|---|---|---|---|---|
| I7 authority 单向 | — | ✅（assembler 注入 + `FIXED` hard fail） | — | Partial | Low |
| I2 只用已存在外键 | — | ✅ partial（悬空引用 hard fail；但"禁止文本 / 相似度建引用"无守卫） | — | Partial | Medium |
| I6 逐字段 authority | — | ✅ partial（`FIXED` 列表） | — | Partial | Medium |
| I1 / I3 / I4 / I5 / I8 | — | — | ✅ partial（F13 `projectReadingSubject`：identity 与 Plan authority 保持；F16 L2 runtime 保住 block identity / 内容 / source refs） | Partial | Medium |
| S1 五态不得折叠 | — | — | ✅ partial（`test-l0-view-model` 与 Electron selftest 保住 `topic.blockIds` 的 Unknown / Known(0) shape；F16 保住 absent review link 与 explicit empty 的差异；其余状态空间仍无边界） | Partial | Medium |
| S2 / S5 / S6 | — | — | ✅ partial（F13 命名空间 discriminator 与跨空间拒绝） | Partial | Medium |
| S3 Absent ≠ Unknown | — | — | ✅ partial（F13 claim verification 只能为 capability `absent`） | Partial | Medium |
| S4 Known Absent ≠ Unverified | — | — | ✅ partial（F14 对抗测试保持 Indeterminate，不升级为 Unsupported） | Partial | Medium |
| S7 状态须有可区分编码 | — | — | — | None | Medium |
| S8 / S9 派生与漂移 | — | ✅ partial（资料包文件哈希、registry 重建和 Generated 的 Plan fingerprint；运行时 source 漂移降级） | ✅ partial（搬迁、错误配对与漂移；coverage 只作本次派生） | Partial | Medium |
| N1 / N2 / N3 | — | — | — | None | Medium |
| N4 / N5 | — | — | — | None | Medium |
| N6 坐标重叠 ⇏ 语义关系 | — | — | ✅ partial（F14 exact-containment 对抗测试） | Partial | Medium |
| N7 source-verified ⇏ verified | — | — | ✅ partial（F14 evidence-level 对抗测试） | Partial | Medium |
| N8 approved/reviewed/PASS ⇏ verified | — | — | ✅ partial（F14 独立状态汇总对抗测试） | Partial | Medium |
| N9 / N10 / N11 / N12 | — | — | ✅ partial（L3 fragment 保留父 Block identity；SU 只到 section range；Evidence 无独立 landing；真实 IPC / renderer 回归） | Partial | Medium |

> 说明：`Protection coverage = None` **不自动**等于 `Priority = High`。
> High 的判据额外要求"存在主动误实现的诱因"。High 的数量**没有架构意义**，
> 不应人为固定；新发现一条现行的 silent violation 就应照实新增一条 High。
> B1 / B2 落成后只更新对应 cell 与 Protection coverage，Priority 随判据重算，**不做整行搬迁**。

### 6.1 Current Enforcement Boundaries

- validator 校验源制品和明确输入上下文；投影输出由结构断言与真实 renderer 集成检查保护。
- L0 / L1、Plan + Generated 的 L2 与从 Block/fragment 发起的 L3 已有产品入口。
  投影与对抗测试覆盖 identity、authority、能力缺失及禁止跨链语义升级；范围以表中 partial cell 为限。
- 资料包会检查配对与原文坐标一致性；这不提供历史版本追踪，也不构成 provenance assurance 或 claim verification。
- canonical resolver、Explore 与 durable fragment identity 仍不在当前边界。各次实现的过程和命令结果仅记录在 feature artifacts。

---

## 7. Non-goals / Deferred Capabilities

本契约**不表示** Reading v1 已包含下列能力。它们已被明确推迟，任何实现不得援引本契约声称其存在：

| 能力 | 状态 |
|---|---|
| Explore 投影的实现 | Deferred（仅冻结架构边界：Decision A） |
| Claim-level verification | **Known Absent** —— 模型无载体 |
| Review object 的 Reading landing（`#decision-…`） | Deferred（identity 与外键存在，landing 不存在） |
| L1 作为独立 Reading route（`Open in Reading(T-xx)` / Topic canonical landing） | Deferred（stable identity 与 local DOM anchor 存在，canonical landing 不存在 —— 见 §2.3） |
| Fragment 的 durable identity / 深链 / 评论锚点 | Deferred（不得制造 synthetic ID） |
| `source-verified` 整合 | Deferred（当前 36/36 evidence 均为 `document-claim`） |
| 交互可用性（zoom / pan / 自定义节点 / 评论） | Deferred |
| L2/L3 的产品级投影实现 | Present（资料包 Plan + Generated、Block/fragment inspection）；完整 canonical navigation 仍 Deferred |
| 文档去重（PRODUCT_SPEC / DESIGN / F03 brief 的旧表述） | Deferred（由 §1.2 scoped precedence 覆盖，属文档维护任务） |

**明确不做**：不为满足 UI 需要而在投影期补造 identity、关系、证据或 verification；
不因某篇文档缺字段而放宽 invariant；不把 fragment 位置升格为 identity。
