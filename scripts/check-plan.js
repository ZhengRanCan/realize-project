#!/usr/bin/env node
'use strict';

/**
 * overview-plan 的机器验收器（Stage 1 → Stage 2 的闸门）。
 *
 * 定位：Schema 只负责结构合法性；本文件负责**语义规则**（覆盖、陷阱、阈值）。
 * Hard Error 一律阻止进入 Stage 2；Warning 允许通过但必须被看见。
 *
 * 用法：
 *   node scripts/check-plan.js [plan.json]
 *   默认校验 fixtures/context-consumption.overview-plan.json
 *
 * 退出码：0 = PASS / PASS WITH WARNINGS，1 = FAIL
 */

const fs = require('node:fs');
const path = require('node:path');

const { validate } = require('../app/shared/schema-validator');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PLAN = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const SCHEMA = path.join(ROOT, 'schema', 'overview-plan.schema.json');
const SOURCE_SECTIONS = path.join(ROOT, 'docs', 'source-sections.json');

/* ================================================================== *
 * 阈值集中配置：不要把魔法数字散落在代码里
 * ================================================================== */

const THRESHOLDS = {
  /** 一个 block 覆盖多少个 sourceUnit 算过重 */
  blockCoversHeavy: 8,
  /** 一个 covers 里出现多少种不同 kind 算语义混杂 */
  blockKindMix: 6,
  /** 一个章节被拆成多少个 block 算过碎 */
  sectionSplitTooFine: 4,
  /** 两个 block 的 covers 重叠比例达到多少算重复 */
  coverageOverlap: 0.6,
  /** 视觉重构类形状（非 checklist / prose）占比低于多少给 warning */
  visualShapeMinRatio: 0.5,
  /** checklist / prose 这类"弱视觉"形状最多占多少 */
  weakShapeMaxRatio: 0.6,
  /** 全篇 prose 区块最多几个 */
  maxProseBlocks: 1,
  /** shape catalog 的推荐容量（超出给 warning） */
  shapeCapacity: {
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
  },
};

/** 弱视觉形状：容易退化成"把散文列成条目"。 */
const WEAK_SHAPES = ['checklist', 'prose'];

/**
 * 视觉形状词汇表 —— 这些词是 **shape**，永远不能当作 `sourceUnit.kind`。
 *
 * 之所以要单独拦：三次真实模型运行都出现了"把 shape 名写进 kind"（典型：
 * `kind: "capability-matrix"`、`kind: "combo"`），这是唯一稳定复现的失败。
 * `kind` 回答"这段内容在设计语义上是什么"，`shape` 回答"它应该如何展示"。
 *
 * 注意这里用的是 shape catalog 的完整词汇表（含 `boundary-list` —— 该名称在早期
 * 讨论里出现过但不在 catalog 内，一并拦截以免模型自造形状名当 kind）。
 */
const SHAPE_VOCABULARY_FOR_KIND_GUARD = [
  'flow',
  'current-target-flow',
  'matrix',
  'capability-matrix',
  'diff',
  'ladder',
  'walkthrough',
  'combo',
  'checklist',
  'two-column-comparison',
  'boundary-list',
  'prose',
];

/** kind 的合法取值（与 schema 的 enum 一致），用于错误提示里给出期望值。 */
const KIND_ENUM = [
  'definition',
  'invariant',
  'current-state',
  'target-state',
  'rationale',
  'consequence',
  'boundary',
  'negative-case',
  'example',
  'counterexample',
  'open-question',
  'non-goal',
  'non-claim',
  'responsibility',
  'evidence-requirement',
];

/** 视觉重构形状：真正做了结构转换的。 */
const VISUAL_SHAPES = [
  'flow',
  'current-target-flow',
  'matrix',
  'capability-matrix',
  'diff',
  'ladder',
  'walkthrough',
  'combo',
  'two-column-comparison',
];

/** kind 中被视为"非主张"的：不能反过来被断言为承诺。 */
const NON_CLAIM_KINDS = ['non-claim', 'non-goal', 'open-question'];

