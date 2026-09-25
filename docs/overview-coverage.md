# Overview 覆盖检查（先做这一步，暂不改 UI）

样本：`测试文档/18-context-consumption-semantic-model.md`（540 行 / 约 12,224 字 / 21 节）
目的：在动手改 UI 之前，先确认 **没有重要语义会在可视化重述中消失**。

---

## 0. 验收规则（已确认）

```text
重要语义不得因可视化重述而丢失；
允许通过层级、折叠、视图切换降低同时出现的信息量。

验收标准 = 语义覆盖，不要求句子覆盖。
```

即：从 Overview 回到原文核对时，**不能发现某个重要概念、边界、例外、反例、Current/Target 差异或未决事项完全消失**。
但原文里反复从不同角度强调同一件事的段落（例如多处重述 `Receipt ≠ Availability ≠ Consumption`），只要求**该语义及其边界、例子、反例被完整保存**，不要求逐句出现。

配套自查口径：**如果某一节的可视化版本并不比读原文更好懂，那不算可视化成功**，只是换了排版。

---

## 1. 主阅读流（按方案逻辑，不按原文顺序）

原文的推进方式是「概念定义 → 代码映射」，但可视化重述需要先把「系统怎么跑」建立成空间/流程认知，再解释抽象语义。因此采用四段认知路径：

| 段 | 认知任务 | 对应区块 |
|---|---|---|
| **甲 · 这是什么** | 建立核心定义与系统骨架 | O-01 ~ O-04 |
| **乙 · 它怎么跑** | 运行状态与双链流转 | O-05 ~ O-08 |
| **丙 · 怎么算发生了** | 状态判定与边界隔离 | O-09 ~ O-11 |
| **丁 · 边界与反模式** | 明确不做什么、不主张什么 | O-12 ~ O-14 |

每个区块带 `Source: §…` 标签（悬停/点击可回原文核对），所以**不需要两套排序**。

---

## 2. 覆盖表

图例：
- 覆盖状态 **✅** = 当前 fixture/Overview 已能承载（但仍需按新形状改造）
- **⚠️** = 已抽取但只在 decisions/其它页，Overview 没有承载
- **❌** = 当前**完全没有**抽取，需要新增
- 默认 **展开/折叠** = 首次进入 Overview 时是否展开

### 甲 · 这是什么

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-01 | §头, §1, §6, §15 | 本文只讨论 Context Consumption 的**产品语义层级**；不是 Feature 合同、架构 SSOT、最终 schema、实现授权 | 一句主张 + 标签带（`语义层级` `非实现授权`）。**不放进折叠区** | 展开 | ⚠️（现在只在 DEC-012 与来源行） |
| O-02 | §1 | **主张**：保留三级递进 Receipt → Availability → Consumption，并列出一句话定义 | 核心定义卡（三行） | 展开 | ✅ |
| O-03 | §1, §6 | **明确不采用**四级：`Receipt → Availability → Consumption → Influence`，原因是 Influence 含"可归因于"，进入甚至强于 Output Alignment | 与 O-02 同框的**"不采用"对照条**（图上打 ✗） | 展开 | ⚠️（现有主图上有 ✗ 节点，但无理由） |
| O-04 | §9, §10, §13, §14 | **系统骨架（内部拆三种承载形式，不删内容）**：<br>**(a) 主运行链图** —— outline 链路：freeze/resolve → generation projection → outline planner/prompt → Outline Generation Attempt → outline revision/持久化<br>**(b) Current / Target 差异对照** —— 现状：scene-content route 恢复 outline 后**仍调用 `appendFormalTeachingPrompt()` 直接附加 formal context**；目标：消费点收敛到 outline generation，scene 只继承 outline 派生约束（附 7 项反面代价：重复解释、revision 混用、scene 覆盖 outline 整体设计、learner/context 重复进 Prompt、token 成本、realized alignment 难以归因）<br>**(c) 小型职责矩阵** —— 三段生产职责映射表（Receipt / Availability / Consumption × 生产职责 × 概念入口 × 成功边界）+ 两链代码职责分离（Consumption 改造 generation-session / route / orchestration / lineage vs Alignment 新增 preflight / realization assessment 等） | **一个区块、三种形状**：主链图（展开）+ 差异对照（展开）+ 职责矩阵（折叠）。不塞进单张图 | 展开 | ❌（当前 FACTS 只有文字，无骨架图） |
| O-05 | §2, §3, §4 | Context-side chain 与 Output-side chain 并列，互不吞并；**四条职责边界**：Consumption 只证明冻结语义到场并被用；Alignment 只证明最终课程体现"结果"面；Receipt 只证明到达；Availability 只证明合法冻结可用 | 辅助图（两条链关系）+ 四行边界小卡 | 展开 | ✅（图上缺四条边界） |
| O-06 | §7 | 两条链共同支持 `Context-grounded generation narrative`：本次生成确实消费了冻结语义，同时最终课程在可观察意义上体现了相关教学要求。**不承诺反事实因果** | 一句话 + 引用块 | 展开 | ⚠️（辅助图有这个节点，但无解释） |

