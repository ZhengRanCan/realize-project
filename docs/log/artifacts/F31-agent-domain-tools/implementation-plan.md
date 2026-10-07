# F31 Implementation Plan

1. Add typed domain protocol, bootstrap and isolated workspace modules under `app/agent/domain/`.
2. Add source/contract/artifact/validation tool definitions under `app/agent/tools/` and export them from the Agent public entry.
3. Reuse the existing CommonJS source-coordinate and validator exports through explicit host adapters; do not modify their semantics.
4. Add operation-based Context Policy with serialized read-set/fingerprint evidence.
5. Add clean-build tests for bootstrap atomicity, cross-run/path/capacity rejection, immutable versions, direct dependency behavior, Review safeguards, validator parity and an F26 Runner integration.
6. Run `test:agent:clean`, validator parity suites, harness/docs gates and applicable product regressions; obtain independent review before passing.

No real model request is part of F31.
