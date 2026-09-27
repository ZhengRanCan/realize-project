# F05 Verification Summary

本文件把 harness 接入前的验证记录整理成当前口径。原始材料保持原样，见
`results/rule-matrix.md`、`results/gap-classification.md`、`results/phase2-generalization.md`、
`results/overfitting-check.md`、`results/verification-output.txt`。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| 命令行**未记录**：Fixture B / C 各一张 L0 图的结构自查（F04 同口径的 Framework Map invariant + Navigation invariant） | 2026-09-26 | passed-with-warnings | 输出存于 `results/verification-output.txt`：Hard Error 0 · Warning 2（B / C 的 `constraint` 都只有 2 条，超出 3~5 区间）。输出里的 map 路径为**规范化前**记录：`docs/features/05-l0-generalization-gate/drafts/fixture-b.map.json` / `fixture-c.map.json` |
| `npm run verify:harness` | 2026-09-27 | passed | 由主 agent 在收口时统一执行（历史材料里没有这条输出） |

> 结构自查的命令行在任何历史材料里都找不到，因此照实登记为「未记录」，不补写命令、不重跑测试。
> 日期取 F05 的执行日 2026-09-26（`git log`：`c5b3326` / `c50cfdf` 均为 2026-09-26；`brief.md` §10 记创建时间 2026-09-26）。

## 关键指标（来自 `results/verification-output.txt`）

| Fixture | 元素 | 边 | 侧挂 | Topics | 无 element 的 Topic | type 分布 |
| --- | --- | --- | --- | --- | --- | --- |
| B（Data Model heavy，顶层 §1~§13 / 子节 22） | 12 / 12 | 6 | 5 | 5 | T-01 | artifact 5 · process 3 · constraint 2 · component 1 · concept 1 |
| C（Process / Operational heavy，顶层 §1~§19 / 子节 16） | 12 / 12 | 8 | 4 | 6 | T-06 | artifact 6 · process 3 · state 1 · constraint 2 |

- 两篇都通过：F1 溯源非空且指向真实小节 · F2 ≤ 12 · type 全在词表内 · edge 词表封闭（B 用 `consumes`/`produces`；C 用 `contains`/`consumes`/`produces`/`depends-on`/`validates`）· 未使用兜底词 `relates-to` · 主轴只有 process / artifact · 判据 B 12/12 至少参与一条 edge 或 attachment · 判据 F（12 个 label 唯一）· 侧挂完整。
- Navigation：B 的 N2/N3 顶层 §1~§13 全部有入口（文档级 1 节 + Topic 12 节）；C 的 §1~§19 全部有入口（文档级 1 节 + Topic 18 节）。
- 两篇都标注 `meta.validationGranularity = "section (provisional)"`，并注明 section 粒度下 N2 与 N3 合并为同一件事。
- **结果：Hard Error 0 · Warning 2。**

## 规则矩阵结论（`results/rule-matrix.md`）

| # | 规则 | 结论 |
| --- | --- | --- |
| R1 | 六类 element vocabulary | 成立（三篇都没有 Semantic gap；"成立"只读作 Supported across current A/B/C fixtures） |
| R2 | `type` + `role` 两层机制 | 成立（2 处拉伸：`semantic-level` 只有 A 用；C 的状态机被压成一个 `state` 节点） |
| R3 | edge / attachment 区分 | 成立（三篇都把非 process/artifact 挤出了主轴） |
| R4 | relation vocabulary（8 词） | 有条件成立（3 处 Relation gap；主动语序与封闭性三篇都成立） |
| R5 | ≤ 12 element 容量原则 | 有条件成立（A / B / C 全部 12/12，流水线越长留给 constraint 的位置越少） |
| R6 | Topic synthesis | 成立（B / C 各自然产生一个"只有内容、没有 element"的 Topic：T-01 / T-06） |
| R7 | Framework / Navigation coverage 分离 | 成立（强证据；但 section 粒度下 N2 与 N3 合并，只证明到小节级别） |
| R8 | `framework-map` 表达模型 | 有条件成立（"必须有单一主轴"**不成立**：C 是分叉 DAG + 不对称分支） |

