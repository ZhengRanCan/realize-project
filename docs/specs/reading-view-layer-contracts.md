# Reading View Layer Contracts v1

- **版本**：v1（2026-09-29 冻结）
- **状态**：**normative subordinate specification**
- **规范性来源**：本文件由 [`reading-view-cognitive-contract.md`](reading-view-cognitive-contract.md)
  明确纳入（normative incorporation）。**本文件不宣布 authority** ——
  它不声明自己是 Reading 的规范性权威，其规范性完全来自主契约的纳入。

```text
reading-view-cognitive-contract.md      ← 宣布 authority / 定义跨层概念
        │ normative incorporation
        ▼
reading-view-layer-contracts.md         ← 本文件：四层各自的 normative 契约
        │ rationale only
        ▼
reading-view-cognitive-contract-evidence.md
```

**冲突处理**：与主契约（含 Decision A–F、Cross-Level Invariants、Core Model）不一致时，
**一律以主契约为准**，本文件按主契约 §1.3 Change Control 修订。

**本文件回答**：在遵守主契约的前提下，**L0 / L1 / L2 / L3 各自具体回答什么、消费什么、允许怎样降级？**
主契约定义"概念是什么"（Reading 定义与两个投影、跨层纪律、Decision A–F、29 条不变量、机器保障、
Non-goals），本文件定义"这一层如何消费该概念"；凡属"某个 capability 的状态机长什么样"都在主契约，
**本文件不重复**，只写"本层必须保留 / 不得渲染成什么"。

---

## 1. L0 — Document-scoped orientation

### 1.0 适用跨层规则（Applicable cross-level rules）

实现 L0 前至少检查：

- Decision A — Explore Addressability
- Decision B — Canonical Reading Resolution
- I1 / I4 / I5
- S1 / S7
- N1 / N2 / N4

完整定义见 [`reading-view-cognitive-contract.md`](reading-view-cognitive-contract.md)。

### 1.1 回答什么问题

三个**并列**答案，互不替代：

- **Framework Map** = 这些东西怎么连接
- **Topic Navigation** = 有哪些事值得我进去看
- **Document Summary** = 这是什么文档 / 不做什么

### 1.2 锚点对象

`element`（含降级为角标者）与 `topic`。不含 block、不含 review object。
L0 上出现的任何东西都必须已经是 `E-xx` 或 `T-xx`。

### 1.3 输入与身份

唯一输入 `framework-map.json`；身份 = `element.id` / `topic.id`。
溯源二选一（契约强制）：`sourceUnitIds` 或 `sectionRefs`。
**不得依赖 `topic.blockIds` 存在**（该字段三态，absent = Unknown，见主契约 S1 / S7）。

### 1.4 顺序来源

唯一可消费的顺序 = **原文位置**（section 粒度：`§key` → heading 行号）。
`elements[]` / `topics[]` 的数组位置**不是**顺序信号。
无可追溯顺序时仅呈现结构事实；布局可用 deterministic tie-breaker，但该排列属于布局顺序。

### 1.5 下钻去向

- `Select Element` → `#element-<id>`
- `Explore` → Focus = 该 element（须过 Decision A 准入）
- `Select Topic` → L1（认知去向；L1 作为独立 Reading route 目前 **Deferred**，见主契约 §2.3）
- `⚑ N` → 展开（disclosure，非导航）

L0 是阅读栈的底，**没有 Back**。**`Open in Reading` 一词只保留给 Explore。**

### 1.6 必须保留的上下文

文档身份常驻（title / sourcePath / role）+ document 级入口（scope / nonGoalSummary / thesis 若有）。

### 1.7 允许的降级

唯一被批准的降级：attachment 上的元素 → `⚑ N` 角标。

表示层动作：标题 1 行 / 副标题 2 行截断、topic 命题默认折叠而计数常驻。
**截断后的完整内容必须有稳定 disclosure 路径**（selection detail / expand / 可访问 tooltip /
detail slot 至少其一）；hover 只是增强。

不删除、不合并 topic、不改身份；计数遵守三态（主契约 S1）。

---

## 2. L1 — Topic-scoped semantic boundary

### 2.0 适用跨层规则（Applicable cross-level rules）

实现 L1 前至少检查：

- Decision B — Canonical Reading Resolution
- Decision E — Orphan Block
- I1 / I4 / I5
- S1 / S2 / S7
- N1 / N4 / N5 / N10

完整定义见 [`reading-view-cognitive-contract.md`](reading-view-cognitive-contract.md)。

