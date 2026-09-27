---
id: F08
title: L0 UI (framework map navigation screen)
version: v0.1
status: active
dependsOn: []
scope: {"code":["scripts/l0-view-model.js","scripts/build-l0-preview.js","scripts/inspect-l0-layout.js","app/renderer/l0-map.js","app/renderer/l0-layout.js","app/renderer/l0-map.css","app/main/main.js","app/renderer/app.js"],"tests":["scripts/test-l0-view-model.js","scripts/test-l0-layout.js","scripts/test-l0-preview.js"],"docs":["docs/log/artifacts/F08-l0-ui/**"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"npm run test:l0","result":"passed","note":"由 package.json 定义为 node scripts/test-l0-view-model.js && node scripts/test-l0-layout.js && node scripts/test-l0-preview.js；材料记 View Model 回归 34 断言 / 28 份 map、Preview 验收 130 断言 · 7 份预览，全绿"},{"command":"node scripts/test-l0-view-model.js","result":"passed","note":"34 断言 · 28 份 map（口径见 verification-summary.md「断言口径」）"},{"command":"node scripts/test-l0-layout.js","result":"passed","note":"42/42 · 28 份 map（含逐份矩阵 28/28；口径见 verification-summary.md「断言口径」）"},{"command":"node scripts/test-l0-preview.js","result":"passed","note":"130/130 · 7 份预览（执行断言数口径；静态 check( 调用点 50 处不是断言数）—— 早期材料的 51 / 119 / 127 已统一，见 verification-summary.md「断言口径」"},{"command":"npm run l0:vm","result":"not_recorded","note":"package.json 中存在该 npm 别名；材料里未留下以 npm 别名形式记录的输出"},{"command":"npm run l0:preview","result":"not_recorded","note":"同上"},{"command":"node scripts/build-l0-preview.js --set","result":"not_recorded","note":"execution-prompt.md §Phase 2 列出该用法；仅有产物 6 份 experiments/l0-ui/preview-*.html 可核，未见输出记录"},{"command":"npm run l0:layout","result":"not_recorded","note":"track-a-round1.md §0 记为“不开 GUI 先自查”；未见输出记录"},{"command":"npm run verify:harness","result":"passed"}],"manualSmoke":"2026-09-27 手工 smoke（Track A 前置，见 results/track-a-round1.md §0）：点「打开 framework-map.json」信息行显示已加载但界面无变化 —— 真实入口 loadL0() 调了不存在的 enterReview() 并静默抛错；已修为 loadL0(path) 唯一入口，并补 2 条 selftest 断言。正式 Track A（D + E 计时）**尚未进行**。"}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中打开 L0 框架图页面，加载一份已通过校验的 framework-map.json，确认可在「Framework Map + Topic Navigation」一屏两区内看结构 / 看关系 / 选节点 / 看来源 / 进入 Topic","按 results/track-a-round1.md 正式执行 Track A：D 测 reviewability（缺 Task --depends-on--> Task 时用户能否自行指出缺陷）、E 测 readability（bounded failure → REFUND_FAILED → force compensation → admin boundary 能否不开原 Markdown 走完），每条记 5 个数据 + 1 句主观"],"integrationEvidence":["npm run test:l0（View Model 34/34 · 28 份 map；Layout 42/42 · 28 份 map；Preview 130/130 · 7 份预览）","npm run selftest（brief.md §3 记为 Electron L0 集成 selftest，断言链路 preload API → IPC → main.loadFrameworkMap → app.js mount → DOM，共 13 条 L0 集成断言；selftest 总计 66 条 ✓）","experiments/l0-ui/preview-{d,e,d-selfloop,d-overbudget,a,e-human}.html 6 份静态预览产物存在"],"knownUnverified":["Phase 3（Electron L0 集成）未完成 —— 注：brief.md §3/§5 与 git 记录 126eeea 记「Phase 3/4 第一版完成」，本条保留按本轮收口口径登记，两端记录不一致见 Risks","Phase 4（交互：element / edge / topic / provenance）未完成 —— 同上，brief.md §3 记「第一版完成」","Phase 5 的 A–E regression 人工部分未完成：正式 Track A（D + E，计时 + 5 数据）尚未执行，results/track-a-round1.md 状态仍为「⬜ 待进行」","各条命令的运行日期在材料中未逐条记录（断言数已于 2026-09-27 统一：View Model 34/34 · Layout 42/42 · Preview 130/130 · selftest 13 条 L0 断言）"],"humanReviewRequired":["Track A 人工 UX 测试尚未进行：正式计时版本安排在 Phase 4.1 之后执行，记录表 docs/log/artifacts/F08-l0-ui/results/track-a-round1.md 仍待填写；Round 0 只留下定性第一印象（用户本人）","Round 0 三条定性发现（关系不可一眼感知 / ontology metadata 增加理解成本 / machine ID 与标题争夺空间）已由 Phase 4.1 的四项动作回应，但「回应是否有效」尚无人工验证","validation-checklist.md §8 的 Gate 仍为待判定项：结论只能在 TECHNICAL PASS / UX VALIDATION PENDING 与 PASS 之间二选一，写 PASS 必须附人手 Track A 记录"]}
---

