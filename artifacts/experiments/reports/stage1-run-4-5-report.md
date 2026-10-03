# overview-plan 对比报告（模型 vs Gold）

生成时间：2026-09-25T08:37:01.449Z

> 本报告是**观察工具**的产物，不是评分。匹配依据 (section + kind + 文本相似度)，
> 绝不要求文案相同；低分项需要人工确认是否真的漏掉语义。

## 1. 概览

| | Gold | run-4 | run-5 |
|---|---|---|---|
| sourceUnits | 84 | 76 | 82 |
| blocks | 21 | 20 | 22 |
| blocks/section | — | 1.25 | 1.38 |
| 平均 covers/block | 4.1 | 3.8 | 3.7 |
| 最大 covers/block | 12 | 7 | 7 |
| duplicatesMerged | 7 | 5 | 6 |
| check-plan | PASS | PASS | PASS |

## 2. Semantic Unit Recall

Gold 的每条语义，在各 run 里是否有对应表达。

| run | core 命中 | core 边界 | supporting 命中 | 合计 | 未命中 core |
|---|---|---|---|---|---|
| run-4 | 74/75 (99%) | 5 | 6/9 (67%) | 80/84 | SU-035 |
| run-5 | 74/75 (99%) | 3 | 6/9 (67%) | 80/84 | SU-037 |

## 3. Semantic Stability（三次是否稳定识别）

- 2 次运行**全部**识别到的语义：**78 / 84**（93%）
- 至少 2 次识别到（稳定）：**78 / 84**（93%）
- 不稳定的语义（少于 2 次）：**6 条**

| unit | section | kind | importance | 命中次数 | statement |
|---|---|---|---|---|---|
| SU-031 | §5 | rationale | supporting | 1/2 | 若要求可见差异，系统会为了证明个性化而强行制造结构差异，反而可能破坏合理的课程设计。… |
| SU-035 | §7 | definition | core | 1/2 | 完整叙事是：本次生成收到并准备了合法、冻结、版本一致的课前教学语义；该语义实际参与了 outline g… |
| SU-036 | §7 | boundary | supporting | 1/2 | 这条叙事可以分别报告两条链的状态，不需要压缩成一个不可解释的"个性化成功"布尔值。… |
| SU-037 | §7 | example | core | 1/2 | 5 种状态组合各有产品解释：从"上下文没有到达"到"上下文可用但未实际参与生成"，再到"形成了完整的 c… |
| SU-043 | §8 | invariant | supporting | 0/2 | 这两个目标只有共同成立时，才能支持"本次课程在可追踪意义上消费并体现了课前教学语义"。… |
| SU-073 | §13 | current-state | supporting | 0/2 | 当前 scene pipeline 是：SceneOutline → scene-content rou… |

## 4. Grouping（分组是否过碎 / 过重）

| run | blocks | 每节平均 block | 平均 covers | 最大 covers | 过碎嫌疑（>4 block/节） | 过重嫌疑（covers>8） |
|---|---|---|---|---|---|---|
| run-4 | 20 | 1.25 | 3.8 | 7 | 无 | 无 |
| run-5 | 22 | 1.38 | 3.7 | 7 | 无 | 无 |

**一对多匹配（可能是分组过碎的信号）：**

- run-4：SU-009 与另一条 gold 语义同时匹配到 SU-009
- run-4：SU-010 与另一条 gold 语义同时匹配到 SU-009
- run-4：SU-019 与另一条 gold 语义同时匹配到 SU-020
- run-4：SU-021 与另一条 gold 语义同时匹配到 SU-020
- run-4：SU-022 与另一条 gold 语义同时匹配到 SU-022
- run-4：SU-025 与另一条 gold 语义同时匹配到 SU-022
- run-4：SU-030 与另一条 gold 语义同时匹配到 SU-022
- run-4：SU-044 与另一条 gold 语义同时匹配到 SU-045
- run-4：SU-045 与另一条 gold 语义同时匹配到 SU-045
- run-4：SU-047 与另一条 gold 语义同时匹配到 SU-047
- run-4：SU-048 与另一条 gold 语义同时匹配到 SU-047
- run-4：SU-055 与另一条 gold 语义同时匹配到 SU-055

## 5. Shape Selection

Shape catalog 允许：flow, current-target-flow, matrix, capability-matrix, diff, ladder, walkthrough, combo, checklist, two-column-comparison, prose

