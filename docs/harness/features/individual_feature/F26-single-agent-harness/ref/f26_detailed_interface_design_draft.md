# F26 Single-Agent Harness 详细接口设计问题说明

> Draft v0.1 · 用于回答 F26 进入 Detailed Design / LLD 阶段时的核心接口问题。
>
> 本文基于当前 F26 v0.3 Feature Contract 与前序讨论整理。目标不是直接给出最终代码，而是把 Runner、Provider、Tool Registry、State、Context Policy、Completion Policy、预算、取消、错误与停止语义之间的交接协议写清楚，使后续 Implementation Plan 可以只回答“按什么顺序实现和验证”。

---

## 1. 这份详细接口设计要解决什么

F26 的 Feature Contract 已经回答“要做什么”：建立一个不理解 Reading/Map/Plan/Stage 的通用 Single-Agent Core，由 Agent/Runner、ProviderAdapter、Context、RunState、ToolRegistry、Trace、预算、取消与终止机制组成。

Detailed Design 要继续回答“这些模块具体怎么传话”。如果这一层没有先固定，直接进入编码，Runner 很容易变成同时处理厂商协议、工具参数校验、状态、预算、取消、错误、trace 和完成判断的上帝对象；后续 F31/F32 接入时也容易把领域逻辑重新塞回 Core。

本文将问题分成四组、八个子问题：

| 类别 | 子问题 | 核心问题 | 主要模块 |
| --- | --- | --- | --- |
| External Protocol | 1. Runner ↔ Provider | Runner 给模型什么、模型返回什么 | ProviderAdapter |
| External Protocol | 2. Runner ↔ ToolRegistry | Tool call 如何校验、执行、变成 observation | ToolRegistry |
| Host Policy | 3. Context Policy | 每轮模型允许看到什么 | Context |
| Host Policy | 4. Completion Policy | 模型什么时候才被允许真正完成 | Completion Policy |
| Runtime Control | 5. RunState + Trace | 当前状态是什么、怎么走到这里 | State / Trace |
| Runtime Control | 6. Budget + Cancel + Termination | 什么时候必须停止、停止原因是什么 | Runner / State |
| Protocol Semantics | 7. Error Model | 哪些错误交给 Agent 修，哪些由 Host 处理，哪些立即终止 | Errors / Runner |
| Protocol Verification | 8. State Machine + Sequence | 正常与失败路径如何组合为完整运行协议 | Runner / Tests |

这八个问题最终共同回答用户关心的四件事：

1. Runner 给 Provider 什么，模型返回什么；
2. Tool call 怎么交给 Registry，结果怎么返回 Agent；
3. State、预算、取消和停止原因怎么记录；
4. Host 如何提供 Context Policy，以及如何把“拒绝完成”的原因交还给 Agent。

---

## 2. 总体运行模型

F26 的核心运行模型应保持非常薄：

```text
Host
  │
  │ start(runConfig, contextPolicy, completionPolicy)
  ▼
Runner
  │
  ├─► ContextPolicy.build(...)
  │        │
  │        └─► ModelContext
  │
  ├─► Provider.request(ModelRequest)
  │        │
  │        └─► ModelResponse
  │
  ├─► ToolRegistry.execute(ToolCall)     [若存在 tool call]
  │        │
  │        └─► ToolObservation
  │
  ├─► update RunState
  ├─► append Trace
  │
  ├─► CompletionPolicy.evaluate(...)     [需要检查完成时]
  │        │
  │        ├─ PASS   → stop(completion_passed)
  │        └─ REJECT → HostObservation → 下一轮
  │
  └─► repeat / stop
```

核心原则是：

- Agent/模型决定“下一步想做什么”；
- Registry 决定“这个工具调用是否合法并实际执行什么”；
- Context Policy 决定“这一轮允许模型看到什么”；
- Completion Policy 决定“现在是否真的可以结束”；
- Runner 只负责 orchestration，不解释领域含义；
- State、预算、取消、停止原因均由宿主程序拥有；
- Trace 记录轨迹，但不是 Artifact，也不是跨任务 Memory。

---

# Part A — External Protocol

## 3. Runner ↔ Provider：模型调用协议

