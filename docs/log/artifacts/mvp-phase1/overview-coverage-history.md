# Overview 覆盖检查 —— 历史状态归档

> **历史材料（Historical artifact）—— 非规范。**
>
> 本文件保存 `docs/specs/overview-coverage.md` 在重构前混在正文里的**当时状态**：
> 覆盖率快照、逐区块覆盖表、执行时间线、audit 输出、block inventory 演化。
>
> **现行的 Overview 覆盖标准见 [`docs/specs/overview-coverage.md`](../../../specs/overview-coverage.md)。**
> 本文件用来说明"当时做到哪、为什么那样做"，不代表当前状态。

---

## 1. 当时的覆盖表（20 个区块的设计时状态）

图例（当时口径）：

- 覆盖状态 **✅** = 当时的 fixture / Overview 已能承载（仍待按新形状改造）
- **⚠️** = 已抽取但只在 decisions / 其它页，Overview 没有承载
- **❌** = 当时完全没有抽取，需要新增
- 默认 **展开/折叠** = 首次进入 Overview 时是否展开

### 甲 · 这是什么

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-01 | §头, §1, §6, §15 | 本文只讨论 Context Consumption 的**产品语义层级**；不是 Feature 合同、架构 SSOT、最终 schema、实现授权 | 一句主张 + 标签带（`语义层级` `非实现授权`）。**不放进折叠区** | 展开 | ⚠️（现在只在 DEC-012 与来源行） |
| O-02 | §1 | **主张**：保留三级递进 Receipt → Availability → Consumption，并列出一句话定义 | 核心定义卡（三行） | 展开 | ✅ |
| O-03 | §1, §6 | **明确不采用**四级：`Receipt → Availability → Consumption → Influence`，原因是 Influence 含"可归因于"，进入甚至强于 Output Alignment | 与 O-02 同框的**"不采用"对照条**（图上打 ✗） | 展开 | ⚠️（现有主图上有 ✗ 节点，但无理由） |
| O-04 | §9, §10, §13, §14 | **系统骨架（内部拆三种承载形式，不删内容）**：**(a) 主运行链图** —— outline 链路：freeze/resolve → generation projection → outline planner/prompt → Outline Generation Attempt → outline revision/持久化；**(b) Current / Target 差异对照** —— 现状：scene-content route 恢复 outline 后**仍调用 `appendFormalTeachingPrompt()` 直接附加 formal context**；目标：消费点收敛到 outline generation，scene 只继承 outline 派生约束（附 7 项反面代价）；**(c) 小型职责矩阵** —— 三段生产职责映射表 + 两链代码职责分离 | **一个区块、三种形状**：主链图（展开）+ 差异对照（展开）+ 职责矩阵（折叠）。不塞进单张图 | 展开 | ❌（当时 FACTS 只有文字，无骨架图） |
| O-05 | §2, §3, §4 | Context-side chain 与 Output-side chain 并列，互不吞并；**四条职责边界** | 辅助图（两条链关系）+ 四行边界小卡 | 展开 | ✅（图上缺四条边界） |
| O-06 | §7 | 两条链共同支持 `Context-grounded generation narrative`。**不承诺反事实因果** | 一句话 + 引用块 | 展开 | ⚠️（辅助图有这个节点，但无解释） |

### 乙 · 它怎么跑

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-07 | §3, §4, §5 | **三级"能说明 / 不能说明"对照表**（全文地基） | **三栏对照表**（能 / 不能） | 展开 | ⚠️（散落在 DEC-004 折叠区） |
| O-08 | §5 | 消费对象清单与消费对象**不是** | 两栏对照表 | 折叠 | ⚠️（只在 DEC-007 折叠区） |

### 丙 · 怎么算发生了

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-09 | §5, §12 | Consumption 定义 + 递进关系式 + **不能单独证明 Consumption 的 7 项清单** | 定义 + 递进式 + ✗ 清单 | 展开 | ⚠️ |
| O-10 | §三, §四, §十二 | **HOW DO WE KNOW?**（见本文件 §2） | 独立图形（证据链 + 反例 + 最低充分条件） | 展开 | ❌ |
| O-11 | §5, §8 | **两种形状，不再混称"三个不要求"**：**(a) What Consumption does NOT require**；**(b) Possible mismatch states** | 两条并列卡 + 一个 2×2 状态组合小表 | 折叠 | ⚠️（前两条在 DEC-005/006，第二条组合在 DEC-003） |

