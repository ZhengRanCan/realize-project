'use strict';

/**
 * Feature 08 · L0 Framework Map Renderer（deterministic · SSR + 交互增强）
 *
 * 输入 = `scripts/l0-view-model.js` 产出的 **view model**（纯投影）+ `l0-layout.js` 的坐标。
 * 输出 = HTML 字符串（构建期 SSR）／`mount()`（Electron 复用同一份）。
 *
 * ## Phase 4.1 · Relationship-first Reading View（用户 Track A Round 0 裁决）
 *
 * 用户作为第一位真实读者的原话是：「不能第一时间看清楚当前文档的架构」——
 * 旧版 Reading 是"按 type 分组的 card 集合 + 卡片内关系文字"，读者必须自己在脑中重建关系图。
 * 现在两个视图分工明确：
 *
 *   **Reading View（默认）= 关系优先**
 *     节点 = element，线 = edge（箭头直接画在节点之间），侧挂 = attachment/constraint（角标）。
 *     第一眼看到的是结构，不是卡片；点节点 / 线 / Topic 才下钻（Focused Relations 面板）。
 *     工程 metadata（机器 ID / type / role / 校验）**不在** Reading 出现 —— 它们不帮第一眼理解。
 *     约束不跟核心节点抢视觉重量：降级为 `⚑ N` 角标，展开才列出（仍是正式语义，只是低一级）。
 *
 *   **Review View = 审阅优先（旧版结构板原样保留）**
 *     按 `element.type` 分区看全部 element · 查 provenance · 查完整 edge 与 qualifier ·
 *     查 relationGap / validator warning · 查生成物有没有问题。
 *
 * ## 冻结原则（Phase 4.1 修正后的理解）
 *   「布局不能创造原数据没有的语义；但布局完全可以利用已有 edge 帮用户看懂语义。」
 *   → 允许自动图布局：节点 = elements，线 = edges，位置只用于减少交叉、提高可读性。
 *   → 不允许：因为两个节点摆得近就暗示它们相关。**语义来自线，不来自坐标。**
 *   → 没有 edge 就不画线；没有主轴就不发明主轴；自环就画自环。
 *
 * ## 交互：interaction-based graph reading
 *   点节点   → 高亮它 + 直接相连的线，其余降噪；展开 Focused Relations（Incoming/Outgoing/Attached/Provenance）
 *   点线     → 同时聚焦 from / to，并展开 qualifier 与两端 provenance
 *   点 Topic → 高亮其关联 elements；展开详情（proposition / elements / source）
 *   点 provenance → 交给宿主打开对应原文位置（`opts.onSourceRef`）
 *   清除选择 → 回到完整 Overview（按钮 / Esc）
 *   实现方式：所有焦点面板**预渲染**（可静态断言），交互只切换 class 与 hidden。
 */

const L0Layout = (typeof window !== 'undefined' && window.L0Layout)
  ? window.L0Layout
  : require('./l0-layout.js');

const TYPE_LABEL = {
  concept: 'concept', component: 'component', process: 'process',
  artifact: 'artifact', state: 'state', constraint: 'constraint',
};
const TYPE_ORDER = ['process', 'artifact', 'concept', 'state', 'constraint', 'component'];

/**
 * Phase 4.1 polish · Reading View 的**显示层**术语映射（纯 UI terminology）
 *
 * Contract 的 relation 词一个都没改：Review View 与数据里永远是 `consumes` / `produces`。
 * 这里只决定「第一眼看到的那个词」，目的是不让读者先学一套 ontology 才能看图。
 * 未知 relation 一律**原样显示**（不猜、不硬翻）。
 */
const REL_ZH = {
  consumes: '使用', produces: '产出', 'depends-on': '依赖', contains: '包含',
  validates: '校验', controls: '控制', constrains: '约束', 'transforms-to': '转换为',
  'relates-to': '关联',
};
const relZh = (t) => REL_ZH[t] || t;

/**
 * 副标题的显示收敛（纯显示，不改数据）：
 * 只有**平铺的标识符列表**才做"前两项 + 项数"压缩，其余一律按字符截断。
 * 判据（踩过坑）：
 *   · `、` 永远是分隔符；
 *   · `/` 只有在**两边都有空格**时才算分隔符 —— 否则像 `retryAfterSalesCompensation * / 10`
 *     这种 cron 表达式会被切成两项（这是真实被切坏过的例子）；
 *   · 含括号的（有嵌套结构）不做项数压缩，直接截断。
 * 措辞是「共 N 项」而不是「N 个函数」：数的是这个 label 里列了几项，
 * 不替生成物解释这些项是什么（那是生成侧的事，UI 不代它回答）。
 * 完整内容始终在节点的 hover / 详情里。
 */
