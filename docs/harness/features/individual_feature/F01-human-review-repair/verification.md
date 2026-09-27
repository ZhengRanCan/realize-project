# F01 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `npm run validate` | yes | `docs/log/artifacts/F01-human-review-repair/results/verification-output.txt`（结果：PASSED） |
| L1 static | `npm run audit` | yes | 同上（结果：PASSED） |
| L2 feature | `npm run test:plan` | yes | 同上（22 个用例全部通过） |
| L2 feature | `npm run test:block` | yes | 同上（31 个用例全部通过） |
| L2 feature | `npm run check-plan` | yes | 同上（PASS WITH WARNINGS） |
| L3 system | `npm run check-overview` | yes | 同上（Blocks 21/21、Core 75/75、Supporting 12/12、Provenance 151/151、Failures 无） |
| L3 system | `npm run verify-preview` | yes | 同上（VERIFY PREVIEW PASSED） |
| L3 system | `npm run selftest` | yes | 同上（SELFTEST PASSED） |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F01-human-review-repair/verification-summary.md` |

## Manual paths

- [x] 在 Preview 中只看 O-04 的图，回答「Current 比 Target 多出的关键路径是什么？」—— 答案应为
      「scene 可以直接读取 Frozen Context」；未达成则需 reviewer 决定是否接受更高成本方案。
- [x] 在 Preview 中确认 O-05 的 Receipt 节点不是空洞占位符，而是真的表达了 Receipt 的边界。
- [x] 确认是否接受「混合 prompt 版本」的实验产物。

三项均由用户在 2026-09-26 决策后接受（结果记录在 `results/review-notes.md` §四 与 `legacy-feature-registry.md`）。

## Passing evidence

- 命令日期与结果记录在 `docs/log/artifacts/F01-human-review-repair/verification-summary.md`。
- 代码有变更（`scripts/backfill-overview-blocks.js`、`scripts/backfill-overview-plan.js`），但本 feature 在 harness 接入前
  就已关闭，未留下独立 subagent 审查记录；补偿方式见 `docs/log/artifacts/F01-human-review-repair/subagent-review.md`。
- 本 feature 标为 `passing` 时，`knownUnverified` 与 `humanReviewRequired` 均为空。
