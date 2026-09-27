# Semantic Review（F07 · Phase 4 · **人工读原文判读**）

> 判读方式：每个 fixture 一个**只读**评审，读原文 + 3 个 run 的产物 + 人工 candidate map（仅作事后参照）。
> 纪律：每条判断必须能指到原文行号或产物里的具体 label；不确定写 `UNCLEAR`。
> **`check-map = PASS` 不代表语义正确** —— 本次 16 个 run 全部 HARD 0，所以失真只能靠语义判读发现。
>
> **章节顺序 = 评审返回顺序**（A → B → D → C → E 的物理顺序为 B · D · C · A · E）：
> `Fixture B` · `Fixture D`（本轮焦点）· `Fixture C` · `Fixture A` · `Fixture E`（本轮最差）
> → 汇总判定见 `final-gate.md`（逐 run 三维分级 + 四类文档失败率排序）。

---

# Fixture B · Data / transformation heavy

`测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md`

## A. Semantic Anchors

| # | 语义锚点（原文依据） | run-01 | run-02 | run-03 | n/3 |
|---|---|---|---|---|---|
| A1 | 三个 digest 经过**同一条**流水线且**步骤顺序固定**（§3 流水线；§4；§9.1） | ⚠️ 顺序只在 label/命题里，stage 之间**0 条边** | ✅ 严格解析→领域对象→投影→规范化→Envelope→JCS→bytes→SHA-256（含"必须发生在…之后"） | ✅ 串成 L→R 链 | 2/3 |
| A2 | **白名单投影**（§4.3 L90；§5.2 L192/194；§6.2 L259；§7.2 L314） | ✅ | ✅ | ✅（三个 §x.3 排除清单进 Topic 命题而非 element） | 3/3 |
| A3 | **Domain Separation Envelope**（§3.1 L60-67；§8 L332-334） | ✅ | ✅ | ✅ | 3/3 |
| A4 | **跨实现逐字节一致 + 共享同一份 Golden Fixtures**（§10 L393；§12.3 L437；§12 门禁 L445-447）—— 人工 map 在此登记 **relationGap** | ⚠️ 硬套 `validates` | ⚠️ 硬套 4 条 `validates` | ⚠️ 硬套 `constrains` + `produces`（label 里写着"必须产生逐字节相同结果"） | **0/3**（relationGap 三 run 全 0） |
| A5 | **失败关闭**：不合规即拒绝且**不回退** `JSON.stringify/json.dumps`；稳定 reason code（§3 L53；§4.1；§11；§12.7） | ✅ | ⚠️ 保留"不回退"但混类 | ⚠️ **丢掉"不得回退到 JSON.stringify/json.dumps"** | 2/3 |
| A6 | 本文边界（只关闭算法选择；不表示已实现；hash 不是加密也不是授权）（§1 L11；§13 L453；§2 L36；§12.5/6） | ✅ | ✅ | ✅ | 3/3 |

> **A4 是本轮最核心的发现**：人工 map 明确登记「`depends-on` 只表示依赖，表达不了『必须一致』」为 relationGap；
> 三个 run 的 `relationGap` 统计**均为 0**，各自硬套了一个动词（`validates` / `validates` / `constrains`+`produces`）。
> 这正是 prompt G6 与契约 §7.1 第 9 条预告的失败模式：**为了不让 gap 出现，把不变量塞进关系词**。

## B. Faithfulness 计数（Q2）

| 类别 | run-01 | run-02 | run-03 |
|---|---|---|---|
| Invented element | 0 | 0（`strict-parse` / `domain-object` 语义重叠 1 处） | 0 |
| Invented relation | 0 | **1**（`jcs --depends-on--> normalization`，顺序 ≠ 依赖） | 0 |
| Wrong relation direction | 0 | 0 | 0 |
| Unsupported prerequisite | 0 | **1**（同上） | 0 |
| Wrong concept/state classification | 0 | 0 | 0 |
| contains ↔ reference 混用 | 1（轻度） | **1（明确违反 G5）** | 0 |
| 其他定性缺陷 | `projection→normalization` 缺边；e3/e4 共用一个 label | `strict-parse` role=boundary；4 条 `consumes` 的 label 与 type 错配 | `relates-to` 词汇漂移；冗余 `controls`；约束挂错侧 |
| **relationGap** | 0 | 0 | 0 |

## C. Validator Gaming（PASS 也查）

| 玩法 | run-01 | run-02 | run-03 |
|---|---|---|---|
| 乱用 `relates-to` | 无（0 次） | 无（0 次） | **有（轻）**：3 次，且**不是**词表不够，而是把 run-01/02 用 `depends-on` 表达的同一内容换了词 → 触发 W6 |
| 造边消孤立 | 无 | 无 | **有（轻）**：三条 profile 本已连上，仍各造一条 `controls→projection`（零新增信息） |
| 为压 12 删机制 | **无**（已逐条核对差异：少的正是"步骤节点化"，机制仍由 label/命题承载） | 无 | 无（反向超编） |
| 语义不准的 known role | 无 | 有（轻）：`strict-parse` = process + `boundary` | 无（`semantic-level` 是 §2 已登记用法） |
| 编造 prerequisite | 无 | **有**（顺序当依赖） | 无 |

**粒度策略差异（不是造假）**：run-01 = 把 5 个步骤折进中心节点 + 用 label/命题承载；run-02 = 接近纯链；run-03 = 枚举过度（每个 concept/constraint 单独成点）。
**没有任何 run 真的"删机制"或"造节点凑 12"。** 风险在粒度策略，不在是否说真话。

## D. 结构观察（Q5）

```text
run-01（12/12）星—廊道混合：hub「唯一处理流水线」出度 6，JCS→bytes→SHA-256 只存在于 hub 的 e4 label；
               保留了"只有一个流水线"的形态，但丢掉了流水线的连线形态（stage-to-stage 0 条边）
run-02（14/18）近乎纯链 + 3 个 validates 分支 + 4 条 validates(fixtures) + 3 条 inclusion
run-03（18/15）单链 + 三扇出 + 双汇入
```

**跨 run 稳定的**：三个输出 digest、Envelope、JCS、UTF-8 bytes、SHA-256、Golden Fixtures，以及 3 条 inclusion 的方向（3/3 一致）。
**跨 run 不稳定的**：流水线分段粒度（1 / 7 / 7 个节点）、inclusion 关系的 type（`depends-on` / `depends-on`+reference / `relates-to`）、是否使用 `contains`、非目标与安全边界是否 element 化。
→ **核心对象稳定、关系词汇不稳定、缺口登记完全缺失。**

