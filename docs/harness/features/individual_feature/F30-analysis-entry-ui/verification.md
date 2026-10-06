# F30 Verification

当前仅登记，真实界面设计和验证在 F29 跑通后进行。

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后登记 |
| Feature | 入口 UI 状态/交互测试，实施时登记确切命令 | yes | 首次/再次使用与各任务状态 |
| System | npm run selftest；真实入口的键盘和640×720窗口路径 | yes | 焦点、标签、错误反馈及完整操作 |
| Regression | npm run test:all | yes | 配置/输入/任务及旧资料包导航保持 |
| Visual | 真实各入口状态截图，按确认设计检查 | yes | 真实任务与长文件名/错误文案，非mock成功截图 |
| Documentation | npm run check:docs；npm run verify:harness | yes | DESIGN、合同和证据同步 |

## Manual paths

- [ ] 首次打开且未配置 → 知道下一步 → 配置模型 → 选文档 → 开始 → 看到结果。
- [ ] 再次打开且已配置 → 明确当前模型 → 选新文档，流程无需重复填配置。
- [ ] 分析中、取消、失败、部分完成和完成状态 → 用户能判断发生了什么及下一步。
- [ ] Tab/Enter/Space、焦点恢复及窄窗口操作通过，长文件名和错误文案不遮住主动作。
- [ ] 打开已有资料包/旧入口仍可达，解释页顶部与各层行为保持。

## Passing evidence

基于已运行的 F29 链路验收，不用美化 Demo 代替完整入口。记录真实截图、用户判断与独立审查；自动化通过不替代第一次使用时的可理解性判断。
