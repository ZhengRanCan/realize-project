---
id: F10
title: Semantic Grounding (two-stage semantic landing)
version: v0.1
status: blocked
dependsOn: ["F07"]
scope: {"code":["scripts/run-semantic-grounding.js","ai/semantic-inventory.prompt.md","ai/framework-map-synthesis.prompt.md","schema/semantic-inventory.schema.json","schema/map-selection.schema.json"],"tests":["scripts/test-semantic-grounding.js"],"docs":["experiments/semantic-grounding/**","docs/log/artifacts/F10-semantic-grounding/**"]}
evidence: {"lastVerifiedAt":"2026-09-27","commands":[{"command":"npm run f10:run","result":"passed-with-warnings","note":"两阶段 runner 在 experiments/semantic-grounding/ 下留下 15 个 run 目录（fixture-d run-01..04 · fixture-e run-01..11）；决定性样本为 D/run-04（Stage A 136 条 → 13 elements · 12 edges · check-map HARD 0 · WARN 3 · INFO 25）与 E/run-04 → E/run-05 / run-08（Stage A 95 条 → 13 / 12 elements · check-map HARD 0）；历史记录里的命令写作 node scripts/run-semantic-grounding.js --fixture d|e"},{"command":"npm run f10:run -- --fixture e --stage b","result":"failed","note":"历史记录写作 node scripts/run-semantic-grounding.js --fixture e --stage b：run-07 finish_reason=length（completion 65536 顶格 · reasoning 61261 · raw 10664，第二个分隔符未出现），e/run-04 的 Stage B 在 max_tokens_b=12288 下 reasoning 吃满 12288、content 为 0；两条失败产物均按「失败不覆盖」原样保留"},{"command":"npm run test:grounding","result":"passed","note":"历史记录写作 node scripts/test-semantic-grounding.js：48/48 通过（零模型调用），见 execution-prompt.md 第 15 行"},{"command":"npm run verify:harness","result":"passed","note":"harness 层证据，由主 agent 在收口时统一执行（2026-09-27）"}],"manualSmoke":"Phase 3 人工审计由 DSH agent 执行、用户于 2026-09-26 记为 Completed / Closed：先独立打开 semantic-inventory.json 评价 Stage A，再逐条核 map-selection.json 的 disposition 与最终 map —— E 的 6 条 omitted 全部核实为合法 omission，run-08 的 S-40 裁决为不属于「不可以砍」五类；D 侧 12 个人工实体 12/12 覆盖，但 Task --depends-on--> Task 在 12 条边里 0 条（consumes 7 / produces 3 / relates-to 2），判为 E3 未关闭。validation-checklist.md 未经 reviewer 签署"}
completionGate: {"version":"v0.1","l3":"required","userPath":["在 validation-checklist.md 的判定栏登记 Gate = PARTIAL PASS 的处置：接受该结论并把 D 侧基础关系退化转为已知限制，或保留为未关闭项（当前两条都未登记）","裁定是否接受「Stage A 的四维独立评价（Recall / Precision / Granularity / Provenance quality）没有单独落盘」—— results/inventory-review.md 仍标注未开始，相关结论散在 results/final-gate.md 与 results/cost-experiment.md"],"integrationEvidence":["npm run f10:run：D/run-04 完整两阶段（Stage A 136 条 → 13 elements · 12 edges · attachments 3 · topics 21 · check-map HARD 0 · WARN 3 · INFO 25）","npm run f10:run：E/run-04（Stage A 95 条）→ E/run-08（Stage B 12 elements · 8 edges · topics 9 · check-map HARD 0 · WARN 0）","npm run test:grounding：48/48 通过（零模型调用），覆盖 A ok + B 失败、malformed inventory 不许进入 Stage B、selection 少一条只报 integrity FAIL 不自动补等注入情形","Semantic Audit 链路在真实故障上用过两次：run-10 的 state 丢失被定位到 Stage B 编码、run-11 的 false-represented（S-33 声称 represented → E-08，但 E-08 与全图 REFUND_FAILED / 连续 10 次 均 0 命中）被链路抓出"],"knownUnverified":["E3 未关闭 —— D 侧核心基础关系：D/run-04 的 12 条边为 consumes 7 / produces 3 / relates-to 2，depends-on = 0、自环 = 0；Stage A 已抽到 S-56 / S-63 / S-64，Selection 三条都 represented → C-PlanStructureAndState，但第 1 层关系被降级删除、只剩第 3 层 constraint，判定 E3 · Encoding Distortion（违反 F09 冻结的三层原则）。依据 results/final-gate.md §4 与 results/d1-regression.md §2–§3；用户裁决不用 prompt 打补丁，保持未关闭","跨文档类型的结构保真未完全成立：results/final-gate.md §0 明确 F10 的 PARTIAL PASS 含义是「两阶段架构方向成立，但跨文档类型的结构保真仍未完全成立（E 侧机制保留成立；D 侧核心基础关系发生 E3）」，与 F07 的 PARTIAL PASS 含义不同","Constraint Composition / Compression Gap 已登记未修：D 的 C-PlanStructureAndState 吸收 39/136 条语义、label 只到类别名；E 的 C-01 / C-02 / C-03 各吸收 12–17 条（results/final-gate.md §6、results/d1-regression.md §4.1）。F10 明确不做，留给下一阶段 representation design"],"humanReviewRequired":["Gate = PARTIAL PASS 的处置未登记：用户已于 2026-09-26 在 legacy-feature-registry.md 把本 feature 记为 Completed / Closed，但未说明是接受该结论（把 D 侧基础关系退化 E3 转为已知限制）还是保留为未关闭项；docs/progress.md 当前记为「E3 未关闭（Gate = PARTIAL PASS）；处置未登记」","validation-checklist.md 的全部复选框与判定表（ACCEPT / ACCEPT WITH NOTES / REJECT）至今没有 reviewer 签署，Phase 4 四个问题的回答与 Gate 结论只出现在 results/final-gate.md §0/§8/§10，验收记录本身缺失","Stage A 的独立四维评价没有单独落盘：results/inventory-review.md 仍标注「未开始」，Recall / Precision / Granularity / Provenance quality 的结论散在 results/final-gate.md §9 与 results/cost-experiment.md §2，是否接受这一省略需用户裁决"]}
---

