# F25 L0 导读与解释设计

Date: 2026-10-04. Status: **书面设计已确认；实施计划待审阅，尚未开始产品实现**。

本设计响应[实际阅读反馈](../../../harness/incidents/2026-10-04-reading-comprehension-feedback.md)，范围以 [F25 合同](../../../harness/features/individual_feature/F25-l0-document-orientation/feature.md)为准。用户于 2026-10-04 确认“可以，按你说的推荐那种来”，采用 Map 可选 readingGuide。[实施计划](drafts/implementation-plan.md)已写，待审阅后实施；本设计不直接替代当前规范，正式接口须在改代码前同步。

## 1. 要解决的问题

读者打开 L0 后，应能说清文章在讨论什么、图上的主要对象是什么、连接代表什么，并选择一个能继续回答自己疑问的 Topic。当前示例 Map 只有名称和关系类型，选中后的关系表主要重复箭头，无法支持这个目标。

保留框架图作为整体入口。不以 what → how → prove → boundary 组织全文，不把全文、所有解释区块或人工审批搬进 L0。F23 负责 L1 的主题局部阅读；F24 后置。

实测发现：Map schema 已支持可选根字段 `thesis`，但 context-consumption Map 未提供。不能将“示例缺少中心命题”误写成“schema 无法承载中心命题”。已有 thesis 原样保留；新增核心问题是有来源的阅读引导，不冒充作者结论。

## 2. 三种办法与推荐

| 办法 | 收益 | 代价与限制 |
| --- | --- | --- |
| **推荐：Map 增加可选 readingGuide** | 图和解释作为一个明确输入；资料包、独立 Map 和后续 L1 能复用；不用增加运行时配套文件 | 要扩展 Map schema、校验与投影；解释需要绑定原文和图的版本 |
| 独立 explanation.json，通过清单选入 | 可以完全保持 Map 文件不变；解释可单独修订 | 多一种文件和配对协议；独立 Map 入口还需要显式选择解释文件，用户管理负担增加 |
| 只调整现有名称、关系 label/note 和 Topic proposition 的展示 | 数据协议改动少 | 示例没有节点定义；现有 Map SU 与 Plan SU 未建立身份对应，不能从 Plan 猜解释，无法完整解决问题 |

采用用户确认的推荐方案如下。原始样本和 Gold 不改；新建 `framework-map.reading.json` 保存包含解释的派生样本。实际资料包仍通过清单明确选择 Map，目录中同时存在多个 Map 也不自动选“增强版”。

## 3. 用户打开后会看到什么

### 3.1 图前的整篇导读

保留文档标题和 Current/Target 属性。图前直接展示有来源的核心问题与简短整体说明，并保留 scope、非目标及已有 thesis。非目标的长内容可展开，重要边界不能藏在 hover 中。

context-consumption 的候选核心问题是：“怎样区分上下文到达、可以使用和实际被生成任务使用？它与最终输出对齐是什么关系？”整体说明同时点出两条链保持分离、实际消费发生在 outline generation、scene 继承生成后的 outline。这些内容须分别对照原文，不将局部机制图说成文章的全部内容。

### 3.2 有含义的图与节点

节点保留原始名称、identity、类型和实际关系，增加一条短解释。例如 Frozen Context 的短解释说明它承载的是冻结后的教学语义，选中后解释本篇中它的用途和边界。短解释可以截断，但完整内容始终可通过键盘选择披露。

已有 attachment 仍按既有规则呈现，能展开全部对象并读到解释。概念和约束不会因为增加解释而变成 process，不能把 Receipt、Availability、Consumption 额外连成主图流程。

### 3.3 选中后直接读懂

节点选中后，在图附近的固定详情区展示“这是什么”“在本文中有什么用”及适用边界，附原文入口。原始 incoming/outgoing、角色码和 provenance 表保留为进一步展开的信息。

