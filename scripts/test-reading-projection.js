'use strict';
const p = require('../app/shared/reading-projection'); let n=0, f=0;
function test(name, fn) { try { fn(); n++; console.log(`PASS ${name}`); } catch(e) { f++; console.log(`FAIL ${name}: ${e.message}`); } }
const plan={id:'O-01',title:'Plan',stage:'what',shape:'flow',covers:['SU-1'],reviewObjects:['DEC-1']};
test('four namespaces are nominal',()=>{ for(const [v,s] of [[p.knowledge('unknown'),'KnowledgeState'],[p.capability('absent'),'CapabilityAvailability'],[p.generated('missing'),'GeneratedExpressionState'],[p.provenance('indeterminate'),'ProvenanceAssurance']]) if(v.space!==s) throw Error('space'); });
test('S3 claim verification has only absent carrier',()=>{const v=p.claimVerificationCapability(); if(v.state!=='absent'||Object.keys(v).length!==2) throw Error('carrier');});
test('identity and plan authority survive capability states',()=>{for(const g of [undefined,null,{}]) {const s=p.projectReadingSubject({plan,generated:g,topicOccurrences:p.knowledge('known-empty')}); if(s.id!=='O-01'||s.title!=='Plan'||s.generated.space!=='GeneratedExpressionState') throw Error('lost');}});
test('cross namespace is rejected',()=>{let ok=false;try{p.projectReadingSubject({plan,topicOccurrences:p.capability('absent')});}catch{ok=true;}if(!ok)throw Error('accepted');});
test('generated cannot override plan authority',()=>{const s=p.projectReadingSubject({plan,generated:{title:'Generated',stage:'prove',shape:'matrix',covers:[],reviewObjects:[]}}); for(const k of ['title','stage','shape']) if(s[k]!==plan[k]) throw Error(k); if(s.covers[0]!=='SU-1'||s.reviewObjects[0]!=='DEC-1') throw Error('refs');});
test('present missing unknown retain the same subject',()=>{const rows=[{},null,undefined].map(g=>p.projectReadingSubject({plan,generated:g})); if(!rows.every(s=>s.id==='O-01'))throw Error('identity'); if(new Set(rows.map(s=>s.generated.state)).size!==3)throw Error('states');});
test('module exposes no generic cross-space derivation',()=>{if(Object.keys(p).some(k=>/derive.*status/i.test(k)))throw Error('generic helper');});
test('projection is deterministic and input-pure',()=>{const before=JSON.stringify(plan); const a=p.projectReadingSubject({plan}),b=p.projectReadingSubject({plan}); if(JSON.stringify(a)!==JSON.stringify(b)||before!==JSON.stringify(plan))throw Error('impure');});
console.log(`${n}/${n+f} passed`); process.exit(f?1:0);
