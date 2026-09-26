# Feature 07: Generation Pipeline（Phase 4）

> 🟢 **状态：Ready（已解除 Blocked）** —— 阻塞原因「等待 Feature 09 的 Gate」已消除：
> `Feature 09 = Completed / Closed · Gate = PASS`（2026-09-26）。
>
> ⚠️ **本文档写于重构前（旧编号体系）**，§3「旧 Gold 基线作废」记录的是当时针对 **L2 切法**的口径；
> **当前入口是 framework-map 生成线**（见 §0 与「重构后的口径」）。

## 0. 这一阶段在验证什么（重点已经变了）

```text
过去（F03~F09）：我们设计的表示模型对不对？        → 已答：Contract v1 成立
接下来（F07）：  AI 能不能稳定地从任意技术文档生成这个表示模型？   ← 主线
```

```text
Document
   ↓  AI Framework Map Generation
framework-map.json
   ↓  schema        （结构层：字段 / 枚举 / 引用完整性）
   ↓  check-map     （判断层：provenance / N1-N3 / vocabulary / qualifiers / budget）
renderer
```

**这才是最初真正想解决的自动化问题** —— 前面所有 feature 都是在为它准备一个"可以被自动校验的契约"。

### 0.1 ❄️ 写 prompt 时必须逐字带上的 Contract 原则

> **Edge 描述基础关系，qualifier 描述关系结构属性，constraint 描述不能自然还原为一条边属性的业务不变量。**
> **不要为了消灭 gap，把约束塞进 relation vocabulary。**

**为什么这句必须进 prompt：** 否则 AI 为了通过 validator，很容易把

```text
Task dependency must be acyclic
```

发明成某种 edge type。完整表述见 `docs/framework-map-contract.md` §0。

**F07 要盯的主要失败模式**（不是"词不够用"）：

```text
schema 的 type 是封闭 enum（表外词 = HARD）→ AI 发明不出新词
所以它只能**误用**已有动词：
  - 把"引用"写成 contains（应 relates-to + ownership: shared/reference）
  - 把一切塞进 relates-to（兜底词膨胀 → 触发 W6）
  - 为了凑关系硬串链（Contract §6「不要强行串链」，validator 判不出来，属人工审计项）
```

## 1. 这个 feature 要做什么

让 **AI 能生成** L0 + Topic + L2 的内容，而不是靠手工。

03 §12 把 Stage 1 拆成了两步，理由是：现在 Stage 1 要干四件事（拆 units / 抽框架图 / 抽象 topics / 每个 topic 配块），塞进一个 prompt 会很不稳。

```text
Stage 1a「理解」  读完整篇 → sourceUnits + framework-map + topics
Stage 1b「配块」  逐 topic 决定需要几个 block、什么 shape、覆盖哪些 units
Stage 2          单块生成（现有能力，基本不变）
```

拆开的好处：1a 的产物**就是那张框架图**，可以单独生成、单独验证、单独看效果；1b 可以**逐 topic 重试**（与现有 Stage 2 分块重试同一思路）。

## 2. 要产出的东西

**L0 生成（本阶段的新主线）**

```text
Stage 1a 的 prompt          读完整篇 → sourceUnits + framework-map + topics
运行脚本                    复用现有 ai-plan.js / ai-block.js 的传输层重试与失败处理策略
                            + 强制：产物必须能过 schema 与 check-map（HARD = 0）
对比报告                    AI 输出的 candidate map vs 人工作出的 A/B/C/D/E
失败档                      每次运行的原始产物（含 FAIL 的那些），不得覆盖
```

**L2 配块（沿用现有 Stage 2 线，语义不变）**

```text
Stage 1b 的 prompt          按 topic 配块（几个 block / 什么 shape / 覆盖哪些 units）
Stage 2                      单块生成（现有能力）
```

## 3.（重构前口径）旧 Gold 基线作废

> 本节记录的是重构前（03 §13）的口径，针对的是 **L2 切法**那一半；L0 线现在用的是 candidate map（见「重构后的口径」）。

采用新方案后，**旧的 Gold 对标基线作废**：

| 资产 | 命运 |
|---|---|
| `sourceUnits` 87 条 | ✅ 保留 |
| 旧的 21 个 block 切法 | ❌ 作废 |
| `check-plan` 中与切法相关的规则 | 🔧 重写 |
| `ai/stage1-plan.prompt.md`（fingerprint `62e8e544c69dd32c`） | 🔧 重写；此前三次对比结论不再可用 |
| 11 个 shape | ✅ 保留 |
| `stage2-block.schema.json` / `check-block.js` | ✅ 不动 |

## 4. 实验方式

沿用项目已有的验证纪律：

- 同一输入**至少跑 3 次**
- **不要**要求 topic id / 数量 / 标题完全一致（不现实）
- 比较：Block Coverage / Semantic Stability / Grouping Stability / Overfitting Check（03 §11.4）
- **新增硬门槛（L0 线）**：每次产物都要过 `schema` + `check-map`；HARD 必须为 0

## 5. 明确不做

- ❌ 不接 Electron 主流程
- ❌ 不改 `stage2-block.schema.json` 的既有语义
- ❌ 不复用旧 21 个 block 的切法
- ❌ 不让 AI 直接生成 HTML
- ❌ 不因为某次运行不满意就改 prompt 重跑到好看为止（要留失败记录）
- ❌ 不为了通过 validator 把约束塞进 relation vocabulary（见 §0.1 的冻结原则）
- ❌ 不新增 relation 词 / 不新增 element 类型（Contract v1 已定稿，见 `framework-map-contract.md` §7.3）

## 前置条件（开工检查）

- [x] Feature 05 的 `Gate = PASS`
- [x] Feature 06 的 `framework-map.schema.json` + `check-map` 可用（含 F09 修复：H8 / W7 / W8、`W4 → I6`、heading tree）
- [x] **Feature 09 的 `Gate = PASS`**（原阻塞项，2026-09-26 关闭）
- [ ] 上游网关稳定（此前有 503 导致产物被覆盖的事故，见 Feature 01 的 O-16 记录）→ **仍是唯一未满足项**，需要"失败不覆盖既有产物 + 读回校验"的策略

## 重构后的口径（与上文旧章节的差异）

```text
1. 「Gold」这个词在这一线不用了
   A/B/C/D/E 的产物是 **candidate map**（人工建模 + 人工验收），不是 Gold。
   F07 的对比对象是 candidate map，不是"唯一正确答案"。

2. 验证纪律沿用（03 §11.4），但判据换成契约可执行的那套
   同一输入至少跑 3 次；
   不要求 topic id / 数量 / 标题一致；
   每次产物都必须过 schema + check-map（HARD = 0 是硬门槛，Warning 逐条解释）

3. 失败记录必须保留
   - 不因为某次运行不满意就改 prompt 重跑到好看为止
   - validator 判 FAIL 的产物要原样留档（这是"AI 会不会为了过校验而误用动词"的证据）
```

## 状态

- **创建时间**：2026-09-26
- **状态**：**Ready（已解除 Blocked）** —— 2026-09-26 由 Feature 09 `Gate = PASS` 解冻
- **待补文档**：`execution-prompt.md` · `validation-checklist.md`
- **本轮不开始实现**：任务书尚待下发（见 `docs/features/09-contract-adversarial-test/results/repair-round.md` §7.6）
