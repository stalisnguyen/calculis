(function(){
'use strict';
/* Calculis core: helpers, data bank, progress state, sync, routing, shared UI.
   Feature modules (src/features/*.js) are pasted before the boot marker by build.py. */

/* ================= helpers ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=a=>a[Math.random()*a.length|0];
const DAY=86400000;
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const ic=(n,cls)=>`<svg class="i${cls?' '+cls:''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
function toast(msg,ms=2600){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),ms);}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const fmtTime=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const LET='ABCDE';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
/* inline text: **bold** (boldface CR) and line breaks; everything else escaped */
const fmt=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b class="bf">$1</b>').replace(/\n/g,'<br>');
const paras=s=>String(s||'').split(/\n{2,}/).map(p=>`<p>${fmt(p)}</p>`).join('');

/* ================= question bank =================
   data/*.json are built by tools/build_data.py from content/out. Everything is normalised into
   UNITS (what is shown on one screen: a single item, an RC passage or an MSR set) and QS (single scorable questions).
   q = {qid, sec:'quant'|'verbal'|'di', type:'ps'|'ds'|'cr'|'rc'|'ta'|'gi'|'tpa'|'msr', diff, topic, sub, unit, i (index in unit), src (raw)} */
const SECS=['quant','verbal','di'];
const SEC_NAME={quant:'Quant',verbal:'Verbal',di:'Data Insights'};
const SEC_LONG={quant:'Quantitative Reasoning',verbal:'Verbal Reasoning',di:'Data Insights'};
const TYPE_NAME={ps:'Problem Solving',ds:'Data Sufficiency',cr:'Critical Reasoning',rc:'Reading Comprehension',ta:'Table Analysis',gi:'Graphics Interpretation',tpa:'Two-Part Analysis',msr:'Multi-Source Reasoning'};
const DIFF_NAME={1:'Foundation',2:'Medium',3:'Hard',4:'Very hard',5:'Elite'};
const DIFF_SCORE={1:'below 555',2:'555-605',3:'605-655',4:'655-705',5:'705+'};
const UNITS=[], QS=[], QI=new Map(), UI_=new Map();
const JCACHE={};
function loadJSON(name){if(!JCACHE[name])JCACHE[name]=fetch('data/'+name+'.json').then(r=>{if(!r.ok)throw new Error(name);return r.json();}).catch(e=>{delete JCACHE[name];throw e;});return JCACHE[name];}
const BANK_FILES=['quant','ds','cr','rc','di'];
let BANK=null;
function topicOf(x){
  if(x.type==='ps')return x.topic||'Quant';
  if(x.type==='cr')return 'CR: '+(x.qtype||'other');
  if(x.type==='rc')return 'Reading Comprehension';
  return TYPE_NAME[x.type]||x.type;
}
function addUnit(u){UNITS.push(u);UI_.set(u.id,u);u.qs.forEach((q,i)=>{q.unit=u;q.i=i;QS.push(q);QI.set(q.qid,q);});}
function loadBank(){
  if(BANK)return BANK;
  BANK=Promise.all(BANK_FILES.map(f=>loadJSON(f).catch(()=>[]))).then(parts=>{
    parts.flat().forEach(x=>{
      if(!x||!x.id||QI.has(x.id))return;
      const sec=x.sec||(x.type==='ps'?'quant':x.type==='cr'||x.type==='rc'?'verbal':'di');
      const base={sec,type:x.type,topic:topicOf(x),sub:x.sub||x.qtype||'',src:x};
      if(x.type==='rc'){
        const u={id:x.id,sec,type:'rc',diff:x.diff,topic:x.topic||'',title:x.title||'',src:x,qs:[]};
        u.qs=(x.questions||[]).map((q,i)=>Object.assign({},base,{qid:q.id||x.id+'-q'+(i+1),diff:q.diff||x.diff,sub:q.qtype||'',sq:q}));
        addUnit(u);
      }else if(x.type==='msr'){
        const u={id:x.id,sec,type:'msr',diff:x.diff,topic:base.topic,src:x,qs:[]};
        u.qs=(x.questions||[]).map((q,i)=>Object.assign({},base,{qid:x.id+'-q'+(i+1),diff:x.diff,sub:q.kind,sq:q}));
        addUnit(u);
      }else{
        addUnit({id:x.id,sec,type:x.type,diff:x.diff,topic:base.topic,src:x,qs:[Object.assign({},base,{qid:x.id,diff:x.diff,sq:x})]});
      }
    });
    return QS;
  });
  return BANK;
}
/* correct answer and checking, per type. Answers: number (choice), array (statement labels / tpa / gi blanks) */
function keyOf(q){
  const s=q.sq;
  if(q.type==='ta')return s.statements.map(t=>t.answer);
  if(q.type==='gi')return s.blanks.map(b=>b.answer);
  if(q.type==='tpa')return s.answer.slice();
  if(q.type==='msr'&&s.kind==='yesno')return s.statements.map(t=>t.answer);
  return s.answer;
}
function complete(q,a){if(a==null)return false;const k=keyOf(q);if(Array.isArray(k))return Array.isArray(a)&&k.every((_,i)=>a[i]!=null);return true;}
function isRight(q,a){if(a==null)return false;const k=keyOf(q);if(Array.isArray(k))return Array.isArray(a)&&k.every((v,i)=>a[i]===v);return a===k;}
/* chance of a lucky guess, used by the ability model */
function guessP(q){const s=q.sq;if(q.type==='ta'||(q.type==='msr'&&s.kind==='yesno'))return 0.125;if(q.type==='tpa')return 1/((s.options||[]).length**2||25);if(q.type==='gi')return 1/s.blanks.reduce((a,b)=>a*b.options.length,1);return 0.2;}
const targetTime=q=>{const s=q.sq;if(q.type==='msr')return Math.round((q.unit.src.time||420)/3);if(q.type==='rc')return s.time||(q.i===0?150:80);return s.time||120;};

/* ================= ability model =================
   3-parameter logistic, item difficulty b = diff-3 (diff units), slope 1.3, guessing c = guessP(q).
   theta is found on a grid with a weak normal prior (mean 0, sd 1.6), so few answers do not swing it wildly.
   Section score = 81 + 2.8*theta above theta -1 (diff 3 ~ 81, diff 5 ~ 87), 5 points per unit below (diff 1 ~ 73), clamped 60-90.
   Total = 205 + 10*round((Q+V+DI-180)*2/3), clamped 205-805. Estimates only: GMAC does not publish its exact model. */
function pCorrect(theta,q){const c=guessP(q),b=(q.diff||3)-3;return c+(1-c)/(1+Math.exp(-1.3*(theta-b)));}
function estTheta(res,mu=0){ // res: [{q, ok}]
  if(!res.length)return null; let best=0,bl=-1e9;
  for(let t=-4;t<=4.0001;t+=0.05){let l=-((t-mu)*(t-mu))/(2*1.6*1.6);for(const r of res){const p=clamp(pCorrect(t,r.q),1e-6,1-1e-6);l+=r.ok?Math.log(p):Math.log(1-p);}if(l>bl){bl=l;best=t;}}
  return Math.round(best*100)/100;
}
const secScore=theta=>theta==null?null:clamp(Math.round(theta>=-1?81+2.8*theta:78.2+5*(theta+1)),60,90); // steeper below diff 2 so very weak runs land near the bottom of the scale
function totalScore(q,v,d){if([q,v,d].some(x=>x==null))return null;return clamp(205+10*Math.round((q+v+d-180)*2/3),205,805);}
const fmtScore=s=>s==null?'-':String(s);

/* ================= progress state ================= */
const DEFAULT={v:1,upd:0,settings:{theme:'',noMascot:false,mute:false,cardsPerDay:15},srs:{},hist:{},day:{},att:{},err:{},mocks:[],lessons:{}};
const slugOf=n=>fold(n).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30);
let WHO=store.get('calculis-who',null);
const PKEY=()=>WHO?'calculis-p:'+WHO.slug:'calculis-p';
let P=Object.assign(structuredClone(DEFAULT),store.get(PKEY(),{}));
P.settings=Object.assign({},DEFAULT.settings,P.settings||{});
let dirty=new Set();
function touch(part){P.upd=Date.now();dirty.add(part||'main');store.set(PKEY(),P);scheduleSync();}

/* attempts: P.att[qid] = {n, ok (times right), last (ts), lastOk, t (seconds last time), a (last answer)} */
function recordAttempt(q,a,secs,{mode='practice'}={}){
  const ok=isRight(q,a); const r=P.att[q.qid]||{n:0,ok:0};
  r.n++; if(ok)r.ok++; r.last=Date.now(); r.lastOk=ok; r.t=Math.round(secs||0); r.m=mode==='mock'?1:0;
  P.att[q.qid]=r;
  // error log: wrong answers go in; an item in the log answered right twice later counts as fixed
  const e=P.err[q.qid];
  if(!ok){P.err[q.qid]=Object.assign(e||{t:Date.now(),reason:'',note:''},{last:Date.now(),fix:0,a,miss:((e&&e.miss)||0)+1});}
  else if(e&&!e.done){e.fix=(e.fix||0)+1;if(e.fix>=2){e.done=Date.now();}}
  touch('main');
  return ok;
}
/* ability per section from practice and mocks: latest outcome of the 80 most recent items */
function secResults(sec,limit=80){
  return Object.entries(P.att).map(([id,r])=>({q:QI.get(id),r})).filter(x=>x.q&&x.q.sec===sec).sort((a,b)=>b.r.last-a.r.last).slice(0,limit).map(x=>({q:x.q,ok:!!x.r.lastOk}));
}
function secEstimate(sec){const res=secResults(sec);if(res.length<8)return {n:res.length,score:null,theta:null};const th=estTheta(res);return {n:res.length,theta:th,score:secScore(th)};}

/* SRS (SM-2 style) for flashcards, keyed by card id */
function schedule(k,r){ // r: 0 again,1 hard,2 good,3 easy
  const now=Date.now(); let c=P.srs[k]||{iv:0,ef:2.5,n:0,l:0,due:now,s:0,first:now};
  if(r===0){c.l++;c.n=0;c.iv=0;c.ef=Math.max(1.3,c.ef-0.2);c.due=now+60*1000;c.s=1;}
  else{
    if(r===1){c.iv=c.iv<1?1:Math.max(1,Math.round(c.iv*1.2));c.ef=Math.max(1.3,c.ef-0.15);}
    else if(r===2){c.iv=c.n===0?1:c.n===1?3:Math.round(c.iv*c.ef);}
    else{c.iv=c.n===0?4:Math.round(Math.max(c.iv,1)*c.ef*1.3);c.ef+=0.15;}
    c.n++;c.s=2;c.due=today()+c.iv*DAY;
  }
  P.srs[k]=c; touch('main');
  return c;
}
function ivLabel(k,r){
  const c=Object.assign({iv:0,ef:2.5,n:0},P.srs[k]||{});
  if(r===0)return '1 min';
  const iv= r===1?(c.iv<1?1:Math.max(1,Math.round(c.iv*1.2))): r===2?(c.n===0?1:c.n===1?3:Math.round(c.iv*c.ef)) : (c.n===0?4:Math.round(Math.max(c.iv,1)*c.ef*1.3));
  return iv<30? iv+(iv===1?' day':' days') : iv<365? Math.round(iv/30)+' mo' : (iv/365).toFixed(1)+' yr';
}
const known=k=>{const c=P.srs[k];return !!(c&&c.s===2&&c.iv>=7);};
function newToday(){const t=today();return Object.values(P.srs).filter(c=>c.first>=t).length;}
function streak(){let s=0,t=today();const on=k=>P.hist[k]||((P.day||{})[k]&&P.day[k].xp);if(!on(ymd(t)))t-=DAY;while(on(ymd(t))){s++;t-=DAY;}return s;}

/* ================= platform: /api/ai (Groq) and /api/sync (Upstash), locked by the group password ================= */
let AI=null, syncState='local', SYNC=null, WEB=null;
const getKey=()=>{try{return localStorage.getItem('calculis-key')||'';}catch(e){return '';}};
const setKey=v=>{try{v?localStorage.setItem('calculis-key',v):localStorage.removeItem('calculis-key');}catch(e){}};
async function initPlatform(){
  try{
    const r=await fetch('api/status',{cache:'no-store'});
    if(r.ok){WEB=await r.json();
      if(WEB.ai){AI=makeWebAI();refreshAIBits();}
      if(WEB.sync){SYNC='web'; if(getKey()) await pullRemote(); else syncState='off';}
    }
  }catch(e){}
  renderSync();
}
function askPassword(wrong){
  return new Promise(res=>{
    const m=modal(`<h2>Invite code or group password</h2>
      <p class="note">${wrong?'That password did not work. Try again.':'Enter your invite code or the group password to unlock the AI tutor and sync your progress across devices. Each device asks only once.'}</p>
      <form id="pwF" class="row"><input type="password" id="pwI" autocomplete="current-password" placeholder="Invite code or password" style="flex:1 1 200px"><button class="btn primary" type="submit">Unlock</button></form><p class="small" id="pwMsg" style="color:var(--bad,#c33)"></p>`);
    let done=false; const fin=v=>{if(done)return;done=true;res(v);};
    $('#pwF',m.el).onsubmit=async e=>{e.preventDefault();const v=$('#pwI',m.el).value.trim();if(!v)return;if(await refSubmit(v,m)){m.close();fin(true);}};
    const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();fin(false);}});obs.observe(document.body,{childList:true});
    setTimeout(()=>$('#pwI',m.el).focus(),50);
  });
}
async function api(path,{method='POST',body}={}){
  for(let i=0;i<3;i++){
    if(!getKey()){const ok=await askPassword(false);if(!ok)throw {code:'not_granted'};}
    let r; const hd={'content-type':'application/json','x-app-key':getKey()};
    if(WHO){hd['x-user']=WHO.slug;if(WHO.pin)hd['x-user-pin']=WHO.pin;}
    try{r=await fetch(path,{method,headers:hd,body:body?JSON.stringify(body):undefined});}catch(e){throw {code:'network'};}
    if(r.status===401){setKey('');const ok=await askPassword(true);if(!ok)throw {code:'not_granted'};continue;}
    if(r.status===429)throw {code:'rate_limited'};
    if(r.status===403||(r.status===400&&path.includes('sync'))){const ok=await askPin(r.status===403&&WHO&&WHO.pin);if(!ok)throw {code:'not_granted'};continue;}
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw {code:j.error||'upstream',data:j.data};
    return j;
  }
  throw {code:'not_granted'};
}
function parseJSON(text){
  const t=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
  try{return JSON.parse(t);}catch(e){}
  const a=Math.min(...['{','['].map(c=>{const k=t.indexOf(c);return k<0?1e9:k;})), b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));
  if(a<1e9&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
  throw {code:'bad_json'};
}
function makeWebAI(){
  const call=async(input,opts={})=>{
    const messages=typeof input==='string'?[{role:'user',content:input}]:input;
    const j=await api('api/ai',{body:{messages,tier:opts.modelTier||'default'}});
    return {text:String(j.text||''),truncated:!!j.truncated};
  };
  call.json=async(input,opts={})=>{
    const add='\n\nReturn only valid JSON, no other text, no ``` fences.';
    const msg=typeof input==='string'?input+add:input.map((m,i)=>i===input.length-1?{role:m.role,content:m.content+add}:m);
    const {text}=await call(msg,opts);
    return parseJSON(text);
  };
  return call;
}
async function ask(prompt,opts={}){ if(!AI)throw {code:'no_ai'}; return AI(prompt,opts); }
async function askJSON(prompt,opts={}){ if(!AI)throw {code:'no_ai'}; return AI.json(prompt,opts); }
function aiError(e){
  const c=e&&e.code;
  if(c==='no_ai')return 'The AI tutor is not switched on on the server yet (needs APP_PASSWORD and GROQ_API_KEY in Vercel).';
  if(c==='not_granted')return 'Enter the group password to use this.';
  if(c==='rate_limited')return 'The free AI quota is used up for the moment. Try again in a little while.';
  if(c==='no_key')return 'No AI key on the server yet (GROQ_API_KEY).';
  if(c==='no_password')return 'No group password on the server yet (APP_PASSWORD).';
  if(c==='too_long')return 'That is too long to send in one go. Shorten it and try again.';
  if(c==='billing')return 'The AI account is out of free quota today.';
  if(c==='bad_json')return 'The AI answered in the wrong format. Try again.';
  if(c==='network')return 'No connection. Check your network and try again.';
  return 'The AI could not answer. Try again in a few minutes.';
}
function refreshAIBits(){$$('.need-ai').forEach(el=>el.hidden=!AI);$$('.no-ai').forEach(el=>el.hidden=!!AI);}

