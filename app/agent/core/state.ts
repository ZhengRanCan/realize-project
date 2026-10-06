import { AgentRuntimeError } from "./errors";
import type { BudgetLimits, RunState, TerminationReason, Usage } from "./protocol";

export class StateController<TDomainRef> {
  readonly #now: () => string;
  #state: RunState<TDomainRef>;
  #usageKnown = { inputTokens: true, outputTokens: true, totalTokens: true };

  constructor(runId: string, domainStateRef: TDomainRef, limits: BudgetLimits, now: () => string = () => new Date().toISOString()) {
    this.#now = now;
    this.#state = { runId, status: "created", stepCount: 0, toolCallCount: 0, consecutiveNoProgress: 0,
      budget: { limits: { ...limits }, observed: { steps: 0, toolCalls: 0, wallTimeMs: 0, inputTokens: null, outputTokens: null, totalTokens: null } },
      termination: null, domainStateRef, startedAt: null, stoppedAt: null };
  }

  snapshot(): Readonly<RunState<TDomainRef>> {
    return {
      ...this.#state,
      budget: { limits: { ...this.#state.budget.limits }, observed: { ...this.#state.budget.observed } },
      termination: this.#state.termination ? { ...this.#state.termination } : null,
      domainStateRef: this.#state.domainStateRef
    };
  }
  start(): void {
    if (this.#state.status !== "created") throw new AgentRuntimeError("invalid_transition", "Run can only start once");
    this.#state.status = "running"; this.#state.startedAt = this.#now();
  }
  setWallTime(ms: number): void { this.#state.budget.observed.wallTimeMs = Math.max(0, ms); }
  beginStep(): void { this.assertRunning(); this.#state.stepCount += 1; this.#state.budget.observed.steps = this.#state.stepCount; }
  beginTool(): void { this.assertRunning(); this.#state.toolCallCount += 1; this.#state.budget.observed.toolCalls = this.#state.toolCallCount; }
  resetNoProgress(): void { this.#state.consecutiveNoProgress = 0; }
  incrementNoProgress(): number { this.#state.consecutiveNoProgress += 1; return this.#state.consecutiveNoProgress; }
  addUsage(usage: Usage | null): void {
    if (!usage) { this.#usageKnown = { inputTokens: false, outputTokens: false, totalTokens: false }; return; }
    const observed = this.#state.budget.observed;
    for (const key of ["inputTokens", "outputTokens", "totalTokens"] as const) {
      if (usage[key] === null) this.#usageKnown[key] = false;
      observed[key] = this.#usageKnown[key] ? addKnown(observed[key], usage[key]) : null;
    }
  }
  stop(reason: TerminationReason, code: string, message: string): boolean {
    if (this.#state.status === "stopped") return false;
    const at = this.#now(); this.#state.status = "stopped"; this.#state.stoppedAt = at; this.#state.termination = { reason, code, message, at }; return true;
  }
  assertRunning(): void { if (this.#state.status !== "running") throw new AgentRuntimeError("run_not_running", "Run is not running"); }
}

const addKnown = (current: number | null, next: number | null): number | null => next === null ? current : (current ?? 0) + next;

export function budgetFailure(state: Readonly<RunState>): { code: string; message: string } | null {
  const { limits, observed } = state.budget;
  if (limits.maxSteps !== undefined && observed.steps >= limits.maxSteps) return { code: "max_steps", message: "Maximum steps reached" };
  if (limits.maxToolCalls !== undefined && observed.toolCalls >= limits.maxToolCalls) return { code: "max_tool_calls", message: "Maximum tool calls reached" };
  if (limits.maxWallTimeMs !== undefined && observed.wallTimeMs >= limits.maxWallTimeMs) return { code: "max_wall_time", message: "Maximum wall time reached" };
  for (const [limitKey, observedKey] of [["maxInputTokens", "inputTokens"], ["maxOutputTokens", "outputTokens"], ["maxTotalTokens", "totalTokens"]] as const) {
    const limit = limits[limitKey]; const value = observed[observedKey];
    if (limit !== undefined && value !== null && value >= limit) return { code: limitKey, message: `${limitKey} reached` };
  }
  return null;
}
