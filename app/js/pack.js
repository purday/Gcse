// Reading, validating and storing pack zips (see FORMAT.md).

import * as db from './db.js';
import { ID_RE, nowISO } from './util.js';
import { decryptBytes, libraryIndex } from './lock.js';

const TYPES = ['paper', 'lesson', 'feedback'];
const SOURCES = ['real', 'generated', 'mixed'];
const ANSWER_TYPES = ['short', 'working'];
const IMAGE_RE = /\.(png|jpe?g|webp|svg|gif)$/i;
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };

let topicCodes = null;
export async function topicData() {
  if (!topicCodes) {
    const res = await fetch('data/topics.json');
    const data = await res.json();
    topicCodes = { data, byCode: Object.fromEntries(data.topics.map((t) => [t.code, t])) };
  }
  return topicCodes;
}

function findPrefix(zip) {
  if (zip.file('manifest.json')) return '';
  const candidates = Object.keys(zip.files)
    .filter((p) => /^[^/]+\/manifest\.json$/.test(p) && !p.startsWith('__MACOSX'));
  return candidates.length === 1 ? candidates[0].replace('manifest.json', '') : null;
}

async function text(zip, path) {
  const f = zip.file(path);
  return f ? f.async('string') : null;
}

async function blob(zip, path, type = 'application/json') {
  const f = zip.file(path);
  if (!f) return null;
  return new Blob([await f.async('uint8array')], { type });
}

function parseJSON(src, name, errors) {
  if (src == null) return undefined;
  try {
    return JSON.parse(src.replace(/^﻿/, ''));
  } catch (e) {
    errors.push(`${name} is not valid JSON (${e.message}).`);
    return undefined;
  }
}

function validateManifest(m, errors, warnings) {
  if (!m || typeof m !== 'object') {
    errors.push('manifest.json is missing or not an object.');
    return;
  }
  if (m.formatVersion === undefined) warnings.push('manifest.json has no formatVersion; assuming 1.');
  else if (m.formatVersion !== 1) errors.push(`formatVersion ${m.formatVersion} is not supported (expected 1).`);
  if (typeof m.packId !== 'string' || !ID_RE.test(m.packId)) errors.push('packId is missing or has characters other than letters, digits, . _ -');
  if (!TYPES.includes(m.type)) errors.push(`type must be one of ${TYPES.join(', ')}.`);
  if (!SOURCES.includes(m.source)) errors.push(`source must be one of ${SOURCES.join(', ')}.`);
  if (!Number.isInteger(m.totalMarks) || m.totalMarks < 0) errors.push('totalMarks must be a whole number.');
  if (typeof m.title !== 'string' || !m.title.trim()) {
    warnings.push('The pack has no title.');
    m.title = m.packId || 'Untitled pack';
  }
  if (!('timeLimitMins' in m)) {
    warnings.push('timeLimitMins is missing; treating the pack as untimed.');
    m.timeLimitMins = null;
  } else if (m.timeLimitMins !== null && !(Number.isInteger(m.timeLimitMins) && m.timeLimitMins > 0)) {
    errors.push('timeLimitMins must be a positive whole number or null.');
  }
  if (typeof m.calculator !== 'boolean') {
    warnings.push('calculator is missing; assuming a calculator is allowed.');
    m.calculator = true;
  }
  if (!m.created) warnings.push('created is missing.');
  if (m.type === 'feedback' && typeof m.forPackId !== 'string') errors.push('Feedback packs need manifest.forPackId.');
}

