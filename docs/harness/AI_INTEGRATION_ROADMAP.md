# AI Integration Roadmap

Date: 2026-10-06.

本文件记录用户确认的阶段目标，以及据此提出的任务拆分。它是阶段路线，不替代现有 Schema、Reading Contract 或尚待确认的实现设计。用户追加选择“先Deepseek吧，比较便宜”；首轮先使用 DeepSeek 建立完整链路与重复稳定性基准，其它模型对比后置。具体模型、端点、接口适配方式及实验预算未确定，本轮不调用外部模型。

## User direction

用户确认“目前 L0、L1、L2 的第一版基本完成”。以现有实现作为首版基线，停止主动扩展 Reading 各层；后续根据实际使用和测试反馈再优化。

下一阶段的成功标志是：第一次打开软件的用户能确认 AI 模型，选择自己的文档，开始分析，看到阶段状态，最终进入完整的文档解释界面。AI 替代人工准备和实验生成过程，沿用已有数据结构、分析逻辑和 Renderer。

优先顺序：AI 接入实验 → AI 配置 → 文档选择 → 完整分析链路 → 入口 UI 整理 → 实际使用 → 根据截图讨论解释页面顶部 → 后续各层改进。

历史记录、批量文档、复杂参数、Prompt 编辑暂缓。解释页顶部的 Visual Overview / Decision Review / L0 等导航暂不重排；后续逐区域讨论用途、显示频率和所在层级。

## Current implementation and gaps

以下结论来自本轮代码阅读，不是新模型实验结果：

| Existing asset | What remains |
| --- | --- |
| `scripts/run-semantic-grounding.js`：语义 inventory → Map / selection | 没有串到当前 Plan / 全部表达 / 运行时资料包；不能把 Map 单阶段成功当成完整分析成功 |
| `scripts/ai-plan.js`：原文 → Plan | 请求依赖预备的 design-review 审阅对象，不能直接替代任意文档的分析入口 |
| `scripts/ai-block.js`：Plan → 逐块表达 | 仍读取样本配套 design-review 与默认章节坐标；接新文档必须显式绑定当前分析输入 |
| `scripts/assemble-overview.js` 与各 validator | 可复用装配和校验，仍需完整的上游数据和一致的身份/来源引用 |
| F25 / F23 的 Map readingGuide | 导读、对象/连接/主题解释及原文绑定需要纳入 AI 输出，不能继续用人工增强样本冒充自动结果 |
| Reading Bundle 导出 / 加载 / session | 必需 source、sourceSections、designReview、Plan；完整主链路还需 Map 和 Generated |
| Electron 已有选择文件 / 打开结果能力 | 尚无可保存的产品 AI 配置、完整分析任务状态及一键串联入口 |

现有 ARCHITECTURE 的阶段图是职责说明；其中 Stage 1b 等不代表已有可直接串联的完整实现。F07/F10 的历史问题保留，不能通过新阶段登记自动变成 passing。

## Proposed feature sequence

只先登记 F26；F27–F30 为建议拆分，待实验结论后细化合同，未开始实施。此前聊天中“F26”的 L1 解释修正由 F23 v0.2 承接，registry 没有独立 F26，本次编号从当前最大 F25 后续接。

| Feature | Observable outcome | Depends on |
| --- | --- | --- |
| F26 AI Integration Experiment | 完整数据生产缺口、DeepSeek 重复结果、质量抽查、失败分类及首版接入建议有可追溯证据 | 现有首版 renderer / contracts |
| F27 AI Configuration | 可保存/修改/清除基础 Provider、Model、凭据和必要参数，入口明确当前模型 | F26 接口与能力选择结论 |
| F28 Document Analysis Entry | 确认模型 → 选择文档 → 确认本次输入，入口清楚且文件错误可理解 | F27；输入格式和边界确认 |
| F29 End-to-end Analysis | 点击分析 → 阶段状态 → 校验 / 装配 → 当前资料包 → 现有 L0 / L1 / L2，失败/取消保留旧结果 | F26–F28 |
| F30 Analysis Entry UI Refinement | 首次使用的顺序、默认状态、错误与完成动作清楚，真实首次操作验收 | F29 实际流程 |

F28 不展示假的“分析完成”；实际分析任务由 F29 接通。入口 UI 在 F27/F28 就要基本可用，F30 依据已跑通的真实链路统一整理。

## F26 experiment proposal

2026-10-06 已核对 [DeepSeek 官方模型说明](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)：建议先以官方 `deepseek-flash` 为候选基准，具体端点仍需与用户可用服务核对。模型别名/版本可能变化，每次运行记录实际 model 和服务，执行前再次核对；官方支持 JSON 输出不等于自动符合本项目 Schema。

