/** Minimal native IndexedDB key-value store, used as a redundant backup for the zustand
 * `persist` stores (which live in localStorage). No dependency — the API surface we need
 * (get/put one string per key) doesn't justify pulling in a library like `idb`. */

const DB_NAME = "resume-template-backup";
const DB_VERSION = 1;
const STORE_NAME = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Best-effort — IndexedDB can be unavailable (private browsing in some browsers, storage
 * quota, disabled by policy). Since it's only a backup of data that already lives in
 * localStorage, a failure here is silently swallowed rather than surfaced to the user. */
export async function writeBackup(key: string, value: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // best-effort, see doc comment above
  }
}

export async function readBackup(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    const value = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}