### 3.1 设计目标

Runner 不应该直接识别 DeepSeek/OpenAI/Claude 的原生响应格式。ProviderAdapter 的职责是把厂商 wire format 转成 F26 自己的 canonical protocol。

因此关系应该是：

```text
Runner
  ↓ canonical request
ProviderAdapter
  ↓ vendor request
DeepSeek / Other Provider
  ↓ vendor response
ProviderAdapter
  ↓ canonical response
Runner
```

这样未来替换 Provider 时，Runner、State、Registry 和 Completion Policy 都不需要修改。

### 3.2 Runner 给 Provider 什么

以下用 TypeScript 风格伪类型表达协议；它表示数据契约，不强制实现语言必须是 TypeScript。如果 F26 继续使用 JavaScript，可转成 JSDoc + runtime validation。

```ts
interface ModelRequest {
  requestId: string
  runId: string
  step: number

  model: string
  context: ModelContext
  tools: ToolSchema[]

  abortSignal: AbortSignal
  limits: ProviderRequestLimits

  // 只允许经过 Adapter 明确白名单的厂商特定选项
  providerOptions?: Record<string, unknown>
}
```

其中 `ModelContext` 不是整个 `RunState` 的 JSON dump，而是 Context Policy 已经筛选好的“模型可见上下文”。

```ts
interface ModelContext {
  systemInstructions: string
  messages: ModelMessage[]
  metadata?: Record<string, string | number | boolean>
}
```

`metadata` 只能包含允许暴露给模型/Provider 的非敏感信息。凭据、Host 私有路径、内部 proof 状态等不能因为它们存在于 RunState 就自动进入 ModelContext。

### 3.3 Provider 返回什么

```ts
interface ModelResponse {
  requestId: string
  providerResponseId?: string

  assistantText?: string
  toolCalls: ToolCall[]

  finishReason: ModelFinishReason
  usage: Usage | null

  // 调试所需、但 Runner 不依赖其语义的厂商信息
  providerMeta?: Record<string, unknown>
}
```

`toolCalls` 必须统一成自己的格式：

```ts
interface ToolCall {
  callId: string
  name: string
  arguments: unknown
}
```

Usage 未知时必须显式为 `null` 或 `known=false`，不能用 `0` 冒充已知：

```ts
interface Usage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  cost?: number
  currency?: string
}
```

### 3.4 ProviderAdapter 的职责边界

ProviderAdapter 负责：

- 把 canonical `ModelRequest` 转成厂商 API 请求；
- 把厂商响应标准化为 `ModelResponse`；
- 标准化 tool call ID、参数、finish reason 和 usage；
- 接收并传递取消信号；
- 把厂商错误归一化为 `ProviderError`；
- 不做领域判断；
- 不执行 Tool；
- 不决定任务是否完成；
- 不修改 RunState 中的业务状态。

### 3.5 第一版 Provider 错误策略

F26 v0.1 不建议加入隐藏自动重试。Provider 请求失败时，Adapter 返回/抛出规范化的 `ProviderError`，Runner 按明确策略停止为 `provider_failure`。未来如需 bounded retry，应作为显式 Host Policy，而不是藏在 Adapter 内部。

理由是：实验阶段需要准确知道一次 Run 为什么失败。Adapter 暗中重试会污染 latency、turn、cost 与 trajectory 统计。

---

## 4. Runner ↔ ToolRegistry：工具调用协议

### 4.1 Tool Definition

Registry 中的工具定义应把“模型能看到的 schema”与“Host 内部执行信息”分开。

```ts
interface ToolDefinition {
  name: string
  description: string
  inputSchema: JsonSchema

  // Host-only
  execute: ToolExecutor
  permissions?: ToolPermissionRule
  timeoutMs?: number
}
```

模型只看到：

```text
name
+ description
+ inputSchema
```

不能看到 Host 的执行函数、真实文件路径、权限实现、内部 token 或 validator 对象。

### 4.2 Tool call 的处理顺序

模型返回：

```ts
ToolCall {
  callId: "call-17",
  name: "some_tool",
  arguments: {...}
}
```

Runner 交给 Registry 后，第一版建议固定执行顺序：

