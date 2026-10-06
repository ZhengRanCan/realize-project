---
id: F29
title: End-to-end Analysis
version: v0.1
status: not_started
dependsOn: ["F26","F27","F28","F18","F23","F24","F25"]
scope: {"code":["app/main/analysis-*.js","app/shared/analysis-*.js","app/renderer/analysis-*.js","app/main/main.js","app/main/preload.js","app/main/reading-bundle.js","app/main/reading-session.js","app/renderer/app.js","app/renderer/index.html","app/renderer/styles.css","scripts/ai-plan.js","scripts/ai-block.js","scripts/run-semantic-grounding.js","scripts/generate-framework-map.js","scripts/assemble-overview.js","scripts/export-reading-bundle.js","scripts/helpers/ai-experiment-*.js","scripts/helpers/analysis-*.js","prompts/*.prompt.md","package.json"],"tests":["scripts/test-analysis-*.js","scripts/test-reading-session.js","scripts/test-reading-bundle*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/harness/DESIGN.md","docs/harness/INITIALIZATION_CONTRACT.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F29-end-to-end-analysis/**","docs/log/artifacts/F29-end-to-end-analysis/**","docs/progress.md","workspace/README.md","prompts/README.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["确认模型/文档 → 开始分析 → 阶段状态 → 校验/装配 → 打开当次完整L0/L1/L2 → 原文核查","失败/取消/部分完成/过期回复 → 诚实状态且保留旧结果与人工审核"],"integrationEvidence":[],"knownUnverified":["F26生成路径与失败处理结论待用户新想法和实验确定","任务接口/存储/取消/有限重试设计及完整产品链路尚未实施"],"humanReviewRequired":["用户使用自己的文档完整分析并接受实际结果和失败处理体验"]}
---

# F29 End-to-end Analysis

## Goal

用户无需手工运行脚本或准备 JSON：确认模型、选择文档、点击分析后，看到真实阶段状态，最终通过现有 Renderer 阅读本次生成的完整 L0 / L1 / L2 内容。

## Process preconditions

- 2026-10-06 用户批准登记，当前不实施；F26 等待新的想法，阶段顺序和接口不能先行冻结。
- 依据 [阶段路线](../../../AI_INTEGRATION_ROADMAP.md)，复用 F26 验证的生产路径、F27 配置和 F28 文档输入。
- 开工前完成跨模块实现设计与计划，明确主进程任务边界、共享生成/校验能力、状态、取消、有限重试和存储；同步 ARCHITECTURE / CONSTRAINTS / DESIGN。

## Scope

### Allowed changes

- 把已验证生成能力接为产品任务；原文、坐标、Review、Map/解释、Plan、逐 Block 表达、装配及资料包配对完整衔接。
- 主进程负责请求、凭据、文件和校验，renderer 只发动作并呈现最小任务状态；接口和脚本按复用需要提取，避免并行维护两套生成语义。
- 启动冻结配置与原文快照，暴露真实阶段及状态，不编造完成百分比；处理重复启动、取消和迟到回复。
- 明确请求失败、输出错误、校验失败及部分阶段失败；在确认的次数/范围内重试，记录尝试，不静默修复语义。
- 本次资料集中放入独立本地分析目录；校验/装配成功后通过既有 bundle prepare/commit 打开，保留既有 session 规则。
- 完成与失败路径采用可理解动作和状态，F30 再统一入口体验；既有受控表达、来源、identity/authority 不变。

### Out of scope

- 新增分析能力、受控词表或阅读层定义、修改判断标准迎合模型、直接生成 HTML。
- AI 批准 Decision、写 human-review、伪造 source-verified、用默认样本补齐失败结果。
- 无上限重试、后台定时分析、多文档队列、历史管理或云同步。
- 解释页顶部重排与 Reading UI 扩展；产品状态页不得成为 Prompt 编辑器或实验参数面板。

## Acceptance Criteria

- [ ] 从产品入口完成确认配置/选文档/启动/看到真实阶段/打开结果，无需人工准备 Review、Plan、Map 或 Generated。
- [ ] 本次生成沿用既有 Schema/Contract 和校验链；Map/Plan 引用、Guide 指纹和来源绑定有效，不串用旧输入或人工样本。
- [ ] 完整成功包含 Map 导读/对象/连接/主题解释、有效 Plan、全部所需 Block 表达和来源；实际 L0→L1→L2→核查/返回可用。
- [ ] 凭据只在主进程使用；显示和实际请求模型一致，任务配置/原文中途不变，文档中的指令不会覆盖分析任务指令。
- [ ] 等待/进行/完整成功/失败/取消/部分完成有明确状态；部分结果不冒充完整成功，是否可打开及降级方式在实施设计中确认。
- [ ] 错误、取消、重试上限、重复启动及过期回复均有机器保护；不会覆盖已有包、旧 session 或用户审核。
- [ ] 分析资料同目录显式配对；成功校验后提交，不以改 hash、补默认空集或放宽 validator 掩盖问题。
- [ ] 离线故障注入、真实 Electron/Preview 回归和至少一份非 Gold 文档的实际模型生成链路通过；用量/时间与失败可追溯，不记录密钥。
- [ ] 独立审查、用户自己的文档路径验收及文档门禁完成，才可 passing。

## Risks and compatibility

长请求、部分阶段和任务取消可能与界面/session 切换竞争；必须沿用最新任务/请求身份及 prepare/commit 防护。网络/格式成功不等于内容正确，生成状态与人工审阅判断保持独立。原包、历史实验和审核不迁移或覆盖；可读取但缺失的产物继续沿用既有降级语义。

## Completion evidence

实施后在 `docs/log/artifacts/F29-end-to-end-analysis/` 登记实际链路、失败矩阵、界面和独立审查；本地输入与结果放 `workspace/analyses/<document>/<analysis>/`，私有内容不入库。当前不启动模型或编造完成证据。
