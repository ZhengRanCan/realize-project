# F06 Independent Review

- Status: `not_recorded`
- Reason: F06 在 harness 接入之前（2026-09-26）就已执行完毕。当时的审查路径是人工 reviewer 按
  `validation-checklist.md` 判定，而这份清单至今没有被签署（§1~§7 的复选框全部仍为空，§8 的最终判定栏为空）——
  因此本 feature **既没有 subagent 审查记录，也没有人工验收记录**；`legacy-feature-registry.md` 第 64 行只记到
  「Executed（待验收；含 F09 修复：H8/W7/W8、W4→I6、heading tree）」，Reviewer = 用户、Completed = `-`。
- Decision: 本 feature 目前是 `blocked`，其状态不依赖任何「已完成独立审查」的说法。这条偏差显式登记，
  避免后续把它误当成"已通过独立审查"或"已通过用户验收"。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 三个交付物本体（+ 单测） | `schema/framework-map.schema.json` · `scripts/check-map.js` · `docs/specs/framework-map-contract.md` · `scripts/test-check-map.js` |
| F06 实跑输出（修复前快照，2026-09-26 20:44） | `results/verification-output.txt` |
| 取舍与遗留清单 | `results/notes.md`（§2 三条核心设计 · §3 两处「validator 写得太死」 · §4 H7 待裁决 · §5 W4 低价值告警 · §7 遗留表） |
| 验收判据与最终判定栏（空白） | `validation-checklist.md`（§7 红线清单 · §8 `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`） |
| 开工检查第 2 项（未勾选） | `brief.md` §8（「03 §3~§6 自那以后没有再被修改」） |
| F09 的规则修复与复跑 | `docs/log/artifacts/F09-contract-adversarial-test/results/repair-round.md` · 同目录 `results/verification-output.txt`（29/29；A/B/C/D/E 五篇 HARD 0 且全 PASS） |
| F09 对每条 F06 规则的升降级建议 | `docs/log/artifacts/F09-contract-adversarial-test/results/rule-adjustments.md` |
| 提交级证据 | commit `102ccfc`（F06 契约三件套）· commit `48769ed`（F09 修复落入同一批文件） |

## Reviewer 视角下最需要留意的三点

1. **不能只看本目录就判 F06**：`results/` 是修复前快照（A/B/C、单测 19/19、`W4` 仍是 Warning），
   修复后的行为（29/29、`W4 → I6`、`H8` / `W7` / `W8`、heading tree）只记在 F09 的 `results/` 下，
   而 F06 侧没有对应的回归验收记录。
2. **`H7`（孤立元素判 HARD）是执行方主动请 reviewer 裁决的降级候选**：`results/notes.md` §4 写明
   「如果 reviewer 认为这不该是 Hard，可以降级为 Warning —— 它的确比『悬空引用』弱一档」，该裁决至今没有记录。
3. **三条「不要过度冻结」的核心检查是验收重点，但一条都没有被签署**：schema 无 `maxItems`、不扩关系词
   （仍 8 词 + `relates-to`，表外词 = HARD）、`role` 非 enum（未知 role 只出 Warning）目前只有执行方自述与单测用例支撑
   （`results/notes.md` §2 与 `results/verification-output.txt` 的 test-check-map 段），没有 reviewer 的确认。
