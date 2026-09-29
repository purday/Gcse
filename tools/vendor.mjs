// Copies third-party browser libraries and fonts from node_modules into app/vendor
// so the player works fully offline (no CDN at runtime).
import { cpSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const app = join(root, 'app');

const copy = (from, to) => { mkdirSync(dirname(join(app, to)), { recursive: true }); copyFileSync(join(nm, from), join(app, to)); };

copy('jszip/dist/jszip.min.js', 'vendor/jszip.min.js');
copy('marked/lib/marked.esm.js', 'vendor/marked.esm.js');
copy('katex/dist/katex.min.js', 'vendor/katex/katex.min.js');
copy('katex/dist/katex.min.css', 'vendor/katex/katex.min.css');
mkdirSync(join(app, 'vendor/katex/fonts'), { recursive: true });
for (const f of readdirSync(join(nm, 'katex/dist/fonts')).filter((f) => f.endsWith('.woff2'))) {
  copy(`katex/dist/fonts/${f}`, `vendor/katex/fonts/${f}`);
}

const fonts = [
  ['@fontsource/atkinson-hyperlegible-next/files', ['atkinson-hyperlegible-next-latin-400-normal.woff2', 'atkinson-hyperlegible-next-latin-700-normal.woff2', 'atkinson-hyperlegible-next-latin-400-italic.woff2']],
  ['@fontsource/bricolage-grotesque/files', ['bricolage-grotesque-latin-600-normal.woff2', 'bricolage-grotesque-latin-800-normal.woff2']],
  ['@fontsource/ibm-plex-mono/files', ['ibm-plex-mono-latin-500-normal.woff2']],
];
for (const [dir, files] of fonts) for (const f of files) copy(`${dir}/${f}`, `fonts/${f}`);
console.log('vendored libraries and fonts into app/');
