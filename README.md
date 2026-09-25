# Design Review MVP（收缩版）

把一份长篇 Markdown 设计文档转换成**先看懂整体、再逐条决定**的两页应用：

```text
Markdown 设计文档
        ↓
   （本轮：按协议抽取，尚未接入 AI）
        ↓
fixtures/context-consumption.json     ← design-review.json 结构
        ↓
┌───────────────────────────────────┐
│ 1. 方案总览（Visual Overview）      │  这个方案在说什么？主要结构/流程是什么？
│ 2. 决策清单（Decision List）        │  接下来我要决定哪几件事？
└───────────────────────────────────┘
        ↓
   人工审核
        ↓
human-review.json
```

本轮测试样本：`测试文档/18-context-consumption-semantic-model.md`（540 行）。

---

## 1. 当前状态

| 项目 | 状态 |
|---|---|
| Phase 1（fixture → 两页 UI → human-review.json） | ✅ 已完成，自检通过 |
| 方案总览：一句话摘要 + 1 主图 + 1 辅助图 + 极简决策摘要 | ✅ |
| 决策清单：12 条决策，默认 5 项可见，其余折叠 | ✅ |
| 同意 / 不同意 / 以后再说 → human-review.json | ✅ |
| AI 生成 design-review.json | ⛔ 未接入（只有协议草稿 `ai/analysis-protocol.phase2.md`） |
| 源码分析 / Source Retriever | ⛔ 未实现（Evidence 目前全部是 document-claim） |

**刻意不做**：完整 Design Review Dashboard、Current/Target 与 Open Questions 的独立页面、统计卡片墙、数据库、云服务、多人协作、自动实现设计、自动批准决策。

---

## 2. 两个页面

### 方案总览（Overview）—— 完整文档的视觉重述

**不是摘要。** 目标是"不打开原 Markdown，只通过总览就能把这份方案讲给另一个人听"。因此：

- **甲 · 这是什么 → 乙 · 它怎么跑 → 丙 · 怎么算发生了 → 丁 · 边界与反模式** 四段推进（按认知路径，不按原文章节顺序）；
- **O-01 ~ O-15 共 20 个区块**全部有承载位置，默认展开 11 / 折叠 9 —— **结构性折叠，不是编辑性删减**；
- **左侧常驻文档目录**：列出四段与每个区块，滚动时高亮"当前阅读"位置，点击直接跳转；
- **每个区块右上角带 `Source: §9, §10` 标签**：点开右侧原文面板显示对应段落，**不跳走**。平时靠视觉重述理解，怀疑某一点时一键回原文核对；
- 区块底部列出关联的 Review Object（Decision / Gap / Open Question 编号），点击可跳到决策清单。

八种承载形式（由内容形状决定，不是内容去将就组件）：

| 形式 | 用在哪 | 例子 |
|---|---|---|
| `flow` | 链路 / 现状-目标 | O-04 系统骨架（双 lane）、O-05 两条链 |
| `matrix` | 能/不能、职责对照 | O-07 三级"能说明 / 不能说明"、O-06 职责边界 |
| `ladder` | 递进 / 阶梯 | O-02 三级递进、O-10 证据阶梯 |
| `diff` | 被考虑 vs 被采用 | O-03 为什么不做第四级 |
| `steps` | 反例走查 | O-12 worked-example-first |
| `combo` | 状态组合枚举 | O-13 五种状态组合、O-11b 不一致状态 |
| `checklist` | 反例 / 非主张 / 边界 | O-10b 不能单独证明 Consumption、O-15 不决定与不承诺 |
| `prose` | 定位声明 | O-01 本文只是语义层、不构成实现授权 |

只有 2 处真的用图（O-04、O-05），其余 18 块用表格 / 对照 / 清单 / 阶梯 / 走查 —— 因为图只擅长表达关系。

**`Source` 标签的数据来自 `docs/source-sections.json`**，由 `npm run source` 从 Markdown 自动切分（§0 文档头 + §1-§15 章节），保证标签永远能定位到真实段落。

### 决策清单（Decision List）

所有决策在一个页面，按 `reviewLevel` 分成三组：核心判断（高优先级）/ 支撑性判断 / 推导性判断。

**每条决策默认只展示 5 项**：

```text
DEC-007                                   [高优先级] [未决定]
Primary Consumption Point = outline generation
问题       完整 Frozen Context 应主要在哪里消费？
AI 建议    位于 outline generation。链路为 freeze/resolve → outline route → projection → planner → attempt → 持久化。
为什么这样建议  scene pipeline 的职责是实现已经产生的 outline；让每个 scene 直接消费完整 context 会造成重复解释、revision 混用与成本上升。
[同意]  [不同意]  [以后再说]                        [查看详情]
```

点击 **查看详情** 后展开七项：Alternatives / Full Rationale / Consequences / **Current / Target** / **Evidence** / **Open Questions** / Dependencies & Related。