# F08 L0 UI (framework map navigation screen)

## Goal

把已通过校验的 `framework-map.json` 做成 Electron 里的 **L0 一屏两区导航界面**：左侧 Framework Map（核心机制）、右侧 Topic Navigation（完整入口索引，含无 element 的 Topic）。第一轮只做 deterministic UI integration：`framework-map.json → l0-view-model.js（纯投影）→ l0-layout.js（确定性布局）→ l0-map.js（双模 renderer）→ Electron`，静态预览与产品共用同一份 renderer 模块。交付物包括 view model 适配器、静态预览构建器、确定性图布局、双模 renderer 与三份回归脚本；材料记录 View Model 回归 34/34（28 份 map）、Layout 42/42（28 份 map）与 Preview 验收 130/130（7 份预览）全绿，且 renderer 不改输入语义（输入 sha 前后一致）。Round 0 的人工第一印象已记录在 `results/track-a-round1.md`，并据此插入 Phase 4.1（Relationship-first Reading View）。Gate 当前为 `TECHNICAL PASS / UX VALIDATION PENDING`。

## Process preconditions

- `Process order:` 本 feature 在 F06（契约与校验器）之后；C 冻结依据为 F09 Closed。
- 契约与校验器可用：6 类 element、9 个关系词、edge 可选 `id` · `label` · `qualifiers`（execution-prompt.md §0 前置条件①）。
- 有通过校验的 framework-map：仓库里 28 份，`check-map` HARD 全 0（前置条件②，同处）。
- L0 形态已冻结：Contract v1 · F09 Closed（前置条件③，同处）。
- 上述前置**没有**登记为 `dependsOn`：F06 至今没有用户验收记录，若登记为 `dependsOn`，gate 会因父 feature 非 `passing` 而必然报错（spec §4「为什么有些 dependsOn 是空的」）。因此 F08 的 `dependsOn` 有意为空，流程先后只写在本节。

## Scope

### Allowed changes

- `scripts/l0-view-model.js`（Phase 1 纯投影适配器）、`scripts/build-l0-preview.js`（Phase 2 构建期 SSR 预览）、`scripts/inspect-l0-layout.js`（`npm run l0:layout`，文字核对布局）。
- `app/renderer/l0-map.js`（双模 renderer）、`app/renderer/l0-layout.js`（Phase 4.1 确定性图布局）、`app/renderer/l0-map.css`（Reading / Review 视觉语法）。
- `app/main/main.js`（L0 页面读取与 selftest 块）与 `app/renderer/app.js`（第三个一级页面的挂载与 `loadL0(path)` 唯一入口）。
- 回归脚本 `scripts/test-l0-view-model.js`、`scripts/test-l0-layout.js`、`scripts/test-l0-preview.js`。
- 产物与记录：`experiments/l0-ui/preview-*.html`（6 份）、`docs/log/artifacts/F08-l0-ui/**`。

### Out of scope

- 不调用任何模型；不碰 F10 的 prompt / runner / 两阶段流程。
- 不改 `schema/framework-map.schema.json`、`docs/specs/framework-map-contract.md`、`scripts/check-map.js` 一行。
- 不在 layout 里表达语义（布局不能创造原数据没有的语义）；不因 >12 隐藏节点、不造主轴、不把 `relationGap` / `attachment` 变 edge。
- Reading / Review 数据只隐藏不删除；不为「D 缺 Task 节点」在 UI 层补节点。
- 不做：自动折叠复杂 constraint 语句、动画、自由拖拽编辑、用户修改 map、AI regenerate、复杂 mini-map、自定义布局保存。
- 不新增 shape 语义、不改现有 11 个 shape、不推翻 Decisions / Source 回查视图、不让 AI 直接产出最终页面。

## Acceptance Criteria

