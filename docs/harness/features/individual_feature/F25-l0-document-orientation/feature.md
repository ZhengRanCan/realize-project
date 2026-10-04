---
id: F25
title: L0 Document Orientation and Explanation
version: v0.1
status: active
dependsOn: ["F18","F19","F21"]
scope: {"code":["scripts/l0-view-model.js","app/renderer/l0-map.js","app/renderer/l0-layout.js","app/renderer/app.js","app/renderer/styles.css","app/renderer/index.html","app/main/main.js","app/main/reading-bundle.js","app/main/reading-session.js","app/shared/reading-projection.js","app/shared/reading-explanation.*","app/shared/reading-bundle-validation.js","scripts/build-preview.js","scripts/export-reading-bundle.js","scripts/check-map.js","schema/framework-map.schema.json","schema/reading-bundle.schema.json","package.json","app/renderer/l0-map.css","scripts/build-l0-preview.js","samples/context-consumption/*.reading.json","samples/operational-runbook/*.reading.json"],"tests":["scripts/test-l0-view-model.js","scripts/test-l0-layout.js","scripts/test-l0-preview.js","scripts/test-check-map.js","scripts/test-reading-bundle.js","scripts/test-reading-session.js","scripts/test-reading-bundle-projection.js","scripts/test-reading-bundle-preview.js","scripts/test-reading-navigation-electron.js","scripts/test-explore-electron.js","scripts/test-product-maturity-electron.js","scripts/test-l0-orientation*.js","scripts/test-reading-explanation*.js","scripts/test-reading-bundle-electron.js","scripts/test-l1-boundary-view-electron.js"],"docs":["docs/harness/PRODUCT_SPEC.md","docs/harness/ARCHITECTURE.md","docs/harness/DESIGN.md","docs/specs/framework-map-contract.md","docs/specs/reading-view-cognitive-contract.md","docs/specs/reading-view-layer-contracts.md","docs/specs/reading-bundle-contract.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F25-l0-document-orientation/**","docs/log/artifacts/F25-l0-document-orientation/**","docs/harness/features/individual_feature/F23-l1-topic-boundary-view/**","docs/progress.md","docs/harness/incidents/2026-10-04-reading-comprehension-feedback.md","samples/README.md","docs/harness/incidents/*-f25-*.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["打开资料包 → L0 理解文章核心问题、关键对象和整体结构","选择节点/关系 → 阅读具体含义和依据 → 选择能解决当前疑问的 Topic","独立 Map / 旧包 / 缺解释输入 → 明确能力缺失且保留结构与导航","L0 → L1 → Back 恢复选择/滚动/焦点；真实窄窗口和只读 Preview"],"integrationEvidence":[],"knownUnverified":["实施进行中；新解释协议、展示及真实界面回归待验证","独立代码审查与用户实际阅读理解尚未验收"],"humanReviewRequired":["用户在不打开原文的情况下，能说明文章讨论的问题、主要对象及其连接含义，并知道下一步选择哪个 Topic"]}
---

# F25 L0 Document Orientation and Explanation

## Goal

读者第一次打开文章时，能通过 L0 明白本文讨论什么、关键对象是什么、它们怎样连接，以及有哪些问题值得进入 Topic 深入阅读。框架图与解释共同支持整篇定位；点击后的内容应增加理解，而非仅重复箭头关系。

## Process preconditions

- 用户于 2026-10-04 明确授权新建 L0 feature，并更新原 L1 feature；随后要求完成 L0 feature。当前唯一 active，书面设计已确认，实施计划已获确认，开始 Native 实施。
- [书面设计](../../../../log/artifacts/F25-l0-document-orientation/view-design.md)已获用户于 2026-10-04 确认（“可以，按你说的推荐那种来”），采用 Map 可选 readingGuide。[实施计划](../../../../log/artifacts/F25-l0-document-orientation/drafts/implementation-plan.md)已获用户确认（“可以，做吧”）；沿用 Native。先同步规范，再按计划实施。
- 用户验收反馈见 [记录](../../../incidents/2026-10-04-reading-comprehension-feedback.md)。已有 L0/F23 图形、导航和数据测试属于技术基线，不证明本 feature 的阅读效果。
- F18 输入/原文绑定、F19 导航、F21 键盘/窄窗口作为强制基线；不依赖 blocked 的 F08/F17/F23，避免通过新 feature 形成关闭循环或冒称旧视觉验收通过。
- 实施前明确并确认展示设计、解释资料载体/来源/绑定、兼容策略和实施计划。书面设计已经确认，实施计划已经确认；不能将设计批准视为实现或阅读验收通过。

## Scope

### Allowed changes

- L0 的文档定位、核心问题/命题与范围提示、框架图的必要阅读说明；以已有或显式提供且有依据的信息为准。不能强迫没有中心命题的原文产生一个命题。
- 节点的短解释与完整披露：它是什么、在本文中承担什么职责；关系的具体含义、必要条件和边界。关联集合仍可核查，但不能充当解释正文。
- Topic 入口帮助读者判断“这个主题回答什么问题”，说明它与当前文档/焦点的联系；保留全部 Topic，不按数组或编号制造阅读先后、唯一归属。
- 共享解释资料的规范、可选载体和显式绑定由本 feature 先设计；F23 负责 L1 消费与主题表达。没有可用依据时披露缺失，不让 renderer 自行编写解释。
- frontmatter 的 code/tests 是候选实施范围，不要求修改全部文件。若设计确认需要可选 Map 字段或 manifest 绑定，先更新对应 normative 契约、兼容规则和具体文件范围，再改 schema/validator/runtime；保留当前 L0 输入约束，不能直接偷偷消费 Plan。
- Electron/Preview 共用确定性展示与解释投影；保护独立 Map、旧包、Back/Resolve、Source、Explore、键盘、窄窗口及只读行为。

### Out of scope

- L1 局部解释布局和主题摘要（由 F23 修正）、L2 单 Block 页面（F24 后置）、L3/Explore 语义扩张。
- 把整篇正文或所有 L2 区块搬进 L0；用固定 what → how → prove → boundary 替代文档级框架，或把所有文章强行画成流程。
- 推断缺失关系/成员/顺序/中心结论；把概念递进、布局或共同出处变成因果/流程关系。
- 用相同 SU 字符串、标题、目录或文件名猜 Map 与 Plan 的身份对应；解释存在不升级为 source-verified、claim verification 或设计已批准。
- 改写原文、已有 Gold/Plan/Generated/Map、历史实验和用户审核；打开资料包时调用模型；本登记不授权外部模型运行或新生成实验。
- 全局视觉改版、仓库搬迁、私有导航栈、自动保存人工审核。

## Acceptance Criteria

- [ ] 首次进入 L0，可见有依据的文章定位/核心问题及必要范围提示；缺少明确命题时忠实披露，不能伪造作者结论。
- [ ] 框架图仍显示现有完整对象与关系；关键对象的含义、职责与主干连接能被读者理解，不能只靠英文名称和通用关系词。
- [ ] 选择节点或关系后披露具体语义、条件/边界及来源依据；内容增加理解，不只是重新列 incoming/outgoing 或重复箭头。
- [ ] Topic 入口让读者知道深入后能回答什么问题；完整入口集合、多 Topic 和未知/空状态保留，无隐含 owner 或虚构顺序。
- [ ] 解释资料与 Map/文档身份显式绑定，不能隐式串接 Map/Plan SU；缺失、不可解析、配对失败和漂移分别按协议处理，不能显示为已核实解释。
- [ ] 独立 Map 不依赖 Plan 可用性；旧 Map/旧包和缺解释输入仍能阅读结构并明确解释能力缺失。解释相关新字段保持已确认的兼容性，不放宽现有验证口径。
- [ ] 不制造中心命题、关系或归属，不将整篇正文/所有 Block 铺到 L0；概念型及过程型文章均有适合其既有语义的定位方式。
- [ ] 身份/当前选择、Back/Resolve/Source/Explore 与会话隔离保持；Tab/Enter/Space、640×720、长文本、真实便携只读 Preview 通过。
- [ ] 公共样本至少包含 context-consumption 和一篇不同类型文章；对照原文核查解释依据、重要边界与 Current/Target，不能只验证 HTML 存在。
- [ ] 用户不打开原文，可以复述文章核心问题、主要对象及连接含义，并说明会选择哪个 Topic 继续看；结果记录日期/输入/实际判断。
- [ ] 设计、受影响单元/集成/兼容检查、独立审查和实际用户验收完成；合同/index/progress 同步后才 passing。

## Risks and compatibility

- 解释不足既可能来自展示，也可能来自输入资料没有承载定义。具体载体在设计中确定，不能凭现有 ID 字符串直接复用另一命名空间的信息。
- L0 的 Map 输入与解释载体扩展必须先对齐 Layer Contracts 和 bundle contract；不把 schema 候选范围当作提前批准新协议。
- Shared data/projection 改动须同步 F23 合同与 docs/progress，明确所有权和回归；两项共用一份已确认解释规则，不分别实现解析或配对。
- L0 通过不自动关闭 F23/F17 或历史 F04–F08 验收；技术正确、解释忠实与用户读懂分别记录。

## Completion evidence

- [登记与验证记录](../../../../log/artifacts/F25-l0-document-orientation/verification-summary.md)。
- 设计、计划和解释依据按本 feature artifact 保存；代码实现后须有独立审查和实际用户验收。
- 当前 active（实施阶段）；已确认设计、计划和文档门禁不构成产品实现或阅读效果通过。成功校验不保留永久 txt 日志。
