/**
 * Weekday names for the API's `YYYY-MM-DD` strings. The string is already the
 * user's day; reading it as midnight UTC and formatting in UTC names that same
 * day without the browser's timezone shifting it (docs/handoff.md §13).
 */
export function weekdayName(date: string, locale: string, style: "narrow" | "long"): string {
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