推荐沿用分阶段生成与确定性装配，分别评估模型能力。一次请求生成所有 JSON 可作为有预算的对照，但不作为首版默认：失败定位和来源/身份一致性更难。直接先做界面再串现有脚本也不推荐：上述预备数据依赖尚未消除。

建议首轮使用已知 context-consumption 原文作基准，再选一篇非 Gold 的文档检查样本依赖；先用用户选择的 DeepSeek，同文档/模型至少两次。具体模型、第二篇文档和调用预算确认后再运行；后续其它模型使用同一评价方式比较。单一模型试验只能建立基准，不宣称已比较不同模型的质量或选出最优模型。

实验首先明确并验证完整生产路径：

```text
当前文档快照 + 确定性章节坐标
  → 语义抽取 / 审阅数据 / Map 与解释 / Plan（阶段顺序及衔接待实验确定）
  → 按 Plan 逐块生成表达
  → 现有校验 + 确定性装配
  → 显式配对 Reading Bundle
  → 现有 Renderer 的 L0 / L1 / L2 / 来源回查
```

Review 的生成、Map 与 Plan 的显式 Block 引用、Guide 与 Map/原文绑定都是实验项。Map SU 与 Plan SU 不能按同名 ID 合并；原文声明不能升级成源码核实；不伪造审阅对象或为空集补默认值来逃过必需输入。

区分两种运行：诊断运行可固定 Gold 输入隔离单阶段质量，必须标明用了 Gold；完整运行只以当次原文和已确定的任务模板/合同为输入，不能混入另一份文章或人工填好的输出。目标是相近的覆盖、理解和展示质量，不要求不同模型字面输出或 ID 与 Gold 完全相同。

评价分开记录：

- 结构：JSON 可解析、Schema、受控词、外键、原文坐标、hash 与跨文件配对。
- 内容：关键语义、边界、例外、Current/Target、未决事项及来源准确性；现有 validator 没覆盖的部分需人工抽查。
- 展示：整篇导读、Topic 含义、Block 表达和回查是否能在现有界面完整使用。
- 稳定性与成本：重复运行的成功率/质量差异、分阶段时间、供应商返回的 token 用量与已知价格下的成本；数据不可得时写未知。

失败至少区分：凭据/端点、超时/取消/限流、输出截断、JSON/Schema 不合格、语义校验失败、引用/配对错误、部分 Block 失败。先保留原始结果，再报告失败；模型修正尝试单独记录并设次数上限，不静默补语义、改 validator 或无限重试。

## Product boundaries to confirm before implementation

- 当前支持 Markdown；首版建议继续 Markdown，PDF/Word 的解析不夹带进本阶段。具体输入范围在 F28 合同确认。
- 配置持久化在本机，凭据经主进程管理且不进入 renderer、Git 或实验记录；加密存储与可用性在 F27 设计验证。设置展示 Provider/Model，任务启动冻结本次配置，中途修改只影响下次。
- 配置/打开文档/阅读旧结果不触发模型请求；用户显式开始分析才调用所确认的模型。此为未来行为要求，当前仍遵守 CONSTRAINTS 的离线入口边界，实施时同步更新。
- 一次分析一个独立目录；开始任务不覆盖旧资料包或人工审核。校验与 prepare/commit 成功后才打开新结果，取消/失败/过期回复保留旧 session。
- 完整成功应包含 Map/导读与主题解释、有效 Plan、全部所需 Block 表达和来源绑定；只完成部分阶段不能显示完整成功。可读取的部分结果如何开放，待 F29 明确，并沿用 Unknown/Missing 等既有语义。
- AI 不写 human-review、不批准 Decision、不生成 HTML；不扩大 shape/关系词表和 Reading 能力。文档中的指令属于待分析内容，不成为模型的任务指令。

## Evidence and storage

实验原始请求/响应、失败和参数放独立 `artifacts/experiments/` run，结论与质量抽查放 `docs/log/artifacts/F26-ai-integration-experiment/`，通过实验索引关联。可打开的本地分析资料放 `workspace/analyses/<document>/<analysis>/`，同篇配套文件放一起。密钥不记录；私有文档和包含其内容的产物不入库。成功校验日志不新增永久 txt，临时文件遵守 agent.md 清理规则。

本轮交付是阶段登记与实验合同草案；没有执行新模型实验、没有增加产品代码。首轮 Provider 已选择 DeepSeek，尚未确定具体模型/端点或取得实验结果。
