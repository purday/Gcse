// App shell: lock screen, router and the Today / Papers / Progress / More views.

import * as db from './db.js';
import { h, $, toast, sheet, fmtDate, fmtHours, todayISO, addDays, daysBetween, downloadBlob } from './util.js';
import { tryUnlock, restore, lock } from './lock.js';
import { parsePack, storePack, storeFeedback, getPack, libraryPapers, loadLibraryPack, topicData } from './pack.js';
import { getProgress, saveProgress, studySecsByDate, streak, dueTopics, addStudyTime } from './progress.js';
import { renderSit, startAttempt } from './sit.js';
import { renderDone, awaitingFeedback, submittedLabel } from './results.js';
import { applyFeedbackPack, renderFeedback, startNext } from './feedback.js';
import { scoreChart, hoursChart } from './charts.js';
import { exportBackup, isBackup, restoreBackup } from './backup.js';
import { renderMarkdown } from './md.js';

const GOAL_SECS = 2 * 3600;
const app = document.getElementById('app');
let cleanup = null;
let config = null;

async function loadConfig() {
  if (!config) config = await (await fetch('config/exam.json')).json();
  return config;
}

const go = (hash) => {
  if (location.hash === hash) route();
  else location.hash = hash;
};

// ---- Import --------------------------------------------------------------

const importInput = h('input', { type: 'file', accept: '.zip,application/zip,application/x-zip-compressed', hidden: true, id: 'import-input' });
document.body.appendChild(importInput);
importInput.addEventListener('change', async () => {
  const file = importInput.files[0];
  importInput.value = '';
  if (file) await importFile(file);
});
const pickImport = () => importInput.click();

function listSheet(title, intro, items, actions) {
  return sheet({ title, body: h('div', null, intro ? h('p', null, intro) : null, h('ul', { class: 'bullets' }, items.map((i) => h('li', null, i)))), actions });
}

async function importFile(file) {
  let zip;
  try {
    zip = await window.JSZip.loadAsync(file);
  } catch {
    await sheet({ title: 'That file did not open', body: 'Choose the .zip file your tutor sent. If it came as a download link, save it first.', actions: [{ label: 'OK', value: true, kind: 'primary' }] });
    return;
  }
  if (await isBackup(zip)) {
    const ok = await sheet({ title: 'Restore this backup?', body: 'Everything on this device will be replaced by the backup.', actions: [{ label: 'Cancel', value: false }, { label: 'Restore', value: true, kind: 'danger' }] });
    if (ok) {
      await restoreBackup(zip);
      toast('Backup restored');
      location.hash = '#/today';
      location.reload();
    }
    return;
  }
  const parsed = await parsePack(zip);
  if (parsed.errors.length) {
    await listSheet('This pack has problems', 'Send this list to your tutor and ask for a fixed pack:', parsed.errors, [{ label: 'OK', value: true, kind: 'primary' }]);
    return;
  }
  const m = parsed.manifest;
  if (m.type === 'feedback') {
    if (await db.get('feedback', m.packId)) {
      const ok = await sheet({ title: 'Feedback already imported', body: 'Import it again? Progress from it will be applied again.', actions: [{ label: 'Cancel', value: false }, { label: 'Import again', value: true, kind: 'primary' }] });
      if (!ok) return;
    }
    const rec = await storeFeedback(parsed);
    const r = await applyFeedbackPack(parsed, rec);
    toast(r === 'replaced' ? 'Feedback imported. Progress updated from your tutor.' : 'Feedback imported.');
    go(`#/feedback/${rec.packId}`);
    return;
  }
  const existing = await getPack(m.packId);
  if (existing) {
    const ok = await sheet({ title: 'You already have this pack', body: `"${existing.manifest.title}" is already on this device. Replace it with the new copy?`, actions: [{ label: 'Keep old', value: false }, { label: 'Replace', value: true, kind: 'primary' }] });
    if (!ok) {
      go(`#/pack/${m.packId}`);
      return;
    }
  }
  await storePack(parsed, 'import');
  if (parsed.warnings.length) toast(`Imported with ${parsed.warnings.length} warning${parsed.warnings.length === 1 ? '' : 's'}`, 'warn');
  go(`#/pack/${m.packId}`);
}

// ---- Shared pieces -------------------------------------------------------

function nextPaper(cfg) {
  const today = todayISO();
  return cfg.exam.papers.find((p) => p.date >= today) || null;
}

