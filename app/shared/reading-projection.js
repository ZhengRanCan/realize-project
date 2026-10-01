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
module.exports = { knowledge, capability, generated, provenance, assertSpace, claimVerificationCapability, projectReadingSubject };
