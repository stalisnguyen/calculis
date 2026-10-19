"""Headless flow test: one practice question of every type answered through the UI, a timed section mock, the diagnostic.
Usage: PORT=8792 python3 tools/flows.py   (screenshots in /tmp/calculis-flows)"""
import sys, subprocess, time, os, json, random
from playwright.sync_api import sync_playwright
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH','/opt/pw-browsers')
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out='/tmp/calculis-flows'; os.makedirs(out,exist_ok=True)
PORT=os.environ.get('PORT','8792')
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1); bad=[]
ANSWER_JS="""(right)=>{const C=window.__calculis;const qa=document.querySelector('.qa');const q=C.QI.get(qa.dataset.q);const k=C.keyOf(q);
 const wrongOf=(n,v)=>(v+1)%n;
 if(Array.isArray(k)){
   if(q.type==='gi'){[...document.querySelectorAll('.gi-sel')].forEach((s,i)=>{const n=s.options.length-1;s.value=String(right?k[i]:wrongOf(n,k[i]));s.dispatchEvent(new Event('change'));});}
   else if(q.type==='tpa'){k.forEach((v,c)=>{const n=q.sq.options.length;document.querySelector(`.radio[data-c="${c}"][data-k="${right?v:wrongOf(n,v)}"]`).click();});}
   else{k.forEach((v,i)=>document.querySelector(`.radio[data-s="${i}"][data-v="${right?v:1-v}"]`).click());}
 } else document.querySelector(`.gopt[data-k="${right?k:(k+1)%5}"]`).click();
 return q.type;}"""
try:
  with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in [(390,844),(1200,860)]:
      ctx=b.new_context(viewport={'width':w,'height':h})
      ctx.add_init_script("localStorage.setItem('calculis-who',JSON.stringify({name:'Test',slug:'test'}));localStorage.setItem('calculis-intro','1');")
      pg=ctx.new_page(); errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)))
      pg.on('dialog',lambda d:d.accept())
      pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
      pg.goto(f'http://localhost:{PORT}/#home'); pg.wait_for_timeout(1500)
      pg.evaluate('window.__calculis.loadBank()'); pg.wait_for_timeout(500)
      for t in ['ps','ds','cr','rc','ta','gi','tpa','msr']:
        right = t not in ('cr','gi')
        pg.evaluate("t=>{const C=window.__calculis;const u=C.UNITS.find(u=>u.type===t&&u.diff>=3);C.prStart(u.qs.slice(0,1),{title:'t',sec:u.sec});}",t)
        pg.wait_for_timeout(300)
        pg.evaluate(ANSWER_JS,right); pg.wait_for_timeout(100)
        dis=pg.evaluate("document.querySelector('#rnSub').disabled")
        if dis: bad.append(f'{w} {t}: submit disabled after answering')
        pg.click('#rnSub'); pg.wait_for_timeout(250)
        fb=pg.evaluate("(document.querySelector('.fb')||{}).className||''")
        if ('ok' in fb)!=right: bad.append(f'{w} {t}: feedback {fb} expected right={right}')
        ov=pg.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
        if ov>0: bad.append(f'{w} {t}: overflow {ov}')
        pg.screenshot(path=f'{out}/{t}-{w}.png',full_page=True)
        pg.click('#rnNext'); pg.wait_for_timeout(250)
      # section mock: quant, answer everything, use review with 1 edit
      pg.evaluate("window.__calculis.mkNew('section',['di'],-1)"); pg.wait_for_timeout(300)
      pg.click('#exGo'); pg.wait_for_timeout(200)
      n=0
      while pg.query_selector('#exNext') and n<40:
        pg.evaluate(ANSWER_JS,random.random()<0.6); pg.wait_for_timeout(30)
        if n==2: pg.screenshot(path=f'{out}/mock-q-{w}.png',full_page=False)
        pg.click('#exNext'); pg.wait_for_timeout(60); n+=1
      if n!=20: bad.append(f'{w} di section had {n} questions')
      pg.screenshot(path=f'{out}/mock-review-{w}.png')
      pg.click('[data-o="0"]'); pg.wait_for_timeout(150); pg.click('#rvSave'); pg.wait_for_timeout(150)
      pg.click('#rvEnd'); pg.wait_for_timeout(200); pg.click('#cfY'); pg.wait_for_timeout(600)
      txt=pg.inner_text('#view')[:200].replace('\n',' | ')
      print(w,'section result:',txt)
      pg.screenshot(path=f'{out}/mock-result-{w}.png',full_page=True)
      # diagnostic
      pg.evaluate("window.__calculis.mkNew('diag',['quant','verbal','di'],-1)"); pg.wait_for_timeout(300)
      n=0
      for sec in range(3):
        pg.click('#exGo'); pg.wait_for_timeout(150)
        while pg.query_selector('#exNext') and n<30:
          pg.evaluate(ANSWER_JS,random.random()<0.5); pg.wait_for_timeout(20); pg.click('#exNext'); pg.wait_for_timeout(50); n+=1
      txt=pg.inner_text('#view')[:200].replace('\n',' | ')
      print(w,'diag',n,'questions:',txt)
      pg.screenshot(path=f'{out}/diag-result-{w}.png',full_page=True)
      st=pg.evaluate("(()=>{const P=window.__calculis.state();return {att:Object.keys(P.att).length,err:Object.keys(P.err).length,mocks:P.mocks.length,diag:P.diag,xp:Object.values(P.day).reduce((a,d)=>a+d.xp,0),score:window.__calculis.scoreNow()}})()")
      print(w,'state',json.dumps(st)[:400])
      pg.goto(f'http://localhost:{PORT}/#home'); pg.wait_for_timeout(800); pg.screenshot(path=f'{out}/home-after-{w}.png',full_page=True)
      pg.goto(f'http://localhost:{PORT}/#errors'); pg.wait_for_timeout(800); pg.screenshot(path=f'{out}/errors-{w}.png',full_page=True)
      pg.goto(f'http://localhost:{PORT}/#progress'); pg.wait_for_timeout(800); pg.screenshot(path=f'{out}/progress-{w}.png',full_page=True)
      if errs: bad.append(f'{w} JS errors: {errs[:4]}')
    b.close()
finally:
  srv.terminate()
print('PROBLEMS',len(bad)); [print(' -',x) for x in bad]
