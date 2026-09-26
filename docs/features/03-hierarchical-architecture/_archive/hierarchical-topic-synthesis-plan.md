# Feature 03（改进版）：Hierarchical Document Model + Topic Synthesis

## 1. 目标

把 AI 生成的长篇技术设计文档，编译成一个可以：

- 看图；
- 下钻；
- 追踪关系；
- 按需展开；
- 回查原文；

的交互式设计模型。

本 Feature 不再把 `What → How → Prove → Boundary` 当作产品主信息架构，而是把它保留为一种 **Reading Lens**。

产品主信息架构调整为：

```text
Document
  ↓
L0 Document Map
  ↓
L1 Topic / Module Map
  ↓
L2 Visual Blocks
  ↓
L3 Element Detail
```

其中 `Source / Provenance` 不是最后一级，而是贯穿所有层级的纵向溯源能力。

---

# 2. 这次改进要解决的核心问题

当前 Context Consumption 示例已经证明：

- 21 个 Visual Blocks 可以被人工重新组织成更容易理解的 5 个 Topics；
- L0 → L1 → L2 的层级式阅读方式，理论上比 21 个 Block 长列表更符合人的认知方式；
- Topic 之间可以存在有意义的关系，例如 `defines`、`produces-evidence-for`、`constrains`。

但当前方案存在一个关键风险：

> **把“Context Consumption 这一个例子如何划分 Topic”过早提升成“任意技术文档都应该如何划分 Topic”的产品规则。**

当前 5 个 Topics：

```text
三级语义模型
生成链路与消费点
Consumption Evidence
两条链的边界
产品边界与非主张
```

只能视为：

```text
Gold Topic Decomposition Example
```

不能视为：

```text
Generic Topic Architecture
```

同理，T-02 当前使用的：

```text
Current / Target
Rationale
Mapping
Entry Points
```

是一个适合“生成链路与消费点”这个 Topic 的 L1 表达，不能成为所有 Topic 的固定结构。

---

# 3. 三个必须分开的概念

## 3.1 Hierarchy：控制认知层级

回答：

> 用户现在应该从哪个抽象层级理解文档？

```text
L0 Document Map
  ↓
L1 Topic Map
  ↓
L2 Visual Blocks
  ↓
L3 Element Detail
```

Hierarchy 解决的是：

> 文档太大，一次看不完。

---

## 3.2 Graph：表达对象之间的关系

回答：

> 这些 Topic / Block / Decision / Field 彼此是什么关系？

例如：

```text
Topic ↔ Topic
Block ↔ Decision
Block ↔ Block
Field ↔ Field
Element ↔ Source
```

Graph 不是一个固定层级，而是各层级背后的统一关系模型。

---

## 3.3 Shape：表达局部内容

回答：

> 到了某个具体设计问题后，应该用什么视觉形式表达？

继续复用当前已经验证过的 Shape：

```text
flow
current-target-flow
matrix
capability-matrix
diff
ladder
walkthrough
combo
checklist
two-column-comparison
prose
```

Shape 解决的是：

> 一个局部问题怎么表达得更容易理解。

---

# 4. L0 / L1 / L2 / L3 的职责

## L0 — Document Map

L0 只回答：

> **这篇设计主要在讨论哪几件事情？**

L0 不应该直接显示几十个 Blocks，也不应该只是复制 Markdown 章节标题。

推荐默认展示：

- Topic 标题；
- 一句话摘要；
- 一个核心问题；
- Topic 间少量关键关系；
- 可选的 importance；
- Block 数量只作为辅助信息。

示例：

```text
Context Consumption

├─ 三级语义模型
├─ 生成链路与消费点
├─ Consumption Evidence
├─ Context vs Output 的职责分离
└─ 产品边界与非主张
```

L0 的目标不是“准确展示全部细节”，而是让用户第一次打开文档时能快速回答：

> 这篇文档主要在解决哪些设计问题？

---

## L1 — Topic / Module Map

L1 回答：

> **这个 Topic 内部由什么组成？用户可以从哪些角度深入？**

L1 不能写死成：

```text
Current
Target
Rationale
Mapping
```

因为不同 Topic 的内部结构不同。

一个通用 L1 Topic 只需要保证：

