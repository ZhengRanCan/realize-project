# Feature 06 笔记（取舍与遗留）

> 任务书：`../execution-prompt.md` · 验收：`../validation-checklist.md`
> 运行结果：`verification-output.txt`

---

## 1. 交付物

```text
schema/framework-map.schema.json        结构层契约（无可执行依赖，纯声明）
scripts/check-map.js                    可执行的校验（三级 severity；词表从 schema 读）
scripts/test-check-map.js               19 个用例，覆盖三级 severity 的边界
docs/framework-map-contract.md          判断层契约（schema 表达不了的部分）
results/verification-output.txt         三篇 Fixture + 测试的运行结果
```

`package.json` 新增：

```text
npm run check-map        校验一份 map（--map <path> [--plan <path>]）
npm run test:map         跑 check-map 的测试
npm run test:all         已并入 test:map
```

---

## 2. 三条最关键设计的落实情况

| 要求 | 落实 |
|---|---|
| **element budget 不是 `maxItems`** | schema 里 `elements` **没有** `maxItems`；`> 12` 只出 **W1 Warning**，并区分"有硬塞"与"有 L1/L2 入口"。**没有**定义 13~15 / >15 的分级惩罚 |
| **不扩关系词** | `edges[].type` 枚举仍是 8 词 + `relates-to`。表外词 = **H4 Hard Error**；3 处已知缺口改用 `relationGap` 表达，**只出 W5 Warning**。没有 `type: "custom"` 之类的后门 |
| **role 不过度冻结** | schema 里 `role` 是 `string` + `x-known-roles` 注解（不是 enum）。未知 role = **W2 Warning** |

---

## 3. 实现过程中改掉的两个"validator 写得太死"

这两条都是**跑出来的**，不是设计时想到的 —— 记下来是因为 Phase 2b 很可能再撞到同类问题。

### 3.1 DAG 判定误报（A / B / C 全中）

**现象**：第一版用"入度 > 1"判 DAG。结果三篇全部报"收敛节点"。

**原因**：在"主动语序"下，`A --consumes--> B` 的箭头方向与**流向相反**（B 是流向 A 的输入）。于是任何"被生产又被消费"的 artifact 都会同时收到 `produces` 与 `consumes` 两条入边，被误判成收敛。

**修法**：计算入度前先把 `consumes` 归一化到流向（`E-05 --consumes--> E-04` ⇒ 流向 `E-04 → E-05`）。

**修后**：A / B 是干净的单链（无收敛），**只有 C 报收敛节点 `E-04, E-08`** —— 与人工判断一致。

### 3.2 原文小节无法解析时误报悬空引用

**现象**：测试里一份合成 map 引用了 `§1`，却被判成"H3 引用不存在的位置"。

**原因**：Fixture A 的原文用「## 一、核心决定」，不是「## 1.」。`readDocSections` 解析不到任何顶层小节 ⇒ "位置全集"为空 ⇒ **每个引用看上去都悬空**。

**修法**：如果解析不出小节标题，**不建立全集、跳过引用与导航校验**，只出一条 `W0 Warning`。

> 这正是"校验器的首要任务是不误报"：格式差异（中文数字标题）不是契约违反。
> 顺带说明一个已知限制：**section 粒度目前只支持数字标题**。A 走 sourceUnit 粒度，不受影响；B / C 是数字标题。Phase 2b 若遇到中文数字标题的文档，会出 W0 —— 那时再决定是否扩展解析。

---

## 4. 超出任务书的一处新增检查

任务书的 Hard 清单没有列"孤立元素"，但 03 §5.3 的**判据 B**（每个元素至少参与一条 edge 或 attachment）是硬性准入条件。因此加了：

```text
H7 孤立元素（判据 B：至少参与一条 edge 或 attachment）→ HARD
```

三篇 Fixture 均通过（36/36 元素都参与关系）。**如果 reviewer 认为这不该是 Hard，可以降级为 Warning** —— 它的确比"悬空引用"弱一档。

---

## 5. 已知的低价值告警（交给 Phase 2b）

```text
W4 「某 Topic 只挂一个 block / section」
   → 在 Fixture B 上命中一次：T-01「为什么不能直接 hash 原始 JSON」只承载 §2。
```

那一节是**问题动机**，本来就只该有一节。**这是我在本次唯一观察到的可能误报**：Topic 挂几个 block 与它的语义角色无关，一个"动机 / 背景"类 Topic 挂一节是正常的。

> 任务书把 W4 列为 Warning（沿用旧的口径），本次**照做**，但把"可能是低价值告警"记录在此。是否降级为 Informational，等 Phase 2b 的误报统计。

---

## 6. 粒度纪律的落实

```text
A  meta.validationGranularity = "sourceUnit"        （本次为它补上了该字段）
B  meta.validationGranularity = "section (provisional)"
C  meta.validationGranularity = "section (provisional)"
```

- `check-map` **一次只处理一份 map**，结构上就不可能把两种粒度合成一个百分比
- 报告里 `granularity` 一行显式打印，provisional 会带 ⚠️ 提示
- section 粒度下明确提示 **N2 与 N3 合并**（"每节有入口"＝"每节可达"）

---

## 7. 遗留

| # | 项 | 归属 |
|---|---|---|
| 1 | 3 处 Relation gap 是否补词 | Phase 2b 之后再定 |
| 2 | W4 是否降级为 Informational | Phase 2b 的误报统计 |
| 3 | `≤12` 是否随主轴长度放宽 | Phase 2b：若 D / E 在没有硬塞的情况下远超 12 |
| 4 | section 粒度只支持数字标题 | 遇到中文数字标题的文档时再说（当前出 W0） |
| 5 | H7（孤立元素）是否降级 | reviewer 裁决 |

---

## 8. 状态

- **Task 1~5**：完成
- **Task 6**：完成（19/19 用例通过）
- **三篇 Fixture**：`HARD 0` ✓
- **判定**：待 reviewer 按 `../validation-checklist.md` 验证
