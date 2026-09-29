# F18 Verification

> 契约待补：详细验证口径在 F11–F17 完成后补全。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check app/renderer/app.js app/renderer/l0-map.js app/main/main.js` | yes | command output |
| L2 feature | L3 降级与两条路径的**结构级**断言（禁止 `Verified` 的出现必须断在结构上，不是字符串） | yes | 结构断言全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内从 Block 往下核查的集成断言 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 从一个 Block 走到 `SU → §N → 原文 section`，确认只到 section range。
- [ ] 从同一个 Block 走到 `review object → evidence`，确认两条路径没有被连成一条。
- [ ] 确认界面**没有任何** claim-level 的 Verified / Unverified 结论。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