function daysTo(date) {
  return daysBetween(todayISO(), date);
}

function tabbar(active) {
  const tabs = [['today', 'Today'], ['papers', 'Papers'], ['progress', 'Progress'], ['more', 'More']];
  return h('nav', { class: 'tabbar', 'aria-label': 'Main' },
    tabs.map(([id, label]) => h('a', { href: `#/${id}`, class: `tab ${active === id ? 'on' : ''}`, 'aria-current': active === id ? 'page' : null },
      h('span', { class: `tab-ico ico-${id}`, 'aria-hidden': 'true' }), h('span', null, label))));
}

function shell(active, ...content) {
  return h('div', { class: 'shell' },
    h('header', { class: 'topbar' },
      h('span', { class: 'brand' }, h('span', { class: 'brand-mark mono' }, '8300'), ' GCSE Maths'),
      h('button', { class: 'btn primary small top-import', onclick: pickImport }, 'Import pack')),
    h('div', { class: 'page' }, ...content),
    tabbar(active));
}

function statusGlyph(status) {
  return { green: '✓', amber: '~', red: '!' }[status] || '·';
}

// ---- Lock ------------------------------------------------------------------

function renderLock() {
  const input = h('input', { id: 'passcode', type: 'password', autocomplete: 'current-password', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Passcode', required: true });
  const err = h('p', { class: 'form-error', role: 'alert' });
  const btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Unlock');
  const form = h('form', { class: 'lock-form', onsubmit: async (e) => {
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Checking…';
    try {
      if (await tryUnlock(input.value)) {
        navigator.storage?.persist?.();
        route();
      } else {
        err.textContent = 'That passcode is not right. Check the spelling and try again.';
      }
    } catch (ex) {
      err.textContent = `Could not check the passcode: ${ex.message}`;
    }
    btn.disabled = false;
    btn.textContent = 'Unlock';
  } }, h('label', { for: 'passcode' }, 'Passcode'), input, err, btn);
  app.replaceChildren(h('div', { class: 'lock' },
    h('div', { class: 'lock-card paper' },
      h('span', { class: 'brand-mark mono big' }, '8300'),
      h('h1', { class: 'display' }, 'GCSE Maths practice'),
      h('p', null, 'AQA Higher. Enter the passcode you were given.'),
      form)));
  input.focus();
}

// ---- Today -------------------------------------------------------------------

async function renderToday() {
  const cfg = await loadConfig();
  const p = await getProgress();
  const np = nextPaper(cfg);
  const today = todayISO();
  const secsToday = studySecsByDate(p)[today] || 0;
  const [attempts, waiting, fbs] = await Promise.all([db.all('attempts'), awaitingFeedback(), db.all('feedback')]);
  const active = attempts.filter((a) => a.status === 'active');
  const latestFb = fbs.sort((a, b) => (a.importedAt < b.importedAt ? 1 : -1))[0];
  const due = dueTopics(p, today);
  const { byCode } = await topicData();

  let papers = [];
  try { papers = await libraryPapers(); } catch { papers = []; }
  const used = new Set(p.realPapersUsed.map((r) => r.id));
  const nextUnused = papers.find((x) => !used.has(x.libraryId));

  const cards = [];
  for (const a of active) {
    const pack = await getPack(a.packId);
    if (!pack) continue;
    const answered = Object.values(a.answers).filter((x) => x.typed.trim() || x.photos.length).length;
    const left = a.timeLimitMins ? a.timeLimitMins * 60 - a.activeSecs : null;
    cards.push(h('a', { class: 'card link continue', href: `#/sit/${a.id}` },
      h('span', { class: 'eyebrow' }, 'Continue'),
      h('strong', null, pack.manifest.title),
      h('span', { class: 'fine mono' }, `${answered}/${pack.questions.length} answered${left != null ? ` · ${Math.max(0, Math.ceil(left / 60))} min left` : ''}`)));
  }
  for (const a of waiting.slice(0, 3)) {
    const pack = await getPack(a.packId);
    cards.push(h('div', { class: 'card waiting' },
      h('span', { class: 'eyebrow' }, 'Waiting for marking'),
      h('strong', null, pack?.manifest.title || a.packId),
      h('span', { class: 'fine' }, submittedLabel(a)),
      h('a', { class: 'btn ghost small', href: `#/done/${a.id}` }, 'Send again')));
  }
  if (latestFb) {
    const nextStarted = latestFb.nextPackId ? (await db.byIndex('attempts', 'packId', latestFb.nextPackId)).length > 0 : false;
    cards.push(h('div', { class: 'card fb-card' },
      h('span', { class: 'eyebrow' }, 'Latest feedback'),
      h('strong', null, h('span', { class: 'pen mono' }, `${latestFb.feedback.score}/${latestFb.feedback.maxScore}`), ` · grade ${latestFb.feedback.gradeEstimate?.grade ?? '–'}`),
      h('div', { class: 'row' },
        h('a', { class: 'btn ghost small', href: `#/feedback/${latestFb.packId}` }, 'Read feedback'),
        latestFb.nextBlob && !nextStarted ? h('button', { class: 'btn primary small', onclick: () => startNext(latestFb.packId, go) }, 'Start next lesson') : null)));
  }

  const view = shell('today',
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, `AQA 8300 Higher · ${cfg.exam.series}`),
      np ? h('h1', { class: 'display' }, `${daysTo(np.date)} days to Paper ${np.paper}`) : h('h1', { class: 'display' }, 'Exams finished'),
      np ? h('p', { class: 'sub' }, `${fmtDate(np.date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${np.start} · ${np.calculator ? 'Calculator' : 'Non-calculator'}`) : null),
    h('section', { class: 'import-block' },
      h('button', { class: 'btn primary huge', onclick: pickImport, id: 'import-btn' }, h('span', { class: 'plus', 'aria-hidden': 'true' }, '+'), 'Import pack'),
      h('p', { class: 'fine' }, 'Open a lesson, paper or feedback zip from your tutor.')),
    cards.length ? h('section', { class: 'stack' }, cards) : null,
    h('section', { class: 'today-strip' },
      h('div', { class: 'meter-block' },
        h('div', { class: 'meter-top' }, h('span', { class: 'eyebrow' }, 'Studied today'), h('span', { class: 'mono nowrap' }, `${fmtHours(secsToday)} of 2 h`)),
        h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(GOAL_SECS), 'aria-valuenow': String(Math.round(secsToday)), 'aria-label': 'Study time today' },
          h('span', { style: { width: `${Math.min(100, (secsToday / GOAL_SECS) * 100)}%` } }))),
      h('div', { class: 'stat' }, h('span', { class: 'stat-num mono' }, String(streak(p))), h('span', { class: 'eyebrow' }, 'day streak'))),
    due.length ? h('section', null,
      h('h2', null, 'Due for review'),
      h('div', { class: 'chips' }, due.slice(0, 12).map((t) => h('span', { class: `chip ${t.status === 'green' ? 'good' : t.status === 'amber' ? 'warn' : 'bad'}` }, `${t.code} ${byCode[t.code]?.name || ''}`))),
      h('p', { class: 'fine' }, 'Your tutor puts these into your next lesson.')) : null,
    h('section', { class: 'card lib-card' },
      h('div', null,
        h('span', { class: 'eyebrow' }, 'Past Paper Library'),
        h('strong', null, papers.length ? `${used.size} of ${papers.length} real papers used` : 'No papers installed yet')),
      nextUnused ? h('button', { class: 'btn secondary small', onclick: () => confirmSitPaper(nextUnused) }, `Sit ${nextUnused.series} P${nextUnused.paper}`) : h('a', { class: 'btn ghost small', href: '#/papers' }, 'Open library')));
  app.replaceChildren(view);
}

