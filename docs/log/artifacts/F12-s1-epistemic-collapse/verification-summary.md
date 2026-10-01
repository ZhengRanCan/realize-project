# F12 Verification Summary — S1 Epistemic Collapse Regression

状态：**已通过**（`passing`）。

## 将要记录的内容

| 项 | 位置 |
|---|---|
| 「先失败」的回归测试输出 | 本节命令记录 |
| 最小修改说明（改了哪一行、为什么不是重构） | 本节 |
| 三态结构断言的断言列表 | 本节 |
| epistemic-collapse 扫描：站点 → 判定（改 / 不改） | 本节 |
| 契约 §6 矩阵 S1 cell 的前后值 | 本节 |
| 独立审查 | `subagent-review.md` |

## 命令记录

2026-10-01：先加入结构回归断言，尚未修改投影实现时运行：

```text
$ node scripts/test-l0-view-model.js
FAIL  S1：topic.blockIds 的 absent（Unknown）与 []（Known(0））在投影后仍有不同 shape
→ Unknown blockIds 被投影成已知数组
View Model 回归: 34/35 通过（覆盖 28 份 map）
```

最小修复后：

```text
$ npm run test:all
22 + 31 + 29 + 33 + 48 + 35 + 42 + 131 通过；Doc links: 110 markdown files checked, 0 broken.

$ npm run selftest
✓ L0 集成：S1 保留 topic.blockIds 的 Unknown 与 Known(0) 两种 shape
SELFTEST PASSED

$ npm run verify:harness
Harness gate: 20 features, 0 errors.

$ npm run check:docs
Doc links: 109 markdown files checked, 0 broken.
```

## 最小修改

- `scripts/l0-view-model.js`：仅在输入 topic 自身拥有 `blockIds` 时才投影该字段；不存在时保持字段缺失。
- `app/renderer/l0-map.js`：分别显示 `L2 blocks: unknown` 与 `L2 blocks: none`，避免消费侧重新合并两态。
- `app/main/main.js`：selftest 在真实 `loadFrameworkMap` 路径验证 Unknown 和 Known(0) 的对象 shape 不同。
- `scripts/test-l0-view-model.js`：断言字段存在性及空数组 shape，不以字符串或长度替代状态判断。

## 扫描判定

F11 的 269 个站点逐项判定仍为本 feature 的基线。唯一需要修改的站点是
`topic.blockIds` 投影；其余站点均是字段没有 Unknown / Empty 区别的合法 fallback，未改动。

## §6 S1 cell

- 之前：`None` / `High`，且记录了运行中的 `blockIds || []` 违反。
- 现在：`Partial` / `Medium`；该 projection 出口被结构测试与 Electron selftest 保护，完整五态状态空间留给 F13/B1。

## 2026-10-01 审查验收

用户授权 Codex 完成审查验收。审查首先发现 Known(0) 分支曾只直调 view model，未覆盖
preload / IPC；已改为使用临时 map 经 `window.designReview.l0.loadPath` 走真实链路，随后再走一次
`loadL0` 保留既有交互验收。临时 map 在 selftest 中删除。

最终 Electron 输出确认：

```text
✓ L0 集成：真实 preload → IPC → main → view model 链路保留 S1 的 Unknown 与 Known(0) shape
✓ L0 集成：点 Reading 节点 → 只高光相关项（命中 13 处 · 含 2 条线），其余不压暗（dim=0）
✓ L0 集成：点约束 → 角标自身有高光 + 2 个宿主一起点亮（不压暗任何东西）
SELFTEST PASSED
```

## 已知起点（F11 之前已实测）

```text
scripts/l0-view-model.js:109
  blockIds: [...(t.blockIds || [])]
```

尚未判定：是否还有其它站点真的具有 Unknown / Empty 区别（由 F11 的扫描给出）。
