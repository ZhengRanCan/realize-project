# Feature 06: Contract & Validators（Phase 3）

> **定位（本 feature 最重要的一句话）：**
> **不是把 Feature 05 的观察全部"冻死"成最终规则，而是把已经有足够证据的部分固化成 Contract，把仍有疑问的部分显式保留为 provisional / warning / gap。**

总原则：

```text
Freeze evidence-backed semantics;
keep heuristics soft;
represent unresolved gaps explicitly.
```

F05 虽然 Gate = PASS，但它的结论范围**仅限 A / B / C 三篇**。有些东西稳定了，有些只是"目前没被打破"——本 feature 的职责就是把这两类**分开处理**，而不是一律写成硬规则。

---

## 1. 三级冻结清单

### 1.1 ✅ HARD freeze（进 schema / validator 的硬规则）

这些都是跨三篇文档稳住的语义，可以冻结：

| # | 规则 | 证据 |
|---|---|---|
| 1 | **六类 element vocabulary**（`concept` / `component` / `process` / `artifact` / `state` / `constraint`） | 三篇 36 个元素，未观察到 Semantic gap |
| 2 | **`type` + `role` 两层**（`type` 严格 enum，`role` 见 §4.3） | R2 |
| 3 | **edge / attachment 分离**（主轴只放 process / artifact） | R3：三篇都干净地把非主轴元素挤出去 |
| 4 | **Topic 与 L0 element 解耦** | R6：B / C 各自然出现一个"没有 element 的 Topic" |
| 5 | **Framework / Navigation / Semantic 三种 coverage 分离** | R7 |
| 6 | **每个 element 必须有 provenance** | F1；三篇 36/36 |
| 7 | **Navigation 必须无 orphan**（N1~N3） | 三篇均 0 orphan |

追加两条"不许报警"的硬性约定：

```text
8  不能因为某类 element = 0 而报警      ← 三篇的类型分布完全不同，component/state/concept 各自出现过 0
9  不能把没有证据的关系强行串成链        ← 见 §4.4；这是 semantic rule，schema 表达不了
```

### 1.2 🔶 SOFT freeze（有规则，但只出 Warning，不出 Hard Error）

| # | 规则 | 为什么是软的 |
|---|---|---|
| 1 | **element budget = 12** | 三篇**全部顶到 12/12** —— 这不是"12 很合适"，**很可能已经偏紧**（§3） |
| 2 | **`role` 取值** | 已发现 2 处拉伸；过严会立刻制造新的 ontology 问题（§4.3） |
| 3 | **relation vocabulary 的完备性** | 已知 3 处 Relation gap，但**不足以**现在补词（§4.2） |
| 4 | **topology / layout**（主轴、泳道、DAG） | R8 已证明拓扑随文档类型变化；"没有主轴"是正常形态 |

### 1.3 ❌ 现在不要做

```text
- 第 7 类 element
- 第 9 / 10 / 11 个 relation 词
- 固定主轴
- 固定泳道
- 强制六类都出现
- schema maxItems: 12
```

前两条要等 Phase 2b 的对抗测试给出更多证据；后四条是把 heuristic 误当成 semantic validity。

---

## 2. 三个核心交付物

**只有 JSON Schema 是不够的** —— 有些规则天生表达不了。例如：

```text
"如果多个值可以同时成立，它们通常不是同一个 state machine 的互斥 state"
"文档没有声明依赖，就不要为了图漂亮强行串链"
```

这两条都是 **semantic / prompt rule**，不是 schema rule。所以职责要拆成三份：

| 交付物 | 负责检查 |
|---|---|
| `schema/framework-map.schema.json` | 字段存在 · 数据类型 · 枚举 · ID 格式 · 引用完整性 · 基础结构 |
| `scripts/check-map.js` | provenance · reachability（N1~N3）· edge vocabulary · attachment legality · element budget warning · 同概念重复（判据 F）· topic coverage · orphan block · 非法 relation |
| `docs/framework-map-contract.md` | **为什么这么建模**：concept vs state 怎么区分 · 什么时候该用 attachment · 什么叫 Capacity gap · 什么叫 Relation gap · 哪些是 hard rule、哪些只是 heuristic |

> `framework-map-contract.md` 不是"再抄一遍 schema"，它记录的是**schema 表达不了的那部分判断**。

---

## 3. element budget：**不是 `maxItems`**

⚠️ **本条是 Feature 06 最容易做错的地方。**

```text
A = 12/12
B = 12/12
C = 12/12
```

**这不是"12 很合适"的证据，反而是"12 很可能已经偏紧"的证据**（F05 还发现了 5 个 Capacity gap）。

所以：

```text
✅ 正确
   preferred element budget = 12      ← 认知容量 heuristic，不是 semantic validity
   <= 12   正常
   >  12   Warning（不是 schema invalid）

❌ 错误
   schema maxItems: 12
   > 12 → schema invalid
```

**也先不要定义分级惩罚**（例如 13~15 warning / >15 hard error）—— **没有证据**。先只写 `preferred element budget = 12`，等 Phase 2b 的实测再说。

`check-map` 报"超出 budget"时还要**分清**：

```text
超出 且 有内容被硬塞进来        → 需要重新抽象（在报告里提示）
超出 但 内容都有 L1/L2 入口     → 只是 Warning，并提示"检查 Navigation invariant"
```

---

## 4. 三条具体政策

### 4.1 relationGap：给"表达不了的关系"一个显式位置

8 个关系词没有覆盖全部表达（F05 发现 3 处），但现在**不足以**补新词 —— Phase 2b 很可能再给出另外三个。

因此契约支持一种**明确的状态**：

