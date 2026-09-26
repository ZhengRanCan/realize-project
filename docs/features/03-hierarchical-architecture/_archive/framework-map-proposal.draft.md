> ⚠️ **这是一份提案，不是 Feature 03 的现行规格。**
>
> 来源：2026-09-26 的框架讨论（进行至 19:36）。讨论过程中它曾被直接写成 `README.md`，
> 随后发现同目录下存在 `hierarchical-topic-synthesis-plan.md`（18:42 写成），两者在
> **L0 的内容 / 是否复用现有 21 个 block / 是否保留 Entry Points / L3 是否推迟** 这四点上冲突。
> 为了不留下两套互相矛盾的规格，`README.md` 已恢复原状，本提案移入 `_proposal/`。
>
> 待裁决后再决定如何与 `hierarchical-topic-synthesis-plan.md` 合并。
> 其中 §6（Coverage 不变量）、§9（阶段计划）、§10（Gold 重建计划）目前没有被任何一方否定。
>
> 下文中的 `_archive/` 引用已失效（文件已还原到原位），仅作讨论记录。

---

# Feature 03: Hierarchical Architecture (L0 → L1 → L2 → L3)

---

## 1. 概述

把产品架构从"单一线性阅读流"改为"**层级式认知地图**"：

```
Markdown（单篇文档）
      ↓  Stage 1a  理解
L0  framework-map   一张论文式框架图：机制链 + 侧挂
      ↓  点节点
L3  元素详情        元素在原文里的定义 + 提到它的 blocks
      ↓  点 topic
L1  Topic           一个 topic 的展开
      ↓  点 block
L2  Visual Blocks   复用现有 11 个 shape 的表达形式
      ↓  点 Source
     原文
```

**注意 L3 的位置**：它不再被推迟为"最后一级"，而是**从框架图直接往下钻的一层**。这落实了"Source 是纵向溯源能力，不是最后一级"。

## 2. 三层职责

| 层 | 是什么 | 回答什么 | 点它去哪 |
|---|---|---|---|
| **L0** | 框架图：机制链 + 侧挂（见 §3） | 这篇文档到底提出了什么机制 | 点元素 → L3；点 topic → L1 |
| **L1** | 一个 Topic 的展开 + 它自己的 blocks | 这部分怎么工作、为什么这么定 | 点 block → L2 |
| **L2** | blocks（复用 shape 表达形式） | 细节与论证 | 点 Source → 原文 |
| **L3** | 单个元素（L0 图上可点的框） | 它在原文里怎么定义的、被哪些 block 讲到 | — |

## 3. L0 = `framework-map`

### 3.1 为什么不是"topic 卡片 + 连线"

曾有两条路线：

| | 做法 | 结果 |
|---|---|---|
| 甲 | **topic 当容器**（分区/泳道），元素装在容器里 | ❌ 机制链是横向贯穿的，而 topic 是分区；容器边界会把链切断，画出来又变回"几个框连几条线"。而且 5 个 topic 的类型本来就不统一（概念/决策/机制/约束/清单），无法共处一个平面 |
| **乙** | **机制链为主结构**，topic 只作为**着色 + 侧栏导航** | ✅ 采用 |

论文框架图从不把章节框起来 —— 章节只在正文里解释这张图。乙方案下，topic 类型不统一的问题**自动消失**，因为它们不需要在图上共处一个平面。

### 3.2 布局语法

```
① 主轴 spine   : process 与 artifact 交替的纵向链（输入 → 产物 → 产物 → 产物）
② 侧挂 attach  : concept / constraint / state / 反例 挂在相关节点旁（虚线或浅色）
③ topic 标注   : 每个节点带 topic 标签；同 topic 同色；点标签进 L1
④ 状态标注     : 节点带 role；现状文档用虚线灰显，目标文档用实线
```

第一版**不做任意连线**。可读性来自"主轴明确"，一旦允许任意连线，图会退化成随机连线。

### 3.3 L0 契约草案