```text
1. callId 是否合法且未重复
2. tool name 是否存在
3. 当前 run 是否允许调用该工具
4. arguments 是否能解析
5. arguments 是否通过 JSON Schema/runtime validation
6. 容量/权限/运行状态是否允许执行
7. execute
8. 生成 ToolObservation
9. 写 Trace
10. 返回 Runner
```

F26 第一版不要做隐式并行执行。即使模型一次返回多个 ToolCall，也按响应中的顺序串行执行。后续若要对只读工具做并行优化，应单独设计并发语义，不能在 v0.1 中隐式发生。

### 4.3 ToolObservation

无论成功还是可恢复失败，工具执行结果都应该形成统一 observation：

```ts
type ToolObservation =
  | {
      callId: string
      toolName: string
      status: "success"
      output: unknown
    }
  | {
      callId: string
      toolName: string
      status: "error"
      error: ToolError
    }
```

Runner 把 observation 加入 Host 管理的运行历史，由下一轮 Context Policy 决定如何呈现给模型。

### 4.4 Tool error 和 Runtime error 必须区分

以下错误通常属于 Agent 可恢复错误，应返回 observation：

```text
unknown_tool
invalid_arguments
permission_denied
not_found
domain_validation_failed
tool_execution_failed（如果失败是业务级、可向 Agent 解释）
```

例如：

```text
Agent 调用 read_section("不存在的 section")
→ Registry 返回 not_found observation
→ Agent 下一轮自行改用正确 ID
```

但以下属于 Harness invariant 破坏，不能伪装成普通 ToolObservation：

```text
同一 callId 被重复绑定到两个不同调用
ToolObservation 找不到对应的 ToolCall
Run 已经 stopped，但 Registry 仍提交结果
Registry 内部状态损坏
```

这些应导致 `runtime_failure`。

### 4.5 迟到 Tool Result

取消或终止后，已经在执行的异步 Tool 可能迟到。规则应明确：

```text
Run stopped
  ↓
late tool result arrives
  ↓
不写入有效 State
不产生新的领域副作用提交
trace: late_result_ignored
```

若某工具本身产生不可撤销外部副作用，则它在未来必须拥有独立的 approval/transaction 设计；F26 v0.1 的 Domain Tools 应避免这类动作。

---

# Part B — Host Policy

## 5. Context Policy：Host 如何决定模型每轮看到什么

### 5.1 Context Policy 的本质

Context Policy 不是固定 Workflow，也不是一个“Stage Router”。它只回答：

> 当前这一步，哪些信息可以进入模型 Context？

F26 Core 只定义接口，不理解 Reading/Map/Plan/Stage。后续 F31 实现 AI Design Review 的领域 Context Policy。

### 5.2 推荐接口

```ts
interface ContextPolicy {
  build(input: ContextBuildInput): Promise<ModelContext>
}

interface ContextBuildInput {
  runState: Readonly<RunState>
  domainStateRef: unknown
  recentEvents: readonly TraceEvent[]
  availableTools: readonly ToolSchema[]
}
```

这里 `domainStateRef` 对 Core 是 opaque reference。Core 不读取其中 Map/Plan/Review 等领域字段。

### 5.3 信任边界

Context Policy 必须明确区分：

```text
Trusted Host Instructions
vs
Untrusted Task Data
vs
Tool Observations
```

不能因为原文里写着：

```text
Ignore all previous instructions...
```

就把它提升成 System Instruction。

推荐模型上下文结构：

```text
System / Host Instructions
  ├─ Agent role
  ├─ hard runtime rules
  └─ allowed behavior

Task / Domain Context
  ├─ user goal
  ├─ source/document data
  ├─ current artifact facts
  └─ recent tool observations

Tool Schemas
```

### 5.4 Context Policy 与 State 的关系

必须坚持：

```text
RunState = Host 当前知道的完整运行状态
ModelContext = Host 选择让模型看到的子集
```

因此不允许：

```ts
messages.push(JSON.stringify(runState))
```

这种偷懒实现。

---

## 6. Completion Policy：Host 如何拒绝模型“我完成了”

### 6.1 Completion 的权威属于 Host

