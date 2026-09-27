# Feature Registry

`feature-index.json` 是轻量的任务选择器。每个条目只包含 `id`、`title`、`status`、`feature_folder`、`version`；
完整合同在同名目录里。

## Selection

1. 读 index 与 `docs/progress.md`。
2. 若存在 `active` feature，继续它。
3. 否则选择依赖均为 `passing` 且编号最小的 `not_started` feature。
4. 只读该 feature 的 `feature.md` 与 `verification.md`。

合法状态为 `not_started`、`active`、`blocked`、`passing`。同一时间**最多一个** feature 为 `active`。

## 本项目的 `dependsOn` 口径

`dependsOn` 只登记 **harness 强制前置**：父 feature 必须 `passing`，本 feature 才可以 `active` / `passing`。

> F01–F10 在 harness 接入**之前**就已按用户裁决顺序推进。若某 feature 在尚未验收的前置之上已经完成或正在推进，
> 该前置写在合同正文的 `Process preconditions` 段落里，**不**登记为 `dependsOn` —— 否则会与真实状态冲突，
> 让 gate 报出无法用事实消除的错误。

## 创建 feature

1. 在 `feature-index.json` 添加轻量条目。
2. 复制 `feature-template.md` 到 `individual_feature/Fxx-short-name/feature.md`。
3. 复制 `verification-template.md` 到同目录 `verification.md`。
4. 实现前，在 index、合同 frontmatter 与 `docs/progress.md` 中把它标为 `active`。
5. 在 `docs/log/artifacts/Fxx-short-name/` 下建立证据目录（`verification-summary.md`、需要时的 `subagent-review.md`）。

## Passing gate

把 index、合同与 dashboard 同步。一个 `passing` feature 需要：

- 完整的 acceptance criteria，且全部勾选；
- 证据里至少有一条 `result: "passed"` 的命令，以及非空的 `evidence.lastVerifiedAt`；
- `knownUnverified` 与 `humanReviewRequired` 为空；
- `completionGate.l3` 为 `required` 时，有集成证据或人工路径证据；
- 代码变更时，证据或 artifact 目录里有独立审查记录。

harness gate 把 Markdown frontmatter 读成**单行 JSON 值**：`dependsOn`、`scope`、`evidence`、`completionGate`
必须各自保持为合法的单行 JSON。

## 状态语义

| Status | 含义 |
| --- | --- |
| `not_started` | 已登记，未开始 |
| `active` | 当前唯一在做的 feature；依赖必须已 `passing` |
| `blocked` | 无法推进到 `passing`：等待用户验收、等待前置、或存在未关闭的 gate 项；原因必须写在合同的 `completionGate` 与正文里 |
| `passing` | 完成门禁全部满足，且用户验收已记录 |

## 编号说明

编号沿用历史目录名（`01`、`03`…`10`）。**`02` 从未使用**，编号不重排，以免与历史材料、commit message
和 `docs/log/artifacts/` 中的证据路径脱钩。
