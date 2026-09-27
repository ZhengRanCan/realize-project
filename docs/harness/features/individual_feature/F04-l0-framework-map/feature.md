---
id: F04
title: L0 Framework Map (manual map + interaction hypothesis)
version: v0.1
status: blocked
dependsOn: []
scope: {"code":["docs/log/artifacts/F04-l0-framework-map/drafts/build-l0-preview.js"],"tests":[],"docs":["docs/log/artifacts/F04-l0-framework-map/**","docs/log/artifacts/F03-hierarchical-architecture/brief.md"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"node docs/log/artifacts/F04-l0-framework-map/drafts/build-l0-preview.js","result":"passed","note":"用法注释见该脚本头部；产物 drafts/l0-preview.html 已生成并被真实加载验证（phase1-notes.md §7）"},{"command":"node <本次一次性脚本> --map docs\\features\\04-l0-framework-map\\drafts\\context-consumption.map.json --plan fixtures\\context-consumption.overview-plan.json","result":"passed","note":"paths 为规范化前记录（§6.2 / §6.5）；命令本身未留下逐字记录，实跑为一次性脚本，输出见 results/structural-reachability.txt 与 results/verification-output.txt：Hard Error 0 · Warning 1，完全无路径 = 0"},{"command":"npm run verify:harness","result":"passed"}],"manualSmoke":"人工 Track A（六项指标 M1~M6，对照 baseline experiments/stage2-full/overview-preview.html 与 candidate drafts/l0-preview.html）**未执行**；results/track-a-worksheet.md 仍为空白模板，故 legacy registry 记为 Technical Pass / UX Validation Pending"}
completionGate: {"version":"v0.1","l3":"required","userPath":["人工 Track A 的交互假设判定：分层下钻 + L0 图 + Topic 导航是否真的比「四段阅读流 + 21 个 block 长列表」更容易理解 —— 这是本 feature 唯一未关闭的用户路径"],"integrationEvidence":["drafts/l0-preview.html 被真实加载并断言 DOM：渲染文档标题 · 12 个元素卡片 · 5 个 topic 导航 · 文档级入口（scope / 非目标）· 主轴 edge 标签（depends-on, consumes, produces）· 点击元素打开 L3 详情面板（含原文 sourceUnit 语句）· 无渲染器控制台错误（results/phase1-notes.md §7）","结构可达性：87/87 条语义都有可达路径（完全无路径 = 0）；21/21 个 block 有入口（Topic 20 + 文档级 1）（results/verification-output.txt、results/structural-reachability.txt）"],"knownUnverified":["Structural Reachability Test 只能回答两件事：「有没有完全无路径的内容」与「到达一条语义需要几层」。它**不能**当作 Track A 的胜负指标 —— baseline 的 0 跳等于 21 个 block 全摊在首屏 scroll 里（约 1059px、11 个折叠），拿它比跳数等于比较「书翻页 vs 网站点击」，与认知负担无关（results/structural-reachability.md §0）","候选页的 L2 是占位：drafts/l0-preview.html 深链到现有 21 个 block（只为验证交互，不改变切法）；Feature 07 重新生成 L2 后跳数分布会变（results/structural-reachability.md §5）","结构可达性属一次性运行：仓库中不存在可达性脚本文件，只留下 results/structural-reachability.txt / .md；逐字命令行未记录，故「可复现」尚未真正验证（validation-checklist.md §5.1 该项未勾选）","validation-checklist.md 未签署：结构项与 13 条红线虽在自查中全通过，但 reviewer 未按清单逐项回签，也未对 §2.2 的 6 条主观 C 判据淘汰、§7 的最终判定栏给出明确结论"],"humanReviewRequired":["执行 M1 找到答案耗时：baseline 与 candidate 同一组 10 题各掐表一遍（track-a-worksheet.md §2 逐题记录表）","执行 M2 不打开原 Markdown 的答题正确率（本项目硬指标）：两版各记 __/10，翻过原文的题单独标记；单独报告 baseline / candidate 两个数字（track-a-worksheet.md §3）","执行 M3 首屏同时出现的信息单元数、M4 错误进入 Topic 的次数、M5 返回 / 重选次数（track-a-worksheet.md §4）","执行 M6 主观负担：迷路感与缺失感两个主观问题，两版各打 1~5 分（track-a-worksheet.md §5）","对 worksheet 给出结论并明确回一句判定：TECHNICAL PASS / UX VALIDATION PENDING、ACCEPT、ACCEPT WITH NOTES 或 REJECT（validation-checklist.md §7）"]}
---

