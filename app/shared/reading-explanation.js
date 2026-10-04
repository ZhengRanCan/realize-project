'use strict';
const {createHash}=require('node:crypto');
const {validate}=require('./schema-validator');
const {resolveSourceCoordinate}=require('./source-coordinates');
const schema=require('../../schema/framework-map.schema.json');
const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
function sorted(value){
 if(Array.isArray(value))return value.map(sorted);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sorted(value[key])]));
 return value;
}
function mapFingerprint(map){
 const core=Object.fromEntries(Object.entries(map).filter(([key])=>key!=='readingGuide'));
 return createHash('sha256').update(JSON.stringify(sorted(core)),'utf8').digest('hex');
}
function allEntries(guide){
 return [...Object.values(guide.orientation||{}),...guide.elements.map(x=>x.explanation),...guide.edges.map(x=>x.explanation),...guide.topics.map(x=>x.explanation)];
}
function checkReadingGuideBinding(map,{sourceSha256}={}){
 const errors=[],warnings=[];
 if(!has(map,'readingGuide'))return {errors,warnings};
 const guide=map.readingGuide;
 const shape=validate({...schema.$defs.readingGuide,$defs:schema.$defs},guide);
 if(!shape.valid)return {errors:shape.errors.map(e=>'readingGuide: '+e),warnings};
 if(guide.binding.documentId!==map.document.id)errors.push('readingGuide documentId 不匹配');
 if(guide.binding.mapSha256!==mapFingerprint(map))errors.push('readingGuide Map 指纹不匹配');
 if(sourceSha256!==undefined&&guide.binding.sourceSha256!==sourceSha256)errors.push('readingGuide 原文 hash 不匹配');
 for(const [field,key,valid] of [['elements','elementId',new Set(map.elements.map(x=>x.id))],['topics','topicId',new Set(map.topics.map(x=>x.id))],['edges','edgeIndex',new Set(map.edges.map((_,i)=>i))]]){
  const seen=new Set();for(const entry of guide[field]){
   if(seen.has(entry[key]))errors.push(`readingGuide ${field} 重复引用 ${entry[key]}`);
   if(!valid.has(entry[key]))errors.push(`readingGuide ${field} 悬空引用 ${entry[key]}`);
   seen.add(entry[key]);
  }
 }
 // The existing schema validator does not enforce minItems: pin this invariant here.
 for(const entry of allEntries(guide))if(!entry.sources.length)errors.push('readingGuide 解释 sources 必须非空');
 return {errors,warnings};
}
function projectReadingGuide(map,{sourceSections,sourceIntegrity='unavailable',sourceSha256}={}){
 const binding=checkReadingGuideBinding(map,{sourceSha256});
 if(binding.errors.length)throw new Error(binding.errors.join('\n'));
 const absent={state:'absent',orientation:{question:null,overview:null},elements:{},edges:{},topics:{}};
 if(!has(map,'readingGuide'))return absent;
 const guide=map.readingGuide;
 const canLocate=sourceIntegrity==='consistent'&&sourceSections?.document?.sourceSha256===guide.binding.sourceSha256;
 const normalize=text=>text.replace(/\r\n?/g,'\n');
 function entryVM(entry){
  const sources=entry.sources.map(source=>{
   const result={...source,state:'unavailable',reason:sourceIntegrity==='drifted'?'原文坐标已漂移，未核对出处':'未加载一致的原文快照，未核对出处'};
   if(!canLocate)return result;
   const coordinate=resolveSourceCoordinate(sourceSections,source);
   if(coordinate.state!=='known')return {...result,state:coordinate.state,reason:coordinate.reason};
   if(!normalize(coordinate.text).includes(normalize(source.quote)))return {...result,reason:'摘录与所指原文章节不匹配'};
   return {...source,state:'known',title:coordinate.title};
  });
  return {summary:entry.summary,detail:entry.detail,sourceState:sources.every(x=>x.state==='known')?'located':'declared',sources};
 }
 const indexed=(items,key)=>Object.fromEntries(items.map(item=>[item[key],entryVM(item.explanation)]));
 return {state:'present',orientation:{question:guide.orientation?.question?entryVM(guide.orientation.question):null,overview:guide.orientation?.overview?entryVM(guide.orientation.overview):null},elements:indexed(guide.elements,'elementId'),edges:indexed(guide.edges,'edgeIndex'),topics:indexed(guide.topics,'topicId')};
}
module.exports={mapFingerprint,checkReadingGuideBinding,projectReadingGuide};
