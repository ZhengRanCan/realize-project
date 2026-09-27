# Incident: 首次运行 harness gate 时所有 passing 判定失败

- ID: INC-2026-09-27-HARNESS-GATE-PARSER
- Date: 2026-09-27
- Source feature: F01 / F03 / F09（由 harness 接入本身引入，非 feature 缺陷）
- Trigger: 规范化后第一次运行 `npm run verify:harness`
- Symptom: F01、F03、F09 全部报 `passing feature needs acceptance criteria`，尽管三份合同里都有
  `## Acceptance Criteria` 小节且都写了复选框
- Impact: gate 无法识别任何合同的验收项，因此**没有任何 feature 能被判定为 `passing`**；
  门禁在这种情况下会长期是红的，最可能的结果是被绕过或忽略

## Reproduction or evidence

```text
$ npm run verify:harness
Harness gate: 3 features, 3 errors.
- F01: passing feature needs acceptance criteria.
- F03: passing feature needs acceptance criteria.
- F09: passing feature needs acceptance criteria.
```

模板自带的正则（`scripts/harness-gate.mjs` 的 `acceptance()`）：

```js
markdown.match(/^## Acceptance Criteria\s*$([\s\S]*?)(?=^## |\s*$)/m)
```

## Suspected root cause

lookahead 的第二个分支 `\s*$` 在 multiline 下**紧跟在标题行之后就能成立**：`\s*` 吞掉标题行的换行后，
`$` 立刻在下一行的行尾匹配。懒匹配 `([\s\S]*?)` 会停在第一个让 lookahead 成立的位置，于是捕获组恒为空串。

实测四种排版（标题后有空行 / 无空行 / 有后续 `##` 小节 / 直接到文件末尾），**捕获组长度全部为 0、条目数全部为 0**：

```text
A: heading + blank line + items     section=""  items=0
B: heading + items (no blank)       section=""  items=0
C: heading + blank + items then EOF section=""  items=0
D: heading + items then EOF         section=""  items=0
```

因此这不是"某种排版踩坑"，而是**任何**符合模板形状的合同都会被判为缺少验收项 ——
模板自己的 `feature-template.md` 也逃不掉。

## Immediate fix or workaround

把 `acceptance()` 改成按行扫描：定位 `## Acceptance Criteria` 标题行，取到下一个 `^## ` 之前，
再逐行匹配 `^[-*]\s+\[([ xX])\]\s+\S`。见 `scripts/harness-gate.mjs` 的注释与
`docs/decisions.md`（2026-09-27）。

## Lesson candidate

- Prevention: 解析器必须拿**模板自身的产物**跑一遍自测（模板 → 合同 → gate 闭环），
  不能只用"我构造的样例"验证；凡是给格式定规则的工具，都要有一条"用未修改的模板生成物做输入"的用例。
- Applies to: `scripts/harness-gate.mjs`、任何读 frontmatter / Markdown 小节的脚本。

## Follow-up target

- 已修复并实测：F01 / F03 / F08 / F09 的验收项可被正确读出（勾选数与合同一致）。
- 若上游 `harness-template` 修复该正则，应回并其实现，保持本仓库与模板差异最小。
