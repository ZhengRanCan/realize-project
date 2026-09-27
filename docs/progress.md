# Current Dashboard

## Status

- Date: 2026-09-27.
- Active feature: `F08` L0 UI（第一轮 deterministic UI integration 已完成；Gate = `TECHNICAL PASS / UX VALIDATION PENDING`）。
- Next queued feature: none —— 没有 `not_started` 的 feature；可推进的实际动作是下面「等验收」与「F08 Track A」两列。
- Latest completed feature: `F09` Contract Adversarial Test（2026-09-26，Gate = PASS）。

## Feature 状态一览

| id | feature | status | 卡在哪 |
| --- | --- | --- | --- |
| F01 | Human Review Repair | `passing` | — |
| F03 | Hierarchical Architecture | `passing` | — |
| F04 | L0 Framework Map | `blocked` | Track A 人工阅读测试未执行 |
| F05 | L0 Generalization Gate | `blocked` | 用户未在验收清单上记录判定（Gate = PASS） |
| F06 | Contract and Validators | `blocked` | 用户未记录验收；规则口径需确认 |
| F07 | AI Framework Map Generation | `blocked` | Gate = PARTIAL PASS（Semantic 0/15）+ 未验收 |
| F08 | L0 UI | `active` | Track A 人工 UX 测试；Phase 3/4/5 未完成 |
| F09 | Contract Adversarial Test | `passing` | — |
| F10 | Semantic Grounding | `blocked` | E3 未关闭（Gate = PARTIAL PASS）；处置未登记 |

## Latest harness gate

```text
$ npm run verify:harness
Harness gate: 9 features, 0 errors.
```

## 收口复跑（2026-09-27，规范化之后）

在本机直接以 `node scripts/...` 调用的结果：

| 命令 | 结果 |
| --- | --- |
| `scripts/validate-fixture.js` | PASSED |
| `scripts/audit-overview.js` | PASSED（21 区块 / 15 节全覆盖 / 12 Decision 全关联） |
| `scripts/check-overview.js` | PASS WITH WARNINGS（Blocks 21/21 · Core 75/75 · Supporting 12/12 · Provenance 151/151 · Failures 无） |
| `scripts/check-plan.js` | PASS WITH WARNINGS（8 条 warning 均为既有结构提示） |
| `scripts/test-check-block.js` | 31/31 |
| `scripts/test-check-map.js` | 29 passed, 0 failed |
| `scripts/test-generate-framework-map.js` | 33/33（离线 stub，零模型调用） |
| `scripts/test-semantic-grounding.js` | 48/48（离线 stub，零模型调用） |
| `scripts/test-l0-view-model.js` | 34/34（28 份 map） |
| `scripts/test-l0-layout.js` | 42/42 |
| `scripts/test-l0-preview.js` | 127/127（7 份预览；材料里记为 51/51 与 119，两个旧值仍保留在证据文件里） |
| `npm run verify:harness` | 9 features, 0 errors |
| `npm run check:docs` | 69 markdown files checked, 0 broken |
| `npm run check:experiments` | 66 units + 17 artifacts, up to date |

`scripts/test-check-plan.js` 在受限沙箱里无法运行（它用 `execFileSync` 捕获子进程管道输出，
每个用例都拿到空结果）；`scripts/check-plan.js` 直接调用时退出码为 0，见
`docs/harness/INITIALIZATION_CONTRACT.md` 的「受限环境」一节。

## Capability snapshot

已经完成并验证的能力（口径为 harness 接入前的阶段划分，逐条 evidence 见对应 feature 合同）：

- Markdown → Semantic Coverage Plan
- Semantic Units → Visual Blocks
- Shape contracts（受控词汇表封闭）
- Semantic coverage / provenance validation
- Deterministic Overview Renderer
- Source 回查
- 完整 Overview Preview
- L0 framework map（生成链路 + Electron 一屏两区界面，第一轮 deterministic UI integration）

当前重点是继续完善 **Visual Overview 的人工阅读体验**，随后把 L0 接回 Electron 主流程
（对应 F08 未关闭的 Phase 3/4/5）。

后续阶段再考虑：

```text
Markdown + Local Source Repository
        ↓
AI Evidence Requests
        ↓
按需读取相关源码
        ↓
Source-verified Evidence
```

**不会一次性把整个源码仓库发送给模型。**

## Shared module changes

### 2026-09-27 — 清理指向 `agent.md` 章节号的失效引用

- Reason: `agent.md` 改为"文档路由 + 协作规则"后不再有编号小节，但仓库里仍有 13 处代码/文档注释与
  2 处页面文案引用 `agent.md 第 X 节`（这些编号在改动前就已经不存在）。
- Impact: 只改注释与两处提示文案（`app/renderer/app.js`、`app/renderer/index.html`）；
  判定逻辑、schema、renderer 行为、Gate 口径均未变。涉及 F08 合同 scope 之外的文件，
  故在此登记：`app/main/{main.js,preload.js}`、`app/renderer/index.html`、`app/shared/{gate.js,schema-validator.js}`、
  `scripts/{validate-fixture.js,simulate-review.js}`、`ai/analysis-protocol.phase2.md`、`README.md`。
- Verification: `node --check` 全部通过；`validate` / `audit` / `check-overview` / `check-plan` 与 7 个离线
  测试脚本全绿；`verify:harness` 0 errors；`check:docs` 0 broken。
- Not run: `npm run selftest`（需要 Electron 图形环境，本机未跑）。
- Kept as-is: `docs/log/artifacts/mvp-phase1/acceptance-phase1.md` 仍写着 `agent.md 第二十一节` ——
  它是冻结的历史记录，按 `docs/log/artifacts/README.md` 的约定不修改。

## Risks and next steps

- **等用户验收**：F04 / F05 / F06 / F07 / F10 都已执行完但没有验收记录。这是当前最大的流程阻塞点 ——
  在它们被判定之前，`dependsOn` 无法把它们登记为强制前置（见 `docs/harness/features/README.md`）。
- **F06 的口径是共享风险**：`check-*` 的规则一旦调整，历史上成批产物会变红；改口径应与新 feature 分开成轮。
- **F07 / F10 的语义维度未成立**：技术层 15/15 通过，但语义忠实度 0/15（F07）与 E3 未关闭（F10）。
  不要把它们的技术 PASS 读成"语义已解决"。
- **F03 规格与实现的偏离**：`brief.md` 中的部分结论已被 F05 / F09 修正（例如"L0 长得像流程图不是风险"），
  读规格时要连带看它引用的 feature 证据。
- **harness 是事后接入的**：F01–F10 的合同由历史材料回填，`dependsOn` 只登记 harness 强制前置，
  流程顺序写在各自合同的 `Process preconditions` 里。
- **仓库根目录还留着 `harness-template/`**（未纳入版本控制）：接入完成后可以删除或移出仓库，避免两个 harness 并存。
