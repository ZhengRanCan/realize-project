# Feature 07 · 验收清单（reviewer 用）

> 判定基准：同目录 `README.md`（§14 Gate、§11 五类 Quality、§12 Validator Gaming）。

---

## 1. 前置条件

- [ ] Feature 09 已 Closed / `Gate = PASS`
- [ ] `node scripts/test-generate-framework-map.js` → **33/33 通过**（Gateway Safety）
- [ ] 五篇 Fixture 在位，D / E 为 F09 冻结副本（SHA256 与 F09 README 一致）
- [ ] `ai/framework-map-generation.prompt.md` 中**没有**任何一篇 Fixture 的 element / topic 示例

---

## 2. 产物安全（§3）

- [ ] `experiments/framework-map-generation/fixture-*/run-NN/` 每个 run 独立目录
- [ ] 存在任何 `latest-*.json` 之类会被覆盖的共享产物 → **FAIL**
- [ ] 每个完整 run 都有 `request.json` / `raw-response.txt` / `framework-map.json` / `check-map.txt` / `run-meta.json`
- [ ] 失败 run 的 `run-meta.json` 记录了 `status` 与 `error`
- [ ] 失败 run **没有**产生 `framework-map.json`
- [ ] 没有任何 run 目录内残留 `*.tmp.json`
- [ ] **无产物被失败请求覆盖**（抽查 sha：`run-meta.json.artifactSha256` 与文件实际 sha 一致）

---

## 3. 无自动修补（§7）

- [ ] 所有 `run-meta.json` 的 `repair` 均为 `"none"`
- [ ] HARD FAIL 的 run 里，`framework-map.json` 仍含导致 FAIL 的原始内容（没有被脚本"修正"）
- [ ] 抽查一个 run：`framework-map.json` == `raw-response.txt` 的格式化版本

---

## 4. 实验完整性与独立性（§9）

- [ ] 五篇 × 3 runs = 15 个正式 run
- [ ] 每个 run 的 `request.json.promptFingerprint` 一致（不一致 → 必须在 run-matrix 标出分界）
- [ ] 每篇 3 个 run 是独立调用（没有"看到上一次结果"的迹象：例如连续两次产物逐字节相同 → 需解释）
- [ ] 失败 run 未被删除，也没被"重跑到好看"替换
- [ ] 没有读取人工 candidate map / Gold / source code 的痕迹（产物里的用词若与人工图高度雷同，需核查）

---

## 5. Q1 Contract Validity（§11）

- [ ] run-matrix 给出每个 run 的 HARD / WARN / INFO 与状态
- [ ] **Hard-pass rate** 已计算（分母不含 EXCLUDED）
- [ ] HARD FAIL 的每条都列出了具体违反项（不是"FAIL"两字）
- [ ] WARN / INFO 逐条解释过（哪些是形态差异、哪些是真信号）

---

## 6. Q2 Semantic Faithfulness（§11 / 最重要之一）

- [ ] 每个 run 的每个 element 都能指到原文小节（抽查 ≥ 3 个 element/run）
- [ ] **Invented element** 计数
- [ ] **Invented relation** 计数
- [ ] **Wrong relation direction** 计数
- [ ] **Unsupported prerequisite** 计数（为画链而编造前置）
- [ ] **Wrong concept/state classification** 计数
- [ ] **contains / reference 混用** 计数
- [ ] 以上项若 > 0，已给出具体条目（不是只有数字）

---

## 7. Q3 Semantic Coverage（§11）

- [ ] `Framework Coverage` 与 `Navigation Coverage` **分开**报告
- [ ] 没有把两者合成一个百分比
- [ ] Navigation 的判据是 check-map 的 `N1~N3` 实际执行（`SKIPPED 0`）

---

## 8. Q4 / Q5 稳定性（§11）

- [ ] 每篇 Fixture 定义了 Semantic Anchors（依据人工分析建立）
- [ ] Anchors **没有**出现在 prompt 里（否则是泄漏）
- [ ] 给出每个 anchor 的 `n/3` stability
- [ ] 给出每次 run 的 topology class
- [ ] 特别回答：**D 是否出现被压成 chain 的 run**？**E 是否丢掉异常 / 人工介入路径**？

---

## 9. Validator Gaming（§12，独立判定）

- [ ] 逐 run 检查五类表现（乱用 `relates-to` / 造边消孤立 / 为压 12 删机制 / 用不准的 known role / 编 prerequisite）
- [ ] 有 gaming 的 run：**即使 `check-map = PASS`，Generation Quality 判 FAIL**，并写出证据
- [ ] 结论里没有出现"validator 全绿所以图是对的"这类推论

---

## 10. Stop Conditions（§16）

- [ ] 执行期间**没有**修改 `schema` / `check-map` / Contract
- [ ] 命中 Stop Conditions 的项已登记（第 7 类 element / 第 9 词 / qualifier 不够 / 新 Structured Constraint Gap / budget 反复超 / D-E topology 差异）
- [ ] 登记是"记录 + 继续测试"，没有边跑边改

---

## 11. Gate 判定（§14）

- [ ] 结论是 **PASS / PARTIAL PASS / FAIL / BLOCKED** 四选一（不是"基本通过"这类模糊词）
- [ ] `BLOCKED` 只用于 Gateway / provider / IO 原因（不得用于掩盖模型质量问题）
- [ ] 没有先写死百分比阈值（先采样后判断）
- [ ] §17 的四个问题**逐条**有明确答案

---

## 判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | §2–§11 全通过；Gate = PASS；四个最终问题都有清楚答案 |
| **ACCEPT WITH NOTES** | Gate = PARTIAL PASS，但已指出是哪一类文档、哪一种 failure、以及是否可修 |
| **REJECT** | §2 或 §3 有未通过项（产物安全 / 自动修补）；或 §9 发现 gaming 却仍判 PASS；或命中红线 |

**必须单独回一句：** `Gate = PASS` / `PARTIAL PASS` / `FAIL` / `BLOCKED`。
