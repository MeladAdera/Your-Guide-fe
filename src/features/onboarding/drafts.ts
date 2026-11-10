import { STORAGE_PREFIX } from "@/lib/device-data";

/**
 * Unsaved answers, kept per screen on this device so a closed tab loses
 * nothing (docs/features/01-onboarding.md §6.1). Logging out removes them with
 * every other `yg:` key. Storage can be full or blocked; a draft is a
 * convenience, so every failure here is silent.
 */
export type Draft = Record<string, unknown>;

export const draftKey = (screen: string) => `${STORAGE_PREFIX}draft:${screen}`;

const isEmpty = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

export function readDraft(screen: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(screen));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Draft) : null;
  } catch {
    return null;
  }
}

/** Keep the screen's current answers; a screen with nothing written leaves no draft behind. */
export function writeDraft(screen: string, values: Draft) {
  try {
    if (Object.values(values).every(isEmpty)) localStorage.removeItem(draftKey(screen));
    else localStorage.setItem(draftKey(screen), JSON.stringify(values));
  } catch {
    // Full or blocked storage: carry on without a draft.
  }
}

export function clearDraft(screen: string) {
  try {
    localStorage.removeItem(draftKey(screen));
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

/**
 * The saved answers with the draft filled in only where the server has
 * nothing. A saved answer always wins: it is what the person last chose to keep.
 */
export function fillFromDraft(saved: Draft | null, draft: Draft | null): Draft | null {
  if (!draft) return saved;
  const out: Draft = { ...saved };
  for (const [key, value] of Object.entries(draft)) if (isEmpty(out[key]) && !isEmpty(value)) out[key] = value;
  return out;
}
