# F20 Verification

> 契约待补：详细验证口径在 F11–F19 完成后补全。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check app/renderer/app.js app/renderer/l0-map.js app/main/main.js` | yes | command output |
| L2 feature | Addressability 准入与"不新增第二套 identity/resolver"的断言 | yes | 断言全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内从 Reading 进入 Explore 再 Back 的集成路径 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 从任意 Reading 深度进 Explore（Focus = Element / Topic），确认走同一套 identity 与 resolver。
- [ ] 确认 attachment-only 的 constraint 只能作 annotation，不能成为 Focus。
- [ ] 确认 `Back` 与 `Open in Reading` 行为不同。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
