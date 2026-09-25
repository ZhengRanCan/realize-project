#!/usr/bin/env node
'use strict';

/**
 * 无 GUI 的端到端模拟：验证 “fixture → human-review.json → Implementation Gate” 闭环。
 *
 * 它替代不了人工点击 UI，但可以确定地证明：
 *   1) fixture 能通过校验并进入 Review UI 所需的数据形态；
 *   2) human-review.json 的读写与 design-review.json 完全分离；
 *   3) Implementation Gate 的判定与 agent.md 第十七节一致。
 *
 * 用法：node scripts/simulate-review.js [--out path/to/human-review.sample.json]
 */

const path = require('node:path');
const fs = require('node:fs');

const { validate } = require('../app/shared/schema-validator');
const { semanticCheck } = require('../app/shared/review-model');
const semantics = require('../app/shared/semantics');
const { evaluateGate, buildHumanReviewSkeleton } = semantics;

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'fixtures', 'context-consumption.json');
const SCHEMA = path.join(ROOT, 'schema', 'design-review.schema.json');

function outPathFromArgs() {
  const index = process.argv.indexOf('--out');
  if (index !== -1 && process.argv[index + 1]) return path.resolve(process.argv[index + 1]);
  return null;
}

function check(label, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

let allOk = true;

const model = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8'));

console.log('=== Step 1: fixture 进入 Review UI 的前置校验 ===');
const schemaResult = validate(schema, model);
allOk = check('Schema 校验', schemaResult.valid, schemaResult.valid ? '' : schemaResult.errors.join('; ')) && allOk;
const semantic = semanticCheck(model);
allOk = check('一致性检查', semantic.errors.length === 0, semantic.errors.join('; ')) && allOk;
allOk = check(
  'AI 侧 Decision 全部为 pending',
  model.decisions.every((d) => d.status === 'pending')
) && allOk;

console.log('\n=== Step 2: 初始 Gate（尚未人工审核）===');
const skeleton = buildHumanReviewSkeleton(model);
const gateBefore = evaluateGate(model, skeleton);
allOk = check('Gate 应当是 BLOCKED', gateBefore.ready === false, `${gateBefore.blockers.length} 项阻塞`);
const kinds = new Set(gateBefore.blockers.map((b) => b.kind));
allOk = check('包含 pending-decision', kinds.has('pending-decision')) && allOk;
allOk = check('包含 blocking-open-question', kinds.has('blocking-open-question')) && allOk;

const blockingQuestions = model.openQuestions.filter((q) =>
  semantics.isQuestionBlocking(q, 'pending')
);
const nonBlockingQuestions = model.openQuestions.filter(
  (q) => !semantics.isQuestionBlocking(q, 'pending')
);
allOk = check(
  'deferred / research 类别不计入阻塞',
  gateBefore.blockers.filter((b) => b.kind === 'blocking-open-question').length === blockingQuestions.length,
  `阻塞问题 ${blockingQuestions.length} 条，类别：${[...new Set(blockingQuestions.map((q) => q.category))].join(', ')}`
) && allOk;
allOk = check(
  '非阻塞 Question 不出现在 Gate 中',
  nonBlockingQuestions.every((q) => !gateBefore.blockers.some((b) => b.id === q.id)),
  `${nonBlockingQuestions.length} 条：${nonBlockingQuestions.map((q) => q.id).join(', ')}`
) && allOk;

console.log('\n=== Step 2b: Review Dashboard 摘要 ===');
const summaryBefore = semantics.reviewSummary(model, skeleton);
allOk = check(
  'root Decision 单独计数',
  summaryBefore.decisions.rootTotal > 0 && summaryBefore.decisions.rootTotal < summaryBefore.decisions.total,
  `root ${summaryBefore.decisions.rootTotal} / 全部 ${summaryBefore.decisions.total}`
) && allOk;
allOk = check(
  'Next Review Item 是未处理的 root Decision',
  !!summaryBefore.next && summaryBefore.next.kind === 'decision',
  summaryBefore.next ? `${summaryBefore.next.id} — ${summaryBefore.next.reason}` : '（无）'
) && allOk;
allOk = check(
  'High-impact Gap 已计数',
  summaryBefore.gaps.high > 0,
  `high ${summaryBefore.gaps.high}，未确认 ${summaryBefore.gaps.highUnresolved}`
) && allOk;

console.log('\n=== Step 3: 模拟人工审核（修改 human-review 副本，不动 design-review.json）===');
const human = JSON.parse(JSON.stringify(skeleton));
const decisions = model.decisions;

// 模拟一个真实的人工部分审核：批准多数，留一条 needs-revision、一条 needs-evidence，并关闭部分 Open Question。
human.decisions[decisions[0].id] = { status: 'approved', comment: '三级语义边界清晰，与 Receipt/Availability 的区分成立。' };
human.decisions[decisions[1].id] = { status: 'approved', comment: '同意不引入反事实因果承诺。' };
human.decisions[decisions[2].id] = { status: 'approved', comment: 'Consumption 与 Output Alignment 必须分开报告。' };
human.decisions[decisions[3].id] = { status: 'approved', comment: '' };
human.decisions[decisions[4].id] = { status: 'needs-revision', comment: '需要补充说明如何在不依赖输出差异的前提下证明实际消费。' };
human.decisions[decisions[5].id] = { status: 'approved', comment: '' };
human.decisions[decisions[6].id] = { status: 'approved', comment: 'Primary Consumption Point 定在 outline generation 合理。' };
human.decisions[decisions[7].id] = { status: 'needs-evidence', comment: '需要源码证据确认 scene-content route 的 formal 分支实际行为。' };
human.decisions[decisions[8].id] = { status: 'approved', comment: '' };
human.decisions[decisions[9].id] = { status: 'approved', comment: '' };
human.decisions[decisions[10].id] = { status: 'approved', comment: '' };
human.decisions[decisions[11].id] = { status: 'approved', comment: '本文件不构成实现授权，确认。' };

model.openQuestions.forEach((q) => {
  const blocking = semantics.isQuestionBlocking(q, 'pending');
  human.openQuestions[q.id] = {
    status: blocking ? 'deferred' : 'pending',
    comment: blocking ? '已知，延后到实现设计阶段解决。' : '',
  };
});
model.gaps.forEach((g) => {
  human.gaps[g.id] = { status: 'confirmed', comment: '' };
});

const gateAfter = evaluateGate(model, human);
console.log(`  人工审核后阻塞项：${gateAfter.blockers.length}`);
gateAfter.blockers.forEach((b) => console.log(`   - [${b.kind}] ${b.id}: ${b.detail}`));
allOk = check('still blocked（存在 needs-revision / needs-evidence）', gateAfter.ready === false) && allOk;
allOk = check(
  '把阻塞问题标为 Deferred 也不会放行（必须 Resolved）',
  gateAfter.blockers.some((b) => b.kind === 'blocking-open-question')
) && allOk;

console.log('\n=== Step 4: 全部批准后 Gate 应放行 ===');
const fullApproval = JSON.parse(JSON.stringify(human));
decisions.forEach((d) => {
  fullApproval.decisions[d.id] = { status: 'approved', comment: '' };
});
blockingQuestions.forEach((q) => {
  fullApproval.openQuestions[q.id] = { status: 'resolved', comment: '已由人工关闭。' };
});
const gateReady = evaluateGate(model, fullApproval);
allOk = check('Gate READY FOR IMPLEMENTATION', gateReady.ready === true, gateReady.blockers.map((b) => b.id).join(', ')) && allOk;

const summaryReady = semantics.reviewSummary(model, fullApproval);
allOk = check(
  '放行后 Next Review Item 为 high-impact Gap 或 supporting Decision 或 null',
  summaryReady.next === null || ['gap', 'decision'].includes(summaryReady.next.kind),
  summaryReady.next ? `${summaryReady.next.id}（${summaryReady.next.reason}）` : '所有条目已处理'
) && allOk;

console.log('\n=== Step 5: 文件分离检查 ===');
const designText = fs.readFileSync(FIXTURE, 'utf8');
allOk = check('design-review.json 中不包含人工审批状态', !/"approved"|"rejected"|"needs-revision"|"needs-evidence"/.test(designText)) && allOk;
allOk = check(
  'design-review.json 中没有任何 source-verified 证据',
  !/"source-verified"/.test(designText),
  'Phase 1 不读源码，不得伪装成已核实'
) && allOk;

const target = outPathFromArgs();
if (target) {
  const payload = {
    reviewVersion: 1,
    designId: model.design.id,
    designReviewPath: path.relative(ROOT, FIXTURE),
    updatedAt: new Date().toISOString(),
    decisions: human.decisions,
    openQuestions: human.openQuestions,
    gaps: human.gaps,
  };
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`\n已写出示例 human-review.json: ${target}`);
  console.log('注意：这是模拟产物。真实 human-review.json 只由 Electron UI 中的人工点击写入。');
}

console.log('');
if (allOk) {
  console.log('结果：PASSED —— fixture → human-review.json → Implementation Gate 闭环成立。');
} else {
  console.log('结果：FAILED');
  process.exit(1);
}
