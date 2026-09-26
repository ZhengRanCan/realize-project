#!/usr/bin/env node
'use strict';

/**
 * Feature 10 · 两阶段生成运行器
 *
 *   Stage A  document → semantic-inventory.prompt → AI → semantic-inventory.json
 *   Stage B  document + inventory → synthesis.prompt → AI → framework-map.json + map-selection.json
 *                                                          → check-map（Structural Validation）
 *
 * ## 为什么两阶段写在**同一个** run 目录里
 *   本 Feature 的产物价值就在于「丢在哪一步」可归因：
 *     Source → Stage A Inventory → Stage B Selection → Framework Map Encoding
 *   所以中间态（inventory）**是实验数据，不是临时文件**。任一阶段失败都不得抹掉前一阶段的证据。
 *
 * ## 产物（run 目录）
 *   request-stage-a.json · raw-inventory-response.txt · semantic-inventory.json
 *   request-stage-b.json · raw-synthesis-response.txt · framework-map.json · map-selection.json
 *   check-map.txt · run-meta.json
 *
 * ## 纪律（沿用 F07 已冻结的四条）
 *   1. 每次运行独立目录；--run N 撞车直接拒绝（退出码 3），不写任何文件
 *   2. 成功写入协议：temp → read-back 解析 → 原子 rename
 *   3. 失败请求绝不覆盖既有产物；validator FAIL / 结构不合法的产物**原样保留**
 *   4. **绝不 repair**：不补 sectionRef、不删超预算元素、**不替模型补 selection disposition**
 *
 *   ⚠️ 本文件的产物安全协议是**有意从 F07 的 scripts/generate-framework-map.js 复制**的：
 *      那个脚本是旧臂（historical control）的可执行记录，必须保持字节不动。
 *      两边各有自己的 stub 测试套件（test-generate-framework-map.js / test-semantic-grounding.js）。
 *
 * ## 退出码
 *   0  记录完成，integrity 干净，且（跑了 Stage B 时）check-map PASS
 *   1  记录完成，但 integrity FAIL 或 check-map FAIL（产物**仍然完整保留**）
 *   2  传输 / HTTP / 解析失败（没有对应的最终产物）
 *   3  拒绝覆盖：目标 run 目录已存在
 *   4  用法 / 凭据错误
 *
 * ## 用法
 *   node scripts/run-semantic-grounding.js --fixture e
 *   node scripts/run-semantic-grounding.js --fixture e --stage a
 *   node scripts/run-semantic-grounding.js --fixture e --stage b --inventory <已冻结的 inventory 路径>
 *   # 离线 stub（零模型调用）
 *   node scripts/run-semantic-grounding.js --fixture e --stub-a-content f.json --stub-b-content g.txt
 *   node scripts/run-semantic-grounding.js --fixture e --stub-b-http 503        # A 成功、B 失败
 */

process.env.UNDICI_HEADERS_TIMEOUT = process.env.UNDICI_HEADERS_TIMEOUT || '900000';
process.env.UNDICI_BODY_TIMEOUT = process.env.UNDICI_BODY_TIMEOUT || '900000';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');

const FIXTURES = {
  a: { doc: '测试文档/18-context-consumption-semantic-model.md', label: 'A · Concept / Architecture heavy' },
  b: { doc: '测试文档/fixture-b-canonical-hash-digest-and-integrity-specification.md', label: 'B · Data / transformation heavy' },
  c: { doc: '测试文档/fixture-c-candidate-inbox-driven-profile-pipeline.md', label: 'C · Process heavy' },
  d: { doc: '测试文档/fixture-d-goal-plan-task-state-model.md', label: 'D · ER-heavy / multi-entity network' },
  e: { doc: '测试文档/fixture-e-f13-f16-runbook.md', label: 'E · Operational Runbook' },
};

const DEFAULTS = {
  out: path.join('experiments', 'semantic-grounding'),
  promptA: path.join('ai', 'semantic-inventory.prompt.md'),
  promptB: path.join('ai', 'framework-map-synthesis.prompt.md'),
  schemaA: path.join('schema', 'semantic-inventory.schema.json'),
  schemaB: path.join('schema', 'framework-map.schema.json'),
  selectionSchema: path.join('schema', 'map-selection.schema.json'),
  model: 'deepseek-flash',
  // Stage A 的输出预算：**不能压**。
  // 实测（e/run-03）：16384 预算下 finish_reason=length，16386/16384 顶格，
  // 其中 reasoning 占 14634（89%）→ 真正写出的 JSON 只有 ~1.7k tokens 就被砍断。
  // 该模型的 max_tokens 同时覆盖 reasoning 与 content，所以必须给足（F07 已验证 65536 可用）。
  maxTokensA: 65536,
  // Stage B **同样不能压**。实测（e/run-04）：max_tokens_b=12288 时
  // finish_reason=length、completion=12288、**reasoning 也是 12288** → content 长度 0，
  // 模型把整份预算花在思考上，一个字都没输出。
  maxTokensB: 65536,
  temperature: 1,
  timeoutMs: 900000,
  maxAttempts: 1,
  stage: 'both',
};

const EXIT = { CLEAN: 0, RECORDED_WITH_FAIL: 1, FAILED: 2, REFUSE_OVERWRITE: 3, USAGE: 4 };

/** 「不可以砍」五类（只用于 audit 提示；不参与任何自动判定） */
const UNCUTTABLE = /(失败|异常|权限|越权|管理员|阈值|上限|重试|不变量|一致|唯一|幂等|非目标|不做|不得)/;

