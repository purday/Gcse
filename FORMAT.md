# Pack format (version 1)

This is the contract between the **player** (the web app) and the **tutor** (Claude in a Claude Project). Both sides must follow it exactly. The player rejects a zip that breaks a **must** rule and shows a warning for a zip that breaks a **should** rule.

There are three kinds of file:

| File | Made by | Read by | Purpose |
|---|---|---|---|
| Pack zip (`type: "paper"`, `"lesson"` or `"feedback"`) | tutor (or the built-in Past Paper Library) | player | Something to sit, or marks and feedback to show |
| Results zip `results_<packId>_<YYYY-MM-DD>.zip` | player | tutor | His answers, photos of working, the untouched mark scheme and his full progress |
| Backup zip `gcse-backup-<YYYY-MM-DD>.zip` | player | player | Full device backup (not for the tutor) |

General rules for every zip:

- Files sit at the **root** of the zip (`manifest.json`, not `mypack/manifest.json`). The player tolerates one wrapping folder but the tutor must not rely on it.
- All JSON is UTF-8, no BOM, no comments, no trailing commas.
- Timestamps are ISO 8601 with timezone, e.g. `"2026-10-03T18:42:00Z"` or `"2026-10-03T19:42:00+01:00"`. Plain dates are `"YYYY-MM-DD"` in UK local time (Europe/London).
- IDs (`packId`, question `id`) match `^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$`. They are used in file names.
- Spec topic codes are the AQA 8300 subject content references: `N1`–`N16`, `A1`–`A25`, `R1`–`R16`, `G1`–`G25`, `P1`–`P9`, `S1`–`S6`. The full list with names is in `app/data/topics.json` (and in the tutor's knowledge files as `topics.json`).

---

## 1. Pack zip

```
manifest.json          required
questions.json         required for paper and lesson packs; optional for feedback packs
images/                optional: PNG, JPEG, WebP or SVG files referenced by questions.json
markscheme.json        required for paper and lesson packs; base64-wrapped, never shown in the player
feedback.json          required for feedback packs only
progress.json          optional: a full progress snapshot (section 4)
next/                  optional, feedback packs only: a complete lesson or paper pack
                       (next/manifest.json, next/questions.json, next/images/…, next/markscheme.json)
```

### 1.1 `manifest.json`

```json
{
  "formatVersion": 1,
  "packId": "L-2026-10-03-quadratics",
  "type": "lesson",
  "source": "mixed",
  "title": "Quadratics: factorising and the formula",
  "created": "2026-10-03T18:40:00+01:00",
  "timeLimitMins": null,
  "totalMarks": 24,
  "calculator": true
}
```

| Field | Type | Rule |
|---|---|---|
| `formatVersion` | integer | **must** be `1` |
| `packId` | string | **must** match the ID pattern and be unique across everything he has ever imported. Suggested: `P-<date>-<paper>` for papers, `L-<date>-<slug>` for lessons, `F-<date>-<forPackId>` for feedback. |
| `type` | `"paper"` \| `"lesson"` \| `"feedback"` | **must** |
| `source` | `"real"` \| `"generated"` \| `"mixed"` | **must**. `real` = only real AQA questions; `generated` = only new questions; `mixed` = both. Feedback packs use the source of the pack they mark. |
| `title` | string | **must**, shown on screen |
| `created` | timestamp | **must** |
| `timeLimitMins` | integer or `null` | **must** be present. Paper packs **should** set it (90 for a full AQA paper); the player runs a countdown and auto-submits at zero. `null` = untimed (lessons). |
| `totalMarks` | integer | **must**. For paper and lesson packs it **must** equal the sum of `marks` in `questions.json` (the player warns if not). For feedback packs it is the maximum mark of the marked pack. |
| `calculator` | boolean | **must**. `false` shows a "Non-calculator" banner. |

Optional manifest fields:

| Field | Type | Meaning |
|---|---|---|
| `intro` | Markdown | Shown on the start screen before he begins (lesson aims, instructions). |
| `paperRef` | object | Real full papers only: `{ "libraryId": "aqa-2023-06-1h", "series": "June 2023", "paper": 1, "tier": "H", "code": "8300/1H" }`. The player records `libraryId` in `realPapersUsed` when he starts it. |
| `forPackId` | string | Feedback packs: **must** be the `packId` of the pack being marked. |
| `forAttemptId` | string | Feedback packs: the `attemptId` from `results.json`, if known. |
| `focusTopics` | string[] | Lessons: the spec codes this lesson targets. |

### 1.2 `questions.json`

A JSON array, in the order he should see the questions.

```json
[
  {
    "id": "q1",
    "number": "1",
    "part": null,
    "marks": 2,
    "topics": ["A18"],
    "prompt": "Solve $x^2 - 5x - 14 = 0$",
    "answerType": "short",
    "workedExample": {
      "title": "Solving by factorising",
      "body": "To solve $x^2 + x - 12 = 0$, find two numbers that multiply to $-12$ and add to $1$: $4$ and $-3$.\n\n$(x + 4)(x - 3) = 0$, so $x = -4$ or $x = 3$."
    }
  },
  {
    "id": "q2.1",
    "number": "2",
    "part": "1",
    "marks": 3,
    "topics": ["G22"],
    "stem": "The diagram shows triangle $ABC$.",
    "image": "tri-abc.svg",
    "prompt": "Work out the length $AC$.\n\nGive your answer to 3 significant figures.",
    "answerType": "working",
    "sourceRef": "AQA June 2023 P2 Q14.1",
    "libraryRef": "aqa-2023-06-2h:q14.1"
  }
]
```

| Field | Type | Rule |
|---|---|---|
| `id` | string | **must** be unique within the pack and match the ID pattern. Used as `questionId` in results. |
| `number` | string | **must**. The question number as printed, e.g. `"14"`. |
| `part` | string or `null` | **must** be present. AQA style numeric parts (`"1"`, `"2"` → shown as 14.1, 14.2) or letters (`"a"`, `"b(i)"` → shown as 14(a)). `null` for a single-part question. |
| `marks` | integer ≥ 0 | **must** |
| `topics` | string[] | **must**, at least one spec code, most relevant first. |
| `prompt` | Markdown | **must**. Maths in LaTeX: `$...$` inline, `$$...$$` display. Raw HTML is not rendered. Use `\\` for a literal backslash in JSON. |
| `answerType` | `"short"` \| `"working"` | **must**. `short` = a final answer is enough (photo optional). `working` = method marks available, he is prompted to photograph his working. |
| `image` | string | optional. A file name inside `images/` shown under the stem/prompt. |
| `sourceRef` | string | **must** for real questions, e.g. `"AQA June 2023 P2 Q14.1"`. Omit for generated questions. |
| `stem` | Markdown | optional. Shared lead-in for multi-part questions, shown above the prompt on every part with the same `number`. |
| `stemImage` | string | optional. File in `images/` for the shared stem (for example the diagram all parts use). |
| `libraryRef` | string | optional. `"<libraryId>:<questionId>"` of a question in the built-in Past Paper Library. The player then shows the **original cropped question image** from the library (stem image and part image) in addition to `prompt`. Use this when a lesson reuses a real past-paper question. |
| `workedExample` | object | optional. `{ "title": string, "body": Markdown, "image"?: string }`. Shown as a "Worked example" card before this question. Put it on the first question of each topic block. |
| `hint` | Markdown | optional. Hidden behind a "Show hint" button (lessons only; ignored in timed papers). |

### 1.3 `images/`

- PNG, JPEG, WebP or SVG. SVGs are shown with `<img>`, so scripts and external references inside them do nothing. Draw diagrams with plain shapes and text, a white or transparent background, and black strokes at least 1.5 px wide.
- Keep each image under 1.5 MB. Real-paper crops are about 1600 px wide.
- Label diagrams "Not drawn accurately" when AQA would.

### 1.4 `markscheme.json`

The player never decodes this file. It stores it byte-for-byte and copies it unchanged into the results zip.

The file is JSON with exactly two keys:

```json
{ "encoding": "base64", "data": "eyJwYWNrSWQiOiAi..." }
```

`data` is the base64 (standard alphabet, with padding) of the UTF-8 bytes of this JSON:

```json
{
  "packId": "L-2026-10-03-quadratics",
  "source": "Generated by tutor 2026-10-03; q2.1 from AQA June 2023 8300/2H mark scheme",
  "questions": {
    "q1": {
      "maxMarks": 2,
      "answer": "x = 7 and x = -2",
      "marks": [
        { "code": "M1", "text": "(x - 7)(x + 2) oe" },
        { "code": "A1", "text": "7 and -2" }
      ],
      "comments": "SC1 for one correct solution with no working"
    },
    "q2.1": {
      "maxMarks": 3,
      "answer": "9.44 (cm)",
      "marks": [
        { "code": "M1", "text": "Correct use of cosine rule, e.g. 7^2 + 8^2 - 2×7×8×cos 78" },
        { "code": "M1dep", "text": "89.7... or sqrt of their value" },
        { "code": "A1", "text": "9.44 or 9.45" }
      ],
      "comments": "Accept 9.4 with working seen",
      "commonErrors": ["Using the sine rule with no opposite pair"]
    }
  }
}
```

| Field | Rule |
|---|---|
| `questions` | **must** have one entry for every question `id`. |
| `maxMarks` | **must** equal that question's `marks`. |
| `answer` | **must**. The final answer(s) as AQA would print them. |
| `marks` | **must**. Each mark point in order: `code` uses AQA codes (`M1`, `M1dep`, `A1`, `A1ft`, `B1`, `B2`, `P1`, `C1`, `SC1`, `Q1`), `text` is the criterion. For B2-style marks, list `B2` and the partial `B1` separately. |
| `comments` | optional. Additional guidance: `oe`, `ft`, accepted ranges, special cases. |
| `commonErrors` | optional. From examiner reports or the tutor's experience. |

### 1.5 `feedback.json` (feedback packs only)

```json
{
  "forPackId": "L-2026-10-03-quadratics",
  "forAttemptId": "a-1759512345678",
  "markedAt": "2026-10-03T20:05:00+01:00",
  "score": 17,
  "maxScore": 24,
  "gradeEstimate": {
    "grade": "6",
    "range": ["5", "6"],
    "basis": "Scaled from this lesson's grade-6 questions; full-paper evidence: 131/240 equivalent on Paper 2 (June 2023)",
    "boundarySeries": "June 2026",
    "confidence": "low"
  },
  "summary": "Strong on factorising. The formula is costing you sign errors.",
  "wins": ["...", "...", "..."],
  "fixes": ["...", "...", "..."],
  "nextSession": "Quadratic formula with negative coefficients, then completing the square.",
  "questions": [
    {
      "questionId": "q1",
      "marksAwarded": 1,
      "maxMarks": 2,
      "awarded": ["M1", "A0"],
      "lost": [
        { "marks": 1, "type": "careless", "reason": "Factorised correctly to (x - 7)(x + 2) but wrote x = -7 and x = 2." }
      ],
      "comment": "Your method was right. Check the signs when you set each bracket to zero.",
      "modelAnswer": "$(x-7)(x+2)=0 \\Rightarrow x = 7$ or $x = -2$",
      "topics": ["A18"]
    }
  ],
  "topics": [
    { "topic": "A18", "verdict": "developing", "note": "Method secure, accuracy not yet." }
  ]
}
```

| Field | Rule |
|---|---|
| `forPackId` | **must** equal `manifest.forPackId`. |
| `markedAt` | **must** |
| `score`, `maxScore` | **must**, integers. `score` = sum of `marksAwarded`; `maxScore` = sum of `maxMarks`. |
| `gradeEstimate` | **must**. `grade` is `"U"`, `"3"`–`"9"`. `range` = [low, high]. `boundarySeries` names the boundary set used (from `config/exam.json`). `confidence` is `"low"`, `"medium"` or `"high"`. |
| `summary` | **must**, Markdown. |
| `wins`, `fixes` | **must**, exactly 3 short strings each. |
| `nextSession` | **must**, Markdown. What the next lesson covers and why. |
| `questions[]` | **must** have one entry per question in the marked pack, in order. `awarded` lists every mark code with its outcome (`"M1"`, `"M0"`, `"A1ft"` …). `lost[]` has one entry per lost mark group: `type` is `"knowledge"` (didn't know the method/fact) or `"careless"` (knew it, slipped: arithmetic, sign, misread, units, rounding, copying). `comment` and `modelAnswer` are Markdown and optional. |
| `topics[]` | **must** have one entry per spec code that appeared. `verdict` is `"secure"`, `"developing"` or `"weak"`. |

### 1.6 `next/`

A feedback pack **may** contain a complete paper or lesson pack under `next/` (same layout as section 1, paths prefixed with `next/`). The player shows a **Start next lesson** button that imports it and opens it. `next/manifest.json` **must** have its own new `packId`.

---

## 2. Results zip

File name: `results_<packId>_<YYYY-MM-DD>.zip` (the date he submitted, UK local time).

```
manifest.json          copied byte-for-byte from the pack
questions.json         copied byte-for-byte from the pack (so the tutor can see what was asked)
markscheme.json        copied byte-for-byte from the pack (still base64-wrapped)
results.json           his answers
photos/                JPEG photos of working, about 1200 px on the long edge
progress.json          his full current progress (section 4)
```

### 2.1 `results.json`

```json
{
  "formatVersion": 1,
  "packId": "L-2026-10-03-quadratics",
  "attemptId": "a-1759512345678",
  "attemptNo": 1,
  "startedAt": "2026-10-03T18:45:00+01:00",
  "submittedAt": "2026-10-03T19:40:12+01:00",
  "submitReason": "finished",
  "timeLimitMins": null,
  "activeSecs": 3190,
  "pausedCount": 0,
  "answers": [
    {
      "questionId": "q1",
      "typedAnswer": "x = -7, x = 2",
      "photos": ["photos/q1-1.jpg"],
      "timeSpentSecs": 142,
      "flagged": false,
      "skipped": false
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `attemptId` | Unique per sitting. `attemptNo` counts sittings of the same pack (a retake is 2). |
| `submitReason` | `"finished"` (he pressed Finish) or `"time-up"` (the timer hit zero and the player auto-submitted). |
| `timeLimitMins` | Copied from the manifest. |
| `activeSecs` | Seconds the sitting screen was open and visible. For timed papers the countdown uses this, so pausing or leaving the app stops the clock; `pausedCount` counts pauses. |
| `answers[]` | One entry per question, in pack order. |
| `typedAnswer` | Exactly what he typed in the final-answer box (may be `""`). |
| `photos` | Paths inside the zip, `photos/<questionId>-<n>.jpg`, n from 1. |
| `timeSpentSecs` | Seconds that question was on screen. |
| `flagged` | He flagged it for review. |
| `skipped` | `true` when there is no typed answer and no photo. |

---

## 3. Built-in Past Paper Library

The player ships real AQA 8300 Higher papers as ordinary **paper** packs (`source: "real"`, `timeLimitMins: 90`, `totalMarks: 80`). Library pack IDs look like `aqa-2023-06-1h` (year, month, paper number, tier). Each question has `sourceRef` and every question image is the cropped region of the original paper.

The library files are encrypted with the passcode, so they only open inside the unlocked player. Everything the tutor needs about them is in `questionbank.json`:

```json
{
  "generated": "2026-10-01T12:00:00Z",
  "papers": [
    { "libraryId": "aqa-2023-06-1h", "series": "June 2023", "paper": 1, "calculator": false, "totalMarks": 80, "questions": 25 }
  ],
  "questions": [
    {
      "id": "aqa-2023-06-1h:q14.1",
      "libraryId": "aqa-2023-06-1h",
      "paper": "8300/1H",
      "series": "June 2023",
      "year": 2023,
      "number": "14",
      "part": "1",
      "marks": 3,
      "topics": ["A18", "A4"],
      "calculator": false,
      "text": "Solve $3x^2 + 7x - 6 = 0$",
      "stem": "",
      "hasDiagram": false,
      "sourceRef": "AQA June 2023 P1 Q14.1",
      "markscheme": { "maxMarks": 3, "answer": "...", "marks": [ { "code": "M1", "text": "..." } ], "comments": "..." },
      "examinerComment": "Many students ..."
    }
  ]
}
```

To reuse a real question in a lesson, copy `text`, `marks`, `topics`, `sourceRef` and its mark scheme, and set `libraryRef` to the question's `id`. The player then shows the original cropped image as well.

---

## 4. `progress.json`

One JSON object holds his whole study history. The player keeps it in IndexedDB, puts the full current copy in every results zip, and accepts a new copy from the tutor inside a feedback pack.

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-10-03T20:05:00+01:00",
  "updatedBy": "tutor",
  "student": { "target": 6, "stretch": 8, "examSeries": "November 2026" },
  "topics": {
    "A18": {
      "status": "amber",
      "secure": false,
      "correctDates": ["2026-10-01", "2026-10-03"],
      "attempts": 6,
      "marksAwarded": 9,
      "marksAvailable": 14,
      "lastPracticed": "2026-10-03",
      "srStage": 1,
      "nextDue": "2026-10-06",
      "note": "Sign errors when using the formula"
    }
  },
  "scores": [
    { "id": "L-2026-10-03-quadratics#1", "packId": "L-2026-10-03-quadratics", "attemptId": "a-1759512345678", "date": "2026-10-03", "type": "lesson", "source": "mixed", "title": "Quadratics", "score": 17, "maxScore": 24, "libraryId": null, "grade": "6" }
  ],
  "gradeEstimates": [
    { "id": "ge-2026-10-03", "date": "2026-10-03", "grade": "6", "range": ["5", "6"], "basis": "…", "boundarySeries": "June 2026", "confidence": "low" }
  ],
  "mistakes": [
    { "id": "m-L-2026-10-03-quadratics-q1-1", "date": "2026-10-03", "packId": "L-2026-10-03-quadratics", "questionId": "q1", "topic": "A18", "type": "careless", "note": "Sign flip when solving from brackets", "resolved": false, "reviewedDates": [] }
  ],
  "realPapersUsed": [
    { "id": "aqa-2023-06-1h", "libraryId": "aqa-2023-06-1h", "date": "2026-10-02", "packId": "aqa-2023-06-1h", "score": 51 }
  ],
  "plan": { "phase": "secure-6", "note": "Full real paper due 2026-10-06" },
  "sessions": [
    { "id": "s-1759512345678", "date": "2026-10-03", "packId": "L-2026-10-03-quadratics", "attemptId": "a-1759512345678", "secs": 3190 }
  ],
  "attempts": [
    { "id": "a-1759512345678", "packId": "L-2026-10-03-quadratics", "attemptNo": 1, "startedAt": "…", "submittedAt": "…", "submitReason": "finished" }
  ],
  "notes": "Free text the tutor keeps for itself."
}
```

### 4.1 Field rules

| Section | Owner | Rule |
|---|---|---|
| `updatedAt` | both | **must** change on every edit. It is the version number. |
| `updatedBy` | both | `"app"` or `"tutor"`. |
| `topics` | tutor | Keyed by spec code. `status`: `"red"` (weak / knowledge gap), `"amber"` (developing), `"green"` (secure). `secure` becomes `true` only when `correctDates` holds **3 or more different dates** with a fully correct answer on that topic. `srStage` 0, 1, 2 means the next review is 1, 3, 7 days after `lastPracticed`; `nextDue` is that date. A wrong answer resets `srStage` to 0. |
| `scores` | tutor (player adds from feedback) | One per marked attempt. `id` = `<packId>#<attemptNo>`. |
| `gradeEstimates` | tutor | One per marking, newest last. |
| `mistakes` | tutor (player adds from feedback) | One per lost-mark group. Never delete: set `resolved: true`. |
| `realPapersUsed` | both | `id` = library ID. The player adds an entry when he **starts** a library paper; the tutor fills in `score`. |
| `plan`, `notes`, `student` | tutor | Free-form objects/text. |
| `sessions`, `attempts` | player | Append-only logs the player writes. The tutor copies them through unchanged. |

### 4.2 How the player merges a `progress.json` from a feedback pack

1. If `updatedAt` is **newer than the local copy**, the incoming file replaces the local progress.
2. If it is older than the local copy but newer than the last tutor copy the player accepted, the incoming **tutor-owned** sections (`topics`, `gradeEstimates`, `plan`, `notes`, `student`) still replace the local ones. This covers him studying between sending results and getting feedback.
3. In both cases the arrays `scores`, `mistakes`, `realPapersUsed`, `sessions` and `attempts` are merged by `id` afterwards, so nothing recorded on the device is lost. On an `id` clash the incoming entry wins.
4. Otherwise the file is ignored.

When a feedback pack has **no** `progress.json`, the player updates progress itself from `feedback.json`: it adds the score, grade estimate and mistakes, and applies the topic rules above (a full-mark answer adds today's date to `correctDates`, advances `srStage` and sets `nextDue`; a lost mark sets `srStage` to 0 and `nextDue` to tomorrow).

---

## 5. What the player checks on import

| Check | Result if it fails |
|---|---|
| Zip opens; `manifest.json` parses; required fields present and typed; `formatVersion` is 1 | Rejected |
| `packId` matches the ID pattern | Rejected |
| Paper/lesson: `questions.json` is a non-empty array; every question has `id`, `number`, `part`, `marks`, `topics`, `prompt`, `answerType`; IDs unique | Rejected |
| Paper/lesson: `markscheme.json` present and shaped `{ "encoding": "base64", "data": "..." }` | Rejected |
| Feedback: `feedback.json` present with `forPackId`, `score`, `maxScore`, `questions` | Rejected |
| `totalMarks` equals the sum of question marks | Warning |
| Every `image`/`stemImage`/`workedExample.image` exists in `images/` | Warning (the question shows "image missing") |
| Topic codes are real spec codes | Warning |
| Same `packId` already imported | He is asked whether to replace it |
