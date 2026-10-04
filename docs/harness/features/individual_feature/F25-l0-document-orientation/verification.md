# F25 Verification

## Required commands

当前仅登记合同：执行 check:docs、verify:harness 和 git diff --check。下列功能检查用于设计确认后的实施阶段；新测试文件是允许的目标，不声称已创建或执行。

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 逐文件静态检查 |
| Feature | scripts/test-l0-orientation*.js / test-reading-explanation*.js 创建后接入 test:all | yes after implementation | 解释来源与绑定、完整身份/关系、缺失/不匹配/漂移、确定性与输入纯度 |
| Compatibility | npm run validate / audit / check-overview；受影响 check-map/schema 回归 | yes | 既有输入 verdict 与兼容策略；不放宽语义校验 |
| System | npm run selftest，加入真实 L0 导读路径 | yes | 实际加载、节点/关系解释、Topic 选择、返回与 Source |
| Preview | npm run test:all，覆盖搬迁只读 Preview | yes | 同一 renderer/解释规则、旧包/独立 Map/缺解释输入 |
| Interaction | 原生键盘、640×720、长解释和会话切换 | yes | 可见/可操作、披露不丢信息、焦点/滚动恢复 |
| Documents | npm run check:docs / verify:harness | yes | 合同与索引/状态、文档引用一致 |
| Human | 两类公开文章的实际阅读与原文对照 | yes | 可复述的含义与选择理由；不是仅问图是否好看 |

## Manual paths

- [ ] 打开 context-consumption，先说明本文讨论的问题及范围，再用自己的话解释主要对象如何连接。
- [ ] 点击一个此前陌生的对象和一条关系，说明新增解释帮助理解了什么；能回到相应依据核对。
- [ ] 面对 Topic 入口，说明每个代表性主题回答的问题，并选择能继续解决当前疑问的入口。
- [ ] 一篇不同类型的公共文章同样可读，不强制使用同一流程主轴或固定四阶段全文。
- [ ] 独立 Map / 旧包 / 缺解释资料不编造解释；错误绑定/漂移不出现成功原文或已核实标识。
- [ ] Topic → L1 → Back 保留原 L0 现场；便携 Preview、键盘和窄窗口同样可用。

## Passing evidence

实现前确认具体设计与解释数据所有权。实现后记录命令、输入、关键截图、依据核对、独立审查和用户实际判断。功能测试必须检查解释内容与真实来源/身份对应，不能只有字符串、按钮数或导航成功断言。技术门禁与阅读理解验收分开；未被用户实际验收前，不清空 humanReviewRequired 或标 passing。
