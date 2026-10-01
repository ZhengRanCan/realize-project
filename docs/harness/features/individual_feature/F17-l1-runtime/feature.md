---
id: F17
title: L1 Topic Runtime
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/specs/reading-view-layer-contracts.md","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F17-l1-runtime/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-01","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中进入一个 Topic：确认看到的是它的语义边界（成员 / 内部关系 / 穿越边界的关系），而不是 Topic 内部被裁出来的 L0 子图"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F17 L1 Topic Runtime

> **契约待补**：详细契约在 **F11–F16 完成后**再补全。此处只固定职责边界与不可让步的约束。

## Goal

让 **Topic 边界成为真实可进入的产品层**：展示 Topic 的 membership、内部关系、穿越边界的关系，
以及"还能进入哪些已被模型明确组织出来的内容"（Layer Contracts §2 七字段）。

**L1 的独立性来自 scope transformation，而不是 entity enrichment** ——
即使它引用与 L0 完全相同的 `E-xx` 与 edge，认知意义仍然不同。

**F17 不是"给 Topic 做详情页"。** 真实数据已证明 Topic 是 **facet，不是 container**，
所以正确的 L1 围绕 `Inside(T)` / `Boundary(T)` / `Crossing(T)` / `Block Organization(T)` 构建，
回答的是：

```text
「从这个 concern 看系统，会看到什么局部与边界？」      ← 正确
「这个 Topic 拥有哪些孩子？」                          ← 错误（把 facet 重新解释成 hierarchy）
```

## Process preconditions

- F16 已完成（L2 已在 projection 上运行；provenance / review 侧链路已就绪）。
- Layer Contracts §2（L1 七字段）与 §2.9（边界分类）已冻结；Decision E 已冻结。
- 注：顺序上在 F16 之后，**不登记为 `dependsOn`**。

## Scope

### Allowed changes

- `app/renderer/app.js`、`app/main/main.js`（L1 路径消费 Topic projection）。
- `scripts/test-l0-preview.js`（共用模块约定未被破坏）。
- `docs/specs/reading-view-layer-contracts.md`、`docs/specs/reading-view-cognitive-contract.md`
  —— **仅**当需要把 Topic 的 canonical landing 从 Deferred 提升为 Present 时（见 Risks）。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- 不做 L3 / Explore；不做 L2 的进一步扩张。
- 不重设计 UI（视觉形态属 F21）。
- 不因为 `blockIds` 缺失就发明 Topic 的内部结构。

## Acceptance Criteria

- [ ] membership 由 `element.topics` 反向推导；**一个 element 属于多个 Topic 合法**，不得强制单一 owner。
- [ ] 边界分类是**纯集合运算**：Internal / Crossing / External；只有 relation contract 明确有方向语义时
      才拆 Inbound / Outbound；`relates-to` **不得**被方向化。
- [ ] `Inside(T) = ∅` 是合法 `Known(0)`：不得解释为"Topic 无效"，也不得从 crossing edge 自动补元素。
- [ ] Block Organization 三态（`Unknown` / `Known(0)` / `Known(n)`）**不得合并**；
      Unknown 与 Known(0) 的用户结果都是"没有 Block 入口"，但**不得合并成同一句话**。
- [ ] 为空的 boundary relation class 保持空语义，但**不要求为它绘制空画布**（knowledge state ≠ visual footprint）。
- [ ] **内部关系为空时不得伪造**（实测 D 的 21 个 Topic 里 16 个 internal = 0）。
- [ ] 退化规则成立：无任何可绘制 relation 时，L1 退化为 Topic boundary summary ——
      改变 representation，**不改变 L1 identity**，也不表示数据缺失。
- [ ] §6 矩阵对应 cell 更新。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **最危险的产品诱惑**：UI 开始想"用户点 Topic，当然应该看到 Topic 里面的内容"，
  于是实现慢慢变成 `Topic ├── child ├── child └── child` —— 把 facet 强行重新解释成 hierarchy。
  "内部关系为空不得伪造"这条验收就是它的守卫。
- **Topic 的 canonical landing 目前是 Deferred**（契约 §2.3）。本 feature 若要把它提升为 Present，
  必须**先改契约再改代码**，并在合同里记录；不得让实现单方面"事实上"建立 landing。
- 最容易犯的错是让 L1 退化成"L0 的一层 crop"。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
