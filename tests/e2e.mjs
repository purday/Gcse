// End-to-end test of the whole loop in Chromium at phone size.
//
//   node tests/e2e.mjs            synthetic TEST library (no AQA content needed)
//   node tests/e2e.mjs --library  also open every paper in the REAL library (app/library,
//                                 passcode from .passcode) and check each renders and totals 80
//
// Screenshots and downloaded zips land in test-output/.

import { chromium } from 'playwright';
import JSZip from 'jszip';
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { start } from '../tools/serve.mjs';

const OUT = 'test-output';
const PASS = 'test-pass';
const PORT = 8199;
const REAL = process.argv.includes('--library');
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`);
  if (!cond) failures++;
};
const step = (s) => console.log(`\n▸ ${s}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('app', `${OUT}/site`, { recursive: true });
execFileSync('python3', ['tests/fixtures.py', OUT, PASS], { stdio: 'inherit' });
const server = await start(`${OUT}/site`, PORT);
const URL = `http://localhost:${PORT}/`;
const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()));
  return { ctx, page };
}

async function unlock(page, pass = PASS) {
  await page.goto(URL);
  await page.waitForSelector('#passcode');
  await page.fill('#passcode', pass);
  await page.click('button[type=submit]');
  await page.waitForSelector('#import-btn');
}

async function importZip(page, path) {
  await page.goto(`${URL}#/today`);
  await page.waitForSelector('#import-btn');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#import-btn')]);
  await chooser.setFiles(path);
}

async function sheetClick(page, label) {
  await page.waitForSelector('.sheet');
  await page.click(`.sheet-actions >> text="${label}"`);
}

