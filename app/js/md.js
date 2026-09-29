// Markdown + LaTeX rendering for prompts, worked examples and feedback.
// Pack content is treated as untrusted: raw HTML is shown as text, links must
// be http(s), and images may only come from the pack itself.

import { marked } from '../vendor/marked.esm.js';
import { esc } from './util.js';

let resolveImage = null;

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    html(token) {
      return esc(token.text ?? token.raw ?? '');
    },
    link(token) {
      const text = this.parser.parseInline(token.tokens);
      if (!/^https?:\/\//i.test(token.href || '')) return text;
      return `<a href="${esc(token.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image(token) {
      const url = resolveImage ? resolveImage(token.href) : null;
      if (!url) return `<span class="img-missing">Image missing: ${esc(token.href)}</span>`;
      return `<img class="md-img" src="${esc(url)}" alt="${esc(token.text || '')}">`;
    },
  },
});

function inlineClose(src, from) {
  for (let j = from; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') { j++; continue; }
    if (c === '\n' && src[j + 1] === '\n') return -1;
    if (c === '$') return j > from ? j : -1;
  }
  return -1;
}

function extractMath(src) {
  const math = [];
  let text = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && src[i + 1] === '$') {
      text += '&#36;';
      i += 2;
      continue;
    }
    if (c === '$') {
      const display = src[i + 1] === '$';
      const close = display ? src.indexOf('$$', i + 2) : inlineClose(src, i + 1);
      if (close > -1) {
        let end = close + (display ? 2 : 1);
        // Keep punctuation straight after inline maths on the same line as it.
        const punct = !display && /[,.;:!?)]/.test(src[end] || '') ? src[end] : '';
        math.push({ tex: src.slice(i + (display ? 2 : 1), close), display, punct });
        if (punct) end++;
        text += `@@M${math.length - 1}@@`;
        i = end;
        continue;
      }
    }
    text += c;
    i++;
  }
  return { text, math };
}

export function tex(src, display = false) {
  try {
    return window.katex.renderToString(src, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml' });
  } catch {
    return `<code>${esc(src)}</code>`;
  }
}

export function renderMarkdown(src, imageResolver) {
  if (!src) return '';
  const { text, math } = extractMath(String(src));
  resolveImage = imageResolver || null;
  let html;
  try {
    html = marked.parse(text);
  } finally {
    resolveImage = null;
  }
  return html.replace(/@@M(\d+)@@/g, (_, n) => {
    const m = math[n];
    return m.punct ? `<span class="nowrap">${tex(m.tex, false)}${esc(m.punct)}</span>` : tex(m.tex, m.display);
  });
}

// Short single-line markdown (no surrounding <p>).
export function renderInline(src) {
  const html = renderMarkdown(src);
  return html.replace(/^<p>([\s\S]*)<\/p>\s*$/, '$1');
}
