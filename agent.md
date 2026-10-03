# AI Design Review

这是一个基于 **Electron** 的本地设计审阅工具：把长篇、连续的设计文档重构成更容易理解的视觉表达，
让人先通过 **Visual Overview** 看懂整个方案，再在 **Decision Review** 中逐条处理需要人工判断的设计决策。

它解决的核心问题不是"把文档变短"，而是：把散文重构成流程、矩阵、对照、阶梯、清单，
同时尽量保留原文的重要语义、边界、例外、反例、Current / Target 差异与未决事项。

产品目标、范围边界、核心原则与判断标准见 `docs/harness/PRODUCT_SPEC.md`。
本文件只负责**任务路由与协作规则**，不再重复项目介绍。

---

## 文档路由

先按"要做什么"查表，**只读被指向的那一份**；不要一次性把全部文档读完。

| 你要做的事 | 读这份 |
| --- | --- |
| 确认产品目标、用户、范围边界、什么算成功 | `docs/harness/PRODUCT_SPEC.md` |
| 确认哪些事绝对不能做（AI 不批准设计、两个 JSON 必须分离、Current/Target/Evidence 不能混、词表必须封闭） | `docs/harness/CONSTRAINTS.md` |
| 改模块划分、加数据产物、动流水线或共享模块 | `docs/harness/ARCHITECTURE.md` |
| 改视觉、交互、键盘路径、折叠行为或页面文案 | `docs/harness/DESIGN.md` |
| 新克隆跑起来 / 找标准验证命令 / 遇到受限环境 | `docs/harness/INITIALIZATION_CONTRACT.md` |
| 知道现在做到哪、下一步做什么、卡在哪 | `docs/progress.md` |
| 领取或新建一个 feature | `docs/harness/features/feature-index.json` → `docs/harness/features/README.md` |
| 写 / 改 feature 合同 | `docs/harness/features/feature-template.md`、`verification-template.md` |
| 查某个跨 feature、难以逆转的决策为什么这么定 | `docs/decisions.md` |
| 查形状词汇表、**framework-map 当前语义**（ontology / relation 三层 / coverage 三分 / parser 规则 / severity）、Overview 覆盖标准 | `docs/specs/{shape-catalog,framework-map-contract,overview-coverage}.md`（**各自 scope 的 NORMATIVE**） |
| 想知道 Reading **跨层**必须遵守什么（两个投影的关系、identity、Decision A–F、跨层不变量、机器保障） | `docs/specs/reading-view-cognitive-contract.md`（**NORMATIVE**，authority 入口） |
| 想知道**某一层**（L0 / L1 / L2 / L3）具体必须遵守什么（七字段契约） | `docs/specs/reading-view-layer-contracts.md`（主契约明确纳入的 **normative subordinate**） |
| 导出、加载或搬迁一篇文章的配套资料 | `docs/specs/reading-bundle-contract.md`（输入协议唯一规范）；使用说明在 `bundles/README.md` |
| 想知道某条规则**为什么存在**（实测数据、反例、推导过程、当时的裁决） | Reading：`docs/specs/reading-view-cognitive-contract-evidence.md` · Framework Map：`docs/log/artifacts/F09-contract-adversarial-test/framework-map-contract-history.md` · Overview：`docs/log/artifacts/mvp-phase1/overview-coverage-history.md`（**全部 NON-NORMATIVE**，冲突时以对应规范为准） |
| 判断某个主题该由哪份文档负责（authority 归属 / 冲突时谁优先） | 各 spec 开头的 **Authority / Scope** 段；Reading 与其它文档的优先级见 `docs/specs/reading-view-cognitive-contract.md` §1.2 的 scoped precedence |
| 查某个 feature 的需求、结论与验收证据 | `docs/log/artifacts/Fxx-*/`（先看 `brief.md`、`verification-summary.md`） |
| 查原始实验 run（什么参数下生成了什么、失败留下了什么） | `experiments/README.md` + `experiments/index.json`（逐 run → feature 的归属表） |
| 找回规范化之前的旧路径 | `docs/README.md` 的 Path mapping |
| 记录真实缺陷或用户返工反馈 | `docs/harness/incidents/`；可复用经验进 `docs/harness/lessons.jsonl` |
| 看形状探索原型、背景材料、改进建议 | `docs/prototypes/`、`docs/notes/` |
| 理解某个 feature 的当前状态语义（`active` / `blocked` / `passing`） | `docs/harness/features/README.md` |

