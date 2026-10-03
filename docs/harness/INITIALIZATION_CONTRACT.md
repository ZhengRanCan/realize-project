# Initialization and Verification Contract

## Setup

```bash
git clone https://github.com/ZhengRanCan/realize-project.git
cd realize-project
npm install     # 首次需联网下载 Electron（约 100 MB 以上）；可用 npmmirror 镜像
npm start       # 启动应用；首屏点「打开分析资料包」选择 reading-bundle.json
```

环境要求：Node.js 18 LTS 或更高、桌面操作系统（Windows / macOS / Linux）、无需数据库或账号。
应用本身**完全离线**运行；只有显式调用 `npm run ai:*` / `npm run f10:run` 才会访问外部模型。

首次可用 `npm run bundle:example` 导出本地样例，再选择其清单；命令和目录约定见
[Reading Bundles](../../workspace/README.md)。已存在的分析目录拒绝覆盖。旧「打开 fixture」入口仍可用于回归。

## Standard verification

| Layer | Command | Purpose |
| --- | --- | --- |
| L1 static | `npm run validate` | fixture 的 Schema 校验 + 一致性检查 |
| L1 static | `npm run audit` | 覆盖审计：原文每节被引用、每条 Decision 能关联 |
| L1 static | `npm run check:docs` | 文档引用检查：markdown 里指向仓库内文件的路径是否真实存在 |
| L1 static | `npm run check:experiments` | `artifacts/experiments/index.json`（逐 run 归属表）与实验产物是否一致 |
| L2 feature | `npm run test:all` | 既有 validator / L0、Reading projection、source / bundle / session、保存隔离、便携 Preview 与索引校验；Preview 测试会启动 Electron |
| L3 system | `npm run check-overview` | 装配后的 overview 是否合格（覆盖率 / provenance / 段落结构） |
| L3 system | `npm run verify-preview` | 在真实 renderer 里渲染静态 Preview 并断言 |
| L3 system | `npm run selftest` | 真实 preload / IPC / renderer 的资料包 → Map → Topic → Block → 两条 L3 路径，以及旧入口、审核保存、异步隔离、键盘返回 |
| Harness | `npm run verify:harness` | feature 合同、状态机与证据元数据 |

每个 feature 可以在 `verification.md` 里收窄这些命令，但不能在没有其合同标为必需的层的情况下声明 `passing`。

## 需要外部凭据的命令（不属于标准验证）

| Command | Note |
| --- | --- |
| `npm run ai:plan` / `npm run ai:block` / `npm run ai:framework-map` | 会调用外部模型，凭据按 `CONSTRAINTS.md` 解析；不参与任何标准验证流程 |
| `npm run f10:run` | F10 的两阶段实验运行器；同样消耗额度，不可作为验收证据 |

### 只读的维护命令（不产生模型调用）

| Command | Note |
| --- | --- |
| `npm run index:experiments` | 重建 `artifacts/experiments/index.json`（逐 run → feature 的归属表） |
| `npm run check:experiments` | 校验该索引是否与现状漂移；改动了 `artifacts/experiments/` 之后必须重跑 |
| `npm run source` | 从被审 Markdown 重新切分 `samples/context-consumption/source-sections.json`（供 Source 回查） |

## 受限环境（沙箱 / CI）

两个 L2 脚本会**捕获子进程的管道输出**，在禁止进程间管道（例如受限沙箱）的环境里会整体失败：

- `scripts/test-check-plan.js`：用 `execFileSync` 取 `check-plan.js` 的 stdout，受限时每个用例都会拿到
  空结果并报 `退出码 null`。此时改为直接运行 `node scripts/check-plan.js <plan>`（退出码 0 = PASS）判断。
- `scripts/test-semantic-grounding.js`：用 `spawnSync(..., { stdio: 'ignore' })` 调起
  `run-semantic-grounding.js`，沙箱固定在 `workspace/tmp/tests/f10-selftest`，且启动时会 `rmSync` 整个沙箱目录。
  因此**同一时间只能跑一个实例**（并发实例会互相删除对方的中间产物）。
  它在本机可正常跑（48/48）；2026-09-27 规范化前出现过一次 `ENOENT ... tmp/f10-selftest/.../framework-map.json`，
  原因不是本脚本，而是规范化漏改的拼接路径 —— 见 `incidents/2026-09-27-split-path-migration.md`。

其余脚本（`test-check-block`、`test-check-map`、`test-generate-framework-map`、`test-l0-*`、`verify:harness`）
在受限环境下可以正常跑，全部零模型调用。

## 一键上手顺序

```bash
npm install
npm run test:all          # 离线、零模型调用
npm run validate && npm run audit
npm run check-overview
npm run selftest          # 不需要手工点击 GUI
npm run verify:harness    # 只在动 harness 元数据时需要
npm run check:docs && npm run check:experiments   # 文档引用与实验索引是否仍然自洽
```
