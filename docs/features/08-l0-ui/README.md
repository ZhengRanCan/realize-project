# Feature 08: L0 UI（Phase 5）

> ⏳ **等 Feature 06 的契约稳定后才开始。**
> 本 feature 是 **Feature 03 唯一必须动 UI 的地方**。

## 这个 feature 要做什么

把 03 定义的 L0 形态真正做进 renderer。

## 要产出的东西

| 项 | 内容 |
|---|---|
| 新 `content.type` | `map` —— `framework-map` 这个 shape 的渲染结构（03 §8） |
| **一屏两区** | 主区机制图 + 侧区 topic 导航（03 §3.1） |
| 元素下钻 | 点元素 → L3 元素详情（"元素在原文里的定义 + 提到它的 blocks"） |
| 深链 | 元素用 `#element-<id>`，与现有 `#block-<id>` 并存 |
| Breadcrumb | 永远知道自己在哪一层 |
| Map / Read 切换 | Map 为默认；Read 保留 `What → How → Prove → Boundary` 作为 lens |

## 两条硬约束

1. **`shape` 与 `content.type` 的命名层级要和现状一致**：`shape` 表示"这是哪种视觉表达"，`content.type` 表示"Renderer 用什么基础结构渲染" —— 正如 `shape: current-target-flow` ↔ `content.type: flow`。
2. **AI 不生成 HTML。** 页面一律由确定性 renderer 从结构化数据渲染。

## 明确不做

- ❌ 不新增 shape 语义、不改现有 11 个 shape
- ❌ 不推翻现有 renderer 的其它视图（Decisions / Source 回查）
- ❌ 不让 AI 直接产出最终页面
- ❌ 不把布局写死：Framework Map 的具体拓扑随文档类型变化（03 §3.3），UI 不能假设"一定有主轴"

## 验证方式

沿用现有两条自动化手段：

```text
npm run selftest            断言默认展开的区块实际渲染
npm run verify-preview      加载生成的 preview 并断言 DOM
```

本 feature 需要为 L0 增补断言：机制图渲染、topic 导航渲染、元素可点、`#element-<id>` 可定位。

## 前置条件（开工检查）

- [ ] Feature 06 的契约与校验器可用
- [ ] 至少有一份**通过校验**的 `framework-map` 数据可渲染（来自 Feature 04/05 的手工图或 Feature 07 的生成结果）
- [ ] L0 的形态在 Feature 05 的 Gate 后没有再变（否则 UI 要跟着改）

## 状态

- **创建时间**：2026-09-26
- **状态**：阻塞（等 Feature 06）
- **待补文档**：`execution-prompt.md` · `validation-checklist.md`
