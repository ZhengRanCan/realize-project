---
id: F05
title: L0 Generalization Gate (cross document-type gate)
version: v0.1
status: blocked
dependsOn: ["F04"]
scope: {"code":[],"tests":[],"docs":["docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-b.map.json","docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-c.map.json","docs/log/artifacts/F05-l0-generalization-gate/results/**","docs/log/artifacts/F03-hierarchical-architecture/brief.md"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"(命令行未记录) Fixture B / C 两张 L0 图的结构自查（F04 同口径：Framework Map invariant + Navigation invariant）","result":"passed-with-warnings","note":"输出见 docs/log/artifacts/F05-l0-generalization-gate/results/verification-output.txt：Hard Error 0 · Warning 2（两篇图上 constraint 都只有 2 条，低于 3~5 区间）；该输出内的 map 路径为规范化前记录（docs/features/05-l0-generalization-gate/drafts/fixture-b.map.json 与 fixture-c.map.json）"},{"command":"npm run verify:harness","result":"passed","note":"由主 agent 在收口时统一执行（2026-09-27）"}],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 docs/log/artifacts/F05-l0-generalization-gate/validation-checklist.md 上逐项复核并写下判定（ACCEPT / ACCEPT WITH NOTES / REJECT）","单独回一句 Gate = PASS 或 Gate = FAIL —— 这是 Feature 06 的开工条件"],"integrationEvidence":["B / C 两张 L0 图走同一套结构自查并通过：每篇 12 元素、F1~F2 与判据 B / F 全 PASS、Hard Error 0（docs/log/artifacts/F05-l0-generalization-gate/results/verification-output.txt）","事后交叉复核（非 F05 自身证据）：F06 / F09 用 scripts/check-map.js 复核同样两张图，HARD ERROR 0（B：WARN 1 · C：WARN 2，均为 relationGap），记录在 docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt"],"knownUnverified":["Capacity gap：三篇 Fixture 全部顶到 12/12（A 12/12 · B 12/12 · C 12/12），B / C 图上都只剩 2 条 constraint，低于 03 §5.5 的 3~5 经验值；≤12 是否放宽至今未裁定 —— 见 results/gap-classification.md §2 与 results/rule-matrix.md R5（结论只到「有条件成立」）","3 处 Relation gap 未补词（B：两端必须逐字节一致；C：Inbox 持有 Candidate、Proposal 校验通过后放行），是否补第 9 个关系词留给契约讨论 —— results/rule-matrix.md R4","R8「必须有单一主轴」实测不成立（C 是分叉 DAG + 不对称分支），规则矩阵只给「有条件成立」；该结论仅在 A / B / C 三篇上取得 —— results/rule-matrix.md R8 与 results/phase2-generalization.md Q2","B / C 的 coverage 粒度是 section (provisional)，与 A 的 sourceUnit 粒度不可混算；section 粒度下 N2 与 N3 合并，R7 只证明到小节级别，待 Feature 07 产出 sourceUnits 后回测 —— results/rule-matrix.md R7 与 results/overfitting-check.md 第三类","选型局限：Fixture B 是「字节级规范化规范」而不是实体关系模型，Q1 的结论只对数据变换 / 协议规范类文档成立；真正的 ER / Schema 演进文档与纯运维 runbook 未测（Phase 2b 的 Fixture D / E 未执行）—— results/phase2-generalization.md Q1 与末节","第二类过拟合在过程中发生过（设计 C 的前两版都把两个分支压成单链），靠文档里一句「两个投影互相独立」才纠正；最终产物未过拟合，但这条经历被记为遗留教训 —— results/overfitting-check.md","证据缺口：results/ 未记录结构自查的命令行原文；validation-checklist.md 的 10 组检查项全部为空勾选，也没有执行方自评或 reviewer 备注文件（如 review-notes.md）"],"humanReviewRequired":["用户尚未在 validation-checklist.md 上记录 F05 的验收判定：legacy-feature-registry.md 只记为 Executed（Gate = PASS，待验收），Completed 列为 -","待判定的实质问题 1：三种拓扑是否各自成立 —— A 链 + 侧挂、B 严格交替链（artifact / process）+ 侧挂、C 分叉 DAG + 不对称分支（Mastery 支末端没有产物节点）；依据 results/rule-matrix.md R3 / R8 与 results/overfitting-check.md","待判定的实质问题 2：「Framework Map 是否一定存在单一主轴」的实测答案 —— 不必须（C 没有单一主轴），03 §3.3 已据此回写（docs/log/artifacts/F03-hierarchical-architecture/brief.md 的 Phase 2 实测答案段）","待判定的实质问题 3：规则矩阵结论是否被接受 —— R1 / R3 / R6 / R7 成立、R2 / R4 / R5 / R8 有条件成立、无一不成立（results/rule-matrix.md 汇总表）","待判定的实质问题 4：是否接受 Gate = PASS（即 Feature 06 契约落地可以开工），以及是否接受把 Capacity gap 补为第 5 类 gap 并回写 03 规格（§3.3 / §5.3 / §5.5 / §11.1.1 / §14）"]}
---

