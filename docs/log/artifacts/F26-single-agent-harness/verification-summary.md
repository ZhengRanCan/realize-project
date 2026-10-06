# F26 Verification Summary

## 2026-10-06 — Design activation

- Result: in progress; not passing.
- User asked to continue after the F26–F33/UI branch was created.
- F26 is the only active feature. Formal detailed design and implementation plan were added for review.
- Runtime source, dependencies, build output, provider calls and model experiments have not started.
- Next gate: user approval of `detailed-design.md` and `implementation-plan.md` before implementation.

## 2026-10-06 — Runtime implementation

- `npm run typecheck:agent`: passed.
- `npm run test:agent:clean`: passed; clean build followed by JS consumption of `dist/agent/index.js`.
- Agent matrix: canonical input validation, Registry success/rejection/duplicate identity, DeepSeek offline wire mapping, trace sink failure, multi-turn tool loop, completion acceptance/rejection, no-progress, unknown tool, step budget, required-usage failure, cancellation and late response.
- `node scripts/harness-gate.mjs`: 32 features, 0 errors.
- Existing regression before documentation check passed; commands after that check were run separately and passed through human-review session. Electron reading-bundle preview passed outside the sandbox.
- `check:docs` reports 22 pre-existing missing `workspace/` preview/analysis targets because this handoff directory does not contain those ignored/local files. No reported link originates in the new F26 documents.
- No external model request was made. DeepSeek uses an injected transport and offline fixtures only.
- Remaining before passing: independent code review and user acceptance of the core boundary/trace; the workspace-only documentation environment limitation remains explicit.
