# framework-map 契约 —— 历史证据与推导过程

> **NON-NORMATIVE — historical evidence and rationale.**
> **For current Framework Map semantics, [`docs/specs/framework-map-contract.md`](../../../specs/framework-map-contract.md) is authoritative.**
>
> 本文件保存契约正文中原本混入的历史材料：实测数字、bug 发现过程、当时的两难与裁决、
> 已完成的任务清单。用途是回答"我们怎么发现这些规则、当时发生了什么"，
> **不回答"今天必须遵守什么"**。

---

## 1. 为什么必须冻结"不要为了消灭 gap 而扩词表"

**F09 关闭时的裁决原文：** 只要"消灭 gap"成为目标，词表一定会长成这样 ——

```text
acyclic-depends-on / date-within / at-most-one-per-key / ...
```

也就是把**业务不变量**伪装成**关系类型**。这类词无法泛化到下一篇文档，且会让 `check-map` 的封闭词表失效。

---

## 2. `element budget = 12` 的实测依据

实测（Feature 05）：**三篇 Fixture 全部顶到 12/12**，而且**流水线越长，留给 constraint 的位置越少**：

```text
B 的 §12 有 7 条实施不变量  → 图上只放得进 2 条 constraint
C 的 §3 + §14 有 9 条原则与规则 → 同样只放得进 2 条
```

后续 F09 实测（§9 第 4 问）：E 用了 13 个（超 1），D 重表达后仍是 12。
"顶格"成立，"明显不够"不成立 —— 预算保持 12 不变，E 的 13 作为 Capacity 压力的持续样本保留。

---

## 3. 关系三层的推导：Fixture D 的 6 处"词表不够"

Feature 05 发现 3 处、Feature 09 在 Fixture D 上发现 6 处"词表不够"。
逐条补词会得到第 9 / 10 / 11 个动词，而其中大部分缺口**根本不是缺动词**，是缺**结构属性**：

| D 上的缺口 | 真实缺什么 | 补法 |
|---|---|---|
| PlanBundle = Plan + Stage[] + Task[] | 组成关系 + 归属 | 现有 `contains` + `ownership: owned` |
| Every initial Task belongs to one Stage | 「恰好一个」 | `cardinality: {from: one, to: one-or-many}` |
| DailyReview may reference or summarize TaskResults | 引用而非拥有 | `contains` + `ownership: reference` |
| UserProfile 被规划引用，不属于任何单个 Goal | 共享、无单一 owner | `relates-to` + `ownership: shared` |
| One Goal may have multiple Plan versions | 1:N | `cardinality: {from: one-or-many, to: one}` |
| Task 依赖无环 + 只有 done 才算满足 | **关系自身的不变量** | 留在 `relationGap`（第 3 层）|

**推论：** element 有 ontology，relation 同样不能只有一个动词 —— 由此建立
`type`（基本语义）+ `qualifiers`（结构属性）+ `constraint`（外挂约束）三层。
补上 cardinality / ownership 后，D 的 `relationGap` 从 6 降到 2。

---

## 4. `contains` 定义放宽的来历

```text
旧（过窄）：contains = component 嵌套 process
新（本契约）：contains = A 的结构中包含 B（结构性包含 / 组成）
              ownership 由 qualifier 表达，不由动词表达
```

这条放宽是**必要的**：旧定义把领域聚合（`PlanBundle` 持有 `Plan` / `Stage[]`）判成"拉伸"，
于是 Fixture D 的第一条缺口其实是**定义太窄**造出来的。放宽后，`contains + owned` 与
`contains + reference` 能区分"拥有"与"只是引用"。

---

## 5. `W8` 的实测数字：两次都不触发，两次都正确

Fixture D 重表达前是 **6/15 = 0.40**（未触发，逐条列 6 条），重表达后降到 **2/13 = 0.15**。
两次都不触发 W8，两次都是**正确**结果。

**所以不要为了让某个 Fixture 触发 `W8` 去调阈值。**

---

## 6. Structured Constraint Gap 的 Fixture D 实例清单

（含原文行号，仅作为当时的登记证据；当前规则见契约 §5.4 的分流规则。）

| 不变量种类 | D 上的实例 | 现状 |
|---|---|---|
| 图级无环 + 条件满足 | 同一 PlanBundle 内 Task 依赖无环；"被引用 Task 为 done"才算满足 | 留在 `relationGap`（成对锚定） |
| 跨实体区间包含 | `Task.scheduledDate ∈ Stage.[startDate, endDate]` | 留在 `relationGap`（成对锚定） |
| 条件唯一（单实体槽位） | 每 Goal/date 至多一条 `DailyReview`（L605）；每 Goal/Plan/date 至多一条选择（L643）；每 Goal/Plan/date 至多一条 dismissal（L708）；每 fingerprint 至多一条 summary（L742）；同一时刻至多一条 active Plan（L262） | **仅登记**：槽位唯一性不是"两个元素之间的关系"，塞进 `relationGap` 会把它变成杂物袋 |

**为什么条件唯一不进 `relationGap`（F09 关闭时的裁决）：** `relationGap` 的形状是"两个元素之间的一条关系"，
而"每 Goal/date 至多一条 DailyReview"约束的是**单个实体的槽位键**。
为它造一条 `DailyReview ──???──> DailyReview` 自环边只会**误导 L0 图**。

---

## 7. 「不要强行串链」的来历（Feature 05 的真实经历）

设计 Fixture C 时，前两版方案都把两个分支压成了一条链：

