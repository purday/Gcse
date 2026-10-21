import { dp, poly } from '../engine.js';

const md = String.raw;

// Two families of convergent iteration formulas, each tied to the equation it solves.
function family(r) {
  for (;;) {
    if (r.bool()) {
      // x³ + mx − k = 0  ⇔  x = ∛(k − mx)
      const m = r.int(1, 4); const k = r.int(3, 16);
      const f = (x) => Math.cbrt(k - m * x);
      const root = settle(f, 1.5); if (root == null || root < 0.6 || tooNeat(root)) continue;
      return { f, root, eq: md`x^3 ${m === 1 ? '+ x' : `+ ${m}x`} - ${k} = 0`, it: md`x_{n+1} = \sqrt[3]{${k} - ${m === 1 ? '' : m}x_n}`, g: (x) => x ** 3 + m * x - k, wrongIt: md`x_{n+1} = \sqrt[3]{${m === 1 ? '' : m}x_n - ${k}}`, alt: md`x_{n+1} = \sqrt[3]{${k} + ${m === 1 ? '' : m}x_n}` };
    }
    // x² − px − q = 0  ⇔  x = p + q/x
    const p = r.int(1, 5); const q = r.int(2, 12);
    const f = (x) => p + q / x;
    const root = settle(f, p + 1); if (root == null || tooNeat(root)) continue;
    return { f, root, eq: md`${poly([-q, -p, 1])} = 0`, it: md`x_{n+1} = ${p} + \dfrac{${q}}{x_n}`, g: (x) => x * x - p * x - q, wrongIt: md`x_{n+1} = ${p} - \dfrac{${q}}{x_n}`, alt: md`x_{n+1} = \dfrac{${q}}{x_n} - ${p}` };
  }
}
// Roots that land on a whole or half number make the iteration trivial from x₁.
const tooNeat = (root) => Math.abs(root - Math.round(root * 2) / 2) < 0.05;
function settle(f, x) {
  for (let i = 0; i < 200; i++) { const n = f(x); if (!Number.isFinite(n)) return null; if (Math.abs(n - x) < 1e-12) return n; x = n; }
  return null;
}

