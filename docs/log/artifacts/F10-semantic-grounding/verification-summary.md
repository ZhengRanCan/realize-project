# F10 Verification Summary

本文件把 harness 接入前的 F10 验证记录整理成当前口径。原始记录保持原样，见
`results/stage-a-reliability.md`、`results/e1-diagnostic.md`、`results/e-repro-analysis.md`、`results/d1-regression.md`、
`results/selection-analysis.md`、`results/final-gate.md`、`results/cost-experiment.md`、`results/low-effort-verdict.md`、
`results/prompt-parity-audit.md`、`results/inventory-review.md`。

⚠️ 本 feature 的历史材料目录里**没有** `results/verification-output.txt`（也没有其它 `*-output.txt`，也没有 `drafts/`），
因此命令证据只能用 `results/*.md` 与 `execution-prompt.md` 的原始记录；本文件不补写任何没有出处的命令或结果。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `npm run f10:run`（历史写法 `node scripts/run-semantic-grounding.js --fixture d\|e`） | 未记录具体日期（归档日期 2026-09-26） | passed-with-warnings | 在 `experiments/semantic-grounding/` 下留下 15 个 run 目录（fixture-d run-01..04 · fixture-e run-01..11）；决定性样本 D/run-04（Stage A 136 条 → 13 elements · 12 edges · check-map HARD 0 · WARN 3 · INFO 25）与 E/run-04 → E/run-08（Stage A 95 条 → 12 elements · 8 edges · check-map HARD 0 · WARN 0）；check-map 全程 HARD 0，带 WARN 0–3 |
| `npm run f10:run -- --fixture e --stage b`（历史写法 `node scripts/run-semantic-grounding.js --fixture e --stage b --inventory …`） | 未记录具体日期（归档日期 2026-09-26） | failed | run-07 `finish_reason=length`（completion 65536 顶格 · reasoning 61261 · raw 10664，第二个分隔符未出现）；e/run-04 的 Stage B 在 `max_tokens_b=12288` 下 reasoning 吃满 12288、content 为 0。两条失败产物按「失败不覆盖」原样保留（`results/e-repro-analysis.md` §3 · `results/e1-diagnostic.md` §3） |
| `npm run test:grounding`（历史写法 `node scripts/test-semantic-grounding.js`） | 未记录具体日期 | passed | 48/48 通过，**零模型调用**；覆盖 A ok + B HTTP 503 / parse fail / 只返回一个块、malformed inventory 与 duplicate id 不许进入 Stage B、selection 少一条只报 integrity FAIL 不自动补、`--run` 撞车退出码 3 且既有产物字节未变（`execution-prompt.md` Phase 1d） |
| `npm run verify:harness` | 2026-09-27 | passed | harness 层证据；由主 agent 在收口时统一执行。结果见 `docs/progress.md` 的 "Latest harness gate" 一行 |

> 「未记录具体日期」是材料事实：`brief.md` / `execution-prompt.md` / `results/**` 都只记 run 编号与参数，不记日历日期；
> 表内唯一的日期来自 `docs/log/artifacts/legacy-feature-registry.md`（10 semantic-grounding = Completed / Closed，2026-09-26）。

## 关键指标

| 项 | 数字 | 出处 |
| --- | --- | --- |
| run 目录数 | 15（fixture-d run-01..04 · fixture-e run-01..11） | `experiments/semantic-grounding/**` |
| Stage A 条数 | D/run-01 154 · run-02 264 · run-03 289 · **run-04 136（0 格式缺陷）**；E/run-02 99 · **run-04 95**；E/run-09（low）51 | `results/stage-a-reliability.md` §1/§2.3 · `results/d1-regression.md` §1 · `results/e1-diagnostic.md` §1 |
| Stage A 失败 | 6 次实录中：d/run-02 shape-invalid（`S-152b`）· d/run-03 shape-invalid（S-135~138 缺 statement）· e/run-01 parse-failed（未转义 ASCII 双引号）· e/run-03 parse-failed（16386/16384 顶格、reasoning 14634） | `results/stage-a-reliability.md` §1/§2.1/§2.2 |
| Stage B 压缩 | D/run-04 **13 elements · 12 edges**（E5 失败样本 d/run-01 为 81 elements）；E/run-05 **13** · run-06 **13** · run-08 **12**（low run-10 / run-11 各 12） | `results/d1-regression.md` §1 · `results/e-repro-analysis.md` §1 · `results/final-gate.md` §3/§7 |
| E5 over-representation | `1:1 target 占比 42% → 13–32%`；`elements 81 → 12/13`；`max fan-in 8 → 14–17` | `results/final-gate.md` §3 |
| E 侧机制 anchor | F07 `0–1/3` → high 臂 4/4 有承载（bounded failure / abnormal / manual / privilege / invariant；`run-06` 显式写「仅管理员强制补偿」） | `results/e1-diagnostic.md` §1 · `results/e-repro-analysis.md` §1 · `results/final-gate.md` §3 |
| D 侧 | 12 个人工实体 **12/12**；边 = consumes 7 · produces 3 · relates-to 2；**depends-on 0 · 自环 0** | `results/d1-regression.md` §1/§2 · `results/final-gate.md` §4 |
| 归因计数（E 主样本） | `E1 = 0 · E2 = 0 · E3 = 0（anchor 级）· E4 未见 · E5 已被压住` | `results/final-gate.md` §3 |
| 成本（high → low） | Stage A completion 29812 → 6027（省 80%）· reasoning 20706 → 1508（省 93%）；Stage B 69436 → 26840（省 61%）· reasoning 58283 → 20125（省 65%） | `results/cost-experiment.md` §1 |
| Gate | `F10 Gate = PARTIAL PASS`（两阶段架构方向成立、E 侧机制保留成立；D 侧核心基础关系 E3 未关闭） | `results/final-gate.md` §0/§8 · `legacy-feature-registry.md` |

