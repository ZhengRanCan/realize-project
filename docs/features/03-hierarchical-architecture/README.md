# Feature 03: Hierarchical Document Model（L0 → L3）

> 状态：**2026-09-26 重写**。上一版（topic 卡片 + Entry Points + 手改 renderer）与同日的改进版
> 均已归档到 `_archive/`，见 §17。
>
> 本文件是 Feature 03 的**现行规格**。议题以 2026-09-26 的框架讨论结论为准；
> 归档文件中的独有贡献（泛化验证、Topic 质量判据、Track A/B 分离）已并入 §10 / §11。

---

## 1. 目标

把"标题目录 + 从头读到尾"改造成**一张能下钻的设计地图**：

> 本文件是 Feature 03 的**架构规格**。各阶段的具体任务书与验收清单见 Feature 04 ~ 08（§12）。

```text
Markdown（一次只解析一篇文档）
      ↓  Semantic Compilation
Interactive Design Model
      ↓
L0  一屏两区：机制图 + topic 导航
      ↓  点元素            ↓  点 topic
L3  元素详情          L1  Topic 展开
      ↓                    ↓  点 block
     原文              L2  Visual Blocks
                          ↓  点 Source
                         原文
```

最终产品模型不是 `Markdown → Overview`，而是 **`Markdown → Semantic Compilation → Interactive Design Model`**。

模型同时拥有三个维度：

```text
Hierarchy（认知层级）
  Document → Topic → Block → Element

Graph（关系）
  底层是一张语义图；各层级只是从图上选取不同的节点与边进行投影

Shape（局部表达）
  复用现有 11 个 shape，负责"一个局部设计问题怎么表达"
```

`Source / Provenance` **不是最后一级**，而是贯穿所有层级的纵向溯源能力。

`What → How → Prove → Boundary` **不删除**，但降级为一种 **Reading Lens**（§8）。

---

## 2. 层级职责

| 层 | 是什么 | 回答什么 | 点它去哪 |
|---|---|---|---|
| **L0** | 一屏两区：主区 = 机制图，侧区 = topic 导航（§3） | 这篇设计在讲什么机制、涉及哪几件事 | 点元素 → L3；点 topic → L1 |
| **L1** | 一个 Topic 的展开 + 它自己的 blocks | 这部分怎么工作、为什么这么定 | 点 block → L2 |
| **L2** | Visual Blocks（复用 shape 表达形式） | 细节与论证 | 点 Source → 原文 |
| **L3** | 单个元素（L0 图上可点的框） | 它在原文里怎么定义的、被哪些 block 讲到 | — |

**L3 不再被推迟为"最后一级"**，它是从框架图直接往下钻的一层 —— 这正是"Source 是纵向能力"的落点。

L1 **不得写死**成 `Current / Target / Rationale / Mapping` 这种固定字段：那只是"生成链路"这一个 Topic 的视觉表达，不是通用结构。通用 L1 只需保证：

```text
Topic 标题 · Summary · Key Question · 相关 Blocks · 相关 Topic Relations · Source
```

---

## 3. L0：一屏两区（默认入口）

### 3.1 版式

```text
┌──────────────────────────────────────────────┬──────────────┐
│  主区：framework-map（元素级机制图）          │ 侧区：topic  │
│                                              │ 导航条        │
│   [Frozen Context]──depends-on──┐            │              │
│                                 ▼            │ ▸ 三级语义模型│
│   [Outline Generation]──consumes──▶[Proj]    │ ▸ 生成链路    │
│           │ produces                         │ ▸ 证据体系    │
│           ▼                                  │ ▸ 两条链边界  │
│   [Outline Revision] ...                     │ ▸ 产品边界    │
│                                              │              │
│   侧挂：⚠ Consumption ≠ Alignment            │              │
└──────────────────────────────────────────────┴──────────────┘
```

- **主区**回答"这篇文档到底提出了什么机制"
- **侧区**回答"这篇文档主要在讲哪几件事"，同时是进 L1 的入口
- 两者共用同一套元素与 topic 标注，不重复表达

**两个区域解决的是两个不同的认知问题，不能互相替代：**

| 区域 | 回答的问题 | 未来可能的形态 |
|---|---|---|
| **Framework Map** | 这些东西是**怎么连接的**？ | Concept-heavy → 概念网络 / 机制链；Data-heavy → 实体关系 / 归属图；Process-heavy → 流程 / 状态迁移 / 失败分支 |
| **Topic Navigation** | 这篇文档主要**有哪些事情值得我进去看**？ | 始终是入口列表，不随文档类型变化 |

> **L0 固定的是交互职责，不固定图的具体拓扑。**

### 3.2 为什么主区不能只是"几个 topic 连几条线"

论文里的框架图从不只是把章节标题画成框再连起来 —— 那样只会让人困惑。**图里必须在 topic 内部有基础元素**，才能丰富细节、增加认知。

所以：**topic 不是容器，是标签。**

| | 做法 | 结论 |
|---|---|---|
| 甲 | topic 当**容器**（分区/泳道），元素装在容器里 | ❌ 机制链是横向贯穿的，容器边界会把链切断，画出来又变回"几个框连几条线"。而且 5 个 topic 类型本来就不统一（概念/决策/机制/约束/清单），无法共处一个平面 |
| **乙** | **机制链为主结构**，topic 只作**着色 + 侧栏导航** | ✅ 采用 |

乙方案下，topic 类型不统一的问题自动消失 —— 它们不需要在图上共处一个平面。

**Topic 与 L0 element 是解耦的**（Feature 04 修正）：Topic 不要求必须有 L0 element，它可以只挂 L2 blocks。详见 §7.1。

### 3.3 Framework Map 的定义（不要退化成"一条主链"）

> **Framework Map 是少量核心元素与重要关系形成的认知图；"主轴 + 侧挂"只是其中一种布局策略。**

Context Consumption 很容易画成一条纵向链：

```text
Frozen Context → Projection → Outline Generation → Outline → Scene
```

