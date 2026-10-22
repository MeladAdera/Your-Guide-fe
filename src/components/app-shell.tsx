"use client";

import { BarChart3, Home, Settings, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", key: "home", icon: Home },
  { href: "/goals", key: "goals", icon: Target },
  { href: "/progress", key: "progress", icon: BarChart3 },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

/**
 * The frame around every signed-in screen: brand, the four sections, and the
 * I'm struggling button, which is the one solid-ink element on the page.
 * On phones the sections move to a bottom bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href="/home" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden className="size-4 rounded-[5px] bg-primary" />
            {t("app.name")}
          </Link>
          <nav aria-label={t("nav.home")} className="hidden items-center gap-1 sm:flex">
            {NAV.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive(href) && "bg-accent font-medium text-accent-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(`nav.${key}`)}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Button asChild variant="ink" size="sm">
              <Link href="/struggling">{t("nav.struggling")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-8">
        {children}
      </main>

      <nav
        aria-label={t("nav.home")}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground",
                  isActive(href) && "font-medium text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(`nav.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
