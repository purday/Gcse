// Passcode lock. The Past Paper Library files are AES-GCM encrypted with a key
// derived from the passcode (PBKDF2-SHA-256), so the passcode is a real lock on
// the papers, not only a screen. Once unlocked, the non-extractable CryptoKey
// is kept in IndexedDB so he does not have to type it every day.

import { kvGet, kvSet } from './db.js';

let key = null;
let index = null;

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function normalise(passcode) {
  return passcode.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function libraryIndex() {
  if (index) return index;
  const res = await fetch('library/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('The paper library index is missing from this site.');
  index = await res.json();
  return index;
}

async function derive(passcode, c) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalise(passcode)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: c.hash || 'SHA-256', salt: b64(c.salt), iterations: c.iterations },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}

export async function decryptBytes(buf, k = key) {
  const bytes = new Uint8Array(buf);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, k, bytes.slice(12));
}

async function checkKey(k) {
  const idx = await libraryIndex();
  try {
    const plain = await decryptBytes(b64(idx.crypto.check), k);
    return new TextDecoder().decode(plain) === 'gcse-ok';
  } catch {
    return false;
  }
}

export async function tryUnlock(passcode) {
  const idx = await libraryIndex();
  const k = await derive(passcode, idx.crypto);
  if (!(await checkKey(k))) return false;
  key = k;
  try {
    await kvSet('libkey', k);
  } catch {
    // Some browsers cannot store CryptoKeys; he will just be asked again next launch.
  }
  return true;
}

export async function restore() {
  if (key) return true;
  let k = null;
  try {
    k = await kvGet('libkey');
  } catch {
    return false;
  }
  if (!k) return false;
  try {
    if (!(await checkKey(k))) return false;
  } catch {
    // Library index unreachable (offline, not cached yet): trust the key stored at unlock.
  }
  key = k;
  return true;
}

export async function lock() {
  key = null;
  await kvSet('libkey', null);
}

export function hasKey() {
  return !!key;
}
