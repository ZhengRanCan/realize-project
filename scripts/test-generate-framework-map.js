#!/usr/bin/env node
'use strict';

/**
 * Feature 07 · Gateway / 产物安全验证（**离线，零模型调用**）
 *
 * 目的：在第一次正式 AI run 之前，证明"失败不会覆盖既有产物"这条规则真的成立。
 * 手法：用 stub 注入四类失败，检查每个 run 目录的产物状态，并核对**上一份成功产物字节不变**。
 *
 * 用法：node scripts/test-generate-framework-map.js
 * 退出码：0 = 全部通过；1 = 有断言失败
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const GENERATOR = path.join(ROOT, 'scripts', 'generate-framework-map.js');
const SANDBOX = path.join(ROOT, 'tmp', 'gateway-safety-selftest');
const FIXTURE_D = '测试文档/fixture-d-goal-plan-task-state-model.md';

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const exists = (f) => fs.existsSync(f);
const results = [];
let failures = 0;

function check(name, fn) {
  try {
    const msg = fn();
    if (msg === true || msg === undefined) results.push(`  PASS  ${name}`);
    else { failures += 1; results.push(`  FAIL  ${name} → ${msg}`); }
  } catch (e) {
    failures += 1;
    results.push(`  FAIL  ${name} → throw: ${e.message}`);
  }
}

/* ------------------------------------------------------------------ *
 * 准备：清空沙箱 + 生成两个 stub 载荷
 * ------------------------------------------------------------------ */

fs.rmSync(SANDBOX, { recursive: true, force: true });
fs.mkdirSync(SANDBOX, { recursive: true });

/** 用当前文档的 heading tree 构造一份**能通过** check-map 的最小 map。 */
function buildPassPayload() {
  const { readDocHeadings } = require('./check-map.js');
  const h = readDocHeadings(FIXTURE_D);
  const top = h.top.map((k) => `§${k}`);
  return {
    mapVersion: 2,
    level: 'L0',
    document: {
      id: 'STUB-D', title: 'stub（离线安全验证用）', sourcePath: FIXTURE_D, role: 'target',
      scope: { text: 'stub scope', sectionRefs: [top[0]] },
    },
    elements: [
      { id: 'E-01', label: 'Goal', type: 'artifact', role: 'input', topics: ['T-01'], sectionRefs: [top[0], top[1]] },
      { id: 'E-02', label: 'Plan', type: 'artifact', role: 'intermediate', topics: ['T-01'], sectionRefs: [top[2], top[3]] },
    ],
    edges: [{
      id: 'R-01', from: 'E-02', to: 'E-01', type: 'depends-on', label: 'stub',
      qualifiers: { cardinality: { from: 'one-or-many', to: 'one' }, ownership: 'owned' },
    }],
    attachments: [],
    topics: [{ id: 'T-01', title: 'stub topic', proposition: 'stub', sectionRefs: top }],
    meta: { validationGranularity: 'section (provisional)' },
  };
}

const passPayload = buildPassPayload();
const hardFailPayload = JSON.parse(JSON.stringify(passPayload));
// 表外关系词 —— 正是 AI 为了"消灭 gap"最可能发明的东西（acyclic-depends-on）
hardFailPayload.edges[0].type = 'acyclic-depends-on';

const wrap = (content) => JSON.stringify({
  choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
});

const passFile = path.join(SANDBOX, 'content-pass.json');
const hardFailFile = path.join(SANDBOX, 'content-hard-fail.json');
const notJsonFile = path.join(SANDBOX, 'content-not-json.txt');
const garbageFile = path.join(SANDBOX, 'content-garbage.json');
fs.writeFileSync(passFile, wrap(JSON.stringify(passPayload)), 'utf8');
fs.writeFileSync(hardFailFile, wrap(JSON.stringify(hardFailPayload)), 'utf8');
fs.writeFileSync(notJsonFile, '我不打算返回 JSON，我只想写一段散文。'.repeat(3), 'utf8');
// AI 返回了一个合法 JSON 对象，但它根本不是一张 map（例如把 schema 当成了输出）
fs.writeFileSync(garbageFile, wrap(JSON.stringify({ note: '我理解了，但我不打算按契约输出。' })), 'utf8');

/* ------------------------------------------------------------------ *
 * 运行器
 * ------------------------------------------------------------------ */

function runGen(args) {
  // stdio: 'ignore' —— 不依赖管道（受限沙箱下管道可能不可用）；
  // 断言全部读产物文件，不读 stdout。
  const r = spawnSync(process.execPath, [GENERATOR, ...args], { cwd: ROOT, stdio: 'ignore' });
  return r.status;
}

