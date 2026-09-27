# 过拟合检查

> Feature 05 · Task 2.6
> 检查两类过拟合（03 §11.4），外加本次新增的第三类自查。

---

## 第一类：Fixture A 锚定

**问题**：B / C 上是否又出现了 A 的结构、命名或切法？

### 结论：**未发现**

| 检查项 | A | B | C | 判定 |
|---|---|---|---|---|
| 主题词 | Context Consumption / Receipt / Availability / Outline | CanonicalDigestEnvelope / JCS / SHA-256 / Digest Profile | Candidate Inbox / Worker / Learning Fact / Proposal | **零重叠** ✓ |
| element 命名 | Frozen Context、Context Consumption… | 严格解析的领域对象、Fusion 语义规范化… | OpenMAIC Candidate、Inbox Worker… | **零重叠** ✓ |
| type 分布 | `concept`4 `artifact`3 `process`2 `constraint`3 | `artifact`5 `process`3 `constraint`2 `component`1 `concept`1 | `artifact`6 `process`3 `state`1 `constraint`2 | **各不相同** ✓ |
| 用到的关系词 | `depends-on` `consumes` `produces`（3） | `consumes` `produces`（2） | `contains` `consumes` `produces` `depends-on` `validates`（5） | **集合不同** ✓ |
| Topic 标题 | 三级递进语义 / 生成链路与消费点 / … | 唯一处理流水线 / 三个 Digest Profile / … | 接收事务与幂等 / 事件驱动架构 / … | **零重叠** ✓ |
| 拓扑 | 链 + 侧挂 | 链 + 侧挂（严格交替） | **分叉 DAG + 不对称分支** | **A 的结构没有复现在 B/C 上** ✓ |
| A 的边界约束 | Consumption ≠ Output Alignment 等 | 无对应结构 | 无对应结构 | ✓ |

**没有出现** `Consumption Evidence` / `Product Boundary` 这类 A 的结构被搬到 B / C 上。

---

## 第二类：把"主轴 + 侧挂"当成 L0 的必要形态

**问题**：是否把"一条主轴 + 侧挂"当成了 framework-map 的默认形态？

### 结论：**在过程中发生了，被文档证据纠正；最终产物未过拟合**

这一条必须如实记录，因为它是**我自己在设计 C 时的真实经历**：

**证据：我在设计 Fixture C 时，前两版方案都把两个分支压成了一条链。**

```text
第一版思路：Fact → MasteryProjector → Memory Surface        （把 Memory 当成 Mastery 的下游）
第二版思路：Fact → Proposal → Validator → Memory Surface     （把 Mastery 整支丢掉）
```

两版都是"单主轴"的惯性：**看到一条流水线，就默认它应该串成一条链。**

**纠正它的不是我的判断，而是文档里的一句话**（§2 末尾）：

> Mastery 与长期 Memory/L2-L3 是从同一 `FusionLearningFact` 派生的**不同投影结果**；Mastery 更新**不作为** Profile Agent 或 Memory Consolidation 的隐式前置条件。

这句话直接否定了串行链。**如果没有这句话，我会画出一张错误的单主轴图，而且它看起来会很整齐、很合理。**

**另外一处相关证据**：B 的主轴是 artifact / process **严格交替**的，很容易让人误以为"交替"是规范要求。而 A 的主轴有两个连续 artifact、C 有连续 artifact —— 三篇里两篇都打破了交替。

→ **判定：第二类过拟合在过程中发生了（两版方案），被文档证据纠正，最终产物未过拟合。**

**教训（建议写进 03）**：

> "主轴"的惯性很强。当一篇文档出现**并列分支**时，要主动问：这两个分支之间**真的**是先后关系吗？还是同一输入的独立投影？
> **如果文档没有明确说"谁是谁的前置"，默认不要串成链。**

---

## 第三类（本次新增自查）：粒度混算

**问题**：有没有把 B / C 的**小节粒度** coverage 与 A 的 **sourceUnit 粒度**混算？

用户特别提示过这个风险。逐项自查：

| 检查项 | 结果 |
|---|---|
| 三份 map 是否各自标注了粒度？ | A：`sourceUnit`（87 条已建立）· B：`section (provisional)` · C：`section (provisional)` ✓ |
| 有没有把三篇的 coverage 合并成一个百分比？ | **没有**。`rule-matrix.md` 与 `verification-output.txt` 都按篇分别列出，A 单列 ✓ |
| N3 在大节粒度上的行为是否说明？ | 已说明：**section 粒度下 N2 与 N3 会合并成同一件事**（"每节有入口"＝"每节可达"），只有 sourceUnit 粒度才能分离 ✓ |
| 有没有宣称"B / C 与 A 的覆盖等价"？ | **没有**。`phase2-generalization.md` 明确写"只证明到小节级别" ✓ |

→ **未发生粒度混算。**

---

## 汇总

| 检查 | 结论 |
|---|---|
| 第一类：Fixture A 锚定 | ✅ 未发现 |
| 第二类：主轴当成必要形态 | ⚠️ **过程中发生过**（C 的前两版方案），被文档证据纠正；最终产物未过拟合 |
| 第三类：粒度混算（新增） | ✅ 未发生 |

**Gate 影响**：第一类未触发 → 不构成 FAIL。第二类虽在过程中发生，但**最终产物没有过拟合**，且它产出了一条可复用的教训（见上），因此不判 FAIL，但**记入遗留项**。
