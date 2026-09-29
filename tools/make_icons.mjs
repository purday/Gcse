// Renders the app icons with Chromium so they use the app's own display font.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const font = readFileSync('app/fonts/bricolage-grotesque-latin-800-normal.woff2').toString('base64');
const html = (size, pad, radius) => `<!doctype html><html><head><style>
@font-face{font-family:B;src:url(data:font/woff2;base64,${font}) format('woff2');}
html,body{margin:0;width:${size}px;height:${size}px;}
body{background:#2046c8;display:grid;place-items:center;border-radius:${radius}px;overflow:hidden;
 background-image:linear-gradient(rgba(255,255,255,.07) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.07) 2px,transparent 2px);background-size:${size / 8}px ${size / 8}px;}
.box{border:${size * 0.035}px solid #fff;border-radius:${size * 0.06}px;padding:${size * 0.02}px ${size * 0.07}px ${size * 0.05}px;color:#fff;font:800 ${size * (0.42 - pad)}px/1 B;letter-spacing:-0.02em;}
sup{font-size:.55em;vertical-align:.75em;margin-left:.02em}
</style></head><body><div class="box">x<sup>2</sup></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad, radius] of [['icon-192', 192, 0, 0], ['icon-512', 512, 0, 0], ['icon-maskable-512', 512, 0.1, 0], ['apple-touch-icon', 180, 0, 0]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, pad, radius));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `app/icons/${name}.png`, omitBackground: false });
}
await browser.close();
console.log('icons written');
