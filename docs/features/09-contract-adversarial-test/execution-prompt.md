# Contract Adversarial Test — Execution Prompt

> 本文件是 Feature 09（Phase 2b）的任务书，自包含。
> 定位、四个观察类别、D / E 选择标准、Gate 见同目录 `README.md`（下文 §编号均指该文件）。
> 验收标准见 `validation-checklist.md`。

## Context

Feature 03 定义了 `framework-map` 规格；Feature 04 产出 Fixture A 的图；Feature 05 用 A / B / C 三类文档验证后 **Gate = PASS**；Feature 06 产出了契约三件套：

```text
schema/framework-map.schema.json      结构层（无 maxItems；role 非 enum）
scripts/check-map.js                  三级 severity：HARD / WARN / INFO
docs/framework-map-contract.md        判断层（schema 表达不了的部分）
scripts/test-check-map.js             21 个单元测试
```

A / B / C 三篇的 `check-map` 结果都是 `HARD 0`。但那只证明了**正确产物没有被大量误报**。

本任务要回答的是另一半：

> **F06 这套 schema + check-map，面对两种此前没覆盖的技术文档，会不会误判、漏判，或者逼迫错误建模？**

**范围很窄**：不继续设计 03，不开始 AI 生成，不评价生成质量。

## Constraints

**允许：**
- 阅读 Fixture D / E 原文（**只读**）
- 撰写 `drafts/fixture-d.map.json` / `drafts/fixture-e.map.json`（candidate，不是 Gold）
- 撰写 mutation 变体（放在 `drafts/mutations/`）
- 撰写 `results/` 下的记录文档
- 修改 `scripts/check-map.js` —— **只在确认误报时**（并补单元测试）

**不允许：**
- ❌ 修改 Fixture D / E 原文的任何字节
- ❌ 自行编写假文档代替 D / E
- ❌ 新增第 7 类 element、新增 relation 词
- ❌ 改 `schema maxItems`、把 `role` 改成 enum
- ❌ 因为 topology 与预期不同就判 contract failure
- ❌ 把 section 粒度与 sourceUnit 粒度混算
- ❌ 为了让 mutation 通过而降低 schema / validator 的严格度
- ❌ 修改 `app/renderer/*`、`app/main/*`、`fixtures/`、`experiments/`、`ai/`
- ❌ 开始 Feature 07（生成链路）

## Task Breakdown

### Task 1 · 按 §3 的标准挑选 Fixture D / E

**先冻结标准（已在 README §3 写死），再去挑文档。**

- [ ] Fixture D：逐条对照 README §3.1 的 7 条硬要求打勾；确认**不是**"数据变换流水线"
- [ ] Fixture E：逐条对照 README §3.2 的 11 条要素打勾；确认接近"操作手册"本身
- [ ] 两篇都由**用户提供原件**，复制进 `测试文档/` 并记录来源与 SHA256（沿用 `测试文档/README.md` 的格式）
- [ ] 若某条硬要求找不到文档满足 → **记录缺口，不降低标准**

### Task 2 · 生成 candidate map（**不是 Gold**）

依据现行 F03 / F06 Contract，为 D / E 各写一份：

```text
drafts/fixture-d.map.json
drafts/fixture-e.map.json
```

要求：

- 沿用 B / C 的口径：`meta.validationGranularity = "section (provisional)"`，溯源用 `sectionRefs`
- 元素仍受 `preferred element budget = 12` 约束 —— **但不得为了压到 12 而牺牲决定性内容**；压不下就如实超出（那正是 Capacity gap 的证据）
- `relationGap` 该用就用，**不要为了"凑合"而用不准确的词**
- **不要**为了让它"好看"而强行串成主轴（`docs/framework-map-contract.md` §6）

**同时记录建模时每一次"别扭"**（写进 `results/notes.md`），后面 Task 5 要逐条分类。

### Task 3 · 跑 schema + check-map

```bash
node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-d.map.json
node scripts/check-map.js --map docs/features/09-contract-adversarial-test/drafts/fixture-e.map.json
```

记录完整输出到 `results/verification-output.txt`。

**关键判断（README §2 类别 4）：**

- 若 D / E 被判 **HARD** → **先怀疑 validator 太死**，逐条查是不是误报；确认误报才改 validator（并补单元测试）
- 若出现 **W0 / SKIPPED** → 确认状态显示为 `PASS WITH INCOMPLETE VALIDATION`，**不得**当成 PASS

### Task 4 · Mutation / Adversarial Test（README §5）

对 D / E 各构造 **5~7 个** mutation，放在 `drafts/mutations/`：

