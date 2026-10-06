export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RunStatus = "created" | "running" | "stopped";
export type TerminationReason =
  | "completion_policy_satisfied"
  | "cancelled"
  | "budget_exhausted"
  | "no_progress"
  | "provider_error"
  | "runtime_error";

export type ModelFinishReason = "stop" | "tool_calls" | "length" | "content_filter" | "unknown";
export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ModelMessage {
  role: MessageRole;
  content: string;
  callId?: string;
}

export interface ModelContext {
  systemInstructions: string;
  messages: readonly ModelMessage[];
  metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface JsonSchema {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  properties?: Readonly<Record<string, JsonSchema>>;
  required?: readonly string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: readonly JsonPrimitive[];
  const?: JsonPrimitive;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface ToolCall {
  callId: string;
  name: string;
  arguments: unknown;
}

export interface Usage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  currency: string | null;
}

export interface ProviderRequestLimits {
  maxOutputTokens?: number;
}

export interface ModelRequest {
  requestId: string;
  runId: string;
  step: number;
  model: string;
  context: ModelContext;
  tools: readonly ToolSchema[];
  signal: AbortSignal;
  limits: ProviderRequestLimits;
  providerOptions?: Readonly<Record<string, unknown>>;
}

export interface ModelResponse {
  requestId: string;
  providerResponseId?: string;
  assistantText?: string;
  toolCalls: readonly ToolCall[];
  finishReason: ModelFinishReason;
  usage: Usage | null;
  providerMeta?: Readonly<Record<string, unknown>>;
}

export interface ToolError {
  code:
    | "unknown_tool"
    | "invalid_arguments"
    | "permission_denied"
    | "tool_timeout"
    | "tool_execution_failed";
  message: string;
  details?: readonly string[];
}

export type ToolObservation =
  | { kind: "tool"; callId: string; toolName: string; status: "success"; output: unknown }
  | { kind: "tool"; callId: string; toolName: string; status: "error"; error: ToolError };

export interface HostObservation {
  kind: "host";
  code: string;
  summary: string;
  details?: readonly string[];
  nextActionHint?: string;
}

export interface CompletionDecision {
  allowed: boolean;
  code: string;
  reason: string;
  observation?: HostObservation;
  proofRef?: unknown;
}

export interface BudgetLimits {
  maxSteps?: number;
  maxToolCalls?: number;
  maxWallTimeMs?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxTotalTokens?: number;
}

export interface BudgetObserved {
  steps: number;
  toolCalls: number;
  wallTimeMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface TerminationRecord {
  reason: TerminationReason;
  code: string;
  message: string;
  at: string;
}

export interface RunState<TDomainRef = unknown> {
  runId: string;
  status: RunStatus;
  stepCount: number;
  toolCallCount: number;
  consecutiveNoProgress: number;
  budget: { limits: BudgetLimits; observed: BudgetObserved };
  termination: TerminationRecord | null;
  domainStateRef: TDomainRef;
  startedAt: string | null;
  stoppedAt: string | null;
}

export type TraceEventType =
  | "run_started" | "context_built" | "provider_request_started"
  | "provider_response_received" | "provider_request_failed"
  | "tool_call_received" | "tool_call_rejected" | "tool_execution_started"
  | "tool_execution_finished" | "completion_checked" | "completion_rejected"
  | "budget_updated" | "cancel_requested" | "late_result_ignored" | "run_stopped";

export interface TraceEvent {
  eventId: string;
  runId: string;
  sequence: number;
  type: TraceEventType;
  timestamp: string;
  step: number;
  requestId?: string;
  callId?: string;
  payload?: Readonly<Record<string, unknown>>;
}

export interface ProviderAdapter {
  request(request: ModelRequest): Promise<unknown>;
}

export interface ContextPolicy<TDomainRef> {
  build(input: {
    runState: Readonly<RunState<TDomainRef>>;
    domainStateRef: TDomainRef;
    recentEvents: readonly TraceEvent[];
    observations: readonly (ToolObservation | HostObservation)[];
    availableTools: readonly ToolSchema[];
  }): Promise<unknown>;
}

export interface CompletionPolicy<TDomainRef> {
  evaluate(input: {
    runState: Readonly<RunState<TDomainRef>>;
    domainStateRef: TDomainRef;
    latestResponse: Readonly<ModelResponse>;
  }): Promise<unknown>;
}
