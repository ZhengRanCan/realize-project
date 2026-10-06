# F33 Verification

原F26实验现迁至F33，等待F32通过。本轮仅登记。下列均为实施后的要求，没有运行或声称通过模型实验。

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的 node --check；git diff --check | yes | 实施后记录 |
| Offline | 新实验驱动的离线测试（实施时登记确切命令），现有 test:ai-map / test:grounding | yes | 正常输入及传输/格式/引用/部分失败 |
| Live | 同一Single-Agent runtime与经确认的 DeepSeek 模型、两篇文档、同输入至少两次；逐 run 登记命令/参数 | yes | 原始 run / 指纹 / 校验 / 质量抽查 |
| Validation | 各 run 的适用 check-map / check-plan / check-block / check-overview 及 bundle 校验 | yes | 实际错误和警告，不能只记进程成功 |
| System | 现有 Electron / Preview 打开当次完整资料包；npm run selftest | yes | L0/L1/L2、来源与导航 |
| Regression | npm run test:all；npm run check:experiments | yes | 现有合同不被放宽，实验索引一致 |
| Documentation | npm run check:docs；npm run verify:harness | yes | 登记检查与完成检查分别记录 |

## Manual paths

- [ ] 原文输入 → AI 生产整套数据 → 显式配对 → 打开 L0 导读与图 → L1 主题/解释 → L2 表达 → 回查原文。
- [ ] 非 Gold 文档同路径，没有手工塞入预备 Review/Plan/Map/Guide，没有复用旧文章坐标。
- [ ] 抽查关键定义、边界、例外、未决事项与 Current/Target；对比 DeepSeek 重复结果，记录未覆盖的判断及后续跨模型比较方式。
- [ ] 阶段失败能识别且保留已完成产物；仅部分成功不标完整成功。
- [ ] 用户接受实验结论及后续接入范围。

## Passing evidence

有代码变化必须独立审查。保存原始失败数据但不保存成功校验 txt；私有文档/密钥不入库。若没有完整结果或重复稳定性证据，不以报告写完作为 passing；记录缺口并保持 blocked。
