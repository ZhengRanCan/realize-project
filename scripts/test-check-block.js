#!/usr/bin/env node
'use strict';

/**
 * check-block 的自动测试。
 *
 * 无 GUI、无 AI、无网络：直接调用 scripts/check-block.js 导出的 checkBlock()。
 * 用手写的极小 plan + block 做定向变异，逐条验证 Hard Error / Warning 规则。
 *
 * 用法：node scripts/test-check-block.js
 */

const fs = require('node:fs');
const path = require('node:path');

const { checkBlock } = require('./check-block.js');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'source-sections.json'), 'utf8'));
const sourceText = SOURCE_SECTIONS.sections.map((s) => s.text).join('\n');
const allowedPhrases = new Set(
  ['只能算', '充分条件', '一定正确', '课程一定有效', '学生一定学会', '已实现', '已经实现', '已验证'].filter((p) =>
    sourceText.includes(p)
  )
);

/* ------------------------------------------------------------------ *
 * 极小测试 plan
 * ------------------------------------------------------------------ */

const PLAN = {
  planVersion: 1,
  designRef: { id: 'TEST', path: 'fixtures/context-consumption.json' },
  shapeVocabularyVersion: 'shape-catalog-v1',
  sourceUnits: [
    { id: 'SU-001', section: '§1', kind: 'definition', statement: 'Definition A', importance: 'core' },
    { id: 'SU-002', section: '§1', kind: 'boundary', statement: 'Boundary B', importance: 'core' },
    { id: 'SU-003', section: '§1', kind: 'negative-case', statement: 'Negative C', importance: 'core' },
    { id: 'SU-004', section: '§2', kind: 'target-state', statement: 'Target D', importance: 'core' },
    { id: 'SU-005', section: '§2', kind: 'current-state', statement: 'Current E', importance: 'core' },
    { id: 'SU-006', section: '§3', kind: 'open-question', statement: 'Open F', importance: 'core' },
    { id: 'SU-007', section: '§3', kind: 'non-claim', statement: 'NonClaim G', importance: 'core' },
    { id: 'SU-008', section: '§4', kind: 'rationale', statement: 'Rationale H', importance: 'supporting' },
  ],
  blocks: [
    {
      id: 'O-A',
      title: '能力对照',
      stage: 'how',
      shape: 'capability-matrix',
      covers: ['SU-001', 'SU-002'],
      sourceRefs: [{ section: '§1', role: 'boundary' }],
      reviewObjects: [],
      defaultExpanded: true,
    },
    {
      id: 'O-B',
      title: '现状与目标',
      stage: 'what',
      shape: 'current-target-flow',
      covers: ['SU-004', 'SU-005'],
      sourceRefs: [{ section: '§2', role: 'current-state' }],
      reviewObjects: [],
      defaultExpanded: true,
    },
    {
      id: 'O-C',
      title: '未决与非主张',
      stage: 'boundary',
      shape: 'checklist',
      covers: ['SU-006', 'SU-007', 'SU-008'],
      sourceRefs: [{ section: '§3', role: 'non-claim' }],
      reviewObjects: [],
      defaultExpanded: false,
    },
    {
      id: 'O-D',
      title: '被考虑 vs 被采用',
      stage: 'what',
      shape: 'diff',
      covers: ['SU-001', 'SU-002'],
      sourceRefs: [{ section: '§1', role: 'boundary' }],
      reviewObjects: [],
      defaultExpanded: true,
    },
  ],
  duplicatesMerged: [],
};

/* ------------------------------------------------------------------ *
 * 基线 block 构造器（都是"应当通过"的写法）
 * ------------------------------------------------------------------ */

