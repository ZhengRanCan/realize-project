---
id: F30
title: Analysis Entry UI Refinement
version: v0.1
status: not_started
dependsOn: ["F29","F21"]
scope: {"code":["app/renderer/ai-config*.js","app/renderer/document-entry*.js","app/renderer/analysis-*.js","app/renderer/app.js","app/renderer/index.html","app/renderer/styles.css"],"tests":["scripts/test-analysis-entry-ui*.js","scripts/test-ai-config*.js","scripts/test-document-entry*.js","scripts/test-analysis-*.js","scripts/test-product-maturity-electron.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/DESIGN.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F30-analysis-entry-ui/**","docs/log/artifacts/F30-analysis-entry-ui/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["首次打开 → 明确下一步 → AI配置 → 选文档 → 分析状态 → 完成后阅读","已配置再次使用、取消/失败后重新尝试，键盘与窄窗口均可操作"],"integrationEvidence":[],"knownUnverified":["F27–F29尚未实施，没有完整入口实际界面/使用证据","入口信息层级、布局及状态展示需基于真实链路确认"],"humanReviewRequired":["用户实际试用首次/再次分析入口，确认下一步和状态清楚"]}
---

# F30 Analysis Entry UI Refinement

## Goal

基于已跑通的真实链路整理分析入口，让第一次打开软件的人自然知道下一步：确认模型、选文档、开始分析，并理解等待、失败和完成后的操作。

## Process preconditions

- 用户于 2026-10-06 批准先登记，当前不实现界面。
- 依据 [阶段路线](../../../AI_INTEGRATION_ROADMAP.md)，F27/F28 自身已需基本可用；本项在 F29 完整运行后统一优化，不把可用性拖到最后才做。
- 开工时基于真实入口截图和操作路径确认设计，再同步 DESIGN。F26/F31/F32 Harness与F33实验先行，当前不冻结视觉布局。

## Scope

### Allowed changes

- 整理进入分析前的模型信息、配置入口、文档选择与开始动作，保持主次清楚。
- 优化首次未配置、已配置、未选/已选文档、分析中、失败/取消与完成状态的文案/布局和可操作性。
- 对必要辅助信息按需披露；保留打开已有分析资料包和折叠旧入口的可达路径。
- 验证 Tab/Enter/Space、焦点与反馈、640×720 窄窗口，适配真实模型/文件名/错误信息长度。
- 沿用 F27–F29 的配置、输入和任务状态，避免第二套行为或重复模型调用。

### Out of scope

- 解释界面顶部一级导航重排，Visual Overview / Decision Review 关系改造，L0/L1/L2 能力和视觉改造。
- 历史记录、批量分析、复杂参数、Prompt 编辑、统计卡片与账号功能。
- 重写 AI 流水线、改变任务状态语义/凭据存储或现有 Schema/Contract。
- 为视觉效果隐藏失败/缺失，展示不来自真实任务的进度百分比。

## Acceptance Criteria

- [ ] 首次打开能看清当前准备状态和下一步；未配置时能配置，已配置不强迫重新输入，确认当前模型容易。
- [ ] 选文档、开始、取消及完成后的阅读动作层级清楚；用户不需懂内部 JSON/阶段编号即可操作。
- [ ] 等待、失败、部分完成和完整成功展示准确；错误信息足够采取下一步，不泄露密钥或内部堆栈。
- [ ] 基于实际 F29 状态和内容完成布局，不借占位结果或 Demo 成功画面证明可用性。
- [ ] 键盘、焦点/状态反馈、窄窗口和长文件名/错误文案可用；旧资料包入口仍可到达。
- [ ] F27–F29 的保存/快照/取消/session/审核保护回归通过，UI 不新增隐式模型调用。
- [ ] 首次/再次使用截图、独立审查与用户试用判断完整，文档门禁通过后 passing。

## Risks and compatibility

入口整理可能改变焦点、按钮可达性或让状态被隐藏；必须验证实际任务状态和辅助技术路径。本项只整理入口，解释页顶部保留现状，后续以实际使用截图另行讨论。

## Completion evidence

实施后在 `docs/log/artifacts/F30-analysis-entry-ui/` 记录真实入口各状态截图、键盘/窄窗口、用户试用及独立审查。登记阶段不制作虚构实现截图。