这会让人误以为 Framework Map 就等于"一条主链 + 侧挂"。但 Data-heavy 文档很可能天然是这样：

```text
        User
       /    \
   Order    Profile
     |
  Payment
     |
   Ledger
```

**根本没有主轴。** 所以：

| | 归属 |
|---|---|
| 布局策略（主轴 / 网状 / 星形 / 分组） | **属于具体文档**，不属于规格 |
| 元素与关系的语义约束（§5 / §6） | 属于规格 |
| L0 的交互职责（§3.1） | 属于规格 |

**关于"主轴"的措辞**（Feature 04 修正）：不要写成"process 与 artifact **交替**"——那是对当前这一条机制链的过拟合。正确说法是：

> 主路径**通常**由 process / artifact 等核心元素组成；**允许同类型元素连续出现**，只要中间的关系具有独立设计意义。

```text
Raw Schema
   ↓ transforms-to
Normalized Schema      ← 两个 artifact 连续，完全合理
```

Phase 2 必须专门回答：**"Framework Map 是否一定存在单一主轴？"**（§11 / §16）

**Phase 2 实测答案（Feature 05）：不必须。** 三种拓扑都出现了：

| Fixture | 形态 |
|---|---|
| A | 链 + 侧挂（主轴混合 artifact / process） |
| B | 链 + 侧挂（artifact / process **严格交替**，7 节点） |
| C | **分叉 DAG + 不对称分支**（`Fusion Learning Fact` 之后分成两支，一支末端没有产物节点，另一支双入边） |

也就是说，"主轴 + 侧挂"之外的真实形态是**分叉 DAG**，而不只是当初猜测的"实体关系图"。

> **⚠️ 一条来自 Feature 05 的教训：当一篇文档出现并列分支时，要主动问"这两个分支真的存在先后关系吗？"**
> 设计 Fixture C 时，前两版方案都把两个分支压成了一条链（把 Memory 当成 Mastery 的下游，或直接丢掉 Mastery 整支）—— 看起来整齐合理，其实是错的。**纠正它的不是判断力，而是文档里恰好写了一句话点明"两个投影互相独立"。**
> 因此：**如果文档没有明确说"谁是谁的前置"，默认不要串成链。**

---

## 4. `framework-map` 契约草案

```json
{
  "mapVersion": 2,
  "level": "L0",

  "document": {
    "id": "DESIGN-CONTEXT-CONSUMPTION",
    "title": "Context Consumption 语义模型",
    "sourcePath": "测试文档/18-context-consumption-semantic-model.md",
    "role": "target",
    "scope": { "text": "本文只讨论……不是 Feature 合同、架构 SSOT 或实现授权。", "sourceUnitIds": ["SU-001"] },
    "nonGoalSummary": { "text": "不采用第四级 Context Influence；不承诺因果。", "sourceUnitIds": ["SU-007", "SU-034"] }
  },

  "thesis": "上下文消费只发生在 Outline Generation Attempt，且它保留 Receipt → Availability → Consumption 的三级递进语义。",

  "elements": [
    {
      "id": "E-01",
      "label": "Frozen Context",
      "type": "artifact",
      "role": "input",
      "topics": ["T-02"],
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
    {
      "id": "T-01",
      "title": "三级递进语义",
      "proposition": "Receipt / Availability / Consumption 是三个可以同时为真、但不能互相替代的语义层级。",
      "blockIds": ["O-02", "O-09"]
    }
  ],

  "meta": { "elementCount": 12, "topicCount": 5, "edgeCount": 4 }
}
```

| 字段 | 约束 |
|---|---|
| `elements[]` | 图上所有的框，每个必须带 `type` / `role` / `topics` / `sourceUnitIds` |
| `edges[]` | **只放主轴机制关系**，受控 8 词（§6），越界即 FAIL |
| `attachments[]` | concept / constraint / state / 反例的侧挂，**不是边**，不进词表 |
| `topics[]` | `title`（短标题）+ `proposition`（一句命题）+ `blockIds`（该 Topic 下钻的 L2 blocks）。**Topic 不要求有 element**（§7） |
| `document.role` | `current` / `target`；本次只做 `target`（§9） |
| `document.scope` / `document.nonGoalSummary` | **文档级入口**：承载不属于任何 Topic 的文档定位语义（如 SU-001）。它是一种**合法的导航入口**（§7），不需要为它造一个 Topic |
| `thesis` | **可选字段**（见下） |

**关于 `thesis`（可选）：**

> `thesis` 是帮助用户快速建立认知框架的**文档级**表达，用来回答"所以这篇文档到底想解决什么？"
>
> - **可选**：原文若不存在明确的中心命题，可以为空
> - **不参与 Topic coverage**，也不参与 §7 的任何不变量
> - **不是"原文必须存在的一句话"** —— 它是我们的表达，不是原文的摘录
>
> 反例对比：
>
> ```text
> Context Consumption（设计文档）→ 容易有
>   "上下文消费只发生在 Outline Generation……"
>
> Data Model-heavy 文档 → 未必有中心论点
>   "定义订单域的数据模型及生命周期。"   ← 这种就够了，不必硬凑成论文式论点
> ```
>
> 保留它是为了解决首页"这篇在干嘛"；但**不要把所有技术文档硬解释成论文**。

---

## 5. 元素 ontology（第一版**候选**通用词表）

### 5.1 六类 `type`

> ⚠️ **这是第一版候选 ontology，不是"已证明通用"的分类。**
>
> 我们已经承认"5 个 Topic 可能过拟合 Fixture A"；**同样的逻辑必须应用到这六类元素**。
>
> | 说法 | 含义 | 是否成立 |
> |---|---|---|
> | **冻结扩张** | Phase 2 跨类型验证之前，不要一遇到问题就加第 7、8、9 种 | ✅ 现在的做法 |
> | **已证明通用** | 已经证明这 6 类能覆盖所有技术文档 | ❌ **未证明，不得这样写** |
>
> **冻结扩张 ≠ 已证明通用。** 这两个概念区别很大，措辞必须钉死。