**edges 12/18/15 vs 人工 6 的判定**：**不是过度连边，但确实存在"同一信息多重编码"**。
(a) 人工 6 条是 stage 边、4 类约束走 attachment；生成 run 把 profile 归属 / gate / 顺序 / 共享 fixture 都做成边；
(b) 生成边多数能在原文找到落点（§3 序列、§5.2/6.2/7.2 白名单、§10 向量、§12 门禁），不是无源造边；
(c) run-03 的 3 条 `controls` + run-02 的 4 条 `validates` 属冗余（label 与 element label 重复）→ 冗余占比约 run-02 4/18、run-03 3–8/15。
**三 run 都没有把 DAG 压成假主轴。**

## E. Coverage（Q3）

**Framework Coverage（F1~F3）**：HARD = 0，H1/H2/H3/H4/H6/H7/H8 都真正执行（无 SKIPPED 段）—— type 全在词表内、provenance 全部命中 `readDocHeadings` 的 key 集合、edge 端点存在、主轴无 concept/constraint、无孤立元素。
但 check-map **不检查语义**：三 run 的 `relationGap = 0` 也在"契约合法"范围内成立 → **不能**读成"主要机制都表达对了"。按锚点：A1 2/3 · A2 3/3 · A3 3/3 · **A4 0/3** · A5 2/3 · A6 3/3。

**Navigation Coverage（N1~N3）**：N1 ✓（5/5、10/10、10/10 个 Topic 都有 sectionRefs）；N2 ✓（§1…§13 共 13 节被 entrySet 覆盖 13/13）。
**N3 在 section 粒度下与 N2 是同一件事**（契约 §1 已声明）：`universe` 与 `reachable` 都取自同一个 heading tree → 只要 N2 通过，N3 必然 0 unreachable。
所以 `coverage 13/13` **不是独立证据**；它的分母是**顶层小节**，不看 §4.1–§4.8、§x.3 排除清单等 subsection。

**可度量事实（不是百分比）**：完全**没有 L0 element 挂靠的 Topic** 数 = run-01 `0/5`、run-02 `4/10`、run-03 `1/10`
→ run-02 有 4 个 Topic 在图上没有 L0 落点（Topic → element 的信息密度明显变稀）。

## F. 结论 + 最值得记录的失败样本

**一句话**：三份产物在结构契约层**全部诚实可用**（无造词、无孤立、方向全对、provenance 全真实），但**全部在同一处系统性失手 —— 把"两端必须与同一份 Golden Fixtures 逐字节一致"这个已登记的缺口用 `validates` / `constrains` / `produces` 硬套过去（relationGap 三 run 全 0）**；且 run-01 与 run-03 呈现"中心节点压缩"与"枚举 + 冗余连边"两种相反的粒度策略 → **粒度控制仍不稳定**。

**失败样本（按严重度）**

1. **A4 硬套动词（3/3 同错）**：人工 map 的 relationGap「TS / Python 两端必须与同一份 Golden Fixtures 产生逐字节相同结果 / `depends-on` 表达不了『必须一致』」，而三份产物 `relationGap 0 · gapDensity 0`；run-03 更写成 `produces`，label 里"必须产生**逐字节相同**结果"直接暴露第 3 层不变量被当成关系。
2. **run-02 的 `contains` 违反 G5**：`semantic-normalization --contains--> canonical-digest-envelope`，label 自承"对 Envelope.**value** 执行 NFC"，而同图 `e-projection-envelope` 才是 Envelope 的 produced + `ownership: owned` → 与 G5/§5.2 边界直接冲突。
3. **run-02 把顺序当依赖**：`jcs --depends-on--> normalization`（"必须发生在…之后"）—— 与 prompt §四唯一写明的反例同型。
4. **run-03 的 `relates-to` 漂移（触发 W6）**：三条 `relates-to` + `ownership: reference` 承载的内容与 run-01/02 的 `depends-on` 完全相同 → **W6 的措辞（"兜底词一多说明词表不够用"）在 B 上被误读**：这是"同类关系换词"，不是"词表不够"。
5. **run-03 约束挂错侧**：`hash-not-encryption`（§2 L36，约束的是"不得纳入**输入**"）`attachedTo: ["wire-digest"]`（输出）。
   附带**现象登记**：`check-map` 的 H7 把「只出现在 `attachments[].elementId`」也算参与关系（`inAtt` 含 `a.elementId`），因此这种**无 host 的悬挂约束**不会被判孤立 → 判据面偏松（只登记，不改 Contract）。
6. **run-01 的真实性代价**：`projection → normalization`（§3 第 1→2 步）**无边**，e3/e4 共用一条 label → 为守住 12/12 把两个语义不同的步骤揉成一条边（属建模取舍，机制未丢）。

**UNCLEAR（必须诚实登记）**：三次 run 的思维链未被保存（`raw-response.txt` 只含最终 JSON，run-meta 显示 reasoning_tokens = 14578 / 36289 / 23659），
因此**无法判定动词误用是"明知故犯地过 validator"还是"语义能力不足"** —— gaming 判定只基于产物形态，不基于意图。

---

# Fixture D · ER-heavy / multi-entity network（本轮焦点文档）

`测试文档/fixture-d-goal-plan-task-state-model.md`

## 焦点问题的答案（任务书指定的两个核心问题）

**① AI 是否稳定保持多实体网络？→ 是，三次 run 都没有压成链。**

```text
elements 23 / 22 / 25     edges 39 / 30 / 29     （人工 candidate map：12 / 11）
稳定 hub：PlanBundle（度 12 / 11 / 12）· Task（10 / 7 / 7）· ReplanContext（6 / 5 / 6）
度 > 1 的收敛节点三 run 共有：planBundle · Task · Goal
叶子节点仅 1–2 个；三 run 都含 1 条 task→task 自环边
```

**② 12 个人工实体是否都被覆盖？→ 全部覆盖，没有漏关键实体、没有把实体拆成碎片。**

差异只在粒度与边界：

```text
· run-02 / run-03 把 TaskCardView + Computed views 合成 1 个 element；run-01 只留 TaskCardView
· 12 个实体里唯一三 run 都未立 element 的是「生命周期状态集合」（隐含在 topics / labels）
· 三 run 都额外把 Initial planning / Replanning 立为 process 节点（人工图刻意不立：transient、非持久真相）
  → 与人工 candidate map 的判据 C/D 系统性分歧，且 ReplanContext 在三次里都是 top-4 hub
· 三 run 都把 DailyPlan legacy 立成 element（人工图刻意只作变更边界）
```

## ③ relationGap 1/0/0 的性质：**不是硬套动词，是真丢语义**

