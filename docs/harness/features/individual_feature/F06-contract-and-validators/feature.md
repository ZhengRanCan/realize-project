---
id: F06
title: Contract and Validators (schema + check-map + contract text)
version: v0.1
status: blocked
dependsOn: ["F05"]
scope: {"code":["schema/framework-map.schema.json","scripts/check-map.js","package.json"],"tests":["scripts/test-check-map.js"],"docs":["docs/specs/framework-map-contract.md","docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json","docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-b.map.json","docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-c.map.json","docs/log/artifacts/F06-contract-and-validators/**"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"npm run check-map","result":"passed","note":"A / B / C 三篇均输出「PASS（无契约违反）」：A HARD 0 · WARN 0 · INFO 2；B HARD 0 · WARN 2 · INFO 2；C HARD 0 · WARN 2 · INFO 3（实跑 2026-09-26 20:44，见 results/verification-output.txt）。输出内的 map 路径为规范化前记录：docs/features/04-l0-framework-map/drafts/context-consumption.map.json（A · 需要 --plan）· docs/features/05-l0-generalization-gate/drafts/fixture-b.map.json · docs/features/05-l0-generalization-gate/drafts/fixture-c.map.json"},{"command":"npm run test:map","result":"passed","note":"19 passed, 0 failed（results/verification-output.txt 的 test-check-map 段）；npm 脚本名与用途见 results/notes.md §1"},{"command":"node scripts/test-check-map.js","result":"passed","note":"F09 修复轮把修复并入同一份脚本后复跑：29 passed, 0 failed（2026-09-26；字面命令与输出见 docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt）"},{"command":"npm run verify:harness","result":"passed","note":"harness 层证据，由主 agent 在收口时统一执行（2026-09-27）"}],"manualSmoke":"材料里没有独立的人工走查记录：唯一的人工比对是 results/notes.md §3.1 —— check-map 报出的收敛节点（C 的 E-04 / E-08）与人工判断一致；reviewer 按 validation-checklist.md 的逐项验收至今没有记录。"}
completionGate: {"version":"v0.1","l3":"required","userPath":["reviewer 按 docs/log/artifacts/F06-contract-and-validators/validation-checklist.md §1~§7 逐项核对，并在 §8 回出 ACCEPT / ACCEPT WITH NOTES / REJECT —— 至今未记录（§1~§7 复选框全部仍为空，§8 最终判定栏为空）"],"integrationEvidence":["npm run check-map 在 A / B / C 三篇真实 Fixture 上的报告：三篇 HARD = 0 且均为「PASS（无契约违反）」（results/verification-output.txt，2026-09-26 20:44）","npm run test:map 19/19；F09 修复轮复跑 node scripts/test-check-map.js 29/29","npm run verify:harness 通过（2026-09-27，主 agent 收口执行）"],"knownUnverified":["3 处已知 Relation gap 是否要补关系词仍未定：本 feature 决定不补词、只用 relationGap 表达（results/notes.md §2 与 §7 第 1 项），留给 Phase 2b；F09 用 qualifiers 重表达了 D 的 6 条缺口（→ 2 条），但 B / C 的旧 gap 未重表达。","element budget 12 是否偏紧没有结论：三篇 Fixture 全部顶到 12/12（results/notes.md §7 第 3 项），`≤12` 是否随主轴长度放宽要等 Phase 2b；本 feature 刻意不写 maxItems，也不定义 13~15 / >15 的分级惩罚。","开工检查未闭合：brief.md §8 的「03 §3~§6 自那以后没有再被修改」仍是未勾选状态，而 F09 修复轮实际改动了 F03 规格的关系词表（contains 放宽为「结构性包含 / 组成」+ 关系三层说明，见 F09 results/repair-round.md R5 与 commit 48769ed）——A / B / C 的产物是否需要重新对齐，没有记录。","F09 的修复（H8 / W7 / W8、W4 → I6、heading tree、edge 可选 id / label / qualifiers）已并入本 feature 的产物，但 F06 自身没有单独的回归验收记录：F06 的 results/verification-output.txt 停在 2026-09-26 20:44 的修复前状态（A / B / C 三篇、单测 19/19），修复后的 29/29 与五篇 Fixture 复测只记在 docs/log/artifacts/F09-contract-adversarial-test/results/ 下。","B / C 的 candidate map 没有按新 Contract 重表达：旧 relationGap（B 1 条、C 2 条）是否仍成立未实测；F09 results/repair-round.md §7.3 把它登记为单独一轮「F06 contract migration regression」，明确不阻塞任何 feature。","section 粒度解析：F06 材料里只支持数字标题、解析不到时不建立位置全集并跳过引用与导航校验（results/notes.md §3.2 与 §7 第 4 项）；F09 R1 已改成围栏感知的 Markdown heading tree，但 F06 的 results/ 里没有该修复的回归记录。","schema/framework-map.schema.json 没有独立 JSON Schema 校验器（ajv 等）自检的记录：现有证据只到 check-map 能解析 schema 并读出词表（results/verification-output.txt 最后一条用例「词表确实从 schema 读（6 类 / 9 词）」），execution-prompt.md 的 Verification 第 1 项无输出可指。"],"humanReviewRequired":["F06 的用户验收至今没有记录：validation-checklist.md §1~§7 的复选框全部仍为空，§8 的最终判定栏（ACCEPT / ACCEPT WITH NOTES / REJECT）为空；legacy-feature-registry.md 第 64 行仍是「Executed（待验收；含 F09 修复：H8/W7/W8、W4→I6、heading tree）」，Reviewer = 用户、Completed = -。","需要 reviewer 判定 check-map 的三级 severity 口径是否被接受（HARD / WARN / INFO，含 F09 新增的 H8 / W7 / W8 与 W4 → I6）：材料里没有对这套分层的整体裁决，只有逐条规则的建议（F09 results/rule-adjustments.md）与修复记录（F09 results/repair-round.md）。","需要 reviewer 判定 F09 提出的规则修复是否算本契约的一部分：修复已直接落在本 feature 的三个产物上，并由用户在对 F09 的裁决中确认（F09 results/repair-round.md §7），但 F06 的验收清单里没有对应条目，也没有 F06 侧签署。","需要 reviewer 裁决 H7（孤立元素，判据 B：至少参与一条 edge 或 attachment）：执行方在 results/notes.md §4 写明「如果 reviewer 认为这不该是 Hard，可以降级为 Warning —— 它的确比『悬空引用』弱一档」，该裁决至今没有记录。"]}
---