| type | 表达什么 | 例子 | 判据 |
|---|---|---|---|
| `concept` | 核心抽象、领域概念、语义对象 | Context Consumption、Output Alignment | 回答"这是什么概念？"，主要存在于**语义模型**里 |
| `component` | 会执行行为的系统 / 模块 / 服务 | Outline Generator、Fusion Service | 回答"**谁**负责做？" |
| `process` | 动作、阶段、处理步骤 | Outline Generation、Freeze Context | 回答"**做什么**？" |
| `artifact` | 被创建、传递、读取或消费的数据 / 产物 | Frozen Context、Generation Projection | 回答"系统实际创建 / 保存 / 传递 / 读取**什么**？"，主要存在于**运行链路**里 |
| `state` | 某个对象或流程在某个时间点**处于什么状态** | Frozen、Available、Consumed、Failed | 见 §5.4 |
| `constraint` | 限制行为或定义边界的规则 | Consumption ≠ Alignment | 承担边界与反例（§5.5） |

**`Frozen Context` 归入 `artifact`，不是 `entity`。** `entity` 太模糊（数据库对象、系统组件、领域概念都能叫 entity），AI 很容易乱用；`artifact` 的语义明确：**某个流程产生、持有、传递、读取或消费的东西**。

> ⚠️ **六类是 allowed vocabulary，不是"每张图必须凑齐的 checklist"。**
>
> validator 应检查 `type ∈ 允许词表`，**不得**检查"六类都必须出现"。
>
> ```text
> 一篇文档里 component = 0    → 完全正常，不是缺陷
> 一篇文档里 constraint = 0   → 也正常（虽然少见）
> ```
>
> 反过来，如果校验器要求"每类至少一个"，就会逼着使用者为了凑数往图上塞无意义的节点。

### 5.2 两层：`type` + `role`

`type` 是稳定的通用 ontology（上面 6 个）；`role` 是上下文相关的：

```text
input  output  intermediate  authority  consumer  producer
boundary  target  current  instance  excluded  anti-pattern
semantic-level
```

`semantic-level` 用于"某个语义模型的递进层级 / 谓词"（如 Receipt / Availability / Consumption）—— 它们**可以同时为真**，不是互斥状态（判别规则见 §5.4）。

有 `role`，AI 就不需要为了表达"Frozen Context 是输入"去发明 `input-artifact` 这种新类型。

> `process` 的实例不要新增类型，用 `{"type":"process","role":"instance"}`。
> **不要**引入 `instanceLike` 这类一次性自由字段 —— 它一开，后面就会长出第二个、第三个。

**第一版不加入的类型**：`decision` / `evidence` / `actor` / `interface` / `event` / `database` / `field` / `rule` / `policy` / `resource` / `command` / `query`。
它们可先映射到 6 个基本类型（Decision → concept/constraint；Evidence → artifact；Actor → component；Event → artifact；Database → component；Rule/Policy → constraint）。只有当某类型在**很多不同文档**里都无法自然表达时才新增 —— 否则 vocabulary 会膨胀到 20 多种，AI 分类又开始漂。

### 5.3 准入判据（A~F）

一个东西只有同时满足全部条件，才允许成为 L0 元素：

| | 判据 | 反例 |
|---|---|---|
| **A** | 它是**稳定的可指称对象** | "为了避免重复解释"、"生成器应该注意……"、"目前来看……" 都是说明，不是元素 |
| **B** | 它至少参与**一条重要的 edge 或 attachment 关系** | 孤零零存在、不与其他核心对象产生关系的名词，不值得进 L0。<br>⚠️ 注意：concept / constraint / state 只能走 `attachments`（§6.4），**attachment 也是关系** —— 否则侧挂这一整类永远无法满足 B |
| **C** | **删掉它会破坏对架构的理解** | 删掉后用户仍能正确理解核心设计 → 不要放 L0 |
| **D** | 它**不是另一个元素的低层细节** | `attemptId` / `retryCount` / `createdAt` 属于 L2/L3 |
| **E** | **硬闸门：元素总数 ≤ 10~12** | 超出说明 C 判据没执行到位，需要重新抽象。<br>⚠️ **实测（Feature 05）：三篇 Fixture 全部顶到 12/12，且流水线越长、留给 constraint 的位置越少**（B 的 7 条实施不变量只放得进 2 条）。容量规则偏紧，见 §11.1.1 的 Capacity gap |
| **F** | 同一文档内，**同一概念只能有一个节点** | 防止同一实体出现两次、图被拆碎 |

### 5.4 `state` 的额外条件

判据 A~D 会漏一种情况：`Frozen` / `Available` 这类词可指称、也有关系、删了也影响理解，但它们常常只是某个 artifact 的**属性标注**。放成独立框，图上会出现一堆孤立的"Frozen / Pending / Failed"，读者不知道它们在说谁。

> **`state` 只有在"状态迁移或状态组合本身就是设计要点"时才画成节点；否则作为所属元素的 badge 标注。**

**判别规则（concept vs state）—— 已登记为 ontology regression case：**

> **如果多个值能够在同一时刻同时成立，它们通常不是同一个 state machine 的互斥 state。**

| 案例 | 结论 | 理由 |
|---|---|---|
| Receipt / Availability / Consumption | **concept**，`role: "semantic-level"` | 三者**可以同时为真**（`Receipt = yes` 且 `Availability = yes` 且 `Consumption = yes`）；文档 §7 的"5 种状态组合"正是三个 boolean 语义条件的组合，而不是一个对象在互斥状态间迁移。且 Consumption 的 Subject 是 `Frozen Context × Outline Generation Attempt`，不是 Frozen Context 自身的生命周期状态 |
| Frozen / Pending / Failed / Available | **state** | 同一个对象在同一时刻只能处于其中一个 |

