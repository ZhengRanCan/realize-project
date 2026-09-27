# F10 Independent Review

- Status: `not_recorded`
- Reason: F10 在 harness 接入之前（2026-09-26）就已关闭。当时的审查路径是人工 reviewer（用户）按
  `validation-checklist.md` 判定 Gate 四档，并在 `docs/log/artifacts/legacy-feature-registry.md` 中记为
  `Completed / Closed（Gate = PARTIAL PASS）`；**没有留下独立的 subagent 审查记录**。
  本 feature 确实有代码变更（`scripts/run-semantic-grounding.js`、`scripts/test-semantic-grounding.js`、
  两份 prompt、两份 generation schema），按 harness 口径本应有一条独立审查，但它不存在 —— 不伪造审查结论。
- Decision: 本 feature 当前的 `blocked` 状态**不**依赖 subagent 审查，而是依赖 (1) `results/final-gate.md` 的
  人工审计与 Gate 结论、(2) 用户 2026-09-26 的归档记录、(3) 命令证据（`npm run f10:run` / `npm run test:grounding` /
  `npm run verify:harness`）。这条偏差在此显式登记，避免后续把它误当成「已完成独立审查」。
- 一并说明：即使事后补做独立审查，也无法改变 gate 结论 —— F10 的阻塞点是 **D 侧基础关系 E3 未关闭** 与
  **PARTIAL PASS 的处置未登记**，属于用户裁决项，不是代码缺陷。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 设计意图、四段归因 E1–E5、四层 coverage、Gate 四档定义 | `docs/log/artifacts/F10-semantic-grounding/brief.md` §3–§6 / §11 |
| 任务书与硬约束（红线：不改 Contract / check-map / budget 12 / 不重跑到好看） | `docs/log/artifacts/F10-semantic-grounding/execution-prompt.md` |
| Phase 0 Prompt Parity Audit（25 条规则 · 5 个真缺口 P1–P5 · 5 段补丁） | `results/prompt-parity-audit.md` |
| Stage A 6 次实录（预算截断、转义失败、粒度漂移 1.9×） | `results/stage-a-reliability.md` |
| E×1 诊断与预算发现（Selection 压力生效 · run-04 零 content） | `results/e1-diagnostic.md` |
| E 的 Stage B 复现（run-05 13 · run-06 13 · run-07 截断） | `results/e-repro-analysis.md` |
| D 回归与用户裁决（基础关系被降级为约束 → E3 未关闭） | `results/d1-regression.md` §2–§4.2 |
| E5 over-representation 的首次实证（81 elements / 154 条全 represented） | `results/selection-analysis.md` §0 |
| 成本实验与 low 判决（low 不设为默认） | `results/cost-experiment.md` · `results/low-effort-verdict.md` |
| Phase 3 人工审计、悬案裁决、Gate 结论与局限 | `results/final-gate.md` §0–§10 |
| 验收判据（**未签署**，判定栏空白） | `validation-checklist.md` |
| 用户归档记录（10 semantic-grounding = Completed / Closed，2026-09-26） | `docs/log/artifacts/legacy-feature-registry.md` |
| 命令证据与偏差登记 | `docs/log/artifacts/F10-semantic-grounding/verification-summary.md` |

## Reviewer 视角下最需要留意的三点

1. **PARTIAL PASS 的处置仍空着**：用户把 feature 记为 Completed / Closed，但没有登记「接受 D 侧基础关系退化并转为
   已知限制」还是「保留为未关闭项」。`docs/progress.md` 因此记为「E3 未关闭（Gate = PARTIAL PASS）；处置未登记」。
   在这条被写下之前，任何后续 feature 都不能假设 D 类文档的关系层是完整的。
2. **low effort 的两个样本各自复现退化**（`state` 2/2 消失、状态机被压平 2/2、run-11 静默丢掉 bounded failure），
   所以「省 61–80%」不是可以直接设为默认的理由；同时 `stage-a-reliability.md` §2.1 关于「收紧 `max_tokens` 不可行」
   的结论依赖「该端点的 `max_tokens` 同时覆盖 reasoning 与 content」这一前提，前提变了结论就要重估。
3. **Stage A 的独立评价从未单独落盘**：`results/inventory-review.md` 仍是模板（「未开始」），
   因此「Inventory 抽出来的东西原文真的说了吗 / 粒度是否合适」只有零散结论；另外原定的 `D × 3 + E × 3` 六个 run
   没有按计划完成（D 只有 1 个完整两阶段 run）。这两点限制 F10 结论的强度，但不改变 Gate 结论。
