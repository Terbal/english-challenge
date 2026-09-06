# 100 Days · 1 Minute of English

A 100-day speaking-coach PWA: every day walks you through
**Ideas → Vocabulary → Sentence patterns → Speak for 1 minute → Unexpected questions → Review**,
so you gradually move from *French idea → translate → speak* to *idea → English sentence → speak*.

Fully client-side. No backend, no account, no API keys. All progress lives in
your browser's `localStorage` (and `IndexedDB` for local audio recordings).
Installable as an app and fully usable offline after the first load.

## Running it

Any static file server works — a service worker needs `http://` or `https://`
(not `file://`) to register.

```bash
cd 100days
python3 -m http.server 8080
# then open http://localhost:8080
```

Or drop the folder onto any static host (Netlify, GitHub Pages, Vercel, an S3
bucket, your own Apache/nginx). No build step is required — it's plain
HTML/CSS/JS.

To install as an app: open it in Chrome/Edge/Safari and use
"Install app" / "Add to Home Screen". After that first visit, it keeps
working with no internet connection.

## What's inside

```
index.html            App shell + bottom navigation
manifest.json          PWA manifest (name, icons, colors)
service-worker.js      Offline caching (cache-first app shell)
css/style.css           All styling (dark "mission control" theme)
js/
  data.js               Generated dataset: all 100 days, phrase bank, phases
  storage.js            localStorage wrapper + state shape
  speech.js             Web Speech API (pronunciation) + Google Translate links
  recorder.js           MediaRecorder + IndexedDB (100% local audio)
  mindmap.js            Interactive SVG mind map per topic
  vocabulary.js         Vocabulary flashcard rendering
  tracker.js            Streaks, day-unlock logic, 100-day grid
  quiz.js               Vocabulary quiz built from completed days
  app.js                Main controller: routing + the day-by-day coaching flow
generate_data.py        Source-of-truth script that generated js/data.js
icons/                  App icons (192, 512, maskable 512)
```

### Editing the content

Don't hand-edit `js/data.js` — it's generated. Edit `generate_data.py`
(topics, mind-map branch templates, vocabulary, sentence patterns, question
templates per phase) and re-run:

```bash
python3 generate_data.py
```

This regenerates `js/data.js` with the full 100-day dataset.

### The 9 phases (difficulty ramps up gradually)

1. **Objects** (Days 1–20) — describe everyday things
2. **Places & Animals** (21–30) — describe a place or living being
3. **People & Characters** (31–40) — describe a person, real or fictional
4. **Movies & Stories** (41–50) — narrate and summarize
5. **Concepts & Ideas** (51–65) — explain an idea or cognitive bias
6. **Work & Professional Life** (66–75) — structured professional topics
7. **Business & Society** (76–85) — explain complex ideas simply
8. **Opinion & Debate** (86–95) — opinion → reason → example → counterpoint → conclusion
9. **Impromptu Speaking** (96–100) — shrinking prep time, day 100 has none

## Notes on privacy

- No network requests are made by the app itself except the optional,
  user-initiated "Google Translate" links (which open in a new tab).
- Audio recordings never leave the device; they're stored in IndexedDB and
  can be deleted at any time from the Practice screen.
- "Reset all progress" (gear icon) wipes localStorage for a fresh start.
