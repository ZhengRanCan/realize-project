---
id: F15
title: Projection Integration Invariants
version: v0.1
status: passing
dependsOn: ["F19","F20","F21"]
scope: {"code":["app/main/main.js"],"tests":["scripts/test-reading-integration.js","scripts/test-reading-integration-electron.js","scripts/test-reading-navigation-electron.js","scripts/test-explore-electron.js"],"docs":["docs/harness/features/individual_feature/F15-integration-invariants/**","docs/harness/features/feature-index.json","docs/log/artifacts/F15-integration-invariants/**","docs/specs/reading-view-cognitive-contract.md","docs/progress.md"]}
evidence: {"lastVerifiedAt":"2026-10-03","commands":[{"command":"node scripts/test-reading-integration.js","result":"passed","output":"actual module integration passed"},{"command":"npm run selftest","result":"passed","output":"actual DOM, shared Back, state and L1 direction passed"}],"manualSmoke":"Real Electron automation and independent review passed; not user manual acceptance"}
completionGate: {"version":"v0.1","l3":"required","userPath":["L0 selection to Explore and Back restores origin without Resolve","Valid bundle with empty Topic blockIds retains canonical O-01","Real L2/L3 renderer preserves Plan identity and Absent/Indeterminate; L1 symmetric relations remain undirected"],"integrationEvidence":["F19 Known(0) validated bundle, F20 four-layer Back and F21 native keyboard","F15 actual integration/renderer selftest 2026-10-03"],"knownUnverified":[],"humanReviewRequired":[]}
---

# F15 Projection Integration Invariants

## Goal

在已有L0–L3/Explore runtime上保护五组边界：renderer身份/authority/状态、Back与canonical、coverage、L1集合边界、原文范围坐标。
2026-10-01因Explore不存在而blocked；2026-10-03 F19–F21已完成，补真实模块/产品验收收口。

## Process preconditions

F13/F14纯投影与对抗测试、F16–F18运行时、F19共享导航和F20 Explore已存在。
本次只补集成断言和验收记录，不在F15重做Explore或修改规范/schema/validator。
依据：Reading Contract §3.2、Decision B/C/E/F、§5 I/S/N，Layer Contracts §2.9/§4.7。

## Scope

新增真实Electron集成测试，在selftest与搬迁Preview调用；替换原F15本地toy计算为真实projection/registry/resolver函数。
保留F19/F20已有独立导航/落点证据作为组合验证，不重新实现resolver或导航栈。
更新本feature验收、索引、dashboard及规范§6机器保护对应cell。

## Acceptance Criteria

- [x] ① Renderer只输出既有Plan Block/Map Element identity；不改源投影，不新增语义关系，不把Absent变Unverified或Indeterminate变Unsupported。
- [x] ② L0选择→Explore→Back恢复原现场，不调用resolver；零Topic occurrence的Block仍有canonical landing，Element只有唯一canonical落点。
- [x] ③ 调用真实projectReadingBundle：Planned3/Realized2/Missing1；Generated Missing/Unknown→Unavailable；covers=[]→N/A。
- [x] ④ 调用真实projectTopic：多Topic重叠、Internal/Crossing/External集合分类、对称关系端点反转仍crossing、Inside=[]不补成员；L1真实DOM无方向箭头。
- [x] ⑤ 调用真实buildSourceRegistry/resolveSourceCoordinate/projectL3：§3范围95–125，无凭空exactLine。
- [x] 完整regression/Electron/portablePreview/harness通过；独立审查与机器矩阵同步。

## Fixture boundary

fixture D只有Map，没有Plan。它可以验证空Topic及无方向关系，不能据此要求Block O-01存在或补造配套Plan。
Known(0) Block落点用F19真实加载的有效临时资料包：明确保留Plan，将Topic.blockIds全部设为空并更新manifest哈希；Generated缺席也不删除Block。
这里纠正旧验收描述的配套资料错误，不放宽任何invariant。

## Risks and compatibility

集成测试不能证明所有可能输入都符合认知契约；矩阵仍按真实覆盖登记partial。
不修改历史模型实验，不新增claim verification/provenance assurance能力，不宣称F08主观Track A通过。

## Completion evidence

[Verification Summary](../../../../log/artifacts/F15-integration-invariants/verification-summary.md) 与独立审查记录。
