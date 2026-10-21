// Learn mode screens: home (today's plan + lessons), lesson player,
// retry / review / mixed practice sessions, and must-know flashcards.

import * as db from '../db.js';
import { h, fmtDate, todayISO, addDays, toast } from '../util.js';
import { renderMarkdown } from '../md.js';
import { getProgress, addStudyTime } from '../progress.js';
import { topicData } from '../pack.js';
import { LESSONS, BY_ID, GROUPS } from './lessons/index.js';
import { questionCard, newSeed } from './question.js';
import { saveLessonState, dueRetries } from './record.js';
import { buildPlan, lessonForTopic } from './plan.js';
import { CARDS } from './cards.js';
import { rng } from './engine.js';

const md = (src, cls = 'md') => h('div', { class: cls, html: renderMarkdown(src) });
const STATUS_LABEL = { green: 'Secure', amber: 'Developing', red: 'Weak' };

// Study-time tracker for any Learn screen.
function timer(key) {
  let last = Date.now();
  let pending = 0;
  const tick = () => {
    const now = Date.now();
    if (!document.hidden) pending += Math.min(now - last, 5000) / 1000;
    last = now;
  };
  const flush = async () => {
    tick();
    const secs = Math.floor(pending);
    if (secs > 0) {
      pending -= secs;
      await addStudyTime({ attemptId: key, packId: 'learn', secs });
    }
  };
  const i1 = setInterval(tick, 1000);
  const i2 = setInterval(flush, 20000);
  const onHide = () => { last = Date.now(); if (document.hidden) flush(); };
  document.addEventListener('visibilitychange', onHide);
  return async () => {
    clearInterval(i1);
    clearInterval(i2);
    document.removeEventListener('visibilitychange', onHide);
    await flush();
  };
}

// ---- Home ---------------------------------------------------------------------

