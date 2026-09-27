# Feature 08 · 验收清单（reviewer 用）

> 判定基准：同目录 `README.md`（§0 范围冻结 · §1 输入边界 · §6 验收 · §7 Gate）。

---

## 1. 范围冻结（红线）

- [ ] 本轮**没有**调用任何模型
- [ ] `schema/framework-map.schema.json` **未被修改**
- [ ] `docs/specs/framework-map-contract.md` **未被修改**
- [ ] `scripts/check-map.js` **未被修改**
- [ ] F10 的 prompt / runner / 两阶段流程 **未被触碰**
- [ ] 预览 HTML 里**没有** AI 生成的标记结构（全部由 renderer 产出）

---

## 2. 输入边界（Phase 0）

- [ ] renderer 不推理、不补关系、不修 JSON
- [ ] `>12` 的 map 照常渲染（**没有**因 W1 删节点）—— 用 81 elements 样本核
- [ ] 没有主轴的 map 不造主轴（D）
- [ ] `relationGap` **没有**被转成 `edge`；`attachment` **没有**被转成 `edge`
- [ ] Topic 无 element 时仍是导航入口
- [ ] 输入文件 sha 在构建前后一致（view model 入口自检 + 磁盘核对）

---

## 3. View Model（Phase 1）

- [ ] `scripts/test-l0-view-model.js` 全绿（当前 **34/34**，覆盖 28 份 map）
- [ ] element / edge / attachment / topic / relationGap **计数与输入逐一相等**
- [ ] `label` / `provenance` / `type` / `role` / topic 命题**逐字节保留**
- [ ] 引用全部解析（无 `(未解析:`）
- [ ] 自环被表示为 `selfLoop`（不是被丢弃）
- [ ] 无 element 的 Topic 被 `facts.topicsWithoutElements` 列出

---

## 4. 预览（Phase 2）

- [ ] `scripts/test-l0-preview.js` 全绿（当前 **51/51**，6 份预览）
- [ ] 每份预览的元素/边/侧挂/Topic 渲染数与输入一致
- [ ] **方向显式**：每条边都有一行 `A —type→ B`（不靠位置）
- [ ] `qualifiers` 可见（`cardinality` / `ownership`）
- [ ] 自环显式标注「自环（同一个元素）」
- [ ] `relationGap` 明确标注「**不是 edge**」
- [ ] provenance（`§ref`）在页面上可达
- [ ] 原则声明在位：**Layout organizes space; it does not create semantics.**
- [ ] Reading / Review 分离是**隐藏**而非删除（CSS 规则存在）
- [ ] 预览是静态 HTML：无网络依赖、无 `require(`

---

## 5. 一屏两区（Phase 3 · 待做）

- [ ] Framework Map 与 Topic Navigation **职责分离**（前者核心机制、后者完整入口）
- [ ] 没有在 UI 层把 Framework / Navigation / Semantic coverage 重新绑成一个数字
- [ ] 深链 `#element-<id>` / `#edge-<id>` / `#topic-<id>` 可用，且与 `#block-<id>` 并存
- [ ] Breadcrumb 能回答"我在哪一层"
- [ ] 预览与 Electron **共用同一份 renderer 模块**（没有复制代码）

---

## 6. 交互（Phase 4 · 待做）

- [ ] 点击 Element → 详情含 **provenance**（第一版必须有）
- [ ] 点击 Edge → `A —relation→ B` + qualifiers + label + source refs
- [ ] 点击 Topic → 关联 elements / L2 blocks；无 element 时也能进入
- [ ] Review View 才显示：validator warnings · relationGap · unknown role · source diagnostics

---

## 7. Regression（Phase 5）

- [ ] A–E 五份 fixture 全部 no crash
- [ ] **renderer 导致的语义消失 = 0**（用第 3 节的计数断言证明）
- [ ] 极端样本通过：81 elements · 自环 · 无主轴 · 无 element Topic · sourceUnit 粒度（A）
- [x] Electron 集成 selftest 通过（真实入口 loadL0(path) / 真的切屏 / 线 == edge / 无 model 导航守卫）
- [x] **Phase 4.1**：Reading 关系图化（线数 == edge 数 / 每线有箭头与类型 / 节点不重叠 / 逐字节确定）
- [x] **Phase 4.1**：Reading 不含机器 ID / type / role；节点标题是切开的短名
- [x] **Phase 4.1**：约束降级为 `⚑ N` 角标（可展开，且元素不丢）；Topic 默认折叠
- [ ] 人工 Track A（D + E）已记录 → `results/track-a-round1.md`（Round 0 定性反馈已记）

---

## 8. Gate

- [ ] 结论是 `TECHNICAL PASS / UX VALIDATION PENDING` 或 `PASS` 二选一
- [ ] 若写 `PASS`：**必须附人手 Track A 的记录**（谁、什么时候、看懂了什么、卡在哪）
- [ ] 没有拿"截图看起来不错"当 UX PASS

---

## 判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | §1–§4 全过 + Phase 3/4 已完成 + §7 regression 全过；Gate = `TECHNICAL PASS / UX VALIDATION PENDING` |
| **ACCEPT（分轮）** | 第一轮只做 §1–§4 且全过（Gate = `TECHNICAL PASS / UX VALIDATION PENDING`）—— **当前状态** |
| **REJECT** | 命中任一红线；或 renderer 修改/丢弃了输入语义 |
