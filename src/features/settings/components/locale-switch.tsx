"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useOptionalUser } from "@/components/shared/user-provider";
import { Button } from "@/components/ui/button";
import { setLocaleCookie } from "@/i18n/locale-cookie";
import { authApi } from "@/features/auth/api";
import { errorMessageKey } from "@/lib/api/errors";
import { LOCALES, type Locale } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "English", ar: "العربية" };

/**
 * The language switch. The new language shows at once (cookie + refresh); when
 * logged in, the account follows with PATCH /api/auth/me (docs/handoff.md §4).
 */
export function LocaleSwitch({
  className,
  block,
  compact,
  labelledBy,
}: {
  className?: string;
  block?: boolean;
  /** Two small text buttons, "EN / AR", for tight headers. */
  compact?: boolean;
  labelledBy?: string;
}) {
  const current = useLocale() as Locale;
  const router = useRouter();
  const user = useOptionalUser();
  const t = useTranslations();

  const follow = useMutation({
    mutationFn: authApi.updateLocale,
    onError: (e) => toast.error(t(errorMessageKey(e))),
  });

  function choose(locale: Locale) {
    if (locale === current) return;
    setLocaleCookie(locale);
    router.refresh();
    if (user) follow.mutate(locale);
  }

  if (compact) {
    return (
      <div role="group" aria-label={t("common.language")} className={cn("flex items-center text-sm text-muted-foreground", className)}>
        {LOCALES.map((locale, i) => (
          <span key={locale} className="flex items-center">
            {i > 0 ? <span aria-hidden className="px-1">/</span> : null}
            <button
              type="button"
              lang={locale}
              aria-label={LABELS[locale]}
              aria-pressed={locale === current}
              onClick={() => choose(locale)}
              className={cn("rounded px-1 py-2 uppercase hover:text-foreground", locale === current && "font-semibold text-foreground")}
            >
              {locale}
            </button>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={labelledBy ? undefined : t("common.language")}
      aria-labelledby={labelledBy}
      className={cn("rounded-lg border border-input bg-background p-0.5", block ? "grid w-full grid-cols-2" : "inline-flex", className)}
    >
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          type="button"
          variant="ghost"
          size="sm"
          lang={locale}
          aria-pressed={locale === current}
          onClick={() => choose(locale)}
          className={cn("rounded-md px-3", block ? "h-10" : "h-8", locale === current && "bg-muted text-foreground")}
        >
          {LABELS[locale]}
        </Button>
      ))}
    </div>
  );
}
