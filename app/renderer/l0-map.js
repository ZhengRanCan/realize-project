'use strict';

/**
 * Feature 08 · L0 Framework Map Renderer（deterministic）
 *
 * 输入 = `scripts/l0-view-model.js` 产出的 **view model**（已经是纯投影）。
 * 输出 = HTML 字符串（构建期 SSR）／DOM 挂载（Phase 3 Electron 复用同一份模块）。
 *
 * ## 设计原则（用户冻结）
 *   1. **Layout organizes space; it does not create semantics.**
 *      → 不做图布局。按 `element.type`（**契约字段**）分区，并在界面上显式标注"分组依据是 type，不是关系"。
 *        不把上下/左右/远近解释成 ownership / 顺序 / 依赖。
 *   2. 只有 `edge` / `attachment` / `qualifier` 是正式语义 —— 每条边都用一行文字显式写出 `A —type→ B`，
 *      方向不靠位置暗示；自环显式标注「自环」。
 *   3. `relationGap` / 校验告警只在 **Review View** 出现，并明确标注「不是 edge」。
 *   4. 不因 `>budget` 而隐藏节点；不因"没有主轴"造主轴；无 element 的 Topic 照样是导航入口。
 *   5. HTML 由 renderer 生成，AI 不参与。
 */

const TYPE_LABEL = {
  concept: 'concept', component: 'component', process: 'process',
  artifact: 'artifact', state: 'state', constraint: 'constraint',
};
const TYPE_ORDER = ['process', 'artifact', 'concept', 'state', 'constraint', 'component'];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;
const refChips = (refs) => (refs || []).map((r) => `<span class="ref">${esc(r)}</span>`).join('') || '<span class="muted">（无出处）</span>';

function qualifierLine(q) {
  if (!q) return '';
  const parts = [];
  if (q.cardinality) parts.push(`cardinality ${q.cardinality.from} → ${q.cardinality.to}`);
  if (q.ownership) parts.push(`ownership ${q.ownership}`);
  return parts.length ? `<span class="qual">${esc(parts.join(' · '))}</span>` : '';
}

/* ------------------------------------------------------------------ *
 * 区块渲染
 * ------------------------------------------------------------------ */
function renderElementCard(e, vm) {
  const topicChips = e.topics.map((t) => {
    const tp = vm.topics.find((x) => x.id === t);
    return `<a class="chip link" href="#topic-${esc(t)}" data-topic-id="${esc(t)}">${esc(tp ? tp.title : t)}</a>`;
  }).join('') || '<span class="muted">（无 Topic）</span>';

  const relRows = [
    ...e.outgoing.map((r) => `<li><span class="dir">出</span> <span class="eid">${esc(r.id || '')}</span> <span class="rel">—${esc(r.type)}→</span> <a href="#element-${esc(r.peer)}">${esc(r.peerLabel)}</a>${r.selfLoop ? '<span class="flag self">自环</span>' : ''}</li>`),
    ...e.incoming.map((r) => (r.selfLoop ? '' : `<li><span class="dir in">入</span> <span class="rel">←${esc(r.type)}—</span> <a href="#element-${esc(r.peer)}">${esc(r.peerLabel)}</a></li>`)),
  ].join('');

  const attachRows = [
    ...e.attachmentAsElement.map((a) => `<li><span class="dir">挂出</span> → ${a.hostLabels.map((l, i) => `<a href="#element-${esc(a.hosts[i])}">${esc(l)}</a>`).join(' · ')}</li>`),
    ...e.attachmentAsHost.map((a) => `<li><span class="dir in">挂靠</span> ← <a href="#element-${esc(a.elementId)}">${esc(a.elementLabel)}</a></li>`),
  ].join('');

  return `
<article class="card type-${esc(e.type)}" id="element-${esc(e.id)}" data-element-id="${esc(e.id)}">
  <header class="card-head">
    <span class="eid">${esc(e.id)}</span>
    <span class="card-label">${esc(e.label)}</span>
  </header>
  <div class="card-meta">
    ${chip(TYPE_LABEL[e.type] || e.type, 'type')}
    ${chip(`role: ${e.role}`, 'role')}
    ${chip(`topics: ${e.topics.length}`, 'topics')}
    ${chip(`出处: ${e.provenance.sectionRefs.length + e.provenance.sourceUnitIds.length}`, 'prov')}
  </div>
  <div class="card-row"><span class="k">Topic</span><span class="v">${topicChips}</span></div>
  <div class="card-row"><span class="k">出处</span><span class="v">${refChips([...e.provenance.sectionRefs, ...e.provenance.sourceUnitIds])}</span></div>
  ${relRows ? `<div class="card-row"><span class="k">关系</span><ul class="rel-list">${relRows}</ul></div>` : '<div class="card-row"><span class="k">关系</span><span class="v muted">（该元素不在任何 edge 上）</span></div>'}
  ${attachRows ? `<div class="card-row"><span class="k">侧挂</span><ul class="rel-list">${attachRows}</ul></div>` : ''}
</article>`;
}

