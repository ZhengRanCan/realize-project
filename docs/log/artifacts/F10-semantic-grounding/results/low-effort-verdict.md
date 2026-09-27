# low effort 判定：**不设为默认**（复现的类型/结构退化 + 一次静默机制丢失）

> 执行方式（严格按用户裁决）：**先零调用定位，再最小补样**。总共只多花 **1 次**模型调用。

---

## Step 1 · 零调用定位（Case A）

**问题**：`run-10` 丢掉的 `state`，是 low Stage A 就没抽到，还是 Stage B 编码丢了？

```text
审计 run-09（low）的 semantic-inventory.json（51 条）：
  状态机相关命中 **11 条**，含完整转换链——
    S-14 用例 1 全链路：submitAfterSales → APPROVE_REFUND_ONLY → refundOrder(sandbox PROCESSING) → mock …
    S-15 processAfterSales 的 APPROVE_REFUND_ONLY 使 afterSalesStatus='APPROVED'
    S-18 用例 2 状态依次 REQUESTED → WAIT_RETURN → RETURN_SHIPPED → WAIT_INSPECTION → REFUND_PENDING
    S-19 cancelAfterSales 写入 afterSalesStatus='CANCELLED'、cancelledBy、cancelledAt
    S-33 连续 10 次查单失败后订单被置为 REFUND_FAILED
 覆盖形状对照（high 95 条 vs low 51 条）：
    状态枚举 ✅/✅ · 迁移推进语义 ✅/✅ · afterSalesStatus ✅/✅ · refundStatus ✅/✅
```

**→ 判定 Case A：low Stage A **抽到了**状态机语义。**

**所以退化已经定位在 Stage B**：

| | 同批状态语义的去向 |
|---|---|
| high（run-08） | → `E-06 [state] 售后单状态机 afterSalesStatus` ✅ |
| low #1（run-10） | → `element:E-04`（沙箱运行验证，process）×4 · `constraint:E-11`×2 · 其余散落 → **图上无 state** |

**这一步零调用就值回票价**：它把"要不要重跑整个 low end-to-end"变成了"只需重跑 Stage B"。

---

## Step 2 · low Stage B ×1（同一份 51 条 inventory）

```text
run-11：12 elements · HARD 0 PASS · selection 51 = represented 44 · topic-only 3 · **omitted 4**
```

---

## 三判据对照（用户指定：不能只看 state count）

### 判据 1 · Ontology fidelity

| run | arm | elements | type 分布 | **state 数** | 状态语义落点 |
|---|---|---|---|---|---|
| run-08 | high | 12 | process 4 · artifact 3 · **state 1** · concept 1 · constraint 3 | **1** | `E-06[state]` `E-09[concept]` |
| run-10 | low #1 | 12 | concept 2 · process 5 · artifact 2 · constraint 3 | **0** | **无** |
| run-11 | low #2 | 12 | concept 2 · process 4 · artifact 4 · constraint 2 | **0** | **无** |

### 判据 2 · Structural fidelity

| run | arm | 状态机是否成结构 | 边数 | 分支/汇聚 | depends-on |
|---|---|---|---|---|---|
| run-08 | high | ✅ `E-06` | 8 | 4/2 | 3 |
| run-10 | low #1 | ❌ 压平 | 7 | 1/2 | 2 |
| run-11 | low #2 | ❌ 压平 | 8 | 2/1 | 2 |

### 判据 3 · Semantic anchors

| run | arm | bounded failure | abnormal | manual | privilege | invariant | 命中 |
|---|---|---|---|---|---|---|---|
| run-08 | high | ✅ | ✅ | ✅ | ✅ | ✅ | **5/5** |
| run-10 | low #1 | ✅ | ✅ | ✅ | ✅ | ✅ | **5/5** |
| run-11 | low #2 | **❌** | ✅ | ✅ | ✅ | ✅ | **4/5** |

---

## ⚠️ 第三次复现里最严重的一点：**一次"声称 represented 的静默丢失"**

```text
run-11 的 S-33（连续 10 次查单失败 → REFUND_FAILED）
  selection 写：represented → {"kind":"element","id":"E-08"}
  但核实 E-08 与整张图：
    含 REFUND_FAILED   = false
    含「连续 10 次 / 10 次」 = false
    （只有「阈值/上限」字样出现，但不含这条规则本身）
  → **这条机制在图里根本不存在，却被标记为 represented。**

对照 run-10：同一条 S-33 → constraint「售后不变量与阈值（… 10 次失败上限 …）」✅ 真实落点。

并且 run-11 的 constraint 退化成泛化名：
  · 密钥与敏感值不入库约束
  · 调用者权限边界约束（订单所有者 / 管理员）
（run-10 还有「售后不变量与阈值」这一条把 bounded failure 真正承载住）
```

**这不是"少一个 state 类型"，而是：low 会产出"看起来交代完整、实际丢了机制"的登记。**
而这正是 F10 建立 Source→Inventory→Selection→Encoding 可观测链要抓的东西 —— 这次它抓到了。

> ⭐ 由此新增一条审计启发式（登记，不实现）：**"represented 但 target 不含该语义"**
> —— 用 disposition 的 statement 关键词去核 target 的文本。它属 **Semantic Audit**，不进 check-map。

---

## 裁决：**low 不设为默认**

按用户事先写定的规则：

```text
"low 再现一次明显 ontology/structure regression → low 保留为成本模式，不设默认。"
```

本轮是 **两个 low 样本各自都复现**（不是"一好一坏的高方差"），因此结论比高方差更干净：

```text
✅ low 的成本优势真实：Stage A 省 80%（reasoning 省 93%）· Stage B 省 61%（reasoning 省 65%）
❌ 但它带来**可复现的**风险：
     ① ontology：state 元素 2/2 消失（high 是 3/3 有）
     ② structural：状态机/转换序列被压平成 process/concept 标签 2/2
     ③ anchors：run-11 还额外丢了 bounded failure，而且是**静默地**丢（标记为 represented）
→ **默认策略：high 为默认；low 仅作显式成本模式**（用于成本敏感、且接受结构分辨率下降的场景）
```

**不再补样**（用户裁决："再次出现 → 证据足够 → 不需要第三次"）。**run-11 不是"异常样本"，它是最有信息量的样本。**

---

## 附：F10 由此得到的额外结论

```text
① 可观测链的价值被证明：一次零调用审计就把"Extraction vs Encoding"分开了，
   省掉了整轮 end-to-end 重跑。
② "成本优化"不能只看 token：low 在高成本文档上会系统性地降低抽象分类与结构恢复能力。
③ 新增待登记项：**false-represented**（声称 represented 但图上无承载）
   —— 建议纳入 Semantic Audit 的检查清单。
```
