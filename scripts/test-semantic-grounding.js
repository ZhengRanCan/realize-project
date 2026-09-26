#!/usr/bin/env node
'use strict';

/**
 * Feature 10 · 两阶段产物安全 + 中间态保留验证（**离线，零模型调用**）
 *
 * 本 Feature 最大的新价值是"中间态是实验数据" —— Stage B 失败**不能**把 Stage A 的证据弄没。
 * 所以除了沿用 F07 的失败注入，这里必须故意打两阶段**中间失败**：
 *
 *   A ok + B HTTP 503        → Inventory 必须保留
 *   A ok + B parse fail      → Inventory + B raw 必须保留
 *   A malformed inventory    → 不允许进入 Stage B
 *   A ok + B selection 少一条 → map/selection 原样保留 + integrity FAIL + 不自动补
 *   A ok + B selection 指向不存在 element → 原样保留 + integrity FAIL
 *
 * 用法：node scripts/test-semantic-grounding.js
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNNER = path.join(ROOT, 'scripts', 'run-semantic-grounding.js');
const SANDBOX = path.join(ROOT, 'tmp', 'f10-selftest');
const FIXTURE = 'e';
const DOC = '测试文档/fixture-e-f13-f16-runbook.md';

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const exists = (f) => fs.existsSync(f);
const results = [];
let failures = 0;

function check(name, fn) {
  try {
    const msg = fn();
    if (msg === true || msg === undefined) results.push(`  PASS  ${name}`);
    else { failures += 1; results.push(`  FAIL  ${name} → ${msg}`); }
  } catch (e) { failures += 1; results.push(`  FAIL  ${name} → throw: ${e.message}`); }
}

fs.rmSync(SANDBOX, { recursive: true, force: true });
fs.mkdirSync(SANDBOX, { recursive: true });

/* ------------------------------------------------------------------ *
 * 载荷构造：用真实 heading key，保证 §key 可解析
 * ------------------------------------------------------------------ */

const { readDocHeadings } = require('./check-map.js');
const top = readDocHeadings(DOC).top.map((k) => `§${k}`);

const invBase = () => ({
  inventoryVersion: 1,
  document: { title: 'stub', sourcePath: DOC, role: 'target' },
  items: [
    { id: 'S-01', statement: '退款查询失败时不得直接判定为成功。', tag: '失败', sources: [{ sectionRef: top[1], lines: 'L1', quote: 'stub' }] },
    { id: 'S-02', statement: '连续 10 次查单失败后订单进入 REFUND_FAILED。', tag: '阈值', sources: [{ sectionRef: top[2], lines: 'L418', quote: 'stub' }] },
    { id: 'S-03', statement: '强制补偿只能由管理员执行。', tag: '权限', sources: [{ sectionRef: top[3], lines: 'L319', quote: 'stub' }] },
  ],
});

const mapBase = () => ({
  mapVersion: 2, level: 'L0',
  document: { id: 'STUB-E', title: 'stub', sourcePath: DOC, role: 'target', scope: { text: 'scope', sectionRefs: [top[0]] } },
  elements: [
    { id: 'E-01', label: '订单', type: 'artifact', role: 'intermediate', topics: ['T-01'], sectionRefs: [top[1]] },
    { id: 'E-02', label: '退款流程', type: 'process', role: 'producer', topics: ['T-01'], sectionRefs: [top[2]] },
    { id: 'C-01', label: '约束：连续 10 次失败置 REFUND_FAILED', type: 'constraint', role: 'boundary', topics: ['T-01'], sectionRefs: [top[2]] },
  ],
  edges: [{ id: 'R-01', from: 'E-02', to: 'E-01', type: 'produces', qualifiers: { cardinality: { from: 'one', to: 'one-or-many' }, ownership: 'owned' } }],
  attachments: [{ elementId: 'C-01', attachedTo: ['E-01'] }],
  topics: [{ id: 'T-01', title: 'stub topic', proposition: 'stub', sectionRefs: top }],
  meta: { validationGranularity: 'section (provisional)' },
});

