# Phase 1 验证：手工 L0/L1 Map 用户体验测试

## 测试目标

验证层级式认知地图（L0 → L1 → L2）是否比现有的"21 block 长列表"更容易理解。

## 测试材料

- **L0 Map**: `context-consumption-l0-map.json`
- **L1 Map 示例**: `t-02-generation-pipeline-l1-map.json`（Topic 2: 生成链路与消费点）
- **现有 Blocks**: 继续复用 `experiments/stage2-full/blocks/`

## 测试场景

### 场景 1: 首次打开文档

**当前体验（Baseline）**:
1. 打开 `overview-preview.html`
2. 看到左侧目录：甲 · 这是什么（6 blocks）、乙 · 它怎么跑（4 blocks）...
3. 主区域显示 21 个 block 的长列表
4. 需要滚动阅读所有内容

**新体验（L0 Map）**:
1. 打开文档
2. 看到 **Document Map**：5 个 Topic 卡片 + 关系箭头
3. 第一眼理解："这篇文档主要讲 5 件事"
4. 每个 Topic 卡片显示：
   - 标题（例如："生成链路与消费点"）
   - 一句话摘要
   - 核心问题
   - Block 数量

**测试问题**:
- [ ] 你能在 10 秒内回答"这篇文档主要讲几件事"吗？
- [ ] 5 个 Topic 的标题是否让你立即知道每个 Topic 的核心？
- [ ] 相比"21 个 block 长列表"，这个首页是否更容易抓住重点？

---

### 场景 2: 理解某个具体主题

**当前体验（Baseline）**:
1. 在左侧目录点击 "乙 · 它怎么跑"
2. 跳转到 O-04（当前 vs 目标链路）
3. 读完 O-04 后，手动滚动到 O-05、O-06...
4. 需要自己理解这些 blocks 之间的关系

**新体验（L1 Topic Map）**:
1. 在 L0 点击 "生成链路与消费点" Topic 卡片
2. 进入 **Topic Map**，看到：
   - Breadcrumb: `Context Consumption > 生成链路与消费点`
   - Topic 内部结构概览（Current vs Target 的对比图）
   - "为什么 Outline 是消费点？" 的 4 条理由
   - 5 个 Entry Points（深入了解的入口）
3. 点击 Entry Point "当前 vs 目标链路" 进入 O-04 block

**测试问题**:
- [ ] Topic Map 是否让你快速理解"这个 Topic 内部由什么组成"？
- [ ] "Current Problem" + "Rationale" 这种结构是否有帮助？
- [ ] 5 个 Entry Points 是否让你知道"可以从哪些角度深入"？
- [ ] 相比直接看到 5 个 blocks 的长列表，这种"先概览再深入"是否更舒服？

---

### 场景 3: 跨 Topic 理解关系

**当前体验（Baseline）**:
1. 读完 O-02（三级模型）
2. 读 O-04（生成链路）
3. 自己推断："三级模型定义了生成链路的职责边界"

**新体验（L0 Relations）**:
1. 在 L0 Document Map 看到：
   ```
   T-01 (三级语义模型)
         │
         │ defines (定义)
         ▼
   T-02 (生成链路与消费点)
         │
         │ produces evidence for (产生证据)
         ▼
   T-03 (Consumption Evidence)
   ```
2. 关系箭头明确标注："三级模型定义了生成链路的职责边界"

**测试问题**:
- [ ] Topic 之间的关系箭头是否有意义？
- [ ] 是否帮助你理解"为什么要按这个顺序阅读"？
- [ ] 相比自己推断，这种明确标注是否更清晰？

---

### 场景 4: 快速定位

**当前体验（Baseline）**:
1. 想找"为什么 Outline 是消费点"
2. 在左侧目录中扫描 21 个 block 标题
3. 点击 O-04b

**新体验（L1 Entry Points）**:
1. 在 L0 点击 "生成链路与消费点"
2. 在 L1 看到 5 个 Entry Points
3. 点击 "为什么 Outline 是消费点"
4. 直达 O-04b

**测试问题**:
- [ ] Entry Points 是否让你更快找到想看的内容？
- [ ] Entry Point 的描述是否清楚（例如："为什么不把消费点放在 scene"）？

---

### 场景 5: 切换阅读模式

**新体验（Map vs Read）**:
1. 顶部有两个按钮：`[ Map ]` `[ Read ]`
2. 默认是 Map 模式（L0 → L1 → L2）
3. 点击 Read 模式，回到现有的四段式：甲 · 这是什么 → 乙 · 它怎么跑 → ...

