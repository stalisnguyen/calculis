/* ================= AI TUTOR: "Ask Max" on any question, and a free chat view ================= */
const MAX_SYS=`You are Max, a friendly, sharp GMAT Focus Edition tutor (a fox mascot) inside the Calculis study app. The exam has Quant (Problem Solving only, no geometry, no calculator), Verbal (Critical Reasoning and Reading Comprehension only) and Data Insights (Data Sufficiency, Table Analysis, Graphics Interpretation, Two-Part Analysis, Multi-Source Reasoning). Reply in clear, plain English. Be concise: short paragraphs, step-by-step working, numbered steps when useful, no LaTeX (write x², √, ≤ in plain Unicode), no em dashes. Prefer the fastest valid method and mention a shortcut (picking numbers, backsolving, estimation) when it helps. If you are not sure about something, say so.`;
function mdHTML(t){
  const out=[];let list=null,lt='ul',para=[];
  const flushP=()=>{if(para.length){out.push(`<p>${fmt(para.join('\n'))}</p>`);para=[];}};
  const flushL=()=>{if(list){out.push(`<${lt}>${list.map(x=>`<li>${fmt(x)}</li>`).join('')}</${lt}>`);list=null;}};
  String(t||'').replace(/<think>[\s\S]*?<\/think>/g,'').split('\n').forEach(line=>{const l=line.trim();
    if(!l){flushP();flushL();return;}
    let m=l.match(/^[-*•] (.*)/);if(m){flushP();if(list&&lt!=='ul')flushL();lt='ul';(list=list||[]).push(m[1]);return;}
    m=l.match(/^\d+[.)] (.*)/);if(m){flushP();if(list&&lt!=='ol')flushL();lt='ol';(list=list||[]).push(m[1]);return;}
    m=l.match(/^#+ (.*)/);if(m){flushP();flushL();out.push(`<p><b>${fmt(m[1])}</b></p>`);return;}
    flushL();para.push(l);});
  flushP();flushL();return out.join('');
}
function qText(q,a){
  const s=q.sq,u=q.unit.src,L=i=>LET[i];
  const ch=arr=>arr.map((c,i)=>`(${L(i)}) ${c}`).join('\n');
  let t=`Question type: ${TYPE_NAME[q.type]} (${q.sub||q.topic}), difficulty ${q.diff}/5.\n`;
  if(q.type==='ps')t+=`${s.stem}\n${ch(s.choices)}`;
  else if(q.type==='ds')t+=`${s.info?s.info+'\n':''}${s.question}\n(1) ${s.s1}\n(2) ${s.s2}\nStandard DS answer choices: (A) 1 alone, (B) 2 alone, (C) together, (D) each alone, (E) not sufficient.`;
  else if(q.type==='cr')t+=`${s.stimulus.replace(/\*\*/g,'[bold]')}\n${s.stem}\n${ch(s.choices)}`;
  else if(q.type==='rc')t+=`Passage:\n${u.paras.join('\n\n')}\n\n${s.stem}\n${ch(s.choices)}`;
  else if(q.type==='msr')t+=`Sources:\n${u.tabs.map(x=>`[${x.title}] ${x.text||''}${x.table?'\n'+[x.table.cols.join(' | '),...x.table.rows.map(r=>r.join(' | '))].join('\n'):''}`).join('\n')}\n\n${s.kind==='mcq'?s.stem+'\n'+ch(s.choices):s.prompt+'\n'+s.statements.map((x,i)=>`${i+1}. ${x.text}`).join('\n')}`;
  else if(q.type==='ta')t+=`${s.intro||''}\nTable: ${s.cols.join(' | ')}\n${s.rows.map(r=>r.join(' | ')).join('\n')}\n${s.prompt}\n${s.statements.map((x,i)=>`${i+1}. ${x.text}`).join('\n')}`;
  else if(q.type==='gi')t+=`${s.intro||''}\nChart (${s.chart.kind}): ${s.chart.title}. x = ${s.chart.x.join(', ')}\n${s.chart.series.map(se=>se.name+': '+se.values.join(', ')).join('\n')}\nSentence: ${s.text}\n${s.blanks.map((b,i)=>`Blank ${i+1} options: ${b.options.join(' / ')}`).join('\n')}`;
  else if(q.type==='tpa')t+=`${s.stem}\nColumns: ${s.cols.join(' / ')}\nOptions:\n${s.options.map((o,i)=>`${i+1}. ${o}`).join('\n')}`;
  const k=keyOf(q);
  const show=v=>v==null?'no answer':Array.isArray(v)?v.map(x=>x==null?'-':(q.type==='tpa'?s.options[x]:q.type==='gi'?'option '+(x+1):(s.labels||['True','False'])[x])).join(', '):'('+L(v)+')';
  t+=`\n\nCorrect answer: ${show(k)}\nStudent's answer: ${show(a)}\nOfficial explanation: ${s.explanation||u.explanation||''}`;
  return t;
}
function askMaxAbout(q,a){
  const m=modal(`<h2>${ic('sparkles')} Ask Max</h2><div class="chat-box" id="amBox"></div>
    <div class="row am-q">${['Explain it another way','Show a faster shortcut','Why is my answer wrong?','Give me a similar question'].map(t=>`<button class="chip sm" data-p="${t}">${t}</button>`).join('')}</div>
    <form class="row composer" id="amF"><input type="text" id="amI" placeholder="Ask about this question" style="flex:1 1 200px"><button class="btn primary" aria-label="Send">${ic('send')}</button></form>`);
  m.el.classList.add('wide');
  const msgs=[{role:'user',content:MAX_SYS+'\n\nHere is the question the student is working on:\n\n'+qText(q,a)}];
  const box=$('#amBox',m.el);
  const add=(who,html)=>{box.insertAdjacentHTML('beforeend',`<div class="cm ${who}">${who==='max'?`<span class="cm-av">${foxSVG('calm',30,mcRankIdx())}</span>`:''}<div class="cm-b">${html}</div></div>`);box.scrollTop=box.scrollHeight;};
  const send=async text=>{text=text.trim();if(!text)return;add('me',esc(text));
    const first=msgs.length===1;if(first)msgs[0].content+='\n\nStudent asks: '+text;else msgs.push({role:'user',content:text});
    add('max','<span class="typing">Max is thinking...</span>');
    try{const r=await ask(msgs,{modelTier:'default'});$('.cm:last-child',box).remove();msgs.push({role:'assistant',content:r.text});add('max',mdHTML(r.text));award('tutor',1);}
    catch(e){$('.cm:last-child',box).remove();add('max',esc(aiError(e)));if(first)msgs[0].content=msgs[0].content.replace(/\n\nStudent asks: [\s\S]*$/,'');else msgs.pop();}};
  $$('[data-p]',m.el).forEach(b=>b.onclick=()=>send(b.dataset.p));
  $('#amF',m.el).onsubmit=e=>{e.preventDefault();const i=$('#amI',m.el);send(i.value);i.value='';};
  add('max',isRight(q,a)?'Nice, you got this one. Want a shortcut or a harder twin?':'Let us untangle this one. Pick a prompt or ask your own question.');
}

