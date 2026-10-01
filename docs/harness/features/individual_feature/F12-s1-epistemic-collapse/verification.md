# F12 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check scripts/l0-view-model.js app/renderer/l0-map.js app/main/main.js` | yes | command output |
| L2 feature | `node scripts/test-l0-view-model.js && node scripts/test-l0-layout.js && node scripts/test-l0-preview.js` | yes | 34 / 42 / 130 全绿（含新增三态断言） |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内跑通 preload → IPC → `main.loadFrameworkMap` → view model，含新增三态断言 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [x] 在 Electron 中加载 `experiments/semantic-grounding/fixture-d/run-04/framework-map.json`
      （`blockIds` absent）与一份 `blockIds: []` 的 map，确认界面没有把两者渲染成同一种说法。
- [x] 确认没有用户可见的回归：点选 / 高光 / 约束角标 / 预览仍与修改前一致。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
