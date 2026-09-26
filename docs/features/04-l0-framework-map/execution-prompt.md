# L0 Framework Map — Execution Prompt

> 本文件是 Feature 04 的任务书，自包含。
> 规格依据：`docs/features/03-hierarchical-architecture/README.md`（下文 §编号均指该文件）。
> 验收标准：本目录 `validation-checklist.md`。

## Context

Feature 03 已把信息架构的规格定下来：L0 不再是"四段阅读流 + 21 个 block 长列表"，而是**一屏两区** —— 主区一张元素级机制图（`framework-map`），侧区 topic 导航；`What → How → Prove → Boundary` 降级为可切换的 Reading Lens；L3 元素详情成为图上的下钻目标。

但这份规格有一个尚未验证的前提：**这套交互到底有没有用？**

> **交互假设**：分层下钻 + L0 机制图 + Topic 导航，比"四段阅读流 + 21 个 block 长列表"更容易理解。

本任务只验证这一条。**不验证方法泛化**（那是 Feature 05）。

当前可用的资产：

```text
测试文档/18-context-consumption-semantic-model.md      Fixture A，381 行
fixtures/context-consumption.overview-plan.json        87 条 sourceUnits（含 id / section / kind / statement / importance）
experiments/stage2-full/overview-preview.html          现有 baseline（四段阅读流）
```

## Constraints

**允许：**
- 手工撰写 `drafts/context-consumption.map.json`
- 生成一次性静态验证页 `drafts/l0-preview.html`（纯 HTML/CSS，用于人眼看图与 Track A 对照）
- 阅读 Fixture A 与 `overview-plan.json`（口径以其中 87 条 sourceUnits 为准）
- 撰写 `results/` 下的记录文档

**不允许：**
- 修改 `app/renderer/*`、`app/main/*`、`schema/*`
- 修改现有 11 个 shape 或 `docs/shape-catalog.md`
- 新增第 7 种元素类型，或 §5.2 列出的那 12 种类型
- 在 `edges[]` 里使用 §6.1 之外的词（含滥用 `relates-to` 兜底词）
- 让任何元素的 `sourceUnitIds` 为空
- 复用旧的 21 个 block 作为 L2 内容
- 改写 `fixtures/context-consumption.overview-plan.json` 或 `experiments/`
- 写产品化的 Stage 1a / 1b prompt
- 让 AI 直接生成最终页面替代结构化数据 + 确定性 renderer

## Task Breakdown

### Task 1.1 元素选择

按 §5.3 判据 A~F，从 Fixture A 中选出 L0 元素，给每个元素定 `type`（§5.1 六类之一）与 `role`（§5.2）。

**要求：**
- 元素总数 **≤ 12**（判据 E 是硬闸门，不是建议）
- 每个元素必须填**真实**的 `sourceUnitIds` —— 从 87 条里挑，逐条核对 `statement` 确实在讲这个元素，**不得编造**
- 同时记录**被淘汰的候选**及淘汰判据（A / B / C / D 中的哪一条），写进 `results/phase1-notes.md`

**预期形态（供参考，不要照抄）：** `Frozen Context`(artifact/input) · `Generation Projection`(artifact/intermediate) · `Outline Generation`(process) · `Outline Revision`(artifact) · `Scene Generation`(process) · `Scene`(artifact/output) · `Context Consumption`(concept) · `Consumption ≠ Alignment`(constraint)

### Task 1.2 主轴与侧挂

- **主轴**：`process` 与 `artifact` 交替的链，用 `edges[]` 表达，**只用 §6.1 的 8 个词**，方向遵守主动语序（§6.2）
  - ⚠️ "主轴 + 侧挂"只是**一种**布局策略（§3.3）。若这篇文档的部分内容天然不是链式，**不要硬凑主轴**
- **侧挂**：`concept` / `constraint` / 反例写进 `attachments[]`，**不写成 edge**（§6.4）
- `thesis`（**可选**）：一句话说明这篇文档提出的机制。原文若没有明确的中心命题，**留空即可**
- `topics[]`：`title`（短标题）+ `proposition`（一句命题）；每个元素用 `topics` 标出归属

### Task 1.3 边界与反例

Fixture A 有 38% 是负向内容（§5.5）。按判据 C 筛出**架构上决定性的**边界与反例（通常 3~5 条），用 `constraint` + `attachments` 进图；其余不强行上图，但要确认它们能在 L1 / L2 找到承载位置。

