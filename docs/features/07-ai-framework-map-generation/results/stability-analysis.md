# Stability Analysis（F07 · Phase 3 填）

> 状态：⏳ **未开始**
> 比较对象**不是字符串**：不比 element id、不比 topic 标题、不比顺序。
> 比的是：**同一篇文档的 3 次 run，核心设计语义是否稳定存在。**

---

## 1. Semantic Anchors（每篇先定义，**只用于事后评价**）

> ⚠️ Anchors 依据该 Fixture 的**已有人工分析结果**建立，**不得提供给生成模型**（否则是泄漏）。
> 定义时只写"语义锚点"，不写 element id。

### fixture d（ER-heavy / multi-entity network）

| # | Anchor | run-01 | run-02 | run-03 | Stability |
|---|---|---|---|---|---|
| 1 | Goal | | | | /3 |
| 2 | PlanBundle / Plan 聚合 | | | | /3 |
| 3 | Stage / Task 归属 | | | | /3 |
| 4 | Task 依赖（自引用关系） | | | | /3 |
| 5 | 跨实体不变量（区间包含 / 条件唯一） | | | | /3 |
| 6 | 生命周期 / 状态集合 | | | | /3 |

### fixture e（Operational Runbook）

| # | Anchor | run-01 | run-02 | run-03 | Stability |
|---|---|---|---|---|---|
| 1 | 正常路径 | | | | /3 |
| 2 | 异常 / 失败路径 | | | | /3 |
| 3 | 人工介入 / 越权边界 | | | | /3 |
| 4 | 有界失败（10 次 → REFUND_FAILED） | | | | /3 |
| 5 | 资产回补一致性 | | | | /3 |

### fixture a / b / c

| Fixture | Anchor | run-01 | run-02 | run-03 | Stability |
|---|---|---|---|---|---|
| a | | | | | /3 |
| b | | | | | /3 |
| c | | | | | /3 |

---

## 2. 结构稳定性

| Fixture | run-01 topology | run-02 topology | run-03 topology | 是否出现 forced chain | 核心节点稳定 | 核心关系稳定 | Topic 分组大体一致 |
|---|---|---|---|---|---|---|---|
| a | | | | | | | |
| b | | | | | | | |
| c | | | | | | | |
| d | | | | | | | |
| e | | | | | | | |

`topology class` 取值示例：`chain` · `DAG` · `star` · `star-DAG` · `entity network` · `branching process` · `no-spine`

**两个必须明确回答的问题：**

```text
D：是否稳定保持 network / star-DAG？还是某些 run 被错误压成 chain？
E：是否稳定保留 正常 / 异常 / 人工介入？还是某些 run 只留下 happy path？
```

答案：

```text
D →
E →
```

---

## 3. 跨 run 的"奇怪一致性"

| 现象 | 说明 | 是否可疑 |
|---|---|---|
| 两次 run 产物逐字节相同 | | 可能模型退化 / 缓存 / 未真正独立调用 |
| 产物用词与人工 candidate map 高度雷同 | | 可能发生了信息面泄漏（违反 §4） |
