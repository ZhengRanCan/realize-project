#!/usr/bin/env node
'use strict';

/**
 * Full Run 报告：把 overview.generated.json + 各 block 的 check-block 结果汇总成人工可读的报告。
 *
 * 事实统计，不做主观质量分。问题按固定类别分组：
 * semantic loss / semantic distortion / excessive compression / excessive prose /
 * duplicate presentation / provenance error / renderer mismatch
 *
 * 用法：node scripts/full-run-report.js [--overview <path>] [--out <path>]
 */

const fs = require('node:fs');
const path = require('node:path');

const { checkBlock, contentElements } = require('./check-block.js');

const ROOT = path.resolve(__dirname, '..');

const DEFAULTS = {
  overview: path.join('experiments', 'stage2-full', 'overview.generated.json'),
  plan: path.join('fixtures', 'context-consumption.overview-plan.json'),
  blocksDir: path.join('experiments', 'stage2-full', 'blocks'),
  out: path.join('experiments', 'stage2-full', 'full-run-report.md'),
  longText: 160,
  overCompressChars: 60,
  overCompressUnits: 4,
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

function normalizeFlatNodes(input) {
  const block = JSON.parse(JSON.stringify(input));
  const content = block.content;
  if (!content || content.type !== 'flow' || !Array.isArray(content.lanes)) return block;
  content.lanes.forEach((lane) => {
    if (!Array.isArray(lane.nodes)) return;
    lane.nodes = lane.nodes.map((entry) => {
      if (!entry || typeof entry !== 'object' || entry.node || !entry.title) return entry;
      const { edge, ...rest } = entry;
      return edge ? { node: rest, edge } : { node: rest };
    });
  });
  return block;
}

function main() {
  const overviewPath = path.resolve(ROOT, args.overview);
  const blocksDir = path.resolve(ROOT, args.blocksDir);
  const outPath = path.resolve(ROOT, args.out);
  const plan = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.plan), 'utf8'));
  const overview = JSON.parse(fs.readFileSync(overviewPath, 'utf8'));
  const sectionsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'source-sections.json'), 'utf8'));
  const sourceText = sectionsDoc.sections.map((s) => s.text).join('\n');

  const FORBIDDEN = ['只能算', '等价于', '已被证明', '充分条件', '就是充分', '应当改为', '必须使用', '一定正确', '课程一定有效', '学生一定学会', '已实现', '已经实现', '已上线', '已验证', '源码已确认', '实际代码已', '经核实', '实测证明'];
  const allowedPhrases = new Set(FORBIDDEN.filter((p) => sourceText.includes(p)));

  const planById = new Map(plan.blocks.map((b) => [b.id, b]));
  const unitById = new Map(plan.sourceUnits.map((u) => [u.id, u]));

  const rows = overview.blocks.map((b) => {
    const pb = planById.get(b.id);
    const content = normalizeFlatNodes({ content: b.content }).content;
    const result = checkBlock({ ...pb, content: b.content }, plan, { allowedPhrases });
    const els = contentElements(content);
    const semantic = els.filter((e) => e.semantic);
    const withProv = semantic.filter((e) => (e.sourceUnitIds || []).length > 0);
    const lenList = els.map((e) => (e.text || '').length);
    const avg = lenList.length ? lenList.reduce((x, y) => x + y, 0) / lenList.length : 0;
    const longCount = lenList.filter((l) => l > args.longText).length;
    const overCompressed = els.filter(
      (e) => (e.sourceUnitIds || []).length >= args.overCompressUnits && (e.text || '').length <= args.overCompressChars
    );
    const checkFile = path.join(blocksDir, b.id, 'check-block.txt');
    const checkText = fs.existsSync(checkFile) ? fs.readFileSync(checkFile, 'utf8') : '';
    const requestFile = path.join(blocksDir, b.id, 'request.json');
    const request = fs.existsSync(requestFile) ? JSON.parse(fs.readFileSync(requestFile, 'utf8')) : {};
    return {
      id: b.id,
      title: b.title,
      stage: b.stage,
      shape: pb.shape,
      type: content.type,
      covers: pb.covers.length,
      verdict: result.errors.length > 0 ? 'FAIL' : checkText.includes('PASS WITH WARNINGS') || result.warnings.length > 0 ? 'PASS WITH WARNINGS' : 'PASS',
      errors: result.errors,
      warnings: result.warnings,
      coverage: result.coverage,
      elements: els.length,
      semantic: semantic.length,
      withProv: withProv.length,
      avg,
      long: longCount,
      overCompressed,
      latencyMs: request.latencyMs || null,
      finishReason: request.finishReason || null,
      reused: null,
    };
  });

  // sourceUnit 跨 block 复用统计
  const across = new Map();
  overview.blocks.forEach((b) => {
    const content = normalizeFlatNodes({ content: b.content }).content;
    new Set(contentElements(content).flatMap((e) => e.sourceUnitIds || [])).forEach((id) => {
      if (!across.has(id)) across.set(id, new Set());
      across.get(id).add(b.id);
    });
  });

  const core = plan.sourceUnits.filter((u) => u.importance === 'core');
  const support = plan.sourceUnits.filter((u) => u.importance === 'supporting');
  // 与 check-overview 口径一致：covers 承载 **或** 在 duplicatesMerged 里登记，都算被满足
  const mergedBy = new Map();
  (plan.duplicatesMerged || []).forEach((m) =>
    (m.sourceUnits || []).forEach((id) => mergedBy.set(id, m.keptInBlock))
  );
  const covered = new Set([...across.keys(), ...mergedBy.keys()]);
  const semanticEls = rows.reduce((n, r) => n + r.semantic, 0);
  const semanticProv = rows.reduce((n, r) => n + r.withProv, 0);
  const shapes = {};
  rows.forEach((r) => (shapes[r.shape] = (shapes[r.shape] || 0) + 1));

  const lines = [];
  const push = (s = '') => lines.push(s);

  push('# Stage 2 Full Run 报告');
  push('');
  push(`生成时间：${new Date().toISOString()}`);
  push('');
  push('> 本轮使用 **Gold overview-plan**（未使用 Stage 1 生成结果），Plan 固定字段由程序注入，AI 只输出 `content`。');
  push('> 全部数字都是**事实统计**，不是主观质量分。');
  push('');

  /* ---- 1. 运行元数据 ---- */
  const g = overview.generation || {};
  push('## 1. 运行元数据');
  push('');
  push('| 项 | 值 |');
  push('|---|---|');
  push(`| plan | ${g.plan || '?'}（${g.planPath || '?'}） |`);
  push(`| plan sha256 | \`${g.planSha256 || '?'}\` |`);
  push(`| model | ${g.model || '?'} |`);
  push(`| prompt sha256 | \`${g.promptSha256 || '?'}\` |`);
  push(`| complete | **${g.complete}** |`);
  push(`| 生成 block | ${g.generatedBlocks} / ${g.totalPlanBlocks} |`);
  push(`| 失败 block | ${(g.failedBlocks || []).join(', ') || '无'} |`);
  push(`| 缺失 block | ${(g.missingBlocks || []).join(', ') || '无'} |`);
  push(`| 组装时间 | ${g.assembledAt || '?'} |`);
  push('');

  /* ---- 2. 总统计 ---- */
  push('## 2. 总统计');
  push('');
  push('```text');
  push(`Blocks          ${rows.filter((r) => r.verdict !== 'FAIL').length} / ${plan.blocks.length}`);
  push(`Core coverage   ${core.filter((u) => covered.has(u.id)).length} / ${core.length}`);
  push(`Supporting      ${support.filter((u) => covered.has(u.id)).length} / ${support.length}`);
  push(`Total           ${covered.size} / ${plan.sourceUnits.length}`);
  push(`Provenance      ${semanticProv} / ${semanticEls}`);
  push('```');
  push('');
  push(`Shape 分布：${Object.entries(shapes).map(([k, v]) => `${k}×${v}`).join(', ')}`);
  push('');
  const warnByCat = {};
  rows.flatMap((r) => r.warnings).forEach((w) => {
    const key = (w.match(/^\[([^\]]+)\]/) || [, 'other'])[1];
    warnByCat[key] = (warnByCat[key] || 0) + 1;
  });
  push(`Warning 分类：${Object.entries(warnByCat).map(([k, v]) => `${k}×${v}`).join(', ') || '无'}`);
  push('');
  push(`失败 block：${rows.filter((r) => r.verdict === 'FAIL').map((r) => r.id).join(', ') || '无'}`);
  push('');

  /* ---- 3. 每个 block 的判定 ---- */
  push('## 3. 每个 block 的 PASS / WARNING / FAIL');
  push('');
  push('| block | stage | shape | content.type | covers | coverage | 元素 | provenance | 判定 | 耗时 |');
  push('|---|---|---|---|---|---|---|---|---|---|');
  rows.forEach((r) => {
    push(
      `| ${r.id} | ${r.stage} | ${r.shape} | ${r.type} | ${r.covers} | ${r.coverage.covered}/${r.coverage.total} | ${r.elements} | ` +
        `${r.withProv}/${r.semantic} | ${r.verdict} | ${r.latencyMs ? `${(r.latencyMs / 1000).toFixed(0)}s` : '—'} |`
    );
  });
  push('');

  /* ---- 4. 语义覆盖明细 ---- */
  push('## 4. Semantic Coverage 明细');
  push('');
  const missing = rows.filter((r) => r.coverage.missing.length > 0);
  if (missing.length === 0) {
    push('**每个 block 的 covers 都被 content provenance 100% 承载。**');
  } else {
    push('| block | 未承载的 sourceUnit | core 漏失 |');
    push('|---|---|---|');
    missing.forEach((r) => push(`| ${r.id} | ${r.coverage.missing.join(', ')} | ${r.coverage.missingCore.join(', ') || '无'} |`));
  }
  push('');
  const uncovered = plan.sourceUnits.filter((u) => !covered.has(u.id));
  if (uncovered.length > 0) {
    push('**全文中未被任何元素承载的 sourceUnit：**');
    push('');
    uncovered.forEach((u) => push(`- ${u.id}（${u.section} / ${u.kind} / ${u.importance}）：${u.statement.slice(0, 80)}…`));
    push('');
  }
  push('');

  /* ---- 5. Provenance ---- */
  push('## 5. Provenance coverage');
  push('');
  const provGaps = rows.filter((r) => r.withProv < r.semantic);
  if (provGaps.length === 0) {
    push('**所有 semantic-bearing 元素都带 provenance。**');
  } else {
    push('| block | 缺 provenance 的 semantic 元素 |');
    push('|---|---|');
    provGaps.forEach((r) => push(`| ${r.id} | ${r.semantic - r.withProv} / ${r.semantic} |`));
  }
  push('');

  /* ---- 6. 问题分类 ---- */
  push('## 6. 问题分类');
  push('');
  const cat = {
    'semantic loss': rows.filter((r) => r.coverage.missingCore.length > 0).map((r) => `${r.id}: core 未承载 ${r.coverage.missingCore.join(', ')}`),
    'semantic distortion': rows.flatMap((r) => r.errors.filter((e) => /\[反转\]|未决|系统保证|source-verified|禁用措辞|固定字段/.test(e)).map((e) => `${r.id}: ${e.slice(0, 100)}`)),
    'excessive compression': rows.flatMap((r) => r.overCompressed.map((e) => `${r.id}: ${e.path} 用 ${(e.text || '').length} 字承载 ${e.sourceUnitIds.length} 条语义`)),
    'excessive prose': rows.filter((r) => r.long > 0).map((r) => `${r.id}: ${r.long} 个元素 > ${args.longText} 字（平均 ${r.avg.toFixed(0)} 字）`),
    'duplicate presentation': (() => {
      const out = [];
      const byBlock = new Map();
      overview.blocks.forEach((b) => {
        const content = normalizeFlatNodes({ content: b.content }).content;
        const m = new Map();
        contentElements(content).forEach((el) => (el.text || '').trim() && m.set((el.text || '').trim().slice(0, 40), el.path));
        byBlock.set(b.id, m);
      });
      const seen = new Map();
      byBlock.forEach((m, id) => m.forEach((p, text) => {
        if (!seen.has(text)) seen.set(text, []);
        seen.get(text).push(`${id}:${p}`);
      }));
      [...seen.entries()].filter(([, list]) => list.length > 1).forEach(([text, list]) => out.push(`「${text}…」出现在 ${list.length} 处：${list.join(', ')}`));
      [...across.entries()].filter(([, set]) => set.size >= 4).forEach(([id, set]) => out.push(`sourceUnit ${id} 在 ${set.size} 个 block 中出现：${[...set].join(', ')}`));
      return out;
    })(),
    'provenance error': rows.flatMap((r) => r.errors.filter((e) => /\[provenance\]/.test(e)).map((e) => `${r.id}: ${e.slice(0, 100)}`)),
    'renderer mismatch': (() => {
      const out = [];
      overview.blocks.forEach((b) => {
        const pb = planById.get(b.id);
        if (!pb || !['flow', 'current-target-flow'].includes(pb.shape)) return;
        const raw = JSON.stringify((b.content || {}).lanes || []);
        if (/"title"/.test(raw) && !raw.includes('"node"')) out.push(`${b.id}: 使用了"扁平节点"写法（需归一化才能被 renderer 消费）`);
      });
      return out;
    })(),
  };
  Object.entries(cat).forEach(([label, items]) => {
    push(`### ${label}`);
    push('');
    if (items.length === 0) push('- 无');
    else items.slice(0, 20).forEach((i) => push(`- ${i}`));
    if (items.length > 20) push(`- …（另有 ${items.length - 20} 条）`);
    push('');
  });

  /* ---- 7. 四段结构 ---- */
  push('## 7. 四段阅读流的信息量分布');
  push('');
  push('| stage | 标题 | block 数 | 语义元素数 | 平均每块元素 |');
  push('|---|---|---|---|---|');
  (overview.stages || []).forEach((s) => {
    const st = rows.filter((r) => r.stage === s.id);
    const els = st.reduce((n, r) => n + r.elements, 0);
    push(`| ${s.id} | ${s.title} | ${st.length} | ${els} | ${st.length ? (els / st.length).toFixed(1) : '—'} |`);
  });
  push('');

  /* ---- 8. 逐块内容清单（供人工阅读顺序检查） ---- */
  push('## 8. 逐块内容清单');
  push('');
  rows.forEach((r) => {
    const b = overview.blocks.find((x) => x.id === r.id);
    push(`### ${r.id}｜${r.title}`);
    push('');
    push(`- stage：${r.stage}｜shape：${r.shape} → content.type：${r.type}｜covers：${r.covers} 个 sourceUnit`);
    push(`- 判定：**${r.verdict}**｜元素 ${r.elements} 个｜provenance ${r.withProv}/${r.semantic}`);
    push(`- sources：${((planById.get(r.id) || {}).sourceRefs || []).map((x) => x.section).join(', ')}`);
    if (r.warnings.length > 0) push(`- warning：${r.warnings.length} 条（${[...new Set(r.warnings.map((w) => (w.match(/^\[([^\]]+)\]/) || [, ''])[1]))].join(', ')}）`);
    push('');
  });

  const report = lines.join('\n');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${report}\n`, 'utf8');
  console.log(`已写出 ${path.relative(ROOT, outPath)}`);
  console.log(`blocks=${rows.length}  core=${core.filter((u) => covered.has(u.id)).length}/${core.length}  total=${covered.size}/${plan.sourceUnits.length}  provenance=${semanticProv}/${semanticEls}`);
  const fails = rows.filter((r) => r.verdict === 'FAIL');
  console.log(`FAIL: ${fails.length === 0 ? '无' : fails.map((r) => r.id).join(', ')}`);
}

main();
