# F04 Independent Review

- Status: `not_recorded`
- Reason: F04 在 harness 接入之前（2026-09-26）就已执行并关闭。当时的独立审查路径是人工 reviewer（用户）按
  `validation-checklist.md` 判定，legacy registry 记为 `Technical Pass / UX Validation Pending`；没有留下独立的
  subagent 审查记录，`validation-checklist.md` 的判定栏也没有回签。
- Decision: 本 feature 为 `blocked`，**不**依赖 subagent 审查来解除 —— 卡点是人工 Track A（交互假设测量）未执行。
  这条偏差在此显式登记，避免后续把它误当成「已完成独立审查」或「已通过验收」。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 元素选择与 16 条淘汰候选（含判据 A / C / D）、关键决策 D1~D6 | `results/phase1-notes.md` §1~§3 |
| mapVersion 1 → 2 的修复轮（根因、修法、修复后 Topic 集合） | `results/phase1-notes.md` §4 |
| 5 处规格缺口 G1~G5 与处置 | `results/phase1-notes.md` §5；回写 `docs/log/artifacts/F03-hierarchical-architecture/brief.md` |
| Framework + Navigation invariant 全部原始输出（含 Warning） | `results/verification-output.txt` |
| 结构可达性脚本输出（十题跳数、无路径检查、Topic 入口规模） | `results/structural-reachability.txt` |
| 结构可达性的方法、口径、四条局限与「不是 Track A 胜负指标」的声明 | `results/structural-reachability.md` §0 / §1 / §5 |
| 目标态框架图本体（12 元素 / 4 边 / 7 侧挂 / 5 topic，mapVersion 2） | `drafts/context-consumption.map.json` |
| 一次性静态页与其构建脚本（含用法注释） | `drafts/l0-preview.html`、`drafts/build-l0-preview.js` |
| 待执行的人工测量清单（M1~M6 + 十道题 + 判定口径） | `results/track-a-worksheet.md` |
| 验收清单与未回签的最终判定栏 | `validation-checklist.md`（§5.2 / §7） |

## Reviewer 视角下最需要留意的四点

1. **结构通过 ≠ 交互更好**：`structural-reachability.md` §0 已声明 hop count 不能当胜负指标 —— baseline 的 0 跳
   等于 21 个 block 全摊在首屏 scroll 里。任何把「无路径 = 0」读成交互假设成立的结论都是越界。
2. **可达性脚本不在仓库**：`results/structural-reachability.txt` 是可复现性检查（`validation-checklist.md` §5.1）的
   唯一凭据，但生成它的脚本文件与逐字命令行都没有留下来。
3. **元素数贴上限 12**：自查已报 Warning；判据 C（删掉会破坏对架构的理解）是主观判定，16 条淘汰里有 6 条靠它。
4. **下游依赖的是修订后的规格**：F05 / F06 的 coverage 与判据口径建立在本轮回写的 F03 brief 上，
   与 F04 修复前的旧口径不兼容，复用旧结论前需先确认版本。

以上四点都不改变结构侧的 PASS，但都直接影响「F04 能否升级为 `passing`」以及后续 feature 对同一份 map 的复用判断。
