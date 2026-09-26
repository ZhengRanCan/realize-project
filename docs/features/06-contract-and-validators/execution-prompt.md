# Contract & Validators — Execution Prompt

> 本文件是 Feature 06 的任务书，自包含。
> 定位与三级冻结清单见同目录 `README.md`（下文 §编号均指该文件）。
> 验收标准见 `validation-checklist.md`。

## Context

Feature 03 定义了 `framework-map` 的规格（`docs/features/03-hierarchical-architecture/README.md`）。
Feature 04 手工产出了 Fixture A 的图；Feature 05 用 A / B / C 三类文档验证过规格，**Gate = PASS**，并得出一份规则矩阵（`docs/features/05-l0-generalization-gate/results/rule-matrix.md`）。

现在要把**已经有足够证据的部分**固化成契约，**把仍有疑问的部分**显式保留：

```text
Freeze evidence-backed semantics;  keep heuristics soft;  represent unresolved gaps explicitly.
```

具体地：**不要把 12 写成 `maxItems`，不要补第 9 个关系词，不要把 `role` 做成严格 enum。**

## Constraints

**允许：**
- 新增 `schema/framework-map.schema.json`
- 新增 `scripts/check-map.js`（以及同风格的测试脚本）
- 新增 `docs/framework-map-contract.md`
- 在 A / B / C 三份 map 里补 `relationGap` 记录（这是契约新支持的合法字段）

**不允许：**
- ❌ 修改 `app/renderer/*`、`app/main/*`（Feature 08 的事）
- ❌ 写任何生成 prompt（Feature 07 的事）
- ❌ 新增第 7 类 element、新增 relation 词
- ❌ `schema maxItems: 12`
- ❌ 把 `role` 做成严格 enum（unknown role 只能是 Warning）
- ❌ 因为"某类 element = 0"报警
- ❌ 因为"没有主轴 / 出现 DAG / Topic 没有 element"报警（这些是 Informational）
- ❌ 改动 A / B / C 三份 map 的**语义内容**（只允许补 `relationGap` 这类新字段）
- ❌ 改动 `fixtures/`、`experiments/`、`ai/`

## Task Breakdown

### Task 1 · `schema/framework-map.schema.json`

只负责：字段存在 · 数据类型 · 枚举 · ID 格式 · 引用完整性 · 基础结构。

**必须做到：**

- `mapVersion` / `level` / `document` / `elements` / `edges` / `attachments` / `topics` / `meta` 的结构约束
- `elements[].type` —— **严格 enum（六类）**
- `elements[].role` —— **string，不 enum**（controlled-but-extensible，§4.3）
- `elements[].sourceUnitIds` / `elements[].sectionRefs` —— 二者**至少其一非空**（provenance 是硬规则）
- `edges[].type` —— 严格 enum（8 词 + `relates-to` 兜底）
- `relationGap` —— **新增结构**：`{ from, to, intendedMeaning, reason }`，**不进入 `edges[]`**（§4.1）
- `topics[]` —— `title` / `proposition` + （`blockIds` 或 `sectionRefs` 至少其一）
- `meta.validationGranularity` —— 必须存在，取值标明粒度（A 是 `sourceUnit`，B / C 是 `section (provisional)`）

**必须**做不到**的**（这是设计，不是遗漏）：
- ❌ 不能用 `maxItems: 12` 限制 element 数量（§3）
- ❌ 不能校验"六类都出现"
- ❌ 不能校验"必须有主轴"
- ❌ 不能校验"多个值是否互斥"这类语义规则

### Task 2 · `scripts/check-map.js`

输出**三级 severity**，不要混成一个 pass/fail（§5）：

```text
Hard Error     unknown type / missing provenance / dangling reference /
               illegal relation word / 无导航路径 / 同 ID 重复
Warning        element > 12 / role 未知 / Topic 太多 / 某 Topic 只有一个 block /
               relationGap 存在
Informational  component = 0 / state = 0 / 没有主轴 / 出现 DAG / Topic 没有 element
```

**必须实现的具体检查：**

```text
1. provenance 非空且引用可解析（A 用 sourceUnitIds → 对 fixtures/context-consumption.overview-plan.json；
   B / C 用 sectionRefs → 对原文小节目录）
2. Navigation invariant N1 / N2 / N3
     N1 每个 Topic 至少关联一个 element 或一个 block / section
     N2 每个需要保留的 block（或小节）至少一个入口，**文档级入口除外**
     N3 每条语义（或每一节）至少一条可达路径 —— 目标：orphan = 0
3. edge 词表封闭性；表外词 = Hard Error；`relates-to` 使用次数 = Warning
4. attachment 合法性：非 process/artifact 元素必须有 attachment；
   主轴只允许 process / artifact
5. 判据 F：同文档内 label 唯一
6. element budget：> 12 → **Warning**（不是 Error），并区分"有硬塞"与"有 L1/L2 入口"
7. relationGap：存在 → Warning（REVIEW REQUIRED）
8. 形态类观察全部走 Informational（§5.3）
```

