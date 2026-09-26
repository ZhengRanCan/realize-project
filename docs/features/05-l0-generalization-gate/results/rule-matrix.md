# 规则矩阵：R1~R8 × 三类文档

> Feature 05 · Task 2.5 · **本 feature 的主要交付物**
>
> 被攻击的规则来自 Feature 04（`docs/features/03-hierarchical-architecture/README.md` §3~§6）。
> 结论只有三种：**成立 / 有条件成立 / 不成立**。
>
> ⚠️ **证据范围声明**：本矩阵的结论只覆盖 **当前 3 个 Fixtures（A / B / C）**。
> "成立"一律读作 **Supported across current A/B/C fixtures**，**不是** "universal / 已证明完备"。
> 尚未测试的形态（真正的 Entity-Relationship heavy、纯 Operational Runbook、决策记录）见 `phase2-generalization.md` 的 Phase 2b。
> 如果 Phase 2b 打出第 7 类元素，那是**扩大证据范围**，不是推翻本矩阵。

```text
A  Concept / Architecture heavy   测试文档/18-context-consumption-semantic-model.md     (540 行)
B  Data Model heavy               测试文档/fixture-b-canonical-hash-digest-…md          (462 行)
C  Process / Operational heavy    测试文档/fixture-c-candidate-inbox-driven-…md         (510 行)

A 的粒度 = sourceUnit（87 条已建立）
B / C 的粒度 = 原文小节（**provisional**，二者不可混算）
```

---

## R1 · 六类 element vocabulary

**结论：成立（Supported across current A/B/C fixtures）**

> 措辞注意：**不是** "六类 ontology 已证明完备"。
> 只能说：**在当前 3 个 Fixtures 中，未观察到 Semantic gap。**

| Fixture | 实际用到的 type | 缺失 |
|---|---|---|
| A | `concept`×4 · `artifact`×3 · `process`×2 · `constraint`×3 | `component` · `state` |
| B | `artifact`×5 · `process`×3 · `constraint`×2 · `component`×1 · `concept`×1 | `state` |
| C | `artifact`×6 · `process`×3 · `state`×1 · `constraint`×2 | `concept` · `component` |

**证据：三篇都没有出现"六类装不下"的东西，一次都没有需要第 7 类。**

而且三篇的分布**互不相同**：

- 只有 A 需要 `concept` 表达"三级递进语义"这类可分级的语义层；
- 只有 B 需要 `component` 表达"TypeScript / Python 两端实现"（**A 的 `component = 0` 不是缺陷，B 证明了这个类型有存在理由**）；
- 只有 C 需要 `state` 表达 Inbox Worker 状态机。

> 这直接印证了 F04 的 G4 裁决：**六类是 allowed vocabulary，不是每张图都要凑齐的 checklist。**
> 反过来，如果 validator 要求"六类至少各一个"，B 会被逼着造一个假 state，A 会被逼着造一个假 component。

---

## R2 · `type` + `role` 两层机制

**结论：成立（有 2 处拉伸）**

三篇都用到了 role，且 role 承担了它该承担的区分：

| role | A | B | C |
|---|---|---|---|
| `input` | E-01 | E-01 | E-01 |
| `intermediate` | E-02 E-07 E-12 | E-03 E-05 E-06 E-07 | E-02 E-04 E-06 E-07 E-10 E-11 |
| `consumer` | E-05 | — | E-03 |
| `producer` | — | E-10 | E-05 |
| `authority` | — | E-09 | E-09 |
| `boundary` | E-10 E-12 | E-02 E-12 | E-11 E-12 |
| `excluded` | E-11 | — | — |
| `output` | E-09 | E-08 E-11 | E-08 |
| `target` | E-08 | — | — |
| `instance` | E-03 | — | — |
| `semantic-level` | E-06 E-07 E-08 | — | — |

**两处拉伸：**

1. **`semantic-level` 只在 A 用到** —— 它是 F04 为 A 专门加的 role。B / C 完全不需要。说明它是"按需增加"的 role，不是通用维度。
2. **C 的 `E-10`（Inbox 处理状态机）标成 `state` + `intermediate` 是把一个集合压成一个节点** —— 严格说 `state` 是"某对象在某一时刻的状态"（单数），而这里是一台有 6 个状态 + 迁移的状态机。归入哪类 gap 见 `gap-classification.md`（结论：Capacity/Layout，不是 Semantic）。

另有一处**区分度不足**（不构成缺口）：B 的 `E-03`（规范化）与 `E-05`（JCS 序列化）role 都只能是 `intermediate` —— role 无法区分流水线里不同阶段的同类 process。这是 role 的设计本意（它是上下文角色，不是位置），不算缺口。

---

## R3 · edge / attachment 区分（主轴只放 process / artifact）

**结论：成立**