function shortSubtitle(text) {
  const s = String(text == null ? '' : text).trim();
  if (s.length <= 34) return s;
  const nested = /[（(）)]/.test(s);
  if (!nested) {
    const items = s.split(/、|\s+\/\s+/).map((x) => x.trim()).filter(Boolean);
    if (items.length >= 4) return `${items.slice(0, 2).join('、')} … 共 ${items.length} 项`;
  }
  return s.slice(0, 33) + '…';
}

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
 * Reading View · Relationship-first graph（Phase 4.1）
 * ------------------------------------------------------------------ */

/** 焦点面板（预渲染在 Review 的卡片里；Reading 选中时拷进 #l0-focus-slot）
 *  中英双标签：Review 看原词（Incoming/Outgoing/Attached/Provenance），Reading 说人话。
 *  切换只靠 CSS，不复制面板、不加交互。 */
function renderFocusPanel(e) {
  const outRows = e.outgoing.filter(r=>r.type!=='relates-to').map((r) => `<li data-edge-ref="${esc(r.id || '')}"><span class="rel"><span class="rel-en">—${esc(r.type)}→</span><span class="rel-zh">${esc(relZh(r.type))} →</span></span> <span class="node">${esc(r.peerLabel)}</span>${r.selfLoop ? '<span class="flag self">自环</span>' : ''}</li>`).join('');
  const inRows = e.incoming.filter(r=>r.type!=='relates-to').map((r) => (r.selfLoop ? '' : `<li data-edge-ref="${esc(r.id || '')}"><span class="rel"><span class="rel-en">←${esc(r.type)}—</span><span class="rel-zh">← ${esc(relZh(r.type))}</span></span> <span class="node">${esc(r.peerLabel)}</span></li>`)).join('');
  const relatedRows=[...e.outgoing,...e.incoming.filter(r=>!r.selfLoop)].filter(r=>r.type==='relates-to').map(r=>`<li><span class="rel">— relates-to —</span> ${esc(r.peerLabel)}</li>`).join('');
  const attRows = e.attachmentAsElement.map((a) => `<li><span class="rel">⇢ 挂到</span> ${a.hostLabels.map((l) => `<span class="node">${esc(l)}</span>`).join(' · ')}</li>`).join('')
    + e.attachmentAsHost.map((a) => `<li><span class="rel">⇐ 挂靠</span> <span class="node">${esc(a.elementLabel)}</span></li>`).join('');
  return `
<section class="focus-panel" data-focus-for="${esc(e.id)}" hidden>
  <header class="focus-head">
    <span class="focus-title"><span class="lbl-en">Focused Relations</span><span class="lbl-zh">关联关系</span> · <span class="eid">${esc(e.id)}</span> ${esc(e.label)}</span>
    <button class="btn tiny ghost" data-focus-clear="1">清除选择（Esc）</button>
  </header>
  <div class="focus-cols">
    <div class="focus-col"><h4><span class="lbl-en">Incoming</span><span class="lbl-zh">来自</span></h4><ul class="focus-list">${inRows || '<li class="muted">（无）</li>'}</ul></div>
    <div class="focus-col"><h4><span class="lbl-en">Outgoing</span><span class="lbl-zh">指向</span></h4><ul class="focus-list">${outRows || '<li class="muted">（无）</li>'}</ul></div>
    ${relatedRows?`<div class="focus-col"><h4>关联（无方向）</h4><ul>${relatedRows}</ul></div>`:''}
    <div class="focus-col"><h4><span class="lbl-en">Attached</span><span class="lbl-zh">约束</span></h4><ul class="focus-list">${attRows || '<li class="muted">（无）</li>'}</ul></div>
    <div class="focus-col"><h4><span class="lbl-en">Provenance</span><span class="lbl-zh">出处</span></h4><div class="focus-prov">${refChips([...e.provenance.sectionRefs, ...e.provenance.sourceUnitIds])}</div></div>
  </div>
</section>`;
}

