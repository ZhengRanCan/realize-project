# F11 — Current Implementation Conformance Audit

日期：2026-09-29。对象：当前工作目录快照。当前目录没有 Git 元数据，不能给出可核 commit SHA。
本报告只审计，不修改实现，不把尚无能力解释为功能待办；所有结论受下述边界限定。

## 判据与审计范围

Authority：`docs/specs/reading-view-cognitive-contract.md`（umbrella，含 §6 全部 16 行、29 个 invariant）、
`docs/specs/reading-view-layer-contracts.md`（被纳入的层契约）。Evidence Appendix 只用来选探针，不把历史数字当本次结果。

分类严格为：Compliant / Violation / Partially Compliant / Not Implemented / Capability Absent / No Executable Boundary / Needs Inspection。
Compliant 仅表示所列可执行路径满足所列判据，不表示所有未来输入已被机器保护。
Partially Compliant 表示列出的现有部分成立、另有明确缺口；Needs Inspection 表示证据不足以推导更强结论。
Not Implemented 表示有规范定义但当前产品未采纳；Capability Absent 表示模型明确无载体；No Executable Boundary 表示没有可调用的相应语义投影出口。

三层可审性：

1. **产品直接可审（P）**：L0 adapter / renderer、既有 Overview、Review Evidence 与 Source IPC。以代码和内存结构探针为证据；本轮未做 GUI 人工验收。
2. **Stage 2 / 脚本可审（A）**：assembler、check-block、check-map、check-plan、生成预览与 source registry。不会把这些脚本的成功冒充 L2/L3 产品能力。
3. **无边界（B）**：L1 独立路由、Plan LEFT JOIN 的正式 L2、subject-preserving L3、四类名义隔离状态空间、Back/Resolve、Explore。只登记缺口，不设计实现。

证据路由：`../read-only-probes.md` 保存可重跑代码，`../probe-output.txt` 是本次原始输出；
`epistemic-sites.json` / `epistemic-sites.md` 是逐站扫描，不读取历史 feature 合同或历史长验证日志。
探针断言针对字段是否存在、ID/edge 集合、固定字段值；修改的输入均为内存副本，assembler 文件写出被截获到内存。

## 差异矩阵（拆开 §6 组合行，逐个覆盖）

