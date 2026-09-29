// Hand-rolled SVG charts (no library): score line with grade boundary
// reference lines, and daily study-hours bars. Colours come from CSS tokens.

import { h, fmtDate } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
  for (const k of kids) if (k != null) el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
  return el;
}

function tooltip(host) {
  const tip = h('div', { class: 'viz-tip', role: 'status', hidden: true });
  host.appendChild(tip);
  return {
    show(x, y, html) {
      tip.innerHTML = html;
      tip.hidden = false;
      const hr = host.getBoundingClientRect();
      const tw = tip.offsetWidth;
      tip.style.left = `${Math.max(0, Math.min(hr.width - tw, x - tw / 2))}px`;
      tip.style.top = `${Math.max(0, y - tip.offsetHeight - 10)}px`;
    },
    hide() { tip.hidden = true; },
  };
}

// points: [{ date, pct, label }] ; refs: [{ grade, pct }]
export function scoreChart(points, refs, { width = 640, height = 260 } = {}) {
  const host = h('div', { class: 'viz' });
  const m = { t: 14, r: 64, b: 28, l: 36 };
  const W = width - m.l - m.r;
  const H = height - m.t - m.b;
  const yMin = 0;
  const yMax = 100;
  const y = (v) => m.t + H - ((v - yMin) / (yMax - yMin)) * H;
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Full paper scores over time with grade boundary lines', class: 'viz-svg' });

  for (const v of [0, 25, 50, 75, 100]) {
    svg.appendChild(s('line', { x1: m.l, x2: m.l + W, y1: y(v), y2: y(v), class: 'viz-grid' }));
    svg.appendChild(s('text', { x: m.l - 6, y: y(v) + 4, class: 'viz-axis', 'text-anchor': 'end' }, `${v}%`));
  }
  for (const r of refs) {
    svg.appendChild(s('line', { x1: m.l, x2: m.l + W, y1: y(r.pct), y2: y(r.pct), class: `viz-ref g${r.grade}` }));
    svg.appendChild(s('text', { x: m.l + W + 6, y: y(r.pct) + 4, class: 'viz-ref-label' }, `Grade ${r.grade}`));
  }

  if (!points.length) {
    svg.appendChild(s('text', { x: m.l + W / 2, y: m.t + H / 2, class: 'viz-empty', 'text-anchor': 'middle' }, 'Sit a full paper to start your line'));
    host.appendChild(svg);
    return host;
  }

  const t0 = +new Date(points[0].date);
  const t1 = +new Date(points[points.length - 1].date);
  const span = Math.max(t1 - t0, 86400000 * 6);
  const x = (d) => m.l + 10 + ((+new Date(d) - t0) / span) * (W - 20);

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');
  svg.appendChild(s('path', { d: `${path} L${x(points[points.length - 1].date)},${y(0)} L${x(points[0].date)},${y(0)} Z`, class: 'viz-area' }));
  svg.appendChild(s('path', { d: path, class: 'viz-line' }));

  const ticks = points.length <= 6 ? points : [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];
  for (const p of ticks) svg.appendChild(s('text', { x: x(p.date), y: height - 8, class: 'viz-axis', 'text-anchor': 'middle' }, fmtDate(p.date.slice(0, 10), { day: 'numeric', month: 'short' })));

  const tip = tooltip(host);
  points.forEach((p, i) => {
    const last = i === points.length - 1;
    svg.appendChild(s('circle', { cx: x(p.date), cy: y(p.pct), r: last ? 5.5 : 4, class: `viz-dot ${last ? 'end' : ''}` }));
    const hit = s('circle', { cx: x(p.date), cy: y(p.pct), r: 16, class: 'viz-hit', tabindex: '0', 'aria-label': `${p.label}: ${p.pct}%` });
    const on = () => {
      const r = svg.getBoundingClientRect();
      const k = r.width / width;
      tip.show(x(p.date) * k, y(p.pct) * k, `<strong>${p.pct}%</strong> · ${p.score}/${p.max}<br>${p.label}<br>${fmtDate(p.date.slice(0, 10))}`);
    };
    hit.addEventListener('pointerenter', on);
    hit.addEventListener('focus', on);
    hit.addEventListener('pointerleave', tip.hide);
    hit.addEventListener('blur', tip.hide);
    svg.appendChild(hit);
  });
  if (points.length) {
    const p = points[points.length - 1];
    const right = x(p.date) > m.l + W * 0.75;
    svg.appendChild(s('text', { x: x(p.date) + (right ? -10 : 10), y: y(p.pct) + 4, class: 'viz-end-label', 'text-anchor': right ? 'end' : 'start' }, `${p.pct}%`));
  }
  host.appendChild(svg);
  return host;
}

// days: [{ date, secs }] oldest first; goalSecs draws a reference line.
export function hoursChart(days, goalSecs, { width = 640, height = 150 } = {}) {
  const host = h('div', { class: 'viz' });
  const m = { t: 12, r: 44, b: 24, l: 30 };
  const W = width - m.l - m.r;
  const H = height - m.t - m.b;
  const maxH = Math.max(3, ...days.map((d) => d.secs / 3600));
  const y = (hrs) => m.t + H - (hrs / maxH) * H;
  const bw = W / days.length;
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Hours studied per day, last 14 days', class: 'viz-svg' });
  for (const v of [0, 1, 2, 3].filter((v) => v <= maxH)) {
    svg.appendChild(s('line', { x1: m.l, x2: m.l + W, y1: y(v), y2: y(v), class: 'viz-grid' }));
    svg.appendChild(s('text', { x: m.l - 6, y: y(v) + 4, class: 'viz-axis', 'text-anchor': 'end' }, `${v}h`));
  }
  const tip = tooltip(host);
  days.forEach((d, i) => {
    const hrs = d.secs / 3600;
    const bx = m.l + i * bw + 2;
    const w = Math.max(2, bw - 4);
    const top = y(hrs);
    const hgt = Math.max(0, y(0) - top);
    if (hgt > 0) {
      const r = Math.min(4, w / 2, hgt);
      svg.appendChild(s('path', {
        d: `M${bx},${y(0)} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + w - r} Q${bx + w},${top} ${bx + w},${top + r} V${y(0)} Z`,
        class: `viz-bar ${hrs * 3600 >= goalSecs ? 'met' : ''}`,
      }));
    }
    if (i % 2 === (days.length - 1) % 2) svg.appendChild(s('text', { x: bx + w / 2, y: height - 8, class: 'viz-axis', 'text-anchor': 'middle' }, fmtDate(d.date, { day: 'numeric' })));
    const hit = s('rect', { x: m.l + i * bw, y: m.t, width: bw, height: H, class: 'viz-hit', tabindex: '0', 'aria-label': `${fmtDate(d.date)}: ${hrs.toFixed(1)} hours` });
    const on = () => {
      const rr = svg.getBoundingClientRect();
      const k = rr.width / width;
      tip.show((bx + w / 2) * k, top * k, `<strong>${hrs.toFixed(1)} h</strong><br>${fmtDate(d.date)}`);
    };
    hit.addEventListener('pointerenter', on);
    hit.addEventListener('focus', on);
    hit.addEventListener('pointerleave', tip.hide);
    hit.addEventListener('blur', tip.hide);
    svg.appendChild(hit);
  });
  const gy = y(goalSecs / 3600);
  svg.appendChild(s('line', { x1: m.l, x2: m.l + W, y1: gy, y2: gy, class: 'viz-ref goal' }));
  svg.appendChild(s('text', { x: m.l + W + 6, y: gy + 4, class: 'viz-ref-label' }, 'Goal'));
  host.appendChild(svg);
  return host;
}
