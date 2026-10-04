---
id: F23
title: L1 Topic Boundary View
version: v0.2
status: blocked
dependsOn: ["F16","F18","F19"]
scope: {"code":["app/shared/l1-topic-projection.js","app/shared/reading-projection.js","app/renderer/app.js","app/renderer/l0-map.js","app/renderer/index.html","app/renderer/styles.css","app/main/main.js","scripts/build-preview.js","package.json","app/renderer/l1-topic-view.*"],"tests":["scripts/test-l1-topic-projection.js","scripts/test-reading-bundle-projection.js","scripts/test-reading-navigation-electron.js","scripts/test-reading-integration-electron.js","scripts/test-product-maturity-electron.js","scripts/test-reading-bundle-preview.js","scripts/test-l0-preview.js","scripts/test-l1-boundary-view*.js"],"docs":["docs/harness/DESIGN.md","docs/harness/ARCHITECTURE.md","docs/specs/reading-view-cognitive-contract.md","docs/specs/reading-view-layer-contracts.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F23-l1-topic-boundary-view/**","docs/log/artifacts/F23-l1-topic-boundary-view/**","docs/harness/features/individual_feature/F16-l2-runtime/**","docs/harness/features/individual_feature/F17-l1-runtime/**","docs/progress.md","docs/harness/incidents/2026-10-03-f23-boundary-review.md","docs/harness/incidents/2026-10-04-reading-comprehension-feedback.md","docs/harness/features/individual_feature/F25-l0-document-orientation/**","docs/log/artifacts/F25-l0-document-orientation/**"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"npm.cmd run test:l1-boundary","result":"passed","output":"v0.1 技术基线：real Electron/SVG/keys/Source paths passed"},{"command":"npm.cmd run test:all","result":"passed","output":"v0.1 技术基线：offline + relocated readonly Preview passed"},{"command":"npm.cmd run selftest","result":"passed","output":"v0.1 技术基线：full Electron chain passed"},{"command":"npm.cmd run validate","result":"passed","output":"v0.1 技术基线：passed"},{"command":"npm.cmd run audit","result":"passed","output":"v0.1 技术基线：passed"},{"command":"npm.cmd run check-overview","result":"passed","output":"v0.1 技术基线：PASS WITH WARNINGS; existing warnings"},{"command":"npm.cmd run check:docs","result":"passed","output":"v0.1 技术基线：passed"},{"command":"npm.cmd run verify:harness","result":"passed","output":"v0.1 技术基线：passed"},{"command":"node --check modified/new JS; git diff --check","result":"passed","output":"v0.1 技术基线：passed"}],"manualSmoke":"2026-10-03 v0.1 技术路径通过；2026-10-04 实际验收未通过。v0.2 新解释要求尚未实施或验收。"}
completionGate: {"version":"v0.2","l3":"required","userPath":["资料包 → L0 Topic → L1 边界图 → 返回恢复 L0 现场","无内部关系、有 crossing 的主题；无任何可绘制关系的主题；多 Topic 成员","640×720 窗口与键盘操作；便携 Preview 同一展示","T-01 无可绘制关系：理解 Receipt/Availability/Consumption 的含义、差异与非等价边界","T-02/T-03 有关系：能解释对象职责与内部/跨边界连接，而非复述名称和关系码","缺解释资料：仍显示已知结构并说明解释缺失，不逼用户靠 L2 补齐本层基本理解"],"integrationEvidence":["docs/log/artifacts/F23-l1-topic-boundary-view/verification-summary.md","真实 Electron/搬迁只读 Preview：完整图、原文、键盘窄窗口和返回现场通过；独立审查无剩余 P1/P2"],"knownUnverified":["L1 成员与关系的具体解释尚未补齐","无关系 Topic summary 仍只列名称，定义/区别/边界尚未完善","修订后的解释依据、真实界面与用户阅读理解尚未验收；L0 导读单独由 F25 处理"],"humanReviewRequired":["用户能解释当前主题的对象含义、内部及外部连接；没有可绘制关系时能讲清主要概念差异与边界，而无需先打开 L2"]}
---

# F23 L1 Topic Boundary View

## Goal

用户从 L0 点击 Topic 后，看到以这个主题为焦点的局部与边界图：哪些对象参与、内部如何连接、怎样与主题外部连接，以及能继续进入哪些解释区块。在既有图和导航上补足主题解释：对象是什么、为何参与这个主题、连接意味着什么、主题边界在哪里。无关系摘要也须有必要定义/对照/边界；“只有名称和箭头”或把基本理解全部交给 L2 都不能作为完成。

## Process preconditions

- 用户于 2026-10-03 批准新建 F23/F24，用来补齐分层阅读体验；随后用户要求“开始 F23”，已批准设计与计划并完成 Native 实施/独立审查；2026-10-04 实际验收未通过，当前修订为 v0.2。
- F17 的 membership、边界分类和三态投影作为已有基线；F17 因展示缺口重新打开，不能作为本任务的 passing 前置，否则形成关闭循环。
- 强制前置是已验证的数据接入、资料包/溯源和共享导航（F16/F18/F19）；沿用 F17 已有投影，不重新推断关系。
- 已核对 Reading 主契约、Layer Contracts §2 与 harness DESIGN；[展示设计](../../../../log/artifacts/F23-l1-topic-boundary-view/view-design.md)已获用户确认（2026-10-03，“可以，做吧”）；[实施计划](../../../../log/artifacts/F23-l1-topic-boundary-view/drafts/implementation-plan.md)已获用户批准（“看着没问题，实施咯”），沿用 Native；首轮技术实施与独立复查已完成；2026-10-04 用户验收指出解释不足，需重新设计。
- 反馈与原 feature 完成范围修正在 [incident](../../../incidents/2026-10-03-l1-l2-reading-gap.md)。

