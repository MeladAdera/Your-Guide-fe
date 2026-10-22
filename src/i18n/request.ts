import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, detectBrowserLocale, isLocale } from "./config";

/**
 * No language in the URL. The locale comes from the NEXT_LOCALE cookie, which the
 * app sets from the account after login and from the switch at any time. Before a
 * cookie exists, the browser's Accept-Language decides between English and Arabic.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  let locale = isLocale(fromCookie) ? fromCookie : undefined;
  if (!locale) {
    const h = await headers();
    locale = detectBrowserLocale(h.get("accept-language")) ?? DEFAULT_LOCALE;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
