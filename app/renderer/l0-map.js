'use strict';

/**
 * Feature 08 · L0 Framework Map Renderer（deterministic · SSR + 交互增强）
 *
 * 输入 = `scripts/l0-view-model.js` 产出的 **view model**（纯投影）。
 * 输出 = HTML 字符串（构建期 SSR）／`mount()`（Electron 复用同一份）。
 *
 * ## 设计原则（用户冻结）
 *   1. **Layout organizes space; it does not create semantics.**
 *      → 不做图布局；按 `element.type`（契约字段）分区，并在界面上显式声明"分组依据是 type，不是关系"。
 *   2. 只有 `edge` / `attachment` / `qualifier` 是正式语义 —— 每条边用一行 `A —type→ B` 显式写方向。
 *   3. `relationGap` / 校验告警只在 **Review View** 出现，并标注「不是 edge」。
 *   4. 不因 `>budget` 隐藏节点；不造主轴；无 element 的 Topic 照样是入口。
 *   5. **Reading 是默认视图**：第一眼回答"这篇设计在讲什么核心东西 / 我从哪里进去"；
 *      工程事实（element/edge/budget/warn）与审阅信息收进 Review View。**隐藏，不删数据。**
 *
 * ## 交互（Phase 4）：interaction-based graph reading（**不靠二维坐标**）
 *   点 element   → 高亮它 + 直接相邻的 edge / attachment，其余降噪；展开 **Focused Relations**
 *   点 edge      → 同时聚焦 from / to，并展开 qualifier 与两端 provenance
 *   点 topic     → 高亮其关联 L0 elements；无 element 时仍进入 Topic 内容
 *   点 provenance→ 交给宿主打开对应原文位置（`opts.onSourceRef`）
 *   清除选择     → 回到完整 Overview（按钮 / Esc）
 *   实现方式：所有焦点面板**预渲染**（可静态断言），交互只切换 class 与 hidden。
 */

const TYPE_LABEL = {
  concept: 'concept', component: 'component', process: 'process',
  artifact: 'artifact', state: 'state', constraint: 'constraint',
};
const TYPE_ORDER = ['process', 'artifact', 'concept', 'state', 'constraint', 'component'];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;

/** provenance chip：可点击 → 宿主打开原文位置（Electron 里接现有 Source 面板） */
const refChips = (refs, opts = {}) => {
  const list = (refs || []).filter(Boolean);
  if (!list.length) return '<span class="muted">（无出处）</span>';
  return list.map((r) => (opts.clickable === false
    ? `<span class="ref">${esc(r)}</span>`
    : `<button class="ref as-link" data-source-ref="${esc(r)}" title="打开原文位置">${esc(r)}</button>`)).join('');
};

function qualifierText(q) {
  if (!q) return null;
  const parts = [];
  if (q.cardinality) parts.push(`cardinality ${q.cardinality.from} → ${q.cardinality.to}`);
  if (q.ownership) parts.push(`ownership ${q.ownership}`);
  return parts.length ? parts.join(' · ') : null;
}
const qualifierLine = (q) => {
  const t = qualifierText(q);
  return t ? `<span class="qual">${esc(t)}</span>` : '';
};

/* ------------------------------------------------------------------ *
 * 元素卡片（含预渲染的 Focused Relations 面板）
 * ------------------------------------------------------------------ */
