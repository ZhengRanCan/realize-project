# Fxx Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `TODO` | yes | command output or CI link |
| L2 feature | `TODO` | yes | command output or CI link |
| L3 system | `TODO` | no — make required when `completionGate.l3` is `required` | build/runtime record |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] TODO: 写出要验证的用户或集成路径；不需要时写 `Not required` 并给出原因。

## Passing evidence

- 把命令日期与结果记录到 `docs/log/artifacts/Fxx/verification-summary.md`。
- 代码有变更时，把独立审查记录到 `docs/log/artifacts/Fxx/subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
