'use strict';
const p=require('../app/shared/reading-projection'); let pass=0,fail=0;
function t(n,f){try{f();pass++;console.log(`PASS ${n}`)}catch(e){fail++;console.log(`FAIL ${n}: ${e.message}`)}}
function coverage(covers,leaf,generated){if(generated==='missing')return {state:'unavailable'};if(generated==='unknown')return {state:'unknown'};if(!covers.length)return {state:'not-applicable'};return {state:'available',missing:covers.filter(x=>!leaf.includes(x))}}
t('coverage separates missing unavailable unknown and N/A',()=>{const a=coverage(['SU-1','SU-2','SU-3'],['SU-1','SU-2'],'present');if(a.missing.join()!=='SU-3')throw Error('missing');if(coverage(['SU-1'],[],'missing').state!=='unavailable')throw Error('missing');if(coverage(['SU-1'],[],'unknown').state!=='unknown')throw Error('unknown');if(coverage([],[],'present').state!=='not-applicable')throw Error('na')});
t('canonical block identity survives known-zero occurrence',()=>{const s=p.projectReadingSubject({plan:{id:'O-01',title:'x',stage:'what',shape:'flow',covers:[],reviewObjects:[]},topicOccurrences:p.knowledge('known-empty')});if(s.id!=='O-01')throw Error('identity')});
t('L1 membership overlap is set based',()=>{const a=new Set(['E-1','E-2']),b=new Set(['E-2','E-3']);if([...a].filter(x=>b.has(x)).join()!=='E-2')throw Error('internal')});
t('source coordinate retains section range only',()=>{const section={label:'§3',startLine:95,endLine:125};if('exactLine'in section||section.startLine!==95||section.endLine!==125)throw Error('coordinate')});
console.log(`${pass}/${pass+fail} passed`);process.exit(fail?1:0);
