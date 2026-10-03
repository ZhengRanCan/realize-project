# F23 Implementation Verification

Date: 2026-10-03. Status: blocked only on actual user interface acceptance. Implementation and independent code review complete; F17 remains blocked on the same user acceptance. F24 has not started.

The user approved the [design](view-design.md) with “可以，做吧” and the [Native implementation plan](drafts/implementation-plan.md) with “看着没问题，实施咯”. These approve implementation, not the resulting interface.

## Delivered behavior

- Topic entry now opens a real L1 diagram with all internal relations and crossing endpoints; external endpoints are marked outside the topic. Membership/classification and original relation fields remain authoritative.
- Zero relations produces a boundary summary; empty Inside and Unknown / Known(0) / Known(n) stay distinct. No Plan means declared Block IDs remain disclosed with an unavailable reason.
- Node/relation selection discloses full metadata; explicit Element/Block/Source actions reuse the existing navigation and source API. Back from Block/Element/Explore restores selection, details, focus and graph scroll.
- Source capability consumes the loaded registry and integrity state. Only a unique heading is clickable; absent/duplicate/drifted coordinates are disclosed. SU identifiers never become heading coordinates. The API retains live integrity checks.
- Electron and relocated read-only Preview use the same renderer. Normal tests clean their own temporary inputs and do not create permanent txt logs or user approvals.

## Verification results

All commands below exited 0 on the final implementation (documentation gates rerun after status/evidence updates).

| Command | Result / scope |
| --- | --- |
| `node scripts/test-l1-topic-projection.js` | Metadata, inside/outside, direction, organization states, deep copies and input purity |
| `node scripts/test-reading-bundle-projection.js` | Existing L2/L3 plus unique/missing/duplicate/drifted L1 Source capability |
| `npm.cmd run test:l1-boundary -- --record-boundary-evidence` | Real bundle/Map entry, actual SVG geometry, keys, 640×720, corner cases, source and focus, screenshots |
| `npm.cmd run test:all` | Offline suite, five public Map layouts, 1–6 parallel edges, shared invariants, doc/experiment index, moved and legacy Preview |
| `npm.cmd run selftest` | Full real Electron chain, F18–F21/F15 regressions and F23 |
| `npm.cmd run validate` / `npm.cmd run audit` | Existing fixture schema/consistency and Overview coverage passed |
| `npm.cmd run check-overview` | PASS WITH WARNINGS; 21/21 blocks, 87/87 units, 151/151 provenance; existing duplicate×17 / density×1 retained |
| `npm.cmd run check:docs` / `npm.cmd run verify:harness` | 148 Markdown / 0 broken; 23 features / 0 errors |
| Modified/new JS `node --check` / `git diff --check` | Static checks passed |

Regression routes check entire segments against card interiors, no immediate reversal/non-adjacent retracing/self-intersection, bounds and target-entry tangent. Electron additionally samples the actual SVG path. Tests also cover safe escaping, full label/qualifiers, symmetric edges with no marker, no auto-save and new-session selection isolation.

One full selftest run alongside another Electron Preview process failed the visible-focus assertion; selection itself was correct. Running the complete selftest alone passed without weakening the assertion. Electron prints existing Windows cache-access diagnostics, but final tests exit 0. Successful output is summarized here, not retained as txt logs.

## Interface evidence

[Capture metadata](interface-evidence.json) records viewport dimensions asserted against capture size. Input is public context-consumption Gold / schema+check-map-valid temporary copies, never user private material.

| File | Input / view | Viewport |
| --- | --- | --- |
| [Internal diagram](internal-diagram.png) | T-02 generation chain, 5 members / 4 internal relations; independent graph scrolling | 1280×900 |
| [Crossing diagram](crossing-diagram.png) | T-03 evidence concern, 2 inside / 2 outside / 2 crossing; full outside identity | 1280×900 |
| [Narrow diagram](internal-narrow.png) | T-02 graph scroll and native selection disclosure | 640×720 |
| [Boundary summary](boundary-summary.png) | Valid temporary Map with no edges / explicit empty Block organization | 640×720 |

[Independent review](subagent-review.md): three P2 repaired and rechecked; no remaining P1/P2. [Incident](../../../harness/incidents/2026-10-03-f23-boundary-review.md) records the defects before repairs.

## User acceptance still required

A local read-only preview is generated at `workspace/previews/f23-reading-preview.html`, based on the existing Gold analysis bundle. Open it and click “生成链路与消费点” (T-02) for internal structure, then “消费的证据与判定” (T-03) for external connections. For Electron run `npm.cmd start` and open `workspace/analyses/context-consumption/stage2-gold/reading-bundle.json`. These local artifacts are ignored by Git.

The user must inspect the actual interface and confirm the internal and external connections are understandable. That result has not been received. F23/F17 stay blocked; F24 remains queued and main is not merged. Large dense L1 performance, durable Topic canonical landing and independent L2 presentation are outside this completion evidence.

## Checkpoints

- `eafcdc3`: original display metadata projection and regression.
- `81e8395`: pure boundary renderer and layout/HTML regression.
- Integration, review repairs and technical delivery are committed together after final documentation gates; actual user acceptance will be a separate record.
