// Feedback packs: apply to progress, show marks, and start the next lesson.

import * as db from './db.js';
import { h, toast, questionLabel, fmtDate } from './util.js';
import { renderMarkdown, renderInline } from './md.js';
import { getPack, parsePack, storePack, imageURL, topicData } from './pack.js';
import { getProgress, saveProgress, applyFeedback, mergeIncoming } from './progress.js';
import { startAttempt, zoomImage } from './sit.js';

// Called after a feedback pack has been parsed and stored.
export async function applyFeedbackPack(parsed, rec) {
  const fb = parsed.feedback;
  const attempts = await db.byIndex('attempts', 'packId', fb.forPackId);
  const att = attempts.find((a) => a.id === rec.forAttemptId) || attempts.filter((a) => a.status === 'submitted').pop();
  if (att && !rec.forAttemptId) {
    rec.forAttemptId = att.id;
    await db.put('feedback', rec);
  }
  const marked = await getPack(fb.forPackId);
  const meta = {
    attemptNo: att?.attemptNo || 1,
    type: marked?.manifest.type,
    source: marked?.manifest.source,
    title: marked?.manifest.title,
    libraryId: marked?.manifest.paperRef?.libraryId || (marked?.origin === 'library' ? marked.packId : null),
  };
  if (parsed.progress) {
    const r = await mergeIncoming(parsed.progress);
    if (r === 'ignored') {
      const p = await getProgress();
      await saveProgress(applyFeedback(p, fb, meta));
    }
    return r;
  }
  const p = await getProgress();
  await saveProgress(applyFeedback(p, fb, meta));
  return 'applied';
}

export async function startNext(feedbackPackId, go) {
  const rec = await db.get('feedback', feedbackPackId);
  if (!rec?.nextBlob) return;
  let packId = rec.nextPackId;
  if (!packId || !(await getPack(packId))) {
    const parsed = await parsePack(rec.nextBlob);
    if (parsed.errors.length) {
      toast(`The next lesson could not be opened: ${parsed.errors[0]}`, 'bad');
      return;
    }
    const stored = await storePack(parsed, 'next');
    packId = stored.packId;
    rec.nextPackId = packId;
    await db.put('feedback', rec);
  }
  const attemptId = await startAttempt(packId);
  go(`#/sit/${attemptId}`);
}

const LOST_LABEL = { knowledge: 'Knowledge gap', careless: 'Careless error' };
const VERDICT = { secure: ['Secure', 'good'], developing: ['Developing', 'warn'], weak: ['Weak', 'bad'] };

