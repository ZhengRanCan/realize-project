# Experiments

实验产物目录。**每次运行一个独立目录，失败痕迹必须原样保留。** 这里放的是原始证据，
不是产品运行时读取的数据；产品只读 `fixtures/**` 与装配后的 `experiments/stage2-full/overview.generated.json`。

产物目录**原地保留在旧路径**（见 `docs/decisions.md` 2026-09-27 条），因此其中的
`run-meta.json` / `request.json` 里记录的是规范化前的路径（例如 `docs/framework-map-contract.md`，
现为 `docs/specs/framework-map-contract.md`）。映射表见 `docs/README.md` 的 Path mapping。

## 归属映射

**机器可读的逐 run 归属表是 `index.json`**（由 `scripts/index-experiments.js` 生成）：

```bash
npm run index:experiments     # 重新生成 experiments/index.json
npm run check:experiments     # 校验索引与现状是否一致（漂移则退出 1）
```

归属规则是确定性的，按优先级：run 目录里的 `run-meta.json.feature` → 区域归属 → 记录
`request.json` 的 `promptPath` 供人工复核。每个单元都带 `provenance` 字段，说明归属与状态是从哪读出来的：
`run-meta`（最完整）/ `stage-trace`（只有阶段级痕迹，例如 Stage B 被 kill 的 run）/ `request`。

## 按 feature 看

| Feature | 单元数 | 区域 | 是什么 |
| --- | --- | --- | --- |
| **F01** | 35 units + 6 artifacts | `stage2/`、`stage2-full/` | Stage 2 pilot 与全量 run（21 个 block）、`_first-attempt-failures/`、`_before-fix/{O-05,O-08}`；F01 的问题清单与修复对象 |
| **F07** | 16 units | `framework-map-generation/` | `fixture-{a,b,c,d,e}/run-NN`：L0 map 生成的真实请求与产物 |
| **F08** | 6 artifacts | `l0-ui/` | L0 静态预览快照（`preview-{a,d,d-overbudget,d-selfloop,e,e-human}.html`） |
| **F10** | 15 units | `semantic-grounding/` | 两阶段 run（Stage A inventory → Stage B map）：`fixture-d/run-01..04`、`fixture-e/run-01..11` |
| *baseline* | 5 artifacts | `reports/` | **F 系列之前**的 Stage 1 计划对比报告，没有对应 feature |

> `baseline` 不是笔误：`reports/stage1-run-report.md`、`stage1-run-4-5-report.md` 是 2026-09-25
> 「模型生成的 overview-plan 对比 Gold」的观察报告，属于 MVP / Phase 1 基线；只有 `stage2-pilot-report.md`
> 与 F01 的 pilot 直接相关。

## 各区域详情

| 目录 | 内容 | 复现入口 |
| --- | --- | --- |
| `framework-map-generation/` | 每次 run 五个产物：`request.json`、`raw-response.txt`、`framework-map.json`、`check-map.txt`、`run-meta.json`；目录内另有 `README.md` 记录 F07 §3 的四条实验纪律 | `node scripts/generate-framework-map.js --fixture a`（消耗额度）；离线安全验证 `npm run test:ai-map` |
| `semantic-grounding/` | 两阶段 run：`semantic-inventory.json`、`map-selection.json`、`framework-map.json`、prompt 指纹与 `run-meta.json` | `node scripts/run-semantic-grounding.js`（消耗额度）；离线验证 `npm run test:grounding` |
| `stage2/` | 6 个 block 的试点产物（`raw.md`、`block.generated.json`、`request.json`、`check-block.txt`）+ `_first-attempt-failures/` + `pilot-summary.json` | `node scripts/ai-block.js`（消耗额度）；离线验证 `npm run test:block` |
| `stage2-full/` | `blocks/O-01…O-16/`（21 个 block，含 `O-04b`、`O-04c`、`O-10b`、`O-10c`、`O-11b`）+ `_before-fix/{O-05,O-08}` + `overview.generated.json`、`overview-preview.html`、`check-overview.txt`、`manifest.json`、`full-run-report.md` | `npm run assemble` → `npm run check-overview` → `npm run build-preview`；报告用 `npm run report:full` / `npm run manifest:full` |
| `l0-ui/` | 6 份 L0 预览（离线，零模型调用） | `npm run l0:preview` |
| `reports/` | F 系列之前的报告与 manifest，是结果记录 | 不重新生成 |

## fixture 与 feature 的对应

| Fixture | 语境 |
| --- | --- |
| A | Context Consumption（最早样本，F03/F04 的语境） |
| B / C | Data Model heavy / Process heavy（F05 跨文档类型验证） |
| D / E | Goal-Plan-Task 状态模型 / F13–F16 售后 runbook（F09 资格选择，F10 复测） |

`framework-map-generation/` 与 `semantic-grounding/` 的 run 目录名里带 fixture 字母，可据此回溯它属于哪一类文档。

## 命名与阅读约定

- `run-NN` 编号自动递增，`--run N` 撞车时生成器直接拒绝（退出码 3）；**没有**任何共享的 `latest-*.json`。
- 失败请求绝不覆盖既有产物：只有 temp 写入 + read-back 校验成功后才原子 rename。
- validator FAIL 的产物必须原样保留 —— "AI 成功返回 + JSON 可解析 + HARD FAIL"是最重要的实验数据之一。
- 读旧记录时，规范化前路径 `docs/features/**` 一律对应 `docs/log/artifacts/F*/**`；规范化前的 `docs/framework-map-contract.md`
  对应 `docs/specs/framework-map-contract.md`。
