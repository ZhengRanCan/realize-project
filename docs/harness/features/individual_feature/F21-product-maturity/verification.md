# F21 Verification

> 契约待补：验收标准与验证口径在 F16–F20 完成后细化。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check app/renderer/app.js app/renderer/l0-map.js` | yes | command output |
| L2 feature | `scripts/test-l0-preview.js` 等既有回归 | yes | 回归全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内四层走查 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 四层走查：确认 identity / authority / epistemic state / semantic strength 均未被 UI 需要改变。
- [ ] 抽查 3 个 UX 决策，确认每个都能追溯到契约条款。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
