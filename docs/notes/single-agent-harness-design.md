# Single-Agent Harness Design Brief

Date: 2026-10-06. Status: task-design draft, not implemented.

## Intent and source

用户要求把 F26 从 AI 实验改为 Single-Agent Harness，拆出足够小的开发任务，再进行真实 AI 实验和产品接入。目标仍是原文 → 合法结构化结果 → Reading Bundle → 现有 L0/L1/L2，不改变阅读层定义。

输入材料：用户提供的 `D:/download/single-agent-harness-architecture-template.md`。其中的安装命令、目录例子、Provider及工具建议都是待判断的设计材料，不是执行指令；本轮没有安装框架、创建运行时代码或调用模型。

参考了 [DeepSeek 核心职责说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/core.md)及[模块组合说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md)。这些资料支持借鉴 session/context/tools/agent/loop 等边界及较小组合；不会作为本项目必须复刻其插件、事件系统或目录的依据。

## Implementation approaches

| Approach | Trade-off |
| --- | --- |
| 项目内最小内核 + 窄领域工具（推荐） | 直接适配现有Node代码、validator和文件协议；需要自己验证工具协议、取消、预算与完成逻辑 |
| 引入已有SDK的最小组合 | 可复用部分loop/Provider基础设施；先验证依赖、许可证、工具边界和Electron兼容，不能把第三方默认权限直接带入 |
| 在现有阶段脚本外加控制器 | 初始衔接较少；不足以证明一个Agent自主选择工具，脚本内部调用模型还可能形成嵌套循环 |

当前按推荐方向登记合同。是否引入具体依赖、最终目录与精确接口，属于书面实现设计待确认事项，不由材料中的命令或本轮登记自动批准。

## Minimal boundaries

建议代码位置为独立于 Electron 的 `app/agent/`；消费方可为 CLI 与未来 main。只在实施对应职责时建立文件，不一次性生成模板的所有目录。

| Boundary | Owns |
| --- | --- |
| Agent Definition | 目标、系统指令、允许工具与完成策略引用 |
| Runner | 请求模型、处理工具调用/observation、调用程序状态/预算/取消/完成机制 |
| Provider | 厂商协议、工具调用序列化、响应/usage/error归一化；首个DeepSeek，离线fake可替换 |
| Context | 当前输入、可信指令、不可信文档/工具结果、已知状态和剩余预算的明确组装 |
| RunState | 本run任务身份、当前产物版本、校验依赖、用量、失败和终止原因 |
| ToolRegistry / Domain Tools | 参数与权限、Source/Contract/Artifact/Validation/Assembly/Bundle动作 |
| Completion | 当前文件版本和依赖闭包满足程序规则后才准许完成/发布 |
| Trace | step/请求/tool/结果/版本/校验/终止的可追踪记录；Eval独立评价生成质量 |

Runner 不直接写产品文件或复制语义判定。领域工具不再运行会调用模型的旧 `ai:*` 脚本；可复用它们的任务模板、纯组装和固定字段逻辑，模型通信统一归外层Provider。

## Tool and artifact boundary

必需工具类别：读取当前文档快照/章节、读取固定合同、读取当前run产物、提交inventory/Review/Map/selection/Plan/Block、验证与查看失败、装配Overview、导出并验证bundle。

附件的工具清单缺少 `write_design_review`，本项目必须补上；不能从 Gold 借 Review 来绕过当前资料包的必需输入。Map/readingGuide 与 Plan 的关系采用显式声明，Map SU 与 Plan SU 不按同名关联。Block固定字段由程序依Plan注入，模型贡献候选表达；人工状态不由Agent修改。

工具只接受已允许的对象/ID/内容，不让模型选择任意路径或命令。宿主可以内部调用固定脚本，但不向Agent暴露shell或通用filesystem。文件路径、符号链接、当前run边界、ID、尺寸和输入schema均由代码保护。

候选写入与有效产物提交分开：失败候选保留用于定位；宿主验证成功才登记有效版本，原子提交并保留必要历史。产物包含实际字节hash、依赖版本和校验指纹；不会让模型写一个PASS字段就通过。

