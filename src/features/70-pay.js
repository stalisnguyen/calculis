/* ================= UPGRADE (paid plans, payOS) =================
   #upgrade: plans for this app, paid by VietQR bank transfer on payOS's checkout page.
   The plan is tied to the Google account (api/pay.js). After paying, payOS sends the person back to /?pay=done&orderCode=...;
   the page asks the server to confirm, so access opens even if the webhook is late. */
const PAY_T={title:"Upgrade Calculis",
  lead:"One plan for Calculis, tied to your Google account, so it works on every device. Paid by VietQR bank transfer through payOS.",
  offline:"Payments need the online version of the app.",
  needSign:"Sign in with Google first. The plan is tied to your account.",
  month:"Monthly",
  year:"Yearly",
  perMonth:"30 days of full access",
  buy:"Pay with VietQR",
  opening:"Opening payOS...",
  incl:"What the plan includes",
  soon:"Payments open soon (before 15/11). Plans and prices are shown here so you can see them.",
  ownerNote:"You are the owner, so this account already has full access.",
  pending:"You started a payment earlier. If you have already transferred and access has not opened, check again.",
  check:"Check my payment",
  fine:"No automatic renewal: you pay again only when you want more time. Full refund within 7 days of your first payment.",
  terms:"Terms",
  notYet:"No payment found yet. Bank transfers usually arrive within a minute; try again shortly.",
  checkFail:"Could not check the payment. Try again in a moment.",
  createFail:"Could not open the payment page. Try again in a few minutes.",
  cancelled:"Payment cancelled. Nothing was charged.",
  checking:"Checking your payment...",
  upgrade:"Upgrade",
  extend:"Add time",
  seePlans:"See paid plans",
  admTitle:"Sales (payOS)",
  admReady:"payOS is connected.",
  admNotReady:"payOS is not connected yet (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in Vercel).",
  admRev:"Revenue",
  admHook:"Register payOS webhook to this app",
  admHookFail:"Could not register the webhook",
  perks:["AI tutor: explanations, step-by-step solutions and feedback, 50 turns a day", "Progress sync across all your devices", "Everything in the free version"],
  money:n=>Number(n).toLocaleString('en-US')+' VND',
  best:s=>`Save ${s}%`,
  perYear:m=>`365 days, about ${m} a month`,
  thanks:d=>`Payment received, thank you! Full access until ${d}.`,
  admHookOk:u=>`Webhook registered: ${u}`};
const payLast={get(){try{return JSON.parse(localStorage.getItem('calculis-order')||'null');}catch(e){return null;}},
  set(v){try{v?localStorage.setItem('calculis-order',JSON.stringify(v)):localStorage.removeItem('calculis-order');}catch(e){}}};
const payMoney=n=>PAY_T.money(n);
if(typeof UI_ALIAS==='object'&&UI_ALIAS)UI_ALIAS.upgrade='settings';
async function payPost(action,extra){
  const r=await fetch('api/pay',{method:'POST',headers:{'content-type':'application/json','x-app-key':getKey()},body:JSON.stringify(Object.assign({action},extra||{}))});
  return {ok:r.ok,status:r.status,j:await r.json().catch(()=>({}))};
}
/* back from payOS: ?pay=done|cancel (payOS adds orderCode, status, ...) */
let PAY_BACK=null;
{const q=new URLSearchParams(location.search);
  if(q.get('pay')){PAY_BACK={kind:q.get('pay'),code:Number(q.get('orderCode'))||((payLast.get()||{}).code)||0,cancel:q.get('cancel')==='true'||q.get('pay')==='cancel'};
    try{history.replaceState(null,'',location.pathname+'#upgrade');}catch(e){}}}
