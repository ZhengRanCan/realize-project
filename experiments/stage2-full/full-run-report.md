# Stage 2 Full Run 报告

生成时间：2026-09-26T07:19:30.518Z

> 本轮使用 **Gold overview-plan**（未使用 Stage 1 生成结果），Plan 固定字段由程序注入，AI 只输出 `content`。
> 全部数字都是**事实统计**，不是主观质量分。

## 1. 运行元数据

| 项 | 值 |
|---|---|
| plan | gold（fixtures/context-consumption.overview-plan.json） |
| plan sha256 | `4c39047328e56a3f` |
| model | gpt-5.6-sol |
| prompt sha256 | `980bb05fc6af7938` |
| complete | **true** |
| 生成 block | 21 / 21 |
| 失败 block | 无 |
| 缺失 block | 无 |
| 组装时间 | 2026-09-26T07:19:11.221Z |

## 2. 总统计

```text
Blocks          21 / 21
Core coverage   75 / 75
Supporting      12 / 12
Total           87 / 87
Provenance      151 / 151
```

Shape 分布：prose×1, ladder×3, diff×1, current-target-flow×1, checklist×5, matrix×1, flow×2, capability-matrix×2, two-column-comparison×2, combo×2, walkthrough×1

Warning 分类：重复×17, 密度×1

失败 block：无

## 3. 每个 block 的 PASS / WARNING / FAIL

| block | stage | shape | content.type | covers | coverage | 元素 | provenance | 判定 | 耗时 |
|---|---|---|---|---|---|---|---|---|---|
| O-01 | what | prose | prose | 1 | 1/1 | 2 | 2/2 | PASS | 57s |
| O-02 | what | ladder | ladder | 3 | 3/3 | 3 | 3/3 | PASS | 20s |
| O-03 | what | diff | diff | 2 | 2/2 | 7 | 7/7 | PASS WITH WARNINGS | 64s |
| O-04 | what | current-target-flow | flow | 8 | 8/8 | 18 | 16/16 | PASS WITH WARNINGS | 290s |
| O-04b | what | checklist | checklist | 3 | 3/3 | 7 | 7/7 | PASS WITH WARNINGS | 8s |
| O-04c | what | matrix | matrix | 4 | 4/4 | 8 | 8/8 | PASS | 7s |
| O-05 | how | flow | flow | 8 | 8/8 | 12 | 12/12 | PASS WITH WARNINGS | 120s |
| O-06 | how | capability-matrix | matrix | 4 | 4/4 | 6 | 6/6 | PASS | 12s |
| O-07 | how | capability-matrix | matrix | 4 | 4/4 | 9 | 9/9 | PASS WITH WARNINGS | 10s |
| O-08 | how | two-column-comparison | checklist | 3 | 3/3 | 4 | 4/4 | PASS | 153s |
| O-09 | prove | ladder | ladder | 2 | 2/2 | 2 | 2/2 | PASS | 9s |
| O-16 | prove | flow | flow | 2 | 2/2 | 3 | 3/3 | PASS | — |
| O-10 | prove | ladder | ladder | 3 | 3/3 | 3 | 3/3 | PASS | 6s |
| O-10b | prove | checklist | checklist | 13 | 13/13 | 15 | 15/15 | PASS WITH WARNINGS | 81s |
| O-10c | prove | checklist | checklist | 3 | 3/3 | 6 | 6/6 | PASS | 27s |
| O-11 | prove | two-column-comparison | checklist | 5 | 5/5 | 7 | 7/7 | PASS | 18s |
| O-11b | prove | combo | combo | 3 | 3/3 | 3 | 3/3 | PASS | 7s |
| O-13 | boundary | combo | combo | 3 | 3/3 | 5 | 5/5 | PASS WITH WARNINGS | 18s |
| O-12 | boundary | walkthrough | steps | 3 | 3/3 | 4 | 4/4 | PASS | 9s |
| O-14 | boundary | checklist | checklist | 9 | 9/9 | 12 | 12/12 | PASS | 9s |
| O-15 | boundary | checklist | checklist | 4 | 4/4 | 17 | 17/17 | PASS WITH WARNINGS | 14s |

## 4. Semantic Coverage 明细

**每个 block 的 covers 都被 content provenance 100% 承载。**


## 5. Provenance coverage

**所有 semantic-bearing 元素都带 provenance。**

## 6. 问题分类

### semantic loss

- 无

### semantic distortion

- 无

### excessive compression

- O-10b: panels[2] 用 41 字承载 4 条语义

### excessive prose

- O-04: 2 个元素 > 160 字（平均 70 字）
- O-04c: 1 个元素 > 160 字（平均 79 字）
- O-08: 1 个元素 > 160 字（平均 83 字）
- O-10: 1 个元素 > 160 字（平均 132 字）
- O-14: 3 个元素 > 160 字（平均 102 字）

### duplicate presentation

- 「Context Influence 不作为 Context Consumptio…」出现在 2 处：O-03:sides[1].lines[1], O-12:verdict
- 「Context Receipt…」出现在 2 处：O-04c:rows[0][0], O-07:rows[0][0]
- 「Context Availability…」出现在 2 处：O-04c:rows[1][0], O-07:rows[1][0]
- 「Context Consumption…」出现在 2 处：O-04c:rows[2][0], O-07:rows[2][0]

### provenance error

- 无

### renderer mismatch

- 无

## 7. 四段阅读流的信息量分布

