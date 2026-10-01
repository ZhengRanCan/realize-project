'use strict';
const p=require('../app/shared/reading-projection'); let pass=0,fail=0;
const plan={id:'O-01',title:'t',stage:'what',shape:'flow',covers:['SU-017'],reviewObjects:['DEC-005']};
function t(name,fn){try{fn();pass++;console.log(`PASS ${name}`)}catch(e){fail++;console.log(`FAIL ${name}: ${e.message}`)}}
const subject=(x={})=>p.projectReadingSubject({plan,...x});
t('S1 preserves absent empty values and generated missing unknown',()=>{const a=subject({topicOccurrences:p.knowledge('unknown')}),b=subject({topicOccurrences:p.knowledge('known-empty')}),c=subject({topicOccurrences:p.knowledge('known-values')});if(new Set([a.topicOccurrences.state,b.topicOccurrences.state,c.topicOccurrences.state]).size!==3)throw Error('collapse');if(new Set([subject({generated:null}).generated.state,subject({generated:{}}).generated.state,subject({}).generated.state]).size!==3)throw Error('generated collapse')});
t('S3 does_not_create_claim_verification_value_carrier',()=>{const s=subject();if(Object.keys(s).some(k=>/verification.*value|verified/i.test(k))||s.claimVerification.state!=='absent')throw Error('carrier')});
t('S4 target flow provenance is indeterminate not unsupported',()=>{const s=subject({provenance:p.provenance('indeterminate')});if(s.provenance.state!=='indeterminate'||Object.values(s).some(v=>v&&v.state==='unsupported'))throw Error('upgraded')});
t('N6 does_not_create_semantic_evidence_link_from_coordinate_overlap_alone',()=>{const s=subject({coordinate:{file:'x',section:'§3',contains:[100,110]}});if('semanticEvidenceLinks'in s||'evidence'in s)throw Error('link')});
t('N7 source_verified_evidence_does_not_create_claim_verified',()=>{const s=subject({evidence:{type:'source-verified'}});if('claimVerified'in s||s.claimVerification.state!=='absent')throw Error('upgrade')});
t('N8 approved_reviewed_pass_does_not_create_claim_verified',()=>{const s=subject({decision:{status:'approved'},reviewed:true,generation:{verdict:'PASS'}});if('claimVerified'in s||s.claimVerification.state!=='absent')throw Error('upgrade')});
console.log(`${pass}/${pass+fail} passed`);process.exit(fail?1:0);
