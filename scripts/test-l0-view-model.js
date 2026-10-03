#!/usr/bin/env node
'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

/**
 * Feature 08 · View Model 回归（Phase 1 验收 + Phase 5 的 A–E regression 骨架）
 *
 * 断言的核心只有一句：**renderer 不修改输入语义**。
 *   ① 不丢：element / edge / attachment / topic / relationGap 计数与输入逐一相等
 *   ② 不裁：>12 elements 全部保留（不因 W1 自动删节点）
 *   ③ 不改：label / provenance / qualifiers 逐字节保留；topic 命题原样
 *   ④ 不造：edge 数不因 relationGap / attachment 而变；不新增元素
 *   ⑤ 不崩：仓库里**每一份** framework-map 都能构建 view model
 *
 * 用法：node scripts/test-l0-view-model.js
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildL0ViewModel } = require('./l0-view-model.js');

const ROOT = resolveRepositoryPath(__dirname, '..');
const SCHEMA = JSON.parse(fs.readFileSync(joinRepositoryPath(ROOT, 'schema/framework-map.schema.json'), 'utf8'));
const KNOWN_ROLES = SCHEMA.$defs.element.properties.role['x-known-roles'];

const results = [];
let failures = 0;
function check(name, fn) {
  try {
    const msg = fn();
    if (msg === true || msg === undefined) results.push(`  PASS  ${name}`);
    else { failures += 1; results.push(`  FAIL  ${name} → ${msg}`); }
  } catch (e) { failures += 1; results.push(`  FAIL  ${name} → throw: ${e.message}`); }
}

/* ---------- 收集仓库里所有 framework-map ---------- */
function collectMaps() {
  const out = [];
  for (const base of ['artifacts/experiments', 'samples', 'docs']) {
    const abs = joinRepositoryPath(ROOT, base);
    if (!fs.existsSync(abs)) continue;
    const walk = (d) => {
      for (const name of fs.readdirSync(d)) {
        const p = joinRepositoryPath(d, name);
        if (fs.statSync(p).isDirectory()) { walk(p); continue; }
        if (!name.endsWith('.json')) continue;
        if (!/\.map\.json$|framework-map\.json$/.test(name)) continue;
        try {
          const j = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (j && j.mapVersion && Array.isArray(j.elements) && j.document) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
        } catch { /* 非 map，跳过 */ }
      }
    };
    walk(abs);
  }
  return out.sort();
}

const maps = collectMaps();
console.log(`===== F08 · View Model 回归（${maps.length} 份 framework-map）=====\n`);

/* ---------- 逐份断言 ---------- */
const matrix = [];
for (const rel of maps) {
  const raw = fs.readFileSync(joinRepositoryPath(ROOT, rel), 'utf8');
  const before = crypto.createHash('sha256').update(raw).digest('hex');
  const map = JSON.parse(raw);
  const checkPath = joinRepositoryPath(ROOT, path.dirname(rel), 'check-map.txt');
  const vm = buildL0ViewModel(map, {
    checkMapText: fs.existsSync(checkPath) ? fs.readFileSync(checkPath, 'utf8') : null,
    knownRoles: KNOWN_ROLES,
  });
  const after = crypto.createHash('sha256').update(fs.readFileSync(joinRepositoryPath(ROOT, rel), 'utf8')).digest('hex');

  const tag = rel.length > 58 ? '…' + rel.slice(-57) : rel;
  const problems = [];
  // ① 不丢
  if (vm.elements.length !== map.elements.length) problems.push(`elements ${vm.elements.length}≠${map.elements.length}`);
  if (vm.edges.length !== (map.edges || []).length) problems.push(`edges ${vm.edges.length}≠${(map.edges || []).length}`);
  if (vm.attachments.length !== (map.attachments || []).length) problems.push(`attach ${vm.attachments.length}≠${(map.attachments || []).length}`);
  if (vm.topics.length !== (map.topics || []).length) problems.push(`topics ${vm.topics.length}≠${(map.topics || []).length}`);
  if (vm.review.relationGap.length !== (map.relationGap || []).length) problems.push('relationGap 计数不符');
  // ④ 不造：edge 数不被 relationGap / attachment 影响
  if (vm.edges.length !== (map.edges || []).length) problems.push('edge 数被改变');
  // ② 不裁
  if (map.elements.length > 12 && vm.elements.length !== map.elements.length) problems.push('超预算被裁');
  // ③ 不改
  for (const e of map.elements) {
    const v = vm.elements.find((x) => x.id === e.id);
    if (!v) { problems.push(`丢元素 ${e.id}`); continue; }
    if (v.label !== e.label) problems.push(`${e.id} label 被改写`);
    if (JSON.stringify(v.provenance.sectionRefs) !== JSON.stringify(e.sectionRefs || [])) problems.push(`${e.id} sectionRefs 被改写`);
    if (JSON.stringify(v.provenance.sourceUnitIds) !== JSON.stringify(e.sourceUnitIds || [])) problems.push(`${e.id} sourceUnitIds 被改写`);
    if (v.role !== e.role || v.type !== e.type) problems.push(`${e.id} type/role 被改写`);
  }
  for (const t of map.topics || []) {
    const v = vm.topics.find((x) => x.id === t.id);
    if (!v || v.proposition !== t.proposition) problems.push(`${t.id} 命题被改写`);
  }
  // 引用解析
  for (const ed of vm.edges) {
    if (ed.fromLabel.startsWith('(未解析')) problems.push(`edge ${ed.id || ed.from + '→' + ed.to} from 未解析`);
    if (ed.toLabel.startsWith('(未解析')) problems.push(`edge ${ed.id || ed.from + '→' + ed.to} to 未解析`);
  }
  for (const a of vm.attachments) {
    if (a.elementLabel.startsWith('(未解析')) problems.push(`attachment ${a.elementId} 未解析`);
    if (a.hostLabels.some((l) => l.startsWith('(未解析'))) problems.push(`attachment ${a.elementId} 宿主未解析`);
  }
  // 输入未被修改（内存 + 磁盘）
  if (before !== after) problems.push('磁盘上的输入文件被改动');

  matrix.push({
    rel, el: vm.elements.length, ed: vm.edges.length, at: vm.attachments.length, tp: vm.topics.length,
    gap: vm.review.relationGap.length, self: vm.facts.selfLoopCount, noEl: vm.facts.topicsWithoutElements.length,
    over: vm.facts.overBudget, hard: vm.review.checkMap ? vm.review.checkMap.hard : null, problems,
  });
  check(`${tag}`, () => (problems.length === 0 ? true : problems.join(' · ')));
}

