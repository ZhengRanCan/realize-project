# framework-map 契约（判断层）

> 配套：`schema/framework-map.schema.json`（结构层）· `scripts/check-map.js`（可执行的校验）
>
> **本文件记录的是 schema 表达不了的那部分判断。** 它不是 schema 的复述。
> 例如下面这两条，JSON Schema 根本检查不了：
>
> ```text
> "如果多个值可以在同一时刻同时成立，它们通常不是同一个 state machine 的互斥 state"
> "文档没有声明依赖，就不要为了图漂亮强行串链"
> ```

## 0. ❄️ 已冻结的核心原则（写 AI prompt 时逐字带上）

> **Edge 描述基础关系，qualifier 描述关系结构属性，constraint 描述不能自然还原为一条边属性的业务不变量。**
> **不要为了消灭 gap，把约束塞进 relation vocabulary。**

**为什么必须冻结（F09 关闭时的裁决）：** 只要"消灭 gap"成为目标，词表一定会长成这样 ——

```text
acyclic-depends-on / date-within / at-most-one-per-key / ...
```

也就是把**业务不变量**伪装成**关系类型**。这类词无法泛化到下一篇文档，且会让 `check-map` 的封闭词表失效。

**由此推出的三条操作性规则：**

```text
1. 不追求 relationGap = 0。
   relationGap 只用于「基础关系本身无法忠实表达」的情况；
   复杂 invariant **不要求**被 edge 吞掉。
2. 复杂 invariant 的分层：
   成对锚定的（无环、区间包含）→ 可留在 relationGap；
   单实体槽位唯一性（uniqueBy 复合键）→ 只登记为 Structured Constraint Gap（§5.4）。
3. 无环性、区间包含、条件唯一不是 relation vocabulary gap，
   它们是 relation / entity 上的不变量。
```

**⚠️ 对 AI 生成链路（Feature 07）的直接后果：** AI 为了通过 validator 而发明 edge type 的第一反应必须被堵死 —— schema 的 `type` 是封闭 enum（表外词 = HARD），所以它只能**误用**已有动词（例如把"引用"写成 `contains`、把一切塞进 `relates-to`）。这是 F07 要盯的主要失败模式，**不是** Contract 需要继续加词。

规格来源：`docs/features/03-hierarchical-architecture/README.md`（架构文档）
验证来源：`docs/features/04-l0-framework-map/`（Fixture A）· `docs/features/05-l0-generalization-gate/`（A / B / C）· `docs/features/09-contract-adversarial-test/`（D / E，Gate = PASS）

---

## 1. 三种 coverage 必须分开

```text
A. Framework Coverage     L0 图有没有表达出主要机制？        不要求所有语义都进图
B. Navigation Coverage    所有值得保留的内容是否都有入口？    最容易失败的一种
C. Semantic Coverage      进入 L2 后，原文语义有没有被表达？  既有 Stage 1/2 负责

Framework Coverage  ≠  Navigation Coverage  ≠  Semantic Coverage
```

| 谁检查 | 覆盖哪一类 |
|---|---|
| `check-map`（Framework Map invariant F1~F3） | A |
| `check-map`（Navigation invariant N1~N3） | B |
| `check-overview`（既有） | C |

**永远不要把它们合成一个 "coverage = 100%"。**

还有一条粒度纪律：

```text
Fixture A  的粒度 = sourceUnit      （87 条已建立）
Fixture B/C 的粒度 = 原文小节（provisional）
```

两种粒度**不得**合成一个百分比。在 section 粒度上，**N2 与 N3 会合并成同一件事**（"每节有入口"＝"每节可达"），只有 sourceUnit 粒度才能把两者分开。

---

## 2. `concept` vs `state` 怎么区分

> **判别规则：如果多个值能够在同一时刻同时成立，它们通常不是同一个 state machine 的互斥 state。**

