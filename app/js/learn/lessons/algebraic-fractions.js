import { lin, poly, sterm, gcd } from '../engine.js';

const md = String.raw;
const b = (k, c) => `(${lin(k, c)})`; // "(x + 3)", "(2x - 1)"
const plainB = (k, c) => `(${k === 1 ? '' : k}x${c < 0 ? '-' : '+'}${Math.abs(c)})`;

export default {
  id: 'algebraic-fractions',
  title: 'Algebraic fractions',
  subtitle: 'Simplify by factorising, add and subtract, solve',
  topics: ['A4'],
  band: '7',
  calc: 'non-calc',
  minutes: 35,
  why: 'Simplifying an algebraic fraction (3 marks) and solving an equation with fractions (4–5 marks) are classic grade 7–8 questions. Both are factorising and fraction skills you already have.',
  steps: [
    {
      kind: 'learn', title: 'Simplifying: factorise, then cancel',
      md: md`You can only cancel **whole brackets** (factors), never single terms.

$$\frac{x^2 + 5x + 6}{x^2 - 9} = \frac{(x + 2)(x + 3)}{(x - 3)(x + 3)} = \frac{x + 2}{x - 3}$$

Factorise the top **and** the bottom completely first: common factors, quadratics, difference of two squares.`,
      key: 'You cannot cancel the x² or the x from x + 2 over x − 3. Only identical brackets cancel.',
    },
    { kind: 'try', template: 'simplify' },
    {
      kind: 'learn', title: 'Adding and subtracting',
      md: md`Exactly like number fractions: use a **common denominator** (multiply the denominators).

$$\frac{2}{x + 1} + \frac{3}{x - 2} = \frac{2(x - 2) + 3(x + 1)}{(x + 1)(x - 2)} = \frac{5x - 1}{(x + 1)(x - 2)}$$

Expand and simplify the top. You can leave the bottom factorised.`,
      key: 'Subtracting? Put the second numerator in a bracket: −3(x + 1) = −3x − 3.',
    },
    { kind: 'try', template: 'add' },
    {
      kind: 'learn', title: 'Solving equations with fractions',
      md: md`Multiply **every term** by the common denominator to clear the fractions, then solve. It usually becomes a quadratic.

$$\frac{4}{x} + \frac{3}{x + 2} = 1 \;\Rightarrow\; 4(x + 2) + 3x = x(x + 2) \;\Rightarrow\; x^2 - 5x - 8 = 0$$`,
    },
    { kind: 'try', template: 'solve' },
    { kind: 'practice', title: 'Practice', templates: ['simplify', 'simplifyCommon', 'add', 'subtract', 'solve'] },
    { kind: 'exam', template: 'simplifyHard' },
    {
      kind: 'recap',
      md: md`- Simplify: factorise top and bottom fully, cancel identical brackets.
- Add or subtract: common denominator, expand and collect the numerator.
- Solve: multiply every term by the common denominator, then solve.`,
      mistakes: ['Cancelling terms instead of factors', 'Sign errors when subtracting the second numerator', 'Only multiplying some of the terms when clearing fractions'],
    },
  ],
  templates: {
    simplify: {
      level: 2, marks: 3, skill: 'Simplifying an algebraic fraction',
      gen(r) {
        const [p, q, s] = r.distinct(3, -7, 7); if (!p || !q || !s || q === -p || s === -p) return this.gen(r);
        // (x + p)(x + q) / ((x + p)(x + s))
        const top = poly([p * q, p + q, 1]); const bot = poly([p * s, p + s, 1]);
        return {
          q: md`Simplify fully $\dfrac{${top}}{${bot}}$.`,
          a: { kind: 'expr', expr: `(x${sterm(q).replace(/ /g, '')})/(x${sterm(s).replace(/ /g, '')})`, form: 'cancelled' },
          typed: `${b(1, q)}/${b(1, s)}`,
          show: md`$\dfrac{${lin(1, q)}}{${lin(1, s)}}$`,
          wrong: [`(x+${p * q})/(x+${p * s})`.replace(/\+-/g, '-')].filter(() => p !== 1),
          hints: [md`Factorise the top: two numbers that multiply to $${p * q}$ and add to $${p + q}$.`, md`Factorise the bottom the same way, then cancel the bracket they share.`],
          steps: [md`Top: $${b(1, p)}${b(1, q)}$`, md`Bottom: $${b(1, p)}${b(1, s)}$`, md`Cancel $${b(1, p)}$: $\dfrac{${lin(1, q)}}{${lin(1, s)}}$`],
        };
      },
    },
    simplifyCommon: {
      level: 2, marks: 2, skill: 'Simplifying using a common factor and a quadratic',
      gen(r) {
        const k = r.int(2, 5); const [p, q] = r.distinct(2, -6, 6); if (!p || !q || p === -q) return this.gen(r);
        // k(x + p) / ((x + p)(x + q))
        return {
          q: md`Simplify fully $\dfrac{${lin(k, k * p)}}{${poly([p * q, p + q, 1])}}$.`,
          a: { kind: 'expr', expr: `${k}/(x${sterm(q).replace(/ /g, '')})`, form: 'cancelled' },
          typed: `${k}/${b(1, q)}`,
          show: md`$\dfrac{${k}}{${lin(1, q)}}$`,
          hints: [md`Top: take out the common factor $${k}$.`, md`Bottom: factorise the quadratic.`],
          steps: [md`$\dfrac{${k}${b(1, p)}}{${b(1, p)}${b(1, q)}}$`, md`$= \dfrac{${k}}{${lin(1, q)}}$`],
        };
      },
    },
    add: {
      level: 2, marks: 3, skill: 'Adding algebraic fractions',
      gen(r) {
        const a1 = r.int(1, 6); const a2 = r.int(1, 6); const [p, q] = r.distinct(2, -6, 6); if (!p || !q) return this.gen(r);
        // a1/(x + p) + a2/(x + q) = (a1(x + q) + a2(x + p)) / ((x + p)(x + q))
        const A = a1 + a2; const B = a1 * q + a2 * p;
        if (B === 0) return this.gen(r);
        return {
          q: md`Write $\dfrac{${a1}}{${lin(1, p)}} + \dfrac{${a2}}{${lin(1, q)}}$ as a single fraction in its simplest form.`,
          a: { kind: 'expr', expr: `${a1}/(x+${p})+${a2}/(x+${q})`.replace(/\+-/g, '-'), form: 'fraction' },
          typed: `${plainB(A, B)}/(${plainB(1, p)}${plainB(1, q)})`,
          show: md`$\dfrac{${lin(A, B)}}{${b(1, p)}${b(1, q)}}$`,
          wrong: [`${a1 + a2}/((x+${p})(x+${q}))`.replace(/\+-/g, '-'), `${a1 + a2}/(2x+${p + q})`.replace(/\+-/g, '-')],
          hints: [md`Common denominator: $${b(1, p)}${b(1, q)}$.`, md`Numerator: $${a1}${b(1, q)} + ${a2}${b(1, p)}$. Expand and collect.`],
          steps: [md`$\dfrac{${a1}${b(1, q)} + ${a2}${b(1, p)}}{${b(1, p)}${b(1, q)}}$`, md`Numerator: $${lin(a1, a1 * q)} ${sterm(a2, 'x')} ${sterm(a2 * p)} = ${lin(A, B)}$`, md`$\dfrac{${lin(A, B)}}{${b(1, p)}${b(1, q)}}$`],
        };
      },
    },
    subtract: {
      level: 3, marks: 3, skill: 'Subtracting algebraic fractions',
      gen(r) {
        const a1 = r.int(2, 7); const a2 = r.int(1, 6); const [p, q] = r.distinct(2, -6, 6); if (!p || !q || a1 === a2) return this.gen(r);
        // a1/(x + p) - a2/(x + q) = (a1(x + q) - a2(x + p)) / ((x + p)(x + q))
        const A = a1 - a2; const B = a1 * q - a2 * p;
        if (B === 0) return this.gen(r);
        return {
          q: md`Write $\dfrac{${a1}}{${lin(1, p)}} - \dfrac{${a2}}{${lin(1, q)}}$ as a single fraction in its simplest form.`,
          a: { kind: 'expr', expr: `${a1}/(x+${p})-${a2}/(x+${q})`.replace(/\+-/g, '-'), form: 'fraction' },
          typed: `${plainB(A, B)}/(${plainB(1, p)}${plainB(1, q)})`,
          show: md`$\dfrac{${lin(A, B)}}{${b(1, p)}${b(1, q)}}$`,
          wrong: [`(${A}x+${a1 * q + a2 * p})/((x+${p})(x+${q}))`.replace(/\+-/g, '-')].filter(() => a2 * p !== 0),
          hints: [md`Common denominator: $${b(1, p)}${b(1, q)}$.`, md`Numerator: $${a1}${b(1, q)} - ${a2}${b(1, p)}$. Careful: the minus applies to **both** terms in the second bracket.`],
          steps: [md`$\dfrac{${a1}${b(1, q)} - ${a2}${b(1, p)}}{${b(1, p)}${b(1, q)}}$`, md`Numerator: $${lin(a1, a1 * q)} - ${a2 === 1 ? '' : a2}x ${sterm(-a2 * p)} = ${lin(A, B)}$`, md`$\dfrac{${lin(A, B)}}{${b(1, p)}${b(1, q)}}$`],
        };
      },
    },
    solve: {
      level: 3, marks: 4, skill: 'Solving an equation with algebraic fractions',
      gen(r) {
        for (;;) {
          const a1 = r.int(1, 6); const a2 = r.int(1, 6); const p = r.int(-4, 4); const q = r.int(-4, 4); if (p === q) continue;
          // a1/(x + p) + a2/(x + q) = 1  =>  x² + (p + q - a1 - a2)x + (pq - a1 q - a2 p) = 0
          const B = p + q - a1 - a2; const C = p * q - a1 * q - a2 * p;
          const D = B * B - 4 * C; if (D <= 0) continue;
          const sd = Math.sqrt(D); if (!Number.isInteger(sd)) continue;
          const r1 = (-B + sd) / 2; const r2 = (-B - sd) / 2;
          if (![r1, r2].every(Number.isInteger) || [r1, r2].some((x) => x === -p || x === -q)) continue;
          const den1 = p ? lin(1, p) : 'x'; const den2 = q ? lin(1, q) : 'x';
          const br1 = p ? `(${lin(1, p)})` : 'x'; const br2 = q ? `(${lin(1, q)})` : 'x';
          return {
            q: md`Solve $\dfrac{${a1}}{${den1}} + \dfrac{${a2}}{${den2}} = 1$.`,
            a: { kind: 'numbers', values: [r1, r2] },
            show: md`$x = ${r1}$ or $x = ${r2}$`,
            hints: [md`Multiply every term by $${br1}${br2}$.`, md`$${a1}${br2} + ${a2}${br1} = ${br1}${br2}$. Expand, then make one side zero.`],
            steps: [
              md`$${a1}${br2} + ${a2}${br1} = ${br1}${br2}$ **[M1]**`,
              md`$${poly([a1 * q + a2 * p, a1 + a2])} = ${poly([p * q, p + q, 1])}$ **[M1]**`,
              md`$${poly([C, B, 1])} = 0$ **[A1]**`,
              md`$(${lin(1, -r1)})(${lin(1, -r2)}) = 0$, so $x = ${r1}$ or $x = ${r2}$ **[A1]**`,
            ],
            verify: () => [r1, r2].every((x) => Math.abs(a1 / (x + p) + a2 / (x + q) - 1) < 1e-9) || 'roots do not satisfy the equation',
          };
        }
      },
    },
    simplifyHard: {
      level: 3, marks: 3, skill: 'Simplifying with a non-monic quadratic (grade 8)',
      gen(r) {
        for (;;) {
          const k = r.pick([2, 3]); const m = r.nz(-5, 5); const p = r.nz(-6, 6); const s = r.nz(-6, 6);
          if (gcd(k, Math.abs(m)) !== 1 || s === p || s === -p) continue;
          // (kx + m)(x + p) / ((x + p)(x + s))  or over (x + p)(x - p) when s = -p is excluded; use difference of two squares when chosen
          const dots = r.bool(); const s2 = dots ? -p : s;
          if (s2 === p) continue;
          const top = poly([m * p, k * p + m, k]); const bot = poly([p * s2, p + s2, 1]);
          return {
            q: md`Simplify fully $\dfrac{${top}}{${bot}}$.`,
            a: { kind: 'expr', expr: `${plainB(k, m)}/${plainB(1, s2)}`, form: 'cancelled' },
            typed: `${plainB(k, m)}/${plainB(1, s2)}`,
            show: md`$\dfrac{${lin(k, m)}}{${lin(1, s2)}}$`,
            hints: [md`Factorise the top: it has a factor of $${b(1, p)}$.`, dots ? md`The bottom is a difference of two squares.` : md`Factorise the bottom: two numbers that multiply to $${p * s2}$ and add to $${p + s2}$.`],
            steps: [md`Top: $${b(k, m)}${b(1, p)}$ **[M1]**`, md`Bottom: $${b(1, p)}${b(1, s2)}$ **[M1]**`, md`$\dfrac{${lin(k, m)}}{${lin(1, s2)}}$ **[A1]**`],
          };
        }
      },
    },
  },
};
