# F23 Independent Review

Date: 2026-10-03. Native independent reviewer: `/root/f23_independent_review`. Product baseline: `c2447d4`; includes F23 projection/renderer commits and integration changes. Read-only review; no external model/API calls.

## Findings and disposition

| Finding | Severity | Repair / regression | Status |
| --- | --- | --- | --- |
| Parallel internal curves crossed the target card and arrived from the wrong direction | P2 | Card-obstacle routing; pure segment collision checks and actual SVG path sampling/target tangent checks | closed |
| Source buttons enabled from session + § prefix despite unresolved/duplicate/drifted heading | P2 | Existing registry/integrity and coordinate resolver determine capability; real heading/Escape focus, accepted drift and consistent duplicate heading tested | closed |
| Separately routed halves retraced their path at the label, producing a hanging branch | P2 | First half avoids target port; second half cannot retrace/cross first; immediate reversal, non-adjacent overlap and self-intersection regressions | closed |

Final recheck: no remaining P1/P2. Reviewed latest internal/crossing/narrow screenshots. The minimal two-edge A→B case now has a continuous route through its label without retracing.

Reviewer independently checked five public Maps / 31 Topics / 66 L1 relations, and one through six parallel internal edges: canvas bounds, card collision, self-intersection/retracing, final target tangent and input purity passed. These cases are also retained in the pure boundary-view test.

Commands: `node scripts/test-l1-boundary-view.js`, `node scripts/test-l1-topic-projection.js`, `node scripts/test-reading-bundle-projection.js`, `git diff --check c2447d4` all passed during review/recheck. Parent owns full Electron and portable Preview results in [verification summary](verification-summary.md); reviewer did not duplicate those runs.

User understanding of the actual graph remains unaccepted. F21's old stress budget does not establish performance of arbitrary dense L1 graphs. No claim of canonical Topic landing or claim/provenance verification is introduced.
