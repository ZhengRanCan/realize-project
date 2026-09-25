'use strict';

/**
 * Implementation Gate（agent.md 第十七节）。
 *
 * 真正的判定逻辑在 app/shared/semantics.js —— 同一份代码被主进程和渲染进程共用，
 * 这里只做转发，避免出现两套口径。
 *
 * Gate 规则：
 *   pending / rejected / needs-revision / needs-evidence 的 Decision  → BLOCKED
 *   类别为 architecture-blocking / implementation-blocking 且未由人工关闭的 Question → BLOCKED
 *   被判定不成立的 Gap → BLOCKED
 *
 * 注意：deferred / research 类别的问题即使设计上"未决定"，也不阻塞实现。
 */

const semantics = require('./semantics');

module.exports = {
  evaluateGate: semantics.evaluateGate,
  buildHumanReviewSkeleton: semantics.buildHumanReviewSkeleton,
  REVIEW_STATUSES: semantics.REVIEW_STATUSES,
  REVIEW_LEVELS: semantics.REVIEW_LEVELS,
  BLOCKING_QUESTION_CATEGORIES: semantics.BLOCKING_QUESTION_CATEGORIES,
  CLOSED_QUESTION_STATUSES: semantics.CLOSED_QUESTION_STATUSES,
  isBlockingCategory: semantics.isBlockingCategory,
  isQuestionBlocking: semantics.isQuestionBlocking,
  reviewSummary: semantics.reviewSummary,
  nextReviewItem: semantics.nextReviewItem,
};
