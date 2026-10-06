# F32 Verification

## Required commands

| Layer | Command / check | Required | Evidence |
| --- | --- | --- | --- |
| Static | 修改 JS 的node --check；git diff --check | yes | 实施后登记 |
| Completion | 当前版本/依赖闭包/缺项及伪完成测试，计划登记确切命令 | yes | 上游修改后旧证明失效 |
| Integration | 受控Provider → 真实Runner/工具/validator/assemble/export/verify | yes | 完整包与失败轨迹，不stub领域实现 |
| Publication | 导出失败/取消/迟到/重复提交/跨run与原包保护 | yes | 真实文件/提交边界 |
| System | npm run selftest；当前包实际Electron/搬迁Preview L0/L1/L2与来源 | yes | 既有Renderer行为保持 |
| Regression | npm run test:all | yes | identity/authority/校验口径保持 |
| Documentation | npm run check:docs；npm run verify:harness | yes | 合同和状态 |

## Manual paths

- [ ] stopped / structurally_complete / completionGate / quality_status分别正确；结构PASS与quality unreviewed可同时存在，不冒充内容质量已通过。

- [ ] 受控多轮轨迹完成真实工具生产、装配/验证和打开结果。
- [ ] 模型说完成但缺项 → 拒绝；修正后按当前版本重新检验。
- [ ] Plan/Source/Review/规则指纹变化 → 对应proof和closure不能复用；Map变化只重验实际依赖和M/P关系，保留无关Plan/Block。
- [ ] 取消或写盘失败 → 不覆盖旧结果，无人工审核自动写入。
- [ ] trace能解释失败与每次版本变更；用户接受完成/交接标准。

## Passing evidence

离线集成证明运行时/工具/协议正确，不证明真实模型质量。失败与未知状态诚实记录，实际模型生成和人工内容抽查留给 F33。
