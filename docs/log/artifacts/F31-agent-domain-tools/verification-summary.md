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
