# F18 Verification Summary — L3 Inspector

状态：**blocked**。运行时资料配对与 L3 产品入口尚未完成。
用户于 2026-10-03 选定“资料清单 + 同一分析目录”方案；
[书面设计](runtime-bundle-design.md) 已形成，等待审阅后细化合同和实施计划。

| 项 | 位置 |
|---|---|
| 两条核查路径互不合并的证据 | 本节 |
| 无 claim-level 结论的证据（结构断言，不是字符串断言） | 本节 |
| §N → section range（不伪造 exactLine）的证据 | 本节 |
| fragment provenance ≠ identity 的证据 | 本节 |
| 契约 §6 矩阵 cell 前后值 | 本节 |
| 独立审查 | `subagent-review.md` |

## 命令记录

2026-10-03 在拉取分支 `baa459c` 后检查，以下均 exit 0：

| Command | Result | Scope |
| --- | --- | --- |
| npm run test:all | passed | 既有离线测试；docs 114/0 broken，experiments index up to date |
| npm run selftest | SELFTEST PASSED | 既有 Electron 导入、L0/L1/L2、Source 与审核保存路径 |
| npm run verify:harness | 20 features, 0 errors | 合同与证据元数据 |
| node scripts/test-reading-runtime.js | 8 assertions | 旧 Overview 的 L2 projection 与 renderer 纪律 |
| node scripts/test-l1-topic-projection.js | 9 assertions | 既有 Topic projection/runtime |
| node scripts/test-l3-inspector-projection.js | 4 assertions | 手工构造输入的 L3 helper，未经过产品入口 |

以上为实施前基线，不能作为资料包加载或完整 L3 路径的完成证据。

## Reproduced Runtime Gap

- 当前 L2 输出字段没有 covers；直接交给 projectL3 报 `planBlock.covers is not iterable`。
- 真实 Plan 有 87 sourceUnits；默认 fixture Overview 中有 0 处 sourceUnitIds，
  现有 stage2-full Generated 中有 153 处。runtime 尚未消费后一份表达资料。
- 悬空 review ID 在 projectL3 中经 filter(Boolean) 变为无记录，错误未被披露。
- Source IPC 固定读取仓库 registry，未绑定当前载入文档。
- 尚无 bundle / IPC / renderer 下钻证据、人工完整路径或本轮独立审查；F18 保持 blocked。
