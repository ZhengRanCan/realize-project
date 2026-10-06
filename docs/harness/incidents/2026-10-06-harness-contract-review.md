# Harness contract review feedback

Date: 2026-10-06.
Scope: pre-implementation contracts and design, not a runtime defect.

用户粘贴外部AI对F26/F31/F32/F33的开工前反馈，要求修正Core业务依赖、领域Context泄漏、未定义的artifact依赖、Source准备ownership及实验scope遗留。当前runtime未实现，没有运行事故或真实AI质量结论。

## Corrections

- F26去掉Reading依赖，执行通用宿主Context Policy；默认text-only拒绝两次以no_progress停止，宿主observation不伪造tool结果。
- F31负责Host prepare_run_input、原字节快照/hash/确定性registry、领域workspace/context及版本/校验证明账本。
- 设计稿定义生产输入与校验直接输入、生命周期、run布局和proof closure；Map/Plan独立，Topic→Block配对证明单列。原文件保留，失效只撤销旧证明可用性。
- F32结构完成、Core运行停止与F33质量结果分别命名；Generated装配对Review和元数据的真实依赖纳入记录。
- F33 scope去掉旧generation scripts/assembler/exporter修改权限，明确trajectory计数与真实模型行为评价；不重做底层完整故障矩阵。

## Verification boundary

本轮仅修改文档、feature版本/索引与验收要求，校验引用、元数据、依赖图及diff。未运行模型、未改变产品行为；设计/计划和各feature的真实实施证据仍待完成。结论与具体规则见[设计稿](../../notes/single-agent-harness-design.md)。
