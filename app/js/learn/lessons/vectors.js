import { fmt, dp, isSquare, gcd } from '../engine.js';
import { vectorFig } from '../diagrams.js';

const md = String.raw;
const col = (p, q) => `\\begin{pmatrix} ${p} \\\\ ${q} \\end{pmatrix}`;
const A = '\\mathbf{a}'; const B = '\\mathbf{b}';
// TeX for xa + yb with fractional coefficients, e.g. \frac{2}{3}a + \frac{1}{3}b.
function comb(x, y) {
  const term = (k, v) => {
    if (k === 0) return '';
    const s = k < 0 ? '-' : '+'; const m = Math.abs(k);
    const coef = m === 1 ? '' : Number.isInteger(m) ? String(m) : fracCoef(m);
    return `${s} ${coef}${v}`;
  };
  const out = `${term(x, A)} ${term(y, B)}`.trim().replace(/^\+ /, '').replace(/^- /, '-');
  return out || '0';
}
function fracCoef(m) {
  for (let d = 2; d <= 12; d++) { const n = Math.round(m * d); if (Math.abs(n / d - m) < 1e-9) { const g = gcd(n, d); return `\\tfrac{${n / g}}{${d / g}}`; } }
  return fmt(m);
}
const plain = (x, y) => `${x}*a+${y}*b`;

