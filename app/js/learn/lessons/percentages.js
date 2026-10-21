import { money, fmt, dp } from '../engine.js';

const md = String.raw;
const mult = (pc, up) => fmt(up ? 1 + pc / 100 : 1 - pc / 100);

export default {
  id: 'percentages',
  title: 'Percentages, reverse percentages and compound interest',
  subtitle: 'Multipliers, percentage change, original value, growth and decay',
  topics: ['R9', 'R16'],
  band: '5',
  calc: 'both',
  minutes: 40,
  why: 'Percentages are in every paper. Reverse percentages and compound interest are 2–3 mark questions that students who use multipliers get right and others usually get wrong.',
  steps: [
    {
      kind: 'learn', title: 'Multipliers',
      md: md`Turn every percentage change into **one multiplication**:

| Change | Multiplier |
|---|---|
| increase by 15% | $\times 1.15$ |
| decrease by 15% | $\times 0.85$ |
| increase by 3.5% | $\times 1.035$ |
| decrease by 4% | $\times 0.96$ |

Increase: $1 + \frac{r}{100}$. Decrease: $1 - \frac{r}{100}$.`,
    },
    {
      kind: 'example', title: 'Increase by a percentage',
      q: md`Increase £240 by 15%.`,
      steps: [
        { md: md`Multiplier: $1 + 0.15 = 1.15$` },
        { md: md`$240 \times 1.15 = 276$` },
        { md: md`£276.00` },
      ],
      answer: md`£276`,
    },
    { kind: 'try', template: 'changeBy' },
    {
      kind: 'learn', title: 'Percentage change',
      md: md`$$\text{percentage change} = \frac{\text{change}}{\text{original}} \times 100$$

Always divide by the **original** (the value before the change).`,
    },
    { kind: 'try', template: 'pcChange' },
    {
      kind: 'learn', title: 'Reverse percentages: finding the original',
      md: md`If you know the value **after** a change, **divide** by the multiplier.

A jacket costs £68 after a 20% reduction. Original price: $68 \div 0.8 = £85$.`,
      key: 'Never take 20% off £68. The 20% was of the original price, not of £68.',
    },
    {
      kind: 'example', title: 'Reverse percentage with VAT',
      q: md`A price **including** 20% VAT is £540. Work out the price before VAT.`,
      steps: [
        { md: md`Adding 20% VAT multiplies by $1.2$` },
        { md: md`Original × 1.2 = 540, so original $= 540 \div 1.2$` },
        { md: md`$= £450$`, why: 'Check: 450 × 1.2 = 540 ✓' },
      ],
      answer: md`£450`,
    },
    { kind: 'try', template: 'reverse' },
    {
      kind: 'learn', title: 'Compound interest and depreciation',
      md: md`The change is applied **every year to the new amount**, so multiply by the multiplier once **per year**:

$$\text{amount} = P \times (\text{multiplier})^n$$

£2000 at 3% compound interest for 4 years: $2000 \times 1.03^4 = 2251.0162\dots = £2251.02$

A car worth £15 000 loses 12% a year: after 3 years $15000 \times 0.88^3 = £10\,222.08$`,
      key: 'Simple interest adds the same amount each year: 3% of £2000 = £60 a year, so £2240 after 4 years. Read the question for "simple" or "compound".',
    },
    { kind: 'try', template: 'compound' },
    { kind: 'practice', title: 'Practice', templates: ['changeBy', 'pcChange', 'reverse', 'reverse', 'compound', 'depreciation'] },
    { kind: 'exam', template: 'yearsUntil' },
    {
      kind: 'recap',
      md: md`- Use multipliers: +r% → $\times(1 + \frac{r}{100})$, −r% → $\times(1 - \frac{r}{100})$.
- Percentage change = change ÷ **original** × 100.
- Reverse percentage: **divide** by the multiplier.
- Compound: $\times(\text{multiplier})^n$. Money to 2 decimal places.`,
      mistakes: ['Taking the percentage off the new price in reverse questions', 'Dividing by the new value in percentage change', 'Using simple interest when it says compound', 'Rounding money to 1 decimal place'],
    },
  ],
  templates: {
    changeBy: {
      level: 1, marks: 2, skill: 'Increasing or decreasing by a percentage',
      gen(r) {
        const up = r.bool(); const pc = r.pick([5, 8, 12, 15, 17.5, 20, 25, 35, 3.5]); const amount = r.int(4, 90) * 10;
        const ans = amount * (up ? 1 + pc / 100 : 1 - pc / 100);
        return {
          q: md`${up ? 'Increase' : 'Decrease'} £${amount} by ${pc}%.`,
          a: { kind: 'number', value: Math.round(ans * 100) / 100, tol: 0.005 },
          show: money(ans),
          hints: [md`The multiplier is $${mult(pc, up)}$.`],
          steps: [md`Multiplier $${mult(pc, up)}$`, md`$${amount} \times ${mult(pc, up)} = ${fmt(ans)}$`, md`${money(ans)}`],
        };
      },
    },
    pcChange: {
      level: 2, marks: 2, skill: 'Percentage change',
      gen(r) {
        const orig = r.int(20, 400); const up = r.bool(); const change = r.int(3, Math.floor(orig * 0.6));
        const now = up ? orig + change : orig - change;
        const pc = (change / orig) * 100;
        const ctx = r.pick(['The price of a bike', 'The number of members of a club', 'The value of a painting', "A shop's weekly sales"]);
        return {
          q: md`${ctx} changed from ${orig} to ${now}.

Work out the percentage ${up ? 'increase' : 'decrease'}. Give your answer to 1 decimal place.`,
          a: { kind: 'number', value: pc, dp: 1 },
          show: `${dp(pc, 1)}%`,
          wrong: [dp((change / now) * 100, 1)].filter((w) => w !== dp(pc, 1)),
          hints: [md`Change $= ${change}$. Divide by the **original**, $${orig}$, then × 100.`],
          steps: [md`Change $= ${change}$`, md`$\dfrac{${change}}{${orig}} \times 100 = ${fmt(pc, 4)}\dots$`, md`$${dp(pc, 1)}\%$`],
        };
      },
    },
    reverse: {
      level: 2, marks: 3, skill: 'Reverse percentages',
      gen(r) {
        const ctx = r.pick([
          { up: false, s: 'In a sale, all prices are reduced by {p}%. A coat costs £{a} in the sale.', ask: 'Work out the price of the coat before the sale.' },
          { up: true, s: 'A price including VAT at {p}% is £{a}.', ask: 'Work out the price before VAT was added.', p: 20 },
          { up: true, s: 'After a {p}% pay rise, Sam earns £{a} per week.', ask: 'How much did Sam earn per week before the rise?' },
          { up: false, s: 'The value of a phone fell by {p}% to £{a}.', ask: 'Work out its value before the fall.' },
        ]);
        const pc = ctx.p || r.pick([10, 15, 20, 25, 30, 35, 40, 12.5]);
        const orig = r.int(8, 120) * (pc === 12.5 ? 8 : 4);
        const after = Math.round(orig * (ctx.up ? 1 + pc / 100 : 1 - pc / 100) * 100) / 100;
        const m = mult(pc, ctx.up);
        return {
          q: md`${ctx.s.replace('{p}', pc).replace('{a}', after.toFixed(2))}

${ctx.ask}`,
          a: { kind: 'number', value: orig, tol: 0.005 },
          show: money(orig),
          wrong: [fmt(after * (ctx.up ? 1 - pc / 100 : 1 + pc / 100))],
          hints: [md`The ${ctx.up ? 'increase' : 'decrease'} was ${pc}% **of the original**, so original × $${m}$ = £${after.toFixed(2)}.`, md`Divide: $${after.toFixed(2)} \div ${m}$.`],
          steps: [md`Multiplier: $${m}$`, md`original $\times ${m} = ${after.toFixed(2)}$`, md`original $= ${after.toFixed(2)} \div ${m} = ${fmt(orig)}$`, md`${money(orig)}`],
        };
      },
    },
    compound: {
      level: 2, marks: 3, skill: 'Compound interest',
      gen(r) {
        const P = r.int(5, 60) * 100; const rate = r.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]); const n = r.int(2, 8);
        const A = P * (1 + rate / 100) ** n;
        return {
          q: md`£${P} is invested for ${n} years at ${rate}% per year **compound** interest.

Work out the value of the investment at the end of ${n} years.`,
          a: { kind: 'number', value: Math.round(A * 100) / 100, tol: 0.006 },
          show: money(A),
          wrong: [fmt(P + P * rate / 100 * n)],
          hints: [md`Multiplier $= ${mult(rate, true)}$, applied $${n}$ times.`, md`$${P} \times ${mult(rate, true)}^{${n}}$`],
          steps: [md`Multiplier $${mult(rate, true)}$`, md`$${P} \times ${mult(rate, true)}^{${n}} = ${fmt(A, 4)}\dots$`, md`${money(A)}`],
        };
      },
    },
    depreciation: {
      level: 2, marks: 3, skill: 'Depreciation (compound decrease)',
      gen(r) {
        const P = r.int(6, 40) * 1000; const rate = r.pick([8, 10, 12, 15, 18, 20, 25]); const n = r.int(2, 5);
        const A = P * (1 - rate / 100) ** n;
        const thing = r.pick(['A car', 'A van', 'A motorbike', 'A machine']);
        return {
          q: md`${thing} cost £${P}. Its value decreases by ${rate}% each year.

Work out its value after ${n} years.`,
          a: { kind: 'number', value: Math.round(A * 100) / 100, tol: 0.006 },
          show: money(A),
          wrong: [fmt(P - P * rate / 100 * n)],
          hints: [md`Multiplier $= ${mult(rate, false)}$.`, md`$${P} \times ${mult(rate, false)}^{${n}}$`],
          steps: [md`Multiplier $${mult(rate, false)}$`, md`$${P} \times ${mult(rate, false)}^{${n}} = ${fmt(A, 4)}$`, md`${money(A)}`],
        };
      },
    },
    yearsUntil: {
      level: 3, marks: 3, skill: 'How many years for compound growth to pass a target',
      gen(r) {
        const P = r.int(10, 50) * 100; const rate = r.pick([2, 3, 4, 5, 6]); const target = Math.round(P * r.pick([1.2, 1.25, 1.3, 1.4, 1.5]));
        let n = 0; let v = P;
        while (v < target) { v *= 1 + rate / 100; n++; }
        const before = P * (1 + rate / 100) ** (n - 1);
        return {
          q: md`Erin invests £${P} at ${rate}% per year compound interest.

After how many whole years will the investment first be worth more than £${target}?`,
          a: { kind: 'number', value: n },
          show: md`${n} years`,
          hints: [md`Multiply by $${mult(rate, true)}$ year by year (or try powers) until it passes £${target}.`],
          steps: [md`$${P} \times ${mult(rate, true)}^{${n - 1}} = ${dp(before, 2)}$, not yet above £${target} **[M1]**`, md`$${P} \times ${mult(rate, true)}^{${n}} = ${dp(v, 2)}$, above £${target} **[M1]**`, md`${n} years **[A1]**`],
          verify: () => (before <= target && v > target) || 'bad year count',
        };
      },
    },
  },
};
