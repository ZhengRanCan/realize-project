# Fixture D 资格审查（冻结标准下的逐条件证据矩阵）

> Feature 09 · Task 1（只做资格审查：**不建模、不改 Contract、不改 ontology/relation**）
> 冻结标准见 `../README.md` §3.1。标准在挑文档**之前**已提交（见 git 历史）。

---

## 0. 结论

```text
D = NO QUALIFIED FIXTURE under the frozen Phase 2b selection criteria
```

措辞刻意精确：这**不等于**"现有材料不存在 N:M 设计"。

本次扫描 1262 篇 markdown、所有常见 N:M **文本记号**命中为 0，是很强的筛选证据；但它仍不能严格证明不存在用 **ER 图、双向引用、membership model** 等其它方式表达、却没有这些字面记号的 N:M。对本次资格审查而言已经足够，**不再扩大搜索**。

**在冻结标准下，没有候选同时满足全部 7 条强制条件。** 最接近的一份（`uni-app/tempo` 的 goal-plan-task-state-model.md）**6/7 PASS，仅 N:M 一条 FAIL** —— 它已被按其独立身份保留，见 §4。

并且有一项**决定性证据**：

> 在 `E:\project\github`、`school`、`virtual-human`、`uni-app` 共 **1262 篇** markdown 中，
> 包含 `many-to-many` / `N:M` / `M:N` / `多对多` / `M2M` / `junction table` / `关联表` / `中间表`
> **任一记号**的文档数量为 **0**。

也就是说：**"实体间 N:M 至少出现一次"这条冻结条件，在现有材料里没有任何文档能满足。**

---

## 1. 汇总矩阵

| Candidate | 类型 | 多实体 | 1:1 | 1:N | **N:M** | 字段 | ownership | lifecycle | evolution | 跨实体 invariant | 结论 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `uni-app/tempo/docs/architecture/goal-plan-task-state-model.md` | D | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | **REJECT**（6/7，仅缺 N:M） |
| `deepseek-harness-master/docs/subsystems/session.md` | D? | ❌ | ? | ❌ | ❌ | ✅ | ? | ? | ❌ | ? | **REJECT** |
| `deepseek-harness-master/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.zh.md` | D? | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ? | ❌ | **REJECT** |
| `deepseek-harness-master/docs/persistence-catalog.md` | D? | ❌ | ❌ | ❌ | ❌ | ? | ❌ | ❌ | ❌ | ❌ | **REJECT** |
| `classroom/OpenMAIC/packages/@openmaic/dsl/README.md` | D? | ? | ❌ | ❌ | ❌ | ? | ? | ❌ | ✅ | ❌ | **REJECT** |
| `dify-main/api/enterprise/telemetry/DATA_DICTIONARY.md` | D? | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | **REJECT** |

`✅ PASS` · `❌ FAIL` · `? UNCLEAR`（按冻结标准：**全部强制条件 PASS 才入选**）

---

## 2. 逐候选证据

### D-1 · `uni-app/tempo/docs/architecture/goal-plan-task-state-model.md`（29.2KB · 847 行）

**唯一近失候选。** 它是一份真正的**领域模型契约**（不是流程图、不是目录）。

| 条件 | 判定 | 原文证据 |
|---|---|---|
| 多个核心实体 | ✅ | L37–61「Model layers」：`Goal` / `UserProfile` / `PlanBundle`（├ `Plan` ├ `Stage[]` └ `Task[]`）/ `DailyReview[]` / `TodayTaskSelection[]` / `DailyReviewPromptDismissal[]` / `PlanChangeSummary[]`；且每个实体有独立章节（L168 Goal、L269 UserProfile、L296 PlanBundle、L315 Plan、L407 Stage、L470 Task、L584 FocusSession/TaskResult） |
| 1:1 | ✅ | L643「One Goal/Plan/date has **at most one** selection」· L708「One Goal/Plan/executionDate has **at most one** dismissal」· L605「**only one** DailyReview per Goal/date」· L262「**at most one** active plan at a time」 |
| 1:N | ✅ | L262「One `Goal` may have **multiple** historical `Plan` versions」· L605「may have **many** Task results but only one DailyReview」· L43–44 `PlanBundle ├── Stage[] └── Task[]` |
| **N:M** | ❌ | **全文无任何 N:M / many-to-many / 多对多 / 关联表 记号**。唯一沾边的是 `retainedTaskIds`（L731、L745）暗示任务可跨 Plan 版本保留，但**未声明基数** |
| 字段/属性较多 | ✅ | L244「Field intent:」· L284 类型声明（`ritualPreference: RitualPreference` 等）· L548–553 字段级约束 |
| ownership / reference | ✅ | L255–258「…belongs to `UserProfile`」「belongs to `DailyReview`」「belongs to `Plan`」· L588「belongs to **exactly one** Goal/Plan/Task」 |
| lifecycle | ✅ | L177 `GoalStatus = 'draft' \| 'active' \| 'completed' \| 'archived' \| 'cancelled'` · L588 FocusSession 状态机 `running -> paused -> running -> completed`，`cancelled` 为终态 |
| schema evolution / migration | ✅ | L803「## Migration direction」（6 步）· L751「DailyPlan legacy boundary」· L683 兼容字段与后续 breaking migration · L816–841 Historical notes（F16 / F39 / F41 / F56 / F58） |
| 跨实体 invariant | ✅ | **L553「The total task minutes for one day must not exceed the plan's `dailyAvailableMinutes`」（跨实体聚合不变量）** · L395「Every initial Task belongs to one Stage and its scheduled date stays inside that Stage range」· L742 idempotency（同一 fingerprint 至多一个 summary） |
| 单文档 | ✅ | 一篇文档自身满足，无需拼装 |
| 最好没有单一处理主轴 | ⚠️ | 有 L63「Initial planning flow」与 L95「Replanning flow」两节；但文档主体是 **Model layers + 逐实体契约**，主轴是实体模型而非处理流水线 → 可接受（且此条是"最好"，非强制） |

