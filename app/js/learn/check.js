// Checking typed answers against an answer spec. Returns
// { ok, msg } where msg (optional) explains a near miss, e.g. right value but
// not fully factorised, or rounded to the wrong number of places.
//
// Spec kinds:
//   number    { value, dp?, sf?, tol? }          one number (fractions/surds/π typed are evaluated)
//   numbers   { values, dp?, tol? }              several numbers in any order (e.g. roots)
//   fraction  { num, den, simplest?: true }      exact fraction; mixed numbers accepted
//   expr      { expr, vars?, form? }             algebra: form 'expanded' | 'factorised' | 'simplified'
//   equation  { lhsVar, expr, vars }             "t = ..." (rearranging): expr in the other variables
//   stdform   { value, sf? }                     a × 10^n with 1 ≤ a < 10
//   ratio     { parts, simplest?: true }
//   coord     { x, y, tol? }
//   inequality{ v, lo?, loInc?, hi?, hiInc? }
//   surd      { value, form? }                   value of a surd expression; form 'k√n' requires simplest surd
//   choice    { options, correct }
//   text      { accept: [regex strings] }
//   multi     { parts: [{ label, spec }] }

import { parse, tryParse, evaluate, equivalent, isExpanded, isProductForm, isFullyFactorised, likeTermsCollected, normalise, vars } from './expr.js';

const UNITS = /(cm|mm|km|kg|g|ml|l|m|s|h|°|degrees?|£|p|%|units?|cm²|cm³|m²|m³|cm\^2|cm\^3|m\^2|m\^3|mph|km\/h|m\/s|g\/cm\^?3|g\/cm³|n\/m\^?2)$/i;

function clean(s) {
  return String(s ?? '').trim().replace(/^£/, '').replace(/,(?=\d{3}\b)/g, '').replace(/\s+/g, ' ');
}
function stripUnits(s) {
  let t = clean(s);
  for (let i = 0; i < 2; i++) t = t.replace(UNITS, '').trim();
  return t;
}
function stripLhs(s, v = '[a-z]') {
  return clean(s).replace(new RegExp(`^${v}\\s*=\\s*`, 'i'), '');
}

export function num(s) {
  let t = stripUnits(stripLhs(s));
  if (!t) return NaN;
  // mixed number "1 3/4" or "-2 1/2"
  const mixed = t.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return (mixed[1] ? -1 : 1) * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
  t = t.replace(/(\d)\s*[x×]\s*10/i, '$1*10');
  try {
    const tree = parse(t);
    if (vars(tree).size) return NaN;
    return evaluate(tree, {});
  } catch {
    return NaN;
  }
}

