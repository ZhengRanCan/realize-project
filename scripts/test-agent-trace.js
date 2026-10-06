"use strict";
const assert = require("node:assert/strict");
const { TraceRecorder } = require("../dist/agent");

(async () => {
  let n = 0;
  const recorder = new TraceRecorder({ runId: "r", now: () => "2026-10-06T00:00:00.000Z", id: () => `e${++n}` });
  await recorder.append("run_started", 0); await recorder.append("run_stopped", 1, { payload: { reason: "test" } });
  assert.deepEqual(recorder.snapshot().map((event) => [event.eventId, event.sequence, event.type]), [["e1", 1, "run_started"], ["e2", 2, "run_stopped"]]);
  const broken = new TraceRecorder({ runId: "r", sink() { throw new Error("disk"); } });
  await assert.rejects(() => broken.append("run_started", 0), /Trace sink failed/);
  assert.equal(broken.snapshot().length, 0);
  const payload = { nested: { value: 1 } }; await recorder.append("completion_checked", 2, { payload }); payload.nested.value = 2;
  const snapshot = recorder.snapshot(); assert.equal(snapshot.at(-1).payload.nested.value, 1); assert.equal(Object.isFrozen(snapshot.at(-1).payload.nested), true);
  const resolvers = []; const serial = new TraceRecorder({ runId: "serial", sink: () => new Promise((resolve) => resolvers.push(resolve)) });
  const first = serial.append("run_started", 0); const second = serial.append("cancel_requested", 0); await new Promise((resolve) => setImmediate(resolve)); resolvers.shift()(); await first; await new Promise((resolve) => setImmediate(resolve)); resolvers.shift()(); await second;
  assert.deepEqual(serial.snapshot().map((event) => event.sequence), [1, 2]);
  console.log("agent trace: passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
