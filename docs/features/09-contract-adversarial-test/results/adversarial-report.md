# Phase 2b 对抗测试报告

> Feature 09 · Task 3 ~ 6
> 输入：`drafts/fixture-d.map.json` · `drafts/fixture-e.map.json`
> 原始输出：`verification-output.txt`（check-map）· `mutation-output.txt`（M1~M8）

---

## 0. 输入面冻结（§3.6）

**建模阶段只读了这两篇文档，没有查阅任何 supporting 文档或实现代码。**

| Fixture | 文件 | SHA256 | 攻击目标 |
|---|---|---|---|
| **D** | `测试文档/fixture-d-goal-plan-task-state-model.md`（29.2KB · 847 行） | `6F2C5F47258E4F8442EDB1FBEBE658CDB8557A6DC6CE40BECEB2DC367CEB8236` | 没有天然主轴的多实体关系网络 |
| **E** | `测试文档/fixture-e-f13-f16-runbook.md`（22.8KB · 571 行） | `C55F2F55F851DDC79194AF9A90023D78A38376553ABA1E567228DDAF0ED67D97` | 正常 / 异常 / 人工介入 + 有界失败策略的操作过程 |

两篇的副本 SHA256 与源文件一致；原文未改动一个字节。

**两条执行纪律的落实：**

- ❌ 没有查阅 `F15/verification.md`、`F16/verification.md`、任何 `cloudfunctions/*.js`
- ❌ 没有因为 D "没有主轴" 就人为找一条主轴（D 的图是 **star/DAG**，见 §4）
- ❌ 没有把 E 压成 happy-path flow（E 的图保留了 **4 条并列消费者路径 + 人工介入 + 有界失败约束**）

---

## 1. 基线结果

| | D | E |
|---|---|---|
| elements / edges / attachments / topics | 12 / 9 / 3 / 7 | **13** / 9 / 3 / 8 |
| relationGap | **6** | 2 |
| **HARD** | **0** | **0** |
| WARNING | 7 | 5 |
| INFORMATIONAL | 3 | 5 |
| 状态 | **PASS WITH INCOMPLETE VALIDATION** | **PASS** |

**D 的 7 条 Warning**：`W0`（原文小节无法解析）+ `W5` × 6
**E 的 5 条 Warning**：`W1`（13 > preferred budget 12）+ `W4` × 2 + `W5` × 2

---

## 2. Mutation / Adversarial Test

`drafts/build-mutations.js`（可复现）· 完整表见 `mutation-output.txt`

| Mutation | 期望 | D | E |
|---|---|---|---|
| M1 删除 provenance | HARD H2 | ✅ 拦住 | ✅ 拦住 |
| M2 type 改成第 7 类 | HARD H1 | ✅ 拦住 | ✅ 拦住 |
| M3 edge 用表外 relation | HARD H4 | ✅ 拦住 | ✅ 拦住 |
| M4 制造 dangling reference | HARD H3 | ✅ 拦住 | ✅ 拦住 |
| M5 塞一个孤立 element | HARD H7 | ✅ 拦住 | ✅ 拦住 |
| M6 删除某 Topic（无 element）的导航入口 | HARD H5 | ✅ 拦住 | ✅ 拦住 |
| **M8 让某一顶层小节失去所有入口** | HARD H5 | ❌ **漏网** | ✅ 拦住 |
| M7 强行串联两个无关节点 | 判不出来（人工审计项） | ✅ 如预期未被检测 | ✅ 如预期未被检测 |

```text
拦截率: 13/14 = 93%
```

**唯一漏网的那条，正是 §3 的 Validator 覆盖缺口。** 不是「validator 太松」，而是**它明确知道自己跳过了**（状态 = `PASS WITH INCOMPLETE VALIDATION`）。

**M6 曾经误报"漏网"**：初版 mutation 挑了一个**有 element 的 Topic** 去清空入口 —— 那不违反 N1（有 element 的 Topic 不需要 sectionRefs）。**是测试设计错了，不是 validator 错了。** 已修正为挑「无 element 的 Topic」。

**M7 说明**：validator 判不出"强行串联"是**设计如此** —— 它属 semantic rule（`docs/framework-map-contract.md` §6），不是 schema rule。因此 M7 只作人工审计项，不计入拦截率。

---

## 3. 四个观察类别

### 3.1 Semantic gap = **0**

