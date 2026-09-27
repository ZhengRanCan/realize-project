# F06 Verification Summary

本文件把 harness 接入前的验证记录整理成当前口径。原始输出保持原样，见
`results/verification-output.txt`（实测为 **UTF-8 纯文本**：首字节 `3D 3D 3D`＝`===`，按 UTF-16LE 解码会乱码）
与 `results/notes.md`。日期只写材料里有的：2026-09-26（F06 执行与 F09 修复轮复跑）、2026-09-27（harness gate）。

## Commands

| Command | Date | Result | Note |
| --- | --- | --- | --- |
| `npm run check-map`（A） | 2026-09-26 20:44 | passed | HARD 0 · WARN 0 · INFO 2；`granularity sourceUnit`；elements 12 · edges 4 · attachments 7 · topics 5 · relationGap 0；coverage 87/87；`PASS（无契约违反）` |
| `npm run check-map`（B） | 同上 | passed | HARD 0 · WARN 2 · INFO 2；`granularity section (provisional)`；elements 12 · edges 6 · attachments 5 · topics 5 · relationGap 1；coverage 13/13；`PASS（无契约违反）` |
| `npm run check-map`（C） | 同上 | passed | HARD 0 · WARN 2 · INFO 3；`granularity section (provisional)`；elements 12 · edges 8 · attachments 4 · topics 6 · relationGap 2；coverage 19/19；`PASS（无契约违反）` |
| `npm run test:map`（＝`node scripts/test-check-map.js`） | 同上 | passed | 19 passed, 0 failed（原始输出段落标题为 `test-check-map`） |
| `node scripts/test-check-map.js`（F09 修复后复跑） | 2026-09-26 | passed | 29 passed, 0 failed；A/B/C/D/E 五篇 HARD 0 且全 PASS —— 输出记在 `docs/log/artifacts/F09-contract-adversarial-test/results/verification-output.txt`，不在本目录 |
| `npm run verify:harness` | 2026-09-27 | passed | harness 层证据，由主 agent 在收口时统一执行 |

> 运行头部记录：`===== Feature 06 · 三篇 Fixture 的 check-map 结果 =====` / `运行: 2026-09-26 20:44`；
> A 的段落标题为 `--- A（sourceUnit 粒度；需要 --plan）---`。
> 命令名取自 `results/notes.md` §1（本 feature 新增 `check-map` / `test:map` / `test:all` 三个 npm 脚本，现见 `package.json`）。

## 关键指标（F06 实跑，2026-09-26 20:44）

| Fixture | granularity | elements | edges | attachments | topics | relationGap | coverage | HARD | WARN | INFO | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | sourceUnit | 12 | 4 | 7 | 5 | 0 | 87/87 | 0 | 0 | 2 | `PASS（无契约违反）` |
| B | section (provisional) | 12 | 6 | 5 | 5 | 1 | 13/13 | 0 | 2 | 2 | `PASS（无契约违反）` |
| C | section (provisional) | 12 | 8 | 4 | 6 | 2 | 19/19 | 0 | 2 | 3 | `PASS（无契约违反）` |

单测：19/19（F09 修复后为 29/29，记录在 F09 的 `results/` 下）。

## 三篇的具体告警（照原始输出）

- A：WARNING 无；INFORMATIONAL = `I1 component = 0（正常形态差异，不是缺陷）` · `I2 state = 0（正常形态差异，不是缺陷）`。
- B：WARNING = `W4 T-01 只挂了一个 block / section` · `W5 relationGap[0] E-10 ⇢ E-09：「TypeScript / Python 两端实现必须与同一份 Golden Fixtures 产生逐字节相同的结果」（REVIEW REQUIRED —— 现有词表无法在不失真前提下表达）`；
  INFORMATIONAL = `I2 state = 0` · `I5 T-01 没有 L0 element（Topic 与 element 已解耦，合法）`。
- C：WARNING = `W5 relationGap[0] E-02 ⇢ E-01：「Candidate Inbox 持有 / 存储 Candidate」` · `W5 relationGap[1] E-07 ⇢ E-06：「Proposal 通过校验后被放行进入下游」`；
  INFORMATIONAL = `I1 component = 0` · `I4 非单链拓扑：收敛节点 E-04, E-08（按 consumes 归一化后的多入边）` · `I5 T-06 没有 L0 element`。
