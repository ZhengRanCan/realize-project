#!/usr/bin/env node
'use strict';

/**
 * Stage 2 的块级验收器：`npm run check-block`
 *
 * 输入：一个生成后的 Visual Block JSON（AI 只返回 shape + content；固定字段由程序从 plan 注入）
 * 输出：PASS / PASS WITH WARNINGS / FAIL
 *
 * 核心不是"JSON 合法吗"，而是：
 *
 *   Plan 中已经确认需要表达的语义，在视觉转换之后是否仍然存在？
 *
 * 因此本文件必须计算 **Block Semantic Coverage**（covers vs content provenance）。
 *
 * 用法：
 *   node scripts/check-block.js <block.json> --plan <plan.json>
 *   node scripts/check-block.js experiments/stage2/O-04/block.generated.json --plan fixtures/context-consumption.overview-plan.json
 *
 * 也可作为模块使用：const { checkBlock } = require('./check-block.js')
 */

const fs = require('node:fs');
const path = require('node:path');

const { validate } = require('../app/shared/schema-validator');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PLAN = path.join(ROOT, 'fixtures', 'context-consumption.overview-plan.json');
const STAGE2_SCHEMA = path.join(ROOT, 'schema', 'stage2-block.schema.json');
const SOURCE_SECTIONS = path.join(ROOT, 'docs', 'source-sections.json');

/* ================================================================== *
 * 阈值集中配置
 * ================================================================== */

