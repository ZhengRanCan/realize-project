# Incident: L0 页面真实入口静默失败，而 selftest 全绿

- ID: INC-2026-09-27-F08-SILENT-ENTRY
- Date: 2026-09-27（登记日；缺陷发现于 F08 Round 0 人工第一印象）
- Source feature: F08
- Trigger: 用户在 Electron 里第一次点「打开 framework-map.json」进入 L0 页面
- Symptom: 信息行显示"已加载"，但界面完全没有变化；控制台无可见报错
- Impact: L0 页面在真实入口下**不可用**，而集成自检仍然全绿 —— 也就是说回归套件给出了错误的信心

## Reproduction or evidence

记录在 `docs/log/artifacts/F08-l0-ui/results/track-a-round1.md` §0 与 `brief.md` §5：

```text
信息行显示"已加载"但界面完全没有变化 —— 真实入口调了一个不存在的 enterReview() 并静默抛错。
```

## Suspected root cause

selftest **手抄了一遍**状态切换逻辑，因此它验证的是那份副本，而不是产品的真实入口；
真实入口 `loadL0()` 调用了不存在的 `enterReview()`，抛出的 `ReferenceError` 被吞掉，
留下"已加载"的信息行。

## Immediate fix or workaround

- `loadL0(path)` 成为唯一入口，按钮与测试调用同一个函数。
- selftest 补上「真的切屏了」与「无 model 导航守卫」两条断言，并明确要求调用真实入口。

## Lesson candidate

- Prevention: **测试一旦复制产品逻辑，就只验证了副本。** 集成测试必须调用产品的真实入口，
  并断言"屏幕上真的发生了切换"，而不是断言状态变量或字符串；新增入口时，先确认测试与按钮走同一条路径。
- Applies to: `app/renderer/**` 的页面/模式切换、`app/main/**` 的 IPC 入口，以及所有 Electron
  selftest 断言。

## Follow-up target

- 已并入 F08 的回归脚本与 `validation-checklist.md` §4。
- F08 尚未 `passing`：Phase 4.1 之后的正式 Track A 人工测试仍需复验这条修复在真实阅读行为下成立。