async function payCheck(code,quiet){
  let r;try{r=await payPost('check',{orderCode:code});}catch(e){r={ok:false,j:{}};}
  if(r.ok&&r.j.paid){acctSet(r.j.acct);payLast.set(null);toast(PAY_T.thanks(authDate(r.j.acct.paidUntil)),6000);return true;}
  if(!quiet)toast(r.ok?PAY_T.notYet:PAY_T.checkFail,5000);
  return false;
}
VIEWS.upgrade=async el=>{
  el.innerHTML=`<div class="view up"><div class="panel"><h3>${PAY_T.title}</h3><p class="note">${PAY_T.lead}</p><div id="upAcct"></div></div>
    <div class="up-plans" id="upPlans"></div><div class="panel" id="upMore"></div></div>`;
  for(let i=0;i<40&&WEB===null;i++)await new Promise(r=>setTimeout(r,150)); /* first load: wait for api/status */
  if(!document.body.contains(el)||current!=='upgrade')return;
  if(!WEB){$('#upAcct',el).innerHTML=`<p class="small">${PAY_T.offline}</p>`;return;}
  const a=acctGet(), box=$('#upAcct',el);
  if(!a){box.innerHTML=`<p class="small">${PAY_T.needSign}</p><div id="upG" style="min-height:44px"></div><p class="small" id="upMsg"></p>`;
    authButton($('#upG',el),async()=>{await initPlatform();if(current==='upgrade')VIEWS.upgrade(el);},e=>{$('#upMsg',el).textContent=e;});}
  else box.innerHTML=`${acctFace(a)}<div class="kv"><span>${AUTH_T.access}</span><b>${acctLine(a)}</b></div>`;
  let info={ready:false,plans:{month:{amount:49000,days:30},year:{amount:399000,days:365}}};
  try{const r=await payPost('info');if(r.ok)info=r.j;}catch(e){}
  const m=info.plans.month,y=info.plans.year,save=Math.round((1-y.amount/(m.amount*12))*100);
  const card=(k,p,extra,best)=>`<div class="panel up-plan${best?' best':''}">${best?`<span class="pill">${PAY_T.best(save)}</span>`:''}
    <h3>${k==='month'?PAY_T.month:PAY_T.year}</h3><div class="up-price">${payMoney(p.amount)}</div><p class="small muted">${extra}</p>
    <button class="btn ${best?'primary':''}" data-plan="${k}" ${info.ready&&a&&!a.owner?'':'disabled'}>${PAY_T.buy}</button></div>`;
  $('#upPlans',el).innerHTML=card('month',m,PAY_T.perMonth)+card('year',y,PAY_T.perYear(payMoney(Math.round(y.amount/12/1000)*1000)),true);
  const last=payLast.get();
  $('#upMore',el).innerHTML=`<h3>${PAY_T.incl}</h3><ul class="small">${PAY_T.perks.map(x=>`<li>${x}</li>`).join('')}</ul>
    ${info.ready?'':`<p class="note">${PAY_T.soon}</p>`}${a&&a.owner?`<p class="note">${PAY_T.ownerNote}</p>`:''}
    ${last&&a?`<p class="small">${PAY_T.pending}</p><button class="btn sm" id="upChk">${PAY_T.check}</button>`:''}
    <p class="small muted">${PAY_T.fine} <a href="https://stalis-study.vercel.app/terms.html" target="_blank" rel="noopener">${PAY_T.terms}</a></p>`;
  const c=$('#upChk',el);if(c)c.onclick=async()=>{c.disabled=true;if(await payCheck(last.code))VIEWS.upgrade(el);else c.disabled=false;};
  $$('[data-plan]',el).forEach(b=>b.onclick=async()=>{
    b.disabled=true;b.textContent=PAY_T.opening;
    let r;try{r=await payPost('create',{plan:b.dataset.plan});}catch(e){r={ok:false,j:{}};}
    if(r.ok&&r.j.checkoutUrl){payLast.set({code:r.j.orderCode,plan:b.dataset.plan,at:Date.now()});location.href=r.j.checkoutUrl;return;}
    b.disabled=false;b.textContent=PAY_T.buy;toast(r.status===401?PAY_T.needSign:PAY_T.createFail,5000);
  });
  if(PAY_BACK&&a){const pb=PAY_BACK;PAY_BACK=null;
    if(pb.cancel){toast(PAY_T.cancelled,4000);}
    else if(pb.code){toast(PAY_T.checking,2500);let ok=false;for(let i=0;i<5&&!ok;i++){ok=await payCheck(pb.code,i<4);if(!ok)await new Promise(r=>setTimeout(r,3000));}
      if(ok&&current==='upgrade')VIEWS.upgrade(el);}}
};
/* owner: sales so far and the webhook switch */
async function payAdmin(host){
  if(!getKey()||$('#payAdm',host))return;
  let s;try{const r=await payPost('sales');if(!r.ok)return;s=r.j;}catch(e){return;}
  if(!document.body.contains(host)||$('#payAdm',host))return;
  const b=document.createElement('div');b.className='panel';b.id='payAdm';
  b.innerHTML=`<h3>${PAY_T.admTitle}</h3><p class="small">${s.ready?PAY_T.admReady:PAY_T.admNotReady}</p>
    <div class="kv"><span>${PAY_T.admRev}</span><b>${payMoney(s.revenue)}</b></div><div class="kv"><span>${PAY_T.month}</span><b>${s.month}</b></div><div class="kv"><span>${PAY_T.year}</span><b>${s.year}</b></div>
    ${s.ready?`<button class="btn sm" id="payHook">${PAY_T.admHook}</button><p class="small" id="payHookMsg"></p>`:''}`;
  const h=$('#payHook',b);if(h)h.onclick=async()=>{h.disabled=true;const r=await payPost('hook').catch(()=>({ok:false,j:{}}));h.disabled=false;
    $('#payHookMsg',b).textContent=r.ok?PAY_T.admHookOk(r.j.url):PAY_T.admHookFail+(r.j.desc?' ('+r.j.desc+')':'');};
  host.appendChild(b);
}
/* the account panel and the password box point to the plans */
function payBtn(a){return a.owner?'':`<button class="btn ${a.active?'':'primary'} sm" id="acUp">${a.paidUntil>Date.now()?PAY_T.extend:PAY_T.upgrade}</button>`;}
{const _ap=authPanel;authPanel=function(el,host){_ap(el,host);payAdmin(host);};}
{const _am=authMount;authMount=function(m,done){_am(m,done);const a=acctGet();
  if(a&&!a.active&&!$('#upGo',m.el)){const f=$('#pwF',m.el);if(f)f.insertAdjacentHTML('afterend',`<button class="btn sm" id="upGo" style="margin-top:8px">${PAY_T.seePlans}</button>`);
    const g=$('#upGo',m.el);if(g)g.onclick=()=>{m.close();go('upgrade');};}};}
