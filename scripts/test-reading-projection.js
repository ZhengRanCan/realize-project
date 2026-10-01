'use strict';
const p = require('../app/shared/reading-projection'); let n=0, f=0;
function test(name, fn) { try { fn(); n++; console.log(`PASS ${name}`); } catch(e) { f++; console.log(`FAIL ${name}: ${e.message}`); } }
const plan={id:'O-01',title:'Plan',stage:'what',shape:'flow',covers:['SU-1'],reviewObjects:['DEC-1']};
test('four namespaces are nominal',()=>{ for(const [v,s] of [[p.knowledge('unknown'),'KnowledgeState'],[p.capability('absent'),'CapabilityAvailability'],[p.generated('missing'),'GeneratedExpressionState'],[p.provenance('indeterminate'),'ProvenanceAssurance']]) if(v.space!==s) throw Error('space'); });
test('S3 claim verification has only absent carrier',()=>{const v=p.claimVerificationCapability(); if(v.state!=='absent'||Object.keys(v).length!==2) throw Error('carrier');});
test('identity and plan authority survive capability states',()=>{for(const g of [undefined,null,{}]) {const s=p.projectReadingSubject({plan,generated:g,topicOccurrences:p.knowledge('known-empty')}); if(s.id!=='O-01'||s.title!=='Plan'||s.generated.space!=='GeneratedExpressionState') throw Error('lost');}});
test('cross namespace is rejected',()=>{let ok=false;try{p.projectReadingSubject({plan,topicOccurrences:p.capability('absent')});}catch{ok=true;}if(!ok)throw Error('accepted');});
console.log(`${n}/${n+f} passed`); process.exit(f?1:0);
