#!/usr/bin/env node
'use strict';

/**
 * check-plan 的自动测试。
 *
 * 无 GUI、无 AI API、无网络：只读 fixtures + schema + docs，跑 scripts/check-plan.js。
 * 测试方式：以 Gold Fixture 为基线，做定向变异（mutation），断言 check-plan 的判定结果。
 *
 * 用法：node scripts/test-check-plan.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const GOLD = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const CHECK = path.join(ROOT, 'scripts', 'check-plan.js');

const goldRaw = fs.readFileSync(GOLD, 'utf8');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-plan-test-'));

let passed = 0;
const failures = [];

/** 把用例名变成安全的文件名（中文名里可能含引号、箭头、斜杠）。 */
function safeFileName(name) {
  return `case-${name.replace(/[^\w\u4e00-\u9fa5-]/g, '_').slice(0, 40)}`;
}

/** 跑 check-plan，返回 { code, stdout }。 */
function runCheck(planObject, name) {
  const file = path.join(tmpDir, `${safeFileName(name)}.json`);
  fs.writeFileSync(file, `${JSON.stringify(planObject, null, 2)}\n`, 'utf8');
  try {
    const stdout = execFileSync(process.execPath, [CHECK, file], { encoding: 'utf8' });
    return { code: 0, stdout };
  } catch (error) {
    return { code: error.status === undefined ? 1 : error.status, stdout: `${error.stdout || ''}${error.stderr || ''}` };
  }
}

function expect(name, planObject, { code, mustInclude, mustNotInclude }) {
  const result = runCheck(planObject, name);
  const problems = [];
  if (result.code !== code) problems.push(`退出码 ${result.code}，期望 ${code}`);
  (mustInclude || []).forEach((fragment) => {
    if (!result.stdout.includes(fragment)) problems.push(`输出里没有出现「${fragment}」`);
  });
  (mustNotInclude || []).forEach((fragment) => {
    if (result.stdout.includes(fragment)) problems.push(`输出里不应该出现「${fragment}」`);
  });
  if (problems.length === 0) {
    passed += 1;
    console.log(`✓ ${name}`);
  } else {
    failures.push({ name, problems, stdout: result.stdout });
    console.log(`✗ ${name}`);
    problems.forEach((p) => console.log(`    - ${p}`));
  }
}

/** 深拷贝 gold plan 并做定向修改。 */
function mutate(fn) {
  const plan = JSON.parse(goldRaw);
  fn(plan);
  return plan;
}

const findBlock = (plan, id) => plan.blocks.find((b) => b.id === id);
const findUnit = (plan, id) => plan.sourceUnits.find((u) => u.id === id);

console.log('=== check-plan 自动测试 ===\n');

/* ---------------------------------------------------------------- *
 * 1. Gold fixture → PASS（允许 warning）
 * ---------------------------------------------------------------- */

expect('Gold fixture 通过（PASS WITH WARNINGS）', JSON.parse(goldRaw), {
  code: 0,
  mustInclude: ['结果：PASS'],
  mustNotInclude: ['HARD ERRORS'],
});

/* ---------------------------------------------------------------- *
 * 2. 删除一个 core sourceUnit 的 coverage → FAIL
 *    手法：保留该单元在 sourceUnits 里（规划阶段登记了它），但从所有 block 的 covers 中移除
 * ---------------------------------------------------------------- */

expect(
  'core sourceUnit 失去 coverage → FAIL',
  mutate((plan) => {
    // SU-018 是 Availability 的判定条件（core），原文明确列出，绝不能丢
    const target = 'SU-018';
    if (!findUnit(plan, target)) throw new Error(`${target} 不在 gold fixture 里`);
    plan.blocks.forEach((b) => {
      b.covers = b.covers.filter((id) => id !== target);
    });
  }),
  {
    code: 1,
    mustInclude: ['HARD ERRORS', 'core sourceUnit 没有被任何 block 覆盖', 'SU-018'],
  }
);

/* ---------------------------------------------------------------- *
 * 3. 使用未知 shape → FAIL
 * ---------------------------------------------------------------- */

expect(
  '使用未知 shape → FAIL',
  mutate((plan) => {
    findBlock(plan, 'O-02').shape = 'timeline'; // 不在 catalog 里
  }),
  {
    code: 1,
    mustInclude: ['未知 shape'],
  }
);

/* ---------------------------------------------------------------- *
 * 4. covers 引用不存在的 sourceUnit → FAIL
 * ---------------------------------------------------------------- */

expect(
  'covers 引用不存在的 sourceUnit → FAIL',
  mutate((plan) => {
    findBlock(plan, 'O-02').covers.push('SU-999');
  }),
  {
    code: 1,
    mustInclude: ['引用了不存在的 sourceUnit'],
  }
);

/* ---------------------------------------------------------------- *
 * 5. phase 2 出现 source-verified → FAIL
 * ---------------------------------------------------------------- */