汇总：**无一判为「不成立」；无一处需要新增第 7 类元素或第 9 个关系词。**

## Gap 汇总（`results/gap-classification.md`）

```text
Semantic gap   0 条（当前 3 个 Fixtures 中未观察到，≠ 已证明六类完备）
Relation gap   3 条（B 的逐字节一致；C 的 Inbox 持有 Candidate；C 的校验通过后放行）
Navigation gap 1 条（A，已在 Feature 04 修复）
Layout gap     1 条（role 粒度不足以区分流水线不同阶段的 process）
Capacity gap   5 条（新提的第 5 类：类型与关系都对，只是 ≤12 的位置不够）
建议扩 ontology 的项：0 条
```

## 人工路径证据

- **没有**。`validation-checklist.md` 的 §1~§8 共 10 组检查项在历史材料里全部为空勾选，
  `results/` 里没有 reviewer 判定、也没有执行方自评文件（如 `review-notes.md`）。
- `legacy-feature-registry.md`（第 63 行）只记为 `Executed（Gate = PASS，待验收）`，Completed 列为 `-`。
- 因此本 feature 的 `status` 为 `blocked`，待判问题逐条写在合同的 `completionGate.humanReviewRequired` 里。

## 已知偏差（不阻塞证据整理，但阻塞 `passing`）

- **Capacity gap 未裁定**：三篇全部顶到 12/12，B / C 图上都只剩 2 条 constraint；R5 只到「有条件成立」，
  是否放宽容量或允许 `constraint` 不占配额仍未决定（`gap-classification.md` §2 只写"建议供后续讨论"）。
- **3 处 Relation gap 悬置**：本次只记录不补词，理由是补词会影响 A 的既有产物（`rule-matrix.md` R4）。
- **R8 的结论范围**：「必须有单一主轴」不成立只在 A / B / C 上取得，且 C 的形态是分叉 DAG，
  与"实体关系图"这个当初猜测的形态不同。
- **粒度不可混算**：B / C 是 section (provisional)，A 是 sourceUnit（87 条）；本 feature 未合成任何跨粒度百分比
  （`overfitting-check.md` 第三类自查确认）。
- **选型局限**：B 是"字节级规范化规范"而非实体关系模型，Q1 只对数据变换 / 协议规范类文档成立；
  真 ER / Schema 演进文档与纯 runbook 未测（Phase 2b 的 Fixture D / E 未执行）。
- **第二类过拟合在过程中发生过**：设计 C 的前两版都把两个分支压成单链，靠文档原句纠正；最终产物未过拟合，
  但已记为遗留教训（`overfitting-check.md`）。
- **证据缺口**：`results/verification-output.txt` 没有命令行原文；两张图的 `sectionRefs` 只有结构化自查，
  `validation-checklist.md` §2 要求的"抽查 2 个元素回原文核对"没有留下人工记录。
- **回写了已冻结的架构文档**：`docs/log/artifacts/F03-hierarchical-architecture/brief.md` 的 5 处
  （§3.3 分叉 DAG + 不要默认串成链 · §5.3 判据 E 容量偏紧 · §5.5「3~5 条」标注为 Fixture A 经验值 ·
  §11.1.1 补第 5 类 Capacity gap · §14 去掉「Process-heavy 使 L0 退化成流程图」风险行）需要用户在验收时一并确认。

## 事后交叉复核（**不是 F05 自身证据**）

- F06 / F09 用 `scripts/check-map.js` 复核了同样两张图（规范化前路径 `docs/features/05-l0-generalization-gate/drafts/fixture-b.map.json`、
  `fixture-c.map.json`）：两篇都 `状态: PASS`、**HARD ERROR 0**，
  B 有 WARN 1（relationGap E-10 ⇢ E-09），C 有 WARN 2（relationGap E-02 ⇢ E-01、E-07 ⇢ E-06），
  与 `rule-matrix.md` R4 的 3 处 Relation gap 一一对应。
  原始输出：`docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt`。

## Harness layer

- `npm run verify:harness`：2026-09-27 由主 agent 收口执行，结果 `passed`（本 feature 为 `blocked`，
  该命令不是 `passing` 的前置，只是 harness 层记录）。
