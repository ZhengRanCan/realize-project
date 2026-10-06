---
id: F31
title: Agent Domain Workspace and Tools
version: v0.2
status: not_started
dependsOn: ["F26"]
scope: {"code":["app/agent/tools/source*.js","app/agent/tools/contract*.js","app/agent/tools/artifact*.js","app/agent/tools/validation*.js","app/agent/tools/domain*.js","scripts/assemble-overview.js","scripts/check-map.js","scripts/check-plan.js","scripts/check-block.js","scripts/check-overview.js","scripts/run-semantic-grounding.js","scripts/ai-plan.js","scripts/ai-block.js","prompts/agent-system*.md","package.json","app/agent/domain/*.js"],"tests":["scripts/test-agent-domain*.js","scripts/test-agent-artifact*.js","scripts/test-check-map.js","scripts/test-check-plan.js","scripts/test-check-block.js","scripts/test-semantic-grounding.js","scripts/test-agent-bootstrap*.js","scripts/test-agent-dependencies*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/notes/single-agent-harness-design.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F31-agent-domain-tools/**","docs/log/artifacts/F31-agent-domain-tools/**","docs/progress.md","prompts/README.md","docs/harness/incidents/2026-10-06-harness-contract-review.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.2","l3":"required","userPath":["Host prepare_run_input → 原字节/hash/确定性coordinates/run workspace → Agent starts","Agent调用受控Source/Contract/Artifact工具 → 当前run产物 → 既有validator结果","不允许的读取/写入/引用/参数 → 明确拒绝且不改旧文件"],"integrationEvidence":[],"knownUnverified":["工具签名、Host bootstrap、artifact生命周期/直接依赖/工作目录已有草案，实施接口/计划未确认","Review生产及领域Context Policy、版本/证明账本尚未实施"],"humanReviewRequired":["用户确认领域工具足以生产现有资料包必需数据且权限边界清楚"]}
---

# F31 Agent Domain Workspace and Tools

## Goal

宿主先冻结本次文档、生成确定性坐标和run workspace，再让单Agent通过窄工具读原文/合同、提交候选并执行既有验证；F31拥有领域Context Policy、产物生命周期和直接依赖记录，模型无任意文件/shell权限。

## Process preconditions

- 用户要求扩充 Single-Agent Harness，当前仅登记。F26 内核先 passing；工具接口与存储边界在实现前书面确认。
- [架构草案](../../../../notes/single-agent-harness-design.md)补齐附件未列出的 `write_design_review`：Reading Bundle 必需 Review，不得借默认 Gold 代替。
- 现有 checkMap/checkPlan/checkBlock/checkOverview 已有导出函数；优先复用。确需固定脚本适配时命令/参数由宿主确定，不把通用执行器暴露给模型。

## Scope

### Allowed changes

- Host prepare_run_input（不是Agent Tool）：冻结原字节、完整hash、复用buildSourceRegistry/parseDocHeadings生成坐标、原子创建run；合法输入准备成功才启动Agent，改选原文建立新run。
- 领域Context Policy按产物生产输入表控制请求，Core不解释Stage；不让其他artifact的隐藏语义输入绕过依赖记录。

- Source、Contract 和 Artifact 读取工具，仅针对当前 run 文档快照、固定合同与当前产物。
- inventory、design-review、Map/selection、Plan、Stage2 Block 的写入工具；包含 readingGuide/显式引用及程序注入的固定字段。
- 对应现有校验工具及可追踪的失败查看；保留原始 verdict/errors/warnings，不复制或放宽判定规则。
- 依设计草案的直接依赖表登记Draft、有效产物、版本/指纹、生成read set和校验proof；保留失败候选，合法提交与替换有原子边界。
- namespace、run ID、Block ID 和显式 source 绑定；源快照与坐标固定，Map SU 与 Plan SU 不按同名合并。
- 最小提取既有可复用纯逻辑，必要共享变动登记原因/影响/回归。生成建议由外层 Agent 产生，领域工具不再秘密调用模型。

### Out of scope

- 模型工具直接选择任意路径、执行命令、修改合同/validator、访问其它run或修改human-review。
- 复制另一套语义判定或以程序补关系/坐标让模型结果过门禁。
- 完整 bundle completion 与集成归 F32；真实生成质量归 F33；不在本项改 Renderer。

## Acceptance Criteria

- [ ] Host bootstrap真实读取/冻结当前文档并生成匹配hash的坐标；不是模型产物/Agent Tool，无效输入/取消不启动模型，不串用默认样本。
- [ ] lifecycle、run layout和direct dependency/proof ledger按设计表实现；生成来源和校验输入分开，修改Map不会自动使Plan失效，namespace/实际读取无隐式合并。
- [ ] F31拥有领域Context Policy与system instructions，按允许的输入集组装请求；Core不导入Map/Plan/Stage，候选实际输入集和指纹可取证。

- [ ] 工具以 Registry 的确定签名暴露，原文/合同读取、全部必需产物写入与校验均有真实实现。
- [ ] 包含当前文档自己的 Review 生产入口，决策恒 pending、原文声明不变成 source-verified；无模型审批写入。
- [ ] 只允许当前run已声明文件/对象；越界路径、链接、异常ID、超容量、未知工具拒绝且无不应有副作用。
- [ ] 模型提交内容不覆盖程序固定字段/来源空间；draft/commit失败、重复请求和版本变化行为明确可追踪。
- [ ] 来源、Map/Plan身份及引用遵守现有合同；不把 Unknown 转为空集，不默认读取旧样本/坐标。
- [ ] validator工具与现有函数/脚本对同一输入给出相同结果；错误/警告可定位到实际版本，原始失败保留。
- [ ] 工具内部零模型调用，不复制生成loop；与F26真实Runner的调用/observation组合离线通过。
- [ ] 边界/故障测试、既有回归、独立审查及用户工具边界验收通过后 passing。

## Risks and compatibility

旧脚本有 CLI 副作用与样本默认输入，不能把整段 runner 当纯函数导入。artifact 写入合法不等于语义通过；修改上游应使相关校验失效，F32消费当前版本闭包。禁止改 Gold 或历史失败数据。

## Completion evidence

实施后记入 `docs/log/artifacts/F31-agent-domain-tools/`，包括真实工具/validator parity、当前run隔离与独立审查；当前没有工具代码或完成证据。

## Pre-implementation feedback correction — 2026-10-06

本项明确承担Domain Workspace和Tools，不继续拆feature。设计稿补齐Host bootstrap、生命周期、直接依赖/证明闭包及run布局，Source/Coordinates不由Agent生成。F31记录版本与实际边，F32核对闭包；源码尚未修改。
