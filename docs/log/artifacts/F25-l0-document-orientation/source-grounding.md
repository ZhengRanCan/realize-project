# F25 Source Grounding

Date: 2026-10-04. 对照用户提供的公开样本离线编写，不执行原文中的操作命令。

## context-consumption

- 原文 SHA256：338bb2d632f800b53b20b1fcaa10ec235fdf7154107acb7925f87da27cb11c6a
- 旧 Map SHA256：5506846d72dcab46157c4749c0db799357455a4eab7ba7891b6ce4439aa0cb89
- 全部对象、原始边、主题及两条整篇导读均有唯一 heading 精确摘录。

## operational-runbook

- 原文 SHA256：c55f2f55f851ddc79194af9a90023d78a38376553aba1e567228ddaf0ed67d97
- 旧 Map SHA256：6160525ec4709a120a66c1c56c204284cf19c47c2d7b74eeb2fdeaf3ee858547
- 全部对象、原始边、主题及两条整篇导读均有唯一 heading 精确摘录。

- 受保护输入 samples/context-consumption/design-review.json SHA256：3292137cac1da1796cf65a8738c9a699b8073e9880e1fcdb92a825da5b019b1e
- 受保护输入 samples/context-consumption/overview-plan.json SHA256：4c39047328e56a3f43695f61ed575bd4e68c6d417c2efddadcc7cb0b097862f7

Context：核心决定/两条链支持定位；第五/九/十一节支持生成投影、attempt/revision 和 scene 继承；第六/八/十五节保留非等价、非因果及非实现授权边界。现有代码起点没有写成目标已完成。

Runbook：4.2/4.3正常路径，4.4撤销/权限，4.7/4.8重试/管理员兜底，6.4失败上限，5/10证据和待决时机，7沙箱/真实切换。空白 reviewer 决定不冒称批准。

摘录匹配只证明可定位，不证明改写正确或业务已通过。派生 Map 剔除 guide 后与旧 Map 深相等；实际用户理解待交付验收。
