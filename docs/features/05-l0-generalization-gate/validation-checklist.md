# L0 Generalization Gate — Validation Checklist

执行 agent 完成 Feature 05 后，reviewer 逐项验证的清单。
规格见 `docs/features/03-hierarchical-architecture/README.md`（§编号均指该文件）。

> 本 feature 的产出直接决定 Feature 06 / 07 / 08 能否开始，判定要从严。

---

## 1. Task 2.1 Fixture 来源

- [ ] `测试文档/fixture-b-*.md` 的 SHA256 与 `测试文档/README.md` 记录一致（`08D52471…`）
- [ ] `测试文档/fixture-c-*.md` 的 SHA256 与 `测试文档/README.md` 记录一致（`F66DBD41…`）
- [ ] 两篇文档**未被修改过任何字节**（只读使用）
- [ ] 两篇都**由用户提供**，执行方没有自造假文档代替
- [ ] `document.id` / `title` / `sourcePath` / `role` 已记录
- [ ] 确认要素齐备：
  - [ ] B 含实体、字段、嵌套 schema、对象引用、lifecycle、schema evolution
  - [ ] C 含执行流、队列、重试、超时、并发、故障恢复、可观测性

> 如果 B / C 被替换成了别的文档，本 feature 的结论作废，必须重跑。

## 2. Task 2.2 两张框架图

对 `drafts/fixture-b.map.json` 与 `drafts/fixture-c.map.json` **各自**执行 Feature 04 的全部结构检查：

- [ ] 元素总数 ≤ 12
- [ ] 每个元素有 `id` / `label` / `type` / `role` / `topics`，且 `type` 在六类里
- [ ] 每个 `role` 在 §5.2 取值里
- [ ] `edges[].type` 全部在 §6.1 的 8 词内，且方向读得通（"A 动词 B"）
- [ ] `edges[]` 的 `from` / `to` 都存在于 `elements[]`
- [ ] `concept` / `constraint` / 反例没有出现在 `edges[]`
- [ ] 每个 topic 至少被一个元素引用
- [ ] 溯源：B / C 使用 `provenance: [{section, lines}]`，**抽查 2 个元素**回到原文对应小节核对
- [ ] 没有硬凑主轴：若某篇天然不是链式，图里如实反映
- [ ] `document.role` 正确

## 3. Task 2.3 三个疑问

- [ ] **疑问 1：Data-heavy 文档画得出机制链吗？**
  - [ ] 有明确结论（画得出 → 给出实际主轴；画不出 → 说明实际形态）
  - [ ] 结论有具体元素/边的例子
- [ ] **疑问 2：Process-heavy 的机制链与 topic 划分重合度如何？**
  - [ ] 给出重合度的具体判断（哪些元素/边与 topic 边界重合）
  - [ ] 若几乎重合，明确说明 L0 相对普通流程图还有没有增量价值
- [ ] **疑问 3：三类文档的 L0 topology 是否可能完全不同？**
  - [ ] 三类文档各自的拓扑形态都写出来了（A / B / C 三行）
  - [ ] **明确回答"Framework Map 是否必须存在单一主轴"**
- [ ] 三个回答都不是泛泛而谈，都含具体例子

## 4. Task 2.4 过拟合检查

**第一类：Fixture A 锚定**

- [ ] 三类文档产生了**各自不同**的结构
- [ ] B / C 上没有出现 Fixture A 的结构（如 `Consumption Evidence` / `Product Boundary` 的名称或切法）
- [ ] 若出现 → 判定为 overfitting，**Gate 必须 FAIL**

**第二类：把布局当成必要形态**

- [ ] 没有把"主轴 + 侧挂"当成 L0 的必要形态（§3.3 / §11.5）
- [ ] 若 B / C 被强行拉成链，即使"看起来整齐"也判为过拟合

## 5. Gate 结论

- [ ] 结论明确写成 `PASS` 或 `FAIL`
- [ ] 若是 `FAIL`：
  - [ ] 写清是哪条疑问导致的
  - [ ] 写清需要修改 §3~§6 的哪一部分（L0 形态 / 元素 ontology / 布局语法 / 关系词表）
  - [ ] **没有继续产出** schema / 校验器 / 生成 prompt（§7 的红线）
- [ ] 若是 `PASS`：写清"哪些结论可以带进 Feature 06"，以及"哪些只能在某一类文档上成立"

---

## 6. 红线（任意一条命中即 REJECT）

```text
[ ] Fixture B / C 被替换、改写，或由执行方自行编写
[ ] 因为画不出图就换掉 Fixture（而不是记录失败结论）
[ ] 用 Feature 04 的 Track A 结论支撑本 feature 的判断
[ ] Gate 为 FAIL 却继续推进 Feature 06 / 07 / 08
[ ] 在 Gate 结论前产出 framework-map.schema.json / check-map / Stage 1a·1b prompt
[ ] edges[].type 出现表外词
[ ] 出现第 7 种元素类型
[ ] 元素总数 > 12 且未说明理由
[ ] 把 B / C 硬拉成"主轴 + 侧挂"以求得整齐
```

---

## 7. 最终判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | 两张图结构检查全部通过；三问都有具体答复；Gate 结论明确；红线一条未命中 |
| **ACCEPT WITH NOTES** | 结构检查通过、Gate 明确，但存在需记录的保留项（例如某篇文档的元素数贴着上限、疑问 2 的结论偏弱） |
| **REJECT** | 命中任一红线；或三问有任意一条没有具体答复；或 Gate 结论缺失 |

**reviewer 需要明确回一句：** `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`，并写出理由。

**另外必须单独回一句：** `Gate = PASS` 或 `Gate = FAIL` —— 这是 Feature 06 的开工条件。

---

## 8. 已知失败模式

| 失败模式 | 症状 | 说明 |
|---|---|---|
| **换 Fixture 以求通过** | 发现 B / C 画不出，就换一篇好画的 | 最严重的失败：把 Gate 变成了走过场 |
| **硬凑主轴** | 数据型文档被拉成一条链 | 第二类过拟合（§3.3） |
| **Fixture A 锚定** | B / C 上仍是 A 的结构 | 第一类过拟合，Gate 必须 FAIL |
| **用 UX 背书泛化** | 引用 Track A 的"更好用" | 两条线必须独立结论 |
| **结论含糊** | "大致可以泛化" | 必须给出具体元素/边的例子，且明确回答单一主轴问题 |
| **提前动手** | Gate 没出结论就先写 schema | 直接违反 §7 / §12 的阶段纪律 |
