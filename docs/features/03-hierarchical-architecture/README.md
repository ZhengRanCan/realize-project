# Feature 03: Hierarchical Architecture (L0 → L1 → L2 → L3)

## 概述

将产品架构从"单一线性阅读流"改为"层级式认知地图 + 多维关系网络"。

## 核心决策

### 信息架构的三个维度

```
Hierarchy（认知层级）
  → L0 (Document Map) → L1 (Topic Map) → L2 (Visual Blocks) → L3 (Element Detail)

Graph（关系网络）
  → Topic ↔ Topic, Block ↔ Decision, Field ↔ Field

Shape（局部表达）
  → flow, matrix, ladder, checklist, diff, ...
```

### 关键原则

1. **Source 是纵向溯源能力**，不是最后一级
2. **What → How → Prove → Boundary** 降级为 Reading Lens，不再是主架构
3. **L0 容量原则**：3-7 Topics（最多 8-10）
4. **现有 21 Blocks** 继续复用在 L2

---

## Phase 1: 手工验证（本周）

### 目标
不改 AI，不动现有 Blocks，只手工定义 L0 + L1，验证用户体验。

### 任务

#### Task 1.1: 定义 Context Consumption 的 L0 Document Map

手工将 21 个 blocks 归纳为 **5 个 Topics**：

```
Context Consumption 语义模型

┌────────────────────────────┐
│ Topic 1                    │
│ 三级语义模型               │
│ Receipt → Availability →  │
│ Consumption               │
└────────────────────────────┘
         │ defines
         ▼
┌────────────────────────────┐
│ Topic 2                    │
│ 生成链路与消费点           │
│ Outline 为主消费点         │
└────────────────────────────┘
         │ produces evidence for
         ▼
┌────────────────────────────┐
│ Topic 3                    │
│ Consumption Evidence       │
│ 怎么算发生了               │
└────────────────────────────┘

┌────────────────────────────┐
│ Topic 4                    │
│ Output Alignment 分离      │
│ 两条链的边界               │
└────────────────────────────┘

┌────────────────────────────┐
│ Topic 5                    │
│ 产品边界与非主张           │
│ 不做什么                   │
└────────────────────────────┘
```

**输出文件**：`docs/features/03-hierarchical-architecture/context-consumption-l0-map.json`

```json
{
  "documentId": "DESIGN-CONTEXT-CONSUMPTION",
  "title": "Context Consumption 语义模型",
  "topics": [
    {
      "id": "T-01",
      "title": "三级语义模型",
      "summary": "Receipt → Availability → Consumption 的递进关系",
      "importance": "core",
      "blockIds": ["O-01", "O-02", "O-03"]
    },
    {
      "id": "T-02",
      "title": "生成链路与消费点",
      "summary": "Outline 为主消费点，Scene 不重复消费",
      "importance": "core",
      "blockIds": ["O-04", "O-04b", "O-04c", "O-05"]
    },
    {
      "id": "T-03",
      "title": "Consumption Evidence",
      "summary": "怎么算发生了、哪些不能证明、Subject 是什么",
      "importance": "core",
      "blockIds": ["O-09", "O-10", "O-10b", "O-10c", "O-16"]
    },
    {
      "id": "T-04",
      "title": "Output Alignment 分离",
      "summary": "两条链的边界、Consumption ≠ Alignment",
      "importance": "core",
      "blockIds": ["O-06", "O-07", "O-08", "O-11", "O-11b"]
    },
    {
      "id": "T-05",
      "title": "产品边界与非主张",
      "summary": "不做什么、不承诺什么、状态组合",
      "importance": "supporting",
      "blockIds": ["O-12", "O-13", "O-14", "O-15"]
    }
  ],
  "relations": [
    {
      "from": "T-01",
      "to": "T-02",
      "type": "defines",
      "label": "三级模型定义了生成链路的职责边界"
    },
    {
      "from": "T-02",
      "to": "T-03",
      "type": "produces-evidence-for",
      "label": "生成链路产生 Consumption 的证据"
    },
    {
      "from": "T-03",
      "to": "T-04",
      "type": "separates-from",
      "label": "Consumption 证据与 Output Alignment 分离"
    }
  ]
}
```

