# F31 Verification Summary

## 2026-10-07 — Initial implementation

- Status: active; not yet passing.
- Added atomic Host bootstrap with frozen UTF-8 source bytes, SHA-256 and the existing deterministic source registry.
- Added isolated run workspace, immutable candidate versions, atomic current pointer, rejected-candidate retention, direct dependency tuples and JSONL ledger.
- Added bounded source, allow-listed contract, current artifact, validator and artifact submission tools. No generic path, command, network or model tool exists.
- Added operation-scoped Context Policy with a fresh serialized input and read-set fingerprint.
- Reused existing Map/Plan/Block/Overview validators and design-review schema/semantic checks; no validator semantics were copied or relaxed.
- `node scripts/test-agent-clean.js`: passed, including real F26 Runner → domain Registry integration.
- Existing `test-check-plan`, `test-check-block`, `test-check-map` and `test-semantic-grounding`: passed.
- Remaining gates: broader adversarial/parity coverage, applicable full regression, independent review and user boundary acceptance.

## 2026-10-08 — Boundary and parity expansion

- Added exact wrapper parity for Plan, Block and Overview in addition to Map; the Block wrapper now consumes the source-derived `allowedPhrasesFromText` pure helper exported from the existing validator.
- Added pre-aborted bootstrap cleanup, bounded-source capacity rejection, cross-run permission rejection and stale-dependency candidate retention tests.
- A test exposed an async rejection escaping the `write_artifact` retention catch because the Promise was returned without `await`; fixed and protected with a real stale-dependency regression.
- `node scripts/test-agent-clean.js`, `node scripts/test-check-block.js`, harness gate and `git diff --check`: passed. F31 remains active pending independent review and user boundary acceptance.

## 2026-11-05 — Branch and full-regression checkpoint

- Confirmed work continues on `codex/f26-f33-agent-ui`, tracking `origin/codex/f26-f33-agent-ui`; the older `codex/f11-f21-conformance` instruction applies to the completed F11–F21/F22 line, not the active F26–F33 work.
- `npm run test:agent:clean`: passed, including strict TypeScript build, registry/provider/trace/core checks and the real F26 Runner → F31 domain integration.
- `npm run verify:harness`: passed with 32 features and 0 errors; `git diff --check`: passed.
- `npm run test:all` passed repository layout, Plan/Block/Map validator suites, gateway safety, semantic-grounding safety, and L0 view/layout/preview suites before `check:docs` stopped the command on 22 links to intentionally untracked local `workspace/` bundles/previews from F23–F25. No F31 link or changed file was involved, and no placeholder local evidence was fabricated to make the command green.
- F31 remains `active`: the automated domain boundary/parity evidence is green, while independent code review and the user's tool-boundary acceptance remain required before `passing`.

## 2026-11-05 — Host-owned read-set repair

- A focused boundary audit found that `write_artifact` still exposed `readSet` as a model-supplied argument. That allowed a candidate to omit or fabricate the resources actually serialized by the Context Policy, contrary to the F31 host-evidence contract.
- Removed `readSet` from the tool schema and made the domain registry require a host `currentReadSet` provider. Accepted and rejected candidates now receive the current request's host-recorded evidence; a model attempt to pass `readSet` is rejected as an additional property before execution.
- Added regression assertions for forged-read-set rejection and for committed ledger records matching `DomainContextPolicy.lastEvidence.readSet`.
- `npm run test:agent:clean`, `node scripts/test-check-plan.js`, `node scripts/test-check-block.js`, `node scripts/test-check-map.js`, `node scripts/test-semantic-grounding.js`, `npm run verify:harness`, and `git diff --check`: passed.

## 2026-11-05 — Operation-scoped tool-result pairing

- The next boundary audit found that `DomainContextPolicy` discarded every prior tool observation. A real Agent could call `read_source`, but its next model request could not consume the result; sending a bare tool message would also violate provider call/result pairing.
- Added domain-neutral structured tool exchanges to the F26 Runner input. An F31 operation now selects explicit call IDs and serializes only those exchanges as an assistant `tool_calls` message followed by its matching tool result. Other operation history is neither serialized nor counted in the read set.
- Extended the DeepSeek adapter to emit the paired wire representation without exposing unrestricted conversation history. The shared protocol/Runner/validation/provider files were added explicitly to F31 scope before the change.
- Added direct policy isolation assertions, DeepSeek wire assertions, and a real Runner → DomainContextPolicy two-turn test proving the second request receives the selected `read_source` result with a valid pair.
- `npm run test:agent:clean`, `npm run verify:harness`, and `git diff --check`: passed.

