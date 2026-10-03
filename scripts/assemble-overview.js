#!/usr/bin/env node
'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

/**
 * 确定性组装器：把 Gold overview-plan 与 Stage 2 生成的 block.content 组装成完整 overview.generated.json。
 *
 * 不调用 AI。只做组装：
 * - 按 Plan 顺序组装 blocks
 * - 保留 stage / sourceRefs / reviewObjects / covers / defaultExpanded（全部来自 Plan，不由 AI 提供）
 * - 注入 AI 生成的 content
 * - 汇总 generation metadata
 *
 * 顶层结构对齐现有 overview fixture（design-review.json 的 overview 字段），
 * 但额外提供 blocks 线性列表与 stages 摘要，便于 check-overview 与统计。
 *
 * 用法：
 *   node scripts/assemble-overview.js \
 *     --plan samples/context-consumption/overview-plan.json \
 *     --blocks experiments/stage2-full/blocks \
 *     --out experiments/stage2-full/overview.generated.json
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = resolveRepositoryPath(__dirname, '..');

const DEFAULTS = {
  plan: joinRepositoryPath('fixtures', 'context-consumption.overview-plan.json'),
  design: joinRepositoryPath('fixtures', 'context-consumption.json'),
  blocks: joinRepositoryPath('experiments', 'stage2-full', 'blocks'),
  out: joinRepositoryPath('experiments', 'stage2-full', 'overview.generated.json'),
  model: null,
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

const sha = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

const args = parseArgs(process.argv.slice(2));

/* ------------------------------------------------------------------ *
 * 组装
 * ------------------------------------------------------------------ */

async function main() {
  const planPath = resolveRepositoryPath(ROOT, args.plan);
  const blocksDir = resolveRepositoryPath(ROOT, args.blocks);
  const outPath = resolveRepositoryPath(ROOT, args.out);
  const designPath = resolveRepositoryPath(ROOT, args.design);

  const planRaw = fs.readFileSync(planPath, 'utf8');
  const plan = JSON.parse(planRaw);
  const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));

  const STAGE_TITLES = Object.fromEntries(
    (design.overview.sections || []).map((s) => [s.id, { title: s.title, purpose: s.purpose }])
  );

  const blocks = [];
  const failures = [];
  const missing = [];
  const metadata = { model: null, promptSha256: null, requestFiles: [] };

  plan.blocks.forEach((planBlock) => {
    const blockDir = joinRepositoryPath(blocksDir, planBlock.id);
    const generatedFile = joinRepositoryPath(blockDir, 'block.generated.json');
    const requestFile = joinRepositoryPath(blockDir, 'request.json');
    const checkFile = joinRepositoryPath(blockDir, 'check-block.txt');

    if (!fs.existsSync(generatedFile)) {
      missing.push(planBlock.id);
      return;
    }

    const generated = JSON.parse(fs.readFileSync(generatedFile, 'utf8'));
    const request = fs.existsSync(requestFile) ? JSON.parse(fs.readFileSync(requestFile, 'utf8')) : {};
    const checkText = fs.existsSync(checkFile) ? fs.readFileSync(checkFile, 'utf8') : '';

    if (!metadata.model && request.model) metadata.model = request.model;
    if (!metadata.promptSha256 && request.promptSha256) metadata.promptSha256 = request.promptSha256;
    metadata.requestFiles.push(path.relative(ROOT, requestFile).replace(/\\/g, '/'));

    const verdict = checkText.includes('结果：PASS WITH WARNINGS')
      ? 'PASS_WITH_WARNINGS'
      : checkText.includes('结果：PASS')
        ? 'PASS'
        : checkText.includes('结果：FAIL')
          ? 'FAIL'
          : 'UNKNOWN';

    if (verdict === 'FAIL') failures.push(planBlock.id);

    // 展开 sourceRefs 的 section 标签，作为 renderer 的 sources 字段
    const sources = [...new Set((planBlock.sourceRefs || []).map((r) => r.section))];

    blocks.push({
      // —— 固定字段：全部来自 Plan，AI 无法修改 ——
      id: planBlock.id,
      title: planBlock.title,
      stage: planBlock.stage,
      role: planBlock.role === 'ambient' ? 'ambient' : 'normal',
      sources,
      defaultExpanded: planBlock.defaultExpanded,
      reviewObjects: planBlock.reviewObjects,
      // —— 以下三项是给 check-overview 用的追溯信息（renderer 会忽略未知字段）——
      covers: planBlock.covers,
      sourceRefs: planBlock.sourceRefs,
      shape: planBlock.shape,
      // —— AI 生成的 content ——
      content: generated.content,
      // —— 生成元数据 ——
      generation: {
        verdict,
        model: request.model || null,
        promptSha256: request.promptSha256 || null,
        latencyMs: request.latencyMs || null,
        finishReason: request.finishReason || null,
      },
    });
  });

  // stages 摘要：按 Plan 的 stage 分组，保持 Plan 顺序
  const stageOrder = [...new Set(plan.blocks.map((b) => b.stage))];
  const stages = stageOrder.map((id) => ({
    id,
    title: (STAGE_TITLES[id] && STAGE_TITLES[id].title) || id,
    purpose: (STAGE_TITLES[id] && STAGE_TITLES[id].purpose) || '',
    blockIds: blocks.filter((b) => b.stage === id).map((b) => b.id),
  }));

  const planIds = plan.blocks.map((b) => b.id);
  const generatedIds = blocks.map((b) => b.id);
  const extra = generatedIds.filter((id) => !planIds.includes(id));
  const complete = missing.length === 0 && extra.length === 0 && failures.length === 0;

  const output = {
    document: {
      id: design.design.id,
      title: design.design.title,
      summary: design.design.summary,
      sourceDocuments: design.design.sourceDocuments,
    },
    generation: {
      plan: 'gold',
      planPath: path.relative(ROOT, planPath).replace(/\\/g, '/'),
      planSha256: sha(planRaw),
      model: metadata.model,
      promptSha256: metadata.promptSha256,
      stage: 2,
      complete,
      totalPlanBlocks: plan.blocks.length,
      generatedBlocks: blocks.length,
      failedBlocks: failures,
      missingBlocks: missing,
      extraBlocks: extra,
      assembledAt: new Date().toISOString(),
    },
    stages,
    blocks,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log('=== 组装 overview.generated.json ===');
  console.log(`plan      ${path.relative(ROOT, planPath)}（sha ${output.generation.planSha256}）`);
  console.log(`blocks    ${blocks.length} / ${plan.blocks.length} 已生成`);
  if (missing.length > 0) console.log(`缺失      ${missing.join(', ')}`);
  if (failures.length > 0) console.log(`FAIL      ${failures.join(', ')}`);
  console.log(`complete  ${complete}`);
  console.log(`输出      ${path.relative(ROOT, outPath)}`);
  const stageCounts = stages.map((s) => `${s.id}=${s.blockIds.length}`).join(' ');
  console.log(`stages    ${stageCounts}`);

  if(args['bundle-out']) {
    const result=await require('./export-reading-bundle').exportReadingBundle({source:args.source,design:designPath,plan:planPath,generated:outPath,map:args.map,out:args['bundle-out'],analysisId:args['analysis-id']});
    console.log('bundle    '+result.manifestPath);
  }
  return 0;
}

if(require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});
