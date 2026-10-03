# Reading Bundle and L3 Runtime Design

## Status and Authority

- Date: 2026-10-03.
- Status: Proposed；用户已选择资料清单方案，本文件等待书面设计审阅。
- Owner: F18；包含使 F18 能运行的 F16 输入补齐，不扩展到 F19 / F20。
- 本文件是实施设计稿，不是第二份 Reading 规范。认知规则仍以
  [Reading Cognitive Contract](../../../specs/reading-view-cognitive-contract.md) 与
  [Layer Contracts](../../../specs/reading-view-layer-contracts.md) 为准。
- 用户要求：打开一份清单就选齐配套资料；相关文件放在同一个分析文件夹；整理文档和位置说明。

## Goal

用户打开一份资料清单，软件加载同一次分析的原文、规划、生成表达和审阅资料。
用户从任意 Plan Block 查看它覆盖的语义单元、对应的原文章节，以及独立的审阅对象和 Evidence。
缺失与不一致有明确提示；查出处不产生设计正确性或 claim-level verification 结论。

## Existing Gap

当前主进程只消费 design-review 的旧 Overview，L2 输出没有 Plan.covers 与 sourceUnits。
Source 回查固定读取仓库里的 source registry。F18 helper 尚未接入 IPC / renderer，且悬空 review ID
会被静默过滤。F16 的既有迁移证据保留，本轮补齐它未实现的 Plan + Generated 输入能力。

## User Flow

1. 开发者或生成流程明确提供本次分析的输入，离线导出一个 Reading Bundle。
2. 首屏增加“打开分析资料包”；用户只选 reading-bundle.json。
3. 主进程完成配对检查，再一次性切换当前分析。失败时保留原来的分析和人工审核内容。
4. 总览仍按 what → how → prove → boundary 展示；Block 的存在、标题、stage、shape 与覆盖关系来自 Plan。
5. Block 提供“查出处”入口。右侧 inspection 面板分别展示原文来源、相关审阅材料、生成状态。
6. 点某个语义单元，显示其 statement 与所在章节范围；关闭面板恢复进入时的阅读位置和展开状态。
7. 有 provenance 的 visual fragment 可查看本次渲染位置的来源；其主体仍为父 Block，不生成永久 ID。

## Folder Contract

每次分析一个文件夹，建议位置为 bundles/<document-id>/<analysis-id>/。
document-id 来自 design.id；analysis-id 由导出调用方明确指定，重复导出不能静默覆盖同名文件夹。

```text
<analysis-id>/
├── reading-bundle.json       # 用户打开的入口
├── source.md                 # 该次分析的原文快照
├── design-review.json        # 审阅对象及 Evidence
├── overview-plan.json        # Plan Block 与 sourceUnits
├── overview.generated.json   # Generated Expression；尚未生成时可不提供
├── source-sections.json      # 从同目录 source.md 解析出的章节范围和文本
├── framework-map.json        # 可选；仅接入同一文档的已有 L0 / L1
└── human-review.json         # 用户显式点击保存后才产生
```

所有运行时资料在同一个分析目录。清单中的路径以清单所在目录为基准，可随整个文件夹搬迁。
用户生成的 bundles 与 human-review 不进入 Git；测试在临时目录生成包，仓库保留构造数据和导出命令。
原始 fixture、实验 run、失败记录和历史证据保留原位置；整理通过导出产品资料完成。

## Manifest Contract

清单版本为 bundleVersion = 1。字段包括 documentId、analysisId、files。
files 中每个资料条目包含 path 与 sha256；source、designReview、plan、sourceSections 必填，
generated 与 frameworkMap 可选。human-review 是包目录中的独立可写文件，不属于不可变资料清单。

清单是运行时文件定位的唯一入口。路径使用目录内相对路径；拒绝绝对路径、URL、越界路径及
通过 symlink / junction 跳出目录的实际路径。普通目录内文件名可变，不能靠猜文件名补齐条目。
旧产物内部的 designRef.path、generation.planPath 等仅作生成来源记录，运行时不跟随它们读文件。
导出保持已有 Plan / Generated 的原始字节，从而保留 generation.planSha256 的既有配对意义。

