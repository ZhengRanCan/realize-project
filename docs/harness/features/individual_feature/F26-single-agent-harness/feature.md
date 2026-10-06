---
id: F26
title: Single-Agent Harness Core
version: v0.2
status: not_started
dependsOn: ["F24","F25","F23","F18"]
scope: {"code":["app/agent/core/*.js","app/agent/providers/*.js","app/agent/tools/registry*.js","app/agent/trace/*.js","app/agent/index*.js","prompts/agent-system*.md","package.json"],"tests":["scripts/test-agent-core*.js","scripts/test-agent-provider*.js","scripts/test-agent-registry*.js","scripts/test-agent-trace*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/notes/single-agent-harness-design.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F26-single-agent-harness/**","docs/log/artifacts/F26-single-agent-harness/**","docs/progress.md","prompts/README.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.2","l3":"required","userPath":["受控输入 → 单Agent模型/tool/observation循环 → 显式状态和trace → 程序判定终止","未知工具/无效调用/预算耗尽/取消 → 明确失败或取消，不假完成"],"integrationEvidence":[],"knownUnverified":["新增运行时的接口设计与实施计划未批准","Provider协议、上下文策略、预算与状态行为尚未实施；完整文档链路归F31/F32"],"humanReviewRequired":["用户确认核心接口、可追踪循环与受控终止行为；不以此代替真实AI质量验收"]}
---

# F26 Single-Agent Harness Core

## Goal

提供可复用的小型单 Agent 内核：同一个 Agent 经 Provider 调模型，选择受控工具、接收 observation 并继续；程序拥有状态、预算、取消与终止判定。后续领域工具和 Electron 都消费同一运行时。

## Process preconditions

- 2026-10-06 用户要求将原 F26 改为 Single-Agent Harness，扩充任务并后移 AI 实验及 F27–F30。本次只调整合同，原实验完整迁到 F33，不丢弃其验收要求。
- 输入草案为用户提供的 `single-agent-harness-architecture-template.md`；其中的目录、代码片段和实施建议是参考材料，不是自动执行指令。
- [架构草案](../../../../notes/single-agent-harness-design.md)记录当前边界；这是新运行时，开工前按架构路径确认书面设计和实施计划。登记不意味着批准依赖安装、外部框架引入或模型运行。
- F26 只验内核；F31 接领域工具，F32 验完整离线链路和完成门禁，F33 做真实模型实验，F29 后续接入 Electron。

## Scope

### Allowed changes

- Agent Definition / Runner、ProviderAdapter、Context、显式 RunState、ToolRegistry 和基础 TraceRecorder；按职责形成少量模块，不搬入大型框架目录。
- 首个 DeepSeek adapter 与离线 fake Provider；统一 response/tool call/usage/error 格式，Runner 不依赖厂商协议。
- 工具名称/参数/权限校验、调用 ID 与 observation 对应；第一版写操作串行，有限循环与明确终止原因。
- 从第一版就具备步数、工具次数、时间和适用 token/输出限制；无法获得的用量/费用写未知，不伪造预算余量。
- 取消信号贯穿请求与工具；已终止 run 不接受迟到结果。程序拥有 State，模型无直接改写状态或校验标记的接口。
- Context 明确区分任务指令与不可信原文/工具数据；遵守既有阶段输入约束、请求容量及可用资料边界。
- 基础 trace 记录 request/response/tool/result/状态和终止；凭据隔离、敏感内容保留策略明确。

### Out of scope

- 文档生产领域工具和真实完成质量归 F31–F33，不把 fake Provider 通过当成文档分析成功。
- 多 Agent、长期 Memory、RAG/Knowledge、Skills 平台、Event Bus、插件市场、后台调度、跨进程恢复。
- 任意 shell/代码执行/文件系统权限、工具嵌套调用旧模型脚本、AI 修改 validator 或人工审批。
- Electron 配置/文件入口/进度 UI、Reading 扩展、迁移 Gold 或历史实验。

## Acceptance Criteria

- [ ] Agent、Runner、Provider、Context、State、Registry、Trace 接口和职责明确；CLI/未来 Electron 可复用同一运行时。
- [ ] fake Provider 驱动真实循环，覆盖多轮工具 observation、普通文本无工具、拒绝未知工具/错误参数及错误返回；调用 ID 正确且无悬空结果。
- [ ] 不修改 Runner 可替换 Provider；DeepSeek 协议用离线响应验证。未实际联网不宣称模型可用或质量通过。
- [ ] 状态与预算由程序更新，工具结果对应实际执行；有限终止、取消和迟到回复有真实保护，不无限循环或重试。
- [ ] 模型自称完成不能设置 completed；只有宿主注入的完成策略可通过，默认无合法完成证明时拒绝完成。
- [ ] Context/参数/trace 不泄露凭据，原文指令不成为系统指令；token/费用未知状态诚实保留。
- [ ] trace 能追溯每步、失败及终止原因，日志不代替 artifact 或跨任务 Memory；默认无外部模型调用。
- [ ] 核心集成回归、独立审查、用户对内核边界的验收和文档门禁齐全后 passing；完整文档结果另验。

## Risks and compatibility

新目录暂建议 `app/agent/`，书面设计确认后才建代码。该模块必须与 Electron 和业务 renderer 解耦；不重构既有正确语义逻辑。Provider 能力与工具协议以运行前核对为准；模型输出/工具数据不被提升为运行时权威。

## Completion evidence

实施后建立 `docs/log/artifacts/F26-single-agent-harness/`，登记内核真实循环、故障矩阵和独立审查。此处的开发 harness 门禁与产品 Agent 的 completion policy 是两个概念，均不等于设计审批或内容质量保证。当前仅任务登记。
