# F11 执行任务书（含项目入场说明）

> 这份文件既是 F11 的任务书，也是接手本项目时的入场说明。
> 交付对象：第一次接触本仓库的执行者。

---

## 0. 你面对的是什么

这是一个 **Electron 本地设计审阅工具**：把长篇 Markdown 设计文档重构成可逐层阅读、逐层核查的视觉模型。
仓库根目录就是项目根，`npm start` 可跑起来。架构原则是：

```text
AI 负责整理 · Schema 负责约束 · Validator 负责检查 · Renderer 负责呈现 · Human 负责批准
```

**但你现在要做的不是继续写功能，而是让现有实现服从已冻结的规范。**

项目经历了三个阶段：

```text
① 代码 / fixture / feature 实现      → 架构知识隐含在实现里
② 抽象（刚完成，已推送）             → Contract / Evidence / Authority
③ 你要做的：Conformance Migration    → 检查现有实现 → 保留正确的 → 修违反的 → 补必要边界
```

这个**箭头反转**是当前最重要的变化：

```text
过去：code → infer architecture
现在：contract → constrain code
```

**不是重写软件，也不是"再跑一遍旧测试"。**

---

## 1. 第一件事：只读三份文档

严格按 harness 工作流，**不要一次性读完仓库**：

1. `docs/harness/features/feature-index.json` —— 任务选择器
2. `docs/progress.md` —— dashboard：当前状态、路线、门禁基线
3. `docs/harness/features/README.md` —— 状态语义、`dependsOn` 口径、创建/关闭 feature 的规则

然后按 Selection 规则选任务：**没有 `active` feature 时，选依赖已满足且编号最小的 `not_started`**。
现在就是 **F11**。选定后**只读**该 feature 的 `feature.md` 与 `verification.md`。
不要把历史 feature 或长验证输出带进上下文。

---

## 2. 当前状态（2026-09-29）

```text
F01 / F03 / F09        passing
F04–F08 / F10          blocked（等用户验收 / 等 UI 迭代）
F11–F15                not_started  ← Phase A：让实现服从规范
F16–F21                not_started  ← Phase B/C/D：产品迁移（契约故意简略，等前置完成后细化）
无 active feature
```

路线：

```text
Phase A  Contract Execution     F11 审计 → F12 S1 修复 → F13 最小投影边界(B1)
                                → F14 反诱惑测试(B2) → F15 集成不变量
Phase B  Reading Runtime        F16 L2 → F17 L1 → F18 L3
Phase C  Cross-Projection Nav   F19 导航 / resolver → F20 Explore v1
Phase D  Product Maturity       F21 UX / 性能 / 可访问性
```

---

## 3. 先读规范，再改代码

Reading 的规范（冲突时优先级从高到低）：

```text
docs/specs/reading-view-cognitive-contract.md           umbrella（宣布 authority）
docs/specs/reading-view-layer-contracts.md              L0–L3 七字段（主契约纳入的 subordinate）
docs/specs/reading-view-cognitive-contract-evidence.md  为什么有这些规则（NON-NORMATIVE）
```

Framework Map 的规范：`docs/specs/framework-map-contract.md`
（历史推导见 `docs/log/artifacts/F09-contract-adversarial-test/framework-map-contract-history.md`）。

**规范与历史是分开的**：`docs/specs/**` 只写"今天必须遵守什么"；实测数字、bug 发现过程、
当时的裁决写在 `docs/log/artifacts/**` 的 `*-history.md` / evidence 里。**不要往 specs 里写历史。**

---

## 4. 六条硬规则（违反会直接破坏前面所有工作）

1. **一次只能有一个 `active` feature**，且它的依赖必须已 `passing`。
2. **`dependsOn` 只登记 harness 强制前置**（父 feature 必须 `passing`）。F04–F10 全是 `blocked`，
   所以 F11–F21 的 `dependsOn` **一律为空**；实际顺序写在各自正文的 `Process preconditions`。
   不要"顺手"补 `dependsOn` —— gate 会必然报错。
3. **改代码前先更新合同**：新增文件的真实路径要补进合同的 `scope.code` / `scope.tests`。
4. **不要引用尚不存在的文件路径**。`check:docs` 会扫描文档里所有形如
   `docs|scripts|app|schema|fixtures|experiments|ai/…` 的路径并要求它们真实存在。
   计划中的文件写成"文件名 + 括注位置"，不要写全路径 ——
   这正是 F11 / F13 / F14 / F15 的 `scope` 目前为空的原因。
