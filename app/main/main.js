'use strict';

/**
 * 主进程：本地文件访问 + 结构化分析结果加载。
 *
 * 职责边界（agent.md 第二节）：
 * - 打开 / 读取本地文件：仅在此进程完成；
 * - 不调用任何 AI / 网络服务（Phase 1 不接 AI）；
 * - 保存 design-review.json 与 human-review.json；
 * - AI 不得静默覆盖 human-review.json —— 因此本进程没有“自动写 human-review”的路径，
 *   human-review.json 只在用户点击保存时由渲染进程显式发起。
 */

const path = require('node:path');
const fs = require('node:fs/promises');
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');

const { validate } = require('../shared/schema-validator');
const { semanticCheck } = require('../shared/review-model');
const semantics = require('../shared/semantics');
const { evaluateGate, buildHumanReviewSkeleton } = semantics;

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SELF_TEST = process.argv.includes('--selftest');
/** `--verify-preview <file>`：加载生成的 preview HTML 并断言 DOM（实验性验证，不改 UI）。 */
const VERIFY_PREVIEW = (() => {
  const i = process.argv.indexOf('--verify-preview');
  return i >= 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null;
})();
if (SELF_TEST || VERIFY_PREVIEW) {
  // 无人值守运行不需要 GPU；关掉可避免退出时的 command_buffer 相关 stderr 噪音。
  app.disableHardwareAcceleration();
}
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'schema', 'design-review.schema.json');
const DEFAULT_FIXTURE = path.join(PROJECT_ROOT, 'fixtures', 'context-consumption.json');
const DEFAULT_DOCUMENT = path.join(PROJECT_ROOT, '测试文档', '18-context-consumption-semantic-model.md');
const DEFAULT_HUMAN_REVIEW = path.join(PROJECT_ROOT, 'human-review.json');
const SOURCE_SECTIONS = path.join(PROJECT_ROOT, 'docs', 'source-sections.json');

