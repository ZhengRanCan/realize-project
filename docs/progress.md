# Current Dashboard

## Status

- Date: 2026-10-06.
- Active feature: F24 L2 独立解释页（active，设计阶段）；用户接受 L1 修正版，F23 v0.2 / F17 已 passing。
- Next step: 确认 F24 单 Block 页面短设计，随后实施及真实组合路径回归。
- Latest completed feature: `F23 v0.2` / `F17`（2026-10-06）；用户对 L1 修正版反馈“看着也算还行”并要求继续 L2，结合既有回归和独立审查收口。没有记录额外口头复述或第二篇文章理解测试。
- Git strategy: 已有 F19–F22 工作在 `codex/f11-f21-conformance`；当前整体阅读体验未验收，暂不合并 main。F23/F24 登记为本次返工；F23 技术实现、设计和证据作为本地检查点提交，本轮未推送；F24 开始设计，未推送、不提前合并 main。
- 2026-09-29 文档层收口：Reading Contract v1 落盘并拆为 umbrella / layer contracts / evidence appendix；
  `framework-map-contract.md` 与历史证据分离；4 个 commit 已推送
  （`50826a8` → `88aeed9` → `eea7662` → `007abff`）。
  收口审计结论：authority 图无环、无第二份 normative 正文、规范与历史未混。

## Feature 状态一览

| id | feature | status | 卡在哪 |
| --- | --- | --- | --- |
| F01 | Human Review Repair | `passing` | — |
| F03 | Hierarchical Architecture | `passing` | — |
| F04 | L0 Framework Map | `blocked` | Track A 人工阅读测试未执行 |
| F05 | L0 Generalization Gate | `blocked` | 用户未在验收清单上记录判定（Gate = PASS） |
| F06 | Contract and Validators | `blocked` | 用户未记录验收；规则口径需确认 |
| F07 | AI Framework Map Generation | `blocked` | Gate = PARTIAL PASS（Semantic 0/15）+ 未验收 |
| F08 | L0 UI | `blocked` | 用户对当前 UI（Reading View 表现层）不满意，先做一轮 UI 迭代；Track A 与 Gate 延后（技术层 34/42/130 + selftest 13 条仍全绿） |
| F09 | Contract Adversarial Test | `passing` | — |
| F10 | Semantic Grounding | `blocked` | E3 未关闭（Gate = PARTIAL PASS）；处置未登记 |
| F11 | Current Implementation Conformance Audit | `passing` | 报告已交付，用户验收已记录 |
| F12 | S1 Epistemic Collapse Regression | `passing` | Unknown / Known(0) 已在投影、Topic DOM 和真实入口保留差异 |
| F13 | Minimal Semantic Projection Boundary (B1) | `passing` | 纯边界与八项结构断言已通过 |
| F14 | Adversarial Semantic Tests (B2) | `passing` | 六组隔离对抗断言通过 |
| F15 | Projection Integration Invariants | `passing` | F19–F21后补真实模块/DOM、Back与Known(0)落点证据，独立审查通过 |
| F16 | L2 Block Runtime（第一个产品采纳） | `passing` | 仅数据投影接入完成；独立单 Block 展示由 F24 补齐 |
| F17 | L1 Topic Runtime | `passing` | F23 v0.2 解释修正与回归通过；用户接受修正版 |
| F18 | L3 Inspector | `passing` | 资料包 → Map → Topic → Block → 独立的原文与审阅材料核查路径通过 |
| F19 | Reading Navigation and Resolver | `passing` | 统一导航/定位、真实逐层返回、便携Preview与独立审查通过；Explore组合路径由F20验证 |
| F20 | Explore v1 | `passing` | 四层切入、实体关系Focus、共享Back/Resolve、portablePreview和独立审查通过 |
| F21 | Product Maturity（UX / 性能 / 可访问性） | `passing` | 原生键盘、640×720窗口、Gold/压力预算、15轮回归与独立审查通过 |
| F22 | Entry and Repository Layout | `passing` | 首页折叠、用途分区、样本归拢、完整性和独立审查通过 |
| F23 | L1 Topic Boundary View v0.2 | `passing` | 解释修正、技术回归、独立复查及用户本轮验收完成 |
| F24 | L2 Independent Block Reading View | `active` | 单 Block 独立解释页设计中，现有表达与导航复用；尚未实施 |
| F25 | L0 Document Orientation and Explanation | `passing` | 用户本轮试读只提出连接解释位置问题；按确认方案修复并收口 |

