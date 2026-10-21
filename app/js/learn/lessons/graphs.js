import { fmt, dp } from '../engine.js';
import { grid } from '../diagrams.js';

const md = String.raw;
const col = (a, b) => `\\begin{pmatrix} ${a} \\\\ ${b} \\end{pmatrix}`;

const SHAPES = [
  { tex: 'y = x^2 - 3', f: (x) => x * x - 3, name: 'quadratic (U shape)' },
  { tex: 'y = 3 - x^2', f: (x) => 3 - x * x, name: 'quadratic with a negative x² (∩ shape)' },
  { tex: 'y = x^3', f: (x) => x ** 3, name: 'cubic' },
  { tex: 'y = x^3 - 4x', f: (x) => x ** 3 - 4 * x, name: 'cubic with three roots' },
  { tex: 'y = \\dfrac{2}{x}', f: (x) => 2 / x, name: 'reciprocal' },
  { tex: 'y = -\\dfrac{2}{x}', f: (x) => -2 / x, name: 'reciprocal (negative)' },
  { tex: 'y = 2^x', f: (x) => 2 ** x, name: 'exponential growth' },
  { tex: 'y = 2^{-x}', f: (x) => 2 ** -x, name: 'exponential decay' },
];

const TRIG = [
  { fn: 'sin', k: 0.5, ans: [30, 150] }, { fn: 'sin', k: -0.5, ans: [210, 330] }, { fn: 'cos', k: 0.5, ans: [60, 300] },
  { fn: 'cos', k: -0.5, ans: [120, 240] }, { fn: 'tan', k: 1, ans: [45, 225] }, { fn: 'tan', k: -1, ans: [135, 315] },
  { fn: 'sin', k: 1, ans: [90] }, { fn: 'cos', k: 0, ans: [90, 270] },
];
const trigF = { sin: (x) => Math.sin((x * Math.PI) / 180), cos: (x) => Math.cos((x * Math.PI) / 180), tan: (x) => Math.tan((x * Math.PI) / 180) };

