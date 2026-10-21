// Recording Learn-mode results into progress.json, so in-app practice feeds the
// same topic mastery / spaced repetition as tutor marking, and the tutor sees it.

import { getProgress, saveProgress, recomputeTopics, upsert } from '../progress.js';
import { todayISO, addDays, nowISO } from '../util.js';

const RETRY_DAYS = [1, 3];

// outcome: { lesson, templateId, seed, marks, firstTry, helped, solved, revealed, mode }
export async function recordAttempt(o) {
  const p = await getProgress();
  const date = todayISO();
  const t = o.lesson.templates[o.templateId];
  const topics = t.topics || o.lesson.topics;
  const clean = o.firstTry && !o.helped && !o.revealed;
  upsert(p.markLog, {
    id: `learn:${o.lesson.id}:${o.templateId}:${o.seed}`,
    date,
    packId: 'learn',
    questionId: `${o.lesson.id}/${o.templateId}`,
    topics,
    awarded: clean ? o.marks : 0,
    max: o.marks,
    source: o.mode || 'lesson',
  });
  const key = `${o.lesson.id}/${o.templateId}`;
  const existing = p.retryQueue.find((x) => x.id === key && !x.cleared);
  if (!clean) {
    upsert(p.retryQueue, {
      id: key, lessonId: o.lesson.id, templateId: o.templateId, topic: topics[0], skill: t.skill || o.lesson.title,
      added: existing?.added || date, due: addDays(date, RETRY_DAYS[0]), stage: 0, misses: (existing?.misses || 0) + 1, cleared: false,
    });
    upsert(p.mistakes, {
      id: `m-learn-${key}-${date}`, date, packId: 'learn', questionId: key, topic: topics[0],
      type: o.solved && !o.revealed && !o.helped ? 'careless' : 'knowledge',
      note: `${t.skill || o.lesson.title}${o.revealed ? ' (needed the worked solution)' : o.helped ? ' (needed a hint)' : ' (right on a second try)'}`,
      resolved: false, reviewedDates: [],
    });
  } else if (existing) {
    const stage = existing.stage + 1;
    if (stage >= RETRY_DAYS.length) {
      existing.cleared = true;
      existing.clearedOn = date;
      for (const m of p.mistakes) if (m.questionId === key && !m.resolved) { m.resolved = true; (m.reviewedDates ||= []).push(date); }
    } else {
      existing.stage = stage;
      existing.due = addDays(date, RETRY_DAYS[stage]);
    }
  }
  recomputeTopics(p);
  await saveProgress(p);
  return clean;
}

export async function saveLessonState(lessonId, patch) {
  const p = await getProgress();
  p.learnProgress[lessonId] = { ...(p.learnProgress[lessonId] || {}), ...patch, updatedAt: nowISO() };
  await saveProgress(p);
  return p.learnProgress[lessonId];
}

export function dueRetries(p, day = todayISO()) {
  return (p.retryQueue || []).filter((x) => !x.cleared && x.due <= day);
}
