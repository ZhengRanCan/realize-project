# Feature 01 执行结果：修改清单（modifications.md）

执行时间：2026-09-25 ~ 2026-09-26
执行范围：Phase 1（3 项 deterministic）、Phase 2（2 项 sourceUnit split）、Phase 3（视觉拓扑，方案 A 实施）
模型：`gpt-5.6-sol`（仅 Phase 2 / Phase 3 重新生成受影响的 block；Phase 1 全部为确定性修改，未调用 AI）

---

## 一、修改总览

| 类型 | 数量 | 是否需要调用 AI |
|---|---|---|
| Phase 1 deterministic 修改 | 3 项（4 处数据） | 否 |
| Phase 2 sourceUnit 拆分 | 3 个新单元 + 4 处 covers 调整 | 是（重新生成 O-05 / O-08 / O-10b / O-11） |
| Phase 3 视觉拓扑 | 1 处 runner 控制级指引 | 是（重新生成 O-04） |
| 上游脚本修正（保证 fixture 与 plan 一致） | 5 处 | 否 |
| 验证器口径修正 | 2 处 | 否 |

---

## 二、Phase 1：Deterministic Fixes

### Fix 1.1 — O-15 标题错误（并修正内容缺项）

**核对原文**：`测试文档/18-context-consumption-semantic-model.md` §15（L521-530）实际是 **8 个"不决定"项**，L532-538 是 **5 个"不承诺"项**。

**发现比报告的更严重**：不只是标题数字错。原 O-15 的 checklist 第一组**只有 7 个 item** —— 它把原文两条独立项
（"生成器如何消费上下文" 与 "Prompt、结构化 planner、模板或混合生成方式"）合并成了一条。
也就是说：**标题写 9、内容 7、原文 8**，三处都不一致。

**修改位置**（改生成脚本，保证 fixture 与 plan 同步）：

| 文件 | 修改 |
|---|---|
| `scripts/backfill-overview-blocks.js` | 标题 `9 项` → `8 项`；第一组 items 从 7 条恢复为 8 条（把 planner 那条独立出来） |
| `fixtures/context-consumption.json` | 由上述脚本重新生成 |
| `fixtures/context-consumption.overview-plan.json` | 由 `backfill-overview-plan.js` 同步 title |

**验收**：plan 与 fixture 的 O-15 标题均为「明确不决定的 8 项 / 明确不承诺的 5 项」；items 实测 **8 + 5**。

### Fix 1.2 — O-10b 默认折叠

| 文件 | 修改 |
|---|---|
| `scripts/backfill-overview-blocks.js` | `O10b.defaultExpanded: true` → `false` |
| `fixtures/context-consumption.json` / `.overview-plan.json` | 同步 |

**验收**：plan 与 fixture 均为 `defaultExpanded: false`；**content 未被修改**（重新生成时内容由 Stage 2 决定，本轮未重跑 O-10b 的语义生成，仅在后续 Phase 2 因 covers 变化重跑过一次）。

### Fix 1.3 — O-16 移入 prove stage

| 文件 | 修改 |
|---|---|
| `scripts/backfill-overview-blocks.js` | O-16 定义正式加入 fixture 的 `prove` 段；段内顺序 `[O09, O16, O10, O10b, O10c, O11, O11b]` |
| `scripts/backfill-overview-plan.js` | 新增"展示层同步"逻辑：plan 的 title / stage / defaultExpanded / 顺序以 fixture 的 overview 为权威 |
| `fixtures/context-consumption.json` | prove 段由 6 块变 **7 块**（O-16 首次进入人工 Overview） |
| `fixtures/context-consumption.overview-plan.json` | O-16 `stage: boundary` → `prove`；prove 段顺序与 fixture 一致 |

**验收**：plan 的 prove 顺序 = `O-09, O-16, O-10, O-10b, O-10c, O-11, O-11b`；boundary 段不再含 O-16；
fixture 的 prove 段顺序与 plan 完全一致。

---

## 三、Phase 2：SourceUnit Split

### Fix 2.1 — O-08 缺失的实现控制对象边界

**原文依据**：§5 L207-219 —— "Consumption 的对象是语义要求和教学取向，不是：sceneId；route；React 组件；
播放器命令；checkpoint/remediation 创建命令；RuntimeState 修改；浏览器操作指令。"

