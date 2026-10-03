# F23 L1 Topic Boundary View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 本机未安装上述执行子技能，已查找现有技能目录；不声称调用。执行方法沿用用户先前选择的 Native：主 agent 按本计划实现，最后由独立 reviewer 审查。使用项目既有 Harness 和验证命令，不安装另一套流程。当前仅写计划，待用户审阅后执行。

**Goal:** 从 L0 点击 Topic 后，以完整的内部关系和外部连接图阅读 L1，并保留当前身份、能力状态与返回现场。

**Architecture:** projectTopic 只补原始显示信息，保持既有 membership 与边界分类。独立 L1 renderer 复用 L0Layout 的内部坐标并处理外部端点，Electron/Preview 共用；现有 Reading controller 仍负责所有导航与现场恢复。

**Tech Stack:** CommonJS/浏览器双入口 JavaScript、原生 HTML/SVG/CSS、现有 Electron 31 与 Node 18+；零新增依赖、离线运行。

**Spec:** [已确认的展示设计](../view-design.md)。用户于 2026-10-03 回复“可以，做吧”，确认展示设计；未将该回复计作尚不存在的本计划审阅。

## Global Constraints

- F23 范围只补 L1；L2 独立解释页由 F24 完成。
- “数据、身份与导航规则不扩张”；无新 schema、受控词汇、canonical landing、私有导航栈或模型调用。
- “对象可同时参与多个主题”；Inside 唯一依据 element.topics，不表达容器或唯一归属。
- “所有可绘制关系为空”才显示 Topic boundary summary；crossing-only 必须画图。
- “输出与输入不共享可写的嵌套对象”；原文、Gold、实验和用户审核不修改。
- “没有 crossing 时不画右侧空区域”；外部端点不能计入 Inside。
- “relates-to（包括 internal）无箭头”；保留 label/qualifiers/note，attachment/relationGap 不变成线。
- “640×720 窗口下页面宽度不溢出”；大画布只在图区域滚动。
- “成功校验不生成永久 txt”；临时目录限定 workspace/tmp/tests 下的本任务子目录，结束检查绝对路径后清理。
- F23/F17 passing 需要用户查看实际界面并确认，不能用自动化或设计确认替代。

## Review Focus

- 同端点多条边、自环和回边：每条输入关系有独立路径与可操作标签，不能只显示一条重叠线（Task 2/3）。
- 外部节点同时有 inbound/outbound/无向连接：一张外部卡片，箭头按每条实际关系，不以右侧位置定义方向（Task 1/2/3）。
- 长名称、qualifiers 中的 HTML 特殊字符：完整披露且安全转义，卡片和标签不撑破页面（Task 2/3）。
- 已声明 O-xx 但没有 Plan、Unknown、Known(0)：三态分开，没有虚假可用按钮（Task 1/2/3）。
- 图滚动或选中后切入 Block/Element/Explore，再 Back 或换包：当前 Topic 现场恢复，新 session 不泄漏旧选择（Task 3）。

---

### Task 1: 保持语义的显示投影

**Files:**
- Modify: `app/shared/l1-topic-projection.js`
- Test: `scripts/test-l1-topic-projection.js`

**Interfaces:**
- Consumes: 已验证 framework-map 与可选 Plan；既有 `projectTopic(map, topicId, {plan} = {})` 接口不变。
- Produces: 保留 kind/topic/inside/relations/relationClasses/blockOrganization/representation/blockEntries；新增 `document` 和 `outside`。document 只复制 id/title/sourcePath/role，缺字段保持缺席。inside/outside 原样复制 id/label/type 与存在的 sectionRefs/sourceUnitIds；topic 保留可选 sectionRefs；relation 保留原可选 id/label/qualifiers/note。
- outside 为本 Topic 全部 crossing 外部端点的去重集合；顺序只是确定性布局顺序。所有输出嵌套结构复制并冻结，缺字段不自动填 0 或推断来源。

- [ ] **Step 1: 添加会失败的投影测试。**
  `preservesBoundaryDisplayFields` 检查 T-03 的 inside=E-03/E-08、outside=E-02/E-04，关系 from/to/type/role 与源一致；外部两端均不在 Inside。`copiesOptionalMetadataWithoutAliasing` 检查 qualifier 深层副本及 absent 字段保持缺席。`preservesOrganizationKnowledge` 检查 Unknown/empty/known 的现有编码、known 无 Plan 仍保留 IDs。
- [ ] **Step 2: 运行 `node scripts/test-l1-topic-projection.js`。** 新增 outside/metadata 断言应失败；记录实际失败原因，不把加载错误冒充测试失败。
- [ ] **Step 3: 实现投影增量。** membership/classify/三态逻辑保持；只从原元素查外部端点和原始显示字段。方向语义继续来自既有分类，不在展示层复制边界计算。不存在的 Plan Block 保留原错误。
- [ ] **Step 4: 验证 corner cases 和纯度。** 增加 `crossingOnlyStillMap`、`emptyInsideKnownZero`、`multiTopicNoOwnership`、`externalOnlyExcluded`、`outsideWithMixedRelationsDeduplicated`；冻结或比较深层原输入，修改输出不会反写输入。运行投影测试、reading-runtime 和 reading-integration 的既有离线脚本，全部 exit 0。
- [ ] **Step 5: 提交任务检查点。** 仅该投影和测试；commit message `feat: preserve L1 boundary display metadata`。