# F10 Semantic Grounding (two-stage semantic landing)

## Goal

本 feature 把 `Markdown → Framework Map` 的生成链拆成两阶段（Stage A 抽取 Semantic Inventory → Stage B 在
Selection 压力下落地成 framework map + `map-selection.json` sidecar），并用 Source→Inventory→Selection→Encoding
四段归因回答「E 那些被丢掉的机制语义，是读文档时就没理解出来，还是理解出来后在压缩成 L0 时被丢掉」。
交付物是 `scripts/run-semantic-grounding.js`（两阶段 runner，沿用 F07 四条纪律：独立目录 / temp→read-back→原子 rename /
失败不覆盖 / 绝不 repair）、`scripts/test-semantic-grounding.js`（离线产物安全验证 48/48，零模型调用）、
两份 prompt（`ai/semantic-inventory.prompt.md`、`ai/framework-map-synthesis.prompt.md`，后者含 parity 五段补丁）与
两份 generation schema（`schema/semantic-inventory.schema.json`、`schema/map-selection.schema.json`，明确**不属于**
framework-map 契约）。实测产物落在 `experiments/semantic-grounding/fixture-{d,e}`，共 15 个 run 目录（d run-01..04、e run-01..11），
失败产物全部原样保留。最终 `Gate = PARTIAL PASS`：两阶段架构方向成立、E 侧机制保留成立（机制 anchor 从 F07 的 0–1/3
提升到 high 下 4/4 有承载，E5 over-representation 从 81 elements 压到 12–13），但 D 侧核心基础关系
`Task --depends-on--> Task` 发生 E3 · Encoding Distortion，未关闭。legacy registry 记为 Completed / Closed（2026-09-26），
本合同按「gate 项未全部关闭」登记为 `blocked`。

