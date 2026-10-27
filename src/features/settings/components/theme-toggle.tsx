"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES = ["system", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];

const noop = () => () => {};
/** False during server rendering and hydration, true once the client owns the tree. */
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/** Three-state theme switch: OS preference by default, light or dark by choice. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common");
  // The theme is only known on the client; show "system" until mounted so the
  // server and client markup match.
  const mounted = useMounted();
  const current = (mounted ? (theme as Theme) : undefined) ?? "system";

  const labels: Record<Theme, string> = { system: t("themeSystem"), light: t("themeLight"), dark: t("themeDark") };
  const icons = { system: Monitor, light: Sun, dark: Moon };

  return (
    <div role="group" aria-label={t("theme")} className={cn("inline-flex rounded-lg border border-input bg-background p-0.5", className)}>
      {THEMES.map((value) => {
        const Icon = icons[value];
        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={current === value}
            aria-label={labels[value]}
            title={labels[value]}
            onClick={() => setTheme(value)}
            className={cn("h-8 w-9 rounded-md px-0", current === value && "bg-muted text-foreground")}
          >
            <Icon className="size-4" aria-hidden />
          </Button>
        );
      })}
    </div>
  );
}