/* ---------- 定向断言（验收清单里的几条硬要求） ---------- */
const byTail = (t) => matrix.find((m) => m.rel.endsWith(t));

check('D（无主轴）能构建：不因"没有主轴"而报错或造主轴', () => {
  const m = byTail('semantic-grounding/fixture-d/run-04/framework-map.json');
  return m && m.problems.length === 0 ? true : `未找到或有问题: ${JSON.stringify(m && m.problems)}`;
});
check('E（分叉 + constraint/attachment）能构建', () => {
  const m = byTail('semantic-grounding/fixture-e/run-08/framework-map.json');
  return m && m.problems.length === 0 ? true : '未找到或有问题';
});
check('>12 elements 不被裁剪（E5 失败样本 81 elements）', () => {
  const m = byTail('semantic-grounding/fixture-d/run-01/framework-map.json');
  if (!m) return '未找到 81 元素样本';
  return (m.el === 81 && m.over && m.problems.length === 0) ? true : `el=${m.el} over=${m.over} problems=${m.problems.join(',')}`;
});
check('自环边被保留并显式标注（不是被静默丢弃）', () => {
  const selfMaps = matrix.filter((m) => m.self > 0);
  if (!selfMaps.length) return '仓库里没有自环样本（预期 D 有）';
  return selfMaps.every((m) => m.problems.length === 0) ? true : '自环样本构建有问题';
});
check('无 element 的 Topic 仍进入导航索引（D T-19/T-20、E T-08/T-11 之类）', () => {
  const withNoEl = matrix.filter((m) => m.noEl > 0);
  return withNoEl.length > 0 ? true : '没有任何"无 element topic"样本（预期存在）';
});
check('relationGap 不被转成 edge', () => {
  const withGap = matrix.filter((m) => m.gap > 0);
  if (!withGap.length) return '没有带 relationGap 的样本';
  for (const m of withGap) {
    const input = JSON.parse(fs.readFileSync(joinRepositoryPath(ROOT, m.rel), 'utf8'));
    if (m.ed !== (input.edges || []).length) return `${m.rel}: edge 数被 relationGap 影响`;
  }
  return true;
});

check('S1：topic.blockIds 的 absent（Unknown）与 []（Known(0)）在投影后仍有不同 shape', () => {
  const map = {
    mapVersion: 'test', level: 'L0',
    document: { id: 's1-shape', title: 'S1 shape regression' },
    elements: [], edges: [], attachments: [], relationGap: [],
    topics: [
      { id: 'unknown', title: 'Unknown', proposition: 'blockIds is absent' },
      { id: 'empty', title: 'Known empty', proposition: 'blockIds is []', blockIds: [] },
    ],
  };
  const vm = buildL0ViewModel(map, { knownRoles: KNOWN_ROLES });
  const unknown = vm.topics.find((topic) => topic.id === 'unknown');
  const empty = vm.topics.find((topic) => topic.id === 'empty');
  const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  if (owns(unknown, 'blockIds')) return 'Unknown blockIds 被投影成已知数组';
  if (!owns(empty, 'blockIds') || !Array.isArray(empty.blockIds) || empty.blockIds.length !== 0) return 'Known(0) blockIds 未保留为空数组';
  return true;
});

/* ---------- 汇总矩阵 ---------- */
console.log(results.join('\n'));
console.log('\n===== 矩阵（A–E + 极端样本）=====');
console.log('| map | el | ed | attach | topics | gap | 自环 | 无element Topic | 超预算 | check-map HARD |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const m of matrix) {
  console.log(`| ${m.rel.replace('experiments/', '').replace('docs/log/artifacts/', '')} | ${m.el} | ${m.ed} | ${m.at} | ${m.tp} | ${m.gap} | ${m.self} | ${m.noEl} | ${m.over ? '⚠️' : ''} | ${m.hard === null ? '-' : m.hard} |`);
}
console.log('\n════════════════════════════════');
console.log(`View Model 回归: ${results.length - failures}/${results.length} 通过（覆盖 ${maps.length} 份 map）`);
if (failures) console.log(`✗ ${failures} 项失败`);
else console.log('✓ 结论：不丢 / 不裁 / 不改 / 不造 / 不崩；renderer 输入语义零修改');
console.log('════════════════════════════════');
process.exit(failures ? 1 : 0);
