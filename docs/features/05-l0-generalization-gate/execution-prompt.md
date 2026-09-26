# L0 Generalization Gate — Execution Prompt

> 本文件是 Feature 05 的任务书，自包含。
> 规格依据：`docs/features/03-hierarchical-architecture/README.md`（下文 §编号均指该文件），核心是 §11。
> 验收标准：本目录 `validation-checklist.md`。

## Context

Feature 03 定义的 L0 规格 —— 六类元素 ontology、准入判据 A~F、主轴 + 侧挂、受控 8 词关系 —— **全部是从一篇概念型文档（Fixture A）推出来的**。

这就是过拟合风险：Fixture A 很容易画成

```text
Frozen Context → Projection → Outline Generation → Outline → Scene
```

于是很容易误以为 `Framework Map = 一条主链 + 侧挂`。但 Data-heavy 文档可能天然是实体关系图，**根本没有主轴**。

本任务用三类文档来检验这套规格是否真的通用。它的结论决定 **Feature 06 / 07 / 08 能不能开始**。

⚠️ **本任务只验证生成模型假设。** 交互假设（"这套 UI 是否更好用"）已由 Feature 04（Track A）负责，**不要引用它的结论**，也不要用它来支撑这里的判断。

## 输入

```text
测试文档/18-context-consumption-semantic-model.md                              Fixture A（381 行，概念型）
测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md        Fixture B（343 行，数据型）
测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md                  Fixture C（383 行，流程型）
测试文档/README.md                                                             来源、SHA256、选用理由
docs/features/04-l0-framework-map/drafts/context-consumption.map.json          Fixture A 的框架图（若 04 已完成）
```

三篇规模接近、同源，用来隔离"文档类型"这一个变量。

## Constraints

**允许：**
- 手工撰写 `drafts/fixture-b.map.json`、`drafts/fixture-c.map.json`
- 阅读 Fixture A / B / C 原文（**只读**）
- 撰写 `results/` 下的记录文档

**不允许：**
- 修改 Fixture A / B / C 的任何字节
- 自行编写假文档代替 Fixture B / C
- 修改 `app/renderer/*`、`app/main/*`、`schema/*`
- 新增第 7 种元素类型或 §5.2 列出的那 12 种类型
- 使用 §6.1 之外的关系词（含滥用 `relates-to`）
- 产出 `framework-map.schema.json`、`check-map`、Stage 1a / 1b prompt
- 在 Gate 结论出来之前推进 Feature 06 / 07 / 08
- 用 Feature 04 的 Track A 结论支撑本任务的判断

## Task Breakdown

### Task 2.1 确认 Fixture B / C

- [ ] 核对 `测试文档/README.md` 记录的 SHA256 与 `测试文档/` 下的实际文件一致
- [ ] 记录每篇的 `document.id` / `title` / `sourcePath` / `role`（`target`）
- [ ] 确认两篇确实包含目标类型的要素：
  - B：实体、字段、嵌套 schema、对象引用、lifecycle、schema evolution
  - C：执行流、队列、重试、超时、并发、故障恢复、可观测性

### Task 2.2 各做一版框架图

对 B 和 C 分别重复 Feature 04 的 Task 1.1 ~ 1.4：

1. 按 §5.3 判据 A~F 选元素，总数 ≤ 12
2. 定 `type` / `role` / `topics`
3. 填 `edges`（只用 8 词，主动语序）与 `attachments`
4. 边界与反例按 §5.5 处理

**溯源规则（本次特殊）：** B / C 没有 sourceUnits，改用等价溯源

```json
{ "provenance": [{ "section": "§3.1", "lines": "120-138" }] }
```

Fixture A 仍用 `sourceUnitIds`。

**关键要求：不要为了"像框架图"而强行拉出一条主轴。**

- 如果 B 天然是实体关系图 → 如实记录，不要硬压成链
- 如果 C 的机制链与 topic 划分几乎重合 → 如实记录重合度
- **画不出来也是结论**，不要换文档重来

**每篇都要跑 Navigation invariant（03 §7.2），与 Feature 04 同一口径：**

