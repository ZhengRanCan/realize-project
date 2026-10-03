# Reading Bundle Contract

## Authority and Scope

本文件规范文件加载、目录和配对；认知语义由 [Cognitive Contract](reading-view-cognitive-contract.md)
与 [Layer Contracts](reading-view-layer-contracts.md) 决定。本协议不创造跨模型语义外键。

## Manifest and Directory

每次分析一个目录，推荐 bundles/<document-slug>/<analysis-id>/。用户打开 reading-bundle.json。
bundleVersion=1；analysisId 为非空字符串；bindings.designReviewId 必填，提供 Map 时 frameworkDocumentId 必填。
files 中 source/designReview/plan/sourceSections 必填，generated/frameworkMap 可选；各项为 {path,sha256}，hash 为完整 SHA256。
所有资料必须是分析目录内的普通文件；拒绝 URL、绝对路径、..、实际越界的链接、不同条目指向同一实际文件。
整包移动不改变定位。producer path 不作为读取入口。human-review.json 为独立可写文件，不在不可变清单中。

## Pairing and Integrity

design.id / plan.designRef.id / generated.document.id 与 designReviewId 核对；Map.document.id 只与 frameworkDocumentId 核对。
Generated generation.planSha256 与 Plan 原始字节核对，兼容已有装配器明确生成的 16 位 SHA256 前缀，或完整 64 位。
不得重写 hash 掩盖配对错误。Map 声明的原文路径应与导出调用方明确选择的原文相符；已提供源 hash 时必须核对。
清单只绑定选定文件，不能让同名 Map SU / inventory SU 与 Plan SU 自动合并；未声明来源空间时披露 skipped validation。
来源 registry 从包内 source 快照派生，version=1，包含完整源 hash、legacy sections 与 fence-aware heading tree。
§N 仅按明确的 legacy alias 定位章节范围；heading 独立定位，重复 key 不取第一条。没有 exactLine 推断。
结构、路径、配对或 hash 错误拒绝 session 提交。生成语义 FAIL / warnings 保留为生成状态，不等于结构非法。
registry 与实际原文漂移使 source-coordinate unavailable；不得继续使用旧坐标。

## Degradation and Session

未提供 Generated 为 Unknown；已提供但某 Block 缺表达为 Missing。两者都保留 Plan 主体。
未提供 Map 披露缺失，允许独立 Block 视图；不借用旧 Map。review evidence [] 为 Known(0)，required carrier 缺席拒绝结构。
原文与 review 两条链分别展示；ClaimVerification 为 Known Absent，ProvenanceAssurance 保留 Indeterminate。
prepare 只准备输入；最新 requestToken 的 commit 才切换 session。失败、取消和过期回复保留旧 session。
审核保存到当前包，只有显式保存才写文件。切换成功清空旧来源 cache、Topic、L3 与选中上下文。

## Export and Delivery

离线导出显式输入，不调用模型；原始 Plan/Generated/Review/Map 字节保持不变。临时目录 read-back 通过后提交到未存在的输出目录。
不覆盖同名包，不迁移历史 run；完整产品导出同时提供 Map。用户包和人工审核不进 Git。
L0 只消费 Map；L2 采用 Plan LEFT JOIN Generated；L3 保持 Block 主体。Preview 与产品共用投影和 renderer。
