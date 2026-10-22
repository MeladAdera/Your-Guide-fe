"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useOptionalUser } from "@/components/user-provider";
import { Button } from "@/components/ui/button";
import { setLocaleCookie } from "@/i18n/locale-cookie";
import { authApi } from "@/lib/api/auth";
import { errorMessageKey } from "@/lib/api/errors";
import { LOCALES, type Locale } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "English", ar: "العربية" };

/**
 * The language switch. The new language shows at once (cookie + refresh); when
 * logged in, the account follows with PATCH /api/auth/me (docs/handoff.md §4).
 */
export function LocaleSwitch({ className }: { className?: string }) {
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
    <div role="group" aria-label={t("common.language")} className={cn("inline-flex rounded-lg border border-input bg-background p-0.5", className)}>
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          type="button"
          variant="ghost"
          size="sm"
          lang={locale}
          aria-pressed={locale === current}
          onClick={() => choose(locale)}
          className={cn("h-8 rounded-md px-3", locale === current && "bg-muted text-foreground")}
        >
          {LABELS[locale]}
        </Button>
      ))}
    </div>
  );
}