# F05 L0 Generalization Gate (cross document-type gate)

## Goal

拿三类文档（A 概念型 / B 数据型 / C 流程型）去攻击 Feature 04 从 Fixture A 一篇文档推出来的 8 条通用规则，
看哪些只是过拟合。交付物是两张新图 `drafts/fixture-b.map.json`、`drafts/fixture-c.map.json`，
以及四份结论文件：逐条规则矩阵 R1~R8、每个不适配项的 gap 归类（4 类 + 新提的 Capacity gap）、
Q1~Q3 三大关切的答复、两类过拟合检查。结构自查结果：B / C 各 12 元素，Hard Error 0 · Warning 2；
规则矩阵无一「不成立」，Semantic gap 0，故执行方判定 `Gate = PASS`。
同时实测出 ≤12 容量偏紧（三篇全部 12/12）并把 5 处修正回写 03 规格。
本 feature 的成功标准是「失败的边界被找清楚」，不是「三类文档都画得出来」。

## Process preconditions

- `Process order:` 真实流程位于 Feature 04（Track A · Fixture A 图）之后、Feature 06（契约落地）之前；
  `Gate = PASS` 是 Feature 06 / 07 / 08 的开工条件（`brief.md` §8、`results/phase2-generalization.md` Gate 结论）。
- Fixture B / C 由用户提供并已就绪（`测试文档/`），执行方不得自造替代文档（`brief.md` §6 / §10）。
- B / C 从未跑过 Stage 1，没有 sourceUnits，因此 N3 按**原文小节**粒度检查并显式标注为
  `provisional validation granularity`；Feature 07 生成 sourceUnits 之后回到 sourceUnit 粒度重测。
- 复用 Feature 04 的 Fixture A 图作为基线（`docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json`），
  但 Track A 的交互结论**不得**用来支撑本 feature 的判断（`execution-prompt.md` Context）。
- harness 强制前置只有 F04（`dependsOn`）；F04 自身仍是 `blocked`（registry：Technical Pass / UX Validation Pending），
  所以本 feature 无法进入 `active` / `passing`。

## Scope

### Allowed changes

- 手工撰写两张 L0 图：`docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-b.map.json`、
  `docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-c.map.json`（B / C 用 `provenance: [{section, lines}]`）。
- 结论文件：`docs/log/artifacts/F05-l0-generalization-gate/results/` 下的 `rule-matrix.md`（★ 主要交付物）、
  `gap-classification.md`（★）、`phase2-generalization.md`、`overfitting-check.md`、`verification-output.txt`。
- 回写 `docs/log/artifacts/F03-hierarchical-architecture/brief.md` 的 5 处：§3.3（分叉 DAG 实测形态 +
  「文档没说前置关系就不要串成链」）、§5.3 判据 E（容量偏紧实测）、§5.5（「3~5 条」标注为 Fixture A 经验值）、
  §11.1.1（补第 5 类 Capacity gap）、§14（去掉「Process-heavy 使 L0 退化成流程图」风险行）。

### Out of scope

- 不继续优化 Context Consumption 本身；不用 Feature 04 的 Track A 结论背书本 feature 的判断。
- Gate 出结论前不产出 `framework-map.schema.json`、`check-map`、Stage 1a / 1b prompt、renderer 改动。
- 不新增第 7 类元素，也不悄悄加第 9 个关系词；不因为画不出图就换掉 Fixture（失败结论本身是交付物）。
- 不修改 Fixture A / B / C 的任何字节（只读）；不把 B / C 的小节粒度 coverage 与 A 的 sourceUnit 粒度混算。
- Task 2.7 的可选第三类探针（决策记录格式文档）未做。

## Acceptance Criteria

