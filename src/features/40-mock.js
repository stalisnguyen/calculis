/* ================= MOCK EXAMS and DIAGNOSTIC =================
   Engine: sections run one after another; inside a section the next question is picked adaptively from the
   current ability estimate (diff closest to theta+3, unseen units first). No going back during a section; at the end
   the Question Review & Edit screen allows changing up to 3 answers (bookmarks help), as in the GMAT Focus Edition.
   Time up ends the section; unanswered questions count as wrong. */
const MK_TIME={quant:45*60,verbal:45*60,di:45*60};
const MK_N={quant:21,verbal:23,di:20};
const MK_PAT={quant:['ps'],verbal:['cr','cr','rc','cr','cr','rc','cr','rc','cr','cr','rc','cr'],di:['ds','gi','tpa','ds','ta','msr','ds','gi','tpa','ds','ta','ds','gi','tpa','ds','ta','ds']};
const DG_N={quant:6,verbal:5,di:4};
const DG_PAT={quant:['ps'],verbal:['cr'],di:['ds','tpa','ds','gi']};
const ORDERS=[['quant','verbal','di'],['quant','di','verbal'],['verbal','quant','di'],['verbal','di','quant'],['di','quant','verbal'],['di','verbal','quant']];
let MK=null;
function mkUsed(){const s=new Set();(P.mocks||[]).forEach(m=>(m.items||[]).forEach(it=>{const q=QI.get(it[0]);if(q)s.add(q.unit.id);}));return s;}
function mkPick(S){
  const used=MK.usedUnits, before=MK.prevUnits;
  const th=estTheta(S.qs.filter(q=>S.ans[q.qid]!=null).map(q=>({q,ok:isRight(q,S.ans[q.qid])})),S.prior)??S.prior;
  const target=clamp(th+3,1,5);
  const pat=S.pat, left=S.n-S.qs.length; if(left<=0)return false;
  let type=pat[S.slot%pat.length]; S.slot++;
  if((type==='rc'||type==='msr')&&left<3)type=S.sec==='verbal'?'cr':'ds';
  let pool=UNITS.filter(u=>u.sec===S.sec&&u.type===type&&!used.has(u.id));
  if(!pool.length)pool=UNITS.filter(u=>u.sec===S.sec&&!used.has(u.id)&&u.qs.length===1);
  if(!pool.length)return false;
  const rank=u=>Math.abs((u.diff||3)-target)*10+(before.has(u.id)?40:0)+(u.qs.some(q=>P.att[q.qid])?8:0)+Math.random()*4;
  const u=pool.map(u=>[rank(u),u]).sort((a,b)=>a[0]-b[0])[0][1];
  used.add(u.id);
  u.qs.slice(0,left).forEach(q=>S.qs.push(q));
  return true;
}
function mkNew(kind,order,breakAfter){
  const secs=kind==='full'?order:kind==='diag'?['quant','verbal','di']:[order[0]];
  MK={kind,order:secs,breakAfter:kind==='full'?breakAfter:-1,si:0,phase:'intro',usedUnits:new Set(),prevUnits:mkUsed(),t0:Date.now(),
    secs:secs.map(sec=>{const e=secEstimate(sec);return {sec,n:kind==='diag'?DG_N[sec]:MK_N[sec],pat:kind==='diag'?DG_PAT[sec]:MK_PAT[sec],slot:0,qs:[],ans:{},secs:{},flags:{},edits:0,i:0,
      left:kind==='diag'?0:MK_TIME[sec],prior:e.theta!=null?clamp(e.theta,-1.5,1.5):0};})};
  current='exam';try{history.pushState(null,'','#exam');}catch(e){}route();window.scrollTo(0,0);
}
VIEWS.exam=el=>{
  if(!MK){go('mock');return;}
  window.__busy=true;
  let tick=null, qStart=Date.now(), tab=0;
  window.__leave=()=>{clearInterval(tick);const c=$('#calc');if(c)c.remove();};
  window.__guard=()=>{if(!MK||MK.phase==='done')return true;const ok=confirm('Leave the exam? This attempt will be lost.');if(ok)MK=null;return ok;};
  const S=()=>MK.secs[MK.si];
  const startTick=()=>{clearInterval(tick);let last=Date.now();tick=setInterval(()=>{const s=S();if(!s||MK.kind==='diag'||!['q','review'].includes(MK.phase))return;const now=Date.now();s.left-=(now-last)/1000;last=now;
    const t=$('#exT span');if(t){t.textContent=fmtTime(s.left);$('#exT').classList.toggle('low',s.left<300);}
    if(s.left<=0){s.left=0;clearInterval(tick);toast('Time is up for this section.',3000);endSection(true);}},500);};
  const draw=()=>{
    const s=S();
    if(MK.phase==='intro'){
      const diag=MK.kind==='diag';
      el.innerHTML=`<div class="view"><div class="panel ex-intro">${mascot('hi',90)}<div><span class="label">${diag?'Diagnostic':`Section ${MK.si+1} of ${MK.secs.length}`}</span><h2>${SEC_LONG[s.sec]}</h2>
        <p>${diag?(MK.si===0?`About 15 questions across all three sections, roughly 25 minutes. Questions adapt to your answers. No feedback until the end, so just do your best and guess when stuck.</p><p class="note">Now: ${s.n} ${SEC_NAME[s.sec]} questions.`:`Next: ${s.n} ${SEC_NAME[s.sec]} questions.`)
          :`${s.n} questions, 45 minutes. ${s.sec==='quant'?'No calculator.':s.sec==='di'?'On-screen calculator allowed.':'Critical Reasoning and Reading Comprehension.'} You cannot go back during the section, but at the end you can review and change up to 3 answers. Bookmark questions you want to revisit.`}</p>
        <div class="row"><button class="btn primary" id="exGo">${ic('play')} Start ${SEC_NAME[s.sec]}</button><button class="btn ghost" id="exQuit">Quit</button></div></div></div></div>`;
      $('#exGo').onclick=()=>{MK.phase='q';if(!s.qs.length)mkPick(s);qStart=Date.now();startTick();draw();};
      $('#exQuit').onclick=()=>{MK=null;window.__guard=null;go('mock');};return;}
    if(MK.phase==='break'){
      let left=600;el.innerHTML=`<div class="view"><div class="panel ex-intro">${mascot('zzz',90)}<div><span class="label">Optional break</span><h2 class="num" id="brT">10:00</h2><p>Stretch, drink some water. The next section starts when you are ready or when the break ends.</p><div class="row"><button class="btn primary" id="brGo">Start the next section</button></div></div></div></div>`;
      clearInterval(tick);tick=setInterval(()=>{left--;const t=$('#brT');if(t)t.textContent=fmtTime(left);if(left<=0){clearInterval(tick);MK.phase='intro';draw();}},1000);
      $('#brGo').onclick=()=>{clearInterval(tick);MK.phase='intro';draw();};return;}
    if(MK.phase==='review'){drawReview();return;}
    if(MK.phase==='done'){mkResults(el);return;}
    // question
    const q=s.qs[s.i]; if(!q){endSection(false);return;}
    if(s.i===0||s.qs[s.i-1].unit!==q.unit)tab=0;
    const a=s.ans[q.qid];
    el.innerHTML=`<div class="view runv exv">
      <div class="run-top"><span class="pill">${SEC_NAME[s.sec]}</span><div class="run-prog"><span class="bar-track"><i style="width:${s.i/s.n*100}%"></i></span><span class="small muted num">${s.i+1}/${s.n}</span></div>
        ${MK.kind!=='diag'?`<span class="timer-chip num" id="exT">${ic('clock')}<span>${fmtTime(s.left)}</span></span>`:''}
        ${s.sec==='di'?`<button class="btn ghost sm" id="exCalc" aria-label="Calculator">${ic('calculator')}</button>`:''}
        <button class="btn ghost sm" id="exFlag" aria-pressed="${!!s.flags[q.qid]}" aria-label="Bookmark">${ic('bookmark')}</button></div>
      ${q.unit.qs.length>1?`<div class="q-meta"><span class="pill">Question ${q.i+1} of ${Math.min(q.unit.qs.length,s.qs.filter(x=>x.unit===q.unit).length)} for this ${q.type==='rc'?'passage':'set'}</span></div>`:''}
      ${unitScreen(q,a,{tab})}
      <div class="run-act"><div class="row"><button class="btn primary" id="exNext" ${complete(q,a)?'':'disabled'}>${s.i+1<s.n?'Next':'Finish section'} ${ic('chevron-right')}</button></div></div></div>`;
    bindCtx(el);$$('[data-tab]',el).forEach(b=>b.addEventListener('click',()=>{tab=+b.dataset.tab;}));
    bindQ($('.qa',el),q,()=>s.ans[q.qid],v=>{s.ans[q.qid]=v;$('#exNext').disabled=!complete(q,v);});
    const c=$('#exCalc');if(c)c.onclick=openCalc;
    $('#exFlag').onclick=()=>{s.flags[q.qid]=!s.flags[q.qid];$('#exFlag').setAttribute('aria-pressed',!!s.flags[q.qid]);};
    $('#exNext').onclick=()=>{s.secs[q.qid]=(s.secs[q.qid]||0)+(Date.now()-qStart)/1000;qStart=Date.now();s.i++;
      if(s.i>=s.qs.length&&s.qs.length<s.n)mkPick(s);
      if(s.i>=s.qs.length){if(MK.kind==='diag')endSection(true);else{MK.phase='review';draw();}}else draw();window.scrollTo(0,0);};
  };
  const drawReview=(open)=>{
    const s=S();
    if(open!=null){const q=s.qs[open];let a=s.ans[q.qid];const before=a;
      el.innerHTML=`<div class="view runv exv"><div class="run-top"><button class="btn ghost sm" id="rvBack">${ic('chevron-left')} Review list</button><span class="small muted">Question ${open+1}</span><span class="timer-chip num" id="exT">${ic('clock')}<span>${fmtTime(s.left)}</span></span>${s.sec==='di'?`<button class="btn ghost sm" id="exCalc">${ic('calculator')}</button>`:''}</div>
        <p class="note">Edits left: <b>${3-s.edits}</b>. ${s.edits>=3?'You have used all 3 edits, so answers are locked.':'Changing this answer uses one edit.'}</p>
        ${unitScreen(q,a,{lock:s.edits>=3})}<div class="row"><button class="btn primary" id="rvSave">Back to the list</button></div></div>`;
      bindCtx(el);if(s.edits<3)bindQ($('.qa',el),q,()=>a,v=>{a=v;});
      const c=$('#exCalc');if(c)c.onclick=openCalc;
      const back=()=>{if(JSON.stringify(a)!==JSON.stringify(before)&&complete(q,a)){if(s.edits<3){s.ans[q.qid]=a;s.edits++;}}drawReview();};
      $('#rvBack').onclick=back;$('#rvSave').onclick=back;return;}
    el.innerHTML=`<div class="view"><div class="panel"><div class="spread"><h2>Question Review &amp; Edit</h2><span class="timer-chip num" id="exT">${ic('clock')}<span>${fmtTime(s.left)}</span></span></div>
      <p class="note">${SEC_NAME[s.sec]}: open any question to look again. You can change up to <b>3</b> answers (${3-s.edits} left). Time keeps running.</p>
      <div class="rvgrid">${s.qs.map((q,i)=>`<button class="rvg ${s.flags[q.qid]?'fl':''}" data-o="${i}"><b class="num">${i+1}</b>${s.flags[q.qid]?ic('bookmark'):''}</button>`).join('')}</div>
      <div class="row"><button class="btn primary" id="rvEnd">End section</button></div></div></div>`;
    $$('[data-o]',el).forEach(b=>b.onclick=()=>drawReview(+b.dataset.o));
    $('#rvEnd').onclick=async()=>{if(await confirmBox('End this section?','You will not be able to come back to it.','End section','Keep reviewing'))endSection(false);};
  };
  const endSection=(timeUp)=>{
    const s=S(); s.done=true; s.timeUp=timeUp;
    while(!timeUp&&s.qs.length<s.n&&mkPick(s)){} // safety: only when pool ran short
    MK.si++;
    if(MK.si>=MK.secs.length){clearInterval(tick);MK.phase='done';mkFinish();draw();return;}
    MK.phase=MK.breakAfter===MK.si-1?'break':'intro';draw();
  };
  draw(); if(['q','review'].includes(MK.phase))startTick();
};
function mkFinish(){
  const rec={t:Date.now(),kind:MK.kind,full:MK.kind==='full',order:MK.order,items:[]};
  MK.secs.forEach(s=>{
    // pad unfinished sections: unseen questions count as wrong (unanswered)
    const res=s.qs.map(q=>({q,ok:isRight(q,s.ans[q.qid])}));
    const missing=MK.kind==='diag'?0:Math.max(0,s.n-s.qs.length); const filler={diff:3,type:'ps',sq:{}};
    for(let i=0;i<missing;i++)res.push({q:filler,ok:false});
    const th=estTheta(res);
    rec[s.sec]={score:secScore(th),theta:th,ok:res.filter(r=>r.ok).length,n:s.n,used:Math.round((MK_TIME[s.sec]-s.left)),edits:s.edits};
    s.qs.forEach(q=>{const a=s.ans[q.qid];if(a!=null)recordAttempt(q,a,s.secs[q.qid]||0,{mode:'mock'});rec.items.push([q.qid,isRight(q,a)?1:0,Math.round(s.secs[q.qid]||0)]);});
  });
  if(MK.kind==='full')rec.total=totalScore(rec.quant.score,rec.verbal.score,rec.di.score);
  if(MK.kind==='diag'){P.diag={t:rec.t};SECS.forEach(sec=>{P.diag[sec]=rec[sec].theta;P.diag[sec+'S']=rec[sec].score;});P.diag.total=totalScore(rec.quant.score,rec.verbal.score,rec.di.score);rec.total=P.diag.total;}
  P.mocks=(P.mocks||[]).concat([rec]).slice(-30); MK.rec=rec;
  touch('main'); award(MK.kind==='diag'?'diag':'mock',MK.kind==='section'?0.4:1); sfx('end');
}
function mkResults(el){
  const r=MK.rec, diag=MK.kind==='diag';
  const weakest=SECS.filter(s=>r[s]).sort((a,b)=>r[a].score-r[b].score)[0];
  const tgt=plCfg().target;
  el.innerHTML=`<div class="view">
    <div class="sc-hero">${mascot(r.total&&r.total>=tgt?'yay':'ok',100)}<div><span class="label" style="color:inherit;opacity:.85">${diag?'Diagnostic estimate':MK.kind==='full'?'Mock total':'Section score'}</span>
      <h2 class="num">${r.total!=null?r.total:r[MK.order[0]].score}</h2><p class="small" style="margin:0;opacity:.9">${r.total!=null?`Target ${tgt}. `:''}${diag?'A rough first read from 15 questions. Practice and mocks will sharpen it.':'Estimated with an adaptive model similar in spirit to the real exam. Treat it as a range of about plus or minus 40 points.'}</p></div></div>
    <div class="secsc">${MK.order.map(s=>`<div class="panel bd-c"><span class="small muted">${SEC_NAME[s]}</span><b class="num">${r[s].score}</b><span class="small muted num">${r[s].ok}/${r[s].n} right${diag?'':`, ${fmtTime(r[s].used)} used`}</span></div>`).join('')}</div>
    ${weakest?mcSay('idea',`Weakest section right now: <b>${SEC_LONG[weakest]}</b>. ${diag?'Your daily sets start at the level this test found.':'Open the error log to see which topics cost you most.'}`,56):''}
    <div class="row"><button class="btn primary" id="rsHome">Back to Today</button><button class="btn" id="rsErr">${ic('notebook-pen')} Error log</button><button class="btn ghost" id="rsMock">Mock exams</button></div>
    ${MK.secs.map(s=>`<div class="panel"><h3>${SEC_NAME[s.sec]} review</h3><div class="rv-list">${s.qs.map((q,i)=>{const ok=isRight(q,s.ans[q.qid]);return `<button class="rv-row" data-s="${s.sec}" data-i="${i}"><span class="rv-ic ${ok?'ok':'bad'}">${ic(ok?'check':'x')}</span><span class="rv-t"><b>${i+1}. ${esc(TYPE_NAME[q.type])}</b><span class="small muted">${esc(subLabel(q)||q.topic)}, ${DIFF_NAME[q.diff]}</span></span><span class="small muted num">${Math.round(s.secs[q.qid]||0)}s</span></button>`;}).join('')}</div></div>`).join('')}
  </div>`;
  window.__busy=false;window.__guard=null;
  $('#rsHome').onclick=()=>go('home');$('#rsErr').onclick=()=>go('errors');$('#rsMock').onclick=()=>go('mock');
  $$('[data-s]',el).forEach(b=>b.onclick=()=>{const s=MK.secs.find(x=>x.sec===b.dataset.s),q=s.qs[+b.dataset.i];reviewOne(q,s.ans[q.qid]);});
  if(r.total!=null&&r.total>=tgt&&!diag)setTimeout(()=>confetti({count:120}),300);
}