| 人工 map 登记的缺口 | AI 的处理 | 判定 |
|---|---|---|
| Task 依赖必须无环（成对锚定不变量） | 三 run 都退化成 **`constraint` element**（label 里写了 acyclic / no cycles） | **形态可辩**：契约 §5.4 说复杂不变量属 Constraint 语义，用 constraint 元素表达本身是合规的第 3 层表达；但它**没有**按 relation 层登记，人工的 relationGap 因此消失 |
| `scheduledDate ∈ Stage 区间`（原文 **L395 / L468**） | **三 run 全部零表达**（run-01 的 `planStructureConstraint` 只提 `detailedThrough` / Stage 覆盖 Plan 窗口，未命中该不变量） | ❌ **真实语义丢失**（原文明确写了的不变量，图上无处可寻） |

> 结论：D 的 `relationGap` 从 2 降到 0–1 **不是"关系模型变好了"**，而是**一条被改写成 constraint（可辩）、另一条直接消失（不可辩）**。

## B. Faithfulness 计数（Q2）

### B-0 口径修正（评审自查后订正，必须按此读）

```text
❌ 不写 "Invented element = 4 / 3 / 4"
✅ 改写为 "Extra element beyond candidate map（全部有原文依据）= 6 / 6 / 7"
   真正无原文依据的 element = 0 / 0 / 0
```

三次 run 都额外立了人工 map 刻意不立的节点，但**每一个都能指到原文行号**：

| 额外节点 | 原文依据 | 人工 map 为何不立 |
|---|---|---|
| InitialPlanContext / ReplanContext | L63–93 / L80 · L95–147 / L138 | transient，非持久真相（判据 C/D） |
| Initial planning / Replanning（process 节点） | L63–75 · L95–123 | 人工只在 thesis 叙事里提 |
| DailyPlan legacy boundary | L751–771 | 人工只作变更边界 |
| TaskCardView / Computed views / Task Card pure selector | L558–582 · L55–57 / L780–801 · L560/582 | 判据 D（computed view 不是持久真相） |

→ **这是"与人工建模取舍的分歧"，不是捏造。** 真正的发明在**关系层**（见下）。

### B-1 逐 run 计数（修正后）

| 类别 | run-01 | run-02 | run-03 |
|---|---|---|---|
| Extra element beyond candidate map（有原文依据） | 6 | 6 | 7 |
| **真正无依据的 element** | **0** | **0** | **0** |
| **Invented relation** | **3** | **3** | **4** |
| **Wrong relation direction** | **2** | **0** | **1** |
| Unsupported prerequisite | 0 | 0 | 0 |
| Wrong concept/state classification | 2 | 2 | 2 |
| contains ↔ reference 混用 | 1 | 1 | 1 |
| 关系不变量落进 `relationGap` | 0 | 0 | 0 |

**具体条目（评审给出的证据）**

```text
run-01  Invented relation / 方向倒置：
  · e29 dailyReview --relates-to--> plan          —— 原文 L605 未声明两者关系
  · e37 taskCardView --depends-on--> planBundle   —— 方向倒置（由 Task 状态派生 ≠ 前置）
  · e38 taskCardView --depends-on--> task         —— 同上
  · e4 plan --depends-on--> goal：cardinality 写 {zero-or-many → one}
    而 note 写 "A Plan belongs to one Goal" → qualifier 与 note 自相矛盾（L262）
run-02  · e-ctx-init-goal / e-ctx-replan-*：把 contains 降级成 relates-to（L80–84 / L138–147）
        · e-summary-bundle（relates-to）—— L716 / L748
        · e-stage-task 写 contains(zero-or-one) 却引 "every initial Task belongs to one Stage"（L395/L510）
        · e-task-depends-task：cardinality many→many，丢掉"满足 = done"（L541–543）
run-03  · e_replanning_produces_bundle 与 e_replan_context_bundle、run-01 的 consumes 方向互冲（L113）
        · e_task_card_view_bundle / e_daily_review_bundle / e_replanning_produces_summary（L605/L782）
        · e_initial_context_goal：cardinality {zero-or-many → one}（把单实例当类型，L80–84）
        · e_task_stage（depends-on, zero-or-one）—— L395/L510 被弱化
        · 漏 TaskResult → FocusSession（L597）
```

**run-01 的另两处（在 B-0 的额外节点之外）**：`Stage --contains(one-or-many)--> Task` 把 `Task.stageId?`（L510 可选引用）升级成 owned 归属，且 L395 零表达。

## C. Validator Gaming（PASS 也查）

**五类均未发现**，包括"为压 12 删机制"（三 run 都远超预算）。
反向的"拆侧面凑表达"只在 run-01 / run-03 的 constraint 元素分片上轻度出现。

**值得记录的一处非 gaming 缺陷**：run-01 的约束元素 `role` 用了 `"constraint"` —— 那是**类型名而不是 role 名**，不在 `x-known-roles` 里 → 触发 **W2×5**；run-03 改用 `boundary` 绕开了。
（即：**AI 把 `type` 词表的值填进了 `role` 字段**。这不违规到 HARD，但说明它对"type / role 两层"的理解不稳。）

## D. 结构观察（Q5）· 跨 run 不稳定性（重要）

```text
同一条关系的动词在三次 run 之间发散：
  stage → Task        run-01 relates-to   run-02 contains   run-03 depends-on
  replanning ↔ PlanBundle 的 produce/consume 方向  run-03 与 run-01 相反

兜底词用量：relates-to  14 / 15 / 1     depends-on  13 / 4 / 20
  → run-01/02 大量使用 relates-to（触发 W6）
  → run-03 零 relates-to，却把全部引用型关系写成 depends-on = **"反向规避兜底词"**
     ⚠️ 这说明 W6（relates-to > 1）**可以被反向绕过**：不用兜底词改滥用 depends-on，W6 就不会响。
        只登记现象，不改 Contract/validator。
```

## E. Coverage（Q3）

**Navigation Coverage 真实成立**（独立核对）：三 run 的 `check-map` 均为 `SKIPPED (0)` · 状态 PASS · `coverage 21/21` · unreachable 0；
21 个顶层 §key 全部可解析、无悬空、无未引用小节。N1 / N2 / N3 都真正执行。

**Framework Coverage**：HARD 0，但同样不能读成"语义正确" —— 见 B 的 3 处可指名错误（它们全部 PASS）。

## F. 结论

**一句话**：D 的多实体网络形态**稳定**、12 个实体**全部覆盖**，但**"忠实"只到结构层**：
一条已登记的跨实体不变量（`scheduledDate ∈ Stage 区间`）在三次 run 里**全部消失**，
Stage→Task 的归属语义被从"可选引用"升级成 `owned`（与 L395 冲突），且 run-01 出现两处**方向倒置**——
这些全部发生在 `check-map = PASS` 的情况下。

---

# Fixture C · Process heavy

`测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md`

## A. Semantic Anchors