关系选中后，同一详情区解释这条具体连接。以 Outline Generation Attempt consumes Generation-facing Projection 为例，应说明真实生成输入与仅附加在 Prompt 中的区别，而不是只重复“使用”。条件与例外在有来源时一并披露。

关系选择只是本层披露，不新增 canonical address。没有原始 edge id 的关系按本次 Map 的原始数组 occurrence 对应解释；平行边、自环和无向关系均保持其原有身份及方向语义。

### 3.4 先了解主题，再进入 L1

右侧保留完整 Topic 集合，每项默认可见标题和“这个主题回答什么问题”。例如三级递进语义对应“为什么收到上下文、能够使用、实际使用不能互相替代？”

每项用明确的“进入主题”动作打开 L1；解释展开与进入主题分开，避免刚想了解主题就被跳转。没有新增解释时展示原始 proposition，并注明没有补充导读。

选择图节点可提示它关联的 Topics，完整列表仍可见。多 Topic 关联、没有图节点的 Topic、未知和已知空 Block 状态都保留。排序不冒充作者阅读顺序，也不把节点的 Topic 当作唯一归属。

### 3.5 窄窗口与返回

640×720 时导读、图、选择解释和主题入口依次排列；图保留独立滚动。节点和关系具备原生键盘可操作入口，长解释在详情区完整阅读。

沿用 F19 的 controller 和现场捕获：L0 → L1 → Back 恢复节点/关系选择、展开、焦点和滚动。Source 关闭也恢复原位置。Electron 与只读 Preview 使用同一投影、renderer 和解释规则。

## 4. 解释资料怎样存、怎样配对

拟新增 Map 可选字段 `readingGuide`，版本为 1。schema 只接受约定字段；文字只作为文本渲染，不执行 HTML。未提供该字段的旧 Map 保持有效。

| 字段 | 含义 |
| --- | --- |
| version | 固定为 1 |
| binding.documentId | 必须等于 Map.document.id |
| binding.mapSha256 | Map 除 readingGuide 外的完整内容的确定性指纹 |
| binding.sourceSha256 | 明确选定原文的完整 SHA256 |
| orientation.question / orientation.overview | 有来源的核心问题与整体说明；可分别缺席，不从标题生成 |
| elements[] | elementId + explanation；只能引用原有对象，重复或悬空引用拒绝 |
| edges[] | edgeIndex + explanation；只能引用原 edges 数组中的 occurrence，不能新增边 |
| topics[] | topicId + explanation；解释其关注问题和范围，不新增 Topic |

每个 explanation（以及 question/overview）统一为 `{summary, detail, sources}`；summary 和 detail 是非空文本，sources 至少一项。每项来源为 `{namespace: "heading", key, quote}`，指向明确的 heading 坐标并附原文摘录。不接受 Map/Plan SU 字符串作为跨命名空间 join。

指纹算法对排除 readingGuide 后的 JSON 递归排序对象键，数组保持原序，按 UTF-8 编码后计算完整 SHA256。必须共用一份实现；对象字段顺序变化不失效，节点/边/主题、语义字段或数组 occurrence 变化均需重新核对解释。

原文 hash 按选定输入的原始字节计算。摘录只允许换行统一为 LF 后，与唯一解析 heading 的文本做精确子串匹配；不做模糊匹配、标题猜测或“取第一个重复章节”。精确摘录能证明出处可定位，**不能证明改写准确、作者赞同解释或设计已验证**。

F25 拟在现有 `app/shared/` 目录新增 reading-explanation.js 模块，拥有协议、指纹、外键和来源状态规则。Map validator、资料包 loader、L0/后续 L1 projection 共用它。renderer 只接受投影，不读文件、不从 Plan 提取定义、不现场生成解释。

L0 的语义输入仍只有 Map；原文/registry 只用于核对与定位 guide 已声明的来源。独立 Map 不要求 Plan，也不按 sourcePath 自动读取原文。资料包导出明确接收选定的增强 Map 并保持其原始字节，既有清单已经绑定 Map 与原文，不增加第二套配套文件选择规则。

