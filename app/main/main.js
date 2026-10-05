'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative,legacyReviewPath}=require('../../scripts/helpers/repository-layout');

/**
 * 主进程：本地文件访问 + 结构化分析结果加载。
 *
 * 职责边界（docs/harness/ARCHITECTURE.md 的模块边界）：
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
const { projectL2Overview } = require('../shared/reading-projection');
const { projectTopic } = require('../shared/l1-topic-projection');
const { evaluateGate, buildHumanReviewSkeleton } = semantics;

const {createReadingSessionController,inspectReadingSession,sourceReadingSession,sourceIntegrity}=require('./reading-session');
const bundleSessions=createReadingSessionController();

const PROJECT_ROOT = resolveRepositoryPath(__dirname, '..', '..');
const BOUNDARY_TEST = process.argv.includes('--selftest-l1-boundary');
const ORIENTATION_TEST = process.argv.includes('--selftest-l0-orientation');
const SELF_TEST = process.argv.includes('--selftest') || BOUNDARY_TEST || ORIENTATION_TEST;
/** `--verify-preview <file>`：加载生成的 preview HTML 并断言 DOM（实验性验证，不改 UI）。 */
const VERIFY_PREVIEW = (() => {
  const i = process.argv.indexOf('--verify-preview');
  return i >= 0 && process.argv[i + 1] ? resolveRepositoryPath(process.argv[i + 1]) : null;
})();
if (SELF_TEST || VERIFY_PREVIEW) {
  // 无人值守运行不需要 GPU；关掉可避免退出时的 command_buffer 相关 stderr 噪音。
  app.disableHardwareAcceleration();
  // Screenshot assertions use CSS pixels; isolate unattended checks from monitor DPI.
  app.commandLine.appendSwitch('force-device-scale-factor','1');
}
const SCHEMA_PATH = joinRepositoryPath(PROJECT_ROOT, 'schema', 'design-review.schema.json');
const DEFAULT_FIXTURE = joinRepositoryPath(PROJECT_ROOT, 'fixtures', 'context-consumption.json');
const DEFAULT_DOCUMENT = joinRepositoryPath(PROJECT_ROOT, '测试文档', '18-context-consumption-semantic-model.md');
const DEFAULT_HUMAN_REVIEW = legacyReviewPath(PROJECT_ROOT);
const SOURCE_SECTIONS = joinRepositoryPath(PROJECT_ROOT, 'docs', 'source-sections.json');

