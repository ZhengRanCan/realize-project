#!/usr/bin/env node
'use strict';

/**
 * Feature 08 · Phase 4.1 · L0 graph layout 回归
 *
 * 对 `app/renderer/l0-layout.js` 直接断言（纯函数，不需要浏览器）：
 *   · 确定性：同一输入两次 → 逐字节相同
 *   · 不改输入：map 文件 sha256 不变 + 传入的 vm 对象不被修改
 *   · 不丢：每个 element 要么是节点、要么是角标，且不重不漏
 *   · 不造线：画出的线数 == edges 数；没有 edge 就没有线（不发明主轴）
 *   · 不重叠：任意两个节点的矩形不相交；同层同 y
 *   · 线贴着节点：起点在源节点下边、终点在目标节点上边（方向是画出来的，不是猜的）
 *   · 自环画成自环
 *   · 排序确实减少交叉（crossings ≤ crossingsBeforeOrdering）
 *   · 用户第一眼：Reading 用的标题里没有机器 ID、没有没切开的标点
 *
 * 用法：node scripts/test-l0-layout.js
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildL0ViewModel } = require('./l0-view-model.js');
const { computeL0Layout, displayFields } = require('../app/renderer/l0-layout.js');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema/framework-map.schema.json'), 'utf8'));
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

function collectMaps() {
  const out = [];
  for (const base of ['experiments', 'docs']) {
    const abs = path.join(ROOT, base);
    if (!fs.existsSync(abs)) continue;
    const walk = (d) => {
      for (const name of fs.readdirSync(d)) {
        const p = path.join(d, name);
        if (fs.statSync(p).isDirectory()) { walk(p); continue; }
        if (!name.endsWith('.json')) continue;
        if (!/\.map\.json$|framework-map\.json$/.test(name)) continue;
        try {
          const j = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (j && j.mapVersion && Array.isArray(j.elements) && j.document) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
        } catch { /* 非 map */ }
      }
    };
    walk(abs);
  }
  return out.sort();
}

const maps = collectMaps();
console.log(`===== F08 · L0 Layout 回归（${maps.length} 份 framework-map）=====\n`);

/* ---------- 展示字段：切开标题/副标题，不编造 ---------- */
check('displayFields：括号形态切成 标题/副标题（D 的主力形态）', () => {
  const d = displayFields({ id: 'E-UserProfile', label: 'UserProfile（跨目标用户上下文与表达/排期偏好）' });
  return (d.title === 'UserProfile' && d.subtitle === '跨目标用户上下文与表达/排期偏好') || `得到 ${JSON.stringify(d)}`;
});
check('displayFields：冒号形态切成 标题/副标题（E 的主力形态）', () => {
  const d = displayFields({ id: 'E-01', label: '部署流程：node --check → npm 构建（h5 / mp-weixin）' });
  return d.title === '部署流程' || `得到 ${JSON.stringify(d)}`;
});
check('displayFields：短标签整句就是标题，不硬切', () => {
  const d = displayFields({ id: 'C-HistoryIntegrity', label: '执行历史不可改写、不得静默丢失与显式失败' });
  return (d.title === '执行历史不可改写、不得静默丢失与显式失败' && d.subtitle === '') || `得到 ${JSON.stringify(d)}`;
});
check('displayFields：无标点长句用 id 可读名做标题（不编造词）', () => {
  const d = displayFields({ id: 'E-SomethingLong', label: '这是一句没有任何标点的很长的说明文字用来测试回退分支是否工作正常' });
  return (d.title === 'SomethingLong' && d.subtitle.startsWith('这是一句')) || `得到 ${JSON.stringify(d)}`;
});
check('displayFields：label 缺失时不崩', () => {
  const d = displayFields({ id: 'E-X', label: null });
  return d.title === 'E-X' || `得到 ${JSON.stringify(d)}`;
});

