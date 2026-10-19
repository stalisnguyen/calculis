# Calculis - Stalis's GMAT

GMAT Focus Edition practice for the study group, with Max the fox. Same framework as Catalis (IELTS) and Stalong (Chinese).

## What is inside
- Practice by section: Quant (Problem Solving), Verbal (Critical Reasoning, Reading Comprehension), Data Insights (Data Sufficiency, Table Analysis, Graphics Interpretation, Two-Part Analysis, Multi-Source Reasoning). Filters by topic and difficulty (1-5), timed mode, explanations and trap notes.
- Error log: every miss lands there, tag the reason, it leaves after two right answers.
- Mock exams: full adaptive mock (any section order, optional break, Review & Edit up to 3 answers), single timed sections, 15-question diagnostic. Section scores 60-90, total 205-805 (estimates).
- Lessons (48), flashcards with spaced repetition (320), AI tutor "Ask Max" (Groq).
- XP, titles Intern -> CEO, streaks, study group board, sync by name + PIN.

## Structure
- `src/shell.html`, `src/app.css`, `src/app.js` (core: question bank, ability model, state, sync, routing)
- `src/features/*.js|css`: `05-mascot` Max, `10-plan` XP/plan/estimates/error log helpers, `20-render` question types, charts, tables, calculator, `30-practice`, `40-mock`, `50-learn` lessons + flashcards, `55-tutor`, `60-ui`, `65-friends`
- `python3 build.py` -> `index.html`
- `content/out/*.json`: source content (spec in `content/CONTENT_SPEC.md`, validator `content/check.py`). `python3 tools/build_data.py` packs it into `data/`.
- `api/`: `ai.js` (Groq), `sync.js` (progress by name + PIN, keys `calculis:`), `board.js`, `status.js`
- `tools/smoke.py` (every view at 390px and 1200px), `tools/flows.py` (answers every question type, a mock section and the diagnostic through the UI)

## Vercel environment variables
- `APP_PASSWORD`: group password
- `GROQ_API_KEY`: AI tutor
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: Upstash Redis (keys prefixed `calculis:`, can share the database with Catalis and Stalong)

## Content
All questions, passages, lessons and explanations are original practice material written for Calculis in the GMAT Focus Edition format; none are official GMAT questions. Quant, DS and DI answers were checked with Python. Scores are model estimates. GMAT is a trademark of GMAC, which is not affiliated with this app.