# F04 L0 Framework Map (manual map + interaction hypothesis)

## Goal

手工产出 Fixture A（`测试文档/18-context-consumption-semantic-model.md`）的目标态 `framework-map`：12 个元素、4 条边、
7 条侧挂、5 个 topic，`mapVersion` 2，并渲染成一次性静态验证页 `drafts/l0-preview.html`（一屏两区：机制图 + topic 导航）。
本 feature 只验证**交互假设**——分层下钻 + L0 机制图 + Topic 导航是否比「四段阅读流 + 21 个 block 长列表」更容易理解；
方法泛化（六类元素、主轴/侧挂、Relation vocabulary）属 Feature 05，两者结论不得互相背书。
自动化部分（Framework Map invariant F1~F3 + Navigation invariant N1~N3 + Structural Reachability Test）已通过：
Hard Error 0、Warning 1（元素数 12 贴上限）、完全无路径 = 0。人工 Track A 未执行，因此判定只能是
**TECHNICAL PASS / UX VALIDATION PENDING**。

## Process preconditions

Process order: F03（架构规格）完成并冻结后执行；产出供 F05（Track B）复用 Fixture A 的图，但 Track A 与 Track B 的结论互相独立。

- F03 已把 L0 信息架构定为一屏两区（元素级机制图 + topic 导航），并冻结了 §5.1 六类元素 / §5.2 role / §6.1 八词关系 / §7 三层 coverage 的口径。
- 输入已就位：`测试文档/18-context-consumption-semantic-model.md`（Fixture A）、`fixtures/context-consumption.overview-plan.json`（87 条 sourceUnits / 21 个 block）、`experiments/stage2-full/overview-preview.html`（baseline）。
- 允许的改动面只有 `docs/log/artifacts/F04-l0-framework-map/`（草稿 + 记录）；`app/`、`schema/`、`fixtures/`、`experiments/` 均不得改。
- Track A（交互假设）与 Track B（生成模型假设 / 泛化）是两条独立轨道，Track A 的「更好用」不能给泛化背书。

## Scope

### Allowed changes

- `docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json`：手工撰写的目标态 L0 框架图（mapVersion 2）。
- `docs/log/artifacts/F04-l0-framework-map/drafts/build-l0-preview.js`：一次性构建脚本（278 行，交付物清单外但已登记，见 phase1-notes.md D6），把 map + plan 渲染成静态页。
- `docs/log/artifacts/F04-l0-framework-map/drafts/l0-preview.html`：一次性静态验证页，非产品代码。
- `docs/log/artifacts/F04-l0-framework-map/results/**`：`phase1-notes.md`、`verification-output.txt`、`structural-reachability.txt`、`structural-reachability.md`、`track-a-worksheet.md`。
- `docs/log/artifacts/F03-hierarchical-architecture/brief.md`：执行中发现的 5 处规格缺口（G1~G5）回写其中（§3.3 / §5.1 / §5.2 / §5.3 / §5.4 / §7 / §10.1 / §11.3）。

### Out of scope

- 不改 `app/renderer/*`、`app/main/*`、`schema/*`；不写产品化 renderer（那属 Feature 08）。
- 不改现有 11 个 shape、不写 `shape-catalog`；不写产品化的 Stage 1a / 1b prompt（属 Feature 07）。
- 不复用旧 21 个 block 作为 L2 内容；不产出 `check-map` 等校验器（属 Feature 06，且在 Feature 05 的 Gate 之后）。
- 不做 Fixture B / C（属 Feature 05）。
- 不因本篇画得出一条主链就把「主轴」当成 L0 的必要形态。
- 未改 `fixtures/context-consumption.overview-plan.json` 与 `experiments/`。

## Acceptance Criteria