> 这条规则值得在后续所有文档上重复检验；每遇到一次新案例，就追加到上表。

具体画法（badge 还是节点）留到 Phase 2 之后再定（§16）。

### 5.5 边界与反例怎么进图

参考文档 87 条语义里有 **33 条（38%）是负向内容**（`boundary` 14 / `negative-case` 13 / `non-claim` 5 / `non-goal` 1）。全上图会爆，不上图又丢掉最有价值的部分（边界与反例正是提升思辨能力的内容）。

| 内容 | 怎么进图 |
|---|---|
| 边界规则（`A 不能绕过 B`、`X ≠ Y`、`Only server-authoritative …`） | 独立 `constraint` 元素，用 `attachments` 挂到相关节点，视觉用虚线 |
| 反例 / 反模式 | **不独立成节点**，作为节点或约束的侧挂批注，`role: "anti-pattern"`，虚线 + 禁止标记 |

筛选用**判据 C**：33 条里通常只有 3~5 条过得了闸门，其余留在 L1/L2。**不新增第 7 个类型。**

> ⚠️ **"3~5 条"是 Fixture A 的经验值，不是通用规则**（Feature 05 实测）：它来自 A 那 33 条负向内容。B 和 C 的图上都只放得进 **2 条** constraint —— 不是因为它们边界少，而是因为它们的流水线更长，把 12 个位置占满了（见 §11.1.1 Capacity gap）。
> **不要把这个区间当成校验规则。**

---

## 6. 关系词表（第一版**候选**通用词表）

### 6.1 受控 8 词

> 与 §5.1 同样的限定：这 8 个词是**候选**词表，不是"已证明通用"的关系集合。
> 在 Phase 2 的跨类型验证通过之前，**冻结扩张**（不加第 9、10 个词），但**不宣称已经通用**。

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

兜底：`relates-to`。**兜底词如果在图上出现频繁，说明词表设计失败**，应回到这一步重新设计，而不是继续加词。

### 6.2 方向：主动语序

**`A --v--> B` 必须读成一句主动句 "A v B"。**

被动态全部取消：不写 `consumed-by`，而写 `Outline Generation --consumes--> Generation Projection`（箭头方向随之反向）。这样**不需要给每个词再配一个被动态**（否则 8 个词变 16 个），方向也不会有人写反。

### 6.3 封闭性：未知词直接 FAIL

词表不能只写在 prompt 里。任何不在表内的 `type` 一律校验失败 —— 和 `check-plan` 对 shape 白名单的做法一致。

这不是理论要求：归档的上一版示例图里，5 条边中有 3 条（`projected-to` / `consumed-by` / `drives`）用了表外的词，而这 3 条恰好出现在刚写完词表的同一段话里。**所以越界必须由校验器拦，不能靠自觉。**

### 6.4 侧挂不用 edge

`concept` / `constraint` / `state` / 反例与主轴节点的连接**不写成 edge**，而写成 `attachments[]`：

```json
{ "elementId": "E-09", "attachedTo": ["E-04"] }
```

原因：`Context Consumption` 这类 concept 与流程之间的关系，用 8 个词都不自然，硬写就只能滥用 `relates-to`。用无类型 attachment 后：

- 主轴上的 `edges[]` 永远只有 `process` 和 `artifact`，干净且封闭
- 侧挂永远不会污染边词表

---

## 7. 三种 coverage（**不要混成一个数字**）

这是 Feature 04 得出的核心架构原则。系统里有**三种不同的 coverage**，各自回答不同的问题、各自有独立的不变量，**绝不能用一个 "coverage = 100%" 混起来**：

```text
A. Framework Coverage     L0 图有没有表达出主要机制？        不要求所有语义都进图
B. Navigation Coverage    所有值得保留的内容是否都有入口？     ← 最容易失败的一种
C. Semantic Coverage      进入 L2 后，原文语义有没有被表达？  既有 Stage 1/2 负责
```

```text
Framework Coverage  ≠  Navigation Coverage  ≠  Semantic Coverage
```

### 7.1 Framework Map invariant（对应 A）

```text
F1  每个 L0 element 必须有 provenance（sourceUnitIds 或等价锚点）
F2  L0 element 总数受容量限制（≤ 12）
F3  **不要求**每个 Topic 都在 Framework Map 上有 element
```

外加受控词表检查（§5 / §6）：`type` 在允许词表内、`role` 在受控取值内、`edges[].type` 在 8 词内、主轴只放 process / artifact、同一概念只有一个节点。

> F3 是 Feature 04 修正出来的。原先它写作"每个 Topic 至少有一个元素"，结果：**L0 图上没有元素的那类内容就不可能有 Topic，整块语义从导航上消失**（Fixture A 实测有 8 条语义因此完全无路径）。原因在于把两件不同的事当成了同一件：

```text
Framework Map       解决：这套设计的核心机制是什么？      → 允许裁掉大部分内容
Topic Navigation    解决：这篇文档还有哪些内容值得下钻？  → 允许挂"图上没有"的内容
```

所以 Topic 可以有两种形态：

```text
Topic A  ├── 有 L0 element
         └── 有 L2 blocks

Topic B  ├── 没有 L0 element      ← 合法
         └── 有 L2 blocks
```

### 7.2 Navigation invariant（对应 B）

```text
N1  每个 Topic 至少关联一个 L0 element 或一个 L2 block
N2  每个需要保留的 L2 block 必须至少能从一个 Topic 进入
    （文档级入口除外，见下）
N3  每个 Semantic Unit 必须存在至少一条 Document → Topic/L0 → L2 的可达路径
```

**N3 是最重要的一条 —— Semantic Reachability。** 最终的导航入口有三类，都合法：

```text
Document
   ├── document metadata（title / thesis / scope / non-goal summary）
   ├── L0 element
   └── Topic → L2 Block
```

也就是说：**不是所有东西都必须塞进 Topic。** 文档定位这类内容（Fixture A 的 SU-001）由 `document.scope` 承担，就不该为它造一个「文档定位」Topic —— 那等于"哪里漏了一块，就创建一个 Topic 来装它"。

