#!/usr/bin/env node
'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

/**
 * Feature 08 · Phase 4.1 · 用文字看布局（不开 GUI 就能核对"第一眼看到什么"）
 *
 *   node scripts/inspect-l0-layout.js <framework-map.json> [...]
 *   node scripts/inspect-l0-layout.js            # 默认看 D / E 两个 F10 样本
 *
 * 打印的是**层 → 行**的节点标题 + 所有线 + 约束角标。
 * 用来核对三件事（Track A Round 0 的三条感受）：
 *   1. 关系有没有被画成线（层与层之间就是线）
 *   2. 第一眼看到的是不是节点标题（而不是 process / artifact 这种本体元数据）
 *   3. 标题里没有机器 ID（ID 只留在数据里）
 */

const fs = require('node:fs');
const path = require('node:path');
const { buildL0ViewModel } = require('./l0-view-model.js');
const { computeL0Layout } = require('../app/renderer/l0-layout.js');

const ROOT = resolveRepositoryPath(__dirname, '..');
const SCHEMA = JSON.parse(fs.readFileSync(joinRepositoryPath(ROOT, 'schema/framework-map.schema.json'), 'utf8'));
const roles = SCHEMA.$defs.element.properties.role['x-known-roles'];

const DEFAULT = [
  'experiments/semantic-grounding/fixture-d/run-04/framework-map.json',
  'experiments/semantic-grounding/fixture-e/run-08/framework-map.json',
];

const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
for (const rel of targets) {
  const abs = path.isAbsolute(rel) ? rel : joinRepositoryPath(ROOT, rel);
  const checkPath = joinRepositoryPath(path.dirname(abs), 'check-map.txt');
  const vm = buildL0ViewModel(JSON.parse(fs.readFileSync(abs, 'utf8')), {
    checkMapText: fs.existsSync(checkPath) ? fs.readFileSync(checkPath, 'utf8') : null,
    knownRoles: roles,
  });
  const L = computeL0Layout(vm);
  console.log(`\n===== ${vm.document.title} =====`);
  console.log(`  ${rel}`);
  console.log(`  节点 ${L.stats.nodeCount} · 角标 ${L.stats.badgeCount} · 线 ${L.stats.edgeCount}`
    + ` · 回边 ${L.stats.backEdges} · 自环 ${L.stats.selfLoops} · 层 ${L.stats.layerCount}`
    + ` · 交叉 ${L.stats.crossingsBeforeOrdering}→${L.stats.crossings} · 画布 ${L.bounds.width}×${L.bounds.height}`);

  const byRow = new Map();
  for (const n of L.nodes) {
    if (!byRow.has(n.layer)) byRow.set(n.layer, []);
    byRow.get(n.layer).push(n);
  }
  for (const k of [...byRow.keys()].sort((a, b) => a - b)) {
    const label = k < 0 ? '不在任何 edge 上' : `层 ${k}`;
    console.log(`  ${label}: ${byRow.get(k).map((n) => `[${n.title}${n.badgeIds.length ? ` ⚑${n.badgeIds.length}` : ''}]`).join('  ')}`);
  }
  if (L.badges.length) {
    console.log(`  角标（不占节点位）: ${L.badges.map((b) => `⚑${b.title}→宿主 ${b.hosts.join('/')}`).join('  |  ')}`);
  }
  console.log(`  线（${L.edges.length}）:`);
  for (const e of L.edges) {
    const flag = e.selfLoop ? ' (自环)' : (e.kind === 'back' ? ' (回边)' : '');
    console.log(`    ${e.from} —${e.type}→ ${e.to}${flag}`);
  }
}