## 2026-11-07 — Validator-owned direct dependencies

- A dependency audit found that model arguments could omit artifacts read implicitly by validation. A Plan could therefore pass against the current Design Review without recording that direct edge; Block and Overview had the same gap for the current Plan.
- The host now injects the validator-owned direct tuples (`overview-plan` → `design-review`; `stage2-block` / `overview` → `overview-plan`). Model-declared generation inputs remain additive, and a conflicting tuple is rejected while preserving the failed candidate.
- Added regressions proving automatic dependency injection and conflicting-dependency retention. Transitive closure remains explicitly assigned to F32.
- The machine's `npm` launcher currently points at a missing roaming `npm-cli.js`; verification therefore used the repository-local compiler and direct Node entrypoints. `node scripts/test-agent-clean.js`, Plan/Block/Map parity suites, semantic-grounding regression, `node scripts/harness-gate.mjs`, and `git diff --check`: passed.

## 2026-11-07 — Dependency tuple normalization

- Rejected self-dependencies, which would make a newly written current artifact stale against its own previous version, and duplicate dependency kinds, which would make a direct edge ambiguous.
- Semantic dependency failures now enter the same rejected-candidate retention path instead of escaping before evidence capture.
- Added regressions for both cases. `node scripts/test-agent-clean.js`, `node scripts/harness-gate.mjs`, and `git diff --check`: passed.

## 2026-11-07 — Frozen-byte and current-pointer integrity

- The workspace previously recorded source and candidate hashes but did not recompute them on reads. Added fail-closed byte verification for the frozen source and every current artifact candidate.
- Added runtime validation for `current.json`: kind, status, version, SHA, dependency/read-set containers, and the deterministic candidate path must match the requested namespace. A drifted pointer cannot redirect reads to another run path or artifact file.
- Added source drift, candidate drift, and pointer-redirection regressions. `node scripts/test-agent-clean.js`, `node scripts/harness-gate.mjs`, and `git diff --check`: passed.

## 2026-11-09 — Contract link containment

- The contract allow-list previously enforced lexical repository containment but still followed an in-repository link or junction to an external target.
- Contract reads now resolve both the repository root and selected file to real paths and reject any resolved target outside the real root.
- Added a real Windows junction escape regression. `node scripts/test-agent-clean.js`, `node scripts/harness-gate.mjs`, and `git diff --check`: passed.

## 2026-11-09 — Stored dependency fail-closed validation

- `current.json` previously checked that `dependencies` was an array but did not validate its stored tuples before using `dependency.kind` to construct a path.
- Current reads now validate every dependency kind/version/SHA, reject unknown, duplicate and self kinds, and validate all read-set entries before any dependency file access.
- Added a tampered on-disk dependency path regression. `node scripts/test-agent-clean.js`, `node scripts/harness-gate.mjs`, and `git diff --check`: passed.

## 2026-11-09 — Independent review repairs

- Independent read-only review found no P1 and three P2 items: current-pointer rollback on ledger failure, direct dependency candidate byte verification, and missing bootstrap source capacity.
- Added injected ledger-failure rollback so a tool error cannot leave the failed candidate current; the rejected-candidate path remains available after rollback.
- Consumer reads now byte-verify every direct dependency candidate without pre-implementing F32 transitive closure.
- Bootstrap now rejects source inputs above 4 MiB before workspace creation and rechecks the bytes read.
- Added fault-injection, dependency-tamper and oversized-source regressions. `node scripts/test-agent-clean.js`, `node scripts/harness-gate.mjs`, and `git diff --check`: passed. Narrow independent re-review pending.

## 2026-11-09 — Multi-Block namespace correction

- F32 pre-implementation inspection found that all `stage2-block` candidates shared one current pointer, so a document could not retain multiple current Blocks. F31 was reopened rather than allowing F32 to infer current state from candidate history.
- Added subject-aware artifact identity and dependency tuples. `stage2-block:<blockId>` now has an isolated directory/current pointer; singleton kinds reject subjects, Block candidates must match their subject, and Context Policy/tool reads can address a specific Block.
- Added two real Block writes (`O-01`, `O-02`) and simultaneous current-read assertions. `node scripts/test-agent-clean.js`, `node scripts/harness-gate.mjs`, and `git diff --check`: passed. Independent narrow review pending.
