# F25 Verification

Date: 2026-10-05. Current status: passing（技术与独立审查通过，用户本轮试读反馈和唯一问题修复闭环）。

以下 Registration/Design/Plan 是各阶段当时的记录；当前实现结果见末尾。

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

## Plan stage

用户确认推荐方案（“可以，按你说的推荐那种来”），[书面设计](view-design.md)记录批准。[实施计划](drafts/implementation-plan.md)已写并自查，沿用 Native；共用协议、输入及投影、展示、实际交付和验收分为五项任务，各自有测试周期。

已扩充合同中的样式、独立 L0 预览、两份派生 Map、Topic 入口受影响测试和样本说明范围。F23 仅记录共享接口交接，产品/规范/schema/validator/旧样本未改；计划待审阅，未来功能检查与实际用户理解尚未完成。

- `npm.cmd run check:docs`：153 Markdown files / 0 broken（drafts 按现有规则不计入当前引用检查）。
- `npm.cmd run verify:harness`：24 features / 0 errors，F25 唯一 active。
- `git diff --check`：通过。

计划已逐段对照设计自查：接口/状态名一致，五项 Review Focus 有对应任务测试，全部实施 checkbox 未勾选。初次引用检查将 scope 中尚未创建的两份输入当成现存文件；已按既有合同惯例将其登记为 reading.json 文件模式，计划仍固定两个确切文件名。没有创建占位产品文件或放宽检查器。


## Implementation and technical verification

用户于2026-10-04确认设计和实施计划，按 Native 执行。可选 Map readingGuide 已实现，显式绑定文档身份、Map 核心指纹和原文字节 hash；章节出处使用 heading 空间，不能串接 Map/Plan SU。精确摘录只表明加载快照可定位，不代表命题或设计已核实。

L0 先展示文章问题和整体解释；节点有短解释，节点/实际关系/约束可完整披露含义与边界。Topic 显示要回答的问题，展开与进入分开。Reading/Review 均可键盘读取关系和出处；Back 保留 occurrence、焦点、展开与图滚动。旧输入提示解释缺失，独立 Map 展示声明但不冒称来源已核对。

两篇派生 Map 剔除 guide 后与原 Map 深相等。原文、旧 Map、Context Gold/Plan 的字节未改，hash 见 [source grounding](source-grounding.md)。依据核对涵盖非等价/非因果/输出对齐和消费的区别、现有代码与目标区别、权限/撤销不回补、失败重试/上限、待审时机与沙箱/上线边界。

| Check | Actual result |
| --- | --- |
| test-reading-explanation + test-l0-orientation | binding/shape/namespace/excerpts/partial/duplicate/drift/purity，两类样本完整身份、HTML escaping、独立/旧输入通过 |
| npm.cmd run test:l0-orientation | 真实 Electron 节点/边/约束解释、Topic 展开不导航、成员只选择、原生键盘、Source/Back、640×720、平行边/长文、失败绑定/取消/旧加载/旧来源/registry 和磁盘漂移通过 |
| npm.cmd run selftest | SELFTEST PASSED；F15/F18/F19/F20/F21/F22/F23/F25 全链路、保存隔离与压力预算通过 |
| npm.cmd run test:l1-boundary | 纯布局与真实 Electron 通过，原有身份/关系/Source/键盘/Back/窄窗口断言保留 |
| npm.cmd run test:all | passed；含旧包/legacy/enhanced 搬迁只读 Preview；map29、VM35、layout42、preview131均通过 |
| npm.cmd run validate / audit | PASSED，原输入判定保持 |
| npm.cmd run check-overview | PASS WITH WARNINGS；既有重复17/密度1，Failures 无 |
| node --check changed/new JS | 19个 JS 通过；最终修改后再次检查 |

便携 Preview 搬迁至仓库外含中文和空格的测试目录，读取快照来源、Topic/Back，并拒绝保存；最终应用写入拦截结果及文档门禁在收口段登记。独立 L0 HTML 仅展示 L0，不伪造 L1 页面；Electron 独立 Map 可进入其已有 Topic，无 Plan 不补造 Block。

