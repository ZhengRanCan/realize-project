# D × 1 · 回归对照（F10 新臂 vs F07 旧臂 vs E5 失败样本）

> 目的：确认新方案（两步 + Selection 压力）**没有把原来最好的 ER-heavy 场景搞坏**。
> Stage A 136 条（结构合法）；Stage B 用 `max_tokens_b = 131072`（新天花板）→ 完成、未截断。

---

## 1. 规模与覆盖

| | F07 旧臂（gen/run-01） | E5 失败样本（F10/run-01） | **D×1 新臂（F10/run-04）** |
|---|---|---|---|
| elements | 23 | **81** | **13** |
| edges | 39 | 40 | **12** |
| topics | 15 | 21 | 21 |
| attachments | 3 | 53 | 3 |
| relationGap | 2 | 0 | 0 |
| validator | HARD 0 | HARD 0（W1：81>12） | HARD 0 · WARN 3 · INFO 25 |
| selection | — | 154/154 represented | 136：represented 125 · topic-only 9 · omitted 2 |
| targets / 1:1 / max fan-in | — | 65 / 42% / 8 | **20 / 25% / 39** |

**12 个人工实体覆盖：✅ 12/12（Goal · UserProfile · PlanBundle · Plan · Stage · Task · TaskResult · FocusSession · DailyReview · TodayTaskSelection · PlanChangeSummary · 状态集合）**

```text
✅ 不啰嗦：13 elements（远低于 F07 的 23、E5 的 81）
✅ entity recall 保持：12/12
✅ 没编关系：12 条边都有原文依据的 label（consumes 7 / produces 3 / relates-to 2）
✅ Stage A 更干净：136 条、0 格式缺陷（对照旧 prompt 的 154/264/289 且 2/3 带缺陷）
```

---

## 2. ⚠️ 但压缩付出了两个代价（**这是"压缩甜点区"的实证**）

### 代价 ①：Task 依赖的**基础关系**从图上消失了（只剩它的不变量）

```text
F07 的三次 run：都有 **task → task 自环边**（依赖图作为关系层存在）
D×1 新臂     ：12 条边里 **没有任何 depends-on**，也没有自环

但依赖**不变量**在（都是 constraint 承载，且是"正确归宿"）：
  S-56 → C-PlanStructureAndState：AI 依赖的 client key 是临时标识；持久化依赖使用 Task.dependsOnTaskIds
  S-63 → C-PlanStructureAndState：每个依赖必须引用同一 PlanBundle 中的 Task；
                                  自依赖、重复引用、缺失引用与环均无效      ← 无环性
  S-64 → C-PlanStructureAndState：依赖仅当被引用 Task 状态为 done 时满足      ← 满足条件
```

**判定（需人工复核）**：按 F09 契约的三层模型，**不变量进 constraint 是正确分层**；
但**基础关系（`Task --depends-on--> Task`）本身**应当**同时**作为一条边存在。
现在只有第 3 层、没有第 1 层 → **图上看不出"Task 之间互相依赖"这件事**。
性质上接近 **E3/E4**（语义保留在选择轨迹里，但没进入允许的关系结构），**不是** E1/E2。

### 代价 ②：一条 constraint 吸收了 **39 / 136** 条语义

```text
C-PlanStructureAndState ← 39 条
  label 只有类别名：「模型结构、唯一性与状态不变量（Plan / Stage / Task / Goal / 选择 / Review）」
  它实际承载的（示例）：
    S-29 一个 Goal 可有多个历史 Plan 版本，但同一时刻至多一个 active plan
    S-40 PlanBundle 必须可 JSON 序列化
    S-42 目标无法在截止/容量内完成时 Plan.status='infeasible' 必须显式设置
    S-45 后续调整不得在未重新确立可行性时清除/升级/降级 adjustmentRisk
    S-26 preferredApproach 不得从 MBTI / 塔罗 / 状态卡或行为画像推断
    ……（共 39 条）
```

**这不是模型在撒谎**：`constraint` 是合法的 semantic-bearing 结构，且 selection trace 逐条记录了归属。
**但它也不是自描述的**：只看 `framework-map.json` 的人**看不到那 39 条不变量**，
label 只到"类别"这一层。

> ⭐ **根因是 F09 已登记的 Structured Constraint Gap**：`constraint` 没有 `parameters` / 组成语句的表达面。
> 于是"压缩不变量"唯一合法的姿势就是**把它们塞进一条 constraint 的 label 里**。
> F09 时它只表现为"机器不可读"；**在 F10 的压缩压力下，它升级成了"压缩质量的上限"**。

---

## 3. 裁决（用户裁定）：**Compression regression** —— 必须区分两类压缩

用户给"接受取舍"加了**明确边界**：

