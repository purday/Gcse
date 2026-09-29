// progress.json: the single record of his study (FORMAT.md section 4).

import { kvGet, kvSet } from './db.js';
import { nowISO, todayISO, addDays, ts, parseDate } from './util.js';

const SR_DAYS = [1, 3, 7];
const MERGE_ARRAYS = ['scores', 'mistakes', 'realPapersUsed', 'sessions', 'attempts', 'gradeEstimates'];
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

export function applyTopicResult(topic, full, date, marksAwarded, marksAvailable) {
  topic.attempts = (topic.attempts || 0) + 1;
  topic.marksAwarded = (topic.marksAwarded || 0) + marksAwarded;
  topic.marksAvailable = (topic.marksAvailable || 0) + marksAvailable;
  topic.correctDates = topic.correctDates || [];
  topic.lastPracticed = date;
  if (full) {
    if (!topic.correctDates.includes(date)) topic.correctDates.push(date);
    topic.srStage = Math.min((topic.srStage ?? -1) + 1, SR_DAYS.length - 1);
  } else {
    topic.srStage = 0;
  }
  topic.nextDue = addDays(date, SR_DAYS[topic.srStage]);
  topic.secure = topic.correctDates.length >= 3;
  const rate = topic.marksAvailable ? topic.marksAwarded / topic.marksAvailable : 0;
  topic.status = topic.secure ? 'green' : rate >= 0.5 || topic.correctDates.length ? 'amber' : 'red';
  return topic;
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
    const full = q.marksAwarded >= q.maxMarks && q.maxMarks > 0;
    for (const code of q.topics || []) {
      p.topics[code] = applyTopicResult(p.topics[code] || {}, full, date, q.marksAwarded || 0, q.maxMarks || 0);
    }
  }
  for (const t of fb.topics || []) {
    if (!t.topic || !p.topics[t.topic]) continue;
    if (t.note) p.topics[t.topic].note = t.note;
    if (t.verdict === 'weak' && !p.topics[t.topic].secure) p.topics[t.topic].status = 'red';
  }
  return p;
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
  } else {
    result = local;
    for (const k of TUTOR_OWNED) if (inc[k] !== undefined) result[k] = inc[k];
    for (const k of MERGE_ARRAYS) result[k] = unionById(inc[k], local[k]);
  }
  cache = normalise(result);
  cache.updatedAt = newer ? inc.updatedAt : nowISO();
  cache.updatedBy = newer ? inc.updatedBy || 'tutor' : 'app';
  await kvSet('progress', cache);
  await kvSet('tutorSyncedAt', inc.updatedAt);
  return newer ? 'replaced' : 'merged';
}