// ---- Papers (library) ---------------------------------------------------------

async function confirmSitPaper(entry) {
  const ok = await sheet({
    title: `${entry.series} · Paper ${entry.paper}`,
    body: h('div', null,
      h('p', null, `${entry.calculator ? 'Calculator' : 'Non-calculator'} · ${entry.totalMarks} marks · 1 hour 30 minutes.`),
      h('p', null, 'Treat it like the real exam: the clock starts when you tap Start, and your answers are submitted automatically when it reaches zero. Have paper, a pen and (if allowed) your calculator ready.')),
    actions: [{ label: 'Not now', value: false }, { label: 'Start', value: true, kind: 'primary' }],
  });
  if (!ok) return;
  try {
    const pack = await loadLibraryPack(entry.libraryId);
    const id = await startAttempt(pack.packId);
    go(`#/sit/${id}`);
  } catch (e) {
    toast(e.message, 'bad');
  }
}

async function renderPapers() {
  const p = await getProgress();
  let papers = [];
  let err = null;
  try { papers = await libraryPapers(); } catch (e) { err = e.message; }
  const used = new Map(p.realPapersUsed.map((r) => [r.id, r]));
  const bySeries = new Map();
  for (const x of papers) {
    if (!bySeries.has(x.series)) bySeries.set(x.series, []);
    bySeries.get(x.series).push(x);
  }
  const nextUnused = papers.find((x) => !used.has(x.libraryId));
  const cacheAll = async (btn) => {
    btn.disabled = true;
    let n = 0;
    for (const x of papers) {
      try { await fetch(`library/${x.file}`); n++; btn.textContent = `Saving ${n}/${papers.length}…`; } catch { /* keep going */ }
    }
    btn.textContent = `Saved ${n} papers for offline use`;
  };
  app.replaceChildren(shell('papers',
    h('p', { class: 'eyebrow' }, 'Past Paper Library'),
    h('h1', { class: 'display' }, 'Real AQA papers'),
    h('p', { class: 'sub' }, 'Every paper is 80 marks and 1 hour 30 minutes. Your tutor works through them oldest-unused first and never repeats one until all are used.'),
    err ? h('p', { class: 'form-error' }, err) : null,
    nextUnused ? h('div', { class: 'card next-paper' },
      h('span', { class: 'eyebrow' }, 'Next unused paper'),
      h('strong', null, `${nextUnused.series} · Paper ${nextUnused.paper} · ${nextUnused.calculator ? 'Calculator' : 'Non-calculator'}`),
      h('button', { class: 'btn primary', onclick: () => confirmSitPaper(nextUnused) }, 'Sit this paper')) : null,
    ...[...bySeries.entries()].map(([series, list]) => h('section', { class: 'series' },
      h('h2', null, series),
      h('ul', { class: 'paper-list' }, list.map((x) => {
        const u = used.get(x.libraryId);
        return h('li', null, h('button', { class: `paper-row ${u ? 'used' : ''}`, onclick: () => confirmSitPaper(x) },
          h('span', { class: 'pnum mono' }, `P${x.paper}`),
          h('span', { class: 'pmeta' }, x.calculator ? 'Calculator' : 'Non-calculator', h('span', { class: 'fine' }, ` · ${x.questions} questions`)),
          h('span', { class: `pstate ${u ? 'done' : ''}` }, u ? (u.score != null ? `${u.score}/80` : 'Sat') : 'Unused')));
      })))),
    papers.length ? h('button', { class: 'btn ghost', onclick: (e) => cacheAll(e.currentTarget) }, 'Save all papers for offline use') : null));
}

