# F23 v0.2 解释修正验证

Date: 2026-10-05. Native 实施；聊天中的短设计已获用户确认（“可以”）。本轮技术检查与独立审查通过，修正版尚未获得用户实际阅读验收；F23/F17 保持 blocked，F24 未启动。

## 实际行为

- 进入主题先看到讨论的问题与边界；原命题和身份仍可披露。有关系时保留完整边界图，节点有短定义，连接标签显示已声明的具体含义。
- 图旁“含义与依据”面板显示选中对象/关系的完整解释及出处，可以收起；窄窗口使用底部面板。图与解释可以同时查看，不必反复滚到图下。
- 无关系主题直接显示概念定义对照与约束边界，不把 Receipt、Availability、Consumption 画成流程。Further Reading 是补充阅读入口。
- 复用 F25 GuideVM 的绑定与来源状态：按原 Topic/元素 id、原始 edges occurrence 匹配，不猜 Map/Plan SU 对应。缺项明示，部分来源逐项降级；缺 Plan、独立 Map、旧 Map、漂移仍保留原结构。
- Back 恢复选择、展开、详情与图滚动、焦点；新进入 Topic 从顶部开始。打开原文后收起面板，关闭原文将焦点返回可见展开按钮。

## 验证结果

| 检查 | 实际结果 |
| --- | --- |
| `npm.cmd run test:l1-boundary` | 真实 Electron：概念对照、图中对象/连接/Outside 含义、准确 heading 原文、原生键盘、面板收起及 Block/Explore Back、640×720、部分来源/漂移/外部 edge occurrence/独立与旧 Map/no-save 通过 |
| `npm.cmd run test:all` | 纯投影/输入纯度/冻结、全部原身份与关系、两份 enhanced Map 几何、安全转义；搬迁只读 legacy/enhanced Preview 的相同 L1 路径通过 |
| `npm.cmd run selftest` | 完整 Electron 链路及 F15/F18–F25 回归通过 |
| `npm.cmd run validate` / `npm.cmd run audit` | 既有 fixture 与 Overview 一致性通过 |
| `npm.cmd run check-overview` | PASS WITH WARNINGS；原有重复×17 / 密度×1，零 failure |
| `node --check` / `git diff --check` | 修改和新增的 JavaScript 静态检查通过 |
| `npm.cmd run check:docs` / `npm.cmd run verify:harness` | 160 Markdown / 0 broken；24 features / 0 errors |

Electron 的既有 Windows cache 访问诊断仍会输出；上述测试均以实际断言及退出码判定。成功日志只在此总结，不保存 txt。

八个既有输入（Context 的 source、Map、enhanced Map、Plan、design-review；Runbook 的 source、Map、enhanced Map）相对本轮基线 `8a1d6ab` 字节未变；没有运行模型、修改输入合同或生成用户审批。测试只使用自己创建的 UUID 临时目录并清理。

[独立审查](subagent-review.md)：Native reviewer 对实际 diff、共享绑定、edge occurrence、Source 会话、HTML 转义、详情恢复和截图独立核对；晚期 Source 焦点修复复查无 P1/P2。发现并修复的实际缺陷见 [incident](../../../harness/incidents/2026-10-05-f23-explanations.md)。

## 界面证据与试读

以下为真实 Electron 截图，不是设计稿：

| 截图 | 内容 | 窗口 |
| --- | --- | --- |
| [概念对照](explanations-concepts.png) | T-01 四个成员的定义/差异/非等价约束，无伪造箭头 | 1280×900 |
| [边界连接](explanations-crossing.png) | T-03 完整 crossing 与 Outside 对象解释 | 1280×900 |
| [窄窗口概念](explanations-concepts-narrow.png) | 定义对照和底部面板 | 640×720 |
| [窄窗口图](explanations-graph-narrow.png) | 关系图和同时可见的连接解释 | 640×720 |

重启 Electron 后打开增强资料包 `workspace/analyses/context-consumption/f25-reading/reading-bundle.json`。从 L0 的主题进入“三级递进语义”（无边定义对照）、“生成链路与消费点”（内部连接）和“消费的证据与判定”（跨主题连接）。便携预览已重建：`workspace/previews/f23-reading-preview.html`；原 F25 预览也同步 renderer。

用户需要试读修正版并判断对象职责、概念差异和连接含义是否可理解。这项结论尚未收到；不以自动测试或设计批准替代。任意大型密集 L1 的性能与独立 L2 展示不在本轮完成证据中。