/* ------------------------------------------------------------------ *
 * 参数 / 工具
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) args[key] = true;
    else { args[key] = value; i += 1; }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const fixtureId = typeof args.fixture === 'string' ? args.fixture.toLowerCase() : null;

function usage(msg) {
  if (msg) console.error(`✗ ${msg}`);
  console.error('用法: node scripts/run-semantic-grounding.js --fixture <a|b|c|d|e> [--stage a|b|both]');
  console.error('      [--run N] [--out DIR] [--inventory FILE] [--model M] [--temperature T]');
  console.error('      [--max-tokens-a N]（Stage A 默认 16384）[--max-tokens-b N]（Stage B 默认 12288）');
  console.error('      [--max-attempts N] [--timeout-ms N] [--allow-settings-fallback]');
  console.error('      # 离线 stub（零模型调用）: [--stub-a-content FILE] [--stub-a-http N] [--stub-a-transport-error TEXT]');
  console.error('      #                        [--stub-b-content FILE] [--stub-b-http N] [--stub-b-transport-error TEXT]');
  process.exit(EXIT.USAGE);
}

if (!fixtureId || !FIXTURES[fixtureId]) usage(`--fixture 必须是 a/b/c/d/e（收到：${fixtureId || '(空)'}）`);
const stage = String(args.stage).toLowerCase();
if (!['a', 'b', 'both'].includes(stage)) usage(`--stage 必须是 a / b / both（收到：${args.stage}）`);
if (stage === 'b' && !args.inventory) usage('--stage b 必须同时给 --inventory <已冻结的 inventory 路径>');

const fixture = FIXTURES[fixtureId];
const docPath = path.resolve(ROOT, fixture.doc);
if (!fs.existsSync(docPath)) usage(`fixture 文档不存在：${fixture.doc}`);

const outBase = path.resolve(ROOT, String(args.out));
const promptAPath = path.resolve(ROOT, String(args.promptA));
const promptBPath = path.resolve(ROOT, String(args.promptB));
const schemaAPath = path.resolve(ROOT, String(args.schemaA));
const schemaBPath = path.resolve(ROOT, String(args.schemaB));
const selectionSchemaPath = path.resolve(ROOT, String(args.selectionSchema));

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const nowIso = () => new Date().toISOString();
const writeText = (f, t) => fs.writeFileSync(f, t, 'utf8');
/** 冻结条件引用：路径 + 内容 hash（用于事后证明"这轮实验用的是这一版"）。 */
const artifactRef = (p) => ({ path: rel(p), sha256: sha256(fs.readFileSync(p, 'utf8')) });

const isStubStage = (s) => !!(args[`stub${s.toUpperCase()}Content`] || args[`stub${s.toUpperCase()}Http`] || args[`stub${s.toUpperCase()}TransportError`]);

/* ------------------------------------------------------------------ *
 * 凭据（stub 模式跳过）
 * ------------------------------------------------------------------ */

function readSettings() {
  const file = path.join(os.homedir(), '.dsh', 'settings.yaml');
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  const url = text.match(/apiUrl:\s*(\S+)/);
  const key = text.match(/apiKey:\s*(\S+)/);
  return { baseURL: url && url[1], apiKey: key && key[1] };
}

const redactUrl = (u) => { try { const x = new URL(u); return `${x.protocol}//${x.host}${x.pathname.replace(/\/$/, '')}`; } catch { return '(unparsable)'; } };
const providerOf = (u) => {
  try {
    const h = new URL(u).hostname;
    if (/(^|\.)deepseek\.com$/i.test(h)) return 'deepseek';
    if (/^(localhost|127\.0\.0\.1)$/i.test(h)) return 'local';
    return h;
  } catch { return 'unknown'; }
};

function resolveCredentials() {
  const settings = readSettings();
  const explicit = !!(process.env.FRAMEWORK_MAP_BASE_URL && process.env.FRAMEWORK_MAP_API_KEY);
  const baseURL = process.env.FRAMEWORK_MAP_BASE_URL || settings.baseURL;
  const apiKey = process.env.FRAMEWORK_MAP_API_KEY || settings.apiKey;
  const model = process.env.FRAMEWORK_MAP_MODEL || String(args.model);
  if (!explicit && !args.allowSettingsFallback) {
    console.error('✗ 未显式提供 FRAMEWORK_MAP_BASE_URL / FRAMEWORK_MAP_API_KEY。');
    console.error('  live 模式默认**拒绝**回落到 ~/.dsh/settings.yaml（避免实验期间 endpoint 被换掉）。');
    console.error('  确需回落请显式加 --allow-settings-fallback。');
    process.exit(EXIT.USAGE);
  }
  if (!baseURL || !apiKey) usage('找不到可用的 API 凭据（FRAMEWORK_MAP_BASE_URL / FRAMEWORK_MAP_API_KEY）');
  return { baseURL: baseURL.replace(/\/$/, ''), apiKey, model, provider: providerOf(baseURL), baseUrlRedacted: redactUrl(baseURL) };
}

/* ------------------------------------------------------------------ *
 * prompt / 输入
 * ------------------------------------------------------------------ */

