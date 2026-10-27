/**
 * Timezone helpers for registration. The API stores the timezone with the
 * account and cannot change it later (docs/handoff.md §4), so register shows it
 * and lets the person correct it once.
 */

/** "Asia/Dubai" → "Dubai", "America/Argentina/Buenos_Aires" → "Buenos Aires". */
export function timezoneCity(zone: string): string {
  const last = zone.split("/").pop() ?? zone;
  return last.replace(/_/g, " ");
}

/** The UTC offset as the locale writes it, e.g. "GMT+4"; empty when unknown. */
export function timezoneOffset(zone: string, locale: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** Every IANA zone the browser knows, always including `current`. */
export function listTimezones(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  } catch {
    zones = [];
  }
  const all = new Set([...zones, current, "UTC"]);
  return [...all].sort((a, b) => a.localeCompare(b));
}
