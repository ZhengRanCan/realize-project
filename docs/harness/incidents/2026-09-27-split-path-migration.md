# Incident: 规范化移动文件后，F10 离线安全测试从 48/48 变成崩溃

- ID: INC-2026-09-27-SPLIT-PATH-MIGRATION
- Date: 2026-09-27
- Source feature: harness-adoption（由本次 `docs/` 规范化引入，不是 F10 的缺陷）
- Trigger: 把规范化前的 `docs/framework-map-contract.md` 等文件移入 `docs/specs/` 之后，运行 F10 的离线安全测试
- Symptom: `node scripts/test-semantic-grounding.js` 由 `48/48 通过` 变为直接崩溃：

  ```text
  Error: ENOENT: no such file or directory, open
    '...\tmp\f10-selftest\fixture-e\run-01\framework-map.json'
  ```

- Impact: F10 的产物安全验证整条不可运行；更糟的是**看起来很像是 F10 自身坏了**，
  而真实原因是规范化的路径遗漏

## Reproduction or evidence

```text
$ node scripts/test-semantic-grounding.js          # 迁移后
Error: ENOENT ... tmp/f10-selftest/fixture-e/run-01/framework-map.json
$ git worktree add tmp/head-check HEAD && (cd tmp/head-check && node scripts/test-semantic-grounding.js)
F10 两阶段安全验证: 48/48 通过                       # HEAD 对照：迁移前是通过的
```

用 HEAD 的 worktree 做对照，把"本次引入"与"环境本来就坏"区分开。

## Suspected root cause

`scripts/run-semantic-grounding.js` 通过**字符串拼接**引用契约文件：

```js
contract: artifactRef(path.join(ROOT, 'docs', 'framework-map-contract.md')),
```

规范化用「整串替换规范化前的 `docs/framework-map-contract.md`」的方式更新引用，因此**扫不到**这种把目录与文件名
拆成两个参数的形式。`artifactRef` 读不到文件 → runner 抛错退出 → 沙箱里没有任何产物 → 测试在读取
`framework-map.json` 时崩溃。

同类漏改共 4 处（另外 3 处是规范化前的 `docs/shape-catalog.md` 被拼成 `path.join('docs', 'shape-catalog.md')`，
分别出现在 `scripts/ai-plan.js`、`scripts/ai-block.js`、`scripts/compare-plan.js`）。

## Immediate fix or workaround

- 4 处拼接路径全部改为 `docs/specs/...`。
- 复跑 `node scripts/test-semantic-grounding.js` → `48/48 通过`；其余离线测试一并复跑，见 `docs/progress.md`。
- 保留 `docs/source-sections.json` 的路径不动（它被 11 个读写方按当前形式硬编码，且本次没有移动）。

## Lesson candidate

- Prevention: **移动文件后的收口证据必须是"跑测试"，不是"grep 旧字符串"。** 批量替换只能覆盖字面量；
  必须同时对 `path.join('docs', '<file>')` 这类拼接形式做一次专门扫描，并跑一遍全量离线测试。
  判断"是不是本次引入"时，用 `git worktree` 拉一份迁移前的树做对照，比回滚工作区安全。
- Applies to: 任何涉及文件移动/重命名的重构，尤其是脚本用 `path.join` 拼接的仓库。

## Follow-up target

- 已修复并复跑验证。
- 若还有第三方工具或未入库脚本按旧路径读取 `docs/`，需要它们各自更新；本仓库内的引用已清零。