| stage | 标题 | block 数 | 语义元素数 | 平均每块元素 |
|---|---|---|---|---|
| what | 甲 · 这是什么 | 6 | 45 | 7.5 |
| how | 乙 · 它怎么跑 | 4 | 31 | 7.8 |
| prove | 丙 · 怎么算发生了 | 7 | 39 | 5.6 |
| boundary | 丁 · 边界与反模式 | 4 | 38 | 9.5 |

## 8. 逐块内容清单

### O-01｜这是什么文档

- stage：what｜shape：prose → content.type：prose｜covers：1 个 sourceUnit
- 判定：**PASS**｜元素 2 个｜provenance 2/2
- sources：§0, §15

### O-02｜核心主张：保留三级递进

- stage：what｜shape：ladder → content.type：ladder｜covers：3 个 sourceUnit
- 判定：**PASS**｜元素 3 个｜provenance 3/3
- sources：§1

### O-03｜明确不采用：把 Context Influence 作为第四级

- stage：what｜shape：diff → content.type：diff｜covers：2 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 7 个｜provenance 7/7
- sources：§1, §6
- warning：2 条（重复）

### O-04｜系统骨架：消费点放在哪一层

- stage：what｜shape：current-target-flow → content.type：flow｜covers：8 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 18 个｜provenance 16/16
- sources：§9, §9, §13, §10, §14
- warning：5 条（重复）

### O-04b｜为什么不把消费点放在 scene

- stage：what｜shape：checklist → content.type：checklist｜covers：3 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 7 个｜provenance 7/7
- sources：§13
- warning：1 条（重复）

### O-04c｜三个产品层级 → 现有生产职责映射

- stage：what｜shape：matrix → content.type：matrix｜covers：4 个 sourceUnit
- 判定：**PASS**｜元素 8 个｜provenance 8/8
- sources：§10, §14

### O-05｜两条链：Context-side 与 Output-side

- stage：how｜shape：flow → content.type：flow｜covers：8 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 12 个｜provenance 12/12
- sources：§2, §7
- warning：3 条（重复）

### O-06｜两条链各自回答什么（职责边界）

- stage：how｜shape：capability-matrix → content.type：matrix｜covers：4 个 sourceUnit
- 判定：**PASS**｜元素 6 个｜provenance 6/6
- sources：§2, §8, §14

### O-07｜三个层级分别能说明什么、不能说明什么

- stage：how｜shape：capability-matrix → content.type：matrix｜covers：4 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 9 个｜provenance 9/9
- sources：§3, §4, §5
- warning：2 条（重复）

### O-08｜消费的对象是什么、不是什么

- stage：how｜shape：two-column-comparison → content.type：checklist｜covers：3 个 sourceUnit
- 判定：**PASS**｜元素 4 个｜provenance 4/4
- sources：§5

### O-09｜Consumption 的定义与递进关系

- stage：prove｜shape：ladder → content.type：ladder｜covers：2 个 sourceUnit
- 判定：**PASS**｜元素 2 个｜provenance 2/2
- sources：§5

### O-16｜Consumption Subject：以哪一次 Attempt 为准

- stage：prove｜shape：flow → content.type：flow｜covers：2 个 sourceUnit
- 判定：**PASS**｜元素 3 个｜provenance 3/3
- sources：§11, §14

### O-10｜HOW DO WE KNOW：怎样证明某个状态真的发生了

- stage：prove｜shape：ladder → content.type：ladder｜covers：3 个 sourceUnit
- 判定：**PASS**｜元素 3 个｜provenance 3/3
- sources：§3, §4, §5, §11, §12

### O-10b｜这些都不能单独证明 Consumption

- stage：prove｜shape：checklist → content.type：checklist｜covers：13 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 15 个｜provenance 15/15
- sources：§5, §12
- warning：1 条（密度）

### O-10c｜两个反直觉判断

- stage：prove｜shape：checklist → content.type：checklist｜covers：3 个 sourceUnit
- 判定：**PASS**｜元素 6 个｜provenance 6/6
- sources：§11, §12

### O-11｜Consumption 不要求什么 / 可能出现的不一致状态

- stage：prove｜shape：two-column-comparison → content.type：checklist｜covers：5 个 sourceUnit
- 判定：**PASS**｜元素 7 个｜provenance 7/7
- sources：§5

### O-11b｜Possible mismatch states：Consumption 与 Alignment 不一致的两种情况

- stage：prove｜shape：combo → content.type：combo｜covers：3 个 sourceUnit
- 判定：**PASS**｜元素 3 个｜provenance 3/3
- sources：§8

### O-13｜5 种状态组合的产品解释

- stage：boundary｜shape：combo → content.type：combo｜covers：3 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 5 个｜provenance 5/5
- sources：§7
- warning：1 条（重复）

### O-12｜为什么不做第四级：worked-example-first 反例

- stage：boundary｜shape：walkthrough → content.type：steps｜covers：3 个 sourceUnit
- 判定：**PASS**｜元素 4 个｜provenance 4/4
- sources：§6

### O-14｜代码侧的边界与反模式

- stage：boundary｜shape：checklist → content.type：checklist｜covers：9 个 sourceUnit
- 判定：**PASS**｜元素 12 个｜provenance 12/12
- sources：§9, §12, §13, §14

### O-15｜明确不决定的 8 项 / 明确不承诺的 5 项

- stage：boundary｜shape：checklist → content.type：checklist｜covers：4 个 sourceUnit
- 判定：**PASS WITH WARNINGS**｜元素 17 个｜provenance 17/17
- sources：§15
- warning：3 条（重复）

