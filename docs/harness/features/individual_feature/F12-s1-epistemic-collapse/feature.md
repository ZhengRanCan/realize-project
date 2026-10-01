---
id: F12
title: S1 Epistemic Collapse Regression
version: v0.1
status: passing
dependsOn: []
scope: {"code":["scripts/l0-view-model.js","app/renderer/l0-map.js","app/main/main.js"],"tests":["scripts/test-l0-view-model.js","scripts/test-l0-preview.js"],"docs":["docs/log/artifacts/F12-s1-epistemic-collapse/**","docs/specs/reading-view-cognitive-contract.md","docs/progress.md","docs/harness/features/individual_feature/F12-s1-epistemic-collapse/verification.md"]}
evidence: {"lastVerifiedAt":"2026-10-01","commands":[{"command":"npm run test:all","result":"passed","output":"22 + 31 + 29 + 33 + 48 + 35 + 42 + 131"},{"command":"npm run selftest","result":"passed","output":"真实 preload → IPC → main → view model 三态断言通过；点选/高光/角标/预览回归通过"},{"command":"npm run verify:harness && npm run check:docs","result":"passed","output":"20 features, 0 errors; 110 markdown files checked, 0 broken"}],"manualSmoke":"用户授权 Codex 审查验收；真实 Electron 自测覆盖两份 map 的入口加载及既有交互回归"}
completionGate: {"version":"v0.1","l3":"required","userPath":["用户授权 Codex 完成 F12 审查验收；Unknown 与 Known(0) 在真实入口和 Topic DOM 中保持可区分"],"integrationEvidence":["npm run selftest 2026-10-01：真实 preload → IPC → main → view model 三态断言通过"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F12 S1 Epistemic Collapse Regression

## Goal

消除 Contract S1（`absent` ≠ `[]` ≠ `0` ≠ `unknown` ≠ `Absent(capability)`）在现有实现中的
**已确认违反**，并用**结构断言**把三态钉住。

已确认的违反点（本仓库实测）：

```text
scripts/l0-view-model.js:109
  blockIds: [...(t.blockIds || [])]
      ↑ 把 absent(Unknown) 折叠成 [](Known(0))
```

`topic.blockIds` 是系统中目前**唯一真正三态**的字段（schema 里 optional + `[]` 合法），
因此它是 S1 的现实案例；其余同类 `|| []` / `?? 0` 站点按判据逐个分类，**不一律修改**。

## Process preconditions

- F11 的审计结论：哪些站点**真的**具有 Unknown / Empty 区别（只有这些进 backlog）。
- Contract 侧依据：S1 / S7（`reading-view-cognitive-contract.md` §5.3 / §5.5）、
  Layer Contracts §1.3 与 §3.6（L0 不得依赖 `blockIds` 存在；Unknown 与 Known(0) 不得合并成"暂无"）。
- 注：流程上应在 F11 之后，但 `dependsOn` 保持为空；顺序由本段的 Process preconditions 约束，
  见 `docs/harness/features/README.md` 的 `dependsOn` 口径。

## Scope

### Allowed changes

- `scripts/l0-view-model.js` —— 三态表达（最小修改，不重构投影）。
- `app/renderer/l0-map.js` —— **仅当**消费侧会把两种状态渲染成同一种说法时才动，且只做最小文案区分。
- `app/main/main.js` —— 补 selftest 集成断言。
- `scripts/test-l0-view-model.js`、`scripts/test-l0-preview.js` —— 三态回归断言。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅** §6 矩阵 S1 行的对应 cell。
- `docs/log/artifacts/F12-s1-epistemic-collapse/**`、`docs/progress.md`。

### Out of scope

- 不改 layout 算法与坐标、不改 Contract 语义、不改 `schema/**`、`scripts/check-*.js`、F10 管线、任何 fixture。
- 不做 UI 重设计；**不把三态做成新的视觉功能**。
- 不改没有三态语义的合法 fallback（例如 `element.topics` 是 required 非空，`|| []` 无害）。
- 不引入 synthetic 状态对象去破坏既有断言（34 / 42 / 130 / selftest 13 条必须继续全绿）。

## Acceptance Criteria

- [x] **先写会失败的测试**：断言当前实现下 `blockIds` absent 与 `[]` 经投影后不可区分，确认失败。
- [x] 投影输出保留三态且互不相等；断言是**结构级**（状态或 shape 不同），
      **不是** `result.length` 或字符串断言（后者会再次把 Unknown 与 empty 折叠掉）。
- [x] 最小修改后：新断言通过，且 `test-l0-view-model`（35）、`test-l0-layout`（42）、
      `test-l0-preview`（131）、`npm run selftest` 全部继续通过。
- [x] epistemic-collapse 扫描的**每个站点都有判定**，含明确写下的"合法 fallback，不改"结论。
- [x] 契约 §6 矩阵 S1 行的 cell 更新（`Protection coverage` 与 `Projection test`），
      Priority 按判据重算，**不做整行搬迁**。
- [x] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **改动会改变 IPC payload 形状**：`l0-view-model.js` 同时被 `scripts/build-l0-preview.js`（静态预览）
  与 `app/main/main.js`（产品）消费，两处都要跟着过一遍。
- **不要为了"更好看"顺手统一三态**：本 feature 只解决 S1 的现实违反，
  状态空间的完整建模属于 F13（B1）。
- **误改合法 fallback 会制造 regression**：扫描结果必须先判据再动手。
- 已知历史教训（同类风险）：F08 曾出现"测试复制产品逻辑"导致真实入口静默抛错而 selftest 全绿 ——
  本次断言必须打在**真实入口**（`loadL0` → `loadFrameworkMap` → view model）上，不复制逻辑。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
