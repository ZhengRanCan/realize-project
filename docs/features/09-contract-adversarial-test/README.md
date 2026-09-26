# Feature 09: Contract Adversarial Test（Phase 2b）

> **位置**：流程上位于 **Feature 06 之后、Feature 07 之前**。
> `09` 只是创建顺序编号，不代表它排在 07 / 08 之后。
> **Feature 07（生成链路）在本 feature 通过之前不应开始。**

---

## 1. 这个 feature 只回答一个问题

> **F06 的 schema + check-map，面对两种此前没覆盖的技术文档，会不会误判、漏判，或者逼迫错误建模？**

它**不是**：

```text
❌ 继续设计 Feature 03
❌ 开始 AI 自动生成
❌ 验证 AI generation quality
```

范围刻意收得很窄。**先冻结"怎么攻击 F06、什么结果算 Contract 有问题"，再去挑文档** —— 否则容易变成"根据 fixture 改考题"。

---

## 2. 四个观察类别

| # | 类别 | 判据 | 出现什么才算问题 |
|---|---|---|---|
| 1 | **Semantic gap** | 六类 element 里**真的**装不下的东西 | 需要第 7 类才表达得了（**先用 §11.1.1 的决策树分类，不要直接扩 ontology**） |
| 2 | **Relation gap** | 8 个 relation 是否**继续大量**产生无法准确表达的关系 | `relationGap` 数量显著高于 A/B/C（3 篇合计 3 处）；或出现多条同类重复缺口 |
| 3 | **Capacity gap** | 12 的 preferred budget 在 ER-heavy / runbook 上是否明显不合理 | 在**没有硬塞**的前提下远超 12；或为压到 12 而必须牺牲决定性内容 |
| 4 | **Validator FP / FN** | 正确图是否被判错；明显错误的图是否反而通过 | Hard Error 误报（正确图被拦）；或 mutation 未被拦住（见 §5） |

### topology 单独观察

```text
可以记录：D / E 各自的实际拓扑（链 / 分叉 / 网状 / 星形 / 无主轴）
但不能：把 topology mismatch 自动升级成 contract failure
```

理由：R8 已经确认拓扑随文档类型变化；"长得不像主轴"本身不是缺陷。

---

## 3. Fixture D / E 选择标准（**先冻结，再去挑**）

### 3.1 Fixture D —— 真正的 ER-heavy

**必须至少具有：**

- [ ] 多个**核心实体**（不是"一个对象一堆字段"）
- [ ] 实体间 **1:1 / 1:N / N:M** 三种关系至少各出现一次
- [ ] 字段 / 属性较多
- [ ] **ownership / reference** 语义
- [ ] 至少一种 **lifecycle**
- [ ] **schema evolution / migration**
- [ ] 至少一个**跨实体的 invariant**

**排除条件（重要）：**

- ❌ **不要**再选一篇"数据变换流水线"（Fixture B 已经是，那是本次最大的选型局限）
- ✅ 最好**没有天然的单一处理主轴**

**它要攻击：**

```text
framework-map 会不会被错误地逼成 flow？
artifact / component / concept 是否够用？
relation vocabulary 对实体关系（1:N、N:M、ownership、reference）是否够用？
12 个元素是否太少？
```

### 3.2 Fixture E —— 纯 Operational Runbook

**尽量接近"操作手册"本身，而不是"系统设计里附带 retry"：**

- [ ] incident / operation **trigger**
- [ ] **preconditions**
- [ ] step-by-step **actions**
- [ ] **branching**
- [ ] **retry**
- [ ] **timeout**
- [ ] **rollback**
- [ ] **escalation**
- [ ] **observability**
- [ ] **completion criteria**
- [ ] operator **decision points**

**最好同时包含：**

- [ ] 正常路径
- [ ] 异常路径
- [ ] 人工介入路径

**它要攻击：**

```text
process / state / constraint 的边界
分叉 topology
attachment（runbook 里大量步骤该不该上图？）
Topic Navigation 是否仍然必要
```

### 3.3 挑选纪律