```json
{
  "mapVersion": 1,
  "level": "L0",

  "document": {
    "id": "DESIGN-CONTEXT-CONSUMPTION",
    "title": "Context Consumption 语义模型",
    "sourcePath": "测试文档/18-context-consumption-semantic-model.md",
    "role": "target"
  },

  "thesis": "上下文消费只发生在 Outline Generation，且它保留 Receipt → Availability → Consumption 的三级递进语义。",

  "elements": [
    {
      "id": "E-01",
      "label": "Frozen Context",
      "type": "artifact",
      "role": "input",
      "topics": ["T-01"],
      "sourceUnitIds": ["SU-XXX"]
    }
  ],

  "edges": [
    { "from": "E-02", "to": "E-01", "type": "depends-on" }
  ],

  "attachments": [
    { "elementId": "E-09", "attachedTo": ["E-04"] }
  ],

  "topics": [
    { "id": "T-01", "title": "三级语义模型", "thesis": "上下文消费有三段递进" }
  ],

  "meta": { "elementCount": 10, "topicCount": 5, "edgeCount": 8 }
}
```

- `elements[]` —— 图上所有的框，每个都带 `type` / `role` / `topics` / `sourceUnitIds`
- `edges[]` —— **只放主轴机制关系**，受控 8 词（§5），越界即 FAIL
- `attachments[]` —— concept / constraint / state / 反例的侧挂，**不是边**，不进词表（§5.3）
- `topics[]` —— 只是标签集，不是容器

## 4. 元素 ontology

### 4.1 六类 `type`

| type | 表达什么 | 例子 | 判据 |
|---|---|---|---|
| `concept` | 核心抽象、领域概念、语义对象 | Context Consumption、Output Alignment | 回答"这是什么概念？"，主要存在于**语义模型**里 |
| `component` | 会执行行为的系统 / 模块 / 服务 | Outline Generator、Fusion Service | 回答"**谁**负责做？" |
| `process` | 动作、阶段、处理步骤 | Outline Generation、Freeze Context | 回答"**做什么**？" |
| `artifact` | 被创建、传递、读取或消费的数据/产物 | Frozen Context、Generation Projection、Outline Revision | 回答"系统实际创建/保存/传递/读取**什么**？"，主要存在于**运行链路**里 |
| `state` | 某个对象或流程在某个时间点**处于什么状态** | Frozen、Available、Consumed、Failed | 见 §4.4 额外条件 |
| `constraint` | 限制行为或定义边界的规则 | Consumption ≠ Alignment、Scene 不得直接消费完整 Frozen Context | 承担边界与反例（§4.5） |

**`Frozen Context` 归入 `artifact`，不是 entity** —— `entity` 太模糊（数据库对象、系统组件、领域概念都能叫 entity），AI 很容易乱用；`artifact` 的语义明确：**某个流程产生、持有、传递、读取或消费的东西**。

### 4.2 两层：`type` + `role`

`type` 是稳定的通用 ontology（上面 6 个）；`role` 是上下文相关的：

```
input  output  intermediate  authority  consumer  producer
boundary  target  current  instance  excluded  anti-pattern
```

有了 `role`，AI 不需要为了表达"Frozen Context 是输入"去发明 `input-artifact` 这种新类型。

> `process` 的实例不要新增类型，用 `{"type":"process","role":"instance"}` 表达。
> **不要**引入 `instanceLike` 这类一次性自由字段 —— 它一开，后面就会长出第二个、第三个。

**第一版不加入的类型**：`decision` / `evidence` / `actor` / `interface` / `event` / `database` / `field` / `rule` / `policy` / `resource` / `command` / `query`。
它们可以先映射到 6 个基本类型（Decision → concept/constraint；Evidence → artifact；Actor → component；Event → artifact；Database → component；Rule/Policy → constraint）。只有当一个类型在**很多不同文档**里都无法自然表达时，才新增 —— 否则 vocabulary 会膨胀到 20 多种，AI 分类又开始漂。

### 4.3 准入判据（A~F）

一个东西只有满足全部条件，才允许成为 L0 元素：

| | 判据 | 反例 |
|---|---|---|
| **A** | 它是**稳定的可指称对象** | "为了避免重复解释"、"生成器应该注意……"、"目前来看……" 都是说明，不是元素 |
| **B** | 它至少参与**一条重要关系** | 孤零零存在、不与其他核心对象产生关系的名词，不值得进 L0 |
| **C** | **删掉它会破坏对架构的理解** | 删掉后用户仍能正确理解核心设计 → 不要放 L0 |
| **D** | 它**不是另一个元素的低层细节** | `attemptId` / `retryCount` / `createdAt` 属于 L2/L3，不属于 L0 |
| **E** | **硬闸门：元素总数 ≤ 10~12** | 超出说明 C 判据没执行到位，需要重新抽象 |
| **F** | 同一文档内，**同一概念只能有一个节点** | 防止同一实体在图上出现两次、图被拆碎 |

