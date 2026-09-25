'use strict';

/**
 * design-review.json 的结构性一致性检查（semantic checks）。
 *
 * 只做“文件内部自洽”的检查，不判断设计内容是否正确：
 * - summary 计数必须与实际条目数一致；
 * - dependsOn / relatedDecisions / relatedGaps 必须指向存在的对象 id；
 * - 所有 id 全局唯一；
 * - Decision 缺少 evidence 只作为 warning（Markdown 阶段可能确实没有章节可引）。
 *
 * 任何 error 都不允许进入 Review UI。
 */

const ID_RE = /^[A-Z]+-(\d{3})$/;

function semanticCheck(model) {
  const errors = [];
  const warnings = [];
  const seen = new Map();

  const register = (id, kind, where) => {
    if (seen.has(id)) {
      errors.push(`${where}: id "${id}" 与 ${seen.get(id)} 重复`);
    } else {
      seen.set(id, kind);
    }
  };

  (model.models || []).forEach((m, i) => register(m.id, 'model', `models[${i}]`));
  (model.facts || []).forEach((f, i) => register(f.id, 'fact', `facts[${i}]`));
  (model.decisions || []).forEach((d, i) => register(d.id, 'decision', `decisions[${i}]`));
  (model.gaps || []).forEach((g, i) => register(g.id, 'gap', `gaps[${i}]`));
  (model.openQuestions || []).forEach((q, i) => register(q.id, 'open-question', `openQuestions[${i}]`));

  const decisionIds = new Set((model.decisions || []).map((d) => d.id));
  const gapIds = new Set((model.gaps || []).map((g) => g.id));
  const questionIds = new Set((model.openQuestions || []).map((q) => q.id));

  const checkRefs = (ids, where, allowed, kindLabel) => {
    (ids || []).forEach((id) => {
      if (!seen.has(id)) {
        errors.push(`${where}: 引用了不存在的 ${kindLabel} "${id}"`);
      } else if (allowed && !allowed.has(id)) {
        errors.push(`${where}: "${id}" 不是合法的 ${kindLabel} 引用`);
      }
    });
  };

  (model.decisions || []).forEach((d, i) => {
    const where = `decisions[${i}] (${d.id})`;
    checkRefs(d.dependsOn, `${where}.dependsOn`, decisionIds, 'Decision');
    checkRefs(d.relatedGaps, `${where}.relatedGaps`, gapIds, 'Gap');
    checkRefs(d.relatedQuestions, `${where}.relatedQuestions`, questionIds, 'Open Question');
    if (d.dependsOn.includes(d.id)) errors.push(`${where}.dependsOn: 不能依赖自身`);
    if (!['root', 'supporting', 'derived'].includes(d.reviewLevel)) {
      errors.push(`${where}.reviewLevel: "${d.reviewLevel}" 不是 root / supporting / derived`);
    }
    if (d.reviewLevel !== 'root' && d.dependsOn.length === 0) {
      warnings.push(`${where}: reviewLevel=${d.reviewLevel} 但没有 dependsOn，Decisions 里将无法从 root 找到它`);
    }
    if (!d.evidence || d.evidence.length === 0) {
      warnings.push(`${where}: 没有 evidence，人工审核时可能需要 Needs Evidence`);
    }
    if (!d.alternatives || d.alternatives.length === 0) {
      warnings.push(`${where}: alternatives 为空（若无明确 alternative 这是允许的）`);
    }
  });

  // 收缩版 MVP：Open Question 通过 Decision 呈现，检查是否有遗漏。
  const attachedQuestions = new Set();
  (model.decisions || []).forEach((d) => (d.relatedQuestions || []).forEach((id) => attachedQuestions.add(id)));
  (model.openQuestions || []).forEach((q) => {
    if (!attachedQuestions.has(q.id)) {
      warnings.push(`openQuestions (${q.id}): 没有挂到任何 Decision 的 relatedQuestions，UI 里将无处展示`);
    }
  });

  // 图形约束：语义图现在由 overview 的 flow / ladder 区块承载（models 字段已移除）。
  const models = model.models || [];
  if (models.length > 0) {
    warnings.push('models: 该字段已被 overview 的 flow / ladder 区块取代，请确认是否还需要保留');
  }

  /* ---------------- Overview 视觉层检查 ---------------- */

  const overview = model.overview;
  if (overview && Array.isArray(overview.sections)) {
    const blockIds = new Set();
    let blockCount = 0;

    overview.sections.forEach((section, si) => {
      const where = `overview.sections[${si}] (${section.id})`;
      (section.blocks || []).forEach((block, bi) => {
        blockCount += 1;
        const w = `${where}.blocks[${bi}] (${block.id})`;
        if (blockIds.has(block.id)) errors.push(`${w}: 区块 id 重复`);
        blockIds.add(block.id);
        if (block.stage !== section.id) {
          errors.push(`${w}.stage="${block.stage}" 与其所在段落 "${section.id}" 不一致`);
        }
        if (!block.sources || block.sources.length === 0) {
          errors.push(`${w}.sources: 必须至少标注一个原文章节`);
        }
        checkRefs(block.reviewObjects, `${w}.reviewObjects`, null, 'Review Object');

        const content = block.content || {};
        if (content.type === 'matrix') {
          (content.rows || []).forEach((row, ri) => {
            if (row.length !== (content.columns || []).length) {
              errors.push(
                `${w}.content.rows[${ri}]: 单元格 ${row.length} 个，与 columns ${(content.columns || []).length} 个不匹配`
              );
            }
          });
        }
        if (content.type === 'combo') {
          (content.pairs || []).forEach((pair, pi) => {
            if (pair.keyVariants && pair.keyVariants.length !== pair.key.split('·').length) {
              warnings.push(
                `${w}.content.pairs[${pi}]: keyVariants ${pair.keyVariants.length} 个，与 key 的 token 数 ${pair.key.split('·').length} 不一致`
              );
            }
          });
        }
      });
    });

    if (blockCount === 0) errors.push('overview: 至少要有一个区块');

    // 覆盖检查：每条 Decision 都应当能在覆盖表 / 某个区块或 Review Object 里被承载
    const referenced = new Set();
    overview.sections.forEach((section) => {
      (section.blocks || []).forEach((block) => {
        (block.reviewObjects || []).forEach((id) => referenced.add(id));
      });
    });
    const unreferenced = (model.decisions || []).filter((d) => !referenced.has(d.id)).map((d) => d.id);
    if (unreferenced.length > 0) {
      warnings.push(
        `overview: 以下 Decision 没有被任何区块作为 Review Object 引用：${unreferenced.join(', ')}（应确认它们仍有承载体）`
      );
    }
  }

  (model.gaps || []).forEach((g, i) => {
    const where = `gaps[${i}] (${g.id})`;
    checkRefs(g.relatedDecisions, `${where}.relatedDecisions`, decisionIds, 'Decision');
    if (g.affectedFiles.some((f) => /[^\x00-\x7F]/.test(f) && f.includes(' '))) {
      warnings.push(`${where}.affectedFiles: 路径含空格与中文，请确认`);
    }
  });

  (model.openQuestions || []).forEach((q, i) => {
    const where = `openQuestions[${i}] (${q.id})`;
    checkRefs(q.relatedDecisions, `${where}.relatedDecisions`, decisionIds, 'Decision');
    checkRefs(q.relatedGaps, `${where}.relatedGaps`, gapIds, 'Gap');
    const blockingCategory = ['architecture-blocking', 'implementation-blocking'].includes(q.category);
    if (blockingCategory !== q.blocking) {
      errors.push(
        `${where}: category="${q.category}" 与 blocking=${q.blocking} 不一致（只有 architecture-blocking / implementation-blocking 可以为 true）`
      );
    }
  });

  const summary = model.summary || {};
  const expected = {
    pendingDecisions: (model.decisions || []).filter((d) => d.status === 'pending').length,
    gaps: (model.gaps || []).length,
    openQuestions: (model.openQuestions || []).length,
  };
  Object.entries(expected).forEach(([key, actual]) => {
    if (summary[key] !== actual) {
      errors.push(`summary.${key} = ${summary[key]}，实际为 ${actual}`);
    }
  });

  return { errors, warnings };
}

module.exports = { semanticCheck, ID_RE };
