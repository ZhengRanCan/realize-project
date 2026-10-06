"use strict";
const assert = require("node:assert/strict");
const { ToolRegistry } = require("../dist/agent");

const state = { runId: "r", status: "running", stepCount: 1, toolCallCount: 0, consecutiveNoProgress: 0, budget: { limits: {}, observed: { steps: 1, toolCalls: 0, wallTimeMs: 0, inputTokens: null, outputTokens: null, totalTokens: null } }, termination: null, domainStateRef: null, startedAt: "x", stoppedAt: null };
const registry = new ToolRegistry([{ name: "echo", description: "Echo text", inputSchema: { type: "object", properties: { text: { type: "string", minLength: 1 } }, required: ["text"], additionalProperties: false }, execute: (args) => ({ echoed: args.text }) }]);
(async () => {
  const signal = new AbortController().signal;
  assert.equal((await registry.execute({ callId: "c1", name: "missing", arguments: {} }, { signal, runState: state })).error.code, "unknown_tool");
  assert.equal((await registry.execute({ callId: "c2", name: "echo", arguments: { text: "", extra: true } }, { signal, runState: state })).error.code, "invalid_arguments");
  assert.deepEqual(await registry.execute({ callId: "c3", name: "echo", arguments: { text: "ok" } }, { signal, runState: state }), { kind: "tool", callId: "c3", toolName: "echo", status: "success", output: { echoed: "ok" } });
  await assert.rejects(() => registry.execute({ callId: "c3", name: "echo", arguments: { text: "again" } }, { signal, runState: state }), /Duplicate callId/);
  assert.throws(() => new ToolRegistry([{ name: "x", description: "x", inputSchema: { type: "object", patternProperties: {} }, execute() {} }]), /unsupported/);
  console.log("agent registry: passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });

