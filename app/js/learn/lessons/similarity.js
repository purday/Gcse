import { sf, fmt } from '../engine.js';
import { triangle } from '../diagrams.js';

const md = String.raw;
const s3 = (x) => sf(x, 3);

// Triangle ABC with DE parallel to BC; D on AB, E on AC, drawn to the question's proportions.
function nestedDiagram(AD, DB, DE) {
  const A = [2, 6]; const B = [0, 0]; const C = [7, 0]; const f = AD / (AD + DB);
  const D = [A[0] + f * (B[0] - A[0]), A[1] + f * (B[1] - A[1])];
  const E = [A[0] + f * (C[0] - A[0]), A[1] + f * (C[1] - A[1])];
  return triangle({
    pts: [A, B, C], names: ['A', 'B', 'C'],
    segments: [
      { a: D, b: E, na: 'D', nb: 'E', label: `${DE} cm` },
      { a: A, b: D, label: `${AD} cm`, draw: false },
      { a: D, b: B, label: `${DB} cm`, draw: false },
    ],
  });
}

export default {
  id: 'similarity',
  title: 'Similar shapes: lengths, areas and volumes',
  subtitle: 'Scale factors k, k² and k³; similar triangles',
  topics: ['G19', 'R12', 'G7'],
  band: '7',
  calc: 'both',
  minutes: 35,
  why: 'Similarity is a 3–5 mark grade 7–8 question on most series; the area and volume version is one of the most commonly dropped topics.',
  steps: [
    {
      kind: 'learn', title: 'Length scale factor',
      md: md`Two shapes are **similar** if one is an enlargement of the other: same angles, sides in the same ratio.

$$k = \frac{\text{length on the new shape}}{\text{matching length on the old shape}}$$

Find $k$ from a **matching pair** of sides, then multiply (or divide) the other lengths by $k$.`,
    },
    { kind: 'try', template: 'missingSide' },
    {
      kind: 'learn', title: 'Areas and volumes',
      md: md`If lengths are multiplied by $k$:

| | scale factor |
|---|---|
| lengths | $k$ |
| areas | $k^2$ |
| volumes | $k^3$ |

Two similar jugs with heights 10 cm and 15 cm: $k = 1.5$, so the bigger one holds $1.5^3 = 3.375$ times as much.`,
      key: 'Going from area to volume: find k first (square root of the area factor), then cube it.',
    },
    {
      kind: 'example', title: 'From area to volume',
      q: md`Two similar solids have surface areas 50 cm² and 72 cm². The smaller has volume 250 cm³. Find the volume of the larger.`,
      steps: [
        { md: md`Area factor $= \dfrac{72}{50} = 1.44$` },
        { md: md`Length factor $k = \sqrt{1.44} = 1.2$` },
        { md: md`Volume factor $= 1.2^3 = 1.728$` },
        { md: md`$250 \times 1.728 = 432$ cm³` },
      ],
      answer: md`$432$ cm³`,
    },
    { kind: 'try', template: 'areaFromLength' },
    { kind: 'practice', title: 'Practice', templates: ['missingSide', 'areaFromLength', 'volumeFromLength', 'lengthFromVolume', 'areaToVolume'] },
    { kind: 'exam', template: 'nested' },
    {
      kind: 'recap',
      md: md`- $k$ = new length ÷ matching old length.
- Areas × $k^2$, volumes × $k^3$.
- From areas or volumes back to lengths: square root or cube root first.`,
      mistakes: ['Multiplying an area by k instead of k²', 'Using non-matching sides to find k', 'Forgetting to find k before cubing'],
    },
  ],
  templates: {
    missingSide: {
      level: 1, marks: 2, skill: 'Missing length in similar shapes',
      gen(r) {
        const k = r.pick([1.5, 2, 2.5, 3, 0.5, 1.2]); const a = r.int(2, 9) * 2; const b = r.int(3, 12);
        if (a === b) return this.gen(r);
        return {
          q: md`Rectangles $P$ and $Q$ are similar. $P$ is ${a} cm by ${b} cm. The side of $Q$ matching the ${a} cm side is ${fmt(a * k)} cm.

Work out the other side of $Q$.`,
          a: { kind: 'number', value: b * k },
          show: md`$${fmt(b * k)}$ cm`,
          hints: [md`$k = \dfrac{${fmt(a * k)}}{${a}} = ${k}$.`],
          steps: [md`$k = ${fmt(a * k)} \div ${a} = ${k}$`, md`$${b} \times ${k} = ${fmt(b * k)}$ cm`],
        };
      },
    },
    areaFromLength: {
      level: 2, marks: 2, skill: 'Area of a similar shape',
      gen(r) {
        const l1 = r.int(2, 8); const l2 = l1 * r.pick([2, 3, 1.5, 2.5]); const A1 = r.int(5, 40);
        const k = l2 / l1;
        return {
          q: md`Two similar triangles have corresponding sides ${l1} cm and ${fmt(l2)} cm. The smaller triangle has area ${A1} cm².

Work out the area of the larger triangle.`,
          a: { kind: 'number', value: A1 * k * k },
          show: md`$${fmt(A1 * k * k)}$ cm²`,
          wrong: [fmt(A1 * k)],
          hints: [md`$k = ${fmt(k)}$, so areas are multiplied by $k^2 = ${fmt(k * k)}$.`],
          steps: [md`$k = ${fmt(l2)} \div ${l1} = ${fmt(k)}$`, md`Area factor $k^2 = ${fmt(k * k)}$`, md`$${A1} \times ${fmt(k * k)} = ${fmt(A1 * k * k)}$ cm²`],
        };
      },
    },
    volumeFromLength: {
      level: 2, marks: 2, skill: 'Volume of a similar solid',
      gen(r) {
        const h1 = r.int(4, 12); const k = r.pick([2, 3, 1.5, 0.5]); const V1 = r.int(20, 300);
        return {
          q: md`Two similar bottles have heights ${h1} cm and ${fmt(h1 * k)} cm. The ${k > 1 ? 'smaller' : 'larger'} bottle holds ${V1} ml.

How much does the other bottle hold?`,
          a: { kind: 'number', value: V1 * k ** 3 },
          show: md`$${fmt(V1 * k ** 3)}$ ml`,
          wrong: [fmt(V1 * k), fmt(V1 * k * k)].filter((w) => w !== fmt(V1 * k ** 3)),
          hints: [md`$k = ${fmt(k)}$; volumes multiply by $k^3$.`],
          steps: [md`$k = ${fmt(h1 * k)} \div ${h1} = ${fmt(k)}$`, md`$k^3 = ${fmt(k ** 3)}$`, md`$${V1} \times ${fmt(k ** 3)} = ${fmt(V1 * k ** 3)}$ ml`],
        };
      },
    },
    lengthFromVolume: {
      level: 3, marks: 3, skill: 'Length from a volume ratio',
      gen(r) {
        const k = r.pick([2, 3, 4, 1.5]); const V1 = r.int(4, 30) * 2; const h1 = r.int(3, 10);
        return {
          q: md`Two similar cones have volumes ${V1} cm³ and ${fmt(V1 * k ** 3)} cm³. The smaller cone is ${h1} cm tall.

Work out the height of the larger cone.`,
          a: { kind: 'number', value: h1 * k },
          show: md`$${fmt(h1 * k)}$ cm`,
          wrong: [fmt(h1 * k ** 3)],
          hints: [md`Volume factor $= ${fmt(k ** 3)}$. The length factor is its **cube root**.`],
          steps: [md`Volume factor $= ${fmt(V1 * k ** 3)} \div ${V1} = ${fmt(k ** 3)}$`, md`$k = \sqrt[3]{${fmt(k ** 3)}} = ${fmt(k)}$`, md`$${h1} \times ${fmt(k)} = ${fmt(h1 * k)}$ cm`],
        };
      },
    },
    areaToVolume: {
      level: 3, marks: 3, skill: 'From an area ratio to a volume',
      gen(r) {
        const k = r.pick([1.2, 1.5, 2, 2.5, 3]); const S1 = r.int(5, 40) * 2; const V1 = r.int(10, 200);
        return {
          q: md`Two similar solids have surface areas ${S1} cm² and ${fmt(S1 * k * k)} cm². The smaller solid has volume ${V1} cm³.

Work out the volume of the larger solid.`,
          a: { kind: 'number', value: V1 * k ** 3, tol: 1e-6 },
          show: md`$${fmt(V1 * k ** 3)}$ cm³`,
          wrong: [fmt(V1 * k * k)],
          hints: [md`Area factor $= ${fmt(k * k)}$, so the length factor is $\sqrt{${fmt(k * k)}} = ${k}$.`, md`Volume factor $= ${k}^3$.`],
          steps: [md`Area factor $${fmt(k * k)}$`, md`$k = ${k}$`, md`$${V1} \times ${k}^3 = ${fmt(V1 * k ** 3)}$ cm³`],
        };
      },
    },
    nested: {
      level: 3, marks: 3, skill: 'Similar triangles with parallel lines',
      gen(r) {
        const AD = r.int(3, 9); const DB = r.int(2, 8); const DE = r.int(3, 10);
        const k = (AD + DB) / AD; const BC = DE * k;
        return {
          q: md`In triangle $ABC$, $D$ is on $AB$ and $E$ is on $AC$, with $DE$ parallel to $BC$.

$AD = ${AD}$ cm, $DB = ${DB}$ cm and $DE = ${DE}$ cm. Work out the length of $BC$. Give your answer to 3 significant figures if it is not exact.`,
          diagram: nestedDiagram(AD, DB, DE),
          a: { kind: 'number', value: BC, sf: Number.isInteger(BC) ? undefined : 3 },
          typed: Number.isInteger(BC) ? String(BC) : s3(BC),
          show: md`$${Number.isInteger(BC) ? BC : s3(BC)}$ cm`,
          wrong: [fmt((DE * DB) / AD)],
          hints: [md`Triangles $ADE$ and $ABC$ are similar. $AB = ${AD + DB}$ cm.`, md`$k = \dfrac{AB}{AD} = \dfrac{${AD + DB}}{${AD}}$.`],
          steps: [md`$AB = ${AD} + ${DB} = ${AD + DB}$ **[M1]**`, md`$k = \dfrac{${AD + DB}}{${AD}}$ **[M1]**`, md`$BC = ${DE} \times \dfrac{${AD + DB}}{${AD}} = ${Number.isInteger(BC) ? BC : `${fmt(BC, 4)}\\dots`}$ **[A1]**`],
        };
      },
    },
  },
};
