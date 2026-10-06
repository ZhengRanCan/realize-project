# F27 Verification

当前只登记，以下为实施要求。

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后登记 |
| Feature | 配置与凭据测试，实施时登记确切命令 | yes | 保存/读回/修改/清除/损坏、存储不可用及敏感字段隔离 |
| System | 真实 Electron 配置操作、重启、配置快照；npm run selftest | yes | 实际 IPC/存储/界面，不以纯函数代替 |
| Regression | npm run test:all | yes | 旧资料包、读取与人工审核回归 |
| Documentation | npm run check:docs；npm run verify:harness | yes | 索引、合同和状态一致 |

## Manual paths

- [ ] 首次打开 → 未配置 → 填写基础字段 → 保存 → 能看清当前模型。
- [ ] 重启 → 配置恢复 → 修改/取消/清除，各自行为正确。
- [ ] 必需字段缺失、凭据存储/读取失败、损坏配置均可理解；不展示完整密钥。
- [ ] 保存/打开配置零模型调用；任务配置快照通过集成边界验证，真实分析组合由 F29 再验。
- [ ] 键盘与窄窗口可用，用户接受配置流程。

## Passing evidence

保留命令结果、必要截图和独立审查，不保存原始密钥或成功校验 txt。未完成产品存储、真实 IPC 与人工验收不得 passing。
