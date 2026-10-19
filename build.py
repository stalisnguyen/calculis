"""Build index.html (static site for Vercel) from src/.
Feature modules in src/features/*.js are pasted inside the app closure right before boot,
and src/features/*.css are appended to src/app.css.
Run: python3 build.py
"""
from pathlib import Path

root = Path(__file__).parent
shell = (root / "src/shell.html").read_text(encoding="utf-8")
css = (root / "src/app.css").read_text(encoding="utf-8")
css += "".join("\n" + f.read_text(encoding="utf-8") for f in sorted((root / "src/features").glob("*.css")))
js = (root / "src/app.js").read_text(encoding="utf-8")
feats = "".join((f.read_text(encoding="utf-8") + "\n") for f in sorted((root / "src/features").glob("*.js")))
marker = "/* ================= boot ================= */"
assert marker in js, "boot marker missing"
js = js.replace(marker, feats + marker, 1)
body = shell.replace("/*CSS*/", css).replace("/*JS*/", js)
head, rest = body.split("<!--BODY-->", 1)
(root / "index.html").write_text(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    "<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
    "img{max-width:100%}[hidden]{display:none!important}</style>"
    '<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#5A1F4E">'
    '<link rel="icon" href="/icons/icon-192.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">'
    '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Calculis">'
    + head + "</head><body>" + rest + "</body></html>",
    encoding="utf-8",
)
print("built index.html", len(body) // 1024, "KB")
