import { fmt } from '../engine.js';
import { triangle, shapesFig } from '../diagrams.js';

const md = String.raw;
const NAMES = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };

// Regular n-gon on edge P(0,0)→Q(1,0): above the edge when up is true, below otherwise.
function regular(n, up) {
  const pts = [[0, 0]]; let dir = 0; const turn = ((up ? 1 : -1) * 2 * Math.PI) / n;
  for (let k = 0; k < n - 1; k++) { const [x, y] = pts.at(-1); pts.push([x + Math.cos(dir), y + Math.sin(dir)]); dir += turn; }
  return pts;
}

// Two parallel lines cut by a transversal (sloping down to the left), with angle a marked at the top crossing and x at another position.
function parallelFig(a, where) {
  const W = 300; const H = 200; const y1 = 60; const y2 = 140;
  const slope = 1 / Math.tan((a * Math.PI) / 180); // x-shift per unit of y going down the transversal
  // Centre the two crossings so both sit well inside the parallel lines.
  const xTop = 150 + ((y2 - y1) / 2) * slope; const xBot = 150 - ((y2 - y1) / 2) * slope;
  const ext = 40; const dx = ext * slope;
  const P = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><rect width="${W}" height="${H}" fill="#fff"/>`;
  s += `<line x1="20" y1="${y1}" x2="280" y2="${y1}" stroke="#000" stroke-width="2"/><line x1="20" y1="${y2}" x2="280" y2="${y2}" stroke="#000" stroke-width="2"/>`;
  s += `<polyline points="${P(xTop + dx, y1 - ext)} ${P(xBot - dx, y2 + ext)}" fill="none" stroke="#000" stroke-width="2"/>`;
  // Parallel arrows.
  for (const y of [y1, y2]) s += `<polyline points="${P(236, y - 5)} ${P(244, y)} ${P(236, y + 5)}" fill="none" stroke="#000" stroke-width="1.6"/>`;
  const label = (x, y, txt) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="15" text-anchor="middle">${txt}</text>`;
  // Label each region on its angle bisector. TR/TL are above a line, BL/BR below; L/R are sides of the transversal.
  const L = Math.hypot(slope, 1); const up = [slope / L, -1 / L];
  const dirs = { TR: [1 + up[0], up[1]], TL: [-1 + up[0], up[1]], BL: [-1 - up[0], -up[1]], BR: [1 - up[0], -up[1]] };
  const pos = (cx, cy, k) => { const [dx2, dy2] = dirs[k]; const l = Math.hypot(dx2, dy2); return [cx + (dx2 / l) * 38, cy + (dy2 / l) * 38 + 5]; };
  s += label(...pos(xTop, y1, 'BL'), `${a}°`);
  s += label(...pos(...(where.top ? [xTop, y1] : [xBot, y2]), where.k), 'x');
  return s + `<text x="${W - 8}" y="${H - 8}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#444" text-anchor="end">Not drawn accurately</text></svg>`;
}