#### Task 1.2: 定义每个 Topic 的 L1 Map

为每个 Topic 定义内部结构（例如 T-02）：

**输出文件**：`docs/features/03-hierarchical-architecture/t-02-generation-pipeline-l1-map.json`

```json
{
  "topicId": "T-02",
  "title": "生成链路与消费点",
  "structure": {
    "type": "flow-with-context",
    "mainFlow": {
      "label": "主链路",
      "stages": [
        {
          "name": "Frozen Context",
          "blockRef": "O-05"
        },
        {
          "name": "Outline Generation",
          "blockRef": "O-04"
        },
        {
          "name": "Context-shaped Outline",
          "blockRef": "O-04"
        },
        {
          "name": "Scene Generation",
          "blockRef": "O-04"
        }
      ]
    },
    "currentProblem": {
      "title": "Current Problem",
      "text": "Scene 仍然直接读取 Formal Context",
      "blockRef": "O-04"
    },
    "rationale": {
      "title": "Why Outline 是消费点？",
      "items": [
        "避免重复解释同一份 guidance",
        "避免 scene 之间 revision 分叉",
        "减少 token 成本",
        "realized alignment 归因更清晰"
      ],
      "blockRef": "O-04b"
    }
  },
  "entryPoints": [
    {
      "label": "当前 vs 目标链路",
      "blockId": "O-04",
      "description": "系统骨架：消费点放在哪一层"
    },
    {
      "label": "为什么 Outline 是消费点",
      "blockId": "O-04b",
      "description": "为什么不把消费点放在 scene"
    },
    {
      "label": "代码职责映射",
      "blockId": "O-04c",
      "description": "三个产品层级 → 现有生产职责映射"
    },
    {
      "label": "两条链如何流转",
      "blockId": "O-05",
      "description": "Context-side 与 Output-side"
    }
  ]
}
```

#### Task 1.3: 修改 Renderer，增加 Document Map 视图

**修改文件**：
- `app/renderer/app.js` - 增加 L0/L1 渲染逻辑
- `app/renderer/styles.css` - 增加 Map 视图样式
- `experiments/stage2-full/overview-preview.html` - 测试新视图

**新增 UI 元素**：

```html
<!-- 顶部模式切换 -->
<div class="view-mode-switch">
  <button class="active" data-mode="map">Map</button>
  <button data-mode="read">Read</button>
</div>

<!-- L0 Document Map -->
<div id="document-map" class="document-map">
  <h1>Context Consumption 语义模型</h1>
  <div class="topic-cards">
    <div class="topic-card" data-topic="T-01">
      <h3>三级语义模型</h3>
      <p>Receipt → Availability → Consumption 的递进关系</p>
      <span class="block-count">3 blocks</span>
    </div>
    <!-- ... 其他 Topics -->
  </div>
  <svg class="topic-relations">
    <!-- 绘制 Topic 之间的关系箭头 -->
  </svg>
</div>

<!-- L1 Topic Map（点击 Topic 后进入）-->
<div id="topic-map" class="topic-map hidden">
  <nav class="breadcrumb">
    <a href="#" data-level="l0">Context Consumption</a>
    <span>&gt;</span>
    <span>生成链路与消费点</span>
  </nav>
  
  <div class="topic-structure">
    <!-- 显示 T-02 的内部结构 -->
  </div>
  
  <div class="entry-points">
    <h3>深入了解</h3>
    <a href="#O-04" class="entry-point-card">
      <h4>当前 vs 目标链路</h4>
      <p>系统骨架：消费点放在哪一层</p>
    </a>
    <!-- ... 其他入口 -->
  </div>
</div>

<!-- L2 Visual Blocks（点击 Entry Point 后进入）-->
<div id="blocks-view" class="blocks-view hidden">
  <nav class="breadcrumb">
    <a href="#" data-level="l0">Context Consumption</a>
    <span>&gt;</span>
    <a href="#" data-level="l1" data-topic="T-02">生成链路与消费点</a>
    <span>&gt;</span>
    <span>当前 vs 目标链路</span>
  </nav>
  
  <!-- 这里显示现有的 O-04 block -->
  <div class="block-container">
    <!-- 复用现有 renderer -->
  </div>
</div>
```

