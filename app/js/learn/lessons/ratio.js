import { gcd, fracTex, fracPlain, simplify, lead } from '../engine.js';

const md = String.raw;
const NAMES = [['Amir', 'Beth'], ['Cara', 'Dev'], ['Ella', 'Finn'], ['Gina', 'Hari'], ['Isla', 'Jack']];

export default {
  id: 'ratio',
  title: 'Ratio problems',
  subtitle: 'Sharing, differences, combining ratios, ratio that changes',
  topics: ['R5', 'R4', 'R6', 'N11', 'R8'],
  band: '5',
  calc: 'non-calc',
  minutes: 30,
  why: 'Ratio questions appear on all three papers. The harder ones (ratio changes after a transfer, combining ratios) are grade 6–7 problem-solving marks.',
  steps: [
    {
      kind: 'learn', title: 'Parts',
      md: md`A ratio $3 : 5$ means **8 parts** altogether: 3 parts and 5 parts.

To share £96 in the ratio $3 : 5$: one part $= 96 \div 8 = 12$, so the shares are $3 \times 12 = £36$ and $5 \times 12 = £60$.

Fractions: the first person gets $\frac{3}{8}$ of the total.`,
      key: 'Find the value of ONE part first. Every ratio question unlocks from there.',
    },
    { kind: 'try', template: 'share' },
    {
      kind: 'example', title: 'Using a difference',
      q: md`Sweets are shared between Ali and Bo in the ratio $3 : 7$. Bo gets 24 more sweets than Ali. How many sweets are there altogether?`,
      steps: [
        { md: md`The difference is $7 - 3 = 4$ parts.` },
        { md: md`4 parts $= 24$, so 1 part $= 6$` },
        { md: md`Total $= 10$ parts $= 60$ sweets` },
      ],
      answer: md`60`,
    },
    { kind: 'try', template: 'difference' },
    {
      kind: 'learn', title: 'Combining ratios',
      md: md`$A : B = 2 : 3$ and $B : C = 4 : 5$. Make the **shared** letter ($B$) the same number in both: the LCM of 3 and 4 is 12.

$A : B = 8 : 12$ and $B : C = 12 : 15$, so $A : B : C = 8 : 12 : 15$.`,
    },
    { kind: 'try', template: 'combine' },
    {
      kind: 'example', title: 'When the ratio changes (grade 7)',
      q: md`Jo and Kim share money in the ratio $5 : 3$. Jo gives Kim £12, and now the ratio is $1 : 1$. How much did Jo have at the start?`,
      steps: [
        { md: md`Start: Jo $= 5k$, Kim $= 3k$` },
        { md: md`After: $5k - 12 = 3k + 12$`, why: 'The new ratio 1:1 means equal amounts.' },
        { md: md`$2k = 24$, $k = 12$` },
        { md: md`Jo had $5 \times 12 = £60$` },
      ],
      answer: md`£60`,
    },
    { kind: 'practice', title: 'Practice', templates: ['share', 'share3', 'difference', 'fraction', 'combine', 'simplify'] },
    { kind: 'exam', template: 'changing' },
    {
      kind: 'recap',
      md: md`- Total parts → one part → each share.
- A difference in amounts is a difference in parts.
- Combine ratios by matching the shared term (LCM).
- Changing ratios: write each person as a multiple of $k$, form an equation from the new ratio.`,
      mistakes: ['Dividing by one side of the ratio instead of the total parts', 'Giving the ratio the wrong way round', 'Not making the shared term equal when combining'],
    },
  ],
  templates: {
    share: {
      level: 1, marks: 2, skill: 'Sharing in a ratio',
      gen(r) {
        const [a, b] = r.distinct(2, 1, 9); if (gcd(a, b) !== 1) return this.gen(r);
        const part = r.int(3, 25); const total = (a + b) * part; const [p, q] = r.pick(NAMES);
        return {
          q: md`${p} and ${q} share £${total} in the ratio $${a} : ${b}$. How much does ${q} get?`,
          a: { kind: 'number', value: b * part },
          show: md`£${b * part}`,
          wrong: [String(a * part)],
          hints: [md`Total parts: $${a} + ${b} = ${a + b}$. One part $= ${total} \div ${a + b}$.`],
          steps: [md`$${a + b}$ parts`, md`1 part $= ${total} \div ${a + b} = ${part}$`, md`${q}: $${b} \times ${part} = £${b * part}$`],
        };
      },
    },
    share3: {
      level: 2, marks: 2, skill: 'Sharing in a three-part ratio',
      gen(r) {
        const [a, b, c] = r.distinct(3, 1, 8); const part = r.int(2, 15); const total = (a + b + c) * part;
        return {
          q: md`${total} g of a mixture is made from sand, cement and gravel in the ratio $${a} : ${b} : ${c}$. How much gravel is in the mixture?`,
          a: { kind: 'number', value: c * part },
          show: md`${c * part} g`,
          hints: [md`Total parts: $${a + b + c}$.`],
          steps: [md`1 part $= ${total} \div ${a + b + c} = ${part}$ g`, md`Gravel: $${c} \times ${part} = ${c * part}$ g`],
        };
      },
    },
    difference: {
      level: 2, marks: 3, skill: 'Ratio problems using a difference',
      gen(r) {
        const [a, b] = r.distinct(2, 1, 9).sort((x, y) => x - y); if (gcd(a, b) !== 1) return this.gen(r);
        const part = r.int(2, 12); const [p, q] = r.pick(NAMES);
        return {
          q: md`Marbles are shared between ${p} and ${q} in the ratio $${a} : ${b}$. ${q} gets ${(b - a) * part} more marbles than ${p}.

How many marbles are there altogether?`,
          a: { kind: 'number', value: (a + b) * part },
          show: md`${(a + b) * part}`,
          hints: [md`The difference is $${b} - ${a} = ${b - a}$ parts.`],
          steps: [md`$${b - a}$ parts $= ${(b - a) * part}$`, md`1 part $= ${part}$`, md`Total $= ${a + b}$ parts $= ${(a + b) * part}$`],
        };
      },
    },
    fraction: {
      level: 1, marks: 1, skill: 'Writing a ratio as a fraction',
      gen(r) {
        const [a, b] = r.distinct(2, 1, 11); if (gcd(a, b) !== 1) return this.gen(r);
        return {
          q: md`Boys and girls in a club are in the ratio $${a} : ${b}$. What fraction of the club are girls?`,
          a: { kind: 'fraction', num: b, den: a + b, simplest: true },
          show: md`$${fracTex(b, a + b)}$`,
          wrong: [fracPlain(b, a)],
          hints: [md`Total parts: $${a + b}$. Girls are $${b}$ of them.`],
          steps: [md`$${a} + ${b} = ${a + b}$ parts`, md`Girls: $${fracTex(b, a + b)}$`],
        };
      },
    },
    combine: {
      level: 2, marks: 2, skill: 'Combining two ratios',
      gen(r) {
        const a = r.int(1, 7); const b1 = r.int(2, 7); const b2 = r.int(2, 7); const c = r.int(1, 9);
        if (b1 === b2 || gcd(a, b1) !== 1 || gcd(b2, c) !== 1) return this.gen(r);
        const L = (b1 * b2) / gcd(b1, b2);
        const A = a * (L / b1); const B = L; const C = c * (L / b2);
        const g = gcd(gcd(A, B), C);
        return {
          q: md`$A : B = ${a} : ${b1}$ and $B : C = ${b2} : ${c}$. Find $A : B : C$ in its simplest form.`,
          a: { kind: 'ratio', parts: [A / g, B / g, C / g], simplest: true },
          show: md`$${A / g} : ${B / g} : ${C / g}$`,
          hints: [md`Make $B$ the same in both: the LCM of $${b1}$ and $${b2}$ is $${L}$.`],
          steps: [md`$A : B = ${A} : ${L}$`, md`$B : C = ${L} : ${C}$`, md`$A : B : C = ${A / g} : ${B / g} : ${C / g}$`],
        };
      },
    },
    simplify: {
      level: 1, marks: 1, skill: 'Simplifying a ratio with units',
      gen(r) {
        const cm = r.int(2, 18) * 5; const m = r.pick([1, 2, 3, 4]);
        const [x, y] = simplify(cm, m * 100);
        return {
          q: md`Write the ratio ${cm} cm : ${m} m in its simplest form.`,
          a: { kind: 'ratio', parts: [x, y], simplest: true },
          show: md`$${x} : ${y}$`,
          wrong: [`${cm}:${m}`],
          hints: [md`Same units first: ${m} m $= ${m * 100}$ cm.`],
          steps: [md`$${cm} : ${m * 100}$`, md`Divide by $${gcd(cm, m * 100)}$: $${x} : ${y}$`],
        };
      },
    },
    changing: {
      level: 3, marks: 4, skill: 'Ratio that changes after a transfer',
      gen(r) {
        for (;;) {
          const p = r.int(3, 9); const q = r.int(1, p - 1); if (gcd(p, q) !== 1) continue;
          const k = r.int(3, 15); const t = r.int(1, p * k - 1);
          const A = p * k - t; const B = q * k + t; const g = gcd(A, B);
          const rr = A / g; const s = B / g;
          if (rr > 12 || s > 12 || (rr === p && s === q)) continue;
          const [n1, n2] = r.pick(NAMES);
          return {
            q: md`${n1} and ${n2} share some money in the ratio $${p} : ${q}$.

${n1} gives ${n2} £${t}. The ratio is now $${rr} : ${s}$.

How much money did ${n1} have at the start?`,
            a: { kind: 'number', value: p * k },
            show: md`£${p * k}`,
            hints: [md`Start: ${n1} $= ${p}k$, ${n2} $= ${lead(q, 'k')}$. After: $(${p}k - ${t}) : (${lead(q, 'k')} + ${t}) = ${rr} : ${s}$.`, md`Cross-multiply: $${s === 1 ? '' : s}(${p}k - ${t}) = ${rr === 1 ? '' : rr}(${lead(q, 'k')} + ${t})$.`],
            steps: [md`${n1} $= ${p}k$, ${n2} $= ${lead(q, 'k')}$ **[M1]**`, md`$${s === 1 ? '' : s}(${p}k - ${t}) = ${rr === 1 ? '' : rr}(${lead(q, 'k')} + ${t})$ **[M1]**`, md`$${lead(s * p - rr * q, 'k')} = ${t * (rr + s)}$, so $k = ${k}$ **[M1]**`, md`${n1} had $${p} \times ${k} = £${p * k}$ **[A1]**`],
            verify: () => (s * (p * k - t) === rr * (q * k + t) && (s * p - rr * q) * k === t * (rr + s)) || 'inconsistent',
          };
        }
      },
    },
  },
};
