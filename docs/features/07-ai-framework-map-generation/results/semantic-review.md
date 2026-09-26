# Semantic Review（F07 · Phase 3 填 · **必须人工读原文**）

> 状态：⏳ **未开始**
> 纪律：**不能只看 JSON 判忠实度**。每条 edge / element 都要回原文指出出处（小节或行号）。
> 这一份是 F07 最重要的判读之一：`check-map = PASS` **不代表**语义正确。

---

## 1. 逐 run 判读

### fixture a · run-01

| 判据 | 结果 | 证据（原文位置） |
|---|---|---|
| element 是否都能指到原文 | | |
| edge 方向是否与原文一致 | | |
| Invented element | | |
| Invented relation | | |
| Wrong relation direction | | |
| Unsupported prerequisite | | |
| concept / state 分类错误 | | |
| contains ↔ reference 混用 | | |

**结论：** SEMANTIC PASS / FAIL ——

（run-02 / run-03 同表；b / c / d / e 同样逐 run 填）

---

## 2. 汇总计数

| Fixture | Invented element | Invented relation | Wrong direction | Unsupported prerequisite | concept/state 错 | contains/reference 混用 |
|---|---|---|---|---|---|---|
| a | | | | | | |
| b | | | | | | |
| c | | | | | | |
| d | | | | | | |
| e | | | | | | |

---

## 3. Validator Gaming 专查（§12，**PASS 也要查**）

| run | 乱用 relates-to | 造边消孤立 | 为压 12 删机制 | 用不准的 known role | 编 prerequisite | 判定 |
|---|---|---|---|---|---|---|
| | | | | | | |

> **判定规则：** 只要命中，**即使 `check-map = PASS`，该 run 的 Generation Quality 判 FAIL**，并写出具体证据。
> 禁止出现"validator 全绿所以图是对的"这类推论。

---

## 4. 典型失败样本（原样引用）

```text
（把有代表性的 AI 产物片段贴在这里 —— 尤其是"为了过校验而失真"的那种，
  并注明它为什么在语义上是错的、validator 为什么拦不住）
```