export async function renderLearnHome(shell, cfg) {
  const p = await getProgress();
  const { byCode } = await topicData();
  const plan = buildPlan({ p, lessons: LESSONS, exam: cfg });
  const lp = p.learnProgress || {};
  const inProgress = LESSONS.filter((l) => lp[l.id]?.step > 0 && !lp[l.id]?.completed);
  const queue = (p.retryQueue || []).filter((x) => !x.cleared);
  const due = dueRetries(p);
  const doneCount = LESSONS.filter((l) => lp[l.id]?.completed).length;

  const planList = h('ol', { class: 'plan' }, plan.items.map((it) => h('li', { class: `plan-item ${it.done ? 'done' : ''}` },
    h('a', { href: it.href, class: 'plan-link' },
      h('span', { class: 'plan-check', 'aria-hidden': 'true' }, it.done ? '✓' : ''),
      h('span', { class: 'plan-body' }, h('strong', null, it.title), h('span', { class: 'fine' }, it.detail)),
      h('span', { class: 'plan-min mono' }, `${it.minutes}′`)))));

  const lessonRow = (l) => {
    const st = lp[l.id];
    const mastery = p.topics[l.topics[0]]?.status;
    const total = l.steps.length;
    const state = st?.completed ? 'Done' : st?.step ? `Step ${Math.min(st.step + 1, total)} of ${total}` : 'New';
    return h('li', null, h('a', { class: `lesson-row ${st?.completed ? 'done' : ''}`, href: `#/learn/${l.id}` },
      h('span', { class: `lesson-dot s-${mastery || 'none'}`, title: mastery ? STATUS_LABEL[mastery] : 'Not practised', 'aria-hidden': 'true' }),
      h('span', { class: 'lesson-main' },
        h('strong', null, l.title),
        h('span', { class: 'fine' }, `${l.subtitle || byCode[l.topics[0]]?.name || l.topics[0]} · ${l.minutes} min${l.calc === 'calc' ? ' · calculator' : l.calc === 'non-calc' ? ' · non-calculator' : ''}`)),
      h('span', { class: `lesson-state ${st?.completed ? 'done' : ''}` }, state)));
  };

  shell.replaceChildren(...[
    h('p', { class: 'eyebrow' }, 'Learn'),
    h('h1', { class: 'display' }, "Today's plan"),
    h('p', { class: 'sub' }, plan.days > 0 ? `${plan.days} days to Paper 1 (non-calculator). ${doneCount} of ${LESSONS.length} lessons done.` : plan.nextPaper ? `Paper ${plan.nextPaper.paper} is on ${fmtDate(plan.nextPaper.date)}. Review and papers only now.` : 'Exams finished.'),
    planList,
    inProgress.length ? h('section', { class: 'stack' }, inProgress.slice(0, 2).map((l) => h('a', { class: 'card link continue', href: `#/learn/${l.id}` },
      h('span', { class: 'eyebrow' }, 'Continue lesson'), h('strong', null, l.title), h('span', { class: 'fine mono' }, `Step ${lp[l.id].step + 1} of ${l.steps.length}`)))) : null,
    h('section', { class: 'tools' },
      h('a', { class: 'tool', href: '#/learn/retry' }, h('strong', null, 'Retry wrongs'), h('span', { class: 'fine' }, due.length ? `${due.length} due now · ${queue.length} in the queue` : queue.length ? `${queue.length} waiting (none due today)` : 'Nothing to retry yet')),
      h('a', { class: 'tool', href: '#/learn/review' }, h('strong', null, 'Quick review'), h('span', { class: 'fine' }, 'Questions on topics due for spaced repetition')),
      h('a', { class: 'tool', href: '#/learn/mix' }, h('strong', null, 'Mixed practice'), h('span', { class: 'fine' }, '10 questions across lessons you have done')),
      h('a', { class: 'tool', href: '#/learn/cards' }, h('strong', null, 'Must-know facts'), h('span', { class: 'fine' }, `${CARDS.length} formulas and facts AQA does not give you`))),
    ...GROUPS.map((g) => {
      const list = LESSONS.filter((l) => l.group === g.id);
      if (!list.length) return null;
      return h('section', { class: 'lesson-group' },
        h('h2', null, g.title),
        g.note ? h('p', { class: 'fine' }, g.note) : null,
        h('ul', { class: 'lesson-list' }, list.map(lessonRow)));
    })].filter(Boolean));
}

// ---- Lesson player ----------------------------------------------------------------

