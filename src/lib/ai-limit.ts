import { STORAGE_PREFIX } from "@/lib/device-data";

/**
 * The model allows ten calls a day per person (advice and step suggestions
 * together), counted in the person's own day (docs/handoff.md §5). After an
 * `ai.daily_limit` the AI buttons rest until that day ends; the date is kept
 * on this device. The API stays the judge: this only spares a refused call.
 */
const KEY = `${STORAGE_PREFIX}ai-limit`;

/** The date (YYYY-MM-DD) it is now in a time zone. */
export function dayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function markAiLimitReached(timeZone: string, now?: Date) {
  try {
    localStorage.setItem(KEY, dayIn(timeZone, now));
  } catch {
    // Storage blocked: the API will refuse again, which says the same thing.
  }
}

export function isAiLimitReached(timeZone: string, now?: Date): boolean {
  try {
    return localStorage.getItem(KEY) === dayIn(timeZone, now);
  } catch {
    return false;
  }
}
