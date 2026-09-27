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

#### 判定：**不需要把它当成风险**

L0 的 Framework Map **不需要为了"证明自己不是流程图"而额外加东西**。如果一篇文档的核心就是执行流程，那么它的 Framework Map 长得像流程图是**完全正常**的。

真正不能退化的是**整个产品**只有流程图。只要旁边还有 Topic Navigation → L1 → L2 能承载 confidence、completion semantics、lifecycle、observability、rollout、open questions，它就仍然是 **Document Model**，而不是一个 flowchart viewer。

C 正好是这个情形 —— 那 6 节（32%）全部由 Topic 侧承载：

```text
Framework Map   ≠   Document Summary   ≠   Topic Index
      ↑                    ↑                   ↑
 机制怎么连            这篇讲了什么          有哪些部分
```

三者是并列的三件事，各答一个问题（§3.1）。**不要把"如何与流程图区分"变成 L0 的设计负担。**

> 这条已经写进 03：§14 风险表里原来那行「Process-heavy 文档使 L0 退化成流程图」已被去掉。
> Phase 2b 仍然值得用一篇**纯运维 runbook** 去撞一次，但目的变成"**验证 Topic / L1 / L2 是否真的兜得住**"，而不是"看 L0 像不像流程图"。

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

**依据（范围仅限 A / B / C）：**

- R1 / R3 / R6 / R7 **在当前 3 个 Fixtures 中成立**；R2 / R4 / R5 / R8 **有条件成立**；**没有任何一条"不成立"**
- 红线一条未命中（无第 7 类、无第 9 个关系词、无双粒度混算、无换 Fixture、无提前产出契约）
- B / C 结构自查 Hard Error 0
- 三篇的拓扑互不相同（链 / 严格交替链 / 分叉 DAG）→ 生成模型假设在当前证据范围内成立

> ⚠️ **PASS 不等于"规则已完备"。** 它只说明：**在已测试的三类文档上，没有出现规则失效。**
> 哪些部分稳定到可以进契约、哪些只是"目前没被打破"，由 Feature 06 的三级冻结清单来区分。

**带进 Feature 03 与 Feature 06 的修正项（不含"改规则"）：**

| # | 修正项 | 归属 |
|---|---|---|
| 1 | §11.1.1 的 gap 分类补 **Capacity gap**（第 5 类） | 03 §11.1.1 ✓ 已回写 |
| 2 | §3.3 "主轴不是必须"补上实测形态：**分叉 DAG + 不对称分支**，并加"文档没说前置关系就不要串成链" | 03 §3.3 ✓ 已回写 |
| 3 | §5.5 的"constraint 通常 3~5 条"标注为 **Fixture A 经验值**，不是通用规则 | 03 §5.5 ✓ 已回写 |
| 4 | §14 去掉「Process-heavy 使 L0 退化成流程图」这行风险 | 03 §14 ✓ 已回写 |
| 5 | 3 处 Relation gap 记录在案，**不补词**；由契约提供显式的 `relationGap` 表达位 | Feature 06 |

---

## Phase 2b：**Contract 对抗测试**（不是继续人工观察）

**顺序：先做 Feature 06，再补 Phase 2b。** 理由：现在补两篇只能继续人工观察；有了 F06 的 schema + check-map 之后，同样的两篇可以直接**测试契约本身是否泛化**。

**两篇更极端的文档：**

| Fixture | 形态 | 用来打什么 |
|---|---|---|
| **D** | 真正的 **Entity / ER / Schema Evolution heavy** | 补 Q1 的空白：这类文档是不是根本不长成链？ |
| **E** | **纯 Operational Runbook** | 撞 Q2 的边界：Topic / L1 / L2 是否真的兜得住 |

**做法：拿 F06 的三件产物直接跑，不重新设计：**

```text
Fixture D / E
   ↓
framework-map.schema.json      （Hard：结构是否成立）
   ↓
scripts/check-map.js           （Hard / Warning / Informational 三级）
   ↓
观察四件事
```

**要观察的四件事：**

1. **Hard error 是真的契约违反，还是 validator 写得太死？** —— 如果 D / E 触发大量 Hard error，第一反应应该是"validator 过严"，而不是"文档不合格"。
2. **Warning 是否合理？有没有大量误报？** —— 特别是 `element > 12`、未知 role、`relationGap` 这三类。
3. **有没有新的 Semantic gap / Relation gap？** —— 若有，先按 §11.1.1 分类，**不要直接扩 ontology**。
4. **12 个 element 是否明显不够？** —— 若 D / E 在**没有硬塞**的情况下远超 12，那才是"容量规则需要放宽"的实证。

> 只有第 4 条真的发生，才考虑把 `preferred element budget` 从 12 上调 —— 依据是实测，不是猜。
