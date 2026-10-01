# F12 Independent Review

状态：通过。2026-10-01，按用户授权由 Codex 执行审查验收。

审查范围为 F12 的投影、renderer、真实入口和回归断言。结论：通过。

- `scripts/l0-view-model.js` 只按输入字段存在性投影 `blockIds`；未改动 F11 判定为合法 fallback 的站点。
- `scripts/test-l0-view-model.js` 先记录旧实现的失败，随后以字段存在性和空数组 shape 断言 Unknown / Known(0)。
- `app/renderer/l0-map.js` 将三态映射为 `data-block-ids-state="unknown|empty|known"`；`test-l0-preview.js` 断言两种状态各出现一次，避免消费端重新折叠。
- 首轮审查发现 selftest 的 Known(0) 只直调 view model；已修正为两份 map 都经过 preload / IPC / main，且随后完整交互回归仍通过。

未发现应阻塞 F12 的问题。F13 才负责把其余状态空间建立为通用 projection boundary；本次没有扩展该范围。