模型不能通过以下任何方式自行把 Run 设置成完成：

- assistant text 说“任务完成”；
- tool call 名为 finish；
- 返回 `done=true`；
- 输出某个伪造的 PASS 字段。

只有 Host Completion Policy 有权返回允许完成的判断。

### 6.2 推荐接口

```ts
interface CompletionPolicy {
  evaluate(input: CompletionInput): Promise<CompletionDecision>
}

interface CompletionInput {
  runState: Readonly<RunState>
  domainStateRef: unknown
  latestResponse: ModelResponse
}

interface CompletionDecision {
  allowed: boolean
  code: string
  reason: string

  // 允许暴露给 Agent 的拒绝说明
  observation?: HostObservation

  // Host-only，可用于后续证明链
  proofRef?: unknown
}
```

F26 只定义 `CompletionDecision` 的通用协议；F32 才实现 AI Design Review 的真正 completion closure。

### 6.3 什么时候检查 Completion

F26 v0.1 默认规则建议：

- 若模型返回 ToolCall：执行工具、记录 observation，进入下一轮；
- 若模型返回“无 ToolCall 的普通响应”：Runner 调用 Completion Policy；
- 若 `allowed=true`：停止为 `completion_passed`；
- 若 `allowed=false`：把 `observation` 作为 Host Observation 写入运行历史，并进入下一轮；
- 若连续第二次“无 ToolCall + Completion REJECT”：停止为 `no_progress`；
- 取消、硬预算和 fatal runtime failure 的优先级高于 Completion/no-progress。

### 6.4 拒绝完成应该返回什么

不要只返回：

```text
Not complete.
```

应该尽可能返回可执行、可定位的 Host Observation。例如：

```json
{
  "type": "completion_rejected",
  "summary": "Required evidence is incomplete.",
  "missing": [
    "artifact X has no current proof",
    "required output Y is missing"
  ],
  "nextActionHint": "Use the available tools to repair or produce the missing items."
}
```

F26 不理解 `missing` 的领域语义，只负责把 F32/F31 Host Policy 产生的 observation 安全交还给 Agent。

---

# Part C — Runtime Control

## 7. RunState：当前运行状态怎么记录

### 7.1 RunState 只表示“现在是什么状态”

推荐第一版最小结构：

```ts
interface RunState {
  runId: string
  status: "created" | "running" | "stopped"

  stepCount: number
  toolCallCount: number
  consecutiveNoProgress: number

  budget: BudgetState
  usage: UsageAggregate

  termination: TerminationRecord | null

  // Core 不理解内部内容
  domainStateRef: unknown

  startedAt?: string
  stoppedAt?: string
}
```

不要把领域 Artifact 直接塞进 F26 的通用 `RunState` 字段中。

### 7.2 Trace：怎么走到当前状态

RunState 和 Trace 不能合并：

```text
RunState = 当前投影
Trace = append-only trajectory evidence
```

建议 TraceEvent 至少覆盖：

```text
run_started
context_built
provider_request_started
provider_response_received
provider_request_failed
tool_call_received
tool_call_rejected
tool_execution_started
tool_execution_finished
completion_checked
completion_rejected
budget_updated
cancel_requested
late_result_ignored
run_stopped
```

TraceRecorder 第一版不需要承担 crash recovery/event sourcing；跨进程恢复目前不在 F26 范围内。

---

## 8. Budget、取消与停止原因

### 8.1 Budget 是 Host 状态，不是模型自报

```ts
interface BudgetLimits {
  maxSteps?: number
  maxToolCalls?: number
  maxWallTimeMs?: number
  maxInputTokens?: number
  maxOutputTokens?: number
  maxTotalTokens?: number
}
```

对应状态：

```ts
interface BudgetState {
  limits: BudgetLimits
  observed: {
    steps: number
    toolCalls: number
    wallTimeMs: number
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
  }
}
```

如果 Provider 无法返回 token usage，对应值保持 `null/unknown`，不能把它当 0，也不能因此假称预算还有多少。

### 8.2 Cancellation

建议以标准 `AbortController / AbortSignal` 作为 Node Runtime 的统一取消机制：

