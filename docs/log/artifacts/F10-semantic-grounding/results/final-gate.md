# Final Gate（F10 · Semantic Grounding · Phase 3 人工审计 + 收口）

> **审计范围严格冻结**：只读现有产物。**未修改** prompt / schema / Contract / validator；**未补样**。
> 三个组：**主结论**（E high run-04→run-08 · D high run-04）· **历史对照**（F07 的 D/E × 3）· **成本附录**（low run-10 / run-11）。
> low **不参与**判断 F10 主语义方案是否成立。

---

## 0. 判定

```text
F10 Gate = PARTIAL PASS
```

**与 F07 的 PARTIAL PASS 含义不同（必须并列写清）：**

```text
F07  PARTIAL PASS —— 「直接生成 Map」的语义忠实度没有成立
                     （15/15 HARD 0，但 Semantic PASS 0/15；E 的机制 anchor 0–1/3）

F10  PARTIAL PASS —— 「两阶段架构方向」成立，
                     但**跨文档类型的结构保真仍未完全成立**
                     （E 侧机制保留成立；D 侧核心基础关系发生 E3）
```

---

## 1. 归因体系（按用户裁决：不新增 E6）

| 类 | 含义 |
|---|---|
| **E1** Extraction Miss | 原文有 → Inventory 没有 |
| **E2** Selection Miss | Inventory 有 → Stage B 丢掉（omitted / 无合法 target） |
| **E3** Encoding Distortion | 选中了但 type / direction / 宿主 / 关系层表达错 |
| **E3.false-represented** | **E3 的子类**（不建 E6）：selection 声称已有结构承载，但最终 target **没有实际表达该语义** |
| **E4** Escape-hatch Misuse | 塞进 `edge.label` / topic 命题 / `meta.note` / 伪 relationGap |
| **E5** Over-representation | 清单被当待办列表，L0 丧失压缩职责 |

---

## 2. 悬案裁决：`run-08 / S-40` 是否属于「五类不可静默丢失语义」？

**裁决：不属于 → 合法 omission。**

```text
S-40 原文依据 = §5.2「证据留存规范」（L329–348），原文措辞是：
    「每个 Feature passing 前需留存以下截图 / 日志：…」
→ 它是**取证 / 验收证据清单**，不是 失败路径 / 权限边界 / 阈值上限 / 不变量 / non-goal 中的任何一类。

其所属机制**另有承载**（已核实，不是空话）：
    E-07「证据与独立审查留痕：截图 / 日志证据、audit_logs、§6 独立审查 checklist」
    S-52「F14 验收要求审计日志可追溯」→ represented → E-07 ✅
模型自己给的 reason（"audit_logs 追溯要求已由 S-52 在 E-07 上表达"）**经核实为真** ——
这不是"已涵盖"式空话，而是可验证的归属。
```

**同类核查（E high 的 6 条 omitted 全部可解释，无 E2）：**

```text
S-15  §4.1 一次性测试数据细节（prod_1/coupons 预置）→ 由 E-04 输入条件承载
S-20  §4.2 六条 audit_logs 记录枚举 = 用例断言细节，且与 §5/§6 证据要求重复 → E-07
S-39  F13 截图/交互清单 = UI 级取证明细 → E-07 承载「必须留证」
S-40  ← 本条，同上
S-43  F13 表单交互验收细节（图上无表单对象）→ F13 验收整体由 E-07 checklist 承载
S-91  默认推荐的对账/资金论证属叙述性理由（决策取值已由 E-09 承载）
```

> **没有因为 E 整体表现好而宽松处理**：判据是"是不是五类"+"机制是否另有可验证承载"，
> 两条都过了才记合法 omission。

---

## 3. 主结论组 · E（Runbook）high：**机制保留成立**

链路：`run-04`（Stage A，95 条）→ `run-08`（Stage B）+ 复现样本 `run-05 / run-06`

