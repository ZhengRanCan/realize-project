# F24 implementation checks

Date: 2026-10-06. 用户确认单 Block L2 与 L1 右侧共用标签设计。

首轮独立 L2 的 Electron 检查在 viewport resize 超时：新入口没有像已有真实界面测试一样显式归一化保存的 zoom。先补测试窗口 zoom=1 与 finally 恢复，再验证 640×720 实际 CSS viewport，不放宽尺寸断言。

检查同时发现 selftest 插入位置误落到 F23 专用分支；移到完整回归链，专用 L2 分支独立运行。

标签原生键盘检查首次发送 Electron 不支持的 ArrowRight keyCode，没有发出 DOM ArrowRight；测试改用 Electron Right/Left 输入码，不用合成 DOM 事件代替真实键盘。

新测试两次顶层 const b 在同一 renderer JavaScript 全局执行导致重声明错误；测试 execute 包装为块作用域，并输出实际失败上下文。缺表达/无主题降级用真实校验后资料包替代直接注入 ViewModel，保持主进程加载路径。

实际截图和独立审查均发现 P2：旧 Block scrollIntoView 仍在独立 L2 执行，把标题、进入来源与页面返回滚走。新增真实 heading 可见/主区域从顶部开始断言先失败；移除仅此 Block 入口的 scrollIntoView，保留 canonical subject preventScroll focus 和 L0 独立定位。重跑受影响路径并重录截图。

最终完整selftest曾一次在既有F19最后返回Map的selection断言失败。未改产品或放宽断言，同一最终差异单独重跑完整链通过；搬迁Preview的同一F19路径也通过。此记录不推断未知失败原因，不把失败输出删除或改写成首次全绿。

最终独立复查无剩余P1/P2；真实L2专项/全部selftest/搬迁Preview均通过，用户试读尚待完成。

## User reading feedback

用户截图显示O-02的核查披露位于主体前，rung Receipt/Availability/Consumption每项下面额外占一行出处框，破坏阶梯对照。按用户明确设计，把披露移至主体下方，L2 fragment本身作点击/键盘入口；保持原身份、内容、sourceUnitIds、fragment path、L3/Back，不修改旧Overview展示。

反馈修正版的21块原表达/fragment paths、核查在主体后/无额外框、Receipt与真实table cell键盘、鼠标、L3/Back/full selftest/搬迁Preview已通过，Native复查无确认P1/P2；保留人工复验未完成。
