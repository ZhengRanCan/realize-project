# F15 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | `node --check app/renderer/l0-map.js app/renderer/app.js app/main/main.js` | yes | command output |
| L2 feature | `node` + 新增的 `test-reading-integration.js`（放在 `scripts/`） | yes | 五组集成不变量断言全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内跑通导航（Back）/ landing / renderer 纪律断言 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 在 Electron 中：L0 选元素 → 进 Explore 焦点 → `Back` 回到原 ReadingAddress（不回首页）。
- [ ] 加载 `experiments/semantic-grounding/fixture-d/run-04`：确认 `Known(0)` occurrence 的 Block
      仍有 `#block-O-01`，且多 occurrence 的 element 只有一个 canonical landing。
- [ ] 确认 renderer 没有升级认识论状态（`Indeterminate` 未被渲染成 `unsupported`）。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
