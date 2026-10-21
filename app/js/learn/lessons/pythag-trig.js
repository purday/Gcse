import { sf, fmt } from '../engine.js';
import { rightTriangle } from '../diagrams.js';

const md = String.raw;
const R = Math.PI / 180;
const s3 = (x) => sf(x, 3);

export default {
  id: 'pythag-trig',
  title: 'Pythagoras and right-angled trigonometry',
  subtitle: 'Missing sides, SOH CAH TOA, angles, exact values, 3D',
  topics: ['G20', 'G21'],
  band: '6',
  calc: 'both',
  minutes: 45,
  why: 'Pythagoras and trigonometry are worth about 8–12 marks across a Higher series, from 3-mark "find x" questions to multi-step and 3D problems.',
  steps: [
    {
      kind: 'learn', title: "Pythagoras' theorem",
      md: md`In a right-angled triangle, with $c$ the **hypotenuse** (the longest side, opposite the right angle):

$$a^2 + b^2 = c^2$$

- Finding the **hypotenuse**: square, **add**, square root.
- Finding a **shorter** side: square, **subtract**, square root.`,
      diagram: rightTriangle({ base: 8, height: 6, sides: { AB: '6 cm', BC: '8 cm', AC: 'c' } }),
      key: md`Here $c^2 = 6^2 + 8^2 = 100$, so $c = 10$ cm. Sense check: the hypotenuse must be the longest side.`,
    },
    { kind: 'try', template: 'hyp' },
    { kind: 'try', template: 'shorter' },
    {
      kind: 'learn', title: 'SOH CAH TOA',
      md: md`Label the sides **from the angle** you are using:

- **O**pposite: across from the angle
- **A**djacent: next to the angle (not the hypotenuse)
- **H**ypotenuse: opposite the right angle

$$\sin\theta = \frac{O}{H} \qquad \cos\theta = \frac{A}{H} \qquad \tan\theta = \frac{O}{A}$$

Pick the ratio that uses the side you **know** and the side you **want**.`,
      key: 'Finding an angle: use the inverse button (shift sin, shift cos, shift tan). Check the calculator shows D for degrees.',
    },
    {
      kind: 'example', title: 'Finding a side',
      q: md`In a right-angled triangle, the hypotenuse is 12 cm and one angle is 35°. Find the side opposite the 35° angle.`,
      steps: [
        { md: md`Know H = 12, want O, so use **SOH**: $\sin 35 = \dfrac{O}{12}$` },
        { md: md`$O = 12 \times \sin 35 = 6.882\dots$` },
        { md: md`$O = 6.88$ cm (3 s.f.)` },
      ],
      answer: md`$6.88$ cm`,
    },
    { kind: 'try', template: 'trigSide' },
    {
      kind: 'example', title: 'Finding an angle',
      q: md`A ladder 6 m long leans against a wall. Its foot is 1.8 m from the wall. Find the angle between the ladder and the ground.`,
      steps: [
        { md: md`The ladder is the hypotenuse (6). The ground side is adjacent to the angle (1.8). So **CAH**.` },
        { md: md`$\cos\theta = \dfrac{1.8}{6} = 0.3$` },
        { md: md`$\theta = \cos^{-1}(0.3) = 72.54\dots°$` },
        { md: md`$72.5°$ (1 d.p.)` },
      ],
      answer: md`$72.5°$`,
    },
    { kind: 'try', template: 'trigAngle' },
    {
      kind: 'learn', title: 'Exact values (non-calculator)',
      md: md`| | $0°$ | $30°$ | $45°$ | $60°$ | $90°$ |
|---|---|---|---|---|---|
| $\sin$ | $0$ | $\frac12$ | $\frac{\sqrt2}{2}$ | $\frac{\sqrt3}{2}$ | $1$ |
| $\cos$ | $1$ | $\frac{\sqrt3}{2}$ | $\frac{\sqrt2}{2}$ | $\frac12$ | $0$ |
| $\tan$ | $0$ | $\frac{\sqrt3}{3}$ | $1$ | $\sqrt3$ | — |

Paper 1 can ask, for example: hypotenuse 10, angle 30°, find the opposite side: $10 \times \sin 30 = 10 \times \frac12 = 5$.`,
    },
    { kind: 'practice', title: 'Practice', templates: ['hyp', 'shorter', 'trigSide', 'trigSide', 'trigAngle', 'exact'] },
    { kind: 'exam', template: 'space3d' },
    {
      kind: 'recap',
      md: md`- Pythagoras: hypotenuse → add; shorter side → subtract.
- Label O, A, H from the angle; choose SOH, CAH or TOA from what you know and want.
- Angles: inverse trig, calculator in degrees.
- Learn the exact values for 30°, 45°, 60°.`,
      mistakes: ['Adding squares when finding a shorter side', 'Labelling opposite/adjacent from the wrong angle', 'Calculator in radians', 'Rounding in the middle of a calculation'],
    },
  ],
  templates: {
    hyp: {
      level: 1, marks: 3, skill: "Pythagoras: finding the hypotenuse",
      gen(r) {
        const a = r.int(3, 15); const b = r.int(3, 18); const c = Math.hypot(a, b);
        return {
          q: md`Work out the length $x$. Give your answer to 3 significant figures.`,
          diagram: rightTriangle({ base: b, height: a, sides: { AB: `${a} cm`, BC: `${b} cm`, AC: 'x' } }),
          a: { kind: 'number', value: c, sf: 3 },
          show: md`$x = ${s3(c)}$ cm`,
          wrong: [s3(Math.sqrt(Math.abs(b * b - a * a)) || 1)],
          hints: [md`$x$ is the hypotenuse: $x^2 = ${a}^2 + ${b}^2$.`],
          steps: [md`$x^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${a * a + b * b}$`, md`$x = \sqrt{${a * a + b * b}} = ${fmt(c, 4)}\dots$`, md`$x = ${s3(c)}$ cm`],
        };
      },
    },
    shorter: {
      level: 2, marks: 3, skill: 'Pythagoras: finding a shorter side',
      gen(r) {
        const b = r.int(4, 15); const c = r.int(b + 2, b + 12); const a = Math.sqrt(c * c - b * b);
        return {
          q: md`Work out the length $y$. Give your answer to 3 significant figures.`,
          diagram: rightTriangle({ base: b, height: a, sides: { AB: 'y', BC: `${b} cm`, AC: `${c} cm` } }),
          a: { kind: 'number', value: a, sf: 3 },
          show: md`$y = ${s3(a)}$ cm`,
          wrong: [s3(Math.hypot(b, c))],
          hints: [md`The hypotenuse is $${c}$ cm, so **subtract**: $y^2 = ${c}^2 - ${b}^2$.`],
          steps: [md`$y^2 = ${c}^2 - ${b}^2 = ${c * c} - ${b * b} = ${c * c - b * b}$`, md`$y = \sqrt{${c * c - b * b}} = ${fmt(a, 4)}\dots$`, md`$y = ${s3(a)}$ cm`],
        };
      },
    },
    trigSide: {
      level: 2, marks: 3, skill: 'Trigonometry: finding a side',
      gen(r) {
        const ang = r.int(20, 70); const known = r.pick(['H', 'A', 'O']); const want = r.pick(['O', 'A', 'H'].filter((x) => x !== known));
        const L = r.int(4, 20);
        // set up triangle: angle at C (bottom right). Sides: O = AB (vertical), A = BC (base), H = AC
        let O; let A; let H;
        if (known === 'H') { H = L; O = H * Math.sin(ang * R); A = H * Math.cos(ang * R); }
        if (known === 'A') { A = L; O = A * Math.tan(ang * R); H = A / Math.cos(ang * R); }
        if (known === 'O') { O = L; A = O / Math.tan(ang * R); H = O / Math.sin(ang * R); }
        const val = { O, A, H }[want];
        const pair = [known, want].sort().join('');
        const ratio = pair === 'HO' ? 'sin' : pair === 'AH' ? 'cos' : 'tan';
        const label = (s) => (s === known ? `${L} cm` : s === want ? 'x' : '');
        const eq = ratio === 'sin' ? md`\sin ${ang}° = \dfrac{O}{H}` : ratio === 'cos' ? md`\cos ${ang}° = \dfrac{A}{H}` : md`\tan ${ang}° = \dfrac{O}{A}`;
        const calc = want === 'O' ? (ratio === 'sin' ? `${L} \\times \\sin ${ang}°` : `${L} \\times \\tan ${ang}°`)
          : want === 'A' ? (ratio === 'cos' ? `${L} \\times \\cos ${ang}°` : `\\dfrac{${L}}{\\tan ${ang}°}`)
            : ratio === 'sin' ? `\\dfrac{${L}}{\\sin ${ang}°}` : `\\dfrac{${L}}{\\cos ${ang}°}`;
        return {
          q: md`Work out the length $x$. Give your answer to 3 significant figures.`,
          diagram: rightTriangle({ base: A, height: O, sides: { AB: label('O'), BC: label('A'), AC: label('H') }, angles: { C: `${ang}°` } }),
          a: { kind: 'number', value: val, sf: 3 },
          show: md`$x = ${s3(val)}$ cm`,
          hints: [md`From the ${ang}° angle: you know the ${{ O: 'opposite', A: 'adjacent', H: 'hypotenuse' }[known]} and want the ${{ O: 'opposite', A: 'adjacent', H: 'hypotenuse' }[want]}. Use **${ratio}**.`, md`$${eq}$`],
          steps: [md`Use ${ratio}: $${eq}$`, md`$x = ${calc} = ${fmt(val, 4)}\dots$`, md`$x = ${s3(val)}$ cm`],
        };
      },
    },
    trigAngle: {
      level: 2, marks: 3, skill: 'Trigonometry: finding an angle',
      gen(r) {
        const pair = r.pick(['HO', 'AH', 'AO']);
        let O; let A; let H;
        if (pair === 'HO') { H = r.int(8, 20); O = r.int(2, H - 2); A = Math.sqrt(H * H - O * O); }
        if (pair === 'AH') { H = r.int(8, 20); A = r.int(2, H - 2); O = Math.sqrt(H * H - A * A); }
        if (pair === 'AO') { A = r.int(3, 15); O = r.int(3, 15); H = Math.hypot(A, O); }
        const ang = Math.atan2(O, A) / R;
        const ratio = pair === 'HO' ? 'sin' : pair === 'AH' ? 'cos' : 'tan';
        const fr = ratio === 'sin' ? `\\dfrac{${O}}{${H}}` : ratio === 'cos' ? `\\dfrac{${A}}{${H}}` : `\\dfrac{${O}}{${A}}`;
        const lab = { O: pair.includes('O') ? `${O} cm` : '', A: pair.includes('A') ? `${A} cm` : '', H: pair.includes('H') ? `${H} cm` : '' };
        return {
          q: md`Work out the size of angle $\theta$. Give your answer to 1 decimal place.`,
          diagram: rightTriangle({ base: A, height: O, sides: { AB: lab.O, BC: lab.A, AC: lab.H }, angles: { C: 'θ' } }),
          a: { kind: 'number', value: ang, dp: 1 },
          show: md`$\theta = ${ang.toFixed(1)}°$`,
          hints: [md`From $\theta$, the two known sides are the ${pair.split('').map((s) => ({ O: 'opposite', A: 'adjacent', H: 'hypotenuse' }[s])).join(' and ')}. Use **${ratio}**.`, md`$${'\\' + ratio}\theta = ${fr}$, then use $${'\\' + ratio}^{-1}$.`],
          steps: [md`$${'\\' + ratio}\theta = ${fr}$`, md`$\theta = ${'\\' + ratio}^{-1}\left(${fr}\right) = ${fmt(ang, 4)}\dots°$`, md`$\theta = ${ang.toFixed(1)}°$`],
        };
      },
    },
    exact: {
      level: 2, marks: 2, skill: 'Exact trig values without a calculator',
      gen(r) {
        const opts = [
          { ang: 30, f: 'sin', side: 'opposite', ratio: 0.5 }, { ang: 60, f: 'cos', side: 'adjacent', ratio: 0.5 },
          { ang: 45, f: 'tan', side: 'opposite', ratio: 1, fromAdj: true }, { ang: 30, f: 'cos', side: 'adjacent', ratio: Math.sqrt(3) / 2, surd: true },
        ];
        const o = r.pick(opts.slice(0, 3));
        const L = r.pick([4, 6, 8, 10, 12, 14, 18, 20]);
        const val = L * o.ratio;
        return {
          q: md`Without a calculator: a right-angled triangle has ${o.fromAdj ? 'adjacent side' : 'hypotenuse'} $${L}$ cm and an angle of $${o.ang}°$.

Work out the length of the side ${o.side} to the $${o.ang}°$ angle.`,
          a: { kind: 'number', value: val },
          show: md`$${fmt(val)}$ cm`,
          hints: [md`Use $${'\\' + o.f} ${o.ang}° = ${o.ratio === 0.5 ? '\\frac12' : '1'}$.`],
          steps: [md`$x = ${L} \times ${'\\' + o.f} ${o.ang}° = ${L} \times ${o.ratio === 0.5 ? '\\frac12' : '1'}$`, md`$= ${fmt(val)}$ cm`],
        };
      },
    },
    space3d: {
      level: 3, marks: 4, skill: 'Pythagoras and trigonometry in 3D',
      gen(r) {
        const l = r.int(4, 15); const w = r.int(3, 12); const h = r.int(2, 10);
        const base = Math.hypot(l, w); const diag = Math.hypot(l, w, h); const ang = Math.atan2(h, base) / R;
        const askAngle = r.bool();
        return {
          q: md`A cuboid measures ${l} cm by ${w} cm by ${h} cm.

${askAngle ? 'Work out the angle between a space diagonal of the cuboid and its base. Give your answer to 1 decimal place.' : 'Work out the length of a space diagonal (from one corner to the opposite corner). Give your answer to 3 significant figures.'}`,
          a: askAngle ? { kind: 'number', value: ang, dp: 1 } : { kind: 'number', value: diag, sf: 3 },
          show: askAngle ? md`$${ang.toFixed(1)}°$` : md`$${s3(diag)}$ cm`,
          hints: [md`First find the diagonal of the base: $\sqrt{${l}^2 + ${w}^2}$.`, askAngle ? md`The diagonal, the base diagonal and the height ${h} make a right-angled triangle: $\tan\theta = \dfrac{${h}}{\text{base diagonal}}$.` : md`Then use Pythagoras again with the height: $d^2 = (\text{base diagonal})^2 + ${h}^2$.`],
          steps: [
            md`Base diagonal $= \sqrt{${l}^2 + ${w}^2} = \sqrt{${l * l + w * w}} = ${fmt(base, 4)}\dots$ **[M1]**`,
            askAngle ? md`$\tan\theta = \dfrac{${h}}{${fmt(base, 4)}}$ **[M1]**` : md`$d^2 = ${l * l + w * w} + ${h * h} = ${l * l + w * w + h * h}$ **[M1]**`,
            askAngle ? md`$\theta = ${fmt(ang, 4)}\dots°$ **[M1]**` : md`$d = \sqrt{${l * l + w * w + h * h}} = ${fmt(diag, 4)}\dots$ **[M1]**`,
            askAngle ? md`$${ang.toFixed(1)}°$ **[A1]**` : md`$${s3(diag)}$ cm **[A1]**`,
          ],
        };
      },
    },
  },
};
