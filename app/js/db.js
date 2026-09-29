// IndexedDB storage. Everything the player knows lives here:
//   kv        settings, progress, the library key
//   packs     imported packs (parsed JSON + raw file bytes + images)
//   attempts  sittings in progress and finished
//   photos    compressed working photos
//   feedback  imported feedback packs

const DB_NAME = 'gcse-player';
const VERSION = 1;
let dbp;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('kv');
      db.createObjectStore('packs', { keyPath: 'packId' });
      const at = db.createObjectStore('attempts', { keyPath: 'id' });
      at.createIndex('packId', 'packId');
      const ph = db.createObjectStore('photos', { keyPath: 'id' });
      ph.createIndex('attemptId', 'attemptId');
      const fb = db.createObjectStore('feedback', { keyPath: 'packId' });
      fb.createIndex('forPackId', 'forPackId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    Promise.resolve(fn(s)).then((r) => (out = r));
    t.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Storage transaction aborted'));
  }));
}

export const get = (store, key) => tx(store, 'readonly', (s) => s.get(key));
export const put = (store, value, key) => tx(store, 'readwrite', (s) => (key === undefined ? s.put(value) : s.put(value, key)));
export const del = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));
export const all = (store) => tx(store, 'readonly', (s) => s.getAll());
export const clear = (store) => tx(store, 'readwrite', (s) => s.clear());
export const byIndex = (store, index, value) => tx(store, 'readonly', (s) => s.index(index).getAll(value));

export const kvGet = (key) => get('kv', key);
export const kvSet = (key, value) => put('kv', value, key);

export async function wipeAll() {
  for (const s of ['kv', 'packs', 'attempts', 'photos', 'feedback']) await clear(s);
}
