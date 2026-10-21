import { fmt, sf, dp } from '../engine.js';

const md = String.raw;
const s3 = (x) => sf(x, 3);

export default {
  id: 'compound-measures',
  title: 'Speed, density and pressure',
  subtitle: 'Compound measures, unit conversions, average speed',
  topics: ['R11', 'R1'],
  band: '5',
  calc: 'both',
  minutes: 30,
  why: 'Compound measures come up on almost every paper (2–4 marks). Most marks are lost on units: minutes vs hours, cm³ vs m³.',
  steps: [
    {
      kind: 'learn', title: 'Three formulas, one shape',
      md: md`| Measure | Formula | Units |
|---|---|---|
| Speed | $\text{speed} = \dfrac{\text{distance}}{\text{time}}$ | km/h, m/s |
| Density | $\text{density} = \dfrac{\text{mass}}{\text{volume}}$ | g/cm³, kg/m³ |
| Pressure | $\text{pressure} = \dfrac{\text{force}}{\text{area}}$ | N/m² |

Each one rearranges the same way: $\text{distance} = \text{speed} \times \text{time}$, $\text{time} = \dfrac{\text{distance}}{\text{speed}}$.`,
      key: 'Get the units to match before you divide: 45 minutes is 0.75 hours, not 0.45.',
    },
    { kind: 'try', template: 'speed' },
    {
      kind: 'example', title: 'Minutes into hours',
      q: md`A train travels 54 km in 40 minutes. Work out its average speed in km/h.`,
      steps: [
        { md: md`$40$ minutes $= \dfrac{40}{60} = \dfrac{2}{3}$ hour`, why: 'Divide minutes by 60 to get hours.' },
        { md: md`Speed $= 54 \div \dfrac23 = 81$ km/h` },
      ],
      answer: md`$81$ km/h`,
    },
    { kind: 'try', template: 'timeMinutes' },
    { kind: 'try', template: 'density' },
    {
      kind: 'learn', title: 'Average speed over a whole journey',
      md: md`Average speed $= \dfrac{\text{total distance}}{\text{total time}}$.

You **cannot** average the two speeds: 60 km/h for 1 hour then 30 km/h for 2 hours is $150$ km in $3$ hours, so $50$ km/h, not $45$.`,
    },
    { kind: 'practice', title: 'Practice', templates: ['speed', 'timeMinutes', 'density', 'pressure', 'convert', 'averageSpeed'] },
    { kind: 'exam', template: 'mixture' },
    {
      kind: 'recap',
      md: md`- Speed $= \frac{d}{t}$, density $= \frac{m}{V}$, pressure $= \frac{F}{A}$.
- Match the units first (minutes → hours: divide by 60).
- Average speed = total distance ÷ total time.
- km/h → m/s: $\times 1000 \div 3600$.`,
      mistakes: ['Writing 1 h 30 min as 1.3 hours', 'Averaging two speeds', 'Mixing cm³ and m³', 'Multiplying when you should divide'],
    },
  ],
  templates: {
    speed: {
      level: 1, marks: 2, skill: 'Speed, distance and time',
      gen(r) {
        const ask = r.pick(['speed', 'distance', 'time']);
        const v = r.int(3, 18) * 5; const t = r.pick([1.5, 2, 2.5, 3, 4, 0.5]); const d = v * t;
        const q = { speed: md`A car travels ${fmt(d)} km in ${fmt(t)} hours. Work out its average speed.`, distance: md`A car travels at an average speed of ${v} km/h for ${fmt(t)} hours. How far does it travel?`, time: md`A car travels ${fmt(d)} km at an average speed of ${v} km/h. How many hours does the journey take?` }[ask];
        const ans = { speed: v, distance: d, time: t }[ask];
        return {
          q,
          a: { kind: 'number', value: ans },
          show: md`$${fmt(ans)}$ ${{ speed: 'km/h', distance: 'km', time: 'hours' }[ask]}`,
          wrong: [fmt(ask === 'speed' ? d * t : ask === 'distance' ? v / t : v / d)].filter((w) => +w !== ans),
          hints: [{ speed: md`Speed $= \text{distance} \div \text{time}$.`, distance: md`Distance $= \text{speed} \times \text{time}$.`, time: md`Time $= \text{distance} \div \text{speed}$.` }[ask]],
          steps: [{ speed: md`$${fmt(d)} \div ${fmt(t)} = ${v}$ km/h`, distance: md`$${v} \times ${fmt(t)} = ${fmt(d)}$ km`, time: md`$${fmt(d)} \div ${v} = ${fmt(t)}$ hours` }[ask]],
        };
      },
    },
    timeMinutes: {
      level: 2, marks: 2, skill: 'Speed with time in minutes',
      gen(r) {
        const mins = r.pick([12, 15, 20, 24, 36, 40, 45, 48, 75, 90]); const v = r.int(4, 20) * 5;
        const d = (v * mins) / 60; if (!Number.isInteger(d * 10)) return this.gen(r);
        return {
          q: md`A cyclist rides ${fmt(d)} km in ${mins} minutes. Work out the average speed in km/h.`,
          a: { kind: 'number', value: v },
          show: md`$${v}$ km/h`,
          wrong: [fmt(d / mins), fmt(d / (mins / 100))].filter((w) => +w !== v),
          hints: [md`Change ${mins} minutes into hours first: $${mins} \div 60 = ${fmt(mins / 60, 4)}$.`],
          steps: [md`$${mins}$ min $= ${fmt(mins / 60, 4)}$ h`, md`$${fmt(d)} \div ${fmt(mins / 60, 4)} = ${v}$ km/h`],
        };
      },
    },
    density: {
      level: 2, marks: 2, skill: 'Density, mass and volume',
      gen(r) {
        const ask = r.pick(['density', 'mass', 'volume']);
        const rho = r.pick([0.8, 1.2, 2.5, 2.7, 7.8, 8.9, 11.3, 19.3]); const V = r.int(4, 60) * 5; const m = +(rho * V).toFixed(6);
        const q = { density: md`A metal block has mass ${fmt(m)} g and volume ${V} cm³. Work out its density.`, mass: md`A metal has density ${rho} g/cm³. Work out the mass of ${V} cm³ of the metal.`, volume: md`A metal has density ${rho} g/cm³. A piece has mass ${fmt(m)} g. Work out its volume.` }[ask];
        const ans = { density: rho, mass: m, volume: V }[ask];
        return {
          q,
          a: { kind: 'number', value: ans },
          show: md`$${fmt(ans)}$ ${{ density: 'g/cm³', mass: 'g', volume: 'cm³' }[ask]}`,
          wrong: [fmt(ask === 'density' ? V / m : ask === 'mass' ? V / rho : m * rho)].filter((w) => Math.abs(+w - ans) > 1e-9),
          hints: [{ density: md`Density $= \text{mass} \div \text{volume}$.`, mass: md`Mass $= \text{density} \times \text{volume}$.`, volume: md`Volume $= \text{mass} \div \text{density}$.` }[ask]],
          steps: [{ density: md`$${fmt(m)} \div ${V} = ${rho}$ g/cm³`, mass: md`$${rho} \times ${V} = ${fmt(m)}$ g`, volume: md`$${fmt(m)} \div ${rho} = ${V}$ cm³` }[ask]],
        };
      },
    },
    pressure: {
      level: 2, marks: 2, skill: 'Pressure, force and area',
      gen(r) {
        const ask = r.pick(['pressure', 'force']);
        const a = r.pick([0.2, 0.25, 0.4, 0.5, 1.5, 2, 2.5]); const P = r.int(2, 40) * 10; const F = +(P * a).toFixed(6);
        return {
          q: ask === 'pressure' ? md`A force of ${fmt(F)} N acts on an area of ${a} m². Work out the pressure in N/m².` : md`The pressure on an area of ${a} m² is ${P} N/m². Work out the force.`,
          a: { kind: 'number', value: ask === 'pressure' ? P : F },
          show: ask === 'pressure' ? md`$${P}$ N/m²` : md`$${fmt(F)}$ N`,
          wrong: [fmt(ask === 'pressure' ? F * a : P / a)],
          hints: [md`Pressure $= \dfrac{\text{force}}{\text{area}}$.`],
          steps: [ask === 'pressure' ? md`$${fmt(F)} \div ${a} = ${P}$ N/m²` : md`$${P} \times ${a} = ${fmt(F)}$ N`],
        };
      },
    },
    convert: {
      level: 2, marks: 2, skill: 'Converting speeds (km/h and m/s)',
      gen(r) {
        const toMs = r.bool();
        const kmh = r.pick([18, 36, 54, 72, 90, 108, 126, 144]); const ms = kmh / 3.6;
        return {
          q: toMs ? md`Change ${kmh} km/h into m/s.` : md`Change ${fmt(ms)} m/s into km/h.`,
          a: { kind: 'number', value: toMs ? ms : kmh },
          show: toMs ? md`$${fmt(ms)}$ m/s` : md`$${kmh}$ km/h`,
          wrong: [fmt(toMs ? kmh * 3.6 : ms / 3.6), fmt(toMs ? kmh / 60 : ms * 60)].filter((w) => +w !== (toMs ? ms : kmh)),
          hints: [toMs ? md`${kmh} km/h is ${kmh * 1000} m in 3600 seconds.` : md`${fmt(ms)} m/s is ${fmt(ms * 3600)} m in an hour.`],
          steps: toMs ? [md`$${kmh} \times 1000 = ${kmh * 1000}$ m per hour`, md`$${kmh * 1000} \div 3600 = ${fmt(ms)}$ m/s`] : [md`$${fmt(ms)} \times 3600 = ${fmt(ms * 3600)}$ m per hour`, md`$${fmt(ms * 3600)} \div 1000 = ${kmh}$ km/h`],
        };
      },
    },
    averageSpeed: {
      level: 3, marks: 3, skill: 'Average speed over two parts of a journey',
      gen(r) {
        const v1 = r.int(4, 14) * 5; const t1 = r.pick([0.5, 1, 1.5, 2]); const v2 = r.int(4, 14) * 5; const t2 = r.pick([0.5, 1, 1.5, 2, 2.5]);
        if (v1 === v2) return this.gen(r);
        const D = v1 * t1 + v2 * t2; const T = t1 + t2; const ans = D / T; const exact = Number.isInteger(ans * 10);
        return {
          q: md`Sam drives for ${fmt(t1)} hours at ${v1} km/h, then for ${fmt(t2)} hours at ${v2} km/h. Work out the average speed for the whole journey.${exact ? '' : ' Give your answer to 1 decimal place.'}`,
          a: { kind: 'number', value: ans, ...(exact ? {} : { dp: 1 }) },
          show: md`$${exact ? fmt(ans) : dp(ans, 1)}$ km/h`,
          wrong: [fmt((v1 + v2) / 2)].filter((w) => Math.abs(+w - ans) >= 0.05),
          hints: [md`Total distance: $${v1} \times ${fmt(t1)} + ${v2} \times ${fmt(t2)}$.`, md`Divide by the total time, $${fmt(T)}$ hours. Do not average the speeds.`],
          steps: [md`Distance $= ${fmt(v1 * t1)} + ${fmt(v2 * t2)} = ${fmt(D)}$ km **[M1]**`, md`Time $= ${fmt(T)}$ h **[M1]**`, md`$${fmt(D)} \div ${fmt(T)} = ${exact ? fmt(ans) : `${fmt(ans, 4)}\\dots`}$ km/h **[A1]**`],
        };
      },
    },
    mixture: {
      level: 3, marks: 4, skill: 'Density of a mixture (grade 6–7)',
      gen(r) {
        const r1 = r.pick([0.8, 1.2, 2.5, 7.8, 8.9]); const r2 = r.pick([1.5, 2.7, 10.5, 11.3, 19.3]); if (r1 === r2) return this.gen(r);
        const m1 = r.int(2, 12) * 50; const m2 = r.int(2, 12) * 50;
        const V = m1 / r1 + m2 / r2; const ans = (m1 + m2) / V;
        return {
          q: md`An alloy is made from ${m1} g of metal A and ${m2} g of metal B.

Metal A has density ${r1} g/cm³ and metal B has density ${r2} g/cm³.

Work out the density of the alloy. Give your answer to 3 significant figures.`,
          a: { kind: 'number', value: ans, sf: 3 },
          show: md`$${s3(ans)}$ g/cm³`,
          wrong: [s3((r1 + r2) / 2)].filter((w) => w !== s3(ans)),
          hints: [md`Find the volume of each metal: volume $=$ mass $\div$ density.`, md`Density of the alloy $=$ total mass $\div$ total volume.`],
          steps: [md`Volume of A $= ${m1} \div ${r1} = ${fmt(m1 / r1, 4)}$ cm³ **[M1]**`, md`Volume of B $= ${m2} \div ${r2} = ${fmt(m2 / r2, 4)}$ cm³ **[M1]**`, md`Total mass $${m1 + m2}$ g, total volume $${fmt(V, 4)}$ cm³ **[M1]**`, md`$${m1 + m2} \div ${fmt(V, 4)} = ${s3(ans)}$ g/cm³ **[A1]**`],
        };
      },
    },
  },
};
