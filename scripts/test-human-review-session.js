'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createHumanReviewWriter}=require('../app/main/human-review-store');
async function main(){const root=await fs.mkdtemp(path.join(os.tmpdir(),'review-session-'));try{
 const make=id=>({sessionToken:id,modelPath:path.join(root,id+'.json'),model:null,humanReviewPath:path.join(root,id+'-human.json'),humanReview:{designId:id,decisions:{D:{status:'pending'}}}});
 const a=make('A'),b=make('B');let release;const saved=[];
 const save=createHumanReviewWriter({projectRoot:root,write:async(file,value)=>{if(!saved.length)await new Promise(r=>release=r);saved.push({file,value});}});
 const pending=save(a,{humanReview:{decisions:{D:{status:'approved'}}}});await new Promise(r=>setImmediate(r));let current=b;
 const second=save(b,{humanReview:{decisions:{D:{status:'rejected'}}}});release();await pending;assert.equal(current.humanReview.decisions.D.status,'pending');await second;
 assert.equal(saved[0].value.designId,'A');assert.equal(saved[1].value.designId,'B');assert.equal(current.humanReview.decisions.D.status,'rejected');assert.equal(a.humanReview.decisions.D.status,'approved');
 console.log('Queued human review saves retain originating session: passed');
}finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
