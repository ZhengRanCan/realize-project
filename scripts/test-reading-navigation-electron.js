'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
async function exerciseNavigation(win){
 return win.webContents.executeJavaScript(`(async()=>{
  const check=(value,message)=>{if(!value)throw new Error('F19 '+message);};
  const s=window.__state,n=window.__readingNavigation,wait=()=>new Promise(r=>setTimeout(r,140));
  const t=s.l1Topics?.['T-05']?.blockEntries?.length?s.l1Topics['T-05']:Object.values(s.l1Topics||{}).find(t=>t.blockEntries?.length);
  check(t,'Topic entry');const main=document.getElementById('main');
  const graphNode=main.querySelector('.l0-node');graphNode?.click();const selection=L0Map.getSelection(main);check(selection?.kind==='element','fresh Map selection');
  const fold=main.querySelector('.l0-howto');fold.open=true;
  main.querySelector('[data-panel-tab-button=topics]').click();const trigger=main.querySelector('.topic-entry[data-topic-focus="'+t.topic.id+'"] [data-enter-topic]');trigger.focus();main.scrollTop=80;
  const mapScroll=main.scrollTop;trigger.click();check(s.view==='l1','enter L1');
  const blockButton=main.querySelector('[data-l1-block]'),id=blockButton.dataset.l1Block;blockButton.focus();blockButton.click();check(s.readingTopicId===t.topic.id&&s.view==='overview','occurrence Block');
  const inspection=main.querySelector('[data-inspect-block="'+id+'"]');inspection.focus();const blockScroll=main.scrollTop;
  await window.__openInspection(id);check(s.inspectionSubject.blockId===id,'L3');check(n.size===3,'one stack');
  n.back();check(!s.inspectionSubject&&s.readingTopicId===t.topic.id,'L3 Back occurrence');check(main.scrollTop===blockScroll,'Block scroll');check(document.activeElement.dataset.inspectBlock===id,'Block focus');
  const calls=n.snapshot().resolverCalls;
  await n.resolve({kind:'element',id:s.l0ViewModel.elements[0].id});const anchor=document.getElementById('element-'+s.l0ViewModel.elements[0].id);
  check(anchor.checkVisibility()&&document.activeElement===anchor,'canonical Element visible focus');
  check(document.querySelectorAll('[id="'+anchor.id+'"]').length===1,'unique Element anchor');
  const tab=main.querySelector('[data-l0-view="reading"]');tab.focus();main.querySelector('.topic-entry[data-topic-focus="'+t.topic.id+'"] [data-enter-topic]').click();document.getElementById('l1-back').click();
  check(document.getElementById(anchor.id).checkVisibility()&&document.activeElement.dataset.l0View==='reading','canonical subject preserved after moving focus');
  document.getElementById('reading-back').click();check(s.readingTopicId===t.topic.id&&s.readingBlockId===id,'Resolve Back original occurrence');check(n.snapshot().resolverCalls===calls+1,'Back no resolver');
  for(const kind of ['topic','source-unit','review','evidence','fragment']){const before=n.size,view=s.view;check(!n.resolve({kind,id:'SU-001'}).ok,'unsupported '+kind);check(n.size===before&&s.view===view,'unsupported unchanged');}
  document.getElementById('reading-back').click();check(s.view==='l1'&&s.l1Topic.topic.id===t.topic.id,'L2 Back Topic');check(document.activeElement.dataset.l1Block===id,'Topic focus');
  document.getElementById('l1-back').click();check(s.view==='l0','L1 Back Map');await wait();
  check(main.scrollTop===mapScroll,'Map scroll');check(document.activeElement.hasAttribute('data-enter-topic'),'Map focus');check(main.querySelector('.l0-howto').open,'Map disclosure');check(JSON.stringify(L0Map.getSelection(main))===JSON.stringify(selection),'Map selection');
  check(n.size===0,'empty stack');check(!n.back().ok&&s.view==='l0','empty no home');
  const attachment=s.l0ViewModel.attachments[0]?.elementId;if(attachment){await n.resolve({kind:'element',id:attachment});check(document.getElementById('element-'+attachment).checkVisibility(),'attachment canonical');n.back();}
  await n.resolve({kind:'block',id});check(s.view==='overview'&&s.readingTopicId===null,'canonical Block no inferred Topic');
  const fragment=main.querySelector('#block-'+id+' [data-fragment-path]');
  if(fragment){fragment.focus();await window.__openInspection(id,fragment.dataset.fragmentPath);check(!location.hash.includes('fragment'),'no durable fragment');n.back();check(document.activeElement.dataset.fragmentPath===fragment.dataset.fragmentPath,'fragment focus restored');}
  n.back();check(s.view==='l0','canonical Block Back');
  return 'F19 real navigation: layered Back, occurrence, selection/disclosure/scroll/focus, unique visible resolver, attachment and rejection passed';
 })()`);
}
async function runNavigationIntegration(win){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'f19-navigation-'));
 try{
  const a=await makeBundleFixture(path.join(root,'a')),b=await makeBundleFixture(path.join(root,'b'));
  const execute=code=>win.webContents.executeJavaScript(code);
  await execute(`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(a.manifestPath)})`);
  const report=await exerciseNavigation(win);
  await execute("window.__readingNavigation.resolve({kind:'block',id:'O-01'})");
  const hold=require('./test-reading-bundle-electron').holdNextRead(path.join(path.dirname(a.manifestPath),'source.md'));
  try{await execute("window.__pendingInspection=window.__openInspection('O-01');true");await hold.blocked;await execute('window.__readingNavigation.back()');hold.release();await execute('window.__pendingInspection');assert.equal(await execute("!window.__state.inspectionSubject&&window.__state.view==='l0'"),true);}finally{hold.restore();}
  await execute("window.__readingNavigation.resolve({kind:'block',id:'O-01'});window.__openInspection('O-01')");
  await execute("document.querySelector('[data-source-unit-id] button').click();new Promise(r=>setTimeout(r,80))");
  await execute("window.__readingNavigation.resolve({kind:'element',id:window.__state.l0ViewModel.elements[0].id})");
  const holdRestore=require('./test-reading-bundle-electron').holdNextRead(path.join(path.dirname(a.manifestPath),'source.md'),1);
  try{
   await execute('window.__restoring=window.__readingNavigation.back();true');await holdRestore.blocked;
   await execute("openSource('§0')");holdRestore.release();const restored=await execute('window.__restoring');assert.equal(restored.reason,'stale');
   assert.equal(await execute("!window.__state.inspectionSubject&&!document.getElementById('l3-source-coordinate')&&!document.getElementById('source-panel').classList.contains('hidden')"),true);
  }finally{holdRestore.restore();}
  const old=await execute("window.__readingNavigation.resolve({kind:'block',id:'O-01'});window.__readingNavigation.snapshot()");
  await execute(`window.__loadBundle(${JSON.stringify(path.join(root,'missing'))})`);
  assert.deepEqual((await execute('window.__readingNavigation.snapshot()')).frames,old.frames);
  await execute(`(async()=>{const confirm=window.confirm;window.confirm=()=>false;window.__state.dirty=true;await window.__loadBundle(${JSON.stringify(b.manifestPath)});window.confirm=confirm;window.__state.dirty=false;})()`);
  assert.deepEqual((await execute('window.__readingNavigation.snapshot()')).frames,old.frames);
  await execute(`window.__loadBundle(${JSON.stringify(b.manifestPath)})`);
  const next=await execute('window.__readingNavigation.snapshot()');assert.notEqual(next.sessionKey,old.sessionKey);assert.equal(next.frames.length,0);
  // Real loaded bundle: orphan Block + missing Generated keep canonical existence.
  const c=await makeBundleFixture(path.join(root,'c')),dir=path.dirname(c.manifestPath);
  const manifest=JSON.parse(await fs.readFile(c.manifestPath,'utf8'));
  const mapFile=path.join(dir,manifest.files.frameworkMap.path),map=JSON.parse(await fs.readFile(mapFile,'utf8'));
  for(const topic of map.topics)topic.blockIds=[];
  const text=JSON.stringify(map);await fs.writeFile(mapFile,text);manifest.files.frameworkMap.sha256=require('../app/shared/source-coordinates').sha256(text);delete manifest.files.generated;
  await fs.writeFile(c.manifestPath,JSON.stringify(manifest));
  assert.equal((await execute(`window.__loadBundle(${JSON.stringify(c.manifestPath)})`)).ok,true);
  assert.equal(await execute("Object.values(window.__state.l1Topics).every(t=>t.blockOrganization.state==='empty')"),true);
  await execute("window.__readingNavigation.resolve({kind:'block',id:'O-01'})");
  assert.equal(await execute("document.getElementById('block-O-01').checkVisibility()&&document.activeElement.id==='block-O-01'&&window.__state.readingTopicId===null&&window.__state.l2ViewModel.sections[0].blocks[0].generatedExpression.state==='unknown'"),true);
  delete manifest.files.frameworkMap;delete manifest.bindings.frameworkDocumentId;await fs.writeFile(c.manifestPath,JSON.stringify(manifest));
  assert.equal((await execute(`window.__loadBundle(${JSON.stringify(c.manifestPath)})`)).ok,true);
  assert.equal(await execute("window.__readingNavigation.resolve({kind:'block',id:'O-01'}).ok&&!window.__readingNavigation.resolve({kind:'element',id:'E-01'}).ok"),true);
  await assert.rejects(fs.access(path.join(path.dirname(a.manifestPath),'human-review.json')));
  return report+'; successful session switch clears history, no auto-save';
 }finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={runNavigationIntegration,exerciseNavigation};
