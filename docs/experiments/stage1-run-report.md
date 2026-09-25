# overview-plan 对比报告（模型 vs Gold）

生成时间：2026-09-25T07:57:02.010Z

> 本报告是**观察工具**的产物，不是评分。匹配依据 (section + kind + 文本相似度)，
> 绝不要求文案相同；低分项需要人工确认是否真的漏掉语义。

## 1. 概览

| | Gold | run-1 | run-2 | run-3 |
|---|---|---|---|---|
| sourceUnits | 84 | 77 | 74 | 75 |
| blocks | 21 | 18 | 20 | 18 |
| blocks/section | — | 1.13 | 1.25 | 1.13 |
| 平均 covers/block | 4.1 | 4.3 | 3.7 | 4.2 |
| 最大 covers/block | 12 | 10 | 5 | 9 |
| duplicatesMerged | 7 | 9 | 5 | 9 |
| check-plan | PASS | FAIL | FAIL | FAIL |

## 2. Semantic Unit Recall

Gold 的每条语义，在各 run 里是否有对应表达。

| run | core 命中 | core 边界 | supporting 命中 | 合计 | 未命中 core |
|---|---|---|---|---|---|
| run-1 | 73/75 (97%) | 5 | 8/9 (89%) | 81/84 | SU-035, SU-037 |
| run-2 | 74/75 (99%) | 6 | 7/9 (78%) | 81/84 | SU-037 |
| run-3 | 74/75 (99%) | 5 | 7/9 (78%) | 81/84 | SU-037 |

## 3. Semantic Stability（三次是否稳定识别）

- 3 次运行**全部**识别到的语义：**80 / 84**（95%）
- 至少 2 次识别到（稳定）：**81 / 84**（96%）
- 不稳定的语义（少于 2 次）：**3 条**

| unit | section | kind | importance | 命中次数 | statement |
|---|---|---|---|---|---|
| SU-031 | §5 | rationale | supporting | 1/3 | 若要求可见差异，系统会为了证明个性化而强行制造结构差异，反而可能破坏合理的课程设计。… |
| SU-037 | §7 | example | core | 0/3 | 5 种状态组合各有产品解释：从"上下文没有到达"到"上下文可用但未实际参与生成"，再到"形成了完整的 c… |
| SU-043 | §8 | invariant | supporting | 0/3 | 这两个目标只有共同成立时，才能支持"本次课程在可追踪意义上消费并体现了课前教学语义"。… |

## 4. Grouping（分组是否过碎 / 过重）

| run | blocks | 每节平均 block | 平均 covers | 最大 covers | 过碎嫌疑（>4 block/节） | 过重嫌疑（covers>8） |
|---|---|---|---|---|---|---|
| run-1 | 18 | 1.13 | 4.3 | 10 | 无 | O-04 |
| run-2 | 20 | 1.25 | 3.7 | 5 | 无 | 无 |
| run-3 | 18 | 1.13 | 4.2 | 9 | 无 | O-04 |

**一对多匹配（可能是分组过碎的信号）：**

- run-1：SU-008 与另一条 gold 语义同时匹配到 SU-009
- run-1：SU-009 与另一条 gold 语义同时匹配到 SU-009
- run-1：SU-020 与另一条 gold 语义同时匹配到 SU-020
- run-1：SU-021 与另一条 gold 语义同时匹配到 SU-020
- run-1：SU-044 与另一条 gold 语义同时匹配到 SU-044
- run-1：SU-045 与另一条 gold 语义同时匹配到 SU-044
- run-1：SU-046 与另一条 gold 语义同时匹配到 SU-055
- run-1：SU-056 与另一条 gold 语义同时匹配到 SU-055
- run-1：SU-057 与另一条 gold 语义同时匹配到 SU-056
- run-1：SU-058 与另一条 gold 语义同时匹配到 SU-056
- run-1：SU-059 与另一条 gold 语义同时匹配到 SU-056
- run-1：SU-063 与另一条 gold 语义同时匹配到 SU-061

## 5. Shape Selection

Shape catalog 允许：flow, current-target-flow, matrix, capability-matrix, diff, ladder, walkthrough, combo, checklist, two-column-comparison, prose

- **run-1**：checklist×4, two-column-comparison×3, current-target-flow×3, capability-matrix×2, prose×1, ladder×1, walkthrough×1, combo×1, matrix×1, flow×1
- **run-2**：two-column-comparison×4, capability-matrix×3, current-target-flow×3, checklist×3, ladder×2, prose×1, walkthrough×1, combo×1, matrix×1, flow×1
- **run-3**：checklist×4, two-column-comparison×3, capability-matrix×2, current-target-flow×2, flow×2, prose×1, ladder×1, walkthrough×1, combo×1, matrix×1

