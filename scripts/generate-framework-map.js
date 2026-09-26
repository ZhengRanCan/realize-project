#!/usr/bin/env node
'use strict';

/**
 * Feature 07 · AI Framework Map Generation —— 生成器（Phase 1 harness）
 *
 * 链路：
 *   fixture 文档 → prompt → AI → raw response → framework-map.json → check-map → 落盘
 *
 * 本脚本的产品定位是**观察工具**，不是 repair 工具。四条纪律（F07 §3 / §7 / §12）：
 *
 *   1. 每次运行独立目录。失败绝不覆盖既有产物，尤其绝不覆盖上一份成功产物。
 *   2. framework-map.json 只在 temp 写入 + read-back 校验成功后才原子 rename。
 *   3. validator FAIL 的产物必须原样保留 —— 那是 F07 最重要的实验数据之一，不是垃圾。
 *   4. **绝不 repair AI 输出**：不替换非法 relation、不删超预算元素、不补 provenance。
 *      否则无法判断 AI 的实际能力。
 *
 * 用法（正式 run）：
 *   node scripts/generate-framework-map.js --fixture a
 *   node scripts/generate-framework-map.js --fixture d --run 2 --max-attempts 3
 *
 * 用法（离线安全验证，**不联网、不需要 key**）：
 *   node scripts/generate-framework-map.js --fixture d --out tmp/x --stub-content tmp/x/content.json
 *   node scripts/generate-framework-map.js --fixture d --out tmp/x --stub-http 503
 *   node scripts/generate-framework-map.js --fixture d --out tmp/x --stub-transport-error ECONNRESET
 *
 * 退出码：
 *   0  run 已记录，且 check-map PASS
 *   1  run 已记录，但 check-map HARD FAIL（产物仍然完整保留）
 *   2  传输 / HTTP / 解析失败（没有 framework-map.json）
 *   3  拒绝覆盖：目标 run 目录已存在
 *   4  用法错误
 *
 * 凭据解析顺序（绝不写入仓库、绝不打印完整 key）：
 *   1. 环境变量 FRAMEWORK_MAP_API_KEY / FRAMEWORK_MAP_BASE_URL / FRAMEWORK_MAP_MODEL
 *   2. 兼容旧名 OVERVIEW_PLAN_*
 *   3. DSH settings.yaml 里 dsh-imagegen.apiUrl / apiKey
 */

// undici 的默认 headers timeout 比本脚本的预算短，长响应会被掐断成
// UND_ERR_HEADERS_TIMEOUT。必须在 undici 加载前设置（传输层超时，非语义重试）。
process.env.UNDICI_HEADERS_TIMEOUT = process.env.UNDICI_HEADERS_TIMEOUT || '900000';
process.env.UNDICI_BODY_TIMEOUT = process.env.UNDICI_BODY_TIMEOUT || '900000';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');

/** 五篇已验收 Fixture。D / E 必须使用 F09 冻结的测试副本（测试文档/ 下那两份）。 */
const FIXTURES = {
  a: { doc: '测试文档/18-context-consumption-semantic-model.md', label: 'A · Concept / Architecture heavy' },
  b: { doc: '测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md', label: 'B · Data / transformation heavy' },
  c: { doc: '测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md', label: 'C · Process heavy' },
  d: { doc: '测试文档/fixture-d-goal-plan-task-state-model.md', label: 'D · ER-heavy / multi-entity network' },
  e: { doc: '测试文档/fixture-e-f13-f16-runbook.md', label: 'E · Operational Runbook' },
};

const DEFAULTS = {
  out: path.join('experiments', 'framework-map-generation'),
  prompt: path.join('ai', 'framework-map-generation.prompt.md'),
  schema: path.join('schema', 'framework-map.schema.json'),
  model: 'gpt-5.6-sol',
  maxTokens: 32000,
  temperature: 1,
  timeoutMs: 900000,
  maxAttempts: 3,
};