> 接受"L0 不展开全部不变量" **≠** 接受"核心基础关系从图上消失"。

### ✅ 可接受的压缩（不构成失败）

```text
C-PlanStructureAndState ← 39 条 invariant

L0 的职责**不是**把 39 条 invariant 全部铺开；只要它能告诉用户"这里存在一组重要约束"，
细节继续由 L1/L2 或 selection trace 承载 —— 这是合理的 progressive disclosure。
E 侧 C-01 / C-02 / C-03 各吸收十几条语义同理。
→ 它证明的是**当前 constraint 表达面比较粗**，不是 F10 的 Selection repair 失败。
```

### ❌ 不可接受的压缩：**基础关系层被删**

```text
Task --depends-on--> Task      ← 基础关系层（第 1 层）  ❌ 消失
acyclic / done 才算满足          ← constraint 层（第 3 层） ✅ 保留
```

**这违反 F09 已冻结的三层原则自身**：第 3 层不该替代第 1 层。

```text
判定：D×1 = **Compression regression**
  · 核心实体全部保留（12/12）
  · 但至少一条核心基础关系发生 **E3 · Encoding Distortion**
归因：**不是 E1**（inventory 明确抽到了"Task 之间存在依赖"：S-56 / S-63 / S-64）
      **也不是"L0 不需要细节"** —— 而是**基础关系被错误降级成了约束**。
```

**处置（用户裁决）：**

```text
❌ 现在**不改 prompt**（不要用 prompt 打补丁）
✅ 必须作为 **F10 未关闭项**保留：
   `D core relation resolution / Task --depends-on--> Task` = **未关闭**
```

### 4.1 相关的 representation gap（升级登记）

**Constraint Composition / Compression Gap**（原 F09 Structured Constraint Gap 的升级命名）：

```text
F09 只能说：constraint 里的复杂规则机器不容易结构化。
F10 证明另一层影响：**一旦施加真正的 L0 压缩压力，constraint 会自然成为"语义聚合黑洞"**
  —— 保住 coverage，却降低自描述性与局部可读性。

下一阶段值得研究一种组成表达面，例如：
  constraint
  ├── summary
  └── statements[] { statement, sourceRef, … }

⚠️ 现在**只登记，不设计**；不要顺手做 uniqueBy / predicate / threshold DSL；
⚠️ 它与 Structured Constraint Gap 相连，但**不要**被误解成"缺一个 relation word"。
```

### 4.2 不用 prompt 强拆（用户裁决 C 暂缓）

```text
"单个 constraint 最多承载 N 条 semantic items" 这类 prompt 限制：
  → 模型很可能只是把 1 个黑洞机械变成 5 个小黑洞，节点数重新向 E5 漂移，
    却没有真正提高语义结构质量。
  → **Schema / representation 缺表达面，不能长期靠 prompt 数量限制修。**
```

---

## 4. "压缩甜点区"的实证形状（保留）

```text
过度展开                    过压？
81 elements  ←——————————————→  13 elements
(E5 失败)                      (D×1 / E×1)
                                ↑ 压缩成功，但约束层出现"聚合黑洞"
```

E 侧同形（`C-02 ← 14` · `C-01 ← 12` · `C-03 ← 12`）→ 说明这是当前 Contract 表达面下的**系统性压缩姿势**。

---

## 4. 下一步的三个选项（**需用户裁决**）

```text
A. 接受这个取舍，继续成本实验
   论点：L0 是**导航层**，细节本来就该由 selection trace / L1 / L2 承载；
        13 elements 对"读图的人"是可用的，39 条不变量本来就不该塞进一张图。
   代价：承认"看 map 看不到全部不变量"。

B. 把 `constraint` 的组成语句表达面作为**下一个 Contract 议题**（不在 F10 内做）
   即 F09 登记的 Structured Constraint Gap 正式升级为待设计项：
   `constraint` 需要一个可选的**组成语句列表**（机器可读、可校验），
   而不是只能把 39 条塞进一个 label。
   ⚠️ 这是 Contract 改动 —— F10 明确不做，只登记。

C. 现在就用 prompt 压制"单条 constraint 吸收过多语义"（例如 >N 条就拆）
   论点：能立刻改善可读性。
   代价：①这是**新的行为变量**，会再次污染归因；②它与"target 8–12"直接对抗
        （拆约束 → element 变多 → 又向 E5 漂移）。
   建议：**不做**，或至少等成本实验之后单独做。
```

**我的建议：A + 登记 B，不做 C。**
即：F10 的架构方向（两步 + Selection 压力）已获两轮证据支持，可以进入
`reasoning_effort: high → low` 的成本实验；
而"约束层不可自描述"应作为**下一阶段的 Contract 议题**单独立项，
不要用 prompt 打补丁（那会把压缩甜点区推来推去）。
