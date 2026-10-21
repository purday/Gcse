// Tiny maths expression parser + evaluator used to check typed answers.
// Handles what a student types: 2x, 3(x+1), (x+2)(x-5), x^2, x², √50, 2√3,
// sqrt(x), π, fractions 3/4, mixed signs, ×, ÷ and the unicode minus.

const SUPERS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
const FUNCS = new Set(['sqrt', 'sin', 'cos', 'tan', 'abs']);

export function normalise(s) {
  let t = String(s ?? '')
    .replace(/[−–—]/g, '-')
    .replace(/[×·∙⋅]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/[½⅓⅔¼¾⅕]/g, (c) => `(${{ '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5' }[c]})`)
    .replace(/[{[]/g, '(')
    .replace(/[}\]]/g, ')')
    .replace(/\*\*/g, '^')
    .trim();
  // Superscripts: x²  ->  x^(2) ; 10⁻⁴ -> 10^(-4)
  t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => `^(${[...m].map((c) => SUPERS[c]).join('')})`);
  return t;
}

function tokenize(src) {
  const s = normalise(src).toLowerCase();
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const txt = s.slice(i, j);
      if ((txt.match(/\./g) || []).length > 1) throw new Error('bad number');
      out.push({ t: 'num', v: parseFloat(txt) });
      i = j;
      continue;
    }
    if (/[a-z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-z]/.test(s[j])) j++;
      let word = s.slice(i, j);
      // Split runs of letters: known function/constant names first, otherwise single-letter variables.
      while (word.length) {
        const fn = [...FUNCS].find((f) => word.startsWith(f));
        if (fn) { out.push({ t: 'fn', v: fn }); word = word.slice(fn.length); continue; }
        if (word.startsWith('pi')) { out.push({ t: 'num', v: Math.PI }); word = word.slice(2); continue; }
        out.push({ t: 'var', v: word[0] });
        word = word.slice(1);
      }
      i = j;
      continue;
    }
    if (c === '√') { out.push({ t: 'fn', v: 'sqrt' }); i++; continue; }
    if ('+-*/^()'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`unexpected "${c}"`);
  }
  return out;
}

export function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => peek()?.t === 'op' && peek().v === v;
  const startsPrimary = () => {
    const k = peek();
    return k && (k.t === 'num' || k.t === 'var' || k.t === 'fn' || (k.t === 'op' && k.v === '('));
  };

  function expr() {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v;
      const b = term();
      a = { t: op === '+' ? 'add' : 'sub', a, b };
    }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = toks[p++].v;
        const b = unary();
        a = { t: op === '*' ? 'mul' : 'div', a, b, explicit: true };
      } else if (startsPrimary()) {
        a = { t: 'mul', a, b: power(), implicit: true };
      } else break;
    }
    return a;
  }
  function unary() {
    if (isOp('-')) { p++; return { t: 'neg', a: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power() {
    const base = primary();
    if (isOp('^')) {
      p++;
      return { t: 'pow', a: base, b: unary() };
    }
    return base;
  }
  function primary() {
    const k = toks[p];
    if (!k) throw new Error('incomplete');
    if (k.t === 'num') { p++; return { t: 'num', v: k.v }; }
    if (k.t === 'var') { p++; return { t: 'var', n: k.v }; }
    if (k.t === 'fn') {
      p++;
      // √50, √(x+1), sqrt(2) ; also 2√3 handled by implicit multiplication
      const arg = isOp('(') ? primary() : power();
      return { t: 'fn', f: k.v, a: arg };
    }
    if (k.t === 'op' && k.v === '(') {
      p++;
      const e = expr();
      if (!isOp(')')) throw new Error('missing )');
      p++;
      return { t: 'paren', a: e };
    }
    throw new Error(`unexpected ${k.v}`);
  }
  const tree = expr();
  if (p !== toks.length) throw new Error('trailing input');
  return tree;
}

export function evaluate(node, env = {}) {
  switch (node.t) {
    case 'num': return node.v;
    case 'var': {
      if (!(node.n in env)) throw new Error(`unknown ${node.n}`);
      return env[node.n];
    }
    case 'paren': return evaluate(node.a, env);
    case 'neg': return -evaluate(node.a, env);
    case 'add': return evaluate(node.a, env) + evaluate(node.b, env);
    case 'sub': return evaluate(node.a, env) - evaluate(node.b, env);
    case 'mul': return evaluate(node.a, env) * evaluate(node.b, env);
    case 'div': return evaluate(node.a, env) / evaluate(node.b, env);
    case 'pow': return Math.pow(evaluate(node.a, env), evaluate(node.b, env));
    case 'fn': {
      const x = evaluate(node.a, env);
      if (node.f === 'sqrt') return Math.sqrt(x);
      if (node.f === 'abs') return Math.abs(x);
      const r = (x * Math.PI) / 180; // GCSE trig is in degrees
      return node.f === 'sin' ? Math.sin(r) : node.f === 'cos' ? Math.cos(r) : Math.tan(r);
    }
    default: throw new Error('bad node');
  }
}

export function vars(node, out = new Set()) {
  if (!node) return out;
  if (node.t === 'var') out.add(node.n);
  for (const k of ['a', 'b']) if (node[k]) vars(node[k], out);
  return out;
}

export function tryParse(src) {
  try {
    return parse(src);
  } catch {
    return null;
  }
}

export function value(src, env = {}) {
  const t = tryParse(src);
  if (!t) return NaN;
  try {
    return evaluate(t, env);
  } catch {
    return NaN;
  }
}

const close = (a, b, rel = 1e-6) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));

