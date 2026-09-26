# Structural Reachability Test（自动化结构检查）

> Feature 04 · 自动化部分
> 产物：`results/structural-reachability.txt`（脚本输出）
> 入口：`drafts/context-consumption.map.json`（mapVersion 2）

---

## 0. 这个检查是什么、**不是**什么

它**只**回答两个结构问题：

```text
1) 有没有"完全无路径"的内容？     ← 它真正的价值
2) 到达一条语义需要几层？
```

它**不是** Track A 的胜负指标。**不要**把它的结果读成"新产物输给了旧产物"。

原因：baseline 的"0 跳"意味着 **21 个 block 已经全部摊在首屏 scroll 里**（`scrollHeight` 约 1059px，11 个折叠）。拿它和"先导航再点进去"比跳数，等于比较"书翻页 vs 网站点击"——技术上没错，但与"认知负担是否更低"这个问题无关。

真正的 Track A 是人工测量，见 `track-a-worksheet.md`。

---

## 1. 方法

**入口有三类**（都是合法入口，见 03 §7.2）：

```text
Document
   ├── document metadata（scope / nonGoalSummary）
   ├── L0 element
   └── Topic → L2 Block
```

**跳数定义**

```text
0 跳 = 首屏可见（document metadata / 元素标签 / topic 命题）
1 跳 = 点元素 → L3 面板（原文 sourceUnit 语句）
2 跳 = 经 Topic → L2 block
∞   = 无路径
```

**测量口径**：`duplicatesMerged` 也算合法覆盖（与 `check-overview` 一致），否则会误报 orphan。

---

## 2. 十道题的结果

| 题号 | 答案所在 unit | 最优跳数 | 问题 |
|---|---|---|---|
| Q1 | SU-080 | 1 跳 | Consumption 的最低证据是什么？ |
| Q2 | SU-026, SU-072, SU-015 | 2 跳 | 哪些情况不能单独证明 Consumption？ |
| Q3 | SU-002, SU-008, SU-039, SU-040 | 1 跳 | Context-side 与 Output-side 的边界是什么？ |
| Q4 | SU-074, SU-075, SU-076 | 1 跳 | 为什么消费点放在 Outline 而不是 Scene？ |
| Q5 | SU-004, SU-021, SU-025 | 1 跳 | Receipt 与 Availability 的区别是什么？ |
| Q6 | SU-006, SU-007, SU-034 | **0 跳** | 为什么不做第四级 Context Influence？ |
| Q7 | SU-061, SU-062 | 1 跳 | Consumption 的 Subject 是什么？ |
| Q8 | SU-030, SU-031 | 2 跳 | Consumption 是否要求最终输出明显不同？ |
| Q9 | SU-065 ~ SU-068 | 1 跳 | 哪些代码路径只能算 Receipt / Availability？ |
| Q10 | SU-035, SU-011 | 2 跳 | 两条链共同支持的产品叙事是什么？ |

```text
分布: 0 跳 1 题 · 1 跳 6 题 · 2 跳 3 题 · 无路径 0 题
入口: document metadata 4 条 · L0 element 42 条 · Topic→L2 86 条
```

Q6 之所以是 0 跳：`document.nonGoalSummary` 在首屏直接承担了"不采用第四级"这条语义。

---

## 3. 核心结论：**完全无路径 = 0**

```text
PASS  87/87 条语义都有可达路径 —— 完全无路径 = 0
```

### 修复前 vs 修复后

| | 修复前（mapVersion 1） | 修复后（mapVersion 2） |
|---|---|---|
| 完全无路径的语义 | **8 条** | **0 条** |
| Topic 数 | 4（每个都强制有 element） | 5 |
| 无入口的 block | O-01 / O-11 / O-13 | 0（O-01 由 document 入口承担） |
| Topic 是否必须挂 element | 是（错误） | 否（§7.1 F3） |

那 8 条是：

```text
SU-028 / SU-029 / SU-030 / SU-031 / SU-087   ← O-11《Consumption 不要求什么》
SU-037 / SU-038                              ← O-13《5 种状态组合的产品解释》
SU-001                                       ← O-01《这是什么文档》
```

**根因**：原先的不变量写作"每个 Topic 至少有一个 L0 element"，于是**图上没有元素的那类内容就不可能有 Topic，整块语义从导航上消失**。这是把 Framework Map 与 Topic Navigation 两件事混成了一件。

**修法**（Feature 04 已实施）：

1. Topic 与 L0 element 解耦（F3）
2. 新增 Navigation invariant（N1 / N2 / N3），其中 **N3 = Semantic Reachability**
3. Topic 的 `blockIds` 按**语义内聚**重新推导 —— 不是为了补 orphan 而新建 Topic
4. `O-01` 改由 `document.scope` 承担（文档级入口，不占 Topic）

---

## 4. 各 Topic 的入口规模

| Topic | elements | blocks |
|---|---|---|
| T-01 三级递进语义 | 4 | O-02, O-07, O-08, O-09 |
| T-02 生成链路与消费点 | 5 | O-04, O-04b, O-04c |
| T-03 消费的证据与判定 | 2 | O-10, O-10b, O-16, O-14 |
| T-04 两条链的边界与状态组合 | 4 | O-05, O-06, O-11b, O-13 |
| T-05 语义边界与非主张 | 1 | O-03, O-10c, O-11, O-12, O-15 |

> **`T-05` 只有 1 个 element 但有 5 个 block —— 这正是"Topic 不等于元素容器"的具体体现。**
>
> 特别注意：`O-13` 没有被单独建成一个「状态组合」Topic，而是并进了 T-04；`O-11` 并进了 T-05。**Topic 由语义内聚决定，不由 coverage repair 决定。**

---

## 5. 局限

1. **测的是结构可达性，不是理解速度**。答案在拓扑里的问题（如 Q4）会被字符串/入口模型低估。
2. **没有测信息过载**。baseline 的 0 跳是"全部摊开"换来的，本检查不度量这件事。
3. **candidate 的 L2 是占位**：链接到现有 21 个 block（只为验证交互，不改变切法）。Feature 07 重新生成 L2 后，跳数会变。
4. **agent 已读过原文**，所以这里只做结构测量，不做记忆型测量，避免污染。
