# F22 Verification

## Required Commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| L1 static | 对每个修改的 JS 分别执行 node --check；git diff --check | yes | 静态检查输出 |
| L2 migration | 迁移前后文件清单及 SHA256；旧路径映射、默认路径与 Git 忽略规则的结构断言 | yes | 迁移回归与完整性记录 |
| L2 regression | npm run test:all | yes | 既有 validator、Reading、生成器 stub、session 和便携 Preview 通过 |
| L3 compatibility | npm run validate / npm run audit / npm run check-overview | yes | Gold 与历史 Generated 的 verdict 保持 |
| L3 system | npm run selftest | yes | 默认折叠、展开旧入口、搬迁后资料包和 L3 的真实界面操作 |
| L3 preview | 搬迁后的资料包 Preview 生成与真实 Electron 渲染 | yes | 默认 Map 与查出处保持 |
| Documentation | npm run check:docs / npm run check:experiments | yes | 活跃引用及旧路径解析不失效、实验索引未丢条目 |
| Harness | npm run verify:harness | yes before passing | 合同与证据元数据 |

标准验证只使用离线输入与 stub；不调用外部模型。
实施计划将规定新迁移测试的文件名和调用顺序，并登记到本 feature scope。

## User Paths

- [ ] 新启动首屏：资料包入口立即可见；旧入口默认不可见，键盘可展开开发入口并加载 fixture / Review / Map。
- [ ] 从 workspace 下的既有包打开 Map，进入 Topic/Block，再分别查原文与审阅材料；关闭回原位置。
- [ ] 搬迁带人工审核的本地包后，只在原包的人工文件中保存；未保存状态、失败和取消仍按 F18 隔离。
- [ ] 搬迁后的只读 Preview 默认显示框架图，原文与 Evidence 分开，保存禁用。

可用真实 Electron 集成证据覆盖上述路径；若采用人工操作，记录日期与结果，不把自动化操作称为用户手工验收。

## Passing Evidence

- 本轮登记阶段的 docs/harness 检查只证明 feature 文件自洽。
- 实现后将命令、完整性记录与真实路径证据放在本 feature artifact 目录。
- 实现代码需独立审查，发现的问题修复并复查后才能完成。
- knownUnverified 与 humanReviewRequired 清空且验收项全部完成后，才可标 passing。
