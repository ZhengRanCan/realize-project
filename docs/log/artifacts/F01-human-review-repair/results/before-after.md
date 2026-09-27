# Feature 01 执行结果：Before / After 对比（before-after.md）

对比基准：
- **Before** = Stage 2 Full Run 的原始产物（`experiments/stage2-full/_before-fix/` 里保留了 O-05 / O-08 的原始文件）
- **After** = 本轮修复后的产物（`experiments/stage2-full/blocks/`）

---

## 1. 总览级对比

| 指标 | Before | After | 说明 |
|---|---|---|---|
| Blocks | 21 / 21 | 21 / 21 | 不变 |
| Core coverage | 75 / 75 | **75 / 75** | 不变（分母不变） |
| Supporting coverage | 9 / 9 | **12 / 12** | 分母 9 → 12（新增 SU-086 / SU-087 + SU-035 由 core 降为 supporting） |
| Total | 84 / 84 | **87 / 87** | 分母 84 → 87（Fix 2.1 新增 3 个单元） |
| Provenance | 146 / 146 | **151 / 151** | 元素数因 O-08 增加一个 panel、O-04 重排而变化 |
| Hard Error | 0 | **0** | 不变 |
| Renderer mismatch | 0 | **0** | 不变 |
| Warnings | 重复×9（overview 级） | 重复×17 + 密度×1（均为 **block 级**） | 见下"Warnings 说明" |
| Failures | 无 | **无** | 不变 |

> Warnings 的口径变化：Before 报告的"重复×9"来自 **overview 级**（同一 sourceUnit 跨多个 block）；
> After 显示的是 **block 级** 的 17 条"同一 sourceUnit 在多个元素里出现"。两者统计层次不同，不能直接比较。
> 经复算：**跨 block 重复 = 0 个**（没有任何 sourceUnit 出现在 >3 个 block 中）。

---

## 2. Fix 1.1 — O-15

| | Before | After |
|---|---|---|
| plan title | 明确不决定的 **9** 项 / 明确不承诺的 5 项 | 明确不决定的 **8** 项 / 明确不承诺的 5 项 |
| fixture title | 同上（9 项） | 8 项 / 5 项 |
| 第一组 items | **7 条**（把 planner 那条并进了上一条） | **8 条**（恢复原文的独立项） |
| 第二组 items | 5 条 | 5 条 |
| 与原文一致性 | ✗ 标题与内容都与 §15 不符 | ✓ 标题 8/5、内容 8+5，与 §15 逐条对应 |

---

## 3. Fix 1.2 — O-10b

| | Before | After |
|---|---|---|
| `defaultExpanded`（plan & fixture） | `true` | **`false`** |
| content | 13 items | 13 items（未变；covers 增加 SU-086，content 相应重生成过一次） |
| Preview 行为 | 首屏直接展开 13 条反例 | 默认折叠，需点击展开 |

---

## 4. Fix 1.3 — O-16

| | Before | After |
|---|---|---|
| plan `stage` | `boundary` | **`prove`** |
| prove 段块数 | 6（`O-09, O-10, O-10b, O-10c, O-11, O-11b`） | **7**（`O-09, O-16, O-10, ...`） |
| boundary 段块数 | 5（含 O-16） | 4（不含 O-16） |
| fixture 是否含 O-16 | **否**（人工 Overview 从未包含它） | **是**（首次进入 fixture，位于 prove 段 O-09 之后） |
| Preview 位置 | 丁 · 边界与反模式（最后一块） | **丙 · 怎么算发生了**，位于 O-10 之前 |
| 阅读逻辑 | 先看"怎么举证"，最后才看到"主体是谁" | 先了解 Subject（Frozen Context × Attempt），再了解证据方式 |

---

## 5. Fix 2.1 — O-08

| | Before | After |
|---|---|---|
| plan covers | `SU-023, SU-024`（2 条） | `SU-023, SU-024, SU-085`（**3 条**） |
| shape | two-column-comparison | two-column-comparison（未变，符合"仍可复用"的要求） |
| content panels | 2 个 | **3 个**（fixture）／2 个（Stage 2 生成，两组边界合并在一栏） |
| 表达的边界组数 | **1 组**（只讲了"不要求直接交给生成器"） | **2 组**（+ "不是消费对象的实现控制对象"） |
| 关键词覆盖 | raw Proposal / 工具轨迹 / 模型推理 | 上述 **+ sceneId / route / React / 播放器命令 / RuntimeState / 浏览器操作指令** |
| coverage | 2/2 | 3/3 |

