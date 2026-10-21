import { gcd, fracTex, simplify } from '../engine.js';

const md = String.raw;
// Recurring block of 2+ digits: dot on the first and last digit only.
const rec = (s) => (s.length === 1 ? `\\dot{${s}}` : `\\dot{${s[0]}}${s.slice(1, -1)}\\dot{${s.at(-1)}}`);

export default {
  id: 'recurring',
  title: 'Recurring decimals to fractions',
  subtitle: 'The 10x, 100x method and why it works',
  topics: ['N10'],
  band: '7',
  calc: 'non-calc',
  minutes: 20,
  why: '"Prove that 0.4545… = 5/11" is a 2–3 mark Higher-only question that appears regularly on Paper 1. The method is identical every time.',
  steps: [
    {
      kind: 'learn', title: 'The method',
      md: md`The dots show which digits repeat: $0.${rec('45')} = 0.454545\dots$

1. Let $x$ = the decimal.
2. Multiply by $10$, $100$ or $1000$ so the repeating part lines up (one repeating block = one zero per digit).
3. Subtract to remove the repeating part.
4. Solve for $x$ and simplify.

$x = 0.4545\dots$, $100x = 45.4545\dots$, so $99x = 45$ and $x = \dfrac{45}{99} = \dfrac{5}{11}$.`,
      key: 'Write out several digits of each line so the examiner can see the repeating parts cancel.',
    },
    { kind: 'try', template: 'pure' },
    {
      kind: 'example', title: 'When the recurring part starts later',
      q: md`Write $0.1${rec('6')}$ as a fraction in its simplest form.`,
      steps: [
        { md: md`$x = 0.1666\dots$` },
        { md: md`$10x = 1.666\dots$ and $100x = 16.666\dots$`, why: 'Both now have the same repeating tail.' },
        { md: md`$100x - 10x = 90x = 15$` },
        { md: md`$x = \dfrac{15}{90} = \dfrac{1}{6}$` },
      ],
      answer: md`$\dfrac{1}{6}$`,
    },
    { kind: 'try', template: 'mixed' },
    { kind: 'practice', title: 'Practice', templates: ['pure', 'mixed', 'pure3', 'terminating'] },
    { kind: 'exam', template: 'mixed2' },
    {
      kind: 'recap',
      md: md`- $x = $ decimal; multiply by a power of 10 to line up the repeating digits.
- Subtract, solve, simplify.
- A fraction in its simplest form gives a terminating decimal only if the denominator has no prime factors other than 2 and 5.`,
      mistakes: ['Multiplying by 10 when two digits repeat (it must be 100)', 'Not simplifying the final fraction', 'Not showing the subtraction (the proof mark)'],
    },
  ],
  templates: {
    pure: {
      level: 2, marks: 2, skill: 'Two repeating digits to a fraction',
      gen(r) {
        const n = r.int(1, 98); if (n % 11 === 0) return this.gen(r);
        const s = String(n).padStart(2, '0');
        const [a, d] = simplify(n, 99);
        return {
          q: md`Write $0.${rec(s)}$ as a fraction in its simplest form.`,
          a: { kind: 'fraction', num: n, den: 99, simplest: true },
          show: md`$${fracTex(n, 99)}$`,
          wrong: [`${n}/100`],
          hints: [md`Two digits repeat, so multiply by $100$.`, md`$100x - x = 99x$.`],
          steps: [md`$x = 0.${s}${s}${s}\dots$`, md`$100x = ${n}.${s}${s}\dots$`, md`$99x = ${n}$, so $x = \dfrac{${n}}{99}${gcd(n, 99) > 1 ? ` = ${fracTex(a, d)}` : ''}$`],
        };
      },
    },
    pure3: {
      level: 2, marks: 2, skill: 'Three repeating digits to a fraction',
      gen(r) {
        const n = r.int(1, 998); if (n % 111 === 0) return this.gen(r);
        const s = String(n).padStart(3, '0');
        const [a, d] = simplify(n, 999);
        return {
          q: md`Write $0.${rec(s)}$ as a fraction in its simplest form.`,
          a: { kind: 'fraction', num: n, den: 999, simplest: true },
          show: md`$${fracTex(n, 999)}$`,
          hints: [md`Three digits repeat, so multiply by $1000$.`],
          steps: [md`$x = 0.${s}${s}\dots$`, md`$1000x = ${n}.${s}${s}\dots$`, md`$999x = ${n}$, so $x = \dfrac{${n}}{999}${gcd(n, 999) > 1 ? ` = ${fracTex(a, d)}` : ''}$`],
        };
      },
    },
    mixed: {
      level: 3, marks: 3, skill: 'Recurring after a non-recurring digit',
      gen(r) {
        const a = r.int(0, 9); const b = r.int(1, 9); if (a === b) return this.gen(r);
        // 0.a b b b ... = (10a + b - a) / 90
        const num = 10 * a + b - a;
        return {
          q: md`Write $0.${a}${rec(String(b))}$ as a fraction in its simplest form.`,
          a: { kind: 'fraction', num, den: 90, simplest: true },
          show: md`$${fracTex(num, 90)}$`,
          wrong: [`${b}/9`, ...(a ? [`${10 * a + b}/90`] : [])],
          hints: [md`$10x = ${a}.${b}${b}${b}\dots$ and $100x = ${a}${b}.${b}${b}\dots$ have the same repeating tail.`, md`$100x - 10x = 90x$.`],
          steps: [md`$x = 0.${a}${b}${b}${b}\dots$`, md`$10x = ${a}.${b}${b}${b}\dots$, $100x = ${10 * a + b}.${b}${b}\dots$`, md`$90x = ${10 * a + b} - ${a} = ${num}$`, md`$x = \dfrac{${num}}{90}${gcd(num, 90) > 1 ? ` = ${fracTex(num, 90)}` : ''}$`],
        };
      },
    },
    mixed2: {
      level: 3, marks: 3, skill: 'Prove a recurring decimal equals a fraction (grade 8)',
      gen(r) {
        const a = r.int(1, 9); const bc = r.int(10, 98); if (bc % 11 === 0 || bc % 10 === a) return this.gen(r);
        const s = String(bc);
        // 0.a(bc)(bc)... : 1000x - 10x = 990x = (100a + bc) - a
        const num = 100 * a + bc - a;
        return {
          q: md`Write $0.${a}${rec(s)}$ as a fraction in its simplest form.`,
          a: { kind: 'fraction', num, den: 990, simplest: true },
          show: md`$${fracTex(num, 990)}$`,
          wrong: [`${100 * a + bc}/990`, `${bc}/99`],
          hints: [md`$10x = ${a}.${s}${s}\dots$ and $1000x = ${a}${s}.${s}${s}\dots$`, md`$1000x - 10x = 990x$.`],
          steps: [md`$10x = ${a}.${s}${s}\dots$ **[M1]**`, md`$1000x = ${100 * a + bc}.${s}${s}\dots$`, md`$990x = ${100 * a + bc} - ${a} = ${num}$ **[M1]**`, md`$x = \dfrac{${num}}{990}${gcd(num, 990) > 1 ? ` = ${fracTex(num, 990)}` : ''}$ **[A1]**`],
        };
      },
    },
    terminating: {
      level: 1, marks: 1, skill: 'Which fractions terminate',
      gen(r) {
        const goodDen = r.pick([8, 16, 20, 25, 40, 50, 80, 125]); const badDens = r.shuffle([3, 6, 7, 12, 15, 30, 45]).slice(0, 3);
        const pickNum = (d) => { for (;;) { const n = r.int(1, d - 1); if (gcd(n, d) === 1) return n; } };
        const fr = [[pickNum(goodDen), goodDen], ...badDens.map((d) => [pickNum(d), d])];
        const order = r.shuffle([0, 1, 2, 3]);
        return {
          q: 'Which of these fractions gives a terminating decimal?',
          a: { kind: 'choice', options: order.map((i) => `$${fracTex(...fr[i])}$`), correct: order.indexOf(0) },
          show: md`$${fracTex(...fr[0])}$`,
          hints: ['Look at the prime factors of each denominator (simplest form).'],
          steps: [md`$${goodDen}$ has only 2s and 5s as prime factors, so $${fracTex(...fr[0])}$ terminates. The others have a factor of 3 or 7.`],
        };
      },
    },
  },
};
