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

## 4. 四段归因（**本 Feature 的核心产出**）

链路被正式钉成四段，错误**只允许**归到这四类：

```text
Source
   ↓  ①
Stage A · Semantic Inventory
   ↓  ②
Stage B · Selection
   ↓  ③
Framework Map Encoding
```

| 失败类 | 判定 | 含义 |
|---|---|---|
| **E1 · Extraction Miss** | 原文有，**Inventory 没有** | AI **没看到**。例：原文有"连续 10 次失败 → REFUND_FAILED"，`semantic-inventory.json` 里根本没有 |
| **E2 · Selection Miss** | Inventory 有，**Stage B 丢掉**（`disposition = omitted`，或没有合法 representation） | AI 看到了，但**压缩时丢了** |
| **E3 · Encoding Distortion** | Inventory 有、Selection 也说 selected，但最终 **type 错 / relation direction 错 / constraint 挂错宿主 / contains↔reference 混淆** | 看到了、也决定保留，但**表达错了** |
| **E4 · Escape-hatch Misuse** | Inventory 有、Stage B 也**声称**表达了，但实际塞进 `edge.label` / topic proposition / `meta.note` / 伪 relationGap | **绕过 Contract 的表达** —— 没有真正进入 semantic-bearing structure |
| **E5 · Over-representation** | Inventory 里**大量低层、重复或从属语义被一一提升为** Framework Map 承载对象，导致 L0 **丧失认知压缩职责** | 不是"丢了"，而是"全都要" —— 清单被当成待办列表 |

**E5 的典型信号**（**不是**单纯 `elements > 12`）：

```text
· Inventory → represented ratio 极高（接近 100%）
· 大量 target 只承载 1 条 semantic item（1:1 传导）
· L0 element 数明显接近 Inventory 的条目粒度
```

> **实测样本（D/run-01）**：`154 / 154 represented` · `81 elements` · `27 个 target 只承载 1 条` —— 标准 E5。
> 详见 `results/selection-analysis.md`。

**E5 的根因是结构性的，不是模型偷懒**：当时的 Stage B 只加压力、不加筛选
（每一条都要有 disposition + 五类不许 omitted + budget 12 只是 Warning + 没有任何"先选 ≤12"的要求）
→ 面对 154 条，最不会违规的解法就是全部 represented。
**修法是让 Selection 发生在 Encoding 之前**（见 `ai/framework-map-synthesis.prompt.md` §八）。

判定路径（以 E 的 `10 次 → REFUND_FAILED` 为例）：

```text
Inventory 有？                       ← 必须先**独立看 semantic-inventory.json**
  ├─ No  → E1 Extraction Miss（理解阶段失败）
  └─ Yes → Stage B 有合法 disposition？
             ├─ No（omitted / 无 target）      → E2 Selection Miss（压缩失败）
             └─ Yes → 最终 map 里真的落在该结构上？
                        ├─ No（只在 label/命题/note 里） → E4 Escape-hatch Misuse
                        └─ Yes 但 type/方向/宿主错      → E3 Encoding Distortion
```

**⚠️ Stage A 的评价不能用 Stage B 的成功倒推。** 例如 E 最终 map 里没有"管理员强制补偿"，
**不能**直接判 `Extraction Miss` —— 必须先打开 `semantic-inventory.json` 看它有没有抽出来。

**Stage A 自己需要一套独立评价（人工记录，不做自动评分）：**

```text
Recall              原文的关键机制/约束有没有被抽到（对照 anchors 逐条查）
Precision           抽出来的东西是不是原文真的说的（有没有"把常识当文档语义"）
Granularity         粒度是否合适：有没有把一句语义拆成五个近义 item、有没有该拆的合并
Provenance quality  出处是否精确（§key 合法、行号对得上、quote 能支撑该 statement）
```

**并且：Inventory 抽出来 60 条也不代表 Stage A 好。** 还要反向审查这几种病：

```text
· 重复拆分 / 把一句语义拆成多个近义 item（凑数量）
· 只抽名词、不抽机制（noun/object bias 换了个地方复发）
· 把 example 当 invariant
· 把 implementation detail 提升为 design semantic
```

---

## 4.1 完整性校验的判据：**Identity consistency > numbering aesthetics**

`semantic-inventory` / `map-selection` 的完整性**不含**"id 连续"。

```text
🚫 blocking（**不允许进入 Stage B**）—— 内容级 / 身份级
   duplicate id                       同一 id 出现两次（无法唯一识别 semantic item）
   dangling semantic reference        引用了不存在的 semanticId / §key
   malformed inventory structure      顶层或 items 结构不成立
   无法唯一识别 semantic item          缺 id、缺 statement、缺 sources
   selection missing inventory id     inventory 有、selection 里没有
   selection references nonexistent map target   target 指向不存在的 element/topic/edge/attachment
   same inventory item twice          selection 对同一条重复记录
   target.kind 与真实 type 不符        声称 constraint 但 target 是 artifact 之类

⚠️ advisory（**记录为 integrity FAIL，但继续 Stage B**）—— 纯编号格式
   例：`S-152b` 这种编号格式不符合规范
   前提：ID 唯一 + 引用闭合 + selection 能正确引用 + 语义内容合法
   理由（用户裁决）：一个编号格式问题**不能**把 E2/E3/E4 的归因全部遮掉。

❌ 不查的
   "id 必须连续"  —— S-001 / S-002 / S-004 只要没有引用 S-003，就不是语义错误。
                    把连续设成完整性条件，只会因为跳号被记成 generation failure，反而污染实验。
```

