# F07 Verification Summary

本文件把 harness 接入前的验证记录整理成当前口径。原始输出保持原样，见
`results/gateway-safety-output.txt`、`results/phase3-artifact-check.txt`、`results/gateway-safety.md`、
`results/phase2-smoke-test.md`、`results/run-matrix.md`、`results/semantic-review.md`、
`results/stability-analysis.md`、`results/final-gate.md`。
（历史材料里引用的 `README.md` 指本目录现在的 `brief.md`；命令输出中的路径属规范化前记录，照实引用，未改写。）

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `node scripts/test-generate-framework-map.js` | 2026-09-26 | passed | Gateway / 产物安全验证 **33/33 通过**（离线 stub 注入六类情形，**零模型调用**）；★ 断言确认 503 / 传输失败 / 解析失败 / 结构不可校验 / 被拒绝的重跑都不会改动 run-01 的成功产物；`repair` 全 none、无 `.tmp.json` 残留 |
| `node scripts/generate-framework-map.js --fixture a` | 2026-09-26 | passed | Phase 2 单 Fixture smoke test（Fixture A，`测试文档/18-context-consumption-semantic-model.md`）：工程链八步全 true、`finish_reason: stop`、attempts 1、93.3s、五件产物齐全；`check-map PASS`（HARD 0 / WARN 2 / INFO 3、coverage 15/15）；**参数偏差**：因 `--max-tokens` 被静默忽略，实际 `max_tokens = 32000`（run-meta 如实记录） |
| `node scripts/generate-framework-map.js --fixture {a..e}`（15 次正式调用） | 2026-09-26 | passed-with-warnings | Phase 3：Technical PASS 15/15、`HARD 0`、零传输 / HTTP / 解析失败、零截断、`repair != none` 为 0；统一 `t1 / mt65536 / att1`、prompt 指纹 `295e9c9923b330f3`、provider `deepseek` / model `deepseek-flash`。**WARN 0–5/run**（W1 element>12 共 14/15、W3 Topic>10 共 11/15、W6 relates-to>1 共 3/15、W2 未知 role 1/15、W5 relationGap 6/15） |
| `node tmp/verify-f07-phase3.js` | 2026-09-26T14:11:16Z | passed | 产物完整性：16 个 run 五件套齐全、`generationParams` / provider / `promptSha256` / 每篇 `documentSha256` 唯一、`artifactSha256` 与实际文件**逐一致**、无 `.tmp.json` 残留、`repair` 全 none、run 编号单调无复用。结论行：`结果: 全部通过（无覆盖、无篡改、无残留、无修补）` |
| `npm run verify:harness` | 2026-09-27 | passed | harness 层门禁（由主 agent 在收口时统一执行；合同 frontmatter 的 `evidence.lastVerifiedAt` 取此日期） |

> 分析脚本（临时工具，非交付物）：`tmp/build-f07-matrix.js`（汇总 `run-matrix.md`）、`tmp/verify-f07-phase3.js`
> （产物完整性核查）。两者均为只读分析器，不改任何产物。
> ⚠️ 本轮**未运行**任何 `npm run ai:*` / `ai-block` / `generate-framework-map` 命令来"补齐证据"；
> 上表的生成命令结果全部来自 2026-09-26 已提交的产物记录（提交 `8ea2efc` / `eb5b652` / `de6ff48`）。

## 关键指标

| 指标 | 值 | 出处 |
| --- | --- | --- |
| 完整 run | 16（15 正式 + 1 参数偏差样本 a/run-02） | `results/run-matrix.md` §2、`results/phase3-artifact-check.txt` |
| Technical PASS | **15 / 15（100%）** | `results/final-gate.md` §3 |
| `HARD = 0` 的 run | 16 / 16（Hard-pass rate = 100%，分母不含 EXCLUDED） | `results/run-matrix.md` §2 |
| **Semantic PASS** | **0 / 15**（Semantic PARTIAL 5 / FAIL 10） | `results/final-gate.md` §3 |
| validator FAIL / 非 success / `finish_reason != stop` | 0 / 0 / 0 | `results/phase3-artifact-check.txt` §6 |
| completion tokens 合计 | 408,550（其中 reasoning 338,693 ≈ **83%**） | `results/run-matrix.md` §2、`results/phase3-artifact-check.txt` §6 |
| 单 run completion 最大值 | 40,419（对照 `max_tokens` 65,536） | `results/phase3-artifact-check.txt` §6 |
| 产物覆盖 / 篡改 / `.tmp` 残留 / 自动修补 | 0 / 0 / 0 / 0 | `results/phase3-artifact-check.txt` |
| `§14` PASS 九条 | 满足 6 条；**条件 6 / 8 / 9 未满足** | `results/final-gate.md` §1 |
| Anchor 稳定率（3/3 计） | A 4/6 · B 3/6 · C 3/6 · D 3/7 · **E 0/6** | `results/stability-analysis.md` §1 |
| A 类机制 anchor 承载 | A5 element/relation 承载 **0/3**（仅 Topic 命题 3/3）、A6 **1/3** | `results/stability-analysis.md` §1 |
| E 类机制 anchor 承载 | A2 / A3 / A4 / A5 全部 **0/3** | `results/stability-analysis.md` §1 |
| **Gate** | **PARTIAL PASS**（不是 PASS、不是 FAIL、不是 BLOCKED） | `results/final-gate.md` §0 / §8 |