/** 一个节点：标题（1 行）+ 副标题（最多 2 行）+ 约束角标。**不显示机器 ID / type / role**。 */
function renderGraphNode(n, vm) {
  // 角标要能反向告诉交互"我挂靠在谁身上"，否则点约束时无法把宿主一起点亮
  const hostIdsOf = (id) => {
    const a = (vm.attachments || []).find((x) => x.elementId === id);
    return a ? (a.hosts || []).join(',') : '';
  };
  const badgeItems = n.badgeIds.map((id, i) => {
    const el = vm.elements.find((x) => x.id === id);
    const df = L0Layout.displayFields(el || { id, label: n.badgeLabels[i] });
    return `<li class="attach-item" data-element-id="${esc(id)}" data-host-ids="${esc(hostIdsOf(id))}" data-focus-target="${esc(id)}" title="${esc(n.badgeLabels[i] || '')}">⚑ ${esc(df.title)}</li>`;
  }).join('');
  const badgeBlock = n.badgeIds.length ? `
    <details class="node-attach" data-element-id="${esc(n.badgeIds[0])}" data-host-ids="${esc(hostIdsOf(n.badgeIds[0]))}" data-badge-only="1" data-focus-target="${esc(n.badgeIds[0])}">
      <summary title="展开看这些约束（它们仍是正式语义，只是视觉低一级）">⚑ <span class="attach-count">${n.badgeIds.length}</span> 条约束</summary>
      <ul class="attach-pop">${badgeItems}</ul>
    </details>` : '';
  return `
      <article class="l0-node type-${esc(n.type)}" data-element-id="${esc(n.id)}" data-focus-target="${esc(n.id)}" data-has-edges="${n.hasEdges ? '1' : '0'}" data-layer="${n.layer}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px" tabindex="0" role="button" aria-label="${esc(n.label)}" aria-pressed="false" title="${esc(n.label)}">
        <span class="node-glyph" data-glyph="${esc(n.type)}" title="${esc(L0Layout.TYPE_GLYPH_LABEL[n.type] || n.type)}">${esc(n.glyph)}</span>
        <h3 class="node-title" title="${esc(n.title)}">${esc(n.title)}</h3>
        ${n.subtitle ? `<p class="node-sub" title="${esc(n.subtitle)}">${esc(shortSubtitle(n.subtitle))}</p>` : ''}
        ${badgeBlock}
      </article>`;
}

/** 图的图例：只用 map 里真出现过的 type（不发明词汇） */
function renderLegend(vm) {
  const types = [...new Set(vm.elements.map((e) => e.type))];
  return types.map((t) => `<span class="legend-item"><span class="node-glyph" data-glyph="${esc(t)}">${esc(L0Layout.TYPE_GLYPH[t] || '·')}</span> ${esc(L0Layout.TYPE_GLYPH_LABEL[t] || t)}</span>`).join('');
}

function renderReading(vm, layout) {
  const noEdge = layout.edges.length === 0;
  const titleOf = new Map(layout.nodes.map((n) => [n.id, n.title]));
  const edgePaths = layout.edges.map((p) => `
          <path class="l0-edge kind-${esc(p.kind)}${p.selfLoop ? ' is-selfloop' : ''}" data-focus-edge="1" data-edge-id="${esc(p.id)}" data-edge-type="${esc(p.type)}" data-from="${esc(p.from)}" data-to="${esc(p.to)}" data-kind="${esc(p.kind)}" d="${esc(p.d)}"${p.type==='relates-to'?'':' marker-end="url(#l0-arrow)"'}><title>${esc(`${titleOf.get(p.from) || p.from} ${relZh(p.type)}${p.type==='relates-to'?'—':'→'} ${titleOf.get(p.to) || p.to}${p.label ? '：' + p.label : ''}`)}</title></path>`).join('');
  // 线标签：Reading 说人话（使用 / 产出 / 依赖…），原始 relation 词留在 data-edge-type 与 Review View
  const edgeLabels = layout.edges.map((p) => `
          <text class="l0-edge-label" x="${p.labelX}" y="${p.labelY}" text-anchor="middle" data-focus-edge="1" data-edge-id="${esc(p.id)}" data-edge-type="${esc(p.type)}" data-from="${esc(p.from)}" data-to="${esc(p.to)}">${esc(relZh(p.type))}${p.selfLoop ? ' ↺' : ''}</text>`).join('');
  const nodes = layout.nodes.map((n) => renderGraphNode(n, vm)).join('');
  const orphanNote = layout.orphanBand
    ? `<div class="l0-orphan-note" style="top:${layout.orphanBand.y}px">不在任何 edge 上（${layout.orphanBand.count}）</div>`
    : '';

  return `
  <section class="l0-reading" id="l0-reading">
    <div class="l0-graph-wrap">
      <div class="l0-graph" id="l0-graph" style="width:${layout.bounds.width}px;height:${layout.bounds.height}px">
        <svg class="l0-lines" width="${layout.bounds.width}" height="${layout.bounds.height}" viewBox="0 0 ${layout.bounds.width} ${layout.bounds.height}" aria-hidden="true">
          <defs>
            <marker id="l0-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"></path></marker>
            <marker id="l0-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"></path></marker>
          </defs>
          <g class="l0-edge-layer">${edgePaths}</g>
          <g class="l0-label-layer">${edgeLabels}</g>
        </svg>
        <div class="l0-nodes">${nodes}</div>
        ${orphanNote}
      </div>
    </div>
    ${noEdge ? '<p class="l0-no-edge">这份 map 没有任何 <code>edge</code> —— <b>没有主轴就不发明主轴</b>，所以这里不画任何线。</p>' : ''}
    <div class="l0-legend">${renderLegend(vm)}</div>
    <div class="l0-focus-slot" id="l0-focus-slot"></div>
  </section>`;
}

