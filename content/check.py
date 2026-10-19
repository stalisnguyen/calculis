"""Validate Calculis content. Usage: python3 check.py <kind> <file>"""
import json, re, sys, collections
kind, path = sys.argv[1], sys.argv[2]
err = []
try: D = json.load(open(path, encoding='utf-8'))
except Exception as e: print('INVALID JSON:', e); sys.exit(1)
def bad(s, w):
    if '—' in s: err.append(f'{w}: em dash')
    if re.search('[←-⇿]', s): err.append(f'{w}: unicode arrow')
    if re.search(r'\\(frac|sqrt|cdot|times|le|ge)\b|\$', s): err.append(f'{w}: LaTeX or $ found')
def walk(x, w='root'):
    if isinstance(x, str): bad(x, w)
    elif isinstance(x, list): [walk(v, f'{w}[{i}]') for i, v in enumerate(x)]
    elif isinstance(x, dict): [walk(v, f'{w}.{k}') for k, v in x.items()]
walk(D)
def need(o, keys, w):
    for k in keys:
        if k not in o or o[k] in ('', None, []): err.append(f'{w}: missing {k}')
TOPICS = {'Arithmetic', 'Algebra', 'Word Problems', 'Number Properties', 'Statistics', 'Counting & Probability'}
ids = set()
def uid(i, w):
    if i in ids: err.append(f'{w}: duplicate id {i}')
    ids.add(i)
def mc(o, w, n=5):
    c = o.get('choices') or []
    if len(c) != n: err.append(f'{w}: needs {n} choices')
    if len(set(map(str, c))) != len(c): err.append(f'{w}: duplicate choices')
    a = o.get('answer')
    if not isinstance(a, int) or not 0 <= a < len(c): err.append(f'{w}: answer index')
    return a
def diffok(o, w):
    if o.get('diff') not in (1, 2, 3, 4, 5): err.append(f'{w}: diff 1-5')
pos = collections.Counter()
if not isinstance(D, list): err.append('root must be an array')
elif kind == 'ps':
    for i, q in enumerate(D):
        w = f"ps {q.get('id', i)}"; need(q, ['id', 'topic', 'sub', 'stem', 'explanation', 'trap', 'time'], w); uid(q.get('id'), w); diffok(q, w)
        if q.get('topic') not in TOPICS: err.append(f'{w}: topic {q.get("topic")}')
        pos[mc(q, w)] += 1
        if re.search(r'\b(triangle|circle|radius|polygon|angle|perimeter|area of)\b', q.get('stem', ''), re.I): err.append(f'{w}: plane geometry is not tested')
elif kind == 'ds':
    for i, q in enumerate(D):
        w = f"ds {q.get('id', i)}"; need(q, ['id', 'topic', 'question', 's1', 's2', 'explanation', 'trap'], w); uid(q.get('id'), w); diffok(q, w)
        if q.get('topic') not in TOPICS: err.append(f'{w}: topic')
        if q.get('answer') not in (0, 1, 2, 3, 4): err.append(f'{w}: answer 0-4')
        pos[q.get('answer')] += 1
        if re.search(r'\b(triangle|circle|radius|polygon|angle)\b', q.get('question', '') + q.get('s1', '') + q.get('s2', ''), re.I): err.append(f'{w}: plane geometry')
elif kind == 'cr':
    QT = {'assumption', 'strengthen', 'weaken', 'evaluate', 'inference', 'flaw', 'boldface', 'explain', 'plan', 'complete'}
    for i, q in enumerate(D):
        w = f"cr {q.get('id', i)}"; need(q, ['id', 'qtype', 'stimulus', 'stem', 'explanation'], w); uid(q.get('id'), w); diffok(q, w)
        if q.get('qtype') not in QT: err.append(f'{w}: qtype')
        if q.get('qtype') == 'boldface' and q.get('stimulus', '').count('**') != 4: err.append(f'{w}: boldface needs two **bold** parts')
        n = len(re.findall(r"[A-Za-z']+", q.get('stimulus', '')))
        if not 30 <= n <= 140: err.append(f'{w}: stimulus {n} words')
        pos[mc(q, w)] += 1
