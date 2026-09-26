# Feature 01 执行结果：审核说明（review-notes.md）

本文件面向 reviewer，重点说明三件事：
1. **仍然存在的 warnings 及其可接受理由**；
2. **执行过程中新发现的问题**（含 1 个我自己造成的产物损坏）；
3. **执行质量自评与需要 reviewer 判断的点**。

---

## 一、仍然存在的 warnings（共 18 条，全部为 block 级）

### 1.1 重复类 17 条：同一 sourceUnit 在**同一个 block 内**的多个元素里出现

| block | 涉及的 sourceUnit | 次数 |
|---|---|---|
| O-03 | SU-006 / SU-007 | 5 / 4 |
| O-04 | SU-053 / SU-054 / SU-046 / SU-045 / SU-056 | 5 / 5 / 4 / 3 / 3 |
| O-04b | SU-075 | 3 |
| O-05 | SU-003 / SU-004 / SU-010 | 3 / 3 / 3 |
| O-07 | SU-018 / SU-022 | 3 / 3 |
| O-13 | SU-037 | 5 |
| O-15 | SU-081 / SU-083 / SU-082 | 6 / 6 / 4 |

**为什么可以接受 —— 这是启发式口径问题，不是内容问题：**

- 复算结果：**跨 block 重复 = 0**。没有任何 sourceUnit 出现在超过 3 个 block 中。
- 这 17 条全部来自 `check-block` 的规则"同一 sourceUnit 在同一个 block 内的多个元素里出现 >2 次"。
- 但**一个语义单元在视觉上拆成多个元素是正常且必要的**。最典型的是 O-15：
  `SU-081`（本文不决定 JSON 字段、evidence 结构、消费方式…）本身就是**一条**语义单元，
  它天然对应 **8 个**"不决定"条目 —— 6 个元素引用它完全合理。
- 同理 O-13 的 `SU-037`（5 种状态组合）对应 5 个 combo 行；O-03 的 `SU-006` 对应 4 行 diff。

**建议（不属本轮范围）**：把该规则的阈值改为按"元素类型"区分，或改为"同一 sourceUnit
在**同一语义位置**重复"才算冗余。当前它更像"信息性提示"而非缺陷。

### 1.2 密度类 1 条：O-10b 的 `panels[2]` 用 41 字承载 4 条语义

- 该 panel 是"最低证据方向"：`Frozen Context → Projection → Generation Attempt → Consumption Evidence`。
- 它本身是一条**链式**表达，41 字是这种表达的自然长度，不是过度概括。
- **可以接受**，但 reviewer 可在 Preview 里确认它读起来是否清晰。

### 1.3 check-plan 的 warnings（4 条，来自 Gold Plan 本身，非本轮引入）

- `§5 被拆成 6 个 block`、`§14 被拆成 5 个 block` —— 章节粒度提示，属既有结构。
- `3 个 Gap / 5 个 OpenQuestion 未被任何 Overview Block 关联` —— 这个我在上一轮复核过：
  它们确实不适合放进 Overview 的任一块（例如 GAP-002 是投影覆盖不足，属实现细节）。
  本轮**未新增也未消除**。

---

## 二、本轮新发现的问题

### 2.1 ⚠️ O-16 的实验产物损坏（我造成的，已显式标注）

**发生了什么**：Phase 1 把 O-16 的 stage 从 `boundary` 改为 `prove` 后，我重跑 O-16 以取得一致的产物。
但上游连续返回 `HTTP 503 (model_not_found)`，**失败的尝试覆盖了 `O-16/request.json`**，
而原始成功那次（2026-09-25 22:38）的 request 日志**已不可恢复**（`experiments/` 不在 git 跟踪范围内）。

**当前状态**：
- `block.generated.json` / `raw.md` / `check-block.txt` **完好**，仍是 22:38 那次成功运行的产物；
- `request.json` 已被我显式标注 `artifactStatus: "content-from-earlier-run"` 并写明原委；
- `overview.generated.json` 里 O-16 的 `stage` 由 assembler 从 plan 注入，因此**渲染结果正确**（已渲染在 prove 段）。

**影响面**：只影响"实验可复现性"这一项 —— 无法从 O-16 的 request.json 复现出当时的确切请求。
**不影响**语义正确性与 Preview。

### 2.2 本轮存在**混合 prompt 版本**的产物

- 18 个 block 使用 Full Run 时的 prompt（`980bb05f…`）；
- 6 个 block 使用本轮修正后的 prompt：O-04 / O-05 / O-08（`31c421cb…`）+ O-10b / O-11 / O-16（`31c421cb…`）。
- **这是必要的**：Fix 2.1 / 2.2 / 3.1 确实改变了这几个块的输入（covers / 层级规则 / 拓扑指引），
  不重跑就无法验证修复效果。
