# F19 Verification

> 契约待补：详细验证口径在 F11–F18 完成后补全。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check app/renderer/app.js app/renderer/l0-map.js app/main/main.js` | yes | command output |
| L2 feature | ReadingAddress / Back / Resolve 的断言（结构级：resolver 是否被调用、地址是否原样恢复） | yes | 断言全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内走 "occurrence → detail → Explore → Open in Reading → Back" 一整条 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 从 `T-05` 的 occurrence 进入 detail → Explore → `Open in Reading` → `Back`，
      确认回到 `T-05` 那个 occurrence（不是 canonical landing、不是首页）。
- [ ] 对 `Known(0)` occurrence 的 Block 确认 `#block-<id>` 仍可打开。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