/* ---- sync ---- */
function adopt(m){P=Object.assign(structuredClone(DEFAULT),m);P.settings=Object.assign({},DEFAULT.settings,m.settings||{});store.set(PKEY(),P);applySettings();route(true);}
/* Merge two copies of the progress (this device and the server) instead of letting the newer one win. */
function mergeP(a,b){
  if(!a||!a.upd)return structuredClone(b); if(!b||!b.upd)return structuredClone(a);
  const [nw,old]=(a.upd||0)>=(b.upd||0)?[a,b]:[b,a];
  if((nw.reset||0)>(old.upd||0))return structuredClone(nw); // a reset on one device wins over older copies
  const m=structuredClone(nw);
  const reviews=c=>(c.n||0)+(c.l||0);
  m.srs=Object.assign({},old.srs||{});
  for(const [k,c] of Object.entries(nw.srs||{})){const o=m.srs[k];m.srs[k]=!o||reviews(c)>reviews(o)||(reviews(c)===reviews(o)&&(c.due||0)>=(o.due||0))?c:o;}
  m.att=Object.assign({},old.att||{});
  for(const [k,r] of Object.entries(nw.att||{})){const o=m.att[k];m.att[k]=!o||(r.n||0)>(o.n||0)||((r.n||0)===(o.n||0)&&(r.last||0)>=(o.last||0))?r:o;}
  m.err=Object.assign({},old.err||{},nw.err||{});
  for(const [k,e] of Object.entries(old.err||{})){const n=(nw.err||{})[k];if(n&&(e.last||0)>(n.last||0))m.err[k]=e;}
  m.day=Object.assign({},old.day||{});
  for(const [d,x] of Object.entries(nw.day||{})){const o=m.day[d];if(!o){m.day[d]=x;continue;}const r={};for(const k of new Set([...Object.keys(o),...Object.keys(x)]))r[k]=Math.max(+o[k]||0,+x[k]||0);m.day[d]=r;}
  m.hist=Object.assign({},old.hist||{});for(const [d,n] of Object.entries(nw.hist||{}))m.hist[d]=Math.max(m.hist[d]||0,n);
  const uniq=(arr,key)=>{const seen=new Set();return arr.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true;});};
  m.mocks=uniq([...(old.mocks||[]),...(nw.mocks||[])],x=>String(x.t)).sort((x,y)=>x.t-y.t).slice(-30);
  m.lessons=Object.assign({},old.lessons||{},nw.lessons||{});
  if(!m.diag&&old.diag)m.diag=old.diag;
  m.upd=Math.max(a.upd||0,b.upd||0)+1;
  return m;
}
async function pullRemote(){
  try{
    const j=await api('api/sync',{method:'GET'});
    if(j.data){const m=mergeP(P,j.data);const changed=JSON.stringify(m)!==JSON.stringify(j.data);adopt(m);syncState='on';if(changed){dirty.add('main');await pushRemote();}return;}
    syncState='on';dirty.add('main');await pushRemote();
  }catch(e){console.warn('sync pull',e);syncState=e&&e.code==='not_granted'?'off':'err';}
}
let syncTimer=null;
function scheduleSync(){if(!SYNC||syncState==='off')return;clearTimeout(syncTimer);syncTimer=setTimeout(pushRemote,2500);}
async function pushRemote(){
  if(!SYNC||!dirty.size)return; dirty.clear();
  try{await api('api/sync',{method:'PUT',body:{data:P,summary:typeof uiSummary==='function'?uiSummary():null}});syncState='on';}
  catch(e){if(e&&e.code==='stale'){await pullRemote();renderSync();return;}console.warn('sync push',e);dirty.add('main');syncState=e&&e.code==='not_granted'?'off':'err';}
  renderSync();
}
function renderSync(){
  const el=$('#sync');if(!el)return;
  el.className='sync'+(syncState==='on'?' on':'');
  const t=syncState==='on'?'Synced':syncState==='err'?'Sync error, saved on this device':syncState==='off'?'Tap to turn on sync':'Saved on this device';
  el.title=t;el.innerHTML='<i></i><span class="sync-t">'+t+'</span>';
  el.style.cursor=syncState==='off'||syncState==='err'?'pointer':'';
  el.onclick=(syncState==='off'||syncState==='err')?async()=>{await pullRemote();renderSync();}:null;
}