### 7.3 Semantic Coverage（对应 C）

```text
L2  每条 sourceUnit 至少被覆盖一次
```

从"**恰好一次**"放宽为"**至少一次**"：

| 情况 | 旧规则 | 新规则 |
|---|---|---|
| 一条语义被 3 个 block 讲到 | 报警，要求登记 `duplicatesMerged` | 合法，不报 |
| 一条语义**没有任何 block** 讲到 | 报警 | **报警** |

原因：L2 的 block 不再复用旧的 21 块，而是**按 topic 现生成**，同一份内容会故意出现在多个 topic 里。新规则不关心切到哪，只关心**有没有人讲它** —— 而"漏"才是唯一不可接受的。

### 7.4 三者必须分别检查

| 检查 | 由谁负责 |
|---|---|
| Framework Coverage | `check-map`（F1~F3 + 受控词表） |
| Navigation Coverage | `check-map`（N1~N3） |
| Semantic Coverage | `check-overview`（既有） |

**不要**把它们合成一个"coverage 100%"的结论。

---

## 8. 导航与交互

| 从 | 点击 | 到 |
|---|---|---|
| L0 主区 | 元素框 | L3 元素详情 |
| L0 侧区 | topic 条目 | L1 Topic |
| L1 | block | L2 Block |
| L2 | Source 标签 | 原文 |

**默认入口是 Map**（L0）；`Read`（`What → How → Prove → Boundary`）作为可切换的 Reading Lens，两者复用同一批 blocks。

- renderer 现有深链形式是 `#block-<id>`。L0 元素应有对应的 `#element-<id>`。
- `framework-map` 是 renderer 里**第一个"可点、可下钻"的 shape**（现有 shape 都是纯展示），需要新增 `content.type`：**`map`**。这是本特征唯一必须动 UI 的地方。
  命名层级与现状一致：`shape` 表示"这是哪种视觉表达"，`content.type` 表示"Renderer 用什么基础结构渲染" —— 正如 `shape: current-target-flow` ↔ `content.type: flow`。

---

## 9. 单文档原则

- **一次运行只解析一篇文档。** 多篇文档由用户在**多个进程之间人工对比**框架图完成，不在本特征范围内。
- 因此**不引入 document set 数据结构**，`document.id` 保持单文档语义，`sourceUnitIds` 不需要加文档前缀。
- 输出要便于跨进程对比：`document` 块必须记录文档身份（`id` / `title` / `sourcePath` / `role`）；元素 `label` 必须是文档里的**规范术语**，而不是自造措辞。跨进程对比在第一版是**人工看图**，不做自动 diff。
- **现状图是独立的一次运行**（喂现状文档，`role: "current"`），不在 Phase 1/2 范围内。
- ⚠️ 区分两种"现状"：**文档声明的现状**（`document-claim`）与**代码核实过的现状**（`source-verified`，属于后续接源码那条链）。两者不能画进同一张图，否则就是"把目标设计伪装成当前现实"。

---

## 10. Topic 的定位与质量判据

### 10.1 定位

> Topic 是**一组围绕同一个核心设计问题、设计对象或设计责任形成的高内聚语义集合**，在 L0 上以**标签 + 侧栏导航**的形式存在。

**Topic 不要求有 L0 element**（§7.1）；它至少要挂一个 L2 block 或一个 element（N1）。

#### Topic 的推导顺序（顺序错了就会退化）

```text
✅ 正确
   1. 先重新判断整篇文档有哪些认知 Topic
   2. 再把所有 Block 分配进去
   3. 最后检查 Semantic Reachability（N3）

❌ 错误
   发现 orphan block
        ↓
   为它创建一个 Topic
```

后者会让 Topic 退化成"**哪里漏了一个 block，我就创建一个 Topic 来装它**"。**Topic 应由语义内聚决定，不能由 coverage repair 决定。**

举例：Fixture A 的 `O-13`《状态组合》不该因为它没有入口就新建一个「状态组合」Topic —— 它完全可以并进已有的「两条链的边界与状态组合」；`O-11` 也可以并进「语义边界与非主张」。

**也绝不能把旧的 block 分组直接改名当成 Topic：**

```text
旧 Reading View 的 block group
        ↓  改名
     Topics                    ← ❌ 这就是原地打转
```

Topic 必须按当前的认知模型重新推导。

#### 短标题与命题

- **短标题与命题并存**，两者解决的是**不同**的问题：

| 字段 | 回答 | 例 |
|---|---|---|
| `title`（2~6 词） | 我**在哪里**？ | 生成链路与消费点 |
| `proposition`（一句命题） | 这里到底**在讲什么**？ | Outline Generation 是主要消费点，Scene 主要消费 context-shaped Outline |

L0 的 topic 卡可以三者一起显示：

```text
生成链路与消费点

Outline Generation 是主要消费点，
Scene 不重新解释完整 Frozen Context。

5 blocks →
```

- Topic **不是**：Markdown 一级标题的改名 / What-How-Why 的固定分类 / 为了凑数量硬拆出来的组 / 每 2~3 个 block 的机械打包。

### 10.2 不固定数量

`3-7 Topics` 保留，但**降级为 Presentation Heuristic，而不是 Semantic Rule**：

```text
Preferred: 3–7 Topics
Allowed:   2–10 Topics
> 10:      Warning — 可能没有完成足够抽象
= 1:       Warning — 可能没有形成有用拆解
```

同理，"每个 Topic 2-6 blocks" **不能作为 Hard Rule**。

### 10.3 质量五判据（取代数量判断）

