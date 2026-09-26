# Contract & Validators — Validation Checklist

reviewer 逐项验证 Feature 06 的清单。
定位与三级冻结清单见 `README.md`；任务书见 `execution-prompt.md`。

> **本 feature 的第一验收标准不是"能查出多少错"，而是"不误报"** ——
> A / B / C 三篇都是已经通过的产物，校验器把它们判 Hard Error 就是校验器的问题。

---

## 1. 交付物齐备

- [ ] `schema/framework-map.schema.json` 存在且能被 JSON Schema 校验器加载
- [ ] `scripts/check-map.js` 存在且可运行
- [ ] `docs/framework-map-contract.md` 存在
- [ ] `docs/features/06-contract-and-validators/results/verification-output.txt` 存在
- [ ]（建议）`scripts/test-check-map.js` 存在且通过

## 2. 三条"不要过度冻结"的硬性检查（**本 feature 的核心**）

### 2.1 element budget **不是** `maxItems`

- [ ] schema 里**没有** `maxItems`（或等价的"元素数量上限"约束）
- [ ] `> 12` 时 `check-map` 输出的是 **Warning**，不是 Hard Error
- [ ] 报告里写明 `preferred element budget = 12`，且注明这是**认知容量 heuristic**
- [ ] **没有**定义 13~15 / >15 之类的分级惩罚（无证据）
- [ ] 超出 budget 时能区分"有硬塞"与"有 L1/L2 入口"两种情况

### 2.2 relation vocabulary **没有**被扩词

- [ ] `edges[].type` 仍然是 8 词 + `relates-to` 兜底，**没有新增**
- [ ] 表外词 → **Hard Error**
- [ ] `relationGap` 结构存在，字段为 `{ from, to, intendedMeaning, reason }`
- [ ] `relationGap` **不进入** `edges[]`（在 schema 与 validator 两层都不要混）
- [ ] `relationGap` 存在 → **Warning / REVIEW REQUIRED**（不是 Hard Error）
- [ ] 3 处已知 gap 已登记：B 的跨语言一致性 · C 的持有 · C 的通过放行
- [ ] 没有出现 `type: "custom"` 或等价的"任意关系词"后门

### 2.3 `role` **没有**被做成严格 enum

- [ ] schema 里 `elements[].role` 是 **string**，不是 enum
- [ ] 未知 role → **Warning**，不是 Hard Error
- [ ] 已登记的 role 取值（含 F04 新增的 `semantic-level`）能正常通过

## 3. 三级 severity 正确分层

- [ ] 输出分三级，**没有**混成一个 pass/fail
- [ ] **Hard Error** 恰好覆盖：unknown type · missing provenance · dangling reference · illegal relation · 无导航路径 · 同 ID 重复
- [ ] **Warning** 恰好覆盖：element > 12 · role 未知 · Topic 太多 · 某 Topic 只有一个 block · relationGap 存在
- [ ] **Informational** 恰好覆盖：`component = 0` · `state = 0` · 没有主轴 · 出现 DAG · Topic 没有 element
- [ ] **Informational 的每一项都不会被报成 Hard Error 或 Warning**
- [ ] 没有因为"某类 element = 0"而报警

## 4. 三篇 Fixture 上不误报

| Fixture | 期望 Hard | 期望 Warning | 期望 Informational |
|---|---|---|---|
| A（sourceUnit 粒度） | 0 | ≥0 | ≥0 |
| B（section 粒度） | 0 | ≥0（含 relationGap 1） | ≥0 |
| C（section 粒度） | 0 | ≥0（含 relationGap 2） | ≥0 |

- [ ] 三篇都通过 schema
- [ ] 三篇 `check-map` 的 **Hard Error 都是 0**
- [ ] 若某个 Hard Error 出现：确认是**真的**契约违反（例如引用坏了），而不是校验器太死
- [ ] 三篇 map 的**语义内容未被改动**（只允许新增 `relationGap`）

## 5. 粒度纪律

- [ ] 报告中 A 的 `sourceUnit` 粒度与 B / C 的 `section (provisional)` 粒度**分开列出**
- [ ] **没有**把两种粒度合成一个 coverage 百分比
- [ ] `meta.validationGranularity` 在三份 map 里都存在且取值正确
- [ ] 在 section 粒度上，明确说明 **N2 与 N3 会合并**（"每节有入口"＝"每节可达"）

## 6. 契约文档（`framework-map-contract.md`）

- [ ] 1. 三种 coverage 的关系写清楚了
- [ ] 2. `concept` vs `state` 的判别规则在（含"多个值可同时成立 → 通常不是互斥 state"+ A 的 regression case）
- [ ] 3. 什么时候该用 attachment 写清楚了
- [ ] 4. Capacity gap 的定义与处理方式在
- [ ] 5. Relation gap 的定义与 `relationGap` 用法在
- [ ] 6. "文档没声明依赖就不要强行串链"在，**并写了它的来历**（Fixture C 的真实经历）
- [ ] 7. 三级冻结清单（hard / soft / 不要做）在
- [ ] 文档**不是** schema 的复述 —— 它记录的是 schema 表达不了的判断

## 7. 红线（任意一条命中即 REJECT）

```text
[ ] schema 出现 maxItems: 12（或等价的元素数量上限）
[ ] 新增了第 7 类 element
[ ] 新增了第 9 / 10 / 11 个 relation 词
[ ] role 被写成严格 enum
[ ] 因为某类 element = 0 而报警
[ ] 把"没有主轴 / DAG / Topic 无 element"报成 Hard Error 或 Warning
[ ] relationGap 被写进了 edges[]
[ ] 出现 type: "custom" 之类的任意关系后门
[ ] A / B / C 里任一篇被判 Hard Error（除非确认是真实引用损坏）
[ ] 把 sourceUnit 粒度与 section 粒度合成一个 coverage 数字
[ ] 改动了 app/renderer/* 、app/main/* 、fixtures/ 、experiments/ 、ai/
[ ] 产出了生成 prompt
```

---

## 8. 最终判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | 三个交付物齐备；三篇 Hard Error = 0；三条"不要过度冻结"检查全通过；三级 severity 分层正确；契约文档 7 项齐全；红线未命中 |
| **ACCEPT WITH NOTES** | 同上，但有需记录的保留项（例如 Informational 某类尚未实现、测试脚本未覆盖某一分支） |
| **REJECT** | 命中任一红线 |

**reviewer 需要明确回一句：** `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`，并写出理由。

---

## 9. 交给 Phase 2b 的问题（本 feature 不回答）

> 这些问题要靠**用 F06 的产物去撞 Fixture D / E** 才能回答，见 F05 的 `phase2-generalization.md` 末节。

```text
1. Hard Error 在 D / E 上是真契约违反，还是 validator 写得太死？
2. Warning 有没有大量误报（尤其 element > 12 / 未知 role / relationGap）？
3. 有没有新的 Semantic gap / Relation gap？
4. 12 在 D / E 上是否明显不够（即：在没有硬塞的情况下远超 12）？
```
