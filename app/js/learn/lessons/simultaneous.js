import { poly, sterm, lead, br, money } from '../engine.js';

const md = String.raw;
const eqn = (a, b, c) => `${lead(a, 'x')} ${sterm(b, 'y')} = ${c}`;

export default {
  id: 'simultaneous',
  title: 'Simultaneous equations',
  subtitle: 'Elimination, word problems, linear with quadratic',
  topics: ['A19', 'A21'],
  band: '6',
  calc: 'non-calc',
  minutes: 45,
  why: 'A 3–4 mark simultaneous equations question is on almost every Higher paper, and the linear-with-quadratic version (5 marks) is a common grade 7–8 question.',
  steps: [
    {
      kind: 'learn', title: 'The idea',
      md: md`Two equations, two unknowns. You want a pair $(x, y)$ that makes **both** true.

**Elimination method:**

1. Make the number in front of $x$ (or $y$) the **same size** in both equations, multiplying an equation if needed.
2. **Same signs → subtract. Different signs → add.** One letter disappears.
3. Solve for the letter that is left.
4. Substitute back into either equation for the other letter.
5. Check in the **other** equation.`,
    },
    {
      kind: 'example', title: 'Add to eliminate',
      q: md`Solve $3x + 2y = 16$ and $5x - 2y = 8$`,
      steps: [
        { md: md`The $y$ terms are $+2y$ and $-2y$: same size, different signs, so **add**.` },
        { md: md`$8x = 24$, so $x = 3$` },
        { md: md`Substitute into the first: $9 + 2y = 16 \Rightarrow 2y = 7 \Rightarrow y = 3.5$` },
        { md: md`Check in the second: $5(3) - 2(3.5) = 15 - 7 = 8$ ✓` },
      ],
      answer: md`$x = 3$, $y = 3.5$`,
    },
    { kind: 'try', template: 'elimDirect' },
    {
      kind: 'example', title: 'Multiply first',
      q: md`Solve $2x + 3y = 13$ and $5x + 2y = 16$`,
      steps: [
        { md: md`Nothing matches yet. Make the $y$ terms both $6y$: multiply the first by 2 and the second by 3.` },
        { md: md`$4x + 6y = 26$ and $15x + 6y = 48$` },
        { md: md`Same signs, so **subtract**: $11x = 22$, $x = 2$`, why: '15x − 4x = 11x and 48 − 26 = 22.' },
        { md: md`$2(2) + 3y = 13 \Rightarrow 3y = 9 \Rightarrow y = 3$` },
        { md: md`Check: $5(2) + 2(3) = 16$ ✓` },
      ],
      answer: md`$x = 2$, $y = 3$`,
    },
    { kind: 'try', template: 'elimMultiply' },
    {
      kind: 'learn', title: 'Word problems',
      md: md`Choose letters for the two unknowns, **write the letters' meaning down**, form two equations from the two facts, then solve as normal.

"3 adult tickets and 2 child tickets cost £41" → $3a + 2c = 41$.`,
    },
    { kind: 'try', template: 'word' },
    {
      kind: 'learn', title: 'One linear, one quadratic (grade 7–8)',
      md: md`When one equation has $x^2$ (or $y^2$), use **substitution**:

1. Rearrange the linear equation to $y = \dots$ (or $x = \dots$).
2. Substitute into the quadratic. You get a quadratic in one letter.
3. Rearrange to $= 0$ and solve (factorise or formula): **two** answers.
4. Find the matching $y$ for **each** $x$ using the **linear** equation.

The answers are the two points where the line crosses the curve.`,
    },
    {
      kind: 'example', title: 'Line and circle',
      q: md`Solve $y = x + 1$ and $x^2 + y^2 = 25$`,
      steps: [
        { md: md`Substitute: $x^2 + (x + 1)^2 = 25$` },
        { md: md`$x^2 + x^2 + 2x + 1 = 25 \Rightarrow 2x^2 + 2x - 24 = 0 \Rightarrow x^2 + x - 12 = 0$`, why: 'Expand (x + 1)² carefully and divide through by 2.' },
        { md: md`$(x + 4)(x - 3) = 0$, so $x = -4$ or $x = 3$` },
        { md: md`$y = x + 1$: when $x = 3$, $y = 4$; when $x = -4$, $y = -3$` },
      ],
      answer: md`$(3, 4)$ and $(-4, -3)$`,
    },
    { kind: 'practice', title: 'Practice', templates: ['elimDirect', 'elimMultiply', 'elimMultiply', 'word', 'linQuad'] },
    { kind: 'exam', template: 'linQuadExam' },
    {
      kind: 'recap',
      md: md`- Match one letter's coefficients. **Same signs subtract, different signs add.**
- Substitute back, then check in the other equation.
- Word problems: define your letters and write two equations.
- Linear + quadratic: substitute the linear into the quadratic, solve, then find **each** matching $y$.`,
      mistakes: ['Adding when the signs are the same (or subtracting when different)', 'Forgetting to multiply the right-hand side too', 'Only giving x and not y', 'Pairing the wrong y with an x in linear–quadratic questions'],
    },
  ],
  templates: {
    elimDirect: {
      level: 1, marks: 3, skill: 'Solving simultaneous equations by adding or subtracting',
      gen(r) {
        const x = r.int(-5, 8); const y = r.int(-4, 7);
        const b = r.int(1, 5); const a1 = r.int(1, 6); let a2 = r.int(1, 6);
        const sameSign = r.bool();
        if (a1 === a2) a2 = a1 + 1;
        const b2 = sameSign ? b : -b;
        const c1 = a1 * x + b * y; const c2 = a2 * x + b2 * y;
        return {
          q: md`Solve the simultaneous equations

$$${eqn(a1, b, c1)}$$
$$${eqn(a2, b2, c2)}$$`,
          a: { kind: 'multi', parts: [{ label: '$x =$', spec: { kind: 'number', value: x } }, { label: '$y =$', spec: { kind: 'number', value: y } }] },
          typed: [String(x), String(y)],
          show: md`$x = ${x}$, $y = ${y}$`,
          hints: [md`The $y$ terms are $${lead(b, 'y')}$ and $${lead(b2, 'y')}$: ${sameSign ? 'same signs, so **subtract**' : 'different signs, so **add**'} the equations.`, md`That gives $${lead(sameSign ? a1 - a2 : a1 + a2, 'x')} = ${sameSign ? c1 - c2 : c1 + c2}$.`],
          steps: [
            md`${sameSign ? 'Subtract' : 'Add'} the equations: $${lead(sameSign ? a1 - a2 : a1 + a2, 'x')} = ${sameSign ? c1 - c2 : c1 + c2}$`,
            md`$x = ${x}$`,
            md`Substitute into the first: $${a1 === 1 ? '' : a1}${br(x)} ${sterm(b, 'y')} = ${c1}$, so $${lead(b, 'y')} = ${c1 - a1 * x}$ and $y = ${y}$`,
            md`Check: $${a2 === 1 ? '' : a2}${br(x)} ${b2 < 0 ? '-' : '+'} ${Math.abs(b2) === 1 ? '' : Math.abs(b2)}${br(y)} = ${c2}$ ✓`,
          ],
          verify: () => (a1 * x + b * y === c1 && a2 * x + b2 * y === c2 && (sameSign ? a1 - a2 : a1 + a2) !== 0) || 'inconsistent',
        };
      },
    },
    elimMultiply: {
      level: 2, marks: 4, skill: 'Simultaneous equations needing a multiplier',
      gen(r) {
        for (;;) {
          const x = r.int(-4, 7); const y = r.int(-4, 7);
          const a1 = r.int(2, 6); const b1 = r.nz(-5, 5); const a2 = r.int(2, 6); const b2 = r.nz(-5, 5);
          if (a1 * b2 - a2 * b1 === 0 || a1 === a2 || Math.abs(b1) === Math.abs(b2) || a1 % a2 === 0 || a2 % a1 === 0) continue;
          const c1 = a1 * x + b1 * y; const c2 = a2 * x + b2 * y;
          // eliminate x: multiply eq1 by a2 and eq2 by a1
          const B1 = b1 * a2; const B2 = b2 * a1; const C1 = c1 * a2; const C2 = c2 * a1;
          return {
            q: md`Solve the simultaneous equations

$$${eqn(a1, b1, c1)}$$
$$${eqn(a2, b2, c2)}$$`,
            a: { kind: 'multi', parts: [{ label: '$x =$', spec: { kind: 'number', value: x } }, { label: '$y =$', spec: { kind: 'number', value: y } }] },
            typed: [String(x), String(y)],
            show: md`$x = ${x}$, $y = ${y}$`,
            hints: [md`Make the $x$ terms match: multiply the first equation by $${a2}$ and the second by $${a1}$.`, md`You get $${a1 * a2}x ${sterm(B1, 'y')} = ${C1}$ and $${a1 * a2}x ${sterm(B2, 'y')} = ${C2}$. Now subtract.`],
            steps: [
              md`First × $${a2}$: $${a1 * a2}x ${sterm(B1, 'y')} = ${C1}$`,
              md`Second × $${a1}$: $${a1 * a2}x ${sterm(B2, 'y')} = ${C2}$`,
              md`Subtract: $${lead(B1 - B2, 'y')} = ${C1 - C2}$, so $y = ${y}$`,
              md`Substitute: $${a1}x ${sterm(b1)} \times ${br(y)} = ${c1} \Rightarrow ${a1}x = ${c1 - b1 * y} \Rightarrow x = ${x}$`,
            ],
            verify: () => (B1 - B2) * y === C1 - C2 || 'bad elimination',
          };
        }
      },
    },
    word: {
      level: 2, marks: 4, skill: 'Forming and solving simultaneous equations from a context',
      gen(r) {
        const ctx = r.pick([
          { a: 'adult ticket', as: 'adult tickets', b: 'child ticket', bs: 'child tickets' },
          { a: 'large pizza', as: 'large pizzas', b: 'garlic bread', bs: 'garlic breads' },
          { a: 'notebook', as: 'notebooks', b: 'pen', bs: 'pens' },
          { a: 'coffee', as: 'coffees', b: 'muffin', bs: 'muffins' },
        ]);
        const word = (n, one, many) => `${n} ${n === 1 ? one : many}`;
        for (;;) {
          const pa = r.int(12, 40) / 2; const pb = r.int(4, 24) / 2;
          if (pa <= pb) continue;
          const n1 = r.int(2, 5); const m1 = r.int(1, 4); const n2 = r.int(1, 4); const m2 = r.int(2, 6);
          if (n1 * m2 - n2 * m1 === 0) continue;
          const t1 = n1 * pa + m1 * pb; const t2 = n2 * pa + m2 * pb;
          return {
            q: md`${word(n1, ctx.a, ctx.as)} and ${word(m1, ctx.b, ctx.bs)} cost ${money(t1)}.

${word(n2, ctx.a, ctx.as)} and ${word(m2, ctx.b, ctx.bs)} cost ${money(t2)}.

Work out the cost of one ${ctx.a} and the cost of one ${ctx.b}.`,
            a: { kind: 'multi', parts: [{ label: `One ${ctx.a} (£)`, spec: { kind: 'number', value: pa } }, { label: `One ${ctx.b} (£)`, spec: { kind: 'number', value: pb } }] },
            typed: [pa.toFixed(2), pb.toFixed(2)],
            show: md`one ${ctx.a}: ${money(pa)}, one ${ctx.b}: ${money(pb)}`,
            hints: [md`Let $a$ = cost of one ${ctx.a} and $b$ = cost of one ${ctx.b}. Then $${n1}a + ${m1}b = ${t1}$ and $${n2}a + ${m2}b = ${t2}$.`, md`Multiply to match the $a$ terms: first × $${n2}$, second × $${n1}$, then subtract.`],
            steps: [
              md`$${n1}a + ${m1}b = ${t1}$ and $${n2}a + ${m2}b = ${t2}$ **[M1]**`,
              md`× to match $a$: $${n1 * n2}a + ${m1 * n2}b = ${+(t1 * n2).toFixed(2)}$ and $${n1 * n2}a + ${m2 * n1}b = ${+(t2 * n1).toFixed(2)}$`,
              md`Subtract: $${lead(m2 * n1 - m1 * n2, 'b')} = ${+(t2 * n1 - t1 * n2).toFixed(2)}$, so $b = ${pb}$ **[M1]**`,
              md`Substitute: $${n1}a + ${m1 * pb} = ${t1} \Rightarrow a = ${pa}$ **[A1]**`,
            ],
          };
        }
      },
    },
    linQuad: {
      level: 3, marks: 5, skill: 'Solving a linear and a quadratic simultaneously',
      gen(r) {
        const [x1, x2] = r.distinct(2, -4, 5);
        const m = r.nz(-3, 3); const c = r.int(-5, 6);
        // curve y = x^2 + p x + q meets y = m x + c where x^2 + (p - m) x + (q - c) = 0 has roots x1, x2
        const p = m - (x1 + x2); const q = c + x1 * x2;
        const y1 = m * x1 + c; const y2 = m * x2 + c;
        return {
          q: md`Solve the simultaneous equations

$$y = ${poly([q, p, 1])}$$
$$y = ${poly([c, m])}$$

Give each solution as a coordinate $(x, y)$.`,
          a: { kind: 'coords', points: [[x1, y1], [x2, y2]] },
          show: md`$(${x1}, ${y1})$ and $(${x2}, ${y2})$`,
          hints: [md`Both equal $y$, so $${poly([q, p, 1])} = ${poly([c, m])}$.`, md`Rearrange to $${poly([q - c, p - m, 1])} = 0$ and factorise.`],
          steps: [
            md`$${poly([q, p, 1])} = ${poly([c, m])}$`,
            md`$${poly([q - c, p - m, 1])} = 0$`,
            md`$(x ${sterm(-x1)})(x ${sterm(-x2)}) = 0$, so $x = ${x1}$ or $x = ${x2}$`,
            md`$y = ${poly([c, m])}$: $(${x1}, ${y1})$ and $(${x2}, ${y2})$`,
          ],
          verify: () => (x1 * x1 + p * x1 + q === y1 && x2 * x2 + p * x2 + q === y2) || 'points not on curve',
        };
      },
    },
    linQuadExam: {
      level: 3, marks: 5, skill: 'Line and circle simultaneous equations',
      gen(r) {
        const set = r.pick([
          { r2: 25, pts: [[3, 4], [-4, -3]], line: [1, 1] }, // y = x + 1
          { r2: 25, pts: [[4, 3], [-3, -4]], line: [1, -1] }, // y = x - 1
          { r2: 25, pts: [[0, 5], [4, -3]], line: [-2, 5] }, // y = 5 - 2x
          { r2: 25, pts: [[5, 0], [-3, 4]], line: [-0.5, 2.5] },
          { r2: 10, pts: [[1, 3], [-3, -1]], line: [1, 2] }, // y = x + 2
          { r2: 13, pts: [[2, 3], [-3, -2]], line: [1, 1] },
          { r2: 20, pts: [[2, 4], [-4, -2]], line: [1, 2] },
          { r2: 50, pts: [[1, 7], [-7, -1]], line: [1, 6] },
          { r2: 17, pts: [[1, 4], [-4, -1]], line: [1, 3] },
        ]);
        const [m, c] = set.line;
        const lineTex = m === -0.5 ? '2y + x = 5' : `y = ${poly([c, m])}`;
        const A = 1 + m * m; const B = 2 * m * c; const C = c * c - set.r2;
        const k = m === -0.5 ? 4 : 1; // clear fractions for the step shown
        return {
          q: md`Solve the simultaneous equations

$$x^2 + y^2 = ${set.r2}$$
$$${lineTex}$$`,
          a: { kind: 'coords', points: set.pts },
          show: md`${set.pts.map(([x, y]) => `$(${x}, ${y})$`).join(' and ')}`,
          hints: [md`Write the line as $y = \dots$ and substitute into $x^2 + y^2 = ${set.r2}$.`, md`You should reach a quadratic in $x$: $${poly([C * k, B * k, A * k])} = 0$.`],
          steps: [
            md`$x^2 + (${m === -0.5 ? '\\tfrac{5 - x}{2}' : poly([c, m])})^2 = ${set.r2}$ **[M1: substitutes]**`,
            md`$${poly([C * k, B * k, A * k])} = 0$ **[M1: correct quadratic = 0]**`,
            md`Solve: $x = ${set.pts[0][0]}$ or $x = ${set.pts[1][0]}$ **[M1]**`,
            md`Matching $y$ from the line: ${set.pts.map(([x, y]) => `$(${x}, ${y})$`).join(' and ')} **[A1 A1]**`,
          ],
          verify: () => set.pts.every(([x, y]) => x * x + y * y === set.r2 && Math.abs(m * x + c - y) < 1e-9) || 'bad set',
        };
      },
    },
  },
};
