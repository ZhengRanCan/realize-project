# Product Specification

## Problem and user

- Problem: 长篇、连续的 Markdown 设计文档难以被人工审核。逐行读完成本高，只做摘要又会丢掉边界、例外、反例、
  Current / Target 差异与未决事项，而**恰恰是这些内容决定设计能不能被批准**。
- Target user: 需要审阅 AI 参与生成或他人撰写的复杂技术方案的**设计与架构决策者**（本地桌面环境，单机使用）。
- Primary user outcome: 不打开原 Markdown，也能较完整、较轻松地讲清"这份方案在说什么、它怎么跑、怎么算发生了、
  边界在哪"，并在此基础上逐条对 Decision 做出同意 / 不同意 / 以后再说的判断；需要核对时能一键回到原文对应章节。

## In scope

- 把一篇 Markdown 设计文档重构为两类内容：
  - **Visual Overview**：按认知路径推进的四段（甲 · 这是什么 / 乙 · 它怎么跑 / 丙 · 怎么算发生了 / 丁 · 边界与反模式），
    每个区块按内容形状选择承载形式（受控词汇表见 `docs/specs/shape-catalog.md`），并带 `Source` 回查标签。
  - **Decision List**：把需要人工判断的设计决策集中呈现，支持 同意 / 不同意 / 以后再说，写回 `human-review.json`。
- **分层文档模型**：L0 一屏两区（framework map + topic 导航）→ L1 Topic → L2 Visual Blocks → L3 元素详情，
  Source / Provenance 作为贯穿所有层级的纵向能力（规格见 `docs/log/artifacts/F03-hierarchical-architecture/brief.md`）。
- 语义覆盖而非句子覆盖：允许合并重复论证、改写措辞、调整顺序、使用折叠；不允许丢失重要定义、边界、例外、反例、
  Current-Target 差异与未决事项，也不允许把未决定的内容写成结论。
- 可机检的契约层：Schema、`check-plan`、`check-block`、`check-map`、`check-overview` 等验证层，
  以及区分 `document-claim` 与 `source-verified` 的证据级别。

## Out of scope

- 完整 Design Review Dashboard、统计卡片墙、多人协作、云服务与账号体系。
- 由 AI 直接生成最终 HTML 或直接替用户批准设计。
- 一次性把整个源码仓库发送给模型；接源码形成 `source-verified` 证据属于后续阶段。
- 多篇文档的自动对比与 diff（v1 靠人工跨进程对比框架图）。

## Core principles

1. **语义覆盖，而不是句子覆盖。** 允许合并重复论证、改变顺序、使用折叠和不同视觉形式，
   但重要语义不能因为"可视化"而消失。
2. **可视化不是摘要。** 目标不是把 500 行文档压缩成几张卡片，而是把散文重构成：流程与拓扑、
   Current / Target 对照、能说明 / 不能说明矩阵、状态组合、正反例、Evidence chain、Boundary / Non-goal 清单。
3. **AI 负责整理，不负责批准。** AI 可以提出结构、关系、Decision、Gap 和 Open Question，
   但不能替用户批准设计，也不能把未决定事项补成确定结论。
4. **Current、Target 和 Evidence 必须分清。** 目标设计不能伪装成当前现实；仅来自 Markdown 的信息属于
   `document-claim`，接入源码后才可能形成 `source-verified`。
5. **AI 输出必须可验证。** 用 JSON Schema、`check-plan`、`check-block`、`check-map`、`check-overview`
   等验证层兜底，不把 Prompt 当成唯一可靠性来源。

> 第 3~5 条的强制形式写在 `CONSTRAINTS.md`；第 1、2 条的判定细则见 `docs/specs/shape-catalog.md` 与 `docs/specs/overview-coverage.md`。

## 最重要的判断标准

> 不打开原 Markdown，仅通过 Visual Overview，用户是否能够较完整、较轻松地理解整个设计方案，
> 并在需要时回到原文核查。

任何"更好看 / 更短 / 更自动化"的改动，如果不能提升这一条，就不算收益。
