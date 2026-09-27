# Phase 2 · 单 Fixture Smoke Test（真实调用 · Fixture A）

> 状态：✅ **工程链 PASS**
> 依据：`experiments/framework-map-generation/fixture-a/run-02/`（五件产物齐全）
> 纪律：**1 次真实调用**、`--max-attempts 1`（连传输层都不重试）、prompt 未改、参数未现场调

---

## 1. 本次调用

| 项 | 值 |
|---|---|
| fixture | A（Concept / Architecture heavy） |
| 文档 | `测试文档/18-context-consumption-semantic-model.md` · sha256 `338bb2d632f800b53b20b1fcaa10ec235fdf7154107acb7925f87da27cb11c6a` |
| prompt | `ai/framework-map-generation.prompt.md` · sha256 `295e9c9923b3…`（指纹 `295e9c9923b330f3`） |
| provider | `deepseek`（`https://api.deepseek.com`，直连；**不经中转**） |
| model | `deepseek-flash` |
| 生成参数 | temperature `1` · max_tokens `32000` · timeout `900000ms` · max_attempts `1` |
| 结果 | `status: success` · `finish_reason: stop` · attempts `1` · 93.3s |
| usage | prompt `10557` · completion `23891`（其中 **reasoning_tokens 19977**）· total `34448` |
| 产物 sha | `framework-map.json` = `9ac9dd4284b1deb52ca12b2daadf91b7b1ef27334662e9d55ccf4a73fea383f9` |

## 2. 工程链验证（Phase 2 的真正判据）

```text
真实模型 → raw response → JSON → 保存 → read-back → schema/check-map
```

| 步骤 | 结果 |
|---|---|
| 请求成功 | ✅ `HTTP 200`（`/models` 预检与本次调用均正常） |
| raw response 保存 | ✅ `raw-response.txt` |
| JSON 解析 | ✅ `jsonExtracted: true` |
| temp 写入 | ✅ `tempWrite: true` |
| read-back 解析 | ✅ `readBackVerified: true` |
| 原子 rename | ✅ `atomicRename: true`（无 `.tmp.json` 残留） |
| check-map 执行 | ✅ `checkMapExecuted: true` |
| 无自动修补 | ✅ `repair: "none"`，产物与 raw response 逐字节一致 |

**→ 工程链 PASS。**

## 3. 本次 AI 产物（**不是** Phase 2 的判据，仅供 Phase 3 参考）

```text
validator   PASS · HARD 0 · WARN 2 · INFO 3 · coverage 15/15
结构        15 elements / 9 edges / 4 attachments / 5 topics / 1 relationGap
type 分布   process · artifact · concept · constraint（component / state = 0）
WARN        W1（15 > preferred budget 12） + W5（1 条 relationGap）
qualifiers  9 条边里 8 条带 cardinality，5 条带 ownership —— AI 主动使用了结构属性
artifact    document.role = "target" · granularity = "section (provisional)"
```

> 按用户口径：**Phase 2 只验证工程链**。"生成的图对不对"属 Phase 3 的 Q2/Q4/Q5，本文件不下结论。

---

## 4. ⚠️ 三个 harness 缺陷（本次暴露，已修）

### 4.1 `--max-tokens` 被静默忽略（kebab-case ≠ camelCase）

```text
现象：命令行给了 --max-tokens 8000，实际发给上游的是 32000（DEFAULTS.maxTokens）
根因：parseArgs 只做 token.slice(2)，"--max-tokens" 落成 args["max-tokens"]，
      而代码读的是 args.maxTokens → 该 flag 从未生效
影响：本次 run 的真实参数是 32000，**与事先约定的 8000 不一致**（run-meta 如实记录了 32000）
修复：parseArgs 统一 kebab → camelCase，并同步所有读取点
```

**这个 bug 反而是本次调用成功的原因** —— 见 §5。

### 4.2 凭据检查发生在**创建 run 目录之后**

```text
现象：一次漏传环境变量的调用（保险拦截）在 fixture-a/ 下落了一个空的 run-01，
      导致本次真实调用跑到 run-02
根因：allocateRunDir() + mkdirSync 在 resolveCredentials() 之前
修复：凭据 / 用法检查前置到创建目录之前；并删除那个空目录（0 个文件，无数据丢失）
```

### 4.3 run 编号取"第一个空位"，删除目录后会被复用

```text
修复：改为 max+1（单调递增）→ 即使某个 run 目录被删除，编号也不会被复用，
      run 号与时间顺序始终一致
```

回归：`node scripts/test-generate-framework-map.js` → **33/33 通过**（三个修复均未破坏产物安全协议）。

---

## 5. ⚠️ 实验设计层面必须记录的一件事：`deepseek-flash` 是推理模型

```text
completion_tokens 23891
  ├── reasoning_tokens 19977   ← 约 84% 的输出预算花在"思考"上
  └── 其余约 3914 才是真正的 JSON 内容
```

**后果：事先约定的 `max_tokens = 8000` 会让这次响应被截断**（23891 > 8000）→ `finish_reason: length` → JSON 不完整 → 解析失败。
换句话说：**参数 8000 与这个模型不兼容**，而这次侥幸因为 flag bug 用了 32000 才成功。

对 Phase 3 的含义：

```text
1. max_tokens 必须 ≥ 约 24000 才可能稳定拿到完整 JSON；
2. D（846 行）/ E（571 行）更复杂，reasoning 占比可能更高 → 32000 也可能触顶；
3. 一旦触顶，失败形态是 finish_reason=length + 解析失败 —— 这是**可记录的真实失败模式**，
   但会把"模型能不能建模"与"预算够不够"混在一起，需要在 run-matrix 里单独标注。
4. 参数必须全实验统一：A 的 run-02 已经用了 32000，若改为其它值，A 需要一起重跑。
```

→ **等用户裁决后再进入 Phase 3**（见本文末节）。

---

## 6. 结论

```text
Phase 2（工程链）：PASS
  —— 真实模型调用 → 产物落盘 → read-back → validator 全链正常，无覆盖、无修补。

AI 语义/契约结果：validator PASS（HARD 0），但**不在 Phase 2 判据内**。
```

**Phase 3 前置**：确认 max_tokens（见 §5）后即可开始 A–E × 3 = 15 runs。
