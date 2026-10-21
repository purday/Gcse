import { sf, fmt } from '../engine.js';

const md = String.raw;
const stdTex = (a, n) => `${fmt(a, 10)} \\times 10^{${n}}`;
const norm = (v) => { const n = Math.floor(Math.log10(Math.abs(v)) + 1e-12); return [+(v / 10 ** n).toPrecision(12), n]; };

export default {
  id: 'standard-form',
  title: 'Standard form',
  subtitle: 'Converting, multiplying, dividing, adding; calculator problems',
  topics: ['N9'],
  band: '5',
  calc: 'both',
  minutes: 25,
  why: 'Standard form is a dependable 2–3 marks on most papers: non-calculator multiply/divide on Paper 1 and contextual calculations on Papers 2 and 3.',
  steps: [
    {
      kind: 'learn', title: 'What standard form is',
      md: md`$$A \times 10^n \quad\text{where } 1 \le A < 10 \text{ and } n \text{ is a whole number}$$

- Big numbers: positive power. $\;3\,400\,000 = 3.4 \times 10^6$ (the point moves 6 places).
- Small numbers: negative power. $\;0.00072 = 7.2 \times 10^{-4}$ (the point moves 4 places).`,
      key: md`$42 \times 10^5$ is **not** standard form: 42 is not between 1 and 10. It is $4.2 \times 10^6$.`,
    },
    { kind: 'try', template: 'toStandard' },
    {
      kind: 'example', title: 'Multiply without a calculator',
      q: md`Work out $(4 \times 10^5) \times (6 \times 10^{-2})$. Give your answer in standard form.`,
      steps: [
        { md: md`Multiply the numbers: $4 \times 6 = 24$` },
        { md: md`Add the powers: $10^{5 + (-2)} = 10^3$` },
        { md: md`$24 \times 10^3$, but 24 is too big` },
        { md: md`$24 = 2.4 \times 10^1$, so the answer is $2.4 \times 10^4$` },
      ],
      answer: md`$2.4 \times 10^4$`,
    },
    { kind: 'try', template: 'multiply' },
    {
      kind: 'learn', title: 'Dividing and adding',
      md: md`**Divide**: divide the numbers, **subtract** the powers, then adjust.

$(3 \times 10^4) \div (6 \times 10^{-1}) = 0.5 \times 10^5 = 5 \times 10^4$

**Add or subtract**: make the powers the same first (or write both as ordinary numbers).

$3.2 \times 10^4 + 5 \times 10^3 = 32\,000 + 5\,000 = 37\,000 = 3.7 \times 10^4$`,
    },
    { kind: 'practice', title: 'Practice', templates: ['toStandard', 'toStandardSmall', 'toOrdinary', 'multiply', 'divide', 'add'] },
    { kind: 'exam', template: 'context' },
    {
      kind: 'recap',
      md: md`- $A \times 10^n$ with $1 \le A < 10$.
- Multiply: multiply numbers, add powers. Divide: divide numbers, subtract powers. Then adjust $A$.
- Add/subtract: same power first, or use ordinary numbers.
- Calculator: use the $\times 10^x$ key and bracket each number.`,
      mistakes: ['Leaving 24 × 10³ instead of 2.4 × 10⁴', 'Counting the wrong number of places for small numbers', 'Adding the numbers and powers separately when adding'],
    },
  ],
  templates: {
    toStandard: {
      level: 1, marks: 1, skill: 'Writing a large number in standard form',
      gen(r) {
        const a = r.int(11, 99) / 10; const n = r.int(4, 9);
        const v = Math.round(a * 10 ** n);
        return {
          q: md`Write $${v.toLocaleString('en-GB').replace(/,/g, '\\,')}$ in standard form.`,
          a: { kind: 'stdform', value: v },
          show: md`$${stdTex(a, n)}$`,
          hints: [md`Put the decimal point after the first digit: $${a}$. How many places did it move?`],
          steps: [md`$${a}$, and the point moves $${n}$ places`, md`$${stdTex(a, n)}$`],
        };
      },
    },
    toStandardSmall: {
      level: 1, marks: 1, skill: 'Writing a small number in standard form',
      gen(r) {
        const a = r.int(11, 99) / 10; const n = -r.int(2, 7);
        const v = +(a * 10 ** n).toPrecision(6);
        return {
          q: md`Write $${v.toFixed(-n + 1)}$ in standard form.`,
          a: { kind: 'stdform', value: v },
          show: md`$${stdTex(a, n)}$`,
          hints: [md`The first non-zero digit goes in front of the point: $${a}$. Count how many places the point moves to the right.`],
          steps: [md`$${a}$, point moves $${-n}$ places right, so the power is $${n}$`, md`$${stdTex(a, n)}$`],
        };
      },
    },
    toOrdinary: {
      level: 1, marks: 1, skill: 'Converting from standard form',
      gen(r) {
        const a = r.int(11, 99) / 10; const n = r.pick([-4, -3, -2, 3, 4, 5]);
        const v = +(a * 10 ** n).toPrecision(6);
        return {
          q: md`Write $${stdTex(a, n)}$ as an ordinary number.`,
          a: { kind: 'number', value: v },
          show: md`$${n < 0 ? v.toFixed(-n + 1) : v}$`,
          hints: [md`Move the decimal point $${Math.abs(n)}$ places ${n > 0 ? 'right (bigger)' : 'left (smaller)'}.`],
          steps: [md`$${stdTex(a, n)} = ${n < 0 ? v.toFixed(-n + 1) : v}$`],
        };
      },
    },
    multiply: {
      level: 2, marks: 2, skill: 'Multiplying in standard form',
      gen(r) {
        const a = r.int(2, 9); const b = r.int(2, 9); const m = r.int(-6, 8); const n = r.int(-6, 8);
        const [A, e] = norm(a * b);
        return {
          q: md`Work out $(${a} \times 10^{${m}}) \times (${b} \times 10^{${n}})$. Give your answer in standard form.`,
          a: { kind: 'stdform', value: a * b * 10 ** (m + n) },
          show: md`$${stdTex(A, e + m + n)}$`,
          hints: [md`$${a} \times ${b} = ${a * b}$ and add the powers: $${m} + ${n < 0 ? `(${n})` : n} = ${m + n}$.`, a * b >= 10 ? md`$${a * b}$ is not between 1 and 10: $${a * b} = ${A} \times 10^{1}$.` : md`Check the number part is between 1 and 10.`],
          steps: [md`$${a * b} \times 10^{${m + n}}$`, a * b >= 10 ? md`$= ${A} \times 10^{1} \times 10^{${m + n}} = ${stdTex(A, e + m + n)}$` : md`$= ${stdTex(A, m + n)}$`],
        };
      },
    },
    divide: {
      level: 2, marks: 2, skill: 'Dividing in standard form',
      gen(r) {
        const b = r.int(2, 8); const q = r.pick([0.5, 0.25, 1.5, 2, 3, 4, 0.4, 0.8]); const a = +(b * q).toPrecision(6);
        if (a >= 10 || a < 1) return this.gen(r);
        const m = r.int(-4, 9); const n = r.int(-6, 6);
        const [A, e] = norm(q);
        return {
          q: md`Work out $(${a} \times 10^{${m}}) \div (${b} \times 10^{${n}})$. Give your answer in standard form.`,
          a: { kind: 'stdform', value: q * 10 ** (m - n) },
          show: md`$${stdTex(A, e + m - n)}$`,
          hints: [md`$${a} \div ${b} = ${q}$; subtract the powers: $${m} - ${n < 0 ? `(${n})` : n} = ${m - n}$.`],
          steps: [md`$${q} \times 10^{${m - n}}$`, md`$= ${stdTex(A, e + m - n)}$`],
        };
      },
    },
    add: {
      level: 2, marks: 2, skill: 'Adding numbers in standard form',
      gen(r) {
        const a = r.int(11, 99) / 10; const b = r.int(11, 99) / 10; const n = r.int(3, 7); const k = r.int(1, 2);
        const v = a * 10 ** n + b * 10 ** (n - k);
        return {
          q: md`Work out $${stdTex(a, n)} + ${stdTex(b, n - k)}$. Give your answer in standard form.`,
          a: { kind: 'stdform', value: +v.toPrecision(10) },
          show: md`$${stdTex(...norm(v))}$`,
          hints: [md`Write both as ordinary numbers, or both with $10^{${n}}$, before adding.`],
          steps: [md`$${(a * 10 ** n).toLocaleString('en-GB').replace(/,/g, '\\,')} + ${(b * 10 ** (n - k)).toLocaleString('en-GB').replace(/,/g, '\\,')} = ${(+v.toPrecision(10)).toLocaleString('en-GB').replace(/,/g, '\\,')}$`, md`$= ${stdTex(...norm(v))}$`],
        };
      },
    },
    context: {
      level: 3, marks: 3, skill: 'Standard form calculations in context',
      gen(r) {
        const ctx = r.pick([
          { q: 'The mass of one grain of sand is {a} grams. How many grains of sand are in {b} kg of sand?', a: () => r.int(11, 99) / 10 * 10 ** -r.int(3, 5), b: () => r.int(2, 9), calc: (a, b) => (b * 1000) / a },
          { q: 'Light travels at {a} metres per second. How far does light travel in {b} seconds?', a: () => 3 * 10 ** 8, b: () => r.int(12, 95) * 10, calc: (a, b) => a * b },
          { q: 'A virus is {a} m long. How many of these viruses, end to end, would make a line {b} cm long?', a: () => r.int(11, 99) / 10 * 10 ** -r.int(7, 8), b: () => r.int(2, 9), calc: (a, b) => (b / 100) / a },
        ]);
        const A = ctx.a(); const B = ctx.b(); const v = ctx.calc(A, B);
        const [x0, e] = norm(+sf(v, 3));
        const x = x0.toFixed(2); // 3 significant figures, keeping trailing zeros
        const [ax, ae] = norm(A);
        return {
          q: md`${ctx.q.replace('{a}', `$${stdTex(ax, ae)}$`).replace('{b}', `$${B}$`)}

Give your answer in standard form to 3 significant figures.`,
          a: { kind: 'stdform', value: v, sf: 3 },
          show: md`$${x} \times 10^{${e}}$`,
          hints: ['Check the units match first (grams with grams, metres with metres).', 'Type the standard form numbers into the calculator using the ×10ˣ key.'],
          steps: [md`Units first, then the calculation: $${stdTex(...norm(+v.toPrecision(6)))}$ **[M1 M1]**`, md`$${x} \times 10^{${e}}$ to 3 s.f. **[A1]**`],
        };
      },
    },
  },
};
