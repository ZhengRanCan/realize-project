'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {buildL0ViewModel}=require('./l0-view-model');
const {mapFingerprint,checkReadingGuideBinding}=require('../app/shared/reading-explanation');
const {buildSourceRegistry,sha256}=require('../app/shared/source-coordinates');
const {validate}=require('../app/shared/schema-validator');
const schema=require('../schema/framework-map.schema.json');
const {renderL0MapHTML}=require('../app/renderer/l0-map');
const root=path.resolve(__dirname,'..');
for(const name of ['context-consumption','operational-runbook']){
 const dir=path.join(root,'samples',name),original=JSON.parse(fs.readFileSync(path.join(dir,'framework-map.json'),'utf8'));
 assert.equal(buildL0ViewModel(original).readingGuide.state,'absent');
 const enhanced=JSON.parse(fs.readFileSync(path.join(dir,'framework-map.reading.json'),'utf8')),source=fs.readFileSync(path.join(dir,'source.md'));
 assert.ok(validate(schema,enhanced).valid);
 assert.equal(mapFingerprint(enhanced),mapFingerprint(original));
 const {readingGuide,...core}=enhanced;assert.deepEqual(core,original);
 const guideContext={sourceSections:buildSourceRegistry(source.toString('utf8')),sourceIntegrity:'consistent',sourceSha256:sha256(source)};
 assert.deepEqual(checkReadingGuideBinding(enhanced,guideContext).errors,[]);
 const vm=buildL0ViewModel(enhanced,{guideContext}),standalone=buildL0ViewModel(enhanced);
 const html=renderL0MapHTML(vm);
 assert.ok(html.includes(vm.readingGuide.orientation.question.summary));
 assert.ok(html.includes('data-enter-topic="T-01"'));
 assert.ok(html.includes('data-edge-index="0"'));
 assert.ok(html.includes(vm.readingGuide.elements['E-01'].detail));
 const injection=structuredClone(enhanced);injection.readingGuide.elements[0].explanation.detail='<img src=x onerror=alert(1)>';
 assert.ok(!renderL0MapHTML(buildL0ViewModel(injection)).includes('<img src=x onerror='));
 assert.equal(vm.readingGuide.state,'present');assert.equal(vm.document.thesis,original.thesis||null);
 assert.deepEqual(vm.edges.map(e=>e.edgeIndex),original.edges.map((_,i)=>i));
 assert.equal(Object.keys(vm.readingGuide.elements).length,original.elements.length);
 assert.equal(Object.keys(vm.readingGuide.edges).length,original.edges.length);
 assert.equal(Object.keys(vm.readingGuide.topics).length,original.topics.length);
 for(const entry of [...Object.values(vm.readingGuide.orientation),...Object.values(vm.readingGuide.elements),...Object.values(vm.readingGuide.edges),...Object.values(vm.readingGuide.topics)].filter(Boolean))assert.equal(entry.sourceState,'located',entry.summary+JSON.stringify(entry.sources));
 for(const entry of Object.values(standalone.readingGuide.elements))assert.equal(entry.sourceState,'declared');
 const bad=structuredClone(enhanced);bad.readingGuide.binding.documentId='other';assert.throws(()=>buildL0ViewModel(bad),/documentId/);
 const before=JSON.stringify(enhanced);buildL0ViewModel(enhanced,{guideContext});assert.equal(JSON.stringify(enhanced),before);
}
console.log('L0 orientation: two public documents, complete original identities, source grounding, standalone/legacy and purity passed');

{const {renderL0MapHTML}=require('../app/renderer/l0-map');const {buildL0ViewModel}=require('./l0-view-model');const map=require('../samples/operational-runbook/framework-map.reading.json');assert.match(renderL0MapHTML(buildL0ViewModel(map),{topicNavigation:false}),/data-enter-topic="T-01" disabled/);}
