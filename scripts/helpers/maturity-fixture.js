'use strict';
const fs=require('node:fs'),path=require('node:path');
function makeMaturityMap(){
 const map=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../samples/operational-runbook/framework-map.json'),'utf8'));
 map.document={...map.document,id:'F21-PUBLIC-STRESS',title:'公开确定性压力图（80 个实体 / 160 条关系）'};
 map.elements=Array.from({length:80},(_,i)=>({id:'E-'+String(i+1).padStart(3,'0'),label:'压力实体 '+(i+1)+'（完整名称与说明，用于验证键盘披露和稳定身份，不应因界面截断而丢失）',type:i%2?'artifact':'process',role:i%2?'intermediate':'producer',topics:['T-'+(i%4+1)],sectionRefs:['§1']}));
 map.edges=[];
 for(let i=0;i<40;i++)for(const [type,to]of [['produces',2*i+1],['consumes',(2*i+79)%80],['depends-on',(2*i+2)%80],['depends-on',2*i]])map.edges.push({id:'R-'+String(map.edges.length+1).padStart(3,'0'),from:map.elements[2*i].id,to:map.elements[to].id,type});
 map.topics=Array.from({length:4},(_,i)=>({id:'T-'+(i+1),title:'压力主题 '+(i+1),proposition:'压力fixture仅用于确定性容量测试，不声明阅读优先级。',sectionRefs:['§1']}));
 map.attachments=[];map.relationGap=[];
 map.meta={...map.meta,elementCount:80,topicCount:4,edgeCount:160,attachmentCount:0,relationGapCount:0,note:'F21 public deterministic test input'};
 return map;
}
module.exports={makeMaturityMap};
