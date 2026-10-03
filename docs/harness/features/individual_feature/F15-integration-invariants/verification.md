# F15 Verification

| 层 | 命令或真实路径 | 结果 |
| --- | --- | --- |
| Static | main与两份F15测试逐个node --check | exit0 |
| Feature | node scripts/test-reading-integration.js | 真实projection/L1/registry/L3四组通过 |
| Product | npm run selftest | F15 DOM身份、状态、Back和L1方向；F19 Known(0)落点；F20四层返回 |
| Regression | npm run test:all | 全部suite及搬迁Preview |
| Preview | npm run verify-preview | 共用renderer离线只读路径 |
| Gates | verify:harness / check:docs / check:experiments | 无错误/漂移 |

- [x] L0选择→Explore→Back原现场、无resolver；O-01有效Known(0)bundlecanonical与Element唯一落点。
- [x] L2/L3真实DOM身份与Absent/Indeterminate、输入纯度；L1无方向关系。
- [x] 独立审查完成，没有剩余P1/P2。

用户授权自主收口，以上是Electron自动化，不冒称用户手工验收。
fixtureD无Plan，不要求无依据的O-01；Known(0)落点依据F19有效临时bundle。
