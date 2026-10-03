# F21 Verification

## Required commands

| Layer | Command | Result |
| --- | --- | --- |
| Static | 修改/新增JS逐个node --check | exit 0 |
| Feature | node scripts/test-product-maturity.js | 压力fixture预算/语义不变通过 |
| System | npm run selftest | 真实键盘/窄窗口/焦点/live状态/性能/循环回归通过 |
| Regression | npm run test:all | 所有离线suite及搬迁Preview通过 |
| Preview | npm run verify-preview | 共用renderer离线路径通过 |
| Input | npm run validate / audit / check-overview | 原warnings保留，无failure |
| Harness/docs | verify:harness / check:docs / check:experiments | 无错误或漂移 |

## Real Electron automated paths

- [x] Tab/Enter/Space走Map→Topic→Block→L3→Explore；Escape逐顶层返回，focus可见。
- [x] 输入框/SELECT/contenteditable/IME/修饰键不触发A/R/L/G/D或非预期返回；无自动审核保存。
- [x] 640×720与正常尺寸：主要工具和出处关闭可访问，无整页横向溢出；长标题有完整键盘披露。
- [x] relates-to的SVG不带方向marker，focus/review/Explore文本不赋方向；认识论状态仍可区分。
- [x] Gold与压力输入预算测量，15轮导航与开关无重复ID/DOM/处理器累积；JSON和截图可复核。

## Passing evidence

用户委托自主完成；以上为真实Electron自动化操作，不冒称用户手工体验判定。
逐项映射规范→行为→测试，独立审查后同步acceptance/index/dashboard和机器保障。
