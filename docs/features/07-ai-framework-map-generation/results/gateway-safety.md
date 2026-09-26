# Gateway / 产物安全 —— 验证记录（F07 前置条件）

> 状态：✅ **已完成并通过**（33/33）
> 复现：`node scripts/test-generate-framework-map.js`
> 原始输出：`gateway-safety-output.txt`
> **本轮零模型调用** —— 全部用 stub 注入，安全协议本身不依赖网络。

---

## 1. 为什么先做这一步

F07 的每一个 FAIL 都是宝贵实验数据。如果一次 503 能把上一份产物覆盖掉，
那么"15 个 run"这件事在工程上就不成立 —— 实验会在无人察觉时丢数据。

之前的真实事故：上游 503 覆盖过既有产物（Feature 01 的 O-16 记录）。

---

## 2. 实现的三条规则

| 规则 | 落点 |
|---|---|
| **每次运行独立目录**，永不覆盖已存在的 run 目录 | `allocateRunDir()`；`--run N` 撞车 → 退出码 3，不写任何文件 |
| **成功写入协议**：temp → read-back 解析 → 原子 rename | `writeJsonAtomically()`；`run-meta.json.protocol` 记录六步 |
| **FAIL 也是数据**：validator FAIL / 结构不可校验 / 解析失败都原样保留 | `runValidator()` + `preflight()`；产物一个都不删 |

另外固定 `run-meta.json.repair = "none"`，并记录 `artifactSha256`，让"脚本有没有偷偷改产物"可事后核对。

---

## 3. 六个注入情形与结果

| run | 注入 | 期望 | 实际 |
|---|---|---|---|
| run-01 | stub 合法产物（能过 check-map） | 退出 0，五件齐全 | ✅ 退出 0；`HARD 0 · PASS` |
| run-02 | stub 使用表外 relation `acyclic-depends-on` | 退出 1，**产物保留** | ✅ 退出 1；`framework-map.json` 与 `check-map.txt` 都在，HARD 已记录 |
| run-03 | `--stub-http 503` | 退出 2，无 `framework-map.json` | ✅ 只有 `request.json` + `run-meta.json` |
| run-04 | `--stub-transport-error ECONNRESET` | 退出 2，无 `framework-map.json` | ✅ 同上 |
| run-05 | 返回散文（非 JSON） | 退出 2，保留 raw response，不猜测 | ✅ `raw-response.txt` 保留，状态 `parse-failed` |
| run-06 | 返回合法 JSON 但**不是 map**（`{note: ...}`） | 退出 1，产物保留，且**不崩溃** | ✅ `check-map.txt` 写明"结构不可校验：缺少 document…" |
| （无目录） | `--run 1` 重跑已存在的 run-01 | 退出 3，拒绝覆盖 | ✅ 未新建目录、未产生 `.tmp.json` |

### 关键断言（★ = 本步骤的存在理由）

```text
★ run-01 的成功产物在 run-03（503）之后**字节未变**（sha256 相同）
★ run-01 的成功产物在 run-04（传输失败）之后**字节未变**
★ run-01 的成功产物在 run-05（解析失败）之后**字节未变**
★ run-01 的成功产物在 run-06（结构不可校验）之后**字节未变**
★ 被拒绝的重跑（退出码 3）之后，run-01 的产物仍然**字节未变**
★ framework-map.json 与 raw response 逐字节一致 → 没有发生任何自动修补
```

### 实际落盘形态（沙箱目录）

```text
fixture-d/run-01/{request.json, raw-response.txt, framework-map.json, check-map.txt, run-meta.json}
fixture-d/run-02/{request.json, raw-response.txt, framework-map.json, check-map.txt, run-meta.json}
fixture-d/run-03/{request.json, run-meta.json}                        ← 写不进去就不产生假产物
fixture-d/run-04/{request.json, run-meta.json}
fixture-d/run-05/{request.json, raw-response.txt, run-meta.json}      ← 原文保留，不猜 JSON
fixture-d/run-06/{request.json, raw-response.txt, framework-map.json, check-map.txt, run-meta.json}
```

---

## 4. 一个设计决定：validator 不因畸形产物崩溃

`check-map.js` 假设输入是一张 map；AI 可能返回 `{}` 或别的合法 JSON。
若直接喂给 check-map，它会抛 `TypeError: Cannot read properties of undefined`。

处理方式：generator 先做 **preflight**（顶层是否对象、五个必填字段是否在），不通过就把原因写进 `check-map.txt`：

```text
===== 产物结构不可校验（未进入 check-map）=====
  ✗ 缺少必填字段 document
产物已原样保留（F07 §3.3）：结构不成立的产物同样是实验数据。
```

**没有**为此修改 `check-map.js` 的判定逻辑 —— 那是 Contract 侧的东西，本 Feature 不动 Contract。

> 顺带做的一件事：把 `check-map.js` 的报告渲染抽成 `renderReport()` 并导出，
> 让 generator 与 CLI 共用同一份格式（也避免 generator 依赖子进程与管道）。

---

## 5. 结论

```text
Gateway 安全策略：✅ 有效
失败请求覆盖既有产物：✅ 不可能发生（六类情形全部验证）
validator FAIL 的产物：✅ 完整保留
自动修补：✅ 不存在（repair = "none"，且逐字节核对过）
```

**可以进入 Phase 2（单 Fixture Smoke Test，1 次真实调用）。**
Phase 2 若发现 Gateway / IO 仍不稳定，按 README §14 记 `BLOCKED` 并在此文件追加实际故障记录。

---

## 6. Phase 2 实跑补充（2026-09-26）

Phase 2 已执行：**工程链 PASS**，但暴露了三个 harness 缺陷（凭据检查晚于建目录、
`--max-tokens` 被静默忽略、run 编号会复用空位），**已全部修复并回归 33/33**。
完整记录见 `phase2-smoke-test.md`。

本轮安全协议的实战表现：

```text
[✓] 被保险拦截的调用没有覆盖任何产物（但当时留下了一个空 run 目录 → 已修 + 已删除）
[✓] 真实调用一次成功，五件产物齐全，无 .tmp.json 残留
[✓] validator PASS（HARD 0）—— 但按纪律，这不是 Phase 2 的判据
[✓] repair = none，产物与 raw response 逐字节一致
```
