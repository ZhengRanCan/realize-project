# F18 Verification Summary

Date: 2026-10-03. Result: passed.

用户批准资料包设计、实施计划与 Native 执行方式。显式资料清单、同目录导出、Map-first 加载、
Plan + Generated 的 L2 与真实 L3 inspection 已实现。独立审查发现的问题均已修复并复查。
机器验证覆盖合同要求的用户路径；不把这些检查记成人工阅读体验验收。

## Executed Checks

| Command | Result | Scope |
| --- | --- | --- |
| npm run test:all | passed | 旧 validator / L0、全部 Reading projection 与对抗测试；source、bundle、session、审核隔离及搬迁后的便携 Preview |
| npm run selftest | SELFTEST PASSED | 真实 preload / IPC / renderer 的 Map → Topic → Block → 两条核查路径、fragment、键盘与返回、跨文档/旧请求/取消/漂移及保存 |
| npm run check-overview | PASS WITH WARNINGS | 既有完整 Generated；87/87 SU、151/151 provenance；既有重复/密度 warning 不改成 assurance |
| npm run check:docs | passed | 文档引用 |
| npm run check:experiments | passed | 历史实验索引未漂移 |
| node --check（逐文件） | passed | 本轮 main、shared、renderer、validator、exporter、Preview 与测试 |
| npm run verify:harness | passed | 合同、状态与完成证据元数据 |
| electron . --verify-preview（本地样例包） | VERIFY PREVIEW PASSED | 最终生成的单文件预览默认框架图、可核查 SU，审核保存禁用 |

最终原始输出在本目录 `logs/`；独立复查见 [Subagent Review](subagent-review.md)。

## Product Evidence

- `test-reading-bundle-electron.js` 调用真实加载入口，默认 L0，点击 Topic 和已知 Block，再点击 inspection 与 SU。
  原文只提供章节范围；审阅对象自己的 Evidence 在对象内部 disclosure；claim carrier 结构保持 absent。
- `test-reading-bundle-projection.js` 断言 Plan authority、Unknown / Missing / FAIL 的区分、
  section range 无 exactLine、Known(0) Evidence、Indeterminate assurance，以及 fragment 保留父 Block。
- `test-reading-bundle.js` 覆盖中文/空格目录和整包搬迁、明确绑定、不同 Map/Review ID 空间、目录越界/链接、
  哈希与 fingerprint、结构错误拒绝、缺失/语义失败保留。
- 可控暂停实际 fs 读取后逆序回复：旧 legacy load 不能覆盖较新资料包，旧 Source 不能关闭新 Inspector，
  同一 Inspector 内旧 SU 坐标不能覆盖最近选择。独立 Map 清空旧包两端上下文，仍可点击 Topic。
- 审核写入捕获发起保存时的 session 并串行化；跨包、取消与失败保持隔离，无加载自动写审核。
- Preview 输出单个只读 HTML，搬迁后经 Electron 渲染并走同一 inspection 路径；不另写语义逻辑。

## Contract Cells

认知契约 §6：S8/S9 与 N9/N10/N11/N12 从 None 更新到 Partial，并记录具体保护边界；
§6.1 移除实施前的过时基线，§7 标记已存在的 L2/L3 入口。没有宣称历史可复现、claim verification 或完整 resolver。

## Initial Gap and Compatibility

实施前分支 `baa459c` 的旧自检虽通过，运行时却没有 Plan.covers/sourceUnits，L3 helper 报错；
Source 固定仓库 registry，无法配对任意文章。该缺口由输入协议与 session 绑定修复，原始实验制品未重写。
旧 Stage2 的展示 variant / 矩阵列写法与 renderer 对齐；严格分支及 min/max cardinality 拒绝非法结构。

## Remaining Scope

完整 canonical navigation / resolver、Explore 与产品视觉迭代仍分别属于 F19 / F20 / F21。
本轮只有明确 Topic.blockIds 才显示关联区块，不猜 Map SU 与 Plan SU 的桥接关系。
