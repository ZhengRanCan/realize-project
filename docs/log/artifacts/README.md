# Feature Artifacts

每个进入实现或验证的 feature 有一个 `Fxx-<name>/` 目录。这里只放**简洁、耐久**的证据；不要提交体积大的生成产物。

推荐文件：

- `verification-summary.md`：命令、日期、结果与人工路径证据。
- `subagent-review.md`：独立审查的状态、发现与处置；纯文档工作写 `not_required` 并给出原因。
- `experience-review.md`：可选，对某个反复出现的问题或反馈信号的结构化复盘。

## 历史材料的留存约定

Fxx 目录里同时保留了 harness 接入前该 feature 的原始材料，**文件名除 `README.md` → `brief.md` 外不变**：

| 文件 | 内容 |
| --- | --- |
| `brief.md` | 原 feature `README.md`：概述、背景、问题清单、预期结果 |
| `execution-prompt.md` | 交给执行 agent 的任务书 |
| `validation-checklist.md` | reviewer 的验收清单 |
| `results/` | 执行结果（修改清单、对比、验证输出、审核意见） |
| `drafts/` | 候选产物与实验脚本 |
| `_archive/` | 已被取代的旧草案（仅 F03） |

`mvp-phase1/` 保存 harness 接入之前的第一轮 MVP 验收记录，不对应任何 `Fxx` 编号。

## 记录中的历史路径

`results/*.txt`、`results/*.md` 与 `experiments/**/run-meta.json` 是**当时运行的原始记录**，
其中出现的路径按当时的仓库结构书写，规范化后已变动。映射关系见 `docs/README.md`
的 "Path mapping" 一节，记录本身**不修改**，以免篡改证据。
