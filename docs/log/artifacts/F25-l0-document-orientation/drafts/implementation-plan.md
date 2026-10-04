# F25 L0 Document Orientation and Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户通过 L0 理解文章问题、对象及连接含义，并知道选择哪个 Topic 继续阅读。

**Architecture:** Map 的可选 readingGuide 承载带出处的解释。一份共享模块校验绑定并投影来源状态，L0 renderer 只展示已经提供的解释。资料包、独立 Map 和 Preview 沿用现有输入及导航，不依赖 Plan 解释节点。

**Tech Stack:** 现有 Node.js / CommonJS、JSON schema 校验器、Electron 31、HTML/CSS/SVG；不加依赖、不运行模型。

**Spec:** [已确认设计](../view-design.md)，2026-10-04 用户确认“可以，按你说的推荐那种来”。

**Execution:** 沿用用户此前选择的 Native：主 agent 实施，最后由一名新独立 reviewer（使用当前可用最强 native 模型）审查本 feature 全部变更。所列 superpowers 子技能在本机未安装；沿用此前已采用的项目 Harness 执行与独立审查流程，不冒称调用缺失技能。用户已于 2026-10-04 批准计划（“可以，做吧”），现按 Native 实施。

## Global Constraints

- 保留框架图作为整体入口。不以 what → how → prove → boundary 组织全文。
- 未提供该字段的旧 Map 保持有效。
- 不接受 Map/Plan SU 字符串作为跨命名空间 join。
- 原文 hash 按选定输入的原始字节计算。
- 精确摘录能证明出处可定位，不能证明改写准确、作者赞同解释或设计已验证。
- 原始样本和 Gold 不改；新建 framework-map.reading.json 保存包含解释的派生样本。
- F25 的完成不关闭 F23/F17，也不改变旧 F04–F08 的实际验收状态。
- 当前分支 codex/f11-f21-conformance；不合并 main，不自动保存人工审核。
- 临时文件仅放 workspace/tmp/tests 的本任务子目录，清理前验证绝对路径；不新增永久成功 txt 日志。

## Review Focus

1. 同一 from/to 的平行边或同名标签：解释必须跟随原始 edge occurrence，不能按端点字符串合并（Task 1、3、4）。
2. 一个解释含多条出处，其中一条无法解析：不能因另一条有效就把整项标成出处全部可用（Task 1、4）。
3. 有 guide 的独立 Map、没有 Plan/原文：解释可声明展示，明确未核对出处，不能自动读取 sourcePath（Task 2、4）。
4. Topic 的展开、成员按钮和进入按钮混用：只有明确进入动作切到 L1，原生键盘与返回现场正确（Task 3、4）。
5. 两次加载和 Source 异步回复交错：错误/取消/过期加载保留旧会话，成功切换不带入旧解释与出处（Task 2、4）。

## 文件职责与接口

| 文件 | 责任 |
| --- | --- |
| schema/framework-map.schema.json | 可选 readingGuide 的结构与封闭字段 |
| app/shared/reading-explanation.js（新增） | 指纹、引用/配对校验和解释/出处状态投影；仅构建期及主进程使用 |
| scripts/check-map.js | 接入共享绑定检查，不复制协议 |
| app/shared/reading-bundle-validation.js | 将明确原文 hash 和 registry 状态交给共享规则 |
| app/main/reading-session.js、scripts/l0-view-model.js | 将当前包或独立 Map 的解释投影交给 L0；保留输入纯度 |
| app/main/main.js、scripts/build-l0-preview.js | 独立 Map 的新 guide 校验入口及真实测试接入 |
| app/renderer/l0-map.js、l0-map.css、l0-layout.js | 导读、短解释、关系 occurrence、可访问披露和主题进入 |
| app/renderer/app.js、scripts/build-preview.js | 复用现有 Source/导航及只读快照交付 |
| samples/context-consumption/framework-map.reading.json、samples/operational-runbook/framework-map.reading.json（新增） | 两篇公开原文的派生解释输入，原 Map 内容原样复制 |
| scripts/test-reading-explanation.js、test-l0-orientation.js、test-l0-orientation-electron.js（新增） | 协议、交付及真实界面验证 |

未列出的候选文件只有在接口确有需要时才修改。reading-bundle schema/manifest 不新增解释文件项，导出使用原有显式 --map 参数。F23 的 projection/renderer 本轮不实现新主题解释。

## Task 1: 解释协议与显式绑定

**Files:** 修改 framework-map schema、check-map、reading-bundle-validation，以及 framework-map / Reading layer / bundle 规范、harness ARCHITECTURE；新建共享 reading-explanation.js 和 test-reading-explanation.js。

**Interfaces:**