**测试问题**:
- [ ] 两种模式的切换是否自然？
- [ ] Map 模式适合什么场景？（例如：快速理解、找特定内容）
- [ ] Read 模式适合什么场景？（例如：从头到尾顺序阅读）

---

## 验收标准

### 必须通过（Hard Requirements）

- [ ] **L0 信息密度合理**: 5 个 Topic，不是 17 个
- [ ] **L0 第一眼有效**: 用户能在 10 秒内说出"这篇文档主要讲 5 件事"
- [ ] **L1 结构清晰**: Topic Map 让用户理解"这个 Topic 内部由什么组成"
- [ ] **Breadcrumb 可用**: 用户永远知道"我在哪一层"，能快速返回

### 可选标准（Nice to Have）

- [ ] **Relations 有意义**: Topic 之间的关系箭头不是随机连线
- [ ] **Entry Points 实用**: 用户认为"比扫描 block 标题列表更快"
- [ ] **模式切换有价值**: 至少 1 位用户会主动使用两种模式

---

## 测试方法

### 方法 1: 自己测试（立即可做）

1. **打开现有 Preview**: `experiments/stage2-full/overview-preview.html`
2. **计时阅读**: 记录"理解整篇文档结构"需要多久
3. **模拟 L0 体验**:
   - 在纸上画出 5 个 Topic 卡片
   - 写下每个 Topic 的标题和一句话摘要
   - 看着这张图，问自己："我能更快理解文档结构吗？"

### 方法 2: 实现 Mock UI（本周内）

1. **修改 `overview-preview.html`**:
   - 增加顶部模式切换按钮
   - 增加 L0 Document Map 视图（用静态 HTML + CSS 模拟）
   - 增加 L1 Topic Map 视图（用 T-02 作为示例）
2. **测试交互**:
   - L0 → L1 → L2 的导航是否流畅
   - Breadcrumb 是否工作
   - Map vs Read 切换是否自然

### 方法 3: 用户测试（Mock UI 完成后）

找 2-3 位用户，给他们看：
1. **旧版本**: 现有的 21 block 长列表
2. **新版本**: L0/L1 Map + Blocks

问他们：
- 哪个版本更容易理解文档结构？
- 哪个版本更容易找到特定信息？
- 新版本有什么地方让你困惑？

---

## 当前任务

### Task 1: 自己测试（今天完成）

- [ ] 打开现有 Preview，记录阅读体验
- [ ] 在纸上画出 L0/L1 结构
- [ ] 判断：这个层级是否比现在更清晰？

### Task 2: 实现 Mock UI（本周内）

**优先级 1（必做）**:
- [ ] L0 Document Map 的 HTML/CSS
- [ ] L1 Topic Map（T-02）的 HTML/CSS
- [ ] Breadcrumb 导航

**优先级 2（可选）**:
- [ ] Topic 关系箭头的 SVG 绘制
- [ ] Map vs Read 模式切换
- [ ] 动画过渡效果

### Task 3: 迭代改进（下周）

根据测试反馈：
- [ ] 调整 Topic 划分（如果 5 个不合理）
- [ ] 调整 L1 结构（如果 Entry Points 不清晰）
- [ ] 调整视觉层次（如果信息密度不对）

---

## 风险与备选方案

### 风险 1: Topic 划分不准确

**症状**: 用户看到 5 个 Topic，仍然说"不知道这篇文档在讲什么"

**备选方案**:
- 重新划分 Topics（可能是 4 个或 6 个）
- 调整 Topic 标题（更直白）
- 调整 Topic 摘要（更具体）

### 风险 2: L1 结构过于复杂

**症状**: 用户看到 Topic Map，反而觉得"比直接看 blocks 更复杂"

**备选方案**:
- 简化 L1 结构（只保留 Entry Points，去掉 overview/rationale）
- 或者让 L1 可配置（某些 Topic 有结构概览，某些直接显示 Entry Points）

### 风险 3: Map vs Read 混淆

**症状**: 用户不知道什么时候用 Map、什么时候用 Read

**备选方案**:
- 增加引导提示："第一次看？试试 Map 模式"
- 或者合并两种模式（L0 Map 始终在左侧，Read 内容在右侧）

---

## 成功标志

如果测试后，你能回答"是"：

- [ ] L0 Document Map 让我**第一眼**就知道"这篇文档讲 5 件事"
- [ ] L1 Topic Map 让我**不用滚动**就理解"这个 Topic 的结构"
- [ ] 我会**主动使用** Map 模式快速定位内容
- [ ] 我认为这个层级结构**明显比现在的长列表好**

那么 Phase 1 验证成功，可以进入 Phase 2（Schema 扩展 + AI 生成）。

否则，需要回到 Task 3（迭代改进）。