| anchor | Source | Inventory | Selection | Encoding | 归因 |
|---|---|---|---|---|---|
| bounded failure（连续 10 次 → REFUND_FAILED） | ✅ §4.7/§6.4 | ✅ S-62 | represented → C-02 | ✅ C-02 label 含"10 次失败上限" | **保留** |
| abnormal path（补偿失败 / 重试） | ✅ | ✅ S-35 · S-58 | represented → C-02 | ✅ | **保留** |
| manual intervention（强制补偿） | ✅ | ✅ S-03 · S-37 | represented → E-02 / C-01 | ✅ | **保留**（run-06 显式写「仅管理员强制补偿」） |
| privilege boundary（越权 / 仅管理员） | ✅ | ✅ S-37 · S-44 | represented → C-01 | ✅ C-01 含"订单所有者校验 / admin_whitelist" | **保留** |
| invariant（幂等 / 资产回补 / 成对） | ✅ | ✅ 7 条 | represented → C-02 等 | ✅ | **保留** |
| **state machine**（afterSalesStatus 转换链） | ✅ | ✅ 19 条（run-04） | represented → **E-06[state]** | ✅ 有 `state` 元素 | **保留**（high 3/3 都有） |

```text
E1 = 0 · E2 = 0 · E3 = 0（anchor 级）· E4 = 未见（12+8 条边逐条读过，label 未偷带新主体）· E5 = 已被压住
```

**E5 被压住的证据**：`1:1 target 占比 42% → 13–32%`；`max fan-in 8 → 14–17`；`elements 81 → 12/13`。

**E 组的登记限制（不是失败）**：`C-01 / C-02 / C-03` 各吸收 12–17 条语义，label 到类别级 →
**Constraint Composition / Compression Gap**（见 §6）。

**E 组的一处一致性观察（不判 E3）**：§8 速查表的 symptom→cause 条目，在 run-05/06 走 `topic-only`，
在 run-08 有两条挂到 `E-01 / E-06`（target 文本不含该条目）。经抽样：两处**主题相关且合理**
（S-71 缺 mode→重新部署 → `E-01 部署流程`；S-76 状态为空 → `E-06 状态机`），属**粒度选择不一致**，
不是虚假声称。登记为观察项。

---

## 4. 主结论组 · D（ER-heavy）high：**Compression regression（未关闭）**

链路：`fixture-d/run-04`（Stage A 136 条 → Stage B 13 elements · 12 edges）

| 项 | 结果 |
|---|---|
| 12 个人工实体覆盖 | ✅ **12/12** |
| 不啰嗦 | ✅ 13 elements（对照 F07 23 / E5 失败样本 81） |
| A1 核心聚合与归属 · A4 执行事实三分 · A5 跨实体引用 · A6 条件唯一性 · A7 遗留迁移 | ✅ 语义在（多数落在 constraint / element） |
| **A2 Task 依赖图** | ❌ **E3 · Encoding Distortion** |

### ⭐ 唯一的**确认** E3（这是 F10 最重要的负面结果之一）

```text
Source     原文明确：S-56「持久化依赖使用 Task.dependsOnTaskIds」
                     S-63「每个依赖必须引用同一 PlanBundle 中的 Task；自依赖、重复引用、缺失引用与环均无效」
                     S-64「依赖仅当被引用 Task 状态为 done 时满足」
Inventory  ✅ 三条都抽到了
Selection  三条都 represented → C-PlanStructureAndState
Encoding   D 图 12 条边：consumes 7 · produces 3 · relates-to 2 —— **depends-on = 0，自环 = 0**
           → **基础关系层（第 1 层）被删除**，只剩第 3 层（constraint 里的无环性 / 满足条件）
```

**违反 F09 冻结的三层原则自身**：第 3 层不能替代第 1 层。
对照：F07 的 D 三次 run **都有 `task → task` 自环**；人工 candidate map 也有 `E-06 depends-on E-06`。

**归因：不是 E1（全在 inventory 里），也不是"L0 不需要细节"，而是基础关系被错误降级成约束 → E3。**
**处置：保持未关闭**（用户裁决：不用 prompt 打补丁）。

### D 组的 omissions（2 条，均合法）

```text
S-62 ≈ S-53（同义重复：Stage.estimatedMinutes 语义）→ reason 明确指向重复项
S-84 ≈ S-101（同义兼容边界语义）→ 同上
→ 属"避免 E5"的正确取舍，**不是 E2**
```

---

## 5. 历史对照 · F07（为什么不能拿机械关键词对照）

```text
F07 没有 inventory → 只能看 Encoding，**无法区分 E1/E2**（这正是 F10 要建立的能力）。

F07 的 E（按 F07 semantic review 的"结构性承载"口径）：
  bounded failure 0/3 · abnormal 0/3 · manual/privilege 0/3 · invariant 0/3
  （有的只在 edge.label 里，属 E4 边缘）
F07 的 D：
  12 实体覆盖 ✅ · 但 3/3/4 条 invented relation + 2/0/1 处方向错（E3）
```

