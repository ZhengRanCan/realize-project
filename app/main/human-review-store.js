'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const semantics=require('../shared/semantics');
function createHumanReviewWriter({write,projectRoot}) {
 let queue=Promise.resolve();
 return (session,payload)=>{
  const save=async()=>{
   if(!payload || !payload.humanReview || typeof payload.humanReview!=='object' || Array.isArray(payload.humanReview)) return {ok:false,errors:['缺少 humanReview 载荷']};
   const target=payload.path?path.resolve(payload.path):session.humanReviewPath;
   if(!target)return {ok:false,errors:['未确定审核保存路径']};
   if(session.bundle){
    if(payload.sessionToken!==session.sessionToken || target!==session.humanReviewPath)return {ok:false,errors:['审核保存 session / 目标不匹配']};
    if(await fs.realpath(path.dirname(target))!==session.bundle.root)return {ok:false,errors:['审核保存目录已漂移']};
    try{if((await fs.lstat(target)).isSymbolicLink())return {ok:false,errors:['审核文件不可为链接']};}catch(e){if(e.code!=='ENOENT')throw e;}
   }
   const previous=session.humanReview||{},review={...previous,reviewVersion:(previous.reviewVersion||0)+1,designId:session.model?.design.id||previous.designId,designReviewPath:session.modelPath?path.relative(projectRoot,session.modelPath):previous.designReviewPath,updatedAt:new Date().toISOString()};
   for(const bucket of ['decisions','openQuestions','gaps']){
    const incoming=payload.humanReview[bucket]||{},old=previous[bucket]||{};review[bucket]={};
    for(const id of new Set([...Object.keys(old),...Object.keys(incoming)])){const before=old[id]||{},next=incoming[id]||{};review[bucket][id]={...before,...next,status:next.status||before.status||'pending',comment:next.comment!==undefined?next.comment:before.comment||''};}
   }
   await write(target,review);session.humanReview=review;session.humanReviewPath=target;
   return {ok:true,sessionToken:session.sessionToken,path:target,humanReview:review,gate:session.model?semantics.evaluateGate(session.model,review):{ready:false,blockers:[]},summary:session.model?semantics.reviewSummary(session.model,review):null};
  };
  const task=queue.then(save,save).catch(e=>({ok:false,errors:[e.message]}));queue=task;return task;
 };
}
module.exports={createHumanReviewWriter};
