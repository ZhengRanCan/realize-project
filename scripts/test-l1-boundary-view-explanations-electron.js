'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {exportReadingBundle}=require('./export-reading-bundle');
const {readReadingBundle}=require('../app/main/reading-bundle');
const {sha256}=require('../app/shared/source-coordinates');
const {mapFingerprint}=require('../app/shared/reading-explanation');
const {verifyGraph}=require('./test-l1-boundary-view-electron');
const exec=(win,code)=>win.webContents.executeJavaScript(code);
const settle=win=>exec(win,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function check(win,code,label){assert.equal(await exec(win,code),true,'F23 explanations '+label);}
async function key(win,keyCode){const key=keyCode==='Space'?' ':keyCode==='Enter'?'Return':keyCode;win.webContents.sendInputEvent({type:'keyDown',keyCode:key});if(keyCode==='Space'||keyCode==='Enter')win.webContents.sendInputEvent({type:'char',keyCode:keyCode==='Enter'?'\r':' '});win.webContents.sendInputEvent({type:'keyUp',keyCode:key});await settle(win);}
async function topic(win,id){await exec(win,`document.querySelector('[data-panel-tab-button=topics]').click();document.querySelector('[data-enter-topic="${id}"]').click()`);await settle(win);}
async function sourceWait(win){await exec(win,"new Promise((r,j)=>{const until=Date.now()+4000;function p(){if(!document.getElementById('source-panel').classList.contains('hidden'))return r();if(Date.now()>until)return j(Error('L1 source timeout'));requestAnimationFrame(p);}p();})");}
async function exerciseExplanations(win){
 win.focus();win.webContents.focus();
 await exec(win,"document.getElementById('main').scrollTop=220");await topic(win,'T-01');
 await check(win,"document.getElementById('main').scrollTop===0",'new Topic starts at its question');
 await check(win,"(()=>{const s=window.__state.l1Topic,root=document.querySelector('[data-l1-topic]');return s.representation==='boundary-summary'&&!root.querySelector('svg')&&root.querySelectorAll('.l1-summary-card').length===s.inside.length&&s.inside.every(e=>[...root.querySelectorAll('.l1-summary-card')].find(c=>c.querySelector('[data-l1-node]').dataset.l1Node===e.id).querySelector('.l1-explanation-text').textContent===e.explanation.detail)&&[...root.querySelectorAll('.l1-summary-card .l1-explanation-text')].every(p=>p.checkVisibility())&&root.querySelector('.l1-summary-kind').textContent==='约束与边界'&&root.querySelector('.l1-heading').textContent.includes(s.topic.explanation.summary);})()",'definitions/contrast/boundary directly readable without invented edges');
 await exec(win,"document.querySelector('.l1-summary-card .l1-explanation-sources').open=true;document.querySelector('.l1-summary-card [data-l1-guide-source]').focus()");await key(win,'Enter');await sourceWait(win);
 await check(win,"document.getElementById('source-body').dataset.coordinateState==='known'&&document.getElementById('source-body').textContent.includes(document.querySelector('.l1-summary-card blockquote').textContent)",'summary exact heading quote');
 await exec(win,"document.getElementById('source-close').click()");await settle(win);await check(win,"document.activeElement.hasAttribute('data-l1-guide-source')",'Source returns to definition');
 await exec(win,"document.getElementById('l1-back').click()");await topic(win,'T-02');await verifyGraph(win);
 await check(win,"(()=>{const s=window.__state.l1Topic;return [...document.querySelectorAll('[data-l1-node]')].every(n=>n.querySelector('.l1-node-meaning').textContent===s.inside.find(e=>e.id===n.dataset.l1Node).explanation.summary)&&[...document.querySelectorAll('[data-l1-relation-button]')].every(n=>n.querySelector('span').textContent===s.relations[+n.dataset.l1RelationButton].explanation.summary);})()",'real graph has correct node and edge meanings');
 await exec(win,"document.querySelector('.l1-workspace').scrollIntoView({block:'start'});document.querySelector('[data-l1-relation-button]').focus()");await settle(win);
 const before=await exec(win,"({main:document.getElementById('main').scrollTop,top:document.querySelector('.l1-graph-wrap').scrollTop,left:document.querySelector('.l1-graph-wrap').scrollLeft})");await key(win,'Space');
 await check(win,`(()=>{const r=document.getElementById('l1-selection-detail').getBoundingClientRect();return L1TopicView.getSelection(document.getElementById('main')).kind==='relation'&&document.querySelector('.l1-detail-body .l1-explanation-text').textContent===window.__state.l1Topic.relations[0].explanation.detail&&r.top>=0&&r.bottom<=innerHeight&&document.getElementById('main').scrollTop===${before.main}&&document.querySelector('.l1-graph-wrap').scrollTop===${before.top}&&document.querySelector('.l1-graph-wrap').scrollLeft===${before.left};})()`,'native relation meaning stays beside graph');
 if(await exec(win,'innerWidth>1100')){
  await exec(win,"document.querySelector('.l1-detail-body .l1-explanation-sources').open=true;document.querySelector('.l1-detail-body [data-l1-guide-source]').focus()");await key(win,'Enter');await sourceWait(win);
  await exec(win,"document.getElementById('l1-detail-toggle').click();document.getElementById('source-close').click()");await settle(win);
  await check(win,"document.activeElement.id==='l1-detail-toggle'&&L1TopicView.getDetailState(document.getElementById('main')).collapsed",'Source close returns to visible collapsed detail control');
  await exec(win,"document.getElementById('l1-detail-toggle').click()");
 }
 await exec(win,"document.getElementById('l1-detail-toggle').click();document.getElementById('btn-explore').focus();document.getElementById('btn-explore').click();document.getElementById('explore-back-reading').click()");await settle(win);
 await check(win,"L1TopicView.getDetailState(document.getElementById('main')).collapsed&&L1TopicView.getSelection(document.getElementById('main')).kind==='relation'&&document.activeElement.id==='btn-explore'",'Explore Back restores collapsed details and focus');
 await exec(win,"document.getElementById('l1-detail-toggle').click();document.querySelector('[data-l1-block]').focus();document.querySelector('[data-l1-block]').click();document.getElementById('reading-back').click()");await settle(win);
 await check(win,"window.__state.view==='l1'&&!L1TopicView.getDetailState(document.getElementById('main')).collapsed&&L1TopicView.getSelection(document.getElementById('main')).kind==='relation'&&document.activeElement.hasAttribute('data-l1-block')",'Block Back restores meaning and focus');
 await exec(win,"document.getElementById('l1-back').click()");await topic(win,'T-03');await verifyGraph(win);
 await exec(win,"document.querySelector('[data-l1-scope=outside]').focus()");await key(win,'Enter');
 await check(win,"(()=>{const id=L1TopicView.getSelection(document.getElementById('main')).id;return document.getElementById('l1-selection-detail').textContent.includes('主题外部对象')&&document.querySelector('.l1-detail-body .l1-explanation-text').textContent===window.__state.l1Topic.outside.find(e=>e.id===id).explanation.detail;})()",'outside object has its own bound meaning');
 await exec(win,"document.getElementById('l1-back').click()");
 return 'F23 v0.2 explanations: direct concept contrast, real node/edge/outside meaning, exact Source, native keys and detail/Block/Explore Back passed';
}
async function runExplanationIntegration(win){
 const parent=path.resolve('workspace/tmp/tests'),prefix=path.join(parent,'f23-explanations-');await fs.mkdir(parent,{recursive:true});const root=await fs.mkdtemp(prefix),oldSize=win.getContentSize();
 const inputs={source:path.resolve('samples/context-consumption/source.md'),design:path.resolve('samples/context-consumption/design-review.json'),plan:path.resolve('samples/context-consumption/overview-plan.json'),generated:path.resolve('artifacts/experiments/stage2-full/overview.generated.json'),map:path.resolve('samples/context-consumption/framework-map.reading.json')};
 const record=process.argv.includes('--record-l1-explanation-evidence'),out=path.resolve('docs/log/artifacts/F23-l1-topic-boundary-view');
 async function size(w,h){win.setContentSize(w,h);await exec(win,`new Promise((r,j)=>{const until=Date.now()+3000;function p(){if(innerWidth===${w}&&innerHeight===${h})return requestAnimationFrame(r);if(Date.now()>until)return j(Error('size timeout'));requestAnimationFrame(p);}p();})`);}
 async function load(file){const result=await exec(win,`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(file)})`);assert.equal(result.ok,true,JSON.stringify({stage:result.stage,errors:result.errors}));await settle(win);}
 async function shot(name){if(!record)return;await exec(win,"document.querySelector('.toast')?.remove()");await settle(win);const capture=await win.webContents.capturePage(),dimensions=await exec(win,'({width:innerWidth,height:innerHeight})');assert.deepEqual(capture.getSize(),dimensions);await fs.writeFile(path.join(out,name),capture.toPNG());}
 try{
  await size(1280,900);const fixture=await exportReadingBundle({...inputs,out:path.join(root,'analysis'),analysisId:'f23-explanations'});await load(fixture.manifestPath);const report=await exerciseExplanations(win);
  await topic(win,'T-01');await shot('explanations-concepts.png');await exec(win,"document.getElementById('l1-back').click()");await topic(win,'T-03');await exec(win,"document.querySelector('[data-l1-scope=outside]').click();document.querySelector('.l1-workspace').scrollIntoView({block:'start'})");await shot('explanations-crossing.png');await exec(win,"document.getElementById('l1-back').click()");
  await size(640,720);await exerciseExplanations(win);await topic(win,'T-01');await shot('explanations-concepts-narrow.png');await exec(win,"document.getElementById('l1-back').click()");await topic(win,'T-02');await exec(win,"document.querySelector('[data-l1-relation-button]').click();document.querySelector('.l1-workspace').scrollIntoView({block:'start'})");await shot('explanations-graph-narrow.png');
  await check(win,"innerWidth===640&&innerHeight===720&&document.documentElement.scrollWidth<=innerWidth&&document.getElementById('l1-detail-toggle').getBoundingClientRect().bottom<=innerHeight",'actual narrow dimensions and reachable collapse');
  const loaded=await readReadingBundle(fixture.manifestPath),manifest=loaded.bundle.manifest,mapFile=loaded.bundle.paths.frameworkMap,registryFile=loaded.bundle.paths.sourceSections,sourceFile=loaded.bundle.paths.source,original=loaded.bundle.frameworkMap;
  async function write(name,text){const file=loaded.bundle.paths[name];await fs.writeFile(file,text);manifest.files[name].sha256=sha256(await fs.readFile(file));await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));}
  const mixed=structuredClone(original);mixed.readingGuide.elements.find(e=>e.elementId==='E-03').explanation.sources.push({namespace:'heading',key:'missing',quote:'missing'});await write('frameworkMap',JSON.stringify(mixed));await load(fixture.manifestPath);await topic(win,'T-03');
  await exec(win,"document.querySelector('[data-l1-node=\"E-03\"]').click()");await check(win,"document.querySelector('.l1-detail-body .l1-explanation').dataset.explanationState==='declared'&&document.querySelectorAll('.l1-detail-body [data-l1-guide-source]:disabled').length===1",'partial source failure does not become all located');
  const parallel=structuredClone(original);parallel.edges.unshift({from:'E-01',to:'E-05',type:'relates-to'});parallel.readingGuide.edges.forEach(e=>e.edgeIndex++);parallel.readingGuide.binding.mapSha256=mapFingerprint(parallel);await write('frameworkMap',JSON.stringify(parallel));await load(fixture.manifestPath);await topic(win,'T-03');
  await check(win,"window.__state.l1Topic.relations[0].edgeIndex===2&&window.__state.l1Topic.relations[0].explanation.summary===window.__state.l0ViewModel.edges[2].explanation.summary",'external edge cannot shift meaning occurrence');
  await write('frameworkMap',JSON.stringify(original));const registry=JSON.parse(await fs.readFile(registryFile,'utf8'));registry.headings[0].title+=' drift';await write('sourceSections',JSON.stringify(registry));await load(fixture.manifestPath);await topic(win,'T-01');
  await check(win,"[...document.querySelectorAll('[data-l1-guide-source]')].every(b=>b.disabled)&&window.__state.l1Topic.inside.every(e=>e.explanation.sourceState==='declared')",'registry drift never shows usable guide source');
  await write('sourceSections',JSON.stringify(loaded.bundle.sourceSections));await load(fixture.manifestPath);await topic(win,'T-01');await fs.appendFile(sourceFile,'\nlive drift');await exec(win,"document.querySelector('.l1-summary-card .l1-explanation-sources').open=true;document.querySelector('.l1-summary-card [data-l1-guide-source]').click()");await sourceWait(win);await check(win,"document.getElementById('source-body').dataset.coordinateState==='unavailable'",'live Source integrity still enforced');
  await exec(win,`loadL0(${JSON.stringify(path.resolve('samples/operational-runbook/framework-map.reading.json'))})`);await topic(win,'T-02');await verifyGraph(win);
  await check(win,"window.__state.l1Topic.inside.every(e=>e.explanation.sourceState==='declared')&&[...document.querySelectorAll('[data-l1-guide-source]')].every(b=>b.disabled)&&!document.querySelector('[data-l1-block]')",'independent runbook keeps declarations, no invented source/Plan');
  await exec(win,`loadL0(${JSON.stringify(path.resolve('samples/context-consumption/framework-map.json'))})`);await topic(win,'T-01');await check(win,"window.__state.l1Topic.explanationState==='absent'&&!document.querySelector('[data-l1-guide-source]')&&Boolean(document.querySelector('.l1-explanation-missing'))",'legacy Map clears prior explanations');
  await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  return report+'; narrow/source drift/partial/external occurrence/independent/legacy/no-save passed';
 }finally{win.setContentSize(...oldSize);assert.ok(path.resolve(root).startsWith(prefix));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={exerciseExplanations,runExplanationIntegration};
