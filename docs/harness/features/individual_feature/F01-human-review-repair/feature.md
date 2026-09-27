---
id: F01
title: Human Review Repair
version: v0.1
status: passing
dependsOn: []
scope: {"code":["scripts/backfill-overview-blocks.js","scripts/backfill-overview-plan.js"],"tests":[],"docs":["fixtures/context-consumption.json","fixtures/context-consumption.overview-plan.json","docs/log/artifacts/F01-human-review-repair/**"]}
evidence: {"lastVerifiedAt":"2026-09-26","commands":[{"command":"npm run validate","result":"passed"},{"command":"npm run audit","result":"passed"},{"command":"npm run test:plan","result":"passed","note":"22 个用例全部通过"},{"command":"npm run test:block","result":"passed","note":"31 个用例全部通过"},{"command":"npm run check-overview","result":"passed-with-warnings","note":"Failures 0；Core 75/75、Supporting 12/12、Provenance 151/151；Warnings 17+1 条已解释"},{"command":"npm run check-plan","result":"passed-with-warnings","note":"PASS WITH WARNINGS，warnings 为既有结构提示，非本轮引入"},{"command":"npm run verify-preview","result":"passed"},{"command":"npm run selftest","result":"passed"},{"command":"npm run verify:harness","result":"passed"}],"manualSmoke":"人工按 validation-checklist.md 走完四段阅读流、Source 回查与只看图答题；legacy-feature-registry.md 记录为 Completed（reviewer 用户，2026-09-26）"}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Preview 中只看图回答「Current 比 Target 多出的关键路径是什么？」，答案应为「scene 可以直接读取 Frozen Context」"],"integrationEvidence":["npm run verify-preview（真实 renderer 渲染 4 段 / 21 个 block / 42 个 Source 标签）","npm run selftest（Electron 真实渲染进程内跑通 import → 两页渲染 → 审批 → 保存 → Gate）"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F01 Human Review Repair

## Goal

修掉 Stage 2 Full Run 人工验收发现的 6 个问题，且不扩大自动化体系范围：3 个确定性修复（O-15 标题与内容、
O-10b 默认折叠、O-16 移入 prove 段）、2 个 sourceUnit 拆分（O-08、O-05）、1 个视觉拓扑问题（O-04）。
修复后 core coverage、provenance 仍为 100%，Hard Error 为 0，Preview 正常渲染。

## Process preconditions

- Stage 2 Full Run 已完成（21/21 blocks、coverage 100%、provenance 100%、0 Hard Error），问题清单由此产生。
- `scripts/backfill-overview-blocks.js` + `backfill-overview-plan.js` 是 fixture 与 plan 的唯一生成路径；
  只改 fixture 不改脚本会导致 plan 不同步（本轮实际踩到，见 `results/review-notes.md` §2.4）。

## Scope

### Allowed changes

- 3 项确定性数据修改（O-15 标题与 item 数、O-10b `defaultExpanded`、O-16 `stage` 与段内顺序）。
- 受影响 block 的 sourceUnit 拆分与 `covers` 调整（O-05、O-08，含由此重跑的 O-10b / O-11）。
- O-04 的拓扑表达（方案 A：主干 + `tier: secondary` 缩进旁支，不改 renderer）。
- 保证 fixture 与 plan 同步的上游脚本修正及其自检口径修正。

### Out of scope

- 不接 Electron 主流程、不进 Phase 3 源码分析、不使用 Stage 1 generated plan。
- 不新增 shape 词汇、不改 `schema/*.json`、不改 `app/renderer/*`。
- 不为消除 warning 重跑全部 block，不做 AI-as-Judge。

## Acceptance Criteria

- [x] Phase 1 三项确定性修复完成，plan 与 fixture 一致（O-15 标题与 items 实测 8 + 5；O-10b `defaultExpanded: false` 且内容未变；O-16 `stage: prove` 且 prove 段顺序为 O-09, O-16, O-10, O-10b, O-10c, O-11, O-11b）。
- [x] Phase 2 两项 sourceUnit 拆分完成，无 coverage hole，Receipt / Availability / Consumption 三级语义边界分开。
- [x] Phase 3 给出结论并落地：O-04 用「主干 + 缩进旁支」表达双路径，未改 renderer。
- [x] `npm run check-overview` 无 Failure，Core coverage 75/75、Supporting 12/12、Provenance 151/151。
- [x] `npm run verify-preview` 与 `npm run selftest` 通过，四段阅读流与 Source 回查在真实 renderer 中可用。
- [x] 用户按 `validation-checklist.md` 验收并把本 feature 记为 Completed（2026-09-26）。

## Risks and compatibility

- **混合 prompt 版本的产物**：18 个 block 用 Full Run 的 prompt（`980bb05f…`），6 个 block 用本轮修正后的 prompt
  （`31c421cb…`）。因此 `experiments/stage2-full/overview.generated.json` 不是单次同构运行的产物；用户接受为
  ACCEPT WITH NOTES，未做单次同构重跑（成本约 20–40 分钟）。
- **O-16 的 request 日志不可恢复**：上游连续 503 导致失败尝试覆盖 `request.json`，而 `experiments/` 当时不在 git 跟踪范围内。
  产物已显式标注 `artifactStatus: "content-from-earlier-run"`；影响面仅限实验可复现性。
- **warnings 仍存在（17 条重复类 + 1 条密度类）**：复算确认跨 block 重复为 0，属 `check-block` 启发式口径问题，
  不是内容缺陷；阈值调整不在本轮范围。
- **同类覆盖缺口可能仍存在**：O-05 的根因是 Gold Plan 覆盖缺口（plan 要求画三级链路却没给三级定义），
  其它跨章节综合块（如 O-16、O-14）未做系统排查。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F01-human-review-repair/verification-summary.md`
- Independent review: `docs/log/artifacts/F01-human-review-repair/subagent-review.md`（harness 接入前关闭，未留下独立审查记录；已记录补偿方式）
- 历史材料: `docs/log/artifacts/F01-human-review-repair/{brief.md,execution-prompt.md,validation-checklist.md,results/**}`
