import { fracTex, fracPlain, simplify, lead } from '../engine.js';

const md = String.raw;
const powTex = (k, v, n) => `${k === 1 ? '' : k === -1 ? '-' : k}${v}^{${n}}`;
const powPlain = (k, v, n) => `${k === 1 ? '' : k === -1 ? '-' : k}${v}^${n < 0 ? `(${n})` : n}`;

export default {
  id: 'indices',
  title: 'Laws of indices: negative and fractional powers',
  subtitle: 'Multiply, divide, brackets; negative and fractional indices',
  topics: ['N7', 'A4'],
  band: '6',
  calc: 'non-calc',
  minutes: 35,
  why: 'Index questions are short, reliable 1–3 mark questions on the non-calculator paper, and fractional/negative indices are a classic grade 6–7 discriminator.',
  steps: [
    {
      kind: 'learn', title: 'The three laws',
      md: md`| Rule | Example |
|---|---|
| Multiply: **add** the powers $a^m \times a^n = a^{m+n}$ | $x^5 \times x^3 = x^8$ |
| Divide: **subtract** the powers $a^m \div a^n = a^{m-n}$ | $x^7 \div x^2 = x^5$ |
| Bracket: **multiply** the powers $(a^m)^n = a^{mn}$ | $(x^3)^4 = x^{12}$ |

Numbers in front are dealt with normally: $6x^5 \times 4x^{-2} = 24x^3$ (multiply 6 × 4, add 5 + −2).`,
      key: md`In a bracket, **everything** gets the power: $(2x^3)^4 = 2^4 x^{12} = 16x^{12}$, not $2x^{12}$.`,
    },
    {
      kind: 'example', title: 'Simplify',
      q: md`Simplify $\dfrac{12x^7y^2}{4x^3y}$`,
      steps: [
        { md: md`Numbers: $12 \div 4 = 3$` },
        { md: md`$x$: $x^{7-3} = x^4$`, why: 'Dividing: subtract the powers.' },
        { md: md`$y$: $y^{2-1} = y$`, why: 'y on its own means y¹.' },
        { md: md`$= 3x^4y$` },
      ],
      answer: md`$3x^4y$`,
    },
    { kind: 'try', template: 'lawsMultiply' },
    {
      kind: 'learn', title: 'Zero and negative powers',
      md: md`$$a^0 = 1 \qquad a^{-n} = \frac{1}{a^n}$$

A negative power means **one over** (the reciprocal). It does **not** make the answer negative.

$$5^{-2} = \frac{1}{5^2} = \frac{1}{25} \qquad \left(\frac{2}{3}\right)^{-1} = \frac{3}{2}$$`,
    },
    { kind: 'try', template: 'negative' },
    {
      kind: 'learn', title: 'Fractional powers',
      md: md`$$a^{\frac{1}{n}} = \sqrt[n]{a} \qquad a^{\frac{m}{n}} = \left(\sqrt[n]{a}\right)^m$$

The **bottom** of the fraction is the **root**, the **top** is the **power**. Do the root first: the numbers stay small.

$$64^{\frac{2}{3}} = \left(\sqrt[3]{64}\right)^2 = 4^2 = 16$$`,
      key: 'Order for something like 27^(−2/3): 1) negative → flip (reciprocal), 2) bottom → root, 3) top → power.',
    },
    {
      kind: 'example', title: 'Negative and fractional together',
      q: md`Work out $27^{-\frac{2}{3}}$`,
      steps: [
        { md: md`$27^{-\frac{2}{3}} = \dfrac{1}{27^{\frac{2}{3}}}$`, why: 'The minus sign means one over.' },
        { md: md`$\sqrt[3]{27} = 3$`, why: 'The 3 on the bottom is a cube root.' },
        { md: md`$3^2 = 9$`, why: 'The 2 on top is a square.' },
        { md: md`$= \dfrac{1}{9}$` },
      ],
      answer: md`$\frac{1}{9}$`,
    },
    { kind: 'try', template: 'fractional' },
    {
      kind: 'example', title: 'A fraction to a negative fractional power',
      q: md`Work out $\left(\dfrac{4}{9}\right)^{-\frac{3}{2}}$`,
      steps: [
        { md: md`$= \left(\dfrac{9}{4}\right)^{\frac{3}{2}}$`, why: 'Negative power: flip the fraction.' },
        { md: md`Square root of top and bottom: $\dfrac{3}{2}$` },
        { md: md`Cube it: $\dfrac{27}{8}$` },
      ],
      answer: md`$\frac{27}{8}$`,
    },
    { kind: 'practice', title: 'Practice', templates: ['lawsMultiply', 'lawsDivide', 'powerBracket', 'negative', 'fractional', 'fractionBase', 'solvePower'] },
    { kind: 'exam', template: 'examPowerOf2' },
    {
      kind: 'recap',
      md: md`- Multiply → add powers; divide → subtract; bracket → multiply.
- Numbers in front: multiply/divide normally; a bracket powers the number too.
- $a^0 = 1$; negative power → reciprocal (one over), never negative.
- Fractional power: bottom = root, top = power. Root first.`,
      mistakes: ['(2x³)⁴ written as 2x¹²', '5⁻² written as −25', 'Multiplying the powers when multiplying terms', 'Doing the power before the root and getting huge numbers'],
    },
  ],
  templates: {
    lawsMultiply: {
      level: 1, marks: 2, skill: 'Multiplying terms with indices',
      gen(r) {
        const a = r.int(2, 7); const b = r.int(2, 6); const m = r.int(2, 8); const n = r.int(-4, 6) || 3;
        const k = a * b; const e = m + n;
        if (e === 0 || e === 1) return this.gen(r);
        return {
          q: md`Simplify $${powTex(a, 'x', m)} \times ${powTex(b, 'x', n)}$`,
          a: { kind: 'expr', expr: `${k}x^(${e})`, form: 'single' },
          typed: powPlain(k, 'x', e),
          show: md`$${powTex(k, 'x', e)}$`,
          wrong: [m * n !== e ? powPlain(k, 'x', m * n) : null, a + b !== k ? powPlain(a + b, 'x', e) : null].filter(Boolean),
          hints: [md`Multiply the numbers: $${a} \times ${b}$.`, md`Add the powers: $${m} + ${n < 0 ? `(${n})` : n} = ${e}$.`],
          steps: [md`Numbers: $${a} \times ${b} = ${k}$`, md`Powers: $${m} + ${n < 0 ? `(${n})` : n} = ${e}$`, md`$${powTex(k, 'x', e)}$`],
        };
      },
    },
    lawsDivide: {
      level: 1, marks: 2, skill: 'Dividing terms with indices',
      gen(r) {
        const b = r.int(2, 6); const q = r.int(2, 6); const a = b * q;
        const m = r.int(5, 12); const n = r.int(1, m - 2); const p = r.int(2, 5); const s = r.int(1, p - 1);
        return {
          q: md`Simplify $\dfrac{${a}x^{${m}}y^{${p}}}{${b}x^{${n}}y${s === 1 ? '' : `^{${s}}`}}$`,
          a: { kind: 'expr', expr: `${q}x^${m - n}y^${p - s}`, form: 'single', vars: ['x', 'y'] },
          typed: `${q}x^${m - n}y^${p - s}`,
          show: md`$${q}x^{${m - n}}${p - s === 1 ? 'y' : `y^{${p - s}}`}$`,
          wrong: m / n !== m - n ? [`${q}x^${m / n}y^${p - s}`] : [],
          hints: [md`Divide the numbers, then **subtract** the powers of each letter.`, md`$x^{${m}-${n}}$ and $y^{${p}-${s}}$.`],
          steps: [md`$${a} \div ${b} = ${q}$`, md`$x^{${m}-${n}} = x^{${m - n}}$`, md`$y^{${p}-${s}} = ${p - s === 1 ? 'y' : `y^{${p - s}}`}$`, md`$${q}x^{${m - n}}${p - s === 1 ? 'y' : `y^{${p - s}}`}$`],
        };
      },
    },
    powerBracket: {
      level: 2, marks: 2, skill: 'Raising a term in a bracket to a power',
      gen(r) {
        const a = r.int(2, 5); const m = r.int(2, 6); const s = r.int(1, 4); const n = r.pick([2, 3, 4]);
        if (a ** n > 700) return this.gen(r);
        return {
          q: md`Simplify $(${a}x^{${m}}y${s === 1 ? '' : `^{${s}}`})^{${n}}$`,
          a: { kind: 'expr', expr: `${a ** n}x^${m * n}y^${s * n}`, form: 'single', vars: ['x', 'y'] },
          typed: `${a ** n}x^${m * n}y^${s * n}`,
          show: md`$${a ** n}x^{${m * n}}y^{${s * n}}$`,
          wrong: [`${a}x^${m * n}y^${s * n}`, a * n !== a ** n ? `${a * n}x^${m * n}y^${s * n}` : null].filter(Boolean),
          hints: [md`Everything inside the bracket is raised to the power $${n}$, including the number.`, md`$${a}^{${n}} = ${a ** n}$, and multiply each power by $${n}$.`],
          steps: [md`$${a}^{${n}} = ${a ** n}$`, md`$(x^{${m}})^{${n}} = x^{${m * n}}$, $(y${s === 1 ? '' : `^{${s}}`})^{${n}} = y^{${s * n}}$`, md`$${a ** n}x^{${m * n}}y^{${s * n}}$`],
        };
      },
    },
    negative: {
      level: 1, marks: 1, skill: 'Evaluating negative indices',
      gen(r) {
        const b = r.int(2, 10); const n = r.pick([1, 2, 2, 3]);
        if (b ** n > 1000) return this.gen(r);
        return {
          q: md`Work out the value of $${b}^{-${n}}$`,
          a: { kind: 'fraction', num: 1, den: b ** n, simplest: true },
          show: md`$\frac{1}{${b ** n}}$`,
          wrong: [String(-(b ** n)), `-${b * n}`],
          hints: [md`A negative power means "one over": $${b}^{-${n}} = \dfrac{1}{${b}^{${n}}}$.`],
          steps: [md`$${b}^{-${n}} = \dfrac{1}{${b}^{${n}}}$`, md`$= \dfrac{1}{${b ** n}}$`],
        };
      },
    },
    fractional: {
      level: 2, marks: 2, skill: 'Evaluating fractional indices',
      gen(r) {
        const root = r.pick([2, 2, 3, 3, 4]);
        const k = root === 4 ? r.pick([2, 3]) : r.int(2, root === 3 ? 5 : 9);
        const m = r.pick([1, 2, 3, -1, -2]);
        const base = k ** root;
        if (Math.abs(m) === 3 && k > 4) return this.gen(r);
        const val = k ** Math.abs(m);
        const [num, den] = m > 0 ? [val, 1] : [1, val];
        const ex = m > 0 ? `\\frac{${m}}{${root}}` : `-\\frac{${-m}}{${root}}`;
        const rootName = root === 2 ? 'square root' : root === 3 ? 'cube root' : 'fourth root';
        return {
          q: md`Work out the value of $${base}^{${ex}}$`,
          a: { kind: 'fraction', num, den, simplest: true },
          show: md`$${fracTex(num, den)}$`,
          wrong: [String(base ** (Math.abs(m) / root) * -1)],
          hints: [md`The bottom number ($${root}$) means take the ${rootName}: $\sqrt[${root}]{${base}} = ${k}$.`, md`Then raise to the power $${Math.abs(m)}$${m < 0 ? ', and the minus means one over' : ''}.`],
          steps: [md`${rootName[0].toUpperCase() + rootName.slice(1)}: $\sqrt[${root}]{${base}} = ${k}$`, md`Power: $${k}^{${Math.abs(m)}} = ${val}$`, m < 0 ? md`Negative power: $\dfrac{1}{${val}}$` : md`$= ${val}$`],
        };
      },
    },
    fractionBase: {
      level: 3, marks: 2, skill: 'A fraction to a negative fractional power',
      gen(r) {
        const root = r.pick([2, 3]); const m = r.pick([1, 2, 3]);
        const [p, q] = r.pick(root === 2 ? [[2, 3], [3, 4], [2, 5], [4, 5], [3, 5], [1, 4], [5, 6]] : [[2, 3], [1, 2], [3, 4], [2, 5]]);
        if (root === 3 && m === 3) return this.gen(r);
        // (p^root / q^root)^(-m/root) = (q/p)^m
        return {
          q: md`Work out $\left(\dfrac{${p ** root}}{${q ** root}}\right)^{-\frac{${m}}{${root}}}$`,
          a: { kind: 'fraction', num: q ** m, den: p ** m, simplest: true },
          show: md`$${fracTex(q ** m, p ** m)}$`,
          hints: [md`Negative power: flip the fraction to $\dfrac{${q ** root}}{${p ** root}}$.`, md`Take the ${root === 2 ? 'square' : 'cube'} root of top and bottom: $\dfrac{${q}}{${p}}$, then raise to the power $${m}$.`],
          steps: [md`Flip: $\left(\dfrac{${q ** root}}{${p ** root}}\right)^{\frac{${m}}{${root}}}$`, md`Root: $\dfrac{${q}}{${p}}$`, md`Power ${m}: $${fracTex(q ** m, p ** m)}$`],
        };
      },
    },
    solvePower: {
      level: 3, marks: 2, skill: 'Solving equations with powers',
      gen(r) {
        const form = r.pick(['neg', 'frac']);
        if (form === 'neg') {
          const b = r.pick([2, 3, 5]); const n = r.int(2, b === 2 ? 6 : 3);
          return {
            q: md`Find the value of $x$ when $${b}^x = \dfrac{1}{${b ** n}}$`,
            a: { kind: 'number', value: -n },
            show: md`$x = -${n}$`,
            wrong: [String(n)],
            hints: [md`$${b ** n} = ${b}^{${n}}$.`, md`$\dfrac{1}{${b}^{${n}}} = ${b}^{-${n}}$.`],
            steps: [md`$${b ** n} = ${b}^{${n}}$`, md`$\dfrac{1}{${b}^{${n}}} = ${b}^{-${n}}$`, md`$x = -${n}$`],
          };
        }
        const [s, t] = r.pick([[4, 8], [9, 27], [8, 4], [27, 9], [4, 32], [25, 125]]);
        const base = s === 4 || s === 8 || s === 32 ? 2 : s === 9 || s === 27 ? 3 : 5;
        const ps = Math.round(Math.log(s) / Math.log(base)); const pt = Math.round(Math.log(t) / Math.log(base));
        const [n, d] = simplify(pt, ps);
        return {
          q: md`Find the value of $x$ when $${s}^x = ${t}$`,
          a: { kind: 'number', value: n / d },
          typed: fracPlain(n, d),
          show: md`$x = ${fracTex(n, d)}$`,
          hints: [md`Write both numbers as powers of $${base}$: $${s} = ${base}^{${ps}}$, $${t} = ${base}^{${pt}}$.`, md`So $${base}^{${ps}x} = ${base}^{${pt}}$, which means $${ps}x = ${pt}$.`],
          steps: [md`$${s} = ${base}^{${ps}}$ and $${t} = ${base}^{${pt}}$`, md`$(${base}^{${ps}})^x = ${base}^{${pt}} \Rightarrow ${ps}x = ${pt}$`, md`$x = ${fracTex(n, d)}$`],
        };
      },
    },
    examPowerOf2: {
      level: 3, marks: 3, skill: 'Writing expressions as a single power',
      gen(r) {
        const b = r.pick([4, 8, 16]); const p = { 4: 2, 8: 3, 16: 4 }[b];
        const c = r.pick([2, 4, 8, 16, 32]); const q = Math.log2(c);
        const neg = r.bool();
        // b^x × c = 2^(px + q) ; or b^x ÷ c = 2^(px - q)
        const k = neg ? -q : q;
        return {
          q: md`$${b}^x ${neg ? '\\div' : '\\times'} ${c} = 2^n$

Write $n$ in terms of $x$.`,
          a: { kind: 'expr', expr: `${p}x+${k}`, vars: ['x'] },
          typed: `${p}x${k < 0 ? '' : '+'}${k}`,
          show: md`$n = ${lead(p, 'x')} ${k < 0 ? '-' : '+'} ${Math.abs(k)}$`,
          wrong: [`${p}x`, `${b}x+${k}`],
          hints: [md`Write $${b}$ and $${c}$ as powers of 2: $${b} = 2^{${p}}$, $${c} = 2^{${q}}$.`, md`$${b}^x = (2^{${p}})^x = 2^{${p}x}$. ${neg ? 'Dividing' : 'Multiplying'} means ${neg ? 'subtract' : 'add'} the powers.`],
          steps: [md`$${b} = 2^{${p}}$ so $${b}^x = 2^{${p}x}$ **[M1]**`, md`$${c} = 2^{${q}}$ **[M1]**`, md`$2^{${p}x} ${neg ? '\\div' : '\\times'} 2^{${q}} = 2^{${p}x ${neg ? '-' : '+'} ${q}}$, so $n = ${lead(p, 'x')} ${k < 0 ? '-' : '+'} ${Math.abs(k)}$ **[A1]**`],
        };
      },
    },
  },
};
