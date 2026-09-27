---
id: F07
title: AI Framework Map Generation (Stage 1/2 pipeline)
version: v0.1
status: blocked
dependsOn: ["F09"]
scope: {"code":["ai/framework-map-generation.prompt.md","scripts/generate-framework-map.js","scripts/test-generate-framework-map.js","scripts/check-map.js"],"tests":["scripts/test-generate-framework-map.js"],"docs":["docs/log/artifacts/F07-ai-framework-map-generation/**","experiments/framework-map-generation/**"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"node scripts/test-generate-framework-map.js","result":"passed","note":"Gateway / 产物安全离线验证 33/33（stub 注入六类情形，零模型调用）；见 results/gateway-safety-output.txt"},{"command":"node scripts/generate-framework-map.js --fixture a","result":"passed","note":"Phase 2 单 Fixture smoke test：工程链八步全 true、repair=none、check-map PASS（HARD 0 / WARN 2）；该次真实参数为 max_tokens=32000（--max-tokens flag 被静默忽略所致）；见 results/phase2-smoke-test.md"},{"command":"node scripts/generate-framework-map.js --fixture {a..e}（15 次正式调用）","result":"passed-with-warnings","note":"Technical PASS 15/15、HARD 0；但 Semantic PASS 0/15，且 WARN 0–5/run（W1 14/15、W3 11/15）→ Gate = PARTIAL PASS；见 results/run-matrix.md、results/final-gate.md"},{"command":"node tmp/verify-f07-phase3.js","result":"passed","note":"产物完整性：16 个 run 五件套齐全、参数与指纹唯一、artifactSha256 与实际文件逐一致、无 .tmp 残留、repair 全 none；见 results/phase3-artifact-check.txt"},{"command":"npm run verify:harness","result":"passed","note":"harness 层门禁，2026-09-27"}],"manualSmoke":"Phase 4 人工读原文语义判读：5 篇 fixture × 3 run 逐 run 判读 element / edge / provenance 出处与 Validator Gaming，Semantic Anchors 以人工分析建立且从未进入 prompt；结论 Semantic PASS 0/15（PARTIAL 5 / FAIL 10）。见 results/semantic-review.md、results/stability-analysis.md"}
completionGate: {"version":"v0.1","l3":"required","userPath":["打开 experiments/framework-map-generation/fixture-*/run-NN/，确认 15 个正式 run 的 check-map.txt 都是 PASS（HARD 0）、没有 .tmp.json 残留、run-meta.json 的 repair 全为 none","按 results/phase2-smoke-test.md §2 的八步核对一次真实调用的工程链（请求 → raw response → JSON 解析 → temp 写入 → read-back → 原子 rename → check-map 执行 → 无自动修补）","人工读原文核对任一 run 的 element / edge 是否真的来自原文 —— 这是 Q2 的人工路径；材料显示 15 个 run 没有一次完整通过"],"integrationEvidence":["experiments/framework-map-generation/fixture-{a..e}/run-NN/ 共 16 个真实 run 目录（15 正式 + 1 参数偏差样本），五件套 request.json / raw-response.txt / framework-map.json / check-map.txt / run-meta.json 齐全","node tmp/verify-f07-phase3.js：artifactSha256 与实际文件逐一致（无覆盖）、generationParams / provider / promptSha256 唯一、无 .tmp 残留、repair 全 none → results/phase3-artifact-check.txt","generator 内真实执行 scripts/check-map.js：16/16 PASS、HARD 0、N1~N3 无 SKIPPED 段 → results/run-matrix.md"],"knownUnverified":["Semantic PASS 0/15 —— 直接「生成 Map」的语义忠实度没有成立：15 个正式 run 全部 Technical PASS（HARD 0），但没有一次达到完整语义忠实（Semantic PARTIAL 5 / FAIL 10）；A 类（Concept / Architecture）的机制 anchor 承载 0–1/3（A5 的 element/relation 承载 0/3、A6 1/3）。依据 results/final-gate.md §3、results/semantic-review.md、results/stability-analysis.md §1。","E（Operational Runbook）明显退化：A2 异常与失败路径 0/3、A3 人工介入与越权边界 0/3、A4 有界失败（连续 10 次 → REFUND_FAILED）0/3、A5 资产回补一致性与幂等 0/3；该篇无任何 3/3 锚点（稳定率 0/6），粒度三变（云函数级 → Feature 级 → 阶段级），跨 run 无稳定核心节点。依据 results/stability-analysis.md §1 / §2.2、results/final-gate.md §4。","README §14 的 PASS 九条中有 3 条未满足：条件 6 无系统性 relation misuse（B 的跨实现一致性 3/3 被硬套动词）、条件 8 核心 semantic anchors 跨 run 稳定（E 0/6）、条件 9 D / E 无明显退化（E 明显退化、D 合格）→ Gate 只能判 PARTIAL PASS。依据 results/final-gate.md §1。","Validator Gaming 按 §12 独立判定为命中：预设五类中 ①乱用 relates-to、③为压 12 而删机制、④语义不准的 known role、⑤编造 prerequisite 命中，另有两类预设外形式 ⑥ relationGap 被当作不受检表达位（C/run-03 自环）、⑦ edge.label 承载图上不存在的主体或规则；对应 run 即使 check-map = PASS 也判 Generation Quality FAIL。依据 results/final-gate.md §2。","relationGap 漏登：人工登记的真 gap（B 的跨实现一致、C 的跨 revision 唯一、E 的顺序 vs 调用）在 B / C / E 三篇均 0/3 复现。依据 results/semantic-review.md、results/stability-analysis.md §1。","UNCLEAR 未关闭：思维链未落盘（completion tokens 中 reasoning 占 83%，338693 / 408550），因此「硬套动词 / 漏登 gap」是明知故犯还是能力不足无法判定；所有 gaming 判定只基于产物形态，不基于意图。依据 results/final-gate.md §7、results/stability-analysis.md §4。"],"humanReviewRequired":["用户（reviewer）尚未按 docs/log/artifacts/F07-ai-framework-map-generation/validation-checklist.md 逐条签署验收；docs/log/artifacts/legacy-feature-registry.md 第 07 行仍为 Executed，Completed 栏为「-」。","validation-checklist.md §11 要求单独回一句 Gate 判定（PASS / PARTIAL PASS / FAIL / BLOCKED）并给出 ACCEPT / ACCEPT WITH NOTES / REJECT；材料已判定 Gate = PARTIAL PASS，但判定栏未签署。","Phase 2 §5 提出的 max_tokens 裁决（事先约定的 8000 与 deepseek-flash 的推理占比不兼容）在材料中没有留下用户明确裁决记录；Phase 3 实际按 max_tokens = 65536 执行。"]}
---

