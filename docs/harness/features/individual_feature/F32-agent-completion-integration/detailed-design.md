# F32 Detailed Design

## State model

Core `run_status` remains independent from domain delivery. F32 returns `artifact_status: structurally_complete | incomplete`, `completionGate: PASS | FAIL`, and `quality_status: unreviewed`. Structural PASS never changes quality to passed.

## Generic proof graph

The completion engine consumes opaque typed input references and proof records. Each proof identifies its subject, exact direct input refs, supporting proof IDs, rule/policy fingerprint, verdict, and skipped checks. Closure is graph-driven: roots must exist, every referenced node must resolve to the exact identity/revision/hash, required checks may not be skipped, and proof dependencies must be acyclic. Invalidation is derived through reverse edges, without artifact-kind switches.

## Domain completion

The document domain maps current F31 records and validator results into the generic graph. Required roots cover inventory, Design Review, Map, selection, Plan, required Blocks, reading Guide/source binding, assembly, Topic-to-Block pairing, and staged bundle verification. Rejection returns concrete missing or stale proof IDs.

## Publication transaction

Assembly and bundle export reuse existing deterministic JS implementations through narrow adapters. Output is written to a new sibling staging directory, verified by the existing bundle reader/validator, and checked again against the frozen version vector, run epoch, and cancellation signal before one rename publishes it. Failure, cancellation, duplicate destination, or vector drift leaves no successful destination and never overwrites an old bundle.

## Trace and compatibility

Completion decisions record root IDs, version vector, proof failures, publication result, budget/usage availability, and termination reason without credentials. Existing renderer and portable Preview consume the published standard bundle unchanged. Offline controlled provider traces prove integration; real-model quality remains F33.