| # | 语义锚点（原文依据） | run-01 | run-02 | run-03 | n/3 |
|---|---|---|---|---|---|
| A1 | Candidate 是**外部候选观察**，不是内部画像事实、更不是写入命令（L5 / L65） | ✅ 逐字保留"外部候选观察" | ✅ | ⚠️ **无该 element**（只在 topic 命题与边 label 里） | 2/3 |
| **A2** | **Mastery 与长期 Memory 是同一 `FusionLearningFact` 派生的不同投影；Mastery 更新不是 Agent / Memory Consolidation 的隐式前置**（L39；Contract §6） | ✅ 两条独立出边，**无跨支边** | ✅ 同构 | ✅ 同构 + 命题逐字复述 | **3/3 ✅** |
| A3 | 两支机制都必须在图上活着（L311–330 · L332–366） | ✅ 三节点三边齐全 | ✅ | ✅ | 3/3 |
| A4 | **接收 ≠ 处理完成**：`accepted` ≠ `processed`（L134）；Receipt = 可靠持久化（L121–130） | ⚠️ 只在 edge label / 命题里 | ✅ `receipt` element + 边 | ✅ `receipt` element + 边 | 2/3 |
| A5 | 四类 confidence 不是通用分数（L70–98） | ✅ 一个聚合 concept | ✅ | ✅ | 3/3 |
| **A6** | **§8 是一台状态机**（`pending → processing → processed / retry_scheduled / dead_letter / discarded`，L244–264）；人工 map 明确要求 `type = state` | ❌ `state` = 0 | ❌ `state` = 0 | ❌ `state` = 0 | **0/3 ❌** |

### ⭐ A2 是本轮最重要的**正面**结论

> Contract §6「不要强行串链」那条最贵的纪律**通过了**：三次 run 都**没有**把 Mastery 支与 Memory 支错画成上下游链。
> 没有任何边形如 `mastery-projector → memory-surface` / `mastery-projector → proposal-agent`；
> `processing-outcome` 是所有支的共同汇点而**不是**某支的前置；run-02/03 甚至把这句话写进了 topic 命题。
>
> **即：Feature 05 当年连续两版都犯的那个错，AI 三次都没有复现。**

弱化形态（登记，不等于串链）：run-01 加了唯一一条 `controls`（`inbox-worker --controls--> candidate-projection`）把"后台编排"压成一个控制关系。

## B. Faithfulness 计数（Q2）

| 类别 | run-01 | run-02 | run-03 |
|---|---|---|---|
| Invented element | 1（`inbox-worker`，从 §3 mermaid 反推，薄） | 0 | 0 |
| Invented relation | 1（`e-worker-controls-projection`，原文未声明控制权） | 1（`leaseNext` 动作主体错配） | 1（label 写入**不存在的** `Inbox Worker` 主体） |
| Wrong relation direction | 0 | 0 | 0 |
| Unsupported prerequisite | 1（同 controls 边，弱） | 0 | 1（`e16` 的 provenance 只挂 §7.1，讲依赖的 §5.1/§9 未挂） |
| Wrong concept/state classification | `state`=0；§8 状态机降级成 process；3×`role:"constraint"` | `state`=0；`constraint` 3→1；4×`role:"authority"` | `state`=0；`constraint` 只剩 1；§4.1/§4.2 provenance 漏 |
| contains ↔ reference 混用 | 0（**完全没用 contains**） | 0 | 0 |
| **relationGap** | 0 | 1（自环 ∨ 真 gap 两读） | 1（`fact → fact` 自环） |
| 人工登记的两条真 gap 被复现 | 0 | 0 | 0 |

**三次共同项**：`type: state` **三次全为 0**；`contains` **三次全部未使用**；人工的两条真 gap **0/3 复现**。

**未被任何 element 承载的顶层小节**：run-01 §14/§17/§18 · run-02 §8/§14/§16/§18 · run-03 §2/§8/§14/§16/§17
→ **§14（幂等/并发/失败恢复）与 §8 三次全部落空。**

## C. Validator Gaming（PASS 也查）

| 类别 | run-01 | run-02 | run-03 |
|---|---|---|---|
| ① 乱用 `relates-to` | **无**（0 次） | **无**（0 次） | **无**（0 次） |
| ② 造边消孤立 | 无 | 无 | 无 |
| ③ 为压 12 删机制 | 无（18 el，反向超编） | 无（17 el） | ⚠️ 有减配，但**不是为压 12** |
| ④ 语义不准的 known role | 无 | 无 | 无 |
| ⑤ 编造 prerequisite | 1（轻度） | 无 | 无（是 provenance 没挂全） |

**③ 的真实形态（比 W1 更值得记录）**：三次 run 的 element 数**单调下降 18 → 17 → 16**，删掉的正是"独立机制"：

```text
Inbox Worker（§3 L49 / §8 L244–264）      run-01 有 → run-02 ❌ → run-03 ❌
§6.3 单一权威后端（L161–165）              run-01 constraint → run-02 constraint → run-03 ❌
§16 删除沿引用链级联（L456–466）            run-01 constraint → run-02 relationGap → run-03 ❌
§9 用户作用域隔离（L266–283）               run-01 constraint → run-02 ❌（仅 topic） → run-03 constraint
```

而三次 `meta.note` **都自述"未为凑数而造节点 / 保留机制而不压缩"**。
→ **不是"压到 12"，是"逐轮漂移成更省 element 的抽象"。** W1 既分不清"删的是机制还是噪音"，也看不见"§6.3/§16 的 constraint 从图上消失了"。

## D. 结构观察（Q5）

**核心节点 8/8 稳定、核心关系 4/4 稳定**（三次命名不同但指向同一对象）：Candidate/Inbox/FusionLearningFact/MasteryEvidenceProjector/ProposalAgent/ProposalFactProposal/Validator/MemorySurface/ProcessingOutcome/DiagnosisRecord/ConfidenceModel。

**不稳定的恰好是"机制之间的编排与控制"**：

| 对象 | run-01 | run-02 | run-03 |
|---|---|---|---|
| Inbox Worker | process 节点 | 消失（并入 projection） | 消失（只在 topic） |
| Memory 侧 | `artifact` | `process`+`artifact` | `process`+`artifact` |
| 接收 → 投影 | `controls` | `consumes` | `consumes` |
| 删除级联 | `constraint` element | `relationGap` | 无 |
| 「验证通过后放行」 | edge label | edge label | **无表达（Validator 无出边）** |

### ⭐ Topic 12–15 vs 人工 6：是"小标题列表"，不是"更细的导航"

| | run-01 | run-02 | run-03 |
|---|---|---|---|
| Topic 数 | 15 | 12 | 12 |
| 与顶层 `##` 小节一一对应的 Topic | **13 / 15** | 6 / 12 | 6 / 12 |
| `sectionRefs` 只有一个 §N 的 Topic | **11 / 15** | 0 | 1 |
| **完全没有 element 的 Topic** | **4** | 1 | 3 |

