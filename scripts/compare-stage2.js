#!/usr/bin/env node
'use strict';

/**
 * Stage 2 Pilot 的 Gold 对比报告（人工可读，不做自动评分）。
 *
 * 只回答五个问题：
 * 1. Semantic Preservation —— plan 要表达的语义有没有丢失（用 check-block 的 coverage 结论）
 * 2. Semantic Fidelity     —— 有没有改变确定性 / 边界 / Current-Target / non-claim
 * 3. Shape Compliance      —— 是否真的用了该 shape，而不是把长段 prose 塞进字段
 * 4. Information Density   —— 元素数 / 平均文本长度 / 长文本占比
 * 5. Provenance Quality    —— 每个主要元素能否回溯 sourceUnit
 *
 * 刻意不做：embedding 评分、AI-as-Judge、文字相似度总分、文案一致性要求。
 *
 * 用法：node scripts/compare-stage2.js [--out docs/experiments/xxx.md]
 */

const fs = require('node:fs');
const path = require('node:path');

const { checkBlock, contentElements } = require('./check-block.js');

const ROOT = path.resolve(__dirname, '..');
const PLAN = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const DESIGN = path.join(ROOT, 'fixtures', 'context-consumption.json');
const SOURCE_SECTIONS = path.join(ROOT, 'docs', 'source-sections.json');
const STAGE2_DIR = path.join(ROOT, 'experiments', 'stage2');

const LONG_TEXT = 160;

