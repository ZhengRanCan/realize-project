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
const STAGE_ORDER = ['what','how','prove','boundary'];
function projectReadingBundle(input) {
  const {plan,generated:expression,frameworkMap}=input;
  const {normalizeGeneratedBlock}=require('./generated-expression');
  const {collectElements}=require('../../scripts/check-block');
  const {projectTopic}=require('./l1-topic-projection');
  const sections=STAGE_ORDER.map(stage=>({id:stage,title:stage,purpose:'',blocks:plan.blocks.filter(p=>p.stage===stage).map(p=>{
    const raw=expression?.blocks.find(b=>b.id===p.id), content=raw?normalizeGeneratedBlock(raw).block.content:null;
    const fragmentEntries=content?collectElements(content):[];
    const realized=new Set(fragmentEntries.filter(f=>!f.presentation).flatMap(f=>f.sourceUnitIds));
    const report=input.reports?.generated?.blockResults[p.id];
    const missing=p.covers.filter(id=>!realized.has(id));
    const integrity=raw?{space:'GenerationIntegrity',state:'present',verdict:raw.generation?.verdict==='FAIL'?'FAIL':report?(report.errors.length?'FAIL':report.warnings.length?'PASS_WITH_WARNINGS':'PASS'):(raw.generation?.verdict||'UNKNOWN'),errors:report?.errors||[],warnings:report?.warnings||[]}:{space:'GenerationIntegrity',state:'unavailable'};
    return Object.freeze({id:p.id,title:p.title,stage:p.stage,shape:p.shape,covers:[...p.covers],role:'primary',defaultExpanded:p.defaultExpanded,content,
      sourceRefs:[...new Set(p.sourceRefs.map(r=>r.section))],reviewObjectLinks:{space:'KnowledgeState',state:p.reviewObjects.length?'known':'empty',relation:'related-to',values:[...p.reviewObjects]},
      generatedExpression:generated(expression===undefined?'unknown':raw?'present':'missing'),generationIntegrity:integrity,
      realizedCoverage:!raw?{space:'RealizedCoverage',state:'unavailable'}:!p.covers.length?{space:'RealizedCoverage',state:'not-applicable'}:{space:'RealizedCoverage',state:'available',total:p.covers.length,covered:p.covers.length-missing.length,missing},
      provenanceAssurance:provenance('indeterminate'),fragmentEntries});
  })}));
  const l1Topics=frameworkMap?Object.fromEntries(frameworkMap.topics.map(t=>[t.id,projectTopic(frameworkMap,t.id,{plan,sourceSections:input.sourceSections,sourceIntegrity:input.reports?.sourceIntegrity,sourceSha256:input.sourceSha256})])):null;
  return {l2ViewModel:Object.freeze({kind:'L2ViewModel',sections}),l1Topics};
}
module.exports = { knowledge, capability, generated, provenance, assertSpace, claimVerificationCapability, projectReadingSubject, projectL2Overview, projectReadingBundle, STAGE_ORDER };
