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
    assert.ok(Array.isArray(e.points),'inspectable full route required');
    for(const p of e.points)assert.ok(p.x>=0&&p.y>=0&&p.x<=layout.bounds.width&&p.y<=layout.bounds.height,'route within canvas');
    for(let i=2;i<e.points.length;i++) {
      const [a,b,c]=e.points.slice(i-2,i+1);
      assert.ok((b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y)>=0,'no immediate 180-degree reversal at label');
    }
    for(let i=1;i<e.points.length;i++)for(let j=i+2;j<e.points.length;j++) {
      const a=e.points[i-1],b=e.points[i],c=e.points[j-1],d=e.points[j];
      const sameHorizontal=a.y===b.y&&c.y===d.y&&a.y===c.y;
      const sameVertical=a.x===b.x&&c.x===d.x&&a.x===c.x;
      const overlap=sameHorizontal?Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))
        :sameVertical?Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y)):false;
      assert.ok(!overlap,'no non-adjacent segments retrace one another');
      if((a.y===b.y)!==(c.y===d.y)) {
        const point=a.y===b.y?{x:c.x,y:a.y}:{x:a.x,y:c.y};
        const within=(p,a,b)=>p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);
        assert.ok(!(within(point,a,b)&&within(point,c,d)),'no self-intersection within one relation');
      }
    }
    // Every segment stays outside every card, including source/target interiors.
    for(let i=1;i<e.points.length;i++) {
      const a=e.points[i-1],b=e.points[i];
      assert.ok(a.x===b.x||a.y===b.y,'orthogonal route');
      for(const n of layout.nodes) {
        const crosses=a.x===b.x?a.x>n.x&&a.x<n.x+n.w&&Math.max(a.y,b.y)>n.y&&Math.min(a.y,b.y)<n.y+n.h
          :a.y>n.y&&a.y<n.y+n.h&&Math.max(a.x,b.x)>n.x&&Math.min(a.x,b.x)<n.x+n.w;
        assert.ok(!crosses,'route crosses card '+n.id);
      }
    }
    const target=layout.nodes.find(n=>n.id===e.to),end=e.points.at(-1),prev=e.points.at(-2);
    const towardCenter=(end.x-prev.x)*(target.x+target.w/2-end.x)+(end.y-prev.y)*(target.y+target.h/2-end.y);
    assert.ok(towardCenter>0,'arrow arrives into target, not outwards');
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
assert.ok(Math.min(...crossing.nodes.map(n=>n.y))<=152,'crossing-only has no empty L0 graph band');
const map={document:{id:'D',title:'<Document>'},topics:[{id:'T',title:'Topic',proposition:'p',blockIds:['O-1']}],elements:[{id:'A',label:'<script>long & original</script>',topics:['T']},{id:'B',label:'Outside',topics:['U']}],edges:[
 {from:'A',to:'A',type:'contains'}, {from:'A',to:'B',type:'produces',label:'<original>',qualifiers:{note:'<unsafe>'}},
 {from:'B',to:'A',type:'controls'}, {from:'A',to:'B',type:'relates-to'}, {from:'A',to:'A',type:'relates-to'}
]};
const rich=projectTopic(map,'T'), parallel=geometry(rich);
const internalParallel=projectTopic({...map,elements:map.elements.map(e=>({...e,topics:['T']})),edges:[{from:'A',to:'B',type:'produces'},{from:'A',to:'B',type:'consumes'}]},'T');
assert.equal(geometry(internalParallel).edges.length,2);
for(let count=1;count<=6;count++)geometry(projectTopic({...map,elements:map.elements.map(e=>({...e,topics:['T']})),edges:Array.from({length:count},(_,i)=>({from:'A',to:'B',type:i%2?'consumes':'produces'}))},'T'));
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
for(const name of ['context-consumption','operational-runbook','goal-plan-task-state','canonical-hash-integrity','candidate-inbox-profile']) {
 const sample=JSON.parse(fs.readFileSync(`samples/${name}/framework-map.json`,'utf8'));
 for(const topic of sample.topics){const vm=projectTopic(sample,topic.id);if(vm.relations.length)geometry(vm);}
}
console.log('L1 boundary view: full identity/edge sets, geometry, deterministic purity, parallel/self/symmetric, escaping and degradation passed');

// Explanations are available before further reading, without invented concept edges.
{
 const enhanced=require('../samples/context-consumption/framework-map.reading.json');
 const vm=projectTopic(enhanced,'T-01'),html=renderTopicHTML(vm);
 for(const e of vm.inside)assert.ok(html.includes(e.explanation.detail),e.id+' direct definition');
 assert.ok(html.indexOf(vm.inside[0].explanation.detail)<html.indexOf('class="l1-blocks"'));
 assert.equal((html.match(/data-l1-node=/g)||[]).length,4);assert.ok(!html.includes('<svg'));
 assert.ok(html.includes('不能互相替代')||html.includes('不能相互替代'));
 const graph=projectTopic(enhanced,'T-03');geometry(graph);
 assert.ok(renderTopicHTML(graph).includes(graph.relations[0].explanation.summary));
 const injection=structuredClone(enhanced);injection.readingGuide.elements[0].explanation.detail='<img src=x onerror=alert(1)>';
 assert.ok(!renderTopicHTML(projectTopic(injection,'T-02')).includes('<img src=x onerror='));
}

for(const name of ['context-consumption','operational-runbook']){
 const enhanced=require(`../samples/${name}/framework-map.reading.json`);
 for(const t of enhanced.topics){const vm=projectTopic(enhanced,t.id);if(vm.relations.length)geometry(vm);}
}
