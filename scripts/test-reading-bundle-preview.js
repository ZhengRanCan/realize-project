'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {buildPreview}=require('./build-preview');
async function main(){const root=await fs.mkdtemp(path.join(os.tmpdir(),'reading-preview-'));try{
 const fixture=await makeBundleFixture(root),out=path.join(root,'preview.html');
 await buildPreview({bundle:fixture.manifestPath,out});const relocated=path.join(root,'移动 后','preview.html');await fs.mkdir(path.dirname(relocated));await fs.copyFile(out,relocated);
 const report=execFileSync(require('electron'),['.','--verify-preview',relocated],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:30000});assert.match(report,/VERIFY PREVIEW PASSED/);assert.match(report,/bundle inspection/);
 const legacy=path.join(root,'legacy.html');await buildPreview({out:legacy});const legacyReport=execFileSync(require('electron'),['.','--verify-preview',legacy],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:30000});assert.match(legacyReport,/VERIFY PREVIEW PASSED/);
 console.log('Bundle and legacy Preview, shared renderer, moved HTML: passed');
}finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
