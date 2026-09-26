# Feature 06: Contract & Validators（Phase 3）

> ⏳ **等 Feature 05 的 Gate 通过后才开始。**
> Gate 未通过时不要动本 feature —— 那说明 03 的 §3~§6 需要先改。

## 这个 feature 要做什么

把 Feature 04 / 05 手工验证过的 `framework-map` 变成**可机器校验的契约**。

## 要产出的东西

```text
schema/framework-map.schema.json      L0 契约（03 §4）
scripts/check-map.js                  校验器
docs/shape-catalog.md                 新增第 12 个 shape：framework-map
topic-map 契约 + check-topic-map       Topic 质量判据（03 §10.3）的 Warning 层
```

### `check-map` 至少要检查

**Hard Error**

```text
- elements[].type 不在六类里
- elements[].role 不在受控取值里
- elements[].sourceUnitIds 为空（或 B/C 类的 provenance 为空）
- edges[].type 不在 8 词表内          ← 封闭性，03 §6.3
- edges[] 的端点不存在于 elements[]
- concept / constraint 出现在 edges[] 里（应走 attachments）
- edges[] 违反主动语序（如出现被动态词）
- 同一文档内同一概念出现两个节点（判据 F）
- topics[] 里有 topic 没有任何元素
- 元素的 topics 为空
```

**Warning**

```text
- 元素总数 > 12                        ← 判据 E
- relates-to 兜底词使用次数 > 1
- 某元素的 sourceUnitIds 数量异常偏多（可能是细节混入 L0）
- state 元素占比过高
- topic 数 > 10 或 = 1
- topic 标题与 source section 标题高度接近（possible section mirroring）
```

### `check-topic-map` 的 Warning 层

按 03 §10.3 的五判据：Coverage / Cohesion / Separation / Abstraction / Cognitive usefulness。
其中 Coverage 可自动判定（core blocks 是否都有 topic 归属）；其余第一版先出 Warning 供人工判断。

## 明确不做

- ❌ 不修改 Renderer（那是 Feature 08）
- ❌ 不写生成 prompt（那是 Feature 07）
- ❌ 不推翻现有 11 个 shape
- ❌ 如果 Gate = FAIL，本 feature 不启动

## 前置条件（开工检查）

- [ ] Feature 05 的 `Gate = PASS`
- [ ] 03 §3~§6 没有再被修改（若改过，04/05 的手工产物需重新对齐）

## 状态

- **创建时间**：2026-09-26
- **状态**：阻塞（等 Feature 05 的 Gate）
- **待补文档**：`execution-prompt.md` · `validation-checklist.md`
