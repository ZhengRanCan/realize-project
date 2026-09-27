# F08 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `npm run validate` | no（未在本 feature 材料中出现）| 不在 F08 材料范围；F08 的静态红线以 validation-checklist.md §1 的「未改 schema / contract / check-map」形式记录 |
| L2 feature | `node scripts/test-l0-view-model.js` | yes | `verification-summary.md`「断言口径」：**34/34** · 28 份 map（执行断言数口径） |
| L2 feature | `node scripts/test-l0-layout.js` | yes | `verification-summary.md`「断言口径」：**42/42** · 28 份 map（含逐份矩阵 28/28） |
| L2 feature | `node scripts/test-l0-preview.js` | yes | `verification-summary.md`「断言口径」：**130/130** · **7 份预览**（6 份提交产物 + 1 份合成 0-edge 样本）；早期材料里的 51 / 119 / 127 是更早轮次的真实值，已统一为当前口径 |
| L2 feature | `npm run test:l0` | no（本 feature 未记录，但等价串联三条 L2 命令） | `package.json` 定义该别名；F08 材料中无该别名的输出记录 |
| L3 system | `npm run selftest` | yes（`l3: required`） | `brief.md` §3 的 Electron L0 集成 selftest 段（断言链路 preload API → IPC → main.loadFrameworkMap → app.js mount → DOM，共 **13 条** L0 集成断言；selftest 总计 66 条 ✓） |
| L3 system | `npm run l0:layout` | no（人工自查入口） | `results/track-a-round1.md` §0 记为「不开 GUI 先自查」；`brief.md` §5 与 `scripts/inspect-l0-layout.js` 记录用法，第二轮改动时实跑通过 |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F08-l0-ui/verification-summary.md` |

> F08 材料不含 `results/verification-output.txt` / `mutation-output.txt`，命令输出未落盘；上表 Evidence 一律指向记录该结果的 `.md` 小节。
> 日期一律见 `verification-summary.md` 的 Commands 表（材料未逐条记录，标 `not_recorded`）。
> **断言口径（2026-09-27 统一）**：表中数字一律是**执行断言数**（脚本自身打印的 `N/N 通过`）。
> 静态 `check(` 调用点数（`grep -c '^\s*check('`：view-model 7 / layout 14 / preview 50）**不是**断言数 ——
> 逐份预览的断言会按 map 数展开执行。早期材料混用了两种数法，才出现 51 / 119 / 127 / 56 处 四个值。

## Manual paths

- [ ] 正式 Track A（D · reviewability）：让真实读者回答「Task 是否存在任务间依赖？依赖满足条件是什么？」，
      观察其能否自行指出「图上没有这条边，但原文有 —— 是图的问题」。记录表见 `results/track-a-round1.md` §1。
- [ ] 正式 Track A（E · readability）：沿 L0 走完 `bounded failure → REFUND_FAILED → force compensation → admin boundary`，
      理想情况不打开原 Markdown。记录表见 `results/track-a-round1.md` §2。
- [ ] 每条路径记 5 个数据 + 1 句主观（Time to answer / Answer correctness / Wrong topic entries / Backtracks / Opened original Markdown?）。
- [x] Round 0（定性第一印象，用户本人）：已记录三条发现（关系不可一眼感知 / ontology metadata 增加理解成本 / machine ID 与标题争夺空间），
      判定为 `Navigation / visual hierarchy redesign required before timed Track A.`（`results/track-a-round1.md` §0.1）。
- [x] 2026-09-27 手工 smoke（Track A 前置）：发现点「打开 framework-map.json」信息行显示已加载但界面无变化（`enterReview()` 静默抛错），
      已修为 `loadL0(path)` 唯一入口并补 2 条 selftest 断言（`results/track-a-round1.md` §0 中的 2026-09-27 记录）。

**还未做的是：正式计时的 Track A（D + E）**，以及由 reviewer 在 `validation-checklist.md` §7–§8 上签署 Gate 结论。

## Passing evidence

- 命令与结果记录在 `docs/log/artifacts/F08-l0-ui/verification-summary.md`。
- 代码有变更（`scripts/l0-view-model.js`、`scripts/build-l0-preview.js`、`scripts/inspect-l0-layout.js`、
  `app/renderer/l0-map.js`、`app/renderer/l0-layout.js`、`app/renderer/l0-map.css`、`app/main/main.js`、`app/renderer/app.js`
  及其三条回归脚本），但本 feature **尚未关闭**，独立审查记录见 `subagent-review.md`（`Status: not_recorded`）。
- F08 当前为 `active`，**不**适用 `passing` 的额外约束；关闭前必须清空 `knownUnverified` 与 `humanReviewRequired`
  （其中 Phase 3/4 状态口径与 Track A 记录是两项硬前置）。
