#!/usr/bin/env node
'use strict';

/**
 * experiments/ 索引生成器（experiments/index.json）
 *
 * 目标：把每个 run / block / 产物**归属到具体的 feature**，并让这份对应关系可校验、不会悄悄漂移。
 *
 * 归属规则（确定性，按优先级）：
 *   1. 目录里有 run-meta.json 且带 `feature` 字段 → 采用它（只取 `Fxx` 前缀，去掉 slug）；
 *   2. 否则按区域归属（见 AREA_FEATURE）；
 *   3. 记录 request.json / manifest.json 里的 promptPath，便于人工复核归属。
 *
 * 单元识别：区域根目录之下，凡是含 RUN_MARKERS 之一即视为一个 run / block 单元，且不再向下递归；
 * 否则继续下钻。这样 `fixture-x/run-NN`、`<area>/<blockId>`、`<area>/blocks/<blockId>` 三种深度都能覆盖。
 *
 * 用法：
 *   node scripts/index-experiments.js            # 写入 experiments/index.json
 *   node scripts/index-experiments.js --check    # 只校验已提交的索引与现状是否一致（漂移则退出 1）
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const EXPERIMENTS = path.join(ROOT, 'experiments');
const INDEX = path.join(EXPERIMENTS, 'index.json');

/** 区域 → 归属 feature。'baseline' 表示 F 系列之前、没有对应 feature 的历史实验。 */
const AREA_FEATURE = {
  'framework-map-generation': 'F07',
  'semantic-grounding': 'F10',
  'stage2': 'F01',
  'stage2-full': 'F01',
  'l0-ui': 'F08',
  'reports': 'baseline',
};

const AREA_NOTE = {
  'framework-map-generation': 'scripts/generate-framework-map.js 的逐 run 产物（prompt ai/framework-map-generation.prompt.md）',
  'semantic-grounding': 'scripts/run-semantic-grounding.js 的两阶段 run（Stage A inventory → Stage B map）',
  'stage2': 'Stage 2 pilot：6 个 block 的试点产物与首次失败尝试，F01 问题清单的来源',
  'stage2-full': 'Stage 2 全量 run：21 个 block + 修复前快照，F01 的修复对象',
  'l0-ui': 'scripts/build-l0-preview.js 生成的 L0 静态预览',
  'reports': 'F 系列之前的 Stage 1 计划对比报告（MVP / Phase 1 基线）',
};

const FIXTURE_CONTEXT = {
  a: 'Fixture A · Context Consumption（最早样本，F03/F04 的语境）',
  b: 'Fixture B · Data Model heavy（F05 跨文档类型验证）',
  c: 'Fixture C · Process / Operational heavy（F05 跨文档类型验证）',
  d: 'Fixture D · Goal/Plan/Task 状态模型（F09 资格选择，F10 复测）',
  e: 'Fixture E · F13–F16 售后 runbook（F09 资格选择，F10 复测）',
};

const RUN_MARKERS = [
  'run-meta.json', 'request.json', 'block.generated.json', 'check-block.txt', 'raw.md',
  // 两阶段运行器的阶段级痕迹：run-02 这类「Stage B 被 kill、没有 run-meta」的 run 只能靠它们识别
  'request-stage-a.json', 'request-stage-b.json', 'semantic-inventory.json',
  'raw-inventory-response.txt', 'raw-synthesis-response.txt',
];
const NOTABLE_ARTIFACTS = [
  'semantic-inventory.json', 'map-selection.json', 'framework-map.json',
  'block.generated.json', 'check-map.txt', 'check-block.txt', 'run-meta.json',
];
const SKIP_FILES = new Set(['README.md', 'index.json']);

const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
};
const listFiles = (dir) => fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile()).sort();
const dirs = (dir) => fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const normalizeFeature = (value) => (typeof value === 'string' ? (value.match(/^F\d+/)?.[0] ?? value) : null);

