/**
 * Everything the app keeps in the browser uses this prefix (drafts of answers,
 * struggle follow-ups, preferences), so logging out can remove all of it.
 */
export const STORAGE_PREFIX = "yg:";

function clearStore(store: Storage | undefined) {
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
}

/** Remove every `yg:` key from local and session storage. Safe when storage is blocked. */
export function clearDeviceData() {
  if (typeof window === "undefined") return;
  try {
    clearStore(window.localStorage);
  } catch {
    // Storage can throw in private windows or when blocked; nothing to clear then.
  }
  try {
    clearStore(window.sessionStorage);
  } catch {
    // Same as above.
  }
}
