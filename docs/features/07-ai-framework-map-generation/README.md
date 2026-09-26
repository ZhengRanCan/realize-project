# Feature 07: AI Framework Map Generation

> **状态**：🟢 **Ready → Phase 1 进行中**（Gateway Safety 已完成并通过，见 `results/gateway-safety.md`）
> **前置**：Feature 09 `Gate = PASS`（Contract v1 定稿）；Feature 06 的 `schema` + `check-map` 可用
> **位置**：生成链路。本轮**不设计** Framework Map，只验证 AI 能否稳定、忠实地生成它。

---

## 1. 目标

验证下面这条链是否成立：

```text
Technical Design Document
        ↓
AI Framework Map Generation
        ↓
framework-map.json
        ↓
framework-map.schema.json
        ↓
check-map
        ↓
Renderer / Preview
```

**核心问题只有一个：**

> 给 AI 一篇此前已经人工理解过的技术文档，它能否**稳定生成符合 Contract、忠于原文、不过度推断、不过度串链**的 L0 Framework Map？

本 Feature **不再验证 Framework Map Contract 本身是否合理** —— F09 已完成，`Gate = PASS`。

---

## 2. 不做什么

```text
❌ 不新增第 7 类 element
❌ 不扩 relation vocabulary
❌ 不修改 qualifiers 设计
❌ 不设计 constraint DSL
❌ 不修改 12 element preferred budget
❌ 不重新设计 Topic / L0 / L1 架构
❌ 不要求 AI 输出 HTML
❌ 不修改 renderer 视觉语言
❌ 不开始 L2 自动生成重构
❌ 不因为 AI 生成失败而修改 Contract 迁就模型
```

**如果生成结果违反现有 Contract：先把它视为 AI generation failure，而不是 Contract failure。**

只有当**跨多篇 Fixture、跨多次运行**都稳定暴露同一种 Contract 缺陷时，才登记为后续 Contract issue。**本 Feature 内不直接修改 Contract。**

---

## 3. 前置条件：Gateway 产物安全（**已完成**）

> 第一次正式 run 之前必须先保证：**模型调用失败不能覆盖上一份成功产物。**
> 之前出现过 503 覆盖既有产物的事故（Feature 01 的 O-16），这次先堵住。

### 3.1 每次运行独立目录

```text
experiments/framework-map-generation/
├── fixture-a/
│   ├── run-01/
│   │   ├── request.json          请求元数据（模型 / prompt 指纹 / 文档 sha / 结局；不含 key）
│   │   ├── raw-response.txt      AI 返回的 content 原文，未清洗
│   │   ├── framework-map.json    仅经"成功写入协议"产生
│   │   ├── check-map.txt         validator 输出（PASS 或 FAIL 都保留）
│   │   └── run-meta.json         状态 / 协议步骤 / 产物 sha / validator 摘要
│   ├── run-02/
│   └── run-03/
└── fixture-e/
```

**不得**直接写 `latest-framework-map.json` 然后让失败请求覆盖它。

### 3.2 成功写入协议

```text
AI response received
    ↓
response parse success
    ↓
framework-map JSON parse success
    ↓
write temp file（framework-map.tmp.json）
    ↓
read-back parse success
    ↓
原子 rename → framework-map.json
```

任何一步失败：**保留 raw response、保留错误信息、不得覆盖既有成功文件。**

### 3.3 Validator FAIL 的文件也必须保留

```text
AI 成功返回 + JSON 可解析 + check-map HARD FAIL
```

**这不是垃圾产物，这是 F07 最重要的实验数据之一。必须原样保存。**

### 3.4 验证方式：离线 stub（零模型调用）

`scripts/test-generate-framework-map.js` 用 stub 注入六类情形，证明上述规则成立。
结果：**33/33 通过** → `results/gateway-safety.md`。

---

## 4. 输入 Fixture

| Fixture | 类型 |
|---|---|
| A | Concept / Architecture heavy |
| B | Data / transformation heavy |
| C | Process heavy |
| D | ER-heavy / multi-entity network |
| E | Operational Runbook |

**D / E 必须严格使用 F09 冻结的测试副本**（`测试文档/fixture-d-*.md` · `测试文档/fixture-e-*.md`）。

### 信息面原则

生成 Framework Map 时，**AI 只能读取当前 Fixture 本身**。不得读取：人工 candidate map · Gold map · supporting document · source code · `verification.md` · 其它 Fixture · 旧 AI 输出。

尤其 D / E 必须继续遵守 F09 §3.6：**Modeling Input Boundary —— 资格审查与建模使用同一信息面。**

---

## 5. AI 的任务边界

Prompt **不应该**教 AI"某篇文档应该有哪些节点"，也**不能**包含 A/B/C/D/E 的实际 Topic / element 示例作为模板。

Prompt 只提供：

```text
Contract · 允许的 6 类 element · role 规则 · edge vocabulary · qualifier 规则
constraint 规则 · attachment 规则 · Topic 与 element 解耦 · provenance 要求
preferred budget · navigation invariants
```

