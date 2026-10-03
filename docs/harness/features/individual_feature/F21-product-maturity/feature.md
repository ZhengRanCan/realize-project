---
id: F21
title: Product Maturity (UX, performance, accessibility)
version: v0.1
status: passing
dependsOn: ["F19","F20"]
scope: {"code":["app/renderer/app.js","app/renderer/l0-map.js","app/renderer/l0-map.css","app/renderer/explore.js","app/renderer/l3-inspector.js","app/renderer/styles.css","app/renderer/index.html","app/main/main.js","package.json"],"tests":["scripts/test-product-maturity.js","scripts/test-product-maturity-electron.js","scripts/helpers/maturity-fixture.js","scripts/test-l0-preview.js"],"docs":["docs/harness/DESIGN.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F21-product-maturity/**","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F21-product-maturity/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"node scripts/test-product-maturity.js","result":"passed","output":"Gold and stress identity/direction/budgets passed"},{"command":"npm run selftest","result":"passed","output":"F21 native keys, actual narrow viewport, screenshot sizes and 15 rounds passed"},{"command":"npm run test:all && npm run verify-preview","result":"passed","output":"full regression and portable renderer passed"}],"manualSmoke":"Real Electron automated input and screenshot inspection; not user manual acceptance"}
completionGate: {"version":"v0.1","l3":"required","userPath":["真实Electron键盘操作贯通Map/Topic/Block/L3/Explore，Escape恢复与输入保护/焦点可见","640×720窗口与正常桌面下主要控件/出处可访问，长文本可键盘恢复","Gold与80elements/160edges确定性压力输入测量渲染/投影与循环导航，性能预算通过，原义与identity保持"],"integrationEvidence":["F21 maturity selftest and portable Preview 2026-10-03; performance.json and actual 640×720 screenshot"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F21 Product Maturity

## Goal

在已经建立的L0–L3/Explore runtime上完成三个有限职责：键盘/可访问性、披露/窄窗口、可复核性能。
保持框架图默认入口与原有语义，不改视觉系统、不新增模型状态或遥测。
设计见 [Maturity Design](../../../../log/artifacts/F21-product-maturity/maturity-design.md)。

## Process preconditions

F19/F20已passing，F16–F18运行路径存在；用户授权补齐合同后按顺序自主完成。F08历史Track A不属于本轮验收。

## Scope

### Allowed changes

frontmatter中的renderer/最小CSS、真实键盘输入selftest、压力fixture/预算测试、耐久关键证据与文档。
既有Reading的relates-to若被画箭头/分成来自指向，按N5修正交付，不改projection/schema/validator。

### Out of scope

zoom/pan/评论/新语义层/新数据carrier/网络遥测；新identity/resolver（复用F19/F20）；F08主观阅读体验结论。
不得为UI需要补verification、把Unknown/Known(0)/Missing/Absent/Indeterminate折叠，或放宽invariant。

## Acceptance Criteria

- [x] Map节点有完整accessible name、button语义与选中状态；Tab/Enter/Space可操作，长label的完整文本有键盘可达披露。
- [x] L0/L1/L2/L3/Explore的Escape按当前顶层关闭/返回；输入/选择/编辑及IME/composition、Ctrl/Alt/Meta不触发审核/换页快捷键。
- [x] 焦点可见；来源关闭、Back及跨投影恢复焦点；动态阅读位置/保存/提示状态有live region。
- [x] 640×720窄窗口与正常桌面下，导航/Explore入口/返回/出处关闭可见或可滚动到；Source面板不挤掉主控件。
- [x] 全层identity/authority/认识论状态/语义强度不升级；Reading与Explore的relates-to均无箭头，不伪造主次。
- [x] Gold和80elements/160edges压力fixture的projection≤250ms、layout+render≤1500ms；真实导航单次≤2000ms，15轮开关DOM/事件不累积。预算先于测量登记。
- [x] UX决定→契约→验证映射完整；性能JSON与关键截图可复核，不保存agent成功txt日志。
- [x] 完整suite/selftest/portablePreview/既有input gates/文档索引与独立审查通过；harness通过。

## Risks and compatibility

窄窗口允许图独立滚动、Source临时覆盖部分阅读区，但内容可通过关闭恢复，不不可逆省略。
性能是本机确定性预算，不宣称所有机器或无界数据都达标；记录版本/尺寸/耗时和DOM量。
不声称用户手工测试、旧F08 Track A或模型语义质量已验收。

## Completion evidence

F21 verification-summary、subagent-review、performance.json、关键公开fixture截图。成功日志不长期留txt。
