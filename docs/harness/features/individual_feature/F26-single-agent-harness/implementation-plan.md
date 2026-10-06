# F26 Implementation Plan

Date: 2026-10-06. Requires approval of this plan and `detailed-design.md` before runtime code starts.

## Slice 1 — Build boundary and protocol

- Add pinned TypeScript and Node type development dependencies, `tsconfig.agent.json`, `typecheck:agent`, `build:agent` and clean-build-aware test scripts.
- Define canonical protocols, errors and runtime validators; add compile-time negative cases plus runtime unknown-input tests.
- Verify a clean checkout with no `dist/agent` can build, then a CommonJS JS smoke test requires only `dist/agent/index.js`.

## Slice 2 — State, budget and trace

- Implement immutable public snapshots, state transitions, usage aggregation, budget checks and stop-once semantics.
- Implement injectable ids/clock and append-only recorder with redaction.
- Test unknown usage, immutable termination, trace ordering and sink failure.

## Slice 3 — Registry

- Implement supported JSON Schema subset validator, registration checks, authorization and sequential execution.
- Test success/error observations, duplicate IDs, permission/argument failures, timeout/cancel and late result isolation.

## Slice 4 — Runner and fake provider

- Implement the canonical loop with ContextPolicy and CompletionPolicy seams.
- Drive the real Runner/Registry path with a scripted fake provider.
- Test happy path, one rejection then repair, second rejection no-progress, provider/runtime failures, every hard budget and cancellation race.

## Slice 5 — DeepSeek adapter

- Implement transport-injected OpenAI-compatible request mapping and unknown response validation.
- Add offline fixtures for text, tool calls, malformed arguments, usage missing/present, HTTP failure and AbortError.
- Confirm no test or default command performs a network request.

## Slice 6 — Integration and handoff

- Add one old-JS consumer test against a clean compiled CommonJS entry.
- Run agent typecheck/build/tests, `npm run test:all`, `npm run check:docs`, `npm run verify:harness`, relevant `node --check`, and whitespace checks available without Git metadata.
- Record commands and a bounded fault matrix under `docs/log/artifacts/F26-single-agent-harness/`.
- Perform an independent code review, resolve P1/P2 findings, then request user inspection of one full trace and boundary acceptance.
- Only after technical evidence and user acceptance: mark F26 passing and activate F31. Do not mark document analysis or model quality complete.

## Expected commands

Exact names to add:

```text
npm run typecheck:agent
npm run build:agent
npm run test:agent
npm run test:agent:clean
npm run test:all
npm run check:docs
npm run verify:harness
```

All agent tests are offline. F33, not F26, owns real API experiments.