function loadPrompt(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const sysIdx = raw.indexOf('## SYSTEM');
  const userIdx = raw.indexOf('## USER TEMPLATE');
  if (sysIdx < 0 || userIdx < 0) throw new Error(`${rel(file)} 必须包含 "## SYSTEM" 与 "## USER TEMPLATE" 两段`);
  return {
    system: raw.slice(sysIdx + '## SYSTEM'.length, userIdx).trim(),
    user: raw.slice(userIdx + '## USER TEMPLATE'.length).trim(),
    sha256: sha256(raw),
    fingerprint: sha256(raw).slice(0, 16),
  };
}

function headingInfo() {
  const { readDocHeadings } = require('./check-map.js');
  const h = readDocHeadings(fixture.doc);
  const lines = h.heads.map((x) => `${'  '.repeat(Math.max(0, x.level - 1))}- level ${x.level} · key 「§${x.key}」 · ${x.text}（L${x.line}）`);
  return {
    keys: new Set(h.all.map((k) => `§${k}`)),
    text: `sectionLevel（N2/N3 所在层）= ${h.sectionLevel}\n顶层小节（必须全部有导航入口）：${h.top.map((k) => `§${k}`).join(' · ')}\n\n全部 heading：\n${lines.join('\n')}`,
  };
}

/* ------------------------------------------------------------------ *
 * run 目录 + 原子写入
 * ------------------------------------------------------------------ */

