import { fmt, dp } from '../engine.js';
import { boxPlot } from '../diagrams.js';

const md = String.raw;
const ord = (n) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')}`;

// Quartiles of a sorted list the GCSE way: positions (n+1)/4, (n+1)/2, 3(n+1)/4.
function at(sorted, pos) {
  const i = Math.floor(pos); const f = pos - i;
  return f === 0 ? sorted[i - 1] : sorted[i - 1] + f * (sorted[i] - sorted[i - 1]);
}

export default {
  id: 'statistics',
  title: 'Averages, spread and box plots',
  subtitle: 'Mean from a grouped table, quartiles, box plots, comparing',
  topics: ['S4', 'S5', 'S2'],
  band: '6',
  calc: 'calc',
  minutes: 35,
  why: 'An estimated mean from a grouped table is a 3–4 mark question on most Paper 3s. Comparing box plots is 2 marks that need the right words.',
  steps: [
    {
      kind: 'learn', title: 'Estimating the mean from a grouped table',
      md: md`You do not know the exact values, so use the **midpoint** of each class.

1. Find each midpoint $x$.
2. Work out $f \times x$ for each row.
3. Mean $\approx \dfrac{\text{total of } fx}{\text{total of } f}$.

It is an **estimate** because you used midpoints.`,
      key: 'Divide by the total frequency, not by the number of classes.',
    },
    {
      kind: 'example', title: 'Grouped mean',
      q: md`| Time $t$ (min) | Frequency |
|---|---|
| $0 < t \le 10$ | 4 |
| $10 < t \le 20$ | 9 |
| $20 < t \le 30$ | 7 |

Work out an estimate for the mean time.`,
      steps: [
        { md: md`Midpoints: $5, 15, 25$` },
        { md: md`$fx$: $4 \times 5 = 20$, $9 \times 15 = 135$, $7 \times 25 = 175$` },
        { md: md`Total $fx = 330$, total $f = 20$` },
        { md: md`Mean $\approx 330 \div 20 = 16.5$ minutes` },
      ],
      answer: md`$16.5$ minutes`,
    },
    { kind: 'try', template: 'groupedMean' },
    {
      kind: 'learn', title: 'Median, quartiles and IQR',
      md: md`Put the data **in order**. For $n$ values:

- median: the $\dfrac{n + 1}{2}$th value
- lower quartile $Q_1$: the $\dfrac{n + 1}{4}$th value
- upper quartile $Q_3$: the $\dfrac{3(n + 1)}{4}$th value

**Interquartile range** $= Q_3 - Q_1$. It measures spread of the middle half and is not affected by extreme values.`,
    },
    { kind: 'try', template: 'quartiles' },
    {
      kind: 'learn', title: 'Box plots and comparing',
      md: md`A box plot shows five numbers: minimum, $Q_1$, median, $Q_3$, maximum.

To **compare** two distributions you need **two** comments, each with numbers and in context:

1. **Average:** "The median for Class A (34) is higher than for Class B (28), so on average Class A scored higher."
2. **Spread:** "The IQR for Class A (10) is smaller than for Class B (16), so Class A's scores are more consistent."`,
      diagram: boxPlot({ min: 18, q1: 29, med: 34, q3: 39, max: 48, lo: 15, hi: 50, step: 5, label: 'Class A' }),
      key: 'Compare the median and the IQR, not the minimum and maximum. Always say what it means in context.',
    },
    { kind: 'try', template: 'readBoxPlot' },
    { kind: 'practice', title: 'Practice', templates: ['groupedMean', 'modalMedianClass', 'quartiles', 'readBoxPlot', 'compare', 'combinedMean'] },
    { kind: 'exam', template: 'combinedMean' },
    {
      kind: 'recap',
      md: md`- Grouped mean: midpoints, $\sum fx \div \sum f$, and call it an estimate.
- Median at $\frac{n+1}{2}$, quartiles at $\frac{n+1}{4}$ and $\frac{3(n+1)}{4}$.
- IQR $= Q_3 - Q_1$.
- Compare: median (average) and IQR (spread), with numbers and context.`,
      mistakes: ['Dividing by the number of classes instead of the total frequency', 'Using class boundaries instead of midpoints', 'Comparing ranges instead of IQRs', 'Comparing without saying what it means in context'],
    },
  ],
  templates: {
    groupedMean: {
      level: 2, marks: 4, skill: 'Estimated mean from a grouped table',
      gen(r) {
        const w = r.pick([5, 10, 20]); const start = r.pick([0, 10, 20]); const k = r.int(3, 5);
        const f = Array.from({ length: k }, () => r.int(2, 18));
        const mids = f.map((_, i) => start + w * i + w / 2);
        const fx = f.map((v, i) => v * mids[i]); const sf = f.reduce((a, b) => a + b, 0); const sfx = fx.reduce((a, b) => a + b, 0);
        const mean = sfx / sf; const exact = Number.isInteger(mean * 100);
        const unit = r.pick([['Mass $m$ (kg)', 'm', 'mass', 'kg'], ['Time $t$ (minutes)', 't', 'time', 'minutes'], ['Height $h$ (cm)', 'h', 'height', 'cm']]);
        const rows = f.map((v, i) => `| $${start + w * i} < ${unit[1]} \\le ${start + w * (i + 1)}$ | ${v} |`).join('\n');
        return {
          q: md`The table shows information about some ${unit[2] === 'mass' ? 'parcels' : unit[2] === 'time' ? 'journeys' : 'plants'}.

| ${unit[0]} | Frequency |
|---|---|
${rows}

Work out an estimate for the mean ${unit[2]}.${exact ? '' : ' Give your answer to 1 decimal place.'}`,
          a: { kind: 'number', value: mean, ...(exact ? {} : { dp: 1 }) },
          show: md`$${exact ? fmt(mean) : dp(mean, 1)}$ ${unit[3]}`,
          wrong: [fmt(sfx / k), exact ? fmt(f.reduce((a, v, i) => a + v * (start + w * (i + 1)), 0) / sf) : dp(f.reduce((a, v, i) => a + v * (start + w * (i + 1)), 0) / sf, 1)].filter((x) => x !== (exact ? fmt(mean) : dp(mean, 1))),
          hints: [md`Midpoints: $${mids.join(', ')}$.`, md`Multiply each frequency by its midpoint, add them up, then divide by the total frequency $${sf}$.`],
          steps: [md`Midpoints: $${mids.join(', ')}$`, md`$fx$: $${fx.join(', ')}$`, md`$\sum fx = ${sfx}$, $\sum f = ${sf}$`, md`$${sfx} \div ${sf} = ${fmt(mean, 4)}${exact ? '' : '\\dots'}$${exact ? '' : md` $\approx ${dp(mean, 1)}$`}`],
        };
      },
    },
    modalMedianClass: {
      level: 1, marks: 1, skill: 'Class containing the median',
      gen(r) {
        const w = r.pick([5, 10]); const k = 4;
        for (;;) {
          const f = Array.from({ length: k }, () => r.int(2, 20)); const n = f.reduce((a, b) => a + b, 0);
          const pos = (n + 1) / 2; let c = 0; let mi = 0;
          for (let i = 0; i < k; i++) { c += f[i]; if (c >= Math.ceil(pos)) { mi = i; break; } }
          // Avoid the median falling between two classes.
          let cum = 0; let edge = false; for (let i = 0; i < k; i++) { cum += f[i]; if (cum === Math.floor(pos) && pos % 1) edge = true; }
          if (edge) continue;
          const labels = f.map((_, i) => `${w * i} < x ≤ ${w * (i + 1)}`);
          return {
            q: md`| Score $x$ | Frequency |
|---|---|
${f.map((v, i) => `| $${w * i} < x \\le ${w * (i + 1)}$ | ${v} |`).join('\n')}

Which class contains the median?`,
            a: { kind: 'choice', options: labels, correct: mi },
            show: md`$${w * mi} < x \le ${w * (mi + 1)}$`,
            hints: [md`There are $${n}$ values, so the median is the $\dfrac{${n} + 1}{2} = ${fmt(pos)}$th value.`, md`Add up the frequencies until you reach $${fmt(pos)}$.`],
            steps: [md`$n = ${n}$, median is the $${fmt(pos)}$th value`, md`Running totals: $${f.reduce((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []).join(', ')}$`, md`The $${fmt(pos)}$th value is in $${w * mi} < x \le ${w * (mi + 1)}$`],
          };
        }
      },
    },
    quartiles: {
      level: 2, marks: 2, skill: 'Median, quartiles and interquartile range',
      gen(r) {
        const n = r.pick([7, 11, 15]); const vals = Array.from({ length: n }, () => r.int(10, 60)).sort((a, b) => a - b);
        const q1 = at(vals, (n + 1) / 4); const q3 = at(vals, (3 * (n + 1)) / 4);
        const shuffled = r.shuffle([...vals]);
        return {
          q: md`Here are ${n} test scores:

${shuffled.join(', ')}

Work out the interquartile range.`,
          a: { kind: 'number', value: q3 - q1 },
          show: md`$${fmt(q3 - q1)}$`,
          wrong: [String(vals.at(-1) - vals[0])].filter((w) => +w !== q3 - q1),
          hints: [md`Put them in order first.`, md`$Q_1$ is the ${ord((n + 1) / 4)} value $\left(\dfrac{${n} + 1}{4}\right)$, $Q_3$ the ${ord((3 * (n + 1)) / 4)}.`],
          steps: [md`In order: ${vals.join(', ')}`, md`$Q_1 = ${q1}$ (${ord((n + 1) / 4)} value), $Q_3 = ${q3}$ (${ord((3 * (n + 1)) / 4)} value)`, md`IQR $= ${q3} - ${q1} = ${q3 - q1}$`],
        };
      },
    },
    readBoxPlot: {
      level: 1, marks: 1, skill: 'Reading a box plot',
      gen(r) {
        const min = r.int(2, 8) * 2; const q1 = min + r.int(2, 6) * 2; const med = q1 + r.int(1, 5) * 2; const q3 = med + r.int(1, 5) * 2; const max = q3 + r.int(2, 6) * 2;
        const lo = Math.floor(min / 10) * 10; const hi = Math.ceil(max / 10) * 10;
        const ask = r.pick(['IQR', 'median', 'range']);
        const val = ask === 'IQR' ? q3 - q1 : ask === 'median' ? med : max - min;
        return {
          q: md`The box plot shows the ages of people at a party. Write down the ${ask === 'IQR' ? 'interquartile range' : ask}.`,
          diagram: boxPlot({ min, q1, med, q3, max, lo, hi, step: 2 }).replace(/<text[^>]*>(\d+)<\/text>/g, (m, v) => (+v % 10 === 0 ? m : '')),
          a: { kind: 'number', value: val },
          show: md`$${val}$`,
          wrong: ask === 'IQR' ? [String(max - min)] : ask === 'range' ? [String(q3 - q1)] : [String(q1), String(q3)].filter((w) => +w !== med),
          hints: [ask === 'IQR' ? md`IQR = upper quartile − lower quartile: the two ends of the **box**.` : ask === 'median' ? md`The median is the line **inside** the box.` : md`Range = maximum − minimum: the ends of the **whiskers**.`, md`Each small tick is 2.`],
          steps: [md`Minimum $${min}$, $Q_1 = ${q1}$, median $${med}$, $Q_3 = ${q3}$, maximum $${max}$`, ask === 'IQR' ? md`$${q3} - ${q1} = ${val}$` : ask === 'median' ? md`Median $= ${med}$` : md`$${max} - ${min} = ${val}$`],
        };
      },
    },
    compare: {
      level: 2, marks: 2, skill: 'Comparing distributions',
      gen(r) {
        const mA = r.int(25, 45); let mB = r.int(25, 45); if (mA === mB) mB += 3;
        const iA = r.int(6, 20); let iB = r.int(6, 20); if (iA === iB) iB += 4;
        const opts = [
          `The median for A (${mA}) is ${mA > mB ? 'higher' : 'lower'} than B (${mB}), so A scored ${mA > mB ? 'higher' : 'lower'} on average. The IQR for A (${iA}) is ${iA < iB ? 'smaller' : 'larger'} than B (${iB}), so A's scores are ${iA < iB ? 'more' : 'less'} consistent.`,
          `The median for A (${mA}) is ${mA > mB ? 'higher' : 'lower'} than B (${mB}), so A scored ${mA > mB ? 'higher' : 'lower'} on average. The IQR for A (${iA}) is ${iA < iB ? 'smaller' : 'larger'} than B (${iB}), so A's scores are ${iA < iB ? 'less' : 'more'} consistent.`,
          `A has a ${mA > mB ? 'higher' : 'lower'} median and a ${iA < iB ? 'smaller' : 'larger'} IQR.`,
          `A's highest score is higher than B's, so A did better.`,
        ];
        const order = r.shuffle([0, 1, 2, 3]);
        return {
          q: md`Two classes, A and B, sat the same test.

| | Median | Interquartile range |
|---|---|---|
| Class A | ${mA} | ${iA} |
| Class B | ${mB} | ${iB} |

Which is the best comparison (worth both marks)?`,
          a: { kind: 'choice', options: order.map((i) => opts[i]), correct: order.indexOf(0) },
          show: opts[0],
          hints: [md`You need one comment on the **average** and one on the **spread**, each with numbers **and** what it means.`, md`A smaller IQR means **more** consistent.`],
          steps: [md`Average: compare the medians, ${mA} and ${mB}, and say who did better.`, md`Spread: compare the IQRs, ${iA} and ${iB}. Smaller IQR = more consistent.`, md`Comments with no context ("A has a higher median") lose marks.`],
        };
      },
    },
    combinedMean: {
      level: 3, marks: 3, skill: 'Combined and missing values from a mean',
      gen(r) {
        const n1 = r.int(8, 20); const m1 = r.int(30, 70); const n2 = r.int(8, 20); const m2 = r.int(30, 70);
        if (m1 === m2) return this.gen(r);
        const total = n1 * m1 + n2 * m2; const mean = total / (n1 + n2); const exact = Number.isInteger(mean * 10);
        return {
          q: md`The mean mark of ${n1} students in group P is ${m1}. The mean mark of ${n2} students in group Q is ${m2}.

Work out the mean mark of all ${n1 + n2} students.${exact ? '' : ' Give your answer to 1 decimal place.'}`,
          a: { kind: 'number', value: mean, ...(exact ? {} : { dp: 1 }) },
          show: md`$${exact ? fmt(mean) : dp(mean, 1)}$`,
          wrong: [fmt((m1 + m2) / 2)].filter((w) => Math.abs(+w - mean) >= 0.05),
          hints: [md`Total marks for P $= ${n1} \times ${m1}$. Do the same for Q.`, md`Divide the combined total by $${n1 + n2}$, not by 2.`],
          steps: [md`P total $= ${n1} \times ${m1} = ${n1 * m1}$ **[M1]**`, md`Q total $= ${n2} \times ${m2} = ${n2 * m2}$`, md`$(${n1 * m1} + ${n2 * m2}) \div ${n1 + n2} = ${fmt(mean, 4)}${exact ? '' : '\\dots'}$ **[M1]**`, md`$${exact ? fmt(mean) : dp(mean, 1)}$ **[A1]**`],
        };
      },
    },
  },
};