### 丁 · 边界与反模式

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-12 | §6 | 为什么不把 Influence 作为第四级：`worked-example-first` 反例 | 反例 walkthrough（分步图 + 结论） | 折叠 | ⚠️（DEC-002 有文字） |
| O-13 | §11 | Consumption Subject = `Frozen Context × Outline Generation Attempt`；三分粒度 `Request` / `Attempt` / `Revision`；**outline 最终失败仍可能成立 Consumption** | 三段粒度条 + 两个"反直觉"标注 | 折叠 | ⚠️ |
| O-14 | §7, §8, §9, §11, §12, §13, §14, §15 | 边界集合（7 条内容，建议 2 个子区块）：**(a) 状态与边界**：① 5 种状态组合表 ② `Consumption ≠ Output Alignment` 与两种不一致 ③ 7 类"只能算 Receipt / Availability"的代码情况 ④ 8 种"有 Receipt 无 Availability"情形；**(b) 明确不做 / 不主张**：⑤ ~ ⑦（§15） | 六张形状：状态组合表 / 边界卡 / 反模式清单 / 不可用情形清单 / 非主张清单 / 非承诺清单 | 折叠 | ⚠️（部分在 GAP / Open Question，§15 几乎没进 Overview） |

---

## 2. 当时的关键区块 O-10 设计

这是当时新增的独立区块，回答"这套设计不仅定义三个名词，还规定怎样证明系统达到了某个状态"。

```text
HOW DO WE KNOW?                          Source: §5, §12, §三, §四

Receipt evidence        → 到达记录：lineage、传输/接收事实
        ↓
Availability evidence   → 合法性证据：schema / revision / digest / 引用范围 / 授权 / lineage 一致
        ↓
Consumption evidence    → generation-level：某次 Attempt 使用了哪个 Frozen Context
                                                与哪个 generation-facing projection

NOT sufficient on their own（写进 UI 的反例 —— 这些都不能单独证明 Consumption）
  ✗ context stored
  ✗ context field exists
  ✗ prompt contains context
  ✗ generation succeeded

Evidence target（最低证据方向 —— 不是已确定的 evidence 结构）
  Frozen Context  →  Projection  →  Generation Attempt  →  Consumption Evidence
```

原文只确定了「**最低证据应以 generation-level 为主**」；原文**明确没有决定** Consumption evidence 的具体结构
（§15 首条即列为未决定项）。因此该区块内要显式标注：
**"evidence 的具体结构仍是未决项（Q-002）"**，并链到该 Open Question。

对应的两条反直觉判断（必须在同一区块里显式写出）：

1. **成功生成 outline 不自动证明 Consumption** —— 如果 projection 没有成为真实生成输入，只能算 Receipt 或 Availability；
2. **最终生成失败仍可能成立 Consumption** —— 只要某一次实际 Attempt 已经合法使用了 generation-facing projection。

### 当时的逐区块 → Review Object 关联表

| 区块 | 必须能关联到的 Review Object |
|---|---|
| O-01 | DEC-012（不构成实现授权）、Semantic Model（范围声明） |
| O-02 / O-03 | DEC-001（三级）、DEC-002（不做第四级）、MODEL-001 |
| O-04 | DEC-007（消费点）、DEC-008（scene 收敛）、DEC-011（职责映射）、FACT-001 ~ FACT-005 |
| O-05 / O-06 | DEC-003（与 Alignment 边界）、MODEL-002 |
| O-07 | DEC-004（Receipt/Availability 判据） |
| O-08 | DEC-007、DEC-006 |
| O-09 / O-10 | DEC-005（判据不含可见差异）、DEC-010（7 类不得升级）、**Q-002（evidence 结构未决）** |
| O-11 | DEC-003、DEC-005、DEC-006 |
| O-12 | DEC-002 |
| O-13 | DEC-009（Subject 与 Attempt） |
| O-14 | GAP-001 ~ GAP-006、Q-001 ~ Q-010、DEC-003 / DEC-004 / DEC-010 / DEC-012 |

当时反查结果：

```text
全部 Decision: 12
覆盖表未承载的 Decision: 无
  DEC-001 -> O-02      DEC-002 -> O-03, O-12     DEC-003 -> O-05, O-06, O-11, O-14
  DEC-004 -> O-07, O-14  DEC-005 -> O-09, O-10, O-11  DEC-006 -> O-08, O-11
  DEC-007 -> O-04, O-08  DEC-008 -> O-04          DEC-009 -> O-13
  DEC-010 -> O-09, O-10, O-14  DEC-011 -> O-04    DEC-012 -> O-01, O-14
```

### 当时明确不做句级搬运的地方

