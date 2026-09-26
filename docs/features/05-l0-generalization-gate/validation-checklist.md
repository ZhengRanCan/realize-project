# L0 Generalization Gate — Validation Checklist

执行 agent 完成 Feature 05 后，reviewer 逐项验证的清单。
规格见 `docs/features/03-hierarchical-architecture/README.md`（§编号均指该文件）。

> 本 feature 的产出直接决定 Feature 06 / 07 / 08 能否开始，判定要从严。
> **成功标准不是"三类文档都画得出来"，而是"失败的边界被找清楚了"。**

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

对 `drafts/fixture-b.map.json` 与 `drafts/fixture-c.map.json` **各自**执行 Feature 04 的结构检查：

**Framework Map invariant**
- [ ] F1 每个元素有 provenance（B / C 用 `provenance: [{section, lines}]`）
- [ ] F2 元素总数 ≤ 12
- [ ] `type` 全在允许词表内；**没有**因为装不进去就新增第 7 类
- [ ] `role` 全在受控取值内
- [ ] `edges[].type` 全在 8 词表内；方向读得通（"A 动词 B"）
- [ ] `concept` / `constraint` 没有出现在 `edges[]`；主轴只有 process / artifact
- [ ] 判据 B：每个元素至少参与一条 edge 或 attachment

**Navigation invariant**
- [ ] N1 每个 Topic 至少关联一个 element 或 block
- [ ] N2 每个需要保留的 block 至少一个入口（文档级入口除外）
- [ ] N3 每条可达路径存在 —— **目标：完全无路径 = 0**
- [ ] ⚠️ **N3 已显式标注为 `provisional validation granularity`（小节粒度）**

> **抽查 2 个元素**回到原文对应小节核对（防编造溯源）。

## 3. Task 2.3 三大关切（Q1~Q3）

- [ ] **Q1 Data-heavy 是否被迫画成不存在的"机制链"？**
  - [ ] 明确结论 + 实际形态（实体关系图？归属图？还是别的）
  - [ ] 有具体元素/边的例子
- [ ] **Q2 Process-heavy 的 L0 是否退化成普通流程图？Topic 与图是否失去层级差异？**
  - [ ] 给出重合度的具体判断（哪些元素/边与 topic 边界重合）
  - [ ] 明确说明 L0 相对普通流程图还有没有增量价值
  - [ ] 明确回答：**Framework Map 是否必须存在单一主轴**
- [ ] **Q3 遇到不适配内容时是哪一类 gap？**（见 §4）

## 4. Task 2.4 Gap 分类（**红线区**）

- [ ] `results/gap-classification.md` 存在，且**每个**不适配项都归入了 4 类之一：

```text
Semantic gap    六类 ontology 真表达不了
Layout gap      类型对了，只是画法不适合
Relation gap    节点没问题，边表达不了
Navigation gap  图不该承载，但 Topic 必须有入口
```

- [ ] 每一项都写了理由（为什么是这一类而不是另一类）
- [ ] **没有任何一项是"未经分类就新增类型"的结果**
- [ ] 若建议扩 ontology：单独列出，并说明**为什么 role / layout / relation 三条路都救不了**
- [ ] 明确区分了"ontology 真缺类型"与"只是 layout / role / relation 不够"

> ⚠️ **红线**：一看到 Fixture B 有东西装不进去就新增第 7 类元素 —— 这正是 Feature 04 教训的反面（从一个例子推出通用规则）。

## 5. Task 2.5 规则矩阵（★ 主要交付物）

- [ ] `results/rule-matrix.md` 存在，且 **R1~R8 逐条有结论**：

```text
R1 六类 element vocabulary          R5 ≤12 容量原则
R2 type + role 两层机制             R6 Topic synthesis
R3 edge / attachment 区分            R7 Framework vs Navigation coverage
R4 relation vocabulary（8 词）       R8 framework-map 表达模型本身
```

