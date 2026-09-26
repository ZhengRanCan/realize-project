# 修复轮执行记录（R1–R8）

> Feature 09 · 修复轮
> 依据：用户对 `rule-adjustments.md` 的裁决
> 结果：**Gate = PARTIAL PASS → PASS**（判定依据见 `adversarial-report.md` §7）
> 复现：`verification-output.txt` · `mutation-output.txt`

---

## 0. 裁决 → 执行对照

| # | 裁决 | 处置 | 证据 |
|---|---|---|---|
| R1 | 修 Markdown section parser（识别任意标题，长期语义 = heading tree） | ✅ 已执行 | `scripts/check-map.js` `readDocHeadings` |
| R2 | 复测 D 的 `N2/N3`；M8 在 D 上必须被拦 | ✅ 已执行 | `coverage 21/21`、`SKIPPED 0`、拦截率 100% |
| R3 | `edges[]` 加可选 `qualifiers`（仅 `cardinality` + `ownership`），另加可选 `id` / `label` | ✅ 已执行 | `schema/framework-map.schema.json` · `check-map.js`（H8 / W7） |
| R4 | 用「基本关系 + qualifiers」重表达 D，重算 relationGap | ✅ 已执行 | `drafts/fixture-d.map.json`：6 → **2** |
| R5 | `contains` 放宽为「结构性包含 / 组成」；`Goal references UserProfile` 仍不可用 `contains` | ✅ 已执行 | `framework-map-contract.md` §5.2 · `03/README.md` §6.1 |
| R6 | `W4` → INFO；新增「关系缺口密度」聚合 Warning；明细挪到 detail 段 | ✅ 已执行 | `I6` · `W8`（公式见下） |
| R7 | 登记 Structured Constraint Gap，不阻塞 Gate | ✅ 已执行 | `framework-map-contract.md` §5.4 |
| R8 | 更新 Gate | ✅ 已执行 | `Gate = PASS` |
| R9 | 修复轮内不动 Feature 07 | ✅ 修复轮内未动；**关闭裁决后 07 → Ready**（见 §7） | — |

**明确没做的事**（本轮范围外）：第 7 类 element · 一批新关系动词 · `constraint` 参数 DSL · 主轴规则 · 泳道 · 改 `12` 预算 · Feature 07。

---

## 1. R1 / R2：section parser 与它的连锁反应

### 1.1 真正的 bug 比"只认 `## N.`"更深一层

修第一版（识别任意 `#`~`######`）之后，**Fixture E 反而从 PASS 变成 FAIL**（HARD 2 · coverage 2/9）。

```text
根因：E 是 runbook，代码围栏里的 shell 注释
      "# 在 cloudfunctions/<fnName> 目录下" / "# 期望: 无输出"
      被当成 level-1 标题 → sectionLevel 被压到 1
      → 顶层小节全集错位 → N2/N3 误判
```

**这是"修 parser 时同时修好判据"的教训：** 一个更"宽"的 parser 不是更正确的 parser。Markdown 语义上**围栏代码块内的 `#` 不是标题**，围栏跟踪是 heading tree 的一部分，不是可选优化。

### 1.2 最终实现

```text
1. 围栏感知（``` / ~~~，含长度判定），围栏内的 # 一律跳过
2. ATX 形式：# 后必须有空白
3. 稳定 key：编号开头取编号 token（"4" / "4.1"），否则取标题文本
   → §4 · §4.1 · §Goal · §FocusSession, TaskResult and DailyReview 都可解析
