---
id: F03
title: Hierarchical Architecture (L0-L3 document model spec)
version: v0.1
status: passing
dependsOn: []
scope: {"code":[],"tests":[],"docs":["docs/log/artifacts/F03-hierarchical-architecture/brief.md","docs/log/artifacts/F03-hierarchical-architecture/_archive/**"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"npm run verify:harness","result":"passed","note":"harness 层证据，由主 agent 在收口时统一执行（2026-09-27）"}],"manualSmoke":"用户（reviewer）于 2026-09-26 将本规格记为 Completed（依据 docs/log/artifacts/legacy-feature-registry.md 中 03 hierarchical-architecture 一行：Status = Completed（架构规格）、Reviewer = 用户、Completed = 2026-09-26）；本 feature 为纯文档规格，无 UI 路径可走"}
completionGate: {"version":"v0.1","l3":"not_required","userPath":[],"integrationEvidence":[],"knownUnverified":[],"humanReviewRequired":[]}
---

# F03 Hierarchical Architecture (L0-L3 document model spec)

## Goal

本 feature 交付的**不是代码，而是规格**：`docs/log/artifacts/F03-hierarchical-architecture/brief.md`（904 行）
把产品模型从 `Markdown → Overview` 改写为 `Markdown → Semantic Compilation → Interactive Design Model`。
它把"标题目录 + 从头读到尾"改造成**一张能下钻的设计地图**：L0 一屏两区（机制图 + topic 导航）→
点元素钻 L3 元素详情 / 点 topic 展开 L1 → 点 block 进 L2 Visual Blocks → 点 Source 回原文，并在 §2 钉死各层职责。
规格同时给出三件可被后续 feature 直接实现的东西：元素 ontology（§5，六类 `type` + 两类 `role` + 准入判据 A~F）、
关系词表（§6，受控 8 词 + 只走主动语序 + 未知词校验 FAIL）、以及把 coverage 拆成 Framework / Navigation / Semantic
三种互不替代的检查（§7），从而明确"什么属于规格、什么属于具体文档"（§11.5）。
本 feature 不改代码、不跑测试：可观察结果是**这份规格文本本身**，以及它被用户验收为 Completed（2026-09-26）。

## Process preconditions

- Process order: F03 位于 F04–F08 **之前**，是它们的实现依据 —— §12 把 Phase 1→5 拆成 Feature 04（手工框架图 + 交互假设）/
  05（跨文档类型 Gate）/ 06（契约与校验器）/ 07（生成链路）/ 08（UI），并声明"各阶段已拆成独立 feature，本文件只保留规格"。
- F03 自身没有 harness 强制前置（`dependsOn: []`）；它只依赖 2026-09-26 的框架讨论结论，以及被归档到 `_archive/` 的旧草案
  （`brief.md` §17 逐条记录了替代原因与并入的部分）。
- F03 不修改任何既有实现：§15 明确 Phase 1 不做 UI、不改 renderer，§12 Phase 3 之前不动 schema 与 AI。

## Scope

### Allowed changes

- `docs/log/artifacts/F03-hierarchical-architecture/brief.md` —— 现行架构规格，2026-09-26 重写；含目标（§1）、层级职责（§2）、
  L0 一屏两区（§3）、`framework-map` 契约草案（§4）、元素 ontology（§5）、关系词表（§6）、三种 coverage（§7）、
  导航与交互（§8）、单文档原则（§9）、Topic 质量判据（§10）、泛化验证 Gate（§11）、阶段计划（§12）、
  资产盘点（§13）、风险（§14）、明确不做的事（§15）、待定项（§16）、归档说明（§17）。
- `docs/log/artifacts/F03-hierarchical-architecture/_archive/**` —— 被本规格取代的旧草案（topic 卡片版、topic synthesis 计划、
  framework-map 中间草案、旧 L0 map / L1 map、topic 划分说明、validation-plan），仅作记录，不再是规格（§17）。

### Out of scope

- 不做 UI、不改 renderer；不重写现有 11 个 shape（§15）。
- 不做 document set 数据结构，一次运行只解析一篇文档（§9 / §15）。
- 不新增 §5.2 列出的 12 种类型（`decision` / `evidence` / `actor` / `interface` / `event` / `database` / `field` /
  `rule` / `policy` / `resource` / `command` / `query`）；不把 topic 数写死为 5（§15）。
- 不允许任意连线：边只走受控词表，侧挂一律用 `attachments[]`（§3.2 / §6.4 / §15）。
- 不把 `flow-with-rationale` 之类的局部结构设成通用 Topic Schema；不让 AI 直接从 Markdown 输出 UI，
  也不让 AI 生成 HTML 替代结构化数据 + 确定性 renderer（§15）。
- 不推翻现有 Stage 1 / Stage 2 的整体管道；暂不接入源码（Phase 3 Source Evidence）（§15）。
- Phase 6 的内容不在本特征内：现状图（`role: "current"`）、多进程框架图人工对比、自动 diff、
  L3 Element Detail 的完整形态、接源码形成 `source-verified`（§12 Phase 6 / §16）。

## Acceptance Criteria

