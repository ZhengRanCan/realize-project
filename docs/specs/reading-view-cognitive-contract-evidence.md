# Reading View Cognitive Contract v1 — Evidence Appendix

> **NON-NORMATIVE — evidence and rationale only.**
> In conflicts, `docs/specs/reading-view-cognitive-contract.md` is authoritative.
>
> 本文件回答"**我们为什么知道这些规则值得存在**"，不回答"系统必须是什么样"。
> 它只保留足以重建 rationale 的最小实证链，不是讨论过程的整理稿。

---

## 1. 证据是怎么产生的

所有结论来自对**仓库内真实产物**的只读测量，未调用模型、未修改任何产物。材料：

| 材料 | 用途 |
|---|---|
| `experiments/semantic-grounding/fixture-d/run-04/framework-map.json` | L1 边界分布、membership 重叠 |
| `experiments/semantic-grounding/fixture-e/run-08/framework-map.json` | 同上 |
| `docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json` | Fixture A（唯一闭合 L1→L2 的 map） |
| `fixtures/context-consumption.overview-plan.json` | 87 sourceUnit / 21 block；L2 的 Plan authority |
| `experiments/stage2-full/overview.generated.json` | L2 的 Generated authority |
| `fixtures/context-consumption.json` | design-review：12 Decision / 6 Gap / 10 Open Question / 6 Fact / 36 Evidence |
| `docs/source-sections.json` | `§N` 坐标注册表 |
| `ai/stage2-blocks.prompt.md`、`ai/stage1-plan.prompt.md` | provenance 关系语义与作用域的**规范文字** |
| `scripts/check-block.js`、`check-plan.js`、`assemble-overview.js`、`l0-view-model.js` | 现成的实现事实与覆盖规则 |

测量方式：针对上述文件写的临时只读脚本（读取 JSON 后做集合运算与遍历统计）。
脚本本身未作为项目产物保存；**每个数字都可由上表文件直接复算**。

---

## 2. 关键实测结果

### 2.1 L1：Topic membership 不是 partition

| fixture | elements | topics | memberships | 平均 Topic/element | `Inside` 大小分布 | internal=0 | 有 crossing |
|---|---|---|---|---|---|---|---|
| A | 12 | 5 | 16 | 1.33 | `{1:1, 2:1, 4:2, 5:1}` | 3/5 | 2/5 |
| D | 13 | 21 | 43 | **3.31** | `{0:2, 1:4, 2:9, 3:5, 6:1}` | **16/21** | 15/21 |
| E | 12 | 9 | 25 | 2.08 | `{0:1, 1:1, 2:2, 3:1, 4:3, 5:1}` | **7/9** | 8/9 |

两个后果：
- 单一 element 属于多个 Topic ⇒ membership **不是排他归属**（支撑 N4 / §7.4）。
- 多数 Topic 没有内部边（D 16/21、E 7/9）⇒ L1 的内容重心是 **crossing**，
  且"内部关系为空"是常见合法状态，不得用 inbound 边冒充（支撑 §6.5 字段 7）。

### 2.2 L2：O-xx identity 与字段 authority

- plan 与 generated 的 block id **21 = 21、双向无差、顺序一致**；`generation.complete = true`，
  `failedBlocks / missingBlocks / extraBlocks` 均为 `[]`。
- 每 block 另有 `generation: {verdict, model, promptSha256, latencyMs, finishReason}`，21/21 均存在。
- **固定字段由 assembler 从 plan 注入**（`assemble-overview.js`：AI 只返回 `shape` + `content`），
  `check-block.js` 另有 `FIXED = ['id','title','stage','shape','covers','sourceRefs','reviewObjects','defaultExpanded']`
  hard fail 兜底 ⇒ **字段 authority 是既有实现，不是待约定的约定**（支撑 I6 / I7 / §7.2）。
- `verdict` 值域是**四态**：`PASS | PASS_WITH_WARNINGS | FAIL | UNKNOWN`（从 check 文本推导；
  无结果标记 ⇒ `'UNKNOWN'`）。`FAIL` 的 block **仍留在 `blocks[]`**；`missingBlocks` 才是"没有生成文件"
  ⇒ **外层是 `Unknown / Known Missing / Present` 三态，不存在"两个层次的 Unknown"**：
  `missingBlocks` = **Known Missing**（已明确记录缺失），不是 Unknown；
  verdict 的四元状态只在 `Present` 内部成立（支撑 Decision D）。
