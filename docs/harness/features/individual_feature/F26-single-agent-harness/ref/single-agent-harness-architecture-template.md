# Single-Agent Harness 基础架构与可复用模块模板

> 适用场景：当前 AI Design Review 项目的 F26 AI Integration Experiment，以及后续产品化的 Single-Agent Harness。
>
> 目标不是搭建一个“通用 Agent 平台”，而是用最小、清晰、可替换的模块，把「原文 → AI 分析 → Contract/Validator → Reading Bundle → 现有 L0/L1/L2」这条链路跑通。

---

## 1. 结论

当前最值得做的不是照搬一个大型 Agent 项目的全部目录，而是复用一个稳定的 **Agent Kernel 模板**，再把项目自己的文档分析能力接成 Domain Tools。

一个 Single-Agent Harness 最核心的组成可以收敛成：

1. **Agent Definition**：模型、系统指令、可用工具、完成条件。
2. **Runner / Agent Loop**：model → tool → observation → model 的循环。
3. **Provider Adapter**：DeepSeek / OpenAI / 其它模型的统一接口。
4. **Context Builder**：每一步给模型看什么。
5. **State / Session**：当前 run 的显式状态、artifact 状态、预算和失败信息。
6. **Tool Registry**：向 Agent 暴露领域动作。
7. **Guardrails / Validators**：程序拥有的硬约束和 completion gate。
8. **Trace / Eval**：记录 trajectory、成本、耗时、失败、质量。

这 8 个模块已经足够支持第一版 Single-Agent Harness。

`knowledge`、`learning`、`capabilities`、`events`、`skills`、`multi_user`、`fusion` 等目录并不是 Agent 项目必备模块。它们通常是一个成熟产品发展之后，由产品需求、插件体系、多人协作、知识库、长期记忆等需求逐渐拆出来的子系统。

因此，不建议看到大型项目有 20 个目录，就认为自己的 Agent 也需要 20 个目录。

---

## 2. 为什么别的 Agent 项目会有很多模块

以截图中的项目为例，可以看到类似：

```text
agents/
api/
app/
capabilities/
config/
core/
events/
fusion/
knowledge/
learning/
logging/
multi_user/
runtime/
services/
skills/
tools/
utils/
```

这些目录实际上混合了三种不同层级。

### 2.1 Agent 核心层

这类模块基本是可复用的：

```text
agents
core
runtime
tools
config
logging
```

它们解决的是：

- Agent 是什么；
- Agent 如何运行；
- 模型如何调用；
- 工具如何注册；
- 状态如何保存；
- 如何观察运行过程。

这是我们最值得复刻的部分。

### 2.2 产品能力层

例如：

```text
knowledge
learning
skills
capabilities
fusion
```

这些不是所有 Agent 都需要。

它们通常表示：

- Knowledge：知识检索 / RAG；
- Learning：用户学习状态、长期反馈、适应性逻辑；
- Skills：可复用任务说明或能力包；
- Capabilities：能力发现、权限或插件能力；
- Fusion：某个产品自己的组合逻辑。

你的 AI Design Review 第一版并不需要把这些都做出来。

### 2.3 产品基础设施层

例如：

```text
api
app
events
services
multi_user
i18n
```

这是一个产品运行到一定规模后自然出现的：

- API Server；
- UI / Application；
- Event Bus；
- 后台 Services；
- 多用户；
- 国际化。

它们和“Single-Agent 是否能正确完成文档分析”不是同一个问题。

---

## 3. 2026 年可以直接参考的现成模板

### 3.1 DeepSeek Harness：最值得研究模块边界

DeepSeek Harness 已经开源，并且本身就是 Node/npm 体系。

它把核心 Agent spine 拆成：

```text
session
system-prompt
tools
agent
agent-loop
```

其基本 turn flow 是：

```text
Agent Loop
   ↓
读取 Session
   ↓
组装 System Prompt / Context
   ↓
调用 LLM
   ↓
Tool Registry 执行 Tool Call
   ↓
结果写回 Session
   ↓
下一 Step
```

这是一个非常好的“核心模块划分参考”。

DeepSeek Harness 还有一个 `sdk-minimal` 的较小组合，意味着官方本身也不要求使用整个大型产品结构。

