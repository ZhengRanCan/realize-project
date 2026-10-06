# F28 Verification

当前只登记，不运行分析或文档选择实现测试。

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后登记 |
| Feature | 文档输入/入口测试，实施时登记确切命令 | yes | 有效输入、取消/更换、无效文件及快照一致性 |
| System | Electron 文件对话框/IPC/入口；npm run selftest | yes | 实际选择路径、模型确认及回到配置 |
| Regression | npm run test:all | yes | 原包入口、session、审核保持 |
| Documentation | npm run check:docs；npm run verify:harness | yes | 合同/索引/状态一致 |

## Manual paths

- [ ] 未配置模型 → 配置 → 回到入口 → 选择一篇自己的 Markdown 文档。
- [ ] 选择/取消/更换文件 → 展示与实际选择一致，取消保留有效选择。
- [ ] 空文件、不可读、不支持和容量限制错误能理解并重新选择。
- [ ] 文档选取后变更磁盘内容 → 按约定快照/重新确认策略处理，来源不会串用。
- [ ] 已打开旧结果时准备新文档 → 旧结果和审核不变；键盘/窄窗口可用。

## Passing evidence

真实文件选择和输入交接通过，不以模拟“分析完成”充当证据。用户入口判断、独立审查与回归记录齐全；F29 另验模型生成和结果打开。
