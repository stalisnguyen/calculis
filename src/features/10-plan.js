/* ================= PLAN: XP, ranks, daily plan, targets, score records ================= */
const PL_W={mm:0.5,path:5,q:2,qok:2,card:1,cardnew:2,lesson:10,mock:60,diag:30,err:2,tutor:3};
const PL_RANKS=[[0,'Intern','Day one, badge on the lanyard.'],[300,'Analyst','You know where the spreadsheets live.'],[1000,'Associate','The fundamentals are solid now.'],[2500,'Manager','You run your own study sessions.'],[5000,'Director','Hard questions do not scare you any more.'],[9000,'VP','Fast, accurate and calm under the clock.'],[15000,'Partner','Rare discipline. People ask you for help.'],[25000,'CEO','The top of the ladder. Max tips his hat.']];
const TARGETS=[505,555,605,645,675,705,735,765,805];
function plDay(k){P.day=P.day||{};k=k||ymd(Date.now());return P.day[k]=P.day[k]||{xp:0};}
function plXPTotal(){return Object.values(P.day||{}).reduce((a,d)=>a+(d.xp||0),0);}
function plRank(xp){let r=PL_RANKS[0],nx=PL_RANKS[1];for(let i=0;i<PL_RANKS.length;i++){if(xp>=PL_RANKS[i][0]){r=PL_RANKS[i];nx=PL_RANKS[i+1]||null;}}return {r,nx};}
function award(kind,n){
  n=n||1; const d=plDay(); d[kind]=(d[kind]||0)+n; const before=plXPTotal();
  const gain=Math.round((PL_W[kind]||1)*n); d.xp=(d.xp||0)+gain;
  const k=ymd(Date.now()); P.hist[k]=(P.hist[k]||0)+n; touch('main');
  const a=plRank(before).r, b=plRank(plXPTotal()).r;
  window.__xpFly&&window.__xpFly(gain);
  if(b!==a){if(window.__rankUp)window.__rankUp(b);else toast('New title: '+b[1],4000);}
  const goal=plGoalXP(); if(d.xp>=goal&&d.xp-gain<goal){if(window.__goalDone)setTimeout(window.__goalDone,b!==a?2500:600);}
}
function plCfg(){P.plan=P.plan||{target:655,minutes:45,start:today()};return P.plan;}
function plGoalXP(){return Math.round(plCfg().minutes*2.5);}
/* daily question counts per section from the minutes (about 2 min per question incl. review) */
function plCounts(){const m=plCfg().minutes;return m>=90?{quant:12,verbal:10,di:8,cards:25}:m>=60?{quant:10,verbal:8,di:6,cards:20}:m>=45?{quant:8,verbal:6,di:5,cards:15}:m>=30?{quant:5,verbal:4,di:3,cards:12}:{quant:3,verbal:3,di:2,cards:8};}
/* difficulty to practise at: around the learner's level, nudged toward the target */
function plDiffFor(sec){
  const e=secEstimate(sec); const tgt=plCfg().target;
  const tDiff=tgt>=705?4.5:tgt>=655?4:tgt>=605?3:tgt>=555?2:1.5;
  if(e.theta==null)return clamp(Math.round(P.diag&&P.diag[sec]!=null?P.diag[sec]+3:Math.min(3,tDiff)),1,5);
  return clamp(Math.round(e.theta+3+0.5),1,5);
}
function secToday(sec){const d=plDay();return d['s_'+sec]||0;}
function plTasks(){
  const c=plCounts(), d=plDay(), dow=new Date().getDay();
  let due=0;try{due=cardsDue().length;}catch(e){}
  const errN=errOpen().length;
  const t=[];
  // beginners: the next Start-here step comes first until the path is done
  try{if(LESSONS.length){const ps=pathState();if(ps.next&&ps.done<ps.steps.length){const n=ps.next;t.push({k:'path',t:'Start here: '+(n.kind==='lesson'?n.l.title:n.title),sub:`Step ${ps.done+1} of ${ps.steps.length} on the beginner path`,done:Object.values(P.path||{}).some(r=>r.t>=today()&&!r.skip)||ps.steps.some(s=>s.kind==='lesson'&&P.lessons[s.l.id]>=today()),go:'start',step:n});}}}catch(e){}
  t.push(
    {k:'quant',t:`Quant set: ${c.quant} questions`,sub:'Problem Solving at your level',done:secToday('quant')>=c.quant,go:'quant',n:[secToday('quant'),c.quant]},
    {k:'verbal',t:`Verbal set: ${c.verbal} questions`,sub:'Critical Reasoning and Reading Comprehension',done:secToday('verbal')>=c.verbal,go:'verbal',n:[secToday('verbal'),c.verbal]},
    {k:'di',t:`Data Insights set: ${c.di} questions`,sub:'Data Sufficiency, tables, charts, two-part, multi-source',done:secToday('di')>=c.di,go:'di',n:[secToday('di'),c.di]},
    {k:'cards',t:'Flashcards',sub:due?`${due} cards due`:'Formulas, CR patterns, DS rules',done:(d.card||0)+(d.cardnew||0)>=Math.min(c.cards,Math.max(due,5)),go:'cards',n:[(d.card||0)+(d.cardnew||0),Math.min(c.cards,Math.max(due,5))]},
  );
  t.push({k:'mm',t:'Mental math sprint',sub:'2 minutes, no calculator',done:(d.mm||0)>0||(P.mm&&P.mm.last===ymd(Date.now())),go:'mental'});
  if(plCfg().minutes>=30)t.push({k:'lesson',t:'One lesson',sub:'Read, check the worked examples, mark it done',done:(d.lesson||0)>=1,go:'lessons'});
  if(errN)t.push({k:'err',t:'Error log review',sub:errN+' questions waiting',done:(d.err||0)>=Math.min(3,errN),go:'errors',n:[d.err||0,Math.min(3,errN)]});
  if(dow===6||dow===0)t.push({k:'mock',t:'Weekend mock',sub:'Full adaptive mock, or one timed section',done:(d.mock||0)>=1,go:'mock'});
  return t;
}
function plWeek(){let xp=0,act=0,q=0;for(let i=0;i<7;i++){const d=(P.day||{})[ymd(today()-i*DAY)];if(d){xp+=d.xp||0;if(d.xp)act++;q+=d.q||0;}}return {xp,act,q};}
function plSettings(){
  const c=plCfg();
  const m=modal(`<h2>Study plan</h2>
    <label class="label">Target score</label><div class="row">${TARGETS.map(b=>`<button class="chip" data-t="${b}" aria-pressed="${c.target===b}">${b}</button>`).join('')}</div>
    <label class="label">Minutes per day</label><div class="row">${[15,30,45,60,90].map(n=>`<button class="chip" data-m="${n}" aria-pressed="${c.minutes===n}">${n} min</button>`).join('')}</div>
    <label class="label">Exam date (if booked)</label><input type="date" id="plDate" value="${c.date||''}" style="max-width:220px">
    <p class="note" id="plInfo"></p>`);
  const info=()=>{const n=plCounts(),days=c.date?Math.ceil((new Date(c.date).getTime()-today())/DAY):null;
    $('#plInfo',m.el).textContent=`Target ${c.target}. Each day: ${n.quant} Quant, ${n.verbal} Verbal, ${n.di} Data Insights questions and up to ${n.cards} flashcards, goal ${plGoalXP()} XP.${days!=null&&days>0?` ${days} days to the exam.`:''}`;};info();
  $$('[data-t]',m.el).forEach(b=>b.onclick=()=>{c.target=+b.dataset.t;$$('[data-t]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  $$('[data-m]',m.el).forEach(b=>b.onclick=()=>{c.minutes=+b.dataset.m;$$('[data-m]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  $('#plDate',m.el).onchange=e=>{c.date=e.target.value;info();touch('main');};
  const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();route();}});obs.observe(document.body,{childList:true});
}

