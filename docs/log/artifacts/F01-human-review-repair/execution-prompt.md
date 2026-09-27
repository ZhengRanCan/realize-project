# Human Review Repair - Execution Prompt

## Context

Stage 2 Full Run 已完成：
- 21/21 blocks 生成成功
- Core coverage: 75/75, Supporting: 9/9, Total: 84/84
- Provenance: 146/146
- Semantic fidelity Hard Error: 0
- Renderer mismatch: 0

人工验收发现 6 个需要修复的问题，本次任务仅处理这 6 个问题。

## Constraints

**允许修改：**
- Gold overview-plan (`fixtures/context-consumption.overview-plan.json`)
- sourceUnits（仅在确认原 sourceUnit 粒度过粗时）
- 受影响 block 的 plan
- defaultExpanded / stage / block 顺序
- Renderer 对已有 flow 数据的表达（如果确实需要支持正确 topology）

**不允许：**
- 修改 Stage 1 Prompt
- 大改 Stage 2 Prompt
- 增加新的 AI 阶段
- 增加新的 shape vocabulary
- 接 Electron 主流程
- 进入 Phase 3
- 读取源码
- 使用 Stage 1 generated plan
- 为了消除 warning 重跑全部 block
- 让 AI 生成 HTML

## Task Breakdown

### Phase 1: Deterministic Fixes (Low Risk)

#### Fix 1.1: O-15 标题错误
**问题：** 当前标题写"明确不决定的 9 项 / 明确不承诺的 5 项"，原文实际是 8 项 / 5 项

**修复位置：**
- `fixtures/context-consumption.overview-plan.json` 中 O-15 的 title
- `experiments/stage2-full/blocks/O-15/block.generated.json` 的 title
- 如果存在其他引用该数字的文档

**验收标准：**
- 所有位置统一为"明确不决定的 8 项 / 明确不承诺的 5 项"
- 原文§15 实际有 8 个"不决定"项（查看 lines 523-530）

#### Fix 1.2: O-10b 默认折叠
**问题：** O-10b 内容较长（15 items），应该默认折叠

**修复位置：**
- `fixtures/context-consumption.overview-plan.json` 中 O-10b 的 defaultExpanded
- 不需要重新生成内容

**验收标准：**
- `defaultExpanded: false`

#### Fix 1.3: O-16 移动到 prove stage
**问题：** O-16 讲的是 Consumption Subject，是理解 Evidence 的前提，应该在 "丙 · 怎么算发生了" stage

**修复位置：**
- `fixtures/context-consumption.overview-plan.json` 中 O-16 的 stage
- `fixtures/context-consumption.overview-plan.json` 中 prove stage 的 blockIds 顺序

**目标顺序（prove stage）：**
```
O-09  (Consumption 定义与递进)
O-16  (Consumption Subject - 移到这里)
O-10  (HOW DO WE KNOW)
O-10b (哪些东西不能证明)
O-10c (两个反直觉判断)
O-11  (Consumption 不要求什么)
O-11b (Possible mismatch states)
```

**验收标准：**
- O-16 的 stage 字段改为 "prove"
- prove stage 的 blockIds 按上述顺序排列
- boundary stage 中移除 O-16

### Phase 2: SourceUnit Split (Medium Risk)

#### Fix 2.1: O-08 sourceUnit 粒度过粗
**问题：** 当前 O-08 只表达了"不要求直接交给生成器的对象"，但漏掉了另一组边界：Consumption 的对象不是 runtime/UI/route/sceneId 等实现控制对象

**原文位置：** `测试文档/18-context-consumption-semantic-model.md` §5 第 228 行附近：

```text
Consumption 的对象是语义要求和教学取向，不是：

sceneId；
route；
React 组件；
播放器命令；
checkpoint/remediation 创建命令；
RuntimeState 修改；
浏览器操作指令。
```

**执行步骤：**

1. **拆分 sourceUnit**
   - 找到当前承载这部分的 sourceUnit（可能是 SU-024 或相邻的）
   - 拆成两个独立 sourceUnit：
     - A: "Consumption 不要求将 raw Proposal / 内部响应 / 工具轨迹 / 模型推理直接交给生成器"
     - B: "Consumption 的对象不是 runtime / UI / route / sceneId / browser command 等实现控制对象"
   - 新 ID 按现有规则生成（SU-024a / SU-024b 或新 ID）

2. **更新 Gold overview-plan**
   - O-08 的 covers 包含两个新 sourceUnit ID
   - 如果其他 blocks 引用了被拆分的 sourceUnit，同步更新

3. **重新生成 O-08**
   - 使用 Stage 2 重新生成 O-08 的 content
   - 确保两组语义都明确展示
   - 推荐仍然复用 two-column-comparison 或 checklist shape

**验收标准：**
- 两个新 sourceUnit 都有独立 ID、section、statement
- O-08 的 content 明确展示两组边界
- 运行 `npm run check-overview`，core coverage 仍然 100%

#### Fix 2.2: O-05 Receipt/Availability 语义串层
**问题：** 当前 O-05 的 Receipt 节点包含了 "合法、冻结、版本一致"，这些属于 Availability

**原文边界：**
- Receipt (§3): 只能表达上下文到达、能关联请求/session lineage、接收事实被记录
- Availability (§4): 合法、冻结、版本一致、当前生成可用

**执行步骤：**