对当前项目最值得借鉴的是模块边界，而不是直接把 DeepSeek Harness 整体嵌入应用。

### 3.2 Google Agents CLI / ADK：最接近“脚手架模板”

Google 当前提供的 Agents CLI 可以直接 scaffold 一个 prototype：

```bash
agents-cli create my-agent --prototype --yes
```

它生成的最小项目主要是：

```text
app/
  agent.py
  fast_api_app.py
  app_utils/
    services.py

tests/
  eval/
    datasets/
```

也就是说，成熟平台的“最小 Agent 项目”其实并没有几十个模块。

后续需要 Memory、RAG、Approval、Event-driven run 时，再从 recipe 中增加。

这种 **prototype-first + recipe expansion** 的方式很适合我们当前项目。

### 3.3 OpenAI Agents SDK：适合作为接口设计参考

OpenAI 当前 Single-Agent 的基本定义也很简单：

```text
Agent
├── model
├── instructions
├── tools
├── guardrails
├── structured output
└── runtime behavior
```

Runner 负责：

```text
model
→ tool call
→ tool execution
→ model
→ ...
→ stop
```

所以无论使用哪个 Provider，Agent Harness 的核心抽象已经比较稳定。

### 3.4 Pi：适合参考“小型 TypeScript Harness”

DeepSeek 官方文档目前也把 Pi 列为可接入的 Agent 工具。

Pi 的特点是：

- TypeScript；
- 小型；
- Provider 可插拔；
- extensions；
- skills；
- prompt templates；
- session。

如果我们后面想找一个“不是企业级巨型框架，但代码结构比较完整”的 TypeScript Agent Harness，Pi 比直接研究一个拥有几十个 subsystem 的大型项目更容易消化。

---

## 4. 推荐给 AI Design Review 的架构模板

当前项目不要重新建立一个独立平台。

建议做成：

```text
┌──────────────────────────────────────────────┐
│               Product / Electron             │
└──────────────────────┬───────────────────────┘
                       │ Analyze Document
                       ▼
┌──────────────────────────────────────────────┐
│              Single-Agent Harness            │
│                                              │
│  Agent Definition                            │
│  Agent Runner / Loop                         │
│  Context Builder                             │
│  Run State                                   │
│  Tool Registry                               │
└───────────────┬──────────────────────────────┘
                │
       ┌────────┼──────────┐
       ▼        ▼          ▼
   Provider   Tools     Guardrails
       │        │          │
   DeepSeek  Domain     Existing
             actions    Validators
       │        │          │
       └────────┼──────────┘
                ▼
          Run Artifacts
                │
                ▼
          Reading Bundle
                │
                ▼
         Existing Renderer
```

核心原则：

> Agent 决定“下一步做什么”；程序决定“什么动作允许做、什么结果算有效、什么时候才算真正完成”。

---

## 5. 推荐目录模板

### 5.1 最终产品形态

后续真正产品化时，可以采用类似：

```text
agent/
├── core/
│   ├── agent.js
│   ├── runner.js
│   ├── state.js
│   ├── context.js
│   └── completion.js
│
├── providers/
│   ├── provider.js
│   └── deepseek.js
│
├── tools/
│   ├── registry.js
│   ├── source-tools.js
│   ├── artifact-tools.js
│   ├── validation-tools.js
│   └── bundle-tools.js
│
├── prompts/
│   ├── system.md
│   └── context-sections.js
│
├── trace/
│   ├── recorder.js
│   └── run-report.js
│
├── eval/
│   ├── evaluator.js
│   └── metrics.js
│
└── index.js
```

这个规模已经可以支撑一个完整 Single-Agent Harness。

---

## 6. 每个模块到底负责什么

### 6.1 `core/agent`

只定义一个 Agent。

例如概念接口：

```ts
interface AgentDefinition {
  name: string
  instructions: string
  tools: string[]
  model: ModelConfig
  completionPolicy: CompletionPolicy
}
```

不要在这里：

- 直接读文件；
- 写 artifact；
- 调 validator；
- 处理 UI。

Agent Definition 应该只是“这个 Agent 是谁，它拥有什么能力”。

