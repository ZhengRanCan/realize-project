# F31 Detailed Design

## Boundary

F31 is the document-domain host around the F26 runtime. `prepareRunInput` is a host API, never a model tool. It freezes one UTF-8 source document, records its SHA-256 and deterministic source registry, then creates an isolated run directory. Domain tools receive an already-created `DomainWorkspace`; they cannot choose filesystem paths, run commands, alter validators, or access another run.

## Run layout

```text
<runsRoot>/<runId>/
  input/source.md
  input/source-registry.json
  meta/run-input.json
  artifacts/<kind>/candidate-000001.json
  artifacts/<kind>/current.json
  ledger/events.jsonl
```

`runId` and artifact kind use closed lexical validation. Bootstrap writes to a sibling temporary directory and renames only after every required input exists. Existing run directories are never reused.

## Lifecycle and direct dependencies

Each submitted candidate gets an immutable monotonically increasing version. A successful atomic `current.json` replacement points at the same bytes; rejected validation never advances current. Ledger events record candidate SHA-256, declared dependencies, actual read set, validator verdict and resulting status.

Dependencies are explicit `{kind, version, sha256}` tuples. They are checked when a candidate is submitted. Updating an unrelated artifact does not invalidate another candidate; a consumer is current only when every dependency tuple still resolves to the recorded bytes. Map and Plan identities remain separate namespaces even when their local IDs have the same text.

The host injects dependencies that its validator actually reads: Plan validation binds the current Design Review, while Block and Overview validation bind the current Plan. Model-declared generation dependencies are additive and cannot conflict with those host-owned tuples. F31 records direct edges only; F32 is responsible for checking the transitive completion closure.

A candidate cannot depend on an older version of its own kind, and each dependency kind may appear at most once. These restrictions prevent a newly committed current pointer from being stale immediately and keep the direct-edge ledger unambiguous.

## Context policy

The host selects an operation, not a fixed workflow stage. Each operation declares the only source/contracts/artifacts that may be serialized. The policy reads those resources through the workspace, returns a fresh context without prior hidden conversation, and emits a read-set fingerprint. Inventory and Review are independent branches and may be produced in either order.

Tool results are not carried as an unrestricted conversation transcript. The Runner exposes structured call/result exchanges to the policy; the current operation selects explicit call IDs, and the policy emits each selected exchange as a correctly paired assistant tool call plus tool result. Unselected results from an earlier operation are absent from both the request and its read set.

## Tool surface

- `read_source`: bounded reads from the frozen source snapshot by registered section/range.
- `read_contract`: reads one allow-listed repository contract captured by the host.
- `read_artifact`: reads one current version from this run.
- `write_artifact`: submits JSON for an allow-listed artifact kind with explicit dependency tuples. The model cannot supply its own read set; the registry obtains the current request's actual read set from the host Context Policy and records that evidence on both accepted and rejected candidates.
- `validate_artifact`: invokes the existing exported validator for Map, Plan, Block, or Overview and returns its original verdict structure.

There is no generic path, shell, network, model, approval, or human-review tool. `design-review` submissions are checked for pending decisions and forbidden source-verification claims before commit.

The only legacy-script adaptation is the pure `allowedPhrasesFromText` export from `scripts/check-block.js`, so the single-block tool uses the same source-derived forbidden-phrase exception as the CLI/overview validator. It has no I/O or generation behavior; existing consumers keep the same `checkBlock` implementation.

## Failure semantics

Path/ID/capacity/dependency/validation failures are typed rejections and leave current artifacts unchanged. Candidate evidence and ledger records remain. Cancellation is checked before and after file I/O. All writes use exclusive temporary files followed by rename; credentials and source content are not copied into trace payloads.
