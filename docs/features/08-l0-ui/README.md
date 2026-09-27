# Feature 08: L0 UI（Framework Map 导航界面）

> **状态**：🟡 **In Progress · 第一轮 = deterministic UI integration**
> Phase 0（前置条件 + 集成面审计）· Phase 1（view model）· Phase 2（D+E 静态预览）**已完成**
> Phase 3（Electron 集成）· Phase 4（交互）· Phase 5（A–E regression + 人工 UX）待做
> **Gate（第一轮）**：`TECHNICAL PASS / UX VALIDATION PENDING`

---

## 0. 第一轮的范围冻结（用户裁决）

```text
✅ 只做 deterministic UI integration
❌ 不调用模型
❌ 不改 Contract（framework-map schema / 契约文档 / check-map 一行不动）
❌ 不碰 F10 生成逻辑（prompt / runner / 两阶段流程）
```

目的：把**"表示是否正确"**（F06/F07/F09/F10 已经管到）与**"产品里是否看得懂"**彻底分开。

### 第一目标（不是"把 JSON 画出来"）

> 用户第一次能在 Electron 里把 Framework Map 当成 **L0 导航界面**使用：
> **看结构、看关系、选节点、看来源、进入 Topic / deeper content。**

第一版输入直接用**已通过验证的 `framework-map.json`**（A–E 的 candidate 图 + F10/F07 的 AI 产物），不接 AI generation。

```text
validated framework-map.json
        ↓
L0 View Model（纯投影）
        ↓
Deterministic Layout / Renderer
        ↓
Electron
```

---

## 1. UI 输入边界（Phase 0 冻结）

Renderer **只消费 Contract 数据**：

```text
❌ 不推理、不补关系、不修 JSON、不合并同义元素、不删任何 element
❌ >12 仍然正常渲染 —— 不能因为 W1 自动删节点
❌ 没有主轴就没有主轴 —— 不造主轴
❌ Topic 无 element 也必须能作为导航入口存在
❌ relationGap / warnings 可以显示为审阅信息，但不能偷偷转换成 edge
❌ HTML/SVG 由 renderer 生成，不是 AI 生成
```

⭐ **新增一条 renderer 设计原则（F08 最容易踩的坑）：**

> ### **Layout organizes space; it does not create semantics.**
> 上下排列 ≠ ownership；左右排列 ≠ processing order；靠得近 ≠ dependency。
> **只有 `edge` / `attachment` / `qualifier` 才是正式语义。**

Contract 没编的关系，layout 不许"画"出来。

---

## 2. 第一版的形态（第一轮实现选择）

因为上面那条原则，**第一版刻意不做图布局**（力导向 / 分层图 / 流水线都会被迫暗示语义）。
第一版是 **结构板 + 关系表 + 导航索引**：

```text
┌───────────────────────────────────────────┬──────────────────────┐
│ Framework Map                             │ Topic Navigation     │
│  ① 核心结构（按 element.type 分区）        │ 完整入口索引         │
│  ② 关系（edge）：每条一行 A —type→ B      │ · 每个 Topic 的      │
│     + qualifiers + label；自环显式标注     │   elements / §refs   │
│  ③ 侧挂 / 约束（attachments）：A ⇢ 挂到 B │ · 无 element 的 Topic│
│  ④ Review View（默认隐藏）：check-map 结论 │   照样可进入         │
│     / relationGap（明确标注"不是 edge"）/  │ · 文档级入口         │
│     诊断                                   │                      │
└───────────────────────────────────────────┴──────────────────────┘
```

- **分区依据是 `element.type`（契约字段）并在界面上显式声明** —— 不是关系。
- **方向只由文字表达**（`—type→`），所以：无主轴、分叉、39 条边、自环、81 个元素全都不会被"画歪"。
- **Reading View / Review View 分离**：Review 数据照常渲染在 DOM 里，Reading 视图靠 CSS 隐藏 ——
  不是删数据（`app/renderer/l0-map.css` 的 `.l0-root[data-view="reading"] .review-slot`）。

---

## 3. 五个 Phase（执行顺序）

```text
Phase 0  Precondition + 现有 app 集成面审计            ✅ 完成
Phase 1  framework-map → view-model adapter            ✅ 完成（scripts/l0-view-model.js）
Phase 2  standalone HTML preview（Fixture D + E）      ✅ 完成（scripts/build-l0-preview.js）
Phase 3  Electron L0 screen integration（一屏两区）     ✅ 第一版完成（第三个一级页面 · L0 框架图）
Phase 4  交互：element / edge / topic / provenance     ✅ 第一版完成（selection / focus / Focused Relations）
Phase 5  A–E regression（自动化 ✅ 34+60 + Electron 集成 selftest ✅）· 人工 Track A ⬜ 待做
```

> **Phase 3/4 第一版说明**：Electron 里新增第三个一级页面「L0 框架图」（与方案总览 / 决策清单并列），
> 读取 `framework-map.json`（主进程算 view model → `window.L0Map.mount` 渲染，**与预览共用同一份 renderer**）。
> 交互按用户裁决做成 **interaction-based graph reading**：点 element 聚焦其直接相邻的 edge / attachment 并展开
> **Focused Relations**；点 edge 同时聚焦两端并展开 qualifier / provenance；点 topic 高亮关联 elements
> （无 element 也照常进入）；点 provenance 打开右侧 Source 面板对应章节；`清除选择` / `Esc` 回到 Overview。

