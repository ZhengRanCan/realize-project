# F22 Independent Native Review

Date: 2026-10-03. Reviewer: native subagent f22_review, read-only. Baseline: a54a7d5.

## Findings and fixes

- P1 Stage 2 output double root: preserve relative defaults; resolve output root once before joining child paths.
- P2 foreign cwd defaults: ROOT-anchored mapping returns canonical relative paths for relative joins; absolute paths remain absolute. Foreign cwd assembly writes only an isolated test output.
- P2 check-plan explicit source/design/registry aliases: all three use resolver; each legacy option executes in regression.
- P2 resumable migration journal: same-directory temporary write, fsync, atomic rename; simulated interruption retains previous journal; resume and collisions preserve destination bytes.
- P2 existing root human review: legacyReviewPath reuses existing root file in place; only new legacy results use workspace. Regression covers both branches without reading user content.
- Markdown picker starts at samples. Current document links fixed; historical ENOENT remains explicitly historical.

Final reviewer conclusion: no remaining P1/P2. Independently confirmed original fixes, compatibility checks and 129 current documents / 0 broken links. Reviewer did not edit files, repeat large suites, read private local content or call an external model.
