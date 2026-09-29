---
id: F16
title: L2 Block Runtime (first product adoption)
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/harness/ARCHITECTURE.md","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F16-l2-runtime/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中打开 L2：确认每个 Block 的 identity / 生成完整性 / coverage / occurrence 都来自 projection，而不是 renderer 自己读多份 artifact 后判断"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F16 L2 Block Runtime (first product adoption)

> **契约待补**：本 feature 的详细契约在 **F11–F15 完成后**再补全。此处只固定
> 职责边界、与其它 feature 的分界、以及不可让步的约束。

## Goal

让 **L2 成为第一个真实运行在 semantic projection 上的产品路径**，把 B1 从"测试接缝"升级为
产品架构里的正式 **semantic boundary**：

```text
当前（旁路）：overview.generated / overview-plan / framework-map / design-review
                    ↓
                renderer 自己读、自己解释、自己 fallback

目标：         同一批 artifact
                    ↓
            Block Semantic Projection（F13 建立）
                    ↓
                L2 View Model
                    ↓
                Renderer
```

**为什么从 L2 开始而不是 L0**：L0 已经有 `framework-map` + 现有 view model；
而 L2 是 Contract 已完整、Plan / Generated 数据真实存在、identity（`O-xx`）稳定、
但**产品 runtime 尚未正式消费**的那一层 —— 最能检验 projection 是否真有价值。

## Process preconditions

- F13（B1）与 F14（B2）已完成：projection 已存在且被 adversarial 保护。
- F11 的「已正确、不要动」清单已确立（迁移期间不得顺手重构这些机制）。
- 契约侧依据：`reading-view-cognitive-contract.md` §4 Decision B/C/D/E/F、§5 不变量、
  Layer Contracts §3（L2 七字段）。
- 注：顺序上在 F13/F14 之后，**不登记为 `dependsOn`**（父 feature 非 `passing` 会让 gate 报错）。

## Scope

### Allowed changes

- `app/renderer/app.js`、`app/main/main.js`（让 L2 路径消费 projection）。
- `scripts/test-l0-preview.js`（确认预览与产品共用同一模块的约定未被破坏）。
- `docs/harness/ARCHITECTURE.md` —— 把 projection 登记为正式的 architecture boundary。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅** §6 矩阵对应 cell。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- 不做 L1 / L3 / Explore（分别是 F17 / F18 / F20）。
- 不改 schema、validator、fixture、F10 管线；不重设计 UI。
- **不因为"顺手"重构已实测正确的机制**（assembler 注入 + 固定字段 hard fail、悬空外键校验、
  `leaf ⊆ covers`、source-sections 解析器）。

## Acceptance Criteria

- [ ] projection 在 `ARCHITECTURE.md` 被登记为正式 **architecture boundary**，
      不再是 test helper（第 2 项工程动作）。
- [ ] 真实 L2 renderer 消费 projection 输出，**不再分别读取多份 artifact 自行解释**。
- [ ] **behavior parity**：迁移前后正常内容零丢失（逐块对比 + 现有回归全绿）。
- [ ] **消除旁路（最重要）**：semantic interpretation **只发生在 projection 层** ——
      renderer 不再自行决定"缺失是 Unknown 还是 empty"、"`reviewObjects` 是 related 还是 supports"、
      "evidence 是否 verified"。迁移完成的标志就是这条。
- [ ] 契约 §6 矩阵 cell 更新（只更新 cell，Priority 不整行搬迁）。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **旁路会长期并存**：只要旧路径（artifact → renderer）留着，B1 就只是"建议使用"的模块。
  必须把"移除旁路"当作验收项，而不是后续优化。
- 迁移期间两套路径并存 ⇒ 需要 parity 对比，不能只凭"看起来一样"。
- 本 feature 会动产品运行路径；任何 renderer 改动都必须同时跑预览回归与 `selftest`。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
