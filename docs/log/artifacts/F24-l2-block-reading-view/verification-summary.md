# F24 Implementation Verification

Current: 2026-10-06. F24 passing。技术实施、真实 Electron/Preview 回归与独立审查通过；用户试读后提出的两项反馈已修正，随后明确确认“目前 L0、L1、L2 的第一版基本完成”。此为当前首版基线确认，不声称额外口头复述或第二篇文章理解测试。

## Delivered behavior

- L1 图下的进一步阅读入口已移入同一右侧面板的“相关解释”标签；“含义与依据”保留当前选择解释。点击对象/连接自动切回含义，原关联入口与 Unknown/Known(0)/Known(n) 保持。
- L2 只显示当前 Plan Block，保留唯一可见可聚焦的 canonical anchor。标题、文档、进入 Topic 或独立打开上下文在顶部；没有其它 Block 主体、全文阶段标题或按编号 Next/Previous。
- 表达仍由原 content renderer 生成。21 个主体剥离纯交互后的原表达 HTML 与显式旧 Overview 逐一相等，原 flow/matrix/diff/steps/ladder 等内容完整；没有为缺表达补造图。
- 规划语义范围、生成与覆盖、主题关联、审阅关联分别披露；生成警告不等于设计或依据判定，PASS 默认不突出。有部分未知 Topic 关联时不能推断 orphan，独立打开不冒充某个 Topic 归属。
- Block/fragment 的原文核查与 L3、Explore、逐层 Back 沿用既有 session/resolver/stack。返回恢复 L1 标签、选择、焦点、图和面板滚动，及 L2 的披露和滚动。资料与核查信息在表达下方，L2各fragment原元素直接点击/键盘查出处，不额外占一行出处框。
- 无 Map 的有效资料包通过旧 Overview 上的“独立阅读”进入相同页面。真实校验的无 Generated、部分 Generated、明确空 Topic 关联包仍保留主体与规划出处，无自动保存。

## Verification

| Command | Result |
| --- | --- |
| `npm.cmd run test:l2-block` | 纯输入/identity/occurrence/escape 与真实 21 块表达一致性、唯一主体、原生标签/键盘、L3/fragment/Explore/Back、640×720、真实降级包通过 |
| `npm.cmd run selftest` | 最终完整 Electron 链及 F15/F18–F25 回归通过 |
| `npm.cmd run test:all` | 全离线、原语义/validator回归及搬迁 legacy/enhanced Preview；实际 Preview 同一 L2 单块与 L1 标签/返回检查通过 |
| `npm.cmd run validate` / `npm.cmd run audit` | 原 fixture/schema/Overview 一致性通过 |
| `npm.cmd run check-overview` | PASS WITH WARNINGS；已有重复×17 / 密度×1，零 failure |
| `node --check` / `git diff --check` | 16 个修改/新增 JavaScript 与 diff 检查通过 |
| `npm.cmd run check:docs` / `npm.cmd run verify:harness` | 最终文档链接与 feature 合同/索引状态门禁通过 |

九个现有 source/Map/enhanced Map/Gold/Plan/Generated 文件相对 `91c25a8` 字节未变；输入合同/schema/validator与模型任务未修改，不运行模型。测试使用自己的 UUID 目录并在 finally 清理；不新增成功校验 txt。

真实截图和独立审查发现入口沿用旧 scrollIntoView 隐藏标题的 P2，已记录、修复、补失败先行的实际可见性回归并重录。一次完整 selftest 在既有 F19 Map selection 最后恢复断言失败；未改产品/未放宽断言，同一最终差异单独重跑整个链通过，搬迁 Preview 同一路径也通过。失败原因没有被证明，不作归因；记录见 [incident](../../../harness/incidents/2026-10-06-f24-reading-view.md)。既有 Electron cache 访问诊断不作为测试结论。

[Native 独立审查](subagent-review.md)及修复后复查无剩余 P1/P2；自动化和截图检查不替代用户阅读验收。

## Interface evidence and trial

[Capture metadata](interface-evidence.json)记录真实 PNG/CSS viewport 尺寸及文件 hash，非设计稿。

| File | View | Window |
| --- | --- | --- |
| [右侧相关解释](l1-related-desktop.png) | T-02 图和原区块入口同时可见 | 1280×900 |
| [底部相关解释](l1-related-narrow.png) | 640×720 可收起共用标签面板 | 640×720 |
| [独立流程](l2-flow-desktop.png) | O-04 Current/Target flow，标题与 Topic 来源在顶部 | 1280×900 |
| [独立对照](l2-contrast-desktop.png) | O-04b，对照表达保留 | 1280×900 |
| [窄窗口解释页](l2-flow-narrow.png) | 标题与正文同一滚动页，布局不溢出 | 640×720 |

本机试读：重启 Electron，打开 `workspace/analyses/context-consumption/f25-reading/reading-bundle.json`，进入“生成链路与消费点”，在右侧“相关解释”打开 O-04 / O-04b。也可打开重建的便携 Preview：`workspace/previews/f24-reading-preview.html`。

F24 已按用户本轮明确的首版确认收口；原 L2 数据接入由 F16 保障，当前页面由 F24 验收。单文档的首版确认不升级为跨文档通用质量结论；后续实际反馈仍需登记。

## Registration history

Date: 2026-10-03. Status: not_started.

用户批准登记 F24，合同与验收标准已建立，产品代码尚未修改。
本轮仅验证文档引用、索引与状态一致性；没有运行或声称通过未来新增的界面测试。
实际展示设计、实施计划、界面截图、独立代码审查和用户验收均在实施阶段补齐。

反馈来源：[L1/L2 reading gap](../../../harness/incidents/2026-10-03-l1-l2-reading-gap.md)。

## Registration checks

2026-10-03 登记检查通过：

- npm run verify:harness：23 features，0 errors。
- npm run check:docs：145 markdown files，0 broken。
- git diff --check：通过。

这些结果仅证明登记文件自洽，不作为功能完成或界面验收证据。产品代码未修改，未运行产品测试。

## User feedback fix verification — 2026-10-06

用户要求资料核查移到框架图后、删除独立出处框并让Receipt等元素可点击。先补真实21块布局/无额外框/原表达树与fragment path保护断言失败，再修正。Receipt label鼠标点击和Receipt/真实matrix cell的Enter、Space各自只产生一个原fragment核查；Back恢复原元素焦点，来源与父Block不变。完整selftest、本轮test:all搬迁Preview与Native复查通过；旧Overview仍使用原出处按钮。

新增[概念页桌面](l2-concepts-desktop.png)及[窄窗口](l2-concepts-narrow.png)实际证据；核查披露在主体后，来源关联未删除。正式图像metadata同步重录hash。未把这次明确修改要求写成最终实际验收。

## First-version acceptance — 2026-10-06

实际用户确认：“目前 L0、L1、L2 的第一版基本完成”。用户要求现阶段暂停扩展，先推进 AI 接入与入口流程。结合已完成的真实界面回归与 Native 独立复查，关闭当前待复验项；没有运行新产品测试或模型实验来替代人工判断。
