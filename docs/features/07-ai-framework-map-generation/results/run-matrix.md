# Run Matrix（F07 · Phase 3 填）

> 状态：🟡 **Phase 2 已记入（fixture a / run-02）**；其余等 Phase 3
> 每个 run 一行，数据**只从产物文件读**（`run-meta.json` / `check-map.txt`），不靠记忆。

## 0. Phase 2 smoke test（不计入 15 runs）

| Fixture | Run | 状态 | HARD | WARN | INFO | validator | elements | edges | attach | topics | relationGap | gapDensity | topology class |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | run-02 | success | 0 | 2 | 3 | PASS | 15 | 9 | 4 | 5 | 1 | 0.10 | 待 Phase 3 统一判定 |

参数偏差（**必须记录**）：该 run 因 harness 的 `--max-tokens` flag bug，实际使用 `max_tokens = 32000`（约定值 8000 未生效）。
详见 `phase2-smoke-test.md` §4.1 与 §5。

> `fixture-a/run-01` 曾由一个被保险拦截的调用创建为空目录（0 文件），**已删除**；
> 按新规则 run 编号单调递增（max+1），故本次真实调用为 **run-02**，下一个 A run 将从 run-03 开始。

## 1. 逐 run（Phase 3）

| Fixture | Run | 状态 | HARD | WARN | INFO | validator | elements | edges | attach | topics | relationGap | gapDensity | topology class |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | run-01 | | | | | | | | | | | | |
| a | run-02 | | | | | | | | | | | | |
| a | run-03 | | | | | | | | | | | | |
| b | run-01 | | | | | | | | | | | | |
| b | run-02 | | | | | | | | | | | | |
| b | run-03 | | | | | | | | | | | | |
| c | run-01 | | | | | | | | | | | | |
| c | run-02 | | | | | | | | | | | | |
| c | run-03 | | | | | | | | | | | | |
| d | run-01 | | | | | | | | | | | | |
| d | run-02 | | | | | | | | | | | | |
| d | run-03 | | | | | | | | | | | | |
| e | run-01 | | | | | | | | | | | | |
| e | run-02 | | | | | | | | | | | | |
| e | run-03 | | | | | | | | | | | | |

`状态` 取值：`success` · `success-validator-fail` · `parse-failed` · `transport-failed` · `write-protocol-failed`

## 2. Hard-pass rate

```text
Hard-pass rate = （HARD = 0 的完整 run 数）/（完整 run 数，不含 EXCLUDED）
EXCLUDED 仅限：传输 / HTTP 失败导致产物不完整（这类 run 不计入分母，但必须记录在案）
```

实测：`__ / __ = __%`

## 3. 中途改过 prompt 吗？

| prompt 指纹 | 覆盖的 run | 原因 |
|---|---|---|
| | | |

> 若中途改过 prompt，**之前与之后的 run 不是同一实验**，必须在此标出分界并说明原因。

## 4. 与人工 candidate map 的规模对比（仅供参照，不作判据）

| Fixture | AI（中位数） | 人工 candidate map | 备注 |
|---|---|---|---|
| a | | 12 elements / 4 edges / 7 attachments / 5 topics | |
| b | | 12 / 6 / 5 / 5（1 relationGap） | |
| c | | 12 / 8 / 4 / 6（2 relationGap） | |
| d | | 12 / 11 / 2 / 7（2 relationGap） | |
| e | | 13 / 9 / 3 / 8（2 relationGap） | |