- `stage` 之间的顺序**没有校验器**：`check-plan.js` 不校验 `what → how → prove → boundary` 顺序，
  `assemble-overview.js` 的 `stages[]` 顺序由 `[...new Set(plan.blocks.map(b => b.stage))]` 得出，
  即 **plan 数组首现顺序**；四段顺序只在 `PRODUCT_SPEC.md` 散文中声明（支撑 Decision C 的三层划分）。

### 2.3 L2：fragment 无 identity，覆盖规则与盲区

- 遍历全部 `content`：带 `id` 的对象**恰好 21 个 = block 自身**；flowNode / edge / checklistItem /
  cell / diffLine / tier / pair / step / panel / lane / side / verdict **全部无 id**
  ⇒ **L2 Block 是当前 Reading 视觉层级中最后一个拥有稳定、可寻址 identity 的视觉解释单位**（支撑 N9）。
- **11 个 shape → 8 个 content.type**：`flow`+`current-target-flow`→flow；`matrix`+`capability-matrix`→matrix；
  `checklist`+`two-column-comparison`→checklist；`walkthrough`→steps。
  覆盖规则定义在 content.type 上 ⇒ 11 shape 共用一条规则是**结构必然**。
- 覆盖规则（`check-block.js#collectElements` + `isPresentationLabel`）：
  `semantic-bearing = 有非空文本 ∧ 不在 PRESENTATION_LABELS 白名单 ∧ 不是 "Step N/步骤 N/第 N 组" 位置提示`；
  唯一结构性豁免是 `matrix.columns[]`（显式 `presentation: true`）。
- 实测合规度：15 种 fragment kind、**语义件 174 个，无 provenance = 0**，11 个 shape 全部为 0。
- **覆盖盲区**：`content.caption`(2) / `content.note`(2) / `flowNode.state`(8) / `flowNode.tier`(2) /
  `keyVariants`(8) 承载文本或语义，但既不在 walker 枚举内，schema 里也没有 provenance 字段
  （支撑 Layer Contracts §3.11 的 Indeterminate 与 "未枚举字段 = Unknown（未被检查）"）。
- 术语陷阱：`content.verdict`（walkthrough 的"结论"，语义）与 `generation.verdict`（产物质量）同名不同义
  ⇒ Decision D 的 verdict 必须永远限定写成 `generation.verdict`。

### 2.4 L2：三态在本仓库是既成实践

同一声明文件中并存两种用法：

```text
failedBlocks: []          → Known(0)（"没有失败"）
missingBlocks: []         → Known(0)
extraBlocks: []           → Known(0)
capacityNote  absent 16/21 → "不适用"
```

⇒ 本仓库已经存在「`absent` 与 `[]` 必须被区分」的实践，且 `[]` 在数组 carrier 上被用来表示 Known(0)
（`failedBlocks`）。但 **absence 的认识论含义依 carrier 而异**：`topic.blockIds` absent = Unknown；
`capacityNote` absent = **Not Applicable**；两者不得都读成 Unknown（支撑 S7）。
但 `evidence` 在 schema 中是 `required`，且值域为数组、无 `null` / sentinel 编码
⇒ **Evidence Context 只有 `Known(0)` / `Known(n)` 两态，无法表达 Unknown**（支撑 S7 的两态实例）。

### 2.5 L3：`sourceUnitIds` 的关系语义与作用域

`ai/stage2-blocks.prompt.md` 的原文：

- 「每个元素的文本必须**严格限定在它自己 `sourceUnitIds` 指的那一条**语义内」；
  自检方法 = 把元素文本与对应 SU 的 `statement` 逐条对照；判据 =「删掉这段文字，原文语义会不会损失」。
- **明文禁止**升级证据级别：「证据级别 | 文档主张 | 源码已确认 → ❌（本阶段没有源码输入）」。

⇒ 关系语义是 **realization / coverage（文本被这些 SU 授权）**，不是 derived-from 也不是 supported-by
（支撑主契约 §3.7 "verification entry point" 的用词）。
必带清单只列 5 类结构元素；`flowNode.state / code / badges`、`tier`、`caption`、`note`
**既未豁免也未要求** ⇒ **Currently Unclassified**（支撑 Layer Contracts §3.11）。

### 2.6 L3：SU 能解析到哪，以及引用完整性

- `overview-plan.sourceUnits[]` 字段：`id / section / kind / statement / importance`；
  **0/87 带行号或引文**；`section` 取值形如 `§0` `§1` …
- 完整性：covers 命中 86/87 SU、悬空 0；leaf `sourceUnitIds` **185 次引用、越界 0**（受 `leaf ⊆ covers` 强制）；
  "plan 声称覆盖而 leaf 从未引用"的语义丢失 = **0**。缺口：**SU-035 无任何 block 覆盖**；
  17 个 SU 被 >2 个元素引用（契约判为冗余）。