const BASE = {
  'capability-matrix': () => ({
    id: 'O-A',
    title: '能力对照',
    stage: 'how',
    shape: 'capability-matrix',
    covers: ['SU-001', 'SU-002'],
    sourceRefs: [{ section: '§1', role: 'boundary' }],
    reviewObjects: [],
    defaultExpanded: true,
    content: {
      type: 'matrix',
      columns: ['层级', '能说明', '不能说明'],
      rows: [
        [
          { text: 'Receipt', variant: 'plain', sourceUnitIds: ['SU-001'] },
          { text: '收到了上下文', variant: 'ok', sourceUnitIds: ['SU-001'] },
          { text: '不能证明可用', variant: 'bad', sourceUnitIds: ['SU-002'] },
        ],
      ],
    },
  }),

  'current-target-flow': () => ({
    id: 'O-B',
    title: '现状与目标',
    stage: 'what',
    shape: 'current-target-flow',
    covers: ['SU-004', 'SU-005'],
    sourceRefs: [{ section: '§2', role: 'current-state' }],
    reviewObjects: [],
    defaultExpanded: true,
    content: {
      type: 'flow',
      lanes: [
        {
          label: '现在',
          variant: 'current',
          sourceUnitIds: ['SU-005'],
          nodes: [{ node: { title: '现状节点', state: 'current', sourceUnitIds: ['SU-005'] } }],
        },
        {
          label: '目标',
          variant: 'target',
          sourceUnitIds: ['SU-004'],
          nodes: [{ node: { title: '目标节点', state: 'target', sourceUnitIds: ['SU-004'] } }],
        },
      ],
    },
  }),

  checklist: () => ({
    id: 'O-C',
    title: '未决与非主张',
    stage: 'boundary',
    shape: 'checklist',
    covers: ['SU-006', 'SU-007', 'SU-008'],
    sourceRefs: [{ section: '§3', role: 'non-claim' }],
    reviewObjects: [],
    defaultExpanded: false,
    content: {
      type: 'checklist',
      panels: [
        {
          title: '未决',
          variant: 'warn',
          sourceUnitIds: ['SU-006'],
          items: [{ text: '该问题本文不决定', variant: 'bad', sourceUnitIds: ['SU-006'] }],
        },
        {
          title: '不承诺',
          variant: 'bad',
          sourceUnitIds: ['SU-007'],
          items: [{ text: '不承诺语义一定正确', variant: 'bad', sourceUnitIds: ['SU-007'] }],
        },
        {
          title: '理由',
          variant: 'plain',
          sourceUnitIds: ['SU-008'],
          items: [{ text: '因为证据不足', variant: 'muted', sourceUnitIds: ['SU-008'] }],
        },
      ],
    },
  }),
};

function mutate(shape, fn) {
  const block = JSON.parse(JSON.stringify(BASE[shape]()));
  fn(block);
  return block;
}

function run(block) {
  return checkBlock(block, PLAN, { allowedPhrases });
}

/* ------------------------------------------------------------------ *
 * 断言
 * ------------------------------------------------------------------ */

let passed = 0;
const failures = [];

function expect(name, block, { verdict, mustInclude, mustNotInclude }) {
  const result = run(block);
  const problems = [];
  if (verdict && result.verdict !== verdict) problems.push(`verdict=${result.verdict}，期望 ${verdict}`);
  const all = [...result.errors, ...result.warnings].join('\n');
  (mustInclude || []).forEach((f) => {
    if (!all.includes(f)) problems.push(`诊断里没有出现「${f}」`);
  });
  (mustNotInclude || []).forEach((f) => {
    if (all.includes(f)) problems.push(`诊断里不应出现「${f}」`);
  });
  if (problems.length === 0) {
    passed += 1;
    console.log(`✓ ${name}`);
  } else {
    failures.push({ name, problems, errors: result.errors, warnings: result.warnings });
    console.log(`✗ ${name}`);
    problems.forEach((p) => console.log(`    - ${p}`));
  }
}

console.log('=== check-block 自动测试 ===\n');

/* ---------------- 基线：三个 shape 都应当 PASS ---------------- */

expect('基线｜capability-matrix 正确写法 → PASS', BASE['capability-matrix'](), {
  verdict: 'PASS',
  mustNotInclude: ['HARD'],
});

expect('基线｜current-target-flow 正确写法 → PASS', BASE['current-target-flow'](), {
  verdict: 'PASS',
});

expect('基线｜checklist 正确写法 → PASS', BASE.checklist(), {
  verdict: 'PASS',
});

/* ---------------- Hard Error 1：shape 与 content.type 不一致 ---------------- */

expect(
  'shape 与 content.type 不一致 → FAIL',
  mutate('capability-matrix', (b) => {
    b.content.type = 'checklist';
    b.content.panels = [{ items: [{ text: 'x', sourceUnitIds: ['SU-001'] }] }];
    delete b.content.columns;
    delete b.content.rows;
  }),
  { verdict: 'FAIL', mustInclude: ['shape 与 content.type 不一致'] }
);

/* ---------------- Hard Error 2：修改了 plan 固定字段 ---------------- */

expect(
  '修改 plan 固定字段（title）→ FAIL',
  mutate('capability-matrix', (b) => {
    b.title = '我自己改的标题';
  }),
  { verdict: 'FAIL', mustInclude: ['固定字段被修改：title'] }
);