✅ **Electron L0 集成 selftest**（`npm run selftest`，E fixture · 走 `loadPath` 绕开原生选择器）：
断言链路 `preload API → IPC → main.loadFrameworkMap → app.js mount → DOM`，并覆盖
**加载后真的切屏**（首屏隐藏 → Review 屏显示）、DOM 计数与 view model 一致
（12 elements / 8 edges / 9 topics / 12 focus panels）、默认 Reading View
（Review 区隐藏但数据仍在 DOM）、点 element → 焦点态 + Focused Relations、点 provenance → `openSource()`
打开 Source 面板、以及 **L0 可独立打开**（无 `design-review.json` 时切向总览/决策被挡住）。共 8 条断言。

> **只测集成缝（integration seam）**，不做视觉回归。而且它必须调**真实入口** `loadL0(path)` ——
> 这条规矩是踩出来的：selftest 第一版手抄了一遍"注入 view model + 切视图"的状态切换，
> 于是手抄版是对的、真实按钮入口却调了一个不存在的 `enterReview()` 并静默抛错
> （**自动化全绿，手工点「打开 framework-map.json」毫无反应**，信息行还照常显示"已加载"）。
> 教训：**测试一旦复制产品逻辑，就只验证了副本**。现在 `loadL0(path)` 是唯一入口，按钮与测试调同一个函数。

⚠️ 顺带改动一条**既有 selftest 断言**：`一级导航只有两个页面` → 同步为三个页面（加 L0 是有意的产品变更，
不是回归）。`npm run selftest` 仍 PASSED。

### 第一版必须表达的（Phase 2 已覆盖）

```text
element   type · title · optional role           ✅
edge      direction · relation · optional label · qualifiers   ✅
attachment / constraint                          ✅
Topic Navigation（完整索引，含无 element 的）    ✅
selected element / source state（#element-<id> 深链 + §ref）  ✅（锚点已就绪）
```

### 第一版**不要求**解决的（明确不做）

```text
❌ 自动折叠复杂 constraint statements   ❌ 动画   ❌ 自由拖拽编辑
❌ 用户修改 map                          ❌ AI regenerate
❌ 复杂 mini-map                         ❌ 自定义布局保存
```

---

## 4. Phase 3 目标（一屏两区，承接 F04/F09 的 coverage 结论）

```text
Framework Map   = 核心机制
Topic Navigation = 完整入口
```

**不要在 UI 层把这三者重新绑起来**（F04/F09 已证明它们不同）：

```text
Framework Coverage  ≠  Navigation Coverage  ≠  Semantic Coverage
```

Phase 3 的实现路径已经铺好：`app/renderer/l0-map.js` 是**双模模块**（Node 构建期 SSR + 浏览器 `window.L0Map.mount`），
Electron 只要算好 view model 并调用同一个 `renderL0MapHTML` / `mount` —— **预览与产品共用一份 renderer**。

---

## 5. 交付物

```text
scripts/l0-view-model.js          Phase 1 · 纯投影适配器（零推理）
scripts/build-l0-preview.js       Phase 2 · 静态预览构建器（构建期 SSR）
scripts/test-l0-view-model.js     回归：不丢 / 不裁 / 不改 / 不造 / 不崩（34 断言 · 28 份 map）
scripts/test-l0-preview.js        验收：对生成的 HTML 断言（60 断言 · 6 份预览）
app/main/main.js 的 selftest 块    集成：Electron 里 L0 页面真能加载 / 默认 Reading / 焦点与 provenance 可达
docs/features/08-l0-ui/results/track-a-round1.md   人工 Track A 记录表（D + E · 待填）
app/renderer/l0-map.js            deterministic renderer（双模）
app/renderer/l0-map.css           样式（只有分区/卡片/列表，无暗示性视觉语法）
experiments/l0-ui/preview-*.html  6 份预览（D / E / 自环 / 81元素 / A / E-human）
```

---

## 6. 第一轮验收（只看这些，不拿"画得漂亮"当 Gate）

```text
✅ D 无主轴仍能正常阅读
✅ E 分叉结构没有被强行压成链
✅ >12 elements 可以渲染（含 81 elements 的极端样本）
✅ constraint / attachment 可见
✅ edge direction 明确
✅ qualifier 可查看
✅ Topic 无 element 时仍可导航
✅ Element / Edge 都能追到 provenance（§ref）
✅ renderer 不修改输入语义（输入文件 sha 前后一致）

→ A/B/C regression：5 fixtures → no crash → no semantic disappearance caused by renderer
→ Electron 集成：链路可用 + 默认 Reading + 焦点/provenance 可达（`npm run selftest`）✅
→ 人工 UX 检查（Track A · 记录表：`results/track-a-round1.md`）：
   用户能否快速找到某机制？会不会点错 Topic？是否频繁回退？
   D · 测 reviewability（生成物缺 `Task --depends-on--> Task` 时，用户能否指出"是图的问题"）
   E · 测 readability（bounded failure → REFUND_FAILED → force compensation → admin 边界，理想不用开原文）
```

---

## 7. Gate

```text
TECHNICAL PASS / UX VALIDATION PENDING   （第一轮默认）
PASS                                      （仅当真的做了人手 Track A 测试）
```

> **不要因为截图"看起来不错"就叫 UX PASS。**

---

## 8. 明确不做（沿用 F08 原始约束）

- ❌ 不新增 shape 语义、不改现有 11 个 shape
- ❌ 不推翻现有 renderer 的其它视图（Decisions / Source 回查）
- ❌ 不让 AI 直接产出最终页面
- ❌ 不把布局写死：Framework Map 的拓扑随文档类型变化，UI 不能假设"一定有主轴"
