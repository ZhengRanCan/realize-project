# F04 Verification Summary

本文件把 harness 接入前的验证记录整理成当前口径。原始输出保持原样，见
`results/verification-output.txt`（UTF-8）、`results/structural-reachability.txt`（UTF-8）、
`results/structural-reachability.md`、`results/phase1-notes.md`、`results/track-a-worksheet.md`。

> 说明：spec §6.2 提示这类 `.txt` 多为 UTF-16LE。本 feature 的两个 `.txt` 实测是 **UTF-8**（无 BOM），
> PowerShell 的 `Unicode.GetString` 读出来是乱码，用 `read` 工具直接读即可。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `node docs/log/artifacts/F04-l0-framework-map/drafts/build-l0-preview.js` | 2026-09-26 | passed | 一次性构建脚本（交付物清单外，见 `phase1-notes.md` D6）；产物 `drafts/l0-preview.html` |
| Framework + Navigation invariant 自查（一次性脚本） | 2026-09-26 | passed-with-warnings | `Hard Error 0 · Warning 1`（元素总数 12 已接近上限 12）；F1~F3 与 N1~N3 全部 PASS；原始输出 `results/verification-output.txt` |
| Structural Reachability Test（`node <一次性脚本> --map docs\features\04-l0-framework-map\drafts\context-consumption.map.json --plan fixtures\context-consumption.overview-plan.json`） | 2026-09-26 | passed | `PASS 87/87 条语义都有可达路径 —— 完全无路径 = 0`；原始输出 `results/structural-reachability.txt`。路径为规范化前记录 |
| `drafts/l0-preview.html` 真实加载 + DOM 断言（Electron） | 2026-09-26 | passed | 渲染文档标题 · 12 个元素卡片 · 5 个 topic 导航 · 文档级入口 · edge 标签 · 点击元素开 L3 · 无控制台错误；记录在 `results/phase1-notes.md` §7（命令本身未留逐字记录） |
| `npm run verify:harness` | 2026-09-27 | passed | 收口约定登记；F04 自身零错误（运行时全仓仍报其它 feature 的缺件错误，见下方 Harness layer） |

> 未登记：`validate` / `audit` / `check-map` / `verify-preview` / `selftest` / `l0:*` —— 历史材料里没有 F04 跑这些命令的输出
> （`check-map` 与 `l0:*` 都是 F04 之后才出现的），故不写入证据。理由见 `docs/harness/features/individual_feature/F04-l0-framework-map/verification.md`（§未登记的命令）。

## 关键指标

```text
drafts/context-consumption.map.json   mapVersion 2
  元素 12（≤ 12 上限）· 边 4 · 侧挂 7 · topic 5
  type 分布: artifact 3 · process 2 · concept 4 · constraint 3 · component 0 · state 0
  直接承载 42/87 条语义
drafts/l0-preview.html                一屏两区静态页（phase1-notes.md 记 31.8 KB / 42 条原文语句 + 20 条 L2 深链）
```

| Invariant | 结果 |
| --- | --- |
| F1 每个 L0 element 有 provenance | PASS 12/12（`sourceUnitIds` 非空） |
| F2 元素容量 ≤ 12 | PASS 12 ≤ 12（WARN：已接近上限） |
| F3 不要求每个 Topic 都有 element | PASS（本篇恰好 5/5 Topic 都有 element，不与 F3 冲突） |
| 判据 B（至少一条 edge 或 attachment） | PASS 12/12 |
| 判据 F（label 唯一） | PASS 12 个 label 唯一 |
| attachments 完整性 | PASS 侧挂元素全部有 attachment（7 条） |
| N1 每个 Topic 至少关联一个 element 或 block | PASS（T-01 4e/4b · T-02 5e/3b · T-03 2e/4b · T-04 4e/4b · T-05 1e/5b） |
| N2 每个需保留的 block 至少一个入口 | PASS 21/21（Topic 20 + 文档级 1；O-01 由 `document.scope` 承担） |
| N3 每条 Semantic Unit 有可达路径 | PASS 87/87，**完全无路径 = 0**（入口：document metadata 4 · L0 element 42 · Topic→L2 86） |