---

## 3. 数据契约要点

### 3.0 两级流水线（Stage 1 已定型，尚未接 AI）

```text
Markdown
  ↓ Stage 1：Semantic Coverage Planning        ← 正式 Prompt 尚未编写
  ↓ overview-plan.json                          ← schema/overview-plan.schema.json
  ↓ npm run check-plan                          ← 闸门：Hard Error 不许进 Stage 2
  ↓ Stage 2：逐块生成视觉内容                    ← 正式 Prompt 尚未编写
  ↓ overview（design-review.json 的 overview 字段）
  ↓ Renderer
```

`overview-plan.json` 同时表达六件事：原文有哪些 **Semantic Unit**、它们如何组合成 **Visual Block**、
每个 Block 用什么 **Shape**、哪些重复论证被**合并**、每个 Block 对应哪些**原文来源**、关联哪些 **Review Object**。

核心原则：**语义覆盖，不要求句子覆盖。** 允许合并重复论证、重写措辞、改变信息顺序、使用折叠；
不允许丢失重要定义 / 边界 / 例外 / 反例 / Current-Target 差异 / 未决事项，不允许把未决定的内容写成结论。

```json
{
  "planVersion": 1,
  "designRef": { "id": "DESIGN-CONTEXT-CONSUMPTION", "path": "fixtures/context-consumption.json" },
  "shapeVocabularyVersion": "shape-catalog-v1",
  "sourceUnits": [
    {
      "id": "SU-022",
      "section": "§5",
      "kind": "definition",
      "statement": "Consumption 表示本次 outline generation 实际使用了冻结上下文中的教学语义，并将其作为课程设计输入。",
      "importance": "core"
    }
  ],
  "blocks": [
    {
      "id": "O-07",
      "title": "三个层级分别能说明什么、不能说明什么",
      "stage": "how",
      "shape": "capability-matrix",
      "covers": ["SU-013", "SU-014", "SU-018", "SU-022"],
      "sourceRefs": [
        { "section": "§3", "role": "boundary" },
        { "section": "§4", "role": "boundary" },
        { "section": "§5", "role": "definition" }
      ],
      "reviewObjects": ["DEC-004"],
      "defaultExpanded": true
    }
  ],
  "duplicatesMerged": [
    {
      "sourceUnits": ["SU-005", "SU-025", "SU-040"],
      "keptInBlock": "O-02",
      "reason": "§1、§5、§8 三处重述「层级不能互相替代」，语义同一，合并为一次边界表达。"
    }
  ]
}
```

- `covers`（sourceUnit id）是**语义覆盖的唯一声明**；`sourceRefs` 只负责"点开 Source 去哪"，不能替代覆盖。
- `kind` 15 个枚举、`importance` 只有 core / supporting —— 不做复杂评分。
- Shape 是**受控词汇表**，见 `docs/shape-catalog.md`（10 个形状 + `prose` 例外）。

### 3.1 design-review.json

