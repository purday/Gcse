// Content QA for every built-in lesson (run: node --experimental-default-type=module tests/learn_content.mjs [lessonId])
//  - lesson structure is valid and every referenced template exists
//  - every template generates 300 instances without errors
//  - the model answer ("typed", or one derived from the spec) is accepted by the checker
//  - nearby wrong answers are rejected
//  - every $...$ / $$...$$ segment compiles with KaTeX (strict)
//  - template verify(inst) self-checks pass (independent maths re-check)
import katex from 'katex';
import { LESSONS } from '../app/js/learn/lessons/index.js';
import { check } from '../app/js/learn/check.js';
import { rng } from '../app/js/learn/engine.js';

const only = process.argv[2];
const N = Number(process.env.N || 300);
let fails = 0;
const fail = (where, msg) => { fails++; if (fails < 40) console.log(`  ✗ ${where}: ${msg}`); };

function mathSegments(src) {
  const out = [];
  const s = String(src ?? '');
  const re = /\$\$([\s\S]+?)\$\$|(?<!\\)\$((?:\\\$|[^$])+?)\$/g;
  let m;
  while ((m = re.exec(s))) out.push({ tex: m[1] ?? m[2], display: !!m[1] });
  return out;
}
function texOk(where, src) {
  // String.raw keeps "\n" literally: catch a backslash-n that is not a LaTeX command like \neq.
  if (/\\n(?![a-z])/.test(String(src ?? ''))) fail(where, `literal \\n in text: ${String(src).slice(0, 60)}`);
  for (const { tex, display } of mathSegments(src)) {
    if (/\\\\[a-zA-Z]/.test(tex)) fail(where, `doubled backslash (renders as a line break): "${tex}"`);
    // "sin x" without a backslash renders as italic s·i·n.
    if (/(^|[^\\a-zA-Z])(sin|cos|tan)(?![a-zA-Z])/.test(tex.replace(/\\text\{[^}]*\}/g, ''))) fail(where, `bare trig name (needs \\sin etc.): "${tex}"`);
    try {
      katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'error' });
    } catch (e) {
      fail(where, `LaTeX "${tex}": ${e.message.split('\n')[0]}`);
    }
  }
}

function round(x, dp) { return (Math.round(x * 10 ** dp) / 10 ** dp).toFixed(dp); }
function roundSf(x, sf) { if (x === 0) return '0'; const d = sf - Math.ceil(Math.log10(Math.abs(x))); const v = Math.round(x * 10 ** d) / 10 ** d; return d > 0 ? v.toFixed(d) : String(v); }
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// A correct typed answer derived from the spec (when the template gives no "typed").
function derive(spec) {
  switch (spec.kind) {
    case 'number': return spec.dp != null ? round(spec.value, spec.dp) : spec.sf != null ? roundSf(spec.value, spec.sf) : String(+spec.value.toPrecision(12));
    case 'numbers': return spec.values.map((v) => (spec.dp != null ? round(v, spec.dp) : String(+v.toPrecision(12)))).join(', ');
    case 'fraction': { const g = gcd(spec.num, spec.den); return `${spec.num / g}/${spec.den / g}`; }
    case 'expr': return spec.form ? null : spec.expr;
    case 'equation': return `${spec.lhsVar} = ${spec.expr}`;
    case 'stdform': { const v = spec.sf ? Number(roundSf(spec.value, spec.sf)) : spec.value; const e = Math.floor(Math.log10(Math.abs(v))); return `${+(v / 10 ** e).toPrecision(10)} × 10^${e}`; }
    case 'ratio': return spec.parts.join(':');
    case 'coord': return `(${spec.x}, ${spec.y})`;
    case 'coords': return spec.points.map(([x, y]) => `(${+x.toPrecision(12)}, ${+y.toPrecision(12)})`).join(', ');
    case 'inequality': {
      if (spec.lo != null && spec.hi != null) return `${spec.lo} ${spec.loInc ? '<=' : '<'} ${spec.v} ${spec.hiInc ? '<=' : '<'} ${spec.hi}`;
      if (spec.lo != null) return `${spec.v} ${spec.loInc ? '>=' : '>'} ${spec.lo}`;
      return `${spec.v} ${spec.hiInc ? '<=' : '<'} ${spec.hi}`;
    }
    case 'choice': return spec.correct;
    case 'surd': return null;
    case 'pi': return `${+spec.k.toPrecision(12)}π`;
    case 'text': return null;
    case 'multi': return spec.parts.map((p) => derive(p.spec));
    default: return null;
  }
}

