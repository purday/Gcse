# GCSE Maths practice system (AQA 8300 Higher, November 2026)

Two halves, no server and no API key:

1. **The player** (`app/`): a static, offline-capable web app on Netlify. It imports pack zips, runs timed papers and untimed lessons, takes typed answers and photos of working, and exports a results zip. It shows feedback and tracks progress: topic heatmap, score chart against the grade boundaries, mistake log, spaced-repetition reviews, streak and hours. It also carries the built-in Past Paper Library, encrypted with the passcode.
2. **The tutor**: Claude in a Claude Project. It marks results zips and returns one feedback zip containing the next session. Its brief is `TUTOR_INSTRUCTIONS.md`.

The file contract between them is [`FORMAT.md`](FORMAT.md).

## Exam

| Paper | Date | |
|---|---|---|
| 8300/1H | Wed 4 Nov 2026, 9:00 | Non-calculator |
| 8300/2H | Fri 6 Nov 2026, 9:00 | Calculator |
| 8300/3H | Mon 9 Nov 2026, 9:00 | Calculator |

Dates and the last four series of Higher grade boundaries are in `app/config/exam.json`, with the series name stored for each boundary set.

## Repo map

```
app/                  the player (Netlify publish directory; no build step on Netlify)
  config/exam.json    exam dates + grade boundaries
  data/topics.json    AQA 8300 spec topics (N1–S6) with names and grade bands
  data/topicmap.json  topic frequency / typical marks / common mistakes (built from the papers)
  library/            encrypted Past Paper Library (index.json + *.bin)
FORMAT.md             pack / results / progress contract
TUTOR_INSTRUCTIONS.md tutor brief (generated: template + helper + FORMAT.md)
questionbank.json     every real past-paper question (generated from the library)
tutor/                tutor template, helper module (gcse_tutor.py), knowledge/ files to upload
tools/                vendoring, build, library pipeline, sample packs
tests/                end-to-end browser test, converter test, tutor round trip
samples/              sample lesson, feedback (+ next lesson) and timed packs
```

## Commands

```bash
npm install && pip install -r requirements.txt   # the SessionStart hook does this on Claude Code web
npm test               # converter test + full end-to-end loop in Chromium (synthetic library)
npm run test:library   # also opens every real library paper in the player and checks it totals 80
npm run lint
npm run library        # download -> convert -> question bank -> encrypt -> validate -> tutor docs
npm run build          # regenerate app/sw.js after changing anything in app/
npm run serve          # http://localhost:8080
```

## Passcode

The passcode is **not** in the repo. The library build reads it from `.passcode` (git-ignored) or `GCSE_PASSCODE`. It derives an AES-256 key (PBKDF2-SHA-256, 310,000 rounds) that encrypts every library paper and the question bank, so the papers only open inside the unlocked player. To change it: write the new passcode to `.passcode`, run `python3 tools/build_library.py`, commit `app/library/`, and tell him the new one.

## Finishing the Past Paper Library

The build environment could not reach aqa.org.uk, so the library ships empty. Once AQA is reachable (or the PDFs are in `papers/`):

1. `npm run library`. This downloads every 8300 Higher question paper, mark scheme and examiner report, then converts each one. For every paper it splits questions, crops each question region, reads the marks and parses the mark scheme. It then builds `questionbank.json` and `topicmap.json`, encrypts everything and validates it.
2. Open `work/review/*.html` and check each paper's splits, marks and auto-tags. Put tag fixes in `data/tag_overrides.json` and re-run.
3. `npm run test:library`, then commit `app/library`, `app/data/topicmap.json`, `questionbank.json` and `tutor/knowledge/`, and push.

Only commit AQA material while the GitHub repo is **private**.

## Deploy (Netlify)

`netlify.toml` publishes `app/` with no build command. Easiest: in Netlify, **Add new site → Import an existing project → GitHub → purday/Gcse**, choose this branch (or `main` after merging), leave the build command empty and set the publish directory to `app`. Every push then redeploys. `app/_headers` sends `X-Robots-Tag: noindex, nofollow`, a strict CSP and no-cache for the service worker; `robots.txt` disallows everything.
