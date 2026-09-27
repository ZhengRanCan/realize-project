# F08 · Track A 第一轮（人手阅读测试 · D + E）

> 状态：⬜ **待进行**（正式计时的人在 Phase 4.1 之后跑）
> **Round 0（定性第一印象）已完成 → 见 §0.1**，它直接触发了一次小改版（Phase 4.1）。
> 目的：让**真实阅读行为**决定下一刀切哪里 —— 不是"UI 好不好看"，而是"能不能靠 L0 回答问题"。
> 记录原则：**只记 5 个数据 + 1 句主观**，不做量表。

---

## 0.1 Round 0 · First-impression observation（已完成 · 用户本人）

第一次打开真实界面（Reading View）后，用户给出的三条感受：

```text
Finding 1（核心）
  核心结构以 card 集合呈现，关系不可一眼感知；
  用户需要自行从卡片内的关系文字重建架构。
  → 原文：「一股脑地给出好几个 block，但没有讲明他们之间的关系是什么，
           我不能第一时间就看清楚当前文档的架构。」

Finding 2
  process / artifact 等 ontology metadata 对普通阅读者认知帮助低，并增加理解成本。
  → 原文：「给出了一个 process、artifact 什么的，感觉表示起来也不够直接。」

Finding 3
  machine ID 与标题竞争空间，产生 `E-UserProfile` 这种不自然换行，降低可读性。
  → 原文：「E-UserProfile 这种，会把标题过长的移动到下一行去」。
```

**判定**：`Navigation / visual hierarchy redesign required before timed Track A.`

**不违反"不要在人测前打磨 UI"**：这不是"没测就改"，而是**已经做了人测** ——
第一位真实使用者给出了明确的行为反馈（"第一眼看不懂架构"）。继续用已知有问题的版本计时，信息增益很低。

**对应动作（Phase 4.1 · Relationship-first Reading View）**：

| Finding | 动作 |
|---|---|
| 1 关系不可一眼感知 | Reading 改成 node-edge 图：节点 = element，线 = edge（箭头画在节点之间） |
| 2 ontology metadata 抢认知 | Reading 隐藏 type / role / 机器 ID；只留切开的短标题 + 副标题（`◇▶⚑` 只做极轻的角标） |
| 3 机器 ID 与标题冲突 | Reading 不显示 ID；标题按最先出现的分隔符切开（`UserProfile` ／ `跨目标用户上下文…`） |
| （用户第 6 条）约束抢重量 | 约束降级为宿主节点上的 `⚑ N constraints` 角标，展开才列出 |

> 关键结论（用户的话）：**当前界面把 Framework Map 的数据完整展示出来了，
> 却没有把 Framework Map 的"关系结构"作为主视觉展示出来。**
> 所以这一刀切的是 Reading 的主视觉，而不是继续加图形或修样式。

### Round 0 → Round 0.5 · UI polish（做完即冻结 UI）

用户在看过 Phase 4.1 之后确认：**"已经不是信息架构还不对，而是进入纯 UI polish 阶段了"**——
新版与上一版是质变（D 的 13 element / 12 edge 直接成为 node-edge 图），所以**不再改结构设计**，
只做四件小事，然后冻结 UI、正式跑 Track A：

```text
① 顶部设计原则 → ⓘ 如何阅读这张图（默认折叠）；第一屏：文档定位 → Framework Map
② Reading 关系词中文化（使用/产出/依赖/…），Contract 与 Review 保留原词
③ 标题 1 行 + 副标题 2 行 + hover 看全文；长列表压成"前两项 … 共 N 项"
④ ⚑ N 条约束 · 关联关系 / 来自 / 指向 / 约束 / 出处（Reading 专用）
```

冻结清单（不再动）：layout 算法 / Contract ontology / **不为"D 缺 Task 节点"补 UI 节点** /
constraint 不回到大卡片 / Topic 不重新展开 / 不加新交互。

> 用户对 D 的判断（直接进入 Track A 的理由）：
> **Task 没有独立节点、PlanBundle 只写着 `Plan + Stage[] + Task[]`、12 条 edge 里也没有 Task dependency ——
> 这正是生成侧缺陷。UI 应该诚实地让它看起来就是缺了一块，而不是帮生成模型修答案。**

---

### 这一轮顺带暴露的三个实现问题（都不是"样式问题"）

```text
① 打开按钮静默失败（真实入口调了不存在的 enterReview()）→ selftest 全绿但按钮没用
   根因：selftest 手抄了一遍状态切换，通过的是副本。→ loadL0(path) 成为唯一入口。
② 静态预览从未加载 renderer（bindInteractions 直接抛错）→ 断言只检查了那行文字。
   → 预览真的引 layout.js + map.js，断言盯脚本顺序。
③ 布局丢元素（约束挂到另一个约束上时消失）→ 定点检查后升为节点，宁可多一个虚线节点。
```

---

## 0. 冻结与准备

```text
代码状态   Phase 4.1（Relationship-first Reading View）之后的版本
启动       npm start
加载      首屏 →「打开 framework-map.json」
  D 用    experiments/semantic-grounding/fixture-d/run-04/framework-map.json
  E 用    experiments/semantic-grounding/fixture-e/run-08/framework-map.json
默认视图   Reading（= 关系图；工程明细切 Review View）
不开 GUI 先自查：npm run l0:layout   # 用文字打印层 / 线 / 角标
手工 smoke（自动化刻意不做）：原生文件选择器、Source 面板的完整阅读

> **2026-09-27 手工 smoke 记录（Track A 前置）**：第一次点「打开 framework-map.json」时，
> 信息行显示"已加载"但**界面完全没有变化** —— 真实入口调了一个不存在的 `enterReview()` 并静默抛错。
> 已修（`loadL0(path)` 成为唯一入口，含真实切屏），selftest 补了「真的切屏了」与「无 model 导航守卫」
> 两条断言。**这是 Track A 之前必须修完的阻断项，不是 UI 打磨。**
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