function renderElementCard(e, vm) {
  const topicChips = e.topics.map((t) => {
    const tp = vm.topics.find((x) => x.id === t);
    return `<button class="chip link" data-topic-focus="${esc(t)}">${esc(tp ? tp.title : t)}</button>`;
  }).join('') || '<span class="muted">（无 Topic）</span>';

  const outRows = e.outgoing.map((r) => `<li data-edge-ref="${esc(r.id || '')}"><span class="rel">—${esc(r.type)}→</span> <span class="node">${esc(r.peerLabel)}</span>${r.selfLoop ? '<span class="flag self">自环</span>' : ''}</li>`).join('');
  const inRows = e.incoming.map((r) => (r.selfLoop ? '' : `<li data-edge-ref="${esc(r.id || '')}"><span class="rel">←${esc(r.type)}—</span> <span class="node">${esc(r.peerLabel)}</span></li>`)).join('');
  const attRows = e.attachmentAsElement.map((a) => `<li><span class="rel">⇢ 挂到</span> ${a.hostLabels.map((l) => `<span class="node">${esc(l)}</span>`).join(' · ')}</li>`).join('')
    + e.attachmentAsHost.map((a) => `<li><span class="rel">⇐ 挂靠</span> <span class="node">${esc(a.elementLabel)}</span></li>`).join('');

  const focusPanel = `
<section class="focus-panel" data-focus-for="${esc(e.id)}" hidden>
  <header class="focus-head">
    <span class="focus-title">Focused Relations · <span class="eid">${esc(e.id)}</span> ${esc(e.label)}</span>
    <button class="btn tiny ghost" data-focus-clear="1">清除选择（Esc）</button>
  </header>
  <div class="focus-cols">
    <div class="focus-col"><h4>Incoming</h4><ul class="focus-list">${inRows || '<li class="muted">（无）</li>'}</ul></div>
    <div class="focus-col"><h4>Outgoing</h4><ul class="focus-list">${outRows || '<li class="muted">（无）</li>'}</ul></div>
    <div class="focus-col"><h4>Attached</h4><ul class="focus-list">${attRows || '<li class="muted">（无）</li>'}</ul></div>
    <div class="focus-col"><h4>Provenance</h4><div class="focus-prov">${refChips([...e.provenance.sectionRefs, ...e.provenance.sourceUnitIds])}</div></div>
  </div>
</section>`;

  return `
<article class="card type-${esc(e.type)}" id="element-${esc(e.id)}" data-element-id="${esc(e.id)}" data-focus-target="${esc(e.id)}" tabindex="0">
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
  ${(outRows || inRows) ? `<div class="card-row"><span class="k">关系</span><ul class="rel-list">${outRows}${inRows}</ul></div>` : '<div class="card-row"><span class="k">关系</span><span class="v muted">（该元素不在任何 edge 上）</span></div>'}
  ${attRows ? `<div class="card-row"><span class="k">侧挂</span><ul class="rel-list">${attRows}</ul></div>` : ''}
  ${focusPanel}
</article>`;
}

/* ------------------------------------------------------------------ *
 * 关系行 / 侧挂行 / Topic 条目
 * ------------------------------------------------------------------ */
function renderEdgeRow(ed, vm) {
  const endpoints = [ed.from, ed.to].filter((v, i, a) => a.indexOf(v) === i);
  const prov = endpoints.map((id) => {
    const el = vm.elements.find((x) => x.id === id);
    return el ? `<span class="prov-group"><span class="eid">${esc(id)}</span> ${refChips([...el.provenance.sectionRefs, ...el.provenance.sourceUnitIds])}</span>` : '';
  }).join('');
  return `
<li class="edge-row ${ed.selfLoop ? 'is-selfloop' : ''}" id="edge-${esc(ed.id || `${ed.from}-${ed.to}`)}" data-edge-id="${esc(ed.id || '')}" data-from="${esc(ed.from)}" data-to="${esc(ed.to)}" data-focus-edge="1">
  <span class="edge-line">
    <span class="node">${esc(ed.fromLabel)}</span>
    <span class="rel">—${esc(ed.type)}→</span>
    <span class="node">${esc(ed.toLabel)}</span>
    ${ed.selfLoop ? '<span class="flag self">自环（同一个元素）</span>' : ''}
  </span>
  <span class="edge-meta">
    ${ed.id ? `<span class="eid">${esc(ed.id)}</span>` : ''}
    ${qualifierLine(ed.qualifiers)}
    ${ed.label ? `<span class="elabel">${esc(ed.label)}</span>` : '<span class="muted">（无 label）</span>'}
  </span>
  <div class="edge-extra">
    ${qualifierText(ed.qualifiers) ? `<div class="edge-qual"><b>qualifiers</b> ${esc(qualifierText(ed.qualifiers))}</div>` : '<div class="edge-qual muted">（无 qualifiers）</div>'}
    <div class="edge-prov"><b>provenance</b> ${prov || '<span class="muted">（端点无出处）</span>'}</div>
  </div>
</li>`;
}

function renderAttachmentRow(a, vm) {
  const el = vm.elements.find((x) => x.id === a.elementId);
  return `
<li class="attach-row" id="attachment-${esc(a.elementId)}" data-attach-id="${esc(a.elementId)}" data-attach-element="${esc(a.elementId)}">
  <span class="node">${esc(a.elementLabel)}</span>
  <span class="rel">⇢ 挂到</span>
  ${a.hostLabels.map((l) => `<span class="node">${esc(l)}</span>`).join(' · ')}
  <span class="edge-meta">${el ? chip(`type: ${el.type}`, 'type') : ''}${el && el.provenance.sectionRefs.length ? refChips(el.provenance.sectionRefs) : ''}</span>
</li>`;
}

