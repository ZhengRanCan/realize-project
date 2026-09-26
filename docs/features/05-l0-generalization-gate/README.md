# Feature 05: L0 Generalization Gate（Phase 2 / Track B）

> 规格依据：`docs/features/03-hierarchical-architecture/README.md`（架构文档，§11 是核心）
> 本目录：`execution-prompt.md`（任务书）· `validation-checklist.md`（验收清单）

---

## 1. 本 feature 的目的（先纠正一个误解）

**不是继续优化 Context Consumption。** 而是拿三类不同文档去**故意攻击 Feature 04 得出的通用规则**，看哪些规则其实只是从 Fixture A 过拟合出来的。

```text
Fixture A  Concept / Architecture heavy   → 已有 Context Consumption（Feature 04 的产物）
Fixture B  Data Model heavy               → 测试文档/fixture-b-*
Fixture C  Process / Operational heavy    → 测试文档/fixture-c-*
```

> **本 feature 的成功标准不是"三类文档都画得出来"，而是"失败的边界被找清楚了"。**
> 如果 B 或 C 画不出图，那是有信息量的结果，不是失败。

---

## 2. 要被攻击的通用规则清单

Feature 04 的成果里，有 8 条是**从一篇文档**推出来的。每一条都要在 A / B / C 上单独给结论。

| # | 规则 | 出处 | 结论（执行时填） |
|---|---|---|---|
| **R1** | 六类 element vocabulary（concept / component / process / artifact / state / constraint） | 03 §5.1 | 成立 / 有条件成立 / 不成立 |
| **R2** | `type` + `role` 两层机制（含 `semantic-level` 等取值） | 03 §5.2 | |
| **R3** | **edge 与 attachment 的区分**（主轴只放 process/artifact） | 03 §6.4 | |
| **R4** | relation vocabulary（8 词 + 主动语序 + 封闭性） | 03 §6 | |
| **R5** | **≤ 12 element 容量原则** | 03 §5.3 判据 E | |
| **R6** | Topic synthesis（语义内聚 / 推导顺序 / 不做 coverage repair） | 03 §10 | |
| **R7** | Framework Coverage 与 Navigation Coverage 必须分离 | 03 §7 | |
| **R8** | **`framework-map` 这个表达模型本身**（含"主轴"是否必要） | 03 §3 | |

**这张表就是本 feature 的主要交付物。** 不要只写一段总结，要逐条给出三类文档上的证据。

---

## 3. 三个最关心的结果

| # | 问题 | 为什么关心 |
|---|---|---|
| **Q1** | **Data-heavy 文档是否被迫画成一条不存在的"机制链"？** | 如果 B 的内容是实体与字段，机制链这个前提就不成立 —— R8 直接受冲击 |
| **Q2** | **Process-heavy 文档的 L0 是否退化成普通流程图？Topic 与图本身是否失去层级差异？** | 如果 C 的图与 topic 划分几乎重合，L0 相对一张流程图就没有增量价值，R7 / R8 受冲击 |
| **Q3** | **遇到不适配内容时，是 ontology 真缺类型，还是只是 layout / role / relation 不够？** | 决定**要不要扩 ontology** —— 见 §4，这是最容易做错的一步 |

---

## 4. Gap 分类（**本 feature 最重要的一条纪律**）

遇到"装不进去"的东西，**第一件事不是加类型**，而是分类：

| Gap 类型 | 含义 | 判据 | 处置 |
|---|---|---|---|
| **Semantic gap** | **六类 ontology 真的表达不了** | 这个东西既不是概念 / 组件 / 过程 / 产物 / 状态 / 约束中的任何一种，且用 role 也救不了 | ⚠️ **只有这一类才值得考虑扩 ontology** |
| **Layout gap** | 类型没问题，只是**画法**不适合 | 元素类型选对了，但放在主轴 / 侧挂 / 网状里都不好看 | 调整布局策略（属具体文档，不改规格） |
| **Relation gap** | **节点没问题，边表达不了** | 两个元素都成立，但它们之间的关系不在 8 词里，且用 `relates-to` 也不合适 | 记录，交 Phase 3 讨论是否补词 |
| **Navigation gap** | 图不需要承载，但 **Topic 必须有入口** | 内容不该进 L0 图，但读者必须能走到 | 加 Topic / 加 `blockIds`（03 §7.2） |

