// progress.json: the single record of his study (FORMAT.md section 4).

import { kvGet, kvSet } from './db.js';
import { nowISO, todayISO, addDays, ts, parseDate } from './util.js';

const SR_DAYS = [1, 3, 7];
const MERGE_ARRAYS = ['scores', 'mistakes', 'realPapersUsed', 'sessions', 'attempts', 'gradeEstimates', 'bankQuestionsUsed', 'markLog', 'verdicts'];
const TUTOR_OWNED = ['topics', 'gradeEstimates', 'plan', 'notes', 'student'];

export function emptyProgress() {
  return {
    schemaVersion: 1,
    updatedAt: nowISO(),
    updatedBy: 'app',
    student: { target: 6, stretch: 8, examSeries: 'November 2026' },
    topics: {},
    scores: [],
    gradeEstimates: [],
    mistakes: [],
    realPapersUsed: [],
    bankQuestionsUsed: [],
    markLog: [],
    verdicts: [],
    plan: {},
    sessions: [],
    attempts: [],
    notes: '',
  };
}

function normalise(p) {
  const base = emptyProgress();
  const out = { ...base, ...p };
  for (const k of MERGE_ARRAYS) if (!Array.isArray(out[k])) out[k] = [];
  if (!out.topics || typeof out.topics !== 'object') out.topics = {};
  return out;
}

let cache = null;

export async function getProgress() {
  if (!cache) cache = normalise((await kvGet('progress')) || emptyProgress());
  return cache;
}

export async function saveProgress(p, by = 'app') {
  p.updatedAt = nowISO();
  p.updatedBy = by;
  cache = p;
  await kvSet('progress', p);
  return p;
}

// Replace wholesale (backup restore).
export async function replaceProgress(p) {
  cache = normalise(p);
  await kvSet('progress', cache);
}

function upsert(list, item) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) list.push(item);
  else list[i] = { ...list[i], ...item };
}

function unionById(primary, secondary) {
  const out = [...(primary || [])];
  const ids = new Set(out.map((x) => x.id));
  for (const x of secondary || []) if (x && x.id != null && !ids.has(x.id)) out.push(x);
  return out;
}

// ---- Study time --------------------------------------------------------

export async function addStudyTime({ attemptId, packId, secs, date = todayISO() }) {
  if (secs <= 0) return;
  const p = await getProgress();
  const id = attemptId ? `s-${attemptId}-${date}` : `s-manual-${Date.now()}`;
  const existing = p.sessions.find((s) => s.id === id);
  if (existing) existing.secs += secs;
  else p.sessions.push({ id, date, packId: packId || null, attemptId: attemptId || null, secs });
  await saveProgress(p);
}

export function studySecsByDate(p) {
  const m = {};
  for (const s of p.sessions) m[s.date] = (m[s.date] || 0) + (s.secs || 0);
  return m;
}

// A day counts towards the streak with at least 10 minutes of study.
// One rest day per Monday-Sunday week is allowed without breaking it
// (he studies 6 days a week).
export function streak(p, today = todayISO()) {
  const byDate = studySecsByDate(p);
  const studied = (d) => (byDate[d] || 0) >= 600;
  let day = studied(today) ? today : addDays(today, -1);
  let count = 0;
  const restUsed = new Set();
  for (let i = 0; i < 400; i++) {
    if (studied(day)) count++;
    else {
      const d = parseDate(day);
      const monday = addDays(day, -((d.getDay() + 6) % 7));
      if (restUsed.has(monday) || day === today) break;
      restUsed.add(monday);
      if (!studied(addDays(day, -1))) break;
    }
    day = addDays(day, -1);
  }
  return count;
}

// ---- Attempts and papers -------------------------------------------------

export async function recordAttempt(att) {
  const p = await getProgress();
  upsert(p.attempts, {
    id: att.id, packId: att.packId, attemptNo: att.attemptNo, startedAt: att.startedAt,
    submittedAt: att.submittedAt || null, submitReason: att.submitReason || null,
  });
  await saveProgress(p);
}

export async function markRealPaperUsed(libraryId, packId) {
  const p = await getProgress();
  if (!p.realPapersUsed.some((r) => r.id === libraryId)) {
    p.realPapersUsed.push({ id: libraryId, libraryId, packId, date: todayISO(), score: null });
    await saveProgress(p);
  }
}

// ---- Topics and spaced repetition ------------------------------------------
// Topic state is derived from markLog (one entry per marked question) and
// verdicts, so progress from different devices/snapshots merges without loss.
// The tutor helper implements the same rule (FORMAT.md 4.3).

