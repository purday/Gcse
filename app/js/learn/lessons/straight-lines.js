import { fracTex, fracPlain, simplify, lead, sterm, br, gcd } from '../engine.js';
import { grid } from '../diagrams.js';

const md = String.raw;
// y = (n/d) x + c as LaTeX and as typed text
function lineTex(n, d, c) {
  const [a, b] = simplify(n, d);
  const m = b === 1 ? (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`) : `${a < 0 ? '-' : ''}\\frac{${Math.abs(a)}}{${b}}x`;
  return `y = ${a === 0 ? '' : m}${c === 0 ? (a === 0 ? '0' : '') : a === 0 ? c : ` ${sterm(c)}`}`;
}
function lineTyped(n, d, c) {
  const [a, b] = simplify(n, d);
  return `y = ${b === 1 ? `${a}x` : `(${a}/${b})x`} + ${c}`;
}

export default {
  id: 'straight-lines',
  title: 'Straight-line graphs',
  subtitle: 'Gradient, y = mx + c, parallel and perpendicular lines',
  topics: ['A9', 'A10'],
  band: '6',
  calc: 'non-calc',
  minutes: 35,
  why: 'Straight-line questions appear on every Higher paper: finding gradients and equations (2–3 marks) and perpendicular lines (a grade 7 favourite, 3–4 marks).',
  steps: [
    {
      kind: 'learn', title: 'y = mx + c',
      md: md`Every straight line can be written $y = mx + c$:

- $m$ is the **gradient**: how much $y$ goes up for each 1 across.
- $c$ is the **y-intercept**: where the line crosses the $y$-axis.

Gradient between two points:

$$m = \frac{\text{change in } y}{\text{change in } x} = \frac{y_2 - y_1}{x_2 - x_1}$$`,
      diagram: grid({ xmin: -4, xmax: 4, ymin: -4, ymax: 6, lines: [{ m: 2, c: 1 }], points: [{ x: 0, y: 1, label: '(0, 1)' }, { x: 1, y: 3, label: '(1, 3)' }] }),
      key: md`The line drawn is $y = 2x + 1$: it crosses the $y$-axis at 1 and goes up 2 for every 1 across.`,
    },
    {
      kind: 'example', title: 'Equation through two points',
      q: md`Find the equation of the line through $(1, 3)$ and $(4, 12)$.`,
      steps: [
        { md: md`$m = \dfrac{12 - 3}{4 - 1} = \dfrac{9}{3} = 3$` },
        { md: md`$y = 3x + c$. Use $(1, 3)$: $3 = 3(1) + c$, so $c = 0$`, why: 'Substitute either point to find c.' },
        { md: md`$y = 3x$` },
      ],
      answer: md`$y = 3x$`,
    },
    { kind: 'try', template: 'gradient' },
    { kind: 'try', template: 'throughTwo' },
    {
      kind: 'learn', title: 'Rearranging to find the gradient',
      md: md`The gradient is only "the number in front of $x$" when the equation is $y = \dots$.

$$3y - 6x = 12 \;\Rightarrow\; 3y = 6x + 12 \;\Rightarrow\; y = 2x + 4$$

so the gradient is $2$ and the $y$-intercept is $4$.`,
    },
    {
      kind: 'learn', title: 'Parallel and perpendicular',
      md: md`- **Parallel** lines have the **same** gradient.
- **Perpendicular** lines (at right angles): the gradients multiply to $-1$. Flip the fraction and change the sign:

$$m_2 = -\frac{1}{m_1} \qquad 2 \to -\tfrac{1}{2}, \quad -\tfrac{3}{4} \to \tfrac{4}{3}$$`,
    },
    {
      kind: 'example', title: 'Perpendicular line through a point',
      q: md`Find the equation of the line perpendicular to $y = 2x + 1$ that passes through $(4, 3)$.`,
      steps: [
        { md: md`Gradient of $y = 2x + 1$ is $2$, so the perpendicular gradient is $-\frac{1}{2}$.` },
        { md: md`$y = -\frac{1}{2}x + c$. Use $(4, 3)$: $3 = -\frac{1}{2}(4) + c = -2 + c$` },
        { md: md`$c = 5$, so $y = -\frac{1}{2}x + 5$` },
      ],
      answer: md`$y = -\frac{1}{2}x + 5$`,
    },
    { kind: 'practice', title: 'Practice', templates: ['gradient', 'readFromEquation', 'throughTwo', 'parallel', 'perpendicular'] },
    { kind: 'exam', template: 'perpBisector' },
    {
      kind: 'recap',
      md: md`- $y = mx + c$: $m$ gradient, $c$ y-intercept.
- Gradient = change in $y$ ÷ change in $x$ (keep the points in the same order).
- Find $c$ by substituting a point.
- Parallel: same $m$. Perpendicular: $-\frac{1}{m}$.`,
      mistakes: ['Change in x ÷ change in y (upside down)', 'Reading the gradient before rearranging to y = …', 'Perpendicular gradient: flipping but forgetting to change the sign'],
    },
  ],
  templates: {
    gradient: {
      level: 1, marks: 2, skill: 'Gradient between two points',
      gen(r) {
        const x1 = r.int(-5, 4); const y1 = r.int(-6, 6); const dx = r.nz(-6, 6); const dy = r.nz(-9, 9);
        const x2 = x1 + dx; const y2 = y1 + dy;
        const [n, d] = simplify(dy, dx);
        return {
          q: md`Work out the gradient of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
          a: { kind: 'number', value: n / d },
          typed: fracPlain(n, d),
          show: md`$${fracTex(n, d)}$`,
          wrong: [d !== 1 ? fracPlain(d, n) : String(n + 1)].filter((w) => w !== fracPlain(n, d)),
          hints: [md`Gradient = $\dfrac{y_2 - y_1}{x_2 - x_1}$.`],
          steps: [md`$\dfrac{${y2} - ${br(y1)}}{${x2} - ${br(x1)}} = \dfrac{${dy}}{${dx}}$`, md`$= ${fracTex(n, d)}$`],
        };
      },
    },
    readFromEquation: {
      level: 2, marks: 1, skill: 'Finding the gradient from an equation',
      gen(r) {
        const a = r.pick([2, 3, 4, 5]); const m = r.nz(-5, 5); const c = r.int(-6, 6);
        // a y - a m x = a c  → rearrange
        return {
          q: md`Find the gradient of the line $${a}y ${sterm(-a * m, 'x')} = ${a * c}$`,
          a: { kind: 'number', value: m },
          show: md`$${m}$`,
          wrong: [String(-a * m)],
          hints: [md`Rearrange to $y = \dots$ first: add $${lead(a * m, 'x')}$ to both sides, then divide by $${a}$.`],
          steps: [md`$${a}y = ${lead(a * m, 'x')} ${sterm(a * c)}$`, md`$y = ${lead(m, 'x')} ${sterm(c)}$`, md`Gradient $= ${m}$`],
        };
      },
    },
    throughTwo: {
      level: 2, marks: 3, skill: 'Equation of a line through two points',
      gen(r) {
        const m = r.nz(-4, 4); const c = r.int(-6, 6); const x1 = r.int(-4, 2); const x2 = x1 + r.int(1, 4);
        const y1 = m * x1 + c; const y2 = m * x2 + c;
        return {
          q: md`Find the equation of the straight line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
          a: { kind: 'equation', lhsVar: 'y', expr: `${m}x+${c}`, vars: ['x'] },
          typed: `y = ${m}x + ${c}`,
          show: md`$${lineTex(m, 1, c)}$`,
          placeholder: 'y = …',
          hints: [md`Gradient first: $\dfrac{${y2} - ${br(y1)}}{${x2} - ${br(x1)}}$.`, md`Then substitute $(${x1}, ${y1})$ into $y = ${m}x + c$ to find $c$.`],
          steps: [md`$m = \dfrac{${y2 - y1}}{${x2 - x1}} = ${m}$`, md`$${y1} = ${m} \times ${br(x1)} + c$, so $c = ${c}$`, md`$${lineTex(m, 1, c)}$`],
        };
      },
    },
    parallel: {
      level: 2, marks: 2, skill: 'Equation of a parallel line',
      gen(r) {
        const m = r.nz(-5, 5); const c0 = r.int(-6, 6); const px = r.int(-4, 4); const c = r.int(-8, 8);
        if (c === c0) return this.gen(r);
        const py = m * px + c;
        return {
          q: md`Find the equation of the line parallel to $${lineTex(m, 1, c0)}$ that passes through $(${px}, ${py})$.`,
          a: { kind: 'equation', lhsVar: 'y', expr: `${m}x+${c}`, vars: ['x'] },
          typed: `y = ${m}x + ${c}`,
          show: md`$${lineTex(m, 1, c)}$`,
          placeholder: 'y = …',
          hints: [md`Parallel means the same gradient: $${m}$.`, md`$${py} = ${m} \times ${br(px)} + c$.`],
          steps: [md`Gradient $= ${m}$`, md`$${py} = ${m * px} + c \Rightarrow c = ${c}$`, md`$${lineTex(m, 1, c)}$`],
        };
      },
    },
    perpendicular: {
      level: 3, marks: 3, skill: 'Equation of a perpendicular line',
      gen(r) {
        const m1 = r.pick([2, 3, -2, -3, 4, -4, 0.5, -0.5]);
        const [pn, pd] = m1 === 0.5 ? [-2, 1] : m1 === -0.5 ? [2, 1] : simplify(-1, m1);
        const px = pd * r.int(-3, 3); const c = r.int(-6, 6); const py = (pn / pd) * px + c;
        const m1Tex = m1 === 0.5 ? '\\frac{1}{2}x' : m1 === -0.5 ? '-\\frac{1}{2}x' : lead(m1, 'x');
        return {
          q: md`Line $L$ has equation $y = ${m1Tex} ${sterm(r.int(1, 7))}$.

Find the equation of the line perpendicular to $L$ that passes through $(${px}, ${py})$.`,
          a: { kind: 'equation', lhsVar: 'y', expr: `(${pn}/${pd})x+${c}`, vars: ['x'] },
          typed: lineTyped(pn, pd, c),
          show: md`$${lineTex(pn, pd, c)}$`,
          placeholder: 'y = …',
          hints: [md`Perpendicular gradient $= -\dfrac{1}{\text{gradient}}$: here $${fracTex(pn, pd)}$.`, md`Substitute $(${px}, ${py})$ to find $c$.`],
          steps: [md`Gradient of $L$ is $${m1 === 0.5 ? '\\frac12' : m1 === -0.5 ? '-\\frac12' : m1}$, so the perpendicular gradient is $${fracTex(pn, pd)}$`, md`$${py} = ${fracTex(pn, pd)} \times ${br(px)} + c$, so $c = ${c}$`, md`$${lineTex(pn, pd, c)}$`],
          verify: () => Math.abs(m1 * (pn / pd) + 1) < 1e-9 || 'not perpendicular',
        };
      },
    },
    perpBisector: {
      level: 3, marks: 4, skill: 'Perpendicular bisector of a line segment',
      gen(r) {
        for (;;) {
          const ax = r.int(-5, 3); const ay = r.int(-5, 4);
          const dx = 2 * r.nz(-3, 3); const dy = 2 * r.nz(-3, 3);
          const bx = ax + dx; const by = ay + dy;
          const mx = ax + dx / 2; const my = ay + dy / 2;
          const [pn, pd] = simplify(-dx, dy); // perpendicular gradient = -dx/dy
          const c = my - (pn / pd) * mx;
          if (!Number.isInteger(c * pd)) continue;
          const [cn, cd] = simplify(Math.round(c * pd), pd);
          if (cd !== 1) continue;
          return {
            q: md`$A$ is the point $(${ax}, ${ay})$ and $B$ is the point $(${bx}, ${by})$.

Find the equation of the perpendicular bisector of $AB$.`,
            a: { kind: 'equation', lhsVar: 'y', expr: `(${pn}/${pd})x+${cn}`, vars: ['x'] },
            typed: lineTyped(pn, pd, cn),
            show: md`$${lineTex(pn, pd, cn)}$`,
            placeholder: 'y = …',
            hints: [md`The perpendicular bisector passes through the **midpoint** of $AB$ at right angles to $AB$.`, md`Midpoint $(${mx}, ${my})$; gradient of $AB = ${fracTex(dy, dx)}$, so the perpendicular gradient is $${fracTex(pn, pd)}$.`],
            steps: [md`Midpoint $= \left(\dfrac{${ax} + ${br(bx)}}{2}, \dfrac{${ay} + ${br(by)}}{2}\right) = (${mx}, ${my})$ **[B1]**`, md`Gradient $AB = \dfrac{${dy}}{${dx}} = ${fracTex(dy, dx)}$; perpendicular gradient $${fracTex(pn, pd)}$ **[M1]**`, md`$${my} = ${fracTex(pn, pd)} \times ${br(mx)} + c \Rightarrow c = ${cn}$ **[M1]**`, md`$${lineTex(pn, pd, cn)}$ **[A1]**`],
            verify: () => (Math.abs((pn / pd) * mx + cn - my) < 1e-9 && Math.abs((pn / pd) * (dy / dx) + 1) < 1e-9) || 'bad bisector',
          };
        }
      },
    },
  },
};