/**
 * Phase 2 禁用措辞。
 *
 * 关键：**原文自己用过的措辞不算禁用**。例如原文写的是"Prompt 不是充分条件"、
 * "不能进一步确定这个 worked example 是因为 DeepTutor 才出现的"，这些否定式表述
 * 本身就在原文里。因此本表做减法：先扫原文，凡是原文出现过的措辞一律放行，
 * 只拦"原文没有、规划阶段却新写出来"的那种。
 *
 * 表里每一条对应一个真实的越权风险：
 * - 只能算 / 等价于        → 把方向写成结论
 * - 已被证明 / 充分条件     → 宣称已生效的判定规则（原文 §15 明确未决定）
 * - 应当 / 必须             → 把语义设计写成实现要求
 * - 正确 / 有效 / 学会      → 原文 §15 明确不承诺的因果与效果
 * - 已实现 / 已验证         → Phase 2 没有源码输入
 */
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

/** 从原文中收集"已经出现过的措辞"，用于把禁用词表变成"仅在新增时才拦"。 */
function collectAllowedPhrases() {
  let text = '';
  try {
    text = fs.readFileSync(path.join(ROOT, sourceData.document.path), 'utf8');
  } catch (error) {
    return new Set();
  }
  return new Set(FORBIDDEN_PHRASES.filter((p) => text.includes(p)));
}


