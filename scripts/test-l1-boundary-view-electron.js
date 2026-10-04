'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {validate}=require('../app/shared/schema-validator');
const {checkMap}=require('./check-map');
const schema=require('../schema/framework-map.schema.json');
const exec=(win,code)=>win.webContents.executeJavaScript(code);
const settle=win=>exec(win,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function key(win,keyCode){const code=keyCode==='Enter'?'Return':keyCode==='Space'?' ':keyCode;
 win.webContents.sendInputEvent({type:'keyDown',keyCode:code});
 if(keyCode==='Enter'||keyCode==='Space')win.webContents.sendInputEvent({type:'char',keyCode:keyCode==='Enter'?'\r':' '});
 win.webContents.sendInputEvent({type:'keyUp',keyCode:code});await settle(win);
}
async function check(win,code,label){const result=await exec(win,code);if(result!==true)throw new Error('F23 '+label+' '+JSON.stringify(await exec(win,"({view:window.__state.view,active:document.activeElement.outerHTML.slice(0,260),source:document.getElementById('source-body').dataset.coordinateState,sourceText:document.getElementById('source-body').textContent.slice(0,200)})")));}
async function topic(win,id){await exec(win,`document.querySelector('.topic-entry[data-topic-focus="${id}"] [data-enter-topic]').click()`);await settle(win);}
async function verifyGraph(win){
 const result=await exec(win,`(()=>{
  const vm=window.__state.l1Topic,root=document.querySelector('[data-l1-topic]'),nodes=[...root.querySelectorAll('[data-l1-node]')],paths=[...root.querySelectorAll('path[data-l1-relation]')],labels=[...root.querySelectorAll('[data-l1-relation-button]')];
  const check=(v,m)=>{if(!v)throw new Error('F23 geometry '+m);};
  check(root.dataset.representation===vm.representation,'representation');
  check(nodes.length===vm.inside.length+vm.outside.length,'complete nodes');
  check(new Set(nodes.map(n=>n.dataset.l1Node)).size===nodes.length,'unique occurrence');
  check(JSON.stringify(nodes.filter(n=>n.dataset.l1Scope==='inside').map(n=>n.dataset.l1Node).sort())===JSON.stringify(vm.inside.map(n=>n.id).sort()),'Inside identity');
  check(JSON.stringify(nodes.filter(n=>n.dataset.l1Scope==='outside').map(n=>n.dataset.l1Node).sort())===JSON.stringify(vm.outside.map(n=>n.id).sort()),'Outside identity');
  check(paths.length===vm.relations.length&&labels.length===paths.length,'complete edges/labels');
  for(const n of [...nodes,...labels]){const r=n.getBoundingClientRect();check(n.checkVisibility()&&r.width>0&&r.height>0,'visible geometry');check(n.tagName==='BUTTON'&&n.getAttribute('aria-label'),'keyboard/full-name');}
  for(const p of paths){const r=vm.relations[Number(p.dataset.l1Relation)];check(p.dataset.from===r.from&&p.dataset.to===r.to&&p.dataset.l1Role===r.role,'endpoints/class');const length=p.getTotalLength();check(length>0&&getComputedStyle(p).stroke!=='none','drawn line');check(p.hasAttribute('marker-end')===(r.type!=='relates-to'),'direction');
   const cards=nodes.map(n=>({id:n.dataset.l1Node,x:n.offsetLeft,y:n.offsetTop,w:n.offsetWidth,h:n.offsetHeight}));
   for(let d=0;d<=length;d+=4){const point=p.getPointAtLength(d);check(cards.every(n=>!(point.x>n.x+.1&&point.x<n.x+n.w-.1&&point.y>n.y+.1&&point.y<n.y+n.h-.1)),'actual SVG route avoids card interiors');}
   const end=p.getPointAtLength(length),prev=p.getPointAtLength(Math.max(0,length-2)),target=cards.find(n=>n.id===r.to);
   check((end.x-prev.x)*(target.x+target.w/2-end.x)+(end.y-prev.y)*(target.y+target.h/2-end.y)>0,'actual arrow tangent enters target');
  }
  check(document.documentElement.scrollWidth<=innerWidth,'no page overflow');
  return {topic:vm.topic.id,nodes:nodes.length,edges:paths.length};
 })()`);
 return result;
}
async function exerciseBoundaryView(win){
 win.focus();win.webContents.focus();
 await topic(win,'T-02');await verifyGraph(win);
 await check(win,"!document.querySelector('.l1-outside-zone')&&document.querySelectorAll('[data-l1-block]').length===3",'internal-only, real Block entries');
 const before=await exec(win,'window.__readingNavigation.size');
 await exec(win,"document.querySelector('[data-l1-node]').focus()");await key(win,'Enter');
 await check(win,"L1TopicView.getSelection(document.getElementById('main')).kind==='element'&&getComputedStyle(document.activeElement).outlineStyle!=='none'",'native Enter node / visible focus');
 await key(win,'Tab');await check(win,"document.activeElement!==document.body",'native Tab');
 await exec(win,"document.querySelector('[data-l1-relation-button]').focus()");await key(win,'Space');
 await check(win,`L1TopicView.getSelection(document.getElementById('main')).kind==='relation'&&window.__readingNavigation.size===${before}`,'native Space selects, no navigation');
 const frame=await exec(win,`(()=>{const graph=document.querySelector('.l1-graph-wrap');graph.scrollTop=130;graph.scrollLeft=75;document.querySelector('.l1-all-details').open=true;const button=document.querySelector('[data-l1-block]');button.focus();return {top:graph.scrollTop,left:graph.scrollLeft,selection:L1TopicView.getSelection(document.getElementById('main')),id:button.dataset.l1Block};})()`);
 await exec(win,"document.querySelector('[data-l1-block]').click();document.getElementById('reading-back').click()");await settle(win);
 await check(win,`(()=>{const graph=document.querySelector('.l1-graph-wrap');return graph.scrollTop===${frame.top}&&graph.scrollLeft===${frame.left}&&JSON.stringify(L1TopicView.getSelection(document.getElementById('main')))===${JSON.stringify(JSON.stringify(frame.selection))}&&document.activeElement.dataset.l1Block===${JSON.stringify(frame.id)}&&document.querySelector('.l1-all-details').open;})()`,'Block Back selection/details/focus/scroll');
 const calls=await exec(win,'window.__readingNavigation.snapshot().resolverCalls');
 await exec(win,"document.getElementById('btn-explore').focus();document.getElementById('btn-explore').click();document.getElementById('explore-back-reading').click()");await settle(win);
 await check(win,`window.__state.view==='l1'&&window.__readingNavigation.snapshot().resolverCalls===${calls}&&JSON.stringify(L1TopicView.getSelection(document.getElementById('main')))===${JSON.stringify(JSON.stringify(frame.selection))}`,'Explore Back without resolver');
 await exec(win,"document.getElementById('l1-back').click()");await topic(win,'T-03');await verifyGraph(win);
 await exec(win,"document.querySelector('[data-l1-scope=outside]').focus()");await key(win,'Enter');
 const external=await exec(win,"L1TopicView.getSelection(document.getElementById('main')).id");
 await check(win,"document.getElementById('l1-selection-detail').textContent.includes('主题外部对象')",'external identity disclosed');
 await exec(win,"document.querySelector('#l1-selection-detail [data-l1-element-open]').focus();document.querySelector('#l1-selection-detail [data-l1-element-open]').click()");
 await check(win,`document.getElementById('element-'+${JSON.stringify(external)}).checkVisibility()&&document.querySelectorAll('[id="element-${external}"]').length===1`,'explicit canonical Element');
 await exec(win,"document.getElementById('reading-back').click()");await settle(win);
 await check(win,`window.__state.l1Topic.topic.id==='T-03'&&L1TopicView.getSelection(document.getElementById('main')).id===${JSON.stringify(external)}&&document.activeElement.dataset.l1ElementOpen===${JSON.stringify(external)}`,'Element Back external selection/focus');
 await exec(win,"document.getElementById('l1-back').click()");
 return 'F23 real internal/crossing diagram, native keys, full identity/edges and Block/Element/Explore Back passed';
}
async function runBoundaryIntegration(win){
 const parent=path.resolve('workspace/tmp/tests'),prefix=path.join(parent,'f23-boundary-view-');await fs.mkdir(parent,{recursive:true});
 const root=await fs.mkdtemp(prefix),oldSize=win.getContentSize(),oldZoom=win.webContents.getZoomFactor();
 const record=process.argv.includes('--record-boundary-evidence'),out=path.resolve('docs/log/artifacts/F23-l1-topic-boundary-view');
 const shots=[];
 const shot=async name=>{await exec(win,"document.querySelector('.l1-workspace').scrollIntoView({block:'start'});document.querySelector('.toast')?.remove()");await settle(win);const capture=await win.webContents.capturePage(),viewport=await exec(win,'({width:innerWidth,height:innerHeight})');assert.deepEqual(capture.getSize(),viewport);if(record){await fs.writeFile(path.join(out,name),capture.toPNG());shots.push({file:name,...viewport});}};
 try{
  win.webContents.setZoomFactor(1);win.setContentSize(1280,900);
  const fixture=await makeBundleFixture(root);await exec(win,`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);
  const report=await exerciseBoundaryView(win);
  await topic(win,'T-02');await shot('internal-diagram.png');await exec(win,"document.getElementById('l1-back').click()");
  await topic(win,'T-03');await exec(win,"document.querySelector('[data-l1-scope=outside]').click()");await shot('crossing-diagram.png');
  win.setContentSize(640,720);await settle(win);await check(win,'innerWidth===640&&innerHeight===720','actual narrow dimensions');await verifyGraph(win);
  await exec(win,"document.getElementById('l1-back').click()");await topic(win,'T-02');await verifyGraph(win);
  await check(win,"document.querySelector('.l1-graph-wrap').scrollWidth>document.querySelector('.l1-graph-wrap').clientWidth",'narrow independent graph scrolling');
  await exec(win,"document.querySelector('[data-l1-relation-button]').scrollIntoView({block:'nearest',inline:'nearest'});document.querySelector('[data-l1-relation-button]').focus()");await key(win,'Enter');await shot('internal-narrow.png');
  await exec(win,"document.getElementById('l1-back').click()");
  // Independent public Map: organization stays known, but Plan availability is absent.
  await exec(win,`loadL0(${JSON.stringify(fixture.inputs.map)})`);await topic(win,'T-02');await verifyGraph(win);
  await check(win,"!document.querySelector('[data-l1-block]')&&document.querySelector('.l1-blocks').textContent.includes('O-04')&&document.querySelector('.l1-blocks').textContent.includes('当前未加载区块资料')",'no Plan, no false button');
  const sourceText=await fs.readFile(fixture.inputs.source,'utf8');
  const publicMap=JSON.parse(await fs.readFile(fixture.inputs.map,'utf8'));
  async function loadCase(name,mutate,id='T-03'){
   const map=structuredClone(publicMap);mutate(map);
   const shape=validate(schema,map);assert.equal(shape.valid,true,shape.errors.join('; '));
   const verdict=checkMap(map,{docSections:require('../app/shared/source-coordinates').parseDocHeadings(sourceText)});assert.equal(verdict.hard.length,0,verdict.hard.join('; '));
   const file=path.join(root,name+'.json');await fs.writeFile(file,JSON.stringify(map));
   assert.equal((await exec(win,`loadL0(${JSON.stringify(file)})`)).ok,true);await topic(win,id);return map;
  }
  await loadCase('summary',map=>{map.edges=[];map.topics.find(t=>t.id==='T-03').blockIds=[];});
  await check(win,"document.querySelector('[data-representation]').dataset.representation==='boundary-summary'&&!document.querySelector('.l1-graph-wrap')&&document.querySelectorAll('[data-l1-node]').length===2&&document.querySelector('[data-block-organization]').dataset.blockOrganization==='empty'",'no relations summary / Known(0)');
  await shot('boundary-summary.png');
  await loadCase('empty-members',map=>{map.elements.forEach(e=>{if(e.topics.includes('T-03'))e.topics=e.topics.filter(t=>t!=='T-03');});});
  await check(win,"!document.querySelector('[data-l1-node]')&&document.querySelector('[data-l1-topic]').textContent.includes('已明确没有主题成员')",'empty Inside');
  await loadCase('unknown',map=>{const t=map.topics.find(t=>t.id==='T-03');delete t.blockIds;t.sectionRefs=['§4'];});
  await verifyGraph(win);await check(win,"document.querySelector('[data-block-organization]').dataset.blockOrganization==='unknown'&&document.querySelector('.l1-blocks').textContent.includes('尚未声明')",'Unknown organization / crossing-only');
  await loadCase('parallel',map=>{map.edges.push({from:'E-03',to:'E-03',type:'relates-to'},{from:'E-03',to:'E-02',type:'controls',label:'<边界测试 & 完整披露>',qualifiers:{ownership:'shared'}},{from:'E-02',to:'E-03',type:'relates-to'});map.elements.find(e=>e.id==='E-03').label='<名称测试> '+ '完整长名称'.repeat(20);});
  await verifyGraph(win);
  await check(win,"(()=>{const p=[...document.querySelectorAll('path[data-l1-relation]')];return new Set(p.map(n=>n.getAttribute('d'))).size===p.length&&p.filter(n=>window.__state.l1Topic.relations[+n.dataset.l1Relation].type==='relates-to').every(n=>!n.hasAttribute('marker-end'));})()",'parallel/self/symmetric paths');
  await exec(win,"document.querySelector('[data-l1-node=\"E-03\"]').click();document.getElementById('l1-selection-detail').querySelector('h3').textContent");
  await check(win,"document.getElementById('l1-selection-detail').textContent.includes('<名称测试>')&&!document.querySelector('[data-l1-topic] script')",'complete long label, safe HTML');
  await exec(win,"document.querySelector('[data-l1-relation-button=\"3\"]').click()");
  await check(win,"document.getElementById('l1-selection-detail').textContent.includes('<边界测试 & 完整披露>')&&document.getElementById('l1-selection-detail').textContent.includes('shared')",'original label/qualifiers');
  await exec(win,`loadL0(${JSON.stringify(path.resolve('samples/goal-plan-task-state/framework-map.json'))})`);
  const symmetricTopic=await exec(win,"Object.values(window.__state.l1Topics).find(t=>t.relations.some(r=>r.type==='relates-to')).topic.id");await topic(win,symmetricTopic);await verifyGraph(win);
  await exec(win,`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);await topic(win,'T-03');
  await check(win,"L1TopicView.getSelection(document.getElementById('main'))===null",'new session no stale selection');
  await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  // A validated temporary bundle supplies an explicit heading ref. No SU-to-heading inference.
  const manifest=JSON.parse(await fs.readFile(fixture.manifestPath,'utf8'));
  const mapFile=path.join(path.dirname(fixture.manifestPath),manifest.files.frameworkMap.path);
  const heading=fixture.models.sourceSections.headings[0],headingRef='§'+heading.key;
  const sourceMap=structuredClone(publicMap);sourceMap.topics.find(t=>t.id==='T-03').sectionRefs=[headingRef,'§4'];
  const text=JSON.stringify(sourceMap);await fs.writeFile(mapFile,text);
  manifest.files.frameworkMap.sha256=require('../app/shared/source-coordinates').sha256(text);
  await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));
  assert.equal((await exec(win,`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`)).ok,true);
  await topic(win,'T-03');
  await check(win,"document.querySelector('.l1-heading [data-l1-source]')!==null&&document.querySelector('.l1-heading details').textContent.includes('来源标签无法解析')",'only uniquely bound heading enabled');
  await exec(win,"document.querySelector('.l1-heading details').open=true;document.querySelector('.l1-heading [data-l1-source]').focus()");await key(win,'Enter');
  await exec(win,"new Promise((resolve,reject)=>{const start=Date.now(),wait=()=>{if(!document.getElementById('source-panel').classList.contains('hidden'))return resolve();if(Date.now()-start>3000)return reject(new Error('F23 heading source timeout'));setTimeout(wait,20);};wait();})");
  await check(win,"document.getElementById('source-body').dataset.coordinateState==='known'&&document.activeElement.id==='source-close'",'explicit heading Source resolves');
  await key(win,'Escape');await check(win,`document.getElementById('source-panel').classList.contains('hidden')&&document.activeElement.dataset.l1Source===${JSON.stringify(headingRef)}`,'Source closes to L1 origin focus');
  async function writeBundleFile(name,text){await fs.writeFile(path.join(path.dirname(fixture.manifestPath),manifest.files[name].path),text);manifest.files[name].sha256=require('../app/shared/source-coordinates').sha256(text);await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));}
  const drifted=structuredClone(fixture.models.sourceSections);drifted.document.title+=' drift';
  await writeBundleFile('sourceSections',JSON.stringify(drifted));
  const driftLoad=await exec(win,`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);assert.equal(driftLoad.ok,true,JSON.stringify(driftLoad.errors));await topic(win,'T-03');
  await check(win,"!document.querySelector('.l1-heading [data-l1-source]')&&document.querySelector('.l1-heading details').textContent.includes('漂移')",'accepted drifted bundle has unavailable Source');
  const duplicateText=sourceText+'\n### '+heading.title+'\n重复标题测试\n';
  await writeBundleFile('source',duplicateText);
  await writeBundleFile('sourceSections',JSON.stringify(require('../app/shared/source-coordinates').buildSourceRegistry(duplicateText,{sourcePath:fixture.models.sourceSections.document.path})));
  const duplicateLoad=await exec(win,`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);assert.equal(duplicateLoad.ok,true,JSON.stringify(duplicateLoad.errors));await topic(win,'T-03');
  await check(win,`!document.querySelector('.l1-heading [data-l1-source]')&&document.querySelector('.l1-heading details').textContent.includes('来源标签重复')&&window.__state.l1Topic.sourceReferences.find(r=>r.ref===${JSON.stringify(headingRef)}).state==='unknown'`,'accepted consistent duplicate heading stays unavailable');
  await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  if(record)await fs.writeFile(path.join(out,'interface-evidence.json'),JSON.stringify({date:new Date().toISOString(),input:'public context-consumption Gold; schema/check-map-valid test copies',shots,report},null,2)+'\n');
  return report+'; 640×720, valid public-derived corner cases, no Plan, symmetric public sample, new session and no auto-save passed';
 }finally{
  win.webContents.setZoomFactor(oldZoom);win.setContentSize(...oldSize);
  assert.ok(path.resolve(root).startsWith(prefix));await fs.rm(root,{recursive:true,force:true});
 }
}
module.exports={runBoundaryIntegration,exerciseBoundaryView};