### 阶段划分（2026-09-29 登记）

```text
Phase A  Contract Execution         代码能否忠实表达契约？        F11 → F12 → F13 → F14 → F15
Phase B  Reading Runtime            用户能否真正使用 L0–L3？      F16 → F17 → F18
Phase C  Cross-Projection Nav       Reading / Explore 共享 identity？ F19 → F20
Phase D  Product Maturity           是否好用、快、清晰、可维护？  F21
```

**Phase B 的 F18 路径已接入。** 资料包明确消费 Plan + Generated，首屏为框架图；
L3 保持两条独立核查路径，缺失与漂移明确降级。F19/F20 已补齐共享 Back / Resolve 与 Explore；F21 的键盘、窄窗口和性能验收通过。

### 当前返工（2026-10-03）

- F25 → F23 v0.2 → F24：先补 L0 整篇导读与对象/关系解释；L1 继续修主题含义和无关系摘要；L2 独立 Block 视图后置。
- 三项分别验收，均需真实 Electron/Preview、键盘/窄窗口、既有导航回归和用户实际阅读判断；登记轮不修改原文或运行模型。
- F17 复核关闭由 F23 的实际验收触发；F16 保留数据接入结论。F19 仅将 F17 已验证投影/入口记为技术基线，视觉返工不作为导航依赖，gate 本身不改。
- 反馈：[L1/L2 展示缺口](harness/incidents/2026-10-03-l1-l2-reading-gap.md)。新任务登记通过文档校验不代表实现完成。

### Reading v1 的完成判据（不是 B2 全绿）

```text
L0 可用 · L1 可用 · L2 consume Plan + Generated · L3 可核查
Back / Resolve 正确 · identity preserved
Unknown / Missing / Absent 不 collapse
Renderer 不重新推断 semantic relation
高风险 invariants 有机器保护
```

以上是完成条件，不是当前完成结论。**用户试用确认 L1/L2 展示仍有缺口，整体分层阅读体验尚未完成验收。** F23/F24 分别补齐边界图和独立解释页，自动化通过不能代替实际可理解性判断。

## 下一阶段路线（2026-09-29 登记）

从「架构规范形成」切到「**现有实现向规范收敛**」：规范已经成为 conformity criterion，
代码是被检查对象，不再是从代码反推设计意图。**不是重写，也不是"再跑一遍旧测试"**。

```text
F11  Conformance Audit          只读：现有实现 vs 契约，分类为
                                Compliant / Violation / Partially Compliant /
                                Not Implemented / Capability Absent /
                                No Executable Boundary / Needs Inspection
        ↓
F12  S1 Regression              第一个现实违反（l0-view-model.js:109 的 || []）：
                                先写会失败的测试 → 最小修改 → 既有 34/42/130/selftest 全绿
        ↓
F13  B1 最小投影边界             让「无边界」的规则第一次成为可结构化断言的对象
                                （四类状态空间 + 名义隔离 + identity/authority 保持）
        ↓
F14  B2 反诱惑测试              S1 长期 suite + S3 / S4 / N6 / N7 / N8，
                                每个 fixture 只增强一个诱惑来源
        ↓
F15  集成不变量                 renderer 纪律 / Decision B 导航 / Decision F coverage /
                                L1 Topic 边界 / source-coordinate（N11）
        ↓
     更新契约 §6 Machine Enforcement Status 的对应 cell（随各 feature 完成，不整行搬迁）
```

三条纪律（写进各 feature 合同）：

1. **不因为规范写好了就重写软件**：已实测正确的机制（assembler 注入 + `FIXED`、
   悬空外键校验、`leaf ⊆ covers`、`source-sections.json` 解析器）保留，
   只有真实 divergence 才改。
2. **改之前先有会失败的测试**；`F12` 是第一个现实案例。
3. **审计有两个输出**：违规清单，以及"已正确、不要动"的清单（后者防 B1 动投影层时弄坏既有机制）。

## Latest harness gate

```text
$ npm run verify:harness
Harness gate: 23 features, 0 errors.        # 2026-10-03，登记 F23/F24、重开 F17

$ npm run check:docs
Doc links: 145 markdown files checked, 0 broken.

$ npm run check:experiments
experiments index: 66 units + 17 artifacts, up to date.
```

> 下面的「收口复跑」表是 **2026-09-27 的历史快照**（当时 9 features / 69 docs），
> 按「规范与历史分开」的纪律**不随后续改动更新**；当前值以上面为准。