function decimals(s) {
  const m = stripUnits(stripLhs(s)).match(/\.(\d+)/);
  return m ? m[1].length : 0;
}
function sigfigs(s) {
  const t = stripUnits(stripLhs(s)).replace(/^-/, '').replace(/^0\.?0*/, '');
  const digits = t.replace('.', '');
  return t.includes('.') ? digits.length : digits.replace(/0+$/, '').length || 1;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

function roundTo(x, dp) { const k = 10 ** dp; return Math.round(x * k) / k; }
function roundSf(x, sf) { if (x === 0) return 0; const d = sf - Math.ceil(Math.log10(Math.abs(x))); return roundTo(x, d); }

function checkNumber(input, spec) {
  const x = num(input);
  if (!Number.isFinite(x)) return { ok: false, msg: 'Type a number (fractions like 3/4 are fine).' };
  if (spec.dp != null) {
    const target = roundTo(spec.value, spec.dp);
    if (near(x, target, 1e-9) && decimals(input) === spec.dp) return { ok: true };
    if (near(x, target, 1e-9)) return { ok: true };
    if (near(roundTo(x, spec.dp), target, 1e-9)) return { ok: false, msg: `Right value, but give it to ${spec.dp} decimal place${spec.dp === 1 ? '' : 's'}.` };
    return { ok: false };
  }
  if (spec.sf != null) {
    const target = roundSf(spec.value, spec.sf);
    if (near(x, target, Math.abs(target) * 1e-9 + 1e-12)) return { ok: true };
    if (near(roundSf(x, spec.sf), target, Math.abs(target) * 1e-9 + 1e-12)) return { ok: false, msg: `Right value, but round to ${spec.sf} significant figures.` };
    return { ok: false };
  }
  const tol = spec.tol ?? Math.max(1e-9, Math.abs(spec.value) * 1e-9);
  return { ok: near(x, spec.value, tol) };
}

function splitList(input) {
  return clean(input)
    .replace(/\b(or|and)\b/gi, ',')
    .split(/[,;]+/)
    .map((p) => stripLhs(p.trim()))
    .filter(Boolean);
}

function checkNumbers(input, spec) {
  const got = splitList(input).map(num);
  if (got.some((x) => !Number.isFinite(x))) return { ok: false, msg: 'Separate your answers with commas, e.g. 3, -5' };
  const want = [...spec.values];
  if (got.length < want.length) return { ok: false, msg: `There ${want.length === 2 ? 'are 2 answers' : `are ${want.length} answers`}. Give them all.` };
  if (got.length > want.length) return { ok: false, msg: `Only ${want.length} answer${want.length === 1 ? '' : 's'} needed.` };
  const tol = spec.dp != null ? 0.5 * 10 ** -spec.dp + 1e-9 : spec.tol ?? 1e-6;
  const left = [...want];
  for (const g of got) {
    const i = left.findIndex((w) => near(g, spec.dp != null ? roundTo(w, spec.dp) : w, spec.dp != null ? 1e-9 : tol));
    if (i === -1) {
      if (spec.dp != null && left.some((w) => near(g, w, tol))) return { ok: false, msg: `Round each answer to ${spec.dp} decimal place${spec.dp === 1 ? '' : 's'}.` };
      const signFlip = left.findIndex((w) => near(g, -w, 1e-6));
      return { ok: false, msg: signFlip !== -1 ? 'Check your signs: one answer has the wrong sign.' : undefined };
    }
    left.splice(i, 1);
  }
  return { ok: true };
}

function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }

function parseFraction(input) {
  const t = stripUnits(stripLhs(input));
  let m = t.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const n = Number(m[2]) * Number(m[4]) + Number(m[3]);
    return { n: m[1] ? -n : n, d: Number(m[4]), mixed: true };
  }
  m = t.match(/^\(?\s*(-?\d+)\s*\)?\s*\/\s*\(?\s*(-?\d+)\s*\)?$/);
  if (m) return { n: Number(m[1]), d: Number(m[2]) };
  m = t.match(/^-?\d+$/);
  if (m) return { n: Number(t), d: 1 };
  return null;
}

function checkFraction(input, spec) {
  const f = parseFraction(input);
  const want = spec.num / spec.den;
  if (!f) {
    const x = num(input);
    if (Number.isFinite(x) && near(x, want, 1e-9)) return spec.simplest ? { ok: false, msg: 'Right value. Write it as a fraction.' } : { ok: true };
    return { ok: false, msg: Number.isFinite(x) ? undefined : 'Type a fraction like 7/12 or a mixed number like 1 5/12.' };
  }
  if (f.d === 0 || !near(f.n / f.d, want, 1e-12)) return { ok: false };
  if (spec.simplest && gcd(f.n, f.d) !== 1) return { ok: false, msg: 'Right value, but simplify the fraction fully.' };
  return { ok: true };
}

function checkExpr(input, spec) {
  const t = stripLhs(input, '(?:[a-z]|y)').replace(/=.*$/, '');
  const tree = tryParse(t);
  if (!tree) return { ok: false, msg: 'That expression could not be read. Use ^ for powers, e.g. x^2 + 3x.' };
  const target = tryParse(spec.expr);
  if (!equivalent(tree, target, spec.vars)) return { ok: false };
  const v = spec.vars?.[0] || 'x';
  if (spec.form === 'factorised') {
    if (!isProductForm(tree)) return { ok: false, msg: 'Equivalent, but it needs to be factorised (written as a product of brackets).' };
    if (spec.fully !== false && !isFullyFactorised(tree, v)) return { ok: false, msg: 'Nearly: it can be factorised further.' };
  }
  if (spec.form === 'expanded' || spec.form === 'simplified') {
    if (!isExpanded(tree)) return { ok: false, msg: 'Equivalent, but expand the brackets.' };
    if (!likeTermsCollected(tree, v)) return { ok: false, msg: 'Equivalent, but collect the like terms.' };
  }
  return { ok: true };
}