| | 用到的 type |
|---|---|
| D | `artifact` × 10 · `process` × 1 · `state` × 1 |
| E | `process` × 7 · `artifact` × 2 · `constraint` × 2 · `state` × 1 |

**两篇都没有出现需要第 7 类的东西。** 按 §11.1.1 的决策树逐项分类后，**Semantic gap = 0**（当前 2 篇范围内）。

值得记录的两点：

- **D 一个 `constraint` 都没用**（实体模型里的约束是"不变量"，而契约把 `constraint` 定位在"限制行为或定义边界的规则"上 —— D 的跨实体 invariant 我全部记进了 `relationGap`，因为它们的本质是**关系的性质**而不是**独立规则**）。
- **E 用了 2 个 `constraint`**（有界失败 / 撤销与越权边界），且这两个恰好是 E 的攻击目标所在。

### 3.2 Relation gap = **D 6 · E 2** → **对 D 不可控**

A / B / C 三篇合计只有 **3** 条 relationGap。D 一篇就 **6** 条，**12 个元素里 8 个牵涉其中**。

| D 的 6 条缺口 | 缺的是什么能力 |
|---|---|
| PlanBundle 是聚合根（Plan+Stage[]+Task[]） | **组合 / 聚合**（`contains` 的原义是组件嵌套） |
| Task 归属唯一 Stage 且日期落在 Stage 区间 | **归属 ownership + 区间约束** |
| Task 之间的显式依赖图（无环、done 才算满足） | **自引用关系的基数 + 无环性 + 满足条件** |
| 每 Goal/date 至多一条 DailyReview | **基数 at-most-one** |
| UserProfile 被引用但不被拥有 | **reference-without-ownership** |
| 一个 Goal 多条 Plan 版本、同时至多一条 active | **1:N + 条件基数** |

**根因**：那 8 个关系词是**为流程/数据流设计的**（produces / consumes / transforms-to / depends-on / contains / controls / validates / constrains），它们描述的是"谁对谁做了什么"，**没有描述实体网络的能力**：

```text
没有基数（1:N / at-most-one / exactly-one）
没有归属（belongs-to / owned-by）
没有聚合（part-of / aggregate）
没有引用而不拥有（references）
没有条件基数（at most one ACTIVE per parent）
没有关系自身的约束（acyclic / satisfied-when）
```

**`relationGap` 机制本身工作正常**（6 条都被如实记录、只出 W5 Warning、没有逼我用错误的词硬套）。但它同时说明：**对实体网络型文档，L0 图会系统性欠表达** —— 6 条缺口意味着 9 条 edge 之外还有大量关系进不了图。

### 3.3 Capacity gap：**12 偏紧，但"明显不够"未被证明**

| | 结果 |
|---|---|
| E | **13 > 12 → `W1` 如期触发**（不是 HARD，符合 v2 定的政策） |
| D | 12/12，但**是压出来的**：为压到 12，我砍掉了 `InitialPlanContext` / `ReplanContext`（文档明说 transient、非持久真相 → 判据 C/D 合法砍）、`DailyPlan[]` legacy（判据 C）、computed views（判据 D）、`DailyReviewPromptDismissal` / `TaskCardView`（判据 D） |

**E 的 13 是"拒绝牺牲决定性内容"的结果**：压到 12 就必须丢掉「有界失败规则」或「撤销/越权边界」之一——这两条正好是 E 的攻击目标。

**诚实结论**：`12` 对**规则密集的操作手册**偏紧（需要 13），对**实体模型**刚好够（12，代价是砍掉边界内容）。**"12 明显不合理"这个结论没有被证明** —— 这符合 v2 的预期（Capacity 只是 heuristic 问题）。

### 3.4 Validator FP / FN

**False Positive = 0** ✅

两篇基线 **HARD 都是 0** —— 正确的产物没有被误拦。两篇的 Warning 也都能逐条解释（见 §1），没有"看起来像误报"的项。

> 值得一提：**D 的 W5 × 6 全部指向同一根因**（实体关系不可表达）。它看起来像"噪声"，但每一行都是真实的能力缺口 —— **这不是 FP，是信号密度问题**。

**False Negative = 1 处（已确证）** ⚠️

