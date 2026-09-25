'use strict';

/**
 * Renderer：Design Review（方案总览 + 决策清单）。
 *
 * 约束（agent.md 第二、二十二节）：
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
  model: null,
  humanReview: null,
  modelPath: null,
  humanReviewPath: null,
  markdown: null,
  view: 'overview',
  /** 区块折叠状态：blockId -> boolean。初始值来自 defaultExpanded。 */
  blockExpanded: {},
  /** 决策详情展开状态 */
  expanded: {},
  focusedDecisionId: null,
  onlyPending: false,
  /** 原文回查面板 */
  source: { loaded: false, document: null, sections: [], labels: [], error: null },
  activeBlockId: null,
  dirty: false,
  toastTimer: null,
  scrollSpyReady: false,
};

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
  return (state.model.overview ? state.model.overview.sections : []).flatMap((s) => s.blocks);
}

/* ================================================================== *
 * 方案总览：视觉语法（八种承载形式）
 * ================================================================== */

function renderChipRow(chips) {
  const row = el('div', 'chip-row');
  (chips || []).forEach((id) => {
    const chip = el('span', 'obj-chip', id);
    chip.dataset.objId = id;
    chip.title = id.startsWith('DEC-') ? '点击查看这条决策' : '本条判断的编号';
    row.appendChild(chip);
  });
  return row;
}

function renderSourceTags(block, onOpen) {
  const row = el('div', 'src-tags');
  (block.sources || []).forEach((label) => {
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
  columns.forEach((label) => headRow.appendChild(el('th', '', label)));
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

  const head = el('div', 'block-head');
  head.appendChild(el('span', 'block-id', block.id));
  head.appendChild(el('span', 'block-title', block.title));
  head.appendChild(el('span', 'spacer'));
  head.appendChild(renderSourceTags(block, openSource));

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
    const renderer = CONTENT_RENDERERS[block.content.type];
    if (renderer) {
      body.appendChild(renderer(block.content));
    } else {
      body.appendChild(el('div', 'muted small', `未知承载形式：${block.content.type}`));
    }
    if (block.reviewObjects && block.reviewObjects.length > 0) {
      const foot = el('div', 'block-foot');
      foot.appendChild(el('span', 'block-foot-label', '关联'));
      foot.appendChild(renderChipRow(block.reviewObjects));
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
  (state.model.overview ? state.model.overview.sections : []).forEach((stage) => {
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
  main.appendChild(el('div', 'stage-indicator-start'));
  (state.model.overview ? state.model.overview.sections : []).forEach((stage) => {
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
  const result = await api.loadSource();
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

async function openSource(label) {
  await ensureSourceLoaded();
  renderSourcePanel(label);
}

function closeSource() {
  $('#source-panel').classList.add('hidden');
  $('#screen-review').classList.remove('with-source');
}

function renderSourcePanel(label) {
  const panel = $('#source-panel');
  const body = clear($('#source-body'));
  panel.classList.remove('hidden');
  $('#screen-review').classList.add('with-source');

  const source = state.source;
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
  if (!state.model) return;
  const summary = currentSummary();

  $('#design-title').textContent = state.model.design.title;
  $('#design-id').textContent = state.model.design.id;
  $('#design-status').textContent = state.model.design.status;
  $('#model-path').textContent = state.modelPath || '';
  $('#nav-decision-count').textContent = `待决定 ${summary.decisions.counts.pending}/${summary.decisions.total}`;

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === state.view);
  });
  $('#screen-review').dataset.view = state.view;

  renderGateBadge();
  buildToc();

  if (state.view === 'overview') viewOverview();
  else viewDecisions();
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
  box.appendChild(el('div', 'muted small', 'agent.md 第十四节：Schema 校验失败时先修复 JSON，不要进入 Review UI。'));
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
  state.model = result.model;
  state.humanReview = result.humanReview;
  state.modelPath = result.modelPath;
  state.humanReviewPath = result.humanReviewPath;
  state.expanded = {};
  state.blockExpanded = {};
  state.onlyPending = false;
  state.focusedDecisionId = null;
  state.activeBlockId = null;
  state.view = 'overview';
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
    overviewStages: state.model.overview ? state.model.overview.sections.length : 0,
    summary,
    gate: currentGate(),
    modelPath: state.modelPath,
  };
}

window.__applyLoadResult = applyLoadResult;
window.__state = state;

function bindStartScreen() {
  $('#btn-load-fixture').addEventListener('click', async () => {
    const result = await api.loadFixture();
    if (applyLoadResult(result).applied && !state.markdown) {
      const md = await api.readDefaultMarkdown();
      if (md && md.ok) {
        state.markdown = md;
        $('#md-info').textContent = `使用测试样本：${md.name}（${md.lines} 行）`;
      }
    }
  });

  $('#btn-open-json').addEventListener('click', async () => {
    const result = await api.openDesignJson();
    applyLoadResult(result);
  });

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
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      render();
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

  $('#source-close').addEventListener('click', closeSource);

  $('#btn-save').addEventListener('click', async () => {
    const result = await api.saveHumanReview(state.humanReview);
    if (!result.ok) {
      toast(`保存失败：${(result.errors || []).join('; ')}`, true);
      return;
    }
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
    const result = await api.loadDesignPath(state.modelPath);
    applyLoadResult(result);
  });

  $('#btn-back').addEventListener('click', () => {
    if (state.dirty && !window.confirm('有未保存的人工审核修改，返回会丢弃它们。继续？')) return;
    $('#screen-review').classList.add('hidden');
    $('#screen-start').classList.remove('hidden');
  });

  document.addEventListener('keydown', (event) => {
    if ($('#screen-review').classList.contains('hidden')) return;
    const tag = (event.target && event.target.tagName) || '';
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      closeSource();
      return;
    }
    if (key === 'g') {
      event.preventDefault();
      state.view = 'overview';
      render();
      return;
    }
    if (key === 'd') {
      event.preventDefault();
      state.view = 'decisions';
      render();
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
