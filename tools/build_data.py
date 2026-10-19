"""Pack content/out/*.json into data/*.json for the app.
quant.json (ps), ds.json, cr.json, rc.json, di.json (ta, gi, tpa, msr), lessons.json, cards.json.
Money: the content was written without "$" (the checker bans it to avoid LaTeX); here "USD 80", "80 dollars" become "$80".
Run: python3 tools/build_data.py"""
import json, re, glob, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'data'); os.makedirs(out, exist_ok=True)
NUM = r'(\d[\d,]*(?:\.\d+)?)'
SCALE = r'(?:\s(million|billion|thousand))?'
def money(s):
    s = re.sub(r'\bUSD\s?' + NUM + SCALE, lambda m: '$' + m.group(1) + (' ' + m.group(2) if m.group(2) else ''), s)
    s = re.sub(NUM + SCALE + r'[ -]dollars?\b', lambda m: '$' + m.group(1) + (' ' + m.group(2) if m.group(2) else ''), s)
    s = re.sub(r'\(USD( [a-z]+)?\)', lambda m: '($' + (m.group(1) or '') + ')', s)
    s = s.replace('(USD)', '($)')
    return s
def walk(x):
    if isinstance(x, str): return money(x)
    if isinstance(x, list): return [walk(v) for v in x]
    if isinstance(x, dict): return {k: walk(v) for k, v in x.items()}
    return x
groups = {'glossary': [], 'quant': [], 'ds': [], 'cr': [], 'rc': [], 'di': [], 'lessons': [], 'cards': []}
for f in sorted(glob.glob(os.path.join(root, 'content/out/*.json'))):
    name = os.path.basename(f)
    data = walk(json.load(open(f, encoding='utf-8')))
    for x in data:
        t = x.get('type')
        g = 'lessons' if name.startswith('lessons') else 'cards' if name.startswith('cards') else 'glossary' if name.startswith('glossary') else {'ps': 'quant', 'ds': 'ds', 'cr': 'cr', 'rc': 'rc'}.get(t, 'di')
        groups[g].append(x)
ids = set()
for g, arr in groups.items():
    for x in arr:
        assert x['id'] not in ids, 'duplicate id ' + x['id']
        ids.add(x['id'])
    json.dump(arr, open(os.path.join(out, g + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(g, len(arr), os.path.getsize(os.path.join(out, g + '.json')) // 1024, 'KB')
