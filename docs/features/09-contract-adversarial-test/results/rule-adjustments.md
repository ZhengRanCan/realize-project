# F06 规则升降级建议（依据 Phase 2b 实测）

> Feature 09 · Task 6
> 依据：`adversarial-report.md` · `verification-output.txt` · `mutation-output.txt`
> **本文件只给建议；实际改动由用户裁决后另行执行。**

---

## 1. HARD 级

| 规则 | 处置 | 依据 |
|---|---|---|
| H1 unknown element type | **保持 HARD** | M2 在 D / E 均被拦住 |
| H2 missing provenance | **保持 HARD** | M1 均被拦住 |
| H3 dangling reference | **保持 HARD** | M4 均被拦住 |
| H4 illegal relation word | **保持 HARD** | M3 均被拦住 |
| H5 无导航路径（N1~N3） | **保持 HARD，但承认覆盖不完整** | M6 均拦住；**M8 在 D 上漏网**（N2/N3 因小节无法解析而跳过） |
| H6 同 ID 重复 | 保持 | 本轮 mutation 未覆盖，建议下轮补一条 |
| H7 孤立元素 | **保持 HARD** | M5 均被拦住；D / E 都**没有**出现"合法的孤立元素" → 用户预设的降级条件未出现 |

**没有一条 HARD 需要降级。** 拦截率 13/14，唯一漏网源于覆盖缺口而非判据过松。

---

## 2. WARNING 级

| 规则 | 处置 | 依据 |
|---|---|---|
| W1 element > 12 | **保持 Warning**（不升级、不降级） | E = 13 如期触发；且**没有**出现"不硬塞就表达不了"的情况 → 容量确实只是 heuristic |
| **W4 单 block/section Topic** | **建议降为 INFO** | 命中 3 次且**全部自然**：B 的 T-01（问题动机，1 节）· E 的 T-03（§4.4 撤销与越权）· E 的 T-08（§11 修订记录）。用户预设的降级条件（"若 D/E 又出现多个自然的 single-block Topic"）**已满足** |
| W5 relationGap 存在 | **保持 Warning** + **新增一条统计型 Warning** | D 6 条 / E 2 条；见 §3 建议 |
| W0 小节无法解析 | **保持现状**（`W0` + `SKIPPED` + `PASS WITH INCOMPLETE VALIDATION`）+ **必须修根因** | M8 证明它会造成真实覆盖缺口；但**状态区分本身是对的**，不能去掉 |
| W2 role 未知 | 保持 | 本轮未触发 |
| W6 `relates-to` > 1 | 保持 | 本轮未触发 |

---

## 3. 建议新增的检查

### 3.1 新增 Warning：关系表达欠账（relationGap 占比）

```text
若 relationGap.length >= 0.5 * edges.length
   → WARN「该文档的关系表达欠账严重：N 条关系无法用 8 词表达，L0 图会系统性欠表达」
```

**依据**：D 是 6 gaps / 9 edges = **67%**；E 是 2/9 = 22%。当前 W5 只逐条报，**没有给出"整体欠账程度"的信号** —— 而 D 的 6 条 W5 看起来像噪声，实际上是同一个根因。

### 3.2 修根因（不是 severity 调整）：小节解析器

```text
现状：readDocSections 只识别  ## N.
修法：识别任意  ## <标题>  作为一个小节锚点（数字编号只是其中一种）
```

**依据**：M8 在 D 上漏网；D 的小节是 `## Goal` / `## PlanBundle` 这类词形标题。修完后：

- D 的 `N2 / N3` 才能真正执行
- M8 才能对 D 生效
- 状态才会从 `PASS WITH INCOMPLETE VALIDATION` 变成 `PASS`

> ⚠️ 这是**修复覆盖缺口**，不是降低严格度。

---

## 4. 词汇表回应（二选一，**需用户裁决**）

D 暴露的是**词汇表的能力边界**，不是某个词的措辞问题：

```text
8 词描述的是"谁对谁做了什么"（流程/数据流导向）
实体网络需要的是"实体之间是什么关系"
  ├─ 基数：1:N / at-most-one / exactly-one
  ├─ 归属：belongs-to / owned-by
  ├─ 聚合：part-of / aggregate
  ├─ 引用而不拥有：references
  └─ 关系自身的约束：acyclic / satisfied-when
```

| 选项 | 做法 | 代价 |
|---|---|---|
| **(a) 接受 `relationGap` 为设计内逃逸口** | 不动词汇表；把"实体网络型文档会欠表达关系"写成**已知限制**，并在 README/契约里说明"这类文档的 relationGap 数量会显著偏高，属预期" | 实体网络的 L0 图**系统性欠表达**；`relationGap` 从"少量特例"变成"主要表达方式" |
| **(b) 给 `edges[]` 增加基数元数据** | 不新增第 9 个词，而是加字段：`{ from, to, type, cardinality?: "1:1"｜"1:N"｜"N:M", ownership?: true }` | 需要改 schema 与 `check-map`；会影响 A/B/C 的既有产物（可以设为可选字段，向后兼容） |

**我倾向 (b) 的可选字段版本**，理由：卡数是**关系的属性**而不是**关系本身**，因此不该用新增关系词来解。而且做成可选字段时 A/B/C 完全不受影响。

**但这是 Contract 层面的改动，不在本轮 Phase 2b 的授权范围内** —— 记录待裁决。

---

## 5. 另一条需要记录的发现：`constraint` 承载不了规则参数

E 的有界失败规则，其**决定性内容是「10 次」与「REFUND_FAILED」**，但 `elements[]` 只有 `id / label / type / role / topics / provenance`：

```text
没有地方放 threshold / targetState
→ 现在只能塞进 label（「有界失败：连续 10 次查单失败置 REFUND_FAILED」）
→ 信息没丢，但机器不可读、无法校验
```

**归类**：**Layout gap**（类型对、表达位不足），不是 Semantic gap。

**建议**：与 §4 的 (b) 一起讨论是否给 `constraint` 增加结构化字段。**本轮只记录。**

---

## 6. 汇总

| 处置 | 项 |
|---|---|
| **保持** | H1~H7 · W1 · W5 · W6 · W2 · W0（状态区分） |
| **建议降级** | W4 → INFO（3 次全部自然） |
| **建议新增** | relationGap 占比 Warning（≥50% edges） |
| **必须修覆盖缺口** | 小节解析器支持非数字标题 |
| **待裁决（Contract 改动）** | edges 增加可选基数/归属字段（倾向 (b)）· constraint 增加结构化参数位 |
