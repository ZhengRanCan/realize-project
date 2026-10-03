# Entry and Repository Layout Design

## Status and Intent

Date: 2026-10-03. Direction: approved by user. Written design: awaiting review.

用户反馈 Electron 首屏混杂多个版本入口，仓库目录按历史 feature 零散形成。
已批准方向：正常首页突出资料包；旧入口放默认折叠区域；目录按用途分区，测试材料按文章归拢。
用户要求单独登记为 F22。本设计不改变 F18 已完成的 Reading 输入或认知语义。

## Start Screen

正常首屏展示产品名称、简短阅读说明和“打开分析资料包”。说明选择一份清单即可加载相关材料。

默认关闭的“开发与旧版入口”包含：

- 选择 Markdown 与使用测试样本，保留现行操作功能。
- 加载 Gold fixture 和其它 design-review JSON。
- 单独加载 framework-map JSON。

保留既有按钮 ID 和事件绑定，降低兼容成本；旧按钮使用次级样式。
未启用的 Source 目录选择及过时 Phase 2 提示从首屏移除，其历史背景归文档。
本轮不改阅读页信息架构、审核语义、L0–L3 导航或 F21 的整体视觉设计。

## Repository Responsibilities

```text
docs/                       项目规范、任务、进度、决策、验收与历史设计说明
samples/<document>/         测试原文与标准分析输入，同一文章放一起
prompts/                    被生成脚本读取的提示词模板
artifacts/experiments/      原始实验请求、响应、运行记录、报告与索引
workspace/
  analyses/<document>/<analysis>/  本地可打开的资料包及用户审核
  tmp/                            本地临时产物和未归类草稿
  references/                     外部参考仓库
  previews/                       当前 renderer 生成的本地只读预览
app/ schema/ scripts/       现有应用、结构契约与工具代码
```

docs 继续保留 harness/features、specs、progress、decisions、notes、prototypes、log/artifacts。
feature 的简要结论/审查证据放 docs，实验原始 run 放 artifacts/experiments，两者分别承担说明和原始数据的职责。
workspace 只跟踪根部使用说明，其 analyses/tmp/references 及人工数据全部忽略 Git。

## Sample Organization

每篇文章使用稳定的文档目录名；迁移不补造不存在的分析材料。

| Existing source | Sample directory |
| --- | --- |
| 测试文档/18-context-consumption-semantic-model.md | samples/context-consumption/ |
| 测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md | samples/canonical-hash-integrity/ |
| 测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md | samples/candidate-inbox-profile/ |
| 测试文档/fixture-d-goal-plan-task-state-model.md | samples/goal-plan-task-state/ |
| 测试文档/fixture-e-f13-f16-runbook.md | samples/operational-runbook/ |

各篇原文命名 source.md，现行手工 Map 命名 framework-map.json。
context-consumption 另包含 design-review.json、overview-plan.json、source-sections.json 与 human-review.sample.json。
其余文章目前只有 source 和 Map，保留这一区别。samples 的 README 记录文章类型、来源、既有哈希及当前输入文件。

现行手工 Map 来自 F04、F05、F09 artifact 的 drafts；它们作为当前测试输入迁到相应 samples 目录。
早期 F03 archive 的 Map 保持为历史设计记录，不冒充现行测试输入。
原文、Gold、Map、章节 registry 与人工样例保持原始字节；其内部历史路径由明确映射处理。

## Prompts

提示词是生成脚本给大模型的任务说明；原文是其输入，结构化 JSON 是其输出。
正常 Electron 资料包阅读不执行提示词，也不调用模型。

| Template | Consumer | Task |
| --- | --- | --- |
| ai/stage1-plan.prompt.md | scripts/ai-plan.js | 将重要语义组织成解释区块规划 |
| ai/stage2-blocks.prompt.md | scripts/ai-block.js | 按既定规划生成区块表达 |
| ai/framework-map-generation.prompt.md | scripts/generate-framework-map.js | 直接从文档生成框架图 |
| ai/semantic-inventory.prompt.md | scripts/run-semantic-grounding.js | 先提取语义单元 |
| ai/framework-map-synthesis.prompt.md | scripts/run-semantic-grounding.js | 根据文档与语义单元生成框架图 |

