"""Render app icons from the Max mascot (content/mascot_fox.js) with headless Chromium."""
import os
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH','/opt/pw-browsers')
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js=open(os.path.join(root,'content/mascot_fox.js')).read()
def page(size,pad,bg,radius):
    return f"""<html><body style="margin:0;background:transparent"><div id=b style="width:{size}px;height:{size}px;background:{bg};border-radius:{radius}px;display:grid;place-items:center;overflow:hidden"></div>
<script>{js};document.getElementById('b').innerHTML=foxSVG('hi',{int(size*(1-pad))},4).replace('<svg ','<svg style="margin-top:{int(size*0.04)}px" ');</script></body></html>"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,size,pad,radius in [('icon-192.png',192,.14,0),('icon-512.png',512,.14,0),('mask-icon-512.png',512,.3,0),('apple-touch-icon.png',180,.14,0)]:
        pg=b.new_page(viewport={'width':size,'height':size})
        pg.set_content(page(size,pad,'radial-gradient(circle at 50% 35%,#7A2D6B,#5A1F4E 70%)',radius))
        pg.screenshot(path=os.path.join(root,'icons',name),omit_background=True)
    b.close()
print('icons ok')