// ---- Pack start ------------------------------------------------------------

async function renderPackStart(packId) {
  const pack = await getPack(packId);
  if (!pack) {
    app.replaceChildren(shell('today', h('p', { class: 'empty' }, 'That pack is not on this device. Import it again.')));
    return;
  }
  const m = pack.manifest;
  const attempts = (await db.byIndex('attempts', 'packId', packId)).sort((a, b) => a.attemptNo - b.attemptNo);
  const active = attempts.find((a) => a.status === 'active');
  const fbs = await db.byIndex('feedback', 'forPackId', packId);
  const { byCode } = await topicData();
  const topics = [...new Set(pack.questions.flatMap((q) => q.topics))];
  const badge = { real: 'Real AQA questions', generated: 'New practice questions', mixed: 'Real + new questions' }[m.source];

  const start = async () => {
    const id = await startAttempt(packId);
    go(`#/sit/${id}`);
  };
  app.replaceChildren(shell('today',
    h('p', { class: 'eyebrow' }, m.type === 'paper' ? 'Paper' : 'Lesson'),
    h('h1', { class: 'display' }, m.title),
    h('div', { class: 'chips' },
      h('span', { class: 'chip' }, badge),
      h('span', { class: 'chip' }, m.calculator ? 'Calculator' : 'Non-calculator'),
      h('span', { class: 'chip' }, m.timeLimitMins ? `${m.timeLimitMins} min timed` : 'Untimed')),
    h('dl', { class: 'facts' },
      h('div', null, h('dt', null, 'Questions'), h('dd', { class: 'mono' }, String(pack.questions.length))),
      h('div', null, h('dt', null, 'Marks'), h('dd', { class: 'mono' }, String(m.totalMarks))),
      h('div', null, h('dt', null, 'Sittings'), h('dd', { class: 'mono' }, String(attempts.length)))),
    m.intro ? h('div', { class: 'md lead', html: renderMarkdown(m.intro) }) : null,
    topics.length ? h('p', { class: 'fine' }, `Topics: ${topics.map((t) => byCode[t]?.name || t).join(' · ')}`) : null,
    h('div', { class: 'row' },
      active ? h('a', { class: 'btn primary', href: `#/sit/${active.id}` }, 'Continue') : h('button', { class: 'btn primary', onclick: start }, attempts.length ? 'Sit again' : m.timeLimitMins ? 'Start the clock' : 'Start')),
    attempts.filter((a) => a.status === 'submitted').length ? h('section', null, h('h2', null, 'Past sittings'),
      h('ul', { class: 'plain' }, attempts.filter((a) => a.status === 'submitted').map((a) => {
        const fb = fbs.find((f) => f.forAttemptId === a.id);
        return h('li', null, `Sitting ${a.attemptNo} · ${fmtDate(a.submittedAt)} · `,
          fb ? h('a', { href: `#/feedback/${fb.packId}` }, `${fb.feedback.score}/${fb.feedback.maxScore}`) : h('a', { href: `#/done/${a.id}` }, 'send results'));
      }))) : null,
    pack.warnings?.length ? h('details', { class: 'warnings' },
      h('summary', null, `${pack.warnings.length} problem${pack.warnings.length === 1 ? '' : 's'} found in this pack`),
      h('p', { class: 'fine' }, 'You can still sit it. Tell your tutor so the next pack is fixed.'),
      h('ul', { class: 'bullets' }, pack.warnings.map((w) => h('li', null, w)))) : null));
}

