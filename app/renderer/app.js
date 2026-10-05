'use strict';

/**
 * Renderer：Design Review（方案总览 + 决策清单）。
 *
 * 约束（docs/harness/CONSTRAINTS.md）：
 * - 不直接访问 Node.js fs；一切文件读写通过 window.designReview（preload IPC）；
 * - 不展示、不持有任何 API Key；
 * - AI 的 proposal 与人工审批状态严格分离：本文件只修改 humanReview 内存副本，
 *   而且要用户点击"保存 human-review.json"才落盘；
 * - 不替用户批准 Decision。
 *
 * 方案总览（Overview）的目标：**完整文档的视觉重述**，而不是摘要。
 * - 所有区块按甲/乙/丙/丁四段推进，区块可折叠；左侧目录始终显示"我在读哪一段"；
 * - 每个区块的 Source 标签点开右侧原文面板 —— 平时靠视觉重述理解，怀疑时一键回原文核对。
 */

const api = window.designReview;
const S = window.DesignReviewShared;

const STAGE_LABELS = { what: '甲 · 这是什么', how: '乙 · 它怎么跑', prove: '丙 · 怎么算发生了', boundary: '丁 · 边界与反模式' };

const STATUS_LABELS = {
  pending: '未决定',
  approved: '已同意',
  rejected: '已否决',
  'needs-revision': '以后再说',
  'needs-evidence': '需要证据',
  confirmed: '已确认',
  resolved: '已关闭',
  deferred: '已延后',
  'deferred-by-human': '人工延后',
};

const ACTIONS = [
  { status: 'approved', label: '同意', cls: 'primary', hint: '快捷键 A' },
  { status: 'rejected', label: '不同意', cls: 'danger', hint: '快捷键 R' },
  { status: 'needs-revision', label: '以后再说', cls: '', hint: '快捷键 L' },
];

const STATUS_CHIP_LABELS = {
  pending: '未决定',
  approved: '已同意',
  rejected: '已否决',
  'needs-revision': '已搁置',
};

const KEY_TO_ACTION = { a: 'approved', r: 'rejected', l: 'needs-revision' };

const RELATION_LABELS = { upstream: '它依赖', downstream: '依赖它', sibling: '同一 root 下的并列判断' };

const state = {
  sessionToken: null,
  bundleInfo: null,
  inspectionOrigin: null,
  inspectionRequest: 0,
  inspectionSubject: null,
  inspectionCoordinate: null,
  readingTopicId: null,
  readingBlockId: null,
  focusRef: null,
  readingAddress: null,
  exploreProjection: null,
  model: null,
  humanReview: null,
  modelPath: null,
  humanReviewPath: null,
  markdown: null,
  view: 'overview',
  /** Feature 08 · L0 Framework Map（view model 由主进程算好；renderer 只渲染） */
  l0ViewModel: null,
  l1Topics: null,
  l1Topic: null,
  /** Feature 16 · L2 semantic projection（renderer 只交付，不解释 source/relation 状态）。 */
  l2ViewModel: null,
  l0Path: null,
  l0View: 'reading',
  /** 区块折叠状态：blockId -> boolean。初始值来自 defaultExpanded。 */
  blockExpanded: {},
  /** 决策详情展开状态 */
  expanded: {},
  focusedDecisionId: null,
  onlyPending: false,
  /** 原文回查面板 */
  sourceReturnFocus: null,
  source: { loaded: false, document: null, sections: [], labels: [], error: null },
  activeBlockId: null,
  dirty: false,
  toastTimer: null,
  scrollSpyReady: false,
};

const navigation=window.ReadingNavigationUI.createController({capture:captureReadingFrame,show:showReadingAction,restore:restoreReadingFrame,onChange:updateNavigationControls,onNavigate:()=>{state.inspectionRequest++;}});
let legacyNavigationSession=0;

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

const $ = (selector) => document.querySelector(selector);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function clear(node) {
  node.__l0Abort?.abort();
  node.__l1Abort?.abort();
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

function statusOf(id, bucket) {
  const store = (state.humanReview && state.humanReview[bucket || 'decisions']) || {};
  return (store[id] && store[id].status) || 'pending';
}

function commentOf(id, bucket) {
  const store = (state.humanReview && state.humanReview[bucket || 'decisions']) || {};
  return (store[id] && store[id].comment) || '';
}

function statusChip(status) {
  const label = STATUS_CHIP_LABELS[status] || STATUS_LABELS[status] || status;
  return el('span', `status-chip ${status}`, label);
}

function toast(message, isError) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const node = el('div', `toast${isError ? ' error' : ''}`, message);
  node.setAttribute('role',isError?'alert':'status');node.setAttribute('aria-live',isError?'assertive':'polite');
  document.body.appendChild(node);
  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => node.remove(), 3600);
}

function setSaveState(text) {
  $('#save-state').textContent = text;
}

function isExpanded(scope, id, section) {
  return state.expanded[`${scope}:${id}:${section}`] === true;
}

function toggleExpanded(scope, id, section) {
  const key = `${scope}:${id}:${section}`;
  state.expanded[key] = !state.expanded[key];
  render();
}

function decisionById(id) {
  return (state.model.decisions || []).find((d) => d.id === id) || null;
}

function questionById(id) {
  return (state.model.openQuestions || []).find((q) => q.id === id) || null;
}

function openDecision(id) {
  state.view = 'decisions';
  state.focusedDecisionId = id;
  render();
  const target = document.querySelector(`[data-decision-id="${id}"]`);
  if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'center' });
}

function currentGate() {
  if (!state.model) return { ready: false, blockers: [] };
  return S.evaluateGate(state.model, state.humanReview);
}

function currentSummary() {
  if (!state.model) return null;
  return S.reviewSummary(state.model, state.humanReview);
}

function allBlocks() {
  return (state.l2ViewModel ? state.l2ViewModel.sections : []).flatMap((s) => s.blocks);
}

/* ================================================================== *
 * 方案总览：视觉语法（八种承载形式）
 * ================================================================== */

function renderChipRow(chips) {
  const row = el('div', 'chip-row');
  chips.forEach((id) => {
    const chip = el('span', 'obj-chip', id);
    chip.dataset.objId = id;
    chip.title = id.startsWith('DEC-') ? '点击查看这条决策' : '本条判断的编号';
    row.appendChild(chip);
  });
  return row;
}

function renderSourceTags(block, onOpen) {
  const row = el('div', 'src-tags');
  block.sourceRefs.forEach((label) => {
    const chip = el('button', 'src-chip', `Source: ${label}`);
    const section = state.source.sections.find((s) => s.label === label);
    chip.title = section ? `${section.title}（原文 L${section.startLine}-${section.endLine}）` : label;
    chip.addEventListener('click', () => onOpen(label));
    row.appendChild(chip);
  });
  return row;
}

/* ---- 各承载形式 ---- */

function contentProse(content) {
  const wrap = el('div', 'c-prose');
  (content.parts || []).forEach((part) => {
    wrap.appendChild(el('p', `prose-${part.variant || 'lead'}`, part.text));
  });
  return wrap;
}

