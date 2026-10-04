'use strict';

/**
 * Feature 08 · Phase 4.1 · L0 graph layout —— 确定性、零依赖、纯函数
 *
 * 用户裁决（Track A Round 0）修正了对第一条原则的理解：
 *   「布局不能创造原数据没有的语义；但布局完全可以利用已有 edge 帮用户看懂语义。」
 *
 * 所以本模块只做一件事：**把 edges 变成看得见的位置关系。**
 *
 * ## 硬约束（违反即作废）
 *   · 语义只来自 `edge` / `attachment`；坐标只用于减少交叉、便于阅读。
 *   · **不造线**：画出的线数 == edges 数；没有 edge 就没有线，没有主轴就不发明主轴。
 *   · **不丢元素**：每个 element 要么是卡片节点，要么挂在宿主节点上的角标（badge）。
 *   · 自环画成自环；`relationGap` 永远不是线（它不在本模块的输入里）。
 *   · **确定性**：同一 vm → 同一输出（顺序 / 坐标 / 路径逐字节一致），不依赖时间与随机。
 *   · 纯函数：不修改输入（调用前后 JSON 完全一致）。
 *
 * ## 布局算法（为什么是这个）
 *   element 之间是任意有向图：D 是网状、E 是分叉、有的样本带环。做法是经典分层：
 *     1. Tarjan 求强连通分量（环先缩成一个点，保证后面一定是 DAG）
 *     2. 最长路径分层（层 = "它在依赖链上的深度"）
 *     3. 层内重心法排序（4 轮上下扫描）+ 确定性 tie-break（原始顺序 → id）
 *   **坐标只承担"减少交叉"，不承担任何语义**：同层不等于同类，邻近不等于相关。
 *   没有 edge 的元素不塞进任何层，单独放在图下方的"不在任何 edge 上"带里 —— 这是事实标注，不是暗示。
 */

const GRID = {
  NODE_W: 236,   // 节点宽（固定，标题 1 行 + 副标题最多 2 行）
  NODE_H: 96,    // 节点高（固定 → 可以用统一网格，边路由才可能干净）
  COL_GAP: 76,
  ROW_GAP: 84,
  PAD: 24,
  ORPHAN_COLS: 4, // 完全不在 edge 上的元素，按这个列数收在图下方的带里
};

/** type → 一个非常轻的角标（用户提案的词汇：◇ 数据 / ▶ 流程 / ⚑ 规则） */
const TYPE_GLYPH = {
  artifact: '◇', process: '▶', constraint: '⚑', state: '◆', concept: '○', component: '▣',
};
const TYPE_GLYPH_LABEL = {
  artifact: '数据', process: '流程', constraint: '规则', state: '状态', concept: '概念', component: '组件',
};

/**
 * 从元素原始 label 里**切**出「标题 / 副标题」，不编造任何词。
 *   `UserProfile（跨目标用户上下文与表达/排期偏好）` → UserProfile ／ 跨目标用户上下文与表达/排期偏好
 *   `部署流程：node --check → …`                      → 部署流程   ／ node --check → …
 *   `执行历史不可改写、不得静默丢失与显式失败`          → 整句      ／ （空）
 *   `planner 临时输入上下文（…）`                      → planner 临时输入上下文 ／ …
 */
/**
 * Reading 标题的**显示前置收敛**：去掉开头的范围标签（`F13–F16 …` → `…`）。
 * 只影响 Reading 的标题；副标题、hover 的完整 label、Review View 全部保留全称。
 * （用户 Track A Round 0 明确要求：第一眼要 `售后/退款云函数集`，不要 `F13–F16 售后/退款云函数集`。）
 */
const SCOPE_PREFIX = /^F\d{1,3}(?:\s*[–—-]\s*F?\d{1,3})?\s+/;

function displayFields(el) {
  const d = displayFieldsRaw(el);
  const stripped = d.title.replace(SCOPE_PREFIX, '').trim();
  return { title: stripped || d.title, subtitle: d.subtitle };
}

