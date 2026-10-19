"""Render the link preview image icons/og.png (1200x630) with Max the fox."""
import os
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH','/opt/pw-browsers')
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js=open(os.path.join(root,'content/mascot_fox.js')).read()
tags=''.join(f'<span style="background:#E0A72E;color:#2A1404;border-radius:999px;padding:8px 18px;font-size:22px;font-weight:700">{t}</span>' for t in ['Quant','Verbal','Data Insights','Mocks 205-805'])
html=f"""<html><body style="margin:0"><div style="width:1200px;height:630px;background:radial-gradient(circle at 75% 45%,#7A2D6B,#5A1F4E 55%,#3A1233);display:flex;align-items:center;font-family:system-ui,sans-serif;color:#fff;overflow:hidden">
<div style="flex:1;padding:0 0 0 80px"><div style="font-size:96px;font-weight:800;letter-spacing:-2px;line-height:1">Calculis</div>
<div style="font-size:34px;font-style:italic;opacity:.9;margin-top:10px">Stalis's GMAT</div>
<div style="font-size:30px;margin-top:36px;line-height:1.45;max-width:640px;opacity:.95">GMAT Focus Edition practice from the basics to 705+, with Max the fox</div>
<div style="display:flex;gap:12px;margin-top:34px;flex-wrap:wrap;max-width:680px">{tags}</div></div>
<div id=m style="width:470px;display:grid;place-items:center"></div></div>
<script>{js};document.getElementById('m').innerHTML=foxSVG('hi',430,4);</script></body></html>"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':630}); pg.set_content(html); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(root,'icons','og.png')); b.close()
print('og ok')