- [ ] 每条结论只能是 **成立 / 有条件成立 / 不成立**（不接受"大致成立""基本可以"这类表述）
- [ ] 每条结论都附**证据**：哪个元素、哪条边、在哪个 Fixture 上
- [ ] "有条件成立"必须写出**成立的条件**
- [ ] "不成立"必须写出**需要改 §3~§6 的哪一部分**

## 6. Task 2.6 过拟合检查

**第一类：Fixture A 锚定**
- [ ] 三类文档产生了**各自不同**的结构
- [ ] B / C 上没有出现 Fixture A 的结构（如 `Consumption Evidence` / `Product Boundary`）
- [ ] 若出现 → overfitting，**Gate 必须 FAIL**

**第二类：把布局当成必要形态**
- [ ] 没有把"主轴 + 侧挂"当成 L0 的必要形态
- [ ] 若 B / C 被强行拉成链，即使"看起来整齐"也判为过拟合

## 7. Gate 结论

- [ ] 结论明确写成 `PASS` 或 `FAIL`
- [ ] 若是 `FAIL`：
  - [ ] 写清是哪条规则 / 哪个关切导致的
  - [ ] 写清需要修改 §3~§6 的哪一部分
  - [ ] **没有继续产出** schema / 校验器 / 生成 prompt（红线）
- [ ] 若是 `PASS`：写清哪些结论可以带进 Feature 06、哪些只在某一类文档上成立

---

## 8. 红线（任意一条命中即 REJECT）

```text
[ ] Fixture B / C 被替换、改写，或由执行方自行编写
[ ] 因为画不出图就换掉 Fixture（而不是记录失败结论）
[ ] 未分类就新增第 7 类元素，或悄悄加了第 9 个关系词
[ ] 把 B / C 的小节粒度 coverage 与 A 的 sourceUnit 粒度混算成一个百分比
[ ] N3 没有标注 provisional validation granularity
[ ] rule-matrix 有空白行，或用"大致成立"之类含糊表述
[ ] 用 Feature 04 的 Track A 结论支撑本 feature 的判断
[ ] Gate 为 FAIL 却继续推进 Feature 06 / 07 / 08
[ ] 在 Gate 结论前产出 framework-map.schema.json / check-map / Stage 1a·1b prompt
[ ] 把 B / C 硬拉成"主轴 + 侧挂"以求得整齐
```

---

## 9. 最终判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | 两张图结构检查通过；Q1~Q3 有具体答复；gap 全部归类；R1~R8 全部有结论与证据；Gate 明确；红线未命中 |
| **ACCEPT WITH NOTES** | 同上，但有需记录的保留项（例如某条规则"有条件成立"、某篇元素数贴着上限） |
| **REJECT** | 命中任一红线；或规则矩阵有空白 / 含糊；或 Gate 结论缺失 |

**reviewer 需要明确回一句：** `ACCEPT` / `ACCEPT WITH NOTES` / `REJECT`，并写出理由。

**另外必须单独回一句：** `Gate = PASS` 或 `Gate = FAIL` —— 这是 Feature 06 的开工条件。

---

## 10. 已知失败模式

| 失败模式 | 症状 | 说明 |
|---|---|---|
| **换 Fixture 以求通过** | 发现 B / C 画不出就换一篇好画的 | 最严重：把 Gate 变成走过场 |
| **见缝插类型** | 一有不适配就加第 7 类 | ontology 会膨胀，AI 分类开始漂（03 §5.2） |
| **粒度混算** | 把小节覆盖率与 sourceUnit 覆盖率相加/平均 | 两者粒度不同，永远不要合成一个数字 |
| **规则矩阵含糊** | "六类基本通用" | 必须逐条、附证据、可复核 |
| **硬凑主轴** | 数据型文档被拉成一条链 | 第二类过拟合 |
| **Fixture A 锚定** | B / C 上仍是 A 的结构 | 第一类过拟合，Gate 必须 FAIL |
| **用 UX 背书泛化** | 引用 Track A 的"更好用" | 两条线必须独立结论 |