**连锁效应（C 的最重要发现）**：check-map 的 N2/N3 用 `topic.sectionRefs ∪ document 入口` 作为"入口全集" →
**只要给每个 `## N.` 各造一个 Topic，N2/N3 就自动全绿，完全不需要任何 Topic 挂 element。**
run-01 的 4 个零 element Topic（含 `idempotency`、`observability`）正是这条路径的产物。
→ **`coverage 19/19` 的含金量由 Topic 的粒度决定，不由图的结构决定。**

（`W3` 只判 `topics.length > 10`，不检查"Topic 数 ÷ 顶层小节数 ≈ 1"，也不检查零 element Topic 的比例 → 两种完全不同的形态给出同一条警告。现象登记。）

## E. Coverage（Q3，两类分开）

**Framework Coverage（人工逐机制清点，无数字）**

```text
run-01  最宽：主流水线 + 3 条约束齐全；但 §14 全空、§7 五表压成 1、§8 无类型位置
run-02  中：主流水线完整、Receipt/Memory 编排最细；但 §8/§16 无机制承载、constraint 只剩 1
run-03  最薄：§6.3 / §16 / §17 三条不变量级内容只以 Topic 命题存在，Validator 无出边
三者共同：§14 与 §17 三次全部不在图上
```

**Navigation Coverage**：N1~N3 三次都真的执行（`SKIPPED (0)`、无 W0、粒度 `section (provisional)`）→ 没有出现 F09 记录的那种"N2/N3 被跳过却显示 PASS"的假阴性。三次都是 `19/19`。

**但 19/19 的性质**：`reachable` 是 `document 入口 ∪ element.sectionRefs ∪ topic.sectionRefs` 的**并集** → 一节只要被**任何** Topic 或 element 提过一次就算"有路径"。
于是出现：

```text
完全没有 element provenance 的顶层小节：run-01 §14/§17/§18 · run-02 §8/§14/§16/§18 · run-03 §2/§8/§14/§16/§17
而三次 N3 都是 19/19（由 Topic 的 sectionRefs 兜住）
```

→ **Navigation Coverage 三次都满分，而三张图在 elements（18/17/16）、edges（18/18/16）、constraints（3/1/1）上差异很大。**
在这个粒度下，N1~N3 对"每节一个 Topic"的产物是**结构性必过**的：它验证的是"小节 ↔ Topic 索引完整"，不是"内容有承载"。

```text
A 类 Framework Coverage   run-01 最宽 / run-02 中 / run-03 最窄     ← 无数字，人工逐机制
B 类 Navigation Coverage  三次均 19/19（N3）                        ← 有数字，但由 Topic 粒度决定
🚫 不得合成 "coverage = 100%"
```

## F. 结论 + 三个最值得记录的失败样本

**一句话**：**Contract §6 那条最贵的纪律通过了**（A2 = 3/3，AI 没有复现 Feature 05 的串链错误），经典 gaming（兜底词、contains 误用、造边消孤立）也全部为零；
但同一张图在三次独立生成里把"编排 / 约束 / 放行"这一层画成了三种不同的样子 —— **§14 幂等与失败恢复、§17 可观测性三次全都只以"Topic 标题"存在，`type: state` 三次全部为 0，人工登记的两条真 gap 三次全部漏登，而 check-map 三次都是 `HARD 0 · WARN 3 · PASS · coverage 19/19`。**

**样本 1 — §14 与 §17 在图上彻底不存在，但 N2/N3 全绿（三次一致）**

run-01 为 §14 造了一个 Topic，命题写得相当准确（"每个阶段拥有独立幂等键与 revision…把可隔离失败与已提交状态分开处理"），
但 **没有任何 element 引用这个 Topic**（check-map 自己列为 `i I5 idempotency 没有 L0 element（合法）`）。
原文 §14 有 6 行幂等维度表 + 5 条规则，§17 有 5 项可观测性要求 —— 三张图上**没有 element、没有 attachment、没有 edge**。
而 check-map 输出：

```text
coverage      19/19 有路径（本粒度内）
SKIPPED (0)   （无 —— 本次全部检查都已执行）
结果: HARD 0 · WARN 3 · INFO 18     状态: PASS
```

→ **「§14/§17 的内容在图里不存在」与「Navigation Coverage 19/19」可以同时为真。**
validator 的 PASS 与"可靠性机制这一整块有没有进图"是**正交**的。

**样本 2 — `relationGap` 被当成"不受检的表达位"（run-03 自环 / run-02 长链替代）**

run-03 把"同一逻辑事实跨 revision 的版本替代"写成 `from: fusion-learning-fact, to: fusion-learning-fact` 的**自环 gap**。
这正是 Contract §5.4（F09 裁决）明令不要做的事：「为它造一条 `DailyReview ──???──> DailyReview` 自环边只会误导 L0 图」「单实体槽位唯一性只登记为 Structured Constraint Gap，**不进 relationGap**」。
而 `check-map` 对 `relationGap` **只做 W5/W8 计数、不做语义形态校验** → `HARD 0 · PASS`。
run-02 则把跨 7 个载体的删除级联链压成一条二元 gap（合规，但**这篇文档最长的一条链在图上完全不可见**）。

→ **AI 找到了一个既不用造错词（§0 防的）、也不用串错链（§6 防的）的规避路径：把说不清的关系整体搬进 `relationGap`。**
三次 run 里人工登记的两条真 gap 一条都没复现，而 `relationGap` 位被别的内容占用了。

**样本 3 — 边 label 里出现图上不存在的 actor；以及"悬挂的校验者"（run-02 / run-03）**

```json
run-03 e4: { from: "candidate-projection", to: "candidate-inbox", type: "consumes",
             label: "Inbox Worker 通过 lease 取得并处理 Candidate" }
```

`Inbox Worker` 在 run-03 的 16 个 element 里**不存在**。同类：run-02 的 `e_projection_consumes_inbox` 把 §6 L143 的 `leaseNext`（`CandidateInboxStore` 端口操作，执行者是 Worker）挂到了投影节点上。
同时 run-03 的 `proposal-validator` **只有入边、没有任何出边** —— 原文「验证失败的 Proposal 不进入 Memory」没有下游语义，正是人工 map 专门登记 gap 的那一条。

→ **`edge.label` 不是受控语义面，也不参与任何 invariant。** 当 AI 需要一个元素/关系来满足"能连上"却又不愿新增 element 时，它把那个主语写进 label：validator 看不见，图读起来却"什么都有"。

**附：与 check-map 输出的差异登记（只登记，不改 Contract）**

