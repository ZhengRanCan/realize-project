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