| 案例 | 结论 | 理由 |
|---|---|---|
| `Context Receipt` / `Context Availability` / `Context Consumption` | **`concept`**，`role: "semantic-level"` | 三者**可以同时为真**；文档里的"5 种状态组合"正是三个 boolean 语义条件的组合，而不是一个对象在互斥状态间迁移 |
| `Frozen` / `Pending` / `Failed` / `Available` | **`state`** | 同一个对象在同一时刻只能处于其中一个 |
| `Inbox 处理状态机`（pending → processing → …） | `state`（**拉伸**，见 §4） | 它是一台状态机的**压缩表示**，不是单个状态；被容量逼出来的建模取舍 |

**这是已登记的 ontology regression case。** 每遇到一次新案例，就追加到上表。

---

## 3. 什么时候该用 `attachment` 而不是 `edge`

```text
edges[]        只放主轴机制关系 → process / artifact 之间，用受控 8 词
attachments[]  放 concept / constraint / state / 反例，以及"不在数据流上的 artifact"
```

判断顺序：

1. 两个元素都是 `process` / `artifact`，**且它们之间的关系是数据或控制的流动** → `edge`
2. 否则 → `attachment`

**注意：不是所有 `artifact` 都该上主轴。** Fixture C 的 `FusionLessonBinding` 是 `artifact/authority`，但它不在数据流上，所以走 attachment。

另外：`attachment` **也是关系**。判据 B（"至少参与一条重要关系"）由 **edge 或 attachment** 满足 —— 否则 concept / constraint 这一整类永远无法满足判据 B。

---

## 4. Capacity gap（第 5 类 gap）

> 类型与关系都对，但 **L0 的位置不够**。

实测（Feature 05）：**三篇 Fixture 全部顶到 12/12**。而且**流水线越长，留给 constraint 的位置越少**：

```text
B 的 §12 有 7 条实施不变量  → 图上只放得进 2 条 constraint
C 的 §3 + §14 有 9 条原则与规则 → 同样只放得进 2 条
```

**它不是 Layout gap**（不是画法问题），**也不是 Semantic gap**（类型够用）。处理方式只有两种：

1. 把内容降到 L1/L2，**并确保有 Topic 入口**（首选）
2. 调整容量规则（待 Phase 2b 实测后再讨论）

**因此：element 预算是 heuristic，不是 semantic validity。**

```text
preferred element budget = 12
  <= 12   正常
  >  12   WARNING      ← 不是 schema invalid，也不是 Hard Error
```

**不要**写成 `maxItems: 12`；**也暂时不要**定义 13~15 / >15 的分级惩罚 —— 没有证据。

---

## 5. 关系分三层：基本语义 + 结构属性 + 外挂约束

> **原则（Feature 09 建立）：element 有 ontology，relation 同样不能只有一个动词。**
>
> ```text
> 第 1 层  基本语义    type        ← 8 词受控词表，"这是什么关系"
> 第 2 层  结构属性    qualifiers  ← cardinality / ownership，"这条关系的结构长什么样"
> 第 3 层  外挂约束    constraint  ← 无环、区间包含、条件唯一，"这些关系必须满足什么不变量"
> ```

**为什么不是继续补动词：** Feature 05 发现 3 处、Feature 09 在 Fixture D 上发现 6 处"词表不够"。逐条补词会得到第 9 / 10 / 11 个动词，而其中大部分缺口**根本不是缺动词**，是缺**结构属性**：

| D 上的缺口 | 真实缺什么 | 补法 |
|---|---|---|
| PlanBundle = Plan + Stage[] + Task[] | 组成关系 + 归属 | 现有 `contains` + `ownership: owned` |
| Every initial Task belongs to one Stage | 「恰好一个」 | `cardinality: {from: one, to: one-or-many}` |
| DailyReview may reference or summarize TaskResults | 引用而非拥有 | `contains` + `ownership: reference` |
| UserProfile 被规划引用，不属于任何单个 Goal | 共享、无单一 owner | `relates-to` + `ownership: shared` |
| One Goal may have multiple Plan versions | 1:N | `cardinality: {from: one-or-many, to: one}` |
| Task 依赖无环 + 只有 done 才算满足 | **关系自身的不变量** | 留在 `relationGap`（第 3 层）|