# F07 AI Framework Map Generation (Stage 1/2 pipeline)

## Goal

交付一条可观察的生成链路：技术文档 → AI 生成 → `framework-map.json` → `framework-map.schema.json` → `check-map`，
并给出「AI 能否稳定、忠实生成 L0 Framework Map」的实验结论。链路包含三件交付物：只含 Contract 与 G1–G7 纪律的
生成 prompt、只做「请求 → 解析 → 保存 → 验证 → 报告」而**不做任何自动修补**的 generator、以及离线产物安全验证。
实验规模为 5 篇 fixture × 3 次独立调用 = 15 个正式 run（外加 1 个参数偏差样本）。可观察的结果是：16/16 run 五件套齐全、
`HARD 0`、零覆盖零修补、参数与 prompt 指纹统一，即 **Technical PASS 15/15**；但语义忠实度 **Semantic PASS 0/15**，
因此 `Gate = PARTIAL PASS`，本 feature 未能推进到 `passing`。

## Process preconditions

- `Process order:` 位于 F09（Contract v1 定稿，`Gate = PASS`）之后、F10（语义落地）之前；开工前 F09 的
  `schema/framework-map.schema.json` + `scripts/check-map.js`（含 heading tree 与 qualifiers）必须可用。
- D / E 两篇 fixture 必须严格使用 F09 冻结的测试副本，并继续遵守 F09 §3.6 的 Modeling Input Boundary
  （资格审查与建模使用同一信息面；生成时 AI 只能读当前 fixture 本身）。
