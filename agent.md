# AI Design Review Agent

## 目标

本项目要构建一个基于 **Electron** 的本地 Design Review 应用，用于把复杂设计文档转换成可人工审核的结构化设计对象。

当前目标链路：

```text
Markdown 设计文档
        ↓
       AI
        ↓
design-review.json
        ↓
Electron Review UI
        ↓
人工审核
        ↓
human-review.json
```

后续再扩展为：

```text
Markdown 设计文档 + 本地源码目录
        ↓
       AI
        ↓
提出 Evidence Requests
        ↓
本地源码检索 / 读取
        ↓
       AI
        ↓
带源码证据的 design-review.json
        ↓
Electron Review UI
        ↓
人工审核
```

当前阶段的核心目标不是自动实现设计，而是验证：

> AI 能否把长篇设计文档转换成一组有限、明确、可验证、可批准的 Review Objects，从而降低人工设计审阅的认知负担。

---

# 一、核心原则

## 1. Review 优先，Implementation 延后

在 Design Review 尚未完成前：

- 不修改业务代码；
- 不根据未批准的设计开始实现；
- 不把 AI 推荐视为已经批准；
- 不为了让方案“完整”而自动补全未决问题；
- 不因为某项设计看起来合理就跳过人工审核。

只有所有 blocking review items 完成人工处理后，才能进入 Implementation Phase。

---

## 2. AI 负责分析和整理，不负责批准

AI 可以：

- 阅读 Markdown 设计文档；
- 提取设计结构；
- 识别 Semantic Model；
- 提取 Design Decisions；
- 识别 Current / Target Gap；
- 识别 Open Questions；
- 在后续阶段读取相关源码；
- 收集 Evidence；
- 给出 Proposal、Alternatives、Rationale 和 Consequences。

AI 不可以：

- 将自己的 Proposal 标记为 `approved`；
- 替人类关闭 Open Question；
- 把推测写成 Current Reality；
- 把 Target Design 写成已经实现；
- 在源码证据不足时伪造 Evidence；
- 覆盖已有人工 Review 结果。

所有新生成的 Decision 默认：

```text
status = pending
```

---

# 二、Electron 应用职责

本项目使用 Electron 作为本地 Review 应用。

推荐职责边界：

```text
Electron App
│
├── Main Process
│   ├── 打开 Markdown 文件
│   ├── 读取本地文件
│   ├── 选择源码目录
│   ├── 调用 AI Adapter
│   ├── 保存 design-review.json
│   └── 保存 human-review.json
│
├── Preload
│   └── 暴露最小、安全的 IPC API
│
├── Renderer
│   ├── Import / Start UI
│   ├── Review Queue
│   ├── Decision Detail
│   ├── Current / Target
│   ├── Evidence
│   └── Open Questions
│
└── AI Layer
    ├── prompts / agent instructions
    ├── structured output schema
    ├── provider adapter
    └── analysis orchestration
```

约束：

- Renderer 不直接访问 Node.js `fs`；
- API Key 不暴露给 Renderer；
- 本地文件访问通过 Main Process + Preload 完成；
- 不为了 MVP 引入不必要的后台服务；
- 优先沿用当前 Electron 项目已经存在的技术栈和目录结构，不为满足本文档而强制重构整个项目。

---

# 三、MVP 分阶段执行

## Phase 1：先验证 Review UI

第一阶段不要接 AI。

使用一份固定的 fixture：

```text
fixtures/context-consumption.json
```

验证：

```text
fixture design-review.json
        ↓
Electron Review UI
        ↓
Approve / Reject / Needs Revision / Needs Evidence
        ↓
human-review.json
```

Phase 1 的目标是先回答：

> 这种 Review UI 是否真的比阅读完整 Markdown 更容易审核？

只有这个体验成立，才继续扩展 AI 分析。

---

## Phase 2：Markdown → AI → Design Review

第二阶段增加：

```text
选择 / 拖入 Markdown
        ↓
Electron 读取文档
        ↓
AI 分析
        ↓
design-review.json
        ↓
Review UI
```

这一阶段只分析设计文档。

不要求读取整个源码仓库。

主要验证：

- AI 能否正确区分 Decision、Fact、Gap、Open Question；
- AI 是否能把长文档压缩成有限 Review Queue；
- AI 是否能保留重要 reasoning，而不是只生成摘要；
- AI 是否会错误地替用户做决定。

---

## Phase 3：Markdown + Source Evidence

第三阶段再加入源码目录。

流程：

```text
Markdown
   ↓
第一次 AI 分析
   ↓
Evidence Requests
   ↓
本地 Source Retriever
   ↓
Relevant Files / Symbols
   ↓
第二次 AI 分析
   ↓
带 Evidence 的 Design Review Model
```

