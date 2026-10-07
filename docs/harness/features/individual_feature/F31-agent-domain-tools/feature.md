---
id: F31
title: Agent Domain Workspace and Tools
version: v0.4
status: active
dependsOn: ["F26"]
scope: {"code":["app/agent/tools/source*.ts","app/agent/tools/contract*.ts","app/agent/tools/artifact*.ts","app/agent/tools/validation*.ts","app/agent/tools/domain*.ts","scripts/check-map.js","scripts/check-plan.js","scripts/check-block.js","scripts/check-overview.js","prompts/agent-system*.md","package.json","app/agent/domain/*.ts"],"tests":["scripts/test-agent-domain*.js","scripts/test-agent-artifact*.js","scripts/test-check-map.js","scripts/test-check-plan.js","scripts/test-check-block.js","scripts/test-semantic-grounding.js","scripts/test-agent-bootstrap*.js","scripts/test-agent-dependencies*.js"],"docs":["agent.md","docs/harness/AI_INTEGRATION_ROADMAP.md","docs/harness/ARCHITECTURE.md","docs/harness/CONSTRAINTS.md","docs/notes/single-agent-harness-design.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F31-agent-domain-tools/**","docs/log/artifacts/F31-agent-domain-tools/**","docs/progress.md","prompts/README.md","docs/harness/incidents/2026-10-06-harness-contract-review.md"]}
evidence: {"lastVerifiedAt":"2026-10-07","commands":[{"command":"node scripts/test-agent-clean.js","result":"passed"},{"command":"node scripts/test-check-plan.js && node scripts/test-check-block.js && node scripts/test-check-map.js && node scripts/test-semantic-grounding.js","result":"passed"}],"manualSmoke":"真实F26 Runner通过Domain Registry读取冻结source并由宿主CompletionPolicy终止；零模型调用。"}
completionGate: {"version":"v0.4","l3":"required","userPath":["Host prepare_run_input → 原字节/hash/确定性coordinates/run workspace → Agent starts","Agent调用受控Source/Contract/Artifact工具 → 当前run产物 → 既有validator结果","不允许的读取/写入/引用/参数 → 明确拒绝且不改旧文件"],"integrationEvidence":["scripts/test-agent-domain.js","docs/log/artifacts/F31-agent-domain-tools/verification-summary.md"],"knownUnverified":["首轮实现已完成；仍待更广对抗/parity验证和独立代码审查"],"humanReviewRequired":["用户确认领域工具足以生产现有资料包必需数据且权限边界清楚"]}
---

# F31 Agent Domain Workspace and Tools

## Goal

宿主先冻结本次文档、生成确定性坐标和run workspace，再让单Agent通过窄工具读原文/合同、提交候选并执行既有验证；F31拥有领域Context Policy、产物生命周期和直接依赖记录，模型无任意文件/shell权限。

## Process preconditions

- 用户要求扩充 Single-Agent Harness，当前仅登记。F26 内核先 passing；工具接口与存储边界在实现前书面确认。
- Reading Bundle必需Review，工具须包含write_design_review，不得借默认Gold代替。bootstrap、生命周期、实际read set和直接依赖设计依据本合同及现有规范在本feature内冻结；[旧架构讨论](../../../../notes/single-agent-harness-design.md)仅按需参考，不作为已冻结协议或前置必读。
- 现有 checkMap/checkPlan/checkBlock/checkOverview 已有导出函数；优先复用。确需固定脚本适配时命令/参数由宿主确定，不把通用执行器暴露给模型。

## Scope

### Allowed changes

- 新增app/agent源代码采用TypeScript，独立strict类型检查/编译；旧Electron、shared与scripts维持JavaScript。实现消费编译公共入口，JSON/工具数据仍走运行时校验。

- 唯一拥有canonical prompts/agent-system*.md的领域语义；F32只读，F33新建版本化实验变体，不覆盖canonical。

- Host prepare_run_input（不是Agent Tool）：冻结原字节、完整hash、复用buildSourceRegistry/parseDocHeadings生成坐标、原子创建run；合法输入准备成功才启动Agent，改选原文建立新run。
- 领域Context Policy按产物生产输入表控制请求，Core不解释Stage；不让其他artifact的隐藏语义输入绕过依赖记录。

- Source、Contract 和 Artifact 读取工具，仅针对当前 run 文档快照、固定合同与当前产物。
- inventory、design-review、Map/selection、Plan、Stage2 Block 的写入工具；包含 readingGuide/显式引用及程序注入的固定字段。
- 对应现有校验工具及可追踪的失败查看；保留原始 verdict/errors/warnings，不复制或放宽判定规则。
- 依本feature正式设计的直接依赖模型登记Draft、有效产物、版本/指纹、生成read set和校验proof；保留失败候选，合法提交与替换有原子边界。
- namespace、run ID、Block ID 和显式 source 绑定；源快照与坐标固定，Map SU 与 Plan SU 不按同名合并。
- 生成建议由外层Agent产生，领域工具零模型调用。旧生成脚本/assembler不在正常写scope；若确需纯helper提取，先登记具体路径、提取范围、唯一实现位置及旧消费者回归，再做最小改动。

### Out of scope

- 模型工具直接选择任意路径、执行命令、修改合同/validator、访问其它run或修改human-review。
- 复制另一套语义判定或以程序补关系/坐标让模型结果过门禁。
- 完整 bundle completion 与集成归 F32；真实生成质量归 F33；不在本项改 Renderer。

## Acceptance Criteria

- [ ] Context Policy只控制操作的合法输入/实际read set和前置，不固定生成顺序；Agent可选择当前合法操作，交换Inventory/Review独立分支顺序均可执行，依赖不足明确拒绝。
- [ ] operation切换不能把禁止输入作为全量conversation偷偷带回请求；Host记录真实序列化输入/指纹，保留正确tool调用配对和原始trace。
- [ ] canonical prompt由本feature独占修改，旧生成/assembler无正常写权限；需要纯helper提取时先登记scope并验证旧消费者。

- [ ] Host bootstrap真实读取/冻结当前文档并生成匹配hash的坐标；不是模型产物/Agent Tool，无效输入/取消不启动模型，不串用默认样本。
- [ ] 本feature内明确并冻结lifecycle、run layout和direct dependency/proof ledger，再据此实现；生成来源和校验输入分开，修改Map不会自动使Plan失效，namespace/实际读取无隐式合并。
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

## Ownership cleanup — 2026-10-06

第二轮反馈认可feature分层。本轮收紧legacy/canonical prompt写权限，补齐Context非固定workflow、graph-driven失效及独立QualityEvaluation绑定验收；仍not_started，未运行模型或实现代码。

## TypeScript boundary — 2026-10-06

用户明确选择新app/agent采用TypeScript，旧Electron模块不迁移。仅更新语言/构建与interop合同，实际tsconfig、开发依赖、源代码和命令在实施时建立；当前仍not_started。