const THRESHOLDS = {
  /** 一个视觉元素最多挂多少个 sourceUnit（超过说明它被当成垃圾桶） */
  elementProvenanceMax: 4,
  /** 单个文本字段超过多少字符算"过长，可能退化成 prose" */
  textTooLong: 160,
  /** 一个块里允许的"长文本元素"比例上限 */
  longTextRatioMax: 0.4,
  /** 同一个 sourceUnit 出现在多少个元素里算重复 */
  sourceUnitReuseMax: 2,
  /** 一个元素承载超过多少个 sourceUnit 且文本很短 → 疑似过度概括 */
  overCompressMinUnits: 4,
  overCompressMaxChars: 60,
  /** shape catalog 的推荐容量（与 check-plan 的配置保持一致） */
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

/** shape → 期望的 content.type（必须一致，Hard Error 之一） */
const SHAPE_TO_CONTENT_TYPE = {
  prose: 'prose',
  flow: 'flow',
  'current-target-flow': 'flow',
  matrix: 'matrix',
  'capability-matrix': 'matrix',
  diff: 'diff',
  ladder: 'ladder',
  walkthrough: 'steps',
  combo: 'combo',
  checklist: 'checklist',
  'two-column-comparison': 'checklist',
};

/**
 * Phase 2 禁用措辞：与 check-plan 一致，原文本身出现过的措辞放行。
 * 这里管的是 Stage 2 生成的 content 文本。
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

/** 真正的允诺动词（用于 non-claim → claim 检查）。 */
const PROMISE_RE = /(?<![不未无])承诺|保证|确保|必定/;

/** 完成态措辞：不能用来描述 target-state。 */
const COMPLETION_PHRASES = ['已经实现', '已实现', '当前已', '现行已', '已上线', '已生效', '现已'];

/**
 * 纯展示标签白名单：这些是 renderer 的固定文案，不承载原文语义，因此不要求 provenance。
 * 判据（与 Stage 2 prompt 一致）：**删掉它不会损失原文语义** → 纯展示标签。
 *
 * 其余结构元素（panel title、lane label、自定义行首、diff 侧标题等）只要带有实际生成的文本，
 * 就视为 semantic-bearing，必须有 sourceUnitIds，否则 Hard Error。
 */
const PRESENTATION_LABELS = new Set([
  'current',
  'target',
  '现状',
  '目标',
  '现在',
  '能说明',
  '不能说明',
  '能说明什么',
  '不能说明什么',
  '主语',
  '层级',
  '维度',
  '说明',
  '备注',
  '内容',
  '产品层级',
  'note',
  'notes',
]);

/** 判断一段结构元素的文本是不是纯展示标签。 */
function isPresentationLabel(text) {
  const t = String(text || '').trim();
  if (t === '') return true; // 空标题不承载语义
  if (PRESENTATION_LABELS.has(t.toLowerCase())) return true;
  // "Step 1" / "步骤 2" / "第 3 组" 这类位置提示
  if (/^(step|步骤|第)?\s*\d+\s*(步|组|项)?$/i.test(t)) return true;
  return false;
}

/* ================================================================== *
 * 工具：遍历 content 里的"可寻址元素"
 * ================================================================== */

/**
 * 把 content 展平成 { path, text, sourceUnitIds, kind } 列表。
 * kind 用来在报告里说明这个元素在视觉上是什么（节点 / 行 / 条目 / 步骤…）。
 */
function collectElements(content) {
  const out = [];
  if (!content || typeof content !== 'object') return out;

  const push = (p, text, sourceUnitIds, kind, extra) => {
    const t = typeof text === 'string' ? text : '';
    out.push({
      path: p,
      text: t,
      sourceUnitIds: sourceUnitIds || [],
      kind,
      // semantic-bearing = 带实际生成文本、且不是 renderer 固定文案
      semantic: !isPresentationLabel(t),
      ...extra,
    });
  };

  const type = content.type;

  if (type === 'prose') {
    (content.parts || []).forEach((part, i) => push(`parts[${i}]`, part.text, part.sourceUnitIds, '段落', { variant: part.variant }));
  }

  if (type === 'flow') {
    (content.lanes || []).forEach((lane, li) => {
      push(`lanes[${li}]`, lane.label, lane.sourceUnitIds, '泳道', { variant: lane.variant });
      (lane.nodes || []).forEach((item, ni) => {
        const node = item.node || {};
        push(
          `lanes[${li}].nodes[${ni}].node`,
          `${node.title || ''}${node.detail ? `｜${node.detail}` : ''}`,
          node.sourceUnitIds,
          '节点',
          { state: node.state }
        );
        if (item.edge) {
          push(`lanes[${li}].nodes[${ni}].edge`, item.edge.note || '', item.edge.sourceUnitIds, '边', { edgeKind: item.edge.kind });
        }
      });
    });
  }

  if (type === 'matrix') {
    (content.columns || []).forEach((c, i) => push(`columns[${i}]`, c, [], '列标题', { presentation: true }));
    (content.rows || []).forEach((row, ri) => {
      (row || []).forEach((cell, ci) => {
        const text = typeof cell === 'string' ? cell : cell.text;
        push(`rows[${ri}][${ci}]`, text, cell && cell.sourceUnitIds, ci === 0 ? '行首' : '单元格', {
          variant: cell && cell.variant,
        });
      });
    });
  }

  if (type === 'diff') {
    (content.sides || []).forEach((side, si) => {
      push(`sides[${si}]`, side.label, side.sourceUnitIds, '一栏', { variant: side.variant });
      (side.lines || []).forEach((line, li) => {
        push(`sides[${si}].lines[${li}]`, `${line.text}${line.note ? `｜${line.note}` : ''}`, line.sourceUnitIds, '差异行', {
          mark: line.mark,
        });
      });
    });
  }

  if (type === 'ladder') {
    (content.tiers || []).forEach((tier, i) => {
      push(`tiers[${i}]`, `${tier.label}｜${tier.text}${tier.detail ? `｜${tier.detail}` : ''}`, tier.sourceUnitIds, '梯度', {
        variant: tier.variant,
      });
    });
  }

  if (type === 'steps') {
    (content.steps || []).forEach((step, i) => {
      push(`steps[${i}]`, `${step.text}${step.note ? `｜${step.note}` : ''}`, step.sourceUnitIds, '步骤');
    });
    if (content.verdict) push('verdict', content.verdict.text, content.verdict.sourceUnitIds, '结论');
  }

  if (type === 'combo') {
    (content.pairs || []).forEach((pair, i) => {
      push(`pairs[${i}]`, `${pair.key}｜${pair.value}`, pair.sourceUnitIds, '组合');
    });
  }

  if (type === 'checklist') {
    (content.panels || []).forEach((panel, pi) => {
      push(`panels[${pi}]`, panel.title || '', panel.sourceUnitIds, '分组', { variant: panel.variant });
      (panel.items || []).forEach((item, ii) => {
        push(`panels[${pi}].items[${ii}]`, `${item.text}${item.note ? `｜${item.note}` : ''}`, item.sourceUnitIds, '条目', {
          variant: item.variant,
        });
      });
    });
  }

  return out;
}

/** 只统计"承载语义的元素"（排除表头这类无 provenance 的结构件）。 */
function contentElements(content) {
  // 纯展示标签（列标题等）不参与语义覆盖统计
  return collectElements(content).filter((e) => !e.presentation);
}

/* ================================================================== *
 * 主校验
 * ================================================================== */

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * @param {object} block 生成的 block（AI 返回的 shape+content，固定字段由程序注入）
 * @param {object} plan  overview-plan
 * @param {object} [options] { allowedPhrases?: Set, sourceText?: string }
 * @returns {{verdict:'PASS'|'PASS WITH WARNINGS'|'FAIL', errors:string[], warnings:string[], coverage:object, elements:Array}}
 */
function checkBlock(block, plan, options = {}) {
  const errors = [];
  const warnings = [];
  const hardFail = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  const schema = loadJson(STAGE2_SCHEMA);
  const unitById = new Map((plan.sourceUnits || []).map((u) => [u.id, u]));
  const planBlock = (plan.blocks || []).find((b) => b.id === block.id);

  /* ---------------- 1. 固定字段不得被修改 ---------------- */

  if (!planBlock) {
    hardFail(`[plan] 找不到 id = ${block && block.id} 的 plan block —— 无法校验固定字段`);
  } else {
    const FIXED = ['id', 'title', 'stage', 'shape', 'covers', 'sourceRefs', 'reviewObjects', 'defaultExpanded'];
    FIXED.forEach((field) => {
      const fromPlan = JSON.stringify(planBlock[field]);
      const fromBlock = JSON.stringify(block[field]);
      if (fromBlock !== fromPlan) {
        hardFail(`[plan] 固定字段被修改：${field}\n        plan:  ${fromPlan}\n        block: ${fromBlock}`);
      }
    });
  }

  /* ---------------- 2. Schema（含 shape ↔ content.type 结构） ---------------- */

  const schemaResult = validate(schema, { shape: block.shape, content: block.content });
  if (!schemaResult.valid) {
    schemaResult.errors.slice(0, 20).forEach((e) => hardFail(`[schema] ${e}`));
    if (schemaResult.errors.length > 20) hardFail(`[schema] 另有 ${schemaResult.errors.length - 20} 条结构错误未列出`);
  }

  /* ---------------- 3. shape ↔ content.type 一致 ---------------- */

  const expectedType = SHAPE_TO_CONTENT_TYPE[block.shape];
  const actualType = block.content && block.content.type;
  if (expectedType && actualType && expectedType !== actualType) {
    hardFail(`[shape] shape 与 content.type 不一致：shape=${block.shape} 期望 content.type=${expectedType}，实际 ${actualType}`);
  }

  /* ---------------- 4. provenance 合法性 + Block Semantic Coverage ---------------- */

  const elements = contentElements(block.content);
  const provenanceIds = new Set();
  const perElement = [];

  elements.forEach((el) => {
    const ids = el.sourceUnitIds || [];
    ids.forEach((id) => {
      provenanceIds.add(id);
      if (!unitById.has(id)) {
        hardFail(`[provenance] ${el.path} 引用了不存在的 sourceUnit：${id}`);
      } else if (planBlock && !(planBlock.covers || []).includes(id)) {
        hardFail(
          `[provenance] ${el.path} 引用了不在 block.covers 中的 sourceUnit：${id}` +
            `（本块 covers = ${(planBlock.covers || []).join(', ')}）`
        );
      }
    });
    perElement.push({ path: el.path, kind: el.kind, ids });
    if (ids.length === 0) {
      // Semantic-bearing structural element 缺 provenance 是 **Hard Error**：
      // Stage 2 的目标就是"每个真正承载原文语义的生成元素都能回溯 sourceUnit"。
      // 纯展示标签（CURRENT / TARGET / 能说明 / 不能说明 / Step 1 …）不受此规则影响。
      if (el.semantic) {
        hardFail(
          `[provenance] ${el.path}（${el.kind}）含实际生成语义文本，但没有 sourceUnitIds：「${(el.text || '').slice(0, 50)}」` +
            ` —— 承载语义的结构元素必须可回溯；若它只是 renderer 固定文案，请改成固定标签`
        );
      } else {
        warn(`[provenance] ${el.path}（${el.kind}）没有 sourceUnitIds（已识别为纯展示标签，不要求 provenance）`);
      }
    }
    if (ids.length > THRESHOLDS.elementProvenanceMax) {
      warn(`[provenance] ${el.path}（${el.kind}）挂了 ${ids.length} 个 sourceUnit，超过 ${THRESHOLDS.elementProvenanceMax}：可能是"垃圾桶元素"`);
    }
    if (ids.length >= THRESHOLDS.overCompressMinUnits && (el.text || '').length <= THRESHOLDS.overCompressMaxChars) {
      warn(
        `[密度] ${el.path}（${el.kind}）用 ${(el.text || '').length} 字承载 ${ids.length} 条语义，可能过度概括：${(el.text || '').slice(0, 40)}…`
      );
    }
    if ((el.text || '').length > THRESHOLDS.textTooLong) {
      el.__longText = true;
    }
  });

  const covers = (planBlock && planBlock.covers) || [];
  const covered = covers.filter((id) => provenanceIds.has(id));
  const missing = covers.filter((id) => !provenanceIds.has(id));
  const missingCore = missing.filter((id) => unitById.get(id) && unitById.get(id).importance === 'core');
  const missingSupporting = missing.filter((id) => unitById.get(id) && unitById.get(id).importance === 'supporting');

  missingCore.forEach((id) => {
    const u = unitById.get(id);
    hardFail(`[coverage] core sourceUnit 没有任何 content element 承载：${id}（${u.section} / ${u.kind}）— ${u.statement.slice(0, 50)}…`);
  });
  missingSupporting.forEach((id) => {
    const u = unitById.get(id);
    warn(`[coverage] supporting sourceUnit 没有被任何 content element 承载：${id}（${u.section}）— ${u.statement.slice(0, 50)}…`);
  });

  const coverage = {
    total: covers.length,
    covered: covered.length,
    missing,
    missingCore,
    missingSupporting,
    ratio: covers.length === 0 ? 1 : covered.length / covers.length,
  };

  /* ---------------- 5. sourceUnit 复用 ---------------- */

  const reuse = new Map();
  elements.forEach((el) => {
    new Set(el.sourceUnitIds || []).forEach((id) => {
      reuse.set(id, (reuse.get(id) || 0) + 1);
    });
  });
  [...reuse.entries()]
    .filter(([, n]) => n > THRESHOLDS.sourceUnitReuseMax)
    .forEach(([id, n]) => warn(`[重复] ${id} 在 ${n} 个元素里重复出现，可能内容冗余`));

  /* ---------------- 6. 语义陷阱 ---------------- */

  const allowed = options.allowedPhrases || new Set();
  const coveredUnits = covers.map((id) => unitById.get(id)).filter(Boolean);
  const hasTargetUnits = coveredUnits.some((u) => u.kind === 'target-state');
  const hasOpenQuestion = coveredUnits.some((u) => u.kind === 'open-question');
  const hasNonClaim = coveredUnits.some((u) => ['non-claim', 'non-goal', 'open-question'].includes(u.kind));

  // 6.1 Phase 2 不允许 source-verified
  const raw = JSON.stringify(block);
  if (/"source-verified"/.test(raw) || /"sourceVerified"\s*:\s*true/.test(raw)) {
    hardFail('[陷阱] content 中出现 source-verified / sourceVerified：本阶段没有源码输入，只能是 document-claim');
  }

  // 6.2 禁用措辞（原文已用过的除外）
  elements.forEach((el) => {
    const hit = FORBIDDEN_PHRASES.filter((p) => !allowed.has(p)).find((p) => (el.text || '').includes(p));
    if (hit) hardFail(`[陷阱] ${el.path} 新增了禁用措辞「${hit}」：${(el.text || '').slice(0, 60)}…`);
  });

  const allText = elements.map((e) => e.text).join(' ｜ ');

  // 6.3 Current / Target 反转
  if (contentType(block) === 'flow') {
    (block.content.lanes || []).forEach((lane, li) => {
      const ids = lane.sourceUnitIds || [];
      const laneUnits = ids.map((id) => unitById.get(id)).filter(Boolean);
      const laneHasTarget = laneUnits.some((u) => u.kind === 'target-state');
      const laneHasCurrent = laneUnits.some((u) => ['current-state', 'responsibility'].includes(u.kind));
      const declared = lane.variant;
      if (declared === 'current' && laneHasTarget && !laneHasCurrent) {
        hardFail(`[反转] lanes[${li}]（${lane.label}）声明为 current，但其 provenance 只含 target-state 语义（${ids.join(', ')}）`);
      }
      if (declared === 'target' && laneHasCurrent && !laneHasTarget) {
        hardFail(`[反转] lanes[${li}]（${lane.label}）声明为 target，但其 provenance 只含 current-state 语义（${ids.join(', ')}）`);
      }
      (lane.nodes || []).forEach((item, ni) => {
        const node = item.node || {};
        const nodeUnits = (node.sourceUnitIds || []).map((id) => unitById.get(id)).filter(Boolean);
        if (node.state === 'current' && nodeUnits.some((u) => u.kind === 'target-state')) {
          hardFail(`[反转] lanes[${li}].nodes[${ni}] 的 state=current，但 provenance 含 target-state 语义（${node.sourceUnitIds.join(', ')}）`);
        }
        if (node.state === 'target' && nodeUnits.some((u) => u.kind === 'current-state')) {
          hardFail(`[反转] lanes[${li}].nodes[${ni}] 的 state=target，但 provenance 含 current-state 语义（${node.sourceUnitIds.join(', ')}）`);
        }
      });
    });
    // current-target-flow 必须两侧都在
    if (block.shape === 'current-target-flow') {
      const variants = (block.content.lanes || []).map((l) => l.variant);
      if (!variants.includes('current') || !variants.includes('target')) {
        hardFail(`[反转] current-target-flow 需要同时存在 current 与 target 两个泳道，实际：${JSON.stringify(variants)}`);
      }
    }
  }
  // 完成态措辞不能描述 target
  if (hasTargetUnits) {
    elements.forEach((el) => {
      const hit = COMPLETION_PHRASES.find((p) => (el.text || '').includes(p));
      if (hit) {
        const elUnits = (el.sourceUnitIds || []).map((id) => unitById.get(id)).filter(Boolean);
        if (elUnits.every((u) => u.kind === 'target-state')) {
          hardFail(`[陷阱] ${el.path} 用完成态措辞「${hit}」描述 target-state 语义：${(el.text || '').slice(0, 50)}…`);
        }
      }
    });
  }

  // 6.4 未决事项被写成确定结论
  if (hasOpenQuestion) {
    const openIds = coveredUnits.filter((u) => u.kind === 'open-question').map((u) => u.id);
    openIds.forEach((id) => {
      const carriers = elements.filter((el) => (el.sourceUnitIds || []).includes(id));
      if (carriers.length === 0) {
        hardFail(`[陷阱] 未决语义 ${id} 在 content 中没有落点：plan 的未决事项被丢掉了`);
        return;
      }
      const definitive = /已确定|已决定|确定为|最终决定|应采用|将采用/;
      carriers.forEach((el) => {
        if (definitive.test(el.text || '')) {
          hardFail(`[陷阱] ${el.path} 把未决语义 ${id} 写成了确定结论：${(el.text || '').slice(0, 60)}…`);
        }
      });
    });
    // 未决类语义不应被塞进"定义/阶梯/矩阵行首"这类断言性位置
    if (['ladder', 'capability-matrix'].includes(block.shape)) {
      if (elements.some((el) => (el.sourceUnitIds || []).some((id) => unitById.get(id) && unitById.get(id).kind === 'open-question'))) {
        hardFail(`[陷阱] shape=${block.shape} 是断言性形状，却承载了"未决定"语义`);
      }
    }
  }

  // 6.5 non-claim 被写成 claim
  if (hasNonClaim) {
    const nonClaimIds = coveredUnits
      .filter((u) => ['non-claim', 'non-goal'].includes(u.kind))
      .map((u) => u.id);
    nonClaimIds.forEach((id) => {
      const carriers = elements.filter((el) => (el.sourceUnitIds || []).includes(id));
      carriers.forEach((el) => {
        const hit = PROMISE_RE.exec(el.text || '');
        if (hit) {
          hardFail(`[陷阱] ${el.path} 用「${hit[0]}」描述 non-claim 语义 ${id}：不承诺的内容被写成了系统保证`);
        }
      });
    });
  }

  /* ---------------- 7. 形状容量 / prose 化 ---------------- */

  const capacity = THRESHOLDS.shapeCapacity[block.shape];
  const type = contentType(block);
  if (capacity) {
    const counts = {
      lanes: (block.content.lanes || []).length,
      rows: (block.content.rows || []).length,
      tiers: (block.content.tiers || []).length,
      steps: (block.content.steps || []).length,
      pairs: (block.content.pairs || []).length,
      panels: (block.content.panels || []).length,
      columns: (block.content.columns || []).length,
      parts: (block.content.parts || []).length,
      linesPerSide: Math.max(0, ...(block.content.sides || []).map((s) => (s.lines || []).length)),
      nodesPerLane: Math.max(0, ...(block.content.lanes || []).map((l) => (l.nodes || []).length)),
      itemsPerPanel: Math.max(0, ...(block.content.panels || []).map((p) => (p.items || []).length)),
    };
    Object.entries(capacity).forEach(([key, max]) => {
      const actual = counts[key];
      if (typeof actual === 'number' && actual > max) {
        warn(`[容量] ${key} = ${actual}，超过 shape catalog 对 ${block.shape} 的推荐值 ${max}`);
      }
    });
  }

  const longTextCount = elements.filter((e) => (e.text || '').length > THRESHOLDS.textTooLong).length;
  if (elements.length > 0 && longTextCount / elements.length > THRESHOLDS.longTextRatioMax) {
    warn(
      `[prose] ${longTextCount}/${elements.length} 个元素的文本超过 ${THRESHOLDS.textTooLong} 字，可能退化成 prose（形状没有被真正用起来）`
    );
  }
  if (type === 'prose' && block.shape !== 'prose') {
    warn('[prose] content.type 是 prose，但它不是文档定位声明');
  }

  const verdict = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'PASS WITH WARNINGS' : 'PASS';
  return { verdict, errors, warnings, coverage, elements, missing };
}

function contentType(block) {
  return block && block.content ? block.content.type : undefined;
}

/* ================================================================== *
 * CLI
 * ================================================================== */

function parseArgs(argv) {
  const args = { plan: DEFAULT_PLAN, block: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--plan') {
      args.plan = path.resolve(ROOT, argv[i + 1]);
      i += 1;
    } else if (!argv[i].startsWith('--')) {
      args.block = path.resolve(argv[i]);
    }
  }
  return args;
}