expect(
  '修改 plan 固定字段（covers）→ FAIL',
  mutate('capability-matrix', (b) => {
    b.covers = ['SU-001'];
  }),
  { verdict: 'FAIL', mustInclude: ['固定字段被修改：covers'] }
);

/* ---------------- Hard Error 3：引用不在 covers 里的 sourceUnit ---------------- */

expect(
  'provenance 引用不在 covers 里的 sourceUnit → FAIL',
  mutate('capability-matrix', (b) => {
    b.content.rows[0][1].sourceUnitIds = ['SU-003']; // SU-003 不在 O-A 的 covers 里
  }),
  { verdict: 'FAIL', mustInclude: ['不在 block.covers 中'] }
);

/* ---------------- Hard Error 4：core sourceUnit 没有承载 ---------------- */

expect(
  'core sourceUnit 没有任何元素承载 → FAIL',
  mutate('capability-matrix', (b) => {
    // 去掉 SU-002 的全部 provenance
    b.content.rows[0] = b.content.rows[0].map((c) => ({ ...c, sourceUnitIds: ['SU-001'] }));
  }),
  { verdict: 'FAIL', mustInclude: ['core sourceUnit 没有任何 content element 承载：SU-002'] }
);

/* ---------------- Hard Error 5：引用不存在的 sourceUnit ---------------- */

expect(
  'provenance 引用不存在的 sourceUnit → FAIL',
  mutate('capability-matrix', (b) => {
    b.content.rows[0][0].sourceUnitIds = ['SU-999'];
  }),
  { verdict: 'FAIL', mustInclude: ['不存在的 sourceUnit：SU-999'] }
);

/* ---------------- Hard Error 6：Current / Target 反转 ---------------- */

expect(
  'current 泳道挂了 target-state 语义 → FAIL',
  mutate('current-target-flow', (b) => {
    const currentLane = b.content.lanes.find((l) => l.variant === 'current');
    currentLane.sourceUnitIds = ['SU-004']; // target-state
    currentLane.nodes[0].node.sourceUnitIds = ['SU-004'];
    currentLane.nodes[0].node.state = 'current';
    // 让 covers 仍然被覆盖：target 泳道也引用 SU-005
    b.content.lanes.find((l) => l.variant === 'target').sourceUnitIds = ['SU-005'];
    b.content.lanes.find((l) => l.variant === 'target').nodes[0].node.sourceUnitIds = ['SU-005'];
  }),
  { verdict: 'FAIL', mustInclude: ['[反转]'] }
);

expect(
  'node.state=current 但 provenance 是 target-state → FAIL',
  mutate('current-target-flow', (b) => {
    const currentLane = b.content.lanes.find((l) => l.variant === 'current');
    currentLane.nodes[0].node.sourceUnitIds = ['SU-004'];
  }),
  { verdict: 'FAIL', mustInclude: ['state=current'] }
);

expect(
  'current-target-flow 缺少一个泳道 → FAIL',
  mutate('current-target-flow', (b) => {
    b.content.lanes = [b.content.lanes[1]];
    b.covers = ['SU-004'];
  }),
  { verdict: 'FAIL', mustInclude: ['需要同时存在 current 与 target'] }
);

/* ---------------- Hard Error 7：未决事项被写成确定结论 ---------------- */

expect(
  '未决事项被写成确定结论 → FAIL',
  mutate('checklist', (b) => {
    b.content.panels[0].items[0].text = '该字段已确定为 attempt 级记录';
  }),
  { verdict: 'FAIL', mustInclude: ['把未决语义 SU-006 写成了确定结论'] }
);

expect(
  '未决语义在 content 里完全没有落点 → FAIL',
  mutate('checklist', (b) => {
    b.content.panels = b.content.panels.slice(1);
    b.covers = ['SU-007', 'SU-008'];
    // SU-006 仍然在 covers 里 —— 用 covers 保留但移除 provenance 的方式制造"丢掉"
    b.covers = ['SU-006', 'SU-007', 'SU-008'];
  }),
  { verdict: 'FAIL', mustInclude: ['未决语义 SU-006 在 content 中没有落点'] }
);

/* ---------------- Hard Error 8：non-claim 被写成 claim ---------------- */

