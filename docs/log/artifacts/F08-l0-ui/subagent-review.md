# F08 Independent Review

- Status: `not_recorded`
- Reason: F08 仍在进行中（`active`），第一轮只完成 deterministic UI integration 并停在
  `TECHNICAL PASS / UX VALIDATION PENDING`。**F08 尚未关闭，独立审查留到 passing 之前**：现在写审查结论
  只会把未完成的轮次伪装成已审过。
- Decision: 本 feature 目前**不依赖** subagent 审查来支撑任何状态；`passing` 时才会要求独立审查记录，
  届时需要覆盖的正是下面「事后可复核的证据」里的四项，外加 Track A 的人工结论。

## 当前（未关闭）的审查缺口

| 缺口 | 现状 | 关闭前需要什么 |
| --- | --- | --- |
| 独立审查记录 | 无 | 由非执行方 reviewer 复核 view model / layout / preview / selftest 四层证据与范围红线 |
| 人工 UX 验证 | 只有 Round 0 定性第一印象（用户本人） | 正式计时 Track A（D + E），5 个数据 + 1 句主观，写入 `results/track-a-round1.md` |
| Phase 状态口径 | `brief.md` 与 git 记录显示 Phase 3/4 第一版已完成；`validation-checklist.md` §5–§6 仍标「待做」 | 关闭前由 reviewer 统一口径，再决定 `knownUnverified` 的最终内容 |
| 断言数口径 | **已解决（2026-09-27）**：统一为执行断言数 —— View Model 34/34 · Layout 42/42 · Preview 130/130（7 份预览）· selftest 13 条 L0 集成断言（总计 66 条）。早期 51 / 119 / 127 / 「56 处调用点」是更早轮次的真实值或静态数法 | 无需再重跑；口径定义见 `verification-summary.md`「断言口径」，`feature.md` / `verification.md` / `validation-checklist.md` 已同步 |

## 事后可复核的证据

| 复核对象 | 位置 |
| --- | --- |
| 范围冻结与硬约束（不改 schema / contract / check-map、不调模型） | `execution-prompt.md` §硬约束、`validation-checklist.md` §1 |
| 输入边界与 sha 一致性 | `validation-checklist.md` §2、`execution-prompt.md` §Phase 1（入口/出口 sha 比较，输入被改就抛错） |
| View model / Preview 断言口径 | `verification-summary.md`「断言口径」（唯一口径）、`validation-checklist.md` §3–§4、`execution-prompt.md` §Phase 1–2（历史任务书的数字保留不改） |
| 人工 Round 0 三条发现与 Phase 4.1 动作 | `results/track-a-round1.md` §0.1（含用户原话） |
| 三个实现坑（静默失败 / 预览未加载 renderer / 布局丢元素） | `brief.md` §3、`results/track-a-round1.md`「这一轮顺带暴露的三个实现问题」 |
| 命令记录与已知偏差 | `verification-summary.md` |

## Reviewer 视角下最需要留意的三点

1. **测试复制产品逻辑的历史**：第一版 selftest 手抄状态切换，导致「自动化全绿、真实按钮静默失败」。
   现有 `loadL0(path)` 唯一入口已修复，但复核时应确认断言仍在调真实入口，而不是新的副本。
2. **断言只查字符串的风险**：静态预览曾未加载 renderer 而断言只检查那行文字存在。复核 preview 断言时
   要确认它盯的是脚本顺序与真实渲染行为。
3. **材料内部状态不一致**：Phase 3/4 的「完成」与「待做」两种记录并存，`knownUnverified` 按未完成登记。
   这是关闭前必须先解决的口径问题，而不是可以直接抄进结论的事实。