function contentFlow(content) {
  const wrap = el('div', 'c-flow');
  if (content.caption) wrap.appendChild(el('div', 'block-subtitle', content.caption));
  const lanes = el('div', 'lane-grid');
  (content.lanes || []).forEach((lane) => {
    const laneEl = el('div', `lane lane-${lane.variant || 'plain'}`);
    laneEl.appendChild(el('div', 'lane-label', lane.label));
    (lane.nodes || []).forEach((item, index) => {
      const node = item.node || {};
      const nodeEl = el('div', `fnode state-${node.state || 'current'}${node.tier === 'secondary' ? ' secondary' : ''}`);
      nodeEl.appendChild(el('div', 'fnode-title', node.title));
      if (node.detail) nodeEl.appendChild(el('div', 'fnode-detail', node.detail));
      if (node.code) nodeEl.appendChild(el('code', 'fnode-code', node.code));
      if (node.badges && node.badges.length > 0) nodeEl.appendChild(renderChipRow(node.badges));
      laneEl.appendChild(nodeEl);
      if (item.edge) {
        const edge = el('div', `fedge edge-${item.edge.kind || 'plain'}`);
        edge.dataset.nodeIndex=index;
        edge.appendChild(el('span', 'fedge-line'));
        if (item.edge.note) edge.appendChild(el('span', 'fedge-note', item.edge.note));
        laneEl.appendChild(edge);
      }
    });
    lanes.appendChild(laneEl);
  });
  wrap.appendChild(lanes);
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

function contentLadder(content) {
  const wrap = el('div', 'c-ladder');
  if (content.caption) wrap.appendChild(el('div', 'block-subtitle', content.caption));
  const ladder = el('div', 'ladder');
  (content.tiers || []).forEach((tier) => {
    const rung = el('div', `rung rung-${tier.variant || 'plain'}`);
    rung.appendChild(el('div', 'rung-tag', tier.label));
    const body = el('div', 'rung-body');
    body.appendChild(el('div', 'rung-text', tier.text));
    if (tier.detail) body.appendChild(el('div', 'rung-detail', tier.detail));
    rung.appendChild(body);
    ladder.appendChild(rung);
  });
  wrap.appendChild(ladder);
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

function contentMatrix(content) {
  const wrap = el('div', 'c-matrix');
  const columns = content.columns || [];
  const table = el('table', `matrix cols-${columns.length}`);
  const thead = el('thead');
  const headRow = el('tr');
  columns.forEach((label) => headRow.appendChild(el('th', '', typeof label === 'string' ? label : label.text)));
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = el('tbody');
  (content.rows || []).forEach((row) => {
    const tr = el('tr');
    row.forEach((cell, index) => {
      const variants = ['plain', 'current', 'target', 'ok', 'warn', 'bad', 'info', 'muted'];
      const variant = cell.variant && variants.includes(cell.variant) ? `cell-${cell.variant}` : '';
      const td = el('td', `${index === 0 ? 'rowhead' : ''} ${variant}`.trim());
      if (index === 0 && columns.length > 1) {
        td.appendChild(el('span', 'cell-strong', cell.text));
      } else if (variant === 'cell-ok' || variant === 'cell-bad') {
        td.appendChild(el('span', 'cell-mark', variant === 'cell-ok' ? '✓' : '✗'));
        td.appendChild(document.createTextNode(cell.text));
      } else {
        td.textContent = cell.text;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

function renderChecklistPanel(panel) {
  const box = el('div', `cl-panel panel-${panel.variant || 'plain'}`);
  if (panel.title) box.appendChild(el('div', 'cl-title', panel.title));
  const ul = el('ul', 'checklist');
  (panel.items || []).forEach((item) => {
    const li = el('li', `cl-${item.variant || 'muted'}`);
    li.appendChild(el('span', 'cl-text', item.text));
    if (item.note) li.appendChild(el('span', 'cl-note', item.note));
    ul.appendChild(li);
  });
  box.appendChild(ul);
  return box;
}

function contentChecklist(content) {
  const wrap = el('div', 'c-checklist');
  const panels = content.panels || [];
  const grid = el('div', `cl-grid${panels.length === 1 ? ' single' : ''}`);
  panels.forEach((panel) => grid.appendChild(renderChecklistPanel(panel)));
  wrap.appendChild(grid);
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

function contentSteps(content) {
  const wrap = el('div', 'c-steps');
  if (content.caption) wrap.appendChild(el('div', 'block-subtitle', content.caption));
  const steps = el('div', 'steps');
  (content.steps || []).forEach((step, index) => {
    const row = el('div', 'step');
    row.appendChild(el('div', 'step-n', step.label || String(index + 1)));
    const body = el('div', 'step-body');
    body.appendChild(el('div', 'step-text', step.text));
    if (step.note) body.appendChild(el('div', 'step-note', step.note));
    row.appendChild(body);
    steps.appendChild(row);
  });
  wrap.appendChild(steps);
  if (content.verdict) {
    wrap.appendChild(el('div', `verdict verdict-${content.verdict.variant || 'plain'}`, content.verdict.text));
  }
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

function contentCombo(content) {
  const wrap = el('div', 'c-combo');
  if (content.caption) wrap.appendChild(el('div', 'block-subtitle', content.caption));
  const box = el('div', 'combo');
  (content.pairs || []).forEach((pair) => {
    const row = el('div', 'combo-row');
    const key = el('div', 'combo-key');
    const tokens = String(pair.key).split('·');
    tokens.forEach((token, index) => {
      const variant = (pair.keyVariants || [])[index];
      key.appendChild(el('span', `key-token${variant ? ` token-${variant}` : ''}`, token.trim()));
      if (index < tokens.length - 1) key.appendChild(el('span', 'key-sep', '·'));
    });
    row.appendChild(key);
    row.appendChild(el('div', `combo-val val-${pair.variant || 'plain'}`, pair.value));
    box.appendChild(row);
  });
  wrap.appendChild(box);
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

function contentDiff(content) {
  const wrap = el('div', 'c-diff');
  if (content.caption) wrap.appendChild(el('div', 'block-subtitle', content.caption));
  const grid = el('div', 'diff');
  (content.sides || []).forEach((side) => {
    const col = el('div', `diff-col diff-${side.variant || 'plain'}`);
    col.appendChild(el('div', 'diff-head', side.label));
    (side.lines || []).forEach((line) => {
      const row = el('div', `diff-line mark-${line.mark}`);
      row.appendChild(el('span', 'diff-mark', line.mark === 'keep' ? '=' : line.mark === 'add' ? '＋' : '✗'));
      row.appendChild(el('span', 'diff-text', line.text));
      if (line.note) row.appendChild(el('span', 'diff-note', line.note));
      col.appendChild(row);
    });
    grid.appendChild(col);
  });
  wrap.appendChild(grid);
  if (content.note) wrap.appendChild(el('div', 'block-note', content.note));
  return wrap;
}

const CONTENT_RENDERERS = {
  prose: contentProse,
  flow: contentFlow,
  ladder: contentLadder,
  matrix: contentMatrix,
  checklist: contentChecklist,
  steps: contentSteps,
  combo: contentCombo,
  diff: contentDiff,
};

function renderBlock(block) {
  const expanded = state.blockExpanded[block.id] !== undefined ? state.blockExpanded[block.id] : block.defaultExpanded;
  const section = el('section', `block stage-${block.stage}${block.role === 'ambient' ? ' ambient' : ''}${expanded ? '' : ' collapsed'}`);
  section.id = `block-${block.id}`;
  section.dataset.blockId = block.id;
  section.dataset.stage = block.stage;
  section.dataset.reviewObjectsState = block.reviewObjectLinks.state;

  const head = el('div', 'block-head');
  head.appendChild(el('span', 'block-id', block.id));
  head.appendChild(el('span', 'block-title', block.title));
  head.appendChild(el('span', 'spacer'));
  head.appendChild(renderSourceTags(block, openSource));
  if(state.sessionToken) {const inspect=el('button','btn tiny','查出处');inspect.dataset.inspectBlock=block.id;inspect.addEventListener('click',()=>openInspection(block.id));head.appendChild(inspect);}

  if (block.role === 'ambient') {
    head.appendChild(el('span', 'block-flag', '常驻'));
  } else {
    const toggle = el('button', 'block-toggle', expanded ? '折叠' : '展开');
    toggle.addEventListener('click', () => {
      state.blockExpanded[block.id] = !expanded;
      render();
    });
    head.appendChild(toggle);
  }
  section.appendChild(head);

  const body = el('div', 'block-body');
  if (expanded) {
    const renderer = block.content && CONTENT_RENDERERS[block.content.type];
    if (renderer) {
      const expression=renderer(block.content);body.appendChild(expression);
      if(state.sessionToken) bindFragmentInspection(expression,block);
    } else {
      body.appendChild(el('div', 'muted small', `${block.generatedExpression?.state==='missing'?'这个区块缺少生成表达。':block.generatedExpression?.state==='unknown'?'尚未提供生成资料；仍可查看规划出处。':'未知承载形式。'}`));
    }
    if (block.reviewObjectLinks.state === 'known') {
      const foot = el('div', 'block-foot');
      foot.appendChild(el('span', 'block-foot-label', '关联'));
      foot.appendChild(renderChipRow(block.reviewObjectLinks.values));
      body.appendChild(foot);
    }
  }
  section.appendChild(body);
  return section;
}

/* ================================================================== *
 * 方案总览页面
 * ================================================================== */

function buildToc() {
  const toc = clear($('#toc'));
  toc.appendChild(el('div', 'toc-title', '文档目录'));
  (state.l2ViewModel ? state.l2ViewModel.sections : []).forEach((stage) => {
    const group = el('div', 'toc-group');
    group.dataset.stage = stage.id;
    const head = el('button', 'toc-stage', stage.title);
    head.addEventListener('click', () => {
      const first = stage.blocks[0];
      scrollToBlock(first.id);
    });
    group.appendChild(head);
    const list = el('div', 'toc-blocks');
    stage.blocks.forEach((block) => {
      const item = el('button', 'toc-item', block.title);
      item.dataset.blockId = block.id;
      item.addEventListener('click', () => scrollToBlock(block.id));
      list.appendChild(item);
    });
    group.appendChild(list);
    toc.appendChild(group);
  });
}

function scrollToBlock(blockId) {
  if (state.blockExpanded[blockId] === false) {
    state.blockExpanded[blockId] = true;
    render();
  }
  const target = document.getElementById(`block-${blockId}`);
  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setActiveBlock(blockId);
}

function setActiveBlock(blockId) {
  if (state.activeBlockId === blockId) return;
  state.activeBlockId = blockId;
  const block = allBlocks().find((b) => b.id === blockId);
  if (!block) return;
  document.querySelectorAll('.toc-item').forEach((node) => {
    node.classList.toggle('active', node.dataset.blockId === blockId);
  });
  document.querySelectorAll('.toc-group').forEach((node) => {
    node.classList.toggle('active', node.dataset.stage === block.stage);
  });
  const stageLabel = $('#stage-indicator');
  if (stageLabel) stageLabel.textContent = `当前阅读：${STAGE_LABELS[block.stage] || block.stage}`;
}

function setupScrollSpy() {
  const container = $('#main');
  if (!container || state.scrollSpyReady) return;
  state.scrollSpyReady = true;
  let ticking = false;
  container.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      const blocks = [...container.querySelectorAll('.block')];
      const top = container.getBoundingClientRect().top + 12;
      let current = blocks[0];
      blocks.forEach((node) => {
        if (node.getBoundingClientRect().top <= top) current = node;
      });
      if (current) setActiveBlock(current.dataset.blockId);
    });
  });
}

function viewOverview() {
  const main = clear($('#main'));
  const nav=el('div','reading-nav');const back=el('button','btn','返回');back.id='reading-back';back.hidden=!navigation.size;back.addEventListener('click',()=>navigation.back());nav.append(back);main.append(nav);
  main.appendChild(el('div', 'stage-indicator-start'));
  (state.l2ViewModel ? state.l2ViewModel.sections : []).forEach((stage) => {
    const header = el('div', `stage-head stage-${stage.id}`);
    header.appendChild(el('div', 'stage-title', stage.title));
    header.appendChild(el('div', 'stage-purpose', stage.purpose));
    main.appendChild(header);
    stage.blocks.forEach((block) => main.appendChild(renderBlock(block)));
  });
  main.appendChild(el('div', 'overview-end', '—— 以上为方案总览全文，可点任一 Source 标签回原文核对 ——'));
  const first = allBlocks()[0];
  if (first && !state.activeBlockId) setActiveBlock(first.id);
  setupScrollSpy();
}

/* ================================================================== *
 * 原文回查面板
 * ================================================================== */

async function ensureSourceLoaded() {
  if (state.source.loaded) return state.source;
  const token=state.sessionToken,loadRequest=bundleLoadRequest;
  const result = await api.loadSource();
  if(token!==state.sessionToken || loadRequest!==bundleLoadRequest) return state.source;
  if (!result || !result.ok) {
    state.source.error = result && result.errors ? result.errors.join('; ') : '读取失败';
    return state.source;
  }
  state.source = {
    loaded: true,
    document: result.document,
    sections: result.sections,
    labels: result.sections.map((s) => s.label),
    error: null,
  };
  return state.source;
}

async function openSource(label,{namespace='plan-section',key=label}={}) {
  const returnFocus=domLocation(document.activeElement);
  const request=++state.inspectionRequest;
  if(state.sessionToken) {
    const token=state.sessionToken,result=await api.bundle.source({sessionToken:token,namespace,key});
    if(token!==state.sessionToken || request!==state.inspectionRequest) return;
    closeInspection(false);state.sourceReturnFocus=returnFocus;const body=clear($('#source-body'));clear($('#source-head')).textContent=label;
    $('#source-panel').classList.remove('hidden');$('#screen-review').classList.add('with-source');
    showCoordinate(body,result.coordinate||{state:'unavailable',reason:(result.errors||[]).join('; ')});$('#source-close').focus({preventScroll:true});return;
  }
  await ensureSourceLoaded();
  if(request!==state.inspectionRequest) return;
  state.sourceReturnFocus=returnFocus;renderSourcePanel(label);$('#source-close').focus({preventScroll:true});
}

function closeSource(restoreFocus=false) {
  state.inspectionRequest++;
  $('#source-panel').classList.add('hidden');
  $('#screen-review').classList.remove('with-source');
  if(restoreFocus){
    let target=locateDOM(state.sourceReturnFocus);
    if(target&&!target.getClientRects().length&&target.closest('#l1-selection-detail'))target=$('#l1-detail-toggle');
    target?.focus({preventScroll:true});
  }
  state.sourceReturnFocus=null;
}

function renderSourcePanel(label) {
  const panel = $('#source-panel');
  const body = clear($('#source-body'));
  panel.classList.remove('hidden');
  $('#screen-review').classList.add('with-source');

  const source = state.source;
  if (source.error) clear($('#source-head')).textContent=label;
  if (source.error) {
    body.appendChild(el('div', 'error-box', source.error));
    return;
  }
  const section = source.sections.find((s) => s.label === label);
  const head = clear($('#source-head'));
  head.appendChild(el('span', 'source-label', label));
  head.appendChild(el('span', 'source-title', section ? section.title : '未找到该章节'));

  if (!section) {
    body.appendChild(el('div', 'muted small', '未找到对应章节。'));
    return;
  }
  const meta = el('div', 'source-meta', `原文 L${section.startLine}-${section.endLine} · ${source.document.path}`);
  body.appendChild(meta);
  const pre = el('pre', 'source-text');
  pre.textContent = section.text;
  body.appendChild(pre);

  // 面板内的章节切换
  const nav = el('div', 'source-nav');
  source.sections.forEach((s) => {
    const btn = el('button', `source-nav-item${s.label === label ? ' active' : ''}`, `${s.label} ${s.title}`);
    btn.addEventListener('click', () => renderSourcePanel(s.label));
    nav.appendChild(btn);
  });
  body.appendChild(nav);
}

/* ================================================================== *
 * 决策清单（本轮不改造，保持可用）
 * ================================================================== */

function ensureDecisionEntry(id) {
  if (!state.humanReview.decisions) state.humanReview.decisions = {};
  if (!state.humanReview.decisions[id]) state.humanReview.decisions[id] = { status: 'pending', comment: '' };
  return state.humanReview.decisions[id];
}

function setDecisionStatus(id, status) {
  ensureDecisionEntry(id).status = status;
  state.dirty = true;
  setSaveState('有未保存修改');
  render();
}

function fieldBlock(label, bodyNode) {
  const field = el('div', 'field');
  field.appendChild(el('div', 'field-label', label));
  if (typeof bodyNode === 'string') field.appendChild(el('div', 'field-body', bodyNode));
  else field.appendChild(bodyNode);
  return field;
}

function bulletList(items, emptyText) {
  if (!items || items.length === 0) return el('div', 'muted small', emptyText || '（空）');
  const ul = el('ul', 'tight');
  items.forEach((item) => {
    const text = typeof item === 'string' ? item : item.label;
    const li = el('li', '', text);
    if (typeof item === 'object' && item.note) li.appendChild(el('div', 'alt-note', item.note));
    ul.appendChild(li);
  });
  return ul;
}

function disclosureSection(scope, id, section, title, count, buildBody) {
  const open = isExpanded(scope, id, section);
  const wrap = el('div', `disclosure${open ? ' open' : ''}`);
  const head = el('button', 'disclosure-head');
  head.appendChild(el('span', 'disclosure-caret', open ? '▾' : '▸'));
  head.appendChild(el('span', 'disclosure-title', title));
  if (typeof count === 'string' && count) head.appendChild(el('span', 'disclosure-count', count));
  head.addEventListener('click', () => toggleExpanded(scope, id, section));
  wrap.appendChild(head);
  if (open) {
    const body = el('div', 'disclosure-body');
    buildBody(body);
    wrap.appendChild(body);
  }
  return wrap;
}

function evidenceTypeBadge(type) {
  const normalized = S.evidenceTypeOf({ type });
  const badge = el('span', `ev-badge ${normalized}`, S.EVIDENCE_TYPE_LABELS[normalized]);
  badge.title = normalized === 'source-verified' ? '已由源码 / 测试 / 配置核对' : '文档中的主张，尚未由源码核对';
  return badge;
}

function evidenceStatusChip(evidence) {
  const status = S.evidenceStatus(evidence);
  const chip = el('span', `ev-status ${status.status}`, status.label);
  chip.title = status.detail;
  return chip;
}

function renderEvidenceList(container, evidence) {
  if (!evidence || evidence.length === 0) {
    container.appendChild(el('div', 'muted small', '（无 Evidence）'));
    return;
  }
  evidence.forEach((ev) => {
    const item = el('div', 'evidence-item');
    const head = el('div', 'evidence-head');
    head.appendChild(evidenceTypeBadge(ev.type));
    const locator = [];
    if (ev.source) locator.push(ev.source);
    if (ev.path) locator.push(ev.path);
    if (ev.section) locator.push(ev.section);
    if (ev.symbol) locator.push(ev.symbol);
    if (ev.startLine) locator.push(`L${ev.startLine}${ev.endLine ? `-${ev.endLine}` : ''}`);
    head.appendChild(el('span', 'evidence-locator', locator.join(' · ')));
    item.appendChild(head);
    item.appendChild(el('div', 'evidence-desc', ev.description || ''));
    container.appendChild(item);
  });
}

function levelChip(level) {
  const labels = { root: '高优先级', supporting: '支撑', derived: '推导' };
  const chip = el('span', `level-chip ${level}`, labels[level] || level);
  chip.title =
    level === 'root'
      ? '核心判断：需要你独立表态'
      : level === 'supporting'
        ? '支撑性判断：支撑某个核心判断'
        : '推导性判断：由核心判断推出';
  return chip;
}

function relatedGapRow(gap) {
  const row = el('div', 'related-gap-row');
  const head = el('div', 'related-gap-head');
  head.appendChild(el('span', 'jump-id', gap.id));
  head.appendChild(el('span', `sev-chip sev-${gap.severity}`, gap.severity));
  head.appendChild(el('span', 'related-gap-title', gap.title));
  row.appendChild(head);
  const diff = el('div', 'gap-diff');
  const current = el('div', 'gap-diff-col current');
  current.appendChild(el('span', 'gap-diff-label', '现在'));
  current.appendChild(el('span', '', gap.current));
  const target = el('div', 'gap-diff-col target');
  target.appendChild(el('span', 'gap-diff-label', '目标'));
  target.appendChild(el('span', '', gap.target));
  diff.appendChild(current);
  diff.appendChild(target);
  row.appendChild(diff);
  return row;
}

function relatedQuestionRow(question) {
  const row = el('div', 'related-question-row');
  const head = el('div', 'related-question-head');
  head.appendChild(el('span', 'jump-id', question.id));
  head.appendChild(el('span', `cat-chip ${S.categoryOf(question)}`, S.QUESTION_CATEGORY_LABELS[S.categoryOf(question)]));
  head.appendChild(statusChip(statusOf(question.id, 'openQuestions')));
  row.appendChild(head);
  row.appendChild(el('div', 'related-question-text', question.question));
  const actions = el('div', 'review-actions compact');
  [
    ['resolved', '已解决'],
    ['deferred', '延后'],
    ['pending', '仍待决定'],
  ].forEach(([status, label]) => {
    const btn = el('button', `btn tiny${statusOf(question.id, 'openQuestions') === status ? ' active-choice' : ''}`, label);
    btn.dataset.action = status;
    btn.dataset.bucket = 'openQuestions';
    btn.dataset.id = question.id;
    actions.appendChild(btn);
  });
  row.appendChild(actions);
  const comment = el('input', 'review-comment small-input');
  comment.type = 'text';
  comment.placeholder = '结论 / 延后原因（可选）';
  comment.value = commentOf(question.id, 'openQuestions');
  comment.addEventListener('input', () => {
    if (!state.humanReview.openQuestions) state.humanReview.openQuestions = {};
    const entry =
      state.humanReview.openQuestions[question.id] ||
      (state.humanReview.openQuestions[question.id] = { status: 'pending', comment: '' });
    entry.comment = comment.value;
    state.dirty = true;
    setSaveState('有未保存修改');
  });
  row.appendChild(comment);
  return row;
}

function decisionCard(d) {
  const level = S.reviewLevelOf(d);
  const card = el('div', `decision-card${level === 'root' ? ' high' : ''}${state.focusedDecisionId === d.id ? ' focused' : ''}`);
  card.dataset.decisionId = d.id;
  card.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest('button, textarea, input')) return;
    state.focusedDecisionId = d.id;
    document.querySelectorAll('.decision-card.focused').forEach((node) => node.classList.remove('focused'));
    card.classList.add('focused');
  });

  const head = el('div', 'decision-card-head');
  const headLeft = el('div', '');
  headLeft.appendChild(el('div', 'detail-id', d.id));
  headLeft.appendChild(el('div', 'detail-title', d.title));
  head.appendChild(headLeft);
  const headRight = el('div', 'decision-card-meta');
  headRight.appendChild(levelChip(level));
  headRight.appendChild(statusChip(statusOf(d.id)));
  head.appendChild(headRight);
  card.appendChild(head);

  card.appendChild(fieldBlock('问题', d.question));
  card.appendChild(fieldBlock('AI 建议', d.proposal));
  card.appendChild(fieldBlock('为什么这样建议', d.rationaleSummary));

  const actions = el('div', 'decision-actions');
  const current = statusOf(d.id);
  ACTIONS.forEach((action) => {
    const btn = el('button', `btn ${action.cls}${current === action.status ? ' active-choice' : ''}`, action.label);
    btn.title = action.hint;
    btn.dataset.action = action.status;
    btn.dataset.bucket = 'decisions';
    btn.dataset.id = d.id;
    actions.appendChild(btn);
  });
  if (current !== 'pending') {
    const undo = el('button', 'btn tiny ghost', '撤销表态');
    undo.dataset.action = 'pending';
    undo.dataset.bucket = 'decisions';
    undo.dataset.id = d.id;
    actions.appendChild(undo);
  }
  card.appendChild(actions);

  const detailKeys = ['alternatives', 'rationale', 'consequences', 'gaps', 'evidence', 'questions', 'deps'];
  const openDetails = detailKeys.some((section) => isExpanded('decision', d.id, section));
  const toggle = el('button', 'btn tiny details-toggle', openDetails ? '收起详情' : '查看详情');
  toggle.addEventListener('click', () => {
    const shouldOpen = !openDetails;
    detailKeys.forEach((section) => {
      state.expanded[`decision:${d.id}:${section}`] = shouldOpen;
    });
    render();
  });
  card.appendChild(toggle);

  if (current !== 'pending' && current !== 'approved') {
    const comment = el('textarea', 'review-comment');
    comment.placeholder = current === 'rejected' ? '说明为什么不同意（建议填写）' : '说明为什么先搁置 / 还需要什么（建议填写）';
    comment.value = commentOf(d.id);
    comment.addEventListener('input', () => {
      ensureDecisionEntry(d.id).comment = comment.value;
      state.dirty = true;
      setSaveState('有未保存修改');
    });
    card.appendChild(comment);
    if (!commentOf(d.id)) {
      card.appendChild(el('div', 'warn-box', '这条决策处于非同意状态但没有备注：人工审核结果需要可追溯的说明。'));
    }
  }

  if (openDetails) {
    const disclosures = el('div', 'disclosures');
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'alternatives', 'Alternatives', `${(d.alternatives || []).length} 项`, (body) => {
        body.appendChild(bulletList(d.alternatives, '没有明确 alternative（允许为空）'));
      })
    );
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'rationale', 'Full Rationale', `${(d.rationale || []).length} 条`, (body) => {
        body.appendChild(bulletList(d.rationale, '（未记录）'));
      })
    );
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'consequences', 'Consequences', `${(d.consequences || []).length} 条`, (body) => {
        body.appendChild(bulletList(d.consequences, '（未记录）'));
      })
    );
    const gaps = S.relatedGaps(state.model, d);
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'gaps', 'Current / Target', `${gaps.length} 个 Gap`, (body) => {
        if (gaps.length === 0) {
          body.appendChild(el('div', 'muted small', '（没有直接关联的 Gap）'));
          return;
        }
        gaps.forEach((gap) => body.appendChild(relatedGapRow(gap)));
      })
    );
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'evidence', 'Evidence', `${(d.evidence || []).length} 条`, (body) => {
        const status = S.evidenceStatus(d.evidence);
        const line = el('div', 'evidence-status-line');
        line.appendChild(evidenceStatusChip(d.evidence));
        line.appendChild(el('span', 'muted small', status.detail));
        body.appendChild(line);
        if (status.status === 'document-claim-only') {
          body.appendChild(
            el('div', 'evidence-caveat', '证据只来自文档主张，未经源码核对 —— 你同意的是设计意图，不是已验证的现状。')
          );
        }
        renderEvidenceList(body, d.evidence);
      })
    );
    const questions = (d.relatedQuestions || []).map((id) => questionById(id)).filter(Boolean);
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'questions', 'Open Questions', `${questions.length} 个`, (body) => {
        if (questions.length === 0) {
          body.appendChild(el('div', 'muted small', '（没有关联的未决问题）'));
          return;
        }
        questions.forEach((q) => body.appendChild(relatedQuestionRow(q)));
      })
    );
    const related = S.relatedDecisions(state.model, d);
    disclosures.appendChild(
      disclosureSection('decision', d.id, 'deps', 'Dependencies / Related', `${related.length} 条`, (body) => {
        if ((d.dependsOn || []).length > 0) {
          const depField = el('div', 'field');
          depField.appendChild(el('div', 'field-label', '它依赖'));
          const wrap = el('div', 'dep-links');
          d.dependsOn.forEach((depId) => {
            const dep = decisionById(depId);
            const btn = el('button', 'dep-link', depId);
            btn.title = dep ? `${dep.title}（${STATUS_CHIP_LABELS[statusOf(depId)] || statusOf(depId)}）` : '';
            btn.addEventListener('click', () => openDecision(depId));
            wrap.appendChild(btn);
          });
          depField.appendChild(wrap);
          body.appendChild(depField);
        }
        if (related.length > 0) {
          const relField = el('div', 'field');
          relField.appendChild(el('div', 'field-label', '关联判断'));
          related.forEach(({ decision, relation }) => {
            const row = el('button', 'jump-row');
            row.appendChild(el('span', 'jump-id', decision.id));
            row.appendChild(levelChip(S.reviewLevelOf(decision)));
            row.appendChild(el('span', 'jump-title', decision.title));
            row.appendChild(el('span', 'rel-label', RELATION_LABELS[relation] || relation));
            row.appendChild(statusChip(statusOf(decision.id)));
            row.addEventListener('click', () => openDecision(decision.id));
            relField.appendChild(row);
          });
          body.appendChild(relField);
        }
        if ((d.affects || []).length > 0) body.appendChild(fieldBlock('Affects', bulletList(d.affects)));
      })
    );
    card.appendChild(disclosures);
  }

  return card;
}

