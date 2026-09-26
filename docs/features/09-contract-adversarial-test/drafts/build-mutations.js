/**
 * Feature 09 · Task 4：mutation / adversarial test（可复现）
 *
 * A/B/C 只证明了「正确产物没有被大量误报」；本脚本证明「错误产物会被拦住」。
 *
 * 用法: node docs/features/09-contract-adversarial-test/drafts/build-mutations.js
 * 产出: ../results/mutation-output.txt
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const { checkMap } = require(path.join(ROOT, 'scripts', 'check-map.js'));

const FIXTURES = [
  { key: 'D', file: path.join(__dirname, 'fixture-d.map.json') },
  { key: 'E', file: path.join(__dirname, 'fixture-e.map.json') },
];

const clone = (o) => JSON.parse(JSON.stringify(o));

/** 每个 mutation：改完 → 跑 checkMap → 看期望的 code 有没有出现在对应级别里 */
const MUTATIONS = [
  {
    id: 'M1', name: '删除 provenance', expect: 'H2', level: 'hard',
    apply(m) { delete m.elements[0].sectionRefs; delete m.elements[0].sourceUnitIds; },
  },
  {
    id: 'M2', name: 'element type 改成第 7 类', expect: 'H1', level: 'hard',
    apply(m) { m.elements[0].type = 'entity'; },
  },
  {
    id: 'M3', name: 'edge 使用表外 relation', expect: 'H4', level: 'hard',
    apply(m) { m.edges[0].type = 'conforms-to'; },
  },
  {
    id: 'M4', name: '制造 dangling reference', expect: 'H3', level: 'hard',
    apply(m) { m.edges[0].to = 'E-99'; },
  },
  {
    id: 'M5', name: '塞一个孤立 element', expect: 'H7', level: 'hard',
    apply(m) {
      m.elements.push({ id: 'E-90', label: '孤立节点', type: 'artifact', role: 'intermediate', topics: [m.topics[0].id], sectionRefs: ['§1'] });
    },
  },
  {
    // M6 修正：必须挑「没有 element」的 Topic —— 有 element 的 Topic 清空 sectionRefs 并不违反 N1
    id: 'M6', name: '删除某 Topic（无 element）的导航入口', expect: 'H5', level: 'hard',
    apply(m) {
      const t = m.topics.find((x) => (x.sectionRefs || x.blockIds || []).length > 0
        && !m.elements.some((e) => (e.topics || []).includes(x.id)));
      if (!t) throw new Error('本 fixture 没有"无 element 的 Topic"，M6 不适用');
      delete t.sectionRefs; delete t.blockIds;
    },
  },
  {
    // M8：让某个顶层小节彻底失去入口 → 只应触发 N2（N1 不受影响）
    id: 'M8', name: '让某一顶层小节失去所有入口', expect: 'H5', level: 'hard',
    apply(m) {
      // 找一个「只被某个有 element 的 Topic 引用」的顶层小节（数字或词形标题都算）
      const count = {};
      m.topics.forEach((t) => (t.sectionRefs || []).forEach((s) => {
        if (!s.includes('.')) count[s] = (count[s] || 0) + 1;   // 无 "." = 顶层
      }));
      const uniq = Object.keys(count).filter((s) => count[s] === 1);
      for (const s of uniq) {
        const t = m.topics.find((x) => (x.sectionRefs || []).includes(s)
          && m.elements.some((e) => (e.topics || []).includes(x.id)));
        if (t) { t.sectionRefs = t.sectionRefs.filter((x) => x !== s); return; }
      }
      throw new Error('找不到可孤立的顶层小节，M8 不适用');
    },
  },
  {
    id: 'M7', name: '强行串联两个无关节点', expect: null, level: null,
    apply(m) {
      // 找一个原本没有边相连的组合，硬加一条 produces
      const ids = m.elements.map((e) => e.id);
      const linked = new Set(m.edges.flatMap((e) => [e.from + '>' + e.to]));
      outer: for (const a of ids) for (const b of ids) {
        if (a !== b && !linked.has(a + '>' + b) && !linked.has(b + '>' + a)) {
          m.edges.push({ from: a, to: b, type: 'produces' });
          break outer;
        }
      }
    },
  },
];

const lines = [];
lines.push('===== Feature 09 · Mutation / Adversarial Test =====');
lines.push('目的：证明「错误产物会被拦住」，而不只是「正确产物没被误报」。');
lines.push('');

let total = 0, blocked = 0, m7 = [];

for (const fx of FIXTURES) {
  const base = JSON.parse(fs.readFileSync(fx.file, 'utf8'));
  const baseRes = checkMap(base, {});
  lines.push(`─── Fixture ${fx.key} ───`);
  lines.push(`基线: HARD ${baseRes.hard.length} · WARN ${baseRes.warn.length} · INFO ${baseRes.info.length} · 状态 ${baseRes.status}`);
  lines.push('');
  lines.push('| Mutation | 期望 | 实际 | 结果 |');
  lines.push('|---|---|---|---|');

  for (const mu of MUTATIONS) {
    const m = clone(base);
    let skip = null;
    try { mu.apply(m); } catch (e) { skip = e.message; }
    if (skip) { lines.push(`| ${mu.id} ${mu.name} | — | 不适用 | ⏭ ${skip} |`); continue; }
    const r = checkMap(m, {});
    const got = (arr) => arr.filter((x) => x.includes(mu.expect ? mu.expect : '')).length;

    if (mu.expect) {
      total++;
      const hit = got(r.hard) > 0;                       // 期望 HARD
      if (hit) blocked++;
      const actual = hit ? `HARD (${mu.expect})` : (r.hard.length ? `HARD(${r.hard.join(' / ')})` : '未被拦住');
      lines.push(`| ${mu.id} ${mu.name} | HARD ${mu.expect} | ${actual} | ${hit ? '✅ 拦住' : '❌ 漏网'} |`);
    } else {
      // M7：validator 判不出来是**预期**的
      const changed = r.hard.length !== baseRes.hard.length || r.warn.length !== baseRes.warn.length;
      m7.push({ fx: fx.key, changed, hard: r.hard.length, warn: r.warn.length });
      lines.push(`| ${mu.id} ${mu.name} | 判不出来（人工审计项） | HARD ${r.hard.length} · WARN ${r.warn.length} | ${changed ? '⚠️ 意外触发' : '✅ 如预期未被检测'} |`);
    }
  }
  lines.push('');
}

lines.push('════════════════════════════════');
lines.push(`拦截率: ${blocked}/${total} = ${total ? Math.round((blocked / total) * 100) : 0}%`);
lines.push('M7（强行串联无关节点）：validator 判不出来是**设计如此** —— 它属 semantic rule，不是 schema rule。');
lines.push(`M7 记录: ${JSON.stringify(m7)}`);
lines.push('════════════════════════════════');

const text = lines.join('\n');
console.log(text);
const outDir = path.join(__dirname, '..', 'results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'mutation-output.txt'), text + '\n', 'utf8');
