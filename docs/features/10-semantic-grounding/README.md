# Feature 10: Semantic Grounding（语义基础实验）

> **状态**：🟢 **Ready · Phase 0/1 开始**（任务书已定稿）
> **前置**：F07 `Gate = PARTIAL PASS`（工程链 ✅ · Contract 合法 ✅ · **AI semantic compilation ❌**）
> **定位**：**不是 F07 repair。** F07 已经证明"AI 能生成合法 JSON"，本 Feature 回答的是
> **"AI 能不能忠实地把文档理解成这张图"** —— 以及**丢在哪一步**。

---

## 1. 根因假设：一步做了太多事情

F07 的实测形状（15 run · `HARD 0` 全绿 · `Semantic PASS 0/15`）：

```text
显式名词        → 很稳（D 的 12 个实体 3/3；A 的 10 个核心节点 3/3）
实体网络        → 还不错（D 网络形态 3/3、自环保留）
隐含机制        → 开始不稳
约束 / 异常     → 容易丢（E：异常/越权/有界失败/一致性 0–1/3）
复杂不变量      → 容易塞错位置（B 硬套动词；C 自环 relationGap）
```

**假设：** 当前让模型**一次**完成七件事，于是越靠"机制"的语义越容易在压缩时被丢：

```text
读懂长文档 → 找出重要语义 → 决定哪些进 L0 → 判断 concept/state/process/artifact
→ 判断 relation/qualifier/constraint → 压缩成 Framework Map → 输出严格 JSON
```

**为什么 E 最能说明问题**：ER 文档天然写的是"是什么"（Goal / Plan / Stage / Task / DailyReview），
而 Runbook 的核心埋在**机制措辞**里：

```text
如果…… / 连续…… / 超过…… / 只有管理员…… / 失败后…… / 否则…… / 完成前必须……
```

这些不是漂亮的名词节点 —— **AI 出现了明显的 noun/object bias。**

---

## 2. 本 Feature 要回答的唯一问题

> **E 那些被丢掉的语义，是"读文档时就没理解出来"，还是"已经理解出来，但压缩成 L0 时被丢掉了"？**

**F07 的 `framework-map.json` 无法回答这个问题** —— 因为最终产物里什么都不剩，看不出是"没抽出来"还是"抽出来又丢了"。

---

## 3. 方案：把生成链拆成两步

```text
Markdown
   ↓
Semantic Inventory          ← 本 Feature 的核心新产物
   ↓
Framework Map Synthesis
   ↓
framework-map.json
   ↓
check-map                   （Structural Validation —— 不变）
   ↓
Semantic Audit              （新：回答"原文真的支持吗 / 有没有漏机制 / 有没有借 label 偷带主体"）
```

### 3.1 Semantic Inventory 是什么、不是什么

```text
✅ 它是    「原文到底说了哪些重要设计语义？」的一份**穷举清单**
✅ 它是    一条语义一行 + 原文出处（§key + 行号 + 短引文）
❌ 它不是另一张图
❌ 它不是新的 L0 ontology
❌ 它不是 framework-map 的字段
❌ 它不是 Framework Map Contract 的一部分（属 generation evidence）
```

**这一阶段完全不管下列东西**（否则会**提前压缩**，重演 F07 的失败）：

```text
🚫 12 element budget
🚫 图怎么画 / 有没有主轴 / 拓扑形态
🚫 edge vocabulary / qualifiers
🚫 concept vs state vs process vs artifact 的类型判定
🚫 哪些"值得进 L0"
```

**这一阶段只需要证明一件事：模型**看到**了。** 例如 E 上应该先得到：

```text
S-01  退款查询存在失败路径                              source: §…
S-02  连续 10 次查询失败后进入 REFUND_FAILED             source: §4.7 / §6.4
S-03  失败后界面提供强制补偿入口                          source: §…
S-04  强制补偿仅管理员可执行                              source: §4.8
S-05  补偿后必须检查 products / coupons / users           source: §…
```

**在这一步甚至不需要决定** `S-02` 是 constraint、state 还是 process。

### 3.2 第二阶段才问：哪些进 L0、怎么表达

Stage B（Framework Map Synthesis）输入 = 原文 + heading tree + **Inventory** + Contract；
输出 = `framework-map.json` **加上 sidecar `map-selection.json`**（选择轨迹）：

