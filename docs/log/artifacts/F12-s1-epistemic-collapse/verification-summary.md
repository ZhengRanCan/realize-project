# F12 Verification Summary — S1 Epistemic Collapse Regression

状态：**尚未开始**（`not_started`）。

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

（实现后补齐：命令、日期、结果。）

## 已知起点（F11 之前已实测）

```text
scripts/l0-view-model.js:109
  blockIds: [...(t.blockIds || [])]
```

尚未判定：是否还有其它站点真的具有 Unknown / Empty 区别（由 F11 的扫描给出）。
