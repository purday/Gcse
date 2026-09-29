// Sitting a paper or lesson: question view, answer box, working photos,
// navigator, flags, countdown (papers) and continuous autosave.

import * as db from './db.js';
import { h, $, uid, nowISO, fmtClock, questionLabel, toast, sheet, debounce } from './util.js';
import { renderMarkdown } from './md.js';
import { getPack, imageURL, resolveLibraryRef, topicData } from './pack.js';
import { addStudyTime, recordAttempt, markRealPaperUsed } from './progress.js';
import { buildResults } from './results.js';

const SYMBOLS = ['√', 'π', '²', '³', '^', '/', '×', '÷', '±', '≤', '≥', '≠', '°', '½', '∞', 'θ'];

export async function startAttempt(packId) {
  const pack = await getPack(packId);
  if (!pack) throw new Error('That pack is not on this device any more. Import it again.');
  const prior = await db.byIndex('attempts', 'packId', packId);
  const active = prior.find((a) => a.status === 'active');
  if (active) return active.id;
  const answers = {};
  for (const q of pack.questions) answers[q.id] = { typed: '', photos: [], timeSpentSecs: 0, flagged: false };
  const att = {
    id: uid('a'),
    packId,
    attemptNo: prior.length + 1,
    startedAt: nowISO(),
    status: 'active',
    timeLimitMins: pack.manifest.timeLimitMins ?? null,
    activeSecs: 0,
    pausedCount: 0,
    current: 0,
    answers,
    submittedAt: null,
    submitReason: null,
  };
  await db.put('attempts', att);
  await recordAttempt(att);
  const libraryId = pack.manifest.paperRef?.libraryId || (pack.origin === 'library' ? pack.packId : null);
  if (libraryId && pack.manifest.type === 'paper') await markRealPaperUsed(libraryId, pack.packId);
  return att.id;
}