### 4.4 `state` 的额外条件

判据 A~D 会漏一种情况：`Frozen` / `Available` 这类词可指称、也有关系、删了也影响理解，但它们常常只是某个 artifact 的**属性标注**。放成独立框，图上会出现一堆孤立的"Frozen / Pending / Failed"，读者不知道它们在说谁。

> **`state` 只有在"状态迁移或状态组合本身就是设计要点"时才画成节点；否则作为所属元素的 badge 标注。**

### 4.5 边界与反例怎么进图

这份参考文档 87 条语义里有 **33 条（38%）是负向内容**（`boundary` 14 / `negative-case` 13 / `non-claim` 5 / `non-goal` 1）。全上图会爆，不上图又丢掉最有价值的部分。

| 内容 | 怎么进图 |
|---|---|
| 边界规则（`A 不能绕过 B`、`X ≠ Y`） | 独立 `constraint` 元素，用 `attachments` 挂到相关节点 |
| 反例 / 反模式 | **不独立成节点**，作为节点或约束的侧挂批注，`role: "anti-pattern"`，视觉用虚线 + 禁止标记 |

筛选用**判据 C**：33 条里通常只有 3~5 条过得了闸门，其余留在 L1/L2。**不新增第 7 个类型。**

## 5. 关系词表

### 5.1 受控词表（8 个）

| 词 | 含义 | 语法示例（非文档事实） |
|---|---|---|
| `produces` | A 产生 B | Outline Generation → Outline Revision |
| `consumes` | A 消费 B | Outline Generation → Generation Projection |
| `transforms-to` | A 被转换为 B | Frozen Context → Generation Projection |
| `depends-on` | A 依赖 B | Generation Projection → Frozen Context |
| `contains` | A 包含 B（component 嵌套 process） | Outline Generator → Generate Outline |
| `controls` | A 控制 B | 调度器 → 生成任务 |
| `validates` | A 校验 B | — |
| `constrains` | A 约束 B | Consumption ≠ Alignment → Scene Generation |

兜底：`relates-to`。**兜底词如果在图上出现频繁，说明词表设计失败**，应当回到这一步重新设计，而不是继续加词。

### 5.2 方向规则：主动语序

**`A --v--> B` 必须读成一句主动句 "A v B"。**

于是被动态全部取消：不写 `consumed-by`，而写 `Outline Generation --consumes--> Generation Projection`（箭头方向随之反向）。这样**不需要给每个词再配一个被动态**（否则 8 个词会变成 16 个），方向也不会有人写反。

### 5.3 封闭性：未知词直接 FAIL

词表不能只写在 prompt 里。任何不在表内的 `type` 一律校验失败 —— 和 `check-plan` 对 shape 白名单的做法一致。

这条不是理论要求：本特征上一版的示例图里，5 条边中有 3 条（`projected-to` / `consumed-by` / `drives`）用了表外的词，而这 3 条恰好出现在刚写完词表的同一段话里。**所以越界必须由校验器拦，不能靠自觉。**

### 5.4 侧挂不用 edge

`concept` / `constraint` / `state` / 反例与主轴节点的连接**不写成 edge**，而写成 `attachments[]`：

```json
{ "elementId": "E-09", "attachedTo": ["E-04"] }
```

原因：`Context Consumption` 这类 concept 与流程之间的关系，用 8 个词都不自然，硬写就只能滥用 `relates-to`。用无类型的 attachment 后：

- 主轴上的 `edges[]` 永远只有 `process` 和 `artifact`，干净且封闭
- 侧挂永远不会污染边词表

## 6. Coverage 不变量

"L0 不承载全文、L2 承载全文"必须是两条**可自动校验**的线，而不是口号：

