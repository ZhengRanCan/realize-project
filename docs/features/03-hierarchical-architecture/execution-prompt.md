# Hierarchical Document Model — Execution Prompt

> 本文件是 Phase 1 / Phase 2 的任务书。规格见同目录 `README.md`（下文所有 §编号均指该文件）。
> 验收标准见 `validation-checklist.md`。

## Context

现有管道已验证：

```text
Markdown → Stage 1（Semantic Coverage Planning）→ overview-plan.json
         → Stage 2（Block Generation）→ 21 个 Visual Blocks
         → 确定性 Renderer → Preview
```

当前状态：87 条 sourceUnits、21 个 blocks、provenance 151/151、11 个 shape 词表、若干校验器（`check-plan` / `check-block` / `check-overview`）全部可用。

**本次要改的是信息架构的第一屏**：把"四段阅读流 + 21 个 block 的长列表"改成一张可下钻的框架图（L0）+ topic 导航，`What → How → Prove → Boundary` 降为可切换的 Reading Lens。

**Phase 1 / Phase 2 都只做手工产物，不写任何产品化代码。** 这是因为当前规格（6 类元素、判据 A~F、主轴 + 侧挂布局）全部是从**一篇**文档推出来的，必须先过三类文档的泛化验证（§11），否则只是换一种方式过拟合。

## Constraints

**允许：**
- 手工撰写 framework-map JSON 草案（`drafts/`）
- 生成一次性的静态验证页（`drafts/l0-preview.html`，纯 HTML/CSS，用于人眼看图）
- 阅读 `测试文档/18-context-consumption-semantic-model.md`、`fixtures/context-consumption.overview-plan.json`（口径以其中的 87 条 sourceUnits 为准）
- 撰写 `results/` 下的记录文档

**不允许：**
- 修改 `app/renderer/*`、`app/main/*`、`schema/*`
- 修改现有 11 个 shape 或 `docs/shape-catalog.md`
- 新增第 7 种元素类型，或 §5.2 列出的那 12 种类型
- 在 `edges[]` 里使用 §6.1 之外的词（含 `relates-to` 兜底词被滥用）
- 让任何元素的 `sourceUnitIds` 为空
- 复用旧的 21 个 block（它们按阅读流切分，与 topic 无关）
- 改写 `fixtures/context-consumption.overview-plan.json` 或 `experiments/`
- 写产品化的 Stage 1a / 1b prompt（Phase 2 通过后再写）
- 让 AI 直接生成最终页面来替代结构化数据 + 确定性 renderer

## Task Breakdown

### Phase 1 — 手工验证（Context Consumption，单文档）

> **Phase 1 不等 Fixture B / C，现在就可以开始。** 它验证的是**交互假设**（Track A，§11.3）：
> 分层下钻 + L0 机制图 + Topic 导航，是否真的比 21 Blocks 长列表好。
>
> 注意：Phase 1 的图**固定的是元素与关系的语义约束**，不固定拓扑（§11.5）。不要因为这一篇文档画得出一条主链，就把主链当成 L0 的必要形态。

#### Task 1.1 元素选择

按 §5.3 判据 A~F，从文档中选出 L0 元素，给每个元素定 `type`（§5.1 六类之一）与 `role`（§5.2）。

**要求：**
- 元素总数 **≤ 12**（判据 E 是硬闸门，不是建议）
- 每个元素必须填**真实**的 `sourceUnitIds`（从 `overview-plan.json` 的 87 条里挑，不得编造）
- 同时记录**被淘汰的候选**及淘汰判据（A/B/C/D 中的哪一条），写进 `results/phase1-notes.md`

**预期形态（供参考，不要照抄）：** `Frozen Context`(artifact/input) · `Generation Projection`(artifact/intermediate) · `Outline Generation`(process) · `Outline Revision`(artifact) · `Scene Generation`(process) · `Scene`(artifact/output) · `Context Consumption`(concept) · `Consumption ≠ Alignment`(constraint) 等。

#### Task 1.2 主轴与侧挂

- 主轴：`process` 与 `artifact` 交替的链，用 `edges[]` 表达，**只用 §6.1 的 8 个词**，方向遵守主动语序（§6.2）
  - ⚠️ "主轴 + 侧挂"只是**一种**布局策略（§3.3）。如果文档天然不是链式（例如实体关系型），**不要硬凑主轴** —— 如实记录"这篇文档没有单一主轴"，这本身就是 Task 2.3 要的结论
- 侧挂：`concept` / `constraint` / 反例写进 `attachments[]`，**不写成 edge**
- 填 `thesis`（**可选**）：一句话说明这篇文档提出的机制。原文若没有明确的中心命题，**留空即可**，不要硬凑
- 填 `topics[]`：`title`（短标题）+ `proposition`（一句命题）；每个元素用 `topics` 标出归属

#### Task 1.3 边界与反例

