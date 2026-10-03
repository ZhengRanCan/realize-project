# F17 Verification

> 2026-10-03 重开：原投影/导航结果保留，视觉验证由 F23 补齐并在本 feature 复核。

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | 对修改的 JS 逐个执行 `node --check` | yes | command output |
| L2 feature | L1 边界分类与三态的断言（新增，避免断言只查字符串） | yes | 结构级断言全绿 |
| L3 system | `npm run selftest` | yes — `completionGate.l3 = required` | Electron 内进入 Topic 的集成断言 |
| Harness | `npm run verify:harness` | yes before `passing` | command output |

## Manual paths

- [ ] 有关系的 Topic 显示实际局部/边界图；不能以文字列表或“能点入”代替。
- [ ] 用户查看实际图并确认能理解内部和外部连接，记录判断。

- [ ] 进一个 Topic：确认看到的是**边界**（成员 / 内部 / 穿越），不是被裁出来的 L0 子图。
- [ ] 挑一个 `internal = 0` 的 Topic（如 D 的大部分 Topic），确认界面没有伪造内部关系。

## Passing evidence

- 把命令日期与结果记录到本目录的 `verification-summary.md`。
- 代码有变更 ⇒ 独立审查记录到本目录的 `subagent-review.md`。
- 标为 `passing` 之前，保持 `knownUnverified` 与 `humanReviewRequired` 为空。
