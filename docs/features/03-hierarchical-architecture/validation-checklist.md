# Hierarchical Document Model — Validation Checklist

这是执行 agent 完成 Phase 1 / Phase 2 后，reviewer 需要逐项验证的清单。
规格见 `README.md`（§编号均指该文件），任务书见 `execution-prompt.md`。

---

## 1. Phase 1 验证（Context Consumption 手工框架图）

### ✅ Task 1.1 元素选择

**检查位置：**
- [ ] `drafts/context-consumption.map.json` 的 `elements[]`
- [ ] `results/phase1-notes.md` 的候选与淘汰记录
- [ ] `fixtures/context-consumption.overview-plan.json` 的 87 条 `sourceUnits`（用于核对溯源真伪）

**验证标准：**
- [ ] 元素总数 **≤ 12**（§5.3 判据 E）
- [ ] 每个元素都有 `id` / `label` / `type` / `role` / `topics` / `sourceUnitIds`
- [ ] 每个 `type` 都在六类里（`concept` / `component` / `process` / `artifact` / `state` / `constraint`），**没有第 7 类**
- [ ] 每个 `role` 都在 §5.2 的取值里
- [ ] **抽查 3 个元素的 `sourceUnitIds`**：逐个回到 `overview-plan.json` 找到该 unit，确认它的 `statement` 确实在讲这个元素（防编造溯源）
- [ ] `label` 是文档里的规范术语，不是自造措辞
- [ ] 淘汰记录里每一个被淘汰的候选都写明了依据 A / B / C / D 中的哪一条
- [ ] 产出中没有把六类元素写成"**已证明通用**"的措辞 —— 只能是"第一版候选词表，冻结扩张"（§5.1）

**特别检查（判据 F）：**
- [ ] 同一个概念没有出现两个节点（例如 `Frozen Context` 只出现一次）

### ✅ Task 1.2 主轴与侧挂

**检查位置：**
- [ ] `drafts/context-consumption.map.json` 的 `edges[]` / `attachments[]` / `thesis` / `topics[]`

**验证标准：**
- [ ] 每条 edge 的 `type` 都在 §6.1 的 8 个词内
- [ ] 每条 edge 的 `from` / `to` 都存在于 `elements[]`
- [ ] 每条 edge 都能读成一句通顺的主动句 "A v B"（§6.2）
- [ ] **没有出现 `consumed-by` / `drives` / `projected-to` 之类的表外词**（这是上一版真实踩过的坑）
- [ ] `relates-to` 兜底词使用次数 ≤ 1；若超过，判为词表设计失败，应回到 §6 重新设计而不是继续加词
- [ ] `concept` / `constraint` / 反例**没有**出现在 `edges[]` 里（它们只能走 `attachments[]`）
- [ ] 主轴上的元素只有 `process` 和 `artifact`
- [ ] `thesis` 是**可选**的：提供了就检查"是一句话、说的是机制而不是'本文分五章'"；**没提供不算问题**（原文若无明确中心命题，留空是正确的）
- [ ] 每个 topic 有 `title`（短标题）+ `proposition`（一句命题）

### ✅ Task 1.3 边界与反例

**检查位置：**
- [ ] `drafts/context-consumption.map.json` 中 `type: "constraint"` 的元素与相关 `attachments[]`
- [ ] 原文 §15 与 `overview-plan.json` 里的 33 条负向 unit

**验证标准：**
- [ ] 上图的 constraint 数量在 **3~5** 条之间
- [ ] 每条 constraint 都能通过判据 C（删掉它会破坏对架构的理解）
- [ ] 反例**没有**被建成独立节点，只作为侧挂批注（`role: "anti-pattern"`）
- [ ] 没有为了放反例而新增第 7 种元素类型
- [ ] 未上图的负向内容确实能在 L1 / L2 找到承载位置（不因为没上图而丢失）

### ✅ Task 1.4 覆盖不变量（§7 L0）

- [ ] ① 每个 Topic 至少被一个元素的 `topics` 引用
- [ ] ② 每个元素的 `topics` 非空
- [ ] ③ 每条 edge 的两个端点都在 `elements[]` 里
- [ ] ④ 元素总数 ≤ 12
- [ ] ⑤ 每个元素的 `sourceUnitIds` 非空

> 本次没有脚本，逐条人工核对；Phase 3 会把 ①~⑤ 全部写进 `check-map`。

### ✅ Task 1.5 Track A 测量

**方法（必须可判分，不能用"感觉更舒服"这类问卷）：**

1. **问题集**：由 reviewer 从参考文档出 **10 道有确定答案的问题**，覆盖四段阅读流各段。示例：
   - Consumption 的最低证据是什么？
   - 哪些情况不能单独证明 Consumption？
   - Context-side 与 Output-side 的边界是什么？
   - 为什么消费点放在 Outline 而不是 Scene？
2. **对照**：baseline = `experiments/stage2-full/overview-preview.html`；candidate = `drafts/l0-preview.html`
3. **记录三项**：正确率 / 定位耗时 / **是否翻开了原 Markdown**

**验证标准：**
- [ ] 10 道题在两个版本上都被问过（同一组题）
- [ ] `results/track-a-measurement.md` 记录了逐题结果，而不是只有总分
- [ ] 明确写出"不打开原 Markdown 的答题正确率"（这是本项目的硬指标）

> **注意**：Track A 只能证明 UX，**不能**用来证明方法泛化。泛化由 Phase 2 的 Track B 负责。

---

## 2. Phase 2 验证（跨文档类型 Gate）

### ✅ Task 2.1 Fixture 来源

