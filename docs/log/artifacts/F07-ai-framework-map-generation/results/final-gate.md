# Final Gate（F07 · Phase 4 结论）

> 判定基准：`README.md` §14（Gate）/ §11（五类 Quality）/ §12（Validator Gaming）/ §17（最终四问）
> 证据：`run-matrix.md` · `semantic-review.md`（5 篇逐 run 判读）· `stability-analysis.md` · `phase3-artifact-check.txt` · `gateway-safety.md`

---

## 0. Gate 判定

```text
Gate = PARTIAL PASS
```

**一句话理由**：工程链与 Contract 合法性**完美**（15/15 run `HARD 0`、参数与指纹统一、产物零覆盖、N1~N3 真的执行、D 这个最难的 ER 文档建模得很稳）；
但**语义忠实度在 15 个 run 里没有一次达到完整通过**（0/15 Semantic PASS），且失败呈**系统性、可复现**的形状 ——
真实不变量被硬套动词或被静默丢弃，而 validator 全绿看不见；**E（Operational Runbook）这一类文档明显退化**。

---

## 1. PASS 的九个条件逐条核对（README §14）

| # | 条件 | 判定 | 依据 |
|---|---|---|---|
| 1 | Gateway / IO 安全策略有效 | ✅ | `gateway-safety.md` 33/33；15 次真实调用 0 覆盖 |
| 2 | 15 个正式 run 均有完整产物记录 | ✅ | 16/16 run 目录五件套齐全（`phase3-artifact-check.txt`） |
| 3 | 无产物被失败请求覆盖 | ✅ | 每个 run 的 `artifactSha256` 与实际文件逐一致 |
| 4 | HARD failure rate 足够低 | ✅ | **0 / 15 = 0%**（16/16 含 Phase 2 样本）；零传输/解析/截断 |
| 5 | Navigation 无系统性 orphan | ✅（**但含义有折扣**） | 各 run `coverage` 均满；⚠️ 见 §3-①：Topic 与小节 1:1 时 N1~N3 **由构造必然满分** |
| 6 | **无系统性 relation misuse** | ❌ | 见 §2：B 的跨实现一致性被 3/3 硬套动词；C/E 的 `relationGap` 位被自环/伪 gap 占用；D 3/3/4 条 invented relation |
| 7 | 无系统性 forced-chain | ✅ | C/E 零 `depends-on`；D 三次都保住网络形态；A run-03 的单链可对回原文自己的 pipeline 图（UNCLEAR 不判违规） |
| 8 | **核心 semantic anchors 跨 run 稳定** | ❌（fixture 相关） | D 3/7、A 4/6 · C 3/6 · B 3/6 尚可；**E 0/6（无任何 3/3 锚点）** |
| 9 | **D / E 两类极端文档没有明显退化** | ❌（D 合格、**E 明显退化**） | D：12 实体全覆盖、网络形态稳、自环保留 → **没有退化**；E：机制 0–1/3、粒度三变、无稳定核心节点 → **明显退化** |

**为什么不是 PASS**：条件 6 / 8 / 9 未满足，且都不是偶发抖动（跨 run、跨 fixture 稳定复现）。

**为什么不是 FAIL**：任务书 §14 的 FAIL 判据逐条对照 ——

```text
频繁编造关系      → 部分成立（D 3/3/4 条 + B 1 条 + C 3 条 ≈ 14 条 / 15 run），但不属"频繁"到失控；
                    invented **element** 全批 ≈ 0（唯一 1 条低置信）
频繁强行串链      → ✗ 不成立（C/E 零 depends-on；D 保住网络）
大量 provenance 错误 → ✗ 不成立（H2/H3 全 0；仅 C run-03 一处"provenance 未覆盖其依赖声明"）
为了通过 validator 系统性扭曲语义 → ⚠️ **形式成立但意图 UNCLEAR**（见 §2 与 §5）
D / E 明显无法稳定生成 → D 稳定可生成；**只有 E 不行**
```

**为什么不是 BLOCKED**：Gateway / provider / IO 全程可靠（15/15 成功，零重试）。

---

## 2. Validator Gaming（§12 · 独立判定）

**结论：出现了，但形式与任务书预设的五类不同。**

任务书预设的五类（逐类结果）：

