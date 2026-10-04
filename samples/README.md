# Samples

每篇测试文章一个目录，原文与配套数据放在一起。原文、Gold、Map、Plan 和提示词迁移时保持字节；历史路径字段通过显式仓库映射读取，不改写 Plan fingerprint。

F25 在 context-consumption 和 operational-runbook 各新增 framework-map.reading.json：复制原 Map 的全部结构，再附显式版本绑定、有摘录出处的 readingGuide。旧 Map/原文不改。打开或导出时明确选择所需 Map，不按文件名自动配对；资料包可核对出处，独立 Map 未加载原文时只展示已声明解释。

| 文章目录 | 配套材料 |
| --- | --- |
| `context-consumption/` | source.md、design-review.json、overview-plan.json、source-sections.json、framework-map.json、human-review.sample.json |
| `canonical-hash-integrity/` | source.md、framework-map.json |
| `candidate-inbox-profile/` | source.md、framework-map.json |
| `goal-plan-task-state/` | source.md、framework-map.json |
| `operational-runbook/` | source.md、framework-map.json |

A–E 是既有实验中的简称。B–E 没有 Gold Review/Plan，不能据此伪造配套关系。实际运行的生成结果在 [Experiments](../artifacts/experiments/README.md)，导出的独立分析资料包在 [Workspace](../workspace/README.md)。human-review.sample.json 是测试输入，用户保存写入本地资料包或旧入口审核目录。

完整迁移清单与 SHA256 见 [Migration Integrity](../docs/log/artifacts/F22-entry-and-repository-layout/migration-integrity.json)。兼容路径唯一表在 `scripts/helpers/repository-layout.json`，只针对已知仓库路径；资料包内部路径仍遵守 [Bundle Contract](../docs/specs/reading-bundle-contract.md)。
