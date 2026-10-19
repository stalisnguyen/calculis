# Calculis content spec (GMAT Focus Edition)

App: a GMAT practice web app for a study group of mixed levels (total score 205-805; Quant, Verbal and Data Insights each 60-90). ALL learner-facing text is English (UI, explanations, lessons). Calculus + Stalis = Calculis. Mascot: Max the fox.

Current exam (GMAT Focus Edition): Quantitative Reasoning 21 Problem Solving questions / 45 min (arithmetic, algebra, word problems, number properties, statistics, counting/probability; coordinate geometry counts as algebra; NO plane geometry; no calculator). Verbal Reasoning 23 questions / 45 min (Critical Reasoning and Reading Comprehension only; NO Sentence Correction). Data Insights 20 questions / 45 min (Data Sufficiency, Table Analysis, Graphics Interpretation, Two-Part Analysis, Multi-Source Reasoning; on-screen calculator allowed). No AWA.

## Shared rules
- Original content only. Never copy questions, passages or explanations from GMAC/mba.com Official Guides, GMAT Club, Manhattan, Magoosh, Kaplan, Target Test Prep or any other source. Mimic format and difficulty only.
- Every item has exactly one defensible answer. For Quant/DS/DI numbers, VERIFY every answer with Python before writing it (brute force or direct computation); keep your verification scripts in your scratch folder.
- Difficulty "diff" 1-5: 1 = below 555 level, 2 = 555-605, 3 = 605-655, 4 = 655-705, 5 = 705+ (hard GMAT Club style "700-level" items). Spread as the task says.
- Answer positions balanced across A-E (roughly 20% each).
- Math notation in plain text with Unicode: x², x³, √(x+1), π, ≤, ≥, ≠, |x|, a/b, ×, ÷, ½. No LaTeX, no HTML. Never use the em dash character or unicode arrows (→ ← ↔); write "->" if you must.
- British or American spelling is fine but be consistent within an item.
- "explanation": clear, step-by-step, 50-180 words, the fastest valid method first; for hard items also mention an alternative (plugging in, picking numbers, estimation) when useful. "trap": one sentence on the most tempting wrong answer and why it is wrong.
- Output: one JSON file as told in your task, valid UTF-8. Validate with `python3 /home/claude/calculis/content/check.py <kind> <file>` until it prints OK.
- Reply when done with only: file, counts by diff/type, anything you were unsure about (max 5 lines).

## kind=ps (Problem Solving, Quant)  file: array
{"id":"ps-<topic code>-001","sec":"quant","type":"ps","topic":"Arithmetic|Algebra|Word Problems|Number Properties|Statistics|Counting & Probability","sub":"short subtopic e.g. Percents","diff":3,
 "stem":"question text","choices":["5 options"],"answer":0-4,"explanation":"...","trap":"...","time":seconds target (90-150)}

## kind=ds (Data Sufficiency)  file: array
{"id":"ds-...","sec":"di","type":"ds","topic":same topic list as ps,"sub":"...","diff":3,
 "question":"the question asked, e.g. What is the value of x?","info":"optional given info before the question or empty string",
 "s1":"statement (1) text","s2":"statement (2) text","answer":0-4,"explanation":"cover (1) alone, (2) alone, together","trap":"...","time":120}
answer codes: 0 = (1) alone sufficient, (2) not; 1 = (2) alone sufficient, (1) not; 2 = together sufficient, neither alone; 3 = each alone sufficient; 4 = not sufficient even together.

## kind=cr (Critical Reasoning)  file: array
{"id":"cr-...","sec":"verbal","type":"cr","qtype":"assumption|strengthen|weaken|evaluate|inference|flaw|boldface|explain|plan|complete",
 "diff":3,"stimulus":"argument 40-110 words (boldface: wrap the two bold portions in **double asterisks**)","stem":"question stem","choices":["5"],"answer":0-4,
 "explanation":"why the right answer is right AND one line for each wrong choice","trap":"...","time":120}

## kind=rc (Reading Comprehension)  file: array of passages
{"id":"rc-...","sec":"verbal","type":"rc","topic":"business|science|social science|humanities","diff":3 (passage difficulty),"title":"short title",
 "paras":["paragraph 1","..."] (short passage 200-280 words in 2-3 paras, or long 320-420 words in 3-5 paras),
 "questions":[{"id":"rc-...-q1","qtype":"main idea|detail|inference|function|tone|application|structure","diff":3,"stem":"...","choices":["5"],"answer":0-4,"explanation":"cite the paragraph and the decisive phrase","time":90}] (3 or 4 questions per passage)}

## kind=di (Data Insights other than DS)  file: array, each item one of:
Table Analysis:
{"id":"ta-...","sec":"di","type":"ta","diff":3,"title":"table title","intro":"1-2 sentence context","cols":["col names"],"rows":[[cells, numbers as numbers]],
 "prompt":"For each of the following statements, select True if ... Otherwise select False.","labels":["True","False"],
 "statements":[{"text":"...","answer":0|1}] x3, "explanation":"how to sort/compute each statement","time":150}
Graphics Interpretation:
{"id":"gi-...","sec":"di","type":"gi","diff":3,"chart":{"kind":"bar|line|scatter|stacked","title":"...","xlabel":"...","ylabel":"...","x":[labels or numbers],"series":[{"name":"...","values":[numbers]}]},
 "intro":"context","text":"sentence with two blanks written [[1]] and [[2]]","blanks":[{"options":["3-5 options"],"answer":i},{"options":[...],"answer":j}],"explanation":"...","time":150}
Two-Part Analysis:
{"id":"tpa-...","sec":"di","type":"tpa","diff":3,"stem":"scenario and task","cols":["First column label","Second column label"],"options":["5 or 6 options"],"answer":[i,j] (may be equal),"explanation":"...","time":150}
Multi-Source Reasoning:
{"id":"msr-...","sec":"di","type":"msr","diff":3,"tabs":[{"title":"tab name","text":"paragraph(s)" OR "table":{"cols":[...],"rows":[[...]]}}] (2-3 tabs),
 "questions":[ {"kind":"mcq","stem":"...","choices":["5"],"answer":0-4,"explanation":"..."} OR {"kind":"yesno","prompt":"For each of the following ... select Yes if ... Otherwise select No.","labels":["Yes","No"],"statements":[{"text":"...","answer":0|1}] x3,"explanation":"..."} ] (exactly 3 questions),"time":420}

## kind=lesson  file: array
{"id":"l-...","sec":"quant|verbal|di|strategy","topic":"...","title":"...","level":"core|advanced",
 "body":"lesson text 250-600 words in plain paragraphs and short lists (lines starting with '- '), key formulas on their own line",
 "examples":[{"q":"worked example question","a":"worked solution"}] (2-3),"pitfalls":["2-4 common mistakes"]}

## kind=cards (flashcards for spaced repetition)  file: array
{"id":"fc-...","sec":"quant|verbal|di","topic":"...","front":"prompt (formula to recall, concept, CR pattern, DS trick)","back":"answer 1-3 sentences, may include a tiny example","level":1-3}
