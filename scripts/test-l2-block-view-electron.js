'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {exportReadingBundle}=require('./export-reading-bundle');
const exec=async(win,code)=>{const result=await win.webContents.executeJavaScript(`try{${code}}catch(error){({__f24Error:error.stack})}`);if(result?.__f24Error)throw new Error(result.__f24Error+'\nExpression: '+code.slice(0,600));return result;};
const settle=win=>exec(win,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function check(win,code,message){const value=await exec(win,code);assert.equal(value,true,'F24 '+message+' '+(value===true?'':JSON.stringify(await exec(win,"({view:window.__state.view,width:innerWidth,active:document.activeElement.id,pane:window.L1TopicView.getDetailState(document.getElementById('main')),related:document.getElementById('l1-related')?.checkVisibility(),bodyHidden:document.querySelector('.l1-detail-body')?.hidden})"))));}
async function key(win,keyCode){const code=keyCode==='Space'?' ':keyCode==='Enter'?'Return':keyCode==='ArrowRight'?'Right':keyCode==='ArrowLeft'?'Left':keyCode;win.webContents.sendInputEvent({type:'keyDown',keyCode:code});if(keyCode==='Space'||keyCode==='Enter')win.webContents.sendInputEvent({type:'char',keyCode:keyCode==='Enter'?'\r':' '});win.webContents.sendInputEvent({type:'keyUp',keyCode:code});await settle(win);}
async function exerciseL2(win){
 win.focus();win.webContents.focus();
 const subjects=await exec(win,"window.__state.l2ViewModel.sections.flatMap(s=>s.blocks).map(b=>b.id)");
 // Compare every expression with the unchanged explicit Overview renderer,
 // then require the independent page to contain exactly one Plan identity.
 const expected=await exec(win,"(()=>{const n=window.__readingNavigation,s=window.__state;s.l2ViewModel.sections.flatMap(x=>x.blocks).forEach(b=>s.blockExpanded[b.id]=true);n.enter({type:'view',view:'overview'});return Object.fromEntries([...document.querySelectorAll('#main .block')].map(b=>{const body=b.querySelector('.block-body').cloneNode(true),paths=[...body.querySelectorAll('[data-fragment-path]')].map(n=>n.dataset.fragmentPath);body.querySelectorAll('.fragment-inspect').forEach(n=>n.remove());return [b.dataset.blockId,{html:body.innerHTML,paths}];}));})()");
 await exec(win,'window.__readingNavigation.back()');
 for(const id of subjects){
  await exec(win,`window.__readingNavigation.resolve({kind:'block',id:${JSON.stringify(id)}})`);await settle(win);
  await check(win,`(()=>{const m=document.getElementById('main'),b=document.getElementById('block-'+${JSON.stringify(id)}),body=b.querySelector('.block-body').cloneNode(true);body.querySelectorAll('.l2-cell-inspect').forEach(n=>n.replaceWith(...n.childNodes));body.querySelectorAll('.l2-fragment-target').forEach(n=>{n.classList.remove('l2-fragment-target');for(const attr of ['role','tabindex','aria-label','title','data-fragment-path'])n.removeAttribute(attr);});return window.__state.view==='l2'&&m.querySelectorAll('section.block').length===1&&m.querySelectorAll('.stage-head,.overview-end').length===0&&document.querySelectorAll('[id="block-${id}"]').length===1&&b.checkVisibility()&&document.activeElement===b&&b.querySelectorAll('.fragment-inspect').length===0&&JSON.stringify([...b.querySelectorAll('[data-fragment-path]')].map(n=>n.dataset.fragmentPath))===${JSON.stringify(JSON.stringify(expected[id].paths))}&&body.innerHTML===${JSON.stringify(expected[id].html)}&&(b.compareDocumentPosition(m.querySelector('.l2-context'))&Node.DOCUMENT_POSITION_FOLLOWING)!==0&&getComputedStyle(document.querySelector('.toc-pane')).display==='none'&&window.__state.readingTopicId===null&&m.scrollTop===0&&m.querySelector('.l2-heading h1').getBoundingClientRect().top>=m.getBoundingClientRect().top;})()`,'single canonical subject, original expression and context below '+id);
  await exec(win,'window.__readingNavigation.back()');
 }
 await exec(win,"window.__readingNavigation.resolve({kind:'block',id:'O-02'})");
 for(const keyCode of ['Enter','Space']){
  await exec(win,"document.querySelector('.rung[data-fragment-path=\"tiers[0]\"]').focus()");
  const depth=await exec(win,'window.__readingNavigation.size');await key(win,keyCode);
  await exec(win,"new Promise((r,j)=>{const stop=Date.now()+4000;function p(){if(window.__state.inspectionSubject?.fragmentPath==='tiers[0]')return r();if(Date.now()>stop)return j(Error('Receipt inspection'));requestAnimationFrame(p)}p()})");
  await check(win,`window.__state.inspectionSubject.blockId==='O-02'&&window.__state.inspectionSubject.fragmentPath==='tiers[0]'&&window.__readingNavigation.size===${depth+1}`,'Receipt itself is keyboard action, one inspection '+keyCode);
  await exec(win,'window.__readingNavigation.back()');await settle(win);
  await check(win,"document.activeElement.matches('.rung[data-fragment-path=\"tiers[0]\"]')&&document.activeElement.checkVisibility()",'Receipt Back restores actual element focus');
 }
 await exec(win,"document.querySelector('.rung[data-fragment-path=\"tiers[0]\"] .rung-tag').click()");
 await exec(win,"new Promise((r,j)=>{const stop=Date.now()+4000;function p(){if(window.__state.inspectionSubject?.fragmentPath==='tiers[0]')return r();if(Date.now()>stop)return j(Error('Receipt click'));requestAnimationFrame(p)}p()})");
 await check(win,"window.__state.inspectionSubject.blockId==='O-02'",'Receipt label mouse click opens same fragment');await exec(win,'window.__readingNavigation.back();window.__readingNavigation.back()');
 const matrix=await exec(win,"window.__state.l2ViewModel.sections.flatMap(s=>s.blocks).find(b=>b.content?.type==='matrix'&&b.fragmentEntries.some(f=>f.path.startsWith('rows[')&&f.sourceUnitIds.length))?.id");
 if(matrix){
  await exec(win,`window.__readingNavigation.resolve({kind:'block',id:${JSON.stringify(matrix)}})`);
  for(const keyCode of ['Enter','Space']){
   const path=await exec(win,"(()=>{const b=document.querySelector('td .l2-cell-inspect[data-fragment-path]');b.focus();return b.dataset.fragmentPath;})()");const depth=await exec(win,'window.__readingNavigation.size');await key(win,keyCode);
   await exec(win,`new Promise((r,j)=>{const stop=Date.now()+4000;function p(){if(window.__state.inspectionSubject?.fragmentPath===${JSON.stringify(path)})return r();if(Date.now()>stop)return j(Error('matrix inspection'));requestAnimationFrame(p)}p()})`);
   await check(win,`window.__readingNavigation.size===${depth+1}&&window.__state.inspectionSubject.blockId===${JSON.stringify(matrix)}&&Boolean(document.querySelector('tbody tr td'))`,'native table cell keeps table, one inspection '+keyCode);
   await exec(win,'window.__readingNavigation.back()');await settle(win);await check(win,"document.activeElement.matches('td .l2-cell-inspect')&&document.activeElement.checkVisibility()",'table cell Back restores actual native button');
  }
  await exec(win,'window.__readingNavigation.back()');
 }
 if(await exec(win,'Boolean(window.__state.l0ViewModel)')){
  await exec(win,"document.querySelector('[data-panel-tab-button=topics]').click();document.querySelector('[data-enter-topic=\"T-02\"]').click();document.querySelector('[data-l1-node]').click();document.querySelector('.l1-workspace').scrollIntoView({block:'start'});document.getElementById('l1-tab-meaning').focus()");
  await key(win,'ArrowRight');
  await check(win,"document.activeElement.id==='l1-tab-related'&&document.getElementById('l1-related').checkVisibility()&&document.getElementById('l1-meaning').hidden&&document.querySelectorAll('.l1-workspace ~ .l1-blocks').length===0",'native related tab occupies same pane, no bottom duplicate');
  await exec(win,"document.querySelector('[data-l1-relation-button]').click()");
  await check(win,"L1TopicView.getDetailState(document.getElementById('main')).tab==='meaning'",'selection switches to meaning');
  await exec(win,"document.getElementById('l1-tab-related').click();document.querySelector('[data-l1-block=\"O-04\"]').focus()");await key(win,'Enter');
  await check(win,"window.__state.view==='l2'&&window.__state.readingTopicId==='T-02'&&document.querySelector('.l2-heading').textContent.includes('生成链路与消费点')",'native L1 related to standalone L2 with origin');
  await exec(win,"document.querySelector('.l2-context').open=true;document.querySelector('[data-inspect-block]').focus()");
  const reading=await exec(win,"({top:document.getElementById('main').scrollTop,block:window.__state.readingBlockId})");
  await exec(win,"window.__openInspection(window.__state.readingBlockId)");await settle(win);
  await check(win,"Boolean(window.__state.inspectionSubject)&&document.getElementById('source-body').dataset.claimVerification==='absent'",'L2 Block to actual L3 preserves no-verification');
  await exec(win,'window.__readingNavigation.back()');await settle(win);
  await check(win,`window.__state.view==='l2'&&document.querySelector('.l2-context').open&&document.activeElement.hasAttribute('data-inspect-block')&&document.getElementById('main').scrollTop===${reading.top}`,'L3 Back restores independent L2 context/focus/scroll');
  const fragment=await exec(win,"document.querySelector('.l2-page [data-fragment-path]')?.dataset.fragmentPath");
  if(fragment){await exec(win,"document.querySelector('.l2-page [data-fragment-path]').focus();document.querySelector('.l2-page [data-fragment-path]').click()");await settle(win);await check(win,`window.__state.inspectionSubject.fragmentPath===${JSON.stringify(fragment)}`,'fragment enters same parent L3');await exec(win,'window.__readingNavigation.back()');await settle(win);await check(win,"document.activeElement.hasAttribute('data-fragment-path')&&document.querySelector('.l2-context').open",'fragment Back restores focus/context');}
  await exec(win,"document.getElementById('btn-explore').focus();document.getElementById('btn-explore').click();document.getElementById('explore-back-reading').click()");await settle(win);
  await check(win,"window.__state.view==='l2'&&document.querySelector('.l2-context').open&&document.activeElement.id==='btn-explore'",'Explore Back restores standalone L2');
  await exec(win,"document.getElementById('reading-back').click()");await settle(win);
  await check(win,"window.__state.view==='l1'&&L1TopicView.getDetailState(document.getElementById('main')).tab==='related'&&document.activeElement.dataset.l1Block==='O-04'&&document.activeElement.checkVisibility()&&L1TopicView.getSelection(document.getElementById('main')).kind==='relation'",'L2 Back restores L1 tab, relation, visible focus');
  await exec(win,"document.getElementById('l1-back').click()");
 }
 return 'F24 independent L2: all 21 expressions retain exact content, one Plan subject, native L1 tabs, Block/fragment L3 and Explore Back passed';
}
async function runL2Integration(win){
 const parent=path.resolve('workspace/tmp/tests');await fs.mkdir(parent,{recursive:true});const root=await fs.mkdtemp(path.join(parent,'f24-view-')),old=win.getContentSize(),oldZoom=win.webContents.getZoomFactor();
 const record=process.argv.includes('--record-l2-evidence'),out=path.resolve('docs/log/artifacts/F24-l2-block-reading-view');
 async function size(w,h){win.setContentSize(w,h);await exec(win,`new Promise((r,j)=>{const stop=Date.now()+3000;function p(){if(innerWidth===${w}&&innerHeight===${h})return requestAnimationFrame(r);if(Date.now()>stop)return j(Error('F24 resize'));requestAnimationFrame(p)}p()})`);}
 async function shot(name){if(!record)return;await exec(win,"document.querySelector('.toast')?.remove()");await settle(win);const capture=await win.webContents.capturePage();assert.deepEqual(capture.getSize(),await exec(win,'({width:innerWidth,height:innerHeight})'));await fs.writeFile(path.join(out,name),capture.toPNG());}
 try{
  win.webContents.setZoomFactor(1);
  const fixture=await exportReadingBundle({source:path.resolve('samples/context-consumption/source.md'),design:path.resolve('samples/context-consumption/design-review.json'),plan:path.resolve('samples/context-consumption/overview-plan.json'),generated:path.resolve('artifacts/experiments/stage2-full/overview.generated.json'),map:path.resolve('samples/context-consumption/framework-map.reading.json'),out:path.join(root,'analysis'),analysisId:'f24-test'});
  const loaded=await exec(win,`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(fixture.manifestPath)})`);assert.equal(loaded.ok,true);
  await size(1280,900);const report=await exerciseL2(win);
  await exec(win,"document.querySelector('[data-enter-topic=\"T-02\"]').click();document.querySelector('[data-l1-relation-button]').click();document.getElementById('l1-tab-related').click();document.querySelector('.l1-workspace').scrollIntoView({block:'start'})");await shot('l1-related-desktop.png');
  await exec(win,"document.querySelector('[data-l1-block=\"O-04\"]').click()");await shot('l2-flow-desktop.png');await exec(win,'window.__readingNavigation.back();window.__readingNavigation.back()');
  await exec(win,"window.__readingNavigation.resolve({kind:'block',id:'O-04b'})");await shot('l2-contrast-desktop.png');await exec(win,'window.__readingNavigation.back()');
  await exec(win,"window.__readingNavigation.resolve({kind:'block',id:'O-02'})");await shot('l2-concepts-desktop.png');await exec(win,'window.__readingNavigation.back()');
  await size(640,720);await exerciseL2(win);await exec(win,"document.querySelector('[data-enter-topic=\"T-02\"]').click();document.getElementById('l1-tab-related').click();document.querySelector('.l1-workspace').scrollIntoView({block:'start'})");await shot('l1-related-narrow.png');await exec(win,"document.querySelector('[data-l1-block=\"O-04\"]').click()");await shot('l2-flow-narrow.png');
  await check(win,"innerWidth===640&&innerHeight===720&&document.documentElement.scrollWidth<=innerWidth&&document.querySelectorAll('#main section.block').length===1",'narrow page fits one subject');await exec(win,'window.__readingNavigation.back();window.__readingNavigation.back()');
  await exec(win,"window.__readingNavigation.resolve({kind:'block',id:'O-02'})");await shot('l2-concepts-narrow.png');await exec(win,'window.__readingNavigation.back()');
  const options={source:path.resolve('samples/context-consumption/source.md'),design:path.resolve('samples/context-consumption/design-review.json'),plan:path.resolve('samples/context-consumption/overview-plan.json')};
  const map=JSON.parse(await fs.readFile('samples/context-consumption/framework-map.json','utf8'));map.topics.forEach(t=>t.blockIds=[]);const mapPath=path.join(root,'empty-map.json');await fs.writeFile(mapPath,JSON.stringify(map));
  const unknown=await exportReadingBundle({...options,map:mapPath,out:path.join(root,'unknown'),analysisId:'f24-unknown'});
  const unknownLoad=await exec(win,`window.__loadBundle(${JSON.stringify(unknown.manifestPath)})`);assert.equal(unknownLoad.ok,true);
  await exec(win,"window.__readingNavigation.resolve({kind:'block',id:'O-01'})");
  await check(win,"document.querySelectorAll('#main section.block').length===1&&document.querySelector('.block-body').textContent.includes('尚未提供生成资料')&&document.querySelector('.l2-context').textContent.includes('已明确没有主题关联')&&document.querySelector('[data-inspect-block]')!==null",'real bundle unknown expression and Known(0) keep identity/inspection');
  await exec(win,"window.__openInspection('O-01')");await settle(win);await check(win,"document.querySelector('[data-source-unit-id] button')!==null",'missing expression still has real planning source path');await exec(win,'window.__readingNavigation.back();window.__readingNavigation.back()');
  const generated=JSON.parse(await fs.readFile('artifacts/experiments/stage2-full/overview.generated.json','utf8'));generated.blocks=generated.blocks.filter(b=>b.id!=='O-01');const generatedPath=path.join(root,'partial-generated.json');await fs.writeFile(generatedPath,JSON.stringify(generated));
  const missing=await exportReadingBundle({...options,generated:generatedPath,out:path.join(root,'missing'),analysisId:'f24-missing'});
  const missingLoad=await exec(win,`window.__loadBundle(${JSON.stringify(missing.manifestPath)})`);assert.equal(missingLoad.ok,true);
  await exec(win,"document.querySelector('[data-open-block=\"O-01\"]').focus()");await key(win,'Enter');
  await check(win,"window.__state.view==='l2'&&document.querySelector('.block-body').textContent.includes('缺少生成表达')&&document.querySelector('.l2-context').textContent.includes('主题关联尚未完整提供')&&window.__state.readingTopicId===null",'real no-Map bundle exposes independent entry and missing differs from unknown');
  await exec(win,'window.__readingNavigation.back()');await check(win,"document.activeElement.dataset.openBlock==='O-01'&&document.activeElement.checkVisibility()",'independent fallback entry Back restores focus');
  assert.equal((await fs.readdir(path.join(root,'analysis'))).includes('human-review.json'),false);
  return report+'; 640x720, missing/unknown/empty occurrence and no auto-save passed';
 }finally{win.webContents.setZoomFactor(oldZoom);win.setContentSize(...old);assert.ok(path.resolve(root).startsWith(parent+path.sep)&&path.basename(root).startsWith('f24-view-'));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={exerciseL2,runL2Integration};