```text
S-01 → selected as E-04
S-02 → represented by constraint C-02
S-03 → Topic-only, not promoted to L0
S-04 → omitted: reason ...
```

**这样第一次可以真正审计：AI 为什么把某个语义放进图、为什么没放。**

> ⚠️ **`map-selection.json` 不进入 Framework Map Contract。** 它只是 generation evidence。
> 契约仍然只描述 `framework-map.json`。

---

## 4. 失败分类（把 `Semantic FAIL` 拆成四类）

下一次某个 anchor 丢了，必须能回答"丢在哪一步"：

| 失败类 | 含义 | 判据 |
|---|---|---|
| **Extraction Miss** | 原文有，但 Inventory **根本没抽出来** | 理解阶段失败 |
| **Selection Miss** | Inventory 有，但 L0 synthesis **静默丢掉**（selection trace 里没有它，或标了 omitted） | 压缩 / selection 失败 |
| **Encoding Distortion** | 选中了，但 type / direction / relation 表达错 | 表达失败 |
| **Escape-hatch Misuse** | 没正常建模，而是塞进 `edge.label` / `relationGap` 等**自由位** | 规避表达 |

判定路径（以 E 的 `10 次 → REFUND_FAILED` 为例）：

```text
Inventory 有？
  ├─ No  → Extraction Miss（理解阶段失败）
  └─ Yes → Map 有？
             ├─ No            → Selection Miss（压缩失败）
             └─ Yes but in label → Escape-hatch Misuse（或 Encoding Distortion）
```

---

## 5. 两层审计必须分开（**不扩 check-map**）

F07 发现了两个"不受检表达位"（`relationGap` 被当自环、`edge.label` 偷带不存在的主体）。
**处置：不要继续往 check-map 里塞规则。**

```text
Structural Validation   = check-map        → 「这个 map 在 Contract 上合法吗？」
Semantic Audit          = 本 Feature 新增  → 「它说的东西原文真的支持吗？
                                              有没有遗漏重要机制？
                                              有没有借 label 偷带新主体？」
```

**为什么不把 label 语义塞进 check-map：** deterministic validator 无法可靠判断
"Inbox Worker 通过 lease 取得…" 里的 `Inbox Worker` 是不是图上合法主体；
硬做会很快把 check-map 变成**半吊子的语义分析器**。

---

## 6. 四层 coverage（互不代理）

F07 已证明：**Topic ≈ 原文小节时，N1/N2/N3 由构造必然 100%**。所以：

```text
1. Structural Validity        check-map 的 HARD = 0            「合法吗」
2. Framework Coverage         （无自动数字）机制有没有进图        「图表达了核心机制吗」
3. Navigation Reachability    N1~N3 / coverage X/X             「用户有路点到这段原文吗」
4. Semantic Faithfulness      Semantic Audit                    「原文真的支持吗」

🚫 Navigation Coverage **不能**代理 Semantic Coverage
🚫 四层不得合成一个百分比
```

本 Feature 的 Semantic Inventory 补的正是**第 2 与第 4 层**。

---

## 7. Prompt Parity（必须先做）+ 不做的两件事

### 7.1 Phase 0：Prompt Parity Audit（**开工前完成**）

```text
Contract 里所有会影响**生成决策**的规则
        ↓ 逐条检查
Prompt（system message）真的把它暴露给模型了吗？
```

**动机（F07 的实测证据）**：契约 §2 明确规定「多个值可以同时成立 ⇒ 通常不是同一 state machine 的互斥 state」，
而 A 的三次 run **3/3** 把三层语义写成 `state`。**这不是模型失败，是 Generator Prompt 与 Contract 信息面不一致。**

> ✅ 只提供**通用判别规则**；**不得**把 Fixture A 的答案（`Receipt = concept`）写进去。
> 这不是 overfitting，而是让模型拿到**完整题目**。

审计结果见 `results/prompt-parity-audit.md`。

### 7.2 两件明确不做

```text
❌ 不因为 14/15 run 超预算就把 preferred budget 12 改成 20
   —— 现在还不知道是"12 太低"还是"AI 缺少先理解再选择的过程"。
      Inventory + Selection 跑完之后这个问题才有答案：
      如果模型明确知道 30 条语义、并能解释「12 条 → L0 / 18 条 → Topic-L1 / 0 条丢失」，
      那 12 可能完全合理。

❌ 不扩 check-map 去理解 edge.label / relationGap 的语义（见 §5）
```