export async function renderLesson(root, lessonId, go) {
  const lesson = BY_ID[lessonId];
  if (!lesson) {
    root.replaceChildren(h('p', { class: 'empty' }, 'That lesson was not found.'));
    return () => {};
  }
  const p = await getProgress();
  const saved = p.learnProgress?.[lesson.id] || {};
  let index = Math.min(saved.completed ? 0 : saved.step || 0, lesson.steps.length - 1);
  const stopTimer = timer(`learn-${lesson.id}-${todayISO()}`);
  const body = h('main', { class: 'lesson-body', id: 'lesson-body', tabindex: '-1' });
  const bar = h('div', { class: 'lesson-progress', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(lesson.steps.length) }, h('span'));
  const stepLabel = h('span', { class: 'mono fine' });
  const backBtn = h('button', { class: 'btn ghost', type: 'button' }, 'Back');
  const nextBtn = h('button', { class: 'btn primary', type: 'button' }, 'Next');
  const wrap = h('div', { class: 'lesson' },
    h('header', { class: 'sit-bar lesson-bar' },
      h('a', { class: 'btn ghost small', href: '#/learn' }, 'Learn'),
      h('div', { class: 'sit-title' }, h('span', { class: 'sit-name' }, lesson.title), stepLabel),
      bar),
    body,
    h('footer', { class: 'sit-foot lesson-foot' }, backBtn, h('span'), nextBtn));
  root.replaceChildren(wrap);
  document.body.classList.add('sitting');

  let practiceScore = { clean: 0, total: 0 };

  function setNext(label, enabled = true, kind = 'primary') {
    nextBtn.textContent = label;
    nextBtn.disabled = !enabled;
    nextBtn.className = `btn ${kind}`;
  }

  async function go2(i) {
    index = Math.max(0, Math.min(lesson.steps.length - 1, i));
    await saveLessonState(lesson.id, { step: index, steps: lesson.steps.length });
    show();
  }

  function show() {
    const step = lesson.steps[index];
    stepLabel.textContent = `Step ${index + 1} of ${lesson.steps.length}`;
    bar.firstChild.style.width = `${((index + 1) / lesson.steps.length) * 100}%`;
    bar.setAttribute('aria-valuenow', String(index + 1));
    backBtn.disabled = index === 0;
    const whyCard = index === 0 ? [h('div', { class: 'card why' }, h('span', { class: 'eyebrow' }, 'Why this matters'), h('p', null, lesson.why))] : [];
    body.replaceChildren(...whyCard, ...renderStep(step).filter(Boolean));
    window.scrollTo(0, 0);
    body.focus({ preventScroll: true });
  }

  function renderStep(step) {
    switch (step.kind) {
      case 'learn':
        setNext('Next');
        return [h('article', { class: 'card learn-card' }, h('h2', null, step.title), md(step.md), step.diagram ? h('div', { class: 'learn-fig', html: step.diagram }) : null,
          step.key ? h('div', { class: 'key-box' }, h('span', { class: 'eyebrow' }, 'Key point'), md(step.key)) : null)];
      case 'example': {
        let shown = 0;
        const list = h('ol', { class: 'reveal-steps' });
        const answer = h('div', { class: 'answer-reveal', hidden: true }, h('span', { class: 'eyebrow' }, 'Answer'), md(step.answer || ''));
        const more = h('button', { class: 'btn secondary', type: 'button' }, 'Show the first step');
        const all = h('button', { class: 'btn ghost small', type: 'button' }, 'Show all steps');
        const reveal = () => {
          const s = step.steps[shown];
          list.appendChild(h('li', null, md(s.md), s.why ? h('p', { class: 'why-note' }, s.why) : null));
          shown++;
          more.textContent = 'Show the next step';
          if (shown >= step.steps.length) {
            more.remove(); all.remove();
            answer.hidden = !step.answer;
            setNext('Next');
          }
        };
        more.addEventListener('click', reveal);
        all.addEventListener('click', () => { while (shown < step.steps.length) reveal(); });
        setNext('Skip example', true, 'ghost');
        return [h('article', { class: 'qcard paper example' },
          h('div', { class: 'q-head' }, h('span', { class: 'qnum mono' }, 'Example'), h('span', { class: 'q-src' }, step.title || '')),
          md(step.q), step.diagram ? h('div', { class: 'learn-fig', html: step.diagram }) : null,
          list, answer, h('div', { class: 'row' }, more, all))];
      }
      case 'try':
      case 'exam': {
        setNext('Skip for now', true, 'ghost');
        const holder = h('div', { class: 'q-holder' });
        const mount = (seed) => {
          const card = questionCard({
            lesson, templateId: step.template, seed, mode: 'lesson', exam: step.kind === 'exam',
            label: step.kind === 'exam' ? 'Exam' : 'Your turn',
            onResolved: () => go2(index + 1),
            onAnother: () => mount(newSeed()),
            onFinish: () => setNext('Next'),
            nextLabel: 'Continue',
          });
          holder.replaceChildren(card);
        };
        mount(newSeed());
        return [step.title ? h('h2', null, step.title) : null, holder];
      }
      case 'practice': {
        const list = step.templates;
        let qi = 0;
        practiceScore = { clean: 0, total: list.length };
        const head = h('p', { class: 'eyebrow' });
        const holder = h('div', { class: 'q-holder' });
        setNext('Skip practice', true, 'ghost');
        const mount = (seed) => {
          head.textContent = `${step.title || 'Practice'} · question ${qi + 1} of ${list.length}`;
          const card = questionCard({
            lesson, templateId: list[qi], seed, mode: 'lesson', label: `${qi + 1}/${list.length}`,
            onResolved: (res) => {
              if (res.clean) practiceScore.clean++;
              qi++;
              if (qi >= list.length) {
                saveLessonState(lesson.id, { practice: { ...practiceScore, date: todayISO() } });
                holder.replaceChildren(h('div', { class: 'card done-card' },
                  h('h2', null, `${practiceScore.clean} of ${practiceScore.total} right first time`),
                  h('p', null, practiceScore.clean === practiceScore.total ? 'Excellent. On to the exam-style question.' : 'Every question you missed is in your retry queue for tomorrow.')));
                setNext('Next');
              } else mount(newSeed());
            },
            onAnother: () => mount(newSeed()),
          });
          holder.replaceChildren(card);
          window.scrollTo(0, 0);
        };
        mount(newSeed());
        return [head, holder];
      }
      case 'recap': {
        setNext('Finish lesson');
        const nextLesson = LESSONS.find((l) => l.group !== 'extra' && l.id !== lesson.id && !(p.learnProgress?.[l.id]?.completed));
        return [h('article', { class: 'card learn-card' }, h('h2', null, 'Summary'), md(step.md),
          step.mistakes?.length ? h('div', { class: 'key-box warn' }, h('span', { class: 'eyebrow' }, 'Common mistakes'), h('ul', { class: 'bullets' }, step.mistakes.map((m) => h('li', null, m)))) : null),
        nextLesson ? h('p', { class: 'fine' }, `Next suggested lesson: ${nextLesson.title}`) : null];
      }
      default:
        return [h('p', null, 'Unknown step.')];
    }
  }

  backBtn.addEventListener('click', () => go2(index - 1));
  nextBtn.addEventListener('click', async () => {
    if (index < lesson.steps.length - 1) return go2(index + 1);
    await saveLessonState(lesson.id, { step: 0, completed: true, completedAt: new Date().toISOString() });
    toast('Lesson complete. Mistakes are queued for a retry tomorrow.');
    go('#/learn');
  });

  show();
  return async () => {
    document.body.classList.remove('sitting');
    await stopTimer();
  };
}

