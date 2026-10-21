const md = String.raw;

// Each formula: question LaTeX, subject, answer LaTeX, answer expression (lower-case
// variables for checking), variables, and the steps. All hand-checked; the QA test
// re-checks every answer numerically by substituting back.
const LINEAR = [
  { f: 'v = u + at', s: 't', ans: '\\dfrac{v - u}{a}', expr: '(v-u)/a', vars: ['v', 'u', 'a'], steps: ['v - u = at', 't = \\dfrac{v - u}{a}'], check: (e) => e.u + e.a * e.t - e.v },
  { f: 'P = 2l + 2w', s: 'w', ans: '\\dfrac{P - 2l}{2}', expr: '(p-2l)/2', vars: ['p', 'l'], steps: ['P - 2l = 2w', 'w = \\dfrac{P - 2l}{2}'], check: (e) => 2 * e.l + 2 * e.w - e.p },
  { f: 'y = mx + c', s: 'x', ans: '\\dfrac{y - c}{m}', expr: '(y-c)/m', vars: ['y', 'c', 'm'], steps: ['y - c = mx', 'x = \\dfrac{y - c}{m}'], check: (e) => e.m * e.x + e.c - e.y },
  { f: 'A = \\dfrac{(p + q)h}{2}', s: 'h', ans: '\\dfrac{2A}{p + q}', expr: '2a/(p+q)', vars: ['a', 'p', 'q'], steps: ['2A = (p + q)h', 'h = \\dfrac{2A}{p + q}'], check: (e) => ((e.p + e.q) * e.h) / 2 - e.a },
  { f: 'T = 5(k - 3)', s: 'k', ans: '\\dfrac{T}{5} + 3', expr: 't/5+3', vars: ['t'], steps: ['\\dfrac{T}{5} = k - 3', 'k = \\dfrac{T}{5} + 3'], check: (e) => 5 * (e.k - 3) - e.t },
  { f: 'C = \\dfrac{5(F - 32)}{9}', s: 'F', ans: '\\dfrac{9C}{5} + 32', expr: '9c/5+32', vars: ['c'], steps: ['9C = 5(F - 32)', '\\dfrac{9C}{5} = F - 32', 'F = \\dfrac{9C}{5} + 32'], check: (e) => (5 * (e.f - 32)) / 9 - e.c },
  { f: 's = \\dfrac{(u + v)t}{2}', s: 'u', ans: '\\dfrac{2s}{t} - v', expr: '2s/t-v', vars: ['s', 't', 'v'], steps: ['2s = (u + v)t', '\\dfrac{2s}{t} = u + v', 'u = \\dfrac{2s}{t} - v'], check: (e) => ((e.u + e.v) * e.t) / 2 - e.s },
  { f: 'y = \\dfrac{x}{4} - 7', s: 'x', ans: '4(y + 7)', expr: '4(y+7)', vars: ['y'], steps: ['y + 7 = \\dfrac{x}{4}', 'x = 4(y + 7)'], check: (e) => e.x / 4 - 7 - e.y },
];
const POWERS = [
  { f: 'A = \\pi r^2', s: 'r', ans: '\\sqrt{\\dfrac{A}{\\pi}}', expr: 'sqrt(a/pi)', vars: ['a'], steps: ['\\dfrac{A}{\\pi} = r^2', 'r = \\sqrt{\\dfrac{A}{\\pi}}'], check: (e) => Math.PI * e.r ** 2 - e.a },
  { f: 'E = mc^2', s: 'c', ans: '\\sqrt{\\dfrac{E}{m}}', expr: 'sqrt(e/m)', vars: ['e', 'm'], steps: ['\\dfrac{E}{m} = c^2', 'c = \\sqrt{\\dfrac{E}{m}}'], check: (e) => e.m * e.c ** 2 - e.e },
  { f: 'K = \\tfrac{1}{2}mv^2', s: 'v', ans: '\\sqrt{\\dfrac{2K}{m}}', expr: 'sqrt(2k/m)', vars: ['k', 'm'], steps: ['2K = mv^2', '\\dfrac{2K}{m} = v^2', 'v = \\sqrt{\\dfrac{2K}{m}}'], check: (e) => 0.5 * e.m * e.v ** 2 - e.k },
  { f: 'V = \\tfrac{1}{3}\\pi r^2 h', s: 'r', ans: '\\sqrt{\\dfrac{3V}{\\pi h}}', expr: 'sqrt(3v/(pi*h))', vars: ['v', 'h'], steps: ['3V = \\pi r^2 h', '\\dfrac{3V}{\\pi h} = r^2', 'r = \\sqrt{\\dfrac{3V}{\\pi h}}'], check: (e) => (Math.PI * e.r ** 2 * e.h) / 3 - e.v },
  { f: 'y = \\sqrt{x} + 4', s: 'x', ans: '(y - 4)^2', expr: '(y-4)^2', vars: ['y'], steps: ['y - 4 = \\sqrt{x}', 'x = (y - 4)^2'], check: (e) => Math.sqrt(e.x) + 4 - e.y, domain: (e) => e.y > 4 },
  { f: 'T = 2\\sqrt{\\dfrac{L}{g}}', s: 'L', ans: '\\dfrac{gT^2}{4}', expr: 'g*t^2/4', vars: ['g', 't'], steps: ['\\dfrac{T}{2} = \\sqrt{\\dfrac{L}{g}}', '\\dfrac{T^2}{4} = \\dfrac{L}{g}', 'L = \\dfrac{gT^2}{4}'], check: (e) => 2 * Math.sqrt(e.l / e.g) - e.t },
];
const TWICE = [
  { f: 'ax + 3 = bx + c', s: 'x', ans: '\\dfrac{c - 3}{a - b}', expr: '(c-3)/(a-b)', vars: ['a', 'b', 'c'], steps: ['ax - bx = c - 3', 'x(a - b) = c - 3', 'x = \\dfrac{c - 3}{a - b}'], check: (e) => e.a * e.x + 3 - e.b * e.x - e.c },
  { f: 'y = \\dfrac{x + 3}{x - 2}', s: 'x', ans: '\\dfrac{2y + 3}{y - 1}', expr: '(2y+3)/(y-1)', vars: ['y'], steps: ['y(x - 2) = x + 3', 'xy - 2y = x + 3', 'xy - x = 2y + 3', 'x(y - 1) = 2y + 3', 'x = \\dfrac{2y + 3}{y - 1}'], check: (e) => (e.x + 3) / (e.x - 2) - e.y },
  { f: 'p = \\dfrac{3k - 1}{k + 2}', s: 'k', ans: '\\dfrac{2p + 1}{3 - p}', expr: '(2p+1)/(3-p)', vars: ['p'], steps: ['p(k + 2) = 3k - 1', 'pk + 2p = 3k - 1', '2p + 1 = 3k - pk', '2p + 1 = k(3 - p)', 'k = \\dfrac{2p + 1}{3 - p}'], check: (e) => (3 * e.k - 1) / (e.k + 2) - e.p },
  { f: '\\dfrac{1}{u} + \\dfrac{1}{v} = \\dfrac{1}{f}', s: 'f', ans: '\\dfrac{uv}{u + v}', expr: 'u*v/(u+v)', vars: ['u', 'v'], steps: ['\\dfrac{v + u}{uv} = \\dfrac{1}{f}', 'f = \\dfrac{uv}{u + v}'], check: (e) => 1 / e.u + 1 / e.v - 1 / e.f },
  { f: 'm(x - 4) = 3x + n', s: 'x', ans: '\\dfrac{4m + n}{m - 3}', expr: '(4m+n)/(m-3)', vars: ['m', 'n'], steps: ['mx - 4m = 3x + n', 'mx - 3x = 4m + n', 'x(m - 3) = 4m + n', 'x = \\dfrac{4m + n}{m - 3}'], check: (e) => e.m * (e.x - 4) - 3 * e.x - e.n },
];

