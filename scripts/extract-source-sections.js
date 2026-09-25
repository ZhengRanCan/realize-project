#!/usr/bin/env node
'use strict';

/**
 * 把原 Markdown 切成"可回查的章节"，产出 docs/source-sections.json。
 *
 * 用途：Overview 里每个区块的 `Source: §9, §10` 点开时，右侧直接显示对应原文段落
 * —— 平时靠视觉重述理解，怀疑某一点时一键回原文核对。
 *
 * 切分规则：
 * - 文档头（正文开始到第一个 `##`）记为 §0
 * - 每个 `## 一、…` 记为 §1 … §15，标签用阿拉伯数字，与 fixture 的 sources 对齐
 * - 保留行号范围与原始 Markdown 文本
 *
 * 用法：node scripts/extract-source-sections.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DOC = path.join(ROOT, '测试文档', '18-context-consumption-semantic-model.md');
const OUT = path.join(ROOT, 'docs', 'source-sections.json');

const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

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

const lines = fs.readFileSync(DOC, 'utf8').split(/\r?\n/);

/** @type {{label:string,title:string,startLine:number,endLine:number,lines:string[]}[]} */
const raw = [];
let current = { label: '§0', title: '文档头（定位与非目标声明）', startLine: 1, lines: [] };

const flush = (endLine) => {
  current.endLine = endLine;
  raw.push(current);
};

lines.forEach((line, index) => {
  const h2 = line.match(/^##\s+(.+)$/);
  const h1 = line.match(/^#\s+(.+)$/);
  if (h1 && !h2) {
    // 文档大标题：并入 §0，不单独成节
    current.lines.push(line);
    return;
  }
  if (h2) {
    flush(index); // 上一节到本行之前结束
    const label = h2[1].trim();
    const m = label.match(/^([一二三四五六七八九十]+)、\s*(.*)$/);
    current = {
      label: m ? `§${cnToNumber(m[1])}` : `§?${label}`,
      title: m ? m[2].trim() : label,
      startLine: index + 1,
      lines: [line],
    };
    return;
  }
  current.lines.push(line);
});
flush(lines.length);

const sections = raw
  .filter((s) => s.lines.some((l) => l.trim() !== ''))
  .map((s) => ({
    label: s.label,
    title: s.title,
    startLine: s.startLine,
    endLine: s.endLine,
    lines: s.endLine - s.startLine + 1,
    text: s.lines.join('\n').replace(/\s+$/, ''),
  }));

const payload = {
  document: {
    path: path.relative(ROOT, DOC).replace(/\\/g, '/'),
    title: lines[0].replace(/^#\s*/, '').trim(),
    totalLines: lines.length,
  },
  sections,
};

fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`已写出 ${path.relative(ROOT, OUT)}：${sections.length} 节，覆盖 ${lines.length} 行`);
sections.forEach((s) => {
  console.log(`  ${s.label.padEnd(5)} L${String(s.startLine).padStart(3)}-${String(s.endLine).padStart(3)}  ${s.title}`);
});

// 自检：fixture 里用到的 sources 标签必须都能在这里找到
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'context-consumption.json'), 'utf8'));
const used = new Set(fixture.overview.sections.flatMap((sec) => sec.blocks.flatMap((b) => b.sources)));
const available = new Set(sections.map((s) => s.label));
const missing = [...used].filter((label) => !available.has(label));
if (missing.length > 0) {
  console.error(`✗ fixture 引用了不存在的章节标签：${missing.join(', ')}`);
  process.exit(1);
}
console.log(`✓ fixture 用到的 ${used.size} 个章节标签全部可回查`);