### 2.1 回答什么问题

「这个 Topic 的**语义边界**是什么，内部机制如何连接，它怎样与边界外发生关系，
以及我能从这里继续深入到哪些**已经被模型明确组织出来**的内容？」

**不回答**「这个 Topic 有哪些 Block」——那是 capability 的问题。

### 2.2 锚点对象

Topic（唯一焦点）+ Inside 成员 + Crossing 边。
Block 仅在 `Known(n)` 时成为锚点。External 不进 L1。

### 2.3 输入与身份

焦点 `T-xx`；成员由 `element.topics` 反向推导。
来源由 Traceability capability 承担：

- Direct = `topic.sectionRefs` 存在时
- Indirect = `blockIds → O-xx → block.covers/sourceRefs`（需 Block Organization 可用）
- 两者皆无 = **合法状态**，**不得凭标题或文本匹配补造来源**

### 2.4 顺序来源

1. `sectionRefs` **存在时** → `§key` → heading 行号，提供 topic-local source order；
2. Block **Known(n)** 时 → `stage` 提供第二种 coarse reading order（**偏序**：
   同 stage 内不得声称阅读顺序，只能用 deterministic layout order）；
3. 两者皆无 → L1 只有 layout order。

Block 为 Unknown 时**不得从 element 推断 stage**。

### 2.5 下钻去向

- `Select Element` → `#element-<id>`（与 L0 同一锚点）
- `Select Block` → L2，**仅当 Known(n)**
- `Back` → L0，经 navigation stack 恢复 ReadingAddress

Unknown 与 Known(0) 的用户结果都是"没有 Block 入口"，但语义不同，
**不得合并成一个"暂无"**。

### 2.6 必须保留的上下文

文档身份常驻。

**不得为简化界面压掉任一已存在的 boundary relation class；为空的 class 保持空语义，
但不要求为它绘制空画布或固定视觉区域**（knowledge state ≠ visual footprint）。

返回路径保存 L0 的 ReadingAddress。

### 2.7 允许的降级

Outside 成员降级为 external stub / 汇总计数，**但必须可展开回原 identity**；
**内部关系为空时不得伪造**；截断 / 折叠同 L0；不删除、不重切 Topic、不改身份；计数遵守三态。

### 2.8 层内结构：稳定核心 + 可用能力

```text
L1 Core（永远存在）
├── Topic identity / proposition
├── authoritative membership          ← 唯一永远 Known 的柱子
└── boundary-relative relations

Capabilities
├── Traceability          Direct(topic.sectionRefs) / Indirect(via Block) / 不可解析
└── Block Organization    Unknown / Known(0) / Known(n)
```

> `element.topics` 在 schema 中是 required 且非空 ⇒ 成员关系**全量、权威、永远 Known**。
> `topic.sectionRefs` **不是**永远存在（schema 只保证 `blockIds OR sectionRefs` 至少其一），
> 因此来源属于 capability，不属于 Core。

### 2.9 层内规则：边界分类（Crossing 先于方向）

```text
永远安全（纯集合运算）：
  Internal  = both endpoints ∈ Inside(T)
  Crossing  = exactly one endpoint ∈ Inside(T)
  External  = neither endpoint ∈ Inside(T)        ← 不进 L1

仅当 relation type 具备方向语义时，才把 Crossing 拆成：
  Inbound   = Outside → Inside
  Outbound  = Inside → Outside
  否则保持 Boundary Crossing
```

8 个受控词是主动语序（`A --v--> B` 读作 "A v B"），方向有合同保证；
`relates-to` 是兜底词，未承诺方向 ⇒ 归为 Boundary Crossing。
**存储方向不得自动升级为语义方向。**

**运行期不变量（本层）**：`internal / crossing / inbound / outbound / external`
不得持久化为 edge 的固有属性；只能由 focused topic membership 与 canonical edge 在投影期
确定性计算：`role(edge, topic)`，不是 `role(edge)`。

> 关于 Topic 的 identity 语义（facet，不是 container）见主契约 §2.3 与不变量 N4。

### 2.10 层内规则：退化（合法，非缺陷）

```text
若没有任何可绘制 relation
  → L1 从「局部地图」退化为「Topic boundary summary」
  → 改变 representation，不改变 L1 identity，也不意味着数据缺失
```

两个正交退化维度：`Inside = ∅`（合法）与 `Block Organization = Unknown`。

---