```json
{
  "design": { "id": "", "title": "", "summary": "一句话摘要", "status": "draft", "sourceDocuments": [] },
  "summary": { "pendingDecisions": 0, "gaps": 0, "openQuestions": 0 },

  "overview": {
    "sections": [
      {
        "id": "what",
        "title": "甲 · 这是什么",
        "purpose": "先建立核心定义与系统骨架",
        "blocks": [
          {
            "id": "O-02",
            "title": "核心主张：保留三级递进",
            "stage": "what",
            "sources": ["§1"],
            "defaultExpanded": true,
            "reviewObjects": ["DEC-001"],
            "content": {
              "type": "ladder",
              "caption": "三个层级各自表示什么（不能互相替代）",
              "tiers": [{ "label": "Context Receipt", "text": "上下文到达了系统", "variant": "info" }]
            }
          }
        ]
      }
    ]
  },

  "facts": [],
  "decisions": [
    {
      "id": "DEC-001", "title": "", "type": "semantic-model", "reviewLevel": "root",
      "question": "", "proposal": "", "rationaleSummary": "一句话原因",
      "alternatives": [], "rationale": [], "consequences": [],
      "dependsOn": [], "affects": [],
      "relatedGaps": [], "relatedQuestions": [],
      "evidence": [{ "type": "document-claim", "source": "...", "section": "...", "description": "" }],
      "status": "pending"
    }
  ],
  "gaps": [],
  "openQuestions": []
}
``````

- `decisions[].status` 被 schema 用 `const: "pending"` 锁死 —— 人工结果写不进来；
- `reviewLevel` 决定分组与默认可见性，**不**决定 Gate；
- `openQuestions[].category` 决定是否阻塞：只有 `architecture-blocking` / `implementation-blocking` 阻塞；
- `evidence[].type` 只有 `document-claim`（文档主张，未核对）与 `source-verified`（源码/测试/配置已核对）两种；本 fixture 36 条全是前者，一致性检查与自检都断言「不得出现 source-verified」。

---

## 4. 三个审核动作

| 按钮 | 写入 human-review 的状态 | 语义 |
|---|---|---|
| 同意 | `approved` | 这个方案可以按此实施 |
| 不同意 | `rejected` | 方向不对，需要重新设计 |
| 以后再说 | `needs-revision` | 暂时搁置：信息不足或时机未到，需要时再回到这条 |

这三个动作覆盖 agent.md 第八节允许的状态集合，**没有新增状态类型**（`needs-evidence` 仍可由脚本或旧数据产生，Gate 同样按阻塞处理）。快捷键 `A` / `R` / `L` 作用于当前聚焦的决策卡片，`G` / `D` 切换两个页面。

---

## 5. 两个文件必须分离

```text
design-review.json   分析结果，decisions[].status 一律 pending
human-review.json    人类真实审批状态，只由用户点击保存写入
```

实现上做了硬隔离：主进程没有自动保存 human-review 的代码路径；保存时 merge 回人工侧已有字段并原子替换（临时文件 + rename）；重新加载 design-review.json 不会覆盖人工结果。六个 `EV-*` 断言在 `npm run selftest` 中持续守着这一点。

---

## 6. Implementation Gate

顶栏徽章实时判定（判定逻辑只有一份实现：`app/shared/semantics.js`，主进程与渲染进程共用）：

```text
pending / rejected / needs-revision / needs-evidence 的 Decision → 阻塞
类别为 architecture-blocking / implementation-blocking 且未由人工关闭的 Question → 阻塞
被判定不成立的 Gap → 阻塞
```

`deferred` / `research` 类别的问题不阻塞；把阻塞问题标成「延后」也**不算**关闭，必须「已解决」。Gate 只是顶栏一个徽章，不再占据首页。

---

## 7. 目录结构

```text
realize-project/
├── agent.md
├── 测试文档/18-context-consumption-semantic-model.md
├── schema/design-review.schema.json       # 契约（含 1 主图 + 1 辅助图限制）
├── fixtures/context-consumption.json      # 12 Decision / 6 Gap / 10 Open Question / 36 Evidence
├── app/
│   ├── main/main.js                       # 主进程：文件访问、校验、保存、自检
│   ├── main/preload.js                    # 最小 IPC API
│   ├── renderer/index.html                # 两个导航项 + 首屏导入
│   ├── renderer/app.js                    # 方案总览 + 决策清单
│   ├── renderer/styles.css
│   ├── renderer/vendor/mermaid.min.js     # 随包离线渲染
│   └── shared/
│       ├── semantics.js                   # 单一事实来源：Gate / reviewLevel / category / Evidence 级别
│       ├── schema-validator.js            # 极简 draft-07 校验器（无额外依赖）
│       ├── review-model.js                # 一致性检查
│       └── gate.js                        # 转发 semantics
├── ai/analysis-protocol.phase2.md         # Phase 2 协议草稿（未接入）
├── scripts/{validate-fixture,simulate-review}.js
└── docs/acceptance-phase1.md              # 验收记录与人工核对清单
```

---

## 8. 运行方式

```bash
npm install
npm start            # 启动；点「打开 fixture（context-consumption.json）」进入
npm run validate     # 校验 design-review fixture（Schema + 一致性）
npm run audit        # 覆盖审计：原文每节被引用 / 每条 Decision 能关联
npm run check-plan   # 闸门：overview-plan 是否合格（PASS / PASS WITH WARNINGS / FAIL）
npm run test:plan    # check-plan 的自动测试（17 个用例，无 GUI / 无 AI）
npm run source       # 从 Markdown 重新切分原文分段（供 Source 回查）
npm run simulate     # 无 GUI 跑通 fixture → human-review.json → Gate
npm run selftest     # 在真实 Electron 渲染进程内自检整条链路，然后退出
```

---

## 9. 已知限制

- **AI 未接入**：fixture 是按 `ai/analysis-protocol.phase2.md` 抽取的一版，不是模型输出；协议本身未经测量。
- **Evidence 只有 document-claim**：36 条证据全部指向 Markdown 章节，没有任何源码核对。
- **Fact 未验证**：`FACT-001` ~ `FACT-005` 来自被审文档的陈述，需要 Phase 3 用源码确认。
- **一句话摘要与 rationaleSummary 是人工判断**：`design.summary` 与每条 `rationaleSummary` 由分析者撰写，不是从原文机械抽取；如果读起来不像文档的原意，应改这两处而不是改 UI。
- **`以后再说` 复用 `needs-revision`**：没有新增状态类型，代价是 `human-review.json` 里语义略窄于 UI 文案。
- **只测过单文档 540 行样本**。
