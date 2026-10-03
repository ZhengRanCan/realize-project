'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {projectReadingBundle}=require('../app/shared/reading-projection'),{projectL3}=require('../app/shared/l3-inspector-projection');
const {projectTopic}=require('../app/shared/l1-topic-projection');
const {buildSourceRegistry,resolveSourceCoordinate}=require('../app/shared/source-coordinates');
const {buildL0ViewModel}=require('./l0-view-model'),{renderL0MapHTML}=require('../app/renderer/l0-map');
async function main(){const root=await fs.mkdtemp(path.join(os.tmpdir(),'f15-integration-'));try{
 const {models}=await makeBundleFixture(root),before=JSON.stringify(models);
 const vm=projectReadingBundle(models),blocks=vm.l2ViewModel.sections.flatMap(s=>s.blocks);
 assert.deepEqual(new Set(blocks.map(b=>b.id)),new Set(models.plan.blocks.map(b=>b.id)));
 for(const b of blocks){const plan=models.plan.blocks.find(p=>p.id===b.id);assert.equal(b.title,plan.title);assert.deepEqual(b.covers,plan.covers);assert.deepEqual(b.reviewObjectLinks.values,plan.reviewObjects);assert.equal(b.reviewObjectLinks.relation,'related-to');assert.equal(b.provenanceAssurance.state,'indeterminate');const l3=projectL3({blockId:b.id},models);assert.equal(l3.blockId,b.id);assert.equal(l3.claimVerification.state,'absent');assert.equal(l3.provenanceAssurance.state,'indeterminate');assert.deepEqual(l3.traceability.sourceUnitIds,plan.covers);}
 const html=renderL0MapHTML(buildL0ViewModel(models.frameworkMap));assert.equal([...html.matchAll(/id="element-([^\"]+)"/g)].length,models.frameworkMap.elements.length);assert.deepEqual(new Set([...html.matchAll(/id="element-([^"]+)"/g)].map(m=>m[1])),new Set(models.frameworkMap.elements.map(e=>e.id)));assert.equal(JSON.stringify(models),before);
 console.log('PASS real bundle L2/L3 and L0 render preserve identities, Plan authority, absent/indeterminate and input');
 const sample=structuredClone(models),id=sample.plan.blocks[0].id,units=sample.plan.sourceUnits.slice(0,3).map(u=>u.id);sample.plan.blocks[0].covers=units;
 const raw=sample.generated.blocks.find(b=>b.id===id);raw.content={type:'prose',parts:[{text:'public bounded coverage case',sourceUnitIds:units.slice(0,2)}]};raw.shape='prose';
 const first=input=>projectReadingBundle(input).l2ViewModel.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
 assert.deepEqual(first(sample).realizedCoverage,{space:'RealizedCoverage',state:'available',total:3,covered:2,missing:[units[2]]});
 const missing=structuredClone(sample);missing.generated.blocks=missing.generated.blocks.filter(b=>b.id!==id);assert.equal(first(missing).generatedExpression.state,'missing');assert.deepEqual(first(missing).realizedCoverage,{space:'RealizedCoverage',state:'unavailable'});
 const unknown={...sample,generated:undefined};assert.equal(first(unknown).generatedExpression.state,'unknown');assert.equal(first(unknown).realizedCoverage.state,'unavailable');
 sample.plan.blocks[0].covers=[];assert.equal(first(sample).realizedCoverage.state,'not-applicable');
 console.log('PASS real coverage Planned3/Realized2/Missing1, Generated Missing/Unknown unavailable and empty covers N/A');
 const map={topics:[{id:'T1',title:'one',proposition:'one',blockIds:[]},{id:'T2',title:'two',proposition:'two'},{id:'T0',title:'zero',proposition:'zero',blockIds:[]}],elements:[{id:'A',label:'A',topics:['T1','T2']},{id:'B',label:'B',topics:['T1']},{id:'C',label:'C',topics:['T2']},{id:'D',label:'D',topics:[]}],edges:[{id:'internal',from:'A',to:'B',type:'contains'},{id:'out',from:'A',to:'C',type:'produces'},{id:'in',from:'C',to:'B',type:'consumes'},{id:'symmetric',from:'C',to:'A',type:'relates-to'},{id:'external',from:'C',to:'D',type:'depends-on'}]};
 const mapBefore=JSON.stringify(map),a=projectTopic(map,'T1'),b=projectTopic(map,'T2'),zero=projectTopic(map,'T0');assert.deepEqual(a.inside.map(e=>e.id),['A','B']);assert.deepEqual(b.inside.map(e=>e.id),['A','C']);assert.deepEqual(a.relationClasses,{internal:['internal'],inbound:['in'],outbound:['out'],crossing:['symmetric']});assert.ok(!a.relations.some(r=>r.id==='external'));assert.equal(a.blockOrganization.state,'empty');assert.equal(b.blockOrganization.state,'unknown');assert.deepEqual(zero.inside,[]);assert.deepEqual(zero.relations,[]);assert.equal(zero.representation,'boundary-summary');
 const reverse=structuredClone(map);[reverse.edges[3].from,reverse.edges[3].to]=[reverse.edges[3].to,reverse.edges[3].from];assert.equal(projectTopic(reverse,'T1').relations.find(r=>r.id==='symmetric').role,'crossing');assert.equal(JSON.stringify(map),mapBefore);
 console.log('PASS real L1 overlap/internal/crossing/external, symmetric reversal and known-empty do not invent ownership/membership');
 const source=await fs.readFile(path.resolve('samples/context-consumption/source.md'),'utf8'),registry=buildSourceRegistry(source),coordinate=resolveSourceCoordinate(registry,{namespace:'plan-section',key:'\u00a73'});assert.equal(coordinate.state,'known');assert.deepEqual(coordinate.range,{startLine:95,endLine:125});assert.equal(coordinate.exactLine,undefined);
 const block=models.plan.blocks.find(b=>b.covers.some(id=>models.plan.sourceUnits.find(u=>u.id===id).section==='\u00a73'));
 const l3=projectL3({blockId:block.id},models),unit=l3.traceability.units.find(u=>u.section==='\u00a73');assert.deepEqual(unit.coordinate.range,coordinate.range);assert.equal(unit.coordinate.exactLine,undefined);
 console.log('PASS actual source registry/resolver/L3 retain section range 95-125 only');
 console.log('F15 actual integration invariants passed: 4 groups; navigation and DOM run in Electron');
 }finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