- [x] Phase 0 完成：前置条件核过，现有 app 集成面审计完成（复用 `app/renderer/app.js` 与静态预览 host shim 约定，预览与产品共用一份 renderer）。
- [x] Phase 1 完成：`scripts/l0-view-model.js` 就位；`scripts/test-l0-view-model.js` 记 34/34 全绿，覆盖 28 份 map（不丢 / 不裁 / 不改 / 不造 / 不崩）。
- [x] Phase 2 完成：`scripts/build-l0-preview.js` 生成 6 份预览；`scripts/test-l0-preview.js` 记为 **130/130** 全绿（7 份预览 = 6 份产物 + 1 份合成 0-edge 样本；方向显式、qualifiers 可见、自环标注、relationGap 标注「不是 edge」、provenance 可达、无网络依赖）。
- [x] 输入 sha 一致性成立：view model 入口与出口对输入做 sha 比较，输入被修改就抛错（validation-checklist.md §2「输入文件 sha 在构建前后一致」）。
- [x] 单一 renderer 复用成立：`app/renderer/l0-map.js` 为双模模块，Phase 2 预览与 Electron 共用 `renderL0MapHTML` / `mount`，未复制代码。
- [x] 范围红线未破：本轮未调用模型，未改 `schema/framework-map.schema.json` / `docs/specs/framework-map-contract.md` / `scripts/check-map.js`，未触碰 F10 的 prompt / runner / 两阶段流程。
- [x] Round 0 人工定性发现已记录并按 Finding 1–3 落地 Phase 4.1（Reading 改 node-edge 图 / 隐藏 ontology metadata / 不显示机器 ID；约束降为 `⚑ N` 角标）。
- [ ] Phase 3 状态未关闭：Electron L0 一屏两区集成存在口径冲突 —— `brief.md` §3/§5 与 git（`126eeea`）记「第一版完成」，`validation-checklist.md` §5 仍标「待做」。
- [ ] Phase 4 状态未关闭：element / edge / topic / provenance 交互同样存在口径冲突 —— `brief.md` §3 记「第一版完成」，`validation-checklist.md` §6 仍标「待做」。
- [ ] Track A 人工 UX 测试未执行：`results/track-a-round1.md` 状态仍为「⬜ 待进行」，尚无 Time to answer / Answer correctness / Wrong topic entries / Backtracks / 是否开原 Markdown 五项数据。
- [ ] validation-checklist.md §7–§8 尚未由 reviewer 签署：Gate 结论仍为待判定项，未拿「截图看起来不错」当 UX PASS。

## Risks and compatibility

- **材料内部状态不一致（最重要）**：`brief.md` §3 与 git 记录（`126eeea` Phase 3/4 第一版、`c27acca` Phase 4.1、`d01baec` 静默失败修复、`4e756f4` selftest）显示 Electron 集成与交互第一版已完成；而 `validation-checklist.md` §5/§6 仍标「待做」、`execution-prompt.md` §0 仍为 ⬜。本合同的 `knownUnverified` 按后者（未完成）登记。F08 仍为进行中，任何一方都需要在关闭前统一这份状态。
- **断言数口径（2026-09-27 已统一）**：F08 的三条回归脚本与 selftest 一律以**执行断言数**（脚本打印的 `N/N 通过`）为准 —— View Model 34/34（28 份 map）、Layout 42/42（28 份 map）、Preview 130/130（7 份预览）、selftest 的 L0 集成 13 条（总计 66 条）。早期材料里的 51 / 119 / 127 与「56 处 check 调用点」是更早轮次的真实值或另一种数法（静态调用点），已全部统一；口径定义见 `verification-summary.md` 的「断言口径」。
- **命令日期未逐条记录**：F08 材料没有 `results/verification-output.txt` / `mutation-output.txt`，命令输出未落盘到 `results/`；`evidence.lastVerifiedAt` 取材料中确有日期的 2026-09-27 手工 smoke。
- **Round 0 只覆盖 D + E 的主观第一印象**，不是计时的 Track A；「Phase 4.1 是否真的解决了『关系不可一眼感知』」尚未被人工验证。
- **已知实现坑（已修，仍属兼容性风险）**：① 真实入口调不存在的 `enterReview()` 导致按钮静默失败而 selftest 全绿（测试复制了产品逻辑）；② 静态预览曾未加载 renderer 而断言只查文字；③ 约束挂约束时布局会丢元素。三条均已定点修复，但同类风险（测试副本、断言只查字符串）需在后续轮次继续防。
- **契约/生成侧缺陷不为 UI 让路**：D fixture 缺 `Task --depends-on--> Task`（F10 判定 E3 Encoding Distortion），UI 刻意不补节点，因此界面看起来「缺了一块」是预期行为，不是渲染缺陷。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F08-l0-ui/verification-summary.md`
- Independent review: `docs/log/artifacts/F08-l0-ui/subagent-review.md`（F08 尚未关闭，`Status: not_recorded`；独立审查留到 passing 之前）
- 历史材料: `docs/log/artifacts/F08-l0-ui/{brief.md,execution-prompt.md,validation-checklist.md,results/track-a-round1.md}`