function viewDecisions() {
  const main = clear($('#main'));
  const summary = currentSummary();

  main.appendChild(el('h2', 'section-title', '决策清单'));
  main.appendChild(
    el(
      'div',
      'section-sub',
      `共 ${summary.decisions.total} 条需要人工表态的决策。每条只展示标题、问题、AI 建议、一句话原因与审核动作；其余内容点击"查看详情"展开。`
    )
  );

  const warningCount = (state.model.design.warnings || []).length;
  if (warningCount > 0) {
    const box = el('div', 'warn-box');
    box.appendChild(el('div', '', `design-review.json 有 ${warningCount} 条校验 warning（不阻止审核）：`));
    const ul = el('ul', '');
    (state.model.design.warnings || []).forEach((w) => ul.appendChild(el('li', '', w)));
    box.appendChild(ul);
    main.appendChild(box);
  }

  const decisions = state.model.decisions || [];
  const pendingCount = summary.decisions.counts.pending;
  const progress = el('div', 'list-progress');
  progress.appendChild(el('span', '', `待决定 ${pendingCount} / ${decisions.length}`));
  const allPendingBtn = el('button', 'btn tiny ghost', '只看待决定');
  let onlyPending = state.onlyPending === true;
  if (onlyPending) allPendingBtn.classList.add('active-choice');
  allPendingBtn.addEventListener('click', () => {
    state.onlyPending = !onlyPending;
    render();
  });
  progress.appendChild(allPendingBtn);
  main.appendChild(progress);

  const groups = [
    ['核心判断（高优先级）', `${decisions.filter((d) => S.reviewLevelOf(d) === 'root').length} 条，建议先逐条处理`, decisions.filter((d) => S.reviewLevelOf(d) === 'root')],
    ['支撑性判断', `${decisions.filter((d) => S.reviewLevelOf(d) === 'supporting').length} 条，支撑上面的核心判断`, decisions.filter((d) => S.reviewLevelOf(d) === 'supporting')],
    ['推导性判断', `${decisions.filter((d) => S.reviewLevelOf(d) === 'derived').length} 条，通常随核心判断一并决定`, decisions.filter((d) => S.reviewLevelOf(d) === 'derived')],
  ];

  groups.forEach(([title, note, list]) => {
    const visible = onlyPending ? list.filter((d) => statusOf(d.id) === 'pending') : list;
    if (visible.length === 0 && !onlyPending) return;
    const wrap = el('div', 'decision-section');
    const head = el('div', 'decision-section-head');
    head.appendChild(el('span', 'decision-section-title', title));
    head.appendChild(el('span', 'muted small', note));
    wrap.appendChild(head);
    if (visible.length === 0) {
      wrap.appendChild(el('div', 'muted small', '（这一组没有待决定项）'));
    }
    visible.forEach((d) => wrap.appendChild(decisionCard(d)));
    main.appendChild(wrap);
  });
}

