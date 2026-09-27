# Documentation Map

本目录的文档分四类。**规范化的约定是：标题与字段名用英文，正文用中文**；harness gate 依赖的 frontmatter 字段名保持英文。

```text
docs/
├── harness/        harness 本体：产品/约束/架构/设计/初始化 + feature registry
├── progress.md     当前 dashboard（active feature、下一步、风险）
├── decisions.md    跨 feature、长期难逆转的产品或工程决策
├── specs/          参考规格（被实现与校验器共同引用的判断层）
├── notes/          讨论材料与建议（不构成契约）
├── prototypes/     形状探索用的静态 HTML 原型
├── log/            证据
│   ├── artifacts/  每个 feature 的耐久证据 + harness 接入前的历史材料
│   └── ...         其他日志
└── source-sections.json
```

## 各类文件的边界

| 位置 | 放什么 | 不放什么 |
| --- | --- | --- |
| `docs/harness/**` | 产品范围、约束、架构、设计、初始化契约、feature 合同、incident、lesson | 执行结果、长命令输出 |
| `docs/specs/**` | 被代码与校验器引用的**判断层**规格（shape 词汇表、framework-map 契约、Overview 覆盖标准） | 阶段计划与任务书 |
| `docs/notes/**` | 背景材料、讨论稿、改进建议 | 任何被代码或校验器依赖的规则 |
| `docs/log/artifacts/Fxx-*/` | 该 feature 的验收证据、历史任务书与结果 | 下一个 feature 的上下文 |
| `experiments/**` | 原始 run 产物与实验报告（逐 run → feature 的归属表见 `experiments/index.json`） | 产品运行时会读取的数据 |

`docs/source-sections.json` 是唯一的例外：它由 `npm run source` 生成，但 `app/main/main.js` 与多个
`scripts/check-*.js` 直接按这个路径读取，因此**保留在 `docs/` 根目录**，不迁进 `docs/specs/`。

## Path mapping

下表用于读旧记录（`results/*.txt`、`experiments/**/run-meta.json` 里仍是旧路径）。
**这些历史记录本身不修改**，以免篡改证据。

| 规范化前 | 规范化后 |
| --- | --- |
| `docs/features/01-human-review-repair/**` | `docs/log/artifacts/F01-human-review-repair/**`（`README.md` → `brief.md`） |
| `docs/features/03-hierarchical-architecture/**` | `docs/log/artifacts/F03-hierarchical-architecture/**` |
| `docs/features/04-l0-framework-map/**` | `docs/log/artifacts/F04-l0-framework-map/**` |
| `docs/features/05-l0-generalization-gate/**` | `docs/log/artifacts/F05-l0-generalization-gate/**` |
| `docs/features/06-contract-and-validators/**` | `docs/log/artifacts/F06-contract-and-validators/**` |
| `docs/features/07-ai-framework-map-generation/**`（旧名 `07-generation-pipeline`） | `docs/log/artifacts/F07-ai-framework-map-generation/**` |
| `docs/features/08-l0-ui/**` | `docs/log/artifacts/F08-l0-ui/**` |
| `docs/features/09-contract-adversarial-test/**` | `docs/log/artifacts/F09-contract-adversarial-test/**` |
| `docs/features/10-semantic-grounding/**` | `docs/log/artifacts/F10-semantic-grounding/**` |
| `docs/features/README.md` | `docs/log/artifacts/legacy-feature-registry.md`（冻结的历史 registry） |
| `docs/shape-catalog.md` | `docs/specs/shape-catalog.md` |
| `docs/framework-map-contract.md` | `docs/specs/framework-map-contract.md` |
| `docs/overview-coverage.md` | `docs/specs/overview-coverage.md` |
| `docs/improvement-suggestions-for-data-model-scenarios.md` | `docs/notes/improvement-suggestions-for-data-model-scenarios.md` |
| `docs/组会讲稿-项目背景.md` | `docs/notes/group-meeting-project-background.md` |
| `docs/acceptance-phase1.md` | `docs/log/artifacts/mvp-phase1/acceptance-phase1.md` |
| `docs/experiments/*.md` | `experiments/reports/*.md` |
| `docs/source-sections.json` | 不变（见上） |

## 任务从哪里开始

agent 的任务入口与完整文档路由表在仓库根目录 `agent.md`；harness 侧的选择顺序是：

1. `docs/harness/features/feature-index.json`
2. `docs/progress.md`
3. `docs/harness/features/README.md`

`docs/log/artifacts/legacy-feature-registry.md` 只作历史对照：它记录的是 harness 接入之前的状态表，
其中的路径与"Executor/Reviewer"列已经不是当前口径。

## 维护

- `npm run check:docs` 会扫描本文档树里指向仓库内文件的路径并报告失效引用。
  两类**有意保留**的旧路径不会被报错：Path mapping 表的左列，以及标注了「规范化前」的历史命令引用
  （`experiments/**/raw.md` 是被审原文，整体跳过）。
- 新增或移动文档后，先跑 `npm run check:docs`，再跑 `npm run verify:harness`。