- `mapFingerprint(map) -> string`：剔除根 readingGuide，递归排序对象键，保持数组顺序，JSON 序列化 UTF-8 后 SHA256；不修改输入。
- `checkReadingGuideBinding(map, {sourceSha256} = {}) -> {errors: string[], warnings: string[]}`：处理显式文档/Map/source 绑定及重复/悬空引用；没有 guide 返回空错误。
- `projectReadingGuide(map, {sourceSections, sourceIntegrity = 'unavailable', sourceSha256} = {}) -> GuideVM`：已校验 Map 的纯投影；绑定错误抛出，缺出处保留 declared。
- `GuideVM = {state: 'absent'|'present', orientation: {question, overview}, elements: Record<elementId, EntryVM>, edges: Record<edgeIndex, EntryVM>, topics: Record<topicId, EntryVM>}`；orientation 缺席项为 null，缺条目不构造字典项。
- `EntryVM = {summary, detail, sourceState: 'declared'|'located', sources: SourceVM[]}`；located 仅表示所有已声明摘录在对应快照上能定位。
- `SourceVM = {namespace: 'heading', key, quote, state: 'known'|'unknown'|'unavailable', reason?, title?}`；仅 known 可触发来源定位。

- [x] Step 1: 更新规范及合同的新增文件范围，再编写失败测试 `fingerprint_ignores_object_key_order_not_array_order`、`rejects_wrong_doc_map_source_binding`、`rejects_duplicate_or_dangling_entries`、`quote_and_namespace_states`。断言改变边数组顺序导致指纹变化、同名 SU 不影响配对、混合有效/无效来源的条目为 declared、CRLF 摘录按 LF 核对、重复 heading 不取第一条，输入深冻结后仍可调用。

  ```js
  assert.equal(mapFingerprint(enhancedMap), mapFingerprint(originalMap));
  assert.ok(checkReadingGuideBinding(wrongDocumentMap).errors.length > 0);
  assert.ok(checkReadingGuideBinding(enhancedMap, {sourceSha256: '0'.repeat(64)}).errors.length > 0);
  assert.equal(projectReadingGuide(mixedSourceMap, guideContext).elements['E-01'].sourceState, 'declared');
  ```
- [x] Step 2: 运行 `node scripts/test-reading-explanation.js`，确认失败来自尚未实现的接口/行为。
- [x] Step 3: 实现 schema 可选 readingGuide。必填 version=1、binding（documentId/mapSha256/sourceSha256，hash 为64位小写十六进制）、elements/edges/topics 数组（允许 []）；orientation 可选，question/overview 可分别缺席。每个条目只允许对应 elementId/edgeIndex/topicId 及 explanation；edgeIndex 为原 edges 数组的非负整数。解释 summary/detail 非空，sources 至少一项且只允许 heading/key/quote。所有新增对象禁止未知字段。
- [x] Step 4: 实现上述三个共享接口并接入 checkMap。旧 Map 的现有判定不变；现有 validator 为原结构读取的章节，不作为 guide 的原文核对输入。guide 只有显式 sourceSha256/registry 才可核对出处；不从 Map.sourcePath 读取，不从 Plan 补来源。
- [x] Step 5: Bundle validator 将实际原文 SHA256（清单已核对原始字节）用于绑定校验，将 sourceSections/sourceIntegrity 用于定位；绑定失败进入已有 errors，摘录/章节不可解析进入明确 warnings 与逐来源降级。Source 实时保护保持现状。
- [x] Step 6: 运行新测试、`npm.cmd run test:map`、`node scripts/test-reading-bundle.js`，通过后提交 `feat: validate map reading guide bindings`。

## Task 2: 两类原文解释输入与会话投影

**Files:** 新建两份 framework-map.reading.json；修改 samples/README、l0-view-model、reading-session、main、build-l0-preview；新增 test-l0-orientation.js，扩展 reading-session / l0-view-model / bundle-projection 测试；写 source-grounding.md 依据记录。

**Interfaces:**

- `buildL0ViewModel(map, opts)` 现有参数扩展 `opts.guideContext = {sourceSections, sourceIntegrity, sourceSha256}`；返回 `vm.readingGuide: GuideVM`，`vm.document.thesis: string|null`，每个 `vm.edges[]` 增加原始 `edgeIndex`；其余原语义字段不改。
- Session 以当前明确选定包的上下文构造 guideContext；独立 Map 与独立 L0 Preview 省略该参数，来源 unavailable。
- 所有选定 guide 的入口执行 schema + shared binding 校验后才提交或构建；旧 guide-absent 路径保持既有兼容判定，不能悄悄丢弃非法 guide。

