# Phase 0 · Prompt Parity Audit

> 目的：**Contract 里所有会影响"生成决策"的规则，逐条检查 Prompt 是否真的暴露给模型。**
> 动机（F07 实测证据）：契约 §2 明确规定「多个值可以同时成立 ⇒ 通常不是同一 state machine 的互斥 state」，
> 而 Fixture A 的三次 run **3/3** 把三层语义写成 `state` —— **这不是模型失败，是契约与 prompt 的信息面不一致。**
>
> 审计对象：`ai/framework-map-generation.prompt.md`（F07 实际使用的 prompt，指纹 `295e9c9923b330f3`）
> 对照来源：`docs/framework-map-contract.md`（判断层）· `schema/framework-map.schema.json`（结构层）
>
> **纪律**：只补**通用判别规则**；**不得**把 Fixture A 的答案（`Receipt = concept`）写进 prompt。
> 这不是 overfitting，而是让模型拿到**完整题目**。

---

## 0. 一个前提：schema 是内嵌的

Stage B prompt 用 `{{SCHEMA}}` 把 `framework-map.schema.json` **全文**注入 user message。
所以 **schema 层的规则（enum、`x-known-roles` 列表、必填字段、`additionalProperties: false`）确实暴露了**。
本审计的"缺口"专指 **只写在 contract 判断层、没有进 schema、也没写进 prompt 的规则**。

---

## 1. 逐条对照

| # | 规则（来源） | 影响决策 | Prompt 暴露 | 判定 |
|---|---|---|---|---|
| 1 | 6 类 element enum（schema `$defs.elementType`） | 选 type | ✅ 内嵌 schema | 充分 |
| 2 | **concept vs state 判别**：可同时为真 ⇒ 不是互斥 state（contract §2） | **选 type** | ❌ **完全没有** | ⚠️ **缺口 P1** |
| 3 | `role: "semantic-level"` 的**用途**（用于分层语义条件）（contract §2） | 选 role | ⚠️ 只有字符串出现在 `x-known-roles` | 部分 |
| 4 | 13 个 role 取值**各自用在什么场合**（contract §3/§7） | 选 role | ⚠️ 只有列表，无用法 | 部分 |
| 5 | 什么时候用 attachment 而不是 edge（contract §3） | 结构 | ⚠️ 只说了"concept/constraint/state 一律走 attachments" | 部分 |
| 6 | **attachment 的宿主方向**（`elementId` 是被挂的东西，`attachedTo` 是宿主；约束应挂在被约束对象上）（contract §3） | 结构 | ❌ **没有** | ⚠️ **缺口 P4** |
| 7 | **`relationGap` vs `Structured Constraint Gap` 的分流**：成对锚定不变量 → `relationGap`；**单实体槽位唯一性 → 只登记，不进 `relationGap`**（contract §5.4 · F09 裁决） | gap 归属 | ❌ **完全没有** | ⚠️ **缺口 P2** |
| 8 | `relationGap` 不进入 `edges[]`、不产生新词（contract §5.3） | gap | ✅ §四 | 充分 |
| 9 | relation 三层冻结原则（contract §0） | relation | ✅ §四（逐字） | 充分 |
| 10 | `qualifiers` 的方向语义与取值（schema + §5.1） | relation | ✅ §四（含 from/to 方向定义） | 充分 |
| 11 | 9 词封闭词表（schema `relationType`） | relation | ✅ §四 + schema | 充分 |
| 12 | `contains ≠ references` 边界（contract §5.2） | relation | ✅ §四 | 充分 |
| 13 | 不要强行串链（contract §6） | 拓扑 | ✅ G2/G3 | 充分 |
| 14 | provenance 硬规则（contract §7.1 F1） | provenance | ✅ §三 + G7 | 充分 |
| 15 | Navigation N1~N3（contract §7.1 F2） | 导航 | ✅ §三 | 充分 |
| 16 | budget 12 是 Warning 不是 Error（contract §7.2） | 容量 | ✅ §三 | 充分 |
| 17 | 每个 element 至少参与一条 edge 或 attachment（H7） | 结构 | ✅ §三 | 充分 |
| 18 | Topic 与 element 解耦；element 反向关联 topic（schema topic） | 结构 | ✅ §三 | 充分 |
| 19 | **Capacity gap：哪些内容可以不上图**（contract §4） | **取舍** | ❌ **没有** | ⚠️ **缺口 P5** |
| 20 | 三种 coverage 必须分开、`coverage` 数字 ≠ 机制覆盖（contract §1） | 自检 | ❌ 没有 | 部分（见 §3） |
| 21 | **`edge.label` 不得引入图上不存在的主体 / 不得用 label 承载规则语义**（F07 新发现，contract 尚未登记） | **规避位** | ❌ **完全没有** | ⚠️ **缺口 P3** |
| 22 | Topic 是**语义入口**，不是小节目录；N2 可被"一节一 Topic"构造性满足（contract §1 + F07 发现） | 导航粒度 | ⚠️ §六 给了 Topic 职责，但**没有反面警告**，且存在**激励冲突** | 见 §4 |
| 23 | `meta.validationGranularity = "section (provisional)"`（schema meta） | 元数据 | ✅ §二 | 充分 |
| 24 | `document.role` = current / target（schema document） | 元数据 | ✅ §二 | 充分 |
| 25 | 五类 gap 分类（Semantic/Layout/Relation/Navigation/Capacity） | 自评 | ❌ 没有 | 非必需（不补） |

