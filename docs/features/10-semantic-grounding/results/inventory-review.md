# Stage A · Inventory Review（Phase 3 填 · **独立评价，不得用 Stage B 倒推**）

> 状态：⏳ **未开始**（Phase 2 的 6 个 run 产出后填写）
> ⚠️ **纪律**：Stage A 的评价必须**先独立打开 `semantic-inventory.json`**。
> 例如 E 的最终 map 里没有"管理员强制补偿"，**不能**因此判 `Extraction Miss` —— 要看 inventory 里到底有没有。
>
> 抽取数量不是质量：**抽出 60 条也不代表 Stage A 好。**

---

## 1. Recall（原文关键机制有没有被抽到）

对照 `stability-analysis.md` 定义的 anchors 逐条查（anchors 只用于事后评价，从未提供给模型）。

### Fixture D（7 anchors）

| Anchor | run-01 | run-02 | run-03 |
|---|---|---|---|
| 核心聚合与归属层级 | | | |
| Task 依赖图（无环 / 同 Bundle / 仅 done 满足） | | | |
| **Stage–Task 区间包含不变量**（F07 三项全丢） | | | |
| 执行事实三分 + replanning 不可改写 | | | |
| 跨实体引用型关系 | | | |
| 条件唯一性 / 幂等 | | | |
| 遗留 / 迁移与 transient 边界 | | | |

### Fixture E（6 anchors · F07 的失败集中区）

| Anchor | run-01 | run-02 | run-03 |
|---|---|---|---|
| 正常路径 | | | |
| **异常与失败路径**（F07 0/3） | | | |
| **人工介入与越权边界**（F07 0/3） | | | |
| **有界失败策略：连续 10 次 → REFUND_FAILED**（F07 0/3） | | | |
| **资产回补一致性与幂等**（F07 0/3） | | | |
| 部署与验证步骤 | | | |

> 判定取值：✅ 有对应条目（记下 id）· ⚠️ 只沾到边（写清差在哪）· ❌ 完全没有

---

## 2. Precision（抽出来的东西原文真的说了吗）

| run | 疑似"常识补全"条目 | 疑似"把 example 当 invariant" | 疑似"把实现细节提升为设计语义" |
|---|---|---|---|
| | | | |

每条要写：`S-xx` + 原文依据（或"原文无依据"）。

---

## 3. Granularity

| run | item 总数 | 疑似同义重复拆条 | 疑似该拆未拆 | 备注 |
|---|---|---|---|---|
| | | | | |

**同义重复的典型形态**（必须点名具体 id 对）：

```text
S-0x ≈ S-0y  —— 同一机制换个说法
S-0x ⊂ S-0y  —— 一条是另一条的子集
```

---

## 4. Provenance quality

| run | §key 全部合法？（runner integrity 已查） | 行号是否对得上 | quote 是否支撑 statement | 问题条目 |
|---|---|---|---|---|
| | | | | |

---

## 5. 反向审查（防"抄写式穷举"）

- [ ] 有没有把原文**整句抄一遍**当 statement（不可判断真假）？
- [ ] 有没有**只抽名词、不抽机制**（noun/object bias 在 Stage A 复发）？
- [ ] 有没有把 example 当 invariant？
- [ ] 有没有把 implementation detail 提升为 design semantic？

逐条给 id + 判断。

---

## 6. 结论

```text
Stage A 是否"看到了"机制？        对 D：      对 E：
最强项 / 最弱项：
是否出现新的失败形态（抄写式穷举等）：
→ 这决定了后面该切 Extraction 还是 Selection。
```
