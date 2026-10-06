'use strict';
const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {buildSourceRegistry,sha256}=require('../app/shared/source-coordinates');
function holdNextRead(target,skip=0) {
 const original=fs.readFile;let notify,release,held=false;
 const blocked=new Promise(resolve=>notify=resolve),gate=new Promise(resolve=>release=resolve);
 fs.readFile=async(file,...args)=>{
  if(!held && resolveRepositoryPath(String(file))===resolveRepositoryPath(target)){if(skip>0)skip--;else{held=true;notify();await gate;}}
  return original(file,...args);
 };
 return {blocked,release,restore(){release();fs.readFile=original;}};
}
async function runBundleIntegration(win) {
 const root=await fs.mkdtemp(joinRepositoryPath(os.tmpdir(),'reading-electron-'));
 const execute=code=>win.webContents.executeJavaScript(code);
 try {
  const a=await makeBundleFixture(joinRepositoryPath(root,'a')),b=await makeBundleFixture(joinRepositoryPath(root,'b'));
  const loaded=await execute(`window.__state.dirty=false;window.__loadBundle(${JSON.stringify(a.manifestPath)})`);assert.equal(loaded.ok,true);
  const pathResult=await execute(`(async()=>{
   const check=(condition,message)=>{if(!condition)throw new Error(message);};
   check(window.__state.view==='l0','default Map');
   const topic=Object.values(window.__state.l1Topics).find(t=>t.blockEntries?.length);check(topic,'known Topic');
   document.querySelector('[data-enter-topic="'+topic.topic.id+'"]').click();check(window.__state.view==='l1','Topic click');
   document.querySelector('[data-l1-tab=related]').click();check(document.querySelector('#l1-related').checkVisibility(),'related panel visible');
   const button=document.querySelector('[data-l1-block]');button.click();check(window.__state.view==='l2','Block click');
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
  // An omitted early edge must not shift the provenance button onto a later edge.
  assert.equal(await execute(`(()=>{
   const host=contentFlow({lanes:[{label:'test',nodes:[{node:{title:'one'}},{node:{title:'two'},edge:{note:'edge two'}},{node:{title:'three'},edge:{note:'edge three'}}]}]});
   bindFragmentInspection(host,{id:'O-01',fragmentEntries:[{path:'lanes[0].nodes[1].edge',kind:'edge',sourceUnitIds:['SU-001']}]});
   const button=host.querySelector('[data-fragment-path]');return button?.closest('.fedge').dataset.nodeIndex==='1'&&button.closest('.fedge').textContent.includes('edge two');
  })()`),true);
  win.focus();win.webContents.focus();
  await execute(`window.__openInspection(${JSON.stringify(pathResult.id)})`);
  await execute("document.getElementById('l3-close').focus()");
  await new Promise(r=>setTimeout(r,150));
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});win.webContents.sendInputEvent({type:'char',keyCode:'\r'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});
  await new Promise(r=>setTimeout(r,80));assert.equal(await execute('Boolean(window.__state.inspectionOrigin)'),false);
  await execute(`document.querySelector('[data-inspect-block="${pathResult.id}"]').focus()`);
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});
  await new Promise(r=>setTimeout(r,80));assert.equal(await execute('Boolean(window.__state.inspectionOrigin)'),true);
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
  await new Promise(r=>setTimeout(r,80));assert.equal(await execute('Boolean(window.__state.inspectionOrigin)'),false);
  // A genuine second document snapshot using the same SU/section labels.
  const dir=path.dirname(b.manifestPath),manifest=JSON.parse(await fs.readFile(b.manifestPath,'utf8'));
  const sourceText=(await fs.readFile(joinRepositoryPath(dir,'source.md'),'utf8'))+'\n第二份文档专属内容 B\n';
  const review=JSON.parse(await fs.readFile(joinRepositoryPath(dir,'design-review.json'),'utf8'));review.design.id='DESIGN-B';review.design.title='第二份文档 B';
  const plan=JSON.parse(await fs.readFile(joinRepositoryPath(dir,'overview-plan.json'),'utf8'));plan.designRef.id='DESIGN-B';const planText=JSON.stringify(plan,null,2)+'\n';
  const generated=JSON.parse(await fs.readFile(joinRepositoryPath(dir,'overview.generated.json'),'utf8'));generated.document.id='DESIGN-B';generated.generation.planSha256=sha256(planText).slice(0,16);
  const data={source:sourceText,sourceSections:JSON.stringify(buildSourceRegistry(sourceText,{sourcePath:'source.md'})),designReview:JSON.stringify(review),plan:planText,generated:JSON.stringify(generated)};
  for(const [key,text]of Object.entries(data)){await fs.writeFile(joinRepositoryPath(dir,manifest.files[key].path),text);manifest.files[key].sha256=sha256(text);}
  manifest.bindings.designReviewId='DESIGN-B';manifest.analysisId='document-b';await fs.writeFile(b.manifestPath,JSON.stringify(manifest));
  const result=await execute(`(async()=>{
   const oldToken=window.__state.sessionToken;
   await window.__loadBundle(${JSON.stringify(b.manifestPath)});
   if(window.__state.model.design.id!=='DESIGN-B')throw new Error('cross document');
   const old=await window.designReview.bundle.inspect({sessionToken:oldToken,blockId:'O-01'});if(old.ok)throw new Error('stale inspection');
   window.__state.dirty=true;window.__state.humanReview.decisions['DEC-001'].comment='未保存内容';
   const bad=await window.__loadBundle(${JSON.stringify(joinRepositoryPath(root,'missing'))});
   if(bad.ok || !window.__state.dirty || window.__state.humanReview.decisions['DEC-001'].comment!=='未保存内容')throw new Error('failed load preserved');
   const original=window.confirm;window.confirm=()=>false;const canceled=await window.__loadBundle(${JSON.stringify(a.manifestPath)});window.confirm=original;
   if(!canceled.canceled || window.__state.model.design.id!=='DESIGN-B' || !window.__state.dirty)throw new Error('canceled switch');
   const current=await window.designReview.bundle.inspect({sessionToken:window.__state.sessionToken,blockId:'O-01'});if(!current.ok)throw new Error('main/render divergence');
   return {token:window.__state.sessionToken};
  })()`);assert.notEqual(result.token,pathResult.token);
  // A late Source reply must not close a newer inspector in this same session.
  const slowSource=holdNextRead(joinRepositoryPath(dir,'source.md'));
  try {
   await execute("window.__state.dirty=false;window.__slowSource=openSource('§0');true");await slowSource.blocked;
   await execute("window.__openInspection('O-01')");slowSource.release();await execute('window.__slowSource');
   assert.equal(await execute("Boolean(window.__state.inspectionOrigin)&&document.getElementById('source-body').dataset.blockId==='O-01'"),true);
   await execute('window.__closeInspection()');
  }finally{slowSource.restore();}
  // Within one inspector, only the most recently selected SU may set the coordinate.
  const multi=plan.blocks.find(block=>new Set(block.covers.map(id=>plan.sourceUnits.find(u=>u.id===id).section)).size>1);
  assert.ok(multi);await execute(`window.__openInspection(${JSON.stringify(multi.id)})`);
  const selectedSections=await execute("Array.from(new Set(Array.from(document.querySelectorAll('[data-source-unit-id] button')).map(b=>b.dataset.section))).slice(0,2)");
  const secondText=buildSourceRegistry(sourceText).sections.find(s=>s.label===selectedSections[1]).text;
  const slowCoordinate=holdNextRead(joinRepositoryPath(dir,'source.md'));
  try {
   await execute(`document.querySelector('[data-source-unit-id] button[data-section="${selectedSections[0]}"]').click();true`);await slowCoordinate.blocked;
   await execute(`new Promise((resolve,reject)=>{
    const host=document.getElementById('l3-source-coordinate'),expected=${JSON.stringify(secondText)};
    const timeout=setTimeout(()=>{observer.disconnect();reject(new Error('second SU coordinate timeout'));},2000);
    const observer=new MutationObserver(()=>{if(host.querySelector('pre')?.textContent===expected){clearTimeout(timeout);observer.disconnect();resolve(true);}});
    observer.observe(host,{childList:true,subtree:true});document.querySelector('[data-source-unit-id] button[data-section="${selectedSections[1]}"]').click();
   })`);
   slowCoordinate.release();await new Promise(r=>setTimeout(r,100));
   assert.equal(await execute("document.querySelector('#l3-source-coordinate pre').textContent"),secondText);
   await execute('window.__closeInspection()');
  }finally{slowCoordinate.restore();}
  // Every load entry uses the same main-process epoch, including legacy Review.
  const slowLegacy=holdNextRead(a.inputs.design);
  try {
   await execute('window.__slowLegacy=window.designReview.loadFixture();true');await slowLegacy.blocked;
   assert.equal((await execute(`window.__loadBundle(${JSON.stringify(b.manifestPath)})`)).ok,true);
   slowLegacy.release();assert.equal((await execute('window.__slowLegacy')).stage,'stale');
   assert.equal((await execute("window.designReview.bundle.inspect({sessionToken:window.__state.sessionToken,blockId:'O-01'})")).ok,true);
  }finally{slowLegacy.restore();}
  // Opening an independent Map clears both main and renderer bundle context.
  const previousToken=await execute('window.__state.sessionToken');
  await execute(`loadL0(${JSON.stringify(a.inputs.map)})`);
  assert.equal(await execute('window.__state.sessionToken===null&&window.__state.model===null&&window.__state.l2ViewModel===null&&window.__state.bundleInfo===null'),true);
  assert.equal(await execute("document.querySelector('[data-enter-topic]').click();window.__state.view==='l1'&&Boolean(document.querySelector('[data-l1-topic]'))"),true);
  assert.equal((await execute(`window.designReview.bundle.inspect({sessionToken:${JSON.stringify(previousToken)},blockId:'O-01'})`)).ok,false);
  assert.equal((await execute('window.designReview.loadSource()')).ok,false);
  await execute("openSource('§0')");
  assert.equal(await execute("Boolean(document.querySelector('#source-body .error-box'))"),true);
  assert.equal((await execute(`window.__loadBundle(${JSON.stringify(b.manifestPath)})`)).ok,true);
  for(const fixture of [a,b]) await assert.rejects(fs.access(joinRepositoryPath(path.dirname(fixture.manifestPath),'human-review.json')));
  await fs.appendFile(joinRepositoryPath(dir,'source.md'),'drift');
  const drift=await execute(`window.designReview.bundle.source({sessionToken:window.__state.sessionToken,namespace:'plan-section',key:'§0'})`);assert.equal(drift.coordinate.state,'unavailable');
  return '真实资料包 → Map → Topic → Block → SU/section 与独立 Evidence；fragment/返回/跨文档/取消/旧加载与 Source 回复/独立 Map 隔离/漂移/无自动保存均通过';
 }finally{assert.ok(resolveRepositoryPath(root).startsWith(resolveRepositoryPath(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
module.exports={runBundleIntegration,holdNextRead};