```json
{
  "relationGap": {
    "from": "E-10",
    "to": "E-09",
    "intendedMeaning": "两端实现必须与同一份 fixture 产生逐字节相同的结果",
    "reason": "existing vocabulary cannot express this without distortion"
  }
}
```

**关键：`relationGap` 不进入正式 graph edge。**

| 情况 | 校验结果 |
|---|---|
| 正式 `edges[]` 使用了表外词 | **HARD ERROR** |
| `relationGap` 有记录 | **WARNING / REVIEW REQUIRED** |

这样既保持 vocabulary 封闭，又**不逼 AI 用错误的词硬套**。比允许 `type: "custom"` 健康得多 —— 后者等于悄悄把词表废掉。

### 4.2 三个已知 Relation gap（记录，不补词）

| 想表达的关系 | 出现处 | 现状 |
|---|---|---|
| 两端实现必须与同一 fixture **逐字节一致** | Fixture B | 只能挂 attachment |
| Candidate Inbox **持有** Candidate | Fixture C | 只能用 `contains`（原义是组件嵌套） |
| Proposal **校验通过后放行**进入下游 | Fixture C | 只有 `validates`，缺"通过"语义 |

**不补 `conforms-to` / `stores` / `approves`。** 它们先作为 `relationGap` 记录在 A / B / C 的产物里（或至少在本 feature 的 results 里登记），等 Phase 2b。

### 4.3 role：controlled-but-extensible，不要过度冻结

`type` 可以是**严格 enum**；`role` 要比 `type` **宽松**：

```json
{ "type": "process", "role": "normalization-stage" }
```

如果 role 也做成二十多个严格 enum，很快又会产生新的 ontology 问题（F05 已经发现 2 处 role 拉伸）。

校验策略：

```text
known role    → PASS
unknown role  → WARNING（不是 Hard Error）
```

### 4.4 "不许强行串链"（schema 表达不了，放进 contract）

> 如果文档**没有明确声明**"谁是谁的前置"，就不要为了图漂亮把这些元素串成一条链。

这条来自 F05 的真实经历：设计 Fixture C 时，前两版方案都把两个独立投影压成了一条链，**纠正它的是文档里恰好写了一句"两个投影互相独立"**，而不是判断力。

它属于 **semantic validator / prompt rule**，写在 `framework-map-contract.md` 里。

---

## 5. 三级 severity

`check-map` 的输出分三级，**不要混成一个 pass/fail**：

### 5.1 Hard Error（真正的契约违反）

```text
unknown element type
missing provenance（sourceUnitIds / sectionRefs 都为空）
dangling reference（edge 端点、attachment 目标、topic 的 blockIds 不存在）
edge 使用非法 relation 词
无导航路径（N1~N3 任一失败）
同 ID 重复
```

### 5.2 Warning（需要人看一眼）

```text
element > 12（preferred budget）
role 未知
Topic 太多
某 Topic 只有一个 block
relationGap 存在
```

### 5.3 Informational（**只是形态差异，不是异常**）

```text
component = 0
state = 0
没有主轴
出现 DAG
Topic 没有 element
```

> **最后一类尤其重要。** 过去这些东西很容易被误判成"异常"，现在已经有跨 Fixture 证据说明它们**只是正常的形态差异**：
> 三篇的 type 分布完全不同；C 就是 DAG；B / C 各有一个没有 element 的 Topic。

---

## 6. Phase 2b 的位置

**先做完本 feature，再做 Phase 2b。** 理由：现在补文档只能继续人工观察；有了 schema + check-map 之后，同样的文档可以直接**测试契约本身是否泛化**。

做法与观察点见 `docs/features/05-l0-generalization-gate/results/phase2-generalization.md` 末节（Contract 对抗测试）：

```text
Fixture D  真正的 Entity / ER / Schema Evolution heavy
Fixture E  纯 Operational Runbook
   ↓ 直接跑 F06 的 schema + check-map
观察：Hard error 是真违反还是 validator 太死？Warning 有没有大量误报？
      有没有新的 Semantic / Relation gap？12 是不是明显不够？
```

---

## 7. 明确不做

- ❌ 不修改 Renderer（那是 Feature 08）
- ❌ 不写生成 prompt（那是 Feature 07）
- ❌ 不推翻现有 11 个 shape
- ❌ 不新增第 7 类 element、不新增 relation 词
- ❌ 不把 `12` 写成 `maxItems`
- ❌ 不把 `role` 做成严格 enum
- ❌ 不基于 F06 之前的旧规矩给 A / B / C 判 FAIL —— 三篇都是已经通过的产物，**校验器的首要任务是"不误报"**

## 8. 前置条件（开工检查）

- [x] Feature 05 的 `Gate = PASS`
- [ ] 03 §3~§6 自那以后没有再被修改（若改过，A / B / C 的产物需重新对齐）

## 9. 状态

- **创建时间**：2026-09-26
- **执行**：完成 Task 1 ~ 6
- **结果**：

```text
schema          无 maxItems（刻意）；role 非 enum；relationGap 为独立结构
check-map       HARD / WARN / INFO 三级；词表从 schema 读（单一真相）
                另：检查被跳过时状态为 PASS WITH INCOMPLETE VALIDATION
test:map        21/21 通过（覆盖三级 severity 的边界 + skipped 状态）
A / B / C       三篇 HARD = 0，状态均为 PASS
```

- **判定**：待 reviewer 按 `validation-checklist.md` 验证
- **配套文档**：`execution-prompt.md` · `validation-checklist.md` · `results/notes.md`
- **下一步**：**Feature 09（Contract 对抗测试 / Phase 2b）** —— 用 Fixture D（真 ER-heavy）与 E（纯 runbook）去打 schema 与 validator。
  任务书：`docs/features/09-contract-adversarial-test/`。
  **Feature 07（生成链路）在 09 的 Gate 通过之前不应开始。**
