# 测试文档

本目录存放 Feature 03（Hierarchical Document Model）泛化验证所用的输入文档。

**所有文档均为逐字节复制的原文，未做任何修改。** 下表 SHA256 可用于校验未被改动。

## 三类 Fixture

| Fixture | 类型 | 文件 | 用途 |
|---|---|---|---|
| **A** | Semantic / Architecture heavy | `18-context-consumption-semantic-model.md` | 样例；Track A（交互假设）与历史 Stage 1/2 运行都用它 |
| **B** | **Data Model heavy** | `fixture-b-canonical-hash-digest-and-integrity-specification.md` | Track B（生成模型假设）：数据结构规范能否画出框架图 |
| **C** | **Process / Operational heavy** | `fixture-c-candidate-inbox-driven-profile-pipeline.md` | Track B：流程/队列/状态机型文档的 L0 拓扑是否不同 |

## 来源与校验

| Fixture | 原始路径 | 大小 | 行数 | SHA256 |
|---|---|---|---|---|
| A | `classroom/docs/harness/draft/18-context-consumption-semantic-model.md` | 21.8 KB | 381 | `338BB2D632F800B53B20B1FCAA10EC235FDF7154107ACB7925F87DA27CB11C6A` |
| B | `classroom/docs/harness/FUSION/10-canonical-hash-digest-and-integrity-specification.md` | 19.8 KB | 343 | `08D52471285F7CD95CD8DEC296A30F9AC0D3F7D54C102BED7328A7C9F8F2E89A` |
| C | `classroom/docs/harness/FUSION/09-candidate-inbox-driven-profile-pipeline.md` | 21.2 KB | 383 | `F66DBD412BB90BD73DD9CFD9FFAD18B2495BB9B141C2F5B0DC70CF79542AFCAA` |

## 为什么选这三篇（方法学理由）

1. **规模接近**（343 / 381 / 383 行）—— 排除"文档越长越难画"这个混淆变量，使比较聚焦在**文档类型**上。
2. **同一仓库、同一写法**（`classroom/docs/harness/`）—— 排除领域与文风的混淆变量。
3. **主题互不重叠** —— 排除"同一议题换个抽象层级"造成的假泛化。

> 特别地，**没有**选用 `draft/17-output-alignment-conceptual-json.md`：它在类型上确实是数据型（872 行），但它与 Fixture A 是同一议题的不同抽象层级，用它测出的"泛化"不可信。

## 关键词特征（用于确认类型差异）

统计口径：按 Feature 03 §11.2 的过程类 / 数据类词汇计数。

| Fixture | 过程类命中 | 数据类命中 |
|---|---|---|
| A（概念型，基线） | 3 | 5 |
| B（数据型） | 13 | **80** |
| C（流程型） | **77** | 20 |

## 备注

- 这些文档属于 `classroom` 仓库，本目录只是**验证用副本**。原文若有更新，需重新复制并更新上表哈希。
- Fixture A 同时是 `18-` 系列（FUSION/11 第七项产品语义讨论）的成员，其兄弟文档（`draft/11` ~ `draft/17`）可作后续扩展素材。
- 另有一个**待定探针**：`deepseek-harness-master/.agents/notes/implemented/architecture/*.md` 是「决策记录」格式（Problem / Decision / Alternatives / Consequences），可能**根本没有机制可画**。它适合做 Phase 2b 的第三类探针，而不是 Fixture C。
