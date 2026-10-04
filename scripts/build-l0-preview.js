#!/usr/bin/env node
'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

/**
 * Feature 08 · L0 静态预览构建器（Phase 2）
 *
 * validated framework-map.json
 *   → l0-view-model（纯投影）
 *   → renderL0MapHTML（deterministic renderer，构建期 SSR）
 *   → 静态 HTML（可直接用 file:// 打开；Phase 3 复用同一个 renderer 模块进 Electron）
 *
 * **不调用模型、不改 Contract、不碰生成逻辑。**
 *
 * 用法：
 *   node scripts/build-l0-preview.js --set                 # 生成标准预览集（D / E / 极端样本）
 *   node scripts/build-l0-preview.js --map <map.json> [--check <check-map.txt>] [--out <x.html>] [--view review]
 */

const fs = require('node:fs');
const path = require('node:path');
const { buildL0ViewModel } = require('./l0-view-model.js');
const { renderL0MapHTML } = require('../app/renderer/l0-map.js');

const ROOT = resolveRepositoryPath(__dirname, '..');
const SCHEMA = JSON.parse(fs.readFileSync(joinRepositoryPath(ROOT, 'schema/framework-map.schema.json'), 'utf8'));
const KNOWN_ROLES = SCHEMA.$defs.element.properties.role['x-known-roles'];

/** 标准预览集：刻意包含两端与两个极端 */
const SET = [
  { name: 'd', map: 'experiments/semantic-grounding/fixture-d/run-04/framework-map.json', note: 'D · ER-heavy · 无主轴实体网络（F10 high）' },
  { name: 'e', map: 'experiments/semantic-grounding/fixture-e/run-08/framework-map.json', note: 'E · Runbook · 分叉 + constraint/attachment（F10 high）' },
  { name: 'd-selfloop', map: 'experiments/framework-map-generation/fixture-d/run-01/framework-map.json', note: 'D 旧臂 · 含 task→task 自环（F07）' },
  { name: 'd-overbudget', map: 'experiments/semantic-grounding/fixture-d/run-01/framework-map.json', note: 'E5 失败样本 · 81 elements（>budget 必须照常渲染）' },
  { name: 'a', map: 'samples/context-consumption/framework-map.json', note: 'A · sourceUnit 粒度 · 人类 candidate' },
  { name: 'e-human', map: 'samples/operational-runbook/framework-map.json', note: 'E · 人类 candidate · 含 relationGap' },
];

function buildOne({ map, check, out, view = 'reading', note = '' }) {
  const mapAbs = resolveRepositoryPath(ROOT, map);
  const mapJson = JSON.parse(fs.readFileSync(mapAbs, 'utf8'));
  const checkAbs = check ? resolveRepositoryPath(ROOT, check) : joinRepositoryPath(path.dirname(mapAbs), 'check-map.txt');
  const vm = buildL0ViewModel(mapJson, {
    checkMapText: fs.existsSync(checkAbs) ? fs.readFileSync(checkAbs, 'utf8') : null,
    knownRoles: KNOWN_ROLES,
  });
  const body = renderL0MapHTML(vm, { view, topicNavigation:false });
  const outAbs = resolveRepositoryPath(ROOT, out);
  // 用相对路径引 CSS，保证 file:// 直接打开可用（F07 的教训）
  const rel = (path.relative(path.dirname(outAbs), ROOT) || '.').replace(/\\/g, '/');
  const html = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>L0 Framework Map · ${vm.document.title.replace(/</g, '')}</title>
<link rel="stylesheet" href="${rel}/app/renderer/l0-map.css">
</head><body>
<div class="preview-banner">
  <b>F08 · L0 Framework Map 预览</b>
  <span>${note ? note.replace(/</g, '') : ''}</span>
  <span class="mono">source: ${map}</span>
  <span class="mono">check-map: ${fs.existsSync(checkAbs) ? path.relative(ROOT, checkAbs).replace(/\\/g, '/') : '(未提供)'}</span>
  <span>由 deterministic renderer 从 view model 生成；AI 未生成任何 HTML。</span>
  <span id="preview-source-hit" class="mono" style="display:none"></span>
</div>
${body}
<script src="${rel}/app/renderer/l0-layout.js"></script>
<script src="${rel}/app/renderer/l0-map.js"></script>
<script>
  // 视图切换（Reading 默认）+ 交互绑定（selection / focus / provenance hook）
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-l0-view]');
    if (!t) return;
    const root = t.closest('.l0-root');
    root.setAttribute('data-view', t.getAttribute('data-l0-view'));
    root.querySelectorAll('.tab[data-l0-view]').forEach((b) => b.classList.toggle('active', b === t));
  });
  // 预览里 provenance 没有原文可跳：先把点击到的 §ref 显示在 banner 上，证明链路可用
  window.L0Map.bindInteractions(document.querySelector('.l0-root'), {
    onSourceRef: (ref) => {
      const box = document.getElementById('preview-source-hit');
      if (box) { box.textContent = 'provenance 点击 → ' + ref + '（Electron 里会打开对应原文位置）'; box.style.display = 'inline'; }
    },
    onClear: () => {
      const box = document.getElementById('preview-source-hit');
      if (box) box.style.display = 'none';
    },
  });
</script>
</body></html>
`;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, html, 'utf8');
  return { out: path.relative(ROOT, outAbs).replace(/\\/g, '/'), bytes: Buffer.byteLength(html), facts: vm.facts };
}

function main() {
  const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
  if (process.argv.includes('--set') || process.argv.length <= 2) {
    const rows = [];
    for (const item of SET) {
      const r = buildOne({
        map: item.map,
        out: `workspace/previews/l0/preview-${item.name}.html`,
        // 用户裁决：**默认 Reading View**（先回答"讲什么 / 从哪进去"，不是"有多少 WARN"）
        view: 'reading',
        note: item.note,
      });
      rows.push({ name: item.name, ...r });
    }
    console.log('===== F08 L0 预览集 =====');
    for (const r of rows) {
      console.log(`  ${r.name.padEnd(12)} ${r.out}  ${(r.bytes / 1024).toFixed(1)} KB  (el ${r.facts.elementCount} · ed ${r.facts.edgeCount} · attach ${r.facts.attachmentCount} · topics ${r.facts.topicCount} · gap ${r.facts.relationGapCount} · 自环 ${r.facts.selfLoopCount} · 超预算 ${r.facts.overBudget ? 'Y' : 'N'})`);
    }
    console.log(`\n共 ${rows.length} 份。用法：node scripts/build-l0-preview.js --map <map.json> --out <x.html> [--view review]`);
    return;
  }
  const map = arg('--map');
  if (!map) { console.error('需要 --map，或用 --set 生成标准预览集'); process.exit(2); }
  const r = buildOne({ map, check: arg('--check'), out: arg('--out') || 'workspace/previews/l0/preview.html', view: arg('--view') || 'reading', note: arg('--note') || '' });
  console.log(`wrote ${r.out} (${(r.bytes / 1024).toFixed(1)} KB) el=${r.facts.elementCount} ed=${r.facts.edgeCount}`);
}

module.exports = { buildOne, SET };
if (require.main === module) main();
