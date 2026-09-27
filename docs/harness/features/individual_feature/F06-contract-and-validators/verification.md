# F06 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | 无独立静态校验命令 | no | 材料里没有 schema 自检 / lint 的输出；`schema/framework-map.schema.json` 只被 check-map 在运行时解析（`docs/log/artifacts/F06-contract-and-validators/results/verification-output.txt` 末条用例「词表确实从 schema 读（6 类 / 9 词）」），独立 JSON Schema 校验器自检未记录 |
| L2 feature | `npm run test:map`（`scripts/test-check-map.js`） | yes | `results/verification-output.txt` 的 `test-check-map` 段：19 passed, 0 failed（F09 修复后同一脚本复跑 29/29，见 `docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt`） |
| L2 feature | `npm run check-map`（A / B / C 三篇） | yes | 同文件：A HARD 0 · WARN 0 · INFO 2；B HARD 0 · WARN 2 · INFO 2；C HARD 0 · WARN 2 · INFO 3（三篇均为 `PASS（无契约违反）`） |
| L3 system | `npm run check-map` 对真实 Fixture 的集成实跑（含粒度纪律） | yes | 同文件三篇报告：`granularity` 一行显式打印（A `sourceUnit`，B / C `section (provisional)` 且带「不得与 sourceUnit 粒度混算」提示），coverage 87/87 · 13/13 · 19/19 |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F06-contract-and-validators/verification-summary.md`（2026-09-27 由主 agent 收口执行） |

## Manual paths

- [ ] reviewer 按 `docs/log/artifacts/F06-contract-and-validators/validation-checklist.md` §1~§7 逐项核对，并在 §8 回出
      `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT` —— 未做：清单 §1~§7 的复选框全部仍为空，§8 最终判定栏为空。
- [ ] F09 修复并入后的产物在 F06 侧重跑一次回归并签署 —— 未做：修复后的 29/29 与五篇 Fixture 复测记在 F09 的 `results/` 下，
      F06 的 `results/` 没有更新（仍是 2026-09-26 20:44 的修复前快照）。
- [x] 人工比对 check-map 报出的收敛节点与人工判断一致：C 的 `E-04` / `E-08`（按 `consumes` 归一化后的多入边）——
      记录在 `results/notes.md` §3.1（第一版用「入度 > 1」判 DAG 时 A / B / C 全误报，归一化后只有 C 报收敛，与人工判断一致）。

## Passing evidence

- 本 feature 目前是 `blocked`，未达到 `passing` 所需条件：用户验收未记录（清单 §1~§7 全空、§8 判定栏为空），
  且 F09 修复并入后没有 F06 侧的回归验收记录。
- 命令日期与结果记录在 `docs/log/artifacts/F06-contract-and-validators/verification-summary.md`；
  原始输出见同目录 `results/verification-output.txt`（实测为 UTF-8 纯文本，不是 UTF-16LE）。
- 代码有变更（`schema/framework-map.schema.json`、`scripts/check-map.js`、`scripts/test-check-map.js`、`docs/specs/framework-map-contract.md`、`package.json`），
  但本 feature 在 harness 接入前就已执行完，未留下独立 subagent 审查记录；补偿方式见 `subagent-review.md`。
- 转为 `passing` 之前需要：用户验收记录 + F06 侧的修复后回归记录 + `knownUnverified` 与 `humanReviewRequired` 清空。