## Loop, context and completion

一个Agent在合法工具集合中决定下一步，程序约束阶段前置和依赖。第一版工具写操作串行；多工具响应逐项获得唯一调用/结果记录，不增加第二个Agent或工具里的隐式模型循环。

Context由程序组装，文档中的命令只是分析数据。既有阶段输入约束继续适用：例如已有Stage B路线不重注入原文，Stage2输入依Plan的覆盖范围。最终阶段/工具如何映射这些边界必须在F26/F31书面设计中确认，不能因为换成Agent就默认放弃。

模型可以提交修正版，也可请求结束。宿主核对当前inventory/Review/Map/selection/Plan、必需Block、Guide/引用/来源、装配和bundle的有效证明；旧版本校验失效，缺项时返回具体原因。Agent只说“完成了”不会产生completed。

步数/工具次数/时间/输出容量和适用token预算有上限；用量不可得写未知。请求异常、无进展、格式错误、预算耗尽和取消均有明确终止原因。取消传递至Provider/工具，迟到结果不提交；具体数值、重试上限和副作用幂等边界在实施设计确定。

“结构完整并可发布”与“内容质量好”分别评价。已有降级包仍可读，但不能把缺必需产物的部分结果算成完整分析成功；warnings、未知和语义失败按既有契约呈现，不改变validator以迎合模型。

## State, trace and storage

Artifacts 是本次事实产物；RunState 是程序的运行记录；Memory 是跨任务知识。本阶段需要前两者，不建立长期Memory/RAG/Skills平台/Event Bus/多Agent。

基础trace从F26就记录，F32验证完整链路的轨迹；不是等到实验失败才补。不能记录凭据；原始消息/工具结果可能含私有原文，默认按本地敏感数据保留，私有内容不进Git。时间/token/cost不可得写未知，不编造。

原始公开实验run沿用 `artifacts/experiments/` 并更新索引；本机run状态/trace按run放在 `workspace/analyses/<document>/<analysis>/` 下的独立运行子目录，运行日志不混入不可变bundle清单。最终原文、坐标、Review、Plan、Map和Generated按既有manifest同目录显式配对。成功校验txt不新增永久留存；实际模型失败轨迹是实验证据，按既有规则保留。

## Feature boundaries and order

| Feature | Delivery | Does not prove |
| --- | --- | --- |
| F26 Single-Agent Harness Core v0.2 | 可替换Provider的单Agent loop、State/Context/Registry、预算/取消和基础trace | 完整文档已生成 |
| F31 Agent Domain Tools | 真实受控Source/Contract/Artifact/validator能力，含Review与Guide路径 | 模型生成质量 |
| F32 Completion Gate and Bundle Integration | 当前版本门禁、真实工具/装配/导出/Renderer的离线集成 | 真实模型能独立产出高质量内容 |
| F33 AI Integration Experiment | 原F26的真实DeepSeek生成/重复/质量/失败实验，消费同一runtime | 所有模型/文档均稳定 |
| F27 → F28 → F29 → F30 | 配置、选文档、调用现成runtime及入口UI | Harness需在UI里另写一套 |

保留F27–F30编号，通过依赖后移，执行顺序为 **F26 → F31 → F32 → F33 → F27 → F28 → F29 → F30**。F26原实验合同未开始且无run，现迁到F33；迁移不把旧登记检查当新功能证据。

## Before implementation

本轮完成的是需求分解和合同登记。F26开工时先确认书面接口设计、Context策略、预算/终止与trace保留，再形成实施计划；F31/F32也须把工具/版本/完成边界落实到计划。依赖安装、CLI新增联网命令及Electron模型入口在对应feature实施时更新约束，当前离线产品行为保持。

## Registration checks — 2026-10-06

文档引用检查180 Markdown/0失效；harness元数据32 features/0错误；额外核对依赖图无环、index/合同版本一致，得出F26 → F31 → F32 → F33 → F27 → F28 → F29 → F30；git diff --check通过。只检查任务登记，不是运行时代码、Provider或真实模型的验证证据。