function allocateRunDir() {
  const base = path.join(outBase, `fixture-${fixtureId}`);
  if (args.run) {
    const dir = path.join(base, `run-${String(args.run).padStart(2, '0')}`);
    if (fs.existsSync(dir)) {
      console.error(`✗ 拒绝覆盖：${rel(dir)} 已存在。每次 run 必须独立 —— 换编号，或先人工确认后再删除。`);
      process.exit(EXIT.REFUSE_OVERWRITE);
    }
    return dir;
  }
  let max = 0;
  if (fs.existsSync(base)) {
    for (const name of fs.readdirSync(base)) {
      const m = name.match(/^run-(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return path.join(base, `run-${String(max + 1).padStart(2, '0')}`);
}

/** temp 写入 → read-back 解析 → 原子 rename。任何一步失败都不产生最终文件。 */
function writeJsonAtomically(dir, fileName, obj, protocol) {
  const finalPath = path.join(dir, fileName);
  if (fs.existsSync(finalPath)) throw new Error(`拒绝覆盖已存在的 ${fileName}`);
  const tmpPath = path.join(dir, fileName.replace(/\.json$/, '.tmp.json'));
  writeText(tmpPath, `${JSON.stringify(obj, null, 2)}\n`);
  protocol.tempWrite = true;
  const readBack = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
  protocol.readBackVerified = true;
  if (JSON.stringify(readBack) !== JSON.stringify(obj)) throw new Error('read-back 与写入内容不一致');
  fs.renameSync(tmpPath, finalPath);
  protocol.atomicRename = true;
  return finalPath;
}

/* ------------------------------------------------------------------ *
 * 解析 / 校验（**只报告，不修补**）
 * ------------------------------------------------------------------ */

function extractJson(text) {
  if (!text || !text.trim()) throw new Error('模型返回了空内容');
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error(`找不到 JSON 对象：${t.slice(0, 300)}`);
  return JSON.parse(t.slice(first, last + 1));
}

/** Stage B 的两个 JSON 块（唯一允许的分隔方式）。 */
function splitTwoBlocks(text) {
  const A = '<<<FRAMEWORK_MAP>>>';
  const B = '<<<MAP_SELECTION>>>';
  const i = text.indexOf(A);
  const j = text.indexOf(B);
  if (i < 0) throw new Error(`缺少 ${A} 分隔符`);
  if (j < 0) throw new Error(`缺少 ${B} 分隔符（第二个产物缺失）`);
  if (j < i) throw new Error('分隔符顺序相反');
  return { map: extractJson(text.slice(i + A.length, j)), selection: extractJson(text.slice(j + B.length)) };
}

/** Stage A 产物的**结构**校验。返回 {blocking, advisory}：
 *  · blocking  → 内容级问题（duplicate id / 缺 statement / 缺 sources / §key 不存在）→ **不允许进入 Stage B**
 *  · advisory  → **纯格式**问题（如 id 写成 S-152b）→ 记录为 integrity FAIL，但**允许进入 Stage B**
 *    （理由：id 仍是唯一、可引用的字符串；让一个后缀把整个 run 的 map 抹掉，会白白失去 E2/E3/E4 的归因数据。
 *      这条是对"格式合法"的从宽读法，已登记在 results/ 里，可随时改回严格。） */
function checkInventoryShape(inv, headingKeys) {
  const blocking = [], advisory = [];
  if (!inv || typeof inv !== 'object' || Array.isArray(inv)) return { blocking: ['顶层不是 JSON 对象'], advisory };
  ['inventoryVersion', 'document', 'items'].forEach((k) => { if (!(k in inv)) blocking.push(`缺少必填字段 ${k}`); });
  if (!Array.isArray(inv.items) || inv.items.length === 0) { blocking.push('items 不是非空数组'); return { blocking, advisory }; }
  const seen = new Set();
  inv.items.forEach((it, i) => {
    const tag = it && it.id ? it.id : `items[${i}]`;
    if (!it || typeof it !== 'object') { blocking.push(`${tag} 不是对象`); return; }
    if (!it.id) blocking.push(`${tag} 缺 id`);
    else if (!/^S-[0-9]{2,3}$/.test(it.id)) advisory.push(`id 格式非严格（${it.id}）`);
    else if (seen.has(it.id)) blocking.push(`duplicate id: ${it.id}`);
    else seen.add(it.id);
    if (!it.statement || String(it.statement).trim().length < 8) blocking.push(`${tag} statement 缺失或过短`);
    if (!Array.isArray(it.sources) || it.sources.length === 0) blocking.push(`${tag} 缺少 sources`);
    else it.sources.forEach((s, k) => {
      if (!s || !s.sectionRef) blocking.push(`${tag}.sources[${k}] 缺 sectionRef`);
      else if (headingKeys && !headingKeys.has(s.sectionRef)) blocking.push(`${tag}.sources[${k}] 引用了不存在的 §key: ${s.sectionRef}`);
    });
  });
  return { blocking, advisory };
}

/** Stage B 的选择轨迹完整性 + 引用闭合（deterministic，只报告）。 */
function checkSelectionIntegrity(sel, inventory, map) {
  const problems = [];
  const softNotes = [];
  if (!sel || typeof sel !== 'object' || Array.isArray(sel)) return { problems: ['顶层不是 JSON 对象'], softNotes, stats: {} };
  ['selectionVersion', 'document', 'inventoryRef', 'dispositions'].forEach((k) => { if (!(k in sel)) problems.push(`缺少必填字段 ${k}`); });
  if (!Array.isArray(sel.dispositions)) { problems.push('dispositions 不是数组'); return { problems, softNotes, stats: {} }; }

  const invIds = new Set((inventory.items || []).map((it) => it.id));
  const invById = new Map((inventory.items || []).map((it) => [it.id, it]));
  const elById = new Map((map.elements || []).map((e) => [e.id, e]));
  const attachmentIds = new Set((map.attachments || []).map((a) => a.elementId));
  const topicIds = new Set((map.topics || []).map((t) => t.id));
  const edgeIds = new Set();
  (map.edges || []).forEach((e) => {
    if (e.id) edgeIds.add(e.id);
    edgeIds.add(`${e.from} --${e.type}--> ${e.to}`);
  });

  const seen = new Map();
  sel.dispositions.forEach((d, i) => {
    const tag = d && d.semanticId ? d.semanticId : `dispositions[${i}]`;
    if (!d || typeof d !== 'object') { problems.push(`${tag} 不是对象`); return; }
    if (!d.semanticId || !/^S-[0-9]{2,3}$/.test(d.semanticId)) problems.push(`${tag} semanticId 格式非法`);
    else if (seen.has(d.semanticId)) problems.push(`duplicate disposition: ${d.semanticId}`);
    else seen.set(d.semanticId, d);
    if (d.semanticId && !invIds.has(d.semanticId)) problems.push(`${tag} 引用了 inventory 里不存在的 id`);

    const disp = d.disposition;
    if (!['represented', 'topic-only', 'omitted'].includes(disp)) { problems.push(`${tag} disposition 非法：${disp}`); return; }
    if (!d.reason || String(d.reason).trim().length < 4) problems.push(`${tag} reason 缺失或过短`);

    if (disp === 'omitted') {
      if (d.target !== null && d.target !== undefined) problems.push(`${tag} omitted 的 target 必须为 null`);
      const it = invById.get(d.semanticId);
      if (it && UNCUTTABLE.test(`${it.tag || ''} ${it.statement || ''}`)) {
        softNotes.push(`${tag} 被 omitted，但语义疑似属于「不可以砍」五类（需人工审计）：${it.statement}`);
      }
      return;
    }
    const t = d.target;
    if (!t || typeof t !== 'object') { problems.push(`${tag} ${disp} 必须给 target 对象`); return; }
    if (!t.kind || !t.id) { problems.push(`${tag} target 缺少 kind / id`); return; }
    const key = (k, id) => `${k}:${id}`;
    if (t.kind === 'element') { if (!elById.has(t.id)) problems.push(`${tag} target 指向不存在的 element: ${t.id}`); }
    else if (t.kind === 'constraint') {
      const el = elById.get(t.id);
      if (!el) problems.push(`${tag} target 指向不存在的 element: ${t.id}`);
      else if (el.type !== 'constraint') problems.push(`${tag} target 声称 constraint，但 ${t.id} 的 type 是 ${el.type}`);
    } else if (t.kind === 'attachment') {
      if (!attachmentIds.has(t.id)) problems.push(`${tag} target 声称 attachment，但 ${t.id} 不在 attachments[].elementId 里`);
    } else if (t.kind === 'edge') {
      if (!edgeIds.has(t.id)) problems.push(`${tag} target 指向不存在的 edge: ${t.id}`);
    } else if (t.kind === 'topic') {
      if (disp !== 'topic-only') problems.push(`${tag} 只有 topic-only 才可以用 kind=topic`);
      if (!topicIds.has(t.id)) problems.push(`${tag} target 指向不存在的 topic: ${t.id}`);
    } else problems.push(`${tag} target.kind 非法：${t.kind}`);
    void key;
  });

  // 覆盖性：inventory 每一条必须恰好出现一次
  const missing = [...invIds].filter((id) => !seen.has(id));
  if (missing.length) problems.push(`selection 漏掉 ${missing.length} 条 inventory 项: ${missing.join(', ')}`);

  const byDisp = { represented: 0, 'topic-only': 0, omitted: 0 };
  for (const d of sel.dispositions) if (byDisp[d.disposition] !== undefined) byDisp[d.disposition] += 1;
  return {
    problems, softNotes,
    stats: { inventoryItems: invIds.size, dispositions: sel.dispositions.length, ...byDisp, missing: missing.length },
  };
}

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
      out: `check-map 未能完成（产物无法被校验 —— 这仍是实验数据）：\n${error && error.stack ? error.stack : error}\n`,
      summary: { hard: null, warn: null, info: null, status: 'ERROR（check-map 未能完成）' },
    };
  }
}

/* ------------------------------------------------------------------ *
 * 传输层
 * ------------------------------------------------------------------ */

async function callModel(creds, system, user, maxTokens) {
  const params = {
    temperature: Number(args.temperature),
    max_tokens: Number(maxTokens),
    timeout_ms: Number(args.timeoutMs) || DEFAULTS.timeoutMs,
    max_attempts: Math.max(1, Number(args.maxAttempts) || DEFAULTS.maxAttempts),
  };
  const body = JSON.stringify({
    model: creds.model, temperature: params.temperature, max_tokens: params.max_tokens,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  const started = Date.now();
  let lastError = null;
  for (let attempt = 1; attempt <= params.max_attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), params.timeout_ms);
    let response, text;
    try {
      response = await fetch(`${creds.baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.apiKey}` },
        body, signal: controller.signal,
      });
      text = await response.text();
    } catch (error) {
      clearTimeout(timer);
      const isAbort = error.name === 'AbortError';
      const cause = error.cause ? `（cause: ${error.cause.code || error.cause.message}）` : '';
      lastError = new Error(isAbort ? `请求超时（> ${(params.timeout_ms / 1000).toFixed(0)}s）` : `${error.message}${cause}`);
      if (attempt < params.max_attempts) { await new Promise((r) => setTimeout(r, attempt * 5000)); continue; }
      break;
    }
    clearTimeout(timer);
    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      if (retryable && attempt < params.max_attempts) { await new Promise((r) => setTimeout(r, attempt * 5000)); continue; }
      throw new Error(`HTTP ${response.status}：${text.slice(0, 600)}`);
    }
    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error(`响应不是 JSON：${text.slice(0, 400)}`); }
    const choice = (payload.choices || [])[0] || {};
    return {
      content: (choice.message && choice.message.content) || '',
      usage: payload.usage || null, latencyMs: Date.now() - started,
      finishReason: choice.finish_reason, attempts: attempt, params,
    };
  }
  throw new Error(`连续 ${params.max_attempts} 次传输失败：${lastError ? lastError.message : '未知'}`);
}