function allowedPhrasesFromSource() {
  try {
    const source = loadJson(SOURCE_SECTIONS);
    const text = source.sections.map((s) => s.text).join('\n');
    return new Set(FORBIDDEN_PHRASES.filter((p) => text.includes(p)));
  } catch (error) {
    return new Set();
  }
}

/**
 * 兼容性归一化：把"扁平 nodes"归一成 renderer 契约的形状。
 *
 * 背景：Stage 2 实测中模型会把节点写成
 *   nodes: [{ title, detail, state, sourceUnitIds, edge }]
 * 而 renderer 契约是
 *   nodes: [{ node: { title, ... }, edge: { ... } }]
 * 前者是**同一个语义、不同的写法**。这里只做结构搬移（把节点字段包进 node），
 * **不修改任何文本**，并把发生的事情记录成一条 note，便于报告如实呈现。
 *
 * 只处理"没有 node 键、但有 title"的条目，避免误伤正确写法。
 */
function normalizeFlatNodes(input) {
  const block = JSON.parse(JSON.stringify(input));
  const notes = [];
  const content = block.content;
  if (!content || content.type !== 'flow' || !Array.isArray(content.lanes)) return { block, notes };

  let rewrites = 0;
  content.lanes.forEach((lane) => {
    if (!Array.isArray(lane.nodes)) return;
    lane.nodes = lane.nodes.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      if (entry.node || !entry.title) return entry;
      const { edge, ...nodeFields } = entry;
      rewrites += 1;
      return edge ? { node: nodeFields, edge } : { node: nodeFields };
    });
  });
  if (rewrites > 0) {
    notes.push(
      `[契约] 检测到 ${rewrites} 个"扁平节点"写法（nodes[] 直接放 title/detail），已按 renderer 契约归一为 { node: {...}, edge: {...} } —— 这是结构差异，不是语义错误`
    );
  }
  return { block, notes };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.block) {
    console.error('用法：node scripts/check-block.js <block.json> [--plan <plan.json>]');
    process.exit(2);
  }
  const raw = loadJson(args.block);
  const plan = loadJson(args.plan);
  const { block, notes: normalizeNotes } = normalizeFlatNodes(raw);
  const result = checkBlock(block, plan, { allowedPhrases: allowedPhrasesFromSource() });
  normalizeNotes.forEach((n) => result.warnings.unshift(n));
  if (normalizeNotes.length > 0 && result.errors.length === 0) {
    result.verdict = result.warnings.length > 0 ? 'PASS WITH WARNINGS' : 'PASS';
  }

  const planBlock = (plan.blocks || []).find((b) => b.id === block.id) || {};
  console.log('=== Stage 2 block 验收 ===');
  console.log(`block    ${block.id}｜shape=${block.shape}｜stage=${planBlock.stage || '?'}`);
  console.log(`title    ${planBlock.title || '?'}`);
  console.log(`content  type=${contentType(block)}｜主要元素 ${result.elements.length} 个`);
  console.log(
    `coverage ${result.coverage.covered} / ${result.coverage.total}` +
      `（${(result.coverage.ratio * 100).toFixed(0)}%）` +
      (result.coverage.missing.length > 0 ? `｜未承载：${result.coverage.missing.join(', ')}` : '')
  );
  console.log('');

  const originProv = result.elements.filter((e) => (e.sourceUnitIds || []).length === 0).length;
  if (originProv > 0) console.log(`provenance 缺失的元素：${originProv} / ${result.elements.length}`);
  console.log('');

  if (result.warnings.length > 0) {
    console.log(`WARNINGS (${result.warnings.length})`);
    result.warnings.forEach((w) => console.log(`  ! ${w}`));
    console.log('');
  }
  if (result.errors.length > 0) {
    console.log(`HARD ERRORS (${result.errors.length})`);
    result.errors.forEach((e) => console.log(`  ✗ ${e}`));
    console.log('');
    console.log('结果：FAIL —— 这个块不能进入 Overview。');
    process.exit(1);
  }
  if (result.warnings.length > 0) {
    console.log('结果：PASS WITH WARNINGS —— 结构可用，但请人工确认上面的 warning。');
    process.exit(0);
  }
  console.log('结果：PASS');
  process.exit(0);
}

module.exports = { checkBlock, collectElements, contentElements, SHAPE_TO_CONTENT_TYPE, THRESHOLDS };

if (require.main === module) main();
