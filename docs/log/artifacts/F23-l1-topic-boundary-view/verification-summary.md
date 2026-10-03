# F23 Registration

Date: 2026-10-03. Status: not_started.

用户批准登记 F23，合同与验收标准已建立，产品代码尚未修改。
本轮仅验证文档引用、索引与状态一致性；没有运行或声称通过未来新增的界面测试。
实际展示设计、实施计划、界面截图、独立代码审查和用户验收均在实施阶段补齐。

反馈来源：[L1/L2 reading gap](../../../harness/incidents/2026-10-03-l1-l2-reading-gap.md)。

## Registration checks

2026-10-03 登记检查通过：

- npm run verify:harness：23 features，0 errors。
- npm run check:docs：145 markdown files，0 broken。
- git diff --check：通过。

这些结果仅证明登记文件自洽，不作为功能完成或界面验收证据。产品代码未修改，未运行产品测试。

## Design started — 2026-10-03

当前状态 active。用户要求开始 F23，已完成只读代码与规范核对，并写下[展示设计](view-design.md)，待用户审阅。产品代码、依赖、原始测试材料和用户审核未修改；未运行产品测试。

发现 projectTopic 已提供 membership 和边界分类，但 renderer 只写段落；外部端点名称、关系元数据和 L1 图滚动现场需要在实现中补齐。T-02 只用于内部机制，T-03 具有真实 crossing。设计检查和登记检查均不作为功能完成证据。

本轮设计文档检查：check:docs 146 markdown / 0 broken；verify:harness 23 features / 0 errors；git diff --check 通过。自查覆盖布局、退化、导航、模块接口和验收；书面设计与实施计划的用户审阅仍未完成。

## Design approved / Plan written — 2026-10-03

用户回复“可以，做吧”，确认展示设计。[实施计划](drafts/implementation-plan.md)已写并自查，沿用先前 Native 选择，待计划审阅。未改产品代码，未创建新 renderer/测试；实际界面 acceptance 仍未完成。

计划阶段检查：check:docs 146 markdown / 0 broken；verify:harness 23 features / 0 errors；既有 test-l1-topic-projection 9 assertions 通过；git diff --check 通过。既有测试仅是投影基线，不是新图实现证据。
