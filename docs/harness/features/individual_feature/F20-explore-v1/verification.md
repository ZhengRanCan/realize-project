# F20 Verification

## Required commands

| Layer | Command | Evidence |
| --- | --- | --- |
| Static | 修改/新增JS逐个node --check | exit 0 |
| Feature | node scripts/test-explore-projection.js | addressability、authority、input purity通过 |
| Regression | npm run test:all | 全部离线suite与搬迁Preview通过 |
| System | npm run selftest | L0–L3实际Explore组合/键盘/Back/Resolve/session通过 |
| Preview | npm run verify-preview | 共用renderer通过；搬迁包由test:all覆盖 |
| Harness/docs | npm run verify:harness / check:docs / check:experiments | 无错误/漂移 |

## Automated user paths (real Electron)

- [x] 四个Reading深度进入Explore；切换Focus；返回阅读恢复原occurrence、disclosure、展开、selection、scroll、focus。
- [x] 从T-05 occurrence进入Block/inspection→Explore→Open in Reading(Element)→Back返回Explore→Back to Reading返回原T-05现场。
- [x] attachment-only constraint不可Focus；semantic edge/membership可遍历；self-loop/annotation/relationGap披露。
- [x] Topic canonical按钮不可用；Topic blockIds三态保持；unknown/unsupported不污染现页/历史。
- [x] 缺Map、独立Map、切包与保存隔离；搬迁Preview同实现完整路径。

## Passing evidence

记录命令日期/结果及关键路径到F20 verification-summary，Native独立审查到subagent-review。
路径是自动化操作，不冒称用户手工验收；acceptance全部满足后同步passing。
