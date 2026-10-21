const md = String.raw;

export default {
  id: 'exam-technique',
  title: 'Exam technique: picking up every mark',
  subtitle: 'Method marks, timing, rounding, Paper 1 tips',
  topics: ['A1'],
  band: '4-5',
  calc: 'both',
  minutes: 15,
  extra: true,
  why: 'Most students lose 10 or more marks across three papers through technique, not maths. This is the fastest win available.',
  steps: [
    {
      kind: 'learn', title: 'How AQA gives marks',
      md: md`- **M marks** (method): for a correct method, even if the final answer is wrong.
- **A marks** (accuracy): for the correct answer, only after the method.
- **B marks**: for a correct answer or statement on its own.

So **working is worth marks**. A wrong answer with clear working often scores half or more. A wrong answer with no working scores **zero**.`,
      key: 'Never leave a question blank. Write down the first step you know (a formula, a substitution, a diagram label). That alone can be a method mark.',
    },
    {
      kind: 'learn', title: 'Time',
      md: md`Each paper: **80 marks in 90 minutes**, so roughly **1 mark per minute** with 10 minutes spare.

- Stuck for 2 minutes? Write what you can, **flag it** and move on. Come back at the end.
- The last third of the paper is harder, but the first part of each long question is often easy marks.
- Use the last 10 minutes to check the flagged questions and any answer with units or rounding.`,
    },
    {
      kind: 'learn', title: 'Read the question, then answer that question',
      md: md`- Underline the **command words**: *work out*, *show that*, *give your answer to 3 s.f.*, *in terms of $\pi$*, *simplify fully*, *give reasons*.
- **Show that** questions: every step must be visible and you must reach the number given.
- **Give reasons**: name the angle fact, e.g. "alternate angles are equal", "angles in a triangle add to 180°".
- Check the **units** the answer line asks for (cm or m? hours or minutes?).
- "Simplify **fully**" or "factorise **fully**" means there is more than one step.`,
    },
    {
      kind: 'learn', title: 'Rounding and accuracy',
      md: md`- Keep full calculator values until the **very last** step (use the ANS key or store values).
- Round to what is asked: 2 decimal places, 3 significant figures, nearest whole number.
- Money: 2 decimal places, e.g. £4.50, not £4.5.
- **Calculator in degrees** (D on the screen) before any trig question.`,
    },
    {
      kind: 'learn', title: 'Non-calculator Paper 1 (Wednesday 4 November)',
      md: md`- Leave answers as fractions or surds when the question allows it. $\frac{2}{3}$ is exact; 0.67 may lose the mark.
- Learn the column methods: long multiplication and short division. Do them neatly so you can check.
- Estimating: round each number to **1 significant figure** and show the rounded values.
- Know the exact trig values and the squares up to $15^2$ and cubes up to $5^3$.`,
    },
    { kind: 'try', template: 'whichMarks' },
    { kind: 'try', template: 'rounding' },
    {
      kind: 'recap',
      md: md`- Always write the method: it earns M marks even when the answer slips.
- About 1 mark per minute. Flag and move on when stuck.
- Answer the exact question: units, rounding, "fully", reasons.
- Keep full values until the end; calculator in degrees.`,
      mistakes: ['Blank answers', 'Premature rounding', 'Missing units or wrong units', 'Not giving reasons when asked'],
    },
  ],
  templates: {
    whichMarks: {
      level: 1, marks: 1, skill: 'Knowing how method marks work',
      gen(r) {
        const opts = ['Leave it blank so you do not lose marks', 'Write the method you would use and any first step', 'Write a guess with no working', 'Copy the question out again'];
        return {
          q: 'You are stuck on a 4-mark question. What should you do before moving on?',
          a: { kind: 'choice', options: opts, correct: 1 },
          show: 'Write the method and any first step: that can earn method marks.',
          hints: ['M marks are for a correct method, even if the answer is wrong.'],
          steps: ['A blank or a bare guess scores 0.', 'A correct first step (e.g. a formula with values substituted) can score M1.', 'So write what you know, flag the question, and come back later.'],
        };
      },
    },
    rounding: {
      level: 1, marks: 1, skill: 'Rounding to significant figures',
      gen(r) {
        const v = r.int(10000, 99999) / r.pick([10, 100, 1000]);
        const sf = r.pick([2, 3]);
        const d = sf - Math.ceil(Math.log10(Math.abs(v)));
        const rounded = Math.round(v * 10 ** d) / 10 ** d;
        const shown = d > 0 ? rounded.toFixed(d) : String(rounded);
        return {
          q: `Round ${v} to ${sf} significant figures.`,
          a: { kind: 'number', value: rounded },
          show: shown,
          hints: ['Count significant figures from the first non-zero digit.', `Look at the digit after the ${sf === 2 ? 'second' : 'third'} significant figure to decide whether to round up.`],
          steps: [`The first ${sf} significant figures of ${v} are shown, then look at the next digit.`, `${v} rounds to ${shown}.`],
        };
      },
    },
  },
};