### Task 2: 图形、披露和退化的共用 renderer

**Files:**
- Create: `app/renderer/l1-topic-view.js`
- Modify: `app/renderer/styles.css`
- Create: `scripts/test-l1-boundary-view.js`

**Interfaces:**
- Consumes: Task 1 的 L1TopicViewModel；现有 `L0Layout.computeL0Layout(vm, opts)`，不修改 L0Layout；options 提供 canReadBlock(id)、canSourceRef(ref)、onBack()、onElement(id)、onBlock(id)、onSourceRef(ref)。来源按钮仅用于实际可解析的 `§key`；SU 编号原样披露，不转换为 heading、不猜来源。
- Produces: CommonJS 与 `window.L1TopicView` 双入口；`computeTopicLayout(topicVM)` 返回 `{nodes,edges,bounds,insideBounds,outsideBounds}`。node 保存原 id 和 scope（inside/outside）、有限坐标；edge 保存本地 relationIndex、原 from/to/type/role 与 path/label 坐标。relationIndex 仅供本次渲染匹配，无持久身份。
- Produces: `renderTopicHTML(topicVM, options)` 返回 HTML；`mount(host, topicVM, options)` 安装界面和事件；`getSelection(host)` 返回 null 或 `{kind:'element',id}` / `{kind:'relation',index}`；`restoreSelection(host, selection)` 恢复有效选择，不执行导航或移动焦点。
- DOM hooks: `[data-l1-topic]`、`.l1-graph-wrap`、`[data-l1-node]` 配 `data-l1-scope`、`[data-l1-relation]`（SVG path）、`[data-l1-relation-button]`、`[data-l1-role]`、`[data-l1-block]`；唯一 `#l1-back` 与详情容器。不得生成 `#element-E-xx` 或 `#block-O-xx` 重复 canonical anchor。

- [ ] **Step 1: 添加失败的纯布局测试。**
  `goldInternalGraph` 对 T-02 检查 5 节点/4 路径、无 outsideBounds；`realCrossingGraph` 对 T-03 检查 2 Inside/2 Outside、2 条已有边；逐节点/关系比较集合，不仅检查 HTML 包含字符串。运行新测试，初次应因新模块不存在失败。
- [ ] **Step 2: 实现 `computeTopicLayout(topicVM)`。** 内部坐标复用现有算法、传 attachments=[]；右侧只容纳实际 outside，按连接位置排序且错开。crossing 接原 from/to；所有关系按原索引保留。为同端点多条关系分配不同路径/标签槽，自环与回边留空间；尺寸包含所有节点、标签和线，不默默裁切。
- [ ] **Step 3: 添加并通过结构/几何测试。**
  `parallelAndSelfRelationsStayDistinct` 检查 path 数、每条 relationIndex 唯一、路径可区分、坐标有限且在 bounds 内；`membersDoNotOverlap` 检查节点矩形不重叠；`crossingOnlyNotSummary` 与 `noRelationsSummary` 检查 representation；`symmetricRelationsHaveNoMarkers` 检查 relates-to path/文字无方向；`layoutPureAndDeterministic` 比较重复结果和输入字节。
- [ ] **Step 4: 实现 HTML、mount/selection API 与样式。** 文档/Topic/命题和真实计数常驻；有边显示图，无边显示成员摘要。外部卡片显式标记；标签原生 button，SVG 仅视觉呈现。详情经安全转义显示完整原字段。related Block 按真实三态/availability 披露；无 Plan 仍显示已声明 IDs 与不可用原因。点击只选择，显式操作回调才导航。原生 details 保留完整成员/关系辅助披露。
- [ ] **Step 5: 检查长名称与 HTML 特殊字符。** 测试 `escapedMetadataAndFullLabels`、`organizationHasNoInventedEntries`；未知和空的文案分别匹配源状态。样式使用现有变量、可见焦点，不压暗其他节点；局部 overflow:auto，窄窗口详情/区块入口上下排列。
- [ ] **Step 6: 运行新纯布局测试与 `node --check app/renderer/l1-topic-view.js`。** 全部 exit 0 后提交 renderer/样式/新测试，commit message `feat: render L1 topic boundary graphs`。

### Task 3: 产品接入、真实界面与交付验证

**Files:**
- Modify: `app/renderer/app.js`、`app/renderer/index.html`、`app/main/main.js`
- Modify: `scripts/build-preview.js`、`package.json`
- Create: `scripts/test-l1-boundary-view-electron.js`
- Modify: `scripts/test-reading-integration-electron.js`、`scripts/test-reading-navigation-electron.js`、`scripts/test-reading-bundle-preview.js`（只在需强化新路径时修改）
- Update evidence: 本 F23 artifact 目录、F23/F17 合同与 verification、index、progress、harness DESIGN/ARCHITECTURE 与 Reading machine enforcement 的实际完成说明。

