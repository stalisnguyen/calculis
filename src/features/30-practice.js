/* ================= PRACTICE: section hubs (quant, verbal, di), set builder, session runner, error log ================= */
const PR_LAST=store.get('calculis-pr',{});
function prSave(){store.set('calculis-pr',PR_LAST);}
function secTopics(sec){const m=new Map();QS.filter(q=>q.sec===sec).forEach(q=>{m.set(q.topic,(m.get(q.topic)||0)+1);});return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));}
/* default mix when no topic is chosen: share of questions per topic family */
const MIX={verbal:[['rc',0.5],['cr',0.5]],di:[['ds',0.4],['ta',0.15],['gi',0.15],['tpa',0.15],['msr',0.15]]};
function unitPool(sec,{topics,diffs,types}={}){
  return UNITS.filter(u=>u.sec===sec&&(!types||types.includes(u.type))&&u.qs.some(q=>(!topics||!topics.length||topics.includes(q.topic))&&(!diffs||!diffs.length||diffs.includes(q.diff))));
}
function unitRank(u,target,fresh){
  const att=u.qs.map(q=>P.att[q.qid]);const seenN=att.filter(Boolean).length;const last=Math.max(0,...att.map(r=>r?r.last:0));
  const wrong=att.some(r=>r&&!r.lastOk);
  return (seenN?(fresh?1e6:0)+(wrong?-2e5:0)+last/1e6:0)+Math.abs((u.diff||3)-target)*10+Math.random()*6;
}
function pickSet(sec,{topics=[],diffs=[],n=10,fresh=true,target}={}){
  target=target!=null?target:plDiffFor(sec);
  const take=(pool,want,out)=>{const ranked=pool.map(u=>[unitRank(u,target,fresh),u]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
    let got=0;for(const u of ranked){if(got>=want)break;const qs=u.qs.filter(q=>(!topics.length||topics.includes(q.topic))&&(!diffs.length||diffs.includes(q.diff)));
      const room=want-got; if(qs.length>room+1&&got>0)continue; const sel=qs.slice(0,Math.max(room,Math.min(qs.length,room+1)));out.push(sel);got+=sel.length;}return got;};
  const blocks=[];
  if(!topics.length&&MIX[sec]){let left=n;const mix=MIX[sec];
    mix.forEach(([t,share],i)=>{if(left<=0)return;let want=i===mix.length-1?left:Math.max(t==='msr'&&n<8?0:1,Math.round(n*share));if(t==='msr'&&n<8)want=0;want=Math.min(want,left);if(!want)return;
      const got=take(unitPool(sec,{diffs,types:[t]}),want,blocks);left-=got;});
    if(left>0)take(unitPool(sec,{diffs}),left,blocks);
  }else take(unitPool(sec,{topics,diffs}),n,blocks);
  // keep multi-question units together, shuffle the order of blocks
  const seen=new Set();return shuffle(blocks).flat().filter(q=>!seen.has(q.qid)&&seen.add(q.qid));
}

/* ---------- section hub ---------- */
function prStats(sec){
  const rows=secTopics(sec).map(([t,total])=>{const qs=QS.filter(q=>q.sec===sec&&q.topic===t);let n=0,ok=0,tm=0,tt=0;
    qs.forEach(q=>{const r=P.att[q.qid];if(r){n++;if(r.lastOk)ok++;tm+=r.t||0;tt+=targetTime(q);}});return {t,total,n,ok,tm,tt};});
  return rows;
}
function prHub(sec){return el=>{
  const st=PR_LAST[sec]||(PR_LAST[sec]={topics:[],diffs:[],n:10,timed:false,fresh:true});
  if(!QS.length){el.innerHTML=`<div class="view"><p class="note">Loading questions...</p></div>`;loadBank().then(()=>{if(current===sec)route();});return;}
  const e=secEstimate(sec), rows=prStats(sec), tdiff=plDiffFor(sec), cnt=plCounts()[sec], doneT=secToday(sec);
  const tot=QS.filter(q=>q.sec===sec).length, att=rows.reduce((a,r)=>a+r.n,0);
  el.innerHTML=`<div class="view">
   <div class="sec-hero ${sec}"><div><span class="label" style="color:inherit;opacity:.85">${SEC_LONG[sec]}</span><h2>${e.score!=null?e.score:'--'}<span class="small" style="opacity:.8"> / 90 estimate</span></h2>
     <p class="small" style="margin:0;opacity:.9">${e.score!=null?`From your latest ${e.n} answers.`:`Answer ${Math.max(0,8-e.n)} more questions to get an estimate.`} ${att}/${tot} questions tried. Practising at <b>${DIFF_NAME[tdiff]}</b> (${DIFF_SCORE[tdiff]}).</p></div>${mascot(e.score>=83?'yay':'ok',84)}</div>
   <div class="panel"><div class="spread"><h3>Today's set</h3><span class="note num">${Math.min(doneT,cnt)}/${cnt} done today</span></div>
     <p class="note" style="margin:0">${sec==='quant'?'Problem Solving across all topics, no calculator.':sec==='verbal'?'A mix of Critical Reasoning and Reading Comprehension.':'Data Sufficiency plus table, chart, two-part and multi-source questions. Calculator allowed.'} Questions you have not seen come first, around your level.</p>
     <div class="row"><button class="btn primary" id="prGo">${ic('play')} Start ${cnt} questions</button><button class="btn" id="prTimed">${ic('timer')} Timed, exam pace</button></div></div>
   <div class="panel"><h3>Build your own set</h3>
     <span class="label">Topics</span><div class="row" id="prTop">${rows.map(r=>`<button class="chip" data-tp="${esc(r.t)}" aria-pressed="${st.topics.includes(r.t)}">${esc(r.t)} <span class="muted num">${r.total}</span></button>`).join('')}</div>
     <span class="label">Difficulty</span><div class="row" id="prDf"><button class="chip" data-df="0" aria-pressed="${!st.diffs.length}">Auto</button>${[1,2,3,4,5].map(d=>`<button class="chip" data-df="${d}" aria-pressed="${st.diffs.includes(d)}" title="${DIFF_SCORE[d]}">${DIFF_NAME[d]}</button>`).join('')}</div>
     <span class="label">Questions</span><div class="row" id="prN">${[5,10,15,20].map(n=>`<button class="chip" data-n="${n}" aria-pressed="${st.n===n}">${n}</button>`).join('')}</div>
     <div class="tg-list">${uiTg('prTm','Timed',st.timed,'Show a countdown at exam pace')}${uiTg('prFr','New questions first',st.fresh,'Off: mix in questions you got wrong before')}</div>
     <div class="row"><button class="btn primary" id="prBuild">Start this set</button></div></div>
   <div class="panel"><h3>By topic</h3><div class="tp-tbl">${rows.map(r=>`<button class="tp-row" data-tp1="${esc(r.t)}"><span class="tp-n"><b>${esc(r.t)}</b><span class="small muted">${r.n}/${r.total} tried${r.n?`, avg ${Math.round(r.tm/r.n)}s vs ${Math.round(r.tt/r.n)}s target`:''}</span></span><span class="bar-track"><i style="width:${r.n?Math.round(r.ok/r.n*100):0}%"></i></span><span class="num small ${r.n&&r.ok/r.n<0.6?'t1':''}">${r.n?Math.round(r.ok/r.n*100)+'%':'-'}</span></button>`).join('')}</div>
     <p class="note">Accuracy uses your latest attempt at each question. Tap a topic to practise it.</p></div>
  </div>`;
  $('#prGo').onclick=()=>prStart(pickSet(sec,{n:cnt}),{title:`${SEC_NAME[sec]}: today's set`,sec});
  $('#prTimed').onclick=()=>prStart(pickSet(sec,{n:cnt}),{title:`${SEC_NAME[sec]}: timed set`,sec,timed:true});
  $$('[data-tp]',el).forEach(b=>b.onclick=()=>{const t=b.dataset.tp;st.topics=st.topics.includes(t)?st.topics.filter(x=>x!==t):[...st.topics,t];b.setAttribute('aria-pressed',st.topics.includes(t));prSave();});
  $$('[data-df]',el).forEach(b=>b.onclick=()=>{const d=+b.dataset.df;st.diffs=d===0?[]:st.diffs.includes(d)?st.diffs.filter(x=>x!==d):[...st.diffs,d].sort();$$('[data-df]',el).forEach(x=>{const v=+x.dataset.df;x.setAttribute('aria-pressed',v===0?!st.diffs.length:st.diffs.includes(v));});prSave();});
  $$('[data-n]',el).forEach(b=>b.onclick=()=>{st.n=+b.dataset.n;$$('[data-n]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));prSave();});
  $('#prTm').onclick=()=>{st.timed=!st.timed;$('#prTm').setAttribute('aria-checked',st.timed);prSave();};
  $('#prFr').onclick=()=>{st.fresh=!st.fresh;$('#prFr').setAttribute('aria-checked',st.fresh);prSave();};
  $('#prBuild').onclick=()=>{const qs=pickSet(sec,{topics:st.topics,diffs:st.diffs,n:st.n,fresh:st.fresh,target:st.diffs.length?(st.diffs.reduce((a,b)=>a+b,0)/st.diffs.length):undefined});
    if(!qs.length){toast('No questions match. Loosen the filters.');return;}prStart(qs,{title:st.topics.length===1?st.topics[0]:`${SEC_NAME[sec]}: custom set`,sec,timed:st.timed});};
  $$('[data-tp1]',el).forEach(b=>b.onclick=()=>{const t=b.dataset.tp1;const qs=pickSet(sec,{topics:[t],n:st.n||10});if(!qs.length)return;prStart(qs,{title:t,sec});});
};}
VIEWS.quant=prHub('quant');VIEWS.verbal=prHub('verbal');VIEWS.di=prHub('di');

/* ---------- session runner ----------
   prStart(questions, {title, sec, timed, mode:'practice'|'errors'}) : one question at a time, answer, check, explanation. */
let PS=null;
function prStart(qs,opts){
  if(!qs.length){toast('No questions to show.');return;}
  PS=Object.assign({qs,i:0,ans:{},res:{},secs:{},t0:Date.now(),qStart:Date.now(),mode:'practice',tab:0},opts);
  PS.budget=opts.timed?qs.reduce((a,q)=>a+targetTime(q),0):0;
  current='session';try{history.pushState(null,'','#session');}catch(e){}route();window.scrollTo(0,0);
}
VIEWS.session=el=>{
  if(!PS){go('home');return;}
  window.__busy=true;
  let tick=null;
  window.__leave=()=>{clearInterval(tick);const c=$('#calc');if(c)c.remove();};
  window.__guard=()=>{if(!PS||PS.done||!Object.keys(PS.res).length)return true;return confirm('Leave this set? Answers so far are saved.');};
  const draw=()=>{
    if(PS.i>=PS.qs.length){prSummary(el);return;}
    const q=PS.qs[PS.i], a=PS.ans[q.qid], rev=q.qid in PS.res;
    if(PS.qStartFor!==q.qid){PS.qStart=Date.now();PS.qStartFor=q.qid;}
    const multi=q.unit.qs.length>1?` <span class="pill">Question ${q.i+1} of ${q.unit.qs.length} for this ${q.type==='rc'?'passage':'set'}</span>`:'';
    el.innerHTML=`<div class="view runv">
      <div class="run-top"><button class="btn ghost sm" id="rnX" aria-label="End set">${ic('x')}</button><div class="run-prog"><span class="bar-track"><i style="width:${PS.i/PS.qs.length*100}%"></i></span><span class="small muted num">${PS.i+1}/${PS.qs.length}</span></div>
        <span class="timer-chip num" id="rnT">${ic('clock')}<span>0:00</span></span>${q.sec==='di'?`<button class="btn ghost sm" id="rnCalc" aria-label="Calculator">${ic('calculator')}</button>`:''}</div>
      <div class="q-meta"><span class="pill">${esc(TYPE_NAME[q.type])}</span>${subLabel(q)?`<span class="pill">${esc(subLabel(q))}</span>`:''}<span class="pill d${q.diff}">${DIFF_NAME[q.diff]}</span>${multi}</div>
      ${unitScreen(q,a,{reveal:rev,tab:PS.tab})}
      <div class="run-act" id="rnAct">${rev?`${explainHTML(q,a)}<div id="rnWhy"></div><div class="row"><button class="btn primary" id="rnNext">${PS.i+1<PS.qs.length?'Next question':'See results'} ${ic('chevron-right')}</button><button class="btn need-ai" id="rnAsk" ${AI?'':'hidden'}>${ic('sparkles')} Ask Max</button><button class="btn ghost sm" id="rnRep">Report a problem</button></div>`
        :`<div class="row"><button class="btn primary" id="rnSub" ${complete(q,a)?'':'disabled'}>Check answer</button><button class="btn ghost" id="rnSkip">Skip</button></div>`}</div>
    </div>`;
    bindCtx(el);
    $$('[data-tab]',el).forEach(b=>b.addEventListener('click',()=>{PS.tab=+b.dataset.tab;}));
    const qa=$('.qa',el);
    if(!rev)bindQ(qa,q,()=>PS.ans[q.qid],v=>{PS.ans[q.qid]=v;const s=$('#rnSub');if(s)s.disabled=!complete(q,v);});
    $('#rnX').onclick=()=>{if(Object.keys(PS.res).length)prSummary(el);else go(PS.sec||'home');};
    const c=$('#rnCalc');if(c)c.onclick=openCalc;
    const sub=$('#rnSub');if(sub)sub.onclick=()=>{const secs=(Date.now()-PS.qStart)/1000;PS.secs[q.qid]=secs;
      const ok=recordAttempt(q,PS.ans[q.qid],secs);PS.res[q.qid]=ok;sfx(ok?'ok':'bad');
      award('q',1);if(ok)award('qok',1);if(PS.mode==='errors')award('err',1);
      const d=plDay();d['s_'+q.sec]=(d['s_'+q.sec]||0)+1;touch('main');
      draw();window.scrollTo({top:Math.max(0,$('#rnAct').getBoundingClientRect().top+scrollY-120),behavior:'smooth'});};
    const sk=$('#rnSkip');if(sk)sk.onclick=()=>{if(PS.i>=PS.qs.length-1){toast('This is the last question.');return;}PS.qs.push(PS.qs.splice(PS.i,1)[0]);PS.qStartFor=null;draw();};
    const nx=$('#rnNext');if(nx)nx.onclick=()=>{PS.i++;if(PS.qs[PS.i]&&PS.qs[PS.i].unit!==q.unit)PS.tab=0;draw();window.scrollTo(0,0);};
    const as=$('#rnAsk');if(as)as.onclick=()=>askMaxAbout(q,PS.ans[q.qid]);
    const rp=$('#rnRep');if(rp)rp.onclick=()=>reportQ(q);
    if(rev&&!PS.res[q.qid]){const w=$('#rnWhy');const e=P.err[q.qid]||{};w.innerHTML=`<div class="why"><span class="small"><b>Why did you miss it?</b> Tagging mistakes shows your patterns in the error log.</span><div class="row">${ERR_REASONS.map(([k,t])=>`<button class="chip sm" data-why="${k}" aria-pressed="${e.reason===k}">${t}</button>`).join('')}</div></div>`;
      $$('[data-why]',w).forEach(b=>b.onclick=()=>{if(P.err[q.qid]){P.err[q.qid].reason=b.dataset.why;touch('main');}$$('[data-why]',w).forEach(x=>x.setAttribute('aria-pressed',x===b));});}
    refreshAIBits();
  };
  const clock=()=>{const t=$('#rnT span');if(!t||!PS)return;const q=PS.qs[PS.i];
    if(PS.budget){const left=PS.budget-(Date.now()-PS.t0)/1000;t.textContent=(left<0?'-':'')+fmtTime(Math.abs(left));$('#rnT').classList.toggle('low',left<60);}
    else if(q&&!(q.qid in PS.res)){const s=(Date.now()-PS.qStart)/1000;t.textContent=fmtTime(s);$('#rnT').classList.toggle('low',s>targetTime(q)*1.5);}};
  tick=setInterval(clock,500);
  draw();clock();
};
function prSummary(el){
  PS.done=true; const qs=PS.qs.filter(q=>q.qid in PS.res), ok=qs.filter(q=>PS.res[q.qid]).length;
  const tm=qs.reduce((a,q)=>a+(PS.secs[q.qid]||0),0), tt=qs.reduce((a,q)=>a+targetTime(q),0);
  const pct=qs.length?ok/qs.length:0;
  el.innerHTML=`<div class="view">
    <div class="panel quiz-end">${mascot(pct>=0.8?'yay':pct>=0.5?'ok':'hmm',100)}<h2>${ok}/${qs.length} correct</h2>
      <p class="note">${fmtTime(tm)} total, ${qs.length?Math.round(tm/qs.length):0}s per question (target ${qs.length?Math.round(tt/qs.length):0}s). ${pct>=0.8?'Max approves. Time to try harder ones.':pct>=0.5?'Solid. Review the misses below.':'Tough set. Read the explanations, then retry from the error log.'}</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="smAgain">Another set</button><button class="btn" id="smErr">${ic('notebook-pen')} Error log</button><button class="btn ghost" id="smHome">Today</button></div></div>
    <div class="panel"><h3>Review</h3><div class="rv-list">${qs.map((q,i)=>`<button class="rv-row" data-i="${PS.qs.indexOf(q)}"><span class="rv-ic ${PS.res[q.qid]?'ok':'bad'}">${ic(PS.res[q.qid]?'check':'x')}</span><span class="rv-t"><b>${i+1}. ${esc(TYPE_NAME[q.type])}</b><span class="small muted">${esc(subLabel(q)||q.topic)}, ${DIFF_NAME[q.diff]}</span></span><span class="small muted num">${Math.round(PS.secs[q.qid]||0)}s</span></button>`).join('')}</div></div></div>`;
  window.__busy=false; window.__guard=null;
  $('#smAgain').onclick=()=>go(PS.sec||'quant');$('#smErr').onclick=()=>go('errors');$('#smHome').onclick=()=>go('home');
  $$('[data-i]',el).forEach(b=>b.onclick=()=>reviewOne(PS.qs[+b.dataset.i],PS.ans[PS.qs[+b.dataset.i].qid]));
  uiChips();
}
/* read-only review of one answered question in a modal */
function reviewOne(q,a){
  const m=modal(`<div class="q-meta"><span class="pill">${esc(TYPE_NAME[q.type])}</span>${subLabel(q)?`<span class="pill">${esc(subLabel(q))}</span>`:''}<span class="pill d${q.diff}">${DIFF_NAME[q.diff]}</span></div>${unitScreen(q,a,{reveal:true})}${explainHTML(q,a)}<div class="row"><button class="btn need-ai" id="rvAsk" ${AI?'':'hidden'}>${ic('sparkles')} Ask Max</button></div>`);
  m.el.classList.add('wide');bindCtx(m.el);const b=$('#rvAsk',m.el);if(b)b.onclick=()=>{m.close();askMaxAbout(q,a);};
}
function reportQ(q){
  const m=modal(`<h2>Report a problem</h2><p class="note">What is wrong with this question? It is saved with your progress so the group can fix it.</p><textarea id="rpT" rows="4" placeholder="e.g. the answer should be C because..."></textarea><div class="row"><button class="btn primary" id="rpGo">Save report</button></div>`);
  $('#rpGo',m.el).onclick=()=>{const t=$('#rpT',m.el).value.trim();if(!t)return;P.reports=P.reports||[];P.reports.push({id:q.qid,t:Date.now(),text:t.slice(0,600)});touch('main');m.close();toast('Thanks, saved.');};
}

/* ---------- error log ---------- */
let ER_F='all';
VIEWS.errors=el=>{
  if(!QS.length){el.innerHTML=`<div class="view"><p class="note">Loading...</p></div>`;loadBank().then(()=>{if(current==='errors')route();});return;}
  const open=errOpen(), fixed=errFixed();
  const list=open.filter(x=>ER_F==='all'||x.q.sec===ER_F);
  const reasons={};open.forEach(x=>{if(x.reason)reasons[x.reason]=(reasons[x.reason]||0)+1;});
  const byTopic={};open.forEach(x=>{byTopic[x.q.topic]=(byTopic[x.q.topic]||0)+1;});
  const topT=Object.entries(byTopic).sort((a,b)=>b[1]-a[1]).slice(0,4);
  el.innerHTML=`<div class="view">
    ${open.length?`<div class="panel"><div class="spread"><h3>${open.length} questions to fix</h3><button class="btn primary sm" id="erAll">${ic('repeat')} Retry ${Math.min(10,list.length)}</button></div>
      <p class="note" style="margin:0">A question leaves the log after you answer it right twice. ${topT.length?`Most misses: ${topT.map(([t,n])=>`<b>${esc(t)}</b> (${n})`).join(', ')}.`:''}</p>
      ${Object.keys(reasons).length?`<div class="row">${ERR_REASONS.filter(([k])=>reasons[k]).map(([k,t])=>`<span class="pill">${t}: ${reasons[k]}</span>`).join('')}</div>`:''}</div>`
      :mcSay('yay','The error log is empty. Every question you miss lands here, so you can come back and fix it.',64)}
    ${open.length?subTabs('erF',[['all','All'],['quant','Quant'],['verbal','Verbal'],['di','Data Insights']],ER_F,t=>{ER_F=t;VIEWS.errors(el);}):''}
    <div class="rv-list">${list.map(x=>`<div class="er-row"><button class="rv-row" data-q="${esc(x.id)}"><span class="rv-ic bad">${ic('x')}</span><span class="rv-t"><b>${esc(TYPE_NAME[x.q.type])}: ${esc(subLabel(x.q)||x.q.topic)}</b><span class="small muted">${SEC_NAME[x.q.sec]}, ${DIFF_NAME[x.q.diff]}, missed ${x.miss||1}x, ${new Date(x.last).toLocaleDateString('en-GB')}${x.fix?`, right ${x.fix}/2`:''}</span></span></button>
      <select data-rs="${esc(x.id)}" aria-label="Reason"><option value="">Why?</option>${ERR_REASONS.map(([k,t])=>`<option value="${k}" ${x.reason===k?'selected':''}>${t}</option>`).join('')}</select></div>`).join('')}</div>
    ${fixed.length?`<details class="adv"><summary>Fixed (${fixed.length})</summary><div class="rv-list">${fixed.slice(0,60).map(x=>`<button class="rv-row" data-q="${esc(x.id)}"><span class="rv-ic ok">${ic('check')}</span><span class="rv-t"><b>${esc(TYPE_NAME[x.q.type])}: ${esc(subLabel(x.q)||x.q.topic)}</b><span class="small muted">${SEC_NAME[x.q.sec]}, fixed ${new Date(x.done).toLocaleDateString('en-GB')}</span></span></button>`).join('')}</div></details>`:''}
  </div>`;
  const all=$('#erAll');if(all)all.onclick=()=>prStart(shuffle(list).slice(0,10).map(x=>x.q),{title:'Error log retry',mode:'errors',sec:ER_F==='all'?'quant':ER_F});
  $$('[data-q]',el).forEach(b=>b.onclick=()=>{const q=QI.get(b.dataset.q);prStart([q],{title:'Retry',mode:'errors',sec:q.sec});});
  $$('[data-rs]',el).forEach(s=>s.onchange=()=>{const e=P.err[s.dataset.rs];if(e){e.reason=s.value;touch('main');}});
};