### 5.1 `qualifiers` 词表（刻意小）

```json
{ "from": "E-03", "to": "E-04", "type": "contains",
  "qualifiers": { "cardinality": { "from": "one", "to": "one" }, "ownership": "owned" } }
```

| 属性 | 取值 | 语义 |
|---|---|---|
| `cardinality.from` | `one` / `zero-or-one` / `one-or-many` / `zero-or-many` / `many` | **对每一个 to 端实例，from 端有几个** |
| `cardinality.to` | 同上 | **对每一个 from 端实例，to 端有几个** |
| `ownership` | `owned` / `reference` / `shared` | `owned` = 生命周期 / 归属由 from 端管理；`reference` = 只引用不拥有；`shared` = 关系存在但不是单一 ownership |

**方向必须写清楚才不会读反**：`{"from": "one", "to": "many"}` = "一个 from 对应多个 to"（`PlanBundle contains Plans`）。

**severity 策略：**

```text
qualifiers 形态错（缺 from/to 端、不是对象、出现未知结构属性）→ HARD（H8）
qualifiers 取值不在词表内（如 ownership: "borrowed"）        → WARNING（W7）
```

形态是结构，所以 HARD；取值是 controlled-but-extensible，所以 Warning —— 与 `role` 的策略一致。

### 5.2 `contains` 的定义：结构性包含 / 组成

```text
旧（过窄）：contains = component 嵌套 process
新（本契约）：contains = A 的结构中包含 B（结构性包含 / 组成）
              ownership 由 qualifier 表达，不由动词表达
```

这条放宽是**必要的**：旧定义把领域聚合（`PlanBundle` 持有 `Plan` / `Stage[]`）判成"拉伸"，于是 Fixture D 的第一条缺口其实是**定义太窄**造出来的。放宽后，`contains + owned` 与 `contains + reference` 能区分"拥有"与"只是引用"。

**边界（不得放宽的地方）：** `Goal references UserProfile` 这类"引用但无归属"**仍然不能**用 `contains` 表达 —— 它没有结构性包含关系，正确写法是 `relates-to` + `ownership: shared`。

---

## 5.3 Relation gap 怎么表达

现在回到第 3 层：有些东西 `type + qualifiers` **确实**表达不了。

因此契约提供一个**显式位置**：

```json
{
  "relationGap": {
    "from": "E-10",
    "to": "E-09",
    "intendedMeaning": "两端实现必须与同一份 fixture 产生逐字节相同的结果",
    "reason": "existing vocabulary cannot express this without distortion"
  }
}
```

| 情况 | 校验结果 |
|---|---|
| 正式 `edges[]` 使用表外词 | **HARD ERROR** |
| `relationGap` 有记录（少而散） | **WARNING / REVIEW REQUIRED**（逐条 `W5`）|
| `relationGap` 多而密 | **聚合为一条 `W8`**，逐条明细挪到 detail 段 |

**`W8` 的触发条件（既定公式，不按个案调参）：**

```text
relationGapCount / (relationGapCount + edges.length) ≥ 0.5   且   relationGapCount ≥ 3
```

单个 `relationGap` 是**正常的登记行为**，不该在报告顶部刷 N 遍；只有缺口密度高到说明"关系层整体不够用"时才升成一条聚合告警。Fixture D 重表达前是 6/15 = 0.40（未触发，逐条列 6 条），重表达后降到 2/13 = 0.15。

**关键：`relationGap` 不进入 `edges[]`，不产生新的关系词。**

这比允许 `type: "custom"` 健康得多 —— 后者等于悄悄把词表废掉。它既保持 vocabulary 封闭，又**不逼 AI 用错误的词硬套**。

**`relationGap` 的适用范围（冻结）：** 它只用于**基础关系本身无法忠实表达**的情况。**不追求 `relationGap = 0`** —— 复杂 invariant 不要求被 edge 吞掉（§0）。

