---
id: F17
title: L1 Topic Runtime
version: v0.2
status: passing
dependsOn: []
scope: {"code":["app/shared/l1-topic-projection.js","app/renderer/l0-map.js","app/renderer/app.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js","scripts/test-l1-topic-projection.js"],"docs":["docs/specs/reading-view-layer-contracts.md","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F17-l1-runtime/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-01","commands":[{"command":"node scripts/test-l1-topic-projection.js","result":"passed","output":"9 assertions passed"},{"command":"npm run selftest","result":"passed","output":"Topic to L1 to Back passed"}],"manualSmoke":"2026-10-06 用户在 L1 修正版交付后反馈“看着也算还行，接下来做L2的内容？”。按本轮实际界面验收接受并推进后续记录；没有声称用户逐题复述、完成第二篇文章理解测试或认可全部分层体验。"}
completionGate: {"version":"v0.2","l3":"required","userPath":["有可绘制关系时查看 L1 主题局部/边界图；无关系时查看合法 summary","Topic → L1 → 返回恢复现场，已有投影语义不改变"],"integrationEvidence":["2026-10-01 projection 与 Topic/Back 已通过；这些是技术基线，不证明视觉体验完成","2026-10-06 用户接受 L1 修正版并要求推进 L2；准确反馈与范围见 Completion evidence"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F17 L1 Topic Runtime

> **2026-10-03 重新打开**：投影、边界分类和导航证据保留；有关系时的边界图未实现，原 passing 结论撤回。F23 补齐展示并完成实际用户验收后，按本合同复核关闭。

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
- 本 feature 保留投影和语义范围；视觉补齐由 F23 实施，F21 的键盘/性能证据不能替代该项。
- 不因为 `blockIds` 缺失就发明 Topic 的内部结构。

## Acceptance Criteria

- [x] membership 由 `element.topics` 反向推导；**一个 element 属于多个 Topic 合法**，不得强制单一 owner。
- [x] 边界分类是**纯集合运算**：Internal / Crossing / External；只有 relation contract 明确有方向语义时
      才拆 Inbound / Outbound；`relates-to` **不得**被方向化。
- [x] `Inside(T) = ∅` 是合法 `Known(0)`：不得解释为"Topic 无效"，也不得从 crossing edge 自动补元素。
- [x] Block Organization 三态（`Unknown` / `Known(0)` / `Known(n)`）**不得合并**；
      Unknown 与 Known(0) 的用户结果都是"没有 Block 入口"，但**不得合并成同一句话**。
- [x] 为空的 boundary relation class 保持空语义，但**不要求为它绘制空画布**（knowledge state ≠ visual footprint）。
- [x] **内部关系为空时不得伪造**（实测 D 的 21 个 Topic 里 16 个 internal = 0）。
- [x] 有可绘制关系时默认显示主题局部/边界图，关系文字仅作辅助披露；实际界面由 F23 验证。
- [x] 退化规则成立：无任何可绘制 relation 时，L1 退化为 Topic boundary summary ——
      改变 representation，**不改变 L1 identity**，也不表示数据缺失。
- [x] §6 矩阵对应 cell 更新。
- [x] 原数据/入口实现的独立审查记录已写入 artifact 目录。
- [x] 用户检查补齐后的实际界面，并明确确认局部结构与边界可理解；不能以自动化替代。

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

## F23 technical recheck — 2026-10-03

局部图、crossing-only、合法 summary 与真实导航/Preview 回归已通过，见 [F23 验证](../../../../log/artifacts/F23-l1-topic-boundary-view/verification-summary.md)。原 identity/membership/边界分类保留。2026-10-04 用户可理解性验收未通过，继续 blocked，不将自动化通过写作人工结论。

## F23 v0.2 technical recheck — 2026-10-05

节点/关系解释与无关系主题定义对照已接入，共享语义及导航回归通过，见 [v0.2 验证](../../../../log/artifacts/F23-l1-topic-boundary-view/explanation-verification.md)。原 identity/membership/边界分类未变。修正版尚待用户试读；F17 继续 blocked，不用设计确认或技术测试替代实际阅读验收。

## Actual user acceptance — 2026-10-06

2026-10-06 用户在 L1 修正版交付后反馈“看着也算还行，接下来做L2的内容？”。按本轮实际界面验收接受并推进后续记录；没有声称用户逐题复述、完成第二篇文章理解测试或认可全部分层体验。

既有技术验证及 Native 独立审查保留。本轮仅记录用户反馈并同步合同、索引和 dashboard；产品代码未变。F23 v0.2 与 F17 完成收口，F24 进入设计阶段。