---

### 6.2 `core/runner`

整个 Harness 最核心的模块。

负责：

```text
1. build context
2. call model
3. inspect response
4. execute tool call
5. append observation
6. update state
7. check stopping condition
8. repeat
```

概念流程：

```ts
while (!state.finished) {
  const context = buildContext(state)

  const response = await provider.run({
    context,
    tools: registry.schemas()
  })

  if (response.toolCalls.length) {
    const results = await registry.execute(response.toolCalls)
    state.append(results)
  } else {
    state.append(response)
  }

  checkBudget(state)
  checkCompletion(state)
}
```

第一版不要在 Runner 中加入：

- 多 Agent；
- Planner Agent；
- Reflection Agent；
- 长期 Memory；
- Workflow DAG。

保持 loop 足够透明。

---

### 6.3 `providers/`

负责把不同模型统一成一个接口。

例如：

```ts
interface ModelProvider {
  run(request: AgentRequest): Promise<AgentResponse>
}
```

DeepSeek：

```text
DeepSeek API
      ↓
DeepSeekAdapter
      ↓
AgentResponse
```

未来：

```text
OpenAI
Claude
Gemini
Local model
```

都只需要再实现 Provider Adapter。

这样 Harness 不依赖具体模型厂商。

---

### 6.4 `core/context`

负责回答：

> 当前这一 Step，模型究竟应该看到什么？

可以组装：

```text
System Instructions
Current Goal
Current Run State
Artifact Status
Recent Tool Results
Relevant Constraints
Remaining Budget
```

原文不一定始终完整放进 Context。

Agent 需要时调用：

```text
read_source
read_source_section
```

这样后续才能自然演进到 just-in-time context。

---

### 6.5 `core/state`

State 是 Harness 的显式状态，而不是模型脑中的状态。

建议至少记录：

```json
{
  "runId": "...",
  "status": "running",
  "document": {},
  "artifacts": {},
  "validation": {},
  "turns": 12,
  "toolCalls": 21,
  "tokenUsage": {},
  "cost": {},
  "failures": [],
  "startedAt": "...",
  "finishedAt": null
}
```

关键原则：

> 模型可以忘记；State 不能靠模型记忆。

---

### 6.6 `tools/`

这是整个项目最重要的 Domain Layer。

不要先给 Agent：

```text
bash
filesystem
shell
arbitrary code execution
```

第一版只给它完成 AI Design Review 所需的工具。

推荐：

#### Source Tools

```text
get_document_info
read_source
read_source_section
```

#### Contract Tools

```text
get_contract
get_schema_summary
```

#### Artifact Tools

```text
read_artifact
write_semantic_inventory
write_framework_map
write_map_selection
write_overview_plan
write_stage2_block
```

#### Validation Tools

```text
validate_inventory
validate_map
validate_plan
validate_block
validate_overview
inspect_validation_failure
```

#### Assembly Tools

```text
assemble_overview
export_reading_bundle
verify_bundle
```

这类 Tool 才是 AI Design Review Agent 真正的“能力”。

---

## 7. Tool Registry 模板

统一注册：

```ts
registry.register({
  name: "validate_map",
  description: "Validate the current framework map against project contracts.",
  inputSchema: {...},
  execute: validateMap
})
```

Harness 永远只和 Registry 交互：

```text
Agent
  ↓
Tool Registry
  ↓
Domain implementation
```

而不是：

```text
Agent Prompt
  ↓
“请运行 scripts/check-map.js”
```

这样 Agent 不需要知道内部脚本名称和仓库结构。

---

## 8. Validator / Guardrail 模板

项目已经有：

```text
check-map
check-plan
check-block
check-overview
Schema
Reading Bundle validation
```

这些应该直接成为 Harness 的硬约束。

Agent 可以决定：

```text
我要修改 framework-map
```

但不能决定：

```text
这个 validator 太严格，我跳过吧
```

因此：

```text
Agent = policy / decision maker

Validator = authority
```

---

## 9. Completion Gate

不要让 LLM 自己宣布完成。

Harness 应该拥有 completion definition。

例如：