```text
1. 三次 W1（18/17/16）与 W3（15/12/12）是同一批产物的两种症状：element 与 Topic 同步偏高，
   而 Topic 偏高与"每节一个 Topic"一一对应。
2. run-01 的 W2（role:"constraint"×3）与 run-02 的 W2（boundary×2）是同批 role 的两种用法；
   run-03 的 W2 = 0 **不代表语义更准**（它同时是 constraint 最少、机制承载最少的一次）。
3. run-01 的 INFO 18 与 run-02 的 INFO 4 之差**不是质量差异**，是"Topic 与小节 1:1"的副作用 ——
   I5/I6 的数量实际上是"Topic 是否等于小标题"的代理指标。
4. 三次 relationGap 的**语义形态**不进入任何 invariant；gapDensity（0 / 0.05 / 0.06）远低于 W8 阈值 0.5，
   所以"两处真 gap 漏登 + 两处伪 gap 登记"完全落在 W5/W8 的盲区外。
```

---

# Fixture A · Concept / Architecture heavy

`测试文档/18-context-consumption-semantic-model.md`（540 行 · 15 个顶层小节 `§一`–`§十五`）

## A. Semantic Anchors

| # | Anchor（原文依据） | run-03 | run-04 | run-05 | n/3 |
|---|---|---|---|---|---|
| A1 | 三级递进且不可互相替代（L9–37、L178–189、L312–318 的 5 种布尔组合表） | ✅ 三个 state element + 约束 | ✅ | ✅ | **3/3** |
| A2 | Context Influence 不作为第四级（L39–51、L229–278） | ✅ | ✅ | ✅ | **3/3** |
| A3 | 两条链分离、不可互相替代（`Consumption ≠ Output Alignment`，L53–93） | ✅ | ✅ | ✅ | **3/3** |
| A4 | 消费点与投影链（Frozen Context → projection → Attempt → Revision → scene）（L176、L387–398、L471–492） | ✅ | ✅ | ✅ | **3/3** |
| A5 | 判定证据（Attempt 级实际使用；Prompt/调用/成功返回不算）（L161–201、L453–467） | ⚠️ 仅 Topic 命题 | ⚠️ | ⚠️ | **3/3（但 element/relation 承载 = 0/3）** |
| A6 | 消费不要求盲目服从 / 不要求输出明显不同（L203–227） | ❌ | ❌ | ✅ | 1/3 |

> **注意 A5/A6 的口径**：人工 candidate map 同样把这两条放在 Topic 命题层（T-03/T-05），
> 所以按"element/relation 承载"统计是 0/3、1/3；若改按 Topic 口径统计则都是 3/3。
> **本表按任务口径（element/relation 承载）判**，差异必须如实标注。

## B. Faithfulness 计数（Q2）

| run | Invented element | Invented relation | Wrong direction | Unsupported prerequisite | concept/state 错 | contains↔reference 混用 |
|---|---|---|---|---|---|---|
| run-03 | **0** | **0** | **1**（`frozen-context --produces--> projection`：把派生动作归给 artifact 而非 route/服务端） | **0**（一条 `depends-on` 都没有） | **1 类 / 3 element** | 0 |
| run-04 | **0** | **0** | **0** | **0** | **1 类 / 4 element** | 0 |
| run-05 | **0** | **0** | **0** | **0** | **1 类 / 3 element** | 0 |
| （备注）run-02 | 0 | 0 | 0 | 0 | 1 类 / 3 element（三层写成 **process**） | 0 |

**A 是五个 fixture 里"编造关系"最少的一个**（几乎为 0），但有一处**稳定复现**的类型误判（见 F）。

## C. Validator Gaming（PASS 也查）

```text
① 乱用 relates-to    无（四个 run 的 relates-to 出现 0 次；四份 check-map 都无 W6）
② 造边消孤立          无（H7 全 0，且逐边核对无"只为救孤点"的边）
③ 为压 12 删机制      无（14 / 15 / 16 / 15 —— 四 run 全部 > 12，没有一次向 12 靠拢）
                     三次 run 的共同核心是 10 个同义节点，各自多出的 4–6 个都能指回不同小节，
                     且**没有同义重复对** → 属"如实多列"，W1 在这篇上更像"budget 偏紧"
④ 语义不准的 known role  无确凿命中（role 全部命中 x-known-roles，无 W2）
⑤ 编造 prerequisite   无（run-03/04/05 一条 depends-on 都没有；三层递进如实写进 relationGap 而**没有**编成边
                     —— 这是**反 gaming 的正证据**）
```

**唯一值得单独登记的现象（run-04，动机 UNCLEAR，不判 gaming）**：run-04 是全批唯一 `relationGap 0 · gapDensity 0`、WARN 仅 1 的产物，
代价是原文中心关系（三层递进）在图上**完全不存在**（只在 Topic 命题里）。
它没有误用任何动词、也与人工 map 的形态一致 → 只登记为 **"PASS 的干净程度与语义完整度在这一处不同源"**。

## D. 结构观察（Q5）

```text
run-03  纯单链 6 节点（check-map 无 I4）—— 把"两条链不互相吞并"读成了一条线，
        且没有任何边/挂点承载 §十四"两者在 outline revision 处衔接"（L515）
run-04  收敛 DAG —— 最接近原文机制形态："两链在 outline revision 处衔接"被画成两条出边；
        代价：原文显式区分的 `Outline Generation Request`（L443–445）被并进 route 节点
run-05  小 DAG（一个菱形）—— 与原文 §九 figure 吻合；Output-side 缺 `Generated Lesson`（与人工 map 一致）
```

**跨 run 稳定性**：核心 10 节点 **3/3 稳定**；核心关系 3 条稳定（`Attempt→consumes→projection`、`Attempt→produces→Revision`、`Scene→consumes→Revision`）。
**最不稳定的两点**：

```text
① `Frozen Context → generation-facing projection` 在四个 run 有**四种写法**：
   run-03 frozen-context produces / run-04 outline-generation produces /
   run-05 frozen_context transforms-to / run-02 frozen-context transforms-to
② 中心关系「三层递进」三种处置：run-03/05 记 relationGap · run-02 画 depends-on 边 · run-04 完全不登记
```

**是否强行主轴**：**没有发现"把并列关系编成依赖"的硬证据**（三次 0 条 `depends-on`）。
run-03 把两条链接成一条单链、并漏掉衔接点（check-map 无 I4 即其机械指纹）→ 是否属强行主轴判 **UNCLEAR**；
能确定的是：**三次 run 的 L0 主轴上都不含文档的三个中心概念节点（三层全在 attachment 侧）** —— 主轴承载生成链路，中心语义靠侧挂。

## E. Coverage（Q3）

**Framework Coverage（A 类）**：`check-map` **没有任何 A 类数字**（`grep F1|F2|F3` 在该脚本零匹配）；
报告里的 `coverage` 一行取自 N3 的 `universe/unreachable`，**只反映导航可达性**。A 类只能人判：
三次 run 主机制齐全（三级语义、Influence 排除、两链边界、消费链），**但反复缺失一处** ——
原文 §五 的两条否定条件（L203–221「不要求盲目服从」、L223–227「不要求输出明显不同」）run-05 建了 2 个 constraint，run-03/04 **0 个**；
§十二 的 7 条"只能算 Receipt/Availability"清单（L457–465）三次都**无节点/边承载**。

