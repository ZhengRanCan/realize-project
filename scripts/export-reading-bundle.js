'use strict';
const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

const fs=require('node:fs/promises'),path=require('node:path');
const {buildSourceRegistry,sha256}=require('../app/shared/source-coordinates');
const {readReadingBundle}=require('../app/main/reading-bundle');
const ROOT=resolveRepositoryPath(__dirname,'..');
const names={source:'source.md',design:'design-review.json',plan:'overview-plan.json',generated:'overview.generated.json',map:'framework-map.json'};
const keys={source:'source',design:'designReview',plan:'plan',generated:'generated',map:'frameworkMap'};
async function exportReadingBundle(options) {
 const out=resolveRepositoryPath(options.out),parent=path.dirname(out);
 if(!options.analysisId || !options.source || !options.design || !options.plan) throw new Error('必须显式提供 source / design / plan / analysis-id / out');
 await fs.mkdir(parent,{recursive:true});
 const lockPath=joinRepositoryPath(parent,`.${path.basename(out)}.bundle-lock`),lock=await fs.open(lockPath,'wx');
 let staging;
 try {
  try {await fs.access(out);throw new Error('输出目录已存在，拒绝覆盖');}catch(e){if(e.code!=='ENOENT') throw e;}
  staging=await fs.mkdtemp(joinRepositoryPath(parent,`.${path.basename(out)}-staging-`));
  const raw={},manifest={bundleVersion:1,analysisId:options.analysisId,bindings:{},files:{}};
  for(const [option,filename] of Object.entries(names)) if(options[option]) {
   raw[option]=await fs.readFile(resolveRepositoryPath(options[option]));
   await fs.writeFile(joinRepositoryPath(staging,filename),raw[option]);manifest.files[keys[option]]={path:filename,sha256:sha256(raw[option])};
  }
  const design=JSON.parse(raw.design),map=raw.map?JSON.parse(raw.map):null;
  manifest.bindings.designReviewId=design.design.id;
  if(map) {
   manifest.bindings.frameworkDocumentId=map.document.id;
   const declared=await fs.realpath(resolveRepositoryPath(ROOT,map.document.sourcePath));
   if(declared!==await fs.realpath(resolveRepositoryPath(options.source))) throw new Error('Map 声明原文与所选 source 不一致');
   for(const hash of [map.document.sourceSha256,map.meta?.sourceSha256]) if(hash && hash!==sha256(raw.source)) throw new Error('Map 原文 hash 不匹配');
  }
  const registry=Buffer.from(JSON.stringify(buildSourceRegistry(raw.source.toString('utf8'),{sourcePath:names.source}),null,2)+'\n');
  await fs.writeFile(joinRepositoryPath(staging,'source-sections.json'),registry);manifest.files.sourceSections={path:'source-sections.json',sha256:sha256(registry)};
  await fs.writeFile(joinRepositoryPath(staging,'reading-bundle.json'),JSON.stringify(manifest,null,2)+'\n');
  const check=await readReadingBundle(joinRepositoryPath(staging,'reading-bundle.json'));if(!check.ok) throw new Error(check.errors.join('\n'));
  try{await fs.access(out);throw new Error('输出目录已存在，拒绝覆盖');}catch(e){if(e.code!=='ENOENT') throw e;}
  await fs.rename(staging,out);staging=null;return {manifestPath:joinRepositoryPath(out,'reading-bundle.json')};
 }finally{
  if(staging) {const rel=path.relative(parent,resolveRepositoryPath(staging));if(rel && !rel.startsWith('..') && !path.isAbsolute(rel) && path.basename(staging).includes('-staging-')) await fs.rm(staging,{recursive:true,force:true});}
  await lock.close();await fs.unlink(lockPath);
 }
}
function parseArgs(argv) {const args={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--') || !argv[i+1]) throw new Error('参数必须为 --name value');args[argv[i].slice(2)]=argv[++i];}args.analysisId=args['analysis-id'];return args;}
module.exports={exportReadingBundle};
if(require.main===module) exportReadingBundle(parseArgs(process.argv.slice(2))).then(r=>console.log(r.manifestPath)).catch(e=>{console.error(e.message);process.exitCode=1;});