// ---- Practice sessions: retry wrongs, review due topics, mixed ---------------------

function pickTemplate(lesson, r, maxLevel = 3) {
  const ids = Object.keys(lesson.templates).filter((id) => (lesson.templates[id].level || 1) <= maxLevel);
  return r.pick(ids.length ? ids : Object.keys(lesson.templates));
}

async function sessionItems(kind) {
  const p = await getProgress();
  const r = rng(newSeed());
  if (kind === 'retry') {
    return dueRetries(p).filter((x) => BY_ID[x.lessonId]?.templates[x.templateId]).map((x) => ({ lesson: BY_ID[x.lessonId], templateId: x.templateId }));
  }
  if (kind === 'review') {
    const items = [];
    for (const t of Object.entries(p.topics).filter(([, v]) => v.nextDue && v.nextDue <= todayISO()).map(([code]) => code)) {
      const l = lessonForTopic(LESSONS, t);
      if (l && Object.keys(l.templates).length) items.push({ lesson: l, templateId: pickTemplate(l, r, p.topics[t].status === 'green' ? 3 : 2) });
      if (items.length >= 8) break;
    }
    return items;
  }
  const done = LESSONS.filter((l) => p.learnProgress?.[l.id]?.completed && Object.keys(l.templates).length);
  const pool = done.length ? done : LESSONS.filter((l) => Object.keys(l.templates).length && !l.extra);
  return Array.from({ length: 10 }, () => { const l = r.pick(pool); return { lesson: l, templateId: pickTemplate(l, r) }; });
}

