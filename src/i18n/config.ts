import { LOCALES, type Locale } from "@/lib/api/types";

export { LOCALES, type Locale };

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that remembers the language for the request. Set client-side; follows the account after login. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function directionOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Pick the language the browser prefers, used only before an account exists. */
export function detectBrowserLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const first = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : DEFAULT_LOCALE;
}