expect(
  'non-claim 被写成系统保证 → FAIL',
  mutate('checklist', (b) => {
    b.content.panels[1].items[0].text = '我们保证语义一定正确';
  }),
  { verdict: 'FAIL', mustInclude: ['不承诺的内容被写成了系统保证'] }
);

/* ---------------- Hard Error 9：source-verified ---------------- */

expect(
  'content 出现 source-verified → FAIL',
  mutate('capability-matrix', (b) => {
    b.content.evidenceType = 'source-verified';
  }),
  { verdict: 'FAIL', mustInclude: ['source-verified'] }
);

/* ---------------- Hard Error 10：禁用措辞（新增才拦） ---------------- */

expect(
  '新增禁用措辞（原文没出现过）→ FAIL',
  mutate('capability-matrix', (b) => {
    b.content.rows[0][2].text = '经核实不可用';
  }),
  { verdict: 'FAIL', mustInclude: ['禁用措辞'] }
);

expect(
  '原文出现过的措辞不算违规（如"充分条件"）→ PASS',
  mutate('capability-matrix', (b) => {
    b.content.rows[0][2].text = '不是充分条件';
  }),
  { verdict: 'PASS' }
);

/* ---------------- Warning 1：supporting 未承载 ---------------- */

expect(
  'supporting sourceUnit 未被承载 → WARNING',
  mutate('checklist', (b) => {
    b.content.panels = b.content.panels.slice(0, 2); // 去掉 SU-008 那一组
  }),
  { verdict: 'PASS WITH WARNINGS', mustInclude: ['supporting sourceUnit 没有被任何 content element 承载：SU-008'] }
);

/* ---------------- Warning 2：一个元素挂太多 provenance ---------------- */

expect(
  '一个元素挂过多 sourceUnit → WARNING',
  mutate('checklist', (b) => {
    b.content.panels[0].items[0].sourceUnitIds = ['SU-006', 'SU-007', 'SU-008', 'SU-006', 'SU-007'];
  }),
  { verdict: 'PASS WITH WARNINGS', mustInclude: ['挂了'] }
);

/* ---------------- Warning 3：过度概括 ---------------- */

expect(
  '短文本承载过多语义 → WARNING（过度概括）',
  mutate('checklist', (b) => {
    b.content.panels[0].items[0].text = '见上';
    b.content.panels[0].items[0].sourceUnitIds = ['SU-006', 'SU-007', 'SU-008', 'SU-006'];
  }),
  { verdict: 'PASS WITH WARNINGS', mustInclude: ['可能过度概括'] }
);

/* ---------------- Warning 4：prose 化 ---------------- */

expect(
  '长文本占比过高 → WARNING（退化成 prose）',
  mutate('checklist', (b) => {
    // 阈值是单字段 > 160 字符；这里刻意写足长度
    const long = '这是一段刻意写得很长的说明文字，用来触发"可能退化成 prose"的检查项，因为形状没有被真正用起来。'.repeat(6);
    b.content.panels.forEach((p) => p.items.forEach((it) => (it.text = long)));
  }),
  { verdict: 'PASS WITH WARNINGS', mustInclude: ['可能退化成 prose'] }
);

/* ---------------- Warning 5：sourceUnit 重复出现 ---------------- */

expect(
  '同一 sourceUnit 在多个元素重复出现 → WARNING',
  mutate('checklist', (b) => {
    b.content.panels.forEach((p) => p.items.forEach((it) => (it.sourceUnitIds = ['SU-006', 'SU-007', 'SU-008'])));
  }),
  { verdict: 'PASS WITH WARNINGS', mustInclude: ['重复出现'] }
);

/* ---------------- Warning 6：shape 容量 ---------------- */

expect(
  'capability-matrix 行数超过推荐容量 → WARNING',
  mutate('capability-matrix', (b) => {
    b.content.rows = Array.from({ length: 7 }, (_, i) => [
      { text: `主语${i}`, sourceUnitIds: ['SU-001'] },
      { text: '能', variant: 'ok', sourceUnitIds: ['SU-001'] },
      { text: '不能', variant: 'bad', sourceUnitIds: ['SU-002'] },
    ]);
  }),
  { verdict: 'PASS WITH WARNINGS', mustInclude: ['超过 shape catalog'] }
);

/* ---------------- 语义承载结构元素必须有 provenance（Hard Error） ---------------- */