```text
Host cancel
   ↓
Runner AbortController.abort()
   ↓
Provider request receives signal
Tool execution receives signal
   ↓
Run transitions to stopped(cancelled)
```

取消之后：

- 不再启动新的 Provider 请求；
- 不再启动新的 Tool；
- 迟到 Provider/Tool 结果不改变有效 State；
- Trace 记录取消请求和迟到结果被忽略。

### 8.3 停止状态和停止原因必须分开

```ts
type RunStatus = "created" | "running" | "stopped"

type TerminationReason =
  | "completion_passed"
  | "cancelled"
  | "budget_exhausted"
  | "no_progress"
  | "provider_failure"
  | "runtime_failure"
```

即：

```text
status = stopped
```

只表示循环不再继续；真正为什么停止，要看 `termination.reason`。

### 8.4 停止优先级

建议 F26 v0.1 固定优先级，避免竞态时各模块自行决定：

```text
1. explicit cancel
2. fatal runtime invariant failure
3. provider fatal failure（如果请求已因 cancel 中止，则按 cancelled）
4. hard budget exhausted
5. completion passed
6. no-progress policy
7. continue
```

重要原则：一旦 `RunState.status=stopped`，停止原因不可被迟到结果覆盖。

---

# Part D — Protocol Semantics & Verification

## 9. Error Model：错误应该由谁处理

建议至少分为三类。

### 9.1 Agent-recoverable

可以转换成 observation，让 Agent 自己纠正：

```text
unknown_tool
invalid_tool_arguments
permission_denied
resource_not_found
domain_validation_failed
recoverable_tool_error
completion_rejected
```

这些不是 Harness 崩溃。

### 9.2 Host-recoverable（第一版尽量少做）

例如未来可能加入：

```text
bounded provider retry
rate-limit backoff
transient tool retry
```

但 F26 v0.1 不建议默认实现隐藏重试。若以后加入，也必须进入 Trace 和预算统计。

### 9.3 Fatal Runtime Error

必须停止：

```text
call/result identity corruption
impossible state transition
run stopped 后仍试图 commit 状态
Context Policy 违反接口合同
Registry invariant corruption
State ownership violation
```

这些错误不应该包装成 ToolObservation 再让模型“尝试修复”。

---

## 10. Runner 的状态机

推荐第一版只保留非常少的状态：

```text
CREATED
   │ start
   ▼
RUNNING
   │
   ├─ completion passed ──────────────┐
   ├─ cancelled ──────────────────────┤
   ├─ budget exhausted ───────────────┤
   ├─ no progress ────────────────────┤
   ├─ provider failure ───────────────┤
   └─ runtime failure ────────────────┤
                                      ▼
                                   STOPPED
```

不要在 F26 v0.1 提前加入：

```text
PAUSED
WAITING_FOR_HUMAN
RESUMING
CHECKPOINTED
BACKGROUND
```

这些能力目前不在 F26 范围内。

---

## 11. 完整 Happy Path

```text
Host
 │
 │ create RunState + policies + registry
 ▼
Runner
 │
 │ status = running
 │ trace(run_started)
 │
 ├── ContextPolicy.build(...)
 │      └── ModelContext
 │
 ├── Provider.request(ModelRequest, AbortSignal)
 │      └── ModelResponse(toolCalls=[call-1])
 │
 ├── Registry.execute(call-1)
 │      └── ToolObservation(success)
 │
 ├── update state + budget + trace
 │
 ├── ContextPolicy.build(...)
 │
 ├── Provider.request(...)
 │      └── ModelResponse(no tool call)
 │
 ├── CompletionPolicy.evaluate(...)
 │      └── REJECT + HostObservation(missing ...)
 │
 ├── append HostObservation
 ├── trace(completion_rejected)
 │
 ├── Provider.request(...)
 │      └── ModelResponse(toolCalls=[call-2])
 │
 ├── Registry.execute(call-2)
 │
 │   ...
 │
 ├── Provider.request(...)
 │      └── ModelResponse(no tool call)
 │
 ├── CompletionPolicy.evaluate(...)
 │      └── PASS
 │
 └── status = stopped
     termination = completion_passed
     trace(run_stopped)
```

