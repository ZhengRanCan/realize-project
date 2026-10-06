# Design

## Start Screen

F22 首屏突出“打开分析资料包”。Markdown、测试样本、独立 Review/Map 归入原生 details“开发与旧版入口”，默认关闭，支持键盘展开；删除未启用的 Source 选择与旧 Phase 占位说明。下钻与阅读视角沿用 Reading 契约。

## Reading Bundle Interaction

F18 增加“打开分析资料包”，用户选择一份 reading-bundle.json 即加载同目录配套资料。
正常包默认显示框架图；Topic 先展示成员与边界，仅明确声明的 Block 关联可下钻。缺少 Map 时披露缺失并允许独立 Block 阅读。
Block 或临时 fragment 可打开查出处面板，原文链与相关审阅材料分开展示；关闭恢复原阅读位置。
有未保存审核时，由用户选择继续当前阅读或放弃改动后切换；不会自动保存。人工文件只在点击保存后写入当前包。

## Baseline

F19 增加逐层返回：Topic、Block、出处关闭恢复进入前的具体现场，包括展开、滚动与键盘焦点。
Element / Block 固定定位到唯一可见 subject 位置；Topic occurrence 不被解释为归属。
Reading 内使用“返回”“查看区块”“查出处”；“Open in Reading”保留给 F20 的 Explore。
Topic/SU/Review/Evidence/fragment 不新增 canonical landing；资料切换成功才清空历史。

- 视觉系统：Electron 桌面应用，深浅两套基础样式集中在 `app/renderer/styles.css`，L0 界面另有
  `app/renderer/l0-map.css`。图与流程由离线随包的 Mermaid（`app/renderer/vendor/mermaid.min.js`）与
  自有渲染函数产出，不引入外部 CDN 或在线字体。
- 承载形式：区块的表达形式由内容形状决定，**不是内容去将就组件**。受控词汇表见 `docs/specs/shape-catalog.md`
  （10 个 shape + `prose` 例外）；`shape` 表示"这是哪种视觉表达"，`content.type` 表示"renderer 用哪种基础结构渲染"。
- 两页信息架构：
  - **方案总览**：四段推进（甲 · 这是什么 → 乙 · 它怎么跑 → 丙 · 怎么算发生了 → 丁 · 边界与反模式），
    左侧常驻目录在滚动时高亮当前阅读位置；每个区块右上角带 `Source: §9, §10` 标签，点击在右侧原文面板显示对应段落而不跳走。
  - **决策清单**：所有决策集中一页，按 `reviewLevel` 分三组；每条默认只展示 标题 / 问题 / AI 建议 / 一句话原因 / 三个动作，
    详情折叠七项（Alternatives、Full rationale、Consequences、Current/Target、Evidence、Open Questions、Dependencies）。
- 状态与文案：
  - 三个审核动作的语义固定为 同意 = `approved`、不同意 = `rejected`、以后再说 = `needs-revision`；不新增状态类型。
  - 折叠是**结构性折叠，不是编辑性删减**：默认折叠不代表内容不重要。
  - 已知偏差：`以后再说` 复用 `needs-revision`，`human-review.json` 里的语义略窄于 UI 文案。
  - **页面文案不引用文档章节号。** 文档按路由组织（见 `agent.md` 的文档路由表），不按编号；
    提示语只描述动作本身（例如"Schema 校验失败时先修复 JSON，不要进入 Review UI"），
    否则文档一重构，界面上就会出现指向不存在章节的引用。
- 交互与可访问性：
  - 快捷键 `A` / `R` / `L` 作用于当前聚焦的决策卡片，`G` / `D` 切换两个页面。
  - 区块与 Topic 需要可从键盘聚焦并触发下钻；L0 元素使用 `#element-<id>`，block 使用 `#block-<id>` 深链。
  - L0 默认入口是 Map，`What → How → Prove → Boundary` 作为可切换的 **Reading Lens**（交互层概念；
    其认知语义以 Cognitive Contract 为准，见下），两者复用同一批 blocks。
  - 判断 UI 是否合格的最终标准是**能否不打开原 Markdown 就回答问题**，不是"好不好看"。
  - **Reading 的认知语义不在本文件定义。** 跨层规则以 `docs/specs/reading-view-cognitive-contract.md`
    为准，各层（L0–L3）的具体契约以 `docs/specs/reading-view-layer-contracts.md` 为准；
    本文件只描述实现与交互如何满足这两份契约。实现若与契约冲突，以契约为准。

## 变更前置

- 视觉、交互与可访问性修改属于"先更新或确认 harness 文档再改代码"的范围：先改本文件或对应 feature 合同，
  再动 `app/renderer/**`。
- UI 缺陷、构建失败与用户返工反馈先记入 `docs/harness/incidents/`，可复用的预防措施再写入 `docs/harness/lessons.jsonl`。

## Explore v1 interaction

Reading各层可显式选择Map Element/Topic探索关系，图只展示已声明邻接。返回阅读恢复原现场；在阅读中打开Element走统一resolver，Topic无canonical landing时明确不可用。attachment-only constraint作为注释，不能成为Focus。

## F21 maturity interaction

工具行提供显式Explore入口与live阅读位置；顶部导航继续复用原页面。Map节点完整accessible name与选中状态，键盘披露不依赖hover。Escape只处理当前顶层，编辑/选择/IME/修饰键受保护。640×720窄窗口允许图独立滚动，Source可关闭恢复；不隐藏语义。relates-to在所有读法都无方向。焦点可见并随Back恢复，性能预算与证据在F21合同。