// ---- Progress (dashboard) ---------------------------------------------------

async function renderProgress() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  const cfg = await loadConfig();
  const p = await getProgress();
  const { data: topicMeta, byCode } = await topicData();
  const today = todayISO();
  const bySeries = Object.fromEntries(cfg.gradeBoundaries.series.map((s) => [s.series, s]));
  const chosen = bySeries[(await db.kvGet('boundarySeries')) || cfg.gradeBoundaries.default] || cfg.gradeBoundaries.series[0];
  const max = cfg.gradeBoundaries.maxMarks;
  const refs = ['6', '7', '8'].map((g) => ({ grade: g, pct: Math.round((chosen.grades[g] / max) * 1000) / 10 }));

  const paperScores = p.scores.filter((s) => s.type === 'paper' && s.maxScore > 0).sort((a, b) => (a.date < b.date ? -1 : 1));
  const points = paperScores.map((s) => ({ date: s.date, pct: Math.round((s.score / s.maxScore) * 1000) / 10, score: s.score, max: s.maxScore, label: s.title || s.packId }));
  const lastGE = [...p.gradeEstimates].sort((a, b) => (a.date < b.date ? -1 : 1)).pop();
  const target = p.student?.target || 6;

  const byDate = studySecsByDate(p);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((d) => ({ date: d, secs: byDate[d] || 0 }));
  const totalSecs = Object.values(byDate).reduce((a, b) => a + b, 0);

  const countdown = h('div', { class: 'countdowns' }, cfg.exam.papers.map((x) => {
    const d = daysTo(x.date);
    return h('div', { class: `count-tile ${d < 0 ? 'past' : ''}` },
      h('span', { class: 'eyebrow' }, `Paper ${x.paper} · ${x.calculator ? 'Calculator' : 'Non-calc'}`),
      h('span', { class: 'count-num mono' }, d < 0 ? 'Done' : String(d)),
      h('span', { class: 'fine' }, d < 0 ? fmtDate(x.date) : `days · ${fmtDate(x.date)}`));
  }));
  const p1 = cfg.exam.papers[0];
  const studyDaysLeft = Math.max(0, Math.round((daysTo(p1.date) * 6) / 7));

  const seriesSelect = h('select', { id: 'boundary-series', 'aria-label': 'Grade boundaries to compare against', onchange: async (e) => { await db.kvSet('boundarySeries', e.target.value); renderProgress(); } },
    cfg.gradeBoundaries.series.map((s) => h('option', { value: s.series, selected: s.series === chosen.series }, `${s.series} boundaries`)));

  // Heatmap
  const strands = Object.entries(topicMeta.strands);
  const heat = h('div', { class: 'heat' }, strands.map(([k, name]) => h('div', { class: 'heat-row' },
    h('h3', { class: 'heat-label' }, name),
    h('div', { class: 'heat-cells' }, topicMeta.topics.filter((t) => t.code[0] === k).map((t) => {
      const st = p.topics[t.code];
      const status = st?.status || 'none';
      const isDue = st?.nextDue && st.nextDue <= today;
      return h('button', {
        class: `cell s-${status} ${isDue ? 'due' : ''}`,
        'aria-label': `${t.code} ${t.name}: ${{ green: 'secure', amber: 'developing', red: 'weak', none: 'not practised yet' }[status]}${isDue ? ', due for review' : ''}`,
        onclick: () => topicSheet(t, st),
      }, h('span', { class: 'cell-code mono' }, t.code), h('span', { class: 'cell-glyph', 'aria-hidden': 'true' }, statusGlyph(status)));
    })))));
  const counts = { green: 0, amber: 0, red: 0 };
  for (const t of Object.values(p.topics)) if (counts[t.status] != null) counts[t.status]++;

  // Mistakes
  const mistakeFilter = (await db.kvGet('mistakeFilter')) || 'open';
  const mistakes = [...p.mistakes].sort((a, b) => (a.date < b.date ? 1 : -1)).filter((x) => (mistakeFilter === 'all' ? true : mistakeFilter === 'open' ? !x.resolved : x.type === mistakeFilter));
  const filterBtn = (id, label) => h('button', { class: `seg ${mistakeFilter === id ? 'on' : ''}`, 'aria-pressed': String(mistakeFilter === id), onclick: async () => { await db.kvSet('mistakeFilter', id); renderProgress(); } }, label);

  app.replaceChildren(shell('progress',
    h('p', { class: 'eyebrow' }, 'Progress'),
    h('h1', { class: 'display' }, lastGE ? `Working at grade ${lastGE.grade}` : 'No grade estimate yet'),
    h('p', { class: 'sub' }, lastGE ? `${lastGE.range ? `Range ${lastGE.range.join('–')} · ` : ''}estimated ${fmtDate(lastGE.date)} · target ${target}, stretch ${p.student?.stretch || 8}` : 'Your tutor estimates a grade each time it marks your work.'),
    countdown,
    h('p', { class: 'fine' }, `About ${studyDaysLeft} study days left before Paper 1 at 6 days a week.`),

    h('section', { class: 'card chart-card' },
      h('div', { class: 'chart-head' }, h('h2', null, 'Full paper scores'), seriesSelect),
      h('div', { class: 'chart-slot', dataset: { chart: 'score' } }),
      h('p', { class: 'fine' }, `Lines show the ${chosen.series} Higher boundaries as a percentage: grade 6 ${chosen.grades['6']}/240, grade 7 ${chosen.grades['7']}/240, grade 8 ${chosen.grades['8']}/240.`),
      points.length ? h('details', null, h('summary', null, 'Show as table'),
        h('div', { class: 'table-wrap' }, h('table', null,
          h('thead', null, h('tr', null, h('th', null, 'Date'), h('th', null, 'Paper'), h('th', { class: 'num' }, 'Score'), h('th', { class: 'num' }, '%'))),
          h('tbody', null, paperScores.map((s) => h('tr', null, h('td', null, fmtDate(s.date)), h('td', null, s.title || s.packId), h('td', { class: 'num mono' }, `${s.score}/${s.maxScore}`), h('td', { class: 'num mono' }, `${Math.round((s.score / s.maxScore) * 100)}%`))))))) : null),

    h('section', { class: 'card' },
      h('div', { class: 'chart-head' }, h('h2', null, 'Study time'),
        h('span', { class: 'fine mono' }, `Today ${fmtHours(byDate[today] || 0)} · streak ${streak(p)} · total ${fmtHours(totalSecs)}`)),
      h('div', { class: 'chart-slot', dataset: { chart: 'hours' } }),
      h('button', { class: 'btn ghost small', onclick: logStudy }, 'Log study done away from the app')),

    h('section', { class: 'card' },
      h('div', { class: 'chart-head' }, h('h2', null, 'Topics'),
        h('span', { class: 'fine mono' }, `${counts.green} secure · ${counts.amber} developing · ${counts.red} weak`)),
      h('div', { class: 'legend' },
        h('span', null, h('i', { class: 'sw s-green' }, '✓'), 'Secure (right on 3 separate days)'),
        h('span', null, h('i', { class: 'sw s-amber' }, '~'), 'Developing'),
        h('span', null, h('i', { class: 'sw s-red' }, '!'), 'Weak'),
        h('span', null, h('i', { class: 'sw s-none' }, '·'), 'Not practised'),
        h('span', null, h('i', { class: 'sw due' }), 'Due for review')),
      heat),

    h('section', { class: 'card' },
      h('div', { class: 'chart-head' }, h('h2', null, 'Mistake log'),
        h('div', { class: 'segs', role: 'group', 'aria-label': 'Filter mistakes' }, filterBtn('open', 'Open'), filterBtn('knowledge', 'Knowledge'), filterBtn('careless', 'Careless'), filterBtn('all', 'All'))),
      mistakes.length ? h('ul', { class: 'mistakes' }, mistakes.slice(0, 60).map((x) => h('li', { class: x.resolved ? 'resolved' : '' },
        h('span', { class: `chip ${x.type === 'careless' ? 'warn' : 'bad'}` }, x.type === 'careless' ? 'Careless' : 'Knowledge gap'),
        h('span', { class: 'm-topic mono' }, x.topic || ''),
        h('span', { class: 'm-note' }, x.note),
        h('span', { class: 'fine' }, `${fmtDate(x.date)}${x.resolved ? ' · fixed' : ''}`)))) : h('p', { class: 'empty' }, 'No mistakes logged yet. They appear here after marking.'))));

  const drawCharts = () => {
    for (const slot of app.querySelectorAll('.chart-slot')) {
      const w = Math.max(280, Math.round(slot.clientWidth));
      const narrow = w < 480;
      slot.replaceChildren(slot.dataset.chart === 'score'
        ? scoreChart(points, refs, { width: w, height: narrow ? 230 : 280 })
        : hoursChart(days, GOAL_SECS, { width: w, height: narrow ? 140 : 170 }));
    }
  };
  drawCharts();
  let t;
  const onResize = () => { clearTimeout(t); t = setTimeout(drawCharts, 150); };
  window.addEventListener('resize', onResize);
  cleanup = () => window.removeEventListener('resize', onResize);
}

