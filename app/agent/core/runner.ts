import { AgentRuntimeError, ProviderError, isAbortError } from "./errors";
import type { BudgetLimits, CompletionPolicy, ContextPolicy, HostObservation, ModelResponse, ProviderAdapter, RunState, ToolObservation } from "./protocol";
import { budgetFailure, StateController } from "./state";
import { validateCompletionDecision, validateModelContext, validateModelResponse } from "./validation";
import { ToolRegistry } from "../tools/registry";
import { TraceRecorder } from "../trace/recorder";

export interface RunnerOptions<TDomainRef> {
  runId: string; model: string; domainStateRef: TDomainRef; provider: ProviderAdapter;
  contextPolicy: ContextPolicy<TDomainRef>; completionPolicy: CompletionPolicy<TDomainRef>;
  registry?: ToolRegistry; trace?: TraceRecorder; budget?: BudgetLimits;
  providerOptions?: Readonly<Record<string, unknown>>; nowMs?: () => number; id?: () => string;
}
export interface RunResult<TDomainRef> { state: Readonly<RunState<TDomainRef>>; trace: ReturnType<TraceRecorder["snapshot"]>; observations: readonly (ToolObservation | HostObservation)[] }

export class AgentRunner<TDomainRef> {
  readonly #options: RunnerOptions<TDomainRef>; readonly #state: StateController<TDomainRef>;
  readonly #trace: TraceRecorder; readonly #registry: ToolRegistry; readonly #abort = new AbortController();
  readonly #observations: (ToolObservation | HostObservation)[] = []; readonly #nowMs: () => number; readonly #id: () => string;
  #startedMs = 0; #running = false;
  constructor(options: RunnerOptions<TDomainRef>) {
    this.#options = options; this.#nowMs = options.nowMs ?? Date.now; this.#id = options.id ?? (() => crypto.randomUUID());
    this.#state = new StateController(options.runId, options.domainStateRef, options.budget ?? {});
    this.#trace = options.trace ?? new TraceRecorder({ runId: options.runId }); this.#registry = options.registry ?? new ToolRegistry();
  }
  async cancel(message = "Cancelled by host"): Promise<void> {
    if (this.#state.snapshot().status === "stopped") return;
    this.#abort.abort(message); await this.#trace.append("cancel_requested", this.#state.snapshot().stepCount);
    await this.#stop("cancelled", "cancelled", message);
  }
  async run(): Promise<RunResult<TDomainRef>> {
    if (this.#running || this.#state.snapshot().status !== "created") throw new AgentRuntimeError("run_already_started", "Runner can only run once");
    this.#running = true; this.#startedMs = this.#nowMs(); this.#state.start(); await this.#trace.append("run_started", 0);
    try {
      while (this.#state.snapshot().status === "running") await this.#turn();
    } catch (error) {
      if (this.#state.snapshot().status !== "stopped") {
        if (this.#abort.signal.aborted || isAbortError(error)) await this.#stop("cancelled", "cancelled", "Run cancelled");
        else if (error instanceof ProviderError) { await this.#trace.append("provider_request_failed", this.#state.snapshot().stepCount, { payload: { code: error.code } }); await this.#stop("provider_error", error.code, error.message); }
        else await this.#stop("runtime_error", error instanceof AgentRuntimeError ? error.code : "unexpected_error", error instanceof Error ? error.message : "Unexpected runtime error");
      }
    }
    return { state: this.#state.snapshot(), trace: this.#trace.snapshot(), observations: structuredClone(this.#observations) };
  }
  async #turn(): Promise<void> {
    this.#refreshTime(); if (await this.#stopForBoundaryBudget(true)) return;
    this.#state.beginStep(); const step = this.#state.snapshot().stepCount;
    const contextRaw = await this.#options.contextPolicy.build({ runState: this.#state.snapshot(), domainStateRef: this.#options.domainStateRef, recentEvents: this.#trace.snapshot(), observations: structuredClone(this.#observations), availableTools: this.#registry.schemas() });
    if (this.#abort.signal.aborted) return void await this.#stop("cancelled", "cancelled", "Run cancelled");
    const context = validateModelContext(contextRaw); await this.#trace.append("context_built", step, { payload: { messages: context.messages.length, tools: this.#registry.schemas().length } });
    const requestId = this.#id(); await this.#trace.append("provider_request_started", step, { requestId });
    const raw = await this.#options.provider.request({ requestId, runId: this.#options.runId, step, model: this.#options.model, context, tools: this.#registry.schemas(), signal: this.#abort.signal, limits: {}, ...(this.#options.providerOptions === undefined ? {} : { providerOptions: this.#options.providerOptions }) });
    if (this.#state.snapshot().status === "stopped") { await this.#trace.append("late_result_ignored", step, { requestId }); return; }
    const response = validateModelResponse(raw, requestId); this.#state.addUsage(response.usage); this.#assertRequiredUsage(response); this.#refreshTime();
    await this.#trace.append("provider_response_received", step, { requestId, payload: { finishReason: response.finishReason, toolCalls: response.toolCalls.length, usageKnown: response.usage !== null } });
    if (await this.#stopForBoundaryBudget(false)) return;
    if (response.toolCalls.length > 0) { await this.#executeTools(response); return; }
    await this.#complete(response);
  }
  async #executeTools(response: ModelResponse): Promise<void> {
    this.#state.resetNoProgress();
    for (const call of response.toolCalls) {
      if (this.#abort.signal.aborted) return void await this.#stop("cancelled", "cancelled", "Run cancelled");
      await this.#trace.append("tool_call_received", this.#state.snapshot().stepCount, { callId: call.callId, payload: { name: call.name } });
      const limit = this.#state.snapshot().budget.limits.maxToolCalls;
      if (limit !== undefined && this.#state.snapshot().toolCallCount >= limit) return void await this.#stop("budget_exhausted", "max_tool_calls", "Maximum tool calls reached");
      this.#state.beginTool(); await this.#trace.append("tool_execution_started", this.#state.snapshot().stepCount, { callId: call.callId });
      const observation = await this.#registry.execute(call, { signal: this.#abort.signal, runState: this.#state.snapshot() });
      if (this.#state.snapshot().status === "stopped") { await this.#trace.append("late_result_ignored", this.#state.snapshot().stepCount, { callId: call.callId }); return; }
      this.#observations.push(observation);
      await this.#trace.append(observation.status === "error" ? "tool_call_rejected" : "tool_execution_finished", this.#state.snapshot().stepCount, { callId: call.callId, payload: { status: observation.status } });
      this.#refreshTime();
      if (await this.#stopForBoundaryBudget(false)) return;
    }
  }
  async #complete(response: ModelResponse): Promise<void> {
    const raw = await this.#options.completionPolicy.evaluate({ runState: this.#state.snapshot(), domainStateRef: this.#options.domainStateRef, latestResponse: response });
    const decision = validateCompletionDecision(raw); await this.#trace.append("completion_checked", this.#state.snapshot().stepCount, { payload: { allowed: decision.allowed, code: decision.code } });
    if (decision.allowed) return void await this.#stop("completion_policy_satisfied", decision.code, decision.reason);
    if (decision.observation) this.#observations.push(decision.observation);
    await this.#trace.append("completion_rejected", this.#state.snapshot().stepCount, { payload: { code: decision.code } });
    if (this.#state.incrementNoProgress() >= 2) await this.#stop("no_progress", "completion_rejected_twice", decision.reason);
  }
  #refreshTime(): void { this.#state.setWallTime(this.#nowMs() - this.#startedMs); }
  async #stopForBoundaryBudget(beforeStep: boolean): Promise<boolean> {
    const state = this.#state.snapshot();
    const failure = budgetFailure(state);
    if (failure && (beforeStep || failure.code !== "max_steps")) { await this.#stop("budget_exhausted", failure.code, failure.message); return true; }
    return false;
  }
  #assertRequiredUsage(response: ModelResponse): void {
    const limits = this.#state.snapshot().budget.limits;
    if ((limits.maxInputTokens !== undefined && response.usage?.inputTokens == null)
      || (limits.maxOutputTokens !== undefined && response.usage?.outputTokens == null)
      || (limits.maxTotalTokens !== undefined && response.usage?.totalTokens == null)) {
      throw new AgentRuntimeError("usage_unavailable_for_enforced_budget", "Provider did not return usage required by an enforced token budget");
    }
  }
  async #stop(reason: Parameters<StateController<TDomainRef>["stop"]>[0], code: string, message: string): Promise<void> {
    if (this.#state.stop(reason, code, message)) await this.#trace.append("run_stopped", this.#state.snapshot().stepCount, { payload: { reason, code } });
  }
}