async function compressPhoto(file, maxEdge = 1200, quality = 0.8) {
  let src;
  let w;
  let hgt;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
    w = src.width;
    hgt = src.height;
  } catch {
    const url = URL.createObjectURL(file);
    src = new Image();
    src.src = url;
    await src.decode();
    w = src.naturalWidth;
    hgt = src.naturalHeight;
    URL.revokeObjectURL(url);
  }
  const scale = Math.min(1, maxEdge / Math.max(w, hgt));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(hgt * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export function zoomImage(url, alt) {
  const wrap = h('div', { class: 'zoom-wrap', role: 'dialog', 'aria-label': 'Enlarged image', onclick: () => wrap.remove() },
    h('img', { src: url, alt: alt || '' }),
    h('button', { class: 'btn zoom-close', onclick: () => wrap.remove() }, 'Close'));
  wrap.addEventListener('keydown', (e) => e.key === 'Escape' && wrap.remove());
  document.body.appendChild(wrap);
  wrap.querySelector('button').focus();
}

function figure(blobObj, alt, caption) {
  const url = imageURL(blobObj);
  if (!url) return h('p', { class: 'img-missing' }, `Image missing${caption ? `: ${caption}` : ''}`);
  return h('figure', { class: 'q-fig' },
    h('button', { class: 'fig-btn', title: 'Tap to enlarge', onclick: () => zoomImage(url, alt) },
      h('img', { src: url, alt: alt || 'Question diagram', loading: 'lazy' })),
    caption ? h('figcaption', null, caption) : null);
}

export async function renderQuestionBody(pack, q, { showHints = false } = {}) {
  const imgs = pack.images || {};
  const resolver = (name) => imageURL(imgs[name]);
  const body = h('div', { class: 'q-body' });
  if (q.workedExample) {
    const we = q.workedExample;
    body.appendChild(h('details', { class: 'worked', open: pack.manifest.type === 'lesson' },
      h('summary', null, h('span', { class: 'eyebrow' }, 'Worked example'), ' ', we.title || ''),
      h('div', { class: 'md', html: renderMarkdown(we.body, resolver) }),
      we.image ? figure(imgs[we.image], we.title) : null));
  }
  let lib = null;
  if (q.libraryRef) lib = await resolveLibraryRef(q.libraryRef);
  if (q.stem || q.stemImage || lib?.stemImage) {
    const stem = h('div', { class: 'q-stem' });
    if (q.stem) stem.appendChild(h('div', { class: 'md', html: renderMarkdown(q.stem, resolver) }));
    if (q.stemImage) stem.appendChild(figure(imgs[q.stemImage], 'Question diagram'));
    else if (lib?.stemImage) stem.appendChild(figure(lib.stemImage, 'Original question', 'Original AQA question'));
    body.appendChild(stem);
  }
  if (q.image) body.appendChild(figure(imgs[q.image], 'Question image'));
  else if (lib?.image) body.appendChild(figure(lib.image, 'Original question', 'Original AQA question'));
  if (q.prompt) body.appendChild(h('div', { class: 'md q-prompt', html: renderMarkdown(q.prompt, resolver) }));
  if (showHints && q.hint) {
    const hint = h('div', { class: 'md hint', hidden: true, html: renderMarkdown(q.hint, resolver) });
    body.appendChild(h('button', { class: 'btn ghost small', onclick: (e) => { hint.hidden = false; e.target.remove(); } }, 'Show hint'));
    body.appendChild(hint);
  }
  return body;
}

export function marksLabel(m) {
  return `[${m} mark${m === 1 ? '' : 's'}]`;
}

export async function renderSit(root, attemptId, go) {
  const att = await db.get('attempts', attemptId);
  if (!att) {
    root.replaceChildren(h('p', { class: 'empty' }, 'That sitting was not found.'));
    return () => {};
  }
  if (att.status !== 'active') {
    go(`#/done/${att.id}`);
    return () => {};
  }
  const pack = await getPack(att.packId);
  const qs = pack.questions;
  const m = pack.manifest;
  const timed = Number.isInteger(att.timeLimitMins);
  const limitSecs = timed ? att.timeLimitMins * 60 : 0;
  let paused = false;
  let dirty = false;
  let studyPending = 0;
  let lastTick = Date.now();
  let warned10 = false;
  let warned5 = false;
  let submitting = false;
  att.current = Math.min(att.current || 0, qs.length - 1);

  const photoCache = new Map();
  const topicNames = Object.fromEntries((await topicData()).data.topics.map((t) => [t.code, t.name]));
  const save = async () => {
    dirty = false;
    await db.put('attempts', att);
    if (studyPending >= 1) {
      const secs = Math.floor(studyPending);
      studyPending -= secs;
      await addStudyTime({ attemptId: att.id, packId: att.packId, secs });
    }
  };
  const saveSoon = debounce(() => save().catch(() => toast('Could not save. Is the phone storage full?', 'bad')), 300);

  // ---- layout
  const timerEl = h('span', { class: 'timer mono', 'aria-live': 'off' });
  const posEl = h('span', { class: 'mono' });
  const navGrid = h('div', { class: 'nav-grid', role: 'list' });
  const navSummary = h('p', { class: 'nav-summary' });
  const qPane = h('main', { class: 'q-pane', id: 'q-pane', tabindex: '-1' });
  const flagBtn = h('button', { class: 'btn ghost', 'aria-pressed': 'false' }, 'Flag');
  const prevBtn = h('button', { class: 'btn ghost' }, 'Previous');
  const nextBtn = h('button', { class: 'btn primary' }, 'Next');
  const pauseBtn = timed ? h('button', { class: 'btn ghost small' }, 'Pause') : null;
  const navPane = h('aside', { class: 'nav-pane', 'aria-label': 'Questions' },
    h('h2', { class: 'eyebrow' }, 'Questions'), navGrid, navSummary,
    h('button', { class: 'btn danger-outline block', onclick: () => finish() }, timed ? 'Finish paper' : 'Finish lesson'));
  const navToggle = h('button', { class: 'btn ghost small nav-toggle', 'aria-expanded': 'false', onclick: () => toggleNav() }, posEl);

  const bar = h('header', { class: 'sit-bar' },
    h('button', { class: 'btn ghost small', onclick: () => leave() }, 'Exit'),
    h('div', { class: 'sit-title' },
      h('span', { class: 'sit-name' }, m.title),
      h('span', { class: 'sit-meta' }, m.calculator ? 'Calculator allowed' : 'Non-calculator')),
    timerEl, pauseBtn, navToggle);
  const foot = h('footer', { class: 'sit-foot' }, prevBtn, flagBtn, nextBtn);
  const pausedCover = h('div', { class: 'paused-cover', hidden: true },
    h('div', null,
      h('p', { class: 'display' }, 'Paused'),
      h('p', null, 'The clock is stopped and the questions are hidden.'),
      h('button', { class: 'btn primary', onclick: () => setPaused(false) }, 'Resume')));

  const wrap = h('div', { class: `sit ${timed ? 'is-timed' : ''}` }, bar, h('div', { class: 'sit-body' }, qPane, navPane), foot, pausedCover);
  root.replaceChildren(wrap);
  document.body.classList.add('sitting');

  function toggleNav(force) {
    const open = force ?? !wrap.classList.contains('nav-open');
    wrap.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  }

  function setPaused(v) {
    paused = v;
    if (v) att.pausedCount++;
    pausedCover.hidden = !v;
    lastTick = Date.now();
    saveSoon();
  }
  pauseBtn?.addEventListener('click', () => setPaused(true));

  function state(q) {
    const a = att.answers[q.id];
    return { answered: !!(a.typed.trim() || a.photos.length), flagged: a.flagged };
  }

  function renderNav() {
    navGrid.replaceChildren(...qs.map((q, i) => {
      const s = state(q);
      return h('button', {
        class: `nav-chip ${s.answered ? 'answered' : ''} ${s.flagged ? 'flagged' : ''} ${i === att.current ? 'current' : ''}`,
        role: 'listitem',
        'aria-label': `Question ${questionLabel(q)}${s.answered ? ', answered' : ''}${s.flagged ? ', flagged' : ''}`,
        onclick: () => { show(i); toggleNav(false); },
      }, questionLabel(q));
    }));
    const answered = qs.filter((q) => state(q).answered).length;
    const flagged = qs.filter((q) => state(q).flagged).length;
    navSummary.textContent = `${answered} of ${qs.length} answered${flagged ? ` · ${flagged} flagged` : ''}`;
    posEl.textContent = `Q ${att.current + 1}/${qs.length}`;
  }

  function renderTimer() {
    if (timed) {
      const left = limitSecs - att.activeSecs;
      timerEl.textContent = fmtClock(left);
      timerEl.className = `timer mono ${left <= 300 ? 'crit' : left <= 600 ? 'warn' : ''}`;
      timerEl.setAttribute('aria-label', `${Math.ceil(left / 60)} minutes left`);
    } else {
      timerEl.textContent = fmtClock(att.activeSecs);
      timerEl.setAttribute('aria-label', 'Time spent');
    }
  }

  async function photoThumbs(q, list) {
    const a = att.answers[q.id];
    list.replaceChildren();
    for (const [i, pid] of a.photos.entries()) {
      let rec = photoCache.get(pid);
      if (!rec) {
        rec = await db.get('photos', pid);
        if (rec) photoCache.set(pid, rec);
      }
      if (!rec) continue;
      const url = imageURL(rec.blob);
      list.appendChild(h('div', { class: 'thumb' },
        h('button', { class: 'thumb-img', onclick: () => zoomImage(url, `Working photo ${i + 1}`) }, h('img', { src: url, alt: `Working photo ${i + 1}` })),
        h('button', {
          class: 'thumb-del', 'aria-label': `Remove photo ${i + 1}`,
          onclick: async () => {
            const ok = await sheet({ title: 'Remove this photo?', body: 'It will not be sent to your tutor.', actions: [{ label: 'Keep', value: false }, { label: 'Remove', value: true, kind: 'danger' }] });
            if (!ok) return;
            a.photos = a.photos.filter((x) => x !== pid);
            await db.del('photos', pid);
            await save();
            photoThumbs(q, list);
            renderNav();
          },
        }, '×')));
    }
  }

  async function show(i) {
    att.current = Math.max(0, Math.min(qs.length - 1, i));
    const q = qs[att.current];
    const a = att.answers[q.id];

    const head = h('div', { class: 'q-head' },
      h('span', { class: 'qnum mono', 'aria-label': `Question ${questionLabel(q)}` }, questionLabel(q)),
      h('span', { class: 'q-src' }, q.sourceRef || (m.type === 'lesson' ? (q.topics || []).map((c) => topicNames[c] || c).join(' · ') : '')),
      h('span', { class: 'q-marks mono' }, marksLabel(q.marks)));
    const body = await renderQuestionBody(pack, q, { showHints: !timed });

    const ta = h('textarea', { id: 'answer', rows: '2', placeholder: 'Type your final answer', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    ta.value = a.typed;
    const grow = () => { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`; };
    ta.addEventListener('input', () => { a.typed = ta.value; grow(); dirty = true; saveSoon(); renderNav(); });
    const symbols = h('div', { class: 'symbols', role: 'toolbar', 'aria-label': 'Maths symbols' },
      SYMBOLS.map((s) => h('button', {
        class: 'sym', type: 'button', tabindex: '-1',
        onmousedown: (e) => e.preventDefault(),
        onclick: () => {
          const st = ta.selectionStart ?? ta.value.length;
          ta.setRangeText(s, st, ta.selectionEnd ?? st, 'end');
          ta.dispatchEvent(new Event('input'));
          ta.focus();
        },
      }, s)));

    const list = h('div', { class: 'thumbs' });
    const addPhotos = async (files) => {
      for (const f of files) {
        try {
          const jpg = await compressPhoto(f);
          const pid = uid('p');
          await db.put('photos', { id: pid, attemptId: att.id, questionId: q.id, blob: jpg, createdAt: nowISO() });
          a.photos.push(pid);
        } catch {
          toast('That photo could not be read. Try taking it again.', 'bad');
        }
      }
      await save();
      photoThumbs(q, list);
      renderNav();
    };
    const camInput = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, onchange: (e) => { addPhotos([...e.target.files]); e.target.value = ''; } });
    const galInput = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: (e) => { addPhotos([...e.target.files]); e.target.value = ''; } });

    const answer = h('section', { class: 'answer', 'aria-label': 'Your answer' },
      h('label', { for: 'answer', class: 'answer-label' }, 'Final answer'),
      ta, symbols,
      h('div', { class: 'photo-row' },
        h('button', { class: `btn ${q.answerType === 'working' ? 'secondary' : 'ghost'}`, onclick: () => camInput.click() }, 'Photo of working'),
        h('button', { class: 'btn ghost small', onclick: () => galInput.click() }, 'Choose from gallery'),
        camInput, galInput),
      q.answerType === 'working' ? h('p', { class: 'hint-line' }, 'Method marks available. Photograph your working so the tutor can award them.') : null,
      list);

    qPane.replaceChildren(h('article', { class: 'qcard paper' }, head, body), answer);
    photoThumbs(q, list);
    grow();

    flagBtn.textContent = a.flagged ? 'Flagged' : 'Flag';
    flagBtn.setAttribute('aria-pressed', String(a.flagged));
    flagBtn.classList.toggle('on', a.flagged);
    prevBtn.disabled = att.current === 0;
    const last = att.current === qs.length - 1;
    nextBtn.textContent = last ? 'Finish' : 'Next';
    renderNav();
    qPane.scrollTop = 0;
    window.scrollTo(0, 0);
    saveSoon();
  }

  flagBtn.addEventListener('click', () => {
    const a = att.answers[qs[att.current].id];
    a.flagged = !a.flagged;
    flagBtn.textContent = a.flagged ? 'Flagged' : 'Flag';
    flagBtn.setAttribute('aria-pressed', String(a.flagged));
    flagBtn.classList.toggle('on', a.flagged);
    renderNav();
    saveSoon();
  });
  prevBtn.addEventListener('click', () => show(att.current - 1));
  nextBtn.addEventListener('click', () => (att.current === qs.length - 1 ? finish() : show(att.current + 1)));

  async function submit(reason) {
    if (submitting) return;
    submitting = true;
    clearInterval(timer);
    att.status = 'submitted';
    att.submittedAt = nowISO();
    att.submitReason = reason;
    await save();
    await recordAttempt(att);
    try {
      await buildResults(att.id);
    } catch (e) {
      toast(`Saved, but the results zip failed: ${e.message}`, 'bad');
    }
    go(`#/done/${att.id}`);
  }

  async function finish() {
    const answered = qs.filter((q) => state(q).answered).length;
    const flagged = qs.filter((q) => state(q).flagged).length;
    const lines = [`You have answered ${answered} of ${qs.length} questions.`];
    if (flagged) lines.push(`${flagged} ${flagged === 1 ? 'is' : 'are'} flagged for review.`);
    if (timed) lines.push(`${fmtClock(limitSecs - att.activeSecs)} left on the clock.`);
    const ok = await sheet({
      title: timed ? 'Finish the paper?' : 'Finish the lesson?',
      body: h('div', null, lines.map((l) => h('p', null, l)), h('p', null, 'You cannot change answers after this.')),
      actions: [{ label: 'Keep working', value: false }, { label: 'Finish and send', value: true, kind: 'primary' }],
    });
    if (ok) submit('finished');
  }

  async function leave() {
    await save();
    go('#/today');
  }

  function tick() {
    const now = Date.now();
    const delta = Math.min(now - lastTick, 5000) / 1000;
    lastTick = now;
    if (paused || document.hidden || submitting) return;
    att.activeSecs += delta;
    att.answers[qs[att.current].id].timeSpentSecs += delta;
    studyPending += delta;
    dirty = true;
    renderTimer();
    if (timed) {
      const left = limitSecs - att.activeSecs;
      if (!warned10 && left <= 600 && left > 300) { warned10 = true; toast('10 minutes left', 'warn'); }
      if (!warned5 && left <= 300) { warned5 = true; toast('5 minutes left', 'warn'); }
      if (left <= 0) {
        toast('Time is up. Your answers have been submitted.', 'warn');
        submit('time-up');
      }
    }
  }
  const timer = setInterval(tick, 1000);
  const periodic = setInterval(() => dirty && save(), 10000);
  const onHide = () => {
    lastTick = Date.now();
    if (document.hidden) save();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', save);

  renderTimer();
  await show(att.current);

  return () => {
    clearInterval(timer);
    clearInterval(periodic);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', save);
    document.body.classList.remove('sitting');
    if (!submitting) save();
  };
}
