'use strict';
const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {buildPreview}=require('./build-preview');
const {exportReadingBundle}=require('./export-reading-bundle');
async function main(){const root=await fs.mkdtemp(joinRepositoryPath(os.tmpdir(),'reading-preview-'));try{
 const fixture=await makeBundleFixture(root),out=joinRepositoryPath(root,'preview.html');
 await buildPreview({bundle:fixture.manifestPath,out});const relocated=joinRepositoryPath(root,'移动 后','preview.html');await fs.mkdir(path.dirname(relocated));await fs.copyFile(out,relocated);
 const report=execFileSync(require('electron'),['.','--verify-preview',relocated],{cwd:joinRepositoryPath(__dirname,'..'),encoding:'utf8',timeout:30000});assert.match(report,/VERIFY PREVIEW PASSED/);assert.match(report,/bundle inspection/);
 const legacy=joinRepositoryPath(root,'legacy.html');await buildPreview({out:legacy});const legacyReport=execFileSync(require('electron'),['.','--verify-preview',legacy],{cwd:joinRepositoryPath(__dirname,'..'),encoding:'utf8',timeout:30000});assert.match(legacyReport,/VERIFY PREVIEW PASSED/);
 const enhanced=await exportReadingBundle({...fixture.inputs,map:path.resolve('samples/context-consumption/framework-map.reading.json'),out:path.join(root,'enhanced'),analysisId:'f25-preview'});
 const enhancedHTML=path.join(root,'移动 后','enhanced.html');await buildPreview({bundle:enhanced.manifestPath,out:enhancedHTML});
 const enhancedReport=execFileSync(require('electron'),['.','--verify-preview',enhancedHTML],{cwd:joinRepositoryPath(__dirname,'..'),encoding:'utf8',timeout:30000});
 assert.match(enhancedReport,/VERIFY PREVIEW PASSED/);assert.match(enhancedReport,/F25 actual orientation/);assert.match(enhancedReport,/F23 v0.2 explanations/);assert.match(enhancedReport,/F25 fixed reading panel/);assert.match(enhancedReport,/write interception: zero writes/);
 assert.equal((await fs.readdir(path.dirname(enhancedHTML))).some(name=>name==='human-review.json'),false);
 console.log('Bundle, legacy and enhanced Preview, shared renderer, moved HTML and F25 Source/Back: passed');
}finally{assert.ok(resolveRepositoryPath(root).startsWith(resolveRepositoryPath(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