const selBase = () => ({
  selectionVersion: 1,
  document: { title: 'stub', sourcePath: DOC },
  inventoryRef: { path: 'stub/semantic-inventory.json', sha256: 'a'.repeat(64), itemCount: 3 },
  dispositions: [
    { semanticId: 'S-01', disposition: 'represented', target: { kind: 'element', id: 'E-01' }, reason: '失败路径由订单节点承载' },
    { semanticId: 'S-02', disposition: 'represented', target: { kind: 'constraint', id: 'C-01' }, reason: '有界失败规则作为 constraint' },
    { semanticId: 'S-03', disposition: 'represented', target: { kind: 'edge', id: 'R-01' }, reason: '权限边界挂在退款流程到订单的边上' },
  ],
});

const block = (map, sel) => `<<<FRAMEWORK_MAP>>>\n${JSON.stringify(map)}\n<<<MAP_SELECTION>>>\n${JSON.stringify(sel)}\n`;
const wrap = (c) => JSON.stringify({ choices: [{ message: { content: c }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1 } });

const files = {};
const w = (name, content) => { const p = path.join(SANDBOX, name); fs.writeFileSync(p, content, 'utf8'); files[name] = path.relative(ROOT, p).replace(/\\/g, '/'); return files[name]; };

w('inv-ok.json', wrap(JSON.stringify(invBase())));
w('inv-malformed.json', wrap(JSON.stringify({ inventoryVersion: 1, document: { title: 'x', sourcePath: DOC } }))); // 缺 items
w('inv-dup.json', wrap(JSON.stringify((() => { const v = invBase(); v.items[1].id = 'S-01'; return v; })())));
w('inv-not-json.txt', '这不是 JSON，我拒绝按契约输出。'.repeat(3));
w('b-ok.txt', block(mapBase(), selBase()));
w('b-missing.txt', block(mapBase(), (() => { const s = selBase(); s.dispositions.pop(); return s; })()));
w('b-badtarget.txt', block(mapBase(), (() => { const s = selBase(); s.dispositions[0].target = { kind: 'element', id: 'E-99' }; return s; })()));
w('b-kindmismatch.txt', block(mapBase(), (() => { const s = selBase(); s.dispositions[1].target = { kind: 'constraint', id: 'E-01' }; return s; })()));
w('b-oneblock.txt', `<<<FRAMEWORK_MAP>>>\n${JSON.stringify(mapBase())}\n`); // 缺第二个块
w('b-not-json.txt', '我只想写一段散文。'.repeat(3));

/* ------------------------------------------------------------------ *
 * 运行器
 * ------------------------------------------------------------------ */

function run(args) {
  const r = spawnSync(process.execPath, [RUNNER, '--fixture', FIXTURE, '--out', path.relative(ROOT, SANDBOX).replace(/\\/g, '/'), ...args],
    { cwd: ROOT, stdio: 'ignore' });
  return r.status;
}
const runDir = (n) => path.join(SANDBOX, `fixture-${FIXTURE}`, `run-${String(n).padStart(2, '0')}`);
const metaOf = (n) => JSON.parse(fs.readFileSync(path.join(runDir(n), 'run-meta.json'), 'utf8'));
const A = (n, f) => path.join(runDir(n), f);

console.log('===== F10 · 两阶段产物安全 + 中间态保留验证（离线，零模型调用）=====');
console.log(`沙箱: ${path.relative(ROOT, SANDBOX).replace(/\\/g, '/')}`);
console.log('');

/* --- 1. 两阶段都成功 ------------------------------------------------- */
const c1 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-ok.txt']]);
const goodMapSha = sha(A(1, 'framework-map.json'));
check('run-01（A/B 都成功）退出码 = 0', () => c1 === 0 || `收到 ${c1}`);
check('run-01 产物齐全（两阶段 9 件）', () => {
  const want = ['request-stage-a.json', 'raw-inventory-response.txt', 'semantic-inventory.json',
    'request-stage-b.json', 'raw-synthesis-response.txt', 'framework-map.json', 'map-selection.json',
    'check-map.txt', 'run-meta.json'];
  const missing = want.filter((f) => !exists(A(1, f)));
  return missing.length === 0 || `缺: ${missing.join(', ')}`;
});
check('run-01 check-map PASS（HARD 0）', () => metaOf(1).validator.hard === 0 || JSON.stringify(metaOf(1).validator));
check('run-01 integrity 干净（覆盖 3/3）', () => {
  const s = metaOf(1).integrity.selection;
  return (s.problems.length === 0 && s.stats.dispositions === 3 && s.stats.missing === 0) || JSON.stringify(s);
});
check('run-01 无 .tmp.json 残留', () => fs.readdirSync(runDir(1)).filter((f) => f.includes('.tmp')).length === 0);
check('run-01 repair = none', () => metaOf(1).repair === 'none');
check('run-01 两个产物与 raw 逐字节等价（无修补）', () => {
  const DL = '<<<FRAMEWORK_MAP>>>'.length;
  const DS = '<<<MAP_SELECTION>>>'.length;
  const raw = fs.readFileSync(A(1, 'raw-synthesis-response.txt'), 'utf8');
  const i = raw.indexOf('<<<FRAMEWORK_MAP>>>'); const j = raw.indexOf('<<<MAP_SELECTION>>>');
  const wantMap = `${JSON.stringify(JSON.parse(raw.slice(i + DL, j)), null, 2)}\n`;
  const wantSel = `${JSON.stringify(JSON.parse(raw.slice(j + DS)), null, 2)}\n`;
  if (fs.readFileSync(A(1, 'framework-map.json'), 'utf8') !== wantMap) return 'framework-map 被改写';
  if (fs.readFileSync(A(1, 'map-selection.json'), 'utf8') !== wantSel) return 'map-selection 被改写';
  return true;
});

/* --- 2. ★ A 成功 + B HTTP 503：Inventory 必须保留 -------------------- */
const c2 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-http', '503']);
check('run-02（A ok / B 503）退出码 = 2', () => c2 === 2 || `收到 ${c2}`);
check('★ run-02 的 semantic-inventory.json **保留**', () => exists(A(2, 'semantic-inventory.json')));
check('★ run-02 的 Stage A raw 也保留', () => exists(A(2, 'raw-inventory-response.txt')));
check('run-02 没有 framework-map.json / map-selection.json', () => !exists(A(2, 'framework-map.json')) && !exists(A(2, 'map-selection.json')));
check('run-02 run-meta 记 stage B transport-failed', () => metaOf(2).status === 'stage-b-transport-failed' || metaOf(2).status);
check('★ run-01 的成功产物字节未变', () => sha(A(1, 'framework-map.json')) === goodMapSha);

/* --- 3. ★ A 成功 + B 解析失败：Inventory + B raw 必须保留 ------------- */
const c3 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-not-json.txt']]);
check('run-03（A ok / B parse fail）退出码 = 2', () => c3 === 2 || `收到 ${c3}`);
check('★ run-03 保留 semantic-inventory.json', () => exists(A(3, 'semantic-inventory.json')));
check('★ run-03 保留 raw-synthesis-response.txt', () => exists(A(3, 'raw-synthesis-response.txt')));
check('run-03 没有 framework-map.json（不猜、不补）', () => !exists(A(3, 'framework-map.json')));
check('★ run-01 产物仍未被触碰', () => sha(A(1, 'framework-map.json')) === goodMapSha);

/* --- 4. ★ B 只返回一个块（缺 selection）→ 不产生任何最终产物 -------- */
const c4 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-oneblock.txt']]);
check('run-04（B 缺第二个块）退出码 = 2', () => c4 === 2 || `收到 ${c4}`);
check('run-04 连 framework-map.json 也不产生（两产物同生共死）', () => !exists(A(4, 'framework-map.json')) && !exists(A(4, 'map-selection.json')));
check('run-04 保留 B raw 与 inventory', () => exists(A(4, 'raw-synthesis-response.txt')) && exists(A(4, 'semantic-inventory.json')));

/* --- 5. ★ A 产出 malformed inventory → 不允许进入 Stage B ------------- */
const c5 = run(['--stub-a-content', files['inv-malformed.json'], '--stub-b-content', files['b-ok.txt']]);
check('run-05（A malformed）退出码 = 1', () => c5 === 1 || `收到 ${c5}`);
check('★ run-05 没有进入 Stage B（无 B request / raw / map）', () => !exists(A(5, 'request-stage-b.json')) && !exists(A(5, 'framework-map.json')));
check('run-05 保留 malformed inventory 本身（仍是证据）', () => exists(A(5, 'semantic-inventory.json')));
check('run-05 run-meta 记 stage-a-shape-invalid + 具体问题', () => {
  const m = metaOf(5);
  return (m.status === 'stage-a-shape-invalid' && m.integrity.inventory.problems.length > 0) || JSON.stringify(m.integrity.inventory);
});

/* --- 6. ★ duplicate id → 同样不进 Stage B ---------------------------- */
const c6 = run(['--stub-a-content', files['inv-dup.json'], '--stub-b-content', files['b-ok.txt']]);
check('run-06（inventory duplicate id）退出码 = 1', () => c6 === 1 || `收到 ${c6}`);
check('run-06 报 duplicate id 且不进 Stage B', () => {
  const m = metaOf(6);
  const ok = m.integrity.inventory.problems.some((p) => /duplicate id/.test(p));
  return (ok && !exists(A(6, 'framework-map.json'))) || JSON.stringify(m.integrity.inventory.problems);
});

/* --- 7. ★ selection 少一条 → 产物保留 + integrity FAIL + 不自动补 ----- */
const c7 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-missing.txt']]);
check('run-07（selection 少一条）退出码 = 1', () => c7 === 1 || `收到 ${c7}`);
check('★ run-07 产物原样保留（map + selection 都在）', () => exists(A(7, 'framework-map.json')) && exists(A(7, 'map-selection.json')));
check('★ run-07 integrity 报「漏掉 N 条」且**没有自动补**', () => {
  const m = metaOf(7);
  const sel = JSON.parse(fs.readFileSync(A(7, 'map-selection.json'), 'utf8'));
  const reported = m.integrity.selection.problems.some((p) => /selection 漏掉/.test(p));
  return (reported && sel.dispositions.length === 2) || `dispositions=${sel.dispositions.length} problems=${JSON.stringify(m.integrity.selection.problems)}`;
});
check('run-07 run-meta status = success-integrity-fail', () => metaOf(7).status === 'success-integrity-fail' || metaOf(7).status);

/* --- 8. ★ selection 指向不存在的 element → integrity FAIL ------------- */
const c8 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-badtarget.txt']]);
check('run-08（target 指向不存在 element）退出码 = 1', () => c8 === 1 || `收到 ${c8}`);
check('★ run-08 报「指向不存在的 element」且产物保留', () => {
  const m = metaOf(8);
  const ok = m.integrity.selection.problems.some((p) => /不存在的 element/.test(p));
  return (ok && exists(A(8, 'framework-map.json'))) || JSON.stringify(m.integrity.selection.problems);
});

/* --- 9. ★ kind 与真实 type 不符（声称 constraint 但指向 artifact）---- */
const c9 = run(['--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-kindmismatch.txt']]);
check('run-09（kind=constraint 指向非 constraint）退出码 = 1', () => c9 === 1 || `收到 ${c9}`);
check('★ run-09 报「声称 constraint 但 type 是 artifact」', () => {
  const p = metaOf(9).integrity.selection.problems;
  return p.some((x) => /声称 constraint/.test(x)) || JSON.stringify(p);
});

