# F19 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.
> 本仓库未安装上述执行技能；用户授权的 Native 方法沿用现有 Harness，主 agent 实施并独立审查。

**Goal:** 连续 Reading 导航能原路返回；Element / Block 有统一可见落点，供 F20 共用。

**Architecture:** shared 纯地址/栈/resolver + renderer 现场适配器；现有 app 负责视图和 inspection 交付。Preview 内联相同模块；不新增依赖或持久化。

**Tech Stack:** Node.js、Electron、原生 JS/DOM/CSS。

**Spec:** [Navigation Design](navigation-design.md) 与 F19 feature / verification。

## Global Constraints

- Back 不调用 resolver；Topic/SU/Review/Evidence/fragment 不新增 canonical landing。
- identity 来自已验证 projection，不从 occurrence、DOM、标题或章节推断。
- 成功切换重建 session，失败/取消保留；不自动保存审核，不调用模型。
- 原始样本/实验不改；成功校验不新增永久 txt；沿用 codex/f11-f21-conformance。

## Review Focus

- attachment-only Element 与隐藏 Review anchor：唯一落点必须可见且聚焦。
- Mermaid 布局或 inspection 旧回复：不覆盖新导航。
- 多 occurrence / Known(0) / missing Generated：固定身份仍可定位。
- 外部修改 snapshot / 同名 ID 跨包：旧栈不可污染新 session。
- 搬迁 Preview 与旧独立入口：复用同一实现且不误启用 bundle 能力。

### Task 1: Shared navigation

**Files:** create app/shared/reading-navigation.js、scripts/test-reading-navigation.js。

**Interfaces:** createCanonicalReadingResolver({sessionKey,elementIds,blockIds}).resolve({kind,id}) → result/address；createNavigationStack(sessionKey) → push/pop/reset/snapshot；typed address validation。

- [x] 写类型拒绝、唯一落点、Known(0)、frame 深拷贝、session mismatch、empty pop、Back resolver计数断言，运行确认新增边界尚不存在。
- [x] 实现无 DOM/I/O 的双环境模块；重跑离线 feature suite。

### Task 2: Real Reading delivery

**Files:** create app/renderer/reading-navigation.js、scripts/test-reading-navigation-electron.js；modify app.js、l0-map.js/css、styles.css、index.html、main.js、test-reading-bundle-electron.js。

**Interfaces:** renderer controller consumes capture/show/restore/current session callbacks + shared resolver/stack；公开 enter/back/resolve/reset/snapshot，F20直接复用。

- [x] 在真实 Electron 测试新增连续层层返回、occurrence 固定定位往返、Element anchor唯一可见、滚动/焦点/disclosure与旧请求断言。
- [x] 所有真实下钻/返回接入 controller；提供唯一 Element subject详情，Block展示返回动作；成功载入重建。
- [x] 异步 inspection 成功才入栈；恢复按 session/generation fenced；既有旧入口与审核保存回归。
- [x] selftest 检查前述路径，修正失败并复验。

### Task 3: Preview and evidence

**Files:** modify scripts/build-preview.js、test-reading-bundle-preview.js、package.json；feature/index/dashboard/architecture/design/机器保障cell；F19 evidence。

- [x] 将 shared/renderer 模块内联同一 HTML；搬迁后实际执行导航测试；feature suite 接入 test:all。
- [x] 完整 test:all / selftest / verify-preview / validate / audit / check-overview / docs / experiments / harness。
- [x] 独立审查实现并修正必要项；记录结果与关键证据，完成标准后同步 passing 并提交。