export default {
  id: 'iteration',
  title: 'Iteration',
  subtitle: 'Iterative formulas, sign changes, rearranging',
  topics: ['A20'],
  band: '7',
  calc: 'calc',
  minutes: 25,
  why: 'Iteration is Higher-only and almost always on Paper 2 or 3 for 3–4 marks. With a calculator\'s ANS key it is one of the easiest grade 7 questions.',
  steps: [
    {
      kind: 'learn', title: 'Using an iterative formula',
      md: md`An iterative formula like $x_{n+1} = \sqrt[3]{9 - 2x_n}$ takes one value and gives the next.

On a calculator:

1. Type the starting value $x_1$ and press **=**.
2. Type the formula using **ANS** for $x_n$: $\sqrt[3]{9 - 2\,\text{ANS}}$.
3. Press **=** once for $x_2$, again for $x_3$, and so on.

Write each value down. Do not round until the very end.`,
      key: 'Using ANS keeps every digit, so rounding errors cannot build up.',
    },
    { kind: 'try', template: 'iterate' },
    {
      kind: 'learn', title: 'Showing a solution lies between two values',
      md: md`If $f(x)$ changes sign between $x = a$ and $x = b$, there is a solution between them (the graph crosses zero).

For $x^3 + 2x - 9 = 0$: when $x = 1$, $1 + 2 - 9 = -6$ (negative); when $x = 2$, $8 + 4 - 9 = 3$ (positive). There is a sign change, so a solution lies between 1 and 2.`,
      key: 'Write both values AND the words "sign change, so there is a solution between a and b".',
    },
    { kind: 'try', template: 'signChange' },
    {
      kind: 'learn', title: 'Rearranging to an iterative formula',
      md: md`$x^3 + 2x - 9 = 0$

$x^3 = 9 - 2x$

$x = \sqrt[3]{9 - 2x}$

So the iterative formula is $x_{n+1} = \sqrt[3]{9 - 2x_n}$. The values $x_1, x_2, x_3, \dots$ get closer to the solution.`,
    },
    { kind: 'try', template: 'rearrange' },
    { kind: 'practice', title: 'Practice', templates: ['iterate', 'signChange', 'rearrange', 'iterateFurther'] },
    { kind: 'exam', template: 'iterateFurther' },
    {
      kind: 'recap',
      md: md`- Start value, then the formula with ANS, press = for each new value.
- A sign change between $a$ and $b$ means a solution between them; say so in words.
- Rearrange the equation so $x$ is alone on one side to get the formula.`,
      mistakes: ['Rounding each value before using it again', 'Calling x₁ the first value you work out (x₁ is the starting value)', 'Not writing the conclusion for a sign change'],
    },
  ],
  templates: {
    iterate: {
      level: 2, marks: 3, skill: 'Using an iterative formula',
      gen(r) {
        const F = family(r); const x1 = Math.round(F.root * 2) / 2 || 1;
        const x2 = F.f(x1); const x3 = F.f(x2);
        return {
          q: md`Use the iterative formula $${F.it}$ with $x_1 = ${x1}$ to work out $x_3$.

Give your answer to 3 decimal places.`,
          a: { kind: 'number', value: x3, dp: 3 },
          show: md`$x_3 = ${dp(x3, 3)}$`,
          wrong: [dp(x2, 3)].filter((w) => w !== dp(x3, 3)),
          hints: [md`$x_2$ comes from putting $x_1 = ${x1}$ into the formula. Then put $x_2$ in to get $x_3$.`, md`On a calculator: type $${x1}$, press =, then type the formula with ANS and press = twice.`],
          steps: [md`$x_2 = ${dp(x2, 6)}\dots$`, md`$x_3 = ${dp(x3, 6)}\dots$`, md`$x_3 = ${dp(x3, 3)}$ (3 d.p.)`],
        };
      },
    },
    iterateFurther: {
      level: 3, marks: 3, skill: 'Iterating to estimate a solution',
      gen(r) {
        const F = family(r); const x1 = Math.round(F.root) || 1;
        const xs = [x1]; for (let i = 0; i < 3; i++) xs.push(F.f(xs.at(-1)));
        return {
          q: md`Use $${F.it}$ with $x_1 = ${x1}$ to find $x_4$, an estimate of a solution of $${F.eq}$.

Give $x_4$ to 4 decimal places.`,
          a: { kind: 'number', value: xs[3], dp: 4 },
          show: md`$x_4 = ${dp(xs[3], 4)}$`,
          wrong: [dp(xs[2], 4)].filter((w) => w !== dp(xs[3], 4)),
          hints: [md`Three presses of = after entering the formula: $x_2$, $x_3$, $x_4$.`],
          steps: [md`$x_2 = ${dp(xs[1], 6)}\dots$ **[M1]**`, md`$x_3 = ${dp(xs[2], 6)}\dots$`, md`$x_4 = ${dp(xs[3], 6)}\dots$ **[A1]**`, md`$x_4 = ${dp(xs[3], 4)}$ (4 d.p.) **[A1]**`],
        };
      },
    },
    signChange: {
      level: 2, marks: 2, skill: 'Sign change to locate a solution',
      gen(r) {
        const F = family(r); const a = Math.floor(F.root); const b = a + 1;
        const ga = F.g(a); const gb = F.g(b);
        if (ga === 0 || gb === 0 || a <= 0) return this.gen(r);
        return {
          q: md`Show that $${F.eq}$ has a solution between $x = ${a}$ and $x = ${b}$.

Work out the value of the left-hand side when $x = ${a}$ and when $x = ${b}$.`,
          a: { kind: 'multi', parts: [{ label: `$x = ${a}$:`, spec: { kind: 'number', value: ga } }, { label: `$x = ${b}$:`, spec: { kind: 'number', value: gb } }] },
          show: md`$${ga}$ and $${gb}$: a sign change, so there is a solution between $${a}$ and $${b}$`,
          hints: [md`Substitute $x = ${a}$ into $${F.eq.replace(' = 0', '')}$.`],
          steps: [md`$x = ${a}$: $${ga}$ (${ga < 0 ? 'negative' : 'positive'})`, md`$x = ${b}$: $${gb}$ (${gb < 0 ? 'negative' : 'positive'})`, md`Sign change, so there is a solution between $${a}$ and $${b}$.`],
          verify: () => ga * gb < 0 || 'no sign change',
        };
      },
    },
    rearrange: {
      level: 2, marks: 2, skill: 'Rearranging an equation into an iterative formula',
      gen(r) {
        const F = family(r);
        const opts = [`$${F.it}$`, `$${F.wrongIt}$`, `$${F.alt}$`];
        const order = r.shuffle([0, 1, 2]);
        return {
          q: md`Which iterative formula comes from rearranging $${F.eq}$?`,
          a: { kind: 'choice', options: order.map((i) => opts[i]), correct: order.indexOf(0) },
          show: opts[0],
          hints: [md`Keep one $x$ term on its own and move everything else to the other side. Watch the signs.`],
          steps: [md`Rearrange $${F.eq}$ carefully: ${opts[0]}`],
        };
      },
    },
  },
};