| ID | 状态 | 层 | 结论 / 判据 | 证据 |
|---|---|---|---|---|
| I1 | Partially Compliant | P/A/B | L0 ID 直接来自 map；preview 用 Generated 集合决定可见 Block 存在，未以 Plan 为存在 authority。 | scripts/l0-view-model.js:70；scripts/build-preview.js:64；P2/P6 |
| I2 | Partially Compliant | P/A | 已检查的关联用稳定键，未发现文本/相似度建立跨制品引用；有悬空 HARD，但禁止相似度建桥无专门守卫；不能外推全库不存在。 | scripts/l0-view-model.js:67；scripts/check-map.js:161；scripts/check-block.js:328；app/shared/semantics.js:232 |
| I3 | Partially Compliant | P/A/B | 现有 L0、Plan checker、review lookup 各用自身 ID；未发现 inventory 与 Plan SU 合并。跨 L3 投影命名空间尚无边界。 | scripts/l0-view-model.js:67；scripts/check-block.js:284；app/shared/semantics.js:232；app/main/main.js:81 |
| I4 | Partially Compliant | P/B | element/block 有 DOM anchor，topic 是侧栏 anchor；无通用 Reading resolver，不能宣称 SU/review reference 已有 canonical landing。 | app/renderer/l0-map.js:241；app/renderer/l0-map.js:389；app/renderer/app.js:383 |
| I5 | Violation | A | 缺 Generated 的 Plan Block 在 preview 消失：Generated artifact 可缺块，但 Reading preview 不能以此删除主体入口。 | scripts/assemble-overview.js:85；scripts/build-preview.js:64；P6 |
| I6 | Partially Compliant | A | assembler/FIXED 逐字段有 authority；preview 却读取 generated title/stage/defaultExpanded/reviewObjects，且无独立 authority 校验，不是正式非对称 join。 | scripts/assemble-overview.js:111；scripts/check-block.js:292；scripts/build-preview.js:68 |
| I7 | Compliant | A | 组装固定字段均来自 Plan，Generated 仅填 content；改固定字段 HARD，leaf 外越 HARD。此结论限定产物边界。 | scripts/assemble-overview.js:111；scripts/check-block.js:292；scripts/check-block.js:330；P7 |
| I8 | Partially Compliant | P/A/B | L0 identity 不取决于 block capability；完整跨层性质没有边界，preview 的生成依赖同 I5。 | scripts/l0-view-model.js:70；scripts/l0-view-model.js:104；scripts/build-preview.js:64 |
| S1 | Violation | P | absent blockIds 与 [] 输出相同，结构上销毁 Unknown/KnownEmpty。 | scripts/l0-view-model.js:109；P1 |
| S2 | Partially Compliant | P/A/B | L0 Topic 仍保留；preview 缺 Generated 删除 Block，完整 capability 降级主体保持未成立。 | scripts/l0-view-model.js:104；scripts/build-preview.js:64；P6 |
| S3 | Capability Absent | P/B | Claim Verification 确实无 carrier；现有 Evidence 状态只谈 Evidence，尚无显式 Absent/Unknown 投影边界。不能把无 carrier 写成 unverified。 | schema/design-review.schema.json:18；app/shared/semantics.js:183；P8 |
| S4 | No Executable Boundary | B | 没有 claim 状态或 field-level ProvenanceAssurance 投影；不能用 evidenceStatus 的 No evidence 文案证明 flowNode.state 被标 Unsupported。 | scripts/check-block.js:157；app/shared/semantics.js:183；app/renderer/app.js:651 |
| S5 | No Executable Boundary | A/B | checkBlock 接收已提交 expression，不是 Missing/Unknown capability API；直接缺 content 会抛错，不能把它报成实际显示 0%。Coverage Unavailable 出口不存在。 | scripts/check-block.js:277；scripts/check-block.js:379；P3 |
| S6 | Partially Compliant | P/A/B | evidenceStatus、人工 review status、generation.verdict 分开使用，未合成为 claim verified；跨层名义状态边界不存在。 | app/shared/semantics.js:183；app/shared/semantics.js:477；scripts/assemble-overview.js:127；P8 |
| S7 | Partially Compliant | P/A | blockIds 编码在 schema 可区别但投影折叠；Evidence required array 无 Unknown；role 缺省有 Stage 2 prompt 明文，不因 optional 就造 Unknown。 | schema/framework-map.schema.json:213；schema/design-review.schema.json:756；ai/stage2-blocks.prompt.md:171；P1/P10 |
| S8 | Not Implemented | P/A | registry 从源生成，当前逐节 text 一致；source:load 不检测源变化，没有 drift 报告/降级逻辑。当前一致不能证明变更后的行为。 | scripts/extract-source-sections.js:38；app/main/main.js:360；P9 |
| S9 | Partially Compliant | P/A | registry 无 hash/version；已审显示路径未声称历史可复现。当前一致性探针只证明当前快照。 | scripts/extract-source-sections.js:84；app/renderer/app.js:567；P9 |
| N1 | Violation | P/A | L0 数组 tie-breaker 是布局，可保留；但 Stage 2 preview 把 Plan 首现 stage 顺序作为四段阅读顺序，反转 Plan 即反转阅读顺序。 | app/renderer/l0-layout.js:170；scripts/build-preview.js:61；app/renderer/app.js:503；P5 |
| N2 | Compliant | P | 所审 L0 权重/层/角标仅改变表示和位置；保留全体 ID/edge，不生成 semantic importance 字段；不评价人工视觉效果。 | app/renderer/l0-layout.js:172；scripts/l0-view-model.js:122；P2 |
| N3 | Compliant | A | ID 与 shape 分字段来自 Plan；shape 只约束 content.type，不从 stage 推导 shape；kind 防混入视觉词。 | scripts/check-block.js:292；scripts/check-block.js:312；scripts/check-plan.js:475 |
| N4 | Partially Compliant | P/B | L0 element.topics 反向多对多，未把元素移入排他 Topic；L1 boundary 尚无运行出口。 | scripts/l0-view-model.js:103；app/renderer/l0-map.js:398 |
| N5 | Needs Inspection | P/B | L1 crossing 分类未实现；L0 对所有边用 Incoming/Outgoing 与箭头，包括 relates-to 的泛型分支。存在把存储方向误读为语义方向的风险，但不能把 L0 面板直接冒充已实现 L1 crossing。 | scripts/l0-view-model.js:81；app/renderer/l0-map.js:121；app/renderer/l0-map.js:176 |
| N6 | No Executable Boundary | P/B | Source 只显示 section，Evidence 只显示其父对象字段；未找到 range overlap→supports 链接。没有 L3 联结出口可证明反诱惑保持。 | app/renderer/app.js:558；app/renderer/app.js:651；app/shared/semantics.js:232 |
| N7 | Compliant | P | source-verified 仅计入 Evidence namespace 并描述这些 evidence；不创建 claim verified 字段。探针含未来 source-verified 输入，不仅依赖当前 fixture 单值。 | app/shared/semantics.js:171；app/shared/semantics.js:199；app/renderer/app.js:637；P8 |
| N8 | Partially Compliant | P/A/B | 人工 Gate/evidence/generation 各自输出，没有合成 claim verification；正式 L3 状态边界无机器保护。 | app/main/main.js:131；app/shared/semantics.js:183；scripts/assemble-overview.js:127 |
| N9 | Partially Compliant | P/A/B | provenance walker 生成 ephemeral path，不生成 evidence/id；产品未消费 fragment-local sourceUnitIds 作 inspection，不能声称 L3 fragment 能力已存在。 | scripts/check-block.js:161；app/renderer/app.js:194；app/renderer/app.js:651 |
| N10 | Partially Compliant | P/A/B | 现有 map validator 诊断孤立入口，不改 Block type/identity；preview 不实现独立于 occurrence/generated 的 fallback。 | scripts/check-map.js:268；scripts/build-preview.js:64 |
| N11 | Violation | P/A | registry/Overview 正确保留 section range；但任意 L0 文档的 §N 都进入固定单文档 registry，丢失文档 identity。不是解析器错误。 | app/renderer/app.js:1031；app/main/main.js:38；app/main/main.js:360；app/renderer/app.js:558；P9 |
| N12 | Compliant | P/A | reviewObjects 按关联键展示，relatedGaps 走显式/反向外键；没有从关联生成 supported-by/approved-by。限定现有消费者。 | schema/overview-plan.schema.json:187；app/renderer/app.js:413；app/shared/semantics.js:232 |

