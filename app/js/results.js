// Building the results zip (FORMAT.md section 2) and the "send to tutor" screen.

import * as db from './db.js';
import { h, todayISO, fmtClock, shareOrDownload, downloadBlob, toast, fmtDate } from './util.js';
import { getPack } from './pack.js';
import { getProgress } from './progress.js';

export async function buildResults(attemptId) {
  const att = await db.get('attempts', attemptId);
  const pack = await getPack(att.packId);
  const zip = new window.JSZip();
  zip.file('manifest.json', pack.raw.manifest);
  if (pack.raw.questions) zip.file('questions.json', pack.raw.questions);
  if (pack.raw.markscheme) zip.file('markscheme.json', pack.raw.markscheme);

  const answers = [];
  for (const q of pack.questions) {
    const a = att.answers[q.id] || { typed: '', photos: [], timeSpentSecs: 0, flagged: false };
    const paths = [];
    for (const [i, pid] of a.photos.entries()) {
      const rec = await db.get('photos', pid);
      if (!rec) continue;
      const path = `photos/${q.id}-${i + 1}.jpg`;
      zip.file(path, rec.blob);
      paths.push(path);
    }
    answers.push({
      questionId: q.id,
      typedAnswer: a.typed,
      photos: paths,
      timeSpentSecs: Math.round(a.timeSpentSecs),
      flagged: !!a.flagged,
      skipped: !a.typed.trim() && !paths.length,
    });
  }
  const results = {
    formatVersion: 1,
    packId: att.packId,
    attemptId: att.id,
    attemptNo: att.attemptNo,
    startedAt: att.startedAt,
    submittedAt: att.submittedAt,
    submitReason: att.submitReason,
    timeLimitMins: att.timeLimitMins,
    activeSecs: Math.round(att.activeSecs),
    pausedCount: att.pausedCount,
    answers,
  };
  zip.file('results.json', JSON.stringify(results, null, 2));
  zip.file('progress.json', JSON.stringify(await getProgress(), null, 2));

  const date = (att.submittedAt || '').slice(0, 10) || todayISO();
  const name = `results_${att.packId}_${date}.zip`;
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE' });
  att.results = { name, blob, builtAt: new Date().toISOString() };
  await db.put('attempts', att);
  return att.results;
}

export async function renderDone(root, attemptId, go) {
  const att = await db.get('attempts', attemptId);
  if (!att) {
    root.replaceChildren(h('p', { class: 'empty' }, 'That sitting was not found.'));
    return;
  }
  const pack = await getPack(att.packId);
  let res = att.results;
  if (!res) res = await buildResults(att.id);
  const qs = pack.questions;
  const answered = qs.filter((q) => {
    const a = att.answers[q.id];
    return a && (a.typed.trim() || a.photos.length);
  }).length;
  const photos = qs.reduce((n, q) => n + (att.answers[q.id]?.photos.length || 0), 0);
  const sizeKb = Math.round(res.blob.size / 1024);

  const share = async () => {
    const r = await shareOrDownload(res.blob, res.name, `Results for ${pack.manifest.title}`);
    if (r === 'downloaded') toast('Saved to your downloads. Attach it in your Claude Project chat.');
    if (r === 'shared') toast('Sent. Now ask the tutor to mark it.');
  };

  root.replaceChildren(h('div', { class: 'page narrow' },
    h('p', { class: 'eyebrow' }, att.submitReason === 'time-up' ? 'Time is up' : 'Submitted'),
    h('h1', { class: 'display' }, pack.manifest.title),
    h('dl', { class: 'facts' },
      h('div', null, h('dt', null, 'Answered'), h('dd', { class: 'mono' }, `${answered} / ${qs.length}`)),
      h('div', null, h('dt', null, 'Photos'), h('dd', { class: 'mono' }, String(photos))),
      h('div', null, h('dt', null, 'Time'), h('dd', { class: 'mono' }, fmtClock(att.activeSecs))),
      h('div', null, h('dt', null, 'Marks available'), h('dd', { class: 'mono' }, String(pack.manifest.totalMarks)))),
    h('section', { class: 'card send' },
      h('h2', null, 'Send it to your tutor'),
      h('ol', { class: 'steps' },
        h('li', null, 'Tap ', h('strong', null, 'Send to tutor'), ' and choose the Claude app.'),
        h('li', null, 'Open your GCSE Maths project, start a chat, attach the zip if it is not attached already.'),
        h('li', null, 'Send: ', h('q', null, 'Mark this.'), ' The tutor replies with a feedback zip.'),
        h('li', null, 'Come back here and tap ', h('strong', null, 'Import pack'), ' to open the feedback.')),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: share }, 'Send to tutor'),
        h('button', { class: 'btn ghost', onclick: () => downloadBlob(res.blob, res.name) }, 'Download zip')),
      h('p', { class: 'fine mono' }, `${res.name} · ${sizeKb} KB`)),
    h('button', { class: 'btn ghost', onclick: () => go('#/today') }, 'Back to Today')));
}

export async function awaitingFeedback() {
  const [atts, fbs] = await Promise.all([db.all('attempts'), db.all('feedback')]);
  const marked = new Set(fbs.map((f) => f.forAttemptId || `${f.forPackId}`));
  return atts
    .filter((a) => a.status === 'submitted' && !marked.has(a.id) && !marked.has(a.packId))
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export function submittedLabel(att) {
  return `Sent ${fmtDate(att.submittedAt)}`;
}
