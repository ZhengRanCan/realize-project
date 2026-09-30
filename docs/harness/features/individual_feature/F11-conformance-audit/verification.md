# F11 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `npm run check:docs` | yes | 命令输出（审计报告与路由引用不断链） |
| L2 feature | 执行 `docs/log/artifacts/F11-conformance-audit/read-only-probes.md` 的第二个 JavaScript fenced block：校验每条结论的证据字段、合法状态枚举、矩阵完整性与逐站源位置 | yes | command output |
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

## 只读范围澄清（2026-09-29）

用户明确禁止 F11 新增或修改代码，因此报告校验以已有文档内临时命令执行，替代先前与 scope 冲突的新增 scripts 文件要求。仍要求实际运行及保存原始输出，不降低证据/枚举/覆盖验证要求。