const saveHumanReview=require('./human-review-store').createHumanReviewWriter({write:writeJsonAtomic,projectRoot:PROJECT_ROOT});
let sessionEpoch=0;
function beginSessionLoad(){bundleSessions.invalidate();return ++sessionEpoch;}
const staleLoad=()=>({ok:false,stage:'stale',errors:['加载请求已过期'],warnings:[]});
async function prepareBundle(file,epoch=beginSessionLoad()){
 file=resolveRepositoryPath(file);
 if(epoch!==sessionEpoch)return staleLoad();
 const result=await bundleSessions.prepare(file);return epoch===sessionEpoch?result:staleLoad();
}
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
  const temp = `${targetPath}.tmp-${process.pid}-${require('node:crypto').randomUUID()}`;
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
async function loadDesignReview(modelPath, humanReviewPath, epoch=beginSessionLoad()) {
  const resolvedModel = resolveRepositoryPath(modelPath);
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

  const resolvedHuman = resolveRepositoryPath(humanReviewPath || DEFAULT_HUMAN_REVIEW);
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
  // L2 delivery is fed by one projection boundary.  The raw model remains for
  // review/Gate semantics only and is never interpreted by the renderer.
  const l2ViewModel = projectL2Overview(model.overview);

  if(epoch!==sessionEpoch)return staleLoad();
  bundleSessions.reset();
  state = {
    modelPath: resolvedModel,
    model,
    l2ViewModel,
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
    l2ViewModel,
    humanReview: effectiveHuman,
    gate: evaluateGate(model, effectiveHuman),
    summary: semantics.reviewSummary(model, effectiveHuman),
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 640,
    minHeight: 720,
    backgroundColor: '#12161c',
    title: 'Design Review',
    maximizable: !(SELF_TEST || VERIFY_PREVIEW),
    webPreferences: {
      backgroundThrottling: !(SELF_TEST || VERIFY_PREVIEW),
      preload: VERIFY_PREVIEW ? undefined : joinRepositoryPath(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow.loadFile(VERIFY_PREVIEW || joinRepositoryPath(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Feature 08 · 读取一份 framework-map.json → view model（**只读，不修改 map**）。
 * 同目录的 check-map.txt 若存在，一并带上供 Review View 使用。
 */
async function loadFrameworkMap(mapPath, epoch=beginSessionLoad()) {
  const p = resolveRepositoryPath(mapPath);
  const map = JSON.parse(await fs.readFile(p, 'utf8'));
  const siblingCheck = joinRepositoryPath(path.dirname(p), 'check-map.txt');
  let checkMapText = null;
  try { checkMapText = await fs.readFile(siblingCheck, 'utf8'); } catch { checkMapText = null; }
  // view model 的实现在 scripts/ 下（已被 test-l0-view-model.js 覆盖 34 断言）
  const { buildL0ViewModel } = require(joinRepositoryPath(PROJECT_ROOT, 'scripts', 'l0-view-model.js'));
  const schema = JSON.parse(await fs.readFile(joinRepositoryPath(PROJECT_ROOT, 'schema', 'framework-map.schema.json'), 'utf8'));
  if(Object.hasOwn(map,'readingGuide')){
    const checked=validate(schema,map);if(!checked.valid)throw new Error(checked.errors.join('\n'));
    const binding=require('../shared/reading-explanation').checkReadingGuideBinding(map);
    if(binding.errors.length)throw new Error(binding.errors.join('\n'));
  }
  const viewModel = buildL0ViewModel(map, {
    checkMapText,
    knownRoles: schema.$defs.element.properties.role['x-known-roles'],
  });
  const l1Topics = Object.fromEntries(map.topics.map((topic) => [topic.id, projectTopic(map, topic.id)]));
  if(epoch!==sessionEpoch)return staleLoad();
  bundleSessions.reset();state={model:null,modelPath:null,humanReview:null,humanReviewPath:DEFAULT_HUMAN_REVIEW,standaloneMap:true};
  return { ok: true, mapPath: p, checkMapPath: checkMapText ? siblingCheck : null, viewModel, l1Topics };
}

function registerIpc() {
  ipcMain.handle('bundle:loadPath',(_event,payload)=>prepareBundle(payload.path));
  ipcMain.handle('bundle:open',async()=>{
    const epoch=beginSessionLoad();
    const result=await dialog.showOpenDialog(mainWindow,{title:'选择分析资料包 reading-bundle.json',filters:[{name:'Reading Bundle',extensions:['json']}],properties:['openFile']});
    return result.canceled?{ok:false,canceled:true}:prepareBundle(result.filePaths[0],epoch);
  });
  ipcMain.handle('bundle:commit',(_event,payload)=>{const result=bundleSessions.commit(payload.requestToken);if(result.ok) state=bundleSessions.current();return result;});
  ipcMain.handle('bundle:discard',(_event,payload)=>{bundleSessions.discard(payload.requestToken);return {ok:true};});
  ipcMain.handle('bundle:inspect',(_event,payload)=>inspectReadingSession(bundleSessions.current(),payload));
  ipcMain.handle('bundle:source',(_event,payload)=>sourceReadingSession(bundleSessions.current(),payload));
  ipcMain.handle('app:paths', () => ({
    projectRoot: PROJECT_ROOT,
    defaultFixture: DEFAULT_FIXTURE,
    defaultDocument: DEFAULT_DOCUMENT,
    defaultHumanReview: DEFAULT_HUMAN_REVIEW,
  }));

  ipcMain.handle('design:loadFixture', () => loadDesignReview(DEFAULT_FIXTURE, state.bundle ? DEFAULT_HUMAN_REVIEW : state.humanReviewPath));

  // ── Feature 08 · L0 Framework Map（deterministic UI，不调用模型）────────────
  // 只读 framework-map.json + 同目录的 check-map.txt（若存在），在主进程算好 view model 再交给 renderer
  //（renderer 不接触 node fs）。**不修改 map**：buildL0ViewModel 自带"输入被改动就抛错"的自检。
  ipcMain.handle('l0:openJson', async () => {
    const epoch=beginSessionLoad();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 framework-map.json',
      defaultPath: PROJECT_ROOT,
      filters: [{ name: 'Framework Map JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };
    return loadFrameworkMap(result.filePaths[0],epoch);
  });

  ipcMain.handle('l0:loadPath', async (_event, payload) => {
    if (!payload || typeof payload.path !== 'string' || payload.path.trim() === '') {
      return { ok: false, stage: 'input', errors: ['未提供路径'] };
    }
    try {
      return await loadFrameworkMap(payload.path);
    } catch (error) {
      return { ok: false, stage: 'read', errors: [error.message] };
    }
  });

  ipcMain.handle('design:openJson', async () => {
    const epoch=beginSessionLoad();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 design-review.json',
      defaultPath: PROJECT_ROOT,
      filters: [{ name: 'Design Review JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };
    return loadDesignReview(result.filePaths[0], state.bundle ? DEFAULT_HUMAN_REVIEW : state.humanReviewPath,epoch);
  });

  ipcMain.handle('design:loadPath', async (_event, payload) => {
    if (!payload || typeof payload.path !== 'string' || payload.path.trim() === '') {
      return { ok: false, stage: 'input', errors: ['未提供路径'] };
    }
    try {
      return await loadDesignReview(payload.path, state.bundle ? DEFAULT_HUMAN_REVIEW : state.humanReviewPath);
    } catch (error) {
      return { ok: false, stage: 'read', errors: [error.message] };
    }
  });

  ipcMain.handle('document:openMarkdown', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 Markdown 设计文档',
      defaultPath: repositoryPath('samples'),
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
      ? resolveRepositoryPath(payload.path)
      : joinRepositoryPath(PROJECT_ROOT, 'design-review.json');
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
   * 约束（docs/harness/CONSTRAINTS.md）：
   * - 只能由用户显式动作触发；AI 侧没有任何路径调用它；
   * - 重写时保留 AI 侧不可见但人工有意义的字段（例如人工备注之外的自定义键）；
   * - 绝不写入 design-review.json。
   */
  ipcMain.handle('humanReview:save', (_event,payload)=>saveHumanReview(state,payload));

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
   * 数据来自 samples/context-consumption/source-sections.json（由 scripts/extract-source-sections.js 从 Markdown 切分）。
   */
  ipcMain.handle('source:load', async () => {
    try {
      const sourceSession=state;
      if(sourceSession.standaloneMap)return {ok:false,errors:['独立框架图未配对原文；请打开分析资料包查看来源。']};
      if(sourceSession.bundle) {
        if(await sourceIntegrity(sourceSession)!=='consistent') return {ok:false,errors:['当前资料包原文坐标不可用，请重新导出']};
        return {ok:true,sessionToken:sourceSession.sessionToken,document:sourceSession.bundle.sourceSections.document,sections:sourceSession.bundle.sourceSections.sections};
      }
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
    if (load.l2ViewModel && load.l2ViewModel.kind === 'L2ViewModel' && load.l2ViewModel.sections.length === load.model.overview.sections.length) {
      ok(`L2 projection 已由主进程生成（${load.l2ViewModel.sections.flatMap((section) => section.blocks).length} 个 block）`);
    } else {
      fail('L2 projection 未随 design-review load result 返回');
    }
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

    if (ORIENTATION_TEST) {
      ok(await require('../../scripts/test-l0-orientation-electron').runOrientationIntegration(win));
      emit();app.exit(0);return;
    }
    if (BOUNDARY_TEST) {
      ok(await require('../../scripts/test-l1-boundary-view-electron').runBoundaryIntegration(win));
      emit();app.exit(0);return;
    }
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

    const startLayout=await win.webContents.executeJavaScript(`(()=>({
      closed:!document.getElementById('legacy-entry').open,
      primary:document.getElementById('btn-open-bundle').getClientRects().length>0,
      legacyHidden:!document.getElementById('btn-load-fixture').checkVisibility(),
      disabled:document.querySelectorAll('#screen-start button:disabled').length
    }))()`);
    if(startLayout.closed&&startLayout.primary&&startLayout.legacyHidden&&startLayout.disabled===0)ok('F22 首屏资料包突出；旧入口默认折叠，无未启用占位');
    else fail('F22 首屏分组异常: '+JSON.stringify(startLayout));
    await fs.mkdir(repositoryPath('workspace/previews'),{recursive:true});
    await fs.writeFile(repositoryPath('workspace/previews/start-screen.png'),(await win.webContents.capturePage()).toPNG());
    win.focus();win.webContents.focus();
    await win.webContents.executeJavaScript("document.querySelector('#legacy-entry summary').focus()");
    win.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});win.webContents.sendInputEvent({type:'char',keyCode:'\r'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});
    await new Promise(r=>setTimeout(r,80));
    if(await win.webContents.executeJavaScript("document.getElementById('legacy-entry').open&&document.getElementById('btn-load-fixture').getClientRects().length>0"))ok('F22 键盘可展开开发与旧版入口');
    else fail('F22 details 键盘展开失败');
    const oldEntry=await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{observer.disconnect();reject(new Error('fixture click timeout'));},2000);
      const observer=new MutationObserver(()=>{if(document.getElementById('screen-start').classList.contains('hidden')){clearTimeout(timeout);observer.disconnect();resolve(window.__state.model?.design.id);}});
      observer.observe(document.getElementById('screen-start'),{attributes:true});document.getElementById('btn-load-fixture').click();
    })`);
    if(oldEntry===load.model.design.id)ok('F22 折叠内 fixture 实际点击可加载');else fail('F22 旧入口加载异常');

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
    // Feature 08 起一级导航有三个页面：方案总览 / 决策清单 / L0 框架图。
    // L0 是新的一级页面（不是塞进 Overview 的区块），因此这里的期望值同步为 3。
    if (rendered.navItems.length === 3 && rendered.navItems[0].startsWith('方案总览') && rendered.navItems[1].startsWith('决策清单') && rendered.navItems[2].startsWith('L0')) {
      ok(`一级导航有三个页面：${rendered.navItems.join(' / ')}`);
    } else {
      fail(`导航结构异常: ${JSON.stringify(rendered.navItems)}`);
    }
    if (rendered.statCards === 0 && rendered.reviewCards === 0 && rendered.gateCards === 0) {
      ok('没有统计卡片 / Dashboard 卡片 / 阻塞面板');
    } else {
      fail(`仍有面板类元素: stat=${rendered.statCards} review=${rendered.reviewCards} gate=${rendered.gateCards}`);
    }

    /* ── Feature 08 · L0 的 Electron 集成 seam ────────────────────────────
     * 只测新接缝：preload API → IPC → main.loadFrameworkMap() → view model → L0Map.mount → DOM 交互。
     * 不重复 renderer 自身的断言（那 60 条在 scripts/test-l0-preview.js，预览侧覆盖同一份模块）。
     * 刻意绕开系统文件选择器（用 loadPath(knownFixture)），原生 picker 留给手工 smoke test。
     * fixture 选 E：12 elements / 8 edges / attachments / state / constraint / 无 element Topic —— 够覆盖又不重。
     */
    try {
      const l0Fixture = joinRepositoryPath(PROJECT_ROOT, 'experiments', 'semantic-grounding', 'fixture-e', 'run-08', 'framework-map.json');
      const l0Loaded = await loadFrameworkMap(l0Fixture); // main 侧加载函数（IPC handler 用的同一个）
      if (!l0Loaded.ok || !l0Loaded.viewModel) {
        fail(`L0 加载失败: ${(l0Loaded.errors || []).join('; ')}`);
      } else {
        const s1Fixture = joinRepositoryPath(PROJECT_ROOT, 'experiments', 'semantic-grounding', 'fixture-d', 'run-04', 'framework-map.json');
        const s1Map = JSON.parse(await fs.readFile(s1Fixture, 'utf8'));
        const s1KnownEmptyMap = JSON.parse(JSON.stringify(s1Map));
        s1KnownEmptyMap.topics[0].blockIds = [];
        const s1TempDir = await fs.mkdtemp(joinRepositoryPath(app.getPath('temp'), 'design-review-s1-'));
        const s1KnownEmptyPath = joinRepositoryPath(s1TempDir, 'known-empty.framework-map.json');
        await fs.writeFile(s1KnownEmptyPath, JSON.stringify(s1KnownEmptyMap), 'utf8');
        const f = l0Loaded.viewModel.facts;
        const seam = await win.webContents.executeJavaScript(`(async () => {
          const out = {};
          // ① 走**真实入口** loadL0(path)：preload → IPC → main.loadFrameworkMap
          //    + 它自己做的首屏→Review 屏切换 + render()。之前这里手抄过这段状态切换，
          //    结果手抄版对的、真实版调了不存在的 enterReview() 且静默抛错 —— 自动化全绿但按钮没用。
          const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
          const unknownS1 = await window.designReview.l0.loadPath(${JSON.stringify(s1Fixture)});
          const knownEmptyS1 = await window.designReview.l0.loadPath(${JSON.stringify(s1KnownEmptyPath)});
          const unknownTopic = unknownS1 && unknownS1.viewModel && unknownS1.viewModel.topics.find((topic) => topic.id === ${JSON.stringify(s1Map.topics[0].id)});
          const emptyTopic = knownEmptyS1 && knownEmptyS1.viewModel && knownEmptyS1.viewModel.topics.find((topic) => topic.id === ${JSON.stringify(s1Map.topics[0].id)});
          out.s1Distinct = !!unknownTopic && !!emptyTopic && !owns(unknownTopic, 'blockIds')
            && owns(emptyTopic, 'blockIds') && Array.isArray(emptyTopic.blockIds) && emptyTopic.blockIds.length === 0;
          const res = await loadL0(${JSON.stringify(l0Fixture)});
          out.preloadOk = !!(res && res.ok && res.viewModel);
          if (!out.preloadOk) return out;
          // ② 真实屏切换发生了吗（这是那次 bug 直接违反的不变量）
          out.reviewVisible = !document.getElementById('screen-review').classList.contains('hidden');
          out.startHidden = document.getElementById('screen-start').classList.contains('hidden');
          out.view = state.view;
          const root = document.querySelector('.l0-root');
          out.mounted = !!root;
          out.dataView = root ? root.getAttribute('data-view') : null;
          out.title = root && root.querySelector('h1') ? root.querySelector('h1').textContent.trim() : null;
          out.expectedTitle = res.viewModel.document.title;
          // 两个视图都在 DOM 里（隐藏 ≠ 删除）→ 计数必须按视图作用域，并且去重
          const uniqIn = (sel) => new Set([...document.querySelectorAll(sel)].map((n) => n.getAttribute('data-element-id'))).size;
          out.uniqueElements = uniqIn('[data-element-id]');
          out.readingElements = uniqIn('#l0-reading [data-element-id]');
          out.reviewElements = uniqIn('#l0-review-board [data-element-id]');
          out.readingNodes = document.querySelectorAll('#l0-reading article.l0-node').length;
          out.readingEdges = document.querySelectorAll('#l0-reading path.l0-edge').length;
          out.readingLabels = document.querySelectorAll('#l0-reading text.l0-edge-label').length;
          out.readingEids = document.querySelectorAll('#l0-reading .eid').length; // Phase 4.1：工程 metadata 不进 Reading
          out.edges = document.querySelectorAll('[data-focus-edge]').length;
          out.topics = document.querySelectorAll('.topic-entry').length;
          out.hasTopicNav = !!document.getElementById('topic-nav');
          out.topicsOpen = document.querySelectorAll('.topic-fold[open]').length; // 默认不展开
          out.howtoOpen = document.querySelectorAll('.l0-howto[open]').length;    // Phase 4.1 polish：说明默认折叠
          out.legendHasEngineeringWords = /Focused Relations|constraints/.test((document.querySelector('#l0-reading .l0-legend') || {}).textContent || '');
          out.edgeLabelTexts = [...document.querySelectorAll('#l0-reading text.l0-edge-label')].map((t) => t.textContent.trim());
          out.edgeTypesRaw = [...document.querySelectorAll('#l0-reading text.l0-edge-label')].map((t) => t.getAttribute('data-edge-type'));
          out.focusPanels = document.querySelectorAll('.focus-panel').length;
          out.factsElementCount = res.viewModel.facts.elementCount;
          out.factsEdgeCount = res.viewModel.facts.edgeCount;
          out.factsTopicCount = res.viewModel.facts.topicCount;
          out.reviewHiddenInReading = getComputedStyle(document.querySelector('.l0-review-board')).display === 'none';
          // ③ 点一个 Reading 节点 → 焦点态 + Focused Relations（第一屏就是图，第一个可点元素就是节点）
          const card = document.querySelector('#l0-reading article.l0-node[data-focus-target]');
          out.firstTargetIsNode = !!card;
          card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          out.hasFocusClass = root.classList.contains('has-focus');
          const slot = document.getElementById('l0-focus-slot');
          out.focusSlotFilled = !!(slot && slot.children.length > 0);
          out.visibleFocusPanels = [...document.querySelectorAll('.focus-panel')].filter((p) => !p.hidden).length;
          // 用户裁决：选中只做加法 —— 高光相关的，**不压暗/不隐藏**其余的
          out.hits = document.querySelectorAll('.is-hit').length;
          out.dims = document.querySelectorAll('.is-dim').length;
          out.nodeSelfHit = card.classList.contains('is-hit');
          out.edgeHitWithNode = [...document.querySelectorAll('#l0-reading path.l0-edge.is-hit')].length;
          // ③c 点约束角标 → 角标自己 + 它挂靠的宿主一起高光（attachment 是双向的）
          const badge = document.querySelector('#l0-reading .node-attach[data-host-ids]');
          out.badgeExists = !!badge;
          if (badge) {
            out.badgeHostIds = (badge.getAttribute('data-host-ids') || '').split(',').filter(Boolean);
            badge.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            out.badgeHit = badge.classList.contains('is-hit');
            out.badgeItemsHit = document.querySelectorAll('#l0-reading .attach-item.is-hit').length;
            out.badgeHostsHit = out.badgeHostIds.filter((h) => {
              const node = document.querySelector('#l0-reading .l0-node[data-element-id="' + h + '"]');
              return node && node.classList.contains('is-hit');
            }).length;
            out.dimsAfterBadge = document.querySelectorAll('.is-dim').length;
            out.panelsAfterBadge = [...document.querySelectorAll('.focus-panel')].filter((p) => !p.hidden).length;
          }
          // ③b Phase 4.1 polish：下钻面板在 Reading 下必须是中文术语（Review 仍是英文原词）
          out.slotZhVisible = !!slot && !!slot.querySelector('.lbl-zh') && getComputedStyle(slot.querySelector('.lbl-zh')).display !== 'none';
          out.slotEnHidden = !!slot && !!slot.querySelector('.lbl-en') && getComputedStyle(slot.querySelector('.lbl-en')).display === 'none';
          out.slotEidHidden = (() => {
            const eid = slot && slot.querySelector('.eid');
            return !eid || getComputedStyle(eid).display === 'none';
          })();
          // ④ 从下钻面板里点 provenance → openSource(ref)（节点 → details → 原文，这才是新设计的链路）
          const refBtn = (slot && slot.querySelector('[data-source-ref]')) || document.querySelector('[data-source-ref]');
          out.ref = refBtn ? refBtn.getAttribute('data-source-ref') : null;
          if (refBtn) refBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 150));
          out.sourcePanelOpen = !document.getElementById('source-panel').classList.contains('hidden');
          out.sourceHeadText = document.getElementById('source-head').textContent.trim();
          // ⑤ 复原，保证后续断言仍在 overview 视图
          closeSource();
          // ⑤ 首屏直开 L0（state.model 尚未加载）时，切到依赖 model 的页面必须被挡住
          out.navGuard = (() => {
            const savedModel = state.model;
            state.model = null;
            const btn = [...document.querySelectorAll('.nav-item')].find((b) => b.dataset.view === 'overview');
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            const blocked = state.view === 'l0' && document.querySelector('.l0-root') !== null;
            state.model = savedModel;
            return blocked;
          })();
          // F17：从真实 L0 Topic 入口进入 L1，不能把 Topic 当作 L0 子图裁剪。
          const topicEntry = document.querySelector('.topic-entry');
          topicEntry?.querySelector('[data-enter-topic]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          out.l1 = {
            view: state.view,
            topic: document.querySelector('[data-l1-topic]')?.getAttribute('data-l1-topic'),
            members: document.querySelectorAll('[data-l1-topic] h3 + ul li').length,
            relationRoles: [...document.querySelectorAll('[data-l1-role]')].map((n) => n.getAttribute('data-l1-role')),
            blockState: document.querySelector('[data-block-organization]')?.getAttribute('data-block-organization'),
          };
          document.getElementById('l1-back')?.click();
          out.l1Back = state.view === 'l0' && !!document.querySelector('.l0-root');
          // ⑥ 复原，保证后续断言仍在 overview 视图
          applyLoadResult(await api.loadFixture());
          // buildToc() 重建了 .toc-item，会把 .active 丢掉；而 setActiveBlock 在
          // state.activeBlockId 未变时会提前 return → 高亮不会自己回来。
          // 这里用产品自己的函数（清 id 再设）把"我在读哪一段"恢复成原状。
          state.activeBlockId = null;
          const firstBlock = document.querySelector('#main .block');
          if (firstBlock && typeof setActiveBlock === 'function') setActiveBlock(firstBlock.dataset.blockId);
          await new Promise((r) => setTimeout(r, 60));
          out.restored = document.querySelector('.l0-root') === null;
          return out;
        })()`);

        await fs.rm(s1TempDir, { recursive: true, force: true });

        if (seam.s1Distinct) ok('L0 集成：真实 preload → IPC → main → view model 链路保留 S1 的 Unknown 与 Known(0) shape');
        else fail('L0 集成：真实入口把 S1 的 Unknown / Known(0) 合并了');
        if (seam.preloadOk) ok('L0 集成：preload API → IPC → main.loadFrameworkMap 链路可用（走真实入口 loadL0(path)）');
        else fail('L0 集成：preload/IPC 链路不可用');
        if (seam.l1 && seam.l1.view === 'l1' && seam.l1.topic && seam.l1.members >= 0 && seam.l1Back) ok(`L1 集成：真实 Topic 点击进入边界视图（${seam.l1.topic}，relations=${seam.l1.relationRoles.length}，block=${seam.l1.blockState}）并可返回 L0`);
        else fail(`L1 Topic 入口异常: ${JSON.stringify(seam.l1)}`);
        if (seam.reviewVisible && seam.startHidden && seam.view === 'l0') {
          ok('L0 集成：加载后真的切屏了（首屏隐藏 → Review 屏显示，view=l0）');
        } else {
          fail(`L0 集成：没有切屏（review=${seam.reviewVisible} startHidden=${seam.startHidden} view=${seam.view}）`);
        }
        if (seam.mounted && seam.title === seam.expectedTitle && seam.hasTopicNav) {
          ok(`L0 集成：view model 被 app.js 接收并 mount（标题「${seam.title}」+ Topic Navigation）`);
        } else {
          fail(`L0 集成：mount 异常（mounted=${seam.mounted} title=${seam.title} nav=${seam.hasTopicNav}）`);
        }
        if (seam.uniqueElements === f.elementCount && seam.readingElements === f.elementCount
            && seam.reviewElements === f.elementCount && seam.topics === f.topicCount && seam.focusPanels === f.elementCount) {
          ok(`L0 集成：两个视图各自覆盖全部 element（Reading ${seam.readingElements} / Review ${seam.reviewElements} / 共 ${seam.uniqueElements} · topics ${seam.topics} · focus panels ${seam.focusPanels}）`);
        } else {
          fail(`L0 集成：DOM 计数不符（uniq=${seam.uniqueElements} reading=${seam.readingElements} review=${seam.reviewElements} topics=${seam.topics} panels=${seam.focusPanels} vs ${f.elementCount}/${f.elementCount}/${f.elementCount}/${f.topicCount}/${f.elementCount}）`);
        }
        if (seam.readingEdges === f.edgeCount && seam.readingLabels === f.edgeCount) {
          ok(`L0 集成：Reading 把关系画成了线（${seam.readingEdges} 条线 + ${seam.readingLabels} 个类型标签 == edge 数）`);
        } else {
          fail(`L0 集成：线的数量不对（${seam.readingEdges} 条线 / ${seam.readingLabels} 个标签 vs edge ${f.edgeCount}）`);
        }
        if (seam.readingEids === 0 && seam.topicsOpen === 0) {
          ok(`L0 集成：Reading 不显示机器 ID（${seam.readingEids} 个 .eid）· Topic 默认折叠（${seam.topicsOpen} 个展开）`);
        } else {
          fail(`L0 集成：Reading 混入了工程 metadata（eid=${seam.readingEids}）或 Topic 默认展开了 ${seam.topicsOpen} 个`);
        }
        // Phase 4.1 polish：关系词说人话（原词仍在 data-edge-type 里），顶部说明默认折叠
        {
          const RAW = ['consumes', 'produces', 'depends-on', 'relates-to', 'contains', 'validates'];
          const leaked = (seam.edgeLabelTexts || []).filter((t) => RAW.includes(t.replace(/\s*↺$/, '')));
          if (seam.howtoOpen === 0 && !seam.legendHasEngineeringWords && leaked.length === 0
              && (seam.edgeTypesRaw || []).length === f.edgeCount) {
            ok(`L0 集成：Reading 的关系词已产品化（${(seam.edgeLabelTexts || []).slice(0, 3).join('/')}；原词共 ${seam.edgeTypesRaw.length} 份保留在 data-edge-type）· 顶部说明默认折叠`);
          } else {
            fail(`L0 集成：术语未产品化（howtoOpen=${seam.howtoOpen} legend=${seam.legendHasEngineeringWords} 泄漏=${leaked.join(',')} raw=${(seam.edgeTypesRaw || []).length}）`);
          }
        }
        if (seam.slotZhVisible && seam.slotEnHidden && seam.slotEidHidden) {
          ok('L0 集成：Reading 下钻面板用中文术语（关联关系/来自/指向/约束/出处），英文与机器 ID 只在 Review');
        } else {
          fail(`L0 集成：下钻面板术语切换异常（zh=${seam.slotZhVisible} enHidden=${seam.slotEnHidden} eidHidden=${seam.slotEidHidden}）`);
        }
        if (seam.dataView === 'reading' && seam.reviewHiddenInReading) {
          ok('L0 集成：默认 Reading View，且 Review 整块在 Reading 下被隐藏（数据仍在 DOM）');
        } else {
          fail(`L0 集成：默认视图异常（data-view=${seam.dataView} reviewHidden=${seam.reviewHiddenInReading}）`);
        }
        if (seam.firstTargetIsNode && seam.hasFocusClass && seam.focusSlotFilled && seam.visibleFocusPanels >= 1
            && seam.nodeSelfHit && seam.hits > 0 && seam.dims === 0) {
          ok(`L0 集成：点 Reading 节点 → 只高光相关项（命中 ${seam.hits} 处 · 含 ${seam.edgeHitWithNode} 条线），其余不压暗（dim=${seam.dims}）`);
        } else {
          fail(`L0 集成：选中行为异常（firstIsNode=${seam.firstTargetIsNode} focus=${seam.hasFocusClass} self=${seam.nodeSelfHit} hits=${seam.hits} dims=${seam.dims} slot=${seam.focusSlotFilled}）`);
        }
        if (seam.badgeExists && seam.badgeHit && seam.badgeHostsHit === seam.badgeHostIds.length
            && seam.badgeHostIds.length > 0 && seam.dimsAfterBadge === 0) {
          ok(`L0 集成：点约束 → 角标自身有高光 + ${seam.badgeHostsHit} 个宿主一起点亮（不压暗任何东西）`);
        } else {
          fail(`L0 集成：约束高光异常（exists=${seam.badgeExists} hit=${seam.badgeHit} hosts=${seam.badgeHostsHit}/${(seam.badgeHostIds || []).length} dims=${seam.dimsAfterBadge}）`);
        }
        if (seam.sourcePanelOpen && seam.ref && seam.sourceHeadText.includes(seam.ref)) {
          ok(`L0 集成：从下钻面板点 provenance「${seam.ref}」→ 走到已有 openSource() 并打开 Source 面板`);
        } else {
          fail(`L0 集成：provenance 链路异常（open=${seam.sourcePanelOpen} ref=${seam.ref} head=${seam.sourceHeadText}）`);
        }
        if (seam.navGuard) {
          ok('L0 集成：L0 可独立打开 —— 无 design-review.json 时切向总览/决策被挡住（不进入空视图）');
        } else {
          fail('L0 集成：无 model 时导航守卫失效');
        }
        if (!seam.restored) fail('L0 集成：测试后未复原到 overview 视图');
      }
    } catch (error) {
      fail(`L0 集成检查抛错: ${error.message}`);
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
           ${JSON.stringify(joinRepositoryPath(PROJECT_ROOT, '.selftest-human-review.json'))}
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
    const savedRaw = JSON.parse(await fs.readFile(joinRepositoryPath(PROJECT_ROOT, '.selftest-human-review.json'), 'utf8'));
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
    await fs.rm(joinRepositoryPath(PROJECT_ROOT, '.selftest-human-review.json'), { force: true });

    // 不经 UI 保存 human-review.json：自检只写到临时文件，避免覆盖人工结果。
    const sandbox = joinRepositoryPath(PROJECT_ROOT, '.selftest-human-review-2.json');
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
      .access(repositoryPath('human-review.json'))
      .then(() => true)
      .catch(() => false);
    if (!defaultHumanExists) ok('未在项目根目录偷偷生成 human-review.json（仍只由人工点击保存时创建）');
    else report.push('! 项目根目录已存在 human-review.json（人工审核产物，属正常情况）');


    // F22: read the real existing package at its relocated canonical path, without saving.
    const movedManifest=repositoryPath('workspace/analyses/context-consumption/stage2-gold/reading-bundle.json');
    if(await fs.access(movedManifest).then(()=>true,()=>false)) {
    const movedRead=await win.webContents.executeJavaScript(`(async()=>{
      window.__state.dirty=false;
      const result=await window.__loadBundle(${JSON.stringify(movedManifest)});
      if(!result.ok)throw new Error('moved bundle load failed');
      if(window.__state.view!=='l0')throw new Error('moved bundle default Map');
      const blocks=window.__state.l2ViewModel.sections.flatMap(s=>s.blocks);
      const suitable=id=>blocks.find(b=>b.id===id&&b.covers.length&&b.reviewObjectLinks.values.length);
      const topic=Object.values(window.__state.l1Topics).find(t=>t.blockEntries?.some(b=>suitable(b.id)));
      if(!topic)throw new Error('moved bundle Topic');
      document.querySelector('[data-enter-topic="'+topic.topic.id+'"]').click();
      const id=topic.blockEntries.find(b=>suitable(b.id)).id;
      document.querySelector('[data-l1-block="'+id+'"]').click();
      const inspect=document.querySelector('[data-inspect-block="'+id+'"]');inspect.click();
      await new Promise(r=>setTimeout(r,100));
      const sourceButton=document.querySelector('[data-source-unit-id] button');if(!sourceButton)throw new Error('moved SU entry');sourceButton.click();
      await new Promise(r=>setTimeout(r,100));
      if(document.querySelector('#l3-source-coordinate').dataset.coordinateState!=='known')throw new Error('moved source coordinate');
      const review=document.querySelector('#source-body details[data-review-object-id]');
      if(!review)throw new Error('moved review path');review.open=true;
      if(!review.querySelector('.l3-evidence')&&!review.textContent.includes('没有 Evidence'))throw new Error('moved Evidence');
      window.__closeInspection();
      return {human:window.__state.humanReviewPath,dirty:window.__state.dirty};
    })()`);
    if(movedRead.human===repositoryPath('workspace/analyses/context-consumption/stage2-gold/human-review.json')&&!movedRead.dirty)ok('F22 搬迁既有包 Map→Topic→Block→原文/Evidence；人工审核路径留在包内，无自动保存');
    else fail('F22 搬迁包审核路径异常');
    }
    ok(await require('../../scripts/test-reading-bundle-electron').runBundleIntegration(win));
    ok(await require('../../scripts/test-reading-navigation-electron').runNavigationIntegration(win));
    ok(await require('../../scripts/test-explore-electron').runExploreIntegration(win));
    ok(await require('../../scripts/test-product-maturity-electron').runMaturityIntegration(win));
    ok(await require('../../scripts/test-reading-integration-electron').runIntegrationInvariants(win));
    ok(await require('../../scripts/test-l1-boundary-view-electron').runBoundaryIntegration(win));
    ok(await require('../../scripts/test-l0-orientation-electron').runOrientationIntegration(win));

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

    const bundlePreview=await win.webContents.executeJavaScript('Boolean(window.__PREVIEW__?.inspections)');
    if(bundlePreview) {
      const previewWrites=[],originalWrite=fs.writeFile;
      fs.writeFile=async(...args)=>{previewWrites.push(String(args[0]));return originalWrite(...args);};
      try {
      const result=await win.webContents.executeJavaScript(`(async()=>{
        const s=window.__state;
        if(s.view!==(s.l0ViewModel?'l0':'overview'))throw new Error('Preview default view');
        if(s.l0ViewModel){const t=Object.values(s.l1Topics).find(t=>t.blockEntries?.length);document.querySelector('[data-enter-topic="'+t.topic.id+'"]').click();document.querySelector('[data-l1-block]').click();}
        const id=s.l2ViewModel.sections[0].blocks[0].id;
        await window.__openInspection(id);
        const sourceButton=document.querySelector('[data-source-unit-id] button');if(!sourceButton)throw new Error('moved SU entry');sourceButton.click();await new Promise(r=>setTimeout(r,50));
        const panel=document.getElementById('l3-source-coordinate');if(panel.dataset.coordinateState!=='known')throw new Error('Preview section');
        if(document.getElementById('source-body').dataset.claimVerification!=='absent')throw new Error('Preview verification');
        if(!document.getElementById('btn-save').disabled)throw new Error('Preview saving');
        document.getElementById('btn-save').click();
        if((await window.designReview.saveHumanReview({})).ok!==false)throw new Error('Preview save API must reject');
        return {blocks:s.l2ViewModel.sections.flatMap(s=>s.blocks).length,text:panel.textContent.length};
      })()`);
      if(result.blocks!==21 || result.text<80)throw new Error('Preview content');
      ok('bundle inspection: 默认视图 / SU section / Known Absent / 只读审核通过');
      if(await win.webContents.executeJavaScript('Boolean(window.__state.l0ViewModel)')) {
        await win.webContents.executeJavaScript('window.__applyLoadResult(window.__PREVIEW__.loadResult)');
        ok(await require('../../scripts/test-reading-navigation-electron').exerciseNavigation(win));
        await win.webContents.executeJavaScript('window.__applyLoadResult(window.__PREVIEW__.loadResult)');
        ok(await require('../../scripts/test-explore-electron').exerciseExplore(win));
        await win.webContents.executeJavaScript('window.__applyLoadResult(window.__PREVIEW__.loadResult)');
        ok(await require('../../scripts/test-product-maturity-electron').exerciseMaturity(win));
        await win.webContents.executeJavaScript('window.__applyLoadResult(window.__PREVIEW__.loadResult)');
        ok(await require('../../scripts/test-reading-integration-electron').exerciseIntegration(win));
        await win.webContents.executeJavaScript('window.__applyLoadResult(window.__PREVIEW__.loadResult)');
        ok(await require('../../scripts/test-l1-boundary-view-electron').exerciseBoundaryView(win));
        if(await win.webContents.executeJavaScript("window.__state.l0ViewModel.readingGuide?.state==='present'")){
          await win.webContents.executeJavaScript('window.__applyLoadResult(window.__PREVIEW__.loadResult)');
          ok(await require('../../scripts/test-l0-orientation-electron').exerciseReadingPanel(win));
          ok(await require('../../scripts/test-l0-orientation-electron').exerciseOrientation(win));
        }
      } else {
        const nav=await win.webContents.executeJavaScript("(()=>{window.__closeInspection();const n=window.__readingNavigation;const origin=n.snapshot().current;const calls=n.snapshot().resolverCalls;n.resolve({kind:'block',id:'O-01'});n.back();return n.snapshot().resolverCalls===calls+1&&JSON.stringify(origin.address)===JSON.stringify(n.snapshot().current.address);})()");
        if(!nav)throw new Error('Preview Back/Resolve');ok('Preview no-map canonical Block and Back isolation');
      }
      fs.writeFile=originalWrite;
      if(previewWrites.length)throw new Error('Preview attempted application writes: '+previewWrites.join(', '));
      ok('Preview application write interception: zero writes; disabled save and rejected save API');
      emit();process.stdout.write('VERIFY PREVIEW PASSED\n');app.exit(0);return;
      } finally { fs.writeFile=originalWrite; }
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
