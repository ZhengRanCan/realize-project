# F08 Verification Summary

本文件把 harness 接入前的 F08 验证记录整理成当前口径。F08 的材料不含 `results/*-output.txt`，
原始记录分布在 `brief.md`（§3 五阶段状态、§5 交付物与断言数）、`execution-prompt.md`（§0 前置条件与各 Phase 命令用法）、
`validation-checklist.md`（§3/§4 断言口径、§7 regression 勾选）、`results/track-a-round1.md`（人工 Round 0 与 2026-09-27 手工 smoke）。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `node scripts/test-l0-view-model.js` | not_recorded | passed | View Model 回归 34 断言 · 28 份 map（`validation-checklist.md` §3 记 34/34）；不丢 / 不裁 / 不改 / 不造 / 不崩 |
| `node scripts/test-l0-layout.js` | not_recorded | passed | `brief.md` §5 记 42 断言 · 28 份 map；不丢 / 不造线 / 不重叠 / 方向贴边 / 排序减少交叉 / 逐字节确定 |
| `node scripts/test-l0-preview.js` | not_recorded | passed | `validation-checklist.md` §4 记 51/51 · 6 份预览；`brief.md` §5 记 119 断言（6 份预览 + 1 份合成 0-edge 样本）——两个数字均如实引用，未调和 |
| `npm run test:l0` | not_recorded | not_recorded | `package.json` 定义的别名，串联上三条命令；F08 材料以 node 直调形式记录，无别名输出 |
| `npm run l0:vm` | not_recorded | not_recorded | `package.json` 存在该别名；材料无输出 |
| `npm run l0:preview` | not_recorded | not_recorded | 同上 |
| `node scripts/build-l0-preview.js --set` | not_recorded | not_recorded | `execution-prompt.md` §Phase 2 列出；产物 6 份 `experiments/l0-ui/preview-*.html` 已存在可核 |
| `npm run l0:layout` | not_recorded | not_recorded | `track-a-round1.md` §0「不开 GUI 先自查」；无输出 |
| `npm run selftest` | not_recorded | passed | `brief.md` §3：Electron L0 集成 selftest，断言链路 preload API → IPC → main.loadFrameworkMap → app.js mount → DOM，共 10 条断言 |
| 手工 smoke：点「打开 framework-map.json」 | 2026-09-27 | failed → 已修 | `track-a-round1.md` §0：信息行显示已加载但界面无变化（真实入口调不存在的 `enterReview()` 并静默抛错）；修为 `loadL0(path)` 唯一入口，补「真的切屏了」「无 model 导航守卫」2 条断言 |
| `npm run verify:harness` | 2026-09-27 | passed | harness 层证据；结果同步在 `docs/progress.md` 的 "Latest harness gate" 一行 |

> 结果值口径：材料写 `PASSED` 记 `passed`，写 `PASS WITH WARNINGS` 记 `passed-with-warnings`，无记录记 `not_recorded`。

## 关键指标（材料记录的当前口径）

| 指标 | 值 | 来源 |
| --- | --- | --- |
| View Model 回归断言 | 34 / 34（28 份 map） | `validation-checklist.md` §3 |
| Layout 回归断言 | 42（28 份 map） | `brief.md` §5 |
| Preview 验收断言 | 51 / 51（6 份预览）· 另记 119 | `validation-checklist.md` §4 / `brief.md` §5 |
| Electron 集成 selftest 断言 | 10 条 | `brief.md` §3 |
| 通过校验的 framework-map | 28 份，`check-map` HARD 全 0 | `execution-prompt.md` §0 |
| 静态预览产物 | 6 份（D / E / 自环 / 81 元素 / A / E-human） | `experiments/l0-ui/` |
| renderer 导致的语义消失 | 0（用计数断言证明） | `validation-checklist.md` §7 |
| Gate（第一轮） | `TECHNICAL PASS / UX VALIDATION PENDING` | `brief.md` §7、`legacy-feature-registry.md` |

## 人工路径证据

- **Round 0（已完成 · 用户本人）**：三条定性发现 —— ①核心结构以 card 集合呈现、关系不可一眼感知；②process / artifact 等 ontology metadata 增加理解成本；③machine ID 与标题竞争空间（`E-UserProfile` 不自然换行）。判定 `Navigation / visual hierarchy redesign required before timed Track A.`
- **Phase 4.1 对应动作**：Reading 改 node-edge 图（节点 = element、线 = edge）；Reading 隐藏 type / role / 机器 ID；标题按分隔符切开；约束降级为 `⚑ N` 角标。
- **2026-09-27 手工 smoke**：真实入口静默失败已修复，作为正式 Track A 之前的阻断项关闭。
- **尚未做**：正式计时 Track A（D + E）与 reviewer 签署，见 `results/track-a-round1.md` 的状态行「⬜ 待进行」与 `validation-checklist.md` §7–§8 的未勾选项。

## 已知偏差

- **材料内部状态不一致**：`brief.md` §3 与 git 记录（`126eeea` / `c27acca` / `d01baec` / `4e756f4`）显示 Phase 3 / Phase 4 第一版已完成，而 `validation-checklist.md` §5–§6 与 `execution-prompt.md` §0 仍标「待做」。本汇总与 `feature.md` 的 `knownUnverified` 按后者登记，未擅自改任何历史材料。
- **断言数不一致**：34+42+119（`brief.md`）对 34+51（`validation-checklist.md` / `legacy-feature-registry.md`）；`scripts/test-l0-preview.js` 现有 56 处 `check(...)` 调用点。本轮不重跑测试，不做调和。
- **命令输出未落盘**：F08 没有 `results/verification-output.txt`，命令日期未逐条记录；`lastVerifiedAt` 取材料中确有日期的 2026-09-27。
- **命令路径照实引用**：材料中的命令写法（`node scripts/test-l0-view-model.js` 等）为规范化前记录，原样登记。
- Round 0 只是定性第一印象，不构成 UX PASS；「Phase 4.1 是否解决了 Finding 1」仍待人工验证。

## Harness layer

- `npm run verify:harness` 结果见 `docs/progress.md` 的 "Latest harness gate" 一行。
- F08 状态为 `active`（index 与合同 frontmatter 一致），故不触发 `passing` 的额外 gate 约束。

## 实验产物

`experiments/l0-ui/*.html` 共 **6 份预览**，逐条登记在 `experiments/index.json`（`areas.l0-ui`，带 fixture 字母）：
`preview-a`、`preview-d`、`preview-d-overbudget`、`preview-d-selfloop`、`preview-e`、`preview-e-human`。

它们是 `npm run l0:preview` 的产物；输入 map 来自 F04 / F05 / F09 的 drafts（对应关系见 `experiments/index.json` 的
`fixtureContext`）。索引与校验：`npm run index:experiments` / `npm run check:experiments`。
