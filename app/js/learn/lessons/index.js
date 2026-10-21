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
import percentages from './percentages.js';
import proportion from './proportion.js';
import ratio from './ratio.js';
import standardForm from './standard-form.js';
import surds from './surds.js';
import bounds from './bounds.js';
import pythagTrig from './pythag-trig.js';
import circlesVolume from './circles-volume.js';
import sineCosine from './sine-cosine.js';
import similarity from './similarity.js';
import probability from './probability.js';
import treeDiagrams from './tree-diagrams.js';
import statistics from './statistics.js';
import histograms from './histograms.js';
import completingSquare from './completing-square.js';
import functions from './functions.js';
import algebraicFractions from './algebraic-fractions.js';
import proof from './proof.js';
import iteration from './iteration.js';
import recurring from './recurring.js';
import circleTheorems from './circle-theorems.js';
import vectors from './vectors.js';
import compoundMeasures from './compound-measures.js';
import anglesPolygons from './angles-polygons.js';
import numberSkills from './number-skills.js';
import circleEquation from './circle-equation.js';
import graphs from './graphs.js';
import examTechnique from './exam-technique.js';

export const LESSONS = [
  { group: 'extra', lesson: examTechnique },
  { group: 'core', lesson: numberSkills },
  { group: 'core', lesson: expandFactorise },
  { group: 'core', lesson: quadratics },
  { group: 'core', lesson: indices },
  { group: 'core', lesson: simultaneous },
  { group: 'core', lesson: rearranging },
  { group: 'core', lesson: inequalities },
  { group: 'core', lesson: straightLines },
  { group: 'core', lesson: sequences },
  { group: 'core', lesson: percentages },
  { group: 'core', lesson: proportion },
  { group: 'core', lesson: ratio },
  { group: 'core', lesson: standardForm },
  { group: 'core', lesson: compoundMeasures },
  { group: 'core', lesson: anglesPolygons },
  { group: 'core', lesson: pythagTrig },
  { group: 'core', lesson: circlesVolume },
  { group: 'core', lesson: probability },
  { group: 'core', lesson: treeDiagrams },
  { group: 'core', lesson: statistics },
  { group: 'push', lesson: completingSquare },
  { group: 'push', lesson: functions },
  { group: 'push', lesson: algebraicFractions },
  { group: 'push', lesson: proof },
  { group: 'push', lesson: iteration },
  { group: 'push', lesson: recurring },
  { group: 'push', lesson: surds },
  { group: 'push', lesson: bounds },
  { group: 'push', lesson: circleTheorems },
  { group: 'push', lesson: circleEquation },
  { group: 'push', lesson: sineCosine },
  { group: 'push', lesson: similarity },
  { group: 'push', lesson: vectors },
  { group: 'push', lesson: graphs },
  { group: 'push', lesson: histograms },
].map(({ group, lesson }) => ({ ...lesson, group }));

export const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export const GROUPS = [
  { id: 'core', title: 'Grade 6 core', note: 'Secure these first: they carry the most marks.' },
  { id: 'push', title: 'Grade 7–8 push', note: 'Once the core is green, these lift you into 7 and 8.' },
  { id: 'extra', title: 'Technique', note: '' },
];
