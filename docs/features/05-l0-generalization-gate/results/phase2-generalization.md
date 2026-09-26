# Phase 2 泛化验证：三大关切

> Feature 05 · Task 2.3
> 规则级结论见 `rule-matrix.md`；gap 归类见 `gap-classification.md`。

---

## Q1 · Data-heavy 文档是否被迫画成一条不存在的"机制链"？

### 答案：**没有** —— 但原因比结论更重要

Fixture B 有**真实的主轴**，而且不是我强加的 —— 它是文档自带的。§3 标题就叫「唯一处理流水线」：

```text
已通过版本化 schema 严格解析的领域对象
  -> Digest Profile 字段白名单投影
  -> Fusion 语义规范化
  -> Domain Separation Envelope
  -> RFC 8785 JCS
  -> UTF-8 bytes（无 BOM、无结尾换行）
  -> SHA-256
  -> "sha256:" + 64 位小写 hexadecimal
```

画出来之后，B 的主轴是**三篇里最规整的**：artifact / process **严格交替**，7 个节点：

```text
严格解析的领域对象 →(consumes) Fusion 语义规范化 →(produces) CanonicalDigestEnvelope
  →(consumes) JCS+UTF-8 →(produces) canonical bytes →(consumes) SHA-256 →(produces) wire digest
```

### ⚠️ 但这个结论有一个必须说清楚的局限

**Fixture B 虽然是全盘数据类关键词命中最高的一篇（80 次），但它的文体是「字节级规范化规范」，不是「实体关系模型」。**

它全篇在讲**单个**对象的字节表示：一个 JSON 对象怎么排序、怎么转义、时间怎么归一、数字怎么序列化。它**没有**"多个实体 + 相互关系 + 生命周期"这层结构。

```text
本次 B 的形态          数据变换 / 协议规范      → 天然有流水线
本次没有覆盖到的形态    实体关系 / Schema 设计   → 可能天然是网络图，没有主轴
```

**所以 Q1 的答案只对"数据变换类"文档成立。** 对真正的实体关系型文档（data dictionary / ER 设计 / schema 演进文档），本次**没有证据**。

> 这是本次验证最大的选型局限。**必须记下来，否则会把"数据型文档也能画链"这个结论过度推广。**
> 建议 Phase 2b 补一篇真正的实体关系型文档再撞一次。

---

## Q2 · Process-heavy 文档的 L0 是否退化成普通流程图？Topic 与图本身是否失去层级差异？

### 答案：**没有完全退化，但已经贴近边界**

#### 图确实就是一张流水线图

C 的主轴 8 个节点：

```text
OpenMAIC Candidate →(contains) Candidate Inbox →(consumes) Inbox Worker →(produces) Fusion Learning Fact
                                                                    │
                              ┌─────────────────────────────────────┴──────────────────────────┐
                              ▼                                                                ▼
                 MasteryEvidenceProjector                                   ProfileFactProposal
                        （末端无产物）                                              │ depends-on
                                                                          Proposal Validator (validates)
                                                                                    │
                                                                        Fusion Memory Surface (L2/L3)
```

只看这张图，它和一张普通流程图差别确实不大。

#### 但 **Topic 没有退化**，而且差异有数据支撑

C 有 19 节，其中**只有一部分能被图上的元素承载**：

| | 节数 | 占比 |
|---|---|---|
| 有 element 溯源的节 | §1 §2 §3 §5 §6 §7 §8 §9 §10 §11 §12 §13 §14 → **13 节** | 68% |
| **没有任何 element 承载的节** | §4 Confidence · §15 完成语义 · §16 生命周期 · §17 可观测性 · §18 实施切片 · §19 待定项 → **6 节** | **32%** |

这 6 节**只能靠 Topic 入口到达**。也就是说：

> **图与 Topic 的层级差异保留下来了，但差异主要来自"图上放不下的内容"，而不是"图提供了额外的组织"。**

具体到 Topic：