三次运行合计用到 10 种形状；Gold 用到 11 种。
- run-1：弱视觉形状（checklist/prose）占 28%
- run-2：弱视觉形状（checklist/prose）占 20%
- run-3：弱视觉形状（checklist/prose）占 28%

## 6. Semantic Fidelity（越权与降级）

来自 `check-plan` 的 Hard Error —— 这是**不允许**出现的越权类型：

- **run-1**：1 条
  - `[schema] $.sourceUnits[13].kind: 值 "capability-matrix" 不在 enum ["definition","invariant","current-state","target-state","rationale","consequence","boundary","negative-case","example","counterexample","open-question","non-goal","non-claim","responsibility","evidence-requirement"] 中`
- **run-2**：2 条
  - `[schema] $.sourceUnits[12].kind: 值 "capability-matrix" 不在 enum ["definition","invariant","current-state","target-state","rationale","consequence","boundary","negative-case","example","counterexample","open-question","non-goal","non-claim","responsibility","evidence-requirement"] 中`
  - `[schema] $.sourceUnits[35].kind: 值 "combo" 不在 enum ["definition","invariant","current-state","target-state","rationale","consequence","boundary","negative-case","example","counterexample","open-question","non-goal","non-claim","responsibility","evidence-requirement"] 中`
- **run-3**：1 条
  - `[schema] $.sourceUnits[37].kind: 值 "combo" 不在 enum ["definition","invariant","current-state","target-state","rationale","consequence","boundary","negative-case","example","counterexample","open-question","non-goal","non-claim","responsibility","evidence-requirement"] 中`

| 越权类型 | run-1 | run-2 | run-3 |
|---|---|---|---|---|
| 未决定 → 写成决定 | 未触发 | 未触发 | 未触发 |
| 不承诺 → 写成保证 | 未触发 | 未触发 | 未触发 |
| target → 写成 current | 未触发 | 未触发 | 未触发 |
| document claim → source-verified | 未触发 | 未触发 | 未触发 |

其余 Hard Error（结构 / 字段层面，不是语义倒置）：