- ⇒ Traceability Core **真实闭合**，但闭合的是 **deterministically resolvable trace chain**，
  不是 addressable chain。

### 2.7 L3：Evidence 的真实载体与桥

- `document-claim / source-verified` 的载体是 `design-review.schema.json` 的 `evidence` 对象，
  挂在 **Fact / Gap / Decision** 上，字段 `{type, source, section, path, symbol, description, startLine, endLine}`；
  **无 `id`**、**无指向具体 claim / 字段的指针**（作用域 = 整个父对象）。
- **全库 36 条 evidence：`document-claim` 36 / `source-verified` 0**；
  plan 与 generated 两份产物里根本不存在这个字符串。
- 相关规范文字：`PRODUCT_SPEC`「接源码形成 source-verified 证据属于后续阶段」；
  `CONSTRAINTS`「两者不能画进同一张图或同一条证据链」。
  **没有任何一处说 `source-verified ⇒ 所关联 claim 已 verified`**（支撑 N7；层内义务见 Layer Contracts §4.9）。
- `reviewObjects` 是真实、稳定、双向的外键：覆盖 24 个 id，前缀 `DEC:12 / Q:5 / FACT:4 / GAP:3`，悬空 0；
  反向 decisions 12/12 全被引用，gaps 3/6、openQuestions 5/10、facts 4/6 未被任何 block 引用。
  schema 原文说它是"**关联**的 Review Object 编号"⇒ **related-to only**（支撑 N12）。
- **review object → SU 的桥不存在**：decision 完全不引用 `SU-xxx`；evidence 用文件名 + 行号，
  SU 用 `§N`。

### 2.8 L3：探针 A / B / C

**A — Evidence type 的语义**：`type` 是"证据级别"（PRODUCT_SPEC 用语：区分 document-claim 与
source-verified 的证据级别）；evidence 的规范角色是"支撑 Fact / Gap / Decision 的**来源**"。
⇒ 无 verification entailment，按 Model A 处理（支撑 S3 / N7）。

**B — reviewObjects 的关系性质**：见 2.7 ⇒ related-to only。

**C — `§N` 的坐标规则**：**存在**。

```text
scripts/extract-source-sections.js   从原 Markdown 生成 docs/source-sections.json
docs/source-sections.json            document{path,title,totalLines}
                                   + sections[]{label:"§0"…"§15", title,
                                                startLine, endLine, lines, text}
check-plan.js                        不在注册表内的 section ref → hard fail（validSections）
overview-plan.schema.json            sectionLabel = ^§([0-9]|[12][0-9])$
消费方                               9 个脚本（check-plan / check-block / check-overview /
                                     ai-plan / ai-block / build-preview / compare-stage2 /
                                     full-run-report / backfill-overview-plan）
```

⇒ `§3 → lines 95–125（+ 章节全文）` 是**规范性解析**，不是实现巧合；随后 `Source Coordinate Resolution`
由 Absent 升为 derived capability。两条边界：粒度只到 **section range**（`statement` 无段内偏移）；
仓库里只有一份 registry ⇒ 该能力**按文档**存在（支撑 N11 / §8 字段 6）。

**坐标可比性的更正**：原以为 SU 的 `§N` 与 evidence 的"文件 + 行号"不可比 —— **错**。
两者是同一份文档上的行号（registry 的 `document.path` 即该文件）：

```text
SU-017  → §3 → 95–125
§1 = 7–52   ←   DEC-005 的 evidence = 9–37 落在其中
```

正是这一"看起来可以连"的巧合，使 N6 成为最强的反诱惑测试（支撑 N6）。

### 2.9 L3：状态词汇与锚点

六套互不可比的状态词汇：`design.status`(3) / decision 人工状态(5) / gap 人工状态(4) /
`openQuestions[].category`(4) / `gaps[].severity`(3) / `generation.verdict`(4)；
`human-review.json` **连 schema 都没有**。**没有任何一套描述"一条 claim 是否被验证"**
（支撑 §8.3 Namespace Rule）。

锚点：只有 `#element-<id>` 与 `#block-<id>` 是 **canonical Reading landing**；
`#topic-<id>` 只是 L0 侧栏内的 **local DOM anchor**（Topic 的 canonical landing = Deferred，见契约 §2.3）；
`SU-xx`、`DEC/GAP/Q/FACT/MODEL`、fragment **均无锚点** ⇒ `Open in Reading(DEC-005)` 今天没有目标
（支撑 I4 / §2.3）。

### 2.10 一处正在运行的 collapse

