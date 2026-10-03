# F18 Independent Review

Date: 2026-10-03. Reviewer: independent native agent `/root/f18_review` (read-only).
Scope: explicit input / binding, projection authority, session and save races, renderer fragment/Source binding, Preview and regressions.

## Findings and Resolution

| Finding | Resolution | Evidence |
| --- | --- | --- |
| Async human-review save could use a newer global session | Writer captures initiating session and serializes writes; renderer keeps newer edits | human-review-session test |
| Flow edge index could refer to a different visual leaf | DOM carries original nodeIndex; fragment mapping uses it | source inspection binding and reviewer check |
| Stage2 schema branch cardinality was not enforced | Selected branch recursively checks min/max items | malformed three-side diff rejected |
| Independent Map could retain an earlier bundle source | Main and renderer clear bundle/model/L2; source is explicitly unavailable | real Electron Map switch and Topic click |
| Legacy async load could overwrite a newer bundle | All load entries share main sessionEpoch; renderer rejects stale loads | actual fs read paused, newer bundle committed |
| Old Source reply could close a newer Inspector | Shared inspection request sequence; legacy cache also checks load sequence | actual source read paused and released late |
| Consecutive SU requests inside one Inspector could finish out of order | Local coordinate request sequence preserves latest selection | controlled reverse reply and real Electron regression |
| Independent Map L1 title assumed a Review model | L0/L1 title uses Map; model may be null | real Topic click after clearing Review |

## Final Assessment

Reviewer final result: no remaining P1/P2 findings. All six initial issues and subsequent Source/Map regressions were rechecked.
Targeted bundle, session, source, projection, human-review and Preview suites passed independently.
Full test:all, selftest and harness verification are recorded by the parent in verification-summary and logs.