**结论**：报告中的猜测（"可能是 SU-024 或相邻的"）部分正确 —— 原 SU-024 只表达了
"不要求把 raw Proposal / 内部响应 / 工具轨迹 / 模型推理**直接交给生成器**"，
**完全没有覆盖** runtime / UI / route 这一组实现控制对象。

**新增 3 个语义单元**（追加到 sourceUnits 末尾，避免重编号导致全部 covers 引用失效）：

| ID | section | kind | importance | statement |
|---|---|---|---|---|
| SU-085 | §5 | non-claim | **core** | Consumption 的对象是语义要求和教学取向，不是 sceneId、route、React 组件、播放器命令、checkpoint/remediation 创建命令、RuntimeState 修改、浏览器操作指令等实现控制对象。 |
| SU-086 | §5 | negative-case | supporting | Prompt 长度增加不能作为 Consumption 的证据。 |
| SU-087 | §5 | boundary | supporting | 某项 Recommended 被纳入设计考虑后最终未采用时，会在 Output Alignment 中记录为 Not adopted，但不能伪称为已经采用。 |

**covers 调整**：
- O-08：`['SU-023','SU-024']` → `['SU-023','SU-024','SU-085']`
- O-10b：加入 `SU-086`（它本就在该块的清单里）
- O-11：加入 `SU-087`（它本就在"不要求盲从"组里）
- O-05：见 Fix 2.2

**fixture 侧同步**：O-08 从 2 个 panel 扩为 **3 个 panel**（新增"不是消费对象的实现控制对象"，7 个 item）。

**重新生成**：O-08（Stage 2，1 次）。

**验收**：O-08 content 同时出现两组边界的关键词 —— `raw Proposal` / `工具轨迹` / `模型推理` /
`sceneId` / `route` / `React` / `RuntimeState` / `浏览器操作指令` 全部命中；coverage 3/3。

### Fix 2.2 — O-05 Receipt / Availability 串层

**报告结论**：Receipt 节点包含了"合法、冻结、版本一致"。

**确认**：成立。修复前实测：

| 节点 | 修复前 detail | 违规措辞 |
|---|---|---|
| Context Receipt | 本次生成收到**合法、冻结、版本一致**的课前教学语义。 | 合法 / 冻结 / 版本一致 |

**根因比报告更深（本轮最重要的发现）**：不只是"Stage 2 生成时错误融合"。
**O-05 的 covers 里根本没有三级定义** —— 它覆盖的是 SU-002 / SU-008~011 / SU-035 / SU-036，全是"两条链"层面。
模型拿不到三级定义，于是把 SU-035（§7 的完整叙事）当作三级定义来用，
并给 Availability 节点错挂 SU-035、给 Consumption 节点错挂 SU-009（§2 定义的是"链"，不是"消费"）。

同时发现 **SU-035 与 SU-004 语义重复**（都在定义三级），而 O-02 的梯子实际只用了 SU-004 的表述。

**修改**：
1. O-05 的 covers 增加 `SU-003` / `SU-004`（§1 的三级递进与三级定义），移除重复的 `SU-035`：
   `['SU-002','SU-003','SU-004','SU-008','SU-009','SU-010','SU-011','SU-036']`
2. `SU-035` 登记为 `duplicatesMerged → O-02`，importance 由 **core 降为 supporting**
   （理由：O-02 的内容并未包含 SU-035 特有的"完整叙事"表述，标为 core 会要求它声称一个并未承载的单元）
3. Stage 2 prompt 增加一条通用规则：**相邻层级之间不得串层**（判据：元素文本必须限定在自己
   `sourceUnitIds` 指的那一条语义内；出现了只有相邻单元才有的措辞即为串层）
4. 重新生成 O-05（2 次；首次因发现 covers 缺 SU-002 而作废并补回）

**验收（修复后实测）**：

```
Context Receipt        src=SU-003,SU-004   上下文到达了系统。
Context Availability   src=SU-004          合法、冻结、版本一致的上下文已可被本次生成使用。
Context Consumption    src=SU-004,SU-009   本次生成任务实际把其中的教学语义作为课程设计输入。
```

Receipt 节点对"合法 / 冻结 / 版本一致 / 准备好 / 可用"的检查：**全部未命中**。

---

## 四、Phase 3：Visual Topology

### Fix 3.1 — O-04 分支路径不可见

**调研结论：采用方案 A（现有 flow 契约已支持，无需改 schema / renderer / 新增 shape）。**