**小结：5 个真缺口（P1–P5）+ 3 处部分暴露 + 1 处激励冲突。**

---

## 2. 五个缺口与 F07 证据的对应（**每个缺口都有实测产物支撑**）

### P1 · concept vs state 判别规则缺失 → **A 的 3/3 系统性误判**

```text
契约 §2：Context Receipt / Availability / Consumption = concept（三个可同时为真）
产物   ：run-03 L27/L42/L58 · run-04 L28/L42/L56 · run-05 L28/L40/L52 全部 "type": "state"
证据   ：原文 L312–318 的 5 种布尔组合表就在文档里，模型**读到了**（它还引用了）
        但 prompt 从没告诉它"可同时为真 ⇒ 不是 state"
```

→ **这是信息面不一致，不是模型能力不足。** 补通用规则即可（见 §5 补丁 1）。

### P2 · `relationGap` / Structured Constraint Gap 分流缺失 → **C 的自环 relationGap**

```text
契约 §5.4（F09 裁决）：单实体槽位唯一性 → **不进 relationGap**；"为它造自环边只会误导 L0 图"
产物   ：C/run-03 把"同一逻辑事实跨 revision 唯一"写成 from == to 的自环 gap
```

→ prompt §四只说"若实在无法忠实表达，登记进 relationGap"，**没有分流规则** → 模型把该登记为约束的东西塞进了 gap。

### P3 · `edge.label` 禁则缺失 → **两个 fixture 的"偷带主体"**

```text
C/run-03 e4 label：「Inbox Worker 通过 lease 取得并处理 Candidate」—— Inbox Worker 不在该图 16 个 element 里
E/run-01 label ：「查单纠偏：80% 命中时推进退款结果；连续 10 次失败置 REFUND_FAILED」—— 整条规则塞进 label
```

→ `edge.label` 在 schema 里是自由字符串，**prompt 没有约束它不能承载语义**。

### P4 · attachment 宿主方向缺失 → **B/run-03 的约束挂错侧**

```text
B/run-03：`hash-not-encryption`（约束"不得把敏感正文纳入**输入**"）attachedTo: ["wire-digest"]（输出产物）
```

### P5 · Capacity 取舍判据缺失 → **E 的机制被静默砍掉**

```text
E/run-02：恰好 12 个元素，而 REFUND_FAILED / 越权 / 幂等 / 强制补偿 在产物里 grep 0 命中
prompt 只说了"budget 是 Warning、不要为压到 12 删机制"，
但**没有给出"什么可以不上 L0"的正面判据**（contract §4 的 Capacity gap 判据）
→ 模型只能自己发明取舍标准，而它发明的标准是"按粒度聚合"（把机制一起聚合掉了）
```

---

## 3. 部分暴露项的处理

| 项 | 现状 | 处理 |
|---|---|---|
| role 用途 | 只有 13 个字符串 | **本轮不补**：F07 的 role 误用只有 2 类（D 填 type 值、E 填 document.role 值），且其中一类已被 W2 抓到；补 role 用法会引入新的歧义面。**登记，等 Inventory 阶段看是否还出现** |
| `semantic-level` 用法 | 只有字符串 | 同上 |
| attachment vs edge 的判据 | 只给了"谁走 attachments" | 只补 P4 的方向规则，不扩"何时用"的判据（避免与 P1 的 ontology 修复叠加） |
| coverage 三层分离 | 未暴露 | **不补进 prompt**：这是**审计者**的判据，不是生成者的判据。写进 prompt 反而可能诱导模型去"凑 coverage 数字" |

---

## 4. 一处**激励冲突**（不是 prompt 缺口，登记不改）

```text
N2 要求：heading tree 里每一个顶层小节都必须有入口
最省力的满足方式：给每个 ## 各造一个 Topic
后果：N1/N2/N3 由构造必然满分（C/E 已证：每 run 恰好 11/13/19 条 I6）
```

**这不是模型作弊，是结构给的最优解。** 处置选项（**本轮都不做**）：

```text
(a) prompt 里加一句反面警告："Topic 是读者进入这张图的角度，不是小节目录的镜像"
(b) 改 N2 的入口全集定义（**属 validator 改动，本轮不做**）
(c) 什么都不改，只在报告里坚持"四层 coverage 分开"（§6 of README）—— **本轮采用**
```