function renderTopicEntry(t) {
  return `
<li class="topic-entry ${t.hasElements ? '' : 'no-element'}" id="topic-${esc(t.id)}" data-topic-id="${esc(t.id)}" data-topic-focus="${esc(t.id)}" data-element-ids="${esc(t.elementIds.join(','))}">
  <div class="topic-head">
    <span class="eid">${esc(t.id)}</span>
    <span class="topic-title">${esc(t.title)}</span>
    ${t.hasElements ? '' : '<span class="flag info">无 L0 element —— 仍是导航入口</span>'}
  </div>
  <div class="topic-prop">${esc(t.proposition)}</div>
  <div class="card-row"><span class="k">elements</span><span class="v">${t.elementIds.length ? t.elementIds.map((id, i) => `<button class="chip link" data-focus-target="${esc(id)}">${esc(t.elementLabels[i])}</button>`).join('') : '<span class="muted">（该 Topic 没有 L0 element）</span>'}</span></div>
  <div class="card-row"><span class="k">出处</span><span class="v">${refChips(t.sectionRefs)}${t.blockIds.length ? `<span class="muted">· L2 blocks: ${esc(t.blockIds.join(', '))}</span>` : ''}</span></div>
</li>`;
}

/* ------------------------------------------------------------------ *
 * Review View（默认隐藏）
 * ------------------------------------------------------------------ */
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
  <p class="note">这些是**审阅信息**，<b>不是</b>图上的语义。relationGap 不是 edge；告警不影响渲染，也不裁剪任何节点。</p>

  <div class="review-facts">
    <span class="fact">elements <b>${vm.facts.elementCount}</b>${vm.facts.overBudget ? ` <span class="flag warn">&gt; budget ${vm.facts.budget}（W1 · 只是 Warning，不裁剪）</span>` : ''}</span>
    <span class="fact">edges <b>${vm.facts.edgeCount}</b></span>
    <span class="fact">attachments <b>${vm.facts.attachmentCount}</b></span>
    <span class="fact">topics <b>${vm.facts.topicCount}</b></span>
    <span class="fact">relationGap <b>${vm.facts.relationGapCount}</b></span>
    ${vm.facts.selfLoopCount ? `<span class="fact">自环 <b>${vm.facts.selfLoopCount}</b></span>` : ''}
    <span class="fact">无 element 的 Topic <b>${vm.facts.topicsWithoutElements.length}</b></span>
    <span class="fact">granularity <b>${esc(vm.facts.granularity)}</b></span>
  </div>

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
  const view = opts.view || 'reading'; // **默认 Reading**（用户裁决）
  const grouped = TYPE_ORDER.concat(vm.facts.elementTypes.filter((t) => !TYPE_ORDER.includes(t)))
    .map((t) => ({ type: t, items: vm.elements.filter((e) => e.type === t) }))
    .filter((g) => g.items.length);
  const f = vm.facts;

  const scope = (vm.document.entries.find((d) => d.key === 'scope') || {}).text || '';
  const nonGoal = (vm.document.entries.find((d) => d.key === 'nonGoalSummary') || {}).text || '';

  return `
<div class="l0-root" data-view="${esc(view)}">
  <header class="l0-head">
    <div class="l0-title">
      <h1>${esc(vm.document.title)}</h1>
      <div class="l0-sub mono">${esc(vm.document.sourcePath)} · L0 · role ${esc(vm.document.role || '-')}</div>
    </div>
    <div class="l0-toggle" role="tablist">
      <button class="tab ${view === 'reading' ? 'active' : ''}" data-l0-view="reading">Reading View</button>
      <button class="tab ${view === 'review' ? 'active' : ''}" data-l0-view="review">Review View</button>
      <button class="tab ghost" data-focus-clear="1">清除选择</button>
    </div>
  </header>

  ${scope ? `<div class="l0-scope"><span class="k">这是什么文档</span> ${esc(scope)}</div>` : ''}
  ${nonGoal ? `<details class="l0-nongoal"><summary>本文不做什么 / 边界</summary><div>${esc(nonGoal)}</div></details>` : ''}

  <p class="l0-principle">
    <b>Layout organizes space; it does not create semantics.</b>
    分区依据是 <code>element.type</code>（契约字段），<b>不是</b>关系；唯一正式的语义是
    <code>edge</code> / <code>attachment</code> / <code>qualifier</code> —— 每条边都在「关系」区显式写出方向。
    点任意元素 / 边 / Topic 可以聚焦并追关系。
  </p>

  <div class="l0-focus-slot" id="l0-focus-slot"></div>

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
        <ul class="edge-list">${vm.edges.map((e) => renderEdgeRow(e, vm)).join('') || '<li class="muted">（这份 map 没有任何 edge —— 没有主轴就没有主轴，不造）</li>'}</ul>
      </section>

      <section class="block" id="attachments">
        <h2>侧挂 / 约束（attachments · ${f.attachmentCount} 条）</h2>
        <ul class="attach-list">${vm.attachments.map((a) => renderAttachmentRow(a, vm)).join('') || '<li class="muted">（无 attachment）</li>'}</ul>
      </section>

      <div class="review-slot">${renderReview(vm)}</div>
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

/* ------------------------------------------------------------------ *
 * Phase 4 · 交互（selection / focus）—— 只切换 class 与 hidden，不改数据
 * ------------------------------------------------------------------ */
function bindInteractions(root, opts = {}) {
  if (!root || root.__l0Bound) return;
  root.__l0Bound = true;
  const clear = () => {
    root.classList.remove('has-focus', 'focus-element', 'focus-edge', 'focus-topic');
    root.querySelectorAll('[data-focus-for]').forEach((p) => { p.hidden = true; });
    root.querySelectorAll('.is-dim,.is-hit').forEach((n) => n.classList.remove('is-dim', 'is-hit'));
    const slot = root.querySelector('#l0-focus-slot');
    if (slot) slot.innerHTML = '';
    if (opts.onClear) opts.onClear();
  };
  const dimAll = () => root.querySelectorAll('.card,.edge-row,.attach-row,.topic-entry').forEach((n) => n.classList.add('is-dim'));
  const hit = (sel) => root.querySelectorAll(sel).forEach((n) => { n.classList.remove('is-dim'); n.classList.add('is-hit'); });

  function focusElement(id) {
    clear();
    root.classList.add('has-focus', 'focus-element');
    dimAll();
    const card = root.querySelector(`[data-focus-target="${id}"][data-element-id]`);
    const panel = root.querySelector(`[data-focus-for="${id}"]`);
    if (card) { card.classList.remove('is-dim'); card.classList.add('is-hit'); }
    if (panel) {
      panel.hidden = false;
      const slot = root.querySelector('#l0-focus-slot');
      if (slot) slot.innerHTML = panel.outerHTML.replace(' hidden', '').replace('<section class="focus-panel"', '<section class="focus-panel focus-inline"');
    }
    // 直接相邻：edge 端点 / attachment 两端 / 该元素所在的 topic
    root.querySelectorAll('.edge-row').forEach((r) => {
      if (r.dataset.from === id || r.dataset.to === id) { r.classList.remove('is-dim'); r.classList.add('is-hit'); }
    });
    root.querySelectorAll('.attach-row').forEach((r) => {
      if (r.dataset.attachElement === id) { r.classList.remove('is-dim'); r.classList.add('is-hit'); }
    });
    root.querySelectorAll('.topic-entry').forEach((r) => {
      if ((r.dataset.elementIds || '').split(',').includes(id)) { r.classList.remove('is-dim'); r.classList.add('is-hit'); }
    });
  }

  function focusEdge(row) {
    clear();
    root.classList.add('has-focus', 'focus-edge');
    dimAll();
    row.classList.remove('is-dim'); row.classList.add('is-hit');
    row.classList.add('is-open');
    [row.dataset.from, row.dataset.to].forEach((id) => {
      const card = root.querySelector(`[data-focus-target="${id}"][data-element-id]`);
      if (card) { card.classList.remove('is-dim'); card.classList.add('is-hit'); }
    });
  }

  function focusTopic(row) {
    clear();
    root.classList.add('has-focus', 'focus-topic');
    dimAll();
    row.classList.remove('is-dim'); row.classList.add('is-hit');
    (row.dataset.elementIds || '').split(',').filter(Boolean).forEach((id) => {
      const card = root.querySelector(`[data-focus-target="${id}"][data-element-id]`);
      if (card) { card.classList.remove('is-dim'); card.classList.add('is-hit'); }
    });
  }

  root.addEventListener('click', (ev) => {
    const src = ev.target.closest('[data-source-ref]');
    if (src) { ev.preventDefault(); if (opts.onSourceRef) opts.onSourceRef(src.getAttribute('data-source-ref')); else src.classList.add('is-hit'); return; }
    if (ev.target.closest('[data-focus-clear]')) { ev.preventDefault(); clear(); return; }
    const edgeRow = ev.target.closest('[data-focus-edge]');
    if (edgeRow) { ev.preventDefault(); focusEdge(edgeRow); return; }
    const topicRow = ev.target.closest('[data-topic-focus]');
    if (topicRow && !ev.target.closest('[data-focus-target][data-element-id]')) { ev.preventDefault(); focusTopic(topicRow); return; }
    const card = ev.target.closest('[data-focus-target][data-element-id]');
    if (card) { ev.preventDefault(); focusElement(card.getAttribute('data-focus-target')); return; }
    const chipEl = ev.target.closest('[data-focus-target]');
    if (chipEl) { ev.preventDefault(); focusElement(chipEl.getAttribute('data-focus-target')); }
  });

  root.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') clear(); });
}

/* 双模：Node（构建期 SSR）与浏览器（Electron / 预览） */
if (typeof module !== 'undefined' && module.exports) module.exports = { renderL0MapHTML, bindInteractions };
if (typeof window !== 'undefined') {
  window.L0Map = {
    renderL0MapHTML, bindInteractions,
    mount(root, vm, opts = {}) {
      root.innerHTML = renderL0MapHTML(vm, opts);
      bindInteractions(root, opts);
    },
  };
}
