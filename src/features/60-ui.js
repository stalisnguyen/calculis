/* ================= UI SHELL: groups, bottom nav / sidebar, Today, Progress, Settings, celebrations, intro ================= */
const UI_GROUPS=[
  {k:'today',label:'Today',icon:'house',views:['home']},
  {k:'practice',label:'Practice',icon:'target',views:['quant','verbal','di','errors','mental']},
  {k:'mock',label:'Mock',icon:'clipboard-check',views:['mock']},
  {k:'learn',label:'Learn',icon:'book-open',views:['start','lessons','glossary','cards','tutor']},
  {k:'me',label:'Me',icon:'user-round',views:['progress','friends','settings']},
];
const UI_ALIAS={session:'quant',exam:'mock',diag:'mock',lesson:'lessons'};
const UI_V={home:['Today','house'],quant:['Quant','sigma'],verbal:['Verbal','book-open'],di:['Data Insights','bar-chart'],errors:['Error log','notebook-pen'],mental:['Mental math','zap'],start:['Start here','graduation-cap'],glossary:['Glossary','book-a'],
  mock:['Mock exams','clipboard-check'],lessons:['Lessons','book-open'],cards:['Flashcards','layers'],tutor:['Ask Max','sparkles'],
  progress:['Progress','trophy'],friends:['Study group','users'],settings:['Settings','settings']};
const uiGroupOf=v=>{v=UI_ALIAS[v]||v;return UI_GROUPS.find(g=>g.views.includes(v))||UI_GROUPS[0];};
const UI_LAST=store.get('calculis-lastv',{});
const uiReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