**Structural Reachability 十题跳数分布**

```text
0 跳 1 题（Q6，document.nonGoalSummary 在首屏承担）· 1 跳 6 题 · 2 跳 3 题 · 无路径 0 题
```

**修复前后（mapVersion 1 → 2）**

| | 修复前 | 修复后 |
| --- | --- | --- |
| 完全无路径的语义 | 8 条 | 0 条 |
| Topic 数 | 4 | 5 |
| 无入口的 block | O-01 / O-11 / O-13 | 0 |

```text
根因：旧不变量「每个 Topic 至少有一个 L0 element」把 Framework Map 与 Topic Navigation 混成一件，
      图上没有元素的内容就不可能有 Topic，整块语义从导航上消失（integration 修复见 phase1-notes.md §4）。
```

## 人工路径证据

- 已完成（结构侧）：静态页真实加载与 DOM 断言（`phase1-notes.md` §7）；可达性说明明确声明它不是 Track A 的胜负指标（`structural-reachability.md` §0 / §5）。
- **未完成（交互假设侧）**：`results/track-a-worksheet.md` 六项指标全部为空 ——
  M1 找到答案耗时 · M2 不打开原 Markdown 的答题正确率（硬指标）· M3 首屏信息单元数 ·
  M4 错误进入 Topic 次数 · M5 返回 / 重选次数 · M6 主观负担。十道题及答案要点见 worksheet §2~§5。
- **未完成（验收侧）**：`validation-checklist.md` 未经 reviewer 逐项回签，§7 最终判定栏为空。
- **未完成（复核侧）**：元素溯源抽查（清单 §1「抽查 3 个元素的 `sourceUnitIds`」）与 6 条主观判据 C 的复核均未进行。
- 结论口径：上述三项未完成之前，本 feature 只能是 **TECHNICAL PASS / UX VALIDATION PENDING**
  （`brief.md` §5 / §7、`validation-checklist.md` §7、`track-a-worksheet.md` §6），**不得宣布交互假设已验证**。

## 已知偏差（不改变结构侧的 PASS）

- **元素数贴硬上限**：12 = 上限，自查即报 1 条 Warning；淘汰的 16 条候选中 6 条依据主观的判据 C，reviewer 未复核。
- **可达性不可逐字复现**：仓库中不存在可达性脚本文件，只留下输出；命令行未记录，`validation-checklist.md` §5.1「存在且可复现」未勾选。
- **candidate 的 L2 是占位**：`drafts/l0-preview.html` 深链到现有 21 个 block（只为验证交互、不改变切法）；Feature 07 重新生成 L2 后跳数会变。
- **规格缺口 G1~G5 已改规格**：回写 `docs/log/artifacts/F03-hierarchical-architecture/brief.md`（§3.3 / §5.1 / §5.2 / §5.3 / §5.4 / §7 / §10.1 / §11.3），下游 F05 / F06 的判据建立在这版修订上。
- **baseline 的对照数据来自材料转述**：`structural-reachability.md` §0 引用 baseline 的 `scrollHeight` 约 1059px、11 个折叠；本轮未重新测量 baseline，也未据此下任何胜负结论。

## Harness layer

- `npm run verify:harness`（2026-09-27）结果：**F04 自身零错误**（`scripts/harness-gate.mjs` 未报任何 `F04:` 开头的错误）。
  同一次运行里全仓仍报其它 feature 的缺件错误（本文件写入时依次见到 `F06: missing feature.md.`、`F10: missing verification.md.` 等），
  这些错误属于尚在推进的其它 feature，与 F04 无关。`evidence.commands` 里这条记 `passed` 指 F04 通过 gate 检查，不表示全仓 gate 已通过。
- 本 feature 仍为 `blocked`，卡点是人工 Track A 未执行，逐条列在
  `docs/harness/features/individual_feature/F04-l0-framework-map/feature.md` 的 `completionGate.humanReviewRequired` / `knownUnverified`。
- harness gate 的当前总况以 `docs/harness/features/feature-index.json` 与主 agent 的收口记录为准。
