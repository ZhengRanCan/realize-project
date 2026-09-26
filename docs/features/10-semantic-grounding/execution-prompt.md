# Feature 10 · 执行任务书（executor 用）

> 设计、边界、失败分类见同目录 `README.md`。**本文件的顺序是强制的。**
> 缩写：S-A = Semantic Inventory（Stage A）· S-B = Framework Map Synthesis（Stage B）· Audit = Semantic Audit

---

## 0. 当前进度

```text
✅ Phase 0   Prompt Parity Audit              results/prompt-parity-audit.md（5 个真缺口 P1–P5 + 5 段补丁）
✅ Phase 1a  两份 prompt                       ai/semantic-inventory.prompt.md · ai/framework-map-synthesis.prompt.md
✅ Phase 1b  两份 generation schema            schema/semantic-inventory.schema.json · schema/map-selection.schema.json
✅ Phase 1c  两阶段运行器                      scripts/run-semantic-grounding.js
✅ Phase 1d  离线产物安全验证                   scripts/test-semantic-grounding.js → **48/48 通过（零模型调用）**
⬜ Phase 2  D × 3 + E × 3 正式实验（6 runs）
⬜ Phase 3  Semantic Audit + 四段归因（E1–E4）
⬜ Phase 4  Gate
```

**Phase 1c/1d 已完成 → 可以进入 Phase 2。**

---

## Phase 1c · 两阶段运行器（已完成）

一次 run = 两个阶段写在**同一个** run 目录里（这样"丢在哪一步"才可归因）：

```text
experiments/semantic-grounding/fixture-{d,e}/run-NN/
├── request-stage-a.json          请求元数据（provider/model/参数/prompt 指纹/文档 sha；不含 key）
├── raw-inventory-response.txt    Stage A 的 content 原文
├── semantic-inventory.json       仅经成功写入协议产生（**中间态是实验数据**）
├── request-stage-b.json
├── raw-synthesis-response.txt    Stage B 的 content 原文（含两个 JSON 块）
├── framework-map.json            仅经成功写入协议产生
├── map-selection.json            仅经成功写入协议产生
├── check-map.txt                 validator 输出（PASS / FAIL 都保留）
└── run-meta.json                 两阶段 status / 协议步骤 / 产物 sha / 参数 / **integrity 报告**
```

**命令：**

```bash
node scripts/run-semantic-grounding.js --fixture e                      # 两阶段完整 run
node scripts/run-semantic-grounding.js --fixture e --stage a            # 只跑 Stage A
node scripts/run-semantic-grounding.js --fixture e --stage b \
     --inventory experiments/semantic-grounding/fixture-e/run-01/semantic-inventory.json
node scripts/test-semantic-grounding.js                                # 离线安全验证（零模型调用）
```

**退出码：** `0` 干净 · `1` 记录完成但 integrity FAIL 或 check-map FAIL · `2` 传输/解析失败 · `3` 拒绝覆盖 · `4` 用法。

**沿用 F07 四条纪律**：独立目录 / temp→read-back→原子 rename / 失败不覆盖 / **绝不 repair**。

**本 Feature 专有的 integrity 校验（记录在 `run-meta.json.integrity`，只报告不修补）：**

```text
duplicate id                                 同一 id 出现两次
unknown referenced id                        引用了不存在的 id / §key
selection missing inventory id               inventory 有、selection 没有
selection references nonexistent map target  target 指向不存在的 element/topic/edge/attachment
same inventory item twice                    selection 重复记录同一条
target.kind 与真实 type 不符                  声称 constraint 但 target 是 artifact 之类
```

> ⚠️ **不查"id 必须连续"** —— `S-001 / S-002 / S-004` 只要没有引用 `S-003` 就不是语义错误；
> 把连续设成完整性条件只会因为跳号被记成 generation failure，反而污染实验。
> **Identity consistency > numbering aesthetics.**

---

## Phase 1d · 离线安全验证（已完成 · 48/48）

覆盖的注入情形（**重点打两阶段中间失败**）：

