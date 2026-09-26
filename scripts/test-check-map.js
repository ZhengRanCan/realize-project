#!/usr/bin/env node
/**
 * check-map 的测试（Feature 06）
 *
 * 重点不是"能查出多少错"，而是**三级 severity 的边界**：
 *   - element > 12     → WARNING（绝不是 HARD）
 *   - 未知 role         → WARNING（绝不是 HARD）
 *   - relationGap       → WARNING
 *   - component=0 / state=0 / 无主轴 / DAG / Topic 无 element → INFORMATIONAL
 *   - 表外关系词 / 缺 provenance / 悬空引用 / 无导航路径 → HARD
 *
 * 用法: node scripts/test-check-map.js
 */
const { checkMap } = require('./check-map');

let pass = 0, fail = 0;
const results = [];

function t(name, fn) {
  try {
    const msg = fn();
    if (msg === true || msg === undefined) { pass++; results.push(`  PASS  ${name}`); }
    else { fail++; results.push(`  FAIL  ${name} → ${msg}`); }
  } catch (e) { fail++; results.push(`  FAIL  ${name} → throw: ${e.message}`); }
}
const has = (arr, re) => arr.some((m) => re.test(m));

/** 造一份最小合法 map（section 粒度，避免依赖外部文件） */
function baseMap(over = {}) {
  return {
    mapVersion: 2,
    level: 'L0',
    document: {
      id: 'D-TEST', title: 'T', sourcePath: '测试文档/18-context-consumption-semantic-model.md', role: 'target',
      scope: { text: 'scope', sectionRefs: ['§1'] },
    },
    elements: [
      { id: 'E-01', label: 'A', type: 'artifact', role: 'input', topics: ['T-01'], sectionRefs: ['§1'] },
      { id: 'E-02', label: 'B', type: 'process', role: 'intermediate', topics: ['T-01'], sectionRefs: ['§1'] },
    ],
    edges: [{ from: 'E-02', to: 'E-01', type: 'consumes' }],
    attachments: [],
    topics: [{ id: 'T-01', title: 't', proposition: 'p', sectionRefs: ['§1'] }],
    meta: { validationGranularity: 'section (provisional)' },
    ...over,
  };
}
// 注入一个最小的"原文小节全集"，避免测试依赖真实文档的标题格式
const DOC1 = { top: ['1'], sub: [] };
const run = (map, doc = DOC1) => checkMap(map, { docSections: doc });

// ── 基线：这份最小 map 必须 PASS ─────────────────────────────
t('基线最小 map：Hard Error = 0', () => {
  const r = run(baseMap());
  return r.hard.length === 0 || r.hard.join(' | ');
});

// ── HARD 组 ─────────────────────────────────────────────────
t('未知 element type → HARD', () => {
  const m = baseMap();
  m.elements[0].type = 'entity';
  const r = run(m);
  return has(r.hard, /H1 .*entity/) || r.hard.join(' | ');
});

t('缺 provenance → HARD', () => {
  const m = baseMap();
  delete m.elements[0].sectionRefs;
  const r = run(m);
  return has(r.hard, /H2 E-01/) || r.hard.join(' | ');
});

t('provenance 指向不存在的小节 → HARD', () => {
  const m = baseMap();
  m.elements[0].sectionRefs = ['§99'];
  const r = run(m);
  return has(r.hard, /H3 .*§99/) || r.hard.join(' | ');
});

t('悬空 edge 端点 → HARD', () => {
  const m = baseMap();
  m.edges[0].to = 'E-99';
  const r = run(m);
  return has(r.hard, /H3 edges\[0\] to="E-99"/) || r.hard.join(' | ');
});

t('表外关系词 → HARD', () => {
  const m = baseMap();
  m.edges[0].type = 'conforms-to';
  const r = run(m);
  return has(r.hard, /H4 .*conforms-to/) || r.hard.join(' | ');
});

t('无导航路径 → HARD', () => {
  const m = baseMap();
  // 原文有两节，但只有 §1 有入口 → §2 成为 orphan
  const r = run(m, { top: ['1', '2'], sub: [] });
  return has(r.hard, /H5 N2 没有入口的顶层小节: §2/) || r.hard.join(' | ');
});

t('原文小节无法解析 → 只 WARNING，不误报 HARD', () => {
  const m = baseMap();
  const r = run(m, { top: [], sub: [] });
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.warn, /W0 无法从原文解析出小节标题/) || r.warn.join(' | ');
});

