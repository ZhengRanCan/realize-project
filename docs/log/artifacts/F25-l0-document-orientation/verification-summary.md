# F25 Registration and Design Verification

Date: 2026-10-04. Current status: active（候选设计审阅阶段）。

用户授权新建 L0 feature 并更新 L1 合同。已登记 F25 与验收标准，未改产品、schema、validator、样本、用户审核或解释输入协议；没有声称未来功能测试已通过。

职责与来源见 [brief](brief.md)。本轮仅检查文档引用、feature frontmatter/索引/状态和 diff；本轮命令结果如下。展示设计、解释绑定、实施计划、独立代码审查与用户阅读验收均在实施阶段完成。

## Registration checks

- `npm.cmd run check:docs`：152 Markdown files / 0 broken。
- `npm.cmd run verify:harness`：24 features / 0 errors。
- `git diff --check`：通过。

上述是初次登记检查，当时 F25 not_started，F23 v0.2 blocked；只证明登记与文档一致性，没有功能完成结论。

## Design stage

用户要求完成 L0 feature，F25 已成为唯一 active。[候选书面设计](view-design.md)具体覆盖页面、三种方案、Map readingGuide、显式指纹/来源绑定、兼容与失败状态以及两类公开样本验证。已自查范围、来源空间、当前/目标边界和旧输入兼容；明确 schema 已支持根字段 thesis。

书面设计待审阅，实施计划待写，产品/schema/validator/旧样本均未修改。未来派生样本与样式文件在实施前加入 scope。技术功能、独立代码审查和用户阅读理解未完成，F25 不可 passing。

- `npm.cmd run check:docs`：153 Markdown files / 0 broken。
- `npm.cmd run verify:harness`：24 features / 0 errors；F25 为唯一 active。
- `git diff --check`：通过。

初次文档检查发现尚未创建的模块被写成现存文件路径；已改为明确的拟新增模块说明，复跑通过。未创建占位代码，也未调整文档检查器来放宽规则。以上只证明候选设计和任务状态的文档一致性。