- Topic 标题；
- Topic Summary；
- Key Question；
- Entry Points；
- 相关 Blocks；
- 相关 Topic Relations；
- Source / Provenance。

Topic 具体内部如何可视化，可以根据内容类型不同而变化。

例如：

### 生成链路 Topic

可能适合：

```text
Flow + Current/Target + Rationale
```

### Data Model Topic

可能适合：

```text
Entity Map + Schema Groups + Lifecycle
```

### Permission Topic

可能适合：

```text
Actors + Resources + Rules + Exceptions
```

因此：

> **L1 Topic Model ≠ 某一种 Topic Visualization。**

---

## L2 — Visual Blocks

L2 继续复用现有 Visual Blocks。

例如：

```text
Topic: Generation Pipeline
  ├─ O-04 current-target-flow
  ├─ O-04b checklist
  └─ O-04c matrix
```

当前 Stage 1 / Stage 2 已经验证的 Block Pipeline 不需要推翻。

---

## L3 — Element Detail

L3 以后用于单对象聚焦，例如：

```text
Field
Node
Decision
Rule
State
Constraint
API
Entity
```

L3 不是本轮重点。

当前先保证 L0 / L1 / L2 成立。

---

# 5. Topic 的通用定义

## 5.1 Topic 是什么

Topic 定义为：

> **一组围绕同一个核心设计问题、设计对象或设计责任形成的高内聚语义集合。**

一个好的 Topic 应该让用户只看：

```text
Title
Summary
Key Question
Relations
```

就能理解：

> 这部分设计在讨论什么。

---

## 5.2 Topic 不是什么

Topic 不是：

- Markdown 一级标题的改名；
- What / How / Why 的固定分类；
- 固定的 Architecture / Data / Flow 分类；
- 为了凑数量硬拆出来的组；
- 把每 2–3 个 Block 机械打包后的结果。

必须允许：

```text
一个 Topic 跨多个章节
一个章节拆进多个 Topics
一个 Block 属于多个 Topic（必要时）
```

---

# 6. Topic Synthesis：通用 AI 任务

## 6.1 不直接从 Markdown 猜 Topics

Topic Synthesis 不建议直接执行：

```text
Markdown → Topics
```

而应该建立在已经较稳定的语义分析结果之上：

```text
Markdown
   ↓
Stage 1
Semantic Coverage Planning
   ↓
Semantic Units + Planned Blocks
   ↓
Stage 1.5
Topic Synthesis
   ↓
Topics + Relations + Block Membership
   ↓
Stage 2
Block Generation
```

Stage 1 与 Stage 1.5 回答两个不同问题：

```text
Stage 1
原文到底说了什么？

Stage 1.5
这些内容从人的认知角度可以归成哪几件事？
```

实验阶段应保持这两个任务独立。

等验证稳定后，再决定是否合并模型调用。

---

## 6.2 Topic Synthesis 的输入

第一版输入：

- Semantic Units；
- Planned Blocks；
- Block title / carries / sourceRefs / shape；
- 必要的 Review Object 关联；
- 不输入最终 Stage 2 文案。

---

## 6.3 Topic Synthesis 的输出

建议第一版保持简单：

```json
{
  "topics": [
    {
      "id": "T-01",
      "title": "...",
      "summary": "...",
      "keyQuestion": "...",
      "importance": "core",
      "blockIds": ["O-01", "O-02"],
      "sourceUnitIds": ["SU-001", "SU-002"]
    }
  ],
  "relations": [
    {
      "from": "T-01",
      "to": "T-02",
      "type": "depends-on",
      "label": "..."
    }
  ]
}
```

暂时不要把 T-02 的 `flow-with-rationale` 写进通用 Topic Schema。

---

# 7. Topic Relation 第一版

当前 Context Consumption 中出现过：

```text
defines
produces-evidence-for
separates
constrains
```

这些可以保留为实例。

但第一版通用 Relation Type 不要设计得太细。

建议只保留少量通用关系：

```text
depends-on
constrains
produces
contrasts-with
relates-to
```

具体语义尽量通过 `label` 表达。

例如：

```json
{
  "from": "T-02",
  "to": "T-03",
  "type": "produces",
  "label": "生成链路产生 Consumption 判定所需证据"
}
```

未来真实文档足够多后，再考虑扩展 Relation Ontology。

