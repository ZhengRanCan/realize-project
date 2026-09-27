# F04 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | 无独立静态层命令（本 feature 未跑 `validate` / `audit`，也没有 `check-map`） | no | 不登记；见下方「未登记的命令」 |
| L2 feature | `node docs/log/artifacts/F04-l0-framework-map/drafts/build-l0-preview.js` | yes | 用法见 `drafts/build-l0-preview.js` 头部注释；产物 `drafts/l0-preview.html`，渲染断言记录在 `results/phase1-notes.md` §7 |
| L2 feature | Framework Map invariant（F1~F3）+ 受控词表 + 判据 B / F + attachments 自查 | yes | `results/verification-output.txt`（结果：Hard Error 0 · Warning 1） |
| L2 feature | Navigation invariant（N1 / N2 / N3）自查 | yes | 同上（21/21 block 有入口；87/87 语义可达，完全无路径 = 0） |
| L3 system | Structural Reachability Test（`node <一次性脚本> --map docs\features\04-l0-framework-map\drafts\context-consumption.map.json --plan fixtures\context-consumption.overview-plan.json`） | yes | `results/structural-reachability.txt`（脚本输出）· `results/structural-reachability.md`（方法与结论） |
| L3 system | `drafts/l0-preview.html` 真实加载 + DOM 断言 | yes | `results/phase1-notes.md` §7（PASS：标题 / 12 卡片 / 5 topic 导航 / 文档级入口 / edge 标签 / 点击元素开 L3 / 无渲染器控制台错误） |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F04-l0-framework-map/verification-summary.md` |

历史命令输出里的路径是规范化之前的写法（`docs\features\04-l0-framework-map\...`），照实引用、未改写（spec §6.2 / §6.5）。
可达性测试的**逐字命令行未被记录**：当时是一次性脚本，仓库里也不存在该脚本文件，只留下输出；因此
`validation-checklist.md` §5.1 的「存在且可复现」一条**未勾选**，已登记进 `knownUnverified`。

`npm run verify:harness` 运行时，F04 自身零错误（gate 未报任何 `F04:` 开头的错误）；同一次运行里全仓仍报其它
feature 的缺件错误（如 `F06: missing feature.md.` / `F10: missing verification.md.`），与 F04 无关。
该行的 `result: "passed"` 指 F04 通过 gate 检查，不表示全仓 gate 已通过。

## Manual paths

- [x] 结构侧人工路径（execution agent 自查后已记录）：确认 `drafts/l0-preview.html` 被真实加载过、机制图 + topic 导航 + 文档级入口 + 点击元素开 L3 都存在 —— 记录在 `results/phase1-notes.md` §7。
- [x] 结构侧人工路径：确认 `results/structural-reachability.md` 明确写出「它不是 Track A 的胜负指标」，且没有拿 hop count 推断交互体验优劣 —— 见该文件 §0 / §5。
- [ ] **人工 Track A（未做）**：在 `results/track-a-worksheet.md` 上执行六项指标 —— M1 找到答案耗时、M2 不打开原 Markdown 的答题正确率（硬指标）、M3 首屏信息单元数、M4 错误进入 Topic 次数、M5 返回 / 重选次数、M6 主观负担（1~5 分）。对照为 baseline `experiments/stage2-full/overview-preview.html` 与 candidate `drafts/l0-preview.html`；十道题见 worksheet §2，判分以原文为准。
- [ ] **reviewer 判定（未做）**：按 `docs/log/artifacts/F04-l0-framework-map/validation-checklist.md` 逐项回签，含 §1「抽查 3 个元素的 `sourceUnitIds`」与 §7 的最终判定栏，明确回一句 `TECHNICAL PASS / UX VALIDATION PENDING` / `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`。

## 未登记的命令

- `npm run check-map`：仓库现在有这个命令（F06 产出），F04 之后也被用来校验过 `docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json`（见 F06 / F09 的记录），但 **F04 当时没有校验器、材料里没有 F04 跑它的输出**，故不登记为 F04 的证据。
- `npm run validate` / `npm run audit` / `npm run verify-preview` / `npm run selftest`：F01 跑过，但 F04 的历史材料里没有它们的输出，故不登记。
- `npm run l0:vm` / `npm run l0:preview` / `npm run l0:layout` / `npm run test:l0`：这些命令在 2026-09-27 的 F08 工作里才加入，产物在 `scripts/`（非 F04 的 `drafts/`），不属 F04 的证据。

## Blocked evidence

- 命令日期与结果记录在 `docs/log/artifacts/F04-l0-framework-map/verification-summary.md`；`evidence.lastVerifiedAt` 取 2026-09-27 —— 结构检查的记录日期是 2026-09-26（F04 落地当天），`npm run verify:harness` 由主 agent 在 2026-09-27 收口时统一执行登记。
- 运行 `npm run verify:harness` 时 F04 自身零错误；全仓仍报其它 feature 的缺件错误，这些由各自的合同落地解决。
- 本 feature 为 `blocked`，原因是**人工 Track A（交互假设测量）未执行**、`validation-checklist.md` 未回签；卡片 frontmatter 的 `completionGate.humanReviewRequired` / `knownUnverified` 逐条列出了卡点。
- 代码侧只有 `drafts/build-l0-preview.js`（一次性脚本，非产品代码），且本 feature 在 harness 接入前关闭，未留下独立 subagent 审查记录；说明见 `docs/log/artifacts/F04-l0-framework-map/subagent-review.md`。
