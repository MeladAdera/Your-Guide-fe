import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { UnauthorizedListener } from "@/features/auth/components/unauthorized-listener";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { directionOf, type Locale } from "@/i18n/config";
import { QueryProvider } from "@/components/shared/query-provider";
import "./globals.css";

// Figtree for Latin (the rounded geometric sans of the sign-in reference), IBM
// Plex Sans Arabic for Arabic, Plex Mono for small labels and numbers.
// Self-hosted from src/app/fonts (OFL, from github.com/google/fonts), cut to the
// same subsets we used from Google: Figtree latin + latin-ext (variable, 400-700),
// Plex Arabic arabic + latin, Plex Mono latin. Fetching from Google at build time
// broke Turbopack whenever Google answered with its `l/font?kit=` URL style.
const figtree = localFont({
  src: "./fonts/Figtree-Variable.woff2",
  weight: "400 700",
  variable: "--font-figtree",
  display: "swap",
});
const plexArabic = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Regular.woff2", weight: "400" },
    { path: "./fonts/IBMPlexSansArabic-Medium.woff2", weight: "500" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1613" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = (await getLocale()) as Locale;
  const dir = directionOf(locale);
  const t = await getTranslations("common");
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html> before React hydrates.
    <html lang={locale} dir={dir} suppressHydrationWarning className={`${figtree.variable} ${plexArabic.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider>
            <DirectionProvider dir={dir}>
              <QueryProvider>
                <a
                  href="#content"
                  className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-ink-foreground"
                >
                  {t("skipToContent")}
                </a>
                <UnauthorizedListener />
                {children}
                <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} dir={dir} />
              </QueryProvider>
            </DirectionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