以上五份移到 prompts，保持文件名、正文和指纹；README 标注消费者及生成路线。
直接生成框架图与两步生成属于不同路线，保留实际消费者，不以“重复文件”删除。
ai/analysis-protocol.phase2.md 是未接入的旧协议草稿，归 docs/notes 的历史设计说明，并明确其状态。
本轮只整理位置和当前入口说明，不修改模型策略或宣称旧协议已投入使用。

## Migration and Compatibility

整体迁移 experiments 到 artifacts/experiments，保留区域、run 编号与内部层级；
bundles 的分析目录迁到 workspace/analyses；tmp 整体保留到 workspace/tmp；docs/ref 迁到 workspace/references。

迁移前建立清单与内容指纹，排除 Git 内部目录的工具性检查；搬迁后逐文件核对。
本地目录完整保留，证据只记录核对结果，不将其内容加入 Git。
目录操作先检查源和目标的实际绝对路径位于仓库预期位置，目标碰撞时停止，不覆盖用户数据。
空旧目录仅在确认搬迁完整后移除，不对 tmp 进行清空或随意筛删。

仓库默认路径及旧路径对照集中维护，供 CLI、生成器、validator、测试与 Electron 的开发入口共用。
样本按确切旧路径逐项映射；实验整体路径前缀只映射到明确的新实验根目录。
映射不按文件名或标题相似度推断输入配对，不跟随不存在的文件，不放宽 bundle 目录边界。

历史 Plan.designRef.path、Map.document.sourcePath、原始 request/run-meta/日志/Generated 的内容不重写。
尤其保持 Plan 的原始哈希及其 Generated fingerprint；工具在读取仓库输入时解析已登记的路径映射。
运行时资料包仍只跟随 manifest 中的目录相对路径；仓库旧路径映射不参与 bundle 文件解析。
旧来源字段只是历史路径兼容，不成为新的语义关系或 cross-namespace bridge。

更新脚本默认位置、CLI 的已知旧输入路径解析、package 命令、当前 README/harness/spec 示例与文档路由。
历史证据保持原文，在统一路径对照中解释旧位置；文档检查同时识别新根和明确旧映射，不能靠整体跳过掩盖坏链接。
实验 index 可以重建其位置字段；必须保留原有单元、feature 归属与产物关系。
新运行使用新路径；历史 run 无自动重跑或重新调用模型。
历史 HTML 若依赖旧相对资源，保留它作为原始证据；当前查看和验证使用 workspace/previews 下新生成的预览。
不为修复旧快照链接覆盖历史 HTML；资料包的单文件便携 Preview 仍随本包放置。

## Verification and Delivery

顺序：记录迁移基线与路径目录 → 分组首页 → 迁移并接通所有引用 → 更新说明与索引 → 回归与独立审查。
书面实施计划将细化任务和每次搬迁的检查，当前文档不视为执行计划。

验收必须覆盖：

- 默认首屏只突出资料包，旧入口可键盘展开并实际使用。
- 五篇测试原文、Gold/Map/registry、五份提示词、历史实验和本地资料搬迁完整。
- 既有 validator、生成器 stub、Reading projection、session/save 与 Preview 不退化。
- 从搬迁后的资料包走 Map → Topic → Block → 原文/审阅材料两条路径；审核仍保存于当前包。
- 文档与实验索引门禁、迁移专项回归、真实 Electron 集成及独立审查。

feature、设计、计划与完成证据集中在现有 F22 合同和 artifact 目录，不另建管理体系。

## Review Checklist

- [x] 用户反馈的首页和七类目录都有明确去向。
- [x] 原文与相关测试数据按文章归拢；提示词与旧协议草稿分开。
- [x] 原始字节、Plan fingerprint、历史引用和本地审核的兼容方案明确。
- [x] 本地文件保留、目标碰撞、Git 忽略与运行时边界有约束。
- [x] 未包含 F19/F20/F21 实现或模型调用；验收区分登记和产品完成。
- [ ] 用户审阅书面设计。
- [ ] 形成并审阅书面实施计划，选择执行方式。