5. **改之前先有会失败的测试**（F12 是第一个现实案例）。
6. **不因为规范写好了就重写软件**。已实测正确的机制保留，只有真实 divergence 才改：

```text
assembler 注入固定字段 + FIXED hard fail · 悬空外键校验
leaf ⊆ covers · source-sections.json 解析器 · framework-map ontology
```

---

## 5. F11 要做什么：只读审计

**F11 不改任何代码。** 交付一张诚实的差异图：

```text
Compliant | Violation | Partially Compliant | Not Implemented
Capability Absent | No Executable Boundary | Needs Inspection
```

必须做到：

- 覆盖契约 §6 矩阵的**全部条目**，以及起点六问：
  S1 三态折叠 · S7 `?? 'normal'` 的缺省语义 · S5 生成缺失时的 coverage ·
  Decision C 数组顺序 · I2 是否存在文本/相似度关联 · N9 provenance 是否被当成 evidence。
- **每条结论附可核证据**（`文件:行` 或命令输出），不使用 PASS / FAIL 二值。
- 输出**两个**列表：① 违规与缺口；② **「已正确、不要动」的机制清单**
  （后者是为了防止 F13 动投影层时把既有机制弄坏）。
- epistemic-collapse 扫描：对 `|| []` / `?? []` / `|| 0` / `?? 0` / `?? 'normal'` /
  `(x || []).length` / `if (!x)` 等站点**逐个判定**"该字段是否真的具有
  Unknown / Empty 区别"，只有判 yes 的进 backlog，其余明确写"合法 fallback，不改"。
  **不要制造假 backlog。**
- **不为 `Not Implemented` 项补功能**；`Capability Absent`（如 Claim Verification）是
  契约**规定**的状态，不是待办。
- 按可审性分三层记录：① 可对产品直接审 · ② 可对 stage2 产物与脚本审 · ③ 无边界。

**已知的第一个现实违反**（由 F12 处理，F11 只需确认并登记）：

```text
scripts/l0-view-model.js:109
  blockIds: [...(t.blockIds || [])]
      ↑ 把 absent(Unknown) 折叠成 [](Known(0))，违反不变量 S1
```

---

## 6. 门禁（每轮改完必跑）

```bash
npm run verify:harness      # feature 合同与状态一致性
npm run check:docs          # 文档引用（新路径必须真实存在）
npm run check:experiments   # 动了 experiments/ 才需要
npm run test:all            # 离线测试（零模型调用）
npm run selftest            # Electron 内跑通整条链路（改 renderer / app 时必跑）
```

`git push` 用**默认配置**即可（走本地代理）。**不要**用 `-c http.proxy=` 绕过代理 —— 直连会被 reset。

---

## 7. 工作与提交纪律

- 每轮：改完 → 门禁全绿 → **一个独立 commit** → push。不要把多轮积成一个 commit。
- commit message 用中文，说明"改了什么 + 为什么"；多行时写进临时文件，用 `git commit -F`。
- **行数用 node 数**：这个环境里 PowerShell 的 `Get-Content` 会把行数算错
  （54 行的文件报成 23 行）。用 `node -e "…split('\n').length"`。
- **断言必须是结构级的**（断言字段 / 边的有无），不是字符串级。
  本仓库有过教训：静态预览没加载 renderer，而断言只查了文字，于是坏产物一路通过。
- **反诱惑测试的方法**：每个 fixture **只增强一个诱惑来源**，其余输入保持最低强度基线；
  否则测试会因为错误的原因通过。
- 若实现与文档冲突：**记录冲突，不要自行改代码去迁就文档**，也不要把文档改成迁就代码。

---

## 8. 说"完成"之前，先自查这三句

1. 我改的是**违反**，还是"我觉得更好"？
2. 那些已实测正确的机制，我有没有在迁移中顺手重构？
3. 我有没有把某个降级状态（`Unknown` / `Missing` / `Indeterminate` / `Absent`）
   合并成一个更"干净"的状态？

---

## 9. 汇报格式

每轮结束给出：① 做了什么（文件级）；② 门禁**原始输出**；③ 发现的 divergence（附证据）；
④ 下一步。**不要**用"看起来不错"代替命令输出。