> **Identity consistency > numbering aesthetics.**
> 以上全部由 runner 在 `run-meta.json.integrity` 里记录，**只报告、不修补**（模型漏了就是漏了，那正是 E2 的证据）。

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

### 7.3 一条容易读错的规则

「§四 的『不可以砍』五类不允许 `omitted`」**不等于**"它们必须成为 element"。
三种归宿都合法：

```text
· 成为 element（或 type=constraint 的元素）
· 作为 constraint / concept / state 的 attachment 侧挂到宿主
· 被一条 edge 正经表达（type + qualifiers）
```

`topic-only` 是**弱归宿**：只有确实不适合进图时才用，且必须在 reason 里说明。
这条规则的目的是：**即使某条语义不适合成为主节点，也不能在 L0 压缩中静默消失。**

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

**判定标准（先写死，不许事后放宽）。真正要看的不是"Semantic PASS 从多少变多少"，而是：**

```text
D 侧（F07 最成功 —— 检查**没有因为拆两步而退化**）
  · entity recall 是否保持（12 个实体仍全覆盖）
  · invented relation 是否**减少**（F07：3/3/4 条）
  · relation direction 错误是否**减少**（F07：2/0/1 处）
  · 是否因为 Inventory 变大而**变啰嗦**（elements / edges / topics 不应显著膨胀）

E 侧（F07 最失败 —— 检查**机制是否被救回来**）
  · 异常路径 recall ↑          （F07：0/3）
  · 人工介入 / 越权边界 recall ↑ （F07：0/3）
  · bounded failure recall ↑    （F07：0/3，且"连续 10 次 → REFUND_FAILED"必须落在一个正经结构上）
  · invariant recall ↑          （F07：0/3）
  · 跨 run anchor stability ↑   （F07：无任何 3/3 锚点）
```

```text
✅ 若 E 明显改善 **且** D 不退化 → 这个方向有强证据，扩到 A / B / C
❌ 若两者都不动 → 说明"拆两步"不是根因，回到假设重审（不要直接加第三臂）
```

**已知混杂 ①（本 Feature 引入）**：新臂同时改了两件事 —— ①两步生成 ②按 parity audit 修的 5 个 prompt 缺口。
若要拆开归因，可加第三臂（两步 + **F07 原 prompt**）。**本阶段先不做**，只登记。

**已知混杂 ②（模型漂移 · 必须随结果一起注明）：**

```text
Historical control from F07.
Same declared model / provider / generation params,
but backend model version may not be independently pinned.
```

即：旧臂（F07 的 D/E × 3）虽然 model name / provider / 参数与 F10 相同，
但如果 DeepSeek 用的是**未版本锁定的模型别名**，服务端模型本身可能已经更新。
**这不阻塞实验** —— 只意味着结果是 **engineering comparison，不是严格随机对照实验**。

```text
若 F10 改善巨大、后面真想确认：只补 D 当前单阶段 ×1 + E 当前单阶段 ×1 作为
contemporaneous sanity control 即可。**没必要现在先加第三臂。**
```

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

### 11.1 当前状态（截至 E×1 / E 复现 / D×1 / 成本实验）

| 维度 | 状态 |
|---|---|
| Semantic extraction | ✅ 初步成立（Stage A 在 E 上 95 条、D 上 136 条，结构合法） |
| Selection compression | ✅ 初步稳定（E：13 / 13 elements；D：13；对照 E5 失败样本 81） |
| **E5 over-representation** | ✅ **已被压住**（1:1 占比 42% → 13–32%；element 数 81 → 12–13） |
| Runbook anchors（E 侧） | ✅ 稳定改善（F07 的 0–1/3 → 4/4 有承载；manual intervention 在 run-06 显式为「仅管理员强制补偿」） |
| **Regression：D core relation resolution** | ⚠️ **未关闭** —— `Task --depends-on--> Task` 被降级成只剩 constraint 层（判定 E3 Encoding Distortion，见 `results/d1-regression.md` §3） |
| **Known representation gap** | 📌 **已升级登记**：**Constraint Composition / Compression Gap**（原 Structured Constraint Gap；见 `results/d1-regression.md` §4.1） |
| Cost efficiency | ✅ 已测：`reasoning_effort=low` 省 Stage A 80% / Stage B 61%，5/5 anchor 保留；⚠️ 但本次丢了 `state` 元素 → 记为**候选优化，暂不设为默认**（`results/cost-experiment.md`） |

**Gate 倾向**：`PARTIAL PASS`（E 侧成立、D 侧有一条基础关系未关闭）。
最终判定需在 Phase 3 人工审计（`results/inventory-review.md` 等）完成后给出。

### 11.2 明确未关闭 / 已登记的事项

```text
未关闭 ①  D 的 Task --depends-on--> Task（基础关系层）—— 不用 prompt 打补丁，留给下一阶段
已登记 ②  Constraint Composition / Compression Gap（constraint 缺组成语句表达面）
已登记 ③  low effort 下的类型保真度（state 元素消失）—— 需 1–2 次补样才决定是否采用 low
待审计 ④  run-08 的 S-40 被 omitted 但疑似属于「不可以砍」五类
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
