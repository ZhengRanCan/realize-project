# Harness Incidents

本目录**只**用于真实的 UI / 运行时缺陷、验证或构建失败、以及明确的用户返工反馈。它不是进度日志。

```text
feedback or failure → incident → reusable lesson candidate → checklist/scanner/contract rule when justified
```

文件命名为 `YYYY-MM-DD-short-topic.md`，使用 `TEMPLATE.md`；只有当预防措施可复用时，才往
`lessons.jsonl` 追加一条 JSONL 记录。

## `lessons.jsonl` 字段

每行一个 JSON 对象，字段固定为：

| Field | 含义 |
| --- | --- |
| `id` | `L-YYYY-MM-DD-NN` |
| `date` | 登记日 |
| `sourceFeature` | 触发它的 feature（或 `harness-adoption` 这类工作项） |
| `incident` | 对应 incident 文件名；没有单独 incident 时写触发场景 |
| `trigger` | 什么情况下会再犯 |
| `lesson` | 从事件里学到的可复用事实 |
| `prevention` | 具体的预防动作（要能被检查，不要写"注意质量"） |
| `appliesTo` | 生效范围（路径或模块） |

harness 接入前的历史问题记录（F01 的 `results/review-notes.md`、F06 的 `results/notes.md`、
F09 的 `results/repair-round.md`、F10 的 `results/low-effort-verdict.md`）仍留在各自的
`docs/log/artifacts/Fxx/` 里，不迁移进本目录。