### 乙 · 它怎么跑

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-07 | §3, §4, §5 | **三级"能说明 / 不能说明"对照表**（全文地基）：<br>Receipt 能：收到 Proposal/冻结上下文/传输结果、记录到达、后续可做授权版本语义检查；不能：已通过合法性校验、属于当前请求、已冻结、生成一定可用、生成器实际读过、已对齐<br>Availability 能：来自受信任服务端路径、请求/session/lineage 一致、schema/revision/digest/引用范围/授权通过、同一冻结上下文、生命周期内、生成阶段有服务端能力；不能：生成器已经真正使用<br>Consumption 能：教学语义成为 outline-design task 真实输入 | **三栏对照表**（能 / 不能） | 展开 | ⚠️（散落在 DEC-004 折叠区） |
| O-08 | §5 | 消费对象清单（学习目标、授权且相关的知识范围、必要前置关系、learner projection、Required design constraints、Recommended approaches、Evaluation Focus、生成约束/范围建议/明确排除项）与消费对象**不是**（`sceneId`、route、React 组件、播放器命令、checkpoint/remediation 创建命令、RuntimeState 修改、浏览器操作指令） | 两栏对照表 | 折叠 | ⚠️（只在 DEC-007 折叠区） |

### 丙 · 怎么算发生了

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-09 | §5, §12 | Consumption 定义 + 递进关系式（`Receipt=到了` / `Availability=合法可用` / `Consumption=实际纳入设计`）+ **不能单独证明 Consumption 的 7 项清单**（Proposal 被接收、Frozen Context 被保存、context 出现在生成请求参数、context 被原样附加到 Prompt、Prompt 长度增加、生成接口成功返回 outline、输出中偶然出现 Proposal 关键词） | 定义 + 递进式 + ✗ 清单 | 展开 | ⚠️ |
| O-10 | §三, §四, §十二 | **HOW DO WE KNOW?**（关键区块，见第 4 节展开） | 独立图形（证据链 + 反例 + 最低充分条件） | 展开 | ❌ |
| O-11 | §5, §8 | **两种形状，不再混称"三个不要求"**：<br>**(a) What Consumption does NOT require** —— ① 不要求盲目服从（未采用仍可能在 Alignment 记 `Not adopted`，但不得伪称已采用；未纳入考虑属 Consumption 不充分）② 不要求最终输出明显不同（否则会为证明个性化强行制造差异）<br>**(b) Possible mismatch states** —— `Consumption=yes / Alignment=no`、`Consumption=no / Alignment=apparently yes`（本质是状态关系与边界案例，不是"不要求"） | 两条并列卡 + 一个 2×2 状态组合小表 | 折叠 | ⚠️（前两条在 DEC-005/006，第二条组合在 DEC-003） |

### 丁 · 边界与反模式