| Topic | 与主轴的关系 |
|---|---|
| T-01 接收事务、幂等与持久模型 | 部分重合（§5/§6/§7 的表结构与幂等规则，图上只有 2 个节点） |
| T-02 事件驱动架构与后台处理 | **重合度最高**（§2/§3/§8/§14/§15） |
| T-03 事实语义、Confidence 与 Mastery | §4 的**四类 confidence 完全不在图上** |
| T-04 受限 Agent 与 Memory Consolidation | 部分重合 |
| T-05 身份作用域、生命周期与可观测性 | §16/§17 **完全不在图上** |
| T-06 实施切片与待定项 | **完全不在图上** |

#### 风险判定

> **如果一篇文档的全部内容都能画进主轴（即 Topic ≈ 主轴节点），L0 就真的退化成流程图了。**
> C 没有到这个程度（32% 的节靠 Topic 兜住），但已经贴近。

**触发条件（供后续判断）**：当"靠 Topic 兜住、图上放不下的内容"低于某个比例（例如 < 20%）时，就要怀疑这篇文档不需要 framework-map，只需要一张流程图 + 目录。

建议 Phase 2b 用一篇**纯运维 runbook 式**文档（只有执行步骤、没有语义层）再撞一次 —— 那是最可能真正退化的形态。

---

## Q3 · 遇到不适配内容时，是哪一类 gap？

### 答案：**全部落在边、配额、入口上，一条 Semantic gap 都没有**

```text
Semantic gap    0 条   ← 三篇 36 个元素，没有一次需要第 7 类
Relation gap    3 条   （B 的跨语言一致性 / C 的持有 / C 的通过放行）
Navigation gap  1 条   （A 的历史缺口，F04 已修）
Layout gap      1 条   （role 粒度不足以区分流水线不同阶段的 process）
Capacity gap    5 条   ← 现有 4 类装不下，建议补第 5 类
```

明细与理由见 `gap-classification.md`。

**最重要的一条**：如果本次没有先分类，最容易被误判的三条恰好都是 Relation gap：

- "两端必须逐字节一致" → 会误以为要加 `conforms-to` 关系词（其实先该确认是不是该走 attachment）
- "Inbox 持有 Candidate" → 会误以为要加 `stores` 概念
- "Proposal 通过校验后放行" → 会误以为要加 `approves`

**这三条都不是类型问题。**

---

## Gate 结论

```text
Gate = PASS
```

**依据：**

- R1 / R3 / R6 / R7 **成立**；R2 / R4 / R5 / R8 **有条件成立**；**没有任何一条"不成立"**
- 红线一条未命中（无第 7 类、无第 9 个关系词、无双粒度混算、无换 Fixture、无提前产出契约）
- B / C 结构自查 Hard Error 0
- 三篇的拓扑互不相同（链 / 严格交替链 / 分叉 DAG）→ 生成模型假设成立

**带进 Feature 03 与 Feature 06 的修正项（不含"改规则"）：**

| # | 修正项 | 归属 |
|---|---|---|
| 1 | §11.1.1 的 gap 分类补 **Capacity gap**（第 5 类） | 03 §11.1.1 |
| 2 | §3.3 "主轴不是必须"补上实测形态：**分叉 DAG + 不对称分支**（不只是"实体关系图"） | 03 §3.3 |
| 3 | §5.5 的"constraint 通常 3~5 条"标注为 **Fixture A 经验值**，不是通用规则 | 03 §5.5 |
| 4 | §5.3 判据 E（≤12）补一句：**流水线越长，constraint 位越少**；容量规则待 Phase 3 讨论 | 03 §5.3 |
| 5 | 3 处 Relation gap 记录在案，是否补词与 `check-map` 契约一起定 | Feature 06 |

**建议的 Phase 2b（两篇，不阻塞 Phase 3）：**

1. **真正的实体关系型文档**（data dictionary / ER / schema 演进）→ 补 Q1 的空白
2. **纯运维 runbook 式文档** → 撞 Q2 的退化边界
3. （可选第三类探针）`deepseek-harness-master/.agents/notes/` 的**决策记录**格式 —— 它可能根本没有机制可画