- **run-4**：two-column-comparison×3, capability-matrix×3, matrix×3, checklist×3, ladder×2, walkthrough×2, prose×1, combo×1, flow×1, current-target-flow×1
- **run-5**：checklist×4, two-column-comparison×3, capability-matrix×3, ladder×2, walkthrough×2, current-target-flow×2, matrix×2, prose×1, combo×1, diff×1, flow×1

三次运行合计用到 11 种形状；Gold 用到 11 种。
- run-4：弱视觉形状（checklist/prose）占 20%
- run-5：弱视觉形状（checklist/prose）占 23%

## 6. Semantic Fidelity（越权与降级）

来自 `check-plan` 的 Hard Error —— 这是**不允许**出现的越权类型：

- **run-4**：无 Hard Error
- **run-5**：无 Hard Error

| 越权类型 | run-4 | run-5 |
|---|---|---|---|
| 未决定 → 写成决定 | 未触发 | 未触发 |
| 不承诺 → 写成保证 | 未触发 | 未触发 |
| target → 写成 current | 未触发 | 未触发 |
| document claim → source-verified | 未触发 | 未触发 |

其余 Hard Error（结构 / 字段层面，不是语义倒置）：


**字段误用（模型把不该放在该字段的值放进去了）：**

- 无

## 7. Presentation Drift（表现层漂移，仅观察）

| gold unit | run-4 的 shape | run-5 的 shape |
|---|---|---|---|
| SU-001 本文只讨论 Context Consumption … | prose | prose |
| SU-002 Context-side chain 与 Outpu… | prose | prose |
| SU-003 Context Consumption 保留 Rec… | ladder | ladder |
| SU-004 Receipt 表示上下文到达了系统；Availab… | ladder | ladder |
| SU-005 三个层级不能互相替代：Receipt ≠ Avail… | ladder | ladder |
| SU-007 明确不采用 Receipt → Availabili… | ladder | ladder |
| SU-008 产品语义上保留两条相互关联但不互相吞并的链：Cont… | two-column-comparison | two-column-comparison |
| SU-009 Context-side chain 回答：Deep… | two-column-comparison | two-column-comparison |
| SU-010 Output-side chain 回答：最终生成的… | two-column-comparison | two-column-comparison |
| SU-011 两条链共同支持 context-grounded g… | two-column-comparison | two-column-comparison |
| SU-012 Context Receipt 表示 OpenMAI… | capability-matrix | capability-matrix |
| SU-013 Receipt 能说明：系统收到了某个 Propos… | capability-matrix | capability-matrix |
| SU-014 Receipt 不能说明：上下文已经通过合法性校验、… | capability-matrix | capability-matrix |
| SU-015 以下事实都只能证明 Receipt，不能证明 Ava… | capability-matrix | capability-matrix |
| SU-017 Context Availability 表示合法、… | capability-matrix | capability-matrix |
| SU-018 Availability 至少意味着：来自受信任的服… | capability-matrix | capability-matrix |
| SU-019 Availability 仍然不能说明生成器已经真正… | capability-matrix | capability-matrix |
| SU-020 一个上下文可以有 Receipt 但没有 Avail… | capability-matrix | capability-matrix |
| SU-022 Context Consumption 表示本次 o… | matrix | ladder ⚠️ |
| SU-023 被消费的对象是经过验证和冻结的教学语义：学习目标、授… | matrix | ladder ⚠️ |
| SU-024 Consumption 不要求把 raw Propo… | matrix | ladder ⚠️ |
| SU-025 Receipt 是"我们收到了上下文"；Availa… | matrix | ladder ⚠️ |
| SU-026 以下情况都不能单独证明 Consumption：Pr… | capability-matrix | capability-matrix |
| SU-027 Prompt 可以是 Consumption 的承载… | capability-matrix | capability-matrix |

抽样 24 条 core 语义中，有 **4** 条在三次运行里被放进了不同的 shape。
> 按本轮要求：漂移只作观察指标，不作为 Hard Error。

## 8. 需要人工确认的清单

以**最后一次运行**（run-5）为样本：

### 8.1 疑似完全未命中的 core 语义（1 条）

| unit | section | kind | statement |
|---|---|---|---|
| SU-037 | §7 | example | 5 种状态组合各有产品解释：从"上下文没有到达"到"上下文可用但未实际参与生成"，再到"形成了完整的 context-grounded generation 证据"。 |

