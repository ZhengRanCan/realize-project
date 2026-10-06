---
id: F26
title: AI Integration Experiment
version: v0.1
status: not_started
dependsOn: ["F24","F25","F23","F18"]
scope: {"code":["scripts/ai-plan.js","scripts/ai-block.js","scripts/run-semantic-grounding.js","scripts/generate-framework-map.js","scripts/assemble-overview.js","scripts/export-reading-bundle.js","scripts/ai-integration-experiment*.js","scripts/helpers/ai-experiment-*.js","prompts/*.prompt.md"],"tests":["scripts/test-ai-integration-experiment*.js","scripts/test-generate-framework-map.js","scripts/test-semantic-grounding.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F26-ai-integration-experiment/**","docs/progress.md","prompts/README.md","artifacts/experiments/**","docs/log/artifacts/F26-ai-integration-experiment/**"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["原文 → 当次AI产物 → 校验/装配 → 资料包 → 现有L0/L1/L2与来源"],"integrationEvidence":[],"knownUnverified":["首轮Provider已选DeepSeek；具体模型/端点/接口与预算未确定，未执行新实验","任意文档的Review生成、Map/Plan引用、readingGuide及来源衔接待验证","重复稳定性及完整结果尚无证据"],"humanReviewRequired":["用户确认具体实验输入与运行范围","用户抽查完整结果并接受首版接入建议"]}
---

# F26 AI Integration Experiment

## Goal

确认 AI 如何替代当前人工/实验的数据准备，产出可由现有 Renderer 展示的完整分析资料包；按用户选择先建立 DeepSeek 稳定性与质量基准，交付失败处理建议和后续产品接入边界，保留其它模型的后续比较方式。

## Process preconditions

- 用户于 2026-10-06 要求切换开发重心：暂停 Reading 扩展，先 AI 实验，再配置/选文档/完整链路，最后整理入口 UI。
- 当前只登记合同与探查结论，尚未开始实现或调用模型；[路线与实验提案](../../../AI_INTEGRATION_ROADMAP.md)中的模型、预算、阶段衔接须先确认。
- 跨模块产品接入按 brainstorming 的架构路径完成设计与计划；F26 实验问题与探测范围先确认。实验结论不能直接当成 F27–F30 的实现设计批准。
- 沿用现有 Schema、Reading/Map 合同、validator、bundle/session 和 Renderer。F07/F10 的历史问题不因本任务自动关闭。

## Scope

### Allowed changes

- 核查现有生成路径对 Gold、样本坐标和人工增强 Map 的依赖，明确每个阶段输入、输出和校验器。
- 经确认后编写最小实验驱动/模板适配，复用现有装配与资料包导出；运行和记录 DeepSeek 重复实验。
- 验证 Review 生成、Map/Plan 显式引用和 readingGuide 的来源绑定，所有数据仍落在现有结构内。
- 将固定 Gold 诊断和仅由原文生成的完整运行分开记录；用第二篇文档检查样本依赖。
- 用现有 Electron/Preview 打开真实结果，记录结构、语义、展示、稳定性、时延/用量及失败类别。

### Out of scope

- AI 配置持久化、产品分析入口/任务控制器、解释页导航重排、Reading 各层能力扩展。
- 为模型过校验放宽 Schema/validator、新增形状/关系词或改变 authority/identity。
- AI 直接生成 HTML、写人工审批、伪造源码核实或静默补关系/坐标。
- 产品级自动修复/无限重试，读取或泄露本机其它服务凭据，默认把私有文档提交 Git。

## Acceptance Criteria

- [ ] 确定 DeepSeek 的具体模型、端点/接口、文档/重复次数与预算；实际参数、模板/原文指纹和结果可追溯。
- [ ] 完整链路不依赖样本 Gold/人工补数据，第二篇文档不串用旧坐标或旧 Review；诊断运行明确标记固定输入。
- [ ] 产物沿用现有结构并经适用校验链/显式配对；同名 Map/Plan SU 不合并，来源和审阅链保持独立。
- [ ] 现有 Renderer 实际显示完整 L0/L1/L2：包括已确定的导读/解释、Topic 的真实 Block 引用、全部所需表达及来源回查。
- [ ] 分别报告结构合规、重要语义/来源准确性、可读性和重复稳定性；不能用 Schema PASS 替代质量结论。
- [ ] 失败样本和离线失败模拟覆盖传输、截断、格式、校验、引用以及部分阶段失败；不覆盖成功产物，不静默修补。
- [ ] 实验索引、脱敏记录、结论、独立审查与现有回归完成；用户接受首版接入建议，若目标未达到则保持 blocked 并明确原因。

## Risks and compatibility

现有脚本并非任意文档的完整生产流水线；结构通过也可能缺少关键语义。实验只对所测文档/模型作结论。复用历史输入时保留原始字节和参数；生成运行放新目录，不修改 Gold 来迎合模型。

## Completion evidence

实施时建立 `docs/log/artifacts/F26-ai-integration-experiment/`，登记 verification-summary、质量抽查和 independent review；原始 run 在实验目录并更新索引。当前目录只有未开始的合同，不表示已有实验或功能证据。单模型首轮不代表跨模型比较完成。

## Registration verification — 2026-10-06

仅完成代码阅读与阶段登记；文档引用和 harness 元数据检查通过（165 Markdown / 25 features），git diff --check 通过。未运行新产品测试或模型实验，未建立实验 artifact，也不将本轮文档检查登记为 AI 能力证据。