/* ---------- mock hub ---------- */
VIEWS.mock=el=>{
  if(!QS.length){el.innerHTML=`<div class="view"><p class="note">Loading...</p></div>`;loadBank().then(()=>{if(current==='mock')route();});return;}
  const st=store.get('calculis-mk',{o:0,b:1});
  const hist=(P.mocks||[]).slice().reverse();
  el.innerHTML=`<div class="view">
    <div class="panel"><h3>Full mock exam</h3><p class="note" style="margin:0">Three sections, 64 questions, 2 hours 15 minutes plus an optional 10 minute break. Scored 205-805 with section scores 60-90.</p>
      <span class="label">Section order</span><div class="row">${ORDERS.map((o,i)=>`<button class="chip" data-o="${i}" aria-pressed="${st.o===i}">${o.map(s=>s==='di'?'DI':SEC_NAME[s]).join(' - ')}</button>`).join('')}</div>
      <span class="label">Optional break</span><div class="row">${[[0,'After section 1'],[1,'After section 2'],[-1,'No break']].map(([k,t])=>`<button class="chip" data-b="${k}" aria-pressed="${st.b===k}">${t}</button>`).join('')}</div>
      <div class="row"><button class="btn primary" id="mkFull">${ic('clipboard-check')} Start full mock</button></div></div>
    <div class="panel"><h3>One section, timed</h3><p class="note" style="margin:0">45 minutes, adaptive, with Review &amp; Edit at the end.</p>
      <div class="row">${SECS.map(s=>`<button class="btn" data-sec="${s}">${SEC_NAME[s]} (${MK_N[s]} q)</button>`).join('')}</div></div>
    <div class="panel"><h3>Diagnostic</h3><p class="note" style="margin:0">${P.diag?`Last taken ${new Date(P.diag.t).toLocaleDateString('en-GB')}: about <b>${P.diag.total}</b>.`:'15 adaptive questions, about 25 minutes, to find your starting level.'}</p><div class="row"><button class="btn" id="mkDiag">${P.diag?'Retake diagnostic':'Take the diagnostic'}</button></div></div>
    <div class="panel"><h3>History</h3>${hist.length?`<div class="rv-list">${hist.map(m=>`<div class="kv"><span>${new Date(m.t).toLocaleDateString('en-GB')} ${m.kind==='full'?'Full mock':m.kind==='diag'?'Diagnostic':SEC_NAME[m.order[0]]+' section'}</span><b class="num">${m.total!=null?m.total+' ':''}<span class="small muted">${m.order.map(s=>(s==='di'?'DI':s[0].toUpperCase())+' '+(m[s]?m[s].score:'-')).join(', ')}</span></b></div>`).join('')}</div>`:'<p class="note">No mocks yet. A weekend mock is part of the plan.</p>'}</div>
  </div>`;
  $$('[data-o]',el).forEach(b=>b.onclick=()=>{st.o=+b.dataset.o;store.set('calculis-mk',st);$$('[data-o]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $$('[data-b]',el).forEach(b=>b.onclick=()=>{st.b=+b.dataset.b;store.set('calculis-mk',st);$$('[data-b]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $('#mkFull').onclick=()=>mkNew('full',ORDERS[st.o],st.b);
  $$('[data-sec]',el).forEach(b=>b.onclick=()=>mkNew('section',[b.dataset.sec],-1));
  $('#mkDiag').onclick=()=>mkNew('diag',SECS,-1);
};
VIEWS.diag=el=>{if(!QS.length){el.innerHTML=`<div class="view"><p class="note">Loading...</p></div>`;loadBank().then(()=>{if(current==='diag')route();});return;}mkNew('diag',SECS,-1);};