/* ---------- tutor view ---------- */
let TU=null;
function tutorKey(){return 'calculis-tutor:'+(WHO?WHO.slug:'');}
function tutorContext(){
  const sc=scoreNow(), rows=[];
  SECS.forEach(sec=>{try{prStats(sec).filter(r=>r.n>=3).forEach(r=>rows.push(`${SEC_NAME[sec]} / ${r.t}: ${Math.round(r.ok/r.n*100)}% of ${r.n}`));}catch(e){}});
  const c=plCfg();
  return `Student context: target ${c.target}, ${c.minutes} min/day${c.date?`, exam date ${c.date}`:''}. Current estimates: Quant ${sc.quant??'unknown'}, Verbal ${sc.verbal??'unknown'}, DI ${sc.di??'unknown'}, total ${sc.total??'unknown'}. Accuracy by topic: ${rows.slice(0,24).join('; ')||'not enough data yet'}. Open error log items: ${errOpen().length}.`;
}
let TU_PENDING=null;
function tutorOpen(text){TU_PENDING=text;go('tutor');}
VIEWS.tutor=el=>{
  TU=TU||store.get(tutorKey(),[]);
  const draw=()=>{
    el.innerHTML=`<div class="view tutor">
      ${!AI?mcSay('hmm',WEB&&WEB.ai?'Sign in with Google (or enter an invite code) to talk to Max.':'The AI tutor is not switched on on the server yet (needs GROQ_API_KEY and APP_PASSWORD in Vercel).',56)+(WEB&&WEB.ai?'<button class="btn primary" id="tuKey" style="align-self:flex-start">Sign in or enter a code</button>':''):''}
      <div class="chat-box big" id="tuBox">${TU.length?TU.map(m=>`<div class="cm ${m.role==='assistant'?'max':'me'}">${m.role==='assistant'?`<span class="cm-av">${foxSVG('calm',30,mcRankIdx())}</span>`:''}<div class="cm-b">${m.role==='assistant'?mdHTML(m.content):esc(m.content)}</div></div>`).join(''):mcSay('hi','Hi, I am Max. Ask me anything about the GMAT: a concept, a strategy, a question you saw somewhere, or a plan for the weeks before your exam.',60)}</div>
      <div class="row am-q">${['Make me a 4-week plan from my scores','How do I stop running out of time in Quant?','Explain the AD/BCE method for Data Sufficiency','Give me a hard Critical Reasoning question','Which topics should I fix first?'].map(t=>`<button class="chip sm" data-p="${esc(t)}">${t}</button>`).join('')}</div>
      <form class="row composer" id="tuF"><textarea id="tuI" rows="2" placeholder="Ask Max" style="flex:1 1 220px"></textarea><button class="btn primary" aria-label="Send">${ic('send')}</button></form>
      ${TU.length?'<button class="btn ghost sm" id="tuClr" style="align-self:flex-start">Clear chat</button>':''}</div>`;
    const box=$('#tuBox');box.scrollTop=box.scrollHeight;
    const k=$('#tuKey');if(k)k.onclick=async()=>{if(await askPassword(false)){await initPlatform();draw();}};
    $$('[data-p]',el).forEach(b=>b.onclick=()=>send(b.dataset.p));
    $('#tuF').onsubmit=e=>{e.preventDefault();send($('#tuI').value);};
    $('#tuI').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send($('#tuI').value);}};
    const c=$('#tuClr');if(c)c.onclick=()=>{TU=[];store.set(tutorKey(),TU);draw();};
  };
  const send=async text=>{text=String(text||'').trim();if(!text)return;if(!AI){toast(aiError({code:'no_ai'}));return;}
    TU.push({role:'user',content:text});draw();
    $('#tuBox').insertAdjacentHTML('beforeend',`<div class="cm max"><span class="cm-av">${foxSVG('idea',30,mcRankIdx())}</span><div class="cm-b"><span class="typing">Max is thinking...</span></div></div>`);$('#tuBox').scrollTop=1e9;
    const hist=TU.slice(-12).map(m=>({role:m.role,content:m.content}));hist[0]={role:'user',content:MAX_SYS+'\n\n'+tutorContext()+'\n\n'+hist[0].content};
    if(hist[0].role!=='user')hist.shift();
    try{const r=await ask(hist);TU.push({role:'assistant',content:r.text});award('tutor',1);}catch(e){TU.push({role:'assistant',content:aiError(e)});}
    TU=TU.slice(-40);store.set(tutorKey(),TU);if(current==='tutor')draw();};
  draw();
  if(TU_PENDING){const t=TU_PENDING;TU_PENDING=null;setTimeout(()=>send(t),50);}
};

