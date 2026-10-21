import { fmt } from '../engine.js';
import { histogram } from '../diagrams.js';

const md = String.raw;

// Unequal classes with frequency densities that draw cleanly on the grid.
function makeClasses(r) {
  const widths = r.pick([[10, 10, 20, 20, 40], [5, 5, 10, 20, 10], [10, 20, 10, 30, 30], [20, 10, 10, 20, 40]]);
  const start = r.pick([0, 10, 20]);
  const classes = []; let x = start;
  for (const w of widths) { classes.push([x, x + w]); x += w; }
  // Heights are multiples of 0.2 so they sit on the grid lines.
  const fd = widths.map((w) => r.pick(w >= 20 ? [0.4, 0.8, 1, 1.2, 1.6, 2, 2.4] : [0.6, 1, 1.4, 1.8, 2.2, 2.6, 3.2, 3.8]));
  const f = fd.map((d, i) => +(d * widths[i]).toFixed(6));
  if (!f.every(Number.isInteger)) return makeClasses(r);
  return { classes, widths, fd, f };
}

export default {
  id: 'histograms',
  title: 'Histograms and cumulative frequency',
  subtitle: 'Frequency density, reading histograms, estimating from part of a class',
  topics: ['S3'],
  band: '7',
  calc: 'both',
  minutes: 30,
  why: 'Histograms with unequal class widths are Higher-only and worth 3–5 marks. The method never changes, so these are very learnable grade 7 marks.',
  steps: [
    {
      kind: 'learn', title: 'Frequency density',
      md: md`In a histogram the **area** of each bar is the frequency, not the height.

$$\text{frequency density} = \frac{\text{frequency}}{\text{class width}} \qquad \text{frequency} = \text{frequency density} \times \text{class width}$$

The vertical axis is always **frequency density**.`,
      key: 'Frequency = height × width. Write that line down every time.',
    },
    {
      kind: 'example', title: 'Drawing a bar',
      q: md`The class $20 < t \le 50$ has frequency 36. How tall is its bar?`,
      steps: [
        { md: md`Class width $= 50 - 20 = 30$` },
        { md: md`Frequency density $= 36 \div 30 = 1.2$` },
      ],
      answer: md`$1.2$`,
    },
    { kind: 'try', template: 'fd' },
    {
      kind: 'learn', title: 'Reading a histogram',
      md: md`To find how many are in a class: **height × width**.

To estimate how many are in **part** of a class, assume the values are spread evenly: take the same fraction of the bar. For example, the bar $10 < x \le 30$ with frequency density $2$ holds $40$; between $10$ and $15$ is a quarter of the width, so about $10$.`,
      diagram: histogram({ classes: [[0, 10], [10, 30], [30, 40], [40, 60]], fd: [1.5, 2, 3.5, 1], xlabel: 'x' }),
    },
    { kind: 'try', template: 'readBar' },
    { kind: 'try', template: 'partClass' },
    {
      kind: 'learn', title: 'Cumulative frequency',
      md: md`**Cumulative frequency** is a running total. It is plotted at the **upper end** of each class.

- Median: read across at $\frac{n}{2}$.
- Quartiles: read across at $\frac{n}{4}$ and $\frac{3n}{4}$.
- "How many are more than $k$?": read the cumulative frequency at $k$, then subtract it from the total.`,
    },
    { kind: 'try', template: 'cumulative' },
    { kind: 'practice', title: 'Practice', templates: ['fd', 'readBar', 'total', 'partClass', 'cumulative'] },
    { kind: 'exam', template: 'partClass' },
    {
      kind: 'recap',
      md: md`- Frequency density $=$ frequency $\div$ class width.
- Frequency $=$ height $\times$ width (area).
- Part of a class: the same fraction of the width gives the same fraction of the frequency.
- Cumulative frequency is plotted at the upper class boundary.`,
      mistakes: ['Reading the bar height as the frequency', 'Using the class width wrongly (e.g. 20 < x ≤ 50 has width 30)', 'Plotting cumulative frequency at the midpoint'],
    },
  ],
  templates: {
    fd: {
      level: 1, marks: 1, skill: 'Working out frequency density',
      gen(r) {
        const a = r.pick([0, 10, 20, 30, 40]); const w = r.pick([5, 10, 15, 20, 25, 40, 50]); const d = r.pick([0.4, 0.6, 0.8, 1.2, 1.4, 1.6, 2, 2.4, 3, 3.5]);
        const f = +(w * d).toFixed(6); if (!Number.isInteger(f)) return this.gen(r);
        return {
          q: md`A class $${a} < x \le ${a + w}$ has frequency ${f}. Work out its frequency density.`,
          a: { kind: 'number', value: d },
          show: md`$${fmt(d)}$`,
          wrong: [fmt(f / (a + w))].filter((x) => x !== fmt(d)),
          hints: [md`Class width $= ${a + w} - ${a} = ${w}$.`],
          steps: [md`Width $= ${w}$`, md`$${f} \div ${w} = ${fmt(d)}$`],
        };
      },
    },
    readBar: {
      level: 2, marks: 2, skill: 'Frequency from a histogram bar',
      gen(r) {
        const { classes, widths, fd, f } = makeClasses(r); const i = r.int(0, classes.length - 1);
        return {
          q: md`The histogram shows the times, in minutes, that some people waited. How many people waited between ${classes[i][0]} and ${classes[i][1]} minutes?`,
          diagram: histogram({ classes, fd, xlabel: 'Time (minutes)' }),
          a: { kind: 'number', value: f[i] },
          show: md`$${f[i]}$`,
          wrong: [fmt(fd[i])].filter((x) => +x !== f[i]),
          hints: [md`Frequency = height × width. Read the height from the frequency density axis.`],
          steps: [md`Height $= ${fmt(fd[i])}$, width $= ${widths[i]}$`, md`$${fmt(fd[i])} \times ${widths[i]} = ${f[i]}$`],
        };
      },
    },
    total: {
      level: 2, marks: 2, skill: 'Total frequency from a histogram',
      gen(r) {
        const { classes, widths, fd, f } = makeClasses(r); const T = f.reduce((a, b) => a + b, 0);
        return {
          q: md`The histogram shows the masses, in grams, of some apples. How many apples are there altogether?`,
          diagram: histogram({ classes, fd, xlabel: 'Mass (g)' }),
          a: { kind: 'number', value: T },
          show: md`$${T}$`,
          hints: [md`Find the frequency of each bar (height × width), then add.`],
          steps: [md`${f.map((v, i) => `$${fmt(fd[i])} \\times ${widths[i]} = ${v}$`).join(', ')}`, md`Total $= ${f.join(' + ')} = ${T}$`],
        };
      },
    },
    partClass: {
      level: 3, marks: 3, skill: 'Estimating from part of a class',
      gen(r) {
        const { classes, widths, fd, f } = makeClasses(r);
        const i = r.int(1, classes.length - 1);
        const [lo, hi] = classes[i];
        // A cut inside class i that gives a whole-number estimate.
        const cuts = []; for (let c = lo + 1; c < hi; c++) if (Number.isInteger(+(fd[i] * (c - lo)).toFixed(6))) cuts.push(c);
        if (!cuts.length) return this.gen(r);
        const c = r.pick(cuts); const part = +(fd[i] * (c - lo)).toFixed(6);
        const before = f.slice(0, i).reduce((a, b) => a + b, 0);
        const startHere = r.bool();
        const ans = startHere ? part : before + part;
        const from = startHere ? lo : classes[0][0];
        return {
          q: md`The histogram shows the times, in seconds, taken by some runners. Work out an estimate for the number of runners who took between ${from} and ${c} seconds.`,
          diagram: histogram({ classes, fd, xlabel: 'Time (seconds)' }),
          a: { kind: 'number', value: ans },
          show: md`$${ans}$`,
          wrong: [String(startHere ? f[i] : before + f[i])],
          hints: [startHere ? md`Only part of the bar from ${lo} to ${hi}. Use the width from ${lo} to ${c}.` : md`Add the whole bars before ${lo}, then part of the next bar (from ${lo} to ${c}).`, md`Part of a bar: height × the part of the width you need.`],
          steps: [
            ...(startHere ? [] : [md`Whole bars before ${lo}: ${f.slice(0, i).map((v, j) => `$${fmt(fd[j])} \\times ${widths[j]} = ${v}$`).join(', ')}, total $${before}$ **[M1]**`]),
            md`Part bar: $${fmt(fd[i])} \times (${c} - ${lo}) = ${fmt(fd[i])} \times ${c - lo} = ${part}$ **[M1]**`,
            startHere ? md`About $${ans}$ runners **[A1]**` : md`$${before} + ${part} = ${ans}$ **[A1]**`,
          ],
        };
      },
    },
    cumulative: {
      level: 2, marks: 2, skill: 'Using cumulative frequency',
      gen(r) {
        const w = r.pick([10, 20]); const k = 5; const f = Array.from({ length: k }, () => r.int(3, 25));
        const cf = f.reduce((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []); const T = cf.at(-1);
        const j = r.int(1, k - 2); const b = w * (j + 1); const more = r.bool();
        const ans = more ? T - cf[j] : cf[j];
        return {
          q: md`The table shows the marks of ${T} students.

| Mark $m$ | Frequency |
|---|---|
${f.map((v, i) => `| $${w * i} < m \\le ${w * (i + 1)}$ | ${v} |`).join('\n')}

How many students scored ${more ? 'more than' : 'at most'} ${b} marks?`,
          a: { kind: 'number', value: ans },
          show: md`$${ans}$`,
          wrong: [String(more ? cf[j] : T - cf[j])].filter((x) => +x !== ans),
          hints: [md`Cumulative frequencies (running totals): $${cf.join(', ')}$.`, more ? md`"More than ${b}" is the total minus the cumulative frequency at ${b}.` : md`Read the cumulative frequency at ${b}.`],
          steps: [md`Running totals: $${cf.join(', ')}$`, md`At $m = ${b}$ the cumulative frequency is $${cf[j]}$`, more ? md`$${T} - ${cf[j]} = ${ans}$` : md`So $${ans}$ students`],
        };
      },
    },
  },
};
