# E×1 诊断结果（F10 · 只改 ①+②+④）

> 变量：**只改** ① Stage A 预算回 65536 · ② `quote` 默认不生成 · ④ Stage B 增加选择压力。
> ③ `reasoning_effort` **保持不变**（provider 默认 high）—— 保证对 ④ 的归因干净。
>
> 两次调用（`run-04` 的 Stage A + `run-05` 的 Stage B，**同一份 inventory**）：
> - `fixture-e/run-04`：Stage A 95 条（结构合法）；Stage B 在 `max_tokens_b=12288` 下**吐字为 0** → 见 §3
> - `fixture-e/run-05`：`--stage b` 复用 run-04 的 inventory，`max_tokens_b=65536` → **成功**

---

## 1. 先看结论：**Selection 压力生效**

| 指标 | F07 / E5 失败形态 | 本轮 E×1（run-05） | 判定 |
|---|---|---|---|
| Inventory 条数 | — | 95 | 本轮不作为成败条件 |
| represented 比例 | 154/154 = **100%** | 87/95 = **91.6%**（另有 topic-only 7 · omitted 1） | ⚠️ 仅小幅下降（见 §2 的说明） |
| **L0 elements** | **81**（D/run-01） | **13** | ✅ 落在 8–12 的合理邻域 |
| **每 target fan-in 的 1:1 比例** | 27/65 = **42%** | **6/19 = 32%**，且 7 个 target 承载 ≥6 条 | ✅ 明显汇聚 |
| bounded failure | 0/3 丢失 | ✅ `C-03 …（连续 10 次失败上限）` | ✅ 保留 |
| abnormal path | 0/3 丢失 | ✅ `E-03 F15 补偿与重试` + 边「失败重试与强制补偿验证」 | ✅ 保留 |
| manual intervention | 0/3 丢失 | ⚠️ `E-03` label 含 `forceRestock` + 边「失败重试与强制补偿验证」 | ⚠️ 部分（见 §2） |
| privilege boundary | 0/3 丢失 | ✅ `C-01（权限…）` + 边「用例 1/3 验证申请、撤销与**越权拒绝**」 | ✅ 保留 |
| invariant | 0/3 丢失 | ✅ `C-02 补偿口径不变量（幂等 / 资产回补 / 失败落库）` | ✅ 保留 |

```text
对照 F07 的 E：机制 anchor 0–1/3
本轮：       4/4 有文字承载（其中 1 条为部分）
```

---

## 2. 产物形态（`fixture-e/run-05`）

```text
map      13 elements · 12 edges · 5 attachments · 11 topics · relationGap 0
         validator PASS（HARD 0 · WARN 2 · INFO 8）
select   95 dispositions：represented 87 · topic-only 7 · omitted 1
         19 个不同 target（constraint 32 条 / element 53 条 / edge 2 条 / topic 7 条）
         fan-in：1 条:6 · 2–3 条:2 · 4–5 条:4 · **≥6 条:7**
         最高：C-02 ← 14 条 · E-10 ← 13 条 · C-01 ← 12 条 · E-07 ← 10 条
```

**13 个 element 的构成（是可解释的，不是搬运）：**

```text
E-01…E-04   F13 申请/撤销 → F14 审批 → F15 补偿与重试 → F16 退款域（四条 function 链）
E-05         售后单状态（state）
E-06…E-09    本地构建部署 / 沙箱验证与证据留存 / 沙箱→真实切换 / 环境配置与密钥
E-10         未发货仅退款的库存释放时机决策（concept）
C-01         边界与安全约束（权限 / 输入校验 / 密钥不外泄 / 与支付域隔离）
C-02         补偿口径不变量（幂等 / 资产回补 / 失败落库）
C-03         定时触发与查单阈值（10 分钟重试 / 5 分钟查单 / 80% 命中 / 连续 10 次失败上限）
```

**边也成立**：`F14 depends-on F13` → `F15 depends-on F14` → `F16 depends-on F15`（带 cardinality）；
`E-07 validates E-01..E-04`（沙箱四个用例）；`E-08 depends-on E-07`（真实切换仅在沙箱全 passing 后）；
`E-09 controls E-04`（环境变量决定沙箱/真实分支）。**约束都挂在被约束的对象上**（C-01→四条链路+部署+配置）。

**被降级/省略的 8 条也都是对的**：7 条 topic-only 全是 §8 速查表里的 symptom→cause 与修订记录，
1 条 omitted 是 §11 修订记录（`S-95`）—— 这些**本来就不属于结构语义**。

### 诚实的保留项（不得读过头）

```text
① represented 比例只从 100% 降到 91.6% —— 单看这个数字会误判。
   真正的信号是 **fan-in 与 element 数**：91.6% 的"represented"现在意味着
   "汇聚到 19 个共享结构上"，而不是"每条各自变成一个节点"。
   → E5 的判据应以后两者为主，represented 比例只能作辅证（本节即为此修正）。

② manual intervention 是**部分**达成：`forceRestock`（函数名）+ 边 label「强制补偿验证」，
   而"仅管理员可执行"这一**授权语义**目前被聚合进 C-01 的「权限」二字。
   → 需要在 Phase 3 人工核对 C-01 是否真的承载了"仅管理员"这条约束。

③ 压缩的代价：F07 的 E/run-01 曾把「正常 / 自动重试 / 人工强制」画成**三路分叉**；
   本轮把它们压进 E-03 一个元素的 label。这是**压缩与结构分辨率的取舍**，
   是否算 E3（表达失真）需要人工判定 —— 本轮不下结论。
```

---

## 3. ⚠️ 附带发现：**Stage B 的预算也不能压**（harness 参数错误，非模型问题）

```text
run-04 的 Stage B（max_tokens_b = 12288）
  finish_reason = length
  completion    = 12288
  **reasoning   = 12288**   ← 整份预算全被"思考"吃掉
  raw 长度      = 0          ← **一个字都没输出**
→ 报错"缺少 <<<FRAMEWORK_MAP>>> 分隔符"，但真实原因是**没有 content**。
```

对照 run-05（`max_tokens_b = 65536`）：completion 58211（reasoning 45706）→ 正常完成。

**结论：两个阶段的 `max_tokens` 都必须给足**（该模型的预算同时覆盖 reasoning 与 content，
而 reasoning 占 80–90%）。**"压预算让它更紧凑"这条路对所有阶段都不成立** ——
`stage-a-reliability.md` §2.1 的结论推广到 Stage B。

> 处置：`run-04` 永久保留为**预算配置失败样本**（Stage A 的证据 95 条仍然可用）；
> `run-05` 用同一份 inventory 只重跑 Stage B，**归因更干净**（同一输入，只有 Stage B 变了）。

---

## 4. 下一步（按用户既定计划）

```text
✅ 语义方向已被验证（Selection 压力有效；E 的机制 anchor 从 0–1/3 → 4/4 有承载）
→ 才值得：① E×2 补足稳定性（同 prompt / 同参数，看 13 elements 与 anchor 是否复现）
          ② D×1 regression check（确认没有把原来最好的 ER-heavy 场景搞坏）
→ 之后（且仅在这之后）才做 ③ 的成本实验：
   同一个 E、同一 prompt、唯一变量 reasoning_effort: high → low，
   看三件事：token 是否明显下降 / Stage A mechanism recall 是否下降 / Map fidelity 是否下降
```