| 原文位置 | 处理方式 |
|---|---|
| §1 与 §5「Receipt ≠ Availability ≠ Consumption」的多处重述 | 由 O-02 / O-07 的对照表一次性表达边界 |
| §8 与 §14 两次讲 Consumption / Alignment 分离 | 合并进 O-14②，代码分工进 O-04 |
| §6 中反复出现的水位论证 | 保留结论与反例，不保留不同措辞的重复论证 |
| §9 中对同一路由职责的两次描述 | 由 O-04 骨架图与职责映射表统一承载 |
| §12 的 7 类情况与 §15 的非主张清单 | 保留条目本身，不保留每条的展开式论证（论证留在对应 Decision 的 Full Rationale） |

---

## 3. 当时的覆盖率结论

| 项 | 数量 |
|---|---|
| 原文节数 | 21 |
| 覆盖表中列为必须保存的语义单元 | 20（O-01 ~ O-14，含 O-14 的 7 个子形状） |
| 当时 Overview 真正承载的 | **2**（O-02 核心定义、O-05 部分两条链） |
| 已抽取但只在 decisions / 其它页的 | 12 |
| 当时完全没有抽取的 | **2**（O-04 系统骨架、O-10 证明链） |
| 明确不做句级搬运的 | 5 处重复论证（语义已吸收） |

**当时指标：Overview 区块覆盖率 ≈ 10%（2 / 20）。**

O-04 与 O-10 各自的信息重量明显高于一个普通小区块（O-04 背靠原文约占 18.3% 的 §9 加 §10/§13/§14，
O-10 是全文最易误解的部分）—— 所以这个数字只能回答"还有多少块没做"，
不能推断"方案已经讲清楚了 10%"。

---

## 4. 当时的执行顺序与待拍板点

1. ~~覆盖检查~~ —— 已按反馈修订 5 处：① O-04 内部拆三种承载形式；② O-10 措辞收敛为 `Evidence target`，
   并新增"不许出现的措辞"约束表；③ O-11 拆成两类；④ §5 规则改为"可追溯到原文语义，并可关联 Review Object"；
   ⑤ 指标改名为"Overview 区块覆盖率"，并说明只按区块计数、不代表语义权重
2. ~~改数据~~ —— 已完成（见 §5）
3. **下一步：改 Overview 的 UI** —— **当时 UI 仍然未动**

| 问题 | 处理 |
|---|---|
| O-04 三种形状的默认展开 | 主链图展开；反面代价（O-04b）与职责矩阵（O-04c）折叠 —— 实施为 3 个独立区块 |
| O-14 是否过载 | **已拆**：O-13（5 种状态组合）、O-12（反例走查）、O-14（代码侧边界与反模式）、O-15（不决定 / 不承诺） |
| 主图与辅助图角色 | O-04 骨架图当时是 `flow` 数据（HTML 排版），`models` 里两张 Mermaid 图尚未重新定位 |

---

## 5. 数据层落地与 UI 时间线

覆盖表转成 `fixtures/context-consumption.json` 里的 `overview` 字段时，**UI 尚未改造**。

### 实际落地的 20 个区块

| 段 | 区块 | 承载形式 | 默认 |
|---|---|---|---|
| 甲 · 这是什么 | O-01 这是什么文档（ambient） | prose | 展开 |
| | O-02 核心主张：保留三级递进 | ladder | 展开 |
| | O-03 明确不采用第四级 | diff | 展开 |
| | O-04 系统骨架：现状 vs 目标 | flow（双 lane） | 展开 |
| | O-04b 为什么消费点不放 scene | checklist | 折叠 |
| | O-04c 三层级 → 生产职责映射 | matrix | 折叠 |
| 乙 · 它怎么跑 | O-05 两条链 | flow | 展开 |
| | O-06 两条链各自回答什么 | matrix | 展开 |
| | O-07 三级能说明 / 不能说明 | matrix | 展开 |
| | O-08 消费的对象是什么 / 不是什么 | matrix | 折叠 |
| 丙 · 怎么算发生了 | O-09 Consumption 定义与递进关系 | ladder | 展开 |
| | O-10 证据阶梯 | ladder | 展开 |
| | O-10b 这些都不能单独证明 Consumption（含 §12 七类） | checklist | 展开 |
| | O-10c 两个反直觉判断 | checklist | 展开 |
| | O-11 不要求什么（两类） | checklist | 折叠 |
| | O-11b Possible mismatch states | combo | 折叠 |
| 丁 · 边界与反模式 | O-13 5 种状态组合 | combo | 折叠 |
| | O-12 worked-example-first 反例 | steps | 折叠 |
| | O-14 代码侧边界与反模式 | checklist | 折叠 |
| | O-15 不决定的 9 项 / 不承诺的 5 项 | checklist | 折叠 |