- 上游 F06 的 schema + check-map 可用，但 F06 至今没有用户验收记录，因此未登记为 `dependsOn`（避免 gate 误报）。
- 开工前必须先跑通离线安全验证 33/33，不通过就不调用模型；Phase 1 未通过不得进入 Phase 2，Phase 2 未通过不得进入 Phase 3。
- 5 篇 fixture（A Concept / B Data / C Process / D ER / E Runbook）与人工 candidate map 已在位（candidate map 只用于事后参照）。

## Scope

### Allowed changes

- `ai/framework-map-generation.prompt.md`（生成 prompt：只含 Contract、六类 element、role / edge / qualifier / constraint /
  attachment 规则、provenance 要求、preferred budget、navigation invariants 与 G1–G7；**不含**任何一篇 fixture 的
  element / topic 示例）。
- `scripts/generate-framework-map.js`（generator：每次运行独立目录、成功写入协议 temp → read-back → 原子 rename、
  preflight、`repair: "none"`、退出码 0/1/2/3/4）。
- `scripts/test-generate-framework-map.js`（离线产物安全验证，stub 注入六类情形；Phase 2 修复三个 harness 缺陷后回归 33/33）。
- `scripts/check-map.js`（仅抽出 `renderReport()` 并导出，让 generator 与 CLI 共用同一份报告格式；判定逻辑未改）。
- `experiments/framework-map-generation/fixture-{a..e}/run-NN/`（16 个真实 run 的产物，随 Phase 2 / Phase 3 提交）。
- `docs/log/artifacts/F07-ai-framework-map-generation/**`（任务书 `brief.md`、`execution-prompt.md`、
  `validation-checklist.md`、`results/**`）。

### Out of scope

- 不设计 Framework Map 本身，也不重新论证 Contract 是否合理（F09 已完成，`Gate = PASS`）。
- 不新增第 7 类 element、不扩 relation vocabulary、不改 qualifiers 设计、不设计 constraint DSL、
  不改 12 element preferred budget、不重新设计 Topic / L0 / L1 架构。
- **不修改 `schema` / `check-map` / Contract / prompt**：Stop Conditions 只记录不边跑边改（15 个正式 run 的
  `promptSha256` 全部一致）。
- generator 不做任何自动修补：非法 relation 自动替换、超标自动删元素、provenance 自动补齐一律禁止；
  `run-meta.json` 固定写 `repair: "none"` 并记录产物 sha 供事后核对。
- 不做 L2 自动生成重构；不要求 ID / 名字逐字一致；不要求 AI 输出 HTML；不改 renderer 视觉语言。
- 不因为 AI 生成失败而修改 Contract 迁就模型；只有跨多篇 fixture、跨多次运行稳定暴露的 Contract 缺陷才登记为后续 issue。

## Acceptance Criteria

- [x] Phase 1 Gateway / 产物安全成立：`node scripts/test-generate-framework-map.js` 33/33 通过（离线 stub、零模型调用），
      六类情形下失败请求均不覆盖既有产物、validator FAIL 的产物完整保留、`repair` 全 none（依据 `results/gateway-safety-output.txt`）。
- [x] Phase 2 单 Fixture smoke test 工程链 PASS：真实调用一次成功、八步协议全 true、五件产物齐全、无 `.tmp.json` 残留；
      暴露的三个 harness 缺陷已修并回归 33/33（依据 `results/phase2-smoke-test.md`）。
- [x] Phase 3 五 fixture × 3 runs = 15 个正式 run 完成：16/16 run 五件套齐全、artifactSha256 与实际文件逐一致、
      参数与 prompt 指纹统一、run 编号单调无复用（依据 `results/phase3-artifact-check.txt`）。
- [x] Q1 Contract Validity 达标：Technical PASS 15/15、`HARD 0`、Hard-pass rate 100%（分母不含 EXCLUDED），
      零传输 / 解析 / 截断失败（依据 `results/run-matrix.md` §2）。
- [x] Q3 / Q4 / Q5 三份判读产出且口径分开：Framework Coverage 与 Navigation Coverage 未合并、N1~N3 无 SKIPPED、
      锚点未泄漏进 prompt、逐 run 给出 topology class 并专门回答了 D 是否被压成链与 E 是否只留 happy path
      （依据 `results/run-matrix.md` §3、`results/semantic-review.md`、`results/stability-analysis.md` §1 / §2.2）。
