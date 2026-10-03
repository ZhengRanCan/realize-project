# F22 Verification Summary

Date: 2026-10-03. Status: implemented and verified.

用户批准分类与首页折叠设计，随后要求“完成F22”；沿用 Native 实施和独立审查。以下用户路径由真实 Electron 自动化覆盖，不声称用户已手工点击验收。

## Result

首屏突出资料包，旧开发入口默认折叠，Return 可展开且 fixture 实际按钮可加载。五篇文章及 Gold/Map/registry 按文章归入 samples；五份提示词进入 prompts，旧协议进入历史 notes；实验进入 artifacts/experiments，本地数据进入 workspace。当前文档与命令已更新。

历史 Plan、Generated、prompt、原文等保持原字节，已有包的内部相对路径保持。集中路径表仅兼容已知仓库位置，不参与 bundle 内部 containment。旧根目录人工审核继续原位使用，新旧入口审核才进入 workspace/legacy-review。

## Commands and paths

| Check | Result | Evidence |
| --- | --- | --- |
| node --check | 48 changed/new modules passed | [Static](static.txt) |
| node scripts/test-repository-layout.js --migrated | exact aliases, prefix boundaries, foreign cwd, old CLI options, Git-ignore, journal interruption/resume/collision and legacy review passed | included in test:all |
| npm run test:all | exit 0; validators, generators with stub, Reading/source/bundle/session/save and portable Preview passed | [Full regression](test-all.txt) |
| npm run validate | Schema and consistency PASSED | [Validate](validate.txt) |
| npm run audit | PASSED; all source sections and Decisions covered | [Audit](audit.txt) |
| npm run check-overview | PASS WITH WARNINGS, 87/87 SU, 151/151 provenance; existing density/duplicate warnings retained | [Overview](check-overview.txt) |
| npm run selftest | SELFTEST PASSED; default fold/keyboard/fixture, moved existing package Map→Topic→Block→SU/section + independent Evidence, package human path/no autosave, full isolation/save suite | [Electron](selftest.txt) |
| moved real package Preview | exported HTML moved again; real Electron default Map, SU/section, KnowledgeState and read-only save passed | [Preview](preview.txt) |
| migration SHA256 | 10,695 inventoried entries; 10,570 immutable entries match; 333 protected tracked files; private materials remain local | [Migration](migration-integrity.json) |
| experiment ownership | 66 units + 17 artifacts and perFeature unchanged against a54a7d5 | [Ownership](experiment-ownership.txt) |
| docs / experiment / harness | final gates passed | [Final gates](final-gates.txt) |
| independent native review | no remaining P1/P2 after repairs | [Review](subagent-review.md) |

125 inventoried README/index entries are allowed metadata exceptions; raw files remain protected. Git internals were not traversed. The private per-file local journal is ignored; public report includes only previously tracked protected hashes and aggregate counts. No local analysis, reference or temporary content is committed.

## Compatibility notes

New convenience previews use workspace/previews, and new test output uses workspace/tmp/tests to preserve migrated local temporary files. Historical HTML is retained as evidence, with fresh portable Preview used for current reading. Raw source/prompt bodies are hash-protected data; their historical prose is not current documentation authority. Prompt consumers are listed in prompts/README.md.

See [Layout design](layout-design.md), [implementation plan](implementation-plan.md), and [first screen](start-screen.png). F19–F21 remain unstarted.
