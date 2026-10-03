(function(root){
 'use strict';
 function createController({capture,show,restore,onChange=()=>{},onNavigate=()=>{}}){
  let sessionKey=null,stack=null,resolver=null,generation=0,resolverCalls=0;
  function enter(action){
   if(!stack)return {ok:false,reason:'no-session'};
   const origin=capture(),epoch=++generation,key=sessionKey;onNavigate();
   const finish=result=>{
    if(epoch!==generation||key!==sessionKey)return {ok:false,reason:'stale'};
    if(result?.ok===false)return result;
    stack.push(origin);onChange();return {ok:true};
   };
   const result=show(action);return result&&typeof result.then==='function'?result.then(finish):finish(result);
  }
  function back(){
   ++generation;onNavigate();if(!stack)return {ok:false,reason:'no-session'};
   const frame=stack.pop();if(!frame){onChange();return {ok:false,reason:'empty'};}
   const result=restore(frame,()=>frame.address.sessionKey===sessionKey);onChange();return result||{ok:true};
  }
  return {enter,back,resolve(ref){resolverCalls++;const result=resolver?.resolve(ref)||{ok:false,reason:'no-session'};return result.ok?enter({type:'canonical',address:result.address}):result;},
   reset({key,elementIds,blockIds}){generation++;sessionKey=key;stack=root.ReadingNavigation.createNavigationStack(key);resolver=root.ReadingNavigation.createCanonicalReadingResolver({sessionKey:key,elementIds,blockIds});resolverCalls=0;onChange();},
   invalidate(){generation++;onNavigate();},
   get generation(){return generation;},get sessionKey(){return sessionKey;},get size(){return stack?.size||0;},
   snapshot(){return {sessionKey,resolverCalls,frames:stack?.snapshot()||[],current:capture()};}};
 }
 root.ReadingNavigationUI={createController};
})(window);
