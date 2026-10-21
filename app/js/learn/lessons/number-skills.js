import { gcd, lcm, fracTex, fracPlain, simplify } from '../engine.js';

const md = String.raw;

function factorise(n) {
  const out = []; let k = n;
  for (let p = 2; p * p <= k; p++) { let e = 0; while (k % p === 0) { k /= p; e++; } if (e) out.push([p, e]); }
  if (k > 1) out.push([k, 1]);
  return out;
}
const pfTex = (f) => f.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : String(p))).join(' \\times ');
const pfPlain = (f) => f.map(([p, e]) => (e > 1 ? `${p}^${e}` : String(p))).join(' × ');
const mixedTex = (n, d) => { [n, d] = simplify(n, d); const w = Math.floor(n / d); const r = n % d; return w && r ? `${w}\\tfrac{${r}}{${d}}` : fracTex(n, d); };

export default {
  id: 'number-skills',
  title: 'Primes, HCF, LCM, counting and fractions',
  subtitle: 'Prime factors, HCF and LCM problems, the product rule, mixed numbers',
  topics: ['N4', 'N5', 'N2'],
  band: '5',
  calc: 'non-calc',
  minutes: 30,
  why: 'These are Paper 1 staples: prime factors and HCF/LCM (2–4 marks), mixed-number arithmetic (2–3 marks) and counting (2 marks). Quick to learn, easy to lose by rushing.',
  steps: [
    {
      kind: 'learn', title: 'Prime factors',
      md: md`Break the number down with a factor tree until every branch ends in a prime. Write the answer in **index form**, smallest prime first:

$$360 = 2 \times 2 \times 2 \times 3 \times 3 \times 5 = 2^3 \times 3^2 \times 5$$

In this app type it as \`2^3 × 3^2 × 5\`.`,
      key: '1 is not prime. 2 is the only even prime.',
    },
    { kind: 'try', template: 'primeFactors' },
    {
      kind: 'learn', title: 'HCF and LCM',
      md: md`Write both numbers as products of primes.

- **HCF** (highest common factor): primes they share, with the **lower** power.
- **LCM** (lowest common multiple): every prime that appears, with the **higher** power.

$84 = 2^2 \times 3 \times 7$ and $90 = 2 \times 3^2 \times 5$: HCF $= 2 \times 3 = 6$; LCM $= 2^2 \times 3^2 \times 5 \times 7 = 1260$.

**Word problems:** "when will they next happen together?" is an LCM; "the largest equal groups" is an HCF.`,
    },
    { kind: 'try', template: 'hcfLcm' },
    { kind: 'try', template: 'lcmProblem' },
    {
      kind: 'learn', title: 'Counting: the product rule',
      md: md`If there are $a$ ways to do one thing and $b$ ways to do another, there are $a \times b$ ways to do both.

A menu with 4 starters, 6 mains and 3 desserts gives $4 \times 6 \times 3 = 72$ different meals.`,
    },
    { kind: 'try', template: 'productRule' },
    {
      kind: 'learn', title: 'Mixed numbers',
      md: md`Change mixed numbers to **improper fractions** first.

- $\times$: multiply tops, multiply bottoms.
- $\div$: flip the second fraction and multiply.
- $+$ / $-$: common denominator.

$2\tfrac13 \times 1\tfrac12 = \tfrac73 \times \tfrac32 = \tfrac{21}{6} = 3\tfrac12$`,
    },
    { kind: 'try', template: 'mixed' },
    { kind: 'practice', title: 'Practice', templates: ['primeFactors', 'hcfLcm', 'hcfFromFactors', 'lcmProblem', 'productRule', 'mixed'] },
    { kind: 'exam', template: 'squareNumber' },
    {
      kind: 'recap',
      md: md`- Prime factors in index form, smallest prime first.
- HCF: shared primes, lower powers. LCM: all primes, higher powers.
- Together again → LCM. Biggest equal groups → HCF.
- Product rule: multiply the number of choices.
- Mixed numbers: make them improper first.`,
      mistakes: ['Including 1 as a prime factor', 'Mixing up HCF and LCM', 'Multiplying mixed numbers whole part and fraction part separately', 'Not flipping the second fraction when dividing'],
    },
  ],
  templates: {
    primeFactors: {
      level: 1, marks: 2, skill: 'Writing a number as a product of primes',
      gen(r) {
        const n = 2 ** r.int(1, 4) * 3 ** r.int(0, 2) * 5 ** r.int(0, 1) * 7 ** r.int(0, 1);
        if (n < 24 || n > 2000 || factorise(n).length < 2) return this.gen(r);
        const f = factorise(n);
        return {
          q: md`Write ${n} as a product of its prime factors. Give your answer in index form.`,
          a: { kind: 'primes', n },
          typed: pfPlain(f),
          show: md`$${pfTex(f)}$`,
          wrong: [String(n), f.map(([p, e]) => `${p}*${e}`).join(' × ')],
          placeholder: 'e.g. 2^3 × 3 × 5',
          hints: [md`Start dividing by 2 as many times as you can, then 3, then 5…`],
          steps: [md`${f.map(([p, e]) => `$${p}$ goes in ${e === 1 ? 'once' : `${e} times`}`).join(', ')}`, md`$${n} = ${pfTex(f)}$`],
        };
      },
    },
    hcfLcm: {
      level: 2, marks: 2, skill: 'HCF and LCM of two numbers',
      gen(r) {
        const g = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 12]); const [a1, b1] = r.distinct(2, 2, 9); if (gcd(a1, b1) !== 1) return this.gen(r);
        const a = g * a1; const b = g * b1; const askH = r.bool();
        const ans = askH ? g : lcm(a, b);
        return {
          q: md`Find the ${askH ? 'highest common factor (HCF)' : 'lowest common multiple (LCM)'} of ${a} and ${b}.`,
          a: { kind: 'number', value: ans },
          show: md`$${ans}$`,
          wrong: [String(askH ? lcm(a, b) : g), String(a * b)].filter((w) => +w !== ans),
          hints: [md`$${a} = ${pfTex(factorise(a))}$ and $${b} = ${pfTex(factorise(b))}$.`, askH ? 'Take the primes they share, with the lower power.' : 'Take every prime that appears, with the higher power.'],
          steps: [md`$${a} = ${pfTex(factorise(a))}$, $${b} = ${pfTex(factorise(b))}$`, md`${askH ? 'HCF' : 'LCM'} $= ${ans}$`],
        };
      },
    },
    hcfFromFactors: {
      level: 2, marks: 2, skill: 'HCF and LCM from prime factor form',
      gen(r) {
        const e = () => [r.int(1, 4), r.int(0, 3), r.int(0, 2)];
        const [x, y] = [e(), e()]; const P = [2, 3, 5];
        const A = P.reduce((acc, p, i) => acc * p ** x[i], 1); const B = P.reduce((acc, p, i) => acc * p ** y[i], 1);
        if (A === B) return this.gen(r);
        const askH = r.bool();
        const ans = P.reduce((acc, p, i) => acc * p ** (askH ? Math.min(x[i], y[i]) : Math.max(x[i], y[i])), 1);
        const tex = (ex) => P.map((p, i) => [p, ex[i]]).filter(([, k]) => k).map(([p, k]) => (k > 1 ? `${p}^{${k}}` : p)).join(' \\times ');
        return {
          q: md`$A = ${tex(x)}$ and $B = ${tex(y)}$. Work out the ${askH ? 'HCF' : 'LCM'} of $A$ and $B$. Give your answer as an ordinary number.`,
          a: { kind: 'number', value: ans },
          show: md`$${ans}$`,
          wrong: [String(P.reduce((acc, p, i) => acc * p ** (askH ? Math.max(x[i], y[i]) : Math.min(x[i], y[i])), 1))].filter((w) => +w !== ans),
          hints: [askH ? 'For each prime, take the lower power (a prime missing from one of them is a power of 0).' : 'For each prime, take the higher power.'],
          steps: [md`${askH ? 'Lower' : 'Higher'} powers: $${tex(P.map((_, i) => (askH ? Math.min(x[i], y[i]) : Math.max(x[i], y[i]))))  || '1'}$`, md`$= ${ans}$`],
        };
      },
    },
    lcmProblem: {
      level: 2, marks: 3, skill: 'LCM word problems',
      gen(r) {
        const [a, b] = r.distinct(2, 4, 30); if (gcd(a, b) === 1) return this.gen(r); // shared factors make it a real LCM question
        const L = lcm(a, b); if (L === a || L === b || L > 240) return this.gen(r);
        const ctx = r.pick([
          [`Bus A leaves the station every ${a} minutes. Bus B leaves every ${b} minutes. Both buses leave at 9:00. How many minutes until they next leave together?`, 'minutes'],
          [`One light flashes every ${a} seconds and another every ${b} seconds. They flash together now. After how many seconds will they next flash together?`, 'seconds'],
        ]);
        return {
          q: ctx[0],
          a: { kind: 'number', value: L },
          show: md`$${L}$ ${ctx[1]}`,
          wrong: [String(a * b), String(gcd(a, b))].filter((w) => +w !== L),
          hints: ['"Next together" means a common multiple: find the lowest one.', md`Multiples of $${a}$: $${a}, ${2 * a}, ${3 * a}, \dots$`],
          steps: [md`$${a} = ${pfTex(factorise(a))}$, $${b} = ${pfTex(factorise(b))}$`, md`LCM $= ${L}$ ${ctx[1]}`],
        };
      },
    },
    productRule: {
      level: 1, marks: 2, skill: 'Product rule for counting',
      gen(r) {
        const kind = r.pick(['menu', 'code', 'outfit']);
        if (kind === 'menu') {
          const [a, b, c] = [r.int(2, 6), r.int(3, 8), r.int(2, 5)];
          return { q: `A café offers ${a} starters, ${b} main courses and ${c} desserts. How many different three-course meals are possible?`, a: { kind: 'number', value: a * b * c }, show: md`$${a * b * c}$`, wrong: [String(a + b + c)], hints: ['Multiply the number of choices at each stage.'], steps: [md`$${a} \times ${b} \times ${c} = ${a * b * c}$`] };
        }
        if (kind === 'code') {
          const len = r.int(3, 4); const noRepeat = r.bool();
          const ans = noRepeat ? Array.from({ length: len }, (_, i) => 10 - i).reduce((x, y) => x * y, 1) : 10 ** len;
          return { q: `A ${len}-digit code uses the digits 0 to 9.${noRepeat ? ' No digit can be used more than once.' : ' Digits can repeat.'} How many different codes are possible?`, a: { kind: 'number', value: ans }, show: md`$${ans}$`, wrong: [String(noRepeat ? 10 ** len : 10 * len)], hints: [noRepeat ? 'After each digit is used, there is one fewer choice.' : 'There are 10 choices for every digit.'], steps: [md`$${noRepeat ? Array.from({ length: len }, (_, i) => 10 - i).join(' \\times ') : Array(len).fill(10).join(' \\times ')} = ${ans}$`] };
        }
        const [a, b, c] = [r.int(3, 7), r.int(2, 6), r.int(2, 4)];
        return { q: `Mia has ${a} tops, ${b} pairs of trousers and ${c} pairs of shoes. How many different outfits of one top, one pair of trousers and one pair of shoes can she wear?`, a: { kind: 'number', value: a * b * c }, show: md`$${a * b * c}$`, wrong: [String(a + b + c)], hints: ['Multiply the number of choices for each item.'], steps: [md`$${a} \times ${b} \times ${c} = ${a * b * c}$`] };
      },
    },
    mixed: {
      level: 2, marks: 3, skill: 'Calculating with mixed numbers',
      gen(r) {
        const mk = () => { const d = r.pick([2, 3, 4, 5, 6, 8]); const n = r.int(1, d - 1); if (gcd(n, d) !== 1) return null; return [r.int(1, 3), n, d]; };
        const x = mk(); const y = mk(); if (!x || !y) return this.gen(r);
        const op = r.pick(['×', '÷', '+', '−']);
        const [n1, d1] = [x[0] * x[2] + x[1], x[2]]; const [n2, d2] = [y[0] * y[2] + y[1], y[2]];
        const [N, D] = op === '×' ? [n1 * n2, d1 * d2] : op === '÷' ? [n1 * d2, d1 * n2] : op === '+' ? [n1 * d2 + n2 * d1, d1 * d2] : [n1 * d2 - n2 * d1, d1 * d2];
        if (N <= 0) return this.gen(r);
        const [sn, sd] = simplify(N, D);
        const opTex = { '×': '\\times', '÷': '\\div', '+': '+', '−': '-' }[op];
        return {
          q: md`Work out $${x[0]}\tfrac{${x[1]}}{${x[2]}} ${opTex} ${y[0]}\tfrac{${y[1]}}{${y[2]}}$. Give your answer as a mixed number in its simplest form.`,
          a: { kind: 'fraction', num: N, den: D, simplest: true },
          typed: sd === 1 ? String(sn) : `${Math.floor(sn / sd)} ${sn % sd}/${sd}`,
          show: md`$${mixedTex(N, D)}$`,
          wrong: op === '×' ? [`${x[0] * y[0]} ${fracPlain(x[1] * y[1], x[2] * y[2]).replace(/^0$/, '0')}`] : op === '÷' ? [fracPlain(n1 * n2, d1 * d2)] : [],
          hints: [md`Improper fractions: $${x[0]}\tfrac{${x[1]}}{${x[2]}} = \tfrac{${n1}}{${d1}}$ and $${y[0]}\tfrac{${y[1]}}{${y[2]}} = \tfrac{${n2}}{${d2}}$.`, op === '÷' ? 'Flip the second fraction and multiply.' : op === '×' ? 'Multiply the tops and multiply the bottoms.' : 'Use a common denominator.'],
          steps: [md`$\tfrac{${n1}}{${d1}} ${opTex} \tfrac{${n2}}{${d2}}$`, op === '÷' ? md`$= \tfrac{${n1}}{${d1}} \times \tfrac{${d2}}{${n2}} = \tfrac{${N}}{${D}}$` : md`$= \tfrac{${N}}{${D}}$`, md`$= ${mixedTex(N, D)}$`],
        };
      },
    },
    squareNumber: {
      level: 3, marks: 3, skill: 'Using prime factors: making a square or cube (grade 7)',
      gen(r) {
        const cube = r.int(0, 3) === 0;
        const ex = [r.int(1, 5), r.int(0, 3), r.int(0, 2), r.int(0, 1)]; const P = [2, 3, 5, 7];
        const n = P.reduce((a, p, i) => a * p ** ex[i], 1); if (n < 40 || n > 5000) return this.gen(r);
        const m = cube ? 3 : 2;
        const k = P.reduce((a, p, i) => a * p ** ((m - (ex[i] % m)) % m), 1); if (k === 1) return this.gen(r);
        const f = factorise(n);
        return {
          q: md`(a) Write ${n} as a product of its prime factors.

(b) Find the smallest whole number $k$ such that ${n}$k$ is a ${cube ? 'cube' : 'square'} number.`,
          a: { kind: 'number', value: k },
          show: md`$${n} = ${pfTex(f)}$, so $k = ${k}$`,
          wrong: [String(n), String(k * k)].filter((w) => +w !== k),
          hints: [md`$${n} = ${pfTex(f)}$.`, cube ? 'In a cube number every prime has a power that is a multiple of 3.' : 'In a square number every prime has an even power.'],
          steps: [md`$${n} = ${pfTex(f)}$ **[B1]**`, md`Each power must be ${cube ? 'a multiple of 3' : 'even'}: multiply by $${pfTex(factorise(k))}$ **[M1]**`, md`$k = ${k}$ **[A1]**`],
          verify: () => { const v = n * k; const root = Math.round(v ** (1 / m)); return root ** m === v || 'not a perfect power'; },
        };
      },
    },
  },
};