export default {
  id: 'angles-polygons',
  title: 'Angles, parallel lines and polygons',
  subtitle: 'Angle facts with reasons, interior and exterior angles',
  topics: ['G3', 'G4', 'G6'],
  band: '5',
  calc: 'non-calc',
  minutes: 30,
  why: 'Angle questions are on every paper and need reasons written in full to get every mark. Polygon angles are a common 3–4 mark problem.',
  steps: [
    {
      kind: 'learn', title: 'Angle facts (learn the exact words)',
      md: md`- Angles on a straight line add up to $180°$.
- Angles around a point add up to $360°$.
- Vertically opposite angles are equal.
- Angles in a triangle add up to $180°$; in a quadrilateral, $360°$.
- Base angles of an isosceles triangle are equal.

**Parallel lines:**
- **Alternate** angles are equal (a Z shape).
- **Corresponding** angles are equal (an F shape).
- **Co-interior** angles add up to $180°$ (a C shape).`,
      key: 'Write "alternate angles are equal", not "Z angles". AQA does not give marks for Z, F or C.',
    },
    { kind: 'try', template: 'parallel' },
    {
      kind: 'learn', title: 'Polygons',
      md: md`For a polygon with $n$ sides:

- Sum of **interior** angles $= (n - 2) \times 180°$.
- **Exterior** angles always add up to $360°$.
- Interior $+$ exterior $= 180°$ at each corner.

For a **regular** polygon, each exterior angle $= \dfrac{360°}{n}$, so $n = \dfrac{360°}{\text{exterior angle}}$.`,
      key: 'Start with the exterior angle. It is the quickest route for regular polygons.',
    },
    {
      kind: 'example', title: 'Number of sides',
      q: md`Each interior angle of a regular polygon is $156°$. How many sides does it have?`,
      steps: [
        { md: md`Exterior angle $= 180° - 156° = 24°$` },
        { md: md`$n = 360 \div 24 = 15$` },
      ],
      answer: md`$15$ sides`,
    },
    { kind: 'try', template: 'sides' },
    { kind: 'practice', title: 'Practice', templates: ['parallel', 'triangleIso', 'interior', 'sides', 'sumInterior', 'reason'] },
    { kind: 'exam', template: 'polygonProblem' },
    {
      kind: 'recap',
      md: md`- Straight line $180°$, point $360°$, triangle $180°$, quadrilateral $360°$.
- Parallel lines: alternate and corresponding are equal, co-interior add to $180°$.
- Interior sum $(n - 2) \times 180°$; exterior sum $360°$; regular exterior $= 360° \div n$.
- Give a reason for every step.`,
      mistakes: ['Writing "Z angles" instead of "alternate angles"', 'Using (n − 2) × 180 as one interior angle', 'Mixing up interior and exterior angles'],
    },
  ],
  templates: {
    parallel: {
      level: 1, marks: 2, skill: 'Angles in parallel lines',
      gen(r) {
        const a = r.int(40, 75);
        // a is marked below the top line, left of the transversal (an acute angle between the lines).
        const which = r.pick([
          { k: 'BL', top: false, ans: a, reason: 'Corresponding angles are equal' },
          { k: 'TR', top: false, ans: a, reason: 'Alternate angles are equal' },
          { k: 'TL', top: false, ans: 180 - a, reason: 'Co-interior angles add up to 180°' },
          { k: 'TR', top: true, ans: a, reason: 'Vertically opposite angles are equal' },
        ]);
        return {
          q: md`The two horizontal lines are parallel. Work out the size of angle $x$.`,
          diagram: parallelFig(a, which),
          a: { kind: 'number', value: which.ans },
          show: md`$x = ${which.ans}°$ (${which.reason.toLowerCase()})`,
          wrong: [String(which.ans === a ? 180 - a : a)],
          hints: ['Look at where $x$ sits compared with the given angle: the same position (F), across the line (Z), or between the lines on the same side (C)?'],
          steps: [md`$x = ${which.ans}°$`, which.reason + '.'],
        };
      },
    },
    triangleIso: {
      level: 1, marks: 2, skill: 'Isosceles triangles',
      gen(r) {
        const apex = r.int(20, 110) * 1; const base = (180 - apex) / 2; if (!Number.isInteger(base)) return this.gen(r);
        const givenApex = r.bool();
        return {
          q: givenApex ? md`Triangle $ABC$ is isosceles with $AB = AC$. Angle $BAC = ${apex}°$. Work out angle $ABC$.` : md`Triangle $ABC$ is isosceles with $AB = AC$. Angle $ABC = ${base}°$. Work out angle $BAC$.`,
          diagram: triangle({ pts: [[2, 4], [0, 0], [4, 0]], names: ['A', 'B', 'C'], angles: givenApex ? { A: `${apex}°`, B: 'x' } : { B: `${base}°`, A: 'x' } }),
          a: { kind: 'number', value: givenApex ? base : apex },
          show: md`$${givenApex ? base : apex}°$`,
          wrong: [String(givenApex ? 180 - apex : 180 - base)],
          hints: ['Base angles of an isosceles triangle are equal: angles $ABC$ and $ACB$.', 'Angles in a triangle add up to $180°$.'],
          steps: givenApex ? [md`$180° - ${apex}° = ${180 - apex}°$`, md`$${180 - apex}° \div 2 = ${base}°$ (base angles of an isosceles triangle are equal)`] : [md`Angle $ACB = ${base}°$ (base angles are equal)`, md`$180° - 2 \times ${base}° = ${apex}°$ (angles in a triangle add up to $180°$)`],
        };
      },
    },
    interior: {
      level: 1, marks: 2, skill: 'Interior and exterior angles of a regular polygon',
      gen(r) {
        const n = r.pick([5, 6, 8, 9, 10, 12]); const ext = 360 / n; const askExt = r.bool();
        return {
          q: md`Work out the size of each ${askExt ? 'exterior' : 'interior'} angle of a regular ${NAMES[n]}.`,
          a: { kind: 'number', value: askExt ? ext : 180 - ext },
          show: md`$${askExt ? ext : 180 - ext}°$`,
          wrong: [String(askExt ? 180 - ext : ext), String((n - 2) * 180)],
          hints: [md`A ${NAMES[n]} has ${n} sides. Exterior angles add up to $360°$.`],
          steps: askExt ? [md`$360° \div ${n} = ${ext}°$`] : [md`Exterior $= 360° \div ${n} = ${ext}°$`, md`Interior $= 180° - ${ext}° = ${180 - ext}°$`],
        };
      },
    },
    sides: {
      level: 2, marks: 2, skill: 'Number of sides from an angle',
      gen(r) {
        const n = r.pick([8, 9, 10, 12, 15, 18, 20, 24, 30, 36]); const ext = 360 / n; const givenInt = r.bool();
        return {
          q: givenInt ? md`Each interior angle of a regular polygon is $${180 - ext}°$. How many sides does it have?` : md`Each exterior angle of a regular polygon is $${ext}°$. How many sides does it have?`,
          a: { kind: 'number', value: n },
          show: md`$${n}$ sides`,
          wrong: [fmt(360 / (180 - ext))].filter((w) => +w !== n),
          hints: [givenInt ? md`Find the exterior angle first: $180° - ${180 - ext}°$.` : md`Exterior angles add up to $360°$.`],
          steps: [...(givenInt ? [md`Exterior $= 180° - ${180 - ext}° = ${ext}°$`] : []), md`$360 \div ${ext} = ${n}$`],
        };
      },
    },
    sumInterior: {
      level: 2, marks: 2, skill: 'Missing angle in a polygon',
      gen(r) {
        const n = r.pick([5, 6]); const total = (n - 2) * 180;
        const known = Array.from({ length: n - 1 }, () => r.int(85, 150)); const x = total - known.reduce((a, b) => a + b, 0);
        if (x < 40 || x > 200) return this.gen(r);
        return {
          q: md`A ${NAMES[n]} has angles ${known.map((k) => `$${k}°$`).join(', ')} and $x$. Work out $x$.`,
          a: { kind: 'number', value: x },
          show: md`$x = ${x}°$`,
          wrong: [String(360 - known.reduce((a, b) => a + b, 0))].filter((w) => +w !== x),
          hints: [md`Interior angles of a ${NAMES[n]} add up to $(${n} - 2) \times 180° = ${total}°$.`],
          steps: [md`Sum $= (${n} - 2) \times 180° = ${total}°$`, md`$x = ${total}° - ${known.reduce((a, b) => a + b, 0)}° = ${x}°$`],
        };
      },
    },
    reason: {
      level: 1, marks: 1, skill: 'Writing angle reasons correctly',
      gen(r) {
        const facts = [
          ['Alternate angles are equal', 'Z angles are equal'],
          ['Corresponding angles are equal', 'F angles are equal'],
          ['Co-interior angles add up to 180°', 'C angles add up to 180°'],
          ['Angles on a straight line add up to 180°', 'Angles on a line are 180'],
          ['Vertically opposite angles are equal', 'Opposite angles are the same'],
        ];
        const [good, bad] = r.pick(facts);
        const others = r.shuffle(facts.map((f) => f[0]).filter((f) => f !== good)).slice(0, 2);
        const opts = [good, bad, ...others]; const order = r.shuffle([0, 1, 2, 3]);
        const which = { 'Alternate angles are equal': 'a Z shape', 'Corresponding angles are equal': 'an F shape', 'Co-interior angles add up to 180°': 'a C shape', 'Angles on a straight line add up to 180°': 'two angles that make a straight line', 'Vertically opposite angles are equal': 'an X where two lines cross' }[good];
        return {
          q: `Two angles make ${which}. Which reason would an AQA examiner accept?`,
          a: { kind: 'choice', options: order.map((i) => opts[i]), correct: order.indexOf(0) },
          show: good,
          hints: ['Use the proper name of the angle fact. Letter shapes (Z, F, C) are not accepted.'],
          steps: [`"${good}" is the accepted wording.`],
        };
      },
    },
    polygonProblem: {
      level: 3, marks: 4, skill: 'Polygon angle problem (grade 6–7)',
      gen(r) {
        // A regular n-gon and a regular m-gon share a side; find the angle between them (360 - int_n - int_m).
        const [n, m] = r.pick([[6, 4], [8, 4], [5, 4], [6, 5], [8, 6], [10, 5], [12, 4]]);
        const iN = 180 - 360 / n; const iM = 180 - 360 / m; const x = 360 - iN - iM;
        return {
          q: md`A regular ${NAMES[n] || `${n}-sided polygon`} and a ${m === 4 ? 'square' : `regular ${NAMES[m]}`} share a side, as shown. Both shapes have a corner at $P$.

Work out the size of angle $x$.`,
          diagram: (() => {
            const A = regular(n, true); const B = regular(m, false);
            return shapesFig({ polygons: [A, B], names: { P: { at: [0, 0], toward: [-1, 0], dist: 11 } }, angles: [{ at: [0, 0], from: B.at(-1), to: A.at(-1), label: 'x', r: 26 }] });
          })(),
          a: { kind: 'number', value: x },
          show: md`$x = ${fmt(x)}°$`,
          wrong: [String(180 - iN), String(360 - iN)].filter((w) => +w !== x),
          hints: [md`Interior angle of the ${NAMES[n]}: $180° - 360° \div ${n}$.`, md`Angles around the point $P$ add up to $360°$.`],
          steps: [md`${NAMES[n]}: exterior $= ${fmt(360 / n)}°$, interior $= ${fmt(iN)}°$ **[M1]**`, md`${m === 4 ? 'Square' : NAMES[m]}: interior $= ${fmt(iM)}°$ **[M1]**`, md`$x = 360° - ${fmt(iN)}° - ${fmt(iM)}° = ${fmt(x)}°$ (angles around a point) **[M1 A1]**`],
        };
      },
    },
  },
};