export default {
  id: 'vectors',
  title: 'Vectors',
  subtitle: 'Column vectors, paths through a shape, ratios, parallel',
  topics: ['G25', 'G24'],
  band: '8',
  calc: 'non-calc',
  minutes: 35,
  why: 'Vector geometry is usually one of the last questions on a paper (4–5 marks, grade 8–9). The first marks (writing a path in terms of a and b) are very gettable.',
  steps: [
    {
      kind: 'learn', title: 'Column vectors',
      md: md`$${col(3, -2)}$ means 3 right and 2 down.

- Add or subtract the tops and the bottoms: $${col(3, -2)} + ${col(1, 5)} = ${col(4, 3)}$.
- Multiply both numbers by a scalar: $2${col(3, -2)} = ${col(6, -4)}$.
- Length (magnitude): $\left|${col(3, 4)}\right| = \sqrt{3^2 + 4^2} = 5$.`,
    },
    { kind: 'try', template: 'columns' },
    {
      kind: 'learn', title: 'Paths',
      md: md`To get from one point to another, follow a **path** along known vectors. Going **against** an arrow makes it negative.

If $\overrightarrow{OA} = ${A}$ and $\overrightarrow{OB} = ${B}$, then
$$\overrightarrow{AB} = \overrightarrow{AO} + \overrightarrow{OB} = -${A} + ${B} = ${B} - ${A}$$`,
      diagram: vectorFig({ pts: { O: [0, 0], A: [1, 2], B: [4, 0.5] }, arrows: [['O', 'A', 'a'], ['O', 'B', 'b']], segs: [['A', 'B']] }),
      key: 'AB = (end) − (start) when both start from O: b − a.',
    },
    { kind: 'try', template: 'path' },
    {
      kind: 'learn', title: 'Midpoints and ratios',
      md: md`$M$ is the midpoint of $AB$: $\overrightarrow{OM} = ${A} + \tfrac12(${B} - ${A}) = \tfrac12${A} + \tfrac12${B}$.

$P$ divides $AB$ in the ratio $1 : 2$: $P$ is $\tfrac13$ of the way from $A$ to $B$, so $\overrightarrow{OP} = ${A} + \tfrac13(${B} - ${A})$.`,
      key: 'For a ratio m : n, the fraction of the way along is m/(m + n).',
    },
    { kind: 'try', template: 'ratioPoint' },
    {
      kind: 'learn', title: 'Parallel and collinear',
      md: md`Two vectors are **parallel** if one is a multiple of the other: $2${A} + 4${B} = 2(${A} + 2${B})$ is parallel to $${A} + 2${B}$.

Points $P$, $Q$, $R$ are **on a straight line** if $\overrightarrow{PQ}$ and $\overrightarrow{QR}$ are parallel **and** share the point $Q$.`,
    },
    { kind: 'practice', title: 'Practice', templates: ['columns', 'magnitude', 'path', 'ratioPoint', 'parallelogram'] },
    { kind: 'exam', template: 'examPath' },
    {
      kind: 'recap',
      md: md`- Column vectors: add tops and bottoms; length $\sqrt{x^2 + y^2}$.
- Paths: follow known vectors; against the arrow is negative.
- Ratio $m : n$ along $AB$: go $\frac{m}{m + n}$ of $\overrightarrow{AB}$.
- Parallel means a multiple; collinear also needs a shared point.`,
      mistakes: ['Writing AB as a − b', 'Using m/n instead of m/(m + n) for a ratio', 'Not simplifying the final vector', 'Saying "parallel" without showing the multiple'],
    },
  ],
  templates: {
    columns: {
      level: 1, marks: 2, skill: 'Column vector arithmetic',
      gen(r) {
        const a = [r.int(-6, 6), r.int(-6, 6)]; const b = [r.int(-6, 6), r.int(-6, 6)]; const m = r.int(2, 4); const n = r.nz(-3, 3);
        const res = [m * a[0] + n * b[0], m * a[1] + n * b[1]];
        return {
          q: md`$${A} = ${col(...a)}$ and $${B} = ${col(...b)}$. Work out $${m}${A} ${n < 0 ? '-' : '+'} ${Math.abs(n) === 1 ? '' : Math.abs(n)}${B}$ as a column vector.`,
          a: { kind: 'multi', parts: [{ label: 'Top', spec: { kind: 'number', value: res[0] } }, { label: 'Bottom', spec: { kind: 'number', value: res[1] } }] },
          show: md`$${col(...res)}$`,
          wrong: [[String(res[1]), String(res[0])]].filter(() => res[0] !== res[1]),
          hints: [md`$${m}${A} = ${col(m * a[0], m * a[1])}$ and $${n}${B} = ${col(n * b[0], n * b[1])}$.`],
          steps: [md`$${col(m * a[0], m * a[1])} + ${col(n * b[0], n * b[1])}$`, md`$= ${col(...res)}$`],
        };
      },
    },
    magnitude: {
      level: 2, marks: 2, skill: 'Magnitude of a vector',
      gen(r) {
        const x = r.nz(-9, 9); const y = r.nz(-9, 9); const s = x * x + y * y; const exact = isSquare(s);
        return {
          q: md`Work out the magnitude of $${col(x, y)}$.${exact ? '' : ' Give your answer to 1 decimal place.'}`,
          a: { kind: 'number', value: Math.sqrt(s), ...(exact ? {} : { dp: 1 }) },
          show: md`$${exact ? Math.sqrt(s) : dp(Math.sqrt(s), 1)}$`,
          wrong: [String(Math.abs(x) + Math.abs(y))].filter((w) => Math.abs(+w - Math.sqrt(s)) > 0.05),
          hints: [md`Pythagoras: $\sqrt{${x < 0 ? `(${x})` : x}^2 + ${y < 0 ? `(${y})` : y}^2}$.`],
          steps: [md`$\sqrt{${x * x} + ${y * y}} = \sqrt{${s}}${exact ? ` = ${Math.sqrt(s)}` : ` = ${dp(Math.sqrt(s), 3)}\\dots`}$`],
        };
      },
    },
    path: {
      level: 2, marks: 2, skill: 'Writing a vector path',
      gen(r) {
        const ask = r.pick(['AB', 'BA', 'AM', 'OM']);
        const ans = { AB: [-1, 1], BA: [1, -1], AM: [-0.5, 0.5], OM: [0.5, 0.5] }[ask];
        const word = { AB: md`$\overrightarrow{AB}$`, BA: md`$\overrightarrow{BA}$`, AM: md`$\overrightarrow{AM}$`, OM: md`$\overrightarrow{OM}$` }[ask];
        const hasM = ask.includes('M');
        return {
          q: md`$\overrightarrow{OA} = ${A}$ and $\overrightarrow{OB} = ${B}$.${hasM ? ' $M$ is the midpoint of $AB$.' : ''} Write ${word} in terms of $${A}$ and $${B}$.`,
          diagram: vectorFig({ pts: { O: [0, 0], A: [1, 2.2], B: [4, 0.4], ...(hasM ? { M: [2.5, 1.3] } : {}) }, arrows: [['O', 'A', 'a'], ['O', 'B', 'b']], segs: [['A', 'B']], dots: hasM ? ['M'] : [] }),
          a: { kind: 'expr', expr: plain(...ans), vars: ['a', 'b'] },
          typed: { AB: 'b - a', BA: 'a - b', AM: '1/2(b - a)', OM: '1/2(a + b)' }[ask],
          show: md`$${comb(...ans)}$`,
          wrong: [plain(-ans[0], -ans[1])],
          placeholder: 'e.g. b - a',
          hints: [{ AB: md`Go from $A$ back to $O$ ($-${A}$), then out to $B$ ($+${B}$).`, BA: md`Go from $B$ back to $O$ ($-${B}$), then out to $A$ ($+${A}$).`, AM: md`$\overrightarrow{AM}$ is half of $\overrightarrow{AB} = ${B} - ${A}$.`, OM: md`$\overrightarrow{OM} = \overrightarrow{OA} + \overrightarrow{AM}$.` }[ask]],
          steps: [{ AB: md`$\overrightarrow{AB} = -${A} + ${B}$`, BA: md`$\overrightarrow{BA} = -${B} + ${A}$`, AM: md`$\overrightarrow{AM} = \tfrac12\overrightarrow{AB} = \tfrac12(${B} - ${A})$`, OM: md`$\overrightarrow{OM} = ${A} + \tfrac12(${B} - ${A})$` }[ask], md`$= ${comb(...ans)}$`],
        };
      },
    },
    ratioPoint: {
      level: 3, marks: 3, skill: 'A point dividing a line in a ratio',
      gen(r) {
        const m = r.int(1, 4); const n = r.int(1, 4); if (gcd(m, n) !== 1 || m === n) return this.gen(r);
        const f = m / (m + n); const ans = [1 - f, f];
        const Pp = [1 + f * 3, 2.2 - f * 1.8];
        return {
          q: md`$\overrightarrow{OA} = ${A}$ and $\overrightarrow{OB} = ${B}$. $P$ is on $AB$ with $AP : PB = ${m} : ${n}$.

Write $\overrightarrow{OP}$ in terms of $${A}$ and $${B}$. Simplify your answer.`,
          diagram: vectorFig({ pts: { O: [0, 0], A: [1, 2.2], B: [4, 0.4], P: Pp }, arrows: [['O', 'A', 'a'], ['O', 'B', 'b']], segs: [['A', 'B']], dots: ['P'] }),
          a: { kind: 'expr', expr: `${ans[0]}*a+${ans[1]}*b`, vars: ['a', 'b'] },
          typed: `${n}/${m + n}a + ${m}/${m + n}b`,
          show: md`$${comb(...ans)}$`,
          wrong: [`a+${m}/${n}*(b-a)`, `a+${n}/${m + n}*(b-a)`],
          placeholder: 'e.g. 2/3a + 1/3b',
          hints: [md`$P$ is $\tfrac{${m}}{${m + n}}$ of the way from $A$ to $B$.`, md`$\overrightarrow{OP} = ${A} + \tfrac{${m}}{${m + n}}(${B} - ${A})$.`],
          steps: [md`$\overrightarrow{AB} = ${B} - ${A}$ **[M1]**`, md`$\overrightarrow{OP} = ${A} + \tfrac{${m}}{${m + n}}(${B} - ${A})$ **[M1]**`, md`$= ${comb(...ans)}$ **[A1]**`],
        };
      },
    },
    parallelogram: {
      level: 2, marks: 2, skill: 'Vectors in a parallelogram',
      gen(r) {
        const ask = r.pick(['AC', 'BD', 'DB', 'CA']);
        // OABC... use ABCD with AB = a, AD = b
        const ans = { AC: [1, 1], BD: [-1, 1], DB: [1, -1], CA: [-1, -1] }[ask];
        return {
          q: md`$ABCD$ is a parallelogram. $\overrightarrow{AB} = ${A}$ and $\overrightarrow{AD} = ${B}$. Write $\overrightarrow{${ask}}$ in terms of $${A}$ and $${B}$.`,
          diagram: vectorFig({ pts: { A: [0, 0], B: [3, 0], C: [4, 2], D: [1, 2] }, arrows: [['A', 'B', 'a'], ['A', 'D', 'b']], segs: [['B', 'C'], ['C', 'D'], ['A', 'C'], ['B', 'D']] }),
          a: { kind: 'expr', expr: plain(...ans), vars: ['a', 'b'] },
          typed: { AC: 'a + b', BD: 'b - a', DB: 'a - b', CA: '-a - b' }[ask],
          show: md`$${comb(...ans)}$`,
          wrong: [plain(-ans[0], -ans[1])],
          placeholder: 'e.g. a + b',
          hints: [md`Opposite sides of a parallelogram are equal vectors: $\overrightarrow{DC} = ${A}$ and $\overrightarrow{BC} = ${B}$.`],
          steps: [{ AC: md`$\overrightarrow{AC} = \overrightarrow{AB} + \overrightarrow{BC}$`, BD: md`$\overrightarrow{BD} = \overrightarrow{BA} + \overrightarrow{AD} = -${A} + ${B}$`, DB: md`$\overrightarrow{DB} = \overrightarrow{DA} + \overrightarrow{AB} = -${B} + ${A}$`, CA: md`$\overrightarrow{CA} = -\overrightarrow{AC} = -(${A} + ${B})$` }[ask], md`$= ${comb(...ans)}$`],
        };
      },
    },
    examPath: {
      level: 3, marks: 4, skill: 'Multi-step vector path (grade 8)',
      gen(r) {
        // OAB triangle; M midpoint of OA; N on AB with AN : NB = 1 : k. Find MN.
        const k = r.int(1, 3);
        const f = 1 / (1 + k); // fraction along AB
        // ON = a + f(b - a) = (1 - f)a + f b ; OM = a/2 ; MN = (1/2 - f)a + f b
        const ans = [0.5 - f, f];
        const N = [1 + f * 3, 2.2 - f * 1.8];
        return {
          q: md`$OAB$ is a triangle. $\overrightarrow{OA} = ${A}$ and $\overrightarrow{OB} = ${B}$.

$M$ is the midpoint of $OA$. $N$ is on $AB$ with $AN : NB = 1 : ${k}$.

Write $\overrightarrow{MN}$ in terms of $${A}$ and $${B}$. Simplify your answer.`,
          diagram: vectorFig({ pts: { O: [0, 0], A: [1, 2.2], B: [4, 0.4], M: [0.5, 1.1], N }, arrows: [['O', 'A', 'a', 0.25], ['O', 'B', 'b']], segs: [['A', 'B'], ['M', 'N']], dots: ['M', 'N'] }),
          a: { kind: 'expr', expr: `${ans[0]}*a+${ans[1]}*b`, vars: ['a', 'b'] },
          typed: `${ans[0]}a + ${ans[1]}b`,
          show: md`$${comb(...ans)}$`,
          wrong: [`${0.5 + f}*a+${f}*b`, `${1 - f}*a+${f}*b`],
          placeholder: 'e.g. 1/4a + 1/2b',
          hints: [md`$\overrightarrow{MN} = \overrightarrow{MA} + \overrightarrow{AN}$.`, md`$\overrightarrow{MA} = \tfrac12${A}$ and $\overrightarrow{AN} = \tfrac{1}{${k + 1}}(${B} - ${A})$.`],
          steps: [
            md`$\overrightarrow{MA} = \tfrac12${A}$ **[B1]**`,
            md`$\overrightarrow{AN} = \tfrac{1}{${k + 1}}\overrightarrow{AB} = \tfrac{1}{${k + 1}}(${B} - ${A})$ **[M1]**`,
            md`$\overrightarrow{MN} = \tfrac12${A} + \tfrac{1}{${k + 1}}${B} - \tfrac{1}{${k + 1}}${A}$ **[M1]**`,
            md`$= ${comb(...ans)}$ **[A1]**`,
          ],
        };
      },
    },
  },
};
