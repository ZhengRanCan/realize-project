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

规格来源：`docs/features/03-hierarchical-architecture/README.md`（架构文档）
验证来源：`docs/features/04-l0-framework-map/`（Fixture A）· `docs/features/05-l0-generalization-gate/`（A / B / C）

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

## 5. Relation gap 怎么表达

现有 8 个关系词没有覆盖全部表达（Feature 05 发现 3 处），但**不足以**现在补词 —— Phase 2b 很可能再给出另外三个。

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
| `relationGap` 有记录 | **WARNING / REVIEW REQUIRED** |

**关键：`relationGap` 不进入 `edges[]`，不产生新的关系词。**

这比允许 `type: "custom"` 健康得多 —— 后者等于悄悄把词表废掉。它既保持 vocabulary 封闭，又**不逼 AI 用错误的词硬套**。

**已登记的 3 处：**

| 关系 | 出现处 | 为什么不能用现有词 |
|---|---|---|
| 跨语言一致性 | Fixture B | `depends-on` 只表示依赖，表达不了"必须一致" |
| 持有 / 存储 | Fixture C | `contains` 的既定语义是"component 嵌套 process" |
| 通过 / 放行 | Fixture C | `validates` 只表达"谁校验谁"，缺"通过"语义 |

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
```

### 7.2 🔶 SOFT freeze（有规则，只出 Warning）

```text
1. element budget = 12        ← 认知容量 heuristic；三篇全部顶格，很可能已偏紧
2. role 取值                   ← controlled-but-extensible；未知 role 只出 Warning
3. relation vocabulary 完备性  ← 有 3 处已知 Relation gap，但不补词
4. topology / layout           ← 无主轴、DAG、泳道都属具体文档
```

**`role` 的策略：**

```text
known role    → PASS
unknown role  → WARNING      ← 不是 Hard Error
```

如果 role 也做成二十多个严格 enum，很快会产生新的 ontology 问题（Feature 05 已发现 2 处 role 拉伸）。

### 7.3 ❌ 现在不要做

```text
- 第 7 类 element
- 第 9 / 10 / 11 个 relation 词
- 固定主轴
- 固定泳道
- 强制六类都出现
- schema maxItems: 12
```

---

## 8. 三级 severity 与"不误报"原则

```text
HARD   真正的契约违反 → unknown type / missing provenance / dangling reference /
                       非法 relation 词 / 无导航路径 / 同 ID 重复 / 孤立元素
WARN   需要人看一眼   → element > 12 / role 未知 / Topic 太多 /
                       某 Topic 只挂一个 block / relationGap 存在
INFO   只是形态差异   → component = 0 / state = 0 / 没有主轴 / 非单链拓扑 /
                       Topic 没有 element
```

**校验器的首要任务是"不误报"。** 三篇 Fixture 都是已经通过人工验证的产物；如果它们被自己的校验器判 Hard Error，**先怀疑校验器写得太死**。

两个已经踩到的例子：

1. **不要用 in-degree 判 DAG**：不按 `consumes` 归一化的话，任何"被生产又被消费"的 artifact 都会被误判成收敛节点（A / B / C 全中）。已修。
2. **原文小节无法解析时不要判悬空引用**：Fixture A 用「## 一、」而非「## 1.」，如果直接拿空的小节全集去比对，每个引用都会变成 HARD。正确做法是**跳过并出 Warning**（`W0`）。已修。

---

## 9. 留给 Phase 2b 的问题

```text
1. Hard error 在 Fixture D（真 ER-heavy）/ E（纯 runbook）上是真契约违反，还是 validator 太死？
2. Warning 有没有大量误报？（已知 W4「Topic 只挂一个 block/section」在 Fixture B 上命中过一次，
   而那个 Topic 只承载一节"问题动机"—— 可能是低价值告警）
3. 有没有新的 Semantic gap / Relation gap？
4. 12 在 D / E 上是否明显不够（即：在没有硬塞的情况下远超 12）？
```
