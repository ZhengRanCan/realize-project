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
// 结构属性（qualifiers）的词表同样从 schema 读
const CARDINALITY_ENUM = schema.$defs.cardinalityValue.enum;
const QUALIFIER_KEYS = Object.keys(schema.$defs.edgeQualifiers.properties);
const OWNERSHIP_KNOWN = schema.$defs.edgeQualifiers.properties.ownership['x-known-values'];
// 关系缺口聚合阈值：缺口条数够多 **且** 占比够高，才说明关系层整体不够用
const GAP_DENSITY_MIN_COUNT = 3;
const GAP_DENSITY_MIN_RATIO = 0.5;

// ── 原文 / plan 的读取 ──────────────────────────────────────
/**
 * 解析原文的 **Markdown Heading Tree**。
 *
 * 长期语义（见 docs/framework-map-contract.md）：原文的导航单位是 Markdown 标题层级，
 * **不是**数字章节编号。「## 4. 总览」与「## Goal」都是合法的小节标题；编号只是标题
 * 文本的一部分，不是语法。此处只做一件最小的事：把所有 heading 收进一棵树，并给每个
 * heading 一个稳定 key（有编号取编号 token，否则取标题文本），供 `§<key>` 引用解析。
 *
 * N2 / N3 需要什么粒度，就从树里**选**一层，而不是把「## N.」写死：
 * sectionLevel = 最浅的、且至少有 2 个标题的那一层（跳过孤零零的文档大标题）。
 */