**Interfaces:**
- Consumes: Task 2 的 mount/getSelection/restoreSelection；`navigation.enter/resolve/back` 及现有 captureReadingFrame/restoreReadingFrame。
- Produces: `runBoundaryIntegration(win)` 用真实 bundle/独立 Map 入口测试；`exerciseBoundaryView(win)` 在当前已加载 Gold bundle 上测试，共用于 Electron 和搬迁 Preview。局部状态存放现有 frame.context 的 `l1Selection`；scroll 集合增加 `.l1-graph-wrap`。
- 所有临时输入基于公开样本复制，验证 schema/check-map 后走真实 loadL0，不把直接注入 window.__state 当作加载证据。临时文件在 workspace/tmp/tests/f23-boundary-view 内生成，不改 samples；记录截图是显式 evidence 模式，普通回归不写永久输出。

- [ ] **Step 1: 添加真实入口失败测试。** `exerciseBoundaryView(win)` 从 `.topic-entry` 打开 T-02，检查 5 个 Inside/4 个 SVG path、节点/标签 checkVisibility、非零矩形、端点和原关系一一对应；T-03 检查外部标记及完整 crossing。当前文字页面应失败。
- [ ] **Step 2: 接入 renderer 和现场恢复。** viewL1 改为模块调用；Element 走现有 resolver、Block 走带 topicId 的 enter；出处只走现有可解析协议。index script 在 l0-layout 后加载模块，Preview 内联列表保持相同顺序。捕获/恢复 L1 selection 和图滚动，保持 generation/session guard；卸载清理监听，重复 mount 不累加处理器。render 不重新判 membership/方向/来源。
- [ ] **Step 3: 强化真实几何/键盘测试。**
  `nativeNodeAndRelationDisclosure` 用 webContents.sendInputEvent 的 Tab/Enter/Space；焦点可见，显示完整详情而未导航。`realCrossingSourceAndElement` 检查外部完整 ID/label、显式 Element 定位唯一 canonical subject、Back 恢复 L1。`backRestoresGraphOccurrence` 选中并实际滚动图后进入 Block/Explore，返回检查 Topic、选中、details、focus、scroll；resolverCalls 不因 Back 增加。
- [ ] **Step 4: 强化窄窗口与退化路径。**
  `narrow640x720` 在 zoom=1、真实 viewport 640×720 检查页面宽度、图内可滚动和标签操作，避免只截图宽窗口。公开样本或经校验的派生输入覆盖 crossing-only、无关系、Inside=∅、多 Topic、无 Plan、Unknown/Known(0)、relates-to、自环/平行边；确认没有持久 synthetic identity 或自动审核文件。换包后旧选择/详情不进入新 session。
- [ ] **Step 5: 接入两个真实测试入口。** selftest 调用 runBoundaryIntegration；--verify-preview 的 Map 分支重置真实 snapshot 后调用 exerciseBoundaryView，保护无 Map 分支。纯布局测试接入 test:all。保留既有 F15 relates-to 文本测试，并新增 SVG 无 marker 断言，不能移除旧语义断言以适配页面。
- [ ] **Step 6: 执行约定回归。** 对修改 JS 逐个 node --check；运行 `npm.cmd run test:all`、`npm.cmd run selftest`、`npm.cmd run validate`、`npm.cmd run audit`、`npm.cmd run check-overview`、`npm.cmd run check:docs`、`npm.cmd run verify:harness`、`git diff --check`，均 exit 0。test:all 含搬迁 readonly Preview；已通过的检查仅在新修改/失败或未解问题下重跑。输入旧 warnings 如实记录，不改 validator 或 Gold 消除它们。
- [ ] **Step 7: 记录实际截图与独立审查。** 显式保存 Gold T-02 内部图、T-03 crossing、640×720 和摘要截图，注明输入、路径和尺寸；不含用户私有材料。独立 reviewer 阅读本轮 diff、设计与测试，处理 P1/P2 并重跑受影响检查。成功日志只在终端，结果与材料链接进入 verification-summary。
- [ ] **Step 8: 交付用户实际界面验收。** 用户查看图并确认内部机制、外部连接可理解，再关闭 humanReviewRequired、F17 重开项与 F23 passing。用户验收前如实保持 active/blocked，不将“设计确认”填入实际界面 acceptance。F24 不在本任务提前实现；未获整体验收不合并 main。
- [ ] **Step 9: 提交可验证交付。** 实现检查点 commit message `feat: integrate and verify L1 boundary reading`；若仍待用户验收，提交摘要明确该未完成项，后续验收另行记录。继续 codex/f11-f21-conformance，不创建第二个工作流。

## Plan self-review / current state

投影字段、纯布局、渲染、退化、键盘/几何、导航现场、只读 Preview 和验收分别映射到三个任务；五项 Review Focus 均有明确测试。Source 的解析能力不扩张，现有 SU 标识不能直接作为 heading 打开；该限制在 Task 2/3 保留。新文件未创建，所有任务均未执行，本计划不是完成证据。

沿用 Native，不需重新选择执行方式。本计划仍需用户审阅后开始产品实现。
