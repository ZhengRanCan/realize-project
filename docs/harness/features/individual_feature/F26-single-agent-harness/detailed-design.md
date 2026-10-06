# F26 Single-Agent Harness Core — Detailed Design

Date: 2026-10-06. Status: proposed for implementation approval.

本设计将 F26 v0.4 合同和 `ref/f26_detailed_interface_design_draft.md` 收敛为可实现协议。若二者冲突，以 feature contract 和本文为准。Core 不认识 Reading、Map、Plan、Stage、Electron 或任何文档分析产物。

## 1. Modules and public entry

源代码位于 `app/agent/`，由 `tsconfig.agent.json` 独立 strict 编译到忽略提交的 `dist/agent/`，CommonJS 旧消费者只加载 `dist/agent/index.js`。公共入口导出协议类型、运行时构造器、ToolRegistry、DeepSeek adapter 和离线 fake adapter；不导出内部可变 state。

| Module | Owns | Must not own |
| --- | --- | --- |
| `core/protocol.ts` | canonical request/response、message、usage、observation、error unions | vendor wire format、领域产物 |
| `core/state.ts` | RunState 构造、只读 snapshot、合法状态转换、预算累计 | model-visible context、领域 artifact |
| `core/runner.ts` | 单循环编排、停止优先级、取消、迟到结果隔离 | vendor 解析、tool 业务、领域完成条件 |
| `core/validation.ts` | unknown 输入的结构校验和容量检查 | 用类型断言跳过边界校验 |
| `tools/registry.ts` | 工具注册、schema/权限/调用身份校验、串行执行 | provider 调用、completion 判定 |
| `providers/deepseek.ts` | DeepSeek wire format 与 canonical protocol 互转 | retry、状态写入、tool 执行 |
| `providers/fake.ts` | 可脚本化离线响应与取消行为 | 测试专用的 Runner 分支 |
| `trace/recorder.ts` | append-only 事件、敏感字段清洗、snapshot | artifact、memory、恢复日志 |

## 2. Frozen canonical protocol

所有来自 Provider、工具参数、host policy 返回值的运行时值先以 `unknown` 接收，再经 validator 归一化。

```ts
type RunStatus = "created" | "running" | "stopped"
type TerminationReason =
  | "completion_policy_satisfied"
  | "cancelled"
  | "budget_exhausted"
  | "no_progress"
  | "provider_error"
  | "runtime_error"

interface ModelRequest {
  requestId: string
  runId: string
  step: number
  model: string
  context: ModelContext
  tools: readonly ToolSchema[]
  signal: AbortSignal
  limits: ProviderRequestLimits
  providerOptions?: Readonly<Record<string, unknown>>
}

interface ModelResponse {
  requestId: string
  providerResponseId?: string
  assistantText?: string
  toolCalls: readonly ToolCall[]
  finishReason: "stop" | "tool_calls" | "length" | "content_filter" | "unknown"
  usage: Usage | null
  providerMeta?: Readonly<Record<string, unknown>>
}

interface ToolCall { callId: string; name: string; arguments: unknown }
type ToolObservation =
  | { kind: "tool"; callId: string; toolName: string; status: "success"; output: unknown }
  | { kind: "tool"; callId: string; toolName: string; status: "error"; error: ToolError }

interface HostObservation {
  kind: "host"
  code: string
  summary: string
  details?: readonly string[]
  nextActionHint?: string
}
```

状态与停止原因采用当前 v0.4 术语：`completion_policy_satisfied`、`provider_error`、`runtime_error`。ref 草案里的 `completion_passed/provider_failure/runtime_failure` 仅为旧别名，不进入公共协议。

`Usage` 每个不可得数值保持 `null`，聚合值也保持 unknown；不得将未知当作 0。费用不由 Core 根据价格表猜测。

## 3. Host seams

```ts
interface ContextPolicy<TDomainRef> {
  build(input: {
    runState: Readonly<RunState<TDomainRef>>
    domainStateRef: TDomainRef
    recentEvents: readonly TraceEvent[]
    observations: readonly (ToolObservation | HostObservation)[]
    availableTools: readonly ToolSchema[]
  }): Promise<unknown>
}

interface CompletionPolicy<TDomainRef> {
  evaluate(input: {
    runState: Readonly<RunState<TDomainRef>>
    domainStateRef: TDomainRef
    latestResponse: Readonly<ModelResponse>
  }): Promise<unknown>
}
```

Runner 分别以 `validateModelContext` 和 `validateCompletionDecision` 检查 policy 输出。`ModelContext.systemInstructions` 是 trusted host instructions；task data 和 observations 只能进入普通 message。Core 不把整个 RunState、trace、路径、凭据或 domain ref 自动序列化进模型上下文。

CompletionDecision 为 `{ allowed, code, reason, observation?, proofRef? }`。`proofRef` 只留在 host state/trace 的非模型可见摘要中；拒绝时只有经校验的 `HostObservation` 可进入下一轮。模型文本、名为 finish 的工具或 `done=true` 均无完成权威。

## 4. Tool registry and identity

工具定义包含公开 `name/description/inputSchema` 和 host-only `execute/authorize/timeoutMs`。注册时拒绝重复名称和不受支持的 schema 子集。v1 validator 支持对象、数组、string/number/integer/boolean/null、required、additionalProperties、enum、const、长度及数值边界；不静默忽略未知 schema keyword。