## 3. L2 — Block-scoped semantic explanation

L2 是第一个把**多个权威制品**按稳定 identity 关联起来的 Reading 层 ——
但是**非对称**关联，不是对称 merge。

### 3.0 适用跨层规则（Applicable cross-level rules）

实现 L2 前至少检查：

- Decision B — Canonical Reading Resolution
- Decision C — Stage Order
- Decision D — Generation Integrity
- Decision E — Orphan Block
- Decision F — Realized Source Coverage
- I1 / I5 / I6 / I7
- S1 / S2 / S3 / S4 / S5 / S6 / S8
- N1 / N3 / N7 / N8 / N9 / N10

完整定义见 [`reading-view-cognitive-contract.md`](reading-view-cognitive-contract.md)。

### 3.1 回答什么问题

「这个解释单元在讲什么、用哪种视觉语法讲、它解释哪些源语义、它的生成是否完整、
我能从哪里进入它、又从哪里继续核查？」

**不回答**「它属于哪个 Topic」（L1 的职责），也不回答原文（L3 的职责）。

### 3.2 锚点对象

**稳定主体**：`O-xx`（唯一）。
**非稳定对象**：visual fragments —— 可 inspect、可追 source，**不可作为 durable identity**。

### 3.3 输入与身份

以 Plan Block 为 identity / existence authority，通过 `O-xx` 对 Generated Expression 与
Framework Map occurrences 做**可缺失关联**；关联失败只降低对应 capability 的知识状态，
**不得使 Block identity 消失，也不得用另一 authority 的字段补位**。

### 3.4 顺序来源

1. 可消费的是**文档化的四段认知路径**（`what → how → prove → boundary`，主契约 Decision C），
   **不是** `stages[]` 数组顺序；
2. 同 stage 内无规范性顺序信号 ⇒ 只允许 deterministic layout order，
   **不得**用编号 / "Next Block →" / "1. 2. 3." 赋予叙事顺序；
3. `blocks[]` 数组顺序 = implementation provenance，不是 Reading semantics。

### 3.5 下钻去向

**两条 L3 边，只有一条可寻址**：

- `Select Block` → L3 entity-level verification **context**（`covers` / `reviewObjects`）
- `Inspect Fragment Provenance` → L3 item-local verification（当前 render tree 的 `sourceUnitIds`，
  受 `covers` 界定）——**不产生 durable identity**，不得作为 Comment Anchor / Explore Focus /
  `Open in Reading` 目标
- `Back` → 恢复 origin ReadingAddress
- `Open in Reading(O-xx)` → `#block-O-xx`

### 3.6 必须保留的上下文

1. 计划语义与生成表达各自的**来源标记**；
2. `0..N` Topic occurrences + origin ReadingAddress；
3. Generation Integrity 的稳定 disclosure 路径；
4. orphan 时走 integrity fallback，**不得伪装成 Topic**。

### 3.7 允许的降级

1. **PASS 默认沉默**（合法：knowledge state 仍为 Known 且有 disclosure 路径）；
   非 PASS 低强度提示，且**必须标明是 generation warning**，不得混同 evidence / design /
   review warning；无结构化原因时只能诚实说 "Generated with warnings"；
2. fragments 可折叠 / 截断，须有稳定 disclosure 路径；
3. 不删除、不伪造 Topic、不把 fragment 位置升格为 identity；
4. **Unknown 不显示为 `0` / `PASS` / `FAIL`**。

### 3.8 层内结构：主体模型（非对称 capability 挂载）

```text
Block O-xx                        ← Plan 是 identity / existence authority
├── Identity / semantic envelope      Plan authority
│   title / stage / shape / covers / sourceRefs / reviewObjects
├── Generated Expression              optional capability（content + fragment-local provenance）
├── Generation Integrity              capability（状态机见主契约 Decision D）
├── Realized Coverage                 derived capability（规则见主契约 Decision F）
└── Topic Occurrences                 contextual capability（三态见主契约 Decision E / I5）
```

**L2 不是对称 join**：`PlanBlock LEFT JOIN GeneratedBlock LEFT JOIN TopicOccurrences`。
任一 capability 缺失只降低该 capability 的知识状态，**不得使 Block identity 消失**，
也不得用另一 authority 的字段补位（主契约 I6 / I7）。

### 3.9 层内规则：字段 authority

