# F11 只读探针

2026-09-29。只加载现有模块、内存副本；不写产品、fixture、schema 或实验产物。
执行本文件第一个 JavaScript fenced block（node stdin）；输出见 probe-output.txt（本目录）。
断言只针对字段存在、集合、对象结构；日志里的 verdict 是被审对象的原值，不是审计分类。

```javascript
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const emit = (label, value) => console.log(label + ': ' + JSON.stringify(value));
const {buildL0ViewModel} = require('./scripts/l0-view-model');
const {checkBlock} = require('./scripts/check-block');
const S = require('./app/shared/semantics');
const plan = read('fixtures/context-consumption.overview-plan.json');
const generated = read('experiments/stage2-full/overview.generated.json');
const map = read('experiments/semantic-grounding/fixture-e/run-08/framework-map.json');
const states = ['absent','empty','nonempty'].map(mode => {
  const m = clone(map);
  if(mode === 'absent') delete m.topics[0].blockIds;
  else m.topics[0].blockIds = mode === 'empty' ? [] : ['O-01'];
  const t = buildL0ViewModel(m).topics[0];
  return {mode,inputHas:Object.hasOwn(m.topics[0],'blockIds'),outputHas:Object.hasOwn(t,'blockIds'),output:t.blockIds};
});
assert.deepEqual(states[0].output, states[1].output);
emit('P1 block organization observed collapse',states);
const l0 = buildL0ViewModel(map);
assert.deepEqual(l0.elements.map(e=>e.id),map.elements.map(e=>e.id));
assert.deepEqual(l0.edges.map(e=>[e.from,e.to,e.type]),map.edges.map(e=>[e.from,e.to,e.type]));
emit('P2 L0 preservation',{elements:l0.elements.length,edges:l0.edges.length,topics:l0.topics.length,relatesTo:map.edges.filter(e=>e.type==='relates-to').length});
const missingExpression = {...clone(plan.blocks[0])};
try { const r=checkBlock(missingExpression,plan); emit('P3 absent content direct checker (invalid expression input)',{verdict:r.verdict,coverage:r.coverage}); }
catch(e) {emit('P3 absent content direct checker (invalid expression input)',{throws:e.message});}
const emptyPlan=clone(plan); emptyPlan.blocks[0].covers=[];
const emptyBlock={...clone(emptyPlan.blocks[0]),content:{type:'prose',parts:[]}};
try { const r=checkBlock(emptyBlock,emptyPlan); emit('P4 empty scope checker (plan schema rejects covers empty)',{coverage:r.coverage,verdict:r.verdict}); }
catch(e) {emit('P4 empty scope checker',{throws:e.message});}
// Evaluate the actual assembler with in-memory fs writes. Simulate missing files and reordered Plan.
function assemble(reorder, missingId) {
  const filename=path.resolve('scripts/assemble-overview.js');
  const realRequire=createRequire(filename); let output;
  const mockFs={...fs,
    readFileSync(p,...rest) {if(path.resolve(p)===path.resolve('fixtures/context-consumption.overview-plan.json')) {const x=clone(plan);if(reorder)x.blocks.reverse();return JSON.stringify(x);}return fs.readFileSync(p,...rest);},
    existsSync(p) {if(missingId && path.basename(p)==='block.generated.json' && path.basename(path.dirname(p))===missingId)return false;return fs.existsSync(p);},
    mkdirSync(){},writeFileSync(p,s){output=JSON.parse(s);}
  };
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),{require:n=>n==='node:fs'?mockFs:realRequire(n),__dirname:path.dirname(filename),process:{argv:['node',filename],exit(){}},console:{log(){}}},{filename});
  return output;
}
const assembled=assemble(false,null), reversed=assemble(true,null), missing=assemble(false,plan.blocks[0].id);
emit('P5 stage order',{original:assembled.stages.map(s=>s.id),reversed:reversed.stages.map(s=>s.id)});
assert(missing.generation.missingBlocks.includes(plan.blocks[0].id));
assert(!missing.blocks.some(b=>b.id===plan.blocks[0].id));
emit('P6 generated absence (artifact, not Plan identity)',{missing:missing.generation.missingBlocks,generatedCount:missing.blocks.length,planCount:plan.blocks.length});
const fixed=['id','title','stage','shape','covers','sourceRefs','reviewObjects','defaultExpanded'];
for(const b of assembled.blocks){const pb=plan.blocks.find(x=>x.id===b.id);for(const f of fixed)assert.deepEqual(b[f],pb[f]);}
emit('P7 assembler envelope',{blocks:assembled.blocks.length,fixedFields:fixed,roles:[...new Set(assembled.blocks.map(b=>b.role))]});
const statuses=[[],[{type:'document-claim'}],[{type:'source-verified'}]].map(e=>S.evidenceStatus(e));
assert(statuses.every(x=>!Object.hasOwn(x,'claimVerification') && !Object.hasOwn(x,'verified')));
emit('P8 evidence namespace',statuses);
const registry=read('docs/source-sections.json');
const source=fs.readFileSync(registry.document.path,'utf8').split(/\r?\n/);
const drift=registry.sections.filter(s=>source.slice(s.startLine-1,s.endLine).join('\n').replace(/\s+$/,'')!==s.text).map(s=>s.label);
emit('P9 source coordinates',{document:registry.document.path,sectionCount:registry.sections.length,drift,hasHash:Object.hasOwn(registry.document,'hash'),l0Document:map.document.sourcePath,sharedLabels:map.topics.flatMap(t=>t.sectionRefs||[]).filter(r=>registry.sections.some(s=>s.label===r))});
emit('P10 plan carrier',{blocks:plan.blocks.length,sourceUnits:plan.sourceUnits.length,hasRoleProperty:Object.hasOwn(read('schema/overview-plan.schema.json').definitions.block.properties,'role')});
```