## Process preconditions

- Process order: F10 位于 F07 **之后**、F08（L0 UI）**之前** —— `results/final-gate.md` §10 把「Contract 稳定 / Validator 稳定 /
  high-effort semantic grounding 可用但有已知限制 / low 不默认」作为交接边界交给 F08。
- F07 的实测结论是本 feature 的输入：15 run · `HARD 0` 全绿但 `Semantic PASS 0/15`、E 的机制 anchor 0–1/3、
  D 的 12 实体覆盖但 3/3/4 条 invented relation 与 2/0/1 处方向错。F10 复用 F07 旧臂产物
  （`experiments/framework-map-generation/fixture-{d,e}/run-01..03`）作历史对照，**不重跑对照臂**。
- F09 冻结的 Contract 与关系三层原则（`type` + `qualifiers` + `constraint`）是事实前提，D 侧 E3 的判定正是「第 3 层替代了第 1 层」。
- `dependsOn` 只登记 harness 强制前置 F07；F06 / F09 在流程上更早，但至今没有用户验收记录，因此不登记为依赖（见规格 §4）。
- 本 feature 在 harness 接入前就已关闭，`validation-checklist.md` 的判定栏至今空白，合同由历史材料回填。

## Scope

### Allowed changes

- `scripts/run-semantic-grounding.js` —— 两阶段 runner：一次 run 的 A/B 两阶段写在同一个 run 目录，产物含
  `request-stage-{a,b}.json` / `raw-*-response.txt` / `semantic-inventory.json` / `framework-map.json` /
  `map-selection.json` / `check-map.txt` / `run-meta.json`，并新增 `run-meta.json.integrity` 只报告不修补的完整性校验。
- `scripts/test-semantic-grounding.js` —— 离线产物安全验证（零模型调用；48/48 通过），重点打两阶段中间失败。
- `ai/semantic-inventory.prompt.md`（Stage A，不含 budget / 拓扑 / element type / relation 词要求）与
  `ai/framework-map-synthesis.prompt.md`（Stage B，含 parity 五段补丁与 G8「不把语义藏进自由位」）。
