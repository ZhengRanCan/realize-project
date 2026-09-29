---
id: F18
title: L3 Inspector (traceability without verification)
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/renderer/l0-map.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/specs/reading-view-layer-contracts.md","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F18-l3-inspector/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中从一个 Block 往下核查：确认能走到 SU → §N → 原文 section，也能走到 review object → evidence；且界面没有出现任何 claim-level 的 Verified / Unverified 结论"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F18 L3 Inspector (traceability without verification)

> **契约待补**：详细契约在 **F11–F17 完成后**再补全。此处只固定职责边界与不可让步的约束。

## Goal

让 L3 成为**从已有 subject 往下核查**的一层（inspection projection，不产生新主 identity），
提供：Traceability · Source Coordinate · Evidence Context · Related Review Context ·
Generation Integrity · Provenance Assurance。

**仍然不提供 Claim Verification** —— 直到未来真的出现新的 carrier。
这是本 feature 最重要的产品判断：**UI 只展示模型真正知道的东西，而不是为了显得完整把空白填满。**

**F18 不是 Verification Feature。** 它的成功标志不是"信息看起来完整"（那会天然诱导出
`Verified` / `Unverified` / `Evidence OK` / `Approved` 之类的总结 badge），而是：

```text
用户能看见系统知道什么、能追到哪里，
同时也能看见系统不知道什么。
```

这与普通 dashboard 的思路很不一样，但正是本架构的辨识度。

## Process preconditions

- F16 / F17 已完成（L2 与 L1 已在 projection 上运行；source 与 review 链路已就位）。
- Layer Contracts §4（L3 七字段）与 §4.9（三条跨层边界）已冻结。
- 注：顺序上在 F16 / F17 之后，**不登记为 `dependsOn`**。

## Scope

### Allowed changes

- `app/renderer/app.js`（Source 回查面板 / 详情区）、`app/renderer/l0-map.js`（focus panel）、
  `app/main/main.js`（IPC 与集成断言）。
- `scripts/test-l0-preview.js`（共用模块约定未被破坏）。
- `docs/specs/reading-view-layer-contracts.md`、`docs/specs/reading-view-cognitive-contract.md`
  —— **仅**当 L3 的某条降级规则需要澄清时（不得放宽 invariant）。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- **不新增 claim verification carrier**；不引入 `ClaimVerification{claimId, evidenceIds, status, rule}`
  或任何等价结构（那是未来单独一轮的事）。
- 不为 fragment 制造 synthetic ID；不做 Explore；不做 UI 视觉设计（属 F21）。

## Acceptance Criteria

- [ ] 两条核查路径**分别存在且不得合并**：
      `Block → sourceUnitIds → SU → §N → source section` 与
      `Block → reviewObjects → DEC/GAP/Q/FACT → evidence`。
      界面/投影**不得**出现 "Evidence verifies SU" 或 "Decision verifies fragment" 之类的连接。
- [ ] **Claim Verification 仍为 Known Absent**：不得渲染 `Verified` / `Unverified` /
      `verification: null` 之类；"能力不存在"不得被写成"状态是未验证"。
- [ ] `ProvenanceAssurance = Indeterminate` 不得渲染成 `Unsupported` / `No evidence` /
      `Missing evidence`（未分类 ≠ 已证否）。
- [ ] `§N` 只解析到 section range；**不得**伪造 `exactLine`（N11）。
- [ ] Evidence 无 id ⇒ 只能在父 review object 内 disclosure，**不能深链**。
- [ ] Evidence Context 的 `[]` 是 Known(0)（明确"没有 evidence"），不得显示成 Unknown。
- [ ] fragment 的 provenance 可 inspect，但**位置不得升格为 identity**（不能作为 Comment Anchor /
      Explore Focus / `Open in Reading` 目标）。
- [ ] §6 矩阵对应 cell 更新。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **最大的产品诱惑就是在这里"补一个 Verified badge"**。B2 的 N7 / N8 正是为这件事建的护栏；
  本 feature 第一次让那条护栏产生产品价值。
- 若发现确实需要 claim-level 结论，正确动作是**回到 Contract 与 Change Control**，
  而不是在 renderer 里先做出来。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
