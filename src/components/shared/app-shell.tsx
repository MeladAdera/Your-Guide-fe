"use client";

import { BarChart3, Home, LifeBuoy, Settings, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", key: "home", icon: Home },
  { href: "/goals", key: "goals", icon: Target },
  { href: "/progress", key: "progress", icon: BarChart3 },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

/**
 * The frame around every signed-in screen, built from the sign-in screen
 * (docs/DESIGN.md): the sage ground, a row above the card with the logo, the
 * four sections and the I'm struggling button, the work in one large rounded
 * card. On Home the card keeps a mint tile at its end side (`homeTile`, the
 * week's rhythm, passed in by the layout so shared code stays free of
 * features); every other screen gets the whole card.
 *
 * Phones drop the card: the logo row on top, the sections in a floating bar at
 * the bottom, and I'm struggling as a round ink button just above it.
 */
export function AppShell({ children, homeTile }: { children: ReactNode; homeTile?: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const withTile = homeTile != null && isActive("/home");
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:bg-muted">
      <header className="flex h-17 items-center gap-8 px-5 lg:h-auto lg:px-10 lg:py-5">
        <Link href="/home" className="rounded-md">
          <BrandMark name={t("app.name")} />
        </Link>
        <nav aria-label={t("nav.label")} className="hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[15px] text-muted-foreground transition-colors hover:text-foreground",
                isActive(href) && "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
        <Button asChild variant="ink" className="ms-auto hidden h-10 rounded-full px-5 text-[15px] lg:inline-flex">
          <Link href="/struggling">
            <LifeBuoy aria-hidden />
            {t("nav.struggling")}
          </Link>
        </Button>
      </header>

      <div
        className={cn(
          "flex-1 lg:mx-8 lg:mb-2 lg:rounded-[28px] lg:bg-background lg:shadow-[0_30px_80px_-30px_rgb(15_61_53/0.35)]",
          withTile && "lg:grid lg:grid-cols-[minmax(0,1fr)_32%]",
        )}
      >
        <main id="content" className="min-w-0 px-5 pt-2 pb-32 lg:px-16 lg:py-14">
          {children}
        </main>
        {withTile && (
          <aside className="hidden p-3 lg:block">
            {homeTile}
          </aside>
        )}
      </div>

      <footer className="hidden px-10 py-4 text-sm text-muted-foreground lg:block">
        © {year} {t("app.name")}
      </footer>

      {/* Phone: I'm struggling floats just above the section bar. */}
      <Button asChild variant="ink" className="fixed end-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg lg:hidden">
        <Link href="/struggling" aria-label={t("nav.struggling")}>
          <LifeBuoy className="size-6" aria-hidden />
        </Link>
      </Button>
      <nav
        aria-label={t("nav.label")}
        className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 rounded-full bg-background/95 shadow-[0_10px_40px_-12px_rgb(15_61_53/0.35)] ring-1 ring-border backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 rounded-full text-[11px] text-muted-foreground",
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