function renderEdgeRow(ed) {
  return `
<li class="edge-row ${ed.selfLoop ? 'is-selfloop' : ''}" id="edge-${esc(ed.id || `${ed.from}-${ed.to}`)}" data-edge-id="${esc(ed.id || '')}" data-from="${esc(ed.from)}" data-to="${esc(ed.to)}">
  <span class="edge-line">
    <a class="node" href="#element-${esc(ed.from)}">${esc(ed.fromLabel)}</a>
    <span class="rel">—${esc(ed.type)}→</span>
    <a class="node" href="#element-${esc(ed.to)}">${esc(ed.toLabel)}</a>
    ${ed.selfLoop ? '<span class="flag self">自环（同一个元素）</span>' : ''}
  </span>
  <span class="edge-meta">
    ${ed.id ? `<span class="eid">${esc(ed.id)}</span>` : ''}
    ${qualifierLine(ed.qualifiers)}
    ${ed.label ? `<span class="elabel">${esc(ed.label)}</span>` : '<span class="muted">（无 label）</span>'}
  </span>
</li>`;
}

function renderAttachmentRow(a, vm) {
  const el = vm.elements.find((x) => x.id === a.elementId);
  return `
<li class="attach-row" id="attachment-${esc(a.elementId)}" data-attach-id="${esc(a.elementId)}">
  <a class="node" href="#element-${esc(a.elementId)}">${esc(a.elementLabel)}</a>
  <span class="rel">⇢ 挂到</span>
  ${a.hosts.map((h, i) => `<a class="node" href="#element-${esc(h)}">${esc(a.hostLabels[i])}</a>`).join(' · ')}
  <span class="edge-meta">${el ? chip(`type: ${el.type}`, 'type') : ''}</span>
</li>`;
}

function renderTopicEntry(t) {
  return `
<li class="topic-entry ${t.hasElements ? '' : 'no-element'}" id="topic-${esc(t.id)}" data-topic-id="${esc(t.id)}">
  <div class="topic-head">
    <span class="eid">${esc(t.id)}</span>
    <span class="topic-title">${esc(t.title)}</span>
    ${t.hasElements ? '' : '<span class="flag info">无 L0 element —— 仍是导航入口</span>'}
  </div>
  <div class="topic-prop">${esc(t.proposition)}</div>
  <div class="card-row"><span class="k">elements</span><span class="v">${t.elementIds.length ? t.elementIds.map((id, i) => `<a class="chip link" href="#element-${esc(id)}">${esc(t.elementLabels[i])}</a>`).join('') : '<span class="muted">（该 Topic 没有 L0 element）</span>'}</span></div>
  <div class="card-row"><span class="k">出处</span><span class="v">${refChips(t.sectionRefs)}${t.blockIds.length ? `<span class="muted">· L2 blocks: ${esc(t.blockIds.join(', '))}</span>` : ''}</span></div>
</li>`;
}