function readDocHeadings(sourcePath) {
  const txt = fs.readFileSync(path.resolve(ROOT, sourcePath), 'utf8');
  const heads = [];
  // 围栏代码块内的 `#` 是注释，不是标题 —— 必须按 Markdown 语义跳过，
  // 否则 runbook 里的 shell 注释（"# 期望: 无输出"）会被当成 level-1 标题。
  let fenceChar = null, fenceLen = 0;
  txt.split(/\r?\n/).forEach((line, i) => {
    const f = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
    if (f) {
      const ch = f[1][0], len = f[1].length;
      if (!fenceChar) { fenceChar = ch; fenceLen = len; return; }
      if (ch === fenceChar && len >= fenceLen) { fenceChar = null; fenceLen = 0; return; }
    }
    if (fenceChar) return;
    const m = line.match(/^(#{1,6})[ \t]+(.*\S)[ \t]*$/);
    if (!m) return;
    const text = m[2].trim();
    const num = text.match(/^(\d+(?:\.\d+)*)[.、]?[ \t]/);
    heads.push({ level: m[1].length, text, key: num ? num[1] : text, line: i + 1 });
  });
  const byLevel = new Map();
  heads.forEach((h) => byLevel.set(h.level, (byLevel.get(h.level) || 0) + 1));
  const levels = [...byLevel.keys()].sort((a, b) => a - b);
  const sectionLevel = levels.find((l) => byLevel.get(l) >= 2) ?? levels[0] ?? null;
  return {
    heads,
    sectionLevel,
    top: heads.filter((h) => h.level === sectionLevel).map((h) => h.key),
    all: heads.map((h) => h.key),
  };
}

/** 兼容旧调用方直接传入 `{top, sub}`（测试用）。 */
function normalizeSections(input) {
  if (!input) return null;
  if (Array.isArray(input.heads) || Array.isArray(input.all)) {
    return { heads: input.heads || [], sectionLevel: input.sectionLevel ?? null, top: input.top || [], all: input.all || [] };
  }
  const top = input.top || [], sub = input.sub || [];
  return { heads: [], sectionLevel: null, top, all: [...top, ...sub] };
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
  const skipped = [];
  if (!isSection) {
    if (plan) {
      validUnits = new Set(plan.sourceUnits.map((u) => u.id));
      universe = plan.sourceUnits.map((u) => u.id);
      allBlocks = plan.blocks;
      blockById = new Map(allBlocks.map((b) => [b.id, b]));
    } else {
      skipped.push('引用可解析性与 N2 / N3（sourceUnit 粒度但未提供 --plan）');
      warn.push('W0 未提供 --plan → 无法建立 sourceUnit 全集，跳过引用解析与 N2 / N3 导航校验，避免误报 HARD');
    }
  } else {
    sec = normalizeSections(opts.docSections) || readDocHeadings(map.document.sourcePath);
    if (!sec.top.length) {
      // 原文一个 heading 都解析不出来（或只有文档大标题）→ 无法建立"位置全集"。
      // 此时**不能**把每个引用都判成悬空引用 —— 那会把格式差异误报成契约违反。
      sectionUnresolved = true;
      skipped.push('引用可解析性与 N2 / N3（原文小节无法解析）');
      warn.push('W0 无法从原文解析出小节标题（doc 可能没有 Markdown heading）→ 跳过 section 粒度的引用 / 导航校验，避免误报 HARD');
    } else {
      validUnits = new Set(sec.all.map((n) => '§' + n));
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

  // ── H4 edge 表外词 / H8 qualifier 形态 / H3 edge 端点 ────
  const unknownQualifierValues = new Set();
  edges.forEach((ed, i) => {
    const tag = ed.id || `edges[${i}]`;
    if (!RELATION_ENUM.includes(ed.type)) hard.push(`H4 ${tag} relation "${ed.type}" 是表外词（要表达词表之外的关系请用 relationGap）`);
    if (!byId.has(ed.from)) hard.push(`H3 ${tag} from="${ed.from}" 不存在`);
    if (!byId.has(ed.to)) hard.push(`H3 ${tag} to="${ed.to}" 不存在`);

    // qualifiers 是**结构属性**，不是第三层词表。形态错 = HARD；取值未知 = WARNING。
    const q = ed.qualifiers;
    if (q !== undefined) {
      if (q === null || typeof q !== 'object' || Array.isArray(q)) {
        hard.push(`H8 ${tag} qualifiers 必须是对象`);
      } else {
        Object.keys(q).forEach((k) => {
          if (!QUALIFIER_KEYS.includes(k)) hard.push(`H8 ${tag} qualifiers.${k} 不是已知的结构属性（只允许 ${QUALIFIER_KEYS.join(' / ')}）`);
        });
        const c = q.cardinality;
        if (c !== undefined) {
          if (c === null || typeof c !== 'object' || Array.isArray(c)) {
            hard.push(`H8 ${tag} qualifiers.cardinality 必须是 {from,to} 对象`);
          } else {
            ['from', 'to'].forEach((side) => {
              if (c[side] === undefined) hard.push(`H8 ${tag} qualifiers.cardinality 缺少 ${side} 端`);
              else if (!CARDINALITY_ENUM.includes(c[side])) unknownQualifierValues.add(`${tag}.cardinality.${side}=${c[side]}`);
            });
            Object.keys(c).forEach((k) => {
              if (k !== 'from' && k !== 'to') hard.push(`H8 ${tag} qualifiers.cardinality.${k} 不是已知字段（只允许 from / to）`);
            });
          }
        }
        const o = q.ownership;
        if (o !== undefined) {
          if (typeof o !== 'string' || !o) hard.push(`H8 ${tag} qualifiers.ownership 必须是非空字符串`);
          else if (!OWNERSHIP_KNOWN.includes(o)) unknownQualifierValues.add(`${tag}.ownership=${o}`);
        }
      }
    }
  });
  if (unknownQualifierValues.size) {
    warn.push(`W7 qualifier 取值未知（controlled-but-extensible，不判 Hard）: ${[...unknownQualifierValues].join(', ')}`);
  }
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

  // ── W3 topic 数 ─────────────────────────────────────────
  if (topics.length > 10) warn.push(`W3 Topic 数 ${topics.length} > 10`);

  // ── W5 relationGap：单条 vs 聚合 ────────────────────────
  // 单条 relationGap 是**正常**的登记行为，不需要在报告顶部刷 N 遍。
  // 只有当缺口密度高到说明"关系层整体不够用"时，才升成一条聚合 Warning。
  const representedRelations = edges.length;
  const gapDensity = gaps.length + representedRelations > 0
    ? gaps.length / (gaps.length + representedRelations)
    : 0;
  const densityFires = gaps.length >= GAP_DENSITY_MIN_COUNT && gapDensity >= GAP_DENSITY_MIN_RATIO;
  const gapDetails = gaps.map((g, i) =>
    `W5 relationGap[${i}] ${g.from} ⇢ ${g.to}：「${g.intendedMeaning}」（REVIEW REQUIRED —— 现有词表无法在不失真前提下表达）`);
  if (densityFires) {
    warn.push(`W8 关系缺口密度过高：relationGap ${gaps.length} / (relationGap ${gaps.length} + 已表达关系 ${representedRelations}) = ${gapDensity.toFixed(2)} ≥ ${GAP_DENSITY_MIN_RATIO}（且 ≥ ${GAP_DENSITY_MIN_COUNT} 条）`
      + ` —— 说明不是个别关系缺词，而是关系层需要补充结构属性（见 detail 段逐条明细）`);
  } else {
    gapDetails.forEach((m) => warn.push(m));
  }

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
  // I6（原 W4）：Topic 只挂一个 block / section —— 单点 Topic 是形态差异，不是缺陷
  topics.forEach((t) => {
    const nNav = (t.blockIds || []).length + (t.sectionRefs || []).length;
    if (nNav === 1) info.push(`I6 ${t.id} 只挂了一个 block / section（单点 Topic，形态差异）`);
  });

  return {
    hard, warn, info, granularity, skipped,
    // 聚合 Warning 命中时，逐条明细挪到 detail 段，不在顶部刷 N 遍
    relationGapDetails: densityFires ? gapDetails : [],
    // 状态必须区分 PASS 与 PASS WITH INCOMPLETE VALIDATION ——
    // 一旦 N1~N3 根本没执行，就不能让人误以为 Navigation invariant 已验证通过
    status: hard.length > 0 ? 'FAIL' : (skipped.length > 0 ? 'PASS WITH INCOMPLETE VALIDATION' : 'PASS'),
    stats: {
      elements: els.length, edges: edges.length, attachments: atts.length, topics: topics.length,
      relationGap: gaps.length, gapDensity: Number(gapDensity.toFixed(2)),
      universe: universe.length, unreachable: unreachable.length,
    },
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
  L.push(`stats         elements ${r.stats.elements} · edges ${r.stats.edges} · attachments ${r.stats.attachments} · topics ${r.stats.topics} · relationGap ${r.stats.relationGap} · gapDensity ${r.stats.gapDensity}`);
  L.push(`coverage      ${r.skipped.length ? 'SKIPPED（未执行，见 W0 与下方 skipped 段）' : `${r.stats.universe - r.stats.unreachable}/${r.stats.universe} 有路径（本粒度内）`}`);
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
  if (r.relationGapDetails.length) {
    L.push('');
    L.push(`RELATION GAP DETAIL (${r.relationGapDetails.length}) —— 已聚合为 W8，不再逐条占用 WARNING 名额`);
    r.relationGapDetails.forEach((m) => L.push('  · ' + m.replace(/^W5 /, '')));
  }
  L.push('');
  L.push(`SKIPPED (${r.skipped.length})`);
  r.skipped.forEach((m) => L.push('  – ' + m));
  if (!r.skipped.length) L.push('  （无 —— 本次全部检查都已执行）');
  L.push('');
  L.push('════════════════════════════════');
  L.push(`结果: HARD ${r.hard.length} · WARN ${r.warn.length} · INFO ${r.info.length}`);
  L.push(`状态: ${r.status}`);
  if (r.status === 'PASS WITH INCOMPLETE VALIDATION') {
    L.push('⚠️ 有检查未执行 —— **不得**据此认为 Navigation invariant 已验证通过。');
  }
  L.push('注: element budget / 单点 Topic / 某类元素为 0 / 无主轴 / DAG 是 Warning 或 Informational，不是语义缺陷。relationGap 少而散时逐条列 W5，多而密时聚合成一条 W8 + detail 段。');
  L.push('════════════════════════════════');
  console.log(L.join('\n'));
  process.exit(r.hard.length === 0 ? 0 : 1);
}

module.exports = {
  checkMap, readDocHeadings, TYPE_ENUM, RELATION_ENUM, KNOWN_ROLES, PREFERRED_ELEMENT_BUDGET,
  CARDINALITY_ENUM, QUALIFIER_KEYS, OWNERSHIP_KNOWN, GAP_DENSITY_MIN_COUNT, GAP_DENSITY_MIN_RATIO,
};

if (require.main === module) main();
