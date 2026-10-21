import { lin, lead, sterm, br, fmt, poly } from '../engine.js';

const md = String.raw;
// Plain-text linear expression for the answer checker, e.g. "3*x-5".
const linPlain = (a, b) => `${a}*x${b < 0 ? '-' : '+'}${Math.abs(b)}`;

export default {
  id: 'functions',
  title: 'Functions: composite and inverse',
  subtitle: 'f(a), fg(x), f⁻¹(x) and solving with functions',
  topics: ['A7'],
  band: '7',
  calc: 'non-calc',
  minutes: 30,
  why: 'Function notation is Higher-only and is on nearly every series (2–5 marks). It looks scary but follows two simple rules.',
  steps: [
    {
      kind: 'learn', title: 'Function notation',
      md: md`$f(x) = 3x - 5$ is a rule: "multiply by 3, then subtract 5".

$f(4)$ means put $4$ in for $x$: $f(4) = 3 \times 4 - 5 = 7$.

$f(2a)$ means put $2a$ in for $x$: $f(2a) = 6a - 5$.`,
    },
    { kind: 'try', template: 'evaluate' },
    {
      kind: 'learn', title: 'Composite functions',
      md: md`$fg(x)$ means **do $g$ first, then $f$**. Work from the right, the function nearest the $x$ goes first.

With $f(x) = 3x - 5$ and $g(x) = x + 2$:

- $fg(1) = f(g(1)) = f(3) = 4$
- $fg(x) = f(x + 2) = 3(x + 2) - 5 = 3x + 1$`,
      key: 'fg(x): replace every x in f with the whole of g(x), in a bracket.',
    },
    { kind: 'try', template: 'compositeNumber' },
    { kind: 'try', template: 'compositeExpr' },
    {
      kind: 'learn', title: 'Inverse functions',
      md: md`$f^{-1}(x)$ **undoes** $f$. To find it:

1. Write $y = f(x)$.
2. Rearrange to make $x$ the subject.
3. Swap: write the result with $x$ in place of $y$.

$y = 3x - 5 \Rightarrow y + 5 = 3x \Rightarrow x = \dfrac{y + 5}{3}$, so $f^{-1}(x) = \dfrac{x + 5}{3}$.`,
      key: 'Check: f⁻¹(f(2)) should give 2 back.',
    },
    { kind: 'try', template: 'inverse' },
    { kind: 'practice', title: 'Practice', templates: ['evaluate', 'compositeNumber', 'compositeExpr', 'inverse', 'inverseFraction', 'solveComposite'] },
    { kind: 'exam', template: 'inverseEqual' },
    {
      kind: 'recap',
      md: md`- $f(a)$: substitute $a$ for $x$.
- $fg(x)$: $g$ first, then $f$. Substitute $g(x)$, in a bracket, into $f$.
- $f^{-1}(x)$: $y = f(x)$, make $x$ the subject, swap $y$ for $x$.`,
      mistakes: ['Doing fg in the wrong order (f first)', 'Thinking f⁻¹(x) means 1 ÷ f(x)', 'Forgetting the bracket when substituting into f', 'Not swapping y back to x at the end'],
    },
  ],
  templates: {
    evaluate: {
      level: 1, marks: 1, skill: 'Evaluating a function',
      gen(r) {
        const a = r.nz(-5, 6); const b = r.int(-9, 9); const c = r.nz(-3, 4); const quad = r.bool();
        const x = r.nz(-5, 6);
        const val = quad ? x * x + b * x + c : a * x + b;
        return {
          q: md`$f(x) = ${quad ? poly([c, b, 1]) : lin(a, b)}$. Work out $f(${x})$.`,
          a: { kind: 'number', value: val },
          show: md`$${val}$`,
          wrong: quad && x < 0 ? [String(-x * x + b * x + c)].filter((w) => +w !== val) : [],
          hints: [md`Replace every $x$ with $${br(x)}$.`],
          steps: [quad ? md`$${br(x)}^2 ${b ? `${b < 0 ? '-' : '+'} ${Math.abs(b)} \\times ${br(x)}` : ''} ${sterm(c)} = ${val}$` : md`$${a === 1 ? '' : a === -1 ? '-' : `${a} \\times `}${br(x)} ${sterm(b)} = ${val}$`],
        };
      },
    },
    compositeNumber: {
      level: 2, marks: 2, skill: 'Composite function with a number',
      gen(r) {
        const a = r.nz(-4, 5); const b = r.int(-8, 8); const c = r.nz(-3, 4); const d = r.int(-6, 6); const x = r.int(-4, 5);
        const f = (v) => a * v + b; const g = (v) => c * v + d; const fgFirst = r.bool();
        const inner = fgFirst ? g(x) : f(x); const val = fgFirst ? f(inner) : g(inner);
        const wrongVal = fgFirst ? g(f(x)) : f(g(x));
        return {
          q: md`$f(x) = ${lin(a, b)}$ and $g(x) = ${lin(c, d)}$. Work out $${fgFirst ? 'fg' : 'gf'}(${x})$.`,
          a: { kind: 'number', value: val },
          show: md`$${val}$`,
          wrong: [String(wrongVal)].filter((w) => +w !== val),
          hints: [md`$${fgFirst ? 'fg' : 'gf'}(${x})$: work out $${fgFirst ? 'g' : 'f'}(${x})$ first.`],
          steps: [md`$${fgFirst ? 'g' : 'f'}(${x}) = ${inner}$`, md`$${fgFirst ? 'f' : 'g'}(${inner}) = ${val}$`],
        };
      },
    },
    compositeExpr: {
      level: 2, marks: 2, skill: 'Finding fg(x) as an expression',
      gen(r) {
        const a = r.nz(-4, 5); const b = r.int(-8, 8); const c = r.nz(-3, 4); const d = r.nz(-6, 6); const fgFirst = r.bool();
        // fg(x) = a(cx + d) + b ; gf(x) = c(ax + b) + d
        const [A, B] = fgFirst ? [a * c, a * d + b] : [a * c, c * b + d];
        const [outer, innerTex] = fgFirst ? [[a, b], lin(c, d)] : [[c, d], lin(a, b)];
        return {
          q: md`$f(x) = ${lin(a, b)}$ and $g(x) = ${lin(c, d)}$. Find $${fgFirst ? 'fg' : 'gf'}(x)$. Simplify your answer.`,
          a: { kind: 'expr', expr: linPlain(A, B), form: 'simplified' },
          typed: lin(A, B),
          show: md`$${fgFirst ? 'fg' : 'gf'}(x) = ${lin(A, B)}$`,
          wrong: [fgFirst ? linPlain(a * c, c * b + d) : linPlain(a * c, a * d + b)].filter((w) => w !== linPlain(A, B)),
          hints: [md`Put $${innerTex}$ in place of $x$ in $${fgFirst ? 'f' : 'g'}(x) = ${lin(...outer)}$.`],
          steps: [md`$${fgFirst ? 'f' : 'g'}(${innerTex}) = ${outer[0] === 1 ? '' : outer[0] === -1 ? '-' : outer[0]}(${innerTex}) ${sterm(outer[1])}$`, md`$= ${lin(A, B)}$`],
        };
      },
    },
    inverse: {
      level: 2, marks: 2, skill: 'Inverse of a linear function',
      gen(r) {
        const a = r.int(2, 7); const b = r.nz(-9, 9);
        return {
          q: md`$f(x) = ${lin(a, b)}$. Find $f^{-1}(x)$.`,
          a: { kind: 'expr', expr: `(x${b < 0 ? '+' : '-'}${Math.abs(b)})/${a}` },
          show: md`$f^{-1}(x) = \dfrac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`,
          wrong: [`${a}x${b < 0 ? '-' : '+'}${Math.abs(b)}`, `x/${a}${b < 0 ? '+' : '-'}${Math.abs(b)}`, `1/(${linPlain(a, b)})`],
          placeholder: 'e.g. (x+5)/3',
          hints: [md`Write $y = ${lin(a, b)}$ and make $x$ the subject.`, md`$y ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${a}x$.`],
          steps: [md`$y = ${lin(a, b)}$`, md`$y ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${a}x$`, md`$x = \dfrac{y ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`, md`$f^{-1}(x) = \dfrac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`],
        };
      },
    },
    inverseFraction: {
      level: 3, marks: 3, skill: 'Inverse of a fractional function',
      gen(r) {
        const a = r.int(2, 6); const b = r.nz(-6, 6); const c = r.int(2, 5);
        // f(x) = (ax + b)/c  =>  f^-1(x) = (cx - b)/a
        return {
          q: md`$f(x) = \dfrac{${lin(a, b)}}{${c}}$. Find $f^{-1}(x)$.`,
          a: { kind: 'expr', expr: `(${c}x${b < 0 ? '+' : '-'}${Math.abs(b)})/${a}` },
          show: md`$f^{-1}(x) = \dfrac{${c}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`,
          wrong: [`(${c}x${b < 0 ? '-' : '+'}${Math.abs(b)})/${a}`, `(x${b < 0 ? '+' : '-'}${Math.abs(b)})/${a * c}`],
          placeholder: 'e.g. (2x-3)/5',
          hints: [md`$y = \dfrac{${lin(a, b)}}{${c}}$. Multiply both sides by $${c}$ first.`],
          steps: [md`$${c}y = ${lin(a, b)}$`, md`$${c}y ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${a}x$`, md`$x = \dfrac{${c}y ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`, md`$f^{-1}(x) = \dfrac{${c}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`],
        };
      },
    },
    solveComposite: {
      level: 3, marks: 3, skill: 'Solving an equation involving a composite function',
      gen(r) {
        const a = r.nz(-4, 5); const b = r.int(-8, 8); const c = r.int(2, 4); const d = r.nz(-6, 6); const x = r.int(-5, 6);
        // fg(x) = a(cx + d) + b = k
        const A = a * c; const B = a * d + b; const k = A * x + B;
        return {
          q: md`$f(x) = ${lin(a, b)}$ and $g(x) = ${lin(c, d)}$. Solve $fg(x) = ${k}$.`,
          a: { kind: 'number', value: x },
          show: md`$x = ${x}$`,
          hints: [md`First find $fg(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(${lin(c, d)}) ${sterm(b)}$ and simplify.`, md`$fg(x) = ${lin(A, B)}$. Now solve $${lin(A, B)} = ${k}$.`],
          steps: [md`$fg(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(${lin(c, d)}) ${sterm(b)} = ${lin(A, B)}$ **[M1]**`, md`$${lin(A, B)} = ${k}$ **[M1]**`, md`$${lead(A, 'x')} = ${k - B}$, so $x = ${x}$ **[A1]**`],
        };
      },
    },
    inverseEqual: {
      level: 3, marks: 4, skill: 'Solving f(x) = f⁻¹(x) (grade 8)',
      gen(r) {
        for (;;) {
          const a = r.int(2, 5); const b = r.nz(-12, 12);
          // ax + b = (x - b)/a  =>  a²x + ab = x - b  =>  x(a² - 1) = -b(a + 1)  =>  x = -b/(a - 1)
          const x = -b / (a - 1); if (!Number.isInteger(x)) continue;
          return {
            q: md`$f(x) = ${lin(a, b)}$. Solve $f(x) = f^{-1}(x)$.`,
            a: { kind: 'number', value: x },
            show: md`$x = ${x}$`,
            hints: [md`First find $f^{-1}(x) = \dfrac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$.`, md`Then solve $${lin(a, b)} = \dfrac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$: multiply both sides by $${a}$.`],
            steps: [
              md`$f^{-1}(x) = \dfrac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$ **[M1]**`,
              md`$${a}(${lin(a, b)}) = x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$ **[M1]**`,
              md`$${lin(a * a, a * b)} = x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$, so $${lead(a * a - 1, 'x')} = ${-b - a * b}$ **[M1]**`,
              md`$x = ${x}$ **[A1]**`,
            ],
            verify: () => (a * x + b === (x - b) / a) || 'f(x) and f^-1(x) differ at the answer',
          };
        }
      },
    },
  },
};
