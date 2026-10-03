'use strict';
const {resolveSourceCoordinate}=require('./source-coordinates');
const {projectReadingBundle}=require('./reading-projection');
function relatedObjects(block,objects) {
 return block.reviewObjects.map(id=>{const object=objects.find(x=>x.id===id);if(!object) throw new Error(`dangling review object ${id}`);return object;});
}
function projectL3(subject,input) {
 if(Array.isArray(input)) {
  const reviews=relatedObjects(subject,input).map(x=>({id:x.id,evidence:[...(x.evidence||[])]}));
  return Object.freeze({blockId:subject.id,traceability:{sourceUnitIds:[...subject.covers],sourceRefs:[...subject.sourceRefs]},reviewContext:reviews,claimVerification:{space:'CapabilityAvailability',state:'absent'}});
 }
 const block=input.plan.blocks.find(b=>b.id===subject.blockId);if(!block) throw new Error(`unknown Block ${subject.blockId}`);
 const projected=projectReadingBundle(input).l2ViewModel.sections.flatMap(s=>s.blocks).find(b=>b.id===block.id);
 let fragment;
 if(subject.fragmentPath!==undefined) {fragment=projected.fragmentEntries.find(f=>f.path===subject.fragmentPath);if(!fragment) throw new Error('unknown render fragment');}
 const ids=fragment?fragment.sourceUnitIds:block.covers;
 const units=ids.map(id=>{
  const unit=input.plan.sourceUnits.find(u=>u.id===id);if(!unit) throw new Error(`dangling Plan SU ${id}`);
  const coordinate=input.reports?.sourceIntegrity==='drifted'?{state:'unavailable',namespace:'plan-section',key:unit.section,reason:'原文与 registry 漂移'}:resolveSourceCoordinate(input.sourceSections,{namespace:'plan-section',key:unit.section});
  return {id:unit.id,namespace:'plan',statement:unit.statement,section:unit.section,coordinate};
 });
 const objects=['decisions','facts','gaps','openQuestions'].flatMap(bucket=>(input.designReview[bucket]||[]).map(o=>({...o,bucket})));
 const reviewContext=relatedObjects(block,objects).map(o=>({id:o.id,title:o.title||o.statement||o.question||o.id,bucket:o.bucket,relation:'related-to',evidence:('evidence' in o)?[...o.evidence]:undefined,evidenceCapability:('evidence' in o)?{space:'KnowledgeState',state:o.evidence.length?'known':'empty'}:{space:'CapabilityAvailability',state:'absent'}}));
 return {blockId:block.id,title:block.title,fragment:fragment?{path:fragment.path,text:fragment.text,kind:fragment.kind}:undefined,
   traceability:{sourceUnitIds:[...ids],sourceRefs:[...block.sourceRefs],units},reviewContext,
   generationContext:{expression:projected.generatedExpression,integrity:projected.generationIntegrity,coverage:projected.realizedCoverage},
   provenanceAssurance:{space:'ProvenanceAssurance',state:'indeterminate'},claimVerification:{space:'CapabilityAvailability',state:'absent'}};
}
module.exports={projectL3};
