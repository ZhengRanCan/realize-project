#!/usr/bin/env node
'use strict';

/**
 * Feature 08 · L0 预览验收（Phase 2 → Phase 4.1 → Phase 5 regression 的自动化部分）
 *
 * 直接对**生成的 HTML** 断言（不是"看起来不错"）：
 *   · 每个 element 都渲染出来了（Reading 里是节点或约束角标；Review 里是卡片）——不丢、不裁
 *   · **线数 == edge 数**：不造线（没有 edge 就没有线），也不丢线
 *   · 每条线都有方向箭头（方向是画出来的）
 *   · Reading **不显示**机器 ID / type / role；节点标题是切开的短名
 *   · Review 保留全套工程明细（按 element.type 分区 + 完整 edge + provenance + 校验）
 *   · Topic 默认只给标题（导航，不是第二篇文档），details 按需展开
 *   · 自环边显式标注；relationGap 明确写「不是 edge」
 *   · 预览**真的加载了 renderer 脚本**（不是只写着"调用 bindInteractions"却根本没加载）
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
/** 从 `from` 标记切到 `to` 标记（视图分区的 HTML 是连续块） */
const slice = (html, from, to) => {
  const a = html.indexOf(from);
  if (a < 0) return '';
  const b = to ? html.indexOf(to, a) : -1;
  return b > a ? html.slice(a, b) : html.slice(a);
};
const uniqElements = (hay) => new Set([...hay.matchAll(/data-element-id="([^"]+)"/g)].map((m) => m[1]));

console.log('===== F08 · L0 预览验收（对生成的 HTML 断言）=====\n');

const built = [];
for (const item of SET) {
  const r = buildOne({ map: item.map, out: `tmp/l0-preview-check/${item.name}.html`, view: 'reading', note: item.note });
  const html = fs.readFileSync(path.join(ROOT, r.out), 'utf8');
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, item.map), 'utf8'));
  const reading = slice(html, 'id="l0-reading"', 'id="l0-review-board"');
  const review = slice(html, 'id="l0-review-board"');
  built.push({ item, r, html, map, reading, review });

  /* ---- 不丢：两个视图各自都要覆盖全部 element ---- */
  check(`${item.name}：element 全部渲染（${r.facts.elementCount}）`, () => {
    const n = uniqElements(html).size;
    return n === map.elements.length || `渲染 ${n} ≠ 输入 ${map.elements.length}`;
  });
  check(`${item.name}：Reading 覆盖全部 element（节点或约束角标，不丢）`, () => {
    const n = uniqElements(reading).size;
    return n === map.elements.length || `Reading 覆盖 ${n} ≠ ${map.elements.length}`;
  });
  check(`${item.name}：Review 覆盖全部 element`, () => {
    const n = uniqElements(review).size;
    return n === map.elements.length || `Review 覆盖 ${n} ≠ ${map.elements.length}`;
  });

  /* ---- 关系优先：线就是 edge ---- */
  check(`${item.name}：Reading 线数 == edge 数（不造线、不丢线）`, () => {
    const n = countOf(reading, '<path class="l0-edge');
    return n === (map.edges || []).length || `线 ${n} ≠ edge ${(map.edges || []).length}`;
  });
  check(`${item.name}：每条线都有方向箭头（方向是画出来的）`, () => {
    const n = countOf(reading, 'marker-end="url(#l0-arrow)"');
    return n === (map.edges || []).length || `箭头 ${n} ≠ edge ${(map.edges || []).length}`;
  });
  check(`${item.name}：每条线都有 relation 类型标签`, () => {
    const n = countOf(reading, 'class="l0-edge-label"');
    return n === (map.edges || []).length || `标签 ${n} ≠ edge ${(map.edges || []).length}`;
  });
  check(`${item.name}：节点数 == element − 约束角标（约束不抢节点位，但也不消失）`, () => {
    const edgeEnds = new Set((map.edges || []).flatMap((e) => [e.from, e.to]));
    const nodes = countOf(reading, '<article class="l0-node');
    // 角标必须挂在"真正占位的节点"上；挂不到的自己升为节点（否则就是丢元素）
    const nodeIds = uniqElements(reading);
    const rendered = new Set();
    for (const m of reading.matchAll(/<article class="l0-node[^>]*?data-element-id="([^"]+)"/g)) rendered.add(m[1]);
    const liBadges = new Set([...reading.matchAll(/class="attach-item" data-element-id="([^"]+)"/g)].map((m) => m[1]));
    const covered = new Set([...rendered, ...liBadges]);
    if (nodes === 0) return 'Reading 一个节点都没有';
    return (covered.size === map.elements.length && nodeIds.size === map.elements.length)
      ? true
      : `节点 ${nodes} / 覆盖 ${covered.size} ≠ element ${map.elements.length}`;
  });

  /* ---- Reading 不显示工程 metadata ---- */
  check(`${item.name}：Reading 不出现机器 ID / type / role`, () => {
    const bad = [];
    if (reading.includes('class="eid"')) bad.push('出现 eid');
    if (reading.includes('role: ')) bad.push('出现 role');
    if (reading.includes('class="chip type"')) bad.push('出现 type chip');
    if (reading.includes('class="card-meta"')) bad.push('出现卡片 metadata');
    return bad.length === 0 || bad.join(' / ');
  });
  check(`${item.name}：节点标题是切开的短名（不是机器 ID）`, () => {
    const titles = [...reading.matchAll(/class="node-title">([^<]*)</g)].map((m) => m[1]);
    const bad = titles.filter((t) => /^[ECS]-\d+$/.test(t) || t.length > 46 || !t.trim());
    return bad.length === 0 || `异常标题 ${bad.slice(0, 2).join(',')}`;
  });

  /* ---- Review 仍然是完整审阅面 ---- */
  check(`${item.name}：edge 在 Review 逐条渲染（${r.facts.edgeCount}）`, () => {
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
  check(`${item.name}：Review 方向显式（每行都有 —type→）`, () => {
    const n = countOf(html, '<span class="rel">—');
    return n >= (map.edges || []).length || `方向标记 ${n} < edge ${(map.edges || []).length}`;
  });
  check(`${item.name}：provenance 全部出现（§ref）`, () => {
    const refs = map.elements.flatMap((e) => [...(e.sectionRefs || []), ...(e.sourceUnitIds || [])]);
    const missing = refs.filter((x) => !html.includes(`>${x}<`) && !html.includes(x));
    return missing.length === 0 || `缺 ${missing.slice(0, 3).join(',')}`;
  });
  check(`${item.name}：无未解析引用`, () => (html.includes('(未解析') ? '出现 (未解析' : true));
  check(`${item.name}：Topic 默认折叠（导航不是第二篇文档）`, () => {
    const folds = countOf(html, 'class="topic-fold"');
    if (folds !== (map.topics || []).length) return `折叠块 ${folds} ≠ topic ${(map.topics || []).length}`;
    const opened = countOf(html, 'class="topic-fold" open');
    return opened === 0 || `默认展开了 ${opened} 个`;
  });
}

/* ---------- 不发明主轴：真的造一份"没有 edge"的 map 来验（不靠"本预览集恰好没有"） ---------- */
{
  const flatMap = JSON.parse(fs.readFileSync(path.join(ROOT, SET[0].map), 'utf8'));
  flatMap.edges = [];
  flatMap.attachments = [];
  flatMap.relationGap = [];
  const flatPath = path.join(ROOT, 'tmp/l0-preview-check/no-edge.map.json');
  fs.mkdirSync(path.dirname(flatPath), { recursive: true });
  fs.writeFileSync(flatPath, JSON.stringify(flatMap, null, 2), 'utf8');
  const flatBuilt = buildOne({ map: 'tmp/l0-preview-check/no-edge.map.json', out: 'tmp/l0-preview-check/nospine.html', view: 'reading', note: '0-edge 合成样本 · 不发明主轴' });
  const flatHtml = fs.readFileSync(path.join(ROOT, flatBuilt.out), 'utf8');
  built.push({
    item: { name: 'nospine', map: 'tmp/l0-preview-check/no-edge.map.json', note: '0-edge 合成样本' },
    r: flatBuilt, html: flatHtml, map: flatMap,
    reading: slice(flatHtml, 'id="l0-reading"', 'id="l0-review-board"'),
    review: slice(flatHtml, 'id="l0-review-board"'),
  });
}

/* ---------- 定向断言（对应验收清单的硬要求） ---------- */
const byName = (n) => built.find((b) => b.item.name === n);

check('E（分叉）没有被压成链：线逐条独立渲染，没有"链"式合并', () => {
  const b = byName('e');
  const lines = countOf(b.reading, '<path class="l0-edge');
  return lines === (b.map.edges || []).length ? true : '线数与输入不一致';
});
check('>budget 的 map 不被裁（81 elements 全部渲染）', () => {
  const b = byName('d-overbudget');
  const n = uniqElements(b.html).size;
  if (b.map.elements.length !== 81) return `样本元素数变了：${b.map.elements.length}`;
  if (n !== 81) return `只渲染 ${n}（应 81）`;
  return b.html.includes('不裁剪') || '页面未标注"只是 Warning，不裁剪"';
});
check('自环边被显式标注（Reading 画成自环 + Review 写「自环」）', () => {
  const b = byName('d-selfloop');
  const selfCount = (b.map.edges || []).filter((e) => e.from === e.to).length;
  if (!selfCount) return '样本没有自环';
  if (!b.html.includes('flag self')) return 'Review 未标注自环';
  return countOf(b.reading, 'is-selfloop') >= selfCount || 'Reading 未把自环画成自环';
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
check('修正后的原则在位（语义来自线，不来自坐标）—— 但收进折叠的「如何阅读」里', () => {
  const b = byName('d');
  if (!b.html.includes('语义来自线，不来自坐标')) return '缺少"关系优先"的声明';
  if (!b.html.includes('ⓘ 如何阅读这张图')) return '缺少折叠入口';
  const howto = slice(b.html, 'class="l0-howto"', 'id="l0-reading"');
  if (!howto.includes('节点 = element') || !howto.includes('线 = edge')) return '折叠区里没有"节点/线"的说明';
  return true;
});
check('顶部说明默认折叠，且第一屏顺序是「文档定位 → 图」（不是先读设计原则）', () => {
  for (const b of built) {
    if (countOf(b.html, 'class="l0-howto" open') !== 0) return `${b.item.name} 默认展开了说明`;
    if (b.html.includes('class="l0-principle"')) return `${b.item.name} 仍有占第一屏的原则段落`;
    const iScope = b.html.indexOf('这是什么文档');
    const iHowto = b.html.indexOf('如何阅读这张图');
    const iGraph = b.html.indexOf('id="l0-reading"');
    if (!(iScope >= 0 && iScope < iHowto && iHowto < iGraph)) return `${b.item.name} 第一屏顺序不对`;
  }
  return true;
});

/* ---- Phase 4.1 polish：Reading 说人话，Review 保留原词 ---- */
check('Reading 的关系词已中文化（使用 / 产出 / 依赖 …），且原词没丢（data-edge-type）', () => {
  const raw = ['consumes', 'produces', 'depends-on', 'relates-to'];
  for (const b of built) {
    const labels = [...b.reading.matchAll(/class="l0-edge-label"[^>]*data-edge-type="([^"]+)"/g)];
    const types = [...b.reading.matchAll(/data-edge-type="([^"]+)"/g)].map((m) => m[1]);
    if (types.length !== (b.map.edges || []).length * 2) return `${b.item.name}: data-edge-type 数量 ${types.length}（线 + 标签应各一份）`;
    const texts = [...b.reading.matchAll(/class="l0-edge-label"[^>]*>([^<]*)</g)].map((m) => m[1]);
    const leaked = texts.filter((t) => raw.includes(t.trim().replace(/\s*↺$/, '')));
    if (leaked.length) return `${b.item.name}: 线标签仍是原词 ${leaked.slice(0, 2).join(',')}`;
    if (labels.length !== (b.map.edges || []).length) return `${b.item.name}: 标签缺 data-edge-type`;
  }
  return true;
});
check('Review 仍是原词（—consumes→ / —produces→），中文化只发生在显示层', () => {
  const b = byName('d');
  if (!b.review.includes('<span class="rel">—consumes→</span>')) return 'Review 丢失原词 consumes';
  return b.review.includes('—produces→') ? true : 'Review 丢失原词 produces';
});
check('Reading 里没有残留工程词（constraints / Focused Relations / Incoming / Outgoing / Provenance）', () => {
  const words = ['constraints', 'Focused Relations', '>Incoming<', '>Outgoing<', '>Attached<', '>Provenance<'];
  for (const b of built) {
    const hit = words.filter((w) => b.reading.includes(w));
    if (hit.length) return `${b.item.name}: 残留 ${hit.join(', ')}`;
    if (!b.reading.includes('条约束') && b.map.attachments.length) return `${b.item.name}: 角标没有中文化`;
  }
  return true;
});
check('长列表副标题被收敛（前两项 + 共 N 项），完整内容留在 title 里', () => {
  const b = byName('e');
  if (!b.reading.includes('共 ')) return '没有收敛长列表副标题';
  const subs = [...b.reading.matchAll(/class="node-sub" title="([^"]*)"/g)].map((m) => m[1]);
  if (!subs.length) return '节点副标题没有 title（无法 hover 看全文）';
  const long = subs.filter((s) => s.length > 34);
  return long.length ? true : '样本没有长副标题（断言失效，需换样本）';
});
check('标题/副标题的行数规则写死在 CSS（标题 1 行、副标题 2 行）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'app/renderer/l0-map.css'), 'utf8');
  const title = /\.l0-node \.node-title \{[^}]*-webkit-line-clamp: 1[^}]*\}/.test(css);
  const sub = /\.l0-node \.node-sub \{[^}]*?-webkit-line-clamp: 2[^}]*\}/.test(css);
  return (title && sub) || `title1=${title} sub2=${sub}`;
});
check('Reading 隐藏一切机器 ID（.eid 在 reading 视图不显示）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'app/renderer/l0-map.css'), 'utf8');
  if (!css.includes('.l0-root[data-view="reading"] .eid { display: none; }')) return 'CSS 缺少 Reading 隐藏 eid 的规则';
  const b = byName('d');
  return b.reading.includes('class="eid"') ? 'Reading 标记里仍有 eid' : true;
});
check('Reading / Review 互斥且都在 DOM 里（隐藏 ≠ 删除）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'app/renderer/l0-map.css'), 'utf8');
  const ok = css.includes('.l0-root[data-view="reading"] .l0-review-board { display: none; }')
    && css.includes('.l0-root[data-view="review"] .l0-reading { display: none; }');
  if (!ok) return 'CSS 缺少视图互斥规则';
  const b = byName('d');
  return (b.html.includes('id="l0-reading"') && b.html.includes('id="l0-review-board"')) || '两个视图没有同时存在于 DOM';
});
check('无 element 的 Topic 仍是导航入口（页面上有标注）', () => {
  const b = byName('d');
  if (!b.r.facts.topicsWithoutElements.length) return '样本没有无 element topic';
  return b.html.includes('无 L0 element —— 仍是导航入口') ? true : '未标注';
});
check('约束被降级为角标，但仍在页面上可点', () => {
  const b = byName('d');
  if (!b.map.attachments.length) return '样本没有 attachment';
  if (!b.reading.includes('node-attach')) return 'Reading 没有约束角标';
  return b.reading.includes('⚑') ? true : '角标没有可见标记';
});
check('不在任何 edge 上的元素被单独标注（事实，不塞进层里）', () => {
  const b = byName('nospine');
  if (!b) return '缺 0-edge 样本';
  if (!b.reading.includes('不在任何 edge 上')) return '未标注孤立元素';
  return b.reading.includes('l0-orphan-note') ? true : '缺 orphan 标注块';
});

