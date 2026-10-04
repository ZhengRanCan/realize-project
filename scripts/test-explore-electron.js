'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
async function exerciseExplore(win){return win.webContents.executeJavaScript(`(async()=>{
 const check=(v,m)=>{if(!v)throw new Error('F20 '+m);},s=window.__state,n=window.__readingNavigation,main=document.getElementById('main');
 const wait=()=>new Promise(r=>setTimeout(r,140));
 const element=s.exploreProjection.catalog.find(e=>e.available&&e.ref.kind==='element');check(element,'addressable Element');
 const topic=s.l1Topics['T-05']?.blockEntries?.length?s.l1Topics['T-05']:Object.values(s.l1Topics).find(t=>t.blockEntries?.length);check(topic,'Topic');
 const enter=ref=>{const select=document.getElementById('explore-entity');select.value=ref.kind+':'+ref.id;const button=document.getElementById('btn-explore');button.focus();button.click();check(s.view==='explore','real Explore entry');};
 main.querySelector('.l0-node').click();const selection=L0Map.getSelection(main),initialCalls=n.snapshot().resolverCalls;
 enter(element.ref);check(main.querySelector('[data-explore-focus]').dataset.exploreFocus==='element:'+element.ref.id,'Element Focus');
 const neighbor=main.querySelector('[data-explore-id]:not([disabled])');check(neighbor,'typed neighbor');neighbor.click();
 document.getElementById('explore-back-reading').click();check(s.view==='l0'&&n.size===0,'L0 Back Reading');check(JSON.stringify(L0Map.getSelection(main))===JSON.stringify(selection),'L0 selection');check(n.snapshot().resolverCalls===initialCalls,'Back Reading no resolver');
 main.querySelector('.topic-entry[data-topic-focus="'+topic.topic.id+'"] [data-enter-topic]').click();
 enter({kind:'topic',id:topic.topic.id});check(document.getElementById('explore-open-reading').disabled,'Topic no canonical landing');
 check(main.querySelector('[data-explore-organization]').dataset.exploreOrganization===topic.blockOrganization.state,'Topic organization preserved');
 enter(element.ref);document.getElementById('explore-open-reading').click();
 check(s.view==='l0'&&document.getElementById('element-'+element.ref.id).checkVisibility(),'Open in Reading uses canonical Element');
 document.getElementById('reading-back').click();check(s.view==='explore'&&s.focusRef.id===element.ref.id,'canonical Back restores Explore');
 document.getElementById('explore-back-reading').click();check(s.view==='l1'&&s.l1Topic.topic.id===topic.topic.id,'L1 Back Reading');
 const block=main.querySelector('[data-l1-block]');const id=block.dataset.l1Block;block.click();
 enter(element.ref);enter({kind:'topic',id:topic.topic.id});document.getElementById('explore-back-reading').click();
 check(s.view==='overview'&&s.readingTopicId===topic.topic.id&&s.readingBlockId===id,'L2 occurrence after Focus changes');
 const fragment=main.querySelector('#block-'+id+' [data-fragment-path]');
 await window.__openInspection(id,fragment?.dataset.fragmentPath);
 const source=document.querySelector('[data-source-unit-id] button');source.click();await wait();
 const coordinate=document.getElementById('l3-source-coordinate').textContent;
 const disclosure=document.querySelector('#source-body details');if(disclosure)disclosure.open=true;
 const origin=n.snapshot().current;enter(element.ref);document.getElementById('explore-back-reading').click();await wait();
 check(s.inspectionSubject?.blockId===id,'L3 Back Reading');check(JSON.stringify(s.inspectionSubject)===JSON.stringify(origin.context.inspection),'ephemeral fragment restore');
 check(document.getElementById('l3-source-coordinate').textContent===coordinate,'L3 coordinate restore');
 check(!disclosure||document.querySelector('#source-body details').open,'L3 disclosure restore');check(document.activeElement.id==='btn-explore','entry focus restored');
 window.__closeInspection();
 const before=n.snapshot(),view=s.view;for(const kind of ['block','review','evidence','source-unit','fragment'])check(!window.__openExplore({kind,id}).ok,'unsupported '+kind);
 check(n.size===before.frames.length&&s.view===view,'denial unchanged');
 return 'F20 actual L0/L1/L2/L3 → Explore, typed Focus traversal, Back to Reading occurrence/selection/disclosure/source/focus, canonical Resolve and Topic rejection passed';
})()`);}
async function runExploreIntegration(win){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'f20-explore-')),exec=code=>win.webContents.executeJavaScript(code);
 try{
  const fixture=await makeBundleFixture(root);await exec(`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);
  const report=await exerciseExplore(win);
  await exec(`loadL0(${JSON.stringify(fixture.inputs.map)})`);
  assert.equal(await exec("(()=>{const topic=window.__state.l0ViewModel.topics.find(t=>t.blockIds?.length);window.__openExplore({kind:'topic',id:topic.id});const buttons=[...document.querySelectorAll('[data-explore-block]')];return buttons.length===topic.blockIds.length&&buttons.every(b=>b.disabled)&&document.getElementById('main').textContent.includes('当前未加载区块资料');})()"),true);
  await exec(`loadL0(${JSON.stringify(path.resolve('samples/operational-runbook/framework-map.json'))})`);
  assert.equal(await exec("(()=>{const c=window.__state.exploreProjection.catalog.find(e=>e.ref.id==='E-11');const before=window.__readingNavigation.size;const result=window.__openExplore(c.ref);return c.reason==='attachment-only'&&!result.ok&&window.__readingNavigation.size===before;})()"),true);
  await exec("window.__openExplore({kind:'element',id:'E-06'})");
  assert.equal(await exec("Boolean(document.querySelector('[data-explore-annotations]'))&&Boolean(document.querySelector('[data-explore-gaps]'))"),true);
  await exec(`loadL0(${JSON.stringify(path.resolve('samples/goal-plan-task-state/framework-map.json'))})`);
  assert.equal(await exec("(()=>{const s=window.__state,id=s.l0ViewModel.edges.find(e=>e.type==='relates-to').from;window.__openExplore({kind:'element',id});const row=document.querySelector('.direction-undirected .explore-relation');return row.textContent.includes('relates-to—')&&!row.textContent.includes('relates-to→');})()"),true);
  await exec(`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);assert.equal(await exec("window.__state.focusRef===null&&window.__readingNavigation.size===0"),true);
  const manifest=JSON.parse(await fs.readFile(fixture.manifestPath,'utf8'));delete manifest.files.frameworkMap;delete manifest.bindings.frameworkDocumentId;await fs.writeFile(fixture.manifestPath,JSON.stringify(manifest));
  await exec(`window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);assert.equal(await exec("document.getElementById('btn-explore').disabled&&document.getElementById('explore-availability').textContent.includes('未提供')"),true);
  await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  return report+'; attachment-only annotation/gaps, independent Map, no-Map, session reset and no auto-save passed';
 }finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={exerciseExplore,runExploreIntegration};
