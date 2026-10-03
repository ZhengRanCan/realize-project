# F23 Verification

## Required commands

登记阶段只执行文档/harness 检查。下列实现测试文件是本合同允许新增的目标，创建并接入 suite 后才执行，不声称现在已经存在或通过。

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 对修改/新增 JS 逐个 node --check；git diff --check | yes | 静态检查结果 |
| Projection | node scripts/test-l1-topic-projection.js | yes | membership、边界分类、三态、纯度 |
| View | 新增界面结构测试，接入 test:all 后执行 | yes after implementation | 完整 identity/edge 集合、内外端点、方向及退化；不能只查字符串 |
| System | npm run selftest，接入 test-l1-boundary-view-electron.js | yes | 实际 Topic 入口、图几何可见/可操作、返回与键盘 |
| Preview | npm run test:all（含搬迁资料包的真实 Preview） | yes | 共用 renderer；只读及退化一致 |
| Compatibility | npm run validate / npm run audit / npm run check-overview | yes | 既有数据 verdict 保持 |
| Documentation | npm run check:docs / npm run verify:harness | yes | 合同/索引/状态一致 |
| Human | 用户检查实际 L1 图与退化界面 | yes | 日期、输入和用户判断，不替换为 agent 截图判断 |

## User paths

- [ ] context-consumption 的“生成链路与消费点”：点 Topic 后看到局部连接图及相关区块入口，而非仅文字列表。
- [ ] 公共样本或有依据的边界测试输入：internal = 0、crossing 非空时显示外部连接；无关系时明确 summary，Inside = ∅ 不补成员。
- [ ] 多 Topic 和 relates-to：身份不变，无独占归属，无方向升级；展开外部 stub 可见真实 ID。
- [ ] 独立 Map 不带 Plan：L1 可读，缺少配套区块的入口不可执行且说明原因；未知关联与明确无关联不同。
- [ ] 窄窗口、键盘、逐层返回、session 切换、可搬迁 Preview 均通过，人工审核不自动写入。
- [ ] 用户确认图能回答“内部怎么连接、怎样接入外部”，记录明确验收结论。

## Passing evidence

- 实现前记录展示设计；自动化检查实际图形可见性、边界端点、关系完整性，不仅确认投影存在或能点入页面。
- 实现后将命令结果、关键截图和人工判断记入本 feature 的 verification-summary；截图需写明输入、窗口和路径。
- 代码独立审查发现项处理完毕；humanReviewRequired 不因自动化通过而清空。
- 只有验收和必跑检查通过才关闭 knownUnverified、同步 F17 复核结论和 F23 passing。