```text
semantic inventory        PASS
framework map             PASS
map selection             PASS
overview plan             PASS
all required blocks       PASS
assembled overview        PASS
source bindings           PASS
reading bundle            PASS
```

只有这些条件全部满足：

```text
state.status = completed
```

才允许真正结束。

如果 Agent 说：

```text
“I have finished the task.”
```

但：

```text
overview plan = FAIL
```

Runner 应该继续返回：

```text
Completion rejected.
overview-plan still has validation failures.
```

---

## 10. Trace / Observability 模板

这是第一版就值得保留的模块，而不是以后再补。

每个 run 建议记录：

```text
run id
provider
model
model parameters
input document hash

turn
step
model request
model response
tool call
tool result

artifact changes
validator result

token usage
latency
cost

termination reason
```

这样才能比较：

```text
Run A:
12 turns
18 tool calls
2 repairs
$0.34

Run B:
27 turns
44 tool calls
8 repairs
$0.91
```

最终结果一样，并不代表 Harness 表现一样。

---

## 11. Eval 不应该和 Runner 混在一起

Runner 的责任是：

> 把任务完成。

Eval 的责任是：

> 判断做得好不好。

建议分开：

```text
Harness Run
   ↓
Artifacts
   ↓
Deterministic validation
   ↓
Quality Eval
```

F26 第一版重点可以评价：

```text
结构合规
Semantic Unit 覆盖
Source fidelity
Current / Target 是否混淆
关系准确度
Topic decomposition
Block readability
readingGuide 质量
重复稳定性
成本
耗时
```

---

## 12. 针对 F26 的更小版本

因为当前的目标是快速完成实验，所以甚至不需要马上创建完整的 `agent/` 子系统。

F26 可以先实现五个逻辑组件：

```text
AgentRunner
ProviderAdapter
AgentState
ToolRegistry
TraceRecorder
```

领域能力继续复用当前已有：

```text
ai-plan
ai-block
semantic grounding
framework map generator
overview assembler
bundle exporter
validators
```

即：

```text
              AgentRunner
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
 ProviderAdapter         ToolRegistry
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
          Source          Existing         Existing
                          Scripts          Validators
                             │
                             ▼
                         Artifacts
                             │
                         Bundle
```

F26 先验证这个架构是否成立。

等实验通过之后，再决定是否把这些组件正式移到：

```text
app/agent/
```

或者：

```text
app/main/agent/
```

成为产品 runtime。

---

## 13. 不建议第一版建立的模块

下面这些东西以后可能需要，但当前不要为了“Agent 项目看起来完整”提前建立：

```text
memory/
knowledge/
skills/
capabilities/
events/
planner/
reflection/
learning/
multi_agent/
orchestration/
scheduler/
sandbox/
plugin_system/
```

建立模块的判断标准应该是：

> 当前是否已经存在两个以上明确调用方，或者存在一个必须隔离的职责？

否则先不要抽象。

---

## 14. 什么时候再引入 Skills

Skills 很适合后续出现多个重复任务时。

例如未来：

```text
Analyze Architecture Document
Analyze API Proposal
Analyze Migration Plan
Analyze Security Design
```

它们拥有相同 Harness，但工作方法不同。

那时可以：

```text
skills/
├── architecture-review/
│   └── SKILL.md
├── api-review/
│   └── SKILL.md
└── migration-review/
    └── SKILL.md
```

Agent Runtime 不变，只切换 Skill。

当前只有一个核心任务：

```text
Design Document → Reading Bundle
```

因此暂时用 system prompt / contract 即可。

---

## 15. 什么时候再引入 Knowledge / Memory

当前一次分析应该尽量是：

```text
Document
↓
Independent Run
↓
Bundle
```

因此暂时没有明显的长期 Memory 需求。

只有未来出现：

```text
“记住这个团队过去 20 篇设计文档里的设计约定”
```

或者：

```text
“这个用户过去审核这些设计时经常关注什么”
```

才需要真正的 Knowledge / Long-term Memory。

不要把：

```text
semantic-inventory.json
framework-map.json
overview-plan.json
```

叫作 Memory。

它们是 **Artifacts / Run State**。

这个概念最好从第一天就分清。

---

## 16. 什么时候再引入 Event Bus

