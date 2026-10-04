'use strict';
const assert=require('node:assert/strict');
const {mapFingerprint,checkReadingGuideBinding,projectReadingGuide}=require('../app/shared/reading-explanation');
const {buildSourceRegistry,sha256}=require('../app/shared/source-coordinates');
const map=require('../samples/context-consumption/framework-map.json');
const source='# Example\r\n\r\n## Meaning\r\nA frozen input is used.\r\n';
const registry=buildSourceRegistry(source),context={sourceSections:registry,sourceIntegrity:'consistent',sourceSha256:sha256(source)};
const entry={summary:'Frozen input',detail:'Used as input',sources:[{namespace:'heading',key:'Meaning',quote:'A frozen input is used.'}]};
function fixture(){const x=structuredClone(map);x.readingGuide={version:1,binding:{documentId:x.document.id,mapSha256:mapFingerprint(x),sourceSha256:sha256(source)},elements:[{elementId:'E-01',explanation:structuredClone(entry)}],edges:[],topics:[]};return x;}
function fails(m,ctx){assert.ok(checkReadingGuideBinding(m,ctx).errors.length);}
assert.equal(projectReadingGuide(map).state,'absent');
const good=fixture();assert.deepEqual(checkReadingGuideBinding(good,context).errors,[]);
assert.equal(mapFingerprint(good),mapFingerprint(map));
assert.equal(mapFingerprint(Object.fromEntries(Object.entries(map).reverse())),mapFingerprint(map));
const reordered=structuredClone(good);reordered.edges.reverse();fails(reordered);
for(const mutate of [m=>m.readingGuide.version=2,m=>m.readingGuide.binding.documentId='other',m=>m.readingGuide.binding.mapSha256='0'.repeat(64),m=>m.readingGuide.elements.push(m.readingGuide.elements[0]),m=>m.readingGuide.elements[0].elementId='missing',m=>m.readingGuide.edges.push({edgeIndex:999,explanation:entry}),m=>m.readingGuide.elements[0].explanation.sources=[],m=>m.readingGuide.elements[0].explanation.sources[0].namespace='plan-section',m=>m.readingGuide.elements[0].explanation.summary='   ',m=>m.readingGuide.extra=true]){const x=fixture();mutate(x);fails(x);}
fails(good,{sourceSha256:'0'.repeat(64)});
assert.equal(projectReadingGuide(good).elements['E-01'].sourceState,'declared');
assert.equal(projectReadingGuide(good,context).elements['E-01'].sourceState,'located');
for(const key of ['Meaning','SU-001']){const x=fixture();x.readingGuide.elements[0].explanation.sources.push({namespace:'heading',key,quote:'missing quote'});const vm=projectReadingGuide(x,context);assert.equal(vm.elements['E-01'].sourceState,'declared');assert.equal(vm.elements['E-01'].sources[0].state,'known');assert.notEqual(vm.elements['E-01'].sources[1].state,'known');}
const dupSource=source+'\n## Meaning\nSecond\n';const dupCtx={sourceSections:buildSourceRegistry(dupSource),sourceIntegrity:'consistent',sourceSha256:sha256(dupSource)};const dup=fixture();dup.readingGuide.binding.sourceSha256=sha256(dupSource);assert.equal(projectReadingGuide(dup,dupCtx).elements['E-01'].sources[0].state,'unknown');
assert.equal(projectReadingGuide(good,{...context,sourceIntegrity:'drifted'}).elements['E-01'].sources[0].state,'unavailable');
const before=JSON.stringify(good);const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};projectReadingGuide(freeze(good),freeze(context));assert.equal(JSON.stringify(good),before);
console.log('Reading guide: binding, namespace, excerpt, partial/duplicate/drifted sources and purity passed');
