# 针对数据模型设计场景的改进建议

## 你的核心痛点

1. **AI 生成内容太多** - 看不过来，需要形象化呈现
2. **数据模型迭代快** - 字段多、记不住
3. **顶层架构 OK，但字段交互记不住** - 看到一堆 JSON 字段就晕
4. **AI 返回大段 JSON** - 不知道该不该看这些字段

## 当前系统针对你痛点的覆盖情况

### ✅ 已覆盖
- **形象化呈现** - ladder、flow、matrix、diff 等 shape 代替长文
- **结构化折叠** - O-10b (15 items) 可以默认折叠
- **Source 回查** - 点 §9 可以看原文，不用记住所有细节

### ❌ 未覆盖（这是你最需要的）
- **字段级可视化** - 当 AI 返回一堆 JSON 字段时，无法快速判断：
  - 哪些字段是核心字段？
  - 哪些字段之间有依赖关系？
  - 哪些字段是可选的、哪些是必须的？
  - 字段的合理性如何判断？

## 针对数据模型场景的新 Shape 建议

### Shape 1: `schema-anatomy`（模式解剖）

**用途**：当 AI 设计了一个复杂的数据结构时，快速展示字段的层级、依赖和重要性

**视觉结构**：
```
┌─ FrozenLessonGenerationContext ────────────────────┐
│                                                     │
│  Core Fields (必须)                                 │
│  ├─ contextId          [string]   冻结上下文的唯一标识
│  ├─ revision           [number]   版本号，用于检测不一致
│  └─ digest            [string]   内容摘要，防篡改
│                                                     │
│  Teaching Semantics (核心语义)                      │
│  ├─ objectives         [array]    学习目标
│  ├─ knowledgeScope    [object]   知识范围
│  │   ├─ includedIds   [array]    授权的知识点 ID
│  │   └─ prerequisites [array]    前置关系
│  └─ guidance         [object]   教学指导
│      ├─ required      [array]    必须满足的约束
│      └─ recommended   [array]    推荐策略
│                                                     │
│  Metadata (可选)                                   │
│  ├─ createdAt         [timestamp] 创建时间
│  └─ source           [string]   来源系统
│                                                     │
└─────────────────────────────────────────────────────┘

交互关系：
  contextId + revision → 唯一确定一个冻结版本
  digest → 验证 objectives + knowledgeScope + guidance 未被篡改
```

**优势**：
- 一眼看出字段的**层级归属**（Core / Semantics / Metadata）
- 明确**类型**和**用途**
- 显示**字段间的依赖关系**（例如 contextId + revision → 唯一版本）

---

### Shape 2: `field-decision-matrix`（字段决策矩阵）

**用途**：当你不确定某个字段设计是否合理时，展示每个字段的**设计决策依据**

**视觉结构**：
```
字段名          必须/可选  类型      为什么需要                    不设计为什么不行
───────────────────────────────────────────────────────────────
contextId      必须      string   唯一标识冻结版本              无法关联 request/session
revision       必须      number   检测版本不一致                无法发现过期上下文
digest         必须      string   防篡改，验证语义完整性        无法保证 receipt → availability
objectives     必须      array    Consumption 的核心输入        无法判断是否消费了教学语义
createdAt      可选      timestamp 调试与审计                  不影响 Consumption 判定
```

**优势**：
- 直接回答"为什么要这个字段"
- 反向验证"如果没有这个字段会怎样"
- 帮助你判断**字段设计是否合理**

---

### Shape 3: `field-evolution`（字段演化）

**用途**：数据模型迭代时，展示字段的**变更历史**和**向后兼容性**

**视觉结构**：
```
Revision 1 → Revision 2 → Revision 3
─────────────────────────────────────────────────────────
contextId       contextId       contextId
                ↓ 新增          ↓ 保留
                revision        revision
                                ↓ 重命名
                                digest (原 checksum)
                ↓ 拆分
objectives      objectives      objectives
knowledgeScope  ├─ scope        ├─ scope
                └─ prerequisites └─ prerequisites
                                    ↓ 废弃
                                    [removed: includeAll]
```

**优势**：
- 追踪字段的**迭代路径**
- 明确**破坏性变更**
- 理解**为什么现在是这个结构**

---

### Shape 4: `field-interaction-flow`（字段交互流）

**用途**：展示在一个完整流程中，**哪些字段在哪个阶段被使用**

**视觉结构**：
```
Stage 1: Receipt              Stage 2: Availability       Stage 3: Consumption
──────────────────────────────────────────────────────────────────────────
读取字段：                     读取字段：                   读取字段：
  • contextId                   • contextId                 • objectives
  • request lineage             • revision                  • knowledgeScope
                                • digest                    • guidance
验证：                         验证：                       使用：
  • 上下文到达                   • digest 匹配实际内容        • 投影到 prompt
  • 可关联请求                   • revision 与请求一致        • outline generation

不需要的字段：                 不需要的字段：               不需要的字段：
  ✗ objectives (太早)          ✗ createdAt (无关)          ✗ source (无关)
  ✗ createdAt (无关)                                       ✗ createdAt (无关)
```

**优势**：
- 解决你的痛点："**字段交互记不住**"
- 明确**每个阶段用什么字段**
- 避免"看到一堆字段不知道该不该看"

---

## 针对你的场景，当前系统应该如何改进

### 短期改进（利用现有 shape）

1. **O-01 增加"核心主张"**
   ```markdown
   这份文档解决什么问题？
   → 把课前上下文的"被使用"严格拆成三级递进，
     避免 Receipt/Availability/Consumption 混为一谈。
   ```

2. **增加一个 block："数据结构速览"**
   - 用 `matrix` shape 展示核心字段
   - 列：字段名 | 类型 | 必须/可选 | 用途
   - 行：按重要性排序（Core → Semantics → Metadata）

### 中期改进（新增 shape）

3. **实现 `schema-anatomy` shape**
   - 专门用于数据模型可视化
   - 支持层级缩进、类型标注、依赖箭头
   - AI 生成时自动标注重要性（Core / Supporting / Optional）

4. **实现 `field-decision-matrix` shape**
   - 专门回答"为什么需要这个字段"
   - AI 生成时强制要求填写"不设计为什么不行"

### 长期改进（交互式功能）

5. **字段高亮与过滤**
   - Renderer 支持按重要性过滤字段
   - 默认只显示 Core 字段，Optional 字段折叠
   - 点击字段时，高亮所有使用它的地方

6. **字段交互图**
   - 可视化字段之间的依赖关系
   - 例如：contextId + revision → 唯一版本

---

## 立即可以做的：给当前文档打补丁

我可以帮你在当前 Stage 2 Full Run 的基础上，增加一个新的 block：

**O-01b: 核心数据结构速览**
- Shape: `matrix`
- 内容：FrozenLessonGenerationContext 的关键字段
- 目标：让你打开文档后，立即知道"这份文档在讨论的数据结构长什么样"

要不要我现在就生成这个 block？