---

## 12. 必须在 Detailed Design 中推演的失败序列

### 12.1 Unknown tool

```text
Model → unknown tool
Registry → rejected observation
Runner → observation back to context
Agent → may correct next turn
```

### 12.2 Invalid arguments

```text
Model → known tool + bad args
Registry → schema validation fails
→ error observation
→ no tool execution
→ Agent can retry with corrected args
```

### 12.3 Tool execution error

```text
Tool starts
→ recoverable domain error
→ ToolObservation(error)
→ Agent decides next action
```

若发生 Registry invariant corruption，则直接 `runtime_failure`。

### 12.4 Provider failure

```text
Provider request
→ fatal provider error
→ no hidden retry in v0.1
→ stopped(provider_failure)
```

### 12.5 Cancel during Provider request

```text
Host cancel
→ abort signal
→ run stopped(cancelled)
→ provider returns late
→ late response ignored
→ termination reason remains cancelled
```

### 12.6 Cancel during Tool execution

同样传播 AbortSignal；已停止 run 不接受迟到 Tool result commit。

### 12.7 Budget exhausted

预算检查应出现在每个可继续循环的边界。超过 hard limit 后不再发起下一次 Provider/Tool 操作，停止为 `budget_exhausted`。

### 12.8 No-tool + Completion rejected

```text
Turn N:
no tool
→ completion rejected
→ HostObservation
→ consecutiveNoProgress = 1

Turn N+1:
no tool
→ completion still rejected
→ consecutiveNoProgress = 2
→ stopped(no_progress)
```

只要中间出现合法 ToolCall / 有效进展，计数应按设计重置。

---

## 13. F26 应冻结的核心不变量（Invariants）

在开始写 Runner 之前，建议把以下 invariant 写进详细设计和测试：

1. Provider-specific response 永远不能越过 Adapter 进入 Runner。
2. Tool Result 必须有且只能对应一个 `callId`。
3. Tool 参数必须 runtime validate；静态类型不能替代输入校验。
4. 模型不能直接修改 `RunState`、预算、停止原因或 Completion result。
5. `RunState` 与 `ModelContext` 是两个不同概念，Context 只是 Host 允许暴露的视图。
6. `RunState.status=stopped` 后，任何迟到 Provider/Tool 结果都不能重新打开或改写有效状态。
7. 未知 usage 保持 unknown，不以 0 替代。
8. Completion rejection 不是 Runtime error。
9. Tool/domain error 与 Harness invariant failure 必须分开。
10. Trace 不等于 Artifact，不等于 Memory，也不作为模型可见上下文的自动来源。
11. Core 不 import Reading/Map/Plan/Stage 等领域模块。
12. 第一版不存在隐藏无限 retry、隐藏 Tool 内模型调用或隐式并发写入。

---

## 14. 四个用户问题的直接答案

### Q1. Runner 给 Provider 什么，模型返回什么？

Runner 应通过 ProviderAdapter 传递一个 canonical `ModelRequest`，至少包含 `requestId/runId/step/model/ModelContext/ToolSchemas/AbortSignal/request limits`。ProviderAdapter 把它转换成 DeepSeek 等厂商请求，再把原生响应标准化为 `ModelResponse`：`assistantText + toolCalls + finishReason + usage + providerMeta`。Runner 永远不直接解析厂商原始 JSON。

### Q2. 工具调用怎么交给 Registry，结果怎么返回 Agent？

模型的 `ToolCall(callId/name/arguments)` 进入 Registry 后，依次经过工具存在性、权限、参数解析和 runtime schema 校验，再串行执行。结果统一变成 `ToolObservation(success|error)`，必须保留原 `callId`。Runner 将 observation 写入运行历史/trace，下一轮由 Context Policy 决定如何呈现给 Agent。业务级失败可以作为 observation 让 Agent 修正；Harness invariant 破坏则立即 `runtime_failure`。

### Q3. State、预算、取消和停止原因怎么记录？