- [x] §1 给出目标与最终产品模型：`Markdown → Semantic Compilation → Interactive Design Model`，并明确 `Source / Provenance` 是贯穿所有层级的纵向能力、`What → How → Prove → Boundary` 降级为 Reading Lens（对应 `brief.md` §1）。
- [x] §2 钉死 L0/L1/L2/L3 各层"是什么 / 回答什么 / 点它去哪"，并规定 L1 不得写死为固定字段（对应 `brief.md` §2）。
- [x] §3 定义 L0 一屏两区：主区 Framework Map 与侧区 Topic Navigation 解决两个不同认知问题、不可互相替代；Framework Map ≠ Document Summary ≠ Topic Index；L0 固定的是交互职责而非图的具体拓扑（对应 `brief.md` §3.1 / §3.2 / §3.3）。
- [x] §4 给出 `framework-map` 契约草案（`mapVersion` / `level` / `document` / `thesis` / `elements` / `edges` / `attachments` / `topics` / `meta`）及逐字段约束，并说明 `thesis` 为可选（对应 `brief.md` §4）。
- [x] §5 给出元素 ontology：六类 `type`、两层 `type` + `role`、准入判据 A~F（含硬闸门"元素总数 ≤ 10~12"）、`state` 的额外条件与 concept vs state 判别规则、边界与反例的进图方式（对应 `brief.md` §5.1 ~ §5.5）。
- [x] §6 给出受控关系词表：8 个词 + `relates-to` 兜底、只写主动语序（取消全部被动态）、未知词由校验器直接 FAIL、侧挂不用 edge 而用 `attachments[]`（对应 `brief.md` §6.1 ~ §6.4）。
- [x] §7 把 coverage 拆成三种并分别指定责任方：Framework（`check-map`，F1~F3）、Navigation（`check-map`，N1~N3，含 Semantic Reachability）、Semantic（`check-overview`）；明确不得合成一个"coverage 100%"（对应 `brief.md` §7.1 ~ §7.4）。
- [x] §8 给出导航与交互表、`#element-<id>` 深链、Map 为默认入口 / Read 为可切换 Reading Lens，以及唯一需要动 UI 的点：新增 `content.type: map`（对应 `brief.md` §8）。
- [x] §9 采纳单文档原则：不引入 document set 数据结构、`document` 块记录文档身份、`label` 用规范术语，并区分文档声明的现状与代码核实过的现状（对应 `brief.md` §9）。
- [x] §10 给出 Topic 的定位、推导顺序（不得由 coverage repair 决定）、短标题与命题的分工、数量降级为 Presentation Heuristic（3~7 preferred / 2~10 allowed / >10 与 =1 Warning）、质量五判据（对应 `brief.md` §10.1 ~ §10.3）。
- [x] §11 定义泛化验证 Gate：必须先承认过拟合风险、三类 Fixture（A/B/C）、Track A 与 Track B 必须分开、判定方式与"目前只固定这五件事"；未通过此 Gate 不得进入 Phase 3（对应 `brief.md` §11.1 ~ §11.5）。
- [x] §12 给出阶段计划并落到 F04–F08：Phase 1 → Feature 04、Phase 2（Gate）→ Feature 05、Phase 3 → Feature 06、Phase 4 → Feature 07、Phase 5 → Feature 08、Phase 6 不在本特征内（对应 `brief.md` §12）。
- [x] §15 明确不做的事全部保留在本 feature 的 Out of scope；§16 的待定项（单一主轴、泳道、`state` 画法、L3 完整形态、自动 diff）延后到 Phase 2 之后，未写进第一版契约（对应 `brief.md` §15 / §16）。

## Risks and compatibility

- **方法过拟合 Fixture A（本规格最大的遗留风险）**：§5 / §6 的元素与关系词表、§10 的 Topic 判据全部是从 Context
  Consumption 一篇文档推出的，`brief.md` 自己写明"未证明通用、不得这样写"（§5.1 冻结扩张 ≠ 已证明通用；§11.1）。
  应对是 §11 的三类文档 Gate —— 它是一个**尚未执行的**门，执行实体是 F05，不是本 feature。
- **容量规则偏紧**：§5.3 判据 E 的 ≤ 10~12 在 Feature 05 实测中三篇 Fixture 全部顶到 12/12，B 的 7 条实施不变量
  只放得进 2 条 constraint；§11.1.1 因此补上第五类 gap（Capacity gap），处置是降级到 L1/L2 并保住入口。
  规则是否放宽仍未定。
- **`state` 的画法未定**：§5.4 只给了 concept vs state 的判别规则，"badge 还是独立节点"留给 Phase 2 之后（§16 第 3 项）。
- **Track A 未被验证**：§11.3 声明 Structural Reachability Test 不是 Track A 的胜负指标，真正的六项人工指标
  （找到答案耗时、不打开原 Markdown 的答题正确率等）在本 feature 范围内**没有执行**；执行实体是 F04。
- **兼容性**：本 feature 不改代码，因此无运行时兼容风险。但它使 Stage 1 的 Gold 对标基线作废（§13：
  21 个 block 的切法作废、`check-plan` 相关规则重写、`ai/stage1-plan.prompt.md` 重写、此前三次对比结论不再可用），
  这些重写是 F06 / F07 的负担，不是本 feature 的改动。
- **回滚**：本 feature 只新增/替换文档，回滚等于恢复旧版；旧版本身已保存在 `_archive/`（§17），可逐条对照。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F03-hierarchical-architecture/verification-summary.md`
- Independent review: `docs/log/artifacts/F03-hierarchical-architecture/subagent-review.md`（本 feature 无代码变更，记为 `not_required` 并给出原因）
- 历史材料: `docs/log/artifacts/F03-hierarchical-architecture/{brief.md,_archive/**}`（本 feature 无 `results/`，也没有命令输出）