| Fixture | 主轴节点 | 边数 | 侧挂 | 被判出主轴的元素 |
|---|---|---|---|---|
| A | 7（artifact ↔ process 交替） | 4 | 7 | 所有 concept / constraint |
| B | 7（**严格交替**） | 6 | 5 | `constraint`×2 · `concept` · `component` |
| C | 8（含连续 artifact） | 8 | 4 | `state` · `constraint`×2 · 一个 `artifact/authority` |

**证据：三篇都把非 process/artifact 干净地挤出了主轴**，且没有一篇需要"把 constraint 写成 edge"。

- B 的 `component`（TS/Python 实现）走 attachment ✓
- C 的 `state`（状态机）走 attachment ✓
- C 的 `E-09`（FusionLessonBinding，`artifact/authority`）也走 attachment —— 它是 artifact 却不在数据流上

> 最后一条说明一件事：**"artifact 默认上主轴"并不成立**，是否上主轴要看它是否在数据流里。attachments 允许承载任何类型，这个设计是对的。

---

## R4 · relation vocabulary（8 词 + 主动语序 + 封闭性）

**结论：有条件成立**

**用到的词**

| Fixture | 用到的关系词 | 个数 |
|---|---|---|
| A | `depends-on` · `consumes` · `produces` | 3 / 8 |
| B | `consumes` · `produces` | 2 / 8 |
| C | `contains` · `consumes` · `produces` · `depends-on` · `validates` | 5 / 8 |

- 三篇合计覆盖 **6 / 8** 词（未用到 `transforms-to` · `controls` · `constrains`）
- **主动语序三篇都成立**，没有出现一处写反或需要被动态
- **封闭性三篇都成立**，未使用兜底词 `relates-to`

**但发现 3 处关系表达不精确（均为 Relation gap，不是 Semantic gap）：**

| # | 想表达的关系 | 只能写成 | 为什么不精确 |
|---|---|---|---|
| 1 | Candidate Inbox **持有** Candidate | `E-02 --contains--> E-01` | `contains` 的既定语义是"component 嵌套 process"；用在"存储持有"上是拉伸 |
| 2 | Proposal **校验通过后放行**进入 Memory | `E-07 --validates--> E-06` + `E-08 --consumes--> E-06` | `validates` 只表达"谁校验谁"，**"通过/放行"这一结果语义没有词** |
| 3 | 两端实现必须与同一 fixture **逐字节一致** | `E-10` 挂 `E-09`（attachment） | 没有 conformance / agreement 关系词；"依赖"≠"必须一致" |

> 这三条**都不需要新增 element 类型** —— 节点都是对的，只是边不够用。这就是为什么必须先分类再谈扩 ontology。

---

## R5 · ≤ 12 element 容量原则

**结论：有条件成立（对"有真实流水线"的文档偏紧）**

```text
A  12 / 12   ← 顶到上限
B  12 / 12   ← 顶到上限
C  12 / 12   ← 顶到上限
```

**三篇全部顶到 12，这不是巧合。** 具体被挤掉的东西：

| Fixture | 因为容量被推到 L1/L2 的内容 |
|---|---|
| A | "Consumption 不要求输出明显不同"、"Hash 式"的判定规则等（后靠 Topic 入口补回可达性） |
| B | §12 有 **7 条**实施不变量，图上只放得进 **2 条** constraint；被挤掉的是"Hash 不是授权"、"Hash 不是加密"、"相同语义相同字节"、"不同用途不可互换"（部分） |
| C | §3 有 5 条关键原则 + §14 有 4 条规则，图上只放得进 **2 条** constraint；被挤掉的是"单一权威后端"、"不信任 Candidate 自报身份"、"不得用一个 success:true"、四类 confidence、Mastery Outcome |

**观察：流水线越长，留给 constraint 的位置越少。** B 和 C 的图都只剩 2 条 constraint —— 低于 03 §5.5 那个"通常 3~5 条"的经验值（那个经验值来自 Fixture A 的 33 条负向内容，是**文档特定的**）。

**建议（供 Phase 3 讨论，本次不改规格）：**
- 容量与主轴长度挂钩，或
- 允许 `constraint` 以"标注"形式附加在现有节点上、不占 element 配额。

---

## R6 · Topic synthesis（语义内聚 / 推导顺序 / 不做 coverage repair）

**结论：成立（并被两篇独立强化）**

| Fixture | Topic 数 | 没有 element 的 Topic | 该 Topic 的内容 |
|---|---|---|---|
| A（修复后） | 5 | 无 | — |
| B | 5 | **T-01** | §2「为什么不能直接 hash 原始 JSON」（问题动机） |
| C | 6 | **T-06** | §18 / §19「实施切片与待定项」 |

