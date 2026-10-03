'use strict';
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {buildSourceRegistry,sha256}=require('../app/shared/source-coordinates');
async function runBundleIntegration(win) {
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'reading-electron-'));
 const execute=code=>win.webContents.executeJavaScript(code);
 try {
  const a=await makeBundleFixture(path.join(root,'a')),b=await makeBundleFixture(path.join(root,'b'));
  const loaded=await execute(`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(a.manifestPath)})`);assert.equal(loaded.ok,true);
  const pathResult=await execute(`(async()=>{
   const check=(condition,message)=>{if(!condition)throw new Error(message);};
   check(window.__state.view==='l0','default Map');
   const topic=Object.values(window.__state.l1Topics).find(t=>t.blockEntries?.length);check(topic,'known Topic');
   document.querySelector('.topic-entry[data-topic-focus="'+topic.topic.id+'"]').click();check(window.__state.view==='l1','Topic click');
   const button=document.querySelector('[data-l1-block]');button.click();check(window.__state.view==='overview','Block click');
   const id=button.dataset.l1Block;
   const before=document.getElementById('main').scrollTop;
   document.querySelector('[data-inspect-block="'+id+'"]').click();
   await new Promise(r=>setTimeout(r,100));
   check(document.getElementById('source-body').dataset.claimVerification==='absent','claim carrier');
   const source=document.querySelector('[data-source-unit-id] button');check(source,'SU entry');source.click();await new Promise(r=>setTimeout(r,100));
   check(document.querySelector('#l3-source-coordinate').dataset.coordinateState==='known','section range');
   const sectionText=document.querySelector('#l3-source-coordinate pre').textContent;
   const object=document.querySelector('#source-body details[data-review-object-id]');check(object,'review object');object.open=true;
   check(object.querySelector('.l3-evidence') || object.textContent.includes('没有 Evidence') || object.textContent.includes('没有 Evidence 字段'),'Evidence disclosure');
   document.getElementById('l3-close').click();check(!window.__state.inspectionOrigin,'close origin');check(document.getElementById('main').scrollTop===before,'scroll restore');
   const fragment=document.getElementById('block-'+id).querySelector('[data-fragment-path]');check(fragment,'visual fragment');fragment.focus();fragment.click();await new Promise(r=>setTimeout(r,100));
   check(document.getElementById('source-body').dataset.blockId===id,'fragment parent');check(!location.hash.includes('fragment'),'no fragment anchor');window.__closeInspection();
   return {id,sectionText,token:window.__state.sessionToken};
  })()`);
  assert.ok(pathResult.sectionText.length>20);
  // A genuine second document snapshot using the same SU/section labels.
  const dir=path.dirname(b.manifestPath),manifest=JSON.parse(await fs.readFile(b.manifestPath,'utf8'));
  const sourceText=(await fs.readFile(path.join(dir,'source.md'),'utf8'))+'\n第二份文档专属内容 B\n';
  const review=JSON.parse(await fs.readFile(path.join(dir,'design-review.json'),'utf8'));review.design.id='DESIGN-B';review.design.title='第二份文档 B';
  const plan=JSON.parse(await fs.readFile(path.join(dir,'overview-plan.json'),'utf8'));plan.designRef.id='DESIGN-B';const planText=JSON.stringify(plan,null,2)+'\n';
  const generated=JSON.parse(await fs.readFile(path.join(dir,'overview.generated.json'),'utf8'));generated.document.id='DESIGN-B';generated.generation.planSha256=sha256(planText).slice(0,16);
  const data={source:sourceText,sourceSections:JSON.stringify(buildSourceRegistry(sourceText,{sourcePath:'source.md'})),designReview:JSON.stringify(review),plan:planText,generated:JSON.stringify(generated)};
  for(const [key,text]of Object.entries(data)){await fs.writeFile(path.join(dir,manifest.files[key].path),text);manifest.files[key].sha256=sha256(text);}
  manifest.bindings.designReviewId='DESIGN-B';manifest.analysisId='document-b';await fs.writeFile(b.manifestPath,JSON.stringify(manifest));
  const result=await execute(`(async()=>{
   const oldToken=window.__state.sessionToken;
   await window.__loadBundle(${JSON.stringify(b.manifestPath)});
   if(window.__state.model.design.id!=='DESIGN-B')throw new Error('cross document');
   const old=await window.designReview.bundle.inspect({sessionToken:oldToken,blockId:'O-01'});if(old.ok)throw new Error('stale inspection');
   window.__state.dirty=true;window.__state.humanReview.decisions['DEC-001'].comment='未保存内容';
   const bad=await window.__loadBundle(${JSON.stringify(path.join(root,'missing'))});
   if(bad.ok || !window.__state.dirty || window.__state.humanReview.decisions['DEC-001'].comment!=='未保存内容')throw new Error('failed load preserved');
   const original=window.confirm;window.confirm=()=>false;const canceled=await window.__loadBundle(${JSON.stringify(a.manifestPath)});window.confirm=original;
   if(!canceled.canceled || window.__state.model.design.id!=='DESIGN-B' || !window.__state.dirty)throw new Error('canceled switch');
   const current=await window.designReview.bundle.inspect({sessionToken:window.__state.sessionToken,blockId:'O-01'});if(!current.ok)throw new Error('main/render divergence');
   return {token:window.__state.sessionToken};
  })()`);assert.notEqual(result.token,pathResult.token);
  for(const fixture of [a,b]) await assert.rejects(fs.access(path.join(path.dirname(fixture.manifestPath),'human-review.json')));
  await fs.appendFile(path.join(dir,'source.md'),'drift');
  const drift=await execute(`window.designReview.bundle.source({sessionToken:window.__state.sessionToken,namespace:'plan-section',key:'§0'})`);assert.equal(drift.coordinate.state,'unavailable');
  return '真实资料包 → Map → Topic → Block → SU/section 与独立 Evidence；fragment/返回/跨文档/取消/过期/漂移/无自动保存均通过';
 }finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={runBundleIntegration};
