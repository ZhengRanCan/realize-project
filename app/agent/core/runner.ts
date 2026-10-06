import { AgentRuntimeError, ProviderError, isAbortError } from "./errors";
import type { BudgetLimits, CompletionPolicy, ContextPolicy, HostObservation, ModelResponse, ProviderAdapter, RunState, ToolObservation } from "./protocol";
import { budgetFailure, StateController } from "./state";
import { validateCompletionDecision, validateModelContext, validateModelResponse } from "./validation";
import { ToolRegistry } from "../tools/registry";
import { TraceRecorder } from "../trace/recorder";

export interface RunnerOptions<T> { runId: string; model: string; domainStateRef: T; provider: ProviderAdapter; contextPolicy: ContextPolicy<T>; completionPolicy: CompletionPolicy<T>; registry?: ToolRegistry; trace?: TraceRecorder; budget?: BudgetLimits; providerOptions?: Readonly<Record<string, unknown>>; nowMs?: () => number; id?: () => string }
export interface RunResult<T> { state: Readonly<RunState<T>>; trace: ReturnType<TraceRecorder["snapshot"]>; observations: readonly (ToolObservation | HostObservation)[] }

export class AgentRunner<T> {
  readonly #options: RunnerOptions<T>; readonly #state: StateController<T>; readonly #trace: TraceRecorder; readonly #registry: ToolRegistry;
  readonly #abort = new AbortController(); readonly #observations: (ToolObservation | HostObservation)[] = []; readonly #nowMs: () => number; readonly #id: () => string;
  #startedMs = 0; #running = false; #stopPromise: Promise<void> | null = null; #terminalCommitted = false;
  constructor(options: RunnerOptions<T>) { this.#options = options; this.#nowMs = options.nowMs ?? Date.now; this.#id = options.id ?? (() => crypto.randomUUID()); this.#state = new StateController(options.runId, options.domainStateRef, options.budget ?? {}); this.#trace = options.trace ?? new TraceRecorder({ runId: options.runId }); this.#registry = options.registry ?? new ToolRegistry(); }
  async cancel(message = "Cancelled by host"): Promise<void> { if (this.#state.snapshot().status === "stopped" || this.#terminalCommitted) return; this.#abort.abort(message); await this.#stop("cancelled", "cancelled", message, true); }
  async run(): Promise<RunResult<T>> {
    if (this.#running || this.#state.snapshot().status !== "created") throw new AgentRuntimeError("run_already_started", "Runner can only run once");
    this.#running = true; this.#startedMs = this.#nowMs(); this.#state.start();
    try { await this.#trace.append("run_started", 0); while (this.#state.snapshot().status === "running") await this.#turn(); }
    catch (error) {
      if (this.#state.snapshot().status !== "stopped") {
        if (this.#abort.signal.aborted) await this.#stop("cancelled", "cancelled", "Run cancelled");
        else if (error instanceof AgentRuntimeError && error.code === "max_wall_time") await this.#stop("budget_exhausted", error.code, error.message);
        else if (error instanceof ProviderError) { await this.#safeTrace("provider_request_failed", { payload: { code: error.code } }); await this.#stop("provider_error", error.code, error.message); }
        else await this.#stop("runtime_error", error instanceof AgentRuntimeError ? error.code : "unexpected_error", errorMessage(error));
      }
    }
    return { state: this.#state.snapshot(), trace: this.#trace.snapshot(), observations: structuredClone(this.#observations) };
  }
  async #turn(): Promise<void> {
    this.#refreshTime(); if (await this.#stopForBudget(true)) return; this.#state.beginStep(); const step = this.#state.snapshot().stepCount;
    const contextRaw = await this.#withDeadline(() => this.#options.contextPolicy.build({ runState: this.#state.snapshot(), domainStateRef: this.#options.domainStateRef, recentEvents: this.#trace.snapshot(), observations: structuredClone(this.#observations), availableTools: this.#registry.schemas() }));
    if (await this.#stopIfCancelled()) return; const context = validateModelContext(contextRaw);
    await this.#trace.append("context_built", step, { payload: { messages: context.messages.length, tools: this.#registry.schemas().length } }); const requestId = this.#id(); await this.#trace.append("provider_request_started", step, { requestId });
    let raw: unknown;
    const maxOutputTokens = this.#state.snapshot().budget.limits.maxOutputTokens;
    try { raw = await this.#withDeadline((signal) => this.#options.provider.request({ requestId, runId: this.#options.runId, step, model: this.#options.model, context, tools: this.#registry.schemas(), signal, limits: maxOutputTokens === undefined ? {} : { maxOutputTokens }, ...(this.#options.providerOptions === undefined ? {} : { providerOptions: this.#options.providerOptions }) })); }
    catch (error) { if (!this.#abort.signal.aborted && isAbortError(error)) throw new ProviderError("provider_aborted", "Provider aborted without host cancellation", error); throw error; }
    if (await this.#ignoreLate({ requestId })) return; const response = validateModelResponse(raw, requestId); this.#state.addUsage(response.usage); this.#assertUsage(response); this.#refreshTime();
    await this.#trace.append("provider_response_received", step, { requestId, payload: { finishReason: response.finishReason, toolCalls: response.toolCalls.length, usageKnown: response.usage !== null } });
    if (await this.#stopForBudget(false)) return; if (response.toolCalls.length) return this.#executeTools(response); await this.#complete(response);
  }
  async #executeTools(response: ModelResponse): Promise<void> {
    this.#state.resetNoProgress();
    for (const call of response.toolCalls) {
      if (await this.#stopIfCancelled()) return; await this.#trace.append("tool_call_received", this.#state.snapshot().stepCount, { callId: call.callId, payload: { name: call.name } });
      const limit = this.#state.snapshot().budget.limits.maxToolCalls; if (limit !== undefined && this.#state.snapshot().toolCallCount >= limit) return void await this.#stop("budget_exhausted", "max_tool_calls", "Maximum tool calls reached");
      this.#state.beginTool(); await this.#trace.append("tool_execution_started", this.#state.snapshot().stepCount, { callId: call.callId });
      const observation = await this.#withDeadline((signal) => this.#registry.execute(call, { signal, runState: this.#state.snapshot() })); if (await this.#ignoreLate({ callId: call.callId })) return;
      this.#observations.push(observation); await this.#trace.append(observation.status === "error" ? "tool_call_rejected" : "tool_execution_finished", this.#state.snapshot().stepCount, { callId: call.callId, payload: { status: observation.status } }); this.#refreshTime(); if (await this.#stopForBudget(false)) return;
    }
  }
  async #complete(response: ModelResponse): Promise<void> {
    const raw = await this.#withDeadline(() => this.#options.completionPolicy.evaluate({ runState: this.#state.snapshot(), domainStateRef: this.#options.domainStateRef, latestResponse: response })); if (await this.#ignoreLate({ requestId: response.requestId })) return;
    const decision = validateCompletionDecision(raw); await this.#trace.append("completion_checked", this.#state.snapshot().stepCount, { payload: { allowed: decision.allowed, code: decision.code } });
    if (decision.allowed) return void await this.#stop("completion_policy_satisfied", decision.code, decision.reason); if (decision.observation) this.#observations.push(decision.observation);
    await this.#trace.append("completion_rejected", this.#state.snapshot().stepCount, { payload: { code: decision.code } }); if (this.#state.incrementNoProgress() >= 2) await this.#stop("no_progress", "completion_rejected_twice", decision.reason);
  }
  async #withDeadline<R>(operation: (signal: AbortSignal) => R | Promise<R>): Promise<R> {
    this.#refreshTime(); const limit = this.#state.snapshot().budget.limits.maxWallTimeMs;
    const remaining = limit === undefined ? undefined : limit - this.#state.snapshot().budget.observed.wallTimeMs; if (remaining !== undefined && remaining <= 0) throw new AgentRuntimeError("max_wall_time", "Maximum wall time reached");
    const controller = new AbortController(); const onAbort = () => controller.abort(this.#abort.signal.reason); this.#abort.signal.addEventListener("abort", onAbort, { once: true }); let timer: NodeJS.Timeout | undefined;
    const execution = Promise.resolve().then(() => operation(controller.signal)); execution.catch(() => undefined);
    const cancelled = new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => { const error = new Error("The operation was aborted"); error.name = "AbortError"; reject(error); }, { once: true }));
    const timedOut = remaining === undefined ? new Promise<never>(() => undefined) : new Promise<never>((_, reject) => { timer = setTimeout(() => { reject(new AgentRuntimeError("max_wall_time", "Maximum wall time reached")); controller.abort("max_wall_time"); }, remaining); });
    try { return await Promise.race([execution, cancelled, timedOut]); }
    finally { if (timer) clearTimeout(timer); this.#abort.signal.removeEventListener("abort", onAbort); }
  }
  async #stopIfCancelled(): Promise<boolean> { if (!this.#abort.signal.aborted) return false; await this.#stop("cancelled", "cancelled", "Run cancelled"); return true; }
  async #ignoreLate(ids: { requestId?: string; callId?: string }): Promise<boolean> { if (this.#state.snapshot().status === "stopped") { await this.#safeTrace("late_result_ignored", ids); return true; } if (this.#abort.signal.aborted) return this.#stopIfCancelled(); return false; }
  #refreshTime(): void { this.#state.setWallTime(this.#nowMs() - this.#startedMs); }
  async #stopForBudget(beforeStep: boolean): Promise<boolean> { const failure = budgetFailure(this.#state.snapshot()); if (failure && (beforeStep || failure.code !== "max_steps")) { await this.#stop("budget_exhausted", failure.code, failure.message); return true; } return false; }
  #assertUsage(response: ModelResponse): void { const limits = this.#state.snapshot().budget.limits; if ((limits.maxInputTokens !== undefined && response.usage?.inputTokens == null) || (limits.maxOutputTokens !== undefined && response.usage?.outputTokens == null) || (limits.maxTotalTokens !== undefined && response.usage?.totalTokens == null)) throw new AgentRuntimeError("usage_unavailable_for_enforced_budget", "Provider did not return usage required by an enforced token budget"); }
  async #safeTrace(type: Parameters<TraceRecorder["append"]>[0], data: Parameters<TraceRecorder["append"]>[2]): Promise<void> { try { await this.#trace.append(type, this.#state.snapshot().stepCount, data); } catch { /* Preserve original failure. */ } }
  async #stop(reason: Parameters<StateController<T>["stop"]>[0], code: string, message: string, cancelled = false): Promise<void> {
    if (this.#state.snapshot().status === "stopped") return; if (this.#stopPromise) return this.#stopPromise; this.#terminalCommitted = true;
    this.#stopPromise = (async () => { try { if (cancelled) await this.#trace.append("cancel_requested", this.#state.snapshot().stepCount); await this.#trace.append("run_stopped", this.#state.snapshot().stepCount, { payload: { reason, code } }); this.#state.stop(reason, code, message); }
      catch (error) { this.#state.stop("runtime_error", "trace_sink_failed", errorMessage(error)); await this.#trace.appendLocal("run_stopped", this.#state.snapshot().stepCount, { payload: { reason: "runtime_error", code: "trace_sink_failed" } }); } })(); return this.#stopPromise;
  }
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : "Unexpected runtime error"; }
