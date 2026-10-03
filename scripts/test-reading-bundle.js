'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {readReadingBundle,resolveBundleFile}=require('../app/main/reading-bundle');
const {validateBundleData}=require('../app/shared/reading-bundle-validation');
const {exportReadingBundle}=require('./export-reading-bundle');
async function main(){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'reading-bundle-'));
 try {
  const fixture=await makeBundleFixture(root);
  const loaded=await readReadingBundle(fixture.manifestPath);
  assert.equal(loaded.ok,true,loaded.errors.join('\n'));assert.equal(loaded.bundle.plan.blocks.length,21);assert.equal(loaded.bundle.plan.sourceUnits.length,87);
  const relocated=path.join(root,'中文 空格','移动资料');await fs.mkdir(path.dirname(relocated),{recursive:true});await fs.cp(path.dirname(fixture.manifestPath),relocated,{recursive:true});
  assert.equal((await readReadingBundle(path.join(relocated,'reading-bundle.json'))).ok,true);
  assert.deepEqual(await fs.readFile(loaded.bundle.paths.plan),await fs.readFile(fixture.inputs.plan));
  await assert.rejects(exportReadingBundle({...fixture.inputs,out:path.dirname(fixture.manifestPath),analysisId:'duplicate'}),/存在/);
  for(const mutate of [x=>x.manifest.bundleVersion=99,x=>x.plan.blocks[0].covers.push('SU-unknown'),x=>x.designReview.decisions.push(x.designReview.decisions[0]),x=>x.manifest.bindings.designReviewId='other']){
    const x=structuredClone(fixture.models);mutate(x);assert.ok(validateBundleData(x).errors.length);
  }
  const different=structuredClone(fixture.models);different.frameworkMap.document.id='MAP-INDEPENDENT';different.manifest.bindings.frameworkDocumentId='MAP-INDEPENDENT';assert.equal(validateBundleData(different).errors.length,0);
  const absent=structuredClone(fixture.models);delete absent.generated;delete absent.frameworkMap;delete absent.manifest.files.generated;delete absent.manifest.files.frameworkMap;delete absent.manifest.bindings.frameworkDocumentId;assert.equal(validateBundleData(absent).errors.length,0);
  const broken=path.join(relocated,'overview-plan.json');await fs.appendFile(broken,' ');assert.equal((await readReadingBundle(path.join(relocated,'reading-bundle.json'))).ok,false);
  for(const item of ['../escape','C:/outside.json','https://example.com/x','..\\escape']) await assert.rejects(resolveBundleFile(root,item));
  const outside=path.join(root,'outside');await fs.mkdir(outside);await fs.writeFile(path.join(outside,'x'),'x');
  const dir=path.join(root,'containment');await fs.mkdir(dir);await fs.symlink(outside,path.join(dir,'link'),'junction');
  await assert.rejects(resolveBundleFile(dir,'link/x'),/越界/);
  const manifest=JSON.parse(await fs.readFile(fixture.manifestPath));delete manifest.files.plan;await fs.writeFile(path.join(relocated,'reading-bundle.json'),JSON.stringify(manifest));assert.equal((await readReadingBundle(path.join(relocated,'reading-bundle.json'))).ok,false);
  console.log('Reading bundle export, binding, relocation and containment: passed');
 }finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