导出是纯离线动作：明确提供输入路径，不调用模型、不搜索“看起来像配套文件”的邻居文件。
在新临时目录中完成复制、registry 生成、校验和 read-back 后才提交整个包；失败不覆盖已有包。
Stage 2 装配流程提供显式的包导出选项，并调用同一导出实现；开发者不必再次逐项选择文件。
已有 run 可用独立导出命令打包。现有默认装配命令兼容保留。

## Validation and Degradation

| Condition | Behavior |
| --- | --- |
| 清单版本、必填资料、JSON / Schema、路径或文件 hash 不合法 | 拒绝切换分析；指出具体文件和原因 |
| design.id、plan.designRef.id、Generated document.id 或 Map document.id 不一致 | 拒绝配对；不解释为某块无出处 |
| Generated generation.planSha256 与所选 Plan 原始字节 hash 不一致 | 拒绝配对；不得覆盖或重新计算旧绑定来掩盖问题 |
| SU、Block、review object、section label 重复或引用悬空 | 明确报告 integrity 错误；不 filter(Boolean) 静默丢失 |
| generated 条目没有提供 | GeneratedExpression = Unknown；Plan Block 保持可见，仍能 inspect Plan 来源 |
| 已提供完整 Generated 文件，但某个 Plan Block 没有对应表达 | 该 Block 为 Known Missing；保留主体，coverage 为 Unavailable |
| Generated 本身结构非法、冒用 Plan 字段或出现额外主体 | 报告生成资料 integrity 错误；拒绝把非法内容当成展示输入 |
| 未提供 frameworkMap | Topic occurrences 为 Unknown；不伪造 Topic，不借用之前打开的 Map |
| review object evidence 明确为 [] | Known(0)，显示“没有 Evidence”；字段没有 carrier 时保持相应状态 |
| 原文变化、registry 文本与当前原文范围对不上 | 降级 source-coordinate 能力并提示漂移；不能沿用旧行号 |

registry 从实际原文派生，采用已有 section parser 规则，校验 label、范围、文本及原文内容指纹。
仍只保证现有 parser 已支持的章节形式；不在本轮推广为任意 Markdown 的通用语义解析器。
只有整包重新导出并完成校验，新的源文本与 registry 才成为同一次分析的配套快照。
文件 hash 只证明包内内容一致性，不证明模型理解忠实，也不宣称旧实验拥有历史版本追踪。

Schema、check-plan、check-block、check-overview 的既有规则继续使用。将其中需要多输入的验证
上下文显式注入，并提取可复用检查，供 CLI、导出和 runtime 共用；旧 CLI 默认输入与 verdict 口径保留。
配对失败与生成缺失分开处理：前者没有建立可信 session，后者是可信 Plan 主体上的能力降级。

## Projection and Inspection

- 主进程负责读文件、校验和 session 切换；preload 传递最小 API；renderer 不读文件、不补语义关系。
- L2 按 Plan Block LEFT JOIN Generated 投影；Plan 权威字段不被 Generated 覆盖。
- Generated 的 content 与 fragment-local sourceUnitIds 属于表达侧，沿用既有 shape 与 provenance policy。
- Generation verdict、realized coverage、provenance assurance 分别保留状态与 disclosure，不能合成“可信分数”。
- L3 entity path：Block.covers → sourceUnits[id] → section label → 当前包 registry 的 range / text。
- L3 review path：Block.reviewObjects → review object → 该对象的 Evidence；relation 为 related-to。
- 两条路径分别展示；章节重叠不推出 Evidence 支持某个 SU。
- SU 只定位到 section range，不搜索 statement 来伪造 exactLine；Evidence 自己已有的坐标仍标明其来源。
- Claim verification capability 恒为 Known Absent；不出现 Verified / Unverified / Approved 汇总结论。
- ProvenanceAssurance = Indeterminate 必须保留；不存在证明不能被渲染成已经证伪。
- fragment 仅为当前 render-session 的临时 inspection context，没有深链、评论锚点或 Explore Focus。
- L3 Close / Back 恢复 origin render context；不在本轮建设 F19 的完整 canonical resolver。