依据：
- `schema/stage2-block.schema.json` 的 `flowLane` 里，`nodes[]` 是**线性**序列，一项 = `{ node, edge }`，
  一个 node 后只能跟一条 edge —— 契约本身**没有** branch 字段（方案 B/C 需要改 schema）。
- 但 `flowNode.tier` 已有 `"primary" | "secondary"` 两个取值，`styles.css` 里
  `.fnode.secondary { margin-left: 16px; }` —— **secondary 就是"同 lane 内的派生分支路径"的既定表达方式**，
  renderer 会缩进渲染。

**因此不需要动 schema、不需要动 renderer、不需要换 shape。**

**修改**：只在 `scripts/ai-block.js` 增加一块**控制级**的 `BLOCK_GUIDANCE['O-04']`
（说明"用什么结构表达分支"，不替模型决定语义），并重新生成 O-04（1 次）。

**验收（修复后实测）**：

```
CURRENT
   ├─(主干) Frozen Context              edge=plain
   ├─(主干) outline route                edge=problem   note: 代码上仍存在 scene prompt 直接附加 formal context 的旁支路径
   └─(旁支) scene-content route          edge=plain     调用 appendFormalTeachingPrompt()；scene prompt 直接附加 formal context
   └─(旁支) scene                        edge=changed

TARGET
   ├─(主干) Frozen Context → outline generation → Outline Revision → scene   （单一路径，无旁支）
```

- 当前 lane 的 secondary 节点数：**2**（修复前为 0，分支只藏在 edge.note 里）
- 只看图可回答"Current 比 Target 多出的关键路径是什么？" → **scene 可以直接读取 Frozen Context**

---

## 五、为保证 fixture / plan / 脚本三者一致而做的上游修正

| 文件 | 修改 | 原因 |
|---|---|---|
| `scripts/backfill-overview-plan.js` | 新增"展示层同步"：title / stage / defaultExpanded / 顺序以 fixture 的 overview 为权威 | 原先只改 fixture 时 plan 不会跟着变，导致两处不一致（本轮一开始就踩到） |
| `scripts/backfill-overview-plan.js` | 自检 2 改为"covers 覆盖 **或** duplicatesMerged 登记" | 原逻辑不认合并登记，把已合并单元误判为未覆盖 |
| `scripts/backfill-overview-blocks.js` | 移除 O-08 panel 上的 `sourceUnitIds`；lane 级 note 改为 content 级 note；删除 section 级 note | 这三处都不被 design-review schema 允许（人工 Overview 不带 provenance） |
| `scripts/check-overview.js` | 覆盖判定加入 duplicatesMerged 支持 | 与 check-plan 口径一致，避免把"已合并"误判为丢失 |
| `scripts/full-run-report.js` | 同上（统计口径对齐） | 同上 |
| `app/main/main.js` | selftest 的 lane 期望值改为只统计**默认展开**的块 | O-16 移入 prove 且变为需要展开后，原断言把折叠块的 lane 也算进去了 |

---

## 六、修改过的文件清单

**数据 / 生成脚本**
- `scripts/backfill-overview-blocks.js`（Fix 1.1 / 1.2 / 1.3 / 2.1 fixture 侧 + schema 合规修正）
- `scripts/backfill-overview-plan.js`（Fix 1.3 / 2.1 / 2.2 plan 侧 + 展示层同步 + 自检口径）
- `fixtures/context-consumption.json`（重新生成：21 块，prove 7 块）
- `fixtures/context-consumption.overview-plan.json`（重新生成：87 sourceUnits / 21 blocks / 11 组合并）

**验证器**
- `scripts/check-overview.js`（合并登记支持）
- `scripts/full-run-report.js`（统计口径）
- `app/main/main.js`（selftest lane 断言）

**Prompt（两处小修正，未大改）**
- `ai/stage2-blocks.prompt.md`：新增"相邻层级不得串层"
- `scripts/ai-block.js`：新增 `BLOCK_GUIDANCE['O-04']`（控制级视觉拓扑指引）

**重新生成的 block（6 个）**
- O-04（Fix 3.1）、O-05（Fix 2.2）、O-08（Fix 2.1）、O-10b、O-11（covers 变化）、O-16（第一次尝试，见下）

**未改动**：Stage 1 prompt、`schema/*.json`、`app/renderer/*`、Electron 主流程、sourceUnits 的 section / kind
（除 SU-035 的 importance 与新增 3 个单元）、任何 shape 词汇。
