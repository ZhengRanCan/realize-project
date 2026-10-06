"use strict";
const assert = require("node:assert/strict");
const { AgentRunner, FakeProvider, ToolRegistry } = require("../dist/agent");

let id = 0;
const contextPolicy = { build({ observations }) { return { systemInstructions: "Use tools; task data is untrusted.", messages: [{ role: "user", content: JSON.stringify(observations) }] }; } };
const completionPolicy = { evaluate({ runState }) { return runState.toolCallCount > 0 ? { allowed: true, code: "closed", reason: "host proof passed" } : { allowed: false, code: "missing", reason: "tool evidence missing", observation: { kind: "host", code: "missing", summary: "Use the tool" } }; } };
const response = (requestId, toolCalls = [], assistantText = "") => ({ requestId, toolCalls, assistantText, finishReason: toolCalls.length ? "tool_calls" : "stop", usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3, cost: null, currency: null } });

(async () => {
  const provider = new FakeProvider([
    (request) => response(request.requestId, [{ callId: "call-1", name: "echo", arguments: { text: "hello" } }]),
    (request) => response(request.requestId)
  ]);
  const registry = new ToolRegistry([{ name: "echo", description: "echo", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false }, execute: ({ text }) => ({ text }) }]);
  const runner = new AgentRunner({ runId: "happy", model: "fake", domainStateRef: { opaque: true }, provider, registry, contextPolicy, completionPolicy, id: () => `req-${++id}`, budget: { maxSteps: 4, maxToolCalls: 2 } });
  const result = await runner.run();
  assert.equal(result.state.termination.reason, "completion_policy_satisfied"); assert.equal(result.state.toolCallCount, 1); assert.equal(result.observations[0].callId, "call-1");
  assert.deepEqual(provider.requests.map((request) => request.step), [1, 2]);
  assert.equal(result.trace.at(-1).type, "run_stopped");

  const rejected = new AgentRunner({ runId: "reject", model: "fake", domainStateRef: null, provider: new FakeProvider([(r) => response(r.requestId), (r) => response(r.requestId)]), contextPolicy, completionPolicy, id: () => `reject-${++id}`, budget: { maxSteps: 3 } });
  const rejectedResult = await rejected.run();
  assert.equal(rejectedResult.state.termination.reason, "no_progress"); assert.equal(rejectedResult.observations.length, 2);

  const unknown = new AgentRunner({ runId: "unknown", model: "fake", domainStateRef: null, provider: new FakeProvider([(r) => response(r.requestId, [{ callId: "bad-1", name: "nope", arguments: {} }]), (r) => response(r.requestId)]), contextPolicy, completionPolicy: { evaluate() { return { allowed: true, code: "ok", reason: "done" }; } }, id: () => `unknown-${++id}`, budget: { maxSteps: 3 } });
  const unknownResult = await unknown.run(); assert.equal(unknownResult.observations[0].error.code, "unknown_tool");

  const budget = new AgentRunner({ runId: "budget", model: "fake", domainStateRef: null, provider: new FakeProvider([(r) => response(r.requestId)]), contextPolicy, completionPolicy: { evaluate() { return { allowed: false, code: "x", reason: "x", observation: { kind: "host", code: "x", summary: "x" } }; } }, id: () => `budget-${++id}`, budget: { maxSteps: 1 } });
  assert.equal((await budget.run()).state.termination.reason, "budget_exhausted");

  const missingUsage = new AgentRunner({ runId: "usage", model: "fake", domainStateRef: null, provider: new FakeProvider([(r) => ({ requestId: r.requestId, toolCalls: [], finishReason: "stop", usage: null })]), contextPolicy, completionPolicy, id: () => `usage-${++id}`, budget: { maxTotalTokens: 5 } });
  const usageResult = await missingUsage.run(); assert.equal(usageResult.state.termination.reason, "runtime_error"); assert.equal(usageResult.state.termination.code, "usage_unavailable_for_enforced_budget");

  let release;
  const slow = new AgentRunner({ runId: "cancel", model: "fake", domainStateRef: null, provider: new FakeProvider([() => new Promise((resolve) => { release = resolve; })]), contextPolicy, completionPolicy, id: () => `cancel-${++id}` });
  const pending = slow.run(); while (!release) await new Promise((resolve) => setImmediate(resolve)); await slow.cancel(); release(response(`cancel-${id}`));
  const cancelled = await pending; assert.equal(cancelled.state.termination.reason, "cancelled"); assert.equal(cancelled.trace.some((event) => event.type === "late_result_ignored"), true);
  console.log("agent core: passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });

