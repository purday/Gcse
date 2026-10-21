// Exam-style SVG diagrams built from numbers (trusted: our own generators).
// Black lines on white, Arial labels, like an AQA paper.

const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t = (x, y, s, opts = '') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${FONT} font-size="15" ${opts}>${esc(s)}</text>`;
const wrap = (w, h, body, note) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><rect width="${w}" height="${h}" fill="#fff"/>${body}${note ? t(w - 8, h - 8, 'Not drawn accurately', 'font-size="11" fill="#444" text-anchor="end"') : ''}</svg>`;

function fit(points, w, h, pad) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const s = Math.min((w - 2 * pad) / (maxX - minX || 1), (h - 2 * pad) / (maxY - minY || 1));
  const ox = (w - (maxX - minX) * s) / 2;
  const oy = (h - (maxY - minY) * s) / 2;
  return (p) => [ox + (p[0] - minX) * s, h - (oy + (p[1] - minY) * s)];
}

// Triangle from three points. labels: vertex names; sides: {AB: '7 cm'}; angles: {B: '78°'}; right: 'B'
// segments: extra lines in the same coordinates as pts, e.g. [{ a: [x, y], b: [x, y], na: 'D', nb: 'E', label: '5 cm', draw: true }].
// draw: false places only the label (for a length along part of a side).
export function triangle({ pts, names = ['A', 'B', 'C'], sides = {}, angles = {}, right = null, segments = [], note = true, w = 340, h = 230 }) {
  const map = fit(pts, w, h - 14, 34);
  const P = pts.map(map);
  const idx = Object.fromEntries(names.map((n, i) => [n, i]));
  const cx = (P[0][0] + P[1][0] + P[2][0]) / 3;
  const cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
  let body = `<polygon points="${P.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#000" stroke-width="2"/>`;
  names.forEach((n, i) => {
    const [x, y] = P[i];
    const dx = x - cx; const dy = y - cy; const L = Math.hypot(dx, dy) || 1;
    body += t(x + (dx / L) * 16 - 5, y + (dy / L) * 16 + 5, n, 'font-style="italic"');
  });
  for (const [k, label] of Object.entries(sides)) {
    const a = P[idx[k[0]]]; const b = P[idx[k[1]]];
    const mx = (a[0] + b[0]) / 2; const my = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]); let ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    if ((mx + nx - cx) ** 2 + (my + ny - cy) ** 2 < (mx - cx) ** 2 + (my - cy) ** 2) { nx = -nx; ny = -ny; }
    body += t(mx + nx * 16, my + ny * 16 + 5, label, 'text-anchor="middle"');
  }
  for (const [n, label] of Object.entries(angles)) {
    const i = idx[n];
    const v = P[i]; const a = P[(i + 1) % 3]; const b = P[(i + 2) % 3];
    const ua = [(a[0] - v[0]), (a[1] - v[1])]; const ub = [(b[0] - v[0]), (b[1] - v[1])];
    const la = Math.hypot(...ua); const lb = Math.hypot(...ub);
    const r = 24;
    const s1 = [v[0] + (ua[0] / la) * r, v[1] + (ua[1] / la) * r];
    const s2 = [v[0] + (ub[0] / lb) * r, v[1] + (ub[1] / lb) * r];
    const cross = ua[0] * ub[1] - ua[1] * ub[0];
    body += `<path d="M ${s1[0].toFixed(1)} ${s1[1].toFixed(1)} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${s2[0].toFixed(1)} ${s2[1].toFixed(1)}" fill="none" stroke="#000" stroke-width="1.5"/>`;
    const bis = [ua[0] / la + ub[0] / lb, ua[1] / la + ub[1] / lb]; const lbis = Math.hypot(...bis) || 1;
    body += t(v[0] + (bis[0] / lbis) * 42 - 12, v[1] + (bis[1] / lbis) * 42 + 5, label, 'font-size="14"');
  }
  for (const sg of segments) {
    const a = map(sg.a); const b = map(sg.b);
    if (sg.draw !== false) body += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#000" stroke-width="2"/>`;
    for (const [p, n] of [[a, sg.na], [b, sg.nb]]) {
      if (!n) continue;
      const dx = p[0] - cx; const dy = p[1] - cy; const L = Math.hypot(dx, dy) || 1;
      body += t(p[0] + (dx / L) * 16 - 5, p[1] + (dy / L) * 16 + 5, n, 'font-style="italic"');
    }
    if (sg.label) {
      const mx = (a[0] + b[0]) / 2; const my = (a[1] + b[1]) / 2;
      let nx = -(b[1] - a[1]); let ny = b[0] - a[0];
      const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      if ((mx + nx - cx) ** 2 + (my + ny - cy) ** 2 < (mx - cx) ** 2 + (my - cy) ** 2) { nx = -nx; ny = -ny; }
      body += t(mx + nx * 16, my + ny * 16 + 5, sg.label, 'text-anchor="middle"');
    }
  }
  if (right) {
    const i = idx[right]; const v = P[i]; const a = P[(i + 1) % 3]; const b = P[(i + 2) % 3];
    const ua = [(a[0] - v[0]), (a[1] - v[1])]; const ub = [(b[0] - v[0]), (b[1] - v[1])];
    const la = Math.hypot(...ua); const lb = Math.hypot(...ub); const s = 13;
    const p1 = [v[0] + (ua[0] / la) * s, v[1] + (ua[1] / la) * s]; const p3 = [v[0] + (ub[0] / lb) * s, v[1] + (ub[1] / lb) * s];
    const p2 = [p1[0] + (ub[0] / lb) * s, p1[1] + (ub[1] / lb) * s];
    body += `<polyline points="${[p1, p2, p3].map((p) => p.map((q) => q.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#000" stroke-width="1.5"/>`;
  }
  return wrap(w, h, body, note);
}

