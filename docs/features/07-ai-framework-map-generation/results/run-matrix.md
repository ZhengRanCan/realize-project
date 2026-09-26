# Run Matrix（F07 · Phase 3）

> 数据**只从产物文件读**（`run-meta.json` / `check-map.txt` / `framework-map.json`），不靠记忆。
> 汇总脚本：`tmp/build-f07-matrix.js`（分析器，不改任何产物）。

## 0. Phase 2 smoke test（**不计入** 15 runs）

| Fixture | Run | 状态 | HARD | WARN | INFO | 参数 | elements | edges | attach | topics | relationGap | validator | coverage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | run-02 | success | 0 | 2 | 3 | t1/mt**32000**/att1 | 15 | 9 | 4 | 5 | 1 | PASS | 15/15 |

参数偏差（**必须记录**）：该 run 因 harness 的 `--max-tokens` flag bug，实际使用 `max_tokens = 32000`（约定值 8000 未生效）。
详见 `phase2-smoke-test.md` §4.1 与 §5。**Phase 3 的 15 次 run 全部使用 `max_tokens = 65536`，与它不同。**

> `fixture-a/run-01` 曾由一个被保险拦截的调用创建为空目录（0 文件），**已删除**；
> run 编号自修复后单调递增（max+1），故 Phase 2 落在 run-02，Phase 3 从 run-03 起。

## 1. Phase 3 逐 run（15 次正式调用）

| Fixture | Run | 状态 | HARD | WARN | INFO | elements | edges | attach | topics | relationGap | types | coverage | 结构指标 (maxIn/out · conv/div/self) | latency | completion(reasoning) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | run-03 | success | 0 | 4 | 4 | 14 | 5 | 8 | 7 | 3 | state/concept/artifact/process/constraint | 15/15 | in1/out1 · conv0/div0/self0 | 86s | 22268(18501) |
| a | run-04 | success | 0 | 1 | 2 | 15 | 9 | 7 | 6 | 0 | state/artifact/process/concept/constraint | 15/15 | in2/out2 · conv2/div2/self0 | 89s | 23334(19216) |
| a | run-05 | success | 0 | 3 | 4 | 16 | 7 | 9 | 7 | 2 | state/process/artifact/concept/constraint | 15/15 | in2/out2 · conv1/div1/self0 | 80s | 20727(16711) |
| b | run-01 | success | 0 | 0 | 4 | 12 | 12 | 3 | 5 | 0 | process/artifact/constraint | 13/13 | in3/out5 · conv3/div2/self0 | 70s | 17939(14578) |
| b | run-02 | success | 0 | 1 | 13 | 14 | 18 | 2 | 10 | 0 | process/artifact/constraint | 13/13 | in4/out4 · conv5/div5/self0 | 151s | 40419(36289) |
| b | run-03 | success | 0 | 2 | 9 | 18 | 15 | 5 | 10 | 0 | process/artifact/concept/constraint | 13/13 | in4/out3 · conv3/div2/self0 | 103s | 27680(23659) |
| c | run-01 | success | 0 | 3 | 18 | 18 | 18 | 4 | 15 | 0 | artifact/process/concept/constraint | 19/19 | in4/out3 · conv4/div5/self0 | 98s | 26599(22312) |
| c | run-02 | success | 0 | 3 | 4 | 17 | 18 | 2 | 12 | 1 | artifact/process/concept/constraint | 19/19 | in4/out3 · conv4/div5/self0 | 97s | 25411(20685) |
| c | run-03 | success | 0 | 3 | 7 | 16 | 16 | 2 | 12 | 1 | process/artifact/concept/constraint | 19/19 | in2/out3 · conv5/div4/self0 | 88s | 23168(18925) |
| d | run-01 | success | 0 | 5 | 18 | 23 | 39 | 5 | 15 | 1 | artifact/process/constraint | 21/21 | in8/out6 · conv7/div12/self1 | 103s | 27882(21489) |
| d | run-02 | success | 0 | 3 | 23 | 22 | 30 | 3 | 19 | 0 | artifact/process/constraint | 21/21 | in7/out5 · conv5/div6/self1 | 94s | 26343(20527) |
| d | run-03 | success | 0 | 2 | 16 | 25 | 29 | 7 | 15 | 0 | artifact/process/constraint | 21/21 | in9/out6 · conv5/div8/self1 | 124s | 35600(29113) |
| e | run-01 | success | 0 | 2 | 15 | 16 | 15 | 3 | 11 | 0 | process/artifact/constraint | 11/11 | in7/out3 · conv3/div3/self0 | 114s | 29544(25254) |
| e | run-02 | success | 0 | 2 | 15 | 12 | 11 | 3 | 11 | 1 | process/artifact/constraint | 11/11 | in2/out6 · conv3/div1/self0 | 43s | 10953(8294) |
| e | run-03 | success | 0 | 2 | 15 | 16 | 14 | 4 | 11 | 0 | concept/state/process/artifact/constraint | 11/11 | in3/out4 · conv5/div3/self0 | 99s | 26792(23163) |