export function recomputeTopics(p) {
  const byTopic = new Map();
  for (const e of p.markLog || []) {
    for (const code of e.topics || []) {
      if (!byTopic.has(code)) byTopic.set(code, new Map());
      const days = byTopic.get(code);
      if (!days.has(e.date)) days.set(e.date, []);
      days.get(e.date).push(e);
    }
  }
  const latestVerdict = {};
  for (const v of p.verdicts || []) {
    const cur = latestVerdict[v.topic];
    if (!cur || v.date > cur.date || (v.date === cur.date && v.id > cur.id)) latestVerdict[v.topic] = v;
  }
  for (const [code, days] of byTopic) {
    const t = { note: p.topics[code]?.note || '' };
    t.attempts = 0; t.marksAwarded = 0; t.marksAvailable = 0; t.correctDates = [];
    let stage = -1;
    for (const date of [...days.keys()].sort()) {
      const es = days.get(date);
      const got = es.reduce((a, e) => a + (e.awarded || 0), 0);
      const max = es.reduce((a, e) => a + (e.max || 0), 0);
      const dayCorrect = es.some((e) => e.max > 0 && e.awarded >= e.max) && got * 3 >= max * 2;
      t.attempts += es.length; t.marksAwarded += got; t.marksAvailable += max;
      if (dayCorrect) { t.correctDates.push(date); stage = Math.min(stage + 1, SR_DAYS.length - 1); } else stage = 0;
      t.lastPracticed = date;
    }
    t.srStage = Math.max(stage, 0);
    t.nextDue = addDays(t.lastPracticed, SR_DAYS[t.srStage]);
    t.secure = t.correctDates.length >= 3;
    const rate = t.marksAvailable ? t.marksAwarded / t.marksAvailable : 0;
    const v = latestVerdict[code];
    const weak = v && v.verdict === 'weak' && v.date >= t.lastPracticed;
    t.status = t.secure ? 'green' : weak || (rate < 0.5 && !t.correctDates.length) ? 'red' : 'amber';
    p.topics[code] = t;
  }
  return p;
}

export function dueTopics(p, today = todayISO()) {
  return Object.entries(p.topics)
    .filter(([, t]) => t.nextDue && t.nextDue <= today)
    .sort((a, b) => (a[1].nextDue < b[1].nextDue ? -1 : 1))
    .map(([code, t]) => ({ code, ...t }));
}

// ---- Feedback --------------------------------------------------------------

// Used when a feedback pack arrives without progress.json.
export function applyFeedback(p, fb, meta) {
  const date = (fb.markedAt || nowISO()).slice(0, 10);
  const attemptNo = meta.attemptNo || 1;
  upsert(p.scores, {
    id: `${fb.forPackId}#${attemptNo}`, packId: fb.forPackId, attemptId: fb.forAttemptId || null, date,
    type: meta.type || 'lesson', source: meta.source || null, title: meta.title || fb.forPackId,
    score: fb.score, maxScore: fb.maxScore, libraryId: meta.libraryId || null, grade: fb.gradeEstimate?.grade ?? null,
  });
  if (fb.gradeEstimate) {
    upsert(p.gradeEstimates, { id: `ge-${fb.forPackId}-${attemptNo}`, date, ...fb.gradeEstimate });
  }
  if (meta.libraryId) {
    const used = p.realPapersUsed.find((r) => r.id === meta.libraryId);
    if (used) used.score = fb.score;
    else p.realPapersUsed.push({ id: meta.libraryId, libraryId: meta.libraryId, packId: fb.forPackId, date, score: fb.score });
  }
  for (const q of fb.questions || []) {
    (q.lost || []).forEach((l, i) => {
      upsert(p.mistakes, {
        id: `m-${fb.forPackId}-${q.questionId}-${i + 1}`, date, packId: fb.forPackId, questionId: q.questionId,
        topic: (q.topics || [])[0] || null, type: l.type === 'careless' ? 'careless' : 'knowledge',
        note: l.reason || '', resolved: false, reviewedDates: [],
      });
    });
    upsert(p.markLog, {
      id: `${fb.forPackId}#${attemptNo}:${q.questionId}`, date, packId: fb.forPackId, questionId: q.questionId,
      topics: q.topics || [], awarded: q.marksAwarded || 0, max: q.maxMarks || 0,
    });
  }
  for (const t of fb.topics || []) {
    if (!t.topic) continue;
    upsert(p.verdicts, { id: `${fb.forPackId}#${attemptNo}:${t.topic}`, date, topic: t.topic, verdict: t.verdict });
    if (t.note) p.topics[t.topic] = { ...(p.topics[t.topic] || {}), note: t.note };
  }
  return recomputeTopics(p);
}

// FORMAT.md 4.2
export async function mergeIncoming(incoming) {
  const local = await getProgress();
  const inc = normalise(incoming);
  const lastTutor = (await kvGet('tutorSyncedAt')) || '';
  const newer = ts(inc.updatedAt) > ts(local.updatedAt);
  const newerThanTutor = ts(inc.updatedAt) > ts(lastTutor);
  if (!newer && !newerThanTutor) return 'ignored';

  let result;
  if (newer) {
    result = inc;
    for (const k of MERGE_ARRAYS) result[k] = unionById(inc[k], local[k]);
    result.topics = { ...local.topics, ...inc.topics };
  } else {
    result = local;
    for (const k of TUTOR_OWNED) if (inc[k] !== undefined && k !== 'topics') result[k] = inc[k];
    for (const k of MERGE_ARRAYS) result[k] = unionById(inc[k], local[k]);
    result.topics = { ...local.topics, ...inc.topics };
  }
  cache = recomputeTopics(normalise(result));
  cache.updatedAt = newer ? inc.updatedAt : nowISO();
  cache.updatedBy = newer ? inc.updatedBy || 'tutor' : 'app';
  await kvSet('progress', cache);
  await kvSet('tutorSyncedAt', inc.updatedAt);
  return newer ? 'replaced' : 'merged';
}