**结论：REJECT** —— 仅因 N:M 一条不满足。**这是"标准 vs 材料现实"的正面对撞点。**

### D-2 · `deepseek-harness-master/docs/subsystems/session.md`（69.1KB · 1244 行）

子系统规格：`SessionEventMap` 事件词汇 / `SessionEvent<T>` / Surface types / `Session` 公共 API / fork API / 持久性约定。

| 条件 | 判定 | 证据 / 缺口 |
|---|---|---|
| 多实体 | ❌ | 无实体声明章节；结构是事件 + 类型 + API |
| 1:N / N:M | ❌ | 关系记号命中全是英文普通用法（L158「belongs to」、L201/203、L557），非实体基数 |
| lifecycle | ? | lifecycle 指 **session 自身**的恢复/重放边界（L143/150/159），不是实体状态机；`TurnEndReasonMap`（L667）是轮次结束原因，不是实体生命周期 |
| schema evolution | ❌ | 仅 3 处 `@deprecated`（L527/537/549），**无迁移章节** |
| 跨实体 invariant | ❌ | L152/L710 的不变量是**日志条目之间**的（turn/step 编号、execution-event enclosure），不是实体间 |

**结论：REJECT** —— 类型/事件/API 规格，不是实体关系模型。

### D-3 · `2026-07-24-domain-kv-storage-and-workspace.zh.md`（26.9KB · 330 行）

「领域 KV 存储能力 seam 与 workspace 实体」：存储枢纽 / `dsh-storage-json` / `dsh-storage-sqlite` / `dsh-domain` / `dsh-workspace`。

| 条件 | 判定 | 证据 / 缺口 |
|---|---|---|
| 多实体 | ❌ | 单一 `workspace` 实体 + 存储能力 seam |
| 1:N / N:M | ❌ | 仅 L85 `REFERENCES units(name)`（SQLite 外键）与 L11「归属关系由 workspace 持有」 |
| 字段/属性 | ❌ | 仅 2 处，且是"不做嵌套表"这类设计取舍（L158、L310） |
| lifecycle | ❌ | 仅 L320 `create → attach → list → delete` 的 registry 生命周期 |
| schema evolution | ? | 有版本策略（L47/L161「版本 fail loud，**不迁移不重建**」）与「session 后端迁移展望」（L257）——但它明确**拒绝**迁移 |
| 跨实体 invariant | ❌ | L296 把「跨表原子事务」列为**不做清单**项 —— 恰是否定跨实体约束 |

**结论：REJECT** —— 主题是存储能力 seam，不是实体关系模型。

### D-4 · `deepseek-harness-master/docs/persistence-catalog.md`（227.7KB · 6671 行）

**你特别点名不要因为大而直接选它。检查结论：确实不合格，且原因正是你预判的那一条。**

标题即 `Session Persistence **Event Catalog**`，结构为：

```text
Persistence type fingerprints
Event envelope
Events
  ### agent/* · agent-preset/* · approval/* · assistant/* · command/* · compaction/* …
```

| 条件 | 判定 | 证据 / 缺口 |
|---|---|---|
| 多实体 | ❌ | 它是**按命名空间罗列事件 payload 的目录**（"catalog"）；「entities 95」的命中来自事件名里的普通词，不是实体声明 |
| 1:N / N:M | ❌ | relations 命中均为事件/字段引用 |
| 字段/属性 | ? | payload 字段很多，但文档通篇用 `- \`name\`: type` 列表，没有"字段/属性"的表述 → 正则只命中 1。**这正是"grep 命中数不能代替资格判断"的实例** |
| lifecycle | ❌ | 5 处，均非实体生命周期 |
| schema evolution | ❌ | **0 处**（无迁移 / 版本化路径） |
| 跨实体 invariant | ❌ | **1 处** |

**结论：REJECT** —— 正符合你的警告：**把很多不相关 schema 按命名空间拼起来的 catalog**，不是语义连贯的设计文档；`evolution` 与 `invariant` 两项直接 FAIL。