function makeTemplate(list, level, marks, skill) {
  return {
    level, marks, skill,
    gen(r) {
      const F = r.pick(list);
      return {
        q: md`Make $${F.s}$ the subject of $${F.f}$`,
        a: { kind: 'equation', lhsVar: F.s.toLowerCase(), expr: F.expr, vars: F.vars },
        typed: `${F.s.toLowerCase()} = ${F.expr}`,
        show: md`$${F.s} = ${F.ans}$`,
        placeholder: `${F.s} = …`,
        hints: [md`Undo what has been done to $${F.s}$ in reverse order, doing the same to both sides.`, md`First step: $${F.steps[0]}$`],
        steps: F.steps.map((s) => `$${s}$`),
        F,
      };
    },
    // Substitute random values: the answer must satisfy the original formula.
    verify(inst) {
      const F = inst.F;
      for (let i = 0; i < 5; i++) {
        const env = {};
        F.vars.forEach((v, k) => { env[v] = 1.3 + i * 0.7 + k * 0.9 + (v === 'y' && F.domain ? 4 : 0); });
        if (F.domain && !F.domain(env)) continue;
        const sub = F.s.toLowerCase();
        const val = Function(...F.vars, `return ${F.expr.replace(/pi/g, 'Math.PI').replace(/sqrt/g, 'Math.sqrt').replace(/\^/g, '**').replace(/(\d)([a-z(])/g, '$1*$2').replace(/\)\(/g, ')*(')};`)(...F.vars.map((v) => env[v]));
        env[sub] = val;
        if (Math.abs(F.check(env)) > 1e-9) return `formula ${F.f} fails at ${JSON.stringify(env)}`;
      }
      return true;
    },
  };
}