function unitFor(dir, area) {
  const files = listFiles(dir);
  const meta = files.includes('run-meta.json') ? readJson(path.join(dir, 'run-meta.json')) : null;
  const request = files.includes('request.json') ? readJson(path.join(dir, 'request.json')) : null;
  const manifest = files.includes('manifest.json') ? readJson(path.join(dir, 'manifest.json')) : null;

  const unit = {
    path: rel(dir),
    area,
    feature: normalizeFeature(meta?.feature) ?? AREA_FEATURE[area] ?? 'unknown',
    files: files.length,
    artifacts: NOTABLE_ARTIFACTS.filter((name) => files.includes(name)),
  };
  const stages = ['request-stage-a.json', 'request-stage-b.json']
    .filter((name) => files.includes(name))
    .map((name) => name.replace('request-stage-', '').replace('.json', ''));
  if (stages.length) unit.stages = stages;
  // 归属与状态是从哪读出来的：run-meta（最完整）> 阶段级痕迹 > request.json
  unit.provenance = meta
    ? 'run-meta'
    : (stages.length || files.includes('semantic-inventory.json')) ? 'stage-trace' : 'request';
  if (meta?.fixture) unit.fixture = meta.fixture;
  if (meta?.stage) unit.stage = meta.stage;
  if (meta?.status) unit.status = meta.status;
  if (meta?.validator?.status) unit.validator = meta.validator.status;

  const promptPath = meta?.promptPath ?? request?.promptPath ?? manifest?.promptPath;
  if (promptPath) unit.prompt = promptPath;
  const model = meta?.model ?? request?.model ?? manifest?.model;
  if (model) unit.model = model;
  if (request?.shape) unit.shape = request.shape;
  return unit;
}

function collectUnits(dir, area, out, isRoot = false) {
  const files = listFiles(dir);
  if (!isRoot && RUN_MARKERS.some((marker) => files.includes(marker))) {
    out.push(unitFor(dir, area));
    return;
  }
  for (const sub of dirs(dir)) collectUnits(path.join(dir, sub), area, out);
}

function collect() {
  const units = [];
  const areas = {};

  for (const area of dirs(EXPERIMENTS)) {
    const base = path.join(EXPERIMENTS, area);
    const areaUnits = [];
    collectUnits(base, area, areaUnits, true);
    areaUnits.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    units.push(...areaUnits);

    const artifactFiles = listFiles(base).filter((name) => !SKIP_FILES.has(name));
    areas[area] = {
      feature: AREA_FEATURE[area] ?? 'unknown',
      note: AREA_NOTE[area] ?? '',
      units: areaUnits.map((unit) => unit.path),
      artifactFiles: artifactFiles.map((name) => {
        const entry = { path: `${area}/${name}` };
        const fixture = name.match(/^preview-([a-e])/)?.[1] ?? name.match(/^fixture-([a-e])/)?.[1];
        if (fixture) entry.fixture = fixture;
        return entry;
      }),
    };
  }

  const perFeature = {};
  const bump = (feature, key) => {
    perFeature[feature] = perFeature[feature] ?? { units: 0, artifactFiles: 0, areas: [] };
    perFeature[feature][key] += 1;
  };
  for (const unit of units) {
    bump(unit.feature, 'units');
    if (!perFeature[unit.feature].areas.includes(unit.area)) perFeature[unit.feature].areas.push(unit.area);
  }
  for (const [area, info] of Object.entries(areas)) {
    for (let i = 0; i < info.artifactFiles.length; i += 1) {
      bump(info.feature, 'artifactFiles');
      if (!perFeature[info.feature].areas.includes(area)) perFeature[info.feature].areas.push(area);
    }
  }
  for (const info of Object.values(perFeature)) info.areas.sort();

  return {
    generator: 'scripts/index-experiments.js',
    note: '本文件由脚本生成：npm run index:experiments；用 npm run check:experiments 校验是否漂移。',
    areaFeature: AREA_FEATURE,
    areaNote: AREA_NOTE,
    fixtureContext: FIXTURE_CONTEXT,
    perFeature: Object.fromEntries(Object.entries(perFeature).sort()),
    areas,
    unitCount: units.length,
    artifactFileCount: Object.values(areas).reduce((sum, info) => sum + info.artifactFiles.length, 0),
    units,
  };
}

const generated = `${JSON.stringify(collect(), null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, 'utf8') : '';
  if (current !== generated) {
    console.error('experiments/index.json 与现状不一致 —— 运行 npm run index:experiments 重新生成。');
    process.exit(1);
  }
  const parsed = JSON.parse(current);
  console.log(`experiments index: ${parsed.unitCount} units + ${parsed.artifactFileCount} artifacts, up to date.`);
  process.exit(0);
}

fs.writeFileSync(INDEX, generated);
const parsed = JSON.parse(generated);
console.log(`experiments index: wrote ${parsed.unitCount} units + ${parsed.artifactFileCount} artifacts.`);
for (const [feature, info] of Object.entries(parsed.perFeature)) {
  console.log(`  ${feature}: ${info.units} units, ${info.artifactFiles} artifacts (${info.areas.join(', ')})`);
}