expect(
  'plan 中出现 source-verified → FAIL',
  mutate((plan) => {
    findUnit(plan, 'SU-044').sourceVerified = true;
  }),
  {
    code: 1,
    mustInclude: ['source-verified'],
  }
);

/* ---------------------------------------------------------------- *
 * 6. 把"本文不决定"改成确定设计 → FAIL
 *    手法：让承载 open-question 的块不再关联对应 Open Question
 * ---------------------------------------------------------------- */

expect(
  '把"本文不决定"改成确定设计 → FAIL',
  mutate((plan) => {
    const block = findBlock(plan, 'O-15');
    // 原本关联 Q-001 / Q-003 / Q-006 / Q-007，全部摘掉后，"未决"就变成了"已定"
    block.reviewObjects = block.reviewObjects.filter((id) => !id.startsWith('Q-'));
  }),
  {
    code: 1,
    mustInclude: ['承载了"未决定"语义', 'Open Question'],
  }
);

/* ---------------------------------------------------------------- *
 * 7. supporting unit 未覆盖 → WARNING（不是 error）
 * ---------------------------------------------------------------- */

expect(
  'supporting sourceUnit 未被覆盖 → WARNING',
  mutate((plan) => {
    // SU-016 是 supporting，且没有登记在 duplicatesMerged 里（合并登记过的单元不算丢失）
    const target = 'SU-016';
    const unit = findUnit(plan, target);
    if (!unit || unit.importance !== 'supporting') throw new Error(`${target} 不是 supporting 单元`);
    const merged = new Set(plan.duplicatesMerged.flatMap((m) => m.sourceUnits));
    if (merged.has(target)) throw new Error(`${target} 已登记在 duplicatesMerged 里，不适合做这个用例`);
    plan.blocks.forEach((b) => {
      b.covers = b.covers.filter((id) => id !== target);
    });
  }),
  {
    code: 0,
    mustInclude: ['WARNINGS', 'supporting sourceUnit 没有被覆盖'],
  }
);

/* ---------------------------------------------------------------- *
 * 8. block 过重 → WARNING
 * ---------------------------------------------------------------- */

expect(
  'block 覆盖过多 sourceUnit → WARNING',
  mutate((plan) => {
    // 把大量 core 单元塞进一个块，触发 covers 过重与 kind 混杂
    const block = findBlock(plan, 'O-02');
    const extra = plan.sourceUnits
      .filter((u) => !block.covers.includes(u.id))
      .slice(0, 12)
      .map((u) => u.id);
    block.covers = block.covers.concat(extra);
  }),
  {
    code: 0,
    mustInclude: ['可能过重'],
  }
);

/* ---------------------------------------------------------------- *
 * 9. 高重复 coverage → WARNING
 * ---------------------------------------------------------------- */

expect(
  '两个 block 高度覆盖相同 sourceUnits → WARNING',
  mutate((plan) => {
    // 把 O-11b 的 coverage 并进 O-11：制造 100% 重叠，同时不让任何 core unit 失去覆盖
    const a = findBlock(plan, 'O-11');
    const b = findBlock(plan, 'O-11b');
    a.covers = [...new Set([...a.covers, ...b.covers])];
  }),
  {
    code: 0,
    mustInclude: ['coverage 重叠'],
  }
);

/* ---------------------------------------------------------------- *
 * 8b. 把 Target Design 当成 Current Reality → FAIL
 *     手法：块覆盖 target-state 语义，却把该章节标成 current-state 且完全没有 target 侧来源。
 *     与 run-2 的实际失败模式一致。
 * ---------------------------------------------------------------- */

expect(
  '把 Target Design 标成 Current Reality → FAIL',
  mutate((plan) => {
    const unit = findUnit(plan, 'SU-046');
    if (unit.kind !== 'target-state') throw new Error('SU-046 应当是 target-state');
    const block = plan.blocks.find((b) => b.covers.includes('SU-046'));
    // 只留 current-state ref，去掉全部 target 侧来源
    block.sourceRefs = [{ section: unit.section, role: 'current-state' }];
  }),
  {
    code: 1,
    mustInclude: ['Target Design 写成 Current Reality'],
  }
);

/* ---------------------------------------------------------------- *
 * 8b-2. 一个块同时承载现状与目标但没标清目标侧 → WARNING
 * ---------------------------------------------------------------- */

expect(
  '同时承载现状与目标却未标注目标侧 → WARNING',
  mutate((plan) => {
    const unit = findUnit(plan, 'SU-046');
    const block = plan.blocks.find((b) => b.covers.includes('SU-046'));
    block.shape = 'current-target-flow';
    block.sourceRefs = [
      { section: unit.section, role: 'current-state' },
      { section: unit.section, role: 'target-state' },
    ];
  }),
  {
    code: 0,
    mustInclude: ['[边界]', '不会混'],
  }
);

/* ---------------------------------------------------------------- *
 * 8c. 把「不承诺」写成系统保证 → FAIL
 * ---------------------------------------------------------------- */

