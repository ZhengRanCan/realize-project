'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {readReadingBundle,resolveBundleFile}=require('./reading-bundle');
const {projectReadingBundle}=require('../shared/reading-projection');
const {buildL0ViewModel}=require('../../scripts/l0-view-model');
const semantics=require('../shared/semantics');
async function prepareReadingSession(manifestPath) {
 const result=await readReadingBundle(manifestPath);if(!result.ok) return result;
 try {
  const bundle=result.bundle,model=bundle.designReview;
  const humanReviewPath=path.join(bundle.root,'human-review.json');let humanReview=semantics.buildHumanReviewSkeleton(model),humanReviewExists=false;
  try {
   const file=await resolveBundleFile(bundle.root,'human-review.json');
   if((await fs.lstat(humanReviewPath)).isSymbolicLink()) throw new Error('human-review 不允许链接文件');
   const saved=JSON.parse(await fs.readFile(file,'utf8'));
   if(saved.designId!==model.design.id) throw new Error('human-review designId 与当前资料包不一致');
   for(const key of ['decisions','openQuestions','gaps']) if(saved[key]!==undefined && (typeof saved[key]!=='object' || saved[key]===null || Array.isArray(saved[key]))) throw new Error(`human-review ${key} 结构无效`);
   humanReview={...humanReview,...saved};const skeleton=semantics.buildHumanReviewSkeleton(model);
   for(const key of ['decisions','openQuestions','gaps']) humanReview[key]={...skeleton[key],...(saved[key]||{})};humanReviewExists=true;
  }catch(e){if(e.code!=='ENOENT') throw e;}
  const projection=projectReadingBundle(bundle),sessionToken=randomUUID();
  const l0ViewModel=bundle.frameworkMap?buildL0ViewModel(bundle.frameworkMap,{knownRoles:require('../../schema/framework-map.schema.json').$defs.element.properties.role['x-known-roles'],guideContext:{sourceSections:bundle.sourceSections,sourceIntegrity:bundle.reports.sourceIntegrity,sourceSha256:bundle.sourceSha256}}):null;
  const loadResult={ok:true,errors:[],warnings:result.warnings,sessionToken,bundleInfo:{analysisId:bundle.manifest.analysisId,manifestPath:bundle.manifestPath,hasMap:Boolean(l0ViewModel)},l0ViewModel,...projection,model,modelPath:bundle.paths.designReview,humanReviewPath,humanReview,humanReviewExists,gate:semantics.evaluateGate(model,humanReview),summary:semantics.reviewSummary(model,humanReview)};
  return {ok:true,errors:[],warnings:result.warnings,session:{...loadResult,bundle,loadResult}};
 }catch(e){return {ok:false,stage:'session',errors:[e.message],warnings:[]};}
}
function createReadingSessionController({prepare=prepareReadingSession}={}) {
 let request=0,pending=null,current=null;
 return {
  async prepare(file) {
   const token=++request;pending=null;
   const result=await prepare(file);
   if(token!==request) return {ok:false,requestToken:token,stage:'stale',errors:['资料包请求已过期'],warnings:[]};
   if(result.ok) pending={token,session:result.session};
   return {...result,session:undefined,requestToken:token,loadResult:result.session?.loadResult};
  },
  commit(token){if(!pending || pending.token!==token || token!==request) return {ok:false,reason:'stale',errors:['资料包请求已过期']};current=pending.session;pending=null;return {ok:true,loadResult:current.loadResult};},
  discard(token){if(pending?.token===token) pending=null;},
  invalidate(){request++;pending=null;},
  current(){return current;},
  reset(){request++;pending=null;current=null;},
 };
}
async function sourceIntegrity(session) {
 const {sha256}=require('../shared/source-coordinates');
 try {
  for(const key of ['source','sourceSections']) {
   const file=await resolveBundleFile(session.bundle.root,session.bundle.manifest.files[key].path);
   if(file!==session.bundle.paths[key] || sha256(await fs.readFile(file))!==session.bundle.manifest.files[key].sha256) return 'drifted';
  }
  return session.bundle.reports.sourceIntegrity;
 }catch{return 'unavailable';}
}
async function inspectReadingSession(session,subject) {
 if(!session || subject.sessionToken!==session.sessionToken) return {ok:false,errors:['资料包 session 已过期']};
 try {
  const integrity=await sourceIntegrity(session);
  const input={...session.bundle,reports:{...session.bundle.reports,sourceIntegrity:integrity==='consistent'?'consistent':'drifted'}};
  const viewModel=require('../shared/l3-inspector-projection').projectL3(subject,input);
  return {ok:true,sessionToken:session.sessionToken,viewModel,integrity};
 }catch(e){return {ok:false,sessionToken:session.sessionToken,errors:[e.message]};}
}
async function sourceReadingSession(session,subject) {
 if(!session || subject.sessionToken!==session.sessionToken) return {ok:false,errors:['资料包 session 已过期']};
 const integrity=await sourceIntegrity(session);
 const coordinate=integrity==='consistent'?require('../shared/source-coordinates').resolveSourceCoordinate(session.bundle.sourceSections,subject):{state:'unavailable',namespace:subject.namespace,key:subject.key,reason:'原文坐标已漂移或不可用，请重新导出资料包'};
 return {ok:true,sessionToken:session.sessionToken,coordinate,integrity};
}
module.exports={prepareReadingSession,createReadingSessionController,inspectReadingSession,sourceReadingSession,sourceIntegrity};
