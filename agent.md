# AI Design Review

这是一个基于 **Electron** 的本地设计审阅工具：把长篇、连续的设计文档重构成更容易理解的视觉表达，
让人先通过 **Visual Overview** 看懂整个方案，再在 **Decision Review** 中逐条处理需要人工判断的设计决策。

它解决的核心问题不是"把文档变短"，而是：把散文重构成流程、矩阵、对照、阶梯、清单，
同时尽量保留原文的重要语义、边界、例外、反例、Current / Target 差异与未决事项。

产品目标、范围边界、核心原则与判断标准见 `docs/harness/PRODUCT_SPEC.md`。
本文件只负责**任务路由与协作规则**，不再重复项目介绍。

---

## 文件归类与存放

项目说明、测试材料、模型任务模板、实验结果和本地资料按用途分开。找文件或新增材料时，先看这张表；具体说明由各目录 README 维护。

| 位置 | 放什么 | 入口说明 |
| --- | --- | --- |
| `docs/` | 项目文档：当前规范、开发合同、进度、决策、讨论稿和 feature 验收记录 | `docs/README.md` |
| `samples/<document>/` | 测试材料：一篇文章的原文与配套 Gold、Plan、Map、章节坐标、审核样例 | `samples/README.md` |
| `prompts/` | 生成脚本交给模型的任务说明模板，规定如何分析、输出什么结构 | `prompts/README.md`（列出五份模板及消费脚本） |
| `artifacts/experiments/` | 原始实验记录：每次 run 的请求、生成结果、失败痕迹与实验报告 | `artifacts/experiments/README.md`、`artifacts/experiments/index.json` |
| `workspace/` | 本机资料：分析资料包、人工审核、临时输出、预览、外部参考与归档；除 README 外不提交 Git | `workspace/README.md` |

`docs/` 内也按职责分放：harness 管产品与开发流程，specs 管当前判断规则，notes 放讨论与历史草稿，prototypes 放探索原型，log/artifacts 放 feature 的验收与历史证据。**feature 验收记录在 docs，原始实验 run 在 artifacts/experiments**；两者通过引用关联。

`workspace/` 的位置约定：

| 位置 | 用途 |
| --- | --- |
| `workspace/analyses/<document>/<analysis>/` | 一篇文章的一次分析；清单、原文、坐标、Review、Plan、可选 Generated/Map 与本次人工审核放在同一目录 |
| `workspace/tmp/<task>/` | 当前任务的临时文件；新的自动化测试输出写入 `workspace/tmp/tests/`，任务结束后清理 |
| `workspace/archive/` | 仍需留存的旧生成结果、一次性脚本、草稿和补丁，按任务或用途分组 |
| `workspace/previews/` | 新生成的预览页面与截图 |
| `workspace/references/` | 外部参考资料与本地参考仓库 |
| `workspace/legacy-review/` | 旧单文件入口的新人工审核；已有根目录 human-review.json 继续原位读写 |

存放与维护规则：

- **同一篇文章的配套材料放一起**：标准测试输入放 samples 的文章目录，实际分析放 workspace 的文章/分析目录；只有确实存在的配套数据才放入，不补造缺失的 Review/Plan。
- 自动化测试代码放 `scripts/test-*.js`；samples 放测试输入。人工审核样例与用户真实审核分开，真实结果只由显式保存写入当前分析目录或旧入口审核位置。
- prompts 是生成任务模板；模型输出放实验 run 或显式导出的分析资料包。Electron 打开已有包时不执行 prompt；未接入的旧协议草稿在 `docs/notes/legacy/`。
- 每次新实验使用独立 run 目录；feature 的结论和验收记录引用相应 run。历史请求、失败记录、原文、Gold、Plan 和 Generated 不因目录整理而改写。
- 新命令与当前文档使用整理后的路径。旧路径兼容的唯一机器映射是 `scripts/helpers/repository-layout.json`，由同目录的 resolver 使用；历史文档路径对照见 `docs/README.md`。资料包内部仍按清单校验，不走仓库旧路径映射，不按文件名猜配套关系。
- **任务结束时清理临时文件**：agent 校验日志、测试缓存、提交说明与可重建输出不用长期保留，更不能散放在 workspace 根目录。成功检查默认直接看终端输出，正式验收记录只登记命令、结果与关键证据。
- 排查失败时可暂存日志于当前任务的 tmp 子目录，问题解决后删除；不为每次成功检查新增永久 txt。测试复用固定缓存目录，完成后清理。
- 旧生成结果、仍有价值的一次性脚本、草稿与补丁归档到 workspace/archive；稳定且可复用的工具经过整理和验证后再进入 scripts。分析资料包、用户人工审核、原文、Gold、正式实验和本地配置不作为测试缓存处理。
- 清理只针对当前任务已确认的临时范围，不扫删整个 workspace、archive 或外部参考资料。文件移动核对内容，目标冲突时停止；删除受工具限制时如实报告，不能把“移到待删目录”称为已删除。

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
| 推进 Single-Agent Harness、AI 实验与文档分析入口 | `docs/harness/AI_INTEGRATION_ROADMAP.md` → 当前 feature 合同；设计讨论见 `docs/notes/single-agent-harness-design.md` |
| 领取或新建一个 feature | `docs/harness/features/feature-index.json` → `docs/harness/features/README.md` |
| 写 / 改 feature 合同 | `docs/harness/features/feature-template.md`、`verification-template.md` |
| 查某个跨 feature、难以逆转的决策为什么这么定 | `docs/decisions.md` |
| 查形状词汇表、**framework-map 当前语义**（ontology / relation 三层 / coverage 三分 / parser 规则 / severity）、Overview 覆盖标准 | `docs/specs/{shape-catalog,framework-map-contract,overview-coverage}.md`（**各自 scope 的 NORMATIVE**） |
| 想知道 Reading **跨层**必须遵守什么（两个投影的关系、identity、Decision A–F、跨层不变量、机器保障） | `docs/specs/reading-view-cognitive-contract.md`（**NORMATIVE**，authority 入口） |
| 想知道**某一层**（L0 / L1 / L2 / L3）具体必须遵守什么（七字段契约） | `docs/specs/reading-view-layer-contracts.md`（主契约明确纳入的 **normative subordinate**） |
| 导出、加载或搬迁一篇文章的配套资料 | `docs/specs/reading-bundle-contract.md`（输入协议唯一规范）；使用说明在 `workspace/README.md` |
| 想知道某条规则**为什么存在**（实测数据、反例、推导过程、当时的裁决） | Reading：`docs/specs/reading-view-cognitive-contract-evidence.md` · Framework Map：`docs/log/artifacts/F09-contract-adversarial-test/framework-map-contract-history.md` · Overview：`docs/log/artifacts/mvp-phase1/overview-coverage-history.md`（**全部 NON-NORMATIVE**，冲突时以对应规范为准） |
| 判断某个主题该由哪份文档负责（authority 归属 / 冲突时谁优先） | 各 spec 开头的 **Authority / Scope** 段；Reading 与其它文档的优先级见 `docs/specs/reading-view-cognitive-contract.md` §1.2 的 scoped precedence |
| 查某个 feature 的需求、结论与验收证据 | `docs/log/artifacts/Fxx-*/`（先看 `brief.md`、`verification-summary.md`） |
| 查原始实验 run（什么参数下生成了什么、失败留下了什么） | `artifacts/experiments/README.md` + `artifacts/experiments/index.json`（逐 run → feature 的归属表） |
| 找测试文章、Gold、Map 或章节坐标 | `samples/README.md` → 对应文章目录 |
| 查 prompt 的用途、对应生成脚本或修改模型任务模板 | `prompts/README.md` → 对应模板；阶段职责见 `docs/harness/ARCHITECTURE.md` |
| 找本地分析资料包、审核、临时输出、预览或参考资料 | `workspace/README.md` |
| 找回规范化之前的旧路径 | `docs/README.md` 的 Path mapping；仓库兼容映射在 `scripts/helpers/repository-layout.json` |
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

