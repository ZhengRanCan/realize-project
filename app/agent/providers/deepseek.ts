import { ProviderError, isAbortError } from "../core/errors";
import type { ModelRequest, ModelResponse, ProviderAdapter, ToolCall, Usage } from "../core/protocol";

export interface DeepSeekTransport { send(payload: unknown, signal: AbortSignal): Promise<unknown> }
export class DeepSeekAdapter implements ProviderAdapter {
  constructor(private readonly transport: DeepSeekTransport) {}
  async request(request: ModelRequest): Promise<unknown> {
    const payload = {
      model: request.model,
      messages: [{ role: "system", content: request.context.systemInstructions }, ...request.context.messages],
      tools: request.tools.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } })),
      tool_choice: "auto",
      ...(request.limits.maxOutputTokens === undefined ? {} : { max_tokens: request.limits.maxOutputTokens }),
      ...pickProviderOptions(request.providerOptions)
    };
    let raw: unknown;
    try { raw = await this.transport.send(payload, request.signal); }
    catch (error) { if (isAbortError(error)) throw error; throw new ProviderError("deepseek_request_failed", "DeepSeek request failed", error); }
    return parseWire(raw, request.requestId);
  }
}

function parseWire(raw: unknown, requestId: string): ModelResponse {
  const root = record(raw); const choices = root?.choices;
  if (!root || !Array.isArray(choices) || choices.length === 0) throw new ProviderError("invalid_deepseek_response", "DeepSeek response has no choice");
  const choice = record(choices[0]); const message = record(choice?.message);
  if (!choice || !message) throw new ProviderError("invalid_deepseek_response", "DeepSeek choice is invalid");
  const toolCalls: ToolCall[] = [];
  if (message.tool_calls !== undefined) {
    if (!Array.isArray(message.tool_calls)) throw new ProviderError("invalid_deepseek_response", "tool_calls must be an array");
    for (const rawCall of message.tool_calls) {
      const call = record(rawCall); const fn = record(call?.function);
      if (!call || !fn || typeof call.id !== "string" || typeof fn.name !== "string") throw new ProviderError("invalid_deepseek_response", "tool call is invalid");
      let argumentsValue: unknown = fn.arguments;
      if (typeof argumentsValue === "string") { try { argumentsValue = JSON.parse(argumentsValue); } catch { /* Registry will reject the string. */ } }
      toolCalls.push({ callId: call.id, name: fn.name, arguments: argumentsValue });
    }
  }
  const finish = choice.finish_reason;
  const finishReason = finish === "stop" || finish === "tool_calls" || finish === "length" || finish === "content_filter" ? finish : "unknown";
  const usageRaw = record(root.usage);
  const usage: Usage | null = usageRaw ? {
    inputTokens: numberOrNull(usageRaw.prompt_tokens), outputTokens: numberOrNull(usageRaw.completion_tokens), totalTokens: numberOrNull(usageRaw.total_tokens), cost: null, currency: null
  } : null;
  const response: ModelResponse = { requestId, toolCalls, finishReason, usage };
  if (typeof root.id === "string") response.providerResponseId = root.id;
  if (typeof message.content === "string") response.assistantText = message.content;
  response.providerMeta = { model: typeof root.model === "string" ? root.model : "unknown" };
  return response;
}
const record = (value: unknown): Record<string, unknown> | null => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const numberOrNull = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
function pickProviderOptions(options: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> {
  if (!options) return {};
  const allowed = new Set(["temperature", "top_p", "frequency_penalty", "presence_penalty", "response_format", "stop"]);
  return Object.fromEntries(Object.entries(options).filter(([key]) => allowed.has(key)));
}

