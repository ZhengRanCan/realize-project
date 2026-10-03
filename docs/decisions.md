# Decisions

记录会影响多个 feature、长期难以逆转的产品或工程决策。

## Template

### YYYY-MM-DD — Decision title

- Context:
- Decision:
- Consequences:
- Revisit when:

---

### 2026-09-27 — 接入 harness 模板，并把 `docs/` 与 `experiments/` 规范化

- Context: `docs/` 里同时存在 harness 接入前的 feature 目录（`README.md` + `execution-prompt.md` +
  `validation-checklist.md` + `results/`）、散落在根目录的规格与讲稿、以及和 `experiments/` 职责重复的报告目录；
  没有 feature registry、没有 dashboard、没有可执行的门禁。
- Decision: 以 `harness-template` 为准接入 harness：
  - 核心文档放 `docs/harness/`（PRODUCT_SPEC / CONSTRAINTS / ARCHITECTURE / DESIGN / INITIALIZATION_CONTRACT）；
  - feature 合同放 `docs/harness/features/individual_feature/Fxx-<slug>/{feature.md,verification.md}`，
    索引为 `feature-index.json`；
  - 证据与历史材料放 `docs/log/artifacts/Fxx-<slug>/`（只把原 `README.md` 改名为 `brief.md`，其余文件名不变）；
  - 参考规格移到 `docs/specs/`，讨论材料移到 `docs/notes/`，实验报告并入 `experiments/reports/`；
  - 门禁为 `npm run verify:harness`（`scripts/harness-gate.mjs`）。
- Consequences: 代码与校验器里所有指向旧路径的引用已同步更新；历史命令输出与 `run-meta.json` **保持原样**，
  旧路径与新路径的映射写在 `docs/README.md` 的 Path mapping 一节。
- Revisit when: 需要多文档对比（`document set`）或引入第二个 harness 时。

### 2026-09-27 — 历史 feature 的状态映射与 `dependsOn` 口径

- Context: F01–F10 在 harness 接入之前就已按用户裁决顺序推进。真实状态是：01 / 03 / 09 已由用户验收；
  04–08、10 执行完成但没有验收记录（F10 的 gate 明确是 PARTIAL PASS）。
  若把真实流程顺序写进 `dependsOn`，gate 会因为"F06 未 `passing`"而必然报错。
- Decision:
  - `passing`：F01、F03、F09（有用户验收记录）。F01 的 `lastVerifiedAt` 取命令输出日期 2026-09-26。
  - `active`：F08（真实进行中，且是唯一的 active）。其 `dependsOn` 为空，前置写在 `Process preconditions`。
  - `blocked`：F04、F05、F06、F07、F10，各自在 `completionGate.humanReviewRequired` /
    `knownUnverified` 里逐条写清卡点。
  - `dependsOn` 只登记 **harness 强制前置**（父 feature 必须 `passing`）；流程顺序写进合同正文。
- Consequences: gate 可以长期保持绿色且不掩盖真实缺口；代价是"流程先后"不能被机器检查。
  一旦 F06 获得验收，应把 F09 / F08 的前置改成 `dependsOn: ["F06"]`。
- Revisit when: F04 / F05 / F06 取得用户验收，或用户决定把 PARTIAL PASS 转为已知限制。

### 2026-09-27 — `experiments/` 原地保留，只补索引

- Context: `experiments/` 有 300+ 个 run 产物，是逐 run 的实验证据；把它们搬进 `docs/log/artifacts/`
  会产生大量路径改动，并削弱"每次 run 一个独立目录、失败痕迹必须保留"的实验纪律。
- Decision: 目录结构不动，新增 `experiments/README.md` 作为索引（说明每个 run 目录属于哪个 feature / stage、
  产物含义与复现命令），并由对应 feature 的证据文件引用；`docs/experiments/*.md` 的报告合并进 `experiments/reports/`。
- Consequences: 仓库里只有一个 experiments 概念；`docs/log/artifacts/` 保持"耐久证据"定位，不承载大体积产物。
- Revisit when: 需要把实验产物移出版本控制，或引入外部产物存储。

### 2026-09-27 — `docs/source-sections.json` 保留在 `docs/` 根目录

- Context: 它是 `npm run source` 生成的运行时数据，但 `app/main/main.js` 与
  `scripts/{check-plan,check-block,check-overview,check-map,compare-stage2,build-preview,ai-plan,ai-block,full-run-report,backfill-overview-plan,test-check-block}.js`
  都按 `docs/source-sections.json` 硬编码读取。
- Decision: 不迁移该文件。它是"docs 根目录只放索引类文档"规则的**唯一显式例外**，并在 `docs/README.md` 与
  `docs/harness/ARCHITECTURE.md` 中登记原因。
- Consequences: 规范化没有触及模型调用链与校验链的输入路径，`npm run test:all` 的行为不变。
- Revisit when: 有人愿意把该路径抽成单一常量并统一所有读写方。

## 2026-10-03 — F22 repository locations

用户批准按用途分区并按文章归拢配套资料。当前默认目录改为 samples、prompts、artifacts/experiments、workspace；该位置决策更新此前“实验留在原目录”的约定。历史请求、Plan、Generated、原文、提示词与人工审核保持内容，路径字段通过集中明确映射读取。新测试输出进入 workspace/tmp/tests，避免覆盖迁移保留的临时材料。首页以资料包为主入口，旧开发入口默认折叠。
