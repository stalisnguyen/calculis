/* ================= UPGRADE (paid plans, VietQR + SePay) =================
   #upgrade: plans for this app, tied to the Google account (api/pay.js). Buying shows a VietQR with the amount and a payment
   code (STA + 8 digits) in the transfer content; the money goes straight to the owner's bank account and SePay reports it
   to api/sepayhook, which opens access. The page polls api/pay 'check' and says thanks as soon as the transfer is seen. */
const PAY_T={title:"Upgrade Calculis",
  lead:"One plan for Calculis, tied to your Google account, so it works on every device. Pay by VietQR bank transfer; access opens by itself within a minute of the transfer.",
  offline:"Payments need the online version of the app.",
  needSign:"Sign in with Google first. The plan is tied to your account.",
  month:"Monthly",
  year:"Yearly",
  perMonth:"30 days of full access",
  buy:"Pay with VietQR",
  opening:"Preparing...",
  incl:"What the plan includes",
  soon:"Payments open soon (before 15/11). Plans and prices are shown here so you can see them.",
  ownerNote:"You are the owner, so this account already has full access.",
  scan:"Scan to pay",
  scanNote:"Open your banking app, scan this QR, check the details and confirm. On a phone, save the QR image or copy the details below.",
  bank:"Bank",
  acc:"Account number",
  holder:"Account name",
  amount:"Amount",
  content:"Transfer content",
  copy:"Copy",
  copied:"Copied.",
  waiting:"Waiting for your transfer. This page updates by itself.",
  stillWaiting:"Still no transfer seen. If you have paid, press Check, or email minhnguyen94.reve@gmail.com with the payment code.",
  later:"Pay later",
  check:"Check my payment",
  fine:"No automatic renewal: you pay again only when you want more time. Full refund within 7 days of your first payment.",
  terms:"Terms",
  notYet:"No transfer seen yet. Transfers usually show within a minute; try again shortly.",
  createFail:"Could not create the payment. Try again in a few minutes.",
  upgrade:"Upgrade",
  extend:"Add time",
  seePlans:"See paid plans",
  ownerSee:"Preview the upgrade page",
  nbBtn:"See plans",
  endTitle:"The free beta has ended",
  endText:"Get a plan to keep using the AI tutor. Your progress and the free lessons stay as they are.",
  admTitle:"Sales (SePay)",
  admReady:"SePay is connected.",
  admNotReady:"SePay is not connected yet (SEPAY_API_KEY, SEPAY_BANK, SEPAY_ACCOUNT in Vercel).",
  admRev:"Revenue",
  admHook:"Webhook address for SePay:",
  perks:["AI tutor: explanations, step-by-step solutions and feedback, 50 turns a day", "Everything in the free version stays free, including progress sync"],
  mustContent:c=>`Keep the transfer content exactly <b>${c}</b>, it is how your payment is matched to your account.`,
  money:n=>Number(n).toLocaleString('en-US')+' VND',
  best:s=>`Save ${s}%`,
  perYear:m=>`365 days, about ${m} a month`,
  thanks:d=>`Payment received, thank you! Full access until ${d}.`,
  admHookOk:u=>`Webhook registered: ${u}`,
  preBeta:d=>`Buy early and your plan starts when the beta ends, so you lose no free days.`,
  hint:d=>`After that the AI tutor is a paid plan, from ${payMoney(49000)} a month. Lessons and sync stay free.`,
  nbTitle:n=>`${n} day${n>1?'s':''} left in the free beta`,
  nbText:d=>`After ${d} the AI tutor needs a paid plan; lessons and sync stay free. Buy early and the plan starts when the beta ends.`};
const payLast={get(){try{return JSON.parse(localStorage.getItem('calculis-order')||'null');}catch(e){return null;}},
  set(v){try{v?localStorage.setItem('calculis-order',JSON.stringify(v)):localStorage.removeItem('calculis-order');}catch(e){}}};
