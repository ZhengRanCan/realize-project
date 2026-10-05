'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {exportReadingBundle}=require('./export-reading-bundle');
const {readReadingBundle}=require('../app/main/reading-bundle');
const {mapFingerprint}=require('../app/shared/reading-explanation');
const {holdNextRead}=require('./test-reading-bundle-electron');
const {sha256}=require('../app/shared/source-coordinates');
const exec=(win,code)=>win.webContents.executeJavaScript(code);
const settle=win=>exec(win,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function size(win,width,height){win.setContentSize(width,height);await exec(win,`new Promise((r,j)=>{const until=Date.now()+3000;function p(){if(innerWidth===${width}&&innerHeight===${height})return requestAnimationFrame(r);if(Date.now()>until)return j(Error('viewport resize timeout'));requestAnimationFrame(p);}p();})`);}
async function check(win,code,label){const result=await exec(win,code);if(result!==true)throw new Error('F25 '+label+' '+JSON.stringify(await exec(win,"({view:window.__state.view,selection:window.L0Map.getSelection(document.getElementById('main')),focus:document.activeElement.outerHTML.slice(0,200),graph:{top:document.querySelector('.l0-graph-wrap')?.scrollTop,left:document.querySelector('.l0-graph-wrap')?.scrollLeft},pane:window.L0Map.getPanelState(document.getElementById('main')),meaningTop:document.querySelector('#l0-panel-meaning')?.scrollTop,meaningMax:document.querySelector('#l0-panel-meaning')?.scrollHeight-document.querySelector('#l0-panel-meaning')?.clientHeight,edgeOpen:document.querySelector('.guide-edge-list')?.open})")));}
async function key(win,keyCode){
 const code=keyCode==='Enter'?'Return':keyCode==='Space'?' ':keyCode;
 win.webContents.sendInputEvent({type:'keyDown',keyCode:code});
 if(keyCode==='Enter'||keyCode==='Space')win.webContents.sendInputEvent({type:'char',keyCode:keyCode==='Enter'?'\r':' '});
 win.webContents.sendInputEvent({type:'keyUp',keyCode:code});await settle(win);
}
async function exerciseOrientation(win){
 win.focus();win.webContents.focus();
 await check(win,"window.__state.view==='l0'&&document.querySelector('.l0-orientation').textContent.includes(window.__state.l0ViewModel.readingGuide.orientation.question.summary)",'actual document question');
 await exec(win,"document.querySelector('[data-panel-tab-button=topics]').click();document.querySelector('.topic-entry details').open=false;document.querySelector('.topic-entry summary').click()");
 await check(win,"window.__state.view==='l0'&&document.querySelector('.topic-entry details').open",'disclosure does not navigate');
 await exec(win,"document.querySelector('.topic-entry [data-focus-target]').click()");
 await check(win,"window.__state.view==='l0'&&L0Map.getSelection(document.getElementById('main')).kind==='element'",'Topic member selects without navigation');
 await exec(win,"document.querySelector('.l0-node').focus()");await key(win,'Enter');
 await check(win,"(()=>{const s=L0Map.getSelection(document.getElementById('main'));return s.kind==='element'&&document.getElementById('l0-focus-slot').textContent.includes(window.__state.l0ViewModel.readingGuide.elements[s.id].detail);})()",'node complete explanation / Enter');
 await exec(win,"document.querySelector('#l0-focus-slot .guide-sources').open=true;document.querySelector('#l0-focus-slot [data-guide-source]').focus();document.querySelector('#l0-focus-slot [data-guide-source]').click()");
 // Source IPC is asynchronous; wait for the actual panel instead of a fixed delay.
 await exec(win,"new Promise((resolve,reject)=>{const until=Date.now()+4000;function poll(){if(!document.getElementById('source-panel').classList.contains('hidden'))return resolve();if(Date.now()>until)return reject(Error('F25 source panel timeout'));requestAnimationFrame(poll);}poll();})");
 await check(win,"document.getElementById('source-body').dataset.coordinateState==='known'&&document.getElementById('source-body').textContent.includes(document.querySelector('#l0-focus-slot blockquote').textContent)",'exact heading source opened');
 await exec(win,"document.getElementById('source-close').click()");await settle(win);
 await check(win,"document.activeElement.hasAttribute('data-guide-source')",'Source close returns focus');
 await exec(win,"document.querySelector('.guide-edge-list').open=true;document.querySelector('.guide-edge-list [data-edge-index=\"0\"]').focus()");await key(win,'Space');
 await check(win,"L0Map.getSelection(document.getElementById('main')).edgeIndex===0&&document.getElementById('l0-focus-slot').textContent.includes(window.__state.l0ViewModel.edges[0].explanation.detail)",'edge occurrence / Space');
 await key(win,'Tab');await check(win,"document.activeElement!==document.body",'native Tab');
 const frame=await exec(win,"(()=>{document.querySelector('[data-panel-tab-button=topics]').click();const graph=document.querySelector('.l0-graph-wrap');graph.scrollTop=90;graph.scrollLeft=60;document.querySelector('[data-enter-topic=\"T-02\"]').focus();return {selection:L0Map.getSelection(document.getElementById('main')),top:graph.scrollTop,left:graph.scrollLeft};})()");
 await key(win,'Enter');await check(win,"window.__state.view==='l1'&&window.__state.l1Topic.topic.id==='T-02'",'explicit Topic Enter');
 await exec(win,"document.getElementById('l1-back').click()");await settle(win);
 await check(win,`(()=>{const g=document.querySelector('.l0-graph-wrap');return JSON.stringify(L0Map.getSelection(document.getElementById('main')))===${JSON.stringify(JSON.stringify(frame.selection))}&&g.scrollTop===${frame.top}&&g.scrollLeft===${frame.left}&&document.activeElement.dataset.enterTopic==='T-02'&&document.querySelector('.guide-edge-list').open;})()`,'Back occurrence / disclosure / focus / graph scrolling expected '+JSON.stringify(frame));
 return 'F25 actual orientation, node/edge meaning, heading source, native keys and Topic Back passed';
}
async function exerciseReadingPanel(win){
 win.focus();win.webContents.focus();
 await exec(win,"document.querySelector('[data-panel-tab-button=topics]').click();document.querySelector('.topic-entry details').open=true;document.querySelector('.topic-entry [data-focus-target]').focus()");await key(win,'Enter');
 await check(win,"document.activeElement.id==='l0-tab-meaning'&&document.activeElement.checkVisibility()",'hidden Topic member focus moves to visible meaning tab');
 await exec(win,"document.querySelector('.l0-body').scrollIntoView({block:'start'});document.querySelector('.l0-graph-wrap').scrollTop=85;document.querySelector('.l0-graph-wrap').scrollLeft=40");await settle(win);
 await exec(win,"document.querySelector('.l0-node').focus()");await settle(win);
 const before=await exec(win,"({top:document.querySelector('.l0-graph-wrap').scrollTop,left:document.querySelector('.l0-graph-wrap').scrollLeft,main:document.getElementById('main').scrollTop})");
 await key(win,'Enter');
 await check(win,`(()=>{const graph=document.querySelector('.l0-graph-wrap'),panel=document.querySelector('.l0-reading-panel'),detail=document.querySelector('#l0-focus-slot .guide-detail'),r=panel.getBoundingClientRect(),d=detail.getBoundingClientRect();return panel.dataset.panelTab==='meaning'&&panel.dataset.panelCollapsed==='false'&&detail.checkVisibility()&&r.top>=0&&r.bottom<=innerHeight&&d.top>=r.top&&d.top<r.bottom&&graph.scrollTop===${before.top}&&graph.scrollLeft===${before.left}&&document.getElementById('main').scrollTop===${before.main}&&document.activeElement.classList.contains('l0-node');})()`,'meaning visible beside graph without scrolling/focus loss');
 await exec(win,"document.querySelector('#l0-tab-meaning').focus()");await key(win,'Right');
 await check(win,"document.activeElement.id==='l0-tab-topics'&&document.querySelector('#l0-panel-topics').checkVisibility()&&!document.querySelector('#l0-panel-meaning').checkVisibility()",'native Arrow tab selection');
 await key(win,'Left');await check(win,"document.activeElement.id==='l0-tab-meaning'&&document.querySelector('#l0-panel-meaning').checkVisibility()",'native Arrow back');
 await exec(win,"document.querySelector('.guide-edge-list').open=true;document.querySelector('.guide-edge-list [data-edge-index=\"1\"]').click()");
 await check(win,`document.querySelector('#l0-focus-slot').textContent.includes(window.__state.l0ViewModel.edges[1].explanation.detail)&&document.querySelector('.l0-graph-wrap').scrollTop===${before.top}&&document.querySelector('.l0-graph-wrap').scrollLeft===${before.left}&&document.getElementById('main').scrollTop===${before.main}`,'next connection updates pane without moving graph');
 await exec(win,"document.querySelector('[data-panel-collapse]').click()");
 await check(win,"document.querySelector('.l0-reading-panel').dataset.panelCollapsed==='true'&&!document.querySelector('#l0-panel-meaning').checkVisibility()",'panel collapses without losing selection');
 await exec(win,"document.querySelector('[data-panel-collapse]').click();document.querySelector('#l0-panel-meaning').scrollTop=10");
 const meaningScroll=await exec(win,"document.querySelector('#l0-panel-meaning').scrollTop");assert.ok(meaningScroll>0,'meaning pane actually scrolled');
 await exec(win,"document.querySelector('[data-panel-tab-button=topics]').click();document.querySelector('#l0-panel-topics').scrollTop=45;document.querySelector('[data-enter-topic=\"T-02\"]').focus()");
 const frame=await exec(win,"({panel:L0Map.getPanelState(document.getElementById('main')),scroll:document.querySelector('#l0-panel-topics').scrollTop,selection:L0Map.getSelection(document.getElementById('main'))})");
 await key(win,'Enter');await exec(win,"document.getElementById('l1-back').click()");await settle(win);
 await check(win,`JSON.stringify(L0Map.getPanelState(document.getElementById('main')))===${JSON.stringify(JSON.stringify(frame.panel))}&&document.querySelector('#l0-panel-topics').scrollTop===${frame.scroll}&&JSON.stringify(L0Map.getSelection(document.getElementById('main')))===${JSON.stringify(JSON.stringify(frame.selection))}&&document.activeElement.dataset.enterTopic==='T-02'`,'Topic Back restores panel tab, scroll, edge and focus');
 await exec(win,"document.querySelector('[data-panel-tab-button=meaning]').click()");
 await check(win,`document.querySelector('#l0-panel-meaning').scrollTop===${meaningScroll}`,'Back preserves inactive meaning pane scroll '+meaningScroll);
 await exec(win,"window.__readingNavigation.resolve({kind:'element',id:'E-01'})");
 await exec(win,"document.querySelector('[data-panel-tab-button=topics]').click();document.querySelector('[data-enter-topic=\"T-02\"]').focus()");await key(win,'Enter');await exec(win,"document.getElementById('l1-back').click()");await settle(win);
 await check(win,"L0Map.getPanelState(document.getElementById('main')).tab==='topics'&&document.getElementById('element-E-01').checkVisibility()&&document.activeElement.dataset.enterTopic==='T-02'",'canonical Element Back cannot overwrite saved panel tab/focus');
 await exec(win,"document.querySelector('[data-panel-collapse]').click();document.getElementById('btn-explore').focus();document.getElementById('btn-explore').click();document.getElementById('explore-back-reading').click()");await settle(win);
 await check(win,"L0Map.getPanelState(document.getElementById('main')).tab==='topics'&&L0Map.getPanelState(document.getElementById('main')).collapsed&&document.getElementById('element-E-01').checkVisibility()&&document.activeElement.id==='btn-explore'",'canonical Element Explore Back restores collapsed pane');
 await exec(win,"document.getElementById('reading-back').click()");await settle(win);
 return 'F25 fixed reading panel: actual simultaneous meaning/graph, native tabs, collapse and pane Back passed';
}
async function runOrientationIntegration(win){
 const parent=path.resolve('workspace/tmp/tests'),prefix=path.join(parent,'f25-orientation-');await fs.mkdir(parent,{recursive:true});
 const root=await fs.mkdtemp(prefix),oldSize=win.getContentSize(),oldZoom=win.webContents.getZoomFactor();
 const record=process.argv.includes('--record-l0-orientation-evidence'),out=path.resolve('docs/log/artifacts/F25-l0-document-orientation');
 const shots=[];const panelRecord=process.argv.includes('--record-l0-panel-evidence');
 async function panelShot(name){if(!panelRecord)return;await exec(win,"document.querySelector('[data-panel-tab-button=meaning]').click();document.querySelector('.toast')?.remove()");await settle(win);const capture=await win.webContents.capturePage();await fs.writeFile(path.join(out,name),capture.toPNG());}

 async function shot(name){await exec(win,"document.querySelector('.toast')?.remove()");await settle(win);const capture=await win.webContents.capturePage(),viewport=await exec(win,'({width:innerWidth,height:innerHeight})');assert.deepEqual(capture.getSize(),viewport);const dimensions=await exec(win,"({scrollY:window.scrollY,mainWidth:document.getElementById('main').clientWidth,contentWidth:document.getElementById('main').scrollWidth,mainBox:document.getElementById('main').getBoundingClientRect().toJSON(),screen:document.getElementById('screen-review').getBoundingClientRect().toJSON()})");assert.equal(dimensions.scrollY,0,'outer page stays in viewport');assert.equal(dimensions.mainWidth,dimensions.contentWidth,'main has no horizontal overflow');assert.equal(dimensions.screen.bottom,viewport.height,'screen fills viewport');if(record){await fs.writeFile(path.join(out,name),capture.toPNG());shots.push({file:name,...viewport});}}
 const inputs={source:path.resolve('samples/context-consumption/source.md'),design:path.resolve('samples/context-consumption/design-review.json'),plan:path.resolve('samples/context-consumption/overview-plan.json'),generated:path.resolve('artifacts/experiments/stage2-full/overview.generated.json'),map:path.resolve('samples/context-consumption/framework-map.reading.json')};
 async function load(file){const result=await exec(win,`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(file)})`);assert.equal(result.ok,true,JSON.stringify(result));await settle(win);}
 try{
  win.webContents.setZoomFactor(1);await size(win,1280,900);
  const fixture=await exportReadingBundle({...inputs,out:path.join(root,'analysis'),analysisId:'f25-test'});
  await load(fixture.manifestPath);const panelReport=await exerciseReadingPanel(win);await panelShot('reading-panel-desktop.png');const report=await exerciseOrientation(win);
  await exec(win,"document.querySelector('[data-l0-view=review]').click();document.querySelector('#edge-row-1 .edge-explain').focus()");await key(win,'Space');
  await check(win,"document.querySelector('.l0-root').dataset.view==='review'&&L0Map.getSelection(document.getElementById('main')).edgeIndex===1&&document.querySelector('#edge-row-1 .guide-detail').checkVisibility()&&document.querySelector('#edge-row-1 .guide-detail').textContent===window.__state.l0ViewModel.edges[1].explanation.detail",'Review mode native relation meaning');
  await exec(win,"document.querySelector('#edge-row-1 .guide-sources summary').focus()");await key(win,'Enter');
  await check(win,"document.querySelector('#edge-row-1 .guide-sources').open&&document.querySelector('#edge-row-1 blockquote').checkVisibility()",'Review native source disclosure');
  await exec(win,"document.querySelector('[data-l0-view=reading]').click();document.querySelector('.l0-graph-wrap').scrollTop=0;document.querySelector('.l0-graph-wrap').scrollLeft=0;document.querySelector('.l0-orientation').scrollIntoView({block:'start'})");await shot('context-orientation.png');
  await exec(win,"document.querySelector('.l0-node').click();document.getElementById('l0-focus-slot').scrollIntoView({block:'center'})");await shot('context-meaning.png');
  await size(win,640,720);
  await check(win,'innerWidth===640&&innerHeight===720&&document.documentElement.scrollWidth<=innerWidth','actual narrow viewport / no page overflow');
  await exec(win,"document.querySelector('.l0-orientation').scrollIntoView({block:'start'})");await shot('context-narrow.png');
  await exerciseReadingPanel(win);await panelShot('reading-panel-narrow.png');await exerciseOrientation(win);
  const loaded=await readReadingBundle(fixture.manifestPath),mapFile=loaded.bundle.paths.frameworkMap,sourceFile=loaded.bundle.paths.source,manifest=loaded.bundle.manifest;
  async function mapCase(map){await fs.writeFile(mapFile,JSON.stringify(map));manifest.files.frameworkMap.sha256=sha256(await fs.readFile(mapFile));await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));}
  const original=JSON.parse(await fs.readFile(mapFile,'utf8'));
  const sourceRace=holdNextRead(sourceFile);
  try{
   await exec(win,"window.__f25Source=openSource('1',{namespace:'heading',key:'1'});true");await sourceRace.blocked;
   await exec(win,`loadL0(${JSON.stringify(path.resolve('samples/operational-runbook/framework-map.reading.json'))})`);
   sourceRace.release();await exec(win,'window.__f25Source');
   await check(win,"window.__state.sessionToken===null&&document.getElementById('source-panel').classList.contains('hidden')&&window.__state.l0ViewModel.readingGuide.elements['E-01'].sourceState==='declared'",'late source cannot overwrite new guide session');
  }finally{sourceRace.restore();}
  await load(fixture.manifestPath);
  const loadRace=holdNextRead(mapFile);
  try{
   await exec(win,`window.__f25Load=window.__loadBundle(${JSON.stringify(fixture.manifestPath)});true`);await loadRace.blocked;
   await exec(win,`loadL0(${JSON.stringify(path.resolve('samples/operational-runbook/framework-map.reading.json'))})`);loadRace.release();await exec(win,'window.__f25Load');
   await check(win,"window.__state.sessionToken===null&&window.__state.l0ViewModel.readingGuide.elements['E-01'].sourceState==='declared'",'stale bundle cannot replace later guide');
  }finally{loadRace.restore();}
  await load(fixture.manifestPath);
  await exec(win,`(async()=>{const token=window.__state.sessionToken,confirm=window.confirm;window.__state.dirty=true;window.confirm=()=>false;try{const r=await window.__loadBundle(${JSON.stringify(fixture.manifestPath)});if(!r.canceled||token!==window.__state.sessionToken)throw Error('F25 cancel changed guide');}finally{window.confirm=confirm;window.__state.dirty=false;}})()`);
  const registryFile=loaded.bundle.paths.sourceSections,registryBytes=await fs.readFile(registryFile),registry=JSON.parse(registryBytes);registry.headings[0].title+='-drift';
  await fs.writeFile(registryFile,JSON.stringify(registry));manifest.files.sourceSections.sha256=sha256(await fs.readFile(registryFile));await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));await load(fixture.manifestPath);
  await check(win,"Object.values(window.__state.l0ViewModel.readingGuide.elements).every(e=>e.sources.every(s=>s.state==='unavailable'))",'drifted registry never shows source known');
  await fs.writeFile(registryFile,registryBytes);manifest.files.sourceSections.sha256=sha256(registryBytes);await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));await load(fixture.manifestPath);
  for(const mutate of [m=>m.readingGuide.binding.documentId='wrong',m=>m.readingGuide.binding.mapSha256='0'.repeat(64),m=>m.readingGuide.binding.sourceSha256='0'.repeat(64)]){
   const before=await exec(win,'window.__state.sessionToken'),bad=structuredClone(original);mutate(bad);await mapCase(bad);
   const result=await exec(win,`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);assert.equal(result.ok,false);await check(win,`window.__state.sessionToken===${JSON.stringify(before)}&&window.__state.l0ViewModel.readingGuide.state==='present'`,'bad binding preserves old session');
  }
  const mixed=structuredClone(original);mixed.readingGuide.elements.find(e=>e.elementId==='E-01').explanation.sources.push({namespace:'heading',key:'not-a-heading',quote:'missing'});await mapCase(mixed);await load(fixture.manifestPath);
  await check(win,"(()=>{const e=window.__state.l0ViewModel.readingGuide.elements['E-01'];return e.sourceState==='declared'&&e.sources[0].state==='known'&&e.sources.at(-1).state!=='known';})()",'partial source failure never becomes all located');
  const parallel=structuredClone(original);parallel.edges.push(structuredClone(parallel.edges[0]));parallel.readingGuide.binding.mapSha256=mapFingerprint(parallel);
  const explanation=structuredClone(parallel.readingGuide.edges[0].explanation);explanation.detail='第二次关系出现：'+explanation.detail+'\n完整披露。'.repeat(100);
  parallel.readingGuide.edges.push({edgeIndex:4,explanation});await mapCase(parallel);await load(fixture.manifestPath);
  await exec(win,"document.querySelector('.guide-edge-list').open=true;document.querySelector('.guide-edge-list [data-edge-index=\"4\"]').click()");
  await check(win,"L0Map.getSelection(document.getElementById('main')).edgeIndex===4&&document.querySelector('#l0-focus-slot .guide-detail').textContent===window.__state.l0ViewModel.edges[4].explanation.detail&&[...document.querySelectorAll('path.is-hit')].filter(n=>n.dataset.edgeIndex==='0').length===0",'parallel occurrence, full long explanation');
  await exec(win,"document.querySelector('[data-enter-topic=\"T-02\"]').click();document.getElementById('l1-back').click()");await settle(win);
  await check(win,"L0Map.getSelection(document.getElementById('main')).edgeIndex===4",'parallel occurrence restored');
  await mapCase(original);await load(fixture.manifestPath);
  await fs.appendFile(sourceFile,'\nchanged after opening');
  await exec(win,"document.querySelector('.l0-node').click();document.querySelector('#l0-focus-slot .guide-sources').open=true;document.querySelector('#l0-focus-slot [data-guide-source]').click()");
  await exec(win,"new Promise((r,j)=>{const t=Date.now();function p(){if(!document.getElementById('source-panel').classList.contains('hidden'))return r();if(Date.now()-t>4000)return j(Error('drift source timeout'));requestAnimationFrame(p);}p();})");
  await check(win,"document.getElementById('source-body').dataset.coordinateState==='unavailable'",'live disk drift cannot show known source');
  await exec(win,"document.getElementById('source-close').click()");
  await exec(win,"document.querySelector('.l0-node .node-attach summary').click()");
  await check(win,"window.__state.view==='l0'",'attachment disclosure without navigation');
  const attachment=await exec(win,"(()=>{const b=document.querySelector('.attach-pop button[data-focus-target]');b.click();return b.dataset.focusTarget;})()");
  await check(win,`L0Map.getSelection(document.getElementById('main')).id===${JSON.stringify(attachment)}&&document.getElementById('l0-focus-slot').textContent.includes(window.__state.l0ViewModel.readingGuide.elements[${JSON.stringify(attachment)}].detail)`,'attachment has its own complete explanation');
  const runbook=path.resolve('samples/operational-runbook/framework-map.reading.json');
  assert.equal((await exec(win,`loadL0(${JSON.stringify(runbook)})`)).ok,true);await settle(win);
  await check(win,"window.__state.l0ViewModel.readingGuide.state==='present'&&Object.values(window.__state.l0ViewModel.readingGuide.elements).every(e=>e.sourceState==='declared')&&document.querySelectorAll('[data-enter-topic]').length===8&&[...document.querySelectorAll('[data-guide-source]')].every(b=>b.disabled)",'independent runbook / no invented source or Plan');
  await exec(win,"document.querySelector('.l0-orientation').scrollIntoView({block:'start'})");await shot('runbook-narrow.png');
  await size(win,1280,900);await shot('runbook-orientation.png');
  assert.equal((await exec(win,`loadL0(${JSON.stringify(path.resolve('samples/context-consumption/framework-map.json'))})`)).ok,true);
  await check(win,"window.__state.l0ViewModel.readingGuide.state==='absent'&&document.querySelector('.guide-missing')&&!document.querySelector('[data-guide-source]')",'legacy Map does not carry old guide');
  if(record)await fs.writeFile(path.join(out,'interface-evidence.json'),JSON.stringify({feature:'F25',screenshots:shots,mapSha256:sha256(await fs.readFile(inputs.map)),runbookMapSha256:sha256(await fs.readFile(runbook)),result:report},null,2)+'\n');
  return report+'; '+panelReport+'; narrow/parallel/long/partial/bad binding/live drift/legacy/independent runbook passed';
 }finally{win.setContentSize(...oldSize);win.webContents.setZoomFactor(oldZoom);assert.ok(path.resolve(root).startsWith(prefix));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={exerciseOrientation,exerciseReadingPanel,runOrientationIntegration};