# F06 Contract and Validators (schema + check-map + contract text)

## Goal

本 feature 把 F03 的框架图规格落成三个可执行的契约产物：结构层 `schema/framework-map.schema.json`、
可执行校验 `scripts/check-map.js`（HARD / WARN / INFO 三级 severity，关系词表从 schema 读）、
判断层 `docs/specs/framework-map-contract.md`（记录 schema 表达不了的判断），外加 `scripts/test-check-map.js` 单元测试。
第一验收标准是「不误报」：A / B / C 三篇已通过的 Fixture 在 check-map 下 Hard Error 全为 0，
element budget 超限 / 未知 role / relationGap 只出 Warning，component = 0、state = 0、出现 DAG、没有主轴、
Topic 没有 element 只出 Informational。契约刻意不写 `maxItems`、不扩关系词（仍是 8 词 + `relates-to`，表外词 = HARD）、
不把 `role` 做成严格 enum；表达不了的关系用独立的 `relationGap` 结构登记（B 1 条、C 2 条）。
行为在 2026-09-26 实跑并留档；随后 F09 的规则修复（H8 / W7 / W8、W4 → I6、heading tree、edge 可选 `id` / `label` / `qualifiers`）
并入同一批产物，但用户验收至今没有记录，因此本 feature 仍是 `blocked`。

## Process preconditions

- Process order: F06 在流程上位于 F05（跨文档类型 Gate）之后、F09（契约对抗测试）与 F07（生成链路）之前；
  F09 / F07 / F08 没有把 F06 登记为 harness 强制前置（F06 未验收，登记会让 gate 报错），流程顺序只写在这里。
- F05 的 `Gate = PASS`（2026-09-26）是本 feature 的开工条件，`brief.md` §8 前置条件第 1 项已勾选。
- `brief.md` §8 前置条件第 2 项「03 §3~§6 自那以后没有再被修改」在材料里仍是未勾选状态，且 F09 修复轮确实改过 F03 规格的关系词表
  （`contains` 放宽为「结构性包含 / 组成」，F09 `results/repair-round.md` R5）——A / B / C 的产物是否仍需对齐没有结论，已登记为未关闭项。
