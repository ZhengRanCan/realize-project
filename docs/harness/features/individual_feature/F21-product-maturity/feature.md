---
id: F21
title: Product Maturity (UX, performance, accessibility)
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/renderer/l0-map.js","app/renderer/l0-map.css","app/renderer/styles.css"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/harness/DESIGN.md","docs/log/artifacts/F21-product-maturity/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中走一遍四层：确认每个 UX 决策都能追溯到契约，且没有为了「显得完整」而新增任何模型未声明的状态或结论"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F21 Product Maturity (UX, performance, accessibility)

> **契约待补**：本 feature 的验收标准在 **F16–F20 完成后**再细化。此处只固定
> 两条**不可让步**的约束，以及它覆盖的范围。

## Goal

到这一阶段才适合大规模讨论：L0 节点怎么排 · L1 边界怎么画 · L2 Block 怎么展开 ·
L3 是 drawer 还是 side panel · 哪些 badge 默认显示 · 哪些信息 hover · 什么情况折叠 ·
如何处理 21 个 Topic · 动画 · 键盘导航 · 性能 · 可访问性 · 遥测。

## Process preconditions

- F16–F20 已完成（四层 runtime、导航、Explore 都已建立在 projection 与统一 identity 之上）。
- 注：顺序上在最后，**不登记为 `dependsOn`**。

## Scope

### Allowed changes

- `app/renderer/**`（视觉与交互）；`scripts/test-l0-preview.js`。
- `docs/harness/DESIGN.md`（交互与视觉设计口径）。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope（两条不可让步的约束）

1. **不得为 UI 需要而新增 carrier 或升级认识论状态。**
   典型反例：UI 想显示 `Verified` badge ⇒ 那就加一个 verification —— **不允许**。
   projection 给 `ClaimVerification = Absent`，UI 就只能设计成"不提供 claim-level verification"。
   这是"Contract 控制产品"，而不是"产品需求制造语义"。
2. **不得放宽任何 invariant 来换视觉简洁**：Unknown / Known(0) / Missing / Absent / Indeterminate
   仍是不同状态；renderer 仍不得自行解释语义。

另外：本 feature **不新增** L0–L3 之外的语义层，也不做跨层身份解析（那已在 F19 完成）。

## Acceptance Criteria

- [ ] 每个 UX 决策都能**追溯到契约**（写明依据的 Decision / 不变量 / 层字段）。
- [ ] 未新增任何模型未声明的状态、carrier 或结论；未放宽任何 invariant。
- [ ] 全层走查：identity 不变、authority 不变、epistemic state 不升级、semantic strength 不升级。
- [ ] 既有回归全绿（预览 / selftest / 各离线测试），且性能与可访问性有可复核的记录。
- [ ] 验收标准在 F16–F20 完成后补齐并逐条勾选。

## Risks and compatibility

- **与 F08 的关系待定**：F08（L0 UI）当前 `blocked`，它的 UI 迭代与 Track A 是**较早**的一件事，
  可能在本 feature 之前发生。F21 只覆盖"runtime 迁移完成之后的成熟化"；
  两者的先后顺序需要在 F16 开工前明确，避免 UI 反复改两轮。
- **本 feature 的范围天然容易膨胀**（视觉 + 性能 + 可访问性 + 遥测）。
  开工时若发现承担 5 个以上独立职责，应拆分为独立 feature —— 允许拆分，**不预设**。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
