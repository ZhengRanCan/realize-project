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

const {buildSourceRegistry}=require('../app/shared/source-coordinates');
const registry=buildSourceRegistry(fs.readFileSync(DOC,'utf8'),{sourcePath:path.relative(ROOT,DOC).replace(/\\/g,'/')});
const payload={document:{path:registry.document.path,title:registry.document.title,totalLines:registry.document.totalLines},sections:registry.sections};
const sections=payload.sections,lines={length:payload.document.totalLines};
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