问题登记和修复见 [incident](../../../harness/incidents/2026-10-04-f25-ui-verification.md)，独立审查见 [review](subagent-review.md)。测试窗口的 DPI/后台节流固定只用于无人值守路径，正常产品保持平台设置；曾有 Chromium 缓存权限 stderr，功能检查以断言和退出码为准。

## Delivery and human acceptance

本机增强包：workspace/analyses/context-consumption/f25-reading/reading-bundle.json。所选 Map 为 samples/context-consumption/framework-map.reading.json，清单保留其完整字节 hash（见 interface-evidence.json）。没有自动创建 human-review.json。

本机完整便携预览：workspace/previews/f25-reading-preview.html。另一篇独立 L0 预览：workspace/previews/l0/f25-runbook.html；它引用仓库 renderer 资产，不称为可搬离仓库的单文件 Preview。可在 Electron 开发入口显式选择 samples/operational-runbook/framework-map.reading.json。

正式截图：context-orientation.png / context-meaning.png / context-narrow.png / runbook-orientation.png / runbook-narrow.png；尺寸和输入 Map hash 见 [interface evidence](interface-evidence.json)。父代理已逐张核对含义/导读及窄窗口，无永久成功 txt；临时测试范围 finally 清理。

**尚未记录用户实际阅读结果。** 用户需要不打开原文，说明核心问题、主要对象及连接含义，并说明下一步 Topic 选择理由；两类文章均需实际判断。技术结果和截图不能替代此项。F23 v0.2、F17 保持 blocked，F24 未实施，不合并 main。


## Closeout

最后一次搬迁 Preview 专项通过：旧包、legacy、增强包的 Topic/Source/Back 保留；禁用保存按钮实际点击、保存 shim API 明确拒绝，操作阶段 fs.promises.writeFile 拦截为0。该拦截不声称覆盖所有文件系统 API 或启动写入；输出目录没有 human-review.json。独立 reviewer 对最后的测试隔离/激活窗口/写入拦截也完成复查，无未关闭 P1/P2。

最终 check:docs：156 Markdown /0 broken；verify:harness：24 features /0 errors；node --check：20个变动 JS；git diff --check 通过。6个受保护输入与 f261740 逐字节一致，交付 Map hash 与清单一致且包内没有自动审核文件。F25 blocked 等实际理解，另有测试缓存删除受工具限制；产品无已知实现错误。读者理解相关 acceptance 和 humanReviewRequired 保留。

最终代码再次串行执行 test:all / selftest：通过，SELFTEST PASSED。F25 UUID 测试目录已 finally 清理；旧 L0 预览脚本生成的 workspace/tmp/tests/l0-preview-check 中8个缓存文件，整目录及更窄的逐文件删除均被工具策略拒绝（blocked by policy），未删除、未转移，也未改用其他方式绕过。其他任务缓存和用户资料未扫删。技术检查点本地提交于既有 codex/f11-f21-conformance。


## Reading panel refinement — 2026-10-05

用户实际试读认可整体方向，指出长图下方连接解释需要反复滚动；批准把它移至图旁含义/主题面板，小窗口底部可收起。修正结果、真实截图、回归与独立复查见 [reading panel verification](reading-panel-verification.md)。原解释及输入保持字节，预览已重建；仍待用户新版体验与理解验收，不能以短设计批准替代。


## User acceptance — 2026-10-05

实际输入为用户已试读的增强 context-consumption 包和截图。用户认可整体方向，唯一指出连接解释需要反复上下滚动，随后批准固定阅读面板。修正完成、回归和独立复查通过后，用户说“关于F25，我目前应该只有这个问题”，并要求完成后继续 F26。

本轮据此收口为 passing：记录用户实际意见与修正，不增加重复批准或额外口述流程。不声称用户进行了未记录的复述或第二次修正后试读；原口述条目保留为可选诊断方法。已有两类原文依据检查和独立审查仍作为解释忠实性证据。

8个旧固定缓存未删除的工具限制保留，是已确认的维护事实，不能写成清理成功；不把它当作未知产品行为。F23/F17不自动关闭。当前 registry 没有 F26，下一项编号/内容已向用户核实，未擅自把 F23 当成 F26。
