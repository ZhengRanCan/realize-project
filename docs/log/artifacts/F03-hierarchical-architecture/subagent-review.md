# F03 Independent Review

- Status: `not_required`
- Reason: F03 是**纯文档规格** feature —— 它的交付物就是
  `docs/log/artifacts/F03-hierarchical-architecture/brief.md`（904 行架构规格），
  `scope.code` 与 `scope.tests` 均为空：本 feature **没有代码变更**，不改 renderer、不改 schema、不改任何脚本
  （`brief.md` §15 明确 Phase 1 不做 UI、不改 renderer；§12 Phase 3 之前不动 schema 与 AI）。
  独立 subagent 代码审查的对象在这里不存在，因此不生成审查结论，也不伪造审查意见。
- Decision: 本 feature 的 `passing` 状态**不**依赖独立代码审查，而是依赖
  (1) 用户（reviewer）于 2026-09-26 的规格验收，以及 (2) harness 层命令证据（`npm run verify:harness`，2026-09-27）。
  这条偏差在此显式登记，避免后续把它误当成"已完成独立审查"。
- 一并说明：本 feature 处于 harness 接入之前，当时的审查路径就是人工 reviewer；与 F01 一样，
  没有留下独立的 subagent 审查记录。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 现行架构规格全文（§1 目标 / §2 层级职责 / §3 L0 一屏两区 / §4 契约草案 / §5 元素 ontology / §6 关系词表 / §7 三种 coverage / §8 导航与交互 / §9 单文档原则 / §10 Topic 质量判据 / §11 泛化验证 Gate / §12 阶段计划 / §13 资产盘点 / §14 风险 / §15 明确不做的事 / §16 待定项 / §17 归档说明） | `docs/log/artifacts/F03-hierarchical-architecture/brief.md` |
| 用户验收记录（03 hierarchical-architecture = Completed（架构规格），Reviewer 用户，2026-09-26） | `docs/log/artifacts/legacy-feature-registry.md` |
| 被取代的旧草案与其并入关系 | `brief.md` §17 + `docs/log/artifacts/F03-hierarchical-architecture/_archive/**` |
| 本 feature 的验证口径与已知偏差 | `docs/log/artifacts/F03-hierarchical-architecture/verification-summary.md` |

## Reviewer 视角下最需要留意的三点（均不改变 F03 的验收结论）

1. **§5 / §6 的 ontology 与关系词表仍标注为"候选、未证明通用"**：它们全部来自 Fixture A 一篇文档，
   关闭该风险的门是 §11 的三类文档 Gate，执行实体是 F05，**不是** F03。不要因为 F03 是 `passing`
   就默认这套词表已经通过泛化验证。
2. **§5.3 判据 E 的容量规则（≤ 10~12）实测偏紧**：三篇 Fixture 全部顶到 12/12，B/C 的图上只放得进 2 条 constraint
   （§11.1.1 Capacity gap）。规则是否放宽仍未裁定，后续实现 feature 需要先确认口径。
3. **§13 声明 Stage 1 的 Gold 对标基线作废**（21 个 block 切法作废、`check-plan` 相关规则与
   `ai/stage1-plan.prompt.md` 需重写、此前三次对比结论不再可用）。这会影响 F06 / F07 对既有产物的复用判断。