**理由**：先把 Semantic Inventory 做出来，才能判断"Topic 镜像小节"是不是**掩盖了机制丢失**
（C/E 的机制缺失恰好伴随着 Topic≈小节）。**先取证，再动 validator。**

---

## 5. Prompt 补丁（写给 Stage B：`ai/framework-map-synthesis.prompt.md`）

以下 5 段**逐字**进入新 prompt 的对应位置；**不含任何 fixture 的具体答案**。

### 补丁 1 · 补进 §三（结构要求）之前的"类型判别"小节

```text
### 类型判别（concept / state / process / artifact）

- 同一个对象在同一时刻**只能处于其中一个**取值 → 它属于 state（或该对象的 state 集合）。
- 多个取值**可以在同一时刻同时成立** → 它们通常**不是**同一个 state machine 的互斥 state，
  而应判为 concept（分层语义/条件）；若它们描述的是"这件事是怎么发生的"，判 process。
- artifact 是"被产出/被存储/被传递"的东西；process 是"发生的事"；
  concept 是"用来判断/命名的语义维度"；constraint 是"限制行为或划定边界的规则"。
- ⚠️ 判断依据**只能是原文**：原文是否在同一时刻并列陈述这些取值（例如列出一张组合表）。
  不要因为名字里带"状态""层级""阶段"就判 state。
```

### 补丁 2 · 补进 §四（relation 三层）的 relationGap 段

```text
**什么时候该进 `relationGap`、什么时候不该（重要）：**

- 进 `relationGap`：**成对锚定**的不变量 —— 涉及两个元素之间的相对关系/定位，
  而 9 词 + qualifiers 都无法忠实表达（例：一组依赖边整体必须无环；某字段值必须落在关联对象定义的区间内）。
- **不进 `relationGap`**：**单实体槽位唯一性** —— 约束的是"某个实体在某个复合键上最多/恰好一条"
  （例如每 (goalId, date) 至多一条记录、同一时刻至多一条 active）。
  这类**不要**造自环 gap（`from == to` 会误导 L0 图）；用 `constraint` 元素承载，或干脆不建模。
```

### 补丁 3 · 补进 §三（结构要求）

```text
**`edge.label` 的使用边界：**

- `label` 只能说明**这条边在原文里怎么说的**（可以是原文用词或简短改写）。
- **禁止**在 `label` 里引入**图上不存在的元素/主体**（例如写"某某 Worker 取得…"，而图上没有这个 Worker）。
- **禁止**把一条规则、阈值、例外整段塞进 `label`。规则属于 `constraint`，阈值属于 `constraint` 的 label，
  不属于边的 label。
```

### 补丁 4 · 补进 §三（结构要求）

```text
**`attachments` 的方向：**

- `elementId` = 被挂上去的东西（concept / constraint / state）；
  `attachedTo` = 它挂靠的宿主（通常是主轴上的 process / artifact）。
- 约束类 concept / constraint 应挂到**它约束的那个对象**上。
  例：一条"输入不得包含敏感正文"的约束，应挂到**输入端**的产物，而不是输出端。
```

### 补丁 5 · 补进 §三（budget 段之后）

```text
**什么可以不上 L0（取舍判据）：**

budget 是 Warning，但"多列"不等于"该列"。可以不上 L0 的内容：

```text
· 同一概念的另一种说法（同义改写）
· 只在一处提到、且不与任何其它元素发生关系的细节参数
· 纯粹的叙述性过渡 / 背景铺垫
· 属于更细层级（L2 block / 视觉块）的实现细节
```

**不可以**因为"图会变大"而砍掉：

```text
· 失败/异常路径、人工介入与权限边界
· 阈值、上限、有界重试等规则
· 不变量与一致性要求
· 明确写出的"不做什么"（非目标 / 边界）
```

**判断方法：** 先问"这条语义如果不在图上，读者会不会漏掉一个机制？" 会 → 它必须进图（作为 element / constraint / attachment），
而不是靠对同类内容做粒度聚合把它并掉。
```

---

## 6. 审计结论

```text
出 5 个真缺口：P1 concept/state 判别 · P2 gap 分流 · P3 edge.label 边界
              · P4 attachment 方向 · P5 Capacity 取舍判据
其中 P1 与 P2 直接对应 F07 已确证的产物错误（A 的 3/3 类型误判、C 的自环 gap），
P3 对应两类"不受检表达位"，P5 对应 E 的机制丢失。
→ 这 5 条全部进 Stage B 新 prompt；**不改 Contract、不改 validator、不写 fixture 具体答案**。

登记但本轮不处理：role 用途细化 · `semantic-level` 用法 · coverage 三层分离（属审计判据）
登记但本轮不改动：Topic≈小节的**激励冲突**（先取证，再决定是否动 N2）
```

**Phase 0 完成 → 可以进入 Phase 1（prompt + harness）。**
