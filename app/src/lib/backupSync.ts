import { readBackup, writeBackup } from "./idbBackup";

const MIRROR_DEBOUNCE_MS = 1500;

/** The slice of a zustand `persist`-wrapped store's API this module needs — matches
 * `useResumeStore`/`useApplicationsStore`, both created with `create(persist(...))`. */
interface PersistentStore {
  subscribe: (listener: () => void) => () => void;
  persist: {
    rehydrate: () => Promise<void> | void;
  };
}

/** Wires a zustand `persist` (localStorage) store to a redundant IndexedDB backup:
 * - On boot, if `storageKey` is missing from localStorage (cleared, corrupted, blocked) but a
 *   backup exists in IndexedDB, restores it into localStorage and re-hydrates the store.
 * - On every state change, mirrors the store's current localStorage value into IndexedDB,
 *   debounced so rapid edits (e.g. typing) don't write on every keystroke.
 *
 * Returns a cleanup function (unsubscribe + cancel pending debounce). No-op outside the
 * browser (SSR) or before localStorage has ever been written by this store.
 */
export function setupStorageBackup(
  store: PersistentStore,
  storageKey: string,
  onRestored: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  let cancelled = false;

  (async () => {
    const existing = localStorage.getItem(storageKey);

    if (!existing) {
      const backup = await readBackup(storageKey);
      if (backup && !cancelled) {
        try {
          JSON.parse(backup);
          localStorage.setItem(storageKey, backup);
          await store.persist.rehydrate();
          if (!cancelled) onRestored();
        } catch {
          // corrupted backup, don't restore garbage
        }
      }
      return;
    }

    // localStorage already has data — mirror it right away instead of waiting for the next
    // edit, so a fresh backup exists even for a session that never changes anything.
    if (!cancelled) writeBackup(storageKey, existing);
  })();

  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = store.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      // zustand's own persist listener (registered when the store was created, before this
      // one) has already written the change to localStorage by the time this fires — mirror
      // that value rather than re-serializing the state ourselves.
      const current = localStorage.getItem(storageKey);
      if (current) writeBackup(storageKey, current);
    }, MIRROR_DEBOUNCE_MS);
  });

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
