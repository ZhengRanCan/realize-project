#!/usr/bin/env node
'use strict';
const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

const fs=require('node:fs/promises'),path=require('node:path');
const {prepareReadingSession}=require('../app/main/reading-session');
const {projectReadingBundle}=require('../app/shared/reading-projection');
const {projectL3}=require('../app/shared/l3-inspector-projection');
const {buildSourceRegistry,resolveSourceCoordinate,sha256}=require('../app/shared/source-coordinates');
const {validateBundleData}=require('../app/shared/reading-bundle-validation');
const semantics=require('../app/shared/semantics');
const ROOT=resolveRepositoryPath(__dirname,'..');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const safeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
async function legacySnapshot(options) {
 const planPath=resolveRepositoryPath(options.plan||joinRepositoryPath(ROOT,'samples/context-consumption/overview-plan.json'));
 const input={designReview:await json(resolveRepositoryPath(options.design||joinRepositoryPath(ROOT,'samples/context-consumption/design-review.json'))),plan:await json(planPath),generated:await json(resolveRepositoryPath(options.overview||joinRepositoryPath(ROOT,'experiments/stage2-full/overview.generated.json')))};
 const old=await json(resolveRepositoryPath(options.rows||joinRepositoryPath(ROOT,'samples/context-consumption/source-sections.json')));
 input.sourceText=await fs.readFile(resolveRepositoryPath(ROOT,old.document.path),'utf8');input.sourceSections=buildSourceRegistry(input.sourceText,{sourcePath:old.document.path});input.planSha256=sha256(await fs.readFile(planPath));
 input.manifest={bundleVersion:1,analysisId:'legacy-preview',bindings:{designReviewId:input.designReview.design.id},files:{}};
 for(const [key,name]of Object.entries({source:'source.md',sourceSections:'source-sections.json',designReview:'design-review.json',plan:'overview-plan.json',generated:'overview.generated.json'})) input.manifest.files[key]={path:name,sha256:sha256(key==='source'?input.sourceText:JSON.stringify(input[key]))};
 const check=validateBundleData(input);if(check.errors.length)throw new Error(check.errors.join('\n'));input.reports=check.reports;
 const humanReview=semantics.buildHumanReviewSkeleton(input.designReview);
 return {bundle:input,loadResult:{ok:true,errors:[],warnings:check.warnings,...projectReadingBundle(input),model:input.designReview,modelPath:'(preview)',humanReviewPath:'(preview)',humanReviewExists:false,humanReview,sessionToken:'legacy-preview',bundleInfo:{analysisId:'legacy-preview',manifestPath:'(preview)',hasMap:false}}};
}
async function buildPreview(options={}) {
 let session;
 if(options.bundle){const prepared=await prepareReadingSession(options.bundle);if(!prepared.ok)throw new Error(prepared.errors.join('\n'));session=prepared.session;}
 else session=await legacySnapshot(options);
 const loadResult=session.loadResult,input=session.bundle;
 const inspections={};
 for(const block of loadResult.l2ViewModel.sections.flatMap(s=>s.blocks)) {
  inspections[block.id]={parent:projectL3({blockId:block.id},input),fragments:{}};
  for(const fragment of block.fragmentEntries) inspections[block.id].fragments[fragment.path]=projectL3({blockId:block.id,fragmentPath:fragment.path},input);
 }
 const coordinates={'plan-section':{},heading:{}};
 for(const [namespace,list,key]of [['plan-section',input.sourceSections.sections,'label'],['heading',input.sourceSections.headings,'key']])for(const entry of list)coordinates[namespace][entry[key]]=input.reports.sourceIntegrity==='consistent'?resolveSourceCoordinate(input.sourceSections,{namespace,key:entry[key]}):{state:'unavailable',reason:'来源坐标漂移'};
 let html=await fs.readFile(joinRepositoryPath(ROOT,'app/renderer/index.html'),'utf8');
 html=html.replace(/<meta http-equiv="Content-Security-Policy"[\s\S]*?\/>/,'');
 for(const css of ['styles.css','l0-map.css']) {const styles=await fs.readFile(joinRepositoryPath(ROOT,'app/renderer',css),'utf8');html=html.replace(`<link rel="stylesheet" href="${css}" />`,()=>`<style>${styles}</style>`);}
 const snapshot={loadResult,inspections,coordinates};
 const shim=`<script>
window.__PREVIEW__=${safeJSON(snapshot)};
const snapshot=window.__PREVIEW__;
const unavailable=async()=>({ok:false,errors:['静态预览不支持此操作']});
const valid=payload=>payload.sessionToken===snapshot.loadResult.sessionToken;
window.designReview={paths:async()=>({defaultFixture:'(preview)'}),loadFixture:async()=>snapshot.loadResult,loadDesignPath:async()=>snapshot.loadResult,
 openDesignJson:unavailable,openMarkdown:unavailable,readDefaultMarkdown:unavailable,saveHumanReview:unavailable,saveDesignJson:unavailable,revealHumanReview:unavailable,evaluateGate:unavailable,
 loadSource:unavailable,
 bundle:{loadPath:async()=>({ok:true,requestToken:1,loadResult:snapshot.loadResult}),open:unavailable,commit:async()=>({ok:true,loadResult:snapshot.loadResult}),discard:async()=>({ok:true}),
 inspect:async payload=>{if(!valid(payload)||!Object.hasOwn(snapshot.inspections,payload.blockId))return {ok:false,errors:['来源请求无效']};const item=snapshot.inspections[payload.blockId];const vm=payload.fragmentPath===undefined?item.parent:Object.hasOwn(item.fragments,payload.fragmentPath)?item.fragments[payload.fragmentPath]:null;return vm?{ok:true,sessionToken:payload.sessionToken,viewModel:vm}:{ok:false,errors:['片段请求无效']};},
 source:async payload=>{if(!valid(payload))return {ok:false,errors:['来源请求无效']};const list=snapshot.coordinates[payload.namespace];return {ok:true,sessionToken:payload.sessionToken,coordinate:list&&Object.hasOwn(list,payload.key)?list[payload.key]:{state:'unknown',reason:'来源空间无法解析'},integrity:'snapshot'};}}
};
</script>`;
 html=html.replace('<script src="vendor/mermaid.min.js"></script>',()=>shim+'\n<script src="vendor/mermaid.min.js"></script>');
 const scripts=['vendor/mermaid.min.js','../shared/semantics.js','../shared/reading-navigation.js','reading-navigation.js','../shared/explore-projection.js','explore.js','l0-layout.js','l0-map.js','l1-topic-view.js','l3-inspector.js','app.js'];
 for(const file of scripts){const code=await fs.readFile(resolveRepositoryPath(ROOT,'app/renderer',file),'utf8');html=html.replace(`<script src="${file}"></script>`,()=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`);}
 html=html.replace(/<\/body>\s*<\/html>\s*$/,()=>`<script>window.__applyLoadResult(window.__PREVIEW__.loadResult);document.getElementById('btn-save').disabled=true;document.getElementById('btn-save').textContent='静态预览 · 审核保存不可用';</script>\n</body></html>`);
 const out=resolveRepositoryPath(options.out||repositoryPath('workspace/previews/overview.html'));await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,html,'utf8');return {out,blocks:input.plan.blocks.length};
}
function parseArgs(argv){const args={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--')||!argv[i+1])throw new Error('参数必须为 --name value');args[argv[i].slice(2)]=argv[++i];}return args;}
module.exports={buildPreview};
if(require.main===module)buildPreview(parseArgs(process.argv.slice(2))).then(r=>console.log(`Preview: ${r.out} (${r.blocks} blocks)`)).catch(e=>{console.error(e.message);process.exitCode=1;});