## 起点六问与 Decisions

| ID | 状态 | 判定 | 证据 |
|---|---|---|---|
| Q1-S1 | Violation | 三输入变两输出；F12 只需修复这一确证的投影状态损失，并处理其消费者假设。 | scripts/l0-view-model.js:109；app/renderer/l0-map.js:399；P1 |
| Q2-S7 | Compliant | 实码不是 ?? normal，而是 ambient 三元；Stage 2 prompt 明示非 ambient 填 normal。Plan schema 甚至不允许 block.role；因此不能把正常缺省当 Unknown。层合同所说“待核实”在本轮获得文本依据，但不改冻结规范。 | scripts/assemble-overview.js:116；ai/stage2-blocks.prompt.md:171；schema/overview-plan.schema.json:137；P10 |
| Q3-S5 | No Executable Boundary | Missing 有 generation.missingBlocks 编码；checkBlock 缺 content 抛错，无 Unavailable API。合法 Plan covers 至少一项，非法空 covers 得 ratio=1 仅是边界观察，不登记线上 0/0 违规。 | scripts/assemble-overview.js:169；schema/overview-plan.schema.json:174；P3/P4/P6 |
| Q4-C | Violation | stage 数组首现顺序被当阅读顺序，未独立表达 what < how < prove < boundary；只改布局排序不等于修复规范边界。 | scripts/assemble-overview.js:138；scripts/build-preview.js:61；P5 |
| Q5-I2 | Partially Compliant | 已审消费者没有标题/文本相似度建引用：L0 用 ID、preview 用 O-id、review 用显式相关键；文本切分标题是展示、source heading 解析是坐标规则，不是建立语义关系。结论限定所列文件，不声称整个仓库无此代码。 | scripts/l0-view-model.js:67；scripts/build-preview.js:57；app/shared/semantics.js:232；scripts/extract-source-sections.js:49 |
| Q6-N9 | Partially Compliant | sourceUnitIds 被 checker 当 provenance/coverage，非 evidence；Evidence UI 只读 review-object evidence；未发现 provenance 自动提升 Evidence 的路径；fragment inspection 尚不存在。 | scripts/check-block.js:324；app/renderer/app.js:651；schema/design-review.schema.json:856 |
| Decision-A | Not Implemented | 没有 Explore Focus / relation-model 产品边界；现有 L0 高光不是 Explore。 | app/renderer/l0-map.js:542；app/renderer/app.js:1021 |
| Decision-B | Not Implemented | DOM anchor 存在；Back navigation stack 与 CanonicalReadingResolver 不存在于已审入口。不能把 DOM 选择动作称 Resolve。 | app/renderer/l0-map.js:241；app/renderer/app.js:383；app/renderer/l0-map.js:542 |
| Decision-D | Partially Compliant | assembler 保留 missing / failed / present verdict；preview 的 block 映射遗漏 generation，单块 generation integrity 没有稳定 disclosure。 | scripts/assemble-overview.js:98；scripts/assemble-overview.js:127；scripts/build-preview.js:68 |
| Decision-D1 | No Executable Boundary | flowNode.state 存在，walker 不给该字段独立 provenance policy 分类；无 field-level Indeterminate 投影。不要替它创建 Unsupported。 | scripts/check-block.js:182；scripts/check-block.js:438；schema/stage2-block.schema.json:66 |
| Decision-E | Partially Compliant | map 验证入口完整性，但 orphan canonical fallback 未实现；不能让 Generated 缺失伪装成不存在。 | scripts/check-map.js:268；scripts/build-preview.js:64 |
| Decision-F | No Executable Boundary | 现有 checker 是有效 expression 的 set coverage，缺 Missing/Unknown/Empty Scope 的产品出口；未发现把 ratio 写回 canonical Plan/Generated。审计报告的测量快照不是 canonical capability。 | scripts/check-block.js:364；scripts/check-block.js:379；scripts/assemble-overview.js:151；P3/P4 |