```text
N1  每个 Topic 至少关联一个 L0 element 或一个 L2 block
N2  每个需要保留的 L2 block 至少能从一个 Topic 进入（文档级入口除外）
N3  每条 Semantic Unit 至少一条 Document → Topic/L0 → L2 的可达路径
    → 目标：完全无路径 = 0
```

> ⚠️ **B / C 还没有 sourceUnits**（见上文溯源规则），所以 N3 在本次按"**原文小节**"为粒度检查：
> 每一节至少存在一条可达路径。Feature 07 生成 sourceUnits 之后回到 sourceUnit 粒度。

**Topic 必须按语义内聚推导，不是为了补 orphan 而机械新建**（03 §10.1）。

### Task 2.3 回答三个疑问

```text
疑问 1：Data-heavy 文档画得出机制链吗？
        → 画得出就给实际主轴；画不出就说明为什么、以及它实际是什么形态

疑问 2：Process-heavy 文档的机制链与 topic 划分重合度如何？
        → 给出重合度的具体判断（哪些元素/边与 topic 边界重合）
        → 若几乎重合，说明 L0 相对普通流程图还有没有增量价值

疑问 3：不同类型技术文档的 L0 topology 是否可能完全不同？
        → 如实记录三类文档各自形成的拓扑：
          Fixture A（概念型） → ?
          Fixture B（数据型） → ?
          Fixture C（流程型） → ?
        → 必须明确回答：Framework Map 是否必须存在单一主轴？
```

回答必须包含**具体元素/边的例子**，不能是泛泛而谈。

### Task 2.4 过拟合检查

- [ ] 三类文档是否产生了**各自不同**的结构？
- [ ] B / C 上是否出现了 Fixture A 的结构（例如 `Consumption Evidence` / `Product Boundary` 这类命名与切法）？
- [ ] 若出现 → 判定为 **overfitting**，Gate **不通过**
- [ ] 同时检查第二类过拟合：是否把"主轴 + 侧挂"当成了 L0 的必要形态（§3.3 / §11.5）

### Task 2.5（可选）第三类探针

若要追加探针，用 `deepseek-harness-master/.agents/notes/implemented/architecture/` 下的**决策记录**格式文档（Problem / Decision / Alternatives / Consequences）。

- 它可能**根本没有机制可画**
- 必须单独记录，**不计入 Gate 的 PASS / FAIL**（它是有信息量的失败，不是 Fixture 选错）
- 记录内容：这类文档的 L0 应该是什么（如果存在的话）

## Verification

```text
[ ] B / C 的 SHA256 与 测试文档/README.md 记录一致（未被改动）
[ ] B / C 两篇来源已确认，不是自造
[ ] 两张图各自通过 Feature 04 的全部结构检查
[ ] 两张图的元素数各自 ≤ 12
[ ] B / C 使用 provenance 小节锚点；A 使用 sourceUnitIds
[ ] 三个疑问都有明确回答，含"是否存在单一主轴"
[ ] 过拟合检查有结论（含第二类过拟合）
[ ] Gate 结论为 PASS 或 FAIL，且理由可复核
```

## Deliverables

```text
docs/features/05-l0-generalization-gate/
├── drafts/
│   ├── fixture-b.map.json
│   └── fixture-c.map.json
└── results/
    ├── phase2-generalization.md      三个疑问的答复 + 三类拓扑结论
    ├── overfitting-check.md          两类过拟合检查
    └── verification-output.txt       不变量自查输出
```

**不要**产出：新的 schema、校验器脚本、renderer 改动、生成 prompt。**Gate FAIL 时尤其不得产出**。

## 报告格式

```text
Fixture B  Data-heavy：元素数 / 拓扑形态 / 有没有主轴 / 结论
Fixture C  Process-heavy：元素数 / 拓扑形态 / 与 topic 的重合度 / 结论
Fixture A  概念型（基线）：拓扑形态
三问回答    逐条
过拟合      第一类（Fixture A 锚定）/ 第二类（主轴当成必要形态）
Gate        PASS 或 FAIL（FAIL 时必须写明是哪条疑问导致的、需要改 §3~§6 的哪一部分）
遗留        需要先解决才能进入 Feature 06 的问题
```
