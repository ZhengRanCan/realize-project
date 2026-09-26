#!/usr/bin/env node
'use strict';

/**
 * Overview 级验收器：`npm run check-overview`
 *
 * 它回答的不是"某个块好不好"，而是：
 *   **完整 Overview 是否完整实现了整个 Plan。**
 *
 * 输入：experiments/stage2-full/overview.generated.json + Gold overview-plan
 * 输出：PASS / PASS WITH WARNINGS / FAIL（并打印第 8 节要求的统计）
 *
 * 用法：
 *   node scripts/check-overview.js [overview.generated.json] [--plan <plan.json>]
 */

const fs = require('node:fs');
const path = require('node:path');

const { checkBlock, contentElements } = require('./check-block.js');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OVERVIEW = path.join(ROOT, 'experiments', 'stage2-full', 'overview.generated.json');
const DEFAULT_PLAN = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const SOURCE_SECTIONS = path.join(ROOT, 'docs', 'source-sections.json');

/* ================================================================== *
 * 阈值集中配置
 * ================================================================== */

const THRESHOLDS = {
  /** 一个 stage 的 block 数超过它算"信息量显著过重" */
  stageBlockMax: 8,
  /** 一个 stage 的语义元素数超过它算过重 */
  stageElementMax: 60,
  /** 单个 block 的平均文本长度超过它算 prose 密度过高 */
  blockProseAvgLen: 150,
  /** 一个 sourceUnit 出现在多少个 block 里算"大量重复" */
  sourceUnitAcrossBlocksMax: 3,
  /** 全篇长文本元素占比上限 */
  overviewLongTextRatio: 0.35,
  /** 长文本判定阈值 */
  longText: 160,
};

const SHAPE_CAPACITY = {
  flow: { lanes: 3, nodesPerLane: 6 },
  'current-target-flow': { lanes: 2, nodesPerLane: 5 },
  matrix: { columns: 4, rows: 8 },
  'capability-matrix': { rows: 5 },
  diff: { linesPerSide: 6 },
  ladder: { tiers: 4 },
  walkthrough: { steps: 6 },
  combo: { pairs: 6 },
  checklist: { panels: 3, itemsPerPanel: 8 },
  'two-column-comparison': { panels: 2, itemsPerPanel: 8 },
  prose: { parts: 3 },
};

const FORBIDDEN_PHRASES = [
  '只能算',
  '等价于',
  '已被证明',
  '充分条件',
  '就是充分',
  '应当改为',
  '必须使用',
  '一定正确',
  '课程一定有效',
  '学生一定学会',
  '已实现',
  '已经实现',
  '已上线',
  '已验证',
  '源码已确认',
  '实际代码已',
  '经核实',
  '实测证明',
];

/* ------------------------------------------------------------------ *
 * 工具：与 check-block 相同的"扁平节点"归一化
 * ------------------------------------------------------------------ */

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

