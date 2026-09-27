# Stability Analysis（F07 · Phase 4）

> 比较对象**不是字符串**：不比 element id、不比 topic 标题、不比顺序。
> 比的是：**同一篇文档的 3 次 run，核心设计语义是否稳定存在。**
> 数据来源：5 个只读评审（`semantic-review.md`）+ 机械统计（拓扑度、hub）。
> ⚠️ Anchors 只用于**事后**评价，**从未提供给生成模型**（prompt 里没有它们，见 `ai/framework-map-generation.prompt.md`）。

---

## 1. Semantic Anchors（每篇各自定义，n/3 = 三次中有承载的次数）

> 判定取值：✅ 有专门元素/边/附件承载 · ⚠️ 只在 edge label / topic 命题 / sectionRef 里（图上不可导航）· ❌ 完全缺席。

### Fixture A（Concept / Architecture heavy）

| # | Anchor | run-03 | run-04 | run-05 | n/3 |
|---|---|---|---|---|---|
| A1 | 三级递进且不可互相替代 | ✅ | ✅ | ✅ | **3/3** |
| A2 | Context Influence 不作为第四级 | ✅ | ✅ | ✅ | **3/3** |
| A3 | 两条链分离（`Consumption ≠ Output Alignment`） | ✅ | ✅ | ✅ | **3/3** |
| A4 | 消费点与投影链 | ✅ | ✅ | ✅ | **3/3** |
| A5 | 判定证据（Attempt 级实际使用） | ⚠️ 仅 Topic 命题 | ⚠️ | ⚠️ | 3/3（**element/relation 承载 = 0/3**） |
| A6 | 消费不要求盲目服从 / 不要求输出明显不同 | ❌ | ❌ | ✅ 2 条 constraint | 1/3 |

> A5「3/3」是靠 Topic 命题承载的 —— 按"element/relation 承载"口径实际是 0/3。
> 口径差异必须在记录里显式区分（人工 candidate map 同样把它放在 Topic 层）。

### Fixture B（Data / transformation heavy）

| # | Anchor | run-01 | run-02 | run-03 | n/3 |
|---|---|---|---|---|---|
| A1 | 三个 digest 走同一条流水线且步骤顺序固定 | ⚠️ stage 间 0 条边 | ✅ | ✅ | 2/3 |
| A2 | 白名单投影 | ✅ | ✅ | ✅ | **3/3** |
| A3 | Domain Separation Envelope | ✅ | ✅ | ✅ | **3/3** |
| A4 | 跨实现逐字节一致 + 共享 Golden Fixtures（人工登记为 relationGap） | ⚠️ 硬套 `validates` | ⚠️ 硬套 4×`validates` | ⚠️ 硬套 `constrains`+`produces` | **0/3**（relationGap 三 run 全 0） |
| A5 | 失败关闭 + 不回退 `JSON.stringify/json.dumps` | ✅ | ⚠️ | ⚠️（原话被削） | 2/3 |
| A6 | 文档边界（只关闭算法选择 / hash 不是加密也不是授权） | ✅ | ✅ | ✅ | **3/3** |

### Fixture C（Process heavy）

| # | Anchor | run-01 | run-02 | run-03 | n/3 |
|---|---|---|---|---|---|
| A1 | Candidate 是外部候选观察（不是内部事实/写入命令） | ✅ | ✅ | ⚠️ 无 element | 2/3 |
| **A2** | **Mastery 与 Memory 是同一 Fact 的不同投影，不是前后置**（Contract §6） | ✅ 无跨支边 | ✅ | ✅ | **3/3 ✅** |
| A3 | 两支机制都在图上活着 | ✅ | ✅ | ✅ | **3/3** |
| A4 | 接收 ≠ 处理完成 | ⚠️ 仅 label/命题 | ✅ | ✅ | 2/3 |
| A5 | 四类 confidence 不是通用分数 | ✅ | ✅ | ✅ | **3/3** |
| **A6** | **§8 是一台状态机**（人工要求 `type = state`） | ❌ `state`=0 | ❌ | ❌ | **0/3 ❌** |

### Fixture D（ER-heavy / multi-entity network）