## 收口复跑（2026-09-27，规范化之后）

在本机直接以 `node scripts/...` 调用的结果：

| 命令 | 结果 |
| --- | --- |
| `scripts/validate-fixture.js` | PASSED |
| `scripts/audit-overview.js` | PASSED（21 区块 / 15 节全覆盖 / 12 Decision 全关联） |
| `scripts/check-overview.js` | PASS WITH WARNINGS（Blocks 21/21 · Core 75/75 · Supporting 12/12 · Provenance 151/151 · Failures 无） |
| `scripts/check-plan.js` | PASS WITH WARNINGS（8 条 warning 均为既有结构提示） |
| `scripts/test-check-block.js` | 31/31 |
| `scripts/test-check-map.js` | 29 passed, 0 failed |
| `scripts/test-generate-framework-map.js` | 33/33（离线 stub，零模型调用） |
| `scripts/test-semantic-grounding.js` | 48/48（离线 stub，零模型调用） |
| `scripts/test-l0-view-model.js` | 34/34（28 份 map） |
| `scripts/test-l0-layout.js` | 42/42 |
| `scripts/test-l0-preview.js` | 130/130（7 份预览）—— 早期材料的 51/119/127 已按「执行断言数」口径统一 |
| `npm run selftest` | PASSED（L0 集成 13 条断言；selftest 总计 66 条 ✓） |
| `npm run verify:harness` | 9 features, 0 errors |
| `npm run check:docs` | 69 markdown files checked, 0 broken |
| `npm run check:experiments` | 66 units + 17 artifacts, up to date |

`scripts/test-check-plan.js` 在受限沙箱里无法运行（它用 `execFileSync` 捕获子进程管道输出，
每个用例都拿到空结果）；`scripts/check-plan.js` 直接调用时退出码为 0，见
`docs/harness/INITIALIZATION_CONTRACT.md` 的「受限环境」一节。

## Capability snapshot

已经完成并验证的能力（口径为 harness 接入前的阶段划分，逐条 evidence 见对应 feature 合同）：

- Markdown → Semantic Coverage Plan
- Semantic Units → Visual Blocks
- Shape contracts（受控词汇表封闭）
- Semantic coverage / provenance validation
- Deterministic Overview Renderer
- Source 回查
- 完整 Overview Preview
- L0 framework map（生成链路 + Electron 一屏两区界面，第一轮 deterministic UI integration）

当前重点是继续完善 **Visual Overview 的人工阅读体验**，随后把 L0 接回 Electron 主流程
（对应 F08 未关闭的 Phase 3/4/5）。

后续阶段再考虑：

```text
Markdown + Local Source Repository
        ↓
AI Evidence Requests
        ↓
按需读取相关源码
        ↓
Source-verified Evidence
```

**不会一次性把整个源码仓库发送给模型。**

## Shared module changes

### 2026-09-27 — L0 选中行为：只高光，不压暗；约束角标可高光

- Reason: 用户实测两条反馈 —— ①点区块时其余内容被降到 `opacity .3`，读起来就是"被隐藏了"；
  ②点约束时区块被压暗，而约束角标自己被自身底色盖住、看不出任何反应。
- Impact: 只动 `app/renderer/{l0-map.js,l0-map.css}` 与 `scripts/test-l0-preview.js`：
  删掉 `.is-dim` 压暗机制（含 CSS 规则），选中改为"只做加法"；约束角标补
  `.node-attach.is-hit > summary` / `.attach-item.is-hit` 高光；角标新增 `data-host-ids`，
  使"约束 ↔ 宿主"双向点亮（点线时两端节点连同其角标一起亮）。
  layout 算法与坐标、Contract、view model 语义、F10、validator 均未变。
- Verification: `test-l0-layout` 42/42（坐标逐字节未变）· `test-l0-preview` **130/130** ·
  `npm run selftest` PASSED（**13 条** L0 集成断言，含"命中 13 处且 dim=0"与"约束 + 2 个宿主一起点亮"）·
  `test:all` 全绿 22+31+29+33+48+34+42+130。
- Evidence: `docs/log/artifacts/F08-l0-ui/verification-summary.md` 的「第二轮 · 选中行为修正」一节。

### 2026-09-27 — 清理指向 `agent.md` 章节号的失效引用

- Reason: `agent.md` 改为"文档路由 + 协作规则"后不再有编号小节，但仓库里仍有 13 处代码/文档注释与
  2 处页面文案引用 `agent.md 第 X 节`（这些编号在改动前就已经不存在）。