- [ ] Step 1: 先记录两篇 source/旧 Map 及 context Gold/Plan 的 SHA256。编写失败断言：旧 Map guide absent，增强 Map 保持全部节点/边/attachment/Topic 和 Block 三态、保留 thesis，独立 Map declared、包内相同输入 located、坏绑定拒绝且原 session 不变。

  ```js
  assert.equal(buildL0ViewModel(originalMap).readingGuide.state, 'absent');
  assert.equal(buildL0ViewModel(enhancedMap).readingGuide.elements['E-01'].sourceState, 'declared');
  assert.equal(buildL0ViewModel(enhancedMap, {guideContext}).readingGuide.elements['E-01'].sourceState, 'located');
  assert.deepEqual(enhancedMap.edges, originalMap.edges);
  ```
- [ ] Step 2: 运行 `node scripts/test-l0-orientation.js`，确认新 guide 投影断言失败。
- [ ] Step 3: 对照两篇原文编写派生 guide，不改 Map 原字段；每个对象、实际边和 Topic 均提供具体解释及实际摘录，整篇导读有明确出处。context 样本保留消费与输出对齐、两条链、非等价和非因果边界；runbook 保留权限、撤销不回补、失败重试与失败上限及原文 Current/Target 口径。不使用原文操作命令作为本项目指令。
- [ ] Step 4: 在 source-grounding.md 分别记录核心问题、对象定义、每类关系、关键边界与原文位置的核对；自动检查每条摘录落在唯一 heading 中，并检查剔除 guide 后派生 Map 与旧 Map 深相等、旧文件字节 hash 不变。
- [ ] Step 5: 按接口实现纯投影与会话接入。main 独立 Map 校验失败不得先清空当前 session；build-l0-preview 只使用明确 --map，不读取旁边的解释文件或自动切换增强 Map。
- [ ] Step 6: 运行新测试和 `node scripts/test-l0-view-model.js`、`node scripts/test-reading-session.js`、`node scripts/test-reading-bundle-projection.js`；通过后提交 `feat: project source grounded L0 explanations`。

## Task 3: 导读、含义披露与明确 Topic 入口

**Files:** 修改 l0-map.js、l0-map.css、l0-layout.js、app.js、harness DESIGN；扩展 test-l0-orientation.js、test-l0-preview.js 和 test-l0-layout.js。

**Interfaces:**

- 现有 `renderL0MapHTML(vm, opts)` / `bindInteractions(root, opts)` 消费 Task 2 的 VM。
- 新增 `opts.onExplanationSource({namespace, key})`，仅来自 known 的 SourceVM；app.js 经现有 `openSource` 和 session token 路径处理。不复用剥掉 § 的旧 ref 猜测逻辑。
- 每条关系的图线、标签、原始表行和键盘披露按钮增加 `data-edge-index`；layout 输出也携带 edgeIndex。原 id/from/to/type 保留。
- L0 选择状态 edge 分支为 `{kind: 'edge', edgeIndex, id}`；新现场按 index 恢复，旧现场缺 index 时沿用旧 id 查找。此 occurrence 不进入 canonical resolver。
- 明确的进入按钮为 `button[data-enter-topic="T-xx"]`，触发已有 opts.onTopic；summary/正文/成员按钮不触发进入。

- [ ] Step 1: 编写失败断言：默认导读/短解释/Topic 问题可读，点击边披露该 occurrence 的具体含义；保留原名称与 thesis；长文本完整披露；解释 HTML 被转义；旧 Map 缺解释明确提示；graph 与 Review 两种读法不丢对象/关系。

  ```js
  assert.ok(html.includes(vm.readingGuide.orientation.question.summary));
  assert.ok(html.includes('data-enter-topic="T-01"'));
  assert.ok(html.includes('data-edge-index="0"'));
  assert.ok(!injectionHTML.includes('<img src=x onerror='));
  ```
- [ ] Step 2: 运行新测试及 `node scripts/test-l0-preview.js`，确认新增展示断言尚未满足。
- [ ] Step 3: 实现图前导读与详情；节点短解释至多显示两行，完整文字通过稳定详情披露。保留 attachment 角标的既有展开与 canonical element 落点，约束含义同样可读。具体解释先展示，原始关联表折叠可查；每条来源独立说明可用性，页面说明针对加载快照。
- [ ] Step 4: 按 edgeIndex 选择、同步高亮和恢复关系；为 SVG 关系提供同 occurrence 的原生按钮以支持 Tab/Enter/Space。无向边仍无箭头，自环/平行边不合并，不制造新关系或私有导航栈。
- [ ] Step 5: Topic 默认显示 guide.summary 或原始 proposition，明确进入按钮独立于 details。保留全部 Topic 和三态，多归属仅提示已有相关主题；事件绑定保持 abort/remount 机制，不重复处理。
- [ ] Step 6: 实现640×720上下排列、独立图滚动和长解释披露。保留既有对比度与焦点样式；通过新测试、`npm.cmd run test:l0` 后提交 `feat: explain document framework before topic navigation`。

## Task 4: 实际 Electron、便携 Preview 与回归