## Scope

### Allowed changes

- 独立 L1 renderer 和必要样式、Topic 入口文案及当前所在层级提示；预览与 Electron 共用 renderer。
- 消费现有 Topic projection 的成员、原始关系及相对边界分类。为展示原始 identity/label/qualifiers 调整投影字段；复用已有 Source coordinate resolver，将已加载 registry 与 sourceIntegrity 的入口可用性投影到 L1，不包含原文内容、不推断 SU 与 heading 对应关系。验证输入纯度与既有语义不变。
- 将 Topic 内部区域和外部连接区分展示；外部对象可用 stub 或折叠表示，但能披露完整原始 identity。
- 复用 F19 的 ReadingAddress/stack、Element canonical resolver 和原文入口；保留 occurrence、展开、焦点、滚动状态。
- 成员的必要定义/职责、关系的具体含义及条件/边界，在本层直接可读；可按需披露详情，基本解释不能全部折叠到辅助关系表或推给 L2。
- 无关系摘要保留 Topic identity 和 Known(0)，用有依据的定义、差异/对照和边界说明主题；不为概念强造流程线。
- 消费 F25 设计确认的共享解释规则/资料；来源与绑定不能按 SU 字符串、标题、文件名猜测。共享解释模块/规则由 F25 维护，本 feature 只消费并适配 L1 投影，不另建解析/配对规则；当前未选定或批准新协议。
- 真实界面、键盘、窄窗口、退化路径和 portable Preview 回归；更新 F17 完成记录与当前机器保障边界。

### Out of scope

- 将 Topic 改成 container/owner，裁剪 L0 后把外部连接丢掉，或发明 membership/edge/阅读顺序。
- L2 独立解释页（F24）、L3/Explore 语义扩张、Topic canonical landing 升级、新导航栈。
- schema/validator、模型 prompt、原文/Gold/历史实验修改；运行外部模型。
- L0 文档级导读与节点/关系说明布局（F25）、新增图编辑、zoom/pan、全局视觉改版或仓库目录搬迁。

## Acceptance Criteria

已勾项保留 v0.1 的结构/导航技术基线；修订后须重跑受影响检查，不能用旧结果覆盖 v0.2 新解释要求。

- [ ] 本层先讲清当前 Topic 讨论的问题、关键区别与边界，解释与局部图相互配合，不只是重复 proposition 后罗列对象。
- [ ] 主要 Inside 成员直接提供必要含义/职责；Outside 成员披露足够连接语境，并保留完整原 identity。
- [ ] 关系说明讲清对象之间实际发生的事情及已有条件/限制，而非只展示 consumes/produces/depends-on 或将箭头换成列表；无相关依据时明示缺失。
- [ ] 无关系主题的 summary 包含有依据的概念定义/对照/边界；T-01 能解释“收到、合法可用、实际使用”的区别及不等价性，不伪造三者流程/因果边。
- [ ] 基本理解可在当前 L1 完成；“进一步阅读”进入 L2 的按钮不是本层解释的替代，stage 标签不被表现为 L0/L1/L2 层级。
- [ ] 解释与原文/声明资料显式绑定；缺失、不匹配、不可解析和漂移被如实处理，无 Map/Plan SU 隐式跨空间对应，无语义证据升级。

- [ ] 有可绘制关系时，L1 默认显示可阅读的主题边界图；关系文字列表仅作为辅助披露，不能代替图。
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

本任务已完成产品/Preview 接入、自动化验证与独立审查；当前 blocked 因 2026-10-04 用户实际验收未通过：L1 解释不足，v0.2 修订方案尚待确定；L0 整篇定位由新 F25 负责。证据登记在 `docs/log/artifacts/F23-l1-topic-boundary-view/`。
只保留书面设计、计划、verification-summary、独立审查和必要截图；不保留成功校验的 txt 日志。
F23 完成后按 F17 重新打开的验收项复核并记录关闭依据，不自动覆盖历史证据。

## Actual user acceptance — 2026-10-04

用户已实际查看，反馈 L0 抽象、关联列表帮助有限、Topic 导航缺少整篇定位，L1 只有名称和关系而解释不足。验收未通过，不能继续称为“只等用户看图”。技术路径和原数据回归保留；本次仅记录反馈与诊断，不改产品代码。见 [反馈记录](../../../incidents/2026-10-04-reading-comprehension-feedback.md)。用户随后同意拆分：L0 整篇导读由 F25 负责，L1 不足继续在 F23 内修正；F24 暂后置。共享解释资料须先明确协议与绑定，F23 不自行扩张它。

## F25 / F23 coordination — 2026-10-04

- [F25 合同](../F25-l0-document-orientation/feature.md)负责整篇定位和共用解释资料的设计；本 feature 负责 L1 的实际消费与局部表达。F25 不接收或替代 F23 未通过的验收责任。
- 推进建议：先设计 F25 的导读/解释资料，再修订本 feature 的展示设计，按确认后的计划实施；F24 后置。不得同时激活两项，也不把尚未确定的共享协议当作已存在依赖。
- F25 不依赖 blocked F23；F23 的 harness 强制前置暂保持 F16/F18/F19。若确定共享制品是必需输入，实施前再同步精确范围和必要依赖，不制造关闭循环。
- v0.1 设计/实施计划与审批仅是历史技术基线；本次合同更新不等于 v0.2 展示设计已确认。现有代码、原文、Gold 和历史实验不在本登记轮修改。