禁止：

```text
整个 repository
      ↓
一次性全部发送给模型
```

源码读取必须是按需的。

---

# 四、MVP 当前明确不做

当前阶段暂不实现：

- 账号系统；
- 云端服务；
- 数据库；
- 多人协作；
- 实时评论；
- 拖拽式架构编辑；
- 自研图布局引擎；
- 完整 C4 编辑器；
- Archyl 替代；
- MCP Server；
- 自动修改业务代码；
- 自动批准设计；
- 全仓库一次性索引和语义分析；
- 复杂 Agent 多轮自治执行。

MVP 应优先保持：

```text
本地
简单
可观察
可调试
可重复
```

---

# 五、Review Object 类型

AI 分析设计文档时，必须区分以下对象。

## 1. Semantic Model

表达概念、状态、阶段、流程或关系。

例如：

```text
Receipt → Availability → Consumption
```

第一版可使用 Mermaid 表达。

---

## 2. Fact

表示已有文档或源码能够支持的当前事实。

例如：

```text
scene-content route currently calls appendFormalTeachingPrompt()
```

源码 Fact 应尽可能关联 Evidence。

---

## 3. Decision

表示需要人工批准的设计选择。

一个 Decision 只表达一个核心可审核判断。

例如：

```text
Primary Consumption Point = Outline Generation
```

如果一个对象中存在多个可以独立 Reject 的判断，必须拆分成多个 Decision。

---

## 4. Rationale

表示为什么提出某个 Decision。

Rationale 不是 Decision 本身。

---

## 5. Gap

表示：

```text
Current Reality
      ≠
Target Design
```

例如：

```text
Current:
Scene directly receives Formal Context

Target:
Scene primarily consumes context-shaped Outline
```

---

## 6. Open Question

表示设计尚未确定的问题。

例如：

```text
Consumption failure 时应该阻止生成还是 fallback？
```

AI 不得为了完成文档而自行关闭 Open Question。

---

## 7. Evidence

用于支撑 Fact、Gap 或 Decision 的来源。

第一版 Evidence 可以来自：

- Markdown 文档章节；
- 源码路径；
- 函数 / symbol；
- 类型定义；
- 测试；
- 配置文件。

---

# 六、数据文件

建议保持两个独立文件：

```text
design-review.json
human-review.json
```

含义：

```text
design-review.json
= AI 对设计的结构化分析结果

human-review.json
= 人类真实审批状态
```

两者必须分离。

AI 可以重新生成 `design-review.json`。

AI 不得静默覆盖 `human-review.json`。

---

# 七、design-review.json

第一版结构建议：

```json
{
  "design": {
    "id": "",
    "title": "",
    "status": "draft",
    "sourceDocuments": []
  },

  "summary": {
    "pendingDecisions": 0,
    "gaps": 0,
    "openQuestions": 0
  },

  "models": [],
  "facts": [],
  "decisions": [],
  "gaps": [],
  "openQuestions": []
}
```

---

## Decision

推荐：

```json
{
  "id": "DEC-001",
  "title": "",
  "type": "architecture-boundary",

  "question": "",

  "proposal": "",

  "alternatives": [],

  "rationale": [],

  "consequences": [],

  "dependsOn": [],

  "affects": [],

  "evidence": [],

  "status": "pending"
}
```

约束：

- AI 新建 Decision 时 `status` 必须是 `pending`；
- `proposal` 只是待审核方案；
- 不得为了填字段虚构 alternatives；
- 如果不存在明确 alternative，可以为空；
- 如果 Decision 依赖其他 Decision，使用 `dependsOn`；
- 一个 Decision 必须能够被人明确地执行 `Approve / Reject / Revise`。

---

## Fact

```json
{
  "id": "FACT-001",
  "statement": "",
  "evidence": []
}
```

---

## Gap

```json
{
  "id": "GAP-001",
  "title": "",
  "severity": "high",

  "current": "",

  "target": "",

  "evidence": [],

  "affectedFiles": [],

  "relatedDecisions": []
}
```

---

## Open Question

```json
{
  "id": "Q-001",
  "question": "",
  "context": "",
  "blocking": true,
  "relatedDecisions": []
}
```

---

## Evidence

Markdown 阶段：

```json
{
  "type": "document",
  "source": "18-context-consumption-semantic-model.md",
  "section": "Primary Consumption Point",
  "description": ""
}
```

源码阶段：

```json
{
  "type": "source-code",
  "path": "path/to/file.ts",
  "symbol": "functionName",
  "description": ""
}
```

