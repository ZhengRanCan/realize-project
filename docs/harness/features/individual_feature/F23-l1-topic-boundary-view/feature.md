---
id: F23
title: L1 Topic Boundary View
version: v0.1
status: blocked
dependsOn: ["F16","F18","F19"]
scope: {"code":["app/shared/l1-topic-projection.js","app/shared/reading-projection.js","app/renderer/app.js","app/renderer/l0-map.js","app/renderer/index.html","app/renderer/styles.css","app/main/main.js","scripts/build-preview.js","package.json","app/renderer/l1-topic-view.*"],"tests":["scripts/test-l1-topic-projection.js","scripts/test-reading-bundle-projection.js","scripts/test-reading-navigation-electron.js","scripts/test-reading-integration-electron.js","scripts/test-product-maturity-electron.js","scripts/test-reading-bundle-preview.js","scripts/test-l0-preview.js","scripts/test-l1-boundary-view*.js"],"docs":["docs/harness/DESIGN.md","docs/harness/ARCHITECTURE.md","docs/specs/reading-view-cognitive-contract.md","docs/specs/reading-view-layer-contracts.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F23-l1-topic-boundary-view/**","docs/log/artifacts/F23-l1-topic-boundary-view/**","docs/harness/features/individual_feature/F16-l2-runtime/**","docs/harness/features/individual_feature/F17-l1-runtime/**","docs/progress.md","docs/harness/incidents/2026-10-03-f23-boundary-review.md"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"npm.cmd run test:l1-boundary","result":"passed","output":"real Electron/SVG/keys/Source paths passed"},{"command":"npm.cmd run test:all","result":"passed","output":"offline + relocated readonly Preview passed"},{"command":"npm.cmd run selftest","result":"passed","output":"full Electron chain passed"},{"command":"npm.cmd run validate","result":"passed","output":"passed"},{"command":"npm.cmd run audit","result":"passed","output":"passed"},{"command":"npm.cmd run check-overview","result":"passed","output":"PASS WITH WARNINGS; existing warnings"},{"command":"npm.cmd run check:docs","result":"passed","output":"passed"},{"command":"npm.cmd run verify:harness","result":"passed","output":"passed"},{"command":"node --check modified/new JS; git diff --check","result":"passed","output":"passed"}],"manualSmoke":"自动化真实界面路径通过；用户实际界面可理解性验收尚待确认。"}
completionGate: {"version":"v0.1","l3":"required","userPath":["资料包 → L0 Topic → L1 边界图 → 返回恢复 L0 现场","无内部关系、有 crossing 的主题；无任何可绘制关系的主题；多 Topic 成员","640×720 窗口与键盘操作；便携 Preview 同一展示"],"integrationEvidence":["docs/log/artifacts/F23-l1-topic-boundary-view/verification-summary.md","真实 Electron/搬迁只读 Preview：完整图、原文、键盘窄窗口和返回现场通过；独立审查无剩余 P1/P2"],"knownUnverified":["用户对实际 L1 内部结构和外部连接可理解性的确认尚未收到"],"humanReviewRequired":["用户查看有内部关系和穿越边界关系的 L1，确认能看懂局部结构与外部连接"]}
---

# F23 L1 Topic Boundary View

## Goal

用户从 L0 点击 Topic 后，看到以这个主题为焦点的局部与边界图：哪些对象参与、内部如何连接、怎样与主题外部连接，以及能继续进入哪些解释区块。替换当前“成员 + 关系文字列表”作为默认 L1 的展示。

## Process preconditions

- 用户于 2026-10-03 批准新建 F23/F24，用来补齐分层阅读体验；随后用户要求“开始 F23”，已批准设计与计划并完成 Native 实施/独立审查；实际界面可理解性验收待用户记录。
- F17 的 membership、边界分类和三态投影作为已有基线；F17 因展示缺口重新打开，不能作为本任务的 passing 前置，否则形成关闭循环。
- 强制前置是已验证的数据接入、资料包/溯源和共享导航（F16/F18/F19）；沿用 F17 已有投影，不重新推断关系。
- 已核对 Reading 主契约、Layer Contracts §2 与 harness DESIGN；[展示设计](../../../../log/artifacts/F23-l1-topic-boundary-view/view-design.md)已获用户确认（2026-10-03，“可以，做吧”）；[实施计划](../../../../log/artifacts/F23-l1-topic-boundary-view/drafts/implementation-plan.md)已获用户批准（“看着没问题，实施咯”），沿用 Native；实施与独立复查已完成；仅实际界面验收待用户。
- 反馈与原 feature 完成范围修正在 [incident](../../../incidents/2026-10-03-l1-l2-reading-gap.md)。

