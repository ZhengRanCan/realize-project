# F19 Independent Review

2026-10-03，Native 只读 reviewer `/root/f19_review`；未修改文件、未访问外部 API。
最终结论：无剩余 P1/P2。

| 发现（P2） | 修正与验证 |
| --- | --- |
| canonical Element 没有真实 Back | L0 补返回按钮，测试改为真实点击 |
| remount 沿用旧事件树闭包 | AbortController 每次解绑/重绑，fresh selection 非空断言 |
| canonical subject 可见性依赖焦点 | 单独捕获 canonicalElementId；移焦→下钻→Back 验证可见 |
| L3 恢复 source 回复未隔离新请求 | inspectionRequest/coordinate身份/session/generation/host fencing；真实 holdNextRead 暂停回复回归 |

修正后的 selftest 与完整 test:all（含搬迁 Preview）通过。Back≠Resolve、identity/occurrence/inspection/fragment 边界保持。