- 两篇**都必须由用户提供**，执行方不得自行编写
- 选定后先把**选择依据逐条对照 §3.1 / §3.2 打勾**，再开始建模
- 若某条硬要求找不到文档满足，**记录缺口**，不要降低标准去凑

---

## 4. 执行流程

```text
Fixture D / E 原文
      ↓
执行代理依据现行 F03 / F06 Contract 生成 candidate map JSON
      ↓
framework-map.schema.json
      ↓
scripts/check-map.js
      ↓
人工审计 validator 的判断是否合理
```

**关于 candidate map 的定位（必须说清楚）：**

- 它**不是 Gold**，**不要求画得漂亮**
- 它**只是用于攻击 Contract 的被测对象**
- 它**不是**"AI prompt → 自动生成 framework-map"的验证 —— 那属于 Feature 07
- 因此本 feature **不得**顺带评价"AI 生成质量"

D / E 仍然沿用 B / C 的 provisional 粒度：**`section (provisional)`**，并且**不得**与 A 的 sourceUnit 粒度混算。

---

## 5. Mutation / Adversarial 环节

现在 A / B / C 只证明了**正确产物没有被大量误报**。本 feature 还要证明：**错误产物确实会被拦住。**

对每篇的**正确 candidate map** 之外，再人工构造 mutation：

| # | Mutation | 期望 severity | 期望 code |
|---|---|---|---|
| M1 | 删除某个 element 的 provenance | **HARD** | H2 |
| M2 | 把某个 element 的 type 改成第 7 类 | **HARD** | H1 |
| M3 | 把某条 edge 的 relation 改成表外词 | **HARD** | H4 |
| M4 | 制造 dangling reference（edge 端点 / attachment 目标 / topic 的 blockId） | **HARD** | H3 |
| M5 | 塞一个既无 edge 也无 attachment 的孤立 element | **HARD** | H7 |
| M6 | 删除某个 Topic 的导航入口（blockIds / sectionRefs 清空） | **HARD** | H5 N1（或 N2 若因此产生 orphan） |
| M7 | 把两个**没有依赖关系**的节点强行串起来 | **不是** validator 能判的 | 见下 |

**M7 的特殊处理：** "强行串链"是**语义错误**，schema 与 check-map **判不出来**（拓扑本身合法）。因此：

```text
M7 不作为 validator 的测试项
M7 作为「人工审计项」：检查审计者能否仅凭 map + 原文发现这条错误的链
```

> 这条正好对应 `docs/framework-map-contract.md` §6 —— **契约里写明它属于 semantic rule，不是 schema rule。**

**每篇 mutation 数量建议 5~7 个，覆盖上表；记录实际 severity 与期望是否一致。**

---

## 6. Gate

**Gate 有三种形态，不是简单的 PASS / FAIL：**

```text
PASS         两篇 Fixture 都合格并完成对抗测试；四条通过条件全部满足
PARTIAL PASS Fixture E completed; ER-heavy contract coverage pending qualified Fixture D.
BLOCKED      没有可用的 Fixture（**当前状态**，见 results/fixture-selection-{d,e}.md）
```

**通过条件（四条同时成立）：**

```text
1. Semantic gap = 0（六类仍然够用；若不为 0，必须先按 §11.1.1 分类）
2. Relation gap 可控（没有出现大量同类重复缺口；relationGap 仍是"少量特例"）
3. Capacity 只是 heuristic 问题（没有出现"不硬塞就表达不了"的情况）
4. Validator 无明显误报 —— 正确图 HARD 0；mutation 全部被拦住
```

满足则：

> **Framework Map Contract 足够稳定，可以进入真正的 AI generation prompt / 自动化阶段（Feature 07）。**

**不满足时，分别处理（不要一律降级 validator）：**

| 现象 | 处理 |
|---|---|
| 正确图被判 HARD | 先怀疑 **validator 太死** → 修 validator（并补单元测试） |
| mutation 未被拦住 | **validator 太松** → 补检查 |
| 需要第 7 类才能表达 | 按 §11.1.1 分类：只有 Semantic gap 才谈扩 ontology |
| 12 明显不够（无硬塞） | 把 `preferred element budget` 的讨论正式提上日程（依据实测，不是猜） |

