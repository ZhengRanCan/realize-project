#!/usr/bin/env node
/**
 * framework-map 校验器（Feature 06 / Phase 3）
 *
 * 用法:
 *   node scripts/check-map.js --map <map.json> [--plan <overview-plan.json>]
 *
 * 设计原则（见 docs/features/06-contract-and-validators/README.md）：
 *   - 结构层的枚举**从 schema 读**，不在本文件里另写一份
 *   - 三级 severity：HARD（契约违反） / WARN（需要人看一眼） / INFO（只是形态差异）
 *   - 刻意**不**检查：element 数量上限（那是 Warning）、role 是否为已知值（Warning）、
 *     是否出现某类元素 / 主轴 / DAG（INFO）
 *   - 粒度纪律：A 走 sourceUnit，B / C 走 section。**本脚本一次只处理一份 map**，
 *     因此不可能把两种粒度合成一个百分比
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA = path.join(ROOT, 'schema', 'framework-map.schema.json');

// ── 词表从 schema 读（单一真相） ─────────────────────────────
const schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8'));
const TYPE_ENUM = schema.$defs.elementType.enum;
const RELATION_ENUM = schema.$defs.relationType.enum;
const KNOWN_ROLES = schema.$defs.element.properties.role['x-known-roles'];
const PREFERRED_ELEMENT_BUDGET = 12; // heuristic，不是语义有效性

// ── 原文 / plan 的读取 ──────────────────────────────────────
function readDocSections(sourcePath) {
  const txt = fs.readFileSync(path.resolve(ROOT, sourcePath), 'utf8');
  const top = new Set(), sub = new Set();
  txt.split(/\r?\n/).forEach((l) => {
    let m = l.match(/^## (\d+)\./); if (m) top.add(m[1]);
    m = l.match(/^### (\d+\.\d+)/); if (m) sub.add(m[1]);
  });
  return { top: [...top].sort((a, b) => a - b), sub: [...sub].sort() };
}

/**
 * 校验一份 framework-map。
 * @param {object} map
 * @param {{plan?: object, planPath?: string}} opts
 * @returns {{hard: string[], warn: string[], info: string[], granularity: string, stats: object}}
 */