**AI 必须自己从文档推导：**

```text
Document → 核心设计对象 → 主要关系 → 需要侧挂的 concept / constraint / state
        → Topics → Navigation → Framework Map
```

---

## 6. 生成纪律 G1–G7（Prompt 中写成强规则）

```text
G1  不为凑图制造元素
    不能因为 component = 0 / state = 0 就制造节点。

G2  不强制生成主轴
    文档天然是 DAG / star / 实体网络 / 分叉流程，就保留原拓扑。
    禁止为了"图看起来漂亮"压成 A → B → C → D。

G3  不制造原文没有的依赖
    文档没有声明 A 是 B 的前置条件，就不能因为阅读顺序画 A → B。
    尤其警惕：章节先后 ≠ 依赖关系。

G4  Relation 三层原则（F09 冻结）
    Edge 描述基础关系；qualifier 描述关系结构属性；
    constraint 描述不能自然还原成一条 edge 属性的业务不变量。
    禁止发明 acyclic-depends-on 这类词。

G5  contains ≠ references
    只是引用时不得用 contains。

G6  不为了消灭 relationGap 误用动词
    允许 relationGap 存在。禁止把它硬塞进 depends-on / contains / controls / relates-to。
    忠实表达 > gap 数量漂亮。

G7  Provenance 必须来自当前文档
    不能写空 sectionRefs，也不能引用不存在的小节。
```

---

## 7. Phase 1 — Prompt + Generator Harness

```text
document → prompt → AI → raw response → framework-map.json → schema → check-map
```

交付物：

```text
ai/framework-map-generation.prompt.md    生成 prompt（只含 Contract 与纪律）
scripts/generate-framework-map.js        generator
scripts/test-generate-framework-map.js   离线产物安全验证
```

### Generator 不负责修结果

第一版**禁止**：

```text
AI 输出非法 relation   → 脚本自动替换成 relates-to     ❌
13 elements            → 脚本自动删一个                ❌
provenance 空          → 脚本自动补上                  ❌
```

Generator 只做：**请求 → 解析 → 保存 → 验证 → 报告**。不要偷偷 repair，否则无法判断 AI 的实际能力。
（`run-meta.json` 固定写 `repair: "none"`，并记录产物 sha 供事后核对。）

### 退出码约定

```text
0  run 已记录，且 check-map PASS
1  run 已记录，但 check-map HARD FAIL（产物仍然完整保留）/ 产物结构不可校验
2  传输 / HTTP / 解析失败（没有 framework-map.json）
3  拒绝覆盖：目标 run 目录已存在
4  用法 / 凭据错误
```

---

## 8. Phase 2 — 单 Fixture Smoke Test

先只跑 **Fixture A 一次**。目的不是评价质量，只验证工程链：

```text
请求成功 · raw response 保存 · JSON 解析 · schema 执行 · check-map 执行 · 失败不覆盖 · read-back 正常
```

**如果 Gateway / IO 仍不稳定：停止，不进入多 Fixture 测试。**

---

## 9. Phase 3 — 五 Fixture 正式生成

A/B/C/D/E 每篇至少 **3 independent runs**，总计 **5 × 3 = 15 runs**。

每次必须独立调用。**禁止**：Run 2 看到 Run 1、Run 3 看到 Gold。

目标是测**模型稳定性，而不是 self-repair 能力**。

---

## 10. 不比较 ID / 名字完全一致

不要求 `E-01` 一致、topic 数量一致、标题逐字一致、元素顺序一致。

---

## 11. 五类 Generation Quality

### Q1 Contract Validity

每个 run：schema valid? · HARD = 0? · WARN? · INFO?
核心指标：**Hard-pass rate**（例如 13 / 15 runs HARD = 0）。

### Q2 Semantic Faithfulness

人工检查图上的 element / edge / constraint 是否真的来自原文。重点统计：

```text
Invented element · Invented relation · Wrong relation direction · Unsupported prerequisite
Wrong concept/state classification · contains/reference confusion
```

**这是 F07 最重要的指标之一。**

### Q3 Semantic Coverage

不要求 L0 表达全文。而是：每次生成是否覆盖该文档的核心 Framework 语义，并通过 Navigation 将剩余重要区域保持可达？

```text
Framework Coverage  ≠  Navigation Coverage    ← 禁止重新混成一个 coverage
```

### Q4 Cross-run Semantic Stability

为每篇 Fixture 人工定义少量 **Semantic Anchors**（依据已有人工分析建立，**只用于事后评价，不提供给生成模型**）。

统计每个 anchor 在 3 次 run 中是否都有合理承载 → `semantic stability = 3/3`。

### Q5 Structural Stability

观察而非要求完全一致：Topology class · 核心节点是否稳定 · 核心关系是否稳定 · 是否反复强行生成主轴 · Topic grouping 是否大体一致。

尤其关注：