| 维度 | authority | 机制 |
|---|---|---|
| `id` / `title` / `stage` / `shape` / `covers` / `sourceRefs` / `reviewObjects` / `defaultExpanded` | **Plan** | assembler 从 plan 注入；AI 只返回 `shape` + `content`；`check-block` 的 `FIXED` 列表 hard fail 兜底 |
| `content` | **Generated** | 受 `stage2-block` schema 与 shape↔content.type 校验 |
| leaf `sourceUnitIds` | **Generated content** | 必须 ⊆ `block.covers` |
| `generation.{verdict, model, promptSha256, latencyMs, finishReason}` | **Generation metadata** | assembler 从 request / check 文本推导 |
| `sources` | **Plan 派生** | `sourceRefs[].section` 去重展开 |
| `role` | **Plan，缺省 `normal`** | 缺省语义**待核实**：需区分 normative default 与 implementation fallback；在契约明示 `absent ≡ normal` 之前，不得声称该缺省具有规范含义 |
| Topic occurrence | **Framework Map** | 独立制品 |

### 3.10 层内规则：四个正交维度

```text
Block Identity          O-xx          这是哪一个解释单元
Reading Role            stage         在理解路径中负责什么
Visual Grammar          shape         用什么认知形状表达
Semantic Coverage       covers        解释哪些源语义
```

四者不得互相推导：**`shape` 可以更换而 `O-xx` 不变**；
禁止 `stage=how ⇒ shape=flow` 之类的互推（主契约 N3）。

### 3.11 层内规则：Provenance Assurance

```text
Realized Source Coverage   = Plan.covers × Generated sourceUnitIds      （主契约 Decision F）
Provenance Assurance       = Generated semantic assertions × provenance policy
                           = Complete | Incomplete | Indeterminate       （状态空间见主契约 §5.5）
```

- `matrix.columns[]` = **Explicitly Exempt**（有明文豁免）。
- 既未豁免也未被要求分类的字段（如 `flowNode.state`，其归属见主契约 Decision D.1）
  = **Currently Unclassified**；存在此类字段 ⇒ Provenance Assurance = **Indeterminate**。
- 两种状态不得共用：**"有意豁免"与"没人检查"不是同一件事**。
- 不在检查范围内的字段，其 coverage 状态是 **Unknown（未被检查）**，
  **不得**被 100% Source Coverage 掩盖。
- 不得落盘 coverage 比例（主契约 Decision F）。

> 术语：`covers` / `sourceUnitIds` / `reviewObjects` 是 **verification entry points**，
> 不是 verification（主契约 §3.7）。

---

## 4. L3 — Subject-preserving inspection

**核心定义**：L3 是 **inspection projection**，不是新的内容层，也不产生新的主 identity。
它继承已有稳定 subject，在该 subject 上展开 Traceability / Evidence Context /
Related Review Context 与可用的认识论状态。

### 4.0 适用跨层规则（Applicable cross-level rules）

实现 L3 前至少检查：

- Decision B — Canonical Reading Resolution
- Decision D — Generation Integrity
- Decision F — Realized Source Coverage
- I2 / I3 / I4 / I6
- S1 / S3 / S4 / S5 / S8 / S9
- N6 / N7 / N8 / N9 / N11 / N12

完整定义见 [`reading-view-cognitive-contract.md`](reading-view-cognitive-contract.md)。

### 4.1 回答什么问题

「这个表达基于哪些语义来源？这些来源能被解析到原文什么位置？它关联了哪些 Evidence /
Review Object？这些材料的证据级别是什么？对于我想核查的断言，系统当前究竟知道什么、
不知道什么、以及明确没有哪种状态？」

**不回答"这个 claim 是否正确"** —— 当前没有 claim-level verification carrier；
也不把 approved、reviewed、generation PASS 或 `sourceUnitIds` 拼装成 verification。

### 4.2 锚点对象

不产生新主 identity：

- Entity inspection 的稳定 subject 当前以 `O-xx` 为主；fragment inspection 的稳定 subject
  仍是父 `O-xx`，fragment 只是 ephemeral origin
- `SU-xxx` = 稳定 provenance identity 但**无 Reading landing**
- `DEC/GAP/Q/FACT/MODEL-xxx` = 稳定 identity + 可解析外键但**无 Reading landing**
- Evidence 无 id（依附父 review object）；fragment 无 identity

### 4.3 输入与身份

四类权威来源：

1. Plan Block（semantic envelope）
2. Generated Expression（fragment-local `sourceUnitIds`）
3. `overview-plan.sourceUnits`（SU → section / statement）
4. `source-sections.json`（`§N` → canonical range / text）
5. `design-review.json`（经 `reviewObjects` 提供 Related Review Context 与其 Evidence）