const EXIT = { PASS: 0, VALIDATOR_FAIL: 1, FAILED: 2, REFUSE_OVERWRITE: 3, USAGE: 4 };

/* ------------------------------------------------------------------ *
 * 参数
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) args[key] = true;
    else { args[key] = value; i += 1; }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const fixtureId = typeof args.fixture === 'string' ? args.fixture.toLowerCase() : null;
const isStub = !!(args['stub-content'] || args['stub-http'] || args['stub-transport-error']);

function usage(msg) {
  console.error(`✗ ${msg}`);
  console.error('用法: node scripts/generate-framework-map.js --fixture <a|b|c|d|e> [--run N] [--model M]');
  console.error('      [--out DIR] [--prompt FILE] [--max-attempts N] [--timeout-ms N]');
  console.error('      # 离线安全验证（不联网）: [--stub-content FILE] [--stub-http N] [--stub-transport-error TEXT]');
  process.exit(EXIT.USAGE);
}

if (!fixtureId || !FIXTURES[fixtureId]) usage(`--fixture 必须是 a / b / c / d / e（收到：${fixtureId || '(空)'}）`);

const fixture = FIXTURES[fixtureId];
const docPath = path.resolve(ROOT, fixture.doc);
if (!fs.existsSync(docPath)) usage(`fixture 文档不存在：${fixture.doc}`);

const outBase = path.resolve(ROOT, String(args.out));
const promptPath = path.resolve(ROOT, String(args.prompt));
const schemaPath = path.resolve(ROOT, String(args.schema));

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const nowIso = () => new Date().toISOString();
const writeText = (file, text) => fs.writeFileSync(file, text, 'utf8');

/**
 * run 目录分配：每次运行一个独立目录，**永不覆盖已存在的目录**。
 * 失败重跑会自动落到下一个编号，绝不会碰到上一份产物。
 */
function allocateRunDir() {
  const base = path.join(outBase, `fixture-${fixtureId}`);
  if (args.run) {
    const dir = path.join(base, `run-${String(args.run).padStart(2, '0')}`);
    if (fs.existsSync(dir)) {
      console.error(`✗ 拒绝覆盖：${rel(dir)} 已存在。`);
      console.error('  每次 run 必须独立 —— 换一个 --run 编号，或先人工确认后再删除。');
      console.error('  （这是 F07 §3.1 的产物安全规则：不得让新请求覆盖既有产物。）');
      process.exit(EXIT.REFUSE_OVERWRITE);
    }
    return dir;
  }
  let n = 1;
  while (fs.existsSync(path.join(base, `run-${String(n).padStart(2, '0')}`))) n += 1;
  return path.join(base, `run-${String(n).padStart(2, '0')}`);
}

/**
 * 成功写入协议（F07 §3.2）：temp 写入 → read-back 解析 → 原子 rename。
 * 任何一步失败都不产生 framework-map.json，因此既有成功产物不可能被破坏。
 */
function writeJsonAtomically(dir, fileName, obj, protocol) {
  const finalPath = path.join(dir, fileName);
  if (fs.existsSync(finalPath)) throw new Error(`拒绝覆盖已存在的 ${fileName}`);
  const tmpPath = path.join(dir, fileName.replace(/\.json$/, '.tmp.json'));
  const text = `${JSON.stringify(obj, null, 2)}\n`;

  writeText(tmpPath, text);
  protocol.tempWrite = true;

  const readBack = JSON.parse(fs.readFileSync(tmpPath, 'utf8')); // read-back parse
  protocol.readBackVerified = true;
  if (JSON.stringify(readBack) !== JSON.stringify(obj)) throw new Error('read-back 与写入内容不一致');

  fs.renameSync(tmpPath, finalPath); // 原子替换
  protocol.atomicRename = true;
  return finalPath;
}

/** 运行 check-map。**同进程内联**（与 CLI 共用 renderReport），因此不依赖子进程与管道；
 *  validator 失败、甚至产物无法被校验（抛异常）都只是**数据**，不改变已落盘的产物。 */