/* --- 10. A 解析失败 / 传输失败 --------------------------------------- */
const c10 = run(['--stub-a-content', files['inv-not-json.txt']]);
check('run-10（A 非 JSON）退出码 = 2', () => c10 === 2 || `收到 ${c10}`);
check('run-10 保留 A raw、无 inventory、无 Stage B', () => exists(A(10, 'raw-inventory-response.txt')) && !exists(A(10, 'semantic-inventory.json')) && !exists(A(10, 'request-stage-b.json')));
const c11 = run(['--stub-a-transport-error', 'ECONNRESET']);
check('run-11（A 传输失败）退出码 = 2', () => c11 === 2 || `收到 ${c11}`);
check('run-11 只有 request / meta，无 inventory', () => exists(A(11, 'request-stage-a.json')) && !exists(A(11, 'semantic-inventory.json')));

/* --- 12. --stage a 单独跑 ------------------------------------------- */
const c12 = run(['--stage', 'a', '--stub-a-content', files['inv-ok.json']]);
check('run-12（--stage a）退出码 = 0', () => c12 === 0 || `收到 ${c12}`);
check('run-12 有 inventory，没有 Stage B 任何产物', () => exists(A(12, 'semantic-inventory.json')) && !exists(A(12, 'request-stage-b.json')) && !exists(A(12, 'check-map.txt')));
check('run-12 run-meta status = stage-a-only', () => metaOf(12).status === 'stage-a-only' || metaOf(12).status);