let mainWindow = null;
/** 最近一次成功加载的模型与来源，供保存 human-review.json 时使用。 */
let state = { modelPath: null, model: null, humanReviewPath: DEFAULT_HUMAN_REVIEW, humanReview: null };

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON 解析失败 (${path.basename(filePath)}): ${error.message}`);
  }
}

async function loadSchema() {
  return readJson(SCHEMA_PATH);
}

/** 原子写入 JSON：先写临时文件再 rename，避免写坏 human-review.json。 */
async function writeJsonAtomic(targetPath, value) {
  const temp = `${targetPath}.tmp-${process.pid}`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temp, targetPath);
}

/** 校验 design-review.json：Schema 失败直接拒绝进入 UI。 */
async function validateModel(model) {
  const schema = await loadSchema();
  const schemaResult = validate(schema, model);
  if (!schemaResult.valid) {
    return { ok: false, stage: 'schema', errors: schemaResult.errors, warnings: [] };
  }
  const semantic = semanticCheck(model);
  if (semantic.errors.length > 0) {
    return { ok: false, stage: 'semantic', errors: semantic.errors, warnings: semantic.warnings };
  }
  return { ok: true, errors: [], warnings: semantic.warnings };
}

/**
 * 加载一个 design-review.json（fixture 或 AI 输出），并把它与 human-review.json 合并成 UI 需要的载荷。
 */
async function loadDesignReview(modelPath, humanReviewPath) {
  const resolvedModel = path.resolve(modelPath);
  const model = await readJson(resolvedModel);

  const check = await validateModel(model);
  if (!check.ok) {
    return {
      ok: false,
      stage: check.stage,
      errors: check.errors,
      warnings: check.warnings,
      modelPath: resolvedModel,
    };
  }

  const resolvedHuman = path.resolve(humanReviewPath || DEFAULT_HUMAN_REVIEW);
  let humanReview = null;
  let humanReviewExists = false;
  try {
    humanReview = await readJson(resolvedHuman);
    humanReviewExists = true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      return { ok: false, stage: 'human-review', errors: [error.message], warnings: [], modelPath: resolvedModel };
    }
  }

  const effectiveHuman = humanReview || buildHumanReviewSkeleton(model);
  // 补齐新增对象：design-review.json 重新生成后，human-review.json 可能缺少新 id。
  const skeleton = buildHumanReviewSkeleton(model);
  ['decisions', 'openQuestions', 'gaps'].forEach((bucket) => {
    effectiveHuman[bucket] = Object.assign({}, skeleton[bucket], effectiveHuman[bucket] || {});
  });

  state = {
    modelPath: resolvedModel,
    model,
    humanReviewPath: resolvedHuman,
    humanReview: effectiveHuman,
  };

  return {
    ok: true,
    errors: [],
    warnings: check.warnings,
    modelPath: resolvedModel,
    humanReviewPath: resolvedHuman,
    humanReviewExists,
    model,
    humanReview: effectiveHuman,
    gate: evaluateGate(model, effectiveHuman),
    summary: semantics.reviewSummary(model, effectiveHuman),
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#12161c',
    title: 'Design Review',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpc() {
  ipcMain.handle('app:paths', () => ({
    projectRoot: PROJECT_ROOT,
    defaultFixture: DEFAULT_FIXTURE,
    defaultDocument: DEFAULT_DOCUMENT,
    defaultHumanReview: DEFAULT_HUMAN_REVIEW,
  }));

  ipcMain.handle('design:loadFixture', () => loadDesignReview(DEFAULT_FIXTURE, state.humanReviewPath));

  ipcMain.handle('design:openJson', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 design-review.json',
      defaultPath: PROJECT_ROOT,
      filters: [{ name: 'Design Review JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };
    return loadDesignReview(result.filePaths[0], state.humanReviewPath);
  });

  ipcMain.handle('design:loadPath', async (_event, payload) => {
    if (!payload || typeof payload.path !== 'string' || payload.path.trim() === '') {
      return { ok: false, stage: 'input', errors: ['未提供路径'] };
    }
    try {
      return await loadDesignReview(payload.path, state.humanReviewPath);
    } catch (error) {
      return { ok: false, stage: 'read', errors: [error.message] };
    }
  });

  ipcMain.handle('document:openMarkdown', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 Markdown 设计文档',
      defaultPath: path.join(PROJECT_ROOT, '测试文档'),
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };
    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, 'utf8');
    return {
      ok: true,
      path: filePath,
      name: path.basename(filePath),
      content,
      lines: content.split(/\r?\n/).length,
    };
  });

  ipcMain.handle('document:readDefault', async () => {
    const content = await fs.readFile(DEFAULT_DOCUMENT, 'utf8');
    return {
      ok: true,
      path: DEFAULT_DOCUMENT,
      name: path.basename(DEFAULT_DOCUMENT),
      content,
      lines: content.split(/\r?\n/).length,
    };
  });

  /** 只为 Phase 2 预留：把生成好的 design-review.json 写入磁盘（校验不通过就不落盘）。 */
  ipcMain.handle('design:saveJson', async (_event, payload) => {
    if (!payload || typeof payload.content !== 'string') {
      return { ok: false, errors: ['缺少 content'] };
    }
    const target = payload.path
      ? path.resolve(payload.path)
      : path.join(PROJECT_ROOT, 'design-review.json');
    let parsed;
    try {
      parsed = JSON.parse(payload.content);
    } catch (error) {
      return { ok: false, errors: [`JSON 解析失败: ${error.message}`] };
    }
    const check = await validateModel(parsed);
    if (!check.ok) {
      return { ok: false, stage: check.stage, errors: check.errors, warnings: check.warnings };
    }
    await writeJsonAtomic(target, parsed);
    return { ok: true, path: target, warnings: check.warnings };
  });

  /**
   * 保存人工审核结果。
   *
   * 约束（agent.md 第六节）：
   * - 只能由用户显式动作触发；AI 侧没有任何路径调用它；
   * - 重写时保留 AI 侧不可见但人工有意义的字段（例如人工备注之外的自定义键）；
   * - 绝不写入 design-review.json。
   */
  ipcMain.handle('humanReview:save', async (_event, payload) => {
    if (!payload || typeof payload !== 'object' || typeof payload.humanReview !== 'object') {
      return { ok: false, errors: ['缺少 humanReview 载荷'] };
    }
    const target = payload.path ? path.resolve(payload.path) : state.humanReviewPath;
    if (!target) return { ok: false, errors: ['未确定 human-review.json 目标路径'] };

    const existing = state.humanReview || {};
    const buckets = ['decisions', 'openQuestions', 'gaps'];
    const mergeBucket = (incoming, previous) => {
      const merged = {};
      const keys = new Set([...Object.keys(previous || {}), ...Object.keys(incoming || {})]);
      keys.forEach((key) => {
        const prev = (previous && previous[key]) || {};
        const next = (incoming && incoming[key]) || {};
        merged[key] = {
          ...prev,
          ...next,
          status: next.status || prev.status || 'pending',
          comment: next.comment !== undefined ? next.comment : prev.comment || '',
        };
      });
      return merged;
    };

    const review = {
      ...existing,
      reviewVersion: (existing.reviewVersion || 0) + 1,
      designId: state.model ? state.model.design.id : existing.designId,
      designReviewPath: state.modelPath ? path.relative(PROJECT_ROOT, state.modelPath) : existing.designReviewPath,
      updatedAt: new Date().toISOString(),
    };
    buckets.forEach((bucket) => {
      review[bucket] = mergeBucket(payload.humanReview[bucket], existing[bucket]);
    });

    try {
      await writeJsonAtomic(target, review);
    } catch (error) {
      return { ok: false, errors: [error.message] };
    }
    state.humanReview = review;
    state.humanReviewPath = target;
    const gate = state.model ? evaluateGate(state.model, review) : { ready: false, blockers: [] };
    const summary = state.model ? semantics.reviewSummary(state.model, review) : null;
    return { ok: true, path: target, humanReview: review, gate, summary };
  });

  ipcMain.handle('humanReview:reveal', async () => {
    if (!state.humanReviewPath) return { ok: false };
    shell.showItemInFolder(state.humanReviewPath);
    return { ok: true, path: state.humanReviewPath };
  });

  ipcMain.handle('gate:evaluate', () => {
    if (!state.model) return { ok: false, errors: ['尚未加载 design-review.json'] };
    return { ok: true, gate: evaluateGate(state.model, state.humanReview || buildHumanReviewSkeleton(state.model)) };
  });

  /**
   * 原文回查：Overview 里的 Source 标签点开时，右侧面板显示对应章节。
   * 数据来自 docs/source-sections.json（由 scripts/extract-source-sections.js 从 Markdown 切分）。
   */
  ipcMain.handle('source:load', async () => {
    try {
      const payload = await readJson(SOURCE_SECTIONS);
      return { ok: true, document: payload.document, sections: payload.sections };
    } catch (error) {
      return { ok: false, errors: [`无法读取原文分段（${path.basename(SOURCE_SECTIONS)}）：${error.message}`] };
    }
  });
}

/**
 * 无人值守自检（`npm run selftest`）。
 *
 * 它不做任何“代替人工审核”的事情，只是通过真实渲染进程调用 preload IPC，
 * 确认“fixture → Review UI → human-review.json → Gate”链路确实可用，
 * 然后退出。人工审核仍然只能由人在 UI 中完成。
 */
async function runSelfTest() {
  const report = [];
  const fail = (message) => {
    report.push(`✗ ${message}`);
  };
  const ok = (message) => {
    report.push(`✓ ${message}`);
  };

  const emit = () => {
    const text = report.join('\n');
    process.stdout.write(`\n===== SELFTEST =====\n${text}\n===== END =====\n`);
  };

  try {
    const load = await loadDesignReview(DEFAULT_FIXTURE, DEFAULT_HUMAN_REVIEW);
    if (!load.ok) throw new Error(`fixture 加载失败: ${(load.errors || []).join('; ')}`);
    ok(`fixture 加载: decisions=${load.model.decisions.length} gaps=${load.model.gaps.length} openQuestions=${load.model.openQuestions.length}`);
    ok(
      `reviewLevel 分布: root=${load.summary.decisions.rootTotal} supporting=${load.model.decisions.filter((d) => d.reviewLevel === 'supporting').length} derived=${load.model.decisions.filter((d) => d.reviewLevel === 'derived').length}`
    );
    ok(
      `Question 类别: blocking=${load.summary.questions.blocking}（architecture/implementation）, 非阻塞=${load.summary.questions.advisory}（deferred/research）`
    );
    if (load.gate.ready === false) {
      const qBlockers = load.gate.blockers.filter((b) => b.kind === 'blocking-open-question');
      ok(`初始 Gate=BLOCKED (${load.gate.blockers.length} 项，其中 blocking question ${qBlockers.length} 项)`);
      if (qBlockers.length === load.summary.questions.blocking) {
        ok('Gate 的 blocking question 数与类别判定一致');
      } else {
        fail(`Gate 与类别判定不一致: ${qBlockers.length} vs ${load.summary.questions.blocking}`);
      }
    } else {
      fail('初始 Gate 不应为 ready');
    }

    const win = mainWindow;
    if (!win) throw new Error('没有窗口');
    await new Promise((resolve) => {
      if (!win.webContents.isLoading()) return resolve();
      win.webContents.once('did-finish-load', resolve);
    });

    const domCheck = await win.webContents.executeJavaScript(
      `(() => ({
         hasApi: typeof window.designReview === 'object',
         hasMermaid: typeof window.mermaid !== 'undefined',
         sections: ['screen-start','screen-review','design-title','main','gate-badge','save-state']
           .filter((id) => !document.getElementById(id)).length === 0,
       }))()`
    );
    if (domCheck.hasApi) ok('preload API 已在渲染进程暴露');
    else fail('preload API 未暴露');
    if (domCheck.hasMermaid) ok('Mermaid 已随包加载（离线可用）');
    else fail('Mermaid 未加载');
    if (domCheck.sections) ok('页面五个核心区域容器存在');
    else fail('页面缺少核心区域容器');

    const uiResult = await win.webContents.executeJavaScript(
      `(async () => {
         const loaded = await window.designReview.loadFixture();
         const applied = window.__applyLoadResult ? window.__applyLoadResult(loaded) : { applied: false, reason: 'no hook' };
         return { loadedOk: loaded.ok, applied };
       })()`
    );
    if (uiResult.loadedOk) ok('渲染进程可通过 IPC 加载 fixture');
    else fail('渲染进程加载 fixture 失败');
    if (uiResult.applied && uiResult.applied.applied) {
      ok(`fixture 已进入 Review UI（导航项已渲染）`);
    } else {
      fail(`fixture 未进入 Review UI: ${JSON.stringify(uiResult.applied)}`);
    }

    const rendered = await win.webContents.executeJavaScript(
      `(() => ({
         navItems: [...document.querySelectorAll('.nav-item')].map((n) => n.textContent.trim()),
         statCards: document.querySelectorAll('.stat-card').length,
         reviewCards: document.querySelectorAll('.review-card').length,
         gateCards: document.querySelectorAll('.gate-card').length,
         gateBadge: document.getElementById('gate-badge').textContent,
       }))()`
    );
    if (rendered.navItems.length === 2 && rendered.navItems[0].startsWith('方案总览') && rendered.navItems[1].startsWith('决策清单')) {
      ok(`一级导航只有两个页面：${rendered.navItems.join(' / ')}`);
    } else {
      fail(`导航结构异常: ${JSON.stringify(rendered.navItems)}`);
    }
    if (rendered.statCards === 0 && rendered.reviewCards === 0 && rendered.gateCards === 0) {
      ok('没有统计卡片 / Dashboard 卡片 / 阻塞面板');
    } else {
      fail(`仍有面板类元素: stat=${rendered.statCards} review=${rendered.reviewCards} gate=${rendered.gateCards}`);
    }

    // 方案总览 = 完整视觉重述：四段 + 全部区块 + 常驻目录
    const overview = await win.webContents.executeJavaScript(
      `(() => {
         const blocks = [...document.querySelectorAll('.block')];
         const byId = (id) => document.getElementById('block-' + id);
         return {
           stageHeads: [...document.querySelectorAll('.stage-head .stage-title')].map((n) => n.textContent),
           blockCount: blocks.length,
           blockIds: blocks.map((n) => n.dataset.blockId),
           expandedBlocks: blocks.filter((n) => !n.classList.contains('collapsed')).length,
           collapsedBlocks: blocks.filter((n) => n.classList.contains('collapsed')).length,
           tocGroups: [...document.querySelectorAll('.toc-stage')].map((n) => n.textContent),
           tocItems: document.querySelectorAll('.toc-item').length,
           sourceChips: document.querySelectorAll('.src-chip').length,
           objChips: document.querySelectorAll('.obj-chip').length,
           contentTypes: [...new Set(blocks.map((n) => [...n.querySelector('div.block-body').children].map((c) => c.className.split(' ')[0]).join(',')))].length,
           hasProse: !!document.querySelector('.c-prose'),
           hasFlow: !!document.querySelector('.c-flow'),
           hasLadder: !!document.querySelector('.c-ladder'),
           hasMatrix: !!document.querySelector('.c-matrix'),
           hasChecklist: !!document.querySelector('.c-checklist'),
           hasSteps: !!document.querySelector('.c-steps'),
           hasCombo: !!document.querySelector('.c-combo'),
           hasDiff: !!document.querySelector('.c-diff'),
           flowLanes: document.querySelectorAll('.lane').length,
           matrixTables: document.querySelectorAll('table.matrix').length,
           overviewEnd: !!document.querySelector('.overview-end'),
           blockingVisibleOnTop: /blocking/i.test(document.querySelector('#main')?.textContent || ''),
           activeTocItems: document.querySelectorAll('.toc-item.active').length,
         };
       })()`
    );
    const expectedStages = ['甲 · 这是什么', '乙 · 它怎么跑', '丙 · 怎么算发生了', '丁 · 边界与反模式'];
    if (overview.stageHeads.join(',') === expectedStages.join(',')) {
      ok(`方案总览按四段推进：${overview.stageHeads.join(' → ')}`);
    } else {
      fail(`段落异常: ${JSON.stringify(overview.stageHeads)}`);
    }
    const expectedBlockIds = load.model.overview.sections.flatMap((s) => s.blocks.map((b) => b.id));
    if (overview.blockCount === expectedBlockIds.length && overview.blockIds.join(',') === expectedBlockIds.join(',')) {
      ok(`O-01 ~ O-14 全部有承载位置（${overview.blockCount} 个区块：${overview.blockIds.join(', ')}）`);
    } else {
      fail(`区块缺失或顺序异常: ${JSON.stringify(overview.blockIds)}`);
    }
    const expectedExpanded = load.model.overview.sections.flatMap((s) => s.blocks).filter((b) => b.defaultExpanded).length;
    if (overview.expandedBlocks === expectedExpanded && overview.collapsedBlocks === overview.blockCount - expectedExpanded) {
      ok(`区块默认折叠生效（展开 ${overview.expandedBlocks} / 折叠 ${overview.collapsedBlocks}）`);
    } else {
      fail(`折叠状态异常: 展开 ${overview.expandedBlocks}，期望 ${expectedExpanded}`);
    }
    if (overview.tocGroups.join(',') === expectedStages.join(',') && overview.tocItems === overview.blockCount) {
      ok(`左侧常驻目录：${overview.tocGroups.length} 段 / ${overview.tocItems} 个区块条目`);
    } else {
      fail(`目录异常: ${JSON.stringify(overview.tocGroups)} items=${overview.tocItems}`);
    }
    if (overview.activeTocItems === 1) ok('滚动位置对应"我在读哪一段"的目录高亮');
    else fail(`目录高亮数量异常: ${overview.activeTocItems}`);
    if (overview.sourceChips >= overview.blockCount) {
      ok(`每个区块都有 Source 回原文入口（${overview.sourceChips} 个标签）`);
    } else {
      fail(`Source 标签数量不足: ${overview.sourceChips} < ${overview.blockCount}`);
    }
    if (overview.objChips > 0) ok(`区块底部列出可跳转的 Review Object（${overview.objChips} 个）`);
    else fail('没有 Review Object 关联 chip');

    // 折叠区块的内容不渲染，所以"八种形式都用上"看数据；DOM 只验证默认展开的部分真的画出来了
    const allBlocksData = load.model.overview.sections.flatMap((s) => s.blocks);
    const dataShapes = [...new Set(allBlocksData.map((b) => b.content.type))];
    const expectedShapes = ['prose', 'flow', 'ladder', 'matrix', 'checklist', 'steps', 'combo', 'diff'];
    if (expectedShapes.every((t) => dataShapes.includes(t))) {
      ok(`八种承载形式全部用上：${dataShapes.join(', ')}`);
    } else {
      fail(`承载形式缺失: ${JSON.stringify(dataShapes)}`);
    }
    const domShapes = [
      ['prose', overview.hasProse],
      ['flow', overview.hasFlow],
      ['ladder', overview.hasLadder],
      ['matrix', overview.hasMatrix],
      ['checklist', overview.hasChecklist],
    ].filter(([, present]) => present).map(([name]) => name);
    if (domShapes.length === 5) ok(`默认展开的区块已实际渲染：${domShapes.join(', ')}（折叠的 ${expectedShapes.length - domShapes.length} 种展开后才渲染）`);
    else fail(`展开区块渲染异常，只有: ${domShapes.join(', ')}`);
    // 折叠的区块不渲染内容，因此期望值只统计"默认展开"的块
    const expectedLanes = allBlocksData
      .filter((b) => b.content.type === 'flow' && b.defaultExpanded)
      .reduce((n, b) => n + b.content.lanes.length, 0);
    const expectedMatrices = allBlocksData
      .filter((b) => b.content.type === 'matrix' && b.defaultExpanded)
      .reduce((n) => n + 1, 0);
    if (overview.flowLanes === expectedLanes && overview.matrixTables === expectedMatrices) {
      ok(`流程图与对照表已渲染（lane ${overview.flowLanes} 个 / matrix ${overview.matrixTables} 张）`);
    } else {
      fail(`数量异常: lane ${overview.flowLanes}/${expectedLanes} matrix ${overview.matrixTables}/${expectedMatrices}`);
    }
    if (overview.overviewEnd) ok('总览有明确的结束标记');
    if (overview.blockingVisibleOnTop === false) ok('总览首屏没有直接铺 blocking 项目列表');
    else fail('总览出现了 blocking 字样');
    ok(`Gate badge = ${rendered.gateBadge}`);

    // 折叠后内容真的消失（结构性折叠，不是假折叠）
    const foldFlow = await win.webContents.executeJavaScript(
      `(() => {
         const block = document.querySelector('.block:not(.ambient)');
         const id = block.dataset.blockId;
         const toggle = block.querySelector('.block-toggle');
         const labelBefore = toggle.textContent;
         toggle.click();
         const after = document.getElementById('block-' + id);
         const collapsed = after.classList.contains('collapsed');
         const bodyChildren = after.querySelector('.block-body').children.length;
         after.querySelector('.block-toggle').click();
         const restored = document.getElementById('block-' + id);
         return { id, labelBefore, collapsed, bodyChildren, restored: !restored.classList.contains('collapsed') };
       })()`
    );
    if (foldFlow.collapsed && foldFlow.bodyChildren === 0 && foldFlow.restored) {
      ok(`区块折叠会真正收起内容并可在原处展开（${foldFlow.id}）`);
    } else {
      fail(`折叠行为异常: ${JSON.stringify(foldFlow)}`);
    }

    // Source 双向导航：点标签 → 右侧显示对应原文段落
    const sourceFlow = await win.webContents.executeJavaScript(
      `(async () => {
         const chip = document.querySelector('.src-chip');
         const label = chip.textContent.replace('Source: ', '').trim();
         chip.click();
         const deadline = Date.now() + 3000;
         while (Date.now() < deadline) {
           if (!document.getElementById('source-panel').classList.contains('hidden')) break;
           await new Promise((r) => setTimeout(r, 60));
         }
         const text = document.getElementById('source-body').textContent || '';
         return {
           label,
           panelOpen: !document.getElementById('source-panel').classList.contains('hidden'),
           withSource: document.getElementById('screen-review').classList.contains('with-source'),
           title: document.getElementById('source-head').textContent,
           textLength: text.length,
           navCount: document.querySelectorAll('.source-nav-item').length,
           stayInPlace: !!document.querySelector('.block'),
         };
       })()`
    );
    if (sourceFlow.panelOpen && sourceFlow.withSource && sourceFlow.textLength > 100) {
      ok(`点 Source: ${sourceFlow.label} → 右侧显示原文段落（${sourceFlow.textLength} 字），页面不跳走`);
    } else {
      fail(`Source 回查异常: ${JSON.stringify(sourceFlow)}`);
    }
    if (sourceFlow.navCount === 16) ok(`原文面板可切换到全部 ${sourceFlow.navCount} 个章节`);
    else fail(`原文章节数异常: ${sourceFlow.navCount}`);
    if (sourceFlow.stayInPlace) ok('打开原文面板时视觉总览仍在原位（不是跳转）');
    else fail('打开原文面板后总览消失');

    const closed = await win.webContents.executeJavaScript(
      `(() => { document.getElementById('source-close').click();
                return { hidden: document.getElementById('source-panel').classList.contains('hidden') }; })()`
    );
    if (closed.hidden) ok('原文面板可关闭，回到纯视觉阅读');
    else fail('原文面板无法关闭');

    // 浅色主题：背景白色、正文黑色
    const theme = await win.webContents.executeJavaScript(
      `(() => {
         const rgb = (value) => (value.match(/\\d+/g) || []).slice(0, 3).map(Number);
         const lum = (c) => (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114);
         const bodyStyle = getComputedStyle(document.body);
         const mainStyle = getComputedStyle(document.getElementById('main'));
         const sidebarStyle = getComputedStyle(document.querySelector('.toc-pane'));
         return {
           bodyBg: rgb(bodyStyle.backgroundColor),
           mainBg: rgb(mainStyle.backgroundColor),
           sidebarBg: rgb(sidebarStyle.backgroundColor),
           text: lum(rgb(bodyStyle.color)),
         };
       })()`
    );
    const isLight = (c) => c[0] >= 245 && c[1] >= 245 && c[2] >= 245;
    if (isLight(theme.bodyBg) && isLight(theme.mainBg) && isLight(theme.sidebarBg)) {
      ok(`背景为白色 (body rgb(${theme.bodyBg.join(',')}), main rgb(${theme.mainBg.join(',')}))`);
    } else {
      fail(`背景不是白色: ${JSON.stringify(theme)}`);
    }
    if (theme.text < 80) ok(`正文文字为深色 (亮度 ${theme.text.toFixed(0)}/255)`);
    else fail(`正文文字不够深: 亮度 ${theme.text.toFixed(0)}/255`);

    // 决策清单：所有 Decision 都在这一个页面里，按 reviewLevel 分组
    const listView = await win.webContents.executeJavaScript(
      `(() => {
         document.querySelector('.nav-item[data-view="decisions"]').click();
         const cards = [...document.querySelectorAll('.decision-card')];
         const sections = [...document.querySelectorAll('.decision-section')].map((sec) => ({
           title: sec.querySelector('.decision-section-title')?.textContent || null,
           ids: [...sec.querySelectorAll('.decision-card')].map((c) => c.dataset.decisionId),
         }));
         return {
           cards: cards.length,
           ids: cards.map((c) => c.dataset.decisionId),
           sections,
           navCount: document.getElementById('nav-decision-count').textContent,
         };
       })()`
    );
    if (listView.cards === load.model.decisions.length) {
      ok(`决策清单在一个页面里展示全部 ${listView.cards} 条决策`);
    } else {
      fail(`决策数量异常: ${listView.cards}`);
    }
    const groupedIds = listView.sections.flatMap((s) => s.ids);
    if (groupedIds.length === load.model.decisions.length && new Set(groupedIds).size === groupedIds.length) {
      ok(`按 reviewLevel 分组且每条只出现一次（${listView.sections.map((s) => `${s.title} ${s.ids.length}`).join(' / ')}）`);
    } else {
      fail(`分组异常: ${JSON.stringify(listView.sections)}`);
    }
    if (
      listView.navCount.includes(`${load.summary.decisions.counts.pending}/${load.model.decisions.length}`)
    ) {
      ok(`侧栏计数为「${listView.navCount}」`);
    } else {
      fail(`侧栏计数异常: ${listView.navCount}`);
    }

    // 每条 Decision 默认只展示：标题 / 问题 / AI 建议 / 一句话原因 / 审核动作
    const cardDefault = await win.webContents.executeJavaScript(
      `(() => {
         const card = document.querySelector('.decision-card');
         return {
           id: card.dataset.decisionId,
           title: card.querySelector('.detail-title')?.textContent || null,
           labels: [...card.querySelectorAll('.field-label')].map((n) => n.textContent.trim()),
           actions: [...card.querySelectorAll('.decision-actions .btn')].map((b) => b.textContent),
           actionKeys: [...card.querySelectorAll('.decision-actions .btn')].map((b) => b.dataset.action),
           toggle: card.querySelector('.details-toggle')?.textContent || null,
           disclosures: card.querySelectorAll('.disclosure').length,
           openDisclosures: card.querySelectorAll('.disclosure.open').length,
         };
       })()`
    );
    const expectedFields = ['问题', 'AI 建议', '为什么这样建议'];
    if (cardDefault.labels.join(',') === expectedFields.join(',')) {
      ok(`Decision 默认只展示 ${cardDefault.labels.length} 个字段：${cardDefault.labels.join(' / ')}`);
    } else {
      fail(`默认字段不符: ${JSON.stringify(cardDefault.labels)}`);
    }
    const expectedActions2 = ['同意', '不同意', '以后再说'];
    if (cardDefault.actions.join(',') === expectedActions2.join(',')) {
      ok(`默认展示三个审核动作：${cardDefault.actions.join(' / ')}`);
    } else {
      fail(`审核动作不符: ${JSON.stringify(cardDefault.actions)}`);
    }
    if (cardDefault.actionKeys.join(',') === 'approved,rejected,needs-revision') {
      ok('三个动作映射到 approved / rejected / needs-revision（不新增状态）');
    } else {
      fail(`动作状态映射异常: ${cardDefault.actionKeys.join(',')}`);
    }
    if (cardDefault.disclosures === 0 && cardDefault.openDisclosures === 0 && cardDefault.toggle === '查看详情') {
      ok('Alternatives / Rationale / Consequences / Current-Target / Evidence 默认全部折叠（0 个 disclosure 渲染）');
    } else {
      fail(`默认折叠异常: ${JSON.stringify(cardDefault)}`);
    }

    // 点击"查看详情"后展开附属信息
    const expandedFlow = await win.webContents.executeJavaScript(
      `(() => {
         const card = document.querySelector('.decision-card');
         const id = card.dataset.decisionId;
         card.querySelector('.details-toggle').click();
         const card2 = [...document.querySelectorAll('.decision-card')].find((c) => c.dataset.decisionId === id);
         const heads = [...card2.querySelectorAll('.disclosure-title')].map((n) => n.textContent);
         return {
           id,
           heads,
           open: card2.querySelectorAll('.disclosure.open').length,
           gapRows: card2.querySelectorAll('.related-gap-row').length,
           gapDiffCols: card2.querySelectorAll('.gap-diff-col').length,
           questionRows: card2.querySelectorAll('.related-question-row').length,
           claimBadges: card2.querySelectorAll('.ev-badge.document-claim').length,
           verifiedBadges: card2.querySelectorAll('.ev-badge.source-verified').length,
           dependencyLinks: card2.querySelectorAll('.dep-link').length,
         };
       })()`
    );
    const expectedHeads = ['Alternatives', 'Full Rationale', 'Consequences', 'Current / Target', 'Evidence', 'Open Questions', 'Dependencies / Related'];
    if (expandedFlow.heads.join(',') === expectedHeads.join(',') && expandedFlow.open === expectedHeads.length) {
      ok(`"查看详情"展开 ${expandedFlow.open} 个附属区块：${expandedFlow.heads.join(' / ')}`);
    } else {
      fail(`详情区块异常: ${JSON.stringify(expandedFlow.heads)}`);
    }
    if (expandedFlow.claimBadges > 0 && expandedFlow.verifiedBadges === 0) {
      ok(`Decision 的 Evidence 全标为 document-claim（${expandedFlow.claimBadges} 条），无 source-verified`);
    } else {
      fail(`Decision Evidence 级别异常: claim=${expandedFlow.claimBadges} verified=${expandedFlow.verifiedBadges}`);
    }

    const decision007 = load.model.decisions.find((d) => d.id === 'DEC-007');
    if (decision007.relatedGaps.length > 0 && expandedFlow.gapRows > 0 && expandedFlow.gapDiffCols > 0) {
      ok(`Current / Target 作为附属信息渲染（${expandedFlow.gapRows} 个 Gap，每个含"现在/目标"两栏）`);
    } else {
      fail(`Current / Target 附属渲染异常: ${JSON.stringify(expandedFlow)}`);
    }
    if (expandedFlow.dependencyLinks > 0) ok(`Dependencies 列出 ${expandedFlow.dependencyLinks} 条前置决策`);
    else report.push('! 首条决策没有 dependsOn，Dependencies 区块为空（数据本身如此）');

    // Open Questions 只作为附属信息出现
    const questionAttachments = await win.webContents.executeJavaScript(
      `(() => {
         document.querySelector('.nav-item[data-view="overview"]').click();
         const overviewHasQuestionList = document.querySelectorAll('.related-question-row').length;
         document.querySelector('.nav-item[data-view="decisions"]').click();
         const attached = new Set();
         const ids = [...document.querySelectorAll('.decision-card')].map((c) => c.dataset.decisionId);
         ids.forEach((id) => {
           let card = [...document.querySelectorAll('.decision-card')].find((c) => c.dataset.decisionId === id);
           if (!card) return;
           if (!card.querySelector('.disclosure')) {
             card.querySelector('.details-toggle').click();
             card = [...document.querySelectorAll('.decision-card')].find((c) => c.dataset.decisionId === id);
           }
           card.querySelectorAll('.related-question-row .jump-id').forEach((n) => attached.add(n.textContent));
         });
         return { overviewHasQuestionList, attached: [...attached] };
       })()`
    );
    if (questionAttachments.overviewHasQuestionList === 0) {
      ok('Overview 没有把 Open Questions 单独放大');
    } else {
      fail(`Overview 出现了 Open Question 列表: ${questionAttachments.overviewHasQuestionList}`);
    }
    const allQuestionIds = load.model.openQuestions.map((q) => q.id);
    if (allQuestionIds.every((id) => questionAttachments.attached.includes(id))) {
      ok(`全部 ${allQuestionIds.length} 个 Open Question 都挂在某条 Decision 的详情里`);
    } else {
      fail(`有 Open Question 无处展示: ${allQuestionIds.filter((id) => !questionAttachments.attached.includes(id)).join(', ')}`);
    }

    // 真实点击审核动作（走渲染进程的事件委托 + 状态写入路径，而不是直接改内存）
    const clickFlow = await win.webContents.executeJavaScript(
      `(() => {
         document.querySelector('.nav-item[data-view="decisions"]').click();
         const card = document.querySelector('.decision-card');
         const id = card.dataset.decisionId;
         const btn = [...card.querySelectorAll('.decision-actions .btn')].find((b) => b.dataset.action === 'rejected');
         if (!btn) return { clicked: false };
         btn.click();
         const card2 = [...document.querySelectorAll('.decision-card')].find((c) => c.dataset.decisionId === id);
         return {
           clicked: true,
           id,
           chip: card2.querySelector('.status-chip').textContent,
           hasComment: !!card2.querySelector('textarea.review-comment'),
           navCount: document.getElementById('nav-decision-count').textContent,
         };
       })()`
    );
    if (clickFlow.clicked && clickFlow.chip === '已否决' && clickFlow.hasComment) {
      ok(`点击"不同意"后状态变为 ${clickFlow.chip}，并出现备注输入框`);
    } else {
      fail(`审核动作点击未生效: ${JSON.stringify(clickFlow)}`);
    }

    const briefAfterClick = await win.webContents.executeJavaScript(
      `(() => {
         document.querySelector('.nav-item[data-view="decisions"]').click();
         const progress = document.querySelector('.list-progress')?.textContent || null;
         const chip = document.querySelector('.decision-card .status-chip')?.textContent || null;
         document.querySelector('.nav-item[data-view="overview"]').click();
         return { progress, chip, badge: document.getElementById('gate-badge').textContent };
       })()`
    );
    const expectedPending = load.summary.decisions.counts.pending - 1;
    if ((briefAfterClick.progress || '').includes(`待决定 ${expectedPending}`) && briefAfterClick.chip === '已否决') {
      ok(`决策清单进度随表态更新（${briefAfterClick.progress?.trim() || ''}，首条状态 ${briefAfterClick.chip}）`);
    } else {
      fail(`进度未更新: ${JSON.stringify(briefAfterClick)}`);
    }

    // 真正的 human-review.json 保存路径（写临时文件，不污染工作区）
    const liveSave = await win.webContents.executeJavaScript(
      `(async () => {
         const result = await window.designReview.saveHumanReview(
           {
             decisions: { 'DEC-001': { status: 'approved', comment: '自检：批准三级模型。' },
                          'DEC-002': { status: 'needs-revision', comment: '自检：需要修改。' } },
             openQuestions: { 'Q-001': { status: 'pending', comment: '' } },
             gaps: { 'GAP-001': { status: 'confirmed', comment: '' } },
           },
           ${JSON.stringify(path.join(PROJECT_ROOT, '.selftest-human-review.json'))}
         );
         return { ok: result.ok, version: result.humanReview && result.humanReview.reviewVersion,
                  gateBlockers: result.gate ? result.gate.blockers.length : null,
                  dec001: result.humanReview && result.humanReview.decisions['DEC-001'].status };
       })()`
    );
    if (liveSave.ok && liveSave.dec001 === 'approved') {
      ok(`humanReview:save 写入成功（reviewVersion=${liveSave.version}, 剩余阻塞=${liveSave.gateBlockers}）`);
    } else {
      fail(`humanReview:save 失败: ${JSON.stringify(liveSave)}`);
    }
    const savedRaw = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, '.selftest-human-review.json'), 'utf8'));
    if (Object.keys(savedRaw.decisions).length === load.model.decisions.length) {
      ok(`human-review.json 覆盖全部 ${load.model.decisions.length} 条 Decision（未做部分覆盖式丢失）`);
    } else {
      fail(`human-review.json Decision 数量异常: ${Object.keys(savedRaw.decisions).length}`);
    }
    if (savedRaw.decisions['DEC-002'].status === 'needs-revision' && savedRaw.gaps['GAP-001'].status === 'confirmed') {
      ok('多条 Decision / Gap 的审核状态都被正确持久化');
    } else {
      fail('人工状态未正确持久化');
    }
    await fs.rm(path.join(PROJECT_ROOT, '.selftest-human-review.json'), { force: true });

    // 不经 UI 保存 human-review.json：自检只写到临时文件，避免覆盖人工结果。
    const sandbox = path.join(PROJECT_ROOT, '.selftest-human-review-2.json');
    const reviewPayload = JSON.parse(JSON.stringify(load.humanReview));
    reviewPayload.decisions[load.model.decisions[0].id] = {
      status: 'needs-evidence',
      comment: 'selftest：需要更多证据。',
    };
    await fs.writeFile(sandbox, `${JSON.stringify(reviewPayload, null, 2)}\n`, 'utf8');
    const reread = await loadDesignReview(DEFAULT_FIXTURE, sandbox);
    if (reread.ok && reread.humanReview.decisions[load.model.decisions[0].id].status === 'needs-evidence') {
      ok('human-review.json 与 design-review.json 分离读写正常');
    } else {
      fail('human-review.json 分离读写异常');
    }
    if (reread.gate.blockers.some((b) => b.id === load.model.decisions[0].id)) {
      ok('needs-evidence 会让 Gate 继续 BLOCKED');
    } else {
      fail('needs-evidence 未阻塞 Gate');
    }
    await fs.rm(sandbox, { force: true });

    // design-review.json 必须保持“AI 侧 pending”，不得被人工状态污染
    const modelAfter = JSON.parse(await fs.readFile(DEFAULT_FIXTURE, 'utf8'));
    if (modelAfter.decisions.every((d) => d.status === 'pending')) {
      ok('design-review.json 未被人工审核状态污染（仍全部 pending）');
    } else {
      fail('design-review.json 被人工状态污染');
    }
    const defaultHumanExists = await fs
      .access(DEFAULT_HUMAN_REVIEW)
      .then(() => true)
      .catch(() => false);
    if (!defaultHumanExists) ok('未在项目根目录偷偷生成 human-review.json（仍只由人工点击保存时创建）');
    else report.push('! 项目根目录已存在 human-review.json（人工审核产物，属正常情况）');


    emit();
    const failedCount = report.filter((line) => line.startsWith('✗')).length;
    process.stdout.write(`SELFTEST ${failedCount === 0 ? 'PASSED' : `FAILED (${failedCount})`}\n`);
    app.exit(failedCount === 0 ? 0 : 1);
  } catch (error) {
    fail(`自检异常: ${error && error.stack ? error.stack : error}`);
    emit();
    app.exit(1);
  }
}

/**
 * Preview 渲染验证（`npm run verify-preview -- <file>`）。
 *
 * 目的：确认 build-preview.js 生成的静态 HTML **真的被现有 renderer 渲染出来了**
 * （而不是只生成了一个"看起来像"的文件）。
 * 它加载该文件并断言 DOM 内容；不修改任何 UI。
 */
async function runVerifyPreview(filePath) {
  const report = [];
  const ok = (m) => report.push(`✓ ${m}`);
  const fail = (m) => report.push(`✗ ${m}`);
  const emit = () => {
    process.stdout.write(`\n===== VERIFY PREVIEW =====\n${report.join('\n')}\n===== END =====\n`);
  };

  try {
    const win = mainWindow;
    // 捕获渲染器控制台错误，便于定位 preview 为什么没渲染出来
    const consoleErrors = [];
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      if (level >= 2) consoleErrors.push(`${message} @${String(sourceId).split('/').pop()}:${line}`);
    });
    await new Promise((resolve) => {
      if (!win.webContents.isLoading()) return resolve();
      win.webContents.once('did-finish-load', resolve);
    });
    await win.loadFile(filePath);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (consoleErrors.length > 0) {
      report.push(`! 渲染器控制台错误 ${consoleErrors.length} 条：`);
      consoleErrors.slice(0, 8).forEach((e) => report.push(`    ${e.slice(0, 160)}`));
    }

    const dom = await win.webContents.executeJavaScript(
      `(() => ({
         title: document.getElementById('design-title')?.textContent || null,
         blocks: document.querySelectorAll('.block').length,
         tocItems: document.querySelectorAll('.toc-item').length,
         tocGroups: document.querySelectorAll('.toc-group').length,
         stageHeads: document.querySelectorAll('.stage-head').length,
         srcChips: document.querySelectorAll('.src-chip').length,
         expanded: document.querySelectorAll('.block:not(.collapsed)').length,
         contentTypes: [...new Set([...document.querySelectorAll('.block-body > *')].map((n) => n.className.split(' ')[0]))],
         emptyBodies: [...document.querySelectorAll('.block-body')].filter((n) => n.children.length === 0).length,
         // 折叠区块本来就不渲染内容；只有"应当展开却没有内容"才是问题
         collapsedWithBody: [...document.querySelectorAll('.block.collapsed')].filter((n) => {
           const body = n.querySelector('.block-body');
           return body && body.children.length > 0;
         }).length,
         expandedWithoutBody: [...document.querySelectorAll('.block:not(.collapsed):not(.ambient)')].filter((n) => {
           const body = n.querySelector('.block-body');
           return !body || body.children.length === 0;
         }).length,
         bannerComplete: document.getElementById('preview-meta')?.textContent.includes('complete=true') || false,
       }))()`
    );

    if (dom.title) ok(`renderer 已渲染标题：${dom.title}`);
    else fail('renderer 没有渲染标题 —— preview 未成功加载');
    if (dom.blocks === 21) ok(`21 个 block 全部渲染（${dom.expanded} 个展开）`);
    else fail(`block 数量异常：${dom.blocks}，期望 21`);
    if (dom.expandedWithoutBody === 0) ok('所有应当展开的区块都渲染出了内容');
    else fail(`有 ${dom.expandedWithoutBody} 个展开的 block 内容为空`);
    if (dom.collapsedWithBody === 0) ok('折叠区块确实没有渲染内容（结构性折叠生效）');
    else fail(`有 ${dom.collapsedWithBody} 个折叠区块仍带内容`);
    if (dom.tocItems === 21 && dom.tocGroups === 4) ok(`左侧目录：4 段 / ${dom.tocItems} 条目`);
    else fail(`目录异常：groups=${dom.tocGroups} items=${dom.tocItems}`);
    if (dom.stageHeads === 4) ok('四段阅读流的分段标题已渲染');
    else fail(`分段标题数量异常：${dom.stageHeads}`);
    if (dom.srcChips > 0) ok(`Source 回查入口存在（${dom.srcChips} 个标签）`);
    else fail('没有 Source 标签');
    if (dom.contentTypes.length >= 5) ok(`多种承载形式已渲染：${dom.contentTypes.join(', ')}`);
    else fail(`承载形式过少：${dom.contentTypes.join(', ')}`);
    if (dom.bannerComplete) ok('preview 横幅显示 complete=true');

    // 原文回查面板（与 Electron 同源逻辑）
    const sourceFlow = await win.webContents.executeJavaScript(
      `(async () => {
         document.querySelector('.src-chip')?.click();
         const deadline = Date.now() + 2500;
         while (Date.now() < deadline) {
           if (!document.getElementById('source-panel').classList.contains('hidden')) break;
           await new Promise((r) => setTimeout(r, 60));
         }
         const t = document.getElementById('source-body')?.textContent || '';
         return { open: !document.getElementById('source-panel').classList.contains('hidden'), len: t.length };
       })()`
    );
    if (sourceFlow.open && sourceFlow.len > 80) ok(`点 Source 能打开原文面板（${sourceFlow.len} 字）`);
    else fail(`原文面板异常：${JSON.stringify(sourceFlow)}`);

    emit();
    const failed = report.filter((l) => l.startsWith('✗')).length;
    process.stdout.write(`VERIFY PREVIEW ${failed === 0 ? 'PASSED' : `FAILED (${failed})`}\n`);
    app.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    fail(`验证异常：${error && error.stack ? error.stack : error}`);
    emit();
    app.exit(1);
  }
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  if (VERIFY_PREVIEW) {
    setTimeout(() => {
      runVerifyPreview(VERIFY_PREVIEW);
    }, 400);
  } else if (SELF_TEST) {
    setTimeout(() => {
      runSelfTest();
    }, 400);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
