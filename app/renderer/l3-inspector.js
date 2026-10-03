'use strict';
(function(){
 const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 function mountL3Inspector(host,vm,{onSource,onFragment,onClose}) {
  host.replaceChildren();host.dataset.blockId=vm.blockId;host.dataset.claimVerification=vm.claimVerification.state;host.dataset.provenance=vm.provenanceAssurance.state;
  const close=node('button','关闭并返回','btn');close.id='l3-close';close.addEventListener('click',onClose);host.append(close,node('h2',vm.title));
  if(vm.fragment){host.append(node('p',`当前片段：${vm.fragment.text}`));const parent=node('button','查看整个区块出处','btn');parent.addEventListener('click',()=>onFragment());host.append(parent);}
  host.append(node('h3','原文来源'));
  if(!vm.traceability.units.length)host.append(node('p','当前片段没有声明语义单元来源。'));
  for(const u of vm.traceability.units){
   const section=node('section');section.dataset.sourceUnitId=u.id;section.append(node('strong',u.id),node('p',u.statement));
   const button=node('button',`查看原文 ${u.section}`,'btn tiny');button.dataset.section=u.section;button.addEventListener('click',()=>onSource(u));section.append(button);
   if(u.coordinate.state!=='known')section.append(node('p',u.coordinate.reason));host.append(section);
  }
  const source=node('div');source.id='l3-source-coordinate';host.append(source);
  host.append(node('h3','相关审阅材料'),node('p','这些材料与区块相关，不表示它们验证了上面的语义单元。','muted small'));
  if(!vm.reviewContext.length)host.append(node('p','没有关联审阅对象。'));
  for(const o of vm.reviewContext){
   const details=node('details');details.dataset.reviewObjectId=o.id;details.append(node('summary',`${o.id} · ${o.title}`));
   if(o.evidenceCapability.state==='absent')details.append(node('p','该对象类型没有 Evidence 字段。'));
   else if(o.evidenceCapability.state==='empty')details.append(node('p','没有 Evidence。'));
   else for(const e of o.evidence) {const item=node('div');item.className='l3-evidence';item.append(node('strong',e.type||'Evidence'),node('pre',JSON.stringify(e,null,2)));details.append(item);}
   host.append(details);
  }
  const generation=node('details');generation.append(node('summary','生成与来源状态'));
  const g=vm.generationContext;
  generation.append(node('p',g.expression.state==='unknown'?'尚未提供生成资料。':g.expression.state==='missing'?'已提供生成资料，但这个区块缺少表达。':`生成检查：${g.integrity.verdict}`));
  for(const text of [...(g.integrity.errors||[]),...(g.integrity.warnings||[])])generation.append(node('p',text));
  generation.append(node('p',g.coverage.state==='available'?`表达承载了 ${g.coverage.covered} / ${g.coverage.total} 个规划语义单元。`:g.coverage.state==='not-applicable'?'该规划没有覆盖集合，覆盖检查不适用。':'当前无法计算表达覆盖。'));
  generation.append(node('p','来源可信程度尚无法判定；系统未提供主张验证能力。'));host.append(generation);
  close.focus();return host;
 }
 window.DesignReviewL3={mountL3Inspector};
})();
