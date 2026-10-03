---
id: F22
title: Entry and Repository Layout
version: v0.1
status: passing
dependsOn: ["F18"]
scope: {"code":["app/main/**","app/renderer/index.html","app/renderer/styles.css","app/renderer/app.js","scripts/**","package.json",".gitignore"],"tests":["scripts/test-*.js"],"docs":["README.md","agent.md","docs/**","bundles/README.md","samples/**/README.md","prompts/README.md","artifacts/experiments/**/README.md","workspace/README.md"],"data":["fixtures/**","测试文档/**","ai/**","experiments/**","bundles/**","tmp/**","docs/source-sections.json","docs/ref/**","samples/**","prompts/**","artifacts/experiments/**","workspace/**"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"npm run test:all","result":"passed","output":"All offline suites and relocated Preview passed"},{"command":"npm run selftest","result":"passed","output":"SELFTEST PASSED: F22 start/keyboard/legacy and moved real package paths, save isolation"},{"command":"node scripts/migrate-repository-layout.js --verify","result":"passed","output":"10570 immutable entries and 333 protected tracked files match"}],"manualSmoke":"User authorized written design and completion; required user paths covered by real Electron integration, not claimed as human manual acceptance."}
completionGate: {"version":"v0.1","l3":"required","userPath":["正常首屏只突出打开分析资料包；开发与旧版入口默认折叠，可展开并加载旧输入","从新目录打开既有分析资料包，完成 Map → Topic → Block → 查出处，并确认人工审核仍跟随本包"],"integrationEvidence":["2026-10-03 selftest: default fold, Return expand, actual fixture button, moved real package Map/Topic/Block/SU/Evidence and package-local human path/no autosave passed","2026-10-03 moved actual bundle portable HTML real Electron inspection/read-only passed; full save/session isolation regression passed","2026-10-03 native independent review: no remaining P1/P2"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F22 Entry and Repository Layout

## Goal

用户打开 Electron 能立即识别当前资料包入口；开发者按用途找到项目说明、测试材料、提示词、实验记录与本地数据。
同一篇测试文章的原文与标准分析数据归到同一个目录。目录搬迁保持资料配对、历史记录与既有功能可用。

## Process preconditions

- F18 已 passing，显式资料包与完整 L3 路径作为本轮回归基线。
- 用户于 2026-10-03 批准“首页折叠旧入口 + 按用途分区、按文章归拢”的方向，并要求单独新建 feature。
- 本轮优先处理用户指定的 F22；这是对自动选择编号最小未开始 feature 的明确覆盖，不启动 F19–F21。
- 用户明确要求“完成F22”；书面设计与实施计划已记录，代理按 Native 完成实施与独立审查。
- 书面设计：[Layout Design](../../../../log/artifacts/F22-entry-and-repository-layout/layout-design.md)。它是本 feature 的设计记录，不取代 Reading 认知规范。

## Scope

### Allowed changes

- 首屏的入口分组、按钮层级及文案；仍保留开发者可展开的旧 fixture、单独 Review/Map 与 Markdown 入口。
- 合并测试文章与 Gold 数据；迁移当前作为测试输入的手工 Map 与章节坐标，保留原始内容。
- 提示词迁至 prompts；未接入的旧 Phase 2 协议草稿归项目历史设计记录。
- 实验目录、本地资料包、临时文件和外部参考资料按书面设计搬迁。
- 集中仓库默认路径与明确的旧路径映射，更新代码、npm 命令、当前文档及索引。
- 补充迁移完整性、默认折叠、旧入口和资料包路径的必要回归，以及独立审查证据。

### Out of scope

- F19 canonical resolver、F20 Explore、F21 全面的视觉/性能/可访问性改造。
- 修改样本原文、Gold 语义、历史生成结果或提示词正文；不重新调用模型生成数据。
- 清空 tmp、删除未归类的本地草稿、覆盖本地资料包或人工审核。
- 删除历史功能实现、拆分既有单文件、改变 Reading identity/authority/verification 语义。
- 引入第二套 ticket 系统、框架或外部产物服务。

## Acceptance Criteria

- [x] 首页突出“打开分析资料包”；“开发与旧版入口”默认关闭，展开后原入口可用；不再出现未启用 Source 选择和过时 Phase 占位说明。
- [x] docs、samples、prompts、artifacts/experiments、workspace 各有明确职责与入口说明；旧顶层业务目录不重复承担这些职责。
- [x] 每份测试文章的原文与现行 Gold/Map 数据位于 samples 的同一文章目录；章节坐标从 docs 根目录迁出。
- [x] 五份被脚本引用的提示词保持正文和指纹，旧 Phase 2 协议草稿与其分开；不改变生成任务语义。
- [x] 原文、Gold、历史实验、提示词与本地审核搬迁前后内容哈希一致；实验单元与归属不丢失，迁移清单可追溯。
- [x] 历史 Plan fingerprint 与 Generated 配对保持；已知旧仓库路径通过明确映射解析，不按文件名猜关系。
- [x] CLI 默认输入/输出、npm 命令、当前文档、实验索引及必要旧路径回归全部使用整理后的路径。
- [x] workspace 本地资料包、tmp 与参考资料继续忽略 Git；不把本地内容复制进提交或验收日志。
- [x] 既有资料包搬迁后，真实 Electron 与只读 Preview 的 Map → Topic → Block → 两条 L3 核查路径通过；保存人工审核不串包。
- [x] 全部约定验证与独立审查完成，再同步 feature/index/progress 为 passing；登记和文档校验不算迁移完成。

## Risks and Compatibility

- 历史 Plan 的路径字段是原始字节的一部分，直接改写会破坏 Generated 的配对指纹。迁移保留这些字节，仓库工具读取时解析明确旧路径。
- 历史 request/run-meta/日志记录旧路径；保留内容，通过路径对照和索引说明其现在的位置。
- 本地目录含不入库的资料；搬迁前检查绝对路径与清单，完成后核对文件，不执行递归清空。
- 旧入口被真实 selftest 和脚本使用；折叠不能改变其事件绑定或旧输入的兼容行为。

## Completion Evidence

- Verification: `docs/log/artifacts/F22-entry-and-repository-layout/verification-summary.md`。
- Independent review: 同一 artifact 目录的 `subagent-review.md`，已记录修复与最终通过结论。