async function download(page, action) {
  const [dl] = await Promise.all([page.waitForEvent('download'), action()]);
  const path = `${OUT}/${dl.suggestedFilename()}`;
  await dl.saveAs(path);
  return path;
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

// -----------------------------------------------------------------------------
const { ctx, page } = await newPage();

step('Passcode');
await page.goto(URL);
await page.waitForSelector('#passcode');
await page.fill('#passcode', 'not it');
await page.click('button[type=submit]');
await page.waitForFunction(() => document.querySelector('.form-error')?.textContent);
ok((await page.textContent('.form-error')).includes('not right'), 'wrong passcode is refused');
await page.fill('#passcode', '  Test Pass ');
await page.click('button[type=submit]');
await page.waitForSelector('#import-btn');
ok(true, 'passcode accepted (case and spaces ignored)');
const robots = await page.getAttribute('meta[name=robots]', 'content');
ok(robots.includes('noindex') && robots.includes('nofollow'), 'page has noindex, nofollow');
await shot(page, '01-today');

step('Open a library paper');
await page.click('a[href="#/papers"]');
await page.waitForSelector('.paper-row');
ok((await page.$$('.paper-row')).length === 2, 'library lists both TEST papers');
await shot(page, '02-papers');
await page.click('.next-paper .btn');
await sheetClick(page, 'Start');
await page.waitForSelector('.qcard');
const timer = await page.textContent('.timer');
ok(/^1:(30|29):\d\d$/.test(timer.trim()), `countdown starts at 1:30:00 (${timer.trim()})`);
ok((await page.$$('.qcard .fig-btn img')).length >= 1, 'question shows its cropped image');
ok((await page.textContent('.q-marks')).includes('[2 marks]'), 'marks shown AQA-style');

step('Answer: typed answer, photo of working, flag');
await page.fill('#answer', 'x = ±2');
await page.click('.sit-foot .btn.primary');
await page.waitForSelector('.qnum >> text="1.2"');
await page.setInputFiles('input[capture]', `${OUT}/working-photo.jpg`);
await page.waitForSelector('.thumb img');
ok(true, 'photo attached and thumbnail shown');
await page.fill('#answer', '5.2');
await page.click('.sit-foot .btn.primary');
await page.waitForSelector('.qnum >> text="2.1"');
await page.click('.sit-foot >> text="Flag"');
ok((await page.textContent('.sit-foot .btn.on')).includes('Flagged'), 'question flagged');
await shot(page, '03-sitting');

step('Autosave survives a reload');
await page.waitForTimeout(600);
await page.reload();
await page.waitForSelector('.qcard');
ok((await page.textContent('.qnum')).trim() === '2.1', 'reopens on the same question');
await page.click('.sit-foot >> text="Previous"');
await page.waitForSelector('.qnum >> text="1.2"');
ok((await page.inputValue('#answer')) === '5.2', 'typed answer restored');
ok(!!(await page.waitForSelector('.thumb img', { timeout: 3000 }).catch(() => null)) && (await page.$$('.thumb img')).length === 1, 'photo restored');
await page.waitForTimeout(3500); // let the clock run so study time is recorded

step('Navigator and finish');
await page.click('.nav-toggle');
ok((await page.$$('.nav-chip')).length === 24, 'navigator shows 24 parts');
ok((await page.$$('.nav-chip.answered')).length === 2, 'two answered');
ok((await page.$$('.nav-chip.flagged')).length === 1, 'one flagged');
await shot(page, '04-navigator');
await page.click('.nav-pane >> text="Finish paper"');
await sheetClick(page, 'Finish and send');
await page.waitForSelector('text=Send it to your tutor');
await shot(page, '05-done');

step('Results zip');
const resultsPath = await download(page, () => page.click('button:has-text("Send to tutor")'));
ok(/results_test-2019-06-1h_\d{4}-\d{2}-\d{2}\.zip$/.test(resultsPath), `file name ${resultsPath.split('/').pop()}`);
const rz = await JSZip.loadAsync(readFileSync(resultsPath));
const src = await JSZip.loadAsync(readFileSync(`${OUT}/library_src/test-2019-06-1h.zip`));
for (const f of ['manifest.json', 'questions.json', 'markscheme.json']) {
  const a = await rz.file(f)?.async('uint8array');
  const b = await src.file(f).async('uint8array');
  ok(a && Buffer.from(a).equals(Buffer.from(b)), `${f} copied byte-for-byte`);
}
const results = JSON.parse(await rz.file('results.json').async('string'));
ok(results.answers.length === 24, 'results.json has all 24 answers');
const a11 = results.answers.find((x) => x.questionId === 'q1.1');
const a12 = results.answers.find((x) => x.questionId === 'q1.2');
const a21 = results.answers.find((x) => x.questionId === 'q2.1');
ok(a11.typedAnswer === 'x = ±2' && !a11.skipped, 'typed answer recorded');
ok(a12.photos.length === 1 && a12.photos[0] === 'photos/q1.2-1.jpg' && rz.file(a12.photos[0]), 'photo included at photos/q1.2-1.jpg');
ok(a21.flagged && a21.skipped, 'flagged + skipped recorded');
ok(results.submitReason === 'finished' && results.timeLimitMins === 90, 'submitReason and time limit recorded');
ok(typeof a11.timeSpentSecs === 'number', 'timeSpentSecs recorded');
const photoBytes = await rz.file('photos/q1.2-1.jpg').async('nodebuffer');
writeFileSync(`${OUT}/photo-check.jpg`, photoBytes);
const dims = execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${OUT}/photo-check.jpg'); print(im.format, *im.size)`]).toString().trim().split(' ');
ok(dims[0] === 'JPEG' && Math.max(+dims[1], +dims[2]) === 1200, `photo compressed to JPEG ${dims[1]}x${dims[2]} (from 3024x4032, ${Math.round(photoBytes.length / 1024)} KB)`);
const prog = JSON.parse(await rz.file('progress.json').async('string'));
ok(prog.realPapersUsed.some((r) => r.id === 'test-2019-06-1h'), 'progress.json marks the real paper as used');
const qbWrapped = JSON.parse(await rz.file('reference/questionbank.json').async('string'));
const qbInZip = JSON.parse(Buffer.from(qbWrapped.data, 'base64').toString('utf8'));
ok(qbWrapped.encoding === 'base64', 'question bank in the zip is base64-wrapped like mark schemes');
ok(qbInZip.questions.length === 48 && rz.file('reference/topics.json') && rz.file('reference/exam.json') && rz.file('reference/topicmap.json'), 'reference/ has question bank (decrypted), topics, topic map and exam config');
ok(results.activeSecs >= 3, `active time recorded (${results.activeSecs}s)`);
ok(prog.attempts.length === 1 && prog.sessions.length >= 1 && prog.sessions[0].secs >= 3, 'progress.json has the attempt and its study session');

step('Import feedback with /next/');
await importZip(page, `${OUT}/feedback-for-paper.zip`);
await page.waitForSelector('.score-hero');
const fbzip = await JSZip.loadAsync(readFileSync(`${OUT}/feedback-for-paper.zip`));
const fb = JSON.parse(await fbzip.file('feedback.json').async('string'));
ok((await page.textContent('.score .big')).trim() === String(fb.score), `score ${fb.score}/80 shown`);
ok((await page.textContent('.grade-num')).trim() === '7', 'grade estimate shown');
ok((await page.$$('.fb-q')).length === 24, 'per-question marks shown');
ok((await page.$$('.lost')).length > 0 && (await page.textContent('.lost .chip')).match(/Knowledge gap|Careless/), 'lost-mark reasons with type shown');
ok((await page.$$('.your-answer .thumb-img')).length === 1, 'his photo shown beside the marks');
await shot(page, '06-feedback');

step('Start next lesson');
await page.click('button:has-text("Start next lesson")');
await page.waitForSelector('.qcard');
ok((await page.textContent('.sit-name')).includes('Completing the square'), 'next lesson opened');
ok(!(await page.$('.sit-bar .btn >> text="Pause"')), 'lesson is untimed (no pause/countdown)');
ok((await page.$$('.worked')).length === 1, 'worked example shown');
await page.fill('#answer', '(x - 3)^2 - 4');
await shot(page, '07-next-lesson');
await page.click('.sit-bar >> text="Exit"');
await page.waitForSelector('.card.continue');
ok(true, 'Today shows Continue card');

step('Dashboard');
await page.click('a[href="#/progress"]');
await page.waitForSelector('.heat');
ok((await page.$$('.viz-dot')).length === 1, 'score chart has the paper');
ok((await page.$$('.viz-ref')).length >= 3, 'grade 6/7/8 boundary lines drawn');
ok((await page.$$('.cell.s-green, .cell.s-amber, .cell.s-red')).length >= 2, 'topic heatmap coloured');
ok((await page.$$('.mistakes li')).length > 0, 'mistake log filled');
ok((await page.$$('.count-tile')).length === 3, 'three paper countdowns');
await shot(page, '08-progress');
await page.click('a[href="#/papers"]');
await page.waitForSelector('.paper-row.used');
ok((await page.textContent('.paper-row.used .pstate')).includes(`${fb.score}/80`), 'library shows paper as used with score');

step('Tutor round trip (tutor/gcse_tutor.py marks the real results zip)');
execFileSync('python3', ['tests/tutor_roundtrip.py', resultsPath, `${OUT}/tutor-feedback.zip`], { stdio: 'inherit' });
await importZip(page, `${OUT}/tutor-feedback.zip`);
await page.waitForSelector('.score-hero');
ok((await page.textContent('.score .big')).trim() === '2', 'tutor feedback imported (2/80)');
const progAfter = await page.evaluate(async () => (await import('./js/progress.js')).getProgress());
ok(progAfter.bankQuestionsUsed?.length === 3 && progAfter.topics.A18?.note === 'roundtrip', `tutor progress.json applied (${progAfter.updatedBy === 'tutor' ? 'replaced' : 'merged'}: bank questions and topic notes from the tutor)`);
ok(progAfter.sessions.length >= 1 && progAfter.attempts.length >= 2, 'local study sessions and attempts kept by the merge');
await page.click('button:has-text("Start next lesson")');
await page.waitForSelector('.qcard');
ok((await page.textContent('.sit-name')).includes('Roundtrip'), 'tutor-built next lesson opened');
await page.waitForSelector('figcaption >> text="Original AQA question"');
ok(true, 'real question shows the original cropped image via libraryRef');
await shot(page, '08b-libraryref');
await page.click('.sit-bar >> text="Exit"');
await page.waitForSelector('#import-btn');

step('Backup, wipe, restore');
await page.click('a[href="#/more"]');
await page.waitForSelector('text=Save full backup');
const backupPath = await download(page, () => page.click('button:has-text("Save full backup")'));
ok(/gcse-backup-\d{4}-\d{2}-\d{2}\.zip$/.test(backupPath), 'backup downloaded');
await page.click('button:has-text("Delete everything")');
await page.fill('#confirm-reset', 'delete');
await Promise.all([page.waitForEvent('load'), sheetClick(page, 'Delete everything')]);
await page.waitForSelector('#import-btn');
await page.click('a[href="#/progress"]');
await page.waitForSelector('.heat');
ok((await page.$$('.viz-dot')).length === 0, 'progress wiped');
await importZip(page, backupPath);
await Promise.all([page.waitForEvent('load'), sheetClick(page, 'Restore')]);
await page.waitForSelector('#import-btn');
await page.click('a[href="#/progress"]');
await page.waitForSelector('.heat');
ok((await page.$$('.viz-dot')).length >= 1, 'progress restored from backup');

step('Bad pack is rejected with reasons');
const bad = new JSZip();
bad.file('manifest.json', JSON.stringify({ formatVersion: 1, type: 'lesson', source: 'generated', title: 'x', totalMarks: 1 }));
writeFileSync(`${OUT}/bad.zip`, await bad.generateAsync({ type: 'nodebuffer' }));
await importZip(page, `${OUT}/bad.zip`);
await page.waitForSelector('.sheet');
ok((await page.textContent('.sheet')).includes('packId'), 'error names the problem');
await sheetClick(page, 'OK');

step('Offline');
await page.goto(`${URL}#/today`);
await page.waitForSelector('#import-btn');
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(500);
await ctx.setOffline(true);
await page.reload();
await page.waitForSelector('#import-btn', { timeout: 8000 });
ok(true, 'app loads with no network');
await page.click('a[href="#/papers"]');
await page.waitForSelector('.paper-row');
ok(true, 'library index available offline');
await ctx.setOffline(false);
ok(page.errors.length === 0, `no page errors (${page.errors.join(' | ') || 'none'})`);
await ctx.close();

step('Timed paper auto-submits at zero');
{
  const { ctx: c2, page: p2 } = await newPage();
  await p2.clock.install();
  await unlock(p2);
  await importZip(p2, 'samples/sample-timed.zip');
  await p2.waitForSelector('text=Start the clock');
  await p2.click('text=Start the clock');
  await p2.waitForSelector('.timer');
  await p2.fill('#answer', '17/12');
  await p2.clock.runFor(60000);
  const t = (await p2.textContent('.timer')).trim();
  ok(/^(1:00|0:59|1:01)$/.test(t), `countdown runs (${t} left after one minute)`);
  ok(!!(await p2.$('.timer.crit')), 'timer is red in the last 5 minutes');
  await p2.clock.runFor(65000);
  await p2.waitForSelector('text=Time is up', { timeout: 5000 });
  ok(true, 'auto-submitted when time ran out');
  const rp = await download(p2, () => p2.click('button:has-text("Download zip")'));
  const r2 = JSON.parse(await (await JSZip.loadAsync(readFileSync(rp))).file('results.json').async('string'));
  ok(r2.submitReason === 'time-up' && r2.answers[0].typedAnswer === '17/12', 'results say time-up and keep the answer');
  await c2.close();
}

step('Desktop layout');
{
  const { ctx: c3, page: p3 } = await newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  await unlock(p3);
  await importZip(p3, 'samples/sample-lesson.zip');
  await p3.click('text=Start');
  await p3.waitForSelector('.qcard');
  ok(await p3.isVisible('.nav-pane'), 'navigator is a sidebar on wide screens');
  await shot(p3, '09-desktop-sitting');
  await c3.close();
}

if (REAL) {
  step('Real library: every paper opens and totals 80');
  const passcode = readFileSync('.passcode', 'utf8').trim();
  const realServer = await start('app', PORT + 1);
  const { ctx: c4, page: p4 } = await newPage();
  await p4.goto(`http://localhost:${PORT + 1}/`);
  await p4.waitForSelector('#passcode');
  await p4.fill('#passcode', passcode);
  await p4.click('button[type=submit]');
  await p4.waitForSelector('#import-btn');
  const report = await p4.evaluate(async () => {
    const m = await import('./js/pack.js');
    const papers = await m.libraryPapers();
    const out = [];
    for (const paper of papers) {
      const r = { id: paper.libraryId, problems: [] };
      try {
        const pack = await m.loadLibraryPack(paper.libraryId);
        const total = pack.questions.reduce((s, q) => s + q.marks, 0);
        if (total !== 80) r.problems.push(`marks total ${total}`);
        if (pack.manifest.totalMarks !== 80) r.problems.push(`manifest totalMarks ${pack.manifest.totalMarks}`);
        for (const q of pack.questions) {
          for (const name of [q.image, q.stemImage].filter(Boolean)) {
            const b = pack.images[name];
            if (!b) r.problems.push(`${q.id}: missing ${name}`);
            else {
              try { const bmp = await createImageBitmap(b); if (bmp.width < 50) r.problems.push(`${q.id}: tiny image`); } catch { r.problems.push(`${q.id}: image does not decode`); }
            }
          }
        }
        r.questions = pack.questions.length;
      } catch (e) {
        r.problems.push(e.message);
      }
      out.push(r);
    }
    return out;
  });
  for (const r of report) ok(!r.problems.length, `${r.id} (${r.questions ?? '?'} parts)${r.problems.length ? `: ${r.problems.join('; ')}` : ''}`);
  // Open each paper in the real sitting screen and step through every question.
  for (const r of report) {
    await p4.goto(`http://localhost:${PORT + 1}/#/papers`);
    const id = await p4.evaluate(async (lib) => (await import('./js/sit.js')).startAttempt(lib), r.id);
    await p4.goto(`http://localhost:${PORT + 1}/#/sit/${id}`);
    await p4.waitForSelector('.qcard');
    let missing = 0;
    for (let i = 0; i < (r.questions || 0); i++) {
      missing += (await p4.$$('.img-missing')).length;
      if (i < r.questions - 1) {
        await p4.click('.sit-foot .btn.primary');
        await p4.waitForFunction((n) => document.querySelector('.nav-toggle')?.textContent.startsWith(`Q ${n}/`), i + 2);
      }
    }
    ok(missing === 0, `${r.id}: all ${r.questions} questions render in the player`);
  }
  ok(p4.errors.length === 0, `no page errors on real papers (${p4.errors.slice(0, 3).join(' | ') || 'none'})`);
  await c4.close();
  realServer.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