四条读取纪律：

1. **先读索引，再读内容**：`docs/progress.md` 与 `feature-index.json` 是入口，其余文件按需打开。
2. **历史 feature 与长验证输出不是默认上下文**：只在核查证据时读，不要带进新任务的上下文。
3. **改代码前先看它由哪个 validator 把关**：`check-plan` / `check-block` / `check-map` / `check-overview`
   以及 `schema/*.json`，别绕过验证链。
4. **规范与历史分开**：`docs/specs/**` 只写"今天必须遵守什么"；"我们怎么走到这里"（实测数字、
   bug 发现过程、当时的裁决）在 `docs/log/artifacts/**` 的 `*-history.md` / evidence appendix 里，
   **它们永远不反向成为 authority**。往 specs 里补内容时，先问这句是规范还是历史。

---

## Harness workflow

每次任务开始先读：

1. `docs/harness/features/feature-index.json`
2. `docs/progress.md`
3. `docs/harness/features/README.md`

若有 `active` feature，只处理它；若没有，选择依赖已满足且编号最小的 `not_started` feature。
确定后**只**读该 feature 的 `feature.md` 与 `verification.md`。

工作规则：

- 同一时间只能有一个 `active` feature。
- 仅改动 feature 合同中允许的文件；共享模块变动必须在合同和 `docs/progress.md` 中说明原因、影响及验证方式。
- 产品范围、架构、数据、存储、AI、安全和视觉修改，先更新或确认对应 harness 文档，再改代码。
- UI 错误、构建失败或用户返工反馈先记入 `docs/harness/incidents/`；可复用经验再写入 `docs/harness/lessons.jsonl`。
- 不要把历史 feature 或长验证输出当作默认任务上下文。

完成规则：只有 acceptance、约定验证、必要人工路径、证据和独立审查都完成，且 `npm run verify:harness` 通过，
才可把 feature 标为 `passing`，并同步更新 feature 合同、`feature-index.json` 与 `docs/progress.md`。

---

## 开发约定

修改项目时优先沿用现有资产，不要另起一套：

| 沿用 | 位置 |
| --- | --- |
| Schema | `schema/*.json` |
| Shape Catalog（受控词汇表） | `docs/specs/shape-catalog.md` |
| Framework map 契约 | `docs/specs/framework-map-contract.md` |
| Reading View 认知契约 | 跨层：`docs/specs/reading-view-cognitive-contract.md`（NORMATIVE，authority 入口）· 各层：`docs/specs/reading-view-layer-contracts.md`（主契约纳入的 subordinate）· 证据：`-evidence.md`（冲突时以主契约为准） |
| Validator | `scripts/check-plan.js`、`check-block.js`、`check-map.js`、`check-overview.js` |
| Gold Fixture | `fixtures/context-consumption.json`、`fixtures/context-consumption.overview-plan.json` |
| Renderer 契约 | `app/renderer/**`（预览与产品共用同一份 renderer 模块） |
| AI 阶段边界 | Stage A → Stage B → Stage 1b/1 → Stage 2，见 `docs/harness/ARCHITECTURE.md` |

- **不要绕过已有验证链**，也不要让 AI 直接生成 HTML 来替代结构化数据 + 确定性 renderer。
- 共享判定逻辑只有一份：Gate / reviewLevel / category / Evidence 级别都在 `app/shared/semantics.js`，
  主进程与渲染进程共用，不要在别处复制。
- 会调用外部模型的命令只有 `npm run ai:*` 与 `npm run f10:run`；它们不参与标准验证，凭据不得入库。
- 项目当前最重要的判断标准已移到 `docs/harness/PRODUCT_SPEC.md`，改动前先对照它。

## 常用命令

```bash
npm run test:all            # 离线单元测试 + 文档/实验索引校验（零模型调用）
npm run selftest            # Electron 真实渲染进程内跑通整条链路
npm run verify:harness      # feature 合同与证据元数据门禁
npm run check:docs          # 文档引用检查
npm run check:experiments   # experiments 索引漂移检查（动了 experiments/ 之后必须跑）
```

完整的初始化步骤与分层验证命令见 `docs/harness/INITIALIZATION_CONTRACT.md`。