| ID | 来源 | 必须保存的语义 | 建议渲染形状 | 默认 | 覆盖 |
|---|---|---|---|---|---|
| O-12 | §6 | 为什么不把 Influence 作为第四级：`worked-example-first` 反例（Receipt/Availability/Consumption 全 yes、最终课程确实用了 worked example，但**不能归因**为 DeepTutor 造成，因为默认模板本来也可能生成）；要证明需要反事实比较、控制变量 | 反例 walkthrough（分步图 + 结论） | 折叠 | ⚠️（DEC-002 有文字） |
| O-13 | §11 | Consumption Subject = `Frozen Context × Outline Generation Attempt`；三分粒度 `Request` / `Attempt`（可能有重试）/ `Revision`（成功后形成的课纲版本）；**outline 最终失败仍可能成立 Consumption**；反之成功返回不自动证明 Consumption | 三段粒度条 + 两个"反直觉"标注 | 折叠 | ⚠️ |
| O-14 | §7, §8, §9, §11, §12, §13, §14, §15 | 边界集合（7 条内容，建议 2 个子区块）：<br>**(a) 状态与边界**：① 5 种状态组合表（Receipt × Availability × Consumption × Alignment → 产品解释）② `Consumption ≠ Output Alignment` 与两种不一致 ③ 7 类"只能算 Receipt / Availability"的代码情况 ④ 8 种"有 Receipt 无 Availability"情形<br>**(b) 明确不做 / 不主张**：⑤ `completeFormalLessonOutlines()` 自动追加 checkpoint/remediation 属既有 F60 边界修正，**不是** Consumption 证明（同时是反模式示例）⑥ scene runtime 代码路径不是消费点 ⑦ **明确不决定的 9 项** + **明确不承诺的 5 项**（§15） | 六张形状：状态组合表 / 边界卡 / 反模式清单 / 不可用情形清单 / 非主张清单 / 非承诺清单 | 折叠 | ⚠️（部分在 GAP / Open Question，§15 几乎没进 Overview） |

---

## 3. 明确不做句级搬运的地方

以下原文内容**不做逐句呈现**（否则 Overview 会退化成文档阅读器），但它们的语义已被上表吸收：

| 原文位置 | 处理方式 |
|---|---|
| §1 与 §5「Receipt ≠ Availability ≠ Consumption」的多处重述 | 由 O-02 / O-07 的对照表一次性表达边界 |
| §8 与 §14 两次讲 Consumption / Alignment 分离 | 合并进 O-14②，代码分工进 O-04 |
| §6 中反复出现的水位论证（"这已经明显强于当前产品目标"） | 保留结论与反例，不保留不同措辞的重复论证 |
| §9 中对同一路由职责的两次描述 | 由 O-04 骨架图与职责映射表统一承载 |
| §12 的 7 类情况与 §15 的非主张清单 | 保留条目本身，不保留每条的展开式论证（论证留在对应 Decision 的 Full Rationale） |

---

## 4. 关键区块 O-10：HOW DO WE KNOW?

这是本轮新增的独立区块，它回答"这套设计不仅定义三个名词，还规定怎样证明系统达到了某个状态"。

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

### 措辞上的严格约束（重要）

原文只确定了「**最低证据应以 generation-level 为主**」：要能说明某次 Outline Generation Attempt 使用了哪个 Frozen Context、哪个 generation-facing projection。原文**明确没有决定** Consumption evidence 的具体结构（§15 首条即列为未决定项）。

因此这个区块在 UI 上**不得**出现下列措辞：

| 不许写 | 原因 | 改写为 |
|---|---|---|
| `Minimum sufficient direction` | `sufficient` 等于宣称"这样就够了"，而原文没有认定充分条件 | `Minimum evidence direction` / `Evidence target` |
| `Consumption record` | `record` 暗示了一种待落库的数据结构，替原文做了未决决定 | `Consumption Evidence` |
| `… 即可证明 Consumption` | 同上，把方向写成了结论 | `最低证据方向指向 …` |

区块内要显式标注：**"evidence 的具体结构仍是未决项（Q-002）"**，并链到该 Open Question。

对应的两条反直觉判断（必须在同一区块里显式写出，否则最容易被误解）：

1. **成功生成 outline 不自动证明 Consumption** —— 如果 projection 没有成为真实生成输入，只能算 Receipt 或 Availability；
2. **最终生成失败仍可能成立 Consumption** —— 只要某一次实际 Attempt 已经合法使用了 generation-facing projection。

---

## 5. 落地检查：每个区块必须可追溯，并可关联 Review Object

规则：