function runValidator(map, mapRelPath) {
  try {
    const cm = require('./check-map.js');
    const r = cm.checkMap(map, {});
    return {
      exitCode: r.hard.length === 0 ? 0 : 1,
      out: `${cm.renderReport(mapRelPath, map, r)}\n`,
      summary: { hard: r.hard.length, warn: r.warn.length, info: r.info.length, status: r.status },
    };
  } catch (error) {
    return {
      exitCode: 1,
      out: `check-map 未能完成（产物本身无法被校验 —— 这仍是实验数据，不是垃圾）：\n${error && error.stack ? error.stack : error}\n`,
      summary: { hard: null, warn: null, info: null, status: 'ERROR（check-map 未能完成）' },
    };
  }
}

/** 模型输出抠 JSON（容忍 ```json 围栏与前后解释文字）。**只做提取，不做修补。** */
function extractJson(content) {
  if (!content || !content.trim()) throw new Error('模型返回了空内容');
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error(`找不到 JSON 对象：${text.slice(0, 300)}`);
  return JSON.parse(text.slice(first, last + 1));
}

/* ------------------------------------------------------------------ *
 * 凭据（stub 模式完全跳过）
 * ------------------------------------------------------------------ */

function readSettings() {
  const file = path.join(os.homedir(), '.dsh', 'settings.yaml');
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  const url = text.match(/apiUrl:\s*(\S+)/);
  const key = text.match(/apiKey:\s*(\S+)/);
  return { baseURL: url && url[1], apiKey: key && key[1] };
}

function resolveCredentials() {
  const settings = readSettings();
  const baseURL = process.env.FRAMEWORK_MAP_BASE_URL || process.env.OVERVIEW_PLAN_BASE_URL || settings.baseURL;
  const apiKey = process.env.FRAMEWORK_MAP_API_KEY || process.env.OVERVIEW_PLAN_API_KEY
    || process.env.OPENAI_API_KEY || settings.apiKey;
  const model = process.env.FRAMEWORK_MAP_MODEL || process.env.OVERVIEW_PLAN_MODEL || String(args.model);
  if (!baseURL || !apiKey) {
    console.error('✗ 找不到可用的 API 凭据（设置 FRAMEWORK_MAP_BASE_URL / FRAMEWORK_MAP_API_KEY，或 ~/.dsh/settings.yaml）。');
    process.exit(EXIT.USAGE);
  }
  return { baseURL: baseURL.replace(/\/$/, ''), apiKey, model };
}

/* ------------------------------------------------------------------ *
 * Prompt 组装
 * ------------------------------------------------------------------ */

function loadPromptTemplates() {
  const raw = fs.readFileSync(promptPath, 'utf8');
  const sysIdx = raw.indexOf('## SYSTEM');
  const userIdx = raw.indexOf('## USER TEMPLATE');
  if (sysIdx < 0 || userIdx < 0) throw new Error('prompt 文件必须包含 "## SYSTEM" 与 "## USER TEMPLATE" 两段');
  return {
    system: raw.slice(sysIdx + '## SYSTEM'.length, userIdx).trim(),
    user: raw.slice(userIdx + '## USER TEMPLATE'.length).trim(),
    fingerprint: sha256(raw).slice(0, 16),
  };
}

/** 文档的 heading tree（当前文档自身的结构，不是外部信息面）。 */
function headingTreeText() {
  const { readDocHeadings } = require('./check-map.js');
  const h = readDocHeadings(fixture.doc);
  const lines = h.heads.map((x) => `${'  '.repeat(Math.max(0, x.level - 1))}- level ${x.level} · key 「§${x.key}」 · ${x.text}（L${x.line}）`);
  return `sectionLevel（N2/N3 所在层）= ${h.sectionLevel}\n顶层小节（必须全部有导航入口）：${h.top.map((k) => `§${k}`).join(' · ')}\n\n全部 heading：\n${lines.join('\n')}`;
}