async function topicSheet(t, st) {
  await sheet({
    title: `${t.code} · ${t.name}`,
    body: h('div', null,
      h('p', { class: 'fine' }, `${t.strand} · usually grade ${t.band}${t.higherOnly ? ' · Higher only' : ''}`),
      h('p', null, t.spec),
      st ? h('dl', { class: 'facts' },
        h('div', null, h('dt', null, 'Marks'), h('dd', { class: 'mono' }, `${st.marksAwarded || 0}/${st.marksAvailable || 0}`)),
        h('div', null, h('dt', null, 'Right on'), h('dd', { class: 'mono' }, `${(st.correctDates || []).length}/3 days`)),
        h('div', null, h('dt', null, 'Next review'), h('dd', { class: 'mono' }, st.nextDue ? fmtDate(st.nextDue) : '–'))) : h('p', { class: 'fine' }, 'Not practised yet.'),
      st?.note ? h('p', null, st.note) : null),
    actions: [{ label: 'Close', value: true, kind: 'primary' }],
  });
}

async function logStudy() {
  const input = h('input', { id: 'log-mins', type: 'number', min: '5', max: '300', step: '5', value: '30', inputmode: 'numeric' });
  const ok = await sheet({
    title: 'Log study time',
    body: h('div', null, h('p', null, 'For revision you did without the app today (textbook, videos, school).'), h('label', { for: 'log-mins' }, 'Minutes'), input),
    actions: [{ label: 'Cancel', value: false }, { label: 'Add', value: true, kind: 'primary' }],
  });
  if (!ok) return;
  const mins = Math.max(0, Math.min(300, Number(input.value) || 0));
  if (mins) {
    await addStudyTime({ secs: mins * 60 });
    toast(`Added ${mins} minutes`);
    renderProgress();
  }
}

