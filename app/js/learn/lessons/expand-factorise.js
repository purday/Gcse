import { poly, lin, br, expandLinear, gcd, signed, sterm, lead } from '../engine.js';
import { equivalent } from '../expr.js';

const md = String.raw;
const mono = (k, v = 'x') => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);

export default {
  id: 'expand-factorise',
  title: 'Expanding and factorising',
  subtitle: 'Single, double and triple brackets; common factors; difference of two squares',
  topics: ['A4'],
  band: '4-5',
  calc: 'non-calc',
  minutes: 40,
  why: 'Expanding and factorising are the tools inside almost every algebra question: quadratics, rearranging, proof and algebraic fractions all need them. A Higher paper typically has 4–8 marks that test them directly.',
  steps: [
    {
      kind: 'learn', title: 'Expanding a single bracket',
      md: md`Multiply **every** term inside the bracket by the term outside.

$$3(2x - 5) = 6x - 15$$

Watch the signs when the outside term is negative:

$$-2(x - 4) = -2x + 8$$

because $-2 \times -4 = +8$.`,
      key: 'Expand → multiply out the brackets. Simplify → then collect like terms (x terms together, numbers together).',
    },
    {
      kind: 'example', title: 'Expand and simplify',
      q: md`Expand and simplify $3(2x - 5) - 2(x - 4)$`,
      steps: [
        { md: md`$3(2x - 5) = 6x - 15$` },
        { md: md`$-2(x - 4) = -2x + 8$`, why: 'The minus belongs to the 2: minus times minus is plus.' },
        { md: md`$6x - 15 - 2x + 8$` },
        { md: md`$= 4x - 7$`, why: '6x − 2x = 4x and −15 + 8 = −7.' },
      ],
      answer: md`$4x - 7$`,
    },
    { kind: 'try', template: 'expandSingle' },
    {
      kind: 'learn', title: 'Expanding double brackets',
      md: md`Every term in the first bracket multiplies every term in the second: **4 multiplications**. A grid keeps it tidy:

| $\times$ | $x$ | $+4$ |
|---|---|---|
| $2x$ | $2x^2$ | $+8x$ |
| $-3$ | $-3x$ | $-12$ |

So $(2x - 3)(x + 4) = 2x^2 + 8x - 3x - 12 = 2x^2 + 5x - 12$.`,
      key: md`$(x + 5)^2$ means $(x + 5)(x + 5) = x^2 + 10x + 25$. It is **not** $x^2 + 25$.`,
    },
    {
      kind: 'example', title: 'Squaring a bracket',
      q: md`Expand and simplify $(3x - 2)^2$`,
      steps: [
        { md: md`$(3x - 2)(3x - 2)$`, why: 'Write it out as two brackets first.' },
        { md: md`$9x^2 - 6x - 6x + 4$`, why: '3x × 3x, 3x × −2, −2 × 3x, −2 × −2.' },
        { md: md`$= 9x^2 - 12x + 4$` },
      ],
      answer: md`$9x^2 - 12x + 4$`,
    },
    { kind: 'try', template: 'expandDouble' },
    {
      kind: 'learn', title: 'Factorising: take out the highest common factor',
      md: md`Factorising is expanding **backwards**. Find the HCF of the numbers **and** the letters, put it outside, and divide each term by it.

$$12x^2y - 8xy^2 = 4xy(3x - 2y)$$

Check by expanding: $4xy \times 3x = 12x^2y$ ✓ and $4xy \times -2y = -8xy^2$ ✓.

"Factorise **fully**" means nothing more can come out: $x(6x - 9)$ is not fully factorised, $3x(2x - 3)$ is.`,
    },
    { kind: 'try', template: 'factoriseCommon' },
    {
      kind: 'learn', title: 'Factorising quadratics and the difference of two squares',
      md: md`**$x^2 + bx + c$**: two numbers that multiply to $c$ and add to $b$.

$$x^2 - 2x - 15 = (x - 5)(x + 3)$$

**Difference of two squares** (no middle term, a minus between two squares):

$$a^2 - b^2 = (a + b)(a - b)$$

$$x^2 - 49 = (x + 7)(x - 7) \qquad 4x^2 - 25 = (2x + 5)(2x - 5)$$`,
      key: md`$x^2 + 49$ does **not** factorise. It has to be a **minus**.`,
    },
    {
      kind: 'example', title: 'Factorise ax² + bx + c',
      q: md`Factorise $3x^2 + 10x - 8$`,
      steps: [
        { md: md`$a \times c = 3 \times (-8) = -24$. Numbers that multiply to $-24$ and add to $10$: $12$ and $-2$.` },
        { md: md`$3x^2 + 12x - 2x - 8$`, why: 'Split the middle term using the two numbers.' },
        { md: md`$3x(x + 4) - 2(x + 4)$`, why: 'Factorise each pair. The matching bracket is the check.' },
        { md: md`$(3x - 2)(x + 4)$` },
      ],
      answer: md`$(3x - 2)(x + 4)$`,
    },
    { kind: 'try', template: 'dots' },
    { kind: 'practice', title: 'Practice', templates: ['expandSingle', 'expandDouble', 'expandSquare', 'factoriseCommon', 'factoriseQuad', 'dots', 'factoriseNonMonic'] },
    { kind: 'exam', template: 'expandTriple' },
    {
      kind: 'recap',
      md: md`- Expanding: every term times every term; watch minus signs.
- $(a + b)^2 = a^2 + 2ab + b^2$, never just $a^2 + b^2$.
- Factorising: HCF of numbers **and** letters; check by expanding.
- Quadratics: multiply to $c$, add to $b$. With a number in front of $x^2$, split the middle term.
- Difference of two squares: $a^2 - b^2 = (a + b)(a - b)$.`,
      mistakes: ['−2(x − 4) written as −2x − 8', '(x + 5)² written as x² + 25', 'Not taking out the full HCF (factorise fully)', 'Trying to factorise x² + 49'],
    },
  ],
  templates: {
    expandSingle: {
      level: 1, marks: 2, skill: 'Expanding and simplifying single brackets',
      gen(r) {
        const a = r.int(2, 6); const b = r.nz(-6, 6); const c = r.nz(-5, 5); const d = r.nz(-7, 7);
        const X = a * 1 + c; const K = a * b + c * d;
        if (X === 0) return this.gen(r);
        return {
          q: md`Expand and simplify $${a}(${lin(1, b)}) ${c < 0 ? '-' : '+'} ${Math.abs(c)}(${lin(1, d)})$`,
          a: { kind: 'expr', expr: poly([K, X]), form: 'simplified' },
          typed: poly([K, X], 'x', false),
          show: md`$${poly([K, X])}$`,
          hints: [md`Expand each bracket separately: $${a}(${lin(1, b)}) = ${poly([a * b, a])}$.`, md`The second bracket gives $${poly([c * d, c])}$. Now collect the $x$ terms and the numbers.`],
          steps: [md`$${a}(${lin(1, b)}) = ${poly([a * b, a])}$`, md`$${c}(${lin(1, d)}) = ${poly([c * d, c])}$`, md`$${poly([a * b, a])} ${sterm(c, 'x')} ${sterm(c * d)}$`, md`$= ${poly([K, X])}$`],
          verify: (i) => equivalent(`${a}(x+${b})+${c}(x+${d})`, i.typed) || 'not equivalent',
        };
      },
    },
    expandDouble: {
      level: 1, marks: 2, skill: 'Expanding double brackets',
      gen(r) {
        const a = r.pick([1, 1, 2, 3]); const b = r.nz(-7, 7); const c = r.pick([1, 1, 2]); const d = r.nz(-7, 7);
        const co = expandLinear(a, b, c, d);
        if (co[1] === 0) return this.gen(r);
        return {
          q: md`Expand and simplify $(${lin(a, b)})(${lin(c, d)})$`,
          a: { kind: 'expr', expr: poly(co), form: 'simplified' },
          typed: poly(co, 'x', false),
          show: md`$${poly(co)}$`,
          hints: [md`Four multiplications: first × first, first × second, second × first, second × second.`, md`You should get $${poly([0, 0, a * c])} ${sterm(a * d, 'x')} ${sterm(b * c, 'x')} ${sterm(b * d)}$ before collecting.`],
          steps: [md`$${poly([0, 0, a * c])} ${sterm(a * d, 'x')} ${sterm(b * c, 'x')} ${sterm(b * d)}$`, md`$= ${poly(co)}$`],
          verify: (i) => equivalent(`(${a}x+${b})(${c}x+${d})`, i.typed) || 'not equivalent',
        };
      },
    },
    expandSquare: {
      level: 2, marks: 2, skill: 'Squaring a bracket',
      gen(r) {
        const a = r.pick([1, 2, 3]); const b = r.nz(-6, 6);
        const co = expandLinear(a, b, a, b);
        return {
          q: md`Expand and simplify $(${lin(a, b)})^2$`,
          a: { kind: 'expr', expr: poly(co), form: 'simplified' },
          typed: poly(co, 'x', false),
          show: md`$${poly(co)}$`,
          wrong: [poly([b * b, 0, a * a], 'x', false)],
          hints: [md`Write it as $(${lin(a, b)})(${lin(a, b)})$.`, md`The middle term is $2 \times ${lead(a, 'x')} \times ${br(b)} = ${2 * a * b}x$.`],
          steps: [md`$(${lin(a, b)})(${lin(a, b)})$`, md`$${poly([0, 0, a * a])} ${sterm(a * b, 'x')} ${sterm(a * b, 'x')} ${sterm(b * b)}$`, md`$= ${poly(co)}$`],
          diagnose: (input) => (/\(/.test(input) ? undefined : equivalent(input.replace(/\s/g, ''), poly([b * b, 0, a * a], 'x', false)) ? 'You have missed the middle term: (a + b)² = a² + 2ab + b².' : undefined),
        };
      },
    },
    factoriseCommon: {
      level: 2, marks: 2, skill: 'Factorising fully with a common factor',
      gen(r) {
        const form = r.pick(['x', 'xy']);
        if (form === 'x') {
          const k = r.int(2, 6); const p = r.int(1, 5); const q = r.nz(-7, 7);
          if (gcd(p, Math.abs(q)) !== 1) return this.gen(r);
          // kx(px + q)
          const A = k * p; const B = k * q;
          return {
            q: md`Factorise fully $${poly([0, B, A])}$`,
            a: { kind: 'expr', expr: `${A}x^2+${B}x`, form: 'factorised' },
            typed: `${k}x(${lin(1 * p, q).replace(/\s/g, '')})`,
            show: md`$${k}x(${lin(p, q)})$`,
            wrong: [`x(${A}x+${B})`],
            hints: [md`The HCF of $${A}$ and $${Math.abs(B)}$ is $${k}$, and both terms contain $x$.`, md`Take $${k}x$ outside: $${k}x(\dots)$.`],
            steps: [md`HCF of the numbers: $${k}$. Both terms have an $x$.`, md`$${poly([0, B, A])} = ${k}x(${lin(p, q)})$`, md`Check: $${k}x \times ${mono(p)} = ${A}x^2$ ✓`],
            verify: (i) => equivalent(i.typed, `${A}x^2+${B}x`) || 'bad',
          };
        }
        const k = r.int(2, 5); const p = r.int(1, 4); const q = r.int(1, 4) * r.sign();
        if (gcd(p, Math.abs(q)) !== 1) return this.gen(r);
        // k xy (p x + q y)
        const A = k * p; const B = k * q;
        return {
          q: md`Factorise fully $${A}x^2y ${B < 0 ? '-' : '+'} ${Math.abs(B)}xy^2$`,
          a: { kind: 'expr', expr: `${A}x^2y+${B}xy^2`, form: 'factorised', vars: ['x', 'y'] },
          typed: `${k}xy(${p === 1 ? '' : p}x${q < 0 ? '-' : '+'}${Math.abs(q) === 1 ? '' : Math.abs(q)}y)`,
          show: md`$${k}xy(${p === 1 ? '' : p}x ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}y)$`,
          wrong: [`xy(${A}x+${B}y)`],
          hints: [md`HCF of the numbers is $${k}$; both terms contain $x$ **and** $y$.`, md`Take out $${k}xy$.`],
          steps: [md`HCF: $${k}$, and $x$ and $y$ are in both terms.`, md`$= ${k}xy(${p === 1 ? '' : p}x ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}y)$`],
        };
      },
    },
    factoriseQuad: {
      level: 2, marks: 2, skill: 'Factorising x² + bx + c',
      gen(r) {
        const p = r.nz(-9, 9); const q = r.nz(-9, 9);
        if (p + q === 0 || p === q) return this.gen(r);
        const co = [p * q, p + q, 1];
        return {
          q: md`Factorise $${poly(co)}$`,
          a: { kind: 'expr', expr: poly(co, 'x', false), form: 'factorised' },
          typed: `(x${p < 0 ? '' : '+'}${p})(x${q < 0 ? '' : '+'}${q})`,
          show: md`$(${lin(1, p)})(${lin(1, q)})$`,
          hints: [md`Two numbers that multiply to $${p * q}$ and add to $${p + q}$.`, md`They are $${p}$ and $${q}$.`],
          steps: [md`Multiply to $${p * q}$, add to $${p + q}$: $${p}$ and $${q}$.`, md`$(${lin(1, p)})(${lin(1, q)})$`],
        };
      },
    },
    dots: {
      level: 2, marks: 1, skill: 'Difference of two squares',
      gen(r) {
        const a = r.pick([1, 1, 2, 3, 4, 5]); const b = r.int(2, 11);
        if (gcd(a, b) !== 1) return this.gen(r);
        return {
          q: md`Factorise $${poly([-b * b, 0, a * a])}$`,
          a: { kind: 'expr', expr: `${a * a}x^2-${b * b}`, form: 'factorised' },
          typed: `(${a === 1 ? '' : a}x+${b})(${a === 1 ? '' : a}x-${b})`,
          show: md`$(${lin(a, b)})(${lin(a, -b)})$`,
          hints: [md`It is a square minus a square: $(${a === 1 ? 'x' : `${a}x`})^2 - ${b}^2$.`, md`$a^2 - b^2 = (a + b)(a - b)$.`],
          steps: [md`$${poly([-b * b, 0, a * a])} = (${a === 1 ? 'x' : `${a}x`})^2 - ${b}^2$`, md`$= (${lin(a, b)})(${lin(a, -b)})$`],
        };
      },
    },
    factoriseNonMonic: {
      level: 3, marks: 2, skill: 'Factorising ax² + bx + c',
      gen(r) {
        const a = r.pick([2, 3, 5]); const m = r.nz(-7, 7); const n = r.nz(-6, 6);
        if (gcd(a, Math.abs(m)) !== 1) return this.gen(r);
        const co = [m * n, a * n + m, a];
        if (co[1] === 0) return this.gen(r);
        return {
          q: md`Factorise $${poly(co)}$`,
          a: { kind: 'expr', expr: poly(co, 'x', false), form: 'factorised' },
          typed: `(${a}x${m < 0 ? '' : '+'}${m})(x${n < 0 ? '' : '+'}${n})`,
          show: md`$(${lin(a, m)})(${lin(1, n)})$`,
          hints: [md`$a \times c = ${a * m * n}$. Find two numbers that multiply to $${a * m * n}$ and add to $${co[1]}$.`, md`The numbers are $${a * n}$ and $${m}$. Split the middle term and factorise in pairs.`],
          steps: [md`$ac = ${a * m * n}$: the numbers are $${a * n}$ and $${m}$.`, md`$${a}x^2 ${sterm(a * n, 'x')} ${sterm(m, 'x')} ${sterm(m * n)}$`, md`$${a}x(${lin(1, n)}) ${sterm(m)}(${lin(1, n)})$`, md`$(${lin(a, m)})(${lin(1, n)})$`],
        };
      },
    },
    expandTriple: {
      level: 3, marks: 3, skill: 'Expanding three brackets',
      gen(r) {
        const [p, q, s] = r.distinct(3, -5, 5, [0]);
        let co = expandLinear(1, p, 1, q);
        co = [co[0] * s, co[0] + co[1] * s, co[1] + co[2] * s, co[2]];
        return {
          q: md`Show that $(x ${signed(p)})(x ${signed(q)})(x ${signed(s)})$ can be written as $x^3 + ax^2 + bx + c$, where $a$, $b$ and $c$ are integers.

Type the expanded cubic.`,
          a: { kind: 'expr', expr: poly(co, 'x', false), form: 'simplified' },
          typed: poly(co, 'x', false),
          show: md`$${poly(co)}$`,
          hints: [md`Expand the first two brackets: $(x ${signed(p)})(x ${signed(q)}) = ${poly(expandLinear(1, p, 1, q))}$.`, md`Now multiply each of those three terms by $x$ and by $${s}$, then collect like terms.`],
          steps: [
            md`$(x ${signed(p)})(x ${signed(q)}) = ${poly(expandLinear(1, p, 1, q))}$ **[M1]**`,
            md`$(${poly(expandLinear(1, p, 1, q))})(x ${signed(s)})$: multiply every term by $x$, then by $${s}$ **[M1]**`,
            md`$= ${poly(co)}$ **[A1]**`,
          ],
          verify: (i) => equivalent(`(x+${p})(x+${q})(x+${s})`, i.typed) || 'cubic wrong',
        };
      },
    },
  },
};