function checkMap(map, opts = {}) {
  const hard = [], warn = [], info = [];
  const granularity = (map.meta && map.meta.validationGranularity) || '(未标注)';
  const isSection = /section/i.test(granularity);

  const els = map.elements || [];
  const edges = map.edges || [];
  const atts = map.attachments || [];
  const topics = map.topics || [];
  const gaps = map.relationGap || [];
  const byId = new Map();
  const dupIds = [];

  // ── H6 同 ID 重复 ───────────────────────────────────────
  els.forEach((e) => {
    if (byId.has(e.id)) dupIds.push(e.id); else byId.set(e.id, e);
  });
  if (dupIds.length) hard.push(`H6 element id 重复: ${dupIds.join(', ')}`);
  const topicIds = new Map(); const dupTopics = [];
  topics.forEach((t) => { if (topicIds.has(t.id)) dupTopics.push(t.id); else topicIds.set(t.id, t); });
  if (dupTopics.length) hard.push(`H6 topic id 重复: ${dupTopics.join(', ')}`);

  // ── H1 未知 element type / W2 未知 role ─────────────────
  const unknownRoles = new Set();
  els.forEach((e) => {
    if (!TYPE_ENUM.includes(e.type)) hard.push(`H1 ${e.id} type="${e.type}" 不在允许词表内`);
    if (!KNOWN_ROLES.includes(e.role)) unknownRoles.add(`${e.id}:${e.role}`);
  });
  if (unknownRoles.size) warn.push(`W2 role 未知（controlled-but-extensible，不判 Hard）: ${[...unknownRoles].join(', ')}`);

  // ── provenance 与可达性所需的数据 ────────────────────────
  const plan = opts.plan;
  let validUnits = null, universe = [], blockById = null, allBlocks = null;
  let sec = null, sectionUnresolved = false;
  if (!isSection) {
    if (plan) {
      validUnits = new Set(plan.sourceUnits.map((u) => u.id));
      universe = plan.sourceUnits.map((u) => u.id);
      allBlocks = plan.blocks;
      blockById = new Map(allBlocks.map((b) => [b.id, b]));
    }
  } else {
    sec = opts.docSections || readDocSections(map.document.sourcePath);
    if (!sec.top.length) {
      // 原文小节标题不是数字形式（例如 Fixture A 用「## 一、」）→ 无法建立"位置全集"。
      // 此时**不能**把每个引用都判成悬空引用 —— 那会把格式差异误报成契约违反。
      sectionUnresolved = true;
      warn.push('W0 无法从原文解析出小节标题（文档可能使用非数字标题）→ 跳过 section 粒度的引用 / 导航校验，避免误报 HARD');
    } else {
      validUnits = new Set([...sec.top.map((n) => '§' + n), ...sec.sub.map((n) => '§' + n)]);
      universe = sec.top.map((n) => '§' + n);
    }
  }

  const provenanceOf = (el) => [...(el.sourceUnitIds || []), ...(el.sectionRefs || [])];

  // ── H2 缺 provenance / H3 引用必须可解析 ─────────────────
  els.forEach((e) => {
    const prov = provenanceOf(e);
    if (prov.length === 0) hard.push(`H2 ${e.id} 缺少 provenance（sourceUnitIds 与 sectionRefs 都为空）`);
    if (validUnits) prov.forEach((r) => {
      if (!validUnits.has(r)) hard.push(`H3 ${e.id} 的 provenance 指向不存在的位置: ${r}`);
    });
  });
  els.forEach((e) => (e.topics || []).forEach((t) => {
    if (!topicIds.has(t)) hard.push(`H3 ${e.id} 的 topics 指向不存在的 topic: ${t}`);
  }));

  // ── H4 edge 表外词 / H3 edge 端点 ────────────────────────
  edges.forEach((ed, i) => {
    if (!RELATION_ENUM.includes(ed.type)) hard.push(`H4 edges[${i}] relation "${ed.type}" 是表外词（要表达词表之外的关系请用 relationGap）`);
    if (!byId.has(ed.from)) hard.push(`H3 edges[${i}] from="${ed.from}" 不存在`);
    if (!byId.has(ed.to)) hard.push(`H3 edges[${i}] to="${ed.to}" 不存在`);
  });
  const relatesTo = edges.filter((e) => e.type === 'relates-to').length;
  if (relatesTo > 1) warn.push(`W6 relates-to 兜底词使用了 ${relatesTo} 次（>1）—— 兜底词一多说明词表不够用`);

  // ── H3 attachment 引用 / 主轴类型 ───────────────────────
  atts.forEach((a, i) => {
    if (!byId.has(a.elementId)) hard.push(`H3 attachments[${i}] elementId="${a.elementId}" 不存在`);
    (a.attachedTo || []).forEach((x) => {
      if (!byId.has(x)) hard.push(`H3 attachments[${i}] attachedTo 含不存在的元素 "${x}"`);
    });
  });
  const inEdge = new Set(edges.flatMap((e) => [e.from, e.to]));
  const inAtt = new Set([...atts.map((a) => a.elementId), ...atts.flatMap((a) => a.attachedTo || [])]);
  const spineEls = [...inEdge].map((id) => byId.get(id)).filter(Boolean);
  const badSpine = spineEls.filter((e) => !['process', 'artifact'].includes(e.type));
  if (badSpine.length) hard.push(`H3 主轴出现非 process/artifact 元素: ${badSpine.map((e) => `${e.id}(${e.type})`).join(', ')}`);
  // H7 判据 B：每个元素至少参与一条 edge 或 attachment
  const isolated = els.filter((e) => !inEdge.has(e.id) && !inAtt.has(e.id)).map((e) => e.id);
  if (isolated.length) hard.push(`H7 孤立元素（判据 B：至少参与一条 edge 或 attachment）: ${isolated.join(', ')}`);

  // ── H3 topic 的 blockIds / sectionRefs ──────────────────
  topics.forEach((t) => (t.blockIds || []).forEach((b) => {
    if (blockById && !blockById.has(b)) hard.push(`H3 ${t.id} 的 blockIds 指向不存在的 block: ${b}`);
  }));
  topics.forEach((t) => (t.sectionRefs || []).forEach((r) => {
    if (validUnits && !validUnits.has(r)) hard.push(`H3 ${t.id} 的 sectionRefs 指向不存在的小节: ${r}`);
  }));

  // ── H3 document 入口引用 ────────────────────────────────
  const docEntries = ['scope', 'nonGoalSummary'].map((k) => map.document[k]).filter(Boolean);
  const docUnits = new Set(docEntries.flatMap((d) => [...(d.sourceUnitIds || []), ...(d.sectionRefs || [])]));
  if (validUnits) docUnits.forEach((r) => {
    if (!validUnits.has(r)) hard.push(`H3 document 入口引用不存在的位置: ${r}`);
  });

  // ── H5 导航路径（N1 / N2 / N3） ─────────────────────────
  // N1
  topics.forEach((t) => {
    const nEl = els.filter((e) => (e.topics || []).includes(t.id)).length;
    const nNav = (t.blockIds || []).length + (t.sectionRefs || []).length;
    if (nEl === 0 && nNav === 0) hard.push(`H5 N1 ${t.id} 既没有 element 也没有 block / section`);
  });

  // N2：每个需要保留的 block / 小节必须至少一个入口（文档级入口除外）
  const topicBlockIds = new Set(topics.flatMap((t) => t.blockIds || []));
  const topicSections = new Set(topics.flatMap((t) => t.sectionRefs || []));
  const entrySet = new Set([...topicSections, ...docUnits]);
  if (isSection) {
    if (!sectionUnresolved) {
      const orphans = sec.top.map((n) => '§' + n).filter((s) => !entrySet.has(s));
      if (orphans.length) hard.push(`H5 N2 没有入口的顶层小节: ${orphans.join(', ')}`);
    }
  } else if (allBlocks) {
    const ep = (plan && plan.duplicatesMerged) || [];
    const isDocLevel = (b) => {
      const cov = b.covers || [];
      return cov.length > 0 && cov.every((u) => docUnits.has(u));
    };
    const orphans = allBlocks.filter((b) => !topicBlockIds.has(b.id) && !isDocLevel(b)).map((b) => b.id);
    if (orphans.length) hard.push(`H5 N2 既没有 Topic 入口也不属于文档级入口的 block: ${orphans.join(', ')}`);
    void ep;
  }

  // N3：每条语义 / 每一节至少一条可达路径
  const elProv = new Set(els.flatMap((e) => provenanceOf(e)));
  const l2Reach = new Set();
  if (isSection) {
    topicSections.forEach((s) => l2Reach.add(s));
    topics.forEach((t) => (t.sectionRefs || []).forEach((s) => l2Reach.add(s)));
  } else if (allBlocks) {
    topicBlockIds.forEach((bid) => {
      const b = blockById.get(bid);
      if (b) (b.covers || []).forEach((u) => l2Reach.add(u));
    });
    ((plan && plan.duplicatesMerged) || []).forEach((d) => {
      if (topicBlockIds.has(d.keptInBlock)) (d.sourceUnits || []).forEach((u) => l2Reach.add(u));
    });
  }
  const reachable = new Set([...docUnits, ...elProv, ...l2Reach]);
  const unreachable = universe.filter((x) => !reachable.has(x));
  if (unreachable.length) hard.push(`H5 N3 完全无路径 ${unreachable.length} 条: ${unreachable.slice(0, 10).join(', ')}${unreachable.length > 10 ? ' …' : ''}`);

  // ── W1 element budget（**Warning，不是 Error**） ──────────
  if (els.length > PREFERRED_ELEMENT_BUDGET) {
    const hasNav = unreachable.length === 0;
    warn.push(`W1 element 总数 ${els.length} > preferred budget ${PREFERRED_ELEMENT_BUDGET}（认知容量 heuristic，非 semantic validity）`
      + (hasNav ? '；内容都有 L1/L2 入口 → 只需检查 Navigation invariant' : '；且存在无路径内容 → 需要重新抽象'));
  }

  // ── W3 / W4 topic 形态 ──────────────────────────────────
  if (topics.length > 10) warn.push(`W3 Topic 数 ${topics.length} > 10`);
  topics.forEach((t) => {
    const nBlocks = (t.blockIds || []).length + (t.sectionRefs || []).length;
    if (nBlocks === 1) warn.push(`W4 ${t.id} 只挂了一个 block / section`);
  });

  // ── W5 relationGap 存在 ─────────────────────────────────
  gaps.forEach((g, i) => {
    warn.push(`W5 relationGap[${i}] ${g.from} ⇢ ${g.to}：「${g.intendedMeaning}」（REVIEW REQUIRED —— 现有词表无法在不失真前提下表达）`);
  });

  // ── INFO：形态差异，不是异常 ────────────────────────────
  const typeCount = (t) => els.filter((e) => e.type === t).length;
  if (typeCount('component') === 0) info.push('I1 component = 0（正常形态差异，不是缺陷）');
  if (typeCount('state') === 0) info.push('I2 state = 0（正常形态差异，不是缺陷）');
  if (edges.length === 0 || spineEls.length < 2) info.push('I3 没有主轴（edges 为空或主轴少于 2 个元素）—— 布局策略属具体文档');
  // I4 拓扑形态：把 consumes 归一化到"流向"（被消费的东西流进消费者），再看多入边。
  // 不归一化的话，任何"被生产又被消费"的 artifact 都会被误判成收敛节点。
  const flow = edges.map((e) => (e.type === 'consumes' ? { from: e.to, to: e.from } : { from: e.from, to: e.to }));
  const indeg = new Map();
  flow.forEach((e) => indeg.set(e.to, (indeg.get(e.to) || 0) + 1));
  const fanIn = [...indeg.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (fanIn.length) info.push(`I4 非单链拓扑：收敛节点 ${fanIn.join(', ')}（按 consumes 归一化后的多入边）—— 形态差异，不是异常`);
  topics.forEach((t) => {
    const nEl = els.filter((e) => (e.topics || []).includes(t.id)).length;
    if (nEl === 0) info.push(`I5 ${t.id} 没有 L0 element（Topic 与 element 已解耦，合法）`);
  });

  return {
    hard, warn, info, granularity,
    stats: { elements: els.length, edges: edges.length, attachments: atts.length, topics: topics.length, relationGap: gaps.length, universe: universe.length, unreachable: unreachable.length },
  };
}

// ── CLI ────────────────────────────────────────────────────
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function main() {
  const mapPath = arg('--map');
  if (!mapPath) {
    console.error('用法: node scripts/check-map.js --map <map.json> [--plan <overview-plan.json>]');
    process.exit(2);
  }
  const planPath = arg('--plan');
  const map = JSON.parse(fs.readFileSync(path.resolve(ROOT, mapPath), 'utf8'));
  const plan = planPath ? JSON.parse(fs.readFileSync(path.resolve(ROOT, planPath), 'utf8')) : undefined;
  const r = checkMap(map, { plan, planPath });

  const L = [];
  L.push(`===== check-map: ${mapPath} =====`);
  L.push(`document      ${map.document.title}`);
  L.push(`granularity   ${r.granularity}${/provisional/i.test(r.granularity) ? '   ⚠️ provisional — 不得与 sourceUnit 粒度混算' : ''}`);
  L.push(`stats         elements ${r.stats.elements} · edges ${r.stats.edges} · attachments ${r.stats.attachments} · topics ${r.stats.topics} · relationGap ${r.stats.relationGap}`);
  L.push(`coverage      ${r.stats.universe - r.stats.unreachable}/${r.stats.universe} 有路径（本粒度内）`);
  L.push('');
  L.push(`HARD ERROR (${r.hard.length})`);
  r.hard.forEach((m) => L.push('  ✗ ' + m));
  if (!r.hard.length) L.push('  （无）');
  L.push('');
  L.push(`WARNING (${r.warn.length})`);
  r.warn.forEach((m) => L.push('  ! ' + m));
  if (!r.warn.length) L.push('  （无）');
  L.push('');
  L.push(`INFORMATIONAL (${r.info.length})`);
  r.info.forEach((m) => L.push('  i ' + m));
  if (!r.info.length) L.push('  （无）');
  L.push('');
  L.push('════════════════════════════════');
  L.push(`结果: HARD ${r.hard.length} · WARN ${r.warn.length} · INFO ${r.info.length}`);
  L.push(r.hard.length === 0 ? 'PASS（无契约违反）' : 'FAIL（存在契约违反）');
  L.push('注: element budget 是 Warning；某类元素为 0 / 无主轴 / DAG / Topic 无 element 是 Informational，不是异常。');
  L.push('════════════════════════════════');
  console.log(L.join('\n'));
  process.exit(r.hard.length === 0 ? 0 : 1);
}

module.exports = { checkMap, TYPE_ENUM, RELATION_ENUM, KNOWN_ROLES, PREFERRED_ELEMENT_BUDGET };

if (require.main === module) main();