/* ================================================================== *
 * 渲染调度
 * ================================================================== */

function renderGateBadge() {
  const badge = $('#gate-badge');
  const gate = currentGate();
  if (gate.ready) {
    badge.className = 'gate-badge ready';
    badge.textContent = 'READY FOR IMPLEMENTATION';
    badge.title = 'human-review.json 中没有 blocking item';
  } else {
    badge.className = 'gate-badge blocked';
    badge.textContent = `未满足前置条件 · ${gate.blockers.length}`;
    badge.title = gate.blockers.map((b) => `${b.id}: ${b.detail}`).join('\n');
  }
}

function render() {
  if(state.inspectionOrigin) closeInspection(false);
  if (!state.model && !['l0','l1','explore'].includes(state.view)) return;
  const summary = state.model ? currentSummary() : null;

  $('#design-title').textContent = ['l0','l1','explore'].includes(state.view)
    ? ((state.l0ViewModel && state.l0ViewModel.document.title) || 'L0 Framework Map')
    : state.model.design.title;
  $('#design-id').textContent = state.model ? state.model.design.id : 'L0';
  $('#design-status').textContent = state.model ? state.model.design.status : '';
  $('#model-path').textContent = (state.view === 'l0') ? (state.bundleInfo?.manifestPath || state.l0Path || '') : (state.modelPath || '');
  $('#nav-decision-count').textContent = summary ? `待决定 ${summary.decisions.counts.pending}/${summary.decisions.total}` : '';
  if ($('#nav-l0-state')) {
    $('#nav-l0-state').textContent = state.l0ViewModel
      ? `${state.l0ViewModel.facts.elementCount} 元素 / ${state.l0ViewModel.facts.edgeCount} 关系`
      : '未加载';
  }

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === state.view);
  });
  $('#screen-review').dataset.view = state.view;
  $('#screen-review').classList.toggle('l0-mode', state.view === 'l0');

  renderGateBadge();
  if (!['l0','l1','explore'].includes(state.view)) buildToc();

  if (state.view === 'l0') viewL0();
  else if (state.view === 'l1') viewL1();
  else if (state.view === 'overview') viewOverview();
  else if (state.view === 'explore') viewExplore();
  else viewDecisions();
  updateExploreEntry();updateNavigationControls();
}

