#!/usr/bin/env node
'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

/**
 * Feature 08 · L0 View Model Adapter（Phase 1）
 *
 * **纯投影，零推理。** 本模块只做四件事：
 *   ① 原样搬运 Contract 字段（element / edge / attachment / topic / document / meta）
 *   ② 解析引用（edge 端点 → label、attachment → label、topic ↔ element 双向）
 *   ③ 统计事实（计数、自环数、无 element 的 topic 数、超预算数）—— **不做解释**
 *   ④ 汇总审阅信息（relationGap / check-map 摘要）—— 仅在 Review View 使用
 *
 * 明确**不做**（用户冻结的边界）：
 *   ❌ 不推理、不补关系、不修 JSON、不合并同义元素、不删任何 element
 *   ❌ 不因为 >12 就隐藏节点；不因为没有主轴就造一条主轴
 *   ❌ 不把 relationGap 转成 edge；不把 attachment 转成 edge
 *   ❌ 不重命名、不改写 label / statement
 *   ❌ 不计算"布局语义"（谁在谁左边 / 谁比谁重要）
 *
 * 用法：
 *   node scripts/l0-view-model.js --map <framework-map.json> [--check <check-map.txt>] [--out <view-model.json>]
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = resolveRepositoryPath(__dirname, '..');

/* ------------------------------------------------------------------ *
 * 审阅信息：解析 check-map.txt（**只读文本，不重跑校验**）
 * ------------------------------------------------------------------ */
function parseCheckMap(txt) {
  if (!txt) return null;
  const num = (re) => { const m = txt.match(re); return m ? Number(m[1]) : null; };
  const hardLines = [...txt.matchAll(/^\s*✗ (.+)$/gm)].map((m) => m[1].trim());
  const warnLines = [...txt.matchAll(/^\s*! (.+)$/gm)].map((m) => m[1].trim());
  const infoLines = [...txt.matchAll(/^\s*i (.+)$/gm)].map((m) => m[1].trim());
  const status = (txt.match(/状态:\s*(.+)/) || [])[1];
  const skipped = /SKIPPED \(0\)\s*\n\s*（无/.test(txt) ? [] : [...txt.matchAll(/^\s*– (.+)$/gm)].map((m) => m[1].trim());
  return {
    hard: num(/结果:\s*HARD\s*(\d+)/), warn: num(/WARN\s*(\d+)/), info: num(/INFO\s+(\d+)/),
    status: status ? status.trim() : null,
    hardLines, warnLines, infoLines, skipped,
  };
}

/* ------------------------------------------------------------------ *
 * View Model
 * ------------------------------------------------------------------ */
/**
 * @param {object} map 已通过 check-map 的 framework-map（不会被修改）
 * @param {{checkMapText?: string, knownRoles?: string[], budget?: number}} [opts]
 * @returns {object} view model（可直接 JSON 序列化给 renderer）
 */
