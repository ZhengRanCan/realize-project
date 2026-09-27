# F05 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | —（F05 明确不产出 schema / `check-map`，当时没有静态校验层） | no | 见 `verification-summary.md` 的说明；结构自查代替了该层 |
| L2 feature | 命令行未记录（历史材料只留下输出）：Fixture B / C 各一张图的 Framework Map invariant + Navigation invariant 自查 | yes | `docs/log/artifacts/F05-l0-generalization-gate/results/verification-output.txt`（B：12 元素 / 6 边 / 5 侧挂 / 5 topics；C：12 元素 / 8 边 / 4 侧挂 / 6 topics；Hard Error 0 · Warning 2） |
| L3 system | 同上，与 Fixture A 同口径的跨文档类型自查（含 section 粒度的 N2 / N3 与 `meta.validationGranularity` 标注） | yes（`l3: required`） | 同上（结果：Hard Error 0 · Warning 2；说明栏写明 section 粒度不可与 A 的 sourceUnit 粒度混算） |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F05-l0-generalization-gate/verification-summary.md`（2026-09-27 由主 agent 收口执行，结果 passed） |

> ⚠️ 结构自查的命令行没有留在历史材料里（`results/verification-output.txt` 只有输出，`brief.md` / `execution-prompt.md` 也未记录调用方式）。
> 这里照实登记为「命令行未记录」，不补写命令。
> 该输出里的 map 路径是**规范化之前**的记录：`docs/features/05-l0-generalization-gate/drafts/fixture-b.map.json` 与
> `fixture-c.map.json`，照实引用、未改写。

## Manual paths

- [ ] 用户在 `validation-checklist.md` 上逐项复核 F05，并明确回一句 `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT` —— **未做**：
  清单 §1~§8 共 10 组检查项在历史材料里全部为空勾选，`legacy-feature-registry.md` 只记 Executed（Gate = PASS，待验收）。
- [ ] 用户单独回一句 `Gate = PASS` / `Gate = FAIL`（Feature 06 的开工条件）—— **未做**；执行方结论为 `Gate = PASS`
  （`results/phase2-generalization.md`），尚待用户追认。
  （旁证：F06 在流程上已按 `Gate = PASS` 继续推进，`docs/log/artifacts/F06-contract-and-validators/brief.md` 与
  `execution-prompt.md` 都引用了这一结论 —— 但这不能替代用户验收。）
- [ ] 确认「三种拓扑各自成立」这一结论：A 链 + 侧挂 · B 严格交替链（artifact / process）+ 侧挂 · C 分叉 DAG + 不对称分支
  —— 有 `results/rule-matrix.md` R3 / R8 与 `results/overfitting-check.md` 的证据，但**用户未判定**。
- [ ] 确认「Framework Map 是否必须存在单一主轴」的实测答案（不必须）以及据此对 03 §3.3 的 5 处回写是否被接受 —— **未判定**。
- [x] 溯源结构化自查（`validation-checklist.md` §2 的 F1）：B / C 共 24 个元素的 `sectionRefs` 全部非空且指向真实小节
  （`results/verification-output.txt` 的 F1 行）。
- [ ] `validation-checklist.md` §2 要求的「**抽查 2 个元素**回到原文对应小节核对（防编造溯源）」的**人工抽查记录**没有留下
  —— 只有上面的结构化自查，`results/` 里没有逐元素原文比对记录。
- [x] 事后交叉复核（**不是 F05 自身证据**）：F09 用 `scripts/check-map.js` 复核同样两张图，HARD ERROR 0、
  relationGap 1（B）+ 2（C），与 `results/rule-matrix.md` R4 的 3 处 Relation gap 一致
  （`docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt`）。

## Passing evidence

- 命令日期与结果记录在 `docs/log/artifacts/F05-l0-generalization-gate/verification-summary.md`。
- 本 feature **没有代码变更**（只改 `docs/`：两张图、四份结论文件，以及 03 规格的 5 处回写），
  且在 harness 接入前就已关闭，没有独立 subagent 审查记录；原因与可复核位置见
  `docs/log/artifacts/F05-l0-generalization-gate/subagent-review.md`。
- 本 feature 现在标为 `blocked`：`completionGate.humanReviewRequired` 列出用户尚未记录的验收判定与 4 个实质待判问题，
  `completionGate.knownUnverified` 列出 Capacity gap、3 处 Relation gap、R8「单一主轴」结论范围、provisional 粒度、
  选型局限、第二类过拟合经历与证据缺口。这些都必须在转 `passing` 之前关闭或由用户显式接受。
