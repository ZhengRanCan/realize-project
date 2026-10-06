'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
async function exerciseIntegration(win){return win.webContents.executeJavaScript(`(async()=>{
 const check=(v,m)=>{if(!v)throw new Error('F15 '+m);},s=window.__state,n=window.__readingNavigation,main=document.getElementById('main');
 const original=JSON.stringify({l0:s.l0ViewModel,l2:s.l2ViewModel,l1:s.l1Topics}),before=n.snapshot().resolverCalls;
 const ids=s.l2ViewModel.sections.flatMap(section=>section.blocks).map(b=>b.id),element=s.exploreProjection.catalog.find(e=>e.available&&e.ref.kind==='element').ref;
 main.querySelector('.l0-node').click();const selection=L0Map.getSelection(main);
 window.__openExplore(element);document.getElementById('explore-back-reading').click();
 check(s.view==='l0'&&JSON.stringify(L0Map.getSelection(main))===JSON.stringify(selection),'Back restores actual selection');check(n.snapshot().resolverCalls===before,'Back never Resolve');
 n.resolve({kind:'block',id:ids[0]});
 const selected=[...main.querySelectorAll('section.block[id^="block-"]')];check(s.view==='l2'&&selected.length===1&&selected[0].id==='block-'+ids[0]&&selected[0].checkVisibility()&&!selected[0].classList.contains('collapsed'),'L2 DOM only original selected Block, visible and expanded');
 for(const b of s.l2ViewModel.sections.flatMap(section=>section.blocks))check(b.provenanceAssurance.state==='indeterminate'&&b.reviewObjectLinks.relation==='related-to','L2 state/relation not upgraded');
 await window.__openInspection(ids[0]);const host=document.getElementById('source-body');check(host.dataset.claimVerification==='absent'&&host.dataset.provenance==='indeterminate','L3 DOM distinguishes Absent/Indeterminate');
 check(!host.textContent.includes('unverified')&&!host.textContent.includes('unsupported'),'no invented verification code');
 window.__closeInspection();n.back();
 const anchors=[...main.querySelectorAll('[data-canonical-element]')].map(e=>e.dataset.canonicalElement),expected=s.l0ViewModel.elements.map(e=>e.id);check(new Set(anchors).size===anchors.length&&JSON.stringify([...anchors].sort())===JSON.stringify([...expected].sort()),'one original canonical identity per Element');
 check(JSON.stringify({l0:s.l0ViewModel,l2:s.l2ViewModel,l1:s.l1Topics})===original,'renderer inputs unchanged');
 // Preserve complete Plan identity coverage on the explicit legacy overview entry.
 document.querySelector('.nav-item[data-view=overview]').click();
 const rendered=[...main.querySelectorAll('section.block[id^="block-"]')].map(b=>b.id.replace(/^block-/,''));check(s.view==='overview'&&new Set(rendered).size===rendered.length&&JSON.stringify([...rendered].sort())===JSON.stringify([...ids].sort()),'manual overview DOM identity exactly existing Plan');
 n.back();check(s.view==='l0'&&JSON.stringify(L0Map.getSelection(main))===JSON.stringify(selection),'manual overview Back restores Map selection');
 check(n.size===0,'single stack returned to origin');
 return 'F15 actual L0/Explore Back, L2/L3 DOM identity/authority/Absent/Indeterminate and input purity passed';
})()`);}
async function runIntegrationInvariants(win){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'f15-renderer-')),exec=code=>win.webContents.executeJavaScript(code);
 try{
  const fixture=await makeBundleFixture(root);await exec(`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);
  const report=await exerciseIntegration(win);
  // A real independent map suffices for L1 direction, without pretending it has Plan Blocks.
  await exec(`loadL0(${JSON.stringify(path.resolve('samples/goal-plan-task-state/framework-map.json'))})`);
  assert.equal(await exec("(()=>{const s=window.__state,edge=s.l0ViewModel.edges.find(e=>e.type==='relates-to');const topic=Object.keys(s.l1Topics).find(id=>s.l1Topics[id].relations.some(r=>r.id===edge.id));window.__readingNavigation.enter({type:'topic',id:topic});const rows=[...document.querySelectorAll('[data-l1-role]')].filter(r=>r.textContent.includes('relates-to'));return rows.length>0&&rows.every(r=>!/[→←]/.test(r.textContent));})()"),true);
  await exec('window.__readingNavigation.back()');
  await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  return report+'; real L1 symmetric DOM and no auto-save passed; Known(0) landing checked by F19 valid bundle';
 }finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={exerciseIntegration,runIntegrationInvariants};
