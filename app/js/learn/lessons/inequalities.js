import { lead, sterm, fracTex, simplify } from '../engine.js';
import { numberLine } from '../diagrams.js';

const md = String.raw;
const sym = (inc, dir) => (dir === '<' ? (inc ? '\\le' : '<') : inc ? '\\ge' : '>');

export default {
  id: 'inequalities',
  title: 'Inequalities',
  subtitle: 'Solving, number lines, integer solutions, quadratic inequalities',
  topics: ['A22'],
  band: '6',
  calc: 'non-calc',
  minutes: 30,
  why: 'Linear inequalities are quick 2–3 mark questions; quadratic inequalities and regions are grade 7–8 questions that many students skip.',
  steps: [
    {
      kind: 'learn', title: 'Symbols and number lines',
      md: md`| Symbol | Means | Number line |
|---|---|---|
| $x > 3$ | more than 3 | open circle at 3, arrow right |
| $x \ge 3$ | 3 or more | **filled** circle at 3, arrow right |
| $x < -1$ | less than −1 | open circle, arrow left |
| $-2 < x \le 4$ | between | open at −2, filled at 4 |

**Filled** circle = the number is included (≤ or ≥).`,
      diagram: numberLine({ min: -3, max: 5, lo: -2, loInc: false, hi: 4, hiInc: true }),
    },
    {
      kind: 'learn', title: 'Solving: just like an equation, with one rule',
      md: md`Do the same to both sides. **If you multiply or divide by a negative number, flip the sign.**

$$5 - 3x < 11 \;\Rightarrow\; -3x < 6 \;\Rightarrow\; x > -2$$

(Dividing by $-3$ flipped $<$ to $>$.) Check with a number: $x = 0$ gives $5 < 11$ ✓.`,
      key: 'To avoid the flip, move the x term to the side where it stays positive: 5 − 3x < 11 → 5 − 11 < 3x → −6 < 3x → −2 < x.',
    },
    { kind: 'try', template: 'linear' },
    {
      kind: 'example', title: 'Double inequality and integers',
      q: md`Solve $-3 < 2x + 1 \le 9$ and list the integers that satisfy it.`,
      steps: [
        { md: md`Subtract 1 from all three parts: $-4 < 2x \le 8$` },
        { md: md`Divide all three parts by 2: $-2 < x \le 4$` },
        { md: md`Integers: $-1, 0, 1, 2, 3, 4$`, why: '−2 is not included (strictly greater), 4 is included (≤).' },
      ],
      answer: md`$-2 < x \le 4$; integers $-1, 0, 1, 2, 3, 4$`,
    },
    { kind: 'try', template: 'integers' },
    {
      kind: 'learn', title: 'Quadratic inequalities (grade 7–8)',
      md: md`Solve the equation to find the **critical values**, then sketch the parabola.

$x^2 - x - 6 < 0$: $(x - 3)(x + 2) = 0$ gives $x = 3$ and $x = -2$.

The graph is a ∪ shape, **below** the x-axis between the roots, so:

- $x^2 - x - 6 < 0$ ⟹ $-2 < x < 3$ (between)
- $x^2 - x - 6 > 0$ ⟹ $x < -2$ **or** $x > 3$ (outside)`,
      key: md`$x^2 < 9$ means $-3 < x < 3$, **not** just $x < 3$.`,
    },
    { kind: 'practice', title: 'Practice', templates: ['linear', 'flip', 'readLine', 'double', 'integers', 'quadratic'] },
    { kind: 'exam', template: 'quadratic' },
    {
      kind: 'recap',
      md: md`- Solve like an equation; **flip the sign** when multiplying or dividing by a negative.
- Number lines: filled circle for ≤/≥, open for </>.
- Double inequalities: do the same to all three parts.
- Quadratic: find the roots, sketch; "< 0" is between the roots, "> 0" is outside.`,
      mistakes: ['Not flipping the sign when dividing by a negative', 'Including an end point that is strict (< or >)', 'Writing x < 3 for x² < 9'],
    },
  ],
  templates: {
    linear: {
      level: 1, marks: 2, skill: 'Solving a linear inequality',
      gen(r) {
        const a = r.int(2, 7); const x = r.int(-6, 9); const b = r.nz(-9, 9);
        const dir = r.pick(['<', '>']); const inc = r.bool();
        const c = a * x + b;
        return {
          q: md`Solve $${lead(a, 'x')} ${sterm(b)} ${sym(inc, dir)} ${c}$`,
          a: { kind: 'inequality', v: 'x', ...(dir === '<' ? { hi: x, hiInc: inc } : { lo: x, loInc: inc }) },
          show: md`$x ${sym(inc, dir)} ${x}$`,
          hints: [md`${b > 0 ? 'Subtract' : 'Add'} $${Math.abs(b)}$ on both sides, then divide by $${a}$.`],
          steps: [md`$${lead(a, 'x')} ${sym(inc, dir)} ${c - b}$`, md`$x ${sym(inc, dir)} ${x}$`],
        };
      },
    },
    flip: {
      level: 2, marks: 2, skill: 'Inequalities with a negative x term',
      gen(r) {
        const a = r.int(2, 6); const x = r.int(-5, 6); const k = r.int(2, 15);
        const dir = r.pick(['<', '>']); const inc = r.bool();
        // k - a x  dir  k - a*x0   => -a x dir -a x0 => x flip x0
        const c = k - a * x;
        const flipDir = dir === '<' ? '>' : '<';
        return {
          q: md`Solve $${k} - ${a}x ${sym(inc, dir)} ${c}$`,
          a: { kind: 'inequality', v: 'x', ...(flipDir === '<' ? { hi: x, hiInc: inc } : { lo: x, loInc: inc }) },
          show: md`$x ${sym(inc, flipDir)} ${x}$`,
          wrong: [`x ${dir}${inc ? '=' : ''} ${x}`],
          hints: [md`Subtract $${k}$ from both sides: $-${a}x ${sym(inc, dir)} ${c - k}$.`, md`Dividing by $-${a}$ **flips** the sign.`],
          steps: [md`$-${a}x ${sym(inc, dir)} ${c - k}$`, md`Divide by $-${a}$ and flip: $x ${sym(inc, flipDir)} ${x}$`],
        };
      },
    },
    double: {
      level: 2, marks: 2, skill: 'Solving a double inequality',
      gen(r) {
        const a = r.int(2, 5); const b = r.nz(-6, 6); const lo = r.int(-5, 1); const hi = r.int(lo + 2, lo + 7);
        const loInc = r.bool(); const hiInc = r.bool();
        return {
          q: md`Solve $${a * lo + b} ${loInc ? '\\le' : '<'} ${lead(a, 'x')} ${sterm(b)} ${hiInc ? '\\le' : '<'} ${a * hi + b}$`,
          a: { kind: 'inequality', v: 'x', lo, loInc, hi, hiInc },
          show: md`$${lo} ${loInc ? '\\le' : '<'} x ${hiInc ? '\\le' : '<'} ${hi}$`,
          hints: [md`Do the same to all three parts: ${b > 0 ? 'subtract' : 'add'} $${Math.abs(b)}$, then divide by $${a}$.`],
          steps: [md`$${a * lo} ${loInc ? '\\le' : '<'} ${a}x ${hiInc ? '\\le' : '<'} ${a * hi}$`, md`$${lo} ${loInc ? '\\le' : '<'} x ${hiInc ? '\\le' : '<'} ${hi}$`],
        };
      },
    },
    integers: {
      level: 2, marks: 2, skill: 'Listing integers that satisfy an inequality',
      gen(r) {
        const lo = r.int(-4, 2); const hi = r.int(lo + 2, lo + 5); const loInc = r.bool(); const hiInc = r.bool();
        const vals = [];
        for (let v = lo; v <= hi; v++) if ((v > lo || loInc) && (v < hi || hiInc)) vals.push(v);
        const k = r.int(2, 4);
        return {
          q: md`$n$ is an integer. List all the values of $n$ such that $${k * lo} ${loInc ? '\\le' : '<'} ${k}n ${hiInc ? '\\le' : '<'} ${k * hi}$`,
          a: { kind: 'numbers', values: vals },
          show: md`$${vals.join(', ')}$`,
          wrong: [[...vals, hi + (hiInc ? 1 : 0)].join(', ')],
          hints: [md`Divide all parts by $${k}$: $${lo} ${loInc ? '\\le' : '<'} n ${hiInc ? '\\le' : '<'} ${hi}$.`, `Include an end number only if its sign is ≤.`],
          steps: [md`$${lo} ${loInc ? '\\le' : '<'} n ${hiInc ? '\\le' : '<'} ${hi}$`, md`${loInc ? `$${lo}$ is included` : `$${lo}$ is not included`}; ${hiInc ? `$${hi}$ is included` : `$${hi}$ is not included`}.`, md`$n = ${vals.join(', ')}$`],
        };
      },
    },
    readLine: {
      level: 1, marks: 1, skill: 'Reading an inequality from a number line',
      gen(r) {
        const lo = r.int(-4, 1); const hi = r.int(lo + 1, lo + 5); const loInc = r.bool(); const hiInc = r.bool();
        return {
          q: md`Write down the inequality shown on the number line.`,
          diagram: numberLine({ min: lo - 2, max: hi + 2, lo, loInc, hi, hiInc }),
          a: { kind: 'inequality', v: 'x', lo, loInc, hi, hiInc },
          show: md`$${lo} ${loInc ? '\\le' : '<'} x ${hiInc ? '\\le' : '<'} ${hi}$`,
          placeholder: 'e.g. -2 < x <= 4',
          hints: ['Filled circle = included (≤). Open circle = not included (<).'],
          steps: [md`Left end $${lo}$: ${loInc ? 'filled, so ≤' : 'open, so <'}. Right end $${hi}$: ${hiInc ? 'filled, so ≤' : 'open, so <'}.`, md`$${lo} ${loInc ? '\\le' : '<'} x ${hiInc ? '\\le' : '<'} ${hi}$`],
        };
      },
    },
    quadratic: {
      level: 3, marks: 3, skill: 'Solving a quadratic inequality',
      gen(r) {
        const [p, q] = r.distinct(2, -6, 6).sort((x, y) => x - y);
        const inc = r.bool();
        // (x - p)(x - q) < 0 → p < x < q (between). Only use the "between" type so the answer is one inequality.
        const b = -(p + q); const c = p * q;
        const bx = b === 0 ? '' : ` ${sterm(b, 'x')}`; const cc = c === 0 ? '' : ` ${sterm(c)}`;
        return {
          q: md`Solve $x^2${bx}${cc} ${inc ? '\\le' : '<'} 0$`,
          a: { kind: 'inequality', v: 'x', lo: p, loInc: inc, hi: q, hiInc: inc },
          show: md`$${p} ${inc ? '\\le' : '<'} x ${inc ? '\\le' : '<'} ${q}$`,
          wrong: [`x ${inc ? '<=' : '<'} ${q}`],
          hints: [md`Solve $x^2${bx}${cc} = 0$ first: it factorises to $(x ${sterm(-p)})(x ${sterm(-q)}) = 0$.`, md`The ∪-shaped graph is **below** zero **between** the roots $${p}$ and $${q}$.`],
          steps: [md`Critical values: $(x ${sterm(-p)})(x ${sterm(-q)}) = 0$ gives $x = ${p}$, $x = ${q}$ **[M1]**`, md`Sketch: a ∪ shape crossing at $${p}$ and $${q}$; it is below the axis between them **[M1]**`, md`$${p} ${inc ? '\\le' : '<'} x ${inc ? '\\le' : '<'} ${q}$ **[A1]**`],
          verify: () => [p - 0.01 + (q - p) / 2].every((x) => x * x + b * x + c < 0) || 'not negative between roots',
        };
      },
    },
  },
};