/** 顶部那段说明：属于"怎么读这张图"，默认折叠，不占第一屏 */
function renderHowTo() {
  return `
  <details class="l0-howto">
    <summary>ⓘ 如何阅读这张图</summary>
    <div class="howto-body">
      <p><b>Reading View 是关系优先的</b>：<b>节点 = element</b>，<b>线 = edge</b>（箭头就是方向），
        <code>⚑</code> = constraint / attachment（挂在宿主节点上）。</p>
      <p><b>Layout organizes space; it does not create semantics.</b>
        —— 修正后的理解：布局<b>不能</b>创造原数据没有的语义，但<b>可以</b>用已有的 edge 帮你看懂语义。
        位置只用来减少交叉；<b>语义来自线，不来自坐标</b>：没有 edge 就不画线，没有主轴就不发明主轴，自环就画自环。</p>
      <p>第一眼只给你骨架：<b>谁能从谁那里拿到什么</b>。完整标题／函数名／出处／机器 ID／type / role / 校验结论
        都在 <b>Review View</b>，或者点节点、点线之后在下面的详情里看。</p>
      <p class="mono">Reading View 的关系词是显示层翻译（使用 / 产出 / 依赖 …），
        Contract 与 Review View 永远保留原词（consumes / produces / depends-on …）。</p>
    </div>
  </details>`;
}

/* ------------------------------------------------------------------ *
 * Review View · 旧版结构板（Phase 4.1：整体移到 Review，代码复用不删）
 * ------------------------------------------------------------------ */
function renderElementCard(e, vm) {
  const topicChips = e.topics.map((t) => {
    const tp = vm.topics.find((x) => x.id === t);
    return `<button class="chip link" data-topic-focus="${esc(t)}">${esc(tp ? tp.title : t)}</button>`;
  }).join('') || '<span class="muted">（无 Topic）</span>';

  const outRows = e.outgoing.map((r) => `<li data-edge-ref="${esc(r.id || '')}"><span class="rel">—${esc(r.type)}${r.type==='relates-to'?'—':'→'}</span> <span class="node">${esc(r.peerLabel)}</span>${r.selfLoop ? '<span class="flag self">自环</span>' : ''}</li>`).join('');
  const inRows = e.incoming.map((r) => (r.selfLoop ? '' : `<li data-edge-ref="${esc(r.id || '')}"><span class="rel">${r.type==='relates-to'?'—':'←'}${esc(r.type)}—</span> <span class="node">${esc(r.peerLabel)}</span></li>`)).join('');
  const attRows = e.attachmentAsElement.map((a) => `<li><span class="rel">⇢ 挂到</span> ${a.hostLabels.map((l) => `<span class="node">${esc(l)}</span>`).join(' · ')}</li>`).join('')
    + e.attachmentAsHost.map((a) => `<li><span class="rel">⇐ 挂靠</span> <span class="node">${esc(a.elementLabel)}</span></li>`).join('');

  return `
<article class="card type-${esc(e.type)}" id="review-element-${esc(e.id)}" data-element-id="${esc(e.id)}" data-focus-target="${esc(e.id)}" tabindex="0">
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
  ${renderFocusPanel(e)}
</article>`;
}

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
    <span class="rel">—${esc(ed.type)}${ed.type==='relates-to'?'—':'→'}</span>
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

