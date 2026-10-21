import { gcd, fracTex, fracPlain, fmt, simplify } from '../engine.js';
import { tree } from '../diagrams.js';

const md = String.raw;
const COLOURS = [['red', 'blue'], ['green', 'yellow'], ['black', 'white'], ['orange', 'purple']];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const simp = (n, d) => (gcd(n, d) > 1 ? ` = ${fracTex(n, d)}` : '');

// Tree for two picks from a bag of x of colour c1 and y of colour c2.
function bagTree(x, y, c1, c2, replace) {
  const n = x + y; const m = replace ? n : n - 1;
  const lab = (a, d) => `${a}/${d}`;
  return tree({
    first: [{ p: lab(x, n), label: cap(c1) }, { p: lab(y, n), label: cap(c2) }],
    second: [
      [{ p: lab(replace ? x : x - 1, m), label: cap(c1) }, { p: lab(y, m), label: cap(c2) }],
      [{ p: lab(x, m), label: cap(c1) }, { p: lab(replace ? y : y - 1, m), label: cap(c2) }],
    ],
  });
}

export default {
  id: 'tree-diagrams',
  title: 'Tree diagrams and combined events',
  subtitle: 'AND = multiply, OR = add, without replacement, at least one',
  topics: ['P8', 'P9', 'P7'],
  band: '6',
  calc: 'both',
  minutes: 35,
  why: 'A tree diagram question (3–4 marks) is on almost every Higher series. "Without replacement" and "at least one" are the grade 6–7 versions; the algebraic version is a grade 8 favourite.',
  steps: [
    {
      kind: 'learn', title: 'AND means multiply, OR means add',
      md: md`For two events one after the other:

- **Along** the branches: **multiply** ($A$ then $B$).
- **Between** different routes: **add** (this route **or** that route).

The branches from any one point always add up to 1.`,
      diagram: bagTree(3, 5, 'red', 'blue', true),
      key: 'Before you multiply, write down which routes you need, e.g. "RB or BR".',
    },
    {
      kind: 'example', title: 'With replacement',
      q: md`A bag has 3 red and 5 blue counters. A counter is taken, replaced, and a second counter is taken. Work out the probability that the counters are different colours.`,
      steps: [
        { md: md`Routes: red then blue, **or** blue then red.` },
        { md: md`$P(RB) = \frac38 \times \frac58 = \frac{15}{64}$` },
        { md: md`$P(BR) = \frac58 \times \frac38 = \frac{15}{64}$` },
        { md: md`$\frac{15}{64} + \frac{15}{64} = \frac{30}{64} = \frac{15}{32}$`, why: 'Two different routes, so add.' },
      ],
      answer: md`$\frac{15}{32}$`,
    },
    { kind: 'try', template: 'withReplace' },
    {
      kind: 'learn', title: 'Without replacement',
      md: md`If the first counter is **not put back**, the second pick has **one fewer counter in total**, and one fewer of the colour that was taken.

With 3 red and 5 blue: after taking a red, there are 2 red and 5 blue left, so $P(\text{red second}) = \frac27$.`,
      diagram: bagTree(3, 5, 'red', 'blue', false),
    },
    {
      kind: 'example', title: 'Without replacement',
      q: md`A bag has 3 red and 5 blue sweets. Sam takes two sweets without replacement. Work out the probability that both sweets are the same colour.`,
      steps: [
        { md: md`$P(RR) = \frac38 \times \frac27 = \frac{6}{56}$` },
        { md: md`$P(BB) = \frac58 \times \frac47 = \frac{20}{56}$` },
        { md: md`$\frac{6}{56} + \frac{20}{56} = \frac{26}{56} = \frac{13}{28}$` },
      ],
      answer: md`$\frac{13}{28}$`,
    },
    { kind: 'try', template: 'noReplace' },
    {
      kind: 'learn', title: '"At least one"',
      md: md`"At least one" covers lots of routes. It is quicker to use the opposite:

$$P(\text{at least one}) = 1 - P(\text{none})$$

If the probability it rains on a day is $0.3$, then over two days $P(\text{at least one wet day}) = 1 - 0.7 \times 0.7 = 0.51$.`,
    },
    { kind: 'try', template: 'atLeastOne' },
    { kind: 'practice', title: 'Practice', templates: ['withReplace', 'noReplace', 'atLeastOne', 'dependentEvents'] },
    {
      kind: 'example', title: 'Grade 8: probability with algebra',
      q: md`There are $n$ sweets in a bag. 6 are orange. Hannah takes two sweets without replacement. The probability that both are orange is $\frac13$. Work out $n$.`,
      steps: [
        { md: md`$\dfrac{6}{n} \times \dfrac{5}{n - 1} = \dfrac13$` },
        { md: md`$\dfrac{30}{n(n - 1)} = \dfrac13$, so $n(n - 1) = 90$` },
        { md: md`$n^2 - n - 90 = 0$` },
        { md: md`$(n - 10)(n + 9) = 0$, so $n = 10$`, why: 'n is a number of sweets, so it must be positive.' },
      ],
      answer: md`$n = 10$`,
    },
    { kind: 'exam', template: 'algebraic' },
    {
      kind: 'recap',
      md: md`- Along branches multiply; different routes add.
- Without replacement: the second denominator is one less, and so is the count of the colour already taken.
- At least one $= 1 - P(\text{none})$.
- Algebra version: form the product, cross-multiply, solve the quadratic, reject the negative.`,
      mistakes: ['Adding along branches instead of multiplying', 'Forgetting the second route (RB and BR)', 'Not reducing the denominator without replacement', 'Working out every "at least one" route instead of 1 − P(none)'],
    },
  ],
  templates: {
    withReplace: {
      level: 2, marks: 3, skill: 'Tree diagrams with replacement',
      gen(r) {
        const x = r.int(2, 7); const y = r.int(2, 8); const n = x + y; const [c1, c2] = r.pick(COLOURS);
        const ask = r.pick(['same', 'diff', 'both1']);
        const num = ask === 'same' ? x * x + y * y : ask === 'diff' ? 2 * x * y : x * x; const den = n * n;
        const wrongNum = ask === 'same' ? x * x : x * y;
        return {
          q: md`A bag has ${x} ${c1} and ${y} ${c2} counters. A counter is taken at random, then **replaced**. A second counter is taken.

Work out the probability that ${ask === 'same' ? 'both counters are the same colour' : ask === 'diff' ? 'the counters are different colours' : `both counters are ${c1}`}.`,
          diagram: bagTree(x, y, c1, c2, true),
          a: { kind: 'fraction', num, den },
          show: md`$${fracTex(num, den)}$`,
          // Common slips: only one route, or adding along the branches.
          wrong: ask === 'both1' ? [fracPlain(2 * x, n)] : [fracPlain(wrongNum, den)],
          hints: [ask === 'same' ? md`Two routes: ${c1} then ${c1}, **or** ${c2} then ${c2}.` : ask === 'diff' ? md`Two routes: ${c1} then ${c2}, **or** ${c2} then ${c1}.` : md`One route: ${c1} then ${c1}. Multiply along it.`, md`Each pick is out of $${n}$.`],
          steps: ask === 'same'
            ? [md`$\frac{${x}}{${n}} \times \frac{${x}}{${n}} = \frac{${x * x}}{${den}}$`, md`$\frac{${y}}{${n}} \times \frac{${y}}{${n}} = \frac{${y * y}}{${den}}$`, md`$\frac{${x * x}}{${den}} + \frac{${y * y}}{${den}} = \frac{${num}}{${den}}${simp(num, den)}$`]
            : ask === 'diff'
              ? [md`$\frac{${x}}{${n}} \times \frac{${y}}{${n}} = \frac{${x * y}}{${den}}$`, md`The other order is the same: $\frac{${x * y}}{${den}}$`, md`$2 \times \frac{${x * y}}{${den}} = \frac{${num}}{${den}}${simp(num, den)}$`]
              : [md`$\frac{${x}}{${n}} \times \frac{${x}}{${n}} = \frac{${num}}{${den}}${simp(num, den)}$`],
        };
      },
    },
    noReplace: {
      level: 3, marks: 3, skill: 'Tree diagrams without replacement',
      gen(r) {
        const x = r.int(2, 7); const y = r.int(2, 8); const n = x + y; const [c1, c2] = r.pick(COLOURS);
        const ask = r.pick(['same', 'diff', 'both1']);
        const den = n * (n - 1);
        const num = ask === 'same' ? x * (x - 1) + y * (y - 1) : ask === 'diff' ? 2 * x * y : x * (x - 1);
        const withRep = ask === 'same' ? [x * x + y * y, n * n] : ask === 'diff' ? [2 * x * y, n * n] : [x * x, n * n];
        return {
          q: md`A bag has ${x} ${c1} and ${y} ${c2} sweets. Two sweets are taken at random **without replacement**.

Work out the probability that ${ask === 'same' ? 'both sweets are the same colour' : ask === 'diff' ? 'one sweet of each colour is taken' : `both sweets are ${c1}`}.`,
          diagram: bagTree(x, y, c1, c2, false),
          a: { kind: 'fraction', num, den },
          show: md`$${fracTex(num, den)}$`,
          wrong: [fracPlain(...withRep)].filter(() => withRep[0] * den !== num * withRep[1]),
          hints: [md`After the first sweet there are only $${n - 1}$ left.`, ask === 'diff' ? md`Two routes: ${c1} then ${c2}, or ${c2} then ${c1}.` : ask === 'same' ? md`Two routes: ${c1}${c1} or ${c2}${c2}. After a ${c1}, there are $${x - 1}$ ${c1} left.` : md`After a ${c1}, there are $${x - 1}$ ${c1} left.`],
          steps: ask === 'same'
            ? [md`$\frac{${x}}{${n}} \times \frac{${x - 1}}{${n - 1}} = \frac{${x * (x - 1)}}{${den}}$`, md`$\frac{${y}}{${n}} \times \frac{${y - 1}}{${n - 1}} = \frac{${y * (y - 1)}}{${den}}$`, md`Add: $\frac{${num}}{${den}}${simp(num, den)}$`]
            : ask === 'diff'
              ? [md`$\frac{${x}}{${n}} \times \frac{${y}}{${n - 1}} = \frac{${x * y}}{${den}}$`, md`$\frac{${y}}{${n}} \times \frac{${x}}{${n - 1}} = \frac{${x * y}}{${den}}$`, md`Add: $\frac{${num}}{${den}}${simp(num, den)}$`]
              : [md`$\frac{${x}}{${n}} \times \frac{${x - 1}}{${n - 1}} = \frac{${num}}{${den}}${simp(num, den)}$`],
        };
      },
    },
    atLeastOne: {
      level: 2, marks: 3, skill: '"At least one" using 1 − P(none)',
      gen(r) {
        const p = r.pick([0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35]); const k = r.pick([2, 3]);
        const none = (1 - p) ** k; const ans = 1 - none;
        const ctx = r.pick([
          [`The probability that it rains on any day is ${fmt(p)}.`, `it rains on at least one of the next ${k} days`],
          [`The probability that Ravi misses the bus on any morning is ${fmt(p)}.`, `he misses the bus on at least one of ${k} mornings`],
          [`The probability that a light bulb is faulty is ${fmt(p)}.`, `at least one of ${k} bulbs is faulty`],
        ]);
        return {
          q: md`${ctx[0]} Assume each ${ctx[1].includes('day') ? 'day' : ctx[1].includes('morning') ? 'morning' : 'bulb'} is independent.

Work out the probability that ${ctx[1]}.`,
          a: { kind: 'number', value: +ans.toFixed(10) },
          show: md`$${fmt(ans, 6)}$`,
          wrong: [fmt(k * p), fmt(p ** k)],
          hints: [md`$P(\text{none}) = ${fmt(1 - p)}^${k}$.`, md`$P(\text{at least one}) = 1 - P(\text{none})$.`],
          steps: [md`$P(\text{not}) = 1 - ${fmt(p)} = ${fmt(1 - p)}$`, md`$P(\text{none}) = ${fmt(1 - p)}^${k} = ${fmt(none, 6)}$`, md`$1 - ${fmt(none, 6)} = ${fmt(ans, 6)}$`],
        };
      },
    },
    dependentEvents: {
      level: 2, marks: 3, skill: 'Tree diagram where the second event depends on the first',
      gen(r) {
        const p = r.pick([0.2, 0.3, 0.4, 0.6, 0.7]); const q1 = r.pick([0.6, 0.7, 0.8, 0.9]); const q2 = r.pick([0.3, 0.4, 0.5]);
        const ans = p * q1 + (1 - p) * q2;
        return {
          q: md`The probability that Mia's bus is late is ${fmt(p)}.

- If the bus is late, the probability that Mia is late for school is ${fmt(q1)}.
- If the bus is not late, the probability that Mia is late for school is ${fmt(q2)}.

Work out the probability that Mia is late for school.`,
          diagram: tree({
            first: [{ p: fmt(p), label: 'Bus late' }, { p: fmt(1 - p), label: 'Not late' }],
            second: [[{ p: fmt(q1), label: 'Mia late' }, { p: fmt(1 - q1), label: 'On time' }], [{ p: fmt(q2), label: 'Mia late' }, { p: fmt(1 - q2), label: 'On time' }]],
          }),
          a: { kind: 'number', value: +ans.toFixed(10) },
          show: md`$${fmt(ans)}$`,
          wrong: [fmt(p * q1)].filter((w) => w !== fmt(ans)),
          hints: [md`Two routes end with "Mia late": bus late **and** Mia late, **or** bus not late **and** Mia late.`],
          steps: [md`$${fmt(p)} \times ${fmt(q1)} = ${fmt(p * q1)}$`, md`$${fmt(1 - p)} \times ${fmt(q2)} = ${fmt((1 - p) * q2)}$`, md`$${fmt(p * q1)} + ${fmt((1 - p) * q2)} = ${fmt(ans)}$`],
        };
      },
    },
    algebraic: {
      level: 3, marks: 4, skill: 'Probability with an unknown number (grade 8)',
      gen(r) {
        const n = r.int(7, 16); const k = r.int(3, n - 2);
        const [pn, pd] = simplify(k * (k - 1), n * (n - 1));
        const X = n * (n - 1);
        const name = r.pick(['Hannah', 'Leo', 'Priya', 'Tom']); const c = r.pick(['orange', 'red', 'green']);
        return {
          q: md`There are $n$ sweets in a bag. ${k} of them are ${c}. ${name} takes two sweets at random without replacement.

The probability that both sweets are ${c} is $${fracTex(pn, pd)}$. Work out the value of $n$.`,
          a: { kind: 'number', value: n },
          show: md`$n = ${n}$`,
          hints: [md`$\dfrac{${k}}{n} \times \dfrac{${k - 1}}{n - 1} = ${fracTex(pn, pd)}$`, md`Cross-multiply to get $n(n - 1) = ${X}$, then solve the quadratic.`],
          steps: [
            md`$\dfrac{${k}}{n} \times \dfrac{${k - 1}}{n - 1} = ${fracTex(pn, pd)}$ **[M1]**`,
            md`$\dfrac{${k * (k - 1)}}{n(n - 1)} = ${fracTex(pn, pd)}$, so $n(n - 1) = ${X}$ **[M1]**`,
            md`$n^2 - n - ${X} = 0$, which factorises as $(n - ${n})(n + ${n - 1}) = 0$ **[M1]**`,
            md`$n = ${n}$ (not $-${n - 1}$: you cannot have a negative number of sweets) **[A1]**`,
          ],
          verify: () => (k * (k - 1) * pd === pn * X && n * n - n === X) || 'inconsistent',
        };
      },
    },
  },
};