// Plausible wrong answers that must be rejected.
function wrongs(spec) {
  switch (spec.kind) {
    case 'number': return [String(spec.value + (Math.abs(spec.value) > 5 ? 1 : 0.5) * (spec.dp != null ? 10 ** -Math.max(0, spec.dp - 1) * 3 : 3)), String(spec.value + 7)];
    case 'numbers': return spec.values.length > 1 ? [spec.values.slice(1).join(', '), spec.values.map((v) => v + 1).join(', ')] : [String(spec.values[0] + 1)];
    case 'fraction': return [`${spec.num + 1}/${spec.den}`];
    case 'ratio': return [spec.parts.map((p, i) => (i ? p + 1 : p)).join(':')];
    case 'coord': return [`(${spec.x + 1}, ${spec.y})`];
    case 'choice': return [String((spec.correct + 1) % spec.options.length)];
    default: return [];
  }
}

const KINDS = new Set(['learn', 'example', 'try', 'practice', 'exam', 'recap']);
const ids = new Set();
let instances = 0;
for (const lesson of LESSONS) {
  if (only && lesson.id !== only) continue;
  const L = `lesson ${lesson.id}`;
  if (ids.has(lesson.id)) fail(L, 'duplicate id');
  ids.add(lesson.id);
  for (const k of ['title', 'topics', 'band', 'minutes', 'why', 'steps', 'templates']) if (lesson[k] == null) fail(L, `missing ${k}`);
  texOk(`${L} why`, lesson.why);
  lesson.steps.forEach((st, i) => {
    const S = `${L} step ${i + 1}`;
    if (!KINDS.has(st.kind)) fail(S, `bad kind ${st.kind}`);
    for (const f of ['md', 'key', 'q', 'answer']) if (st[f]) texOk(S, st[f]);
    (st.steps || []).forEach((x) => { texOk(S, x.md); if (!x.md) fail(S, 'empty example step'); });
    const refs = st.kind === 'practice' ? st.templates : st.template ? [st.template] : [];
    for (const t of refs) if (!lesson.templates[t]) fail(S, `template ${t} not found`);
  });
  if (lesson.steps.at(-1)?.kind !== 'recap') fail(L, 'last step should be the recap');
  for (const [tid, t] of Object.entries(lesson.templates)) {
    const T = `${lesson.id}/${tid}`;
    if (!t.skill) fail(T, 'missing skill');
    for (let seed = 1; seed <= N; seed++) {
      let inst;
      try {
        inst = t.gen(rng(seed * 7919 + tid.length));
      } catch (e) {
        fail(T, `seed ${seed} threw ${e.message}`);
        break;
      }
      instances++;
      const W = `${T} seed ${seed}`;
      if (!inst.q || !inst.a || !inst.show || !Array.isArray(inst.steps) || !inst.steps.length) { fail(W, 'missing q/a/show/steps'); break; }
      if (seed <= 40) for (const f of [inst.q, inst.show, ...inst.steps, ...(inst.hints || [])]) texOk(W, f);
      const typed = inst.typed ?? derive(inst.a);
      if (typed == null) { fail(W, `no typed answer for ${inst.a.kind}${inst.a.form ? `/${inst.a.form}` : ''}`); break; }
      const res = check(typed, inst.a);
      if (!res.ok) { fail(W, `model answer ${JSON.stringify(typed)} rejected (${res.msg || 'wrong'}) for ${JSON.stringify(inst.a)}`); break; }
      for (const w of [...wrongs(inst.a), ...(inst.wrong || [])]) {
        if (check(w, inst.a).ok) { fail(W, `wrong answer ${JSON.stringify(w)} accepted for ${JSON.stringify(inst.a)}`); break; }
      }
      if (t.verify) {
        const v = t.verify(inst);
        if (v !== true) { fail(W, `verify failed: ${v}`); break; }
      }
      const nums = JSON.stringify(inst.a).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || [];
      if (nums.some((n) => !Number.isFinite(Number(n)))) fail(W, 'non-finite number in answer');
    }
  }
}
console.log(fails ? `  ✗ ${fails} content problem(s)` : `  ✓ lesson content: ${ids.size} lessons, ${instances} generated questions checked`);
process.exit(fails ? 1 : 0);
