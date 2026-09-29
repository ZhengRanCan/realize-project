---
id: F20
title: Explore v1 (reusing the Reading identity substrate)
version: v0.1
status: not_started
dependsOn: []
scope: {"code":["app/renderer/app.js","app/renderer/l0-map.js","app/main/main.js"],"tests":["scripts/test-l0-preview.js"],"docs":["docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F20-explore-v1/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 Electron 中从任意 Reading 深度进入 Explore（Focus = 某个 Element 或 Topic），确认它复用 F19 的 ReadingAddress / NavigationStack / CanonicalReadingResolver，没有自己的 route / resolver / back stack","确认 attachment-only 的 constraint 只能作为 annotation，不能成为 Focus"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F20 Explore v1 (reusing the Reading identity substrate)

> **契约待补**：详细契约在 **F11–F19 完成后**再补全。此处只固定职责边界与不可让步的约束。

## Goal

实现 entity-centric 的**关系探索视图**（Focus graph），并且**复用同一 identity substrate**。

**为什么必须排在 Reading runtime 之后**：Explore 的价值完全依赖稳定的 identity 与关系模型。
如果 Reading 的 canonical identity / resolver / landing / navigation 还没产品化就先做 Explore，
会立刻退化成"第二套导航系统"：两边各自找 element、各自解析 identity、URL 不一致 ——
这会直接破坏前面花很大精力建立的 identity discipline。

## Process preconditions

- F19 已完成（identity / navigation / resolver 已产品化），并且**其 substrate 可被复用**。
- 契约侧依据：Contract §2.1（两个正交投影）、Decision A（Explore Addressability）、
  §3.3 导航纪律、以及在证据里实测的 `174 : 0`（可核查 ≠ 可寻址）。
- 注：顺序上在 F19 之后，**不登记为 `dependsOn`**。

## Scope

### Allowed changes

- `app/renderer/app.js`、`app/renderer/l0-map.js`、`app/main/main.js`。
- `scripts/test-l0-preview.js`（共用模块约定未被破坏）。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅**当 Explore v1 的范围需要澄清时。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- **Decision / Evidence 作为 Focus**：它们与 map entity 之间没有稳定、类型化的 identity path，
  不得用章节标题相等或文本相似度补造（Decision A 明令）。
- **attachment-only 的 constraint 作为 Focus**：模型没有声明 `constrains` 这类关系，它只能作 annotation。
- Block 作为 Focus：待跨 fixture addressability 成立后再开。
- 不为 fragment 制造 synthetic ID；不做 UI 打磨（F21）。

## Acceptance Criteria

- [ ] 只有满足 **Explore Addressability Contract** 的实体可以成为 Focus；
      v1 baseline = map-side 的 `Element` / `Topic`。
- [ ] 未通过的实体若被尝试作为 Focus，必须**明确不可用**，而不是退化成文本匹配。
- [ ] 可从**任意 Reading 深度**进入 Explore（不是 L4，是横向切入）。
- [ ] `Back to Reading` 恢复 ReadingAddress（上下文）；`Open in Reading(id)` 走 resolver（跨投影导航）——
      两者语义不同，不得合并。
- [ ] **不得绕过 F19 的 resolver / identity substrate**（比"依赖 F19"更强的要求）：
      Explore **不得**自己长出 `exploreEntityId` / `exploreRoute` / `exploreResolver` /
      `exploreBackStack` 之类的第二套基础设施。这是本 feature 最大的结构风险 ——
      不是图画得不好，而是系统悄悄拥有**两套** identity / navigation。
- [ ] attachment-only 的 constraint 在 Explore 中**可作 annotation，不可作 Focus**。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **本 feature 最大的风险是"顺手做成第二套系统"**。验收里"不新增第二套 identity / resolver"
  与"Back ≠ Open in Reading"就是为它设的。
- 若发现某类实体确实需要进 Explore，正确动作是**先扩 Explore Addressability Contract 的适用条件**
  （即先证明它满足 stable identity + typed relations + resolvable neighbors + relation provenance），
  而不是在实现里特例放行。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