- 三篇被测 Fixture 来自前置 feature：A 是 F04 的人工产物（`sourceUnit` 粒度，跑 check-map 需要 `--plan`），
  B / C 是 F05 的产物（`section (provisional)` 粒度）。

## Scope

### Allowed changes

- `schema/framework-map.schema.json`（新增）——结构层契约：字段存在 / 数据类型 / 枚举 / ID 格式 / 引用完整性；刻意没有 `maxItems`。
- `scripts/check-map.js`（新增）——三级 severity 校验器：provenance、navigation N1~N3、词表封闭性、attachment 合法性、
  判据 F 同文档 label 唯一、element budget warning、relationGap、形态类 Informational；后期并入 H8 / W7 / W8 与 `W4 → I6`、heading tree。
- `scripts/test-check-map.js`（新增）——单元测试：F06 记录 19 例，F09 修复后 29 例（新增 heading tree ×2、qualifiers ×4、relationGap 聚合 ×2）。
- `docs/specs/framework-map-contract.md`（新增）——判断层契约：三种 coverage 的关系、concept vs state、何时用 attachment、
  Capacity gap、关系三层与 Relation gap、不要强行串链（含 Fixture C 的真实来历）、三级冻结清单；F09 追加 §0 / §5.4 / §10.1。
- `package.json`（修改）——新增 `check-map` / `test:map` 脚本，`test:all` 并入 `test:map`。
- 三篇被测 map 只补 `relationGap`（语义内容未改动）：`docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json`、
  `docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-b.map.json`、`…/fixture-c.map.json`；A 另补 `meta.validationGranularity`。
- `docs/log/artifacts/F06-contract-and-validators/results/{notes.md,verification-output.txt}`（执行记录）。

### Out of scope

- 不改 `app/renderer/*`、`app/main/*` 与任何 UI（F08 的事）；不写任何生成 prompt（F07 的事）。
- 不推翻现有 11 个 shape；不新增第 7 类 element；不新增第 9 / 10 / 11 个 relation 词；不留 `type: "custom"` 之类的任意关系后门。
- 不把 `12` 写成 `maxItems`（或等价的元素数量上限），也不定义 13~15 / >15 的分级惩罚（无证据）。
- 不把 `role` 做成严格 enum；不因为「某类 element = 0」报警；不把「没有主轴 / 出现 DAG / Topic 没有 element」报成 HARD 或 Warning。
- 不改 `fixtures/`、`experiments/`、`ai/`；不改 A / B / C 三篇 map 的语义内容（只允许补 `relationGap`、补 `meta.validationGranularity`）。
- 不基于 F06 之前的旧规矩给 A / B / C 判 FAIL —— 校验器的首要任务是「不误报」。

## Acceptance Criteria