- `schema/semantic-inventory.schema.json`、`schema/map-selection.schema.json` —— generation evidence，已在文件内标注非契约。
- `experiments/semantic-grounding/**` —— 15 个 run 目录及其全部产物（含失败与截断样本）。
- `docs/log/artifacts/F10-semantic-grounding/**` —— brief / execution-prompt / validation-checklist / results/**。

### Out of scope

- 不新设计 schema 替代 framework-map；不新增第 7 类 element、不扩 relation vocabulary、不改 qualifiers（Contract v1 不动）。
- 不把 selection trace 塞进 Framework Map Contract（它只是 generation evidence）。
- 不扩 check-map 做语义分析：不让确定性 validator 去理解 `edge.label` / `relationGap` 的语义。
- 不改 preferred budget 12；不把 Fixture A 的具体答案（例如 `Receipt = concept`）写进 prompt，只给通用判别规则。
- 不在 D/E 验证成功之前扩到 A/B/C；不因为单次运行不满意就改 prompt 重跑到好看（失败产物原样保留、run 编号只增不减）。
- 不修 Constraint Composition / Compression Gap（原 F09 Structured Constraint Gap）；只登记为下一阶段 Contract 议题。
- 不用 prompt 给 D 侧基础关系退化打补丁（用户裁决：保持未关闭）。

## Acceptance Criteria

- [x] Phase 0 Prompt Parity Audit 完成：25 条规则逐条对照，出 5 个真缺口（P1 concept/state 判别 · P2 gap 分流 ·
      P3 `edge.label` 边界 · P4 attachment 方向 · P5 Capacity 取舍判据）+ 3 处部分暴露 + 1 处激励冲突；
      补丁只含通用规则，未写入任何 fixture 的具体答案（`results/prompt-parity-audit.md` §1/§5/§6）。
- [x] 两份 prompt + 两份 generation schema + 两阶段 runner 落地，`npm run test:grounding` 48/48 通过（零模型调用），
      覆盖 A ok + B 失败、malformed inventory 不许进入 Stage B、integrity FAIL 不自动补、`--run` 撞车退出码 3 等情形
      （`execution-prompt.md` Phase 1c/1d）。
- [x] 四段归因体系建立（E1 Extraction / E2 Selection / E3 Encoding / E4 Escape-hatch，外加 E5 Over-representation；
      E3.false-represented 作为 E3 子类而不新增 E6），并逐条落到具体 §key / 行号 / 产物 label（`results/final-gate.md` §1）。
- [x] E 侧机制保留成立：high 臂上 bounded failure / abnormal path / manual intervention / privilege boundary /
      invariant 全部有承载（F07 为 0–1/3），`run-06` 显式写出「仅管理员强制补偿」（`results/e1-diagnostic.md` §1、
      `results/e-repro-analysis.md` §1、`results/final-gate.md` §3）。
- [x] E5 over-representation 被压住：`1:1 target 占比 42% → 13–32%`、`elements 81 → 12/13`、`max fan-in 8 → 14–17`；
      E/run-05 13 elements 在 run-06 复现为 13（`results/e-repro-analysis.md` §2、`results/final-gate.md` §3）。
- [x] 成本实验已测且已判决：Stage A 省 80%（reasoning 93%）· Stage B 省 61%（reasoning 65%），但 low 两个样本各自
      复现退化 → **low 不设为默认，仅作显式成本模式**（`results/cost-experiment.md`、`results/low-effort-verdict.md`）。
- [x] 悬案裁决：`run-08` 的 S-40 不属于「不可以砍」五类，为合法 omission；E 的 6 条 omitted 与 D 的 2 条 omitted
      均逐条核实（`results/final-gate.md` §2/§4）。
- [ ] D 侧核心基础关系 E3 未关闭：`D/run-04` 的 12 条边里 `depends-on = 0`、自环 `= 0`，
      `Task --depends-on--> Task` 只剩 `C-PlanStructureAndState` 的 constraint 层表达（`results/final-gate.md` §4、
      `results/d1-regression.md` §2–§3）。
- [ ] Gate = PARTIAL PASS 的处置未登记：用户已把本 feature 记为 Completed / Closed（2026-09-26），但未在
      `validation-checklist.md` 上签署判定，也未登记「接受该结论并转为已知限制」还是「保留为未关闭项」。
- [ ] 原定的 `D × 3 + E × 3 = 6` 个新臂 run 未按计划完成：实际 D 只有 1 个完整两阶段 run（`run-04`），
      E 的多数 run 只有单阶段或复用冻结 inventory；Stage A 的独立四维评价（Recall / Precision / Granularity /
      Provenance quality）也没有落进 `results/inventory-review.md`（该文件仍标注「未开始」）。

## Risks and compatibility

- **low effort 不设为默认（本 feature 最重要的纪律）**：成本优势真实（Stage A 省 80% / reasoning 省 93%；
  Stage B 省 61% / reasoning 省 65%），但**两个 low 样本各自复现**退化：① ontology —— `state` 元素 2/2 消失
  （high 为 3/3 有）；② structural —— 状态机/转换序列被压平 2/2；③ `run-11` 还**静默丢掉 bounded failure**
  （S-33 声称 `represented → E-08`，但 E-08 与全图 `REFUND_FAILED` / 「连续 10 次」均 0 命中，属 E3.false-represented）。
  因此默认策略是 **high 为默认、low 仅作显式成本模式**；不得因为省 token 就把 low 设为默认（`results/low-effort-verdict.md`）。
- **「用户裁决收紧 max_tokens」这类结论有前提，不可外推**：`results/stage-a-reliability.md` §2.1 的结论
  （「压预算让它更紧凑」不成立、收紧 `max_tokens` 是确定性截断而非压缩手段）成立于一个前提 —— 该端点把
  `max_tokens` **同时覆盖 reasoning 与 content**，且 reasoning 占 output 的 80–90%（e/run-03：16386/16384 顶格，
  其中 reasoning 14634）；由此推出的「两个阶段的 ceiling 都必须给足」（Stage A 65536、Stage B 抬到 131072）
  以及 `results/cost-experiment.md` 的「两侧 ceiling 完全相同」冻结条件同样依赖该前提。若上游改为分别计量
  reasoning 与 content，本节结论与处置都需要重新评估，不能当作模型能力结论沿用。
- **两处已知混杂**：① 新臂同时改了两件事（两步生成 + 按 parity audit 修的 5 个 prompt 缺口），要拆开归因需加第三臂，
  本阶段未做；② 模型漂移 —— `Historical control from F07. Same declared model / provider / generation params,
  but backend model version may not be independently pinned.` 因此 F10 的对照是 **engineering comparison，
  不是严格随机对照实验**（`brief.md` §8、`execution-prompt.md` 已知混杂 ①/②）。
- **D 侧基础关系退化未关闭（E3）**：`Task --depends-on--> Task` 从图上消失，只剩无环性 / 满足条件的 constraint 层；
  这违反 F09 冻结的三层原则，且**不是** E1（S-56 / S-63 / S-64 都在 inventory 里）、也**不是**「L0 不需要细节」。
  处置是保持未关闭，不用 prompt 打补丁；任何复用 D 产物的后续 feature 不能假设「关系层完整」。
- **Constraint Composition / Compression Gap**：D 的 `C-PlanStructureAndState` 吸收 39/136 条语义、
  E 的 C-01 / C-02 / C-03 各吸收 12–17 条，label 只到类别名 —— coverage 保得住但 L0 自描述性触到当前 Contract
  表达面上限。F10 只登记不设计（`results/final-gate.md` §6、`results/d1-regression.md` §4.1）。
- **Stage A 的地基仍偏脆**：6 次 Stage A 中 E 侧 JSON 可靠性 1/3（e/run-01 未转义 ASCII 双引号、e/run-03 截断），
  D 侧出现粒度漂移 1.9×（154 → 264 → 289 条，两条带 shape 缺陷）；修正 ①+②+④ 后 D/run-04 为 136 条、0 格式缺陷、
  E/run-04 为 95 条，但「抄写式穷举」这一新失败形态只被压制、未被系统性排除（`results/stage-a-reliability.md`）。
- **观察项（登记不改）**：E 组 §8 速查表条目在 run-05/06 走 `topic-only`、run-08 有两条挂到 E-01 / E-06
  （target 文本不含该条目），属粒度选择不一致；`run-07` 在 `max_tokens_b = 65536` 下 `finish_reason=length`
  （reasoning 61261、raw 10664），永久保留为预算不足截断样本（`results/final-gate.md` §3、`results/e-repro-analysis.md` §3）。
- **产物集合不是单次同构运行**：15 个 run 目录跨多轮 prompt 修正（Stage A/B 各记录 sha 指纹），包含
  `d/run-02/03` shape-invalid、`e/run-01/03` parse-failed、`e/run-04` Stage B 零 content、`e/run-07` 截断等失败样本；
  引用某一 run 时必须同时报出它的 prompt 指纹与参数，不能把不同分界的 run 当作同一实验。
- **回滚与兼容**：本 feature 只新增 prompt / schema / runner 与实验产物，未改 Contract、`schema/framework-map.schema.json`
  与 `check-map`，因此没有运行时兼容性风险；回滚等于停用两阶段 runner 与两份 prompt，`experiments/semantic-grounding/**`
  可原样留档。反向地，本 feature 的结论会**阻塞**后续 feature 对 D 类文档「基础关系层完整」的假设。

## Completion evidence

- Verification evidence: `docs/log/artifacts/F10-semantic-grounding/verification-summary.md`
- Independent review: `docs/log/artifacts/F10-semantic-grounding/subagent-review.md`（harness 接入前关闭，未留下独立审查记录；已记录补偿方式与可复核位置）
- 历史材料: `docs/log/artifacts/F10-semantic-grounding/{brief.md,execution-prompt.md,validation-checklist.md,results/**}`