### 分类流程（每个不适配项都要走一遍）

```text
某个东西装不进去
      │
      ├─ 它该不该进 L0 图？ ── 不该 ──▶ Navigation gap（给它一个 Topic 入口）
      │
      └─ 该进
            ├─ 六类里有它的位置吗？ ── 没有 ──▶ Semantic gap
            │
            └─ 有
                  ├─ 关系能用 8 词表达吗？ ── 不能 ──▶ Relation gap
                  │
                  └─ 能 ──▶ Layout gap
```

### 铁律

> **不要一看到 Fixture B 有东西装不进去，就立刻新增第 7 类元素。**
>
> Feature 04 的教训正是"从一个例子推出通用规则"。如果 B / C 每遇到一个不适配项就加一类，ontology 会膨胀到 20 多种，AI 分类又开始漂（03 §5.2 已经写过这条）。

---

## 5. 溯源粒度：**provisional validation granularity**

Fixture B / C **没有 sourceUnits**（从未跑过 Stage 1）。因此 03 §7.2 的 **N3（Semantic Reachability）在本次按「原文小节」为粒度检查**：每一节至少存在一条可达路径。

> ⚠️ 必须显式标注为 **provisional validation granularity**。
>
> ```text
> Fixture A 的 coverage 粒度 = Semantic Unit      ← 已建立
> Fixture B / C 本次的粒度   = 原文小节（provisional）
> ```
>
> **不得**把"小节 coverage"当成与 A 的 Semantic Unit coverage 等价。二者粒度不同，永远不要合成一个百分比。
> Feature 07 生成 sourceUnits 之后，B / C 再回到 sourceUnit 粒度重测。

**本 feature 的目的不是重建两套完整的 Stage 1 Gold Fixture**，而是先回答一个更小的问题：

> 这套 L0 framework-map 机制，跨文档类型会不会崩？

所以 section 粒度**足够**。

---

## 6. 输入

| Fixture | 类型 | 文件 |
|---|---|---|
| **A** | Semantic / Architecture heavy | `测试文档/18-context-consumption-semantic-model.md` |
| **B** | Data Model heavy | `测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md` |
| **C** | Process / Operational heavy | `测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md` |

来源、SHA256 与选用理由见 `测试文档/README.md`。三篇规模接近且同源，用来**隔离"文档类型"这一个变量**。

> **B / C 必须由用户提供原件，执行方不得自行编写假文档代替。**

## 7. 产出

```text
docs/features/05-l0-generalization-gate/
├── drafts/
│   ├── fixture-b.map.json
│   └── fixture-c.map.json
└── results/
    ├── rule-matrix.md               ★ 主要交付物：§2 的规则 × 三类文档结论表
    ├── gap-classification.md        ★ 每个不适配项的 4 类 gap 归类与理由
    ├── phase2-generalization.md     三大关切（Q1~Q3）的答复
    ├── overfitting-check.md         两类过拟合检查
    └── verification-output.txt      不变量自查输出
```

## 8. Gate 判定

```text
PASS  → 可以进入 Feature 06（契约落地）
FAIL  → 回头修改 03 的 §3~§6；不得继续往下做契约
```

**判定要看 `rule-matrix.md`**：不要求 8 条规则全部"成立"，但要求

- 每条规则都有明确结论与证据（不能留空、不能含糊）
- 不成立的规则要写清"在什么条件下不成立"
- **不存在**"因为装不进去就悄悄扩了 ontology / 加了第 9 个关系词"的情况

## 9. 明确不做

- ❌ 不继续优化 Context Consumption 本身
- ❌ Gate 未出结论前，不产出 schema / 校验器 / 生成 prompt / renderer 改动
- ❌ 不用 Feature 04 的 Track A 结论支撑本 feature 的判断
- ❌ 不因为"画不出图"就把 Fixture 换掉 —— 失败结论本身是交付物
- ❌ 不修改 Fixture 文档的任何字节（只读）
- ❌ 不把 B / C 的小节粒度 coverage 与 A 的 sourceUnit 粒度混算

## 10. 状态

- **创建时间**：2026-09-26
- **前置**：Fixture B / C 已就绪（`测试文档/`）；Feature 04 的 Fixture A 图已产出
- **状态**：待开始