## 报告结构校验（临时命令，不新增 scripts 文件）

执行以下第二个 fenced block；校验完整 ID 集合、七态枚举、每行证据字段、逐站源位置与匹配覆盖、backlog 资格。
它不替代人工判断，也不宣称满足 verification.md 要求的“新增脚本”原文。

```javascript
const fs=require('fs'),assert=require('node:assert/strict');
const base='docs/log/artifacts/F11-conformance-audit/';
const md=fs.readFileSync(base+'results/conformance-audit.md','utf8');
const statuses=new Set(['Compliant','Violation','Partially Compliant','Not Implemented','Capability Absent','No Executable Boundary','Needs Inspection']);
const lines=md.split('\n').filter(s=>s.startsWith('| '));
const required=[...Array.from({length:8},(_,i)=>'I'+(i+1)),...Array.from({length:9},(_,i)=>'S'+(i+1)),...Array.from({length:12},(_,i)=>'N'+(i+1))];
const records=lines.map(s=>s.split('|').slice(1,-1).map(x=>x.trim())).filter(c=>statuses.has(c[1]));
for(const id of required)assert.equal(records.filter(c=>c[0]===id).length,1,id);
for(let i=1;i<=6;i++)assert.equal(records.filter(c=>c[0].startsWith('Q'+i+'-')).length,1);
for(const c of records)assert(c.at(-1).length>0,'missing evidence '+c[0]);
for(const l of lines){const c=l.split('|').slice(1,-1).map(x=>x.trim());if(/^(I\d|S\d|N\d|Q\d-|Decision-)/.test(c[0]))assert(statuses.has(c[1]),'illegal status '+c[0]);}
const scan=JSON.parse(fs.readFileSync(base+'results/epistemic-sites.json','utf8'));
let count=0;
for(const p of scan.scope){const source=fs.readFileSync(p,'utf8').split('\n');source.forEach((s,i)=>{if(s.trim().startsWith('//')||s.trim().startsWith('*'))return;for(const m of s.matchAll(new RegExp(scan.patterns,'g'))){count++;const r=scan.sites.find(r=>r.file===p&&r.line===i+1&&r.column===m.index+1);assert(r,'missing site '+p+':'+(i+1));assert.equal(r.expression,s.trim());assert(statuses.has(r.status));assert(r.reason.length>0);assert(['yes','no'].includes(r.unknownEmpty));}});}
assert.equal(count,scan.sites.length);
assert(scan.sites.filter(r=>r.status==='Violation').every(r=>r.unknownEmpty==='yes'));
// Verify every explicit file:line reference resolves to a real nonempty line.
let refs=0;
for(const m of md.matchAll(/((?:scripts|app|schema|ai)\/[A-Za-z0-9_./-]+):(\d+)/g)){const s=fs.readFileSync(m[1],'utf8').split('\n');assert(s[Number(m[2])-1]?.trim(),'bad line '+m[0]);refs++;}
console.log('Audit structure: 29 invariants + 6 starting questions; legal statuses and nonempty evidence.');
console.log('Site coverage: '+count+' occurrences; '+scan.sites.filter(r=>r.unknownEmpty==='yes').length+' confirmed collapse.');
console.log('Evidence locations: '+refs+' file:line references resolve.');
```