| 预设类别 | 是否命中 | 证据 |
|---|---|---|
| ① 乱用 `relates-to` | **命中（D）** | D/run-01 用了 **14 次**、run-02 **15 次**（均触发 W6）；run-03 反向降到 1 次 → 同一关系换词 |
| ② 造边消除孤立元素 | 未命中 | H7 全批 0；逐边核对无"只为救孤点"的边 |
| ③ 为压到 12 而删机制 | **命中（E/run-02，间接证据强）** | elementCount 恰好 12；`REFUND_FAILED`/`10 次`/`越权`/`幂等`/`stockRestored`/`强制补偿` 在产物里 **grep 0 命中**；另两次同预算压力下明确选择超预算保机制 |
| ④ 用语义不准的 known role | **命中（E/run-02 · D/run-01）** | E/run-02 把 `document.role` 的取值 `"current"` 当 element role 用了 **6 次**（⚠️ **W2 抓不到**，因为 `current` 是已知 role）；D/run-01 把 **type 值** `"constraint"` 填进 role 字段（5 次，W2 命中） |
| ⑤ 编造 prerequisite | **命中（D/run-01 · B/run-02）** | D/run-01 两处方向倒置（TaskCardView 当成 Task 的前置）；B/run-02 把"必须发生在…之后"写成 `depends-on` —— **正是 prompt §四唯一写明的反例** |

**两类任务书没预设、但本轮稳定出现的规避形式（更值得记录）：**

```text
⑥ relationGap 被当成"不受检的表达位"
   · C/run-03 把"同一逻辑事实跨 revision 唯一"写成 from == to 的**自环** gap
     —— 契约 §5.4（F09 裁决）明令："为它造自环边只会误导 L0 图""单实体槽位唯一性只登记为
        Structured Constraint Gap，**不进 relationGap**"
   · C/run-02 把跨 7 个载体的删除级联压成一条二元 gap（合规，但最长的一条链在图上完全不可见）
   · E/run-02 的 W5 是一条**伪 gap**（把"实现顺序 vs 运行时调用"读成方向冲突）
   · 而人工登记的真 gap：B 0/3 复现、C 0/3 复现、E 0/3 复现
   → check-map 对 relationGap **只做 W5/W8 计数、不做语义形态校验**，因此全部 PASS

⑦ 边 label 承载"图上不存在的主体 / 规则"
   · C/run-03 e4 的 label 写 "Inbox Worker 通过 lease 取得…"，而 Inbox Worker 在该图 16 个 element 里**不存在**
   · E/run-01 把"连续 10 次失败置 REFUND_FAILED"整条规则塞进 edge.label
   → edge.label 不是受控语义面、不参与任何 invariant；validator 看不见，图读起来却"什么都有"
```

**按 §12 的规则（"如果发生：即使 check-map = PASS，Generation Quality 仍然 FAIL"）**，
命中 ①③④⑤⑥⑦ 的 run 一律判 Generation Quality **FAIL**。

---

## 3. 逐 run 三维分级（README §13 要求的输出形式）

> Technical = 工程链 + Contract 合法性 · Semantic = 语义忠实度（人工判读）· Stability = 该 run 对锚点/拓扑的贡献

| Fixture | Run | Technical | Semantic | 主要语义问题（证据见 `semantic-review.md`） |
|---|---|---|---|---|
| a | run-03 | PASS | PARTIAL | 三层语义写成 `state`（契约登记为 `concept`）；1 处方向错位；A6 无承载 |
| a | run-04 | PASS | PARTIAL | 三层 `state` ×4；`relationGap 0` 而中心关系（递进）图上不存在 |
| a | run-05 | PASS | PARTIAL | 三层 `state` ×3；A6 有 2 条 constraint（三次里唯一） |
| b | run-01 | PASS | PARTIAL | A4 硬套 `validates`；`projection→normalization` 缺边、两步揉进一条边 |
| b | run-02 | PASS | **FAIL** | **G5 违反**（`contains` 只碰 Envelope.value）；顺序当依赖；4 条 `consumes` 标签错配 |
| b | run-03 | PASS | **FAIL** | A4 硬套 `produces`；`relates-to` 漂移（触发 W6）；约束挂到输出侧 |
| c | run-01 | PASS | **FAIL** | 1 条 invented relation；§14/§17 无承载；Topic ≈ 小节标题（4 个零 element Topic） |
| c | run-02 | PASS | **FAIL** | `leaseNext` 动作主体错配；把长链压进 `relationGap` |
| c | run-03 | PASS | **FAIL** | **`relationGap` 自环**（契约明令禁止）；`proposal-validator` 无出边；label 写入不存在的 actor |
| d | run-01 | PASS | **FAIL** | **2 处方向倒置 + 3 条 invented relation**；qualifier 与 note 自相矛盾；`role:"constraint"` |
| d | run-02 | PASS | **FAIL** | 3 条 invented relation；`relates-to` 15 次（W6）；`contains` 与 L395 冲突 |
| d | run-03 | PASS | **FAIL** | 4 条 invented relation + 1 处方向错；漏 `TaskResult→FocusSession` |
| e | run-01 | PASS | PARTIAL | 有界失败规则只存在于 edge.label；越权 0 承载 |
| e | run-02 | PASS | **FAIL** | §12 ③ + ④（`role:"current"`×6）；伪 gap 占位；机制 grep 0 命中 |
| e | run-03 | PASS | **FAIL** | 越权/有界失败 0 承载；聚合元素用"等"字吞掉 `forceRestockAndAssets` |

