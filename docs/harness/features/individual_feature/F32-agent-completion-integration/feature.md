---
id: F32
title: Agent Completion Gate and Bundle Integration
version: v0.1
status: not_started
dependsOn: ["F31","F18","F23","F24","F25"]
scope: {"code":["app/agent/core/completion*.js","app/agent/core/artifact*.js","app/agent/tools/assembly*.js","app/agent/tools/bundle*.js","app/agent/trace/*.js","app/agent/index*.js","scripts/assemble-overview.js","scripts/export-reading-bundle.js","scripts/agent-run*.js","prompts/agent-system*.md","package.json"],"tests":["scripts/test-agent-completion*.js","scripts/test-agent-integration*.js","scripts/test-reading-bundle*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/notes/single-agent-harness-design.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F32-agent-completion-integration/**","docs/log/artifacts/F32-agent-completion-integration/**","docs/progress.md","workspace/README.md","prompts/README.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["离线受控模型驱动真实内核/工具/校验 → 装配 → verify_bundle → 现有L0/L1/L2","伪完成/上游变更/缺Block/取消 → 不完成、不发布旧校验对应的新包"],"integrationEvidence":[],"knownUnverified":["产物版本依赖、完成策略与原子发布设计未确认或实施","真实模型生成质量独立归F33，不由离线集成推断"],"humanReviewRequired":["用户确认程序完成标准、轨迹和原Renderer结果交接；不把结构完成称为语义理解通过"]}
---

# F32 Agent Completion Gate and Bundle Integration

## Goal

宿主程序根据当前产物及校验版本判定完成，串通单 Agent、真实领域工具、装配与资料包验证；确保可交付现有 Renderer 的完整结果，保留足以定位全过程的 trace。

## Process preconditions

- F26/F31 提供真实内核与工具；当前仅登记，开工前确认[架构草案](../../../../notes/single-agent-harness-design.md)中的完成与发布边界。
- 模型响应可用离线受控轨迹驱动；工具、validator、文件与 bundle 必须真实执行。F33 再证明实际模型能独立生成这些内容。
- 完成门禁不是 Decision 的人工审批 Gate，也不等于内容质量 eval。

## Scope

### Allowed changes

- 完成策略：检查必需inventory/Review/Map/selection/Plan、全部所需表达、导读/主题解释、来源、装配及完整bundle的当前有效证据。
- 现有 assemble/export/verify 领域工具和最小独立CLI入口；复用导出校验，不重新定义文件协议或哈希兼容规则。
- 原文/Plan/Map/Block版本依赖：上游变更失效旧校验及依赖产物，completion核对实际字节/绑定，不信任模型写的PASS标记。
- 完成请求拒绝时向Agent返回具体缺项；在有限预算内允许模型修正候选，保留原始失败及修正次数，不程序补语义。
- 发布到新目录的事务边界，取消/失败/迟到回复不能发布；跨run独立，不修改已有结果和人工审核。
- 完整trace/report记录请求、工具、产物版本、校验、预算/已知用量和终止原因；内容可含私有原文时遵守本地保留/不入库策略。

### Out of scope

- 真实模型质量、成本/稳定性对比归 F33；Electron启动/配置/状态UI归 F27–F30。
- 长期Memory、自动恢复/检查点、压缩历史、可视trace viewer、通用事件系统。
- 让LLM宣布成功、借旧版本通过结果、放宽validator、掩盖warnings/Unknown或写人工审核。

## Acceptance Criteria

- [ ] 当前数据满足所有必需结构/配对和既有校验规则才完成；缺表达/Review/Guide/引用/来源时不称完整成功。
- [ ] 原文/Plan/Map或Block变更后旧证明失效；同run旧PASS、另一run的PASS及模型伪PASS均不能完成。
- [ ] Agent自称完成被拒绝且收到可定位缺项；修正须重新验证当前版本，预算/取消仍有效。
- [ ] 真实装配/export/verify采用既有协议，输出新目录，read-back通过才提交；失败/取消不留一个被称为成功的半包。
- [ ] 离线轨迹驱动真实工具生成完整测试包，现有Electron/可搬迁Preview实际L0/L1/L2/核查/返回可用；标明受控输入而非真实AI生成。
- [ ] 请求/工具调用ID、版本/校验、修正与终止形成可追溯轨迹；密钥不记录，费用不可得写未知。
- [ ] 伪完成、过期校验、缺项、装配失败、重复提交、取消/迟到和跨run回归通过，既有语义门禁不变。
- [ ] 独立审查、用户完成策略/交接验收及文档门禁完成后passing；真实模型能力另验。

## Risks and compatibility

“曾通过”不是“当前通过”。必须记录校验的输入版本及依赖闭包，而不是几个布尔字段。原资料包可读取的降级语义保留，但完整分析成功与可打开的部分结果严格区分。trace是运行证据，artifact是任务结果，二者都不是跨任务Memory。

## Completion evidence

实施后在 `docs/log/artifacts/F32-agent-completion-integration/` 记录真实离线工具链、版本失效反例、bundle/render与独立审查。产品结果留在本地分析目录；本轮仅登记。