- Impact: 只改注释与两处提示文案（`app/renderer/app.js`、`app/renderer/index.html`）；
  判定逻辑、schema、renderer 行为、Gate 口径均未变。涉及 F08 合同 scope 之外的文件，
  故在此登记：`app/main/{main.js,preload.js}`、`app/renderer/index.html`、`app/shared/{gate.js,schema-validator.js}`、
  `scripts/{validate-fixture.js,simulate-review.js}`、`ai/analysis-protocol.phase2.md`、`README.md`。
- Verification: `node --check` 全部通过；`validate` / `audit` / `check-overview` / `check-plan` 与 7 个离线
  测试脚本全绿；`verify:harness` 0 errors；`check:docs` 0 broken。
- Not run: `npm run selftest`（需要 Electron 图形环境，本机未跑）。
- Kept as-is: `docs/log/artifacts/mvp-phase1/acceptance-phase1.md` 仍写着 `agent.md 第二十一节` ——
  它是冻结的历史记录，按 `docs/log/artifacts/README.md` 的约定不修改。

## Risks and next steps

- **等用户验收**：F04 / F05 / F06 / F07 / F10 都已执行完但没有验收记录。这是当前最大的流程阻塞点 ——
  在它们被判定之前，`dependsOn` 无法把它们登记为强制前置（见 `docs/harness/features/README.md`）。
- **F06 的口径是共享风险**：`check-*` 的规则一旦调整，历史上成批产物会变红；改口径应与新 feature 分开成轮。
- **F07 / F10 的语义维度未成立**：技术层 15/15 通过，但语义忠实度 0/15（F07）与 E3 未关闭（F10）。
  不要把它们的技术 PASS 读成"语义已解决"。
- **F03 规格与实现的偏离**：`brief.md` 中的部分结论已被 F05 / F09 修正（例如"L0 长得像流程图不是风险"），
  读规格时要连带看它引用的 feature 证据。
- **harness 是事后接入的**：F01–F10 的合同由历史材料回填，`dependsOn` 只登记 harness 强制前置，
  流程顺序写在各自合同的 `Process preconditions` 里。
- **仓库根目录还留着 `harness-template/`**（未纳入版本控制）：接入完成后可以删除或移出仓库，避免两个 harness 并存。

## 2026-09-29 — F11 只读审计交付（未关闭）

- 报告：`docs/log/artifacts/F11-conformance-audit/results/conformance-audit.md`；覆盖 §6 全部 29 条 invariant 与六问。
- 269 个扫描站点，只有 topic.blockIds 投影折叠确证进入 S1 backlog；role 缺省已找到 Stage 2 prompt 依据。
- 五项 divergence：S1 折叠、preview 缺生成删除主体、stage 数组顺序、L0 跨文档 Source 路由、逐块 generation disclosure 丢失。
- `test:all` 的 10 个组成脚本用 Node 直接运行均 exit 0；三个 npm 命令启动失败，不能报告 npm 门禁全绿。
- 原始输出与阻塞：`docs/log/artifacts/F11-conformance-audit/verification-summary.md`。当前无 Git 元数据，未提交/推送。
- app/scripts/schema/fixtures/experiments 的 373 个既有文件哈希未变。待 reviewer 抽样和用户验收；未开始 F12。

## 2026-09-29 — 本地环境与 Git 恢复

- 当前 Node v24.21.0 / npm 11.19.0 / Electron 31.7.7；npm 标准离线测试与 selftest 均通过。此前失败属于旧安装/旧会话环境记录，不代表当前环境。
- 真实 Git 历史已接回，当前分支 codex/f11-f21-conformance 跟踪同名 origin 分支；项目级代理指向本机 Clash。603 个既有工作文件恢复前后哈希未变。
- F11 校验器规则遵从用户只读要求：运行现有文档内结构校验，不新增代码文件。人工验收仍待记录，不启动 F12。
- 详情：`docs/harness/incidents/2026-09-29-local-environment-recovery.md`；原始门禁输出见 F11 verification-summary。

## 2026-10-03 — F18 Runtime Bundle Design

- 当前分支：`codex/f11-f21-conformance`，拉取时 HEAD 为 `baa459c`。
- 用户已选定：只打开一份清单，配套资料在同一个分析目录；开发过程中显式选定输入，随后整理目录说明。
- 设计：[Reading Bundle and L3 Runtime Design](log/artifacts/F18-l3-inspector/runtime-bundle-design.md)。
  用户于 2026-10-03 认可设计与[实施计划](log/artifacts/F18-l3-inspector/drafts/implementation-plan.md)，选择 Native；实施结果见后续记录。