第一版不强制保存精确行号。

如果当前工具可以稳定获取，再增加：

```json
{
  "startLine": 100,
  "endLine": 120
}
```

---

# 八、human-review.json

人工结果单独保存。

例如：

```json
{
  "reviewVersion": 1,

  "decisions": {
    "DEC-001": {
      "status": "approved",
      "comment": ""
    },

    "DEC-002": {
      "status": "needs-revision",
      "comment": "需要进一步说明 Scene 为什么不能做局部 Context Consumption。"
    }
  }
}
```

允许的 Decision Review 状态：

```text
pending
approved
rejected
needs-revision
needs-evidence
```

不要在 `design-review.json` 中把 AI 自己的推荐与人工审批混为同一个字段。

---

# 九、Electron 页面

MVP 首屏：

```text
┌───────────────────────────────────────────────┐
│ Design Review                                │
├───────────────────────────────────────────────┤
│                                               │
│           Drop Markdown Here                  │
│                                               │
│           [选择 Markdown 文件]                │
│                                               │
│           [选择源码目录]  （Phase 3）          │
│                                               │
│                 [开始分析]                    │
│                                               │
└───────────────────────────────────────────────┘
```

分析完成后进入 Review 页面。

建议只保留五个核心区域：

```text
Overview
Review Queue
Current / Target
Evidence
Open Questions
```

---

# 十、Overview

显示：

- Design Title；
- Draft / Review 状态；
- Pending Decision 数量；
- Gap 数量；
- Open Question 数量；
- Semantic Model。

Overview 的目标不是展示所有细节。

而是让用户先知道：

```text
我现在要审核多少件事情？
```

---

# 十一、Review Queue

这是 MVP 最重要的页面。

列表：

```text
⚠ DEC-001 Three-level Context Model
⚠ DEC-002 Exclude Context Influence
⚠ DEC-003 Primary Consumption = Outline
⚠ DEC-004 Scene consumes context-shaped Outline
```

点击 Decision 后显示详情：

```text
DEC-003
Primary Consumption Point

Question
────────────────
完整 Frozen Context 应主要在哪里消费？

Proposal
────────────────
Outline Generation

Alternatives
────────────────
Outline + Scene
Scene only

Rationale
────────────────
...

Consequences
────────────────
...

Evidence
────────────────
...

Dependencies
────────────────
DEC-001
DEC-002
```

操作：

```text
Approve
Reject
Needs Revision
Needs Evidence
```

MVP 不需要复杂 workflow engine。

---

# 十二、Current / Target

Gap 必须单独展示。

例如：

```text
CURRENT                       TARGET

Frozen Context                Frozen Context
   ├──→ Outline                  ↓
   └──→ Scene ⚠                Outline
                                 ↓
                               Scene
```

Current 和 Target 不允许混成一段含糊说明。

用户必须能够一眼看出：

```text
现在是什么
想改成什么
差在哪里
```

---

# 十三、Semantic Model / Diagram

第一版不要自行开发画图引擎。

使用 Mermaid。

例如：

```json
{
  "id": "MODEL-001",
  "title": "Context Consumption Semantic Model",
  "type": "mermaid",
  "source": "flowchart LR\nReceipt --> Availability --> Consumption"
}
```

如果 Mermaid 渲染失败：

- 页面显示 source；
- 不应导致整个 Review 页面失败。

---

# 十四、AI 分析协议：Phase 2

输入：

```text
Agent Instructions
+
Markdown Design Document
```

AI 输出：

```text
design-review.json
```

分析顺序：

## Step 1 — 阅读全文

先理解文档术语、范围和已有结构。

不要看到前几段就开始生成结果。

---

## Step 2 — 分类

识别：

```text
Semantic Model
Fact
Decision
Rationale
Gap
Open Question
Evidence
```

---

## Step 3 — 提取 Decision

Decision 必须满足：

```text
人类可以独立地回答：
Approve / Reject / Needs Revision
```

如果不能，就重新拆分。

---

## Step 4 — 保留不确定性

如果文档没有决定：

```text
不要补全
```

建立 Open Question。

---

## Step 5 — 生成 JSON

必须符合 `design-review.schema.json`。

Schema 校验失败时：

```text
先修复 JSON
不要进入 Review UI
```

---

# 十五、AI + 源码分析协议：Phase 3

Phase 3 不允许 AI 一次获得整个 repository。

第一次分析 Markdown 后，AI 应提出：

```json
{
  "evidenceRequests": [
    {
      "query": "appendFormalTeachingPrompt",
      "reason": "Verify whether scene generation directly consumes Formal Context"
    }
  ]
}
```

