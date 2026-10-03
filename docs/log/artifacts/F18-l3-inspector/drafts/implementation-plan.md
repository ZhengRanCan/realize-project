# Reading Bundle and L3 Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户只打开同一分析目录的一份清单，默认看框架图，并从已有解释可靠地核查原文与审阅材料。

**Architecture:** 离线 exporter 写独立资料包，主进程读取与校验后提交 session；共享 projection 生成 L0/L1/L2/L3 的输入。renderer 与 Preview 复用同一投影和交互，不推断跨制品关系。

**Tech Stack:** 现有 Electron 31、CommonJS / Node.js、原生 fs/path/crypto、现有 Schema / validator 与 DOM renderer；不增加运行时依赖，不调用模型。

**Spec:** [Approved design](../runtime-bundle-design.md)，2026-10-03 用户认可其当前版本。

**Status:** 待用户审阅实施计划；本文件列出的产品文件尚未创建或修改。

## Global Constraints

- 正常资料包默认进入 L0 Framework Map，再按模型明确提供的关联逐层查看内容。
- 用户生成的 bundles 与 human-review 不进入 Git；测试在临时目录生成包，仓库保留构造数据和导出命令。
- 导出保持已有 Plan / Generated 的原始字节，从而保留 generation.planSha256 的既有配对意义。
- 主进程负责读文件、校验和 session 切换；preload 传递最小 API；renderer 不读文件、不补语义关系。
- L2 按 Plan Block LEFT JOIN Generated 投影；Plan 权威字段不被 Generated 覆盖。
- 两条路径分别展示；章节重叠不推出 Evidence 支持某个 SU。
- Claim verification capability 恒为 Known Absent；不出现 Verified / Unverified / Approved 汇总结论。
- fragment 仅为当前 render-session 的临时 inspection context，没有深链、评论锚点或 Explore Focus。
- L3 Close / Back 恢复 origin render context；不在本轮建设 F19 的完整 canonical resolver。
- 标题与字段用英文，正文用中文；规范、设计与历史证据各有唯一归属。

## Review Focus

1. 中文/空格路径和整包移动后仍可加载；旧产物内的仓库相对路径不得被运行时跟随（Task 2）。
2. 两次异步加载或过期 inspection 回复不能把旧包资料写进新 session（Task 4 / 5）。
3. 取消或失败加载不得清空未保存审核；各包的 human-review 不得共享上一次状态（Task 4）。
4. Generated 的缺失、生成 FAIL 和结构非法要分开；保留 Plan 主体且不把各状态汇总成 verification（Task 3 / 5）。
5. 同标签的标题重复、围栏中的标题、Map / Review 的不同 ID 空间不能诱导错误配对（Task 1 / 2）。

## Interfaces and File Responsibilities

以下都是本计划的约定，不取代认知规范。Node-only 模块不由 renderer 引入。

- `app/shared/source-coordinates.js`：`parseDocHeadings(text)`、`buildSourceRegistry(text,{sourcePath})`、`resolveSourceCoordinate(registry,{namespace,key})`。
  namespace 为 `plan-section` / `heading`；解析结果为 `known` / `unknown` / `unavailable`，Known 才带 range/text。
  registry 包含 `registryVersion:1`、`document:{path,title,totalLines,sourceSha256}`、legacy `sections[]` 与 `headings[]`。
  heading range 到下一个同级或更浅标题前；`sections[]` 保留 §0 和现有中文编号 H2 的明确 alias，不能因标题相似猜 alias。
- `scripts/check-plan.js`：`checkPlan(plan,{design,sourceSections,sourceText})`，返回 `{errors,warnings,structuralErrors,stats}`，无加载输入、输出或 process.exit 副作用。
- `scripts/check-overview.js`：`checkOverview(generated,plan,{sourceSections,sourceText})`，返回 `{errors,warnings,structuralErrors,missingBlockIds,blockResults,stats}`；CLI 仍以完整既有规则判定。
- `scripts/check-block.js`：保留 `checkBlock` / `collectElements`；增加结果字段 `structuralErrors`，只收集 Schema、shape 不匹配、固定字段修改、悬空/越界来源等结构错误。
  coverage 或文本语义失败仍在 errors，不能改写旧 verdict。