/* --- 13. --stage b 复用已冻结的 inventory --------------------------- */
const c13 = run(['--stage', 'b', '--inventory', `${path.relative(ROOT, SANDBOX).replace(/\\/g, '/')}/fixture-e/run-12/semantic-inventory.json`, '--stub-b-content', files['b-ok.txt']]);
check('run-13（--stage b 复用 inventory）退出码 = 0', () => c13 === 0 || `收到 ${c13}`);
check('run-13 没有 Stage A 产物，但记录了 inventory 来源与 sha', () => {
  const m = metaOf(13);
  return (!exists(A(13, 'semantic-inventory.json')) && !!m.integrity.inventory.sha256 && /run-12/.test(m.integrity.inventory.reusedFrom)) || JSON.stringify(m.integrity.inventory);
});

/* --- 14. 拒绝覆盖 --------------------------------------------------- */
const c14 = run(['--run', '1', '--stub-a-content', files['inv-ok.json'], '--stub-b-content', files['b-ok.txt']]);
check('run-01 重跑（--run 1）被拒绝，退出码 = 3', () => c14 === 3 || `收到 ${c14}`);
check('★ 被拒绝后 run-01 产物仍字节未变', () => sha(A(1, 'framework-map.json')) === goodMapSha);
check('被拒绝的 run 没有产生 .tmp.json', () => fs.readdirSync(runDir(1)).filter((f) => f.includes('.tmp')).length === 0);

/* --- 15. 编号单调、目录独立 ----------------------------------------- */
check('run 目录为 run-01 … run-13（各阶段独立，无复用）', () => {
  const dirs = fs.readdirSync(path.join(SANDBOX, `fixture-${FIXTURE}`)).sort();
  const want = Array.from({ length: 13 }, (_, i) => `run-${String(i + 1).padStart(2, '0')}`).join(',');
  return dirs.join(',') === want || dirs.join(',');
});

console.log(results.join('\n'));
console.log('');
console.log('════════════════════════════════');
console.log(`F10 两阶段安全验证: ${results.length - failures}/${results.length} 通过`);
if (failures) console.log(`✗ ${failures} 项失败`);
else console.log('✓ 结论：Stage B 失败不会抹掉 Stage A 的证据；malformed inventory 不进 Stage B；integrity FAIL 原样保留且不自动补；全程无修补');
console.log('注：本轮全部为 stub 注入，**零模型调用**。正式 run 见 execution-prompt.md Phase 2。');
console.log('════════════════════════════════');
process.exit(failures ? 1 : 0);
