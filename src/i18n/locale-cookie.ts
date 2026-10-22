import { LOCALE_COOKIE, type Locale } from "./config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Client-side: remember the language for the next request. */
export function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}
