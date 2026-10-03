# F19 Verification Summary

2026-10-03。用户批准范围修正并授权自主完成 F19–F21；Native 实施及独立审查完成。

| 检查 | 结果 |
| --- | --- |
| 9 个修改/新增 JS 的 node --check | passed |
| test-reading-navigation | passed：类型化 resolver、anchor、frame 副本、session/空栈 |
| npm run test:all | passed：全部离线 suite、搬迁 portable Preview真实路径 |
| npm run selftest | SELFTEST PASSED：真实 Map/Topic/Block/L3、Back/Resolve、selection/disclosure/scroll/focus、迟到回复与保存隔离 |
| npm run verify-preview | VERIFY PREVIEW PASSED：无 Map 的独立 Block fixed landing与Back隔离 |
| npm run validate / audit | PASSED |
| npm run check-overview | PASS WITH WARNINGS：87/87 SU、151/151 provenance；原重复/密度 warning，无failure |
| npm run check:docs / check:experiments | 由 test:all执行通过；实验66 units+17 artifacts未漂移 |
| npm run verify:harness | 21 features / 0 errors，passing metadata更新后再次检查 |

## Product evidence

scripts/test-reading-navigation-electron.js 通过真实Electron控件和IPC自动执行用户路径；不是用户手工验收。
连续返回恢复具体Topic occurrence、展开、Map selection、disclosure、滚动、键盘焦点；Element/attachment anchor唯一可见。
Known(0)/未提供Generated/无Map的实际导出包仍能打开固定Block。unsupported实体不新增landing。
失败/取消加载保留历史，成功切换清空；inspection迟到、Back恢复source迟到不改新现场；无自动保存。
共用renderer的便携HTML搬迁后重走关键路径，旧Review/Map与显式保存回归通过。
独立审查4个P2已修正，详见[subagent-review](subagent-review.md)。

Explore真实组合路径归F20，不把F19公开测试入口称为Explore页面。成功检查未新增txt日志。