function buildUserMessage(template) {
  return template
    .replace(/\{\{DOC_PATH\}\}/g, fixture.doc)
    .replace(/\{\{HEADING_TREE\}\}/g, headingTreeText())
    .replace(/\{\{SCHEMA\}\}/g, fs.readFileSync(schemaPath, 'utf8').trim())
    .replace(/\{\{DOCUMENT_TEXT\}\}/g, fs.readFileSync(docPath, 'utf8').trim());
}

/* ------------------------------------------------------------------ *
 * 传输层
 * ------------------------------------------------------------------ */

async function callModel(creds, system, user) {
  const body = JSON.stringify({
    model: creds.model,
    temperature: Number(args.temperature),
    max_tokens: Number(args.maxTokens),
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  const maxAttempts = Math.max(1, Number(args['max-attempts']) || DEFAULTS.maxAttempts);
  const timeoutMs = Number(args['timeout-ms']) || DEFAULTS.timeoutMs;
  const started = Date.now();
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response, text;
    try {
      response = await fetch(`${creds.baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.apiKey}` },
        body, signal: controller.signal,
      });
      text = await response.text();
    } catch (error) {
      // 只处理**传输层**失败；HTTP 层错误走下面的分支，不在这里重试。
      clearTimeout(timer);
      const isAbort = error.name === 'AbortError';
      const cause = error.cause ? `（cause: ${error.cause.code || error.cause.message}）` : '';
      lastError = new Error(isAbort ? `请求超时（> ${(timeoutMs / 1000).toFixed(0)}s）` : `${error.message}${cause}`);
      if (attempt < maxAttempts) {
        const waitMs = attempt * 5000;
        console.log(`  第 ${attempt} 次尝试失败：${lastError.message}；${waitMs / 1000}s 后重试…`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      break;
    }
    clearTimeout(timer);

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      if (retryable && attempt < maxAttempts) {
        lastError = new Error(`HTTP ${response.status}`);
        console.log(`  第 ${attempt} 次尝试失败（HTTP ${response.status}），重试…`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
        continue;
      }
      // 4xx（除 429）是确定性错误：重试没有意义 → 立即失败。
      throw new Error(`HTTP ${response.status}：${text.slice(0, 600)}`);
    }

    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error(`响应不是 JSON：${text.slice(0, 400)}`); }
    const choice = (payload.choices || [])[0] || {};
    return {
      content: (choice.message && choice.message.content) || '',
      usage: payload.usage || null,
      latencyMs: Date.now() - started,
      finishReason: choice.finish_reason,
      attempts: attempt,
    };
  }
  throw new Error(`连续 ${maxAttempts} 次传输失败：${lastError ? lastError.message : '未知'}`);
}

/** 产物结构 preflight：连"是不是一张 map"都不成立时，不要拿去跑 check-map。
 * 这种情况**仍然原样保留产物**（F07 §3.3），只是把原因写清楚。 */
function preflight(map) {
  const problems = [];
  if (map === null || typeof map !== 'object' || Array.isArray(map)) {
    problems.push('顶层不是 JSON 对象');
    return problems;
  }
  ['document', 'elements', 'edges', 'topics', 'meta'].forEach((k) => {
    if (!(k in map)) problems.push(`缺少必填字段 ${k}`);
  });
  if (map.document && typeof map.document !== 'object') problems.push('document 不是对象');
  return problems;
}

/** 离线 stub：用于验证产物安全协议本身（**永不用于正式 run**）。
 *  它必须与 live 传输层**同形**：先取 API 信封里的 choices[0].message.content。
 *  若文件不是信封（例如故意给一段散文），则整段作为 content —— 这样"返回非 JSON"也能被真实复现。 */
