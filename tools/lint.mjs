// npm run lint: syntax-check every browser module, Node script and Python file.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
const list = (dir, ext) => readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`);
let bad = 0;
const check = (cmd, args, file) => {
  try { execFileSync(cmd, args, { stdio: 'pipe' }); } catch (e) { bad++; console.error(`✗ ${file}\n${e.stderr}`); }
};
for (const f of [...list('app/js', '.js'), 'app/sw.js']) check('node', ['--experimental-default-type=module', '--check', f], f);
for (const f of [...list('tools', '.mjs'), ...list('tests', '.mjs')]) check('node', ['--check', f], f);
const py = [...list('tools', '.py'), ...list('tests', '.py'), ...list('tutor', '.py')];
check('python3', ['-m', 'py_compile', ...py], 'python files');
console.log(bad ? `${bad} file(s) failed` : `lint ok (${py.length} Python files, all JS modules)`);
process.exit(bad ? 1 : 0);
