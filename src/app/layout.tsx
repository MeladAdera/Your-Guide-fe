import type { Metadata, Viewport } from "next";
import { Figtree, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
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
const figtree = Figtree({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-figtree", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600"], variable: "--font-plex-arabic", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

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
