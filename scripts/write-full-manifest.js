'use strict';
/**
 * 生成 Full Run 的 manifest.json（实验可复现所需的最小事实集）。
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = process.cwd();
const blocksDir = path.join(ROOT, 'experiments', 'stage2-full', 'blocks');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

const planRaw = fs.readFileSync(path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json'), 'utf8');
const docRaw = fs.readFileSync(path.join(ROOT, '测试文档', '18-context-consumption-semantic-model.md'), 'utf8');
const promptRaw = fs.readFileSync(path.join(ROOT, 'ai', 'stage2-blocks.prompt.md'), 'utf8');
const overview = JSON.parse(fs.readFileSync(path.join(ROOT, 'experiments', 'stage2-full', 'overview.generated.json'), 'utf8'));

const dirs = fs.readdirSync(blocksDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const successful = [];
const failed = [];
let startedAt = null;
let completedAt = null;
let model = null;
let promptSha = null;

dirs.forEach((id) => {
  const reqFile = path.join(blocksDir, id, 'request.json');
  const checkFile = path.join(blocksDir, id, 'check-block.txt');
  if (!fs.existsSync(reqFile) || !fs.existsSync(checkFile)) {
    failed.push({ id, reason: '缺少产物' });
    return;
  }
  const req = JSON.parse(fs.readFileSync(reqFile, 'utf8'));
  const check = fs.readFileSync(checkFile, 'utf8');
  if (!model) model = req.model;
  if (!promptSha) promptSha = req.promptSha256;
  if (req.startedAt && (!startedAt || req.startedAt < startedAt)) startedAt = req.startedAt;
  if (req.finishedAt && (!completedAt || req.finishedAt > completedAt)) completedAt = req.finishedAt;
  if (check.includes('结果：FAIL')) failed.push({ id, reason: 'check-block FAIL' });
  else successful.push(id);
});

const manifest = {
  stage: 2,
  plan: 'gold',
  planPath: 'fixtures/context-consumption.overview-plan.json',
  planSha256: sha(planRaw),
  sourceDocument: '测试文档/18-context-consumption-semantic-model.md',
  sourceDocumentSha256: sha(docRaw),
  promptPath: 'ai/stage2-blocks.prompt.md',
  promptSha256: sha(promptRaw),
  promptSha256Short: promptSha,
  model,
  startedAt,
  completedAt,
  successfulBlocks: successful,
  failedBlocks: failed,
  successfulCount: successful.length,
  totalPlanBlocks: overview.generation.totalPlanBlocks,
  complete: overview.generation.complete,
  artifacts: [
    'experiments/stage2-full/blocks/<block-id>/{request.json,raw.md,block.generated.json,check-block.txt}',
    'experiments/stage2-full/overview.generated.json',
    'experiments/stage2-full/check-overview.txt',
    'experiments/stage2-full/overview-preview.html',
    'experiments/stage2-full/full-run-report.md',
    'experiments/stage2-full/pilot-summary.json',
  ],
  note: 'AI 只输出 { shape, content }；全部固定字段由 scripts/ai-block.js 从 overview-plan 注入。',
};

fs.writeFileSync(path.join(ROOT, 'experiments', 'stage2-full', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('manifest.json 已写出');
console.log(`  plan sha256        ${manifest.planSha256.slice(0, 16)}…`);
console.log(`  prompt sha256      ${manifest.promptSha256.slice(0, 16)}…`);
console.log(`  source doc sha256  ${manifest.sourceDocumentSha256.slice(0, 16)}…`);
console.log(`  model              ${manifest.model}`);
console.log(`  successfulBlocks   ${manifest.successfulCount} / ${manifest.totalPlanBlocks}`);
console.log(`  failedBlocks       ${manifest.failedBlocks.length === 0 ? '无' : JSON.stringify(manifest.failedBlocks)}`);
console.log(`  started / ended    ${manifest.startedAt} → ${manifest.completedAt}`);
