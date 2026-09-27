# Selection Analysis（F10 · 归因）

> 数据：`experiments/semantic-grounding/fixture-d/run-01/`（唯一一个走完两阶段的 run）

---

## 0. 先记一个**新失败形态**：E5 · Over-representation（过度表达）

F10 的设计初衷是防"机制被丢"（E2 Selection Miss）。但 D/run-01 的结果是**反面**：

```text
inventory        154 条
map              **81 elements** · 40 edges · 53 attachments · 21 topics
disposition      154 / 154 = represented · 0 topic-only · **0 omitted**
target 分布      constraint 131 条 · element 23 条
不同 target      65 个（154 条语义 → 65 个承载点）
每 target 承载    1 条:27 · 2–5 条:34 · 6–20 条:4   ← 不是"挤进一个节点"，是**真的一一落地**
validator        PASS · HARD 0 · WARN 3 · INFO 22（W1：81 > 12）
```

**对照 F07 旧臂的 D：22–25 elements。现在 81。**

即：**AI 把 Inventory 当成了"待办清单"，而不是"选择原料"。**
它没有丢弃任何一条，而是**为每一条都造了承载结构** —— 语义一条没丢，但图膨胀了 3–4 倍。

### 为什么这不属于 E1–E4

| 类 | 判定 | 本例 |
|---|---|---|
| E1 Extraction Miss | 原文有 → Inventory 没有 | 不适用（Stage A 这次抽得很全） |
| E2 Selection Miss | Inventory 有 → 被丢 | **几乎为 0**（0 omitted） |
| E3 Encoding Distortion | 选中但表达错 | 待审（未发现明显类型/方向错） |
| E4 Escape-hatch Misuse | 声称表达但塞进自由位 | 未命中（target 全部是真实结构，65 个不同 target） |

→ 需要一个新类：**E5 · Over-representation**：`Inventory → Map` 近乎 1:1 传导，
每条语义都获得承载，导致 L0 失去"压缩"这个本职。

### 根因（结构性，不是模型偷懒）

```text
当前 Stage B prompt 的组合是"只加压力、不加筛选"：
  · §七 硬约束①：清单每一条都必须给出 disposition
  · §七 硬约束②：「不可以砍」五类不允许 omitted
  · §四 budget：12 是 **Warning**（"超过是 Warning，不是错误"）
  · 从没有任何一句要求"先把 L0 主轴压到 ≤12，再谈其余"
→ 模型面对 154 条清单，最省事、最不会违规的解法就是**全部 represented**
```

**这正好复现了 F07 的一个观察**：AI 从不主动压缩（F07 里 14/15 run 超预算）。
F07 是"没有清单也超"，F10 是"有清单更超" —— 说明**缺的不是信息，是选择压力**。

---

## 1. 逐 anchor 归因矩阵（E · 待 Stage A 稳定后填）

> 顺序固定：**原文/anchors → 先审 Stage A → 再审 Selection → 最后审 Map Encoding**
> （否则 E1/E2/E3/E4 会重新混在一起）

| Anchor（E） | Stage A | Selection | Encoding | Failure |
|---|---|---|---|---|
| bounded failure（10 次 → REFUND_FAILED） | | | | |
| manual intervention（强制补偿） | | | | |
| privilege boundary（仅管理员 / 越权拒绝） | | | | |
| abnormal path（补偿失败 / 查单未决） | | | | |
| invariant（资产成对一致 / 幂等） | | | | |

**判定口径：**

```text
Stage A  ✅ = inventory 里有条目承载该 anchor（记 id）
Selection ✅ = 该 id 的 disposition 非 omitted 且 target 真实存在
Encoding  ✅ = 最终 map 里该机制确实落在目标结构上（打开产物核对，不信 disposition 的自述）
Failure   = E1 / E2 / E3 / E4 / E5（见上）
```

（E 的 Stage A 目前 1/3 成功、2/3 JSON 失败 → 见 `stage-a-reliability.md`；本表暂无法填）

---

## 2. Selection 自述 vs 产物核对（防"声称 covered 但图上没有"）

| run | dispositions | omitted | 不同 target 数 | **声称 represented 但目标结构不存在** | 判定 |
|---|---|---|---|---|---|
| d/run-01 | 154 | 0 | 65 | 0（runner integrity 已逐条校验 target 存在） | 自述**属实**，但见 §0 的 E5 |

> ⚠️ 机械校验只能证明"target 存在"，**不能**证明"该 target 真的承载了这条语义"。
> 后者必须人工打开产物核对（Phase 3）。

---

## 3. 结论

```text
D/run-01：E1 低 · E2 ≈ 0 · E4 未命中 · **E5 命中（81 elements / 154 条全 represented）**
→ 拆两步确实"把机制救回来了"，但代价是 L0 不再压缩。
→ 下一刀不该切 Extraction（Stage A 抽得够多），而应切 **Selection 的压力设计**。
```
