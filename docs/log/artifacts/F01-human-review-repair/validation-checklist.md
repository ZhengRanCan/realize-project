# Human Review Repair - Validation Checklist

这是执行 agent 完成修复后，reviewer 需要验证的检查清单。

## 1. Phase 1 验证（Deterministic Fixes）

### ✅ Fix 1.1: O-15 标题修正

检查位置：
- [ ] `fixtures/context-consumption.overview-plan.json` 中 O-15 block 的 title
- [ ] `experiments/stage2-full/blocks/O-15/block.generated.json` 的 title
- [ ] 原文 `测试文档/18-context-consumption-semantic-model.md` §15 (lines 519-541)

验证标准：
- [ ] 标题统一为 "明确不决定的 8 项 / 明确不承诺的 5 项"
- [ ] 原文§15 确实有 8 个"不决定"项，5 个"不承诺"项
- [ ] checklist content 中的 panel 标题与实际 item 数量一致

### ✅ Fix 1.2: O-10b 默认折叠

检查位置：
- [ ] `fixtures/context-consumption.overview-plan.json` 中 O-10b 的 defaultExpanded
- [ ] `experiments/stage2-full/blocks/O-10b/block.generated.json` 的 defaultExpanded

验证标准：
- [ ] `defaultExpanded: false`
- [ ] content 内容未被修改（15 items 完整保留）

### ✅ Fix 1.3: O-16 移动到 prove stage

检查位置：
- [ ] `fixtures/context-consumption.overview-plan.json` 中 O-16 的 stage 字段
- [ ] `fixtures/context-consumption.overview-plan.json` 中 stages[2] (prove) 的 blockIds
- [ ] `fixtures/context-consumption.overview-plan.json` 中 stages[3] (boundary) 的 blockIds

验证标准：
- [ ] O-16 的 stage 字段 = "prove"
- [ ] prove stage 的 blockIds 顺序：`["O-09", "O-16", "O-10", "O-10b", "O-10c", "O-11", "O-11b"]`
- [ ] boundary stage 的 blockIds 不再包含 O-16
- [ ] O-16 的 content 未被修改（只移动位置）

### Phase 1 整体验证
- [ ] 运行 `npm run check-overview`，无新增 Hard Error
- [ ] Core coverage 仍然 75/75
- [ ] Supporting coverage 仍然 9/9
- [ ] Provenance 仍然 146/146

---

## 2. Phase 2 验证（SourceUnit Split）

### ✅ Fix 2.1: O-08 sourceUnit 拆分

检查位置：
- [ ] `fixtures/context-consumption.overview-plan.json` 的 sourceUnits 数组
- [ ] O-08 的 covers 字段
- [ ] `experiments/stage2-full/blocks/O-08/block.generated.json`

验证 sourceUnit 拆分：
- [ ] 原 SU-024 被拆分为两个独立 sourceUnit（或新增一个 sourceUnit）
- [ ] SourceUnit A: "Consumption 不要求将 raw Proposal / 内部响应 / 工具轨迹 / 模型推理直接交给生成器"
- [ ] SourceUnit B: "Consumption 的对象不是 runtime / UI / route / sceneId / browser command 等实现控制对象"
- [ ] 两个 sourceUnit 都有正确的 section (§5)、kind、importance

验证 O-08 content：
- [ ] O-08 的 covers 包含两个 sourceUnit ID
- [ ] Content 明确展示两组边界（不是只有一组）
- [ ] 第一组：raw Proposal、DeepTutor 内部响应、工具轨迹、模型推理
- [ ] 第二组：sceneId、route、React 组件、播放器命令、RuntimeState 修改、浏览器操作指令
- [ ] Shape 仍然是 two-column-comparison 或 checklist

验证无副作用：
- [ ] 检查是否有其他 blocks 引用了被拆分的 sourceUnit
- [ ] 如果有，确认它们的 covers 已同步更新
- [ ] 运行 `npm run check-overview`，确认无 coverage hole

### ✅ Fix 2.2: O-05 Receipt/Availability 语义串层

检查位置：
- [ ] `fixtures/context-consumption.overview-plan.json` 的 sourceUnits（特别是 SU-035）
- [ ] O-05 的 covers 和 content
- [ ] `experiments/stage2-full/blocks/O-05/block.generated.json`

验证 sourceUnit 边界（如果被修正）：
- [ ] SU-035 或相关 Receipt sourceUnit 的 statement 不包含 Availability 语义
- [ ] Receipt 相关 sourceUnit 只表达：到达、能关联、接收事实
- [ ] Availability 相关 sourceUnit 才包含：合法、冻结、版本一致

验证 O-05 content：
- [ ] Context-side flow 有三个节点：Receipt → Availability → Consumption
- [ ] Receipt 节点的 detail 不包含以下词汇：
  - [ ] "合法"
  - [ ] "冻结"
  - [ ] "版本一致"
  - [ ] "可用" / "可以被使用"
  - [ ] "准备好" / "ready"
- [ ] Receipt 节点只表达：
  - [ ] 上下文到达本次生成
  - [ ] 可以识别/关联请求或 session lineage
  - [ ] 接收事实被记录
