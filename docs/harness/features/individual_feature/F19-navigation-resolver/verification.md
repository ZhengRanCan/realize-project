# F19 Verification

## Required commands

| Layer | Command | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改/新增 JS 各自 `node --check <file>` | yes | 退出码 0 |
| Feature | `node scripts/test-reading-navigation.js` | yes | 地址、栈、resolver 隔离断言通过 |
| Regression | `npm run test:all` | yes | 离线 suite 与搬迁 Preview 通过 |
| System | `npm run selftest` | yes | 真实 DOM、键盘、连续返回、session 隔离通过 |
| Preview | `npm run verify-preview` | yes | 共用 renderer 实测通过 |
| Input | `npm run validate` / `npm run audit` / `npm run check-overview` | yes | 既有 warnings 保留，无新增 failure |
| Docs | `npm run check:docs` / `npm run check:experiments` | yes | 无失效链接或索引漂移 |
| Harness | `npm run verify:harness` | yes | 0 errors |

## Structural assertions

- Back 不增加 resolver 调用次数；frame 深拷贝，外部修改不能改变已入栈现场。
- 类型化引用、未知/unsupported 拒绝、重复 occurrence、Known(0)、Unknown、无 Map、无 Generated、attachment-only Element。
- session 切换拒绝旧地址；失败不压栈，空栈不跳页；fragment 不创建持久 anchor。

## Product paths (real Electron; automated integration accepted)

- [x] Map 选中/滚动 → Topic occurrence（优先 T-05）→ Block → fragment 出处 → 逐层返回，恢复选中、disclosure、展开、滚动与焦点。
- [x] 从 occurrence 定位另一 Element/Block → Back，回原现场，resolver 不重复调用。
- [x] Element 落点唯一且可见，含 attachment-only；Known(0)/缺生成 Block 可打开。
- [x] Topic/SU/Review/Evidence/fragment 定位拒绝，不改变页面与历史。
- [x] L3 请求期间返回/换包，旧回复不重开面板；失败/取消保留现场，成功换包清空历史。
- [x] 搬迁 Preview 重走导航/定位；无外部目录依赖、无自动保存、无模型调用。
- [x] 旧单文件入口与显式审核保存回归通过。

## F20 owns the combined path

真实 Reading → Explore → Open in Reading → Back to Reading 在 F20 的实际页面验证。
F19 仅验收共享动作；测试入口不冒充 Explore。该分工不属于 F19 未验收项，F19 自身遗漏仍须如实保留。

## Passing evidence

命令日期/结果与关键 UI 证据写入 F19 verification-summary；独立审查记录到 subagent-review。
acceptance 与路径全部完成后同步合同/index/dashboard/对应 enforcement cell。
passing 前 knownUnverified / humanReviewRequired 为空；注明自动化实测，不声称用户手工操作。
