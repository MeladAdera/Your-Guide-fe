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
export function LocaleSwitch({ className, block, labelledBy }: { className?: string; block?: boolean; labelledBy?: string }) {
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
