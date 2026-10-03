# F18 Runtime Input Gap

Date: 2026-10-03. Owner: F18. Status: implementing.

L2 只接 design-review.overview，不含 Plan.covers / sourceUnits，交给 L3 helper 后报 covers is not iterable。
Source 读取固定仓库 registry，跨文档输入无法形成可靠来源链。已有 helper 测试未覆盖产品入口。

处置：用户批准资料清单和同目录导出，显式绑定输入后再投影。修复须覆盖真实 Electron 下钻、跨包切换、
失败保留旧审核、namespace 与缺失状态；已有 F16 passing 证据保持原 scope。
设计及实施计划位于 `docs/log/artifacts/F18-l3-inspector/`。完成证据随后记录，当前不声明修复通过。

严格执行 Stage 2 shape 分支时发现旧 Schema 子项样式词表与全局 variant / 已有 renderer 不一致；
统一 panel/item/lane/verdict/combo 的展示样式到已有全局词表，不改变 node.state 或 Current/Target 规则。
实测 Generated O-07 的矩阵列标题为 {text,variant}，旧 renderer 显示为对象字符串；
Schema 显式纳入这一展示写法，renderer 读取 text，原始产物保留。两个修正均属于 F18 输入兼容前置。
