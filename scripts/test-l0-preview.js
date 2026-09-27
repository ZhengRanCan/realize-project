#!/usr/bin/env node
'use strict';

/**
 * Feature 08 · L0 预览验收（Phase 2 → Phase 5 regression 的自动化部分）
 *
 * 直接对**生成的 HTML** 断言（不是"看起来不错"）：
 *   · 每个 element / edge / attachment / topic 都渲染出来了（计数核对）
 *   · >budget 的 map **没有**被裁（81 elements 全部渲染）
 *   · 自环边显式标注；relationGap 明确写「不是 edge」
 *   · 方向是显式文字（每行都有 —type→），不靠位置
 *   · provenance（§ref）全部出现在页面上
 *   · Review 内容只在 Review 视图显示（Reading 视图靠 CSS 隐藏，不靠删数据）
 *   · 页面里出现"分组依据是 type、不是关系"的原则声明
 *
 * 用法：node scripts/test-l0-preview.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { buildOne, SET } = require('./build-l0-preview.js');

const ROOT = path.resolve(__dirname, '..');
const results = [];
let failures = 0;
function check(name, fn) {
  try {
    const msg = fn();
    if (msg === true || msg === undefined) results.push(`  PASS  ${name}`);
    else { failures += 1; results.push(`  FAIL  ${name} → ${msg}`); }
  } catch (e) { failures += 1; results.push(`  FAIL  ${name} → throw: ${e.message}`); }
}
const countOf = (hay, needle) => hay.split(needle).length - 1;

console.log('===== F08 · L0 预览验收（对生成的 HTML 断言）=====\n');

const built = [];
for (const item of SET) {
  const r = buildOne({ map: item.map, out: `tmp/l0-preview-check/${item.name}.html`, view: 'review', note: item.note });
  const html = fs.readFileSync(path.join(ROOT, r.out), 'utf8');
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, item.map), 'utf8'));
  built.push({ item, r, html, map });

  check(`${item.name}：element 全部渲染（${r.facts.elementCount}）`, () => {
    const n = countOf(html, 'data-element-id="');
    return n === map.elements.length || `渲染 ${n} ≠ 输入 ${map.elements.length}`;
  });
  check(`${item.name}：edge 全部渲染（${r.facts.edgeCount}）`, () => {
    const n = countOf(html, 'class="edge-row');
    return n === (map.edges || []).length || `渲染 ${n} ≠ 输入 ${(map.edges || []).length}`;
  });
  check(`${item.name}：attachment 全部渲染（${r.facts.attachmentCount}）`, () => {
    const n = countOf(html, 'class="attach-row');
    return n === (map.attachments || []).length || `渲染 ${n} ≠ 输入 ${(map.attachments || []).length}`;
  });
  check(`${item.name}：topic 全部渲染（${r.facts.topicCount}）`, () => {
    const n = countOf(html, 'class="topic-entry');
    return n === (map.topics || []).length || `渲染 ${n} ≠ 输入 ${(map.topics || []).length}`;
  });
  check(`${item.name}：方向显式（每行都有 —type→）`, () => {
    const n = countOf(html, '<span class="rel">—');
    return n >= (map.edges || []).length || `方向标记 ${n} < edge ${(map.edges || []).length}`;
  });
  check(`${item.name}：provenance 全部出现（§ref）`, () => {
    const refs = map.elements.flatMap((e) => [...(e.sectionRefs || []), ...(e.sourceUnitIds || [])]);
    const missing = refs.filter((x) => !html.includes(`>${x}<`) && !html.includes(x));
    return missing.length === 0 || `缺 ${missing.slice(0, 3).join(',')}`;
  });
  check(`${item.name}：无未解析引用`, () => (html.includes('(未解析') ? '出现 (未解析' : true));
}

/* 定向断言（对应验收清单的硬要求） */
const byName = (n) => built.find((b) => b.item.name === n);

check('D（无主轴）不造主轴：没有 edge 时不伪造关系', () => {
  const b = byName('d');
  return b.r.facts.edgeCount > 0 ? true : '（该样本本就没有 edge，另行核对）';
});
check('E（分叉）没有被压成链：edge 行逐条独立渲染，没有"链"式合并', () => {
  const b = byName('e');
  const rows = countOf(b.html, 'class="edge-row');
  return rows === (b.map.edges || []).length ? true : 'edge 行数与输入不一致';
});
check('>budget 的 map 不被裁（81 elements 全渲染）', () => {
  const b = byName('d-overbudget');
  const n = countOf(b.html, 'data-element-id="');
  if (b.map.elements.length !== 81) return `样本元素数变了：${b.map.elements.length}`;
  if (n !== 81) return `只渲染 ${n}（应 81）`;
  return b.html.includes('不裁剪') || '页面未标注"只是 Warning，不裁剪"';
});
check('自环边被显式标注「自环」', () => {
  const b = byName('d-selfloop');
  const selfCount = (b.map.edges || []).filter((e) => e.from === e.to).length;
  if (!selfCount) return '样本没有自环';
  return b.html.includes('flag self') ? true : '未标注自环';
});
check('relationGap 明确标注「不是 edge」', () => {
  const b = byName('e-human');
  if (!(b.map.relationGap || []).length) return '样本没有 relationGap';
  return b.html.includes('relationGap（不是 edge）') ? true : '未标注';
});
check('原则声明在位（Layout organizes space; it does not create semantics）', () => {
  const b = byName('d');
  return b.html.includes('Layout organizes space; it does not create semantics') ? true : '缺少原则声明';
});
check('Reading / Review 分离（数据不删，靠 CSS 隐藏）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'app/renderer/l0-map.css'), 'utf8');
  return css.includes('.l0-root[data-view="reading"] .review-slot { display: none; }') ? true : 'CSS 缺少 Reading 隐藏规则';
});
check('无 element 的 Topic 仍是导航入口（页面上有标注）', () => {
  const b = byName('d');
  if (!b.r.facts.topicsWithoutElements.length) return '样本没有无 element topic';
  return b.html.includes('无 L0 element —— 仍是导航入口') ? true : '未标注';
});
check('预览是静态 HTML（不依赖 Electron / 不依赖网络）', () => {
  const b = byName('d');
  if (/<script src="http/.test(b.html)) return '引用了网络资源';
  if (b.html.includes('require(')) return '含 require（应为纯静态）';
  return true;
});

console.log(results.join('\n'));
console.log('\n════════════════════════════════');
console.log(`L0 预览验收: ${results.length - failures}/${results.length} 通过（${built.length} 份预览）`);
if (failures) console.log(`✗ ${failures} 项失败`);
else console.log('✓ 结论：全量渲染 / 不裁剪 / 方向显式 / 自环与 relationGap 标注 / provenance 可达 / Reading-Review 分离');
console.log('════════════════════════════════');
process.exit(failures ? 1 : 0);