```text
第一版：Fact → MasteryProjector → Memory Surface      （把 Memory 当成 Mastery 的下游）
第二版：Fact → Proposal → Validator → Memory Surface   （把 Mastery 整支丢掉）
```

两版都"看起来整齐合理"，而且都是错的。**纠正它的不是判断力，而是文档里恰好写了一句话**：

> Mastery 与长期 Memory/L2-L3 是从同一 `FusionLearningFact` 派生的**不同投影结果**；
> Mastery 更新**不作为** Profile Agent 或 Memory Consolidation 的隐式前置条件。

**如果那句话不存在，一张错误的单主轴图就会被当成正确产物交付。**

---

## 8. 校验器「不误报」原则的三个踩坑实例

三篇 Fixture 都是已经通过人工验证的产物；如果它们被自己的校验器判 Hard Error，
**先怀疑校验器写得太死**。已经踩到的三个例子：

1. **不要用 in-degree 判 DAG**：不按 `consumes` 归一化的话，任何"被生产又被消费"的 artifact
   都会被误判成收敛节点（A / B / C 全中）。已修。
2. **原文小节无法解析时不要判悬空引用**：Fixture A 用「## 一、」而非「## 1.」，
   如果直接拿空的小节全集去比对，每个引用都会变成 HARD。正确做法是**跳过并出 Warning**（`W0`）。已修。
3. **单点 Topic 是形态差异，不是缺陷**（原 `W4`）：一个 Topic 只承载一节"问题动机"是合法的窄 Topic。
   作为告警在 Fixture B 上命中过一次，价值低、噪音高 → 降级为 `I6`。

---

## 9. Phase 2b 的问题：已答（F09 关闭时的记录）

```text
1. D / E 上的 Hard Error 是真契约违反，还是 validator 太死？
   → 都不是。D 的 2 个 HARD 来自**校验器的 bug**（section parser 只认 "## N."，
     把 D 的 "## Goal" 全部解析失败，于是 N2/N3 被跳过、M8 漏网）；
     E 的 0 个 HARD 保持。修正 parser 后 D / E 都是 HARD 0 · PASS。

2. Warning 有没有大量误报？
   → 有一处真误报：W4「Topic 只挂一个 block/section」。已降级为 I6。
     另一处是**噪音**而非误报：6 条 W5 平铺在报告顶部 → 改为少而散逐条、多而密集合成 W8。

3. 有没有新的 Semantic gap / Relation gap？
   → Semantic gap = 0（D / E 都不需要第 7 类 element）。
     Relation gap：D 报 6 处，其中 5 处的真实成因是**缺结构属性**而不是缺动词；
     补上 cardinality / ownership 后 D 的 relationGap 6 → 2，剩余 2 处是真的第 3 层（Constraint 语义）。

4. 12 在 D / E 上是否明显不够？
   → E 用了 13 个（超 1），D 重表达后仍是 12。"顶格"成立，"明显不够"不成立。
```

---

## 10. parser bug 的教训（Feature 09 最贵的发现）

```text
校验器"通过"不等于被校验。parser 解析不出小节时跳过了 N2/N3，
状态却仍显示 PASS（应为 PASS WITH INCOMPLETE VALIDATION），
于是 D 的 M8（删除顶层小节入口）**漏网** —— 一个假阴性被自己的报告盖住了。
```

由此产生的规范结论（**已写入契约**）：**跳过检查必须显式可见**，
而且 parser 的正确性要和 validator 的严格性一起验证。

---

## 11. 当时的「下一步」（本轮不做，且不阻塞 Feature 07）

```text
1. F06 contract migration regression（可选，单独一轮）
   A / B / C 的 candidate map → 按最新 Contract 重表达
   验收方式：重表达后 relationGap 的变化必须是**实测**，不能因为"机制上已能表达"就宣布关闭
   （典型例子：Fixture C 的"持有 / 存储"—— 机制上 contains + owned 已可表达，
     但原 map 未重表达，因此现在只能记为 follow-up）

2. constraint.parameters 表达面（第 3 层的结构化）—— 先保持登记

3. 语义验收标准的重写（现用 1:1 语义 proxy 度量，需要真正的语义覆盖判据）

4. AI 生成链路（Feature 07）—— 已是下一阶段主线
```

---

## 12. Feature 09 关闭裁决与后续重心

**Feature 09 = 完成；Gate = PASS。** 当时的支撑证据：

```text
A / B / C / D / E      五篇 HARD = 0 · 全部 PASS
Mutation               14/14 可检测项全部拦截
Semantic gap           0
Navigation coverage    D / E 均真正执行，不再 SKIPPED
ER-heavy relation      通过 qualifiers 从 6 gaps 降至 2 structured constraints
Capacity               13 elements 仅 Warning，没有被硬卡
Topology               chain / DAG / star-DAG 均可表达
```

**结论的确切含义（不要读过头）：**

```text
✅ 支持   Framework Map Contract v1 可以进入下一阶段（让 AI 自动生成）
❌ 不意味着 ontology 永远不会变
```

**当时的下一步重心已经改变：**

```text
过去（F03~F09）：我们设计的表示模型对不对？
接下来（F07）：  AI 能不能稳定地从任意技术文档生成这个表示模型？
```

**并且：继续打磨 Contract 的边际收益已经开始下降** —— 下一批真正有价值的信息来自
**AI generation 的稳定性测试**，而不是再多找一篇人工 candidate map。
