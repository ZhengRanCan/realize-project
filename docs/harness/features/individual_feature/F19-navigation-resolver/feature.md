---
id: F19
title: Reading Navigation and Resolver
version: v0.1
status: passing
dependsOn: ["F16","F17","F18"]
scope: {"code":["app/shared/reading-navigation.js","app/renderer/reading-navigation.js","app/renderer/app.js","app/renderer/l0-map.js","app/renderer/l0-map.css","app/renderer/index.html","app/renderer/styles.css","app/main/main.js","scripts/build-preview.js","package.json"],"tests":["scripts/test-reading-navigation.js","scripts/test-reading-navigation-electron.js","scripts/test-reading-bundle-electron.js","scripts/test-l0-preview.js","scripts/test-reading-bundle-preview.js","scripts/helpers/reading-bundle-fixture.js"],"docs":["docs/harness/ARCHITECTURE.md","docs/harness/DESIGN.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F19-navigation-resolver/**","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F19-navigation-resolver/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"npm run test:all","result":"passed"},{"command":"npm run selftest","result":"passed"},{"command":"npm run verify-preview","result":"passed"}],"manualSmoke":"User delegated completion; real Electron automated input/IPC paths passed, not claimed as human manual acceptance."}
completionGate: {"version":"v0.1","l3":"required","userPath":["真实 Electron：Map → Topic occurrence → Block → fragment inspection → 逐层 Back，恢复展开、滚动、选中与焦点","共享定位入口打开 Element / Block 唯一 canonical landing，再 Back 回原 occurrence；Known(0) Block 仍可打开","搬迁 Preview 复用同一导航模块；不将测试入口描述成实际 Explore 页面"],"integrationEvidence":["2026-10-03 real Electron and relocated portable Preview navigation passed","Native independent review: 4 P2 fixed, no remaining P1/P2"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F19 Reading Navigation and Resolver

## Goal

把 Decision B 产品化：下钻后可以回到刚才的具体阅读现场，从另一上下文打开实体时可以到达统一固定落点。
ReadingAddress、NavigationStack、CanonicalReadingResolver 必须由 F20 直接复用。

用户于 2026-10-03 批准修正范围，并授权补齐合同后按 F19 → F20 → F21 自主实施、验证与审查。
F19 验收 Reading 内导航和共享定位动作；真实 Explore 页面及跨投影组合路径由 F20 验收。
设计见 [Navigation Design](../../../../log/artifacts/F19-navigation-resolver/navigation-design.md)。

## Process preconditions

- F16 / F17 / F18 已 passing，登记为强制前置。
- 依据 Reading 主契约 §3.3、Decision B / E、I4 / I5 / N10，以及各层下钻与返回纪律。
- F20 不反向作为 F19 的完成前置。

## Scope

### Allowed changes

- frontmatter 所列共享纯导航模块、renderer 现场适配器、真实入口、最小样式、加载与 selftest 集成。
- Preview 内联同一实现；离线结构测试、真实 DOM/键盘/IPC 验证与 suite 接入。
- architecture/design 更新模块职责；主契约仅更新机器保障边界，不提升实体 landing 能力。
- 本 feature 合同、索引、dashboard 和证据目录。共享改动的原因与验证同时登记 dashboard。

### Out of scope

- Explore 页面/Focus graph（F20）；视觉系统改版、zoom/pan 与遥测。
- Topic/SU/Review/Evidence canonical landing、fragment durable identity。
- Schema/validator 口径、模型任务、原文/Gold/历史实验数据修改。
- 文本、标题、章节交集或布局匹配补关系/归属。

## Acceptance Criteria

- [x] Back 只 pop 原 ReadingAddress 与现场，不调用 resolver、不回首页。
- [x] L0 → L1 → L2 → L3 可逐层返回；保存 occurrence、展开、选中、滚动与焦点。
- [x] Element / Block 定位到唯一、可见、可聚焦的 `#element-<id>` / `#block-<id>`。
- [x] canonical landing 不依赖 occurrence、Generated 或 Evidence；Known(0) 与缺生成的 Block 仍可打开。
- [x] 多 Topic/图节点/attachment 宿主不复制 canonical identity 或 landing；不推断 canonical ownership。
- [x] Topic/SU/Review/Evidence/fragment 固定定位明确不可用，inspection 保持可用。
- [x] 未知实体、空栈、旧 session、旧请求不污染现页；成功切换清空栈，失败/取消保留现场。
- [x] 所有固定定位复用唯一 resolver，F20 可直接调用；不提前做 Explore UI。
- [x] Electron 与搬迁 Preview 共用模块；旧入口继续可用，导航不自动保存人工审核。
- [x] 命令、真实用户路径自动化与独立审查通过，harness 门禁通过。

## Risks and compatibility

- Back 调 resolver 会丢 occurrence：检查调用次数和实际地址/现场恢复。
- anchor 在隐藏 Review 卡片上不算成功：检查唯一性、可见性、焦点与 attachment-only Element。
- 异步布局/inspection 回复可能覆盖新现场：恢复限定当前 session 与导航 generation。
- 地址是内存状态，不新增文件协议；同名 ID 不能跨包恢复。
- F20 必须复验真实 Explore 组合路径，不能把接口测试写成 Explore 已实测。

## Completion evidence

- `docs/log/artifacts/F19-navigation-resolver/verification-summary.md`。
- `docs/log/artifacts/F19-navigation-resolver/subagent-review.md`，代码完成后独立审查必需。
- 成功检查仅登记结果与关键证据，不新增永久 txt。