function validateQuestions(qs, m, images, codes, errors, warnings) {
  if (!Array.isArray(qs) || !qs.length) {
    errors.push('questions.json must be a non-empty array.');
    return;
  }
  const seen = new Set();
  const unknownTopics = new Set();
  const missingImages = new Set();
  let sum = 0;
  qs.forEach((q, i) => {
    const where = `Question ${i + 1}`;
    if (!q || typeof q !== 'object') {
      errors.push(`${where} is not an object.`);
      return;
    }
    if (typeof q.id !== 'string' || !ID_RE.test(q.id)) errors.push(`${where}: id is missing or invalid.`);
    else if (seen.has(q.id)) errors.push(`${where}: id "${q.id}" is used twice.`);
    seen.add(q.id);
    if (typeof q.number === 'number') q.number = String(q.number);
    if (typeof q.number !== 'string') errors.push(`${where}: number is missing.`);
    if (q.part === undefined) q.part = null;
    if (q.part !== null) q.part = String(q.part);
    if (!Number.isInteger(q.marks) || q.marks < 0) errors.push(`${where}: marks must be a whole number.`);
    else sum += q.marks;
    if (!Array.isArray(q.topics) || !q.topics.length) {
      warnings.push(`${where}: no topics.`);
      q.topics = Array.isArray(q.topics) ? q.topics : [];
    }
    for (const t of q.topics) if (!codes[t]) unknownTopics.add(t);
    if (typeof q.prompt !== 'string') {
      if (q.image || q.libraryRef) q.prompt = '';
      else errors.push(`${where}: prompt is missing.`);
    }
    if (!ANSWER_TYPES.includes(q.answerType)) {
      warnings.push(`${where}: answerType should be "short" or "working"; using "working".`);
      q.answerType = 'working';
    }
    for (const img of [q.image, q.stemImage, q.workedExample?.image]) if (img && !images[img]) missingImages.add(img);
  });
  if (Number.isInteger(m?.totalMarks) && sum !== m.totalMarks) warnings.push(`totalMarks is ${m.totalMarks} but the questions add up to ${sum}.`);
  if (unknownTopics.size) warnings.push(`Unknown topic codes: ${[...unknownTopics].join(', ')}.`);
  if (missingImages.size) warnings.push(`Images not found in images/: ${[...missingImages].join(', ')}.`);
}

// Parse a pack zip (Blob/ArrayBuffer/JSZip). Returns everything needed to store it.
export async function parsePack(input) {
  const errors = [];
  const warnings = [];
  let zip;
  try {
    zip = input instanceof window.JSZip ? input : await window.JSZip.loadAsync(input);
  } catch {
    return { errors: ['This file is not a zip file the player can open.'], warnings };
  }
  const prefix = findPrefix(zip);
  if (prefix === null) return { errors: ['manifest.json was not found at the top of the zip.'], warnings };

  const manifestSrc = await text(zip, `${prefix}manifest.json`);
  const manifest = parseJSON(manifestSrc, 'manifest.json', errors);
  validateManifest(manifest, errors, warnings);
  if (errors.length) return { errors, warnings };

  const images = {};
  for (const path of Object.keys(zip.files)) {
    if (!path.startsWith(`${prefix}images/`) || zip.files[path].dir || !IMAGE_RE.test(path)) continue;
    const name = path.slice(`${prefix}images/`.length);
    const ext = name.split('.').pop().toLowerCase();
    images[name] = await blob(zip, path, MIME[ext] || 'application/octet-stream');
  }

  const { byCode } = await topicData();
  const questionsSrc = await text(zip, `${prefix}questions.json`);
  const questions = parseJSON(questionsSrc, 'questions.json', errors);
  const isSittable = manifest.type !== 'feedback';
  if (isSittable || questions !== undefined) validateQuestions(questions, manifest, images, byCode, errors, warnings);

  const markschemeSrc = await text(zip, `${prefix}markscheme.json`);
  if (isSittable) {
    if (markschemeSrc == null) errors.push('markscheme.json is missing.');
    else {
      // Check the wrapper shape only. The mark scheme itself is never decoded.
      let ms;
      try { ms = JSON.parse(markschemeSrc); } catch { ms = null; }
      if (!ms || ms.encoding !== 'base64' || typeof ms.data !== 'string') errors.push('markscheme.json must be {"encoding": "base64", "data": "..."}.');
    }
  }

  let feedback;
  if (manifest.type === 'feedback') {
    feedback = parseJSON(await text(zip, `${prefix}feedback.json`), 'feedback.json', errors);
    if (!feedback) errors.push('feedback.json is missing.');
    else {
      if (!Array.isArray(feedback.questions)) errors.push('feedback.json needs a questions array.');
      if (!Number.isFinite(feedback.score) || !Number.isFinite(feedback.maxScore)) errors.push('feedback.json needs score and maxScore.');
      if (feedback.forPackId && feedback.forPackId !== manifest.forPackId) warnings.push('feedback.forPackId does not match manifest.forPackId.');
      feedback.forPackId = manifest.forPackId;
    }
  }

  const progress = parseJSON(await text(zip, `${prefix}progress.json`), 'progress.json', warnings);
  if (progress !== undefined && (typeof progress !== 'object' || !progress.updatedAt)) warnings.push('progress.json has no updatedAt, so it was ignored.');

  let nextBlob = null;
  if (manifest.type === 'feedback' && zip.file(`${prefix}next/manifest.json`)) {
    const sub = new window.JSZip();
    const base = `${prefix}next/`;
    for (const path of Object.keys(zip.files)) {
      if (!path.startsWith(base) || zip.files[path].dir) continue;
      sub.file(path.slice(base.length), await zip.file(path).async('uint8array'));
    }
    nextBlob = await sub.generateAsync({ type: 'blob', mimeType: 'application/zip' });
    const check = await parsePack(nextBlob);
    if (check.errors.length) warnings.push(`The next lesson inside this feedback has problems: ${check.errors.join(' ')}`);
  }

  return {
    errors,
    warnings,
    manifest,
    questions: questions || [],
    feedback,
    progress: progress && progress.updatedAt ? progress : null,
    images,
    nextBlob,
    raw: {
      manifest: new Blob([manifestSrc], { type: 'application/json' }),
      questions: questionsSrc != null ? await blob(zip, `${prefix}questions.json`) : null,
      markscheme: markschemeSrc != null ? await blob(zip, `${prefix}markscheme.json`) : null,
    },
  };
}

