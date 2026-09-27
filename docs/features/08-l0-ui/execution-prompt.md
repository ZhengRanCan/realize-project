# Feature 08 · 执行任务书（executor 用）

> 设计、范围冻结、验收标准见同目录 `README.md`。**本文件的顺序是强制的。**
> 缩写：VM = view model · SSR = 构建期服务端渲染

---

## 0. 当前进度

```text
✅ Phase 0  Precondition + 现有 app 集成面审计
✅ Phase 1  framework-map → view-model adapter        scripts/l0-view-model.js
✅ Phase 2  standalone HTML preview（D + E + 极端）   scripts/build-l0-preview.js
⬜ Phase 3  Electron L0 screen integration（一屏两区）
⬜ Phase 4  交互：element / edge / topic / provenance
🟡 Phase 5  A–E regression（自动化 + Electron 集成 selftest 已完成）· 人工 Track A 待做
```

**前置条件（已核）**：① 契约与校验器可用（6 类 element / 9 个关系词 / edge 可选 id·label·qualifiers）
② 有通过校验的 `framework-map`（仓库里 28 份，HARD 全 0）③ L0 形态已冻结（Contract v1 · F09 Closed）。

---

## Phase 0 · 环境与集成面审计（已完成）

```text
· app/renderer/app.js 是现有 deterministic renderer（方案总览 + 决策清单 + Source 面板）
· scripts/build-preview.js 的既有约定：静态 HTML + host shim（window.designReview）+ 复用真实 renderer
  → F08 沿用同一约定：**预览与产品共用一份 renderer**，不复制代码
· 相对路径引资源（F07 的教训：relPrefix = path.relative(dirname(out), ROOT)）
```

---

## Phase 1 · view-model adapter（已完成）

```bash
node scripts/l0-view-model.js --map experiments/semantic-grounding/fixture-e/run-08/framework-map.json \
     --check experiments/semantic-grounding/fixture-e/run-08/check-map.txt --out tmp/vm-e.json
node scripts/test-l0-view-model.js        # 34 断言 · 28 份 map
```

**契约（`buildL0ViewModel(map, {checkMapText, knownRoles, budget})`）：**

```text
只做：① 原样搬运 Contract 字段 ② 解析引用 ③ 统计事实（不含解释） ④ 汇总审阅信息
不做：推理 / 补关系 / 改 JSON / 合并元素 / 删元素 / 因 >12 裁剪 / 造主轴 / relationGap→edge
自检：入口与出口对输入做 sha 比较，**输入被修改就抛错**（renderer 不改语义的硬保证）
```

---

## Phase 2 · 静态预览（已完成）

```bash
node scripts/build-l0-preview.js --set    # 生成 6 份预览到 experiments/l0-ui/
node scripts/test-l0-preview.js           # 51 断言（直接对生成的 HTML 断言）
```

标准预览集刻意包含两端与两个极端：

```text
preview-d.html            D · ER-heavy · 无主轴实体网络（13 el / 12 ed / 21 topics）
preview-e.html            E · Runbook · 分叉 + constraint/attachment（12 el / 8 ed / 5 attach）
preview-d-selfloop.html   D 旧臂 · 含 task→task 自环（23 el / 39 ed / 自环 1）
preview-d-overbudget.html E5 失败样本 · **81 elements**（>budget 必须照常渲染）
preview-a.html            A · sourceUnit 粒度 · 人类 candidate
preview-e-human.html      E · 人类 candidate · 含 2 条 relationGap
```

---

## Phase 3 · Electron L0 集成（待做）

**目标**：在 Electron 里出现一个可导航的 L0 界面，**一屏两区**（Framework Map + Topic Navigation）。

```text
1. 主进程：读取 framework-map.json（+ 可选 check-map.txt）→ buildL0ViewModel → 通过 IPC 交给 renderer
   （renderer 不能 require Node 模块 —— view model 必须在主进程算好）
2. renderer：新增一个 screen（不要塞进现有 block 列表）
   · 复用 app/renderer/l0-map.js（双模：window.L0Map.mount）与 l0-map.css
   · 与现有"方案总览 / 决策清单"并列，作为第三个 view
3. 一屏两区**职责分离**：左 = 核心机制；右 = 完整入口索引（含无 element 的 Topic）
4. 深链：保留 `#element-<id>` / `#edge-<id>` / `#topic-<id>`（与现有 `#block-<id>` 并存）
5. Breadcrumb：始终知道自己在哪一层
```

**不要**在 Phase 3 顺手做 Phase 4 的交互（先让"看得见、找得到"成立）。

---

## Phase 4 · 第一版交互（待做 · 只做三种）

```text
1. 点击 Element → 详情：title / type / role / 关系 / attachments / **provenance**
   ⭐ provenance 第一版就要有 —— 产品最大的信任链是"这张图为什么这么说？"
2. 点击 Edge   → A —relation→ B / qualifiers / label / source refs
   （以后人工审阅 D 的 `Task —depends-on→ Task` 这类问题才真的能在产品里看出来）
3. 点击 Topic  → 突出关联 L0 elements 与 L2 blocks / entry points；
   **Topic 没有 L0 element 也正常进入**
```

**Reading View / Review View** 正式化（第一轮已用 CSS 分离）：Review 才显示
`validator warnings` · `relationGap` · `unknown role` · `source reference diagnostics`。
（F10 那类 false-represented / relation regression 将来需要这个审阅空间。）

---

## Phase 5 · A–E regression + 人工审阅

```bash
node scripts/test-l0-view-model.js    # 28 份 map：不丢 / 不裁 / 不改 / 不造 / 不崩
node scripts/test-l0-preview.js       # 6 份预览：渲染完整性 + 标注正确性
npm run selftest                      # Electron 集成缝：加载链路 / 默认 Reading / 焦点 / provenance
```

```text
自动化：5 fixtures（A–E）+ 极端样本 → no crash → **no semantic disappearance caused by renderer**
自动化（集成）：preload → IPC → main → app.js → DOM 全链路可用（**只测缝，不做视觉回归**）
  ⚠️ 必须调**真实入口** `loadL0(path)`：第一版手抄了状态切换，导致副本通过、真实按钮静默抛错。
人工（Track A · 待做 · 记录表 `results/track-a-round1.md`）：
  · D · reviewability：生成物缺基础关系时，用户能否指出"这是图的问题"而非"我不会用"
  · E · readability：异常 → 状态 → 人工介入 → 权限边界，能否不开原文走完
  · 公共 5 数据：耗时 / 答案正确性 / 点错的 Topic / 回退次数 / 是否开了原 Markdown + 一句"最难找的是什么"
```

---

## 硬约束（违反即作废）

```text
❌ 不改 schema/framework-map.schema.json / docs/framework-map-contract.md / scripts/check-map.js
❌ 不调用任何模型；不碰 F10 的 prompt / runner / 两阶段流程
❌ 不在 layout 里表达语义（Layout organizes space; it does not create semantics）
❌ 不因为 >12 隐藏节点；不造主轴；不把 relationGap 变 edge
❌ 不把 Review 数据在 Reading 视图里删掉（只隐藏，不丢）
❌ 不为了让预览好看而改 map 文件（renderer 只读）
```