---

# 8. Topic Quality：不要用固定 Topic 数代替质量判断

当前 `3–7 Topics` 可以保留，但必须降级为：

> **Presentation Heuristic，而不是 Semantic Rule。**

推荐：

```text
Preferred: 3–7 Topics
Allowed:   2–10 Topics
> 10:      Warning — 可能没有完成足够抽象
1 Topic:   Warning — 可能没有形成有用拆解
```

同理：

```text
每个 Topic 2–6 blocks
```

不能作为 Hard Rule。

真正需要检查的是下面五项。

---

## 8.1 Coverage

所有 Blocks 是否都能被 Topic Map 解释？

```text
assigned blocks / total blocks
```

Core Block 没有 Topic → Hard Error。

Supporting Block 没有 Topic → Warning。

---

## 8.2 Cohesion

一个 Topic 内部的 Blocks 是否在回答同一个设计问题？

例如：

```text
Topic: Generation Pipeline

Current / Target
Why Outline
Responsibility Mapping
```

属于高 cohesion。

如果同一个 Topic 同时混入：

```text
Authentication
Deployment
UI Theme
```

则属于低 cohesion。

第一版可以人工判断，不急着自动评分。

---

## 8.3 Separation

两个 Topic 是否实际上在讲同一件事？

例如：

```text
Generation Flow
Outline Consumption Architecture
```

若大部分 Blocks 高度重合，应提示可能需要合并。

---

## 8.4 Abstraction

Topic 是否只是复制章节标题？

必须允许 Topic 跨章节重组语义。

如果 Topic 与 source section 几乎 1:1，则给 Warning：

```text
possible section mirroring
```

---

## 8.5 Cognitive Usefulness

只看：

```text
Topic Titles
Key Questions
Relations
```

用户是否可以基本回答：

> 这篇设计主要在解决什么？

这是 Topic Synthesis 最终的人工验收标准。

---

# 9. Context Consumption 的角色重新定义

当前 Context Consumption 的 5 Topics、L0 Map、T-02 L1 Map 全部保留。

但它们的角色修改为：

```text
Gold Fixture A
Semantic / Architecture-heavy Document
```

用途：

1. 验证 L0 → L1 → L2 UX；
2. 作为 Topic Synthesis 的第一份人工 Gold；
3. 用于比较 AI 是否能得到语义上相近的聚类；
4. 不能作为 Prompt 中唯一的 Topic 示例。

当前五个 Topic 不属于产品 Schema。

---

# 10. 必须增加不同类型的 Gold Fixtures

单个 Context Consumption 文档无法证明 Topic Synthesis 能泛化。

至少需要三类文档。

## Fixture A — Semantic / Architecture Heavy

当前：

```text
Context Consumption
```

可能自然形成：

```text
Concept Model
Generation Pipeline
Evidence
Responsibility Boundary
Product Boundary
```

---

## Fixture B — Data Model Heavy

应故意包含：

- 多个实体；
- 大量字段；
- nested schema；
- object references；
- lifecycle；
- schema evolution；
- current / target schema。

它可能自然形成：

```text
Core Entities
Ownership
Relationships
Lifecycle
Schema Evolution
```

重点验证：

> AI 会不会仍然强行生成 Evidence / Boundary 这类 Fixture A 的 Topic。

---

## Fixture C — Process / Operational Heavy

应故意包含：

- execution flow；
- queue；
- retry；
- timeout；
- concurrency；
- failure recovery；
- observability。

它可能自然形成：

```text
Execution Flow
Concurrency
Retry Strategy
Failure Recovery
Observability
```

重点验证：

> Topic 是否来自当前文档自己的结构，而不是第一个 Gold Fixture。

---

# 11. Stage 1.5 Topic Synthesis Protocol

第一版 Prompt 的核心要求应围绕“聚类依据”，而不是具体 Topic 名称。

建议协议：