export async function renderFeedback(root, feedbackPackId, go) {
  const rec = await db.get('feedback', feedbackPackId);
  if (!rec) {
    root.replaceChildren(h('p', { class: 'empty' }, 'That feedback was not found.'));
    return;
  }
  const fb = rec.feedback;
  const marked = await getPack(fb.forPackId);
  const att = rec.forAttemptId ? await db.get('attempts', rec.forAttemptId) : null;
  const { byCode } = await topicData();
  const qById = Object.fromEntries((marked?.questions || []).map((q) => [q.id, q]));
  const resolver = (name) => imageURL(rec.images?.[name]);
  const pct = fb.maxScore ? Math.round((fb.score / fb.maxScore) * 100) : 0;
  const ge = fb.gradeEstimate || {};
  const nextStarted = rec.nextPackId ? (await db.byIndex('attempts', 'packId', rec.nextPackId)).length > 0 : false;

  const questionRows = [];
  for (const fq of fb.questions || []) {
    const q = qById[fq.questionId];
    const a = att?.answers?.[fq.questionId];
    const full = fq.marksAwarded >= fq.maxMarks;
    const photos = [];
    for (const pid of a?.photos || []) {
      const ph = await db.get('photos', pid);
      if (ph) {
        const url = imageURL(ph.blob);
        photos.push(h('button', { class: 'thumb-img small', onclick: () => zoomImage(url, 'Your working') }, h('img', { src: url, alt: 'Your working' })));
      }
    }
    if (full && !(fq.lost || []).length && !fq.comment) {
      questionRows.push(h('article', { class: 'fb-q full compact' },
        h('div', { class: 'q-head' },
          h('span', { class: 'qnum mono' }, q ? questionLabel(q) : fq.questionId),
          h('span', { class: 'q-src' }, (fq.topics || q?.topics || []).map((c) => byCode[c]?.name || c).join(' · ')),
          h('span', { class: 'pen mono', 'aria-label': `${fq.marksAwarded} out of ${fq.maxMarks} marks` }, `${fq.marksAwarded}/${fq.maxMarks}`))));
      continue;
    }
    questionRows.push(h('article', { class: `fb-q ${full ? 'full' : fq.marksAwarded ? 'part' : 'zero'}` },
      h('div', { class: 'q-head' },
        h('span', { class: 'qnum mono' }, q ? questionLabel(q) : fq.questionId),
        h('span', { class: 'q-src' }, (fq.topics || q?.topics || []).map((c) => byCode[c]?.name || c).join(' · ')),
        h('span', { class: 'pen mono', 'aria-label': `${fq.marksAwarded} out of ${fq.maxMarks} marks` }, `${fq.marksAwarded}/${fq.maxMarks}`)),
      fq.awarded?.length ? h('div', { class: 'codes', 'aria-label': 'Marks awarded' },
        fq.awarded.map((c) => h('span', { class: `code mono ${/^[A-Za-z]+0/.test(c) ? 'lost' : 'got'}` }, c))) : null,
      a ? h('div', { class: 'your-answer' },
        h('span', { class: 'eyebrow' }, 'Your answer'),
        h('span', { class: 'mono' }, a.typed.trim() || '(no typed answer)'),
        photos.length ? h('div', { class: 'thumbs' }, photos) : null) : null,
      (fq.lost || []).map((l) => h('div', { class: `lost ${l.type}` },
        h('span', { class: `chip ${l.type === 'careless' ? 'warn' : 'bad'}` }, `${LOST_LABEL[l.type] || 'Lost'} · −${l.marks ?? 1}`),
        h('div', { class: 'md', html: renderMarkdown(l.reason || '', resolver) }))),
      fq.comment ? h('div', { class: 'md comment', html: renderMarkdown(fq.comment, resolver) }) : null,
      fq.modelAnswer ? h('details', { class: 'model' },
        h('summary', null, 'Model answer'),
        h('div', { class: 'md', html: renderMarkdown(fq.modelAnswer, resolver) })) : null));
  }

  const list = (items, cls) => h('ul', { class: `bullets ${cls}` }, (items || []).map((t) => h('li', { html: renderInline(t) })));

  root.replaceChildren(h('div', { class: 'page narrow feedback' },
    h('p', { class: 'eyebrow' }, `Feedback · marked ${fmtDate(fb.markedAt)}`),
    h('h1', { class: 'display' }, marked?.manifest.title || rec.manifest.title),
    h('section', { class: 'score-hero' },
      h('div', { class: 'score' },
        h('span', { class: 'pen big mono' }, `${fb.score}`),
        h('span', { class: 'of mono' }, `/ ${fb.maxScore}`),
        h('span', { class: 'pct mono' }, `${pct}%`)),
      h('div', { class: 'grade' },
        h('span', { class: 'eyebrow' }, 'Grade estimate'),
        h('span', { class: 'grade-num' }, ge.grade ?? '–'),
        h('span', { class: 'fine' }, [ge.range ? `Range ${ge.range.join('–')}` : null, ge.confidence ? `${ge.confidence} confidence` : null, ge.boundarySeries ? `${ge.boundarySeries} boundaries` : null].filter(Boolean).join(' · ')))),
    ge.basis ? h('p', { class: 'fine' }, ge.basis) : null,
    rec.nextBlob ? h('button', { class: 'btn primary block', onclick: () => startNext(rec.packId, go) }, nextStarted ? 'Continue next lesson' : 'Start next lesson') : null,
    h('div', { class: 'md lead', html: renderMarkdown(fb.summary || '') }),
    h('div', { class: 'two' },
      h('section', null, h('h2', null, 'Wins'), list(fb.wins, 'wins')),
      h('section', null, h('h2', null, 'Fixes'), list(fb.fixes, 'fixes'))),
    fb.topics?.length ? h('section', null, h('h2', null, 'Topics'),
      h('div', { class: 'chips' }, fb.topics.map((t) => {
        const [label, kind] = VERDICT[t.verdict] || [t.verdict, ''];
        return h('span', { class: `chip ${kind}`, title: t.note || '' }, `${t.topic} ${byCode[t.topic]?.name || ''} · ${label}`);
      }))) : null,
    h('section', null, h('h2', null, 'Question by question'),
      h('p', { class: 'fine' }, `${(fb.questions || []).filter((q) => q.marksAwarded >= q.maxMarks).length} of ${(fb.questions || []).length} full marks. Dropped marks are shown in full.`),
      questionRows),
    fb.nextSession ? h('section', { class: 'card' }, h('h2', null, 'Next session'), h('div', { class: 'md', html: renderMarkdown(fb.nextSession) })) : null,
    rec.nextBlob ? h('button', { class: 'btn primary block', onclick: () => startNext(rec.packId, go) }, nextStarted ? 'Continue next lesson' : 'Start next lesson') : null));
}
