"""Headless smoke test: serve the repo, open every view at 390px and 1200px, report JS errors and horizontal overflow, save screenshots.
Usage: python3 tools/smoke.py [view ...]   (screenshots go to /tmp/calculis-shots)"""
import sys, subprocess, time, os, json
from playwright.sync_api import sync_playwright
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH','/opt/pw-browsers')
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=os.environ.get('SHOTS','/tmp/calculis-shots'); os.makedirs(out,exist_ok=True)
VIEWS=sys.argv[1:] or ['home','quant','verbal','di','errors','mock','lessons','cards','tutor','progress','friends','settings']
srv=subprocess.Popen([sys.executable,'-m','http.server',os.environ.get('PORT','8765')],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
bad=0
try:
  with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in [(390,844),(1200,860)]:
      ctx=b.new_context(viewport={'width':w,'height':h})
      ctx.add_init_script("localStorage.setItem('calculis-who',JSON.stringify({name:'Test',slug:'test'}));localStorage.setItem('calculis-intro','1');")
      pg=ctx.new_page(); errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)))
      pg.on('console',lambda m:errs.append('console: '+m.text) if m.type=='error' and 'api/' not in m.text and '404' not in m.text and 'fonts.g' not in m.text and 'ERR_FAILED' not in m.text else None)
      pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
      for v in VIEWS:
        errs.clear()
        pg.goto('http://localhost:'+os.environ.get('PORT','8765')+'/#'+v); pg.wait_for_timeout(1300)
        ov=pg.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
        txt=pg.evaluate("(document.querySelector('#view')||{}).innerText||''")[:80].replace('\n',' | ')
        pg.screenshot(path=f'{out}/{v}-{w}.png',full_page=False)
        flag='' if not errs and ov<=0 else ' <<<'
        if flag: bad+=1
        print(f'{w} {v:10} overflow={ov} errs={errs[:3]} :: {txt}{flag}')
    b.close()
finally:
  srv.terminate()
print('PROBLEMS',bad)