export async function storePack(parsed, origin) {
  const rec = {
    packId: parsed.manifest.packId,
    manifest: parsed.manifest,
    questions: parsed.questions,
    images: parsed.images,
    raw: parsed.raw,
    warnings: parsed.warnings,
    origin,
    importedAt: nowISO(),
  };
  await db.put('packs', rec);
  return rec;
}

export async function storeFeedback(parsed) {
  const rec = {
    packId: parsed.manifest.packId,
    forPackId: parsed.manifest.forPackId,
    forAttemptId: parsed.manifest.forAttemptId || parsed.feedback.forAttemptId || null,
    manifest: parsed.manifest,
    feedback: parsed.feedback,
    images: parsed.images,
    nextBlob: parsed.nextBlob,
    nextPackId: null,
    importedAt: nowISO(),
  };
  await db.put('feedback', rec);
  return rec;
}

export const getPack = (packId) => db.get('packs', packId);

// ---- Past Paper Library -------------------------------------------------

export async function libraryPapers() {
  const idx = await libraryIndex();
  return idx.papers || [];
}

export async function loadLibraryPack(libraryId) {
  const existing = await db.get('packs', libraryId);
  if (existing) return existing;
  const papers = await libraryPapers();
  const entry = papers.find((p) => p.libraryId === libraryId);
  if (!entry) throw new Error(`Paper ${libraryId} is not in the library.`);
  const res = await fetch(`library/${entry.file}`);
  if (!res.ok) throw new Error('Could not download that paper. Check your connection and try again.');
  const zipBytes = await decryptBytes(await res.arrayBuffer());
  const parsed = await parsePack(zipBytes);
  if (parsed.errors.length) throw new Error(`Library paper is damaged: ${parsed.errors.join(' ')}`);
  return storePack(parsed, 'library');
}

// Resolve "libraryId:questionId" to the original cropped images.
export async function resolveLibraryRef(ref) {
  const [libId, qid] = String(ref).split(':');
  try {
    const pack = await loadLibraryPack(libId);
    const q = pack.questions.find((x) => x.id === qid);
    if (!q) return null;
    return { question: q, image: q.image ? pack.images[q.image] : null, stemImage: q.stemImage ? pack.images[q.stemImage] : null };
  } catch {
    return null;
  }
}

// Object URLs for pack images, reused while the app is open.
const urlCache = new Map();
export function imageURL(blobObj) {
  if (!blobObj) return null;
  if (!urlCache.has(blobObj)) urlCache.set(blobObj, URL.createObjectURL(blobObj));
  return urlCache.get(blobObj);
}