export default {
  id: 'rearranging',
  title: 'Changing the subject of a formula',
  subtitle: 'Rearranging, powers and roots, subject appearing twice',
  topics: ['A5'],
  band: '6',
  calc: 'non-calc',
  minutes: 30,
  why: 'Rearranging is a 2–4 mark question on most Higher papers, and the "subject appears twice" version is a classic grade 7 question.',
  steps: [
    {
      kind: 'learn', title: 'Same as solving an equation',
      md: md`To make a letter **the subject**, get it on its own on one side. Treat it exactly like solving an equation: **do the same to both sides**, undoing operations in **reverse order**.

$$v = u + at \quad\Rightarrow\quad v - u = at \quad\Rightarrow\quad t = \frac{v - u}{a}$$`,
      key: 'Undo: + ↔ −, × ↔ ÷, square ↔ square root. Deal with brackets and fractions first.',
    },
    {
      kind: 'example', title: 'Make F the subject',
      q: md`Make $F$ the subject of $C = \dfrac{5(F - 32)}{9}$`,
      steps: [
        { md: md`$9C = 5(F - 32)$`, why: 'Multiply both sides by 9 to clear the fraction.' },
        { md: md`$\dfrac{9C}{5} = F - 32$`, why: 'Divide both sides by 5.' },
        { md: md`$F = \dfrac{9C}{5} + 32$`, why: 'Add 32 to both sides.' },
      ],
      answer: md`$F = \dfrac{9C}{5} + 32$`,
    },
    { kind: 'try', template: 'linear' },
    {
      kind: 'learn', title: 'Squares and square roots',
      md: md`Get the squared term on its own **first**, then square root both sides.

$$A = \pi r^2 \;\Rightarrow\; \frac{A}{\pi} = r^2 \;\Rightarrow\; r = \sqrt{\frac{A}{\pi}}$$

If the letter is inside a square root, get the root on its own, then **square** both sides.`,
    },
    { kind: 'try', template: 'powers' },
    {
      kind: 'learn', title: 'When the subject appears twice (grade 7)',
      md: md`1. Clear any fractions (multiply out).
2. Expand brackets.
3. Collect **all** the terms with the subject on **one** side, everything else on the other.
4. **Factorise** the subject out.
5. Divide by the bracket.`,
    },
    {
      kind: 'example', title: 'Subject twice',
      q: md`Make $x$ the subject of $y = \dfrac{x + 3}{x - 2}$`,
      steps: [
        { md: md`$y(x - 2) = x + 3$`, why: 'Multiply both sides by (x − 2).' },
        { md: md`$xy - 2y = x + 3$` },
        { md: md`$xy - x = 2y + 3$`, why: 'x terms on the left, the rest on the right.' },
        { md: md`$x(y - 1) = 2y + 3$`, why: 'Factorise x out.' },
        { md: md`$x = \dfrac{2y + 3}{y - 1}$` },
      ],
      answer: md`$x = \dfrac{2y + 3}{y - 1}$`,
    },
    { kind: 'practice', title: 'Practice', templates: ['linear', 'linear', 'powers', 'powers', 'twice'] },
    { kind: 'exam', template: 'twice' },
    {
      kind: 'recap',
      md: md`- Do the same to both sides; undo in reverse order.
- Clear fractions early by multiplying.
- Squared subject: isolate the square, then square root. Subject in a root: isolate the root, then square.
- Subject twice: collect, **factorise**, divide.`,
      mistakes: ['Dividing only part of one side', 'Square rooting before the squared term is on its own', 'Not factorising when the subject appears twice'],
    },
  ],
  templates: {
    linear: makeTemplate(LINEAR, 1, 2, 'Rearranging a linear formula'),
    powers: makeTemplate(POWERS, 2, 3, 'Rearranging with powers and roots'),
    twice: makeTemplate(TWICE, 3, 4, 'Rearranging when the subject appears twice'),
  },
};
