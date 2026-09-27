# F09 Independent Review

- Status: `not_recorded`
- Reason: F09 在 harness 接入之前（2026-09-26）就已关闭。`results/repair-round.md` 记录的是**用户指令驱动的修复轮**（R1–R8），
  不是独立 subagent 审查：其开头写的是"依据：用户对 `rule-adjustments.md` 的裁决"，
  其 §7「关闭裁决（用户确认，Feature 09 = Closed）」给出的是**用户复核后的裁决**，而不是某个独立审查者的报告。
  当时的独立审查路径是**用户复核**（依据 `validation-checklist.md` 逐项核对，并在 `legacy-feature-registry.md` 记为
  `09 contract-adversarial-test | Completed / Closed（Gate = PASS）| Reviewer 用户 | Completed 2026-09-26`）；
  没有留下独立的 subagent 审查记录。
- Decision: 本 feature 的 `passing` 状态**不**依赖 subagent 审查，而是依赖用户裁决 + `verification-summary.md` 的命令证据。
  这条偏差在此显式登记，避免后续把它误当成"已完成独立审查"。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 资格审查（v1 的两个 `NO QUALIFIED FIXTURE` 结论） | `results/fixture-selection-d.md` · `results/fixture-selection-e.md` |
| 标准修订为 v2 及完整重跑（D / E 双 QUALIFIED） | `results/fixture-selection-v2.md` |
| E 的单文档口径复核（外部证据全部撤回，改用文档自身 L418） | `results/fixture-e-single-document-reverification.md` |
| 两份 candidate map（candidate，不是 Gold） | `drafts/fixture-d.map.json` · `drafts/fixture-e.map.json` |
| mutation 运行器（可复现）与拦截率 | `drafts/build-mutations.js` · `results/mutation-output.txt` |
| 四类观察 + mutation + topology + Gate（§7 为修复轮复测与最终判定） | `results/adversarial-report.md` |
| F06 逐条规则的升降级建议及其实测证据 | `results/rule-adjustments.md` |
| 修复轮 R1–R8 的"裁决 → 执行"对照、复测证据与最终 Gate | `results/repair-round.md`（§0 对照表 · §1.3 复测 · §4 汇总 · §7 关闭裁决） |
| 全部 check-map / 单测 / heading tree 输出 | `results/verification-output.txt` |
| 验收判据（Gate 四条、红线、最终判定栏） | `validation-checklist.md` §8 / §9 |
| 关闭日期与 reviewer 记录 | `docs/log/artifacts/legacy-feature-registry.md`（09 行） |

## Reviewer 视角下最需要留意的三点

1. **修复轮改动了 F06 的产物**：R1（heading tree）、R3（`qualifiers` + H8 / W7）、R6（`W4 → I6`、`W8`）落在
   `scripts/check-map.js`、`schema/framework-map.schema.json`、`scripts/test-check-map.js`（21 → 29 用例）。
   复核 F09 的结论必须使用修复后的校验器版本；`legacy-feature-registry.md` 的 06 行已注明这些改动来自 F09。
2. **"机制上已能表达"不等于"实测关闭"**：B / C 的 candidate map 尚未按新 Contract 重表达，
   因此 C 的"持有 / 存储"缺口不能算实测关闭（`repair-round.md` §7.3）。
3. **v2 的 fixture selection 不是独立的**：候选池在 v1 阶段已被观察过，本轮的 `QUALIFIED` 对建模阶段有效，
   但不能当作"完全独立的选型证据"；需要时另加外部 holdout fixture（`brief.md` §3.4、`fixture-selection-v2.md` §3）。

这三点都不改变 F09 的验收结论（用户已裁决 `Gate = PASS` 并关闭），但会影响后续 feature 对同一份 Contract / 校验器与
B / C 产物的复用判断。
