# Harness Documents

本目录是本项目的 harness：以 feature 合同驱动开发，把范围、验证、风险与复盘变成可检查的交付物。
规范化约定：**标题与字段名用英文，正文用中文**；harness gate 依赖的 frontmatter 字段名不得改成中文。

| Document | Purpose |
| --- | --- |
| `PRODUCT_SPEC.md` | 产品目标、用户与范围边界 |
| `CONSTRAINTS.md` | 不可突破的产品、隐私、安全与工程约束 |
| `ARCHITECTURE.md` | 模块、依赖与数据边界 |
| `DESIGN.md` | 视觉、交互与可访问性规则 |
| `INITIALIZATION_CONTRACT.md` | 项目初始化与标准验证命令 |
| `features/` | feature registry 与 feature 合同 |
| `incidents/` | 真实问题与用户反馈 |
| `lessons.jsonl` | 从 incident 抽取出的可复用经验 |

## 每次任务开始

先读这三份文件，再决定做什么：

1. `docs/harness/features/feature-index.json`
2. `docs/progress.md`
3. `docs/harness/features/README.md`

若有 `active` feature，只处理它；否则选依赖已满足且编号最小的 `not_started` feature。
确定后**只**读该 feature 的 `feature.md` 与 `verification.md`，不要把历史 feature 或长验证输出当作默认上下文。

## 目录边界

- 合同在 `docs/harness/features/individual_feature/Fxx-<name>/`，只有 `feature.md` 与 `verification.md`。
- 证据在 `docs/log/artifacts/Fxx-<name>/`；harness 接入前的历史材料以 `legacy/` 之外的原始文件名保留在同一目录。
- 判定 harness 本身的元数据是否自洽：`npm run verify:harness`。
- 该命令只校验 harness 元数据；代码测试、构建与人工验收仍由每个 feature 的 `verification.md` 定义。
