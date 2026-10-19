/* ================= PROFILES + STUDY GROUP =================
   Each learner: name + slug + personal PIN (web sync). Group password (APP_PASSWORD) is shared.
   Board: api/board returns everyone's weekly XP, streak, rank and score estimate. */
function uiName(){return WHO&&WHO.name?WHO.name:'there';}
function uiMonday(){const t=today();return ymd(t-((new Date(t).getDay()+6)%7)*DAY);}
function uiSummary(){
  let wxp=0;const mon=today()-((new Date(today()).getDay()+6)%7)*DAY;
  for(let d=mon;d<=today();d+=DAY){const x=(P.day||{})[ymd(d)];if(x)wxp+=x.xp||0;}
  let score=0;try{score=scoreNow().total||0;}catch(e){}
  return {name:uiName(),wxp,xp:plXPTotal(),streak:streak(),rank:mcRankIdx(),score,q:Object.keys(P.att).length,today:plDay().xp||0,week:uiMonday()};
}
function askPin(wrong){
  return new Promise(res=>{
    const m=modal(`<h2>PIN for ${esc(uiName())}</h2>
      <p class="note">${wrong?'That PIN did not match. Try again.':'Each learner has a personal PIN so nobody can overwrite anyone else. The first time you enter one, it becomes your PIN (4 to 6 digits). Remember it for your other devices.'}</p>
      <form id="pnF" class="row"><input type="password" inputmode="numeric" id="pnI" autocomplete="off" placeholder="PIN" maxlength="6" style="flex:1 1 160px"><button class="btn primary" type="submit">Done</button></form>`);
    let done=false;const fin=v=>{if(done)return;done=true;res(v);};
    $('#pnF',m.el).onsubmit=e=>{e.preventDefault();const v=$('#pnI',m.el).value.trim();if(v.length<4){toast('The PIN needs 4 to 6 digits.');return;}
      if(!WHO)WHO={name:'Learner',slug:'learner'};WHO.pin=v;store.set('calculis-who',WHO);m.close();fin(true);};
    const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();fin(false);}});obs.observe(document.body,{childList:true});
    setTimeout(()=>$('#pnI',m.el).focus(),50);
  });
}
async function setProfile(name,pin,key){
  const slug=slugOf(name); if(!slug)return false;
  const first=!WHO;
  if(!first&&WHO.slug!==slug){clearTimeout(syncTimer);if(dirty.size){try{await pushRemote();}catch(e){}}}
  WHO={name:name.trim().slice(0,30),slug,pin:pin||''}; store.set('calculis-who',WHO);
  const saved=store.get(PKEY(),null);
  if(first&&!saved){store.set(PKEY(),P);}
  else{P=Object.assign(structuredClone(DEFAULT),saved||{});P.settings=Object.assign({},DEFAULT.settings,P.settings||{});}
  dirty=new Set();TU=null;applySettings();
  if(key)setKey(key);
  if(!SYNC&&getKey())await initPlatform();
  else if(SYNC==='web'&&getKey()){await pullRemote();renderSync();}
  else if(SYNC==='web'){syncState='off';renderSync();}
  route();return true;
}
function profileForm(fresh){
  return `<div class="pf"><label class="pf-l">Your name<input type="text" id="pfN" maxlength="30" placeholder="e.g. Thy" value="${fresh?'':esc(WHO?WHO.name:'')}"></label>
    <label class="pf-l">Personal PIN (4 to 6 digits)<input type="password" inputmode="numeric" id="pfP" maxlength="6" placeholder="Keeps your progress yours"></label>
    ${getKey()?'':`<label class="pf-l">Group password (to sync across devices)<input type="password" id="pfK" autocomplete="current-password" placeholder="Shared by the group"></label>`}
    <p class="pf-n">Use the same name, PIN and group password on another device to pick up exactly where you left off.</p></div>`;
}
function switchProfile(){
  const m=modal(`<h2>Switch learner</h2><p class="note">Sharing a device? Each person enters their own name and PIN. Progress is kept separately.</p>${profileForm(true)}<div class="row"><button class="btn primary" id="pfGo">Continue</button></div>`);
  $('#pfGo',m.el).onclick=async()=>{const n=$('#pfN',m.el).value.trim(),p=$('#pfP',m.el).value.trim();if(!slugOf(n)){toast('Type a name first.');return;}if(p&&p.length<4){toast('The PIN needs 4 to 6 digits.');return;}const k=$('#pfK',m.el);m.close();await setProfile(n,p,k&&k.value.trim());toast('Hi '+n+'!');};
}