/* ================================================================== *
 * Feature 08 · L0 Framework Map 视图（deterministic；不调用模型）
 * view model 由主进程算好（scripts/l0-view-model.js），这里只渲染。
 * ================================================================== */

function viewL0() {
  const host = $('#main');
  host.__l1Abort?.abort();
  if (!state.l0ViewModel) {
    host.innerHTML = '<div class="l0-empty"><p>尚未加载 L0 Framework Map。</p>'
      + '<p class="muted">返回首屏用「打开 framework-map.json」选择一份已通过 check-map 的图。</p></div>';
    return;
  }
  window.L0Map.mount(host, state.l0ViewModel, {
    view: state.l0View || 'reading',
    // provenance → 打开右侧 Source 面板的对应章节（复用现有原文回查能力）
    onSourceRef: (ref) => { state.sessionToken ? openSource(ref,{namespace:'heading',key:ref.replace(/^§/,'')}) : openSource(ref); },
    onTopic: (id) => navigation.enter({type:'topic',id}),
    onExplanationSource: (source) => openSource(source.key,source),
  });
  const toolbar=el('div','reading-nav'),back=el('button','btn','返回');back.id='reading-back';back.hidden=!navigation.size;back.addEventListener('click',()=>navigation.back());toolbar.append(back);host.prepend(toolbar);
  // Reading / Review 切换后保持视图状态（不重新计算任何数据）
  host.querySelectorAll('[data-l0-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.l0View = btn.getAttribute('data-l0-view');
      const root = host.querySelector('.l0-root');
      if (root) root.setAttribute('data-view', state.l0View);
    });
  });
}

function viewL1() {
 const topic=state.l1Topic,host=$('#main');if(!topic){clear(host).textContent='未选择 Topic。';return;}
 host.__l0Abort?.abort();
 window.L1TopicView.mount(host,topic,{
  onBack:()=>navigation.back(),
  onElement:id=>navigation.resolve({kind:'element',id}),
  onBlock:id=>navigation.enter({type:'block',id,topicId:topic.topic.id}),
  canReadBlock:id=>allBlocks().some(b=>b.id===id),
  canSourceRef:ref=>Boolean(state.sessionToken)&&topic.sourceReferences?.some(r=>r.ref===ref&&r.state==='known'),
  sourceRefReason:ref=>topic.sourceReferences?.find(r=>r.ref===ref)?.reason,
  onSourceRef:ref=>openSource(ref,{namespace:'heading',key:ref.replace(/^§/,'')}),
  onExplanationSource:source=>openSource(source.key,source),
 });
}

/**
 * 打开 L0 Framework Map —— **这是唯一入口**。
 *   手工点按钮：loadL0()        → 走系统文件选择器
 *   自动化/深链：loadL0(path)   → 直接给路径（selftest 用）
 *
 * ⚠️ 不许在别处复制这段状态切换。曾经复制过一次：selftest 里那份复制版是对的，
 * 真实入口却调了一个不存在的 enterReview() 并静默抛错 —— 自动化全绿、手工点按钮毫无反应。
 * 测试要覆盖这条缝，就只能调这个函数本身。
 */
