// Helpers for lesson question generators: seeded random numbers, number
// formatting, and building LaTeX/plain forms of expressions.

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    nz: (lo, hi) => { let v; do v = r.int(lo, hi); while (v === 0); return v; },
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    shuffle: (arr) => { const b = [...arr]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
    distinct: (n, lo, hi, avoid = []) => { const s = new Set(); let guard = 0; while (s.size < n && guard++ < 1000) { const v = r.int(lo, hi); if (!avoid.includes(v)) s.add(v); } return [...s]; },
  };
  return r;
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

export function simplify(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
}

// Clean float noise: 0.30000000000000004 -> 0.3
export function fmt(x, maxDp = 6) {
  if (!Number.isFinite(x)) return String(x);
  const r = Math.round(x * 10 ** maxDp) / 10 ** maxDp;
  return String(Object.is(r, -0) ? 0 : r);
}
export function dp(x, n) { return (Math.round(x * 10 ** n) / 10 ** n).toFixed(n); }
export function sf(x, n) {
  if (x === 0) return '0';
  const d = n - Math.ceil(Math.log10(Math.abs(x)));
  const v = Math.round(x * 10 ** d) / 10 ** d;
  return d > 0 ? v.toFixed(d) : String(v);
}
export function money(x) { return `£${x.toFixed(2)}`; }

export function fracTex(n, d) {
  [n, d] = simplify(n, d);
  if (d === 1) return String(n);
  return `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`;
}
export function fracPlain(n, d) {
  [n, d] = simplify(n, d);
  return d === 1 ? String(n) : `${n}/${d}`;
}

// Polynomial with integer coefficients [c0, c1, c2, ...] in v, highest power first.
export function poly(coeffs, v = 'x', tex = true) {
  const parts = [];
  for (let p = coeffs.length - 1; p >= 0; p--) {
    const c = coeffs[p];
    if (!c) continue;
    const abs = Math.abs(c);
    const coef = p === 0 ? String(abs) : abs === 1 ? '' : String(abs);
    const pow = p === 0 ? '' : p === 1 ? v : tex ? `${v}^{${p}}` : `${v}^${p}`;
    const body = `${coef}${pow}`;
    if (!parts.length) parts.push(c < 0 ? `-${body}` : body);
    else parts.push(c < 0 ? `- ${body}` : `+ ${body}`);
  }
  return parts.length ? parts.join(' ') : '0';
}

// (ax + b) as text, e.g. lin(1, -3) -> "x - 3", lin(2, 5) -> "2x + 5"
export function lin(a, b, v = 'x') {
  return poly([b, a], v);
}

// "+ 5" / "- 5" for continuing an expression
export function signed(n) {
  return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
}
// n in brackets if negative, for substitutions: 3 × (-2)
export function br(n) {
  return n < 0 ? `(${n})` : String(n);
}

export function expandLinear(a, b, c, d) {
  // (ax + b)(cx + d) -> [bd, ad + bc, ac]
  return [b * d, a * d + b * c, a * c];
}

export function isSquare(n) { return n >= 0 && Number.isInteger(Math.sqrt(n)); }

// Largest k with k^2 | n  ->  √n = k√m
export function surdSimplify(n) {
  let k = 1;
  for (let i = 2; i * i <= n; i++) while (n % (i * i) === 0) { n /= i * i; k *= i; }
  return [k, n];
}
export function surdTex(k, m) {
  if (m === 1) return String(k);
  return `${k === 1 ? '' : k === -1 ? '-' : k}\\sqrt{${m}}`;
}

export function deg(rad) { return (rad * 180) / Math.PI; }
export function rad(d) { return (d * Math.PI) / 180; }

// Signed term for continuing an expression: sterm(3, 'x') -> "+ 3x", sterm(-1, 'x') -> "- x", sterm(-4) -> "- 4"
export function sterm(k, v = '') {
  const abs = Math.abs(k);
  const body = v ? `${abs === 1 ? '' : abs}${v}` : String(abs);
  return `${k < 0 ? '-' : '+'} ${body}`;
}
// Leading term (no "+"): term(1, 'x') -> "x", term(-2, 'x') -> "-2x"
export function lead(k, v = '') {
  const abs = Math.abs(k);
  return `${k < 0 ? '-' : ''}${v ? `${abs === 1 ? '' : abs}${v}` : abs}`;
}