```text
[✓] A ok + B ok                        → 9 件产物齐全 · check-map PASS · integrity 干净
[✓] A ok + B HTTP 503                  → **Inventory 必须保留**，无 map/selection
[✓] A ok + B parse fail                → Inventory + B raw 都保留
[✓] A ok + B 只返回一个块               → 连 framework-map.json 也不产生（两产物同生共死）
[✓] A malformed inventory（缺 items）   → **不允许进入 Stage B**，malformed 产物本身仍保留
[✓] inventory duplicate id             → 同样不进 Stage B，报 duplicate id
[✓] selection 少一条                    → map/selection 原样保留 + integrity FAIL + **不自动补**
[✓] selection 指向不存在 element        → 原样保留 + integrity FAIL
[✓] target.kind=constraint 指向 artifact → 报「声称 constraint 但 type 是 artifact」
[✓] A 非 JSON / A 传输失败              → 保留 raw，无 inventory，无 Stage B
[✓] --stage a 单独跑 / --stage b 复用冻结 inventory（记录来源 + sha）
[✓] --run 1 撞车 → 退出码 3，既有产物字节未变；无 .tmp.json 残留
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

**已知混杂 ①（本 Feature 引入）**：新臂同时改了 ①两步生成 ②按 parity audit 修的 5 个 prompt 缺口。

**已知混杂 ②（模型漂移 · 必须随结果一起注明）：**

```text
Historical control from F07.
Same declared model / provider / generation params,
but backend model version may not be independently pinned.
```

→ 结果是 **engineering comparison，不是严格随机对照实验**。
若 F10 改善巨大，后面可只补 `D 当前单阶段 ×1` + `E 当前单阶段 ×1` 作 contemporaneous sanity control；
**没必要现在先加第三臂。**

---

## Phase 3 · Semantic Audit（本 Feature 的新审计环节）

**四段归因，错误只允许归到 E1–E4 之一**（详见 `README.md` §4）：

```text
E1 Extraction Miss        原文有 → Inventory 没有
E2 Selection Miss         Inventory 有 → Stage B omitted / 无合法 target
E3 Encoding Distortion    选中了但 type / direction / 宿主 / contains-reference 错
E4 Escape-hatch Misuse    声称表达了，实际只在 edge.label / topic 命题 / meta.note / 伪 relationGap
```

**审计顺序（每一步都要落到 §key / 行号 / 产物 label）：**

1. **Stage A 独立评价**（`results/inventory-review.md`）——
   **⚠️ 不得用 Stage B 的成功倒推 Stage A。** 先独立打开 `semantic-inventory.json`：
   ```text
   Recall              对照 anchors 逐条查：原文的关键机制/约束有没有被抽到
   Precision           抽出来的东西原文真的说了吗
   Granularity         有没有把一句拆成五个近义 item / 该拆的合并了
   Provenance quality  §key 合法？行号对得上？quote 能支撑 statement？
   反向病              重复拆分 · 只抽名词不抽机制 · 把 example 当 invariant · 把实现细节提升为设计语义
   ```
   **抽出来 60 条也不代表 Stage A 好。**
2. **Selection 完整性**（`results/selection-analysis.md`）
   - 逐条核 `map-selection.json` 的 disposition 与 target 在 `framework-map.json` 里**是否真的成立**
     （重点查"声称 represented 但图上没有" —— 这是最容易被 gaming 的一步）
   - 形成"丢在哪一步"的 E1–E4 归因表
3. **E 的机制 anchor 新旧对比**（`results/e-anchor-comparison.md`）

```text
            旧臂（F07）      新臂（F10）
异常路径      0/3               ?
越权边界      0/3               ?
有界失败      0/3               ?
资产一致性    0/3               ?
跨 run 锚点稳定性  无 3/3        ?
```

4. **D 是否退化**（同表，用 D 的 7 个 anchor）

```text
D 侧检查项：entity recall 保持 · invented relation 减少（F07 3/3/4）·
            方向错误减少（F07 2/0/1）· 不因 Inventory 变大而变啰嗦
```

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
