import { sf, fmt } from '../engine.js';
import { triangle } from '../diagrams.js';

const md = String.raw;
const R = Math.PI / 180;
const s3 = (x) => sf(x, 3);

// Triangle ABC from its sides: a = BC, b = CA, c = AB.
function fromSides(a, b, c, labels) {
  const ax = (a * a + c * c - b * b) / (2 * a);
  const ay = Math.sqrt(Math.max(0, c * c - ax * ax));
  return triangle({ pts: [[ax, ay], [0, 0], [a, 0]], ...labels });
}

export default {
  id: 'sine-cosine',
  title: 'Sine rule, cosine rule and area of a triangle',
  subtitle: 'Non-right-angled triangles: sides, angles, ½ab sin C',
  topics: ['G22', 'G23'],
  band: '7',
  calc: 'calc',
  minutes: 45,
  why: 'Sine and cosine rule questions are worth 3–5 marks on most calculator papers and are one of the most common grade 7 topics.',
  steps: [
    {
      kind: 'learn', title: 'Labelling',
      md: md`Capital letters for **angles** $A, B, C$. Lower case for **sides**: side $a$ is **opposite** angle $A$, and so on.

$$\text{Cosine rule: } a^2 = b^2 + c^2 - 2bc\cos A$$
$$\text{Sine rule: } \frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}$$
$$\text{Area} = \tfrac{1}{2}ab\sin C$$`,
      key: 'Which rule? Cosine rule: two sides and the angle between them (find the third side), or all three sides (find an angle). Sine rule: you know a side AND its opposite angle.',
    },
    {
      kind: 'example', title: 'Cosine rule: a missing side',
      q: md`In triangle $ABC$, $AB = 7$ cm, $BC = 8$ cm and angle $ABC = 78°$. Work out $AC$.`,
      steps: [
        { md: md`Two sides and the angle **between** them, so cosine rule.` },
        { md: md`$AC^2 = 7^2 + 8^2 - 2 \times 7 \times 8 \times \cos 78°$` },
        { md: md`$= 49 + 64 - 23.286\dots = 89.713\dots$` },
        { md: md`$AC = \sqrt{89.713\dots} = 9.47$ cm (3 s.f.)` },
      ],
      answer: md`$9.47$ cm`,
    },
    { kind: 'try', template: 'cosSide' },
    {
      kind: 'example', title: 'Cosine rule: an angle from three sides',
      q: md`A triangle has sides 5 cm, 7 cm and 9 cm. Find the largest angle.`,
      steps: [
        { md: md`The largest angle is opposite the largest side (9).` },
        { md: md`Rearranged: $\cos A = \dfrac{b^2 + c^2 - a^2}{2bc} = \dfrac{25 + 49 - 81}{2 \times 5 \times 7} = \dfrac{-7}{70}$`, why: 'a is the side opposite the angle you want.' },
        { md: md`$A = \cos^{-1}(-0.1) = 95.7°$` },
      ],
      answer: md`$95.7°$`,
    },
    { kind: 'try', template: 'cosAngle' },
    {
      kind: 'example', title: 'Sine rule',
      q: md`In triangle $PQR$, $PQ = 10$ cm, angle $R = 40°$ and angle $P = 65°$. Find $QR$.`,
      steps: [
        { md: md`$QR$ is opposite angle $P$; $PQ$ is opposite angle $R$. A side–angle pair is known, so sine rule.` },
        { md: md`$\dfrac{QR}{\sin 65°} = \dfrac{10}{\sin 40°}$` },
        { md: md`$QR = \dfrac{10 \sin 65°}{\sin 40°} = 14.1$ cm (3 s.f.)` },
      ],
      answer: md`$14.1$ cm`,
    },
    { kind: 'try', template: 'sinSide' },
    {
      kind: 'learn', title: 'Area of any triangle',
      md: md`$$\text{Area} = \tfrac{1}{2}ab\sin C$$

$a$ and $b$ are two sides and $C$ is the angle **between** them. Sides 9 and 11 with 50° between: $\frac12 \times 9 \times 11 \times \sin 50° = 37.9$ cm².`,
    },
    { kind: 'practice', title: 'Practice', templates: ['cosSide', 'cosAngle', 'sinSide', 'sinAngle', 'area'] },
    { kind: 'exam', template: 'twoStep' },
    {
      kind: 'recap',
      md: md`- Side $a$ is opposite angle $A$.
- Cosine rule for SAS (side) and SSS (angle). Sine rule when you have an opposite pair.
- Area $= \frac12 ab\sin C$ with $C$ between $a$ and $b$.
- Keep full values on the calculator; round at the end.`,
      mistakes: ['Using the cosine rule with an angle that is not between the two sides', 'Typing 49 + 64 − 2×7×8 then × cos 78 (do the whole 2bc cos A first)', 'Rounding the square before the square root'],
    },
  ],
  templates: {
    cosSide: {
      level: 2, marks: 3, skill: 'Cosine rule for a missing side',
      gen(r) {
        const c = r.int(4, 15); const a = r.int(4, 15); const B = r.int(25, 130);
        const b = Math.sqrt(a * a + c * c - 2 * a * c * Math.cos(B * R));
        return {
          q: md`In triangle $ABC$, $AB = ${c}$ cm, $BC = ${a}$ cm and angle $ABC = ${B}°$.

Work out the length of $AC$. Give your answer to 3 significant figures.`,
          diagram: fromSides(a, b, c, { sides: { AB: `${c} cm`, BC: `${a} cm` }, angles: { B: `${B}°` } }),
          a: { kind: 'number', value: b, sf: 3 },
          show: md`$${s3(b)}$ cm`,
          hints: [md`Two sides and the angle between them: cosine rule.`, md`$AC^2 = ${c}^2 + ${a}^2 - 2 \times ${c} \times ${a} \times \cos ${B}°$`],
          steps: [md`$AC^2 = ${c}^2 + ${a}^2 - 2 \times ${c} \times ${a} \times \cos ${B}°$`, md`$= ${fmt(b * b, 4)}\dots$`, md`$AC = ${s3(b)}$ cm`],
        };
      },
    },
    cosAngle: {
      level: 3, marks: 3, skill: 'Cosine rule for an angle',
      gen(r) {
        const a = r.int(5, 15); const b = r.int(4, 14); const c = r.int(4, 14);
        if (a >= b + c || b >= a + c || c >= a + b) return this.gen(r);
        const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) / R;
        return {
          q: md`Triangle $ABC$ has $BC = ${a}$ cm, $AC = ${b}$ cm and $AB = ${c}$ cm.

Work out the size of angle $BAC$. Give your answer to 1 decimal place.`,
          diagram: fromSides(a, b, c, { sides: { BC: `${a} cm`, CA: `${b} cm`, AB: `${c} cm` }, angles: { A: '?' } }),
          a: { kind: 'number', value: A, dp: 1 },
          show: md`$${A.toFixed(1)}°$`,
          hints: [md`Angle $A$ is opposite side $a = ${a}$. Use $\cos A = \dfrac{b^2 + c^2 - a^2}{2bc}$.`],
          steps: [md`$\cos A = \dfrac{${b}^2 + ${c}^2 - ${a}^2}{2 \times ${b} \times ${c}} = \dfrac{${b * b + c * c - a * a}}{${2 * b * c}}$`, md`$A = \cos^{-1}(${fmt((b * b + c * c - a * a) / (2 * b * c), 5)}) = ${fmt(A, 3)}\dots°$`, md`$${A.toFixed(1)}°$`],
        };
      },
    },
    sinSide: {
      level: 2, marks: 3, skill: 'Sine rule for a missing side',
      gen(r) {
        const A = r.int(30, 80); const B = r.int(25, 90); const C = 180 - A - B;
        if (C < 20) return this.gen(r);
        const a = r.int(5, 15); const b = (a * Math.sin(B * R)) / Math.sin(A * R); const c = (a * Math.sin(C * R)) / Math.sin(A * R);
        return {
          q: md`In triangle $ABC$, $BC = ${a}$ cm, angle $BAC = ${A}°$ and angle $ABC = ${B}°$.

Work out the length of $AC$. Give your answer to 3 significant figures.`,
          diagram: fromSides(a, b, c, { sides: { BC: `${a} cm`, CA: 'x' }, angles: { A: `${A}°`, B: `${B}°` } }),
          a: { kind: 'number', value: b, sf: 3 },
          show: md`$${s3(b)}$ cm`,
          hints: [md`$BC$ is opposite angle $A$, and $AC$ is opposite angle $B$: a sine rule pair.`, md`$\dfrac{AC}{\sin ${B}°} = \dfrac{${a}}{\sin ${A}°}$`],
          steps: [md`$\dfrac{AC}{\sin ${B}°} = \dfrac{${a}}{\sin ${A}°}$`, md`$AC = \dfrac{${a} \sin ${B}°}{\sin ${A}°} = ${fmt(b, 4)}\dots$`, md`$${s3(b)}$ cm`],
        };
      },
    },
    sinAngle: {
      level: 3, marks: 3, skill: 'Sine rule for a missing angle',
      gen(r) {
        const A = r.int(35, 85); const a = r.int(8, 16); const b = r.int(4, a - 1); // b < a so B is acute and unique
        const B = Math.asin((b * Math.sin(A * R)) / a) / R;
        const C = 180 - A - B; const c = (a * Math.sin(C * R)) / Math.sin(A * R);
        return {
          q: md`In triangle $ABC$, $BC = ${a}$ cm, $AC = ${b}$ cm and angle $BAC = ${A}°$.

Work out the size of angle $ABC$. Give your answer to 1 decimal place.`,
          diagram: fromSides(a, b, c, { sides: { BC: `${a} cm`, CA: `${b} cm` }, angles: { A: `${A}°`, B: '?' } }),
          a: { kind: 'number', value: B, dp: 1 },
          show: md`$${B.toFixed(1)}°$`,
          hints: [md`$\dfrac{\sin B}{${b}} = \dfrac{\sin ${A}°}{${a}}$`],
          steps: [md`$\sin B = \dfrac{${b} \sin ${A}°}{${a}} = ${fmt((b * Math.sin(A * R)) / a, 5)}$`, md`$B = \sin^{-1}(${fmt((b * Math.sin(A * R)) / a, 5)}) = ${fmt(B, 3)}\dots°$`, md`$${B.toFixed(1)}°$`],
        };
      },
    },
    area: {
      level: 2, marks: 2, skill: 'Area of a triangle using ½ab sin C',
      gen(r) {
        const a = r.int(4, 15); const b = r.int(4, 15); const C = r.int(25, 140);
        const area = 0.5 * a * b * Math.sin(C * R);
        const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * R));
        return {
          q: md`Work out the area of the triangle. Give your answer to 3 significant figures.`,
          diagram: fromSides(a, c, b, { names: ['P', 'Q', 'R'], sides: { PQ: `${b} cm`, QR: `${a} cm` }, angles: { Q: `${C}°` } }),
          a: { kind: 'number', value: area, sf: 3 },
          show: md`$${s3(area)}$ cm²`,
          wrong: [s3(0.5 * a * b)].filter((w) => w !== s3(area)),
          hints: [md`Area $= \tfrac12 ab\sin C$ with the two sides and the angle between them.`],
          steps: [md`$\tfrac12 \times ${a} \times ${b} \times \sin ${C}° = ${fmt(area, 4)}\dots$`, md`$${s3(area)}$ cm²`],
        };
      },
    },
    twoStep: {
      level: 3, marks: 5, skill: 'Multi-step non-right-angled triangle problem',
      gen(r) {
        const c = r.int(5, 12); const a = r.int(6, 14); const B = r.int(40, 110);
        const b = Math.sqrt(a * a + c * c - 2 * a * c * Math.cos(B * R));
        const A = Math.asin((a * Math.sin(B * R)) / b) / R;
        const Afull = (a * a > b * b + c * c) ? 180 - A : A; // obtuse check
        return {
          q: md`In triangle $ABC$, $AB = ${c}$ cm, $BC = ${a}$ cm and angle $ABC = ${B}°$.

Work out the size of angle $BAC$. Give your answer to 1 decimal place.`,
          diagram: fromSides(a, b, c, { sides: { AB: `${c} cm`, BC: `${a} cm` }, angles: { B: `${B}°`, A: '?' } }),
          a: { kind: 'number', value: Afull, dp: 1 },
          show: md`$${Afull.toFixed(1)}°$`,
          hints: [md`First find $AC$ with the cosine rule.`, md`Then use the sine rule (or the cosine rule again) for angle $A$.`],
          steps: [
            md`$AC^2 = ${c}^2 + ${a}^2 - 2 \times ${c} \times ${a} \times \cos ${B}°$ **[M1]**`,
            md`$AC = ${fmt(b, 5)}\dots$ **[A1]**`,
            md`$\dfrac{\sin A}{${a}} = \dfrac{\sin ${B}°}{${fmt(b, 4)}}$ **[M1]**`,
            md`$A = ${fmt(Afull, 4)}\dots°$ **[M1]**, so $${Afull.toFixed(1)}°$ **[A1]**`,
          ],
          verify: () => Math.abs(Math.acos((b * b + c * c - a * a) / (2 * b * c)) / R - Afull) < 1e-6 || 'angle mismatch',
        };
      },
    },
  },
};