function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outFile = outIndex >= 0 ? path.resolve(ROOT, args[outIndex + 1]) : null;

  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
  const design = JSON.parse(fs.readFileSync(DESIGN, 'utf8'));
  const source = JSON.parse(fs.readFileSync(SOURCE_SECTIONS, 'utf8'));
  const sourceText = source.sections.map((s) => s.text).join('\n');

  const { FORBIDDEN } = { FORBIDDEN: null };
  const allowedPhrases = new Set(
    ['只能算', '充分条件', '一定正确', '课程一定有效', '学生一定学会', '已实现', '已经实现', '已验证', '经核实'].filter((p) =>
      sourceText.includes(p)
    )
  );

  const goldBlocks = new Map(design.overview.sections.flatMap((s) => s.blocks.map((b) => [b.id, b])));
  const unitById = new Map(plan.sourceUnits.map((u) => [u.id, u]));

  const blockDirs = fs
    .readdirSync(STAGE2_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(STAGE2_DIR, id, 'block.generated.json')));

  const rows = blockDirs.map((id) => {
    const generated = JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, id, 'block.generated.json'), 'utf8'));
    const planBlock = plan.blocks.find((b) => b.id === id);
    const gold = goldBlocks.get(id) || null;

    // check-block 用"归一化后"的 block 来评估（与 CLI 一致）
    const normalized = JSON.parse(JSON.stringify(generated));
    if (normalized.content && normalized.content.type === 'flow' && Array.isArray(normalized.content.lanes)) {
      normalized.content.lanes.forEach((lane) => {
        if (!Array.isArray(lane.nodes)) return;
        lane.nodes = lane.nodes.map((e) => {
          if (!e || typeof e !== 'object' || e.node || !e.title) return e;
          const { edge, ...rest } = e;
          return edge ? { node: rest, edge } : { node: rest };
        });
      });
    }
    const result = checkBlock(normalized, plan, { allowedPhrases });
    const elements = result.elements;
    const withProv = elements.filter((e) => (e.sourceUnitIds || []).length > 0).length;
    const lens = elements.map((e) => (e.text || '').length);
    const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    const longCount = lens.filter((l) => l > LONG_TEXT).length;

    const request = fs.existsSync(path.join(STAGE2_DIR, id, 'request.json'))
      ? JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, id, 'request.json'), 'utf8'))
      : {};

    return {
      id,
      shape: planBlock.shape,
      title: planBlock.title,
      covers: planBlock.covers.length,
      verdict: result.verdict,
      coverage: result.coverage,
      errors: result.errors,
      warnings: result.warnings,
      elements: elements.length,
      elementsWithProv: withProv,
      avgLen,
      longCount,
      gold: gold
        ? {
            type: gold.content.type,
            parts: (() => {
              const g = checkBlock(
                { ...gold, shape: planBlock.shape },
                plan,
                { allowedPhrases }
              );
              return g.elements.length;
            })(),
          }
        : null,
      request,
    };
  });

  const lines = [];
  const push = (s = '') => lines.push(s);

  push('# Stage 2 Pilot — Gold 对比报告');
  push('');
  push(`生成时间：${new Date().toISOString()}`);
  push('');
  push('> 本报告是**观察工具**的产物。刻意不做自动评分、不做 AI-as-Judge、不要求文案与人工 Overview 一致。');
  push('> 判断依据是：Plan 要表达的语义有没有丢、有没有被改变、元素能否回溯 sourceUnit。');
  push('');

  /* ---- 1. 总览 ---- */
  push('## 1. 总览');
  push('');
  push('| block | shape | covers | check-block | Semantic Coverage | 元素数 | 有 provenance | 平均文本 | 长文本 |');
  push('|---|---|---|---|---|---|---|---|---|');
  rows.forEach((r) => {
    push(
      `| ${r.id} | ${r.shape} | ${r.covers} | ${r.verdict.replace('PASS WITH WARNINGS', 'PASS(W)')} | ` +
        `${r.coverage.covered}/${r.coverage.total}（${(r.coverage.ratio * 100).toFixed(0)}%） | ${r.elements} | ` +
        `${r.elementsWithProv}/${r.elements} | ${r.avgLen.toFixed(0)} 字 | ${r.longCount} |`
    );
  });
  push('');
  const totalUnits = rows.reduce((n, r) => n + r.coverage.total, 0);
  const totalCovered = rows.reduce((n, r) => n + r.coverage.covered, 0);
  push(
    `**合计**：${rows.length} 个 block，覆盖 ${totalCovered} / ${totalUnits} 个 sourceUnit（${((totalCovered / totalUnits) * 100).toFixed(0)}%）。`
  );
  const semanticErrors = rows.flatMap((r) => r.errors.map((e) => ({ id: r.id, e })));
  push(`**语义保真类 Hard Error：${semanticErrors.length} 条。**`);
  push('');

  /* ---- 2. Semantic Preservation ---- */
  push('## 2. Semantic Preservation（语义有没有丢）');
  push('');
  push('| block | covers | 被承载 | 未承载 | core 漏失 |');
  push('|---|---|---|---|---|');
  rows.forEach((r) => {
    push(
      `| ${r.id} | ${r.coverage.total} | ${r.coverage.covered} | ${r.coverage.missing.join(', ') || '无'} | ` +
        `${r.coverage.missingCore.join(', ') || '无'} |`
    );
  });
  push('');
  if (rows.every((r) => r.coverage.ratio === 1)) {
    push('**6 个 block 的 sourceUnit 覆盖全部为 100%，没有语义丢失。**');
  } else {
    push('存在未承载的 sourceUnit，见上表。');
  }
  push('');

  /* ---- 3. Semantic Fidelity ---- */
  push('## 3. Semantic Fidelity（有没有改变确定性 / 边界 / Current-Target / non-claim）');
  push('');
  const trapCount = (pattern) =>
    semanticErrors.filter(({ e }) => pattern.test(e)).length;
  push('| 越权类型 | 命中 |');
  push('|---|---|');
  push(`| Current / Target 反转 | ${trapCount(/\[反转\]/)} |`);
  push(`| 未决事项被写成确定结论 | ${trapCount(/未决/)} |`);
  push(`| non-claim 被写成 claim | ${trapCount(/系统保证/)} |`);
  push(`| source-verified 出现在 Stage 2 | ${trapCount(/source-verified/)} |`);
  push(`| 新增禁用措辞 | ${trapCount(/禁用措辞/)} |`);
  push(`| 修改了 plan 固定字段 | ${trapCount(/固定字段被修改/)} |`);
  push(`| 引用 covers 之外的 sourceUnit | ${trapCount(/不在 block\.covers/)} |`);
  push('');
  if (semanticErrors.length === 0) {
    push('**没有发生任何语义保真类错误。**');
  } else {
    semanticErrors.forEach(({ id, e }) => push(`- ${id}：${e}`));
  }
  push('');

  /* ---- 4. Shape Compliance ---- */
  push('## 4. Shape Compliance（有没有真的用这个 shape）');
  push('');
  push('| block | shape | content.type | 主要元素 | 平均文本 | 判定 |');
  push('|---|---|---|---|---|---|');
  rows.forEach((r) => {
    const g = JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, r.id, 'block.generated.json'), 'utf8'));
    const proseLike = r.avgLen > 120 && r.elements <= 4;
    push(
      `| ${r.id} | ${r.shape} | ${g.content.type} | ${r.elements} | ${r.avgLen.toFixed(0)} 字 | ${
        proseLike ? '⚠️ 可能偏 prose' : '结构性使用'
      } |`
    );
  });
  push('');
  const longHeavy = rows.filter((r) => r.longCount > 0);
  if (longHeavy.length === 0) {
    push('没有任何 block 出现超过 160 字的元素 —— 没有把长段 prose 直接塞进字段。');
  } else {
    push('以下 block 含超长元素（需要人工确认是否退化成 prose）：');
    longHeavy.forEach((r) => push(`- ${r.id}：${r.longCount} 个元素超过 ${LONG_TEXT} 字`));
  }
  push('');

  /* ---- 5. Provenance Quality ---- */
  push('## 5. Provenance Quality（能否回溯 sourceUnit）');
  push('');
  push('| block | 主要元素 | 带 provenance | 覆盖率 | 无 provenance 的元素类型 |');
  push('|---|---|---|---|---|');
  rows.forEach((r) => {
    const without = [];
    const generated = JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, r.id, 'block.generated.json'), 'utf8'));
    const normalized = JSON.parse(JSON.stringify(generated));
    if (normalized.content && normalized.content.type === 'flow' && Array.isArray(normalized.content.lanes)) {
      normalized.content.lanes.forEach((lane) => {
        if (!Array.isArray(lane.nodes)) return;
        lane.nodes = lane.nodes.map((e) => {
          if (!e || typeof e !== 'object' || e.node || !e.title) return e;
          const { edge, ...rest } = e;
          return edge ? { node: rest, edge } : { node: rest };
        });
      });
    }
    contentElements(normalized.content).forEach((el) => {
      if (!el.sourceUnitIds || el.sourceUnitIds.length === 0) without.push(el.kind);
    });
    const kinds = [...new Set(without)].join(', ') || '无';
    push(
      `| ${r.id} | ${r.elements} | ${r.elementsWithProv} | ${((r.elementsWithProv / r.elements) * 100).toFixed(0)}% | ${kinds} |`
    );
  });
  push('');
  const noProv = rows.filter((r) => r.elementsWithProv < r.elements);
  if (noProv.length === 0) {
    push('**所有主要元素都能回溯到 sourceUnit。**');
  } else {
    push('以下 block 存在缺少 provenance 的元素（需要人工确认是"漏标"还是"该元素确实不承载语义"）：');
    noProv.forEach((r) => {
      const generated = JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, r.id, 'block.generated.json'), 'utf8'));
      const without = [];
      contentElements(generated.content).forEach((el) => {
        if (!el.sourceUnitIds || el.sourceUnitIds.length === 0) without.push(el.kind);
      });
      push(`- **${r.id}**：${r.elements - r.elementsWithProv}/${r.elements} 个元素缺少 provenance —— 类型：${[...new Set(without)].join(', ')}`);
    });
    push('');
    push('说明：`flow` 的"泳道 / 边"与 `checklist` 的"分组标题"属于**结构元素**。');
    push('它们如果不带 provenance，语义覆盖仍然可能 100%（因为内容元素已经承载了语义），');
    push('但会削弱"每个元素都能回溯"这一条；模型需要为结构元素也标注来源。');
  }
  push('');

  /* ---- 6. 与人工 Overview 的对照（人工可读） ---- */
  push('## 6. 与人工 Overview 的对照（只列结构，不评文案）');
  push('');
  push('| block | 人工 content.type | 模型 content.type | 人工元素数 | 模型元素数 | 差异说明 |');
  push('|---|---|---|---|---|---|');
  rows.forEach((r) => {
    const gold = goldBlocks.get(r.id);
    const model = JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, r.id, 'block.generated.json'), 'utf8'));
    const goldCount = gold
      ? checkBlock({ ...gold, shape: plan.blocks.find((b) => b.id === r.id).shape }, plan, { allowedPhrases }).elements.length
      : 0;
    const note =
      gold && gold.content.type !== model.content.type ? `type 不同（catalog 名 vs renderer 名）` : '结构一致';
    push(
      `| ${r.id} | ${gold ? gold.content.type : '—'} | ${model.content.type} | ${goldCount} | ${r.elements} | ${
        gold ? note : '人工 Overview 里没有这个块（O-16 是回推时新增的）'
      } |`
    );
  });
  push('');

  /* ---- 7. 问题分类 ---- */
  push('## 7. 问题分类');
  push('');
  const classification = {
    'semantic loss': rows.filter((r) => r.coverage.missingCore.length > 0).map((r) => `${r.id}: core 未承载 ${r.coverage.missingCore.join(', ')}`),
    'semantic distortion': semanticErrors.filter(({ e }) => /\[反转\]|未决|系统保证|禁用措辞/.test(e)).map(({ id, e }) => `${id}: ${e.slice(0, 90)}`),
    'shape misuse': rows.filter((r) => r.warnings.some((w) => /超过 shape catalog/.test(w))).map((r) => `${r.id}: 容量超出推荐值`),
    'excessive prose': rows.filter((r) => r.longCount > 0).map((r) => `${r.id}: ${r.longCount} 个超长元素`),
    'provenance error': rows.filter((r) => r.elementsWithProv < r.elements).map((r) => `${r.id}: ${r.elements - r.elementsWithProv}/${r.elements} 个元素缺少 provenance`),
    'renderer mismatch': (() => {
      const out = [];
      rows.forEach((r) => {
        const g = JSON.parse(fs.readFileSync(path.join(STAGE2_DIR, r.id, 'block.generated.json'), 'utf8'));
        if (!['flow', 'current-target-flow'].includes(r.shape)) return;
        // 扁平写法：nodes[] 的元素上直接出现 title（正确写法应当是 { node: {...} }）
        const raw = JSON.stringify(g.content.lanes || []);
        const flat = /"title"/.test(raw) && !raw.includes('"node"');
        if (flat) out.push(`${r.id}: 使用了"扁平节点"写法，需归一化才能被 renderer 消费`);
      });
      return out;
    })(),
  };
  Object.entries(classification).forEach(([label, items]) => {
    push(`### ${label}`);
    push('');
    if (items.length === 0) push('- 无');
    else items.forEach((i) => push(`- ${i}`));
    push('');
  });

  /* ---- 8. 结论 ---- */
  push('## 8. Pilot 成功条件核对');
  push('');
  const criteria = [
    ['A. Plan 不会被 Stage 2 修改', semanticErrors.filter(({ e }) => /固定字段/.test(e)).length === 0],
    ['B. core semantic coverage = 100%', rows.every((r) => r.coverage.missingCore.length === 0 && r.coverage.ratio === 1)],
    ['C. 没有严重 Semantic Fidelity Error', semanticErrors.length === 0],
    ['D. 每个生成元素可以追溯到 sourceUnit', rows.every((r) => r.elementsWithProv === r.elements)],
    ['E. Shape contract 可以稳定约束模型', rows.every((r) => r.verdict !== 'FAIL')],
    ['F. 生成结果能被现有 Renderer 消费，或只需非常薄的 deterministic adapter', null],
  ];
  criteria.forEach(([label, ok]) => {
    let extra = '';
    if (ok === null) {
      const flat = classification['renderer mismatch'];
      extra = flat.length === 0
        ? '（6 个块全部按 renderer 契约输出，无需 adapter）'
        : `（flow 系需要一层"扁平节点"归一化：${flat.map((s) => s.split(':')[0]).join(', ')}）`;
    }
    if (ok === false) {
      extra = `（${classification['provenance error'].join('；')}）`;
    }
    push(`- ${ok === null ? '⚠️' : ok ? '✅' : '❌'} ${label}${extra}`);
  });
  push('');

  const report = lines.join('\n');
  if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, `${report}\n`, 'utf8');
    console.log(`已写出 ${path.relative(ROOT, outFile)}`);
  } else {
    process.stdout.write(report);
  }
}

main();
