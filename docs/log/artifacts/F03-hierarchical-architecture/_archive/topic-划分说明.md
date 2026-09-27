# Context Consumption L0/L1 手工划分说明

## L0 Document Map: 5 个 Topics

### Topic 划分逻辑

| Topic | 标题 | 核心问题 | Block 数量 | 覆盖范围 |
|-------|------|---------|-----------|---------|
| T-01 | 三级语义模型 | 什么是 Consumption？它和 Receipt、Availability 的区别是什么？ | 3 | O-01, O-02, O-09 |
| T-02 | 生成链路与消费点 | 为什么把消费点放在 Outline Generation，而不是 Scene？ | 5 | O-04, O-04b, O-04c, O-05, O-06 |
| T-03 | Consumption Evidence | 怎么判定 Consumption 发生了？最低证据是什么？ | 6 | O-10, O-10b, O-10c, O-11, O-11b, O-16 |
| T-04 | 两条链的边界 | Consumption 和 Output Alignment 是什么关系？ | 3 | O-03, O-07, O-08 |
| T-05 | 产品边界与非主张 | 这个语义模型明确不主张什么？ | 4 | O-12, O-13, O-14, O-15 |

**总计**: 21 blocks → 5 topics

---

## 为什么是这 5 个 Topics？

### ✅ T-01: 三级语义模型（核心定义）

**为什么独立成 Topic？**
- 这是整个文档的**基础概念**
- Receipt / Availability / Consumption 三个概念是后续所有讨论的前提
- 如果不理解这三级递进，后面所有内容都无法理解

**包含的 Blocks**:
- O-01: 这是什么文档（prose）
- O-02: 三级递进模型（ladder）
- O-09: Consumption 定义的递进（ladder）

**为什么 O-09 放在这里而不是 T-03？**
- O-09 是 Consumption **定义**的展开（5 级递进）
- T-03 是 Consumption **证据**（怎么判定）
- 定义属于概念层，证据属于验证层

---

### ✅ T-02: 生成链路与消费点（系统骨架）

**为什么独立成 Topic？**
- 这是整个系统的**架构决策**："把消费点放在哪里"
- Current vs Target 的对比是全文最重要的视觉表达
- 这个 Topic 回答："这个系统是怎么跑的"

**包含的 Blocks**:
- O-04: 当前 vs 目标链路（current-target-flow）
- O-04b: 为什么不在 scene 消费（checklist）
- O-04c: 三个层级 → 代码职责（matrix）
- O-05: 两条链如何流转（flow）
- O-06: Consumption 的对象（two-column-comparison）

**为什么 O-05/O-06 放在这里而不是 T-01？**
- O-05 不是定义 Context-side，而是描述**链路如何流转**
- O-06 不是定义 Consumption，而是说明**什么东西被消费**
- 它们都是在解释"生成链路"这个系统

---

### ✅ T-03: Consumption Evidence（证据体系）

**为什么独立成 Topic？**
- 这是整个文档的**验证机制**："怎么算 Consumption 发生了"
- 证据体系是产品化的关键：没有证据就无法判定状态
- 这个 Topic 回答："怎么知道系统正确运行了"

**包含的 Blocks**:
- O-10: 三级证据阶梯（ladder）
- O-10b: 哪些不能证明 Consumption（checklist）
- O-10c: 两个反直觉判断（checklist）
- O-11: 最低证据（capability-matrix）
- O-11b: 为什么是 Generation Attempt（checklist）
- O-16: Consumption Subject（prose）

**为什么 O-16 放在这里？**
- O-16 定义了 Consumption 的 **Subject**（Frozen Context × Attempt）
- Subject 是证据体系的前提："证据是关于什么的证据？"
- 虽然它看起来像定义，但它服务于证据判定

---

### ✅ T-04: 两条链的边界（职责分离）

**为什么独立成 Topic？**
- 这是整个系统的**设计约束**："Consumption ≠ Alignment"
- Context-side 和 Output-side 的分离是架构的核心原则
- 这个 Topic 回答："什么东西不归 Consumption 管"

**包含的 Blocks**:
- O-03: 被考虑的结构 vs 采用的结构（diff）
- O-07: 三级各能说明什么（capability-matrix）
- O-08: Consumption 不要求什么（two-column-comparison）

**为什么 O-03 放在这里？**
- O-03 对比了"曾设想的结构"和"采用的结构"
- 核心差异是：是否让 Consumption 同时表达 Output Alignment
- 这是两条链分离的设计决策

---

### ✅ T-05: 产品边界与非主张（限制与组合）

**为什么独立成 Topic？**
- 这是整个系统的**边界声明**："我们明确不做什么"
- Non-goal / Non-claim / 状态组合是产品承诺的约束
- 这个 Topic 回答："什么是这个语义模型管不到的"

**包含的 Blocks**:
- O-12: worked-example-first 反例（walkthrough）
- O-13: 五种状态组合的产品解释（combo）
- O-14: 两个边界表（matrix）
- O-15: 明确不做的 8 项 / 不承诺的 5 项（checklist）

**为什么这 4 个放在一起？**
- 它们都是在划定**产品边界**
- O-12 说明"不主张什么策略"
- O-13 说明"状态组合不是自由的"
- O-14/O-15 说明"明确不做什么"

---

## Topics 之间的关系

### Relation 1: T-01 → T-02 (defines)

**关系**: 三级模型**定义了**生成链路的职责边界