- [x] Phase 4 逐 run 三维分级完成，`§17` 最终四问逐条有清楚答案，Gate 判定取唯一值 `PARTIAL PASS`
      （不是「基本通过」这类模糊词；依据 `results/final-gate.md` §3 / §6 / §8）。
- [ ] Q2 Semantic Faithfulness **未通过**：Semantic PASS 0/15（PARTIAL 5 / FAIL 10），E 类机制 anchor 0–1/3、
      A 类机制 anchor 0–1/3，`§14` 的 PASS 条件 6 / 8 / 9 未满足 → Gate 未达 PASS（依据 `results/final-gate.md` §1 / §3 / §4）。
- [ ] 用户尚未按 `validation-checklist.md` 逐条签署验收并单独回一句 Gate 判定；`legacy-feature-registry.md`
      第 07 行仍为 `Executed`，Completed 栏为「-」。

## Risks and compatibility

- **重构前口径（必读，防止后来者误用旧结论）**：本目录原为 `07-generation-pipeline`，其中关于 **L2 / block 切法 /
  旧 Gold 基线**的记录属于**重构前口径**：`sourceUnits` 87 条、11 个 shape、`stage2-block.schema.json` 与
  `check-block.js` 保留；旧的 21 个 block 切法作废；`check-plan` 中与切法相关的规则重写（属 L2 线）；
  `ai/stage1-plan.prompt.md`（fingerprint `62e8e544c69dd32c`）重写、此前三次对比结论不再可用。
  **本 feature 不做 L2 自动生成重构**；L0 线的对比对象是人工 candidate map（A/B/C/D/E），**不叫 Gold**。
- **`HARD 0` 只说明 Contract 合法，不说明图是对的**：本轮 15/15 Technical PASS 与 0/15 Semantic PASS 同时成立，
  读材料时不得把「validator 全绿」推论成「图是对的」。
- **`coverage X/X` 不是 Framework Coverage**：它是 N3 的导航可达数；在 section 粒度下 N2 与 N3 合并，
  且只要 Topic 与小节 1:1 就由构造必然满分（C / E 已证）。Framework Coverage 与 Navigation Coverage 禁止合成一个百分比。
- **参数不统一**：Phase 2 的 `a/run-02` 因 `--max-tokens` 被静默忽略而实际使用 `max_tokens = 32000`，
  Phase 3 的 15 个正式 run 统一使用 `65536`；`a/run-02` 只能作参数偏差样本，不能与正式 run 直接比较。
- **Stop Conditions 命中但未修**：12 budget 反复超出 14/15、第 9 relation 需求、新的 Structured Constraint Gap、
  E 的拓扑与人工候选不同 —— 均只登记为后续 Contract issue，本 feature 内未改 schema / check-map / prompt。
- **回滚面小但存在**：`scripts/check-map.js` 的改动仅为抽出并导出 `renderReport()`，判定逻辑未改；
  generator 用 preflight 避免畸形产物让 `check-map` 崩溃，未修改 check-map 的判定。
- **D 是正面结果，不是失败案例**：ER-heavy（D）三次都保持 network 形态、覆盖 12 个实体、保留自环依赖图；
  不要把它与 E 的明显退化混为一谈，也不要把「关系词汇发散」读成「无法生成」。
- **Gaming 判定只基于产物形态**：思维链未落盘（reasoning 占 83%），意图为 UNCLEAR，
  不得在后续记录里写成「明知故犯」。
- **历史材料的文件名**：材料里引用的 `README.md` 指本目录现在的 `brief.md`（规范化前文件名），
  引用命令输出中的路径属规范化前记录，照实保留。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F07-ai-framework-map-generation/verification-summary.md`
- Independent review: `docs/log/artifacts/F07-ai-framework-map-generation/subagent-review.md`
- 历史材料: `docs/log/artifacts/F07-ai-framework-map-generation/{brief.md,execution-prompt.md,validation-checklist.md,results/**}`
