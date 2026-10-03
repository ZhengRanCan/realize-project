'use strict';

// Delivery only: membership and boundary roles are supplied by projectTopic.
const L1TopicView = (() => {
  const layoutAPI = typeof window !== 'undefined' ? window.L0Layout : require('./l0-layout');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roles = {internal:'内部连接', inbound:'外部 → 主题', outbound:'主题 → 外部', crossing:'跨边界关联（无方向）'};
  const LABEL_W = 148, LABEL_H = 44;
  const overlaps = (a,b) => a.x < b.x+b.w+8 && a.x+a.w+8 > b.x && a.y < b.y+b.h+8 && a.y+a.h+8 > b.y;

  function computeTopicLayout(vm) {
    if (!vm.relations.length) return {nodes:[],edges:[],bounds:{width:0,height:0},insideBounds:null,outsideBounds:null};
    const internal = vm.relations.filter(r => r.role === 'internal');
    const base = layoutAPI.computeL0Layout({elements:vm.inside,edges:internal,attachments:[]}, {grid:{NODE_H:104,COL_GAP:176,ROW_GAP:124,PAD:100,ORPHAN_COLS:2}});
    const nodes = base.nodes.map(n => ({...n,scope:'inside',y:n.y+52}));
    const insideWidth = base.bounds.width+80;
    const byId = new Map(nodes.map(n => [n.id,n]));
    let lastBottom = 72;
    const outside = (vm.outside || []).map((e,index) => {
      const peers=vm.relations.filter(r=>r.from===e.id||r.to===e.id).map(r=>byId.get(r.from===e.id?r.to:r.from)).filter(Boolean);
      return {e,index,y:peers.length?peers.reduce((sum,n)=>sum+n.y,0)/peers.length:100};
    }).sort((a,b)=>a.y-b.y||a.index-b.index);
    for(const {e,y} of outside) {
      const node={...e,scope:'outside',x:insideWidth+248,y:Math.max(lastBottom+40,y),w:236,h:104};
      lastBottom=node.y+node.h;nodes.push(node);byId.set(node.id,node);
    }
    const occupied=nodes.map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
    function labelSlot(x,y) {
      x=Math.max(LABEL_W/2+16,x);y=Math.max(100,y);
      let rect={x:x-LABEL_W/2,y:y-LABEL_H/2,w:LABEL_W,h:LABEL_H};
      while(occupied.some(n=>overlaps(rect,n))) {y+=LABEL_H+12;rect={...rect,y:y-LABEL_H/2};}
      occupied.push(rect);return {x,y};
    }
    const pairCounts=new Map();
    const edges=vm.relations.map((r,index)=>{
      const a=byId.get(r.from),b=byId.get(r.to);
      if(!a||!b)throw new Error('L1 relation endpoint unavailable: '+r.from+' / '+r.to);
      const pair=JSON.stringify([r.from,r.to].sort()),ordinal=pairCounts.get(pair)||0;pairCounts.set(pair,ordinal+1);
      let s,t,candidate;
      if(r.role!=='internal') {
        const inner=a.scope==='inside'?a:b,outer=a.scope==='outside'?a:b;
        const p={x:inner.x+inner.w/2,y:inner.y+inner.h},q={x:outer.x,y:outer.y+outer.h/2};
        [s,t]=a.scope==='inside'?[p,q]:[q,p];
        candidate={x:insideWidth+124,y:(p.y+q.y)/2+ordinal*56};
      } else if(a.id===b.id) {
        s={x:a.x+a.w,y:a.y+26};t={x:a.x+a.w,y:a.y+a.h-26};
        candidate={x:a.x+a.w+100,y:a.y+a.h/2+ordinal*56};
      } else if(a.y===b.y) {
        const right=a.x<b.x;
        s={x:right?a.x+a.w:a.x,y:a.y+a.h/2};t={x:right?b.x:b.x+b.w,y:b.y+b.h/2};
        candidate={x:(s.x+t.x)/2,y:(s.y+t.y)/2+ordinal*56};
      } else {
        const down=b.y>a.y;
        s={x:a.x+a.w/2,y:down?a.y+a.h:a.y};t={x:b.x+b.w/2,y:down?b.y:b.y+b.h};
        candidate={x:down?(s.x+t.x)/2:Math.min(a.x,b.x)-80,y:(s.y+t.y)/2+ordinal*56};
      }
      const label=labelSlot(candidate.x,candidate.y);
      // Each curve passes its own label slot. Paths remain separate for parallel edges.
      const d=`M ${s.x} ${s.y} C ${s.x} ${label.y}, ${label.x-32} ${label.y}, ${label.x} ${label.y} C ${label.x+32} ${label.y}, ${t.x} ${label.y}, ${t.x} ${t.y}`;
      return {...r,relationIndex:index,d,labelX:label.x,labelY:label.y,labelW:LABEL_W,labelH:LABEL_H,directed:r.type!=='relates-to'};
    });
    const bottom=Math.max(...occupied.map(r=>r.y+r.h))+72;
    const right=Math.max(...occupied.map(r=>r.x+r.w))+72;
    return {nodes,edges,bounds:{width:right,height:bottom},insideBounds:{x:12,y:52,width:insideWidth-12,height:bottom-68},outsideBounds:outside.length?{x:insideWidth+232,y:52,width:268,height:bottom-68}:null};
  }

  function provenance(e,options) {
    const refs=[...(e.sectionRefs||[]),...(e.sourceUnitIds||[])];
    return refs.length?refs.map(ref=>options.canSourceRef?.(ref)
      ?`<button class="chip link" data-l1-source="${esc(ref)}">${esc(ref)}</button>`
      :`<span class="chip mono">${esc(ref)}</span>`).join(' ') : '<span class="muted">未提供可解析出处。</span>';
  }
  function elementDetail(e,scope,options) {
    return `<h3>${esc(e.label)}</h3><p class="mono">${esc(e.id)} · ${scope==='outside'?'主题外部对象':'本主题成员'}</p>
      <button class="btn" data-l1-element-open="${esc(e.id)}">在框架图中定位</button>
      <h4>出处标识</h4><p>${provenance(e,options)}</p><p class="muted small">标识本身不表示已核实；可从相关解释区块继续查原文。</p>`;
  }
  function relationDetail(r,vm,options) {
    const elements=[...vm.inside,...(vm.outside||[])],name=id=>elements.find(e=>e.id===id)?.label||id;
    return `<h3>${esc(r.label||r.type)}</h3><p data-l1-role="${esc(r.role)}">${esc(r.from)} ${r.type==='relates-to'?'—':'→'} ${esc(r.to)} · ${esc(roles[r.role])}</p>
      <p>${esc(name(r.from))} ${r.type==='relates-to'?'—':'→'} ${esc(name(r.to))}</p><p>关系类型：<span class="mono">${esc(r.type)}</span></p>
      ${r.id?`<p>原关系 ID：${esc(r.id)}</p>`:''}${Object.hasOwn(r,'label')?`<p>原始 label：${esc(r.label)}</p>`:''}
      ${Object.hasOwn(r,'note')?`<p>说明：${esc(r.note)}</p>`:''}${Object.hasOwn(r,'qualifiers')?`<details><summary>完整 qualifiers</summary><pre>${esc(JSON.stringify(r.qualifiers,null,2))}</pre></details>`:''}
      <details><summary>端点与出处标识</summary>${[...new Set([r.from,r.to])].map(id=>{const e=elements.find(e=>e.id===id);return `<p>${esc(id)} · ${esc(e?.label)}</p><p>${provenance(e||{},options)}</p>`;}).join('')}</details>`;
  }
  function renderTopicHTML(vm,options={}) {
    const layout=computeTopicLayout(vm),doc=vm.document||{},crossing=vm.relations.filter(r=>r.role!=='internal').length;
    const organization=vm.blockOrganization,entries=new Map((vm.blockEntries||[]).map(b=>[b.id,b]));
    const orgText=organization.state==='unknown'?'尚未声明区块关联。':organization.state==='empty'?'已明确没有关联区块。':'这些是已声明的相关解释区块，不表示对象的唯一归属。';
    const blockHTML=(organization.ids||[]).map(id=>{const b=entries.get(id),available=b&&options.canReadBlock?.(id);
      return available?`<button class="btn" data-l1-block="${esc(id)}">${esc(id)} · ${esc(b.title)}<small>${esc(b.stage)}</small></button>`
        :`<p class="l1-unavailable"><span class="mono">${esc(id)}</span> · ${esc(b?.title||'已声明关联')}：当前未加载区块资料。</p>`;}).join('');
    const nodeButton=(n,position=true)=>`<button class="l1-node ${n.scope==='outside'?'l1-outside-node':''}" data-l1-node="${esc(n.id)}" data-l1-scope="${n.scope}" aria-pressed="false" aria-label="${esc((n.scope==='outside'?'主题外部对象：':'本主题成员：')+n.label+' · '+n.id)}" ${position?`style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px"`:''}><small>${esc(n.id)} · ${n.scope==='outside'?'主题外部':esc(n.type||'成员')}</small><strong>${esc(n.label)}</strong></button>`;
    const graph=vm.relations.length?`<div class="l1-graph-wrap" tabindex="0" role="region" aria-label="主题边界图，可滚动查看完整关系">
      <div class="l1-graph" style="width:${layout.bounds.width}px;height:${layout.bounds.height}px">
        <div class="l1-boundary-zone" style="left:12px;top:52px;width:${layout.insideBounds.width}px;height:${layout.insideBounds.height}px"><span>本主题涉及的对象</span></div>
        ${layout.outsideBounds?`<div class="l1-boundary-zone l1-outside-zone" style="left:${layout.outsideBounds.x}px;top:52px;width:${layout.outsideBounds.width}px;height:${layout.outsideBounds.height}px"><span>主题外部的连接对象</span></div>`:''}
        <svg class="l1-lines" width="${layout.bounds.width}" height="${layout.bounds.height}" aria-hidden="true"><defs><marker id="l1-direction" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" /></marker></defs>
          ${layout.edges.map(e=>`<path data-l1-relation="${e.relationIndex}" data-l1-role="${esc(e.role)}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" d="${e.d}" ${e.directed?'marker-end="url(#l1-direction)"':''}/>`).join('')}</svg>
        ${layout.nodes.map(n=>nodeButton(n)).join('')}
        ${layout.edges.map(e=>`<button class="l1-relation-label" data-l1-relation-button="${e.relationIndex}" data-l1-role="${esc(e.role)}" aria-pressed="false" aria-label="${esc((e.label||e.type)+'：'+e.from+(e.directed?' → ':' — ')+e.to+'，'+roles[e.role])}" style="left:${e.labelX-e.labelW/2}px;top:${e.labelY-e.labelH/2}px;width:${e.labelW}px;height:${e.labelH}px"><span>${esc(e.label||e.type)}</span><small>${esc(roles[e.role])}</small></button>`).join('')}
      </div></div>`:`<div class="l1-summary"><p>未声明可绘制关系；这里显示主题边界摘要。</p>${vm.inside.length?`<div class="l1-member-list">${vm.inside.map(e=>nodeButton({...e,scope:'inside'},false)).join('')}</div>`:'<p>已明确没有主题成员。</p>'}</div>`;
    return `<section class="l1-topic-view" data-l1-topic="${esc(vm.topic.id)}" data-representation="${esc(vm.representation)}">
      <div class="reading-nav"><button class="btn" id="l1-back">返回</button><span class="muted small">${esc(doc.title||'当前文档')} · 主题</span></div>
      <header class="l1-heading"><span class="mono muted">${esc(vm.topic.id)}</span><h1>${esc(vm.topic.title)}</h1><p>${esc(vm.topic.proposition)}</p>
        <details><summary>文档身份与主题出处</summary><p>${esc(doc.id)} · ${esc(doc.role)}</p><p class="mono">${esc(doc.sourcePath)}</p><p>${provenance(vm.topic,options)}</p></details></header>
      <p class="l1-counts">涉及 ${vm.inside.length} 个对象 · 内部 ${vm.relations.length-crossing} 条关系 · 跨主题边界 ${crossing} 条</p>
      <p class="muted small">对象可同时参与多个主题。箭头表示已有方向；没有箭头的线只表示关联。</p>
      <div class="l1-workspace">${graph}<aside class="l1-selection-detail" id="l1-selection-detail" aria-label="所选对象或关系详情"><p class="muted">点击对象或关系标签，查看完整名称、说明和出处标识。</p></aside></div>
      <section class="l1-blocks" data-block-organization="${esc(organization.state)}"><h2>进一步阅读</h2><p>${orgText}</p><div class="l1-block-entries">${blockHTML}</div></section>
      <details class="l1-all-details"><summary>成员与关系详情（${vm.inside.length} 个成员 / ${vm.relations.length} 条关系）</summary>
        ${vm.inside.map(e=>`<details><summary>${esc(e.id)} · ${esc(e.label)}</summary>${elementDetail(e,'inside',options)}</details>`).join('')}
        ${vm.relations.map(r=>`<details><summary data-l1-role="${esc(r.role)}">${esc(r.from)} —${esc(r.type)}${r.type==='relates-to'?'—':'→'} ${esc(r.to)}</summary>${relationDetail(r,vm,options)}</details>`).join('')}</details>
    </section>`;
  }
  function getSelection(host) {return host.querySelector('.l1-topic-view')?.__selection||null;}
  function restoreSelection(host,selection) {host.querySelector('.l1-topic-view')?.__select?.(selection);}
  function mount(host,vm,options={}) {
    host.__l1Abort?.abort();host.__l1Abort=new AbortController();
    const signal=host.__l1Abort.signal;
    host.innerHTML=renderTopicHTML(vm,options);
    const root=host.querySelector('.l1-topic-view'),slot=root.querySelector('#l1-selection-detail');
    root.__select=selection=>{
      const e=selection?.kind==='element'?[...vm.inside,...(vm.outside||[])].find(n=>n.id===selection.id):null;
      const r=selection?.kind==='relation'?vm.relations[selection.index]:null;
      root.__selection=e?{kind:'element',id:e.id}:r?{kind:'relation',index:selection.index}:null;
      root.querySelectorAll('.is-hit').forEach(n=>n.classList.remove('is-hit'));
      root.querySelectorAll('[aria-pressed]').forEach(n=>n.setAttribute('aria-pressed','false'));
      slot.innerHTML=e?elementDetail(e,vm.inside.some(n=>n.id===e.id)?'inside':'outside',options):r?relationDetail(r,vm,options):'<p class="muted">点击对象或关系标签，查看完整名称、说明和出处标识。</p>';
      for(const n of root.querySelectorAll('[data-l1-node]'))if(e?n.dataset.l1Node===e.id:r?[r.from,r.to].includes(n.dataset.l1Node):false){n.classList.add('is-hit');if(e)n.setAttribute('aria-pressed','true');}
      for(const n of root.querySelectorAll('[data-l1-relation],[data-l1-relation-button]')) {
        const index=Number(n.dataset.l1Relation??n.dataset.l1RelationButton),edge=vm.relations[index];
        if(e?[edge.from,edge.to].includes(e.id):r?index===selection.index:false){n.classList.add('is-hit');if(r&&n.tagName==='BUTTON')n.setAttribute('aria-pressed','true');}
      }
    };
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.id==='l1-back')options.onBack?.();
      else if(button.hasAttribute('data-l1-node'))root.__select({kind:'element',id:button.dataset.l1Node});
      else if(button.hasAttribute('data-l1-relation-button'))root.__select({kind:'relation',index:Number(button.dataset.l1RelationButton)});
      else if(button.hasAttribute('data-l1-element-open'))options.onElement?.(button.dataset.l1ElementOpen);
      else if(button.hasAttribute('data-l1-block'))options.onBlock?.(button.dataset.l1Block);
      else if(button.hasAttribute('data-l1-source'))options.onSourceRef?.(button.dataset.l1Source);
    },{signal});
  }
  return {computeTopicLayout,renderTopicHTML,mount,getSelection,restoreSelection};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=L1TopicView;
if(typeof window!=='undefined')window.L1TopicView=L1TopicView;