`scripts/l0-view-model.js:109`：

```js
blockIds: [...(t.blockIds || [])],
```

`topic.blockIds` 是系统中**唯一真正三态**的字段（optional + `absent` / `[]` / 非空），
而它在 L0 投影里被 `|| []` 折叠成两态。今天 L0 不显示 block 计数，因此用户可见影响为零；
但**该区分在投影边界上已被销毁**，任何建立其上的 capability（L1 Block Organization、
L2 Topic Occurrences）都会继承两态视图（支撑 S1 的 High risk 与 §10 基线）。

---

## 3. 逐条 rationale（仅非显然者）

格式：`Invariant / Observed / Consequence`。

**I1 — Canonical subject 不得由 Projection 创造。**
Observed：Fixture A 的 `O-01` 存在于 plan 与 generated、identity 稳定、`generation.complete = true`，
但**不被任何 Topic 引用**（`occurrences = Known(0)`）。
Consequence：Block identity 来自 Plan（authoritative carrier），不由"上一层是否引用它"授予。
因此 orphan Block 仍必须有 `#block-O-01`；若规则写成"identity 来自上一层"，这条反例即被击穿。

**I2 — 跨制品引用只能走已存在的外键。**
Observed：design-review 的 facts / decisions / gaps 用**中文章节标题字符串**引用原文；
map 用 `§N`；两侧没有共同 id 空间（已知的唯一桥是 block id `O-xx`）。
Consequence：文本相似、标题匹配、坐标重叠都不得用于建立引用 —— 它们不是 identity。

**I4 — stable identity / resolvable reference / Reading landing 是三种能力。**
Observed：`SU-035` 有稳定 id，`DEC-005` 有稳定 id 与可用外键，但两者都没有 Reading landing；
visual fragment 有 provenance 而**无 id**（174 : 0）。
Consequence："有 ID"不得被读成"可以 Open in Reading"。

**N1 — 布局顺序 ⇏ 阅读顺序。**
Observed：`blocks[]` 物理顺序 = stage 分组 + 组内 plan 顺序，且**id 编号不是顺序** ——
`prove` 组内 `O-16` 排在 `O-10` 之前，`boundary` 组内 `O-13` 排在 `O-12` 之前（21 个里两个反例）。
Consequence：唯一有规范来源的 Block 间阅读序是文档化的四段认知路径；数组位置属 implementation provenance。

**N3 — `shape` ⇏ identity。**
Observed：`check-block` 对 `shape` 有程序比对，plan 与 generated 21/21 一致；AI 返回的 `shape`
被 plan 注入覆盖。
Consequence：`shape` 是 Block 的**计划属性**，不是 identity；"O-07 是 Flow"不得升格为
"O-07 的本体是 Flow"。`shape` 可换而 `O-xx` 不变。

**N4 — membership（facet）⇏ containment。**
Observed：Fixture D 13 elements / 43 memberships，平均 **3.31 Topic per element**。
Consequence：成员关系不能被渲染成排他归属；Topic 是语义切面，不是容器。

**N6 — 坐标重叠 ⇏ 语义关系。**
Observed：见 2.8 —— `§3 = 95–125` 与某 evidence `100–110` 存在**精确包含**关系，
同一文档、同一坐标系。
Consequence：可以计算空间关系（same document / same section / overlap），
**不得**由此产生 evidence linkage。这类非法升级的实现形状是
`if (rangeContains(section, evidence)) link()`，在人类直觉上甚至相当合理。

**N7 — `evidence.type = source-verified` ⇏ claim verified。**
Observed：`type` 被规范定义为"证据级别"；无任何 entailment 文字；且 `source-verified` 被列为后续阶段。
Consequence：即使未来出现第一条 `source-verified`，L3 也只能陈述"这条 Evidence 的级别"，
不得自动标 Verified。

**N8 — `approved` / `reviewed` / `generation PASS` ⇏ claim verified。**
Observed：六套状态词汇并存且互不可比，其中没有一套描述 claim verification。
Consequence：最危险的实现是"高级状态汇总"（`if (approved && reviewed && ok) status = 'verified'`）——
它的诱惑来自产品上"给用户一个最终状态"的冲动。

**N9 — fragment 有 provenance ⇏ fragment 有 evidence。**
Observed：174 个语义件可核查（有 provenance），0 个可寻址（无 identity）。
Consequence：这条比例就是 L2→L3 的边界本身；item 级**覆盖核查**可行，item 级**寻址核查**不可行。