### 8.2 匹配分偏低或 kind 不一致（16 条，需人工判断是否同义）

| gold unit | 匹配到的模型 unit | 分数 | kind 一致 | gold statement | 模型 statement |
|---|---|---|---|---|---|
| SU-001 | SU-001 | 0.55 | **否** | 本文只讨论 Context Consumption 的产品语义层级，不是 Fea… | 本文讨论 Context Consumption 的产品语义层级，不是 Feat… |
| SU-002 | SU-003 | 0.53 | **否** | Context-side chain 与 Output-side chain 保… | Context-side chain 与 Output-side chain 保… |
| SU-007 | SU-007 | 0.48 | **否** | 明确不采用 Receipt → Availability → Consumpti… | 本文不采用 Receipt → Availability → Consumpti… |
| SU-011 | SU-012 | 0.44 | **否** | 两条链共同支持 context-grounded generation narr… | 两条链共同支持 context-grounded generation narr… |
| SU-020 | SU-021 | 0.37 | **否** | 一个上下文可以有 Receipt 但没有 Availability：digest… | Proposal 已收到但 digest 不一致、包含越权知识引用、Frozen… |
| SU-021 | SU-018 | 0.31 | 是 | Receipt = 上下文到了；Availability = 合法上下文已经准备… | Context Availability 表示合法、冻结、版本一致的课前语义上下… |
| SU-024 | SU-024 | 0.35 | **否** | Consumption 不要求把 raw Proposal、DeepTutor … | 生成器应消费服务端从 Frozen Context 派生出的、适合课程设计的语义… |
| SU-025 | SU-022 | 0.24 | 是 | Receipt 是"我们收到了上下文"；Availability 是"我们确认它… | Context Consumption 表示本次 outline generat… |
| SU-028 | SU-029 | 0.45 | **否** | Consumption 不要求盲目服从：某项 Recommended 被纳入设计… | 某项 Recommended 被纳入设计考虑后最终没有采用，仍可能满足 Cons… |
| SU-029 | SU-030 | 0.55 | **否** | 如果系统完全没有把某项 guidance 纳入生成设计考虑，问题可能反映 Con… | 如果系统完全没有把某项 guidance 纳入生成设计考虑，问题可能反映 Con… |
| SU-033 | SU-035 | 0.39 | **否** | 要证明"没有 DeepTutor 就不会有这个输出"需要反事实比较、控制变量或其… | 证明没有 DeepTutor 就不会出现某个输出，需要反事实比较、控制变量或其他… |
| SU-034 | SU-036 | 0.38 | **否** | Context Influence 不作为 Context Consumptio… | Context Influence 不作为 Context Consumptio… |
| SU-048 | SU-047 | 0.26 | 是 | 当前投影主要包含 topic、mapping lineage、knowledge… | lib/fusion/generation-session.ts 已存在一个较小… |
| SU-052 | SU-051 | 0.48 | **否** | SceneGenerationContext 是跨页 speech cohere… | Scene content 当前由 app/api/generate/scene… |
| SU-057 | SU-056 | 0.32 | 是 | Receipt 对应"接收和记录课前 context lineage"，概念入口… | Context Receipt 对应接收和记录课前 context lineag… |
| SU-072 | SU-067 | 0.27 | 是 | 这些情况可以分别表示 Receipt 或 Availability，不能仅凭函数… | formal context 出现在 scene-content prompt … |

## 9. 模型多识别出的语义（Gold 没有对应项）

最后一次运行有 2 条语义在 Gold 里找不到对应项（这**不一定是错误** —— 可能是 Gold 自己漏了）：

| unit | section | kind | statement |
|---|---|---|---|
| SU-039 | §7 | example | Receipt、Availability、Consumption 与 Output Alignment 可以形成五种关键组合：上下文未到达；已到达但不可用；可用但未参与生成；参与生成但未通过 Alignment；参与生成且 Alignment 通过或带 warning。 |
| SU-078 | §15 | open-question | 本文不决定生成器如何消费上下文，包括 Prompt、结构化 planner、模板或混合生成方式。 |

## 10. 工具自检

- Gold 与自身对比：命中 84 / 84（应接近 100%）
- check-plan 调用：正常
- 对比文件：context-consumption.run-4.overview-plan.json, context-consumption.run-5.overview-plan.json