- [x] 三个交付物 + 单元测试齐备并可运行：`schema/framework-map.schema.json`（结构层）、`scripts/check-map.js`（三级 severity）、`docs/specs/framework-map-contract.md`（判断层）、`scripts/test-check-map.js`（`results/notes.md` §1；当前仓库四个文件均存在，commit `102ccfc`）。
- [x] `npm run test:map`（`scripts/test-check-map.js`）19 passed / 0 failed，覆盖三级 severity 边界：表外词 / 缺 provenance / 悬空引用 / 无导航路径 → HARD，budget > 12 / 未知 role / relationGap → WARNING，component = 0 / state = 0 / DAG / 无主轴 / Topic 无 element → INFORMATIONAL（`results/verification-output.txt` 的 test-check-map 段）。
- [x] A / B / C 三篇 Fixture 上 `npm run check-map` 的 Hard Error 均为 0，三篇状态均为 `PASS（无契约违反）`：A HARD 0 · WARN 0 · INFO 2、B HARD 0 · WARN 2 · INFO 2、C HARD 0 · WARN 2 · INFO 3（同文件，实跑 2026-09-26 20:44）。
- [x] 三条「不要过度冻结」的核心检查落实：schema 里没有 `maxItems`；`edges[].type` 仍是 8 词 + `relates-to`；`elements[].role` 是 string + `x-known-roles` 注解而非 enum（`results/notes.md` §2；schema 文件第 5 / 24 / 102~106 行）。
- [x] `relationGap` 是独立结构 `{from,to,intendedMeaning,reason}` 且不进入 `edges[]`，存在时只出 Warning；3 处已知 gap 已登记（B 1 条、C 2 条）（同文件 stats 行与 W5 行）。
- [x] 三级 severity 分层正确，Informational 各项不会被报成 Hard Error 或 Warning，且不因「某类 element = 0」报警（同文件 test-check-map 段的 6 条 Informational 用例）。
- [x] 粒度纪律：A 的 `sourceUnit` 与 B / C 的 `section (provisional)` 在报告里分开列出（`granularity` 一行显式打印，provisional 带「不得与 sourceUnit 粒度混算」提示），没有合成一个覆盖百分比（同文件三篇报告头）。
- [x] F09 的规则修复已并入本 feature 的产物：H8 / W7 / W8、`W4 → I6`、fence-aware heading tree、edge 可选 `id` / `label` / `qualifiers`（F09 `results/repair-round.md` §0 / §3 / §4 与同目录 `results/verification-output.txt` 的 29/29；commit `48769ed` 改的正是这四个文件）。
- [ ] reviewer 按 `validation-checklist.md` 逐项验收并回出 `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT` —— 至今无记录（清单 §1~§7 复选框全部为空，§8 最终判定栏为空，2026-09-27 仍如此）。
- [ ] F09 修复并入后的产物在 F06 侧完成回归验收 —— 无记录：F06 的 `results/` 只到 2026-09-26 20:44 的修复前状态（A / B / C 三篇、单测 19/19），修复后的 29/29 与五篇 Fixture 复测记在 F09 的 `results/` 下。

## Risks and compatibility

- **口径是共享风险**：`check-*` 的规则一旦调整，历史上成批产物会变红（`docs/progress.md`）。F09 已经改过一次口径
  （`W4 → I6`、新增 `W8`、`contains` 放宽），因此改口径应与新 feature 分开成轮，不能顺手合进别的任务。
- **F06 的 results 是修复前快照**：本目录停在 2026-09-26 20:44（A / B / C、单测 19/19、W4 仍是 Warning）；
  引用本 feature 的数字时必须连带看 F09 `results/repair-round.md`，否则会把 19/19 或 `W4` 当成现状。
- **开工检查未闭合**：F09 改动了 F03 规格的关系词表（§6.1 `contains` 定义 + 关系三层），A / B / C 是否需要重新对齐没有结论；
  brief.md §8 第 2 项至今未勾选。
- **H7 的严格度未裁决**：执行方自认「孤立元素判 HARD」比「悬空引用」弱一档并请 reviewer 裁决（`results/notes.md` §4）；
  若降级为 Warning，会改变历史判定口径（三篇 36/36 元素本轮都参与了关系，未触发）。
- **`section` 粒度解析曾被判只支持数字标题**：F06 的处置是「解析不出小节就不建全集、跳过引用与导航校验、只出 W0」
  （`results/notes.md` §3.2，B 的 T-01 与中文数字标题场景相关）；F09 R1 换成 heading tree 后，W0 路径仍是不误报的兜底。
- **B / C 未重表达**：`contains + ownership` 机制上可能已能表达旧 gap，但原 candidate map 尚未按新 Contract 重表达，
  因此旧的 relationGap 1 / 2 条不能算实测关闭（F09 §7.3 已明确此口径）。
- **兼容性**：本 feature 不改 renderer、不改 `fixtures/` / `experiments/` / `ai/`，无运行时兼容风险；
  但 `schema` 是 F07 / F08 / F10 的共同输入，任何再次调整都会波及它们。
- **回滚**：本 feature 由 commit `102ccfc` 引入；F09 的修复（`48769ed`）已依赖同一批文件，
  单独回滚 F06 会连带打掉 F09 的修复与 29/29 单测，因此回滚必须两个 feature 一起处理。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F06-contract-and-validators/verification-summary.md`
- Independent review: `docs/log/artifacts/F06-contract-and-validators/subagent-review.md`（harness 接入前关闭，未留下独立审查记录，补偿说明见该文件）
- 历史材料: `docs/log/artifacts/F06-contract-and-validators/{brief.md,execution-prompt.md,validation-checklist.md,results/**}`