// ---- More -------------------------------------------------------------------

async function renderMore() {
  const cfg = await loadConfig();
  let usage = '';
  try {
    const est = await navigator.storage?.estimate?.();
    const persisted = await navigator.storage?.persisted?.();
    if (est) usage = `${Math.round((est.usage || 0) / 1048576)} MB used on this device${persisted ? ' · protected from automatic clearing' : ''}`;
  } catch { /* not supported */ }
  const restoreInput = h('input', { type: 'file', accept: '.zip', hidden: true, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); } });
  app.replaceChildren(shell('more',
    h('p', { class: 'eyebrow' }, 'More'),
    h('h1', { class: 'display' }, 'Settings and backup'),
    h('section', { class: 'card' },
      h('h2', null, 'Backup'),
      h('p', null, 'Your progress lives only on this device. Save a backup every few days and after every paper (to Files, Google Drive or iCloud).'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: async () => { const b = await exportBackup(); downloadBlob(b.blob, b.name); toast('Backup saved'); } }, 'Save full backup'),
        h('button', { class: 'btn ghost', onclick: () => restoreInput.click() }, 'Restore a backup'), restoreInput),
      usage ? h('p', { class: 'fine' }, usage) : null),
    h('section', { class: 'card' },
      h('h2', null, 'Exam'),
      h('ul', { class: 'plain' }, cfg.exam.papers.map((x) => h('li', null, `Paper ${x.paper} (${x.code}) · ${fmtDate(x.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${x.start} · ${x.calculator ? 'Calculator' : 'Non-calculator'}`))),
      h('p', { class: 'fine' }, cfg.exam.checkNote)),
    h('section', { class: 'card' },
      h('h2', null, 'Grade boundaries (Higher, out of 240)'),
      h('div', { class: 'table-wrap' }, h('table', null,
        h('thead', null, h('tr', null, h('th', null, 'Series'), ...['9', '8', '7', '6', '5', '4', '3'].map((g) => h('th', { class: 'num' }, g)))),
        h('tbody', null, cfg.gradeBoundaries.series.map((s) => h('tr', null, h('td', null, s.series), ...['9', '8', '7', '6', '5', '4', '3'].map((g) => h('td', { class: 'num mono' }, String(s.grades[g] ?? '–')))))))),
      h('p', { class: 'fine' }, cfg.gradeBoundaries.checkNote)),
    h('section', { class: 'card' },
      h('h2', null, 'Lock'),
      h('p', null, 'Lock the app on this device. You will need the passcode again.'),
      h('button', { class: 'btn ghost', onclick: async () => { await lock(); route(); } }, 'Lock now')),
    h('section', { class: 'card danger-zone' },
      h('h2', null, 'Start again'),
      h('p', null, 'Deletes every pack, answer, photo and all progress on this device. Save a backup first.'),
      h('button', { class: 'btn danger-outline', onclick: resetAll }, 'Delete everything')),
    h('p', { class: 'fine mono' }, `Build ${window.__BUILD__ || 'dev'}`)));
}