- F18 合同已登记 manifest Schema、离线 exporter、preload、包目录 Source binding、共享验证与 projection、
  静态 Preview、suite 接入，以及 architecture / design / 初始化 / 目录规范。
- 改动原因：现有 runtime 只将 model.overview 投影到 L2；Plan.covers / sourceUnits 未加载，
  L3 helper 与 L2 输入不匹配，Source 使用固定 registry。完整输入协议属于 F18 必需前置。
- 验证基线：`npm run test:all`、`npm run selftest`、`npm run verify:harness` 全部 exit 0；
  F16 / F17 / F18 单独脚本分别报告 8 / 9 / 4 assertions。
  这些结果只证明既有路径和 helper，不能验收尚不存在的 bundle → L3 产品路径。
- 历史 fixture、实验 run 与失败记录保留原位置；新产品资料通过独立离线导出集中放置，采用目录内相对路径。

## 2026-10-03 — F18 Implementation Complete

- 用户批准设计、计划与 Native 执行；资料包在 `bundles/<document>/<analysis>/` 汇集相关输入和用户审核。
- 共享 source parser、显式 validator 上下文、严格 bundle binding、Plan LEFT JOIN Generated、两条 L3 核查与同一 Preview renderer 已接入。
- 真实 Electron 路径、跨文档/旧请求/保存隔离与便携 Preview 通过；独立复查的问题修正后无剩余 P1/P2。
- 完整命令与证据见 [F18 Verification Summary](log/artifacts/F18-l3-inspector/verification-summary.md)。
- F19 前置已就绪，但 canonical resolver / Explore 尚未实施；不把本轮局部返回视为完整跨投影导航。

## 2026-10-03 — F22 Registration and Layout Design

- 用户批准首页旧入口折叠与用途分区的方向，要求独立新建 feature；登记 F22 为当前唯一 active，处于规划阶段。
- 合同：[F22 Entry and Repository Layout](harness/features/individual_feature/F22-entry-and-repository-layout/feature.md)。
- 书面设计：[Layout Design](log/artifacts/F22-entry-and-repository-layout/layout-design.md)，待用户审阅后细化实施计划。
- 目标分区为 docs / samples / prompts / artifacts/experiments / workspace；样本按文章归拢，本地资料保留并忽略 Git。
- 提示词核查：五份模板被现行生成脚本引用；一份未接入的 Phase 2 协议草稿归历史设计记录。
- 登记检查：check:docs 123 files / 0 broken；verify:harness 21 features / 0 errors。未改产品代码或移动目录，不代表实施完成。
- F18 保持 passing；F19–F21 本轮未启动。F22 完成后回到原定 Reading 导航路线。

## 2026-10-03 — F22 Complete

- 用户要求完成 F22，Native 实施与独立复查通过。首页资料包为主入口，旧功能默认折叠；docs / samples / prompts / artifacts/experiments / workspace 职责与文档更新。
- 10,695 项迁移清单中 10,570 项不可变材料完整，333 个受保护跟踪文件哈希一致；66 个实验单元、17 个产物及归属保留。本地私有材料继续忽略 Git。
- 完整回归、真实 Electron 新首屏与搬迁既有包路径、portable Preview、命令/文档/索引/harness 门禁通过；原有 Overview warnings 保留。
- 独立审查发现的默认/显式 CLI 路径、原子 journal、旧根审核兼容均修正，无剩余 P1/P2。用户路径是自动化实测，不声称手工验收。
- 证据：[F22 Verification Summary](log/artifacts/F22-entry-and-repository-layout/verification-summary.md)。F19–F21 未启动。

## 2026-10-03 — F19–F21 autonomous completion

- 用户同意 F19 范围修正，随后授权补齐 F19–F21 占位合同并按顺序实施/验收；不等待逐项许可，沿用 Native + 独立审查。
- F19 新增 shared 导航和 renderer 现场适配、Preview 内联与真实 Electron 测试；职责/文件范围已在合同登记。
- F19 验收 Reading 内 Back/Resolve，F20 验收真实 Explore 组合路径，不以测试入口冒充页面。
- BMad render_skill.py 在本仓库缺失，沿用现有 Harness；不新增第二套流程或依赖。

## 2026-10-03 — F19 Complete