**粒度纪律：** A 走 `sourceUnitIds`，B / C 走 `sectionRefs`。报告中**必须分别列出**，**不得把两种粒度合成一个 coverage 百分比**。

### Task 3 · `docs/framework-map-contract.md`

记录 **schema 表达不了的那部分判断**，至少包含：

```text
1. 为什么这么建模（三种 coverage 的关系）
2. concept vs state 怎么区分（含"多个值可同时成立 → 通常不是互斥 state"，并附 A 的 regression case）
3. 什么时候应该用 attachment（而不是 edge）
4. 什么叫 Capacity gap、怎么处理
5. 什么叫 Relation gap、怎么用 relationGap 表达
6. "文档没声明依赖就不要强行串链" —— 以及它的来历（Fixture C 的真实经历）
7. 哪些是 hard rule、哪些只是 heuristic（三级冻结清单）
```

### Task 4 · 在三篇 Fixture 上跑通

```text
对 A / B / C 各跑一次 check-map：
  期望：Hard Error = 0（三篇都是已通过的产物，校验器不得误报）
  记录：各自的 Warning 与 Informational
```

> **校验器的首要任务是"不误报"。** 如果 A / B / C 被自己的新校验器判 Hard Error，先怀疑校验器写得太死（除非确实漏了 provenance / 引用坏了）。

### Task 5 · 登记 3 处 relationGap

在 B / C 的 map 里补 `relationGap` 记录（§4.2）：

```text
B  两端实现必须与同一 fixture 逐字节一致
C  Candidate Inbox 持有 Candidate
C  Proposal 校验通过后放行进入下游
```

**不要**把它们写成 `edges[]`，也不要新造关系词。

### Task 6 ·（建议）`scripts/test-check-map.js`

沿用 `scripts/test-check-plan.js` / `test-check-block.js` 的风格，用小型构造样本覆盖：

```text
- 表外词 edge → Hard Error
- relationGap 存在 → Warning
- element > 12 → Warning（**不是** Error）
- 未知 role → Warning（**不是** Error）
- component = 0 / 没有主轴 / DAG / Topic 无 element → Informational（**不是** Error/Warning）
- 缺 provenance → Hard Error
- dangling reference → Hard Error
```

## Verification

```text
[ ] schema 通过 JSON Schema 校验器自检（能被 ajv 或等价工具加载）
[ ] A / B / C 三份 map 都通过 schema
[ ] check-map 对 A / B / C：Hard Error = 0
[ ] element > 12 只出 Warning
[ ] 未知 role 只出 Warning
[ ] relationGap 只出 Warning
[ ] component = 0 / DAG / 无主轴 / Topic 无 element 只出 Informational
[ ] 报告里 A 的 sourceUnit 粒度与 B / C 的 section 粒度**分开列出**，没有合成一个百分比
[ ] contract 文档覆盖 Task 3 的 7 项
[ ] 三篇 map 的语义内容未被改动（只补了 relationGap）
```

详细清单见 `validation-checklist.md`。

## Deliverables

```text
schema/framework-map.schema.json          契约（结构层）
scripts/check-map.js                      校验器（三级 severity）
scripts/test-check-map.js                 测试（建议）
docs/framework-map-contract.md            契约（判断层，schema 表达不了的部分）
docs/features/06-contract-and-validators/results/
    verification-output.txt               三篇的运行结果
    notes.md                              本次的取舍与遗留
```

**不要**产出：renderer 改动、生成 prompt、新的 element 类型、新的 relation 词。

## 报告格式

```text
schema      字段数 / 是否用了 maxItems（应为否）/ role 是否 enum（应为否）
check-map   Hard/Warning/Informational 三级各实现了哪些检查
A           元素数 / Hard / Warning / Informational
B           元素数 / Hard / Warning / Informational（含 relationGap 1 条）
C           元素数 / Hard / Warning / Informational（含 relationGap 2 条）
粒度        明确写出 A = sourceUnit、B / C = section (provisional)，未混算
契约文档    7 项覆盖情况
遗留        需要 Phase 2b 对抗测试去回答的问题
```
