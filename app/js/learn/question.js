// One auto-marked question: check, hints, retry, step-by-step solution and
// "try another like this". Records the result once per question instance.

import { h } from '../util.js';
import { renderMarkdown } from '../md.js';
import { rng } from './engine.js';
import { check } from './check.js';
import { recordAttempt } from './record.js';

const SYMBOLS = ['√', 'π', '^', '²', '/', '(', ')', '≤', '≥', '−', '°', ':'];

export function newSeed() {
  return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
}

export function generate(lesson, templateId, seed) {
  const t = lesson.templates[templateId];
  if (!t) throw new Error(`Missing template ${templateId} in ${lesson.id}`);
  const inst = t.gen(rng(seed));
  return { ...inst, marks: inst.marks ?? t.marks ?? 1, level: t.level ?? 1 };
}

function md(src) {
  return h('div', { class: 'md', html: renderMarkdown(src) });
}

function figure(svg) {
  return svg ? h('div', { class: 'learn-fig', html: svg }) : null;
}

// opts: { lesson, templateId, seed?, mode, label, onResolved(result), onAnother?(), exam? }
export function questionCard(opts) {
  const { lesson, templateId, mode = 'lesson', label = '', exam = false } = opts;
  const seed = opts.seed ?? newSeed();
  const inst = generate(lesson, templateId, seed);
  const spec = inst.a;
  let attempts = 0;
  let helped = false;
  let revealed = false;
  let recorded = false;
  let finished = false;

  const record = async (solved) => {
    if (recorded) return;
    recorded = true;
    await recordAttempt({ lesson, templateId, seed, marks: inst.marks, firstTry: attempts === 0 && solved, helped, solved, revealed, mode });
  };

  // ---- inputs
  let inputs = [];
  let choiceValue = null;
  let inputArea;
  if (spec.kind === 'multi') {
    inputs = spec.parts.map((p, i) => h('input', { type: 'text', id: `ans-${i}`, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', placeholder: p.placeholder || '' }));
    inputArea = h('div', { class: 'multi-inputs' }, spec.parts.map((p, i) => h('label', { class: 'multi-row' }, h('span', { class: 'md', html: renderMarkdown(p.label) }), inputs[i])));
  } else if (spec.kind === 'choice') {
    inputArea = h('div', { class: 'choices', role: 'radiogroup' }, spec.options.map((o, i) => {
      const b = h('button', { class: 'choice', role: 'radio', 'aria-checked': 'false', type: 'button', html: renderMarkdown(o).replace(/^<p>|<\/p>\s*$/g, '') });
      b.addEventListener('click', () => {
        choiceValue = i;
        for (const el of inputArea.children) el.setAttribute('aria-checked', String(el === b));
      });
      return b;
    }));
  } else {
    inputs = [h('input', { type: 'text', id: 'learn-answer', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', placeholder: inst.placeholder || 'Your answer', 'aria-label': 'Your answer' })];
    inputArea = inputs[0];
  }
  let lastFocused = inputs[0];
  inputs.forEach((el) => {
    el.addEventListener('focus', () => { lastFocused = el; });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doCheck(); } });
  });
  const symbols = inputs.length ? h('div', { class: 'symbols', role: 'toolbar', 'aria-label': 'Maths symbols' }, SYMBOLS.map((s) => h('button', {
    class: 'sym', type: 'button', tabindex: '-1', onmousedown: (e) => e.preventDefault(),
    onclick: () => {
      const el = lastFocused || inputs[0];
      const ins = s === '²' ? '^2' : s === '−' ? '-' : s;
      const st = el.selectionStart ?? el.value.length;
      el.setRangeText(ins, st, el.selectionEnd ?? st, 'end');
      el.focus();
    },
  }, s))) : null;

  const feedback = h('div', { class: 'learn-feedback', 'aria-live': 'polite' });
  const hintBox = h('div', { class: 'hint-box' });
  const stepsBox = h('div', { class: 'steps-box' });
  const checkBtn = h('button', { class: 'btn primary', type: 'button' }, 'Check');
  const hintBtn = h('button', { class: 'btn ghost small', type: 'button' }, `Hint (${inst.hints?.length || 0})`);
  const stepsBtn = h('button', { class: 'btn ghost small', type: 'button', hidden: true }, 'Show me step by step');
  const actions = h('div', { class: 'row learn-actions' }, checkBtn, inst.hints?.length ? hintBtn : null, stepsBtn);
  const after = h('div', { class: 'row learn-after' });

  const values = () => (spec.kind === 'multi' ? inputs.map((i) => i.value) : spec.kind === 'choice' ? choiceValue : inputs[0].value);

  function finish(kind) {
    finished = true;
    opts.onFinish?.(kind);
    checkBtn.disabled = true;
    inputs.forEach((i) => { i.readOnly = true; });
    hintBtn.hidden = true;
    stepsBtn.hidden = true;
    after.replaceChildren(
      opts.onAnother ? h('button', { class: `btn ${kind === 'revealed' || attempts ? 'primary' : 'ghost'}`, type: 'button', onclick: () => opts.onAnother() }, 'Try another like this') : null,
      h('button', { class: `btn ${kind === 'revealed' || attempts ? 'ghost' : 'primary'}`, type: 'button', onclick: () => opts.onResolved?.({ clean: kind === 'clean', kind }) }, opts.nextLabel || 'Next'));
  }

  async function doCheck() {
    if (finished) return;
    const v = values();
    if (v == null || (Array.isArray(v) ? v.every((x) => !String(x).trim()) : !String(v).trim())) {
      feedback.replaceChildren(h('p', { class: 'fb-msg' }, spec.kind === 'choice' ? 'Choose an answer first.' : 'Type an answer first.'));
      return;
    }
    const res = check(v, spec);
    if (!res.ok && !res.msg && inst.diagnose) res.msg = inst.diagnose(v);
    if (spec.kind === 'multi') inputs.forEach((el, i) => el.classList.toggle('wrong', !res.parts[i].ok));
    else inputs.forEach((el) => el.classList.toggle('wrong', !res.ok));
    if (res.ok) {
      const clean = attempts === 0 && !helped;
      feedback.replaceChildren(h('div', { class: `fb-result ${clean ? 'good' : 'ok'}` },
        h('strong', null, clean ? '✓ Correct, first time.' : '✓ Correct.'),
        clean ? null : h('span', null, ' Well recovered. It will come back for a quick retry tomorrow.')),
      h('details', { class: 'method' }, h('summary', null, 'See the full method'), h('ol', null, inst.steps.map((s) => h('li', { class: 'md', html: renderMarkdown(s) })))));
      inputs.forEach((el) => el.classList.add('right'));
      finish(clean ? 'clean' : 'recovered');
      await record(true);
      return;
    }
    attempts++;
    feedback.replaceChildren(h('div', { class: 'fb-result bad' }, h('strong', null, '✗ Not quite. '), res.msg ? h('span', null, res.msg) : h('span', null, attempts === 1 ? 'Have another go.' : 'Try a hint, or see it step by step.')));
    if (attempts >= 2 || !inst.hints?.length) stepsBtn.hidden = false;
    (spec.kind === 'multi' ? inputs.find((el) => el.classList.contains('wrong')) : inputs[0])?.focus();
  }

  hintBtn.addEventListener('click', () => {
    const shown = hintBox.children.length;
    if (shown >= inst.hints.length) return;
    helped = true;
    hintBox.appendChild(h('div', { class: 'hint' }, h('span', { class: 'eyebrow' }, `Hint ${shown + 1}`), md(inst.hints[shown])));
    const left = inst.hints.length - shown - 1;
    hintBtn.textContent = left ? `Next hint (${left})` : 'No more hints';
    hintBtn.disabled = !left;
    stepsBtn.hidden = false;
  });

  stepsBtn.addEventListener('click', async () => {
    revealed = true;
    stepsBtn.hidden = true;
    hintBtn.hidden = true;
    checkBtn.disabled = true;
    let i = 0;
    const list = h('ol', { class: 'reveal-steps' });
    const nextStep = h('button', { class: 'btn secondary', type: 'button' }, 'Next step');
    const showOne = () => {
      list.appendChild(h('li', { class: 'md', html: renderMarkdown(inst.steps[i]) }));
      i++;
      if (i >= inst.steps.length) {
        nextStep.remove();
        stepsBox.appendChild(h('div', { class: 'answer-reveal' }, h('span', { class: 'eyebrow' }, 'Answer'), md(inst.show)));
        finish('revealed');
      }
    };
    nextStep.addEventListener('click', showOne);
    stepsBox.replaceChildren(h('p', { class: 'eyebrow' }, 'Step by step'), list, nextStep);
    showOne();
    await record(false);
  });

  checkBtn.addEventListener('click', doCheck);

  const card = h('article', { class: `qcard paper learn-q ${exam ? 'exam' : ''}` },
    h('div', { class: 'q-head' },
      label ? h('span', { class: 'qnum mono' }, label) : null,
      h('span', { class: 'q-src' }, exam ? 'Exam-style question' : lesson.templates[templateId].skill || ''),
      h('span', { class: 'q-marks mono' }, `[${inst.marks} mark${inst.marks === 1 ? '' : 's'}]`)),
    md(inst.q),
    figure(inst.diagram),
    h('div', { class: 'learn-input' }, inputArea, symbols),
    actions, feedback, hintBox, stepsBox, after);
  card.focusInput = () => inputs[0]?.focus();
  return card;
}
