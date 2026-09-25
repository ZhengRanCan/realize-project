#!/usr/bin/env node
'use strict';

/**
 * 一次性数据回填脚本（保留备查）：
 * 为收缩版 MVP 补上 design.summary、models[].role、decisions[].rationaleSummary、
 * decisions[].relatedQuestions。
 *
 * 用法：node scripts/backfill-mvp-data.js
 * 幂等：重复运行不会重复写入，只会覆盖成同一份内容。
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'fixtures', 'context-consumption.json');

const RATIONALE_SUMMARY = {
  'DEC-001':
    '把“到了 / 可用 / 真的被用了”拆成三个独立状态，否则无法解释“上下文已保存但没参与生成”这类真实中间态。',
  'DEC-002':
    'Influence 的定义含“可归因于”，已经进入甚至强于 Output Alignment，要证明它必须做反事实比较与控制变量。',
  'DEC-003':
    '两者回答不同问题，混在一起就无法区分“没有消费上下文”与“消费了但输出没体现”。',
  'DEC-004':
    '日志到达、session 保存、内存里存在对象都只证明“到了”，不足以证明“可用”，合法性只能由服务端校验补齐。',
  'DEC-005':
    '产品要求是教学语义成为真实输入；若用可见差异当判据，系统会为证明个性化而强行制造结构差异。',
  'DEC-006':
    '“没纳入考虑”和“考虑后没采用”是两种完全不同的失职，必须在报告里可区分。',
  'DEC-007':
    'scene pipeline 的职责是实现已经产生的 outline；让每个 scene 直接消费完整 context 会造成重复解释、revision 混用与成本上升。',
  'DEC-008':
    '这是 DEC-007 的直接推论：既然消费点在 outline，scene 就不该再重新解释整份 Frozen Context。',
  'DEC-009':
    '以 Request 计数会掩盖重试，以 Revision 计数会漏掉“某次 Attempt 已消费但最终生成失败”的情形。',
  'DEC-010':
    '函数被调用、Prompt 含上下文、生成成功都不等于教学语义成为课程设计输入，纵容它们会让产品叙事虚假达成。',
  'DEC-011':
    '现有函数已经占据对应职责入口，沿边界改造最短；新建一套平行基础设施会与“不为本文档重构”的约束冲突。',
  'DEC-012':
    '本文开头与第九节反复声明其非授权性质，不澄清这一点会导致文档被当作实现许可直接开工。',
};

/** Open Question 只依附于一条 Decision，避免同一问题在多张卡片重复出现。 */
const PRIMARY_DECISION_FOR_QUESTION = {
  'Q-001': 'DEC-001',
  'Q-002': 'DEC-009',
  'Q-003': 'DEC-007',
  'Q-004': 'DEC-005',
  'Q-005': 'DEC-004',
  'Q-006': 'DEC-004',
  'Q-007': 'DEC-002',
  'Q-008': 'DEC-011',
  'Q-009': 'DEC-010',
  'Q-010': 'DEC-009',
};

const MODEL_ROLE = { 'MODEL-001': 'primary', 'MODEL-002': 'auxiliary' };

const DESIGN_SUMMARY =
  '把课前教学上下文的“被使用”严格拆成三级递进 —— 上下文到达（Receipt）、合法冻结且可用（Availability）、本次生成实际把教学语义当作课程设计输入（Consumption），并明确把消费点定在 outline generation，而不是让每个 scene 各自重新解释整份冻结上下文。';

/** 按固定顺序重建 Decision 的键，保证 diff 可读。 */
function rebuildDecision(d) {
  const ordered = {};
  const known = [
    'id', 'title', 'type', 'reviewLevel', 'question', 'proposal', 'rationaleSummary',
    'alternatives', 'rationale', 'consequences', 'dependsOn', 'affects',
    'relatedGaps', 'relatedQuestions', 'evidence', 'status',
  ];
  known.forEach((key) => {
    if (key in d) ordered[key] = d[key];
  });
  Object.keys(d).forEach((key) => {
    if (!(key in ordered)) ordered[key] = d[key];
  });
  return ordered;
}

const model = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

model.design.summary = DESIGN_SUMMARY;

model.models = model.models.map((m) => {
  const ordered = { id: m.id, title: m.title, role: MODEL_ROLE[m.id] || m.role || 'auxiliary', type: m.type, source: m.source };
  if (m.note) ordered.note = m.note;
  return ordered;
});

model.decisions = model.decisions.map((d) => {
  const summary = RATIONALE_SUMMARY[d.id];
  if (!summary) throw new Error(`缺少 ${d.id} 的 rationaleSummary`);
  const relatedQuestions = Object.entries(PRIMARY_DECISION_FOR_QUESTION)
    .filter(([, decisionId]) => decisionId === d.id)
    .map(([questionId]) => questionId);
  return rebuildDecision({ ...d, rationaleSummary: summary, relatedQuestions });
});

fs.writeFileSync(FIXTURE, `${JSON.stringify(model, null, 2)}\n`, 'utf8');

const total = model.decisions.reduce((sum, d) => sum + d.relatedQuestions.length, 0);
console.log(`已回填: design.summary=1, models.role=${model.models.length}, rationaleSummary=${model.decisions.length}, relatedQuestions=${total}`);
const orphans = model.openQuestions.filter((q) => !model.decisions.some((d) => d.relatedQuestions.includes(q.id)));
console.log(`未挂到任何 Decision 的 Open Question: ${orphans.length === 0 ? '无' : orphans.map((q) => q.id).join(', ')}`);
