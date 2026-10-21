import { lin, poly, sterm, lead } from '../engine.js';

const md = String.raw;

export default {
  id: 'proof',
  title: 'Algebraic proof',
  subtitle: 'Odd, even, consecutive, multiples, identities',
  topics: ['A6'],
  band: '7',
  calc: 'non-calc',
  minutes: 30,
  why: 'A "prove that" question (3–4 marks) appears on most series. Students skip them, but the marks come from a short, standard routine.',
  steps: [
    {
      kind: 'learn', title: 'Writing numbers with algebra',
      md: md`Let $n$ be any integer.

| Number | Algebra |
|---|---|
| any even number | $2n$ |
| any odd number | $2n + 1$ |
| consecutive integers | $n,\; n + 1,\; n + 2$ |
| consecutive even numbers | $2n,\; 2n + 2$ |
| consecutive odd numbers | $2n + 1,\; 2n + 3$ |
| a multiple of 5 | $5n$ |

You **cannot** use examples to prove something: $3 + 4 + 5 = 12$ shows it works once, not always.`,
    },
    { kind: 'try', template: 'represent' },
    {
      kind: 'learn', title: 'The routine',
      md: md`1. Write the numbers using $n$.
2. Expand and simplify.
3. **Factor out** the number you need: $8n + 12 = 4(2n + 3)$.
4. **Conclude** in words: "$4(2n + 3)$ is $4 \times$ an integer, so it is a multiple of 4."`,
      key: 'The last line earns the final mark. Always say why your expression is odd / even / a multiple.',
    },
    {
      kind: 'example', title: 'A full proof',
      q: md`Prove that the sum of three consecutive integers is a multiple of 3.`,
      steps: [
        { md: md`Let the integers be $n$, $n + 1$, $n + 2$.` },
        { md: md`$n + (n + 1) + (n + 2) = 3n + 3$` },
        { md: md`$= 3(n + 1)$` },
        { md: md`$3(n + 1)$ is $3 \times$ an integer, so the sum is a multiple of 3.` },
      ],
      answer: md`$3(n + 1)$, a multiple of 3`,
    },
    { kind: 'try', template: 'consecutive' },
    { kind: 'try', template: 'identity' },
    {
      kind: 'learn', title: 'Identities',
      md: md`$\equiv$ means "identical for **every** value of $x$". To find unknown numbers, expand the left side and **match the coefficients** of $x^2$, $x$ and the constant.

$(x + 4)^2 - (x + 1)(x + 3) \equiv ax + b$: the left side is $x^2 + 8x + 16 - x^2 - 4x - 3 = 4x + 13$, so $a = 4$ and $b = 13$.`,
    },
    { kind: 'try', template: 'matchCoefficients' },
    { kind: 'practice', title: 'Practice', templates: ['represent', 'consecutive', 'identity', 'matchCoefficients', 'conclude'] },
    { kind: 'exam', template: 'oddSquares' },
    {
      kind: 'recap',
      md: md`- Even $2n$, odd $2n + 1$, consecutive $n, n + 1, \dots$
- Expand, simplify, factor out the number you need.
- Finish with a sentence: "… is $k \times$ an integer, so …".
- Identities: expand and match coefficients.`,
      mistakes: ['Using examples instead of algebra', 'Using n and n + 1 for two odd numbers', 'Stopping at 8n + 12 without factorising', 'No concluding sentence'],
    },
  ],
  templates: {
    represent: {
      level: 1, marks: 1, skill: 'Writing odd, even and consecutive numbers',
      gen(r) {
        const qs = [
          { q: 'Which expression is always an odd number when $n$ is an integer?', opts: ['$2n + 1$', '$2n$', '$n + 1$', '$n^2$'] },
          { q: 'Which expression is always an even number when $n$ is an integer?', opts: ['$2n + 4$', '$2n + 1$', '$n + 2$', '$3n$'] },
          { q: 'Which pair are two consecutive odd numbers?', opts: ['$2n + 1$ and $2n + 3$', '$2n + 1$ and $2n + 2$', '$n$ and $n + 1$', '$2n - 1$ and $2n + 2$'] },
          { q: 'Which pair are two consecutive even numbers?', opts: ['$2n$ and $2n + 2$', '$2n$ and $2n + 1$', '$n$ and $n + 2$', '$2n$ and $4n$'] },
          { q: 'Which expression is always a multiple of 6 when $n$ is an integer?', opts: ['$6n + 12$', '$6n + 3$', '$n + 6$', '$3n + 6$'] },
        ];
        const k = r.pick(qs); const order = r.shuffle([0, 1, 2, 3]);
        return {
          q: k.q,
          a: { kind: 'choice', options: order.map((i) => k.opts[i]), correct: order.indexOf(0) },
          show: k.opts[0],
          hints: ['Try $n = 1, 2, 3$ in each option to see which one always works.'],
          steps: [md`${k.opts[0]} is the only one that works for **every** integer $n$.`],
        };
      },
    },
    consecutive: {
      level: 2, marks: 3, skill: 'Sums of consecutive integers',
      gen(r) {
        const kind = r.pick(['ints3', 'ints4', 'ints5', 'odds2', 'odds4']);
        const spec = {
          ints3: { words: 'three consecutive integers', terms: ['n', 'n + 1', 'n + 2'], A: 3, B: 3, m: 3, f: 'n + 1', claim: 'a multiple of 3' },
          ints4: { words: 'four consecutive integers', terms: ['n', 'n + 1', 'n + 2', 'n + 3'], A: 4, B: 6, m: 2, f: '2n + 3', claim: 'even' },
          ints5: { words: 'five consecutive integers', terms: ['n', 'n + 1', 'n + 2', 'n + 3', 'n + 4'], A: 5, B: 10, m: 5, f: 'n + 2', claim: 'a multiple of 5' },
          odds2: { words: 'two consecutive odd numbers', terms: ['2n + 1', '2n + 3'], A: 4, B: 4, m: 4, f: 'n + 1', claim: 'a multiple of 4' },
          odds4: { words: 'four consecutive odd numbers', terms: ['2n + 1', '2n + 3', '2n + 5', '2n + 7'], A: 8, B: 16, m: 8, f: 'n + 2', claim: 'a multiple of 8' },
        }[kind];
        return {
          q: md`Show that the sum of ${spec.words} is always ${spec.claim}.

Write the sum using $n$ and simplify it.`,
          a: { kind: 'expr', expr: `${spec.A}n+${spec.B}`, vars: ['n'], form: 'simplified' },
          typed: `${spec.A}n + ${spec.B}`,
          show: md`$${spec.A}n + ${spec.B} = ${spec.m}(${spec.f})$`,
          wrong: [`${spec.A}n`],
          hints: [md`Use $${spec.terms.join(',\\; ')}$.`, md`Add them and collect like terms.`],
          steps: [md`$${spec.terms.map((t) => (t === 'n' ? t : `(${t})`)).join(' + ')} = ${spec.A}n + ${spec.B}$`, md`$= ${spec.m}(${spec.f})$`, md`$${spec.m} \times$ an integer, so it is ${spec.claim}.`],
        };
      },
    },
    identity: {
      level: 2, marks: 3, skill: 'Expanding to prove a result',
      gen(r) {
        const fam = r.pick(['diffSq', 'nextSq', 'productPlus']);
        if (fam === 'diffSq') {
          const a = r.int(1, 6);
          return {
            q: md`Show that $(n + ${a})^2 - (n - ${a})^2$ is a multiple of $${4 * a}$ for all integers $n$. Expand and simplify the expression.`,
            a: { kind: 'expr', expr: `${4 * a}n`, vars: ['n'], form: 'simplified' },
            typed: `${4 * a}n`,
            show: md`$${4 * a}n$`,
            wrong: [`${2 * a}n`, '0'],
            hints: [md`$(n + ${a})^2 = n^2 + ${2 * a}n + ${a * a}$ and $(n - ${a})^2 = n^2 - ${2 * a}n + ${a * a}$.`, md`Subtract the **whole** second bracket.`],
            steps: [md`$n^2 + ${2 * a}n + ${a * a} - (n^2 - ${2 * a}n + ${a * a})$`, md`$= ${4 * a}n$`, md`$${4 * a}n = ${4 * a} \times n$, a multiple of $${4 * a}$.`],
          };
        }
        if (fam === 'nextSq') {
          return {
            q: md`Show that the difference between the squares of two consecutive integers is always odd. Write $(n + 1)^2 - n^2$ in its simplest form.`,
            a: { kind: 'expr', expr: '2n+1', vars: ['n'], form: 'simplified' },
            typed: '2n + 1',
            show: md`$2n + 1$`,
            wrong: ['1', '2n'],
            hints: [md`$(n + 1)^2 = n^2 + 2n + 1$.`],
            steps: [md`$n^2 + 2n + 1 - n^2 = 2n + 1$`, md`$2n$ is even, so $2n + 1$ is odd.`],
          };
        }
        const a = r.int(1, 5);
        // n(n + 2a) + a^2 = (n + a)^2
        return {
          q: md`Show that $n(n + ${2 * a}) + ${a * a}$ is always a square number. Write it in the form $(n + k)^2$.`,
          a: { kind: 'expr', expr: `(n+${a})^2`, vars: ['n'], form: 'factorised', fully: false },
          typed: `(n + ${a})^2`,
          show: md`$(n + ${a})^2$`,
          hints: [md`Expand: $n^2 + ${2 * a}n + ${a * a}$. Which bracket squared gives that?`],
          steps: [md`$n^2 + ${2 * a}n + ${a * a}$`, md`$= (n + ${a})^2$, the square of an integer.`],
        };
      },
    },
    matchCoefficients: {
      level: 3, marks: 3, skill: 'Finding unknowns in an identity',
      gen(r) {
        const p = r.int(1, 6); const q = r.nz(-5, 5); const s = r.nz(-5, 5); if (q + s === 2 * p) return this.gen(r);
        // (x + p)^2 - (x + q)(x + s) = (2p - q - s)x + (p² - qs)
        const A = 2 * p - q - s; const B = p * p - q * s;
        return {
          q: md`$(x + ${p})^2 - (${lin(1, q)})(${lin(1, s)}) \equiv ax + b$. Find the values of $a$ and $b$.`,
          a: { kind: 'multi', parts: [{ label: '$a =$', spec: { kind: 'number', value: A } }, { label: '$b =$', spec: { kind: 'number', value: B } }] },
          show: md`$a = ${A}$, $b = ${B}$`,
          wrong: [[String(2 * p + q + s), String(p * p + q * s)]].filter(() => q + s !== 0 && q * s !== 0),
          hints: [md`$(x + ${p})^2 = x^2 + ${2 * p}x + ${p * p}$ and $(${lin(1, q)})(${lin(1, s)}) = ${poly([q * s, q + s, 1])}$.`, md`Subtract the whole second expansion, then match the $x$ terms and the numbers.`],
          steps: [md`$x^2 + ${2 * p}x + ${p * p} - (${poly([q * s, q + s, 1])})$`, md`$= ${poly([B, A])}$`, md`$a = ${A}$, $b = ${B}$`],
        };
      },
    },
    conclude: {
      level: 2, marks: 1, skill: 'Writing the conclusion',
      gen(r) {
        const k = r.pick([2, 3, 4, 5, 6, 8]); const c = r.int(1, 9); const ex = `${k}(${lead(r.int(1, 4), 'n')} + ${c})`;
        const opts = [
          `${ex} is ${k} × an integer, so it is a multiple of ${k}.`,
          `It works for n = 1 and n = 2, so it is always a multiple of ${k}.`,
          `${ex} has a ${k} in it.`,
          `${ex} is an integer, so it is a multiple of ${k}.`,
        ];
        const order = r.shuffle([0, 1, 2, 3]);
        return {
          q: md`A proof ends with the expression $${ex}$. Which sentence correctly finishes the proof that it is a multiple of ${k}?`,
          a: { kind: 'choice', options: order.map((i) => opts[i]), correct: order.indexOf(0) },
          show: opts[0],
          hints: ['Examples are not a proof. Say what it is a multiple of and why.'],
          steps: [`The bracket is an integer (n is an integer), so ${k} × (integer) is a multiple of ${k}.`],
        };
      },
    },
    oddSquares: {
      level: 3, marks: 4, skill: 'Proof with consecutive odd numbers (grade 8)',
      gen(r) {
        const a = r.pick([1, 3, 5]);
        // (2n + a + 2)^2 - (2n + a)^2 = 4(2n + a + 1) = 8n + 4a + 4
        const kind = r.pick(['oddDiff', 'shift']);
        if (kind === 'oddDiff') {
          return {
            q: md`Prove that the difference between the squares of two consecutive odd numbers is always a multiple of 8.

Use $2n + 1$ and $2n + 3$. Write $(2n + 3)^2 - (2n + 1)^2$ in its simplest form.`,
            a: { kind: 'expr', expr: '8n+8', vars: ['n'], form: 'simplified' },
            typed: '8n + 8',
            show: md`$8n + 8 = 8(n + 1)$`,
            wrong: ['8n', '4n+8', '8'],
            hints: [md`$(2n + 3)^2 = 4n^2 + 12n + 9$ and $(2n + 1)^2 = 4n^2 + 4n + 1$.`],
            steps: [md`$(4n^2 + 12n + 9) - (4n^2 + 4n + 1)$ **[M1]**`, md`$= 8n + 8$ **[A1]**`, md`$= 8(n + 1)$ **[M1]**`, md`$8 \times$ an integer, so a multiple of 8 **[A1]**`],
          };
        }
        return {
          q: md`Prove that $(2n + ${a + 2})^2 - (2n ${sterm(a)})^2$ is a multiple of 8 for all integers $n$. Expand and simplify the expression.`,
          a: { kind: 'expr', expr: `${8}n+${4 * a + 4}`, vars: ['n'], form: 'simplified' },
          typed: `8n + ${4 * a + 4}`,
          show: md`$8n + ${4 * a + 4} = 8(n + ${(a + 1) / 2})$`,
          wrong: [`8n+${(a + 2) ** 2 + a * a}`],
          hints: [md`$(2n + ${a + 2})^2 = 4n^2 + ${4 * (a + 2)}n + ${(a + 2) ** 2}$.`, md`$(2n + ${a})^2 = 4n^2 + ${4 * a}n + ${a * a}$. Subtract.`],
          steps: [md`$(4n^2 + ${4 * (a + 2)}n + ${(a + 2) ** 2}) - (4n^2 + ${4 * a}n + ${a * a})$ **[M1]**`, md`$= 8n + ${4 * a + 4}$ **[A1]**`, md`$= 8(n + ${(a + 1) / 2})$ **[M1]**`, md`$8 \times$ an integer, so a multiple of 8 **[A1]**`],
        };
      },
    },
  },
};