/* ---------- 逐份 map ---------- */
const matrix = [];
for (const rel of maps) {
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const before = crypto.createHash('sha256').update(raw).digest('hex');
  const map = JSON.parse(raw);
  const checkPath = path.join(ROOT, path.dirname(rel), 'check-map.txt');
  const vm = buildL0ViewModel(map, {
    checkMapText: fs.existsSync(checkPath) ? fs.readFileSync(checkPath, 'utf8') : null,
    knownRoles: KNOWN_ROLES,
  });

  const vmBefore = JSON.stringify(vm);
  const layout = computeL0Layout(vm);
  const problems = [];

  // ① 不丢不重：elements = 节点 ∪ 角标
  const nodeIds = layout.nodes.map((n) => n.id);
  const badgeIds = layout.badges.map((b) => b.id);
  const all = [...nodeIds, ...badgeIds];
  if (all.length !== vm.elements.length) problems.push(`元素覆盖 ${all.length}≠${vm.elements.length}`);
  if (new Set(all).size !== all.length) problems.push('元素重复出现（既是节点又是角标）');
  for (const e of vm.elements) if (!all.includes(e.id)) problems.push(`丢元素 ${e.id}`);

  // ② 不造线：线数 == edge 数
  if (layout.stats.edgeCount !== vm.edges.length) problems.push(`线数 ${layout.stats.edgeCount}≠edge ${vm.edges.length}`);
  if (layout.stats.skippedEdges !== 0) problems.push(`有 ${layout.stats.skippedEdges} 条 edge 没画出来`);
  if (vm.edges.length === 0 && layout.edges.length !== 0) problems.push('没有 edge 却画了线（造主轴）');
  if (vm.edges.length === 0 && layout.nodes.some((n) => n.layer !== -1)) problems.push('无 edge 时仍给节点分层（暗示了主轴）');

  // ③ 每条 edge 都有对应的线，且端点存在
  const lineKeys = new Set(layout.edges.map((p) => `${p.from}->${p.to}`));
  for (const ed of vm.edges) if (!lineKeys.has(`${ed.from}->${ed.to}`)) problems.push(`edge ${ed.from}->${ed.to} 没有线`);

  // ④ 方向是画出来的：forward 线必须从源节点下边出发、到目标节点上边
  const geom = new Map(layout.nodes.map((n) => [n.id, n]));
  for (const p of layout.edges) {
    if (p.kind !== 'forward') continue;
    const a = geom.get(p.from); const b = geom.get(p.to);
    const wantStart = `M ${a.x + a.w / 2} ${a.y + a.h}`;
    const wantEnd = `${b.x + b.w / 2} ${b.y}`;
    if (!p.d.startsWith(wantStart)) problems.push(`${p.from}->${p.to} 起点不在源节点下边`);
    if (!p.d.endsWith(wantEnd)) problems.push(`${p.from}->${p.to} 终点不在目标节点上边`);
    if (!(b.y > a.y)) problems.push(`${p.from}->${p.to} 标为 forward 但目标不在下方`);
  }

  // ⑤ 自环
  for (const p of layout.edges) {
    if (p.selfLoop && p.kind !== 'self') problems.push(`自环 ${p.from} 没画成自环（kind=${p.kind}）`);
    if (p.selfLoop && !p.d) problems.push(`自环 ${p.from} 没有路径`);
  }

  // ⑥ 不重叠 + 同层同 y + 坐标合法
  for (let i = 0; i < layout.nodes.length; i += 1) {
    const a = layout.nodes[i];
    if (![a.x, a.y, a.w, a.h].every((v) => Number.isFinite(v) && v >= 0)) problems.push(`${a.id} 坐标非法`);
    for (let j = i + 1; j < layout.nodes.length; j += 1) {
      const b = layout.nodes[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      if (overlap) problems.push(`${a.id} 与 ${b.id} 重叠`);
    }
  }
  const layerY = new Map();
  for (const n of layout.nodes) {
    if (n.layer < 0) continue;
    if (layerY.has(n.layer) && layerY.get(n.layer) !== n.y) problems.push(`第 ${n.layer} 层不在同一行`);
    layerY.set(n.layer, n.y);
    if (n.x + n.w + 24 > layout.bounds.width || n.y + n.h + 24 > layout.bounds.height) problems.push(`${n.id} 超出画布`);
  }

  // ⑦ 排序有效：交叉没有变多
  if (layout.stats.crossings > layout.stats.crossingsBeforeOrdering) problems.push(`交叉变多 ${layout.stats.crossingsBeforeOrdering}→${layout.stats.crossings}`);

  // ⑧ 确定性 + 不改输入
  const again = JSON.stringify(computeL0Layout(vm));
  if (again !== JSON.stringify(layout)) problems.push('两次布局结果不一致（不确定）');
  if (JSON.stringify(vm) !== vmBefore) problems.push('布局修改了 view model 输入');
  const after = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  if (before !== after) problems.push('磁盘上的 map 被改动');

  // ⑨ 用户第一眼：标题里不许出现机器 ID / 没切开的标点
  for (const n of layout.nodes) {
    if (/^[ECS]-\d+$/.test(n.title)) problems.push(`${n.id} 标题是机器 ID`);
    if (/[（(：:]$/.test(n.title)) problems.push(`${n.id} 标题切分不干净：${n.title}`);
    if (n.title.length > 44) problems.push(`${n.id} 标题过长（${n.title.length}）`);
  }

  const tag = rel.length > 58 ? '…' + rel.slice(-57) : rel;
  matrix.push({ rel, tag, map, vm, layout, problems });
  if (problems.length) { failures += 1; results.push(`  FAIL  ${tag} → ${problems.slice(0, 3).join('; ')}`); }
  else results.push(`  PASS  ${tag}  (节点 ${layout.stats.nodeCount} · 角标 ${layout.stats.badgeCount} · 线 ${layout.stats.edgeCount} · 层内交叉 ${layout.stats.crossingsBeforeOrdering}→${layout.stats.crossings} · 画布 ${layout.bounds.width}×${layout.bounds.height})`);
}

/* ---------- 定向断言（对应用户 Track A Round 0 的三条感受） ---------- */
const byTail = (t) => matrix.find((m) => m.rel.endsWith(t));

check('用户感受 3：D 的节点标题是 UserProfile / PlanBundle 聚合，不再是 E-UserProfile 这种机器 ID', () => {
  const m = byTail('semantic-grounding/fixture-d/run-04/framework-map.json');
  if (!m) return '找不到 D 样本';
  const byId = new Map(m.layout.nodes.map((n) => [n.id, n]));
  const up = byId.get('E-UserProfile');
  const pb = byId.get('E-PlanBundle');
  if (!up || !pb) return '缺 E-UserProfile / E-PlanBundle 节点';
  if (up.title !== 'UserProfile') return `E-UserProfile 标题是 ${up.title}`;
  if (pb.title !== 'PlanBundle 聚合') return `E-PlanBundle 标题是 ${pb.title}`;
  return true;
});
check('用户感受 3：id 仍然保留在数据里（data-element-id / badge），只是不进第一眼标题', () => {
  const m = byTail('semantic-grounding/fixture-d/run-04/framework-map.json');
  const n = m.layout.nodes.find((x) => x.id === 'E-UserProfile');
  return (n && n.label.includes('跨目标用户上下文')) || 'label 丢失';
});
check('用户感受 1：D 是网状 —— 关系被画成线，不是靠卡片文字；且有分叉（不是一条链）', () => {
  const m = byTail('semantic-grounding/fixture-d/run-04/framework-map.json');
  const outDeg = new Map();
  for (const e of m.layout.edges) outDeg.set(e.from, (outDeg.get(e.from) || 0) + 1);
  const maxOut = Math.max(0, ...outDeg.values());
  if (m.layout.edges.length !== m.vm.edges.length) return '线数与 edge 不一致';
  if (maxOut < 2) return `最大出度 ${maxOut}（应 ≥2，说明是网状/分叉而非单链）`;
  return true;
});
check('用户感受 2：约束不再抢主视觉 —— 有 edge 的约束才是节点，其余降为宿主角标（不丢）', () => {
  const m = byTail('semantic-grounding/fixture-d/run-04/framework-map.json');
  const badgeIds = m.layout.badges.map((b) => b.id);
  if (!badgeIds.includes('C-PlanStructureAndState')) return '约束未降级为角标';
  const host = m.layout.nodes.find((n) => n.badgeIds.includes('C-PlanStructureAndState'));
  if (!host) return '角标没有挂到任何宿主节点上';
  for (const b of m.layout.badges) {
    if (new Set(b.hosts).size !== b.hosts.length) return `${b.id} 宿主重复`;
    if (b.hosts.some((h) => !m.layout.nodes.some((n) => n.id === h))) return `${b.id} 宿主不是节点`;
  }
  const nodeIds = m.layout.nodes.map((n) => n.id);
  return !nodeIds.includes('C-PlanStructureAndState') || '约束仍占一个节点位';
});
check('E 是分叉不是链：存在 ≥2 个后继的节点，且分层 ≥2 层', () => {
  const m = byTail('semantic-grounding/fixture-e/run-08/framework-map.json');
  const outs = new Map();
  for (const e of m.layout.edges) outs.set(e.from, (outs.get(e.from) || 0) + 1);
  const layers = new Set(m.layout.nodes.map((n) => n.layer));
  if (Math.max(0, ...outs.values()) < 2) return '没有分叉';
  return layers.size >= 2 || `只有 ${layers.size} 层`;
});
check('自环样本：自环被画成自环，且没有变成主线', () => {
  const m = byTail('framework-map-generation/fixture-d/run-01/framework-map.json');
  const selfs = m.layout.edges.filter((p) => p.selfLoop);
  if (!selfs.length) return '样本没有自环';
  return selfs.every((p) => p.kind === 'self' && p.d.includes('C ')) || '自环路径异常';
});
check('81 元素极端样本：全部渲染、不裁剪、画布有限', () => {
  const m = byTail('semantic-grounding/fixture-d/run-01/framework-map.json');
  const total = m.layout.stats.nodeCount + m.layout.stats.badgeCount;
  if (m.map.elements.length !== 81) return `样本元素数变了：${m.map.elements.length}`;
  if (total !== 81) return `只覆盖 ${total}（应 81）`;
  if (!Number.isFinite(m.layout.bounds.width) || !Number.isFinite(m.layout.bounds.height)) return '画布尺寸非法';
  return true;
});
check('只有 edge 才有线：所有样本的线数都严格等于 edge 数', () => {
  const bad = matrix.filter((m) => m.layout.edges.length !== m.vm.edges.length);
  return bad.length === 0 || `${bad.length} 份不符`;
});
check('确定性：全部样本两次布局逐字节相同', () => {
  const bad = matrix.filter((m) => JSON.stringify(computeL0Layout(m.vm)) !== JSON.stringify(m.layout));
  return bad.length === 0 || `${bad.length} 份不确定`;
});

console.log(results.join('\n'));
const passed = matrix.filter((m) => !m.problems.length).length;
console.log('\n════════════════════════════════');
console.log(`L0 Layout 回归: ${results.length - failures}/${results.length} 通过（覆盖 ${maps.length} 份 map，其中逐份矩阵 ${passed}/${matrix.length}）`);
if (failures) console.log(`✗ ${failures} 项失败`);
else console.log('✓ 结论：不丢 / 不造线 / 不重叠 / 方向画出来 / 自环仍是自环 / 排序减少交叉 / 逐字节确定');
console.log('════════════════════════════════');
process.exit(failures ? 1 : 0);
