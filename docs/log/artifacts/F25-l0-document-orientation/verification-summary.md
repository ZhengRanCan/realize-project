# F25 Registration Verification

Date: 2026-10-04. Status: not_started.

用户授权新建 L0 feature 并更新 L1 合同。已登记 F25 与验收标准，未改产品、schema、validator、样本、用户审核或解释输入协议；没有声称未来功能测试已通过。

职责与来源见 [brief](brief.md)。本轮仅检查文档引用、feature frontmatter/索引/状态和 diff；本轮命令结果如下。展示设计、解释绑定、实施计划、独立代码审查与用户阅读验收均在实施阶段完成。

## Registration checks

- `npm.cmd run check:docs`：152 Markdown files / 0 broken。
- `npm.cmd run verify:harness`：24 features / 0 errors。
- `git diff --check`：通过。

只证明登记与文档一致性。F25 not_started，F23 v0.2 blocked；代码、展示设计、新解释数据与阅读理解验收均未在本轮完成。