执行固定为串行：callId 格式与唯一性 → 工具存在 → authorization → 参数 schema → budget/cancel → execute → observation。每个 accepted/rejected call 都与原 callId 一一对应。未知工具、非法参数、权限拒绝和可恢复执行错误形成 error observation；重复 callId、孤立结果、停止后提交和 registry 内部损坏为 `runtime_error`。

工具接收 AbortSignal 和只读 run metadata。F26 工具不得包含不可撤销外部副作用。run 停止后返回的结果只写 `late_result_ignored` trace，不进入有效 observations、state 或领域提交。

## 5. State, budget, cancellation

RunState 保存 runId、status、step/tool-call/no-progress 计数、budget、usage、termination、opaque domainStateRef、timestamps。Runner 内部持有可变状态，对 policy、provider 之外仅提供冻结 snapshot。

硬预算为 `maxSteps/maxToolCalls/maxWallTimeMs/maxInputTokens/maxOutputTokens/maxTotalTokens`。在每个 provider/tool 启动边界检查已知硬限制；操作完成后累计观测值。需要依赖未知 token 值的限制不能假称仍有余量：配置此类硬限制而 provider 未返回相应 usage 时，以 `runtime_error` 的 `usage_unavailable_for_enforced_budget` 停止，避免越过用户上限。

Host 的 `cancel()` 触发本 run 的 AbortController。取消优先于 provider/tool 的 AbortError；一旦 stopped，termination immutable。优先级固定为：cancel → runtime invariant → provider error → hard budget → completion pass → no progress → continue。

`stepCount` 在发起 provider 请求前递增，`toolCallCount` 在每个工具调用获准开始前递增。拒绝的未知/非法工具仍产生 observation，但不计执行次数；trace 另记 received/rejected。一次 response 含多个调用时依次处理，达到预算后剩余调用不启动并以 budget 终止。

## 6. Loop semantics

1. `created → running`，记录 `run_started`。
2. 检查 cancel、wall-time 和 step budget。
3. ContextPolicy 构建 unknown，Core 校验为 ModelContext，记录摘要而非凭据。
4. ProviderAdapter 收 canonical request；返回 unknown 经 adapter/runtime validation 成 ModelResponse。
5. 有 tool calls：逐一串行处理；至少一个成功执行或可恢复拒绝后进入下一轮，并将 no-progress 归零。
6. 无 tool call：调用 CompletionPolicy。
7. allowed=true 时停止 `completion_policy_satisfied`；allowed=false 时追加 host observation。连续第二次无工具且拒绝，停止 `no_progress`。
8. 每次停止只通过一个 `stopOnce` 提交 termination 和 `run_stopped`。

Provider 不隐藏重试。`length` finish reason 且无工具仍交 completion policy，由宿主说明缺项；协议无效则 runtime error。Provider 请求失败直接 `provider_error`，但若 signal 已取消则是 `cancelled`。

## 7. Trace and privacy

Trace event 包含 eventId、runId、sequence、type、timestamp、step、相关 requestId/callId、安全 payload。事件至少覆盖 start/context/provider/tool/completion/budget/cancel/late/stopped。Recorder 接收已清洗 payload；默认不记录 API key、Authorization、完整 providerOptions 或未筛选原文。测试使用注入 clock/id factory，生产默认使用系统实现。

Trace 是进程内或 host 提供 sink 的 trajectory；不承担 crash recovery、artifact、memory 或自动 context。sink 失败是 runtime error，避免状态与证据静默分叉。

## 8. DeepSeek adapter

Adapter 使用注入的 transport，便于离线验证请求/响应，不在模块加载时访问网络。它生成 OpenAI-compatible chat-completions payload，显式传 model/messages/tools/tool_choice，凭据只由 transport/config 持有。响应解析验证 choices/message/tool_calls/arguments/usage；arguments JSON 解析失败保留为 invalid-arguments ToolCall 输入，使 Registry 产生可恢复 observation。HTTP、限流、超时、无合法 choice 统一为 ProviderError；v1 不重试。

真实端点和模型名由后续 F27/F33 冻结。F26 只证明 adapter 对离线 wire fixtures 正确，不宣称 DeepSeek 已联网可用。

## 9. Required invariants and test matrix

- vendor wire data 不越过 adapter；所有外部 unknown 经 runtime validation。
- call/result 一一对应，重复 ID 和 stopped 后提交不可改变有效状态。
- RunState、ModelContext、trace、artifact、memory 相互独立。
- 无 Reading/Map/Plan/Stage import 或分支；无隐藏 retry、并行写或工具内模型调用。
- fake Provider 使用与真实 adapter 相同 Runner 路径。
- 覆盖：多轮成功、completion 首拒后成功、连续拒绝、未知工具、非法参数、权限拒绝、工具异常、重复 callId、provider error、各预算边界、provider/tool 中取消、迟到结果、context/completion 非法输出、usage unknown、trace sink failure。

## 10. Non-goals

不含领域工具/workspace/proof closure/bundle、真实模型质量、配置 UI、文档选择、Electron 入口、多 Agent、memory、RAG、skills、checkpoint、后台任务或人工等待状态。

