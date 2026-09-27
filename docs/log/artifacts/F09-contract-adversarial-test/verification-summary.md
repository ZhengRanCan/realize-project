# F09 Verification Summary

本文件把 harness 接入前的验证记录整理成当前口径。原始输出保持原样，见
`results/verification-output.txt`（修复轮复测：五篇 Fixture + heading tree + 单测）与 `results/mutation-output.txt`（M1~M8）。
两份 `.txt` 在本仓库中为**明文 UTF-8**；其中命令路径是**规范化前**的
`docs/features/09-contract-adversarial-test/...`，本文件与 `feature.md` 照实引用、不改写。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-d.map.json` | 2026-09-26 | passed | 路径为规范化前记录；复测：elements 12 · edges 11 · attachments 2 · topics 7 · relationGap 2 · gapDensity 0.15 · coverage 21/21 · SKIPPED 0；HARD 0 · WARN 2 · INFO 3；状态 PASS（基线为 9 边 / relationGap 6 / `PASS WITH INCOMPLETE VALIDATION`） |
| `node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-e.map.json` | 2026-09-26 | passed | 路径为规范化前记录；elements 13 · edges 9 · coverage 11/11；HARD 0 · WARN 3 · INFO 7；状态 PASS（`W1`：13 > preferred budget 12） |
| `node scripts/check-map.js --map …（A / B / C 三篇基线，A 另带 `--plan fixtures/context-consumption.overview-plan.json`）` | 2026-09-26 | passed | 同一轮复测：A `87/87` · HARD 0 · WARN 0 · INFO 2；B `13/13` · HARD 0 · WARN 1 · INFO 3；C `19/19` · HARD 0 · WARN 2 · INFO 3；三篇状态均 PASS |
| heading tree 解析（D / E / B / C 四篇文档） | 2026-09-26 | passed | fixture-e `sectionLevel 2` · top 11 · all 48；fixture-d `sectionLevel 2` · top 21 · all 27；fixture-b `sectionLevel 2` · top 13；fixture-c `sectionLevel 2` · top 19 |
| `node scripts/test-check-map.js` | 2026-09-26 | passed | `29 passed, 0 failed`（较修复前的 21 个用例新增：heading tree ×2、`qualifiers` ×4、relationGap 聚合 ×2） |
| `node docs/log/artifacts/F09-contract-adversarial-test/drafts/build-mutations.js` | 2026-09-26 | passed | 命令取自 `drafts/build-mutations.js` 的用法注释；产出 `results/mutation-output.txt`，拦截率 **14/14 = 100%** |
| `npm run verify:harness` | 2026-09-27 | passed | harness 层收口证据，由主 agent 在收口时统一执行 |

> 日期口径：历史材料只记到"修复轮 / 关闭"这一层，`legacy-feature-registry.md` 记 09 的完成日为 **2026-09-26**，
> 命令输出本身没有内嵌时间戳，故上表命令日期取该日；`npm run verify:harness` 按规格 §6.5 取 **2026-09-27**。

## Key metrics

### 两篇 Fixture：修复前基线 → 修复后复测

| 指标 | D 基线 | D 修复后 | E |
| --- | --- | --- | --- |
| elements / edges / attachments / topics | 12 / 9 / 3 / 7 | 12 / **11** / **2** / 7 | 13 / 9 / 3 / 8 |
| relationGap（缺口密度） | **6**（0.40） | **2**（0.15） | 2（0.18） |
| HARD / WARN / INFO | 0 / 7 / 3 | **0 / 2 / 3** | 0 / 5 / 5 → 0 / **3** / **7** |
| coverage / SKIPPED | 未执行 N2·N3 / 引用可解析性 + N2 + N3 | **21/21** / **0** | 11/11 / 0 |
| 状态 | `PASS WITH INCOMPLETE VALIDATION` | **`PASS`** | `PASS` |

### Mutation / adversarial（M1~M8 × D / E）

| 项 | 期望 | 结果 |
| --- | --- | --- |
| M1 删除 provenance（H2）· M2 type 改第 7 类（H1）· M3 表外 relation（H4）· M4 dangling reference（H3）· M5 孤立 element（H7）· M6 删除无 element Topic 的导航入口（H5）· M8 让顶层小节失去所有入口（H5） | HARD | D / E 各 7 项全部拦住 |
| 拦截率 | — | 修复前 **13/14 = 93%**（D 的 M8 漏网）→ 修复后 **14/14 = 100%** |
| M7 强行串联两个无关节点 | **判不出来**（semantic rule，非 schema rule） | 如预期未被检测：D `HARD 0 · WARN 2`、E `HARD 0 · WARN 3`，**不计入拦截率** |

### 五篇 Fixture 全量复测（修复后）

| Fixture | granularity | HARD | WARN | INFO | coverage | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| A（F04，带 `--plan`） | sourceUnit | 0 | 0 | 2 | 87/87 | PASS |
| B | section (provisional) | 0 | 1 | 3 | 13/13 | PASS |
| C | section (provisional) | 0 | 2 | 3 | 19/19 | PASS |
| D | section (provisional) | 0 | 2 | 3 | 21/21 | PASS |
| E | section (provisional) | 0 | 3 | 7 | 11/11 | PASS |

> 粒度纪律：A 是 `sourceUnit`，B / C / D / E 是 `section (provisional)`，**两组数字不得相加或合成一个覆盖率**。

### 四个观察类别与 Gate（最终）

| 类别 | 结论 | 依据 |
| --- | --- | --- |
| Semantic gap | **0** —— 两篇均不需要第 7 类 element（D 未用 `constraint`，其不变量记入 relationGap；E 用了 2 个 `constraint`，正是攻击目标所在） | `adversarial-report.md` §3.1 |
| Relation gap | D 6 → **2**；E 2；保留项是关系自身的图级 / 跨实体不变量（无环、区间包含），不是缺动词 | `adversarial-report.md` §3.2 / §7、`repair-round.md` §2.3 |
| Capacity gap | `12` 对规则密集的操作手册偏紧（E = 13 → 仅 `W1`），"明显不够"未被证明；未为压到 12 牺牲决定性内容 | `adversarial-report.md` §3.3 |
| Validator FP / FN | FP = 0；FN 1 处（D 的 `N2/N3` 未执行 → M8 漏网），已由 R1 修复并复测关闭 | `adversarial-report.md` §3.4 / §7 |
| **Gate** | **PASS**（四条条件全部满足） | `adversarial-report.md` §7、`verification-output.txt` 结论段 |

### 必须随 Gate 一起读的边界措辞（不得读成"关系模型完备"）

> Framework Map 的关系模型支持**基本关系 + 结构属性**（`cardinality` / `ownership`）；
> **复杂关系不变量仍属 Constraint 语义**（无环、区间包含、条件唯一），
> 在 `constraint.parameters` 表达面出现之前以 **Structured Constraint Gap** 记录，**不阻塞 Gate**。

## 人工路径证据

- 用户复核并裁决 `F09 = Completed / Closed（Gate = PASS）`（2026-09-26），同日据此解除 Feature 07 的 Blocked → `Ready`
  （`repair-round.md` §7.5、`legacy-feature-registry.md` 的 09 行）。
- 三条被冻结的边界判断：① `relationGap` 保留 2，不追求归零；② "每 Goal/date 至多一条 DailyReview"归 Structured Constraint Gap，
  不进 `relationGap`；③ `W8` 不为 D 触发，不为触发它调阈值（`repair-round.md` §7.1）。
- 人工审计项 M7 已记录，且**没有**要求 validator 判出它（`mutation-output.txt` 末行）。
- Fixture 原件由用户提供、SHA256 已登记、原文未改一个字节（`adversarial-report.md` §0）。

## 已知偏差（记录，不阻塞本 feature 的验收结论）

- **v2 的 D / E 仍是工程验证，不是独立选型**：候选池在 v1 阶段已被观察过，重新扫描不能消除"池子已被看过"；更强证据需外部 holdout fixture（`fixture-selection-v2.md` §3、`brief.md` §3.4）。
- **B / C 的 candidate map 尚未按最新 Contract 用 `qualifiers` 重表达**：不能声称 C 的"持有 / 存储"缺口已实测关闭，只可说"机制上已能表达"；已列为单独一轮 `F06 contract migration regression`（`repair-round.md` §7.3）。
- **`constraint.parameters` 不存在**：E 的有界失败规则的决定性内容（10 次 / `REFUND_FAILED`）只能整句写进 label，机器不可读；登记为 Structured Constraint Gap，本轮不补 DSL（`rule-adjustments.md` §5、`repair-round.md` §5）。
- **语义验收标准仍是 proxy**：当前"语义覆盖"用 1:1 语义 proxy 度量，不是真正的语义判据（`adversarial-report.md` §7 保留项 4）。
- **`W8` 阈值修订与建议稿不同**：`rule-adjustments.md` §3.1 建议 `relationGap ≥ 0.5 × edges`，实际落地为
  `relationGap / (relationGap + edges) ≥ 0.5` 且 `relationGap ≥ 3`（`rule-adjustments.md` 开头警示、`repair-round.md` §3）。
- **M6 初版曾误报"漏网"**：初版 mutation 挑了"有 element 的 Topic"清空入口，那不违反 N1 —— 是测试设计错了，不是 validator 错了；已修正为挑"无 element 的 Topic"（`adversarial-report.md` §2）。
- **R1 的第一版实现造成过回归**：见到任意 `#` 就当标题后，E 反而从 PASS 变为 FAIL（HARD 2 · coverage 2/9），因为 runbook 围栏代码块里的 shell 注释被当成 level-1 标题；最终实现为 fence-aware + ATX-aware + hierarchy-aware（`repair-round.md` §1.1）。
- **本 feature 的修复轮改动了 F06 的产物**（`scripts/check-map.js`、`schema/framework-map.schema.json`、`scripts/test-check-map.js` 21 → 29 用例）；
  `legacy-feature-registry.md` 的 06 行已注明"含 F09 修复：H8/W7/W8、W4→I6、heading tree"。因此复算 F09 的结论时，必须使用修复后的校验器版本。

## Harness layer

- `npm run verify:harness` 结果见 `docs/progress.md` 的 "Latest harness gate" 一行（本 feature 标为 `passing` 前必须为 passed，日期 2026-09-27）。
- 独立审查记录：`docs/log/artifacts/F09-contract-adversarial-test/subagent-review.md`（`Status: not_recorded`）。
