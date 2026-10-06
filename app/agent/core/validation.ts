import { AgentRuntimeError } from "./errors";
import type { CompletionDecision, HostObservation, JsonPrimitive, JsonSchema, ModelContext, ModelResponse, ToolCall, Usage } from "./protocol";

const object = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const string = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new AgentRuntimeError("invalid_protocol", `${field} must be a non-empty string`);
  return value;
};
const nullableNumber = (value: unknown, field: string): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new AgentRuntimeError("invalid_protocol", `${field} must be a non-negative number or null`);
  return value;
};

export function validateModelContext(value: unknown): ModelContext {
  const item = object(value);
  if (!item) throw new AgentRuntimeError("invalid_context", "ContextPolicy must return an object");
  const systemInstructions = string(item.systemInstructions, "systemInstructions");
  if (!Array.isArray(item.messages)) throw new AgentRuntimeError("invalid_context", "messages must be an array");
  const messages = item.messages.map((raw, index) => {
    const message = object(raw);
    if (!message || !["system", "user", "assistant", "tool"].includes(String(message.role)) || typeof message.content !== "string") {
      throw new AgentRuntimeError("invalid_context", `messages[${index}] is invalid`);
    }
    return message.callId === undefined
      ? { role: message.role as "system" | "user" | "assistant" | "tool", content: message.content }
      : { role: message.role as "system" | "user" | "assistant" | "tool", content: message.content, callId: string(message.callId, `messages[${index}].callId`) };
  });
  if (messages.some((message) => message.role === "system")) throw new AgentRuntimeError("invalid_context", "system messages must use systemInstructions, not task messages");
  const metadata = item.metadata;
  if (metadata !== undefined) {
    const meta = object(metadata);
    if (!meta || Object.values(meta).some((entry) => !["string", "number", "boolean"].includes(typeof entry))) {
      throw new AgentRuntimeError("invalid_context", "metadata contains a non-public value");
    }
    return { systemInstructions, messages, metadata: meta as Record<string, string | number | boolean> };
  }
  return { systemInstructions, messages };
}

export function validateToolCall(value: unknown): ToolCall {
  const item = object(value);
  if (!item) throw new AgentRuntimeError("invalid_provider_response", "tool call must be an object");
  return { callId: string(item.callId, "toolCall.callId"), name: string(item.name, "toolCall.name"), arguments: item.arguments };
}

function validateUsage(value: unknown): Usage | null {
  if (value === null || value === undefined) return null;
  const item = object(value);
  if (!item) throw new AgentRuntimeError("invalid_provider_response", "usage must be an object or null");
  return {
    inputTokens: nullableNumber(item.inputTokens, "usage.inputTokens"),
    outputTokens: nullableNumber(item.outputTokens, "usage.outputTokens"),
    totalTokens: nullableNumber(item.totalTokens, "usage.totalTokens"),
    cost: nullableNumber(item.cost, "usage.cost"),
    currency: item.currency === null || item.currency === undefined ? null : string(item.currency, "usage.currency")
  };
}

export function validateModelResponse(value: unknown, requestId: string): ModelResponse {
  const item = object(value);
  if (!item) throw new AgentRuntimeError("invalid_provider_response", "provider response must be an object");
  if (item.requestId !== requestId) throw new AgentRuntimeError("invalid_provider_response", "provider response requestId mismatch");
  if (!Array.isArray(item.toolCalls)) throw new AgentRuntimeError("invalid_provider_response", "toolCalls must be an array");
  const finishReason = String(item.finishReason);
  if (!["stop", "tool_calls", "length", "content_filter", "unknown"].includes(finishReason)) {
    throw new AgentRuntimeError("invalid_provider_response", "invalid finishReason");
  }
  const result: ModelResponse = {
    requestId,
    toolCalls: item.toolCalls.map(validateToolCall),
    finishReason: finishReason as ModelResponse["finishReason"],
    usage: validateUsage(item.usage)
  };
  if (item.providerResponseId !== undefined) result.providerResponseId = string(item.providerResponseId, "providerResponseId");
  if (item.assistantText !== undefined) {
    if (typeof item.assistantText !== "string") throw new AgentRuntimeError("invalid_provider_response", "assistantText must be a string");
    result.assistantText = item.assistantText;
  }
  if (item.providerMeta !== undefined) {
    const meta = object(item.providerMeta);
    if (!meta) throw new AgentRuntimeError("invalid_provider_response", "providerMeta must be an object");
    result.providerMeta = meta;
  }
  return result;
}

export function validateHostObservation(value: unknown): HostObservation {
  const item = object(value);
  if (!item || item.kind !== "host") throw new AgentRuntimeError("invalid_completion_decision", "host observation is invalid");
  const result: HostObservation = { kind: "host", code: string(item.code, "observation.code"), summary: string(item.summary, "observation.summary") };
  if (item.details !== undefined) {
    if (!Array.isArray(item.details) || item.details.some((entry) => typeof entry !== "string")) throw new AgentRuntimeError("invalid_completion_decision", "observation.details must be strings");
    result.details = item.details as string[];
  }
  if (item.nextActionHint !== undefined) result.nextActionHint = string(item.nextActionHint, "observation.nextActionHint");
  return result;
}

export function validateCompletionDecision(value: unknown): CompletionDecision {
  const item = object(value);
  if (!item || typeof item.allowed !== "boolean") throw new AgentRuntimeError("invalid_completion_decision", "CompletionPolicy returned an invalid decision");
  const result: CompletionDecision = { allowed: item.allowed, code: string(item.code, "decision.code"), reason: string(item.reason, "decision.reason") };
  if (item.observation !== undefined) result.observation = validateHostObservation(item.observation);
  if (item.proofRef !== undefined) result.proofRef = item.proofRef;
  return result;
}

export function validateSchemaDefinition(schema: JsonSchema, path = "$"): void {
  const allowed = new Set(["type", "properties", "required", "additionalProperties", "items", "enum", "const", "minLength", "maxLength", "minimum", "maximum"]);
  for (const key of Object.keys(schema)) if (!allowed.has(key)) throw new AgentRuntimeError("unsupported_schema", `${path}.${key} is unsupported`);
  if (schema.properties) for (const [key, child] of Object.entries(schema.properties)) validateSchemaDefinition(child, `${path}.properties.${key}`);
  if (schema.items) validateSchemaDefinition(schema.items, `${path}.items`);
}

export function validateJsonSchema(value: unknown, schema: JsonSchema, path = "$"): string[] {
  const errors: string[] = [];
  const type = schema.type;
  const actual = value === null ? "null" : Array.isArray(value) ? "array" : Number.isInteger(value) ? "integer" : typeof value;
  if (type && !(type === "number" && (actual === "number" || actual === "integer")) && actual !== type) errors.push(`${path} must be ${type}`);
  if (schema.enum && !schema.enum.some((entry) => Object.is(entry, value as JsonPrimitive))) errors.push(`${path} is not in enum`);
  if (schema.const !== undefined && !Object.is(schema.const, value)) errors.push(`${path} must equal const`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} is shorter than minLength`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path} is longer than maxLength`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} is below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} is above maximum`);
  }
  if (Array.isArray(value) && schema.items) value.forEach((entry, index) => errors.push(...validateJsonSchema(entry, schema.items!, `${path}[${index}]`)));
  const item = object(value);
  if (item && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!(key in item)) errors.push(`${path}.${key} is required`);
    for (const [key, entry] of Object.entries(item)) {
      const child = schema.properties?.[key];
      if (child) errors.push(...validateJsonSchema(entry, child, `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}.${key} is not allowed`);
    }
  }
  return errors;
}