- [F19 verification](log/artifacts/F19-navigation-resolver/verification-summary.md)：共享地址/栈/resolver已产品接入，Back保留occurrence与现场；独立审查4项P2修正后无剩余P1/P2。
- Electron/搬迁Preview/完整离线suite/既有input gates通过；F20继续复用同一导航，不新增identity/私有栈。

## F20 Shared changes

- 新增纯Explore projection与确定性renderer，消费已验证L0 VM；F19 controller复用同一栈恢复Reading。
- 原由单页私有返回逻辑承载的交互改为共用controller，四层/便携Preview/旧入口/保存隔离验证。

## 2026-10-03 — F20 Complete

- [F20 verification](log/artifacts/F20-explore-v1/verification-summary.md)：真实Explore组合路径已建立，四层原现场恢复；2项P2修正后无剩余P1/P2。
- 继续F21的有限成熟度收口；不冒称F08历史Track A手工验收已完成。

## F21 Shared changes

- renderer键盘/live/响应式最小变化和N5无方向交付修正；纯输入/validator口径不改。真实键盘、压力/性能、15轮循环与portablePreview验证。

## 2026-10-03 — F21 Complete and F15 Closure

- F21三个有限职责收口：原生键盘/输入保护/焦点/live状态，真正640×720披露，Gold与80elements/160edges预算及15轮稳定性。公开截图与JSON在F21 artifacts；普通测试不写永久日志/反复改写证据。
- 修正Reading与Topic/Explore的relates-to无方向；Topic/Explore不沿用旧区块目录，全局工具仍提供四层显式入口。
- Native独立审查的窄窗口证据P2已修正；截图尺寸断言和双RAF等待已加入，最终无P1/P2。
- F15旧占位验收收口：重复completionGate删除，4条toy测试替换为真实projection/L1/registry/L3；实际L2/L3身份集合与Absent/Indeterminate、Back不Resolve、L1无方向DOM通过。
- fixtureD无Plan不补造O-01；Known(0)Block落点由F19有效bundle验证。独立审查的身份集合漏检P2已修正，最终无P1/P2。
- F11–F21/F22全部passing；历史F04–F08/F10的人工Track A/模型质量记录仍独立。未运行任何模型/API或提交用户资料包/审核，成功txt不留存。
- 完整test:all、selftest、portablePreview、input gates、harness/docs/experiments通过；check-overview既有warnings保留。继续用户指定开发分支，不在本轮直接合并main。

## 2026-10-03 — F23 Design Started

- 用户要求开始 F23，已核对现有投影、renderer、导航现场和 Preview 接入点。强制前置 F16/F18/F19 均 passing，F23 为当前唯一 active。
- [展示设计](log/artifacts/F23-l1-topic-boundary-view/view-design.md)：内部成员图与外部端点在同一画布，区块入口在下方；公开样本 T-02 验内部连接，T-03 验 crossing，不补造演示关系。
- projection 计划只补原始显示字段；L1 模块复用 L0 纯布局和既有导航，返回现场需要增加 L1 选择与独立图滚动。产品代码未修改。
- 按 brainstorming 的书面设计审阅步骤等待用户反馈，再细化实施计划；沿用此前 Native 执行选择。BMad runtime 缺失，本轮未安装或替代其工作流。

## 2026-10-03 — F23 Design Approved / Plan Written

- 用户确认展示设计（“可以，做吧”），[实施计划](log/artifacts/F23-l1-topic-boundary-view/drafts/implementation-plan.md)已写并自查；沿用 Native，未重新选择执行方式。
- 三个任务：显示投影、图形与披露 renderer、真实产品/Preview 接入与返回现场验证。
- 计划待审阅后实施；产品代码和未来测试尚未创建，实际界面验收待实现后进行。

## F23 Shared changes and review repairs

- 用户已批准实施计划，Native 实施中。L1 图模块与真实产品/Preview 接入已完成初轮验证。
- 独立审查发现平行关系穿过卡片及 Source 按标签前缀误启用的问题，先记录再修正。
- 共享 reading-projection 仅将包内已加载 sourceSections / sourceIntegrity 传给 L1；复用现有 coordinate resolver 判断入口可用性，原文仍由已有受 session/integrity 保护的 API 读取。补充 pure projection 与真实 Source 回归，不改 schema/validator 或 L2/L3 语义。

## 2026-10-03 — F23 Technical Delivery

