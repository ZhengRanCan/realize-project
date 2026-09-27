# Feature 07 · 执行任务书（executor 用）

> 定位、G1–G7、五类 Quality、Gate 见同目录 `README.md`（下文 §编号均指该文件）。
> **本文件的顺序是强制的：Phase 1 未通过不得进入 Phase 2；Phase 2 未通过不得进入 Phase 3。**

---

## 0. 开工检查

```text
[ ] Feature 09 已 Closed / Gate = PASS（Contract v1 定稿）
[ ] schema/framework-map.schema.json + scripts/check-map.js 可用（含 heading tree 与 qualifiers）
[ ] 五篇 Fixture 在位，D / E 为 F09 冻结副本
[ ] 上游网关可用（但仍必须假设它会失败 —— 这正是 Gateway Safety 的意义）
```

**开工前先跑一次离线安全验证：**

```bash
node scripts/test-generate-framework-map.js
```

必须 **33/33 通过**。不通过就先修安全协议，**不要调用模型**。

---

## Phase 1 · Prompt + Generator Harness（已完成，可复核）

```bash
node scripts/test-generate-framework-map.js     # 离线，零模型调用
```

复核点：

```text
[ ] 失败请求不会覆盖任何既有产物（★ 标记的断言）
[ ] validator FAIL 的产物被完整保留
[ ] 产物结构不可校验时也不崩溃、原样保留
[ ] framework-map.json 与 raw response 逐字节一致（无自动修补）
[ ] run 目录严格独立，--run N 撞车时拒绝覆盖
```

---

## Phase 2 · 单 Fixture Smoke Test（1 次真实调用）

**目的不是评价质量，只验证工程链。**

```bash
node scripts/generate-framework-map.js --fixture a
```

检查（全部读产物，不读 stdout）：

```text
[ ] experiments/framework-map-generation/fixture-a/run-01/ 五个文件齐全
[ ] run-meta.json.protocol 六步全 true
[ ] run-meta.json.repair === "none"
[ ] check-map.txt 有完整的 HARD / WARN / INFO / 状态
[ ] 没有 .tmp.json 残留
```

**若 Gateway / IO 仍不稳定（连续失败、超时、产物异常）：停止，不进入 Phase 3。**
此时按 §14 记为 `BLOCKED`（仅限这个原因），并在 `results/gateway-safety.md` 追加实际故障记录。

---

## Phase 3 · 五 Fixture 正式生成（15 runs）

```bash
# 每篇 3 次独立调用；不要并行覆盖同一 run 编号
for f in a b c d e; do
  node scripts/generate-framework-map.js --fixture $f
  node scripts/generate-framework-map.js --fixture $f
  node scripts/generate-framework-map.js --fixture $f
done
```

**独立性要求（每次调用之间不得互相影响）：**

```text
[ ] Run 2 看不到 Run 1 的产物（生成器本身不读取同 fixture 的历史产物）
[ ] 任何 run 都不读取人工 candidate map / Gold / 其它 Fixture
[ ] 任何 run 都不读取 source code / verification.md（F09 §3.6 信息面原则）
```

执行时要盯的四类失败（**都要如实记录，不许重跑到好看**）：

```text
transport / http        → 该 run 记 EXCLUDED（产物不完整），并在 run-matrix 备注
parse-failed            → 保留 raw-response.txt，计入 Q1 的分母
HARD FAIL               → 保留全部产物，进 run-matrix
结构不可校验            → 同上（"AI 返回了合法 JSON 但不是 map"）
```

失败 run **不得**删除、不得覆盖、不得重跑后只留成功那次。

---

## Phase 4 · 五类 Quality 判读

### 4.1 run-matrix（`results/run-matrix.md`）

每个 run 一行：fixture · run · 状态 · HARD/WARN/INFO · elements/edges/attachments/topics · relationGap · gapDensity · topology class · validator status。
另附 **Hard-pass rate**（`HARD = 0 的 run 数 / 完整 run 数`，分母不含 EXCLUDED）。

### 4.2 semantic review（`results/semantic-review.md`）

**这一步必须人工读原文**，不能只看 JSON。逐 run 判：

```text
[ ] 每个 element 都能在原文里指出出处？
[ ] 每条 edge 的方向与原文一致？
[ ] 有没有 Invented element / relation / wrong direction / unsupported prerequisite？
[ ] concept vs state 分类是否正确？
[ ] 有没有 contains / reference 混用？
[ ] 有没有 Validator Gaming（§12）？—— 这一项单独列，**PASS 也要查**
```

### 4.3 stability analysis（`results/stability-analysis.md`）

先为每篇 Fixture 定 **Semantic Anchors**（只用于事后评价，**不得提供给生成模型**），再统计 3 次 run 的承载情况：

```text
anchor 表：anchor 名 · run-01 · run-02 · run-03 · stability（n/3）
拓扑表：  topology class 逐 run · 是否出现 forced chain
```

### 4.4 final gate（`results/final-gate.md`）

按 README §14 判定，并**逐条回答 §17 的四个问题**。
只有这四个问题都有清楚答案，F07 才算完成。

---

## 硬约束（违反即实验作废）

```text
❌ 不修改 schema / check-map / Contract（Stop Conditions 只记录，不边跑边改）
❌ 不修改 prompt 后重跑同一 run 编号（prompt 指纹变了就是另一次实验，必须换 run）
❌ 不删除任何失败产物
❌ 不把 validator 结果当成语义正确的证据
❌ 不用 check-map PASS 掩盖 Validator Gaming
```

**prompt 指纹纪律：** 每次 run 的 `request.json` 记了 `promptFingerprint`。
若中途改了 prompt，**之前所有 run 与之后的 run 不是同一实验** —— 必须在 run-matrix 里标出分界，并说明原因。
