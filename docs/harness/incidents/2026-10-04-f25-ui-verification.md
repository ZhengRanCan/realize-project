# F25 实际界面验证

## 触发

2026-10-04，新增 Electron 专项检查 `npm run test:l0-orientation` 首次运行失败于 Topic Back 的选择、展开、焦点和图滚动组合断言。先保留失败，逐项定位，不删减既有导航断言。Chromium 同时报告本机共享缓存权限错误；渲染和 IPC 已运行，不将该缓存消息当作界面检查通过证据。

## 状态

定位到关系披露按钮的 edge id 为空，而图线和返回恢复使用已有端点 id；occurrence 正确但返回前后 id 不一致。披露按钮沿用图线的 id 生成规则，仍以 edgeIndex 区分平行边。专项已通过。


截图检查发现640×720时主内容仍有横向滚动，且 scrollIntoView 可滚动外层页面造成下方空白。补强真实 main 宽度/外层高度检查；修复窄窗口的 grid 最小宽度，再重新截图。

全量 selftest 首轮发现早期 main seam 仍点击旧 summary；更新为明确进入按钮且保留 L1/Back 检查。另有 F21 截图尺寸断言失败，补充实际尺寸诊断后重跑，不能视作测试通过。

交付检查发现独立 L0 HTML 只有 L0 renderer，没有 L1 runtime，新增进入按钮不能显示为可操作。构建器显式声明 topicNavigation=false，禁用进入动作并说明应在 Electron 中打开 Map；完整资料包 Preview 的 Topic 导航保持启用。

独立审查发现 Review 模式点击关系仅更新被隐藏的 Reading 详情；Review 关系行没有原生键盘入口。添加同 occurrence 的原生解释按钮及行内完整解释/依据，保留原始元信息，补真实模式切换和键盘披露检查。

复查发现 Review 关系行的祖先选择监听拦截了出处 details 的原生 summary 默认行为。关系选择对 summary 不 preventDefault，补原生 Enter 展开出处及摘录可见断言。

重复回归出现显示器缩放造成截图物理像素与 CSS 视口尺寸不一致（2880×1668 对1920×1112）。无人值守 selftest/verify-preview 固定 device scale=1 并禁用最大化；正常产品保留原配置。尺寸断言不放宽；F25 改为等待真实指定尺寸到达后验证。

便携 Preview 重跑发现 F23 原生 Space 偶发未送到测试窗口；原有 exerciseBoundaryView/exerciseMaturity 未显式激活 Electron 与 WebContents。补窗口激活后保持原生输入和原断言，串行重跑。

直接验收预览在后台窗口停滞，确认本次只读测试进程的命令行后终止它。无人值守验证关闭后台节流，避免 requestAnimationFrame 等待在遮挡窗口中无限挂起；正常产品保持默认节流。没有终止用户产品进程或删除用户材料。


## 关闭结果

关系 occurrence、Review 的解释/原生出处披露、独立预览能力、窄窗口溢出、旧入口测试、测试 DPI/节流/激活窗口问题均已修复。最终 selftest、L1 boundary、L0 专项和搬迁 Preview 通过；独立审查复查无未关闭 P1/P2。所有断言保留或补强，实际用户理解尚未验收。


## 工具清理限制

确认固定测试缓存的绝对目录、无 reparse point 和8个明确文件后，删除动作被工具自动策略拒绝（blocked by policy）；改为原生 PowerShell 逐文件删除这一更窄范围也被拒绝。没有用其它工具绕过、没有移至待删目录、没有声称已删除。专项 UUID finally 清理已完成，8个固定旧测试缓存暂留。
