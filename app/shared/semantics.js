/**
 * Review 语义（单一事实来源）。
 *
 * 同一份文件同时被两个运行时使用：
 * - Node（Electron 主进程 / 脚本）：module.exports
 * - 浏览器（Renderer）：window.DesignReviewShared
 *
 * 之所以这样做：Implementation Gate、reviewLevel 展开规则、Evidence 状态判定
 * 如果在主进程和渲染进程各写一份，很容易出现"UI 说可以实施、Gate 说不行"的分歧。
 */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.DesignReviewShared = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---------------- 常量 ---------------- */

  const REVIEW_STATUSES = ['pending', 'approved', 'rejected', 'needs-revision', 'needs-evidence'];

  const REVIEW_LEVELS = ['root', 'supporting', 'derived'];

  const REVIEW_LEVEL_LABELS = {
    root: 'Root',
    supporting: 'Supporting',
    derived: 'Derived',
  };

  const QUESTION_CATEGORIES = [
    'architecture-blocking',
    'implementation-blocking',
    'deferred',
    'research',
  ];

  const QUESTION_CATEGORY_LABELS = {
    'architecture-blocking': 'Architecture Blocking',
    'implementation-blocking': 'Implementation Blocking',
    deferred: 'Deferred',
    research: 'Research',
  };

  /** 只有这两个类别的问题真正阻塞实现。 */
  const BLOCKING_QUESTION_CATEGORIES = ['architecture-blocking', 'implementation-blocking'];

  /** 人工关闭 Open Question 的状态；其余（含 pending）都视为未关闭。 */
  const CLOSED_QUESTION_STATUSES = ['resolved'];

  const EVIDENCE_TYPES = ['document-claim', 'source-verified'];

  const EVIDENCE_TYPE_LABELS = {
    'document-claim': 'Document Claim',
    'source-verified': 'Source Verified',
  };

  const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

  /* ---------------- Review Level ---------------- */

  function reviewLevelOf(decision) {
    return REVIEW_LEVELS.includes(decision.reviewLevel) ? decision.reviewLevel : 'supporting';
  }

  function rootDecisions(model) {
    return (model.decisions || []).filter((d) => reviewLevelOf(d) === 'root');
  }

  function nonRootDecisions(model) {
    return (model.decisions || []).filter((d) => reviewLevelOf(d) !== 'root');
  }

  /**
   * 一个 Decision 的关联 Decision：它依赖的（向上）+ 依赖它的（向下）。
   * 用于从 root 展开 supporting / derived，而不需要用户理解整个依赖图。
   */
  function relatedDecisions(model, decision) {
    const decisions = model.decisions || [];
    const byId = new Map(decisions.map((d) => [d.id, d]));
    const seen = new Set([decision.id]);
    const result = [];

    const push = (other, relation) => {
      if (!other || seen.has(other.id)) return;
      seen.add(other.id);
      result.push({ decision: other, relation });
    };

    (decision.dependsOn || []).forEach((id) => {
      push(byId.get(id), 'upstream');
      // 同一 root 下的兄弟节点：它们的 dependsOn 与本 Decision 有交集
      const anchor = byId.get(id);
      if (!anchor) return;
      decisions.forEach((other) => {
        if (other.id === decision.id) return;
        if ((other.dependsOn || []).includes(anchor.id)) push(other, 'sibling');
      });
    });

    decisions.forEach((other) => {
      if ((other.dependsOn || []).includes(decision.id)) push(other, 'downstream');
    });

    return result;
  }

  /** 该 Decision 是否"由本 root 支配"，用于判断展开关系是否成立。 */
  function sharesRoot(model, a, b) {
    const rootsOf = (decision) => {
      const byId = new Map((model.decisions || []).map((d) => [d.id, d]));
      const found = new Set();
      const walk = (current, depth) => {
        if (depth > 8) return;
        reviewLevelOf(current) === 'root' ? found.add(current.id) : null;
        (current.dependsOn || []).forEach((id) => {
          const next = byId.get(id);
          if (next) walk(next, depth + 1);
        });
      };
      walk(decision, 0);
      return found;
    };
    const rootsA = rootsOf(a);
    return [...rootsOf(b)].some((id) => rootsA.has(id));
  }

  /* ---------------- Open Question ---------------- */

  function isBlockingCategory(category) {
    return BLOCKING_QUESTION_CATEGORIES.includes(category);
  }

  function categoryOf(question) {
    return QUESTION_CATEGORIES.includes(question.category) ? question.category : 'research';
  }

  function isQuestionClosed(humanStatus) {
    return CLOSED_QUESTION_STATUSES.includes(humanStatus || 'pending');
  }

  /** 是否真正阻塞实现：类别 + 人工状态。blocking 字段只是文档主张，不参与判定。 */
  function isQuestionBlocking(question, humanStatus) {
    if (!isBlockingCategory(categoryOf(question))) return false;
    return !isQuestionClosed(humanStatus);
  }

  function blockingQuestions(model, humanReview) {
    const reviewed = (humanReview && humanReview.openQuestions) || {};
    return (model.openQuestions || []).filter((q) =>
      isQuestionBlocking(q, reviewed[q.id] && reviewed[q.id].status)
    );
  }

  function advisoryQuestions(model, humanReview) {
    const reviewed = (humanReview && humanReview.openQuestions) || {};
    return (model.openQuestions || []).filter(
      (q) => !isQuestionBlocking(q, reviewed[q.id] && reviewed[q.id].status)
    );
  }

  /* ---------------- Evidence ---------------- */

  function evidenceTypeOf(evidence) {
    return EVIDENCE_TYPES.includes(evidence.type) ? evidence.type : 'document-claim';
  }

  function evidenceCounts(evidence) {
    const list = evidence || [];
    const claims = list.filter((e) => evidenceTypeOf(e) === 'document-claim').length;
    const verified = list.filter((e) => evidenceTypeOf(e) === 'source-verified').length;
    return { total: list.length, claims, verified };
  }

  /**
   * 一条 Review Object 的证据状态。
   * 当前阶段（Phase 1/2）没有任何 source-verified，因此 status 只会是
   * none / document-claim-only，绝不能被展示成源码已验证。
   */
  function evidenceStatus(evidence) {
    const { total, claims, verified } = evidenceCounts(evidence);
    if (total === 0) {
      return {
        status: 'none',
        label: 'No evidence',
        detail: '这条判断没有任何来源，人工审核时通常应选择 Needs Evidence。',
      };
    }
    if (verified === 0) {
      return {
        status: 'document-claim-only',
        label: 'Document claim only',
        detail: `${claims} 条证据全部来自文档主张，尚未由源码核对。`,
      };
    }
    if (claims === 0) {
      return {
        status: 'source-verified',
        label: 'Source verified',
        detail: `${verified} 条证据已由源码 / 测试 / 配置核对。`,
      };
    }
    return {
      status: 'mixed',
      label: 'Mixed',
      detail: `${verified} 条已源码核对，${claims} 条仍只是文档主张。`,
    };
  }

  /* ---------------- Impact / Consequence ---------------- */

  /**
   * Default 视图只展示 Impact summary：从 consequences 取最靠前的若干条。
   * 不是新字段，只是对现有 consequences 的折叠策略。
   */
  function impactSummary(decision, limit) {
    const max = typeof limit === 'number' ? limit : 2;
    return (decision.consequences || []).slice(0, max);
  }

  function impactOverflow(decision, limit) {
    const max = typeof limit === 'number' ? limit : 2;
    return Math.max(0, (decision.consequences || []).length - max);
  }

  /* ---------------- 关联 Gap / 严重度 ---------------- */

  function relatedGaps(model, decision) {
    const byId = new Map((model.gaps || []).map((g) => [g.id, g]));
    const explicit = (decision.relatedGaps || []).map((id) => byId.get(id)).filter(Boolean);
    if (explicit.length > 0) {
      return explicit.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    }
    // 没有显式声明时，退回 Gap 侧的 relatedDecisions（兼容旧数据）
    return (model.gaps || [])
      .filter((g) => (g.relatedDecisions || []).includes(decision.id))
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }

  function highImpactGaps(model) {
    return (model.gaps || [])
      .filter((g) => g.severity === 'high')
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }

  /* ---------------- Implementation Gate ---------------- */

  function decisionStatus(humanReview, id) {
    const entry = (humanReview && humanReview.decisions && humanReview.decisions[id]) || null;
    return (entry && entry.status) || 'pending';
  }

  function questionStatus(humanReview, id) {
    const entry = (humanReview && humanReview.openQuestions && humanReview.openQuestions[id]) || null;
    return (entry && entry.status) || 'pending';
  }

  function gapStatus(humanReview, id) {
    const entry = (humanReview && humanReview.gaps && humanReview.gaps[id]) || null;
    return (entry && entry.status) || 'pending';
  }

  function evaluateGate(designReview, humanReview) {
    const blockers = [];

    (designReview.decisions || []).forEach((d) => {
      const status = decisionStatus(humanReview, d.id);
      const base = { id: d.id, label: d.title, reviewLevel: reviewLevelOf(d) };
      if (status === 'pending') {
        blockers.push({ ...base, kind: 'pending-decision', detail: 'Decision 仍为 pending，尚未人工处理。' });
      } else if (status === 'rejected') {
        blockers.push({ ...base, kind: 'rejected-decision', detail: 'Decision 已被 Reject，需要重新设计后才能实施。' });
      } else if (status === 'needs-revision') {
        blockers.push({ ...base, kind: 'needs-revision', detail: 'Decision 标记为 Needs Revision，方案必须修改。' });
      } else if (status === 'needs-evidence') {
        blockers.push({ ...base, kind: 'needs-evidence', detail: 'Decision 标记为 Needs Evidence，证据不足，不得据此实施。' });
      }
    });

    (designReview.openQuestions || []).forEach((q) => {
      const status = questionStatus(humanReview, q.id);
      if (!isQuestionBlocking(q, status)) return;
      blockers.push({
        kind: 'blocking-open-question',
        id: q.id,
        label: q.question,
        category: categoryOf(q),
        detail: `blocking Open Question（${QUESTION_CATEGORY_LABELS[categoryOf(q)]}）仍未由人工关闭。`,
      });
    });

    (designReview.gaps || []).forEach((g) => {
      const status = gapStatus(humanReview, g.id);
      if (status === 'rejected') {
        blockers.push({
          kind: 'rejected-gap',
          id: g.id,
          label: g.title,
          detail: 'Gap 已被判定为不成立（Reject），需要重新分析。',
        });
      }
    });

    return { ready: blockers.length === 0, blockers };
  }

  function buildHumanReviewSkeleton(designReview) {
    const decisions = {};
    (designReview.decisions || []).forEach((d) => {
      decisions[d.id] = { status: 'pending', comment: '' };
    });
    const openQuestions = {};
    (designReview.openQuestions || []).forEach((q) => {
      openQuestions[q.id] = { status: 'pending', comment: '' };
    });
    const gaps = {};
    (designReview.gaps || []).forEach((g) => {
      gaps[g.id] = { status: 'pending', comment: '' };
    });
    return { reviewVersion: 1, decisions, openQuestions, gaps };
  }

  /* ---------------- Review Dashboard ---------------- */

  /**
   * 下一个该看的东西。优先级：
   * 1. 未处理的 root Decision（按是否有 needs-* / 依赖是否已批准排序）
   * 2. 未关闭的 blocking Question
   * 3. 未被人工确认的 high-impact Gap
   * 4. 未处理的 supporting / derived Decision
   */
  function nextReviewItem(model, humanReview) {
    const roots = rootDecisions(model);
    const pendingRoot = roots.filter((d) => decisionStatus(humanReview, d.id) === 'pending');
    if (pendingRoot.length > 0) {
      // 依赖更少、更靠前的 root 优先（保证批准顺序合理）
      const sorted = pendingRoot
        .slice()
        .sort((a, b) => (a.dependsOn || []).length - (b.dependsOn || []).length);
      return {
        kind: 'decision',
        id: sorted[0].id,
        title: sorted[0].title,
        reason: `还有 ${pendingRoot.length} 条 root Decision 未审核`,
        view: 'queue',
        remaining: pendingRoot.length,
      };
    }

    const blocking = blockingQuestions(model, humanReview);
    if (blocking.length > 0) {
      return {
        kind: 'question',
        id: blocking[0].id,
        title: blocking[0].question,
        reason: `还有 ${blocking.length} 条 blocking Open Question 未关闭`,
        view: 'questions',
        remaining: blocking.length,
      };
    }

    const unresolvedGaps = (model.gaps || []).filter((g) => {
      const status = gapStatus(humanReview, g.id);
      return status === 'pending' && g.severity === 'high';
    });
    if (unresolvedGaps.length > 0) {
      return {
        kind: 'gap',
        id: unresolvedGaps[0].id,
        title: unresolvedGaps[0].title,
        reason: `还有 ${unresolvedGaps.length} 个 high-impact Gap 未被人工确认`,
        view: 'gaps',
        remaining: unresolvedGaps.length,
      };
    }

    const pendingOthers = nonRootDecisions(model).filter(
      (d) => decisionStatus(humanReview, d.id) === 'pending'
    );
    if (pendingOthers.length > 0) {
      return {
        kind: 'decision',
        id: pendingOthers[0].id,
        title: pendingOthers[0].title,
        reason: `root Decision 已处理完，还有 ${pendingOthers.length} 条 supporting / derived Decision`,
        view: 'queue',
        remaining: pendingOthers.length,
      };
    }

    return null;
  }

  /** Review Dashboard 需要的全部数字，一次算清，避免 UI 各处口径不一致。 */
  function reviewSummary(model, humanReview) {
    const decisions = model.decisions || [];
    const counts = { pending: 0, approved: 0, rejected: 0, 'needs-revision': 0, 'needs-evidence': 0 };
    decisions.forEach((d) => {
      const status = decisionStatus(humanReview, d.id);
      counts[status] = (counts[status] || 0) + 1;
    });

    const roots = rootDecisions(model);
    const rootPending = roots.filter((d) => decisionStatus(humanReview, d.id) === 'pending').length;
    const others = nonRootDecisions(model);
    const otherPending = others.filter((d) => decisionStatus(humanReview, d.id) === 'pending').length;

    const gaps = model.gaps || [];
    const gapCounts = { confirmed: 0, pending: 0, rejected: 0, 'needs-evidence': 0 };
    gaps.forEach((g) => {
      const status = gapStatus(humanReview, g.id);
      gapCounts[status] = (gapCounts[status] || 0) + 1;
    });

    return {
      decisions: {
        total: decisions.length,
        counts,
        rootTotal: roots.length,
        rootPending,
        rootPendingIds: roots.filter((d) => decisionStatus(humanReview, d.id) === 'pending').map((d) => d.id),
        otherTotal: others.length,
        otherPending,
      },
      questions: {
        total: (model.openQuestions || []).length,
        blocking: blockingQuestions(model, humanReview).length,
        advisory: advisoryQuestions(model, humanReview).length,
        byCategory: QUESTION_CATEGORIES.reduce((acc, category) => {
          acc[category] = (model.openQuestions || []).filter((q) => categoryOf(q) === category).length;
          return acc;
        }, {}),
      },
      gaps: {
        total: gaps.length,
        high: highImpactGaps(model).length,
        highUnresolved: gaps.filter((g) => g.severity === 'high' && gapStatus(humanReview, g.id) === 'pending').length,
        counts: gapCounts,
      },
      rework: counts.rejected + counts['needs-revision'] + counts['needs-evidence'],
      next: nextReviewItem(model, humanReview),
    };
  }

  return {
    REVIEW_STATUSES,
    REVIEW_LEVELS,
    REVIEW_LEVEL_LABELS,
    QUESTION_CATEGORIES,
    QUESTION_CATEGORY_LABELS,
    BLOCKING_QUESTION_CATEGORIES,
    CLOSED_QUESTION_STATUSES,
    EVIDENCE_TYPES,
    EVIDENCE_TYPE_LABELS,
    SEVERITY_ORDER,
    reviewLevelOf,
    rootDecisions,
    nonRootDecisions,
    relatedDecisions,
    sharesRoot,
    categoryOf,
    isBlockingCategory,
    isQuestionClosed,
    isQuestionBlocking,
    blockingQuestions,
    advisoryQuestions,
    evidenceTypeOf,
    evidenceCounts,
    evidenceStatus,
    impactSummary,
    impactOverflow,
    relatedGaps,
    highImpactGaps,
    decisionStatus,
    questionStatus,
    gapStatus,
    evaluateGate,
    buildHumanReviewSkeleton,
    nextReviewItem,
    reviewSummary,
  };
});