check('没有 edge 的图不画线（不发明主轴）', () => {
  const flatReading = byName('nospine').reading;
  if (countOf(flatReading, '<path class="l0-edge') !== 0) return '给 0-edge 的图造了线';
  if (!byName('nospine').html.includes('没有主轴就不发明主轴')) return '没有显式说明"不画线"';
  return uniqElements(flatReading).size === byName('nospine').map.elements.length || '0-edge 时丢了元素';
});
check('0-edge 时所有节点都被标成"不在任何 edge 上"（虚线 + 单独一带）', () => {
  const flatReading = byName('nospine').reading;
  const dyn = countOf(flatReading, 'data-has-edges="0"');
  const nodes = countOf(flatReading, '<article class="l0-node');
  return dyn === nodes ? true : `只有 ${dyn}/${nodes} 个节点被标为无边`;
});

/* ---- Phase 3/4：Reading 默认 + 交互条件 ---- */
check('Reading 是默认视图（用户裁决：先看结构，不是先看 WARN）', () => {
  for (const b of built) {
    if (!b.html.includes('data-view="reading"')) return `${b.item.name} 不是 reading 默认`;
  }
  return true;
});
check('两个视图的切换都在（Reading / Review tab）', () => {
  for (const b of built) {
    if (!b.html.includes('data-l0-view="reading"') || !b.html.includes('data-l0-view="review"')) return `${b.item.name} 缺 tab`;
  }
  return true;
});
check('每个 element 都有预渲染的 Focused Relations 面板（可直接静态断言）', () => {
  for (const b of built) {
    const n = countOf(b.html, 'class="focus-panel"');
    if (n !== b.map.elements.length) return `${b.item.name}: ${n} ≠ ${b.map.elements.length}`;
  }
  return true;
});
check('Reading 选中后下钻的 slot 在位（Focused Relations 成为 details panel）', () => {
  for (const b of built) if (!b.html.includes('id="l0-focus-slot"')) return `${b.item.name} 缺 focus slot`;
  return true;
});
check('每条 edge 在 Review 都有可展开的 qualifier / provenance 区', () => {
  for (const b of built) {
    const n = countOf(b.html, 'class="edge-extra"');
    if (n !== (b.map.edges || []).length) return `${b.item.name}: ${n} ≠ ${(b.map.edges || []).length}`;
  }
  return true;
});
check('provenance 是可点链路（data-source-ref），不是死文本', () => {
  const b = byName('d');
  const refs = b.map.elements.flatMap((e) => e.sectionRefs || []);
  const n = countOf(b.html, 'data-source-ref=');
  return n >= refs.length ? true : `可点 provenance ${n} < 出处 ${refs.length}`;
});
check('有"清除选择"入口（Esc / 按钮），可回到完整 Overview', () => {
  for (const b of built) if (!b.html.includes('data-focus-clear=')) return `${b.item.name} 缺清除入口`;
  return true;
});
check('Reading 第一眼给出文档定位（"这是什么文档"）', () => {
  const b = byName('d');
  return b.html.includes('这是什么文档') ? true : '缺少 scope 定位块';
});
check('Review 声明分区依据是 element.type（不是关系）', () => {
  const b = byName('d');
  return b.review.includes('按 element.type 分区') ? true : 'Review 缺少分区依据声明';
});

/* ---- 保真度：预览必须真的加载 renderer，而不是只写着一行调用 ---- */
check('预览真的加载了 renderer 脚本（l0-layout.js → l0-map.js → 内联绑定）', () => {
  const b = byName('d');
  const iLayout = b.html.indexOf('app/renderer/l0-layout.js');
  const iMap = b.html.indexOf('app/renderer/l0-map.js');
  const iInline = b.html.indexOf('window.L0Map.bindInteractions');
  if (iLayout < 0) return '没有加载 l0-layout.js（图会缺坐标）';
  if (iMap < 0) return '没有加载 l0-map.js（bindInteractions 会直接抛错）';
  if (!(iLayout < iMap && iMap < iInline)) return '脚本顺序不对（必须 layout → map → 绑定）';
  return true;
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
else console.log('✓ 结论：关系被画成线 / 线数 == edge 数 / Reading 无工程 metadata / 约束降级为角标 / 不裁不丢 / 预览真的能跑');
console.log('════════════════════════════════');
process.exit(failures ? 1 : 0);
