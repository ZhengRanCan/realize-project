# Shape Catalog（第一版受控词汇表）

本目录来自 `docs/prototypes/overview-shape.html` 与 `overview-shape-2.html` 中**真实存在**的表达方式，
不是凭空设计的。`overview-plan.json` 的 `blocks[].shape` 只能取本表的 10 个值之一；新增形状必须先改本文件、再改校验器。

原则：**形状由内容结构决定，内容不将就组件。**

---

## 1. 十个形状

| # | shape | 一句话 | 源样张 |
|---|---|---|---|
| 1 | `flow` | 单条链路的环节与顺序 | overview-shape（主运行链的目标侧） |
| 2 | `current-target-flow` | 同一条链路并排画现状与目标 | overview-shape（O-04 双 lane） |
| 3 | `matrix` | 任意行列对照（含"能/不能"式三元表） | overview-shape-2（O-14a、边界表） |
| 4 | `capability-matrix` | 专表：某主语"能说明什么 / 不能说明什么" | overview-shape（O-07） |
| 5 | `diff` | 被考虑 vs 被采用 / 有 vs 无，逐行差异 | overview-shape（O-03）、overview-shape-2（O-04b） |
| 6 | `ladder` | 递进、阶梯、分级门槛 | overview-shape（O-10 证据阶梯） |
| 7 | `walkthrough` | 分步推演（含反例推演）并给结论 | overview-shape-2（O-12） |
| 8 | `combo` | 状态组合枚举 → 产品解释 | overview-shape-2（O-14a 五组合） |
| 9 | `checklist` | 成组的正例 / 反例 / 边界 / 非主张条目 | overview-shape（O-10b、O-14b） |
| 10 | `two-column-comparison` | 两组并列清单（对象 vs 非对象、要求 vs 不要求） | overview-shape（O-11）、overview-shape-2（消费对象） |

`prose` 不在此表内：它只用于 **O-01 这类"文档定位声明"**，属于极少数例外。
校验器对 `prose` 会额外检查：全篇 `prose` 区块不得超过 `MAX_PROSE_BLOCKS`，防止"视觉重构"退化成"重新排版"。

---

## 2. 逐形状说明

### 1. `flow` — 链路
- **适合**：单条链路的环节、顺序、职责分工。例：`Frozen Context → outline generation → Outline Revision → scene`。
- **不适合**：并列对照（用 `current-target-flow`）、因果论证（用 `walkthrough`）、状态枚举（用 `combo`）。
- **典型字段**：`lanes[].nodes[]`（title / detail / state / tier / code / badges）、`lanes[].nodes[].edge`（kind：plain / changed / problem）。
- **推荐容量**：1–3 个 lane，每 lane 2–6 个节点。超过 6 个节点应拆块。

### 2. `current-target-flow` — 现状 vs 目标
- **适合**：同一个系统在"现在"和"目标"两种形态下的结构差异，且**改动点需要被标出来**。
- **不适合**：两个互相独立的概念对比（用 `two-column-comparison`）、纯枚举（用 `combo`）。
- **典型字段**：两个 lane，`variant` 分别为 `current` / `target`；节点 `state` 用 `current` / `changed` / `target`。
- **推荐容量**：每侧 2–5 个节点。两侧节点数不必相等，但**差异必须体现在 edge.note 或 state 上**。
- **硬约束**：两侧不能只有措辞差异而无结构差异，否则应降级为 `diff`。

### 3. `matrix` — 通用对照表
- **适合**：任意 N×M 的行列关系，例如"产品层级 × 生产职责 × 概念入口 × 成功边界"。
- **不适合**：只有一列（那是清单，用 `checklist`）、有明确流程语义（用 `flow`）。
- **典型字段**：`columns[]`、`rows[][]`（每个 cell：text + variant）。
- **推荐容量**：2–4 列、2–8 行。超过 4 列应横向拆分或改用 `capability-matrix`。

### 4. `capability-matrix` — 能说明 / 不能说明
- **适合**："某个层级/角色能说明什么、不能说明什么"这类**成对边界**。这是本文档的地基形状（O-07 三级 Receipt / Availability / Consumption）。
- **不适合**：连续流程、因果链、状态枚举（它们没有"能/不能"的对偶结构）。
- **典型字段**：`columns` 固定为 `[主语, 能说明, 不能说明]`；每行一个主语。
- **推荐容量**：2–5 行。**每行的"不能说明"不得为空** —— 空的否定列说明这不是边界，而是定义。

