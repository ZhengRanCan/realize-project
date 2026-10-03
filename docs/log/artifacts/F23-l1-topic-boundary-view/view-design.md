# F23 L1 Topic Boundary View — 展示设计

日期：2026-10-03。状态：用户已确认设计（2026-10-03，“可以，做吧”）；不是实际界面验收记录。

## 目标与依据

用户在实际试用中发现：L0 是图，点击 Topic 却只有成员和关系文字。F23 让这一层回答“这个主题涉及哪些对象、内部怎么连接、怎样接到外部”，继续沿用已有解释区块入口。L2 独立解释页由 F24 完成。

依据：[F23 合同](../../../harness/features/individual_feature/F23-l1-topic-boundary-view/feature.md)、[Reading 主契约](../../../specs/reading-view-cognitive-contract.md)、[Layer Contracts §2](../../../specs/reading-view-layer-contracts.md)。数据、身份与导航规则不扩张；实际可理解性仍需用户查看产品。

## 方案选择

| 方案 | 优点 | 局限 | 选择 |
| --- | --- | --- | --- |
| 主题内部图 + 外部端点，显示在同一画布 | 内部机制与边界连接可连续阅读；适用有向和无向关系 | 要增加边界布局和滚动现场保护 | 推荐 |
| 从 L0 裁出成员节点 | 实现较少 | 容易丢掉穿越边界的连接；附件降级也可能遮掉成员 | 不采用 |
| 固定“输入／内部／输出”三栏 | 单向流程容易读 | 多向或 relates-to 容易被误读成流程；重复外部对象增加负担 | 不采用 |

## 用户看到什么

```text
返回     文档标题 · 当前：主题
生成链路与消费点                         T-02
消费点是 outline generation……（完整命题，可折叠）

涉及 5 个对象 · 内部 4 条关系 · 跨主题边界 0 条
箭头表示已有方向；没有箭头的线只表示关联。

┌──────────────────────────┬─────────────────────┐
│ 本主题涉及的对象与内部连接 │ 主题外部的连接对象   │
│                          │                     │
│ 对象卡片、关系线与类型标签 │ 有 crossing 时才显示│
│                          │ 外部卡片与实际连线   │
└──────────────────────────┴─────────────────────┘
点击对象或关系，查看完整名称、说明和出处入口。

进一步阅读
[O-04 · 系统骨架…] [O-04b · 为什么…] [O-04c · 三个产品层级…]

成员与关系详情（可展开；辅助查阅）
```

框线标记当前主题视角，文字注明“对象可同时参与多个主题”；不表达容器、唯一归属或拥有关系。外部连接对象不计入主题成员。没有 crossing 时不画右侧空区域。文档身份沿用已载入的 Map 文档信息，包含 title、sourcePath、role 的可展开披露。

以实际公开样本为准：“生成链路与消费点”T-02 的 E-01 至 E-05、四条关系均是内部关系，没有 crossing，不能为演示补出外部线。测试边界连接使用 T-03：“消费的证据与判定”包含 E-03、E-08，E-03 consumes E-02 和 produces E-04 是跨边界连接，E-02、E-04 明确标为外部。

解释区块放在图下方，允许按已声明 stage 分组；不把 what/how/prove/boundary 套进节点图，不编号或暗示同 stage 的先后。

## 图的布局和披露

- 内部成员全部显示为卡片，包括没有任何 edge 的成员。复用现有 L0Layout 的纯坐标计算，输入仅为 Inside 节点与 internal edges，attachments 为空；不修改 L0Layout 或 L0 的显示规则。无内部线但有 crossing 时，成员仍有实际位置。
- 有 crossing 才在内部区域右侧设置外部端点区域。每个外部 element.id 一张卡片，连接到它的所有已有边保留；不因 inbound/outbound 或多次连接复制身份。位置取相连内部端点的几何位置，再确定性错开，左右位置不表达流向。
- crossing 的线按真实 from/to 接到端点；有方向的关系才有箭头。relates-to（包括 internal）无箭头。relationClasses 只消费既有分类，不在 renderer 重判边界。
- 内部关系、自环、回边和同端点多条关系都有独立图形与披露对象。给平行线安排不同的路径与标签位置，不用一条线替代多条关系。长名称在卡片中截断，完整 accessible name 与点击后详情保留原文。
- 关系标签默认用源 label，没有 label 时显示受控 type；详情同时显示 type、实际端点、当前 Topic 下的边界类别、原始 label/qualifiers/note。没有这些可选字段时不补造说明。
- 节点和关系选择只高亮选中项及端点，其他信息保持可见。选择后出现详情，可显式“在框架图中定位”或通过已有出处接口查看可解析来源。选择本身不导航、不打开 L3，也不自动 Explore。
- 新 UI DOM 使用本地 occurrence 属性区分节点/关系；不制造新的 canonical identity。关系没有 id 时用本次渲染内的索引关联披露，不作为持久地址或 source identity。

## 合法退化与继续阅读

