# F16 Verification

> 契约待补：详细验证口径在 F11–F15 完成后补全；此处只固定层次与必跑项。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check app/renderer/app.js app/main/main.js` | yes | command output |
| L2 feature | 预览与 L2 相关回归（沿用 `scripts/test-l0-preview.js` 与新增断言） | yes | parity 对比 + 回归全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内 L2 路径消费 projection 的集成断言 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 在 Electron 中打开 L2，逐块确认 identity / generation integrity / coverage / occurrence
      都来自 projection。
- [ ] 确认没有旁路：renderer 不再直接读取 authority artifacts 来解释语义。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
