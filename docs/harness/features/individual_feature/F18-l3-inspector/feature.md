---
id: F18
title: L3 Inspector (traceability without verification)
version: v0.1
status: passing
dependsOn: []
scope: {"code":["app/main/**","app/shared/**","app/renderer/**","scripts/check-*.js","scripts/extract-source-sections.js","scripts/export-reading-bundle.js","scripts/assemble-overview.js","scripts/build-preview.js","scripts/helpers/reading-bundle-fixture.js","schema/reading-bundle.schema.json","schema/stage2-block.schema.json","package.json",".gitignore"],"tests":["scripts/test-*.js"],"docs":["docs/specs/reading-bundle-contract.md","docs/specs/reading-view-layer-contracts.md","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F18-l3-inspector/**","docs/harness/features/individual_feature/F18-l3-inspector/**","docs/harness/features/feature-index.json","docs/harness/incidents/2026-10-03-f18-runtime-input.md","docs/harness/ARCHITECTURE.md","docs/harness/DESIGN.md","docs/harness/INITIALIZATION_CONTRACT.md","docs/progress.md","docs/README.md","README.md","agent.md","bundles/README.md"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"npm run test:all","result":"passed","output":"All offline suites and portable Preview passed"},{"command":"npm run selftest","result":"passed","output":"SELFTEST PASSED: true bundle/Map/Topic/Block/SU and Evidence paths, races and isolation"},{"command":"npm run check-overview","result":"passed","output":"PASS WITH WARNINGS: 87/87 SU, 151/151 provenance"}],"manualSmoke":"Required user paths covered by real Electron integration; no claim of manual UX acceptance."}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中从一个 Block 往下核查：确认能走到 SU → §N → 原文 section，也能走到 review object → evidence；且界面没有出现任何 claim-level 的 Verified / Unverified 结论"],"integrationEvidence":["2026-10-03 npm run selftest: real preload/IPC/renderer Map → Topic → Block → SU/section and independent review Evidence; fragment, keyboard, back, cross-document, old replies, cancellation, drift and no automatic save passed"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F18 L3 Inspector (traceability without verification)

> 用户已批准资料包设计与实施计划；本轮补齐 F16 的 Plan + Generated 输入，并实施 F18 完整路径。

允许范围以 frontmatter 为准：共享模块、校验 CLI、离线 exporter、manifest、preload、renderer 与 Preview 共同构成同一个加载和 inspection 路径。旧入口兼容，历史产物不修改。

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

- frontmatter 登记的 shared / main / preload / renderer：显式输入、source 坐标、Plan + Generated 投影、隔离 session 与 L3 DOM。
- validator、exporter、assembler、Preview 与对应 Schema：复用既有规则和形状词汇表，原始实验制品保持。
- 已登记的 feature 测试与 `package.json`：两条路径、降级、异步切换、保存隔离、搬迁和旧入口回归。
- 输入协议规范、跨层机器保障的实际 cell、初始化与目录文档，以及本 feature 合同、incident 和 artifacts。

### Out of scope

- **不新增 claim verification carrier**；不引入 `ClaimVerification{claimId, evidenceIds, status, rule}`
  或任何等价结构（那是未来单独一轮的事）。
- 不为 fragment 制造 synthetic ID；不做 Explore；不做 UI 视觉设计（属 F21）。

## Acceptance Criteria

- [x] 单目录清单显式配对；搬迁可读、越界与错误哈希拒绝；正常资料包默认框架图。
- [x] 未保存审核在失败/取消加载时保留；跨文档与旧异步回复隔离；仅用户保存才写审核文件。
- [x] Plan 权威字段保持；Generated Unknown / Missing / FAIL 分开披露；Preview 复用 renderer。
- [x] 两条核查路径**分别存在且不得合并**：
      `Block → sourceUnitIds → SU → §N → source section` 与
      `Block → reviewObjects → DEC/GAP/Q/FACT → evidence`。
      界面/投影**不得**出现 "Evidence verifies SU" 或 "Decision verifies fragment" 之类的连接。
- [x] **Claim Verification 仍为 Known Absent**：不得渲染 `Verified` / `Unverified` /
      `verification: null` 之类；"能力不存在"不得被写成"状态是未验证"。
- [x] `ProvenanceAssurance = Indeterminate` 不得渲染成 `Unsupported` / `No evidence` /
      `Missing evidence`（未分类 ≠ 已证否）。
- [x] `§N` 只解析到 section range；**不得**伪造 `exactLine`（N11）。
- [x] Evidence 无 id ⇒ 只能在父 review object 内 disclosure，**不能深链**。
- [x] Evidence Context 的 `[]` 是 Known(0)（明确"没有 evidence"），不得显示成 Unknown。
- [x] fragment 的 provenance 可 inspect，但**位置不得升格为 identity**（不能作为 Comment Anchor /
      Explore Focus / `Open in Reading` 目标）。
- [x] §6 矩阵对应 cell 更新。
- [x] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **最大的产品诱惑就是在这里"补一个 Verified badge"**。B2 的 N7 / N8 正是为这件事建的护栏；
  本 feature 第一次让那条护栏产生产品价值。
- 若发现确实需要 claim-level 结论，正确动作是**回到 Contract 与 Change Control**，
  而不是在 renderer 里先做出来。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F18-l3-inspector/verification-summary.md`
- Independent review: `docs/log/artifacts/F18-l3-inspector/subagent-review.md`（代码变更必需）