## Scope

### Allowed changes

- 独立 L1 renderer 和必要样式、Topic 入口文案及当前所在层级提示；预览与 Electron 共用 renderer。
- 消费现有 Topic projection 的成员、原始关系及相对边界分类。为展示原始 identity/label/qualifiers 调整投影字段；复用已有 Source coordinate resolver，将已加载 registry 与 sourceIntegrity 的入口可用性投影到 L1，不包含原文内容、不推断 SU 与 heading 对应关系。验证输入纯度与既有语义不变。
- 将 Topic 内部区域和外部连接区分展示；外部对象可用 stub 或折叠表示，但能披露完整原始 identity。
- 复用 F19 的 ReadingAddress/stack、Element canonical resolver 和原文入口；保留 occurrence、展开、焦点、滚动状态。
- 真实界面、键盘、窄窗口、退化路径和 portable Preview 回归；更新 F17 完成记录与当前机器保障边界。

### Out of scope

- 将 Topic 改成 container/owner，裁剪 L0 后把外部连接丢掉，或发明 membership/edge/阅读顺序。
- L2 独立解释页（F24）、L3/Explore 语义扩张、Topic canonical landing 升级、新导航栈。
- schema/validator、模型 prompt、原文/Gold/历史实验修改；运行外部模型。
- 新增图编辑、zoom/pan、全局视觉改版或仓库目录搬迁。

## Acceptance Criteria

- [x] 有可绘制关系时，L1 默认显示可阅读的主题边界图；关系文字列表仅作为辅助披露，不能代替图。
- [x] 图展示全部已有 internal/crossing 关系；external-only 关系不进入本层，外部端点标为边界外而非 Inside 成员。
- [x] 有方向的 crossing 保留 inbound/outbound；relates-to 不画方向箭头、不暗示存储方向等于语义方向；原始 label/qualifiers/note 有披露入口。
- [x] membership 精确来自 element.topics；同一对象可出现在多个 Topic，不产生独占归属；Inside = ∅ 保留 Known(0)。
- [x] internal = 0 而 crossing 非空时仍展示边界连接；仅无任何可绘制关系时采用 Topic boundary summary，不伪造关系、不绘制空图占位。
- [x] Block Organization 的 Unknown、Known(0)、Known(n) 分别披露；只有已声明且当前载入资料可解析的 Block 有可用入口，缺少 Plan 不显示能成功打开的按钮。
- [x] 文档、Topic 标题/命题和当前位置清晰；Element/出处操作沿用既有语义；返回恢复原 L0 occurrence。
- [x] 640×720 下图可通过区域滚动/披露读全，页面不溢出；Tab/Enter/Space 操作、可见焦点及返回有效。
- [x] 公共样本覆盖内部连接、crossing-only、无关系、多 Topic、无 Plan、relates-to；真实 Electron 和可搬迁只读 Preview 行为一致。
- [ ] 用户已查看实际界面并确认局部结构与外部连接可理解；自动化导航通过不能代替该项。
- [ ] 回归和独立代码审查通过，验收记录完整；同步 F17/F23、index/dashboard，再标 passing。

## Risks and compatibility

- L1 是主题视角，不是 L0 的裁剪或 Topic 子树；布局不得升级关系语义。
- 大量 crossing 可折叠，但已有关系不能被静默省略；披露计数区分未知与已知空。
- 共享 renderer/导航改动要保护 F18–F21 的原文、返回、session 隔离与只读 Preview；F21 原性能结论不能自动覆盖新图。

## Completion evidence

本任务已完成产品/Preview 接入、自动化验证与独立审查；当前 blocked 仅因用户实际界面验收尚未完成。证据登记在 `docs/log/artifacts/F23-l1-topic-boundary-view/`。
只保留书面设计、计划、verification-summary、独立审查和必要截图；不保留成功校验的 txt 日志。
F23 完成后按 F17 重新打开的验收项复核并记录关闭依据，不自动覆盖历史证据。