参考文档 38% 是负向内容（§5.5）。按判据 C 筛出**架构上决定性的**边界与反例（通常 3~5 条），用 `constraint` + `attachments` 进图；其余不强行上图。

#### Task 1.4 不变量自查

按 §7 的 L0 五条不变量逐项自查。

#### Task 1.5 Track A 测量

按 `validation-checklist.md` 的 Track A 方法，对 baseline（现有 `experiments/stage2-full/overview-preview.html`）与 candidate（`drafts/l0-preview.html`）各测一遍，记录：正确率、定位耗时、**是否翻开了原 Markdown**。

### Phase 2 — 跨文档类型验证（Gate）

> **需要用户提供两篇文档**：一篇 Data Model heavy、一篇 Process / Operational heavy（§11.2 的 Fixture B / C）。
> 在拿到文档之前，Phase 2 处于阻塞状态，不要用自己编写的假文档代替。

#### Task 2.1 确认 Fixture B / C

与用户确认两篇文档，记录来源与 `document.id` / `title` / `sourcePath`。

#### Task 2.2 各做一版手工图

对 B 和 C 分别重复 Task 1.1 ~ 1.4，产出 `drafts/fixture-b.map.json`、`drafts/fixture-c.map.json`。

#### Task 2.3 回答三个关键疑问（§11.1）

```text
疑问 1：Data-heavy 文档画得出机制链吗？
        → 如果不能，说明"主轴 = 机制链"这个前提不成立，必须改 §3.3 / §4

疑问 2：Process-heavy 文档的机制链会不会与 topic 划分几乎重合，
        导致 L0 退化成一张普通流程图？
        → 如果重合度过高，说明 framework-map 在流程型文档上没有增量价值

疑问 3（把前两问抽象后的问题）：
        不同类型技术文档的 L0 topology 是否可能完全不同？
        → 预期答案是肯定的。请如实记录三类文档各自形成的拓扑：
          Concept-heavy  → ?
          Data-heavy     → ?
          Process-heavy  → ?
        → 特别要回答：Framework Map 是否必须存在单一主轴？（§3.3 / §16）
```

#### Task 2.4 过拟合检查（§11.4）

- 三类文档是否产生**各自不同**的结构？
- 如果 B / C 上仍然出现 `Consumption Evidence` / `Product Boundary` 这类 Fixture A 的结构，判定为 **overfitting**，Gate 不通过。

**Gate 结论只有两种：**

```text
PASS  → 可以进入 Phase 3（契约落地）
FAIL  → 回头修改 §3~§6（L0 形态与元素 ontology），不得继续往下做契约
```

## Verification

```text
Phase 1
  [ ] 元素总数 ≤ 12
  [ ] 每个元素有 type / role / topics / 非空 sourceUnitIds
  [ ] edges 的 type 全部在 8 词表内
  [ ] edges 的 from / to 都存在于 elements[]
  [ ] 每个 topic 至少被一个元素引用
  [ ] 方向全部读得通（"A 动词 B"）
  [ ] Track A 三项测量都记录
  [ ] 被淘汰候选及淘汰判据已记录

Phase 2
  [ ] B / C 两篇文档来源已确认（不是自造）
  [ ] 两张图各自通过 Phase 1 的全部检查
  [ ] §11.1 三个疑问都有明确回答（含"是否存在单一主轴"）
  [ ] 过拟合检查有结论
  [ ] Gate 结论为 PASS 或 FAIL，且理由可复核
```

详细清单见 `validation-checklist.md`。

## Deliverables

```text
docs/features/03-hierarchical-architecture/
├── drafts/
│   ├── context-consumption.map.json     Phase 1 目标态框架图
│   ├── fixture-b.map.json               Phase 2（Data-heavy）
│   ├── fixture-c.map.json               Phase 2（Process-heavy）
│   └── l0-preview.html                  一次性静态验证页（非产品代码）
└── results/
    ├── phase1-notes.md                  元素选择 + 被淘汰候选 + 淘汰判据
    ├── track-a-measurement.md           Track A 三项测量
    ├── phase2-generalization.md         §11.1 三问的答复 + 拓扑结论 + 过拟合检查
    └── verification-output.txt          自查输出（可直接贴命令结果）
```

**不要**在本次任务中产出：新的 schema、新的校验器脚本、renderer 改动、Stage 1a/1b prompt。这些属于 Phase 3 / Phase 4。

## 报告格式

完成后按以下口径汇报：

```text
Phase 1  元素数 N / 边数 M / 侧挂数 K / 不变量通过情况 / Track A 结果
Phase 2  Fixture B: 结论  Fixture C: 结论
拓扑     三类文档各自形成的拓扑类型 / 是否存在单一主轴
Gate     PASS 或 FAIL（FAIL 时必须写明是哪条疑问导致的）
遗留     需要在 Phase 3 之前解决但本次未解决的项
```