async function loadL0(mapPath) {
  const request=++bundleLoadRequest;
  if(state.dirty && !window.confirm('放弃未保存审核并打开独立框架图？')) return {ok:false,canceled:true};
  const api = window.designReview;
  const res = mapPath ? await api.l0.loadPath(mapPath) : await api.l0.openJson();
  if(request!==bundleLoadRequest) return {ok:false,stale:true};
  if (!res || !res.ok) {
    if (res && res.canceled) return null;
    window.alert(`加载 framework-map 失败：${(res && res.errors && res.errors[0]) || '未知错误'}`);
    return null;
  }
  state.sessionToken=null;state.bundleInfo=null;state.model=null;state.humanReview=null;state.l2ViewModel=null;
  state.inspectionOrigin=null;state.inspectionRequest++;state.dirty=false;
  state.source={loaded:false,document:null,sections:[],labels:[],error:null};
  state.l0ViewModel = res.viewModel;
  state.l1Topics = res.l1Topics;
  state.l0Path = res.mapPath;
  state.l0View = 'reading'; // 用户裁决：Reading 为默认
  state.l1Topic=null;resetReadingNavigation();
  if ($('#l0-info')) $('#l0-info').textContent = `已加载：${res.mapPath}${res.checkMapPath ? '（含 check-map 结论）' : ''}`;

  // 与 design-review.json 加载路径一致的**真实屏切换**（首屏 → Review 屏）
  $('#screen-start').classList.add('hidden');
  $('#screen-review').classList.remove('hidden');
  closeSource();

  state.view = 'l0';
  render();

  const f = res.viewModel.facts;
  toast(`已加载 L0 框架图：${f.elementCount} 个元素 / ${f.edgeCount} 条关系 / ${f.topicCount} 个 Topic`);
  return res;
}


/* ================================================================== *
 * 启动流程
 * ================================================================== */

function showError(errors, stage) {
  const box = $('#start-error');
  clear(box);
  box.classList.remove('hidden');
  box.appendChild(el('div', '', `无法进入 Review UI${stage ? `（校验阶段：${stage}）` : ''}：`));
  const ul = el('ul', '');
  (errors || []).forEach((e) => ul.appendChild(el('li', '', e)));
  box.appendChild(ul);
  box.appendChild(el('div', 'muted small', 'Schema 校验失败时先修复 JSON，不要进入 Review UI。'));
}

function clearError() {
  const box = $('#start-error');
  box.classList.add('hidden');
  clear(box);
}

function applyLoadResult(result) {
  if (!result) return { applied: false, reason: 'empty-result' };
  if (result.canceled) return { applied: false, reason: 'canceled' };
  if (!result.ok) {
    showError(result.errors, result.stage);
    return { applied: false, reason: `validation-failed:${result.stage}` };
  }
  clearError();
  bundleLoadRequest++;
  state.inspectionRequest++;state.inspectionOrigin=null;
  state.sessionToken=result.sessionToken||null;state.bundleInfo=result.bundleInfo||null;
  state.source={loaded:false,document:null,sections:[],labels:[],error:null};
  state.l0Path=null;state.l0ViewModel=result.l0ViewModel||null;state.l1Topics=result.l1Topics||null;state.l1Topic=null;
  state.model = result.model;
  state.l2ViewModel = result.l2ViewModel;
  state.humanReview = result.humanReview;
  state.modelPath = result.modelPath;
  state.humanReviewPath = result.humanReviewPath;
  state.expanded = {};
  state.blockExpanded = {};
  state.onlyPending = false;
  state.focusedDecisionId = null;
  state.activeBlockId = null;
  state.view = result.bundleInfo && result.l0ViewModel ? 'l0' : 'overview';
  resetReadingNavigation();
  state.dirty = false;
  state.scrollSpyReady = false;
  setSaveState(result.humanReviewExists ? '已加载 human-review.json' : '尚未保存（human-review.json 不存在）');
  state.model.design.warnings = result.warnings || [];

  $('#screen-start').classList.add('hidden');
  $('#screen-review').classList.remove('hidden');
  closeSource();
  $('#fixture-info').textContent = `已加载：${result.modelPath}`;
  render();

  const summary = currentSummary();
  const blocks = allBlocks();
  toast(`已加载方案总览：${blocks.length} 个区块，需要你决定 ${summary.decisions.counts.pending} 件事`);
  return {
    applied: true,
    decisions: (state.model.decisions || []).length,
    rootDecisions: summary.decisions.rootTotal,
    gaps: (state.model.gaps || []).length,
    openQuestions: (state.model.openQuestions || []).length,
    blockingQuestions: summary.questions.blocking,
    overviewBlocks: blocks.length,
    overviewStages: state.l2ViewModel ? state.l2ViewModel.sections.length : 0,
    summary,
    gate: currentGate(),
    modelPath: state.modelPath,
  };
}

window.__applyLoadResult = applyLoadResult;
window.__state = state;

function bindStartScreen() {
  if($('#btn-open-bundle')) $('#btn-open-bundle').addEventListener('click',()=>loadBundle());
  $('#btn-load-fixture').addEventListener('click', async () => {
    const request=++bundleLoadRequest;
    const result = await api.loadFixture();
    if(request!==bundleLoadRequest)return;
    if (applyLoadResult(result).applied && !state.markdown) {
      const md = await api.readDefaultMarkdown();
      if (md && md.ok) {
        state.markdown = md;
        $('#md-info').textContent = `使用测试样本：${md.name}（${md.lines} 行）`;
      }
    }
  });

  $('#btn-open-json').addEventListener('click', async () => {
    const request=++bundleLoadRequest;
    const result = await api.openDesignJson();
    if(request===bundleLoadRequest)applyLoadResult(result);
  });

  // Feature 08 · 打开 framework-map.json（L0 视图；不调用模型）
  if ($('#btn-open-l0')) {
    $('#btn-open-l0').addEventListener('click', () => { loadL0(); });
  }

  $('#btn-pick-markdown').addEventListener('click', async () => {
    const md = await api.openMarkdown();
    if (md && md.ok) {
      state.markdown = md;
      $('#md-info').textContent = `已选择：${md.name}（${md.lines} 行）${md.path}`;
    }
  });

  $('#btn-use-default-markdown').addEventListener('click', async () => {
    const md = await api.readDefaultMarkdown();
    if (md && md.ok) {
      state.markdown = md;
      $('#md-info').textContent = `使用测试样本：${md.name}（${md.lines} 行）`;
    }
  });
}