## 2. 汇总

```text
完整 run                 16（15 正式 + 1 参数偏差样本）
HARD = 0                 16 / 16          → Hard-pass rate = 100%
validator FAIL           0
传输 / HTTP / 解析失败    0
截断（finish_reason=length）0
repair != none           0
参数一致性               Phase 3 全部 t1 / mt65536 / att1（a/run-02 除外）
prompt 指纹              全部 295e9c9923b330f3（未中途改 prompt）
provider / model         全部 deepseek / deepseek-flash
completion tokens 合计   408,550（其中 reasoning 338,693 ≈ 83%）
```

**参数一致的证据：** 15 个 run 的 `generationParams` 完全相同，`promptSha256` 与 `documentSha256` 逐 run 可核。
（取样核对：`docs/features/07-ai-framework-map-generation/results/phase3-artifact-check.txt`）

## 3. WARN 分布（**这是本轮最结构化的信号**）

| 告警 | 触发 run 数 | 含义 |
|---|---|---|
| **W1** element > 12 | **14 / 15** | AI **系统性地不压缩**到 preferred budget |
| **W3** Topic > 10 | **11 / 15** | Topic 数普遍偏高（c/d/e 全部触发） |
| **W6** `relates-to` > 1 | 3 / 15（b/run-03 · d/run-01 · d/run-02） | 兜底词被当万金油使用 |
| **W2** role 未知 | 1 / 15（c/run-01） | controlled-but-extensible 的未知取值 |
| **W5** relationGap | 6 / 15 | 缺口登记较少（0–3 条） |

逐 run 告警种类：

```text
a/run-03 W1,W5   a/run-04 W1         a/run-05 W1,W5
b/run-01 （无）  b/run-02 W1         b/run-03 W6,W1
c/run-01 W2,W1,W3  c/run-02 W1,W3,W5  c/run-03 W1,W3,W5
d/run-01 W2,W6,W1,W3,W5  d/run-02 W6,W1,W3  d/run-03 W1,W3
e/run-01 W1,W3   e/run-02 W3,W5      e/run-03 W1,W3
```

> ⚠️ **Stop Condition 命中**：`12 budget 反复超出`（14/15）。按任务书 §16：
> **只记录，不修改 budget**。它是否算"Contract 缺陷"要看语义评审结果（见 `semantic-review.md`）。

## 4. 同一 Fixture 内的跨 run 变异

| Fixture | elements | edges | topics | relationGap | 人工 candidate map 规模 |
|---|---|---|---|---|---|
| a | 14 / 15 / 16 | 5 / 9 / 7 | 7 / 6 / 7 | 3 / 0 / 2 | 12 / 4 / 5 |
| b | 12 / 14 / 18 | 12 / 18 / 15 | 5 / 10 / 10 | 0 / 0 / 0 | 12 / 6 / 5 |
| c | 18 / 17 / 16 | 18 / 18 / 16 | 15 / 12 / 12 | 0 / 1 / 1 | 12 / 8 / 6 |
| d | 23 / 22 / 25 | 39 / 30 / 29 | 15 / 19 / 15 | 1 / 0 / 0 | 12 / 11 / 7 |
| e | 16 / 12 / 16 | 15 / 11 / 14 | 11 / 11 / 11 | 0 / 1 / 0 | 13 / 9 / 8 |

**读法（不作结论，结论见 stability-analysis.md）：**

```text
· a 的 edges 5→9→7 波动大，e 的 elements 16→12→16 波动大
· e 的 topics 三次都是 11（数量稳定）
· d 稳定"大"：22–25 elements、29–39 edges（人工 12/11）
```

## 5. 结构指标（原始值，避免只给分类名）

`maxIn/maxOut` = 归一化（`consumes` 反向）后的最大入/出度；`conv/div` = 入度>1 / 出度>1 的节点数；`self` = 自环边数。
**D 的三次 run 都保留了自环边**（Task 依赖图），且 conv/div 都很高 → 未被压成链。

## 6. 使用说明

- 本表**只有工程与结构数据**；"图对不对"在 `semantic-review.md`，跨 run 稳定性在 `stability-analysis.md`。
- 拓扑分类名是启发式，**以 §5 的原始指标为准**。
