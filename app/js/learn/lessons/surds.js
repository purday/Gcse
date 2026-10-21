import { surdSimplify, surdTex, gcd, simplify } from '../engine.js';

const md = String.raw;
const plainSurd = (k, m) => (m === 1 ? String(k) : `${k === 1 ? '' : k === -1 ? '-' : k}√${m}`);
const NONSQ = [2, 3, 5, 6, 7];

export default {
  id: 'surds',
  title: 'Surds',
  subtitle: 'Simplifying, adding, multiplying, expanding, rationalising',
  topics: ['N8'],
  band: '7',
  calc: 'non-calc',
  minutes: 35,
  why: 'Surds are a grade 7 topic that appears on most non-calculator papers (2–4 marks), and exact answers with surds turn up in Pythagoras and trig questions too.',
  steps: [
    {
      kind: 'learn', title: 'The two rules',
      md: md`$$\sqrt{ab} = \sqrt{a} \times \sqrt{b} \qquad \sqrt{\frac{a}{b}} = \frac{\sqrt{a}}{\sqrt{b}}$$

and $\sqrt{a} \times \sqrt{a} = a$.

**Simplify** by finding the **largest square factor**:

$$\sqrt{50} = \sqrt{25 \times 2} = 5\sqrt{2} \qquad \sqrt{72} = \sqrt{36 \times 2} = 6\sqrt{2}$$`,
      key: 'Square numbers to look for: 4, 9, 16, 25, 36, 49, 64, 81, 100. Use the largest one that divides.',
    },
    { kind: 'try', template: 'simplify' },
    {
      kind: 'learn', title: 'Adding and multiplying',
      md: md`**Add** surds only when the number under the root matches (like terms):

$$\sqrt{50} + \sqrt{18} = 5\sqrt{2} + 3\sqrt{2} = 8\sqrt{2}$$

**Multiply** the numbers outside together and the roots together:

$$2\sqrt{3} \times 5\sqrt{6} = 10\sqrt{18} = 10 \times 3\sqrt{2} = 30\sqrt{2}$$`,
    },
    { kind: 'try', template: 'add' },
    {
      kind: 'example', title: 'Expanding brackets',
      q: md`Expand and simplify $(2 + \sqrt{3})(4 - \sqrt{3})$`,
      steps: [
        { md: md`$2 \times 4 = 8$, $\;2 \times (-\sqrt{3}) = -2\sqrt{3}$` },
        { md: md`$\sqrt{3} \times 4 = 4\sqrt{3}$, $\;\sqrt{3} \times (-\sqrt{3}) = -3$` },
        { md: md`$8 - 2\sqrt{3} + 4\sqrt{3} - 3 = 5 + 2\sqrt{3}$` },
      ],
      answer: md`$5 + 2\sqrt{3}$`,
    },
    { kind: 'try', template: 'expand' },
    {
      kind: 'learn', title: 'Rationalising the denominator',
      md: md`Remove the surd from the bottom of a fraction.

**Single surd**: multiply top and bottom by that surd.

$$\frac{6}{\sqrt{3}} = \frac{6\sqrt{3}}{3} = 2\sqrt{3}$$

**Grade 8: $a + \sqrt{b}$ on the bottom**: multiply top and bottom by $a - \sqrt{b}$ (difference of two squares).

$$\frac{4}{3 - \sqrt{5}} = \frac{4(3 + \sqrt{5})}{9 - 5} = 3 + \sqrt{5}$$`,
    },
    { kind: 'practice', title: 'Practice', templates: ['simplify', 'add', 'multiply', 'expand', 'rationalise'] },
    { kind: 'exam', template: 'conjugate' },
    {
      kind: 'recap',
      md: md`- $\sqrt{ab} = \sqrt a \sqrt b$; simplify using the largest square factor.
- Add only like surds. Multiply outsides together and roots together.
- $\sqrt a \times \sqrt a = a$.
- Rationalise $\frac{1}{\sqrt a}$ with $\sqrt a$; $\frac{1}{a + \sqrt b}$ with $a - \sqrt b$.`,
      mistakes: ['√50 = 25√2 (writing the square, not its root)', 'Adding √2 + √3 = √5', 'Multiplying only the top when rationalising'],
    },
  ],
  templates: {
    simplify: {
      level: 1, marks: 1, skill: 'Simplifying a surd',
      gen(r) {
        const k = r.int(2, 10); const m = r.pick(NONSQ); const n = k * k * m;
        return {
          q: md`Write $\sqrt{${n}}$ in the form $a\sqrt{b}$, where $b$ is as small as possible.`,
          a: { kind: 'surd', value: k * Math.sqrt(m), form: 'k√n' },
          typed: plainSurd(k, m),
          show: md`$${surdTex(k, m)}$`,
          wrong: [`${k * k}√${m}`],
          hints: [md`Find the largest square number that divides $${n}$.`, md`$${n} = ${k * k} \times ${m}$.`],
          steps: [md`$\sqrt{${n}} = \sqrt{${k * k} \times ${m}}$`, md`$= \sqrt{${k * k}} \times \sqrt{${m}} = ${surdTex(k, m)}$`],
        };
      },
    },
    add: {
      level: 2, marks: 2, skill: 'Adding and subtracting surds',
      gen(r) {
        const m = r.pick([2, 3, 5]); const [a, b] = r.distinct(2, 2, 7); const sub = r.bool(0.3);
        const tot = sub ? a - b : a + b;
        if (tot === 0) return this.gen(r);
        return {
          q: md`Simplify $\sqrt{${a * a * m}} ${sub ? '-' : '+'} \sqrt{${b * b * m}}$`,
          a: { kind: 'surd', value: tot * Math.sqrt(m), form: 'k√n' },
          typed: plainSurd(tot, m),
          show: md`$${surdTex(tot, m)}$`,
          wrong: [`√${a * a * m + (sub ? -1 : 1) * b * b * m}`],
          hints: [md`Simplify each surd first: both become multiples of $\sqrt{${m}}$.`],
          steps: [md`$\sqrt{${a * a * m}} = ${a}\sqrt{${m}}$ and $\sqrt{${b * b * m}} = ${b}\sqrt{${m}}$`, md`$${a}\sqrt{${m}} ${sub ? '-' : '+'} ${b}\sqrt{${m}} = ${surdTex(tot, m)}$`],
        };
      },
    },
    multiply: {
      level: 2, marks: 2, skill: 'Multiplying surds',
      gen(r) {
        const p = r.int(2, 5); const q = r.int(2, 5); const [x, y] = r.shuffle([2, 3, 5, 6, 7, 8, 10, 11, 12]).slice(0, 2);
        const [k, m] = surdSimplify(x * y);
        if (m === 1 || k === 1) return this.gen(r);
        return {
          q: md`Simplify $${p}\sqrt{${x}} \times ${q}\sqrt{${y}}$`,
          a: { kind: 'surd', value: p * q * Math.sqrt(x * y), form: 'k√n' },
          typed: plainSurd(p * q * k, m),
          show: md`$${surdTex(p * q * k, m)}$`,
          hints: [md`Multiply the outside numbers ($${p * q}$) and the roots ($\sqrt{${x * y}}$).`, md`Now simplify $\sqrt{${x * y}} = ${surdTex(k, m)}$.`],
          steps: [md`$${p * q}\sqrt{${x * y}}$`, md`$\sqrt{${x * y}} = ${surdTex(k, m)}$`, md`$= ${surdTex(p * q * k, m)}$`],
        };
      },
    },
    expand: {
      level: 2, marks: 2, skill: 'Expanding brackets with surds',
      gen(r) {
        const m = r.pick([2, 3, 5, 7]); const a = r.int(1, 6); const b = r.int(2, 7); const s1 = r.sign(); const s2 = r.sign();
        // (a + s1 √m)(b + s2 √m) = ab + s1 s2 m + (a s2 + b s1) √m
        const rational = a * b + s1 * s2 * m; const coef = a * s2 + b * s1;
        if (coef === 0) return this.gen(r);
        const tex = `${rational} ${coef < 0 ? '-' : '+'} ${surdTex(Math.abs(coef), m)}`;
        return {
          q: md`Expand and simplify $(${a} ${s1 < 0 ? '-' : '+'} \sqrt{${m}})(${b} ${s2 < 0 ? '-' : '+'} \sqrt{${m}})$`,
          a: { kind: 'surd', value: rational + coef * Math.sqrt(m), form: 'k√n' },
          typed: `${rational}${coef < 0 ? '-' : '+'}${plainSurd(Math.abs(coef), m)}`,
          show: md`$${tex}$`,
          hints: [md`Four multiplications, as with double brackets. $\sqrt{${m}} \times \sqrt{${m}} = ${m}$.`],
          steps: [md`$${a * b} ${s2 < 0 ? '-' : '+'} ${a === 1 ? '' : a}\sqrt{${m}} ${s1 < 0 ? '-' : '+'} ${b}\sqrt{${m}} ${s1 * s2 < 0 ? '-' : '+'} ${m}$`, md`$= ${tex}$`],
        };
      },
    },
    rationalise: {
      level: 3, marks: 2, skill: 'Rationalising a denominator',
      gen(r) {
        const m = r.pick([2, 3, 5, 6, 7]); const top = r.bool() ? m * r.int(1, 4) : r.int(1, 9);
        const [k, d] = simplify(top, m); // top/√m = top√m/m = (k/d)√m
        const showTex = d === 1 ? surdTex(k, m) : `\\frac{${k === 1 ? '' : k}\\sqrt{${m}}}{${d}}`;
        return {
          q: md`Rationalise the denominator of $\dfrac{${top}}{\sqrt{${m}}}$ and simplify.`,
          a: { kind: 'surd', value: top / Math.sqrt(m), form: 'rational-denominator' },
          typed: d === 1 ? plainSurd(k, m) : `${k === 1 ? '' : k}√${m}/${d}`,
          show: md`$${showTex}$`,
          hints: [md`Multiply the top and bottom by $\sqrt{${m}}$.`],
          steps: [md`$\dfrac{${top}}{\sqrt{${m}}} \times \dfrac{\sqrt{${m}}}{\sqrt{${m}}} = \dfrac{${top}\sqrt{${m}}}{${m}}$`, md`$= ${showTex}$`],
        };
      },
    },
    conjugate: {
      level: 3, marks: 3, skill: 'Rationalising a denominator of the form a ± √b',
      gen(r) {
        for (;;) {
          const a = r.int(2, 6); const b = r.pick([2, 3, 5, 6, 7, 10, 11]); const sgn = r.sign();
          const den = a * a - b; if (den === 0) continue;
          const top = den * r.pick([1, 2, 3]) * r.sign();
          const c = top / den; // result c(a ∓ √b) ... top/(a + s√b) = top (a - s√b)/den = c a - c s √b
          const rat = c * a; const sc = -c * sgn;
          return {
            q: md`Rationalise the denominator and simplify $\dfrac{${top}}{${a} ${sgn < 0 ? '-' : '+'} \sqrt{${b}}}$`,
            a: { kind: 'surd', value: top / (a + sgn * Math.sqrt(b)), form: 'rational-denominator' },
            typed: `${rat}${sc < 0 ? '-' : '+'}${plainSurd(Math.abs(sc), b)}`,
            show: md`$${rat} ${sc < 0 ? '-' : '+'} ${surdTex(Math.abs(sc), b)}$`,
            hints: [md`Multiply the top and bottom by $${a} ${sgn < 0 ? '+' : '-'} \sqrt{${b}}$.`, md`The bottom becomes $${a}^2 - ${b} = ${den}$.`],
            steps: [md`$\times \dfrac{${a} ${sgn < 0 ? '+' : '-'} \sqrt{${b}}}{${a} ${sgn < 0 ? '+' : '-'} \sqrt{${b}}}$ **[M1]**`, md`Bottom: $${a * a} - ${b} = ${den}$ **[M1]**`, md`$\dfrac{${top}(${a} ${sgn < 0 ? '+' : '-'} \sqrt{${b}})}{${den}} = ${rat} ${sc < 0 ? '-' : '+'} ${surdTex(Math.abs(sc), b)}$ **[A1]**`],
            verify: () => Math.abs(rat + sc * Math.sqrt(b) - top / (a + sgn * Math.sqrt(b))) < 1e-9 || 'wrong value',
          };
        }
      },
    },
  },
};