2026-10-06 用户确认 L0 / L1 / L2 第一版作为当前基线，暂缓主动扩展 Reading。用户随后要求Harness先行：F26内核 → F31领域工具 → F32完成门禁/资料包集成 → F33真实AI实验 → F27配置 → F28文档选择 → F29产品链路 → F30入口UI。原F26实验迁到F33；F27–F30保留编号，通过依赖后移，全部not_started。新app/agent使用TypeScript，旧Electron模块保留JavaScript；独立编译产物供旧入口消费，运行时校验保持。Core无Reading依赖，只执行宿主Policy；F31拥有原文/坐标bootstrap与领域依赖账本，F32核对结构闭包，F33单独评价质量与轨迹，不修改旧生成流水线。解释页顶部重排待实际使用后基于截图讨论。详细目标、合同入口及依赖见 `docs/harness/AI_INTEGRATION_ROADMAP.md`；登记路线不等于已运行模型或已批准所有实现细节。

修改项目时优先沿用现有资产，不要另起一套：

| 沿用 | 位置 |
| --- | --- |
| Schema | `schema/*.json` |
| Shape Catalog（受控词汇表） | `docs/specs/shape-catalog.md` |
| Framework map 契约 | `docs/specs/framework-map-contract.md` |
| Reading View 认知契约 | 跨层：`docs/specs/reading-view-cognitive-contract.md`（NORMATIVE，authority 入口）· 各层：`docs/specs/reading-view-layer-contracts.md`（主契约纳入的 subordinate）· 证据：`-evidence.md`（冲突时以主契约为准） |
| Validator | `scripts/check-plan.js`、`check-block.js`、`check-map.js`、`check-overview.js` |
| Gold Fixture | `samples/context-consumption/design-review.json`、`samples/context-consumption/overview-plan.json` |
| Renderer 契约 | `app/renderer/**`（预览与产品共用同一份 renderer 模块） |
| AI 阶段边界 | Stage A → Stage B → Stage 1b/1 → Stage 2，见 `docs/harness/ARCHITECTURE.md` |

- **不要绕过已有验证链**，也不要让 AI 直接生成 HTML 来替代结构化数据 + 确定性 renderer。
- 共享判定逻辑只有一份：Gate / reviewLevel / category / Evidence 级别都在 `app/shared/semantics.js`，
  主进程与渲染进程共用，不要在别处复制。
- 会调用外部模型的命令只有 `npm run ai:*` 与 `npm run f10:run`；它们不参与标准验证，凭据不得入库。
- 项目当前最重要的判断标准已移到 `docs/harness/PRODUCT_SPEC.md`，改动前先对照它。

## Git 分支约定

用户指定 F11–F21 及配套 F22 工作继续在 `codex/f11-f21-conformance` 上提交和推送。等 F11–F21 全部完成并通过验收后，再将该分支合并到 main；此前不提前合并主分支。

## 常用命令

```bash
npm run test:all            # 离线单元测试 + 文档/实验索引校验（零模型调用）
npm run selftest            # Electron 真实渲染进程内跑通整条链路
npm run verify:harness      # feature 合同与证据元数据门禁
npm run check:docs          # 文档引用检查
npm run check:experiments   # experiments 索引漂移检查（动了 artifacts/experiments/ 之后必须跑）
```

完整的初始化步骤与分层验证命令见 `docs/harness/INITIALIZATION_CONTRACT.md`。