```text
你的任务不是总结章节，也不是复制标题。

你已经获得：
- Semantic Units
- Planned Visual Blocks

现在需要把这些内容组织成少量 Topic，供用户在 Document Map 上理解整篇文档。

一个 Topic 必须围绕：
- 同一个核心设计问题；或
- 同一个设计对象；或
- 同一个设计责任。

优先考虑：
1. 哪些 Blocks 必须一起看才能形成完整理解？
2. 哪些 Blocks 虽来自不同章节，但实际讨论同一问题？
3. 哪些 Blocks 属于明显不同的认知任务，不应放在一起？
4. 用户只看 Topic title + keyQuestion 时，是否能理解文档主要在讲什么？

不要：
- 按 Markdown heading 机械分组；
- 套用固定的 Architecture / Data / Evidence / Boundary 分类；
- 复刻示例文档中的 Topic 名称；
- 为了满足 Topic 数量而强拆或强合并。
```

---

# 12. Topic Validator

新增：

```text
check-topic-map
```

## Hard Error

至少检查：

1. Topic ID 重复；
2. Topic 引用不存在 Block；
3. Relation 引用不存在 Topic；
4. Core Block 没有属于任何 Topic；
5. Topic 没有任何 Block；
6. 同一 Topic 内 Block ID 重复；
7. AI 修改了原 Block 的固定字段。

## Warning

至少检查：

1. Topic 数 > 10；
2. Topic 数 = 1；
3. 单个 Topic 包含过多 Blocks；
4. 两个 Topic 的 Block overlap 过高；
5. 某 Topic 覆盖全文绝大多数 Blocks；
6. Topic 标题高度接近 source section title；
7. Topic 没有 keyQuestion；
8. Relation 过多导致 L0 Map 视觉混乱。

不要要求：

```text
exactly 5 Topics
exactly 2–6 Blocks per Topic
```

---

# 13. Topic Synthesis 实验方式

对三类 Fixtures 分别至少运行 3 次。

不要要求：

- Topic ID 完全一致；
- Topic 数完全一致；
- Topic title 完全一致。

重点比较：

## 13.1 Block Coverage

```text
assigned core blocks / total core blocks
```

---

## 13.2 Semantic Stability

同一个核心问题是否在多次运行中稳定成为独立 Topic 或稳定被某个 Topic 承载？

---

## 13.3 Grouping Stability

AI 是否在多次运行中把语义相近 Blocks 大体聚在一起？

---

## 13.4 Overfitting Check

不同类型文档是否产生自己的 Topic 结构？

如果 Data-heavy 文档仍然出现：

```text
Consumption Evidence
Product Boundary
```

说明 Prompt 被 Fixture A 锚定。

---

## 13.5 Human Usefulness

人工只看 L0：

```text
Topic title
summary
keyQuestion
relations
```

是否能在短时间理解文档的主要设计空间？

---

# 14. L1 的通用 Contract

当前 T-02 的 `flow-with-rationale` 继续保留为 Gold L1 Example。

但第一版通用 L1 Contract 建议只包含：

```json
{
  "topicId": "T-02",
  "title": "...",
  "summary": "...",
  "keyQuestion": "...",
  "entryPoints": [
    {
      "id": "EP-01",
      "label": "...",
      "description": "...",
      "blockIds": ["O-04"]
    }
  ],
  "relatedTopics": [
    {
      "topicId": "T-01",
      "relation": "depends-on",
      "label": "..."
    }
  ]
}
```

不要把：

```text
current
target
rationale
mapping
```

设为所有 Topic 的固定字段。

这些属于某些 Topic 的视觉表达。

---

# 15. UX 验证与通用 AI 验证必须分开

## Track A — Example UX Validation

继续使用 Context Consumption。

目标：

> 验证 L0 → L1 → L2 是否比 21 Block 长列表更舒服。

可以继续实现：

- L0 Document Map；
- T-02 L1 Topic Map；
- Breadcrumb；
- Map / Read 切换。

这条线不证明 AI 泛化。

---

## Track B — Generic Topic Synthesis Validation

目标：

> 验证 AI 能否从不同类型技术文档中发现自己的 Topics。

必须至少使用：

- Semantic-heavy；
- Data-heavy；
- Process-heavy。

Track B 通过后，才把 Topic Synthesis 正式接进产品 Pipeline。

---

# 16. Reading Lens 的定位

当前：

```text
What → How → Prove → Boundary
```

不删除。

但它降级为：

```text
Reading Lens
```

默认体验：

```text
Map Mode
L0 → L1 → L2
```

用户需要顺序阅读时：

```text
Read Mode
What → How → Prove → Boundary
```