async function resetAll() {
  const input = h('input', { id: 'confirm-reset', autocomplete: 'off', placeholder: 'delete' });
  const ok = await sheet({ title: 'Delete everything?', body: h('div', null, h('p', null, 'Type delete to confirm.'), input), actions: [{ label: 'Cancel', value: false }, { label: 'Delete everything', value: true, kind: 'danger' }] });
  if (!ok || input.value.trim().toLowerCase() !== 'delete') return;
  const key = await db.kvGet('libkey');
  await db.wipeAll();
  if (key) await db.kvSet('libkey', key);
  location.hash = '#/today';
  location.reload();
}

// ---- Router -----------------------------------------------------------------

async function route() {
  if (cleanup) {
    const c = cleanup;
    cleanup = null;
    await c();
  }
  if (!(await restore())) {
    renderLock();
    return;
  }
  const [, view, arg] = (location.hash || '#/today').split('/');
  try {
    switch (view) {
      case 'papers': await renderPapers(); break;
      case 'progress': await renderProgress(); break;
      case 'more': await renderMore(); break;
      case 'pack': await renderPackStart(decodeURIComponent(arg)); break;
      case 'sit': cleanup = await renderSit(app, decodeURIComponent(arg), go); break;
      case 'done': app.replaceChildren(h('div', { class: 'shell' }, h('div', { class: 'page', id: 'done' }))); await renderDone($('#done'), decodeURIComponent(arg), go); break;
      case 'feedback': app.replaceChildren(shell('today', h('div', { id: 'fb' }))); await renderFeedback($('#fb'), decodeURIComponent(arg), go); break;
      default: await renderToday();
    }
  } catch (e) {
    console.error(e);
    app.replaceChildren(shell('today', h('p', { class: 'form-error' }, `Something went wrong: ${e.message}`)));
  }
  if (!['sit'].includes(view)) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// Test hook: lets the end-to-end test feed a zip without a file picker.
window.__importFile = importFile;