---

## 8. 实验设计（**先只用 D 和 E**）

D 与 E 已是极好的两端：

```text
D   对象显式 · 结构复杂 · （F07 表现最好）
E   机制隐含 · 异常/约束丰富 · （F07 表现最差）
```

```text
本阶段只跑：D × 3 + E × 3 = 6 runs
对照臂（**已存在，不需要重跑**）：F07 的 D × 3 / E × 3（Document → Map，旧 prompt）
新臂：Document → Semantic Inventory → Map（Stage B 新 prompt）
```

**判定标准（先写死，不许事后放宽）：**

```text
✅ 如果 E 的机制 anchor 从 0–1/3 明显提升，**且 D 没有退化** → 再扩到 A / B / C
❌ 若两者都不动 → 说明"拆两步"不是根因，回到假设重审
```

**已知混杂（必须登记）**：新臂同时改了两件事 —— ①两步生成 ②prompt parity 修复。
若要拆开归因，可另加第三臂（两步 + **旧** Stage B prompt）。**当前先不做**，只登记。

---

## 9. 交付物

```text
docs/features/10-semantic-grounding/
├── README.md                     ← 本文件
├── execution-prompt.md
├── validation-checklist.md
└── results/
    ├── prompt-parity-audit.md    （Phase 0 · 已完成）
    ├── inventory-review.md       （Phase 2：Inventory 抽全了吗）
    ├── selection-analysis.md     （Phase 2：选择轨迹 + 四类失败归因）
    ├── e-anchor-comparison.md    （Phase 3：E 的机制 anchor 新旧对比）
    └── final-gate.md             （Phase 4）

ai/semantic-inventory.prompt.md           Stage A prompt（新）
ai/framework-map-synthesis.prompt.md      Stage B prompt（新；parity 修复后）
schema/semantic-inventory.schema.json     generation evidence（**非 L0 契约**）
schema/map-selection.schema.json          generation evidence（**非 L0 契约**）
scripts/generate-semantic-inventory.js    Stage A runner
scripts/generate-framework-map.js         Stage B runner（扩展 --inventory / --selection）
experiments/semantic-inventory/           Stage A 产物
experiments/framework-map-generation/     Stage B 产物（沿用 F07 的目录纪律）
```

---

## 10. 明确不做

```text
❌ 不新设计 schema 去替代 framework-map（本阶段的产物是 inventory + selection trace，不是新契约）
❌ 不新增第 7 类 element / 不扩 relation vocabulary / 不改 qualifiers（Contract v1 不动）
❌ 不把 selection trace 塞进 Framework Map Contract
❌ 不扩 check-map 做语义分析
❌ 不改 preferred budget 12
❌ 不把 Fixture A 的具体答案写进 prompt（只给通用规则）
❌ 不在 E/D 验证成功之前扩到 A/B/C
❌ 不因为单次运行不满意就改 prompt 重跑到好看（失败产物原样保留）
```

---

## 11. Gate

沿用四档：**PASS / PARTIAL PASS / FAIL / BLOCKED**。

```
PASS          四层各自独立成立：Structural ✅ · Framework Coverage 有可复算的数字 ·
              Navigation ✅ · Semantic Faithfulness 在 D/E 上都达标；
              四类失败归因可逐条落到"哪一步丢的"
PARTIAL PASS  拆两步在 E 上有提升但未达标，或 D 出现退化
FAIL          四类失败无法归因（说明中间表示没起到作用），或模型只学会了"多列语义"
BLOCKED       仅限 Gateway / IO 导致实验无法执行
```

**收尾必须回答：**

```text
1. E 的机制语义丢在 Extraction 还是 Selection？
2. D 在新链路上有没有退化？
3. Inventory 有没有引入新的失败形态（例如把原文句子当语义条目的"抄写式穷举"）？
4. "先理解再选择"是否真的让模型拿到了"完整题目"？
```

---

## 12. 与最终愿景的关系

```text
现在：Markdown → AI → Framework Map
目标：Markdown → Semantic Understanding → Topic / Framework Selection
              → L0 Framework Map → L1 → L2 Visual Blocks
```

本 Feature 验证成功，就把**最早那条 Semantic Coverage Planning 线**与**现在的 L0 Framework Map 线**接了起来 ——
这件事的意义大于"再给 map 加字段"。
