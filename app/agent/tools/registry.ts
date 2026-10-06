import { AgentRuntimeError, isAbortError } from "../core/errors";
import type { JsonSchema, RunState, ToolCall, ToolObservation, ToolSchema } from "../core/protocol";
import { assertToolArgumentsCapacity, validateJsonSchema, validateSchemaDefinition } from "../core/validation";

export interface ToolExecutionContext { signal: AbortSignal; runState: Readonly<RunState> }
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  authorize?: (argumentsValue: unknown, context: ToolExecutionContext) => boolean | Promise<boolean>;
  timeoutMs?: number;
  execute: (argumentsValue: unknown, context: ToolExecutionContext) => unknown | Promise<unknown>;
}

export class ToolRegistry {
  readonly #tools = new Map<string, ToolDefinition>();
  readonly #seenCallIds = new Map<string, Set<string>>();

  constructor(definitions: readonly ToolDefinition[] = []) { definitions.forEach((definition) => this.register(definition)); }
  register(definition: ToolDefinition): void {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(definition.name)) throw new AgentRuntimeError("invalid_tool_definition", "Tool name is invalid");
    if (this.#tools.has(definition.name)) throw new AgentRuntimeError("duplicate_tool", `Tool ${definition.name} is already registered`);
    validateSchemaDefinition(definition.inputSchema);
    if (definition.timeoutMs !== undefined && (!Number.isInteger(definition.timeoutMs) || definition.timeoutMs <= 0)) throw new AgentRuntimeError("invalid_tool_definition", "timeoutMs must be a positive integer");
    this.#tools.set(definition.name, { ...definition, inputSchema: structuredClone(definition.inputSchema) });
  }
  schemas(): readonly ToolSchema[] { return [...this.#tools.values()].map(({ name, description, inputSchema }) => ({ name, description, inputSchema: structuredClone(inputSchema) })); }
  async execute(call: ToolCall, context: ToolExecutionContext): Promise<ToolObservation> {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(call.callId)) throw new AgentRuntimeError("invalid_call_id", "Tool callId is invalid");
    const seen = this.#seenCallIds.get(context.runState.runId) ?? new Set<string>();
    if (seen.has(call.callId)) throw new AgentRuntimeError("duplicate_call_id", `Duplicate callId ${call.callId}`);
    seen.add(call.callId); this.#seenCallIds.set(context.runState.runId, seen);
    const tool = this.#tools.get(call.name);
    if (!tool) return failure(call, "unknown_tool", `Unknown tool: ${call.name}`);
    if (tool.authorize && !(await tool.authorize(call.arguments, context))) return failure(call, "permission_denied", `Tool ${call.name} is not permitted`);
    assertToolArgumentsCapacity(call.arguments);
    const errors = validateJsonSchema(call.arguments, tool.inputSchema);
    if (errors.length) return { kind: "tool", callId: call.callId, toolName: call.name, status: "error", error: { code: "invalid_arguments", message: "Tool arguments are invalid", details: errors } };
    if (context.signal.aborted) throw abortError();
    try {
      const output = await executeWithTimeout(tool, call.arguments, context);
      if (context.signal.aborted) throw abortError();
      return { kind: "tool", callId: call.callId, toolName: call.name, status: "success", output };
    } catch (error) {
      if (error instanceof ToolTimeoutError) return failure(call, "tool_timeout", error.message);
      if (isAbortError(error) || context.signal.aborted) throw error;
      return failure(call, "tool_execution_failed", error instanceof Error ? error.message : "Tool execution failed");
    }
  }
}

async function executeWithTimeout(tool: ToolDefinition, argumentsValue: unknown, context: ToolExecutionContext): Promise<unknown> {
  if (tool.timeoutMs === undefined) return tool.execute(argumentsValue, context);
  const controller = new AbortController();
  const abort = () => controller.abort(context.signal.reason);
  context.signal.addEventListener("abort", abort, { once: true });
  let timer: NodeJS.Timeout | undefined;
  const execution = Promise.resolve().then(() => tool.execute(argumentsValue, { ...context, signal: controller.signal })).catch((error) => {
    if (controller.signal.reason === "tool_timeout" && isAbortError(error)) throw new ToolTimeoutError();
    throw error;
  });
  execution.catch(() => undefined);
  try {
    return await Promise.race([execution, new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort("tool_timeout"); reject(new ToolTimeoutError()); }, tool.timeoutMs);
    })]);
  } finally {
    if (timer) clearTimeout(timer);
    context.signal.removeEventListener("abort", abort);
  }
}

class ToolTimeoutError extends Error { constructor() { super("Tool execution timed out"); this.name = "ToolTimeoutError"; } }

function failure(call: ToolCall, code: "unknown_tool" | "permission_denied" | "tool_execution_failed" | "tool_timeout", message: string): ToolObservation {
  return { kind: "tool", callId: call.callId, toolName: call.name, status: "error", error: { code, message } };
}
function abortError(): Error { const error = new Error("The operation was aborted"); error.name = "AbortError"; return error; }