## F23 L1 boundary view — 已接入，实际理解验收未通过

F23 的[展示设计](../log/artifacts/F23-l1-topic-boundary-view/view-design.md)采用主题内部图与明确标注的外部端点，同一画布保留全部已有内部/crossing 关系；解释区块入口放在图下方。无可绘制关系才显示 boundary summary。节点/关系用原生键盘披露，窄窗口图独立滚动，返回恢复选择、展开、焦点与图滚动。内部线和跨边界线已接入，路径避开卡片并保留箭头入射方向；无向关系不加箭头。出处只在当前资料包坐标唯一可解析且完整性一致时启用，否则披露原因。用户批准首轮设计及实施计划；2026-10-04 实际试用指出解释不足，F23 v0.2 保持 blocked，需补主题解释和无边摘要。

## F25 L0 orientation — 已实施并完成本轮验收

[书面设计](../log/artifacts/F25-l0-document-orientation/view-design.md)已获用户确认：图前整篇定位、节点短解释、选择后的对象/关系含义和 Topic 关注问题；解释随 Map 加载。[实施计划](../log/artifacts/F25-l0-document-orientation/drafts/implementation-plan.md)已确认并实施；现有规范继续适用。L0 按既有框架及解释定位，不用固定四阶段铺全文。

## F25 L0 interaction

用户已批准设计和计划。图前直接显示有依据的整篇问题/说明，保留 scope、非目标和已有 thesis；节点有短解释，完整含义在选择详情中披露。具体边解释按原始 occurrence 选择，原始身份和无向/自环语义保留。Topic 默认显示关注问题或原 proposition，原生展开与明确“进入主题”按钮分开。解释先于折叠原始关系表；每条来源独立说明可用性，快照可定位不标命题已验证。640×720 依次排列并保留图独立滚动，原生键盘/共享 Back/Source 会话保护继续适用。

桌面和资料包 Preview 的 screen 固定于视口，主内容与图各自滚动；窄窗口 grid 使用 minmax(0,1fr)，避免主体横向溢出与外层页偏移。独立 L0 HTML 未承载 L1 runtime，显式禁用进入按钮并提示 Electron；完整资料包 Preview 保留主题导航。


## F25 reading panel refinement — 2026-10-05 approved

用户确认短设计。桌面图旁粘性阅读面板以“含义/主题”原生标签切换，含义中先给当前对象/关系的解释与来源，其后保留全部连接目录。点击图对象/连接自动展开含义，保留图及主阅读位置和选择者的焦点；切换到主题保留当前图选择。未选择时提示选择对象或连接。

宽度不够容纳两栏时，面板停靠底部，可收起；首次窄窗口加载默认收起，点击选择或标签展开。面板和图各自滚动，面板高度以当前阅读区域可用高度为界，不能把关闭/切换控件挤出窗口。Source 关闭和 Topic/Explore Back 复用 Reading frame 恢复面板标签、展开、滚动和焦点。禁用能力、引用/来源状态与 Review 原始信息不变。

若面板切换会隐藏当前焦点控件（例如从 Topic 成员选择对象），焦点转到可见的当前标签；收起时转到展开按钮。图上的选择者焦点保持。


## F23 v0.2 explanations — short design approved 2026-10-05

用户已确认短设计。L1 页首先给已声明的主题问题/说明与边界；有关系保留原边界图，节点直接给简短定义，关系标签给具体含义，点选完整解释与出处在图旁可读。窄窗口详情可收起，固定于可用阅读区域；Source/Topic/Explore 返回保留选择、展开、滚动与焦点。

无可绘制关系仍为 boundary-summary，用成员定义/区别/边界的可读卡片，保留原身份与类型，不强画流程或把约束当第四层概念。Further Reading 的相关区块是继续阅读入口，不替代本层基本解释；stage 仅是区块组织字段，界面不称层级。

F25 投影的解释含义与来源状态复用一份；没有 guide 或缺项时显式说明，不现场推断定义或以 L2 替代。可定位仅针对资料快照，实际 Source 仍经过当前 session 的完整性保护。

## L1 acceptance — 2026-10-06

F23 v0.2 解释修正完成技术回归和独立复查；用户反馈“看着也算还行，接下来做L2的内容？”，本轮接受，F23/F17 已 passing。前文 2026-10-04 blocked 表示当时失败反馈，不是当前状态。L2 的单 Block 独立解释页由 F24 继续设计，尚未实施。

## F24 approved reading layout — 2026-10-06

用户确认独立 L2 页面与 L1 入口移动：L1 右侧/窄窗口底部共用一个可收起面板，“含义与依据”和“相关解释”标签切换；删除下方重复区块入口。选中图中对象/连接切至含义，入口及三态不变，Back 恢复标签和现场。

L2 只呈现当前解释单元，顶部为层级、文档与进入来源，主体沿用已有受控表达，出处/审阅关联/生成完整性与 coverage 独立披露。不渲染其他 Block 或整篇四段目录，不增加按编号 Next/Previous；旧 Overview 仍为显式旧阅读入口。

## F24 reading feedback adjustment — 2026-10-06

用户要求L2表达优先，资料与核查信息移到表达下方。移除表达内的单独出处按钮，原卡片/概念/关系片段成为鼠标和键盘查出处入口；保留块级查出处与原坐标。只有原已声明fragment来源的元素启用，不为无来源片段补造入口；表格保持表格结构与单元语义。旧Overview维持原入口展示。
