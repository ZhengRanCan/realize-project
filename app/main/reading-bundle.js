'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {sha256}=require('../shared/source-coordinates');
const {validate}=require('../shared/schema-validator');
const {validateBundleData}=require('../shared/reading-bundle-validation');
const schema=require('../../schema/reading-bundle.schema.json');

async function resolveBundleFile(root,relative) {
 if(typeof relative!=='string' || !relative || relative.includes('\0') || path.isAbsolute(relative) || path.win32.isAbsolute(relative) || /^[a-z][a-z0-9+.-]*:/i.test(relative) || relative.split(/[\\/]/).includes('..')) throw new Error(`资料路径不合法: ${relative}`);
 const base=await fs.realpath(root),actual=await fs.realpath(path.resolve(base,relative));
 const rel=path.relative(base,actual);
 if(!rel || rel==='..' || rel.startsWith('..'+path.sep) || path.isAbsolute(rel)) throw new Error(`资料实际路径越界: ${relative}`);
 if(!(await fs.stat(actual)).isFile()) throw new Error(`资料不是普通文件: ${relative}`);
 return actual;
}
async function readReadingBundle(manifestPath) {
 try {
  const manifestFile=await fs.realpath(path.resolve(manifestPath)),root=path.dirname(manifestFile);
  const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8')),validation=validate(schema,manifest);
  if(!validation.valid) return {ok:false,stage:'manifest',errors:validation.errors,warnings:[]};
  const paths={},raw={},seen=new Set();
  for(const [name,item] of Object.entries(manifest.files)) {
   const actual=await resolveBundleFile(root,item.path);if(seen.has(actual.toLowerCase())) throw new Error('多个资料条目指向同一个文件');seen.add(actual.toLowerCase());paths[name]=actual;
   raw[name]=await fs.readFile(actual);if(sha256(raw[name])!==item.sha256) throw new Error(`${name}: 文件 SHA256 不匹配`);
  }
  const input={manifest,sourceText:raw.source.toString('utf8'),sourceSha256:sha256(raw.source),planSha256:sha256(raw.plan)};
  for(const name of ['designReview','plan','sourceSections','generated','frameworkMap']) if(raw[name]) input[name]=JSON.parse(raw[name].toString('utf8'));
  const check=validateBundleData(input);
  if(check.errors.length) return {ok:false,stage:'integrity',...check};
  return {ok:true,stage:'ready',errors:[],warnings:check.warnings,bundle:{...input,paths,root,manifestPath:manifestFile,reports:check.reports}};
 }catch(error){return {ok:false,stage:'read',errors:[error.message],warnings:[]};}
}
module.exports={readReadingBundle,resolveBundleFile};
