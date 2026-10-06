# F31 Verification

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| TypeScript | Agent独立strict typecheck/build（实施计划登记命令） | yes | 新TS源代码/协议，不迁移旧JS；消费真实编译产物 |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后登记 |
| Tools | source/contract/artifact/validation 工具测试，计划登记确切命令 | yes | 实际文件/对象与校验结果 |
| Bootstrap | Host prepare_run_input与现有registry重建/导出一致性 | yes | 原字节、坐标/hash与run布局；非Agent Tool |
| Boundaries | run隔离、路径/链接/ID/容量、固定字段与namespace | yes | 拒绝越界及零非预期副作用 |
| Parity | 现有 test:plan / test:block / test:map / test:grounding及对应工具比较 | yes | 既有判据未变 |
| Integration | F26真实Runner调用领域工具，Provider为离线受控响应 | yes | 工具结果完整且内部零模型调用 |
| Regression | npm run test:all | yes | 语义/来源/配对基线 |
| Documentation | npm run check:docs；npm run verify:harness | yes | scope和状态一致 |

## Manual paths

- [ ] 交换Inventory/Review合法分支操作顺序均可执行；必要输入缺失则拒绝，不由Host指定固定下一Stage。
- [ ] operation切换的实际请求无禁止的旧语义历史，tool-call/result合法配对；read set覆盖真正发送内容。
- [ ] canonical prompt写权限唯一，旧生成/assembler修改例外须有scope/纯helper/旧消费者回归记录。

- [ ] Host准备两份不同文档的冻结原文/完整hash/确定性registry后才启动Agent；取消、解码错误、来源漂移不启动模型或借旧输入。
- [ ] lifecycle、直接依赖账本及请求read set真实对应；Map变化不会错误使Plan/Block全部失效。

- [ ] 读当前文档 → 提交inventory/Review/Map/Plan/Block → 校验与错误定位。
- [ ] 无效候选不成为通过的产物；失败候选保留，修正版有新版本。
- [ ] 跨run、非法路径/ID和修改人工审核被拒绝；当前产物与旧包保持。
- [ ] 同名Map/Plan SU保持不同空间，未提供的事实不补造。

## Passing evidence

使用真实领域实现验证，不能全部stub；只证明工具与验证边界，不证明真实模型生成质量。保留独立审查、用户边界确认和故障证据。