| 数据状态 | 实际展示 |
| --- | --- |
| internal 非空 | 内部图，另显示已有 crossing |
| internal 空、crossing 非空 | 内部成员与外部端点之间的边界图 |
| 所有可绘制关系为空 | Topic boundary summary，列出完整成员；明确“未声明可绘制关系”，没有空画布 |
| Inside 为空 | “已明确没有主题成员”；保持当前 Topic，不能补造节点 |
| Block Organization Unknown | “尚未声明区块关联”，没有区块按钮 |
| Known(0) | “已明确没有关联区块”，没有区块按钮 |
| Known(n)，当前 Plan 可解析 | 已声明区块的 title/stage 与可操作入口 |
| Known(n)，没有配套 Plan | 保留已声明 O-xx，说明“当前未加载区块资料”，不提供可成功打开的按钮 |

有 Plan 但声明指向不存在 Block 的输入继续由已有校验器拒绝；展示不能修复外键。没有可解析 Source 时披露不可用，不按标题猜来源。attachment 和 relationGap 不变成 edge。

## 模块与数据流

`projectTopic(map, topicId, {plan, sourceSections, sourceIntegrity})` 保留现有字段及分类，增加显示所需的原始信息副本：Map document、Topic sectionRefs（若存在）、Inside 的 type/来源字段、所有 crossing 外部端点的 id/label/type/来源字段，以及关系的可选 label/qualifiers/note。输出与输入不共享可写的嵌套对象；不新增语义推断、状态合并或落盘字段。可选 sourceSections/sourceIntegrity 来自已有资料包校验，复用 coordinate resolver 生成 sourceReferences 的入口状态与不可用原因，不携带原文内容、不将坐标能力变成 provenance assurance。

新增 `l1-topic-view.js`（纯布局和渲染）位于合同允许的 `app/renderer/l1-topic-view.*`。接口计划为 `computeTopicLayout(topicVM)`、`renderTopicHTML(topicVM, options)` 与 `mount(host, topicVM, options)`。前两者供离线结构与几何测试；mount 绑定原生 button/details 与选中披露。回调包括 onBack、onElement、onBlock、onSourceRef，调用者传入当前 Plan 的 canReadBlock 判定，不另建导航逻辑。

`viewL1()` 只负责传入现有 projection、文档和回调。onElement 使用已有 canonical Element resolver，onBlock 使用现有 occurrence-aware enter，onBack 使用当前 navigation stack。模块在 Electron script 列表和 build-preview 内联列表同时接入；样式归现有 styles.css。没有新依赖、模型调用、文件读取或自动保存。

## 键盘、窄窗口和返回

- 节点/关系用原生 button，Tab 定位、Enter/Space 披露；返回与进一步阅读同样可操作，所有焦点可见。鼠标 hover 不是唯一披露方式。
- 图放在独立滚动区域，640×720 窗口下页面宽度不溢出；画布允许水平/垂直滚动，并提供可聚焦的区域名称。关系详情和区块入口在窄窗口改为上下排列。
- captureReadingFrame 在现有 context 内增加 L1 selection 和 `.l1-graph-wrap` 滚动位置；restoreReadingFrame 在 render 后恢复。保留原 details/焦点/主区域滚动恢复和 generation/session 检查，不增加私有栈。
- 从 L1 进入 Block、Element 或 Explore，再返回，恢复这个 Topic 的选择、披露、图滚动与焦点；L1 返回 L0 恢复原入口 occurrence。Escape 沿用现有层级规则与输入保护。

## 如何验收

1. 投影：完整 Inside/outside/关系集合、三态、多 Topic、来源字段、可选元数据和深层输入纯度；external-only 不进入本层。
2. 离线视图：逐节点/逐关系对应真实输入；方向、自环/平行线、有效坐标、非重叠节点与独立标签；测试不能仅搜索 HTML 字符串。
3. Electron：通过真实资料包/独立 Map 入口打开 T-02、T-03；断言节点、SVG 路径和标签可见且可交互，检查边界端点、原生键盘、640×720、选择后返回现场。覆盖无 Plan、无关系、crossing-only、relates-to、会话切换。
4. Preview：同 renderer、可搬迁离线、只读和相同退化；重新跑现有导航、集成、Explore、Source 与成熟度路径。新布局不沿用旧性能结论冒充验收。
5. 用户查看实际 T-02/T-03 和必要退化界面，确认能理解内部机制和外部连接。独立代码审查和合同要求的完整检查通过后，才复核关闭 F17、标 F23 passing。

只保留设计、计划、必要截图和结果摘要；成功校验不生成永久 txt。当前文档未承诺新增测试已经存在或通过。

## 审阅与实施边界

此方案及[实施计划](drafts/implementation-plan.md)已获用户确认（“可以，做吧” / “看着没问题，实施咯”），按 Native 实施并独立复查。实现与回归结果见 [验证记录](verification-summary.md)；实际界面理解性仍待用户确认，不以设计审批代替，也不触发 F24 或合并 main。
