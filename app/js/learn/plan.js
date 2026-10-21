// Today's plan for Learn mode, built from the exam dates, lesson progress,
// the retry queue, spaced-repetition reviews and recent full papers.

import { todayISO, daysBetween } from '../util.js';
import { dueRetries } from './record.js';
import { dueTopics } from '../progress.js';

export function lessonForTopic(lessons, code) {
  return lessons.find((l) => l.topics[0] === code) || lessons.find((l) => l.topics.includes(code));
}

export function buildPlan({ p, lessons, exam, today = todayISO() }) {
  const papers = exam.exam.papers;
  const p1 = papers[0];
  const days = daysBetween(today, p1.date);
  const nextPaper = papers.find((x) => x.date >= today);
  const items = [];

  const retries = dueRetries(p, today);
  items.push({
    id: 'retry', kind: 'retry', minutes: Math.min(25, Math.max(5, retries.length * 3)),
    title: retries.length ? `Retry ${retries.length} question${retries.length === 1 ? '' : 's'} you got wrong` : 'Retry wrong answers',
    detail: retries.length ? 'Fresh numbers, same skill. Get each right twice to clear it.' : 'Nothing due. Wrong answers come back here the next day.',
    href: '#/learn/retry', done: retries.length === 0,
  });

  const due = dueTopics(p, today).filter((t) => lessonForTopic(lessons, t.code));
  items.push({
    id: 'review', kind: 'review', minutes: 15,
    title: due.length ? `Quick review: ${due.length} topic${due.length === 1 ? '' : 's'} due` : 'Quick review',
    detail: due.length ? due.slice(0, 4).map((t) => t.code).join(', ') : 'No reviews due today.',
    href: '#/learn/review', done: due.length === 0,
  });

  const lp = p.learnProgress || {};
  const doneToday = lessons.filter((l) => lp[l.id]?.completedAt?.slice(0, 10) === today);
  const notDone = lessons.filter((l) => !lp[l.id]?.completed && !l.extra);
  // Before Paper 1 (non-calculator), lessons that can be tested without a calculator come first.
  const ordered = days > 0 ? [...notDone.filter((l) => l.calc !== 'calc'), ...notDone.filter((l) => l.calc === 'calc')] : notDone;
  const lastPaper = (p.scores || []).filter((s) => s.type === 'paper').map((s) => s.date).sort().pop();
  const paperDue = !lastPaper || daysBetween(lastPaper, today) >= (days <= 7 ? 1 : 3);
  const paperDay = paperDue && days >= 0;
  const newCount = days > 6 ? (paperDay ? 1 : 2) : days > 2 ? 1 : 0;
  const todays = [...doneToday, ...ordered.slice(0, Math.max(0, newCount - doneToday.length))];
  for (const l of todays) {
    const st = lp[l.id];
    items.push({
      id: `lesson-${l.id}`, kind: 'lesson', minutes: l.minutes,
      title: `${st?.step ? 'Finish' : 'Learn'}: ${l.title}`,
      detail: `${l.why.split('.')[0]}.`,
      href: `#/learn/${l.id}`, done: !!st?.completed && st.completedAt?.slice(0, 10) === today,
    });
  }

  if (paperDay) {
    items.push({
      id: 'paper', kind: 'paper', minutes: 90,
      title: nextPaper && nextPaper.paper === 1 && days <= 7 ? 'Full timed paper (non-calculator)' : 'Full timed paper',
      detail: 'Real exam conditions, then send it to your tutor for marking.',
      href: '#/papers', done: lastPaper === today,
    });
  }
  items.push({ id: 'cards', kind: 'cards', minutes: 5, title: 'Must-know facts', detail: 'Formulas and facts AQA does not give you.', href: '#/learn/cards', done: false });

  return { days, nextPaper, items };
}