### Task 1.4 三种 coverage 自查

按 §7 分三层自查，**不要混成一个数字**：

```text
A. Framework Map invariant（§7.1）：F1 provenance · F2 容量 ≤12 · F3 不要求 Topic 有 element
B. Navigation invariant（§7.2）  ：N1 Topic 至少挂 element 或 block
                                   N2 每个 block 至少一个入口（文档级入口除外）
                                   N3 每条 Semantic Unit 有可达路径 —— 目标：完全无路径 = 0
C. Semantic Coverage（§7.3）     ：由 check-overview 负责，本 feature 不重复判定
```

输出到 `results/verification-output.txt`。

> **Topic 与 L0 element 是解耦的**：Topic 可以只挂 `blockIds`。推导顺序必须是
> 「先判断有哪些认知 Topic → 再分配所有 Block → 最后查 Reachability」，
> **不得**「发现 orphan block → 为它新建一个 Topic」。Topic 由语义内聚决定，不由 coverage repair 决定（§10.1）。

### Task 1.5 Structural Reachability Test + Track A worksheet

**1) Structural Reachability Test（自动化，本任务范围内）**

对 10 道有确定答案的问题，算从入口到答案的跳数：

```text
0 跳 = 首屏可见（document metadata / 元素标签 / topic 命题）
1 跳 = 点元素 → L3
2 跳 = 经 Topic → L2
∞   = 无路径
```

它**只**回答"有没有完全无路径的内容 / 要几层"。**不要**把它当成 Track A 的胜负指标。

**2) Track A worksheet（人工，准备清单即可）**

按 03 §11.3 的六项指标出 worksheet（找到答案耗时 / 不打开原 Markdown 的答题正确率 / 首屏信息单元数 / 错误进入 Topic 次数 / 返回重选次数 / 主观负担）。

> `Time to answer` 比 hop count 有意义得多。人工部分未完成时，本 feature 只能判 **TECHNICAL PASS / UX VALIDATION PENDING**。

## Verification

```text
[ ] 元素总数 ≤ 12
[ ] 每个元素有 type / role / topics / 非空 sourceUnitIds
[ ] edges 的 type 全部在 8 词表内；from / to 都存在于 elements[]
[ ] 方向全部读得通（"A 动词 B"）；未用兜底词 relates-to
[ ] concept / constraint 没有出现在 edges[]；主轴只有 process / artifact
[ ] 判据 B：每个元素至少参与一条 edge 或 attachment
[ ] F3：没有任何"每个 Topic 必须有 element"的要求
[ ] N1 / N2 / N3 全部通过，**完全无路径 = 0**
[ ] 文档级入口（document.scope / nonGoalSummary）没有被硬造出一个 Topic
[ ] Structural Reachability 结果已记录，且没有被读成"胜负"
[ ] Track A worksheet 六项指标齐备
[ ] 被淘汰候选及淘汰判据已记录
```

详细清单见 `validation-checklist.md`。

## Deliverables

```text
docs/features/04-l0-framework-map/
├── drafts/
│   ├── context-consumption.map.json   目标态 framework-map（mapVersion 2）
│   ├── l0-preview.html                一次性静态验证页（非产品代码）
│   └── build-l0-preview.js            构建静态页的一次性脚本
└── results/
    ├── phase1-notes.md
    ├── verification-output.txt
    ├── structural-reachability.txt
    ├── structural-reachability.md
    └── track-a-worksheet.md
```

**不要**产出：新的 schema、校验器脚本、renderer 改动、生成 prompt。这些属于 Feature 06 / 07 / 08，且都在 Feature 05 的 Gate 之后。

## 报告格式

```text
元素数 N / 边数 M / 侧挂数 K / topic 数 T
Framework invariant     F1 / F2 / F3 逐项
Navigation invariant    N1 / N2 / N3 逐项，含"完全无路径 = ?"
Structural Reachability 十题跳数分布（0/1/2/无路径）
Track A worksheet       六项指标是否齐备；人工是否已执行
淘汰项                  数量 + 主要淘汰判据
规格缺口                本次发现的、需要回写 03 的问题
遗留                    需要 Feature 05 或 06 之前解决的问题
```
