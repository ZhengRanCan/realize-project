(function(root){
 'use strict';
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function mount(host,vm,{onFocus,onBack,onReading,onBlock,onPrevious,canPrevious,canReadBlock}){
  host.replaceChildren();const section=node('section',undefined,'explore-view');section.dataset.exploreFocus=vm.focus.ref.kind+':'+vm.focus.ref.id;
  const actions=node('div',undefined,'reading-nav');
  for(const [id,label,fn]of [['explore-back-reading','返回阅读',onBack],['explore-previous','返回上一步',onPrevious],['explore-open-reading','在阅读中打开',()=>onReading(vm.focus.ref)]]){
   const button=node('button',label,'btn');button.id=id;button.addEventListener('click',fn);
   if(id==='explore-previous')button.hidden=!canPrevious;
   if(id==='explore-open-reading'&&vm.focus.ref.kind==='topic'){button.disabled=true;button.title='Topic 尚无固定阅读落点';}
   actions.append(button);
  }
  section.append(actions,node('h1',vm.focus.label));if(vm.proposition)section.append(node('p',vm.proposition));
  const graph=node('div',undefined,'explore-graph');
  const focus=node('div',vm.focus.label,'explore-focus-node');focus.setAttribute('aria-label','当前探索焦点：'+vm.focus.label);graph.append(focus);
  for(const [direction,title]of [['incoming','来自'],['self','自身关系'],['outgoing','指向'],['undirected','关联（无方向）'],['membership','主题成员关系']]){
   const rows=vm.relations.filter(r=>r.direction===direction);if(!rows.length)continue;
   const column=node('section',undefined,'explore-neighbors direction-'+direction);column.append(node('h2',title));
   for(const relation of rows){
    const row=node('article',undefined,'explore-relation');row.dataset.relationKind=relation.kind;
    if(relation.kind==='semantic')row.append(node('p',relation.from.id+' —'+relation.type+(relation.direction==='undirected'?'— ':'→ ')+relation.to.id));
    const button=node('button',relation.neighbor.label,'btn');button.dataset.exploreKind=relation.neighbor.ref.kind;button.dataset.exploreId=relation.neighbor.ref.id;
    if(!relation.neighbor.available){button.disabled=true;button.title=relation.neighbor.reason==='attachment-only'?'仅作为约束注释，不能作为探索焦点':'没有可遍历的关系';}
    button.addEventListener('click',()=>onFocus(relation.neighbor.ref));row.append(button);
    const detail=node('details');detail.append(node('summary','关系说明与来源'),node('p',relation.authority,'mono'));
    if(relation.label)detail.append(node('p',relation.label));if(relation.note)detail.append(node('p',relation.note));if(relation.qualifiers)detail.append(node('pre',JSON.stringify(relation.qualifiers,null,2)));row.append(detail);column.append(row);
   }graph.append(column);
  }
  if(!vm.relations.length)graph.append(node('p','已明确没有主题成员。'));section.append(graph);
  if(vm.organization){const org=node('section');org.dataset.exploreOrganization=vm.organization.state;org.append(node('h2','相关阅读区块'),node('p',vm.organization.state==='unknown'?'尚未声明区块关联。':vm.organization.state==='empty'?'已明确没有关联区块。':'这些区块是声明的关联，不表示包含或归属。'));
   for(const id of vm.organization.ids||[]){const available=canReadBlock(id),button=node('button','阅读 '+id,'btn');button.dataset.exploreBlock=id;button.disabled=!available;if(!available){button.title='已声明关联，但当前未加载这个区块的阅读资料。';org.append(node('p',id+'：已声明关联，当前未加载区块资料。'));}button.addEventListener('click',()=>onBlock(id));org.append(button);}section.append(org);
  }
  const provenance=node('details');provenance.append(node('summary','焦点出处（不是验证结论）'),node('pre',JSON.stringify(vm.provenance,null,2)));section.append(provenance);
  if(vm.annotations.length){const detail=node('details');detail.dataset.exploreAnnotations='true';detail.append(node('summary','约束与附着注释'),node('pre',JSON.stringify(vm.annotations,null,2)));section.append(detail);}
  if(vm.relationGaps.length){const detail=node('details');detail.dataset.exploreGaps='true';detail.append(node('summary','尚未表达的关系（不是连线）'),node('pre',JSON.stringify(vm.relationGaps,null,2)));section.append(detail);}
  host.append(section);const title=section.querySelector('h1');title.tabIndex=-1;title.focus({preventScroll:true});
 }
 root.ExploreView={mount};
})(window);
