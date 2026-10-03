# Stage 2 Pilot — Gold 对比报告

生成时间：2026-09-25T12:51:48.163Z

> 本报告是**观察工具**的产物。刻意不做自动评分、不做 AI-as-Judge、不要求文案与人工 Overview 一致。
> 判断依据是：Plan 要表达的语义有没有丢、有没有被改变、元素能否回溯 sourceUnit。

## 1. 总览

| block | shape | covers | check-block | Semantic Coverage | 元素数 | 有 provenance | 平均文本 | 长文本 |
|---|---|---|---|---|---|---|---|---|
| O-04 | current-target-flow | 8 | PASS | 8/8（100%） | 14 | 14/14 | 85 字 | 1 |
| O-07 | capability-matrix | 4 | PASS(W) | 4/4（100%） | 9 | 9/9 | 53 字 | 0 |
| O-10 | ladder | 3 | PASS | 3/3（100%） | 3 | 3/3 | 190 字 | 1 |
| O-10b | checklist | 12 | PASS(W) | 12/12（100%） | 16 | 13/16 | 100 字 | 1 |
| O-11b | combo | 3 | PASS | 3/3（100%） | 3 | 3/3 | 93 字 | 0 |
| O-12 | walkthrough | 3 | PASS(W) | 3/3（100%） | 7 | 7/7 | 77 字 | 0 |

**合计**：6 个 block，覆盖 33 / 33 个 sourceUnit（100%）。
**语义保真类 Hard Error：0 条。**

## 2. Semantic Preservation（语义有没有丢）

| block | covers | 被承载 | 未承载 | core 漏失 |
|---|---|---|---|---|
| O-04 | 8 | 8 | 无 | 无 |
| O-07 | 4 | 4 | 无 | 无 |
| O-10 | 3 | 3 | 无 | 无 |
| O-10b | 12 | 12 | 无 | 无 |
| O-11b | 3 | 3 | 无 | 无 |
| O-12 | 3 | 3 | 无 | 无 |

**6 个 block 的 sourceUnit 覆盖全部为 100%，没有语义丢失。**

## 3. Semantic Fidelity（有没有改变确定性 / 边界 / Current-Target / non-claim）

| 越权类型 | 命中 |
|---|---|
| Current / Target 反转 | 0 |
| 未决事项被写成确定结论 | 0 |
| non-claim 被写成 claim | 0 |
| source-verified 出现在 Stage 2 | 0 |
| 新增禁用措辞 | 0 |
| 修改了 plan 固定字段 | 0 |
| 引用 covers 之外的 sourceUnit | 0 |

**没有发生任何语义保真类错误。**

## 4. Shape Compliance（有没有真的用这个 shape）

| block | shape | content.type | 主要元素 | 平均文本 | 判定 |
|---|---|---|---|---|---|
| O-04 | current-target-flow | flow | 14 | 85 字 | 结构性使用 |
| O-07 | capability-matrix | matrix | 9 | 53 字 | 结构性使用 |
| O-10 | ladder | ladder | 3 | 190 字 | ⚠️ 可能偏 prose |
| O-10b | checklist | checklist | 16 | 100 字 | 结构性使用 |
| O-11b | combo | combo | 3 | 93 字 | 结构性使用 |
| O-12 | walkthrough | steps | 7 | 77 字 | 结构性使用 |

以下 block 含超长元素（需要人工确认是否退化成 prose）：
- O-04：1 个元素超过 160 字
- O-10：1 个元素超过 160 字
- O-10b：1 个元素超过 160 字

## 5. Provenance Quality（能否回溯 sourceUnit）

| block | 主要元素 | 带 provenance | 覆盖率 | 无 provenance 的元素类型 |
|---|---|---|---|---|
| O-04 | 14 | 14 | 100% | 无 |
| O-07 | 9 | 9 | 100% | 无 |
| O-10 | 3 | 3 | 100% | 无 |
| O-10b | 16 | 13 | 81% | 分组 |
| O-11b | 3 | 3 | 100% | 无 |
| O-12 | 7 | 7 | 100% | 无 |

以下 block 存在缺少 provenance 的元素（需要人工确认是"漏标"还是"该元素确实不承载语义"）：
- **O-10b**：3/16 个元素缺少 provenance —— 类型：分组

说明：`flow` 的"泳道 / 边"与 `checklist` 的"分组标题"属于**结构元素**。
它们如果不带 provenance，语义覆盖仍然可能 100%（因为内容元素已经承载了语义），
但会削弱"每个元素都能回溯"这一条；模型需要为结构元素也标注来源。

## 6. 与人工 Overview 的对照（只列结构，不评文案）

| block | 人工 content.type | 模型 content.type | 人工元素数 | 模型元素数 | 差异说明 |
|---|---|---|---|---|---|
| O-04 | flow | flow | 16 | 14 | 结构一致 |
| O-07 | matrix | matrix | 9 | 9 | 结构一致 |
| O-10 | ladder | ladder | 3 | 3 | 结构一致 |
| O-10b | checklist | checklist | 16 | 16 | 结构一致 |
| O-11b | combo | combo | 2 | 3 | 结构一致 |
| O-12 | steps | steps | 5 | 7 | 结构一致 |

## 7. 问题分类

### semantic loss

- 无

### semantic distortion

- 无

### shape misuse

- 无

### excessive prose

- O-04: 1 个超长元素
- O-10: 1 个超长元素
- O-10b: 1 个超长元素

### provenance error

- O-10b: 3/16 个元素缺少 provenance

### renderer mismatch

- 无

## 8. Pilot 成功条件核对

- ✅ A. Plan 不会被 Stage 2 修改
- ✅ B. core semantic coverage = 100%
- ✅ C. 没有严重 Semantic Fidelity Error
- ❌ D. 每个生成元素可以追溯到 sourceUnit（O-10b: 3/16 个元素缺少 provenance）
- ✅ E. Shape contract 可以稳定约束模型
- ⚠️ F. 生成结果能被现有 Renderer 消费，或只需非常薄的 deterministic adapter（6 个块全部按 renderer 契约输出，无需 adapter）