---

## 7. 对 F06 三个细节的既有裁决

| 项 | 裁决 | 说明 |
|---|---|---|
| **H7 孤立元素** | **保持 HARD** | 一个 L0 element 既没有 edge 也没有 attachment，它存在于 Framework Map 上的理由基本不成立。Phase 2b 若 ER-heavy 真出现**合法**孤立元素，再降级不迟 |
| **W4 单 Block Topic** | **保持 Warning**（本次作为**统计项**） | 已在 Fixture B 命中一次且明显合法（那是个"问题动机"Topic）。**若 D / E 又出现多个自然的 single-block Topic，则后续应改为 W4 → INFO**，但现在不提前改 |
| **W0 输出状态** | ✅ **已修正** | 原文小节解析失败时会跳过引用 / N2 / N3。原先只出 W0，`coverage` 会显示 `0/0`，容易被误读成"验证通过"。现在输出区分：<br>`状态: PASS` vs `状态: PASS WITH INCOMPLETE VALIDATION`，并列出 `SKIPPED` 段。Phase 2b 专门验证这一点 |

---

## 8. 明确不做

- ❌ 不继续设计 Feature 03（规格不再改；要改也只走 §11.1.1 的分类流程）
- ❌ 不开始 AI 自动生成，不评价生成质量
- ❌ 不新增第 7 类 element、不新增 relation 词
- ❌ 不把 `12` 写成 `maxItems`
- ❌ 不因为 topology 与预期不同就判 contract failure
- ❌ 不修改 Fixture D / E 原文的任何字节
- ❌ 不把 section 粒度与 sourceUnit 粒度混算
- ❌ 不为了让 mutation 通过而降低 schema / validator 的严格度

## 9. 状态

- **创建时间**：2026-09-26
- **前置**：F06 完成（schema + check-map + 21 个单元测试可用）
- **配套文档**：`execution-prompt.md` · `validation-checklist.md`

### Task 1（资格审查）：已完成 —— **两篇均为 NO QUALIFIED FIXTURE**

```text
D  6/7   缺 N:M        → results/fixture-selection-d.md
         近失候选保留为 Fixture D-near-miss / ER-lite candidate（tempo 那份），不替代 D
E  10/11 缺 timeout    → results/fixture-selection-e.md
         近失候选 F13-F16-runbook.md（10/11 + 3/3 路径）
```

判定一律按**冻结标准**：全部强制条件 PASS 才入选。**没有为了让实验跑起来而降标准。**

**当前 Gate：`BLOCKED — no qualified fixture`**
（不是 `PARTIAL PASS` —— 那要求 Fixture E 完成。）

### 继续的两条路径

1. 由用户**外部提供** D / E 文档（按 §3 标准挑，逐条打勾）
2. 由用户明确授权**修订 §3.1 / §3.2 的某条标准**
   → 按"**记录为标准修订 + 在同一批候选上重跑完整流程**"处理，**不沿用本次结论**

### 留到下一轮（Phase 2c / Feature 09 v2）再讨论的标准问题

前者是**结论**，不是"本次改标准的理由"。

- **N:M 到底是不是要点？** 真正想攻击的可能是「**多平级实体 + 多方向关系 + ownership/reference + 生命周期 + 跨实体 invariant + 没有天然 processing pipeline**」——即"**Framework Map 会不会又被错误地画成一条链？**"
- **`timeout` 是否应作为 E 的强制项？** 若 E 的使命是打 `process / state / constraint` 的边界与**升级路径**，真正必要的是"**有界等待 → 升级**"这条链，而不是孤立的 timeout 字段。

### 本轮方法学案例（建议长期保留）

> **Selection criteria can fail because the corpus does not contain the phenomenon being tested.**
> This is not evidence that the criterion is wrong,
> and it is not permission to relax the criterion post hoc.

两次独立实例：`D` 在 1262 篇中含 N:M 类记号的文档 = 0；`E` 在 3666 篇中同时满足 11 要素的文档 = 0。
