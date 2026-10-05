'use strict';

// Delivery only: membership and boundary roles are supplied by projectTopic.
const L1TopicView = (() => {
  const layoutAPI = typeof window !== 'undefined' ? window.L0Layout : require('./l0-layout');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roles = {internal:'内部连接', inbound:'外部 → 主题', outbound:'主题 → 外部', crossing:'跨边界关联（无方向）'};
  const LABEL_W = 148, LABEL_H = 44;
  const overlaps = (a,b) => a.x < b.x+b.w+8 && a.x+a.w+8 > b.x && a.y < b.y+b.h+8 && a.y+a.h+8 > b.y;

  // Route through open channels around cards. The first and final short segments
  // follow the port normal, so arrows always enter the target from outside.
  function routeBetween(start,end,nodes,{avoidPoint,used=[]}={}) {
    const obstacles=nodes.map(n=>({x:n.x-24,y:n.y-24,w:n.w+48,h:n.h+48}));
    if(avoidPoint)obstacles.push({x:avoidPoint.x-8,y:avoidPoint.y-8,w:16,h:16});
    const xs=[...new Set([16,start.x,end.x,...used.flatMap(p=>[p.x-24,p.x,p.x+24]),...obstacles.flatMap(n=>[n.x,n.x+n.w])])].sort((a,b)=>a-b);
    const ys=[...new Set([76,start.y,end.y,...used.flatMap(p=>[p.y-24,p.y,p.y+24]),...obstacles.flatMap(n=>[n.y,n.y+n.h])])].sort((a,b)=>a-b);
    const clear=(a,b)=>!obstacles.some(n=>a.x===b.x
      ?a.x>n.x&&a.x<n.x+n.w&&Math.max(a.y,b.y)>n.y&&Math.min(a.y,b.y)<n.y+n.h
      :a.y>n.y&&a.y<n.y+n.h&&Math.max(a.x,b.x)>n.x&&Math.min(a.x,b.x)<n.x+n.w)
      &&!used.slice(1).some((d,i)=>{
        const c=used[i],horizontal=a.y===b.y,otherHorizontal=c.y===d.y;
        if(horizontal===otherHorizontal)return horizontal
          ?a.y===c.y&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))
          :a.x===c.x&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y));
        const cross=horizontal?{x:c.x,y:a.y}:{x:a.x,y:c.y};
        if(cross.x===start.x&&cross.y===start.y)return false;
        return cross.x>=Math.min(a.x,b.x)&&cross.x<=Math.max(a.x,b.x)&&cross.y>=Math.min(a.y,b.y)&&cross.y<=Math.max(a.y,b.y)
          &&cross.x>=Math.min(c.x,d.x)&&cross.x<=Math.max(c.x,d.x)&&cross.y>=Math.min(c.y,d.y)&&cross.y<=Math.max(c.y,d.y);
      });
    const initial={x:xs.indexOf(start.x),y:ys.indexOf(start.y),dir:0,cost:0,prev:null};
    const heuristic=p=>Math.abs(xs[p.x]-end.x)+Math.abs(ys[p.y]-end.y);
    const queue=[initial],best=new Map();
    while(queue.length) {
      queue.sort((a,b)=>(a.cost+heuristic(a))-(b.cost+heuristic(b)));
      const p=queue.shift(),key=`${p.x},${p.y},${p.dir}`;
      if(best.has(key)&&best.get(key)<p.cost)continue;
      if(xs[p.x]===end.x&&ys[p.y]===end.y) {
        const points=[];for(let step=p;step;step=step.prev)points.unshift({x:xs[step.x],y:ys[step.y]});return points;
      }
      for(const [dx,dy,dir]of [[-1,0,1],[1,0,1],[0,-1,2],[0,1,2]]) {
        const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x>=xs.length||y>=ys.length)continue;
        const a={x:xs[p.x],y:ys[p.y]},b={x:xs[x],y:ys[y]};if(!clear(a,b))continue;
        const cost=p.cost+Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+(p.dir&&p.dir!==dir?12:0),nextKey=`${x},${y},${dir}`;
        if(best.has(nextKey)&&best.get(nextKey)<=cost)continue;
        best.set(nextKey,cost);queue.push({x,y,dir,cost,prev:p});
      }
    }
    throw new Error('L1 has no clear route between ports');
  }
  function routeEdge(s,t,label,a,b,nodes) {
    const outsidePort=(p,n)=>p.x===n.x?{x:p.x-24,y:p.y}:p.x===n.x+n.w?{x:p.x+24,y:p.y}
      :p.y===n.y?{x:p.x,y:p.y-24}:{x:p.x,y:p.y+24};
    const start=outsidePort(s,a),end=outsidePort(t,b);
    const first=routeBetween(start,label,nodes,{avoidPoint:end});
    const raw=[s,...first,...routeBetween(label,end,nodes,{used:first}).slice(1),t],points=[];
    for(const p of raw) {
      const last=points.at(-1);if(last&&last.x===p.x&&last.y===p.y)continue;
      const prev=points.at(-2);
      if(prev&&((prev.x===last.x&&last.x===p.x&&(last.y-prev.y)*(p.y-last.y)>=0)||(prev.y===last.y&&last.y===p.y&&(last.x-prev.x)*(p.x-last.x)>=0)))points.pop();
      points.push(p);
    }
    return points;
  }

  function computeTopicLayout(vm) {
    if (!vm.relations.length) return {nodes:[],edges:[],bounds:{width:0,height:0},insideBounds:null,outsideBounds:null};
    const rich=vm.explanationState==='present',nodeH=rich?148:104,nodeW=rich?236:216;
    const labelH=rich?64:LABEL_H;
    const internal = vm.relations.filter(r => r.role === 'internal');
    const base = layoutAPI.computeL0Layout({elements:vm.inside,edges:internal,attachments:[]}, {grid:{NODE_W:nodeW,NODE_H:nodeH,COL_GAP:176,ROW_GAP:124,PAD:96,ORPHAN_COLS:(vm.outside||[]).length?1:2}});
    // L0's isolated-member band reserves space below the main graph. In a
    // crossing-only Topic there is no main graph, so remove that leading gap.
    const shiftY=internal.length?52:152-Math.min(...base.nodes.map(n=>n.y));
    const nodes = base.nodes.map(n => ({...n,explanation:vm.inside.find(e=>e.id===n.id)?.explanation||null,scope:'inside',y:n.y+shiftY}));
    const insideWidth = base.bounds.width+48;
    const byId = new Map(nodes.map(n => [n.id,n]));
    let lastBottom = 72;
    const outside = (vm.outside || []).map((e,index) => {
      const peers=vm.relations.filter(r=>r.from===e.id||r.to===e.id).map(r=>byId.get(r.from===e.id?r.to:r.from)).filter(Boolean);
      return {e,index,y:peers.length?peers.reduce((sum,n)=>sum+n.y,0)/peers.length:100};
    }).sort((a,b)=>a.y-b.y||a.index-b.index);
    for(const {e,y} of outside) {
      const node={...e,scope:'outside',x:insideWidth+184,y:Math.max(lastBottom+40,y),w:nodeW,h:nodeH};
      lastBottom=node.y+node.h;nodes.push(node);byId.set(node.id,node);
    }
    const occupied=nodes.map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
    function labelSlot(x,y) {
      x=Math.max(LABEL_W/2+16,x);y=Math.max(100,y);
      let rect={x:x-LABEL_W/2,y:y-labelH/2,w:LABEL_W,h:labelH};
      while(occupied.some(n=>overlaps(rect,n))) {y+=labelH+12;rect={...rect,y:y-labelH/2};}
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
        const blocked=nodes.some(n=>n.scope==='inside'&&n.id!==inner.id&&n.x>=inner.x+inner.w&&n.y<inner.y+inner.h/2&&n.y+n.h>inner.y+inner.h/2);
        const p=blocked?{x:inner.x+inner.w/2,y:inner.y+inner.h}:{x:inner.x+inner.w,y:inner.y+inner.h/2},q={x:outer.x,y:outer.y+outer.h/2};
        [s,t]=a.scope==='inside'?[p,q]:[q,p];
        candidate={x:insideWidth+92,y:Math.max(blocked?inner.y+inner.h+44:100,(p.y+q.y)/2)+ordinal*56};
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
      const points=routeEdge(s,t,label,a,b,nodes);
      const d=points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
      return {...r,relationIndex:index,d,points,labelX:label.x,labelY:label.y,labelW:LABEL_W,labelH,directed:r.type!=='relates-to'};
    });
    const bottom=Math.max(...occupied.map(r=>r.y+r.h))+72;
    const right=Math.max(...occupied.map(r=>r.x+r.w+48),insideWidth+12,outside.length?insideWidth+448:0);
    return {nodes,edges,bounds:{width:right,height:bottom},insideBounds:{x:12,y:52,width:insideWidth-12,height:bottom-68},outsideBounds:outside.length?{x:insideWidth+168,y:52,width:248,height:bottom-68}:null};
  }

  function provenance(e,options) {
    const refs=[...(e.sectionRefs||[]),...(e.sourceUnitIds||[])];
    return refs.length?refs.map(ref=>options.canSourceRef?.(ref)
      ?`<button class="chip link" data-l1-source="${esc(ref)}">${esc(ref)}</button>`
      :`<span class="chip mono">${esc(ref)}</span>${options.sourceRefReason?.(ref)?`<span class="muted small">（${esc(options.sourceRefReason(ref))}）</span>`:''}`).join(' ') : '<span class="muted">未提供可解析出处。</span>';
  }
  function explanation(entry,options={},includeSummary=true) {
    if(!entry)return '<p class="l1-explanation-missing">当前资料未提供此项解释。</p>';
    const sources=entry.sources.map(source=>{
      const available=source.state==='known'&&typeof options.onExplanationSource==='function';
      return `<li><button class="btn tiny" data-l1-guide-source="${esc(source.key)}" data-l1-guide-namespace="${esc(source.namespace)}" ${available?'':'disabled'}>${esc(source.key)}</button><span class="muted small"> · ${source.state==='known'?'快照可定位':'未能核对出处'}</span><blockquote>${esc(source.quote)}</blockquote>${source.reason?`<p class="muted small">${esc(source.reason)}</p>`:''}</li>`;
    }).join('');
    return `<div class="l1-explanation" data-explanation-state="${esc(entry.sourceState)}">${includeSummary?`<p class="l1-explanation-summary">${esc(entry.summary)}</p>`:''}<p class="l1-explanation-text">${esc(entry.detail)}</p><details class="l1-explanation-sources"><summary>原文依据 · ${entry.sourceState==='located'?'快照出处可定位':'已声明，未全部核对'}</summary><p class="muted small">解释针对加载时的资料快照；可定位不表示命题或设计已验证。</p><ul>${sources}</ul></details></div>`;
  }
  function elementDetail(e,scope,options) {
    return `<h3>${esc(e.label)}</h3>${explanation(e.explanation,options)}<p class="mono">${esc(e.id)} · ${scope==='outside'?'主题外部对象':'本主题成员'}</p>
      <button class="btn" data-l1-element-open="${esc(e.id)}">在框架图中定位</button>
      <h4>出处标识</h4><p>${provenance(e,options)}</p><p class="muted small">标识本身不表示已核实；可从相关解释区块继续查原文。</p>`;
  }
  function relationDetail(r,vm,options) {
    const elements=[...vm.inside,...(vm.outside||[])],name=id=>elements.find(e=>e.id===id)?.label||id;
    return `<h3>${esc(r.explanation?.summary||r.label||r.type)}</h3>${explanation(r.explanation,options,false)}<p data-l1-role="${esc(r.role)}">${esc(r.from)} ${r.type==='relates-to'?'—':'→'} ${esc(r.to)} · ${esc(roles[r.role])}</p>
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
      return available?`<button class="btn" data-l1-block="${esc(id)}">${esc(id)} · ${esc(b.title)}<small>相关解释区块</small></button>`
        :`<p class="l1-unavailable"><span class="mono">${esc(id)}</span> · ${esc(b?.title||'已声明关联')}：当前未加载区块资料。</p>`;}).join('');
    const nodeButton=(n,position=true)=>`<button class="l1-node ${n.scope==='outside'?'l1-outside-node':''}" data-l1-node="${esc(n.id)}" data-l1-scope="${n.scope}" aria-pressed="false" aria-label="${esc((n.scope==='outside'?'主题外部对象：':'本主题成员：')+n.label+' · '+n.id)}" ${position?`style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px"`:''}><small>${esc(n.id)} · ${n.scope==='outside'?'主题外部':esc(n.type||'成员')}</small><strong>${esc(n.label)}</strong>${n.explanation?`<span class="l1-node-meaning">${esc(n.explanation.summary)}</span>`:vm.explanationState==='present'?'<span class="l1-node-meaning">未提供对象解释</span>':''}</button>`;
    const graph=vm.relations.length?`<div class="l1-graph-wrap" tabindex="0" role="region" aria-label="主题边界图，可滚动查看完整关系">
      <div class="l1-graph" style="width:${layout.bounds.width}px;height:${layout.bounds.height}px">
        <div class="l1-boundary-zone" style="left:12px;top:52px;width:${layout.insideBounds.width}px;height:${layout.insideBounds.height}px"><span>本主题涉及的对象</span></div>
        ${layout.outsideBounds?`<div class="l1-boundary-zone l1-outside-zone" style="left:${layout.outsideBounds.x}px;top:52px;width:${layout.outsideBounds.width}px;height:${layout.outsideBounds.height}px"><span>主题外部的连接对象</span></div>`:''}
        <svg class="l1-lines" width="${layout.bounds.width}" height="${layout.bounds.height}" aria-hidden="true"><defs><marker id="l1-direction" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" /></marker></defs>
          ${layout.edges.map(e=>`<path data-l1-relation="${e.relationIndex}" data-l1-role="${esc(e.role)}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" d="${e.d}" ${e.directed?'marker-end="url(#l1-direction)"':''}/>`).join('')}</svg>
        ${layout.nodes.map(n=>nodeButton(n)).join('')}
        ${layout.edges.map(e=>`<button class="l1-relation-label" data-l1-relation-button="${e.relationIndex}" data-l1-role="${esc(e.role)}" aria-pressed="false" aria-label="${esc((e.explanation?.summary||e.label||e.type)+'：'+e.from+(e.directed?' → ':' — ')+e.to+'，'+roles[e.role])}" style="left:${e.labelX-e.labelW/2}px;top:${e.labelY-e.labelH/2}px;width:${e.labelW}px;height:${e.labelH}px"><span>${esc(e.explanation?.summary||e.label||e.type)}</span><small>${esc(roles[e.role])}</small></button>`).join('')}
      </div></div>`:`<div class="l1-summary"><p>未声明可绘制关系；这里显示主题边界摘要。</p>${vm.inside.length?`<div class="l1-member-list">${vm.inside.map(e=>`<article class="l1-summary-card">${e.type==='constraint'?'<p class="l1-summary-kind">约束与边界</p>':''}${nodeButton({...e,scope:'inside'},false)}${explanation(e.explanation,options,false)}</article>`).join('')}</div>`:'<p>已明确没有主题成员。</p>'}</div>`;
    return `<section class="l1-topic-view" data-l1-topic="${esc(vm.topic.id)}" data-representation="${esc(vm.representation)}">
      <div class="reading-nav"><button class="btn" id="l1-back">返回</button><span class="muted small">${esc(doc.title||'当前文档')} · 主题</span></div>
      <header class="l1-heading"><span class="mono muted">${esc(vm.topic.id)}</span><h1>${esc(vm.topic.title)}</h1>${vm.topic.explanation?`${explanation(vm.topic.explanation,options)}<details><summary>原始主题命题</summary><p>${esc(vm.topic.proposition)}</p></details>`:`<p>${esc(vm.topic.proposition)}</p><p class="l1-explanation-missing">当前资料未提供主题解释；已知结构和区块入口仍保留。</p>`}
        <details><summary>文档身份与主题出处</summary><p>${esc(doc.id)} · ${esc(doc.role)}</p><p class="mono">${esc(doc.sourcePath)}</p><p>${provenance(vm.topic,options)}</p></details></header>
      <p class="l1-counts">涉及 ${vm.inside.length} 个对象 · 内部 ${vm.relations.length-crossing} 条关系 · 跨主题边界 ${crossing} 条</p>
      <p class="muted small">对象可同时参与多个主题。箭头表示已有方向；没有箭头的线只表示关联。</p>
      <div class="l1-workspace">${graph}<aside class="l1-selection-detail" id="l1-selection-detail" aria-label="所选对象或关系详情"><div class="l1-detail-head"><h2>含义与依据</h2><button class="btn tiny" id="l1-detail-toggle" aria-expanded="true">收起</button></div><div class="l1-detail-body"><p class="muted">点击对象或关系标签，查看完整解释、名称和出处。</p></div></aside></div>
      <section class="l1-blocks" data-block-organization="${esc(organization.state)}"><h2>进一步阅读</h2><p>${orgText}</p><div class="l1-block-entries">${blockHTML}</div></section>
      <details class="l1-all-details"><summary>成员与关系详情（${vm.inside.length} 个成员 / ${vm.relations.length} 条关系）</summary>
        ${vm.inside.map(e=>`<details><summary>${esc(e.id)} · ${esc(e.label)}</summary>${elementDetail(e,'inside',options)}</details>`).join('')}
        ${vm.relations.map(r=>`<details><summary data-l1-role="${esc(r.role)}">${esc(r.from)} —${esc(r.type)}${r.type==='relates-to'?'—':'→'} ${esc(r.to)}</summary>${relationDetail(r,vm,options)}</details>`).join('')}</details>
    </section>`;
  }
  function getSelection(host) {return host.querySelector('.l1-topic-view')?.__selection||null;}
  function restoreSelection(host,selection) {host.querySelector('.l1-topic-view')?.__select?.(selection);}
  function getDetailState(host){return host.querySelector('.l1-topic-view')?.__getDetailState?.()||null;}
  function restoreDetailState(host,state){if(state)host.querySelector('.l1-topic-view')?.__setDetailState?.(state);}
  function mount(host,vm,options={}) {
    const priorRoot=host.querySelector('.l1-topic-view'),priorSelection=priorRoot?.dataset.l1Topic===vm.topic.id?getSelection(host):null;
    host.__l1Abort?.abort();host.__l1Abort=new AbortController();
    const signal=host.__l1Abort.signal;
    host.innerHTML=renderTopicHTML(vm,options);
    const root=host.querySelector('.l1-topic-view'),panel=root.querySelector('#l1-selection-detail'),slot=panel.querySelector('.l1-detail-body'),toggle=panel.querySelector('#l1-detail-toggle');
    let detailScroll=0;
    root.__getDetailState=()=>{if(!slot.hidden)detailScroll=slot.scrollTop;return {collapsed:slot.hidden,scroll:detailScroll};};
    root.__setDetailState=({collapsed=false,scroll}={})=>{const hadFocus=slot.contains(document.activeElement);if(scroll!==undefined)detailScroll=scroll;else if(!slot.hidden)detailScroll=slot.scrollTop;slot.hidden=collapsed;panel.dataset.collapsed=String(collapsed);toggle.textContent=collapsed?'展开':'收起';toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',collapsed?'展开含义与依据':'收起含义与依据');if(!collapsed)slot.scrollTop=detailScroll;if(hadFocus&&collapsed)toggle.focus({preventScroll:true});};
    root.__setDetailState({collapsed:window.matchMedia('(max-width:1100px)').matches});
    const main=host.closest('#main');let pending=null;
    const resize=()=>{pending=null;if(!panel.isConnected)return;const bounds=main?.getBoundingClientRect(),narrow=window.matchMedia('(max-width:1100px)').matches;const available=narrow?(bounds?.height||innerHeight)*.55:(bounds?.bottom||innerHeight)-Math.max(bounds?.top||0,panel.getBoundingClientRect().top)-12;panel.style.setProperty('--l1-detail-height',Math.floor(Math.max(96,Math.min(innerHeight-24,available)))+'px');};
    const schedule=()=>{if(pending===null)pending=requestAnimationFrame(resize);};
    (main||window).addEventListener('scroll',schedule,{signal,passive:true});window.addEventListener('resize',schedule,{signal,passive:true});const observer=main?new ResizeObserver(schedule):null;observer?.observe(main);signal.addEventListener('abort',()=>{observer?.disconnect();if(pending!==null)cancelAnimationFrame(pending);},{once:true});schedule();
    root.__select=selection=>{
      const hadDetailFocus=slot.contains(document.activeElement);
      const e=selection?.kind==='element'?[...vm.inside,...(vm.outside||[])].find(n=>n.id===selection.id):null;
      const r=selection?.kind==='relation'?vm.relations[selection.index]:null;
      root.__selection=e?{kind:'element',id:e.id}:r?{kind:'relation',index:selection.index}:null;
      root.querySelectorAll('.is-hit').forEach(n=>n.classList.remove('is-hit'));
      root.querySelectorAll('[aria-pressed]').forEach(n=>n.setAttribute('aria-pressed','false'));
      slot.innerHTML=e?elementDetail(e,vm.inside.some(n=>n.id===e.id)?'inside':'outside',options):r?relationDetail(r,vm,options):'<p class="muted">点击对象或关系标签，查看完整名称、说明和出处标识。</p>';
      root.__setDetailState({collapsed:false,scroll:0});if(hadDetailFocus)toggle.focus({preventScroll:true});
      for(const n of root.querySelectorAll('[data-l1-node]'))if(e?n.dataset.l1Node===e.id:r?[r.from,r.to].includes(n.dataset.l1Node):false){n.classList.add('is-hit');if(e)n.setAttribute('aria-pressed','true');}
      for(const n of root.querySelectorAll('[data-l1-relation],[data-l1-relation-button]')) {
        const index=Number(n.dataset.l1Relation??n.dataset.l1RelationButton),edge=vm.relations[index];
        if(e?[edge.from,edge.to].includes(e.id):r?index===selection.index:false){n.classList.add('is-hit');if(r&&n.tagName==='BUTTON')n.setAttribute('aria-pressed','true');}
      }
    };
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.id==='l1-detail-toggle')root.__setDetailState({collapsed:!slot.hidden});
      else if(button.hasAttribute('data-l1-guide-source')){if(!button.disabled)options.onExplanationSource?.({namespace:button.dataset.l1GuideNamespace,key:button.dataset.l1GuideSource});}
      else if(button.id==='l1-back')options.onBack?.();
      else if(button.hasAttribute('data-l1-node'))root.__select({kind:'element',id:button.dataset.l1Node});
      else if(button.hasAttribute('data-l1-relation-button'))root.__select({kind:'relation',index:Number(button.dataset.l1RelationButton)});
      else if(button.hasAttribute('data-l1-element-open'))options.onElement?.(button.dataset.l1ElementOpen);
      else if(button.hasAttribute('data-l1-block'))options.onBlock?.(button.dataset.l1Block);
      else if(button.hasAttribute('data-l1-source'))options.onSourceRef?.(button.dataset.l1Source);
    },{signal});
    if(priorSelection)restoreSelection(host,priorSelection);
  }
  return {computeTopicLayout,renderTopicHTML,mount,getSelection,restoreSelection,getDetailState,restoreDetailState};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=L1TopicView;
if(typeof window!=='undefined')window.L1TopicView=L1TopicView;