const runDir = (n) => path.join(SANDBOX, 'fixture-d', `run-${String(n).padStart(2, '0')}`);
const metaOf = (n) => JSON.parse(fs.readFileSync(path.join(runDir(n), 'run-meta.json'), 'utf8'));
const baseArgs = ['--fixture', 'd', '--out', path.relative(ROOT, SANDBOX).replace(/\\/g, '/')];

console.log('===== F07 Gateway / 产物安全验证（离线，零模型调用）=====');
console.log(`沙箱: ${path.relative(ROOT, SANDBOX).replace(/\\/g, '/')}`);
console.log('');

/* --- 1. 成功运行 ------------------------------------------------- */
const code1 = runGen([...baseArgs, '--stub-content', path.relative(ROOT, passFile).replace(/\\/g, '/')]);
const passSha = sha(path.join(runDir(1), 'framework-map.json'));

check('run-01（stub 成功）退出码 = 0', () => code1 === 0 || `收到 ${code1}`);
check('run-01 五个产物齐全', () => {
  const want = ['request.json', 'raw-response.txt', 'framework-map.json', 'check-map.txt', 'run-meta.json'];
  const missing = want.filter((f) => !exists(path.join(runDir(1), f)));
  return missing.length === 0 || `缺: ${missing.join(', ')}`;
});
check('run-01 validator PASS（HARD 0）', () => {
  const m = metaOf(1);
  return (m.validator.hard === 0 && m.validator.status === 'PASS') || JSON.stringify(m.validator);
});
check('run-01 成功写入协议全部走完', () => {
  const p = metaOf(1).protocol;
  const want = ['rawResponseSaved', 'jsonExtracted', 'tempWrite', 'readBackVerified', 'atomicRename', 'checkMapExecuted'];
  const missing = want.filter((k) => p[k] !== true);
  return missing.length === 0 || `未完成: ${missing.join(', ')}`;
});
check('run-01 没有 .tmp.json 残留（原子 rename 成功）', () => {
  const leftovers = fs.readdirSync(runDir(1)).filter((f) => f.includes('.tmp'));
  return leftovers.length === 0 || leftovers.join(', ');
});
check('run-01 记录 repair = none（生成器从不修改 AI 输出）', () => metaOf(1).repair === 'none' || metaOf(1).repair);
check('run-01 产出的 map 与 AI 返回内容逐字节一致（无自动修补）', () => {
  const written = fs.readFileSync(path.join(runDir(1), 'framework-map.json'), 'utf8');
  // raw-response.txt = AI 返回的 content 原文（未清洗）；framework-map.json 必须只是它的格式化版本
  const raw = fs.readFileSync(path.join(runDir(1), 'raw-response.txt'), 'utf8');
  if (written !== `${JSON.stringify(JSON.parse(raw), null, 2)}\n`) return '写入内容与 raw response 不一致';
  if (JSON.stringify(JSON.parse(written)) !== JSON.stringify(passPayload)) return '产物与 stub 载荷不一致 → 发生了修补/改写';
  return true;
});