| # | Anchor | run-01 | run-02 | run-03 | n/3 |
|---|---|---|---|---|---|
| A1 | 核心聚合与归属层级（PlanBundle = Plan + Stage[] + Task[]） | ✅ | ✅ | ✅ | **3/3** |
| A2 | Task 依赖图（含无环 / 同 Bundle / 仅 done 满足） | ⚠️ constraint 元素 | ⚠️ | ⚠️ | 3/3（但都不是 relation 层） |
| **A3** | **Stage–Task 区间包含不变量**（原文 L395/L468） | ❌ | ❌ | ❌ | **0/3 ❌** |
| A4 | 执行事实三分 + replanning 不可改写 | ✅ | ✅ | ✅ | **3/3** |
| A5 | 跨实体引用型关系（引用 ≠ 包含） | ✅ | ✅ | ⚠️ 缺一条 | 3/3 |
| A6 | 条件唯一性 / 幂等（活跃 Plan、selection、dismissal、fingerprint） | ✅ | ⚠️ 散在 label | ⚠️ | 3/3 |
| A7 | 遗留 / 迁移与 transient 边界 | ✅ | ✅ | ✅ | **3/3** |

### Fixture E（Operational Runbook）—— **本轮最差**

| # | Anchor | run-01 | run-02 | run-03 | n/3 |
|---|---|---|---|---|---|
| A1 | 正常路径（两条用例的状态推进） | ✅ 函数级状态推进 | ⚠️ 状态名不可见 | ⚠️ 仅状态元素标签 | 1/3 |
| **A2** | **异常与失败路径**（补偿失败 / 查单未决 / 排查） | ⚠️ | ⚠️ | ⚠️ | **0/3** |
| **A3** | **人工介入与越权边界**（仅管理员强制补偿 / 非所有者被拒） | ⚠️ 越权 0 承载 | ⚠️ | ⚠️ | **0/3** |
| **A4** | **有界失败策略**（连续 10 次 → `REFUND_FAILED`） | ⚠️ 仅边 label | ❌ 全文 0 命中 | ❌ 0 命中 | **0/3** |
| **A5** | **资产回补一致性与幂等**（成对一致 / 只补一次） | ⚠️ | ❌ | ❌ | **0/3** |
| A6 | 部署与验证步骤（构建→部署→沙箱→证据→审查→切换） | ⚠️ 章节可导航 | ✅ | ✅ | 2/3 |

> **E 的结论**：四类 runbook 语义**没有一次被完整保留**（0–1/3）；三次都保留了正常路径的"名字"，
> 但**没有一次把失败路径建模**（无失败状态节点、无 `REFUND_FAILED` 终点、无 `refundCompensationError` 载体）。
> 唯一稳定（2/3 且是最强形式）的锚点是 **A6 —— runbook 的章节骨架**。

### 跨 fixture 的 anchor 稳定性总览

| Fixture | 3/3 的 anchor | ≤1/3 的 anchor | 稳定率（按 3/3 计） |
|---|---|---|---|
| A | A1 · A2 · A3 · A4（+A5 仅 Topic 口径） | A6（1/3） | 4/6 |
| B | A2 · A3 · A6 | **A4（0/3）** | 3/6 |
| C | **A2 · A3 · A5** | **A6（0/3）** | 3/6 |
| D | A1 · A4 · A7 | **A3（0/3）** | 3/7 |
| E | —（**无 3/3**） | **A2 · A3 · A4 · A5（全 0/3）** | **0/6** |

> **读法**：稳定率**不是**质量分。A 的 4/6 里有一个是"系统性误判也稳定复现"（三层写成 `state`，3/3）；
> C 的 A2（Contract §6 那条最贵的纪律）是**正面**的 3/3；E 的 0/6 才是真正的失败。

---

## 2. 结构稳定性（机械指标，见 `run-matrix.md` §5）

### 2.1 核心枢纽（度最高的节点，逐 run）

```text
A  run-02 Outline Generation Attempt(3) / run-03 Generation-facing Projection(2) / run-04 Outline Revision(4) / run-05 Frozen Context(3)
   → 只有「Outline Generation Attempt」四次都在 top-4；最大度仅 3–4（图很薄）

B  run-01 唯一处理流水线(7) / run-02 SHA-256 与 wire digest 生成(4) / run-03 白名单投影(5)
   → 三个 digest Profile 三次都在 top-4（稳定）；但 top-1 枢纽每次都换 → 流水线分解不稳定

C  run-01/02/03 都是 Candidate Projection(5/5/4) + FusionLearningFact(4/4/4)（+ Memory 或 Outcome）
   → 核心 8/8 稳定、核心关系 4/4 稳定；不稳定的是"机制之间的编排与控制"

D  run-01/02/03 都是 PlanBundle(12/11/12) + Task(10/7/7) + ReplanContext(6/5/6)
   → 最稳定的核心；且三次都保留 task→task 自环边 → **没有被压成链**

E  run-01 订单(7) / Compensate Assets / refundOrder
   run-02 沙箱模式运行验证(7) + F13/F14/F15 链路   ← 章节/阶段当枢纽
   run-03 CloudBase 部署(4) + 沙箱验证(4) + 售后链路云函数集(4)
   → **跨 run 没有任何一个核心节点是稳定的**；唯一稳定的是"章节骨架"与两条 §9/§10 约束
```