// Right-angled triangle with the right angle at B, legs along axes.
export function rightTriangle({ base, height, sides = {}, angles = {}, names = ['A', 'B', 'C'], note = true }) {
  // Very thin triangles squash the labels together; it is marked "not drawn accurately" anyway.
  const hDraw = Math.min(Math.max(height, base * 0.32), base * 2.2);
  return triangle({ pts: [[0, hDraw], [0, 0], [base, 0]], names, sides, angles, right: names[1], note });
}

// Triangle from two sides and the included angle at B (for sine/cosine rule pictures).
export function sasTriangle({ ab, bc, angleB, names = ['A', 'B', 'C'], sides = {}, angles = {}, note = true }) {
  const r = (angleB * Math.PI) / 180;
  return triangle({ pts: [[ab * Math.cos(r), ab * Math.sin(r)], [0, 0], [bc, 0]], names, sides, angles, note });
}

export function sector({ angle, label = '', radiusLabel = '', note = true, w = 300, h = 220 }) {
  const cx = w / 2; const cy = angle > 180 ? h / 2 : h - 40; const R = angle > 180 ? 80 : 120;
  const a0 = -Math.PI / 2 - (angle * Math.PI) / 360; const a1 = a0 + (angle * Math.PI) / 180;
  const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)]; const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
  const large = angle > 180 ? 1 : 0;
  let body = `<path d="M ${cx} ${cy} L ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${R} ${R} 0 ${large} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Z" fill="none" stroke="#000" stroke-width="2"/>`;
  body += `<path d="M ${(cx + 22 * Math.cos(a0)).toFixed(1)} ${(cy + 22 * Math.sin(a0)).toFixed(1)} A 22 22 0 ${large} 1 ${(cx + 22 * Math.cos(a1)).toFixed(1)} ${(cy + 22 * Math.sin(a1)).toFixed(1)}" fill="none" stroke="#000" stroke-width="1.5"/>`;
  const mid = (a0 + a1) / 2;
  body += t(cx + 40 * Math.cos(mid) - 12, cy + 40 * Math.sin(mid) + 5, label);
  body += t((cx + p0[0]) / 2 - 44, (cy + p0[1]) / 2, radiusLabel);
  body += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#000"/>`;
  return wrap(w, h, body, note);
}