function parseArgs(argv) {
  const args = { overview: DEFAULT_OVERVIEW, plan: DEFAULT_PLAN };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--plan') {
      args.plan = path.resolve(ROOT, argv[i + 1]);
      i += 1;
    } else if (!argv[i].startsWith('--')) {
      args.overview = path.resolve(argv[i]);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const overview = JSON.parse(fs.readFileSync(args.overview, 'utf8'));
  const plan = JSON.parse(fs.readFileSync(args.plan, 'utf8'));
  const source = JSON.parse(fs.readFileSync(SOURCE_SECTIONS, 'utf8'));
  const sourceText = source.sections.map((s) => s.text).join('\n');
  const allowedPhrases = new Set(FORBIDDEN_PHRASES.filter((p) => sourceText.includes(p)));

  const errors = [];
  const warnings = [];
  const hardFail = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  const unitById = new Map(plan.sourceUnits.map((u) => [u.id, u]));
  const planBlocks = plan.blocks;
  const planById = new Map(planBlocks.map((b) => [b.id, b]));
  const blocks = overview.blocks || [];

  /* ---------------- 1. 覆盖：Plan block 是否都在 ---------------- */

  const missing = planBlocks.filter((pb) => !blocks.some((b) => b.id === pb.id)).map((b) => b.id);
  if (missing.length > 0) {
    hardFail(`[覆盖] Plan 中存在但 generated overview 缺失的 block：${missing.join(', ')}`);
  }

  /* ---------------- 2. 多出来的 block ---------------- */

  const extra = blocks.filter((b) => !planById.has(b.id)).map((b) => b.id);
  if (extra.length > 0) {
    hardFail(`[覆盖] generated overview 出现 Plan 中不存在的 block：${extra.join(', ')}`);
  }

  /* ---------------- 3. 重复 block ---------------- */

  const seen = new Map();
  blocks.forEach((b) => seen.set(b.id, (seen.get(b.id) || 0) + 1));
  const duplicated = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
  if (duplicated.length > 0) {
    hardFail(`[覆盖] 同一个 Plan block 出现多次：${duplicated.join(', ')}`);
  }

  /* ---------------- 4. 顺序 / stage 归属 ---------------- */

  const generatedOrder = blocks.map((b) => b.id).filter((id) => planById.has(id));
  const planOrder = planBlocks.map((b) => b.id);
  if (generatedOrder.join(',') !== planOrder.join(',')) {
    hardFail(`[顺序] block 顺序与 Plan 不一致\n        plan:      ${planOrder.join(', ')}\n        generated: ${generatedOrder.join(', ')}`);
  }
  blocks.forEach((b) => {
    const pb = planById.get(b.id);
    if (!pb) return;
    if (b.stage !== pb.stage) {
      hardFail(`[顺序] ${b.id} 的 stage 归属异常：generated=${b.stage}，plan=${pb.stage}`);
    }
  });

  /* ---------------- 5. 固定字段未被修改 ---------------- */

  blocks.forEach((b) => {
    const pb = planById.get(b.id);
    if (!pb) return;
    const FIXED = ['id', 'title', 'stage', 'defaultExpanded'];
    FIXED.forEach((f) => {
      if (JSON.stringify(b[f]) !== JSON.stringify(pb[f])) {
        hardFail(`[固定字段] ${b.id}.${f} 被修改：generated=${JSON.stringify(b[f])}，plan=${JSON.stringify(pb[f])}`);
      }
    });
    (['covers', 'reviewObjects']).forEach((f) => {
      if (b[f] !== undefined && JSON.stringify(b[f]) !== JSON.stringify(pb[f])) {
        hardFail(`[固定字段] ${b.id}.${f} 被修改：generated=${JSON.stringify(b[f])}，plan=${JSON.stringify(pb[f])}`);
      }
    });
  });

  /* ---------------- 6. 逐块 check-block ---------------- */

  const blockResults = new Map();
  blocks.forEach((b) => {
    const pb = planById.get(b.id);
    if (!pb) return;
    const checkable = normalizeFlatNodes({ ...pb, content: b.content });
    const result = checkBlock(checkable, plan, { allowedPhrases });
    blockResults.set(b.id, result);
    if (result.errors.length > 0) {
      hardFail(`[块级] ${b.id} 的 check-block = FAIL：${result.errors[0].slice(0, 110)}`);
    }
  });

  /* ---------------- 7/8/9. 全文语义覆盖与 sourceUnit 归属 ---------------- */

  const provenanceToBlocks = new Map(); // sourceUnitId -> Set(blockId)
  const unitCoveredInOverview = new Set();
  let semanticElements = 0;
  let semanticWithProv = 0;
  let allElements = 0;
  let longTextCount = 0;

  blocks.forEach((b) => {
    const pb = planById.get(b.id);
    const covers = (pb && pb.covers) || [];
    const content = normalizeFlatNodes({ content: b.content }).content;
    const els = contentElements(content);
    els.forEach((el) => {
      allElements += 1;
      if (el.semantic) {
        semanticElements += 1;
        if ((el.sourceUnitIds || []).length > 0) semanticWithProv += 1;
      }
      (el.text || '').length > THRESHOLDS.longText ? (longTextCount += 1) : null;
      (el.sourceUnitIds || []).forEach((id) => {
        const inCovers = covers.includes(id);
        if (!inCovers) {
          hardFail(
            `[归属] ${b.id} 的元素 ${el.path} 引用了不在该 block.covers 中的 sourceUnit：${id}` +
              `（Stage 2 不得新增 Plan 之外的归属）`
          );
        }
        if (!unitById.has(id)) {
          hardFail(`[归属] ${b.id} 的元素 ${el.path} 引用了 Plan 中不存在的 sourceUnit：${id}`);
        }
        unitCoveredInOverview.add(id);
        if (!provenanceToBlocks.has(id)) provenanceToBlocks.set(id, new Set());
        provenanceToBlocks.get(id).add(b.id);
      });
    });
  });

  const allUnits = plan.sourceUnits;
  const coreUnits = allUnits.filter((u) => u.importance === 'core');
  const supportingUnits = allUnits.filter((u) => u.importance === 'supporting');

  /**
   * 合并声明的处理：plan 的 duplicatesMerged 表示"这条语义由 keptInBlock 承载"。
   * 它不要求该单元在 content 里有自己的 provenance（那会变成虚假归属），
   * 但要求 keptInBlock 在 Overview 中存在 —— 与 check-plan 的口径保持一致。
   */
  const mergedBy = new Map();
  (plan.duplicatesMerged || []).forEach((m) =>
    (m.sourceUnits || []).forEach((id) => mergedBy.set(id, m.keptInBlock))
  );
  const mergedSatisfied = new Set();
  mergedBy.forEach((keptInBlock, id) => {
    if (blocks.some((b) => b.id === keptInBlock)) mergedSatisfied.add(id);
  });

  const isSatisfied = (id) => unitCoveredInOverview.has(id) || mergedSatisfied.has(id);

  const coreCovered = coreUnits.filter((u) => isSatisfied(u.id));
  const supportingCovered = supportingUnits.filter((u) => isSatisfied(u.id));

  coreUnits
    .filter((u) => !isSatisfied(u.id))
    .forEach((u) => hardFail(`[覆盖] core sourceUnit 在整个 Overview 中没有 provenance：${u.id}（${u.section}）— ${u.statement.slice(0, 46)}…`));
  supportingUnits
    .filter((u) => !isSatisfied(u.id))
    .forEach((u) => warn(`[覆盖] supporting sourceUnit 没有被任何元素承载，也没有合并登记：${u.id}（${u.section}）`));

  const coreRatio = coreUnits.length === 0 ? 1 : coreCovered.length / coreUnits.length;
  if (coreRatio < 1) {
    hardFail(`[覆盖] 原文 core semantic coverage = ${(coreRatio * 100).toFixed(0)}%（要求 100%）`);
  }

  /* ---------------- 10. 语义越权（逐块已查，这里做汇总） ---------------- */

  const fidelityErrors = [];
  blockResults.forEach((result, id) => {
    result.errors
      .filter((e) => /\[反转\]|未决|系统保证|source-verified|禁用措辞/.test(e))
      .forEach((e) => fidelityErrors.push(`${id}: ${e}`));
  });
  fidelityErrors.forEach((e) => hardFail(`[越权] ${e.slice(0, 130)}`));

  /* ---------------- Warning ---------------- */

  if (supportingCovered.length < supportingUnits.length) {
    warn(`[覆盖] supporting semantic coverage = ${supportingCovered.length} / ${supportingUnits.length}`);
  }

  // 单个 block prose 密度
  blocks.forEach((b) => {
    const result = blockResults.get(b.id);
    if (!result) return;
    const lens = result.elements.map((e) => (e.text || '').length);
    if (lens.length === 0) return;
    const avg = lens.reduce((a, c) => a + c, 0) / lens.length;
    if (avg > THRESHOLDS.blockProseAvgLen) {
      warn(`[prose] ${b.id} 平均文本 ${avg.toFixed(0)} 字（阈值 ${THRESHOLDS.blockProseAvgLen}），prose 密度偏高`);
    }
  });

  // 全篇长文本占比
  if (allElements > 0 && longTextCount / allElements > THRESHOLDS.overviewLongTextRatio) {
    warn(`[prose] 全篇 ${longTextCount}/${allElements} 个元素超过 ${THRESHOLDS.longText} 字（占比 ${((longTextCount / allElements) * 100).toFixed(0)}%），可能退化成文档`);
  }

  // 同一 sourceUnit 在大量 block 中重复
  [...provenanceToBlocks.entries()]
    .filter(([, set]) => set.size > THRESHOLDS.sourceUnitAcrossBlocksMax)
    .forEach(([id, set]) =>
      warn(`[重复] sourceUnit ${id} 出现在 ${set.size} 个 block 中（阈值 ${THRESHOLDS.sourceUnitAcrossBlocksMax}）：${[...set].join(', ')}`)
    );

  // stage 过重
  const stageStats = (overview.stages || []).map((s) => {
    const stageBlocks = blocks.filter((b) => b.stage === s.id);
    const els = stageBlocks.reduce((n, b) => {
      const r = blockResults.get(b.id);
      return n + (r ? r.elements.length : 0);
    }, 0);
    return { id: s.id, title: s.title, blocks: stageBlocks.length, elements: els };
  });
  stageStats.forEach((s) => {
    if (s.blocks > THRESHOLDS.stageBlockMax) {
      warn(`[过重] stage「${s.title}」有 ${s.blocks} 个 block（阈值 ${THRESHOLDS.stageBlockMax}）`);
    }
    if (s.elements > THRESHOLDS.stageElementMax) {
      warn(`[过重] stage「${s.title}」有 ${s.elements} 个语义元素（阈值 ${THRESHOLDS.stageElementMax}）`);
    }
  });

  // provenance 覆盖率
  const provRatio = semanticElements === 0 ? 1 : semanticWithProv / semanticElements;
  if (provRatio < 1) {
    warn(`[provenance] semantic-bearing 元素 provenance 覆盖率 = ${(provRatio * 100).toFixed(0)}%（${semanticWithProv} / ${semanticElements}）`);
  }

  // shape 容量
  blocks.forEach((b) => {
    const pb = planById.get(b.id);
    if (!pb) return;
    const capacity = SHAPE_CAPACITY[pb.shape];
    if (!capacity) return;
    const c = b.content || {};
    const counts = {
      rows: (c.rows || []).length,
      tiers: (c.tiers || []).length,
      steps: (c.steps || []).length,
      pairs: (c.pairs || []).length,
      panels: (c.panels || []).length,
      lanes: (c.lanes || []).length,
    };
    Object.entries(capacity).forEach(([key, max]) => {
      if (typeof counts[key] === 'number' && counts[key] > max) {
        warn(`[容量] ${b.id}（${pb.shape}）的 ${key} = ${counts[key]}，超过推荐值 ${max}`);
      }
    });
  });

  /* ---------------- 统计 ---------------- */

  const shapeCounts = {};
  blocks.forEach((b) => {
    const pb = planById.get(b.id);
    if (pb) shapeCounts[pb.shape] = (shapeCounts[pb.shape] || 0) + 1;
  });
  const warningCategories = {};
  const allWarnings = [...warnings, ...[...blockResults.values()].flatMap((r) => r.warnings)];
  allWarnings.forEach((w) => {
    const key = (w.match(/^\[([^\]]+)\]/) || [, 'other'])[1];
    warningCategories[key] = (warningCategories[key] || 0) + 1;
  });
  const failedBlocks = [...blockResults.entries()].filter(([, r]) => r.errors.length > 0).map(([id]) => id);

  /* ---------------- 输出 ---------------- */

  const verdict = errors.length > 0 ? 'FAIL' : warnings.length + allWarnings.length > 0 ? 'PASS WITH WARNINGS' : 'PASS';

  console.log('=== check-overview ===');
  console.log(`overview  ${path.relative(ROOT, args.overview)}`);
  console.log(`plan      ${path.relative(ROOT, args.plan)}（${overview.generation ? overview.generation.plan : '?'}）`);
  console.log(`complete  ${overview.generation ? overview.generation.complete : '?'}｜失败 block：${(overview.generation && overview.generation.failedBlocks || []).join(', ') || '无'}`);
  console.log('');
  console.log('--- 统计（事实，不是评分）---');
  console.log(`Blocks          ${blocks.length - failedBlocks.length} / ${planBlocks.length}`);
  console.log(`Core coverage   ${coreCovered.length} / ${coreUnits.length}`);
  console.log(`Supporting      ${supportingCovered.length} / ${supportingUnits.length}`);
  console.log(`Total           ${coreCovered.length + supportingCovered.length} / ${allUnits.length}`);
  console.log(`Provenance      ${semanticWithProv} / ${semanticElements}`);
  console.log(`Shapes          ${Object.entries(shapeCounts).map(([k, v]) => `${k}×${v}`).join(', ')}`);
  console.log(`Stages          ${stageStats.map((s) => `${s.id}(${s.blocks}块/${s.elements}元素)`).join(' ')}`);
  console.log(`Warnings        ${Object.entries(warningCategories).map(([k, v]) => `${k}×${v}`).join(', ') || '无'}`);
  console.log(`Failures        ${failedBlocks.join(', ') || '无'}`);
  console.log('');

  if (warnings.length > 0) {
    console.log(`WARNINGS (overview 级 ${warnings.length})`);
    warnings.forEach((w) => console.log(`  ! ${w}`));
    console.log('');
  }
  if (errors.length > 0) {
    console.log(`HARD ERRORS (${errors.length})`);
    errors.slice(0, 40).forEach((e) => console.log(`  ✗ ${e}`));
    if (errors.length > 40) console.log(`  … 另有 ${errors.length - 40} 条`);
    console.log('');
    console.log('结果：FAIL —— 完整 Overview 没有完整实现 Plan。');
    process.exit(1);
  }
  if (verdict === 'PASS WITH WARNINGS') {
    console.log('结果：PASS WITH WARNINGS —— Overview 完整实现了 Plan，但见上方 warning。');
    process.exit(0);
  }
  console.log('结果：PASS —— Overview 完整实现了 Plan。');
  process.exit(0);
}

main();