### 2.2 两个必须明确回答的问题

```text
D：是否稳定保持 network / star-DAG？还是某些 run 被错误压成 chain？
→ 稳定保持。三次 run：elements 23/22/25、edges 39/30/29，
  收敛节点 conv 7/5/5、发散节点 div 12/6/8、自环 1/1/1，叶子仅 1–2 个。
  没有一次出现"压成链"的迹象。

E：是否稳定保留 正常 / 异常 / 人工介入？还是只留下 happy path？
→ 三次都**没有**退化成纯 happy path（至少留了"失败重试"的 label 或章节引用），
  但**没有一次把失败路径建模**：无失败状态节点、无 REFUND_FAILED 终点、
  越权边界三次全部 0 承载、有界失败 0–1/3。
  E 的稳定部分是「章节骨架」而不是「runbook 机制」。
```

### 2.3 拓扑分类（启发式，原始指标见 run-matrix §5）

```text
A  薄图（edges 5–9 / elements 14–16）；run-03 出现"单链 + 大量侧挂（attachments 8）"
B  链 / 星—链混合；run-01 是 hub 型（出度 6），run-02 是纯链，run-03 是单链 + 三扇出
C  分叉 DAG（两支 + Outcome 汇聚）—— 三次都是，形态稳定
D  entity network（hub + 高 conv/div + 自环）—— 三次都是
E  三次形态差异最大：run-01 函数级运行时图 / run-02 Feature 级依赖链 / run-03 阶段流水线
```

---

## 3. 跨 run 稳定性判定

| Fixture | 核心对象 | 核心关系 | 粒度 | 结论 |
|---|---|---|---|---|
| A | 部分（薄图） | 部分 | **不稳定**（elements 14–16、edges 5–9） | 骨架半稳，粒度漂移 |
| B | **稳定** | **不稳定**（inclusion 的 type 三变） | **不稳定**（流水线 1 / 7 / 7 节点） | 核心对象稳、关系词汇不稳、缺口登记全缺 |
| C | **8/8 稳定** | **4/4 稳定** | 部分（编排主体三变） | 骨架稳、**边缘语义（编排/约束/放行）三次都不一样** |
| D | **最稳定** | 稳定（但动词发散：stage→Task 三种写法） | 稳定 | 网络形态稳、关系词汇发散 |
| E | **不稳定** | 不稳定 | **严重不稳定**（云函数级→Feature 级→阶段级） | 唯一稳定的是章节骨架 |

**跨 fixture 的共同形状：**

```text
✅ 稳定：文档里**被显式命名的对象**（实体、digest、Profile、状态集合、章节骨架）
❌ 不稳定：**机制之间的编排、控制、约束、放行** —— 恰好是 Contract §6 / G3 最想约束的那一层
```

---

## 4. 跨 run 的"奇怪一致性"（可疑信号排查）

| 现象 | 检查结果 | 结论 |
|---|---|---|
| 两次 run 产物逐字节相同 | 16 个 run 的 `framework-map.json` sha256 **两两不同** | ✅ 不是缓存/退化，是真实独立调用 |
| 产物用词与人工 candidate map 高度雷同 | 元素命名风格差异明显（AI 用 `context-receipt` 式 slug，人工用 `E-01` + 中文 label）；无大面积雷同 | ✅ 未发现信息面泄漏 |
| 参数在中途变化 | `generationParams` / `promptSha256` / `documentSha256` 全部唯一（`phase3-artifact-check.txt`） | ✅ 同一实验 |

> **UNCLEAR（必须保留的诚实登记）**：三次 run 的思维链未落盘（`raw-response.txt` 只含最终 JSON，
> 而 run-meta 显示 reasoning_tokens 占比 83%），因此**无法判定"硬套动词 / 漏登 gap"是明知故犯还是能力不足**。
> 所有 gaming 判定只基于产物形态，不基于意图。
