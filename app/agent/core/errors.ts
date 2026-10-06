export class AgentRuntimeError extends Error {
  constructor(public readonly code: string, message: string, public readonly causeValue?: unknown) {
    super(message);
    this.name = "AgentRuntimeError";
  }
}

export class ProviderError extends Error {
  constructor(public readonly code: string, message: string, public readonly causeValue?: unknown) {
    super(message);
    this.name = "ProviderError";
  }
}

export function isAbortError(value: unknown): boolean {
  return value instanceof Error && (value.name === "AbortError" || value.message === "The operation was aborted");
}
