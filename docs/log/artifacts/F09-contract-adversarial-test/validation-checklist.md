# Contract Adversarial Test — Validation Checklist

reviewer 逐项验证 Feature 09（Phase 2b）的清单。
定位与选择标准见 `README.md`；任务书见 `execution-prompt.md`。

> **本 feature 的核心不是"能不能画出图"，而是"F06 的契约经不经得起两种没见过的文档"。**

---

## 1. 选择标准是否被遵守（**先冻结，后挑文档**）

- [ ] `results/fixture-selection.md` 存在，且是**按 README §3 的逐条标准**填的
- [ ] Fixture D 逐条对照 §3.1 的 7 条硬要求（多实体 / 1:1·1:N·N:M / 字段多 / ownership·reference / lifecycle / schema evolution / 跨实体 invariant）
- [ ] Fixture D **确认不是**"数据变换流水线"（这是 F05 留下的最大选型局限）
- [ ] Fixture D 记录了"是否有天然单一处理主轴"（最好没有）
- [ ] Fixture E 逐条对照 §3.2 的 11 条要素 + 三条路径（正常 / 异常 / 人工介入）
- [ ] Fixture E **确认接近"操作手册本身"**，而不是"系统设计里附带 retry"
- [ ] 未满足的硬要求**已记录为缺口**，且**没有**为了凑标准而降低要求
- [ ] 选择标准在挑文档**之前**就已冻结（可用 git 历史佐证：README 提交早于 fixture）

## 2. 原件与溯源

- [ ] D / E 均由**用户提供**，执行方没有自造假文档
- [ ] D / E 的 SHA256 已记录（沿用 `测试文档/README.md` 的格式）
- [ ] D / E 原文**未被修改任何字节**
- [ ] `meta.validationGranularity = "section (provisional)"`
- [ ] 报告中**没有**把 section 粒度与 A 的 sourceUnit 粒度合成一个百分比

## 3. candidate map 的定位

- [ ] 产出的是 `drafts/fixture-d.map.json` / `fixture-e.map.json`（**candidate，不是 Gold**）
- [ ] **没有**把"画得漂亮"当成验收标准
- [ ] **没有**顺带评价"AI 生成质量"（那不是本 feature 的事）
- [ ] 建模时每一次"别扭"都记进了 `results/notes.md`（这是四类别结论的原始素材）

## 4. 四个观察类别（**不得留空、不得写"大致可以"**）

- [ ] **Semantic gap**：有没有需要第 7 类的东西？**结论前先按 03 §11.1.1 的决策树分类**
- [ ] **Relation gap**：新增几处？与 A/B/C 的 3 处相比是否"大量同类重复"？
- [ ] **Capacity gap**：12 是否明显不合理（**必须是无硬塞前提下**）？压不下时是否如实超出？
- [ ] **Validator FP**：正确 candidate map 有没有被判 HARD？若有，逐条确认是误报还是真违反
- [ ] **Validator FN**：mutation 有没有漏网？（见 §5）
- [ ] 四个类别都有**明确结论 + 证据**

## 5. Mutation / Adversarial Test

对 D / E 各 ≥5 个 mutation，逐条记录"期望 vs 实际"：

| # | Mutation | 期望 |
|---|---|---|
| M1 | 删除 provenance | HARD (H2) |
| M2 | type 改成第 7 类 | HARD (H1) |
| M3 | edge 用表外 relation | HARD (H4) |
| M4 | dangling reference | HARD (H3) |
| M5 | 孤立 element | HARD (H7) |
| M6 | 删除某 Topic 的导航入口 | HARD (H5 N1 / N2) |
| M7 | 强行串联两个无关节点 | **validator 判不出来**（人工审计项） |