- run-1：1 条 —— [schema] $.sourceUnits[13].kind: 值 "capability-matrix" 不在 enum ["defin
- run-2：2 条 —— [schema] $.sourceUnits[12].kind: 值 "capability-matrix" 不在 enum ["defin；[schema] $.sourceUnits[35].kind: 值 "combo" 不在 enum ["definition","inva
- run-3：1 条 —— [schema] $.sourceUnits[37].kind: 值 "combo" 不在 enum ["definition","inva

**字段误用（模型把不该放在该字段的值放进去了）：**

- run-1：1 条 —— SU-014.kind="capability-matrix"
- run-2：2 条 —— SU-013.kind="capability-matrix", SU-036.kind="combo"
- run-3：1 条 —— SU-038.kind="combo"

## 7. Presentation Drift（表现层漂移，仅观察）

| gold unit | run-1 的 shape | run-2 的 shape | run-3 的 shape |
|---|---|---|---|---|
| SU-001 本文只讨论 Context Consumption … | prose | prose | prose |
| SU-002 Context-side chain 与 Outpu… | prose | prose | prose |
| SU-003 Context Consumption 保留 Rec… | ladder | ladder | ladder |
| SU-004 Receipt 表示上下文到达了系统；Availab… | ladder | ladder | ladder |
| SU-005 三个层级不能互相替代：Receipt ≠ Avail… | ladder | ladder | ladder |
| SU-007 明确不采用 Receipt → Availabili… | ladder | ladder | ladder |
| SU-008 产品语义上保留两条相互关联但不互相吞并的链：Cont… | two-column-comparison | two-column-comparison | two-column-comparison |
| SU-009 Context-side chain 回答：Deep… | two-column-comparison | two-column-comparison | two-column-comparison |
| SU-010 Output-side chain 回答：最终生成的… | two-column-comparison | two-column-comparison | two-column-comparison |
| SU-011 两条链共同支持 context-grounded g… | two-column-comparison | two-column-comparison | two-column-comparison |
| SU-012 Context Receipt 表示 OpenMAI… | capability-matrix | capability-matrix | capability-matrix |
| SU-013 Receipt 能说明：系统收到了某个 Propos… | capability-matrix | capability-matrix | capability-matrix |
| SU-014 Receipt 不能说明：上下文已经通过合法性校验、… | capability-matrix | capability-matrix | capability-matrix |
| SU-015 以下事实都只能证明 Receipt，不能证明 Ava… | checklist | capability-matrix | capability-matrix ⚠️ |
| SU-017 Context Availability 表示合法、… | capability-matrix | capability-matrix | capability-matrix |
| SU-018 Availability 至少意味着：来自受信任的服… | capability-matrix | capability-matrix | capability-matrix |
| SU-019 Availability 仍然不能说明生成器已经真正… | capability-matrix | capability-matrix | capability-matrix |
| SU-020 一个上下文可以有 Receipt 但没有 Avail… | capability-matrix | capability-matrix | capability-matrix |
| SU-022 Context Consumption 表示本次 o… | capability-matrix | ladder | checklist ⚠️ |
| SU-023 被消费的对象是经过验证和冻结的教学语义：学习目标、授… | capability-matrix | ladder | checklist ⚠️ |
| SU-024 Consumption 不要求把 raw Propo… | capability-matrix | ladder | checklist ⚠️ |
| SU-025 Receipt 是"我们收到了上下文"；Availa… | capability-matrix | ladder | checklist ⚠️ |
| SU-026 以下情况都不能单独证明 Consumption：Pr… | capability-matrix | ladder | checklist ⚠️ |
| SU-027 Prompt 可以是 Consumption 的承载… | capability-matrix | ladder | checklist ⚠️ |

抽样 24 条 core 语义中，有 **7** 条在三次运行里被放进了不同的 shape。
> 按本轮要求：漂移只作观察指标，不作为 Hard Error。

## 8. 需要人工确认的清单

以**最后一次运行**（run-3）为样本：

### 8.1 疑似完全未命中的 core 语义（1 条）

| unit | section | kind | statement |
|---|---|---|---|
| SU-037 | §7 | example | 5 种状态组合各有产品解释：从"上下文没有到达"到"上下文可用但未实际参与生成"，再到"形成了完整的 context-grounded generation 证据"。 |

### 8.2 匹配分偏低或 kind 不一致（16 条，需人工判断是否同义）

| gold unit | 匹配到的模型 unit | 分数 | kind 一致 | gold statement | 模型 statement |
|---|---|---|---|---|---|
| SU-001 | SU-001 | 0.55 | **否** | 本文只讨论 Context Consumption 的产品语义层级，不是 Fea… | 本文讨论 Context Consumption 的产品语义层级，不是 Feat… |
| SU-007 | SU-005 | 0.32 | **否** | 明确不采用 Receipt → Availability → Consumpti… | Context Consumption 采用三个递进层级：Context Rec… |
| SU-013 | SU-014 | 0.40 | **否** | Receipt 能说明：系统收到了某个 Proposal / 冻结上下文或相关传… | Receipt 可以说明系统收到 Proposal、冻结上下文或相关传输结果，且… |
| SU-020 | SU-021 | 0.38 | **否** | 一个上下文可以有 Receipt 但没有 Availability：digest… | Proposal 已收到但 digest 与当前请求不一致、包含越权知识引用、F… |
| SU-021 | SU-018 | 0.31 | 是 | Receipt = 上下文到了；Availability = 合法上下文已经准备… | Context Availability 表示合法、冻结、版本一致的课前语义上下… |
| SU-024 | SU-024 | 0.47 | **否** | Consumption 不要求把 raw Proposal、DeepTutor … | 生成器消费的是服务端从 Frozen Context 派生出的、适合课程设计的语… |
| SU-025 | SU-022 | 0.24 | 是 | Receipt 是"我们收到了上下文"；Availability 是"我们确认它… | Context Consumption 表示本次 outline generat… |
| SU-028 | SU-029 | 0.46 | **否** | Consumption 不要求盲目服从：某项 Recommended 被纳入设计… | 某项 Recommended 被纳入设计考虑但最终没有采用时，仍可能满足 Con… |
| SU-029 | SU-030 | 0.55 | **否** | 如果系统完全没有把某项 guidance 纳入生成设计考虑，问题可能反映 Con… | 如果系统完全没有把某项 guidance 纳入生成设计考虑，问题可能反映 Con… |
| SU-033 | SU-034 | 0.33 | **否** | 要证明"没有 DeepTutor 就不会有这个输出"需要反事实比较、控制变量或其… | 要证明没有 DeepTutor 就不会出现某个输出，需要反事实比较、控制变量或其… |
| SU-034 | SU-035 | 0.38 | **否** | Context Influence 不作为 Context Consumptio… | Context Influence 不作为 Context Consumptio… |
| SU-041 | SU-041 | 0.22 | **否** | Consumption = yes 而 Output Alignment = n… | Consumption 与 Output Alignment 彼此不替代；可能出… |
| SU-042 | SU-042 | 0.46 | **否** | Consumption = no 而 Output Alignment = ap… | 当 Consumption 为 no 而 Output Alignment 表面… |
| SU-052 | SU-049 | 0.48 | **否** | SceneGenerationContext 是跨页 speech cohere… | Scene content 当前由 app/api/generate/scene… |
| SU-057 | SU-054 | 0.32 | 是 | Receipt 对应"接收和记录课前 context lineage"，概念入口… | Context Receipt 对应接收和记录课前 context lineag… |
| SU-074 | SU-064 | 0.46 | **否** | 这个 pipeline 的主要职责是实现已经产生的 outline，而不是重新决… | 当前 scene pipeline 是 SceneOutline → scene… |

## 9. 模型多识别出的语义（Gold 没有对应项）

最后一次运行有 3 条语义在 Gold 里找不到对应项（这**不一定是错误** —— 可能是 Gold 自己漏了）：

| unit | section | kind | statement |
|---|---|---|---|
| SU-004 | §0 | non-claim | 本文不承诺严格的反事实因果关系。 |
| SU-038 | §7 | combo | Receipt、Availability、Consumption 与 Output Alignment 的关键组合包括：未收到；收到但不可用；可用但未参与生成；参与生成但未通过 Alignment；以及参与生成且 Alignment 通过或带 warning。 |
| SU-071 | §15 | open-question | 本文不决定生成器如何消费上下文，包括 Prompt、结构化 planner、模板或混合生成方式。 |


## 10. 工具自检

- Gold 与自身对比：命中 84 / 84（应接近 100%）
- check-plan 调用：正常
- 对比文件：context-consumption.run-1.overview-plan.json, context-consumption.run-2.overview-plan.json, context-consumption.run-3.overview-plan.json


## 11. 人工核对（对自动匹配结论的修正）

自动匹配有假阳性与假阴性，以下三条经过人工逐条核对：

| 结论 | 自动报告 | 人工核对 | 说明 |
|---|---|---|---|
| SU-037（§7 五种状态组合） | 0/3 未命中 | **实际三次都识别到了** | 假阴性。模型把该 unit 的 `kind` 写成了 `"combo"`（shape 名），触发匹配器的 kind 惩罚后分数跌破阈值。三次分别落在 run-1 O-08 / run-2 O-10 / run-3 O-08，都是 `combo` 块。 |
| SU-043（§8 两个目标只有共同成立才支持结论） | 0/3 未命中 | **确认是真漏** | run-1 / run-2 的 §8 只抽了 4 条（边界、不等、两种不一致），完全没有这条；run-3 把它并进了另一条的"彼此不替代"里，语义强度被削弱。 |
| kind 误用 | 每 run 1–2 条 | **确认是真错** | run-1 `SU-014.kind="capability-matrix"`；run-2 `SU-013.kind="capability-matrix"`、`SU-036.kind="combo"`；run-3 `SU-038.kind="combo"`。模型把 shape 名当成了 kind。 |

**修正后的真实 Recall**：core 语义命中率约 **74–75 / 75（≈99%）**，唯一的真实缺口是 **SU-043**。

## 12. 本轮为让工具可信而做的三处修正（非 prompt 调优）

按"不要为了跑分反复改 prompt"的要求，本轮**没有改动任何 prompt**。以下三处改动都在**工具**侧，且都有对应测试：

| 改动 | 原因 | 证据 |
|---|---|---|
| `ai-plan.js` 增加**传输层**重试（超时 / 429 / 5xx，最多 3 次） | run-3 首次因 `UND_ERR_HEADERS_TIMEOUT` 失败。这是基础设施抖动，与语义无关；语义层重试仍然刻意不做。 | run-3 重跑成功 |
| `check-plan.js` 的"target 写成 current"判据改为**同章节**比较 | 原判据"块里有 current-state ref 就算"会误伤 `current-target-flow` —— 那种形状本来就同时引用现状与目标，属于正确用法。 | run-2 的 O-13/O-17 由 Hard Error 降为 `[边界]` warning；Gold 与 18 个测试用例仍全绿 |
| `compare-plan.js` 的越权类型表只匹配 `[陷阱]` 前缀 | 原实现用宽泛正则，把 schema 字段错误误报成"non-claim → claim"和"target → current"。 | 修正后三类越权正确显示"未触发" |