### D-5 · `classroom/OpenMAIC/packages/@openmaic/dsl/README.md`（18.9KB · 316 行）

包说明：Dependency arrows (acyclic) / What's in here / Runtime layer (schema + validators + normalizers) / **Version & migration** / Runtime envelope / Status / Roadmap。

| 条件 | 判定 | 证据 / 缺口 |
|---|---|---|
| 多实体 | ? | 是 DSL 包的组成说明，不是领域实体 |
| 1:N / N:M | ❌ | 无 |
| lifecycle | ❌ | 无 |
| schema evolution | ✅ | L117「## Version & migration」 |
| 跨实体 invariant | ❌ | 1 处 |

**结论：REJECT** —— 包 README（schema/validator 运行时层），不是领域模型。

### D-6 · `dify-main/api/enterprise/telemetry/DATA_DICTIONARY.md`（23.3KB · 526 行）

遥测数据字典：Resource Attributes / Traces (Spans) / Counters。

| 条件 | 判定 | 证据 |
|---|---|---|
| 多实体 | ❌ | 遥测属性字典（span / counter 定义） |
| lifecycle / evolution / invariant | ❌❌❌ | 三项均 **0 命中** |
| 字段/属性 | ✅ | 31（但字段多 ≠ 实体关系） |

**结论：REJECT** —— 字段字典，无实体关系。

---

## 3. 裁决结果：坚持冻结标准（读法 A）

**裁决：不改 §3.1、不让 tempo 顶替 D。** `D = NO QUALIFIED FIXTURE` 保持。

理由不是"N:M 天生就必须是 ER-heavy 的定义条件"，而是：**Phase 2b 的实验设计已经提前把 N:M 写成了 Gate。**

现在因为最接近的候选刚好缺这一项再改标准，会**污染这次测试的可信度**。

**读法 A（采纳）：这是材料缺口**

现有磁盘材料里确实缺乏"多实体 + 三种基数 + 生命周期 + 演进 + 跨实体不变量"的设计文档。已有的多是**子系统规格**（session）、**事件目录**（persistence-catalog）、**存储 seam 提案**（domain-kv）、**路线图**（migration roadmap）、**包说明**（dsl）。

→ 那就需要**外部提供**一篇真正的 ER / Schema 设计文档，D 才能成立。

**读法 B：N:M 那条是我把标尺定得过严**

你原话是「实体间 1:1 / 1:N / N:M 关系」。我在 §3.1 把它冻结成了「**三种关系至少各出现一次**」。若你的本意是"包含这类基数关系"而非"三种都必须出现"，那么 D-1（tempo 那份）在其余 6 条上都是干净的 PASS。

⚠️ **但这里有一个诚实性问题必须指出：我现在已经看过候选文档了。**

如果此刻修改标准，就正好落进你一开始要避免的"**根据 fixture 改考题**"。

所以如果选读法 B，我建议的处理是：

```text
1. 把这次修改**显式记录为"标准修订"**，并写明原因（全盘 0 篇含 N:M 记号）
2. 修订后在**同一批候选上重新走一遍完整流程**（逐条重新判定，不沿用本次结论）
3. 或者干脆把 D 标为"材料不可得"，转而用 E 先做对抗测试
```

> **裁决：不采纳读法 B。**
> N:M 这条标准本身**留到本轮 Phase 2b 结束后**，作为下一版实验设计问题单独讨论：
> 「我们真正想攻击的是 N:M 本身，还是想攻击**无单一主轴的多实体关系网络**？」（见 `fixture-selection-e.md` §8）

---

## 4. Fixture D-near-miss / ER-lite candidate（tempo 那份的处理）

**不废掉，也不升级为 Fixture D。** 给它一个明确身份：

```text
Fixture D-near-miss / ER-lite candidate
文件：uni-app/tempo/docs/architecture/goal-plan-task-state-model.md（29.2KB · 847 行）
```

它已具备 6/7：多实体 · 明确 cardinality（1:1 / 1:N）· ownership/reference · lifecycle · schema evolution · 跨实体 invariant。

**用途**：将来可作为 **supplementary test**，用于验证"**无 N:M，但多平级实体 + 无单一 processing pipeline**"这一类文档 —— 这恰好是下一轮想攻击的要点（见 `fixture-selection-e.md` §8）。

**不能替代**这次被冻结的 D。否则就等于偷偷改了实验标准。

---

## 5. 按指令停止

```text
✅ 只做了资格审查
✅ 未生成 framework-map.json
✅ 未修改 F06 Contract
✅ 未修改 ontology / relation
✅ 未降低标准去凑候选
✅ Fixture E 的搜索**尚未开始**（按"优先解决 D"的指令）
```

**下一步等你裁决读法 A / B。** 若选 A，请提供一篇 ER / Schema 设计文档；若选 B，请明确授权修订 §3.1 的 N:M 条件（我会按上面三步处理）。