## 5. 缺失、错误与漂移的具体行为

| 情况 | 行为 |
| --- | --- |
| 旧 Map 没有 readingGuide | 保留图、导航和原始资料，提示未提供补充解释；不生成伪解释 |
| 有 guide，但某对象/关系/主题没有条目 | 该项披露解释缺失，仍保留结构；不借邻居或名称补写 |
| guide schema 非法、重复/悬空引用、文档或 Map 指纹不匹配 | 新输入校验失败，拒绝提交新会话，保留旧会话；不能以丢弃错误字段的方式悄悄加载 |
| 包内 guide 原文 hash 与明确选定原文不符 | 配对失败，拒绝提交；不重写 hash 掩盖错误 |
| 独立 Map 未提供原文 | 可展示已声明解释，明确“未加载原文，未核对出处”，来源按钮不可用；不依赖 Plan |
| 已有原文，但引用无法唯一解析或摘录不匹配 | 对应解释来源不可用，保留明确原因；不宣称已核对；来源失败不能升级为 verified |
| registry 与原文漂移 | 沿用现有 unavailable 降级，解释按未核对展示，禁用来源定位；结构保留 |
| 加载后磁盘原文发生变化 | Source 动作仍经当前 session 的实时完整性保护；不能打开旧坐标。页面说明解释针对加载时快照，不宣称持续验证当前磁盘内容 |

出处状态按条目投影，不因一个有效引用替其它引用背书。取消、失败、过期加载和成功切换沿用现有 session 纪律；不保存人工审核、不修改用户文件。

## 6. 样本与验证

新增两份派生 Map：context-consumption（概念与生成机制并存）及 operational-runbook（操作流程、异常、权限和失败边界）。二者原文和旧 Map 保持字节，第二篇没有 Review/Plan，不伪造资料包配套关系；可从独立 Map/Preview 路径验证其导读。

解释由本次开发对照已提供原文离线编写；每条附实际摘录，另写简短依据核对记录。打开资料时不调用模型，不运行外部生成实验。未来模型生成导读属于另一个范围，本轮不修改 prompts 或 AI 流水线。

机器检查包括：绑定错误、相同 SU 假对应、重复章节、摘录不符、旧输入、条目缺失、原文缺席/漂移；输入纯度和确定性；完整节点/关系/Topic；平行边、自环和无向边；实际键盘、窄窗口、导航恢复、会话切换及搬迁只读 Preview。

技术完成后请用户实际阅读两篇，记录能否复述核心问题、解释主要对象和连接、说出选择 Topic 的理由。机器全绿与截图只能证明交付正常；实际理解验收未完成时不标 passing。

## 7. 实施边界与后续交接

实施计划确认后，先在 framework-map / Reading layer / bundle 规范与 harness ARCHITECTURE、DESIGN 中登记接口和 UI 变化，再修改 schema 与产品代码。本设计不作为新的 authority。

实施计划涉及的 `app/renderer/l0-map.css`、`samples/README.md`、独立 L0 预览构建器和新增派生 Map 已加入 F25 文件范围；如需额外文件，应先更新合同。当前尚未创建这些样本或修改 schema。

F25 拥有共用解释协议；F23 复用已验证解释和来源状态，继续设计主题局部含义、对照和边界摘要。F25 的完成不关闭 F23/F17，也不改变旧 F04–F08 的实际验收状态。

## 8. 审阅点

需要确认的产品方案是：**图前有整篇导读，节点有短解释，点击节点/关系能读到具体含义，Topic 默认说明能回答的问题，再显式进入主题；解释随 Map 一并加载。**

方案已确认，现进入书面实施计划审阅，沿用此前 Native 执行方式；当前未开始产品实现，F25 不构成完成。
