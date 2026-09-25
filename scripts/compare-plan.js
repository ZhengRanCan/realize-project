#!/usr/bin/env node
'use strict';

/**
 * compare-plan —— 实验性对比工具：把模型生成的 overview-plan 与 Gold Fixture 对照。
 *
 * 刻意**不**做自动评分、不引入 embedding、不调用第二个模型当 judge。
 * 它产出的是**供人工看的报告**：哪些语义被识别到了、三次是否稳定、分组与形状是否合理。
 *
 * 重要：绝不要求"文案相同"。Gold 与模型对同一语义的措辞必然不同，
 * 因此匹配只依据 (section 相同) + (kind 相同或相近) + 关键词/字符 bigram 相似度。
 *
 * 用法：
 *   npm run compare-plan                       # 对比 tmp 下全部 run-*.overview-plan.json
 *   npm run compare-plan -- --pattern run-     # 自定义文件名匹配
 *   npm run compare-plan -- --out docs/report.md
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const GOLD = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const SHAPE_CATALOG = path.join(ROOT, 'docs', 'shape-catalog.md');

/* ================================================================== *
 * 阈值集中配置
 * ================================================================== */

const MATCH = {
  /** 字符 bigram 相似度权重 */
  weightBigram: 0.45,
  /** 关键 token 重叠权重 */
  weightTokens: 0.55,
  /** 判定为"同一语义"的最低综合分 */
  minScore: 0.34,
  /** 只要 section 相同且综合分达到这个值，就当作"可能同一语义"（进人工确认区） */
  borderlineScore: 0.22,
  /** 三次运行中要被算作"稳定识别"的最低命中率 */
  stableRuns: 2,
};

const KIND_COMPAT = buildKindCompat();

/** 允许互相替代的 kind 对（模型分类口径差异不应被当成漏掉语义）。 */
function buildKindCompat() {
  const families = [
    ['definition', 'invariant'],
    ['boundary', 'invariant', 'definition'],
    ['current-state', 'responsibility'],
    ['target-state', 'responsibility'],
    ['negative-case', 'boundary', 'counterexample'],
    ['non-claim', 'non-goal', 'open-question'],
    ['example', 'consequence', 'rationale'],
    ['evidence-requirement', 'boundary', 'invariant'],
  ];
  const compat = new Map();
  families.forEach((family) => {
    family.forEach((a) => {
      const set = compat.get(a) || new Set([a]);
      family.forEach((b) => set.add(b));
      compat.set(a, set);
    });
  });
  return compat;
}

function kindCompatible(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const set = KIND_COMPAT.get(a);
  return !!set && set.has(b);
}

/* ================================================================== *
 * 文本相似度：字符 bigram + 关键 token 重叠
 * ================================================================== */

const STOPWORDS = new Set([
  '本文', '原文', '因此', '并且', '以及', '或者', '如果', '这个', '这些', '其中', '需要',
  '可以', '不能', '不是', '没有', '就是', '一个', '对于', 'the', 'and', 'that', 'with', 'for',
]);