/** 旧版结构板：按 element.type 分区 —— 现在只在 Review View 出现 */
function renderReviewBoard(vm, layout) {
  const grouped = TYPE_ORDER.concat(vm.facts.elementTypes.filter((t) => !TYPE_ORDER.includes(t)))
    .map((t) => ({ type: t, items: vm.elements.filter((e) => e.type === t) }))
    .filter((g) => g.items.length);
  const f = vm.facts;
  return `
  <section class="l0-review-board" id="l0-review-board">
    <section class="block">
      <h2>核心结构（按 element.type 分区 · ${f.elementCount} 个）</h2>
      <p class="note">这里的分区依据是 <code>element.type</code>（契约字段），<b>不是</b>关系 ——
        关系只在 Reading View 用线画出来。同一张图的两种读法：Reading 看结构，Review 看明细。</p>
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

    ${layout && layout.stats.backEdges ? `<p class="note">布局观察：这张图有 <b>${layout.stats.backEdges}</b> 条回边（Reading 里画成向上返回的箭头）——
      这是生成物的结构事实，不是渲染器造的。</p>` : ''}

    <div class="review-slot">${renderReview(vm)}</div>
  </section>`;
}

/* ------------------------------------------------------------------ *
 * Topic Navigation（Phase 4.1：默认只显示轻量入口，details 按需展开）
 * ------------------------------------------------------------------ */
function renderTopicEntry(t) {
  const blockIdsState = Object.prototype.hasOwnProperty.call(t, 'blockIds')
    ? (t.blockIds.length ? 'known' : 'empty')
    : 'unknown';
  const blockStatus = blockIdsState === 'known'
    ? `· L2 blocks: ${esc(t.blockIds.join(', '))}`
    : `· L2 blocks: ${blockIdsState === 'empty' ? 'none' : 'unknown'}`;
  return `
<li class="topic-entry ${t.hasElements ? '' : 'no-element'}" id="topic-${esc(t.id)}" data-topic-id="${esc(t.id)}" data-topic-focus="${esc(t.id)}" data-element-ids="${esc(t.elementIds.join(','))}" data-block-ids-state="${blockIdsState}">
  <details class="topic-fold">
    <summary class="topic-head">
      <span class="eid">${esc(t.id)}</span>
      <span class="topic-title">${esc(t.title)}</span>
      ${t.hasElements ? `<span class="topic-count">${t.elementIds.length}</span>` : '<span class="flag info">无 L0 element —— 仍是导航入口</span>'}
    </summary>
    <div class="topic-body">
      <div class="topic-prop">${esc(t.proposition)}</div>
      <div class="card-row"><span class="k">elements</span><span class="v">${t.elementIds.length ? t.elementIds.map((id, i) => `<button class="chip link" data-focus-target="${esc(id)}">${esc(t.elementLabels[i])}</button>`).join('') : '<span class="muted">（该 Topic 没有 L0 element）</span>'}</span></div>
      <div class="card-row"><span class="k">出处</span><span class="v">${refChips(t.sectionRefs)}<span class="muted">${blockStatus}</span></span></div>
    </div>
  </details>
</li>`;
}

/* ------------------------------------------------------------------ *
 * 主渲染
 * ------------------------------------------------------------------ */
