'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {makeMaturityMap}=require('./helpers/maturity-fixture');
const {buildL0ViewModel}=require('./l0-view-model'),{computeL0Layout}=require('../app/renderer/l0-layout'),{renderL0MapHTML}=require('../app/renderer/l0-map');
const {createExploreProjection}=require('../app/shared/explore-projection'),{validate}=require('../app/shared/schema-validator');
const rows=[];
for(const [name,map]of [['Gold',JSON.parse(fs.readFileSync(path.resolve(__dirname,'../samples/context-consumption/framework-map.json'),'utf8'))],['stress',makeMaturityMap()]]){
 const before=JSON.stringify(map);assert.equal(validate(require('../schema/framework-map.schema.json'),map).valid,true);
 const start=performance.now(),vm=buildL0ViewModel(map),projection=createExploreProjection(vm);const projected=performance.now();
 const layout=computeL0Layout(vm),html=renderL0MapHTML(vm,{layout});const rendered=performance.now();
 assert.ok(projected-start<=250,'projection budget 250ms');assert.ok(rendered-projected<=1500,'layout/render budget 1500ms');
 assert.equal(new Set([...html.matchAll(/id="element-([^"]+)"/g)].map(m=>m[1])).size,map.elements.length);
 assert.equal([...html.matchAll(/id="element-([^"]+)"/g)].length,map.elements.length);
 assert.equal(projection.catalog.filter(e=>e.ref.kind==='element').length,map.elements.length);
 assert.equal(JSON.stringify(map),before);assert.ok(/role="button"/.test(html),"Map button role");assert.ok(/aria-pressed="false"/.test(html),"Map selection state");
 rows.push({name,elements:map.elements.length,edges:map.edges.length,projectionMs:+(projected-start).toFixed(2),layoutRenderMs:+(rendered-projected).toFixed(2),htmlBytes:Buffer.byteLength(html)});
}
const symmetric=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../samples/goal-plan-task-state/framework-map.json'),'utf8'));
const html=renderL0MapHTML(buildL0ViewModel(symmetric));
assert.ok([...html.matchAll(/<path class="l0-edge[^>]+data-edge-type="relates-to"[^>]*>/g)].every(m=>!m[0].includes('marker-end')));
assert.ok(!html.includes('relates-to→')&&!html.includes('←relates-to'));
console.log('F21 pure budgets/identity/keyboard semantics/undirected relation:',JSON.stringify(rows));
