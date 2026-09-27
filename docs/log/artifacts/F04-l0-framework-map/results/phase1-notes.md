# Phase 1 笔记（元素选择 · 淘汰记录 · 规格缺口 · 修复轮）

> Feature 04 · Task 1.1 ~ 1.4
> 输入：`测试文档/18-context-consumption-semantic-model.md`（Fixture A，540 行）
> 口径：`fixtures/context-consumption.overview-plan.json` 的 87 条 sourceUnits、21 个 block
> 产物：`drafts/context-consumption.map.json`（**mapVersion 2**）· `drafts/l0-preview.html`

---

## 1. 选中的 12 个元素

| id | label | type | role | topics | 为什么它是元素 | sourceUnitIds |
|---|---|---|---|---|---|---|
| E-01 | Frozen Context | artifact | input | T-02 | 被消费的冻结教学语义本体，整条链的输入 | SU-014, SU-020, SU-058, SU-065 |
| E-02 | Generation-facing Projection | artifact | intermediate | T-02 | 服务端派生、真正喂给生成的语义载体 | SU-046, SU-047, SU-048, SU-059, SU-080 |
| E-03 | Outline Generation Attempt | process | instance | T-02, T-03 | **消费点本身**；Subject 是"某一次 Attempt" | SU-044, SU-046, SU-050, SU-076 |
| E-04 | Context-shaped Outline Revision | artifact | intermediate | T-02, T-04 | outline 的产物，也是 scene 唯一的消费对象 | SU-054, SU-056, SU-062, SU-079 |
| E-05 | Scene Generation | process | consumer | T-02, T-04 | 消费**不该**发生在这里，是主消费点的对照面 | SU-051, SU-055, SU-075, SU-076 |
| E-06 | Context Receipt | **concept** | **semantic-level** | T-01 | 三级递进的第一级 | SU-004, SU-012, SU-014, SU-057 |
| E-07 | Context Availability | **concept** | **semantic-level** | T-01 | 第二级 | SU-004, SU-017, SU-018, SU-058 |
| E-08 | Context Consumption | **concept** | **semantic-level** | T-01, T-03 | 第三级，本文的核心目标 | SU-004, SU-022, SU-023, SU-024, SU-085 |
| E-09 | Output Alignment | concept | output | T-04 | 另一条链的终点；没有它就没有"≠" | SU-010, SU-039, SU-078, SU-080 |
| E-10 | Consumption ≠ Output Alignment | constraint | boundary | T-04 | 两条链的边界，决定整套职责划分 | SU-002, SU-008, SU-040, SU-079 |
| E-11 | Context Influence 不得作为第四级 | constraint | excluded | T-05 | 两条 headline 决定之一（排除项） | SU-007, SU-032, SU-034, SU-084 |
| E-12 | Receipt / Availability / Consumption 不能互相替代 | constraint | boundary | T-01 | 三级递进成立的前提；拓扑表达不出来 | SU-005, SU-019, SU-025, SU-064 |

**结构**

```text
主轴（edges 4 条，只用 8 词表里的 3 个）
  E-01 Frozen Context
    ↑ depends-on
  E-02 Generation-facing Projection
    ↑ consumes
  E-03 Outline Generation Attempt
    ↓ produces
  E-04 Context-shaped Outline Revision
    ↑ consumes
  E-05 Scene Generation

侧挂（attachments 7 条）
  E-06 → E-01 · E-07 → E-02 · E-08 → E-03
  E-09 → E-04, E-05
  E-10 → E-08, E-09 · E-11 → E-08 · E-12 → E-06, E-07, E-08
```

```text
type 分布: artifact=3 · process=2 · concept=4 · constraint=3 · component=0 · state=0
量:        12 元素 · 4 边 · 7 侧挂 · 5 topics · 直接承载 42/87 条语义
```

---

## 2. 被淘汰的候选（16 条）

判据编号对应 03 §5.3：A 可指称 / B 有关系 / C 删掉会破坏理解 / D 不是细节。

| 候选 | 判据 | 淘汰理由 |
|---|---|---|
| `Generated Lesson`（artifact） | C | 上位概括；`E-04 → E-05` 已表达产出关系 |
| `Scene`（artifact） | C / D | 是 Generated Lesson 的一部分，消费关系已由 E-05 表达 |
| `Outline Generation Request`（process） | D | Attempt 的上位粒度 |
| `Frozen`（state） | D | 是 Frozen Context 的属性，已含在元素名里 |
| `Context-side chain` / `Output-side chain`（concept） | D | 链是元素的概括；由 E-10 表达 |
| `Context-grounded generation narrative`（concept） | A | 是一句主张，不是可指称对象 |
| `Primary Consumption Point`（constraint） | C | 已由拓扑表达 |
| `Scene 不得重新读取完整 Frozen Context`（constraint） | C | 同上 |
| `Consumption 的最低证据 = generation-level`（constraint） | 类型 | §5.2 不加 evidence 类型；属判定规则 → L1/L2 |
| `Consumption 不要求输出明显不同`（constraint） | C | 语义约束而非架构边界 → L1/L2（**其所在 O-11 因此需要 Topic 入口，见 §4**） |
| `Objective` / `Knowledge Scope` / `Guidance Assessment Item` | D / E | Output Alignment 的下级细节 → L3 |
| `OpenMAIC` / `DeepTutor` / 服务端 Fusion 层（component） | C | 机制由元素与关系表达 |
| `FormalGenerationContextProjection`（类名） | D | E-02 的实现载体 → L3 |
| `app/api/generate/scene-outlines-stream/route.ts` | D | E-03 的实现细节 → L3 |
| `5 种状态组合`（state 集合） | D | 是状态的组合而非单个状态 → L1/L2 |
| `Context Influence`（state / concept） | 类型 | 它是**被排除项** → 以 constraint/excluded 表达（E-11） |