> ⚠️ **方法论提醒**：本轮审计脚本里的关键词代理（"target 文本是否含 anchor 词"）**不能用于 F07 对照** ——
> 它会把"只在 label 里出现"也算 ✅（F07 恰恰是这种情况）。F07 的数字必须沿用其语义评审的结构性口径。

---

## 6. 登记（不是失败）：Known representation limitation

```text
Constraint Composition / Compression Gap
  D：C-PlanStructureAndState ← **39 条语义**，label 只到类别名
  E：C-01 / C-02 / C-03 ← 各 12–17 条
含义：coverage 保得住，但 **L0 的自描述性达到当前 Contract 的表达上限**。
理由（用户裁决）：只要这些语义没有被虚假声称或真正丢失，**不算 E5**。
处置：进入下一阶段 representation design（constraint 的组成表达面），**F10 不修**。
```

---

## 7. 成本附录（low run-10 / run-11 · 不参与主语义判断）

```text
成本：Stage A 省 80%（reasoning 93%）· Stage B 省 61%（reasoning 65%）
但两个 low 样本各自复现退化：
  ① ontology：state 元素 2/2 消失（high 3/3 有）
  ② structural：状态机被压平 2/2
  ③ run-11 丢 bounded failure，且是 **E3.false-represented**：
       S-33（连续 10 次失败 → REFUND_FAILED）声明 represented → E-08，
       但 E-08 与全图 **REFUND_FAILED / 连续 10 次 均 0 命中**
→ 已裁决：**low 不设为默认**，仅作显式成本模式（`results/low-effort-verdict.md`）
```

---

## 8. Gate 结论（用户指定的表述）

```text
F10 Gate = PARTIAL PASS
```

**成立：**

```text
· 两阶段 Semantic Grounding 能显著改善 Runbook 机制保留（E 的 4 类机制 anchor 从 0–1/3 → 4/4）
· Semantic extraction 变得**可审计**（Source→Inventory→Selection→Encoding 链已在真实故障上用过两次：
  run-10 的 state 丢失定位到 Encoding；run-11 的 false-represented 被链路抓出）
· Selection compression 初步稳定（E 13/13/12 elements；E5 从 81 elements 压到 12–13）
· E5 over-representation 被压制（1:1 42% → 19–32%）
· E 的关键机制在 **high effort** 下稳定保留
· **high effort 应作为默认**
· low effort 显著省成本，但存在**可复现**的结构/类型保真退化
```

**未关闭：**

```text
① D 的核心基础 relation resolution regression（Task depends-on Task）→ E3
② Constraint Composition / Compression Gap（已登记为下一阶段议题）
③ 个别 selection correctness 待人工确认 —— 本轮的 §8 速查条目路由不一致（观察项）
④ run-08 的 S-40 → 已裁决为合法 omission（不再是悬案）
```

---

## 9. 审计方法与局限（诚实登记）

```text
· "target 是否真的承载"用的是**关键词代理**，已发现假阳性（例：D 的 S-80/81/82/86 → E-ExecutionEvidence，
  经抽样确认其语义正是 FocusSession/TaskResult → 属正确归属，不是 E3）。
  所有 E3 判定都经过**逐条抽样核实**，未核实的一律不写成结论。
· 边级 E4 审计：主样本 12 + 8 条边**逐条读过**，未见 label 偷带新主体；
  但**未**做全量穷尽（低样本未逐边审）。
· 抽取-选择之间的"灰色"（如 §8 速查条目）标为**观察项**，不计入 E1–E5 计数。
· 思维链未落盘 → **意图不可判**（"明知故犯 vs 能力不足"），本报告只依据产物形态。
```

---

## 10. F10 收口

```text
Feature 10 · Semantic Grounding = Completed / Closed（Gate = PARTIAL PASS）
下一步：F08（L0 UI）→ 之后再谈 Overview / Framework Map 接回 Electron 主流程。
```

**交接给 F08 的边界（已经不需要再研究模型）：**

```text
Contract                          稳定（v1 定稿）
Validator                         稳定（check-map · 46 个用例 + 48 条两阶段安全断言）
High-effort semantic grounding     可用，但有已知限制：
                                     · D 类文档的基础关系层可能被 constraint 吸收（未关闭）
                                     · constraint 自描述性受 Contract 表达面上限
Low-effort                        成本模式，**不默认**
```
