# Features Directory

这个目录包含所有需要人工执行和验证的 feature 任务。每个 feature 都有独立的文档结构。

## 目录结构

```
docs/features/
├── README.md                    # 本文件
├── 01-human-review-repair/      # Feature 01: 人工验收修复
│   ├── README.md
│   ├── execution-prompt.md
│   ├── validation-checklist.md
│   └── results/
├── 02-xxx/                      # 未来的 feature
├── 03-hierarchical-architecture/ # 架构规格（L0→L3），只有 README.md
│   └── _archive/                # 被取代的旧草案
├── 04-l0-framework-map/         # Phase 1 / Track A：手工框架图 + 交互假设
├── 05-l0-generalization-gate/   # Phase 2 / Track B：跨文档类型 Gate
├── 06-contract-and-validators/  # Phase 3：契约与校验器（等 05 的 Gate）
├── 07-generation-pipeline/      # Phase 4：Stage 1a/1b（等 Gate + 06）
└── 08-l0-ui/                    # Phase 5：L0 一屏两区（等 06）
```

## Feature 命名规范

- 使用两位数字前缀：`01-`, `02-`, ...
- 短横线分隔的小写名称：`human-review-repair`, `stage3-integration`, ...
- 目录名应简短且描述性

## Feature 目录结构

每个 feature 目录应包含：

```
XX-feature-name/
├── README.md                    # Feature 概述、背景、问题清单、预期结果
├── execution-prompt.md          # 执行 agent 的完整任务 prompt
├── validation-checklist.md      # Reviewer 的验证清单
└── results/                     # 执行结果（完成后创建）
    ├── modifications.md         # 修改清单
    ├── before-after.md          # 变更对比
    ├── verification-output.txt  # 验证输出
    └── review-notes.md          # 审核意见
```

## Feature 生命周期

1. **Planning** - 创建 feature 目录，编写 README.md
2. **Preparation** - 编写 execution-prompt.md 和 validation-checklist.md
3. **Execution** - Execution agent 执行任务
4. **Validation** - Reviewer 验证结果
5. **Completion** - 归档结果，更新状态

## 当前 Features

| ID | Name | Status | Executor | Reviewer | Completed |
|----|------|--------|----------|----------|-----------|
| 01 | human-review-repair | Completed | DSH agent | 用户 | 2026-09-26 |
| 03 | hierarchical-architecture | Completed（架构规格） | DSH agent | 用户 | 2026-09-26 |
| 04 | l0-framework-map | Technical Pass / UX Validation Pending | DSH agent | 用户 | - |
| 05 | l0-generalization-gate | Ready（可立即开始） | TBD | TBD | - |
| 06 | contract-and-validators | Blocked（等 05 的 Gate） | TBD | TBD | - |
| 07 | generation-pipeline | Blocked（等 Gate + 06） | TBD | TBD | - |
| 08 | l0-ui | Blocked（等 06） | TBD | TBD | - |

## 创建新 Feature

1. 复制模板：
   ```bash
   cp -r docs/features/01-human-review-repair docs/features/XX-new-feature
   ```

2. 编辑 README.md，填写：
   - 概述和背景
   - 问题清单
   - 预期结果
   - 风险评估

3. 编写 execution-prompt.md：
   - Context & Constraints
   - Task Breakdown
   - Verification Checklist
   - Deliverables

4. 编写 validation-checklist.md：
   - 每个任务的具体检查点
   - 自动化验证
   - 人工验证
   - 最终判定标准

5. 更新本 README.md 的 Features 表格

## 注意事项

- 每个 feature 应该是独立的、可回滚的
- execution-prompt.md 应该足够详细，让 agent 不需要额外上下文就能执行
- validation-checklist.md 应该足够具体，让 reviewer 可以逐项打勾验证
- results/ 目录在执行完成后再创建，不要预先创建
