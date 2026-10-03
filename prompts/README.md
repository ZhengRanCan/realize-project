# Model Prompts

这里放生成脚本发送给大模型的任务说明模板。文章是输入材料，prompt 规定如何分析以及输出什么结构，JSON 是模型产物。
Electron 打开已有分析资料包时不执行这些模板。

| Template | Actual consumer | Task |
| --- | --- | --- |
| stage1-plan.prompt.md | scripts/ai-plan.js | 规划语义单元与解释区块 |
| stage2-blocks.prompt.md | scripts/ai-block.js | 按既定 Plan 生成逐块表达 |
| framework-map-generation.prompt.md | scripts/generate-framework-map.js | 直接生成框架图 |
| semantic-inventory.prompt.md | scripts/run-semantic-grounding.js | 两步路线的第一步：提取语义 |
| framework-map-synthesis.prompt.md | scripts/run-semantic-grounding.js | 两步路线的第二步：生成框架图与选择结果 |

两种框架图生成路线各有实际消费者，保留其差别。模板从 ai 迁入后保持正文和指纹，部分原始导读仍记录历史阶段或设想脚本；
当前消费者以本表及代码为准。目录 README 的引用参与文档检查，模板原始内容由迁移哈希保护。

未接入的旧协议在 `docs/notes/legacy/analysis-protocol.phase2.md`，属于历史设计草稿。
只有显式运行生成命令才会调用模型；标准测试使用 stub，整理和阅读资料包不调用模型。