expect(
  '把「不承诺」写成系统保证 → FAIL',
  mutate((plan) => {
    const block = findBlock(plan, 'O-15'); // 覆盖 SU-083（non-claim）
    block.title = '本文保证：DeepTutor 的语义正确，Output Alignment 可单独证明';
  }),
  {
    code: 1,
    mustInclude: ['转换成了系统保证'],
  }
);

/* ---------------------------------------------------------------- *
 * 8d. plan 里出现人工审批状态 → FAIL
 * ---------------------------------------------------------------- */

expect(
  'plan 中写人工审批状态 → FAIL',
  mutate((plan) => {
    findBlock(plan, 'O-02').status = 'approved';
  }),
  {
    code: 1,
    mustInclude: ['[schema]'],
  }
);



/* ---------------------------------------------------------------- *
 * 8e. Shape vocabulary misuse —— kind 写成视觉形状名（本轮修正的核心）
 *     三次真实模型运行的唯一稳定失败：kind = "capability-matrix" / "combo"
 * ---------------------------------------------------------------- */

// Test 1：kind 写成 shape 名 → FAIL
expect(
  'Test 1｜kind 写成 "capability-matrix" → FAIL',
  mutate((plan) => {
    const unit = findUnit(plan, 'SU-013'); // Gold 里是 §3 的 boundary 语义
    if (!unit) throw new Error('SU-013 不在 gold fixture 里');
    unit.kind = 'capability-matrix';
  }),
  {
    code: 1,
    mustInclude: ['Semantic kind cannot use visual shape vocabulary', 'capability-matrix', 'block.shape'],
  }
);

// Test 2：kind 是语义类别、shape 用同一个视觉形状 → PASS
expect(
  'Test 2｜kind="boundary" + shape="capability-matrix" → PASS',
  mutate((plan) => {
    const unit = findUnit(plan, 'SU-013');
    unit.kind = 'boundary';
    const block = findBlock(plan, 'O-07');
    block.shape = 'capability-matrix';
    block.covers = [...new Set([...block.covers, 'SU-013'])];
  }),
  {
    code: 0,
    mustNotInclude: ['Semantic kind cannot use visual shape vocabulary'],
  }
);

// Test 3：kind 写成 "combo" → FAIL
expect(
  'Test 3｜kind 写成 "combo" → FAIL',
  mutate((plan) => {
    const unit = findUnit(plan, 'SU-037'); // Gold 里是 §7 的状态组合（example）
    if (!unit) throw new Error('SU-037 不在 gold fixture 里');
    unit.kind = 'combo';
  }),
  {
    code: 1,
    mustInclude: ['Semantic kind cannot use visual shape vocabulary', 'combo'],
  }
);

// Test 4（附加）：catalog 之外的自造形状名出现在 kind 里也应拦住
expect(
  'Test 4｜kind 写成 catalog 外的 "boundary-list" → FAIL',
  mutate((plan) => {
    findUnit(plan, 'SU-014').kind = 'boundary-list';
  }),
  {
    code: 1,
    mustInclude: ['Semantic kind cannot use visual shape vocabulary', 'boundary-list'],
  }
);

/* ---------------------------------------------------------------- *
 * 额外：几个容易误报的反向用例，确认验收器不会瞎拦
 * ---------------------------------------------------------------- */

expect(
  '原文本身出现过的措辞（如"充分条件"）不算违规',
  mutate((plan) => {
    findUnit(plan, 'SU-027').statement = 'Prompt 是承载方式，但不是充分条件。';
  }),
  { code: 0, mustInclude: ['结果：PASS'] }
);

expect(
  '标题里的"不承诺的 5 项"不算系统保证',
  mutate((plan) => {
    findBlock(plan, 'O-15').title = '明确不决定的 9 项 / 明确不承诺的 5 项';
  }),
  { code: 0 }
);

expect(
  '缺少必填字段 → FAIL（Schema 层）',
  mutate((plan) => {
    delete findBlock(plan, 'O-02').defaultExpanded;
  }),
  { code: 1, mustInclude: ['[schema]'] }
);

expect(
  'duplicatesMerged 引用不存在的 block → FAIL',
  mutate((plan) => {
    plan.duplicatesMerged[0].keptInBlock = 'O-99';
  }),
  { code: 1, mustInclude: ['keptInBlock'] }
);

expect(
  'sourceRef 指向不存在的章节 → FAIL',
  mutate((plan) => {
    findBlock(plan, 'O-02').sourceRefs[0].section = '§99';
  }),
  { code: 1, mustInclude: ['[schema]'] }
);

/* ---------------------------------------------------------------- *
 * 汇总
 * ---------------------------------------------------------------- */

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('');
console.log('='.repeat(56));
if (failures.length > 0) {
  console.log(`结果：FAILED —— ${failures.length} 个用例未通过，${passed} 个通过`);
  failures.forEach((f) => {
    console.log(`\n--- ${f.name} ---`);
    console.log(f.stdout.split('\n').slice(0, 24).join('\n'));
  });
  process.exit(1);
}
console.log(`结果：PASSED —— ${passed} 个用例全部通过`);
