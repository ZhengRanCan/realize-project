# Experiments

实验产物目录。**每次运行一个独立目录，失败痕迹必须原样保留。** 这里放的是原始证据，
不是产品运行时读取的数据；产品只读 `fixtures/**` 与装配后的 `experiments/stage2-full/overview.generated.json`。

产物目录**原地保留在旧路径**（见 `docs/decisions.md` 2026-09-27 条），因此其中的
`run-meta.json` / `request.json` 里记录的是规范化前的路径（例如 `docs/framework-map-contract.md`，
现为 `docs/specs/framework-map-contract.md`）。映射表见 `docs/README.md` 的 Path mapping。

## 区域索引

| 目录 | 归属 feature | 内容 | 复现入口 |
| --- | --- | --- | --- |
| `framework-map-generation/` | F07 | `fixture-{a,b,c,d,e}/run-NN/`：每次 L0 map 生成的真实请求与产物（`request.json`、`raw-response.txt`、`framework-map.json`、`check-map.txt`、`run-meta.json`） | `node scripts/generate-framework-map.js --fixture a`；离线安全验证 `npm run test:ai-map`。目录内另有 `README.md` 记录 F07 §3 的四条实验纪律 |
| `semantic-grounding/` | F10 | `fixture-{d,e}/run-NN/`：两阶段（Stage A inventory → Stage B selection）实验 run，含 `semantic-inventory.json`、`map-selection.json`、`framework-map.json`、prompt 指纹与 `run-meta.json` | `node scripts/run-semantic-grounding.js`（消耗额度）；离线验证 `npm run test:grounding` |
| `stage2/` | F01 前置的 Stage 2 pilot | 6 个 block 的试点产物（`raw.md`、`block.generated.json`、`request.json`、`check-block.txt`）+ `_first-attempt-failures/`（首次失败尝试）+ `pilot-summary.json` | `node scripts/ai-block.js`（消耗额度）；离线验证 `npm run test:block` |
| `stage2-full/` | F01 | `blocks/O-01…O-16/`（21 个 block，含 `O-04b`、`O-04c`、`O-10b`、`O-10c`、`O-11b`）+ `_before-fix/{O-05,O-08}` + `overview.generated.json`、`overview-preview.html`、`check-overview.txt`、`manifest.json`、`full-run-report.md` | `npm run assemble` → `npm run check-overview` → `npm run build-preview`；报告用 `npm run report:full` / `npm run manifest:full` |
| `l0-ui/` | F08 | L0 界面的静态预览快照：`preview-a.html`、`preview-d.html`、`preview-d-overbudget.html`、`preview-d-selfloop.html`、`preview-e.html`、`preview-e-human.html` | `npm run l0:preview`（离线，零模型调用） |
| `reports/` | F01 / F07 | harness 接入前写在 `docs/experiments/` 的报告：`stage1-run-report.md`、`stage1-run-4-5-report.md`、`stage2-pilot-report.md` 及两份 manifest | 报告是结果记录，不重新生成 |

## 命名与阅读约定

- `run-NN` 编号自动递增，`--run N` 撞车时生成器直接拒绝（退出码 3）；**没有**任何共享的 `latest-*.json`。
- 失败请求绝不覆盖既有产物：只有 temp 写入 + read-back 校验成功后才原子 rename。
- validator FAIL 的产物必须原样保留 —— "AI 成功返回 + JSON 可解析 + HARD FAIL"是最重要的实验数据之一。
- 读旧记录时，规范化前路径 `docs/features/**` 一律对应 `docs/log/artifacts/F*/**`；规范化前的 `docs/framework-map-contract.md`
  对应 `docs/specs/framework-map-contract.md`。