function displayFieldsRaw(el) {
  const raw = String((el && el.label) == null ? '' : el.label).trim();
  if (!raw) return { title: String((el && el.id) || ''), subtitle: '' };

  // 按**最先出现的分隔符**切（不是按分隔符种类排序）：
  //   `部署流程：node --check → npm 构建（h5 / mp-weixin）` → 标题 `部署流程`（先遇到冒号）
  //   `UserProfile（跨目标用户上下文与表达/排期偏好）`      → 标题 `UserProfile`（先遇到括号）
  const paren = raw.search(/[（(]/);
  const colon = raw.search(/[：:]/);
  let cut = -1;
  let kind = null;
  if (paren >= 0 && (colon < 0 || paren < colon)) { cut = paren; kind = 'paren'; }
  else if (colon >= 0) { cut = colon; kind = 'colon'; }

  if (cut > 0) {
    const title = raw.slice(0, cut).trim();
    if (title.length <= 42) {
      if (kind === 'paren') {
        const close = raw.slice(cut + 1).search(/[）)]/);
        const inner = close >= 0 ? raw.slice(cut + 1, cut + 1 + close) : raw.slice(cut + 1);
        const tail = close >= 0 ? raw.slice(cut + 1 + close + 1).trim() : '';
        const subtitle = [inner.trim(), tail].filter(Boolean).join(' ');
        return { title, subtitle };
      }
      return { title, subtitle: raw.slice(cut + 1).trim() };
    }
  }

  // ③ 本来就短：整句就是标题
  if (raw.length <= 30) return { title: raw, subtitle: '' };

  // ④ 长句无可用分隔：用 id 的可读名做标题（id 本来就在数据里，不算编造），全句降为副标题
  const idName = String((el && el.id) || '').replace(/^[A-Z]{1,3}-/, '');
  if (/^[A-Za-z][A-Za-z0-9_]{2,}$/.test(idName)) return { title: idName, subtitle: raw };

  return { title: raw.slice(0, 29) + '…', subtitle: '' };
}

/* ------------------------------------------------------------------ *
 * 图算法
 * ------------------------------------------------------------------ */

/** 层内重心法排序（4 轮：下→上→下→上），tie-break 保证确定性 */
function orderLayers(layers, preds, succs, orderIndex) {
  const posIn = (layerArr) => {
    const p = new Map();
    layerArr.forEach((id, i) => p.set(id, i));
    return p;
  };
  const bary = (id, refPos, rel) => {
    const ns = (rel.get(id) || []).filter((x) => refPos.has(x));
    if (!ns.length) return null;
    let sum = 0;
    ns.forEach((x) => { sum += refPos.get(x); });
    return sum / ns.length;
  };

  for (let sweep = 0; sweep < 4; sweep += 1) {
    const down = sweep % 2 === 0;
    const idxs = [...layers.keys()];
    if (!down) idxs.reverse();
    for (const li of idxs) {
      const refLayer = down ? layers[li - 1] : layers[li + 1];
      if (!refLayer) continue;
      const refPos = posIn(refLayer);
      const rel = down ? preds : succs;
      const cur = layers[li];
      const keyed = cur.map((id, i) => {
        const b = bary(id, refPos, rel);
        return { id, i, b: b == null ? i : b }; // 无邻居者保持原位
      });
      keyed.sort((a, b) => (a.b - b.b) || (a.i - b.i) || (orderIndex.get(a.id) - orderIndex.get(b.id)));
      layers[li] = keyed.map((k) => k.id);
    }
  }
}

