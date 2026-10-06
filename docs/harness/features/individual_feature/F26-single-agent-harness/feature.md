---
id: F26
title: Single-Agent Harness Core
version: v0.4
status: active
dependsOn: []
scope: {"code":["app/agent/core/*.ts","app/agent/providers/*.ts","app/agent/tools/registry*.ts","app/agent/trace/*.ts","app/agent/index*.ts","package.json","tsconfig.agent*.json","package-lock.json"],"tests":["scripts/test-agent-core*.js","scripts/test-agent-provider*.js","scripts/test-agent-registry*.js","scripts/test-agent-trace*.js","scripts/test-agent-types*.ts"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/notes/single-agent-harness-design.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F26-single-agent-harness/**","docs/log/artifacts/F26-single-agent-harness/**","docs/progress.md","prompts/README.md","docs/harness/incidents/2026-10-06-harness-contract-review.md"]}
evidence: {"lastVerifiedAt":"2026-10-06","commands":[{"command":"npm run typecheck:agent","result":"passed"},{"command":"npm run test:agent:clean","result":"passed"},{"command":"node scripts/harness-gate.mjs","result":"passed"},{"command":"npm run test:all（在check:docs前的既有回归及check:docs后的剩余命令分段执行）","result":"passed-with-environment-limit"},{"command":"node scripts/test-reading-bundle-preview.js（沙箱外）","result":"passed"}],"manualSmoke":"CommonJS dist/agent入口由全部JS测试实际加载；fake Provider多轮、no-progress、未知工具、预算、usage未知和取消迟到路径通过。"}
completionGate: {"version":"v0.4","l3":"required","userPath":["受控输入 → 单Agent模型/tool/observation循环 → 显式状态和trace → 程序判定终止","未知工具/无效调用/预算耗尽/取消 → 明确失败或取消，不假完成"],"integrationEvidence":["scripts/test-agent-core.js","scripts/test-agent-provider.js","scripts/test-agent-registry.js","scripts/test-agent-trace.js"],"knownUnverified":["当前交付目录缺少22个历史workspace预览/分析文件，check:docs因此不能在本目录全绿；新F26文档无断链","独立代码审查尚未完成"],"humanReviewRequired":["用户确认核心接口、可追踪循环与受控终止行为；不以此代替真实AI质量验收"]}
---

# F26 Single-Agent Harness Core

## Goal

提供可复用的小型单 Agent 内核：同一个 Agent 经 Provider 调模型，选择受控工具、接收 observation 并继续；程序拥有状态、预算、取消与终止判定。后续领域工具和 Electron 都消费同一运行时。

## Process preconditions

- Core无Reading feature强制依赖；F31仅依赖Core，Reading/Bundle/L0/L1/L2前置集中在F32交付集成。领域system prompt归F31，不由Core维护。

- 2026-10-06 用户要求将原 F26 改为 Single-Agent Harness，扩充任务并后移 AI 实验及 F27–F30。本次只调整合同，原实验完整迁到 F33，不丢弃其验收要求。
- 默认设计输入：本合同、verification及用户提供的[详细接口问答草案](ref/f26_detailed_interface_design_draft.md)。问答已足以支持详细设计，但其旧版本/可选JS措辞、状态和停止原因须对齐当前TypeScript合同，不能直接当成冻结实现。
- [原架构模板](ref/single-agent-harness-architecture-template.md)保留参考原文；[长篇架构背景](../../../../notes/single-agent-harness-design.md)已降为NON-NORMATIVE按需参考，不作为前置必读或authority。正式接口与计划应在本feature内维护；新运行时开工前仍确认书面设计/实施计划。
- F26 只验内核；F31 接领域工具，F32 验完整离线链路和完成门禁，F33 做真实模型实验，F29 后续接入 Electron。

## Scope

### Allowed changes

- 新增app/agent源代码采用TypeScript，独立strict类型检查/编译；旧Electron、shared与scripts维持JavaScript。实现消费编译公共入口，JSON/工具数据仍走运行时校验。

- Agent Definition / Runner、ProviderAdapter、Context、通用RunState、ToolRegistry 和基础 TraceRecorder；按职责形成少量模块，不搬入大型框架目录。
- 首个 DeepSeek adapter 与离线 fake Provider；统一 response/tool call/usage/error 格式，Runner 不依赖厂商协议。
- 工具名称/参数/权限校验、调用 ID 与 observation 对应；第一版写操作串行，有限循环与明确终止原因。
- 从第一版就具备步数、工具次数、时间和适用 token/输出限制；无法获得的用量/费用写未知，不伪造预算余量。
- 取消信号贯穿请求与工具；已终止 run 不接受迟到结果。程序拥有State，领域状态为宿主不透明引用；模型无直接改写运行状态或策略结果的接口。
- Context明确区分可信系统指令与不可信任务输入/tool observations；Core只执行宿主Context Policy、预算与容量限制，不解释领域Stage或产物语义。
- 基础 trace 记录 request/response/tool/result/状态和终止；凭据隔离、敏感内容保留策略明确。

### Out of scope

- 文档生产领域工具和真实完成质量归 F31–F33，不把 fake Provider 通过当成文档分析成功。
- 多 Agent、长期 Memory、RAG/Knowledge、Skills 平台、Event Bus、插件市场、后台调度、跨进程恢复。
- 任意 shell/代码执行/文件系统权限、工具嵌套调用旧模型脚本、AI 修改 validator 或人工审批。
- Electron 配置/文件入口/进度 UI、Reading 扩展、迁移 Gold 或历史实验。

## Acceptance Criteria

- [ ] 通用协议以TypeScript定义，独立strict检查与清洁构建通过；旧JS消费者实际加载CommonJS编译入口，不直接require .ts，不依赖残留dist。
- [ ] 外部model/tool/file输入为unknown，经运行时验证后归一化；不以类型断言/any绕过Schema或权限，旧模块不发生全仓语言迁移。

- [ ] Agent、Runner、Provider、Context、State、Registry、Trace 接口和职责明确；CLI/未来 Electron 可复用同一运行时。
- [ ] fake Provider 驱动真实循环，覆盖多轮工具 observation、普通文本无工具、拒绝未知工具/错误参数及错误返回；调用 ID 正确且无悬空结果。
- [ ] 不修改 Runner 可替换 Provider；DeepSeek 协议用离线响应验证。未实际联网不宣称模型可用或质量通过。
- [ ] 状态与预算由程序更新，工具结果对应实际执行；有限终止、取消和迟到回复有真实保护，不无限循环或重试。
- [ ] 模型不能自行设置停止或通过宿主完成策略；默认无合法证明时拒绝。无工具响应被拒绝则写host observation，默认连续第二次无工具且拒绝以no_progress停止，取消/预算优先；不伪造tool结果。
- [ ] Core无Reading/Map/Plan/Stage语义和Domain imports；按宿主Context Policy组装通用请求，不可信任务数据不成为系统指令，凭据和token/费用未知状态正确处理。
- [ ] trace 能追溯每步、失败及终止原因，日志不代替 artifact 或跨任务 Memory；默认无外部模型调用。
- [ ] 核心集成回归、独立审查、用户对内核边界的验收和文档门禁齐全后 passing；完整文档结果另验。

## Risks and compatibility

新目录暂建议 `app/agent/`，书面设计确认后才建代码。该模块必须与 Electron 和业务 renderer 解耦；不重构既有正确语义逻辑。Provider 能力与工具协议以运行前核对为准；模型输出/工具数据不被提升为运行时权威。

## Completion evidence

实施后建立 `docs/log/artifacts/F26-single-agent-harness/`，登记内核真实循环、故障矩阵和独立审查。此处的开发 harness 门禁与产品 Agent 的 completion policy 是两个概念，均不等于设计审批或内容质量保证。当前仅任务登记。

## Active implementation — 2026-10-06

用户要求继续推进后，F26 成为唯一 active feature。正式接口以 [detailed-design.md](detailed-design.md) 为准，实施顺序与验证切片见 [implementation-plan.md](implementation-plan.md)。两份文档尚待用户确认；确认前不创建运行时代码或安装 TypeScript 依赖。

用户随后确认继续，TypeScript Core、Runner、State/Trace、ToolRegistry、fake Provider 和 DeepSeek 离线 adapter 已实现。专项 strict typecheck、清洁构建、协议/故障矩阵和旧功能回归已执行；尚待独立审查、历史 workspace 链接环境补齐及用户边界验收，因此保持 active，不提前标记 passing，也不宣称真实文档分析质量已验证。

## Pre-implementation feedback correction — 2026-10-06

按用户粘贴的反馈删除Reading依赖与阶段Context规则；默认无工具退出语义、通用停止状态和宿主不透明领域状态已写入设计草案。仅修订合同，仍not_started；不将登记检查当Core完成证据。

## TypeScript boundary — 2026-10-06

用户明确选择新app/agent采用TypeScript，旧Electron模块不迁移。仅更新语言/构建与interop合同，实际tsconfig、开发依赖、源代码和命令在实施时建立；当前仍not_started。
