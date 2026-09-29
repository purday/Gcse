// The player (app/js/progress.js) and the tutor helper (tutor/gcse_tutor.py) must
// compute identical topic mastery from the same markLog. Random logs, both sides.
// Run: node --experimental-default-type=module tests/topic_parity.mjs
import { execFileSync } from 'node:child_process';
import { recomputeTopics } from '../app/js/progress.js';

const codes = ['A18', 'N8', 'G22', 'S3'];
let seed = 7;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
let fails = 0;
for (let trial = 0; trial < 200; trial++) {
  const markLog = [];
  const verdicts = [];
  const n = 1 + rnd(25);
  for (let i = 0; i < n; i++) {
    const max = 1 + rnd(5);
    const date = `2026-10-${String(1 + rnd(20)).padStart(2, '0')}`;
    markLog.push({ id: `p${rnd(4)}#1:q${i}`, date, topics: [codes[rnd(4)], ...(rnd(3) ? [] : [codes[rnd(4)]])], awarded: rnd(max + 1), max });
    if (!rnd(4)) verdicts.push({ id: `p#${i}`, date, topic: codes[rnd(4)], verdict: ['weak', 'developing', 'secure'][rnd(3)] });
  }
  const js = recomputeTopics({ topics: {}, markLog, verdicts }).topics;
  const py = JSON.parse(execFileSync('python3', ['-c', `
import json, sys
sys.path.insert(0, 'tutor')
import gcse_tutor as T
p = json.loads(sys.stdin.read())
print(json.dumps(T.recompute_topics(p)["topics"]))`], { input: JSON.stringify({ topics: {}, markLog, verdicts }) }).toString());
  const norm = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, Object.keys(o[k]).sort().map((f) => [f, o[k][f]])]));
  if (norm(js) !== norm(py)) {
    fails++;
    if (fails < 3) console.log('MISMATCH', JSON.stringify(markLog), '\nJS', JSON.stringify(js), '\nPY', JSON.stringify(py));
  }
}
console.log(fails ? `  ✗ ${fails}/200 random logs differ` : '  ✓ player and tutor compute identical topic mastery (200 random logs)');
if (fails) process.exit(1);

// Regression: two markings made from the same (stale) progress snapshot must not
// overwrite each other once merged (the bug the code review found).
const scenario = JSON.parse(execFileSync('python3', ['-c', `
import json, sys
sys.path.insert(0, 'tutor')
import gcse_tutor as T
base = {"topics": {}, "updatedAt": "2026-10-01T10:00:00+01:00"}
fa = {"forPackId": "A", "markedAt": "2026-10-02T18:00:00+01:00", "score": 2, "maxScore": 2, "gradeEstimate": {"grade": "6"},
      "questions": [{"questionId": "q1", "marksAwarded": 2, "maxMarks": 2, "topics": ["A18"], "lost": []}], "topics": []}
fb = {"forPackId": "B", "markedAt": "2026-10-02T19:00:00+01:00", "score": 0, "maxScore": 3, "gradeEstimate": {"grade": "6"},
      "questions": [{"questionId": "q1", "marksAwarded": 0, "maxMarks": 3, "topics": ["G22"], "lost": [{"marks": 3, "type": "knowledge", "reason": "x"}]}], "topics": []}
m = {"type": "lesson", "source": "generated", "title": "t"}
print(json.dumps([T.apply_marking(base, fa, m), T.apply_marking(base, fb, m)]))`]).toString());
const [pa, pb] = scenario;
const union = [...pa.markLog, ...pb.markLog.filter((e) => !pa.markLog.some((x) => x.id === e.id))];
const merged = recomputeTopics({ topics: { ...pa.topics, ...pb.topics }, markLog: union, verdicts: [] }).topics;
const okScenario = merged.A18?.correctDates.length === 1 && merged.G22?.status === 'red';
console.log(okScenario ? '  ✓ markings from a stale snapshot merge without losing either' : `  ✗ stale snapshot merge lost data ${JSON.stringify(merged)}`);
if (!okScenario) process.exit(1);