- [ ] ≥5 个 mutation / 篇，覆盖 M1~M6
- [ ] 每个 mutation 都跑了 `check-map`，并记录了实际 severity
- [ ] **拦截率**已算出（期望 HARD 的 mutation 中，实际被判 HARD 的比例）
- [ ] 有漏网时，明确写清"是哪条检查不够"以及修法
- [ ] **M7 作为人工审计项**：记录了"审计者能否仅凭 map + 原文发现那条错误的链"
  - [ ] 且**没有**要求 validator 判出 M7（那是 semantic rule，不是 schema rule）

## 6. W0 / SKIPPED 的状态检查（F06 的既有裁决）

- [ ] 若出现 `W0`（原文小节无法解析 / 未提供 `--plan`），输出状态是
      **`PASS WITH INCOMPLETE VALIDATION`**，而不是 `PASS`
- [ ] `SKIPPED` 段列出了**具体哪些检查没有执行**
- [ ] 报告里**没有**把跳过的 N1~N3 说成"已验证通过"
- [ ] 若 D / E 正常执行了全部检查，则状态应为 `PASS`（不是 incomplete）

## 7. 统计项与 topology

- [ ] **W4（单 Block Topic）**在 D / E 上命中几次？是否自然合理？
      （若出现多个自然的 single-block Topic → 建议后续 W4 → INFO）
- [ ] D / E 各自的 **topology 形态**已记录
- [ ] topology **没有**被升级成 contract failure
- [ ] 若出现"没有主轴 / 分叉 DAG / 不对称分支"，按 Informational 处理

## 8. 红线（任意一条命中即 REJECT）

```text
[ ] Fixture D / E 由执行方自编，或被修改过
[ ] 先挑文档、后补选择标准（"根据 fixture 改考题"）
[ ] 为了压到 12 而牺牲决定性内容（应如实超出并记为 Capacity gap）
[ ] 正确图被判 HARD 却直接接受（应先怀疑 validator 太死）
[ ] mutation 未被拦住却降低 schema / validator 严格度
[ ] 新增第 7 类 element 或新增 relation 词
[ ] schema 出现 maxItems / role 变成 enum
[ ] 把 topology mismatch 判成 contract failure
[ ] 把 section 粒度与 sourceUnit 粒度混算
[ ] 把 skipped 的 N1~N3 说成"已验证"
[ ] 顺带评价 AI 生成质量
[ ] 开始 Feature 07 的任何工作
```

---

## 9. Gate 与最终判定

**Gate 通过条件（四条同时成立）：**

```text
1. Semantic gap = 0
2. Relation gap 可控
3. Capacity 只是 heuristic 问题
4. Validator 无明显误报（正确图 HARD 0；mutation 全部被拦）
```

| 判定 | 条件 |
|---|---|
| **ACCEPT** | Gate 四条全部满足；四个类别都有明确结论；mutation 拦截率 100%；红线未命中 |
| **ACCEPT WITH NOTES** | Gate 满足，但存在需记录的保留项（例如某条硬要求未满足的选型缺口、W4 命中偏多） |
| **REJECT** | 命中任一红线；或 Gate 有不满足项却未走对应处理（见 README §6 的处理表） |

**reviewer 需要明确回一句：** `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`，并写出理由。

**另外必须单独回一句：** `Gate = PASS` 或 `Gate = FAIL`。

---

## 10. 通过之后才允许做的事

```text
Gate = PASS  →
    可以进入 Feature 07：AI generation prompt / 自动化阶段
    （此时才有资格讨论"AI 生成的 framework-map 质量"）

Gate = FAIL  →
    按 README §6 的处理表逐条处理；不得直接开始 Feature 07
```

- [ ] `results/rule-adjustments.md` 里**每条** F06 规则都有明确处置：
      `保持` / `升为 HARD` / `降为 WARN` / `降为 INFO` / `需要新增检查`，且都附本次实测证据
- [ ] 若建议降级（例如 W4 → INFO），写明**依据**（命中次数 + 是否自然）
- [ ] 若建议新增检查，说明它属于哪个 severity、以及为什么 schema 表达不了
