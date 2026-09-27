# Constraints

## Product

- **AI 负责整理，不负责批准。** AI 可以提出结构、关系、Decision、Gap 与 Open Question，但不得替用户批准设计，
  也不得把未决事项补成确定结论。
- **`design-review.json` 与 `human-review.json` 必须分离。** 分析结果中 `decisions[].status` 一律 `pending`；
  人工审批状态只由用户点击写入 `human-review.json`。主进程不得存在自动保存 `human-review.json` 的代码路径。
- **Current、Target 与 Evidence 必须分清。** 文档声明的现状（`document-claim`）不得写成代码核实过的现状
  （`source-verified`）；两者不能画进同一张图或同一条证据链。
- **只测过有限样本。** 现有 gold fixture 是单文档（540 行）样本；跨文档类型的结论必须标注为 Gate 结论而非通用规则。

## Security and privacy

- 不提交密钥、凭据与个人生产数据。`ai:plan` / `ai:block` / `ai:framework-map` / `f10:run` 的凭据只从环境变量
  （`OVERVIEW_PLAN_BASE_URL` / `OVERVIEW_PLAN_API_KEY` / `OVERVIEW_PLAN_MODEL`）或本机 DSH 设置读取，
  两者都没有时脚本必须显式报错退出，不得静默失败。
- `.env*`、`human-review.json`、`tmp/` 已在 `.gitignore` 中；run 产物不得写入 key（`request.json` 只记录模型、endpoint、
  prompt 指纹、文档 sha、消息 sha 与结局）。
- 应用默认**完全离线**运行：只有显式的 `npm run ai:*` / `f10:run` 会发起外部模型请求。

## Engineering

- **不要让 AI 直接生成 HTML 替代结构化数据 + 确定性 renderer。** 页面由 renderer 按契约渲染，
  AI 只产出结构化 JSON。
- **不要绕过已有验证链。** 修改产物前先看它由哪个 validator 把关（`check-plan` / `check-block` / `check-map` /
  `check-overview`），并让 PASS / FAIL 的判据保持单向。
- **受控词表必须由校验器封闭。** `type` / `role` / `edges[].type` / `shape` 都不许靠自觉——表外取值一律 FAIL。
- **失败请求绝不覆盖既有产物。** 每次 run 写独立目录，只在 temp 写入 + read-back 校验成功后才原子 rename；
  失败留下的痕迹是重要实验数据，不得清理。
- **页面层不得读持久化内部结构。** 渲染进程只消费主进程通过 `preload.js` 暴露的最小 IPC API 与
  `app/shared/` 里的共享语义模块，不得自行读文件或复制 Gate / reviewLevel / Evidence 级别等判定逻辑。
- 改动持久化数据（`fixtures/**`、`experiments/**` 的产物结构、schema）前，必须先说明兼容性与迁移行为。