function renderReview(vm) {
  const r = vm.review;
  const c = r.checkMap;
  const gapRows = r.relationGap.map((g) => `
<li class="gap-row">
  <span class="gap-line">${esc(g.fromLabel)} <span class="rel">⇢</span> ${esc(g.toLabel)}</span>
  <span class="flag warn">relationGap（不是 edge）</span>
  <div class="gap-why">${esc(g.intendedMeaning)}</div>
  <div class="gap-reason muted">${esc(g.reason)}</div>
</li>`).join('') || '<li class="muted">（无 relationGap）</li>';
  return `
<section class="review" id="review">
  <h2>Review View · 审阅信息</h2>
  <p class="note">这些是审阅信息，<b>不是</b>图上的语义。relationGap 不是 edge；告警不影响渲染。</p>
  <div class="review-grid">
    <div class="review-box">
      <h3>check-map 结论${c ? '' : '（未提供）'}</h3>
      ${c ? `<div class="review-facts">HARD ${c.hard} · WARN ${c.warn} · INFO ${c.info} · 状态 ${esc(c.status || '')}</div>
      ${c.hardLines.length ? `<div class="diag hard"><b>HARD</b><ul>${c.hardLines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
      ${c.warnLines.length ? `<div class="diag warn"><b>WARN</b><ul>${c.warnLines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
      ${c.skipped.length ? `<div class="diag hard"><b>SKIPPED</b><ul>${c.skipped.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}` : '<div class="muted">未提供 check-map.txt —— 不猜测</div>'}
    </div>
    <div class="review-box">
      <h3>relationGap（${r.relationGap.length}）</h3>
      <ul class="gap-list">${gapRows}</ul>
    </div>
    <div class="review-box">
      <h3>诊断</h3>
      <ul>
        <li>role 未知：${r.unknownRoles.length ? r.unknownRoles.map((x) => esc(`${x.id}=${x.role}`)).join(', ') : '无'}</li>
        <li>无 provenance 的 element：${r.elementsWithoutProvenance.length ? esc(r.elementsWithoutProvenance.join(', ')) : '无'}</li>
        <li>无 sectionRefs 的 Topic：${r.topicsWithoutSectionRefs.length ? esc(r.topicsWithoutSectionRefs.join(', ')) : '无'}</li>
        <li>孤立元素：${vm.facts.isolatedElements.length ? esc(vm.facts.isolatedElements.join(', ')) : '无'}</li>
      </ul>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * 主渲染
 * ------------------------------------------------------------------ */
function renderL0MapHTML(vm, opts = {}) {
  const grouped = TYPE_ORDER.concat(vm.facts.elementTypes.filter((t) => !TYPE_ORDER.includes(t)))
    .map((t) => ({ type: t, items: vm.elements.filter((e) => e.type === t) }))
    .filter((g) => g.items.length);

  const f = vm.facts;
  return `
<div class="l0-root" data-view="${esc(opts.view || 'reading')}">
  <header class="l0-head">
    <div class="l0-title">
      <h1>${esc(vm.document.title)}</h1>
      <div class="l0-sub mono">${esc(vm.document.sourcePath)} · level L0 · ${esc(f.granularity)}${f.provisional ? ' ⚠️ provisional' : ''}</div>
    </div>
    <div class="l0-facts">
      <span class="fact">elements <b>${f.elementCount}</b>${f.overBudget ? ` <span class="flag warn">&gt; budget ${f.budget}（W1 · 只是 Warning，不裁剪）</span>` : ''}</span>
      <span class="fact">edges <b>${f.edgeCount}</b></span>
      <span class="fact">attachments <b>${f.attachmentCount}</b></span>
      <span class="fact">topics <b>${f.topicCount}</b></span>
      <span class="fact">relationGap <b>${f.relationGapCount}</b></span>
      ${f.selfLoopCount ? `<span class="fact">自环 <b>${f.selfLoopCount}</b></span>` : ''}
      <span class="fact">无 element 的 Topic <b>${f.topicsWithoutElements.length}</b></span>
    </div>
    <div class="l0-toggle" role="tablist">
      <button class="tab ${(opts.view || 'reading') === 'reading' ? 'active' : ''}" data-l0-view="reading">Reading View</button>
      <button class="tab ${opts.view === 'review' ? 'active' : ''}" data-l0-view="review">Review View</button>
    </div>
  </header>

  <p class="l0-principle">
    <b>Layout organizes space; it does not create semantics.</b>
    下面的分区依据是 <code>element.type</code>（契约字段），<b>不是</b>关系；
    唯一正式的语义是 <code>edge</code> / <code>attachment</code> / <code>qualifier</code> —— 每条边都在「关系」区显式写出方向。
  </p>

  <div class="l0-body">
    <main class="l0-main">
      <section class="block">
        <h2>核心结构（按 element.type 分区 · ${f.elementCount} 个）</h2>
        ${grouped.map((g) => `
          <div class="type-group">
            <div class="type-head">${esc(TYPE_LABEL[g.type] || g.type)} <span class="muted">×${g.items.length}</span></div>
            <div class="cards">${g.items.map((e) => renderElementCard(e, vm)).join('')}</div>
          </div>`).join('')}
      </section>

      <section class="block" id="relations">
        <h2>关系（edge · ${f.edgeCount} 条${f.selfLoopCount ? ` · 含 ${f.selfLoopCount} 条自环` : ''}）</h2>
        <ul class="edge-list">${vm.edges.map(renderEdgeRow).join('') || '<li class="muted">（这份 map 没有任何 edge —— 没有主轴就没有主轴，不造）</li>'}</ul>
      </section>

      <section class="block" id="attachments">
        <h2>侧挂 / 约束（attachments · ${f.attachmentCount} 条）</h2>
        <ul class="attach-list">${vm.attachments.map((a) => renderAttachmentRow(a, vm)).join('') || '<li class="muted">（无 attachment）</li>'}</ul>
      </section>

      <div class="review-slot">${opts.includeReview === false ? '' : renderReview(vm)}</div>
    </main>

    <aside class="l0-nav" id="topic-nav">
      <h2>Topic Navigation（完整入口索引 · ${f.topicCount}）</h2>
      <p class="note">这里与左侧不是一一对应的：左边是<b>核心机制</b>，这里是<b>完整入口</b>。没有 L0 element 的 Topic 也照样能进入。</p>
      <ul class="topic-list">${vm.topics.map(renderTopicEntry).join('')}</ul>
      <div class="doc-entries">
        <h3>文档级入口</h3>
        ${vm.document.entries.map((d) => `<div class="doc-entry"><span class="k">${esc(d.key)}</span><div>${esc(d.text)}</div><div class="v">${refChips(d.sectionRefs.concat(d.sourceUnitIds))}</div></div>`).join('') || '<div class="muted">（无）</div>'}
      </div>
    </aside>
  </div>
</div>`;
}

/* 双模：Node（构建期 SSR）与浏览器（Phase 3 Electron） */
if (typeof module !== 'undefined' && module.exports) module.exports = { renderL0MapHTML };
if (typeof window !== 'undefined') {
  window.L0Map = {
    renderL0MapHTML,
    mount(root, vm, opts) { root.innerHTML = renderL0MapHTML(vm, opts); },
  };
}