打开另一份包时清空旧 source cache、L3 inspection 与 Map 上下文。人工审核读取路径随包切换，
默认保存到当前包的 human-review.json；只有用户点击保存才写入，分析文件不可被审批状态污染。
独立 legacy design-review / L0 打开入口保留，并明确其缺少资料包时的 inspection 能力，不能猜测配套 Plan。
静态 Preview 走同一 projection / inspection 逻辑；文件加载由 Preview 数据注入替代，不复制 renderer。

## Delivery Sequence

1. 细化 F18 feature / verification；记录 runtime 输入 incident 与共享模块 scope 扩展。
   建立一个当前失败的真实输入测试，不把新方案提前记为已实现。
2. 建立清单 Schema、目录内读取器、配对验证与离线导出；先证明“只开清单，整组资料能加载”。
3. 回补 F16 的 Plan + Generated L2 路径，保住主体、状态、四段顺序和旧展示兼容性。
4. 接入 L3 两条 inspection 路径及 fragment-local 来源；完成关闭 / 返回与包切换。
5. 整理入口说明、资料目录说明、feature 证据和实际示例；执行回归与独立审查。

F18 在全流程完成、必要人工路径或真实 Electron 集成证据、独立审查和 harness 门禁满足后才能 passing。
F19 继续等待 F18；F20 / F21 保留各自范围。本轮不把既有 F16 证据重写成未发生的 Plan + Generated 验收。

## Documentation Ownership

| Document | Responsibility |
| --- | --- |
| 本文件 | 待审阅实施设计；审阅后保留为 F18 决策证据 |
| F18 feature.md / verification.md | 本轮允许改动范围、验收标准与必要命令 |
| ARCHITECTURE.md | 正式加载边界和模块职责 |
| 新增 reading-bundle-contract.md（specs） | 清单字段、配对和目录规则的唯一规范正文 |
| DESIGN.md | 打开资料包、inspection 和返回的产品交互 |
| README / 初始化契约 | 使用与导出命令，链接到规范正文，不复制规则 |
| progress / feature-index / verification-summary | 当前状态与真实验收证据 |
| Cognitive Contract §6 | 只更新本轮有机器保障证据的对应 cell |

不建立另一套 superpowers 文档目录；设计和计划归入现有 F18 artifact 目录。
文档标题、字段名采用英文，解释正文采用中文；历史记录与当前规范继续分离。

## Acceptance and Verification

- 离线导出一个真实现有 run；打开单个清单即可加载同目录资料，移动整个目录后仍可打开。
- 两份不同文档且使用同样 SU / §N 编号的包轮换加载，确认 Source、Map、Evidence、人工审核均不串包。
- 清单中缺文件、坏 hash、错版本、越界路径、错误 doc ID、错 Plan hash、重复/悬空 ID 均有负向测试。
- Generated Unknown / Missing、明确 evidence []、generation FAIL / warning、Indeterminate 均有结构断言。
- Electron 通过真实 preload → IPC → projection → renderer 操作“打开包 → Block → SU → section”，
  再单独展开 review object Evidence，并恢复 origin 阅读上下文。
- 用当前 fixture 的 legacy 路径确认已有展示、审批、Gate 与单独 L0 / L1 不退化。
- 静态 Preview 检查共用 renderer 和新的 L2/L3 入口。
- 新增 suite 纳入 test:all；执行 selftest、check-overview、check:docs、verify:harness。
- 涉及实验索引时执行 check:experiments；不修改或清理历史 run。
- 输出独立审查、命令记录和范围明确的验收结论，不把 metadata 全绿等同于路径完成。

## Design Review Checklist

- [x] 单入口加载与同目录整理覆盖用户已确认的选择。
- [x] 目录位置、命名、定位 authority、失败行为、人工审核写入时机明确。
- [x] 核查路径与 claim verification 分离，Plan authority 与所有缺失状态保留。
- [x] 兼容旧入口、生成流程、历史路径和证据，不迁移历史 run。
- [x] 规范、设计、执行记录各有唯一归属；不额外铺开文档体系。
- [x] 真实操作和跨包负向路径列入验收，不仅测试 helper。
- [ ] 用户完成本文件审阅；随后编写具体实施计划并进入开发。