- `app/shared/generated-expression.js`：`normalizeGeneratedBlock(input)` 返回 `{block,notes}`，提取现有 flat flow node normalization；不改文本、不写回输入文件。
- `app/main/reading-bundle.js`：`readReadingBundle(manifestPath)` 异步返回 `{ok,stage,errors,warnings,bundle?}`；bundle 是经过读取和校验的 session 输入。
- `app/shared/reading-bundle-validation.js`：`validateBundleData(input)` 返回 `{errors,warnings,reports}`；input 为 `{manifest,designReview,plan,generated?,frameworkMap?,sourceText,sourceSections}`。
- `scripts/export-reading-bundle.js`：`exportReadingBundle({source,design,plan,generated?,map?,out,analysisId})` 异步返回 `{manifestPath}`；所有输入路径显式，out 为新分析目录。
- `app/shared/reading-projection.js`：保留旧 `projectL2Overview` 与 F13 API；新增 `projectReadingBundle(input)` 返回 `{l2ViewModel,l1Topics}`。
  l2ViewModel 的 sections/blocks 沿用 renderer 已有结构；新增每块的 `generatedExpression`、`generationIntegrity`、`realizedCoverage`、`provenanceAssurance` 与 `fragmentEntries`。
- `app/shared/l3-inspector-projection.js`：`projectL3({blockId,fragmentPath?},input)` 返回 `L3InspectionViewModel`。
  稳定主体为 blockId；输出分别包含 `traceability`、`reviewContext`、`generationContext`、`claimVerification`，fragmentPath 仅限本次 render context。
- `app/shared/l1-topic-projection.js`：`projectTopic(map,topicId,{plan}={})`，旧二参数行为兼容；已知 blockIds 才生成按 stageRank 排列的 `blockEntries`。
- `app/main/reading-session.js`：`prepareReadingSession(manifestPath)` 返回 Promise<{ok,errors,warnings,session?}>；session 含已验证 inputs、projection、人工审核 skeleton 和当前包保存路径。
  `createReadingSessionController({prepare=prepareReadingSession}={})` 返回 `{prepare,commit,discard,current}`。
  controller.prepare(path) 返回 Promise<{ok,requestToken,errors,warnings,loadResult?}>，只保存待提交 session；commit(requestToken) 返回 `{ok,reason?,loadResult?}`，仅最新请求可切换；discard(requestToken) 丢弃对应待提交输入；current() 读取已提交 session，初始为 null。
  loadResult 是给 renderer 的数据与投影，含 sessionToken/bundleInfo/l0ViewModel/l1Topics/l2ViewModel/model/humanReview；不暴露 controller 或文件句柄。
- `app/renderer/l3-inspector.js`：纯 DOM 展示 `mountL3Inspector(host,viewModel,{onSource,onFragment,onClose})`；不读取 model、fs 或重新算关系。
- `scripts/helpers/reading-bundle-fixture.js`：测试 helper `makeBundleFixture(tempRoot,mutate?)`；显式读取现有 gold、Stage 2、Fixture A Map 和源文构造隔离副本，返回 inputs/models/manifestPath。

## Task 1: Reusable Source and Validation Context

**Files:** Create `app/shared/source-coordinates.js`、`app/shared/generated-expression.js`、`scripts/test-source-coordinates.js`、`docs/specs/reading-bundle-contract.md`、`docs/harness/incidents/2026-10-03-f18-runtime-input.md`。
Modify `scripts/{check-map,check-plan,check-block,check-overview,extract-source-sections}.js`；F18 feature/verification、ARCHITECTURE、DESIGN、progress。

**Consumes:** 现有 parser、Schema、validator 的规则与 CLI 输出；已批准设计。
**Produces:** 上述 source/validator API；F18 扩展 scope 与明确验收命令。所有后续文件提前登记在合同。