- 用户批准设计及 Native 实施计划；局部/边界图、外部身份、关系完整披露、真实原文能力与 occurrence 返回现场已接入 Electron / 共用 Preview。
- 完整 test:all、单独 full selftest、输入 gates、静态检查通过；新路径覆盖公共 5 Map/31 Topic/66 关系、1–6 条 parallel/self/inbound/outbound/symmetric、640×720、合法 summary、Unknown/Known(0)/无 Plan 与 Source 缺失/重复/漂移。最终 docs/harness 同步检查通过。
- 独立审查的三项 P2（卡片穿越/目标箭头方向、虚假 Source 能力、标签处线路折返）均修复；复查无剩余 P1/P2。证据：[F23 verification](log/artifacts/F23-l1-topic-boundary-view/verification-summary.md)。
- 用户尚未查看实际实现并确认可理解性；F23/F17 保持 blocked，F24 未启动。只读预览 workspace/previews/f23-reading-preview.html 供试用，正式数据与审核不改；临时测试输出已按任务清理，无新增永久 txt 日志。继续开发分支，不合并 main。

## 2026-10-04 — Actual Reading Acceptance Not Passed

- 用户实际试用后指出 L0 抽象、关联列表对理解帮助有限、Topic 缺少整篇定位，L1 信息量少且缺少概念解释。F23/F17 保持 blocked；不能将此前技术全绿视为可理解性通过。
- [反馈与诊断](harness/incidents/2026-10-04-reading-comprehension-feedback.md)：当前 Map 缺少节点解释、边缺少自然语言语境；无边 T-01 的合法摘要仅列名称，也需要解释三个层级的含义与差异。
- 图片是 L1 的 L2 入口与成员详情，尚非 L2 解释正文；按用户要求 L2 后置。本次未修改产品、样本或输入协议，先明确 L0/L1 解释设计与数据依据。

## 2026-10-04 — F25 Registration / F23 v0.2

- 用户批准“L0 新建，L1 修原 feature”并要求完成合同登记：[F25](harness/features/individual_feature/F25-l0-document-orientation/feature.md) 新建为 not_started；[F23](harness/features/individual_feature/F23-l1-topic-boundary-view/feature.md) 升至 v0.2，保持 blocked。
- F25 负责整篇导读、节点/关系含义、Topic 选择引导和共享解释资料的设计；F23 负责 L1 主题解释、对象职责、关系语境、无关系摘要的定义/对照/边界。本层基本理解不能全部推给 L2。
- 共享资料要显式来源/身份绑定；不按 Map/Plan SU 编号、标题或文件名自动配对。具体载体/兼容策略在设计阶段确认，本轮不改规范正文、产品、schema、validator 或样本。
- 推进顺序：F25 设计与实施 → F23 修订与复验 → F24。F25 不强制依赖 blocked F23，F23 不提前依赖未定协议，避免关闭循环；每次只激活一项。
- 登记结果见 [F25 verification](log/artifacts/F25-l0-document-orientation/verification-summary.md)。此前 v0.1 技术全绿只作基线，新解释功能与用户可理解性仍未通过。

## 2026-10-04 — F25 Design Started

- 用户要求完成 L0 feature；F25 激活为唯一 active，强制前置 F18/F19/F21 均 passing。
- [候选书面设计](log/artifacts/F25-l0-document-orientation/view-design.md)：图前整篇导读、节点短解释与具体关系详情、Topic 默认关注问题及独立进入动作；推荐将有来源的解释作为 Map 可选 readingGuide，资料包一并加载。
- 共享接口拟由 F25 拥有，显式绑定文档、Map 结构和原文版本，不从 Plan SU 猜定义；F23 后续复用。本轮仅写候选，不修改当前规范、schema、产品或旧样本。实施前须更新所需文件范围及规范并完成书面设计/计划审阅。
- 已确认 schema 原本支持根字段 thesis；context-consumption 示例缺席不能推断 schema 缺少该能力。原文中的两条链、非等价与非因果边界必须保留。
- 技术验证和用户读懂分开验收；F25 的 passing 不自动关闭 F23/F17 或历史 L0 feature。检查记录见 [F25 verification](log/artifacts/F25-l0-document-orientation/verification-summary.md)。

## 2026-10-04 — F25 Design Approved / Plan Written

