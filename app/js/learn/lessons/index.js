// All built-in lessons, in teaching priority for a grade 6 (then 7–8) push.
// group: 'core' = grade 6 essentials, 'push' = grade 7–8, 'extra' = technique/support.

import quadratics from './quadratics.js';
import expandFactorise from './expand-factorise.js';
import indices from './indices.js';
import simultaneous from './simultaneous.js';
import rearranging from './rearranging.js';
import inequalities from './inequalities.js';
import straightLines from './straight-lines.js';
import sequences from './sequences.js';
import examTechnique from './exam-technique.js';

export const LESSONS = [
  { group: 'extra', lesson: examTechnique },
  { group: 'core', lesson: expandFactorise },
  { group: 'core', lesson: quadratics },
  { group: 'core', lesson: indices },
  { group: 'core', lesson: simultaneous },
  { group: 'core', lesson: rearranging },
  { group: 'core', lesson: inequalities },
  { group: 'core', lesson: straightLines },
  { group: 'core', lesson: sequences },
].map(({ group, lesson }) => ({ ...lesson, group }));

export const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export const GROUPS = [
  { id: 'core', title: 'Grade 6 core', note: 'Secure these first: they carry the most marks.' },
  { id: 'push', title: 'Grade 7–8 push', note: 'Once the core is green, these lift you into 7 and 8.' },
  { id: 'extra', title: 'Technique', note: '' },
];
