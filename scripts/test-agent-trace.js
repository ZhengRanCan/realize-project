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
  console.log("agent trace: passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
