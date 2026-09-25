# Phase 2 AI 分析协议（草稿，尚未接入）

> 状态：**未接入、未验证**。本文件描述的是「如果要用 AI 生成 `design-review.json`，它必须遵守什么」，
> 不是已经跑通的能力。在 Review UI 的体验被人工确认之前，不应实现它（agent.md 第十九节 Milestone 顺序）。
>
> **2026-09-25 补充**：Overview 的生成已拆成两级流水线，Stage 1 的中间格式与验收器已经先行定型：
>
> ```text
> Markdown
>   ↓ Stage 1：Semantic Coverage Planning
>   ↓ overview-plan.json          ← schema/overview-plan.schema.json
>   ↓ npm run check-plan          ← scripts/check-plan.js（闸门）
>   ↓ Stage 2：逐块生成视觉内容
>   ↓ overview.json（design-review.json 的 overview 字段）
>   ↓ Renderer
> ```
>
> - 形状受控词汇表：`docs/shape-catalog.md`（10 个形状 + prose 例外）
> - Gold Fixture：`fixtures/context-consumption.overview-plan.json`（84 个 sourceUnit / 21 个 block）
> - 验收器测试：`npm run test:plan`（17 个用例）
> - **Stage 1 / Stage 2 的正式 Prompt 尚未编写**，本轮刻意不做。

## 输入

```text
Agent Instructions（本文件）
+ Markdown 设计文档全文
```

Phase 2 **不读取源码目录**。源码证据属于 Phase 3。

## 输出

一个符合 `schema/design-review.schema.json` 的 JSON。输出必须能通过两层校验：

1. Schema 校验（结构、枚举、必填字段、`id` 形如 `DEC-001`、图形数量上限）；
2. 一致性检查（id 全局唯一、`dependsOn` / `relatedGaps` / `relatedQuestions` 指向存在的对象、
   `summary` 计数与实际一致、`category` 与 `blocking` 一致、每个 Open Question 都挂在某条 Decision 上）。

校验失败时，修复 JSON，**不要**把它交给 Review UI。

## 必须遵守的输出契约

```json
{
  "design": { "id": "", "title": "", "summary": "一句话摘要", "status": "draft", "sourceDocuments": [] },
  "summary": { "pendingDecisions": 0, "gaps": 0, "openQuestions": 0 },
  "models": [], "facts": [], "decisions": [], "gaps": [], "openQuestions": []
}
```

硬约束：

- `decisions[].status` 只能是 `pending`（schema 用 `const` 强制）；
- 每条 Decision 必须有 `reviewLevel`、`rationaleSummary`、`relatedQuestions`；
- 图形最多两张：**恰好 1 张** `role: "primary"`（整体方案 / 流程 / 结构）+ 最多 1 张 `role: "auxiliary"`（语义模型 / 状态关系）；
- 每条 Evidence 的 `type` 只能是 `document-claim` 或 `source-verified`；**Phase 2 只允许 `document-claim`** ——没有读源码就不能声称 `source-verified`；
- 每个 Open Question 必须挂到至少一条 Decision 的 `relatedQuestions`（UI 里它只作为附属信息出现，没有独立页面）；
- 不写 `human-review.json`，不读取它；
- `alternatives` 没有明确内容时留空数组，**不得虚构**；
- `evidence` 必须指向真实存在的文档章节；不要编造 `path` / `symbol`；
- 一个 Decision 只表达一个可独立 Reject 的判断；一句话里有两个可分别否决的判断时必须拆分；
- 文档明确「未决定」的事项必须变成 `openQuestions`，**不得补全**。

## design.summary：一句话说清方案

`design.summary` 是 Overview 首屏唯一的长文本，它决定人能否在不读原文的情况下"看懂整体方案"。要求：

- **一句到两句**，不超过 120 字；
- 说清「这个方案主张什么」与「它把什么放在哪里」，而不是罗列章节；
- 不含"本文讨论了…""主要分为三部分…"这类目录式表述；
- 不使用文档里未定义的缩写。

反例（不合格）：「本文记录 FUSION/11 第七项产品语义讨论结果，讨论了 Context Consumption 的三个层级和相关边界。」
正例（合格）：「把课前教学上下文的"被使用"严格拆成三级递进 —— 到达、可用、实际作为课程设计输入，并把消费点定在 outline generation，而不是让每个 scene 各自重新解释整份冻结上下文。」

## models[].role：只画两张图

图形优先帮助看懂整体方案，不追求细节完备：

| role | 画什么 | 数量 |
|---|---|---|
| `primary` | 整体方案 / 主流程 / 主要结构 —— 让人 30 秒内知道"这东西怎么跑" | 恰好 1 张 |
| `auxiliary` | 语义模型 / 状态关系 —— 补充主图说不清的概念关系 | 0 或 1 张 |

不要为每个章节各画一张图，也不要把主图做成全量架构图。如果某个细节只有两三个节点，用文字而不是图。

## rationaleSummary：一句话原因

`rationaleSummary` 是决策清单默认展示的唯一"论证"，必须能单独解释「为什么这么建议」：

- 一句话，不超过 60 字；
- 说明**取舍的理由**，不是重复 proposal；
- 如果理由是"因为文档这么写"，那不是理由 —— 要写文档为什么这么定。

完整的论证仍放在 `rationale` 数组里，只在"查看详情"时展开。

## reviewLevel 的判定规则

