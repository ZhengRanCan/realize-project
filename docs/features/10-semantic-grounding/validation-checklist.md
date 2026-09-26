# Feature 10 · 验收清单（reviewer 用）

> 判定基准：同目录 `README.md`（§4 失败四类 · §5 两层审计分离 · §6 四层 coverage · §11 Gate）。

---

## 1. Phase 0 · Prompt Parity Audit

- [ ] `results/prompt-parity-audit.md` 逐条对照了 Contract 里**所有影响生成决策**的规则
- [ ] 每个"缺口"都有 F07 的产物证据（不是推测）
- [ ] 补丁**只给通用判别规则**，**没有**写进任何 fixture 的具体答案（例如没有出现 `Receipt = concept`）
- [ ] 审计区分了"真缺口"与"部分暴露 / 非必需"（没有把不相关的规则也算缺口）
- [ ] 登记但**未处理**的项（role 用途 / coverage 三层分离 / Topic≈小节激励冲突）明确写了理由

---

## 2. Phase 1 · prompt / schema / 运行器

- [ ] Stage A prompt **不含** budget / 拓扑 / element type / relation 词任何要求
- [ ] Stage A prompt 有"机制优先"的搜索清单（条件/阈值/权限/失败/顺序/不变量/默认/非目标/状态迁移）
- [ ] Stage B prompt 明确要求**两个**产物 + 分隔符 + selection 覆盖每一条
- [ ] Stage B prompt 含 parity 五段补丁（类型判别 / gap 分流 / edge.label 边界 / attachment 方向 / 取舍判据）
- [ ] Stage B prompt 的 G8（不把语义藏进自由位）存在
- [ ] 两份 generation schema 明确标注**不属于 framework-map 契约**
- [ ] 运行器沿用 F07 四条纪律（独立目录 / 原子写入 / 失败不覆盖 / 绝不 repair）
- [ ] `scripts/test-semantic-grounding.js` 全绿（**零模型调用**）

---

## 3. Phase 2 · 实验有效性

- [ ] D × 3 + E × 3 = 6 个新臂 run，每个 run 目录里两阶段产物齐全
- [ ] 参数 / provider / model 与旧臂一致（逐项比对 `run-meta.json`）
- [ ] prompt 指纹在 6 个 run 内一致（有变化 → 必须标出分界）
- [ ] 失败产物未被删除、未被"重跑到好看"替换
- [ ] 没有读取人工 candidate map / 其它 run 的痕迹（Stage B 的输入只有原文 + heading tree + inventory）
- [ ] **混杂已登记**：新臂同时改了"两步"与"prompt parity"

---

## 4. Phase 3 · 四类失败归因（**本 Feature 的核心产出**）

- [ ] 每个丢失的 anchor 都能落到 `Extraction Miss / Selection Miss / Encoding Distortion / Escape-hatch Misuse` 之一
- [ ] 判定链写清楚了：`Inventory 有？→ Map 有？→ 是否在 label/gap 里？`
- [ ] `map-selection.json` 逐条核过：**声称 covered 但图上没有**的条目被单独列出（这是最易 gaming 的一步）
- [ ] `omitted` 的条目里，**没有**属于"不可以砍"五类（失败路径/权限边界/阈值上限/不变量/非目标）的
- [ ] Inventory 反向检查过：**没有**抄写式穷举 / 不可判断真假的 statement / 同义重复拆条
- [ ] E 的 4 个机制 anchor 给出了**新旧同表对比**
- [ ] D 的 7 个 anchor 给出了**新旧同表对比**（确认没有退化）

---

## 5. 边界纪律（红线）

- [ ] **没有**改 `schema/framework-map.schema.json` / `check-map.js` / Contract
- [ ] **没有**改 preferred budget 12
- [ ] **没有**把 selection trace 塞进 framework-map 契约
- [ ] **没有**让 check-map 去理解 `edge.label` / `relationGap` 的语义
- [ ] **没有**把 Fixture A 的具体答案写进 prompt
- [ ] **没有**在 D/E 验证成功之前扩到 A/B/C

---

## 6. 四层 coverage 是否分开报告

- [ ] Structural Validity（check-map HARD = 0）
- [ ] Framework Coverage（机制有没有进图 —— 人工判读，无自动数字）
- [ ] Navigation Reachability（N1~N3 / `coverage X/X`，并注明其构造性满足的条件）
- [ ] Semantic Faithfulness（Semantic Audit）
- [ ] **没有**把四层合成一个百分比；**没有**用 Navigation 代理 Semantic

---

## 7. Gate 判定

- [ ] 结论是 **PASS / PARTIAL PASS / FAIL / BLOCKED** 四选一
- [ ] `BLOCKED` 只用于 Gateway / IO 原因
- [ ] 回答了 Phase 4 的四个问题
- [ ] 给出了"是否扩到 A/B/C"的明确结论 + 依据（先写死的条件是否满足）

---

## 判定

| 判定 | 条件 |
|---|---|
| **ACCEPT** | §5 红线全过；Gate = PASS；四类失败可逐条归因；扩/不扩的结论有依据 |
| **ACCEPT WITH NOTES** | Gate = PARTIAL PASS，但已定位到"哪一步丢的"且知道下一步修什么 |
| **REJECT** | 命中任一红线；或四类失败**无法归因**（说明中间表示没起作用）；或产物被覆盖/修补 |