> **C 判据用了 6 次、D 7 次、A 1 次。** C 的判定是主观的，reviewer 应重点复核那 6 条。

---

## 3. 关键决策

**D1 · 三级层级最终判为 `concept`（role: `semantic-level`）** —— 首版曾判 `state`，reviewer 裁决改回。

理由（已登记为 ontology regression case）：

```text
Receipt = yes 且 Availability = yes 且 Consumption = yes   ← 三者可以同时为真
```

文档 §7 的"5 种状态组合"正是**三个 boolean 语义条件的组合**，而不是一个对象在互斥状态间迁移。且 Consumption 的 Subject 是 `Frozen Context × Outline Generation Attempt`，不是 Frozen Context 自身的生命周期状态。

据此提炼出判别规则（已写入 03 §5.4）：

> **如果多个值能够在同一时刻同时成立，它们通常不是同一个 state machine 的互斥 state。**

**D2 · E-03 命名为 `Outline Generation Attempt`（role=instance）** —— 真正消费投影的是某一次 Attempt，§11 明确 Subject = `Frozen Context × Attempt`。

**D3 · 一个侧挂元素只渲染一次** —— 首版把 E-09 渲染在两行，页面出现 13 张卡，视觉上等于"同一概念两个节点"，与判据 F 冲突。改为只渲染一次 + 卡片标注全部挂点。

**D4 · topic 从 4 个改为 5 个，且按语义内聚重新推导** —— 见 §4。

**D5 · `thesis` 保留**（本篇确有明确中心命题，符合可选字段的使用条件）。

**D6 · 新增交付物清单外的** `drafts/build-l0-preview.js` —— 为可复现地生成静态页（~200 行），**不是产品代码**（产品渲染属 Feature 08），不修改 `app/`。

---

## 4. ⚠️ 修复轮：mapVersion 1 → 2

### 4.1 问题（首版自查时被 Structural Reachability Test 发现）

```text
完全无路径的语义: 8 条
  SU-028 / SU-029 / SU-030 / SU-031 / SU-087   ← O-11《Consumption 不要求什么》
  SU-037 / SU-038                              ← O-13《5 种状态组合的产品解释》
  SU-001                                       ← O-01《这是什么文档》
```

**根因是规格**：03 §7 原写作"每个 Topic 至少有一个 L0 element"。我照做，于是**图上没有元素的那类内容就不可能有 Topic**，整块语义从导航上消失。更直接的证据：旧的 `T-03「Consumption Evidence」` 因为没有 L0 element 承载而被我从 topic 集合里删掉，而 O-11 / O-10b / O-16 正是它的归属 —— 一删就抹掉一整片区域。

**本质**：把两件不同的事当成了同一件。

```text
Framework Map       解决：这套设计的核心机制是什么？      → 允许裁掉大部分内容
Topic Navigation    解决：这篇文档还有哪些内容值得下钻？  → 允许挂"图上没有"的内容
```

### 4.2 修法（reviewer 裁决，已实施）

1. **Topic 与 L0 element 解耦**（03 §7.1 F3：**不要求**每个 Topic 都有 element）
2. **新增 Navigation invariant**（03 §7.2）：N1 每个 Topic 至少关联一个 element 或 block；N2 每个需要保留的 block 至少一个 Topic 入口；**N3 每条 Semantic Unit 至少一条 `Document → Topic/L0 → L2` 的可达路径**
3. **Topic 按语义内聚重新推导**，不是为了补 orphan 机械新建：

```text
✅ 正确顺序：先判断有哪些认知 Topic → 再分配所有 Block → 最后检查 Reachability
❌ 错误顺序：发现 orphan block → 创建一个 Topic 来装它
```

具体地：`O-13` **没有**被单独建成「状态组合」Topic，而是并进了 `T-04`；`O-11` 并进了 `T-05`。

4. **`O-01` 改由 `document.scope` 承担** —— 文档级入口是合法入口，不该为它造一个「文档定位」Topic。

### 4.3 修复后的 Topic 集合

