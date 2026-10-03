# Incident: L1/L2 分层阅读展示未落实

- ID: INC-2026-10-03-L1-L2-READING-GAP
- Date: 2026-10-03
- Source feature: F16 / F17；跟进 F23 / F24
- Status: open
- Trigger: 用户试用后询问 L1/L2 在哪里，并提供 Topic 点击前后的两张截图。
- Symptom: L1 显示标题、成员与关系文字列表；底部按钮进入 L2 时在整篇 Overview 中滚动定位区块。
- Impact: 有层级入口和数据投影，但阅读范围与视觉表达没有充分落实；先前“F11–F21 整体完成”的结论过宽。

## Reproduction or evidence

使用 context-consumption 完整资料包，点击 L0 右侧“生成链路与消费点”。用户截图显示 L1 有四条 internal 关系，但只呈现文字。底部 O-04/O-04b/O-04c 是 L2 入口，截图本身尚未展示 L2。

实现定位：app/renderer/app.js 的 viewL1 将关系渲染为段落；Block 导航设置 overview 视图，viewOverview 渲染全部区块，再聚焦并滚动到当前 Block。

## Root cause

F16 的验收范围是数据投影接入，并排除 UI 重设计；F17 的边界分类/入口通过后，没有验证“有关系时的局部地图、无关系时的 summary”展示规则。最终汇报将数据、导航与技术成熟度的证据扩大成完整分层阅读体验的证明。

## Immediate correction

- 新建 F23 L1 Topic Boundary View、F24 L2 Independent Block Reading View，均 not_started。
- F17 重开为 blocked，保留已通过的投影/导航证据，待 F23 完成后复核视觉项和实际用户验收。
- F16 保留数据接入 passing，明确不包含独立 L2 页面验收。
- F19 的强制前置保留 F16/F18；F17 已验证的投影/入口是其实际技术基线，F17 待补视觉不是 F19 导航正确性的前置。将该区别写入合同，保留原导航证据，不级联宣称导航失效，也不修改 gate。
- dashboard 撤回整体体验完成结论。代码、样本和历史测试结果不改；新的界面结果还未产生。

## Lesson

数据完整、入口可点和返回正常，各自只能证明对应能力。局部图、独立阅读范围和可理解性必须有具体展示断言与用户查看实际界面的结果。

## Follow-up target

- [F23](../features/individual_feature/F23-l1-topic-boundary-view/feature.md)：主题内部与外部连接的可读图，不是丢掉 crossing 的 L0 裁剪。
- [F24](../features/individual_feature/F24-l2-block-reading-view/feature.md)：以单 Block 为主体的独立解释页，保护原文、Explore 和返回路径。
- 关闭条件：两项界面验收完成，用户明确确认，F17 复核关闭，总进度按实际范围更新。
