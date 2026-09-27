# F07 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node scripts/test-generate-framework-map.js` | yes | `docs/log/artifacts/F07-ai-framework-map-generation/results/gateway-safety-output.txt`（Gateway 安全验证 33/33 通过；离线 stub，零模型调用） |
| L2 feature | `node scripts/generate-framework-map.js --fixture a` | yes | `docs/log/artifacts/F07-ai-framework-map-generation/results/phase2-smoke-test.md`（工程链八步全 true、`repair: none`、无 `.tmp.json` 残留；该次参数偏差 `max_tokens = 32000` 已记录） |
| L2 feature | `scripts/check-map.js`（由 generator 在每次 run 内真实执行） | yes | `docs/log/artifacts/F07-ai-framework-map-generation/results/run-matrix.md` §1 / §2（16/16 `HARD 0`、`N1~N3` 无 SKIPPED 段） |
| L2 feature | `node tmp/verify-f07-phase3.js` | yes | `docs/log/artifacts/F07-ai-framework-map-generation/results/phase3-artifact-check.txt`（全部通过：产物完备、参数一致、sha 一致、无残留、无修补） |
| L3 system | `node scripts/generate-framework-map.js --fixture {a..e}`（15 次正式调用） | yes（`completionGate.l3 = required`） | `docs/log/artifacts/F07-ai-framework-map-generation/results/run-matrix.md` + `results/final-gate.md`（Technical 15/15 PASS、Semantic 0/15） |
| L3 system | 人工语义判读（Phase 4 · Q2 / Q4 / Q5，非命令） | yes | `docs/log/artifacts/F07-ai-framework-map-generation/results/semantic-review.md`、`results/stability-analysis.md` |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F07-ai-framework-map-generation/verification-summary.md` |

> 本 feature 为 `blocked`：上表命令全部有记录，但语义维度（Q2）没有通过，因此命令证据齐备**不等于**可以标 `passing`。
> 上表的 `check-map` 行不是独立 CLI 调用，而是 generator 通过 `runValidator()` 在每次 run 内执行并落盘 `check-map.txt`
> （`results/gateway-safety.md` §4 记录了 `renderReport()` 的抽出方式）。

## Manual paths

- [x] Phase 4 人工读原文语义判读（Q2 Semantic Faithfulness）：5 篇 fixture × 3 run 逐 run 判 element / edge /
      provenance 是否真来自原文，结论 **Semantic PASS 0/15**（PARTIAL 5 / FAIL 10），由执行方完成并落盘
      `results/semantic-review.md`。
- [x] Validator Gaming 独立判定（§12，`check-map = PASS` 也要查）：命中预设五类中的 ①③④⑤，另有两类预设外形式
      ⑥⑦；命中 run 一律判 Generation Quality FAIL，判据只基于产物形态（`results/final-gate.md` §2）。
- [x] Q4 / Q5 稳定性判读：每篇 fixture 的 Semantic Anchors 由人工分析建立、**从未进入 prompt**，逐 run 给出 `n/3`
      与 topology class，并专门回答 D 是否被压成链（否）与 E 是否只留 happy path（未退化成纯 happy path，但失败路径 0/3 建模）
      （`results/stability-analysis.md` §1 / §2.2）。
- [ ] 用户（reviewer）尚未按 `validation-checklist.md` 逐条签署验收（ACCEPT / ACCEPT WITH NOTES / REJECT），
      也未单独回一句 Gate 判定 —— 材料已给出 `Gate = PARTIAL PASS`，但判定栏为空；`legacy-feature-registry.md`
      第 07 行 Completed 栏为「-」。
- [ ] Phase 2 `results/phase2-smoke-test.md` §5 提出的 `max_tokens` 裁决（约定 `8000` 与 `deepseek-flash` 的推理占比
      不兼容）在材料中没有留下用户明确裁决记录；Phase 3 实际按 `max_tokens = 65536` 执行，该决定缺少书面确认。

## Passing evidence

- 本 feature 是 `blocked`，`completionGate.knownUnverified`（Semantic PASS 0/15、E 类机制退化、`§14` 条件 6/8/9 未满足、
  Validator Gaming 命中、relationGap 漏登、意图 UNCLEAR）与 `humanReviewRequired`（用户未签署验收、max_tokens 裁决缺书面确认）
  均非空；这两组条目就是「卡在哪」的完整清单。
- 命令日期与结果记录在 `docs/log/artifacts/F07-ai-framework-map-generation/verification-summary.md`。
- 代码有变更（`scripts/generate-framework-map.js`、`scripts/test-generate-framework-map.js`、`scripts/check-map.js`、
  `ai/framework-map-generation.prompt.md`），但本 feature 在 harness 接入前就已执行完 Phase 1–4，未留下独立 subagent 审查记录；
  补偿方式见 `docs/log/artifacts/F07-ai-framework-map-generation/subagent-review.md`。
- 若要改为 `passing`，必须先关闭 `knownUnverified` 的语义维度与 `humanReviewRequired` 的用户验收 —— 两者都需要新的实验与用户决策，
  不是补一条命令证据可以解决的。
