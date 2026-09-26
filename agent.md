# AI Design Review

## 项目简介

这是一个基于 **Electron** 的本地设计审阅工具，用来帮助人理解和审核 AI 参与生成的复杂技术方案。

它解决的核心问题不是“把文档变短”，而是：

> 把长篇、连续的设计文档重构成更容易理解的视觉表达，同时尽量保留原文的重要语义、边界、例外、反例、Current / Target 差异和未决事项。

用户首先通过 **Visual Overview** 理解整个方案，再进入 **Decision Review** 处理真正需要人工判断的设计决策。

---

## 核心流程

```text
Markdown Design Document
        ↓
Stage 1 · Semantic Coverage Planning
        ↓
overview-plan.json
        ↓
Validation
        ↓
Stage 2 · Visual Block Generation
        ↓
overview.generated.json
        ↓
Deterministic Renderer
        ↓
Electron Visual Overview
        ↓
Human Decision Review
```

Stage 1 负责理解文档、拆分 Semantic Units、建立覆盖关系、分组并选择视觉形状。

Stage 2 不重新设计方案，只把已经确定的语义转换成结构化的视觉内容，例如 flow、matrix、diff、ladder、checklist、walkthrough、combo 等。

HTML / UI 由确定性的 Renderer 生成，AI 不直接生成最终页面。

---

## 核心原则

### 1. 语义覆盖，而不是句子覆盖

允许合并重复论证、改变顺序、使用折叠和不同视觉形式，但重要语义不能因为“可视化”而消失。

### 2. 可视化不是摘要

目标不是把 500 行文档压缩成几张卡片，而是把散文重构成：

- 流程与拓扑
- Current / Target 对照
- 能说明 / 不能说明矩阵
- 状态组合
- 正反例
- Evidence chain
- Boundary / Non-goal 清单

### 3. AI 负责整理，不负责批准

AI 可以提出结构、关系、Decision、Gap 和 Open Question，但不能替用户批准设计，也不能把未决定事项补成确定结论。

### 4. Current、Target 和 Evidence 必须分清

文档中的目标设计不能伪装成当前现实。

仅来自 Markdown 的信息属于 document claim；未来接入源码后，才能进一步形成 source-verified evidence。

### 5. AI 输出必须可验证

项目使用 JSON Schema、`check-plan`、`check-block`、`check-overview` 等验证层，避免把 Prompt 当成唯一可靠性来源。

---

## 当前主要产物

```text
overview-plan.json
```

表示：原文有哪些 Semantic Units，以及它们如何被组织成 Visual Blocks。

```text
overview.generated.json
```

表示：Stage 2 生成的完整视觉化 Overview 数据。

```text
human-review.json
```

表示：用户真实的人工审核结果。AI 不得覆盖人工审批状态。

---

## 当前阶段

目前已经完成并验证：

- Markdown → Semantic Coverage Plan
- Semantic Units → Visual Blocks
- Shape contracts
- Semantic coverage / provenance validation
- Deterministic Overview Renderer
- Source 回查
- 完整 Overview Preview

当前重点是继续完善 **Visual Overview 的人工阅读体验**，随后再接回 Electron 主流程。

后续阶段再考虑：

```text
Markdown + Local Source Repository
        ↓
AI Evidence Requests
        ↓
按需读取相关源码
        ↓
Source-verified Evidence
```

不会一次性把整个源码仓库发送给模型。

---

## 开发约定

修改项目时优先沿用现有：

- Schema
- Shape Catalog
- Validator
- Gold Fixture
- Renderer Contract
- AI Stage 1 / Stage 2 边界

不要绕过已有验证链，也不要让 AI 直接生成 HTML 来替代结构化数据和确定性 Renderer。

项目当前最重要的判断标准是：

> 不打开原 Markdown，仅通过 Visual Overview，用户是否能够较完整、较轻松地理解整个设计方案，并在需要时回到原文核查。