## 人工路径证据

- Phase 3 人工审计（DSH agent 执行、用户于 2026-09-26 记为 Completed / Closed）：先独立打开 `semantic-inventory.json`
  评价 Stage A，再逐条核 `map-selection.json` 的 disposition 与最终 map；抽样核实了关键词代理的假阳性
  （D 的 S-80/81/82/86 → `E-ExecutionEvidence` 经抽样确认属正确归属），所有 E3 判定都经过逐条抽样核实
  （`results/final-gate.md` §9）。
- E 侧 omitted 核查：`run-08` 的 6 条 omitted（S-15 / S-20 / S-39 / **S-40** / S-43 / S-91）全部可解释，无 E2；
  S-40 由用户裁决为不属于「不可以砍」五类，其机制另有 `E-07` / S-52 承载（`results/final-gate.md` §2）。
- D 侧裁决：用户接受「L0 不展开全部不变量」（progressive disclosure），但声明
  「接受 L0 不展开全部不变量 ≠ 接受核心基础关系从图上消失」→ D 侧基础关系 E3 保持未关闭、不用 prompt 打补丁
  （`results/d1-regression.md` §3）。
- 未完成的人工路径：`validation-checklist.md` 的全部复选框与判定表（ACCEPT / ACCEPT WITH NOTES / REJECT）无签署；
  原定 `D × 3 + E × 3 = 6` run 未按计划完成；`results/inventory-review.md` 仍标注「未开始」，Stage A 四项独立评价
  没有单独落盘。

## 已知偏差（显式登记，不阻塞归档但影响复用）

- **没有 `results/verification-output.txt`**：本 feature 的材料只有 `.md` 记录，命令输出以叙述 + 表格形式保存；
  这不是漏登记，是材料事实。同样的原因，`evidence.commands` 里没有 `npm run check-map` 之类的独立条目 ——
  它由 runner 写入每个 run 的 `check-map.txt`，结果只在 `results/**` 的表格里被引用。
- **`results/inventory-review.md` 是唯一未填的关键文件**：它仍是模板（「未开始」），所以 Stage A 的
  Recall / Precision / Granularity / Provenance quality 四维评价没有独立文档，只有 `results/final-gate.md` §9
  与 `results/cost-experiment.md` §2 的零散结论。
- **D 只有 1 个完整两阶段 run**（run-04），E 的多数 run 是单阶段或复用冻结 inventory（`--stage b`）；
  因此 D 侧的回归结论建立在 1 个样本上，E 侧的稳定性结论建立在 run-05/06 的两次复现上。
- **历史对照不可机械对照**：F07 没有 inventory，无法区分 E1/E2；且本轮审计的关键词代理不能用于 F07 对照
  （会把「只在 label 里出现」也算 ✅，而 F07 恰恰如此）—— F07 的数字必须沿用其语义评审的结构性口径
  （`results/final-gate.md` §5）。
- **产物跨多轮 prompt 修正**：Stage A/B 的 prompt 指纹在每个 run 的 `run-meta.json` 里记录（例如成本实验冻结的
  A `f94e6c00da1e` / B `8c3f0be2f676`）；引用 run 时必须连同指纹与参数一起报出，不同分界的 run 不是同一实验。

## Harness layer

- `npm run verify:harness` 结果见 `docs/progress.md` 的 "Latest harness gate" 一行（2026-09-27，主 agent 收口时执行）。
- 本 feature 为 `blocked`，`knownUnverified` 与 `humanReviewRequired` 均**非空**（见合同 frontmatter）；
  在 PARTIAL PASS 的处置被登记之前不得改为 `passing`。
