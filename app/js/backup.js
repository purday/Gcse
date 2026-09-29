// Full device backup: progress, every pack, sitting, photo and feedback.

import * as db from './db.js';
import { todayISO, nowISO } from './util.js';
import { replaceProgress, getProgress } from './progress.js';

const blobKeys = (obj) => Object.entries(obj || {});

export async function exportBackup() {
  const zip = new window.JSZip();
  const [packs, attempts, photos, feedback] = await Promise.all([db.all('packs'), db.all('attempts'), db.all('photos'), db.all('feedback')]);
  const settings = { boundarySeries: await db.kvGet('boundarySeries'), tutorSyncedAt: await db.kvGet('tutorSyncedAt') };

  for (const p of packs) {
    const dir = `packs/${p.packId}/`;
    const { images, raw, ...meta } = p;
    zip.file(`${dir}record.json`, JSON.stringify(meta));
    for (const [k, b] of blobKeys(raw)) if (b) zip.file(`${dir}raw/${k}.json`, b);
    for (const [name, b] of blobKeys(images)) zip.file(`${dir}images/${name}`, b);
  }
  for (const f of feedback) {
    const dir = `feedback/${f.packId}/`;
    const { images, nextBlob, ...meta } = f;
    zip.file(`${dir}record.json`, JSON.stringify(meta));
    for (const [name, b] of blobKeys(images)) zip.file(`${dir}images/${name}`, b);
    if (nextBlob) zip.file(`${dir}next.zip`, nextBlob);
  }
  zip.file('attempts.json', JSON.stringify(attempts.map(({ results, ...a }) => a)));
  zip.file('photos.json', JSON.stringify(photos.map(({ blob, ...p }) => p)));
  for (const ph of photos) zip.file(`photos/${ph.id}.jpg`, ph.blob);
  zip.file('progress.json', JSON.stringify(await getProgress(), null, 2));
  zip.file('backup.json', JSON.stringify({ kind: 'gcse-backup', formatVersion: 1, exportedAt: nowISO(), settings }));
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  return { blob, name: `gcse-backup-${todayISO()}.zip` };
}

export async function isBackup(zip) {
  const f = zip.file('backup.json');
  if (!f) return false;
  try {
    return JSON.parse(await f.async('string')).kind === 'gcse-backup';
  } catch {
    return false;
  }
}

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };
const mime = (n) => MIME[n.split('.').pop().toLowerCase()] || 'application/octet-stream';

async function collect(zip, dir) {
  const out = {};
  for (const path of Object.keys(zip.files)) {
    if (!path.startsWith(dir) || zip.files[path].dir) continue;
    const name = path.slice(dir.length);
    out[name] = new Blob([await zip.file(path).async('uint8array')], { type: mime(name) });
  }
  return out;
}

export async function restoreBackup(zip) {
  const meta = JSON.parse(await zip.file('backup.json').async('string'));
  const libkey = await db.kvGet('libkey');
  await db.wipeAll();
  if (libkey) await db.kvSet('libkey', libkey);
  const packDirs = new Set(Object.keys(zip.files).filter((p) => /^packs\/[^/]+\/record\.json$/.test(p)).map((p) => p.split('/')[1]));
  for (const id of packDirs) {
    const rec = JSON.parse(await zip.file(`packs/${id}/record.json`).async('string'));
    const rawBlobs = await collect(zip, `packs/${id}/raw/`);
    rec.raw = {};
    for (const [name, b] of Object.entries(rawBlobs)) rec.raw[name.replace(/\.json$/, '')] = new Blob([b], { type: 'application/json' });
    rec.images = await collect(zip, `packs/${id}/images/`);
    await db.put('packs', rec);
  }
  const fbDirs = new Set(Object.keys(zip.files).filter((p) => /^feedback\/[^/]+\/record\.json$/.test(p)).map((p) => p.split('/')[1]));
  for (const id of fbDirs) {
    const rec = JSON.parse(await zip.file(`feedback/${id}/record.json`).async('string'));
    rec.images = await collect(zip, `feedback/${id}/images/`);
    const next = zip.file(`feedback/${id}/next.zip`);
    rec.nextBlob = next ? new Blob([await next.async('uint8array')], { type: 'application/zip' }) : null;
    await db.put('feedback', rec);
  }
  for (const a of JSON.parse(await zip.file('attempts.json').async('string'))) await db.put('attempts', a);
  for (const p of JSON.parse(await zip.file('photos.json').async('string'))) {
    const f = zip.file(`photos/${p.id}.jpg`);
    if (f) await db.put('photos', { ...p, blob: new Blob([await f.async('uint8array')], { type: 'image/jpeg' }) });
  }
  await replaceProgress(JSON.parse(await zip.file('progress.json').async('string')));
  if (meta.settings?.boundarySeries) await db.kvSet('boundarySeries', meta.settings.boundarySeries);
  if (meta.settings?.tutorSyncedAt) await db.kvSet('tutorSyncedAt', meta.settings.tutorSyncedAt);
}