## 违规清单（只列确证项）

1. **D01 / S1**：L0 投影把 topic.blockIds absent 折叠为 []。P1 是字段有无的直接反例。归 F12；F11 不修。
2. **D02 / I5、S2**：Stage 2 preview 只遍历 Generated blocks；缺失生成的 Plan 主体入口消失。P6 + preview:64 是生产代码组合证据。assembler 的 Generated 集合少一块本身正确，应保留。
3. **D03 / Decision C、N1**：preview 的 stage 顺序随 Plan 物理数组反转（P5），没有独立 normative order。check-overview:156 的物理顺序一致检查不能替代阅读顺序定义。
4. **D04 / N11、文档身份保持**：Fixture E 的 §1–§11 与固定 registry 同名但不同文档；L0 Source 回调只传 ref，加载固定 registry（P9）。修复对象是消费边界，不是已正确的源解析器。
5. **D05 / Decision D disclosure**：preview 丢弃单块 generation metadata，renderBlock 没有其稳定 disclosure；不能以顶层 generated metadata 替代逐块 capability。证据：scripts/build-preview.js:68；app/renderer/app.js:382。

其余部分合规、缺少实现、能力已知不存在和无边界项均不自动进入“必须新增功能”清单。
N5 的方向呈现保留为 Needs Inspection；F11 没有将它升级为已证实的 L1 crossing 违规。

