---
id: F33
title: AI Integration Experiment
version: v0.3
status: not_started
dependsOn: ["F32"]
scope: {"code":["scripts/ai-integration-experiment*.js","scripts/helpers/ai-experiment-*.js","prompts/experiments/agent-system-*.md","prompts/eval*.md","package.json"],"tests":["scripts/test-ai-integration-experiment*.js","scripts/test-ai-experiment-eval*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F33-ai-integration-experiment/**","docs/progress.md","prompts/README.md","artifacts/experiments/**","docs/log/artifacts/F33-ai-integration-experiment/**","docs/harness/incidents/2026-10-06-harness-contract-review.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.3","l3":"required","userPath":["原文 → 当次AI产物 → 校验/装配 → 资料包 → 现有L0/L1/L2与来源"],"integrationEvidence":[],"knownUnverified":["F26/F31/F32尚未实施，待通过后执行真实模型实验","首轮Provider已选DeepSeek；具体模型/端点/接口与预算未确定，未执行新实验","任意文档的Review生成、Map/Plan引用、readingGuide及来源衔接待验证","重复稳定性及完整结果尚无证据","实验driver/eval/trajectory指标尚未实现；真实未观测失败不当成通过"],"humanReviewRequired":["用户确认具体实验输入与运行范围","用户抽查完整结果并接受首版接入建议"]}
---

# F33 AI Integration Experiment

## Goal

确认 AI 如何替代当前人工/实验的数据准备，产出可由现有 Renderer 展示的完整分析资料包；按用户选择先建立 DeepSeek 稳定性与质量基准，交付失败处理建议和后续产品接入边界，保留其它模型的后续比较方式。

## Process preconditions

- 原F26实验合同在未开始/无run状态迁至F33；2026-10-06用户要求Harness先行。F26/F31/F32 runtime与真实工具先完成，本实验消费同一运行时，不另外造生成loop。

- 最初登记时用户要求暂停Reading扩展，先AI实验再产品入口；本次按后续Harness先行要求调整顺序，完整实验验收要求保留。
- 当前只登记合同与探查结论，尚未开始实现或调用模型；[路线与实验提案](../../../AI_INTEGRATION_ROADMAP.md)中的模型、预算、阶段衔接须先确认。
- 跨模块产品接入按 brainstorming 的架构路径完成设计与计划；F33 实验问题与探测范围先确认。实验结论不能直接当成 F27–F30 的实现设计批准。
- 沿用现有 Schema、Reading/Map 合同、validator、bundle/session 和 Renderer。F07/F10 的历史问题不因本任务自动关闭。

## Scope

### Allowed changes

- 仅新建prompts/experiments/agent-system-*.md变体及eval模板；run冻结base hash、变体版本、实际发送文本hash与policy/runtime基线，不改canonical。
- 独立QualityEvaluation sidecar绑定manifest与不可变文件闭包指纹及evaluator/rubric；同subject可有多份评价，质量状态为匹配评价投影，不写bundle/artifact/human-review。

- 核查现有生成路径对 Gold、样本坐标和人工增强 Map 的依赖，明确每个阶段输入、输出和校验器。
- 经确认后编写调用F26/F31/F32 runtime的实验驱动和独立质量评估，复用现有装配与资料包导出；运行和记录DeepSeek重复实验。内核/领域工具缺陷返回其所属feature修正。
- 验证 Review 生成、Map/Plan 显式引用和 readingGuide 的来源绑定，所有数据仍落在现有结构内。
- 将固定 Gold 诊断和仅由原文生成的完整运行分开记录；用第二篇文档检查样本依赖。
- 用现有Electron/Preview打开真实结果，独立评价结构、语义/来源、展示、稳定性、真实模型失败和trajectory；结构完成保持与quality_status分开。
- 明确记录turn/tool/source read/validation failure/repair/invalid tool/completion rejection/artifact rewrite计数、tokens/latency/cost和termination reason；指标取真实trace，用量不可得写未知。

### Out of scope

- AI 配置持久化、产品分析入口/任务控制器、解释页导航重排、Reading 各层能力扩展。
- 为模型过校验放宽 Schema/validator、新增形状/关系词或改变 authority/identity。
- AI 直接生成 HTML、写人工审批、伪造源码核实或静默补关系/坐标。
- 产品级自动修复/无限重试，读取或泄露本机其它服务凭据，默认把私有文档提交Git。
- 修改旧ai-plan/ai-block/semantic-grounding/framework-map生成脚本、assembler/exporter或runtime实现；本项只调用。发现缺陷回所属feature登记修正，再重新冻结实验基线。
- 重做F26–F32完整离线故障矩阵；本项离线测试只验证实验driver、指标汇总与独立eval自身。

## Acceptance Criteria

- [ ] 实验不改canonical prompt，每run的base/variant/actual prompt和runtime/policy指纹可追溯；输入集合变体受F31策略约束。
- [ ] QualityEvaluation仅作为外部sidecar保存，subject绑定实际校验的manifest与不可变文件闭包；换rubric可并存，新文件版本不得套旧评价，原bundle与human-review字节不变。

- [ ] 确定 DeepSeek 的具体模型、端点/接口、文档/重复次数与预算；实际参数、模板/原文指纹和结果可追溯。
- [ ] 使用同一Single-Agent runtime独立完成真实生产；完整链路不依赖样本 Gold/人工补数据，第二篇文档不串用旧坐标或旧 Review；诊断运行明确标记固定输入。
- [ ] 产物沿用现有结构并经适用校验链/显式配对；同名 Map/Plan SU 不合并，来源和审阅链保持独立。
- [ ] 现有 Renderer 实际显示完整 L0/L1/L2：包括已确定的导读/解释、Topic 的真实 Block 引用、全部所需表达及来源回查。
- [ ] 分别报告结构闭包状态、重要语义/来源准确性、可读性与重复稳定性；quality_status及评价版本单独记录，不能用Schema/结构完成替代质量结论。
- [ ] trajectory指标由当前trace按明确计数规则汇总，修正/改写有因果引用；能比较同样质量结果的运行代价，用量未知不按0计算。
- [ ] 报告真实API传输失败、模型截断/非法tool call、validator恢复和repair loop等实际行为；没有出现的类别标not_observed，不宣称已通过也不为凑失败故意增加模型调用。不重做Core故障矩阵，原始轨迹保留。
- [ ] 实验索引、脱敏记录、结论、独立审查与现有回归完成；用户接受首版接入建议，若目标未达到则保持 blocked 并明确原因。

## Risks and compatibility

现有脚本并非任意文档的完整生产流水线；结构通过也可能缺少关键语义。实验只对所测文档/模型作结论。复用历史输入时保留原始字节和参数；生成运行放新目录，不修改 Gold 来迎合模型。

## Completion evidence

实施时建立 `docs/log/artifacts/F33-ai-integration-experiment/`，登记 verification-summary、质量抽查和 independent review；原始 run 在实验目录并更新索引。当前目录只有未开始的合同，不表示已有实验或功能证据。单模型首轮不代表跨模型比较完成。

## Original F26 registration verification — 2026-10-06

下列为原F26登记历史，不代表F33实验已经执行。仅完成代码阅读与阶段登记；文档引用和 harness 元数据检查通过（165 Markdown / 25 features），git diff --check 通过。未运行新产品测试或模型实验，未建立实验 artifact，也不将本轮文档检查登记为 AI 能力证据。

## Pre-implementation feedback correction — 2026-10-06

scope缩为实验driver/recorder/eval及明确的agent/eval模板，不允许边实验边改旧生成脚本或runtime。故障矩阵归F26–F32，F33记录真实模型行为与轨迹指标。quality_status独立于结构完成，当前仍not_started。

## Ownership cleanup — 2026-10-06

第二轮反馈认可feature分层。本轮收紧legacy/canonical prompt写权限，补齐Context非固定workflow、graph-driven失效及独立QualityEvaluation绑定验收；仍not_started，未运行模型或实现代码。
