# Feature 05: L0 Generalization Gate（Phase 2 / Track B）

> 规格依据：`docs/features/03-hierarchical-architecture/README.md`（架构文档，§11 是本 feature 的核心）
> 本目录：`execution-prompt.md`（任务书）· `validation-checklist.md`（验收清单）

---

## 1. 这个 feature 要回答什么

**生成模型假设：**

> 六类元素 ontology、主轴/侧挂布局、Topic Synthesis、Relation vocabulary，是否能泛化到**别的文档类型**？

这条假设目前**完全没有证据** —— 03 的 §4~§6 全部是从 Fixture A（一篇概念型文档）推出来的。归档的上一版曾明确警告过这个风险：

> 不能把"Context Consumption 这一个例子如何划分 Topic"过早提升成"任意技术文档都应该如何划分 Topic"的产品规则。

**同样的批评适用于 L0 的元素与布局**，所以本 feature 是 Feature 06 / 07 / 08 的**前置闸门**。

### 三个必须回答的疑问（03 §11.1）

```text
疑问 1：Data-heavy 文档画得出机制链吗？
        → 画不出，说明"主轴 = 机制链"这个前提不成立，必须改 §3.3 / §4

疑问 2：Process-heavy 文档的机制链会不会与 topic 划分几乎重合，
        导致 L0 退化成一张普通流程图？
        → 重合度过高，说明 framework-map 在流程型文档上没有增量价值

疑问 3（前两问的抽象）：
        不同类型技术文档的 L0 topology 是否可能完全不同？
        → 预期答案是肯定的。特别要回答：Framework Map 是否必须存在单一主轴？
```

> ⚠️ 本 feature 与 Feature 04（Track A）是**两条独立的线**：Track A 验证交互假设，Track B 验证生成模型假设。
> 05 复用 04 产出的 Fixture A 图，但**它的结论不得引用 Track A 的结果**，Track A 的"更好用"也不能给这里的泛化背书。

## 2. 输入

| Fixture | 类型 | 文件 | 行数 |
|---|---|---|---|
| **A** | Semantic / Architecture heavy | `测试文档/18-context-consumption-semantic-model.md` | 381 |
| **B** | Data Model heavy | `测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md` | 343 |
| **C** | Process / Operational heavy | `测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md` | 383 |

来源、SHA256 与选用理由见 `测试文档/README.md`。三篇规模接近且同源，用来**隔离"文档类型"这一个变量**。

> **Fixture B / C 必须由用户提供原件，执行方不得自行编写假文档代替。**

## 3. 产出

```text
docs/features/05-l0-generalization-gate/
├── drafts/
│   ├── fixture-b.map.json                      B 的框架图
│   └── fixture-c.map.json                      C 的框架图
└── results/
    ├── phase2-generalization.md               三个疑问的答复 + 拓扑结论
    ├── overfitting-check.md                   过拟合检查
    └── verification-output.txt                不变量自查输出
```

## 4. 溯源规则（B / C 的特殊情况）

Fixture B / C **还没有 sourceUnits**（从未跑过 Stage 1）。因此 03 §7 的 L0 不变量第 ⑤ 条（每个元素有 `sourceUnitIds`）在 B / C 上改用**等价溯源**：

```json
{ "provenance": [{ "section": "§3.1", "lines": "120-138" }] }
```

理由：Phase 2 验证的是 **L0 方法**（元素选择 + 拓扑），不应把尚未验证的 Stage 1 拉进实验 —— 否则一旦失败，无法判断是 L0 的问题还是 Stage 1 的问题。

Fixture A 仍用 `sourceUnitIds`（87 条已存在）。

> 待 Feature 07 重建 Stage 1 之后，B / C 的溯源可升级为 `sourceUnitIds`。

## 5. 任务分解

| Task | 内容 |
|---|---|
| 2.1 | 确认 Fixture B / C 原件（来源、`document.id` / `title` / `sourcePath`） |
| 2.2 | 对 B 和 C 各做一版框架图（重复 Feature 04 的 Task 1.1 ~ 1.4） |
| 2.3 | 回答三个疑问，记录三类文档**各自形成**的拓扑 |
| 2.4 | 过拟合检查 |

### 可选探针（Phase 2b，建议但非必须）

`deepseek-harness-master/.agents/notes/implemented/architecture/*.md` 是「决策记录」格式（Problem / Decision / Alternatives / Consequences），过程类关键词命中 183，全盘最高。

它**可能根本没有机制可画** —— 这恰好是疑问 3 的极端情形。若采用，应作为**第三类探针**单独记录，并且：**它失败是有信息量的失败**（说明 L0 需要按文档类型换形态），不是"Fixture 选错了"。

## 6. Gate 判定

```text
PASS  → 可以进入 Feature 06（契约落地）
FAIL  → 回头修改 03 的 §3~§6（L0 形态与元素 ontology），不得继续往下做契约
```

**判定标准：**

- [ ] 三类文档产生了**各自不同**的结构
- [ ] Fixture B / C 上没有出现 Fixture A 的结构（如 `Consumption Evidence` / `Product Boundary`）
- [ ] 三个疑问都有明确、可复核的答复
- [ ] 每张图各自通过 Feature 04 的全部结构检查

## 7. 明确不做

- ❌ Gate 未出结论前，不产出 `framework-map.schema.json`、`check-map`、Stage 1a / 1b prompt、任何 renderer 改动
- ❌ 不用 Feature 04 的 Track A 结论支撑本 feature 的判断
- ❌ 不因为"画不出图"就把 Fixture 换掉 —— 失败结论本身是交付物
- ❌ 不修改 Fixture 文档的任何字节（只读）

## 8. 状态

- **创建时间**：2026-09-26
- **前置**：Fixture B / C 已复制进 `测试文档/`（✅ 已就绪）；Feature 04 的 Fixture A 图（可并行，不阻塞）
- **状态**：待开始