| 项 | 内容 |
|---|---|
| 现象 | D 的 `N2 / N3`（导航覆盖 / 可达性）**从未执行** |
| 原因 | `readDocSections` 只识别 `## N.` 形式的标题；D 的小节是 `## Goal` / `## PlanBundle` 这类**词形标题** → 解析出 0 个顶层小节 → 跳过引用与导航校验 |
| 实证 | **M8 在 D 上漏网**（孤立一个顶层小节，validator 无反应）；在 E 上被正常拦住 |
| 性质 | **覆盖缺口，不是静默漏判** —— 状态明确是 `PASS WITH INCOMPLETE VALIDATION`，并列出 `SKIPPED` 段。v2 前加的这条状态区分，正是为了让这种情况**不能**被读成 PASS |

**这条是关键发现**：它意味着**一整类文档（非数字标题）的 Navigation invariant 无法被自动验证**。

---

## 4. Topology 观察（记录，**不升级为 contract failure**）

**D**——**star / DAG，没有主轴**：

```text
        E-01 Goal ──depends-on── E-04 Plan
          ▲                          │
          │                    E-03 PlanBundle ──contains──┬─ E-04 Plan
          │                                                  ├─ E-05 Stage ──contains── E-06 Task
          │                                                  └─(Task 亦由 Stage 含)
   E-06 Task ←── E-07 TaskResult / E-08 FocusSession / E-10 TodayTaskSelection / E-11 PlanChangeSummary
        ▲                                                                        E-06 自环 = 任务依赖图
       (in-degree 6 → I4 收敛)
```

- **没有主轴**，且我**没有人为造一条** —— 图自然呈"以 Task 为枢纽的星形/网状"
- `I4` 报出收敛节点 `E-06`（入度 6）
- `T-07`（视图、遗留与迁移）没有 element → `I5`（合法）

**E**——**分叉流程，三条路径都保留**：

- 4 个并列消费者流程（`processAfterSales` / `refundOrder` / `refundNotify` / `refundQueryCron`）指向同一个订单
- 人工介入路径独立成 element（`E-13` 独立审查与 reviewer 决策）
- 有界失败规则作为 `constraint`（`E-11`）挂在查单流程上
- `I4` 报出收敛节点 `E-01`、`E-09` —— **这正是"没有压成 happy-path"的证据**

两篇**都没有退化成一条链**。

---

## 5. Gate

```text
Gate = PARTIAL PASS
两篇 Fixture 均已 QUALIFIED、建模并跑通；
ER-heavy 一侧的 Navigation 覆盖仍待 validator 修复后复测。
```

**四条通过条件的逐条判定：**

| # | 条件 | 判定 | 依据 |
|---|---|---|---|
| 1 | Semantic gap = 0 | ✅ | 两篇均未需要第 7 类 |
| 2 | Relation gap 可控 | ❌ **D 不可控** | D 6 条（A/B/C 三篇共 3 条）；根因是词汇表无实体网络能力。**但 `relationGap` 逃逸口工作正常**，未发生"用错词硬套" |
| 3 | Capacity 只是 heuristic 问题 | ✅ | E 的 13 触发 `W1` Warning；没有出现"不硬塞就表达不了" |
| 4 | Validator 无明显误报 | ⚠️ **FP = 0，但有 1 处已确证的覆盖缺口** | M8 在 D 上漏网；状态已明确标注 INCOMPLETE |

**为什么不是 PASS**：条件 2 与 4 各有一处未满足；**为什么不是 FAIL**：没有任何一条规则被证伪、没有 Semantic gap、没有 FP、mutation 拦截率 93%，且两处未满足都指向**可修的 validator / 词汇表问题**，不是 Contract 的方向性错误。

**为什么不是 BLOCKED**：两篇 Fixture 都合格并跑完了。

### 需要先修的两件事（修复后应复测 D）

1. **扩展小节解析器**：`## <任意标题>` 都应能被识别为小节锚点（现在只认 `## N.`）→ 修完后 D 的 `N2/N3` 才能跑，M8 才能对 D 生效
2. **决定对实体网络的词汇表回应**（二选一，见 `rule-adjustments.md`）：
   - (a) 接受 `relationGap` 是**设计内的逃逸口**，并把"实体网络型文档会欠表达关系"写成**已知限制**
   - (b) 给 `edges[]` 增加**基数元数据**（`cardinality` / `ownership` 字段），而不是新增第 9 个词

---

## 6. 结论一句话

> **契约没有崩，但它在"实体关系网络"这一类文档上系统性欠表达关系，并且对"非数字标题"的文档无法验证导航。**
> 这两条都不是"规则错了"，而是"规则覆盖不到"—— 与 v1 那次的结论同源：**代理指标与测试目标必须分开看。**
