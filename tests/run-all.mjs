// npm test: converter test, Learn content checks, then the full end-to-end browser test.
import { execFileSync } from 'node:child_process';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
console.log('▸ Paper converter (synthetic AQA layout)');
run('python3', ['tests/test_pipeline.py']);
console.log('\n▸ Topic mastery: player and tutor agree');
run('node', ['--experimental-default-type=module', 'tests/topic_parity.mjs']);
console.log('\n▸ Learn: answer checker, daily plan, every lesson template');
run('node', ['--experimental-default-type=module', 'tests/learn_engine.mjs']);
run('node', ['--experimental-default-type=module', 'tests/learn_plan.mjs']);
run('node', ['--experimental-default-type=module', 'tests/learn_content.mjs']);
run('python3', ['tests/test_tutor_learn.py']);
console.log('\n▸ Sample packs');
run('python3', ['tools/make_samples.py']);
run('node', ['tests/e2e.mjs', ...process.argv.slice(2)]);