expect(
  '承载语义的元素完全没有 provenance → FAIL（Hard Error）',
  mutate('capability-matrix', (b) => {
    delete b.content.rows[0][0].sourceUnitIds;
    delete b.content.rows[0][1].sourceUnitIds;
    // SU-001 改由第三个单元格承载，避免触发 core 未承载
    b.content.rows[0][2].sourceUnitIds = ['SU-001', 'SU-002'];
  }),
  { verdict: 'FAIL', mustInclude: ['含实际生成语义文本，但没有 sourceUnitIds'] }
);

/* ---------------- 用户指定的四个用例 ---------------- */

// Test 1：checklist panel.title 有语义但无 sourceUnitIds → FAIL
expect(
  'Test 1｜checklist panel.title 承载语义但无 provenance → FAIL',
  mutate('checklist', (b) => {
    delete b.content.panels[0].sourceUnitIds;
  }),
  { verdict: 'FAIL', mustInclude: ['panels[0]', '含实际生成语义文本，但没有 sourceUnitIds'] }
);

// Test 2：checklist panel.title 有语义且有 sourceUnitIds → PASS
expect(
  'Test 2｜checklist panel.title 承载语义且带 provenance → PASS',
  mutate('checklist', (b) => {
    b.content.panels[0].sourceUnitIds = ['SU-006'];
  }),
  { verdict: 'PASS' }
);

// Test 3：CURRENT / TARGET 等固定 renderer label → 不要求 provenance
expect(
  'Test 3｜纯展示标签（CURRENT / 能说明）不要求 provenance → PASS',
  mutate('capability-matrix', (b) => {
    b.content.columns = ['CURRENT', '能说明', '不能说明'];
    b.content.rows[0][1].text = '能说明';
    b.content.rows[0][1].sourceUnitIds = ['SU-001'];
    delete b.content.rows[0][0].sourceUnitIds; // 行首写成固定标签 CURRENT
    b.content.rows[0][0].text = 'CURRENT';
  }),
  { verdict: 'PASS WITH WARNINGS', mustNotInclude: ['含实际生成语义文本'] }
);

{
  const diffBlock = {
    id: 'O-D',
    title: '被考虑 vs 被采用',
    stage: 'what',
    shape: 'diff',
    covers: ['SU-001', 'SU-002'],
    sourceRefs: [{ section: '§1', role: 'boundary' }],
    reviewObjects: [],
    defaultExpanded: true,
    content: {
      type: 'diff',
      sides: [
        { label: 'TARGET', variant: 'target', lines: [{ mark: 'keep', text: '定义 A', sourceUnitIds: ['SU-001'] }] },
        { label: 'CURRENT', variant: 'current', lines: [{ mark: 'gone', text: '边界 B', sourceUnitIds: ['SU-002'] }] },
      ],
    },
  };
  expect('Test 3b｜diff 侧标题写成 TARGET / CURRENT 固定标签 → 不要求 provenance', diffBlock, {
    verdict: 'PASS WITH WARNINGS',
    mustNotInclude: ['含实际生成语义文本'],
  });
}

// Test 4：matrix 自定义 row title 承载语义但无 provenance → FAIL
expect(
  'Test 4｜matrix 自定义行首承载语义但无 provenance → FAIL',
  mutate('capability-matrix', (b) => {
    delete b.content.rows[0][0].sourceUnitIds; // 行首是 "Receipt"（语义标签）
  }),
  { verdict: 'FAIL', mustInclude: ['rows[0][0]', '含实际生成语义文本'] }
);

expect(
  'Test 4b｜matrix 行首是纯展示标签时不报错 → PASS',
  mutate('capability-matrix', (b) => {
    b.content.rows[0][0].text = '层级';
    delete b.content.rows[0][0].sourceUnitIds;
    b.content.rows[0][1].sourceUnitIds = ['SU-001'];
    b.content.rows[0][2].sourceUnitIds = ['SU-002'];
  }),
  { verdict: 'PASS WITH WARNINGS', mustNotInclude: ['含实际生成语义文本'] }
);

/* ------------------------------------------------------------------ *
 * 汇总
 * ------------------------------------------------------------------ */

console.log('');
console.log('='.repeat(56));
if (failures.length > 0) {
  console.log(`结果：FAILED —— ${failures.length} 个用例未通过，${passed} 个通过`);
  failures.forEach((f) => {
    console.log(`\n--- ${f.name} ---`);
    console.log(`  errors:   ${JSON.stringify(f.errors)}`);
    console.log(`  warnings: ${JSON.stringify(f.warnings)}`);
  });
  process.exit(1);
}
console.log(`结果：PASSED —— ${passed} 个用例全部通过`);
