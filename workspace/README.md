# Local Workspace

这里存放本机资料，除本说明外不提交 Git。analyses 按文章与分析批次存放资料包，previews 放新预览，references 放外部参考，legacy-review 存旧单文件入口的新人工审核；已有根目录 human-review.json 继续原位使用。

## Temporary Files and Archives

- `tmp/<task>/` 放当前任务的临时材料；测试复用 `tmp/tests/`。任务结束后删除 agent 校验日志、提交说明、测试缓存和可重建输出。成功检查直接看终端，验收记录只保留命令、结论与关键证据。
- `archive/` 放仍需保留的旧材料：stage1-runs 按 run 归档早期生成结果，one-off-scripts 按任务或用途归档排查脚本，notes 放旧草稿，patches 放历史补丁，local-config 保留本地配置。归档不是新的运行输入目录。
- 失败排查日志可短期保留，解决后清理。新日志不散放 workspace 根目录，也不默认复制进正式验收目录。
- 分析资料包、人工审核、测试原文、Gold、正式实验与本地配置单独保留，不按临时输出处理。

2026-10-03 清理：55 个留存文件已归档并核对 SHA256；64 份临时日志/提交说明和 242 个缓存文件集中在 `tmp/discard/`，可整体删除。当前工具自动审批拒绝删除，实际只完成归拢，尚未释放这些文件的空间。

根目录 .f22-migration.json 是 F22 搬迁时的历史完整性清单；后续用户授权的归档和临时清理会改变当时路径，它不作为日常工作区状态检查。正式搬迁结论与受保护数据哈希仍在 F22 验收记录中。

## Reading Bundles

一篇文章的一次分析放在一个目录里。应用点「打开分析资料包」，选择其中的 `reading-bundle.json`；
有框架图时先进入框架图，再查看主题、解释区块和出处。

```text
workspace/analyses/<document>/<analysis>/
├── reading-bundle.json       统一入口：文件位置、哈希和明确配对
├── source.md                 本次分析使用的原文副本
├── source-sections.json      原文的章节坐标
├── design-review.json        审阅材料
├── overview-plan.json        语义单元与解释区块的规划
├── overview.generated.json   可选：区块的生成表达
├── framework-map.json        可选：框架图
├── reading-preview.html     可选：便携、只读预览
└── human-review.json         仅在用户点击保存后创建
```

这整个目录可以一起移动。运行时只跟随清单中的相对路径，不根据名字猜配套文件。
多个分析目录分别保存人工审核，避免互相覆盖。`workspace/analyses/` 下的分析资料不提交 Git。

## Example

在仓库根目录运行：

```bash
npm run bundle:example
node scripts/build-preview.js --bundle workspace/analyses/context-consumption/stage2-gold/reading-bundle.json --out workspace/analyses/context-consumption/stage2-gold/reading-preview.html
npm start
```

`bundle:example` 只用于首次创建；已存在的目录会拒绝覆盖。另一次分析需要给 exporter 指定新的 `--out`。
生成一般资料包时，显式提供 `--source`、`--design`、`--plan`、`--out`、`--analysis-id`，
有生成表达和框架图再提供 `--generated`、`--map`。文件之间的绑定、校验与降级规则以
[Reading Bundle Contract](../docs/specs/reading-bundle-contract.md) 为唯一规范。

缺少 Generated 时保留规划区块并披露表达未知；缺少某个生成区块时披露缺失。
没有 Map 时显示独立区块解释并提示缺少框架图。Preview 与应用共用投影和 renderer，人工审核保存仅在应用里操作。