// Number line with an inequality: lo/hi may be null; inc = filled circle.
export function numberLine({ min, max, lo = null, loInc = false, hi = null, hiInc = false, w = 340, h = 80 }) {
  const x = (v) => 20 + ((v - min) / (max - min)) * (w - 40);
  let body = `<line x1="10" y1="40" x2="${w - 10}" y2="40" stroke="#000" stroke-width="1.5"/>`;
  for (let v = min; v <= max; v++) {
    body += `<line x1="${x(v)}" y1="34" x2="${x(v)}" y2="46" stroke="#000" stroke-width="1.2"/>` + t(x(v), 66, v, 'text-anchor="middle" font-size="13"');
  }
  const y = 22;
  const dot = (v, inc) => `<circle cx="${x(v)}" cy="${y}" r="6" fill="${inc ? '#000' : '#fff'}" stroke="#000" stroke-width="2"/>`;
  const from = lo != null ? x(lo) : 12; const to = hi != null ? x(hi) : w - 12;
  body += `<line x1="${from}" y1="${y}" x2="${to}" y2="${y}" stroke="#000" stroke-width="2.5"/>`;
  if (lo == null) body += `<polygon points="10,${y} 20,${y - 6} 20,${y + 6}" fill="#000"/>`;
  if (hi == null) body += `<polygon points="${w - 10},${y} ${w - 20},${y - 6} ${w - 20},${y + 6}" fill="#000"/>`;
  if (lo != null) body += dot(lo, loInc);
  if (hi != null) body += dot(hi, hiInc);
  return wrap(w, h, body, false);
}

// Coordinate grid with optional straight lines y = mx + c, a curve f(x) and labelled points.
export function grid({ xmin = -5, xmax = 5, ymin = -5, ymax = 5, lines = [], curve = null, points = [], w = 320, h = 320 }) {
  const X = (v) => 24 + ((v - xmin) / (xmax - xmin)) * (w - 48);
  const Y = (v) => h - 24 - ((v - ymin) / (ymax - ymin)) * (h - 48);
  let body = '';
  for (let v = Math.ceil(xmin); v <= xmax; v++) body += `<line x1="${X(v)}" y1="${Y(ymin)}" x2="${X(v)}" y2="${Y(ymax)}" stroke="#ccc" stroke-width="1"/>`;
  for (let v = Math.ceil(ymin); v <= ymax; v++) body += `<line x1="${X(xmin)}" y1="${Y(v)}" x2="${X(xmax)}" y2="${Y(v)}" stroke="#ccc" stroke-width="1"/>`;
  body += `<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}" stroke="#000" stroke-width="1.5"/><line x1="${X(0)}" y1="${Y(ymin)}" x2="${X(0)}" y2="${Y(ymax)}" stroke="#000" stroke-width="1.5"/>`;
  body += t(X(xmax) - 4, Y(0) - 6, 'x', 'font-style="italic"') + t(X(0) + 6, Y(ymax) + 12, 'y', 'font-style="italic"');
  const step = Math.max(1, Math.round((xmax - xmin) / 10));
  for (let v = Math.ceil(xmin); v <= xmax; v += step) if (v) body += t(X(v), Y(0) + 15, v, 'font-size="11" text-anchor="middle"');
  for (let v = Math.ceil(ymin); v <= ymax; v += step) if (v) body += t(X(0) - 6, Y(v) + 4, v, 'font-size="11" text-anchor="end"');
  body += `<clipPath id="g"><rect x="${X(xmin)}" y="${Y(ymax)}" width="${X(xmax) - X(xmin)}" height="${Y(ymin) - Y(ymax)}"/></clipPath><g clip-path="url(#g)">`;
  for (const l of lines) body += `<line x1="${X(xmin)}" y1="${Y(l.m * xmin + l.c)}" x2="${X(xmax)}" y2="${Y(l.m * xmax + l.c)}" stroke="#000" stroke-width="2"/>`;
  if (curve) {
    let d = '';
    for (let i = 0; i <= 200; i++) {
      const xv = xmin + ((xmax - xmin) * i) / 200;
      const yv = curve(xv);
      if (!Number.isFinite(yv)) continue;
      d += `${d ? 'L' : 'M'}${X(xv).toFixed(1)} ${Y(Math.max(ymin - 50, Math.min(ymax + 50, yv))).toFixed(1)} `;
    }
    body += `<path d="${d}" fill="none" stroke="#000" stroke-width="2"/>`;
  }
  body += '</g>';
  for (const p of points) body += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" fill="#000"/>` + (p.label ? t(X(p.x) + 6, Y(p.y) - 6, p.label, 'font-size="13"') : '');
  return wrap(w, h, body, false);
}

