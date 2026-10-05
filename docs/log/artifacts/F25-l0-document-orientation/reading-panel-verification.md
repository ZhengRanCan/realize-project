# F25 Reading Panel Refinement

Date: 2026-10-05. 用户确认短设计后，在既有 F25 内修正；未另建 feature。基线 3047c57。

## Result

连接目录与选择详情从长图下方移到图旁的阅读面板。桌面粘性两栏，含义/主题为原生标签；点击节点或连线展开含义，图的位置不变。连接目录完整保留且按原始 occurrence 选择。小窗口底部停靠，可收起；新窄窗口会话默认收起，选中对象展开。

面板两个标签各自保留滚动；标签/收起/滚动纳入已有 Reading frame，没有新导航栈。Source 关闭恢复可见出处控件。Topic/Explore 返回保留选择和面板现场；canonical 元素的可见性先恢复，再恢复面板状态，避免覆盖。若切换隐藏当前面板内焦点，焦点转至可见标签/展开控件；图的选择者焦点保持。

## Verification

- test:l0-orientation：两类输入、旧包/独立 Map/Review；真实 1280×900 与640×720、图与含义同时可见、不移动图/主滚动、原生箭头标签切换/Enter/Space、收起、Source/Topic/Explore Back、非活动标签正滚动位置通过。
- 最终 test:all / selftest 通过，SELFTEST PASSED；validate/audit PASSED；check-overview PASS WITH WARNINGS（原重复17/密度1，无Failures）；静态8个 JS 与 diff通过，check:docs 158/0，verify:harness 24/0。便携增强 Preview 也运行相同 reading panel exercise，不能只有静态按钮存在。
- 原有身份/来源/数据纯度、平行边/长解释、坏绑定/漂移、保存隔离的断言保留。新增按钮所在标签可见后才测试原生焦点。
- 8个原文/旧 Map/增强 Map/Gold/Plan 输入与基线逐字节一致。没有改解释内容或输入协议，没有自动保存人工审核。
- 正式界面证据：[桌面](reading-panel-desktop.png)、[小窗口](reading-panel-narrow.png)。旧轮截图保留，描述旧轮实现。

## Independent review

Fresh native /root/f25_panel_review 只读审查，无外部模型数据传输；未启动 Electron 或重复父代理测试。检查标签/焦点、面板尺寸与滚动、observer/事件清理、Source、旧输入/独立 Map/Review/Preview、真实截图。

发现 canonical Back 的恢复顺序覆盖面板状态，已修复并补两种真实返回断言；父代理补查非活动标签滚动丢失，显式保存两标签滚动后，reviewer 再次复核无未关闭 P1/P2。真实运行结果由父代理负责。

## Delivery

本机完整预览 workspace/previews/f25-reading-preview.html 已重建；原增强包 workspace/analyses/context-consumption/f25-reading/reading-bundle.json 保持字节和配对。独立 runbook 预览 workspace/previews/l0/f25-runbook.html 同样使用新面板。

用户需要重启 Electron（加载新的 renderer），再打开同一增强包，或刷新本机完整预览。用户“整体看上去还行”保留为部分反馈；本次确认是修正设计批准，不冒称实际阅读验收完成。F25 收口后仍待新版位置体验和原理解项验收，F23/F17未关闭。

本次专项目录继续 finally 清理；未创建永久成功 txt。旧轮固定缓存删除被工具策略拒绝的事实保持，不通过其它方式绕过。

正式截图通过 --record-l0-panel-evidence 专项生成，1280×900和640×720。产品输入和解释未改；本次本地检查点保留在 codex/f11-f21-conformance。
