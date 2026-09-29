# Overview 覆盖标准

- **状态**：NORMATIVE —— 本文件是 **Overview 覆盖标准**与「Overview 区块覆盖率」指标的 authority
- **适用范围**：Overview（design-review 侧的四段可视化）的**覆盖判据**；不定义 Reading 侧语义
- **历史状态归档**：`docs/log/artifacts/mvp-phase1/overview-coverage-history.md`
  （当时的逐区块覆盖表、覆盖率快照、执行时间线、audit 输出、block inventory 演化）

> Reading 侧的 coverage 术语对照与认识论状态分离见
> `docs/specs/reading-view-cognitive-contract.md`（coverage 术语对照见 **Decision F.1**；
> 认识论状态分离见 **§5 S1–S4**）；本文件不定义 Reading 侧语义。

---

## 0. 验收规则

```text
重要语义不得因可视化重述而丢失；
允许通过层级、折叠、视图切换降低同时出现的信息量。

验收标准 = 语义覆盖，不要求句子覆盖。
```

即：从 Overview 回到原文核对时，**不能发现某个重要概念、边界、例外、反例、Current/Target 差异
或未决事项完全消失**。但原文里反复从不同角度强调同一件事的段落（例如多处重述
`Receipt ≠ Availability ≠ Consumption`），只要求**该语义及其边界、例子、反例被完整保存**，
不要求逐句出现。

配套自查口径：**如果某一节的可视化版本并不比读原文更好懂，那不算可视化成功**，只是换了排版。

---

## 1. 主阅读流

原文的推进方式是「概念定义 → 代码映射」，但可视化重述需要先把「系统怎么跑」建立成空间 / 流程认知，
再解释抽象语义。因此采用**四段认知路径**：

| 段 | 认知任务 |
|---|---|
| **甲 · 这是什么** | 建立核心定义与系统骨架 |
| **乙 · 它怎么跑** | 运行状态与双链流转 |
| **丙 · 怎么算发生了** | 状态判定与边界隔离 |
| **丁 · 边界与反模式** | 明确不做什么、不主张什么 |

每个区块带 `Source: §…` 标签（悬停 / 点击可回原文核对），所以**不需要两套排序**。

> 这四段同时也是 L2 Block 的 `stage` 值域与规范顺序 —— 但那部分语义由
> `reading-view-cognitive-contract.md`（Decision C）定义，本文件只负责 Overview 侧的排列。

---

## 2. 「Overview 区块覆盖率」的定义与推论边界

```text
Overview 区块覆盖率 = 已承载区块数 / 覆盖表中列为必须保存的区块数
```

**它只按区块个数计算，不代表语义权重。** 区块之间信息重量差异极大 —— 一个骨架区块可能背靠原文
约 18% 的篇幅，而一个边界小卡只对应一段。

因此允许与禁止的推论必须分清：

| 允许 | 禁止 |
|---|---|
| 回答「还有多少块没做」 | 推断「方案已经讲清楚了 x%」 |
| 作为实施排期的进度度量 | 作为语义权重的度量 |
| 逐次 audit 各记各的 | 把某一次 audit 的数值当成长期常量写进标准 |

- **该数值是 audit 快照**，每次运行各记各的；它不构成覆盖标准的一部分。
- 覆盖率**不得**与任何其它 coverage 合成一个数字（沿用 `framework-map-contract.md` §1 的纪律）。

---

## 3. 可追溯性与 Review Object 关联

```text
每个 Overview 区块必须能够追溯到原文语义，并可关联对应的 Review Object。

Review Object 可以是：Decision / Fact / Gap / Open Question / Semantic Model
```

（这里的 Review Object 沿用模型里已有的对象类型，**不新增类型**。）

之所以不用"必须能挂到 Decision 或 Fact"：边界集合类区块本来就主要对应 Gap 与 Open Question，
而范围声明、边界、语义模型类区块本质是 Definition / Boundary / Semantic Model ——
为了满足一条过窄的规则去人为制造 Decision，会让 Review 清单虚胖，
也会污染"一条 Decision = 一个可独立批准判断"的定义。

**机器检查（audit）**：**原文每一节都必须被某个区块的 `sources` 引用，
每条 Decision 都必须能被某个区块的 `reviewObjects` 关联**，任一落空即失败。

**反向检查**：若新增 Decision 在所有区块里都找不到承载体，说明覆盖表需要扩展，
**不得**把它塞进某个不相关的区块。

---

## 4. 措辞强度规则：证据方向不得写成结论

原文只确定「**最低证据应以 generation-level 为主**」（要能说明某次 Attempt 使用了哪个 Frozen Context、
哪个 generation-facing projection）；原文**明确没有决定** evidence 的具体结构，那是未决项。

因此在 Overview 中**不得**出现下列措辞：

| 不许写 | 原因 | 改写为 |
|---|---|---|
| `Minimum sufficient direction` | `sufficient` 等于宣称"这样就够了"，而原文没有认定充分条件 | `Minimum evidence direction` / `Evidence target` |
| `Consumption record` | `record` 暗示了一种待落库的数据结构，替原文做了未决决定 | `Consumption Evidence` |
| `… 即可证明 Consumption` | 同上，把方向写成了结论 | `最低证据方向指向 …` |

凡涉及未决项的区块，必须**显式标注"这仍是未决项"并链到对应 Open Question**，不得写成确定结论。

> 这条纪律的通用形式（不只适用 Overview）见 `reading-view-cognitive-contract.md`
> N7 / N8：**证据级别、方向、审阅状态都不得被升级成 claim 结论。**

---

## 5. 不做句级搬运

以下内容**不做逐句呈现**（否则 Overview 会退化成文档阅读器），但其语义必须被某个区块吸收：

| 原文形态 | 处理原则 |
|---|---|
| 同一语义的多处重述（不同措辞讲同一件事） | 由该语义对应的区块一次性表达边界 |
| 同一职责在正文与代码章节各讲一次 | 合并到承载它的区块，不保留两处真相 |
| 反复出现的水位论证（"这已经明显强于当前目标"） | 保留结论与反例，不保留重复论证 |
| 列举式清单的逐条展开式论证 | 保留条目本身；论证留在对应 Decision 的 Full Rationale |

判据：**删掉的是重复的论述，不是语义。** 若某条语义因此失去承载体，属 §3 的覆盖失败，不是"句级搬运"。

---

## 6. 与其它文档的边界

| 主题 | authority |
|---|---|
| Overview 覆盖标准、区块覆盖率 | **本文件** |
| 区块的形状选择与容量 | `docs/specs/shape-catalog.md` |
| `overview-plan.json` 的结构与校验 | `schema/overview-plan.schema.json`、`scripts/check-plan.js` |
| Reading 四层认知职责、coverage 术语、认识论状态 | `docs/specs/reading-view-cognitive-contract.md` |
| 当时的覆盖表与实施状态 | `docs/log/artifacts/mvp-phase1/overview-coverage-history.md`（历史，非规范） |
