/* ================= START HERE: guided path for beginners, glossary, mental math =================
   Path = ordered steps. Lesson step: done when the lesson is marked learned. Drill step: 5 easy questions on the lesson topic,
   done with >= 4/5 (or after two tries, so nobody gets stuck). Steps unlock in order; any step can be skipped. */
let GLOSS=[];
function loadGloss(){return GLOSS.length?Promise.resolve(GLOSS):loadJSON('glossary').then(g=>GLOSS=g).catch(()=>GLOSS);}
function pathSteps(){
  if(!LESSONS.length)return [];
  const steps=[]; const by=s=>LESSONS.filter(l=>l.sec===s);
  by('start').forEach((l,i)=>{steps.push({id:'L:'+l.id,kind:'lesson',l,stage:'Getting started'});
    if(i===1)steps.push({id:'X:diag',kind:'diag',stage:'Getting started',title:'Take the diagnostic',sub:'15 questions, about 25 minutes, to see where you start'});});
  const stageName={quant:'Quant foundations',verbal:'Verbal foundations',di:'Data Insights foundations',strategy:'Exam strategy'};
  ['quant','verbal','di'].forEach(sec=>by(sec).filter(l=>l.level!=='advanced').forEach(l=>{
    steps.push({id:'L:'+l.id,kind:'lesson',l,stage:stageName[sec]});
    steps.push({id:'D:'+l.id,kind:'drill',l,stage:stageName[sec],title:'Practice: '+l.title,sub:'5 easy questions, 4 right to pass'});}));
  by('strategy').forEach(l=>steps.push({id:'L:'+l.id,kind:'lesson',l,stage:stageName.strategy}));
  steps.push({id:'X:mock',kind:'mock',stage:'Exam strategy',title:'Your first timed section',sub:'One 45-minute section, any one you like'});
  return steps;
}
function stepDone(s){
  const p=P.path||{};
  if(p[s.id]&&(p[s.id].done||p[s.id].skip))return true;
  if(s.kind==='lesson')return !!P.lessons[s.l.id];
  if(s.kind==='diag')return !!P.diag;
  if(s.kind==='mock')return (P.mocks||[]).some(m=>m.kind!=='diag');
  return false;
}
function pathState(){const steps=pathSteps();const next=steps.find(s=>!stepDone(s));return {steps,next,done:steps.filter(stepDone).length};}
function drillQs(l){
  const pool=lessonQs(l).filter(q=>q.diff<=2&&q.unit.qs.length===1);
  const fresh=shuffle(pool.filter(q=>!P.att[q.qid])), old=shuffle(pool.filter(q=>P.att[q.qid]));
  let out=[...fresh,...old].slice(0,5);
  if(!out.length&&/reading|passage|RC /i.test(l.title+' '+l.topic)){const u=UNITS.filter(u=>u.type==='rc').sort((a,b)=>(a.diff-b.diff)||((a.qs.some(q=>P.att[q.qid])?1:0)-(b.qs.some(q=>P.att[q.qid])?1:0)))[0];if(u)return u.qs.slice();}
  if(out.length<5){const more=shuffle(lessonQs(l).filter(q=>q.diff<=3&&q.unit.qs.length===1&&!out.includes(q)));out=out.concat(more).slice(0,5);}
  return out;
}
function runStep(s){
  if(s.kind==='lesson'){PATH_FROM=true;openLesson(s.l.id);return;}
  if(s.kind==='diag'){go('diag');return;}
  if(s.kind==='mock'){go('mock');return;}
  loadBank().then(()=>{const qs=drillQs(s.l);if(!qs.length){P.path=P.path||{};P.path[s.id]={done:1,t:Date.now()};touch('main');toast('No easy questions for this topic yet, step skipped.');route();return;}
    prStart(qs,{title:s.title,sec:qs[0].sec,onDone:(ok,n)=>{P.path=P.path||{};const r=P.path[s.id]||{tries:0};r.tries=(r.tries||0)+1;r.best=Math.max(r.best||0,ok);
      const need=n>=5?4:Math.ceil(n*0.6);if(ok>=need||r.tries>=2){r.done=1;r.t=Date.now();toast(ok>=need?'Step passed. Next one unlocked.':'Moving on. These questions stay in your error log.');}else toast(`${ok}/${n}. You need ${need} to pass. Read the explanations and try again.`,4000);
      P.path[s.id]=r;touch('main');}});});
}
VIEWS.start=el=>{
  if(!LESSONS.length){el.innerHTML='<div class="view"><p class="note">Loading...</p></div>';loadLearn().then(()=>{if(current==='start')route();});return;}
  const {steps,next,done}=pathState();
  const stages=[...new Set(steps.map(s=>s.stage))];
  const nextIdx=steps.indexOf(next);
  el.innerHTML=`<div class="view">
    <div class="sec-hero"><div><span class="label" style="color:inherit;opacity:.85">Start here</span><h2>${done}<span class="small" style="opacity:.8"> / ${steps.length} steps</span></h2>
      <p class="small" style="margin:0;opacity:.9">${next?'New to the GMAT? Follow the path in order: read a lesson, pass 5 easy questions, move on. Stuck on English words? Open the Glossary.':'Path complete. You know every question type. Daily sets and mocks from here.'}</p></div>${mascot(next?'idea':'yay',84)}</div>
    ${next?`<button class="panel st-next" id="stGo"><span class="label">Next step</span><b>${esc(next.kind==='lesson'?next.l.title:next.title)}</b><span class="small muted">${esc(next.kind==='lesson'?'Lesson, about 8 minutes':next.sub)}</span><span class="btn primary sm" style="align-self:flex-start">${ic('play')} Continue</span></button>`:''}
    <div class="row"><button class="btn sm" data-go="glossary">${ic('book-a')} Glossary</button><button class="btn sm" data-go="mental">${ic('zap')} Mental math</button></div>
    ${stages.map(st=>{const ss=steps.filter(s=>s.stage===st);const d=ss.filter(stepDone).length;
      return `<details class="panel st-stage" ${ss.includes(next)?'open':''}><summary><b>${esc(st)}</b><span class="small muted num">${d}/${ss.length}</span></summary><div class="st-list">${ss.map(s=>{const i=steps.indexOf(s),ok=stepDone(s),lock=!ok&&i>nextIdx;const r=(P.path||{})[s.id];
        return `<div class="st-row ${ok?'done':''} ${s===next?'cur':''} ${lock?'lock':''}"><span class="st-ic">${ok?ic('check'):s.kind==='lesson'?ic('book-open'):s.kind==='drill'?ic('target'):ic('clipboard-check')}</span>
          <span class="st-t"><b>${esc(s.kind==='lesson'?s.l.title:s.title)}</b><span class="small muted">${s.kind==='lesson'?'Lesson':esc(s.sub)}${r&&r.best!=null?`, best ${r.best}/5`:''}${r&&r.skip?', skipped':''}</span></span>
          ${ok?`<button class="btn ghost sm" data-run="${i}">Again</button>`:lock?`<button class="btn ghost sm" data-skip="${i}" title="Mark as done">Skip</button>`:`<button class="btn primary sm" data-run="${i}">Go</button>`}</div>`;}).join('')}</div></details>`;}).join('')}
  </div>`;
  const g=$('#stGo');if(g)g.onclick=()=>runStep(next);
  $$('[data-run]',el).forEach(b=>b.onclick=()=>runStep(steps[+b.dataset.run]));
  $$('[data-skip]',el).forEach(b=>b.onclick=async()=>{const s=steps[+b.dataset.skip];if(!await confirmBox('Skip ahead?','Mark this step and every step before it as done. Do this only if you already know the material.','Skip','Cancel'))return;
    P.path=P.path||{};steps.slice(0,+b.dataset.skip+1).forEach(x=>{if(!stepDone(x))P.path[x.id]={skip:1,t:Date.now()};});touch('main');VIEWS.start(el);});
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
};

