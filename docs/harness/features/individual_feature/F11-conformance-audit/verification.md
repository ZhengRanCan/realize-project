# F11 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `npm run check:docs` | yes | 命令输出（审计报告与路由引用不断链） |
| L2 feature | 新增的报告校验脚本（`verify-conformance-audit.js`，放在 `scripts/`）：校验每条结论都有证据字段与合法状态枚举 | yes | command output |
| L3 system | — | no — 只读审计，无运行时产物 | — |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] reviewer 复核本目录的 `results/conformance-audit.md`：
      随机抽 3 条结论，按它给的证据（`文件:行` / 命令）独立复核，确认结论成立。
- [ ] 确认报告里**没有**把 `Not Implemented` / `Capability Absent` 写成待办功能。

## Passing evidence

- 把命令日期与结果记录到 `docs/log/artifacts/F11-conformance-audit/verification-summary.md`。
- 本 feature 无代码变更，独立审查记为 `not_required` 并给出原因。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
