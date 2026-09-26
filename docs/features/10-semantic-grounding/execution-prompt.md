# Feature 10 · 执行任务书（executor 用）

> 设计、边界、失败分类见同目录 `README.md`。**本文件的顺序是强制的。**
> 缩写：S-A = Semantic Inventory（Stage A）· S-B = Framework Map Synthesis（Stage B）· Audit = Semantic Audit

---

## 0. 当前进度

```text
✅ Phase 0  Prompt Parity Audit              results/prompt-parity-audit.md（5 个真缺口 + 5 段补丁）
✅ Phase 1a 两份 prompt                       ai/semantic-inventory.prompt.md · ai/framework-map-synthesis.prompt.md
✅ Phase 1b 两份 generation schema            schema/semantic-inventory.schema.json · schema/map-selection.schema.json
⬜ Phase 1c 运行器（两阶段 driver）            scripts/run-semantic-grounding.js  ← **下一步**
⬜ Phase 1d 离线产物安全验证（stub，零模型调用）
⬜ Phase 2  D × 3 + E × 3 正式实验（6 runs）
⬜ Phase 3  Semantic Audit + 四类失败归因
⬜ Phase 4  Gate
```

**在 Phase 1c/1d 完成之前，不要调用模型。**

---

## Phase 1c · 两阶段运行器（待实现）

**一次 run = 两个阶段写在同一个 run 目录里**（这样"丢在哪一步"才可归因）：

```text
experiments/semantic-grounding/fixture-{d,e}/run-NN/
├── request-stage-a.json          请求元数据（provider/model/参数/prompt 指纹/文档 sha；不含 key）
├── raw-inventory-response.txt    Stage A 的 content 原文
├── semantic-inventory.json       仅经成功写入协议产生
├── request-stage-b.json
├── raw-synthesis-response.txt    Stage B 的 content 原文（含两个 JSON 块）
├── framework-map.json            仅经成功写入协议产生
├── map-selection.json            仅经成功写入协议产生
├── check-map.txt                 validator 输出（PASS / FAIL 都保留）
└── run-meta.json                 两阶段的 status / 协议步骤 / 产物 sha / 参数 / 完整性校验
```

**命令（目标形态）：**

```bash
# 完整一次实验 run（Stage A → Stage B）
node scripts/run-semantic-grounding.js --fixture e

# 只跑 Stage A（用于单独看"抽全了吗"）
node scripts/run-semantic-grounding.js --fixture e --stage a

# 复用已有 inventory 重跑 Stage B（**只允许指向同 run 目录内已冻结的 inventory**）
node scripts/run-semantic-grounding.js --fixture e --stage b --inventory experiments/semantic-grounding/fixture-e/run-01/semantic-inventory.json

# 离线产物安全验证（stub，零模型调用）
node scripts/test-semantic-grounding.js
```

**必须沿用 F07 已冻结的四条纪律**（`docs/features/07-ai-framework-map-generation/README.md` §3）：

```text
1. 每次运行独立目录；--run N 撞车直接拒绝（退出码 3），不写任何文件
2. 成功写入协议：temp → read-back 解析 → 原子 rename；任何一步失败不产生最终文件
3. 失败请求绝不覆盖既有产物；validator FAIL / 结构不合法的产物**原样保留**
4. **绝不 repair**：不补 sectionRef、不替换表外 relation、不删超预算元素、不替模型补 selection decision
```

**另外三条本 Feature 专有的完整性校验（属 run-meta，不属契约）：**

```text
· semantic-inventory.json 的 items[].id 连续且不重复
· map-selection.json 的 decisions 必须**恰好覆盖** inventory 的每一个 id（缺一条 = 该 run 记为 incomplete）
· decision=="omitted" 时 target 必须为 null；其余 decision 的 target 必须非空
```

> ⚠️ 这三条**只记录、不修复**。模型漏了就是漏了 —— 那正是 Selection Miss 的证据。

---

## Phase 1d · 离线安全验证（零模型调用）

`scripts/test-semantic-grounding.js` 必须证明（stub 注入，参照 F07 的 33 条断言）：

```text
[ ] Stage A 成功 → 五类产物齐全
[ ] Stage A 返回非 JSON → 保留 raw，不产生 inventory，**不猜**
[ ] Stage A 失败中止 run → 不进入 Stage B，既有 run 产物字节未变
[ ] Stage B 返回两个 JSON 块 → 正确切分（<<<FRAMEWORK_MAP>>> / <<<MAP_SELECTION>>>）
[ ] Stage B 只有一个块 / 块缺失 → 保留 raw，不产生 map-selection，**不补**
[ ] Stage B 的 selection 漏条目 → run-meta 标 incomplete，产物保留
[ ] validator FAIL → 产物保留 + check-map.txt 记录
[ ] HTTP 503 / 传输失败 → 不覆盖任何既有产物（sha 逐一核对）
[ ] 任一阶段存在 .tmp.json 残留 → 断言失败
```

