'use strict';

const tagged = (space, state, extra = {}) => Object.freeze({ space, state, ...extra });
const knowledge = (state) => tagged('KnowledgeState', state);
const capability = (state) => tagged('CapabilityAvailability', state);
const generated = (state) => tagged('GeneratedExpressionState', state);
const provenance = (state) => tagged('ProvenanceAssurance', state);
function assertSpace(value, space) { if (!value || value.space !== space) throw new Error(`expected ${space}`); return value; }
function claimVerificationCapability() { return capability('absent'); }
function projectReadingSubject({ plan, generated: expression, topicOccurrences = knowledge('unknown'), provenance: assurance = provenance('indeterminate') }) {
  if (!plan || !plan.id) throw new Error('plan identity required');
  assertSpace(topicOccurrences, 'KnowledgeState'); assertSpace(assurance, 'ProvenanceAssurance');
  const expressionState = expression === undefined ? generated('unknown') : expression === null ? generated('missing') : generated('present');
  return Object.freeze({ id: plan.id, title: plan.title, stage: plan.stage, shape: plan.shape, covers: [...plan.covers], reviewObjects: [...plan.reviewObjects], topicOccurrences, generated: expressionState, provenance: assurance, claimVerification: claimVerificationCapability() });
}

/**
 * Convert the already schema-validated Overview payload into the only L2 input
 * that delivery code may consume.  This adapter deliberately preserves optional
 * review-object absence: absent is Unknown, while an explicit [] is Known(0).
 * It never upgrades the relationship into evidence or support.
 */
function projectL2Overview(overview) {
  if (!overview || !Array.isArray(overview.sections)) throw new Error('overview sections required');
  const reviewObjectLinks = (block) => {
    if (!Object.prototype.hasOwnProperty.call(block, 'reviewObjects')) {
      return Object.freeze({ space: 'KnowledgeState', state: 'unknown', relation: 'related' });
    }
    const values = Object.freeze([...block.reviewObjects]);
    return Object.freeze({ space: 'KnowledgeState', state: values.length === 0 ? 'empty' : 'known', relation: 'related', values });
  };
  const sections = overview.sections.map((section) => Object.freeze({
    id: section.id,
    title: section.title,
    purpose: section.purpose,
    blocks: Object.freeze(section.blocks.map((block) => Object.freeze({
      id: block.id,
      title: block.title,
      stage: block.stage,
      role: block.role,
      defaultExpanded: block.defaultExpanded,
      content: block.content,
      sourceRefs: Object.freeze([...block.sources]),
      reviewObjectLinks: reviewObjectLinks(block),
    }))),
  }));
  return Object.freeze({ kind: 'L2ViewModel', sections: Object.freeze(sections) });
}
module.exports = { knowledge, capability, generated, provenance, assertSpace, claimVerificationCapability, projectReadingSubject, projectL2Overview };
