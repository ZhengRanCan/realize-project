'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {projectReadingBundle}=require('../app/shared/reading-projection');
const {contextHTML}=require('../app/renderer/l2-block-view');
const {renderTopicHTML}=require('../app/renderer/l1-topic-view');
const read=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const input={plan:read('samples/context-consumption/overview-plan.json'),generated:read('artifacts/experiments/stage2-full/overview.generated.json'),frameworkMap:read('samples/context-consumption/framework-map.json')};
const before=JSON.stringify(input),result=projectReadingBundle(input),blocks=result.l2ViewModel.sections.flatMap(s=>s.blocks);
assert.deepEqual(blocks.map(b=>b.id).sort(),input.plan.blocks.map(b=>b.id).sort());
for(const b of blocks){
 assert.deepEqual(b.plannedUnits.map(u=>u.id),b.covers);
 assert.deepEqual(b.topicOccurrences.values.map(t=>t.id),input.frameworkMap.topics.filter(t=>t.blockIds?.includes(b.id)).map(t=>t.id));
 assert.ok(Object.isFrozen(b.topicOccurrences)&&Object.isFrozen(b.plannedUnits));
 const html=contextHTML(b,{documentTitle:'Doc'});assert.ok(html.includes(b.title));assert.doesNotMatch(html,/Next Block|block-O-|stage-head/);
}
const partial=structuredClone(input);delete partial.frameworkMap.topics[0].blockIds;
assert.ok(projectReadingBundle(partial).l2ViewModel.sections.flatMap(s=>s.blocks).every(b=>b.topicOccurrences.state==='unknown'));
const empty=structuredClone(input);empty.frameworkMap.topics.forEach(t=>t.blockIds=[]);
assert.ok(projectReadingBundle(empty).l2ViewModel.sections.flatMap(s=>s.blocks).every(b=>b.topicOccurrences.state==='empty'));
const absent={...input,frameworkMap:undefined,generated:undefined};const noExpression=projectReadingBundle(absent).l2ViewModel.sections[0].blocks[0];
assert.equal(noExpression.generatedExpression.state,'unknown');assert.equal(noExpression.topicOccurrences.state,'unknown');assert.match(contextHTML(noExpression),/尚未提供生成资料/);
const missing=structuredClone(input);missing.generated.blocks=[];assert.equal(projectReadingBundle(missing).l2ViewModel.sections[0].blocks[0].generatedExpression.state,'missing');
const warning={...blocks[0],title:'<img src=x onerror=alert(1)>',generationIntegrity:{state:'present',verdict:'PASS_WITH_WARNINGS',warnings:['<script>x</script>']}};
assert.match(contextHTML(warning),/生成资料提示/);assert.doesNotMatch(contextHTML(warning),/<img|<script>/);
assert.doesNotMatch(contextHTML({...warning,generationIntegrity:{state:'present',verdict:'PASS'}}),/l2-generation-warning/);
for(const vm of Object.values(result.l1Topics)){
 const html=renderTopicHTML(vm,{canReadBlock:()=>true});assert.doesNotMatch(html,/进一步阅读/);
 assert.match(html,/id="l1-related"[^>]*hidden/);assert.match(html,/role="tablist"/);
 assert.deepEqual([...html.matchAll(/data-l1-block="([^"]+)"/g)].map(x=>x[1]),vm.blockOrganization.ids||[]);
}
assert.equal(JSON.stringify(input),before);
console.log('F24 pure: Plan identity/range, occurrence unknown/empty/known, missing expression, warning/escaping and complete L1 related entries passed');