```text
每个 Overview 区块必须能够追溯到原文语义，并可关联对应的 Review Object。

Review Object 可以是：Decision / Fact / Gap / Open Question / Semantic Model
```

（这里的 Review Object 沿用模型里已有的对象类型，**不新增类型**。）

之所以不用上一版的"必须能挂到 Decision 或 Fact"：O-14 这类边界集合本来就主要对应 Gap 与 Open Question，而 O-01、O-05、O-07 本质是 Definition / Boundary / Semantic Model —— 为了满足一条过窄的规则去人为制造 Decision，会让 Review 清单虚胖，也会污染"一条 Decision = 一个可独立批准判断"的定义。

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

反向检查：**12 条 Decision 的每一条都能在覆盖表里找到承载体**（机器校验通过，见下）。若未来新增 Decision 在所有区块里都找不到承载体，说明覆盖表需要扩展，而不是把它塞进某个不相关的区块。

```text
全部 Decision: 12
覆盖表未承载的 Decision: 无
  DEC-001 -> O-02
  DEC-002 -> O-03, O-12
  DEC-003 -> O-05, O-06, O-11, O-14
  DEC-004 -> O-07, O-14
  DEC-005 -> O-09, O-10, O-11
  DEC-006 -> O-08, O-11
  DEC-007 -> O-04, O-08
  DEC-008 -> O-04
  DEC-009 -> O-13
  DEC-010 -> O-09, O-10, O-14
  DEC-011 -> O-04
  DEC-012 -> O-01, O-14
```

---

## 6. 当前覆盖率的诚实结论

| 项 | 数量 |
|---|---|
| 原文节数 | 21 |
| 覆盖表中列为必须保存的语义单元 | 20（O-01 ~ O-14，含 O-14 的 7 个子形状） |
| 当前 Overview 真正承载的 | **2**（O-02 核心定义、O-05 部分两条链） |
| 已抽取但只在 decisions / 其它页的 | 12 |
| 当前完全没有抽取的 | **2**（O-04 系统骨架、O-10 证明链） |
| 明确不做句级搬运的 | 5 处重复论证（语义已吸收） |

**指标名称：Overview 区块覆盖率 ≈ 10%（2 / 20）。**

这个数字只按**区块个数**计算，**不代表语义权重**：O-04 与 O-10 各自的信息重量明显高于一个普通小区块（O-04 背靠原文约占 18.3% 的 §9 加 §10/§13/§14，O-10 是全文最易误解的部分）。所以它只能用来回答"还有多少块没做"，不能用来推断"方案已经讲清楚了 10%"——缺的那 2 块恰恰是最需要图形承载的。

---

## 7. 建议的执行顺序（第 2 步已完成，UI 仍未动）

1. ~~覆盖检查~~（本文件）—— 已按反馈修订 5 处：<br>① O-04 内部拆三种承载形式（主链图 / Current-Target 差异 / 小型职责矩阵）<br>② O-10 措辞收敛为 `Evidence target`，并新增"不许出现的措辞"约束表<br>③ O-11 拆成 `What Consumption does NOT require` 与 `Possible mismatch states`<br>④ 第 5 节规则改为"可追溯到原文语义，并可关联 Review Object（Decision / Fact / Gap / Open Question / Semantic Model）"<br>⑤ 指标改名为"Overview 区块覆盖率"，并说明它只按区块计数、不代表语义权重
2. ~~改数据~~ —— **已完成**，见第 8 节。
3. **下一步：改 Overview 的 UI**（按甲/乙/丙/丁四段 + 折叠层级 + `Source: §…` 标签）；**当前 UI 仍然未动**。

### 三个待拍板点的处理结果

| 问题 | 处理 |
|---|---|
| O-04 三种形状的默认展开 | 主链图（O-04）展开；反面代价（O-04b）与职责矩阵（O-04c）折叠 —— 实施为 3 个独立区块，而不是一个区块内的三段 |
| O-14 是否过载 | **已拆**：O-13（5 种状态组合）、O-12（反例走查）、O-14（代码侧边界与反模式）、O-15（不决定 / 不承诺）四个区块 |
| 主图与辅助图角色 | **待你确认后处理**：O-04 骨架图目前是 `flow` 数据（HTML 排版），`models` 里的 Mermaid 两张图尚未重新定位 |

