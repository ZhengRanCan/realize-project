# Gap 分类：每个"装不进去"的东西归到哪一类

> Feature 05 · Task 2.4 · **本 feature 的主要交付物之一**
>
> 纪律：**遇到装不进去的内容，第一件事不是加类型，而是分类。**
> 分类流程与四类定义见 `docs/features/03-hierarchical-architecture/README.md` §11.1.1。

---

## 0. 结论先行

```text
Semantic gap   0 条   ← 没有任何一项需要第 7 类元素
Relation gap   3 条
Navigation gap 1 条（Fixture A，已在 Feature 04 修复）
Layout gap     1 条
Capacity gap   5 条   ← ⚠️ 现有 4 类装不下，见 §2

建议扩 ontology 的项：0 条
```

> **三篇文档、36 个元素、跨三种文档类型，没有出现一次"类型不够用"。**
> 所有不适配都发生在**边、配额、入口**这一层，而不是类型层。

---

## 1. 逐项归类

分类流程（照 03 §11.1.1）：

```text
某个东西装不进去
      ├─ 它该不该进 L0 图？ ── 不该 ──▶ Navigation gap
      └─ 该进
            ├─ 六类里有它的位置吗？ ── 没有 ──▶ Semantic gap
            └─ 有
                  ├─ 关系能用 8 词表达吗？ ── 不能 ──▶ Relation gap
                  └─ 能 ──▶ Layout gap
```

| # | 内容 | Fixture | 该进图？ | 类型有位置？ | 关系能表达？ | 归类 | 理由 |
|---|---|---|---|---|---|---|---|
| 1 | 两端实现必须与**同一份 fixture 逐字节一致** | B | ✓ | ✓ (`component` + `artifact`) | ❌ | **Relation gap** | 没有 conformance / agreement 关系词。现在只能挂 attachment，而"依赖"≠"必须一致" |
| 2 | Candidate Inbox **持有** Candidate | C | ✓ | ✓ (`artifact`) | ❌ | **Relation gap** | 只能用 `contains`，而它的既定语义是"component 嵌套 process"；"存储持有"是拉伸 |
| 3 | Proposal **校验通过后放行**进入 Memory | C | ✓ | ✓ (`process`) | ❌ | **Relation gap** | `validates` 只表达"谁校验谁"，**"通过 / 放行"这一结果语义没有词** |
| 4 | A 曾有 8 条语义**没有任何入口** | A | ✗ | — | — | **Navigation gap** | 内容不该进图，但读者必须能走到 → 加 Topic 入口（F04 已修，现为 0） |
| 5 | `intermediate` 无法区分流水线里不同阶段的 process（规范化的 vs JCS 序列化） | B | ✓ | ✓ (`process`) | ✓ | **Layout gap** | 类型与关系都对，只是 `role` 的粒度不够细。**不需要新类型**，属画法/标注问题 |
| 6 | §12 的 **7 条**实施不变量，图上只放得进 **2 条** constraint | B | ✓ | ✓ (`constraint`) | ✓ | **Capacity gap** | 类型够用、关系够用，纯粹是 ≤12 的位置不够。被挤掉的是"Hash 不是授权 / 不是加密 / 相同语义相同字节" |
| 7 | **三个** Digest Profile 被压成 **1 个** `concept` 节点 | B | ✓ | ✓ (`concept`) | ✓ | **Capacity gap** | 三个 purpose 是并列实例，理论上该是三个节点；放不下 |
| 8 | **6 个状态 + 迁移**的状态机被压成 **1 个** `state` 节点 | C | ✓ | ✓ (`state`) | ✓ | **Capacity gap** | `state` 本义是"某对象某一时刻的状态"（单数）；把整台状态机压成一个节点是配额所迫 |
| 9 | Mastery 分支末端**没有产物节点**（两支不对称） | C | ✓ | ✓ (`artifact`) | ✓ | **Capacity gap** | 第 13 个节点放不下，只能让 `MasteryEvidenceProjector` 成为末端 process |
| 10 | §3 的 5 条关键原则 + §14 的 4 条规则，图上只放得进 **2 条** constraint | C | ✓ | ✓ (`constraint`) | ✓ | **Capacity gap** | 被挤掉的是"单一权威后端"、"不信任 Candidate 自报身份"、"不得用一个 success:true"、四类 confidence |

**逐条说明**

- **#1 / #2 / #3 都是"节点没问题、边不够用"** —— 这正是为什么必须先分类：如果一看到别扭就加类型，会往 ontology 里加三个根本不需要的类型。
- **#5 是真正的 Layout gap**（类型对了，画法/标注不够细），它**不能**用扩 ontology 解决。
- **#4 是唯一一个 Navigation gap**，而它已在 Feature 04 修复 —— 并且 B / C 各出现一次"没有 element 的 Topic"（见 `rule-matrix.md` R6），说明这类缺口在别的文档上更容易复现。

---

## 2. ⚠️ 现有 4 类装不下：建议补第 5 类 **Capacity gap**

**#6 ~ #10 共 5 条，按 03 的决策树都会被归到 `Layout gap`** —— 因为类型和关系都能表达。但它们的真实原因**不是画法**：

| | Layout gap | Capacity gap（本次提出） |
|---|---|---|
| 定义 | 类型对了，只是**画法**不适合 | 类型对了，但 **≤12 的位置不够**，必须把内容推到 L1/L2 或压缩成标注 |
| 解决方式 | 换布局策略（洗牌、分组） | **只能减内容、或者放宽配额** |
| 例子 | #5 role 粒度不足 | #6 七条不变量只能放两条 |

**证据强度：三篇文档全部顶到 12/12。**

```text
A  12 / 12
B  12 / 12
C  12 / 12
```

而且**流水线越长，留给 constraint 的位置越少**：B 与 C 的图上都只剩 2 条 constraint，低于 03 §5.5 那个"通常 3~5 条"的经验值（该经验值来自 Fixture A 的 33 条负向内容，是**文档特定的**）。

**建议**（供 Phase 3 讨论，本次不改规格）：

> 在 §11.1.1 的 gap 分类里补 **Capacity gap**，并明确：
> - 它**不需要**扩 ontology；
> - 处理方式只有两种：把内容降到 L1/L2（靠 Topic 入口保证可达），或调整容量规则（例如让 `constraint` 以标注形式附加、不占 element 配额）。

---

## 3. 明确否定的两个动作

1. **不新增第 7 类元素。** 三篇里没有一项属于 Semantic gap。
2. **不新增第 9 个关系词（本次）。** 3 处 Relation gap 都记录下来了，但它们是否值得补词，应该和 Feature 06 的契约一起讨论 —— 因为补词会影响 A 的既有产物。这里只记录，不顺手改。

> 这正是 03 §11.1.1 那条铁律的用处：**如果一看到 B 有东西装不进去就加一类，三篇文档下来 ontology 会从 6 类涨到 9~10 类，AI 分类立刻开始漂。**