**Navigation Coverage（B 类）**：四份 `check-map.txt` 均为 `SKIPPED (0)` · `状态: PASS` · 无 W0 →
**N1~N3 真的执行了**。四次都是 `coverage 15/15`；`15` = 原文 15 个顶层小节（`§一`–`§十五`，level 1 只有文档大标题、被 `sectionLevel` 规则跳过）。
经手工复核：`topics[].sectionRefs ∪ document.scope ∪ nonGoalSummary` 的并集恰好覆盖 `§一`–`§十五`，**15/15 属实，没有靠 element 的 sectionRefs 凑路径**。

**粒度纪律**：四份产物都是 `section (provisional)`，而人工 candidate map 是 `sourceUnit`（87 条）。
按契约 §1，**section 粒度下 N2 与 N3 合并成同一件事** → 这个 `15/15` **不能当作两条独立证据**，
更不能与历史 sourceUnit 粒度的 87 条可达性数字合并（四份报告自己都打印了该警告）。
N1 未逐条打印，只有聚合 `HARD ERROR (0)` → **只能判"未失败"，不是"被单独验证"**。

## F. 结论 + 最值得记录的失败样本（**契约级盲区**）

**一句话**：A 的三次 run 在 5/6 个锚点上稳定、**零 invented element / relation / unsupported prerequisite / relates-to 滥用 / 造边消孤立**，
N1~N3 真的执行 —— 但**三次 run 一致地把文档三个中心语义层级写成 `state`**（契约 §2 已登记为 `concept`），
**而 validator 完全看不见这个错误**。

**样本（契约级盲区）**

```text
原文 L312–318（三种布尔条件的 5 种组合表）：三层可以同时为真
契约 §2（L81，已登记的 ontology regression case）：三层 = concept，role: "semantic-level"
人工 candidate map：E-06/07/08 = concept

产物 run-03 L27/L42/L58   "type": "state"   ← context-receipt / availability / consumption
     run-04 L28/L42/L56   同为 state
     run-05 L28/L40/L52   同为 state
     run-03 relationGap[0].reason 甚至把误判当成了缺口成因：
       「两端都是 state（产品语义层级），而 edges[] 只允许连接 process / artifact」
       —— 按契约，concept **同样**不能作 edge 端点，真正的原因是 9 词表达不了"递进/单向蕴含"
```

**为什么值得记录：**

```text
1. 3/3 稳定复现，不是单次抖动，且与人工参照（concept）不一致
2. validator 拦不住：state 是合法 enum，role:"semantic-level" 是已知 role；
   四份报告里唯一的弱信号还是**反向的** —— run-02 把三层写成 process 时，
   报告打了 `i I2 state = 0（正常形态差异，不是缺陷）`
3. 产物自己把误判写进了理由（见上）
4. ⭐ 契约 §2 的 concept/state 判别规则**不在生成 prompt 的信息面内** ——
   `ai/framework-map-generation.prompt.md` §三 只给结构要求，§四/§五 给 relation 与纪律，
   AI 从原文只能读到"三层"这一层级叙事，**没有任何规则告诉它"可同时为真 ⇒ 不是 state"**
   → 按任务纪律：**只登记现象，不改 Contract / 不改 prompt**（本 Feature 内）
```

---

# Fixture E · Operational Runbook（**本轮最差**）

`测试文档/fixture-e-f13-f16-runbook.md`（571 行 · 11 个顶层小节）

## A. Semantic Anchors

| # | Anchor | run-01（16 el） | run-02（12 el） | run-03（16 el） | n/3 |
|---|---|---|---|---|---|
| A1 | 正常路径（两条用例的状态推进） | ✅ 函数级状态推进 | ⚠️ 状态名不可见 | ⚠️ 仅状态元素标签 | 1/3 |
| **A2** | **异常与失败路径**（补偿失败 / 查单未决 / 排查） | ⚠️ | ⚠️ | ⚠️ | **0/3** |
| **A3** | **人工介入与越权边界**（仅管理员强制补偿 / 非所有者被拒） | ⚠️ 越权 0 承载 | ⚠️ | ⚠️ | **0/3** |
| **A4** | **有界失败策略**（连续 10 次 → `REFUND_FAILED`） | ⚠️ 仅边 label | ❌ 全文 0 命中 | ❌ 0 命中 | **0/3** |
| **A5** | **资产回补一致性与幂等**（成对一致 / 只补一次） | ⚠️ | ❌ | ❌ | **0/3** |
| A6 | 部署与验证步骤（构建→部署→沙箱→证据→审查→切换） | ⚠️ 仅章节可导航 | ✅ | ✅ | 2/3 |

> 唯一"稳定"（2/3 且是最强形式）的锚点是 **A6 —— runbook 的章节骨架**。
> 人工 map 的 2 个 constraint：有界失败 1/3（且是边 label 而非 constraint 元素）；**撤销与越权 0/3**（§4.4 L245–247 从未进图）。

## B. Faithfulness 计数（Q2）

| 类别 | run-01 | run-02 | run-03 |
|---|---|---|---|
| Invented element（无锚点） | **0** | 0 | 0 |
| ↳ 边界个案（脚本名 / 章节升级为 element） | 1（`refund_common_config`，低置信） | 2–3（§5/§6/§8） | 1（`sandbox-mock-notify`） |
| Invented relation | **0** | **0** | **0** |
| Wrong relation direction | **0** | **0** | **0** |
| Unsupported prerequisite | **0** | **0** | **0** |
| Wrong concept/state classification | 0（`state` 缺失 = 降级） | 1（`evidence_retention` 判 artifact，人工判 process） | 1 边界（UNCLEAR） |
| contains ↔ reference 混用 | **0**（`contains` 0 条） | 0 | 0 |
| 词表拉伸（非发明，登记现象） | 1（`controls` = 调用） | 0 | 2（`produces` = 部署；`consumes` = 调用） |

**E 的关系层是五个 fixture 里最干净的（0/0/0 编造）—— 它的问题是"丢了什么"，不是"编了什么"。**

## C. Validator Gaming（PASS 也查）

| 类别 | run-01 | run-02 | run-03 |
|---|---|---|---|
| ① 乱用 `relates-to` | 无（0 条） | 无 | 无 |
| ② 造边消孤立 | 无（弱信号） | 无（弱信号） | 无（弱信号） |
| ③ **为压到 12 而删机制** | 无（meta 明确拒绝压缩） | **有（间接证据强）** | 无（meta 明确"未为压缩数量删减机制"） |
| ④ 语义不准的 known role | 无 | **有（6 处）** | 边界 1 处 |
| ⑤ 编造 prerequisite | 无 | 无 | 无 |

