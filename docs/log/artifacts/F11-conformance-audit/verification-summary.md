# F11 verification summary

> 当前补充：Node/npm/Electron 与 Git 元数据已恢复；下文旧失败输出为历史证据。F11 仍待人工复核/验收。最新标准命令见末尾“环境恢复复验”。

2026-09-29。只读审计，独立代码审查 not_required（未修改代码）。

交付：results/conformance-audit.md（本目录）、results/epistemic-sites.md 与 JSON 逐站数据。
只读探针及实际输出：read-only-probes.md、probe-output.txt（本目录）。

人工 reviewer 三条抽样与用户验收未完成；F11 标 blocked，不标 passing。
当前工作目录没有 .git，git status 原始输出：

```text
fatal: not a git repository (or any of the parent directories): .git
```

verification.md 要求 scripts 目录新增报告校验器，与只读 scope/用户指令冲突；本轮使用临时只读命令校验报告，未新增代码文件，不把它冒充原合同要求已完成。
未修改 renderer/app，所以 selftest 非本轮必跑；尚未运行 GUI 人工验证。

## 文件级交付

- results/conformance-audit.md：29 个 invariant、六问、Decisions、五项确证 divergence、保护清单和无边界清单。
- results/epistemic-sites.md 与 results/epistemic-sites.json：9 个边界文件的 269 个匹配逐项裁定，仅一个确证 S1 backlog。
- read-only-probes.md：可重跑的内存结构探针、报告结构校验；没有新增 scripts 文件。
- probe-output.txt、report-validation-output.txt、direct-test-results.json 与以下日志：本轮原始证据。
- feature index / F11 feature.md / dashboard：先同步 active，交付后同步 blocked，dependsOn 与 code/tests scope 仍为空。

## npm 门禁原始失败

以下三条命令均 exit 1，发生在 npm 启动阶段，测试脚本尚未执行：

```text
npm run verify:harness
npm run check:docs
npm run test:all

Error: Cannot find module './definitions.js'
Require stack:
- E:\nodejs\node_modules\npm\node_modules\@npmcli\config\lib\definitions\index.js
- E:\nodejs\node_modules\npm\bin\npm-prefix.js
```

完整原始输出：[harness](npm-harness-output.txt)、[docs](npm-docs-output.txt)、[test:all](test-all-output.txt)。
没有修复系统 npm、安装依赖或绕过代理；没有声称 npm 门禁全绿。

## 直接 Node 执行（与 npm 失败分开记）

按 package.json 中 test:all 的顺序运行全部十个组成脚本，无改参数；index-experiments 保留 --check。每项 exit 0。
该执行不添加新的测试实现、不调用模型；测试输出只在测试自己的 tmp 目录产生。

| 命令 | 原始结果行 | 完整原始日志 |
|---|---|---|
| node scripts/test-check-plan.js | 结果：PASSED —— 22 个用例全部通过 | [log](direct-test-check-plan.js.txt) |
| node scripts/test-check-block.js | 结果：PASSED —— 31 个用例全部通过 | [log](direct-test-check-block.js.txt) |
| node scripts/test-check-map.js | ===== 29 passed, 0 failed ===== | [log](direct-test-check-map.js.txt) |
| node scripts/test-generate-framework-map.js | Gateway 安全验证: 33/33 通过 | [log](direct-test-generate-framework-map.js.txt) |
| node scripts/test-semantic-grounding.js | F10 两阶段安全验证: 48/48 通过 | [log](direct-test-semantic-grounding.js.txt) |
| node scripts/test-l0-view-model.js | View Model 回归: 34/34 通过（覆盖 28 份 map） | [log](direct-test-l0-view-model.js.txt) |
| node scripts/test-l0-layout.js | L0 Layout 回归: 42/42 通过（覆盖 28 份 map，其中逐份矩阵 28/28） | [log](direct-test-l0-layout.js.txt) |
| node scripts/test-l0-preview.js | L0 预览验收: 130/130 通过（7 份预览） | [log](direct-test-l0-preview.js.txt) |
| node scripts/check-doc-links.js | Doc links: 108 markdown files checked, 0 broken. | [log](final-check-doc-links.js.txt) |
| node scripts/index-experiments.js --check | experiments index: 66 units + 17 artifacts, up to date. | [log](direct-index-experiments.js.txt) |

Harness 直接执行原始输出（exit 0）：

```text
Harness gate: 20 features, 0 errors.
```

[完整 harness 输出](final-harness-gate.mjs.txt)。这些结果不证明五项 divergence 已修复。

## 本轮新增只读检查输出

```text
Audit structure: 29 invariants + 6 starting questions; legal statuses and nonempty evidence.
Site coverage: 269 occurrences; 1 confirmed collapse.
Evidence locations: 126 file:line references resolve.
Protected runtime files changed: []
```

runtime-baseline.json（本目录）记录门禁前 app/scripts/schema/fixtures/experiments 共 373 个文件哈希；门禁后逐文件复核未变。
未以字符串匹配作为 S1 等语义性质断言：P1 看 own-property 与数组值，P2 比较 ID/edge，P6 比较 missing 集合与主体有无，P7 比较固定字段。
报告结构检查本身是文档语法检查，不冒充产品行为测试。

## 下一步 / 未关闭项

1. Reviewer 按报告任抽 3 条独立复核，并确认未把 Not Implemented / Capability Absent 变成功能待办；记录用户验收。
2. 明确 verification.md 的新增脚本要求如何与只读合同统一；当前仅交付临时文档内校验命令。
3. 在具备 Git 元数据、npm 可用的 checkout 中重跑标准门禁，按默认代理配置独立 commit / push。本目录未提交、未推送。
4. F11 关闭后才进入 F12；先有失败测试，只修确证 S1 divergence，保持既有守卫。

自查：本轮没有修改实现；没有重构已正确机制；没有通过新增状态码或默认值合并 Unknown/Missing/Absent/Indeterminate。

## 环境恢复复验（2026-09-29）

- Node v24.21.0；npm 11.19.0；Electron 31.7.7。使用已安装的系统 Node/npm，不再用直接 Node 代替 npm 门禁。
- 项目目录 C:/Users/ASUS/Desktop/realize-project，已补回真实 Git 历史；分支 codex/f11-f21-conformance 跟踪同名 origin。恢复前后 603 文件哈希未变。
- 已确认本机 Clash 7897；项目级 Git 配置使用该代理，不清空/绕过代理。
- verification.md 的新增脚本要求已依用户只读指令统一为运行现有文档内校验；code/tests scope 与 dependsOn 仍为空。
- 原始输出：[npm test:all](environment-test-all.txt)、[Electron selftest](environment-selftest.txt)、[harness](environment-harness.txt)、[docs](environment-docs.txt)、[报告校验](environment-report-validation.txt)。
- test:all exit 0（22/31/29/33/48/34/42/130）；selftest exit 0，原始末行 SELFTEST PASSED。
- 环境与规则冲突不再作为 F11 knownUnverified；人工复核/用户验收尚未记录，状态仍 blocked。