function buildL0ViewModel(map, opts = {}) {
  if (!map || typeof map !== 'object') throw new Error('framework-map 不是对象');
  const frozen = JSON.parse(JSON.stringify(map)); // 用于最后核对"未修改输入"

  const elements = map.elements || [];
  const edges = map.edges || [];
  const attachments = map.attachments || [];
  const topics = map.topics || [];
  const relationGap = map.relationGap || [];
  const budget = opts.budget || 12;

  /* ① 原样搬运 + ② 解析引用 */
  const elById = new Map(elements.map((e) => [e.id, e]));
  const labelOf = (id) => (elById.get(id) ? elById.get(id).label : `(未解析: ${id})`);

  const vmElements = elements.map((e) => ({
    id: e.id,
    label: e.label,
    type: e.type,
    role: e.role,
    topics: [...(e.topics || [])],
    provenance: {
      sectionRefs: [...(e.sectionRefs || [])],
      sourceUnitIds: [...(e.sourceUnitIds || [])],
    },
    // 参与关系（解析后）
    outgoing: edges.filter((x) => x.from === e.id).map((x) => ({ id: x.id || null, type: x.type, peer: x.to, peerLabel: labelOf(x.to), selfLoop: x.from === x.to, label: x.label || null })),
    incoming: edges.filter((x) => x.to === e.id).map((x) => ({ id: x.id || null, type: x.type, peer: x.from, peerLabel: labelOf(x.from), selfLoop: x.from === x.to, label: x.label || null })),
    attachmentAsElement: attachments.filter((a) => a.elementId === e.id).map((a) => ({ hosts: [...a.attachedTo], hostLabels: a.attachedTo.map(labelOf) })),
    attachmentAsHost: attachments.filter((a) => (a.attachedTo || []).includes(e.id)).map((a) => ({ elementId: a.elementId, elementLabel: labelOf(a.elementId) })),
  }));

  const vmEdges = edges.map((x) => ({
    id: x.id || null,
    from: x.from, to: x.to,
    fromLabel: labelOf(x.from), toLabel: labelOf(x.to),
    type: x.type,
    label: x.label || null,
    note: x.note || null,
    qualifiers: x.qualifiers ? JSON.parse(JSON.stringify(x.qualifiers)) : null,
    selfLoop: x.from === x.to,
  }));

  const vmAttachments = attachments.map((a) => ({
    elementId: a.elementId, elementLabel: labelOf(a.elementId),
    hosts: [...a.attachedTo], hostLabels: a.attachedTo.map(labelOf),
  }));

  // topic → element 反向映射（element.topics 是契约里的方向）
  const vmTopics = topics.map((t) => {
    const linked = elements.filter((e) => (e.topics || []).includes(t.id));
    return {
      id: t.id, title: t.title, proposition: t.proposition,
      sectionRefs: [...(t.sectionRefs || [])],
      ...(Object.prototype.hasOwnProperty.call(t, 'blockIds') ? { blockIds: [...t.blockIds] } : {}),
      elementIds: linked.map((e) => e.id),
      elementLabels: linked.map((e) => e.label),
      // 事实：这个 topic 在图上有落点吗（有就是有，无就是无 —— 不解释）
      hasElements: linked.length > 0,
    };
  });

  const docEntries = ['scope', 'nonGoalSummary']
    .map((k) => (map.document[k] ? { key: k, text: map.document[k].text, sectionRefs: [...(map.document[k].sectionRefs || [])], sourceUnitIds: [...(map.document[k].sourceUnitIds || [])] } : null))
    .filter(Boolean);

  /* ③ 统计事实（不含解释） */
  const facts = {
    elementCount: elements.length,
    edgeCount: edges.length,
    attachmentCount: attachments.length,
    topicCount: topics.length,
    relationGapCount: relationGap.length,
    budget,
    overBudget: elements.length > budget,
    selfLoopCount: vmEdges.filter((e) => e.selfLoop).length,
    topicsWithoutElements: vmTopics.filter((t) => !t.hasElements).map((t) => t.id),
    isolatedElements: vmElements.filter((e) => !e.outgoing.length && !e.incoming.length && !e.attachmentAsElement.length && !e.attachmentAsHost.length).map((e) => e.id),
    elementTypes: [...new Set(elements.map((e) => e.type))].sort(),
    documentRole: map.document.role || null,
    granularity: (map.meta && map.meta.validationGranularity) || '(未标注)',
    provisional: /provisional/i.test((map.meta && map.meta.validationGranularity) || ''),
  };

  /* ④ 审阅信息（仅 Review View；全部**只读转发**，不生成新语义） */
  const knownRoles = opts.knownRoles || null;
  const review = {
    relationGap: relationGap.map((g) => ({
      from: g.from, to: g.to, fromLabel: labelOf(g.from), toLabel: labelOf(g.to),
      intendedMeaning: g.intendedMeaning, reason: g.reason, fixture: g.fixture || null,
      // 显式标注：这不是 edge
      representation: 'relationGap（不是 edge）',
    })),
    unknownRoles: knownRoles ? vmElements.filter((e) => !knownRoles.includes(e.role)).map((e) => ({ id: e.id, role: e.role })) : [],
    elementsWithoutProvenance: vmElements.filter((e) => !e.provenance.sectionRefs.length && !e.provenance.sourceUnitIds.length).map((e) => e.id),
    topicsWithoutSectionRefs: vmTopics.filter((t) => !t.sectionRefs.length).map((t) => t.id),
    checkMap: parseCheckMap(opts.checkMapText),
  };

  // 最后一件事：核对**没有修改输入**
  if (JSON.stringify(map) !== JSON.stringify(frozen)) {
    throw new Error('view model 修改了输入 framework-map（违反"renderer 不改语义"约定）');
  }

  return {
    viewModelVersion: 1,
    generatedFrom: { mapVersion: map.mapVersion, level: map.level },
    document: {
      id: map.document.id, title: map.document.title, sourcePath: map.document.sourcePath,
      role: map.document.role, entries: docEntries,
    },
    thesis: map.thesis || null,
    facts,
    elements: vmElements,
    edges: vmEdges,
    attachments: vmAttachments,
    topics: vmTopics,
    review,
  };
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */
function main() {
  const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
  const mapPath = arg('--map');
  if (!mapPath) { console.error('用法: node scripts/l0-view-model.js --map <framework-map.json> [--check <check-map.txt>] [--out <file>]'); process.exit(2); }
  const map = JSON.parse(fs.readFileSync(resolveRepositoryPath(ROOT, mapPath), 'utf8'));
  const checkPath = arg('--check');
  const knownRoles = JSON.parse(fs.readFileSync(joinRepositoryPath(ROOT, 'schema/framework-map.schema.json'), 'utf8')).$defs.element.properties.role['x-known-roles'];
  const vm = buildL0ViewModel(map, {
    checkMapText: checkPath ? fs.readFileSync(resolveRepositoryPath(ROOT, checkPath), 'utf8') : null,
    knownRoles,
  });
  const out = arg('--out');
  if (out) { fs.writeFileSync(resolveRepositoryPath(ROOT, out), `${JSON.stringify(vm, null, 2)}\n`, 'utf8'); console.log(`wrote ${out}`); }
  else console.log(JSON.stringify(vm.facts, null, 2));
}

module.exports = { buildL0ViewModel, parseCheckMap };
if (require.main === module) main();
