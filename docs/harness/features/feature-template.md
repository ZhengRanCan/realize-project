---
id: Fxx
title: Short feature title
version: v0.1
status: not_started
dependsOn: []
scope: {"code":[],"tests":[],"docs":["docs/progress.md","docs/log/artifacts/Fxx/**"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"not_required","userPath":[],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# Fxx Short feature title

## Goal

本 feature 交付什么可观察的结果？

## Process preconditions

非 harness 强制、但事实上必须先具备的条件（例如某个前置 feature 的契约已冻结）。写 `None` 表示没有。

## Scope

### Allowed changes

- TODO

### Out of scope

- TODO

## Acceptance Criteria

- [ ] TODO: 可观察、可测试的结果。

## Risks and compatibility

- TODO: 数据迁移、集成、隐私或回滚风险；确实没有时写 `None`。

## Completion evidence

- Verification evidence: `docs/log/artifacts/Fxx/verification-summary.md`
- Independent review: `docs/log/artifacts/Fxx/subagent-review.md`（代码变更必需；否则写 `not_required` 及原因）