export default {
  id: 'graphs',
  title: 'Graphs: shapes, transformations and rates',
  subtitle: 'Recognising graphs, y = f(x + a), trig graphs, velocity–time graphs',
  topics: ['A12', 'A13', 'A15', 'A14'],
  band: '7',
  calc: 'both',
  minutes: 40,
  why: 'Graph questions earn marks on every paper: matching equations to sketches (1–2 marks), graph transformations and trig equations (grade 7–8), and velocity–time graphs (3–5 marks, grade 7–9).',
  steps: [
    {
      kind: 'learn', title: 'Shapes to know on sight',
      md: md`| Equation | Shape |
|---|---|
| $y = x^2$ | U-shaped parabola ($-x^2$: upside down) |
| $y = x^3$ | S-shaped cubic through the origin |
| $y = \dfrac{1}{x}$ | reciprocal: two curves, never touches the axes |
| $y = 2^x$ | exponential: crosses the $y$-axis at 1, shoots up |
| $y = \sin x$, $y = \cos x$ | waves between $-1$ and $1$, period $360°$ |

To check a match, put in an easy value like $x = 0$ or $x = 1$.`,
    },
    { kind: 'try', template: 'recognise' },
    {
      kind: 'learn', title: 'Transformations of graphs',
      md: md`| New graph | What happens to $y = f(x)$ |
|---|---|
| $y = f(x) + a$ | translation $${col('0', 'a')}$ (up $a$) |
| $y = f(x + a)$ | translation $${col('-a', '0')}$ (**left** $a$) |
| $y = -f(x)$ | reflection in the $x$-axis |
| $y = f(-x)$ | reflection in the $y$-axis |`,
      key: 'Inside the bracket does the opposite of what you expect: f(x + 3) moves LEFT 3.',
    },
    { kind: 'try', template: 'transformPoint' },
    {
      kind: 'learn', title: 'Trig graphs and equations',
      md: md`$\sin x = 0.5$ has **two** solutions between $0°$ and $360°$: $x = 30°$ (calculator) and $x = 180° - 30° = 150°$ (symmetry of the sine wave).

- $\sin$: second answer $180° - x$
- $\cos$: second answer $360° - x$
- $\tan$: second answer $x + 180°$`,
      diagram: grid({ xmin: 0, xmax: 360, ymin: -1.5, ymax: 1.5, curve: trigF.sin, lines: [{ m: 0, c: 0.5 }], step: 90, ystep: 1, w: 320, h: 200 }),
    },
    { kind: 'try', template: 'trigSolve' },
    {
      kind: 'learn', title: 'Velocity–time graphs',
      md: md`On a **velocity–time** graph:

- **gradient** $=$ acceleration (m/s²)
- **area under the graph** $=$ distance travelled (m)

Split the area into triangles, rectangles and trapezia. For a curve, estimate the area with trapezia (strips).`,
      diagram: grid({ xmin: 0, xmax: 30, ymin: 0, ymax: 14, paths: [[[0, 0], [10, 12], [25, 12], [30, 0]]], step: 5, ystep: 2, xlabel: 't (s)', ylabel: 'v (m/s)', w: 320, h: 220 }),
    },
    { kind: 'try', template: 'velocity' },
    { kind: 'practice', title: 'Practice', templates: ['recognise', 'transformPoint', 'describe', 'trigSolve', 'velocity', 'trapezia'] },
    { kind: 'exam', template: 'velocityExam' },
    {
      kind: 'recap',
      md: md`- Quadratic U, cubic S, reciprocal two branches, exponential through $(0, 1)$.
- $f(x) + a$ moves up; $f(x + a)$ moves **left**; $-f(x)$ flips in the $x$-axis; $f(-x)$ flips in the $y$-axis.
- Trig equations usually have two answers in $0°$–$360°$.
- Velocity–time: gradient = acceleration, area = distance.`,
      mistakes: ['Moving f(x + a) to the right', 'Giving only one solution to a trig equation', 'Using the gradient for distance (or the area for acceleration)'],
    },
  ],
  templates: {
    recognise: {
      level: 1, marks: 1, skill: 'Matching a graph to its equation',
      gen(r) {
        const pick = r.shuffle([...SHAPES.keys()]).slice(0, 4); const right = pick[0];
        const order = r.shuffle([0, 1, 2, 3]);
        return {
          q: 'Which equation matches this graph?',
          diagram: grid({ xmin: -4, xmax: 4, ymin: -6, ymax: 6, curve: SHAPES[right].f, step: 1, ystep: 2, w: 260, h: 280 }),
          a: { kind: 'choice', options: order.map((i) => `$${SHAPES[pick[i]].tex}$`), correct: order.indexOf(0) },
          show: md`$${SHAPES[right].tex}$, a ${SHAPES[right].name}`,
          hints: ['Look at the overall shape first, then check one point, such as where it crosses the $y$-axis.'],
          steps: [md`The shape is a ${SHAPES[right].name}.`, md`$${SHAPES[right].tex}$ matches.`],
        };
      },
    },
    transformPoint: {
      level: 2, marks: 1, skill: 'Where a point moves under a graph transformation',
      gen(r) {
        const p = r.nz(-5, 5); const q = r.nz(-5, 5); const a = r.int(1, 6);
        const kinds = [
          { tex: `y = f(x) + ${a}`, to: [p, q + a], wrong: [p + a, q], why: md`up $${a}$` },
          { tex: `y = f(x) - ${a}`, to: [p, q - a], wrong: [p - a, q], why: md`down $${a}$` },
          { tex: `y = f(x + ${a})`, to: [p - a, q], wrong: [p + a, q], why: md`**left** $${a}$` },
          { tex: `y = f(x - ${a})`, to: [p + a, q], wrong: [p - a, q], why: md`**right** $${a}$` },
          { tex: 'y = -f(x)', to: [p, -q], wrong: [-p, q], why: 'reflected in the $x$-axis' },
          { tex: 'y = f(-x)', to: [-p, q], wrong: [p, -q], why: 'reflected in the $y$-axis' },
        ];
        const k = r.pick(kinds);
        return {
          q: md`The graph of $y = f(x)$ has a turning point at $(${p}, ${q})$. Write down the coordinates of the turning point of $${k.tex}$.`,
          a: { kind: 'coord', x: k.to[0], y: k.to[1] },
          show: md`$(${k.to[0]}, ${k.to[1]})$`,
          wrong: [`(${k.wrong[0]}, ${k.wrong[1]})`],
          hints: [md`$${k.tex}$ is $y = f(x)$ ${k.why}.`],
          steps: [md`$${k.tex}$: ${k.why}`, md`$(${p}, ${q}) \to (${k.to[0]}, ${k.to[1]})$`],
        };
      },
    },
    describe: {
      level: 2, marks: 2, skill: 'Describing a graph transformation',
      gen(r) {
        const a = r.int(1, 6);
        const all = [
          { tex: `y = f(x + ${a})`, d: md`Translation by $${col(-a, 0)}$` },
          { tex: `y = f(x - ${a})`, d: md`Translation by $${col(a, 0)}$` },
          { tex: `y = f(x) + ${a}`, d: md`Translation by $${col(0, a)}$` },
          { tex: `y = f(x) - ${a}`, d: md`Translation by $${col(0, -a)}$` },
          { tex: 'y = -f(x)', d: 'Reflection in the $x$-axis' },
          { tex: 'y = f(-x)', d: 'Reflection in the $y$-axis' },
        ];
        const i = r.int(0, all.length - 1);
        const others = r.shuffle(all.filter((_, j) => j !== i)).slice(0, 3);
        const opts = [all[i], ...others]; const order = r.shuffle([0, 1, 2, 3]);
        return {
          q: md`Describe the single transformation that maps $y = f(x)$ onto $${all[i].tex}$.`,
          a: { kind: 'choice', options: order.map((k) => opts[k].d), correct: order.indexOf(0) },
          show: all[i].d,
          hints: ['Changes inside the bracket move the graph sideways (the opposite way to the sign). Changes outside move it up or down.'],
          steps: [md`$${all[i].tex}$: ${all[i].d.toLowerCase()}`],
        };
      },
    },
    trigSolve: {
      level: 2, marks: 2, skill: 'Solving a trig equation from 0° to 360°',
      gen(r) {
        const t = r.pick(TRIG);
        return {
          q: md`Solve $${'\\' + t.fn} x = ${t.k}$ for $0° \le x \le 360°$.`,
          diagram: grid({ xmin: 0, xmax: 360, ymin: t.fn === 'tan' ? -3 : -1.5, ymax: t.fn === 'tan' ? 3 : 1.5, curve: trigF[t.fn], lines: [{ m: 0, c: t.k }], step: 90, ystep: 1, w: 320, h: 200 }),
          a: { kind: 'numbers', values: t.ans },
          show: md`$x = ${t.ans.map((v) => `${v}°`).join('$ or $x = ')}$`,
          wrong: [String(t.ans[0])].filter(() => t.ans.length > 1),
          hints: [md`Your calculator (or the exact values) gives $x = ${t.ans[0]}°$. Use the graph's symmetry for the other.`, { sin: 'For sin, the other answer is 180° − x.', cos: 'For cos, the other answer is 360° − x.', tan: 'For tan, the other answer is x + 180°.' }[t.fn]],
          steps: [md`One answer: $${t.ans[0]}°$`, t.ans.length > 1 ? md`The other: $${t.ans[1]}°$ (from the symmetry of the graph)` : md`It only reaches $${t.k}$ once in this range.`],
        };
      },
    },
    velocity: {
      level: 2, marks: 2, skill: 'Velocity–time graphs: acceleration and distance',
      gen(r) {
        const V = r.int(2, 8) * 2; const t1 = r.pick([4, 5, 8, 10]); const t2 = r.pick([5, 10, 15]); const t3 = r.pick([4, 5, 6, 10]);
        const ask = r.pick(['acc', 'dec', 'dist1', 'dist']);
        const T = t1 + t2 + t3; const area = 0.5 * t1 * V + t2 * V + 0.5 * t3 * V;
        const ans = { acc: V / t1, dec: V / t3, dist1: 0.5 * t1 * V, dist: area }[ask];
        return {
          q: { acc: md`The graph shows the velocity of a car. Work out its acceleration in the first ${t1} seconds.`, dec: md`The graph shows the velocity of a car. Work out its deceleration in the last ${t3} seconds.`, dist1: md`The graph shows the velocity of a car. How far does it travel in the first ${t1} seconds?`, dist: md`The graph shows the velocity of a car. Work out the total distance travelled.` }[ask],
          diagram: grid({ xmin: 0, xmax: T + 2, ymin: 0, ymax: V + 2, paths: [[[0, 0], [t1, V], [t1 + t2, V], [T, 0]]], step: T > 16 ? 5 : 2, ystep: 2, xlabel: 't (s)', ylabel: 'v (m/s)', w: 320, h: 240 }),
          a: { kind: 'number', value: ans },
          show: md`$${fmt(ans)}$ ${ask === 'acc' || ask === 'dec' ? 'm/s²' : 'm'}`,
          wrong: ask === 'acc' ? [fmt(t1 * V)] : ask === 'dec' ? [fmt(V * t3)] : ask === 'dist1' ? [fmt(t1 * V)] : [fmt(T * V)],
          hints: [ask === 'acc' || ask === 'dec' ? 'Acceleration is the gradient: change in velocity ÷ time.' : 'Distance is the area under the graph.'],
          steps: [{ acc: md`Gradient $= ${V} \div ${t1} = ${fmt(V / t1)}$ m/s²`, dec: md`Gradient $= ${V} \div ${t3} = ${fmt(V / t3)}$ m/s²`, dist1: md`Triangle: $\tfrac12 \times ${t1} \times ${V} = ${fmt(0.5 * t1 * V)}$ m`, dist: md`$\tfrac12 \times ${t1} \times ${V} + ${t2} \times ${V} + \tfrac12 \times ${t3} \times ${V} = ${fmt(area)}$ m` }[ask]],
        };
      },
    },
    trapezia: {
      level: 3, marks: 3, skill: 'Estimating the area under a curve (grade 8–9)',
      gen(r) {
        const a = r.pick([0.2, 0.5, 1]); const c = r.int(1, 6); const n = 4; const h = r.pick([1, 2]);
        const f = (x) => a * x * x + c; const xs = Array.from({ length: n + 1 }, (_, i) => i * h); const ys = xs.map(f);
        const est = (h / 2) * (ys[0] + ys[n] + 2 * ys.slice(1, n).reduce((p, v) => p + v, 0));
        return {
          q: md`The graph of $y = ${a === 1 ? "" : fmt(a)}x^2 + ${c}$ is shown. Use ${n} strips of equal width to estimate the area under the curve between $x = 0$ and $x = ${n * h}$.`,
          diagram: grid({ xmin: 0, xmax: n * h + 1, ymin: 0, ymax: Math.ceil(f(n * h) + 2), curve: f, paths: [...xs.map((x) => [[x, 0], [x, f(x)]]), xs.map((x) => [x, f(x)])], step: h, ystep: Math.ceil(f(n * h) / 6), w: 300, h: 260 }),
          a: { kind: 'number', value: est },
          show: md`$${fmt(est)}$`,
          wrong: [fmt(h * ys.slice(1).reduce((p, v) => p + v, 0)), fmt(h * ys.slice(0, n).reduce((p, v) => p + v, 0))].filter((w) => +w !== est),
          hints: [md`Strip width $${h}$. Heights at $x = ${xs.join(', ')}$: $${ys.map((v) => fmt(v)).join(', ')}$.`, md`Each trapezium: $\tfrac12 \times (\text{left} + \text{right}) \times ${h}$. Add them up.`],
          steps: [
            md`$y$ values: ${xs.map((x, i) => `$${fmt(ys[i])}$`).join(', ')} **[M1]**`,
            md`${xs.slice(0, n).map((x, i) => `$\\tfrac12(${fmt(ys[i])} + ${fmt(ys[i + 1])}) \\times ${h}$`).join(' $+$ ')} **[M1]**`,
            md`$= ${fmt(est)}$ **[A1]**`,
          ],
        };
      },
    },
    velocityExam: {
      level: 3, marks: 4, skill: 'Multi-step velocity–time problem (grade 7–8)',
      gen(r) {
        const V = r.int(3, 9) * 2; const t1 = r.pick([4, 5, 6, 8, 10]); const t2 = r.pick([10, 12, 15, 20]); const t3 = r.pick([4, 5, 6, 8]);
        const T = t1 + t2 + t3; const D = 0.5 * t1 * V + t2 * V + 0.5 * t3 * V; const avg = D / T; const exact = Number.isInteger(avg * 10);
        return {
          q: md`A train accelerates from rest to ${V} m/s in ${t1} seconds, travels at ${V} m/s for ${t2} seconds, then slows down steadily and stops after another ${t3} seconds.

Work out the average speed of the train for the whole journey.${exact ? '' : ' Give your answer to 1 decimal place.'}`,
          diagram: grid({ xmin: 0, xmax: T + 2, ymin: 0, ymax: V + 2, paths: [[[0, 0], [t1, V], [t1 + t2, V], [T, 0]]], step: 5, ystep: 2, xlabel: 't (s)', ylabel: 'v (m/s)', w: 320, h: 240 }),
          a: { kind: 'number', value: avg, ...(exact ? {} : { dp: 1 }) },
          show: md`$${exact ? fmt(avg) : dp(avg, 1)}$ m/s`,
          wrong: [fmt(V / 2), fmt(V)].filter((w) => Math.abs(+w - avg) >= 0.05),
          hints: ['Total distance is the area under the graph.', md`Average speed $= \text{total distance} \div ${T}$ seconds.`],
          steps: [
            md`Area: $\tfrac12 \times ${t1} \times ${V} + ${t2} \times ${V} + \tfrac12 \times ${t3} \times ${V}$ **[M1]**`,
            md`$= ${fmt(0.5 * t1 * V)} + ${t2 * V} + ${fmt(0.5 * t3 * V)} = ${fmt(D)}$ m **[A1]**`,
            md`$${fmt(D)} \div ${T} = ${exact ? fmt(avg) : `${fmt(avg, 4)}\\dots`}$ **[M1]**`,
            md`$${exact ? fmt(avg) : dp(avg, 1)}$ m/s **[A1]**`,
          ],
        };
      },
    },
  },
};
