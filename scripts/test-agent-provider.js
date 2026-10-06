"use strict";
const assert = require("node:assert/strict");
const { DeepSeekAdapter, ProviderError } = require("../dist/agent");

const base = { requestId: "q1", runId: "r1", step: 1, model: "deepseek-test", context: { systemInstructions: "trusted", messages: [{ role: "user", content: "data" }] }, tools: [{ name: "echo", description: "echo", inputSchema: { type: "object" } }], signal: new AbortController().signal, limits: { maxOutputTokens: 99 } };
(async () => {
  let sent;
  const adapter = new DeepSeekAdapter({ async send(payload) { sent = payload; return { id: "p1", model: "deepseek-test", choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ id: "c1", function: { name: "echo", arguments: "{\"text\":\"ok\"}" } }] } }], usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } }; } });
  const result = await adapter.request(base);
  assert.equal(sent.messages[0].role, "system"); assert.equal(sent.max_tokens, 99);
  assert.deepEqual(result.toolCalls[0].arguments, { text: "ok" }); assert.equal(result.usage.totalTokens, 8);
  const malformed = new DeepSeekAdapter({ async send() { return { choices: [{ finish_reason: "tool_calls", message: { tool_calls: [{ id: "c2", function: { name: "echo", arguments: "not-json" } }] } }] }; } });
  assert.equal((await malformed.request(base)).toolCalls[0].arguments, "not-json");
  await assert.rejects(() => new DeepSeekAdapter({ async send() { throw new Error("offline"); } }).request(base), ProviderError);
  await adapter.request({ ...base, context: { ...base.context, messages: [{ role: "tool", content: "done", callId: "wire-1" }] } });
  assert.equal(sent.messages[1].tool_call_id, "wire-1"); assert.equal("callId" in sent.messages[1], false);
  console.log("agent provider: passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