t('element id 重复 → HARD', () => {
  const m = baseMap();
  m.elements.push({ ...m.elements[0], label: 'A2' });
  const r = run(m);
  return has(r.hard, /H6 element id 重复/) || r.hard.join(' | ');
});

t('主轴出现 constraint → HARD', () => {
  const m = baseMap();
  m.elements[0].type = 'constraint';
  const r = run(m);
  return has(r.hard, /主轴出现非 process\/artifact/) || r.hard.join(' | ');
});

// ── WARNING 组（**绝不能是 HARD**）────────────────────────────
t('element > 12 → WARNING 且不是 HARD', () => {
  const m = baseMap();
  for (let i = 3; i <= 13; i++) {
    m.elements.push({ id: `E-${String(i).padStart(2, '0')}`, label: `L${i}`, type: 'artifact', role: 'intermediate', topics: ['T-01'], sectionRefs: ['§1'] });
  }
  // 让新增元素都参与关系，避免触发 H7（本用例只想测 budget 的 severity）
  m.attachments = m.elements.slice(2).map((e) => ({ elementId: e.id, attachedTo: ['E-01'] }));
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.warn, /W1 element 总数 13 > preferred budget 12/) || r.warn.join(' | ');
});

t('未知 role → WARNING 且不是 HARD', () => {
  const m = baseMap();
  m.elements[0].role = 'normalization-stage';
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.warn, /W2 role 未知.*normalization-stage/) || r.warn.join(' | ');
});

t('relationGap → WARNING 且不是 HARD', () => {
  const m = baseMap();
  m.relationGap = [{ from: 'E-02', to: 'E-01', intendedMeaning: 'x', reason: 'y' }];
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.warn, /W5 relationGap\[0\]/) || r.warn.join(' | ');
});

t('Topic 只挂一个 block/section → WARNING', () => {
  const r = run(baseMap());
  return has(r.warn, /W4 T-01 只挂了一个/) || r.warn.join(' | ');
});

// ── INFORMATIONAL 组（**绝不能是 HARD / WARNING**）───────────
t('component = 0 与 state = 0 → INFORMATIONAL（不是 WARN/HARD）', () => {
  const r = run(baseMap());
  const okc = has(r.info, /I1 component = 0/) && has(r.info, /I2 state = 0/);
  if (!okc) return r.info.join(' | ');
  const bad = [...r.warn, ...r.hard].filter((m) => /component|state/.test(m));
  return bad.length === 0 || '被当成 WARN/HARD: ' + bad.join(' | ');
});

t('Topic 没有 element → INFORMATIONAL（不是 HARD）', () => {
  const m = baseMap();
  m.topics.push({ id: 'T-02', title: 't2', proposition: 'p2', sectionRefs: ['§1'] });
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.info, /I5 T-02 没有 L0 element/) || r.info.join(' | ');
});

t('出现收敛节点（DAG）→ INFORMATIONAL', () => {
  const m = baseMap();
  // E-02 同时消费 E-01 与 E-03 → 归一化后 E-02 有两条入边
  m.elements.push({ id: 'E-03', label: 'C', type: 'artifact', role: 'intermediate', topics: ['T-01'], sectionRefs: ['§1'] });
  m.edges.push({ from: 'E-02', to: 'E-03', type: 'consumes' });
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.info, /I4 非单链拓扑/) || r.info.join(' | ');
});

t('没有主轴 → INFORMATIONAL', () => {
  const m = baseMap();
  m.edges = [];
  m.attachments = [{ elementId: 'E-01', attachedTo: ['E-02'] }];
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return has(r.info, /I3 没有主轴/) || r.info.join(' | ');
});

// ── 词表来自 schema（单一真相）──────────────────────────────
t('词表确实从 schema 读（6 类 / 9 词）', () => {
  const { TYPE_ENUM, RELATION_ENUM } = require('./check-map');
  if (TYPE_ENUM.length !== 6) return 'TYPE_ENUM=' + TYPE_ENUM.length;
  if (RELATION_ENUM.length !== 9) return 'RELATION_ENUM=' + RELATION_ENUM.length;
  return true;
});

console.log('===== test-check-map =====');
console.log(results.join('\n'));
console.log(`===== ${pass} passed, ${fail} failed =====`);
process.exit(fail === 0 ? 0 : 1);