**S3 — Absent ≠ Unknown。**
Observed：Claim Verification 在模型中**没有载体**（不是"值恰好为 unverified"）；
而 Block Organization 有载体、只是当前不可得。
Consequence：`verification: null` 与 `capability = absent` 是 ontology 层面的不同陈述；
前者已经创造了 carrier。

**S4 — Known Absent ≠ Unverified；Indeterminate ≠ Unsupported。**
Observed：`flowNode.state ∈ {current, changed, target}` 是真实的语义断言，
但 provenance policy 未分类该字段。
Consequence：应显示"Provenance not classified for this field"，而不是"⚠ No evidence"。
后者把"制度还没覆盖到这里"伪装成"该 claim 已被证明没有证据"。

**S8 / S9 — 派生产物与漂移。**
Observed：`docs/source-sections.json` 由原 Markdown 派生，内嵌 `text` 与 `totalLines`
（因此**有 drift-detection 基础**），但**没有 version / hash linkage**。
Consequence：检测到漂移应降级坐标能力；"当前一致"不能推出"历史可复现"。

---

## 4. 高风险且尚无机器保障的边界

见契约 §10。这里只记录为何它们被判定为 High：

| 条目 | 失效形状 | 为什么静默 |
|---|---|---|
| S1 | `t.blockIds \|\| []`（**已存在**，见 2.10） | 用户可见影响为零，直到有 capability 依赖该区分 |
| S3 | `verification: null` / `verification: "unverified"` | 看起来像"没有值"，不报错 |
| S4 | 把 `Indeterminate` 渲染成 "No evidence" | 文案层，不触发任何 validator |
| N6 | `if (rangeContains(...)) evidence.push(...)` | 直觉上"帮用户连起来了" |
| N7 | `if (evidence.type === 'source-verified') claim.verified = true` | 未来数据出现前不会触发 |
| N8 | `if (approved && reviewed && ok) status = 'verified'` | 产品上显得更贴心 |

---

## 5. 与既有文档的关系

- `docs/log/artifacts/F03-hierarchical-architecture/brief.md`（904 行）是 Feature 03 的**交付物与历史证据**：
  `F03.feature.md` 声明"本 feature 交付的不是代码，而是规格"；`F04` / `F05` 的 `scope.docs`
  与判据均建立在其修订版上。因此**不删除**。
  契约 §1.2 的 scoped precedence 只在其范围内取代它的 L0–L3 架构描述。
- `PRODUCT_SPEC.md` / `DESIGN.md` 中较早的分层阅读模型与 L0–L3 认知语义描述同样被
  scoped precedence 覆盖，但**不做同步改写**：立即改写会抹掉架构演化历史并扩大 diff；
  文档去重属独立的文档维护任务。

### 5.1 与 `docs/specs/` 既有三份文档的一致性核查

结论：**`shape-catalog.md` 无冲突**；**`overview-coverage.md` 的覆盖标准与 N7 同向**；
`framework-map-contract.md` 存在**命名分歧（已在主契约 Decision F.1 建立对照表）**。

**（a）coverage 命名收敛。** 三份文档合起来出现过 5 个 coverage 名字：

```text
framework-map-contract §1   A. Framework Coverage / B. Navigation Coverage / C. Semantic Coverage
overview-coverage.md        「Overview 区块覆盖率」
本契约                      Realized Source Coverage / Provenance Assurance
```

其中本契约的 Realized Source Coverage **等于** C. Semantic Coverage（不是第四个概念）；
Provenance Assurance 是唯一真正新增的维度。已在主契约 Decision F.1 建立映射表，并沿用
"任何 coverage 都不得合成一个数字" 的既有纪律。

附带发现：Semantic Coverage 有**两份实现** —— `check-overview.js`（Overview 侧）与
`check-block.js`（stage2 侧，`covered / missing / total / ratio`）。本契约指后者口径。

**（b）N7 不是新发明，仓库早有同向前例。** `overview-coverage.md` 有一张「不许出现的措辞」表：

```text
| `… 即可证明 Consumption` | 把方向写成了结论 | `最低证据方向指向 …` |
```

这正是 N7 / N8 的同一条纪律（**方向、级别、状态不得被写成结论**），且它比本次讨论早得多。
N7 之所以仍是 High risk，不是因为缺规范文字，而是因为**缺机器保障**。

**（c）无冲突的其它重叠点。** `shape-catalog.md` 的「形状由内容结构决定」与 N3 同向；
`framework-map-contract.md` 的 N1–N3 navigation invariants 与 Decision E 同向
（都要求每个 block 至少有一个入口，违规属完整性缺陷而非新类型）；
`overview-coverage.md` 明确说明「Overview 区块覆盖率」**只按区块计数、不代表语义权重**，与 N2 同向。
