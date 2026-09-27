# F01 Verification Summary

本文件把 harness 接入前的验证记录整理成当前口径。原始输出保持原样，见
`results/verification-output.txt`（UTF-16LE）、`results/modifications.md`、`results/before-after.md`、
`results/review-notes.md`。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `npm run validate` | 2026-09-25 ~ 2026-09-26 | passed | Schema 校验 + 一致性检查通过 |
| `npm run audit` | 同上 | passed | 覆盖审计通过 |
| `npm run check-plan` | 同上 | passed-with-warnings | PASS WITH WARNINGS；warnings 为既有结构提示，非本轮引入 |
| `npm run test:plan` | 同上 | passed | 22 个用例全部通过 |
| `npm run test:block` | 同上 | passed | 31 个用例全部通过 |
| `npm run check-overview` | 同上 | passed-with-warnings | Blocks 21/21 · Core 75/75 · Supporting 12/12 · Total 87/87 · Provenance 151/151 · Warnings 17+1 · Failures 无 |
| `npm run verify-preview` | 同上 | passed | 21 个 block 全部渲染（10 个展开）；4 段 / 21 条目目录；42 个 Source 标签；1 条 renderer 控制台错误已记录 |
| `npm run selftest` | 同上 | passed | Electron 真实渲染进程内跑通 import → 两页 → 审批 → 保存 → Gate |

## Coverage 对比

| 指标 | Before | After |
| --- | --- | --- |
| Blocks | 21 / 21 | 21 / 21 |
| Core coverage | 75 / 75 | 75 / 75 |
| Supporting | 9 / 9 | 12 / 12（sourceUnit 拆分后增加） |
| Provenance | 146 / 146 | 151 / 151 |
| Failures | 无 | 无 |

## 人工路径证据

- 只看图回答 O-04 的 Current / Target 差异；确认 O-05 的 Receipt 节点表达边界而非占位；确认是否接受混合 prompt 版本产物。
- 三项均在 2026-09-26 由用户决策后接受，feature 记为 Completed。

## 已知偏差（不阻塞本轮验收）

- `experiments/stage2-full/overview.generated.json` 由混合 prompt 版本产物组成，不是单次同构运行结果。
- O-16 的 `request.json` 已被失败重试覆盖并显式标注，原始请求日志不可恢复。
- 18 条 warnings 保留；`check-block` 的重复阈值口径未在本轮调整。

## Harness layer

- `npm run verify:harness` 结果见 `docs/progress.md` 的 "Latest harness gate" 一行。

## 实验产物

本 feature 的实验 run 逐条登记在 `experiments/index.json`（`areas.stage2`、`areas.stage2-full`，共 35 units）：

- `experiments/stage2/`：8 个 block 试点产物 + `_first-attempt-failures/` 的 4 个首次失败尝试 + `pilot-summary.json`
- `experiments/stage2-full/`：`blocks/` 21 个 block + `_before-fix/{O-05,O-08}`，顶层 `manifest.json`、
  `overview.generated.json`、`overview-preview.html`、`check-overview.txt`、`full-run-report.md`

索引与校验：`npm run index:experiments` / `npm run check:experiments`；归属依据与 fixture 对应见 `experiments/README.md`。
