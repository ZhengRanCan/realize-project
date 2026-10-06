'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {performance}=require('node:perf_hooks');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {makeMaturityMap}=require('./helpers/maturity-fixture');
const {buildL0ViewModel}=require('./l0-view-model'),{createExploreProjection}=require('../app/shared/explore-projection'),{computeL0Layout}=require('../app/renderer/l0-layout'),{renderL0MapHTML}=require('../app/renderer/l0-map');
function measurePure(name,map){const start=performance.now(),vm=buildL0ViewModel(map);createExploreProjection(vm);const projected=performance.now();renderL0MapHTML(vm,{layout:computeL0Layout(vm)});const rendered=performance.now();assert.ok(projected-start<=250);assert.ok(rendered-projected<=1500);return {name,elements:map.elements.length,edges:map.edges.length,projectionMs:+(projected-start).toFixed(2),layoutRenderMs:+(rendered-projected).toFixed(2)};}
const exec=(win,code)=>win.webContents.executeJavaScript(code);
const pause=()=>new Promise(r=>setTimeout(r,100));
async function key(win,keyCode,modifiers=[]){const code=keyCode==='Enter'?'Return':keyCode==='Space'?' ':keyCode;win.webContents.sendInputEvent({type:'keyDown',keyCode:code,modifiers});if(keyCode==='Enter'||keyCode==='Space')win.webContents.sendInputEvent({type:'char',keyCode:keyCode==='Enter'?'\r':' ',modifiers});win.webContents.sendInputEvent({type:'keyUp',keyCode:code,modifiers});await pause();}
async function focus(win,selector){await exec(win,`(()=>{const node=document.querySelector(${JSON.stringify(selector)});if(node.closest('#l0-panel-topics'))document.querySelector('[data-panel-tab-button=topics]').click();if(node.closest('#l0-panel-meaning'))document.querySelector('[data-panel-tab-button=meaning]').click();if(node.closest('#l1-related'))document.querySelector('[data-l1-tab=related]').click();node.focus();})()`);}
async function check(win,code,label){const result=await exec(win,code);if(result!==true)throw new Error('F21 '+label+' '+JSON.stringify(await exec(win,"({width:innerWidth,height:innerHeight,active:document.activeElement.outerHTML.slice(0,300),view:window.__state.view,overflow:document.documentElement.scrollWidth})")));}
async function exerciseMaturity(win){
 win.focus();win.webContents.focus();
 await focus(win,'.l0-node');await key(win,'Enter');
 await check(win,"document.activeElement.classList.contains('l0-node')&&document.activeElement.getAttribute('aria-pressed')==='true'&&getComputedStyle(document.activeElement).outlineStyle!=='none'",'native Enter, selection and visible focus');
 await key(win,'Space');await check(win,"L0Map.getSelection(document.getElementById('main')).kind==='element'",'native Space');
 await focus(win,'#btn-explore');await key(win,'Tab');
 await check(win,"document.activeElement.id!=='btn-explore'&&document.activeElement!==document.body",'native Tab advances');
 const topic=await exec(win,"Object.values(window.__state.l1Topics).find(t=>t.blockEntries?.length).topic.id");
 await focus(win,'.topic-entry[data-topic-focus="'+topic+'"] [data-enter-topic]');await key(win,'Enter');
 await check(win,"window.__state.view==='l1'",'keyboard Topic');
 await focus(win,'[data-l1-block]');await key(win,'Space');
 const id=await exec(win,'window.__state.readingBlockId');
 await check(win,"window.__state.view==='l2'&&Boolean(window.__state.readingBlockId)",'keyboard Block');
 await focus(win,'[data-inspect-block="'+id+'"]');await key(win,'Enter');
 await check(win,"Boolean(window.__state.inspectionSubject)&&document.activeElement.id==='l3-close'",'keyboard inspector');
 await key(win,'Escape');await check(win,"!window.__state.inspectionSubject&&document.activeElement.dataset.inspectBlock===window.__state.readingBlockId",'Escape L3 restores origin focus');
 await focus(win,'#btn-explore');await key(win,'Enter');
 await check(win,"window.__state.view==='explore'",'keyboard Explore');
 await key(win,'Escape');await check(win,"window.__state.view==='l2'&&document.activeElement.id==='btn-explore'",'Escape Explore restores Reading');
 await key(win,'Escape');await check(win,"window.__state.view==='l1'&&L1TopicView.getDetailState(document.getElementById('main')).tab==='related'&&document.activeElement.hasAttribute('data-l1-block')&&document.activeElement.checkVisibility()",'Escape Block restores related tab and focus');
 await key(win,'Escape');await check(win,"window.__state.view==='l0'&&document.activeElement.hasAttribute('data-enter-topic')",'Escape Topic');
 await check(win,"document.getElementById('reading-location').getAttribute('aria-live')==='polite'&&document.getElementById('save-state').getAttribute('aria-live')==='polite'",'live location/save state');
 // Native SELECT Escape and injected composing/editable events must leave route and review unchanged.
 await focus(win,'#explore-entity');await key(win,'G');await key(win,'Escape');
 await check(win,"window.__state.view==='l0'",'SELECT shortcut guard');
 await exec(win,`(()=>{for(const view of ['l0','decisions']){if(view==='decisions')window.__readingNavigation.enter({type:'view',view});const before=JSON.stringify(window.__state.humanReview);for(const tag of ['input','textarea','div']){const node=document.createElement(tag);if(tag==='div')node.contentEditable='true';document.getElementById('main').append(node);node.focus();for(const key of ['g','d','a','r','l','Escape'])node.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));node.remove();}for(const init of [{key:'g',isComposing:true},{key:'d',ctrlKey:true},{key:'g',altKey:true},{key:'d',metaKey:true},{key:'a',isComposing:true},{key:'r',ctrlKey:true},{key:'l',metaKey:true}])document.body.dispatchEvent(new KeyboardEvent('keydown',{...init,bubbles:true}));if(window.__state.view!==view||JSON.stringify(window.__state.humanReview)!==before)throw new Error('F21 editable/IME/modifier guard');if(view==='decisions')window.__readingNavigation.back();}})()`);
 return 'F21 native Tab/Enter/Space/Escape, layered focus recovery, edit/SELECT/IME/modifier guards and live regions passed';
}
async function runMaturityIntegration(win){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'f21-maturity-')),oldSize=win.getContentSize(),oldZoom=win.webContents.getZoomFactor();
 const out=path.resolve('docs/log/artifacts/F21-product-maturity'),record=process.argv.includes('--record-maturity-evidence');
 const metrics={measuredAt:new Date().toISOString(),platform:process.platform,versions:{node:process.versions.node,electron:process.versions.electron,chrome:process.versions.chrome},budgets:{projectionMs:250,layoutRenderMs:1500,navigationMs:2000},viewport:{desktop:[1280,900],narrow:[640,720]},rows:[]};
 try{
  win.webContents.setZoomFactor(1);win.setContentSize(1280,900);const fixture=await makeBundleFixture(root);
  await exec(win,`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);
  metrics.rows.push(measurePure('Gold pure',fixture.models.frameworkMap));
  const report=await exerciseMaturity(win);
  const screenshot=async name=>{await exec(win,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await pause();const capture=await win.webContents.capturePage(),actual=capture.getSize(),viewport=await exec(win,'({width:innerWidth,height:innerHeight})');assert.deepEqual(actual,viewport,'screenshot actual viewport '+JSON.stringify({actual,viewport}));if(record)await fs.writeFile(path.join(out,name),capture.toPNG());};
  await screenshot('reading-map.png');
  const element=await exec(win,"window.__state.exploreProjection.catalog.find(e=>e.available&&e.ref.kind==='element').ref");
  await exec(win,`window.__openExplore(${JSON.stringify(element)})`);await screenshot('explore.png');await exec(win,'window.__readingNavigation.back(true)');
  // Stable counts across real renderer mounts; old event closures must be aborted.
  const baseline=await exec(win,"document.getElementById('main').querySelectorAll('*').length");
  const timings=[];
  for(let i=0;i<15;i++){
   const start=performance.now();await exec(win,`window.__openExplore(${JSON.stringify(element)});window.__readingNavigation.back(true)`);timings.push(performance.now()-start);
   const topic=await exec(win,"Object.values(window.__state.l1Topics).find(t=>t.blockEntries?.length)");const id=topic.blockEntries[0].id;
   await exec(win,`window.__readingNavigation.resolve({kind:'block',id:${JSON.stringify(id)}});window.__openInspection(${JSON.stringify(id)})`);
   await exec(win,'window.__closeInspection();window.__readingNavigation.back()');
   await check(win,`window.__readingNavigation.size===0&&document.getElementById('main').querySelectorAll('*').length===${baseline}`,'15-round stable Map DOM/stack');
   await check(win,"(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.length===new Set(ids).size;})()",'unique IDs');
  }
  assert.ok(Math.max(...timings)<=2000);metrics.rows.push({name:'Gold navigation',rounds:15,maxNavigationMs:+Math.max(...timings).toFixed(2),mapDOM:baseline});
  // A single Topic keyboard activation after remounts must add exactly one frame, not duplicate callbacks.
  await focus(win,'.topic-entry [data-enter-topic]');await key(win,'Enter');await check(win,"window.__readingNavigation.size===1",'no accumulated Topic handlers');await key(win,'Escape');
  win.setContentSize(640,720);await pause();await check(win,'innerWidth===640&&innerHeight===720','actual narrow viewport');
  await check(win,"document.documentElement.scrollWidth<=window.innerWidth&&document.getElementById('btn-explore').getBoundingClientRect().right<=window.innerWidth",'narrow Map no page overflow');
  await exec(win,"window.__readingNavigation.resolve({kind:'block',id:window.__state.l2ViewModel.sections[0].blocks[0].id})");
  await check(win,"document.documentElement.scrollWidth<=window.innerWidth",'narrow L2 no page overflow');
  await focus(win,'[data-inspect-block]');await exec(win,"window.__openInspection(window.__state.readingBlockId)");
  await check(win,"(()=>{const r=document.getElementById('source-close').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&document.activeElement.id==='l3-close';})()",'narrow source close reachable');
  await screenshot('source-narrow.png');await key(win,'Escape');
  await check(win,"document.getElementById('source-panel').classList.contains('hidden')&&document.activeElement.dataset.inspectBlock!==undefined",'narrow source focus recoverable');
  await exec(win,'window.__readingNavigation.back()');
  await exec(win,`window.__openExplore(${JSON.stringify(element)})`);await check(win,"document.documentElement.scrollWidth<=innerWidth&&document.getElementById('explore-back-reading').getBoundingClientRect().right<=innerWidth",'narrow Explore');await key(win,'Escape');
  // Legacy provenance Source uses the same close affordance and returns focus too.
  await exec(win,"document.querySelector('.l0-node').click();document.querySelector('#l0-focus-slot .guide-raw').open=true");
  await focus(win,'#l0-focus-slot [data-source-ref]');await key(win,'Enter');
  await check(win,"!document.getElementById('source-panel').classList.contains('hidden')&&document.activeElement.id==='source-close'",'source keyboard open');await key(win,'Escape');
  await check(win,"document.getElementById('source-panel').classList.contains('hidden')&&document.activeElement.hasAttribute('data-source-ref')",'source keyboard close restores');
  // Actual public stress file goes through the main-process map validation boundary.
  const map=makeMaturityMap();metrics.rows.push(measurePure('stress pure',map));const stressPath=path.join(root,'framework-map.json');await fs.writeFile(stressPath,JSON.stringify(map));
  win.setContentSize(1280,900);const start=performance.now();await exec(win,`loadL0(${JSON.stringify(stressPath)})`);const mounted=performance.now()-start;
  await check(win,"window.__state.l0ViewModel.elements.length===80&&window.__state.l0ViewModel.edges.length===160",'validated stress mount');
  const render=await exec(win,"(()=>{const start=performance.now();render();return performance.now()-start;})()");assert.ok(render<=1500);
  await focus(win,'.l0-node');await key(win,'Enter');
  await check(win,"(()=>{const n=document.activeElement;return n.getAttribute('aria-label')===n.title&&document.querySelector('.focus-inline').textContent.includes(n.getAttribute('aria-label'));})()",'long label full keyboard disclosure');
  const stressDOM=await exec(win,"document.getElementById('main').querySelectorAll('*').length"),stressTimes=[];
  for(let i=0;i<15;i++){const started=performance.now();await exec(win,"window.__openExplore({kind:'element',id:'E-001'});window.__readingNavigation.back(true)");stressTimes.push(performance.now()-started);await check(win,`document.getElementById('main').querySelectorAll('*').length===${stressDOM}&&window.__readingNavigation.size===0`,'stress stable DOM/stack');}
  assert.ok(Math.max(...stressTimes)<=2000);metrics.rows.push({name:'stress',elements:80,edges:160,loadValidateMountMs:+mounted.toFixed(2),actualRenderMs:+render.toFixed(2),maxNavigationMs:+Math.max(...stressTimes).toFixed(2),rounds:15,mapDOM:stressDOM});
  await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  if(record)await fs.writeFile(path.join(out,'performance.json'),JSON.stringify(metrics,null,2)+'\n');
  return report+'; 640x720 source/narrow layout, public stress and 15-round identity/DOM/event budgets passed';
 }finally{win.webContents.setZoomFactor(oldZoom);win.setContentSize(...oldSize);assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={exerciseMaturity,runMaturityIntegration};