export async function renderSession(shell, kind, go) {
  const items = await sessionItems(kind);
  const titles = { retry: 'Retry wrongs', review: 'Quick review', mix: 'Mixed practice' };
  const empty = { retry: 'Nothing to retry today. Questions you get wrong come back here the next day.', review: 'No topics are due for review today.', mix: 'Do a lesson first, then mix them up here.' };
  const stop = timer(`learn-${kind}-${todayISO()}`);
  if (!items.length) {
    shell.replaceChildren(h('p', { class: 'eyebrow' }, 'Learn'), h('h1', { class: 'display' }, titles[kind]), h('p', { class: 'empty' }, empty[kind]), h('a', { class: 'btn ghost', href: '#/learn' }, 'Back to Learn'));
    return stop;
  }
  let i = 0;
  let clean = 0;
  const head = h('p', { class: 'eyebrow' });
  const holder = h('div', { class: 'q-holder' });
  shell.replaceChildren(h('p', { class: 'eyebrow' }, 'Learn'), h('h1', { class: 'display' }, titles[kind]), head, holder);
  const mount = (seed) => {
    const it = items[i];
    head.textContent = `Question ${i + 1} of ${items.length} · ${it.lesson.title}`;
    holder.replaceChildren(questionCard({
      lesson: it.lesson, templateId: it.templateId, seed, mode: kind, label: `${i + 1}/${items.length}`,
      onResolved: (res) => {
        if (res.clean) clean++;
        i++;
        if (i >= items.length) {
          holder.replaceChildren(h('div', { class: 'card done-card' },
            h('h2', null, `${clean} of ${items.length} right first time`),
            h('p', null, kind === 'retry' ? 'Right first time twice in a row clears a question from the queue.' : 'Results are saved to your topic progress.'),
            h('a', { class: 'btn primary', href: '#/learn' }, 'Back to Learn')));
          head.textContent = 'Done';
        } else mount(newSeed());
      },
      onAnother: () => mount(newSeed()),
    }));
    window.scrollTo(0, 0);
  };
  mount(newSeed());
  return stop;
}

// ---- Flashcards -----------------------------------------------------------------------

export async function renderCards(shell) {
  const state = (await db.kvGet('cards')) || {};
  const today = todayISO();
  const dueCards = CARDS.filter((c) => !state[c.id] || state[c.id].due <= today);
  const deck = dueCards.length ? dueCards : CARDS;
  let i = 0;
  let known = 0;
  const holder = h('div');
  const counter = h('p', { class: 'fine mono' });
  const showCard = () => {
    if (i >= deck.length) {
      holder.replaceChildren(h('div', { class: 'card done-card' }, h('h2', null, `${known} of ${deck.length} known`), h('p', null, 'Cards you did not know come back tomorrow; known ones in 3, then 7 days.'), h('a', { class: 'btn primary', href: '#/learn' }, 'Back to Learn')));
      counter.textContent = '';
      return;
    }
    const c = deck[i];
    counter.textContent = `Card ${i + 1} of ${deck.length}${dueCards.length ? '' : ' (all reviewed; extra practice)'}`;
    const back = h('div', { class: 'flash-back', hidden: true }, md(c.back));
    const rate = h('div', { class: 'row', hidden: true },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => grade(false) }, 'Not yet'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => grade(true) }, 'I knew it'));
    const flip = h('button', { class: 'btn secondary', type: 'button', onclick: () => { back.hidden = false; rate.hidden = false; flip.remove(); } }, 'Show answer');
    holder.replaceChildren(h('article', { class: 'card flash' }, h('span', { class: 'eyebrow' }, c.topic), md(c.front, 'md flash-front'), back, flip, rate));
  };
  const grade = async (ok) => {
    const c = deck[i];
    const prev = state[c.id] || { stage: -1 };
    const stage = ok ? Math.min(prev.stage + 1, 2) : 0;
    state[c.id] = { stage, due: addDays(today, ok ? [1, 3, 7][stage] : 1) };
    if (ok) known++;
    await db.kvSet('cards', state);
    i++;
    showCard();
  };
  shell.replaceChildren(h('p', { class: 'eyebrow' }, 'Learn'), h('h1', { class: 'display' }, 'Must-know facts'), h('p', { class: 'sub' }, 'Say the answer out loud or write it down, then check.'), counter, holder);
  showCard();
}

export { LESSONS, BY_ID, lessonForTopic };
