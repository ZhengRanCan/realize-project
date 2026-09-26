# Stage A 可靠性实录（F10 · 6 次 Stage A 调用）

> 这是**用户裁决「收紧 max_tokens」之后的实测结果**，也是本轮第一个真正的发现。
> 数据来源：`experiments/semantic-grounding/fixture-{d,e}/run-*/run-meta.json` 与 `raw-inventory-response.txt`。

---

## 1. 逐次记录

| run | Stage A 结果 | finish_reason | completion | 其中 reasoning | items | max_tokens_a |
|---|---|---|---|---|---|---|
| d/run-01 | success | stop | 20945 | 3497 | **154** | 65536 |
| d/run-02 | shape-invalid（`S-152b`） | stop | 39168 | 10995 | **264** | 65536 |
| d/run-03 | shape-invalid（S-135~138 缺 statement） | stop | 42639 | 14444 | **289** | 65536 |
| e/run-01 | **parse-failed**（未转义 ASCII 双引号） | stop | 25371 | 10702 | — | 65536 |
| e/run-02 | success（Stage B 中被 kill，无 run-meta） | — | — | — | **99** | 65536 |
| e/run-03 | **parse-failed**（截断） | **length** | 16386 | 14634 | — | **16384** |

---

## 2. 三个结论

### 2.1 ❌ 收紧 max_tokens 不可行：它是**确定性截断**，不是"让模型更紧凑"

```text
e/run-03（max_tokens_a = 16384）
  finish_reason = length
  completion    = 16386 / 16384      ← 顶格被砍
  reasoning     = 14634              ← 其中 89% 是"思考"，不是 JSON
  → 真正写出来的 JSON 只有约 1.7k tokens 就被砍断 → 必然 parse failure
```

**根因：这个模型的 `max_tokens` 同时覆盖 reasoning 与 content。**
reasoning 占 80–90%（见上表），所以 16384 的预算里几乎没有留给产物。
**结论：预算不能压。** 用户的假设（"给太大空间会让 Stage A 越写越散"）有一半成立（见 2.3），
但**解法不是压预算** —— 压预算只会截断。

### 2.2 ⚠️ Stage A 在 E 上的 JSON 可靠性只有 1/3

```text
e/run-01  真·转义错误：第 246 行 "quote": "F12 5.2 设计要求"未发货取消在… ← 未转义的 ASCII 双引号
e/run-02  成功（99 条）
e/run-03  截断（预算问题，非模型问题）
```

即：**即使给足预算（65536），E 的 Stage A 仍有 1/2 概率因转义问题整体失败。**
这与 D 的 3/3 成功形成对比 —— E 的原文里引号/命令/代码片段更多，转义风险更高。

> 值得注意：这个失败模式与我在 Feature 01 里踩过的坑**完全同类**（T-03 的 proposition 里用了 ASCII 引号导致 JSON 失效）。

### 2.3 ⚠️ D 的粒度漂移 1.9×：同一文档、同一 prompt、同一参数

```text
d/run-01  154 条
d/run-02  264 条   ← 1.7×
d/run-03  289 条   ← 1.9×
```

三条都 `finish_reason=stop`，说明**不是被预算逼的，是模型自己越写越多**。
这直接命中 F10 README §1 预判的新失败形态：**"抄写式穷举"**。
Inventory 从"重要机制清单"漂移成"逐段摘要"，会同时污染：
① Stage A 的 Granularity 评价；② Stage B 的选择负担（289 条 × 每条一个 disposition）。

**而且它与 max_tokens 正相关**：预算越大 → 写得越多 → 格式出错概率越高（264/289 两条都带了格式缺陷）。

---

## 3. 处置建议（**需用户裁决**）

```text
① 恢复 max_tokens_a = 65536（或 49152）—— 已证 65536 可用（d×3 全部产出、e/run-02 成功）
② 把 `quote` 从 semantic-inventory schema 移除（或改为可选）
   理由：它是转义失败的唯一来源；而 provenance 判断靠 sectionRef + lines 已经够用。
   代价：失去"引文可核对"这一便利 —— 但它不是 E1–E4 归因的必要条件。
③ 显式发送 reasoning_effort = "low"（**未测**）
   理由：reasoning 占 80–90% 的 output；把它降下来能同时解决"预算被吃掉"与"越写越散"。
   风险：该端点是否接受这个字段未知（端点 /models 广告了 effort: low|high|max，默认 high）。
   验证成本：1 次调用（可与 ① 合并到同一次 E×1 里做）。
④ 若只想先拿到一份可归因的 E 数据：用 65536 重跑 E×1（Stage B 仍不读原文）。
```

**我的建议**：`① + ② + ③` 合并成一次 E×1（一次调用同时验证预算、去掉 quote、effort=low）。
若 ③ 被端点拒绝（HTTP 400），按既定规则记录并停 —— 那本身也是一条结论。

**在此之前不要继续跑 D 或补 E×2/E×3** —— Stage A 的地基还不稳，后面的 Selection/Encoding 归因不可信。
