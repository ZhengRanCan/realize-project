# L0 Framework Map — Validation Checklist

执行 agent 完成 Feature 04 后，reviewer 逐项验证的清单。
规格见 `docs/features/03-hierarchical-architecture/README.md`（§编号均指该文件）。

> **判定口径**：人工 Track A（§5.2）未完成之前，本 feature 只能是
> **TECHNICAL PASS / UX VALIDATION PENDING** —— 不得宣布交互假设已验证。

---

## 1. Task 1.1 元素选择

**检查位置：**
- [ ] `drafts/context-consumption.map.json` 的 `elements[]`
- [ ] `results/phase1-notes.md` 的候选与淘汰记录
- [ ] `fixtures/context-consumption.overview-plan.json` 的 87 条 `sourceUnits`（核对溯源真伪）

**验证标准：**
- [ ] 元素总数 **≤ 12**（§5.3 判据 E）
- [ ] 每个元素都有 `id` / `label` / `type` / `role` / `topics` / `sourceUnitIds`
- [ ] 每个 `type` 都在允许词表内（`concept` / `component` / `process` / `artifact` / `state` / `constraint`）
- [ ] **不检查"六类都必须出现"** —— 本篇 `component = 0` 完全正常（§5.1）
- [ ] 每个 `role` 都在受控取值内（含 `semantic-level`）
- [ ] **抽查 3 个元素的 `sourceUnitIds`**：回到 `overview-plan.json` 确认该 unit 的 `statement` 确实在讲这个元素（防编造溯源）
- [ ] `label` 是文档里的规范术语，不是自造措辞
- [ ] 淘汰记录里每个候选都写明了依据 A / B / C / D 中的哪一条
- [ ] 产出中没有把六类元素写成"**已证明通用**"的措辞（只能是"第一版候选词表，冻结扩张"，§5.1）

**concept vs state 判别（§5.4 的 regression case）：**
- [ ] `Context Receipt` / `Context Availability` / `Context Consumption` 是 **concept + role `semantic-level`**，不是 state
- [ ] 理由成立：三者**可以同时为真**；若把它们当 state，等于把三个可并存的 boolean 语义条件误当成互斥状态机

**判据 F 专查：**
- [ ] 同一概念没有出现两个节点（例如 `Frozen Context` 只出现一次）

## 2. Task 1.2 主轴与侧挂

**检查位置：**
- [ ] `drafts/context-consumption.map.json` 的 `edges[]` / `attachments[]` / `thesis` / `topics[]`
- [ ] `drafts/l0-preview.html` 的实际渲染

**验证标准：**
- [ ] 每条 edge 的 `type` 都在 §6.1 的 8 个词内
- [ ] 每条 edge 的 `from` / `to` 都存在于 `elements[]`
- [ ] 每条 edge 都能读成通顺的主动句 "A v B"（§6.2）
- [ ] **没有出现 `consumed-by` / `drives` / `projected-to` 之类的表外词**
- [ ] 未使用兜底词 `relates-to`（用了要说明理由）
- [ ] `concept` / `constraint` 没有出现在 `edges[]` 里（只能走 `attachments[]`）
- [ ] 主轴上的元素只有 `process` / `artifact`
- [ ] **不要求主轴"交替"**：允许同类型元素连续出现，只要中间关系有独立设计意义（§3.3）
- [ ] `thesis` 是**可选**的：提供了就检查"是一句话、说的是机制"；**没提供不算问题**
- [ ] 每个 topic 有 `title`（短标题）+ `proposition`（一句命题）+ `blockIds`
- [ ] **出图时没有硬凑主轴**

## 3. Task 1.3 边界与反例

- [ ] 上图的 constraint 数量在 **3~5** 条之间
- [ ] 每条 constraint 都能通过判据 C（删掉它会破坏对架构的理解）
- [ ] 反例**没有**被建成独立节点，只作为侧挂批注（`role: "anti-pattern"`）
- [ ] 没有为了放反例而新增第 7 种元素类型
- [ ] 未上图的负向内容确实能在 L1 / L2 找到承载位置

## 4. Task 1.4 三种 coverage 自查（**必须分开**）

### 4.1 Framework Map invariant（§7.1）

- [ ] **F1** 每个 L0 element 都有 provenance（`sourceUnitIds` 非空且指向真实 unit）
- [ ] **F2** 元素总数 ≤ 12
- [ ] **F3** 产出中**没有**"每个 Topic 必须有 element"这类要求或写法
- [ ] 受控词表：type / role / edge type 全部在词表内
- [ ] 判据 B（§5.3）：每个元素至少参与一条 **edge 或 attachment**（attachment 也算关系）
- [ ] 判据 F：label 唯一
- [ ] 所有非 process/artifact 元素都有 `attachments`

### 4.2 Navigation invariant（§7.2）