- [ ] Availability 节点才包含：合法、冻结、版本一致、可被本次生成使用
- [ ] Consumption 节点才包含：实际参与生成、作为课程设计输入

验证 provenance：
- [ ] Receipt 节点的 sourceUnitIds 只包含 Receipt 相关的 sourceUnit
- [ ] Availability 节点的 sourceUnitIds 只包含 Availability 相关的 sourceUnit
- [ ] 每个节点的 provenance 与其语义边界一致

### Phase 2 整体验证
- [ ] 运行 `npm run check-overview`，无新增 Hard Error
- [ ] Core coverage 仍然 100%
- [ ] Supporting coverage 仍然 100%
- [ ] Provenance 仍然 100%（或因 sourceUnit 拆分而增加）
- [ ] 新增的 sourceUnits 都被至少一个 block 覆盖

---

## 3. Phase 3 验证（Visual Topology）

### ✅ Fix 3.1: O-04 Visual Topology

**前置检查：调研结果**
- [ ] Execution agent 提供了现有 flow contract 的能力分析
- [ ] 明确了选择的实现方案（A/B/C/D）
- [ ] 如果跳过，给出了合理的理由

如果实施了修复：

检查位置：
- [ ] `fixtures/context-consumption.overview-plan.json` 中 O-04
- [ ] `experiments/stage2-full/blocks/O-04/block.generated.json`
- [ ] 如果扩展了 schema，检查相关 schema 文件
- [ ] 如果修改了 renderer，检查相关代码

验证视觉拓扑 - Current lane：
- [ ] 能明确看出 Frozen Context 有两条路径：
  - [ ] 路径 1：→ outline generation
  - [ ] 路径 2：→ scene-content route → scene
- [ ] "scene 直接读取 formal context" 不是只藏在 edge note 中
- [ ] 拓扑结构清晰，不需要读长文本就能理解

验证视觉拓扑 - Target lane：
- [ ] 明确显示单一路径：Frozen Context → outline generation → context-shaped Outline → scene generation
- [ ] Scene 不再独立重新消费完整 Frozen Context

验证语义完整性：
- [ ] O-04 的 covers 仍然包含 SU-044 ~ SU-056（8 个 sourceUnits）
- [ ] 所有 sourceUnits 的 provenance 仍然被 content 承载
- [ ] 关键概念未丢失：
  - [ ] appendFormalTeachingPrompt()
  - [ ] FormalGenerationContextProjection
  - [ ] scene-content route 的现有路径
  - [ ] 需要收敛的边界

验证实现质量：
- [ ] 如果扩展了 schema，是最小必要修改
- [ ] 没有为了一个 block 重新设计整个 flow shape
- [ ] 如果修改了 renderer，改动范围小且向后兼容
- [ ] 其他使用 flow shape 的 blocks 未受影响

用户体验验证（最重要）：
- [ ] 在 Preview 中只看图（不读说明），能回答："Current 比 Target 多出的关键路径是什么？"
- [ ] 答案应该是："scene 可以直接读取 Frozen Context"

### Phase 3 整体验证
- [ ] 运行 `npm run check-overview`，无新增 Hard Error
- [ ] 运行 `npm run verify-preview`，renderer 正常工作
- [ ] 所有其他 flow blocks (O-05, O-16) 未受影响

---

## 4. 全量验证

### 自动化验证
运行以下命令，全部通过：
- [ ] `npm run validate`
- [ ] `npm run audit`
- [ ] `npm run check-plan`
- [ ] `npm run test:plan`
- [ ] `npm run test:block`
- [ ] `npm run check-overview`
- [ ] `npm run verify-preview`
- [ ] `npm run selftest`

### Check-overview 结果对比

Before (原始):
```
Blocks          21 / 21
Core coverage   75 / 75
Supporting      9 / 9
Total           84 / 84
Provenance      146 / 146
Warnings        重复×9
Failures        无
```

After (修复后):
- [ ] Blocks: 仍然 21 / 21
- [ ] Core coverage: 仍然 75 / 75（或者如果 sourceUnit 拆分正确，可能是 76/76 或 77/77）
- [ ] Supporting: 仍然 9 / 9
- [ ] Total: 与 Core + Supporting 相符
- [ ] Provenance: >= 146（可能因 sourceUnit 拆分而增加）
- [ ] Warnings: 可以存在（需要解释）
- [ ] Failures: 仍然为 0

### Preview 验证
- [ ] `experiments/stage2-full/overview-preview.html` 已重新生成
- [ ] 用浏览器打开，页面正常渲染
- [ ] 左侧目录：4 段 / 21 条目
- [ ] O-16 出现在 "丙 · 怎么算发生了" 段中，位于 O-10 之前
- [ ] O-15 标题显示 "8 项 / 5 项"
- [ ] O-10b 默认折叠
- [ ] O-08 显示两组边界（如果修复了）
- [ ] O-05 的 Receipt 节点不包含 Availability 语义（如果修复了）
- [ ] O-04 的拓扑清晰可见（如果修复了）
- [ ] Source 回查功能正常
- [ ] 所有应当展开的区块都渲染了内容
- [ ] 折叠区块确实没有渲染内容

