# F08 · Track A 第一轮（人手阅读测试 · D + E）

> 状态：⬜ **待进行**（代码在本轮提交后**冻结**；本轮不再改 UI）
> 目的：让**真实阅读行为**决定下一刀切哪里 —— 不是"UI 好不好看"，而是"能不能靠 L0 回答问题"。
> 记录原则：**只记 5 个数据 + 1 句主观**，不做量表。

---

## 0. 冻结与准备

```text
代码状态   F08 Phase 3/4 第一版 + Electron 集成 selftest 通过后冻结
启动       npm start
加载      首屏 →「打开 framework-map.json」
  D 用    experiments/semantic-grounding/fixture-d/run-04/framework-map.json
  E 用    experiments/semantic-grounding/fixture-e/run-08/framework-map.json
默认视图   Reading（Review 需要手动切）
手工 smoke（自动化刻意不做）：原生文件选择器、Source 面板的完整阅读
```

---

## 1. D · 测 **reviewability**（预期不是"用户成功找到答案"）

> **问题：Task 是否存在任务间依赖？依赖满足条件是什么？**

**已知背景（不要告诉被试者）：** 当前 F10 的 D map **缺** `Task --depends-on--> Task` 这条基础关系
（F10 已判定为 E3 Encoding Distortion；其不变量被吸收进 `C-PlanStructureAndState`）。

**要观察的正是"缺陷能否被发现"：**

| # | 观察点 | 记录 |
|---|---|---|
| 1 | 用户**多久**发现图里没有这条基础关系 | |
| 2 | UI 有没有**误导**用户以为 constraint 就等于 dependency | |
| 3 | 能否从 provenance / Topic 下钻后确认**原文确实有**这层语义 | |
| 4 | 能否明确判断这是**生成物缺陷**，而不是"我不会用 UI" | |

**判定参考：** 若用户能自己说出"图上没有这条边，但原文有 —— 是图的问题"，
说明 UI 的 **reviewability 成立**（哪怕生成物是错的）。

---

## 2. E · 测 **readability**（理想情况不需要打开原 Markdown）

> **问题：连续查单失败多少次进入什么状态？之后如何人工介入？谁有权限？**

**理想路径（应能沿 L0 走完）：**

```text
bounded failure（连续 10 次失败上限）
  → REFUND_FAILED（进入什么状态）
  → force compensation（人工如何介入）
  → admin boundary（谁有权限）
```

**判定参考：** 四条都能在**不打开原 Markdown** 的情况下定位到，即 readability 成立。

---

## 3. 每条只需记 5 个数据 + 1 句主观

| 数据 | D | E | 说明 |
|---|---|---|---|
| **Time to answer** | | | 从"看到问题"到"给出答案"的时间 |
| **Answer correctness** | | | 对 / 部分对 / 错（附一句说明） |
| **Wrong topic entries** | | | 点进了不相关的 Topic 次数 |
| **Backtracks / reselections** | | | 回退、重新选择的次数 |
| **Opened original Markdown?** | | | yes / no |
| **最难找的是什么？**（一句） | | | 主观 |

可选补充（有空再记，不强制）：误以为 constraint = dependency 的次数；用了 Focused Relations 还是全局关系表。

---

## 4. 测完怎么判

```text
若 D 的缺陷能被发现、E 的四条路径能走完：
    → L0 信息架构成立；下一刀切 **生成侧**（F10 未关闭项：D 的基础 relation resolution）

若 E 走不完（例如 bounded failure 找不到）：
    → 先切 **UI/内容承载**（constraint 的表达面 —— 对应已登记的 Constraint Composition / Compression Gap）

若两者都卡在"不知道点哪里"：
    → 切 **导航/入口**（Topic Navigation 与核心结构的关系需要重新设计）

若用户反复去开原 Markdown：
    → L0 的**自足性**不足，优先补 provenance → 原文的跳转体验（而不是继续加图形）
```

> **不要在 Track A 之前继续"把 UI 做得更漂亮"。** 现在需要的是真实阅读行为给出的信号。