```text
D  是否稳定保持 network / star-DAG，还是某些 run 错误压成 chain
E  是否稳定保留 正常 / 异常 / 人工介入，而不是只留下 happy path
```

---

## 12. 专门登记"为了过校验而失真"

**Validator Gaming / Contract Shaping** 是 F07 独立的 failure category：

```text
为了避免 relationGap        → 乱用 relates-to
为了避免孤立节点            → 人为制造一条 edge
为了压进 12                 → 删除重要机制
为了避免 unknown role       → 使用语义不准确的 known role
为了让图像 chain            → 编造 prerequisite
```

**如果发生：即使 `check-map = PASS`，Generation Quality 仍然 FAIL。**

否则最终会得到"validator 全绿，但图是错的"。

---

## 13. 结果分级（每个 run 三个维度）

```text
TECHNICAL PASS    工程链 + contract validity
SEMANTIC PASS     语义忠实度（人工判读）
STABILITY SAMPLE  该 run 对 anchors / 拓扑的贡献
```

例：

```text
Run D-02
  Technical: PASS（HARD 0 / WARN 2）
  Semantic:  FAIL —— AI invented dependency between Goal and Plan lifecycle
  Stability: Task dependency anchor present · Lifecycle anchor present · Cross-entity invariant missing
```

---

## 14. Gate

只允许四种结果：**PASS / PARTIAL PASS / FAIL / BLOCKED**。

### PASS（至少满足）

```text
Gateway / IO 安全策略有效
15 个正式 run 均有完整产物记录
无产物被失败请求覆盖
HARD failure rate 足够低
Navigation 无系统性 orphan
无系统性 relation misuse
无系统性 forced-chain
核心 semantic anchors 跨 run 稳定
D / E 两类极端文档没有明显退化
```

> **不要先写死百分比阈值，先采样。**

### PARTIAL PASS

```text
Contract 大部分稳定，但某一文档类型反复出现同一种 generation failure
或：AI 语义总体正确，但结构稳定性明显不足
```

### FAIL

```text
频繁编造关系 · 频繁强行串链 · 大量 provenance 错误
为了通过 validator 系统性扭曲语义 · D / E 明显无法稳定生成
```

### BLOCKED

**仅用于** Gateway / provider / IO 导致实验本身无法可靠执行。
**不能拿 BLOCKED 掩盖模型质量问题。**

---

## 15. 交付物

```text
docs/features/07-ai-framework-map-generation/
├── README.md                  ← 本文件（任务书）
├── execution-prompt.md
├── validation-checklist.md
└── results/
    ├── gateway-safety.md      ✅ 已完成
    ├── run-matrix.md          （Phase 3 填）
    ├── semantic-review.md     （Phase 3 填）
    ├── stability-analysis.md  （Phase 3 填）
    └── final-gate.md          （Phase 3 填）

ai/framework-map-generation.prompt.md
scripts/generate-framework-map.js
scripts/test-generate-framework-map.js
experiments/framework-map-generation/fixture-{a..e}/run-NN/
```

---

## 16. Stop Conditions（立即停止扩展，不自行改 Contract）

```text
发现第 7 类 element 需求
发现第 9 relation 需求
发现 qualifier 不够
出现新的 Structured Constraint Gap
12 budget 反复超出
D/E topology 与人工候选不同
```

这些都应该：**记录 → 继续测试 → 最后汇总**，而不是边跑边改 schema。
否则 15 次 run 会使用不同 Contract，实验失去意义。

---

## 17. 这轮真正要回答的最终问题

F07 结束时不要只回答"15 个 JSON 有几个通过 validator"，而要回答四件事：

```text
1. AI 会不会稳定选对"什么值得成为 L0 element"？
2. AI 会不会忠实表达原文关系，而不是为了画图或过 validator 编关系？
3. 同一篇文档重复运行，核心设计语义是否稳定存在？
4. Concept / Data / Process / ER / Runbook 五类文档中，哪一类最容易生成失败？
```

**这四个问题都能得到清楚答案，F07 才算真正完成。**

---

## 附录：本目录的重构前历史（L2 线，本 Feature 不做）

本目录原为 `07-generation-pipeline`，其中关于 **L2 / block 切法 / 旧 Gold 基线**的记录属于重构前口径：

| 资产 | 命运（重构前口径） |
|---|---|
| `sourceUnits` 87 条 | ✅ 保留 |
| 旧的 21 个 block 切法 | ❌ 作废 |
| `check-plan` 中与切法相关的规则 | 🔧 重写（属 L2 线） |
| `ai/stage1-plan.prompt.md`（fingerprint `62e8e544c69dd32c`） | 🔧 重写（属 L2 线）；此前三次对比结论不再可用 |
| 11 个 shape | ✅ 保留 |
| `stage2-block.schema.json` / `check-block.js` | ✅ 不动 |

**本 Feature 不做 L2 自动生成重构。** L0 线的对比对象是人工 candidate map（A/B/C/D/E），**不叫 Gold**。
