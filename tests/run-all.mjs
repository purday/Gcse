// npm test: converter test, then the full end-to-end browser test.
import { execFileSync } from 'node:child_process';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
console.log('▸ Paper converter (synthetic AQA layout)');
run('python3', ['tests/test_pipeline.py']);
console.log('\n▸ Topic mastery: player and tutor agree');
run('node', ['--experimental-default-type=module', 'tests/topic_parity.mjs']);
console.log('\n▸ Sample packs');
run('python3', ['tools/make_samples.py']);
run('node', ['tests/e2e.mjs', ...process.argv.slice(2)]);