function checkEquation(input, spec) {
  const s = clean(input);
  const m = s.match(new RegExp(`^\\s*${spec.lhsVar}\\s*=\\s*(.+)$`, 'i'));
  const rhs = m ? m[1] : s;
  const tree = tryParse(rhs);
  if (!tree) return { ok: false, msg: `Write it as ${spec.lhsVar} = …` };
  if (vars(tree).has(spec.lhsVar)) return { ok: false, msg: `${spec.lhsVar} must only appear on the left.` };
  return { ok: equivalent(tree, tryParse(spec.expr), spec.vars) };
}

function checkStdform(input, spec) {
  const t = normalise(stripUnits(input)).replace(/\s+/g, '').replace(/×|x(?=10)/gi, '*');
  const m = t.match(/^(-?\d+(?:\.\d+)?)\*10\^\(?(-?\d+)\)?$/) || t.match(/^(-?\d+(?:\.\d+)?)e(-?\d+)$/i);
  if (!m) {
    const x = num(input);
    if (Number.isFinite(x) && near(x, spec.value, Math.abs(spec.value) * 1e-9)) return { ok: false, msg: 'Right value. Now write it in standard form: a × 10^n.' };
    return { ok: false, msg: 'Write it like 4.2 × 10^-4 (type ^ for the power).' };
  }
  const a = Number(m[1]);
  const x = a * 10 ** Number(m[2]);
  const target = spec.sf ? roundSf(spec.value, spec.sf) : spec.value;
  if (!near(x, target, Math.abs(target) * 1e-9)) {
    if (spec.sf && near(roundSf(x, spec.sf), target, Math.abs(target) * 1e-9)) return { ok: false, msg: `Round the number part to ${spec.sf} significant figures.` };
    return { ok: false };
  }
  if (Math.abs(a) < 1 || Math.abs(a) >= 10) return { ok: false, msg: 'Right value, but the first number must be at least 1 and less than 10.' };
  return { ok: true };
}

function checkRatio(input, spec) {
  const parts = clean(input).split(':').map((p) => num(p));
  if (parts.length !== spec.parts.length || parts.some((x) => !Number.isFinite(x))) return { ok: false, msg: `Write it as a ratio with ${spec.parts.length} parts, like ${spec.parts.length === 2 ? '3:5' : '2:3:4'}.` };
  const k = parts[0] / spec.parts[0];
  if (!parts.every((p, i) => near(p, spec.parts[i] * k, 1e-9))) return { ok: false };
  if (spec.simplest && (!parts.every(Number.isInteger) || parts.reduce((g, p) => gcd(g, p), 0) !== 1)) return { ok: false, msg: 'Equivalent ratio, but simplify it fully (whole numbers, no common factor).' };
  return { ok: true };
}

function checkCoord(input, spec) {
  const m = clean(input).replace(/[()]/g, '').split(',').map((p) => num(p));
  if (m.length !== 2 || m.some((x) => !Number.isFinite(x))) return { ok: false, msg: 'Write a coordinate like (3, -2).' };
  const tol = spec.tol ?? 1e-9;
  if (near(m[0], spec.y, tol) && near(m[1], spec.x, tol) && !near(m[0], spec.x, tol)) return { ok: false, msg: 'Swap them round: x comes first, then y.' };
  return { ok: near(m[0], spec.x, tol) && near(m[1], spec.y, tol) };
}

