# Design Review

本地 Electron 阅读与设计审阅工具。打开分析资料包，先看框架图，再进入主题、解释区块和出处；需要人工判断的设计决定另行审核。

```bash
npm install
npm start
```

首屏点击“打开分析资料包”，选择 `reading-bundle.json`。Markdown、单独 Review/Map 和测试样本入口保留在默认收起的“开发与旧版入口”中。

首次示例可运行 `npm run bundle:example`，再打开 `workspace/analyses/context-consumption/stage2-gold/reading-bundle.json`。已有目录会拒绝覆盖；导出规则和本地目录说明见 [Workspace](workspace/README.md)。应用阅读与标准验证均离线；生成脚本另需模型凭据。

| 目录 | 用途 |
| --- | --- |
| [docs](docs/README.md) | 项目规范、feature、进度与验收记录 |
| [samples](samples/README.md) | 按文章放在一起的测试原文、Gold、Map 与章节坐标 |
| [prompts](prompts/README.md) | 生成脚本交给模型的五份任务模板 |
| [artifacts/experiments](artifacts/experiments/README.md) | 已有实验的请求、生成结果、报告与归属索引 |
| [workspace](workspace/README.md) | 本地分析资料包、临时输出、预览、参考资料与人工审核 |

当前进度见 [Dashboard](docs/progress.md)，开发任务路由见 [agent.md](agent.md)。Reading 语义见 [认知契约](docs/specs/reading-view-cognitive-contract.md)。框架图按文档中的关系展开，what → how → prove → boundary 是解释区块的阅读视角。

```bash
npm run test:all
npm run validate
npm run audit
npm run check-overview
npm run selftest
npm run verify:harness
```

完整环境说明见 [Initialization](docs/harness/INITIALIZATION_CONTRACT.md)。F22 前的操作背景保存在 [历史 README](docs/log/artifacts/mvp-phase1/README-before-F22.md)。