function uiInit(){
  const fl=document.createElementNS('http://www.w3.org/2000/svg','svg');fl.setAttribute('width','0');fl.setAttribute('height','0');fl.style.position='absolute';
  fl.innerHTML='<defs><linearGradient id="flameG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB020"/><stop offset="1" stop-color="#FF6A1A"/></linearGradient></defs>';document.body.appendChild(fl);
  $('#brandMc').innerHTML=foxSVG('calm',44,mcRankIdx());$('#brandMc2').innerHTML=foxSVG('calm',38,mcRankIdx());
  $('#brand').onclick=()=>go('home');$('#brandSm').onclick=()=>go('home');
  $('#tgAa').onclick=uiAaSheet;
  $('#stChip').onclick=$('#stChip2').onclick=()=>go('progress');
  $('#bnav').innerHTML=UI_GROUPS.map(g=>`<button data-g="${g.k}" aria-label="${g.label}"><span class="ind">${ic(g.icon)}</span><span>${g.label}</span></button>`).join('');
  $$('#bnav [data-g]').forEach(b=>b.onclick=()=>uiGoGroup(b.dataset.g));
  document.addEventListener('pointerdown',e=>{UI_PT={x:e.clientX,y:e.clientY};},{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.mc-cele');if(m&&!m.classList.contains('locked'))m.remove();}});
}
let UI_PT=null;
function uiGoGroup(k){const g=UI_GROUPS.find(x=>x.k===k);const v=UI_LAST[k]&&g.views.includes(UI_LAST[k])?UI_LAST[k]:g.views[0];go(v);}
function uiNav(){
  const v=UI_ALIAS[current]||current, g=uiGroupOf(current);
  if(UI_LAST[g.k]!==v&&g.views.includes(v)&&!UI_ALIAS[current]){UI_LAST[g.k]=v;store.set('calculis-lastv',UI_LAST);}
  let due=0,er=0;try{due=CARDS.length?cardsDue().length:0;er=QS.length?errOpen().length:0;}catch(e){}
  const badge=k=>k==='learn'&&due?`<span class="badge num">${due>99?'99+':due}</span>`:k==='practice'&&er?`<span class="badge num">${er>99?'99+':er}</span>`:'';
  $$('#bnav [data-g]').forEach(b=>{if(b.dataset.g===g.k)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');const old=$('.badge',b);if(old)old.remove();const bd=badge(b.dataset.g);if(bd)b.insertAdjacentHTML('beforeend',bd);});
  $('#sideNav').innerHTML=UI_GROUPS.map(x=>{const on=x.k===g.k;const solo=x.views.length===1;
    return `<button class="g${solo?' solo':''}" data-g="${x.k}" ${on?'aria-current="page"':''}>${ic(x.icon)}<span>${x.label}</span>${badge(x.k)}</button>`+
      (on&&!solo?`<div class="sub">${x.views.map(w=>`<button data-v="${w}" ${w===v?'aria-current="page"':''}>${UI_V[w][0]}</button>`).join('')}</div>`:'');}).join('');
  $$('#sideNav [data-g]').forEach(b=>b.onclick=()=>uiGoGroup(b.dataset.g));
  $$('#sideNav [data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v));
  const busy=current==='session'||current==='exam';
  $('#pgTitle').textContent=current==='session'&&PS?PS.title:current==='exam'?(MK&&MK.kind==='diag'?'Diagnostic':'Mock exam'):g.k==='today'?'Today':(UI_V[v]?UI_V[v][0]:g.label);
  document.title=g.k==='today'?"Calculis - Stalis's GMAT":(UI_V[v]?UI_V[v][0]:'Calculis')+' - Calculis';
  const sn=$('#subnav');
  if(g.views.length>1&&!busy){sn.innerHTML=g.views.map(w=>`<button role="tab" data-v="${w}" aria-selected="${w===v}">${ic(UI_V[w][1])}${UI_V[w][0]}</button>`).join('');
    $$('[data-v]',sn).forEach(b=>b.onclick=()=>go(b.dataset.v));
    const on=$('[aria-selected="true"]',sn);if(on&&on.scrollIntoView)setTimeout(()=>{try{on.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}},0);}
  else sn.innerHTML='';
  document.body.classList.toggle('busy',busy);
  uiChips();
}
function uiStudied(k){const d=(P.day||{})[k];return !!((d&&d.xp)||P.hist[k]);}
let UI_RANK=-1;
function uiChips(){
  const st=streak(), hot=uiStudied(ymd(Date.now()));
  const html=`<svg class="i" aria-hidden="true" style="fill:${hot?'url(#flameG)':'var(--line2)'}"><use href="#i-flame"/></svg><span class="num">${st}</span>`;
  ['#stChip','#stChip2'].forEach(s=>{const e=$(s);if(e){e.innerHTML=html;e.classList.toggle('cold',!hot);e.title=st+' day streak';}});
  const x=$('#xpChip');if(x){x.innerHTML=`${ic('zap')}<span>${(plDay().xp||0)}</span>`;}
  const r=mcRankIdx();if(UI_RANK!==r){UI_RANK=r;const a=$('#brandMc'),b=$('#brandMc2');if(a)a.innerHTML=foxSVG('calm',44,r);if(b)b.innerHTML=foxSVG('calm',38,r);}
}

/* ---------- Today ---------- */
const UI_SHORT={path:'Path',mm:'Mental',quant:'Quant',verbal:'Verbal',di:'DI',cards:'Cards',lesson:'Lesson',err:'Errors',mock:'Mock'};
function uiGreet(){const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening';}
function uiRing(pct,size){const p=Math.round(Math.min(1,pct)*100);return `<div class="ring-box" style="width:${size}px;height:${size}px"><svg class="ring ${p>=100?'full':''}" viewBox="0 0 72 72" width="${size}" height="${size}" role="img" aria-label="${p}% of goal"><circle cx="36" cy="36" r="30" class="ring-track"/><circle cx="36" cy="36" r="30" class="ring-fill" pathLength="100" style="stroke-dasharray:${p} 100;${p?'':'opacity:0'}"/></svg><span class="ring-n num">${p>=100?ic('check'):p+'%'}</span></div>`;}
function uiWeek(){
  const t=today(), dow=(new Date(t).getDay()+6)%7, mon=t-dow*DAY, names=['Mo','Tu','We','Th','Fr','Sa','Su'];
  return `<div class="wk">${names.map((n,i)=>{const d=mon+i*DAY,k=ymd(d),done=uiStudied(k),isT=d===t,fut=d>t;
    return `<div class="wk-d ${done?'on':''} ${isT?'is-today':''} ${fut?'fut':''}"><span class="wk-n">${n}</span><span class="wk-c">${done?ic('check'):new Date(d).getDate()}</span></div>`;}).join('')}</div>`;
}
function scoreCard(){
  const sc=scoreNow(), c=plCfg(), days=c.date?Math.ceil((new Date(c.date).getTime()-today())/DAY):null;
  const reached=sc.total!=null&&sc.total>=c.target;
  const sub=sc.total==null?(SECS.some(s=>sc[s]!=null)?`Need an estimate in all three sections. ${SECS.filter(s=>sc[s]==null).map(s=>SEC_NAME[s]).join(', ')} still missing.`:'Take the diagnostic or answer a few sets to get an estimate.'):sc.src==='mock'?'Based on your latest mock and practice.':'Based on your recent practice answers.';
  return `<button class="mini band-mini" data-go="progress"><span class="label">Score estimate</span><span class="bm-row"><span class="mini-n num">${fmtScore(sc.total)}</span>${reached?`<span class="bm-ok">Target ${c.target} reached</span>`:`<span class="bm-arrow">-></span><span class="bm-t num">${c.target}</span>`}</span>
    <span class="sc3">${SECS.map(s=>`<span><span class="small muted">${s==='di'?'DI':SEC_NAME[s]}</span><b class="num">${fmtScore(sc[s])}</b></span>`).join('')}</span>
    <span class="mini-l">${sub}${days!=null&&days>0?` ${days} days to the exam.`:''}</span>${reached&&c.target<805?`<span class="mini-a" data-plan="1">Raise target to ${TARGETS.find(t=>t>c.target)||805} ${ic('chevron-right')}</span>`:''}</button>`;
}
VIEWS.home=el=>{
  plCfg();
  const tasks=plTasks(), d=plDay(), goal=plGoalXP(), xpT=plXPTotal(), {r,nx}=plRank(xpT);
  const doneN=tasks.filter(t=>t.done).length, next=tasks.find(t=>!t.done);
  const label=next?(doneN?'Continue: ':'Start: ')+next.t.charAt(0).toLowerCase()+next.t.slice(1):'All done today. One more set?';
  const lo=nx?nx[0]-r[0]:1, pr=nx?(xpT-r[0])/lo:1;
  const firstTime=!P.diag&&Object.keys(P.att).length<15;
  const lod=typeof lessonOfDay==='function'?lessonOfDay():null;
  const err=QS.length?errOpen().length:0;
  el.innerHTML=`<div class="view home2">
   <div class="hm-hello">${mascot(doneN===tasks.length?'yay':'hi',64)}<div><h2 class="hm-greet">${uiGreet()}, ${esc(uiName())}</h2><p class="note">${doneN===tasks.length?'Everything done for today. Max is proud of you.':doneN?`${doneN}/${tasks.length} tasks done today. Keep going.`:'A little every day adds up to a big score. Let us go.'}</p></div></div>
   ${SYNC==='web'&&syncState==='off'?`<div class="vbanner">${mcSay('hmm','Your progress is only saved on this device. Enter the group password to sync across devices and appear on the study group board.',48)}<div class="row"><button class="btn primary sm" id="hmSync">Enter group password</button></div></div>`:''}
   ${uiWeek()}
   <div class="hm-grid">
    <div class="hm-main">
     <section class="sess" aria-label="Today's session">
      <div class="sess-top"><div><div class="sess-k">Today's session</div><div class="sess-x"><b class="num">${d.xp||0}</b> / ${goal} XP</div><div class="sess-s">${doneN}/${tasks.length} tasks, about ${plCfg().minutes} minutes</div></div>${uiRing((d.xp||0)/goal,76)}</div>
      <ol class="path">${tasks.map(t=>`<li class="${t.done?'on':''} ${t===next?'cur':''}"><i></i><span>${UI_SHORT[t.k]||t.t}</span></li>`).join('')}</ol>
      <button class="btn sess-go" id="hmGo">${esc(label)} ${ic('chevron-right')}</button>
     </section>
     <div class="tasks">${tasks.map(t=>`<button class="task ${t.done?'done':''}" data-go="${t.go}" data-k="${t.k}"><span class="tk-c">${t.done?ic('check'):ic(UI_V[t.go]?UI_V[t.go][1]:'sparkles')}</span><span class="tk-t"><span><b>${esc(t.t)}</b>${t.n?` <span class="num muted small">${Math.min(t.n[0],t.n[1])}/${t.n[1]}</span>`:''}</span><span class="small muted">${esc(t.sub)}</span></span>${ic('chevron-right','tk-a')}</button>`).join('')}</div>
     ${firstTime?mcSay('idea',`New to the GMAT? Begin with the <button class="lnk" data-go="start">Start here path</button>: short lessons, easy questions, one step at a time. Already studied before? Take the <button class="lnk" data-go="diag">15-question diagnostic</button> instead.`,56):''}
    </div>
    <div class="hm-side">
     ${scoreCard()}
     <button class="mini" data-go="errors"><span class="mini-n num">${err}</span><span class="mini-l">${err?'questions in the error log':'Error log is empty'}</span><span class="mini-a">${err?'Fix a few':'Practise'} ${ic('chevron-right')}</span></button>
     <button class="mini rank" data-go="progress"><span class="seal-rk">${r[1]}</span><span class="mini-l">${esc(r[2])}</span><span class="bar-track"><i style="width:${Math.round(pr*100)}%"></i></span><span class="small muted num">${nx?`${xpT-r[0]}/${lo} XP to ${nx[1]}`:'Top title reached'}</span></button>
     ${lod?`<button class="panel cul-inv" data-lesson="${esc(lod.id)}"><span class="cul-ic">${ic('graduation-cap')}</span><span style="min-width:0"><span class="label">Lesson for today</span><b class="cul-t">${esc(lod.title)}</b></span>${ic('chevron-right')}</button>`:''}
    </div>
   </div></div>`;
  $('#hmGo').onclick=()=>{if(next)uiTaskGo(next);else go('quant');};
  const hs=$('#hmSync',el);if(hs)hs.onclick=async()=>{if(await askPassword(false)){await pullRemote();renderSync();route();}};
  const bp=$('[data-plan]',el);if(bp)bp.onclick=e=>{e.stopPropagation();const c=plCfg();c.target=TARGETS.find(t=>t>c.target)||805;touch('main');toast('New target: '+c.target);VIEWS.home(el);};
  $$('[data-go]',el).forEach(b=>b.onclick=()=>{const t=tasks.find(x=>x.k===b.dataset.k);if(t)uiTaskGo(t);else go(b.dataset.go);});
  const ls=$('[data-lesson]',el);if(ls)ls.onclick=()=>openLesson(ls.dataset.lesson);
  if(!LESSONS.length&&typeof loadLearn==='function')loadLearn().then(()=>{if(current==='home'&&!$('[data-lesson]'))VIEWS.home(el);});
  uiFriendsCard();
};
/* a task button jumps straight into the activity where that makes sense */
function uiTaskGo(t){
  if(['quant','verbal','di'].includes(t.k)&&QS.length){const left=Math.max(3,(t.n?t.n[1]-t.n[0]:5));prStart(pickSet(t.k,{n:left}),{title:`${SEC_NAME[t.k]}: today's set`,sec:t.k});return;}
  if(t.k==='lesson'){const l=lessonOfDay();if(l){openLesson(l.id);return;}}
  if(t.k==='path'&&t.step){runStep(t.step);return;}
  go(t.go);
}

/* ---------- Me: progress ---------- */
VIEWS.progress=el=>{
  const c=plCfg(), xpT=plXPTotal(),{r,nx}=plRank(xpT),ri=PL_RANKS.indexOf(r),wk=plWeek();
  const heat=[];const start=today()-83*DAY;for(let i=0;i<84;i++){const k=ymd(start+i*DAY);const n=((P.day||{})[k]||{}).xp||0;heat.push(n===0?'':n<30?'h1':n<70?'h2':n<120?'h3':'h4');}
  const sc=scoreNow();
  const tried=Object.keys(P.att).length, okN=Object.values(P.att).filter(x=>x.lastOk).length;
  const mocks=(P.mocks||[]).filter(m=>m.total!=null).slice(-10);
  const spark=mocks.length>1?(()=>{const W=300,H=70,xs=mocks.map((_,i)=>8+i*(W-16)/(mocks.length-1)),lo=Math.min(...mocks.map(m=>m.total))-20,hi=Math.max(...mocks.map(m=>m.total),c.target)+20,Y=v=>H-6-(v-lo)/(hi-lo)*(H-12);
    return `<svg viewBox="0 0 ${W} ${H}" class="spark"><line x1="0" x2="${W}" y1="${Y(c.target)}" y2="${Y(c.target)}" class="ch-g"/><polyline points="${mocks.map((m,i)=>xs[i]+','+Y(m.total)).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${mocks.map((m,i)=>`<circle cx="${xs[i]}" cy="${Y(m.total)}" r="3.5" fill="var(--accent)"><title>${m.total}</title></circle>`).join('')}</svg>`;})():'';
  el.innerHTML=`<div class="view">
   <div class="rk-hero">${mascot('ok',110)}<div><span class="label" style="color:inherit;opacity:.85">Title</span><h2>${r[1]}</h2><p class="small" style="margin:2px 0 8px;opacity:.9">${esc(r[2])}</p>
     <div class="bar-track lt"><i style="width:${nx?Math.round((xpT-r[0])/(nx[0]-r[0])*100):100}%"></i></div><div class="small num" style="margin-top:4px;opacity:.9">${xpT} XP${nx?`, ${nx[0]-xpT} XP to ${nx[1]}`:''}</div></div></div>
   <div class="ranks">${PL_RANKS.map((x,i)=>`<div class="rk ${i<=ri?'on':''}" title="${x[1]}: ${x[0]} XP">${foxSVG(i<=ri?'calm':'zzz',44,i)}<span class="rk-n">${x[1]}</span><span class="small">${x[0]} XP</span></div>`).join('')}</div>
   <div class="panel"><div class="spread"><h3>Scores</h3><span class="note">Target ${c.target}</span></div>
     <div class="bands sc4">${SECS.map(s=>`<div class="bd-c"><span class="small muted">${SEC_NAME[s]}</span><b class="num">${fmtScore(sc[s])}</b><span class="small muted">${sc.n[s].n} recent answers</span></div>`).join('')}<div class="bd-c ov"><span class="small">Total</span><b class="num">${fmtScore(sc.total)}</b></div></div>
     ${spark?`<span class="label">Mock totals</span>${spark}`:''}
     <p class="note">Section scores 60-90, total 205-805. Estimates come from an adaptive model over your recent answers and mocks; real scores can differ by around 40 points.</p>
     <div class="row"><button class="btn sm" data-go="mock">${ic('clipboard-check')} Mock exams</button><button class="btn sm" data-go="diag">Diagnostic</button><button class="btn sm" id="pgPlan">Change plan</button></div></div>
   <div class="stats4">
     <div class="panel st"><span class="st-i fl">${ic('flame')}</span><b class="num">${streak()}</b><span class="small muted">day streak</span></div>
     <div class="panel st"><span class="st-i xp">${ic('zap')}</span><b class="num">${wk.xp}</b><span class="small muted">XP in 7 days</span></div>
     <div class="panel st"><span class="st-i ok">${ic('check')}</span><b class="num">${tried?Math.round(okN/tried*100):0}%</b><span class="small muted">right on latest try (${tried} questions)</span></div>
     <div class="panel st"><span class="st-i bl">${ic('calendar-check')}</span><b class="num">${wk.act}/7</b><span class="small muted">days studied this week</span></div>
   </div>
   <div class="grid2">
    <div class="panel"><h3>Question types</h3>${Object.keys(TYPE_NAME).map(t=>{const qs=QS.filter(q=>q.type===t);let n=0,ok=0;qs.forEach(q=>{const a=P.att[q.qid];if(a){n++;if(a.lastOk)ok++;}});
       return `<div class="lvrow"><b>${TYPE_NAME[t]}</b><span class="bar-track"><i style="width:${n?ok/n*100:0}%"></i></span><span class="num muted small">${n?Math.round(ok/n*100)+'%':'-'} <span class="muted">(${n})</span></span></div>`;}).join('')}</div>
    <div class="panel"><h3>Last 12 weeks</h3>${Object.keys(P.day||{}).length?`<div class="heat">${heat.map(x=>`<i class="${x}"></i>`).join('')}</div><span class="note">Each square is a day; darker means more practice.</span>`:mcSay('zzz','The first square lights up after today\'s session.',56)}
      <div class="row"><button class="btn sm" data-go="errors">${ic('notebook-pen')} Error log</button></div></div>
   </div></div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $('#pgPlan').onclick=plSettings;
};

/* ---------- settings ---------- */
const uiTg=(id,label,on,sub)=>`<button class="tg-row" id="${id}" role="switch" aria-checked="${!!on}"><span><b>${label}</b>${sub?`<span class="small muted">${sub}</span>`:''}</span><span class="tg"><i></i></span></button>`;
function uiToggles(root){
  const set={tgSnd:()=>{P.settings.mute=!P.settings.mute;},tgMc:()=>{P.settings.noMascot=!P.settings.noMascot;}};
  Object.keys(set).forEach(id=>{const b=$('#'+id,root);if(b)b.onclick=()=>{set[id]();touch('main');applySettings();b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true');};});
  $$('[data-theme-set]',root).forEach(b=>b.onclick=()=>{P.settings.theme=b.dataset.themeSet||'';touch('main');applySettings();$$('[data-theme-set]',root).forEach(x=>x.setAttribute('aria-pressed',x===b));});
}
function uiToggleHTML(){
  return `${uiTg('tgSnd','Sound effects',!P.settings.mute,'A short chime for right and wrong answers')}${uiTg('tgMc','Max the fox',!P.settings.noMascot,'Shows up at milestones and on empty screens')}
   <div class="tg-row static"><span><b>Theme</b></span><span class="row">${[['','Auto'],['light','Light'],['dark','Dark']].map(([k,t])=>`<button class="chip" data-theme-set="${k}" aria-pressed="${(P.settings.theme||'')===k}">${t}</button>`).join('')}</span></div>`;
}
function uiAaSheet(){
  const m=modal(`<h2>Display and sound</h2><div class="tg-list">${uiToggleHTML()}</div>`);
  m.el.classList.add('sheet'); uiToggles(m.el);
  const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();if(!window.__busy)route();}});obs.observe(document.body,{childList:true});
}
VIEWS.settings=el=>{
  const c=plCfg();
  const aiTxt=AI?'On':WEB?(WEB.ai?'Needs the group password':'Not set up on the server'):'Cannot reach the server';
  const syTxt=syncState==='on'?'Synced':syncState==='err'?'Sync error, saved on this device':syncState==='off'?'Off (needs the group password)':'Saved on this device only';
  el.innerHTML=`<div class="view set">
   <div class="panel"><div class="spread"><h3>Learner</h3><button class="btn sm" id="stWho">Switch learner</button></div><div class="kv"><span>Studying as</span><b>${esc(uiName())}</b></div></div>
   <div class="panel"><h3>Plan</h3><p class="small" style="margin:0">Target <b>${c.target}</b>, <b>${c.minutes} minutes</b> a day${c.date?`, exam on <b>${new Date(c.date).toLocaleDateString('en-GB')}</b>`:''}.</p>
     <div class="row"><button class="btn sm" id="stPlan">Change plan</button><button class="btn sm" data-go="diag">Retake diagnostic</button></div></div>
   <div class="panel"><h3>Display and sound</h3><div class="tg-list">${uiToggleHTML()}</div></div>
   <div class="panel"><h3>Sync and AI tutor</h3>
     <div class="kv"><span>Progress sync</span><b>${syTxt}</b></div><div class="kv"><span>AI tutor</span><b>${aiTxt}</b></div>
     ${WEB&&(!getKey()||syncState==='off')?'<button class="btn primary sm" id="stKey" style="align-self:flex-start">Enter invite code or group password</button>':''}
     ${WEB&&getKey()?'<button class="btn ghost sm" id="stOut" style="align-self:flex-start">Forget the password on this device</button>':''}
     <details class="adv"><summary>Advanced</summary><p class="note">The AI tutor runs on Groq and sync on Upstash Redis, configured with Vercel environment variables: APP_PASSWORD, GROQ_API_KEY, KV_REST_API_URL, KV_REST_API_TOKEN.</p></details></div>
   <div class="panel"><h3>About</h3><div class="row"><button class="btn sm" id="stHi">Meet Max again</button><button class="btn sm" id="stReset">Reset my progress</button></div>
     <p class="note">Calculis, Stalis's GMAT. All questions, passages, lessons and explanations are original practice material written in the GMAT Focus Edition format; they are not official GMAT questions. Scores are estimates. GMAT is a trademark of GMAC, which is not affiliated with this app.</p></div>
  </div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $('#stPlan').onclick=plSettings;$('#stWho').onclick=switchProfile;
  uiToggles(el);
  const k=$('#stKey');if(k)k.onclick=async()=>{const ok=await askPassword(false);if(ok){await initPlatform();VIEWS.settings(el);}};
  const o=$('#stOut');if(o)o.onclick=()=>{setKey('');toast('Password removed from this device.');VIEWS.settings(el);};
  $('#stHi').onclick=()=>uiIntro(true);
  $('#stReset').onclick=async()=>{if(!await confirmBox('Reset all progress?','This clears your answers, error log, mocks, flashcards and XP for '+esc(uiName())+' on every device. It cannot be undone.','Reset everything','Keep my progress'))return;
    const keep={settings:P.settings,plan:P.plan};P=Object.assign(structuredClone(DEFAULT),keep);P.upd=Date.now();P.reset=Date.now();store.set(PKEY(),P);
    if(SYNC==='web'&&getKey()){try{dirty.add('main');await api('api/sync',{method:'PUT',body:{data:P,force:true,summary:uiSummary()}});}catch(e){}}
    toast('Progress reset.');route();};
};

/* ---------- feedback: XP fly, celebrations ---------- */
window.__xpFly=n=>{
  setTimeout(uiChips,0); if(!n)return;
  const chip=[$('#xpChip')].find(x=>x&&x.offsetParent); if(!chip)return;
  const to=chip.getBoundingClientRect(), from=UI_PT||{x:innerWidth/2,y:innerHeight/2};
  const f=document.createElement('div');f.className='xpfly';f.textContent='+'+n+' XP';document.body.appendChild(f);
  f.style.left=from.x+'px';f.style.top=from.y+'px';
  if(uiReduced()||!f.animate){setTimeout(()=>f.remove(),900);return;}
  const dx=to.left+to.width/2-from.x, dy=to.top+to.height/2-from.y;
  f.animate([{transform:'translate(-50%,-50%) scale(.8)',opacity:0},{transform:'translate(-50%,-120%) scale(1.05)',opacity:1,offset:.25},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.6)`,opacity:.2}],{duration:750,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>{f.remove();};
};
function confetti({count=100,duration=1500}={}){
  if(uiReduced())return;
  const cv=document.createElement('canvas'),dpr=devicePixelRatio||1;cv.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:90;width:100%;height:100%';
  cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;document.body.appendChild(cv);const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  const cols=['#5A1F4E','#E0A72E','#E8692A','#7A2D6B','#F2C14E','#2C8C7A'];
  const ps=Array.from({length:count},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.35,vx:(Math.random()-.5)*13,vy:-Math.random()*13-4,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:4+Math.random()*4,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();
  (function f(t){const k=(t-t0)/duration;ctx.clearRect(0,0,innerWidth,innerHeight);
    ps.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.globalAlpha=Math.max(0,1-k);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
    if(k<1)requestAnimationFrame(f);else cv.remove();})(t0);
}
function uiCele(html,cls){
  const old=$('.mc-cele');if(old)old.remove();
  const bg=document.createElement('div');bg.className='mc-cele '+(cls||'');bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');
  bg.innerHTML=`<div class="cele-in">${html}</div>`;document.body.appendChild(bg);
  const close=()=>bg.remove();$$('[data-close]',bg).forEach(b=>b.onclick=close);bg.addEventListener('click',e=>{if(e.target===bg&&!bg.classList.contains('locked'))close();});
  setTimeout(()=>{const b=$('[data-close]',bg);b&&b.focus();},50);
  return {el:bg,close};
}
window.__rankUp=b=>{
  if(window.__busy){toast('New title: '+b[1],4000);return;}
  const i=PL_RANKS.indexOf(b), nx=PL_RANKS[i+1];
  uiCele(`<div class="cele-mc">${foxSVG('yay',140,i)}</div><div class="stamp">${b[1]}</div><h2>You made ${b[1]}!</h2><p>${esc(b[2])} Max got new gear for the office.</p>${nx?`<p class="small" style="opacity:.85">Next: ${nx[1]} at ${nx[0]} XP.</p>`:''}<button class="btn cele-btn" data-close>Brilliant</button>`,'rank');
  sfx('end');setTimeout(()=>confetti({count:130}),300);uiChips();
};
window.__goalDone=()=>{
  if($('.mc-cele')||window.__busy)return;
  const d=plDay();
  uiCele(`<div class="cele-mc">${mascot('yay',130)}</div><h2>Daily goal done!</h2>
    <div class="cele-st"><div><span class="st-i xp">${ic('zap')}</span><b class="num">${d.xp||0}</b><span>XP</span></div><div><span class="st-i fl">${ic('flame')}</span><b class="num">${streak()}</b><span>day streak</span></div><div><span class="st-i ok">${ic('check')}</span><b class="num">${d.q||0}</b><span>questions</span></div></div>
    <p class="small">Keep the streak alive tomorrow. Extra practice gets you to the next title faster.</p><div class="row" style="justify-content:center"><button class="btn cele-btn" data-close>Done</button></div>`,'goal');
  sfx('end');confetti();
};

/* ---------- intro / onboarding ---------- */
function uiIntro(force){
  if(!force&&store.get('calculis-intro',0)&&WHO)return;
  const noName=!WHO;
  const steps=[
    ()=>`<div class="cele-mc">${mascot('hi',120)}</div><h2>Hi, I am Max</h2><p>This is <b>Calculis</b>, where the group prepares for the GMAT together. Calculus + Stalis: a bit of maths, a bit of style. I am a fox, so I know a thing or two about clever shortcuts.</p>${profileForm(true)}<button class="btn cele-btn" id="inName">Next</button>`,
    ()=>`<div class="cele-mc">${mascot('hi',130)}</div><h2>Nice to meet you, ${esc(uiName())}!</h2><p>I climb the career ladder with you, from Intern to CEO. Every new title gets me some new office gear.</p>
      <div class="hats">${[0,1,2,3,4,7].map(i=>foxSVG('calm',52,i)).join('')}</div><button class="btn cele-btn" id="inNext">Next</button>`,
    ()=>{const c=plCfg();return `<div class="cele-mc">${mascot('idea',96)}</div><h2>Your target score?</h2><div class="row" style="justify-content:center">${[555,605,655,705,755,805].map(n=>`<button class="chip big" data-tg="${n}" aria-pressed="${c.target===n}">${n}</button>`).join('')}</div>
      <h2 style="margin-top:8px">Minutes a day?</h2><div class="row" style="justify-content:center">${[15,30,45,60,90].map(n=>`<button class="chip big" data-mn="${n}" aria-pressed="${c.minutes===n}">${n} min</button>`).join('')}</div>
      <h2 style="margin-top:8px">How do you want to start?</h2><div class="in-opts"><button class="btn" data-st="start">I am new to the GMAT: follow the Start here path</button><button class="btn" data-st="diag">I have studied before: take the 25-minute diagnostic</button><button class="btn" data-st="quant">Jump straight into practice</button></div>`;},
  ];
  let i=noName?0:1; const m=uiCele('','intro'+(noName?' locked':''));const box=$('.cele-in',m.el);
  const draw=()=>{box.innerHTML=steps[i]();
    const nm=$('#inName',box);if(nm)nm.onclick=async()=>{const n=$('#pfN',box).value.trim(),p=$('#pfP',box).value.trim();if(!slugOf(n)){toast('Type your name first.');return;}if(p&&p.length<4){toast('The PIN needs 4 to 6 digits.');return;}
      const k=$('#pfK',box);await setProfile(n,p,k&&k.value.trim());m.el.classList.remove('locked');i=1;draw();};
    const n=$('#inNext',box);if(n)n.onclick=()=>{i=2;draw();};
    $$('[data-tg]',box).forEach(b=>b.onclick=()=>{plCfg().target=+b.dataset.tg;touch('main');$$('[data-tg]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    $$('[data-mn]',box).forEach(b=>b.onclick=()=>{plCfg().minutes=+b.dataset.mn;touch('main');$$('[data-mn]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    $$('[data-st]',box).forEach(b=>b.onclick=()=>{store.set('calculis-intro',1);m.close();go(b.dataset.st);});};
  draw();
}