/** 允许在 statement 中出现的代码路径来源（其余一律视为事实声明）。 */
const CODE_PATH_RE = /(?:^|[\s（(`'"])((?:app|lib|src|packages|tests?)\/[\w./-]+)/;

/** 反例中的显式文件路径白名单：这些是原文明确写出的既有入口，可以引用（仍须是 document-claim）。 */
const KNOWN_DOCUMENTED_PATHS = [
  'app/api/generate/scene-outlines-stream/route.ts',
  'app/api/generate/scene-content/route.ts',
  'lib/fusion/generation-session.ts',
  'lib/generation/scene-generator.ts',
  'lib/generation/scene-builder.ts',
];

/* ================================================================== *
 * 载入
 * ================================================================== */

const planPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_PLAN;

const errors = [];
const warnings = [];
const hardFail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let plan;
try {
  plan = loadJson(planPath);
} catch (error) {
  console.error(`✗ 无法读取 plan：${planPath}`);
  console.error(`  ${error.message}`);
  process.exit(1);
}

const schema = loadJson(SCHEMA);
const sourceData = loadJson(SOURCE_SECTIONS);
const validSections = new Set(sourceData.sections.map((s) => s.label));

const designPath = path.join(ROOT, (plan.designRef && plan.designRef.path) || 'fixtures/context-consumption.json');
let design = null;
try {
  design = loadJson(designPath);
} catch (error) {
  hardFail(`designRef.path 指向的文件无法读取：${plan.designRef && plan.designRef.path}（${error.message}）`);
}

/* ================================================================== *
 * 第一层：Schema
 * ================================================================== */

const schemaResult = validate(schema, plan);
if (!schemaResult.valid) {
  schemaResult.errors.slice(0, 40).forEach((e) => hardFail(`[schema] ${e}`));
  if (schemaResult.errors.length > 40) {
    hardFail(`[schema] 另有 ${schemaResult.errors.length - 40} 条结构错误未列出`);
  }
}

const units = Array.isArray(plan.sourceUnits) ? plan.sourceUnits : [];
const blocks = Array.isArray(plan.blocks) ? plan.blocks : [];
const merges = Array.isArray(plan.duplicatesMerged) ? plan.duplicatesMerged : [];

const unitById = new Map();
units.forEach((u) => {
  if (unitById.has(u.id)) hardFail(`[结构] sourceUnit id 重复：${u.id}`);
  unitById.set(u.id, u);
});

const blockById = new Map();
blocks.forEach((b) => {
  if (blockById.has(b.id)) hardFail(`[结构] block id 重复：${b.id}`);
  blockById.set(b.id, b);
});

const SHAPE_WHITELIST = new Set(schema.definitions.block.properties.shape.enum);

/* ================================================================== *
 * 第二层：结构完整性
 * ================================================================== */

const validReviewObjects = new Set();
if (design) {
  [...(design.decisions || []), ...(design.facts || []), ...(design.gaps || []), ...(design.openQuestions || [])].forEach(
    (o) => validReviewObjects.add(o.id)
  );
}

blocks.forEach((b) => {
  if (!SHAPE_WHITELIST.has(b.shape)) {
    hardFail(`[结构] ${b.id}: 未知 shape "${b.shape}"（必须在 shape catalog 之内）`);
  }
  (b.covers || []).forEach((id) => {
    if (!unitById.has(id)) hardFail(`[覆盖] ${b.id}.covers 引用了不存在的 sourceUnit：${id}`);
  });
  (b.sourceRefs || []).forEach((ref) => {
    if (!validSections.has(ref.section)) {
      hardFail(`[导航] ${b.id}.sourceRefs 指向不存在的章节：${ref.section}`);
    }
  });
  (b.reviewObjects || []).forEach((id) => {
    if (design && !validReviewObjects.has(id)) {
      hardFail(`[关联] ${b.id}.reviewObjects 引用了不存在的 Review Object：${id}`);
    }
  });
});

merges.forEach((m, i) => {
  (m.sourceUnits || []).forEach((id) => {
    if (!unitById.has(id)) hardFail(`[合并] duplicatesMerged[${i}] 引用了不存在的 sourceUnit：${id}`);
  });
  if (!blockById.has(m.keptInBlock)) {
    hardFail(`[合并] duplicatesMerged[${i}].keptInBlock 指向不存在的 block：${m.keptInBlock}`);
  }
});

/* ================================================================== *
 * 第三层：覆盖完整性
 * ================================================================== */

/** 被任一 block 覆盖的单元（区分"只在 covers 里"与"被登记为合并"）。 */
const coveredIds = new Set();
blocks.forEach((b) => (b.covers || []).forEach((id) => coveredIds.add(id)));

/** 被合并掉的单元不算"丢失"，但必须在 duplicatesMerged 里登记，且其语义由 keptInBlock 承载。 */
const mergedIds = new Set();
merges.forEach((m) => (m.sourceUnits || []).forEach((id) => mergedIds.add(id)));

units.forEach((u) => {
  const covered = coveredIds.has(u.id);
  const merged = mergedIds.has(u.id);
  if (covered) return;
  if (merged) {
    // 合并声明的目标块必须真的覆盖了同类语义，否则等于借合并之名丢弃
    const target = blockById.get(merges.find((m) => m.sourceUnits.includes(u.id)).keptInBlock);
    if (target && (target.covers || []).length === 0) {
      hardFail(`[覆盖] ${u.id} 只在 duplicatesMerged 里出现，但 ${target.id} 没有任何 covers，等于被丢弃`);
    }
    return;
  }
  if (u.importance === 'core') {
    hardFail(`[覆盖] core sourceUnit 没有被任何 block 覆盖：${u.id}（${u.section} / ${u.kind}）— ${u.statement.slice(0, 44)}…`);
  } else {
    warn(`[覆盖] supporting sourceUnit 没有被覆盖：${u.id}（${u.section}）— ${u.statement.slice(0, 44)}…`);
  }
});

// 合并的语义必须落在目标块里：目标块至少要覆盖同 kind 的单元
merges.forEach((m, i) => {
  const target = blockById.get(m.keptInBlock);
  if (!target) return;
  const mergedKinds = new Set(m.sourceUnits.map((id) => unitById.get(id)).filter(Boolean).map((u) => u.kind));
  const targetKinds = new Set((target.covers || []).map((id) => unitById.get(id)).filter(Boolean).map((u) => u.kind));
  const hasCommon = [...mergedKinds].some((k) => targetKinds.has(k));
  if (!hasCommon) {
    warn(
      `[合并] duplicatesMerged[${i}] 把 ${m.sourceUnits.join(', ')} 合并到 ${target.id}，但该块没有任何同 kind 的内容（${[
        ...mergedKinds,
      ].join(', ')}）`
    );
  }
});

/* ================================================================== *
 * 第四层：语义陷阱（Hard Error）
 * ================================================================== */

// 陷阱 1：Phase 2 不允许 source-verified（没有源码输入）
const planText = JSON.stringify(plan);
if (/"source-verified"/.test(planText)) {
  hardFail('[陷阱] plan 中出现 source-verified：本阶段没有源码输入，所有证据只能是 document-claim');
}
if (/"sourceVerified"\s*:\s*true/.test(planText)) {
  hardFail('[陷阱] plan 中出现 sourceVerified: true：本阶段没有源码输入');
}

// 陷阱 2：把 Target Design 说成 Current Reality
// 判据一（精确版）：某个 target-state 单元所在的章节，被同一个 block 的 sourceRef 标成了 current-state/current-flow。
//   注意不能粗暴地"块里只要有 current-state ref 就算" —— 一个 current-target-flow 块本来就同时
//   引用现状与目标两种来源，那是这个 shape 的正确用法。
// 判据二：文案里出现"已经/当前/现有"这类完成态措辞去描述 target-state 里的语义
const COMPLETION_PHRASES = ['已经实现', '已实现', '当前已', '现有实现已', '上线', '已生效'];
blocks.forEach((b) => {
  const coveredUnits = (b.covers || []).map((id) => unitById.get(id)).filter(Boolean);
  const targetUnits = coveredUnits.filter((u) => u.kind === 'target-state');
  const currentRefSections = new Set(
    (b.sourceRefs || [])
      .filter((r) => r.role === 'current-state' || r.role === 'current-flow')
      .map((r) => r.section)
  );
  const targetRefSections = new Set(
    (b.sourceRefs || [])
      .filter((r) => r.role === 'target-state' || r.role === 'target-flow')
      .map((r) => r.section)
  );
  // 只有"完全没有 target 侧来源、却把同章节标成现状"才算倒置（Hard Error）；
  // current-target-flow 这类块本来就同时引用现状与目标，是正确用法。
  const inverted = targetUnits.filter(
    (u) => currentRefSections.has(u.section) && !targetRefSections.has(u.section)
  );
  if (inverted.length > 0) {
    hardFail(
      `[陷阱] ${b.id} 覆盖的 target-state 语义（${inverted.map((u) => `${u.id}@${u.section}`).join(', ')}）` +
        `所在章节被标成了 current-state：这是把 Target Design 写成 Current Reality`
    );
  }
  // 较模糊的情形：一个块同时承载现状与目标语义，却没有把哪一侧是目标标清楚。
  // 这不构成倒置（可能是 current-target-flow 的正常用法），但会让读者难以分辨 —— 记为 warning。
  const ambiguous = targetUnits.filter(
    (u) => currentRefSections.has(u.section) && targetRefSections.has(u.section)
  );
  if (ambiguous.length > 0 && (b.shape === 'current-target-flow' || b.shape === 'flow')) {
    warn(
      `[边界] ${b.id} 同时承载现状与目标语义（target: ${ambiguous.map((u) => u.id).join(', ')}），` +
        `请确认渲染时两侧的 Current / Target 标签不会混`
    );
  }
  const titleAndRefs = `${b.title} ${JSON.stringify(b.sourceRefs || [])}`;
  if (targetUnits.length > 0 && COMPLETION_PHRASES.some((p) => titleAndRefs.includes(p))) {
    hardFail(`[陷阱] ${b.id} 用完成态措辞描述 target-state 语义：${titleAndRefs.slice(0, 60)}`);
  }
});

// 陷阱 3：原文明示"不决定"的内容被写成确定结论
const openQuestionIds = new Set((design && design.openQuestions ? design.openQuestions : []).map((q) => q.id));
blocks.forEach((b) => {
  const coveredUnits = (b.covers || []).map((id) => unitById.get(id)).filter(Boolean);
  const openUnits = coveredUnits.filter((u) => u.kind === 'open-question');
  if (openUnits.length === 0) return;
  const refs = new Set(b.reviewObjects || []);
  const linksOpenQuestion = [...refs].some((id) => openQuestionIds.has(id));
  if (!linksOpenQuestion) {
    hardFail(
      `[陷阱] ${b.id} 承载了"未决定"语义（${openUnits.map((u) => u.id).join(', ')}），` +
        `但 reviewObjects 里没有对应的 Open Question：原文未决事项被写成了确定内容`
    );
  }
  if (['invariant', 'target-state', 'definition'].includes(b.shape)) {
    hardFail(`[陷阱] ${b.id} 用 ${b.shape} 形状承载"未决定"语义：会把未决项表达成已定的定义或目标`);
  }
});

// 陷阱 4：原文明示"不承诺"的内容被转换成系统保证
// 注意：不能拿"一定"当保证性措辞 —— 原文的"不承诺 X 一定正确"里就含"一定"。
// 也不能把标题里的"不承诺的 5 项"当成保证 —— 那是"不承诺"的名词化用法。
// 只认真正的允诺动词："我们承诺 / 系统保证 / 确保 / 必定"，并且要求前面没有否定词。
const PROMISE_RE = /(?<![不未无])承诺|保证|确保|必定/;
blocks.forEach((b) => {
  const coveredUnits = (b.covers || []).map((id) => unitById.get(id)).filter(Boolean);
  const nonClaimUnits = coveredUnits.filter((u) => NON_CLAIM_KINDS.includes(u.kind));
  if (nonClaimUnits.length === 0) return;
  const text = `${b.title} ${(b.sourceRefs || []).map((r) => r.note || '').join(' ')}`;
  const hit = PROMISE_RE.exec(text);
  if (hit) {
    hardFail(
      `[陷阱] ${b.id} 用"${hit[0]}"描述原文明示不承诺的内容：` +
        `不承诺的语义（${nonClaimUnits.map((u) => u.id).join(', ')}）被转换成了系统保证`
    );
  }
});

// 陷阱 5：禁用措辞（原文已用过的除外）
const allowedPhrases = collectAllowedPhrases();
units.forEach((u) => {
  const hit = FORBIDDEN_PHRASES.filter((p) => !allowedPhrases.has(p)).find((p) => (u.statement || '').includes(p));
  if (hit) {
    hardFail(`[陷阱] ${u.id} 的 statement 新增了禁用措辞「${hit}」：${u.statement.slice(0, 56)}…`);
  }
});
if (allowedPhrases.size > 0) {
  console.log(`（原文本身出现过、因此放行的措辞：${[...allowedPhrases].join('、')}）\n`);
}

// 陷阱 6：编造代码事实（Phase 2 没有源码输入）
units.forEach((u) => {
  const match = CODE_PATH_RE.exec(u.statement || '');
  if (!match) return;
  const p = match[1];
  if (KNOWN_DOCUMENTED_PATHS.includes(p)) return;
  if (u.kind !== 'current-state') {
    hardFail(
      `[陷阱] ${u.id}（kind=${u.kind}）引用了代码路径 ${p}，但该路径不在原文已写明的入口清单里：` +
        `本阶段没有源码输入，不能新增代码事实`
    );
  } else {
    warn(`[事实] ${u.id} 引用了未被原文写明的代码路径 ${p}（kind=current-state），请人工确认它来自原文`);
  }
});

// 陷阱 7：人工审核状态不得出现在 plan 里
if (/"status"\s*:\s*"(approved|rejected)"/.test(planText)) {
  hardFail('[陷阱] plan 中出现人工审核状态（approved / rejected）：plan 只描述"应该展示什么"，不承载审批结果');
}

/* ------------------------------------------------------------------ *
 * 第四层附加：Shape vocabulary misuse（语义类别 / 视觉形状混淆）
 *
 * 这是三次真实模型运行里唯一稳定复现的失败。它属于 Hard Error：
 * 混淆这两个字段会直接污染整个 plan 的语义分类，必须在进入 Stage 2 前拦住。
 * ------------------------------------------------------------------ */

const SHAPE_NAME_SET = new Set(SHAPE_VOCABULARY_FOR_KIND_GUARD);
units.forEach((u, index) => {
  const kind = typeof u.kind === 'string' ? u.kind.trim() : u.kind;
  if (!SHAPE_NAME_SET.has(kind)) return;
  const where = u.id ? `sourceUnits[${index}] (${u.id})` : `sourceUnits[${index}]`;
  hardFail(
    `[kind] Semantic kind cannot use visual shape vocabulary.\n` +
      `        位置：${where}\n` +
      `        kind：「${kind}」\n` +
      `        期望：语义类别，例如 ${KIND_ENUM.slice(0, 6).join(' / ')} …\n` +
      `        说明：「${kind}」是 Visual Shape，只能出现在 block.shape 里；` +
      `请改成它在设计语义上真正的类别（例如 capability-matrix → boundary，combo → example）。`
  );
});

/* ================================================================== *
 * 第五层：容量与结构启发式（Warning）
 * ================================================================== */

const kindOf = (id) => (unitById.get(id) ? unitById.get(id).kind : null);

blocks.forEach((b) => {
  const covers = b.covers || [];
  if (covers.length > THRESHOLDS.blockCoversHeavy) {
    warn(
      `[容量] ${b.id} 覆盖 ${covers.length} 个 sourceUnit（阈值 ${THRESHOLDS.blockCoversHeavy}），可能过重` +
        (b.capacityNote ? '（已提供 capacityNote，请人工确认）' : '')
    );
  }
  const kinds = new Set(covers.map(kindOf).filter(Boolean));
  if (kinds.size > THRESHOLDS.blockKindMix) {
    warn(`[容量] ${b.id} 同时跨越 ${kinds.size} 种 semantic kind（${[...kinds].join(', ')}），语义可能混杂`);
  }
  if (b.shape === 'capability-matrix' && covers.length > THRESHOLDS.shapeCapacity['capability-matrix'].rows) {
    warn(`[容量] ${b.id} 用 capability-matrix 承载 ${covers.length} 行，超过推荐容量`);
  }
  if (b.shape === 'ladder' && covers.length > THRESHOLDS.shapeCapacity.ladder.tiers) {
    warn(`[容量] ${b.id} 用 ladder 承载 ${covers.length} 级，超过推荐容量`);
  }
  if (b.shape === 'combo' && covers.length > THRESHOLDS.shapeCapacity.combo.pairs) {
    warn(`[容量] ${b.id} 用 combo 承载 ${covers.length} 组，超过推荐容量`);
  }
  if (b.shape === 'walkthrough' && covers.length > THRESHOLDS.shapeCapacity.walkthrough.steps) {
    warn(`[容量] ${b.id} 用 walkthrough 承载 ${covers.length} 步，超过推荐容量`);
  }
});

// 一个章节被拆成过多 block
const blocksBySection = new Map();
blocks.forEach((b) => {
  const sections = new Set((b.sourceRefs || []).map((r) => r.section));
  sections.forEach((s) => {
    if (!blocksBySection.has(s)) blocksBySection.set(s, new Set());
    blocksBySection.get(s).add(b.id);
  });
});
[...blocksBySection.entries()]
  .filter(([, ids]) => ids.size > THRESHOLDS.sectionSplitTooFine)
  .forEach(([section, ids]) => {
    warn(`[碎片] ${section} 被拆成 ${ids.size} 个 block（阈值 ${THRESHOLDS.sectionSplitTooFine}），可能过碎：${[...ids].join(', ')}`);
  });

// 两个 block 高度覆盖相同 sourceUnits
for (let i = 0; i < blocks.length; i += 1) {
  for (let j = i + 1; j < blocks.length; j += 1) {
    const a = new Set(blocks[i].covers || []);
    const b = new Set(blocks[j].covers || []);
    if (a.size === 0 || b.size === 0) continue;
    const intersection = [...a].filter((id) => b.has(id));
    const ratio = intersection.length / Math.min(a.size, b.size);
    if (ratio >= THRESHOLDS.coverageOverlap) {
      warn(
        `[重复] ${blocks[i].id} 与 ${blocks[j].id} 的 coverage 重叠 ${(ratio * 100).toFixed(0)}%（${intersection.join(', ')}），可能重复表达`
      );
    }
  }
}

// 视觉重构比例
const shapeCount = {};
blocks.forEach((b) => {
  shapeCount[b.shape] = (shapeCount[b.shape] || 0) + 1;
});
const weakCount = blocks.filter((b) => WEAK_SHAPES.includes(b.shape)).length;
const visualCount = blocks.filter((b) => VISUAL_SHAPES.includes(b.shape)).length;
const visualRatio = blocks.length === 0 ? 0 : visualCount / blocks.length;
if (visualRatio < THRESHOLDS.visualShapeMinRatio) {
  warn(
    `[形状] 视觉重构类形状只占 ${(visualRatio * 100).toFixed(0)}%（阈值 ${THRESHOLDS.visualShapeMinRatio * 100}%）：` +
      `checklist / prose 这类弱视觉形状占 ${(weakCount / blocks.length * 100).toFixed(0)}%，可能没有真正做视觉重构`
  );
}
const proseCount = blocks.filter((b) => b.shape === 'prose').length;
if (proseCount > THRESHOLDS.maxProseBlocks) {
  warn(`[形状] 有 ${proseCount} 个 prose 区块（上限 ${THRESHOLDS.maxProseBlocks}）：prose 只应用于文档定位声明`);
}

// Review Object 覆盖
if (design) {
  const overviewObjects = new Set();
  blocks.forEach((b) => (b.reviewObjects || []).forEach((id) => overviewObjects.add(id)));
  const groups = [
    ['Decision', design.decisions || []],
    ['Gap', design.gaps || []],
    ['OpenQuestion', design.openQuestions || []],
  ];
  groups.forEach(([label, list]) => {
    const missing = list.filter((o) => !overviewObjects.has(o.id)).map((o) => o.id);
    if (missing.length > 0) {
      warn(`[关联] ${missing.length} 个 ${label} 没有被任何 Overview Block 关联：${missing.join(', ')}`);
    }
  });
}

/* ================================================================== *
 * 与已渲染 fixture 的一致性（如果存在）
 * ================================================================== */

const designOverviewPath = design && design.overview ? design.overview : null;
if (designOverviewPath) {
  const fixtureBlocks = design.overview.sections.flatMap((s) => s.blocks);
  const fixtureIds = new Set(fixtureBlocks.map((b) => b.id));
  const planOnly = blocks.filter((b) => !fixtureIds.has(b.id)).map((b) => b.id);
  if (planOnly.length > 0) {
    warn(`[一致性] plan 里有 ${planOnly.length} 个 block 尚未出现在 design-review.json 的 overview 中：${planOnly.join(', ')}`);
  }
}

/* ================================================================== *
 * 输出
 * ================================================================== */

const coreCount = units.filter((u) => u.importance === 'core').length;
console.log('=== overview-plan 验收 ===');
console.log(`plan      ${path.relative(ROOT, planPath)}`);
console.log(`sourceUnits ${units.length}（core ${coreCount} / supporting ${units.length - coreCount}）`);
console.log(
  `blocks      ${blocks.length}｜形状：${Object.entries(shapeCount)
    .map(([k, v]) => `${k}×${v}`)
    .join(', ')}`
);
console.log(
  `覆盖        ${coveredIds.size} / ${units.length}（合并登记 ${mergedIds.size}）｜duplicatesMerged ${merges.length} 组`
);
console.log('');

if (warnings.length > 0) {
  console.log(`WARNINGS (${warnings.length})`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`HARD ERRORS (${errors.length})`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log('');
  console.log('结果：FAIL —— 不允许进入 Stage 2（逐块生成视觉内容）。');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('结果：PASS WITH WARNINGS —— 可以进入 Stage 2，但请先处理或确认上面的 warning。');
  process.exit(0);
}

console.log('结果：PASS —— 可以进入 Stage 2（逐块生成视觉内容）。');
process.exit(0);