function bigrams(text) {
  const cleaned = text.replace(/[\s，。；：、（）()"'`「」『』【】—…\-·]+/g, '');
  const set = new Set();
  for (let i = 0; i < cleaned.length - 1; i += 1) set.add(cleaned.slice(i, i + 2));
  return set;
}

function tokens(text) {
  // 英文/代码标识符整体保留，中文取 2-3 字片段
  const out = [];
  const ascii = text.match(/[A-Za-z][A-Za-z0-9_./-]{2,}/g) || [];
  ascii.forEach((t) => out.push(t.toLowerCase()));
  const cjk = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  cjk.forEach((t) => out.push(t));
  return out.filter((t) => !STOPWORDS.has(t));
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((x) => {
    if (b.has(x)) inter += 1;
  });
  return inter / (a.size + b.size - inter);
}

function tokenOverlap(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const hit = a.filter((t) => setB.has(t)).length;
  return hit / Math.min(a.length, b.length);
}

function similarity(goldUnit, candidateUnit) {
  const bigram = jaccard(bigrams(goldUnit.statement), bigrams(candidateUnit.statement));
  const token = tokenOverlap(tokens(goldUnit.statement), tokens(candidateUnit.statement));
  let score = MATCH.weightBigram * bigram + MATCH.weightTokens * token;
  // 关键代码标识符出现在两边，是很强的同义信号
  const asciiGold = (goldUnit.statement.match(/[A-Za-z][A-Za-z0-9_./-]{4,}/g) || []).map((s) => s.toLowerCase());
  const asciiCand = new Set((candidateUnit.statement.match(/[A-Za-z][A-Za-z0-9_./-]{4,}/g) || []).map((s) => s.toLowerCase()));
  if (asciiGold.some((t) => asciiCand.has(t))) score += 0.12;
  return Math.min(1, score);
}

/* ================================================================== *
 * 匹配
 * ================================================================== */

/**
 * 为每个 gold unit 在 candidate 里找最佳匹配。
 * 允许重复匹配（一个 candidate unit 可能同时对应两条 gold 语义），
 * 但会记录"一对多/多对一"，因为那是分组过碎的信号。
 */
function matchUnits(goldUnits, candidateUnits) {
  const results = new Map();
  candidateUnits.forEach((c) => c.__used = 0);

  goldUnits.forEach((g) => {
    let best = null;
    candidateUnits.forEach((c) => {
      if (c.section !== g.section) return;
      const score = similarity(g, c);
      const kindOk = kindCompatible(g.kind, c.kind);
      // kind 不兼容时把分数压下去，但不完全排除（模型分类口径可能不同）
      const adjusted = kindOk ? score : score * 0.55;
      if (!best || adjusted > best.score) best = { unit: c, score: adjusted, raw: score, kindOk };
    });
    if (best && best.score >= MATCH.minScore) {
      best.unit.__used += 1;
      results.set(g.id, { unit: best.unit, score: best.score, kindOk: best.kindOk, shared: false });
    } else if (best && best.score >= MATCH.borderlineScore) {
      results.set(g.id, { unit: best.unit, score: best.score, kindOk: best.kindOk, shared: true });
    } else {
      results.set(g.id, null);
    }
  });

  const multi = new Map();
  results.forEach((m, gid) => {
    if (m && m.unit.__used > 1) multi.set(gid, m.unit);
  });
  return { results, multi };
}

/* ================================================================== *
 * Fidelity：复用 check-plan 的判定，不重新实现
 * ================================================================== */

function runCheckPlan(planFile) {
  const { execFileSync } = require('node:child_process');
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'check-plan.js'), planFile], {
      encoding: 'utf8',
    });
    return { code: 0, output: stdout, errors: [] };
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    const errors = output
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('✗'))
      .map((line) => line.replace(/^\s*✗\s*/, ''));
    return { code: error.status === undefined ? 1 : error.status, output, errors };
  }
}

/* ================================================================== *
 * 形状 / 分组统计
 * ================================================================== */

function shapeStats(plan) {
  const count = {};
  plan.blocks.forEach((b) => {
    count[b.shape] = (count[b.shape] || 0) + 1;
  });
  const covers = plan.blocks.map((b) => (b.covers || []).length);
  return {
    blocks: plan.blocks.length,
    units: plan.sourceUnits.length,
    count,
    avgCovers: covers.reduce((a, b) => a + b, 0) / (covers.length || 1),
    maxCovers: Math.max(0, ...covers),
    mergedGroups: (plan.duplicatesMerged || []).length,
  };
}

function unknownShapes(plan, catalogShapes) {
  return [...new Set(plan.blocks.map((b) => b.shape))].filter((s) => !catalogShapes.has(s));
}

function catalogShapes() {
  const text = fs.readFileSync(SHAPE_CATALOG, 'utf8');
  const set = new Set();
  text.replace(/`(flow|current-target-flow|matrix|capability-matrix|diff|ladder|walkthrough|combo|checklist|two-column-comparison|prose)`/g, (m, s) => {
    set.add(s);
    return m;
  });
  return set;
}

/* ================================================================== *
 * 报告
 * ================================================================== */

function pct(n, d) {
  return d === 0 ? '—' : `${((n / d) * 100).toFixed(0)}%`;
}

