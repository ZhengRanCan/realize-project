#!/usr/bin/env node
'use strict';

/**
 * Overview 覆盖审计：把 docs/overview-coverage.md 的验收标准变成可重复执行的检查。
 *
 * 检查项：
 * 1. 每个区块都要有 stage / sources / defaultExpanded / reviewObjects；
 * 2. reviewObjects 必须指向真实存在的 Review Object；
 * 3. 原文每一节都必须至少被一个区块的 sources 引用（语义覆盖的最小保证）；
 * 4. 每条 Decision 都必须能被至少一个区块关联；
 * 5. 摘要 / 章节结构本身的完整性（段数 = 4，顺序 = what/how/prove/boundary）。
 *
 * 用法：node scripts/audit-overview.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'fixtures', 'context-consumption.json');
const DOC = path.join(ROOT, '测试文档', '18-context-consumption-semantic-model.md');

const model = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const overview = model.overview;
const blocks = overview.sections.flatMap((s) => s.blocks);

const problems = [];
const notes = [];

/* ---- 5. 段落结构 ---- */
const expectedSections = ['what', 'how', 'prove', 'boundary'];
const actualSections = overview.sections.map((s) => s.id);
if (actualSections.join(',') !== expectedSections.join(',')) {
  problems.push(`段落顺序异常：${actualSections.join(',')}，期望 ${expectedSections.join(',')}`);
} else {
  notes.push(`段落结构正确：${actualSections.join(' → ')}`);
}

/* ---- 1. 区块必填项 ---- */
blocks.forEach((b) => {
  ['stage', 'sources', 'defaultExpanded', 'content'].forEach((key) => {
    if (b[key] === undefined) problems.push(`${b.id}: 缺少 ${key}`);
  });
  if (!b.reviewObjects || b.reviewObjects.length === 0) {
    problems.push(`${b.id}: 没有 reviewObjects，无法回指 Review Object`);
  }
  if (!b.sources || b.sources.length === 0) {
    problems.push(`${b.id}: 没有 sources，无法回原文核对`);
  }
});

/* ---- 2. reviewObjects 引用有效 ---- */
const validIds = new Set(
  [...model.decisions, ...model.facts, ...model.gaps, ...model.openQuestions, ...(model.models || [])].map((x) => x.id)
);
blocks.forEach((b) => {
  (b.reviewObjects || []).forEach((id) => {
    if (!validIds.has(id)) problems.push(`${b.id}: reviewObjects 引用了不存在的 "${id}"`);
  });
});

/* ---- 3. 原文每节都被引用 ---- */
const docLines = fs.readFileSync(DOC, 'utf8').split(/\r?\n/);
const docSections = [];
docLines.forEach((line, index) => {
  const h = line.match(/^##\s+(.+)$/);
  if (h) docSections.push({ label: h[1].trim(), line: index + 1 });
});
const referenced = new Set(blocks.flatMap((b) => b.sources));
const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
/** 把「十一」「十五」这类中文序号转成区块 sources 里使用的阿拉伯数字（§11、§15）。 */
function cnToNumber(text) {
  if (text === '十') return 10;
  if (text.startsWith('十')) return 10 + (CN_DIGITS[text[1]] || 0);
  if (text.endsWith('十')) return (CN_DIGITS[text[0]] || 0) * 10;
  if (text.includes('十')) {
    const [tens, ones] = text.split('十');
    return (CN_DIGITS[tens] || 0) * 10 + (CN_DIGITS[ones] || 0);
  }
  return CN_DIGITS[text] || 0;
}
const missing = docSections.filter((section) => {
  const m = section.label.match(/^([一二三四五六七八九十]+)、/);
  if (!m) return false;
  return !referenced.has(`§${cnToNumber(m[1])}`);
});
if (missing.length > 0) {
  missing.forEach((s) => problems.push(`原文第 ${s.line} 行「${s.label}」没有被任何区块的 sources 引用`));
} else {
  notes.push(`原文 ${docSections.length} 节全部被至少一个区块引用`);
}

/* ---- 4. 每条 Decision 都能被关联 ---- */
const referencedDecisions = new Set(blocks.flatMap((b) => b.reviewObjects || []));
const orphanDecisions = model.decisions.filter((d) => !referencedDecisions.has(d.id)).map((d) => d.id);
if (orphanDecisions.length > 0) {
  problems.push(`以下 Decision 没有任何区块关联：${orphanDecisions.join(', ')}`);
} else {
  notes.push(`全部 ${model.decisions.length} 条 Decision 都能被区块关联`);
}

/* ---- 输出 ---- */
console.log('=== Overview 覆盖审计 ===');
const typeCount = {};
blocks.forEach((b) => {
  typeCount[b.content.type] = (typeCount[b.content.type] || 0) + 1;
});
console.log(`区块 ${blocks.length} 个 | 承载形式：${Object.entries(typeCount).map(([k, v]) => `${k}×${v}`).join(', ')}`);
const expanded = blocks.filter((b) => b.defaultExpanded).length;
console.log(`默认展开 ${expanded} / 折叠 ${blocks.length - expanded}`);
console.log('');
notes.forEach((n) => console.log(`✓ ${n}`));
if (problems.length > 0) {
  console.log('');
  problems.forEach((p) => console.log(`✗ ${p}`));
  console.log(`\n结果：FAILED（${problems.length} 项）`);
  process.exit(1);
}
console.log('\n结果：PASSED');
