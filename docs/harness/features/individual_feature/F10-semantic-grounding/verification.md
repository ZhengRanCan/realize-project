# F10 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `npm run test:grounding` | yes | `docs/log/artifacts/F10-semantic-grounding/execution-prompt.md` Phase 1d（48/48 通过，零模型调用，command 历史写法为 `node scripts/test-semantic-grounding.js`） |
| L2 feature | `npm run f10:run`（Stage A：`--fixture d` / `--fixture e`） | yes | `docs/log/artifacts/F10-semantic-grounding/results/stage-a-reliability.md` §1（6 次 Stage A 逐次记录）· `results/d1-regression.md` §1（D/run-04 136 条）· `results/e1-diagnostic.md` §1（E/run-04 95 条） |
| L2 feature | `npm run f10:run -- --fixture e --stage b`（复用冻结 inventory） | yes | `results/e-repro-analysis.md` §1/§3（run-05 13 elements · run-06 13 · run-07 截断）· `results/e1-diagnostic.md` §2/§3 |
| L3 system | `npm run f10:run` 全链路 + runner 内置 `check-map` 输出 | yes | `results/final-gate.md` §3/§4（E/run-08 12 elements · check-map HARD 0 · WARN 0；D/run-04 13 elements · 12 edges · HARD 0 · WARN 3 · INFO 25） |
| L3 system | Semantic Audit 人工链路（Source→Inventory→Selection→Encoding） | yes | `results/low-effort-verdict.md`（run-10 的 state 丢失定位到 Stage B 编码；run-11 的 false-represented 被抓出）· `results/final-gate.md` §2 |
| Harness | `npm run verify:harness` | yes before `passing` | `docs/log/artifacts/F10-semantic-grounding/verification-summary.md` |

## Manual paths

- [x] Phase 3 人工审计（Stage A 独立评价 + Selection 逐条核对）：先打开 `semantic-inventory.json`，再核
      `map-selection.json` 的 disposition 与最终 map 是否真的承载该语义。E 的 6 条 `omitted` 全部逐条核实为合法
      omission，D 的 2 条 omission 为同义重复取舍（`results/final-gate.md` §2/§4）。
- [x] 悬案裁决：`run-08` 的 S-40（§5.2 证据留存规范）是否属于「不可以砍」五类 —— 用户裁决为不属于，
      其机制另有可验证承载（`E-07` / S-52）。
- [x] 用户裁决接受「L0 不展开全部不变量」的压缩取舍，但**不接受**核心基础关系从图上消失
      （`results/d1-regression.md` §3）；据此 D 侧 E3 保持未关闭。
- [ ] 用户尚未在 `validation-checklist.md` 上签署 ACCEPT / ACCEPT WITH NOTES / REJECT，也未登记
      Gate = PARTIAL PASS 的处置（接受 E3 转为已知限制，还是保留为未关闭项）。
- [ ] 原定的 `D × 3 + E × 3 = 6` 个新臂 run 未按计划完成；E 的 Stage A 独立四维评价没有落进
      `results/inventory-review.md`（仍标注「未开始」）。

## Blocked evidence

- 本 feature 当前为 `blocked`，**不是** `passing`：`docs/progress.md` 记为「E3 未关闭（Gate = PARTIAL PASS）；处置未登记」，
  因此不满足 passing 的条件（全部 Acceptance Criteria 勾选、`knownUnverified` 与 `humanReviewRequired` 为空）。
- 未关闭项与待裁决项逐条写在合同 frontmatter 的 `completionGate.knownUnverified`（E3 未关闭 · 跨文档类型结构保真未完全成立 ·
  Constraint Composition / Compression Gap）与 `completionGate.humanReviewRequired`（PARTIAL PASS 处置未登记 ·
  `validation-checklist.md` 无签署 · Stage A 四维评价未单独落盘）。
- 命令日期与结果记录在 `docs/log/artifacts/F10-semantic-grounding/verification-summary.md`；
  历史材料目录里**没有** `results/verification-output.txt`（也没有其它 `*-output.txt`），命令证据以 `results/*.md` 的原始记录为准。
- 本 feature 在 harness 接入前关闭，代码有变更（两阶段 runner、离线测试、两份 prompt、两份 schema）但没有留下独立
  subagent 审查记录；补偿方式与可复核证据位置见 `docs/log/artifacts/F10-semantic-grounding/subagent-review.md`。