| 判据 | 它问的问题 |
|---|---|
| **Coverage 覆盖** | 所有 core blocks 都有 topic 归属吗？ |
| **Cohesion 内聚** | 一个 topic 内部的 blocks 在回答同一个设计问题吗？ |
| **Separation 区分** | 两个 topic 是不是其实在讲同一件事？ |
| **Abstraction 抽象** | topic 是不是只是把 source section 标题复刻了一遍？（`possible section mirroring` Warning） |
| **Cognitive usefulness 认知有用** | 只看 topic 标题 + 核心问题 + 关系，能回答"这篇设计主要在解决什么"吗？（最终人工验收标准） |

---

## 11. 泛化验证（Phase 2 的 Gate）

### 11.1 必须先承认的风险

只凭 Context Consumption 一篇文档，就总结出"文档该如何分层、该有哪些元素、该分成几个 topic" —— **这是过拟合**。归档的上一版明确指出了这一点：

> 不能把"Context Consumption 这一个例子如何划分 Topic"过早提升成"任意技术文档都应该如何划分 Topic"的产品规则。

**这条批评同样适用于本规格的 §4~§6**：6 类元素、判据 A~F、主轴 + 侧挂的布局语法，也全部是从这一篇文档推出来的。所以本规格在定契约之前**必须过三类文档这一关**。

两个具体疑问：

1. **Data-heavy 文档画得出机制链吗？** 它的内容可能是实体、字段、嵌套 schema、生命周期，而不是流程。
2. **Process-heavy 文档的机制链会不会与 topic 划分几乎重合**，导致 L0 退化成一张普通流程图（那就失去了"地图"的意义）？

**这两个问题可以再抽象成一个更根本的问题：**

> **不同类型技术文档的 L0 topology 是否可能完全不同？**

预期答案是**肯定的**：

| 文档类型 | 可能的 L0 拓扑 |
|---|---|
| Concept-heavy | 概念网络 / 机制链 |
| Data-heavy | 实体关系 / 归属图 |
| Process-heavy | 流程 / 状态迁移 / 失败分支 |

所以 Phase 2 的判定重点**不是**"三类文档能否都画成主轴 + 侧挂"，而是"三类文档能否各自形成**适合自己的**拓扑"。

### 11.1.1 遇到装不进去的内容：先分类，不要加类型

跨类型验证时一定会遇到"装不进去"的东西。**第一件事不是扩 ontology**，而是分类：

| Gap 类型 | 含义 | 处置 |
|---|---|---|
| **Semantic gap** | 六类 ontology 真的表达不了（`role` 也救不了） | ⚠️ **只有这一类才值得考虑扩 ontology** |
| **Layout gap** | 类型选对了，只是画法不适合 | 调整布局策略（属具体文档，不改规格） |
| **Relation gap** | 节点没问题，边表达不了（8 词不够） | 记录，单独讨论是否补词 |
| **Navigation gap** | 图不需要承载，但 Topic 必须有入口 | 加 Topic / 加 `blockIds` / 用文档级入口（§7.2） |
| **Capacity gap** | 类型与关系都对，但 **L0 的 ≤12 个位置不够** | 把内容降到 L1/L2（靠 Topic 入口保住可达性），或调整容量规则（§5.3） |

> **铁律：不要一看到某篇文档有东西装不进去，就立刻新增第 7 类元素。**
> 这正是"从一个例子推出通用规则"的翻版 —— 每篇文档加一类，ontology 会膨胀到 20 多种，AI 分类又开始漂（§5.2 已经写过这条）。

**Capacity gap 是 Feature 05 实测补上的第 5 类。** 它最容易被误判成 Layout gap（因为类型和关系都能表达），但真实原因不是画法：

- 三篇 Fixture **全部顶到 12/12**；
- B 的 §12 有 **7 条**实施不变量，图上只放得进 **2 条** constraint；
- C 的 §3 + §14 有 **9 条**关键原则与规则，图上同样只放得进 **2 条**。

**流水线越长，留给 constraint 的位置越少。** 遇到这种情况，正确做法是**降级到 L1/L2 并确保有入口**，而不是砍掉不变量或者把它们塞进一个笼统的"约束"节点。

### 11.2 三类 Fixture

| Fixture | 类型 | 应故意包含 | 可能自然形成的结构 |
|---|---|---|---|
| **A** | Semantic / Architecture heavy | 概念模型、职责边界、证据体系、产品边界 | 概念模型 / 生成链路 / 证据 / 职责边界 / 产品边界 |
| **B** | Data Model heavy | 多个实体、大量字段、nested schema、对象引用、lifecycle、schema evolution、current/target schema | 核心实体 / 归属 / 关系 / 生命周期 / Schema 演进 |
| **C** | Process / Operational heavy | execution flow、queue、retry、timeout、concurrency、failure recovery、observability | 执行流 / 并发 / 重试策略 / 故障恢复 / 可观测性 |

Context Consumption 是 Fixture A，只能当 **Gold Topic Decomposition Example**，**不能当 Generic Topic Architecture**；也不能作为 Prompt 里唯一的示例。

### 11.3 Track A 与 Track B 必须分开

| Track | 验证的假设 | 材料 | 现在能做吗 |
|---|---|---|---|
| **Track A** | **交互假设**："分层下钻 + L0 机制图 + Topic 导航"是否真的比 21 Blocks 长列表好 | Context Consumption（Fixture A）+ 现有 L2 blocks | ✅ **现在就能做，不等 B / C** |
| **Track B** | **生成模型假设**：六类元素、主轴/侧挂、Topic Synthesis、relation vocabulary 是否能泛化到别的文档类型 | A + B + C | ⏳ 等 Fixture B / C 到位 |

**两条线不要重新绑在一起**：Track A 是交互假设，Track B 是生成模型假设。

**不能用 Track A 的结果给 Track B 背书**，也不要用 Track B 阻塞 Track A。

#### ⚠️ Structural Reachability Test 不是 Track A 的胜负指标

Feature 04 引入了一个**自动化结构检查**：对一批问题，算从入口走到答案要几层（0 跳 = 首屏可见 / 1 跳 = 点元素看 L3 / 2 跳 = 经 Topic 跳 L2 / ∞ = 无路径）。

它**只能**回答两个问题：

