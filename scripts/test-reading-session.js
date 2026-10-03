'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {createReadingSessionController,prepareReadingSession}=require('../app/main/reading-session');
async function main(){const root=await fs.mkdtemp(path.join(os.tmpdir(),'reading-session-'));try{
 const a=await makeBundleFixture(path.join(root,'a')),b=await makeBundleFixture(path.join(root,'b'));
 const controller=createReadingSessionController();const first=await controller.prepare(a.manifestPath);assert.equal(controller.current(),null);assert.equal(controller.commit(first.requestToken).ok,true);const token=controller.current().sessionToken;
 const canceled=await controller.prepare(b.manifestPath);controller.discard(canceled.requestToken);assert.equal(controller.commit(canceled.requestToken).ok,false);assert.equal(controller.current().sessionToken,token);
 const bad=await controller.prepare(path.join(root,'missing'));assert.equal(bad.ok,false);assert.equal(controller.current().sessionToken,token);
 let release;const race=createReadingSessionController({prepare:async p=>{if(p===a.manifestPath) await new Promise(r=>release=r);return prepareReadingSession(p);}});
 const slow=race.prepare(a.manifestPath);const fast=await race.prepare(b.manifestPath);release();const late=await slow;assert.equal(late.ok,false);assert.equal(race.commit(fast.requestToken).ok,true);assert.equal(race.commit(late.requestToken).ok,false);
 await fs.writeFile(path.join(path.dirname(b.manifestPath),'human-review.json'),JSON.stringify({designId:'WRONG'}));assert.equal((await prepareReadingSession(b.manifestPath)).ok,false);
 await assert.rejects(fs.access(path.join(path.dirname(a.manifestPath),'human-review.json')));
 console.log('Reading session prepare / commit, failures, review isolation and race: passed');
}finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
