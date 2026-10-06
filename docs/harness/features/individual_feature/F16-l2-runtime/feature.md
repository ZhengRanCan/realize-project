---
id: F16
title: L2 Block Runtime (first product adoption)
version: v0.1
status: passing
dependsOn: []
scope: {"code":["app/shared/reading-projection.js","app/renderer/app.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js","scripts/test-reading-runtime.js"],"docs":["docs/harness/ARCHITECTURE.md","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F16-l2-runtime/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-01","commands":[{"command":"node scripts/test-reading-runtime.js","result":"passed","output":"reading runtime tests passed: 8 assertions"},{"command":"npm run selftest","result":"passed","output":"SELFTEST PASSED; L2 projection 已由主进程生成（21 个 block）"},{"command":"npm run test:all","result":"passed","output":"22 + 31 + 29 + 33 + 48 + 35 + 42 + 131 assertions; docs 113/0; experiments index up to date"},{"command":"npm run verify:harness && npm run check:docs","result":"passed","output":"Harness gate: 20 features, 0 errors. Doc links: 113 markdown files checked, 0 broken."}],"manualSmoke":"Electron selftest exercises preload → IPC → main projection → renderer and renders 21 L2 blocks."}
completionGate: {"version":"v0.1","l3":"required","userPath":[],"integrationEvidence":["主进程在 validation 后生成 L2ViewModel；renderer 只消费该投影。","结构测试确认 identity/content/source parity 与 absent/empty review link 区分。","Electron selftest 通过真实 IPC 路径渲染 21 blocks。"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F16 L2 Block Runtime (first product adoption)

> **完成范围说明（2026-10-03）**：passing 仅证明 L2 的语义投影接入与迁移行为一致；当前仍在整篇 Overview 内定位区块，不证明独立 Block 阅读页或主观可理解性已验收。独立展示由 F24 补齐。

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

**F16 是整条路线的架构转折点。** B1 做得再好，只要它还是"测试 helper"，架构就没有真正改变；
F16 才是把 `artifact → renderer` 改成 `artifact → semantic projection → L2 view model → renderer`，
并开始消灭旁路的那一步。

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

- [x] projection 在 `ARCHITECTURE.md` 被登记为正式 **architecture boundary**，
      不再是 test helper（第 2 项工程动作）。
- [x] 真实 L2 renderer 消费 projection 输出，**不再分别读取多份 artifact 自行解释**。
- [x] **behavior parity**：迁移前后正常内容零丢失（逐块对比 + 现有回归全绿）。
- [x] **消除旁路（最重要）**：semantic interpretation **只发生在 projection 层**。

      **F16 是否完成，不看"L2 页面出来了"，而看 renderer / helper 里还有没有人在自己回答这四个问题：**

      ```text
      ① missing 是什么？                      （Unknown / Missing / 空？）
      ② empty 是什么？                        （Known(0) 还是 Unknown？）
      ③ reviewObjects 是什么关系？            （related 还是 supports？）
      ④ sourceUnitIds 表示什么？某个 status 该显示成哪种 epistemic meaning？
      ```

      只要这些解释仍散落在 renderer / helper 里，**F16 就没有真正完成** ——
      它只是把新路径接上了，却把旧解释留在了原地。
- [x] 契约 §6 矩阵 cell 更新（只更新 cell，Priority 不整行搬迁）。
- [x] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **旁路会长期并存**：只要旧路径（artifact → renderer）留着，B1 就只是"建议使用"的模块。
  必须把"移除旁路"当作验收项，而不是后续优化。
- 迁移期间两套路径并存 ⇒ 需要 parity 对比，不能只凭"看起来一样"。
- 本 feature 会动产品运行路径；任何 renderer 改动都必须同时跑预览回归与 `selftest`。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）

## F24 presentation delivery — 2026-10-06

F24 已将原L2数据接入独立单Block视图，复用原表达renderer；Plan身份/范围、Generated可缺失、覆盖与审阅关系不变，旧Overview仍保留。技术回归及独立审查通过，用户随后确认L0/L1/L2第一版基本完成，F24已收口。F16的passing继续仅表示数据运行时采纳，界面验收记录由F24负责；详见[F24验证](../../../../log/artifacts/F24-l2-block-reading-view/verification-summary.md)。
