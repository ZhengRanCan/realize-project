# 第一轮验收记录（Phase 1 · 收缩版 MVP）

样本：`测试文档/18-context-consumption-semantic-model.md`（540 行）
结构化结果：`fixtures/context-consumption.json`
验收日期：第一轮试验（收缩版：方案总览 + 决策清单）

---

## 0. 本轮收缩要求与实现

| 要求 | 实现 | 自检断言 |
|---|---|---|
| 只保留两个一级页面 | 侧栏只有「方案总览」「决策清单」 | `一级导航只有两个页面：方案总览 / 决策清单` |
| Current/Target、Open Questions、Evidence 不再作为一级导航 | 已从导航移除，改为 Decision 的「查看详情」附属区块 | `"查看详情"展开 7 个附属区块` |
| Overview 不堆统计卡片 | 首屏 0 个 `.stat-card` / 0 个 Dashboard 卡片 | `首屏没有统计卡片 / Dashboard 卡片 / 阻塞面板` |
| Overview 不先展示 blocking | 首页只出现一句话带过的未决问题总数 | `首页没有直接展示 blocking 项目列表` |
| Overview 内容 = 摘要 + 主图 + 辅助图 + 决策摘要 | 四部分齐备，决策摘要形如「需要你决定 12 件事，其中 4 件是核心判断」 | `Overview 展示一句话摘要` / `Overview 只有 1 张主图 + 1 张辅助图` / `Overview 决策摘要: …` |
| 每份文档 1 主图 + 最多 1 辅助图 | `models[].role` + schema `maxItems: 2` + 一致性检查 | `Overview 只有 1 张主图 + 1 张辅助图（主图 / 辅助图）` |
| Decision 默认只展示 标题/问题/AI 建议/一句话原因/三个动作 | 默认 3 个字段 + 3 个按钮 + 1 个「查看详情」 | `Decision 默认只展示 3 个字段` / `默认展示三个审核动作：同意 / 不同意 / 以后再说` |
| Alternatives / Full rationale / Consequences / Current-Target / Evidence 默认折叠 | 默认 0 个 disclosure 渲染 | `…默认全部折叠（0 个 disclosure 渲染）` |
| Open Questions 不单独放大 | 只挂在 Decision 详情里，10 个全部有归属 | `全部 10 个 Open Question 都挂在某条 Decision 的详情里` |

---

## 1. 自动化验证结果

### `npm run validate`

```text
=== fixtures\context-consumption.json ===
✓ Schema 校验通过
✓ 一致性检查通过
  统计: decisions=12 (pending=12) gaps=6 openQuestions=10 (blocking=6) facts=6 models=2

结果：PASSED
```

### `npm run simulate`（无 GUI 闭环）

```text
=== Step 1: fixture 进入 UI 的前置校验 ===
✓ Schema 校验
✓ 一致性检查
✓ AI 侧 Decision 全部为 pending

=== Step 2: 初始 Gate（尚未人工审核）===
✓ Gate 应当是 BLOCKED — 18 项阻塞
✓ deferred / research 类别不计入阻塞 — 阻塞问题 6 条
✓ 非阻塞 Question 不出现在 Gate 中 — 4 条：Q-001, Q-004, Q-007, Q-010

=== Step 3: 模拟人工审核 ===
✓ still blocked（存在 needs-revision / needs-evidence）
✓ 把阻塞问题标为 Deferred 也不会放行（必须 Resolved）

=== Step 4: 全部批准后 Gate 应放行 ===
✓ Gate READY FOR IMPLEMENTATION

=== Step 5: 文件分离检查 ===
✓ design-review.json 中不包含人工审批状态
✓ design-review.json 中没有任何 source-verified 证据

结果：PASSED
```

### `npm run selftest`（真实 Electron 渲染进程内自检）

46 项断言全部通过：

```text
✓ fixture 加载: decisions=12 gaps=6 openQuestions=10
✓ reviewLevel 分布: root=4 supporting=7 derived=1
✓ Question 类别: blocking=6（architecture/implementation）, 非阻塞=4（deferred/research）
✓ 初始 Gate=BLOCKED (18 项，其中 blocking question 6 项)
✓ preload API 已在渲染进程暴露
✓ 页面五个核心区域容器存在
✓ 渲染进程可通过 IPC 加载 fixture
✓ 一级导航只有两个页面：方案总览 / 决策清单 待决定 12/12
✓ 首屏没有统计卡片 / Dashboard 卡片 / 阻塞面板
✓ Overview 展示一句话摘要
✓ Overview 只有 1 张主图 + 1 张辅助图（主图 / 辅助图）
✓ Overview 决策摘要: 这个方案需要你决定 12 件事，其中 4 件是核心判断（高优先级）。
✓ Overview 只用一句话带过 Open Questions 总数，未放大
✓ 首页没有直接展示 blocking 项目列表
✓ 主图/辅助图已渲染 (2)
✓ Mermaid 已真正渲染为 SVG（离线，未回退为 source）
✓ 背景为白色 (body rgb(255,255,255), main rgb(255,255,255))
✓ 正文文字为深色 (亮度 21/255)
✓ Mermaid 渲染失败时降级显示 source，页面保持可用
✓ 决策清单在一个页面里展示全部 12 条决策
✓ 按 reviewLevel 分组且每条只出现一次（核心判断（高优先级） 4 / 支撑性判断 7 / 推导性判断 1）
✓ 侧栏计数为「待决定 12/12」
✓ Decision 默认只展示 3 个字段：问题 / AI 建议 / 为什么这样建议
✓ 默认展示三个审核动作：同意 / 不同意 / 以后再说
✓ 三个动作映射到 approved / rejected / needs-revision（不新增状态）
✓ Alternatives / Rationale / Consequences / Current-Target / Evidence 默认全部折叠（0 个 disclosure 渲染）
✓ "查看详情"展开 7 个附属区块：Alternatives / Full Rationale / Consequences / Current / Target / Evidence / Open Questions / Dependencies / Related
✓ Decision 的 Evidence 全标为 document-claim（1 条），无 source-verified
✓ Current / Target 作为附属信息渲染（1 个 Gap，每个含"现在/目标"两栏）
✓ Overview 没有把 Open Questions 单独放大
✓ 全部 10 个 Open Question 都挂在某条 Decision 的详情里
✓ 点击"不同意"后状态变为 已否决，并出现备注输入框
✓ Overview 决策摘要随表态更新（…需要你决定 11 件事，其中 3 件是核心判断…）
✓ humanReview:save 写入成功（reviewVersion=2, 剩余阻塞=17）
✓ human-review.json 覆盖全部 12 条 Decision（未做部分覆盖式丢失）
✓ 多条 Decision / Gap 的审核状态都被正确持久化
✓ human-review.json 与 design-review.json 分离读写正常
✓ needs-evidence 会让 Gate 继续 BLOCKED
✓ design-review.json 未被人工审核状态污染（仍全部 pending）
✓ 未在项目根目录偷偷生成 human-review.json（仍只由人工点击保存时创建）
SELFTEST PASSED
```

