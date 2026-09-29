---
id: F15
title: Projection Integration Invariants
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/renderer/l0-map.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/log/artifacts/F15-integration-invariants/**","docs/specs/reading-view-cognitive-contract.md","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中走一遍：L0 选元素 → 进 Explore 焦点 → Back 回到原 ReadingAddress（不是回首页、不重跑 resolver）","加载 D 的 map 确认 Topic occurrence = Known(0) 时 #block-O-01 仍可打开（canonical landing 不依赖 occurrence）","确认 renderer 没有新增 entity / 新增语义关系 / 升级认识论状态（Indeterminate 未被渲染成 unsupported；Absent 未被补成 unverified）"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F15 Projection Integration Invariants

## Goal

B1 / B2 只证明 **projection 边界**是对的；本 feature 保护**边界之外**仍然可能被"顺手优化"破坏的
五组集成不变量：

```text
① Renderer 纪律        renderer 不新增 entity / 不新增语义关系 / 不升级认识论状态 / 不改 identity
② Decision B 导航      Back ≠ Resolve；canonical landing ≠ occurrence
③ Decision F coverage  Planned / Realized / Missing；Missing → Unavailable（不是 0%）；covers=[] → N/A
④ L1 Topic 边界        membership overlap 合法；Internal / Crossing / External 纯集合运算；
                       relates-to 不被方向化；Inside = ∅ 是合法 Known(0)
⑤ Source coordinate    §N 解析到 section range，不伪造 exact line（N11）
```

## Process preconditions

- F13 的边界与 F14 的 adversarial suite 已就位（本 feature 在它们之上做集成保护）。
- Contract 侧依据：§3.2 投影纪律、Decision B / C / E / F、§5.2–§5.4 的 I / S / N 条目、
  Layer Contracts §2.9（边界分类）与 §4.7（降级粒度）。
- 注：顺序上在 F14 之后，**不登记为 `dependsOn`**（父 feature 非 `passing` 会让 gate 报错）。

## Scope

### Allowed changes

> 计划中新增的文件（集成测试脚本、以及可能的最小投影修正）**尚不存在**，而 `check:docs` 要求文档里
> 出现的仓库路径必须真实存在 —— 因此 `scope` 目前只列已存在的文件，新增路径在实现时补入合同。

- `app/renderer/app.js`、`app/renderer/l0-map.js`、`app/main/main.js`（补 selftest 集成断言）。
- 新增一个集成测试脚本：`test-reading-integration.js`（放在 `scripts/`）。
- 若集成测试暴露投影边界缺陷：对 F13 新增的投影模块做**最小修正**（该模块路径由 F13 决定）。
- `scripts/test-l0-preview.js`。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅** §6 矩阵对应 cell。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- 不改 Contract 语义、schema、validator、fixture、F10 管线。
- 不做 UI 改版、不新增交互、不做 Explore 的实现。
- 若启动时发现本 feature 同时承担 **5 个以上独立职责**，应拆成独立 feature 再开工 ——
  拆分是允许的，**不预设**。

## Acceptance Criteria

- [ ] **① Renderer 纪律**：断言 renderer 不新增 entity、不新增 semantic relation、
      不升级 epistemic state、不改变 identity（例如 projection 给 `Indeterminate`，
      renderer 不得编码成 `unsupported`；给 `Absent`，不得补成 `unverified`）。
- [ ] **② 导航**：`Back` 恢复进入前的 ReadingAddress，**不重跑 canonical resolver**；
      `TopicOccurrenceState = Known(0)` 时 `#block-O-01` 仍存在；多 occurrence 的 element
      仍然只有一个 canonical landing。
- [ ] **③ Coverage**：`Planned {SU-1,SU-2,SU-3}` × `Realized {SU-1,SU-2}` ⇒ `Missing {SU-3}`；
      Generated `Known Missing` ⇒ coverage = `Unavailable`（**不是 0%**）；
      Generated `Unknown` ⇒ `Unknown / Unavailable`；`covers = []` ⇒ `N/A`（既不是 100% 也不是 0%）。
- [ ] **④ L1 边界**：一个 element 属于多个 Topic 合法，不得强制单一 owner；
      Internal / Crossing / External 为纯集合运算；只有 relation contract 明确有方向语义时才拆
      Inbound / Outbound，`relates-to` 不得擅自方向化；`Inside(T) = ∅` 是合法 Known(0)，
      不得解释为"Topic 无效"，也不得从 crossing edge 自动补元素。
- [ ] **⑤ Source coordinate**：`§3` 可解析到 canonical section range（95–125）；
      不得因为 SU statement 文本匹配就输出 `exactLine = 107`（除非未来有正式 carrier）。
- [ ] 契约 §6 矩阵对应 cell 更新。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **职责过宽**：五组集成不变量跨越 renderer / 导航 / coverage / L1 / source 五个区域；
  若实测中任何一组需要独立的设计讨论，应把它拆出去，而不是在一个 feature 里堆完。
- **改 renderer 的风险最高**：它是产品路径，任何改动都必须同时跑 `test-l0-preview`（130）与
  `npm run selftest`，并确认预览与产品共用同一模块的约定没被破坏。
- **L1 目前没有产品路由**：④ 的测试只能在 projection / 数据层做，不能声称"产品已实现 L1"。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
