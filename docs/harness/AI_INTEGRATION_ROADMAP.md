# AI Integration Roadmap

Date: 2026-10-06.

本文件记录用户确认的阶段目标，以及据此提出的任务拆分。它是阶段路线，不替代现有 Schema、Reading Contract 或尚待确认的实现设计。用户追加选择“先Deepseek吧，比较便宜”；首轮先使用 DeepSeek 建立完整链路与重复稳定性基准，其它模型对比后置。具体模型、端点、接口适配方式及实验预算未确定，本轮不调用外部模型。

## User direction

用户确认“目前 L0、L1、L2 的第一版基本完成”。以现有实现作为首版基线，停止主动扩展 Reading 各层；后续根据实际使用和测试反馈再优化。

下一阶段的成功标志是：第一次打开软件的用户能确认 AI 模型，选择自己的文档，开始分析，看到阶段状态，最终进入完整的文档解释界面。AI 替代人工准备和实验生成过程，沿用已有数据结构、分析逻辑和 Renderer。

更新后的优先顺序：Single-Agent Harness内核 → 领域工具 → 完成门禁/资料包集成 → 真实AI实验 → AI配置 → 文档选择 → 完整产品分析链路 → 入口UI整理 → 实际使用 → 根据截图讨论解释页面顶部 → 后续各层改进。

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

## Registered feature sequence

2026-10-06 用户补充Single-Agent Harness架构草案，要求原F26改为Harness并扩充分工，原AI实验与F27–F30后移。原F26尚未实现、没有模型run，实验合同与完整质量验收迁到F33；F26更新为内核合同（本轮反馈后v0.3）。F27–F30保留编号，只调整依赖，避免已有引用整体重编号。全部仍为not_started。

| Order | Feature | Delivery | Required previous feature |
| --- | --- | --- | --- |
| 1 | [F26 Single-Agent Harness Core](features/individual_feature/F26-single-agent-harness/feature.md) | 通用loop/Provider/宿主Context Policy/State/Registry/trace/预算；不解释Reading语义 | 无Reading依赖 |
| 2 | [F31 Agent Domain Workspace and Tools](features/individual_feature/F31-agent-domain-tools/feature.md) | Host原文准备/确定性坐标/run workspace、领域Context、artifact生命周期/直接依赖和validator | F26 |
| 3 | [F32 Completion Gate and Bundle Integration](features/individual_feature/F32-agent-completion-integration/feature.md) | 当前版本完成门禁、真实装配/export/verify、离线完整工具链与Renderer交接 | F31 |
| 4 | [F33 AI Integration Experiment](features/individual_feature/F33-ai-integration-experiment/feature.md) | 原F26实验：真实DeepSeek生成、重复稳定性/质量/成本/失败抽查，使用同一runtime | F32 |
| 5 | [F27 AI Configuration](features/individual_feature/F27-ai-configuration/feature.md) | 基础配置保存/确认；接口和参数依Harness及实验结论 | F33 |
| 6 | [F28 Document Analysis Entry](features/individual_feature/F28-document-analysis-entry/feature.md) | 确认模型、选文档、当前输入快照与状态 | F27 |
| 7 | [F29 End-to-end Analysis](features/individual_feature/F29-end-to-end-analysis/feature.md) | Electron调用现成runtime，任务状态、取消与打开本次结果 | F28与Harness/实验 |
| 8 | [F30 Analysis Entry UI Refinement](features/individual_feature/F30-analysis-entry-ui/feature.md) | 基于实际完整链路整理首次入口体验 | F29 |

执行顺序为 **F26 → F31 → F32 → F33 → F27 → F28 → F29 → F30**；harness按依赖选任务，编号较小不表示忽略前置。此前聊天“F26”的L1解释修正由F23 v0.2承接；本轮更改的是后来实际登记的AI实验，二者不混。

[设计草案](../notes/single-agent-harness-design.md)记录参考附件、推荐方案与当前待确认的接口边界。本轮开工前反馈已补齐bootstrap、lifecycle、direct dependency/proof closure、workspace、结构/质量状态与trajectory。F33仅消费runtime，旧生成脚本不在实验修改scope；故障矩阵归F26–F32。登记不开始产品代码、依赖安装或外部模型运行。F26/F31/F32分别验内核、领域工具与离线完整集成；只有F33对真实模型生成质量作结论。

F28只准备输入，F29接通产品调用；F27/F28自身需要基本可用，F30不作为拖延入口可用性的理由。模型入口采用同一runtime，不在Electron内维护第二个Agent loop。

## F33 experiment proposal (moved from original F26)

2026-10-06 已核对 [DeepSeek 官方模型说明](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)：建议先以官方 `deepseek-flash` 为候选基准，具体端点仍需与用户可用服务核对。模型别名/版本可能变化，每次运行记录实际 model 和服务，执行前再次核对；官方支持 JSON 输出不等于自动符合本项目 Schema。

推荐沿用分阶段生成与确定性装配，分别评估模型能力。一次请求生成所有 JSON 可作为有预算的对照，但不作为首版默认：失败定位和来源/身份一致性更难。直接先做界面再串现有脚本也不推荐：上述预备数据依赖尚未消除。

建议首轮使用已知 context-consumption 原文作基准，再选一篇非 Gold 的文档检查样本依赖；先用用户选择的 DeepSeek，同文档/模型至少两次。具体模型、第二篇文档和调用预算确认后再运行；后续其它模型使用同一评价方式比较。单一模型试验只能建立基准，不宣称已比较不同模型的质量或选出最优模型。

实验在F26/F31/F32已通过的runtime上验证完整生产路径；所用Gold诊断与真实自主生成明确区分：

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

实验原始请求/响应、失败和参数放独立 `artifacts/experiments/` run，结论与质量抽查放 `docs/log/artifacts/F33-ai-integration-experiment/`，通过实验索引关联。可打开的本地分析资料放 `workspace/analyses/<document>/<analysis>/`，同篇配套文件放一起。密钥不记录；私有文档和包含其内容的产物不入库。成功校验日志不新增永久 txt，临时文件遵守 agent.md 清理规则。

本轮交付是Harness拆分、合同迁移与依赖调整；没有执行新模型实验、没有增加产品代码。首轮 Provider 已选择 DeepSeek，尚未确定具体模型/端点或取得实验结果。