/* ---------- study group view ---------- */
let BOARD=null, BOARD_AT=0;
async function boardLoad(force){
  if(!WEB||!WEB.sync||!getKey())return null;
  if(!force&&BOARD&&Date.now()-BOARD_AT<60000)return BOARD;
  try{const j=await api('api/board',{method:'GET'});BOARD=(j.list||[]);BOARD_AT=Date.now();}catch(e){return BOARD;}
  return BOARD;
}
function boardRows(list){
  const mon=uiMonday();
  return list.map(x=>Object.assign({},x,{wxp:x.week===mon?x.wxp:0,today:x.week===mon&&ymd(x.upd||0)===ymd(Date.now())?x.today:0}))
    .sort((a,b)=>b.wxp-a.wxp||b.streak-a.streak);
}
VIEWS.friends=async el=>{
  const link=location.origin&&location.protocol.startsWith('http')?location.origin:'https://calculis.vercel.app';
  const invite=`<div class="panel"><h3>Invite a friend</h3>
    <ol class="inv"><li>Send them <b>${esc(link.replace(/^https?:\/\//,''))}</b> and the group password.</li><li>They open the link, Max asks for a name and they choose a personal PIN.</li><li>One group password per device unlocks sync, the AI tutor and this board.</li></ol>
    <div class="row"><button class="btn sm" id="frCopy">${ic('repeat')} Copy invite</button><button class="btn ghost sm" id="frSw">Switch learner on this device</button></div></div>`;
  if(!WEB||!WEB.sync){el.innerHTML=`<div class="view">${mcSay('idea','The study group board needs sync on the server. Once it is on, everyone shows up here.',64)}${invite}</div>`;bindInv();return;}
  if(!getKey()){el.innerHTML=`<div class="view">${mcSay('hi','Enter the group password to see how everyone is doing.',64)}<button class="btn primary" id="frKey" style="align-self:flex-start">Enter group password</button>${invite}</div>`;
    $('#frKey').onclick=async()=>{if(await askPassword(false)){await initPlatform();VIEWS.friends(el);}};bindInv();return;}
  el.innerHTML='<div class="view"><p class="note">Loading the board...</p></div>';
  const list=boardRows((await boardLoad(true))||[]);
  const me=WHO?WHO.slug:'';
  el.innerHTML=`<div class="view">
    <div class="spread"><h2>This week</h2><span class="note">Ranked by XP since Monday</span></div>
    ${list.length?`<div class="board">${list.map((x,i)=>`<div class="bd-row ${x.slug===me?'me':''}"><span class="bd-pos num">${i+1}</span><span class="bd-mc">${foxSVG(x.today?'hi':'zzz',48,x.rank||0)}</span>
      <span class="bd-n"><b>${esc(x.name)}${x.slug===me?' <span class="pill ai">you</span>':''}</b><span class="small muted">${PL_RANKS[x.rank||0][1]}${x.score?`, about ${x.score}`:''}, ${x.q||0} questions tried</span></span>
      <span class="bd-st"><span class="bd-x num">${ic('zap')}${x.wxp}</span><span class="bd-f num ${x.streak?'':'cold'}">${ic('flame')}${x.streak}</span></span></div>`).join('')}</div>`
      :mcSay('zzz','Nobody on the board yet. Finish one set and your name appears here.',64)}
    ${list.length===1?mcSay('idea','Studying alone is tough. Invite someone to keep you honest.',56):''}
    ${invite}</div>`;
  bindInv();
  function bindInv(){
    const c=$('#frCopy');if(c)c.onclick=()=>{const t=`Prep for the GMAT with me on Calculis: ${link}\nOpen the link, enter your name and pick a personal PIN. I will send you the group password separately.`;
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Invite copied.')).catch(()=>toast(t,6000));};
    const s=$('#frSw');if(s)s.onclick=switchProfile;
  }
};
async function uiFriendsCard(){
  const side=$('.hm-side');if(!side)return;
  const list=await boardLoad(false);if(!list||list.length<2||current!=='home')return;
  const rows=boardRows(list).slice(0,3),me=WHO?WHO.slug:'';
  if($('#hmFr'))return;
  side.insertAdjacentHTML('beforeend',`<button class="panel fr-mini" id="hmFr"><span class="label">Study group this week</span>${rows.map((x,i)=>`<span class="fr-r ${x.slug===me?'me':''}"><span class="num">${i+1}</span><span class="fr-mc">${foxSVG('calm',30,x.rank||0)}</span><b>${esc(x.name)}</b><span class="num muted">${x.wxp} XP</span></span>`).join('')}</button>`);
  $('#hmFr').onclick=()=>go('friends');
}