```text
Technical PASS      15 / 15   （100%）
Semantic  PASS       0 / 15   （⚠️ 没有一次达到完整语义忠实）
Semantic  PARTIAL    5 / 15
Semantic  FAIL      10 / 15
```

---

## 4. 四类文档的失败率排序

| 排名 | Fixture | 类型 | 主要失败形态 | 判定 |
|---|---|---|---|---|
| **1（最差）** | **E** | Operational Runbook | **机制被丢**：异常路径 / 人工介入+越权 / 有界失败 / 资产一致性 **0–1/3**；粒度三变（云函数级→Feature 级→阶段级）**无稳定核心节点**；机制退化成 edge.label 或 Topic 标题 | **明显退化** |
| 2 | **B** | Data / transformation | **关系层忠实度**：跨实现一致性缺口 3/3 硬套动词；流水线分解粒度 1/7/7 节点；inclusion 的 type 三变 | 核心对象稳、关系与粒度不稳 |
| 3 | C | Process heavy | **边缘语义**：编排/约束/放行三种写法；`state` 三次为 0；§14/§17 无承载；`relationGap` 位被滥用 | 骨架稳（8/8 节点 + 4/4 关系）、机制不稳 |
| 4 | A | Concept / Architecture | **类型系统性误判**：三层 `state` 3/3（契约已登记为 `concept`）；A6 承载 1/3 | 覆盖面最好、类型判据错得最稳 |
| **5（最好）** | **D** | ER-heavy / multi-entity network | 关系层发散（动词三变、3/3/4 条 invented relation）；跨实体不变量 `scheduledDate ∈ Stage` **0/3 丢失** | **形态最稳、覆盖最全** |

> **F09 的投入在 D 上得到回报**：Contract 的关系三层模型（type + qualifiers + constraint）让 AI 在**最难的实体网络文档**上
> 稳定产出网络形态、覆盖全部 12 个实体、并保留自环依赖图。**D 不是失败案例，是最好的案例。**

---

## 5. Stop Conditions 命中登记（§16 · **只记录，不边跑边改**）

执行期间**没有**修改 `schema` / `check-map` / Contract / prompt（`promptSha256` 15 个 run 全部一致）。

| 命中的现象 | 出现在哪几篇 / 哪几次 | 是否稳定复现 | 是否登记为后续 Contract issue |
|---|---|---|---|
| **12 budget 反复超出** | A/C/D/E 全部 + B 2/3 → **14/15** | ✅ 稳定 | **是**（"budget 偏紧"有跨文档证据；但也证明 AI 从不主动压缩） |
| **第 9 relation 需求** | A（"递进/单向蕴含"3/3）· B（"必须一致"3/3）· C（"process→state 迁移"、"校验后放行"）· E（同 + "资产成对一致"） | ✅ 跨 4 篇稳定 | **是**（同一批语义类反复出现；**注意**：F09 已裁决不补词，用 `relationGap` 表达 —— 问题在"AI 只在部分 run 如实登记"） |
| **新的 Structured Constraint Gap** | B（跨实现一致）· D（条件唯一）· E（process→state 迁移）· A（阶段递进） | ✅ | **是**（`constraint.parameters` 缺失的影响面比 F09 估计的更大） |
| **qualifier 不够** | C（"校验后放行"无法用 type+qualifiers 表达）· E（调用 vs 消费） | 部分 | 登记（未构成需改设计的证据） |
| **第 7 类 element 需求** | **无**（5 篇都不需要第 7 类） | — | 否（**这是正面结果**） |
| **D/E topology 与人工候选不同** | D：**否**（网络形态一致）· E：**是**（三次拓扑各不相同，且都与人工图的函数级形态不同） | E 稳定分歧 | 登记（E 的粒度选择问题） |

---

## 6. §17 最终四问（**必须有清楚答案**）

### 1. AI 会不会稳定选对"什么值得成为 L0 element"？

**会一半：选得稳"被显式命名的对象"，选不稳"粒度"。**

