# F32 Verification Summary

Date: 2026-11-09  
Branch: `codex/f26-f33-agent-ui`

F32 is passing. The controlled offline provider exercised the real Runner, domain workspace, validators, 21 subject-scoped blocks, assembler, transactional exporter and bundle read-back. Completion remained separate from quality (`quality_status=unreviewed`).

Verified failure paths include missing proof roots, stale revisions, missing blocks, false model completion, cancellation, duplicate publication, changed epoch/vector, and an old Map candidate path presented against the current Map proof. Inventory and map-selection are fixed document roots; selection references are checked against the current inventory and Map target semantics.

Commands:

- `node scripts/test-agent-clean.js` — passed
- `node scripts/test-reading-bundle.js` — passed
- `node scripts/harness-gate.mjs` — 32 features, 0 errors
- `git diff --check` — passed

Real-model semantic quality is intentionally unverified here and belongs to F33.