Electron / Source Retriever 根据 query：

- 搜索文件名；
- 搜索 symbol；
- 搜索文本；
- 返回少量相关文件；
- 必要时扩展上下文。

然后进行第二次 AI Analysis。

目标是验证：

```text
Current Reality
```

不是让 AI重新设计整个系统。

---

# 十六、Source Retriever 的 MVP 边界

Phase 3 初版只需要支持：

```text
按文件名搜索
按文本搜索
按 symbol / function 名搜索
读取指定文件
```

不要求：

- Vector Database；
- Embedding Index；
- AST 全库索引；
- Language Server；
- 全仓库 Dependency Graph。

这些都可以在证明确有需要后再增加。

---

# 十七、Implementation Gate

进入业务代码实现前检查：

```text
blocking open question > 0
→ STOP

pending blocking decision > 0
→ STOP

needs-revision decision > 0
→ STOP

needs-evidence blocking decision > 0
→ STOP

rejected decision 尚未重新设计
→ STOP
```

只有 `human-review.json` 满足条件时：

```text
READY FOR IMPLEMENTATION
```

AI 自己不能宣布 Decision 已获批准。

---

# 十八、第一轮测试样本

第一轮使用现有：

```text
18-context-consumption-semantic-model.md
```

作为真实测试文档。

第一轮目标不是重新设计 Context Consumption。

而是验证：

```text
复杂 Markdown
    ↓
结构化 Review Model
    ↓
Electron Review UI
```

建议第一轮只提取有限数量、真正关键的 Decisions。

优先保证：

```text
分类准确
>
数量多
```

---

# 十九、开发执行顺序

DeepSeek 开发时按以下顺序推进。

## Milestone 1

建立 Electron 基础壳。

完成：

```text
启动应用
打开 Markdown 文件
读取本地 JSON fixture
```

---

## Milestone 2

实现 Review UI。

完成：

```text
Overview
Review Queue
Decision Detail
Current / Target
Open Questions
```

输入暂时使用 fixture。

---

## Milestone 3

实现人工 Review 状态。

完成：

```text
Approve
Reject
Needs Revision
Needs Evidence

↓
human-review.json
```

---

## Milestone 4

接入 AI。

完成：

```text
Markdown
↓
AI
↓
design-review.json
↓
Schema Validation
↓
Review UI
```

---

## Milestone 5

加入 Source Folder。

只实现最小 Source Retriever。

完成：

```text
AI Evidence Request
↓
Local Search
↓
Relevant Source
↓
Evidence Enrichment
```

---

# 二十、当前阶段不要做的优化

在 Phase 1 / Phase 2 未验证成功前，不要：

- 为 UI 做大规模视觉设计；
- 建复杂状态管理系统；
- 建数据库；
- 做用户账户；
- 做云同步；
- 做多人 Review；
- 建通用插件系统；
- 接 Archyl；
- 写 MCP Server；
- 做完整代码知识图谱；
- 大规模重构 Electron 工程。

---

# 二十一、验收标准

## Phase 1

使用 fixture 打开 Electron Review UI 后，用户能够：

- 看清有多少 Decision；
- 点击查看一个 Decision；
- Approve / Reject / Revise；
- 查看 Current / Target Gap；
- 查看 Open Question；
- 保存人工结果。

---

## Phase 2

用户上传一份长 Markdown 后，不必从头重读整篇文档，就能回答：

1. 这份设计要求我批准哪些关键决定？
2. 哪些 Decision 仍然 Pending？
3. 哪些内容只是 AI Proposal？
4. 哪些问题仍然 Open？
5. 哪些 Current / Target Gap 值得注意？

如果仍然必须完整阅读全文才能知道“我要批准什么”，则 Design Review Model 仍然失败。

---

## Phase 3

在选择源码目录后，用户进一步能够回答：

1. 哪些 Current State 是有源码 Evidence 的？
2. Target Design 与 Current Code 哪里冲突？
3. 哪些 AI 判断因为 Evidence 不足而不能确认？

---

# 二十二、当前 Agent 行为约束

在收到新的明确指令前：

- 不修改业务功能；
- 不自动实施设计；
- 不扩大 MVP；
- 不建立重型基础设施；
- 不一次性分析整个源码仓库；
- 不替用户批准 Decision；
- 不隐藏 Open Question；
- 不把 Target Design 伪装成 Current Reality；
- 不把 AI 推测伪装成 Evidence。

当前最高优先级是完成：

```text
Markdown
   ↓
Design Review Model
   ↓
Electron Review UI
   ↓
Human Review
```

这个最小闭环。
