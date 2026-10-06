# F26 Verification

当前仅登记，新增运行时尚未设计完成或实施；真实模型质量在 F33 验证。

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| TypeScript | Agent独立strict typecheck/build（实施计划登记命令） | yes | 新TS源代码/协议，不迁移旧JS；消费真实编译产物 |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后登记 |
| Core | 核心/Provider/Registry/Trace 离线测试，开工计划登记确切命令 | yes | 接口、协议、状态、预算与trace |
| Integration | fake Provider →真实 Runner/Registry → observation →宿主终止策略 | yes | 多轮、未知工具、错参数、文本伪完成、无进展及预算耗尽 |
| Cancellation | 请求/工具中取消、迟到结果、重复调用和工具异常 | yes | 终止后不提交新状态/产物，调用关系闭合 |
| Context | 宿主Policy执行、可信/不可信输入、容量及凭据隔离，Core无Domain依赖 | yes | 序列化请求/trace 的实际边界 |
| Regression | npm run test:all | yes | 原产品/Schema/validator不变 |
| Documentation | npm run check:docs；npm run verify:harness | yes | 合同和状态 |

## Manual paths

- [ ] 从无编译产物状态构建，旧JS调用公共入口/真实离线循环成功；非法协议类型组合和untrusted JSON行为验证分开。

- [ ] 查看一次完整内核工具轨迹，能说明每一步来自哪条请求和结果。
- [ ] text-only/no-tool：宿主接受即停止；第一次拒绝追加host observation继续，默认连续第二次拒绝以no_progress停止，不伪造tool_call_id；取消/预算优先。
- [ ] 工具异常/容量不足/预算耗尽/取消均能定位，不表现为成功。
- [ ] 用户接受小内核边界；不据此声称任意文档分析已完成。

## Passing evidence

记录内核集成、独立审查和用户判断；不运行真实模型作为本项的隐式要求。脚手架目录、接口声明或全 fake 的工具实现不能单独证明 Runner 正确。
