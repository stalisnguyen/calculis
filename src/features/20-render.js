/* ================= RENDER: one question of any type, charts, sortable tables, calculator =================
   qHTML(q, a, {reveal, lock}) -> html of the answer area for question q (unit context drawn separately by ctxHTML)
   bindQ(root, q, get, set, {lock}) wires clicks: set(newAnswer)
   unitScreen(el, q, a, opts) draws context + question in the exam layout (two panes for RC/MSR). */
const DS_CHOICES=['Statement (1) ALONE is sufficient, but statement (2) alone is not sufficient.','Statement (2) ALONE is sufficient, but statement (1) alone is not sufficient.','BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.','EACH statement ALONE is sufficient.','Statements (1) and (2) TOGETHER are NOT sufficient.'];
const numFmt=v=>typeof v==='number'?(Math.abs(v)>=1000&&!(Number.isInteger(v)&&v>=1900&&v<=2100)?v.toLocaleString('en-US',{maximumFractionDigits:6}):String(v)):esc(v);
/* small label under the type: CR/RC question type or the PS/DS subtopic */
const subLabel=q=>['ps','ds','cr','rc'].includes(q.type)&&q.sub&&q.sub!==TYPE_NAME[q.type]?q.sub:'';

function tableHTML(cols,rows,id,sortable){
  return `<div class="tbl-wrap"><table class="tbl" ${id?`id="${id}"`:''}><thead><tr>${cols.map((c,i)=>`<th${sortable?` data-c="${i}" tabindex="0" role="button" title="Sort by ${esc(c)}"`:''}>${esc(c)}${sortable?'<span class="srt"></span>':''}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(v=>`<td class="${typeof v==='number'?'n':''}">${numFmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function bindSort(root){
  $$('table.tbl th[data-c]',root).forEach(th=>{
    const run=()=>{const tb=th.closest('table'),body=$('tbody',tb),i=+th.dataset.c,dir=th.dataset.dir==='asc'?'desc':'asc';
      $$('th',tb).forEach(x=>{delete x.dataset.dir;});th.dataset.dir=dir;
      const rows=$$('tr',body);const val=tr=>{const t=tr.children[i].textContent.replace(/,/g,'');const n=parseFloat(t);return isNaN(n)?t.toLowerCase():n;};
      rows.sort((a,b)=>{const x=val(a),y=val(b);return (x<y?-1:x>y?1:0)*(dir==='asc'?1:-1);}).forEach(r=>body.appendChild(r));};
    th.onclick=run;th.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}};
  });
}

/* ---------- charts: bar (grouped), stacked, line, scatter ---------- */
const CH_COLS=['var(--accent)','var(--orange)','#2C8C7A','#C8372F','#6B7280'];
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const m=v/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;}
function chartSVG(ch){
  const W=640,H=340,L=58,R=16,T=20,B=58, w=W-L-R, h=H-T-B;
  const xs=ch.x||[], ser=ch.series||[]; const kind=ch.kind||'bar';
  let ymin=0,ymax=0, xmin=0,xmax=1;
  if(kind==='stacked'){xs.forEach((_,i)=>{let s=0;ser.forEach(se=>s+=+se.values[i]||0);ymax=Math.max(ymax,s);});}
  else ser.forEach(se=>se.values.forEach(v=>{ymax=Math.max(ymax,v);ymin=Math.min(ymin,v);}));
  if(kind==='scatter'||(kind==='line'&&xs.every(x=>typeof x==='number'))){xmin=Math.min(...xs);xmax=Math.max(...xs);}
  if(kind==='scatter'||kind==='line'){const lo=Math.min(...ser.flatMap(s=>s.values));if(lo>0&&lo>ymax*0.4){ymin=Math.floor(lo*0.8/niceMax(ymax/5))*niceMax(ymax/5);}}
  const top=niceMax(ymax>0?ymax*1.05:1), bot=ymin<0?-niceMax(-ymin*1.05):ymin;
  const Y=v=>T+h-(v-bot)/(top-bot)*h;
  const ticks=5, grid=[];for(let i=0;i<=ticks;i++){const v=bot+(top-bot)*i/ticks;grid.push(`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" class="ch-g"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" class="ch-t">${+v.toFixed(2)}</text>`);}
  let body='', xl='';
  const n=xs.length, band=w/Math.max(1,n);
  const numericX=(kind==='scatter'||kind==='line')&&xs.every(x=>typeof x==='number');
  const X=i=>numericX?L+(xs[i]-xmin)/((xmax-xmin)||1)*w:L+band*(i+.5);
  if(kind==='bar'){const g=ser.length,bw=Math.min(36,band*0.8/g);
    xs.forEach((_,i)=>ser.forEach((se,k)=>{const v=+se.values[i]||0,x0=L+band*(i+.5)-bw*g/2+bw*k;body+=`<rect x="${x0}" y="${Math.min(Y(v),Y(0))}" width="${bw-2}" height="${Math.abs(Y(0)-Y(v))}" fill="${CH_COLS[k%5]}" rx="2"><title>${esc(se.name)}: ${v}</title></rect>`;}));}
  else if(kind==='stacked'){const bw=Math.min(48,band*0.6);
    xs.forEach((_,i)=>{let acc=0;ser.forEach((se,k)=>{const v=+se.values[i]||0;body+=`<rect x="${L+band*(i+.5)-bw/2}" y="${Y(acc+v)}" width="${bw}" height="${Y(acc)-Y(acc+v)}" fill="${CH_COLS[k%5]}"><title>${esc(se.name)}: ${v}</title></rect>`;acc+=v;});});}
  else if(kind==='line'){ser.forEach((se,k)=>{const pts=se.values.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');body+=`<polyline points="${pts}" fill="none" stroke="${CH_COLS[k%5]}" stroke-width="2.5"/>`+se.values.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${CH_COLS[k%5]}"><title>${esc(se.name)} ${esc(xs[i])}: ${v}</title></circle>`).join('');});}
  else if(kind==='scatter'){ser.forEach((se,k)=>{body+=se.values.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="5" fill="${CH_COLS[k%5]}" fill-opacity=".85"><title>(${xs[i]}, ${v})</title></circle>`).join('');});}
  if(numericX){const tk=6;for(let i=0;i<=tk;i++){const v=xmin+(xmax-xmin)*i/tk;const x=L+i/tk*w;xl+=`<text x="${x}" y="${T+h+18}" text-anchor="middle" class="ch-t">${+v.toFixed(1)}</text>`;}}
  else{const rot=n>8||xs.some(x=>String(x).length>8);xs.forEach((x,i)=>{xl+=rot?`<text transform="translate(${X(i)},${T+h+14}) rotate(-35)" text-anchor="end" class="ch-t">${esc(x)}</text>`:`<text x="${X(i)}" y="${T+h+18}" text-anchor="middle" class="ch-t">${esc(x)}</text>`;});}
  const legend=ser.length>1||kind!=='scatter'?`<div class="ch-leg">${ser.map((s,k)=>`<span><i style="background:${CH_COLS[k%5]}"></i>${esc(s.name)}</span>`).join('')}</div>`:'';
  return `<figure class="chart">${ch.title?`<figcaption>${esc(ch.title)}</figcaption>`:''}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ch.title||'chart')}">${grid.join('')}<line x1="${L}" x2="${W-R}" y1="${Y(Math.max(bot,0))}" y2="${Y(Math.max(bot,0))}" class="ch-a"/>${body}${xl}
    ${ch.ylabel?`<text transform="translate(14,${T+h/2}) rotate(-90)" text-anchor="middle" class="ch-l">${esc(ch.ylabel)}</text>`:''}${ch.xlabel?`<text x="${L+w/2}" y="${H-6}" text-anchor="middle" class="ch-l">${esc(ch.xlabel)}</text>`:''}</svg>${legend}</figure>`;
}

/* ---------- context (stimulus side) ---------- */
function ctxHTML(q,tab){
  const u=q.unit,s=u.src;
  if(q.type==='rc')return `<div class="pass">${s.title?`<h3 class="pass-t">${esc(s.title)}</h3>`:''}${s.paras.map((p,i)=>`<p><span class="pn">${i+1}</span>${fmt(p)}</p>`).join('')}</div>`;
  if(q.type==='msr'){tab=tab||0;return `<div class="msr"><div class="row tabs msr-tabs" role="tablist">${s.tabs.map((t,i)=>`<button class="chip" role="tab" data-tab="${i}" aria-pressed="${i===tab}">${esc(t.title)}</button>`).join('')}</div>
    <div class="msr-body">${s.tabs.map((t,i)=>`<div class="msr-p" data-p="${i}" ${i===tab?'':'hidden'}>${t.text?paras(t.text):''}${t.table?tableHTML(t.table.cols,t.table.rows,'',false):''}</div>`).join('')}</div></div>`;}
  return '';
}
function bindCtx(root){
  $$('[data-tab]',root).forEach(b=>b.onclick=()=>{const i=b.dataset.tab;$$('[data-tab]',root).forEach(x=>x.setAttribute('aria-pressed',x===b));$$('.msr-p',root).forEach(p=>p.hidden=p.dataset.p!==i);});
  bindSort(root);
}

/* ---------- answer area ---------- */
function choicesHTML(choices,a,key,reveal,lock){
  return `<div class="opts gq-opts">${choices.map((c,k)=>{let cls='';if(reveal){if(k===key)cls='right';else if(k===a)cls='wrong';}
    return `<button class="opt gopt ${cls}" data-k="${k}" aria-pressed="${a===k}" ${lock||reveal?'disabled':''}><span class="ol">${LET[k]}</span><span class="ot">${fmt(c)}</span></button>`;}).join('')}</div>`;
}
function statementsHTML(st,labels,a,reveal,lock){
  a=a||[];
  return `<table class="stm"><thead><tr>${labels.map(l=>`<th>${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>${st.map((t,i)=>`<tr class="${reveal?(a[i]===t.answer?'ok':'bad'):''}">${labels.map((l,j)=>`<td class="rb"><button class="radio ${reveal&&j===t.answer?'key':''}" data-s="${i}" data-v="${j}" aria-pressed="${a[i]===j}" aria-label="${esc(l)}" ${lock||reveal?'disabled':''}></button></td>`).join('')}<td class="st">${fmt(t.text)}</td></tr>`).join('')}</tbody></table>`;
}
function qHTML(q,a,{reveal=false,lock=false}={}){
  const s=q.sq, key=keyOf(q);
  if(q.type==='ps')return `<div class="stem">${fmt(s.stem)}</div>${choicesHTML(s.choices,a,key,reveal,lock)}`;
  if(q.type==='ds')return `<div class="stem">${s.info?`<p>${fmt(s.info)}</p>`:''}<p><b>${fmt(s.question)}</b></p><p class="dss"><span>(1)</span> ${fmt(s.s1)}</p><p class="dss"><span>(2)</span> ${fmt(s.s2)}</p></div>${choicesHTML(DS_CHOICES,a,key,reveal,lock)}`;
  if(q.type==='cr')return `<div class="stim">${fmt(s.stimulus)}</div><div class="stem"><b>${fmt(s.stem)}</b></div>${choicesHTML(s.choices,a,key,reveal,lock)}`;
  if(q.type==='rc'||(q.type==='msr'&&s.kind==='mcq'))return `<div class="stem"><b>${fmt(s.stem)}</b></div>${choicesHTML(s.choices,a,key,reveal,lock)}`;
  if(q.type==='msr')return `<div class="stem">${fmt(s.prompt)}</div>${statementsHTML(s.statements,s.labels||['Yes','No'],a,reveal,lock)}`;
  if(q.type==='ta')return `${s.intro?`<p class="small">${fmt(s.intro)}</p>`:''}${tableHTML(s.cols,s.rows,'',true)}<p class="small muted">Tap a column header to sort.</p><div class="stem">${fmt(s.prompt)}</div>${statementsHTML(s.statements,s.labels||['True','False'],a,reveal,lock)}`;
  if(q.type==='gi'){a=a||[];let i=0;
    const sent=esc(s.text).replace(/\[\[(\d)\]\]/g,(_,n)=>{const bi=+n-1,b=s.blanks[bi];if(!b)return '';const v=a[bi];const cls=reveal?(v===b.answer?'ok':'bad'):'';
      return `<select class="gi-sel ${cls}" data-b="${bi}" ${lock||reveal?'disabled':''}><option value="">Select...</option>${b.options.map((o,k)=>`<option value="${k}" ${v===k?'selected':''}>${esc(o)}</option>`).join('')}</select>${reveal&&v!==b.answer?` <span class="gi-key">(${esc(b.options[b.answer])})</span>`:''}`;});
    return `${s.intro?`<p class="small">${fmt(s.intro)}</p>`:''}${chartSVG(s.chart)}<div class="stem gi-text">${sent}</div>`;}
  if(q.type==='tpa'){a=a||[];return `<div class="stem">${fmt(s.stem)}</div><table class="stm tpa"><thead><tr><th>${esc(s.cols[0])}</th><th>${esc(s.cols[1])}</th><th></th></tr></thead><tbody>${s.options.map((o,k)=>`<tr>${[0,1].map(c=>`<td class="rb"><button class="radio ${reveal&&key[c]===k?'key':''} ${reveal&&a[c]===k&&key[c]!==k?'miss':''}" data-c="${c}" data-k="${k}" aria-pressed="${a[c]===k}" aria-label="${esc(s.cols[c])}: ${esc(o)}" ${lock||reveal?'disabled':''}></button></td>`).join('')}<td class="st">${fmt(o)}</td></tr>`).join('')}</tbody></table>`;}
  return '<p class="note">Unknown question type.</p>';
}
function bindQ(root,q,get,set){
  $$('.gopt',root).forEach(b=>b.onclick=()=>{const k=+b.dataset.k;set(k);$$('.gopt',root).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $$('.radio[data-s]',root).forEach(b=>b.onclick=()=>{const a=(get()||[]).slice(),i=+b.dataset.s;a[i]=+b.dataset.v;set(a);$$(`.radio[data-s="${i}"]`,root).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $$('.radio[data-c]',root).forEach(b=>b.onclick=()=>{const a=(get()||[]).slice(),c=+b.dataset.c;a[c]=+b.dataset.k;set(a);$$(`.radio[data-c="${c}"]`,root).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $$('.gi-sel',root).forEach(sel=>sel.onchange=()=>{const a=(get()||[]).slice();a[+sel.dataset.b]=sel.value===''?null:+sel.value;set(a);});
  bindSort(root);
}
/* explanation block after answering */
function explainHTML(q,a){
  const s=q.sq, ok=isRight(q,a), u=q.unit.src;
  const exp=s.explanation||(q.type==='msr'?'':u.explanation)||'';
  const key=keyOf(q);
  const keyTxt=Array.isArray(key)?'':` The answer is <b>${LET[key]}</b>.`;
  return `<div class="fb ${ok?'ok':'bad'} gx"><b>${ok?'Correct.':a==null?'Not answered.':'Not quite.'}</b>${keyTxt}</div>
    <div class="expl">${paras(exp)}${s.trap?`<p class="trap"><b>Trap:</b> ${fmt(s.trap)}</p>`:''}</div>`;
}
/* full exam-style screen: context pane + question pane */
function unitScreen(q,a,opts={}){
  const ctx=ctxHTML(q,opts.tab);
  const meta=opts.meta||'';
  const inner=`${meta}<div class="qa" data-q="${esc(q.qid)}">${qHTML(q,a,opts)}</div>`;
  return ctx?`<div class="split"><div class="pane-l">${ctx}</div><div class="pane-r">${inner}</div></div>`:`<div class="single">${inner}</div>`;
}

/* ---------- on-screen calculator (Data Insights only, like the real exam) ---------- */
function openCalc(){
  if($('#calc')){$('#calc').remove();return;}
  const d=document.createElement('div');d.id='calc';d.className='calc';d.setAttribute('role','dialog');d.setAttribute('aria-label','Calculator');
  const keys=['MC','MR','M+','√','7','8','9','÷','4','5','6','×','1','2','3','-','0','.','%','+','C','(',')','='];
  d.innerHTML=`<div class="calc-h"><b>Calculator</b><button class="spk sm" id="calcX" aria-label="Close calculator">${ic('x')}</button></div><input id="calcD" class="calc-d num" inputmode="decimal" value="0" aria-label="Display"><div class="calc-k">${keys.map(k=>`<button data-k="${k}" class="${'=+-×÷'.includes(k)?'op':''}">${k}</button>`).join('')}</div>`;
  document.body.appendChild(d);
  let mem=0; const disp=$('#calcD',d);
  const evalExpr=t=>{const s=t.replace(/×/g,'*').replace(/÷/g,'/').replace(/√\(?([0-9.]+)\)?/g,'Math.sqrt($1)').replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');
    if(!/^[0-9+\-*/().\s]*$/.test(s.replace(/Math\.sqrt/g,'')))throw 0;const v=Function('"use strict";return ('+s+')')();if(!isFinite(v))throw 0;return +(+v).toPrecision(12);};
  const press=k=>{let t=disp.value;
    if(k==='C'){disp.value='0';return;}
    if(k==='='){try{disp.value=String(evalExpr(t));}catch(e){disp.value='Error';}return;}
    if(k==='MC'){mem=0;return;} if(k==='MR'){disp.value=(t==='0'||t==='Error')?String(mem):t+mem;return;}
    if(k==='M+'){try{mem+=evalExpr(t);toast('Memory: '+mem,1200);}catch(e){}return;}
    if(t==='0'||t==='Error')t='';
    disp.value=t+k;};
  $$('[data-k]',d).forEach(b=>b.onclick=()=>press(b.dataset.k));
  disp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();press('=');}};
  $('#calcX',d).onclick=()=>d.remove();
}
