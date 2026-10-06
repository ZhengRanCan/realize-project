"use strict";
const assert = require("node:assert/strict");
const { validateModelContext, validateModelResponse, validateCompletionDecision } = require("../dist/agent");

assert.throws(() => validateModelContext({ systemInstructions: "x", messages: [{ role: "system", content: "bad" }] }), /system messages/);
assert.throws(() => validateModelContext({ systemInstructions: "x", messages: [], metadata: { secret: {} } }), /metadata/);
assert.throws(() => validateModelResponse({ requestId: "wrong", toolCalls: [], finishReason: "stop", usage: null }, "right"), /requestId mismatch/);
assert.throws(() => validateCompletionDecision({ allowed: true, code: "", reason: "x" }), /non-empty/);
assert.deepEqual(validateModelContext({ systemInstructions: "trusted", messages: [{ role: "user", content: "untrusted" }] }).messages[0], { role: "user", content: "untrusted" });
console.log("agent types: passed");

