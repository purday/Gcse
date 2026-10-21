import { fmt, dp } from '../engine.js';

const md = String.raw;

export default {
  id: 'bounds',
  title: 'Error intervals and bounds',
  subtitle: 'Rounding, truncation, upper and lower bounds in calculations',
  topics: ['N15', 'N16'],
  band: '7',
  calc: 'calc',
  minutes: 30,
  why: 'Error intervals (2 marks) are easy once you know the rule; bounds in calculations (3–4 marks) are a grade 7 question where the method is always the same.',
  steps: [
    {
      kind: 'learn', title: 'Error intervals',
      md: md`A rounded value could be up to **half a unit** either side.

$x = 6.4$ to 1 d.p. (unit 0.1, half is 0.05):

$$6.35 \le x < 6.45$$

The lower bound is **included** (≤), the upper bound is **not** (<), because 6.45 would round up to 6.5.

**Truncated** (chopped, not rounded): $x = 6.4$ truncated to 1 d.p. means $6.4 \le x < 6.5$.`,
    },
    { kind: 'try', template: 'interval' },
    {
      kind: 'learn', title: 'Bounds in calculations',
      md: md`To make a result as **big** or **small** as possible, choose the bounds that push it that way:

| Calculation | Maximum | Minimum |
|---|---|---|
| $a + b$ | upper + upper | lower + lower |
| $a - b$ | upper − **lower** | lower − **upper** |
| $a \times b$ | upper × upper | lower × lower |
| $a \div b$ | upper ÷ **lower** | lower ÷ **upper** |`,
      key: 'Subtracting or dividing flips which bound you use for the second number.',
    },
    {
      kind: 'example', title: 'Maximum speed',
      q: md`A car travels 120 km, correct to the nearest 10 km, in 1.5 hours, correct to 1 d.p. Work out the upper bound of its average speed.`,
      steps: [
        { md: md`Distance bounds: $115 \le d < 125$. Time bounds: $1.45 \le t < 1.55$.` },
        { md: md`Speed $= \dfrac{d}{t}$: biggest top ÷ smallest bottom.` },
        { md: md`$\dfrac{125}{1.45} = 86.206\dots$ km/h` },
      ],
      answer: md`$86.2$ km/h (3 s.f.)`,
    },
    { kind: 'practice', title: 'Practice', templates: ['interval', 'truncate', 'productBound', 'differenceBound', 'divisionBound'] },
    { kind: 'exam', template: 'divisionBound' },
    {
      kind: 'recap',
      md: md`- Half a unit either side; lower bound ≤, upper bound <.
- Truncation: from the value up to the next unit.
- Max of $a - b$ and $a \div b$: upper of $a$, **lower** of $b$.`,
      mistakes: ['Using ± a whole unit instead of half', 'Writing ≤ for the upper bound', 'Dividing upper by upper for a maximum'],
    },
  ],
  templates: {
    interval: {
      level: 1, marks: 2, skill: 'Error interval for a rounded value',
      gen(r) {
        const kind = r.pick(['1dp', 'nearest10', 'nearest', '2dp']);
        const unit = { '1dp': 0.1, '2dp': 0.01, nearest10: 10, nearest: 1 }[kind];
        const v = kind === 'nearest10' ? r.int(3, 60) * 10 : kind === 'nearest' ? r.int(5, 200) : +(r.int(20, 999) * unit).toFixed(2);
        const lo = +(v - unit / 2).toFixed(4); const hi = +(v + unit / 2).toFixed(4);
        const say = { '1dp': 'correct to 1 decimal place', '2dp': 'correct to 2 decimal places', nearest10: 'correct to the nearest 10', nearest: 'correct to the nearest whole number' }[kind];
        return {
          q: md`A length $x$ cm is ${fmt(v)} cm, ${say}. Write down the error interval for $x$.`,
          a: { kind: 'inequality', v: 'x', lo, loInc: true, hi, hiInc: false },
          show: md`$${lo} \le x < ${hi}$`,
          placeholder: 'e.g. 6.35 <= x < 6.45',
          wrong: [`${lo} <= x <= ${hi}`],
          hints: [md`Half of the unit ${unit} is ${fmt(unit / 2)}. Go that far either side of ${fmt(v)}.`],
          steps: [md`Half a unit: $${fmt(unit / 2)}$`, md`$${lo} \le x < ${hi}$`],
        };
      },
    },
    truncate: {
      level: 2, marks: 2, skill: 'Error interval for a truncated value',
      gen(r) {
        const d = r.pick([0, 1]); const unit = d ? 0.1 : 1; const v = d ? +(r.int(10, 99) / 10).toFixed(1) : r.int(3, 99);
        return {
          q: md`$y$ is truncated to ${d ? '1 decimal place' : 'a whole number'}. The result is $${v}$. Write down the error interval for $y$.`,
          a: { kind: 'inequality', v: 'y', lo: v, loInc: true, hi: +(v + unit).toFixed(1), hiInc: false },
          show: md`$${v} \le y < ${fmt(v + unit)}$`,
          placeholder: 'e.g. 4.3 <= y < 4.4',
          wrong: [`${fmt(v - unit / 2)} <= y < ${fmt(v + unit / 2)}`],
          hints: ['Truncating just chops the digits off, so the value could be anything from the shown number up to (but not including) the next one.'],
          steps: [md`$${v} \le y < ${fmt(v + unit)}$`],
        };
      },
    },
    productBound: {
      level: 2, marks: 2, skill: 'Upper or lower bound of a product',
      gen(r) {
        const a = r.int(4, 20); const b = r.int(3, 15); const upper = r.bool();
        const val = upper ? (a + 0.5) * (b + 0.5) : (a - 0.5) * (b - 0.5);
        return {
          q: md`A rectangle has length ${a} cm and width ${b} cm, both measured to the nearest cm. Work out the ${upper ? 'upper' : 'lower'} bound for its area.`,
          a: { kind: 'number', value: val },
          show: md`$${fmt(val)}$ cm²`,
          wrong: [String(a * b)],
          hints: [md`Bounds: ${a} → $${a - 0.5}$ to $${a + 0.5}$; ${b} → $${b - 0.5}$ to $${b + 0.5}$.`, `For the ${upper ? 'largest' : 'smallest'} area, use both ${upper ? 'upper' : 'lower'} bounds.`],
          steps: [md`$${upper ? a + 0.5 : a - 0.5} \times ${upper ? b + 0.5 : b - 0.5} = ${fmt(val)}$ cm²`],
        };
      },
    },
    differenceBound: {
      level: 2, marks: 2, skill: 'Maximum of a difference',
      gen(r) {
        const a = r.int(50, 99); const b = r.int(10, a - 10);
        const val = a + 0.5 - (b - 0.5);
        return {
          q: md`$P = ${a}$ and $Q = ${b}$, both correct to the nearest whole number. Work out the upper bound of $P - Q$.`,
          a: { kind: 'number', value: val },
          show: md`$${fmt(val)}$`,
          wrong: [fmt(a + 0.5 - (b + 0.5))],
          hints: ['To make a difference as big as possible: biggest P, **smallest** Q.'],
          steps: [md`$${a + 0.5} - ${b - 0.5} = ${fmt(val)}$`],
        };
      },
    },
    divisionBound: {
      level: 3, marks: 3, skill: 'Bounds when dividing (speed, density)',
      gen(r) {
        const ctx = r.pick(['speed', 'density']);
        if (ctx === 'speed') {
          const d = r.int(8, 40) * 10; const t = r.int(12, 45) / 10; const upper = r.bool();
          const val = upper ? (d + 5) / (t - 0.05) : (d - 5) / (t + 0.05);
          return {
            q: md`A train travels ${d} km, correct to the nearest 10 km, in ${t.toFixed(1)} hours, correct to 1 decimal place.

Work out the ${upper ? 'upper' : 'lower'} bound for the average speed. Give your answer to 3 significant figures.`,
            a: { kind: 'number', value: val, sf: 3 },
            show: md`$${+val.toPrecision(3)}$ km/h`,
            wrong: [String(+((upper ? d + 5 : d - 5) / (upper ? t + 0.05 : t - 0.05)).toPrecision(3))],
            hints: [md`Distance $${d - 5}$ to $${d + 5}$; time $${dp(t - 0.05, 2)}$ to $${dp(t + 0.05, 2)}$.`, `${upper ? 'Biggest' : 'Smallest'} speed: ${upper ? 'upper' : 'lower'} distance ÷ ${upper ? 'lower' : 'upper'} time.`],
            steps: [md`Bounds: $${d - 5} \le d < ${d + 5}$ and $${dp(t - 0.05, 2)} \le t < ${dp(t + 0.05, 2)}$ **[B1]**`, md`$\dfrac{${upper ? d + 5 : d - 5}}{${dp(upper ? t - 0.05 : t + 0.05, 2)}} = ${fmt(val, 4)}\dots$ **[M1]**`, md`$${+val.toPrecision(3)}$ km/h **[A1]**`],
          };
        }
        const m = r.int(40, 200); const v = r.int(10, 40); const upper = r.bool();
        const val = upper ? (m + 0.5) / (v - 0.5) : (m - 0.5) / (v + 0.5);
        return {
          q: md`A block has mass ${m} g and volume ${v} cm³, both correct to the nearest whole number.

Work out the ${upper ? 'upper' : 'lower'} bound for its density. Give your answer to 3 significant figures.`,
          a: { kind: 'number', value: val, sf: 3 },
          show: md`$${+val.toPrecision(3)}$ g/cm³`,
          wrong: [String(+((upper ? m + 0.5 : m - 0.5) / (upper ? v + 0.5 : v - 0.5)).toPrecision(3))],
          hints: ['Density = mass ÷ volume.', `${upper ? 'Biggest' : 'Smallest'} density: ${upper ? 'upper' : 'lower'} mass ÷ ${upper ? 'lower' : 'upper'} volume.`],
          steps: [md`Bounds: $${m - 0.5}$ to $${m + 0.5}$ g; $${v - 0.5}$ to $${v + 0.5}$ cm³ **[B1]**`, md`$\dfrac{${upper ? m + 0.5 : m - 0.5}}{${upper ? v - 0.5 : v + 0.5}} = ${fmt(val, 4)}\dots$ **[M1]**`, md`$${+val.toPrecision(3)}$ g/cm³ **[A1]**`],
        };
      },
    },
  },
};
