// Generates app/sw.js with a content hash of the app shell so each deploy
// refreshes the offline cache. Run after changing anything in app/.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const skip = new Set(['sw.js', '_headers', 'robots.txt', '_redirects', 'js/build-info.js']);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'library' ? [] : walk(p);
    return [p];
  });
}
const files = walk(app).map((p) => relative(app, p).split('\\').join('/')).filter((f) => !skip.has(f)).sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(app, f)));
const version = hash.digest('hex').slice(0, 12);
const assets = ['./', ...files.map((f) => `./${f}`), './js/build-info.js', './library/index.json'];
const sw = readFileSync(join(root, 'tools/sw.template.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__ASSETS__', JSON.stringify(assets, null, 1));
writeFileSync(join(app, 'sw.js'), sw);
// Expose the build id to the page for the About line.
writeFileSync(join(app, 'js/build-info.js'), `window.__BUILD__ = '${version}';\n`);
console.log(`sw.js version ${version} (${assets.length} shell files)`);
