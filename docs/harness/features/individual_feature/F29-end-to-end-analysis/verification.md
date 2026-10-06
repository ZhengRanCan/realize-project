# F29 Verification

当前仅登记。真实模型运行范围在实施设计后明确，标准测试保持离线。

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后登记 |
| Feature | 分析任务/生产与状态测试，实施时登记确切命令 | yes | 阶段输出/校验/取消/并发/重试边界 |
| Faults | 离线传输、截断、JSON/Schema/语义、引用、部分失败及迟到回复注入 | yes | 全部状态和旧 session/审核保护 |
| Live | 实际产品分析一份非 Gold 文档，记录模型/输入与当次输出 | yes | 无人工配套输出，完整包/来源/质量抽查 |
| System | npm run selftest；实际 Electron 完整入口至结果 | yes | L0/L1/L2/核查/返回及失败路径 |
| Preview | 搬迁当次结果包并打开共用 Preview | yes | 显式配对、内容/来源/只读行为 |
| Regression | npm run test:all | yes | 现有验证链、导航与保存保护 |
| Documentation | npm run check:docs；npm run verify:harness | yes | 合同和证据一致 |

## Manual paths

- [ ] 已保存 AI 配置 → 选择自己的文档 → 开始 → 真实阶段状态 → 完整 L0/L1/L2 → 核查来源。
- [ ] 分析前/期间设置更改或原文件变化 → 本次输入/模型保持启动时快照。
- [ ] 无效凭据、网络超时、模型格式错误和部分阶段失败 → 原因与后续动作清楚，不假成功。
- [ ] 取消、重复启动、有限重试或迟到回复 → 当前任务、旧结果及人工审核正确保留。
- [ ] 完成结果可移动/重开，来源和 Review 配对一致；用户接受真实完整链路。

## Passing evidence

离线通过不代替真实模型生成；只生成 Map 或只打开 Gold 包不等于完成。结构验证、内容抽查、任务状态、用户实际路径与独立审查分开记录；保留必要失败证据，不保存成功校验 txt 或密钥。
