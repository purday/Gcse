import { circleFig } from '../diagrams.js';

const md = String.raw;
const rad = (d) => (d * Math.PI) / 180;

const THEOREMS = {
  centre: 'The angle at the centre is twice the angle at the circumference',
  semicircle: 'The angle in a semicircle is 90°',
  segment: 'Angles in the same segment are equal',
  cyclic: 'Opposite angles of a cyclic quadrilateral add up to 180°',
  tangent: 'A tangent meets a radius at 90°',
  alternate: 'Alternate segment theorem: the angle between a tangent and a chord equals the angle in the alternate segment',
  tangents: 'Tangents from an external point are equal in length',
};

// Each figure is drawn accurately from the question's own angle.
const FIG = {
  centre(a, ask) {
    const A = 270 - a; const B = 270 + a; const C = 90 + 25;
    return circleFig({ on: { A, B, C }, segs: [['A', 'C'], ['B', 'C'], ['O', 'A'], ['O', 'B']], angles: [{ at: 'C', from: 'A', to: 'B', label: ask === 'C' ? 'x' : `${a}°` }, { at: 'O', from: 'A', to: 'B', label: ask === 'O' ? 'x' : `${2 * a}°`, r: 18 }] });
  },
  semicircle(a) {
    return circleFig({ on: { A: 180, B: 0, C: 2 * a }, segs: [['A', 'B'], ['A', 'C'], ['B', 'C']], angles: [{ at: 'A', from: 'B', to: 'C', label: `${a}°`, r: 30 }, { at: 'B', from: 'A', to: 'C', label: 'x' }] });
  },
  segment(a) {
    const A = 270 - a; const B = 270 + a;
    return circleFig({ on: { A, B, C: 140, D: 50 }, segs: [['A', 'C'], ['B', 'C'], ['A', 'D'], ['B', 'D']], angles: [{ at: 'C', from: 'A', to: 'B', label: `${a}°`, r: 28 }, { at: 'D', from: 'A', to: 'B', label: 'x', r: 28 }], centre: false });
  },
  cyclic(a) {
    const A = 270 - a; const C = 270 + a;
    return circleFig({ on: { A, B: 105, C, D: 270 }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']], angles: [{ at: 'B', from: 'A', to: 'C', label: `${a}°`, r: 26 }, { at: 'D', from: 'C', to: 'A', label: 'x', r: 20 }], centre: false });
  },
  tangent(a) {
    // Tangent at A (bottom of the circle), T on the tangent with angle AOT = a.
    const T = [Math.tan(rad(a)), -1];
    return circleFig({ on: { A: 270 }, off: { T }, segs: [['A', 'T'], ['O', 'A'], ['O', 'T'], ['A', 'O']], angles: [{ at: 'O', from: 'A', to: 'T', label: `${a}°`, r: 20 }, { at: 'T', from: 'O', to: 'A', label: 'x', r: 26 }], right: [{ at: 'A', from: 'O', to: 'T' }], h: 260 });
  },
  alternate(a) {
    // Tangent through A along the x-direction; chord AB makes angle a with it.
    return circleFig({ on: { A: 270, B: 270 + 2 * a, C: 130 }, off: { S: [-1.5, -1], T: [1.6, -1] }, segs: [['S', 'T'], ['A', 'B'], ['A', 'C'], ['B', 'C']], angles: [{ at: 'A', from: 'T', to: 'B', label: `${a}°`, r: 30 }, { at: 'C', from: 'A', to: 'B', label: 'x', r: 28 }], centre: false });
  },
  tangents(a) {
    const d = 1 / Math.sin(rad(a / 2)); const phi = 90 - a / 2;
    return circleFig({ on: { A: phi, B: -phi }, off: { P: [d, 0] }, segs: [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], angles: [{ at: 'P', from: 'A', to: 'B', label: `${a}°`, r: 24 }, { at: 'O', from: 'B', to: 'A', label: 'x', r: 18 }], right: [{ at: 'A', from: 'O', to: 'P' }, { at: 'B', from: 'O', to: 'P' }], w: 330 });
  },
};

export default {
  id: 'circle-theorems',
  title: 'Circle theorems',
  subtitle: 'Seven theorems, finding angles, giving reasons',
  topics: ['G10'],
  band: '7',
  calc: 'non-calc',
  minutes: 40,
  why: 'Circle theorems are Higher-only and worth 3–5 marks most series. Marks need both the angle **and** the reason in words, so learning the exact wording pays off.',
  steps: [
    {
      kind: 'learn', title: 'Centre and semicircle',
      md: md`**1. The angle at the centre is twice the angle at the circumference** (from the same arc).

**2. The angle in a semicircle is 90°.** (It is theorem 1 with a $180°$ angle at the centre.)`,
      diagram: FIG.centre(50, null),
    },
    { kind: 'try', template: 'centre' },
    {
      kind: 'learn', title: 'Same segment and cyclic quadrilaterals',
      md: md`**3. Angles in the same segment are equal** (angles from the same chord, on the same side).

**4. Opposite angles of a cyclic quadrilateral add up to 180°.** A cyclic quadrilateral has all four corners on the circle.`,
      diagram: FIG.cyclic(70),
    },
    { kind: 'try', template: 'cyclic' },
    {
      kind: 'learn', title: 'Tangents',
      md: md`**5. A tangent meets a radius at 90°.**

**6. Tangents from an external point are equal in length** (so the shape they make with the centre is a kite).

**7. Alternate segment theorem:** the angle between a tangent and a chord equals the angle in the alternate segment.`,
      diagram: FIG.alternate(55),
      key: 'Write the reason as a full sentence. "Circle theorem" on its own scores nothing.',
    },
    { kind: 'try', template: 'tangent' },
    { kind: 'try', template: 'alternate' },
    { kind: 'practice', title: 'Practice', templates: ['centre', 'semicircle', 'segment', 'cyclic', 'tangent', 'alternate', 'tangents', 'reason'] },
    { kind: 'exam', template: 'twoStep' },
    {
      kind: 'recap',
      md: md`1. Centre $= 2 \times$ circumference.
2. Semicircle: $90°$.
3. Same segment: equal.
4. Cyclic quadrilateral: opposites add to $180°$.
5. Tangent and radius: $90°$.
6. Two tangents from a point: equal length.
7. Alternate segment: tangent–chord angle $=$ angle in the opposite segment.`,
      mistakes: ['Halving instead of doubling (or the other way round)', 'Using the cyclic quadrilateral rule when one corner is the centre', 'Giving the angle with no reason', 'Forgetting that OA = OB makes an isosceles triangle'],
    },
  ],
  templates: {
    centre: {
      level: 1, marks: 2, skill: 'Angle at the centre',
      gen(r) {
        const a = r.int(25, 80); const ask = r.pick(['O', 'C']);
        const ans = ask === 'O' ? 2 * a : a;
        return {
          q: md`$A$, $B$ and $C$ are points on a circle, centre $O$. ${ask === 'O' ? md`Angle $ACB = ${a}°$. Work out angle $AOB$, marked $x$.` : md`Angle $AOB = ${2 * a}°$. Work out angle $ACB$, marked $x$.`}`,
          diagram: FIG.centre(a, ask),
          a: { kind: 'number', value: ans },
          show: md`$x = ${ans}°$ (${THEOREMS.centre.toLowerCase()})`,
          wrong: [String(ask === 'O' ? a / 2 : 4 * a), String(180 - ans)].filter((w) => +w !== ans),
          hints: [THEOREMS.centre + '.'],
          steps: [ask === 'O' ? md`$x = 2 \times ${a}° = ${2 * a}°$` : md`$x = ${2 * a}° \div 2 = ${a}°$`, THEOREMS.centre + '.'],
        };
      },
    },
    semicircle: {
      level: 1, marks: 2, skill: 'Angle in a semicircle',
      gen(r) {
        const a = r.int(20, 70);
        return {
          q: md`$AB$ is a diameter of the circle and $C$ is on the circle. Angle $CAB = ${a}°$. Work out angle $ABC$, marked $x$.`,
          diagram: FIG.semicircle(a),
          a: { kind: 'number', value: 90 - a },
          show: md`$x = ${90 - a}°$`,
          wrong: [String(180 - a), String(a)].filter((w) => +w !== 90 - a),
          hints: [THEOREMS.semicircle + ', so angle $ACB = 90°$.', 'Angles in a triangle add up to 180°.'],
          steps: [md`Angle $ACB = 90°$ (angle in a semicircle)`, md`$x = 180° - 90° - ${a}° = ${90 - a}°$ (angles in a triangle)`],
        };
      },
    },
    segment: {
      level: 1, marks: 2, skill: 'Angles in the same segment',
      gen(r) {
        const a = r.int(25, 70);
        return {
          q: md`$A$, $B$, $C$ and $D$ are points on a circle. Angle $ACB = ${a}°$. Work out angle $ADB$, marked $x$.`,
          diagram: FIG.segment(a),
          a: { kind: 'number', value: a },
          show: md`$x = ${a}°$`,
          wrong: [String(2 * a), String(180 - a)],
          hints: ['Both angles come from the same chord $AB$ and are on the same side of it.'],
          steps: [md`$x = ${a}°$`, THEOREMS.segment + '.'],
        };
      },
    },
    cyclic: {
      level: 2, marks: 2, skill: 'Cyclic quadrilaterals',
      gen(r) {
        const a = r.int(55, 120);
        return {
          q: md`$ABCD$ is a cyclic quadrilateral. Angle $ABC = ${a}°$. Work out angle $ADC$, marked $x$.`,
          diagram: FIG.cyclic(a),
          a: { kind: 'number', value: 180 - a },
          show: md`$x = ${180 - a}°$`,
          wrong: [String(a), String(360 - a)].filter((w) => +w !== 180 - a),
          hints: [THEOREMS.cyclic + '. $B$ and $D$ are opposite.'],
          steps: [md`$x = 180° - ${a}° = ${180 - a}°$`, THEOREMS.cyclic + '.'],
        };
      },
    },
    tangent: {
      level: 2, marks: 2, skill: 'Tangent and radius',
      gen(r) {
        const a = r.int(25, 65);
        return {
          q: md`$TA$ is a tangent to the circle, centre $O$, at $A$. Angle $AOT = ${a}°$. Work out angle $ATO$, marked $x$.`,
          diagram: FIG.tangent(a),
          a: { kind: 'number', value: 90 - a },
          show: md`$x = ${90 - a}°$`,
          wrong: [String(180 - a)],
          hints: [THEOREMS.tangent + ', so angle $OAT = 90°$.'],
          steps: [md`Angle $OAT = 90°$ (tangent meets radius at $90°$)`, md`$x = 180° - 90° - ${a}° = ${90 - a}°$ (angles in a triangle)`],
        };
      },
    },
    alternate: {
      level: 3, marks: 2, skill: 'Alternate segment theorem',
      gen(r) {
        const a = r.int(30, 75);
        return {
          q: md`$ST$ is a tangent to the circle at $A$. $B$ and $C$ are on the circle. Angle $TAB = ${a}°$. Work out angle $ACB$, marked $x$.`,
          diagram: FIG.alternate(a),
          a: { kind: 'number', value: a },
          show: md`$x = ${a}°$`,
          wrong: [String(90 - a), String(180 - a), String(2 * a)].filter((w) => +w !== a),
          hints: ['The angle between the tangent and chord $AB$ equals the angle in the alternate segment, at $C$.'],
          steps: [md`$x = ${a}°$`, THEOREMS.alternate + '.'],
        };
      },
    },
    tangents: {
      level: 3, marks: 3, skill: 'Two tangents from a point',
      gen(r) {
        const a = r.int(30, 80);
        return {
          q: md`$PA$ and $PB$ are tangents to the circle, centre $O$. Angle $APB = ${a}°$. Work out angle $AOB$, marked $x$.`,
          diagram: FIG.tangents(a),
          a: { kind: 'number', value: 180 - a },
          show: md`$x = ${180 - a}°$`,
          wrong: [String(2 * a), String(90 - a)].filter((w) => +w !== 180 - a),
          hints: ['Angles $OAP$ and $OBP$ are both $90°$ (tangent meets radius).', 'Angles in a quadrilateral add up to $360°$.'],
          steps: [md`Angle $OAP = $ angle $OBP = 90°$ (tangent meets radius at $90°$)`, md`$x = 360° - 90° - 90° - ${a}° = ${180 - a}°$ (angles in a quadrilateral)`],
        };
      },
    },
    reason: {
      level: 2, marks: 1, skill: 'Naming the right theorem',
      gen(r) {
        const which = r.pick(['centre', 'segment', 'cyclic', 'tangent', 'alternate', 'semicircle']);
        const a = which === 'cyclic' ? r.int(60, 110) : r.int(30, 65);
        const fig = which === 'centre' ? FIG.centre(a, 'O') : FIG[which](a);
        const others = r.shuffle(Object.keys(THEOREMS).filter((k) => k !== which)).slice(0, 3);
        const keys = r.shuffle([which, ...others]);
        return {
          q: 'Which theorem do you need to find $x$?',
          diagram: fig,
          a: { kind: 'choice', options: keys.map((k) => THEOREMS[k]), correct: keys.indexOf(which) },
          show: THEOREMS[which],
          hints: ['Look at what touches the circle: a tangent? the centre? four points on the circle? a diameter?'],
          steps: [THEOREMS[which] + '.'],
        };
      },
    },
    twoStep: {
      level: 3, marks: 4, skill: 'Two-step circle theorem problem (grade 8)',
      gen(r) {
        const a = r.int(25, 75);
        return {
          q: md`$A$, $B$ and $C$ are points on a circle, centre $O$. Angle $ACB = ${a}°$.

Work out angle $OAB$. Give a reason for each stage of your working.`,
          diagram: circleFig({ on: { A: 270 - a, B: 270 + a, C: 115 }, segs: [['A', 'C'], ['B', 'C'], ['O', 'A'], ['O', 'B'], ['A', 'B']], angles: [{ at: 'C', from: 'A', to: 'B', label: `${a}°` }] }),
          a: { kind: 'number', value: 90 - a },
          show: md`Angle $OAB = ${90 - a}°$`,
          wrong: [String(2 * a), String(180 - 2 * a), String(a)].filter((w) => +w !== 90 - a),
          hints: ['First find angle $AOB$ using the angle at the centre.', 'Triangle $AOB$ is isosceles because $OA$ and $OB$ are both radii.'],
          steps: [
            md`Angle $AOB = 2 \times ${a}° = ${2 * a}°$ (angle at the centre is twice the angle at the circumference) **[M1 B1]**`,
            md`$OA = OB$ (radii), so triangle $AOB$ is isosceles **[B1]**`,
            md`Angle $OAB = (180° - ${2 * a}°) \div 2 = ${90 - a}°$ (base angles of an isosceles triangle) **[A1]**`,
          ],
        };
      },
    },
  },
};