```text
1) 有没有"完全无路径"的内容？     ← 这是它真正的价值（Fixture A 用它发现了 8 条 orphan）
2) 到达一条语义需要几层？
```

**不能**把它读成"新产物输给了旧产物"。因为 baseline 的"0 跳"意味着 **21 个 block 已经全部摊在首屏 scroll 里** —— 拿它和"先导航再点进去"比跳数，等于比较"书翻页 vs 网站点击"，技术上没错，但与"认知负担是否更低"这个问题无关。

#### 真正的 Track A 要测这六项（人工）

| 指标 | 真正回答什么 |
|---|---|
| 找到答案耗时 | 导航是不是更有效 |
| **不打开原 Markdown 的答题正确率** | Map 是否真的帮助理解 |
| 首屏同时出现的信息单元数 | 有没有降低认知负担 |
| 错误进入 Topic 的次数 | Topic 命名 / 结构是否清楚 |
| 返回 / 重选次数 | 用户是否容易迷路 |
| 主观负担 | 看完之后是不是仍然觉得累 |

**`Time to answer` 比 hop count 有意义得多。**

### 11.4 判定方式

多次运行**不要**要求 topic id / 数量 / 标题完全一致（不现实）。重点比较：

| 指标 | 含义 |
|---|---|
| **Block Coverage** | `assigned core blocks / total core blocks` |
| **Semantic Stability** | 同一个核心问题是否在多次运行中稳定成为独立 Topic、或稳定被某个 Topic 承载 |
| **Grouping Stability** | 语义相近的 blocks 是否在多次运行中大体聚在一起 |
| **Overfitting Check** | 不同文档类型是否产生**自己的**结构。如果 Data-heavy 文档仍然出现 `Consumption Evidence` / `Product Boundary` 这类结构，说明方法被 Fixture A 锚定了 |
| **Human Usefulness** | 只看 L0，能否在短时间内理解文档的主要设计空间 |

### 11.5 目前只固定这五件事

| ✅ 固定（属于规格） | ❌ 不固定（属于具体文档，或待 Phase 2 验证） |
|---|---|
| Element ontology（§5，候选） | 图一定从左到右 |
| Relation vocabulary（§6，候选） | **一定存在 main axis（主轴）** |
| Provenance（每个元素可溯源） | `state` 一定是 badge |
| Capacity（元素总数 ≤ 12） | 一定有泳道 / 分层 |
| Topic coverage（§10.3） | 图的具体拓扑（链 / 网 / 星形 / 分组） |

**Phase 1 的 `framework-map` 只固定左边这一列；右边这一列在 Phase 2 之前不得写进契约。**

这是为了防第二个 overfitting：我们已经从"5 个 Topic"里走出来，但很容易马上掉进"机制链 + 主轴 + 侧挂"的新一轮过拟合。

---

## 12. 阶段计划

> **各阶段已拆成独立 feature**，本文件只保留规格：
>
> | 阶段 | Feature |
> |---|---|
> | Phase 1 手工验证（Track A · 交互假设） | `docs/features/04-l0-framework-map/` |
> | Phase 2 跨文档类型验证（Track B · 生成模型假设，**Gate**） | `docs/features/05-l0-generalization-gate/` |
> | Phase 3 契约落地 | `docs/features/06-contract-and-validators/` |
> | Phase 4 生成链路 | `docs/features/07-generation-pipeline/` |
> | Phase 5 UI | `docs/features/08-l0-ui/` |
>
> 任务书（`execution-prompt.md`）与验收清单（`validation-checklist.md`）放在各 feature 目录下，**不在本目录**。

### Phase 1 — 手工验证（单文档，不做 UI）→ Feature 04

**目标**：只手工画一版目标态 `framework-map` + L0 一屏两区，验证"图是否真的比现状更容易理解"。

> **Phase 1 不依赖 Fixture B / C，现在就可以开始。** 它验证的是**交互假设**（Track A，§11.3）：
>
> ```text
> Context Consumption → 人工 framework-map → L0 Mock → L1 → 现有 L2 Blocks
> ```
>
> 层次下钻、L0 机制图、Topic 导航这一整套交互，是否真的比 21 Blocks 长列表好。

```text
Task 1.1  按 §5.3 判据 A~F，从参考文档选元素，定 type / role
Task 1.2  画主轴 + 侧挂，填 edges（只用 8 词）与 attachments
Task 1.3  填每个元素的 sourceUnitIds（必须真实）
Task 1.4  验证 §7 的 L0 不变量
Task 1.5  Track A 测量
```

**本阶段明确不做**：不改 renderer、不改 AI、不动一行 schema。图用静态 HTML 或纸面验证即可。

### Phase 2 — 跨文档类型验证（**Gate**）→ Feature 05

用 A / B / C 三类文档各跑一遍 Phase 1 的手工流程，回答 §11.1 的三个疑问（含"是否存在单一主轴"）。

> **未通过此 Gate 不得进入 Phase 3。** 若失败，需要修改的是 §3~§6（L0 形态与元素 ontology），而不是继续往下做契约。

### Phase 3 — 契约落地 → Feature 06

```text
schema/framework-map.schema.json    L0 契约（§4）
scripts/check-map.js                type / role / edge 词表封闭性 / 判据 E / 溯源必填
docs/shape-catalog.md               新增第 12 个 shape：framework-map
topic-map 契约 + check-topic-map     Topic 质量判据（§10.3）的 Warning 层
```

本阶段**不修改 Renderer**。

### Phase 4 — 生成链路 → Feature 07

```text
Stage 1a「理解」  读完整篇 → sourceUnits + framework-map + topics
Stage 1b「配块」  逐 topic 决定需要几个 block、什么 shape、覆盖哪些 units
Stage 2          单块生成（现有能力，基本不变）
```