function main() {
  const args = process.argv.slice(2);
  const patternIndex = args.indexOf('--pattern');
  const pattern = patternIndex >= 0 ? args[patternIndex + 1] || 'run-' : 'run-';
  const runsIndex = args.indexOf('--runs');
  const onlyRuns = runsIndex >= 0 ? String(args[runsIndex + 1] || '').split(',').map((s) => s.trim()) : null;
  const outIndex = args.indexOf('--out');
  const outFile = outIndex >= 0 ? path.resolve(ROOT, args[outIndex + 1]) : null;

  const tmpDir = path.join(ROOT, 'tmp');
  const files = fs
    .readdirSync(tmpDir)
    .filter((f) => f.includes(pattern) && f.endsWith('.overview-plan.json'))
    .filter((f) => {
      if (!onlyRuns) return true;
      const m = f.match(/run-(\d+)/);
      return m && onlyRuns.includes(m[1]);
    })
    .sort();

  if (files.length === 0) {
    console.error(`✗ 在 tmp/ 下找不到匹配 "${pattern}" 的 overview-plan.json`);
    process.exit(1);
  }

  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
  const catalog = catalogShapes();
  const runs = files.map((file) => {
    const planPath = path.join(tmpDir, file);
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const check = runCheckPlan(planPath);
    const match = matchUnits(gold.sourceUnits, plan.sourceUnits);
    return { file, plan, check, ...match, stats: shapeStats(plan), unknownShapes: unknownShapes(plan, catalog) };
  });

  const goldStats = shapeStats(gold);
  const lines = [];
  const push = (s = '') => lines.push(s);

  push('# overview-plan 对比报告（模型 vs Gold）');
  push('');
  push(`生成时间：${new Date().toISOString()}`);
  push('');
  push('> 本报告是**观察工具**的产物，不是评分。匹配依据 (section + kind + 文本相似度)，');
  push('> 绝不要求文案相同；低分项需要人工确认是否真的漏掉语义。');
  push('');

  /* ---- 1. 概览 ---- */
  push('## 1. 概览');
  push('');
  push('| | Gold | ' + runs.map((r) => r.file.replace('context-consumption.', '').replace('.overview-plan.json', '')).join(' | ') + ' |');
  push('|---|---|' + runs.map(() => '---|').join(''));
  push(`| sourceUnits | ${goldStats.units} | ${runs.map((r) => r.stats.units).join(' | ')} |`);
  push(`| blocks | ${goldStats.blocks} | ${runs.map((r) => r.stats.blocks).join(' | ')} |`);
  push(`| blocks/section | — | ${runs.map((r) => (r.stats.blocks / 16).toFixed(2)).join(' | ')} |`);
  push(`| 平均 covers/block | ${goldStats.avgCovers.toFixed(1)} | ${runs.map((r) => r.stats.avgCovers.toFixed(1)).join(' | ')} |`);
  push(`| 最大 covers/block | ${goldStats.maxCovers} | ${runs.map((r) => r.stats.maxCovers).join(' | ')} |`);
  push(`| duplicatesMerged | ${goldStats.mergedGroups} | ${runs.map((r) => r.stats.mergedGroups).join(' | ')} |`);
  push(`| check-plan | PASS | ${runs.map((r) => (r.check.code === 0 ? 'PASS' : 'FAIL')).join(' | ')} |`);
  push('');

  /* ---- 2. Semantic Unit Recall ---- */
  push('## 2. Semantic Unit Recall');
  push('');
  push('Gold 的每条语义，在各 run 里是否有对应表达。');
  push('');
  push('| run | core 命中 | core 边界 | supporting 命中 | 合计 | 未命中 core |');
  push('|---|---|---|---|---|---|');
  runs.forEach((r) => {
    const core = gold.sourceUnits.filter((u) => u.importance === 'core');
    const sup = gold.sourceUnits.filter((u) => u.importance === 'supporting');
    const hit = (list) => list.filter((u) => r.results.get(u.id)).length;
    const borderline = (list) =>
      list.filter((u) => {
        const m = r.results.get(u.id);
        return m && m.shared;
      }).length;
    const missed = core.filter((u) => !r.results.get(u.id)).map((u) => u.id);
    push(
      `| ${r.file.replace('context-consumption.', '').replace('.overview-plan.json', '')} | ` +
        `${hit(core)}/${core.length} (${pct(hit(core), core.length)}) | ${borderline(core)} | ` +
        `${hit(sup)}/${sup.length} (${pct(hit(sup), sup.length)}) | ` +
        `${hit(gold.sourceUnits)}/${gold.sourceUnits.length} | ${missed.join(', ') || '无'} |`
    );
  });
  push('');

  /* ---- 3. Semantic Stability ---- */
  push('## 3. Semantic Stability（三次是否稳定识别）');
  push('');
  const candidates = runs.filter((r) => r.file.includes('run-'));
  if (candidates.length < 2) {
    push('（只有 1 次运行，无法比较稳定性）');
  } else {
    const rows = gold.sourceUnits.map((u) => {
      const hits = candidates.filter((r) => r.results.get(u.id));
      const stableFull = hits.length === candidates.length;
      const stableEnough = hits.length >= MATCH.stableRuns;
      return { u, hits: hits.length, stableFull, stableEnough };
    });
    const fullCount = rows.filter((r) => r.stableFull).length;
    const enoughCount = rows.filter((r) => r.stableEnough).length;
    const unstable = rows.filter((r) => !r.stableEnough);
    push(`- ${candidates.length} 次运行**全部**识别到的语义：**${fullCount} / ${gold.sourceUnits.length}**（${pct(fullCount, gold.sourceUnits.length)}）`);
    push(`- 至少 ${MATCH.stableRuns} 次识别到（稳定）：**${enoughCount} / ${gold.sourceUnits.length}**（${pct(enoughCount, gold.sourceUnits.length)}）`);
    push(`- 不稳定的语义（少于 ${MATCH.stableRuns} 次）：**${unstable.length} 条**`);
    push('');
    if (unstable.length > 0) {
      push('| unit | section | kind | importance | 命中次数 | statement |');
      push('|---|---|---|---|---|---|');
      unstable.forEach(({ u, hits }) => {
        push(`| ${u.id} | ${u.section} | ${u.kind} | ${u.importance} | ${hits}/${candidates.length} | ${u.statement.slice(0, 52)}… |`);
      });
      push('');
    }
  }

  /* ---- 4. Grouping ---- */
  push('## 4. Grouping（分组是否过碎 / 过重）');
  push('');
  push('| run | blocks | 每节平均 block | 平均 covers | 最大 covers | 过碎嫌疑（>4 block/节） | 过重嫌疑（covers>8） |');
  push('|---|---|---|---|---|---|---|');
  runs.forEach((r) => {
    const bySection = {};
    r.plan.blocks.forEach((b) => {
      new Set((b.sourceRefs || []).map((x) => x.section)).forEach((s) => {
        bySection[s] = (bySection[s] || 0) + 1;
      });
    });
    const fine = Object.entries(bySection).filter(([, n]) => n > 4);
    const heavy = r.plan.blocks.filter((b) => (b.covers || []).length > 8).map((b) => b.id);
    push(
      `| ${r.file.replace('context-consumption.', '').replace('.overview-plan.json', '')} | ${r.stats.blocks} | ` +
        `${(r.stats.blocks / 16).toFixed(2)} | ${r.stats.avgCovers.toFixed(1)} | ${r.stats.maxCovers} | ` +
        `${fine.map(([s, n]) => `${s}(${n})`).join(', ') || '无'} | ${heavy.join(', ') || '无'} |`
    );
  });
  push('');

  const oneToMany = [];
  runs.forEach((r) => {
    if (r.multi.size > 0) {
      r.multi.forEach((unit, gid) => oneToMany.push(`${r.file.match(/run-\d+/) || r.file}：${gid} 与另一条 gold 语义同时匹配到 ${unit.id}`));
    }
  });
  if (oneToMany.length > 0) {
    push('**一对多匹配（可能是分组过碎的信号）：**');
    push('');
    oneToMany.slice(0, 12).forEach((s) => push(`- ${s}`));
    push('');
  }

  /* ---- 5. Shape Selection ---- */
  push('## 5. Shape Selection');
  push('');
  push(`Shape catalog 允许：${[...catalog].join(', ')}`);
  push('');
  runs.forEach((r) => {
    const dist = Object.entries(r.stats.count)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}×${v}`)
      .join(', ');
    push(`- **${r.file.replace('context-consumption.', '').replace('.overview-plan.json', '')}**：${dist}`);
    if (r.unknownShapes.length > 0) {
      push(`  - ⚠️ 超出 catalog 的 shape：${r.unknownShapes.join(', ')}`);
    }
  });
  push('');
  const shapeSet = new Set(runs.flatMap((r) => Object.keys(r.stats.count)));
  push(`三次运行合计用到 ${shapeSet.size} 种形状；Gold 用到 ${Object.keys(goldStats.count).length} 种。`);
  const weak = ['checklist', 'prose'];
  runs.forEach((r) => {
    const weakCount = weak.reduce((n, s) => n + (r.stats.count[s] || 0), 0);
    push(`- ${r.file.match(/run-\d+/) || r.file}：弱视觉形状（checklist/prose）占 ${pct(weakCount, r.stats.blocks)}`);
  });
  push('');

  /* ---- 6. Semantic Fidelity ---- */
  push('## 6. Semantic Fidelity（越权与降级）');
  push('');
  push('来自 `check-plan` 的 Hard Error —— 这是**不允许**出现的越权类型：');
  push('');
  runs.forEach((r) => {
    const label = r.file.replace('context-consumption.', '').replace('.overview-plan.json', '');
    if (r.check.errors.length === 0) {
      push(`- **${label}**：无 Hard Error`);
    } else {
      push(`- **${label}**：${r.check.errors.length} 条`);
      r.check.errors.forEach((e) => push(`  - \`${e}\``));
    }
  });
  push('');

  // 四类最危险的降级：只匹配 check-plan 真正带 [陷阱] 前缀的 Hard Error，
  // 不能拿宽泛正则去撞 schema 错误 —— 那会把"字段写错"误报成"语义倒置"。
  const trapCategories = [
    ['未决定 → 写成决定', /\[陷阱\].*未决定|\[陷阱\].*Open Question/],
    ['不承诺 → 写成保证', /\[陷阱\].*系统保证|\[陷阱\].*不承诺/],
    ['target → 写成 current', /\[陷阱\].*Current Reality/],
    ['document claim → source-verified', /\[陷阱\].*source-verified/],
  ];
  push('| 越权类型 | ' + runs.map((r) => r.file.match(/run-\d+/) || r.file).join(' | ') + ' |');
  push('|---|---|' + runs.map(() => '---|').join(''));
  trapCategories.forEach(([label, re]) => {
    const cells = runs.map((r) => {
      const hits = r.check.errors.filter((e) => re.test(e));
      return hits.length === 0 ? '未触发' : `**${hits.length} 条**：${hits[0].slice(0, 52)}…`;
    });
    push(`| ${label} | ${cells.join(' | ')} |`);
  });
  push('');
  push('其余 Hard Error（结构 / 字段层面，不是语义倒置）：');
  push('');
  runs.forEach((r) => {
    const others = r.check.errors.filter((e) => !/\[陷阱\]/.test(e));
    if (others.length === 0) return;
    push(`- ${r.file.match(/run-\d+/) || r.file}：${others.length} 条 —— ${others.map((e) => e.slice(0, 70)).join('；')}`);
  });
  push('');

  // kind 误用：把 shape 名当成 kind
  push('**字段误用（模型把不该放在该字段的值放进去了）：**');
  push('');
  const kindEnum = new Set([
    'definition', 'invariant', 'current-state', 'target-state', 'rationale', 'consequence',
    'boundary', 'negative-case', 'example', 'counterexample', 'open-question', 'non-goal',
    'non-claim', 'responsibility', 'evidence-requirement',
  ]);
  runs.forEach((r) => {
    const bad = r.plan.sourceUnits.filter((u) => !kindEnum.has(u.kind));
    if (bad.length > 0) {
      push(`- ${r.file.match(/run-\d+/) || r.file}：${bad.length} 条 —— ${bad.map((u) => `${u.id}.kind="${u.kind}"`).join(', ')}`);
    }
  });
  if (runs.every((r) => r.plan.sourceUnits.every((u) => kindEnum.has(u.kind)))) {
    push('- 无');
  }
  push('');

  /* ---- 7. Presentation Drift ---- */
  push('## 7. Presentation Drift（表现层漂移，仅观察）');
  push('');
  if (candidates.length < 2) {
    push('（只有 1 次运行，无法比较漂移）');
  } else {
    push('| gold unit | ' + candidates.map((r) => r.file.match(/run-\d+/)[0] + ' 的 shape').join(' | ') + ' |');
    push('|---|---|' + candidates.map(() => '---|').join(''));
    const sample = gold.sourceUnits.filter((u) => u.importance === 'core').slice(0, 24);
    sample.forEach((u) => {
      const shapes = candidates.map((r) => {
        const m = r.results.get(u.id);
        if (!m) return '—（未识别）';
        const block = r.plan.blocks.find((b) => (b.covers || []).includes(m.unit.id));
        return block ? block.shape : '（不在任何 block）';
      });
      const unique = new Set(shapes.filter((s) => !s.startsWith('—') && !s.startsWith('（')));
      const marker = unique.size > 1 ? ' ⚠️' : '';
      push(`| ${u.id} ${u.statement.slice(0, 26)}… | ${shapes.join(' | ')}${marker} |`);
    });
    push('');
    const driftCount = sample.filter((u) => {
      const shapes = candidates.map((r) => {
        const m = r.results.get(u.id);
        if (!m) return null;
        const block = r.plan.blocks.find((b) => (b.covers || []).includes(m.unit.id));
        return block ? block.shape : null;
      });
      return new Set(shapes.filter(Boolean)).size > 1;
    }).length;
    push(`抽样 ${sample.length} 条 core 语义中，有 **${driftCount}** 条在三次运行里被放进了不同的 shape。`);
    push('> 按本轮要求：漂移只作观察指标，不作为 Hard Error。');
  }
  push('');

  /* ---- 8. 需要人工确认的清单 ---- */
  push('## 8. 需要人工确认的清单');
  push('');
  const last = runs[runs.length - 1];
  const missedCore = gold.sourceUnits.filter((u) => u.importance === 'core' && !last.results.get(u.id));
  const borderline = gold.sourceUnits.filter((u) => {
    const m = last.results.get(u.id);
    return m && (m.shared || !m.kindOk);
  });
  push(`以**最后一次运行**（${last.file.match(/run-\d+/) || last.file}）为样本：`);
  push('');
  push(`### 8.1 疑似完全未命中的 core 语义（${missedCore.length} 条）`);
  push('');
  if (missedCore.length === 0) {
    push('无。');
  } else {
    push('| unit | section | kind | statement |');
    push('|---|---|---|---|');
    missedCore.forEach((u) => push(`| ${u.id} | ${u.section} | ${u.kind} | ${u.statement} |`));
  }
  push('');
  push(`### 8.2 匹配分偏低或 kind 不一致（${borderline.length} 条，需人工判断是否同义）`);
  push('');
  if (borderline.length === 0) {
    push('无。');
  } else {
    push('| gold unit | 匹配到的模型 unit | 分数 | kind 一致 | gold statement | 模型 statement |');
    push('|---|---|---|---|---|---|');
    borderline.slice(0, 30).forEach((u) => {
      const m = last.results.get(u.id);
      push(
        `| ${u.id} | ${m.unit.id} | ${m.score.toFixed(2)} | ${m.kindOk ? '是' : '**否**'} | ` +
          `${u.statement.slice(0, 40)}… | ${m.unit.statement.slice(0, 40)}… |`
      );
    });
  }
  push('');

  /* ---- 9. 模型多识别出的语义 ---- */
  push('## 9. 模型多识别出的语义（Gold 没有对应项）');
  push('');
  const goldIds = new Set(gold.sourceUnits.map((u) => u.id));
  const candUnits = last.plan.sourceUnits;
  const extra = candUnits.filter((c) => {
    let best = 0;
    gold.sourceUnits.forEach((g) => {
      if (g.section !== c.section) return;
      best = Math.max(best, similarity(g, c));
    });
    return best < MATCH.borderlineScore;
  });
  push(`最后一次运行有 ${extra.length} 条语义在 Gold 里找不到对应项（这**不一定是错误** —— 可能是 Gold 自己漏了）：`);
  push('');
  if (extra.length === 0) {
    push('无。');
  } else {
    push('| unit | section | kind | statement |');
    push('|---|---|---|---|');
    extra.forEach((c) => push(`| ${c.id} | ${c.section} | ${c.kind} | ${c.statement} |`));
  }
  push('');

  /* ---- 10. 自检 ---- */
  push('## 10. 工具自检');
  push('');
  const self = matchUnits(gold.sourceUnits, JSON.parse(JSON.stringify(gold.sourceUnits)));
  const selfHit = gold.sourceUnits.filter((u) => self.results.get(u.id)).length;
  push(`- Gold 与自身对比：命中 ${selfHit} / ${gold.sourceUnits.length}（应接近 100%）`);
  const selfShape = runs.every((r) => r.check.code === 0 || r.check.errors.length > 0);
  push(`- check-plan 调用：${selfShape ? '正常' : '异常'}`);
  push(`- 对比文件：${files.join(', ')}`);
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