// Are two expressions equal for all values of their variables? (numeric test at several points)
export function equivalent(srcA, srcB, varNames) {
  const A = typeof srcA === 'string' ? tryParse(srcA) : srcA;
  const B = typeof srcB === 'string' ? tryParse(srcB) : srcB;
  if (!A || !B) return false;
  const names = varNames || [...new Set([...vars(A), ...vars(B)])];
  const pts = [0.37, 1.9, -2.3, 3.7, -0.81, 5.13, 2.6, 1.27, 4.41, 0.83, 2.17, 6.3];
  let tested = 0;
  for (let i = 0; i < pts.length; i++) {
    const env = {};
    // Later points are all positive so square roots and logs stay defined.
    names.forEach((n, k) => { env[n] = (i >= 7 ? Math.abs(pts[(i + k * 5) % pts.length]) + 0.5 : pts[(i + k * 3) % pts.length]) + k * 0.11; });
    let a;
    let b;
    try {
      a = evaluate(A, env);
      b = evaluate(B, env);
    } catch {
      return false;
    }
    if (!Number.isFinite(b)) continue;
    if (!Number.isFinite(a) || !close(a, b)) return false;
    tested++;
  }
  return tested >= 3;
}

// ---- Structure checks ---------------------------------------------------------

const strip = (n) => (n.t === 'paren' ? strip(n.a) : n);
const isSum = (n) => ['add', 'sub'].includes(strip(n).t);

export function hasBracketProduct(node) {
  const n = strip(node);
  if (n.t === 'mul') return isSum(n.a) || isSum(n.b) || hasBracketProduct(n.a) || hasBracketProduct(n.b);
  if (n.t === 'pow') return isSum(n.a);
  if (n.t === 'neg') return hasBracketProduct(n.a);
  return false;
}

// Expanded = no product or power still applied to a bracketed sum anywhere.
export function isExpanded(node) {
  const walk = (n) => {
    if (!n) return true;
    if (n.t === 'mul' && (isSum(n.a) || isSum(n.b))) return false;
    if (n.t === 'pow' && isSum(n.a)) return false;
    if (n.t === 'div' && isSum(n.b)) return true;
    return walk(n.a) && walk(n.b);
  };
  return walk(node);
}

// Top level is a product (not a sum): what "factorise" means.
export function isProductForm(node) {
  let n = strip(node);
  if (n.t === 'neg') n = strip(n.a);
  return (n.t === 'mul' || n.t === 'pow') && hasBracketProduct(n);
}

// ---- Univariate polynomials (for "fully factorised" and like-term checks) -------

function polyMul(p, q) {
  const r = new Array(p.length + q.length - 1).fill(0);
  p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; }));
  return r;
}
const polyAdd = (p, q, s = 1) => Array.from({ length: Math.max(p.length, q.length) }, (_, i) => (p[i] || 0) + s * (q[i] || 0));

// Coefficient array (index = power) or null if not a polynomial in v.
export function toPoly(node, v = 'x') {
  const n = strip(node);
  switch (n.t) {
    case 'num': return [n.v];
    case 'var': return n.n === v ? [0, 1] : null;
    case 'neg': { const a = toPoly(n.a, v); return a && a.map((c) => -c); }
    case 'add': case 'sub': {
      const a = toPoly(n.a, v);
      const b = toPoly(n.b, v);
      return a && b && polyAdd(a, b, n.t === 'add' ? 1 : -1);
    }
    case 'mul': { const a = toPoly(n.a, v); const b = toPoly(n.b, v); return a && b && polyMul(a, b); }
    case 'div': {
      const a = toPoly(n.a, v);
      const b = toPoly(n.b, v);
      if (!a || !b || b.length !== 1 || b[0] === 0) return null;
      return a.map((c) => c / b[0]);
    }
    case 'pow': {
      const a = toPoly(n.a, v);
      const e = strip(n.b);
      if (!a || e.t !== 'num' || !Number.isInteger(e.v) || e.v < 0 || e.v > 8) return null;
      let r = [1];
      for (let i = 0; i < e.v; i++) r = polyMul(r, a);
      return r;
    }
    default: return null;
  }
}

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// Factors of a product (flattening multiplication; powers of a sum count as one factor).
function factors(node) {
  const n = strip(node);
  if (n.t === 'mul') return [...factors(n.a), ...factors(n.b)];
  if (n.t === 'neg') return [{ t: 'num', v: -1 }, ...factors(n.a)];
  if (n.t === 'pow') return [strip(n.a)];
  return [n];
}

