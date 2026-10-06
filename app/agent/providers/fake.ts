import { ProviderError } from "../core/errors";
import type { ModelRequest, ProviderAdapter } from "../core/protocol";

export type FakeResponse = unknown | ((request: ModelRequest) => unknown | Promise<unknown>);
export class FakeProvider implements ProviderAdapter {
  readonly requests: ModelRequest[] = [];
  #responses: FakeResponse[];
  constructor(responses: readonly FakeResponse[]) { this.#responses = [...responses]; }
  async request(request: ModelRequest): Promise<unknown> {
    this.requests.push(request);
    if (request.signal.aborted) throw abortError();
    const response = this.#responses.shift();
    if (response === undefined) throw new ProviderError("fake_exhausted", "Fake provider has no response");
    return typeof response === "function" ? response(request) : response;
  }
}
function abortError(): Error { const error = new Error("The operation was aborted"); error.name = "AbortError"; return error; }