- 但 reviewer 需要知道：**当前 overview.generated.json 不是"单次同构运行"的产物**。

### 2.3 O-05 的根因比报告描述的更深（本轮最重要的发现）

报告写"Stage 2 生成时错误融合了相邻 sourceUnits"。实测根因是：
**O-05 的 covers 里根本没有三级定义**，模型只能拿 SU-035（§7 的完整叙事）当替代品，
并给 Availability / Consumption 节点错挂了 SU-035 / SU-009。

也就是说：这不是 Stage 2 的生成错误，而是 **Gold Plan 的覆盖缺口** ——
plan 要求 O-05 画三级链路，却没有给它三级定义。已在本轮修正 covers。

**同类风险仍可能存在**：其它"跨章节综合"的块（如 O-16、O-14）也可能有类似覆盖缺口，
但本轮未做系统排查。

### 2.4 我自己引入并修掉的 3 个 bug

| bug | 现象 | 修正 |
|---|---|---|
| plan 生成器与 fixture 不同步 | 只改 fixture 时 plan 不跟着变（O-15 标题、O-16 stage 一开始都没生效） | 在 `backfill-overview-plan.js` 加入"展示层同步"逻辑 |
| 生成器自检不认 duplicatesMerged | 已登记合并的单元被误判为"未覆盖"，脚本拒绝写出 plan | 与 `check-plan` 口径对齐 |
| 误删 O-05 的 SU-002 | SU-002 只由 O-05 承载，删掉后 plan 自检报未覆盖 | 恢复并保留新增的 SU-003 / SU-004 |

另有 2 处 schema 违规（lane 级 note、section 级 note）与 1 处 provenance 越界（人工 fixture 里给 panel 加 sourceUnitIds），
都由 `npm run validate` 拦下并已修正。

### 2.5 selftest 的一处断言需要修正

O-16 移入 prove 段后，selftest 的 "lane 数 = 5" 断言失效 —— 因为它把**折叠块**的 lane 也算了进去。
已改为只统计默认展开的块（现为 4 个 lane）。这属于既有断言的假设过窄，不是回归。

---

## 三、执行质量自评

| 项目 | 评分 | 说明 |
|---|---|---|
| Phase 1 执行质量 | 4/5 | 3 项全部完成并验证；但发现标题问题实际比报告严重（内容 7 条 ≠ 原文 8 条），且过程中因脚本同步问题绕了两圈 |
| Phase 2 执行质量 | 4/5 | 两个 split 都完成且语义边界经实测确认；O-05 的过程中有一次因我自己误删 SU-002 而重跑 |
| Phase 3 执行质量 | 4/5 | 调研结论明确（方案 A，无需改 renderer），实施后"只看图"成立；但增加了一处 runner 控制级指引，属 prompt 侧的轻度扩展 |
| 文档完整性 | 4/5 | 本目录 4 份文档齐全；但 O-16 的 request 日志无法恢复，可复现性有缺口 |
| 整体满意度 | 4/5 | 6 个问题全部处理；核心指标 Hard Error=0 / core coverage=100% / provenance=100% 达成 |

---

## 四、需要 reviewer 重点判断的三件事

1. **O-04 的"旁支"表达是否够清楚。**
   我采用"主干 + `tier: secondary` 缩进旁支"来表达分支，没有改 renderer。
   请在 Preview 中只看图回答问题："Current 比 Target 多出的关键路径是什么？"
   如果答案是"scene 可以直接读取 Frozen Context"，则达成；否则需要 reviewer 决定是否接受更高成本的方案。

2. **O-05 的 Receipt 节点现在"说得很少"（"上下文到达了系统。"）。**
   这是刻意的 —— 层级之间的克制是设计意图。但请确认它**不是一个空洞的占位符**，
   而是真的表达了 Receipt 的边界。

3. **是否接受"混合 prompt 版本"的实验产物。**
   若 reviewer 要求单次同构运行，需要在上游稳定后重跑全部 21 个块（成本约 20–40 分钟）。

---

## 五、未做的事（明确声明）

- 未接 Electron 主流程（Preview 用的是同一份 renderer 代码，但走的是实验性的 `--verify-preview` 入口）
- 未使用 Stage 1 生成的 plan
- 未进入 Phase 3 源码分析
- 未读取 OpenMAIC 源码
- 未让 AI 生成 HTML
- 未新增 shape 词汇、未改 `schema/*.json`、未改 `app/renderer/*`
- 未为了消除 warning 重跑全部 block
- 未做 AI-as-Judge
