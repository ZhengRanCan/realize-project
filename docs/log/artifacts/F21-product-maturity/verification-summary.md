# F21 Verification Summary

2026-10-03，用户委托自主完善合同并完成 F19→F20→F21。F21 passing。

| 职责 | 交付与实际验证 |
| --- | --- |
| 键盘与可访问性 | 原生 Tab/Enter/Space/Escape 走 Map→Topic→Block→L3→Explore 并返回；完整节点 name/pressed/focus ring；来源关闭恢复 focus；阅读位置、保存和提示 live 状态 |
| 编辑保护 | INPUT/TEXTAREA/SELECT/editable、IME/composition、Ctrl/Alt/Meta；在 decisions 上下文也验证 A/R/L 不更改审核 |
| 披露与窄窗口 | Explore 工具独立显示，Topic/Explore不沿用旧区块目录；实际640×720 viewport与PNG尺寸断言；来源覆盖面板可关闭恢复；长label键盘选中后完整披露 |
| 语义 | Reading SVG、详情、Topic boundary与Explore的relates-to无方向；identity和状态空间不升级 |
| 性能与稳定性 | Gold与公开80elements/160edges压力输入的projection≤250ms、layout+render≤1500ms；单次实际导航≤2000ms；15轮后DOM/栈稳定、ID唯一、Topic一次操作只进入一次 |

结果见 [performance.json](performance.json)，包含本机 Node/Electron/Chromium、窗口尺寸与实际测量。
公开fixture截图：[Reading](reading-map.png)、[Explore](explore.png)、[640×720出处](source-narrow.png)；截图已打开逐项查看。
普通selftest只检查，不反复改写证据；显式重采使用 `npm run selftest -- --record-maturity-evidence`。
测试前登记预算；测量仅代表此机器和有限输入，未声称主观阅读体验、所有机器性能或用户手工验收。

验证：逐个 JS `node --check`、纯feature预算、完整 `test:all`、真实 Electron `selftest`、离线搬迁Preview、`verify-preview`、validate/audit/check-overview、harness/docs/experiments。
既有check-overview为87/87、151/151，重复17/密度1 warnings保留、无failure；Preview保留既有Electron CSP提示。
成功日志仅看终端；独立审查一项P2已修正，最终无剩余P1/P2，见 [subagent-review](subagent-review.md)。