- [ ] **Step 1: 更新 F18 合同及 runtime-input incident。** 将 F18 置为唯一 active；登记全计划 scope、两条核查路径与对应测试命令。将新清单规范登记为单一 authority；主契约只预留实际证据更新位置。
- [ ] **Step 2: 写 source 与可复用 validator 的失败测试。** 用原生 assert 注册下列独立用例：
  - `fence-headings-ignored`：三个/四个反引号与波浪围栏里的 # 不进入 heading tree。
  - `heading-range-and-alias`：无编号 Goal / 4.1 标题与旧 §N alias 的坐标空间分开；不搜索 statement 造 exactLine。
  - `ambiguous-heading-not-first-match`：相同 heading key 报告不可唯一解析，不能选第一条。
  - `validator-import-no-exit`：require check-plan / check-overview 不加载默认输入、不输出或退出；显式 context 改变原文与 Review 全集。
  - `structural-errors-separated`：修改固定字段/越界 leaf 属结构错误；missing generated block 和 generation FAIL 不伪装成 Schema 错误。
  最小断言（assert 为 node:assert/strict；其余用例用本步骤列出的独立输入）：
  ```js
  const registry = buildSourceRegistry('# Goal\ntext\n```md\n## fake\n```\n', {sourcePath: 'source.md'});
  assert.equal(registry.registryVersion, 1);
  assert.equal(registry.headings.length, 1);
  assert.equal(resolveSourceCoordinate(registry, {namespace: 'heading', key: 'Goal'}).state, 'known');
  ```
- [ ] **Step 3: 执行新增测试，确认因上述 API 尚不存在而失败。** Run `node scripts/test-source-coordinates.js`。
- [ ] **Step 4: 实现 source API 并把 check-map / legacy extract-source-sections 接到同一语法感知 parser。** 默认旧 source 输出须逐字段保持等价；新的 registry 才带 headings/hash/version。
- [ ] **Step 5: 抽取 validator 的显式 context 入口。** 保留旧命令默认路径和报告文本；check-plan 增加 `--design` / `--source-sections` / `--source`，check-overview 增加后二者。不得用 verdict 文本解析分类结构错误。
  两个 CLI 共用 normalizeGeneratedBlock；对现有 Schema 中 validator 尚不支持的 oneOf 分支，显式校验当前 content.type 对应结构并添加拒绝坏内容的用例，不声称未执行的 Schema 分支已通过，不开展通用 Schema 引擎重写。
- [ ] **Step 6: 执行 source、plan/block/map 既有测试。** Run `node scripts/test-source-coordinates.js`、`npm run test:plan`、`npm run test:block`、`npm run test:map`；全部通过且旧 gold verdict 不变。
- [ ] **Step 7: 提交本任务文件。** Message `refactor: share explicit Reading validation contexts`。

## Task 2: Portable Bundle Export and Read

**Files:** Create `schema/reading-bundle.schema.json`、`app/main/reading-bundle.js`、`app/shared/reading-bundle-validation.js`、`scripts/export-reading-bundle.js`、`scripts/helpers/reading-bundle-fixture.js`、`scripts/test-reading-bundle.js`。
Modify `scripts/assemble-overview.js`、`package.json`、`.gitignore`、bundle contract。

**Consumes:** Task 1 source/validator API；现有 Schema validator 与 review-model semanticCheck。
**Produces:** 离线完整 bundle；readReadingBundle / validateBundleData API。

- [ ] **Step 1: 写 bundle 正常和负向测试。** 用 makeBundleFixture 的临时副本分别证明：
  - 打开一份清单，读齐 21 Plan Block / 87 SU；复制到含中文与空格的新目录后仍加载。
  - Map document.id 与 Review design.id 不同但各自匹配 bindings 时通过；仅相同标题不建立关联。
  - 必填文件缺失、JSON 坏、未知版本、坏 SHA、Plan fingerprint 错、重复/悬空 ID 失败。
  - generated / map 未提供时保留合法能力缺失；已声明文件却不存在不是 []。
  - 绝对路径、URL、../ 与实际跳出根目录的链接失败；Windows 无创建链接权限时需测试 realpath containment helper，不能把未执行的 junction 测试记为通过。
  - require exporter 无写文件副作用；导出输入 hash 前后不变；同名 out 已存在时拒绝覆盖。
  fixture 的 inputs 是显式导出路径，models 使用 validateBundleData 的字段名；helper 调用 exporter 生成 manifestPath。最小断言：
  ```js
  const fixture = await makeBundleFixture(tempRoot);
  const result = await readReadingBundle(fixture.manifestPath);
  assert.equal(result.ok, true);
  assert.equal(result.bundle.plan.blocks.length, 21);
  assert.equal(result.bundle.plan.sourceUnits.length, 87);
  const bad = structuredClone(fixture.models);
  bad.manifest.bundleVersion = 99;
  assert.ok(validateBundleData(bad).errors.length > 0);
  ```
- [ ] **Step 2: Run `node scripts/test-reading-bundle.js` 确认尚缺实现而失败。**
- [ ] **Step 3: 实现清单和纯 validation。** Schema 使用现有 validator 确实支持的 keyword；版本1固定字段为 analysisId/bindings/files。
  每个不可变 file 条目为 `{path,sha256}`；required source/designReview/plan/sourceSections，optional generated/frameworkMap。
  清单必须含 bundleVersion:1；定位以 realpath 后的分析目录为根；不读取内部 producer path。compare namespace-local binding 和生成 Plan hash，不能把 Map ID 与 Review ID 合并。
- [ ] **Step 4: 实现 readReadingBundle 与 exporter。** 原始 Plan/Generated/Review/Map 字节原样复制；从实际 source snapshot 派生 registry；在同父临时目录校验与 read-back 后 rename 到未存在的 out。
  清理临时目录前检查绝对路径在本任务 staging parent 内；不清理旧 out，不导出 API credentials 或 human-review。
- [ ] **Step 5: 给 assembler 增加显式 bundle 选项。** `--bundle-out <dir> --source <md> --map <json> --analysis-id <id>` 复用 exporter；design/plan/generated 使用已有装配参数和 out。
  不提供 bundle-out 时保持旧行为。独立 CLI 使用 `npm run export:bundle -- --source ... --design ... --plan ... --generated ... --map ... --out ... --analysis-id ...`。
- [ ] **Step 6: Run bundle suite 与 `npm run check-overview`。** 前者通过；后者仍保留旧管线判据。新增套件接入 test:all，新增 `/bundles/` ignore。
- [ ] **Step 7: 提交本任务文件。** Message `feat: export and validate portable Reading bundles`。

## Task 3: Plan-based L2 and L3 Projection

**Files:** Modify `app/shared/{reading-projection,l1-topic-projection,l3-inspector-projection}.js`、`scripts/{test-reading-runtime,test-l1-topic-projection,test-l3-inspector-projection}.js`。
Create `scripts/test-reading-bundle-projection.js`；更新 package.json 套件列表与 bundle contract 的 ViewModel 字段。

**Consumes:** Task 2 validated bundle；Task 1 normalization / collectElements / source coordinate APIs。
**Produces:** projectReadingBundle、扩展 projectTopic、projectL3 API；三种投影均不做文件 I/O。

- [ ] **Step 1: 写真实 gold 与最小 counterexample 的 projection 失败测试。**
  - `plan-subject-survives-missing`：Generated 删除 O-01 后仍有 `O-01`，state=missing，coverage=unavailable；完全没提供 generated 则 unknown。
  - `stage-partial-order`：打乱 Plan 与 Generated 数组，仍 what/how/prove/boundary；同 stage 排列只作 layout，不渲染 Next/1/2 阅读承诺。
  - `plan-authority-not-generated`：title/stage/shape/covers 等来自 Plan，禁止让 Generated 的同名字段覆盖。
  - `l1-boundary-before-organization`：没有 blockIds / [] 时都保留成员与 crossing，各输出 unknown / empty；known 时才有 blockEntries。
  - `two-inspection-paths`：traceability 到 SU statement 与 section range；reviewContext 到父对象 Evidence，结构上没有 review→SU verification 边。
  - `epistemic-states-not-upgraded`：evidence [] 保持 empty；generation FAIL、approved、source-verified 不改变 claimVerification={space:CapabilityAvailability,state:absent}；provenance 默认 indeterminate。
  - `fragment-parent-preserved`：collectElements 返回的 path 只用于当前 fragment selection，subject 仍为 O-xx；没有 fragment ID / durable anchor / exactLine。
  最小断言（models 来自 makeBundleFixture）：
  ```js
  const input = {...models, generated: undefined};
  const vm = projectReadingBundle(input);
  const blocks = vm.l2ViewModel.sections.flatMap(section => section.blocks);
  assert.equal(blocks.length, 21);
  assert.equal(blocks.find(block => block.id === 'O-01').generatedExpression.state, 'unknown');
  assert.deepEqual(projectL3({blockId: 'O-01'}, input).claimVerification,
    {space: 'CapabilityAvailability', state: 'absent'});
  ```
- [ ] **Step 2: Run `node scripts/test-reading-bundle-projection.js`，确认缺少新 API 而失败。**
- [ ] **Step 3: 实现 L2 与 L1 扩展。** 新 L2 返回 renderer-compatible sections；明确 generatedExpression 标签 unknown/missing/present。
  realizedCoverage 是 unavailable/not-applicable/available 独立 tagged capability，集合由既有 collectElements 规则计算；不落盘比例。
  sources 源于 Plan；Known links 含 relation=related-to；旧 projectL2Overview 与二参数 projectTopic 保持测试兼容。
- [ ] **Step 4: 实现 L3 projection。** 解析 sourceUnits 与各 review bucket；缺少 carrier 不补 null，required evidence 缺席交由结构校验拒绝。
  未分类字段保持 ProvenanceAssurance=indeterminate；可用 section 仅含范围坐标。收集 fragments 使用共享 walker，不建另一套 coverage 规则。
- [ ] **Step 5: Run 新 suite 与 F13/F14/F15/F16/F17/F18 suites。** 执行 `test-reading-projection`、`test-reading-adversarial`、`test-reading-integration`、`test-reading-runtime`、`test-l1-topic-projection`、`test-l3-inspector-projection` 各 Node 脚本；全部通过。
- [ ] **Step 6: 提交本任务文件。** Message `feat: project Plan-based Reading and L3 inspection`。

## Task 4: Transactional Session and Map-first Entry

**Files:** Modify `app/main/main.js`、`app/main/preload.js`、`app/renderer/app.js`、`app/renderer/index.html`、`scripts/test-reading-runtime.js`。
Create `app/main/reading-session.js`、`scripts/test-reading-session.js`；modify DESIGN / ARCHITECTURE。

**Consumes:** readReadingBundle、projectReadingBundle、projectTopic、buildL0ViewModel、semantics 的审核 skeleton/Gate。
**Produces:** `bundle:open` / `bundle:loadPath` 准备 IPC、`bundle:commit` / `bundle:discard` IPC；preload `bundle.open()` / `bundle.loadPath(path)` / `bundle.commit({requestToken})` / `bundle.discard({requestToken})`。
准备结果含 requestToken 和候选 loadResult；只有 commit 成功才应用新 loadResult，含 sessionToken、bundleInfo、L0/L1/L2 projection 和当前包 humanReviewPath。

- [ ] **Step 1: 写 session 测试。** prepareReadingSession / controller.prepare 只准备；controller.commit(requestToken) 才更新 state。
  包 A/B 的 SU 标签相同但 source text 和 review 状态不同，切换后只见 B；加载失败或取消保留 A 及 dirty 审核；A 慢 B 快时过期 requestToken 不提交。
  human-review 读取仅限当前包路径；存在 designId 与当前 Review 不一致则拒绝；不写任何人工文件。
  最小断言（bundleA / bundleB 为临时目录中两份不同来源的合法包）：
  ```js
  const controller = createReadingSessionController();
  const a = await controller.prepare(bundleA.manifestPath);
  assert.equal(controller.current(), null);
  assert.equal(controller.commit(a.requestToken).ok, true);
  const tokenA = controller.current().sessionToken;
  const b = await controller.prepare(bundleB.manifestPath);
  controller.discard(b.requestToken);
  assert.equal(controller.current().sessionToken, tokenA);
  assert.equal(controller.commit(b.requestToken).ok, false);
  ```
- [ ] **Step 2: Run `node scripts/test-reading-session.js`，确认缺少 session API 而失败。**
- [ ] **Step 3: 实现 preparation / commit 与 IPC。** 使用递增 requestToken，bundle sessionToken 唯一；load失败不调用commit。
  renderer 先完成 dirty 审核的取舍，再请求 commit；放弃切换则 discard。新请求使旧 prepare/commit 无效，主进程与 renderer 不得在用户放弃切换后分属不同的包。
  读取当前包 human-review 后复用 skeleton 合并。正常保存复用既有人工点击路径，默认目标为当前包 human-review.json；旧 legacy 路径仍按原规则。
- [ ] **Step 4: 接入首屏“打开分析资料包”和 applyLoadResult。** 成功包有 Map 时 state.view=l0；无 Map 显式说明缺失并提供用户可选的独立 Block 视图。
  重置旧 source cache、Map、Topic、L3 和 selection；取消/失败不清空。成功切换且已有 dirty 审核时先让用户选择保留当前阅读或放弃未保存改动，不能自动保存。
- [ ] **Step 5: 接入 L1 明确的 Block 入口。** 边界展示不依赖 blockIds；Unknown 和 empty 提示不同；known blockEntries 点击到已有 #block-id 并记录局部 origin。保留文档身份，不增加 Topic canonical resolver。
- [ ] **Step 6: Run session suite 与 Electron selftest。** 新 selftest 通过真实 bundle.loadPath；证明默认框架图、主题边界、明确 Block 入口、坏包保留当前 state，以及没有自动生成 human-review。
- [ ] **Step 7: 提交本任务文件。** Message `feat: open Reading bundles as isolated Map-first sessions`。

## Task 5: Source and L3 Inspection Interaction

**Files:** Create `app/renderer/l3-inspector.js`；modify `app/renderer/{app.js,index.html,styles.css}`、`app/main/{main,preload}.js`、`app/main/reading-session.js`、DESIGN。
Tests: main.js Electron selftest 中的真实下钻断言；`scripts/test-l3-inspector-projection.js`。

**Consumes:** projectL3 和各块 fragmentEntries；sessionToken；Task 1 source coordinate；当前审核对象。
**Produces:** preload `bundle.inspect({sessionToken,blockId,fragmentPath?})` 返回 `{ok,sessionToken,viewModel?,errors?}`；`bundle.source({sessionToken,namespace,key})` 返回 `{ok,sessionToken,coordinate,integrity}`。
对应 IPC 为 bundle:inspect / bundle:source；coordinate 遵守 Task 1 known/unknown/unavailable 输出，integrity 为 consistent/drifted/unavailable。可从 Block 或本次渲染 fragment 打开的 inspection 面板；按当前包 namespace 解析的 Source。

- [ ] **Step 1: 在 Electron selftest 增加当前失败的路径测试。** 打开包→Map→Topic→Block→查出处→SU→section；另展开 review object Evidence；片段只保持父 O-xx。
  关闭后 scrollTop、blockExpanded、origin view/topicId 恢复；包切换后旧 inspection 回复被忽略。keyboard Enter/Space 与 Close/Back 均覆盖。
  IPC 输出在真实 preload 调用中断言（token 为成功提交后的 sessionToken；原文逐字匹配 fixture 的 section，不搜 statement）：
  ```js
  const reply = await window.designReview.bundle.inspect({sessionToken: token, blockId: 'O-01'});
  assert.equal(reply.ok, true);
  assert.equal(reply.sessionToken, token);
  assert.equal(reply.viewModel.blockId, 'O-01');
  assert.deepEqual(reply.viewModel.claimVerification, {space: 'CapabilityAvailability', state: 'absent'});
  ```
  preload 在现有 designReview 对象下增加 bundle 分组；该断言不能代替本步骤的 DOM 点击、键盘和返回操作。
- [ ] **Step 2: Run `npm run selftest`，确认新 UI / IPC 断言失败。**
- [ ] **Step 3: 实现 inspect / source IPC。** 拒绝与当前 state 不匹配的 sessionToken，拒绝未知 block/fragmentPath；source/registry 指纹或 range/text 漂移时返回坐标 unavailable 与明确 integrity 提示，保留 parent subject。
  legacy source:load 维持旧入口；bundle Source 走当前 session，不读取全仓库固定 registry。读取与检查放在 main，UI 不决定解析关系。
- [ ] **Step 4: 实现纯 DOM L3 面板与入口。** 分开呈现 traceability / reviewContext / generationContext，Evidence 只在父对象内展开。
  fragmentEntries 的 path 作为临时数据属性连接已渲染片段与 inspect 请求；不产生 #fragment 路由或保存字段。
  使用 textContent/已有 escaping 展示内容，不把原文或 review 字符串注入 innerHTML。
- [ ] **Step 5: 实现 origin 恢复与状态 disclosure。** 保存本次 view/topic/block/scroll/expanded，关闭恢复该快照；不调用 canonical resolver。
  原文来源只说明 section range；生成 warning 与 Evidence 级别分开显示；Unknown/Missing/empty/indeterminate/absent 有不同结构状态。
- [ ] **Step 6: Run `npm run selftest` 与 L3 suite。** 完整路径通过；approved、generation PASS/FAIL 或 Evidence type 没有产生 claim-level verified 字段或汇总 badge。
- [ ] **Step 7: 提交本任务文件。** Message `feat: inspect Block and fragment provenance with source context`。

## Task 6: Shared Preview, Documentation and Acceptance

**Files:** Modify `scripts/{build-preview,test-l0-preview}.js`、`package.json`、README、agent.md 路由、docs/README、INITIALIZATION_CONTRACT、Reading §6、F18 feature/verification/progress/index/artifacts；新增 `bundles/README.md`。
Create `scripts/test-reading-bundle-preview.js`。必要时调整 `.gitignore` 为只跟踪 bundles/README；真实用户包继续忽略。

**Consumes:** 前五项的已验证 bundle、projection、renderer 和 IPC response shapes。
**Produces:** 共用的 Preview 注入、用户示例包、集中入口说明、独立审查与范围真实的 F18 完成证据。

- [ ] **Step 1: 写 Preview 的失败测试。** `build-preview --bundle <manifest> --out <html>` 注入同一 load result；默认 Map，inspect/Source 在宿主 shim 内消费同份 snapshot，保存审核不可用。
  legacy --overview 仍可生成，并通过 projectReadingBundle 或明确的 legacy adapter 交给同一 renderer；脚本目录相对链接在移动输出位置后正确。
  在既有 Electron --verify-preview 路径添加结构断言：新包首屏 view=l0，DOM 点查出处后 inspector 的 blockId=O-01；Source 与包内快照逐字一致，claimVerification.state=absent；移动输出 HTML 后重复相同操作。预览行为需在真实页面执行，不能仅搜索生成 HTML 的字符串。
- [ ] **Step 2: Run `node scripts/test-reading-bundle-preview.js`，确认新 bundle 参数未实现而失败。**
- [ ] **Step 3: 实现 Preview 宿主适配。** 嵌入已验证数据与 L3 projection 的同一实现结果，复用 l3-inspector.js；不复制 relation/source/verification 逻辑。
  若引用内容无 Known namespace，则展示不可解析状态，不能因预览环境没有文件系统就兜底成成功。
- [ ] **Step 4: 导出实际示例并整理文档。** 从现有 gold + stage2-full + Fixture A Map 明确导出 bundles/context-consumption/<analysis-id>/，原始资料不变。
  bundles/README 只说明目录与打开方式；字段规则只在 bundle contract；ARCHITECTURE/初始化/根 README 路由到唯一正文。
  当前 Source registry 路径区分 legacy 固定路径与包内实例；历史 Path mapping 和实验记录保留。
- [ ] **Step 5: 跑约定回归。** 新六类 suites 全部加入 test:all；执行 `npm run test:all`、`npm run selftest`、`npm run check-overview`、`npm run check:docs`、`npm run check:experiments`、`npm run verify:harness`、相关 node --check。
  收集输出在 F18 artifacts；不用实验 AI 命令，不把 metadata 全绿当作产品路径证明。
- [ ] **Step 6: 独立审查并修复有证据的发现。** native 执行时用一个独立 reviewer 检查整轮 diff、namespace/降级/跨包路径、导出不覆盖与证据完整性；审查结果记录 subagent-review.md。
  reviewer 使用可用的受信默认代理，不把私有项目发送给外部 DeepSeek；审查失败要报告并处理，不能伪造记录。
- [ ] **Step 7: 完成验收记录与状态。** 只有新路径、必要人工或真实集成证据、独立审查和 harness 门禁均满足才同步 F18 passing。
  F19 的前置完成不等于 F19 已实现；F15/F20/F21 状态不提前改为 passing。更新 §6 对应 cell，注明实际保护边界。
- [ ] **Step 8: 提交本任务文件。** Message `test: verify Reading bundle inspection and document its layout`。

## Self-review

- [x] Spec User Flow / directory / pairing / projection / degradation / source parser / preview / acceptance 均有对应任务。
- [x] 新文件与职责、调用方参数、结果字段、测试命令和成功条件已明确。
- [x] 旧 CLI / projector / 独立 L0 与人工保存路径有回归保护；不把当前历史证据改写成新验收。
- [x] 五条 Review Focus 已落到各自任务测试；不复用未知或不同命名空间的引用。
- [x] 计划没有实现完整函数体或另外增加一个文档体系；本目录 drafts 表示尚未审阅的计划。
- [ ] 用户完成计划审阅并选择执行方法。

## Execution Handoff

推荐 Native：这些任务紧密依赖共享输入和投影接口，由当前会话顺序实现，再独立审查整轮 diff。
也可选择 Subagent-driven，由分别负责实现和审查的代理逐任务推进。
本机已搜索 skill 目录、plugin cache 和常见共享 skill 目录，尚未发现 header 指定的两个 superpowers 执行技能。
如果采用 Native，可由用户明确选择“按本项目现有 harness 在当前会话直接实现”作为替代执行方式；
否则需要先补齐所选执行技能。不会静默声称已使用不存在的技能。