```text
✅ 稳定：文档里被显式命名的对象 —— A 的 10 个核心节点 3/3；D 的 12 个实体 3/3；
        B 的三个 digest Profile 3/3；C 的 8 个核心节点 3/3
❌ 不稳定：
   · 粒度（E：云函数级 → Feature 级 → 阶段级，三次三变，无稳定 hub；B：流水线是 1 个节点还是 7 个节点）
   · 从不压缩：14/15 run 超过 preferred budget 12（D 达 22–25）
   · 会把手文章节/手法提升为 element（E run-02/03 的 §5/§6/§8；C run-01 的 Topic ≈ 小节标题）
```

### 2. AI 会不会忠实表达原文关系，而不是为了画图或过 validator 编关系？

**不会 —— 这是本轮最集中的失败面。**

```text
✅ 好的部分：invented element ≈ 0（唯一 1 条低置信）；provenance 全可解析；
            forced-chain 基本不存在；C 的 §6 纪律（不把并列投影串成链）3/3 正确
❌ 失败的部分：
   · 硬套动词：B 把人工登记为 relationGap 的"必须一致"3/3 套成 validates/constrains/produces
   · 真 gap 漏登：B 0/3、C 0/3、E 0/3 复现了人工登记的真缺口
   · 编造关系：D 3/3/4 条 + 2/0/1 处方向错
   · 规避表达：把说不清的关系搬进 relationGap（C 自环 / E 伪 gap）或写进 edge.label
   · 同一条关系换词：A 的 Frozen Context→projection 在四个 run 有四种写法
   · 类型系统性误判：A 的三层语义 3/3 写成 state（契约已登记为 concept）
```

### 3. 同一篇文档重复运行，核心设计语义是否稳定存在？

**形状是一致的：**"被显式命名的对象稳定；机制之间的编排 / 约束 / 放行不稳定"。

```text
D  最稳：网络形态 3/3、12 实体 3/3、核心 3 节点（PlanBundle/Task/ReplanContext）3/3
C  骨架稳：核心节点 8/8、核心关系 4/4；但编排主体/约束/放行三种写法
A  覆盖稳：5/6 锚点 3/3、10 核心节点 3/3；但 1 类类型误判 3/3 稳定复现
B  对象稳、词汇不稳：digest 三件套 3/3；流水线分解 1/7/7；inclusion 的 type 三变
E  最不稳：**无任何 3/3 锚点**，跨 run 没有稳定核心节点，只剩章节骨架
```

### 4. Concept / Data / Process / ER / Runbook 五类中，哪一类最容易生成失败？

**E（Operational Runbook）最容易，且是唯一的"明显退化"类。**
第二名是 **B（Data / transformation）** —— 它的失败在关系层（跨实现一致性、流水线粒度）。
**D（ER-heavy）反而是最成功的一类** —— F09 的关系三层模型在这里发挥了作用。

---

## 7. 必须保留的边界措辞（不得读过头）

> 1. **`HARD 0` 只说明 Contract 合法，不说明图是对的。** 本轮 15/15 Technical PASS 与 0/15 Semantic PASS 同时成立。
> 2. **`coverage X/X` 不是 Framework Coverage。** 它是 N3 的导航可达数；在 section 粒度下 N2 与 N3 合并，
>    而且**只要 Topic 与小节 1:1 就由构造必然满分**（C/E 已证）。
> 3. **"报告干净"与"语义完整"不同源**（A/run-04 是唯一 `relationGap 0`、WARN 仅 1 的产物，
>    代价是中心关系在图上完全不存在）。
> 4. **本轮没有修改 Contract / schema / check-map / prompt** —— 所有发现只登记，不改。
> 5. **UNCLEAR 必须保留**：思维链未落盘（reasoning 占 83% 的 completion tokens），
>    因此"硬套动词 / 漏登 gap"是**明知故犯**还是**能力不足**无法判定；
>    所有 gaming 判定只基于产物形态，不基于意图。

---

## 8. 结论一句话

> **这条链在工程上已经成立、在 Contract 上已经合法（15/15 `HARD 0`、零覆盖、零修补），
> 但在语义上还没有成立：AI 能稳定找到"被显式命名的对象"，却在"机制、约束、放行、不变量"这一层
> 反复硬套动词、静默丢弃或搬进不受检的表达位 —— 而 validator 全绿看不见。
> 其中 **Runbook（E）明显退化**，**ER-heavy（D）反而是最成功的**。**

```text
Gate = PARTIAL PASS
```

**F07 尚未完成** —— 按任务书 §17，四个问题已都有清楚答案；但 Gate 未达 PASS，
下一轮应针对"语义忠实度"这一层设计实验（而不是继续调 Contract）。