`RunState` 是 Host 权威的当前状态，至少记录 `status/stepCount/toolCallCount/budget/usage/termination/domainStateRef/timestamps`。Trace 用 append-only event 记录运行轨迹，两者不混。预算由 Host 根据真实观察值更新，未知 token/费用保持 unknown。取消统一通过 AbortSignal 向 Provider/Tool 传播；Run 一旦 stopped，迟到结果不得改写状态。`status=stopped` 与 `terminationReason` 分离，原因至少包括 `completion_passed/cancelled/budget_exhausted/no_progress/provider_failure/runtime_failure`。

### Q4. 宿主如何提供 Context Policy、拒绝完成的原因？

F26 只定义两个宿主 seam：`ContextPolicy.build()` 与 `CompletionPolicy.evaluate()`。Context Policy 从 Host State/Domain State 选择本轮模型允许看到的指令、消息和工具，不让 Core 理解领域 Stage。模型无 ToolCall 时，Runner 调 Completion Policy；若拒绝，Policy 返回结构化 `CompletionDecision{allowed:false, reason, observation}`，Runner 把其中安全的 HostObservation 交还给 Agent。连续两次无 ToolCall 且均被拒绝，默认以 `no_progress` 停止；真正的领域 Completion Policy 由 F32 实现。

---

## 15. 与后续 F31 / F32 的接口边界

F26 只冻结通用 seam：

```text
ProviderAdapter
ToolRegistry
ContextPolicy
CompletionPolicy
RunState
TraceRecorder
Budget/Cancel/Termination
```

F31 以后负责提供：

```text
AI Design Review Domain Context Policy
Source/Contract/Artifact/Validation Tools
Domain State / Workspace
```

F32 以后负责提供：

```text
AI Design Review Completion Policy
Proof closure
Bundle assembly / verify / publish
```

因此 F26 的详细设计中可以出现：

```text
contextPolicy.build(...)
completionPolicy.evaluate(...)
domainStateRef
```

但不能出现：

```text
if frameworkMap...
if stageB...
if overviewPlan...
```

---

## 16. 实现语言说明

本文使用 TypeScript 风格类型来表达接口，是因为这类协议包含大量 discriminated union、状态和错误类型，TypeScript 表达最清晰。

对当前项目的工程建议仍是：

- 如果希望最快落地且不改构建系统：JavaScript + JSDoc + runtime validation；
- 如果愿意把 `app/agent/` 作为新的长期稳定模块：优先 TypeScript / Node.js；
- 不建议 F26–F32 核心 Runtime 使用 Python，因为现有 Electron、validators、assembler、bundle 和 shared semantics 都在 Node/JavaScript 世界中，Python 会额外引入进程管理、IPC、打包和取消传播成本；
- Python 可以保留给 F33 后续的离线统计、实验数据分析或 notebook，但不应形成第二套 Agent Runtime。

无论选择 JS 还是 TS，来自模型的 Tool 参数都必须做 runtime validation；静态类型无法替代对不可信 LLM 输出的运行时校验。

---

## 17. 从这份文档进入 Implementation Plan 的条件

只有以下问题全部没有模糊答案后，才建议写 Implementation Plan：

- [ ] `ModelRequest / ModelResponse / ToolCall / ToolObservation` 已冻结；
- [ ] ProviderError 与 ToolError 的错误分类已冻结；
- [ ] ContextPolicy 和 CompletionPolicy 的接口已冻结；
- [ ] RunState、TraceEvent、BudgetState、TerminationReason 已冻结；
- [ ] 取消和迟到结果的处理已冻结；
- [ ] 无工具响应与 `no_progress` 规则已冻结；
- [ ] 正常 Happy Path 可以完整推演；
- [ ] 8 类关键失败路径都能推演到唯一结果；
- [ ] F26 Core 中没有 Reading/Map/Plan/Stage 领域 import 或条件分支；
- [ ] Runner 可以在不知道 DeepSeek、Electron 和 AI Design Review 具体业务的情况下被理解和测试。

达到这些条件以后，Implementation Plan 就不再需要讨论“接口应该长什么样”，而只需要回答：

```text
先建哪些类型/协议
→ 再实现哪些模块
→ 每一步用什么 fake/fixture 验证
→ 最后怎样证明 F26 Feature Contract 完成
```

这才是从 Detailed Design 进入编码的合理分界。