// Two-stage tree diagram. first: [{label, p}], second: [[{label, p}], [{label, p}]]
export function tree({ first, second, h = 230 }) {
  // Leave room for the labels so the second set of branches starts after them.
  const em = 8.2;
  const l1 = Math.max(...first.map((b) => String(b.label).length));
  const l2 = Math.max(...second.flat().map((k) => String(k.label).length));
  const x0 = 20; const x1 = 125; const xs = x1 + 14 + l1 * em; const x2 = xs + 105;
  const w = Math.max(300, Math.ceil(x2 + 14 + l2 * em));
  const y0 = h / 2;
  const ys1 = first.map((_, i) => (h / (first.length * 2)) * (2 * i + 1));
  let body = '';
  first.forEach((b, i) => {
    body += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${ys1[i]}" stroke="#000" stroke-width="1.6"/>`;
    body += t((x0 + x1) / 2 - 10, (y0 + ys1[i]) / 2 - 6, b.p, 'font-size="14"') + t(x1 + 6, ys1[i] + 5, b.label, 'font-size="14"');
    const kids = second[i];
    const span = h / first.length;
    kids.forEach((k, j) => {
      const y = ys1[i] - span / 2 + (span / (kids.length * 2)) * (2 * j + 1);
      body += `<line x1="${xs}" y1="${ys1[i]}" x2="${x2}" y2="${y}" stroke="#000" stroke-width="1.6"/>`;
      body += t((xs + x2) / 2 - 10, (ys1[i] + y) / 2 - 6, k.p, 'font-size="14"') + t(x2 + 6, y + 5, k.label, 'font-size="14"');
    });
  });
  return wrap(w, h, body, false);
}

// Venn diagram for two sets with counts or labels in each region.
export function venn({ a = 'A', b = 'B', onlyA = '', both = '', onlyB = '', neither = '', w = 320, h = 200 }) {
  let body = `<rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="#000" stroke-width="1.6"/>`;
  body += t(14, 26, 'ξ', 'font-size="16"');
  body += `<circle cx="${w / 2 - 45}" cy="${h / 2}" r="68" fill="none" stroke="#000" stroke-width="1.8"/><circle cx="${w / 2 + 45}" cy="${h / 2}" r="68" fill="none" stroke="#000" stroke-width="1.8"/>`;
  body += t(w / 2 - 110, 40, a, 'font-size="16"') + t(w / 2 + 100, 40, b, 'font-size="16"');
  body += t(w / 2 - 75, h / 2 + 5, onlyA, 'text-anchor="middle"') + t(w / 2, h / 2 + 5, both, 'text-anchor="middle"') + t(w / 2 + 75, h / 2 + 5, onlyB, 'text-anchor="middle"');
  body += t(w - 30, h - 18, neither, 'text-anchor="end"');
  return wrap(w, h, body, false);
}

// Histogram: classes [[lo, hi]], heights = frequency density.
export function histogram({ classes, fd, xlabel = '', ylabel = 'Frequency density', w = 340, h = 240 }) {
  const lo = classes[0][0]; const hi = classes[classes.length - 1][1];
  const maxFd = Math.max(...fd) * 1.15;
  const X = (v) => 50 + ((v - lo) / (hi - lo)) * (w - 70);
  const Y = (v) => h - 40 - (v / maxFd) * (h - 70);
  let body = `<line x1="50" y1="${Y(0)}" x2="${w - 15}" y2="${Y(0)}" stroke="#000" stroke-width="1.5"/><line x1="50" y1="${Y(0)}" x2="50" y2="20" stroke="#000" stroke-width="1.5"/>`;
  classes.forEach(([a, b], i) => {
    body += `<rect x="${X(a)}" y="${Y(fd[i])}" width="${X(b) - X(a)}" height="${Y(0) - Y(fd[i])}" fill="#e9eef6" stroke="#000" stroke-width="1.5"/>`;
  });
  const ticks = [...new Set(classes.flat())];
  ticks.forEach((v) => { body += t(X(v), Y(0) + 16, v, 'font-size="11" text-anchor="middle"'); });
  const step = maxFd > 8 ? 2 : maxFd > 3 ? 1 : 0.5;
  for (let v = 0; v <= maxFd; v += step) body += `<line x1="46" y1="${Y(v)}" x2="50" y2="${Y(v)}" stroke="#000"/>` + t(42, Y(v) + 4, v, 'font-size="11" text-anchor="end"');
  body += t(w / 2, h - 6, xlabel, 'font-size="12" text-anchor="middle"');
  body += `<text x="14" y="${h / 2}" ${FONT} font-size="12" transform="rotate(-90 14 ${h / 2})" text-anchor="middle">${esc(ylabel)}</text>`;
  return wrap(w, h, body, false);
}

