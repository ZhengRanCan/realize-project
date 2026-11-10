# F33 Offline Framework Verification

Date: 2026-11-10  
Branch: `codex/f26-f33-agent-ui`

Implemented and verified:

- OpenAI-compatible transport with non-secret HTTP errors.
- Base, variant, final request, source, runtime and policy fingerprints; runtime paths are repository-relative.
- Quality sidecars bound to a ready Reading bundle's manifest and immutable file closure.
- Fixed five-dimension 0–4/unknown scoring with mandatory evidence for scored dimensions.
- Fail-closed RunResult validation and trajectory counts derived only from actual trace/state/observations; unobservable repair/rewrite/cost values remain `null`.

Commands passed: `node scripts/test-ai-integration-experiment.js`, `node scripts/test-ai-experiment-eval.js`, `node scripts/harness-gate.mjs`, and `git diff --check`.

Independent review found several fail-open cases during development; all were repaired and the final review found no remaining P1/P2 in the offline framework.

F33 is not passing. The required live DeepSeek two-document × two-run experiment and human quality acceptance remain unexecuted because the configured reachable endpoint lists no DeepSeek model and the configured custom endpoint's compatible chat path returns HTTP 404.