| 层 | 不变量 | 可验证性 |
|---|---|---|
| **L0** | ① 每个 Topic 至少有一个元素<br>② 每个元素的 `topics` 非空<br>③ 每条 edge 的两个端点都在 `elements[]` 里<br>④ 元素总数 ≤ 12（判据 E）<br>⑤ 每个元素都能溯源到 `sourceUnitId` | 可自动 check |
| **L2** | 每条 sourceUnit **至少被覆盖一次** | 现有 check 改阈值即可 |

L2 的措辞从"**恰好一次**"放宽为"**至少一次**"：

| 情况 | 旧规则 | 新规则 |
|---|---|---|
| 一条语义被 3 个 block 讲到 | 报警，要求登记 `duplicatesMerged` | 合法，不报 |
| 一条语义**没有任何 block** 讲到 | 报警 | **报警** |

原因：L2 的 block 不再复用旧的 21 块，而是**按 topic 现生成**，同一份内容会故意出现在多个 topic 里（各讲各的侧面）。新规则不关心切到哪，只关心**有没有人讲它** —— 而"漏"才是唯一不可接受的。

## 7. 导航与交互

| 从 | 点击 | 到 |
|---|---|---|
| L0 | 元素框 | L3 元素详情 |
| L0 | topic 标签 / 图例 | L1 Topic |
| L1 | block | L2 Block |
| L2 | Source 标签 | 原文 |

- renderer 现有的深链形式是 `#block-<id>`（`app.js:379`）。L0 元素应有对应的 `#element-<id>`。
- `framework-map` 是 renderer 里**第一个"可点、可下钻"的 shape**（现有 shape 都是纯展示），需要新增一个 `content.type`（建议叫 `map`）。**这是本特征唯一必须动 UI 的地方。**

## 8. 单文档原则

- **一次运行只解析一篇文档。** 多篇文档的场景由用户在**多个进程之间人工对比**框架图完成，不在本特征范围内。
- 因此**不引入 document set 数据结构**，`document.id` 保持单文档语义，`sourceUnitIds` 也不需要加文档前缀。
- 但输出要**便于跨进程对比**：`document` 块必须记录文档身份（`id` / `title` / `sourcePath` / `role`），元素的 `label` 必须是文档里的**规范术语**（而不是自造措辞）。跨进程对比在第一版是**人工看图**，不做自动 diff。
- 未来的"现状图"是**独立的一次运行**（喂现状文档），不在本特征 Phase 1。

## 9. 阶段计划

### Phase 1：手工验证（不做 UI）

**目标**：只手工画一版目标态 `framework-map`，验证"图是否真的比现状更容易理解"。

```
Task 1.1  按 §4 的判据 A~F，从参考文档手工选出元素并定 type / role
Task 1.2  画主轴 + 侧挂，填 edges（只用 8 词）与 attachments
Task 1.3  填每个元素的 sourceUnitIds（必须真实）
Task 1.4  验证 §6 的 L0 不变量 + §9.1 的测量
```

**本阶段明确不做**：不改 renderer、不改 AI、不动 L2 的 blocks。图用纸/静态图验证即可。

#### 9.1 验证方法（任务式，不是问卷）

改为可判分的对照测量：

- **baseline**：现有 `overview-preview.html`（四段阅读流）
- **candidate**：手工框架图
- **问题集**：10 道能从这篇文档判分的问题（例："Consumption 的最低证据是什么？" / "哪些情况不能证明 Consumption？" / "Context-side 与 Output-side 的边界是什么？"）
- **测量**：正确率、定位耗时、**是否翻开了原 Markdown**

最后一项是本项目最重要的判据（"不打开原 Markdown，仅通过 Visual Overview 能否较完整理解设计方案"），应当直接作为硬指标。

### Phase 2：契约落地与 AI 生成

把手工验证过的东西变成生成协议：

```
Stage 1a「理解」  读完整篇 → sourceUnits + framework-map + topics
Stage 1b「配块」  逐 topic 决定需要几个 block、什么 shape、覆盖哪些 units
Stage 2          单块生成（现有能力，基本不变）
```

**为什么拆成 1a / 1b**：现在 Stage 1 要干四件事（拆 units / 抽框架图 / 抽象 topics / 每个 topic 配块），塞进一个 prompt 会很不稳。拆开的好处是 —— 1a 的产物**就是这张框架图**，可以单独生成、单独验证、单独看效果，不用等下游；1b 可以**逐 topic 重试**（和现有 Stage 2 分块重试同一个思路）。

