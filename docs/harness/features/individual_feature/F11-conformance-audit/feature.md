---
id: F11
title: Current Implementation Conformance Audit
version: v0.1
status: passing
dependsOn: []
scope: {"code":[],"tests":[],"docs":["docs/log/artifacts/F11-conformance-audit/**","docs/progress.md","docs/harness/incidents/2026-09-29-local-environment-recovery.md","docs/harness/features/individual_feature/F11-conformance-audit/verification.md"]}
evidence: {"lastVerifiedAt":"2026-09-29","commands":[{"command":"node scripts/test-check-plan.js + remaining test:all constituent scripts","result":"passed","output":"docs/log/artifacts/F11-conformance-audit/direct-test-results.json"},{"command":"F11 report structure validation (read-only-probes.md second block)","result":"passed","output":"docs/log/artifacts/F11-conformance-audit/report-validation-output.txt"},{"command":"npm run verify:harness; npm run check:docs; npm run test:all","result":"failed","reason":"npm installation missing definitions.js; direct Node equivalents recorded separately"},{"command":"node scripts/harness-gate.mjs","result":"passed","output":"docs/log/artifacts/F11-conformance-audit/final-harness-gate.mjs.txt"},{"command":"node scripts/check-doc-links.js","result":"passed","output":"docs/log/artifacts/F11-conformance-audit/final-check-doc-links.js.txt"},{"command":"npm run test:all","result":"passed","output":"docs/log/artifacts/F11-conformance-audit/environment-test-all.txt"},{"command":"npm run selftest","result":"passed","output":"docs/log/artifacts/F11-conformance-audit/environment-selftest.txt"}],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"not_required","userPath":["用户已验收 F11 审计交付；报告中的 Not Implemented / Capability Absent 保持为分类结论，不作为功能待办"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F11 Current Implementation Conformance Audit

## Goal

把已冻结的 Contract 规则与**现有实现**逐条对照，产出一张诚实的差异图：

```text
Compliant | Violation | Partially Compliant | Not Implemented
Capability Absent | No Executable Boundary | Needs Inspection
```

**只读审计**：不改任何代码、schema、validator、renderer、fixture，也不新增 capability。
它回答的唯一问题是"现有软件实际上是什么意思"，不回答"应该新增什么功能"。

交付物：本 feature artifact 目录下的 `results/conformance-audit.md`。

## Process preconditions

（非 harness 强制，但事实上必须先具备。）

- Reading 三件套已落盘并成为 authority：`docs/specs/reading-view-cognitive-contract.md`、
  `reading-view-layer-contracts.md`、`reading-view-cognitive-contract-evidence.md`（commit `50826a8`）。
- `framework-map-contract.md` 已与历史证据分离（`88aeed9`、`eea7662`）。
- 契约 §6 的 Machine Enforcement Status 矩阵已在位 —— 它回答"有没有机器保障"，
  是本次审计的一半输入；本次要补的是另一半"实现是否**真的遵守**"。
- 注：本 feature 的流程顺序不登记为 `dependsOn`（父 feature 非 `passing` 会让 gate 必然报错），
  见 `docs/harness/features/README.md` 的 `dependsOn` 口径。

## Scope

### Allowed changes

- `docs/log/artifacts/F11-conformance-audit/**`（审计报告与只读探针记录）
- `docs/progress.md`

### Out of scope

- 不改任何 `app/**`、`scripts/**`、`schema/**`、`fixtures/**`、`experiments/**`。
- **不为 Not Implemented 项补功能**；不设计 B1 的接缝；不改 Contract 语义。
- 不把审计结论写成"待办功能清单"。

## Acceptance Criteria

- [x] 分类表覆盖契约 §6 矩阵的全部条目，以及起点六问：
      S1 三态折叠、S7 `?? 'normal'` 缺省语义、S5 生成缺失时的 coverage、
      Decision C 数组顺序、I2 是否存在文本/相似度关联、N9 provenance 是否被当成 evidence。
- [x] 每条结论附**可核证据**（`文件:行` 或命令输出），不使用 PASS / FAIL 二值。
- [x] 状态只取上列七种之一；含主观判断的条目必须写明判据。
- [x] 输出「**已正确、不要动**」的机制清单，并注明各自的现有守卫
      （已知候选：assembler 注入固定字段 + `FIXED` hard fail、悬空外键校验、
      `leaf ⊆ covers`、`source-sections.json` 解析器、framework-map ontology）。
- [x] 输出 epistemic-collapse 扫描结果：对 `|| []` / `?? []` / `|| 0` / `?? 0` / `?? 'normal'` /
      `(x || []).length` / `if (!x)` 等站点**逐个判定**"该字段是否真有 Unknown / Empty 区别"，
      只有判 yes 的进 S1 backlog（其余明确记为"合法 fallback，不改"）。
- [x] 明确列出「**无边界**」项（可作为 B1 候选），但**不设计** B1。
- [x] 按可审性分三层记录：① 可对产品直接审 · ② 可对 stage2 产物与脚本审 · ③ 无边界。

## Risks and compatibility

- **被误读为功能待办**：`Not Implemented` 与 `Capability Absent` 都不等于"要去做" ——
  `Capability Absent` 是契约**明确规定**的状态（如 Claim Verification）。
- **假 backlog**：epistemic-collapse 扫描会命中大量**合法** fallback（字段本无三态语义）；
  不逐站判据就会制造噪音，反过来伤害 S1 的可信度。
- **分类含判断**：`Partially Compliant` / `Needs Inspection` 天然主观，必须附证据与判据。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F11-conformance-audit/verification-summary.md`
- Independent review: `not_required`（只读审计，无代码变更）

## 2026-09-29 audit delivery / blocked

审计报告已交付，29 条不变量、六问与逐站扫描见本 feature artifact。未改代码或规范。
阻塞：人工复核/用户验收未记录；报告校验器要求与只读 scope 冲突；本机 npm 安装损坏。
Node 直接执行离线测试通过，不冒充 npm 命令成功。当前目录无 Git 元数据，尚未 commit/push。
F12 未开始；dependsOn 保持空。

## 2026-09-29 environment recovery

用户已安装依赖。当前 Node/npm/Electron 正常，标准 test:all 与 selftest 已通过；Git 真实历史和远端上游已恢复，本地文件未覆盖。
verification.md 按用户更高优先级的只读要求改为执行现有文档内报告校验命令，不新增 scripts 文件；规范/实现不变。
本轮环境维护扩展仅为上述 incident 与 verification 文档；code/tests scope 及 dependsOn 保持空。人工复核/用户验收仍未记录，F11 不标 passing。

## 2026-10-01 acceptance

用户已确认审计交付并授权推进后续 conformance migration。F11 的人工验收已记录；不改变审计分类与只读范围。