| Topic | elements | blocks |
|---|---|---|
| **T-01 三级递进语义** | E-06, E-07, E-08, E-12 | O-02, O-07, O-08, O-09 |
| **T-02 生成链路与消费点** | E-01, E-02, E-03, E-04, E-05 | O-04, O-04b, O-04c |
| **T-03 消费的证据与判定** | E-03, E-08 | O-10, O-10b, O-16, O-14 |
| **T-04 两条链的边界与状态组合** | E-04, E-05, E-09, E-10 | O-05, O-06, O-11b, O-13 |
| **T-05 语义边界与非主张** | E-11 | O-03, O-10c, O-11, O-12, O-15 |

```text
入口统计: 21/21 block 有入口（Topic 20 + 文档级 1）
          87/87 条语义有可达路径 —— 完全无路径 = 0
```

**`T-05` 只有 1 个 element 却有 5 个 block** —— 这正是"Topic 不是元素容器"的具体体现。

---

## 5. 规格缺口与处置

| # | 缺口 | 处置 |
|---|---|---|
| **G1** | §7 不变量①（每个 Topic 至少一个元素）与"L0 是压缩"冲突 → 8 条语义无入口 | ✅ **已改规格**：拆成 Framework / Navigation / Semantic 三种 coverage（§7 全节重写），加入 Semantic Reachability |
| **G2** | §5.3 判据 B 与 §6.4 口径冲突（侧挂不算 edge → 侧挂元素永不满足 B） | ✅ **已改规格**：判据 B 改为"至少参与一条重要的 **edge 或 attachment** 关系" |
| **G3** | §3.3 写"process 与 artifact 交替"，但本篇 E-01→E-02 是连续两个 artifact | ✅ **已改规格**：改为"允许同类型元素连续出现，只要中间关系有独立设计意义" |
| **G4** | 六类里 `component` 本篇为 0 | ✅ **已改规格**：明确"六类是 allowed vocabulary，不是必须凑齐的 checklist"；Feature 06 的 validator 只查 `type ∈ 词表` |
| **G5** | topic 标签不可继承"按 block 划分"的旧集合 | ✅ **已改规格**：§10.1 写入"Topic 必须按当前认知模型重新推导"，并给出正确/错误推导顺序 |

---

## 6. 本轮最大的架构产出：三种 coverage 必须分开

```text
A. Framework Coverage     L0 图有没有表达出主要机制？        不要求所有语义都进图
B. Navigation Coverage    所有值得保留的内容是否都有入口？     ← 最容易失败的一种（本次就是它）
C. Semantic Coverage      进入 L2 后，原文语义有没有被表达？  既有 Stage 1/2 负责
```

```text
Framework Coverage  ≠  Navigation Coverage  ≠  Semantic Coverage
```

**以后 validator 必须分别检查，绝不能再用一个 "coverage = 100%" 混起来。**（已写入 03 §7，并规定 `check-map` 负责 A + B、`check-overview` 负责 C。）

---

## 7. 交付物与自查摘要

```text
drafts/context-consumption.map.json     mapVersion 2：12 元素 / 4 边 / 7 侧挂 / 5 topics
drafts/l0-preview.html                  一屏两区静态页（31.8 KB：42 条原文语句 + 20 条 L2 深链）
drafts/build-l0-preview.js              一次性构建脚本（交付物清单外，见 D6）
results/verification-output.txt         Framework + Navigation invariant 自查
results/structural-reachability.txt     结构可达性脚本输出
results/structural-reachability.md      结构可达性说明与结论
results/track-a-worksheet.md            **人工** Track A 六项指标（待执行）
results/phase1-notes.md                 本文件
```

**自查（`verification-output.txt`）**

```text
Hard Error 0 · Warning 1（元素总数 12 = 硬闸门上限）
A. Framework Map invariant：F1 provenance ✓ · F2 容量 ✓ · F3 Topic 不强绑 element ✓
   受控词表 ✓（type/role/edge 全在词表内；未用兜底词）
   主轴只有 process/artifact ✓ · 判据 B ✓ · 判据 F ✓ · attachments 完整 ✓
B. Navigation invariant：N1 ✓ · N2 ✓（21/21 block 有入口）· N3 ✓（87/87 可达，无路径 = 0）
C. Semantic Coverage 由 check-overview 负责，本脚本不重复判定
```

**渲染验证（Electron 真实加载并断言 DOM）**

```text
PASS  已渲染文档标题 · 12 个元素卡片 · 5 个 topic 导航 · 文档级入口（scope / 非目标）
PASS  主轴 edge 标签（depends-on, consumes, produces）· 3 条 constraint 侧挂
PASS  点击元素 → L3 详情面板打开，含原文 sourceUnit 语句 · 无渲染器控制台错误
```

---

## 8. 状态

- **Task 1.1 ~ 1.4**：完成
- **Task 1.5**：自动化（Structural Reachability）完成；**人工 Track A 待执行**（`track-a-worksheet.md`）
- **Feature 04 判定**：**TECHNICAL PASS / UX VALIDATION PENDING**
- 未完成人工 Track A 之前，**不得宣布交互假设已验证**