**为什么？**
- T-01 定义了 Receipt / Availability / Consumption 三个层级
- T-02 的链路设计必须符合这三个层级的职责边界
- 例如：Outline Generation 是 Consumption 点，Scene 不是

### Relation 2: T-02 → T-03 (produces-evidence-for)

**关系**: 生成链路**产生证据**给 Consumption 判定

**为什么？**
- T-02 描述了系统如何运行
- T-03 描述了如何判定系统是否正确运行
- Generation Attempt 是最低证据，它来自 T-02 的链路

### Relation 3: T-01 → T-04 (separates)

**关系**: 三级模型**分离了** Context-side 与 Output-side

**为什么？**
- T-01 的三级模型只关注 Context 的被使用
- T-04 强调 Consumption ≠ Alignment
- 这是概念模型的约束

### Relation 4: T-03 → T-05 (constrains)

**关系**: 证据体系**约束了**产品边界

**为什么？**
- T-03 的证据体系说明了"什么可以判定"
- T-05 的产品边界受到证据能力的约束
- 例如：因为只能判定 Consumption，所以不能判定教学效果

---

## 对比：现有四段式 vs 新 5 Topics

### 现有四段式

```
甲 · 这是什么              6 blocks
乙 · 它怎么跑              4 blocks
丙 · 怎么算发生了          6 blocks
丁 · 边界与反模式          5 blocks
```

**问题**:
1. "这是什么"包含了太多不同类型的内容：
   - O-01: 文档定位
   - O-02: 三级模型
   - O-03: 设计决策
   - O-04: 系统骨架
   - O-04b/O-04c: 设计理由

2. 用户第一眼看到"6 blocks"，不知道哪些是核心

3. "边界与反模式"把不同类型的边界混在一起

### 新 5 Topics

```
T-01 · 三级语义模型        3 blocks  ← 核心定义
T-02 · 生成链路与消费点    5 blocks  ← 系统骨架
T-03 · Consumption Evidence 6 blocks  ← 证据体系
T-04 · 两条链的边界        3 blocks  ← 职责分离
T-05 · 产品边界与非主张    4 blocks  ← 限制声明
```

**改进**:
1. 每个 Topic 有**单一主题**：定义、骨架、证据、分离、边界
2. Topic 之间有**明确关系**：defines → produces-evidence-for → constrains
3. 用户第一眼看到 **5 个 Topic 标题**，立即知道文档结构

---

## L1 示例：T-02 的内部结构

### 为什么选 T-02 作为 L1 示例？

**理由**:
1. **视觉最丰富**: 有 current-target-flow、checklist、matrix、flow 等多种 shape
2. **最容易说明问题**: "为什么把消费点放在 Outline" 是全文最核心的设计决策
3. **Entry Points 最多样**: 5 个 Entry Points 涵盖了不同视角

### T-02 的 L1 结构

```
生成链路与消费点

Overview
────────────────────
Current: Scene 仍然直接读取 Formal Context
Target:  只在 Outline 消费，Scene 读 Outline

Rationale
────────────────────
为什么 Outline 是消费点？
• 避免重复解释同一份 guidance
• 避免 scene 之间 revision 分叉
• 减少 token 成本
• realized alignment 归因更清晰

Entry Points
────────────────────
→ 当前 vs 目标链路
→ 为什么 Outline 是消费点
→ 代码职责映射
→ 两条链如何流转
→ Consumption 的对象
```

**用户体验**:
1. 用户在 L0 点击 T-02
2. 进入 L1，看到 Overview + Rationale（不需要点击就能看到核心信息）
3. 如果想深入，点击任意 Entry Point 进入 L2（具体 block）

---

## 验证问题

### 关键问题 1: 5 个 Topics 是否太多或太少？

**判断标准**:
- 太少（<3）: 每个 Topic 包含的 blocks 太多（>8），仍然是信息过载
- 太多（>7）: 用户第一眼看不过来，说明没有完成抽象
- 合适（3-7）: 用户能在 10 秒内说出"这篇文档讲 X 件事"

**当前**: 5 个 Topics，每个 3-6 blocks，符合预期

### 关键问题 2: Topic 标题是否清晰？

**判断标准**:
- 好的标题：用户看到后立即知道"这个 Topic 在讲什么"
- 坏的标题：用户需要点进去才知道内容

**当前标题**:
- ✅ "三级语义模型" - 清晰
- ✅ "生成链路与消费点" - 清晰
- ✅ "Consumption Evidence" - 清晰
- ⚠️ "两条链的边界" - 可能需要改成 "Context vs Output 的职责分离"
- ✅ "产品边界与非主张" - 清晰

### 关键问题 3: Relations 是否有意义？

**判断标准**:
- 有意义：箭头表达了真实的依赖/因果关系
- 无意义：箭头是随机连线，不帮助理解

**当前 Relations**:
- ✅ T-01 → T-02 (defines) - 有意义
- ✅ T-02 → T-03 (produces-evidence-for) - 有意义
- ✅ T-01 → T-04 (separates) - 有意义
- ⚠️ T-03 → T-05 (constrains) - 较弱，可能可以去掉

---

## 下一步

1. **今天**: 自己测试，在纸上画出这 5 个 Topics，看是否比 21 blocks 清晰
2. **本周**: 实现 Mock UI，真实渲染 L0/L1
3. **下周**: 用户测试，收集反馈，迭代改进
