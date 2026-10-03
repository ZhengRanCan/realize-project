---
id: F24
title: L2 Independent Block Reading View
version: v0.1
status: not_started
dependsOn: ["F23","F16","F18","F19","F20","F21"]
scope: {"code":["app/shared/reading-projection.js","app/renderer/app.js","app/renderer/reading-navigation.js","app/renderer/index.html","app/renderer/styles.css","app/main/main.js","scripts/build-preview.js","package.json","app/renderer/l2-block-view.*"],"tests":["scripts/test-reading-runtime.js","scripts/test-reading-navigation-electron.js","scripts/test-reading-integration.js","scripts/test-reading-integration-electron.js","scripts/test-explore-electron.js","scripts/test-product-maturity-electron.js","scripts/test-reading-bundle-preview.js","scripts/test-l0-preview.js","scripts/test-l2-block-view*.js"],"docs":["docs/harness/DESIGN.md","docs/harness/ARCHITECTURE.md","docs/specs/reading-view-cognitive-contract.md","docs/specs/reading-view-layer-contracts.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F24-l2-block-reading-view/**","docs/log/artifacts/F24-l2-block-reading-view/**","docs/harness/features/individual_feature/F16-l2-runtime/**","docs/harness/features/individual_feature/F17-l1-runtime/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["L1 → 关联 Block → 单独 L2 → L3 → Back → L2 → L1","Explore → Open in Reading(Block) → 单独 L2 → Back 恢复 Explore","缺 Generated/缺表达、无 Topic occurrence 的有效 Block 仍可打开"],"integrationEvidence":[],"knownUnverified":["L2 目前在整篇 Overview 中定位区块，尚无独立区块阅读视图","独立视图的可理解性、返回/Explore/L3 组合路径尚未验收"],"humanReviewRequired":["用户查看代表性的 L2 流程/对照等内容，确认只展开当前解释单元且视觉表达便于理解"]}
---

# F24 L2 Independent Block Reading View

## Goal

用户从 L1 的区块入口或 canonical Block resolver 进入 L2 后，阅读范围真正缩小到当前 O-xx 解释单元。显示该单元已有的视觉表达、必要上下文及核查入口，替代“跳到整篇旧 Overview 并展开其中一块”的主阅读路径。

## Process preconditions

- 用户于 2026-10-03 批准 F23/F24 的拆分；本轮只登记合同，详细页面设计与实施计划在实现前完成。
- F23 先完成并验收，随后 F24 组合 L1 → L2 → L3 的阅读体验。
- F16/F18 的 Plan LEFT JOIN Generated 投影、F19 导航、F20 Explore 和 F21 键盘/窗口回归作为强制基线。
- 依据主契约 Decision B–F、Layer Contracts §3、shape-catalog 与 harness DESIGN；不把独立页面改动解释为重开 identity/authority 规范。
- 反馈记录与 F16 数据接入完成边界在 [incident](../../../incidents/2026-10-03-l1-l2-reading-gap.md)。

## Scope

### Allowed changes

- 独立 L2 renderer、必要布局样式与导航适配；优先复用已有 flow/matrix/compare/steps 等受控表达 renderer。
- 主路径只渲染当前 Block，保留唯一 canonical `#block-<id>`；必要上下文按需披露，不渲染整个 Overview 后只靠滚动定位。
- 展示 Block 标题、文档/来源、当前 origin Topic（有时）、generation/coverage 和核查入口；状态仍来自 projection。
- L1 和 Explore 的 Block 打开动作复用同一 resolver/地址与共享栈；L3 fragment inspection 复用已有父 Block 上下文。
- Electron/Preview 共用实现；将旧“整篇 Overview”回归与新的“单 Block 阅读”回归分清，更新原测试的适用范围。

### Out of scope

- 强制所有内容变成关系图；新增形状词、模型生成内容或重新切分 Block。
- 修改 Plan/Generated/Map/source 的 authority、identity、schema、validator 或缺失状态语义。
- 将 Topic 变成父级 owner；为 orphan Block 伪造归属；新增按编号的 Next/Previous 叙事顺序。
- 第二套导航栈、fragment durable identity、L3/Explore 能力扩张；删除旧 Overview 数据或无关旧功能。
- 单独重新调用模型、仓库搬迁、自动保存人工审核。

## Acceptance Criteria

- [ ] 从 L1 进入 Block 时，只呈现当前解释单元的主体内容；不同时渲染其余所有 Block 和整篇四阶段总览。
- [ ] 当前 Block 的已有受控表达完整保留，按已有 content 类型展示流程、矩阵、对照、状态等；缺表达不造图，不要求所有内容画成同一种图。
- [ ] 标题、唯一 O-xx identity 和可见可聚焦的 canonical anchor 保持；Plan 定义存在/语义范围，Generated 仅贡献表达，输入不被修改。
- [ ] 页面清楚标明 L2、当前解释单元与返回位置；从 Topic 进入保留 occurrence，从其他入口进入不冒充 Topic 归属；所有真实 Topic occurrences 可按需披露。
- [ ] stage 作为已有语义上下文保留；四段规范顺序只在跨 Block 的阶段组织中适用，不强迫单个区块变成四段全文；同 stage 不按编号/数组推断叙事顺序。
- [ ] generation warning、coverage、Review/Evidence、原文出处保持独立；Unknown/Missing/Known(0)/Absent 不合并，PASS 不冒充设计正确或 Evidence 支持。
- [ ] Generated 缺失/单块表达缺失时仍可打开有效 Plan Block 并查规划出处；无 Topic occurrence 的 Block 不被丢弃。
- [ ] Block/fragment → L3 → Back 恢复该 L2 的展开、滚动、焦点；L2 → Back 恢复原 L1 occurrence，其他来源按共享栈恢复。
- [ ] Explore 的 Open in Reading(Block) 进入同一独立 L2；返回恢复 Explore；旧 session/延迟 Source 不覆盖新页面，无自动保存。
- [ ] 640×720 窗口、键盘、长表达、披露与返回可用；可搬迁只读 Preview 和 Electron 共用展示。
- [ ] 用户检查代表性的实际 L2 表达，确认阅读范围明确且容易理解；自动化通过不替代人工判断。
- [ ] 相关单元/真实 Electron/Preview 回归、独立审查、用户验收完成；同步合同/index/dashboard 和 F16 范围说明后才 passing。

## Risks and compatibility

- 旧 Overview 的全量 DOM 数量测试不能直接当作新 L2 的标准；投影仍保留全量数据，而单 Block 页面应验证当前 subject 完整且其他主体不混入。
- renderer 提取和导航现场变化可能影响 Source 焦点、fragment inspection 和 Explore 返回，必须验证真实组合路径。
- 样本表达质量与页面完整性分开评价；不把已有薄弱生成结果的存在称为阅读体验通过。

## Completion evidence

本任务尚未实施。证据登记在 `docs/log/artifacts/F24-l2-block-reading-view/`。
只保留设计、计划、verification-summary、独立审查及必要截图，不保留成功校验 txt。
F16 的数据接入 passing 不代表本 feature 的界面验收；Reading 整体体验需 F23/F24 和实际人工判断完成。
