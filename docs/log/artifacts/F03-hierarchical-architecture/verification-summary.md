# F03 Verification Summary

本文件把 F03 的验证记录整理成当前口径。F03 是**纯文档 feature**：产物是分层文档模型的架构规格
（`docs/log/artifacts/F03-hierarchical-architecture/brief.md`，904 行），它不改代码、不跑测试，
所以历史材料目录里只有 `brief.md` 与 `_archive/**`，**没有 `results/`，也没有任何命令输出**。
本 feature 的 `passing` 依据是人工验收，而不是历史命令证据；harness 层证据在收口时由主 agent 统一执行。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `npm run verify:harness` | 2026-09-27 | passed | harness 层证据；由主 agent 在收口时统一执行。本次撰写合同时实测：`Harness gate: 8 features, 1 errors.`，其中 F03 无任何 error（唯一 error 属于 F06，不属本 feature）。结果另见 `docs/progress.md` 的 "Latest harness gate" 一行 |

**没有其它可登记的命令。** 本 feature 的历史材料中不存在 `results/verification-output.txt`、
`results/mutation-output.txt` 或 `drafts/*.js` 用法注释，也没有任何测试、校验器或脚本被本 feature 运行过
（`brief.md` §15 明确 Phase 1 不做 UI、不改 renderer；§12 Phase 3 之前不动 schema 与 AI）。
为遵守"不得编造命令"，这里不补写任何命令。

## 关键结论（本 feature 的可观察结果）

| 项 | 内容 |
| --- | --- |
| 产物 | `docs/log/artifacts/F03-hierarchical-architecture/brief.md`（904 行，2026-09-26 重写） |
| 产品模型 | `Markdown → Semantic Compilation → Interactive Design Model`（§1） |
| 层级 | L0 一屏两区 → L1 Topic / L3 元素详情 → L2 Visual Blocks → 原文（§2 / §3 / §8） |
| 规格固定的东西 | Element ontology（§5，候选）、Relation vocabulary（§6，候选）、Provenance、Capacity ≤ 12、Topic 质量五判据（§10.3） |
| 规格**不**固定的东西 | 图一定从左到右、一定存在单一主轴、`state` 一定是 badge、一定有泳道/分层、具体拓扑（§11.5 右列，Phase 2 之前不得写进契约） |
| 三种 coverage 分离 | Framework（`check-map` F1~F3）/ Navigation（`check-map` N1~N3）/ Semantic（`check-overview`），不得合成一个"100%"（§7） |
| 后续拆解 | Phase 1→F04、Phase 2（Gate）→F05、Phase 3→F06、Phase 4→F07、Phase 5→F08（§12） |

## 人工路径证据

- 用户（reviewer）于 **2026-09-26** 将本规格记为 Completed。依据 `docs/log/artifacts/legacy-feature-registry.md`：

  ```text
  | 03 | hierarchical-architecture | Completed（架构规格） | DSH agent | 用户 | 2026-09-26 |
  ```

- 本 feature 无 UI、无运行时路径可走，因此人工验收的对象就是这份规格文本本身，
  以及其中声明的"哪些属于规格、哪些留给具体文档/Phase 2"（§11.5）是否能被后续 feature 直接实现。

## 可复核的证据位置

| 复核对象 | 位置 |
| --- | --- |
| 现行规格（分层职责、L0 一屏两区、元素 ontology、关系词表、三种 coverage、泛化验证 Gate、阶段计划） | `docs/log/artifacts/F03-hierarchical-architecture/brief.md` §1~§17 |
| 明确不做的事 | `brief.md` §15 |
| 待定项（延后到 Phase 2 之后） | `brief.md` §16 |
| 被取代的旧草案与其并入关系 | `brief.md` §17 + `docs/log/artifacts/F03-hierarchical-architecture/_archive/**` |
| 用户验收记录 | `docs/log/artifacts/legacy-feature-registry.md` |
| Harness 层结果 | `docs/progress.md` 的 "Latest harness gate" 一行 |

## Harness 层格式约定（实测，改动前请先读）

本 feature 在收口时实测出一个 `scripts/harness-gate.mjs` 的解析行为，**它决定合同能不能过门**：

- `acceptance()` 用 `/^## Acceptance Criteria\s*$([\s\S]*?)(?=^## |\s*$)/m` 截取小节，再用
  `/^[-*]\s+\[([ xX])\]\s+.+$/gm` 逐条匹配。
- 实测：`## Acceptance Criteria` 标题与第一条 `- [x]` **之间必须有空行**，否则 `[\s\S]*?` 会在标题行末尾就满足
  `(?=\s*$)`，捕获组长度为 0，条目数为 0 → 门报 `passing feature needs acceptance criteria`。
- 空行之后的条目无论全部 `[x]` 还是混合，都能被正确解析（本次实测 13 条全部 `[x]` 时门报 F03 无 error）。
- 因此：**本文件的 Acceptance Criteria 标题后保留一个空行是必需的，不是排版偏好。**
  同一问题在 F01 上表现为同样的报错（合同初稿时 F01 亦报 `needs acceptance criteria`）。

## 已知偏差（不阻塞本轮验收）

- **没有命令证据**：本 feature 在 harness 接入前就是纯文档交付，`evidence.commands` 因此只有 harness 一条。
  这是材料事实，不是漏登记。
- **`brief.md` 的 §17 归档表里引用的文件名是规范化前的旧名**：表中列的 `README.v1-topic-card-plan.md`
  在当前 `_archive/` 下的实际文件名是 `brief.v1-topic-card-plan.md`，其余条目
  （`hierarchical-topic-synthesis-plan.md`、`framework-map-proposal.draft.md`、`context-consumption-l0-map.json`、
  `t-02-generation-pipeline-l1-map.json`、`topic-划分说明.md`、`validation-plan.md`）名称一致。
  按"照实引用"原则保留原记录，此处注明为路径在规范化前后重命名的差异。
- **规格中的泛化结论标注为"未证明"**：§5.1 明确区分"冻结扩张"与"已证明通用"，§11.1 承认 §4~§6 全部来自
  Fixture A 一篇文档。该门禁的关闭责任在 F05，不在本 feature。
- **Feature 09 的修订未回写进本规格**：`brief.md` §6 已注明关系分层（`type` + `qualifiers` + `constraint`）的完整定义在
  `docs/specs/framework-map-contract.md` §5；本规格只保存候选词表本身。
