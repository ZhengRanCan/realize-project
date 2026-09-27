# F07 Independent Review

- Status: `not_recorded`
- Reason: F07 在 harness 接入之前（2026-09-26）就已执行完 Phase 1–4。当时的独立审查路径是人工 reviewer（用户）按
  `validation-checklist.md` 判定，并在 `legacy-feature-registry.md` 中登记为 `Executed`；没有留下独立的 subagent
  审查记录。仓库内不存在针对本 feature 的第三方审查文档或审查结论文件。
- Decision: 本 feature 的 `blocked` 状态**不**依赖 subagent 审查，而是依赖 2026-09-26 的命令证据 +
  Phase 4 的人工语义判读 + **尚未发生的用户验收**。这条偏差在此显式登记，避免后续把它误当成"已完成独立审查"。

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| Gateway / 产物安全 33/33 的完整断言输出（含 ★ 覆盖类断言） | `results/gateway-safety-output.txt`、`results/gateway-safety.md` |
| Phase 2 真实调用的工程链八步、参数偏差、三个 harness 缺陷与修复 | `results/phase2-smoke-test.md` |
| 16 个 run 的工程 / 结构数据与 WARN 分布 | `results/run-matrix.md` |
| 逐 run 语义判读（Q2）+ Validator Gaming（§12） | `results/semantic-review.md` |
| Anchor 稳定性、拓扑分类、两个必须回答的问题（D 是否压成链 / E 是否只留 happy path） | `results/stability-analysis.md` |
| Gate 判定、`§14` 九条逐条核对、逐 run 三维分级、`§17` 最终四问、边界措辞 | `results/final-gate.md` |
| 产物完整性机械核查（sha / 参数 / 无覆盖 / 无残留 / 无修补） | `results/phase3-artifact-check.txt` |
| 验收清单与最终判定栏（**未签署**） | `validation-checklist.md` |
| 上游登记状态 | `docs/log/artifacts/legacy-feature-registry.md` 第 07 行 |

## Reviewer 视角下最需要留意的三点

1. `final-gate.md` §7 明确写了「`HARD 0` 只说明 Contract 合法，不说明图是对的」，
   且 `coverage X/X` 不是 Framework Coverage（Topic 与小节 1:1 时由构造必然满分）。
   任何后续 feature 引用 F07 的 `HARD 0` / `coverage` 时都必须带上这两条边界措辞。
2. `final-gate.md` §2 的 Gaming 判定**只基于产物形态**，意图标记为 `UNCLEAR`（思维链未落盘，reasoning 占 83%）。
   不要把「硬套动词 / 漏登 gap」写成明知故犯。
3. `brief.md` 附录说明本目录原为 `07-generation-pipeline`，其中 L2 / block 切法 / 旧 Gold 基线的记录属重构前口径，
   与本次 L0 生成链路的结论无关 —— 引用前先确认口径。

以上三点都不改变 F07 的 `blocked` 结论，但会影响后续 feature（尤其 F10）对本 feature 产物与结论的复用判断。
