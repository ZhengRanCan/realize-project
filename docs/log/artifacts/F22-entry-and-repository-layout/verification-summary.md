# F22 Verification Summary

Date: 2026-10-03. Status: planning, not implemented.

用户批准整理方向并要求新建独立 feature。本轮建立 F22 合同、验收文件与书面设计，登记为当前 active。
未修改 Electron 产品代码，未移动目录，未删除文件，未执行模型调用。

## Creation Checks

| Command | Result | Scope |
| --- | --- | --- |
| npm run check:docs | passed：123 markdown files，0 broken | 新 feature、设计与当前引用 |
| npm run verify:harness | passed：21 features，0 errors | F22 已登记，F18 保持 passing，唯一 active 为 F22 |
| git diff --check | passed | 本轮文档变更无空白错误 |

这些检查只证明新合同、索引与引用自洽，不能证明首页或迁移已完成。

## Pending Product Evidence

- 书面设计与实施计划的审阅及执行方式选择。
- 首页默认折叠与旧入口兼容的真实 Electron 路径。
- 搬迁前后内容指纹、实验归属、旧路径映射与本地数据保留。
- 整包搬迁后的 Reading/L3、Preview 与人工审核隔离。
- 约定回归、独立审查和完成门禁。