function parseInequality(input, v) {
  const t = normalise(clean(input)).replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/\s+/g, '');
  const ops = '(<=|>=|<|>)';
  const n = '(-?[0-9./]+)';
  let m = t.match(new RegExp(`^${n}${ops}${v}${ops}${n}$`));
  if (m) {
    const a = num(m[1]); const b = num(m[4]);
    if (m[2][0] === '<' && m[3][0] === '<') return { lo: a, loInc: m[2] === '<=', hi: b, hiInc: m[3] === '<=' };
    if (m[2][0] === '>' && m[3][0] === '>') return { lo: b, loInc: m[3] === '>=', hi: a, hiInc: m[2] === '>=' };
    return null;
  }
  m = t.match(new RegExp(`^${v}${ops}${n}$`));
  if (m) {
    const b = num(m[2]);
    return m[1][0] === '>' ? { lo: b, loInc: m[1] === '>=' } : { hi: b, hiInc: m[1] === '<=' };
  }
  m = t.match(new RegExp(`^${n}${ops}${v}$`));
  if (m) {
    const a = num(m[1]);
    return m[2][0] === '<' ? { lo: a, loInc: m[2] === '<=' } : { hi: a, hiInc: m[2] === '>=' };
  }
  return null;
}

function checkInequality(input, spec) {
  const got = parseInequality(input, spec.v || 'x');
  if (!got) return { ok: false, msg: `Write it like ${spec.v || 'x'} > 3 or -2 < ${spec.v || 'x'} ≤ 5 (type <= for ≤).` };
  const same = (a, b) => (a == null && b == null) || (a != null && b != null && near(a, b, 1e-9));
  const valuesOk = same(got.lo, spec.lo) && same(got.hi, spec.hi);
  if (!valuesOk) return { ok: false };
  if ((spec.lo != null && !!got.loInc !== !!spec.loInc) || (spec.hi != null && !!got.hiInc !== !!spec.hiInc)) return { ok: false, msg: 'Right numbers. Check whether each sign should be < or ≤.' };
  return { ok: true };
}

function checkSurd(input, spec) {
  const x = num(input);
  if (!Number.isFinite(x) || !near(x, spec.value, 1e-9)) return { ok: false };
  const t = stripUnits(stripLhs(input)).replace(/\s+/g, '').replace(/sqrt\(?(\d+)\)?/gi, '√$1');
  if (spec.form === 'k√n' || spec.form === 'simplest') {
    if (/\.\d/.test(t)) return { ok: false, msg: 'Give an exact answer using √, not a decimal.' };
    const roots = [...t.matchAll(/√\(?(\d+)\)?/g)].map((m) => Number(m[1]));
    for (const r of roots) {
      for (let k = 2; k * k <= r; k++) if (r % (k * k) === 0) return { ok: false, msg: `Right value, but √${r} can be simplified further.` };
    }
  }
  if (spec.form === 'rational-denominator' && /\/\s*\(?[^)]*√/.test(t)) return { ok: false, msg: 'Right value, but the denominator must not contain a surd.' };
  return { ok: true };
}

function checkText(input, spec) {
  const t = clean(input).toLowerCase();
  return { ok: spec.accept.some((r) => new RegExp(r, 'i').test(t)) };
}

export function check(input, spec) {
  switch (spec.kind) {
    case 'number': return checkNumber(input, spec);
    case 'numbers': return checkNumbers(input, spec);
    case 'fraction': return checkFraction(input, spec);
    case 'expr': return checkExpr(input, spec);
    case 'equation': return checkEquation(input, spec);
    case 'stdform': return checkStdform(input, spec);
    case 'ratio': return checkRatio(input, spec);
    case 'coord': return checkCoord(input, spec);
    case 'inequality': return checkInequality(input, spec);
    case 'surd': return checkSurd(input, spec);
    case 'choice': return { ok: Number(input) === spec.correct };
    case 'text': return checkText(input, spec);
    case 'multi': {
      const results = spec.parts.map((p, i) => check(input?.[i] ?? '', p.spec));
      const firstMsg = results.find((r) => !r.ok && r.msg);
      return { ok: results.every((r) => r.ok), parts: results, msg: firstMsg ? firstMsg.msg : undefined };
    }
    default: return { ok: false, msg: 'Unknown answer type.' };
  }
}
