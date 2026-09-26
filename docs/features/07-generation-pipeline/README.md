# Feature 07: Generation Pipeline（Phase 4）

> ⏳ **等 Feature 05 的 Gate 通过、且 Feature 06 的契约就绪后才开始。**

## 这个 feature 要做什么

让 **AI 能生成** L0 + Topic + L2 的内容，而不是靠手工。

03 §12 把 Stage 1 拆成了两步，理由是：现在 Stage 1 要干四件事（拆 units / 抽框架图 / 抽象 topics / 每个 topic 配块），塞进一个 prompt 会很不稳。

```text
Stage 1a「理解」  读完整篇 → sourceUnits + framework-map + topics
Stage 1b「配块」  逐 topic 决定需要几个 block、什么 shape、覆盖哪些 units
Stage 2          单块生成（现有能力，基本不变）
```

拆开的好处：1a 的产物**就是那张框架图**，可以单独生成、单独验证、单独看效果；1b 可以**逐 topic 重试**（与现有 Stage 2 分块重试同一思路）。

## 要产出的东西

```text
Stage 1a 的 prompt（新产品阶段）
Stage 1b 的 prompt（按 topic 配块）
运行脚本（复用现有 ai-plan.js / ai-block.js 的传输层重试与失败处理策略）
新版 Gold overview-plan（含 hierarchy）
对比报告（AI 输出 vs Gold）
```

## Gold 需要重建

采用新方案后，**旧的 Gold 对标基线作废**（03 §13）：

| 资产 | 命运 |
|---|---|
| `sourceUnits` 87 条 | ✅ 保留 |
| 旧的 21 个 block 切法 | ❌ 作废 |
| `check-plan` 中与切法相关的规则 | 🔧 重写 |
| `ai/stage1-plan.prompt.md`（fingerprint `62e8e544c69dd32c`） | 🔧 重写；此前三次对比结论不再可用 |
| 11 个 shape | ✅ 保留 |
| `stage2-block.schema.json` / `check-block.js` | ✅ 不动 |

## 实验方式

沿用项目已有的验证纪律：

- 同一输入**至少跑 3 次**
- **不要**要求 topic id / 数量 / 标题完全一致（不现实）
- 比较：Block Coverage / Semantic Stability / Grouping Stability / Overfitting Check（03 §11.4）

## 明确不做

- ❌ 不接 Electron 主流程
- ❌ 不改 `stage2-block.schema.json` 的既有语义
- ❌ 不复用旧 21 个 block 的切法
- ❌ 不让 AI 直接生成 HTML
- ❌ 不因为某次运行不满意就改 prompt 重跑到好看为止（要留失败记录）

## 前置条件（开工检查）

- [ ] Feature 05 的 `Gate = PASS`
- [ ] Feature 06 的 `framework-map.schema.json` + `check-map` 可用
- [ ] 上游网关稳定（此前有 503 导致产物被覆盖的事故，见 Feature 01 的 O-16 记录）

## 状态

- **创建时间**：2026-09-26
- **状态**：阻塞（等 Feature 05 Gate + Feature 06）
- **待补文档**：`execution-prompt.md` · `validation-checklist.md`
