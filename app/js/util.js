// Small DOM and date helpers shared by every view.

export const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// h('div', { class: 'x', onclick: fn }, 'text', child) -> Element
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function uid(prefix) {
  return `${prefix}-${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

const pad = (n) => String(n).padStart(2, '0');

// Local date as YYYY-MM-DD (the device is in the UK, so this is UK local time).
export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ISO timestamp with the local UTC offset, e.g. 2026-10-03T19:42:00+01:00
export function nowISO(d = new Date()) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${todayISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

export function parseDate(s) {
  // 'YYYY-MM-DD' -> local midnight
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

export function ts(s) {
  const t = Date.parse(s || '');
  return Number.isFinite(t) ? t : 0;
}

export function fmtClock(secs) {
  secs = Math.max(0, Math.round(secs));
  const hh = Math.floor(secs / 3600);
  const mm = Math.floor((secs % 3600) / 60);
  const ss = secs % 60;
  return hh ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}

export function fmtHours(secs) {
  const h = secs / 3600;
  if (h < 1) return `${Math.round(secs / 60)} min`;
  return `${h.toFixed(1)} h`;
}

export function fmtDate(dateStr, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!dateStr) return '';
  const d = dateStr.length === 10 ? parseDate(dateStr) : new Date(dateStr);
  return d.toLocaleDateString('en-GB', opts);
}

export function questionLabel(q) {
  if (q.part == null || q.part === '') return q.number;
  return /^\d/.test(q.part) ? `${q.number}.${q.part}` : `${q.number}(${q.part})`;
}

let toastTimer;
export function toast(msg, kind = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = `toast ${kind}`), 3200);
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Modal sheet that resolves with the value of the clicked button.
export function sheet({ title, body, actions }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const close = (v) => {
      wrap.remove();
      prev?.focus?.();
      resolve(v);
    };
    const wrap = h('div', { class: 'sheet-wrap', onclick: (e) => e.target === wrap && close(null) },
      h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('h2', { class: 'sheet-title' }, title),
        typeof body === 'string' ? h('p', null, body) : body,
        h('div', { class: 'sheet-actions' },
          actions.map((a) => h('button', { class: `btn ${a.kind || ''}`, onclick: () => close(a.value) }, a.label)))));
    wrap.addEventListener('keydown', (e) => e.key === 'Escape' && close(null));
    document.body.appendChild(wrap);
    wrap.querySelector('.sheet-actions .btn:last-child')?.focus();
  });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function shareOrDownload(blob, name, text) {
  const file = new File([blob], name, { type: 'application/zip' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name, text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  downloadBlob(blob, name);
  return 'downloaded';
}