/* --- 2. validator FAIL 的产物必须保留 ---------------------------- */
const code2 = runGen([...baseArgs, '--stub-content', path.relative(ROOT, hardFailFile).replace(/\\/g, '/')]);
check('run-02（validator FAIL）退出码 = 1', () => code2 === 1 || `收到 ${code2}`);
check('run-02 仍然保留了 framework-map.json（FAIL 是数据，不是垃圾）', () => exists(path.join(runDir(2), 'framework-map.json')));
check('run-02 check-map.txt 记录了 HARD', () => {
  const t = fs.readFileSync(path.join(runDir(2), 'check-map.txt'), 'utf8');
  return /HARD ERROR \([1-9]/.test(t) || t.slice(0, 200);
});
check('run-02 run-meta 状态 = success-validator-fail', () => metaOf(2).status === 'success-validator-fail' || metaOf(2).status);
check('run-02 记录了产物 sha（可追溯）', () => !!metaOf(2).artifactSha256['framework-map.json']);

/* --- 3. HTTP 503 不能覆盖上一份成功产物 ------------------------- */
const code3 = runGen([...baseArgs, '--stub-http', '503']);
check('run-03（HTTP 503）退出码 = 2', () => code3 === 2 || `收到 ${code3}`);
check('run-03 没有 framework-map.json', () => !exists(path.join(runDir(3), 'framework-map.json')));
check('run-03 保留了 request.json 与 run-meta.json（失败也要留档）', () => exists(path.join(runDir(3), 'request.json')) && exists(path.join(runDir(3), 'run-meta.json')));
check('run-03 run-meta 记录了错误信息', () => !!metaOf(3).error);
check('★ run-01 的成功产物字节未变（503 没有覆盖它）', () => sha(path.join(runDir(1), 'framework-map.json')) === passSha || 'sha 变了 → 产物被覆盖');

/* --- 4. 传输层失败同上 ------------------------------------------ */
const code4 = runGen([...baseArgs, '--stub-transport-error', 'ECONNRESET']);
check('run-04（传输层失败）退出码 = 2', () => code4 === 2 || `收到 ${code4}`);
check('run-04 没有 framework-map.json', () => !exists(path.join(runDir(4), 'framework-map.json')));
check('★ run-01 的成功产物字节未变（传输失败没有覆盖它）', () => sha(path.join(runDir(1), 'framework-map.json')) === passSha || 'sha 变了 → 产物被覆盖');

/* --- 5. 返回非 JSON：保留原文，不猜测、不修补 -------------------- */
const code5 = runGen([...baseArgs, '--stub-content', path.relative(ROOT, notJsonFile).replace(/\\/g, '/')]);
check('run-05（返回非 JSON）退出码 = 2', () => code5 === 2 || `收到 ${code5}`);
check('run-05 保留了 raw-response.txt', () => exists(path.join(runDir(5), 'raw-response.txt')));
check('run-05 没有 framework-map.json（不做猜测式修补）', () => !exists(path.join(runDir(5), 'framework-map.json')));
check('run-05 run-meta 状态 = parse-failed', () => metaOf(5).status === 'parse-failed' || metaOf(5).status);
check('★ run-01 的成功产物字节未变', () => sha(path.join(runDir(1), 'framework-map.json')) === passSha || 'sha 变了 → 产物被覆盖');

/* --- 6. 返回合法 JSON 但不是一张 map：结构不可校验，产物仍保留 ------ */
const code6 = runGen([...baseArgs, '--stub-content', path.relative(ROOT, garbageFile).replace(/\\/g, '/')]);
check('run-06（合法 JSON 但不是 map）退出码 = 1', () => code6 === 1 || `收到 ${code6}`);
check('run-06 仍然保留了 framework-map.json（结构不成立也是数据）', () => exists(path.join(runDir(6), 'framework-map.json')));
check('run-06 check-map.txt 明确说明"结构不可校验"且不崩溃', () => {
  const t = fs.readFileSync(path.join(runDir(6), 'check-map.txt'), 'utf8');
  return (/结构不可校验/.test(t) && /document/.test(t)) || t.slice(0, 200);
});
check('★ run-01 的成功产物字节未变', () => sha(path.join(runDir(1), 'framework-map.json')) === passSha || 'sha 变了 → 产物被覆盖');

/* --- 7. 拒绝覆盖已存在的 run 目录 -------------------------------- */
const code7 = runGen([...baseArgs, '--run', '1', '--stub-content', path.relative(ROOT, passFile).replace(/\\/g, '/')]);
check('run-01 重跑（--run 1）被拒绝，退出码 = 3', () => code7 === 3 || `收到 ${code7}`);
check('★ 被拒绝后 run-01 的产物仍然字节未变', () => sha(path.join(runDir(1), 'framework-map.json')) === passSha || 'sha 变了');
check('被拒绝的 run 没有产生 .tmp.json', () => {
  const leftovers = fs.readdirSync(runDir(1)).filter((f) => f.includes('.tmp'));
  return leftovers.length === 0 || leftovers.join(', ');
});

/* --- 8. 自动编号不会复用已有目录 -------------------------------- */
check('六个 run 分别落在 run-01 … run-06（各自独立目录；被拒绝那次未建目录）', () => {
  const dirs = fs.readdirSync(path.join(SANDBOX, 'fixture-d')).sort();
  return dirs.join(',') === 'run-01,run-02,run-03,run-04,run-05,run-06' || dirs.join(',');
});

/* ------------------------------------------------------------------ */

console.log(results.join('\n'));
console.log('');
console.log('════════════════════════════════');
console.log(`Gateway 安全验证: ${results.length - failures}/${results.length} 通过`);
if (failures) console.log(`✗ ${failures} 项失败`);
else console.log('✓ 结论：失败请求不会覆盖任何既有产物；validator FAIL 的产物被完整保留；全程无自动修补');
console.log('注：本轮全部为 stub 注入，**零模型调用**。正式 run 见 execution-prompt.md Phase 2。');
console.log('════════════════════════════════');
process.exit(failures ? 1 : 0);
