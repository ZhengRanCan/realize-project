# F25 Verification

## Required commands

当前 passing：实现、技术验证、独立审查和用户本轮实际试读反馈闭环。以下技术命令已执行；本轮 Human 收口记录在 F25 verification-summary。

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 逐文件静态检查 |
| Feature | scripts/test-l0-orientation*.js / test-reading-explanation*.js 创建后接入 test:all | yes after implementation | 解释来源与绑定、完整身份/关系、缺失/不匹配/漂移、确定性与输入纯度 |
| Compatibility | npm run validate / audit / check-overview；受影响 check-map/schema 回归 | yes | 既有输入 verdict 与兼容策略；不放宽语义校验 |
| System | npm run selftest，加入真实 L0 导读路径 | yes | 实际加载、节点/关系解释、Topic 选择、返回与 Source |
| Preview | npm run test:all，覆盖搬迁只读 Preview | yes | 同一 renderer/解释规则、旧包/独立 Map/缺解释输入 |
| Interaction | 原生键盘、640×720、长解释和会话切换 | yes | 可见/可操作、披露不丢信息、焦点/滚动恢复 |
| Documents | npm run check:docs / verify:harness | yes | 合同与索引/状态、文档引用一致 |
| Human | 用户实际试读反馈及唯一问题闭环；两类原文忠实性由依据核对与独立审查保障 | yes | 2026-10-05 用户确认本轮目前只有连接解释位置问题；按确认方案修复 |

## 补充诊断方法（非本轮额外口述门禁）

- [ ] 打开 context-consumption，先说明本文讨论的问题及范围，再用自己的话解释主要对象如何连接。
- [ ] 点击一个此前陌生的对象和一条关系，说明新增解释帮助理解了什么；能回到相应依据核对。
- [ ] 面对 Topic 入口，说明每个代表性主题回答的问题，并选择能继续解决当前疑问的入口。
- [ ] 一篇不同类型的公共文章同样可读，不强制使用同一流程主轴或固定四阶段全文。
- [ ] 独立 Map / 旧包 / 缺解释资料不编造解释；错误绑定/漂移不出现成功原文或已核实标识。
- [ ] Topic → L1 → Back 保留原 L0 现场；便携 Preview、键盘和窄窗口同样可用。

## Passing evidence

实现前确认具体设计与解释数据所有权。实现后记录命令、输入、关键截图、依据核对、独立审查和用户实际判断。功能测试必须检查解释内容与真实来源/身份对应，不能只有字符串、按钮数或导航成功断言。技术门禁与阅读理解验收分开；未被用户实际验收前，不清空 humanReviewRequired 或标 passing。


技术路径已由真实 Electron/搬迁 Preview 和父代理截图核对；上述 Manual paths 中涉及实际理解的项目保持未勾选，不能用自动化代替用户。增强包和两篇预览的明确位置见 [verification summary](../../../../log/artifacts/F25-l0-document-orientation/verification-summary.md)。


2026-10-05 收口：依据用户“关于F25，我目前应该只有这个问题”及唯一已批准反馈修复结束本轮验收。上面口述诊断条目未逐项执行，不勾选或伪造其结果；它们不再作为额外要求用户重复确认的关闭门槛。