**`W8` 的定位（冻结）：** 它表达的不是"发现了几条 gap"（那是 `W5` 的职责），而是「**这张图整体上有相当大比例的关系无法被当前 relation model 表达，Contract 的表达能力可能存在系统性问题**」。

```text
不触发 W8  ≠  "没有缺口"
不触发 W8  =  "缺口是个别现象，不是关系模型整体失效"
```

**所以不要为了让某个 Fixture 触发 `W8` 去调阈值。** Fixture D 修复前 0.40、修复后 0.15 —— 两次都不触发，两次都是**正确**结果：它本来就有相当多关系能被正常表达，不属于"整体失效"。

**已登记的关系缺口：**

| 关系 | 出现处 | 为什么 `type + qualifiers` 表达不了 |
|---|---|---|
| 跨语言一致性 | Fixture B | `depends-on` 只表示依赖，表达不了"必须一致" |
| 持有 / 存储 | Fixture C | §5.2 放宽 `contains` 后**机制上已可表达**（`contains` + `ownership: owned`）；**但原 candidate map 尚未按新 Contract 重表达 → 不能算实测关闭**。列为 follow-up（§11），不静默当作已解决 |
| 通过 / 放行 | Fixture C | `validates` 只表达"谁校验谁"，缺"通过"语义 |
| Task 依赖图无环 + 满足条件 | Fixture D（重表达后保留） | 基本关系（`depends-on`，两端 zero-or-many）已能表达；缺的是**关系自身的图级不变量** |
| Stage 区间包含 `scheduledDate` | Fixture D（重表达后保留） | 归属已由 `contains + owned + one/one-or-many` 表达；缺的是**跨实体区间包含不变量** |

### 5.4 Structured Constraint Gap（已登记，不阻塞 Gate）

第 3 层（`constraint`）目前**只有元素位置，没有参数表达面** —— `schema` 里没有 `constraint.parameters`，所以"无环""区间包含""条件唯一"这类不变量只能说成一句话，不能结构化。

**分流规则（F09 关闭时冻结）：**

```text
成对锚定的不变量（涉及两个元素的相对定位）
    → 可以留在 relationGap
      例：Task 依赖无环（Task—Task）· scheduledDate 落在 Stage 区间（Stage—Task）

单实体槽位唯一性（约束的是实体集合在复合键上的 cardinality）
    → 只登记为 Structured Constraint Gap，**不进 relationGap**
      例：(goalId, date) 唯一 / 每 fingerprint 至多一条
```

**登记项（Fixture D 暴露，Feature 09 记录）：**

| 不变量种类 | D 上的实例 | 现状 |
|---|---|---|
| 图级无环 + 条件满足 | 同一 PlanBundle 内 Task 依赖无环；"被引用 Task 为 done"才算满足 | 留在 `relationGap`（成对锚定） |
| 跨实体区间包含 | `Task.scheduledDate ∈ Stage.[startDate, endDate]` | 留在 `relationGap`（成对锚定） |
| 条件唯一（单实体槽位） | 每 Goal/date 至多一条 `DailyReview`（L605）；每 Goal/Plan/date 至多一条选择（L643）；每 Goal/Plan/date 至多一条 dismissal（L708）；每 fingerprint 至多一条 summary（L742）；同一时刻至多一条 active Plan（L262） | **仅登记**：槽位唯一性不是"两个元素之间的关系"，塞进 `relationGap` 会把它变成杂物袋 |

**为什么条件唯一不进 `relationGap`（F09 关闭时的裁决）：** `relationGap` 的形状是"两个元素之间的一条关系"，而"每 Goal/date 至多一条 DailyReview"约束的是**单个实体的槽位键**。为它造一条 `DailyReview ──???──> DailyReview` 自环边只会**误导 L0 图**。

正确的分层是：

