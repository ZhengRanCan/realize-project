# Track A worksheet（人工测量 · 待执行）

> Feature 04 · Task 1.5 的**人工部分**
> 自动化结构检查见 `structural-reachability.md` —— **那不是 Track A 的胜负指标**。

---

## 0. 这项测量要回答什么

> **交互假设**：分层下钻 + L0 机制图 + Topic 导航，是否真的比"四段阅读流 + 21 个 block 长列表"更容易理解？

**对照**

```text
baseline  = experiments/stage2-full/overview-preview.html   （四段阅读流 + 21 blocks）
candidate = docs/features/04-l0-framework-map/drafts/l0-preview.html （L0 框架图 + topic 导航）
```

---

## 1. 六项指标

| # | 指标 | 真正回答什么 | 怎么记 |
|---|---|---|---|
| M1 | **找到答案耗时** | 导航是不是更有效 | 逐题掐表（秒） |
| M2 | **不打开原 Markdown 的答题正确率** | Map 是否真的帮助理解 | 逐题记对/错；**翻过原文的题单独标记** |
| M3 | 首屏同时出现的信息单元数 | 有没有降低认知负担 | 首屏能数出的独立信息单元个数 |
| M4 | 错误进入 Topic 的次数 | Topic 命名 / 结构是否清楚 | 进错 topic 后返回的次数 |
| M5 | 返回 / 重选次数 | 用户是否容易迷路 | 返回上一层 + 重选入口的总次数 |
| M6 | 主观负担 | 看完之后是不是仍然觉得累 | 两版各打一个 1~5 分 |

> **`Time to answer`（M1）比 hop count 有意义得多。**
> **M2 是本项目的硬指标** —— 它直接对应"不打开原 Markdown，仅通过 Visual Overview 能否较完整理解设计方案"。

---

## 2. 逐题记录表

**同一组题、两个版本各做一遍。** 建议交替顺序（先 baseline 做完 10 题，再 candidate；或反过来），并在同一时段内完成，避免状态差异。

| 题号 | 问题 | baseline 对/错 | baseline 秒 | baseline 翻原文 | candidate 对/错 | candidate 秒 | candidate 翻原文 |
|---|---|---|---|---|---|---|---|
| Q1 | Consumption 的最低证据是什么？ | | | | | | |
| Q2 | 哪些情况不能单独证明 Consumption？ | | | | | | |
| Q3 | Context-side 与 Output-side 的边界是什么？ | | | | | | |
| Q4 | 为什么消费点放在 Outline 而不是 Scene？ | | | | | | |
| Q5 | Receipt 与 Availability 的区别是什么？ | | | | | | |
| Q6 | 为什么不做第四级 Context Influence？ | | | | | | |
| Q7 | Consumption 的 Subject 是什么？ | | | | | | |
| Q8 | Consumption 是否要求最终输出明显不同？ | | | | | | |
| Q9 | 哪些代码路径只能算 Receipt / Availability？ | | | | | | |
| Q10 | 两条链共同支持的产品叙事是什么？ | | | | | | |
| | **合计** | __/10 | __ 秒 | __/10 | __/10 | __ 秒 | __/10 |

**答案要点与原文出处**见 `structural-reachability.md` §2 与 `phase1-notes.md`；判分以原文为准。

---

## 3. 必须单独报告的一项

```text
不打开原 Markdown 的答题正确率
  baseline : ___/10
  candidate: ___/10
```

---

## 4. 另外三项（M3 / M4 / M5）

| | baseline | candidate |
|---|---|---|
| M3 首屏信息单元数 | | |
| M4 错误进入 Topic 次数 | 不适用（无 Topic） | |
| M5 返回 / 重选次数 | | |

---

## 5. 两个主观问题（M6）

1. **迷路感**：在 candidate 上，你是否**知道下一步该点哪里**？
2. **缺失感**：在 candidate 上，你是否觉得"**少了什么，但不知道少了什么**"？

> 第 2 问专门用来验证 Feature 04 发现的那类问题（语义区块没有入口）。修复前有 8 条语义无路径，修复后为 0 —— 但**结构上有路径不等于读者感觉得到**。

---

## 6. 判定口径

- 这不是"必须通过"的验收项，而是**交互假设的证据**。
- **结论为"没有更好"也要如实记录**，不要调参到好看为止。
- **Track A 的结论不能用来推断方法泛化** —— 那是 Feature 05（Track B）的事。
- 人工 Track A 未完成之前，Feature 04 的状态是 **TECHNICAL PASS / UX VALIDATION PENDING**，不得宣布交互假设已验证。
