# Entry and Repository Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 完成 F22：首页集中资料包入口，仓库按用途整理，同篇测试材料集中且来源与人工审核保持可用。

**Architecture:** Node-only 的 repository-layout 模块集中确切文件映射与实验/本地目录前缀。迁移保留数据原始字节；工具与开发入口采用该路径解析器，运行时 manifest containment 不参与兼容映射。原生 details 收纳旧入口，保持按钮 ID 与事件。

**Tech Stack:** 既有 Node.js / Electron、CommonJS、原生 fs/path/crypto 与 DOM；不加依赖、不调用模型。

**Spec:** [Layout Design](layout-design.md)。用户于 2026-10-03 要求“完成F22”，授权按该设计端到端实施。

**Execution:** 沿用用户先前选定的 Native：当前会话实施，末尾原生独立复查。用户明确的完成指令优先于重复询问中间审批；计划由代理自检，不声称用户逐条审阅了本计划。继续使用本项目 harness，未安装第二套 BMAD 或不存在的 superpowers 执行技能。

## Global Constraints

- 原文、Gold、Map、registry、五份 prompt、历史 raw/request/run-meta/Generated 以及本地数据保持字节不变。
- 允许更新 README、当前索引位置字段、现行规范中的路径与代码；不改历史结论。
- 本地 tmp/analyses/references 保留并忽略 Git；不在日志输出其内容。
- 路径映射只认确切已登记文件或目录前缀，不按标题/文件名猜配对；bundle manifest 解析保持原边界。
- 不实施 F19–F21；不改 Reading identity、authority、审核语义或 claim verification。
- 所有 Windows 搬迁先核对绝对目标在预期项目目录内、目标未碰撞；不清空本地文件。

## Review Focus

1. 旧 Plan.designRef / Map.sourcePath 的存在性与原始 fingerprint：Task 1/2 测试精确 aliases 与 raw SHA。
2. 重复顶层目录与未入库本地资料：Task 2 清单逐文件核对、Task 4 Git ignore 检查。
3. Gold Map 改目录后测试扫描遗漏：Task 3 扫描 samples + 原实验根，保住既有全部样本与计数。
4. 折叠内按钮的真实事件与键盘展开：Task 4 Electron 点击/Return 操作。
5. 搬迁后保存仍跟随当前包，Preview 不引用旧相对资源：Task 4 使用真实持久化样例与便携 HTML。

## Task 1: Exact Repository Paths and Migration Baseline

**Files:** Create scripts/helpers/repository-layout.js, scripts/helpers/repository-layout.json, scripts/test-repository-layout.js, scripts/migrate-repository-layout.js; F22 artifacts。

**Interfaces:** repositoryPath(...parts) returns canonical absolute path; resolveRepositoryPath(...parts) resolves absolute/relative legacy paths; repositoryRelative(...parts) returns canonical root-relative slash path. JSON owns exact files, directory prefixes and protected move list. Migration CLI captures before/after SHA256 into private workspace manifest and publishes only tracked protected-file inventory/aggregate counts.

- [x] Write tests: exact old source/Review/Plan/Map/registry/prompt mappings, absolute old path, unrelated external path unchanged, unknown basename not guessed, segment-boundary prefix (experiments-evil unchanged), mapper input-pure.
- [x] Run new suite red, then implement Node-only resolver and catalog.
- [x] Capture protected tracked hashes plus complete private bundle/tmp/reference inventories; record original experiment unit/feature counts.
- [x] Run resolver suite green and node --check.

## Task 2: Safe Moves and Tool Integration

**Files:** migration tool, all repository-reading scripts, app/main/main.js, package.json, .gitignore; moved samples/prompts/experiments/local data.

**Interfaces:** migrate script checks source/target before each move; target collisions fail; recursive inventories preserve symlinks as links and skip traversal of Git internals; pending journal remains private. verify compares protected data and private before/after manifests. Resume never silently overwrites.

- [x] Configure samples: five sources + five Gold Maps; A Review/Plan/registry/human sample. Keep raw bytes and alias metadata.
- [x] Move five prompts; move unconnected protocol into historical docs. Move experiments as a whole, local bundles/tmp/ref as a whole, retaining their internal relative paths.
- [x] Update filesystem lookups/defaults and old CLI source paths through resolver; default produced metadata uses canonical relative paths. Add samples to Map scanners.
- [x] Preserve original experiment results; update generated index paths only and route new convenience previews to workspace/previews.
- [x] Verify inventories, fingerprints and Git-ignore rules; fail visibly on any missing file or changed protected bytes.
- [x] Run plan/block/map/bundle/source/session tests and old-path CLI probes.

## Task 3: Current Entry and Documentation

**Files:** app/renderer/{index.html,styles.css}; docs/harness/{DESIGN,ARCHITECTURE,INITIALIZATION_CONTRACT}; README, agent, docs/README/decisions; directory READMEs; scripts/{check-doc-links,index-experiments}.js.

**Interfaces:** details#legacy-entry (default closed), unchanged btn-* IDs and preload methods. Doc checker uses explicit repository aliases and scans new roots; historical raw docs remain excluded, existing broken references still fail.

- [x] Restructure start card: short reading description + primary bundle button; default-closed “开发与旧版入口” with Markdown/fixture/Review/Map. Remove disabled Source and obsolete Phase text.
- [x] Update current documentation and directory ownership, prompt consumer table, five sample types, commands and old-path map.
- [x] Preserve original historical records; check their references via catalog, not broad new exclusions.
- [x] Run doc/experiment/harness checks; structural regression rejects bad new or unknown legacy links.

## Task 4: Real Paths, Review and Completion

**Files:** Electron selftest and migration tests, package scripts, F22 feature/index/progress/artifacts.

- [x] Add true start-screen assertions: bundle primary visible, legacy controls hidden, Return opens details and fixture button really works.
- [x] Load moved real bundle, walk Map→Topic→Block→SU/section and independent Evidence; isolated real save path remains inside package. Generate moved portable Preview and render it.
- [x] Execute test:all, selftest, validate, audit, check-overview, doc/experiment/harness and per-file syntax checks. Capture final logs.
- [x] Native independent read-only review of final diff; fix substantive findings and recheck affected cases.
- [x] Verify protected inventories again, complete acceptance/evidence and synchronize passing only after gates; commit reviewable changes.

## Self-review

- [x] Design homepage, five roots, sample grouping, prompts split, raw fingerprints, historical aliases and local data preservation each have a task.
- [x] APIs, ownership and output fields are specified; no runtime semantic bridge or file guessing introduced.
- [x] Five review focus cases have explicit checks.
- [x] Plan uses existing tooling and one private migration journal, not another project management system.
- [x] User completion instruction and preserved Native execution recorded without claiming an unseen plan was user-reviewed.

Execution complete 2026-10-03. Final results and metadata exceptions are recorded in verification-summary.md; real moved existing package is read without altering user review.
