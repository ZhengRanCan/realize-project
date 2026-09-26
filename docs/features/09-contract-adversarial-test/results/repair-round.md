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
| R9 | Feature 07 保持 Blocked | ✅ 未动 | — |

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