---

## 8. 数据层已落地

覆盖表已转成 `fixtures/context-consumption.json` 里的 `overview` 字段，**UI 尚未改造**。

```bash
npm run validate   # Schema + 一致性检查
npm run audit      # 覆盖审计（本节的标准）
```

### 实际落地的区块

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

### 承载形式分布

```text
prose ×1   ladder ×3   diff ×1   flow ×2   checklist ×6   matrix ×4   combo ×2   steps ×1
```

**只有 2 张图**（O-04 系统骨架、O-05 两条链），其余 18 块全部用表格 / 对照 / 清单 / 阶梯 / 走查承载 —— 与"图只用于关系，对照类内容用表格"的判断一致。

### `npm run audit` 输出

```text
区块 20 个 | 承载形式：prose×1, ladder×3, diff×1, flow×2, checklist×6, matrix×4, combo×2, steps×1
默认展开 11 / 折叠 9

✓ 段落结构正确：what → how → prove → boundary
✓ 原文 15 节全部被至少一个区块引用
✓ 全部 12 条 Decision 都能被区块关联

结果：PASSED
```

审计把"语义覆盖"变成了可重复执行的检查：**原文每一节都必须被某个区块的 `sources` 引用，每条 Decision 都必须能被某个区块的 `reviewObjects` 关联**，任一落空即失败。

### 需要注意的三件事

1. **O-09 与 O-10 有重叠**：前者讲"三级各自在说什么"（定义），后者讲"每级需要哪类证据"（举证）。是有意拆分，但如果你读起来觉得重复，可以合并。
2. **UI 已接入**：界面现在是四段推进 + 20 个区块 + 左侧常驻目录 + 右侧原文回查面板；`Source` 数据来自 `docs/source-sections.json`。
3. **`models` 已移除**：那两张 Mermaid 图的语义由 O-02（ladder）与 O-05（flow）承载，避免同一份语义有两处真相。

---

## 9. Stage 1 中间格式已定型

覆盖表 → `overview-plan.json` 的正式格式、形状词汇表与验收器（本轮只做这两件事，未接 AI）：

| 产物 | 位置 |
|---|---|
| 中间格式 schema | `schema/overview-plan.schema.json` |
| 形状受控词汇表 | `docs/shape-catalog.md` |
| Gold Fixture | `fixtures/context-consumption.overview-plan.json` |
| 验收器 | `scripts/check-plan.js`（`npm run check-plan`） |
| 验收器测试 | `scripts/test-check-plan.js`（`npm run test:plan`，17 个用例） |

**Gold Fixture 的规模**：84 个 sourceUnit（core 75 / supporting 9）、21 个 block、7 组 `duplicatesMerged`。

### 回推时发现的真实缺口

把已确认的 20 个区块反推成 sourceUnit 时，有 3 条语义**原先在 Overview 里没有承载体**：

| 缺口 | 原文位置 | 处理 |
|---|---|---|
| Consumption Subject = `Frozen Context × Outline Generation Attempt` | §11 | 新增 O-16（flow） |
| 最低证据应以 generation-level 为主 | §14 | 挂到 O-16 与 O-10 |
| 投影现状（`FormalGenerationContextProjection` 的具体内容） | §9 | 挂到 O-04 节点与 O-14 |

其余 7 条（§0 的两条边界声明、§3 的 Receipt 反例组、§4 的"有 Receipt 无 Availability"、§5 的分母说明、§7 的叙事粒度）原先只存在于 fixture 的文字里、没有被登记为独立语义单元，现在都已登记并挂到对应区块。

**这说明覆盖表本身也有盲区** —— 只有把"逐句回推"做一遍，才发现有几条语义一直没有人负责。

### 验收器判定结果（Gold Fixture）

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

最后一条尤其有价值：**O-16 是回推时发现的新缺口，目前只存在于 plan，尚未加入 design-review.json 的 overview**（`npm run audit` 里的区块数仍是 20，plan 是 21）。按本轮约束"不修改 Overview UI / 不改数据"，O-16 留作下一步的待办；这条 warning 的存在本身就说明**跨文件漂移是能被自动发现的**，而这正是 Stage 2 最需要防的。