**关键证证据：B 和 C 各自自然产生了一个"只有内容、没有 element"的 Topic，而且都不是为了补 orphan 而造的：**

- B 的 T-01 是**问题动机**（为什么需要规范化）—— 它不该出现在机制图上，但读者必须能走到它；
- C 的 T-06 是**实施切片**（7 个依赖顺序的切片）—— 同样不该上图。

> **如果沿用 F04 修复前的不变量（"每个 Topic 必须有 element"），这两个 Topic 都会被判为非法** —— 要么删掉、要么给它们塞一个假元素。这正是 G1 缺口在另外两类文档上的**独立复现**，且复现率更高（两篇各一次）。

**推导顺序**方面：B / C 的 Topic 都是先读全文、按语义内聚分组，再把内容分配进去的；没有出现"发现 orphan → 建 Topic"。

---

## R7 · Framework Coverage 与 Navigation Coverage 必须分离

**结论：成立（强证据）**

```text
B  N2/N3 顶层 §1~§13 全部有入口（文档级 1 节 + Topic 12 节）
C  N2/N3 顶层 §1~§19 全部有入口（文档级 1 节 + Topic 18 节）
A  sourceUnit 粒度：87/87 有路径
```

**但本次还发现一个 granularity 副作用，必须记录：**

> **在 section 粒度上，N2 与 N3 会合并成同一件事** —— "每一节都有入口"就是"每一节都可达"。
> 只有在 sourceUnit 粒度上，两者才可能分离（一节里可以有多条 unit，其中一部分可达、另一部分不可达）。
>
> 所以 B / C 的这条 PASS **只证明到小节级别**，不能宣称与 A 的 sourceUnit 覆盖等价。

三篇共同印证的原则：

```text
Framework Coverage  ≠  Navigation Coverage  ≠  Semantic Coverage
```

---

## R8 · `framework-map` 表达模型本身（含"主轴"是否必要）

**结论：有条件成立 —— "单一主轴"不成立**

| Fixture | 拓扑形态 | 主轴 |
|---|---|---|
| A | 一条链 + 侧挂 | 有（artifact / process 混合） |
| B | 一条链 + 侧挂 | 有（**artifact / process 严格交替，7 节点**） |
| C | **分叉 DAG** | ❌ **没有单一主轴** |

**C 的拓扑（关键证据）：**

```text
OpenMAIC Candidate → Candidate Inbox → Inbox Worker → Fusion Learning Fact
                                                            │
                            ┌───────────────────────────────┴──────────────┐
                            ▼                                              ▼
                  MasteryEvidenceProjector                    ProfileFactProposal
                            （末端无产物节点）                              │
                                                              Proposal Validator (validates)
                                                                            │
                                                                Fusion Memory Surface (L2/L3)
```

- `Fusion Learning Fact` 之后**分成两支**，两支**不对称**（Mastery 支是末端 process，没有产物节点）
- 还出现了**双入边**（Memory Surface 同时 `consumes` Proposal 与 Fact）

**结论：**

> **`framework-map` 支持"链"也支持"分叉"；但"必须有单一主轴"不成立。**

这条与 03 §3.3 一致（那里已经写明"主轴 + 侧挂只是**一种**布局策略"），并且给出了当初没有的具体形态：**分叉 DAG + 不对称分支**，而不是当初猜测的"实体关系图"。

**顺带验证了 G3：**

- A 的主轴有两个连续 `artifact`（Frozen Context → Projection）
- C 有连续 `artifact`（E-02 → …）
- B 是严格交替

→ **"允许同类型元素连续出现"这条修正在三篇上分别得到正例与反例的支持**，原本"交替"的措辞确实是过拟合。

---

## 汇总

| # | 规则 | 结论 |
|---|---|---|
| R1 | 六类 element vocabulary | **成立**（Supported across current A/B/C fixtures —— 非"已证明完备"） |
| R2 | type + role 两层机制 | **成立**（2 处拉伸） |
| R3 | edge / attachment 区分 | **成立** |
| R4 | relation vocabulary（8 词） | **有条件成立**（3 处 Relation gap） |
| R5 | ≤ 12 容量原则 | **有条件成立**（三篇全部顶格，流水线越长 constraint 越少） |
| R6 | Topic synthesis | **成立**（两篇各出现一个"无 element 的 Topic"） |
| R7 | Framework / Navigation coverage 分离 | **成立**（强证据；但 section 粒度下 N2/N3 合并） |
| R8 | framework-map 表达模型 | **有条件成立**（"单一主轴"不成立 → 分叉 DAG） |

**没有任何一条判为"不成立"，也没有任何一处需要新增第 7 类元素或第 9 个关系词。**

以上结论的范围**仅限 A / B / C 三篇**。哪些是"稳定到可以进契约"，哪些只是"目前没被打破"，见 Feature 06 的三级冻结清单。