---

## 5. 交付物验证

### 文档完整性
- [ ] **修改清单**：列出了所有修改的 sourceUnits / blocks / 文件
- [ ] **Before/After 摘要**：每个受影响 block 的关键变化
- [ ] **验证结果**：所有自动化验证命令的输出
- [ ] **Check-overview 结果**：新的统计数据
- [ ] **Updated Preview**：新的 overview-preview.html
- [ ] **Warnings 解释**：列出并解释了所有仍然存在的 warnings
- [ ] **新发现问题**：如果有，明确列出

### 代码质量
- [ ] 所有 JSON 文件格式正确（可用 JSON linter 验证）
- [ ] SourceUnit IDs 遵循现有命名规则（SU-XXX）
- [ ] 新增的 sourceUnit 的 section / kind / statement / importance 字段完整
- [ ] Block covers 字段正确引用 sourceUnit IDs
- [ ] Provenance sourceUnitIds 正确引用 sourceUnit IDs

---

## 6. 回归测试

### 未受影响的 blocks 抽查
随机抽查 5 个未被修改的 blocks：
- [ ] Block 1: ________（填入 ID）- content 未变化
- [ ] Block 2: ________（填入 ID）- provenance 未变化
- [ ] Block 3: ________（填入 ID）- covers 未变化
- [ ] Block 4: ________（填入 ID）- 渲染正常
- [ ] Block 5: ________（填入 ID）- Source 回查正常

### 四段阅读流验证
- [ ] 甲 · 这是什么：6 blocks，信息量未明显变化
- [ ] 乙 · 它怎么跑：4 blocks，O-08 修复后更完整
- [ ] 丙 · 怎么算发生了：7 blocks（新增 O-16），顺序合理
- [ ] 丁 · 边界与反模式：4 blocks（移除 O-16），无逻辑断层

### Warnings 分析
对比原始 9 条 warnings：
- [ ] 重复引用的 warnings（Context Receipt 等）是否仍然存在
- [ ] 这些重复是否是有意的交叉引用（O-04c 与 O-07）
- [ ] 是否有新增的 warnings
- [ ] 如果有新 warnings，是否合理

---

## 7. 人工语义验证（最终裁决）

这是最重要的验证，需要 human reviewer 判断：

### O-05 语义边界
阅读修复后的 O-05，回答：
- [ ] Receipt 节点是否只表达"上下文到达"？
- [ ] 是否不再提前包含"合法、冻结、版本一致"？
- [ ] 三个节点的递进关系是否清晰？

### O-08 语义完整性
阅读修复后的 O-08，回答：
- [ ] 是否明确列出了"不要求直接交给生成器"的对象？
- [ ] 是否明确列出了"不是消费对象"的 runtime/UI 控制对象？
- [ ] 两组语义是否都清晰可见（不是只有一组）？

### O-04 视觉拓扑
查看修复后的 O-04 在 Preview 中的渲染，回答：
- [ ] 只看图，能否一眼看出 Current 和 Target 的主要差异？
- [ ] Current 的 "scene 直接读取 context" 路径是否清晰？
- [ ] 是否不需要阅读长段文字就能理解系统骨架？

### O-15 精确性
- [ ] 标题与原文一致（8 项 / 5 项）？
- [ ] 实际 items 数量与标题声称的数量一致？

### O-16 位置合理性
- [ ] 在 prove stage 中，O-16 出现在 O-10 之前是否更合理？
- [ ] 先了解 Subject（Frozen Context × Attempt）再了解证据方式，逻辑是否更清晰？

### O-10b 折叠合理性
- [ ] 15 items 的内容默认折叠是否合理？
- [ ] 折叠后是否仍然可以通过 title 和 Source 标签找到？

---

## 8. 最终判定

### 必须通过的标准（Hard Requirements）
- [ ] Phase 1 全部完成，无错误
- [ ] Phase 2 全部完成，无 coverage hole
- [ ] 所有自动化验证通过
- [ ] Core coverage = 100%
- [ ] Provenance = 100%
- [ ] Hard Error = 0
- [ ] Preview 正常渲染

### 可选标准（Nice to Have）
- [ ] Phase 3 完成（或给出合理的跳过理由）
- [ ] Warnings 数量未增加
- [ ] 人工语义验证全部通过

### 决策
- [ ] **ACCEPT** - 修复完全符合预期，可以合并
- [ ] **ACCEPT WITH NOTES** - 修复基本符合预期，但有小瑕疵需要记录
- [ ] **REJECT** - 修复未达标准，需要重新执行

---

## 9. Reviewer Notes

修复质量评分（1-5）：
- Phase 1 执行质量: ___/5
- Phase 2 执行质量: ___/5
- Phase 3 执行质量: ___/5（或 N/A）
- 文档完整性: ___/5
- 整体满意度: ___/5

发现的问题：
```
（在此记录验证过程中发现的任何问题）
```

改进建议：
```
（在此记录对后续类似任务的建议）
```

最终决定：________（ACCEPT / ACCEPT WITH NOTES / REJECT）

审核人：________
审核时间：________
