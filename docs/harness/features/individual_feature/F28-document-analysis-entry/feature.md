---
id: F28
title: Document Analysis Entry
version: v0.1
status: not_started
dependsOn: ["F27"]
scope: {"code":["app/main/document-input*.js","app/main/main.js","app/main/preload.js","app/shared/document-input*.js","app/renderer/document-entry*.js","app/renderer/app.js","app/renderer/index.html","app/renderer/styles.css","package.json"],"tests":["scripts/test-document-input*.js","scripts/test-document-entry*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/harness/DESIGN.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F28-document-analysis-entry/**","docs/log/artifacts/F28-document-analysis-entry/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["打开软件 → 确认当前模型 → 选择一篇文档 → 确认本次输入","取消/更换文档或遇到文件错误 → 保留有效选择或明确提示"],"integrationEvidence":[],"knownUnverified":["具体输入范围与大小限制待F26结论后确认","文档选择/快照与F29任务交接接口尚未设计或实施"],"humanReviewRequired":["用户确认第一次打开软件能明确知道如何选文档及下一步"]}
---

# F28 Document Analysis Entry

## Goal

用户确认已保存的模型后，能选择一篇自己的文档，清楚知道本次将分析哪份文件；为 F29 的实际分析提供可靠输入。

## Process preconditions

- 用户于 2026-10-06 批准登记，当前不实施；F26 新想法待补充，F27 尚未开始。
- 依据 [阶段路线](../../../AI_INTEGRATION_ROADMAP.md)，首版暂按现有 Markdown 能力登记；开工前结合 F26 确认格式、编码和容量限制。
- F28 负责选文档和准备输入，F29 负责真正调用模型、任务状态和完成跳转。登记不把这两个阶段混为已完成的用户链路。

## Scope

### Allowed changes

- 软件入口展示当前模型，提供配置入口和单文档选择；用户可取消、更换选择。
- 主进程使用文件选择和受控读取，验证文件可读性、格式、编码、空内容及已确定的容量限制。
- 向任务层交接本次文档快照与身份/指纹，保证模型输入与后续原文坐标来自同一份内容。
- 展示文件名和必要输入状态；没有有效配置/输入时不允许发起分析。
- 接入明确的开始动作边界供 F29 实现；选择本身不联网、不改变当前阅读 session。

### Out of scope

- 模型调用、生成阶段编排、重试和完成结果打开，由 F29 负责。
- PDF/Word/OCR、批量文档、自动目录扫描、历史记录、URL 抓取或源码仓库读取。
- 模型配置存储的第二套实现、导入旧包协议更改、Reading 能力扩展。
- 假分析进度或假成功；文档选择不得生成占位结果冒充 AI 分析。

## Acceptance Criteria

- [ ] 入口清楚显示当前模型和选择文档的动作；模型未配置时能进入 F27，不让用户猜测下一步。
- [ ] 单文档选择、取消、更换与当前选择信息一致；取消不清空已有有效输入或旧阅读结果。
- [ ] 不支持/空/不可读/超出限制的文件有可理解提示；不存在静默使用默认样本或另一份文章的行为。
- [ ] 原文快照、坐标和任务输入的绑定方式明确且经验证；选取后磁盘变更不会让分析内容与引用来源分离。
- [ ] 选择文件零模型调用、不自动保存审核、不提前切换旧 session；分析动作只交接有效输入，实际调用由 F29 接通。
- [ ] 真实 Electron 文件对话框、键盘、窄窗口及配置往返路径可用；旧资料包入口仍可使用。
- [ ] 回归、独立审查、用户对选择入口的验收及文档门禁完成后再 passing；完整分析验收保留在 F29。

## Risks and compatibility

选择路径和分析时读取文件可能发生变化；必须在开工设计中确定快照时机与生命周期。配置状态只能说明准备情况，不能冒充服务可用性。仅增加单文档入口，不移动或删除用户文件。

## Completion evidence

实施后记录于 `docs/log/artifacts/F28-document-analysis-entry/`；包含实际文件选择与失败路径、输入绑定、独立审查和人工入口验收。当前仅登记。