export function boxPlot({ min, q1, med, q3, max, lo, hi, step = 5, label = '', w = 340, h = 110 }) {
  const X = (v) => 20 + ((v - lo) / (hi - lo)) * (w - 40);
  const y = 40;
  let body = `<line x1="${X(min)}" y1="${y}" x2="${X(q1)}" y2="${y}" stroke="#000" stroke-width="1.6"/><line x1="${X(q3)}" y1="${y}" x2="${X(max)}" y2="${y}" stroke="#000" stroke-width="1.6"/>`;
  body += `<rect x="${X(q1)}" y="${y - 16}" width="${X(q3) - X(q1)}" height="32" fill="none" stroke="#000" stroke-width="1.8"/>`;
  for (const v of [min, med, max]) body += `<line x1="${X(v)}" y1="${y - 16}" x2="${X(v)}" y2="${y + 16}" stroke="#000" stroke-width="1.8"/>`;
  body += `<line x1="${X(lo)}" y1="80" x2="${X(hi)}" y2="80" stroke="#000" stroke-width="1.2"/>`;
  for (let v = lo; v <= hi; v += step) body += `<line x1="${X(v)}" y1="76" x2="${X(v)}" y2="84" stroke="#000"/>` + t(X(v), 98, v, 'font-size="11" text-anchor="middle"');
  if (label) body += t(w - 10, 16, label, 'font-size="12" text-anchor="end"');
  return wrap(w, h, body, false);
}

// Simple 3D sketches: cylinder, cone, sphere/hemisphere.
export function solid({ kind, rLabel = '', hLabel = '', w = 260, h = 220 }) {
  let body = '';
  const cx = w / 2;
  if (kind === 'cylinder') {
    body += `<ellipse cx="${cx}" cy="50" rx="70" ry="18" fill="none" stroke="#000" stroke-width="2"/><path d="M ${cx - 70} 50 V 170 A 70 18 0 0 0 ${cx + 70} 170 V 50" fill="none" stroke="#000" stroke-width="2"/>`;
    body += `<line x1="${cx}" y1="50" x2="${cx + 70}" y2="50" stroke="#000" stroke-dasharray="4 3"/>` + t(cx + 22, 44, rLabel) + t(cx + 80, 115, hLabel);
  } else if (kind === 'cone') {
    body += `<path d="M ${cx - 75} 170 L ${cx} 30 L ${cx + 75} 170" fill="none" stroke="#000" stroke-width="2"/><ellipse cx="${cx}" cy="170" rx="75" ry="18" fill="none" stroke="#000" stroke-width="2"/>`;
    body += `<line x1="${cx}" y1="30" x2="${cx}" y2="170" stroke="#000" stroke-dasharray="4 3"/><line x1="${cx}" y1="170" x2="${cx + 75}" y2="170" stroke="#000" stroke-dasharray="4 3"/>`;
    body += t(cx + 26, 190, rLabel) + t(cx + 6, 110, hLabel);
  } else if (kind === 'sphere' || kind === 'hemisphere') {
    if (kind === 'sphere') body += `<circle cx="${cx}" cy="110" r="80" fill="none" stroke="#000" stroke-width="2"/>`;
    else body += `<path d="M ${cx - 80} 140 A 80 80 0 0 1 ${cx + 80} 140" fill="none" stroke="#000" stroke-width="2"/>`;
    body += `<ellipse cx="${cx}" cy="${kind === 'sphere' ? 110 : 140}" rx="80" ry="18" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="${kind === 'sphere' ? '4 3' : ''}"/>`;
    body += `<line x1="${cx}" y1="${kind === 'sphere' ? 110 : 140}" x2="${cx + 80}" y2="${kind === 'sphere' ? 110 : 140}" stroke="#000" stroke-dasharray="4 3"/>` + t(cx + 28, (kind === 'sphere' ? 110 : 140) - 6, rLabel);
  }
  return wrap(w, h, body, true);
}
