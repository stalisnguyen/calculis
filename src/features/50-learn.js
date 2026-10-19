/* ================= LEARN: lessons and flashcards (spaced repetition) ================= */
let LESSONS=[], CARDS=[];
function loadLearn(){if(LESSONS.length)return Promise.resolve({l:LESSONS,c:CARDS});return Promise.all([loadJSON('lessons').catch(()=>[]),loadJSON('cards').catch(()=>[]),loadGloss()]).then(([l,c,g])=>{LESSONS=l;
  // glossary terms become a flashcard deck of their own
  CARDS=c.concat((g||[]).map(x=>({id:x.id,sec:'terms',topic:x.group,front:x.term,back:x.vi+(x.ex?'\n'+x.ex:''),level:1})));return {l,c:CARDS};});}
function bodyHTML(t){
  const out=[];let list=null,para=[];
  const flushP=()=>{if(para.length){out.push(`<p>${fmt(para.join(' '))}</p>`);para=[];}};
  const flushL=()=>{if(list){out.push(`<ul>${list.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`);list=null;}};
  String(t||'').split('\n').forEach(line=>{const l=line.trim();
    if(!l){flushP();flushL();return;}
    if(/^[-•] /.test(l)){flushP();(list=list||[]).push(l.slice(2));return;}
    flushL();
    if(l.length<90&&/[=≤≥<>]/.test(l)&&!/[.?!:]$/.test(l)&&l.split(' ').length<16){flushP();out.push(`<div class="formula">${fmt(l)}</div>`);return;}
    para.push(l);});
  flushP();flushL();return out.join('');
}
const LS_SEC=[['start','Start here'],['quant','Quant'],['verbal','Verbal'],['di','Data Insights'],['strategy','Strategy']];
let LS_TAB='start';
function lessonOfDay(){
  if(!LESSONS.length)return null;
  const sc=scoreNow(); const weak=SECS.filter(s=>sc[s]!=null).sort((a,b)=>sc[a]-sc[b])[0]||'quant';
  const st=LESSONS.find(l=>l.sec==='start'&&!P.lessons[l.id]); if(st)return st;
  return LESSONS.find(l=>l.sec===weak&&!P.lessons[l.id])||LESSONS.find(l=>!P.lessons[l.id])||null;
}
VIEWS.lessons=el=>{
  if(!LESSONS.length){el.innerHTML=`<div class="view"><p class="note">Loading lessons...</p></div>`;loadLearn().then(()=>{if(current==='lessons')route();});return;}
  const list=LESSONS.filter(l=>l.sec===LS_TAB), done=list.filter(l=>P.lessons[l.id]).length, lod=lessonOfDay();
  el.innerHTML=`<div class="view">
    ${lod?`<button class="panel ls-today" data-l="${esc(lod.id)}"><span class="label">Suggested next</span><b>${esc(lod.title)}</b><span class="small muted">${esc(SEC_NAME[lod.sec]||(lod.sec==='start'?'Start here':'Strategy'))}, ${esc(lod.topic)}</span></button>`:''}
    ${subTabs('lsT',LS_SEC.map(([k,t])=>[k,`${t} <span class="muted num">${LESSONS.filter(l=>l.sec===k&&P.lessons[l.id]).length}/${LESSONS.filter(l=>l.sec===k).length}</span>`]),LS_TAB,t=>{LS_TAB=t;VIEWS.lessons(el);})}
    <p class="note">${done}/${list.length} done in this group.</p>
    <div class="ls-grid">${list.map(l=>`<button class="panel ls-card ${P.lessons[l.id]?'done':''}" data-l="${esc(l.id)}"><span class="ls-c">${P.lessons[l.id]?ic('check'):ic('book-open')}</span><span><b>${esc(l.title)}</b><span class="small muted">${esc(l.topic)}${l.level==='advanced'?', advanced':''}</span></span></button>`).join('')}</div></div>`;
  $$('[data-l]',el).forEach(b=>b.onclick=()=>openLesson(b.dataset.l));
};
let LS_OPEN=null, PATH_FROM=false;
function openLesson(id){LS_OPEN=id;go('lesson');}
function lessonQs(l){
  const words=fold(l.topic+' '+l.title).split(/[^a-z0-9]+/).filter(w=>w.length>3&&!['questions','question','basics','advanced','tactics','strategy'].includes(w));
  const sec=l.sec==='strategy'?null:l.sec;
  const hit=q=>{const t=fold(q.topic+' '+q.sub+' '+q.type+' '+TYPE_NAME[q.type]);return words.some(w=>t.includes(w.slice(0,Math.max(4,w.length-2))));};
  return QS.filter(q=>(!sec||q.sec===sec)&&hit(q));
}
VIEWS.lesson=el=>{
  const l=LESSONS.find(x=>x.id===LS_OPEN);
  if(!l){if(!LESSONS.length){loadLearn().then(()=>{if(current==='lesson')route();});el.innerHTML='<div class="view"><p class="note">Loading...</p></div>';return;}go('lessons');return;}
  const done=!!P.lessons[l.id];
  el.innerHTML=`<div class="view lesson">
    <button class="btn ghost sm" id="lsBack" style="align-self:flex-start">${ic('chevron-left')} All lessons</button>
    <div><span class="label">${esc(SEC_NAME[l.sec]||(l.sec==='start'?'Start here':'Strategy'))}, ${esc(l.topic)}</span><h2>${esc(l.title)}</h2></div>
    <article class="panel ls-body">${bodyHTML(l.body)}</article>
    ${(l.examples||[]).length?`<div class="panel"><h3>Worked examples</h3>${l.examples.map((x,i)=>`<div class="ls-ex"><p><b>Example ${i+1}.</b> ${fmt(x.q)}</p><details><summary>Show the solution</summary><div class="ls-sol">${bodyHTML(x.a)}</div></details></div>`).join('')}</div>`:''}
    ${(l.pitfalls||[]).length?`<div class="panel"><h3>Common mistakes</h3><ul>${l.pitfalls.map(p=>`<li>${fmt(p)}</li>`).join('')}</ul></div>`:''}
    <div class="row"><button class="btn primary" id="lsDone" ${done?'disabled':''}>${done?ic('check')+' Learned':'Mark as learned'}</button><button class="btn" id="lsPr">${ic('target')} Practise this</button><button class="btn need-ai" id="lsAsk" ${AI?'':'hidden'}>${ic('sparkles')} Ask Max about it</button><button class="btn need-ai" id="lsVi" ${AI?'':'hidden'}>${ic('languages')} Tóm tắt bằng tiếng Việt</button></div></div>`;
  const back=l.sec==='start'||PATH_FROM?'start':'lessons';PATH_FROM=false;$('#lsBack').onclick=()=>go(back);
  $('#lsDone').onclick=()=>{P.lessons[l.id]=Date.now();award('lesson',1);sfx('ok');VIEWS.lesson(el);};
  $('#lsPr').onclick=()=>loadBank().then(()=>{const qs=lessonQs(l);if(!qs.length){go(l.sec==='strategy'?'mock':l.sec);return;}
    const target=plDiffFor(qs[0].sec);const ranked=qs.map(q=>[(P.att[q.qid]?100:0)+Math.abs(q.diff-target)*10+Math.random()*5,q]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
    const seen=new Set(),out=[];for(const q of ranked){if(out.length>=8)break;if(seen.has(q.unit.id))continue;seen.add(q.unit.id);q.unit.qs.forEach(x=>out.push(x));}
    prStart(out.slice(0,10),{title:l.title,sec:qs[0].sec});});
  const lv=$('#lsVi');if(lv)lv.onclick=()=>tutorOpen(`Hãy tóm tắt bài học "${l.title}" (${l.topic}) bằng tiếng Việt cho người mới học GMAT: ý chính, công thức hoặc mẹo quan trọng, và một ví dụ ngắn. Giữ thuật ngữ tiếng Anh, ghi nghĩa tiếng Việt trong ngoặc. Nội dung bài:\n\n${l.body.slice(0,3500)}`);
  const as=$('#lsAsk');if(as)as.onclick=()=>tutorOpen(`I am reading the lesson "${l.title}" (${l.topic}). Can you explain the key idea in a different way, with one fresh example?`);
};

/* ---------- flashcards ---------- */
let CD_F='all', CQ=[], CCUR=null, CREV=false, CDONE=0;
const cardsFor=f=>CARDS.filter(c=>f==='all'||c.sec===f);
function cardsDue(f='all'){const now=Date.now();return cardsFor(f).filter(c=>P.srs[c.id]&&P.srs[c.id].due<=now).sort((a,b)=>P.srs[a.id].due-P.srs[b.id].due);}
function cardsNew(f='all',limit){return cardsFor(f).filter(c=>!P.srs[c.id]).sort((a,b)=>(a.level||1)-(b.level||1)).slice(0,limit);}
function cardQueue(){const nw=Math.max(0,(P.settings.cardsPerDay||15)-newToday());CQ=[...cardsDue(CD_F),...cardsNew(CD_F,nw)];CCUR=CQ[0]||null;CREV=false;}
VIEWS.cards=el=>{
  if(!CARDS.length){el.innerHTML=`<div class="view"><p class="note">Loading cards...</p></div>`;loadLearn().then(()=>{if(current==='cards')route();});return;}
  if(!CQ.length||!CCUR)cardQueue();
  const due=cardsDue(CD_F).length, total=cardsFor(CD_F).length, learned=cardsFor(CD_F).filter(c=>known(c.id)).length;
  el.innerHTML=`<div class="view">
    ${subTabs('cdF',[['all','All'],['quant','Quant'],['verbal','Verbal'],['di','Data Insights'],['terms','Terms']],CD_F,t=>{CD_F=t;CQ=[];VIEWS.cards(el);})}
    <p class="note">${due} due, ${CQ.length} in today's queue, ${learned}/${total} learned (remembered after a week or more). Done this session: ${CDONE}.</p>
    <div id="cdBox"></div>
    <details class="adv"><summary>Browse all ${total} cards</summary><div class="cd-list">${cardsFor(CD_F).map(c=>`<div class="cd-row"><b>${fmt(c.front)}</b><span class="small">${fmt(c.back)}</span></div>`).join('')}</div></details>
    <label class="row small">New cards per day <input type="number" id="cdNew" min="0" max="60" value="${P.settings.cardsPerDay||15}" style="width:84px"></label></div>`;
  $('#cdNew').onchange=e=>{P.settings.cardsPerDay=clamp(+e.target.value||0,0,60);touch('main');CQ=[];VIEWS.cards(el);};
  const draw=()=>{
    const box=$('#cdBox');if(!box)return;
    if(!CCUR){box.innerHTML=`<div class="panel quiz-end">${mascot('yay',96)}<h3>All caught up</h3><p class="note">No more cards for now. New ones unlock tomorrow, or raise the daily number below.</p><div class="row"><button class="btn" id="cdMore">5 more new cards</button></div></div>`;
      $('#cdMore').onclick=()=>{CQ=cardsNew(CD_F,5);CCUR=CQ[0]||null;draw();};return;}
    const c=CCUR,isNew=!P.srs[c.id];
    box.innerHTML=`<div class="card fc ${CREV?'rev':''}" id="cdC" tabindex="0" role="button" aria-label="Flip card">
      <div class="corner"><span class="pill">${esc(c.sec==='terms'?'Term':SEC_NAME[c.sec]||c.sec)}</span><span class="pill">${esc(c.topic)}</span>${isNew?'<span class="pill ai">new</span>':''}</div>
      <div class="fc-front">${fmt(c.front)}</div>
      ${CREV?`<div class="fc-back">${fmt(c.back)}</div>`:'<p class="note">Think of the answer, then tap to flip.</p>'}</div>
      ${CREV?`<div class="rate">${[['Again',0],['Hard',1],['Good',2],['Easy',3]].map(([t,r])=>`<button class="btn ${r===2?'primary':''} r${r}" data-r="${r}">${t}<small>${ivLabel(c.id,r)}</small></button>`).join('')}</div>`:`<div class="row"><button class="btn primary" id="cdFlip">Show answer</button></div>`}`;
    const flip=()=>{if(!CREV){CREV=true;draw();}};
    $('#cdC').onclick=flip;$('#cdC').onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}};
    const f=$('#cdFlip');if(f)f.onclick=flip;
    $$('[data-r]',box).forEach(b=>b.onclick=()=>{const r=+b.dataset.r;const wasNew=!P.srs[c.id];schedule(c.id,r);award(wasNew?'cardnew':'card',1);CDONE++;
      CQ.shift();if(r===0)CQ.splice(Math.min(CQ.length,3),0,c);CCUR=CQ[0]||null;CREV=false;draw();const n=$('.view .note');if(n)n.textContent=`${cardsDue(CD_F).length} due, ${CQ.length} in today's queue. Done this session: ${CDONE}.`;});
  };
  draw();
};
document.addEventListener('keydown',e=>{if(current!=='cards'||e.target.closest('input,textarea,select'))return;if(CREV&&['1','2','3','4'].includes(e.key)){const b=$(`[data-r="${+e.key-1}"]`);b&&b.click();}});
