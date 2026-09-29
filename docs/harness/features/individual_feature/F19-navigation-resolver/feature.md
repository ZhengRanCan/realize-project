---
id: F19
title: Reading Navigation and Resolver
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/renderer/l0-map.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F19-navigation-resolver/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中：从 T-05 的 occurrence 进入某个 detail → 进 Explore → 点 Open in Reading（走 resolver）→ 再按 Back（必须回到 T-05 的那个 occurrence，不是 canonical landing）"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F19 Reading Navigation and Resolver

> **契约待补**：详细契约在 **F11–F18 完成后**再补全。此处只固定职责边界与不可让步的约束。

## Goal

把 **Decision B 产品化**。当 L0–L3 真的连起来以后，主要问题不再是"画什么"，而是：

```text
用户从哪里来？现在看的是谁？点进去之后还能不能回到原来的上下文？
```

引入三项正式结构：**ReadingAddress**（我从哪里来）· **NavigationStack**（怎么回去）·
**CanonicalReadingResolver**（从零打开这个实体时在哪）。

这三项构成 Reading 与 Explore **共享的 identity / navigation substrate** ——
本 feature 必须把它设计成**可被 F20（Explore）复用**，而不是只有 Reading 能用的私有结构。
否则 Explore 会自己长出第二套 identity / navigation（见 F20 的验收）。

## Process preconditions

- F16 / F17 / F18 已完成（四层已经真的连起来，否则本 feature 没有真实场景）。
- 契约侧依据：§3.3 导航纪律、Decision B、I4（三级 identity 能力）、N10。
- 注：顺序上在 F16–F18 之后，**不登记为 `dependsOn`**。

## Scope

### Allowed changes

- `app/renderer/app.js`、`app/renderer/l0-map.js`、`app/main/main.js`。
- `scripts/test-l0-preview.js`（共用模块约定未被破坏）。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅**当 Topic / review object 的 landing
  状态发生变化时（见 Risks）。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- 不做 Explore 本身（F20）；不做 UI 打磨（F21）。
- 不为 SU / review object 发明 landing（它们的 landing 仍是 Deferred，除非先改契约）。

## Acceptance Criteria

- [ ] **`Back` ≠ `Resolve`**：`Back` 严格恢复 `NavigationStack` 里的 **ReadingAddress**
      （含 occurrence：`level` / `topicId?` / `blockId?` / `elementId?` / `anchor?`），
      **不重跑** canonical resolver，也不回首页。
- [ ] **`Open in Reading(id)` 走 resolver**：对 element 解析到唯一 `#element-<id>`；
      对 Block 解析到唯一 `#block-<id>`；多个 Topic occurrence 是**上下文**，不是多个 landing。
- [ ] **canonical landing 不依赖 occurrence**：`TopicOccurrenceState = Known(0)` 时
      `#block-O-01` 仍然存在（Decision E 的产品落点）。
- [ ] identity ≠ occurrence：同一 element 出现在多个 Topic / Block 中时，仍然只有**一个** landing。
- [ ] 未提升 landing 的实体（`SU-xxx` / review object）不得被实现"事实上"赋予 landing；
      `Open in Reading(SU)` / `Open in Reading(DEC-005)` 在契约未提升前仍不可用。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **最危险的退化**：把 `Back` 实现成"调用 resolver 回到 canonical landing" —— 那会让用户
  丢失 occurrence 上下文，而且看起来"也能用"。验收第一条就是为它设的。
- 若确实需要给 SU / review object 加 landing，**先改契约**（Decision B 的 scope 会扩大），
  再改代码。不允许实现先跑在前面。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
