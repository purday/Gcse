import { fmt, sterm, poly, isSquare, fracTex } from '../engine.js';

const md = String.raw;
// "(x + 3)^2" / "(x - 1.5)^2" with a fraction shown when p is a half.
const sq = (p, v = 'x') => `(${v} ${p < 0 ? '-' : '+'} ${Number.isInteger(p) ? Math.abs(p) : fracTex(Math.abs(p * 2), 2)})^2`;
const num = (q) => (Number.isInteger(q) ? String(q) : fracTex(Math.round(q * 4), 4));
const signedNum = (q) => (q < 0 ? `- ${num(-q)}` : `+ ${num(q)}`);

export default {
  id: 'completing-square',
  title: 'Completing the square',
  subtitle: 'The form (x + p)² + q, turning points, solving, minimum values',
  topics: ['A11', 'A18'],
  band: '7',
  calc: 'non-calc',
  minutes: 35,
  why: 'Completing the square is a grade 7 skill that appears on most series, often with "hence write down the turning point". The method is the same every time.',
  steps: [
    {
      kind: 'learn', title: 'The idea',
      md: md`$(x + 3)^2 = x^2 + 6x + 9$. So $x^2 + 6x$ is $(x + 3)^2$ **minus 9**.

For $x^2 + bx + c$:

1. Halve $b$: that number goes in the bracket, $\left(x + \frac{b}{2}\right)^2$.
2. Subtract $\left(\frac{b}{2}\right)^2$ to cancel the extra term.
3. Add $c$ back on.

$$x^2 + bx + c = \left(x + \frac{b}{2}\right)^2 - \left(\frac{b}{2}\right)^2 + c$$`,
      key: 'Halve the x coefficient, square it, subtract it.',
    },
    {
      kind: 'example', title: 'A worked example',
      q: md`Write $x^2 - 8x + 5$ in the form $(x + p)^2 + q$.`,
      steps: [
        { md: md`Half of $-8$ is $-4$: $(x - 4)^2$` },
        { md: md`$(x - 4)^2 = x^2 - 8x + 16$, which is 16 too many` },
        { md: md`$x^2 - 8x + 5 = (x - 4)^2 - 16 + 5 = (x - 4)^2 - 11$` },
      ],
      answer: md`$(x - 4)^2 - 11$, so $p = -4$ and $q = -11$`,
    },
    { kind: 'try', template: 'monic' },
    {
      kind: 'learn', title: 'Turning points',
      md: md`$y = (x + p)^2 + q$ has its **minimum** turning point at $(-p, q)$.

The squared bracket is never negative, so the smallest it can be is $0$, when $x = -p$. Then $y = q$.

For $y = (x - 4)^2 - 11$ the turning point is $(4, -11)$. **Watch the sign of $x$**: it is the opposite of the number in the bracket.`,
    },
    { kind: 'try', template: 'turningPoint' },
    {
      kind: 'learn', title: 'Solving by completing the square',
      md: md`$x^2 - 6x + 2 = 0$

$(x - 3)^2 - 7 = 0$

$(x - 3)^2 = 7$

$x - 3 = \pm\sqrt{7}$

$x = 3 \pm \sqrt{7}$

Do not forget the $\pm$: there are two solutions.`,
    },
    { kind: 'try', template: 'solve' },
    {
      kind: 'learn', title: 'When the x² has a number in front',
      md: md`Take the number out of the $x^2$ and $x$ terms first:

$2x^2 + 12x + 7 = 2(x^2 + 6x) + 7 = 2\left[(x + 3)^2 - 9\right] + 7 = 2(x + 3)^2 - 18 + 7 = 2(x + 3)^2 - 11$`,
      key: 'When you multiply back out, the −9 inside the bracket becomes −18.',
    },
    { kind: 'try', template: 'nonMonic' },
    { kind: 'practice', title: 'Practice', templates: ['monic', 'turningPoint', 'solve', 'nonMonic', 'minValue'] },
    { kind: 'exam', template: 'minValue' },
    {
      kind: 'recap',
      md: md`- $x^2 + bx + c = \left(x + \frac{b}{2}\right)^2 - \left(\frac{b}{2}\right)^2 + c$.
- Turning point of $(x + p)^2 + q$ is $(-p, q)$.
- Solve: isolate the bracket, square root with $\pm$.
- With $ax^2$: factor out $a$ first, and multiply the subtracted square by $a$.`,
      mistakes: ['Adding (b/2)² instead of subtracting it', 'Getting the sign of the turning point x wrong', 'Forgetting ± when square-rooting', 'Not multiplying the subtracted square by a'],
    },
  ],
  templates: {
    monic: {
      level: 2, marks: 2, skill: 'Writing x² + bx + c as (x + p)² + q',
      gen(r) {
        // Mostly even b; sometimes odd, which puts a fraction in the bracket.
        const b = r.int(0, 4) === 0 ? r.pick([-5, -3, -1, 1, 3, 5, 7]) : 2 * r.nz(-7, 7); const c = r.int(-15, 15);
        const p = b / 2; const q = c - p * p;
        return {
          q: md`Write $${poly([c, b, 1])}$ in the form $(x + p)^2 + q$.`,
          a: { kind: 'multi', parts: [{ label: '$p =$', spec: { kind: 'number', value: p } }, { label: '$q =$', spec: { kind: 'number', value: q } }] },
          show: md`$${sq(p)} ${signedNum(q)}$, so $p = ${num(p)}$, $q = ${num(q)}$`,
          wrong: [[String(p), String(c + p * p)], [String(-p), String(q)]],
          hints: [md`Half of $${b}$ is $${num(p)}$, so start with $${sq(p)}$.`, md`$${sq(p)}$ gives an extra $${num(p * p)}$. Subtract it, then ${c < 0 ? `subtract $${-c}$` : `add $${c}$`}.`],
          steps: [md`$${sq(p)} = x^2 ${sterm(b, 'x')} + ${num(p * p)}$`, md`$${poly([c, b, 1])} = ${sq(p)} - ${num(p * p)} ${sterm(c)}$`, md`$= ${sq(p)} ${signedNum(q)}$`],
        };
      },
    },
    turningPoint: {
      level: 2, marks: 2, skill: 'Turning point from completed square form',
      gen(r) {
        const p = r.nz(-7, 7); const c = r.int(-12, 12); const b = 2 * p; const q = c - p * p;
        return {
          q: md`$${poly([c, b, 1])} = ${sq(p)} ${signedNum(q)}$.

Write down the coordinates of the turning point of $y = ${poly([c, b, 1])}$.`,
          a: { kind: 'coord', x: -p, y: q },
          show: md`$(${-p}, ${q})$`,
          wrong: [`(${p}, ${q})`],
          hints: [md`The bracket is smallest (zero) when $x = ${-p}$.`],
          steps: [md`$${sq(p)} = 0$ when $x = ${-p}$`, md`Then $y = ${q}$`, md`Turning point $(${-p}, ${q})$`],
        };
      },
    },
    solve: {
      level: 3, marks: 3, skill: 'Solving a quadratic by completing the square',
      gen(r) {
        for (;;) {
          const p = r.nz(-6, 6); const k = r.int(2, 30); if (isSquare(k)) continue;
          const b = 2 * p; const c = p * p - k;
          return {
            q: md`By completing the square, solve $${poly([c, b, 1])} = 0$.

Give your answers in the form $a \pm \sqrt{b}$.`,
            a: { kind: 'multi', parts: [{ label: '$a =$', spec: { kind: 'number', value: -p } }, { label: '$b =$', spec: { kind: 'number', value: k } }] },
            show: md`$x = ${-p} \pm \sqrt{${k}}$`,
            wrong: [[String(p), String(k)]],
            hints: [md`$${poly([c, b, 1])} = ${sq(p)} ${signedNum(-k)}$.`, md`So $${sq(p)} = ${k}$. Square root both sides, with $\pm$.`],
            steps: [md`$${sq(p)} ${signedNum(-k)} = 0$ **[M1]**`, md`$${sq(p)} = ${k}$`, md`$x ${p < 0 ? '-' : '+'} ${Math.abs(p)} = \pm\sqrt{${k}}$ **[M1]**`, md`$x = ${-p} \pm \sqrt{${k}}$ **[A1]**`],
          };
        }
      },
    },
    nonMonic: {
      level: 3, marks: 3, skill: 'Completing the square with a coefficient of x²',
      gen(r) {
        const a = r.pick([2, 3, 2, 4, 5]); const p = r.nz(-5, 5); const c = r.int(-20, 20);
        const b = 2 * a * p; const q = c - a * p * p;
        return {
          q: md`Write $${poly([c, b, a])}$ in the form $a(x + b)^2 + c$.`,
          a: { kind: 'multi', parts: [{ label: '$a =$', spec: { kind: 'number', value: a } }, { label: '$b =$', spec: { kind: 'number', value: p } }, { label: '$c =$', spec: { kind: 'number', value: q } }] },
          show: md`$${a}${sq(p)} ${signedNum(q)}$`,
          wrong: [[String(a), String(p), String(c - p * p)]],
          hints: [md`Factor out $${a}$: $${a}(${poly([0, b / a, 1])}) ${sterm(c)}$.`, md`$${poly([0, b / a, 1])} = ${sq(p)} - ${p * p}$. Then multiply the $-${p * p}$ by $${a}$.`],
          steps: [md`$${a}(${poly([0, b / a, 1])}) ${sterm(c)}$`, md`$= ${a}\left[${sq(p)} - ${p * p}\right] ${sterm(c)}$`, md`$= ${a}${sq(p)} - ${a * p * p} ${sterm(c)} = ${a}${sq(p)} ${signedNum(q)}$`],
        };
      },
    },
    minValue: {
      level: 3, marks: 3, skill: 'Minimum value of a quadratic',
      gen(r) {
        const p = r.nz(-6, 6); const c = r.int(-10, 25); const b = 2 * p; const q = c - p * p;
        return {
          q: md`(a) Write $${poly([c, b, 1])}$ in the form $(x + p)^2 + q$.

(b) Hence write down the minimum value of $${poly([c, b, 1])}$ and the value of $x$ where it occurs.`,
          a: { kind: 'multi', parts: [{ label: 'Minimum value', spec: { kind: 'number', value: q } }, { label: '$x =$', spec: { kind: 'number', value: -p } }] },
          show: md`$${sq(p)} ${signedNum(q)}$: minimum value $${q}$ when $x = ${-p}$`,
          wrong: [[String(q), String(p)], [String(c), String(-p)]],
          hints: [md`Half of $${b}$ is $${p}$.`, md`The squared bracket is at least $0$, so the smallest value is $q$, when the bracket is $0$.`],
          steps: [md`$${poly([c, b, 1])} = ${sq(p)} - ${p * p} ${sterm(c)} = ${sq(p)} ${signedNum(q)}$ **[M1 A1]**`, md`$${sq(p)} \ge 0$, smallest when $x = ${-p}$`, md`Minimum value $${q}$ at $x = ${-p}$ **[B1]**`],
        };
      },
    },
  },
};