### 5. `diff` — 差异对照
- **适合**：逐行的"有 / 无 / 变"对比：被考虑过的结构 vs 采用的结构、现状的某几条 vs 目标的那几条。
- **不适合**：需要呈现完整链路时（用 `current-target-flow`）。
- **典型字段**：`sides`（两个）、`sides[].lines[]`（mark：keep / add / gone）。
- **推荐容量**：每侧 2–6 行。

### 6. `ladder` — 递进 / 阶梯
- **适合**：分级、门槛、递进关系，要求读者感受到"下一级比上一级更强"。例：Receipt → Availability → Consumption。
- **不适合**：并列关系（平级用 `matrix`）、组合枚举（用 `combo`）。
- **典型字段**：`tiers[]`（label / text / detail / variant）。
- **推荐容量**：2–4 级。超过 4 级应怀疑是否真的存在递进。

### 7. `walkthrough` — 分步推演
- **适合**：反例推演、论证展开、"前几步成立但最后一步推不出来"这类过程。例：worked-example-first 反例。
- **不适合**：纯清单或纯定义。
- **典型字段**：`steps[]`（label / text / note）、`verdict`（结论条）。
- **推荐容量**：3–6 步 + 1 个结论。**结论条不是可选项** —— 没有结论的推演应改用 `checklist`。

### 8. `combo` — 状态组合枚举
- **适合**：若干独立状态的所有/关键组合，以及每种组合的产品解释。例：Receipt × Availability × Consumption × Alignment 的 5 种组合。
- **不适合**：递进（用 `ladder`）、行列对照（用 `matrix`）。
- **典型字段**：`pairs[]`（key / keyVariants / value / variant）。
- **推荐容量**：3–6 组。超过 6 组说明状态维度太多，应拆块或降级为 `matrix`。

### 9. `checklist` — 成组条目
- **适合**：正例 / 反例 / 边界 / 非主张 / 不可用情形等成组条目。允许组内每项带 note 解释。
- **不适合**：需要展示顺序或流转的内容。
- **典型字段**：`panels[]`（title / variant / items[]：text / note / variant）。
- **推荐容量**：1–3 组，每组 2–8 项。
- **风险提示**：**最容易退化成"把散文列成条目"**。若某块用 `checklist` 只是把段落拆成 bullet、没有任何视觉重构，校验器会给出 warning。

### 10. `two-column-comparison` — 两组并列清单
- **适合**：两个概念的正面对照，例如"被消费的对象 vs 不被消费的对象"、"不要求盲从 vs 不要求可见差异"。
- **不适合**：三组以上（用 `checklist` 多面板）、有数值或状态组合（用 `matrix` / `combo`）。
- **典型字段**：`panels` 恰好 2 组，项数不要求相等。
- **推荐容量**：每组 2–8 项。

---

## 3. 选择顺序（给 Stage 1 的判定指引，不是 prompt）

```text
有"现状 / 目标"两个形态吗？          → current-target-flow
只有一个链路 / 顺序吗？               → flow
是"能/不能"的成对边界吗？             → capability-matrix
是分级递进吗？                        → ladder
是状态组合枚举吗？                    → combo
是逐行有/无/变吗？                    → diff
是分步推演且要给结论吗？              → walkthrough
只是两组并列吗？                      → two-column-comparison
其余行列关系                          → matrix
其余成组条目                          → checklist
只有文档定位声明                      → prose（例外，慎用）
```

## 4. 与现有 fixture 的对应

`fixtures/context-consumption.json` 当前的 20 个区块用到 8 种形状，均在本表内：

```text
flow ×2（O-04, O-05）    ladder ×3（O-02, O-09, O-10）
diff ×1（O-03）          matrix ×4（O-06, O-07, O-08, O-04c）
checklist ×6（O-04b, O-10b, O-10c, O-11, O-14, O-15）
combo ×2（O-11b, O-13）  steps→walkthrough ×1（O-12）  prose ×1（O-01）
```

其中 `steps` 在 catalog 中定名为 `walkthrough`（语义相同，名称对齐 catalog）。`capability-matrix` 与 `two-column-comparison` 目前未被使用，但 O-07 / O-08 属于它们的典型场景，后续可迁移。