```text
Goal ↔ DailyReview        基础实体关系（一条普通边）
        +
Constraint: (goalId, date) unique / at-most-one     ← Structured Constraint Gap
```

**明确推迟（现在不要提前做）：** 即使这类情况将来大量出现，也只讨论 `constraint.qualifiers` / `uniqueBy` / `scope` / `predicate` / `threshold` 之类的**结构化表达**，而不是把 `at-most-one-per-key` 变成关系词。

**这是记录，不是放行：** 它说明"关系层已能表达基本语义 + 结构属性，复杂不变量仍属 Constraint 语义"，并在 `constraint.parameters` 出现之前保持可见。**不阻塞 Gate。**

---

## 6. 不要强行串链

> **如果文档没有明确声明"谁是谁的前置"，就不要为了图漂亮把这些元素串成一条链。**

**这条规则的来历（Feature 05 的真实经历）：**

设计 Fixture C 时，前两版方案都把两个分支压成了一条链：

```text
第一版：Fact → MasteryProjector → Memory Surface      （把 Memory 当成 Mastery 的下游）
第二版：Fact → Proposal → Validator → Memory Surface   （把 Mastery 整支丢掉）
```

两版都"看起来整齐合理"，而且都是错的。**纠正它的不是判断力，而是文档里恰好写了一句话**：

> Mastery 与长期 Memory/L2-L3 是从同一 `FusionLearningFact` 派生的**不同投影结果**；Mastery 更新**不作为** Profile Agent 或 Memory Consolidation 的隐式前置条件。

**如果那句话不存在，一张错误的单主轴图就会被当成正确产物交付。**

所以：

```text
一条链  ≠  唯一正确的形态
分叉 DAG / 不对称分支 / 没有主轴   都是合法形态
```

**"主轴 + 侧挂"只是一种布局策略**，不是 framework-map 的定义。

---

## 7. 三级冻结清单

> 总原则：**Freeze evidence-backed semantics; keep heuristics soft; represent unresolved gaps explicitly.**

### 7.1 ✅ HARD freeze（进 schema / validator 的硬规则）

```text
1. 六类 element vocabulary（concept / component / process / artifact / state / constraint）
2. type + role 两层（type 严格 enum；role 见 7.2）
3. edge / attachment 分离（主轴只放 process / artifact）
4. Topic 与 L0 element 解耦
5. Framework / Navigation / Semantic 三种 coverage 分离
6. 每个 element 必须有 provenance（sourceUnitIds 或 sectionRefs 至少其一）
7. Navigation 必须无 orphan（N1~N3）
8. 不能因为某类 element = 0 而报警
9. 不能把没有证据的关系强行串成链（见 §6）
10. qualifiers 的**形态**（必须 {from,to} 两端；未知结构属性直接 HARD，不许长第三层词表）
11. 原文小节按 **Markdown heading tree** 解析（见 §10）：围栏代码块里的 `#` 不是标题
```

### 7.2 🔶 SOFT freeze（有规则，只出 Warning）

```text
1. element budget = 12        ← 认知容量 heuristic；三篇全部顶格，很可能已偏紧
2. role 取值                   ← controlled-but-extensible；未知 role 只出 Warning
3. qualifiers 取值             ← 同上；未知 ownership 只出 Warning（W7）
4. relation vocabulary 完备性  ← 已登记 3 处已知 Relation gap（B / C），但不补词
5. topology / layout           ← 无主轴、DAG、泳道都属具体文档
```

**`role` / `qualifiers` 的策略：**

```text
已知取值    → PASS
未知取值    → WARNING      ← 不是 Hard Error
形态错      → HARD         ← 结构问题不是词汇问题
```

如果 role 也做成二十多个严格 enum，很快会产生新的 ontology 问题（Feature 05 已发现 2 处 role 拉伸）。

### 7.3 ❌ 现在不要做

```text
- 第 7 类 element
- 第 9 / 10 / 11 个 relation 词（先问"是不是缺结构属性"，见 §5）
- constraint 的参数 DSL（constraint.parameters）—— 先只登记 Structured Constraint Gap
- constraint.qualifiers / uniqueBy / scope / predicate / threshold —— 同上，推迟
- 把"条件唯一"这类单实体槽位约束塞进 relationGap
- 追求 relationGap = 0（复杂 invariant 不要求被 edge 吞掉，见 §0）
- 为了让某个 Fixture 触发 W8 而调阈值（见 §5.3 的 W8 定位）
- 因为 Fixture C 的 follow-up 就顺手加一个 references 关系词（先看 relates-to 的使用量）
- 固定主轴
- 固定泳道
- 强制六类都出现
- schema maxItems: 12
```

---

## 8. 三级 severity 与"不误报"原则

```text
HARD   真正的契约违反 → unknown type / missing provenance / dangling reference /
                       非法 relation 词 / 无导航路径 / 同 ID 重复 / 孤立元素 /
                       qualifiers 形态错（H8）