/* ---------- glossary ---------- */
let GL_Q='',GL_G='';
VIEWS.glossary=el=>{
  if(!GLOSS.length){el.innerHTML='<div class="view"><p class="note">Loading...</p></div>';loadGloss().then(()=>{if(current==='glossary'&&GLOSS.length)route();else if(current==='glossary')el.innerHTML='<div class="view"><p class="note">Glossary not available yet.</p></div>';});return;}
  const groups=[...new Set(GLOSS.map(g=>g.group))];
  el.innerHTML=`<div class="view">
    <p class="note" style="margin:0">English words that trip people up in GMAT questions, with the Vietnamese meaning. They are also in Flashcards under "Terms".</p>
    <input type="search" id="glQ" placeholder="Search English or Vietnamese" value="${esc(GL_Q)}">
    <div class="row">${['',...groups].map(g=>`<button class="chip sm" data-g="${esc(g)}" aria-pressed="${GL_G===g}">${g?esc(g):'All'}</button>`).join('')}</div>
    <div class="gl-list" id="glL"></div></div>`;
  const draw=()=>{const q=fold(GL_Q.trim());const list=GLOSS.filter(g=>(!GL_G||g.group===GL_G)&&(!q||fold(g.term+' '+g.vi).includes(q)));
    $('#glL').innerHTML=list.length?list.map(g=>`<div class="gl-row"><div class="gl-h"><b>${esc(g.term)}</b><span class="gl-vi">${esc(g.vi)}</span></div>${g.note?`<div class="small muted">${fmt(g.note)}</div>`:''}${g.ex?`<div class="small gl-ex">${fmt(g.ex)}</div>`:''}</div>`).join(''):'<p class="note">No match.</p>';};
  $('#glQ').oninput=e=>{GL_Q=e.target.value;draw();};
  $$('[data-g]',el).forEach(b=>b.onclick=()=>{GL_G=b.dataset.g;$$('[data-g]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});
  draw();
};

/* ---------- mental math: 2-minute sprint, no calculator ---------- */
const MM_FR=[[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,6],[5,6],[1,8],[3,8],[5,8],[7,8],[1,9],[1,10],[3,10],[1,12],[1,16],[1,20],[1,25],[1,40],[1,50]];
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function mmItem(){
  const k=ri(0,8);
  if(k===0){const [a,b]=pick(MM_FR);return {q:`${a}/${b} as a percent`,a:100*a/b,tol:0.4,show:(+(100*a/b).toFixed(2))+'%'};}
  if(k===1){const n=ri(11,25);return {q:`${n}²`,a:n*n};}
  if(k===2){const n=ri(2,10);return {q:`${n}³`,a:n**3};}
  if(k===3){const n=ri(2,12);return {q:`2^${n}`,a:2**n};}
  if(k===4){const p=pick([5,10,12.5,15,20,25,30,40,60,75]),n=pick([40,60,80,120,160,240,360,480]);return {q:`${p}% of ${n}`,a:p*n/100};}
  if(k===5){const a=ri(12,49),b=ri(3,9);return {q:`${a} × ${b}`,a:a*b};}
  if(k===6){const b=ri(3,15),c=ri(6,25);return {q:`${b*c} ÷ ${b}`,a:c};}
  if(k===7){const n=ri(4,25);return {q:`√${n*n}`,a:n};}
  const a=ri(11,19),b=ri(11,19);return {q:`${a} × ${b}`,a:a*b};
}
VIEWS.mental=el=>{
  const mm=P.mm||{best:0,runs:0};
  let run=null,tm=null,item=null,score=0,miss=[];
  window.__leave=()=>{if(tm)tm.stop();};
  const intro=()=>{el.innerHTML=`<div class="view"><div class="panel ex-intro">${mascot('idea',90)}<div><span class="label">Mental math sprint</span><h2>2 minutes, no calculator</h2>
    <p>Fractions to percents, squares, cubes, powers of 2, quick percents and products. GMAT Quant has no calculator, so fast arithmetic buys you time for thinking.</p>
    <p class="note">Best: <b>${mm.best}</b> correct, ${mm.runs} sprints done. Percent answers within 0.4 count (33.3 for 1/3 is fine).</p>
    <div class="row"><button class="btn primary" id="mmGo">${ic('play')} Start</button></div></div></div></div>`;$('#mmGo').onclick=start;};
  const start=()=>{score=0;miss=[];window.__busy=true;
    el.innerHTML=`<div class="view mm"><div class="spread"><span class="timer-chip num" id="mmT">${ic('clock')}<span>2:00</span></span><b class="num" id="mmS">0</b></div>
      <div class="panel mm-card"><div class="mm-q" id="mmQ"></div><form id="mmF" class="row"><input id="mmI" inputmode="decimal" autocomplete="off" class="mm-in" aria-label="Answer"><button class="btn primary">OK</button></form><div class="row"><button class="btn ghost sm" id="mmSk">Skip</button></div><div id="mmFb" class="small"></div></div></div>`;
    tm=makeTimer(120,l=>{const t=$('#mmT span');if(t)t.textContent=fmtTime(l);},end);
    nextQ();
    $('#mmF').onsubmit=e=>{e.preventDefault();const v=parseFloat($('#mmI').value.replace(',','.').replace('%',''));if(isNaN(v))return;
      const ok=Math.abs(v-item.a)<=(item.tol||1e-9);if(ok){score++;sfx('ok');$('#mmFb').textContent='';}else{sfx('bad');miss.push(item);$('#mmFb').textContent=`${item.q} = ${item.show||item.a}`;}
      $('#mmS').textContent=score;nextQ();};
    $('#mmSk').onclick=()=>{miss.push(item);$('#mmFb').textContent=`${item.q} = ${item.show||item.a}`;nextQ();};};
  const nextQ=()=>{item=mmItem();$('#mmQ').textContent=item.q;const i=$('#mmI');i.value='';i.focus();};
  const end=()=>{window.__busy=false;mm.runs++;mm.last=ymd(Date.now());const rec=score>mm.best;mm.best=Math.max(mm.best,score);P.mm=mm;touch('main');if(score)award('mm',score);sfx('end');
    el.innerHTML=`<div class="view"><div class="panel quiz-end">${mascot(rec?'yay':'ok',96)}<h2>${score} correct</h2><p class="note">${rec?'New personal best!':`Best so far: ${mm.best}.`} ${miss.length?'Worth memorising:':''}</p>
      ${miss.length?`<div class="mm-miss">${miss.slice(0,12).map(m=>`<span class="pill">${esc(m.q)} = ${esc(String(m.show||m.a))}</span>`).join('')}</div>`:''}
      <div class="row" style="justify-content:center"><button class="btn primary" id="mmAg">Again</button><button class="btn ghost" id="mmH">Today</button></div></div></div>`;
    $('#mmAg').onclick=start;$('#mmH').onclick=()=>go('home');};
  intro();
};
