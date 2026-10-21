import { fmt } from '../engine.js';

const md = String.raw;
const KINDS = {
  x: { tex: 'x', say: '$x$', f: (x) => x },
  x2: { tex: 'x^2', say: 'the square of $x$', f: (x) => x * x },
  x3: { tex: 'x^3', say: 'the cube of $x$', f: (x) => x ** 3 },
  sqrt: { tex: '\\sqrt{x}', say: 'the square root of $x$', f: (x) => Math.sqrt(x) },
};

export default {
  id: 'proportion',
  title: 'Direct and inverse proportion',
  subtitle: 'y = kx, y = k/x, squares and roots, ratio and best buys',
  topics: ['R10', 'R13', 'R7'],
  band: '6',
  calc: 'both',
  minutes: 30,
  why: 'Proportion equations (find k, then use it) are a reliable 3–4 mark grade 6–7 question, and the method never changes.',
  steps: [
    {
      kind: 'learn', title: 'Direct and inverse proportion',
      md: md`- **Directly proportional**: $y \propto x$ means $y = kx$. Double $x$, double $y$.
- **Inversely proportional**: $y \propto \frac{1}{x}$ means $y = \frac{k}{x}$. Double $x$, halve $y$.

It can also be to a power or root: $y \propto x^2 \Rightarrow y = kx^2$, $\;y \propto \frac{1}{\sqrt{x}} \Rightarrow y = \frac{k}{\sqrt{x}}$.`,
      key: '1) Write the equation with k. 2) Substitute the pair of values you are given to find k. 3) Write the formula with that k. 4) Use it.',
    },
    {
      kind: 'example', title: 'Direct proportion to a square',
      q: md`$y$ is directly proportional to the square of $x$. When $x = 3$, $y = 45$. Find $y$ when $x = 4$.`,
      steps: [
        { md: md`$y = kx^2$` },
        { md: md`$45 = k \times 3^2 = 9k$, so $k = 5$` },
        { md: md`$y = 5x^2$` },
        { md: md`$x = 4$: $y = 5 \times 16 = 80$` },
      ],
      answer: md`$y = 80$`,
    },
    { kind: 'try', template: 'direct' },
    {
      kind: 'example', title: 'Inverse proportion',
      q: md`$P$ is inversely proportional to $V$. When $V = 8$, $P = 15$. Find $P$ when $V = 20$.`,
      steps: [
        { md: md`$P = \dfrac{k}{V}$` },
        { md: md`$15 = \dfrac{k}{8}$, so $k = 120$` },
        { md: md`$P = \dfrac{120}{20} = 6$` },
      ],
      answer: md`$P = 6$`,
    },
    { kind: 'try', template: 'inverse' },
    {
      kind: 'learn', title: 'Proportion without letters: recipes and best buys',
      md: md`**Unitary method**: find the value of **one**, then scale.

A recipe for 6 people uses 450 g of flour. For 10 people: $450 \div 6 = 75$ g each, $75 \times 10 = 750$ g.

**Best buy**: work out the cost per gram (or grams per £) for each and compare.`,
    },
    { kind: 'practice', title: 'Practice', templates: ['direct', 'inverse', 'formula', 'recipe', 'bestBuy'] },
    { kind: 'exam', template: 'formula' },
    {
      kind: 'recap',
      md: md`- $y \propto x^n \Rightarrow y = kx^n$; $\;y \propto \frac{1}{x^n} \Rightarrow y = \frac{k}{x^n}$.
- Find $k$ from the pair of values, write the formula, then use it.
- Unitary method: find one, then multiply.`,
      mistakes: ['Forgetting to square (or root) x when finding k', 'Using y = kx for inverse proportion', 'Comparing best buys without a common unit'],
    },
  ],
  templates: {
    direct: {
      level: 1, marks: 3, skill: 'Direct proportion with a constant k',
      gen(r) {
        const kind = r.pick(['x', 'x2', 'x2', 'x3', 'sqrt']); const K = KINDS[kind];
        const k = r.int(2, 9); const x1 = kind === 'sqrt' ? r.pick([4, 9, 16, 25]) : r.int(2, 5);
        let x2 = kind === 'sqrt' ? r.pick([36, 49, 64, 81, 100]) : r.int(2, 8);
        if (x2 === x1) x2 = x1 + 1;
        const y1 = k * K.f(x1); const y2 = k * K.f(x2);
        return {
          q: md`$y$ is directly proportional to ${K.say}. When $x = ${x1}$, $y = ${y1}$.

Find $y$ when $x = ${x2}$.`,
          a: { kind: 'number', value: y2 },
          show: md`$y = ${y2}$`,
          hints: [md`$y = k${K.tex}$. Substitute $x = ${x1}$, $y = ${y1}$ to find $k$.`, md`$k = ${k}$, so $y = ${k}${K.tex}$.`],
          steps: [md`$y = k${K.tex}$`, md`$${y1} = k \times ${fmt(K.f(x1))}$, so $k = ${k}$`, md`$y = ${k} \times ${fmt(K.f(x2))} = ${y2}$`],
        };
      },
    },
    inverse: {
      level: 2, marks: 3, skill: 'Inverse proportion',
      gen(r) {
        const sq = r.bool(0.4);
        const x1 = r.int(2, 6); const k = x1 * (sq ? x1 : 1) * r.int(2, 12);
        const xs = [2, 3, 4, 5, 6, 8, 10, 12].filter((v) => v !== x1 && Number.isInteger((k / (sq ? v * v : v)) * 100));
        const x2 = r.pick(xs.length ? xs : [x1 * 2]);
        const y1 = k / (sq ? x1 * x1 : x1); const y2 = k / (sq ? x2 * x2 : x2);
        return {
          q: md`$y$ is inversely proportional to ${sq ? 'the square of $x$' : '$x$'}. When $x = ${x1}$, $y = ${fmt(y1)}$.

Find $y$ when $x = ${x2}$.`,
          a: { kind: 'number', value: y2, tol: 1e-6 },
          show: md`$y = ${fmt(y2)}$`,
          hints: [md`$y = \dfrac{k}{${sq ? 'x^2' : 'x'}}$, so $k = ${fmt(y1)} \times ${sq ? `${x1}^2` : x1}$.`],
          steps: [md`$y = \dfrac{k}{${sq ? 'x^2' : 'x'}}$`, md`$k = ${fmt(y1)} \times ${sq ? x1 * x1 : x1} = ${k}$`, md`$y = \dfrac{${k}}{${sq ? x2 * x2 : x2}} = ${fmt(y2)}$`],
        };
      },
    },
    formula: {
      level: 2, marks: 3, skill: 'Writing a proportion formula',
      gen(r) {
        const inv = r.bool(); const sq = r.bool();
        const x1 = r.int(2, 5); const k = r.int(2, 12);
        const y1 = inv ? k / (sq ? x1 * x1 : x1) : k * (sq ? x1 * x1 : x1);
        if (!Number.isInteger(y1 * 1000)) return this.gen(r);
        const t = inv ? (sq ? `${k}/x^2` : `${k}/x`) : sq ? `${k}x^2` : `${k}x`;
        return {
          q: md`$y$ is ${inv ? 'inversely' : 'directly'} proportional to ${sq ? '$x^2$' : '$x$'}. When $x = ${x1}$, $y = ${fmt(y1)}$.

Write a formula for $y$ in terms of $x$.`,
          a: { kind: 'equation', lhsVar: 'y', expr: t, vars: ['x'] },
          typed: `y = ${t}`,
          show: md`$y = ${inv ? `\\dfrac{${k}}{${sq ? 'x^2' : 'x'}}` : `${k}${sq ? 'x^2' : 'x'}`}$`,
          placeholder: 'y = …',
          hints: [md`Start from $y = ${inv ? `\\dfrac{k}{${sq ? 'x^2' : 'x'}}` : `k${sq ? 'x^2' : 'x'}`}$ and substitute the values to find $k$.`],
          steps: [md`$y = ${inv ? `\\dfrac{k}{${sq ? 'x^2' : 'x'}}` : `k${sq ? 'x^2' : 'x'}`}$ **[M1]**`, md`$${fmt(y1)} = ${inv ? `\\dfrac{k}{${sq ? x1 * x1 : x1}}` : `k \\times ${sq ? x1 * x1 : x1}`}$, so $k = ${k}$ **[M1]**`, md`$y = ${inv ? `\\dfrac{${k}}{${sq ? 'x^2' : 'x'}}` : `${k}${sq ? 'x^2' : 'x'}`}$ **[A1]**`],
        };
      },
    },
    recipe: {
      level: 1, marks: 2, skill: 'Scaling a recipe (unitary method)',
      gen(r) {
        const people = r.pick([4, 6, 8]); const per = r.pick([25, 30, 40, 45, 60, 75]); const want = r.pick([3, 5, 7, 9, 10, 14, 15]);
        if (want === people) return this.gen(r);
        const ing = r.pick(['flour', 'sugar', 'butter', 'rice', 'pasta']);
        return {
          q: md`A recipe for ${people} people uses ${per * people} g of ${ing}.

How much ${ing} is needed for ${want} people?`,
          a: { kind: 'number', value: per * want },
          show: md`${per * want} g`,
          hints: [md`For one person: $${per * people} \div ${people} = ${per}$ g.`],
          steps: [md`One person: $${per * people} \div ${people} = ${per}$ g`, md`${want} people: $${per} \times ${want} = ${per * want}$ g`],
        };
      },
    },
    bestBuy: {
      level: 2, marks: 3, skill: 'Best buy comparison',
      gen(r) {
        const g1 = r.pick([250, 300, 400, 500]); const g2 = r.pick([600, 750, 800, 1000]);
        const p1 = r.int(90, 250) / 100; const unit1 = p1 / g1;
        const better2 = r.bool();
        const p2 = Math.round(g2 * unit1 * (better2 ? r.pick([0.8, 0.85, 0.9]) : r.pick([1.1, 1.15, 1.2])) * 100) / 100;
        const unit2 = p2 / g2;
        if (Math.abs(unit1 - unit2) < 1e-4) return this.gen(r);
        const item = r.pick(['cereal', 'coffee', 'washing powder', 'rice']);
        return {
          q: md`A ${g1} g box of ${item} costs £${p1.toFixed(2)}. A ${g2} g box costs £${p2.toFixed(2)}.

Which box is the better value?`,
          a: { kind: 'choice', options: [`The ${g1} g box`, `The ${g2} g box`], correct: unit2 < unit1 ? 1 : 0 },
          show: md`The ${unit2 < unit1 ? g2 : g1} g box`,
          hints: [md`Work out the cost per 100 g (or per gram) for each box.`],
          steps: [md`${g1} g: $${p1.toFixed(2)} \div ${g1 / 100} = £${(unit1 * 100).toFixed(3)}$ per 100 g`, md`${g2} g: $${p2.toFixed(2)} \div ${g2 / 100} = £${(unit2 * 100).toFixed(3)}$ per 100 g`, md`The ${unit2 < unit1 ? g2 : g1} g box is cheaper per 100 g.`],
        };
      },
    },
  },
};
