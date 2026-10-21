import { poly, lin, br, dp, fracTex, gcd } from '../engine.js';

const md = String.raw;

// Roots chosen first, so every equation factorises exactly as intended.
function monic(r, lo, hi, cSign) {
  for (;;) {
    const p = r.nz(lo, hi);
    const q = r.nz(lo, hi);
    if (p === q || p === -q) continue;
    const c = p * q;
    if (cSign && Math.sign(c) !== cSign) continue;
    if (p + q === 0) continue;
    return { p, q, b: p + q, c }; // (x + p)(x + q) = x^2 + bx + c ; roots -p, -q
  }
}

export default {
  id: 'quadratics',
  title: 'Solving quadratic equations',
  topics: ['A18', 'A4'],
  band: '6',
  calc: 'both',
  minutes: 45,
  why: 'Quadratics are on every Higher paper: a 2–3 mark "solve" question, plus they hide inside area, simultaneous-equation and probability problems. Being reliable here is worth about 8–12 marks across the three papers.',
  steps: [
    {
      kind: 'learn', title: 'What you are solving',
      md: md`A **quadratic equation** has an $x^2$ term and no higher power. Get everything on one side so it reads

$$ax^2 + bx + c = 0$$

It usually has **two** solutions. There are three ways to find them:

1. **Factorise**: fastest, when the numbers work out.
2. **The quadratic formula**: always works. Use it when the question says "give your answer to 2 decimal places" or "3 significant figures".
3. **Completing the square**: exact answers and the turning point (its own lesson).`,
      key: md`If two things multiply to make $0$, one of them **must** be $0$. That is why we factorise: $(x - 5)(x + 3) = 0$ means $x - 5 = 0$ or $x + 3 = 0$.`,
    },
    {
      kind: 'learn', title: 'Factorising x² + bx + c',
      md: md`Find two numbers that **multiply to $c$** and **add to $b$**.

| If $c$ is… | the two numbers are… |
|---|---|
| positive | the **same** sign as $b$ (both + or both −) |
| negative | **different** signs; the bigger one has the sign of $b$ |

List the factor pairs of $c$ in order and check each one. It is quicker than guessing.`,
    },
    {
      kind: 'example', title: 'Worked example 1',
      q: md`Solve $x^2 + 7x + 12 = 0$`,
      steps: [
        { md: md`$b = 7$ and $c = 12$. Both positive, so both numbers are positive.`, why: 'c positive means same signs; b positive means both +.' },
        { md: md`Factor pairs of 12: $1 \times 12$, $2 \times 6$, $3 \times 4$. Only $3 + 4 = 7$.`, why: 'They must multiply to c AND add to b.' },
        { md: md`$(x + 3)(x + 4) = 0$`, why: 'Check by expanding: x² + 4x + 3x + 12 = x² + 7x + 12 ✓' },
        { md: md`$x + 3 = 0$ or $x + 4 = 0$`, why: 'One of the brackets must be zero.' },
        { md: md`$x = -3$ or $x = -4$`, why: 'Notice the signs flip: +3 in the bracket gives x = −3.' },
      ],
      answer: md`$x = -3$ or $x = -4$`,
    },
    { kind: 'try', template: 'monicPos' },
    {
      kind: 'example', title: 'Worked example 2: a negative c',
      q: md`Solve $x^2 - 2x - 15 = 0$`,
      steps: [
        { md: md`$c = -15$ is negative, so the numbers have **different signs**. $b = -2$, so the bigger one is negative.` },
        { md: md`Pairs of 15: $1, 15$ and $3, 5$. With signs: $-5 + 3 = -2$ ✓` },
        { md: md`$(x - 5)(x + 3) = 0$` },
        { md: md`$x = 5$ or $x = -3$`, why: 'x − 5 = 0 gives x = +5. This sign flip is the most common lost mark.' },
      ],
      answer: md`$x = 5$ or $x = -3$`,
    },
    { kind: 'try', template: 'monicNeg' },
    {
      kind: 'learn', title: 'When there is a number in front of x²',
      md: md`For $ax^2 + bx + c$ with $a \ne 1$, **split the middle term**:

1. Work out $a \times c$.
2. Find two numbers that multiply to $ac$ and add to $b$.
3. Rewrite $bx$ using those two numbers.
4. Factorise in pairs. The brackets must match.`,
    },
    {
      kind: 'example', title: 'Worked example 3',
      q: md`Solve $2x^2 + 5x - 3 = 0$`,
      steps: [
        { md: md`$a \times c = 2 \times (-3) = -6$. Two numbers that multiply to $-6$ and add to $5$: $6$ and $-1$.` },
        { md: md`$2x^2 + 6x - x - 3 = 0$`, why: 'Split +5x into +6x − x.' },
        { md: md`$2x(x + 3) - 1(x + 3) = 0$`, why: 'Take a common factor from each pair. Both pairs leave (x + 3), which confirms it is right.' },
        { md: md`$(2x - 1)(x + 3) = 0$` },
        { md: md`$2x - 1 = 0 \Rightarrow x = \frac{1}{2}$, or $x = -3$` },
      ],
      answer: md`$x = \frac{1}{2}$ or $x = -3$`,
    },
    { kind: 'try', template: 'nonMonic' },
    {
      kind: 'learn', title: 'The quadratic formula',
      md: md`For $ax^2 + bx + c = 0$:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

**You must learn this formula**; AQA does not give it to you.

- Write down $a$, $b$ and $c$ first, **with their signs**.
- Work out $b^2 - 4ac$ on its own first. Put negative numbers in brackets: $(-3)^2 = 9$.
- Only round at the very end.`,
      key: md`If $b$ is negative, $-b$ is positive. With $b = -3$, the formula starts $\frac{3 \pm \dots}{2a}$.`,
    },
    {
      kind: 'example', title: 'Worked example 4: formula',
      q: md`Solve $2x^2 - 3x - 4 = 0$. Give your answers to 2 decimal places.`,
      steps: [
        { md: md`$a = 2$, $b = -3$, $c = -4$` },
        { md: md`$b^2 - 4ac = (-3)^2 - 4 \times 2 \times (-4) = 9 + 32 = 41$`, why: 'Minus times minus: −4 × 2 × −4 = +32.' },
        { md: md`$x = \dfrac{-(-3) \pm \sqrt{41}}{2 \times 2} = \dfrac{3 \pm \sqrt{41}}{4}$` },
        { md: md`$x = \dfrac{3 + 6.403...}{4} = 2.350...$ and $x = \dfrac{3 - 6.403...}{4} = -0.850...$` },
        { md: md`$x = 2.35$ or $x = -0.85$`, why: 'Round only now, to the accuracy asked for.' },
      ],
      answer: md`$x = 2.35$ or $x = -0.85$`,
    },
    { kind: 'try', template: 'formula' },
    {
      kind: 'learn', title: 'Rearrange first',
      md: md`Exam questions often hide the quadratic. Always get **$= 0$ on one side** before factorising:

- $x^2 = 5x + 14 \;\Rightarrow\; x^2 - 5x - 14 = 0$
- $x(x + 2) = 24 \;\Rightarrow\; x^2 + 2x - 24 = 0$

Never divide both sides by $x$: you lose the solution $x = 0$.`,
    },
    { kind: 'practice', title: 'Practice: mixed', templates: ['monicPos', 'monicNeg', 'monicNeg', 'nonMonic', 'formula', 'rearrange'] },
    { kind: 'exam', template: 'examArea' },
    {
      kind: 'recap',
      md: md`- Get **$= 0$ on one side**, then factorise or use the formula.
- Pairs that **multiply to $c$** and **add to $b$**.
- From $(x - 5)(x + 3) = 0$ the answers are $x = 5$ and $x = -3$: **flip the signs**.
- Formula: learn it, bracket negatives, work out $b^2 - 4ac$ first, round at the end.
- In context (lengths, ages, counts), reject the answer that makes no sense and say why.`,
      mistakes: [
        'Wrong signs when solving from the brackets.',
        'Not rearranging to = 0 first.',
        'Using −b as negative when b is already negative.',
        'Rounding b² − 4ac or the square root too early.',
      ],
    },
  ],
  templates: {
    monicPos: {
      level: 1, marks: 2, skill: 'Solving x² + bx + c = 0 by factorising (c positive)',
      gen(r) {
        const s = r.sign();
        let { p, q, b, c } = monic(r, 1, 9, 1);
        p = Math.abs(p) * s; q = Math.abs(q) * s; b = p + q; c = p * q;
        return {
          q: md`Solve $${poly([c, b, 1])} = 0$`,
          a: { kind: 'numbers', values: [-p, -q] },
          show: md`$x = ${-p}$ or $x = ${-q}$`,
          placeholder: 'x = …, x = …',
          hints: [
            md`Find two numbers that multiply to $${c}$ and add to $${b}$.`,
            md`The numbers are $${p}$ and $${q}$, so it factorises to $(${lin(1, p)})(${lin(1, q)}) = 0$.`,
          ],
          steps: [
            md`Two numbers that multiply to $${c}$ and add to $${b}$: $${p}$ and $${q}$.`,
            md`$(${lin(1, p)})(${lin(1, q)}) = 0$`,
            md`$${lin(1, p)} = 0$ or $${lin(1, q)} = 0$`,
            md`$x = ${-p}$ or $x = ${-q}$`,
          ],
        };
      },
    },
    monicNeg: {
      level: 2, marks: 2, skill: 'Solving x² + bx + c = 0 by factorising (c negative)',
      gen(r) {
        const { p, q, b, c } = monic(r, -9, 9, -1);
        return {
          q: md`Solve $${poly([c, b, 1])} = 0$`,
          a: { kind: 'numbers', values: [-p, -q] },
          show: md`$x = ${-p}$ or $x = ${-q}$`,
          placeholder: 'x = …, x = …',
          hints: [
            md`$c = ${c}$ is negative, so the two numbers have different signs. They multiply to $${c}$ and add to $${b}$.`,
            md`The numbers are $${p}$ and $${q}$: $(${lin(1, p)})(${lin(1, q)}) = 0$. Now flip the signs.`,
          ],
          steps: [
            md`Multiply to $${c}$, add to $${b}$: $${p}$ and $${q}$.`,
            md`$(${lin(1, p)})(${lin(1, q)}) = 0$`,
            md`$x = ${-p}$ or $x = ${-q}$`,
          ],
        };
      },
    },
    nonMonic: {
      level: 3, marks: 3, skill: 'Solving ax² + bx + c = 0 by factorising',
      gen(r) {
        for (;;) {
          const a = r.pick([2, 3, 5]);
          const m = r.nz(-5, 5);
          const n = r.nz(-6, 6);
          if (gcd(a, Math.abs(m)) !== 1) continue; // (ax + m)(x + n)
          const B = a * n + m;
          const C = m * n;
          if (B === 0) continue;
          return {
            q: md`Solve $${poly([C, B, a])} = 0$`,
            a: { kind: 'numbers', values: [-m / a, -n] },
            show: md`$x = ${fracTex(-m, a)}$ or $x = ${-n}$`,
            placeholder: 'fractions are fine, e.g. 2/3',
            hints: [
              md`Work out $a \times c = ${a} \times ${br(C)} = ${a * C}$. Find two numbers that multiply to $${a * C}$ and add to $${B}$.`,
              md`It factorises to $(${lin(a, m)})(${lin(1, n)}) = 0$.`,
            ],
            steps: [
              md`$a \times c = ${a * C}$; the numbers are $${a * n}$ and $${m}$.`,
              md`$${poly([0, 0, a])} ${a * n < 0 ? '-' : '+'} ${Math.abs(a * n)}x ${m < 0 ? '-' : '+'} ${Math.abs(m)}x ${C < 0 ? '-' : '+'} ${Math.abs(C)} = 0$`,
              md`$(${lin(a, m)})(${lin(1, n)}) = 0$`,
              md`$x = ${fracTex(-m, a)}$ or $x = ${-n}$`,
            ],
          };
        }
      },
    },
    formula: {
      level: 3, marks: 3, skill: 'Using the quadratic formula',
      gen(r) {
        for (;;) {
          const a = r.pick([1, 2, 3]);
          const b = r.nz(-9, 9);
          const c = r.nz(-9, 9);
          const D = b * b - 4 * a * c;
          if (D <= 0 || Number.isInteger(Math.sqrt(D))) continue;
          const x1 = (-b + Math.sqrt(D)) / (2 * a);
          const x2 = (-b - Math.sqrt(D)) / (2 * a);
          return {
            q: md`Solve $${poly([c, b, a])} = 0$

Give your answers to 2 decimal places.`,
            a: { kind: 'numbers', values: [x1, x2], dp: 2 },
            show: md`$x = ${dp(x1, 2)}$ or $x = ${dp(x2, 2)}$`,
            placeholder: 'x = …, x = …',
            hints: [
              md`$a = ${a}$, $b = ${b}$, $c = ${c}$. Start with $b^2 - 4ac$.`,
              md`$b^2 - 4ac = ${br(b)}^2 - 4 \times ${a} \times ${br(c)} = ${D}$, so $x = \dfrac{${-b} \pm \sqrt{${D}}}{${2 * a}}$.`,
            ],
            steps: [
              md`$a = ${a}$, $b = ${b}$, $c = ${c}$`,
              md`$b^2 - 4ac = ${br(b)}^2 - 4 \times ${a} \times ${br(c)} = ${D}$`,
              md`$x = \dfrac{${-b} \pm \sqrt{${D}}}{${2 * a}}$`,
              md`$x = ${dp(x1, 2)}$ or $x = ${dp(x2, 2)}$`,
            ],
          };
        }
      },
    },
    rearrange: {
      level: 2, marks: 3, skill: 'Rearranging to = 0 before solving a quadratic',
      gen(r) {
        const { p, q, b, c } = monic(r, -8, 8, 0);
        const form = r.pick(['move', 'bracket']);
        if (form === 'bracket' && p !== q) {
          // x(x + b) = -c
          return {
            q: md`Solve $x(${lin(1, b)}) = ${-c}$`,
            a: { kind: 'numbers', values: [-p, -q] },
            show: md`$x = ${-p}$ or $x = ${-q}$`,
            placeholder: 'x = …, x = …',
            hints: [md`Expand the bracket and move everything to one side: $${poly([c, b, 1])} = 0$.`, md`It factorises to $(${lin(1, p)})(${lin(1, q)}) = 0$.`],
            steps: [md`$${poly([0, b, 1])} = ${-c}$`, md`$${poly([c, b, 1])} = 0$`, md`$(${lin(1, p)})(${lin(1, q)}) = 0$`, md`$x = ${-p}$ or $x = ${-q}$`],
          };
        }
        return {
          q: md`Solve $x^2 = ${poly([-c, -b])}$`,
          a: { kind: 'numbers', values: [-p, -q] },
          show: md`$x = ${-p}$ or $x = ${-q}$`,
          placeholder: 'x = …, x = …',
          hints: [md`Move every term to the left so the right-hand side is 0.`, md`$${poly([c, b, 1])} = 0$, which factorises to $(${lin(1, p)})(${lin(1, q)}) = 0$.`],
          steps: [md`$${poly([c, b, 1])} = 0$`, md`$(${lin(1, p)})(${lin(1, q)}) = 0$`, md`$x = ${-p}$ or $x = ${-q}$`],
        };
      },
    },
    examArea: {
      level: 3, marks: 4, skill: 'Forming and solving a quadratic from an area',
      gen(r) {
        for (;;) {
          const x = r.int(4, 11);
          const s1 = r.int(1, 5);
          const s2 = r.int(1, Math.min(3, x - 1));
          const area = (x + s1) * (x - s2);
          const other = -(s1 - s2) - x; // second root of x^2 + (s1 - s2)x - (s1 s2 + area) = 0
          if (other >= 0 || other === -x) continue;
          const B = s1 - s2;
          const C = -s1 * s2 - area;
          return {
            q: md`A rectangle has length $(x + ${s1})$ cm and width $(x - ${s2})$ cm.

Its area is $${area}$ cm².

Work out the value of $x$.`,
            a: { kind: 'number', value: x },
            show: md`$x = ${x}$`,
            placeholder: 'x = …',
            hints: [
              md`Area = length × width, so $(x + ${s1})(x - ${s2}) = ${area}$. Expand and rearrange to $= 0$.`,
              md`$${poly([C, B, 1])} = 0$ factorises to $(x - ${x})(x + ${-other}) = 0$. A length cannot be negative.`,
            ],
            steps: [
              md`$(x + ${s1})(x - ${s2}) = ${area}$ **[M1: forms the equation]**`,
              md`$${poly([-s1 * s2, B, 1])} = ${area}$ so $${poly([C, B, 1])} = 0$ **[M1: rearranges to = 0]**`,
              md`$(x - ${x})(x + ${-other}) = 0$ **[M1: factorises]**`,
              md`$x = ${x}$ (reject $x = ${other}$ because the width $x - ${s2}$ would be negative) **[A1]**`,
            ],
            diagnose: (input) => (/,|or/.test(input) ? 'Only one value works: x is part of a length, so reject the negative solution.' : undefined),
          };
        }
      },
    },
  },
};
