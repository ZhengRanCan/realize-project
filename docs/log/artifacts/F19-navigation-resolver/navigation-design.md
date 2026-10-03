# F19 Reading Navigation Design

2026-10-03。依据 F19、Reading §3.3 / Decision B/E 与各层契约。
用户批准范围修正，并授权主 agent 补齐合同后自主完成 F19–F21；沿用 Native 实施及独立审查。

## Outcome and architecture

下钻后逐层回到阅读现场；固定定位进入唯一落点。保留 F18 加载/验证/投影/原文 inspection。
新增 shared 纯模块和 renderer 现场适配器；Electron / Preview 同实现，F20 直接复用。
不采用私有按钮栈或第三方 router：前者容易让 Explore 长出第二套导航，后者不能直接恢复当前 fragment 现场且新增依赖。

## Shared contracts

- ReadingEntityRef `{kind: element|block, id}`：显式类型，不靠前缀或文本推断。
- ReadingAddress `{sessionKey, level, topicId?, blockId?, elementId?, anchor?}`：L0/L1/L2/L3；canonical Block 不带推测 Topic。
- NavigationFrame `{address, context}`：复制渲染现场，包括视图、L0 selection、展开/disclosure、滚动、焦点和临时 fragment；不存 DOM、闭包、业务 model 或人工审核。
- createCanonicalReadingResolver 从已验证 L0/L2 projection 的 identity 集合建立查找；resolve 返回地址或 unsupported/unknown，不从 occurrence 反推身份。
- createNavigationStack 保存 frame 副本、支持 push/pop/reset/snapshot；pop 不依赖 resolver，旧 session 拒绝、空栈明确无历史。
- 资料包复用 sessionToken；旧入口用独立本地会话键，不伪造 bundle 能力。成功切换时两者重建；失败/取消保留。

## Delivery and restoration

renderer 适配器捕获现场、调用共享栈与 resolver，由 app 交付具体视图和 inspection。
进入目标前捕获现场，目标可用才压栈；Reading 下钻保留 occurrence。
固定定位只 resolve；Back 只取历史 frame 并恢复视图、disclosure、selection、焦点与滚动。
恢复工作限定当前 session/navigation generation，异步 Mermaid 布局完成后不能覆盖新导航。
L1/L2 显示返回动作，L3 关闭使用同一栈；L0 栈底没有返回。
辅助决策页可恢复 context，但不因此赋予 Review Object canonical landing。

## Canonical anchors

Block anchor 来自 Plan L2 subject；Known(0)、缺生成、缺 Evidence 时仍存在，定位展开并聚焦。
Element 现有 anchor 在隐藏 Review 卡片上：改为图/Review 两种读法外的可见 subject 详情承接唯一 ID，
旧 Review 卡片使用局部展示 ID，Topic/图节点/徽标只是 occurrence。
attachment-only Element 可查看已有身份与字段，不因此获得 Explore Focus。
Topic/SU/Review/Evidence/fragment 不开放 canonical resolver；来源 inspection 仍可用。
fragmentPath 只恢复本次 render-session 临时现场，不变成持久深链。

## Lifecycle and verification

未知/unsupported 不跳页不压栈；旧 session 不跨文档恢复。迟到的 inspection/source 复用 fencing。
成功换包/回首屏清理栈和恢复任务；失败/取消保留；导航不保存或丢弃未保存审核。
Preview 内联同一模块，不访问原目录。
先写失败的结构/入口测试，再实施。覆盖 Back≠Resolve、重复/孤立身份、缺能力、拒绝类型、旧 session、frame 副本。
真实 Electron 测点击、键盘、层层返回、焦点/滚动；搬迁 Preview 重走。完整 suite/既有 gates/docs/harness 与独立审查。
F20 单独验收 Explore 组合路径；成功检查不产生永久 txt。
