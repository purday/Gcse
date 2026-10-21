// Learn mode daily plan: what comes first, how many new lessons, retries and papers.
// Run: node --experimental-default-type=module tests/learn_plan.mjs
import { readFileSync } from 'node:fs';
import { buildPlan, orderLessons, lessonForTopic } from '../app/js/learn/plan.js';
import { LESSONS } from '../app/js/learn/lessons/index.js';
import { emptyProgress, recomputeTopics } from '../app/js/progress.js';

const exam = JSON.parse(readFileSync(new URL('../app/config/exam.json', import.meta.url)));
let fails = 0;
const t = (name, cond, extra = '') => { if (!cond) { fails++; console.log(`  ✗ ${name} ${extra}`); } };

const fresh = () => ({ ...emptyProgress(), learnProgress: {}, retryQueue: [] });
const P1 = exam.exam.papers[0].date;
const before = (n) => { const d = new Date(`${P1}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };

// Every lesson's first topic exists in the topic map, and every lesson is reachable from one of its topics.
const codes = new Set(JSON.parse(readFileSync(new URL('../app/data/topics.json', import.meta.url))).topics.map((x) => x.code));
for (const l of LESSONS) {
  for (const c of l.topics) t(`${l.id} topic ${c} is in topics.json`, codes.has(c));
  t(`${l.id} is found from its first topic`, lessonForTopic(LESSONS, l.topics[0])?.id === l.id || LESSONS.some((o) => o.id !== l.id && o.topics[0] === l.topics[0]));
}
t('lesson ids are unique', new Set(LESSONS.map((l) => l.id)).size === LESSONS.length);

// 1. Far from the exam with no papers done: retry, review, a paper (none sat yet), one new lesson, cards.
{
  const plan = buildPlan({ p: fresh(), lessons: LESSONS, exam, today: before(12) });
  const kinds = plan.items.map((i) => i.kind);
  t('plan has retry, review, lesson, paper, cards', ['retry', 'review', 'lesson', 'paper', 'cards'].every((k) => kinds.includes(k)), JSON.stringify(kinds));
  t('paper day: one new lesson', kinds.filter((k) => k === 'lesson').length === 1, JSON.stringify(kinds));
  t('days counted to Paper 1', plan.days === 12, String(plan.days));
  const first = plan.items.find((i) => i.kind === 'lesson');
  t('first lesson is grade 6 core and usable on Paper 1', LESSONS.find((l) => `lesson-${l.id}` === first.id)?.group === 'core' && LESSONS.find((l) => `lesson-${l.id}` === first.id)?.calc !== 'calc', first.id);
}

// 2. A paper sat yesterday: two new lessons, no paper.
{
  const p = fresh(); p.scores = [{ type: 'paper', date: before(13) }];
  const plan = buildPlan({ p, lessons: LESSONS, exam, today: before(12) });
  t('non-paper day: two new lessons', plan.items.filter((i) => i.kind === 'lesson').length === 2);
  t('non-paper day: no paper item', !plan.items.some((i) => i.kind === 'paper'));
}

// 3. Weak topics from a marked paper come first, even if they are grade 7-8 lessons.
{
  const p = fresh();
  p.markLog = [{ id: 'paper#1:q5', date: before(14), topics: ['G10'], awarded: 0, max: 4 }, { id: 'paper#1:q6', date: before(14), topics: ['A19'], awarded: 3, max: 4 }];
  recomputeTopics(p);
  const order = orderLessons(LESSONS.filter((l) => !l.extra), p, 12).map((l) => l.id);
  t('red topic (circle theorems) is first', order[0] === 'circle-theorems', order.slice(0, 3).join(','));
  t('red topic before grade 6 core', order.indexOf('circle-theorems') < order.indexOf('expand-factorise'));
  t('amber topic (simultaneous) next', order[1] === 'simultaneous', order.slice(0, 3).join(','));
  t('core before push otherwise', order.indexOf('ratio') < order.indexOf('surds'));
}

// 4. Before Paper 1, calculator-only lessons wait; after it they are back in order.
{
  const order = orderLessons(LESSONS.filter((l) => !l.extra), fresh(), 5).map((l) => l.id);
  const firstCalc = order.findIndex((id) => LESSONS.find((l) => l.id === id).calc === 'calc' && LESSONS.find((l) => l.id === id).group === 'core');
  const lastNonCalcCore = Math.max(...order.map((id, i) => [id, i]).filter(([id]) => { const l = LESSONS.find((x) => x.id === id); return l.group === 'core' && l.calc !== 'calc'; }).map(([, i]) => i));
  t('non-calculator core lessons come before calculator core lessons before Paper 1', firstCalc > lastNonCalcCore, `${firstCalc} vs ${lastNonCalcCore}`);
}

// 5. Retry queue: due items show, cleared ones do not; completed lessons drop out.
{
  const p = fresh();
  const day = before(10);
  p.retryQueue = [{ id: 'r1', due: day, cleared: false }, { id: 'r2', due: day, cleared: true }, { id: 'r3', due: before(5), cleared: false }];
  p.learnProgress = { 'expand-factorise': { completed: true, completedAt: `${before(11)}T10:00:00Z` } };
  const plan = buildPlan({ p, lessons: LESSONS, exam, today: day });
  const retry = plan.items.find((i) => i.kind === 'retry');
  t('one retry due', /Retry 1 question /.test(retry.title), retry.title);
  t('completed lesson not offered again', !plan.items.some((i) => i.id === 'lesson-expand-factorise'));
}

// 6. Last two days: no new lessons, a paper every day.
{
  const p = fresh(); p.scores = [{ type: 'paper', date: before(2) }];
  const plan = buildPlan({ p, lessons: LESSONS, exam, today: before(1) });
  t('no new lessons the day before Paper 1', !plan.items.some((i) => i.kind === 'lesson'));
  t('daily paper in the final week', plan.items.some((i) => i.kind === 'paper'));
}

console.log(fails ? `${fails} plan test(s) failed` : `  ✓ daily plan (${LESSONS.length} lessons)`);
process.exit(fails ? 1 : 0);