4. sectionLevel = 最浅的、且至少 2 个标题的那一层（跳过孤零零的文档大标题）
```

### 1.3 复测（R2）

| | 修复前 | 修复后 |
|---|---|---|
| D 的 `coverage` | SKIPPED | **21/21 有路径** |
| D 的 `SKIPPED` 段 | 引用可解析性 + N2 / N3 | **（无）—— 全部检查都已执行** |
| D 的状态 | `PASS WITH INCOMPLETE VALIDATION` | **`PASS`** |
| **M8（D：顶层小节失去入口）** | ❌ 漏网 | ✅ **拦住（H5）** |
| 拦截率 | 13/14 = 93% | **14/14 = 100%** |
| E 的解析 | `sectionLevel 1`（被注释污染） | **`sectionLevel 2`，top = 1…11** |

> **M7（强行串联无关节点）仍然"判不出来"，这是设计如此** —— 它属 semantic rule，不是 schema rule，只作人工审计项，不计入拦截率。

---

## 2. R3 / R4：关系分三层，以及 D 的重表达

### 2.1 三层模型

```text
第 1 层  基本语义    type        ← 8 词受控词表
第 2 层  结构属性    qualifiers  ← cardinality {from,to} / ownership
第 3 层  外挂约束    constraint  ← 无环、区间包含、条件唯一（暂只有登记）
```

裁决的关键判断是：**D 的 6 条缺口里，大部分不是缺动词，是缺结构属性。**

### 2.2 D 的重表达逐条

| 原缺口 | 重表达 | 依据（原文） |
|---|---|---|
| PlanBundle = Plan + Stage[] + Task[] | `contains` + `owned` + `{from: one, to: one}` / `{one, zero-or-many}` | L301–305 `{ plan: Plan; stages: Stage[]; tasks: Task[] }` |
| Task 归属唯一 Stage | `contains` + `owned` + `{one, one-or-many}` | **L395** "Every initial Task belongs to one Stage" |
| Task 依赖图 | `depends-on` 自环 + `reference` + `{zero-or-many, zero-or-many}` | L396 `Task.dependsOnTaskIds` |
| DailyReview 引用 / 汇总 TaskResult | **新增边** `contains` + **`reference`** + `{one, zero-or-many}` | **L605** "may reference or summarize the Task results… only one DailyReview per Goal/date" |
| UserProfile 被引用但不被拥有 | **新增边** `relates-to` + **`shared`** + `{one, zero-or-many}` | L271 "cross-goal reusable user context" |
| 一个 Goal 多条 Plan 版本 | `depends-on` + `owned` + `{one-or-many, one}` | **L262** "may have multiple historical Plan versions" |

**顺带的清理：** 删除 `attachments` 里 `E-09 → E-07` 那一项 —— 它原本是"没有 verb 时用侧挂代替"的权宜之计，现在有了 `contains + reference` 的正规表达，侧挂就成了重复登记。`attachments` 3 → 2。

**没有动的东西：** `elementCount` 仍是 12（不加第 13 个 element，避免把 E 的 Capacity 压力样本和 D 混在一起）。

### 2.3 relationGap：6 → 2

保留的 2 条都**不是**缺动词，而是缺第 3 层：

| 保留项 | 为什么留下 |
|---|---|
| `E-06 ⇢ E-06`：同一 PlanBundle 内依赖无环 + "被引用 Task 为 done"才算满足 | `depends-on` + 基数已能表达"有多少条"；缺的是**关系自身的图级不变量**与**条件满足语义** |
| `E-05 ⇢ E-06`：`scheduledDate ∈ Stage.[startDate, endDate]` | 归属已由 `contains + owned` 表达；缺的是**跨实体区间包含不变量** |

**判定规则（写进契约）：** 保留在 `relationGap` 的是**成对锚定**的不变量（涉及两个元素的相对定位）；**单实体槽位唯一性**（如"每 Goal/date 至多一条 DailyReview"）只登记，不塞进 `relationGap` —— 否则它会变成杂物袋。

缺口密度：`2 / (2 + 11) = 0.15`（修复前 `6 / (6 + 9) = 0.40`）。

---

## 3. R6：告警体系的调整

| 调整 | 内容 |
|---|---|
| `W4` → `I6` | "Topic 只挂一个 block / section" 降级为 **INFORMATIONAL**。跨 B / E 命中 3 次**全部自然**（B 的 T-01 问题动机、E 的 T-03 撤销与越权、E 的 T-08 修订记录）—— 低价值告警 |
| 新增 `W8` | 关系缺口密度聚合告警 |
| `W5` 形态 | 少而散 → 逐条 `W5`；多而密 → 聚合成一条 `W8`，逐条明细移到 `RELATION GAP DETAIL` 段 |

**`W8` 触发公式（既定，不按个案调参）：**

```text
relationGapCount / (relationGapCount + edges.length) ≥ 0.5   且   relationGapCount ≥ 3
```

> 诚实记录：按此公式，D **修复前**的 0.40 **不会**触发 `W8`（所以当时仍是 6 条 `W5`），
> **修复后**降到 0.15 也不会触发。公式没有为了"让 D 好看"而调参 —— 它解决的问题
> （顶部刷 N 遍）本来就被 R4 的重表达从源头消掉了。

**新增 severity：**

```text
H8  qualifiers 形态错（缺 from/to 端 / 不是对象 / 未知结构属性）  → HARD
W7  qualifier 取值未知（controlled-but-extensible）              → WARNING
```

---

## 4. 复测汇总（五篇 Fixture）

| Fixture | granularity | HARD | WARN | INFO | coverage | 状态 |
|---|---|---|---|---|---|---|
| A（F04，带 `--plan`） | sourceUnit | 0 | 0 | 2 | 87/87 | PASS |
| B | section (provisional) | 0 | 1 | 3 | 13/13 | PASS |
| C | section (provisional) | 0 | 2 | 3 | 19/19 | PASS |
| **D** | section (provisional) | **0** | **2** | **3** | **21/21** | **PASS** |
| E | section (provisional) | 0 | 3 | 7 | 11/11 | PASS |

```text
单测        29/29（新增 heading tree ×2 · qualifiers ×4 · relationGap 聚合 ×2）
Mutation    14/14 = 100%
```

> 粒度纪律不变：A 是 `sourceUnit`，B / C / D / E 是 `section (provisional)`，**两组数字不得相加或合成一个覆盖率**。

---

## 5. 记录：`constraint` 参数位仍然缺失（R7）

`constraint.parameters` 不存在 → 无环 / 区间包含 / 条件唯一只能说成一句话，不能结构化。已登记为 **Structured Constraint Gap**（`framework-map-contract.md` §5.4），**不阻塞 Gate**，也不在本轮补 DSL。

---

## 6. 一句话

> **修复的不是"规则太松"，而是三处"看的地方不对"：parser 看错标题层、关系只看动词不看结构属性、告警把单点形态当缺陷。**

---

## 7. 关闭裁决（用户确认，Feature 09 = Closed）

用户复核修复轮后给出裁决：**F09 可以正式结束；Feature 07 解除 Blocked。**

### 7.1 三条边界判断被确认

| # | 判断 | 裁决 | 理由（用户原话要点） |
|---|---|---|---|
| 1 | `relationGap` 保留 2，不追求归零 | ✅ 正确 | 剩余 2 条本质不是"缺少一个关系动词"，而是**关系上的不变量**（一组 `depends-on` 边整体必须无环 / 某字段值落在关联对象定义的区间内）。追求 `relationGap = 0` 必然走向 `acyclic-depends-on` / `date-within` / `at-most-one-per-key` 这种**关系词爆炸** |
| 2 | "每 Goal/date 至多一条 DailyReview"不进 `relationGap` | ✅ 正确 | 它约束的是**实体集合在复合键上的 cardinality invariant**，不是两元素间缺了一种关系；造 `DailyReview ──???──> DailyReview` 自环反而误导 L0 图。正式归 **Structured Constraint Gap**；`constraint.qualifiers` / `uniqueBy` / `scope` / `predicate` / `threshold` **现在不要提前做** |
| 3 | `W8` 不为 D 触发（0.40 / 0.15 都不触发） | ✅ 正确 | `W8` 的目标不是"发现几个 relationGap"（`W5` 已负责），而是表达"**这张图整体上有相当大比例的关系无法被当前 relation model 表达**"。D 修完 qualifiers 后明显不属于"整体关系模型失效" → **不要为了 D 触发它去调阈值** |

### 7.2 由此冻结的 Contract 原则（写 AI prompt 时逐字带上）

> **Edge 描述基础关系，qualifier 描述关系结构属性，constraint 描述不能自然还原为一条边属性的业务不变量。**
> **不要为了消灭 gap，把约束塞进 relation vocabulary。**

已写入 `docs/framework-map-contract.md` **§0**。理由：否则 AI 很容易"为了通过 validator"把 `Task dependency must be acyclic` 发明成某种 edge type。

**对 F07 的直接后果（要盯的失败模式）：** schema 的 `type` 是封闭 enum，表外词 = HARD，所以 AI 发明不出新词；它只能**误用**已有动词（把"引用"写成 `contains`、把一切塞进 `relates-to`）。这是 F07 的观察点，**不是** Contract 需要继续加词的理由。

### 7.3 另外两条被确认的纪律

| 议题 | 裁决 |
|---|---|
| **Parser 的容忍度 ≠ 正确性** | ✅ 值得长期保留。"看到 `#` 就当标题"表面更通用，却把 fenced code 里的 `# expected output` 认成文档结构。正确方向是 Markdown syntax-aware + fence-aware + hierarchy-aware；**不要用文本 regex 假装自己在解析 Markdown**。对 table / code block / JSON example / Mermaid / quoted Markdown 同样适用 → 已写入契约 §10.1 |
| **B / C 没有重表达** | ✅ 处理正确。**不能因为 Contract 已具备 `contains + ownership`，就回头在结果里说"所以 B/C 的旧 relationGap 已解决"。** 正确说法是"机制上可能已能表达，但原 candidate map 尚未按新 Contract 重表达，因此不能算实测关闭"。→ 列为单独一轮 `F06 contract migration regression`，不阻塞任何 feature |