第一版：

```text
runner → trace recorder
```

直接函数调用就够。

当以后 UI 需要实时收到：

```text
analysis.started
artifact.generated
validation.failed
repair.started
analysis.completed
```

并且同时有：

```text
UI
logger
telemetry
background worker
```

多个消费者时，再把这些状态变化升级成 Event Bus。

不要为了架构完整度先建 `events/`。

---

## 17. 什么时候再引入 Multi-Agent

Single-Agent 成功以后，再测试：

```text
Lead Agent
    │
    ├── Block Worker
    ├── Block Worker
    └── Independent Verifier
```

届时新增：

```text
agents/
orchestration/
handoff/
```

才是合理的。

当前 Multi-Agent 不应该进入核心 runtime。

---

## 18. 推荐的演进顺序

### Phase 1 — F26

```text
Single Agent
+
Domain Tools
+
Existing Validators
+
Trace
```

目标：

```text
source
→ autonomous agent run
→ validated artifacts
→ reading bundle
→ existing L0/L1/L2
```

### Phase 2 — 产品接入

增加：

```text
Model Config
Document Picker
Task Controller
Progress UI
Cancellation
Resume / Retry
```

### Phase 3 — 稳定性

增加：

```text
Context compaction
Checkpoint / resume
Better retry policy
Cost controller
Eval dataset
Trace viewer
```

### Phase 4 — Agent 性能实验

再尝试：

```text
independent verifier
parallel block workers
multi-agent
specialized models
```

---

## 19. 最终建议

当前不要问：

> “一个成熟 Agent 项目通常有多少个模块？”

更应该问：

> “哪些职责已经需要形成稳定边界？”

对 AI Design Review 来说，当前真正需要稳定下来的边界只有：

```text
Agent
Runtime
Provider
Context
State
Tools
Validation
Trace
```

其它模块都可以以后按需求增长。

这能避免两种极端：

### 极端 A：所有东西写进一个 agent.js

短期快，但很快无法测试、替换和调试。

### 极端 B：一开始复制一个成熟 Agent 平台的 20～50 个模块

结构很漂亮，但大部分模块没有真实需求，反而拖慢 F26。

目前最佳位置是在二者中间：

> **Small Kernel + Domain Tools + Hard Contracts**

也就是：

```text
        Small Agent Kernel
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Context   State    Tools
                         │
                  AI Design Review
                    Domain Logic
                         │
                  Validators / Bundle
```

这套骨架既足够小，可以很快跑起来；又足够稳定，未来加入 Skills、Memory、Events、Multi-Agent 时不需要推倒重来。

---

## 20. 可作为实现时的 Checklist

在开始写 Harness 之前，只需要确认这些问题：

- [ ] Agent Definition 是否与 Provider 分离？
- [ ] Runner 是否不知道 DeepSeek 的具体 API 细节？
- [ ] Tool 是否通过统一 Registry 暴露？
- [ ] Agent 是否只能调用领域允许的 Tool？
- [ ] Artifact 是否存在于显式 State / Workspace，而不是只存在模型 Context？
- [ ] Validator 是否由程序控制，Agent 无权绕过？
- [ ] Completion 是否由 Harness 判定？
- [ ] 每一步是否有 Trace？
- [ ] 是否可以在不修改 Runner 的情况下换 Provider？
- [ ] 是否可以在不修改 Agent Loop 的情况下增加一个 Domain Tool？

如果这十项成立，第一版 Single-Agent Harness 的基础架构就已经足够健康。

---

## 参考项目

本建议主要参考以下 2026 年仍在维护或公开的 Agent 架构：

- DeepSeek Harness：插件化 Harness、session / system-prompt / tools / agent / agent-loop 的核心 spine，以及 `sdk-minimal` 组合。
- Google Agents CLI / ADK：prototype-first scaffold、eval、recipe expansion。
- OpenAI Agents SDK：Agent Definition、Runner、Tools、Guardrails、State / Session 的边界。
- Pi coding agent：较小型 TypeScript Harness、Provider、extensions、skills、prompt templates、sessions。

这些项目最值得复用的是 **职责边界和接口模式**，而不是目录名称本身。