本阶段要新增的契约与校验：

```
schema/framework-map.schema.json     L0 契约（§3.3）
scripts/check-map.js                 L0 校验：type / role / edge 词表封闭性 / 判据 E / 溯源
                                     （L2 的 ≥1 覆盖检查改造现有 check-overview）
docs/shape-catalog.md                新增第 12 个 shape：framework-map
```

### Phase 3：后续（不在本特征内）

- 现状图（喂现状文档，独立运行）
- 多进程框架图的人工对比
- 自动 diff（需要跨文档的元素标识策略）

## 10. Gold 重建计划

采用乙方案后，**Stage 1 的 Gold 对标基线作废**，需要重建。分清楚哪些能留、哪些要重做：

| 资产 | 命运 |
|---|---|
| `sourceUnits` 87 条 | ✅ **保留**（它们是文档级原子，与切法无关） |
| `overview-plan.json` 里 21 个 block 的切法 | ❌ 作废 |
| `check-plan` 里与 block 切法 / shape 分布相关的规则 | 🔧 重写 |
| `ai/stage1-plan.prompt.md`（fingerprint `62e8e544c69dd32c`） | 🔧 重写，且此前的三次对比结论不再可用 |
| `docs/shape-catalog.md` 的 11 个 shape | ✅ 保留（这些就是"复用的表达形式"） |
| `stage2-block.schema.json`、`check-block.js`、renderer、shape→content.type 映射 | ✅ 完全不动 |
| Gold framework-map | 🆕 新建（Phase 1 的手工产物就是它的第一版） |

## 11. 风险

| 风险 | 应对 |
|---|---|
| topic 划分不准确 | topic 已降级为标签，影响面大幅缩小 |
| 框架图元素选不准 | 判据 A~F + 元素总数硬闸门；Phase 1 手工验证 |
| 元素没有溯源，图变成"AI 插画" | **硬约束**：每个元素必须有 `sourceUnitIds`。一张没有 provenance 的图是**最容易丢语义**的地方 —— 丢了你都发现不了 |
| 人工对比多篇文档图成本高 | 明确不在本特征内；v1 靠 `label` 规范性 |
| 复核时无法判断图上是否漏了重要内容 | §6 的 L0 不变量可自动 check |

## 12. 明确不做的事

- ❌ Phase 1 不做 UI / 不改 renderer
- ❌ 不改变现有 11 个 shape 的语义
- ❌ 不做 document set 数据结构（§8）
- ❌ 不新增 §4.2 列出的那 12 种类型
- ❌ 不允许任意连线（§3.2）
- ❌ 不让 AI 直接生成 HTML 替代结构化数据 + 确定性 renderer

## 13. 待定项

1. **topic 是"短标题"还是"命题"？** 建议**两者并存**：导航用短标题，图上/侧栏显示一句命题。（现有 5 个 topic 类型不统一的问题，在乙方案下已不影响制图，但仍影响可读性。）
2. **`framework-map` 的 shape 名与 `content.type` 名**：暂定 `framework-map` / `map`。
3. **主轴是否需要"层"的概念**（例如把元素归到 2~3 条横向泳道）—— Phase 1 手工验证后再定。
4. **`state` 的画法**：badge 还是节点，Phase 1 拿这份文档试出来。

## 14. 归档说明

以下文件是**讨论过程中被取代的草案**，已移入 `_archive/`，仅作记录保留：

| 文件 | 被取代的原因 |
|---|---|
| `_archive/context-consumption-l0-map.json` | 按"topic 当容器"设计，且 blockIds 与文档内另一份划分不一致 |
| `_archive/t-02-generation-pipeline-l1-map.json` | 基于已作废的 Entry Points 概念；内容是从 block 手抄的第二真相（无 provenance） |
| `_archive/topic-划分说明.md` | 基于旧版 21 blocks（四段计数为 Fix 1.3 之前的状态）；block 归属已随乙方案作废 |

其中**仍然有效的部分已并入本文档**：5 个 topic 的划分思路（§3.3 的 `topics[]`）。

## 当前状态

- **重写时间**：2026-09-26
- **Phase 1 状态**：待开始
- **执行者**：TBD