#### Task 1.4: 验证用户体验

**验证问题清单**：

1. **L0 Document Map**
   - [ ] 第一眼能看出"这篇文档主要讲 5 件事"？
   - [ ] 5 个 Topic 的标题是否让你立即知道每个 Topic 的核心？
   - [ ] Topic 之间的关系箭头是否有意义？
   - [ ] 相比"21 个 block 长列表"，这个首页是否更容易理解？

2. **L1 Topic Map**
   - [ ] 点击 T-02 后，能看出"这个 Topic 内部由什么组成"？
   - [ ] "Current Problem" + "Rationale" 这种结构是否有帮助？
   - [ ] 4 个 Entry Points 是否让你知道"可以从哪些角度深入"？

3. **Breadcrumb**
   - [ ] 顶部的 Context Consumption > 生成链路 > 当前 vs 目标链路 是否清晰？
   - [ ] 点击 breadcrumb 能否快速返回上一层？

4. **Map vs Read 模式切换**
   - [ ] 切换到 Read 模式，回到现有的 What → How → Prove → Boundary 是否自然？
   - [ ] 两种模式各自适合什么场景？

**输出文件**：`docs/features/03-hierarchical-architecture/validation-notes.md`

---

## Phase 2: Schema 扩展（验证通过后）

### 扩展 overview-plan.json

```json
{
  "planVersion": 2,
  "hierarchy": {
    "topics": [
      {
        "id": "T-01",
        "title": "...",
        "summary": "...",
        "blockIds": ["O-01", "O-02", "O-03"]
      }
    ],
    "relations": [
      {
        "from": "T-01",
        "to": "T-02",
        "type": "defines"
      }
    ]
  },
  "blocks": [
    // 现有 blocks 不变
  ]
}
```

### Stage 1 增加 Topic 抽象任务

**新增 Prompt 任务**：
```
Your task:
1. Read the entire document
2. Identify 3-7 major Topics (not sections, but conceptual clusters)
3. For each Topic, assign relevant blocks
4. Define relations between Topics

Constraints:
- If you identify more than 10 Topics, you haven't abstracted enough
- Each Topic should contain 2-6 blocks
- Topic title should be 2-6 words, not full sentences
```

---

## Phase 3: Graph 视图（长期）

### 增加 Graph 模式

```html
<div class="view-mode-switch">
  <button data-mode="map">Map</button>
  <button data-mode="read">Read</button>
  <button data-mode="graph">Graph</button>
</div>
```

**Graph 视图显示**：
- 节点：Topics, Blocks, Decisions, Elements
- 边：defines, depends-on, produces-evidence-for, sourced-from
- 交互：点击节点跳转到对应层级

---

## 风险与限制

### 风险
1. **手工 Topic 划分可能不准确** - 需要多次迭代
2. **UI 复杂度增加** - 需要更复杂的交互逻辑
3. **现有 Blocks 可能需要调整** - 某些 Block 可能不适合新的 Topic 归属

### 不做的事情
- ❌ 不立即让 AI 生成 Topics（先手工验证）
- ❌ 不改变现有 21 个 Blocks 的内容
- ❌ 不立即实现 L3 Element Detail（等 L0/L1 稳定）

---

## 成功标准

### Phase 1 成功标准
- [ ] L0 Document Map 让用户第一眼看出"这篇文档讲 5 件事"
- [ ] L1 Topic Map 让用户理解"这个 Topic 内部由什么组成"
- [ ] Breadcrumb 让用户永远知道"我在哪一层"
- [ ] Map vs Read 模式切换自然
- [ ] 至少 2 位用户认为"比现在的长列表好"

### Phase 2 成功标准
- [ ] Stage 1 能稳定输出 3-7 个 Topics
- [ ] Topic 的 blockIds 分配合理
- [ ] Relations 有意义（不是随机连线）

### Phase 3 成功标准
- [ ] Graph 视图能正确显示所有关系
- [ ] 点击节点能跳转到正确层级
- [ ] Graph 视图对"理解关系"有实际帮助

---

## 当前状态

- **创建时间**：2025-01-XX
- **Phase 1 状态**：待开始
- **执行者**：TBD
- **预计完成**：Phase 1 本周完成
