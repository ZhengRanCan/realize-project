# Final Gate（F07 · Phase 3 结束后填）

> 状态：⏳ **未开始**
> 判定基准：`README.md` §14（Gate）、§11（五类 Quality）、§12（Validator Gaming）、§17（最终四问）。

---

## 1. Gate 判定

```text
Gate = （PASS / PARTIAL PASS / FAIL / BLOCKED —— 四选一）
```

### 逐条核对（PASS 的九个条件）

| # | 条件 | 判定 | 依据 |
|---|---|---|---|
| 1 | Gateway / IO 安全策略有效 | | `results/gateway-safety.md` |
| 2 | 15 个正式 run 均有完整产物记录 | | `results/run-matrix.md` |
| 3 | 无产物被失败请求覆盖 | | 抽查 `artifactSha256` |
| 4 | HARD failure rate 足够低 | | Hard-pass rate = __ / 15 |
| 5 | Navigation 无系统性 orphan | | 各 run `check-map.txt` 的 N1~N3 |
| 6 | 无系统性 relation misuse | | `results/semantic-review.md` |
| 7 | 无系统性 forced-chain | | `results/stability-analysis.md` |
| 8 | 核心 semantic anchors 跨 run 稳定 | | anchor 表 n/3 |
| 9 | D / E 两类极端文档没有明显退化 | | 同上 |

> ⚠️ 不要先写死百分比阈值：**先采样，再判断**。"足够低"要结合失败形态说明，不能只给一个数字。

---

## 2. Validator Gaming 是否出现（§12）

```text
出现 / 未出现
```

若出现：相关 run 的 Generation Quality 一律判 **FAIL**，即使 `check-map = PASS`。

| run | gaming 类型 | 证据 | 该 run 的 Generation Quality |
|---|---|---|---|
| | | | |

---

## 3. 四类文档的失败率排序

| 排名 | Fixture | 类型 | 主要失败形态 | 备注 |
|---|---|---|---|---|
| 1 | | | | 最容易生成失败 |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | 最稳定 |

---

## 4. Stop Conditions 命中登记（§16 · **只记录，不边跑边改**）

| 命中的现象 | 出现在哪几篇 / 哪几次 run | 是否稳定复现 | 是否登记为后续 Contract issue |
|---|---|---|---|
| 第 7 类 element 需求 | | | |
| 第 9 relation 需求 | | | |
| qualifier 不够 | | | |
| 新的 Structured Constraint Gap | | | |
| 12 budget 反复超出 | | | |
| D/E topology 与人工候选不同 | | | |

> 判据：**跨多篇 Fixture、跨多次运行都稳定暴露同一种缺陷**，才登记为 Contract issue。
> 单篇单次的失败按 **AI generation failure** 处理。

---

## 5. §17 最终四问（**必须有清楚答案**）

```text
1. AI 会不会稳定选对"什么值得成为 L0 element"？
   →

2. AI 会不会忠实表达原文关系，而不是为了画图或过 validator 编关系？
   →

3. 同一篇文档重复运行，核心设计语义是否稳定存在？
   →

4. Concept / Data / Process / ER / Runbook 五类文档中，哪一类最容易生成失败？
   →
```

---

## 6. 结论一句话

> （F07 结束时，用一句话说明：这条 `Document → AI → framework-map → validator` 的链，现在能不能用。）