WARN   需要人看一眼   → element > 12 / role 未知 / Topic 太多 /
                       qualifier 取值未知 / relationGap 存在（少而散）/
                       关系缺口密度过高（W8，多而密时聚合成一条）
INFO   只是形态差异   → component = 0 / state = 0 / 没有主轴 / 非单链拓扑 /
                       Topic 没有 element / 单点 Topic（原 W4，已降级）
```

**校验器的首要任务是"不误报"。** 三篇 Fixture 都是已经通过人工验证的产物；如果它们被自己的校验器判 Hard Error，**先怀疑校验器写得太死**。

三个已经踩到的例子：

1. **不要用 in-degree 判 DAG**：不按 `consumes` 归一化的话，任何"被生产又被消费"的 artifact 都会被误判成收敛节点（A / B / C 全中）。已修。
2. **原文小节无法解析时不要判悬空引用**：Fixture A 用「## 一、」而非「## 1.」，如果直接拿空的小节全集去比对，每个引用都会变成 HARD。正确做法是**跳过并出 Warning**（`W0`）。已修。
3. **单点 Topic 是形态差异，不是缺陷**（原 `W4`）：一个 Topic 只承载一节"问题动机"是合法的窄 Topic。作为告警在 Fixture B 上命中过一次，价值低、噪音高 → 降级为 `I6`。

---

## 9. Phase 2b 的问题：已答

```text
1. D / E 上的 Hard Error 是真契约违反，还是 validator 太死？
   → 都不是。D 的 2 个 HARD 来自**校验器的 bug**（section parser 只认 "## N."，
     把 D 的 "## Goal" 全部解析失败，于是 N2/N3 被跳过、M8 漏网）；
     E 的 0 个 HARD 保持。修正 parser 后 D / E 都是 HARD 0 · PASS。见 §10。

2. Warning 有没有大量误报？
   → 有一处真误报：W4「Topic 只挂一个 block/section」。已降级为 I6。
     另一处是**噪音**而非误报：6 条 W5 平铺在报告顶部 → 改为少而散逐条、多而密集合成 W8。

3. 有没有新的 Semantic gap / Relation gap？
   → Semantic gap = 0（D / E 都不需要第 7 类 element）。
     Relation gap：D 报 6 处，其中 5 处的真实成因是**缺结构属性**而不是缺动词
     （见 §5）；补上 cardinality / ownership 后 D 的 relationGap 6 → 2，
     剩余 2 处是真的第 3 层（Constraint 语义）。

4. 12 在 D / E 上是否明显不够？
   → E 用了 13 个（超 1），D 重表达后仍是 12。"顶格"成立，"明显不够"不成立。
     预算保持 12 不变；E 的 13 作为 Capacity 压力的持续样本保留。
