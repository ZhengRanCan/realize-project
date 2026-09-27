# F09 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-d.map.json` | yes | `docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt`（路径为规范化前记录；结果：HARD 0 · WARN 2 · INFO 3 · coverage 21/21 · SKIPPED 0 · 状态 PASS） |
| L1 static | `node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-e.map.json` | yes | 同上（路径为规范化前记录；结果：HARD 0 · WARN 3 · INFO 7 · coverage 11/11 · 状态 PASS，`W1` 因 13 > 预算 12） |
| L1 static | `node scripts/check-map.js --map …（A / B / C 三篇基线）` | yes | 同上 §1（A/B/C 均 HARD 0、状态 PASS；粒度不同，数字不得合并） |
| L1 static | `node scripts/check-map.js` 的 heading tree 解析（D / E / B / C 四篇文档） | yes | 同上 §2（fixture-e `sectionLevel 2` · top 11；fixture-d `sectionLevel 2` · top 21） |
| L2 feature | `node scripts/test-check-map.js` | yes | 同上 §3（`29 passed, 0 failed`；含 heading tree ×2、`qualifiers` ×4、relationGap 聚合 ×2） |
| L2 feature | `node docs/log/artifacts/F09-contract-adversarial-test/drafts/build-mutations.js` | yes | `docs/log/artifacts/F09-contract-adversarial-test/results/mutation-output.txt`（命令见 `drafts/build-mutations.js` 的用法注释；结果：拦截率 14/14 = 100%） |
| L3 system | 五篇 Fixture 全量复测（同一轮 check-map 运行覆盖 A/B/C/D/E） | yes（`l3: required`） | `docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt` §1 + `results/repair-round.md` §4（A/B/C/D/E 全部 HARD 0 · `PASS`；粒度纪律：A = sourceUnit，B/C/D/E = section (provisional)） |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F09-contract-adversarial-test/verification-summary.md` |

## Manual paths

- [x] Fixture D / E 原件由用户提供，SHA256 已登记，原文未被修改一个字节（`results/adversarial-report.md` §0）。
- [x] 两篇 QUALIFIED 后按现行 Contract 生成 candidate map，未为了让图"好看"人为串主轴、未把 E 压成 happy-path（`results/adversarial-report.md` §0 / §4）。
- [x] 人工审计项 M7（强行串联两个无关节点）：validator 判不出来是设计如此（属 semantic rule），作为审计者的测试项记录，不计入拦截率（`results/mutation-output.txt` 末行、`results/repair-round.md` §1.3）。
- [x] 复核修复轮 R1–R8 的执行与复测结果，并给出裁决：**F09 = Completed / Closed（`Gate = PASS`）**，同日解除 Feature 07 的 Blocked → `Ready`。
- [x] 由用户在 2026-09-26 判定（复核对象为 `validation-checklist.md` §9 的 Gate 四条与最终判定栏；结果记录在 `results/repair-round.md` §7 与 `legacy-feature-registry.md` 的 09 行）。
- [x] 确认三条被冻结的边界判断：`relationGap` 保留 2 不追求归零、"每 Goal/date 至多一条 DailyReview"不进 `relationGap`、`W8` 不为 D 触发（`results/repair-round.md` §7.1）。

## Passing evidence

- 命令日期与结果记录在 `docs/log/artifacts/F09-contract-adversarial-test/verification-summary.md`；原始输出见同目录 `results/verification-output.txt` 与 `results/mutation-output.txt`
  （两份文件在本仓库中为**明文 UTF-8**，按规格 §6.2 给出的两种读法都能读；其中路径是**规范化前**的 `docs/features/09-contract-adversarial-test/...`，照实引用并在 `feature.md` 的 `note` 里注明）。
- 代码有变更（`scripts/check-map.js`、`scripts/test-check-map.js`、`schema/framework-map.schema.json`），但本 feature 在 harness 接入前就已关闭，
  未留下独立 subagent 审查记录；当时的独立审查路径是用户复核与裁决，补偿方式见 `docs/log/artifacts/F09-contract-adversarial-test/subagent-review.md`。
- 本 feature 标为 `passing` 时，`knownUnverified` 与 `humanReviewRequired` 均为空。
