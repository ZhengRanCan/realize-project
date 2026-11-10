# F33 Detailed Design

F33 reuses the F26–F32 runtime and adds only experiment orchestration and evaluation. Each live run freezes source, actual prompt, runtime/policy and model parameters by SHA-256. Raw trace and immutable bundle remain separate from `quality-evaluation*.json` sidecars. A sidecar subject is the manifest byte hash plus the sorted verified file closure hash, so relocation remains valid while any content change invalidates the evaluation.

Trajectory metrics are derived from trace events; unavailable token/cost values remain `null`. Structural completion and quality scores are reported independently. Live runs use two documents and at least two repetitions per document after the compatible endpoint/model and budget are confirmed.
