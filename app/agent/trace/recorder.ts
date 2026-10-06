import { AgentRuntimeError } from "../core/errors";
import type { TraceEvent, TraceEventType } from "../core/protocol";

export type TraceSink = (event: Readonly<TraceEvent>) => void | Promise<void>;
export interface TraceRecorderOptions { runId: string; now?: () => string; id?: () => string; sink?: TraceSink }

export class TraceRecorder {
  readonly #events: TraceEvent[] = [];
  readonly #runId: string;
  readonly #now: () => string;
  readonly #id: () => string;
  readonly #sink: TraceSink | undefined;
  #tail: Promise<void> = Promise.resolve();

  constructor(options: TraceRecorderOptions) {
    this.#runId = options.runId;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#id = options.id ?? (() => crypto.randomUUID());
    this.#sink = options.sink;
  }

  async append(type: TraceEventType, step: number, fields: { requestId?: string; callId?: string; payload?: Readonly<Record<string, unknown>> } = {}): Promise<void> {
    return this.#enqueue(type, step, fields, true);
  }
  async appendLocal(type: TraceEventType, step: number, fields: { requestId?: string; callId?: string; payload?: Readonly<Record<string, unknown>> } = {}): Promise<void> {
    return this.#enqueue(type, step, fields, false);
  }
  async #enqueue(type: TraceEventType, step: number, fields: { requestId?: string; callId?: string; payload?: Readonly<Record<string, unknown>> }, useSink: boolean): Promise<void> {
    const task = this.#tail.then(async () => {
      const event: TraceEvent = { eventId: this.#id(), runId: this.#runId, sequence: this.#events.length + 1, type, timestamp: this.#now(), step };
      if (fields.requestId !== undefined) event.requestId = fields.requestId;
      if (fields.callId !== undefined) event.callId = fields.callId;
      if (fields.payload !== undefined) event.payload = deepFreeze(structuredClone(fields.payload));
      try { if (useSink && this.#sink) await this.#sink(Object.freeze({ ...event })); }
      catch (error) { throw new AgentRuntimeError("trace_sink_failed", "Trace sink failed", error); }
      this.#events.push(deepFreeze(event));
    });
    this.#tail = task.catch(() => undefined); return task;
  }

  snapshot(): readonly TraceEvent[] { return this.#events.map((event) => deepFreeze(structuredClone(event))); }
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
