---
id: F09
title: Contract Adversarial Test (Phase 2b)
version: v0.1
status: passing
dependsOn: []
scope: {"code":["scripts/check-map.js","scripts/test-check-map.js"],"tests":["scripts/test-check-map.js"],"docs":["schema/framework-map.schema.json","测试文档/fixture-d-goal-plan-task-state-model.md","测试文档/fixture-e-f13-f16-runbook.md","docs/log/artifacts/F09-contract-adversarial-test/**"]}
evidence: {"lastVerifiedAt":"2026-09-26","commands":[{"command":"node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-d.map.json","result":"passed","note":"路径为规范化前记录；复测结果 HARD 0 · WARN 2 · INFO 3 · coverage 21/21 · SKIPPED 0 · 状态 PASS"},{"command":"node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-e.map.json","result":"passed","note":"路径为规范化前记录；结果 HARD 0 · WARN 3 · INFO 7 · coverage 11/11 · 状态 PASS（W1：13 > 预算 12，仅 Warning）"},{"command":"node docs/log/artifacts/F09-contract-adversarial-test/drafts/build-mutations.js","result":"passed","note":"用法注释所载命令；M1~M8 × D/E 对抗测试，输出 拦截率: 14/14 = 100%，写入 results/mutation-output.txt"},{"command":"node scripts/test-check-map.js","result":"passed","note":"测试输出 29 passed, 0 failed"},{"command":"npm run verify:harness","result":"passed","note":"harness 层收口证据，2026-09-27 由主 agent 统一执行"}],"manualSmoke":"用户按 validation-checklist.md 逐项复核，并裁决 F09 = Completed / Closed（Gate = PASS）：五篇 Fixture HARD 0 且全部 PASS、mutation 14/14、Semantic gap 0、ER-heavy relation gap 由 6 降至 2、capacity 仅 Warning、topology 不升级为 failure；同日记录于 legacy-feature-registry.md（2026-09-26）"}
completionGate: {"version":"v0.1","l3":"required","userPath":["在用户提供的两篇此前未覆盖的技术文档上跑完对抗测试（D = ER 型多实体关系网络、E = runbook），四条 Gate 条件逐条判定并通过","复核修复轮 R1–R8 并给出裁决：F09 关闭、Gate = PASS、Feature 07 解除 Blocked"],"integrationEvidence":["node scripts/check-map.js 在五篇 Fixture 上的完整复测：A/B/C/D/E 全部 HARD 0，状态均为 PASS（results/verification-output.txt）","heading tree 解析在四篇文档上的实测：fixture-e sectionLevel 2 · top 11；fixture-d sectionLevel 2 · top 21（results/verification-output.txt §2）","M1~M8 × D/E 对抗测试：拦截率 14/14 = 100%，M7 按设计不可自动判定（results/mutation-output.txt）"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F09 Contract Adversarial Test (Phase 2b)

## Goal

用两篇此前从未覆盖的技术文档（Fixture D = 没有天然主轴的多实体关系网络、Fixture E = 带正常 / 异常 / 人工介入与有界失败策略的操作过程），
对抗测试 F06 的 `framework-map.schema.json` + `scripts/check-map.js`，回答"会不会误判、漏判或逼迫错误建模"。
交付物是两份 candidate map（`drafts/fixture-d.map.json`、`drafts/fixture-e.map.json`，定位是**被测对象而非 Gold**）、
`results/adversarial-report.md`（四个观察类别 + mutation + topology + Gate）、`results/rule-adjustments.md`（F06 逐条规则升降级建议）
与 `results/repair-round.md`（修复轮 R1–R8 的执行与复测记录）。
结论是 `Gate = PASS`：Semantic gap = 0、D 的 relationGap 6 → 2、capacity 只是 heuristic、FP = 0 且唯一一处 FN 已修复并复测（拦截率 14/14）。
本 feature 同时产出一条方法学结论：`brief.md` §3.1 的 "D = NO QUALIFIED FIXTURE under the frozen Phase 2b selection criteria"
与 §3.6 的"资格审查只能使用 fixture 自身可证的信息"口径规则 —— 前者说明**选择标准可能因为语料不含被测现象而失败，这不等于标准错了，也不是事后放宽标准的授权**；
后者说明**资格阶段与建模阶段必须使用同一信息面**（不得用 supporting 文档或实现代码补文档语义）。
用户于 2026-09-26 裁决关闭本 feature，并据此解除 F07 的 Blocked。

## Process preconditions

- `Process order:` 本 feature 在 **F06 之后、F07 之前**执行；目录编号 `09` 只是创建顺序，不代表它排在 07 / 08 之后（`brief.md` 开头位置声明）。
- F06 已交付契约三件套（`schema/framework-map.schema.json`、`scripts/check-map.js`、`docs/specs/framework-map-contract.md`）与 21 个单元测试，本 feature 在此基线上做对抗测试。
- Fixture D / E 两篇**必须由用户提供**，执行方不得自造假文档（`brief.md` §3.5）；D 由用户 CONFIRMED，E 经单文档口径复核后 QUALIFIED（`results/fixture-e-single-document-reverification.md`）。
- **`dependsOn` 为什么为空**：F06 至今没有用户验收记录（`legacy-feature-registry.md` 记 06 为 "Executed（待验收）"）。若把 F06 登记为 `dependsOn`，
  harness gate 会要求父 feature 为 `passing` 而必然报错；因此 `dependsOn` 只登记 harness 强制前置，流程上的先后关系写在本节（规格 §4）。
- 建模只读各自 primary document，未查阅 `F15/verification.md`、`F16/verification.md` 或 `cloudfunctions/*.js`（`results/adversarial-report.md` §0）。

## Scope

### Allowed changes

- `drafts/fixture-d.map.json`、`drafts/fixture-e.map.json`：两份 candidate map（非 Gold；D 为 12 元素 / 11 边，E 为 13 元素 / 9 边）。
- `drafts/build-mutations.js`：可复现的 mutation 运行器（M1~M8，输出 `results/mutation-output.txt`）。
- `results/fixture-selection-d.md`、`results/fixture-selection-e.md`、`results/fixture-selection-v2.md`、`results/fixture-e-single-document-reverification.md`：资格审查与口径复核记录。
- `results/adversarial-report.md`、`results/rule-adjustments.md`、`results/repair-round.md`、`results/verification-output.txt`、`results/mutation-output.txt`。
- 修复轮对校验器的落地改动（依据用户裁决）：`scripts/check-map.js` 的 Markdown heading tree 解析（R1）、`edges[]` 可选 `id` / `label` / `qualifiers{cardinality, ownership}` 与 H8 / W7（R3）、`W4 → I6` 与聚合告警 `W8`（R6）。
- `schema/framework-map.schema.json` 的 `qualifiers` 可选字段（R3）；`scripts/test-check-map.js` 由 21 个用例扩到 29 个用例。
- 两个 Fixture 的只读副本 `测试文档/fixture-d-goal-plan-task-state-model.md`、`测试文档/fixture-e-f13-f16-runbook.md`（SHA256 登记，原文未改一个字节）。

### Out of scope

- 不继续设计 F03（规格不再改；要改也只走 §11.1.1 分类流程）。
- 不开始 AI 自动生成、不评价 AI 生成质量（那属于 F07）。
- 不新增第 7 类 element、不新增 relation 词、不把 `12` 写成 `maxItems`、不把 `role` 变成 enum。
- 不因 topology 与预期不同就判 contract failure；不把 section 粒度与 sourceUnit 粒度混算。
- 不为让 mutation 通过而降低 schema / validator 严格度；不修改 Fixture D / E 原文的任何字节。
- 本轮不补 `constraint` 参数 DSL、不做 B / C 的 Contract 重表达、不动 Feature 07 实现（`repair-round.md` §7.6）。

## Acceptance Criteria

- [x] Task 1 资格审查完成，并如实保留 v1 的否定结论与 v2 的修订：`results/fixture-selection-d.md` 记 `D = NO QUALIFIED FIXTURE`（最好候选 6/7，缺 N:M；1262 篇中 N:M 类记号命中 0），`results/fixture-selection-e.md` 记 `E = NO QUALIFIED FIXTURE`（最好候选 10/11，缺 timeout）；标准显式升级为 v2 并完整重跑（`results/fixture-selection-v2.md`），得 `D QUALIFIED`（第 1 名分数 153，是第 2 名 74 的两倍以上）、`E QUALIFIED`（11/11 + 3/3）。
- [x] Task 1 追加口径复核完成：E 的资格证据按 §3.6「资格审查只能使用 fixture 自身可证的信息」更正为文档自身的 L418「连续 10 次查单失败置 `REFUND_FAILED`」，原先引用的 `F15/verification.md` L27「超过 5 次」与实现层 `MAX_RETRY_COUNT` 已全部撤回（`results/fixture-e-single-document-reverification.md` §2.1 / §5）。
- [x] Task 2 两份 candidate map 产出且被 schema 接受，`meta.validationGranularity = "section (provisional)"`，未与 A 的 sourceUnit 粒度混算：D 12 元素 / 9 边 / 6 relationGap，E 13 元素 / 9 边 / 2 relationGap（`results/adversarial-report.md` §1）。
- [x] Task 3 基线 check-map 两篇 HARD 均为 0；D 因小节解析失败出 `W0` 且状态为 `PASS WITH INCOMPLETE VALIDATION`（列出 SKIPPED 段），E 为 `PASS`（`results/adversarial-report.md` §1、`results/verification-output.txt`）。
- [x] Task 4 mutation / adversarial test 完成：M1~M8 × D/E 逐条记录"期望 vs 实际"，M6 的测试设计错误已修正为挑"无 element 的 Topic"，M7 按设计不可自动判定、只作人工审计项不计入拦截率（`results/mutation-output.txt`、`results/adversarial-report.md` §2）。
- [x] Task 5 四个观察类别逐条落结论：Semantic gap = 0；Relation gap = D 6 / E 2（对 D 不可控）；Capacity = 12 偏紧但"明显不够"未被证明（E 13 只触发 `W1`）；Validator FP = 0、FN 1 处（D 的 `N2/N3` 从未执行，M8 漏网）（`results/adversarial-report.md` §3）。
- [x] Task 5 统计项完成：`W4` 跨 B / E 命中 3 次且全部自然（B 的 T-01、E 的 T-03、E 的 T-08），满足预设降级条件；topology 已记录（D = star/DAG 无主轴、E = 分叉流程三路径保留）且**未**升级为 contract failure（`results/adversarial-report.md` §4）。
- [x] Task 6 `results/rule-adjustments.md` 对 F06 每条规则给出明确处置并附实测证据：H1~H7 全部保持、`W1` 保持、`W4` 建议降为 INFO、建议新增关系缺口占比 Warning、必须修小节解析器根因。
- [x] 修复轮 R1–R8 按用户裁决执行完毕并全部落地（`results/repair-round.md` §0 裁决 → 执行对照表）：R1 heading tree 解析（含围栏代码块感知、ATX 空白判定、稳定 key、sectionLevel 判定）、R3 `qualifiers` 可选字段 + H8 / W7、R4 D 重表达 relationGap 6 → 2、R5 `contains` 放宽为结构性包含、R6 `W4 → I6` + `W8` 聚合告警、R7 登记 Structured Constraint Gap、R8 更新 Gate。
- [x] 修复轮复测通过：D 的 `coverage 21/21`、`SKIPPED 0`、状态由 `PASS WITH INCOMPLETE VALIDATION` 变为 `PASS`；M8 在 D 上被拦住，拦截率 13/14 → **14/14 = 100%**；D 的 relationGap 6 → 2（缺口密度 0.40 → 0.15）、edges 9 → 11；单测 21/21 → **29/29**（`results/repair-round.md` §1.3 / §2.3 / §4、`results/verification-output.txt`）。
- [x] 五篇 Fixture 全量复测：A / B / C / D / E 全部 HARD 0、状态均为 `PASS`；A 为 sourceUnit 粒度、B/C/D/E 为 section (provisional) 粒度，两组数字未合成一个覆盖率（`results/repair-round.md` §4、`results/verification-output.txt` §1）。
- [x] 最终 Gate 判定为 `PASS`（`results/adversarial-report.md` §7、`results/verification-output.txt` 结论段）：四条条件逐条满足，且保留必须随读的边界措辞 —— 关系模型支持基本关系 + 结构属性（`cardinality` / `ownership`），复杂关系不变量仍属 Constraint 语义并以 Structured Constraint Gap 登记、不阻塞 Gate。
- [x] 用户按 `validation-checklist.md` 复核并给出关闭裁决（2026-09-26）：确认三条边界判断（`relationGap` 保留 2 不追求归零、"每 Goal/date 至多一条 DailyReview"不进 `relationGap`、`W8` 不为 D 触发），并据此解除 Feature 07 的 Blocked → Ready（`results/repair-round.md` §7.1 / §7.5、`legacy-feature-registry.md`）。

## Risks and compatibility

- **语料不含被测现象会让选择标准"正确地失败"**：v1 的 `NO QUALIFIED FIXTURE` 是两个 fixture 都拿不到的结论（D 缺 N:M、E 缺 timeout），而全语料证据是"1262 篇里 N:M 类记号命中 0"。这不是标准错了，也**不是事后放宽标准的授权**；正确收尾是显式升级标准版本（保留旧版与旧结果 + 写明修订理由）并完整重跑（`brief.md` §3.3 / §3.1，方法学案例见文末）。
- **资格与建模的信息面必须一致**：本轮 E 的资格初判引用了 fixture 之外的 supporting 文档与实现代码，会造出"资格能看 A+B+code、建模只能看 A"的污染；已全部撤回并补上 §3.6 口径规则。用实现代码补文档语义属 Source Verification，不属 Document Modeling，违反 Current / Target / Evidence 的区分。
- **v2 仍是工程验证，不是独立选型**：候选池在 v1 阶段已被观察过，重新扫描能消除"直接沿用结论"，但消除不了"池子已被看过"；需更强证据时应另加外部 holdout fixture（`brief.md` §3.4、`results/fixture-selection-v2.md` §3）。
- **`constraint.parameters` 不存在（Structured Constraint Gap）**：E 的有界失败规则的决定性内容（10 次 / `REFUND_FAILED`）只能整句塞进 label，信息未丢但机器不可读，已登记为 Layout gap；第 3 层只有元素位置、没有结构化参数位。
- **关系模型的表达边界**：`relationGap` 保留 2 条（D 的 `E-06 ⇢ E-06` 无环 + 条件满足、`E-05 ⇢ E-06` 区间包含），本质是关系自身的图级 / 跨实体不变量，不是缺关系动词；追求归零必然走向关系词爆炸（`repair-round.md` §7.1）。对 F07 的直接后果是：`type` 是封闭 enum，AI 发明不出新词，只能**误用**已有动词（把引用写成 `contains`、把一切塞进 `relates-to`）。
- **"机制上已能表达"不等于"实测关闭"**：B / C 的 candidate map 尚未按最新 Contract 用 `qualifiers` 重表达，因此不能声称 C 的"持有 / 存储"缺口已解决；已列为单独一轮 `F06 contract migration regression`，不阻塞任何 feature（`repair-round.md` §7.3）。
- **Parser 的容忍度 ≠ Parser 的正确性**：修 R1 的第一版（见到任意 `#` 就当标题）把 E 从 PASS 打成 FAIL（HARD 2 · coverage 2/9），因为 runbook 围栏代码块里的 shell 注释被当成 level-1 标题；最终实现必须 fence-aware + ATX-aware + hierarchy-aware。
- **本 feature 改了 `scripts/check-map.js` / `schema/framework-map.schema.json` / `scripts/test-check-map.js`**：修复轮的改动已并入 F06 的产物（`legacy-feature-registry.md` 记 06 含 F09 修复：H8/W7/W8、W4→I6、heading tree），回滚本 feature 的结论必须连同这些已落地的校验器改动一起考虑。
- **语义验收标准仍是 proxy**：当前"语义覆盖"用 1:1 语义 proxy 度量，不是真正的语义判据；多实体关系网络的难度分级与 runbook 有界失败形态的细分（retry-bound vs lease-expiry vs circuit-break）留给后续（`adversarial-report.md` §7 保留项、`brief.md` 关闭时记录）。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F09-contract-adversarial-test/verification-summary.md`
- Independent review: `docs/log/artifacts/F09-contract-adversarial-test/subagent-review.md`（`Status: not_recorded` —— 当时的独立审查路径是用户复核与裁决，未留下独立 subagent 审查记录）
- 历史材料: `docs/log/artifacts/F09-contract-adversarial-test/{brief.md,execution-prompt.md,validation-checklist.md,drafts/**,results/**,legacy-feature-registry.md 的 09 行}`
