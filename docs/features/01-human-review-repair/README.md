# Feature 01: Human Review Repair

## 概述

Stage 2 Full Run 完成后，人工验收发现 6 个需要修复的问题。本 feature 专注于修复这 6 个问题，不扩大自动化体系范围。

## 背景

- **Stage 2 Full Run 状态**：21/21 blocks 成功，coverage 100%，provenance 100%，0 Hard Errors
- **发现问题数**：6 个（3 个 deterministic fixes + 2 个 sourceUnit splits + 1 个 topology fix）
- **修复范围**：仅修复已发现问题，不接 Electron、不进 Phase 3、不使用 Stage 1 generated plan

## 问题清单

| ID | 问题 | Phase | 风险 | 受影响 Block |
|----|------|-------|------|-------------|
| 1.1 | O-15 标题错误（9 项 → 8 项） | 1 | Low | O-15 |
| 1.2 | O-10b 应默认折叠 | 1 | Low | O-10b |
| 1.3 | O-16 应移到 prove stage | 1 | Low | O-16 |
| 2.1 | O-08 sourceUnit 粒度过粗 | 2 | Medium | O-08, 可能影响其他 blocks |
| 2.2 | O-05 Receipt/Availability 语义串层 | 2 | Medium | O-05, sourceUnits |
| 3.1 | O-04 Visual Topology 不够清晰 | 3 | High | O-04, 可能需要扩展 renderer |

## 文档结构

```
docs/features/01-human-review-repair/
├── README.md                    # 本文件，feature 概述
├── execution-prompt.md          # 执行 agent 使用的完整任务 prompt
├── validation-checklist.md      # Reviewer 使用的验证清单
└── results/                     # 执行结果（执行完成后创建）
    ├── modifications.md         # 修改清单
    ├── before-after.md          # 受影响 blocks 的对比
    ├── verification-output.txt  # 所有验证命令的输出
    └── review-notes.md          # Reviewer 的审核意见
```

## 执行流程

1. **执行阶段**
   - Execution agent 阅读 `execution-prompt.md`
   - 按 Phase 1 → Phase 2 → Phase 3 顺序执行
   - 将所有结果输出到 `results/` 目录

2. **验证阶段**
   - Reviewer 使用 `validation-checklist.md` 逐项检查
   - 填写评分和审核意见
   - 决定 ACCEPT / REJECT

3. **归档阶段**
   - 如果 ACCEPT，更新主分支
   - 将 results 归档到本 feature 目录
   - 关闭 feature

## 预期结果

**最低标准（必须达成）：**
- Phase 1 全部完成（3 个 deterministic fixes）
- Phase 2 全部完成（2 个 sourceUnit splits）
- 所有自动化验证通过
- Core coverage = 100%, Provenance = 100%, Hard Error = 0

**理想标准：**
- Phase 3 完成（O-04 topology fix）
- 人工语义验证全部通过
- Warnings 未增加

**可接受的妥协：**
- Phase 3 如果调研发现需要大改 renderer，可以跳过
- 部分 warnings 存在，但有合理解释

## 风险评估

| Phase | 风险等级 | 主要风险 | Fallback |
|-------|---------|---------|----------|
| Phase 1 | Low | 人为失误（typo） | 直接回滚 JSON 文件 |
| Phase 2 | Medium | SourceUnit 拆分导致 coverage hole | 回滚 sourceUnits，保留原 block |
| Phase 3 | High | 需要大改 renderer 或 schema | 调研后决定跳过 |

## 后续 Feature 使用此模板

新建 feature 时，复制此目录结构：

```bash
# 创建新 feature
mkdir -p docs/features/02-feature-name
cp docs/features/01-human-review-repair/README.md docs/features/02-feature-name/

# 编写执行和验证文档
# execution-prompt.md - 给执行 agent
# validation-checklist.md - 给 reviewer

# 执行完成后创建 results/
mkdir -p docs/features/02-feature-name/results
```

## 状态

- **创建时间**：2025-01-XX
- **当前状态**：待执行
- **执行者**：TBD
- **审核者**：TBD
- **完成时间**：TBD
