'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs');
const {projectTopic} = require('../app/shared/l1-topic-projection');
const {computeTopicLayout, renderTopicHTML} = require('../app/renderer/l1-topic-view');
const gold = JSON.parse(fs.readFileSync('samples/context-consumption/framework-map.json','utf8'));
function geometry(vm) {
  const before=JSON.stringify(vm), layout=computeTopicLayout(vm);
  assert.deepEqual(layout.nodes.map(n=>n.id).sort(),[...vm.inside,...vm.outside].map(n=>n.id).sort());
  assert.deepEqual(layout.edges.map(e=>[e.from,e.to,e.type,e.role]),vm.relations.map(e=>[e.from,e.to,e.type,e.role]));
  assert.deepEqual(layout.edges.map(e=>e.relationIndex),vm.relations.map((_,i)=>i));
  for(const n of layout.nodes) {
    for(const key of ['x','y','w','h']) assert.ok(Number.isFinite(n[key]));
    assert.ok(n.x>=0&&n.y>=0&&n.x+n.w<=layout.bounds.width&&n.y+n.h<=layout.bounds.height);
  }
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(let i=0;i<layout.nodes.length;i++)for(let j=i+1;j<layout.nodes.length;j++)assert.ok(!overlaps(layout.nodes[i],layout.nodes[j]));
  for(const e of layout.edges) {
    assert.ok(e.d.startsWith('M ')&&!/NaN|undefined|Infinity/.test(e.d));
    assert.ok(e.labelX-e.labelW/2>=0&&e.labelY-e.labelH/2>=0);
    assert.ok(e.labelX+e.labelW/2<=layout.bounds.width&&e.labelY+e.labelH/2<=layout.bounds.height);
    for(const n of layout.nodes)assert.ok(!overlaps({x:e.labelX-e.labelW/2,y:e.labelY-e.labelH/2,w:e.labelW,h:e.labelH},n),'label overlaps node');
  }
  for(let i=0;i<layout.edges.length;i++)for(let j=i+1;j<layout.edges.length;j++) {
    const a=layout.edges[i],b=layout.edges[j];
    assert.ok(!overlaps({x:a.labelX-a.labelW/2,y:a.labelY-a.labelH/2,w:a.labelW,h:a.labelH},{x:b.labelX-b.labelW/2,y:b.labelY-b.labelH/2,w:b.labelW,h:b.labelH}),'labels overlap');
  }
  assert.equal(JSON.stringify(vm),before); assert.deepEqual(computeTopicLayout(vm),layout);
  return layout;
}
const internal=projectTopic(gold,'T-02'), l=geometry(internal);
assert.equal(l.nodes.length,5);assert.equal(l.edges.length,4);assert.equal(l.outsideBounds,null);
const crossing=geometry(projectTopic(gold,'T-03'));
assert.equal(crossing.nodes.filter(n=>n.scope==='inside').length,2);assert.equal(crossing.nodes.filter(n=>n.scope==='outside').length,2);
assert.ok(crossing.outsideBounds);assert.equal(crossing.edges.length,2);
const map={document:{id:'D',title:'<Document>'},topics:[{id:'T',title:'Topic',proposition:'p',blockIds:['O-1']}],elements:[{id:'A',label:'<script>long & original</script>',topics:['T']},{id:'B',label:'Outside',topics:['U']}],edges:[
 {from:'A',to:'A',type:'contains'}, {from:'A',to:'B',type:'produces',label:'<original>',qualifiers:{note:'<unsafe>'}},
 {from:'B',to:'A',type:'controls'}, {from:'A',to:'B',type:'relates-to'}, {from:'A',to:'A',type:'relates-to'}
]};
const rich=projectTopic(map,'T'), parallel=geometry(rich);
assert.equal(new Set(parallel.edges.map(e=>e.d)).size,5);
assert.equal(parallel.nodes.filter(n=>n.id==='B').length,1);
const html=renderTopicHTML(rich);
assert.ok(html.includes('&lt;script&gt;')&&!html.includes('<script>'));
assert.ok(html.includes('&lt;unsafe&gt;'));
assert.ok(html.includes('当前未加载区块资料')&&!html.includes('data-l1-block="O-1"'));
const paths=[...html.matchAll(/<path\b[^>]*data-l1-relation="(\d+)"[^>]*>/g)];
assert.equal(paths.length,5);
for(const [index,path]of paths.map(m=>[+m[1],m[0]]))assert.equal(path.includes('marker-end'),rich.relations[index].type!=='relates-to');
const only=projectTopic({...map,edges:map.edges.filter(e=>e.from!==e.to)},'T');geometry(only);
assert.ok(renderTopicHTML(only).includes('l1-graph-wrap'));
const empty=projectTopic({...map,edges:[]},'T');
assert.ok(renderTopicHTML(empty).includes('未声明可绘制关系'));assert.ok(!renderTopicHTML(empty).includes('<svg'));
const noMember=projectTopic({...map,elements:map.elements.map(e=>({...e,topics:['U']}))},'T');
assert.ok(renderTopicHTML(noMember).includes('已明确没有主题成员'));assert.equal(computeTopicLayout(noMember).nodes.length,0);
for(const [topic,state,text]of [[{id:'T',title:'T'},'unknown','尚未声明区块关联'],[{id:'T',title:'T',blockIds:[]},'empty','已明确没有关联区块']]){
 const vm=projectTopic({...map,topics:[topic]},'T');assert.equal(vm.blockOrganization.state,state);assert.ok(renderTopicHTML(vm).includes(text));
}
console.log('L1 boundary view: full identity/edge sets, geometry, deterministic purity, parallel/self/symmetric, escaping and degradation passed');
