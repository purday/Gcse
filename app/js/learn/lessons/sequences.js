import { poly, lead, sterm } from '../engine.js';

const md = String.raw;

export default {
  id: 'sequences',
  title: 'Sequences and the nth term',
  subtitle: 'Linear and quadratic nth term, geometric sequences',
  topics: ['A25', 'A24', 'A23'],
  band: '6',
  calc: 'non-calc',
  minutes: 30,
  why: 'Linear nth term is a guaranteed 2 marks; the quadratic nth term (3 marks) is a grade 7 question that follows exactly the same method every time.',
  steps: [
    {
      kind: 'learn', title: 'Linear sequences',
      md: md`A **linear** sequence goes up (or down) by the same amount each time: the **common difference** $d$.

$$\text{nth term} = dn + (\text{first term} - d)$$

$5, 8, 11, 14, \dots$: $d = 3$, first term $5$, so nth term $= 3n + 2$.

Check: $n = 1$ gives $3 + 2 = 5$ ✓.`,
      key: 'The "zero term" (the term before the first) is first term − d. That is the number you add.',
    },
    { kind: 'try', template: 'linear' },
    {
      kind: 'example', title: 'Is a number in the sequence?',
      q: md`The nth term of a sequence is $4n + 3$. Is $101$ a term of the sequence?`,
      steps: [
        { md: md`Set $4n + 3 = 101$` },
        { md: md`$4n = 98$, $n = 24.5$` },
        { md: md`$n$ is not a whole number, so **no**, 101 is not in the sequence.`, why: 'Term numbers must be positive integers.' },
      ],
      answer: md`No: $n = 24.5$ is not an integer`,
    },
    { kind: 'try', template: 'isTerm' },
    {
      kind: 'learn', title: 'Quadratic sequences (grade 7)',
      md: md`If the **second** differences are constant, the nth term has an $n^2$.

1. Half the second difference is the number in front of $n^2$.
2. Subtract that $n^2$ part from each term.
3. What is left is linear: find its nth term.
4. Add the two parts.`,
    },
    {
      kind: 'example', title: 'Quadratic nth term',
      q: md`Find the nth term of $4, 11, 22, 37, 56$`,
      steps: [
        { md: md`First differences: $7, 11, 15, 19$. Second differences: $4, 4, 4$` },
        { md: md`$4 \div 2 = 2$, so it starts $2n^2$` },
        { md: md`$2n^2$: $2, 8, 18, 32, 50$. Subtract from the sequence: $2, 3, 4, 5, 6$` },
        { md: md`$2, 3, 4, 5, 6$ has nth term $n + 1$` },
        { md: md`nth term $= 2n^2 + n + 1$`, why: 'Check n = 3: 18 + 3 + 1 = 22 ✓' },
      ],
      answer: md`$2n^2 + n + 1$`,
    },
    { kind: 'try', template: 'quadratic' },
    {
      kind: 'learn', title: 'Geometric sequences',
      md: md`A **geometric** sequence **multiplies** by the same number each time (the **common ratio**).

$3, 6, 12, 24, \dots$ ratio $2$. $\quad 80, 20, 5, 1.25, \dots$ ratio $\frac14$.

Ratio = any term ÷ the term before it.`,
    },
    { kind: 'practice', title: 'Practice', templates: ['linear', 'linearDown', 'termFromN', 'isTerm', 'geometric', 'quadratic'] },
    { kind: 'exam', template: 'quadratic' },
    {
      kind: 'recap',
      md: md`- Linear: $dn + (\text{first} - d)$. Check with $n = 1$.
- To test if a number is in a sequence, solve nth term = number; it must give a whole $n$.
- Quadratic: half the second difference → $an^2$; subtract; find the linear part.
- Geometric: multiply by the ratio each time.`,
      mistakes: ['Writing n + 3 instead of 3n for a difference of 3', 'Using the full second difference instead of half', 'Saying a number is in the sequence without solving for n'],
    },
  ],
  templates: {
    linear: {
      level: 1, marks: 2, skill: 'nth term of a linear sequence',
      gen(r) {
        const d = r.int(2, 9); const c = r.int(-8, 10);
        const terms = [1, 2, 3, 4, 5].map((n) => d * n + c);
        return {
          q: md`Find an expression for the nth term of $${terms.join(', ')}, \dots$`,
          a: { kind: 'expr', expr: `${d}n+${c}`, vars: ['n'] },
          typed: `${d}n${c < 0 ? '' : '+'}${c}`,
          show: md`$${lead(d, 'n')}${c ? ` ${sterm(c)}` : ''}$`,
          wrong: [`n+${d}`, `${d}n+${terms[0]}`],
          hints: [md`The terms go up by $${d}$, so it starts $${d}n$.`, md`$${d}n$ gives $${d}, ${2 * d}, \dots$. What do you add to get $${terms[0]}, ${terms[1]}, \dots$?`],
          steps: [md`Common difference $${d}$ → $${d}n$`, md`First term $${terms[0]}$; $${terms[0]} - ${d} = ${c}$`, md`nth term $= ${lead(d, 'n')}${c ? ` ${sterm(c)}` : ''}$`],
        };
      },
    },
    linearDown: {
      level: 2, marks: 2, skill: 'nth term of a decreasing sequence',
      gen(r) {
        const d = -r.int(2, 7); const c = r.int(15, 40);
        const terms = [1, 2, 3, 4, 5].map((n) => d * n + c);
        return {
          q: md`Find an expression for the nth term of $${terms.join(', ')}, \dots$`,
          a: { kind: 'expr', expr: `${d}n+${c}`, vars: ['n'] },
          typed: `${c}${d}n`,
          show: md`$${c} - ${-d}n$`,
          wrong: [`${-d}n+${c}`],
          hints: [md`The terms go **down** by $${-d}$, so it is $-${-d}n$.`, md`$-${-d}n$ gives $${d}$ when $n = 1$. What must you add to get $${terms[0]}$?`],
          steps: [md`Difference $${d}$ → $${d}n$`, md`$${terms[0]} - (${d}) = ${c}$`, md`nth term $= ${c} - ${-d}n$`],
        };
      },
    },
    termFromN: {
      level: 1, marks: 1, skill: 'Using an nth term',
      gen(r) {
        const quad = r.bool();
        const a = quad ? r.int(1, 3) : 0; const b = r.nz(-5, 6); const c = r.int(-6, 9); const n = r.int(5, 20);
        const val = a * n * n + b * n + c;
        return {
          q: md`The nth term of a sequence is $${poly([c, b, a], 'n')}$. Work out the ${n}th term.`,
          a: { kind: 'number', value: val },
          show: md`$${val}$`,
          hints: [md`Substitute $n = ${n}$.`],
          steps: [md`$${quad ? `${a === 1 ? '' : `${a} \\times `}${n}^2 ` : ''}${quad ? sterm(b) : b} \times ${n} ${sterm(c)}$`, md`$= ${val}$`],
        };
      },
    },
    isTerm: {
      level: 2, marks: 2, skill: 'Deciding whether a number is in a sequence',
      gen(r) {
        const d = r.int(3, 9); const c = r.int(-5, 8); const yes = r.bool();
        const n = r.int(15, 40);
        const target = yes ? d * n + c : d * n + c + r.int(1, d - 1);
        const nVal = (target - c) / d;
        return {
          q: md`The nth term of a sequence is $${lead(d, 'n')} ${sterm(c)}$. Is $${target}$ a term in the sequence?`,
          a: { kind: 'choice', options: [`Yes: it is term number ${yes ? n : Math.floor(nVal)}`, `No: n would be ${+nVal.toFixed(3)}, which is not a whole number`], correct: yes ? 0 : 1 },
          show: yes ? `Yes, it is term ${n}` : `No: n = ${+nVal.toFixed(3)}`,
          hints: [md`Solve $${lead(d, 'n')} ${sterm(c)} = ${target}$.`],
          steps: [md`$${lead(d, 'n')} = ${target - c}$`, md`$n = ${+nVal.toFixed(3)}$`, yes ? 'A whole number, so yes.' : 'Not a whole number, so no.'],
        };
      },
    },
    geometric: {
      level: 2, marks: 1, skill: 'Next term of a geometric sequence',
      gen(r) {
        const start = r.int(1, 6) * r.pick([1, 2, 3]); const ratio = r.pick([2, 3, 0.5, -2]);
        const terms = [0, 1, 2, 3].map((k) => start * ratio ** k);
        const next = start * ratio ** 4;
        return {
          q: md`Write down the next term of the geometric sequence $${terms.join(', ')}, \dots$`,
          a: { kind: 'number', value: next },
          show: md`$${next}$`,
          hints: [md`Divide a term by the one before it to find the ratio.`],
          steps: [md`Ratio $= ${terms[1]} \div ${terms[0] < 0 ? `(${terms[0]})` : terms[0]} = ${ratio}$`, md`$${terms[3]} \times ${ratio < 0 ? `(${ratio})` : ratio} = ${next}$`],
        };
      },
    },
    quadratic: {
      level: 3, marks: 3, skill: 'nth term of a quadratic sequence',
      gen(r) {
        const a = r.pick([1, 1, 2, 3]); const b = r.int(-4, 5); const c = r.int(-5, 6);
        const t = [1, 2, 3, 4, 5].map((n) => a * n * n + b * n + c);
        const d1 = t.slice(1).map((v, i) => v - t[i]);
        const rest = [1, 2, 3, 4, 5].map((n, i) => t[i] - a * n * n);
        const lin = poly([c, b], 'n');
        return {
          q: md`Find an expression for the nth term of the quadratic sequence $${t.join(', ')}, \dots$`,
          a: { kind: 'expr', expr: `${a}n^2+${b}n+${c}`, vars: ['n'] },
          typed: `${a}n^2${b < 0 ? '' : '+'}${b}n${c < 0 ? '' : '+'}${c}`,
          show: md`$${poly([c, b, a], 'n')}$`,
          wrong: [`${2 * a}n^2+${b}n+${c}`],
          hints: [md`First differences: $${d1.join(', ')}$. Second difference: $${2 * a}$, so it starts $${a === 1 ? '' : a}n^2$.`, md`Subtract $${a === 1 ? '' : a}n^2$ from each term: $${rest.join(', ')}$. Find its nth term.`],
          steps: [md`Second difference $${2 * a}$ → $${a === 1 ? '' : a}n^2$ **[M1]**`, md`Sequence $- ${a === 1 ? '' : a}n^2$: $${rest.join(', ')}$ → $${lin === '0' ? '0' : lin}$ **[M1]**`, md`nth term $= ${poly([c, b, a], 'n')}$ **[A1]**`],
        };
      },
    },
  },
};
