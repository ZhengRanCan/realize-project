---
id: F14
title: Adversarial Semantic Tests (B2)
version: v0.1
status: active
dependsOn: []
scope: {"code":[],"tests":["scripts/test-reading-adversarial.js"],"docs":["docs/log/artifacts/F14-adversarial-semantic-tests/**","docs/specs/reading-view-cognitive-contract.md","docs/progress.md"]}
evidence: {"lastVerifiedAt":"","commands":[],"manualSmoke":""}
completionGate: {"version":"v0.1","l3":"not_required","userPath":["reviewer 逐条复核六组 adversarial 断言：确认每组只增强一个诱惑来源、断言是结构级、且测试名与旁注能说明它防的是哪一种非法语义升级"],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F14 Adversarial Semantic Tests (B2)

## Goal

在 F13 建立的 projection 边界上，用**极具诱惑性的输入**证明最危险的六条 silent semantic
corruption 路径已经被挡住：

```text
S1  五态不得折叠（作为长期 suite 保留）
S3  Absent ≠ Unknown / Unverified
S4  Indeterminate ≠ Unsupported
N6  坐标重叠 ⇏ 语义关系
N7  source-verified evidence ⇏ claim verified
N8  approved / reviewed / PASS ⇏ claim verified
```

**B2 的完成标准不是测试数量**，而是：这六条目前最危险的静默腐蚀路径都有了 executable protection。

## Process preconditions

- F13 的 projection 边界已存在（B2 是它的上层，没有边界就没有断言对象）。
- Contract 侧依据：§5.2–§5.4 的 I / S / N 条目、Decision D / E / F、以及 §5.5 的状态空间。
- 注：顺序上在 F13 之后，**不登记为 `dependsOn`**（父 feature 非 `passing` 会让 gate 报错）。

## Scope

### Allowed changes

> `scope.tests` 目前为空：**新增测试脚本尚不存在**，而 `check:docs` 要求文档里出现的仓库路径必须真实存在。
> 具体路径在实现时补入合同（按 harness 规则，改代码前先更新合同）。

- 新增一个 adversarial 测试脚本：`test-reading-adversarial.js`（放在 `scripts/`）。
- 本 feature 的 artifact 目录下的 `drafts/` —— **仅当**某个 fixture 需要落盘
  （默认内联构造，更稳且不引入外部依赖）。
- `docs/specs/reading-view-cognitive-contract.md` —— **仅** §6 矩阵 N6 / N7 / N8 / S3 / S4 的 cell。
- 本 feature 的 artifact 目录、`docs/progress.md`。

### Out of scope

- 不改 projection 实现（F13）以外任何代码；不改 Contract **语义**（只更新 §6 的 cell）。
- 不做 renderer / navigation / coverage / L1 / source-coordinate 那几组（属 F15）。
- 不为了"提高覆盖率"堆测试数量。

## Acceptance Criteria

- [ ] 六条 invariant **各有独立 fixture**，并遵循通用方法：
      **每个 fixture 只增强它正在测试的那一个诱惑来源，其余输入保持最低强度基线。**
- [ ] **N7 与 N8 不共用 fixture**（防"万能状态汇总"的 N8 必须与防"Evidence 升级"的 N7 分开，
      否则 N8 会因错误的原因通过）。
- [ ] 断言是**结构级**（字段 / 边的有无），**不是**字符串断言；不重复 F08 的教训
      （静态预览未加载 renderer，而断言只查文字）。
- [ ] 测试名表达**为什么不连 / 不升级**，并在测试旁注明对应 invariant。
      例如 N6 使用 `does_not_create_semantic_evidence_link_from_coordinate_overlap_alone`。
- [ ] N6 fixture 把诱惑做到最大：same file + same section + **exact containment**
      （SU `§3` = 95–125 / Decision evidence = 100–110）仍断言无 semantic link；
      只有真实外键（`block.reviewObjects`）才允许 `Block related-to ReviewObject`。
- [ ] S3 fixture 断言**不得存在 claim verification value carrier** ——
      注意不能全局禁止字符串 `verification`（`claimVerificationCapability` 本身合法），
      要断言的是那类"值载体"不存在。
- [ ] S4 fixture：`flowNode.state = "target"` 且 provenance policy 未分类 ⇒
      `ProvenanceAssurance = Indeterminate`，且不出现 `Unsupported` / `No evidence` /
      `Missing evidence` / `Verified`。
- [ ] S1 三态（absent / `[]` / values）作为**长期 adversarial suite** 保留，
      并补充 `Known Missing` ≠ `Present(UNKNOWN)` ≠ 外层 `Unknown` 的区分。
- [ ] 契约 §6 矩阵 N6 / N7 / N8 / S3 / S4 的 `Projection test` cell 更新为 ✅，
      `Protection coverage` 随判据重算，**Priority 不做整行搬迁**。
- [ ] 独立审查记录已写入 artifact 目录。

## Risks and compatibility

- **"因为错误的原因通过"**：共用强 fixture 时，只写了 `if (sourceVerified) => verified` 的实现
  也会让 N8 通过 —— 必须靠 fixture 隔离 + 最低基线避免。
- **断言写成字符串**：`expect(html).not.toContain('Verified')` 只能证明页面没打出这个字，
  不能证明语义没被升级。
- **与真实产物的距离**：adversarial fixture 是合成的；它们证明的是**边界性质**，
  不是"产品已经这样表现"—— 不要把它读成产品级证据。

## Completion evidence

- Verification evidence: 本目录的 `verification-summary.md`
- Independent review: 本目录的 `subagent-review.md`（代码变更必需）