## 人工路径证据

- **Q2 Semantic Faithfulness（人工读原文）**：5 篇 fixture × 3 run 逐 run 判读，每条判断指回原文行号或产物 label；
  结论 **0/15 达到完整语义忠实**。见 `results/semantic-review.md`。
- **Validator Gaming（§12 独立判定）**：预设五类中 ①乱用 `relates-to`（D/run-01、run-02）、③为压 12 删机制（E/run-02）、
  ④语义不准的 known role（E/run-02 用 `role: "current"` 6 次、D/run-01 用 `"constraint"`）、⑤编造 prerequisite
  （D/run-01、B/run-02）命中；另有预设外形式 ⑥ `relationGap` 被当作不受检表达位（C/run-03 自环）、
  ⑦ `edge.label` 承载图上不存在的主体或规则。按 §12 命中即判 Generation Quality FAIL。见 `results/final-gate.md` §2。
- **Q4 / Q5 稳定性**：Anchors 只用于事后评价、**从未进入 prompt**（`results/stability-analysis.md` 开头纪律）；
  D 三次都保住 network 形态与自环边（未被压成链）；E 三次都未退化成纯 happy path，但**没有一次把失败路径建模**。
- **未完成的人工路径**：用户尚未在 `validation-checklist.md` 上签署 ACCEPT / ACCEPT WITH NOTES / REJECT，
  也未单独回一句 Gate 判定；Phase 2 提出的 `max_tokens` 裁决没有书面记录（Phase 3 实际按 65536 执行）。

## 已知偏差（不阻塞本轮记录，但阻塞 `passing`）

- **Semantic 维度 0/15** —— 这是本 feature 无法 `passing` 的直接原因；`HARD 0` 只说明 Contract 合法，不说明图是对的。
- **E（Operational Runbook）明显退化**：机制 anchor 0–1/3、无任何 3/3 锚点、粒度三变、跨 run 无稳定核心节点；
  **D 反而是最成功的一类**（不要混为一谈）。
- **relationGap 漏登**：人工登记的真 gap 在 B / C / E 三篇均 0/3 复现。
- **参数不统一**：`a/run-02` 用 `max_tokens = 32000`（`--max-tokens` flag bug），Phase 3 的 15 个正式 run 用 `65536`。
- **Stop Conditions 命中未修**：12 budget 反复超出 14/15、第 9 relation 需求、新的 Structured Constraint Gap、
  E 的拓扑与人工候选不同 —— 只登记为后续 Contract issue，本轮未改 schema / check-map / Contract / prompt。
- **UNCLEAR 保留**：思维链未落盘（reasoning 占 83%），意图无法判定；所有 gaming 判定仅基于产物形态。

## Harness layer

- `npm run verify:harness` 由主 agent 在收口时统一执行（2026-09-27），命令与日期见上表 "Commands"；
  本轮为登记，不在本文件内重复粘贴输出。
- 本 feature 标为 `blocked`，因此不要求 `knownUnverified` / `humanReviewRequired` 为空；
  这两组条目见 `docs/harness/features/individual_feature/F07-ai-framework-map-generation/feature.md`。

## 实验产物

`experiments/framework-map-generation/fixture-{a..e}/run-NN/` 共 **16 个 run**，逐条登记在 `experiments/index.json`
（`perFeature.F07`；每个单元带 `fixture` / `status` / `validator` / `prompt` / `model`）。

注意 `fixture-a/run-02` 用的是 `max_tokens = 32000`（flag bug），与其余 15 个 run 的 65536 不同 —— 引用统计数字时要分开看。
索引与校验：`npm run index:experiments` / `npm run check:experiments`。