**为什么拆 1a / 1b**：现在 Stage 1 要干四件事（拆 units / 抽框架图 / 抽象 topics / 每个 topic 配块），塞进一个 prompt 会很不稳。拆开后，1a 的产物**就是这张框架图**，可单独生成、单独验证；1b 可逐 topic 重试（与现有 Stage 2 分块重试同一思路）。

> Stage 1a / 1b 的 prompt **不在本文件范围**，等 Phase 2 通过后再写。

### Phase 5 — UI → Feature 08

在契约稳定后实现 L0 一屏两区、L1 Topic、Breadcrumb、Map/Read 切换、新增 `content.type: map`。Context Consumption 仍是第一个 UI Fixture。

### Phase 6 — 后续（不在本特征内）

现状图（`role: "current"`）· 多进程框架图的人工对比 · 自动 diff · L3 Element Detail 的完整形态 · 接源码形成 `source-verified`。

---

## 13. Gold 与资产盘点

采用当前方案后，**Stage 1 的 Gold 对标基线作废**，需要重建：

| 资产 | 命运 |
|---|---|
| `sourceUnits` 87 条 | ✅ **保留**（文档级原子，与切法无关） |
| `overview-plan.json` 里 21 个 block 的切法 | ❌ 作废 |
| `check-plan` 中与 block 切法 / shape 分布相关的规则 | 🔧 重写 |
| `ai/stage1-plan.prompt.md`（fingerprint `62e8e544c69dd32c`） | 🔧 重写；此前三次对比结论不再可用 |
| `docs/shape-catalog.md` 的 11 个 shape | ✅ 保留（这就是"复用的表达形式"） |
| `stage2-block.schema.json` / `check-block.js` / renderer / shape→content.type 映射 | ✅ 完全不动 |
| Gold framework-map | 🆕 新建（Phase 1 的手工产物就是它第一版） |
| Gold Topic Decomposition（Fixture A） | ✅ 保留，但只作实例；Phase 2 需补 B / C |

---

## 14. 风险

| 风险 | 应对 |
|---|---|
| **方法过拟合 Fixture A** | §11 的三类文档 Gate 是硬门；未通过不进 Phase 3 |
| 元素选不准 | 判据 A~F + 元素总数硬闸门 + Phase 1 手工验证 |
| 元素没有溯源，图变成"AI 插画" | **硬约束**：每个元素必须有 `sourceUnitIds`。没有 provenance 的图是**最容易丢语义**的地方 —— 丢了你都发现不了 |
| topic 划分不准确 | topic 已降级为标签，影响面大幅缩小；改用五判据衡量 |
| Process-heavy 文档使 L0 退化成流程图 | Phase 2 的重点观察项（§11.1 疑问 2） |
| 人工对比多篇文档图成本高 | 明确不在本特征内；v1 靠 `label` 规范性 |
| 复核时无法判断图上是否漏了重要内容 | §7 的 L0 不变量可自动 check |

---

## 15. 明确不做的事

- ❌ Phase 1 不做 UI、不改 renderer
- ❌ 不重写现有 11 个 shape
- ❌ 不做 document set 数据结构（§9）
- ❌ 不新增 §5.2 列出的那 12 种类型
- ❌ 不允许任意连线（§3.2）
- ❌ 不把 topic 数写死为 5
- ❌ 不把 `flow-with-rationale` 之类的局部结构设成通用 Topic Schema
- ❌ 不让 AI 直接从 Markdown 输出 UI，也不让 AI 生成 HTML 替代结构化数据 + 确定性 renderer
- ❌ 不推翻现有 Stage 1 / Stage 2 的整体管道
- ❌ 暂不接入源码（Phase 3 Source Evidence）

---

## 16. 待定项（延后到 Phase 2 之后）

1. **Framework Map 是否必须存在单一主轴？** —— Phase 2 的**重点**。Data-heavy 文档很可能没有主轴（§3.3）
2. **主轴是否需要"泳道 / 层"**（把元素归到 2~3 条横向泳道）—— 用三类文档试出来
3. **`state` 的画法**：badge 还是独立节点 —— 用 A / C 两类文档试出来
4. **L3 元素详情的完整形态**：目前只确定"元素在原文里的定义 + 提到它的 blocks"
5. **跨进程对比是否需要自动 diff** —— 需要先有稳定的元素标识策略

---

## 17. 归档说明

`_archive/` 中的文件**不再是规格**，仅作记录：

| 文件 | 被取代的原因 | 其中被并入本文档的部分 |
|---|---|---|
| `README.v1-topic-card-plan.md` | 以 topic 卡片为主信息架构；含已被证伪的 Entry Points 与"手改生成物 HTML"的任务 | — |
| `hierarchical-topic-synthesis-plan.md` | L0 为 topic 列表（与 §3 冲突）；主张继续复用 21 个 block（与 §7 冲突）；L3 推迟（与 §2 冲突） | **§10.3 质量五判据 · §11 三类文档泛化验证 · §11.3 Track A/B 分离 · §11.4 稳定性比较方式** |
| `framework-map-proposal.draft.md` | 本次讨论的中间草案，内容已全部并入本文档 | §3~§9 的全部内容 |
| `context-consumption-l0-map.json` | 按"topic 当容器"设计，且 blockIds 与另一份划分不一致 | 5 个 topic 的划分思路（§10） |
| `t-02-generation-pipeline-l1-map.json` | 基于已作废的 Entry Points 概念；内容是从 block 手抄的第二真相（无 provenance） | — |
| `topic-划分说明.md` | 基于旧版 21 blocks（四段计数为 Fix 1.3 之前的状态） | 5 个 topic 的划分理由 |
| `validation-plan.md` | 以 topic 卡片 + 模式切换为验证对象；要求直接修改生成物 HTML | 任务式测量的思路（已改写进 `validation-checklist.md`） |

---

## 当前状态

- **重写时间**：2026-09-26
- **本文件定位**：**架构规格**（架构文档）。执行任务与验收清单已拆到 Feature 04 ~ 08，不在本目录
- **Phase 1 状态**：待开始（见 `docs/features/04-l0-framework-map/`）