/* ---------- step-by-step hints (before answering) and Vietnamese explanation (after) ----------
   Both come from Max (Groq) and are cached on this device, so a question costs one AI call at most per level. */
const HINT_CACHE=store.get('calculis-hints',{});
async function hintFor(q,level){
  const k=q.qid+'|'+level; if(HINT_CACHE[k])return HINT_CACHE[k];
  const prev=[1,2].filter(n=>n<level).map(n=>HINT_CACHE[q.qid+'|'+n]).filter(Boolean);
  const ask_=`${MAX_SYS}\n\nA beginner is stuck on this question and asked for hint number ${level} of 3.\n${level===1?'Hint 1: say what the question is really asking and the first thing to do. Do not compute anything for them.':level===2?'Hint 2: give the key idea or the key step, with a little working, but do NOT reveal the final answer or the answer letter.':'Hint 3: walk them almost to the end, leaving only the last small step. Still do NOT state the final answer or the letter.'}\nKeep it under 70 words. Plain English, no headings.${prev.length?`\nHints already given:\n${prev.map((h,i)=>`${i+1}. ${h}`).join('\n')}`:''}\n\n${qText(q,null).replace(/\n\nCorrect answer:[\s\S]*$/,'')}`;
  const r=await ask(ask_,{modelTier:'quick'}); const t=r.text.trim();
  HINT_CACHE[k]=t; const keys=Object.keys(HINT_CACHE); if(keys.length>600)delete HINT_CACHE[keys[0]]; store.set('calculis-hints',HINT_CACHE);
  return t;
}
const VI_CACHE=store.get('calculis-vi',{});
async function viExplain(q,a){
  if(VI_CACHE[q.qid])return VI_CACHE[q.qid];
  const p=`Bạn là Max, gia sư GMAT thân thiện. Hãy giải thích câu hỏi dưới đây bằng tiếng Việt cho một người mới học GMAT. Giữ nguyên các thuật ngữ tiếng Anh quan trọng (ví dụ remainder, sufficient, assumption) và ghi nghĩa tiếng Việt trong ngoặc ở lần đầu. Trình bày từng bước, ngắn gọn, khoảng 120-220 từ: (1) đề đang hỏi gì, (2) cách giải nhanh nhất, (3) vì sao đáp án đúng, (4) bẫy dễ mắc. Không dùng LaTeX, không dùng dấu gạch ngang dài.\n\n${qText(q,a)}`;
  const r=await ask(p); const t=r.text.trim();
  VI_CACHE[q.qid]=t; const keys=Object.keys(VI_CACHE); if(keys.length>300)delete VI_CACHE[keys[0]]; store.set('calculis-vi',VI_CACHE);
  return t;
}
/* wire the two buttons inside a question screen */
function bindHelp(root,q,getA){
  const hb=$('[data-hint]',root);
  if(hb){let lvl=0;const box=$('#hintBox',root);
    hb.onclick=async()=>{if(!AI){toast(aiError({code:'no_ai'}));return;}if(lvl>=3)return;lvl++;hb.disabled=true;
      box.insertAdjacentHTML('beforeend',`<div class="hint" data-l="${lvl}"><b>Hint ${lvl}</b> <span class="typing">Max is thinking...</span></div>`);
      try{const t=await hintFor(q,lvl);$(`.hint[data-l="${lvl}"]`,box).innerHTML=`<b>Hint ${lvl}</b> ${fmt(t)}`;}catch(e){$(`.hint[data-l="${lvl}"]`,box).remove();lvl--;toast(aiError(e));}
      hb.disabled=lvl>=3;hb.innerHTML=lvl>=3?'No more hints':`${ic('lightbulb')} Hint ${lvl+1} of 3`;};}
  const vb=$('[data-vi]',root);
  if(vb){vb.onclick=async()=>{if(!AI){toast(aiError({code:'no_ai'}));return;}const box=$('#viBox',root);vb.disabled=true;box.innerHTML='<div class="expl"><span class="typing">Max đang viết...</span></div>';
    try{const t=await viExplain(q,getA());box.innerHTML=`<div class="expl vi">${mdHTML(t)}</div>`;}catch(e){box.innerHTML='';vb.disabled=false;toast(aiError(e));}};}
}