const payMoney=n=>PAY_T.money(n);
if(typeof UI_ALIAS==='object'&&UI_ALIAS)UI_ALIAS.upgrade='settings';
async function payPost(action,extra){
  const r=await fetch('api/pay',{method:'POST',headers:{'content-type':'application/json','x-app-key':getKey()},body:JSON.stringify(Object.assign({action},extra||{}))});
  return {ok:r.ok,status:r.status,j:await r.json().catch(()=>({}))};
}
async function payCheck(code){
  try{const r=await payPost('check',{code});if(r.ok&&r.j.paid){acctSet(r.j.acct);payLast.set(null);return r.j.acct;}if(r.status===404)payLast.set(null);}catch(e){}
  return null;
}
function payCopy(t){try{navigator.clipboard.writeText(String(t));toast(PAY_T.copied);}catch(e){prompt('',String(t));}}
/* the transfer box: QR, bank details with copy buttons, live wait for the money */
function payBox(host,o,onPaid){
  const row=(l,v,c)=>`<div class="kv"><span>${l}</span><b>${esc(v)}${c?` <button class="btn ghost sm" data-cp="${esc(c)}">${PAY_T.copy}</button>`:''}</b></div>`;
  host.innerHTML=`<div class="panel pay-box"><h3>${PAY_T.scan}</h3>
    <img class="pay-qr" src="${esc(o.qr)}" alt="VietQR" width="260" height="260">
    <p class="small muted" style="margin:4px 0 10px">${PAY_T.scanNote}</p>
    ${row(PAY_T.bank,o.bank)}${row(PAY_T.acc,o.account,o.account)}${o.name?row(PAY_T.holder,o.name):''}
    ${row(PAY_T.amount,payMoney(o.amount),o.amount)}${row(PAY_T.content,o.code,o.code)}
    <p class="note">${PAY_T.mustContent(o.code)}</p>
    <p class="small pay-wait" id="payWait"><span class="pay-dot"></span>${PAY_T.waiting}</p>
    <div class="row" style="gap:8px"><button class="btn sm" id="payNow">${PAY_T.check}</button><button class="btn ghost sm" id="payX">${PAY_T.later}</button></div></div>`;
  $$('[data-cp]',host).forEach(b=>b.onclick=()=>payCopy(b.dataset.cp));
  let stop=false,n=0;
  const tick=async()=>{if(stop||!document.body.contains(host))return;const a=await payCheck(o.code);
    if(a){stop=true;onPaid(a);return;} if(++n<200)setTimeout(tick,n<60?4000:10000);
    else{const w=$('#payWait',host);if(w)w.textContent=PAY_T.stillWaiting;}};
  setTimeout(tick,4000);
  $('#payNow',host).onclick=async()=>{const a=await payCheck(o.code);if(a){stop=true;onPaid(a);}else toast(PAY_T.notYet,5000);};
  $('#payX',host).onclick=()=>{stop=true;host.innerHTML='';};
  host.scrollIntoView({behavior:'smooth',block:'start'});
}
VIEWS.upgrade=async el=>{
  el.innerHTML=`<div class="view up"><div class="panel"><h3>${PAY_T.title}</h3><p class="note">${PAY_T.lead}</p><div id="upAcct"></div></div>
    <div class="up-plans" id="upPlans"></div><div id="upPay"></div><div class="panel" id="upMore"></div></div>`;
  for(let i=0;i<40&&WEB===null;i++)await new Promise(r=>setTimeout(r,150)); /* first load: wait for api/status */
  if(!document.body.contains(el)||current!=='upgrade')return;
  if(!WEB){$('#upAcct',el).innerHTML=`<p class="small">${PAY_T.offline}</p>`;return;}
  const a=acctGet(), box=$('#upAcct',el);
  if(!a){box.innerHTML=`<p class="small">${PAY_T.needSign}</p><div id="upG" style="min-height:44px"></div><p class="small" id="upMsg"></p>`;
    authButton($('#upG',el),async()=>{await initPlatform();if(current==='upgrade')VIEWS.upgrade(el);},e=>{$('#upMsg',el).textContent=e;});}
  else box.innerHTML=`${acctFace(a)}<div class="kv"><span>${AUTH_T.access}</span><b>${acctLine(a)}</b></div>${!a.owner&&!(a.paidUntil>Date.now())&&a.betaUntil>Date.now()?`<p class="small">${PAY_T.preBeta(authDate(a.betaUntil-1))}</p>`:''}`;
  let info={ready:false,plans:{month:{amount:49000,days:30},year:{amount:399000,days:365}}};
  try{const r=await payPost('info');if(r.ok)info=r.j;}catch(e){}
  const m=info.plans.month,y=info.plans.year,save=Math.round((1-y.amount/(m.amount*12))*100);
  const card=(k,p,extra,best)=>`<div class="panel up-plan${best?' best':''}">${best?`<span class="pill">${PAY_T.best(save)}</span>`:''}
    <h3>${k==='month'?PAY_T.month:PAY_T.year}</h3><div class="up-price">${payMoney(p.amount)}</div><p class="small muted">${extra}</p>
    <button class="btn ${best?'primary':''}" data-plan="${k}" ${info.ready&&a&&!a.owner?'':'disabled'}>${PAY_T.buy}</button></div>`;
  $('#upPlans',el).innerHTML=card('month',m,PAY_T.perMonth)+card('year',y,PAY_T.perYear(payMoney(Math.round(y.amount/12/1000)*1000)),true);
  $('#upMore',el).innerHTML=`<h3>${PAY_T.incl}</h3><ul class="small">${PAY_T.perks.map(x=>`<li>${x}</li>`).join('')}</ul>
    ${info.ready?'':`<p class="note">${PAY_T.soon}</p>`}${a&&a.owner?`<p class="note">${PAY_T.ownerNote}</p>`:''}
    <p class="small muted">${PAY_T.fine} <a href="https://stalis-study.vercel.app/terms.html" target="_blank" rel="noopener">${PAY_T.terms}</a></p>`;
  const paid=acct=>{toast(PAY_T.thanks(authDate(acct.paidUntil)),7000);if(current==='upgrade')VIEWS.upgrade(el);};
  $$('[data-plan]',el).forEach(b=>b.onclick=async()=>{
    b.disabled=true;const old=b.textContent;b.textContent=PAY_T.opening;
    let r;try{r=await payPost('create',{plan:b.dataset.plan});}catch(e){r={ok:false,j:{}};}
    b.disabled=false;b.textContent=old;
    if(r.ok&&r.j.code){const o=Object.assign({at:Date.now()},r.j);payLast.set(o);payBox($('#upPay',el),o,paid);return;}
    toast(r.status===401?PAY_T.needSign:PAY_T.createFail,5000);
  });
  /* an unfinished order from before: show it again so the person can pay or check */
  const last=payLast.get();
  if(last&&a&&last.code&&Date.now()-(last.at||0)<7*864e5){const done=await payCheck(last.code);if(done)paid(done);else if(payLast.get())payBox($('#upPay',el),last,paid);}
};
/* owner: sales so far and the webhook address to give SePay */
async function payAdmin(host){
  if(!getKey()||$('#payAdm',host))return;
  let s;try{const r=await payPost('sales');if(!r.ok)return;s=r.j;}catch(e){return;}
  if(!document.body.contains(host)||$('#payAdm',host))return;
  const b=document.createElement('div');b.className='panel';b.id='payAdm';
  b.innerHTML=`<h3>${PAY_T.admTitle}</h3><p class="small">${s.ready?PAY_T.admReady:PAY_T.admNotReady}</p>
    <div class="kv"><span>${PAY_T.admRev}</span><b>${payMoney(s.revenue)}</b></div><div class="kv"><span>${PAY_T.month}</span><b>${s.month}</b></div><div class="kv"><span>${PAY_T.year}</span><b>${s.year}</b></div>
    <p class="small muted">${PAY_T.admHook} <code>${esc(s.hook)}</code></p>`;
  host.appendChild(b);
}
function payBtn(a){return a.owner?`<button class="btn ghost sm" id="acUp">${PAY_T.ownerSee}</button>`:`<button class="btn ${a.active?'':'primary'} sm" id="acUp">${a.paidUntil>Date.now()?PAY_T.extend:PAY_T.upgrade}</button>`;}
/* under "Quyền dùng" in Settings: what happens after the free beta */
function payHint(a){return !a.owner&&!(a.paidUntil>Date.now())&&a.betaUntil>Date.now()?`<p class="small muted">${PAY_T.hint(authDate(a.betaUntil-1))}</p>`:'';}
/* Today: a reminder in the last 7 days of the beta, and after it ends for accounts without a plan */
async function payNudge(el){
  if(!WEB||!acctGet()||!document.body.contains(el))return;
  let a=acctGet();try{const r=await authPost('me');if(r.ok){acctSet(r.j.acct);a=acctGet();}}catch(e){}
  if(!a||a.owner||a.paidUntil>Date.now()||a.trialEnd>Date.now())return;
  const now=Date.now(),inBeta=a.betaUntil>now,left=Math.ceil((a.betaUntil-now)/864e5);
  if(inBeta?left>7:a.active)return;
  const host=$('.view',el)||el;if($('#payNudge',host)||!document.body.contains(el))return;
  let until=0;try{until=+localStorage.getItem('calculis-paynudge')||0;}catch(e){}
  if(now<until)return;
  const p=document.createElement('div');p.className='panel ac-nudge';p.id='payNudge';
  p.innerHTML=`<div class="ac-nudge-t"><b>${inBeta?PAY_T.nbTitle(left):PAY_T.endTitle}</b><p class="small">${inBeta?PAY_T.nbText(authDate(a.betaUntil-1)):PAY_T.endText}</p></div><div class="ac-row"><button class="btn primary sm" type="button" id="pnGo">${PAY_T.nbBtn}</button><button class="btn ghost sm" type="button" id="pnL">${PAY_T.later}</button></div>`;
  host.insertBefore(p,host.firstChild);
  $('#pnGo',p).onclick=()=>go('upgrade');
  $('#pnL',p).onclick=()=>{try{localStorage.setItem('calculis-paynudge',String(Date.now()+2*864e5));}catch(e){}p.remove();};
}
{const _home=VIEWS.home;VIEWS.home=function(el){const r=_home.apply(this,arguments);
  Promise.resolve(r).then(async()=>{for(let i=0;i<40&&WEB===null;i++)await new Promise(z=>setTimeout(z,150));payNudge(el);});return r;};}
{const _ap=authPanel;authPanel=function(el,host){_ap(el,host);payAdmin(host);};}
{const _am=authMount;authMount=function(m,done){_am(m,done);const a=acctGet();
  if(a&&!a.active&&!$('#upGo',m.el)){const f=$('#pwF',m.el);if(f)f.insertAdjacentHTML('beforebegin',`<button class="btn primary" id="upGo" style="align-self:flex-start;margin-bottom:10px">${PAY_T.seePlans}</button>`);
    const g=$('#upGo',m.el);if(g)g.onclick=()=>{m.close();go('upgrade');};}};}
