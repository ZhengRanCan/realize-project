/**
 * Feature 04 一次性构建脚本：把 context-consumption.map.json 渲染成静态验证页。
 *
 * 这不是产品代码 —— 产品渲染在 Feature 08 里做（新增 content.type: map）。
 * 本脚本只用于 Phase 1 的人眼验证与 Track A 对照，产物是 drafts/l0-preview.html。
 *
 * 用法：node docs/features/04-l0-framework-map/drafts/build-l0-preview.js
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const MAP = path.join(HERE, 'context-consumption.map.json');
const PLAN = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const OUT = path.join(HERE, 'l0-preview.html');

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
const unitById = new Map(plan.sourceUnits.map((u) => [u.id, u]));

// 「提到它的 blocks」：block 的 covers 与该元素的 sourceUnitIds 有交集。
// 这是 Feature 04 为 L3 定义的内容之一（03 §2：元素在原文里的定义 + 提到它的 blocks）。
// 用现有的 21 个 block 作为 L2 占位 —— 只为验证交互，不改变它们的切法（Feature 07 会重新生成 L2）。
const BLOCKS = plan.blocks.map((b) => ({ id: b.id, title: b.title, shape: b.shape, covers: b.covers || [] }));
const blocksOf = (unitIds) => {
  const set = new Set(unitIds);
  return BLOCKS.filter((b) => b.covers.some((u) => set.has(u)));
};
const BASE_PREVIEW = '../../../experiments/stage2-full/overview-preview.html';

const el = (id) => map.elements.find((e) => e.id === id);
const TYPE_LABEL = {
  concept: 'concept', component: 'component', process: 'process',
  artifact: 'artifact', state: 'state', constraint: 'constraint',
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 每个元素参与的关系，用于 L3 详情
const relOf = (id) => {
  const out = [];
  map.edges.forEach((e) => {
    if (e.from === id) out.push(`—${e.type}→ ${el(e.to).label}`);
    if (e.to === id) out.push(`${el(e.from).label} —${e.type}→`);
  });
  map.attachments.forEach((a) => {
    if (a.elementId === id) out.push(`侧挂 → ${a.attachedTo.map((t) => el(t).label).join(' / ')}`);
    if ((a.attachedTo || []).includes(id)) out.push(`被 ${el(a.elementId).label} 侧挂`);
  });
  return out;
};

function card(id, cls = '') {
  const e = el(id);
  const att = map.attachments.find((a) => a.elementId === e.id);
  const attLine = att
    ? `<span class="attach">挂到：${att.attachedTo.map((t) => el(t).label).join(' · ')}</span>`
    : '';
  return `<button class="card t-${e.type} ${cls}" data-el="${e.id}">
  <span class="label">${esc(e.label)}</span>
  <span class="badges"><i class="type t-${e.type}">${TYPE_LABEL[e.type]}</i><i class="role">${e.role}</i></span>
  ${attLine}
  <span class="topics">${(e.topics || []).map((t) => `<i class="tp">${t}</i>`).join('')}</span>
</button>`;
}

const SPINE = ['E-01', 'E-02', 'E-03', 'E-04', 'E-05'];
const edgeLabel = (from, to) => {
  const e = map.edges.find((x) => x.from === from && x.to === to);
  return e ? e.type : '';
};

// 每一行的左右侧挂。注意：一个侧挂元素只渲染一次（否则视觉上会变成"同一概念两个节点"）。
// E-09 挂到 E-04 与 E-05 两个节点，只在 E-05 行渲染一次，卡片上用「挂到」标注它的全部挂点。
const LEFT = { 'E-01': 'E-06', 'E-02': 'E-07', 'E-03': 'E-08' };
const RIGHT = { 'E-05': 'E-09' };

const spineRows = SPINE.map((id, i) => {
  const left = LEFT[id] ? card(LEFT[id], 'side') : '<div class="slot"></div>';
  const right = RIGHT[id] ? card(RIGHT[id], 'side') : '<div class="slot"></div>';
  let arrow = '';
  if (i < SPINE.length - 1) {
    const next = SPINE[i + 1];
    const fwd = edgeLabel(id, next);
    const back = edgeLabel(next, id);
    const lbl = fwd || back || '';
    const dir = fwd ? 'down' : 'up';
    arrow = `<div class="arrow ${dir}"><span class="line"></span><span class="elabel">${lbl}</span></div>`;
  }
  return `<div class="row">
    <div class="col-left">${left}</div>
    <div class="col-mid">${card(id)}${arrow}</div>
    <div class="col-right">${right}</div>
  </div>`;
}).join('\n');

const constraints = map.elements.filter((e) => e.type === 'constraint')
  .map((e) => `<button class="card t-constraint cons" data-el="${e.id}">
    <span class="label">⚠ ${esc(e.label)}</span>
    <span class="badges"><i class="type t-constraint">constraint</i><i class="role">${e.role}</i></span>
    <span class="attach">挂到：${map.attachments.find((a) => a.elementId === e.id).attachedTo.map((t) => el(t).label).join(' · ')}</span>
  </button>`).join('\n');

const topicRail = map.topics.map((t) => {
  const ids = map.elements.filter((e) => (e.topics || []).includes(t.id)).map((e) => e.id);
  const tb = (t.blockIds || []).map((id) => BLOCKS.find((b) => b.id === id)).filter(Boolean);
  return `<div class="topic">
    <div class="tt">${esc(t.title)}</div>
    <div class="tp-body">${esc(t.proposition)}</div>
    <div class="tchips">${ids.map((i) => `<i data-jump="${i}">${i}</i>`).join('')}<span class="tcount">${ids.length} elements</span></div>
    <div class="tblocks">下钻 L2（${tb.length}）：${tb.map((b) => `<a href="${BASE_PREVIEW}#block-${b.id}" target="_blank" title="${esc(b.title)}">${b.id}</a>`).join(' ')}</div>
  </div>`;
}).join('\n');

const detailData = map.elements.map((e) => ({
  id: e.id,
  label: e.label,
  type: e.type,
  role: e.role,
  topics: e.topics,
  rel: relOf(e.id),
  blocks: blocksOf(e.sourceUnitIds || []).map((b) => ({ id: b.id, title: b.title, shape: b.shape })),
  units: (e.sourceUnitIds || []).map((u) => ({ id: u, section: unitById.get(u).section, kind: unitById.get(u).kind, statement: unitById.get(u).statement })),
}));

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>L0 Framework Map · ${esc(map.document.title)}</title>
<style>
  :root { --ink:#111; --line:#d8d8d8; --mut:#6b6b6b; --bg:#fff;
    --artifact:#eef4ff; --process:#eefbf1; --state:#fff8e8; --concept:#f6eefe; --constraint:#fdeeee; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font: 14px/1.6 -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif; }
  header { padding:20px 28px 14px; border-bottom:1px solid var(--line); }
  h1 { margin:0 0 6px; font-size:20px; }
  .thesis { margin:0; color:#222; max-width:900px; }
  .scope { margin:5px 0 0; color:#333; font-size:13px; max-width:900px; }
  .scope i { color:var(--mut); font-style:normal; }
  .stats { margin-top:8px; color:var(--mut); font-size:12px; }
  .layout { display:grid; grid-template-columns: 1fr 320px; gap:0; }
  main { padding:22px 28px 60px; }
  .band-title { font-size:12px; letter-spacing:.08em; color:var(--mut); text-transform:uppercase; margin:0 0 10px; }
  .row { display:grid; grid-template-columns: 190px 1fr 190px; align-items:start; gap:10px; }
  .col-mid { display:flex; flex-direction:column; align-items:center; }
  .slot { min-height:1px; }
  .card { display:flex; flex-direction:column; gap:3px; width:100%; text-align:left;
    background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:9px 11px;
    font:inherit; color:inherit; cursor:pointer; }
  .card:hover { border-color:#111; }
  .card .label { font-weight:600; }
  .card.t-artifact { background:var(--artifact); }
  .card.t-process { background:var(--process); }
  .card.t-state { background:var(--state); }
  .card.t-concept { background:var(--concept); }
  .card.t-constraint { background:var(--constraint); border-style:dashed; }
  .badges { display:flex; gap:6px; flex-wrap:wrap; }
  .badges i { font-style:normal; font-size:11px; padding:1px 6px; border-radius:999px; border:1px solid var(--line); background:#fff; }
  .badges i.type { font-weight:600; }
  .topics { display:flex; gap:6px; flex-wrap:wrap; }
  .tp { font-style:normal; font-size:11px; color:var(--mut); }
  .attach { font-size:11.5px; color:#444; }
  .col-mid .card { max-width:420px; }
  .arrow { display:flex; flex-direction:column; align-items:center; height:46px; color:var(--mut); }
  .arrow .line { width:2px; flex:1; background:#bbb; }
  .arrow.up .line { background:repeating-linear-gradient(#bbb 0 4px, transparent 4px 8px); }
  .arrow .elabel { font-size:11px; padding:2px 0; color:#555; }
  .constraints { margin-top:34px; }
  .cons-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:10px; }
  aside { border-left:1px solid var(--line); padding:22px 20px 60px; background:#fcfcfc; }
  .topic { border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin-bottom:10px; background:#fff; }
  .tt { font-weight:600; }
  .tp-body { color:#333; margin:4px 0 7px; font-size:13px; }
  .tchips { display:flex; gap:5px; flex-wrap:wrap; align-items:center; }
  .tchips i { font-style:normal; font-size:11px; border:1px solid var(--line); border-radius:999px;
    padding:1px 6px; cursor:pointer; background:#fff; }
  .tchips i:hover { border-color:#111; }
  .tcount { font-size:11px; color:var(--mut); margin-left:2px; }
  .tblocks { margin-top:6px; font-size:11.5px; color:var(--mut); }
  .tblocks a { color:#1a4fd6; text-decoration:none; }
  .tblocks a:hover { text-decoration:underline; }
  a.blk { display:block; padding:4px 0; color:#1a4fd6; text-decoration:none; font-size:13px; }
  a.blk i { color:var(--mut); font-style:normal; font-size:11px; }
  .legend { margin-top:16px; font-size:12px; color:var(--mut); }
  .legend div { display:flex; align-items:center; gap:7px; margin-bottom:4px; }
  .sw { width:12px; height:12px; border:1px solid var(--line); border-radius:3px; }
  #detail { position:fixed; right:16px; bottom:16px; width:min(560px, 92vw); max-height:70vh; overflow:auto;
    background:#fff; border:1px solid #111; border-radius:12px; padding:16px 18px; display:none;
    box-shadow:0 12px 40px rgba(0,0,0,.18); }
  #detail h3 { margin:0 0 2px; font-size:16px; }
  #detail .meta { color:var(--mut); font-size:12px; margin-bottom:8px; }
  #detail ul { margin:6px 0 12px; padding-left:18px; }
  #detail .unit { border-top:1px solid var(--line); padding:8px 0; font-size:13px; }
  #detail .unit b { font-weight:600; }
  #detail .close { position:absolute; right:12px; top:10px; border:none; background:none; font-size:18px; cursor:pointer; }
  .hint { color:var(--mut); font-size:12px; margin-top:10px; }
</style>
</head>
<body>
<header>
  <h1>${esc(map.document.title)}</h1>
  <p class="thesis">${esc(map.thesis)}</p>
  <p class="scope"><b>范围</b>：${esc(map.document.scope.text)} <i>（document.scope · ${map.document.scope.sourceUnitIds.join(',')}）</i></p>
  <p class="scope"><b>非目标</b>：${esc(map.document.nonGoalSummary.text)} <i>（document.nonGoalSummary · ${map.document.nonGoalSummary.sourceUnitIds.join(',')}）</i></p>
  <div class="stats">${map.document.sourcePath} · role=${map.document.role} ·
    ${map.meta.elementCount} elements · ${map.meta.edgeCount} edges · ${map.meta.topicCount} topics ·
    静态验证页（Feature 04 一次性产物，非产品代码）</div>
</header>

<div class="layout">
  <main>
    <p class="band-title">Framework Map · 主轴</p>
    ${spineRows}
    <div class="constraints">
      <p class="band-title">边界与排除（侧挂）</p>
      <div class="cons-grid">
        ${constraints}
      </div>
    </div>
    <p class="hint">点任意元素查看 L3 详情（原文定义 + 参与的关系）。</p>
  </main>

  <aside>
    <p class="band-title">Topics</p>
    ${topicRail}
    <div class="legend">
      ${['artifact', 'process', 'concept', 'state', 'constraint'].map((t) => {
        const n = map.elements.filter((e) => e.type === t).length;
        if (!n) return '';
        const bg = { artifact: '#eef4ff', process: '#eefbf1', concept: '#f6eefe', state: '#fff8e8', constraint: '#fdeeee' }[t];
        return `<div><span class="sw" style="background:${bg}"></span>${t} × ${n}</div>`;
      }).join('\n      ')}
      <div style="margin-top:8px;color:#6b6b6b">六类是 allowed vocabulary，不是必须凑齐的 checklist（本篇 component = 0）。</div>
      <div style="margin-top:6px;color:#6b6b6b">文档级入口：标题 / thesis / 范围 / 非目标 不占用 Topic，也不占用 L0 element。</div>
    </div>
  </aside>
</div>

<div id="detail">
  <button class="close" onclick="document.getElementById('detail').style.display='none'">×</button>
  <h3 id="d-label"></h3>
  <div class="meta" id="d-meta"></div>
  <div><b>参与的关系</b><ul id="d-rel"></ul></div>
  <div><b>提到它的 blocks（L2，跳转到现有阅读视图）</b><div id="d-blocks"></div></div>
  <div><b>溯源（原文 sourceUnits）</b><div id="d-units"></div></div>
</div>

<script>
const DATA = ${JSON.stringify(detailData)};
document.addEventListener('click', (ev) => {
  const jump = ev.target.closest('[data-jump]');
  if (jump) { const c = document.querySelector('[data-el="' + jump.dataset.jump + '"]');
    if (c) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  const btn = ev.target.closest('[data-el]');
  if (!btn) return;
  const d = DATA.find((x) => x.id === btn.dataset.el);
  if (!d) return;
  document.getElementById('d-label').textContent = d.id + ' · ' + d.label;
  document.getElementById('d-meta').textContent =
    d.type + ' / ' + d.role + ' · topics: ' + d.topics.join(', ');
  document.getElementById('d-rel').innerHTML = d.rel.map((r) => '<li>' + r + '</li>').join('');
  document.getElementById('d-blocks').innerHTML = d.blocks.length
    ? d.blocks.map((b) => '<a class="blk" href="${BASE_PREVIEW}#block-' + b.id + '" target="_blank"><b>' + b.id + '</b> ' + b.title + ' <i>' + b.shape + '</i></a>').join('')
    : '<span style="color:#6b6b6b">（无）</span>';
  document.getElementById('d-units').innerHTML = d.units.map((u) =>
    '<div class="unit"><b>' + u.id + '</b> <span style="color:#6b6b6b">' + u.section + ' · ' + u.kind + '</span><br>' + u.statement + '</div>').join('');
  document.getElementById('detail').style.display = 'block';
});
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('wrote ' + path.relative(ROOT, OUT) + '  (' + (html.length / 1024).toFixed(1) + ' KB)');
console.log('elements rendered: ' + map.elements.length + ' · topics: ' + map.topics.length + ' · units embedded: ' + new Set(map.elements.flatMap((e) => e.sourceUnitIds)).size);