- [ ] Fixture B（Data Model heavy）与 Fixture C（Process / Operational heavy）**由用户提供**
- [ ] 没有使用执行方自己编写的假文档代替
- [ ] 两篇文档的 `document.id` / `title` / `sourcePath` 已记录
- [ ] 两篇文档确实包含 §11.2 要求的要素（字段/嵌套 schema/lifecycle；queue/retry/timeout/failure recovery）

### ✅ Task 2.2 两张图的检查

- [ ] `drafts/fixture-b.map.json` 与 `drafts/fixture-c.map.json` 各自通过 **Task 1.1 ~ 1.4 的全部检查**
- [ ] 两张图各自的 `document.role` 正确
- [ ] 两张图的元素数各自 ≤ 12

### ✅ Task 2.3 三个关键疑问必须有明确回答（§11.1）

- [ ] **疑问 1：Data-heavy 文档画得出机制链吗？** 有明确结论 + 证据（要么给出实际的主轴，要么说明为什么画不出）
- [ ] **疑问 2：Process-heavy 的机制链与 topic 划分重合度如何？** 有明确结论（若几乎重合，要说明 L0 相对普通流程图还有没有增量价值）
- [ ] **疑问 3：三类文档的 L0 topology 是否完全不同？** 给出三类文档各自的拓扑类型，并**明确回答"Framework Map 是否必须存在单一主轴"**
- [ ] 回答里包含具体元素/边的例子，不是泛泛而谈
- [ ] 若某篇文档**没有**单一主轴，执行方如实记录而**没有硬凑**一条链 —— 这是加分项，不是缺陷

### ✅ Task 2.4 过拟合检查（§11.4）

- [ ] 三类文档产生了**各自不同**的结构
- [ ] Fixture B / C 上没有出现 `Consumption Evidence` / `Product Boundary` 这类 Fixture A 的结构
- [ ] 若出现，判定为 **overfitting**，Gate **不通过**

### ✅ Gate 结论

- [ ] 结论明确写成 `PASS` 或 `FAIL`
- [ ] 若是 `FAIL`，写清是哪条疑问导致的，以及需要修改 §3~§6 的哪一部分
- [ ] **若 FAIL，没有继续产出 schema / 校验器 / 生成 prompt**（这是红线）

---

## 3. 人工验证（五判据，§10.3）

针对 `topics[]` 的划分：

- [ ] **Coverage** —— 所有 core blocks 都有 topic 归属
- [ ] **Cohesion** —— 一个 topic 内部的 blocks 在回答同一个设计问题
- [ ] **Separation** —— 没有两个 topic 其实在讲同一件事
- [ ] **Abstraction** —— topic 不是 source section 标题的复刻（若近乎 1:1，标 `possible section mirroring` Warning）
- [ ] **Cognitive usefulness** —— 只看 topic 标题 + 核心问题 + 关系，能回答"这篇设计主要在解决什么"

**同时检查：**
- [ ] 没有把 topic 数量写死为 5
- [ ] 没有因为凑数量而硬拆/硬合并
- [ ] topic 数量落在 `2–10`（超出 10 或等于 1 时标 Warning，但不判 Fail）

---

## 4. 红线（任意一条命中即 REJECT）

```text
[ ] elements[].sourceUnitIds 有任何一个为空
[ ] edges[].type 出现表外词（consumed-by / drives / projected-to 等）
[ ] 出现第 7 种元素类型，或 §5.2 列出的那 12 种类型之一
[ ] 元素总数 > 12 且未说明理由
[ ] concept / constraint 被写成了 edge
[ ] 复用了旧的 21 个 block 作为 L2 内容
[ ] 改动了 app/renderer/* 、app/main/* 、schema/*
[ ] 改动了现有 11 个 shape 或 docs/shape-catalog.md
[ ] 写出并交付了产品化的 Stage 1a / 1b prompt
[ ] Phase 2 的 Fixture B / C 是执行方自己编的文档
[ ] Gate 为 FAIL 却继续往下做了契约
```

---

## 5. 最终判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | Phase 1 全部检查通过；Phase 2 Gate = PASS；三条红线均未命中 |
| **ACCEPT WITH NOTES** | Phase 1 通过；Gate = PASS，但存在需要记录的保留项（例如 `relates-to` 使用偏多、topic 数落在 Warning 区间） |
| **REJECT** | 命中任一红线；或 Gate = FAIL 却继续推进；或元素溯源经抽查不实 |

**reviewer 需要明确回一句：** `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`，并写出理由。

---

## 6. 已知的失败模式（供 reviewer 留意）

| 失败模式 | 症状 | 说明 |
|---|---|---|
| **术语漂移** | 图上出现文档里没有的词 | 会让跨进程对比失效 |
| **元素膨胀** | 元素数 15+ | 判据 C 没执行到位，图会重新变成信息过载 |
| **词表泄漏** | edge 用了表外词 | 上一版真实发生过（5 条边里 3 条越界） |
| **溯源编造** | `sourceUnitIds` 指向的 unit 与元素无关 | 抽查 3 个元素即可发现 |
| **流程图化** | Process-heavy 文档上图后与普通流程图无区别 | Phase 2 疑问 2 的核心风险 |
| **Fixture A 锚定** | B / C 上仍是 A 的结构 | overfitting，Gate 必须 FAIL |
| **拓扑过拟合** | 把"主轴 + 侧挂"当成 L0 的必要形态 | 第二类 overfitting：应从"5 个 Topic"的教训推广到布局（§3.3 / §11.5） |
| **候选词表被当成已证明通用** | 写出"L0 元素就是这 6 类"这类措辞 | 冻结扩张 ≠ 已证明通用（§5.1） |
| **UX 给泛化背书** | 用 Track A 的"更好用"证明方法成立 | 两件事必须分开结论 |