1. **检查 sourceUnits**
   - 查看 SU-035 (Receipt 相关) 是否混入了 Availability 语义
   - 如果是，在 `fixtures/context-consumption.overview-plan.json` 中修正其 statement
   - 如果不是，问题出在 Stage 2 生成时错误融合了相邻 sourceUnits

2. **检查 O-05 的 covers 和 provenance**
   - Receipt 节点的 sourceUnitIds 应该只包含 Receipt 相关的 sourceUnit
   - Availability 节点的 sourceUnitIds 应该只包含 Availability 相关的 sourceUnit

3. **重新生成 O-05**
   - 使用 Stage 2 重新生成 O-05 的 content
   - 确保 Receipt 节点不包含任何 Availability 断言
   - Context-side flow 的三个节点语义边界清晰

**验收标准：**
- Receipt 节点的 detail 不包含：合法、冻结、版本一致、可用
- Receipt 节点只表达：到达、能关联、接收事实
- Availability 节点才包含：合法、冻结、版本一致、可被本次生成使用
- Consumption 节点才包含：实际参与生成、作为课程设计输入

### Phase 3: Visual Topology (Highest Risk)

#### Fix 3.1: O-04 Visual Topology Fidelity
**问题：** Current lane 中 "scene 直接读取 formal context" 主要被塞进 edge note，没有形成足够清晰的独立分支

**目标视觉拓扑：**

Current 应明确表达：
```
Frozen Context
   │
   ├──→ outline generation
   │
   └──→ scene-content route
          ↓
        scene
```

Target 应明确表达：
```
Frozen Context
       ↓
outline generation
       ↓
context-shaped Outline
       ↓
scene generation
```

**执行步骤：**

1. **调研现有 flow contract**
   - 查看 `schema/overview-plan.schema.json` 或相关 flow shape 定义
   - 确认是否已支持 branch 表达（例如一个 node 有多个后继 edge）
   - 查看 renderer 代码（如果可访问）了解如何渲染 flow

2. **选择实现方案**（按优先级）：
   - **方案 A**：如果 flow 已支持 branch，直接调整 O-04 数据
   - **方案 B**：如果不支持，考虑在 Current lane 中增加一个平行节点表示 scene 直接读取路径
   - **方案 C**：最小扩展 - 在某个 node 增加 `additionalPaths` 或类似字段
   - **方案 D**：换用 combo shape（避免改 renderer，但可能语义不够准确）

3. **实现修改**
   - 修改 `fixtures/context-consumption.overview-plan.json` 中 O-04 的数据结构
   - 如果需要扩展 schema，只做最小必要修改
   - 不要为了一个 block 重新设计 flow shape 的核心 topology contract

4. **重新生成 O-04**（如果数据结构变化）
   - 使用 Stage 2 重新生成
   - 确保 Current/Target 的拓扑差异清晰可见

**验收标准：**
- 只看图（不读下面的长说明），用户能回答："Current 比 Target 多出的关键路径是什么？"
- 答案应该是："scene 可以直接读取 Frozen Context"
- Target 应明确显示 scene 只从 context-shaped outline 获取输入
- Semantic coverage 仍然完整（SU-044 ~ SU-056）

**⚠️ 重要提示：**
如果调研发现现有 flow contract 不支持清晰的 branch 表达，且扩展成本较高，应该**暂停此项修复**，报告给 reviewer，不要强行实现。

## Execution Order

1. **Phase 1** - 全部完成后运行 `npm run check-overview` 验证
2. **Phase 2** - 每个 sourceUnit 拆分后立即运行 `npm run check-overview`，确认无 coverage hole
3. **Phase 3** - 先调研再实施，如果风险太高可以跳过

## Verification Checklist

修复完成后，必须执行：

```bash
npm run validate
npm run audit
npm run check-plan
npm run test:plan
npm run test:block
npm run check-overview
npm run verify-preview
npm run selftest
```

确保：
- core semantic coverage = 100%
- supporting semantic coverage = 100%
- provenance = 100%
- Hard Error = 0
- warning 可以存在（只需要解释）

## Final Deliverables

完成后提供：

1. **修改清单**
   - 哪些 sourceUnits 被修改/拆分，为什么
   - 哪些 Gold Plan blocks 被修改
   - 哪些是 deterministic 修改，哪些重新调用了 Stage 2

2. **受影响 blocks 的 before/after 摘要**
   - 每个 block 的关键变化
   - Provenance 的变化

3. **全量验证结果**
   - 所有验证命令的输出
   - 更新后的 `check-overview` 结果

4. **更新后的 overview-preview.html**
   - 重新 deterministic assemble
   - 使用 Renderer 生成

5. **仍然存在的 warnings**
   - 列出所有 warning
   - 解释为什么可以接受

6. **新发现的问题**（如果有）
   - 是否发现新的 coverage hole
   - 是否有新的重复表达
   - 是否影响 Source 回查

## Risk Assessment

| Phase | Risk Level | Fallback |
|-------|-----------|----------|
| Phase 1 (Deterministic) | Low | 直接回滚 JSON 文件 |
| Phase 2 (SourceUnit) | Medium | 回滚 sourceUnits，保留原 block |
| Phase 3 (Topology) | High | 如果调研发现成本过高，跳过此项 |

## Success Criteria

最低标准：
- Phase 1 全部完成
- Phase 2 全部完成
- Phase 3 调研完成并给出方案建议

理想标准：
- 全部 6 个问题修复完成
- 所有验证通过
- Preview 能清晰体现修复效果
- 无新增 Hard Error