/** 相邻两层之间的交叉数（用于证明"排序让交叉变少"，不是用来好看） */
function countCrossings(layers, edges, layerOf, posOf) {
  let total = 0;
  for (let li = 0; li + 1 < layers.length; li += 1) {
    const seg = edges.filter((e) => layerOf.get(e.from) === li && layerOf.get(e.to) === li + 1);
    for (let i = 0; i < seg.length; i += 1) {
      for (let j = i + 1; j < seg.length; j += 1) {
        const a1 = posOf.get(seg[i].from); const a2 = posOf.get(seg[i].to);
        const b1 = posOf.get(seg[j].from); const b2 = posOf.get(seg[j].to);
        if ((a1 - b1) * (a2 - b2) < 0) total += 1;
      }
    }
  }
  return total;
}

/* ------------------------------------------------------------------ *
 * 主入口
 * ------------------------------------------------------------------ */
function computeL0Layout(vm, opts = {}) {
  const g = Object.assign({}, GRID, vm.readingGuide?.state==='present'?{NODE_H:144}:{}, opts.grid || {});
  const colPitch = g.NODE_W + g.COL_GAP;
  const rowPitch = g.NODE_H + g.ROW_GAP;

  const elements = (vm && vm.elements) || [];
  const allEdges = (vm && vm.edges) || [];
  const attachments = (vm && vm.attachments) || [];
  const byId = new Map(elements.map((e) => [e.id, e]));
  const orderIndex = new Map(elements.map((e, i) => [e.id, i]));

  /* ① 谁上墙（卡片节点）、谁做角标（badge）：
   *    作为 attachment 出现、且自身不在任何 edge 上的元素（约束），
   *    不单独占位，而是挂在它的宿主节点上 —— 但**绝不被丢弃**。
   *
   *    ⚠️ 一个真实的丢元素场景：约束挂到**另一个约束**上（A→hosts[B]，B→hosts[E-01]）。
   *    如果只看"它是不是 attachment"，A 会因为宿主 B 不占节点位而消失。
   *    所以这里做一遍定点：宿主里必须至少有一个**真正占位的节点**，否则它自己升为节点。 */
  const onEdge = new Set();
  allEdges.forEach((ed) => { onEdge.add(ed.from); onEdge.add(ed.to); });
  const hostsOf = new Map();
  attachments.forEach((a) => {
    if (a && a.elementId && byId.has(a.elementId)) hostsOf.set(a.elementId, (a.hosts || []).slice());
  });
  const badgeOnly = new Set();
  hostsOf.forEach((_hosts, id) => { if (!onEdge.has(id)) badgeOnly.add(id); });
  for (let pass = 0; pass < badgeOnly.size + 1; pass += 1) {
    let changed = false;
    for (const id of [...badgeOnly]) {
      const hosts = hostsOf.get(id) || [];
      const anchored = hosts.some((h) => byId.has(h) && !badgeOnly.has(h));
      if (!anchored) { badgeOnly.delete(id); changed = true; }
    }
    if (!changed) break;
  }
  const cardEls = elements.filter((e) => !badgeOnly.has(e.id));
  const cardIds = cardEls.map((e) => e.id);
  const cardSet = new Set(cardIds);

  /* ② 邻接（只含卡片节点）+ 端点缺失的 edge 记账（不静默吞掉） */
  const adj = new Map(cardIds.map((id) => [id, []]));
  const preds = new Map(cardIds.map((id) => [id, []]));
  const succs = new Map(cardIds.map((id) => [id, []]));
  const edges = [];
  let skippedEdges = 0;
  for (const ed of allEdges) {
    if (!cardSet.has(ed.from) || !cardSet.has(ed.to)) { skippedEdges += 1; continue; }
    edges.push(ed);
    if (ed.from !== ed.to) { adj.get(ed.from).push(ed.to); adj.get(ed.to).push(ed.from); }
    succs.get(ed.from).push(ed.to);
    preds.get(ed.to).push(ed.from);
  }

  /* ③ 连通分量（用无向邻接）：≥2 个节点的是"有关系的块"，单点的是"不在任何 edge 上" */
  const seen = new Set();
  const components = [];
  for (const id of cardIds) {
    if (seen.has(id)) continue;
    const comp = [];
    const queue = [id];
    seen.add(id);
    while (queue.length) {
      const v = queue.shift();
      comp.push(v);
      for (const w of adj.get(v) || []) if (!seen.has(w)) { seen.add(w); queue.push(w); }
    }
    comp.sort((a, b) => orderIndex.get(a) - orderIndex.get(b));
    components.push(comp);
  }
  const bigComps = components.filter((c) => c.length > 1);
  const orphans = components.filter((c) => c.length === 1).map((c) => c[0]);

  /* ④ 每个"有关系的块"：破环 → 最长路径分层 → 层内排序
   *
   * 为什么不是 SCC 缩点：E 的 F10 样本里 7 个节点是一个**真环**
   * （E-01→E-02→E-04→E-07→E-08→E-03→E-01）。缩点会把整块压成一层，
   * 结果 8 条边全画成同层横线 —— 算法没错，但用户第一眼什么也看不出来。
   * 改用经典的**破环**：DFS 遇到指回灰色节点的边就把它当回边翻转，
   * 在翻转后的 DAG 上分层；回边照原方向画成"返回箭头"。
   * 于是环变得看得见（回边数量会记进 stats），而不是把环压平。 */
  const nodeGeom = new Map();
  let cursorX = g.PAD;
  let maxBottom = g.PAD;
  let totalCrossings = 0;
  let initialCrossings = 0;
  const compStats = [];

  for (const comp of bigComps) {
    const cset = new Set(comp);
    const compEdges = edges.filter((e) => cset.has(e.from) && cset.has(e.to) && e.from !== e.to);

    // 破环：DFS 三色，遇到指回灰色节点的边 → 记为回边
    const color = new Map();
    const reversed = new Set();
    const directed = new Map(comp.map((id) => [id, []]));
    for (const e of compEdges) directed.get(e.from).push(e.to);
    for (const root of comp) {
      if (color.get(root)) continue;
      const stack = [[root, 0]];
      color.set(root, 1);
      while (stack.length) {
        const frame = stack[stack.length - 1];
        const v = frame[0];
        const nbrs = directed.get(v);
        if (frame[1] < nbrs.length) {
          const w = nbrs[frame[1]];
          frame[1] += 1;
          const c = color.get(w) || 0;
          if (c === 1) reversed.add(`${v}->${w}`);
          else if (c === 0) { color.set(w, 1); stack.push([w, 0]); }
        } else {
          color.set(v, 2);
          stack.pop();
        }
      }
    }

    // 在（回边翻转后的）DAG 上做最长路径分层 —— Kahn，确定性
    const indeg = new Map(comp.map((id) => [id, 0]));
    const dagAdj = new Map(comp.map((id) => [id, []]));
    for (const e of compEdges) {
      const flip = reversed.has(`${e.from}->${e.to}`);
      const a = flip ? e.to : e.from;
      const b = flip ? e.from : e.to;
      dagAdj.get(a).push(b);
      indeg.set(b, indeg.get(b) + 1);
    }
    const rank = new Map();
    const queue = comp.filter((id) => indeg.get(id) === 0);
    queue.forEach((id) => rank.set(id, 0));
    for (let qi = 0; qi < queue.length; qi += 1) {
      const v = queue[qi];
      for (const w of dagAdj.get(v)) {
        rank.set(w, Math.max(rank.has(w) ? rank.get(w) : 0, rank.get(v) + 1));
        indeg.set(w, indeg.get(w) - 1);
        if (indeg.get(w) === 0) queue.push(w);
      }
    }
    comp.forEach((id) => { if (!rank.has(id)) rank.set(id, 0); }); // 兜底（理论上不可达）

    const layers = new Map();
    for (const id of comp) {
      const r = rank.get(id);
      if (!layers.has(r)) layers.set(r, []);
      layers.get(r).push(id);
    }
    const layerKeys = [...layers.keys()].sort((a, b) => a - b);
    const ordered = new Map(layerKeys.map((k) => [k, layers.get(k)]));
    // 初始顺序（用于证明排序有效）
    const layerOf0 = new Map();
    const posOf0 = new Map();
    for (const k of layerKeys) ordered.get(k).forEach((id, i) => { layerOf0.set(id, k); posOf0.set(id, i); });
    initialCrossings += countCrossings(layerKeys.map((k) => ordered.get(k)), compEdges, layerOf0, posOf0);

    orderLayers(ordered, preds, succs, orderIndex);
    const layerOf = new Map();
    const posOf = new Map();
    for (const k of layerKeys) ordered.get(k).forEach((id, i) => { layerOf.set(id, k); posOf.set(id, i); });
    totalCrossings += countCrossings(layerKeys.map((k) => ordered.get(k)), compEdges, layerOf, posOf);

    // 摆放：层 = 行，层内序 = 列
    const width = Math.max(...layerKeys.map((k) => ordered.get(k).length)) * colPitch - g.COL_GAP;
    for (const k of layerKeys) {
      ordered.get(k).forEach((id, i) => {
        nodeGeom.set(id, { x: cursorX + i * colPitch, y: g.PAD + k * rowPitch, layer: k, col: i });
      });
      maxBottom = Math.max(maxBottom, g.PAD + k * rowPitch + g.NODE_H);
    }
    compStats.push({ ids: comp.slice(), x: cursorX, width, layers: layerKeys.length });
    cursorX += width + colPitch; // 块之间留一列间距
  }

  /* ⑤ 完全不在 edge 上的元素：图下方单独一带（事实标注，不塞进任何层） */
  let orphanBand = null;
  if (orphans.length) {
    const y0 = maxBottom + g.ROW_GAP + g.PAD;
    orphans.forEach((id, i) => {
      const col = i % g.ORPHAN_COLS;
      const row = Math.floor(i / g.ORPHAN_COLS);
      nodeGeom.set(id, { x: g.PAD + col * colPitch, y: y0 + row * rowPitch, layer: -1, col });
    });
    const rows = Math.ceil(orphans.length / g.ORPHAN_COLS);
    orphanBand = { y: y0 - g.ROW_GAP / 2, count: orphans.length, rows };
    maxBottom = Math.max(maxBottom, y0 + (rows - 1) * rowPitch + g.NODE_H);
  }

  /* ⑥ 节点（含展示字段与角标） */
  const nodes = cardEls.map((e) => {
    const geom = nodeGeom.get(e.id) || { x: g.PAD, y: g.PAD, layer: -1, col: 0 };
    const df = displayFields(e);
    const badgeIds = (e.attachmentAsHost || []).map((a) => a.elementId);
    return {
      id: e.id,
      index: orderIndex.get(e.id),
      type: e.type,
      role: e.role,
      glyph: TYPE_GLYPH[e.type] || '·',
      title: df.title,
      subtitle: df.subtitle,
      label: e.label,
      x: geom.x, y: geom.y, w: g.NODE_W, h: g.NODE_H,
      layer: geom.layer, col: geom.col,
      hasEdges: onEdge.has(e.id),
      badgeIds,
      badgeLabels: (e.attachmentAsHost || []).map((a) => a.elementLabel || a.elementId),
    };
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  /* 角标节点：约束元素本身（不出现在节点墙上，但没有丢） */
  const badges = elements.filter((e) => badgeOnly.has(e.id)).map((e) => {
    const df = displayFields(e);
    const a = attachments.find((x) => x.elementId === e.id) || {};
    return {
      id: e.id, type: e.type, title: df.title, subtitle: df.subtitle, label: e.label,
      hosts: (a.hosts || []).slice(),
    };
  });

  /* ⑦ 边路径：只有 edge 才有线 */
  const paths = [];
  for (let i = 0; i < edges.length; i += 1) {
    const ed = edges[i];
    const a = nodeById.get(ed.from);
    const b = nodeById.get(ed.to);
    if (!a || !b) { skippedEdges += 1; continue; }
    let kind = 'forward';
    let d = '';
    let labelX = 0;
    let labelY = 0;
    if (ed.selfLoop || ed.from === ed.to) {
      kind = 'self';
      const x1 = a.x + a.w - 26;
      const yTop = a.y + a.h * 0.30;
      const yBot = a.y + a.h * 0.70;
      const bulge = 54;
      d = `M ${x1} ${yTop} C ${a.x + a.w + bulge} ${a.y + a.h * 0.02}, ${a.x + a.w + bulge} ${a.y + a.h * 0.98}, ${x1} ${yBot}`;
      labelX = a.x + a.w + 14;
      labelY = a.y + a.h * 0.5;
    } else if (b.y > a.y) {
      kind = 'forward';
      const x1 = a.x + a.w / 2; const y1 = a.y + a.h;
      const x2 = b.x + b.w / 2; const y2 = b.y;
      const dy = (y2 - y1) * 0.45;
      d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
      labelX = (x1 + x2) / 2; labelY = (y1 + y2) / 2;
    } else if (b.y < a.y) {
      // 回边（环）：从上方出、向下进，并向外侧鼓一点，避免压在中间节点上
      kind = 'back';
      const x1 = a.x + a.w / 2; const y1 = a.y;
      const x2 = b.x + b.w / 2; const y2 = b.y + b.h;
      const bulge = 46 + (i % 3) * 22;
      const side = x1 <= x2 ? -1 : 1;
      d = `M ${x1} ${y1} C ${x1 + side * bulge} ${y1 - 34}, ${x2 + side * bulge} ${y2 + 34}, ${x2} ${y2}`;
      labelX = (x1 + x2) / 2 + side * (bulge * 0.8); labelY = (y1 + y2) / 2;
    } else {
      // 同层：横向走
      kind = 'same-layer';
      const leftFirst = a.x <= b.x;
      const sx = leftFirst ? a.x + a.w : a.x;
      const tx = leftFirst ? b.x : b.x + b.w;
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h / 2;
      const cx = (tx - sx) * 0.4;
      d = `M ${sx} ${y1} C ${sx + cx} ${y1}, ${tx - cx} ${y2}, ${tx} ${y2}`;
      labelX = (sx + tx) / 2; labelY = (y1 + y2) / 2 - 6;
    }
    paths.push({
      edgeIndex: ed.edgeIndex ?? i,
      id: ed.id || `${ed.from}->${ed.to}`,
      from: ed.from, to: ed.to, type: ed.type, label: ed.label || '',
      selfLoop: !!ed.selfLoop || ed.from === ed.to,
      kind, d, labelX, labelY,
    });
  }

  const width = Math.max(cursorX - colPitch + g.PAD, ...nodes.map((n) => n.x + n.w + g.PAD), g.NODE_W + g.PAD * 2);
  const height = Math.max(maxBottom + g.PAD, g.NODE_H + g.PAD * 2);
  const layerCount = nodes.reduce((m, n) => Math.max(m, n.layer + 1), 0);

  return {
    version: 'l0-layout/1',
    grid: g,
    nodes,
    badges,
    edges: paths,
    bounds: { width: Math.ceil(width), height: Math.ceil(height) },
    components: compStats,
    orphanBand,
    stats: {
      nodeCount: nodes.length,
      badgeCount: badges.length,
      elementCount: nodes.length + badges.length,
      edgeCount: paths.length,
      skippedEdges,
      isolatedCount: orphans.length,
      layerCount,
      backEdges: paths.filter((p) => p.kind === 'back').length,
      selfLoops: paths.filter((p) => p.selfLoop).length,
      crossings: totalCrossings,
      crossingsBeforeOrdering: initialCrossings,
    },
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeL0Layout, displayFields, GRID, TYPE_GLYPH, TYPE_GLYPH_LABEL };
}
if (typeof window !== 'undefined') {
  window.L0Layout = { computeL0Layout, displayFields, GRID, TYPE_GLYPH, TYPE_GLYPH_LABEL };
}