两者复用同一批 Blocks。

---

# 17. Graph 的定位

Knowledge Graph 不作为新的 Level。

正确模型是：

```text
底层 Semantic Graph
        ↓
不同 Level 选择不同节点和边进行投影
```

例如：

## L0

```text
Topic ↔ Topic
```

## L1

```text
Topic ↔ Entry Point ↔ Block
```

## L2

```text
Block ↔ Decision ↔ Concept
```

## L3

```text
Field ↔ Field ↔ Entity ↔ Source
```

Graph Mode 可以以后作为独立视图增加，但不应破坏 Hierarchy。

---

# 18. 实施顺序

## Phase 1 — 保留现有 Gold Example

完成：

- Context Consumption L0 Gold；
- T-02 L1 Gold；
- 当前 21 Blocks；
- UX validation plan。

不要继续把这 5 Topics 写成通用规则。

---

## Phase 2 — 定义 Topic Contract

完成：

- `topic-map.schema.json`；
- `topic-synthesis.prompt.md`；
- `check-topic-map`；
- 自动测试。

此阶段不修改 Renderer。

---

## Phase 3 — 建立 3 类 Gold Fixtures

完成：

```text
A Semantic-heavy
B Data-heavy
C Process-heavy
```

每篇人工给出合理的 Topic decomposition。

目的不是制造唯一答案，而是建立泛化测试集。

---

## Phase 4 — Topic Synthesis Experiment

流程：

```text
Stage 1 Gold / Generated Plan
        ↓
Stage 1.5 Topic Synthesis
        ↓
check-topic-map
        ↓
run × 3
        ↓
compare
```

先验证泛化，不接 Electron。

---

## Phase 5 — Mock UI

在 Topic Synthesis 的 Contract 稳定后，再正式实现：

```text
L0 Document Map
L1 Topic Map
Breadcrumb
Map / Read
```

Context Consumption 仍作为第一个 UI Fixture。

---

## Phase 6 — Pipeline Integration

验证通过后：

```text
Markdown
   ↓
Stage 1 Semantic Coverage Planning
   ↓
Stage 1.5 Topic Synthesis
   ↓
Stage 2 Block Generation
   ↓
Interactive Design Model
   ↓
Electron
```

---

# 19. 当前明确不做

本轮暂不：

- 建完整知识图谱数据库；
- 实现 L3 Element Detail；
- 增加 Data Model 专项 Shape；
- 让 Topic Synthesis 直接读取源码；
- 把 Topic 数写死为 5；
- 把 T-02 的 `flow-with-rationale` 设成通用 Topic Schema；
- 让 AI 直接从 Markdown 输出 UI；
- 推翻现有 Stage 1 / Stage 2；
- 重写现有 11 个 Shape；
- 接入 Phase 3 Source Evidence。

---

# 20. 成功标准

## Product UX

用户第一次打开一篇长技术文档时：

- 不需要先面对几十个 Blocks；
- 可以快速知道文档主要讨论哪些设计问题；
- 可以点击 Topic 逐层下钻；
- 可以随时回查 Source；
- 可以在 Map / Read 两种模式之间切换。

---

## Topic Synthesis

对于明显不同类型的技术文档：

- AI 能产生不同的 Topic 结构；
- Topic 不是源章节的机械映射；
- Core Blocks 均有 Topic 归属；
- Topic 内部具有较强语义内聚；
- Topic 之间具有明显区分；
- Topic 数量保持认知可管理，但不追求固定数量；
- 不出现明显 Fixture Overfitting。

---

# 21. 最终产品模型

最终要构建的不是：

```text
Markdown → Overview
```

而是：

```text
Markdown
   ↓
Semantic Compilation
   ↓
Interactive Design Model
```

这个 Design Model 同时拥有：

```text
Hierarchy
────────────
Document
  ↓
Topic
  ↓
Block
  ↓
Element

Graph
────────────
Topic ↔ Topic
Block ↔ Block
Block ↔ Decision
Field ↔ Field
Element ↔ Source

Shape
────────────
负责每一个局部设计问题的视觉表达
```

核心原则：

> **Hierarchy 决定用户看哪一层；Graph 告诉用户这些东西怎么关联；Shape 决定一个局部问题如何表达；Source 保证所有内容都可以追溯。**

