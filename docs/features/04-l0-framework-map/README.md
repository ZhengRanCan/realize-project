# Feature 04: L0 Framework Map（Phase 1 / Track A）

> 规格依据：`docs/features/03-hierarchical-architecture/README.md`（架构文档）
> 本目录：`execution-prompt.md`（任务书）· `validation-checklist.md`（验收清单）

---

## 1. 这个 feature 要回答什么

**交互假设：**

> **分层下钻 + L0 机制图 + Topic 导航，是否真的比"四段阅读流 + 21 个 block 长列表"更容易理解？**

⚠️ **本 feature 只验证交互，不验证方法泛化。** 泛化（六类元素、主轴/侧挂、Relation vocabulary 是否通用）由 **Feature 05（Track B）** 负责，两者的结论不得互相背书。

## 2. 范围

**输入**

```text
测试文档/18-context-consumption-semantic-model.md      Fixture A（381 行）
fixtures/context-consumption.overview-plan.json        87 条 sourceUnits
experiments/stage2-full/overview-preview.html           现有 baseline（四段阅读流）
```

**产出**

```text
docs/features/04-l0-framework-map/
├── drafts/
│   ├── context-consumption.map.json   目标态 framework-map（手工，mapVersion 2）
│   ├── l0-preview.html                一次性静态验证页（非产品代码）
│   └── build-l0-preview.js            构建上面那个静态页的一次性脚本
└── results/
    ├── phase1-notes.md                 元素选择 + 淘汰候选 + 规格缺口 + 修复轮
    ├── verification-output.txt         Framework Map + Navigation invariant 自查
    ├── structural-reachability.txt     结构可达性脚本输出
    ├── structural-reachability.md      结构可达性说明与结论（**不是** Track A 胜负）
    └── track-a-worksheet.md            **人工** Track A 六项指标（待执行）
```

## 3. 任务分解

| Task | 内容 | 对应规格 |
|---|---|---|
| 1.1 | 元素选择（判据 A~F），总数 ≤ 12，每个元素带真实 `sourceUnitIds` | §5.1 / §5.3 |
| 1.2 | 主轴 + 侧挂：填 `edges`（只用 8 词）/ `attachments` / `topics` / `thesis`（可选） | §3.3 / §4 / §6 |
| 1.3 | 边界与反例进图（3~5 条 constraint，反例只作侧挂） | §5.5 |
| 1.4 | 三种 coverage 自查：Framework Map invariant + Navigation invariant | §7 |
| 1.5 | Structural Reachability Test（自动化）+ 人工 Track A worksheet | §7.2 / §11.3 |

## 4. 明确不做

- ❌ 不改 `app/renderer/*`、`app/main/*`、`schema/*`
- ❌ 不改现有 11 个 shape、不写 `shape-catalog`
- ❌ 不写产品化的 Stage 1a / 1b prompt
- ❌ 不复用旧的 21 个 block 作为 L2 内容
- ❌ 不做 Fixture B / C（那是 Feature 05）
- ❌ 不因为这篇文档画得出一条主链，就把"主轴"当成 L0 的必要形态（§3.3 / §11.5）

## 5. 完成标准

- `validation-checklist.md` 全部通过，红线一条未命中
- **Framework Map invariant（F1~F3）与 Navigation invariant（N1~N3）全部通过**，其中 N3 要求 `完全无路径 = 0`
- Structural Reachability Test 跑过，结论如实记录
- **人工 Track A 提供 worksheet**；未完成人工部分之前，本 feature 的判定是
  **TECHNICAL PASS / UX VALIDATION PENDING** —— **不得宣布交互假设已验证**
- 被淘汰的元素候选及淘汰判据都有记录（供 Feature 05 复核）

## 6. 与其它 feature 的关系

```text
03 架构文档（规格）
   │
   ├─ 04 本 feature：Track A · 交互假设          ← 不依赖 Fixture B / C
   │       └─ 产出 drafts/context-consumption.map.json
   │
   └─ 05 Track B · 生成模型假设                   ← Gate
          复用 04 的 Fixture A 图，但结论独立于 Track A
          │
          └─ 06 契约落地 / 07 生成链路 / 08 UI      ← 等 05 的 Gate 通过
```

## 7. 状态

- **创建时间**：2026-09-26
- **执行**：完成 Task 1.1 ~ 1.4 + 自动化部分
- **判定**：**TECHNICAL PASS / UX VALIDATION PENDING**（人工 Track A 未做）
- **规格修订**：执行中发现的 5 处缺口（G1~G5）已回写 `03/README.md`（§3.3 / §5.1 / §5.2 / §5.3 / §5.4 / §7 / §10.1 / §11.3）