```text
M1  删除 provenance                     → 期望 HARD (H2)
M2  type 改成第 7 类                     → 期望 HARD (H1)
M3  edge 用表外 relation                 → 期望 HARD (H4)
M4  制造 dangling reference              → 期望 HARD (H3)
M5  塞一个孤立 element                    → 期望 HARD (H7)
M6  删除某个 Topic 的导航入口              → 期望 HARD (H5 N1 或 N2)
M7  强行串联两个无关节点                   → **validator 判不出来**，作为人工审计项
```

逐个跑 `check-map`，逐条记录"期望 severity vs 实际 severity"。

**M7 的正确用法**：它不是 validator 的测试项，而是**审计者的测试项** —— 检查人能否仅凭 map + 原文发现那条错误的链。这正是 `framework-map-contract.md` §6 存在的原因。

### Task 5 · 四个观察类别逐条落结论（README §2）

| 类别 | 要产出 |
|---|---|
| Semantic gap | 有没有需要第 7 类的东西？**先按 §11.1.1 决策树分类**再下结论 |
| Relation gap | 新增几处？是否"大量同类重复"？ |
| Capacity gap | 12 是否明显不合理（**无硬塞前提下**） |
| Validator FP / FN | 正确图有没有被误判 HARD？mutation 有没有漏网？ |

**另有统计项：**

- W4（单 Block Topic）在 D / E 上命中几次？是否自然合理？（README §7 的降级判据）
- topology 各自是什么形态？（记录，**不升级成 failure**）

### Task 6 · Gate 与规则升降级

按 README §6 判定，并对 F06 的规则给出**明确的升降级建议**：

```text
保持        /  升为 HARD  /  降为 WARN  /  降为 INFO  /  需要新增检查
```

每条都要附本次的实测证据。

## Verification

```text
[ ] D / E 原件由用户提供，SHA256 已记录，原文未改动
[ ] D / E 的 7 条 / 11 条标准逐条打勾（未满足的已记录为缺口）
[ ] 两份 candidate map 都能被 schema 接受（字段/类型/枚举/引用完整）
[ ] 两份 candidate map 的 check-map 输出已完整记录
[ ] 如有 HARD：逐条确认是真违反还是 validator 误报
[ ] W0 / SKIPPED 时状态显示为 PASS WITH INCOMPLETE VALIDATION
[ ] mutation ≥ 5 个/篇，覆盖 M1~M6；逐条记录期望 vs 实际
[ ] M7 作为人工审计项记录（不要求 validator 判出）
[ ] 四个观察类别都有明确结论（不得留空或"大致可以"）
[ ] W4 命中次数已统计
[ ] topology 已记录，且**没有**被升级成 contract failure
[ ] 每条 F06 规则都有"保持 / 升级 / 降级"的建议 + 证据
[ ] 没有新增第 7 类 element / 新增 relation 词 / maxItems / role enum
```

详细清单见 `validation-checklist.md`。

## Deliverables

```text
测试文档/
    fixture-d-*.md                       D 原件（用户提供）
    fixture-e-*.md                       E 原件（用户提供）

docs/features/09-contract-adversarial-test/
├── drafts/
│   ├── fixture-d.map.json               candidate（不是 Gold）
│   ├── fixture-e.map.json
│   └── mutations/
│       ├── d-m1..m7.json
│       └── e-m1..m7.json
└── results/
    ├── fixture-selection.md             按 §3 逐条打勾 + SHA256 + 缺口
    ├── adversarial-report.md            ★ 四个观察类别 + mutation 结果 + Gate
    ├── rule-adjustments.md              ★ 每条 F06 规则的升降级建议 + 证据
    ├── notes.md                         建模时每一次"别扭"的原始记录
    └── verification-output.txt          全部 check-map 输出
```

**不要**产出：renderer 改动、生成 prompt、新的 element 类型、新的 relation 词、Feature 07 的任何东西。

## 报告格式

```text
Fixture D  类型 / 元素数 / Hard / Warn / Info / topology / 状态
Fixture E  类型 / 元素数 / Hard / Warn / Info / topology / 状态
Mutation   M1~M6 逐条：期望 severity vs 实际（拦截率）
           M7 人工审计：能否发现
四类别     Semantic / Relation / Capacity / Validator 各一行结论
W4 统计    命中次数 + 是否自然
Gate       通过 / 不通过（不通过时写明哪一条不满足）
规则调整    保持 / 升级 / 降级 逐条 + 证据
遗留        需要先解决才能进入 Feature 07 的问题
```
