'use strict';
const {createHash} = require('node:crypto');
const sha256 = text => createHash('sha256').update(text).digest('hex');

function parseDocHeadings(text) {
  const lines=text.split(/\r?\n/), heads=[];
  let fenceChar=null, fenceLen=0;
  lines.forEach((line,index)=>{
    const fence=line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (!fenceChar) {fenceChar=fence[1][0];fenceLen=fence[1].length;return;}
      if (fence[1][0]===fenceChar && fence[1].length>=fenceLen && !fence[2].trim()) {fenceChar=null;return;}
    }
    if (fenceChar) return;
    const heading=line.match(/^(#{1,6})[ \t]+(.*\S)[ \t]*$/);
    if (!heading) return;
    const label=heading[2].trim(), number=label.match(/^(\d+(?:\.\d+)*)[.、]?[ \t]/);
    heads.push({level:heading[1].length,text:label,key:number?number[1]:label,line:index+1});
  });
  const counts=new Map();heads.forEach(h=>counts.set(h.level,(counts.get(h.level)||0)+1));
  const levels=[...counts.keys()].sort((a,b)=>a-b);
  const sectionLevel=levels.find(level=>counts.get(level)>=2)??levels[0]??null;
  return {heads,sectionLevel,top:heads.filter(h=>h.level===sectionLevel).map(h=>h.key),all:heads.map(h=>h.key)};
}

function cnNumber(text) {
  const digits={一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
  if (!text.includes('十')) return digits[text]||0;
  const [tens,ones]=text.split('十');return (tens?digits[tens]:1)*10+(digits[ones]||0);
}

function buildSourceRegistry(text,{sourcePath='source.md'}={}) {
  const lines=text.split(/\r?\n/), tree=parseDocHeadings(text);
  const section=(label,title,startLine,endLine)=>({label,title,startLine,endLine,lines:endLine-startLine+1,text:lines.slice(startLine-1,endLine).join('\n').replace(/\s+$/,'')});
  const h2=tree.heads.filter(h=>h.level===2), sections=[];
  const head=section('§0','文档头（定位与非目标声明）',1,h2.length?h2[0].line-1:lines.length);
  if (head.text.trim()) sections.push(head);
  h2.forEach((h,index)=>{
    const match=h.text.match(/^([一二三四五六七八九十]+)、\s*(.*)$/);
    sections.push(section(match?`§${cnNumber(match[1])}`:`§?${h.text}`,match?match[2].trim():h.text,h.line,h2[index+1]?h2[index+1].line-1:lines.length));
  });
  const headings=tree.heads.map((h,index)=>{
    const next=tree.heads.slice(index+1).find(item=>item.level<=h.level);
    return {...h,...section(h.key,h.text,h.line,next?next.line-1:lines.length)};
  });
  return {registryVersion:1,document:{path:sourcePath,title:lines[0].replace(/^#\s*/,'').trim(),totalLines:lines.length,sourceSha256:sha256(text)},sections,headings};
}

function resolveSourceCoordinate(registry,{namespace,key}) {
  const list=namespace==='plan-section'?registry?.sections:namespace==='heading'?registry?.headings:null;
  if (!list) return {state:'unavailable',namespace,key,reason:'来源坐标空间不可用'};
  const matches=list.filter(item=>(namespace==='heading'?item.key:item.label)===key);
  if (matches.length!==1) return {state:'unknown',namespace,key,reason:matches.length?'来源标签重复，无法唯一定位':'来源标签无法解析'};
  const s=matches[0];return {state:'known',namespace,key,title:s.title,range:{startLine:s.startLine,endLine:s.endLine},text:s.text};
}
module.exports={parseDocHeadings,buildSourceRegistry,resolveSourceCoordinate,sha256};