// A single term as { coef, pow: { x: 2, y: 1 } }, or null if it is not a monomial.
function monomial(node) {
  const n = strip(node);
  if (n.t === 'num') return { coef: n.v, pow: {} };
  if (n.t === 'var') return { coef: 1, pow: { [n.n]: 1 } };
  if (n.t === 'neg') { const m = monomial(n.a); return m && { coef: -m.coef, pow: m.pow }; }
  if (n.t === 'pow') {
    const b = monomial(n.a); const e = strip(n.b);
    if (!b || e.t !== 'num' || !Number.isInteger(e.v) || e.v < 0) return null;
    return { coef: b.coef ** e.v, pow: Object.fromEntries(Object.entries(b.pow).map(([k, v]) => [k, v * e.v])) };
  }
  if (n.t === 'mul') {
    const a = monomial(n.a); const b = monomial(n.b);
    if (!a || !b) return null;
    const pow = { ...a.pow };
    for (const [k, v] of Object.entries(b.pow)) pow[k] = (pow[k] || 0) + v;
    return { coef: a.coef * b.coef, pow };
  }
  return null;
}
function sumTerms(node) {
  const n = strip(node);
  if (n.t === 'add') return [...sumTerms(n.a), ...sumTerms(n.b)];
  if (n.t === 'sub') return [...sumTerms(n.a), ...sumTerms(n.b).map((t) => ({ t: 'neg', a: t }))];
  return [n];
}

// Fully factorised over the integers: no bracket has a common numeric factor or
// a letter common to all its terms, and no quadratic bracket still has rational roots.
export function isFullyFactorised(node, v = 'x') {
  if (!isProductForm(node)) return false;
  for (const f of factors(node)) {
    if (isSum(f)) {
      const monos = sumTerms(f).map(monomial);
      if (monos.every(Boolean) && monos.every((m) => Number.isInteger(m.coef))) {
        if (monos.reduce((g, m) => gcd(g, m.coef), 0) > 1) return false;
        const shared = Object.keys(monos[0].pow).filter((k) => monos.every((m) => (m.pow[k] || 0) > 0));
        if (shared.length) return false;
      }
    }
    const p = toPoly(f, v);
    if (!p) continue;
    const deg = p.reduceRight((d, c, i) => (d === -1 && Math.abs(c) > 1e-9 ? i : d), -1);
    if (deg < 1) continue;
    const ints = p.map((c) => Math.round(c));
    if (ints.some((c, i) => Math.abs(c - p[i]) > 1e-9)) continue;
    const content = ints.reduce((g, c) => gcd(g, c), 0);
    if (content > 1) return false;
    if (deg >= 1 && Math.abs(ints[0]) < 1e-9 && ints.slice(1).some((c) => c !== 0) && ints.filter((c) => c !== 0).length > 1) return false; // x is still a common factor
    if (deg === 2) {
      const [c, b, a] = ints;
      const disc = b * b - 4 * a * c;
      if (disc >= 0 && Number.isInteger(Math.sqrt(disc))) return false;
    }
  }
  return true;
}

// One term only, each letter written once: 6x^5, -3a^2b, 4x^-2 (what "simplify" means for index laws).
export function isSingleTerm(src) {
  const t = normalise(src).replace(/\s+/g, '').toLowerCase();
  if (!/^-?(\d+(\.\d+)?)?([a-z](\^\(?-?\d+(\/\d+)?\)?)?)+$|^-?\d+(\.\d+)?$/.test(t)) return false;
  const letters = t.replace(/\^\(?-?\d+(\/\d+)?\)?/g, '').replace(/[^a-z]/g, '');
  return new Set(letters).size === letters.length;
}

// Like terms collected: no two top-level terms of the same degree.
export function likeTermsCollected(node, v = 'x') {
  const terms = [];
  const walk = (n) => {
    n = strip(n);
    if (n.t === 'add' || n.t === 'sub') { walk(n.a); walk(n.b); } else terms.push(n);
  };
  walk(node);
  const degs = terms.map((t) => { const p = toPoly(t, v); return p ? p.length - 1 - [...p].reverse().findIndex((c) => Math.abs(c) > 1e-12) : null; });
  return new Set(degs).size === degs.length;
}