```

---

## 10. 原文小节解析：Markdown heading tree

**长期语义：** 原文的导航单位是 **Markdown 标题层级**，不是数字章节编号。

```text
「## 4. 总览」 和 「## Goal」 都是合法的小节标题；
「4」 只是标题文本的一部分，不是语法。
```

`sections` 的解析规则（`readDocHeadings`）：

```text
1. 任意 #~###### 标题都进树（ATX 形式：# 后必须有空格）
2. 围栏代码块（``` / ~~~）内的 # 是注释，不是标题 —— runbook 里 "# 期望: 无输出"
   曾被当成 level-1 标题，把 sectionLevel 压到 1，直接导致 N2/N3 误判
3. 稳定 key：标题以编号开头（4 / 4.1）取编号 token，否则取标题文本
   → 「§4」「§4.1」「§Goal」「§FocusSession, TaskResult and DailyReview」都可解析
4. sectionLevel = 最浅的、且**至少 2 个**标题的那一层
   （跳过孤零零的文档大标题）；N2 / N3 就在这一层做导航校验
```

**这个 bug 的教训（Feature 09 最贵的发现）：**

```text
校验器"通过"不等于被校验。parser 解析不出小节时跳过了 N2/N3，
状态却仍显示 PASS（应为 PASS WITH INCOMPLETE VALIDATION），
于是 D 的 M8（删除顶层小节入口）**漏网** —— 一个假阴性被自己的报告盖住了。
```

所以：**跳过检查必须显式可见**，而且 parser 的正确性要和 validator 的严格性一起验证。

### 10.1 长期原则：Parser 的容忍度 ≠ Parser 的正确性

**"看到 `#` 就当标题"表面更通用，实际更错** —— 它把 fenced code 里的 `# expected output` 认成了文档结构。

```text
容忍度宽松（认得多）  ≠  正确（认得对）
```

正确的方向永远是三件套：

```text
Markdown syntax-aware        按 Markdown 语法解析，不是按行首字符
fence-aware                  围栏内的内容不是文档结构
hierarchy-aware              标题是树，不是一组平铺的字符串
```

> **操作规则：不要用文本 regex 假装自己在解析 Markdown。**

这条原则对以下场景同样适用（F07 生成链路会全部碰到）：

```text
table parsing          | 表格里的 | 与代码块里的 |
code block parsing     | 语言标注 / 缩进 / 嵌套围栏
JSON example parsing   | 文档里的示例 JSON 不是真实数据
Mermaid                | ```mermaid 里的 graph/sequence 是图，不是标题或列表
quoted Markdown        | 引用块里出现的 ## 是否算小节
```

**判据（写完 parser 必问的一句）：** 这个 parser 是"认得多"，还是"认得对"？它有没有**知道自己跳过了什么**？

---

## 11. 下一步（本轮不做，且**不阻塞 Feature 07**）

```text
1. F06 contract migration regression（可选，单独一轮）
   A / B / C 的 candidate map → 按最新 Contract 重表达
   验收方式：重表达后 relationGap 的变化必须是**实测**，不能因为"机制上已能表达"就宣布关闭
   （典型例子：Fixture C 的"持有 / 存储"—— 机制上 contains + owned 已可表达，
     但原 map 未重表达，因此现在只能记为 follow-up）

2. constraint.parameters 表达面（第 3 层的结构化）—— 先保持登记（§5.4）

3. 语义验收标准的重写（现用 1:1 语义 proxy 度量，需要真正的语义覆盖判据）

4. AI 生成链路（Feature 07）—— 已是下一阶段主线，见 docs/features/07-generation-pipeline/
```

---

## 12. Feature 09 关闭裁决（Contract v1 定稿）

**Feature 09 = 完成；Gate = PASS。** 支撑证据：

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

**下一步重心已经改变：**

```text
过去（F03~F09）：我们设计的表示模型对不对？
接下来（F07）：  AI 能不能稳定地从任意技术文档生成这个表示模型？
```

```text
Document
   ↓  AI Framework Map Generation
framework-map.json
   ↓  schema
   ↓  check-map
renderer
```

**并且：继续打磨 Contract 的边际收益已经开始下降** —— 下一批真正有价值的信息来自 **AI generation 的稳定性测试**，而不是再多找一篇人工 candidate map。
