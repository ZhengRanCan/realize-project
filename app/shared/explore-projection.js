(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ExploreProjection=api;})(globalThis,function(){
 'use strict';
 function createExploreProjection(vm){
  const elements=vm?.elements||[],topics=vm?.topics||[],edges=vm?.edges||[],attachments=vm?.attachments||[];
  const copy=value=>structuredClone(value);
  const availability=e=>{
   const edge=edges.some(x=>x.from===e.id||x.to===e.id);
   if(e.type==='constraint'&&!edge&&attachments.some(a=>a.elementId===e.id))return {available:false,reason:'attachment-only'};
   return edge||e.topics?.length?{available:true}:{available:false,reason:'no-relations'};
  };
  const catalog=[...elements.map(e=>({ref:{kind:'element',id:e.id},label:e.label,...availability(e)})),...topics.map(t=>({ref:{kind:'topic',id:t.id},label:t.title,available:true}))];
  const find=ref=>catalog.find(e=>e.ref.kind===ref?.kind&&e.ref.id===ref.id);
  return {catalog:copy(catalog),project(ref){
   if(!ref||!['element','topic'].includes(ref.kind))return {ok:false,reason:'unsupported'};
   const focus=find(ref);if(!focus)return {ok:false,reason:'unknown'};if(!focus.available)return {ok:false,reason:focus.reason};
   const relations=[];let organization=null,provenance;
   const members=ref.kind==='topic'?elements.filter(e=>e.topics.includes(ref.id)):[elements.find(e=>e.id===ref.id)];
   const memberIds=new Set(members.map(e=>e.id));
   if(ref.kind==='element'){
    const e=members[0];provenance=copy(e.provenance||{});
    edges.forEach((edge,index)=>{
     if(edge.from!==ref.id&&edge.to!==ref.id)return;
     const direction=edge.type==='relates-to'?'undirected':edge.from===edge.to?'self':edge.from===ref.id?'outgoing':'incoming';
     const neighbor=find({kind:'element',id:edge.from===ref.id?edge.to:edge.from});
     relations.push({kind:'semantic',from:{kind:'element',id:edge.from},to:{kind:'element',id:edge.to},type:edge.type,direction,neighbor:copy(neighbor),label:edge.label||null,note:edge.note||null,qualifiers:copy(edge.qualifiers||null),authority:'framework-map.edges['+index+']'});
    });
    e.topics.forEach((id,index)=>relations.push({kind:'membership',type:'membership',direction:'membership',neighbor:copy(find({kind:'topic',id})),authority:'framework-map.elements['+elements.indexOf(e)+'].topics['+index+']'}));
   }else{
    const t=topics.find(t=>t.id===ref.id);provenance={sectionRefs:[...(t.sectionRefs||[])]};
    organization=Object.hasOwn(t,'blockIds')?{state:t.blockIds.length?'known':'empty',ids:[...t.blockIds]}:{state:'unknown'};
    members.forEach(e=>relations.push({kind:'membership',type:'membership',direction:'membership',neighbor:copy(find({kind:'element',id:e.id})),authority:'framework-map.elements['+elements.indexOf(e)+'].topics['+e.topics.indexOf(ref.id)+']'}));
   }
   const annotations=attachments.map((a,index)=>({...copy(a),authority:'framework-map.attachments['+index+']'})).filter(a=>memberIds.has(a.elementId)||a.hosts.some(id=>memberIds.has(id)));
   const relationGaps=(vm?.review?.relationGap||[]).map((gap,index)=>({...copy(gap),authority:'framework-map.relationGap['+index+']'})).filter(g=>memberIds.has(g.from)||memberIds.has(g.to));
   const topic=ref.kind==='topic'?topics.find(t=>t.id===ref.id):null;
   return {ok:true,kind:'ExploreViewModel',focus:copy(focus),proposition:topic?.proposition||null,relations,annotations,relationGaps,organization,provenance};
  }};
 }
 return {createExploreProjection};
});