- [x] 两张 B / C 图各 12 元素，Framework Map invariant（F1 / F2 / type 词表 / edge 词表 / 未用 `relates-to` / 主轴只放 process·artifact / 判据 B / 判据 F）与 Navigation invariant（N1~N3）全部 PASS，Hard Error 0（`results/verification-output.txt`）。
- [x] R1~R8 逐条有结论与证据，无空白、无含糊表述，且没有任何一条判为「不成立」（`results/rule-matrix.md`）。
- [x] 每个不适配项都归入 gap 类别并写明理由：Semantic gap 0 · Relation gap 3 · Navigation gap 1（A，F04 已修）· Layout gap 1 · **Capacity gap 5**（新提第 5 类）；建议扩 ontology 的项 0（`results/gap-classification.md`）。
- [x] Q1 / Q2 / Q3 逐条答复，含具体元素与边的例子，并明确回答「Framework Map 是否必须存在单一主轴」——实测答案：不必须（R8「必须有单一主轴」不成立）（`results/phase2-generalization.md`）。
- [x] 两类过拟合检查均有结论：第一类（Fixture A 锚定）未发现；第二类（把「主轴 + 侧挂」当必要形态）过程中发生过、被文档证据纠正、最终产物未过拟合（`results/overfitting-check.md`）。
- [x] 结论明确写成 `Gate = PASS`（附「只覆盖 A / B / C 三篇」的范围声明），并列出带进 Feature 03 / 06 的修正项（`results/phase2-generalization.md`）。
- [ ] 用户尚未在 `validation-checklist.md` 上记录 F05 的验收判定（ACCEPT / ACCEPT WITH NOTES / REJECT）与 `Gate = PASS` / `Gate = FAIL` 的追认；registry 仅记为 Executed（Gate = PASS，待验收）。
- [ ] Task 2.1 的 Fixture 来源核对（B / C 的 SHA256 与 `测试文档/README.md` 一致、两句未被改动）未留下结果记录：`results/` 里没有相关输出，该组检查项在 `validation-checklist.md` 上仍为空勾选。

## Risks and compatibility

- **容量规则偏紧且未裁定（Capacity gap）**：三篇 Fixture 全部 12/12，B / C 图上都只放得进 2 条 constraint，
  低于 03 §5.5 的 3~5（该值已标注为 Fixture A 经验值）。R5 只到「有条件成立」；是否放宽 12 或允许
  `constraint` 不占配额，留给后续讨论，本次不改规格。
- **选型局限**：Fixture B 的文体是「字节级规范化规范」，天然有流水线，不是实体关系模型；因此 Q1
  「Data-heavy 不被追着画机制链」只对数据变换 / 协议规范类成立。真正的 ER / Schema 演进文档与纯
  runbook 未测（Phase 2b 的 Fixture D / E 计划未执行），这是本 feature 最大的证据空白。
- **粒度不可混算**：B / C 是 section (provisional)，A 是 sourceUnit（87 条）；section 粒度下 N2 与 N3 合并，
  R7 的 PASS 只到小节级别，不得宣称与 A 等价。Feature 07 产出 sourceUnits 后需回测。
- **3 处 Relation gap 悬置**：补第 9 个关系词会影响 A 的既有产物，故本次只记录不补词，交契约层面处理。
- **第二类过拟合的经历**：C 的前两版设计被压成单链，靠文档原句纠正；最终产物未过拟合，但它说明
  「主轴惯性」很强，已作为教训回写 03 §3.3。
- **回写已冻结架构文档**：本 feature 修改了 `docs/log/artifacts/F03-hierarchical-architecture/brief.md` 的 5 处
  （§3.3 / §5.3 / §5.5 / §11.1.1 / §14），需要用户验收时一并确认。
- **证据可复现性缺口**：`results/verification-output.txt` 没有记录命令行；`validation-checklist.md` 全部未勾选、
  没有 reviewer 判定，也没有执行方自评文件。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F05-l0-generalization-gate/verification-summary.md`
- Independent review: `docs/log/artifacts/F05-l0-generalization-gate/subagent-review.md`（harness 接入前关闭，未留下独立审查记录；已登记原因与可复核位置）
- 历史材料: `docs/log/artifacts/F05-l0-generalization-gate/{brief.md,execution-prompt.md,validation-checklist.md,drafts/fixture-b.map.json,drafts/fixture-c.map.json,results/**}`
