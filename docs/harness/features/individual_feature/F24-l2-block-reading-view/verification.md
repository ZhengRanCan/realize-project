# F24 Verification

## Required commands

本轮只登记合同。下列新增测试目标需实现并接入后才可执行和登记结果。

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 对修改/新增 JS 逐个 node --check；git diff --check | yes | 静态检查结果 |
| Projection | node scripts/test-reading-runtime.js；node scripts/test-reading-integration.js | yes | identity、authority、缺失、coverage 纯度 |
| View | 新增界面结构测试，接入 test:all 后执行 | yes after implementation | 当前 subject 完整、其他主体未渲染、原始 fragment/source 保持 |
| System | npm run selftest，接入 test-l2-block-view-electron.js | yes | 实际 L1/L2/L3、Explore/Resolve/Back、焦点/session |
| Preview | npm run test:all（含搬迁资料包的真实 Preview） | yes | 新旧适用范围明确，共用实现、只读不保存 |
| Compatibility | npm run validate / npm run audit / npm run check-overview | yes | 数据语义与 verdict 保持 |
| Documentation | npm run check:docs / npm run verify:harness | yes | 合同/索引/状态一致 |
| Human | 用户检查实际 L2 代表性表达 | yes | 日期、输入和明确的可理解性判断 |

## User paths

- [ ] L0 → L1“生成链路与消费点”→ O-04：只见当前解释单元，展示已有表达；不跳到整篇总览中。
- [ ] 流程、对照、矩阵等公共表达样本：内容完整、长文本可披露、当前阅读范围清晰，缺数据诚实说明。
- [ ] 查 Block 出处、查 fragment 出处、打开原文并逐层返回；恢复原 L2 和 L1 现场。
- [ ] Explore → 在阅读中打开 Block → 同一独立 L2 → 返回 Explore → 返回原阅读现场。
- [ ] 有效 Plan Block 缺 Generated/缺单块表达、无 Topic occurrence、Known(0) 等路径不造内容、不丢身份。
- [ ] 640×720、Tab/Enter/Space/Esc、延迟 Source/session 切换、搬迁 Preview、只读和无自动保存通过。
- [ ] 用户对实际独立 L2 的范围与视觉解释给出验收判断。

## Passing evidence

- 验证单 Block 的实际 DOM 身份集合和可见内容，不把“scrollIntoView 成功”当成独立 L2。
- 数据完整性继续用全量投影测试保护；旧 Overview 测试只说明旧 Overview 的兼容性，不能证明新页可读。
- 记录实际截图与输入/窗口、自动化结果、独立审查和用户判断；successful txt 不长期保留。
- humanReviewRequired 与 knownUnverified 只有实际要求满足后才清空；登记阶段的 docs/harness 通过不代表 feature 完成。