- 用户确认推荐方案（“可以，按你说的推荐那种来”）：Map 可选 readingGuide 随图一并加载，显式绑定文档、图版本和原文快照。
- [实施计划](log/artifacts/F25-l0-document-orientation/drafts/implementation-plan.md)已写并自查：共用协议与校验、两类有依据的输入及投影、L0 展示/进入动作、真实 Electron/便携 Preview 回归、独立审查与用户理解验收。
- 已将独立 L0 预览、样式、两份新增派生 Map 和受进入动作影响的旧测试加入 scope；旧原文/Map/Gold/Plan 和历史实验不修改。
- 共用解释模块由 F25 拥有，F23 后续复用；本轮不实现 L1 新解释，也不提前将 F23/F17 标通过。来源失效逐项披露，关系按原始 edge occurrence 配对，不用端点字符串合并平行边。
- 沿用 Native 和本项目 Harness + 独立 reviewer；本机 executing-plans 子技能缺失，不冒称调用。计划待用户审阅；尚未修改规范正文、产品、schema、validator 或创建新样本。

## 2026-10-04 — F25 Implementation Started

- 用户批准实施计划（“可以，做吧”），按 Native 实施；解释资料、绑定、纯投影和 L0 renderer 共用一套规则。
- 先同步规范：Map 可选 readingGuide，显式文档/核心 Map 指纹/原文字节 hash；heading 摘录只能证明可定位，不能证明解释语义正确。来源逐项披露，旧输入有效。
- 共享接口、独立 Map/资料包加载、Topic 独立进入及关系 occurrence 会影响既有集成测试；按计划覆盖完整身份、三态、Source/session、Back 和只读 Preview。F23 的局部解释后续实施。


### F25 技术交付（2026-10-04）

- 导读、节点短解释、节点/关系/约束的完整含义与独立出处、Topic 问题与明确进入已实现。Map readingGuide 显式绑定，部分来源/坏绑定/漂移/旧会话不冒称核实；F23 后续共用同一模块。
- 两类源文解释已核对，受保护原文/旧 Map/Gold/Plan 字节不变。新增派生 Map；未运行模型生成或保存用户审核。
- test:all、selftest、L0 orientation、L1 boundary、搬迁只读 Preview 和独立审查通过；未关闭 F23/F17，不合并 main。
- 本机增强包：workspace/analyses/context-consumption/f25-reading/reading-bundle.json；完整预览：workspace/previews/f25-reading-preview.html；runbook 独立 L0：workspace/previews/l0/f25-runbook.html。详细证据见 [F25 verification](log/artifacts/F25-l0-document-orientation/verification-summary.md)。
- F25 blocked 只待实际阅读理解：用户能说明文章问题、对象/关系及下一步主题选择理由。代码正确不能代替该项；目前没有 passing 结论。

F25 收口的清理限制：旧 L0 预览测试的8个缓存文件删除被工具策略拒绝，仍在 workspace/tmp/tests/l0-preview-check；专项 UUID 目录已清理，未新增永久校验 txt。

2026-10-05：沿用已确认的 Native/Harness 执行本次 bounded 修正。共享 app.js 仅扩展既有 Reading frame 的面板标签/展开/滚动现场；没有新增输入协议或独立导航栈。真实 Electron/键盘/窄窗口、Source/Back/Explore 与搬迁 Preview 回归后重新交付；实际理解验收仍待记录。

2026-10-05 图旁阅读面板技术交付：桌面两栏、窄窗口底部可收起，连接目录不再在长图下方；节点/边选择、隐藏焦点、canonical 返回和两标签独立滚动已验证。test:all/selftest、原文兼容、静态与文档门禁通过，独立复查无未关闭 P1/P2。预览已重建，实际用户复验待记录，F23/F17状态不变。

2026-10-05 用户确认 F25 目前只有已处理的连接解释位置问题，要求完成后推进 F26。本轮以实际试读意见与唯一反馈闭环收口，未伪造口述/二次试读记录；旧缓存工具限制留作维护事项，不作为未知产品能力。F26 尚未在仓库登记，已询问具体指向；不擅自新建或重编号 F23。

2026-10-05 用户澄清后续“F26”指 L1 解释修正，继续 F23 v0.2；F25 shared GuideVM 及来源规则现已可用，新增 F25 强制前置。当前设计阶段，维持旧技术基线，不冒称修订后 L1 已通过。

F23 v0.2 短设计已获确认：仅扩展冻结 L1 展示副本的解释/原 edgeIndex，Source hash 显式来自 bundle，复用 F25 源规则；共享 Reading frame 仅增加 L1 详情展开/滚动。未改输入、原文/Map/Gold 或 shared 判定口径。
