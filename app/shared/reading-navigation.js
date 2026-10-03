(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ReadingNavigation=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const copy=value=>structuredClone(value);
 function validateAddress(address,sessionKey){
  if(!address||address.sessionKey!==sessionKey)throw new Error('navigation session mismatch');
  if(!['L0','L1','L2','L3'].includes(address.level))throw new Error('invalid Reading level');
  if(address.level==='L1'&&!address.topicId)throw new Error('Topic address required');
  if(['L2','L3'].includes(address.level)&&!address.blockId)throw new Error('block address required');
  return address;
 }
 function createCanonicalReadingResolver({sessionKey,elementIds=[],blockIds=[]}){
  const elements=new Set(elementIds),blocks=new Set(blockIds);
  return Object.freeze({resolve(ref){
   if(!ref||!['element','block'].includes(ref.kind))return {ok:false,reason:'unsupported'};
   if(typeof ref.id!=='string'||!(ref.kind==='element'?elements:blocks).has(ref.id))return {ok:false,reason:'unknown'};
   const element=ref.kind==='element';return {ok:true,address:{sessionKey,level:element?'L0':'L2',[element?'elementId':'blockId']:ref.id,anchor:'#'+ref.kind+'-'+ref.id}};
  }});
 }
 function createNavigationStack(sessionKey){
  let frames=[];
  return {get size(){return frames.length;},push(frame){validateAddress(frame?.address,sessionKey);frames.push(copy(frame));},pop(){return frames.length?copy(frames.pop()):null;},snapshot(){return copy(frames);},reset(key){sessionKey=key;frames=[];}};
 }
 return {createCanonicalReadingResolver,createNavigationStack,validateAddress};
});
