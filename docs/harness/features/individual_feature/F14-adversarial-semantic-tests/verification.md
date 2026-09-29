# F14 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check`（新增的 `test-reading-adversarial.js`，放在 `scripts/`） | yes | command output |
| L2 feature | `node` + 新增的 `test-reading-adversarial.js` | yes | 六组（S1 / S3 / S4 / N6 / N7 / N8）全部结构级断言通过 |
| L3 system | — | no — 边界级测试，不是产品集成 | — |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] reviewer 抽查每组 fixture：确认它只增强一个诱惑来源（其余为最低强度基线）。
- [ ] 确认 N7 / N8 的 fixture 是分开的两个，没有共用"所有条件都最强"的输入。
- [ ] 确认断言打在结构上（字段 / 边的有无），不是字符串。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
