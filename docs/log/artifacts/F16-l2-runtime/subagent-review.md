# F16 implementation review

Date: 2026-10-01

Review scope: `app/shared/reading-projection.js`, `app/main/main.js`,
`app/renderer/app.js`, and `scripts/test-reading-runtime.js`.

Result: accepted for the F16 boundary. The adapter preserves raw block identity,
content, and source references; it treats missing review references as `unknown` and
explicit `[]` as `empty`, and labels populated references only as `related`. The
renderer consumes the projected shape and contains no direct `model.overview`,
`block.sources`, or `block.reviewObjects` read. Electron selftest rendered 21 blocks
through the actual IPC path.

Limit: this is a code review recorded by the implementing Codex session, not an
independent human review. It does not assert that the historical pipeline artifacts
are product inputs; the currently supported product input remains validated
`design-review.json`.