function renderL0MapHTML(vm, opts = {}) {
  const view = opts.view || 'reading'; // **默认 Reading**（用户裁决）
  const layout = opts.layout || L0Layout.computeL0Layout(vm);
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
  ${renderHowTo()}

  <div class="l0-body">
    <main class="l0-main">
      ${renderReading(vm, layout)}
      ${renderReviewBoard(vm, layout)}
      <div class="canonical-subjects">${vm.elements.map(e=>`<section id="element-${esc(e.id)}" data-canonical-element="${esc(e.id)}" tabindex="-1" hidden><h2>${esc(e.label)}</h2>${renderFocusPanel(e).replace(' hidden','').replace('data-focus-for','data-canonical-focus').replace('class="focus-panel"','class="canonical-relations"')}</section>`).join('')}</div>
    </main>

    <aside class="l0-nav" id="topic-nav">
      <h2>Topic Navigation（完整入口索引 · ${f.topicCount}）</h2>
      <p class="note">这里与左边的图不是一一对应的：图中是<b>有关系的核心机制</b>，这里是<b>完整入口</b>。
        没有 L0 element 的 Topic 也照样能进入。默认只给标题，展开才看命题与出处。</p>
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
  if (!root) return;
  // mount replaces the render tree: remove closures owning the previous tree.
  root.__l0Abort?.abort();root.__l0Abort=new AbortController();
  const signal=root.__l0Abort.signal;
  // mount() 的宿主可能是 #main（Electron），而状态 class 的 CSS 作用域是 `.l0-root`：
  // 必须把 class 加到真正的 .l0-root 上，否则降噪/命中样式在 Electron 下不生效。
  const stateRoot = root.classList && root.classList.contains('l0-root') ? root : (root.querySelector('.l0-root') || root);

  const clear = () => {
    stateRoot.__selection = null;
    root.querySelectorAll('.l0-node').forEach(n=>n.setAttribute('aria-pressed','false'));
    root.querySelectorAll('[data-canonical-element]').forEach(p=>{p.hidden=true;});
    stateRoot.classList.remove('has-focus', 'focus-element', 'focus-edge', 'focus-topic');
    root.querySelectorAll('[data-focus-for]').forEach((p) => { p.hidden = true; });
    root.querySelectorAll('.is-hit,.is-open').forEach((n) => n.classList.remove('is-hit', 'is-open'));
    const slot = root.querySelector('#l0-focus-slot');
    if (slot) slot.innerHTML = '';
    if (opts.onClear) opts.onClear();
  };
  /**
   * 选中 = **只高光相关的东西，不压暗/不隐藏其余的**（用户裁决）。
   * 之前的做法是把其他节点降到 opacity .3 —— 用户读起来就是"其他内容被隐藏了"，
   * 而该被高光的约束又没有任何高光。所以现在只做加法：命中就加 `.is-hit`。
   */
  const hitNode = (n) => { if (n) n.classList.add('is-hit'); };
  const hitAll = (sel) => root.querySelectorAll(sel).forEach(hitNode);
  /** 两个视图里同一条 edge 的所有表现（SVG 线 / 线上标签 / Review 行）一起处理 */
  const edgeNodes = (id) => [...root.querySelectorAll('[data-edge-id]')].filter((n) => n.dataset.edgeId === id);
  /** 角标（约束）↔ 宿主：attachment 是双向的，点任一端都该把另一端一起点亮 */
  const hostIdsOf = (n) => (n.getAttribute('data-host-ids') || '').split(',').filter(Boolean);
  const hitBadgesHostedBy = (id) => {
    root.querySelectorAll('[data-host-ids]').forEach((n) => {
      if (hostIdsOf(n).includes(id)) hitNode(n);
    });
  };

  function focusElement(id) {
    clear();
    stateRoot.__selection={kind:'element',id};
    root.querySelectorAll('.l0-node').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.elementId===id)));
    stateRoot.classList.add('has-focus', 'focus-element');
    // ① 这个 element 在两个视图 / 角标里的所有表现
    root.querySelectorAll(`[data-element-id="${id}"]`).forEach((n) => {
      hitNode(n);
      // ② 如果它是个角标（约束），把它挂靠的宿主一起点亮 —— 附件关系就是它的"链接"
      hostIdsOf(n).forEach((h) => hitAll(`[data-element-id="${h}"]`));
    });
    // ③ 反过来：宿主被点时，挂在它上面的约束角标也一起亮
    hitBadgesHostedBy(id);
    // ④ 与它直接相连的线（含线标签）
    root.querySelectorAll('[data-edge-id]').forEach((n) => {
      if (n.dataset.from === id || n.dataset.to === id) hitNode(n);
    });
    // ⑤ Review 里的 attachment 行；Topic 入口
    root.querySelectorAll('.attach-row').forEach((r) => {
      if (r.dataset.attachElement === id) hitNode(r);
    });
    root.querySelectorAll('.topic-entry').forEach((r) => {
      if ((r.dataset.elementIds || '').split(',').includes(id)) hitNode(r);
    });
    const panel = root.querySelector(`[data-focus-for="${id}"]`);
    if (panel) {
      panel.hidden = false;
      const slot = root.querySelector('#l0-focus-slot');
      if (slot) slot.innerHTML = panel.outerHTML.replace(' hidden', '').replace('<section class="focus-panel"', '<section class="focus-panel focus-inline"');
    }
  }

  function focusEdge(el) {
    clear();
    stateRoot.classList.add('has-focus', 'focus-edge');
    const id = el.dataset.edgeId;
    stateRoot.__selection={kind:'edge',id};
    edgeNodes(id).forEach(hitNode);
    [el.dataset.from, el.dataset.to].forEach((eid) => {
      hitAll(`[data-element-id="${eid}"]`);
      hitBadgesHostedBy(eid);
    });
    el.classList.add('is-open'); // Review 行会因此展开 qualifier / provenance
  }

  function focusTopic(row) {
    clear();
    stateRoot.__selection={kind:'topic',id:row.dataset.topicId};
    stateRoot.classList.add('has-focus', 'focus-topic');
    hitNode(row);
    (row.dataset.elementIds || '').split(',').filter(Boolean).forEach((id) => {
      hitAll(`[data-element-id="${id}"]`);
      hitBadgesHostedBy(id);
    });
  }

  root.__l0Interaction={clear,focusElement,restore(selection){
    if(!selection){clear();return;}
    if(selection.kind==='element')focusElement(selection.id);
    if(selection.kind==='edge'){const edge=edgeNodes(selection.id)[0];if(edge)focusEdge(edge);}
    if(selection.kind==='topic'){const row=[...root.querySelectorAll('.topic-entry')].find(n=>n.dataset.topicId===selection.id);if(row)focusTopic(row);}
  }};
  root.addEventListener('click', (ev) => {
    const src = ev.target.closest('[data-source-ref]');
    if (src) { ev.preventDefault(); if (opts.onSourceRef) opts.onSourceRef(src.getAttribute('data-source-ref')); else src.classList.add('is-hit'); return; }
    if (ev.target.closest('[data-focus-clear]')) { ev.preventDefault(); clear(); return; }
    // 原生 <details> 的展开/收起不能被 preventDefault 吃掉
    const inSummary = !!ev.target.closest('summary');
    const edgeEl = ev.target.closest('[data-focus-edge]');
    if (edgeEl) { ev.preventDefault(); focusEdge(edgeEl); return; }
    const topicRow = ev.target.closest('[data-topic-focus]');
    if (topicRow && !ev.target.closest('[data-focus-target][data-element-id]')) {
      if (opts.onTopic) { ev.preventDefault(); opts.onTopic(topicRow.dataset.topicFocus); return; }
      if (!inSummary) ev.preventDefault();
      focusTopic(topicRow);
      return;
    }
    const card = ev.target.closest('[data-focus-target][data-element-id]');
    if (card) {
      if (!inSummary) ev.preventDefault();
      focusElement(card.getAttribute('data-focus-target'));
      return;
    }
    const chipEl = ev.target.closest('[data-focus-target]');
    if (chipEl) { ev.preventDefault(); focusElement(chipEl.getAttribute('data-focus-target')); }
  },{signal});

  root.addEventListener('keydown', (ev) => {
    if(ev.isComposing||ev.ctrlKey||ev.altKey||ev.metaKey||ev.target.closest('input,textarea,select,[contenteditable]'))return;
    if (ev.key === 'Escape' && !ev.defaultPrevented) clear();
    // 键盘可达：Enter / Space 也能选中当前节点（tabindex=0 已在节点上）
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('l0-node')) {
      ev.preventDefault();
      focusElement(ev.target.getAttribute('data-focus-target'));
    }
  },{signal});
}

/* 双模：Node（构建期 SSR）与浏览器（Electron / 预览） */
if (typeof module !== 'undefined' && module.exports) module.exports = { renderL0MapHTML, bindInteractions, L0Layout };
if (typeof window !== 'undefined') {
  window.L0Map = {
    renderL0MapHTML, bindInteractions,
    getSelection(root){return structuredClone(root.querySelector('.l0-root')?.__selection||null);},
    restoreSelection(root,selection){root.__l0Interaction?.restore(selection);},
    revealElement(root,id){root.__l0Interaction?.focusElement(id);const target=[...root.querySelectorAll('[data-canonical-element]')].find(n=>n.dataset.canonicalElement===id);if(target){target.hidden=false;}return target;},
    mount(root, vm, opts = {}) {
      root.innerHTML = renderL0MapHTML(vm, opts);
      bindInteractions(root, opts);
    },
  };
}
