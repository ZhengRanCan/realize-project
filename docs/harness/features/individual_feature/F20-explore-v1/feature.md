---
id: F20
title: Explore v1 (reusing the Reading identity substrate)
version: v0.1
status: passing
dependsOn: ["F19"]
scope: {"code":["app/shared/explore-projection.js","app/renderer/explore.js","app/renderer/app.js","app/renderer/index.html","app/renderer/styles.css","app/renderer/reading-navigation.js","app/main/main.js","scripts/build-preview.js","package.json"],"tests":["scripts/test-explore-projection.js","scripts/test-explore-electron.js"],"docs":["docs/harness/ARCHITECTURE.md","docs/harness/DESIGN.md","docs/harness/features/feature-index.json","docs/harness/features/individual_feature/F20-explore-v1/**","docs/specs/reading-view-cognitive-contract.md","docs/log/artifacts/F20-explore-v1/**","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"npm run test:all","result":"passed"},{"command":"npm run selftest","result":"passed"}],"manualSmoke":"Delegated completion; real Electron automated user paths, not human manual testing."}
completionGate: {"version":"v0.1","l3":"required","userPath":["从L0/L1/L2/L3的显式Element/Topic入口进入Explore，切换Focus后Back to Reading恢复原ReadingAddress/现场","Open in Reading复用F19 resolver；Topic无canonical landing，attachment-only constraint不能Focus","搬迁Preview复验实际Explore组合路径"],"integrationEvidence":["2026-10-03 real four-layer Explore/Reading Back/Resolve and portable Preview passed","Independent review 2 P2 fixed; no remaining P1/P2"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F20 Explore v1

## Goal

实现确定性的实体关系探索：从任意 Reading 深度显式选择 Map Element/Topic，沿已声明关系切换焦点。
与 Reading 共用 F19 的地址、栈和 resolver，不添加独立 Explore route、ID、resolver 或 back stack。
设计见 [Explore Design](../../../../log/artifacts/F20-explore-v1/explore-design.md)。

## Process preconditions

F19 passing；用户于2026-10-03授权补齐占位合同并自主按顺序完成。依据 Reading Decision A/B、§3.3、I1–I8、N4/N6/N10。

## Scope

### Allowed changes

frontmatter 列出的纯 Explore projection、确定性 Focus graph renderer、现有导航入口/现场扩展、最小CSS、真实Electron与搬迁Preview测试。
projection只消费已验证L0 VM，保留原Map外键/关系/authority；F19共享栈增加跳过Explore frame的“返回阅读”操作，不另建栈。
更新 architecture/design、当前机器保障边界、feature/index/dashboard和证据。

### Out of scope

Block/Decision/Evidence/SU/fragment作为Focus；Topic canonical landing；文本/章节相似度建关系；zoom/pan/新模型调用或数据协议。
attachment-only constraint即使有Topic membership也不能成为Focus；relationGap不是edge。

## Acceptance Criteria

- [x] Element/Topic Focus仅在已声明可遍历关系下准入；未知/unsupported/attachment-only constraint明确拒绝，不改变页面/历史。
- [x] semantic edges保留方向、类型、label/note/qualifiers与authority path；membership直接来自element.topics；self-loop不丢。
- [x] attachment仅annotation，relationGap单独披露；不会变成可遍历邻接或推断的语义边。
- [x] Topic blockIds的Unknown/Known(0)/known原样披露；已存在Block仅可阅读，不升为Focus或containment。
- [x] 从L0/L1/L2/L3均可通过显式map-side实体入口进入，缺Map说明不可用，不猜Block与Element关联。
- [x] Focus切换复用F19同一NavigationStack；“返回阅读”恢复原ReadingAddress/展开/selection/disclosure/滚动/焦点，不调用resolver。
- [x] “在阅读中打开”走F19 resolver；Element落点唯一可见，Topic按钮明确不可用。返回后可恢复原Explore现场。
- [x] 原身份/authority/认识论状态保持，投影输入不变；导航不自动保存，成功切包清除历史/Focus，旧请求被隔离。
- [x] 真实Electron键盘/点击与搬迁Preview完整组合路径、既有回归、独立审查和harness通过。

## Risks and compatibility

地址的projection现场可保存Focus引用，但不得制造Explore私有identity。membership不允许绕过attachment-only constraint禁令。
Explore是横向视图，不是L4；返回阅读跳过同一共享栈内的Explore frame，不借resolver重建。
保持Reading默认Map与旧单文件入口；禁止把已审阅/PASS/source-verified当作claim verified。

## Completion evidence

`docs/log/artifacts/F20-explore-v1/verification-summary.md`、同目录`subagent-review.md`。成功检查不新增永久txt。