- [ ] **N1** 每个 Topic 至少关联一个 L0 element 或一个 L2 block
- [ ] **N2** 每个需要保留的 L2 block 至少能从一个 Topic 进入（**文档级入口除外**）
- [ ] **N3（Semantic Reachability）** 每条 Semantic Unit 都存在至少一条 `Document → Topic/L0 → L2` 的可达路径
      —— **目标：完全无路径 = 0**
- [ ] 文档级入口（`document.scope` / `document.nonGoalSummary`）的 `sourceUnitIds` 真实存在，且**没有**为它硬造一个 Topic
- [ ] 产出中**没有**出现"发现 orphan block → 新建一个 Topic 来装它"的痕迹（§10.1 的推导顺序）

### 4.3 Semantic Coverage（§7.3）

- [ ] 明确说明这一项由 `check-overview` 负责，**没有**在本 feature 里重复判定或与上面两项混成一个数字

## 5. Task 1.5 测量

### 5.1 Structural Reachability Test（自动化）

- [ ] `results/structural-reachability.txt` 存在且可复现
- [ ] 结论包含"完全无路径 = ?"这一项
- [ ] `results/structural-reachability.md` 明确写出**它不是 Track A 的胜负指标**
- [ ] 没有把 hop count 当成"candidate 输给 baseline"的证据

### 5.2 人工 Track A（worksheet）

- [ ] `results/track-a-worksheet.md` 存在，且包含六项指标（M1~M6）
- [ ] 包含硬指标"**不打开原 Markdown 的答题正确率**"
- [ ] 若 reviewer 已执行：逐题结果已填，且**结论如实**（"没有更好"也要记录）
- [ ] 若未执行：**判定必须写成 `TECHNICAL PASS / UX VALIDATION PENDING`**，不得写 PASS

### 5.3 静态页渲染

- [ ] `drafts/l0-preview.html` 被真实加载验证过（不是只看文件存在）：机制图 + topic 导航 + 文档级入口 + 点击元素开 L3 都存在

---

## 6. 红线（任意一条命中即 REJECT）

```text
[ ] elements[].sourceUnitIds 有任何一个为空或指向不存在的 unit
[ ] edges[].type 出现表外词（consumed-by / drives / projected-to 等）
[ ] 出现第 7 种元素类型，或 §5.2 列出的那 12 种类型之一
[ ] 元素总数 > 12 且未说明理由
[ ] concept / constraint 被写成了 edge
[ ] 复用了旧的 21 个 block 作为 L2 内容（占位链接不算复用切法，但要在文档里说明）
[ ] 改动了 app/renderer/* 、app/main/* 、schema/*
[ ] 改动了现有 11 个 shape 或 docs/shape-catalog.md
[ ] 写出并交付了产品化的 Stage 1a / 1b prompt
[ ] 用 Structural Reachability 的跳数推断"交互体验更好/更差"
[ ] 存在"完全无路径"的语义却仍判 PASS
[ ] 为了补 orphan block 机械新建 Topic（§10.1 的错误顺序）
[ ] 把六类元素写成"必须凑齐"
```

---

## 7. 最终判定

| 判定 | 条件 |
|---|---|
| **TECHNICAL PASS / UX VALIDATION PENDING** | 结构检查全通过、红线未命中，但人工 Track A 未执行 —— **这是当前状态的正确写法** |
| **ACCEPT** | 结构检查全通过 + 人工 Track A 已执行且有结论 + 红线未命中 |
| **ACCEPT WITH NOTES** | 同上，但存在需记录的保留项（例如元素数贴着上限、constraint 取了上限） |
| **REJECT** | 命中任一红线；或元素溯源经抽查不实；或存在无路径语义却判通过 |

**reviewer 需要明确回一句：** `TECHNICAL PASS / UX VALIDATION PENDING`、`ACCEPT`、`ACCEPT WITH NOTES` 或 `REJECT`，并写出理由。

---

## 8. 已知失败模式

| 失败模式 | 症状 | 说明 |
|---|---|---|
| **绕开入口问题** | 有语义无路径，但拿"L0 是压缩"当解释 | L0 压缩指的是图，不是导航；§7.1 / §7.2 必须分开 |
| **coverage repair 造 Topic** | 每个 orphan block 配一个 Topic | §10.1：Topic 由语义内聚决定 |
| **术语漂移** | 图上出现文档里没有的词 | 会让跨进程对比失效 |
| **元素膨胀** | 元素数 15+ | 判据 C 没执行到位 |
| **词表泄漏** | edge 用了表外词 | 上一版真实发生过（5 条边里 3 条越界） |
| **溯源编造** | `sourceUnitIds` 指向的 unit 与元素无关 | 抽查 3 个元素即可发现 |
| **主轴硬凑** | 为了"像论文框架图"强行拉出一条链 | 第二类 overfitting（§3.3 / §11.5） |
| **hop count 当胜负** | 用 0 跳/1 跳比较两版认知体验 | 那是书翻页 vs 网站点击，与认知负担无关 |
| **UX 给泛化背书** | 用 Track A 的"更好用"证明方法成立 | 两件事必须分开结论 |