---

## Phase 2 · 正式实验（D × 3 + E × 3）

```bash
for i in 1 2 3; do node scripts/run-semantic-grounding.js --fixture d; done
for i in 1 2 3; do node scripts/run-semantic-grounding.js --fixture e; done
```

**对照臂已经存在，不要重跑：**

```text
旧臂（Document → Map，F07 prompt，1 步）：
  experiments/framework-map-generation/fixture-d/run-01..03
  experiments/framework-map-generation/fixture-e/run-01..03
新臂（Document → Inventory → Map，F10 Stage B prompt，2 步）：
  experiments/semantic-grounding/fixture-{d,e}/run-01..03
```

**已知混杂（必须登记在 `results/` 里）：** 新臂同时改了两件事 —— ①拆两步 ②按 parity audit 修了 5 个 prompt 缺口。
若要拆开归因，可加第三臂（**两步 + F07 原 prompt**）。**本阶段先不做**，只登记。

**参数与模型必须与旧臂一致**（否则不可比）：

```text
provider / model / temperature / max_tokens / max_attempts
—— 逐 run 从 run-meta.json 读，并与旧臂记录比对；不一致就是实验无效
```

---

## Phase 3 · Semantic Audit（本 Feature 的新审计环节）

**审计分四类落点**（`README.md` §4）：

```text
Extraction Miss       原文有 → Inventory 没有
Selection Miss        Inventory 有 → Map 没有（或 decision=omitted）
Encoding Distortion   选中了但 type / direction / relation 表达错
Escape-hatch Misuse   塞进 edge.label / relationGap / topic 命题等自由位
```

**审计顺序（每一步都要落到 §key / 行号 / 产物 label）：**

1. **Inventory 质量**（`results/inventory-review.md`）
   - 逐 anchor 检查：E 的 6 个 anchor（正常 / 异常 / 人工介入+越权 / 有界失败 / 资产一致性 / 章节骨架）
     、D 的 7 个 anchor，在 Inventory 里有没有对应条目？
   - **反向检查（防"抄写式穷举"）**：有没有把原文整句抄一遍、statement 不可判断真假、或同义重复拆成多条？
2. **Selection 完整性**（`results/selection-analysis.md`）
   - 用 `map-selection.json` 逐条过：decision 与其 target 在 `framework-map.json` 里是否真的成立？
     （**重点查"声称 covered 但图上没有"** —— 这是最容易被 gaming 的一步）
   - 四类失败逐条归因，形成"丢在哪一步"的表
3. **E 的机制 anchor 新旧对比**（`results/e-anchor-comparison.md`）

```text
            旧臂（F07）      新臂（F10）
A2 异常路径   0/3               ?
A3 越权边界   0/3               ?
A4 有界失败   0/3               ?
A5 资产一致性 0/3               ?
```

4. **D 是否退化**（同表，用 D 的 7 个 anchor）

---

## Phase 4 · Gate

按 `README.md` §11 判四档，并回答：

```text
1. E 的机制语义丢在 Extraction 还是 Selection？
2. D 在新链路上有没有退化？
3. Inventory 有没有引入新的失败形态（抄写式穷举 / statement 不可判断 / 同义重复）？
4. "先理解再选择"是否真的让模型拿到了"完整题目"？
```

**扩到 A/B/C 的条件（先写死）：** E 的机制 anchor 明显提升 **且** D 没有退化。否则不扩，回到假设重审。

---

## 硬约束（违反即实验作废）

```text
❌ 不改 Contract / schema/framework-map.schema.json / check-map（Structural Validation 不动）
❌ 不改 preferred budget 12
❌ 不把 selection trace 塞进 framework-map 契约
❌ 不让 check-map 去读 edge.label / relationGap 的语义（那是 Semantic Audit 的事）
❌ 不把 Fixture A 的具体答案写进 prompt（只给通用判别规则）
❌ 不因为某次 run 不满意就改 prompt 重跑到好看（失败产物原样保留、run 编号只增不减）
❌ 不在 D/E 验证成功之前扩到 A/B/C
❌ 不在 Phase 1c/1d 完成前调用模型
```

**prompt 指纹纪律：** 新臂的每一次 run 都记录 Stage A / Stage B 两个 prompt 的 sha256。
一旦中途改动任一 prompt，**之前的 run 与之后的 run 不是同一实验**，必须在 `results/` 标出分界。