`reviewLevel` 决定人工首先看到多少东西，所以它必须由「人是否需要独立表态」决定，而不是由"重要性"决定。

| reviewLevel | 判定标准 |
|---|---|
| `root` | 与文档主线结论直接相关；即使它依赖其他 Decision，人也可以单独否决它 |
| `supporting` | 细化或限定某个 root 的适用范围；单独否决它不会推翻 root |
| `derived` | 由某个 root 直接推导出的边界结论；否决它等于否决对应 root |

反例：把「保留三级模型」（root）与「不把 Influence 作为第四级」（supporting）都标成 root，会让首屏出现两个互相依赖的必批项；把「scene 消费 context-shaped outline」（derived of Primary Consumption Point）标成 root，则等于把同一个判断问两遍。

## Open Question category 的判定规则

| category | 什么时候用 | 是否阻塞实现 |
|---|---|---|
| `architecture-blocking` | 未决定会导致边界/职责/数据归属无法确定 | 是 |
| `implementation-blocking` | 边界已定，但不决定就无法写出正确实现（判定方法、行为分支等） | 是 |
| `deferred` | 已明确决定「现在不做，留到后续阶段」 | 否 |
| `research` | 属于研究/实验性议题，不影响当前实现正确性 | 否 |

`blocking` 字段必须与 category 一致（architecture / implementation blocking ↔ `true`），一致性检查会强制这一点。**Gate 只认 category**，所以不能靠把 `blocking` 写成 `false` 来绕过阻塞判定。

## Decision 的粒度自检

1. **阅读全文**：先理解术语、范围、已有结构。不要看到前几段就开始生成。
2. **分类**：把内容分到 Semantic Model / Fact / Decision / Rationale / Gap / Open Question / Evidence 七类。
   - Rationale 不是 Decision，它进入所属 Decision 的 `rationale` 数组。
   - 文档陈述的「现状」是 Fact 或 Gap 的 `current`，不是 Decision；除非文档本身在要求读者批准一个边界。
3. **提取 Decision**：对每条候选问题自问「人能不能独立地回答 Approve / Reject / Needs Revision」。
   不能，就重新拆；不能拆，就不是 Decision。
4. **保留不确定性**：文档没有决定的地方建立 Open Question，并判断 `blocking`。
5. **生成 JSON**，然后跑校验。

## Decision 的粒度自检

一个合格的 Decision：

- `title` 可以单独读懂；
- `question` 只问一件事；
- `proposal` 是待审核方案，不是结论；
- `rationale` 解释「为什么这么提」，而不是重复 proposal；
- `consequences` 说明「批准后要承受什么」；
- `dependsOn` 只放在真正前置的 Decision 上，不滥用来表达「相关」。

反例：把「保留三级模型」和「不引入第四级」写成一个 Decision —— 两者可以被人分别否决，必须拆开。

## 禁止事项（对应 agent.md 第二、二十二节）

- 把自己的 Proposal 标成 `approved`；
- 替人关闭 Open Question；
- 把推测写成 Current Reality（把「应该会」「预计」写成 Fact）；
- 把 Target Design 写成已实现；
- 证据不足时伪造 Evidence 或补造 `symbol` / 行号；
- 覆盖已有人工 Review 结果；
- 让 `summary` 计数与真实条目不一致。

## 第一轮样本的抽取结论（供对照）

对 `测试文档/18-context-consumption-semantic-model.md` 的抽取结果：

- `design.summary`：1 句，说明三级递进 + 消费点定在 outline generation；
- 2 张图：`MODEL-001`（primary，Context-side chain 三级递进）、`MODEL-002`（auxiliary，两条链的关系与衔接点）；
- 6 条 Fact（现有代码入口与投影现状，来自文档第九节陈述，全部 `document-claim`）；
- 12 条 Decision（全部 `pending`），每条都有 `rationaleSummary`：**root 4**（DEC-001 / 007 / 009 / 012）、supporting 7、derived 1（DEC-008）；
- 6 个 Gap（scene 直连 formal context、projection 覆盖不足、缺 Attempt 级记录、checkpoint/remediation 混淆、投影注入 vs 实际消费不可区分、概念 JSON 缺失）；
- 10 条 Open Question：blocking 6（3 architecture + 3 implementation）、非阻塞 4（3 research + 1 deferred），全部挂到某条 Decision 的 `relatedQuestions`，没有一条被补全；
- 36 条 Evidence，全部 `document-claim`。

这份结果保存在 `fixtures/context-consumption.json`。它是两页 UI 的输入，也是后续真实 AI 输出的对照基线：
如果模型给出的 root Decision 明显多于 4 条（说明 reviewLevel 判太松）、画了超过两张图、
把第十五节的未决事项写成了结论，或者产出任何 `source-verified` 证据（Phase 2 不读源码），
都说明协议还需要收紧。

## 建议的最小接入形态

```text
Electron main
  └── 读取 Markdown（已有）
  └── 组装 prompt = 本文件 + 文档全文
  └── 调用 provider adapter（API Key 只存在于 main，绝不进 renderer）
  └── 得到 JSON 文本
  └── JSON.parse → validate(schema) → semanticCheck
        ├── 失败：把错误回显给用户，不进入 Review UI，不写盘
        └── 成功：ipcMain 写 design-review.json（design:saveJson 已就绪）
```

`design:saveJson` 已实现并且**写盘前会重新校验**，所以 Phase 2 只需要补一个 provider adapter 和 UI 触发点。
