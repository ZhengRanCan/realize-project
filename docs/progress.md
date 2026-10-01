# Current Dashboard

## Status

- Date: 2026-09-29.
- Active feature: **F16 L2 Block Runtime** —— 正在补全最小 runtime 输入协议并迁移 L2。
- Next queued feature: **none** —— F17 受 F16 runtime 阻塞；后续产品 feature 依序暂停。2026-09-29 新登记 F11–F15，
  阶段从「架构规范形成」切到「现有实现向规范收敛」（路线见下方「下一阶段路线」）。
- Latest completed feature: `F09` Contract Adversarial Test（2026-09-26，Gate = PASS）。
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
| F15 | Projection Integration Invariants | `blocked` | Explore/Back 产品入口尚不存在；其余已执行边界见 F15 evidence |
| F16 | L2 Block Runtime（第一个产品采纳） | `active` | 补全 runtime 输入协议并迁移 L2 |
| F17 | L1 Topic Runtime | `blocked` | F16 L2 runtime 输入协议未定义，Process preconditions 未满足 |
| F18 | L3 Inspector | `not_started` | 契约待补（F11–F17 完成后细化） |
| F19 | Reading Navigation and Resolver | `not_started` | 契约待补（F11–F18 完成后细化） |
| F20 | Explore v1 | `not_started` | 契约待补（F11–F19 完成后细化） |
| F21 | Product Maturity（UX / 性能 / 可访问性） | `not_started` | 契约待补（F16–F20 完成后细化） |

### 阶段划分（2026-09-29 登记）

```text
Phase A  Contract Execution         代码能否忠实表达契约？        F11 → F12 → F13 → F14 → F15
Phase B  Reading Runtime            用户能否真正使用 L0–L3？      F16 → F17 → F18
Phase C  Cross-Projection Nav       Reading / Explore 共享 identity？ F19 → F20
Phase D  Product Maturity           是否好用、快、清晰、可维护？  F21
```

**当前在 Phase A 前半。** B1 / B2 完成后不要继续加抽象测试，
而要开始把已被测试保护的 projection 接进真实产品 —— 因为文档层已经走在产品运行时前面：
`app/main/main.js` 今天并不消费 `overview.generated.json`。

### Reading v1 的完成判据（不是 B2 全绿）

```text
L0 可用 · L1 可用 · L2 consume Plan + Generated · L3 可核查
Back / Resolve 正确 · identity preserved
Unknown / Missing / Absent 不 collapse
Renderer 不重新推断 semantic relation
高风险 invariants 有机器保护
```

到这里，Reading View Cognitive Contract v1 才算**从文档变成产品**。

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
Harness gate: 20 features, 0 errors.        # 2026-09-29，加入 F11–F21 之后

$ npm run check:docs
Doc links: 107 markdown files checked, 0 broken.

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
