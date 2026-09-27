# F05 Independent Review

- Status: `not_recorded`
- Reason: F05 在 harness 接入之前（2026-09-26）就已执行完毕并关闭。当时的独立审查路径是人工 reviewer（用户）
  按 `validation-checklist.md` 逐项判定；`legacy-feature-registry.md` 只记为
  `Executed（Gate = PASS，待验收）`，Completed 列为 `-`，没有出现 reviewer 的判定语句，
  也没有留下任何独立的 subagent 审查记录。
- Decision: 本 feature 的结论（含 `Gate = PASS`）**不**依赖 subagent 审查，而是依赖
  `results/**` 的四份结论文件与结构自查输出。这条偏差在此显式登记，避免后续把它误当成"已完成独立审查"。
- 补充：F05 在 harness 接入后仍停在 `blocked`，等待用户在 `validation-checklist.md` 上补记验收判定，
  因此这里也不适合替用户补写审查结论。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 结构自查原始输出（B / C 各 12 元素 · Hard Error 0 · Warning 2） | `docs/log/artifacts/F05-l0-generalization-gate/results/verification-output.txt` |
| R1~R8 的逐条结论与证据（★ 主要交付物） | `docs/log/artifacts/F05-l0-generalization-gate/results/rule-matrix.md` |
| 每个不适配项的 gap 归类与理由（含新提的 Capacity gap） | `docs/log/artifacts/F05-l0-generalization-gate/results/gap-classification.md` |
| Q1~Q3 答复、`Gate = PASS` 结论、Phase 2b 计划 | `docs/log/artifacts/F05-l0-generalization-gate/results/phase2-generalization.md` |
| 两类过拟合检查 + 第三类粒度混算自查 | `docs/log/artifacts/F05-l0-generalization-gate/results/overfitting-check.md` |
| 验收清单（10 组检查项全部为空勾选，判定栏缺失） | `docs/log/artifacts/F05-l0-generalization-gate/validation-checklist.md` |
| 状态记录（Executed（Gate = PASS，待验收）· Completed = -） | `docs/log/artifacts/legacy-feature-registry.md`（当前 Features 表 `05` 行） |
| 三张对照图：A（复用 F04）· B · C | `docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json`、`docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-b.map.json`、`drafts/fixture-c.map.json` |
| 事后用契约校验器复核这两张图（HARD 0） | `docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt` |
| 相邻的独立审查记录（F03 侧登记了 F05 带回的 Capacity gap，并注明"规则是否放宽仍未裁定"） | `docs/log/artifacts/F03-hierarchical-architecture/subagent-review.md`（第 29~30 行） |

## Reviewer 视角下最需要留意的四点

1. **`Gate = PASS` 带了明确的范围声明**：结论只覆盖 A / B / C 三篇，"成立"一律读作
   Supported across current A/B/C fixtures，不是 universal / 已证明完备（`rule-matrix.md` 开头的证据范围声明）。
   复核时不要把它当成 ontology 完备性的证明。
2. **两处未关闭的门禁项**：Capacity gap（三篇全部 12/12、B / C 只剩 2 条 constraint）与
   3 处 Relation gap（是否补第 9 个关系词）都只到"记录在案"这一步，处置交给契约层面，
   至今没有裁定。见 `gap-classification.md` §2、`rule-matrix.md` R4 / R5。
3. **粒度是 provisional**：B / C 用小节粒度，A 用 sourceUnit 粒度，两者不可混算；
   section 粒度下 N2 与 N3 会合并，因此 R7 的 PASS 只到小节级别，Feature 07 产出 sourceUnits 后需要回测。
4. **两处过程性问题**：第二类过拟合（把"主轴 + 侧挂"当必要形态）在设计 C 的前两版里真实发生过，
   靠文档原句纠正；Fixture B 不是实体关系文档，Q1 的结论只对数据变换 / 协议规范类成立。
   这两条都不改变 Gate 结论，但会影响后续 feature 对同一份结论的复用判断。

以上四点都不改变 F05 已有的技术结论，但它们是用户验收时真正需要拍板的内容
（对应合同 `completionGate.knownUnverified` 与 `humanReviewRequired`）。
