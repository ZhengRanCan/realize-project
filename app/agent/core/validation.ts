import { AgentRuntimeError } from "./errors";
import type { CompletionDecision, HostObservation, JsonPrimitive, JsonSchema, ModelContext, ModelResponse, ToolCall, Usage } from "./protocol";

const object = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const string = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new AgentRuntimeError("invalid_protocol", `${field} must be a non-empty string`);
  return value;
};
const MAX_SYSTEM_CHARS = 65_536;
const MAX_MESSAGES = 256;
const MAX_MESSAGE_CHARS = 1_048_576;
const MAX_TOOL_CALLS = 128;
const MAX_SERIALIZED_CHARS = 1_048_576;
const nullableNumber = (value: unknown, field: string): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new AgentRuntimeError("invalid_protocol", `${field} must be a non-negative number or null`);
  return value;
};

export function validateModelContext(value: unknown): ModelContext {
  const item = object(value);
  if (!item) throw new AgentRuntimeError("invalid_context", "ContextPolicy must return an object");
  const systemInstructions = string(item.systemInstructions, "systemInstructions");
  if (systemInstructions.length > MAX_SYSTEM_CHARS) throw new AgentRuntimeError("context_capacity_exceeded", "systemInstructions is too large");
  if (!Array.isArray(item.messages)) throw new AgentRuntimeError("invalid_context", "messages must be an array");
  if (item.messages.length > MAX_MESSAGES) throw new AgentRuntimeError("context_capacity_exceeded", "messages exceeds capacity");
  const messages = item.messages.map((raw, index) => {
    const message = object(raw);
    if (!message || !["system", "user", "assistant", "tool"].includes(String(message.role)) || typeof message.content !== "string") {
      throw new AgentRuntimeError("invalid_context", `messages[${index}] is invalid`);
    }
    if (message.content.length > MAX_MESSAGE_CHARS) throw new AgentRuntimeError("context_capacity_exceeded", `messages[${index}] is too large`);
    if (message.role === "tool" && message.callId === undefined) throw new AgentRuntimeError("invalid_context", `messages[${index}].callId is required for tool messages`);
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
  if (item.toolCalls.length > MAX_TOOL_CALLS) throw new AgentRuntimeError("provider_capacity_exceeded", "toolCalls exceeds capacity");
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
    if (item.assistantText.length > MAX_MESSAGE_CHARS) throw new AgentRuntimeError("provider_capacity_exceeded", "assistantText is too large");
    result.assistantText = item.assistantText;
  }
  if (item.providerMeta !== undefined) {
    const meta = object(item.providerMeta);
    if (!meta) throw new AgentRuntimeError("invalid_provider_response", "providerMeta must be an object");
    if (JSON.stringify(meta).length > MAX_SERIALIZED_CHARS) throw new AgentRuntimeError("provider_capacity_exceeded", "providerMeta is too large");
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

export function validateSchemaDefinition(value: unknown, path = "$"): asserts value is JsonSchema {
  const schema = object(value);
  if (!schema) throw new AgentRuntimeError("invalid_schema", `${path} must be an object`);
  const allowed = new Set(["type", "properties", "required", "additionalProperties", "items", "enum", "const", "minLength", "maxLength", "minimum", "maximum"]);
  for (const key of Object.keys(schema)) if (!allowed.has(key)) throw new AgentRuntimeError("unsupported_schema", `${path}.${key} is unsupported`);
  if (schema.type !== undefined && (typeof schema.type !== "string" || !["object", "array", "string", "number", "integer", "boolean", "null"].includes(schema.type))) throw new AgentRuntimeError("invalid_schema", `${path}.type is invalid`);
  if (schema.required !== undefined && (!Array.isArray(schema.required) || schema.required.some((entry) => typeof entry !== "string"))) throw new AgentRuntimeError("invalid_schema", `${path}.required is invalid`);
  if (schema.additionalProperties !== undefined && typeof schema.additionalProperties !== "boolean") throw new AgentRuntimeError("invalid_schema", `${path}.additionalProperties is invalid`);
  if (schema.enum !== undefined && (!Array.isArray(schema.enum) || schema.enum.some((entry) => entry !== null && !["string", "number", "boolean"].includes(typeof entry)))) throw new AgentRuntimeError("invalid_schema", `${path}.enum is invalid`);
  if (schema.const !== undefined && schema.const !== null && !["string", "number", "boolean"].includes(typeof schema.const)) throw new AgentRuntimeError("invalid_schema", `${path}.const is invalid`);
  for (const key of ["minLength", "maxLength"] as const) if (schema[key] !== undefined && (typeof schema[key] !== "number" || !Number.isInteger(schema[key]) || schema[key] < 0)) throw new AgentRuntimeError("invalid_schema", `${path}.${key} is invalid`);
  for (const key of ["minimum", "maximum"] as const) if (schema[key] !== undefined && (typeof schema[key] !== "number" || !Number.isFinite(schema[key]))) throw new AgentRuntimeError("invalid_schema", `${path}.${key} is invalid`);
  if (schema.properties !== undefined) { const properties = object(schema.properties); if (!properties) throw new AgentRuntimeError("invalid_schema", `${path}.properties is invalid`); for (const [key, child] of Object.entries(properties)) validateSchemaDefinition(child, `${path}.properties.${key}`); }
  if (schema.items !== undefined) validateSchemaDefinition(schema.items, `${path}.items`);
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

export function assertToolArgumentsCapacity(value: unknown): void {
  let serialized: string | undefined;
  try { serialized = JSON.stringify(value); } catch { throw new AgentRuntimeError("invalid_arguments", "Tool arguments are not serializable"); }
  if (serialized === undefined) throw new AgentRuntimeError("invalid_arguments", "Tool arguments are not JSON serializable");
  if (serialized.length > MAX_SERIALIZED_CHARS) throw new AgentRuntimeError("tool_capacity_exceeded", "Tool arguments exceed capacity");
}
