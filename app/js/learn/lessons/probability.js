import { gcd, fracTex, fracPlain, fmt } from '../engine.js';
import { venn } from '../diagrams.js';

const md = String.raw;
const SETS = [
  { u: 'students in a class', a: ['F', 'play football', 'plays football'], b: ['M', 'play a musical instrument', 'plays a musical instrument'] },
  { u: 'people at a gym', a: ['S', 'swim', 'swims'], b: ['R', 'run', 'runs'] },
  { u: 'members of a club', a: ['C', 'own a cat', 'owns a cat'], b: ['D', 'own a dog', 'owns a dog'] },
  { u: 'students in Year 11', a: ['H', 'study History', 'studies History'], b: ['G', 'study Geography', 'studies Geography'] },
];

export default {
  id: 'probability',
  title: 'Probability: the essentials',
  subtitle: 'Sum to 1, expected outcomes, Venn diagrams, two-way tables',
  topics: ['P4', 'P2', 'P3', 'P6', 'P1', 'P7'],
  band: '5',
  calc: 'both',
  minutes: 30,
  why: 'These are quick, reliable marks on every series. Venn diagram notation (∩, ∪, ′) and "given that" are where Higher students drop them.',
  steps: [
    {
      kind: 'learn', title: 'The rules',
      md: md`- Every probability is between $0$ and $1$.
- The probabilities of all the possible outcomes **add up to 1**.
- $P(\text{not } A) = 1 - P(A)$.
- **Expected number** $= \text{probability} \times \text{number of trials}$.
- **Relative frequency** $= \dfrac{\text{number of times it happened}}{\text{number of trials}}$. It is an *estimate* of the probability, and more trials make it more reliable.`,
      key: 'Write probabilities as fractions, decimals or percentages, never as "3 out of 8" or "3:8".',
    },
    {
      kind: 'example', title: 'A missing probability',
      q: md`A spinner lands on red, blue or green. $P(\text{red}) = 0.35$ and $P(\text{blue}) = 0.4$. The spinner is spun 200 times. How many times would you expect it to land on green?`,
      steps: [
        { md: md`$P(\text{green}) = 1 - 0.35 - 0.4 = 0.25$`, why: 'The three probabilities add up to 1.' },
        { md: md`Expected $= 0.25 \times 200 = 50$` },
      ],
      answer: md`$50$`,
    },
    { kind: 'try', template: 'sumToOne' },
    { kind: 'try', template: 'expected' },
    {
      kind: 'learn', title: 'Venn diagrams',
      md: md`$\xi$ is everything (the universal set). Each number counts the people **in that region only**.

| Notation | Means | Region |
|---|---|---|
| $A \cap B$ | in $A$ **and** $B$ | the overlap |
| $A \cup B$ | in $A$ **or** $B$ (or both) | anything inside a circle |
| $A'$ | **not** in $A$ | everything outside circle $A$ |

To find a probability, add the regions you want and divide by the **total of every number** in the box, including the outside one.`,
      diagram: venn({ a: 'A', b: 'B', onlyA: '12', both: '5', onlyB: '8', neither: '15' }),
      key: 'In this diagram, P(A) = (12 + 5)/40, not 12/40. The 5 in the overlap is in A too.',
    },
    { kind: 'try', template: 'venn' },
    {
      kind: 'learn', title: '"Given that" (conditional probability)',
      md: md`"Given that the person is in $B$" means you **only look at $B$**. The denominator becomes the number in $B$, not the total.

In the diagram above, $P(A \text{ given } B) = \dfrac{5}{5 + 8} = \dfrac{5}{13}$.

The same idea works with a two-way table: use the **row or column total** for the group you are given.`,
    },
    { kind: 'try', template: 'conditionalVenn' },
    { kind: 'practice', title: 'Practice', templates: ['sumToOne', 'expected', 'venn', 'conditionalVenn', 'twoWay', 'relFreq'] },
    { kind: 'exam', template: 'twoWay' },
    {
      kind: 'recap',
      md: md`- All outcomes add to 1; $P(\text{not } A) = 1 - P(A)$.
- Expected number $=$ probability $\times$ trials.
- Venn: $\cap$ = and (overlap), $\cup$ = or (anything in a circle), $'$ = not.
- "Given that" changes the denominator to the group you are given.`,
      mistakes: ['Dividing by the wrong total in a Venn diagram (forgetting the outside number)', 'Reading P(A) as the "A only" region', 'Using the overall total for a "given that" question', 'Writing a probability as a ratio'],
    },
  ],
  templates: {
    sumToOne: {
      level: 1, marks: 2, skill: 'Probabilities add up to 1',
      gen(r) {
        for (;;) {
          const x = r.int(1, 6) * 0.05; const k = r.pick([2, 3]);
          const pa = r.int(1, 6) * 0.05; const pb = 1 - pa - x - k * x;
          if (pb < 0.05 || Math.abs(Math.round(pb * 20) - pb * 20) > 1e-9) continue;
          const sum = +(pa + pb).toFixed(2);
          return {
            q: md`A biased spinner can land on A, B, C or D.

| Outcome | A | B | C | D |
|---|---|---|---|---|
| Probability | ${fmt(pa)} | ${fmt(pb)} | $x$ | $${k}x$ |

Work out the value of $x$.`,
            a: { kind: 'number', value: +x.toFixed(2) },
            show: md`$x = ${fmt(x)}$`,
            wrong: [fmt(1 - sum)],
            hints: [md`They add up to 1, so $${fmt(pa)} + ${fmt(pb)} + x + ${k}x = 1$.`, md`$${k + 1}x = ${fmt(1 - sum)}$.`],
            steps: [md`$${fmt(pa)} + ${fmt(pb)} = ${fmt(sum)}$`, md`$${k + 1}x = 1 - ${fmt(sum)} = ${fmt(1 - sum)}$`, md`$x = ${fmt(1 - sum)} \div ${k + 1} = ${fmt(x)}$`],
          };
        }
      },
    },
    expected: {
      level: 1, marks: 2, skill: 'Expected outcomes',
      gen(r) {
        const p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.6, 0.65]); const n = r.pick([60, 80, 120, 200, 240, 300, 400, 500]);
        const e = p * n;
        if (!Number.isInteger(+e.toFixed(6))) return this.gen(r);
        const ev = r.pick([
          [`The probability that a train is late is ${fmt(p)}.`, `On how many of the next ${n} days would you expect the train to be late?`],
          [`The probability that a seed grows into a plant is ${fmt(p)}.`, `${n} seeds are planted. How many would you expect to grow?`],
          [`The probability that a customer pays by card is ${fmt(p)}.`, `How many of the next ${n} customers would you expect to pay by card?`],
        ]);
        return {
          q: `${ev[0]} ${ev[1]}`,
          a: { kind: 'number', value: +e.toFixed(6) },
          show: md`$${fmt(e)}$`,
          hints: [md`Expected number $=$ probability $\times$ number of trials.`],
          steps: [md`$${fmt(p)} \times ${n} = ${fmt(e)}$`],
        };
      },
    },
    relFreq: {
      level: 2, marks: 2, skill: 'Relative frequency to estimate',
      gen(r) {
        for (;;) {
          const n1 = r.pick([50, 80, 100, 200, 250, 400]); const c = r.int(Math.ceil(n1 * 0.1), Math.floor(n1 * 0.6));
          const n2 = r.pick([300, 500, 600, 750, 1000, 1200, 1500, 2000]);
          const e = (c * n2) / n1; if (!Number.isInteger(e) || n2 === n1) continue;
          return {
            q: md`A drawing pin is dropped ${n1} times. It lands point up ${c} times.

The pin is dropped another ${n2} times. Estimate the number of times it lands point up.`,
            a: { kind: 'number', value: e },
            show: md`$${e}$`,
            hints: [md`Relative frequency $= \dfrac{${c}}{${n1}}$. Use it as the probability.`],
            steps: [md`Relative frequency $= \dfrac{${c}}{${n1}}${gcd(c, n1) > 1 ? ` = ${fracTex(c, n1)}` : ''}$`, md`$${fracTex(c, n1)} \times ${n2} = ${e}$`],
          };
        }
      },
    },
    venn: {
      level: 2, marks: 2, skill: 'Probabilities from a Venn diagram',
      gen(r) {
        const s = r.pick(SETS); const [A, aw] = s.a; const [B, bw] = s.b;
        const oa = r.int(3, 20); const both = r.int(2, 12); const ob = r.int(3, 20); const nn = r.int(2, 15);
        const T = oa + both + ob + nn;
        const asks = [
          { tex: `${A} \\cap ${B}`, words: `${aw} and ${bw}`, n: both, how: md`the overlap only: $${both}$.`, wrong: oa },
          { tex: `${A} \\cup ${B}`, words: `${aw} or ${bw} (or both)`, n: oa + both + ob, how: md`everything inside the circles: $${oa} + ${both} + ${ob} = ${oa + both + ob}$.`, wrong: oa + ob },
          { tex: `${A}'`, words: `do not ${aw}`, n: ob + nn, how: md`everything outside circle $${A}$: $${ob} + ${nn} = ${ob + nn}$.`, wrong: nn },
          { tex: `${A}`, words: aw, n: oa + both, how: md`all of circle $${A}$, including the overlap: $${oa} + ${both} = ${oa + both}$.`, wrong: oa },
        ];
        const k = r.pick(asks);
        return {
          q: md`The Venn diagram shows information about ${T} ${s.u}. $${A}$ = ${aw}, $${B}$ = ${bw}.

One person is chosen at random. Work out $P(${k.tex})$.`,
          diagram: venn({ a: A, b: B, onlyA: String(oa), both: String(both), onlyB: String(ob), neither: String(nn) }),
          a: { kind: 'fraction', num: k.n, den: T },
          show: md`$${fracTex(k.n, T)}$`,
          wrong: [fracPlain(k.wrong, T)].filter((w) => k.wrong !== k.n),
          hints: [md`$${k.tex}$ means people who ${k.words}.`, md`The total is $${oa} + ${both} + ${ob} + ${nn} = ${T}$.`],
          steps: [md`$${k.tex}$: ${k.how}`, md`Total $= ${T}$`, md`$P(${k.tex}) = \dfrac{${k.n}}{${T}}${gcd(k.n, T) > 1 ? ` = ${fracTex(k.n, T)}` : ''}$`],
        };
      },
    },
    conditionalVenn: {
      level: 3, marks: 2, skill: 'Conditional probability from a Venn diagram',
      gen(r) {
        const s = r.pick(SETS); const [A, aw] = s.a; const [B, bw] = s.b;
        const oa = r.int(3, 20); const both = r.int(2, 12); const ob = r.int(3, 20); const nn = r.int(2, 15);
        const T = oa + both + ob + nn; const givenA = r.bool();
        const den = givenA ? oa + both : ob + both;
        return {
          q: md`The Venn diagram shows information about ${T} ${s.u}. $${A}$ = ${aw}, $${B}$ = ${bw}.

A person who ${givenA ? s.a[2] : s.b[2]} is chosen at random. Work out the probability that they also ${givenA ? bw : aw}.`,
          diagram: venn({ a: A, b: B, onlyA: String(oa), both: String(both), onlyB: String(ob), neither: String(nn) }),
          a: { kind: 'fraction', num: both, den },
          show: md`$${fracTex(both, den)}$`,
          wrong: [fracPlain(both, T)],
          hints: [md`You are only choosing from the people in $${givenA ? A : B}$: there are $${givenA ? oa : ob} + ${both} = ${den}$ of them.`, md`Of those, how many are also in $${givenA ? B : A}$?`],
          steps: [md`Only look inside circle $${givenA ? A : B}$: $${den}$ people`, md`$${both}$ of them are also in $${givenA ? B : A}$`, md`$\dfrac{${both}}{${den}}${gcd(both, den) > 1 ? ` = ${fracTex(both, den)}` : ''}$`],
        };
      },
    },
    twoWay: {
      level: 3, marks: 3, skill: 'Two-way tables and "given that"',
      gen(r) {
        const rows = ['Year 10', 'Year 11']; const cols = ['Walk', 'Bus', 'Car'];
        const g = [[r.int(8, 40), r.int(8, 40), r.int(5, 25)], [r.int(8, 40), r.int(8, 40), r.int(5, 25)]];
        const rt = g.map((row) => row.reduce((a, b) => a + b, 0)); const T = rt[0] + rt[1];
        const i = r.int(0, 1); const j = r.int(0, 2);
        // Half the time the number you need is the missing one: work it out from the row total.
        const blank = r.bool();
        const cell = (ri, ci) => (blank && ri === i && ci === j ? '' : String(g[ri][ci]));
        return {
          q: md`The table shows how ${T} students travel to school.${blank ? ' One number is missing.' : ''}

| | ${cols.join(' | ')} | Total |
|---|---|---|---|---|
| ${rows[0]} | ${[0, 1, 2].map((c) => cell(0, c)).join(' | ')} | ${rt[0]} |
| ${rows[1]} | ${[0, 1, 2].map((c) => cell(1, c)).join(' | ')} | ${rt[1]} |

A student is chosen at random. Given that the student is in ${rows[i]}, work out the probability that they travel by ${cols[j].toLowerCase()}.`,
          a: { kind: 'fraction', num: g[i][j], den: rt[i] },
          show: md`$${fracTex(g[i][j], rt[i])}$`,
          wrong: [fracPlain(g[i][j], T)],
          hints: [md`"Given that the student is in ${rows[i]}": only use the ${rows[i]} row. Its total is $${rt[i]}$.`],
          steps: [md`${rows[i]} total $= ${rt[i]}$`, blank ? md`Missing number $= ${rt[i]} - ${g[i].filter((_, c) => c !== j).join(' - ')} = ${g[i][j]}$` : md`${rows[i]} and ${cols[j].toLowerCase()} $= ${g[i][j]}$`, md`$\dfrac{${g[i][j]}}{${rt[i]}}${gcd(g[i][j], rt[i]) > 1 ? ` = ${fracTex(g[i][j], rt[i])}` : ''}$`],
        };
      },
    },
  },
};
