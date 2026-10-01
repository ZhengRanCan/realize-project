---
id: F13
title: Minimal Semantic Projection Boundary (B1)
version: v0.1
status: active
dependsOn: []
scope: {"code":[],"tests":[],"docs":["docs/log/artifacts/F13-projection-boundary/**","docs/specs/reading-view-cognitive-contract.md","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"not_required","userPath":["reviewer 复核 tests 输出与 projection API：确认六条高风险 invariant 已各有一个稳定、纯语义、可结构化断言的被测边界，且没有把本 feature 扩张成 L2/L3 功能实现"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F13 Minimal Semantic Projection Boundary (B1)

## Goal

建立**最小的纯语义投影接缝**，使 Contract 里那些今天没有可断言对象的规则第一次成为可执行约束：

```text
Artifacts（plan / generated / framework-map / design-review）
        ↓
projectReadingSubject(...)      ← 本 feature 建立的边界
        ↓
SemanticProjection
        ↓
（将来）Renderer
```

**B1 的完成标准不是"终于有了完整的 ReadingViewModel"**，而是：
**六条高风险 invariant 已经有了一个稳定、纯语义、可结构化断言的被测边界。**

不是业务功能。它不需要驱动最终 UI、不需要支持全部 shape、不需要实现完整 L3 inspector。

## Process preconditions

- F11 已标出「无边界」项清单（F13 只处理其中**真正需要被测边界**的部分）。
- F12 已落地，使三态表达有既有先例可循（S1 的现实修复）。
- Contract 侧依据：§5.5（四类状态空间）、S3 / S4（§5.3）、I1 / I5 / I6 / I7（§5.2）、
  S2 / S6 / S8（§5.3）、Decision B / C / D / E / F（§4）。
- 注：顺序上在 F12 之后，**不登记为 `dependsOn`**（父 feature 非 `passing` 会让 gate 报错）。

## Scope

### Allowed changes

> `scope.code` / `scope.tests` 目前为空：**新增文件尚不存在**，而本仓库的 `check:docs` 要求
> 文档里出现的仓库路径必须真实存在。因此具体路径在实现时补入（按 harness 规则，改代码前先更新合同），
> 下列文件名是**计划**，不是现有文件。

- 新增一个纯投影模块：`reading-projection.js` —— 纯函数投影边界；不读文件、不调模型、无副作用。
  最终位置在实现时确认：候选 `app/shared/`（符合 `ARCHITECTURE.md` 的 shared semantics 单一来源），
  备选 `scripts/`（与现有纯投影适配器 `l0-view-model.js` 同侧）。**不要两处并存。**
- 新增一个投影边界测试脚本：`test-reading-projection.js`（放在 `scripts/`）。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅** §6 矩阵对应 cell。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope（**停止条件**，不得顺手扩张）

- 不统一 L0–L3 ViewModel；不重写或替换 `scripts/l0-view-model.js`。
- 不重写任何 renderer；不迁移整个 app；不接 Explore。
- 不补完整 L2/L3 产品功能；不新增产品 UI；不改任何 schema / validator / fixture / F10 管线。
- 不为"以后可能会用"预留抽象层。

## Acceptance Criteria

- [ ] 四类状态空间可表达，且**名义上互不相通**（有可断言的区分机制；不要求 TypeScript，
      但必须有 discriminator 或等价手段）：`KnowledgeState` / `CapabilityAvailability` /
      `GeneratedExpressionState` / `ProvenanceAssurance`。
- [ ] 测试证明四者**不能互相冒充**（跨空间赋值 / 通用 helper 互换要么不可能，要么被断言拦住）。
- [ ] **S3 的 API 验收**：`claimVerificationCapability` 只能表达为 `absent`；
      测试明确禁止 `verification: null` / `"unverified"` / `"unknown"` / `isVerified: false`
      —— 这些写法都已经**创造了一个 carrier**。
- [ ] **I1 / I5**：identity 不因 capability 缺失消失 ——
      即使 `Topic occurrences = Known(0)`、`Generated = Missing`、无 evidence，仍得到 `O-01`。
- [ ] **I6 / I7**：Plan authority 不被 Generated 覆盖 —— `title` / `stage` / `shape` /
      `covers` / `reviewObjects` 在两侧不一致时取 Plan。
- [ ] **S2 / I8**：Generated 为 `Present` / `Missing` / `Unknown` 三种情况下 subject 相同。
- [ ] **S6 的基础保护**：不提供 `deriveCapabilityFromAnyStatus(...)` 之类的跨 namespace 补状态入口；
      例如 `Decision.status = approved` 不得被用来填 `ClaimVerificationCapability`。
- [ ] 模块是**纯的**：无文件 I/O、无模型调用、无随机、无时间依赖（可离线复跑）。
- [ ] 契约 §6 矩阵对应 cell 更新（只更新 cell）。

## Risks and compatibility

- **位置选择**：`app/shared/` 符合 `ARCHITECTURE.md` 的"shared semantics 单一来源"，
  但 `scripts/l0-view-model.js` 是现有"纯投影适配器"的先例（位于 `scripts/` 并被 app require）。
  实现时二选一并记录理由；不要两处并存。
- **最大风险是扩张**：一旦开始"顺手统一 ViewModel"，本 feature 就从"建立接缝"变成"建设数据层"，
  review scope 完全不同 —— 因此 Out of scope 里写了停止条件。
- **不要变成第二份 view model**：本边界服务 L2/L3 侧的语义断言，**不替代** L0 的 `l0-view-model.js`。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