所有关联必须使用稳定 key 或规范性解析规则。**坐标可比 ≠ 语义桥已经存在**（主契约 N6）。

### 4.4 顺序来源

L3 不拥有全局"验证叙事顺序"。

- Traceability 项可按权威 source coordinate（document → section → line range）排序，
  目的只是便于按原文阅读，**不得**解释成证据强弱或重要度。
- Review Object / Evidence 数组如契约无顺序语义，只能用 deterministic layout order，
  不能把数组位置解释成"第一证据 / 第二重要决策"。
- 允许固定按 Traceability / Evidence Context / Related Review Context / Verification State
  分区 —— 那是**认知分组顺序**，不是实体间语义顺序。

### 4.5 下钻去向

末端 inspection 层，**无 L4**。

- `Inspect Source Unit` 可通过 SU → `§N` → section range 打开原文上下文，
  这是 source inspection，**不是** `Open in Reading(SU)`
- Related Review Object 可被解析并展开其字段与 Evidence，但由于没有 landing anchor，
  **目前不能** `Open in Reading(DEC-005)`
- Evidence 本身没有 identity，只能在父 review object 内 disclosure，不能深链
- `Inspect Fragment Provenance` 使用当前 render tree 的 ephemeral context，
  退出后**不保证可恢复**
- `Back` 永远恢复进入 L3 前的 ReadingAddress / render context，
  **不通过 resolver 重建 fragment**

### 4.6 必须保留的上下文

- 稳定 parent subject（通常 `O-xx`）、进入 L3 的 origin ReadingAddress、
  若来自 fragment 则保留本次 render-session 的 ephemeral origin
- 每项信息的 authority / source namespace、当前 capability 的认识论状态
- Source Coordinate Resolution 必须同时保留**文档 identity**（单文档能力）；
  不得跨文档解释 `§3`
- registry 是派生产物 ⇒ 检测到漂移应**降级坐标能力并提示 integrity 问题**，
  不得继续把旧行号当权威坐标
- **没有版本追踪意味着"未检测到漂移"也不能被额外解释成历史可复现性**（主契约 S8 / S9）

### 4.7 允许的降级

- Traceability 只能降到实际可证明的粒度：SU 能稳定解析到 section range，
  但 `statement` 没有段内 offset，因此**不得显示伪精确的"对应第 103 行"**（主契约 N11）
- Evidence Context 可以是 `Known(0)` 或 `Known(n)`；`[]` 是明确"该 review object 没有 evidence"，
  **不能显示成 Unknown**
- 当前 36/36 `evidence.type = document-claim` 可以诚实显示为文档主张级，**不得显示 Verified**
- **Claim Verification State = Known Absent**：UI 可以表达"当前模型没有 claim-level verification
  状态"，**不能把它压成每条 claim 的 Unverified** —— 后者会虚构一个不存在的状态机（主契约 S3 / S4）
- Related Review Object 必须标记为 **related-to**，不得升级为 supported-by / constrained-by /
  approved-by（主契约 N12）
- fragment 中未被 provenance policy 分类的 epistemic field 保持
  **Provenance Assurance = Indeterminate**，不得被 100% Source Coverage 掩盖

### 4.8 层内结构：冻结骨架

```text
Traceability Core                 ✅ 真实闭合（主契约 §2.3 的 deterministically resolvable chain）
Evidence Context                  Present · type 目前单值（document-claim）
Related Review Context            Present · related-to only
Source Coordinate Resolution      Present as derived capability（section 粒度，单文档）
Claim Verification State          Known Absent
```

### 4.9 层内规则：必须遵守的三条跨层边界

本层**不得**产生下列升级（规则定义在**主契约**，此处只列本层义务）：

1. **坐标系里的重叠不生成语义关系**（主契约 **N6**）—— 允许确定性的空间判断
   （same document / same section / range overlaps），不得推出
   `range overlaps ⇒ evidence supports SU-017`。
2. **Evidence 与 Claim Verification 永久解耦**（主契约 **N7**）—— 即使未来出现
   `source-verified`，也只能说"这条 Evidence 的证据级别是 source-verified"。
3. **Known Absent ≠ Unverified**（主契约 **S4**）—— 见 §4.7。

> 状态词汇的命名空间规则见主契约 §3.6；`flowNode.state` 的归属见主契约 Decision D.1。