/* ================= routing ================= */
const VIEWS={};
let current='home';
function go(v){if(v===current){route();return;}if(window.__guard&&!window.__guard())return;current=v;try{history.pushState(null,'','#'+v);}catch(e){}route();window.scrollTo(0,0);}
window.addEventListener('popstate',()=>{const h=(location.hash||'').slice(1)||'home';if(VIEWS[h]&&h!==current){if(window.__guard&&!window.__guard()){try{history.pushState(null,'','#'+current);}catch(e){}return;}current=h;route();}});
function route(soft){
  if(typeof uiNav==='function')uiNav();
  if(soft&&window.__busy)return;
  window.__leave&&window.__leave(); window.__leave=null; window.__guard=null; window.__busy=false;
  const v=$('#view'); v.innerHTML='';
  try{(VIEWS[current]||VIEWS.home)(v);}catch(e){console.error(e);v.innerHTML=`<div class="view"><p class="note">Something went wrong opening this page. Reload and try again.</p></div>`;}
}
function applySettings(){
  if(P.settings.theme)document.documentElement.dataset.theme=P.settings.theme;else delete document.documentElement.dataset.theme;
}

/* ================= shared UI ================= */
function modal(html){
  const bg=document.createElement('div');bg.className='modal-bg';bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><button class="spk x" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button>${html}</div>`;
  document.body.appendChild(bg);const close=()=>{bg.remove();document.removeEventListener('keydown',onk);};
  const onk=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onk);
  bg.addEventListener('click',e=>{if(e.target===bg)close();});$('.x',bg).onclick=close;return {el:$('.modal',bg),close};
}
function confirmBox(title,text,yes='OK',no='Cancel'){
  return new Promise(res=>{const m=modal(`<h2>${esc(title)}</h2><p class="note">${text}</p><div class="row"><button class="btn primary" id="cfY">${esc(yes)}</button><button class="btn" id="cfN">${esc(no)}</button></div>`);
    let d=false;const fin=v=>{if(d)return;d=true;m.close();res(v);};$('#cfY',m.el).onclick=()=>fin(true);$('#cfN',m.el).onclick=()=>fin(false);
    const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();if(!d){d=true;res(false);}}});obs.observe(document.body,{childList:true});});
}
function subTabs(id,items,cur,onPick){
  setTimeout(()=>{$$('#'+id+' [data-t]').forEach(b=>b.onclick=()=>onPick(b.dataset.t));});
  return `<div class="row tabs" id="${id}" role="tablist">${items.map(([k,t])=>`<button class="chip" role="tab" data-t="${k}" aria-pressed="${k===cur}">${t}</button>`).join('')}</div>`;
}
/* timer: makeTimer(seconds, onTick(left), onEnd) -> {stop, left(), pause(), resume()} ; counts down once per second */
function makeTimer(sec,onTick,onEnd){
  let left=sec,id=null;
  const start=()=>{if(id)return;id=setInterval(()=>{left--;onTick&&onTick(left);if(left<=0){clearInterval(id);id=null;onEnd&&onEnd();}},1000);};
  start();onTick&&onTick(left);
  return {stop(){if(id)clearInterval(id);id=null;},pause(){if(id)clearInterval(id);id=null;},resume:start,left:()=>left};
}
function sfx(k){
  if(P.settings.mute)return;
  try{const A=window.__actx||(window.__actx=new (window.AudioContext||window.webkitAudioContext)());const o=A.createOscillator(),g=A.createGain();o.connect(g);g.connect(A.destination);
    const f={ok:[660,990],bad:[220,170],end:[523,784]}[k]||[440,440];const t=A.currentTime;o.frequency.setValueAtTime(f[0],t);o.frequency.linearRampToValueAtTime(f[1],t+.14);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.start(t);o.stop(t+.27);}catch(e){}
}

/* ================= boot ================= */
async function boot(){
  applySettings();
  if(typeof uiInit==='function')uiInit();
  const h=(location.hash||'').slice(1); if(VIEWS[h])current=h;
  route();
  loadBank().then(()=>{if(!window.__busy)route(true);if(typeof uiNav==='function')uiNav();});
  initPlatform().then(()=>{if(['home','settings','friends','tutor'].includes(current)&&!window.__busy)route(true);});
  if(typeof uiIntro==='function')setTimeout(()=>uiIntro(false),400);
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
/* test hook for tools/flows.py (headless checks) */
window.__calculis={pathSteps:()=>pathSteps(),drillQs:l=>drillQs(l),loadLearn:()=>loadLearn(),prStart,QS,UNITS,QI,mkNew,keyOf,isRight,go,state:()=>P,scoreNow,loadBank};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty.size&&SYNC){clearTimeout(syncTimer);pushRemote();}});
boot();
})();
