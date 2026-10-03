# F21 Independent Review

2026-10-03，Native explorer `/root/f21_review` 只读独立审查。无剩余 P1/P2。

发现并修正一项 P2：最初窄窗口截图实际为 1008×720，与声明的 640×720 不一致。
窗口最小宽度改为 640，测试固定并恢复 zoomFactor；测试明确断言 CSS viewport 和截图 getSize，双 RAF 等待绘制。
重新生成的 source-narrow.png 实测 640×720，关闭按钮与焦点可见。

最终复验确认原生键盘分层返回和焦点、decisions 上下文编辑/IME/修饰键保护、Reading 与 Explore 无方向关系、15轮 DOM/ID/共享栈与重复回调保护、版本和有限输入性能证据。
独立运行纯预算测试与新增 Electron 测试语法检查通过；完整 selftest/regression 由主 agent 执行。
未新增语义层、resolver 或 verification 状态，未声称用户手工验收或 F08 Track A 通过。