## 已正确、不要动

| 机制 | 状态 | 现有守卫 / 边界 |
|---|---|---|
| Plan 固定字段注入 | Compliant | scripts/assemble-overview.js:111；scripts/ai-block.js:422；P7 比较 21 blocks × 8 字段。AI 只补 content。 |
| FIXED hard fail | Compliant | scripts/check-block.js:292，逐字段 JSON 值比对。不是要求重写 assembler。 |
| 悬空外键 HARD | Compliant | scripts/check-map.js:161、174、232；scripts/check-block.js:328。引用全集不可得时 skipped，不硬说每个引用不存在（check-map:137）。 |
| leaf ⊆ covers | Compliant | scripts/check-block.js:330；scripts/check-overview.js:223。保持 envelope 边界，不将 leaf 用作新增 membership。 |
| Source section parser | Compliant | scripts/extract-source-sections.js:38、73；P9 当前 16 节文本逐节一致、保留 document + range。跨文档消费问题不能借机重构 parser。 |
| Framework-map ontology | Compliant | schema/framework-map.schema.json:124；scripts/check-map.js:121、173、184。type/relation 封闭、role controlled-but-extensible、attachment 与 edge 分开。 |
| L0 identity 与 edge 保持 | Compliant | scripts/l0-view-model.js:70、87；P2。布局只改变位置/角标，不能为修 S1 重切语义集合。 |
| Evidence 的两态集合 | Compliant | schema/design-review.schema.json:756；app/shared/semantics.js:171；P8。required evidence=[] 真是 Known(0)，不可“统一三态”而发明 Unknown。 |

## Epistemic-collapse 站点裁定

独立清单见 `epistemic-sites.md`，机器数据见 `epistemic-sites.json`：9 个明确指定边界文件、269 次匹配，含同一行不同列。
regex 覆盖逻辑/空值数组、数值零、normal 与否定 if；额外定点核实 role 三元。扫描不是 whole-repo 完备性证明。

**仅一个确证 S1 backlog 站点**：scripts/l0-view-model.js:109。其真实 carrier 是契约明示三态的 topic.blockIds。
其他站点逐项写明合法 fallback 判据：required 合法集合、已知局部计数、shape 专属数组、控制流、显式来源路径或诊断输出。
尤其 check-map 对 blockIds 的遍历/入口数只计已声明引用，不写回 TopicOccurrenceState，不能因为用了同一个字段名就报同一个 collapse。
sourceUnitIds 的未枚举字段需区分“未被检查”，不是给所有 fallback 加 Unknown。

## 无边界清单（只命名，不设计 B1）

- KnowledgeState / CapabilityAvailability / GeneratedExpressionState / ProvenanceAssurance 的显式、名义隔离边界：umbrella §5.5；现有模块只提供零散产物字段。
- 正式 Plan-authoritative L2 join、Missing/Unknown 时的 coverage availability、field-level provenance policy：check-block:277 接收的是 expression，P3 不能承接 capability 缺失。
- L1 focused-topic boundary classification 与 L3 subject-preserving inspection：产品 app:1021 是 L0 高光，app:651 是 review evidence 列表，均不能冒充独立层。
- Back/Resolve 与跨投影 identity preservation：已有 DOM anchors，不存在 ReadingAddress / resolver API 于已审产品入口。
- Claim Verification：**Capability Absent**，不是“待加功能”；Fragment durable identity / Topic canonical route / Explore 为 deferred，不能以审计之名补造。

## 限制与关闭条件

本轮未修改 runtime/schema/validator/fixture/spec；未开始 F12–F15。
本报告不会把原有测试全绿当所有契约已符合。
verification.md 要求新增 scripts 目录报告校验器，与用户只读要求及 F11 scope 冲突：本轮采用文档内只读校验命令，未静默修改合同要求。
人工 reviewer 随机复核 3 条与用户验收尚待记录；在此之前不能标 passing。
完整原始门禁输出与环境阻塞记录见 `../verification-summary.md`。
