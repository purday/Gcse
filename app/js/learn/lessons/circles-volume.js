import { sf, fmt, simplify } from '../engine.js';
import { sector, solid } from '../diagrams.js';

const md = String.raw;
const s3 = (x) => sf(x, 3);
const piTex = (k) => { const [n, d] = simplify(Math.round(k * 12), 12); return d === 1 ? `${n === 1 ? '' : n}\\pi` : `\\frac{${n}\\pi}{${d}}`; };

export default {
  id: 'circles-volume',
  title: 'Circles, sectors and volumes',
  subtitle: 'Arc length, sector area, cylinders, cones, spheres',
  topics: ['G17', 'G18', 'G16'],
  band: '6',
  calc: 'both',
  minutes: 40,
  why: 'Circle and volume questions appear on all three papers: arcs and sectors (3 marks), volumes of cylinders, cones and spheres, often "in terms of π" on Paper 1.',
  steps: [
    {
      kind: 'learn', title: 'Circles',
      md: md`$$\text{Circumference} = \pi d = 2\pi r \qquad \text{Area} = \pi r^2$$

Watch whether you are given the **radius** or the **diameter**.

**In terms of π** means leave π in: area of a circle radius 6 is $36\pi$ cm², not 113.1.`,
    },
    {
      kind: 'learn', title: 'Arcs and sectors',
      md: md`A sector is a fraction $\dfrac{\theta}{360}$ of the whole circle:

$$\text{Arc length} = \frac{\theta}{360} \times 2\pi r \qquad \text{Sector area} = \frac{\theta}{360} \times \pi r^2$$

The **perimeter** of a sector is the arc **plus two radii**.`,
      diagram: sector({ angle: 72, label: '72°', radiusLabel: '10 cm' }),
    },
    { kind: 'try', template: 'arc' },
    { kind: 'try', template: 'sectorArea' },
    {
      kind: 'learn', title: 'Volumes',
      md: md`| Solid | Volume |
|---|---|
| Prism / cylinder | area of cross-section × length; cylinder $\pi r^2 h$ |
| Cone | $\frac13\pi r^2 h$ |
| Sphere | $\frac43\pi r^3$ |
| Pyramid | $\frac13 \times$ base area × height |

AQA **gives** the cone and sphere formulas in the question when you need them. You must **know** the cylinder and prism.`,
    },
    {
      kind: 'example', title: 'Composite solid',
      q: md`A solid is a cylinder of radius 3 cm and height 10 cm with a hemisphere on top. Work out its volume in terms of $\pi$. (Volume of a sphere $= \frac43\pi r^3$.)`,
      steps: [
        { md: md`Cylinder: $\pi \times 3^2 \times 10 = 90\pi$` },
        { md: md`Hemisphere: half a sphere, $\frac12 \times \frac43\pi \times 3^3 = 18\pi$` },
        { md: md`Total $= 108\pi$ cm³` },
      ],
      answer: md`$108\pi$ cm³`,
    },
    { kind: 'practice', title: 'Practice', templates: ['circlePi', 'arc', 'sectorArea', 'sectorPerimeter', 'cylinder', 'cone', 'sphere'] },
    { kind: 'exam', template: 'radiusFromVolume' },
    {
      kind: 'recap',
      md: md`- $C = 2\pi r$, $A = \pi r^2$. Radius or diameter?
- Sector: fraction $\frac{\theta}{360}$ of the circle; perimeter adds two radii.
- Cylinder $\pi r^2 h$. Cone and sphere formulas are given.
- "In terms of π": keep π in the answer.`,
      mistakes: ['Using the diameter as the radius', 'Forgetting the two radii in a sector perimeter', 'Typing πr² as (πr)²', 'Rounding when the question says "in terms of π"'],
    },
  ],
  templates: {
    circlePi: {
      level: 1, marks: 2, skill: 'Circle area or circumference in terms of π',
      gen(r) {
        const useD = r.bool(); const x = r.int(2, 14) * (useD ? 2 : 1); const rad = useD ? x / 2 : x; const area = r.bool();
        const k = area ? rad * rad : 2 * rad;
        return {
          q: md`A circle has ${useD ? 'diameter' : 'radius'} ${x} cm. Work out its ${area ? 'area' : 'circumference'}. Give your answer in terms of $\pi$.`,
          a: { kind: 'pi', k },
          show: md`$${k}\pi$ ${area ? 'cm²' : 'cm'}`,
          hints: [useD ? md`The radius is half the diameter: $${rad}$ cm.` : md`Radius $= ${rad}$ cm.`, area ? md`Area $= \pi r^2 = \pi \times ${rad}^2$.` : md`Circumference $= 2\pi r$.`],
          steps: [md`$r = ${rad}$`, area ? md`$\pi \times ${rad}^2 = ${k}\pi$ cm²` : md`$2 \times \pi \times ${rad} = ${k}\pi$ cm`],
        };
      },
    },
    arc: {
      level: 2, marks: 2, skill: 'Arc length of a sector',
      gen(r) {
        const ang = r.pick([30, 40, 45, 60, 72, 80, 100, 120, 135, 150, 210, 240, 300]); const rad = r.int(3, 15);
        const L = (ang / 360) * 2 * Math.PI * rad;
        return {
          q: md`A sector of a circle has radius ${rad} cm and angle ${ang}°. Work out the arc length. Give your answer to 3 significant figures.`,
          diagram: sector({ angle: ang, label: `${ang}°`, radiusLabel: `${rad} cm` }),
          a: { kind: 'number', value: L, sf: 3 },
          show: md`$${s3(L)}$ cm`,
          hints: [md`Arc $= \dfrac{${ang}}{360} \times 2\pi \times ${rad}$.`],
          steps: [md`$\dfrac{${ang}}{360} \times 2 \times \pi \times ${rad} = ${fmt(L, 4)}\dots$`, md`$${s3(L)}$ cm`],
        };
      },
    },
    sectorArea: {
      level: 2, marks: 2, skill: 'Area of a sector',
      gen(r) {
        const ang = r.pick([30, 40, 45, 60, 72, 80, 100, 120, 135, 150, 210, 240, 300]); const rad = r.int(3, 15);
        const A = (ang / 360) * Math.PI * rad * rad;
        return {
          q: md`A sector has radius ${rad} cm and angle ${ang}°. Work out its area. Give your answer to 3 significant figures.`,
          diagram: sector({ angle: ang, label: `${ang}°`, radiusLabel: `${rad} cm` }),
          a: { kind: 'number', value: A, sf: 3 },
          show: md`$${s3(A)}$ cm²`,
          hints: [md`Area $= \dfrac{${ang}}{360} \times \pi \times ${rad}^2$.`],
          steps: [md`$\dfrac{${ang}}{360} \times \pi \times ${rad}^2 = ${fmt(A, 4)}\dots$`, md`$${s3(A)}$ cm²`],
        };
      },
    },
    sectorPerimeter: {
      level: 3, marks: 3, skill: 'Perimeter of a sector',
      gen(r) {
        const ang = r.pick([40, 60, 72, 90, 120, 150]); const rad = r.int(4, 12);
        const L = (ang / 360) * 2 * Math.PI * rad; const P = L + 2 * rad;
        return {
          q: md`A sector has radius ${rad} cm and angle ${ang}°. Work out its perimeter. Give your answer to 3 significant figures.`,
          diagram: sector({ angle: ang, label: `${ang}°`, radiusLabel: `${rad} cm` }),
          a: { kind: 'number', value: P, sf: 3 },
          show: md`$${s3(P)}$ cm`,
          wrong: [s3(L)],
          hints: [md`Perimeter = arc length + two radii.`],
          steps: [md`Arc $= \dfrac{${ang}}{360} \times 2\pi \times ${rad} = ${fmt(L, 4)}\dots$`, md`$+ 2 \times ${rad} = ${fmt(P, 4)}\dots$`, md`$${s3(P)}$ cm`],
        };
      },
    },
    cylinder: {
      level: 1, marks: 2, skill: 'Volume of a cylinder',
      gen(r) {
        const rad = r.int(2, 10); const h = r.int(3, 20); const exact = r.bool();
        const V = Math.PI * rad * rad * h;
        return {
          q: md`A cylinder has radius ${rad} cm and height ${h} cm. Work out its volume. ${exact ? 'Give your answer in terms of $\\pi$.' : 'Give your answer to 3 significant figures.'}`,
          diagram: solid({ kind: 'cylinder', rLabel: `${rad} cm`, hLabel: `${h} cm` }),
          a: exact ? { kind: 'pi', k: rad * rad * h } : { kind: 'number', value: V, sf: 3 },
          show: exact ? md`$${rad * rad * h}\pi$ cm³` : md`$${s3(V)}$ cm³`,
          hints: [md`$V = \pi r^2 h = \pi \times ${rad}^2 \times ${h}$.`],
          steps: [md`$\pi \times ${rad * rad} \times ${h} = ${rad * rad * h}\pi${exact ? '' : ` = ${fmt(V, 3)}\\dots`}$`, exact ? md`$${rad * rad * h}\pi$ cm³` : md`$${s3(V)}$ cm³`],
        };
      },
    },
    cone: {
      level: 2, marks: 2, skill: 'Volume of a cone',
      gen(r) {
        const rad = r.int(2, 9); const h = r.int(3, 18);
        const k = (rad * rad * h) / 3;
        return {
          q: md`A cone has base radius ${rad} cm and perpendicular height ${h} cm. Work out its volume in terms of $\pi$.

(Volume of a cone $= \frac13\pi r^2 h$)`,
          diagram: solid({ kind: 'cone', rLabel: `${rad} cm`, hLabel: `${h} cm` }),
          a: { kind: 'pi', k },
          show: md`$${piTex(k)}$ cm³`,
          hints: [md`$\frac13 \times \pi \times ${rad}^2 \times ${h}$`],
          steps: [md`$\frac13 \times \pi \times ${rad * rad} \times ${h} = ${piTex(k)}$`],
        };
      },
    },
    sphere: {
      level: 2, marks: 2, skill: 'Volume of a sphere or hemisphere',
      gen(r) {
        const rad = r.int(2, 9); const hemi = r.bool();
        const V = ((hemi ? 2 : 4) / 3) * Math.PI * rad ** 3;
        return {
          q: md`A ${hemi ? 'hemisphere' : 'sphere'} has radius ${rad} cm. Work out its volume. Give your answer to 3 significant figures.

(Volume of a sphere $= \frac43\pi r^3$)`,
          diagram: solid({ kind: hemi ? 'hemisphere' : 'sphere', rLabel: `${rad} cm` }),
          a: { kind: 'number', value: V, sf: 3 },
          show: md`$${s3(V)}$ cm³`,
          wrong: hemi ? [s3(V * 2)] : [],
          hints: [hemi ? md`A hemisphere is half a sphere: $\frac12 \times \frac43\pi r^3$.` : md`$\frac43 \times \pi \times ${rad}^3$`],
          steps: [md`$${hemi ? '\\frac12 \\times ' : ''}\frac43 \times \pi \times ${rad}^3 = ${fmt(V, 4)}\dots$`, md`$${s3(V)}$ cm³`],
        };
      },
    },
    radiusFromVolume: {
      level: 3, marks: 4, skill: 'Working backwards from a volume',
      gen(r) {
        const rad = r.int(3, 12) + r.pick([0, 0.5]); const h = r.int(5, 25);
        const V = Math.round(Math.PI * rad * rad * h);
        const ans = Math.sqrt(V / (Math.PI * h));
        return {
          q: md`A cylinder has height ${h} cm and volume ${V} cm³.

Work out the radius of the cylinder. Give your answer to 3 significant figures.`,
          a: { kind: 'number', value: ans, sf: 3 },
          show: md`$${s3(ans)}$ cm`,
          hints: [md`$${V} = \pi r^2 \times ${h}$. Divide by $${h}\pi$ first.`, md`$r^2 = \dfrac{${V}}{${h}\pi}$, then square root.`],
          steps: [md`$\pi r^2 \times ${h} = ${V}$ **[M1]**`, md`$r^2 = \dfrac{${V}}{${h}\pi} = ${fmt(ans * ans, 4)}\dots$ **[M1]**`, md`$r = ${ans.toFixed(4)}\dots$ **[M1]**`, md`$${s3(ans)}$ cm **[A1]**`],
        };
      },
    },
  },
};