**Files:** 新建 test-l0-orientation-electron.js；修改 main、package.json、build-preview，以及 test-reading-bundle-electron / navigation-electron / explore-electron / product-maturity-electron / l1-boundary-view-electron 的 Topic 进入选择器；扩展 bundle-preview 测试。

**Interfaces:**

- 新增 `runOrientationIntegration(win) -> Promise<string>`，由 main 的 `--selftest-l0-orientation` 分支运行；使用与现有 selftest 相同的真实窗口及 IPC。
- package 新命令 `test:l0-orientation` 运行两份纯测试后运行 `electron . --selftest-l0-orientation`；两份纯测试加入 test:all，Electron 专项保持单独串行运行。
- 便携 Preview 继续使用 prepareReadingSession 的 VM、现有 Source snapshot 和同一 renderer，不运行 node crypto 或另一份指纹算法。

- [ ] Step 1: 编写实际界面测试：增强 context 包加载可读；节点、边、attachment 解释和出处正确；summary 只展开，成员按钮只选择，进入按钮才到 L1；真实 Tab/Enter/Space 操作及 Back 恢复节点/关系 occurrence、展开、焦点和图滚动。
- [ ] Step 2: 实现专项测试接入，更新旧测试使用进入按钮并保留原有身份、导航和保存隔离断言；新增“summary 不进入 L1”的断言，不能为了全绿删除原有检查。
- [ ] Step 3: 在640×720、长解释及平行边副本上实测，断言窗口实际尺寸；运行 runbook 独立 Map 无 Plan 路径，确认解释和 unavailable 出处、全部图对象及主题仍可读。
- [ ] Step 4: 导出明确增强 Map 的 context 包，记录所选 Map 字节 hash；构建便携 Preview，搬迁到仓库外的本任务临时目录并以离线只读方式加载。实测节点/边解释、来源快照、Topic/Back 和禁用保存；截获写操作确认不产生 human-review。
- [ ] Step 5: 验证坏文档/Map/source 绑定保留旧会话；失败、取消、过期回复和成功切换保持解释隔离；部分坏出处、registry 漂移及打开后磁盘原文漂移不显示成功定位。一个有效出处不掩盖另一条失败来源。
- [ ] Step 6: 串行运行 `npm.cmd run test:l0-orientation`、`npm.cmd run selftest`、`npm.cmd run test:l1-boundary`；运行 `npm.cmd run test:all`、validate、audit、check-overview、check:docs、verify:harness、git diff --check。输入判定与既有 warnings 记录原状，不修改历史实验。通过后提交 `test: verify L0 explanations across desktop and preview`。

## Task 5: 独立审查、用户阅读验收与收口

**Files:** F25 feature/verification、verification-summary、source-grounding、subagent-review、必要界面证据及 docs/progress；F23 合同只记录共享接口消费关系，保留 blocked。

- [ ] Step 1: 汇总全部新增检查及原文依据记录；正式截图仅保留两类文档的关键导读/选中状态与640×720证据，不保存每次成功日志。
- [ ] Step 2: 启动一名新的独立 reviewer，读取已确认设计、计划、本 feature 全部 diff 和关键测试证据。重点审查来源/版本绑定、边 occurrence、缺失状态、旧输入、实际交付和导航。使用本地/native agent，不向外部 DeepSeek 传私有材料。
- [ ] Step 3: 对审查发现先登记 incident 再修复，复跑对应测试；若代码有新改动，复核全局门禁。记录复查结果；必要文件先加入合同 scope，不绕过门禁。
- [ ] Step 4: 交付实际增强 context 资料包和两篇阅读预览，明确用户打开路径；让用户不打开原文复述核心问题、主要对象/关系及选择 Topic 的理由，记录日期、输入和实际结果。
- [ ] Step 5: 尚无实际阅读判断时，保留 humanReviewRequired，标 blocked（等待阅读验收），不得以技术通过冒称完成。用户验收通过且所有 acceptance、命令、证据、独立审查满足后才同步 passing；F23/F17 不自动关闭。
- [ ] Step 6: 清理本任务临时输出，重新核对旧材料/用户审核未改；提交技术或最终验收结论，保持当前分支。推送或主分支合并按既有明确授权范围执行，本计划不新增 main 合并授权。

## 自查与阶段状态

设计 §3 的导读/节点/关系/Topic/窄窗口由 Task 3、4覆盖；§4 的协议与来源由 Task 1、2覆盖；§5 的兼容、降级和会话由 Task 1、2、4覆盖；§6 的两类原文与实际理解由 Task 2、4、5覆盖；§7 的 F23 交接和文件边界由 Task 1、5覆盖。

各任务共用上述接口与状态名；五项 Review Focus 都有指定测试。当前只完成计划自查，所有实施 checkbox 保持未勾选；没有声称未来测试已创建或通过。