function bindReviewScreen() {
  $('#btn-explore').addEventListener('click',()=>{const item=state.exploreProjection?.catalog.find(e=>e.ref.kind+':'+e.ref.id===$('#explore-entity').value);if(item)openExplore(item.ref);});
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view;
      // L0 可以**独立**打开（首屏直接开图，不必先加载 design-review.json）；
      // 另外两页依赖 design-review.json —— 未加载时不要切到一个渲染不出来的空视图。
      if (next !== 'l0' && !state.model) {
        toast('请先在首屏加载「结构化分析结果」（design-review.json）', true);
        return;
      }
      navigation.enter({type:'view',view:next});
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!target || !target.closest) return;

    const actionBtn = target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const bucket = actionBtn.dataset.bucket === 'openQuestions' ? 'openQuestions' : 'decisions';
      const id = actionBtn.dataset.id;
      if (!state.humanReview[bucket]) state.humanReview[bucket] = {};
      const entry = state.humanReview[bucket][id] || (state.humanReview[bucket][id] = { status: 'pending', comment: '' });
      entry.status = action;
      state.dirty = true;
      setSaveState('有未保存修改');
      render();
      return;
    }

    // 关联对象 chip：点 Decision 编号跳到决策清单
    const objChip = target.closest('.obj-chip');
    if (objChip) {
      const id = objChip.dataset.objId;
      if (id && id.startsWith('DEC-')) openDecision(id);
      return;
    }
  });

  $('#source-close').addEventListener('click',()=>state.inspectionOrigin?closeInspection():closeSource(true));

  $('#btn-save').addEventListener('click', async () => {
    const token=state.sessionToken,model=state.model;
    const reviewSnapshot=JSON.stringify(state.humanReview);
    const result = await api.saveHumanReview(state.humanReview,undefined,token);
    if(token!==state.sessionToken || model!==state.model) return;
    if (!result.ok) {
      toast(`保存失败：${(result.errors || []).join('; ')}`, true);
      return;
    }
    if(JSON.stringify(state.humanReview)!==reviewSnapshot){toast('已保存提交的内容，期间的新修改仍未保存。');return;}
    state.humanReview = result.humanReview;
    state.humanReviewPath = result.path;
    state.dirty = false;
    setSaveState(`已保存（reviewVersion ${result.humanReview.reviewVersion}）`);
    render();
    toast(`已保存 ${result.path}`);
  });

  $('#btn-reveal').addEventListener('click', async () => {
    await api.revealHumanReview();
  });

  $('#btn-reload').addEventListener('click', async () => {
    if (state.dirty && !window.confirm('有未保存的人工审核修改，重新加载会丢弃它们。继续？')) return;
    if(state.bundleInfo) {await loadBundle(state.bundleInfo.manifestPath);return;}
    const request=++bundleLoadRequest;
    const result = await api.loadDesignPath(state.modelPath);
    if(request===bundleLoadRequest)applyLoadResult(result);
  });

  $('#btn-back').addEventListener('click', () => {
    if (state.dirty && !window.confirm('有未保存的人工审核修改，返回会丢弃它们。继续？')) return;
    $('#screen-review').classList.add('hidden');
    $('#screen-start').classList.remove('hidden');
    resetReadingNavigation();closeInspection(false);
  });

  document.addEventListener('keydown', (event) => {
    if ($('#screen-review').classList.contains('hidden')) return;
    if(event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.target?.closest('input,textarea,select,[contenteditable]'))return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if(state.inspectionOrigin)closeInspection();
      else if(!$('#source-panel').classList.contains('hidden'))closeSource(true);
      else if(state.view==='explore')navigation.back(true);
      else if(navigation.size)navigation.back();
      event.preventDefault();return;
    }
    if (key === 'g' || key === 'd') {
      // 与导航同一守卫：L0 可以独立打开，另外两页需要 design-review.json
      if (!state.model) {
        event.preventDefault();
        toast('请先在首屏加载「结构化分析结果」（design-review.json）', true);
        return;
      }
      event.preventDefault();
      navigation.enter({type:'view',view:key==='g'?'overview':'decisions'});
      return;
    }
    if (state.view !== 'decisions') return;
    const action = KEY_TO_ACTION[key];
    if (!action) return;
    const decisions = state.model.decisions || [];
    const target = decisions.find((d) => d.id === state.focusedDecisionId) || decisions.find((d) => statusOf(d.id) === 'pending');
    if (!target) {
      toast('没有可表态的决策');
      return;
    }
    event.preventDefault();
    state.focusedDecisionId = target.id;
    setDecisionStatus(target.id, action);
    toast(`${target.id} → ${STATUS_CHIP_LABELS[action]}`);
  });

  window.addEventListener('beforeunload', (event) => {
    if (state.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

async function main() {
  bindStartScreen();
  bindReviewScreen();
  const paths = await api.paths();
  $('#fixture-info').textContent = `默认 fixture：${paths.defaultFixture}`;
}

main();

let bundleLoadRequest=0;
async function loadBundle(manifestPath) {
 const request=++bundleLoadRequest;const prepared=manifestPath?await api.bundle.loadPath(manifestPath):await api.bundle.open();
 if(request!==bundleLoadRequest){if(prepared.requestToken)await api.bundle.discard({requestToken:prepared.requestToken});return {ok:false,stale:true};}
 if(!prepared.ok){if(!prepared.canceled){showError(prepared.errors,prepared.stage);toast((prepared.errors||[]).join('; '));}return prepared;}
 if(state.dirty && !window.confirm('有未保存的审核修改。放弃这些修改并切换资料包？')) {await api.bundle.discard({requestToken:prepared.requestToken});return {ok:false,canceled:true};}
 const committed=await api.bundle.commit({requestToken:prepared.requestToken});
 if(!committed.ok){toast((committed.errors||[]).join('; '));return committed;}
 applyLoadResult(committed.loadResult);if(!committed.loadResult.l0ViewModel)toast('未提供框架图，当前展示独立区块解释。');return committed.loadResult;
}
function showCoordinate(host,coordinate) {
 host.replaceChildren();host.dataset.coordinateState=coordinate.state;
 if(coordinate.state!=='known'){host.appendChild(el('p','',coordinate.reason||'当前来源无法定位。'));return;}
 host.append(el('p','source-meta',coordinate.title+' · 原文 L'+coordinate.range.startLine+'-'+coordinate.range.endLine),el('pre','source-text',coordinate.text));
}
async function showInspection(blockId,fragmentPath) {
 const token=state.sessionToken,request=++state.inspectionRequest;
 const result=await api.bundle.inspect({sessionToken:token,blockId,...(fragmentPath!==undefined?{fragmentPath}:{})});
 if(token!==state.sessionToken || request!==state.inspectionRequest)return {ok:false,stale:true};
 if(!result.ok){toast((result.errors||[]).join('; '));return result;}
 state.inspectionOrigin=true;state.inspectionSubject={blockId,...(fragmentPath!==undefined?{fragmentPath}:{})};$('#source-panel').classList.remove('hidden');$('#screen-review').classList.add('with-source');clear($('#source-head')).textContent='查出处';
 let coordinateRequest=0;
 window.DesignReviewL3.mountL3Inspector($('#source-body'),result.viewModel,{onClose:()=>closeInspection(),onFragment:()=>openInspection(blockId),onSource:async unit=>{
  state.inspectionCoordinate={namespace:'plan-section',key:unit.section};
  const coordinateToken=++coordinateRequest;
  const source=await api.bundle.source({sessionToken:token,namespace:'plan-section',key:unit.section});
  if(token!==state.sessionToken || request!==state.inspectionRequest || coordinateToken!==coordinateRequest)return;
  showCoordinate($('#l3-source-coordinate'),source.coordinate||{state:'unavailable',reason:(source.errors||[]).join('; ')});
 }});$('#l3-close')?.focus({preventScroll:true});return result;
}
function openInspection(blockId,fragmentPath){return navigation.enter({type:'inspection',blockId,fragmentPath});}
function closeInspection(restore=true) {
 if(restore)return navigation.back();
 state.inspectionRequest++;state.inspectionOrigin=null;state.inspectionSubject=null;state.inspectionCoordinate=null;closeSource();
}
function bindFragmentInspection(host,block) {
 const target=path=>{
  let m;
  if((m=path.match(/^parts\[(\d+)\]$/)))return host.querySelectorAll('.c-prose > p')[+m[1]];
  if((m=path.match(/^lanes\[(\d+)\](?:\.nodes\[(\d+)\]\.(node|edge))?$/))){const lane=host.querySelectorAll('.lane')[+m[1]];if(!lane)return null;return m[2]===undefined?lane.querySelector('.lane-label'):m[3]==='node'?lane.querySelectorAll('.fnode')[+m[2]]:lane.querySelector('.fedge[data-node-index="'+m[2]+'"]');}
  if((m=path.match(/^rows\[(\d+)\]\[(\d+)\]$/)))return host.querySelectorAll('tbody tr')[+m[1]]?.children[+m[2]];
  if((m=path.match(/^columns\[(\d+)\]$/)))return host.querySelectorAll('th')[+m[1]];
  if((m=path.match(/^tiers\[(\d+)\]$/)))return host.querySelectorAll('.rung')[+m[1]];
  if((m=path.match(/^steps\[(\d+)\]$/)))return host.querySelectorAll('.step')[+m[1]];
  if(path==='verdict')return host.querySelector('.verdict');
  if((m=path.match(/^pairs\[(\d+)\]$/)))return host.querySelectorAll('.combo-row')[+m[1]];
  if((m=path.match(/^panels\[(\d+)\](?:\.items\[(\d+)\])?$/))){const panel=host.querySelectorAll('.cl-panel')[+m[1]];return m[2]===undefined?panel?.querySelector('.cl-title'):panel?.querySelectorAll('li')[+m[2]];}
  if((m=path.match(/^sides\[(\d+)\](?:\.lines\[(\d+)\])?$/))){const side=host.querySelectorAll('.diff-col')[+m[1]];return m[2]===undefined?side?.querySelector('.diff-head'):side?.querySelectorAll('.diff-line')[+m[2]];}
 };
 for(const fragment of block.fragmentEntries||[]){if(!fragment.sourceUnitIds.length)continue;const element=target(fragment.path);if(!element)continue;const button=el('button','fragment-inspect','出处');button.dataset.fragmentPath=fragment.path;button.setAttribute('aria-label','查看'+fragment.kind+'出处');button.addEventListener('click',event=>{event.stopPropagation();openInspection(block.id,fragment.path);});element.append(button);}
}
window.__loadBundle=loadBundle;window.__openInspection=openInspection;window.__closeInspection=closeInspection;

function resetReadingNavigation(){
 state.inspectionOrigin=null;state.inspectionSubject=null;state.inspectionCoordinate=null;state.readingTopicId=null;state.readingBlockId=null;
 navigation.reset({key:state.sessionToken||'legacy-'+(++legacyNavigationSession),elementIds:state.l0ViewModel?.elements.map(e=>e.id)||[],blockIds:allBlocks().map(b=>b.id)});
 state.focusRef=null;state.readingAddress=null;state.exploreProjection=window.ExploreProjection.createExploreProjection(state.l0ViewModel);populateExploreEntry();
}
function domLocation(node){
 if(!node||node===document.body)return null;
 if(node.id)return {id:node.id};
 const root=node.closest('#main,#source-body,#screen-review');if(!root)return null;
 const path=[];let current=node;while(current!==root){path.unshift([...current.parentElement.children].indexOf(current));current=current.parentElement;}
 return {root:root.id,path};
}
function locateDOM(location){
 if(!location)return null;if(location.id)return document.getElementById(location.id);
 let node=document.getElementById(location.root);for(const i of location.path)node=node?.children[i];return node;
}
function captureReadingFrame(){
 const blockId=state.inspectionSubject?.blockId||state.readingBlockId||state.activeBlockId||allBlocks()[0]?.id;
 const address=state.view==='explore'&&state.readingAddress?{...state.readingAddress}:{sessionKey:navigation.sessionKey,level:state.inspectionSubject?'L3':state.view==='l1'?'L1':state.view==='overview'&&blockId?'L2':'L0'};
 if(state.readingTopicId||state.l1Topic?.topic.id)address.topicId=state.readingTopicId||state.l1Topic.topic.id;
 if(['L2','L3'].includes(address.level))address.blockId=blockId;
 const selected=window.L0Map.getSelection($('#main'));if(selected?.kind==='element')address.elementId=selected.id;
 const context={view:state.view,focusRef:state.focusRef?{...state.focusRef}:null,readingAddress:state.readingAddress?{...state.readingAddress}:null,topicId:state.l1Topic?.topic.id||null,readingTopicId:state.readingTopicId,readingBlockId:state.readingBlockId,
  l0View:state.l0View,l0Panel:window.L0Map.getPanelState($('#main')),selection:selected,l1Selection:window.L1TopicView.getSelection($('#main')),l1Detail:window.L1TopicView.getDetailState($('#main')),canonicalElementId:$('#main [data-canonical-element]:not([hidden])')?.dataset.canonicalElement||null,blockExpanded:{...state.blockExpanded},expanded:{...state.expanded},onlyPending:state.onlyPending,focusedDecisionId:state.focusedDecisionId,
  activeBlockId:state.activeBlockId,inspection:state.inspectionSubject?{...state.inspectionSubject}:null,coordinate:state.inspectionCoordinate?{...state.inspectionCoordinate}:null,
  details:[...document.querySelectorAll('#main details,#source-body details')].map(n=>({location:domLocation(n),open:n.open})),
  focus:domLocation(document.activeElement),scroll:[...document.querySelectorAll('#main,#main .l0-graph-wrap,#main .l0-nav,#main .l0-panel-scroll,#main .l1-graph-wrap,#main .l1-detail-body,#source-body')].map(n=>({location:domLocation(n),top:n.scrollTop,left:n.scrollLeft})),windowScroll:{x:window.scrollX,y:window.scrollY},hash:location.hash};
 return {address,context};
}
function updateNavigationControls(){
 for(const back of document.querySelectorAll('#reading-back,#l1-back'))back.hidden=!navigation.size;
 const node=document.getElementById('reading-location');if(!node)return;
 const label=state.inspectionSubject?'出处 · '+state.inspectionSubject.blockId:state.view==='explore'?'探索关系 · '+state.focusRef?.id:state.view==='l1'?'主题 · '+state.l1Topic?.topic.title:state.view==='l0'?'框架图':state.view==='decisions'?'决策清单':'解释区块'+(state.readingBlockId?' · '+state.readingBlockId:'');
 if(node.textContent!==label)node.textContent=label;
}
function showReadingAction(action){
 if(action.type==='explore'){
  const vm=state.exploreProjection?.project(action.ref);if(!vm?.ok)return vm||{ok:false,reason:'no-map'};
  if(state.view!=='explore')state.readingAddress=captureReadingFrame().address;
  closeInspection(false);state.focusRef={...action.ref};state.view='explore';render();return {ok:true};
 }
 if(action.type==='inspection')return showInspection(action.blockId,action.fragmentPath);
 if(action.type==='topic'&&!state.l1Topics?.[action.id])return {ok:false,reason:'unknown-topic'};
 if(action.type==='block'&&!allBlocks().some(b=>b.id===action.id))return {ok:false,reason:'unknown-block'};
 if(!['topic','block','canonical','view'].includes(action.type))return {ok:false,reason:'unsupported'};
 closeInspection(false);
 if(action.type==='topic'){
  const topic=state.l1Topics?.[action.id];if(!topic)return {ok:false,reason:'unknown-topic'};
  state.l1Topic=topic;state.readingTopicId=action.id;state.readingBlockId=null;state.view='l1';render();$('#main').scrollTop=0;$('#main').scrollLeft=0;$('#l1-back')?.focus({preventScroll:true});return {ok:true};
 }
 if(action.type==='block'||(action.type==='canonical'&&action.address.level==='L2')){
  const id=action.id||action.address.blockId;if(!allBlocks().some(b=>b.id===id))return {ok:false,reason:'unknown-block'};
  state.readingTopicId=action.topicId||null;state.l1Topic=action.topicId?state.l1Topics[action.topicId]:null;state.readingBlockId=id;state.view='overview';state.blockExpanded[id]=true;render();
  const target=document.getElementById('block-'+id);target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});return {ok:true};
 }
 if(action.type==='canonical'){
  state.readingTopicId=null;state.l1Topic=null;state.readingBlockId=null;state.view='l0';state.l0View='reading';render();
  const target=window.L0Map.revealElement($('#main'),action.address.elementId);if(!target)return {ok:false,reason:'unavailable'};
  target.focus({preventScroll:true});target.scrollIntoView({block:'start'});return {ok:true};
 }
 if(action.type==='view'){state.view=action.view;state.readingTopicId=null;state.l1Topic=null;state.readingBlockId=null;render();return {ok:true};}
 return {ok:false,reason:'unsupported'};
}
function restoreReadingFrame(frame,isCurrent){
 const c=frame.context;state.view=c.view;state.focusRef=c.focusRef;state.readingAddress=c.readingAddress;state.l1Topic=c.topicId?state.l1Topics?.[c.topicId]:null;
 state.readingTopicId=c.readingTopicId;state.readingBlockId=c.readingBlockId;state.l0View=c.l0View;state.blockExpanded={...c.blockExpanded};state.expanded={...c.expanded};
 state.onlyPending=c.onlyPending;state.focusedDecisionId=c.focusedDecisionId;state.activeBlockId=c.activeBlockId;closeInspection(false);render();
 const generation=navigation.generation;
 const finish=()=>{
  if(!isCurrent()||generation!==navigation.generation)return {ok:false,reason:'stale'};
  window.L0Map.restoreSelection($('#main'),c.selection);
  window.L1TopicView.restoreSelection($('#main'),c.l1Selection);
  window.L1TopicView.restoreDetailState($('#main'),c.l1Detail);
  // A canonical element is a visible subject, not just the hidden Review card.
  if(c.canonicalElementId)window.L0Map.revealElement($('#main'),c.canonicalElementId);
  window.L0Map.restorePanelState($('#main'),c.l0Panel);
  for(const detail of c.details){const node=locateDOM(detail.location);if(node?.tagName==='DETAILS')node.open=detail.open;}
  locateDOM(c.focus)?.focus({preventScroll:true});
  const scroll=()=>{if(!isCurrent()||generation!==navigation.generation)return;for(const item of c.scroll){const node=locateDOM(item.location);if(node){node.scrollTop=item.top;node.scrollLeft=item.left;}}window.scrollTo(c.windowScroll.x,c.windowScroll.y);};
  scroll();requestAnimationFrame(scroll);return {ok:true};
 };
 if(c.inspection)return showInspection(c.inspection.blockId,c.inspection.fragmentPath).then(async result=>{
  if(!isCurrent()||generation!==navigation.generation||!result.ok)return {ok:false,reason:'stale'};
  if(c.coordinate){
   state.inspectionCoordinate=c.coordinate;const request=state.inspectionRequest,coordinate=state.inspectionCoordinate;
   const response=await api.bundle.source({sessionToken:state.sessionToken,...c.coordinate});
   if(!isCurrent()||generation!==navigation.generation||request!==state.inspectionRequest||coordinate!==state.inspectionCoordinate||!$('#l3-source-coordinate'))return {ok:false,reason:'stale'};
   showCoordinate($('#l3-source-coordinate'),response.coordinate||{state:'unavailable'});
  }
  return finish();
 });
 return finish();
}
window.__readingNavigation=navigation;

function openExplore(ref){
 const available=state.exploreProjection?.project(ref);if(!available?.ok){toast('这个对象当前不能作为探索焦点。');return available||{ok:false,reason:'no-map'};}
 const result=navigation.enter({type:'explore',ref});if(result?.ok===false)toast('这个对象当前不能作为探索焦点。');return result;
}
function populateExploreEntry(){
 const select=clear($('#explore-entity'));for(const item of state.exploreProjection?.catalog||[]){const option=el('option','',item.label+(item.available?'':'（不可作为焦点）'));option.value=item.ref.kind+':'+item.ref.id;option.disabled=!item.available;select.append(option);}
 const first=state.exploreProjection?.catalog.find(e=>e.available);if(first)select.value=first.ref.kind+':'+first.ref.id;
 updateExploreEntry();
}
function updateExploreEntry(){
 const available=Boolean(state.exploreProjection?.catalog.some(e=>e.available));$('#btn-explore').disabled=!available;$('#explore-entity').disabled=!available;
 $('#explore-availability').textContent=available?'显式选择图中的对象，不推断它与区块的关系。':'未提供可探索的框架图。';
}
function viewExplore(){
 $('#main').__l1Abort?.abort();
 const vm=state.exploreProjection.project(state.focusRef);if(!vm.ok){clear($('#main')).textContent='当前对象不可探索。';return;}
 window.ExploreView.mount($('#main'),vm,{onFocus:openExplore,onBack:()=>navigation.back(true),onPrevious:()=>navigation.back(),canPrevious:navigation.size>0,
  onReading:ref=>navigation.resolve(ref),canReadBlock:id=>allBlocks().some(b=>b.id===id),onBlock:id=>{const result=navigation.resolve({kind:'block',id});if(result?.ok===false)toast('当前未加载这个区块的阅读资料。');return result;}});
}
window.__openExplore=openExplore;
