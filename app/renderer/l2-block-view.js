'use strict';
const L2BlockView=(()=>{
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const stages={what:'这是什么',how:'它怎么运行',prove:'怎样判断发生了',boundary:'边界与例外'};
 function contextHTML(block,{documentTitle='',originTopic=null}={}){
  const occurrence=block.topicOccurrences||{state:'unknown',values:[]},integrity=block.generationIntegrity;
  const warning=integrity?.state==='present'&&integrity.verdict!=='PASS'?`<p class="l2-generation-warning" role="status">生成资料提示：${esc(integrity.verdict==='PASS_WITH_WARNINGS'?'带有生成警告':integrity.verdict==='FAIL'?'生成检查未通过':'生成检查状态未知')}。这不是设计或证据判定，详情可在下方查看。</p>`:'';
  const coverage=block.realizedCoverage;
  const coverageText=coverage?.state==='available'?`已表达 ${coverage.covered} / 规划 ${coverage.total} 个语义单元${coverage.missing.length?'；未表达：'+coverage.missing.join('、'):''}`:coverage?.state==='not-applicable'?'规划明确没有覆盖单元，覆盖比例不适用':'尚无可计算的表达覆盖数据';
  const occurrenceText=occurrence.state==='unknown'?'主题关联尚未完整提供。':occurrence.state==='empty'?'已明确没有主题关联；此解释单元仍可独立阅读。':'以下主题声明了此解释单元，不能据此认定唯一归属。';
  const review=block.reviewObjectLinks;
  return `<header class="l2-heading"><p class="muted small">${esc(documentTitle)} · L2 解释单元</p><h1>${esc(block.title)}</h1><p>${originTopic?`从主题“${esc(originTopic.title)}”进入`:'独立打开当前解释单元'} · ${esc(stages[block.stage]||block.stage)}</p></header>${warning}
   <details class="l2-context"><summary>资料与核查信息</summary><p>规划决定解释范围，生成资料提供下方表达；可查出处不代表设计已经验证。</p>
    <h2>规划范围</h2><ul>${(block.plannedUnits||[]).map(u=>`<li><span class="mono">${esc(u.id)}</span> · ${esc(u.statement)}</li>`).join('')}</ul>${!block.plannedUnits?'<p>当前资料未提供规划语义单元。</p>':block.plannedUnits.length?'':'<p>规划明确没有覆盖单元。</p>'}
    <h2>生成与覆盖</h2><p>${esc(block.generatedExpression?.state==='present'?'已提供生成表达':block.generatedExpression?.state==='missing'?'当前区块的生成表达缺失':'尚未提供生成资料')}</p><p>${esc(coverageText)}</p><p>生成检查：${esc(integrity?.state==='present'?integrity.verdict:'未提供检查状态')}</p>
    <ul>${[...(integrity?.errors||[]),...(integrity?.warnings||[])].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <h2>相关主题</h2><p>${occurrenceText}</p><ul>${(occurrence.values||[]).map(t=>`<li>${esc(t.id)} · ${esc(t.title)}</li>`).join('')}</ul>
    <h2>审阅关联</h2><p>${review?.state==='unknown'?'尚未声明审阅关联':review?.state==='empty'?'已明确没有审阅关联':esc((review?.values||[]).join('、'))}</p><p>关联审阅对象与支持证据分别核查；点击区块或表达中的“出处”可继续查看。</p>
   </details>`;
 }
 function mount(host,block,options){
  if(!block?.id)throw new Error('L2 Block identity required');
  host.innerHTML='';const root=document.createElement('section');root.className='l2-page';root.dataset.l2Block=block.id;
  const nav=document.createElement('div');nav.className='reading-nav';const back=document.createElement('button');back.className='btn';back.id='reading-back';back.textContent='返回';back.addEventListener('click',options.onBack);nav.append(back);root.append(nav);
  const context=document.createElement('div');context.innerHTML=contextHTML(block,options);root.append(context);
  const expression=options.renderBlock(block);expression.tabIndex=-1;expression.setAttribute('aria-label',block.id+' · '+block.title);root.append(expression);host.append(root);
  return expression;
 }
 return {contextHTML,mount};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=L2BlockView;
if(typeof window!=='undefined')window.L2BlockView=L2BlockView;