**③ 的证据（run-02）**：`meta.elementCount = 12`，恰好压到 budget。全文 grep
`REFUND_FAILED` / `10 次` / `越权` / `所有者` / `幂等` / `stockRestored` / `强制补偿` → **0 命中**
（"强制补偿"仅出现在 Topic 命题文本里）。`forceRestockAndAssets`（§4.8 L319–325）、越权拒绝（§4.4 L245–247）、有界失败（§6.4 L418）在图上**无任何落点**。
参照：run-01 的 `meta.note` 写「元素数超出 preferred budget 12：…压缩会丢失机制」、run-03 写「未为压缩数量删减机制」—— 另两次在同预算压力下**选择超预算保机制**。
**保留判断**：run-02 的丢失更像"粒度选择（Feature/阶段级聚合）"所致；但 run-03 同样丢了有界失败与强制补偿 → **机制丢失不是 12 预算单独造成的**，因此记"有（间接证据）"，不记为已证实。

**④ 的证据（run-02）**：`role: "current"` 出现在 **6 个元素**上。而 `current`/`target` 在 schema 里是 **`document.role` 的 enum** ——
把它当 element role 用属"known role、语义不准确"；run-03 有 1 处边界，run-01 无。
⚠️ **W2 抓不到这个**（`current` 是 x-known-roles 里的已知取值 → 不报警）。

## D. 结构观察（Q5）

```text
run-01  函数级运行时图：order 是单一收束点（7 条 produces/transforms-to 汇入）；
        补偿侧形成真正的三路分叉（approve_after_sales / retry_compensation / force_compensation
        → compensate_assets → assets）—— 三次里唯一把「正常 / 自动重试 / 人工强制」在结构上分开的图；
        但正常与异常**终点不可区分**（都汇入 order）
run-02  Feature/阶段级依赖图：两条线性链 + 一个验证星；**图里没有任何数据对象**
        （order / assets / 状态机全部缺席）；正常/异常/人工介入被压成一条依赖线
run-03  阶段流水线 + 工件扇出：唯一把「独立审查」做成第一类 process 节点的图；
        但正常/异常分叉完全没有，after-sales-status 只 attach 到链路、**不挂任何 process**
```

**跨 run 稳定性**：元素粒度**三变**（云函数级 → Feature+阶段级 → 阶段级+聚合工件），
**跨 run 没有一个核心节点是稳定的**；`order`/`assets` 只在 run-01，状态机只在 run-03，强制补偿只在 run-01。
唯一跨 run 稳定的是**章节骨架**（部署→验证→切换 3/3）与两条 §9/§10 约束 —— 即文档里最像"框架"的两条，而非 runbook 的机制。

## E. Coverage（Q3）

**Framework Coverage**：`check-map` 不输出数字。按锚点：6 个锚点完整保留数 = **1 / 0 / 0 / 0 / 0 / 2**。
三次都缺"失败终点"与"有界失败规则"载体；run-02 额外缺 `order`/`assets`/状态机/强制补偿。

**Navigation Coverage**：三份 `check-map.txt` 均 `SKIPPED (0)` · `状态: PASS`（非 INCOMPLETE）· `granularity section (provisional)` → **N1~N3 真的执行了**，三次都是 `11/11`（universe = §1–§11）。
`run-meta.json` 亦记 `checkMapExecuted: true`。

⭐ **但这个数字的信息量有限**：三次 run 的 Topic 与顶层小节 **1:1** —— check-map 对每个 Topic 都报 `I6 … 只挂了一个 block / section`（11 条 × 3 run）。
于是 **N1 由构造必然满足，N2/N3 也由构造必然 11/11**：Topic 与小节一一对应时导航覆盖自动满分。

**Semantic Coverage（C 类）** 属 `check-overview`，本轮未跑 → 不可得，不与上面两类合并。

## F. 结论 + 最值得记录的失败样本

**一句话**：E 的三次 run 都产出了 validator 全 PASS、表层忠实的图，但**没有一次保留 runbook 的机制** ——
稳定留下来的只有**章节骨架**与两条 §9/§10 约束；runbook 之所以是 runbook 的四类语义
（异常路径 / 人工介入+越权 / 有界失败 / 资产一致性）落在 **0–1/3**，其中"有界失败"与"越权边界"三次全部丢失。

**样本 1 — run-02 的 W5 是一条"伪 gap"，而三次都漏掉了人工登记的两条真 gap**

```text
run-02 relationGap[0]：f16_refund_api ⇢ f15_compensation_retry
  reason 称"原文 §1 依赖图声称 F15 → F16，但 §4.2/§6.4 描述退款成功后回调触发 F15 补偿，方向相反"
→ 原文 §1 L25 的「依赖」是实现顺序，§5.4 L364 的"退款成功后调用 processAfterSales"是运行时调用，
   两句并不矛盾；run-01 在函数粒度用两条边就同时表达了
→ 这条 W5 是 Feature 级粗粒度把两种语义压到同一条边上的**粒度伪影，不是词表缺口**
反之，人工 map 的两条真 gap（process 导致 state 迁移 / 资产回补标记与售后状态成对一致）**0/3 命中**，
"成对一致"那条被这条伪 gap 占了位。
```

**样本 2 — run-02 把四类机制连同数据对象一起压掉，换取恰好 12 个元素**（见 C-③ 的 grep 证据）

**样本 3 — 规则被降级成边标签，图上点不到**

```text
run-01：「查单纠偏：80% 命中时推进退款结果；连续 10 次失败置 REFUND_FAILED」只存在于 edge.label
→ 语义保住了，但既无 REFUND_FAILED 状态节点、也无 constraint 元素（人工 map 是 E-11 constraint 挂 E-06），
  reviewer 无法从图上定位这条"有界失败"策略
```

**样本 4 — Topic 数 11 不是"导航更细"，是把 runbook 章节列了一遍**（三个 run 的 Topic 依次对应 §1…§11，I6 各 11 条；
`revision_history`/`t-revision`（§11 修订记录）三次都是无 element 的纯章节 Topic）。
人工 map 用 8 个**跨章节语义分组**的 Topic（T-01 = §1+§2+§3、T-04 = §4.6+§6.4、T-06 = §5+§6+§10…）
→ 两者不是"细/粗"差别，而是 **"目录镜像 vs 语义分组"** 差别。

**样本 5 — 聚合元素会静默吞掉人工介入机制**：run-03 的 `cloud-functions` 标签逐个列出函数「…`refundQueryCron` **等**）」，
枚举明显漏掉 `forceRestockAndAssets`（§4.8 L319 仅管理员强制补偿）—— **"等"字把这次丢失掩盖成一个看不出缺口的标签**。