**人工核对结论**：两组语义都清晰可见 —— `raw Proposal`、`工具轨迹`、`模型推理` 与
`sceneId`、`route`、`React`、`播放器命令`、`RuntimeState`、`浏览器操作指令` 全部出现在 content 中。

---

## 6. Fix 2.2 — O-05

### provenance（这是本轮修掉的更深问题）

| 节点 | Before `sourceUnitIds` | After `sourceUnitIds` |
|---|---|---|
| Context Receipt | `SU-035` | `SU-003, SU-004` |
| Context Availability | `SU-035` | `SU-004` |
| Context Consumption | `SU-009`（← 实际是"链"的定义） | `SU-004, SU-009` |
| Output Alignment | `SU-011`（← 实际是"两条链"的边界） | `SU-010` |

### 语义边界

| 节点 | Before detail | After detail | 判定 |
|---|---|---|---|
| Context Receipt | 本次生成收到**合法、冻结、版本一致**的课前教学语义。 | 上下文到达了系统。 | ✅ 不再串层 |
| Context Availability | 冻结教学语义**已到达并准备**作为课程设计输入。 | 合法、冻结、版本一致的上下文已可被本次生成使用。 | ✅ 归位 |
| Context Consumption | 冻结教学语义实际参与生成过程，并作为课程设计输入使用。 | 本次生成任务实际把其中的教学语义作为课程设计输入。 | ✅ 归位 |

**Receipt 节点禁用词检查**（合法 / 冻结 / 版本一致 / 准备好 / 可用）：Before 命中 3 个 → **After 命中 0 个**。

### 附带修正

| | Before | After |
|---|---|---|
| O-05 covers | `SU-002, SU-008~011, SU-035, SU-036`（无三级定义） | `SU-002, SU-003, SU-004, SU-008~011, SU-036`（补入三级定义，移除重复的 SU-035） |
| SU-035 importance | `core`（但 O-02 并未承载它的"完整叙事"表述） | `supporting`，并登记 `duplicatesMerged → O-02` |

---

## 7. Fix 3.1 — O-04

### Before（分支藏在 edge.note 里）

```
CURRENT
   ├─ 课前 outline 入口            edge=plain
   ├─ 投影进入 outline generation  edge=plain
   └─ 现有 Formal Generation Context 投影   edge=problem
      （"scene 也直接吃完整 context" 只写在 edge.note 文本里，图上没有独立路径）
```

### After（分支以 secondary 节点呈现，renderer 缩进渲染）

```
CURRENT
   ├─(主干) Frozen Context        edge=plain
   ├─(主干) outline route          edge=problem  note: 代码上仍存在 scene prompt 直接附加 formal context 的旁支路径
   └─(旁支) scene-content route    edge=plain    "调用 appendFormalTeachingPrompt()；scene prompt 直接附加 formal context"
   └─(旁支) scene                  edge=changed

TARGET
   ├─(主干) Frozen Context → outline generation → Outline Revision → scene（单一路径，无旁支）
```

| | Before | After |
|---|---|---|
| Current lane 的 secondary 节点数 | 0 | **2** |
| 分支是否有独立节点 | ✗ 只在 edge.note 文本里 | ✓ 两个 secondary 节点 |
| 只看图能否回答"Current 比 Target 多出的关键路径" | ✗ | ✓ **scene 可以直接读取 Frozen Context** |
| 拓扑结构变化 | — | 节点数 3 → 4，主干/旁支分离 |

**未改动**：schema、renderer、shape 词汇表。方案 A（现有契约已支持）成立。

---

## 8. 未受影响 block 的抽查（回归）

随机抽查 5 个本轮未重生成的 block，确认 content / covers / provenance 未变：

| Block | content 是否变化 | covers 是否变化 | provenance 是否变化 | 渲染是否正常 |
|---|---|---|---|---|
| O-01 | 未变 | 未变 | 未变 | ✓ |
| O-02 | 未变 | 未变 | 未变 | ✓ |
| O-07 | 未变 | 未变 | 未变 | ✓ |
| O-09 | 未变 | 未变 | 未变 | ✓ |
| O-12 | 未变 | 未变 | 未变 | ✓ |

（以上由 `overview.generated.json` 与报告逐块表核对；这些块的 `promptSha256` 仍是 Full Run 时的值，
说明它们是同一次生成、未被本轮触碰。）
