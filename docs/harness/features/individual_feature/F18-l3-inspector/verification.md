# F18 Verification

执行已批准实施计划；新增 source、bundle、projection、session、Preview 套件全部加入 test:all。
必须覆盖中文/空格路径搬迁、错误配对与目录越界、跨包审核隔离、异步旧回复、Generated Unknown/Missing、
真实框架图首屏和 Topic → Block → 两条 inspection 路径。无人工自动写入；旧 fixture 与 CLI 回归保持。

Task 1: `node scripts/test-source-coordinates.js`、`npm run test:plan`、`npm run test:block`、`npm run test:map`。
Task 2–6 的具体输入和命令见 `docs/log/artifacts/F18-l3-inspector/drafts/implementation-plan.md`。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | 对本轮每个 JS 文件分别执行 `node --check` | yes | artifact logs/static.txt |
| L2 feature | L3 降级与两条路径的**结构级**断言（禁止 `Verified` 的出现必须断在结构上，不是字符串） | yes | 结构断言全绿 |
| L2 regression | `npm run test:all` | yes | 既有套件、新 bundle / session / projection / Preview 全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内从 Block 往下核查的集成断言 |
| Compatibility | `npm run check-overview` | yes | 原始 Generated verdict 与 warning 保留 |
| Documentation | `npm run check:docs` / `npm run check:experiments` | yes | 文档与历史实验索引一致 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## User Paths

以下由真实 Electron preload / IPC / renderer 集成操作完成，未记为用户手工验收。

- [x] 从一个 Block 走到 `SU → §N → 原文 section`，确认只到 section range。
- [x] 从同一个 Block 走到 `review object → evidence`，确认两条路径没有被连成一条。
- [x] 确认 claim carrier 结构为 absent，界面不创建 claim-level 结论。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
