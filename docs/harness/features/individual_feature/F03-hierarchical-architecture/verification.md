# F03 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | Not required | no | 本 feature 是纯文档规格，不改代码、不改 schema、不跑测试；历史材料目录中**没有** `results/` 与任何命令输出，因此不存在可登记的命令证据 |
| L2 feature | Not required | no | 同上：可交付物就是 `docs/log/artifacts/F03-hierarchical-architecture/brief.md` 这份规格文本，没有可执行的 feature 级检查 |
| L3 system | Not required | no — `completionGate.l3` 为 `not_required` | 无运行时/集成产物；人工验收记录见 `docs/log/artifacts/F03-hierarchical-architecture/verification-summary.md` |
| Harness | `npm run verify:harness` | yes before `passing` | 2026-09-27 由主 agent 在收口时统一执行，`result: passed`；本次撰写合同时实测 `Harness gate: 8 features, 1 errors.`，F03 本身无 error（唯一 error 属于 F06）。记录见 `docs/log/artifacts/F03-hierarchical-architecture/verification-summary.md` |

## Manual paths

- [x] 用户（reviewer）在 2026-09-26 验收 `brief.md` 这份架构规格并把它记为 Completed ——
      依据 `docs/log/artifacts/legacy-feature-registry.md`：`03 hierarchical-architecture | Completed（架构规格） | Executor DSH agent | Reviewer 用户 | Completed 2026-09-26`。
      本 feature 无 UI、无运行时路径，因此这是唯一的人工路径。
- [x] 规格内部的替代关系已逐条可核对：`brief.md` §17 的归档表说明 `_archive/` 中各文件被取代的原因与并入本文档的部分，
      并声明归档文件"不再是规格，仅作记录"。

## Passing evidence

- 命令日期与结果记录在 `docs/log/artifacts/F03-hierarchical-architecture/verification-summary.md`。
- 本 feature **无代码变更**（`scope.code` 与 `scope.tests` 均为空），因此不需要独立 subagent 代码审查；
  `docs/log/artifacts/F03-hierarchical-architecture/subagent-review.md` 记为 `not_required` 并给出原因与可复核位置。
- 唯一非 `passed` 之外的口径：本 feature 没有历史命令输出，所以 `evidence.commands` 只有 harness 一条，
  不登记任何无法在材料中找到对应输出的命令（见 `verification-summary.md` 的「已知偏差」）。
- 本 feature 标为 `passing` 时，`completionGate.knownUnverified` 与 `completionGate.humanReviewRequired` 均为空。
