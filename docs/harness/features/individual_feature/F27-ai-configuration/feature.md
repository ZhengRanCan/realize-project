---
id: F27
title: AI Configuration
version: v0.2
status: not_started
dependsOn: ["F33"]
scope: {"code":["app/main/ai-config*.js","app/main/main.js","app/main/preload.js","app/shared/ai-config*.js","app/renderer/ai-config*.js","app/renderer/app.js","app/renderer/index.html","app/renderer/styles.css","package.json"],"tests":["scripts/test-ai-config*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/harness/DESIGN.md","docs/harness/INITIALIZATION_CONTRACT.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F27-ai-configuration/**","docs/log/artifacts/F27-ai-configuration/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.2","l3":"required","userPath":["打开AI配置 → 保存Provider/Model及凭据 → 重启 → 确认当前模型","修改或清除配置 → 后续分析使用新配置；已启动任务保留原配置"],"integrationEvidence":[],"knownUnverified":["F33实验尚未完成，模型接口和必要参数未定","配置存储、凭据保护及IPC实现设计未确认；未实施"],"humanReviewRequired":["用户确认基础配置流程与当前模型信息清楚可用"]}
---

# F27 AI Configuration

## Goal

用户能保存基础 AI 配置，明确下一次文档分析将使用哪个 Provider 和 Model；重启软件后不必重新填写。

## Process preconditions

- 2026-10-06 用户明确要求先登记 F27–F30，Harness与F33实验尚未完成。本 feature 仅登记，不启动实现。
- 依据 [阶段路线](../../../AI_INTEGRATION_ROADMAP.md)；首轮 Provider 选择 DeepSeek。实际支持的模型、接口与必要参数由 F33 结论确定，不在登记阶段冻结。
- 开工前确认存储、最小 IPC 和界面设计，同步 ARCHITECTURE / CONSTRAINTS / DESIGN；共享边界变化需说明影响和验证方法。

## Scope

### Allowed changes

- 增加基础 AI 配置入口：Provider、Model、API Key 或支持的本地凭据方式、实际接口需要的基础参数。
- 本机配置保存、读取、修改、清除和字段校验；明确未配置、配置可用及凭据不可读取等状态。
- 主进程拥有持久化和凭据读取；renderer 仅获显示/编辑所需数据，保存后不回传原始密钥。
- 展示当前模型；任务启动取得不可变配置快照，后续设置修改仅影响新任务，接口由 F29 消费。
- 配置页保持简单，后续 F30 整理入口视觉层级。

### Out of scope

- 分析任务编排、文档选择、模型质量比较；不重新实现 F26 的生成逻辑。
- 多配置方案管理、自动挑选模型、复杂参数、Prompt 编辑、账号/云同步。
- 自动联网验证、静默读取其它应用凭据；配置或打开页面不得自动发起模型请求。
- Reading 层与解释页顶部改造、Schema/validator 放宽。

## Acceptance Criteria

- [ ] 首版字段与 F26 实际接口一致；用户明确知道当前 Provider/Model，必需字段缺失或不合法时有可理解的提示。
- [ ] 保存后重启可恢复非敏感配置和可用凭据；修改/清除生效，取消编辑不改已保存值。
- [ ] 密钥经主进程保护，不进入日志、Git、分析资料包或 renderer 的持久状态；存储/解密失败不会静默降级为明文。
- [ ] 已启动任务使用启动时配置快照；设置变化不会改变中途的 Provider/Model，下一次任务使用新配置。
- [ ] 未配置、不可用和已保存状态可区分；保存配置不等于模型调用成功，也不自动联网。
- [ ] 真实 Electron 的重启/编辑/清除、键盘和窄窗口路径通过；既有资料包打开/阅读行为保留。
- [ ] 必要回归、独立审查、用户验收和文档门禁完成后再标 passing。

## Risks and compatibility

凭据存储依赖运行环境；实施时验证加密可用性和失败行为。现有实验脚本的环境变量配置与产品设置边界须明确，不通过隐式回退制造“显示模型”和“实际模型”不一致。配置文件放本机用户数据目录，不放仓库或一次分析目录。

## Completion evidence

实施时在 `docs/log/artifacts/F27-ai-configuration/` 记录验证、实际界面路径及独立审查。登记本身不证明存储或安全行为已实现；当前不创建假的完成证据。

## Harness-first rescheduling — 2026-10-06

按用户要求保留编号并后移：F26 → F31 → F32 → F33 → F27 → F28 → F29 → F30。原F26真实AI实验迁到F33，当前feature仍not_started；旧登记段落只记录历史。产品目标保留，配置/输入/调用接口在Harness及实验结论后细化。