- 三篇报告末尾均附：`注: element budget 是 Warning；某类元素为 0 / 无主轴 / DAG / Topic 无 element 是 Informational，不是异常。`

## 单测覆盖（19 passed, 0 failed）

基线最小 map（HARD 0）· 未知 element type → HARD · 缺 provenance → HARD · provenance 指向不存在的小节 → HARD ·
悬空 edge 端点 → HARD · 表外关系词 → HARD · 无导航路径 → HARD · 原文小节无法解析 → 只 WARNING 不误报 HARD ·
element id 重复 → HARD · 主轴出现 constraint → HARD · element > 12 → WARNING 且不是 HARD · 未知 role → WARNING 且不是 HARD ·
relationGap → WARNING 且不是 HARD · Topic 只挂一个 block/section → WARNING · component = 0 与 state = 0 → INFORMATIONAL ·
Topic 没有 element → INFORMATIONAL · 出现收敛节点（DAG）→ INFORMATIONAL · 没有主轴 → INFORMATIONAL ·
词表确实从 schema 读（6 类 / 9 词）。

## 路径对照（输出内为规范化前路径，照实引用）

| 原始输出中的路径（规范化前） | 当前路径 |
| --- | --- |
| `docs/features/04-l0-framework-map/drafts/context-consumption.map.json` | `docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json` |
| `docs/features/05-l0-generalization-gate/drafts/fixture-b.map.json` | `docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-b.map.json` |
| `docs/features/05-l0-generalization-gate/drafts/fixture-c.map.json` | `docs/log/artifacts/F05-l0-generalization-gate/drafts/fixture-c.map.json` |

## 人工路径证据

- 材料里只有一条人工比对：check-map 报出的收敛节点与人工判断一致 —— C 的 `E-04` / `E-08`（`results/notes.md` §3.1：
  第一版用「入度 > 1」判 DAG 时 A / B / C 全误报，把 `consumes` 归一化到流向后只剩 C 报收敛）。
- reviewer 按 `validation-checklist.md` 的验收**没有记录**：§1~§7 的复选框全部仍为空，§8 的最终判定栏
  （`ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`）为空；`legacy-feature-registry.md` 第 64 行仍是「Executed（待验收…）」。

## 已知偏差

- **本目录是修复前快照**：`results/verification-output.txt` 停在 2026-09-26 20:44 —— 单测 19/19、只有 A/B/C 三篇。
  F09 修复轮（commit `48769ed`）改了同一份 `schema` / `check-map` / `test-check-map` / `contract` 后复跑 29/29 与五篇 Fixture，
  记录只落在 `docs/log/artifacts/F09-contract-adversarial-test/results/` 下；**F06 自身没有单独的回归验收记录**。
- **告警口径已变**：本目录里 B 的 `W4`（单点 Topic）是 Warning，当前代码已按 F09 裁决降级为 `I6`，并新增 `H8`（qualifiers 形态错）/ `W7`（qualifier 取值未知）/ `W8`（关系缺口密度聚合）。
- **小节解析已变**：F06 材料记录「section 粒度只支持数字标题，解析不到时出 W0 并跳过引用与导航校验」（`results/notes.md` §3.2 / §7），
  当前代码已换成围栏感知的 Markdown heading tree（F09 R1）。
- **无独立 schema 自检**：`schema/framework-map.schema.json` 没有 ajv 之类的 JSON Schema 校验器自检输出；
  现有证据只到 check-map 能解析 schema 并读出词表。
- **3 处 Relation gap 未补词、B / C 未重表达**：F06 决定不新增关系词，只用 `relationGap` 登记（B 1 条 / C 2 条）；
  F09 用 `qualifiers` 重表达了 D 的 6 条缺口（→ 2 条），但 B / C 的旧 gap 未重表达，因此不能算实测关闭。
- **编码说明**：`results/verification-output.txt` 是 UTF-8 纯文本（不是 UTF-16LE），本文件的所有引文都按 UTF-8 读取。

## Harness layer

- `npm run verify:harness` 由主 agent 在 2026-09-27 收口时统一执行（结果 `passed`，登记在本 feature 的 `evidence.commands`）。