- [x] Task 1.1 元素选择完成：12 个元素（≤ 12），每个都有唯一 `label`、词表内 `type`（artifact 3 / process 2 / concept 4 / constraint 3，component = 0）、受控 `role`、`topics` 归属与非空 `sourceUnitIds`；16 条淘汰候选逐条写明判据（A 1 / C 6 / D 7 / 类型 2，phase1-notes.md §1~§2）。
- [x] Task 1.2 主轴与侧挂完成：4 条 edge（depends-on / consumes / produces）全在八词表内、方向读得通、未用兜底词 `relates-to`；7 条 attachments 承载 concept / constraint；`thesis` 与 5 个 topic（title + proposition + blockIds）齐备（map.json、verification-output.txt）。
- [x] Task 1.3 边界与反例进图：3 条 constraint 侧挂（E-10 / E-11 / E-12），反例未建成独立节点、未新增第 7 种元素类型（phase1-notes.md §1）。
- [x] Task 1.4 三层 coverage 分开自查通过：Framework Map invariant F1 ✓ F2 ✓（12 ≤ 12）F3 ✓；判据 B 12/12、判据 F label 唯一、attachments 完整；Navigation invariant N1 ✓ N2 ✓（21/21 block 有入口）N3 ✓（87/87 语义可达，完全无路径 = 0）；Semantic Coverage 明确交由 `check-overview`；自查结果 Hard Error 0 · Warning 1（verification-output.txt）。
- [x] Task 1.5 自动化部分完成：Structural Reachability 十题跳数分布 0 跳 1 题 · 1 跳 6 题 · 2 跳 3 题 · 无路径 0 题，结论为「完全无路径 = 0」；文档明确写出它不是 Track A 的胜负指标（structural-reachability.md/.txt）。
- [x] mapVersion 1 → 2 的修复轮已实施：Topic 与 L0 element 解耦、新增 Navigation invariant、Topic 按语义内聚重新推导、O-01 改由 `document.scope` 承担，修复前 8 条无路径语义归零（phase1-notes.md §4）。
- [ ] 人工 Track A 的六项指标（M1~M6）尚未执行：`results/track-a-worksheet.md` 的逐题记录表、`不打开原 Markdown 的答题正确率`、首屏信息单元数、错误进入 Topic 次数、返回/重选次数与主观评分全部为空；在这一项完成前不得宣布交互假设已验证（brief.md §5、validation-checklist.md §5.2）。
- [ ] validation-checklist.md 未由 reviewer 逐项回签，尤其 §1「抽查 3 个元素 sourceUnitIds」与 §7 的最终判定栏（需明确回一句 `TECHNICAL PASS / UX VALIDATION PENDING` / `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`）。

## Risks and compatibility

- **人工 Track A 未执行，交互假设仍未验证**：这是本 feature 为 `blocked` 的唯一原因。legacy registry 记 04 为 `Technical Pass / UX Validation Pending`，本合同的 `blocked` 与之一致；结构检查通过不等于交互体验更好。
- **元素数贴硬上限**：12 = 上限，自查即报 1 条 Warning；后续文档若沿用同一判据 C 口径，很容易越过 12 而需要重做元素选择。
- **C 判据主观**：淘汰 16 条候选中 6 条依据判据 C（「删掉会破坏对架构的理解」），reviewer 未复核；元素膨胀与误删风险都在这一条上。
- **结构可达性不可逐字复现**：仓库中不存在可达性脚本文件，只留下输出；`validation-checklist.md` §5.1「存在且可复现」因此未勾选。
- **candidate 的 L2 是占位**：静态页深链到现有 21 个 block（只为验证交互，不改变切法）；Feature 07 重新生成 L2 后跳数分布会变，当前的跳数结论不能直接外推。
- **规格缺口已改规格，影响下游**：G1~G5 已回写 F03 brief（coverage 三层拆分、判据 B 含 attachment、允许同类型元素连续、六类是词表非清单、Topic 推导顺序）。F05 / F06 的判据建立在这些修订上，与修订前的旧口径不兼容。
- **遗留问题**：`docs/specs/framework-map-contract.md` 之后的 `check-map` 能对同一份 map 做契约校验（F06 / F09 记录中有该命令输出），但 F04 当时没有校验器，本 feature 未跑过 `check-map`，此处不作回溯登记。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F04-l0-framework-map/verification-summary.md`
- Independent review: `docs/log/artifacts/F04-l0-framework-map/subagent-review.md`（harness 接入前关闭，未留下独立审查记录；已记录补偿方式）
- 历史材料: `docs/log/artifacts/F04-l0-framework-map/{brief.md,execution-prompt.md,validation-checklist.md,results/**,drafts/**}`
- 规格依据: `docs/log/artifacts/F03-hierarchical-architecture/brief.md`