---

## 2. agent.md 第二十一节 Phase 1 验收标准对照

| 验收项 | 结果 | 依据 |
|---|---|---|
| 看清有多少 Decision | ✅ | 决策清单首行「待决定 12 / 12」+ 三个分组标题带条数 |
| 点击查看一个 Decision | ✅ | 每条决策默认就展示标题/问题/AI 建议/一句话原因；「查看详情」展开其余 |
| Approve / Reject / Revise | ✅ | 同意 / 不同意 / 以后再说（映射 approved / rejected / needs-revision，不新增状态），快捷键 A / R / L |
| 查看 Current / Target Gap | ✅ | 作为决策附属信息，每个 Gap 左右两栏「现在 / 目标」 |
| 查看 Open Question | ✅ | 作为决策附属信息，可当场「已解决 / 延后 / 仍待决定」 |
| 保存人工结果 | ✅ | 「保存 human-review.json」写入独立文件，原子替换，reviewVersion 递增 |

---

## 3. 人工验收清单（自动化无法替代）

本轮验收标准是：**打开应用后先快速理解三件事** —— 这个方案整体在说什么、主要结构或流程是什么、接下来要决定哪几件事。请按这个顺序看（`npm start` → 点「打开 fixture」）：

**A. 方案总览页**

1. 第一眼是否看到一句话摘要，并且**读完这一句就知道方案在讲什么**？如果读完还是不知道，说明 `design.summary` 没写好（改 JSON，不要改 UI）。
2. 主图（MODEL-001：Context-side chain 三级递进）是否让你看懂主要结构？它是"整体方案/流程"还是只是概念点缀？
3. 辅助图（MODEL-002：两条链的关系）是否必要？如果删掉它信息是否仍然完整？
4. 决策摘要「需要你决定 12 件事，其中 4 件是核心判断（高优先级）」是否自然引出下一步？有没有出现统计墙、计数器或阻塞项列表？
5. 首屏整体感觉是"读方案"还是"看项目管理面板"？

**B. 决策清单页**

6. 每条决策默认展示的问题 / AI 建议 / 一句话原因，是否足以让你直接按下三个按钮中的一个？如果必须点「查看详情」才能判断，说明默认信息还不对。
7. 「为什么这样建议」这一句话，是不是真的解释了取舍理由（而不是重复 AI 建议）？
8. 三个动作「同意 / 不同意 / 以后再说」是否覆盖了你的真实反应？有没有出现"想选但没得选"的情况？
9. 点「查看详情」后，七个折叠区块是否都在需要时才展开？有没有哪一项其实应该留在默认视图里？
10. 「以后再说」当前写入的是 `needs-revision` —— 语义上你能接受吗？（这是为不新增状态类型做的取舍）

**C. 抽取质量（对照 Markdown）**

11. 有没有**该被批准但没进决策清单**的关键判断（漏抽）？
12. 有没有把文档明确「未决定」的事项写成结论（越权补全）？10 个 Open Question 是否有遗漏？
13. `reviewLevel` 分组是否同意？尤其 DEC-008 被判为「推导」（因为它由 DEC-007 推出）——如果你认为它可独立否决，应升为 root。
14. 每条 `rationaleSummary` 与文档原意是否一致？

**D. 实操**

15. 用三个动作各点一次、写备注、保存，确认 `human-review.json` 内容符合预期；重启应用后状态被正确加载。

---

## 4. 本轮明确未验证的部分

- **AI 能否稳定产出这个结构**：fixture 是按 `ai/analysis-protocol.phase2.md` 抽取的，不是模型跑出来的；协议新增的 `design.summary` / `rationaleSummary` / `role` 约束尚未被真实模型验证过。
- **Fact 的真实性**：`FACT-001` ~ `FACT-005` 全部来自被审文档的陈述（`document-claim`），未读源码核对。
- **图形的表达力**：只验证了 Mermaid 能渲染成功（含失败降级），没有验证"主图是否真的让人看懂方案"。
- **`reviewLevel` 与 `rationaleSummary` 的客观性**：都是分析者的判断，需要人工在步骤 C 复核。
- **多文档 / 长文档**：只测了 540 行的单文档样本。
