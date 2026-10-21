import { fracTex, surdSimplify, simplify } from '../engine.js';
import { grid } from '../diagrams.js';

const md = String.raw;
// Integer points on circles centred at the origin, so tangent questions have whole-number coordinates.
const POINTS = [[3, 4], [4, 3], [-3, 4], [3, -4], [-4, -3], [5, 12], [12, 5], [-5, 12], [6, 8], [8, -6], [1, 2], [2, 1], [-1, 3], [3, 1], [2, -4], [1, -3], [-2, 3], [4, 2]];
const lineTex = (n, d, cn, cd) => {
  const [a, b] = simplify(n, d); const [c, e] = simplify(cn, cd);
  const m = b === 1 ? (a === 1 ? '' : a === -1 ? '-' : String(a)) : `${a < 0 ? '-' : ''}\\frac{${Math.abs(a)}}{${b}}`;
  const cc = c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${e === 1 ? Math.abs(c) : `\\frac{${Math.abs(c)}}{${e}}`}`;
  return `y = ${m}x${cc}`;
};

export default {
  id: 'circle-equation',
  title: 'Equation of a circle and tangents',
  subtitle: 'x² + y² = r², points on the circle, the tangent at a point',
  topics: ['A16'],
  band: '8',
  calc: 'non-calc',
  minutes: 25,
  why: 'The tangent to a circle is a grade 8–9 favourite (3–5 marks). It uses only two ideas you already know: gradients and perpendicular lines.',
  steps: [
    {
      kind: 'learn', title: 'The equation',
      md: md`A circle with centre the origin and radius $r$ has equation
$$x^2 + y^2 = r^2$$
because every point $(x, y)$ on it is distance $r$ from $O$ (Pythagoras).

So $x^2 + y^2 = 49$ has radius $7$, and $x^2 + y^2 = 20$ has radius $\sqrt{20} = 2\sqrt5$.`,
      diagram: grid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, circles: [{ cx: 0, cy: 0, r: 5 }], points: [{ x: 3, y: 4, label: '(3, 4)' }], step: 2, w: 280, h: 280 }),
    },
    { kind: 'try', template: 'radius' },
    { kind: 'try', template: 'throughPoint' },
    {
      kind: 'learn', title: 'Tangent at a point',
      md: md`A tangent is **perpendicular to the radius** at the point where it touches.

For the point $P(3, 4)$ on $x^2 + y^2 = 25$:

1. Gradient of the radius $OP = \dfrac{4}{3}$.
2. Tangent gradient is the negative reciprocal: $-\dfrac34$.
3. $y = -\dfrac34 x + c$ through $(3, 4)$: $4 = -\dfrac94 + c$, so $c = \dfrac{25}{4}$.

Tangent: $y = -\dfrac34 x + \dfrac{25}{4}$ (or $3x + 4y = 25$).`,
      key: 'Radius gradient = y ÷ x of the point. Tangent gradient = −x ÷ y.',
    },
    { kind: 'try', template: 'tangentGradient' },
    { kind: 'practice', title: 'Practice', templates: ['radius', 'throughPoint', 'missingCoord', 'tangentGradient', 'tangent'] },
    { kind: 'exam', template: 'tangent' },
    {
      kind: 'recap',
      md: md`- $x^2 + y^2 = r^2$: centre $(0, 0)$, radius $r$.
- A point is on the circle if $x^2 + y^2$ equals $r^2$.
- Tangent at $(a, b)$: gradient $-\dfrac{a}{b}$; then use the point to find $c$.`,
      mistakes: ['Giving r² as the radius', 'Using the radius gradient for the tangent', 'Forgetting the negative sign in the negative reciprocal'],
    },
  ],
  templates: {
    radius: {
      level: 1, marks: 1, skill: 'Radius from the equation',
      gen(r) {
        const rad = r.int(2, 12); const surd = r.int(0, 3) === 0;
        if (surd) {
          const n = r.pick([8, 12, 18, 20, 27, 32, 45, 50, 72]); const [k, m] = surdSimplify(n);
          return {
            q: md`A circle has equation $x^2 + y^2 = ${n}$. Write down its radius. Give your answer as a surd in its simplest form.`,
            a: { kind: 'surd', value: Math.sqrt(n), form: 'k√n' },
            typed: `${k}√${m}`,
            show: md`$${k}\sqrt{${m}}$`,
            wrong: [String(n), String(n / 2)],
            hints: [md`$r^2 = ${n}$, so $r = \sqrt{${n}}$. Simplify the surd.`],
            steps: [md`$r = \sqrt{${n}} = ${k}\sqrt{${m}}$`],
          };
        }
        return {
          q: md`A circle has equation $x^2 + y^2 = ${rad * rad}$. Write down its radius.`,
          a: { kind: 'number', value: rad },
          show: md`$${rad}$`,
          wrong: [String(rad * rad), String((rad * rad) / 2)].filter((w) => +w !== rad),
          hints: [md`The number on the right is $r^2$.`],
          steps: [md`$r = \sqrt{${rad * rad}} = ${rad}$`],
        };
      },
    },
    throughPoint: {
      level: 2, marks: 2, skill: 'Circle through a given point',
      gen(r) {
        const a = r.nz(-9, 9); const b = r.nz(-9, 9); const k = a * a + b * b;
        return {
          q: md`A circle has centre $(0, 0)$ and passes through the point $(${a}, ${b})$. Its equation is $x^2 + y^2 = k$. Find $k$.`,
          a: { kind: 'number', value: k },
          show: md`$x^2 + y^2 = ${k}$`,
          wrong: [String(Math.abs(a) + Math.abs(b)), String(a * a - b * b)].filter((w) => +w !== k),
          hints: [md`Substitute $x = ${a}$ and $y = ${b}$.`],
          steps: [md`$${a < 0 ? `(${a})` : a}^2 + ${b < 0 ? `(${b})` : b}^2 = ${a * a} + ${b * b} = ${k}$`],
        };
      },
    },
    missingCoord: {
      level: 2, marks: 2, skill: 'A missing coordinate on a circle',
      gen(r) {
        const [a, b] = r.pick(POINTS.filter(([x, y]) => x > 0 && y > 0)); const k = a * a + b * b; const askY = r.bool();
        return {
          q: md`The point $(${askY ? a : 'p'}, ${askY ? 'q' : b})$ lies on the circle $x^2 + y^2 = ${k}$, with $${askY ? 'q' : 'p'} > 0$. Find $${askY ? 'q' : 'p'}$.`,
          a: { kind: 'number', value: askY ? b : a },
          show: md`$${askY ? 'q' : 'p'} = ${askY ? b : a}$`,
          wrong: [String(k - (askY ? a : b))],
          hints: [md`Substitute: $${askY ? `${a}^2 + q^2` : `p^2 + ${b}^2`} = ${k}$.`],
          steps: [md`$${askY ? 'q' : 'p'}^2 = ${k} - ${(askY ? a : b) ** 2} = ${(askY ? b : a) ** 2}$`, md`$${askY ? 'q' : 'p'} = ${askY ? b : a}$`],
        };
      },
    },
    tangentGradient: {
      level: 2, marks: 2, skill: 'Gradient of a tangent to a circle',
      gen(r) {
        const [a, b] = r.pick(POINTS); const k = a * a + b * b;
        const [n, d] = simplify(-a, b);
        return {
          q: md`The point $P(${a}, ${b})$ lies on the circle $x^2 + y^2 = ${k}$. Work out the gradient of the tangent to the circle at $P$.`,
          diagram: grid({ xmin: -Math.ceil(Math.sqrt(k)) - 1, xmax: Math.ceil(Math.sqrt(k)) + 1, ymin: -Math.ceil(Math.sqrt(k)) - 1, ymax: Math.ceil(Math.sqrt(k)) + 1, circles: [{ cx: 0, cy: 0, r: Math.sqrt(k) }], points: [{ x: a, y: b, label: 'P' }], step: Math.sqrt(k) > 8 ? 4 : 2, w: 260, h: 260 }),
          a: { kind: 'fraction', num: -a, den: b },
          show: md`$${fracTex(-a, b)}$`,
          wrong: [fracPlain(b, a), fracPlain(-b, a), fracPlain(a, b)].filter((w) => Math.abs(evalFrac(w) - -a / b) > 1e-9),
          hints: [md`Gradient of the radius $OP = ${fracTex(b, a)}$.`, 'The tangent is perpendicular to the radius: use the negative reciprocal.'],
          steps: [md`Radius gradient $= ${fracTex(b, a)}$`, md`Tangent gradient $= ${fracTex(n, d)}$`],
        };
      },
    },
    tangent: {
      level: 3, marks: 4, skill: 'Equation of a tangent to a circle (grade 8–9)',
      gen(r) {
        const [a, b] = r.pick(POINTS); const k = a * a + b * b;
        // y = (-a/b)x + k/b
        return {
          q: md`The point $P(${a}, ${b})$ lies on the circle $x^2 + y^2 = ${k}$.

Find the equation of the tangent to the circle at $P$. Give your answer in the form $y = mx + c$.`,
          a: { kind: 'equation', lhsVar: 'y', expr: `(-${a})/(${b})*x+(${k})/(${b})`, vars: ['x'], anyForm: true },
          typed: `y = ${-a}/${b}x + ${k}/${b}`,
          show: md`$${lineTex(-a, b, k, b)}$`,
          wrong: [`y = ${b}/${a}x`, `y = ${-a}/${b}x`],
          hints: [md`Radius gradient $= \dfrac{${b}}{${a < 0 ? `-${-a}` : a}} = ${fracTex(b, a)}$, so the tangent gradient is $${fracTex(-a, b)}$.`, md`Substitute $x = ${a}$, $y = ${b}$ into $y = ${fracTex(-a, b)}x + c$ to find $c$.`],
          steps: [
            md`Gradient of $OP = ${fracTex(b, a)}$ **[M1]**`,
            md`Tangent gradient $= ${fracTex(-a, b)}$ **[M1]**`,
            md`$${b} = ${fracTex(-a, b)} \times ${a < 0 ? `(${a})` : a} + c$, so $c = ${fracTex(k, b)}$ **[M1]**`,
            md`$${lineTex(-a, b, k, b)}$ **[A1]**`,
          ],
          verify: () => Math.abs((-a / b) * a + k / b - b) < 1e-9 || 'tangent does not pass through P',
        };
      },
    },
  },
};

function fracPlain(n, d) { const [a, b] = simplify(n, d); return b === 1 ? String(a) : `${a}/${b}`; }
function evalFrac(s) { const [n, d = '1'] = s.split('/'); return Number(n) / Number(d); }
