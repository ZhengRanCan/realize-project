#!/usr/bin/env node
'use strict';

/**
 * Preview 生成器：把 overview.generated.json 渲染成一份静态 HTML。
 *
 * **复用现有 deterministic renderer**：直接加载 app/renderer 的 styles.css 与 app.js，
 * 通过 `window.__applyLoadResult(...)` 注入数据 —— 不复制 renderer 代码、不改 Electron UI、
 * 也不让 AI 生成任何 HTML。
 *
 * 目的不是最终 UI，而是回答："全部 AI block 拼起来之后，整份方案是否真的成为了一份可阅读的视觉重述？"
 *
 * 用法：
 *   node scripts/build-preview.js \
 *     --overview experiments/stage2-full/overview.generated.json \
 *     --out experiments/stage2-full/overview-preview.html
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const DEFAULTS = {
  overview: path.join('experiments', 'stage2-full', 'overview.generated.json'),
  design: path.join('fixtures', 'context-consumption.json'),
  plan: path.join('fixtures', 'context-consumption.overview-plan.json'),
  out: path.join('experiments', 'stage2-full', 'overview-preview.html'),
  rows: path.join('docs', 'source-sections.json'),
};

function parseArgs(argv) {
  const args = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) args[key] = true;
    else {
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

function main() {
  const overviewPath = path.resolve(ROOT, args.overview);
  const outPath = path.resolve(ROOT, args.out);
  const design = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.design), 'utf8'));
  const plan = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.plan), 'utf8'));
  const generated = JSON.parse(fs.readFileSync(overviewPath, 'utf8'));
  const sections = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.rows), 'utf8'));

  const planById = new Map(plan.blocks.map((b) => [b.id, b]));

  // 组装成 renderer 期望的 design-review 结构
  // sections[].blocks[] = { id, title, stage, role, sources, defaultExpanded, reviewObjects, content }
  const stageOrder = [...new Set(plan.blocks.map((b) => b.stage))];
  const rendererSections = stageOrder.map((stageId) => {
    const meta = (design.overview.sections || []).find((s) => s.id === stageId) || {};
    const stageBlocks = generated.blocks
      .filter((b) => b.stage === stageId)
      .map((b) => {
        const pb = planById.get(b.id);
        const block = {
          id: b.id,
          title: b.title,
          stage: b.stage,
          sources: [...new Set(((pb && pb.sourceRefs) || []).map((r) => r.section))],
          defaultExpanded: b.defaultExpanded,
          reviewObjects: b.reviewObjects,
          content: b.content,
        };
        if (b.role === 'ambient') block.role = 'ambient';
        return block;
      });
    return {
      id: stageId,
      title: meta.title || stageId,
      purpose: meta.purpose || '',
      blocks: stageBlocks,
    };
  });

  const model = {
    design: {
      id: design.design.id,
      title: design.design.title,
      summary: design.design.summary,
      status: 'draft',
      sourceDocuments: design.design.sourceDocuments,
    },
    summary: design.summary,
    overview: { sections: rendererSections },
    facts: design.facts,
    decisions: design.decisions,
    gaps: design.gaps,
    openQuestions: design.openQuestions,
  };

  const humanReview = {
    reviewVersion: 0,
    decisions: Object.fromEntries(design.decisions.map((d) => [d.id, { status: 'pending', comment: '' }])),
    openQuestions: Object.fromEntries(design.openQuestions.map((q) => [q.id, { status: 'pending', comment: '' }])),
    gaps: Object.fromEntries(design.gaps.map((g) => [g.id, { status: 'pending', comment: '' }])),
  };

  const loadResult = {
    ok: true,
    errors: [],
    warnings: [],
    modelPath: path.relative(ROOT, overviewPath).replace(/\\/g, '/'),
    humanReviewPath: '(preview)',
    humanReviewExists: false,
    model,
    humanReview,
    gate: { ready: false, blockers: [] },
    summary: null,
  };

  const bootstrap = {
    plan: 'gold',
    model: generated.generation ? generated.generation.model : null,
    promptSha256: generated.generation ? generated.generation.promptSha256 : null,
    planSha256: generated.generation ? generated.generation.planSha256 : null,
    complete: generated.generation ? generated.generation.complete : null,
    generatedAt: generated.generation ? generated.generation.assembledAt : null,
    blockCount: generated.blocks.length,
    stages: rendererSections.map((s) => ({ id: s.id, title: s.title, blocks: s.blocks.length })),
  };

  // 原文回查数据（与 Electron 里的 Source 面板同源）
  const sourcePayload = {
    document: sections.document,
    sections: sections.sections,
  };

  // 到仓库根的相对路径（preview 输出在不同深度，必须算出来而不是硬编码）
  const relPrefix = path.relative(path.dirname(outPath), ROOT).split(path.sep).join('/');
  const rel = relPrefix === '' ? '.' : relPrefix;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>Overview Preview（Stage 2 生成）</title>
<link rel="stylesheet" href="${rel}/app/renderer/styles.css" />
<style>
  /* Preview 专用的顶部横幅与实验说明 —— 不进入产品 UI */
  .preview-banner {
    background: #1d242e; color: #fff; padding: 10px 18px; font: 13px/1.6 "Segoe UI","Microsoft YaHei",system-ui,sans-serif;
  }
  .preview-banner b { color: #ffd479; }
  .preview-banner .meta { color: #b9c4d2; font-size: 12px; }
  .preview-banner button {
    background: #2f3a49; color: #fff; border: 1px solid #46536b; border-radius: 6px;
    padding: 3px 10px; font: inherit; font-size: 12px; cursor: pointer; margin-left: 10px;
  }
  #preview-note { display: none; background: #2f3a49; color: #dfe6ef; padding: 12px 18px; font-size: 12.5px; line-height: 1.7; }
  #preview-note ul { margin: 6px 0 0; padding-left: 20px; }
  #screen-review { height: calc(100% - 42px); }
</style>
</head>
<body>
<section id="screen-start" class="screen hidden">
  <!-- 真实 renderer 在启动时会绑定首屏控件；preview 里它们被隐藏，只为让绑定成功。 -->
  <button id="btn-pick-markdown"></button>
  <button id="btn-use-default-markdown"></button>
  <button id="btn-load-fixture"></button>
  <button id="btn-open-json"></button>
  <div id="md-info"></div>
  <div id="fixture-info"></div>
  <div id="start-error" class="hidden"></div>
</section>

<div class="preview-banner">
  <b>Stage 2 生成预览</b>（Plan = Gold，未使用 Stage 1 生成结果）
  <button id="preview-note-toggle">这是什么？</button>
  <div class="meta" id="preview-meta"></div>
</div>
<div id="preview-note">
  这份预览由**现有 deterministic renderer** 直接渲染 Stage 2 生成的 <code>overview.generated.json</code>，
  AI 没有生成任何 HTML。它的用途只有一个：回答"全部 AI block 拼起来之后，整份方案是否真的成为了一份可阅读的视觉重述？"
  <ul>
    <li>区块右上角的 <code>Source: §9</code> 可以点开右侧原文面板回查（与 Electron 版同源数据）。</li>
    <li>区块标题右侧的"折叠 / 展开"可以收起任何区块。</li>
    <li>顶部"决策清单"切过去后内容为空 —— 本次实验只生成 Overview，不生成决策清单。</li>
  </ul>
</div>

<section id="screen-review" class="screen hidden" data-view="overview">
  <header class="topbar">
    <div class="topbar-left">
      <div class="doc-title" id="design-title">—</div>
      <div class="doc-meta">
        <span id="design-id" class="pill"></span>
        <span id="design-status" class="pill"></span>
        <span id="model-path" class="mono muted small"></span>
      </div>
    </div>
    <div class="topbar-right">
      <nav class="view-switch">
        <button class="nav-item active" data-view="overview">方案总览</button>
        <button class="nav-item" data-view="decisions">决策清单 <span id="nav-decision-count" class="nav-count"></span></button>
      </nav>
      <div id="gate-badge" class="gate-badge pending">—</div>
      <button id="btn-save" class="btn primary">保存 human-review.json</button>
      <button id="btn-reload" class="btn ghost">重新加载</button>
      <button id="btn-back" class="btn ghost">返回</button>
    </div>
  </header>

  <div class="layout">
    <aside class="toc-pane">
      <nav id="toc" class="toc"></nav>
      <div class="toc-foot">
        <div id="stage-indicator" class="stage-indicator">当前阅读：—</div>
        <div id="save-state" class="muted small">preview</div>
        <button id="btn-reveal" class="link-btn">打开 human-review.json 位置</button>
      </div>
    </aside>
    <main id="main" class="main"></main>
    <aside id="source-panel" class="source-pane hidden">
      <div class="source-head">
        <div id="source-head" class="source-head-inner"></div>
        <button id="source-close" class="btn tiny ghost">关闭</button>
      </div>
      <div id="source-body" class="source-body"></div>
    </aside>
  </div>
</section>

<script>
  // ---- Preview host shim：把真实 renderer 需要的宿主编译期依赖接上 ----
  // 真实 renderer（app/renderer/app.js）通过 window.designReview 访问宿主；
  // preview 用同一份数据在本地应答，不发起任何 IPC（Electron 未参与）。
  window.__PREVIEW__ = ${JSON.stringify({ bootstrap, sourcePayload }, null, 2)};

  window.designReview = {
    paths: async () => ({ defaultFixture: '(preview)' }),
    loadSource: async () => ({ ok: true, document: window.__PREVIEW__.sourcePayload.document, sections: window.__PREVIEW__.sourcePayload.sections }),
    loadFixture: async () => window.__PREVIEW__.loadResult,
    loadDesignPath: async () => window.__PREVIEW__.loadResult,
    openDesignJson: async () => ({ ok: false, canceled: true }),
    saveDesignJson: async () => ({ ok: false, errors: ['preview 不支持保存'] }),
    openMarkdown: async () => ({ ok: false, canceled: true }),
    readDefaultMarkdown: async () => ({ ok: false, errors: ['preview 无原文文件'] }),
    saveHumanReview: async () => ({ ok: false, errors: ['preview 不支持保存'] }),
    revealHumanReview: async () => ({ ok: false }),
    evaluateGate: async () => ({ ok: true, gate: { ready: false, blockers: [] } }),
  };
  window.__PREVIEW__.loadResult = ${JSON.stringify(loadResult)};
</script>

<script src="${rel}/app/shared/semantics.js"></script>
<script src="${rel}/app/renderer/app.js"></script>
<script>
  // renderer 已加载完毕：把数据推进去（走它自己的 applyLoadResult 路径）
  document.getElementById('preview-meta').textContent =
    'model=' + (window.__PREVIEW__.bootstrap.model || '?') +
    '｜promptSha256=' + (window.__PREVIEW__.bootstrap.promptSha256 || '?') +
    '｜planSha256=' + (window.__PREVIEW__.bootstrap.planSha256 || '?') +
    '｜blocks=' + window.__PREVIEW__.bootstrap.blockCount +
    '｜complete=' + window.__PREVIEW__.bootstrap.complete;
  document.getElementById('preview-note-toggle').addEventListener('click', () => {
    const n = document.getElementById('preview-note');
    n.style.display = n.style.display === 'block' ? 'none' : 'block';
  });
  window.__applyLoadResult(window.__PREVIEW__.loadResult);
</script>
</body>
</html>
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');

  console.log('=== 生成 Preview ===');
  console.log(`overview  ${path.relative(ROOT, overviewPath)}`);
  console.log(`output    ${path.relative(ROOT, outPath)}`);
  console.log(`sections  ${rendererSections.length} 段 / ${generated.blocks.length} 个 block`);
  rendererSections.forEach((s) => console.log(`  ${s.id.padEnd(9)} ${s.blocks.length} 块：${s.blocks.map((b) => b.id).join(', ')}`));
  console.log('');
  console.log('说明：HTML 由现有 deterministic renderer 渲染（直接引用 app/renderer/app.js 与 styles.css），');
  console.log('      AI 未生成任何 HTML；Electron 未参与。');
}

main();
