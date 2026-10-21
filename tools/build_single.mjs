// Builds dist/gcse-maths.html: the whole player in ONE file (code, styles, fonts,
// KaTeX, exam config, topic list) that opens straight from disk with no server.
// It has everything except the offline service worker, which only works on a website.
// Run: node tools/build_single.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const read = (p) => readFileSync(join(app, p));
const dataUri = (p, type) => `data:${type};base64,${read(p).toString('base64')}`;
// Inline <script> must never contain "</script".
const safeJs = (s) => s.replace(/<\/script/gi, '<\\/script');

// App code: one ES module with every import (including the vendored marked) bundled in.
const bundled = (await build({
  entryPoints: [join(app, 'js/main.js')], bundle: true, format: 'esm', minify: true,
  target: 'es2020', write: false, legalComments: 'none',
})).outputFiles[0].text;

// Styles with fonts as data URIs. KaTeX lists woff2/woff/ttf; woff2 alone is enough.
const appCss = read('css/app.css').toString()
  .replace(/url\("\.\.\/fonts\/([^"]+\.woff2)"\)/g, (_, f) => `url("${dataUri(`fonts/${f}`, 'font/woff2')}")`);
const katexCss = read('vendor/katex/katex.min.css').toString()
  .replace(/src:url\(fonts\/([^)]+)\.woff2\) format\("woff2"\)(,url\([^)]+\) format\("[^"]+"\))*/g,
    (_, f) => `src:url(${dataUri(`vendor/katex/fonts/${f}.woff2`, 'font/woff2')}) format("woff2")`);

// The JSON files the app fetches, answered from memory instead of the network.
const files = {};
for (const f of ['config/exam.json', 'data/topics.json', 'data/topicmap.json', 'library/index.json']) {
  if (existsSync(join(app, f))) files[f] = read(f).toString();
}
const shim = `(() => {
  const files = ${JSON.stringify(files)};
  const real = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const key = url.replace(/^\\.\\//, '').split('?')[0];
    if (Object.prototype.hasOwnProperty.call(files, key)) return Promise.resolve(new Response(files[key], { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return real(input, init);
  };
})();`;

const html = read('index.html').toString()
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${dataUri('icons/icon-192.png', 'image/png')}" type="image/png">`)
  .replace(/<link rel="apple-touch-icon"[^>]*>/, `<link rel="apple-touch-icon" href="${dataUri('icons/apple-touch-icon.png', 'image/png')}">`)
  .replace(/<link rel="stylesheet" href="vendor\/katex\/katex\.min\.css">/, () => `<style>${katexCss}</style>`)
  .replace(/<link rel="stylesheet" href="css\/app\.css">/, () => `<style>${appCss}</style>`)
  .replace(/<script src="js\/build-info\.js" defer><\/script>/, () => `<script>${safeJs(read('js/build-info.js').toString())}</script>\n  <script>${safeJs(shim)}</script>`)
  .replace(/<script src="vendor\/jszip\.min\.js" defer><\/script>/, () => `<script>${safeJs(read('vendor/jszip.min.js').toString())}</script>`)
  .replace(/<script src="vendor\/katex\/katex\.min\.js" defer><\/script>/, () => `<script>${safeJs(read('vendor/katex/katex.min.js').toString())}</script>`)
  .replace(/<script type="module" src="js\/main\.js"><\/script>/, () => `<script type="module">${safeJs(bundled)}</script>`);

for (const left of ['href="css/', 'href="vendor/', 'src="js/', 'src="vendor/', 'manifest.webmanifest']) {
  if (html.includes(left)) throw new Error(`single-file build still references ${left}`);
}
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/gcse-maths.html'), html);
console.log(`dist/gcse-maths.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