合计 20 个区块：默认展开 11 / 折叠 9。
承载形式分布：`prose ×1 ladder ×3 diff ×1 flow ×2 checklist ×6 matrix ×4 combo ×2 steps ×1`。

**当时只有 2 张图**（O-04 系统骨架、O-05 两条链），其余 18 块用表格 / 对照 / 清单 / 阶梯 / 走查承载。

### 当时的一次 `npm run audit` 输出

```text
区块 20 个 | 承载形式：prose×1, ladder×3, diff×1, flow×2, checklist×6, matrix×4, combo×2, steps×1
默认展开 11 / 折叠 9

✓ 段落结构正确：what → how → prove → boundary
✓ 原文 15 节全部被至少一个区块引用
✓ 全部 12 条 Decision 都能被区块关联

结果：PASSED
```

### UI 时间线（同一份文档里曾并存两个时间点）

- 覆盖检查阶段：**UI 仍未动**；
- 后续阶段：**UI 已接入** —— 四段推进 + 20 个区块 + 左侧常驻目录 + 右侧原文回查面板；
  `Source` 数据来自 `docs/source-sections.json`。

`models` 已移除：两张 Mermaid 图的语义由 O-02（ladder）与 O-05（flow）承载，避免同一份语义有两处真相。

---

## 6. Stage 1 中间格式与 block inventory 演化

覆盖表 → `overview-plan.json` 的正式格式、形状词汇表与验收器：

| 产物 | 位置 |
|---|---|
| 中间格式 schema | `schema/overview-plan.schema.json` |
| 形状受控词汇表 | `docs/specs/shape-catalog.md` |
| Gold Fixture | `fixtures/context-consumption.overview-plan.json` |
| 验收器 | `scripts/check-plan.js`（`npm run check-plan`） |
| 验收器测试 | `scripts/test-check-plan.js`（`npm run test:plan`） |

**当时的 Gold Fixture 规模**：84 个 sourceUnit（core 75 / supporting 9）、21 个 block、7 组 `duplicatesMerged`。
（当前为 87 SU / 21 block，见 `reading-view-cognitive-contract-evidence.md` §2.2 / §2.6。）

### 回推时发现的真实缺口

把当时的 20 个区块反推成 sourceUnit 时，有 3 条语义原先在 Overview 里没有承载体：

| 缺口 | 原文位置 | 处理 |
|---|---|---|
| Consumption Subject = `Frozen Context × Outline Generation Attempt` | §11 | 新增 O-16（flow） |
| 最低证据应以 generation-level 为主 | §14 | 挂到 O-16 与 O-10 |
| 投影现状（`FormalGenerationContextProjection` 的具体内容） | §9 | 挂到 O-04 节点与 O-14 |

其余 7 条（§0 的两条边界声明、§3 的 Receipt 反例组、§4 的"有 Receipt 无 Availability"、§5 的分母说明、
§7 的叙事粒度）原先只存在于 fixture 的文字里、没有被登记为独立语义单元，后来都已登记并挂到对应区块。

**这说明覆盖表本身也有盲区** —— 只有把"逐句回推"做一遍，才发现有几条语义一直没有人负责。

### 当时的验收器判定结果（Gold Fixture）

```text
结果：PASS WITH WARNINGS

7 条 warning 全部是真实结构事实，不是误报：
  ! O-10b 覆盖 12 个 sourceUnit（阈值 8），已提供 capacityNote
  ! O-14 覆盖 9 个（阈值 8）
  ! §14 被拆成 5 个 block（阈值 4）
  ! §5 被拆成 6 个 block（阈值 4）
  ! 3 个 Gap 没有被任何 Overview Block 关联：GAP-002, GAP-003, GAP-006
  ! 5 个 OpenQuestion 没有被关联：Q-004, Q-005, Q-008, Q-009, Q-010
  ! plan 里有 1 个 block（O-16）尚未出现在 design-review.json 的 overview 中
```

最后一条尤其有价值：**O-16 是回推时发现的新缺口，当时只存在于 plan，尚未加入 design-review.json 的 overview**
（`npm run audit` 里的区块数仍是 20，plan 是 21）。这条 warning 的存在本身说明
**跨文件漂移是能被自动发现的**，而这正是 Stage 2 最需要防的。
