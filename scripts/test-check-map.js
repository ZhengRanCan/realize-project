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

t('检查被跳过时 → 状态是 PASS WITH INCOMPLETE VALIDATION（不是 PASS）', () => {
  const r = run(baseMap(), { top: [], sub: [] });
  if (r.status !== 'PASS WITH INCOMPLETE VALIDATION') return 'status=' + r.status;
  return r.skipped.length > 0 || 'skipped 为空';
});

t('检查全部执行时 → 状态是 PASS', () => {
  const r = run(baseMap());
  return r.status === 'PASS' || 'status=' + r.status;
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

t('Topic 只挂一个 block/section → 已降级为 INFORMATIONAL（原 W4）', () => {
  const r = run(baseMap());
  if (!has(r.info, /I6 T-01 只挂了一个/)) return 'INFO 里没有: ' + r.info.join(' | ');
  const bad = [...r.warn, ...r.hard].filter((m) => /只挂了一个/.test(m));
  return bad.length === 0 || '仍被当成 WARN/HARD: ' + bad.join(' | ');
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

// ── section parser：Markdown heading tree（不是数字章节语法）───
t('非数字标题（## Goal）也能解析为小节全集', () => {
  const { readDocHeadings } = require('./check-map');
  const h = readDocHeadings('测试文档/fixture-d-goal-plan-task-state-model.md');
  if (h.sectionLevel !== 2) return 'sectionLevel=' + h.sectionLevel;
  if (!h.top.includes('Goal')) return 'top 里没有 Goal: ' + h.top.join(', ');
  if (!h.top.includes('FocusSession, TaskResult and DailyReview')) return '带逗号的长标题没解析出来';
  return h.all.includes('4.1') || h.all.length >= 21 ? true : 'all=' + h.all.length;
});

t('围栏代码块里的 # 注释不是标题（runbook 场景）', () => {
  const { readDocHeadings } = require('./check-map');
  const h = readDocHeadings('测试文档/fixture-e-f13-f16-runbook.md');
  if (h.sectionLevel !== 2) return 'sectionLevel=' + h.sectionLevel + '（被代码注释压到了 level 1）';
  const polluted = h.all.filter((k) => /期望|CloudBase CLI|目录下/.test(k));
  if (polluted.length) return '代码注释被当成标题: ' + polluted.join(', ');
  return h.top.length === 11 || 'top=' + h.top.join(', ');
});

// ── qualifiers：基本关系 + 结构属性 ──────────────────────────
const q = (over) => ({ cardinality: { from: 'one', to: 'one-or-many' }, ownership: 'owned', ...over });

t('合法 qualifiers → 无 HARD、无 W7', () => {
  const m = baseMap();
  m.edges[0].qualifiers = q();
  const r = run(m);
  if (r.hard.length) return '出现了 HARD: ' + r.hard.join(' | ');
  return !has(r.warn, /W7/) || r.warn.join(' | ');
});

t('qualifier 取值未知 → WARNING（W7，不是 HARD）', () => {
  const m = baseMap();
  m.edges[0].qualifiers = q({ ownership: 'borrowed', cardinality: { from: 'lots', to: 'one' } });
  const r = run(m);
  if (r.hard.length) return '被当成 HARD: ' + r.hard.join(' | ');
  return (has(r.warn, /W7/) && has(r.warn, /borrowed/) && has(r.warn, /lots/)) || r.warn.join(' | ');
});

t('qualifiers.cardinality 缺 to 端 → HARD（形态错）', () => {
  const m = baseMap();
  m.edges[0].qualifiers = { cardinality: { from: 'one' } };
  const r = run(m);
  return has(r.hard, /H8 .*缺少 to 端/) || r.hard.join(' | ');
});

t('qualifiers 里出现未知结构属性 → HARD（不许长第三层词表）', () => {
  const m = baseMap();
  m.edges[0].qualifiers = { aggregation: 'composite' };
  const r = run(m);
  return has(r.hard, /H8 .*aggregation/) || r.hard.join(' | ');
});

// ── relationGap：少而散逐条 W5，多而密集合成 W8 ─────────────
const gap = (i) => ({
  from: 'E-01', to: 'E-02', intendedMeaning: 'g' + i, reason: 'r' + i, fixture: 'TEST',
});

t('relationGap 少而散 → 逐条 W5（不聚合）', () => {
  const m = baseMap();
  m.relationGap = [gap(1), gap(2)];
  m.edges = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => ({ from: 'E-02', to: 'E-01', type: 'consumes' }));
  const r = run(m);
  if (has(r.warn, /W8/)) return '不该聚合却聚合了: ' + r.warn.join(' | ');
  return (has(r.warn, /W5 relationGap\[0\]/) && has(r.warn, /W5 relationGap\[1\]/)) || r.warn.join(' | ');
});

t('relationGap 多而密 → 聚合为一条 W8，明细挪到 detail 段', () => {
  const m = baseMap();
  m.relationGap = [gap(1), gap(2), gap(3)];
  m.edges = [{ from: 'E-02', to: 'E-01', type: 'consumes' }]; // 3/(3+1) = 0.75 ≥ 0.5，且 ≥ 3 条
  const r = run(m);
  if (!has(r.warn, /W8 关系缺口密度过高/)) return '没有聚合: ' + r.warn.join(' | ');
  if (has(r.warn, /W5 relationGap/)) return '聚合后仍在顶部逐条刷 W5';
  return r.relationGapDetails.length === 3 || 'detail=' + r.relationGapDetails.length;
});


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