elif kind == 'rc':
    for i, p in enumerate(D):
        w = f"rc {p.get('id', i)}"; need(p, ['id', 'title', 'paras', 'questions'], w); uid(p.get('id'), w); diffok(p, w)
        n = sum(len(re.findall(r"[A-Za-z']+", x)) for x in p.get('paras', []))
        if not 180 <= n <= 450: err.append(f'{w}: passage {n} words')
        qs = p.get('questions', [])
        if not 3 <= len(qs) <= 4: err.append(f'{w}: 3-4 questions')
        for j, q in enumerate(qs):
            ww = f'{w}.q{j}'; need(q, ['id', 'qtype', 'stem', 'explanation'], ww); uid(q.get('id'), ww); pos[mc(q, ww)] += 1
elif kind == 'di':
    for i, q in enumerate(D):
        t = q.get('type'); w = f"{t} {q.get('id', i)}"; uid(q.get('id'), w); diffok(q, w); need(q, ['id', 'type', 'explanation' if t != 'msr' else 'questions'], w)
        if t == 'ta':
            need(q, ['cols', 'rows', 'statements', 'labels', 'prompt'], w)
            for r in q.get('rows', []):
                if len(r) != len(q.get('cols', [])): err.append(f'{w}: row length')
            if len(q.get('statements', [])) != 3: err.append(f'{w}: 3 statements')
        elif t == 'gi':
            need(q, ['chart', 'text', 'blanks'], w); c = q.get('chart', {})
            for s in c.get('series', []):
                if len(s.get('values', [])) != len(c.get('x', [])): err.append(f'{w}: series length')
            if q.get('text', '').count('[[') != 2 or len(q.get('blanks', [])) != 2: err.append(f'{w}: two blanks')
            for b in q.get('blanks', []):
                if not 0 <= b.get('answer', -1) < len(b.get('options', [])): err.append(f'{w}: blank answer')
        elif t == 'tpa':
            need(q, ['stem', 'cols', 'options', 'answer'], w); a = q.get('answer', [])
            if not (isinstance(a, list) and len(a) == 2 and all(isinstance(x, int) and 0 <= x < len(q.get('options', [])) for x in a)): err.append(f'{w}: answer [i,j]')
        elif t == 'msr':
            need(q, ['tabs', 'questions'], w)
            if not 2 <= len(q.get('tabs', [])) <= 3: err.append(f'{w}: 2-3 tabs')
            if len(q.get('questions', [])) != 3: err.append(f'{w}: 3 questions')
            for j, x in enumerate(q.get('questions', [])):
                if x.get('kind') == 'mcq': mc(x, f'{w}.q{j}')
                elif x.get('kind') == 'yesno':
                    if len(x.get('statements', [])) != 3: err.append(f'{w}.q{j}: 3 statements')
                else: err.append(f'{w}.q{j}: kind')
        else: err.append(f'{w}: unknown type')
elif kind == 'lesson':
    for i, l in enumerate(D):
        w = f"lesson {l.get('id', i)}"; need(l, ['id', 'sec', 'topic', 'title', 'body', 'examples', 'pitfalls'], w); uid(l.get('id'), w)
        n = len(re.findall(r"[A-Za-z']+", l.get('body', '')))
        if not 200 <= n <= 700: err.append(f'{w}: body {n} words')
elif kind == 'cards':
    for i, c in enumerate(D):
        w = f"card {c.get('id', i)}"; need(c, ['id', 'sec', 'topic', 'front', 'back'], w); uid(c.get('id'), w)
else: err.append('unknown kind')
if pos and kind in ('ps', 'ds', 'cr', 'rc'):
    tot = sum(pos.values())
    if tot >= 30 and any(pos[k] > 0.33 * tot for k in pos): err.append(f'answer positions unbalanced: {dict(pos)}')
print('OK' if not err else '\n'.join(err[:80] + ([f'... {len(err)} problems'] if len(err) > 80 else [])))
