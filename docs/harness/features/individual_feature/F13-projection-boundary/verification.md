# F13 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check`（新增的 `reading-projection.js`，路径实现时定） | yes | command output |
| L2 feature | `node` + 新增的 `test-reading-projection.js`（放在 `scripts/`） | yes | 状态空间 / 名义隔离 / S3 / identity / authority / capability 六组断言全绿 |
| L3 system | — | no — 纯模块，尚未接入运行时；接入是后续 feature 的事 | — |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] reviewer 抽查 projection API：确认六条高风险 invariant 各有一个可结构化断言的边界，
      并确认**没有**出现 L2/L3 功能实现（对照 Out of scope 的停止条件）。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