/* ---------- score estimate ----------
   Prefers the latest full mock (if within 21 days and no newer evidence is much larger), otherwise practice-based estimates. */
function scoreNow(){
  const est={}; SECS.forEach(s=>est[s]=secEstimate(s));
  const lastMock=(P.mocks||[]).filter(x=>x.full).slice(-1)[0];
  const out={quant:est.quant.score,verbal:est.verbal.score,di:est.di.score,src:'practice',n:est};
  if(lastMock&&Date.now()-lastMock.t<21*DAY){SECS.forEach(s=>{if(lastMock[s]&&lastMock[s].score!=null&&(out[s]==null||est[s].n<40))out[s]=lastMock[s].score;});out.src='mock';}
  if(P.diag)SECS.forEach(s=>{if(out[s]==null&&P.diag[s+'S']!=null)out[s]=P.diag[s+'S'];});
  out.total=totalScore(out.quant,out.verbal,out.di);
  return out;
}

/* ---------- error log ---------- */
const ERR_REASONS=[['concept','Did not know the concept'],['careless','Careless slip'],['misread','Misread the question'],['time','Ran out of time / rushed'],['guess','Guessed'],['trap','Fell for a trap answer']];
function errOpen(){return Object.entries(P.err||{}).filter(([id,e])=>!e.done&&QI.has(id)).map(([id,e])=>Object.assign({id,q:QI.get(id)},e)).sort((a,b)=>b.last-a.last);}
function errFixed(){return Object.entries(P.err||{}).filter(([id,e])=>e.done&&QI.has(id)).map(([id,e])=>Object.assign({id,q:QI.get(id)},e)).sort((a,b)=>b.done-a.done);}