/** 离线 stub：与 live 同形（先取 API 信封里的 content）；**永不用于正式 run**。 */
function stubCall(stageKey) {
  const S = stageKey.toUpperCase();
  if (args[`stub${S}TransportError`]) return { error: new Error(`模拟传输层失败：${args[`stub${S}TransportError`]}`) };
  if (args[`stub${S}Http`]) return { error: new Error(`HTTP ${Number(args[`stub${S}Http`])}：模拟网关错误（stub）`) };
  const file = path.resolve(ROOT, String(args[`stub${S}Content`] || ''));
  if (!fs.existsSync(file)) usage(`--stub-${stageKey}-content 文件不存在：${args[`stub${S}Content`]}`);
  const text = fs.readFileSync(file, 'utf8');
  let content = text;
  try {
    const env = JSON.parse(text);
    const c = env && env.choices && env.choices[0] && env.choices[0].message && env.choices[0].message.content;
    if (typeof c === 'string') content = c;
  } catch { /* 不是信封 → 整段当 content */ }
  return { content, usage: null, latencyMs: 1, finishReason: 'stub', attempts: 1, params: { temperature: Number(args.temperature), max_tokens: Number(stageKey === 'a' ? (args.maxTokensA || args.maxTokens || DEFAULTS.maxTokensA) : (args.maxTokensB || args.maxTokens || DEFAULTS.maxTokensB)), timeout_ms: Number(args.timeoutMs) || DEFAULTS.timeoutMs, max_attempts: Math.max(1, Number(args.maxAttempts) || DEFAULTS.maxAttempts) } };
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

function finish(runDir, meta, code) {
  meta.finishedAt = nowIso();
  writeText(path.join(runDir, 'run-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  process.exit(code);
}

/** 增量写 run-meta：**每个阶段结束就落一次盘**。
 *  这样即使进程被 kill（或长 run 中途被打断），已完成阶段的证据也不会失去记录。 */
function saveMeta(runDir, meta) {
  writeText(path.join(runDir, 'run-meta.json'), `${JSON.stringify({ ...meta, savedAt: nowIso() }, null, 2)}\n`);
}

async function main() {
  for (const f of [promptAPath, promptBPath, schemaBPath]) if (!fs.existsSync(f)) usage(`缺少文件：${rel(f)}`);

  const promptA = loadPrompt(promptAPath);
  const promptB = loadPrompt(promptBPath);
  const docText = fs.readFileSync(docPath, 'utf8');
  const headings = headingInfo();
  const stubA = isStubStage('a'), stubB = isStubStage('b');
  const anyStub = stubA || stubB;

  // 凭据 / 用法检查**必须在创建 run 目录之前**（否则被拒绝的调用会留下空目录污染编号）
  const creds = anyStub
    ? { baseURL: '(stub)', apiKey: '(stub)', model: `stub:${String(args.model)}`, provider: 'stub', baseUrlRedacted: '(stub)' }
    : resolveCredentials();

  const runDir = allocateRunDir();
  fs.mkdirSync(runDir, { recursive: true });

  const maxTokensA = Number(args.maxTokensA || args.maxTokens || DEFAULTS.maxTokensA);
  const maxTokensB = Number(args.maxTokensB || args.maxTokens || DEFAULTS.maxTokensB);

  const generationParams = {
    temperature: Number(args.temperature),
    max_tokens_stage_a: maxTokensA,
    max_tokens_stage_b: maxTokensB,
    timeout_ms: Number(args.timeoutMs) || DEFAULTS.timeoutMs,
    max_attempts: Math.max(1, Number(args.maxAttempts) || DEFAULTS.maxAttempts),
  };

  const meta = {
    feature: 'F10-semantic-grounding',
    fixture: fixtureId,
    fixtureLabel: fixture.label,
    runDir: rel(runDir),
    stage,
    mode: anyStub ? 'stub' : 'live',
    provider: creds.provider,
    baseUrl: creds.baseUrlRedacted,
    model: creds.model,
    generationParams,
    documentPath: fixture.doc,
    documentSha256: sha256(docText),
    promptA: { path: rel(promptAPath), sha256: promptA.sha256, fingerprint: promptA.fingerprint },
    promptB: { path: rel(promptBPath), sha256: promptB.sha256, fingerprint: promptB.fingerprint },
    // ── 本轮实验的**冻结条件**（用户要求：逐 run 固定记录）──
    // model / temperature / max_tokens / max_attempts / 两个 prompt hash /
    // 文档 hash / schema 与 contract 版本（hash）/ 校验器 hash
    frozen: {
      model: creds.model,
      generationParams,
      document: { path: fixture.doc, sha256: sha256(docText) },
      promptA: { path: rel(promptAPath), sha256: promptA.sha256 },
      promptB: { path: rel(promptBPath), sha256: promptB.sha256 },
      schemas: {
        semanticInventory: artifactRef(schemaAPath),
        frameworkMap: artifactRef(schemaBPath),
        mapSelection: artifactRef(selectionSchemaPath),
      },
      contract: artifactRef(path.join(ROOT, 'docs', 'framework-map-contract.md')),
      validator: artifactRef(path.join(ROOT, 'scripts', 'check-map.js')),
    },
    startedAt: nowIso(),
    finishedAt: null,
    status: null,
    error: null,
    stages: {
      a: { status: null, attempts: 0, latencyMs: null, finishReason: null, usage: null, protocol: { rawResponseSaved: false, jsonExtracted: false, tempWrite: false, readBackVerified: false, atomicRename: false } },
      b: { status: null, attempts: 0, latencyMs: null, finishReason: null, usage: null, protocol: { rawResponseSaved: false, jsonExtracted: false, tempWrite: false, readBackVerified: false, atomicRename: false, checkMapExecuted: false } },
    },
    repair: 'none', // 两个阶段都从不修改模型输出
    artifactSha256: {},
    integrity: { inventory: null, selection: null },
    validator: null,
  };

  console.log('=== F10 semantic grounding ===');
  console.log(`fixture    ${fixtureId}（${fixture.label}）`);
  console.log(`document   ${fixture.doc}  sha ${meta.documentSha256.slice(0, 12)}`);
  console.log(`stage      ${stage}${anyStub ? '   [STUB —— 不联网，仅验证产物安全与中间态保留]' : ''}`);
  console.log(`provider   ${creds.provider}  ${creds.baseUrlRedacted}`);
  console.log(`model      ${creds.model}`);
  console.log(`promptA    ${promptA.fingerprint} · promptB ${promptB.fingerprint}`);
  console.log(`run dir    ${rel(runDir)}`);
  console.log(`冻结条件   model=${creds.model} temp=${generationParams.temperature} mtA=${generationParams.max_tokens_stage_a} mtB=${generationParams.max_tokens_stage_b} att=${generationParams.max_attempts}`);
  console.log(`           promptA=${promptA.sha256.slice(0, 12)} promptB=${promptB.sha256.slice(0, 12)} doc=${meta.documentSha256.slice(0, 12)}`);
  console.log(`           framework-map.schema=${meta.frozen.schemas.frameworkMap.sha256.slice(0, 12)} contract=${meta.frozen.contract.sha256.slice(0, 12)} check-map=${meta.frozen.validator.sha256.slice(0, 12)}`);

  /* ---------------- inventory 来源 ---------------- */
  let inventory = null, inventoryRelPath = null, inventorySha = null;

  if (stage !== 'b') {
    /* ---------------- Stage A ---------------- */
    const userMessage = promptA.user
      .replace(/\{\{DOC_PATH\}\}/g, fixture.doc)
      .replace(/\{\{HEADING_TREE\}\}/g, headings.text)
      .replace(/\{\{SCHEMA\}\}/g, fs.readFileSync(schemaAPath, 'utf8').trim())
      .replace(/\{\{DOCUMENT_TEXT\}\}/g, docText.trim());

    const recA = {
      stage: 'A', fixture: fixtureId, mode: meta.mode, provider: creds.provider, baseUrl: creds.baseUrlRedacted,
      model: creds.model, generationParams, docPath: fixture.doc, docSha256: meta.documentSha256,
      promptPath: rel(promptAPath), promptSha256: promptA.sha256,
      userMessageSha256: sha256(userMessage), userMessageChars: userMessage.length, startedAt: nowIso(),
    };
    writeText(path.join(runDir, 'request-stage-a.json'), `${JSON.stringify(recA, null, 2)}\n`);

    console.log('\nStage A（semantic inventory）…');
    let resA;
    try {
      resA = stubA ? stubCall('a') : await callModel(creds, promptA.system, userMessage, maxTokensA);
      if (resA.error) throw resA.error;
    } catch (error) {
      meta.stages.a.status = 'transport-failed'; meta.stages.a.error = error.message;
      meta.status = 'stage-a-transport-failed'; meta.error = error.message;
      console.error(`✗ Stage A 失败：${error.message}`);
      finish(runDir, meta, EXIT.FAILED);
    }
    meta.stages.a.attempts = resA.attempts || 1;
    meta.stages.a.latencyMs = resA.latencyMs ?? null;
    meta.stages.a.finishReason = resA.finishReason ?? null;
    meta.stages.a.usage = resA.usage || null;

    writeText(path.join(runDir, 'raw-inventory-response.txt'), resA.content ?? '');
    meta.stages.a.protocol.rawResponseSaved = true;

    let inv;
    try { inv = extractJson(resA.content); } catch (error) {
      meta.stages.a.status = 'parse-failed'; meta.stages.a.error = error.message;
      meta.status = 'stage-a-parse-failed'; meta.error = error.message;
      console.error(`✗ Stage A 解析失败：${error.message}（raw 已保留，不猜测、不修补）`);
      finish(runDir, meta, EXIT.FAILED);
    }
    meta.stages.a.protocol.jsonExtracted = true;

    try {
      writeJsonAtomically(runDir, 'semantic-inventory.json', inv, meta.stages.a.protocol);
    } catch (error) {
      meta.stages.a.status = 'write-protocol-failed'; meta.stages.a.error = error.message;
      meta.status = 'stage-a-write-failed'; meta.error = error.message;
      finish(runDir, meta, EXIT.FAILED);
    }
    inventory = inv;
    inventoryRelPath = `${rel(runDir)}/semantic-inventory.json`;
    inventorySha = sha256(fs.readFileSync(path.join(runDir, 'semantic-inventory.json'), 'utf8'));
    meta.artifactSha256['semantic-inventory.json'] = inventorySha;

    const shape = checkInventoryShape(inv, headings.keys);
    meta.integrity.inventory = {
      blocking: shape.blocking,
      advisory: shape.advisory,
      problems: [...shape.blocking, ...shape.advisory], // 兼容字段：两者都算 integrity FAIL
      itemCount: (inv.items || []).length,
    };
    meta.stages.a.status = shape.blocking.length ? 'shape-invalid'
      : (shape.advisory.length ? 'success-with-format-advisory' : 'success');
    console.log(`Stage A 完成：${(inv.items || []).length} 条语义`
      + `${shape.blocking.length ? `（**阻断性问题 ${shape.blocking.length} 条**）` : ''}`
      + `${shape.advisory.length ? `（格式提示 ${shape.advisory.length} 条，不阻断）` : ''}`
      + `${!shape.blocking.length && !shape.advisory.length ? '（结构合法）' : ''}`);
    saveMeta(runDir, meta); // 增量落盘：即使后面被 kill，Stage A 的证据也有记录

    if (shape.blocking.length) {
      // 规则：**malformed inventory（内容级）不允许进入 Stage B**
      meta.status = 'stage-a-shape-invalid';
      console.error('✗ Stage A 产物内容不合法 → **不进入 Stage B**（产物原样保留，不修补）');
      shape.blocking.slice(0, 8).forEach((p) => console.error(`    · ${p}`));
      finish(runDir, meta, EXIT.RECORDED_WITH_FAIL);
    }
    if (shape.advisory.length) {
      console.log('格式提示（记为 integrity FAIL，但**允许进入 Stage B** —— 否则一个后缀会抹掉整个 run 的归因数据）：');
      shape.advisory.slice(0, 8).forEach((p) => console.log(`    ~ ${p}`));
    }
    if (stage === 'a') { meta.status = 'stage-a-only'; console.log('\n--stage a：到此为止（inv 已冻结）'); finish(runDir, meta, EXIT.CLEAN); }
  } else {
    /* ---------------- --stage b：复用已冻结的 inventory ---------------- */
    const invPath = path.resolve(ROOT, String(args.inventory));
    if (!fs.existsSync(invPath)) usage(`--inventory 不存在：${args.inventory}`);
    inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
    inventoryRelPath = rel(invPath);
    inventorySha = sha256(fs.readFileSync(invPath, 'utf8'));
    const shape = checkInventoryShape(inventory, headings.keys);
    meta.integrity.inventory = {
      blocking: shape.blocking, advisory: shape.advisory,
      problems: [...shape.blocking, ...shape.advisory],
      itemCount: (inventory.items || []).length, reusedFrom: inventoryRelPath, sha256: inventorySha,
    };
    console.log(`\n复用 inventory：${inventoryRelPath}（${(inventory.items || []).length} 条）`);
    saveMeta(runDir, meta);
    if (shape.blocking.length) { meta.status = 'stage-a-shape-invalid'; finish(runDir, meta, EXIT.RECORDED_WITH_FAIL); }
  }

  /* ---------------- Stage B ---------------- */
  // ⚠️ **Stage B 不注入原文**（用户裁决）：输入只有 inventory + heading tree + 两份 schema。
  //    理由：①同一篇文档不再输入两遍；②更关键 —— 若 Stage B 能重读原文，
  //    就无法判断一条语义是在 Extraction 丢的还是在 Selection 丢的。
  const userMessageB = promptB.user
    .replace(/\{\{DOC_PATH\}\}/g, fixture.doc)
    .replace(/\{\{HEADING_TREE\}\}/g, headings.text)
    .replace(/\{\{INVENTORY\}\}/g, JSON.stringify(inventory, null, 2))
    .replace(/\{\{SCHEMA\}\}/g, fs.readFileSync(schemaBPath, 'utf8').trim())
    .replace(/\{\{SELECTION_SCHEMA\}\}/g, fs.readFileSync(selectionSchemaPath, 'utf8').trim());

  const recB = {
    stage: 'B', fixture: fixtureId, mode: meta.mode, provider: creds.provider, baseUrl: creds.baseUrlRedacted,
    model: creds.model, generationParams, docPath: fixture.doc, docSha256: meta.documentSha256,
    promptPath: rel(promptBPath), promptSha256: promptB.sha256,
    userMessageSha256: sha256(userMessageB), userMessageChars: userMessageB.length,
    inventoryPath: inventoryRelPath, inventorySha256: inventorySha, startedAt: nowIso(),
  };
  writeText(path.join(runDir, 'request-stage-b.json'), `${JSON.stringify(recB, null, 2)}\n`);

  console.log('\nStage B（framework map synthesis）…');
  let resB;
  try {
    resB = stubB ? stubCall('b') : await callModel(creds, promptB.system, userMessageB, maxTokensB);
    if (resB.error) throw resB.error;
  } catch (error) {
    meta.stages.b.status = 'transport-failed'; meta.stages.b.error = error.message;
    meta.status = 'stage-b-transport-failed'; meta.error = error.message;
    console.error(`✗ Stage B 失败：${error.message}`);
    console.error(`  产物安全：semantic-inventory.json **已保留**（Stage A 的证据不受影响）`);
    finish(runDir, meta, EXIT.FAILED);
  }
  meta.stages.b.attempts = resB.attempts || 1;
  meta.stages.b.latencyMs = resB.latencyMs ?? null;
  meta.stages.b.finishReason = resB.finishReason ?? null;
  meta.stages.b.usage = resB.usage || null;

  writeText(path.join(runDir, 'raw-synthesis-response.txt'), resB.content ?? '');
  meta.stages.b.protocol.rawResponseSaved = true;

  let blocks;
  try { blocks = splitTwoBlocks(resB.content); } catch (error) {
    meta.stages.b.status = 'parse-failed'; meta.stages.b.error = error.message;
    meta.status = 'stage-b-parse-failed'; meta.error = error.message;
    console.error(`✗ Stage B 解析失败：${error.message}`);
    console.error('  raw-synthesis-response.txt 与 semantic-inventory.json **都已保留**；不补第二个产物。');
    finish(runDir, meta, EXIT.FAILED);
  }
  meta.stages.b.protocol.jsonExtracted = true;

  try {
    writeJsonAtomically(runDir, 'framework-map.json', blocks.map, meta.stages.b.protocol);
    writeJsonAtomically(runDir, 'map-selection.json', blocks.selection, meta.stages.b.protocol);
  } catch (error) {
    meta.stages.b.status = 'write-protocol-failed'; meta.stages.b.error = error.message;
    meta.status = 'stage-b-write-failed'; meta.error = error.message;
    finish(runDir, meta, EXIT.FAILED);
  }
  meta.artifactSha256['framework-map.json'] = sha256(fs.readFileSync(path.join(runDir, 'framework-map.json'), 'utf8'));
  meta.artifactSha256['map-selection.json'] = sha256(fs.readFileSync(path.join(runDir, 'map-selection.json'), 'utf8'));

  const v = runValidator(blocks.map, `${rel(runDir)}/framework-map.json`);
  writeText(path.join(runDir, 'check-map.txt'), v.out);
  meta.stages.b.protocol.checkMapExecuted = true;
  meta.validator = { exitCode: v.exitCode, ...v.summary };

  const integrity = checkSelectionIntegrity(blocks.selection, inventory, blocks.map);
  meta.integrity.selection = integrity;

  const integrityFail = (meta.integrity.inventory.problems || []).length + integrity.problems.length > 0;
  meta.stages.b.status = integrityFail ? 'success-integrity-fail' : 'success';
  meta.status = v.exitCode !== 0 ? 'success-validator-fail' : (integrityFail ? 'success-integrity-fail' : 'success');

  console.log(`validator  ${meta.validator.status}（HARD ${meta.validator.hard} · WARN ${meta.validator.warn} · INFO ${meta.validator.info}）`);
  console.log(`selection  ${JSON.stringify(integrity.stats)}`);
  if (integrityFail) {
    console.log('⚠️ integrity FAIL（产物**原样保留**，不自动补）：');
    [...(meta.integrity.inventory.problems || []), ...integrity.problems].slice(0, 12).forEach((p) => console.log(`    · ${p}`));
  }
  if (integrity.softNotes.length) {
    console.log('audit 提示（非失败）：');
    integrity.softNotes.slice(0, 8).forEach((p) => console.log(`    ~ ${p}`));
  }
  finish(runDir, meta, (v.exitCode !== 0 || integrityFail) ? EXIT.RECORDED_WITH_FAIL : EXIT.CLEAN);
}

main().catch((error) => {
  console.error(`✗ 未捕获错误：${error && error.stack ? error.stack : error}`);
  process.exit(EXIT.FAILED);
});