function stubCall() {
  if (args['stub-transport-error']) {
    const e = new Error(`模拟传输层失败：${args['stub-transport-error']}`);
    e.isTransport = true;
    return { error: e };
  }
  if (args['stub-http']) {
    const status = Number(args['stub-http']);
    return { error: new Error(`HTTP ${status}：模拟网关错误（stub）`) };
  }
  const file = path.resolve(ROOT, String(args['stub-content']));
  if (!fs.existsSync(file)) usage(`--stub-content 文件不存在：${args['stub-content']}`);
  const text = fs.readFileSync(file, 'utf8');
  let content = text;
  try {
    const envelope = JSON.parse(text);
    const c = envelope && envelope.choices && envelope.choices[0]
      && envelope.choices[0].message && envelope.choices[0].message.content;
    if (typeof c === 'string') content = c;
  } catch { /* 不是信封 → 整段当 content */ }
  return { content, usage: null, latencyMs: 1, finishReason: 'stub', attempts: 1 };
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

async function main() {
  if (!fs.existsSync(promptPath)) usage(`prompt 文件不存在：${rel(promptPath)}（Phase 1 交付物）`);
  if (!isStub && !fs.existsSync(schemaPath)) usage(`schema 文件不存在：${rel(schemaPath)}`);

  const templates = loadPromptTemplates();
  const userMessage = buildUserMessage(templates.user);
  const runDir = allocateRunDir();
  fs.mkdirSync(runDir, { recursive: true });

  const creds = isStub ? { baseURL: '(stub)', apiKey: '(stub)', model: `stub:${String(args.model)}` } : resolveCredentials();
  const docText = fs.readFileSync(docPath, 'utf8');

  const protocol = {
    rawResponseSaved: false, jsonExtracted: false,
    tempWrite: false, readBackVerified: false, atomicRename: false, checkMapExecuted: false,
  };

  const requestRecord = {
    fixture: fixtureId,
    fixtureLabel: fixture.label,
    runDir: rel(runDir),
    mode: isStub ? 'stub' : 'live',
    model: creds.model,
    endpoint: isStub ? '(stub)' : creds.baseURL, // 不含 key
    docPath: fixture.doc,
    docSha256: sha256(docText),
    promptPath: rel(promptPath),
    promptFingerprint: templates.fingerprint,
    userMessageSha256: sha256(userMessage),
    systemPromptChars: templates.system.length,
    userMessageChars: userMessage.length,
    temperature: Number(args.temperature),
    maxTokens: Number(args.maxTokens),
    startedAt: nowIso(),
  };
  writeText(path.join(runDir, 'request.json'), `${JSON.stringify(requestRecord, null, 2)}\n`);

  console.log('=== F07 framework-map generation ===');
  console.log(`fixture    ${fixtureId}（${fixture.label}）`);
  console.log(`document   ${fixture.doc}`);
  console.log(`prompt     ${rel(promptPath)}（指纹 ${templates.fingerprint}）`);
  console.log(`model      ${creds.model}${isStub ? '   [STUB —— 不联网，仅验证产物安全协议]' : ''}`);
  console.log(`run dir    ${rel(runDir)}`);
  console.log(`user msg   ${(userMessage.length / 1024).toFixed(1)} KB`);

  const meta = {
    fixture: fixtureId,
    fixtureLabel: fixture.label,
    runDir: rel(runDir),
    mode: isStub ? 'stub' : 'live',
    model: creds.model,
    startedAt: requestRecord.startedAt,
    finishedAt: null,
    status: null,
    error: null,
    attempts: 0,
    latencyMs: null,
    finishReason: null,
    usage: null,
    protocol,
    repair: 'none', // 本脚本从不修改 AI 输出
    artifactSha256: {},
    validator: null,
  };

  console.log('\n调用模型…');
  let result;
  try {
    result = isStub ? stubCall() : await callModel(creds, templates.system, userMessage);
    if (result.error) throw result.error;
  } catch (error) {
    meta.status = 'transport-failed';
    meta.error = error.message;
    meta.finishedAt = nowIso();
    writeText(path.join(runDir, 'run-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
    console.error(`\n✗ 调用失败：${error.message}`);
    console.error(`  产物安全：本 run 目录只有 request.json / run-meta.json；`);
    console.error(`  未产生 framework-map.json，**既有任何 run 的产物都未被触碰**。`);
    process.exit(EXIT.FAILED);
  }

  meta.attempts = result.attempts || 1;
  meta.latencyMs = result.latencyMs ?? null;
  meta.finishReason = result.finishReason ?? null;
  meta.usage = result.usage || null;
  console.log(`完成：${result.latencyMs != null ? `${(result.latencyMs / 1000).toFixed(1)}s，` : ''}finish_reason=${result.finishReason}`);

  // 1) 原始输出**永远**先落盘（这是最重要的原始证据）
  writeText(path.join(runDir, 'raw-response.txt'), result.content ?? '');
  protocol.rawResponseSaved = true;

  // 2) 抠 JSON（失败也只记录，不猜测、不修补）
  let map;
  try {
    map = extractJson(result.content);
    protocol.jsonExtracted = true;
  } catch (error) {
    meta.status = 'parse-failed';
    meta.error = error.message;
    meta.finishedAt = nowIso();
    writeText(path.join(runDir, 'run-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
    console.error(`\n✗ 解析失败：${error.message}`);
    console.error('  raw-response.txt 已保留；没有生成 framework-map.json（不做任何自动修补）。');
    process.exit(EXIT.FAILED);
  }

  // 3) 成功写入协议
  let mapFile;
  try {
    mapFile = writeJsonAtomically(runDir, 'framework-map.json', map, protocol);
  } catch (error) {
    meta.status = 'write-protocol-failed';
    meta.error = error.message;
    meta.finishedAt = nowIso();
    writeText(path.join(runDir, 'run-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
    console.error(`\n✗ 写入协议失败：${error.message}`);
    process.exit(EXIT.FAILED);
  }
  meta.artifactSha256['framework-map.json'] = sha256(fs.readFileSync(mapFile, 'utf8'));

  // 4) validator：FAIL 也是数据，原样保留
  const problems = preflight(map);
  const v = problems.length
    ? {
      exitCode: 1,
      out: `===== 产物结构不可校验（未进入 check-map）=====\n${problems.map((p) => `  ✗ ${p}`).join('\n')}\n\n产物已原样保留（F07 §3.3）：结构不成立的产物同样是实验数据。\n`,
      summary: { hard: null, warn: null, info: null, status: 'INVALID（结构不可校验）' },
    }
    : runValidator(map, rel(mapFile));
  writeText(path.join(runDir, 'check-map.txt'), v.out);
  protocol.checkMapExecuted = true;
  meta.validator = { exitCode: v.exitCode, ...v.summary };
  meta.status = v.exitCode === 0 ? 'success' : 'success-validator-fail';
  meta.finishedAt = nowIso();
  writeText(path.join(runDir, 'run-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

  // request.json 补上结局（同一 run 目录内，不影响产物安全）
  writeText(path.join(runDir, 'request.json'), `${JSON.stringify({
    ...requestRecord, finishedAt: meta.finishedAt, status: meta.status, error: meta.error,
  }, null, 2)}\n`);

  console.log(`\nvalidator  ${meta.validator.status}（HARD ${meta.validator.hard} · WARN ${meta.validator.warn} · INFO ${meta.validator.info}）`);
  console.log(`产物       ${rel(runDir)}/{request.json, raw-response.txt, framework-map.json, check-map.txt, run-meta.json}`);
  if (v.exitCode !== 0) {
    console.log('注意：validator FAIL 的产物**必须保留**（F07 §3.3）—— 本 run 已完整落盘，未做任何修补。');
  }
  process.exit(v.exitCode === 0 ? EXIT.PASS : EXIT.VALIDATOR_FAIL);
}

main().catch((error) => {
  console.error(`✗ 未捕获错误：${error && error.stack ? error.stack : error}`);
  process.exit(EXIT.FAILED);
});