### 7.4 `contains ≠ references`

`contains` 放宽到 structural containment / composition 后，**唯一要守住的是 `contains ≠ references`**：

```text
Goal → UserProfile（只是引用）
    → relates-to + ownership: shared / reference      ✅
    → contains                                        ❌
```

如果将来 `relates-to` 的使用量越来越大，才值得重新审视"是否缺少一个非常基础的 references relation"。**现在不要因为 Fixture C 那个 follow-up 顺手加。**

### 7.5 状态变更

```text
Feature 09  = Completed / Closed（Gate = PASS）
Feature 07  = Ready（已解除 Blocked）
Contract    = v1 定稿，可进入 AI 生成阶段
```

**下一阶段的重点已改变：**

```text
过去（F03~F09）：我们设计的表示模型对不对？
接下来（F07）：  AI 能不能稳定地从任意技术文档生成这个表示模型？
```

> **继续打磨 Contract 的边际收益已经开始下降** —— 下一批真正有价值的信息来自 **AI generation 的稳定性测试**，而不是再多找一篇人工 candidate map。

### 7.6 本轮不动的两个 feature

```text
Feature 07  状态改为 Ready，但**本轮不开始实现**（任务书尚待下发）
Feature 08  保持 Blocked（未被本轮裁决涉及）
```
