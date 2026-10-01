# Architecture

## Module boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| `app/renderer/`（UI / delivery） | 两页导航、四段 Overview、决策卡片、Source 回查面板、L0/L1/L2 渲染布局 | 文件访问、契约判定、模型调用；不得读取 `model.overview` 或解释 source / review relationship 状态 |
| `app/main/`（Electron main） | 文件读写、Schema 与一致性校验、`human-review.json` 的原子保存与合并、自检入口；将已验证 Overview 交给 L2 projection | 领域判定逻辑、UI 决策 |
| `app/shared/`（shared semantics） | Gate / reviewLevel / category / Evidence 级别的**单一事实来源**；极简 draft-07 校验器；一致性检查；L2 semantic projection | 框架特有展示细节、文件 I/O |
| `schema/`（contracts） | 各阶段产物结构（design-review / overview-plan / stage2-block / framework-map / map-selection / semantic-inventory） | 判断层规则（放在契约文档与 validator 里） |
| `scripts/`（pipeline + validators） | 抽取、校验、生成、装配、报告：`check-*`、`ai-*`、`assemble-overview`、`full-run-report`、`harness-gate` | UI 渲染 |
| `ai/`（prompts） | Stage A/B 与 Stage 1/2 的提示词文本 | 产物结构定义（以 `schema/` 为准） |
| `fixtures/` | Gold 输入与期望产物（`context-consumption.json`、`.overview-plan.json`、`human-review.sample.json`） | 运行时人工结果（`human-review.json` 在仓库根目录且不入库） |
| `experiments/` | 原始 run 产物与报告（每个 run 一个独立目录） | 被产品直接读取的数据 |
| `docs/log/artifacts/` | 每个 feature 的耐久证据与历史材料 | 体积大的生成产物 |

## Pipeline

```text
测试文档/*.md（Fixture A–E）
   ↓ Stage A   semantic inventory      schema/semantic-inventory.schema.json
   ↓ Stage B   framework map（L0）      schema/framework-map.schema.json + scripts/check-map.js
   ↓ Stage 1b  map selection            schema/map-selection.schema.json
   ↓ Stage 1   overview plan            schema/overview-plan.schema.json + scripts/check-plan.js
   ↓ Stage 2   逐 block 生成            schema/stage2-block.schema.json + scripts/check-block.js
   ↓ assemble  overview.generated.json  scripts/assemble-overview.js + scripts/check-overview.js
   ↓ project   L2 View Model              app/shared/reading-projection.js
   ↓ render    Electron / 静态 Preview   app/renderer/*
   ↓ human     human-review.json        app/shared/semantics.js 判定 Gate
```

### 各阶段职责

| 阶段 | 负责什么 | 明确不负责什么 |
| --- | --- | --- |
| Stage A | 读完整篇文档，抽出 Semantic Unit（inventory） | 不做分组与视觉选择 |
| Stage B | 在 Selection 压力下把 inventory 落成 L0 `framework-map` 与 `map-selection` | 不重新解释原文、不做 block 切法 |
| Stage 1b | 逐 topic 决定需要几个 block、什么 shape、覆盖哪些 units | 不生成内容 |
| Stage 1 | 理解文档、拆分 Semantic Units、建立覆盖关系、分组并选择视觉形状 | 不生成最终视觉内容 |
| Stage 2 | 把**已经确定**的语义转换成结构化视觉内容（flow、matrix、diff、ladder、checklist、walkthrough、combo 等） | 不重新设计方案、不新增语义、不改 plan 固定字段 |
| Renderer | 由确定性代码把结构化数据渲染成页面 | 不推断、不补关系、不改输入 JSON |

> **HTML / UI 由确定性 renderer 生成，AI 不直接生成最终页面。** 这是本项目最不可让路的分工，
> 对应的禁止事项写在 `CONSTRAINTS.md`；F08 的 L0 界面同样遵守（预览与产品共用同一份 renderer 模块）。

### L2 runtime boundary

`loadDesignReview()` 先完成 schema 与 semantic validation，随后调用
`projectL2Overview(model.overview)`。其输出 `L2ViewModel` 是 renderer 的唯一 Overview
输入：它保留 block identity、内容、source refs 与 `reviewObjectLinks` 的 `unknown` /
`empty` / `known` 状态；`related` 仅表示 review adjacency，绝不升级为 evidence 或
support。原始 `model` 仍只供 Gate 和人工审核语义使用。

### 关键数据产物

| 产物 | 表示什么 | 谁写 |
| --- | --- | --- |
| `overview-plan.json` | 原文有哪些 Semantic Unit，以及它们如何被组织成 Visual Block | Stage 1（`fixtures/` 下是 Gold） |
| `overview.generated.json` | Stage 2 生成并装配后的完整视觉化 Overview 数据 | Stage 2 + `scripts/assemble-overview.js` |
| `framework-map.json` / `map-selection.json` / `semantic-inventory.json` | L0 机制图、选择结果、Stage A 中间态 | Stage A / B（逐 run 落在 `experiments/`） |
| `human-review.json` | 用户**真实**的人工审核结果 | 只由用户在 UI 中显式保存 |

> AI 不得覆盖人工审批状态：`design-review.json` 侧 `decisions[].status` 恒为 `pending`，
> 人工结果单独落在仓库根目录的 `human-review.json`（不入库）。

## Data ownership

- `docs/source-sections.json` 由 `npm run source` 从被审 Markdown 切分生成，是 Source 回查的唯一定位数据；
  `app/main/main.js` 与多个 `scripts/check-*.js` 直接按该路径读取，因此保留在 `docs/` 根目录。
- `fixtures/context-consumption.json` 是人工抽取的 Gold（12 Decision / 6 Gap / 10 Open Question / 36 Evidence），
  由 `scripts/backfill-overview-blocks.js` 等脚本按 `scripts/backfill-overview-plan.js` 的口径再生；
  **不要手改**其中由脚本生成的派生字段。
- 每个 feature 的原始 run 产物属于 `experiments/`，产品侧只读取装配后的 `overview.generated.json` 与手工 fixture。

## Constraints on change

- 共享模块（`app/shared/**`、`schema/**`、`scripts/check-*.js`）的改动必须同时更新受影响的契约文档与测试；
  F01–F10 期间的经验是：`check-*` 的口径一改，历史产物会成批变红，因此改口径要单独一轮。
- 新 shape / 新元素类型 / 新关系词都属**受控词汇表扩张**，先改 `docs/specs/shape-catalog.md` 或
  `docs/specs/framework-map-contract.md`，再改 schema 与 validator。
